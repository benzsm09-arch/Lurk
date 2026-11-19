'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Ban,
  Check,
  Dices,
  HelpCircle,
  KeyRound,
  Lock,
  LockOpen,
  Mic,
  Play,
  RotateCcw,
  Share2,
  Square,
  Trash2,
} from 'lucide-react';
import {
  GAME_MODE_META,
  InboxFilter,
  UserProfile,
  VOICE_FILTERS,
  WhisperMessage,
  countMessagesByFilter,
  filterInboxMessages,
  formatVoiceDuration,
} from '@/lib/whisperlink';
import { playSimulatedVoice, stopSimulatedVoice } from '@/lib/audio';

interface InboxViewProps {
  profile: UserProfile;
  messages: WhisperMessage[];
  blockedAliases: string[];
  onAnswerGuessWho: (messageId: string, chosenIndex: number) => void;
  onOpenClueGame: (message: WhisperMessage) => void;
  onOpenStoryReply: (message: WhisperMessage) => void;
  onDeleteBlock: (messageId: string) => void;
  onResetDemo: () => void;
  onGoToSend: () => void;
}

const FILTER_TABS: { id: InboxFilter; label: string }[] = [
  { id: 'all', label: 'All Whispers' },
  { id: 'guess_who', label: 'Guess Who' },
  { id: 'clue_drop', label: 'Clues' },
  { id: 'voice_note', label: 'Voice Notes' },
  { id: 'truth_or_dare', label: 'Truth or Dare' },
];

export default function InboxView({
  profile,
  messages,
  blockedAliases,
  onAnswerGuessWho,
  onOpenClueGame,
  onOpenStoryReply,
  onDeleteBlock,
  onResetDemo,
  onGoToSend,
}: InboxViewProps) {
  const [activeFilter, setActiveFilter] = useState<InboxFilter>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const counts = countMessagesByFilter(messages, blockedAliases);
  const filteredMessages = filterInboxMessages(
    messages,
    activeFilter,
    blockedAliases
  );

  const handleToggleVoicePlay = (msg: WhisperMessage) => {
    if (!msg.voiceNote) return;
    if (playingVoiceId === msg.id) {
      stopSimulatedVoice();
      setPlayingVoiceId(null);
      return;
    }
    setPlayingVoiceId(msg.id);
    playSimulatedVoice(msg.voiceNote.filter, msg.voiceNote.durationSec, () => {
      setPlayingVoiceId((current) => (current === msg.id ? null : current));
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-12 md:pt-10">
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#FF2E63] dark:text-[#FF7A59]">
            Owner Inbox · {profile.handle}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#191116] dark:text-white sm:text-3xl">
            Anonymous Messages
          </h1>
          <p className="mt-1 text-sm text-[#64535C] dark:text-[#B4A6AF]">
            Decode identity clues, play Guess Who quizzes, and export Story replies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {blockedAliases.length > 0 && (
            <span className="font-mono-tabular text-xs font-medium text-[#64535C] dark:text-[#A696A1]">
              {blockedAliases.length} blocked
            </span>
          )}
          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-rose-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-[#191116] hover:bg-rose-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Interactive Filter Segmented Bar */}
      <div
        role="tablist"
        aria-label="Filter inbox messages"
        className="mt-6 flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
      >
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveFilter(tab.id)}
              className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'border-transparent whisper-gradient text-white whisper-glow'
                  : 'border-rose-200/80 bg-white/80 text-[#57454E] hover:bg-rose-50 dark:border-white/10 dark:bg-[#17121C]/80 dark:text-[#C5B6BF] dark:hover:bg-white/10'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`font-mono-tabular text-[11px] ${
                  active ? 'text-white/90' : 'text-[#96838D] dark:text-[#7D6E78]'
                }`}
              >
                {counts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Messages Grid */}
      {filteredMessages.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-rose-200/70 bg-white/80 p-10 text-center backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/80">
          <h2 className="font-display text-lg font-bold text-[#191116] dark:text-white">
            No whispers in this view
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[#64535C] dark:text-[#B4A6AF]">
            Send yourself a test confession with a mini-game or restore the sample
            inbox cards.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onGoToSend}
              className="min-h-[44px] rounded-2xl whisper-gradient px-5 py-2.5 text-sm font-bold text-white whisper-glow cursor-pointer"
            >
              Send a Whisper
            </button>
            <button
              type="button"
              onClick={onResetDemo}
              className="min-h-[44px] rounded-2xl border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#191116] dark:border-white/15 dark:bg-white/5 dark:text-white cursor-pointer"
            >
              Restore Sample Inbox
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <AnimatePresence initial={false}>
            {filteredMessages.map((msg) => {
              const isPlaying = playingVoiceId === msg.id;
              const isConfirmingDelete = confirmDeleteId === msg.id;

              return (
                <motion.article
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col justify-between rounded-3xl border border-rose-200/75 bg-white/88 p-6 backdrop-blur-xl shadow-sm dark:border-white/10 dark:bg-[#17121C]/88"
                >
                  <div>
                    {/* Clean Metadata Line + Type Tag */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-[#64535C] dark:text-[#A696A1]">
                        <span className="font-mono-tabular">{msg.createdAtLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{msg.isRead ? 'Opened' : 'New'}</span>
                        {msg.repliedText && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[#D91B4E] dark:text-[#FF7A59]">
                              Replied
                            </span>
                          </>
                        )}
                      </div>

                      {msg.gameMode !== 'none' && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-100/80 px-2 py-0.5 text-[11px] font-bold text-[#D91B4E] dark:bg-[#FF2E63]/15 dark:text-[#FF8C6B]">
                          {msg.gameMode === 'guess_who' && (
                            <HelpCircle className="h-3 w-3" aria-hidden="true" />
                          )}
                          {msg.gameMode === 'clue_drop' && (
                            <KeyRound className="h-3 w-3" aria-hidden="true" />
                          )}
                          {msg.gameMode === 'voice_note' && (
                            <Mic className="h-3 w-3" aria-hidden="true" />
                          )}
                          {msg.gameMode === 'truth_or_dare' && (
                            <Dices className="h-3 w-3" aria-hidden="true" />
                          )}
                          <span>{GAME_MODE_META[msg.gameMode].shortLabel}</span>
                        </span>
                      )}
                    </div>

                    {/* Message Body */}
                    <p className="mt-3.5 font-display text-lg font-bold leading-snug text-[#191116] dark:text-white">
                      {msg.text}
                    </p>

                    {/* Attached Game Mode Modules */}
                    {msg.gameMode === 'guess_who' && msg.guessWho && (
                      <div className="mt-4 space-y-2.5 rounded-2xl border border-rose-200/70 bg-[#FFF9F8] p-4 dark:border-white/10 dark:bg-[#100C14]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#191116] dark:text-white">
                            Guess Who Sent This
                          </span>
                          {msg.guessWho.selectedIndex !== null && (
                            <span
                              className={`font-semibold ${
                                msg.guessWho.selectedIndex ===
                                msg.guessWho.correctIndex
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-[#D91B4E] dark:text-[#FF7A59]'
                              }`}
                            >
                              {msg.guessWho.selectedIndex ===
                              msg.guessWho.correctIndex
                                ? 'Nailed it!'
                                : `It was ${msg.guessWho.options[msg.guessWho.correctIndex]}`}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {msg.guessWho.options.map((opt, idx) => {
                            const selected = msg.guessWho!.selectedIndex === idx;
                            const answered = msg.guessWho!.selectedIndex !== null;
                            const isCorrect = msg.guessWho!.correctIndex === idx;

                            let btnClass =
                              'border-rose-200/80 bg-white text-[#191116] hover:border-[#FF2E63]/50 dark:border-white/10 dark:bg-[#191320] dark:text-white';
                            if (answered) {
                              if (isCorrect) {
                                btnClass =
                                  'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-200';
                              } else if (selected) {
                                btnClass =
                                  'border-red-400 bg-red-50 text-red-900 dark:border-red-400 dark:bg-red-500/15 dark:text-red-200';
                              } else {
                                btnClass =
                                  'border-rose-200/50 bg-white/60 text-[#64535C] opacity-70 dark:border-white/5 dark:bg-white/5 dark:text-[#A696A1]';
                              }
                            }

                            return (
                              <button
                                key={idx}
                                type="button"
                                disabled={answered}
                                onClick={() => onAnswerGuessWho(msg.id, idx)}
                                className={`flex min-h-[42px] items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer disabled:cursor-default ${btnClass}`}
                              >
                                <span className="truncate">{opt}</span>
                                {answered && isCorrect && (
                                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {msg.gameMode === 'clue_drop' && msg.clueDrop && (
                      <div className="mt-4 rounded-2xl border border-rose-200/70 bg-[#FFF9F8] p-4 dark:border-white/10 dark:bg-[#100C14]">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-[#191116] dark:text-white">
                            {msg.clueDrop.unlocked ? (
                              <LockOpen
                                className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                                aria-hidden="true"
                              />
                            ) : (
                              <Lock
                                className="h-3.5 w-3.5 text-[#FF2E63]"
                                aria-hidden="true"
                              />
                            )}
                            <span>
                              {msg.clueDrop.unlocked
                                ? 'Identity Clue Unlocked'
                                : 'Clue Locked'}
                            </span>
                          </span>
                          <span className="font-mono-tabular text-[#64535C] dark:text-[#A696A1]">
                            {msg.clueDrop.progress}/{msg.clueDrop.requiredSteps} keys
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-[#191116] dark:text-white">
                          {msg.clueDrop.unlocked
                            ? msg.clueDrop.hint
                            : 'Complete the 3-step Signal Key mini-game to reveal this hint.'}
                        </p>
                      </div>
                    )}

                    {msg.gameMode === 'voice_note' && msg.voiceNote && (
                      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-rose-200/70 bg-[#FFF9F8] p-3.5 dark:border-white/10 dark:bg-[#100C14]">
                        <button
                          type="button"
                          onClick={() => handleToggleVoicePlay(msg)}
                          aria-label={
                            isPlaying ? 'Stop voice note' : 'Play masked voice note'
                          }
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl whisper-gradient text-white whisper-glow cursor-pointer"
                        >
                          {isPlaying ? (
                            <Square className="h-4 w-4 fill-current" aria-hidden="true" />
                          ) : (
                            <Play className="h-4 w-4 fill-current ml-0.5" aria-hidden="true" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-end gap-0.5 h-6">
                            {msg.voiceNote.waveform.map((height, idx) => (
                              <span
                                key={idx}
                                style={{ height: `${Math.round(height * 100)}%` }}
                                className={`w-1 flex-1 rounded-full transition-colors ${
                                  isPlaying
                                    ? 'bg-[#FF2E63] dark:bg-[#FF7A59]'
                                    : 'bg-[#FF2E63]/45 dark:bg-white/25'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-[#64535C] dark:text-[#A696A1]">
                            <span>{VOICE_FILTERS[msg.voiceNote.filter].label}</span>
                            <span className="font-mono-tabular">
                              {formatVoiceDuration(msg.voiceNote.durationSec)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {msg.gameMode === 'truth_or_dare' && msg.truthOrDare && (
                      <div className="mt-4 rounded-2xl border border-rose-200/70 bg-[#FFF9F8] p-4 dark:border-white/10 dark:bg-[#100C14]">
                        <span className="text-xs font-bold text-[#FF2E63] dark:text-[#FF7A59]">
                          Attached {msg.truthOrDare.kind}
                        </span>
                        <p className="mt-1 text-sm font-medium text-[#191116] dark:text-white">
                          {msg.truthOrDare.prompt}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-rose-200/60 pt-4 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => onOpenStoryReply(msg)}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl whisper-gradient px-3.5 py-2 text-xs font-bold text-white transition-transform active:scale-[0.98] whitespace-nowrap cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>Reply on Story</span>
                    </button>

                    {msg.gameMode === 'clue_drop' &&
                      msg.clueDrop &&
                      !msg.clueDrop.unlocked && (
                        <button
                          type="button"
                          onClick={() => onOpenClueGame(msg)}
                          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#FF2E63]/35 bg-rose-50/70 px-3.5 py-2 text-xs font-bold text-[#D91B4E] hover:bg-rose-100/70 dark:border-[#FF7A59]/35 dark:bg-[#FF2E63]/15 dark:text-[#FF9D80] whitespace-nowrap cursor-pointer"
                        >
                          <KeyRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            Unlock Clue ({msg.clueDrop.progress}/
                            {msg.clueDrop.requiredSteps})
                          </span>
                        </button>
                      )}

                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDeleteId(null);
                            onDeleteBlock(msg.id);
                          }}
                          className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 whitespace-nowrap cursor-pointer"
                        >
                          <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Confirm Block</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="inline-flex min-h-[44px] items-center rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-[#57454E] dark:border-white/15 dark:text-[#C5B6BF] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Delete or block whisper: ${msg.text.slice(0, 24)}`}
                        onClick={() => setConfirmDeleteId(msg.id)}
                        className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-[#64535C] hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-white/10 dark:bg-white/5 dark:text-[#B4A6AF] dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300 whitespace-nowrap cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Delete / Block</span>
                      </button>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
