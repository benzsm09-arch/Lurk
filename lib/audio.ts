import { VOICE_FILTERS, VoiceFilter } from './whisperlink';

let activeCtx: AudioContext | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

export function stopSimulatedVoice(): void {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (activeCtx) {
    try {
      activeCtx.close();
    } catch {
      // Ignore audio context close errors
    }
    activeCtx = null;
  }
}

export function playSimulatedVoice(
  filter: VoiceFilter,
  durationSec: number,
  onComplete?: () => void
): void {
  stopSimulatedVoice();

  if (typeof window === 'undefined') {
    onComplete?.();
    return;
  }

  const playMs = Math.min(3500, Math.max(1500, durationSec * 500));

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioCtx) {
      stopTimer = setTimeout(() => onComplete?.(), playMs);
      return;
    }

    const ctx = new AudioCtx();
    activeCtx = ctx;
    const spec = VOICE_FILTERS[filter];

    const osc = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const masterGain = ctx.createGain();

    osc.type =
      filter === 'robot_echo'
        ? 'sawtooth'
        : filter === 'whisper_radio'
          ? 'triangle'
          : 'sine';
    osc.frequency.setValueAtTime(spec.baseFreq, ctx.currentTime);

    // Expressive syllable-like pitch contour
    const steps = 8;
    const stepDur = playMs / 1000 / steps;
    for (let i = 0; i < steps; i++) {
      const ratio = i % 2 === 0 ? 1.14 : 0.88;
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(70, spec.baseFreq * ratio),
        ctx.currentTime + i * stepDur + stepDur * 0.6
      );
    }

    mod.type = 'sine';
    mod.frequency.setValueAtTime(
      filter === 'robot_echo' ? 28 : filter === 'chipmunk' ? 14 : 7,
      ctx.currentTime
    );
    modGain.gain.setValueAtTime(filter === 'robot_echo' ? 45 : 18, ctx.currentTime);

    mod.connect(modGain);
    modGain.connect(osc.frequency);

    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.08);
    masterGain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + playMs / 1000
    );

    osc.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc.start();
    mod.start();
    osc.stop(ctx.currentTime + playMs / 1000);
    mod.stop(ctx.currentTime + playMs / 1000);

    stopTimer = setTimeout(() => {
      stopSimulatedVoice();
      onComplete?.();
    }, playMs);
  } catch {
    stopTimer = setTimeout(() => onComplete?.(), playMs);
  }
}

export function playCelebrationChime(notes: number[]): void {
  if (typeof window === 'undefined' || notes.length === 0) return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const start = ctx.currentTime + 0.01;
    const step = 0.075;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteStart = start + idx * step;
      const noteEnd = noteStart + 0.22;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.045, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteStart);
      osc.stop(noteEnd);
    });

    const totalMs = Math.ceil((notes.length * step + 0.35) * 1000);
    window.setTimeout(() => {
      try {
        void ctx.close();
      } catch {
        // Ignore close error
      }
    }, totalMs);
  } catch {
    // Ignore autoplay / audio context restrictions
  }
}
