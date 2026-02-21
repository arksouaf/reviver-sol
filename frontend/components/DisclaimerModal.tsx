'use client';

import { useState } from 'react';
import { AlertTriangle, X, Flame, ShieldCheck } from 'lucide-react';
import { PROMO_TOKEN_SYMBOL } from '@/lib/solana';

interface DisclaimerModalProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export default function DisclaimerModal({
  open,
  onAccept,
  onCancel,
}: DisclaimerModalProps) {
  const [checked, setChecked] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-[#0f1225] border border-red-500/40 rounded-2xl shadow-2xl shadow-red-500/10 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-[#8b8ba3] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-red-400 text-center mb-2">
          ⚠️ Permanent Token Loss Warning
        </h2>

        {/* Body */}
        <div className="text-sm text-[#c0c0d0] space-y-3 mb-6">
          <p>
            By enabling this option, you are choosing to{' '}
            <span className="text-red-400 font-semibold">
              permanently burn and destroy all tokens
            </span>{' '}
            remaining in every token account before closing it.
          </p>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Flame className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>
                Tokens with real monetary value will be{' '}
                <strong className="text-white">permanently lost</strong>.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Flame className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>
                Meme coins, airdrops, and forgotten tokens will be destroyed.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Flame className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span>This action is <strong className="text-white">irreversible</strong>.</span>
            </div>
            {PROMO_TOKEN_SYMBOL && (
              <div className="flex items-start gap-2 mt-2 pt-2 border-t border-red-500/20">
                <ShieldCheck className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-green-400">
                  Your <strong className="text-white">${PROMO_TOKEN_SYMBOL}</strong> tokens are protected and will <strong className="text-white">never</strong> be burned.
                </span>
              </div>
            )}
          </div>

          <p className="text-[#8b8ba3]">
            Please review the account list carefully before proceeding. Only
            enable this if you are certain the tokens have no value.
          </p>
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mb-5 select-none group">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-red-500/50 bg-transparent text-red-500 focus:ring-red-500 accent-red-500 cursor-pointer"
          />
          <span className="text-sm text-[#c0c0d0] group-hover:text-white transition-colors">
            I understand the risks. I accept that tokens will be permanently
            burned and that <strong className="text-red-400">I am solely responsible</strong>{' '}
            for any loss of value.
          </span>
        </label>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-white/5 border border-[#2d3250] hover:bg-white/10 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (checked) {
                setChecked(false);
                onAccept();
              }
            }}
            disabled={!checked}
            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 disabled:bg-red-600/30 disabled:text-white/40 text-white font-bold rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            I Understand the Risks
          </button>
        </div>
      </div>
    </div>
  );
}
