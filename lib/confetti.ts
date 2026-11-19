'use client';

import confetti from 'canvas-confetti';
import { playCelebrationChime } from './audio';
import {
  CelebrationFeedbackSpec,
  ConfettiCelebrationKind,
  getCelebrationFeedback,
  getConfettiBursts,
} from './confetti-config';
import { HapticCue, triggerHaptic } from './haptics';

export const CELEBRATION_EVENT = 'lurk-celebration-feedback';

export interface CelebrationToastPayload extends CelebrationFeedbackSpec {
  id: number;
}

const CELEBRATION_HAPTIC_CUE: Record<ConfettiCelebrationKind, HapticCue> = {
  whisper_sent: 'celebrate_send',
  clue_unlocked: 'celebrate_win',
  guess_who_win: 'celebrate_win',
  guess_who_done: 'celebrate_reveal',
};

export function triggerConfettiExplosion(
  kind: ConfettiCelebrationKind,
  detail?: string
): void {
  if (typeof window === 'undefined') return;

  const feedback = getCelebrationFeedback(kind, detail);
  const reducedMotion = Boolean(
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  // Dispatch toast feedback for every celebration (accessible regardless of motion settings)
  window.dispatchEvent(
    new CustomEvent<CelebrationToastPayload>(CELEBRATION_EVENT, {
      detail: {
        ...feedback,
        id: Date.now(),
      },
    })
  );

  triggerHaptic(CELEBRATION_HAPTIC_CUE[kind], feedback.hapticPattern);

  if (reducedMotion) return;

  playCelebrationChime(feedback.chimeNotes);

  const bursts = getConfettiBursts(kind);
  for (const burst of bursts) {
    if (burst.delayMs === 0) {
      void confetti(burst.options);
    } else {
      window.setTimeout(() => {
        void confetti(burst.options);
      }, burst.delayMs);
    }
  }
}
