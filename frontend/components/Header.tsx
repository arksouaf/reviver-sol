'use client';

import { Zap } from 'lucide-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { shortenAddress } from '@/lib/solana';

export default function Header() {
  const { setVisible } = useWalletModal();
  const { publicKey, connected, disconnect } = useWallet();

  return (
    <header className="border-b border-[#2d3250] backdrop-blur-sm bg-background/50">
      <div className="px-4 md:px-8 py-4 max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-[#9945FF] to-[#14F195] rounded-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
            SOL Reviver
          </h1>
        </div>

        {/* Connect / Disconnect Wallet Button */}
        {connected && publicKey ? (
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-[#8b8ba3] font-mono">
              {shortenAddress(publicKey.toBase58(), 6)}
            </span>
            <div className="w-2 h-2 bg-[#14F195] rounded-full animate-pulse" />
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-[#2d3250] hover:bg-[#3d4260] text-[#8b8ba3] hover:text-white font-semibold rounded-lg transition-all duration-300 text-sm"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={() => setVisible(true)}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-[#b05fff] hover:to-[#2aff9f] text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(20,241,149,0.4)] group"
          >
            <span className="hidden sm:inline">Connect Wallet</span>
            <span className="sm:hidden">Connect</span>
          </button>
        )}
      </div>
    </header>
  );
}
