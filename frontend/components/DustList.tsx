'use client';

import { Copy, CheckCircle, ExternalLink, Snowflake, Flame } from 'lucide-react';
import { useState } from 'react';
import type { EmptyTokenAccount } from '@/lib/solana';
import { shortenAddress, estimateReclaimableSOL } from '@/lib/solana';
import type { AppState } from '@/app/page';

interface DustListProps {
  accounts: EmptyTokenAccount[];
  appState: AppState;
  signatures: string[];
  totalAccountsClosed: number;
}

const RENT_PER_ACCOUNT = 0.00203928; // SOL

export default function DustList({
  accounts,
  appState,
  signatures,
  totalAccountsClosed,
}: DustListProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalRent = accounts.length * RENT_PER_ACCOUNT;
  const hasAccounts = accounts.length > 0;
  const isIdle = appState === 'idle';
  const isScanning = appState === 'scanning';
  const isDone = appState === 'done';

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">
          {isDone ? 'Closed Accounts' : 'Found Dust'}
        </h3>
        <p className="text-[#8b8ba3] text-sm">
          {isScanning
            ? 'Searching for empty token accounts...'
            : hasAccounts
              ? `${accounts.length} empty account${accounts.length !== 1 ? 's' : ''} found`
              : isIdle
                ? 'Scan your wallet to discover reclaimable accounts'
                : 'No empty accounts found'}
        </p>
      </div>

      {/* Glassmorphism Container */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-[#9945FF]/20 overflow-hidden">
        {/* Scanning skeleton */}
        {isScanning && (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-[#2d3250]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#2d3250] rounded w-1/3" />
                  <div className="h-3 bg-[#2d3250] rounded w-1/4" />
                </div>
                <div className="h-5 bg-[#2d3250] rounded w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isScanning && !hasAccounts && (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">
              {isIdle ? '🔍' : '✨'}
            </div>
            <p className="text-[#8b8ba3] text-base">
              {isIdle
                ? 'Connect your wallet and scan to find dust'
                : 'Your wallet is clean — no empty accounts!'}
            </p>
          </div>
        )}

        {/* Account list */}
        {hasAccounts && !isScanning && (
          <div className="max-h-[600px] overflow-y-auto">
            <div className="divide-y divide-[#2d3250]/50">
              {accounts.map((account) => {
                const pubkeyStr = account.pubkey.toBase58();
                const mintStr = account.mint.toBase58();

                return (
                  <div
                    key={pubkeyStr}
                    className="p-4 hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      {/* Token Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {account.isFrozen ? (
                            <Snowflake className="w-5 h-5 text-blue-300" />
                          ) : account.uiAmount > 0 ? (
                            <Flame className="w-5 h-5 text-red-400" />
                          ) : (
                            <span className="text-xs">SPL</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white group-hover:text-[#14F195] transition-colors truncate font-mono text-sm">
                            {shortenAddress(pubkeyStr, 6)}
                          </p>
                          <p className="text-xs text-[#8b8ba3] truncate">
                            mint: {shortenAddress(mintStr, 6)}
                          </p>
                        </div>
                      </div>

                      {/* Rent Refund + Token Amount */}
                      <div className="text-right mr-4 flex-shrink-0">
                        <p className="font-bold text-[#14F195] text-base">
                          {RENT_PER_ACCOUNT.toFixed(5)} SOL
                        </p>
                        {account.uiAmount > 0 ? (
                          <p className="text-xs text-red-400 font-semibold">
                            🔥 {account.uiAmount.toLocaleString()} tokens
                          </p>
                        ) : (
                          <p className="text-xs text-[#8b8ba3]">rent refund</p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => handleCopy(pubkeyStr)}
                          className="p-2 hover:bg-[#9945FF]/20 rounded-lg transition-colors"
                          title="Copy account address"
                        >
                          {copied === pubkeyStr ? (
                            <CheckCircle className="w-4 h-4 text-[#14F195]" />
                          ) : (
                            <Copy className="w-4 h-4 text-[#8b8ba3] hover:text-[#14F195]" />
                          )}
                        </button>
                        <a
                          href={`https://solscan.io/account/${pubkeyStr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-[#9945FF]/20 rounded-lg transition-colors"
                          title="View on Solscan"
                        >
                          <ExternalLink className="w-4 h-4 text-[#8b8ba3] hover:text-[#14F195]" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer summary */}
        {hasAccounts && !isScanning && (
          <div className="bg-white/5 border-t border-[#9945FF]/20 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[#8b8ba3] font-medium">
                {isDone ? 'Total Reclaimed' : 'Total Reclaimable'}
              </p>
              <p className="text-xl font-bold text-[#14F195]">
                {totalRent.toFixed(4)} SOL
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Transaction signatures */}
      {signatures.length > 0 && (
        <div className="mt-4 bg-white/5 backdrop-blur-md rounded-2xl border border-[#14F195]/20 p-4">
          <h4 className="text-sm font-semibold text-white mb-2">
            Transaction Signatures ({signatures.length})
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {signatures.map((sig, i) => (
              <a
                key={sig}
                href={`https://solscan.io/tx/${sig}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-[#8b8ba3] hover:text-[#14F195] transition-colors font-mono"
              >
                <CheckCircle className="w-3 h-3 text-[#14F195] flex-shrink-0" />
                <span>Batch {i + 1}: {shortenAddress(sig, 8)}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
