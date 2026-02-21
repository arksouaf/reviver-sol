import { Coins, TrendingUp, Wallet } from 'lucide-react';
import type { AppState } from '@/app/page';

interface HeroSectionProps {
  connected: boolean;
  reclaimableSOL: number;
  closableCount: number;
  appState: AppState;
  solPrice: number;
}

export default function HeroSection({
  connected,
  reclaimableSOL,
  closableCount,
  appState,
  solPrice,
}: HeroSectionProps) {
  const usdValue = reclaimableSOL * solPrice;

  const hasResults = appState === 'scanned' || appState === 'reclaiming' || appState === 'done';

  return (
    <div className="text-center">
      {!connected ? (
        <>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Wallet className="w-10 h-10 text-[#9945FF]" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            <span className="bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#14F195] bg-clip-text text-transparent">
              Connect Your Wallet
            </span>
          </h2>
          <p className="text-[#8b8ba3] text-sm md:text-base mt-4 max-w-2xl mx-auto">
            Connect your Solana wallet to scan for empty token accounts and reclaim trapped SOL.
          </p>
        </>
      ) : !hasResults ? (
        <>
          <p className="text-[#8b8ba3] text-lg md:text-xl font-medium mb-4">
            {appState === 'scanning' ? 'Scanning your wallet...' : 'Your Wallet Dust Total'}
          </p>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Coins className="w-10 h-10 text-[#14F195]" />
            <h2 className="text-6xl md:text-7xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#14F195] bg-clip-text text-transparent">
                {appState === 'scanning' ? '...' : '—'}
              </span>
              <span className="text-[#8b8ba3] text-4xl md:text-5xl ml-3">SOL</span>
            </h2>
          </div>
          <p className="text-[#8b8ba3] text-sm md:text-base mt-6 max-w-2xl mx-auto">
            {appState === 'scanning'
              ? 'Fetching token accounts from Solana mainnet...'
              : 'Hit "Scan Wallet" to discover reclaimable dust!'}
          </p>
        </>
      ) : (
        <>
          <p className="text-[#8b8ba3] text-lg md:text-xl font-medium mb-4">
            {appState === 'done' ? 'Reclaimed!' : 'Your Wallet Dust Total'}
          </p>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Coins className="w-10 h-10 text-[#14F195]" />
            <h2 className="text-6xl md:text-7xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#14F195] bg-clip-text text-transparent">
                {reclaimableSOL.toFixed(4)}
              </span>
              <span className="text-[#8b8ba3] text-4xl md:text-5xl ml-3">SOL</span>
            </h2>
          </div>

          <div className="flex items-center justify-center gap-2 text-green-400 text-base md:text-lg font-semibold mt-4">
            <TrendingUp className="w-5 h-5" />
            <span>&asymp; ${usdValue.toFixed(2)} USD</span>
          </div>

          <p className="text-[#8b8ba3] text-sm md:text-base mt-6 max-w-2xl mx-auto">
            Found <span className="text-white font-bold">{closableCount}</span> empty account{closableCount !== 1 ? 's' : ''} ready to close.
            {appState === 'done' && ' All done! 🎉'}
          </p>
        </>
      )}
    </div>
  );
}
