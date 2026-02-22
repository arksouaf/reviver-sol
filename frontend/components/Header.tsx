'use client';

import { useState } from 'react';
import { Zap, Github, Copy, CheckCircle2 } from 'lucide-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { shortenAddress } from '@/lib/solana';

export default function Header() {
  const { setVisible } = useWalletModal();
  const { publicKey, connected, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const tokenAddress = process.env.NEXT_PUBLIC_PROMO_TOKEN_MINT || 'TBD...';
  const tokenSymbol = process.env.NEXT_PUBLIC_PROMO_TOKEN_SYMBOL || 'REVIVER';
  const githubRepo = 'https://github.com/arksouaf/reviver-sol';

  const handleCopy = () => {
    if (tokenAddress !== 'TBD...') {
      navigator.clipboard.writeText(tokenAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Top Announcement Banner */}
      <div className="bg-gradient-to-r from-[#9945FF]/20 via-[#14F195]/10 to-[#9945FF]/20 border-b border-[#14F195]/20 py-2 px-4 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Token Info */}
          <div className="flex items-center gap-2 text-[#c0c0d0]">
            <span className="font-semibold text-white">${tokenSymbol} Token:</span>
            <code className="bg-black/30 px-2 py-0.5 rounded text-[#14F195] font-mono text-xs">
              {tokenAddress === 'TBD...' ? tokenAddress : shortenAddress(tokenAddress, 8)}
            </code>
            {tokenAddress !== 'TBD...' && (
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Copy Address"
              >
                {copied ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#14F195]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#8b8ba3] hover:text-white" />
                )}
              </button>
            )}
          </div>

          {/* GitHub Link */}
          <a
            href={githubRepo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[#8b8ba3] hover:text-white transition-colors font-medium"
          >
            <Github className="w-4 h-4" />
            <span>100% Open Source</span>
          </a>
        </div>
      </div>

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
    </>
  );
}
