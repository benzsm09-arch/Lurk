'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Dices,
  HelpCircle,
  KeyRound,
  Lock,
  MessageSquareHeart,
  Mic,
  Play,
  RotateCw,
  Send,
  ShieldCheck,
  Square,
  Users,
  Volume2,
} from 'lucide-react';
import {
  GAME_MODE_META,
  GameMode,
  MAX_VOICE_DURATION_SEC,
  MessageDraft,
  QUICK_ICEBREAKERS,
  UserProfile,
  VOICE_FILTERS,
  VoiceFilter,
  computeElapsedRecordSeconds,
  computeRemainingRecordSeconds,
  formatVoiceDuration,
  generateDeterministicWaveform,
  spinTruthOrDarePrompt,
  validateMessageDraft,
} from '@/lib/whisperlink';
import { playSimulatedVoice, stopSimulatedVoice } from '@/lib/audio';
import { triggerConfettiExplosion } from '@/lib/confetti';
import { triggerHaptic } from '@/lib/haptics';
import {
  FriendViewItem,
  assignFriendToGuessOptions,
  fillGuessOptionsWithFriends,
} from '@/lib/friends';

interface SendWhisperViewProps {
  profile: UserProfile;
  draft: MessageDraft;
  acceptedFriends: FriendViewItem[];
  onDraftChange: (
    updater: MessageDraft | ((prev: MessageDraft) => MessageDraft)
  ) => void;
  onSendMessage: (draft: MessageDraft) => void;
  onGoToInbox: () => void;
  onGoToFriends: () => void;
  onOpenGuidelines: () => void;
}

const MODE_OPTIONS: {
  id: GameMode;
  label: string;
  icon: typeof MessageSquareHeart;
}[] = [
  { id: 'none', label: 'Classic', icon: MessageSquareHeart },
  { id: 'guess_who', label: 'Guess Who', icon: HelpCircle },
  { id: 'truth_or_dare', label: 'Truth / Dare', icon: Dices },
  { id: 'clue_drop', label: 'Clue Drop', icon: KeyRound },
  { id: 'voice_note', label: 'Voice Note', icon: Mic },
];

export default function SendWhisperView({
  profile,
  draft,
  acceptedFriends,
  onDraftChange: setDraft,
  onSendMessage,
  onGoToInbox,
  onGoToFriends,
  onOpenGuidelines,
}: SendWhisperViewProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isRecordingSim, setIsRecordingSim] = useState(false);
  const [remainingRecordSec, setRemainingRecordSec] = useState(
    MAX_VOICE_DURATION_SEC
  );
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [waveformTick, setWaveformTick] = useState(0);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const recordStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecordingSim && !isPreviewPlaying) return;
    const interval = setInterval(() => {
      setWaveformTick((tick) => tick + 1);
      if (isRecordingSim && recordStartedAtRef.current !== null) {
        const nextRemaining = computeRemainingRecordSeconds(
          recordStartedAtRef.current,
          Date.now()
        );
        setRemainingRecordSec(nextRemaining);
        if (nextRemaining <= 0) {
          recordStartedAtRef.current = null;
          setDraft((prev) => ({
            ...prev,
            voiceRecorded: true,
            voiceDurationSec: MAX_VOICE_DURATION_SEC,
          }));
          setIsRecordingSim(false);
        }
      }
    }, 105);
    return () => clearInterval(interval);
  }, [isRecordingSim, isPreviewPlaying, setDraft]);

  useEffect(() => {
    return () => {
      stopSimulatedVoice();
    };
  }, []);

  const handleSelectMode = (mode: GameMode) => {
    setErrorMsg(null);
    triggerHaptic('tap_light');
    if (mode !== 'voice_note') {
      if (isRecordingSim) {
        recordStartedAtRef.current = null;
        setIsRecordingSim(false);
      }
      if (isPreviewPlaying) {
        stopSimulatedVoice();
        setIsPreviewPlaying(false);
      }
    }
    setDraft((prev) => ({
      ...prev,
      gameMode: mode,
      truthOrDare:
        mode === 'truth_or_dare' && !prev.truthOrDare
          ? spinTruthOrDarePrompt()
          : prev.truthOrDare,
    }));
  };

  const handleSpinTruthOrDare = () => {
    setIsSpinning(true);
    setErrorMsg(null);
    triggerHaptic('tap_light');
    setTimeout(() => {
      setDraft((prev) => ({
        ...prev,
        truthOrDare: spinTruthOrDarePrompt(prev.truthOrDare?.prompt),
      }));
      setIsSpinning(false);
    }, 180);
  };

  const handleSimulateVoiceRecord = () => {
    setErrorMsg(null);
    if (isRecordingSim) {
      triggerHaptic('record_stop');
      const startedAt = recordStartedAtRef.current ?? Date.now();
      const recordedSec = computeElapsedRecordSeconds(startedAt, Date.now());
      recordStartedAtRef.current = null;
      setDraft((prev) => ({
        ...prev,
        voiceRecorded: true,
        voiceDurationSec: recordedSec,
      }));
      setIsRecordingSim(false);
      return;
    }

    if (isPreviewPlaying) {
      stopSimulatedVoice();
      setIsPreviewPlaying(false);
    }

    triggerHaptic('record_start');
    recordStartedAtRef.current = Date.now();
    setRemainingRecordSec(MAX_VOICE_DURATION_SEC);
    setIsRecordingSim(true);
  };

  const handlePreviewVoice = () => {
    if (isPreviewPlaying) {
      stopSimulatedVoice();
      setIsPreviewPlaying(false);
      return;
    }
    setIsPreviewPlaying(true);
    playSimulatedVoice(draft.voiceFilter, draft.voiceDurationSec, () => {
      setIsPreviewPlaying(false);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateMessageDraft(draft);
    if (!check.valid) {
      triggerHaptic('error_nudge');
      setErrorMsg(check.error ?? 'Please complete your message.');
      return;
    }
    setErrorMsg(null);
    onSendMessage(draft);
    setSentSuccess(true);
    triggerConfettiExplosion('whisper_sent', profile.handle);
    stopSimulatedVoice();
    setIsPreviewPlaying(false);
  };

  const baseWaveform = generateDeterministicWaveform(
    `${draft.text || 'whisper'}-${draft.voiceFilter}`,
    24
  );

  const activeWaveform = baseWaveform.map((bar, idx) => {
    if (isRecordingSim) {
      const wave =
        0.3 +
        0.7 *
          Math.abs(
            Math.sin(waveformTick * 0.72 + idx * 0.52) *
              Math.cos(waveformTick * 0.31 - idx * 0.24)
          );
      return Number(Math.min(1, wave).toFixed(2));
    }
    if (isPreviewPlaying) {
      const head = (waveformTick * 2) % baseWaveform.length;
      const dist = Math.abs(head - idx);
      const boost = dist <= 2 ? 0.32 - dist * 0.09 : 0;
      return Number(Math.min(1, bar + boost).toFixed(2));
    }
    if (draft.voiceRecorded) {
      return bar;
    }
    return Number((0.18 + (idx % 3) * 0.06).toFixed(2));
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-12 md:pt-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Profile Card + Message Composer */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {sentSuccess ? (
              <motion.section
                key="sent-success"
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl border border-rose-200/70 bg-white/85 p-8 text-center backdrop-blur-xl shadow-sm dark:border-white/10 dark:bg-[#17121C]/90"
              >
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl whisper-gradient text-white whisper-glow">
                  <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                </div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#191116] dark:text-white text-balance">
                  Whisper delivered anonymously
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#64535C] dark:text-[#B4A6AF]">
                  Your message and game attachment are now waiting in{' '}
                  <span className="font-semibold text-[#191116] dark:text-white">
                    {profile.handle}
                  </span>
                  &apos;s inbox with zero identity metadata exposed.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => setSentSuccess(false)}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl whisper-gradient px-6 py-3 text-sm font-bold text-white whisper-glow transition-transform active:scale-[0.98] whitespace-nowrap cursor-pointer"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>Send Another Whisper</span>
                  </button>
                  <button
                    type="button"
                    onClick={onGoToInbox}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-6 py-3 text-sm font-semibold text-[#191116] transition-colors hover:bg-rose-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 whitespace-nowrap cursor-pointer"
                  >
                    <span>Open Owner Inbox</span>
                  </button>
                </div>
              </motion.section>
            ) : (
              <motion.form
                key="composer-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden rounded-3xl border border-rose-200/75 bg-white/90 backdrop-blur-xl shadow-sm dark:border-white/10 dark:bg-[#17121C]/90"
              >
                {/* Profile Header with Sunset Gradient */}
                <div className="whisper-gradient px-6 py-5 text-white">
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white/75 bg-white/20">
                      {!avatarFailed ? (
                        <Image
                          key={profile.avatarUrl}
                          src={profile.avatarUrl}
                          alt={`${profile.displayName} (${profile.handle})`}
                          fill
                          sizes="56px"
                          referrerPolicy="no-referrer"
                          className="object-cover"
                          onError={() => setAvatarFailed(true)}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-display text-lg font-bold text-white">
                          {profile.displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <h1 className="font-display text-lg font-extrabold tracking-tight truncate">
                          {profile.handle}
                        </h1>
                        <span className="text-xs font-medium text-white/85">
                          {profile.displayName}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-white/90">
                        {profile.status}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 font-display text-xl font-bold leading-snug tracking-tight text-white text-balance">
                    {profile.promptHeadline}
                  </p>
                </div>

                {/* Message Input Body */}
                <div className="p-6 space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label
                        htmlFor="whisper-message-input"
                        className="text-xs font-semibold text-[#64535C] dark:text-[#B4A6AF]"
                      >
                        Anonymous Message
                      </label>
                      <div className="flex items-center gap-2 text-xs text-[#64535C] dark:text-[#A696A1]">
                        {draft.text.trim().length > 0 && (
                          <>
                            <span>Draft saved</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span className="font-mono-tabular">
                          {draft.text.length}/300
                        </span>
                      </div>
                    </div>

                    <textarea
                      id="whisper-message-input"
                      rows={4}
                      maxLength={300}
                      value={draft.text}
                      onChange={(e) => {
                        setErrorMsg(null);
                        setDraft((prev) => ({ ...prev, text: e.target.value }));
                      }}
                      placeholder="Drop a confession, hot take, or secret question..."
                      className="w-full resize-none rounded-2xl border border-rose-200/80 bg-[#FFF9F8] p-4 text-base text-[#191116] placeholder:text-[#96838D] focus:border-[#FF2E63] focus:outline-none focus:ring-2 focus:ring-[#FF2E63]/20 dark:border-white/12 dark:bg-[#100C14] dark:text-[#F9F5F7] dark:placeholder:text-[#7D6E78]"
                    />

                    {/* Quick Icebreakers */}
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {QUICK_ICEBREAKERS.map((icebreaker) => (
                        <button
                          key={icebreaker}
                          type="button"
                          onClick={() => {
                            setErrorMsg(null);
                            triggerHaptic('tap_light');
                            setDraft((prev) => ({ ...prev, text: icebreaker }));
                          }}
                          className="min-h-[40px] rounded-xl border border-rose-200/70 bg-rose-50/70 px-3 py-2 text-left text-xs font-medium leading-snug text-[#4D3A43] transition-colors hover:border-[#FF2E63]/40 hover:bg-rose-100/70 dark:border-white/10 dark:bg-white/5 dark:text-[#D5C9D0] dark:hover:bg-white/10 cursor-pointer"
                        >
                          {icebreaker}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Game Mode Selector */}
                  <div>
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#64535C] dark:text-[#B4A6AF]">
                        Attach Mini-Game or Clue
                      </span>
                      <span className="text-xs text-[#64535C] dark:text-[#A696A1]">
                        Optional
                      </span>
                    </div>

                    <div
                      role="tablist"
                      aria-label="Game mode attachment"
                      className="grid grid-cols-2 gap-2 sm:grid-cols-5"
                    >
                      {MODE_OPTIONS.map((mode) => {
                        const Icon = mode.icon;
                        const active = draft.gameMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => handleSelectMode(mode.id)}
                            className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                              active
                                ? 'border-[#FF2E63] bg-[#FF2E63]/10 text-[#D91B4E] dark:border-[#FF7A59] dark:bg-[#FF2E63]/20 dark:text-white'
                                : 'border-rose-200/70 bg-white text-[#57454E] hover:border-rose-300 dark:border-white/10 dark:bg-white/5 dark:text-[#C5B6BF] dark:hover:bg-white/10'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile / Inline Game Mode Builder (visible on all viewports for zero-friction flow) */}
                  {draft.gameMode !== 'none' && (
                    <div className="rounded-2xl border border-rose-200/80 bg-[#FFF9F8] p-4 dark:border-white/10 dark:bg-[#110D16]">
                      {draft.gameMode === 'guess_who' && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-[#191116] dark:text-white">
                              Guess Who Quiz · Enter 4 friend names &amp; mark yourself
                            </p>
                            {acceptedFriends.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setErrorMsg(null);
                                  triggerHaptic('tap_light');
                                  setDraft((prev) => ({
                                    ...prev,
                                    guessOptions: fillGuessOptionsWithFriends(
                                      prev.guessOptions,
                                      acceptedFriends
                                    ),
                                  }));
                                }}
                                className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-rose-200/80 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#D91B4E] hover:bg-rose-50 dark:border-white/15 dark:bg-white/5 dark:text-[#FF8C6B] cursor-pointer"
                              >
                                <Users className="h-3 w-3" aria-hidden="true" />
                                <span>Fill from Friends</span>
                              </button>
                            )}
                          </div>

                          {/* Pick from Friends Bar */}
                          <div className="rounded-xl border border-rose-200/70 bg-white/80 p-3 dark:border-white/10 dark:bg-[#191320]/70">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-[#64535C] dark:text-[#B4A6AF]">
                                Pick from Accepted Friends
                              </span>
                              <button
                                type="button"
                                onClick={onGoToFriends}
                                className="text-[11px] font-semibold text-[#D91B4E] hover:underline dark:text-[#FF7A59] cursor-pointer"
                              >
                                Manage Friends
                              </button>
                            </div>

                            {acceptedFriends.length === 0 ? (
                              <p className="mt-1.5 text-xs text-[#64535C] dark:text-[#A696A1]">
                                No accepted friends yet. Send or accept friend
                                requests in the{' '}
                                <button
                                  type="button"
                                  onClick={onGoToFriends}
                                  className="font-semibold text-[#D91B4E] underline-offset-2 hover:underline dark:text-[#FF7A59] cursor-pointer"
                                >
                                  Friends tab
                                </button>{' '}
                                to pick them here.
                              </p>
                            ) : (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {acceptedFriends.map((friend) => {
                                  const isSelected = draft.guessOptions.some(
                                    (opt) =>
                                      opt.trim().toLowerCase() ===
                                      friend.displayName.trim().toLowerCase()
                                  );
                                  return (
                                    <button
                                      key={friend.friendshipId}
                                      type="button"
                                      onClick={() => {
                                        setErrorMsg(null);
                                        triggerHaptic('tap_light');
                                        setDraft((prev) => {
                                          const { options } =
                                            assignFriendToGuessOptions(
                                              prev.guessOptions,
                                              friend.displayName
                                            );
                                          return {
                                            ...prev,
                                            guessOptions: options,
                                          };
                                        });
                                      }}
                                      className={`inline-flex min-h-[38px] items-center gap-2 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'border-[#FF2E63] bg-[#FF2E63]/10 text-[#D91B4E] dark:border-[#FF7A59] dark:bg-[#FF2E63]/20 dark:text-white'
                                          : 'border-rose-200/80 bg-[#FFF9F8] text-[#191116] hover:border-[#FF2E63]/40 dark:border-white/10 dark:bg-white/5 dark:text-white'
                                      }`}
                                    >
                                      <span>{friend.displayName}</span>
                                      <span className="text-[10px] text-[#64535C] dark:text-[#A696A1]">
                                        {isSelected ? '✓' : '+'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {draft.guessOptions.map((opt, idx) => {
                              const isCorrect = draft.guessCorrectIndex === idx;
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 rounded-xl border border-rose-200/80 bg-white px-2.5 py-1.5 dark:border-white/10 dark:bg-[#191320]"
                                >
                                  <button
                                    type="button"
                                    aria-label={`Mark option ${idx + 1} as the real sender`}
                                    onClick={() =>
                                      setDraft((prev) => ({
                                        ...prev,
                                        guessCorrectIndex: idx,
                                      }))
                                    }
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                      isCorrect
                                        ? 'whisper-gradient text-white'
                                        : 'bg-rose-100/80 text-[#64535C] dark:bg-white/10 dark:text-[#A696A1]'
                                    }`}
                                    title={
                                      isCorrect
                                        ? 'Selected as correct sender'
                                        : 'Set as correct sender'
                                    }
                                  >
                                    {isCorrect ? '✓' : idx + 1}
                                  </button>
                                  <input
                                    type="text"
                                    value={opt}
                                    aria-label={`Friend option ${idx + 1}`}
                                    placeholder={`Friend ${idx + 1}`}
                                    maxLength={28}
                                    onChange={(e) => {
                                      setErrorMsg(null);
                                      const val = e.target.value;
                                      setDraft((prev) => {
                                        const next = [...prev.guessOptions] as [
                                          string,
                                          string,
                                          string,
                                          string,
                                        ];
                                        next[idx] = val;
                                        return { ...prev, guessOptions: next };
                                      });
                                    }}
                                    className="w-full bg-transparent text-sm text-[#191116] placeholder:text-[#96838D] focus:outline-none dark:text-white"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {draft.gameMode === 'truth_or_dare' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold text-[#191116] dark:text-white">
                              Truth or Dare Spinner
                            </p>
                            <button
                              type="button"
                              onClick={handleSpinTruthOrDare}
                              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#191116] px-3 py-1.5 text-xs font-semibold text-white transition-transform active:scale-95 dark:bg-white dark:text-[#191116] whitespace-nowrap cursor-pointer"
                            >
                              <RotateCw
                                className={`h-3.5 w-3.5 ${isSpinning ? 'animate-spin' : ''}`}
                                aria-hidden="true"
                              />
                              <span>Spin Prompt</span>
                            </button>
                          </div>
                          {draft.truthOrDare && (
                            <div className="rounded-xl border border-rose-200/70 bg-white p-3.5 dark:border-white/10 dark:bg-[#191320]">
                              <span className="text-xs font-bold text-[#FF2E63] dark:text-[#FF7A59]">
                                {draft.truthOrDare.kind}
                              </span>
                              <p className="mt-1 text-sm font-medium text-[#191116] dark:text-white">
                                {draft.truthOrDare.prompt}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {draft.gameMode === 'clue_drop' && (
                        <div className="space-y-3">
                          <label
                            htmlFor="clue-hint-input"
                            className="block text-xs font-semibold text-[#191116] dark:text-white"
                          >
                            Identity Clue (locked behind 3-tap decoder mini-game)
                          </label>
                          <input
                            id="clue-hint-input"
                            type="text"
                            maxLength={80}
                            value={draft.clueHint}
                            onChange={(e) => {
                              setErrorMsg(null);
                              setDraft((prev) => ({
                                ...prev,
                                clueHint: e.target.value,
                              }));
                            }}
                            placeholder="e.g., Starts with M · We had coffee Tuesday"
                            className="w-full rounded-xl border border-rose-200/80 bg-white px-3.5 py-2.5 text-sm text-[#191116] placeholder:text-[#96838D] focus:border-[#FF2E63] focus:outline-none dark:border-white/10 dark:bg-[#191320] dark:text-white"
                          />
                          <div className="flex flex-wrap gap-2">
                            {[
                              'Starts with M',
                              'In your second period class',
                              'Watched your story in 2 mins',
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setErrorMsg(null);
                                  setDraft((prev) => ({
                                    ...prev,
                                    clueHint: preset,
                                  }));
                                }}
                                className="rounded-lg border border-rose-200/70 bg-white px-2.5 py-1 text-xs text-[#57454E] hover:border-[#FF2E63]/40 dark:border-white/10 dark:bg-white/5 dark:text-[#C5B6BF] cursor-pointer"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {draft.gameMode === 'voice_note' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#191116] dark:text-white">
                              Distorted Voice Mask
                            </span>
                            <span className="font-mono-tabular text-xs text-[#64535C] dark:text-[#A696A1]">
                              {VOICE_FILTERS[draft.voiceFilter].pitchLabel}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {(Object.keys(VOICE_FILTERS) as VoiceFilter[]).map(
                              (filterKey) => {
                                const active = draft.voiceFilter === filterKey;
                                return (
                                  <button
                                    key={filterKey}
                                    type="button"
                                    onClick={() =>
                                      setDraft((prev) => ({
                                        ...prev,
                                        voiceFilter: filterKey,
                                      }))
                                    }
                                    className={`min-h-[40px] rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                      active
                                        ? 'border-[#FF2E63] bg-[#FF2E63]/10 text-[#D91B4E] dark:border-[#FF7A59] dark:bg-[#FF2E63]/20 dark:text-white'
                                        : 'border-rose-200/70 bg-white text-[#57454E] dark:border-white/10 dark:bg-[#191320] dark:text-[#C5B6BF]'
                                    }`}
                                  >
                                    {VOICE_FILTERS[filterKey].label}
                                  </button>
                                );
                              }
                            )}
                          </div>

                          <div className="space-y-3 rounded-xl border border-rose-200/70 bg-white p-3.5 dark:border-white/10 dark:bg-[#191320]">
                            {/* Animated Audio Waveform Visualizer */}
                            <div
                              data-testid="voice-waveform"
                              data-recording={isRecordingSim ? 'true' : 'false'}
                              aria-label="Audio waveform visualizer"
                              className="space-y-2"
                            >
                              <div className="flex items-center justify-between text-[11px] text-[#64535C] dark:text-[#A696A1]">
                                <span className="font-semibold text-[#191116] dark:text-white">
                                  {isRecordingSim
                                    ? 'Recording voice mask...'
                                    : isPreviewPlaying
                                      ? 'Playing masked preview...'
                                      : draft.voiceRecorded
                                        ? 'Voice mask ready'
                                        : 'Tap record to start 5:00 timer'}
                                </span>
                                <span
                                  data-testid="voice-countdown"
                                  className={`font-mono-tabular font-semibold ${
                                    isRecordingSim
                                      ? 'text-[#FF2E63] dark:text-[#FF7A59]'
                                      : ''
                                  }`}
                                >
                                  {isRecordingSim
                                    ? `${formatVoiceDuration(remainingRecordSec)} left`
                                    : draft.voiceRecorded
                                      ? formatVoiceDuration(draft.voiceDurationSec)
                                      : formatVoiceDuration(MAX_VOICE_DURATION_SEC)}
                                </span>
                              </div>

                              <div className="flex h-10 items-end gap-1 rounded-xl bg-[#FFF7F5] px-2.5 py-2 dark:bg-[#100C14]">
                                {activeWaveform.map((bar, idx) => {
                                  const activeHighlight =
                                    isRecordingSim ||
                                    isPreviewPlaying ||
                                    draft.voiceRecorded;
                                  return (
                                    <span
                                      key={idx}
                                      style={{ transform: `scaleY(${bar})` }}
                                      className={`h-full w-1 flex-1 origin-bottom rounded-full transition-transform duration-100 ease-out ${
                                        activeHighlight
                                          ? 'bg-gradient-to-t from-[#FF2E63] to-[#FF9233]'
                                          : 'bg-rose-300/60 dark:bg-white/20'
                                      }`}
                                    />
                                  );
                                })}
                              </div>

                              {isRecordingSim && (
                                <div
                                  aria-label="Recording time remaining progress"
                                  className="h-1 w-full overflow-hidden rounded-full bg-rose-100 dark:bg-white/10"
                                >
                                  <div
                                    style={{
                                      transform: `scaleX(${remainingRecordSec / MAX_VOICE_DURATION_SEC})`,
                                    }}
                                    className="h-full w-full origin-left whisper-gradient transition-transform duration-200 ease-linear"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={handleSimulateVoiceRecord}
                                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#191116] px-3.5 py-2 text-xs font-semibold text-white dark:bg-white dark:text-[#191116] whitespace-nowrap cursor-pointer"
                              >
                                {isRecordingSim ? (
                                  <>
                                    <Square
                                      className="h-3.5 w-3.5 fill-current text-[#FF2E63]"
                                      aria-hidden="true"
                                    />
                                    <span>Stop &amp; Save</span>
                                  </>
                                ) : (
                                  <>
                                    <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                                    <span>
                                      {draft.voiceRecorded
                                        ? 'Re-record Mask (5min)'
                                        : 'Record 5min Voice Note'}
                                    </span>
                                  </>
                                )}
                              </button>

                              {draft.voiceRecorded && !isRecordingSim && (
                                <button
                                  type="button"
                                  onClick={handlePreviewVoice}
                                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-[#D91B4E] dark:border-white/15 dark:text-[#FF7A59] cursor-pointer"
                                >
                                  {isPreviewPlaying ? (
                                    <>
                                      <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                                      <span>Stop Preview</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                                      <span>Preview Masked Audio</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {errorMsg && (
                    <p
                      role="alert"
                      className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                    >
                      {errorMsg}
                    </p>
                  )}

                  {/* Glowing Submit CTA */}
                  <button
                    type="submit"
                    className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl whisper-gradient px-6 py-3.5 text-base font-bold text-white whisper-glow transition-transform active:scale-[0.985] cursor-pointer"
                  >
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    <span>Send Anonymously</span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Live Whisper Preview & Privacy Guarantee (fills desktop 1440px naturally) */}
        <aside className="lg:col-span-5 space-y-5">
          <div className="rounded-3xl border border-rose-200/70 bg-white/80 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/80">
            <div className="flex items-center justify-between text-xs text-[#64535C] dark:text-[#A696A1]">
              <span className="font-semibold text-[#191116] dark:text-white">
                Live Inbox Card Preview
              </span>
              <span>{GAME_MODE_META[draft.gameMode].shortLabel}</span>
            </div>

            <div className="mt-4 rounded-2xl border border-rose-200/70 bg-[#FFF9F8] p-5 dark:border-white/10 dark:bg-[#100C14]">
              <div className="flex items-center gap-2 text-xs text-[#64535C] dark:text-[#A696A1]">
                <span>To {profile.handle}</span>
                <span aria-hidden="true">·</span>
                <span>{GAME_MODE_META[draft.gameMode].shortLabel}</span>
              </div>

              <p className="mt-3 font-display text-base font-bold leading-snug text-[#191116] dark:text-white">
                {draft.text.trim()
                  ? draft.text
                  : 'Your anonymous message will render here exactly how Maya sees it.'}
              </p>

              {draft.gameMode === 'guess_who' && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {draft.guessOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-rose-200/60 bg-white px-3 py-2 text-xs font-medium text-[#57454E] dark:border-white/10 dark:bg-white/5 dark:text-[#D5C9D0] truncate"
                    >
                      {opt.trim() || `Friend ${idx + 1}`}
                    </div>
                  ))}
                </div>
              )}

              {draft.gameMode === 'truth_or_dare' && draft.truthOrDare && (
                <div className="mt-4 rounded-xl border border-rose-200/60 bg-white p-3 text-xs dark:border-white/10 dark:bg-white/5">
                  <span className="font-bold text-[#FF2E63] dark:text-[#FF7A59]">
                    {draft.truthOrDare.kind}
                  </span>
                  <p className="mt-1 text-[#191116] dark:text-white">
                    {draft.truthOrDare.prompt}
                  </p>
                </div>
              )}

              {draft.gameMode === 'clue_drop' && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-rose-200/60 bg-white px-3.5 py-2.5 text-xs dark:border-white/10 dark:bg-white/5">
                  <span className="font-medium text-[#64535C] dark:text-[#A696A1]">
                    {draft.clueHint.trim()
                      ? 'Clue encrypted · 3-step unlock'
                      : 'Clue locked until decoded'}
                  </span>
                  <Lock className="h-3.5 w-3.5 text-[#FF2E63]" aria-hidden="true" />
                </div>
              )}

              {draft.gameMode === 'voice_note' && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-rose-200/60 bg-white px-3.5 py-2.5 dark:border-white/10 dark:bg-white/5">
                  <Volume2 className="h-4 w-4 shrink-0 text-[#FF2E63]" aria-hidden="true" />
                  <div className="flex flex-1 items-end gap-0.5 h-5">
                    {activeWaveform.slice(0, 22).map((bar, i) => (
                      <span
                        key={i}
                        style={{ transform: `scaleY(${bar})` }}
                        className="h-full w-1 flex-1 origin-bottom rounded-full bg-[#FF2E63]/75 transition-transform duration-100 ease-out dark:bg-[#FF7A59]/80"
                      />
                    ))}
                  </div>
                  <span className="font-mono-tabular text-[11px] text-[#64535C] dark:text-[#A696A1]">
                    {VOICE_FILTERS[draft.voiceFilter].label}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-rose-200/70 bg-white/80 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/80">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-[#FF2E63] dark:text-[#FF7A59]"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-display text-sm font-bold text-[#191116] dark:text-white">
                  Zero-Trace Anonymity
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#64535C] dark:text-[#B4A6AF]">
                  Senders never log in or share device fingerprints. Game modes only
                  reveal what you choose to attach, and receivers can block abusive
                  aliases with one tap.
                </p>
                <button
                  type="button"
                  onClick={onOpenGuidelines}
                  className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 text-xs font-semibold text-[#D91B4E] underline-offset-4 hover:underline dark:text-[#FF7A59] cursor-pointer"
                >
                  <span>Community Guidelines &amp; Privacy</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
