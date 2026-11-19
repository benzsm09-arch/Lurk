'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, LockOpen, ShieldAlert, Sparkles, X } from 'lucide-react';
import { WhisperMessage } from '@/lib/whisperlink';
import { triggerHaptic } from '@/lib/haptics';

interface ClueMiniGameModalProps {
  message: WhisperMessage;
  onAdvanceStep: (messageId: string) => void;
  onClose: () => void;
}

const SIGNAL_GRID = [
  { id: 0, symbol: '◆', label: 'Amber Pulse' },
  { id: 1, symbol: '✦', label: 'Rose Signal' },
  { id: 2, symbol: '▲', label: 'Echo Wave' },
  { id: 3, symbol: '●', label: 'Core Node' },
];

export default function ClueMiniGameModal({
  message,
  onAdvanceStep,
  onClose,
}: ClueMiniGameModalProps) {
  const clue = message.clueDrop;
  const [targetIdx, setTargetIdx] = useState<number>(() => (message.clueDrop?.progress ?? 0) % 4);
  const [missFeedback, setMissFeedback] = useState(false);

  if (!clue) return null;

  const handleTapTile = (idx: number) => {
    if (clue.unlocked) return;
    if (idx === targetIdx) {
      setMissFeedback(false);
      if (clue.progress + 1 < clue.requiredSteps) {
        triggerHaptic('clue_step');
      }
      onAdvanceStep(message.id);
      setTargetIdx((idx + 1) % 4);
    } else {
      triggerHaptic('error_nudge');
      setMissFeedback(true);
    }
  };

  const progressPct = Math.round((clue.progress / clue.requiredSteps) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clue-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md rounded-t-3xl border border-rose-200/70 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#17121C] sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl whisper-gradient text-white">
              {clue.unlocked ? (
                <LockOpen className="h-5 w-5" aria-hidden="true" />
              ) : (
                <KeyRound className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2
                id="clue-modal-title"
                className="font-display text-base font-extrabold text-[#191116] dark:text-white"
              >
                {clue.unlocked ? 'Clue Unlocked' : 'Decode Sender Clue'}
              </h2>
              <p className="font-mono-tabular text-xs text-[#64535C] dark:text-[#A696A1]">
                Progress {clue.progress}/{clue.requiredSteps} keys
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close clue decoder"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#64535C] hover:bg-rose-50 dark:text-[#A696A1] dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Mini-game progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-rose-100 dark:bg-white/10">
          <div
            style={{ width: `${progressPct}%` }}
            className="h-full whisper-gradient transition-all duration-200"
          />
        </div>

        <div className="mt-5 rounded-2xl border border-rose-200/70 bg-[#FFF9F8] p-4 dark:border-white/10 dark:bg-[#100C14]">
          <p className="text-xs font-medium text-[#64535C] dark:text-[#A696A1]">
            Message
          </p>
          <p className="mt-1 text-sm font-semibold text-[#191116] dark:text-white">
            &ldquo;{message.text}&rdquo;
          </p>
        </div>

        {clue.unlocked ? (
          <div className="mt-5 rounded-2xl border border-[#FF2E63]/30 bg-rose-50/70 p-5 text-center dark:border-[#FF7A59]/30 dark:bg-[#FF2E63]/10">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full whisper-gradient text-white">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold text-[#D91B4E] dark:text-[#FF7A59]">
              Revealed Identity Hint
            </p>
            <p className="mt-1.5 font-display text-lg font-bold text-[#191116] dark:text-white">
              {clue.hint}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 min-h-[46px] w-full rounded-2xl whisper-gradient px-5 py-3 text-sm font-bold text-white whisper-glow cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#191116] dark:text-white">
                Tap the highlighted Signal Key ({clue.requiredSteps - clue.progress}{' '}
                left)
              </span>
              <span className="font-semibold text-[#FF2E63] dark:text-[#FF7A59]">
                Target: {SIGNAL_GRID[targetIdx].symbol}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {SIGNAL_GRID.map((tile) => {
                const isTarget = tile.id === targetIdx;
                return (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => handleTapTile(tile.id)}
                    className={`flex min-h-[60px] items-center justify-center gap-2 rounded-2xl border text-sm font-bold transition-transform active:scale-95 cursor-pointer ${
                      isTarget
                        ? 'border-[#FF2E63] whisper-gradient text-white whisper-glow'
                        : 'border-rose-200/80 bg-[#FFF9F8] text-[#57454E] hover:bg-rose-50 dark:border-white/10 dark:bg-[#100C14] dark:text-[#C5B6BF] dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="text-lg" aria-hidden="true">
                      {tile.symbol}
                    </span>
                    <span>{tile.label}</span>
                  </button>
                );
              })}
            </div>

            {missFeedback && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Wrong key—tap the glowing {SIGNAL_GRID[targetIdx].label} key.</span>
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
