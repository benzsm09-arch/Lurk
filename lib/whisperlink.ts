export type GameMode =
  | 'none'
  | 'guess_who'
  | 'truth_or_dare'
  | 'clue_drop'
  | 'voice_note';

export type VoiceFilter =
  | 'chipmunk'
  | 'deep_midnight'
  | 'robot_echo'
  | 'whisper_radio';

export type InboxFilter = 'all' | Exclude<GameMode, 'none'>;

export type ThemePreference = 'light' | 'dark' | 'system';

export interface GuessWhoPayload {
  options: [string, string, string, string];
  correctIndex: number;
  selectedIndex: number | null;
}

export interface TruthOrDarePayload {
  kind: 'Truth' | 'Dare';
  prompt: string;
}

export interface ClueDropPayload {
  hint: string;
  unlocked: boolean;
  progress: number;
  requiredSteps: number;
}

export interface VoiceNotePayload {
  filter: VoiceFilter;
  durationSec: number;
  waveform: number[];
}

export interface WhisperMessage {
  id: string;
  senderAlias: string;
  text: string;
  createdAtLabel: string;
  createdAtMs: number;
  gameMode: GameMode;
  guessWho?: GuessWhoPayload;
  truthOrDare?: TruthOrDarePayload;
  clueDrop?: ClueDropPayload;
  voiceNote?: VoiceNotePayload;
  isRead: boolean;
  repliedText?: string;
}

export interface UserProfile {
  handle: string;
  displayName: string;
  status: string;
  promptHeadline: string;
  avatarUrl: string;
}

export interface MessageDraft {
  text: string;
  gameMode: GameMode;
  guessOptions: [string, string, string, string];
  guessCorrectIndex: number;
  truthOrDare: TruthOrDarePayload | null;
  clueHint: string;
  voiceFilter: VoiceFilter;
  voiceDurationSec: number;
  voiceRecorded: boolean;
}

export const DEFAULT_PROFILE: UserProfile = {
  handle: '@prettyychaos_',
  displayName: 'Maya Lin',
  status: 'Answering confessions tonight',
  promptHeadline: "Send me something you've never told me.",
  avatarUrl: '/images/character-avatar.jpg',
};

export const QUICK_ICEBREAKERS: string[] = [
  'Your 2am playlist hits way too hard.',
  'Honest first impression: intimidating until you laughed.',
  'Are we pretending we did not make eye contact earlier?',
  'Drop the unfiltered story behind your latest close friends post.',
];

export const TRUTH_OR_DARE_PROMPTS: TruthOrDarePayload[] = [
  {
    kind: 'Truth',
    prompt: 'Who in your recent chats would you never hand your unlocked phone to?',
  },
  {
    kind: 'Dare',
    prompt: 'Post the third photo in your camera roll to your Story with zero context.',
  },
  {
    kind: 'Truth',
    prompt: 'What is a tiny white lie you told this week that nobody caught?',
  },
  {
    kind: 'Dare',
    prompt: 'Send a voice reply reading this confession in your most dramatic movie-trailer voice.',
  },
  {
    kind: 'Truth',
    prompt: 'Which friend in the group chat gives the worst dating advice?',
  },
  {
    kind: 'Dare',
    prompt: 'Text your last DM "we need to talk" and reply in 10 seconds with a meme.',
  },
  {
    kind: 'Truth',
    prompt: 'What song is currently on repeat that you refuse to play on aux?',
  },
  {
    kind: 'Dare',
    prompt: 'Screenshot your screen-time top app and share it with this answer.',
  },
];

export const VOICE_FILTERS: Record<
  VoiceFilter,
  { label: string; pitchLabel: string; baseFreq: number; rateMultiplier: number }
> = {
  chipmunk: {
    label: 'Helium Shift',
    pitchLabel: '+7 semitones',
    baseFreq: 520,
    rateMultiplier: 1.45,
  },
  deep_midnight: {
    label: 'Deep Midnight',
    pitchLabel: '-6 semitones',
    baseFreq: 145,
    rateMultiplier: 0.78,
  },
  robot_echo: {
    label: 'Vocoder Echo',
    pitchLabel: 'Modulated',
    baseFreq: 260,
    rateMultiplier: 1.0,
  },
  whisper_radio: {
    label: 'Lo-Fi Radio',
    pitchLabel: 'Bandpass',
    baseFreq: 330,
    rateMultiplier: 0.95,
  },
};

export const GAME_MODE_META: Record<
  GameMode,
  { label: string; shortLabel: string; description: string }
> = {
  none: {
    label: 'Classic Whisper',
    shortLabel: 'Classic',
    description: 'Pure anonymous confession with zero extras.',
  },
  guess_who: {
    label: 'Guess Who Quiz',
    shortLabel: 'Guess Who',
    description: 'Attach 4 suspect options and make them guess you.',
  },
  truth_or_dare: {
    label: 'Truth or Dare',
    shortLabel: 'Truth or Dare',
    description: 'Spin a bold Truth or Dare prompt onto your note.',
  },
  clue_drop: {
    label: 'Clue Drop',
    shortLabel: 'Clue Drop',
    description: 'Hide a hint they unlock by beating a 3-step cipher.',
  },
  voice_note: {
    label: 'Voice Mask',
    shortLabel: 'Voice Note',
    description: 'Send a pitch-masked voice snippet with live waveform.',
  },
};

export function generateDeterministicWaveform(seedText: string, bars = 24): number[] {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const result: number[] = [];
  for (let i = 0; i < bars; i++) {
    hash ^= i + 0x9e3779b9;
    hash = Math.imul(hash, 16777619);
    const normalized = ((hash >>> 0) % 75) / 100 + 0.25;
    result.push(Number(normalized.toFixed(2)));
  }
  return result;
}

export const INITIAL_MESSAGES: WhisperMessage[] = [
  {
    id: 'msg-seed-1',
    senderAlias: 'anon-m821',
    text: 'Wait so are you actually going to tell everyone who drove you home after the gallery opening?',
    createdAtLabel: '4m ago',
    createdAtMs: 1795011250000,
    gameMode: 'clue_drop',
    clueDrop: {
      hint: 'Starts with M · We split an iced matcha before Thursday studio.',
      unlocked: false,
      progress: 0,
      requiredSteps: 3,
    },
    isRead: false,
  },
  {
    id: 'msg-seed-2',
    senderAlias: 'anon-k309',
    text: 'Be honest—one of the four of us still owes you $18 for tacos and hopes you forgot.',
    createdAtLabel: '19m ago',
    createdAtMs: 1795010350000,
    gameMode: 'guess_who',
    guessWho: {
      options: ['Marcus', 'Priya', 'Devon', 'Sienna'],
      correctIndex: 2,
      selectedIndex: null,
    },
    isRead: false,
  },
  {
    id: 'msg-seed-3',
    senderAlias: 'anon-r412',
    text: 'Recorded this outside the coffee shop so you cannot recognize my laugh.',
    createdAtLabel: '42m ago',
    createdAtMs: 1795008970000,
    gameMode: 'voice_note',
    voiceNote: {
      filter: 'deep_midnight',
      durationSec: 6,
      waveform: generateDeterministicWaveform('coffee-shop-midnight', 24),
    },
    isRead: true,
  },
  {
    id: 'msg-seed-4',
    senderAlias: 'anon-t105',
    text: 'No dodging this one if it goes on your Story tonight.',
    createdAtLabel: '1h ago',
    createdAtMs: 1795007890000,
    gameMode: 'truth_or_dare',
    truthOrDare: {
      kind: 'Truth',
      prompt: 'Who in your recent chats would you never hand your unlocked phone to?',
    },
    isRead: true,
  },
  {
    id: 'msg-seed-5',
    senderAlias: 'anon-c994',
    text: 'Lowkey miss our midnight diner runs after finals. We need a rematch this weekend.',
    createdAtLabel: '3h ago',
    createdAtMs: 1795000690000,
    gameMode: 'none',
    isRead: true,
  },
];

export const MAX_VOICE_DURATION_SEC = 300;

export function createInitialDraft(): MessageDraft {
  return {
    text: '',
    gameMode: 'none',
    guessOptions: ['', '', '', ''],
    guessCorrectIndex: 0,
    truthOrDare: null,
    clueHint: '',
    voiceFilter: 'deep_midnight',
    voiceDurationSec: MAX_VOICE_DURATION_SEC,
    voiceRecorded: false,
  };
}

export function sanitizeMessageDraft(raw: unknown): MessageDraft {
  const fallback = createInitialDraft();
  if (!raw || typeof raw !== 'object') return fallback;
  const obj = raw as Partial<MessageDraft>;

  const validModes: GameMode[] = [
    'none',
    'guess_who',
    'truth_or_dare',
    'clue_drop',
    'voice_note',
  ];
  const validFilters: VoiceFilter[] = [
    'chipmunk',
    'deep_midnight',
    'robot_echo',
    'whisper_radio',
  ];

  const options = Array.isArray(obj.guessOptions) && obj.guessOptions.length === 4
    ? (obj.guessOptions.map((item) => (typeof item === 'string' ? item : '')) as [
        string,
        string,
        string,
        string,
      ])
    : fallback.guessOptions;

  const truthOrDare =
    obj.truthOrDare &&
    typeof obj.truthOrDare === 'object' &&
    (obj.truthOrDare.kind === 'Truth' || obj.truthOrDare.kind === 'Dare') &&
    typeof obj.truthOrDare.prompt === 'string'
      ? obj.truthOrDare
      : null;

  return {
    text: typeof obj.text === 'string' ? obj.text.slice(0, 300) : '',
    gameMode:
      obj.gameMode && validModes.includes(obj.gameMode)
        ? obj.gameMode
        : fallback.gameMode,
    guessOptions: options,
    guessCorrectIndex:
      typeof obj.guessCorrectIndex === 'number' &&
      obj.guessCorrectIndex >= 0 &&
      obj.guessCorrectIndex <= 3
        ? obj.guessCorrectIndex
        : 0,
    truthOrDare,
    clueHint: typeof obj.clueHint === 'string' ? obj.clueHint.slice(0, 80) : '',
    voiceFilter:
      obj.voiceFilter && validFilters.includes(obj.voiceFilter)
        ? obj.voiceFilter
        : fallback.voiceFilter,
    voiceDurationSec:
      typeof obj.voiceDurationSec === 'number' && obj.voiceDurationSec >= 1
        ? Math.min(MAX_VOICE_DURATION_SEC, obj.voiceDurationSec)
        : MAX_VOICE_DURATION_SEC,
    voiceRecorded: Boolean(obj.voiceRecorded),
  };
}

export function sanitizeUserProfile(raw: unknown): UserProfile {
  if (!raw || typeof raw !== 'object') return DEFAULT_PROFILE;
  const obj = raw as Partial<UserProfile>;
  const rawAvatar = typeof obj.avatarUrl === 'string' ? obj.avatarUrl.trim() : '';
  const isSafeAvatar =
    (rawAvatar.startsWith('/') && rawAvatar !== '/images/profile-avatar.jpg') ||
    /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(rawAvatar);
  const avatarUrl = isSafeAvatar ? rawAvatar : DEFAULT_PROFILE.avatarUrl;

  return {
    handle:
      typeof obj.handle === 'string' && obj.handle.trim().length > 0
        ? obj.handle
        : DEFAULT_PROFILE.handle,
    displayName:
      typeof obj.displayName === 'string' && obj.displayName.trim().length > 0
        ? obj.displayName
        : DEFAULT_PROFILE.displayName,
    status:
      typeof obj.status === 'string' && obj.status.trim().length > 0
        ? obj.status
        : DEFAULT_PROFILE.status,
    promptHeadline:
      typeof obj.promptHeadline === 'string' && obj.promptHeadline.trim().length > 0
        ? obj.promptHeadline
        : DEFAULT_PROFILE.promptHeadline,
    avatarUrl,
  };
}

export function sanitizeThemePreference(
  rawPref: unknown,
  legacyIsDark?: unknown
): ThemePreference {
  if (rawPref === 'light' || rawPref === 'dark' || rawPref === 'system') {
    return rawPref;
  }
  if (typeof legacyIsDark === 'boolean') {
    return legacyIsDark ? 'dark' : 'light';
  }
  return 'system';
}

export function resolveThemeIsDark(
  preference: ThemePreference,
  systemPrefersDark: boolean
): boolean {
  if (preference === 'dark') return true;
  if (preference === 'light') return false;
  return systemPrefersDark;
}

export function spinTruthOrDarePrompt(
  currentPrompt?: string,
  randomFn: () => number = Math.random
): TruthOrDarePayload {
  const pool = currentPrompt
    ? TRUTH_OR_DARE_PROMPTS.filter((item) => item.prompt !== currentPrompt)
    : TRUTH_OR_DARE_PROMPTS;
  const idx = Math.floor(randomFn() * pool.length) % pool.length;
  return pool[idx] ?? TRUTH_OR_DARE_PROMPTS[0];
}

export function validateMessageDraft(draft: MessageDraft): {
  valid: boolean;
  error?: string;
} {
  const trimmed = draft.text.trim();
  if (trimmed.length < 2) {
    return {
      valid: false,
      error: 'Write at least 2 characters before sending your whisper.',
    };
  }
  if (trimmed.length > 300) {
    return {
      valid: false,
      error: 'Keep your message under 300 characters.',
    };
  }

  if (draft.gameMode === 'guess_who') {
    const cleaned = draft.guessOptions.map((opt) => opt.trim());
    if (cleaned.some((opt) => opt.length === 0)) {
      return {
        valid: false,
        error: 'Fill in all 4 friend options for the Guess Who quiz.',
      };
    }
  }

  if (draft.gameMode === 'clue_drop' && draft.clueHint.trim().length < 2) {
    return {
      valid: false,
      error: 'Add an identity clue (at least 2 characters) for Clue Drop.',
    };
  }

  if (draft.gameMode === 'truth_or_dare' && !draft.truthOrDare) {
    return {
      valid: false,
      error: 'Spin the wheel to attach a Truth or Dare prompt.',
    };
  }

  if (draft.gameMode === 'voice_note' && !draft.voiceRecorded) {
    return {
      valid: false,
      error: 'Tap Record / Simulate Voice Note before attaching it.',
    };
  }

  return { valid: true };
}

export function createWhisperMessage(
  draft: MessageDraft,
  nowMs: number = Date.now()
): WhisperMessage {
  const cleanText = draft.text.trim();
  const shortHash = Math.abs(nowMs % 10000)
    .toString(16)
    .padStart(4, '0');

  const base: WhisperMessage = {
    id: `msg-${nowMs}-${shortHash}`,
    senderAlias: `anon-${shortHash}`,
    text: cleanText,
    createdAtLabel: 'Just now',
    createdAtMs: nowMs,
    gameMode: draft.gameMode,
    isRead: false,
  };

  if (draft.gameMode === 'guess_who') {
    const options = draft.guessOptions.map((o) => o.trim()) as [
      string,
      string,
      string,
      string,
    ];
    base.guessWho = {
      options,
      correctIndex: Math.min(3, Math.max(0, draft.guessCorrectIndex)),
      selectedIndex: null,
    };
  } else if (draft.gameMode === 'truth_or_dare' && draft.truthOrDare) {
    base.truthOrDare = { ...draft.truthOrDare };
  } else if (draft.gameMode === 'clue_drop') {
    base.clueDrop = {
      hint: draft.clueHint.trim(),
      unlocked: false,
      progress: 0,
      requiredSteps: 3,
    };
  } else if (draft.gameMode === 'voice_note') {
    base.voiceNote = {
      filter: draft.voiceFilter,
      durationSec: Math.max(
        1,
        Math.min(MAX_VOICE_DURATION_SEC, draft.voiceDurationSec)
      ),
      waveform: generateDeterministicWaveform(`${cleanText}-${draft.voiceFilter}-${nowMs}`, 24),
    };
  }

  return base;
}

export function computeRemainingRecordSeconds(
  startedAtMs: number,
  nowMs: number,
  maxSec: number = MAX_VOICE_DURATION_SEC
): number {
  const elapsed = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  return Math.max(0, maxSec - elapsed);
}

export function computeElapsedRecordSeconds(
  startedAtMs: number,
  nowMs: number,
  maxSec: number = MAX_VOICE_DURATION_SEC
): number {
  const elapsed = Math.round(Math.max(0, nowMs - startedAtMs) / 1000);
  return Math.min(maxSec, Math.max(1, elapsed));
}

export function formatVoiceDuration(durationSec: number): string {
  const safeSec = Math.max(0, Math.floor(durationSec));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function filterInboxMessages(
  messages: WhisperMessage[],
  filter: InboxFilter,
  blockedAliases: string[]
): WhisperMessage[] {
  const blockedSet = new Set(blockedAliases);
  return messages.filter((msg) => {
    if (blockedSet.has(msg.senderAlias)) return false;
    if (filter === 'all') return true;
    return msg.gameMode === filter;
  });
}

export function countMessagesByFilter(
  messages: WhisperMessage[],
  blockedAliases: string[]
): Record<InboxFilter, number> {
  const blockedSet = new Set(blockedAliases);
  const visible = messages.filter((msg) => !blockedSet.has(msg.senderAlias));
  return {
    all: visible.length,
    guess_who: visible.filter((m) => m.gameMode === 'guess_who').length,
    clue_drop: visible.filter((m) => m.gameMode === 'clue_drop').length,
    voice_note: visible.filter((m) => m.gameMode === 'voice_note').length,
    truth_or_dare: visible.filter((m) => m.gameMode === 'truth_or_dare').length,
  };
}

export function answerGuessWho(
  messages: WhisperMessage[],
  messageId: string,
  chosenIndex: number
): { updatedMessages: WhisperMessage[]; isCorrect: boolean } {
  let isCorrect = false;
  const updatedMessages = messages.map((msg) => {
    if (msg.id !== messageId || !msg.guessWho) return msg;
    isCorrect = msg.guessWho.correctIndex === chosenIndex;
    return {
      ...msg,
      isRead: true,
      guessWho: {
        ...msg.guessWho,
        selectedIndex: chosenIndex,
      },
    };
  });
  return { updatedMessages, isCorrect };
}

export function advanceClueUnlock(
  messages: WhisperMessage[],
  messageId: string
): WhisperMessage[] {
  return messages.map((msg) => {
    if (msg.id !== messageId || !msg.clueDrop) return msg;
    if (msg.clueDrop.unlocked) return msg;
    const nextProgress = Math.min(
      msg.clueDrop.requiredSteps,
      msg.clueDrop.progress + 1
    );
    return {
      ...msg,
      isRead: true,
      clueDrop: {
        ...msg.clueDrop,
        progress: nextProgress,
        unlocked: nextProgress >= msg.clueDrop.requiredSteps,
      },
    };
  });
}

export function blockSenderAndDelete(
  messages: WhisperMessage[],
  blockedAliases: string[],
  messageId: string
): { updatedMessages: WhisperMessage[]; updatedBlockedAliases: string[] } {
  const target = messages.find((m) => m.id === messageId);
  const updatedMessages = messages.filter((m) => m.id !== messageId);
  const updatedBlockedAliases =
    target && !blockedAliases.includes(target.senderAlias)
      ? [...blockedAliases, target.senderAlias]
      : blockedAliases;
  return { updatedMessages, updatedBlockedAliases };
}
