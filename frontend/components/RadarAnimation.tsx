'use client';

import { Zap, CheckCircle } from 'lucide-react';
import type { AppState } from '@/app/page';
import type { BatchProgress } from '@/lib/solana';

interface RadarAnimationProps {
  isScanning: boolean;
  appState: AppState;
  batchProgress: BatchProgress | null;
}

export default function RadarAnimation({
  isScanning,
  appState,
  batchProgress,
}: RadarAnimationProps) {
  const isReclaiming = appState === 'reclaiming';
  const isDone = appState === 'done';

  let statusText = 'Ready to scan';
  let statusColor = 'text-[#8b8ba3]';

  if (isScanning) {
    statusText = 'SCANNING...';
    statusColor = 'text-[#14F195]';
  } else if (isReclaiming && batchProgress) {
    const batchNum = batchProgress.batchIndex + 1;
    const total = batchProgress.totalBatches;
    const statusMap: Record<string, string> = {
      signing: `Signing batch ${batchNum}/${total}...`,
      sending: `Sending batch ${batchNum}/${total}...`,
      confirming: `Confirming batch ${batchNum}/${total}...`,
      confirmed: `Batch ${batchNum}/${total} confirmed!`,
      failed: `Batch ${batchNum}/${total} failed`,
    };
    statusText = statusMap[batchProgress.status] || 'Processing...';
    statusColor = batchProgress.status === 'failed' ? 'text-red-400' : 'text-[#14F195]';
  } else if (isDone) {
    statusText = 'ALL DONE!';
    statusColor = 'text-[#14F195]';
  }

  const animating = isScanning || isReclaiming;

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto mb-8">
      {/* Glassmorphism Container */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-md rounded-3xl border border-[#9945FF]/30 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#9945FF]/10 to-[#14F195]/10"></div>

        {/* Radar Circles */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 300">
          <circle cx="150" cy="150" r="130" fill="none" stroke="#9945FF" strokeWidth="1" opacity="0.3" />
          <circle cx="150" cy="150" r="100" fill="none" stroke="#14F195" strokeWidth="1" opacity="0.3" />
          <circle cx="150" cy="150" r="70" fill="none" stroke="#9945FF" strokeWidth="1" opacity="0.3" />
          <circle cx="150" cy="150" r="40" fill="none" stroke="#14F195" strokeWidth="1" opacity="0.3" />
          <circle cx="150" cy="150" r="15" fill="#14F195" opacity="0.6" />
          <line x1="150" y1="20" x2="150" y2="280" stroke="#9945FF" strokeWidth="1" opacity="0.2" />
          <line x1="20" y1="150" x2="280" y2="150" stroke="#14F195" strokeWidth="1" opacity="0.2" />
        </svg>

        {/* Scanning beam */}
        {animating && (
          <>
            <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 300 300">
              <line x1="150" y1="150" x2="150" y2="20" stroke="#14F195" strokeWidth="2" opacity="0.8" />
            </svg>
            <svg className="absolute inset-0 w-full h-full animate-pulse" viewBox="0 0 300 300">
              <circle cx="150" cy="150" r="120" fill="none" stroke="#9945FF" strokeWidth="2" opacity="0.5" />
            </svg>
          </>
        )}

        {/* Center icon */}
        <div className={`absolute inset-0 flex items-center justify-center ${animating ? 'animate-bounce' : ''}`}>
          <div className={`p-4 rounded-full ${isDone ? 'bg-[#14F195]/20' : animating ? 'bg-[#14F195]/20' : 'bg-[#9945FF]/10'} transition-all duration-300`}>
            {isDone ? (
              <CheckCircle className="w-12 h-12 text-[#14F195]" />
            ) : (
              <Zap className={`w-12 h-12 ${animating ? 'text-[#14F195]' : 'text-[#9945FF]'} transition-colors`} />
            )}
          </div>
        </div>

        {/* Progress bar during reclaiming */}
        {isReclaiming && batchProgress && (
          <div className="absolute bottom-14 left-6 right-6">
            <div className="w-full bg-[#2d3250] rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#9945FF] to-[#14F195] h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${((batchProgress.batchIndex + (batchProgress.status === 'confirmed' ? 1 : 0.5)) / batchProgress.totalBatches) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Status text */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className={`text-sm font-semibold ${statusColor} transition-colors`}>
            {statusText}
          </p>
        </div>
      </div>
    </div>
  );
}
