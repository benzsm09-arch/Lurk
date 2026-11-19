export type HapticCue =
  | 'tap_light'
  | 'modal_open'
  | 'record_start'
  | 'record_stop'
  | 'clue_step'
  | 'error_nudge'
  | 'celebrate_send'
  | 'celebrate_win'
  | 'celebrate_reveal'
  | 'destructive';

export const HAPTIC_PATTERNS: Record<HapticCue, number[]> = {
  tap_light: [8],
  modal_open: [12, 18, 12],
  record_start: [16, 24, 10],
  record_stop: [14],
  clue_step: [10],
  error_nudge: [22, 28, 22],
  celebrate_send: [16, 24, 24],
  celebrate_win: [20, 28, 36],
  celebrate_reveal: [14],
  destructive: [24, 30, 18],
};

export function getHapticPattern(cue: HapticCue): number[] {
  return [...HAPTIC_PATTERNS[cue]];
}

export function triggerHaptic(
  cue: HapticCue,
  overridePattern?: number[]
): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  if (typeof navigator.vibrate !== 'function') {
    return false;
  }

  const pattern =
    overridePattern && overridePattern.length > 0
      ? overridePattern
      : HAPTIC_PATTERNS[cue];

  try {
    return Boolean(navigator.vibrate(pattern));
  } catch {
    return false;
  }
}
