'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { EyeOff, Lock, ShieldCheck, X } from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuidelinesModal({ isOpen, onClose }: GuidelinesModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guidelines-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="relative w-full max-w-md rounded-t-3xl border border-rose-200/80 bg-white p-6 text-[#191116] shadow-2xl dark:border-white/15 dark:bg-[#17121C] dark:text-white sm:rounded-3xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close guidelines"
              className="absolute right-4 top-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#64535C] transition-colors hover:bg-rose-50 hover:text-[#191116] dark:text-[#A696A1] dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <h2
              id="guidelines-title"
              className="pr-10 font-display text-lg font-extrabold tracking-tight text-[#191116] dark:text-white"
            >
              Community Guidelines &amp; Privacy
            </h2>
            <p className="mt-1 text-xs text-[#64535C] dark:text-[#A696A1]">
              Keep Lurk fun, safe, and respectful for everyone.
            </p>

            <div className="mt-5 space-y-4 text-sm text-[#4D3A43] dark:text-[#D5C9D0]">
              <div className="flex gap-3">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#FF2E63] dark:text-rose-400"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold text-[#191116] dark:text-white">
                    Zero Harassment Policy
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#64535C] dark:text-[#A696A1]">
                    Bullying, hate speech, threats, and doxxing are strictly
                    prohibited. Keep confessions playful and kind.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <EyeOff
                  className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold text-[#191116] dark:text-white">
                    Instant Sender Controls
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#64535C] dark:text-[#A696A1]">
                    Inbox owners can delete any whisper or block an anonymous
                    sender alias with one tap using the moderation tools on
                    every card.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Lock
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold text-[#191116] dark:text-white">
                    Local Browser Storage
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#64535C] dark:text-[#A696A1]">
                    Your drafts, inbox messages, and custom profile settings are
                    stored locally on your device via browser storage and can be
                    cleared anytime in{' '}
                    <strong className="font-semibold text-[#191116] dark:text-white">
                      My Link &rarr; Reset
                    </strong>
                    .
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 flex min-h-[46px] w-full items-center justify-center rounded-2xl whisper-gradient py-2.5 text-sm font-bold text-white whisper-glow transition-transform active:scale-[0.985] hover:opacity-95 cursor-pointer"
            >
              Got it
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
