'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Download, Share2, X } from 'lucide-react';
import { GAME_MODE_META, UserProfile, WhisperMessage } from '@/lib/whisperlink';
import { STORY_THEMES, StoryTheme, renderStoryCardPng } from '@/lib/story-card';
import { triggerHaptic } from '@/lib/haptics';

interface StoryReplyModalProps {
  message: WhisperMessage;
  profile: UserProfile;
  onSaveReply: (messageId: string, replyText: string) => void;
  onClose: () => void;
}

export default function StoryReplyModal({
  message,
  profile,
  onSaveReply,
  onClose,
}: StoryReplyModalProps) {
  const [replyText, setReplyText] = useState(message.repliedText ?? '');
  const [theme, setTheme] = useState<StoryTheme>('sunset');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedDone, setExportedDone] = useState(false);

  const activeTheme = STORY_THEMES[theme];

  const handleDownload = async () => {
    triggerHaptic('tap_light');
    setIsExporting(true);
    try {
      onSaveReply(message.id, replyText);
      const dataUrl = await renderStoryCardPng(message, profile, replyText, theme);
      if (dataUrl) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `whisperlink-story-${message.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setExportedDone(true);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.18 }}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-rose-200/70 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#17121C] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl whisper-gradient text-white">
              <Share2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="story-modal-title"
                className="font-display text-base font-extrabold text-[#191116] dark:text-white"
              >
                Reply on Instagram Story
              </h2>
              <p className="text-xs text-[#64535C] dark:text-[#A696A1]">
                Customize &amp; export a 1080×1920 Story card PNG
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close story reply builder"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#64535C] hover:bg-rose-50 dark:text-[#A696A1] dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Left: Story Card Visual Preview */}
          <div className="md:col-span-6 flex justify-center">
            <div
              style={{
                background: `linear-gradient(155deg, ${activeTheme.bgStart} 0%, ${activeTheme.bgMid} 55%, ${activeTheme.bgEnd} 100%)`,
              }}
              className="flex aspect-[9/14] w-full max-w-[260px] flex-col justify-between rounded-3xl p-5 text-center shadow-lg"
            >
              <span className="text-[11px] font-semibold text-white/90">
                WhisperLink · {profile.handle}
              </span>

              <div className="space-y-4">
                <div
                  style={{ backgroundColor: activeTheme.cardBg }}
                  className="overflow-hidden rounded-2xl shadow-md"
                >
                  <div className="whisper-gradient px-3 py-2 text-[11px] font-bold text-white">
                    {message.gameMode === 'none'
                      ? 'Anonymous Whisper'
                      : GAME_MODE_META[message.gameMode].shortLabel}
                  </div>
                  <p
                    style={{ color: activeTheme.cardInk }}
                    className="px-4 py-4 font-display text-sm font-bold leading-snug"
                  >
                    {message.text}
                  </p>
                </div>

                <p
                  style={{ color: activeTheme.replyInk }}
                  className="font-display text-base font-extrabold leading-snug break-words"
                >
                  {replyText.trim() || 'Type your answer on the right...'}
                </p>
              </div>

              <span className="text-[10px] font-medium text-white/80">
                whisperlink.app/{profile.handle.replace('@', '')}
              </span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="story-reply-input"
                  className="mb-1.5 block text-xs font-semibold text-[#64535C] dark:text-[#B4A6AF]"
                >
                  Your Answer
                </label>
                <textarea
                  id="story-reply-input"
                  rows={4}
                  maxLength={180}
                  value={replyText}
                  onChange={(e) => {
                    setExportedDone(false);
                    setReplyText(e.target.value);
                  }}
                  placeholder="Write your reply to appear below the card..."
                  className="w-full resize-none rounded-2xl border border-rose-200/80 bg-[#FFF9F8] p-3.5 text-sm text-[#191116] placeholder:text-[#96838D] focus:border-[#FF2E63] focus:outline-none dark:border-white/12 dark:bg-[#100C14] dark:text-white"
                />
              </div>

              <div>
                <span className="mb-2 block text-xs font-semibold text-[#64535C] dark:text-[#B4A6AF]">
                  Card Gradient Theme
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(STORY_THEMES) as StoryTheme[]).map((key) => {
                    const active = theme === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap_light');
                          setTheme(key);
                        }}
                        className={`min-h-[42px] rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          active
                            ? 'border-[#FF2E63] bg-[#FF2E63]/10 text-[#D91B4E] dark:border-[#FF7A59] dark:text-white'
                            : 'border-rose-200/70 bg-white text-[#57454E] dark:border-white/10 dark:bg-white/5 dark:text-[#C5B6BF]'
                        }`}
                      >
                        {STORY_THEMES[key].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownload}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl whisper-gradient px-5 py-3 text-sm font-bold text-white whisper-glow transition-transform active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                {exportedDone ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>Story Card Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {isExporting ? 'Rendering PNG...' : 'Download Story Card (.png)'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onSaveReply(message.id, replyText);
                  onClose();
                }}
                className="flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-rose-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-[#191116] hover:bg-rose-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 cursor-pointer"
              >
                Save Reply &amp; Close
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
