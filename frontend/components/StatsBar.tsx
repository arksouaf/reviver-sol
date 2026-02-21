'use client';

import { Wifi, Zap, Snowflake, Ban } from 'lucide-react';

interface StatsBarProps {
  connected: boolean;
  closableCount: number;
  frozenCount: number;
  withheldFeesCount: number;
}

export default function StatsBar({
  connected,
  closableCount,
  frozenCount,
  withheldFeesCount,
}: StatsBarProps) {
  return (
    <div className="border-b border-[#2d3250] backdrop-blur-sm bg-background/50">
      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Network Status */}
          <div className="bg-white/5 backdrop-blur-sm border border-[#9945FF]/20 rounded-xl p-4 hover:border-[#9945FF]/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#8b8ba3] text-sm font-medium">Network Status</p>
                <p className="text-white text-lg font-bold mt-1">Mainnet-Beta</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-[#14F195] animate-pulse' : 'bg-[#8b8ba3]'}`}></div>
                <Wifi className={`w-5 h-5 ${connected ? 'text-[#14F195]' : 'text-[#8b8ba3]'}`} />
              </div>
            </div>
          </div>

          {/* Closable Accounts */}
          <div className="bg-white/5 backdrop-blur-sm border border-[#14F195]/20 rounded-xl p-4 hover:border-[#14F195]/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#8b8ba3] text-sm font-medium">Closable Accounts</p>
                <p className="text-white text-lg font-bold mt-1">
                  {closableCount > 0 ? closableCount : connected ? '—' : '—'}
                </p>
              </div>
              <Zap className={`w-5 h-5 ${closableCount > 0 ? 'text-[#14F195]' : 'text-[#8b8ba3]'}`} />
            </div>
          </div>

          {/* Frozen Accounts */}
          <div className="bg-white/5 backdrop-blur-sm border border-[#9945FF]/20 rounded-xl p-4 hover:border-[#9945FF]/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#8b8ba3] text-sm font-medium">Frozen (Skipped)</p>
                <p className="text-white text-lg font-bold mt-1">
                  {frozenCount > 0 ? frozenCount : connected ? '0' : '—'}
                </p>
              </div>
              <Snowflake className={`w-5 h-5 ${frozenCount > 0 ? 'text-blue-400' : 'text-[#8b8ba3]'}`} />
            </div>
          </div>

          {/* Withheld Fees Accounts */}
          <div className="bg-white/5 backdrop-blur-sm border border-orange-500/20 rounded-xl p-4 hover:border-orange-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#8b8ba3] text-sm font-medium">Withheld Fees</p>
                <p className="text-white text-lg font-bold mt-1">
                  {withheldFeesCount > 0 ? withheldFeesCount : connected ? '0' : '—'}
                </p>
              </div>
              <Ban className={`w-5 h-5 ${withheldFeesCount > 0 ? 'text-orange-400' : 'text-[#8b8ba3]'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
