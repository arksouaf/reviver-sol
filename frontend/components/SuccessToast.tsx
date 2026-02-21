import { CheckCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SuccessToastProps {
  message: string;
}

export default function SuccessToast({ message }: SuccessToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-right-5 duration-300">
      <div className="bg-gradient-to-r from-[#14F195] to-[#00d977] border border-[#14F195]/50 rounded-xl p-4 shadow-2xl shadow-[#14F195]/20 backdrop-blur-md max-w-sm">
        <div className="flex items-center gap-4">
          <CheckCircle className="w-6 h-6 text-[#0a0e27] flex-shrink-0 animate-bounce" />
          <div className="flex-1">
            <p className="font-bold text-[#0a0e27] text-base">Success!</p>
            <p className="text-[#0a0e27]/80 text-sm">{message}</p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-[#0a0e27]" />
          </button>
        </div>
      </div>
    </div>
  );
}
