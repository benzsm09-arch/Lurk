'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, Dices, RotateCcw, Sparkles } from 'lucide-react';
import {
  AVATAR_ACCESSORIES,
  AVATAR_EXPRESSIONS,
  AVATAR_HAIR_STYLES,
  AVATAR_STYLE_META,
  AvatarStyleId,
  AvatarTraits,
  generateCharacterAvatarDataUrl,
  generateCharacterAvatarTraits,
} from '@/lib/avatar-generator';
import { DEFAULT_PROFILE } from '@/lib/whisperlink';
import { triggerHaptic } from '@/lib/haptics';

interface AvatarGeneratorCardProps {
  currentAvatarUrl: string;
  onApplyAvatar: (nextAvatarUrl: string) => void;
}

export default function AvatarGeneratorCard({
  currentAvatarUrl,
  onApplyAvatar,
}: AvatarGeneratorCardProps) {
  const [vibePrompt, setVibePrompt] = useState('sunset creative');
  const [traits, setTraits] = useState<AvatarTraits>(() =>
    generateCharacterAvatarTraits('sunset creative', 101)
  );
  const [history, setHistory] = useState<string[]>(() => [
    generateCharacterAvatarDataUrl(
      generateCharacterAvatarTraits('sunset creative', 101)
    ),
  ]);
  const [appliedFlash, setAppliedFlash] = useState(false);

  const previewUrl = generateCharacterAvatarDataUrl(traits);
  const isCustomActive = currentAvatarUrl !== DEFAULT_PROFILE.avatarUrl;

  const pushHistory = (url: string) => {
    setHistory((prev) => [url, ...prev.filter((item) => item !== url)].slice(0, 4));
  };

  const handleGenerate = () => {
    triggerHaptic('tap_light');
    setAppliedFlash(false);
    const nextTraits = generateCharacterAvatarTraits(vibePrompt, Date.now());
    setTraits(nextTraits);
    pushHistory(generateCharacterAvatarDataUrl(nextTraits));
  };

  const handleUpdateTraits = (patch: Partial<AvatarTraits>) => {
    triggerHaptic('tap_light');
    setAppliedFlash(false);
    const nextTraits = { ...traits, ...patch };
    setTraits(nextTraits);
    pushHistory(generateCharacterAvatarDataUrl(nextTraits));
  };

  const handleApply = () => {
    triggerHaptic('celebrate_win');
    onApplyAvatar(previewUrl);
    setAppliedFlash(true);
    setTimeout(() => setAppliedFlash(false), 2000);
  };

  const handleRevertDefault = () => {
    triggerHaptic('tap_light');
    setAppliedFlash(false);
    onApplyAvatar(DEFAULT_PROFILE.avatarUrl);
  };

  return (
    <section
      aria-labelledby="avatar-generator-heading"
      className="rounded-3xl border border-rose-200/75 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/90"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="avatar-generator-heading"
          className="font-display text-base font-extrabold text-[#191116] dark:text-white"
        >
          Avatar Generator
        </h2>
        <span className="text-xs text-[#64535C] dark:text-[#A696A1]">
          {isCustomActive ? 'Custom character active' : 'Default character active'}
        </span>
      </div>
      <p className="mt-1 text-xs text-[#64535C] dark:text-[#A696A1]">
        Generate and customize a stylized character portrait for your profile.
      </p>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
        {/* Live Preview + Recent Variations */}
        <div className="flex shrink-0 flex-col items-center gap-3">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-rose-200 bg-[#FFF9F8] shadow-sm dark:border-white/20 dark:bg-[#100C14]">
            <Image
              key={previewUrl}
              src={previewUrl}
              alt="Generated character avatar preview"
              fill
              sizes="112px"
              referrerPolicy="no-referrer"
              className="object-cover"
            />
          </div>

          {history.length > 1 && (
            <div
              aria-label="Recent generated avatars"
              className="flex items-center gap-1.5"
            >
              {history.map((url, idx) => (
                <button
                  key={`${idx}-${url.slice(-16)}`}
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap_light');
                    onApplyAvatar(url);
                  }}
                  aria-label={`Apply variation ${idx + 1}`}
                  className={`relative h-9 w-9 overflow-hidden rounded-full border transition-transform hover:scale-105 cursor-pointer ${
                    currentAvatarUrl === url
                      ? 'border-[#FF2E63] ring-2 ring-[#FF2E63]/30'
                      : 'border-rose-200/80 dark:border-white/15'
                  }`}
                >
                  <Image
                    src={url}
                    alt={`Variation ${idx + 1}`}
                    fill
                    sizes="36px"
                    referrerPolicy="no-referrer"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {isCustomActive && (
            <button
              type="button"
              onClick={handleRevertDefault}
              className="inline-flex min-h-[36px] items-center gap-1 text-xs font-semibold text-[#64535C] hover:text-[#191116] dark:text-[#A696A1] dark:hover:text-white cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Use Default</span>
            </button>
          )}
        </div>

        {/* Prompt & Trait Controls */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={vibePrompt}
              maxLength={48}
              onChange={(e) => setVibePrompt(e.target.value)}
              aria-label="Character vibe prompt"
              placeholder="e.g. midnight DJ headphones, sunset curly..."
              className="min-w-0 flex-1 rounded-xl border border-rose-200/80 bg-[#FFF9F8] px-3.5 py-2 text-sm text-[#191116] placeholder:text-[#96838D] focus:border-[#FF2E63] focus:outline-none dark:border-white/10 dark:bg-[#100C14] dark:text-white"
            />
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-rose-200/80 bg-white px-4 py-2 text-xs font-bold text-[#191116] hover:bg-rose-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 whitespace-nowrap cursor-pointer"
            >
              <Dices className="h-3.5 w-3.5 text-[#FF2E63] dark:text-[#FF7A59]" aria-hidden="true" />
              <span>Randomize</span>
            </button>
          </div>

          {/* Backdrop Style Presets */}
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold text-[#64535C] dark:text-[#A696A1]">
              Backdrop Style
            </span>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(AVATAR_STYLE_META) as AvatarStyleId[]).map((id) => {
                const active = traits.style === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleUpdateTraits({ style: id })}
                    className={`min-h-[38px] rounded-xl border px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'border-[#FF2E63] bg-[#FF2E63]/10 text-[#D91B4E] dark:border-[#FF7A59] dark:bg-[#FF2E63]/20 dark:text-white'
                        : 'border-rose-200/70 bg-[#FFF9F8] text-[#57454E] dark:border-white/10 dark:bg-[#100C14] dark:text-[#C5B6BF]'
                    }`}
                  >
                    {AVATAR_STYLE_META[id].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hair, Accessory & Expression Selectors */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div>
              <label
                htmlFor="avatar-hair-select"
                className="mb-1 block text-[11px] font-semibold text-[#64535C] dark:text-[#A696A1]"
              >
                Hair
              </label>
              <select
                id="avatar-hair-select"
                value={traits.hairStyle}
                onChange={(e) =>
                  handleUpdateTraits({
                    hairStyle: e.target.value as AvatarTraits['hairStyle'],
                  })
                }
                className="w-full min-h-[40px] rounded-xl border border-rose-200/80 bg-[#FFF9F8] px-2.5 py-1.5 text-xs font-semibold text-[#191116] focus:border-[#FF2E63] focus:outline-none dark:border-white/10 dark:bg-[#100C14] dark:text-white"
              >
                {AVATAR_HAIR_STYLES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="avatar-accessory-select"
                className="mb-1 block text-[11px] font-semibold text-[#64535C] dark:text-[#A696A1]"
              >
                Accessory
              </label>
              <select
                id="avatar-accessory-select"
                value={traits.accessory}
                onChange={(e) =>
                  handleUpdateTraits({
                    accessory: e.target.value as AvatarTraits['accessory'],
                  })
                }
                className="w-full min-h-[40px] rounded-xl border border-rose-200/80 bg-[#FFF9F8] px-2.5 py-1.5 text-xs font-semibold text-[#191116] focus:border-[#FF2E63] focus:outline-none dark:border-white/10 dark:bg-[#100C14] dark:text-white"
              >
                {AVATAR_ACCESSORIES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="avatar-expression-select"
                className="mb-1 block text-[11px] font-semibold text-[#64535C] dark:text-[#A696A1]"
              >
                Expression
              </label>
              <select
                id="avatar-expression-select"
                value={traits.expression}
                onChange={(e) =>
                  handleUpdateTraits({
                    expression: e.target.value as AvatarTraits['expression'],
                  })
                }
                className="w-full min-h-[40px] rounded-xl border border-rose-200/80 bg-[#FFF9F8] px-2.5 py-1.5 text-xs font-semibold text-[#191116] focus:border-[#FF2E63] focus:outline-none dark:border-white/10 dark:bg-[#100C14] dark:text-white"
              >
                {AVATAR_EXPRESSIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl whisper-gradient px-5 py-2.5 text-xs font-bold text-white whisper-glow transition-transform active:scale-[0.985] cursor-pointer"
          >
            {appliedFlash ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>Profile Avatar Updated</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Set as Profile Avatar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
