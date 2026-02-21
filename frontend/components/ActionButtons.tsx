'use client';

import { Sparkles, Zap, AlertCircle, RefreshCw, Flame } from 'lucide-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import type { AppState } from '@/app/page';

interface ActionButtonsProps {
  onScan: () => void;
  onReclaim: () => void;
  appState: AppState;
  connected: boolean;
  closableCount: number;
  completedBatches: number;
  totalBatches: number;
  reclaimableSOL: number;
  devFee: number;
  scanError: string | null;
  reclaimError: string | null;
  failedBatchIndex: number | null;
  walletBalanceSOL: number;
  includeNonEmpty: boolean;
  onToggleNonEmpty: (enabled: boolean) => void;
}

export default function ActionButtons({
  onScan,
  onReclaim,
  appState,
  connected,
  closableCount,
  completedBatches,
  totalBatches,
  reclaimableSOL,
  devFee,
  scanError,
  reclaimError,
  failedBatchIndex,
  walletBalanceSOL,
  includeNonEmpty,
  onToggleNonEmpty,
}: ActionButtonsProps) {
  const { setVisible } = useWalletModal();

  const isScanning = appState === 'scanning';
  const isReclaiming = appState === 'reclaiming';
  const hasResults = appState === 'scanned' || appState === 'done';
  const isDone = appState === 'done';
  const lowBalance = hasResults && walletBalanceSOL < 0.002;

  return (
    <div className="flex flex-col gap-4">
      {/* Error messages */}
      {scanError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{scanError}</span>
        </div>
      )}
      {reclaimError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{reclaimError}</span>
        </div>
      )}
      {lowBalance && !reclaimError && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Low balance ({walletBalanceSOL.toFixed(4)} SOL). Dev fee skipped for this session.
            The reclaim will still work — you&apos;ll get the full rent back.
          </span>
        </div>
      )}

      {/* Connect Wallet (if not connected) */}
      {!connected && (
        <button
          onClick={() => setVisible(true)}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-[#b05fff] hover:to-[#2aff9f] text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(153,69,255,0.4)]"
        >
          <Zap className="w-5 h-5" />
          <span>Connect Wallet to Start</span>
        </button>
      )}

      {/* Scan Button */}
      {connected && (
        <button
          onClick={onScan}
          disabled={isScanning || isReclaiming}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#9945FF] to-[#6b5adb] hover:from-[#b05fff] hover:to-[#7d6bff] disabled:from-[#9945FF]/50 disabled:to-[#6b5adb]/50 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(153,69,255,0.4)] disabled:shadow-none disabled:cursor-not-allowed"
        >
          <Zap className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning Your Wallet...' : isDone ? 'Scan Again' : 'Scan Wallet'}</span>
        </button>
      )}

      {/* Include Non-Empty Toggle */}
      {connected && (
        <div className={`rounded-xl border p-3 transition-all duration-200 ${
          includeNonEmpty
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-white/5 border-[#2d3250]'
        }`}>
          <label className="flex items-center justify-between cursor-pointer select-none">
            <div className="flex items-center gap-2">
              <Flame className={`w-4 h-4 ${includeNonEmpty ? 'text-red-400' : 'text-[#8b8ba3]'}`} />
              <span className={`text-sm font-medium ${includeNonEmpty ? 'text-red-400' : 'text-[#8b8ba3]'}`}>
                Include accounts with tokens
              </span>
            </div>
            <button
              onClick={() => onToggleNonEmpty(!includeNonEmpty)}
              disabled={isScanning || isReclaiming}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                includeNonEmpty ? 'bg-red-500' : 'bg-[#2d3250]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                  includeNonEmpty ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
          {includeNonEmpty && (
            <p className="mt-2 text-xs text-red-400/80">
              ⚠️ Tokens will be permanently burned before closing. Re-scan required.
            </p>
          )}
        </div>
      )}

      {/* Reclaim All Button */}
      {connected && hasResults && closableCount > 0 && !isDone && (
        <>
          <button
            onClick={onReclaim}
            disabled={isReclaiming}
            className="w-full py-6 px-6 bg-gradient-to-r from-[#14F195] to-[#00d977] hover:from-[#2aff9f] hover:to-[#1aff85] disabled:from-[#14F195]/50 disabled:to-[#00d977]/50 text-[#0a0e27] font-black text-lg rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-[0_0_30px_rgba(20,241,149,0.6)] transform hover:scale-105 active:scale-95 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isReclaiming ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>
                  Processing {completedBatches}/{totalBatches} batches...
                </span>
              </>
            ) : failedBatchIndex !== null ? (
              <>
                <RefreshCw className="w-6 h-6" />
                <span>RETRY FROM BATCH {failedBatchIndex + 1}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 animate-pulse" />
                <span>RECLAIM ALL ({closableCount} accounts)</span>
                <Sparkles className="w-6 h-6 animate-pulse" />
              </>
            )}
          </button>

          {/* Fee breakdown */}
          <div className="bg-white/5 border border-[#2d3250] rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between text-[#8b8ba3]">
              <span>Rent recovered ({closableCount} accounts)</span>
              <span className="text-[#14F195] font-semibold">+{reclaimableSOL.toFixed(4)} SOL</span>
            </div>
            <div className="flex justify-between text-[#8b8ba3]">
              <span>Dev fee (0.0001 SOL x {closableCount})</span>
              <span className="text-red-400 font-semibold">-{devFee.toFixed(4)} SOL</span>
            </div>
            <div className="border-t border-[#2d3250] pt-1 flex justify-between text-white font-semibold">
              <span>Net gain</span>
              <span className="text-[#14F195]">+{(reclaimableSOL - devFee).toFixed(4)} SOL</span>
            </div>
            <div className="flex justify-between text-[#8b8ba3]">
              <span>Transactions to sign</span>
              <span>{totalBatches}</span>
            </div>
          </div>
        </>
      )}

      {/* Done state */}
      {isDone && (
        <div className="w-full py-4 px-6 bg-[#14F195]/10 border border-[#14F195]/30 text-[#14F195] font-bold rounded-xl text-center">
          All accounts closed successfully!
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-center text-[#8b8ba3] mt-2">
        {connected
          ? includeNonEmpty
            ? 'Tokens will be burned & accounts closed — this is irreversible'
            : 'Only empty (zero-balance) token accounts will be closed'
          : 'Supports Phantom, Solflare, and other Solana wallets'}
      </p>
    </div>
  );
}
