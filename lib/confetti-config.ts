import type { Options } from 'canvas-confetti';

export type ConfettiCelebrationKind =
  | 'whisper_sent'
  | 'clue_unlocked'
  | 'guess_who_win'
  | 'guess_who_done';

export const LURK_CONFETTI_COLORS = [
  '#FF2E63',
  '#FF5A4E',
  '#FF9233',
  '#FBBF24',
  '#FFFFFF',
];

export interface ConfettiBurstSpec {
  delayMs: number;
  options: Options;
}

export interface CelebrationFeedbackSpec {
  kind: ConfettiCelebrationKind;
  title: string;
  subtitle: string;
  hapticPattern: number[];
  chimeNotes: number[];
}

export function getCelebrationFeedback(
  kind: ConfettiCelebrationKind,
  detail?: string
): CelebrationFeedbackSpec {
  const cleanDetail = detail?.trim();

  switch (kind) {
    case 'whisper_sent':
      return {
        kind,
        title: 'Whisper delivered!',
        subtitle: cleanDetail
          ? `Sent anonymously to ${cleanDetail}`
          : 'Delivered anonymously with zero trace',
        hapticPattern: [16, 24, 24],
        chimeNotes: [440, 554.37, 659.25],
      };
    case 'clue_unlocked':
      return {
        kind,
        title: 'Identity clue unlocked!',
        subtitle: cleanDetail || 'All 3 Signal Keys decoded',
        hapticPattern: [20, 28, 36],
        chimeNotes: [523.25, 659.25, 783.99, 1046.5],
      };
    case 'guess_who_win':
      return {
        kind,
        title: 'Nailed the guess!',
        subtitle: cleanDetail
          ? `You spotted ${cleanDetail}`
          : 'Exact match on Guess Who',
        hapticPattern: [20, 28, 36],
        chimeNotes: [523.25, 659.25, 783.99, 1046.5],
      };
    case 'guess_who_done':
      return {
        kind,
        title: 'Guess revealed',
        subtitle: cleanDetail
          ? `It was ${cleanDetail}`
          : 'Guess Who round completed',
        hapticPattern: [14],
        chimeNotes: [392, 493.88],
      };
  }
}

export function getConfettiBursts(
  kind: ConfettiCelebrationKind
): ConfettiBurstSpec[] {
  const base: Options = {
    colors: LURK_CONFETTI_COLORS,
    disableForReducedMotion: true,
    zIndex: 120,
  };

  if (kind === 'whisper_sent') {
    return [
      {
        delayMs: 0,
        options: {
          ...base,
          particleCount: 65,
          spread: 70,
          startVelocity: 38,
          origin: { x: 0.5, y: 0.62 },
        },
      },
      {
        delayMs: 140,
        options: {
          ...base,
          particleCount: 35,
          angle: 60,
          spread: 55,
          origin: { x: 0.2, y: 0.68 },
        },
      },
      {
        delayMs: 140,
        options: {
          ...base,
          particleCount: 35,
          angle: 120,
          spread: 55,
          origin: { x: 0.8, y: 0.68 },
        },
      },
    ];
  }

  if (kind === 'clue_unlocked' || kind === 'guess_who_win') {
    return [
      {
        delayMs: 0,
        options: {
          ...base,
          particleCount: 80,
          spread: 85,
          startVelocity: 42,
          scalar: 1.05,
          origin: { x: 0.5, y: 0.55 },
        },
      },
      {
        delayMs: 160,
        options: {
          ...base,
          particleCount: 40,
          spread: 100,
          startVelocity: 30,
          origin: { x: 0.5, y: 0.48 },
        },
      },
    ];
  }

  // guess_who_done (completed quiz without exact match — lighter celebratory pop)
  return [
    {
      delayMs: 0,
      options: {
        ...base,
        particleCount: 40,
        spread: 60,
        startVelocity: 30,
        origin: { x: 0.5, y: 0.58 },
      },
    },
  ];
}
