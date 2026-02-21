'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import RadarAnimation from '@/components/RadarAnimation';
import DustList from '@/components/DustList';
import ActionButtons from '@/components/ActionButtons';
import StatsBar from '@/components/StatsBar';
import SuccessToast from '@/components/SuccessToast';
import DisclaimerModal from '@/components/DisclaimerModal';
import { useSolPrice } from '@/lib/useSolPrice';
import {
  buildCloseAccountsTxs,
  signAndSendBatches,
  estimateReclaimableSOL,
  estimateDevFee,
  MIN_SOL_REQUIRED_LAMPORTS,
  type EmptyTokenAccount,
  type CloseAccountsBatch,
  type BatchProgress,
} from '@/lib/solana';

export type AppState =
  | 'idle'
  | 'scanning'
  | 'scanned'
  | 'reclaiming'
  | 'done';

export default function Home() {
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet();
  const { connection } = useConnection();
  const solPrice = useSolPrice();

  // ── Scan state ──
  const [appState, setAppState] = useState<AppState>('idle');
  const [emptyAccounts, setEmptyAccounts] = useState<EmptyTokenAccount[]>([]);
  const [frozenCount, setFrozenCount] = useState(0);
  const [withheldFeesCount, setWithheldFeesCount] = useState(0);
  const [batches, setBatches] = useState<CloseAccountsBatch[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [walletBalanceLamports, setWalletBalanceLamports] = useState<number>(0);
  const [hasPromo, setHasPromo] = useState(false);

  // ── Reclaim state ──
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [completedBatches, setCompletedBatches] = useState(0);
  const [totalAccountsClosed, setTotalAccountsClosed] = useState(0);
  const [signatures, setSignatures] = useState<string[]>([]);
  const [reclaimError, setReclaimError] = useState<string | null>(null);
  const [failedBatchIndex, setFailedBatchIndex] = useState<number | null>(null);

  // ── Toast ──
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ── Close-all mode ──
  const [includeNonEmpty, setIncludeNonEmpty] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // ── Derived ──
  const closableCount = emptyAccounts.filter((a) => !a.isFrozen).length;
  const reclaimableSOL = estimateReclaimableSOL(closableCount);
  const devFee = hasPromo ? 0 : estimateDevFee(closableCount);

  // ── Toggle handler for "include non-empty" mode ──
  const handleToggleNonEmpty = useCallback((enabled: boolean) => {
    if (enabled) {
      setShowDisclaimer(true);
    } else {
      setIncludeNonEmpty(false);
      // Reset results since mode changed
      setEmptyAccounts([]);
      setBatches([]);
      setFrozenCount(0);
      setWithheldFeesCount(0);
      setHasPromo(false);
      setAppState('idle');
    }
  }, []);

  const handleDisclaimerAccept = useCallback(() => {
    setIncludeNonEmpty(true);
    setShowDisclaimer(false);
    // Reset results since mode changed
    setEmptyAccounts([]);
    setBatches([]);
    setFrozenCount(0);
    setWithheldFeesCount(0);
    setHasPromo(false);
    setAppState('idle');
  }, []);

  const handleDisclaimerCancel = useCallback(() => {
    setShowDisclaimer(false);
  }, []);

  // ── Scan handler ──
  const handleScan = useCallback(async () => {
    if (!publicKey || !connection) return;

    setScanError(null);
    setReclaimError(null);
    setAppState('scanning');
    setEmptyAccounts([]);
    setFrozenCount(0);
    setWithheldFeesCount(0);
    setHasPromo(false);
    setBatches([]);
    setCompletedBatches(0);
    setTotalAccountsClosed(0);
    setSignatures([]);
    setFailedBatchIndex(null);

    try {
      const result = await buildCloseAccountsTxs(connection, publicKey, {
        includeNonEmpty,
      });
      const allClosable = result.batches.flatMap((b) => b.accounts);
      setEmptyAccounts(allClosable);
      setFrozenCount(result.frozenCount);
      setWithheldFeesCount(result.withheldFeesCount);
      setBatches(result.batches);
      setWalletBalanceLamports(result.walletBalanceLamports);
      setHasPromo(result.hasPromo);
      setAppState('scanned');
    } catch (err: any) {
      console.error('Scan failed:', err);
      setScanError(err?.message || 'Failed to scan wallet');
      setAppState('idle');
    }
  }, [publicKey, connection, includeNonEmpty]);

  // ── Reclaim handler ──
  const handleReclaim = useCallback(async () => {
    if ((!signAllTransactions && !signTransaction) || batches.length === 0) return;

    setReclaimError(null);
    setAppState('reclaiming');

    const startFrom = failedBatchIndex ?? 0;
    setFailedBatchIndex(null);

    try {
      await signAndSendBatches(
        connection,
        batches,
        signAllTransactions,
        signTransaction,
        (progress: BatchProgress) => {
          setBatchProgress(progress);
          if (progress.status === 'confirmed') {
            setCompletedBatches((prev) => prev + 1);
            setTotalAccountsClosed((prev) => prev + progress.accountsClosed);
            if (progress.signature) {
              setSignatures((prev) => [...prev, progress.signature!]);
            }
          }
        },
        startFrom
      );

      setAppState('done');
      const totalClosed = batches
        .slice(startFrom)
        .reduce((acc, b) => acc + b.accounts.length, 0);
      const solReclaimed = estimateReclaimableSOL(totalClosed);
      setSuccessMessage(
        `Successfully reclaimed ~${solReclaimed.toFixed(4)} SOL from ${totalClosed} accounts!`
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: any) {
      console.error('Reclaim failed:', err);
      setReclaimError(err?.message || 'Transaction failed');
      setFailedBatchIndex(batchProgress?.batchIndex ?? null);
      setAppState('scanned');
    }
  }, [signTransaction, signAllTransactions, batches, connection, failedBatchIndex, batchProgress]);

  return (
    <main className="min-h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-[#9945FF]/20 via-background to-[#14F195]/10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#9945FF]/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header />
        <StatsBar
          connected={connected}
          closableCount={closableCount}
          frozenCount={frozenCount}
          withheldFeesCount={withheldFeesCount}
        />

        <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
          <HeroSection
            connected={connected}
            reclaimableSOL={reclaimableSOL}
            closableCount={closableCount}
            appState={appState}
            solPrice={solPrice}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            {/* Left Column - Radar + Buttons */}
            <div>
              <RadarAnimation
                isScanning={appState === 'scanning'}
                appState={appState}
                batchProgress={batchProgress}
              />
              <ActionButtons
                onScan={handleScan}
                onReclaim={handleReclaim}
                appState={appState}
                connected={connected}
                closableCount={closableCount}
                completedBatches={completedBatches}
                totalBatches={batches.length}
                reclaimableSOL={reclaimableSOL}
                devFee={devFee}
                scanError={scanError}
                reclaimError={reclaimError}
                failedBatchIndex={failedBatchIndex}
                walletBalanceSOL={walletBalanceLamports / 1e9}
                includeNonEmpty={includeNonEmpty}
                onToggleNonEmpty={handleToggleNonEmpty}
                hasPromo={hasPromo}
              />
            </div>

            {/* Right Column - Dust List */}
            <div>
              <DustList
                accounts={emptyAccounts}
                appState={appState}
                signatures={signatures}
                totalAccountsClosed={totalAccountsClosed}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && <SuccessToast message={successMessage} />}

      {/* Disclaimer Modal */}
      <DisclaimerModal
        open={showDisclaimer}
        onAccept={handleDisclaimerAccept}
        onCancel={handleDisclaimerCancel}
      />
    </main>
  );
}
