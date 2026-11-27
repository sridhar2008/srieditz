import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'card' }> = ({
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={
          variant === 'card'
            ? 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#e4c151] transition-colors whitespace-nowrap shrink-0 cursor-pointer'
            : 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-200 hover:border-[#D4AF37] hover:text-[#D4AF37] text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer'
        }
      >
        <Download className="w-3.5 h-3.5" />
        Install App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-200 hover:border-[#D4AF37] hover:text-[#D4AF37] text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          Install App
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#111115] border border-zinc-800 p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-semibold text-white">
                  Install SRI Studio App
                </h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="mt-4 space-y-2 text-sm text-zinc-300 list-decimal list-inside">
                <li>Tap the Share icon in your Safari toolbar.</li>
                <li>Scroll down and tap Add to Home Screen.</li>
                <li>Confirm to launch Sri Editing Studio like a native app.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e4c151] transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
