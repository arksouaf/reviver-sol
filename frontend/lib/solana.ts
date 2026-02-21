import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  type TransactionInstruction,
  type ParsedAccountData,
  type AccountInfo,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createCloseAccountInstruction,
  createBurnInstruction,
} from "@solana/spl-token";

// ──────────────────────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────────────────────

const RPC_URL =
  (typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_RPC_URL
    : undefined) || 'https://api.mainnet-beta.solana.com';
const BATCH_SIZE = 20;
const BATCH_SIZE_NON_EMPTY = 10; // burn + close = 2 ix per account
const DEV_FEE_PER_ACCOUNT_LAMPORTS = 100_000; // 0.0001 SOL
const RENT_PER_ACCOUNT_LAMPORTS = 2_039_280; // ~0.00203928 SOL

const DEV_FEE_WALLET = new PublicKey(
  "JCuzn3GhgxCZonp6fSeAS1fy16BrPw6wYcYAtiPKja7r"
);

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface EmptyTokenAccount {
  pubkey: PublicKey;
  mint: PublicKey;
  programId: PublicKey;
  isFrozen: boolean;
  /** Token-2022 account has withheld transfer fees that prevent closing. */
  hasWithheldFees: boolean;
  /** Raw token amount as string (e.g. "1000000"). "0" for empty accounts. */
  rawAmount: string;
  /** Human-readable token balance. 0 for empty accounts. */
  uiAmount: number;
  /** Token decimals */
  decimals: number;
}

export interface CloseAccountsBatch {
  transaction: Transaction;
  accounts: EmptyTokenAccount[];
}

export interface CloseAccountsResult {
  totalEmpty: number;
  totalNonEmpty: number;
  frozenCount: number;
  withheldFeesCount: number;
  closableCount: number;
  batches: CloseAccountsBatch[];
  /** Wallet SOL balance in lamports at time of scan. */
  walletBalanceLamports: number;
}

export interface BatchProgress {
  batchIndex: number;
  totalBatches: number;
  status: "signing" | "sending" | "confirming" | "confirmed" | "failed";
  signature?: string;
  error?: string;
  accountsClosed: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

export function createConnection(rpcUrl: string = RPC_URL): Connection {
  return new Connection(rpcUrl, "confirmed");
}

export function estimateReclaimableSOL(closableCount: number): number {
  return (closableCount * RENT_PER_ACCOUNT_LAMPORTS) / 1e9;
}

export function estimateDevFee(closableCount: number): number {
  return (closableCount * DEV_FEE_PER_ACCOUNT_LAMPORTS) / 1e9;
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Discovery
// ──────────────────────────────────────────────────────────────────────────────

export async function getTokenAccounts(
  connection: Connection,
  wallet: PublicKey,
  includeNonEmpty: boolean = false
): Promise<EmptyTokenAccount[]> {
  const [tokenAccounts, token2022Accounts] = await Promise.all([
    connection.getParsedTokenAccountsByOwner(wallet, {
      programId: TOKEN_PROGRAM_ID,
    }),
    connection.getParsedTokenAccountsByOwner(wallet, {
      programId: TOKEN_2022_PROGRAM_ID,
    }),
  ]);

  const allAccounts = [
    ...tokenAccounts.value.map((a) => ({ ...a, programId: TOKEN_PROGRAM_ID })),
    ...token2022Accounts.value.map((a) => ({
      ...a,
      programId: TOKEN_2022_PROGRAM_ID,
    })),
  ];

  const results: EmptyTokenAccount[] = [];

  for (const { pubkey, account, programId } of allAccounts) {
    const parsed = (account as AccountInfo<ParsedAccountData>).data.parsed;
    const info = parsed?.info;
    if (!info) continue;

    const rawAmount: string = info.tokenAmount?.amount ?? "0";
    const uiAmount: number = info.tokenAmount?.uiAmount ?? 0;
    const decimals: number = info.tokenAmount?.decimals ?? 0;
    const isZero = rawAmount === "0" || uiAmount === 0;

    if (!includeNonEmpty && !isZero) continue;

    const stateStr: string = info.state ?? "";
    const isFrozen = stateStr === "frozen";

    // Detect Token-2022 accounts with withheld transfer fees.
    // These cannot be closed until fees are harvested to the mint
    // (requires mint fee authority, which the user typically doesn't have).
    let hasWithheldFees = false;
    if (programId.equals(TOKEN_2022_PROGRAM_ID) && Array.isArray(info.extensions)) {
      for (const ext of info.extensions) {
        if (
          ext?.extension === "transferFeeAmount" &&
          ext?.state?.withheldAmount &&
          ext.state.withheldAmount !== "0"
        ) {
          hasWithheldFees = true;
          break;
        }
      }
    }

    results.push({
      pubkey,
      mint: new PublicKey(info.mint),
      programId,
      isFrozen,
      hasWithheldFees,
      rawAmount,
      uiAmount,
      decimals,
    });
  }

  return results;
}

// ──────────────────────────────────────────────────────────────────────────────
// Build Transactions
// ──────────────────────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Minimum SOL the wallet needs to cover the dev-fee transfer in the first
 * batch (close instructions return rent, but the runtime checks the fee-payer
 * balance *before* executing instructions).
 *
 * First batch: dev fee (BATCH_SIZE * 0.0001 SOL) + tx fee (~0.000005 SOL)
 */
export const MIN_SOL_REQUIRED_LAMPORTS =
  BATCH_SIZE * DEV_FEE_PER_ACCOUNT_LAMPORTS + 10_000; // ~0.00101 SOL

export async function buildCloseAccountsTxs(
  connection: Connection,
  wallet: PublicKey,
  options: {
    includeNonEmpty?: boolean;
    devFeeWallet?: PublicKey;
  } = {}
): Promise<CloseAccountsResult> {
  const { includeNonEmpty = false, devFeeWallet = DEV_FEE_WALLET } = options;

  // Fetch accounts and wallet balance in parallel
  const [allAccounts, walletBalanceLamports] = await Promise.all([
    getTokenAccounts(connection, wallet, includeNonEmpty),
    connection.getBalance(wallet, "confirmed"),
  ]);

  const frozen = allAccounts.filter((a) => a.isFrozen);
  const withheldFees = allAccounts.filter((a) => !a.isFrozen && a.hasWithheldFees);
  const closable = allAccounts.filter((a) => !a.isFrozen && !a.hasWithheldFees);
  const emptyCount = allAccounts.filter((a) => a.rawAmount === "0").length;
  const nonEmptyCount = allAccounts.length - emptyCount;

  if (closable.length === 0) {
    return {
      totalEmpty: emptyCount,
      totalNonEmpty: nonEmptyCount,
      frozenCount: frozen.length,
      withheldFeesCount: withheldFees.length,
      closableCount: 0,
      batches: [],
      walletBalanceLamports,
    };
  }

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  // Use smaller batch size when non-empty accounts need burn + close (2 ix each)
  const hasNonEmpty = closable.some((a) => a.rawAmount !== "0");
  const batchSize = hasNonEmpty ? BATCH_SIZE_NON_EMPTY : BATCH_SIZE;
  const accountBatches = chunk(closable, batchSize);
  const batches: CloseAccountsBatch[] = [];

  const canAffordDevFee = walletBalanceLamports >= MIN_SOL_REQUIRED_LAMPORTS;

  for (const batch of accountBatches) {
    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.feePayer = wallet;

    for (const acct of batch) {
      // If account has tokens, burn them first so the account can be closed
      if (acct.rawAmount !== "0") {
        const burnIx = createBurnInstruction(
          acct.pubkey,
          acct.mint,
          wallet,
          BigInt(acct.rawAmount),
          [],
          acct.programId
        );
        tx.add(burnIx);
      }

      const closeIx: TransactionInstruction = createCloseAccountInstruction(
        acct.pubkey,
        wallet,
        wallet,
        [],
        acct.programId
      );
      tx.add(closeIx);
    }

    if (canAffordDevFee) {
      const totalFeeLamports = DEV_FEE_PER_ACCOUNT_LAMPORTS * batch.length;
      const feeIx = SystemProgram.transfer({
        fromPubkey: wallet,
        toPubkey: devFeeWallet,
        lamports: totalFeeLamports,
      });
      tx.add(feeIx);
    }

    batches.push({ transaction: tx, accounts: batch });
  }

  return {
    totalEmpty: emptyCount,
    totalNonEmpty: nonEmptyCount,
    frozenCount: frozen.length,
    withheldFeesCount: withheldFees.length,
    closableCount: closable.length,
    batches,
    walletBalanceLamports,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Sign & Send with progress callback
// ──────────────────────────────────────────────────────────────────────────────

/**
 * How many batches to sign per wallet popup. Each round gets a fresh
 * blockhash so later rounds never expire. With ~3-5 s per batch to confirm,
 * 5 batches ≈ 15-25 s — well within a blockhash's ~60-90 s validity window.
 */
const SIGNING_ROUND_SIZE = 5;

/**
 * Process transactions in signing rounds. Each round:
 *  1. Fetches a fresh blockhash
 *  2. Stamps it on the round's transactions
 *  3. Signs them (one wallet popup per round via signAllTransactions)
 *  4. Sends & confirms each sequentially
 *
 * This avoids "Blockhash not found" errors for large account sets while
 * keeping the number of wallet popups low.
 */
export async function signAndSendBatches(
  connection: Connection,
  batches: CloseAccountsBatch[],
  signAllTransactions:
    | ((txs: Transaction[]) => Promise<Transaction[]>)
    | undefined,
  signTransaction:
    | ((tx: Transaction) => Promise<Transaction>)
    | undefined,
  onProgress?: (progress: BatchProgress) => void,
  startFromBatch: number = 0
): Promise<string[]> {
  const remaining = batches.slice(startFromBatch);
  const totalBatches = batches.length;
  const signatures: string[] = [];

  // Split remaining batches into signing rounds
  const rounds = chunk(remaining, SIGNING_ROUND_SIZE);
  let globalIdx = 0; // index within `remaining`

  for (const round of rounds) {
    // ── Fresh blockhash for this round ──────────────────────────────
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    for (const batch of round) {
      batch.transaction.recentBlockhash = blockhash;
      batch.transaction.lastValidBlockHeight = lastValidBlockHeight;
      // Clear any previous partial signatures so the wallet re-signs cleanly
      batch.transaction.signatures = [];
    }

    // ── Sign this round's transactions ─────────────────────────────
    const batchIdxStart = startFromBatch + globalIdx;
    onProgress?.({
      batchIndex: batchIdxStart,
      totalBatches,
      status: "signing",
      accountsClosed: round.reduce((s, b) => s + b.accounts.length, 0),
    });

    let signedTxs: Transaction[];

    if (signAllTransactions) {
      signedTxs = await signAllTransactions(
        round.map((b) => b.transaction)
      );
    } else if (signTransaction) {
      signedTxs = [];
      for (const batch of round) {
        signedTxs.push(await signTransaction(batch.transaction));
      }
    } else {
      throw new Error("Wallet does not support transaction signing.");
    }

    // ── Send & confirm each sequentially ───────────────────────────
    for (let idx = 0; idx < signedTxs.length; idx++) {
      const batchIdx = startFromBatch + globalIdx;
      const signed = signedTxs[idx];
      const { accounts } = round[idx];

      try {
        onProgress?.({
          batchIndex: batchIdx,
          totalBatches,
          status: "sending",
          accountsClosed: accounts.length,
        });

        const rawTx = signed.serialize();
        const sig = await connection.sendRawTransaction(rawTx, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        });

        onProgress?.({
          batchIndex: batchIdx,
          totalBatches,
          status: "confirming",
          signature: sig,
          accountsClosed: accounts.length,
        });

        await connection.confirmTransaction(
          {
            signature: sig,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed"
        );

        onProgress?.({
          batchIndex: batchIdx,
          totalBatches,
          status: "confirmed",
          signature: sig,
          accountsClosed: accounts.length,
        });

        signatures.push(sig);
      } catch (err: any) {
        let errorMsg = err?.message || "Unknown error";
        if (err?.logs) {
          console.error("Transaction logs:", err.logs);
        } else if (typeof err?.getLogs === "function") {
          try {
            const logs = await err.getLogs(connection);
            console.error("Transaction logs:", logs);
          } catch (_) {}
        }

        if (errorMsg.includes("no record of a prior credit")) {
          errorMsg =
            "Wallet does not have enough SOL to pay transaction fees. " +
            "Please add at least 0.002 SOL to your wallet and try again.";
        } else if (errorMsg.includes("Blockhash not found")) {
          errorMsg = "Transaction expired. Please scan again and retry.";
        }

        onProgress?.({
          batchIndex: batchIdx,
          totalBatches,
          status: "failed",
          error: errorMsg,
          accountsClosed: accounts.length,
        });
        throw new Error(errorMsg);
      }

      globalIdx++;
    }
  }

  return signatures;
}
