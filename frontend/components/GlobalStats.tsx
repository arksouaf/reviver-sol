'use client';

import { useEffect, useState } from 'react';
import { Users, Coins, Layers } from 'lucide-react';

interface GlobalStatsData {
  totalUsers: number;
  totalSolRecovered: number;
  totalAccountsClosed: number;
}

export default function GlobalStats() {
  const [stats, setStats] = useState<GlobalStatsData | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  // Refresh stats every 30 seconds
  useEffect(() => {
    const id = setInterval(() => {
      fetch('/api/stats')
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!stats) return null;

  return (
    <div className="mt-12 mb-4">
      <h3 className="text-center text-[#8b8ba3] text-sm font-medium uppercase tracking-widest mb-4">
        Community Stats
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {/* Total Users */}
        <div className="bg-white/5 backdrop-blur-sm border border-[#9945FF]/20 rounded-xl p-5 text-center hover:border-[#9945FF]/40 transition-all">
          <Users className="w-6 h-6 text-[#9945FF] mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {stats.totalUsers.toLocaleString()}
          </p>
          <p className="text-[#8b8ba3] text-sm mt-1">Wallets Served</p>
        </div>

        {/* Total SOL Recovered */}
        <div className="bg-white/5 backdrop-blur-sm border border-[#14F195]/20 rounded-xl p-5 text-center hover:border-[#14F195]/40 transition-all">
          <Coins className="w-6 h-6 text-[#14F195] mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {Number(stats.totalSolRecovered).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}{' '}
            <span className="text-[#14F195] text-lg">SOL</span>
          </p>
          <p className="text-[#8b8ba3] text-sm mt-1">Total SOL Recovered</p>
        </div>

        {/* Total Accounts Closed */}
        <div className="bg-white/5 backdrop-blur-sm border border-[#9945FF]/20 rounded-xl p-5 text-center hover:border-[#9945FF]/40 transition-all">
          <Layers className="w-6 h-6 text-[#9945FF] mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {stats.totalAccountsClosed.toLocaleString()}
          </p>
          <p className="text-[#8b8ba3] text-sm mt-1">Accounts Closed</p>
        </div>
      </div>
    </div>
  );
}
