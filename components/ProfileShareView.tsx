'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import {
  Check,
  Copy,
  Download,
  Link2,
  Monitor,
  Moon,
  QrCode,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  Sun,
} from 'lucide-react';
import { ThemePreference, UserProfile } from '@/lib/whisperlink';
import {
  QR_PREVIEW_OPTIONS,
  buildQrDownloadFilename,
  buildShareUrl,
  generateShareQrDataUrl,
} from '@/lib/qr';
import { triggerHaptic } from '@/lib/haptics';
import AvatarGeneratorCard from './AvatarGeneratorCard';

interface ProfileShareViewProps {
  profile: UserProfile;
  onUpdateProfile: (next: UserProfile) => void;
  themePreference: ThemePreference;
  systemPrefersDark: boolean;
  onChangeThemePreference: (pref: ThemePreference) => void;
  blockedAliases: string[];
  onUnblockAll: () => void;
  onResetDemo: () => void;
  onGoToSend: () => void;
  onOpenGuidelines: () => void;
}

const THEME_OPTIONS: {
  id: ThemePreference;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Warm sunset glow',
    icon: Sun,
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Deep twilight ink',
    icon: Moon,
  },
  {
    id: 'system',
    label: 'System',
    description: 'Follow OS setting',
    icon: Monitor,
  },
];

export default function ProfileShareView({
  profile,
  onUpdateProfile,
  themePreference,
  systemPrefersDark,
  onChangeThemePreference,
  blockedAliases,
  onUnblockAll,
  onResetDemo,
  onGoToSend,
  onOpenGuidelines,
}: ProfileShareViewProps) {
  const [copied, setCopied] = useState(false);
  const [qrDownloaded, setQrDownloaded] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const shareUrl = buildShareUrl(profile.handle);

  useEffect(() => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    void QRCode.toCanvas(canvas, shareUrl, QR_PREVIEW_OPTIONS).catch(() => {
      // Ignore transient canvas errors during unmount
    });
  }, [shareUrl]);

  const handleCopyLink = async () => {
    triggerHaptic('tap_light');
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQr = async () => {
    triggerHaptic('tap_light');
    try {
      const dataUrl = await generateShareQrDataUrl(profile.handle);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = buildQrDownloadFilename(profile.handle);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setQrDownloaded(true);
      setTimeout(() => setQrDownloaded(false), 2000);
    } catch {
      // Ignore download errors
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-12 md:pt-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Link & Share Card */}
        <div className="lg:col-span-5 space-y-5">
          <div className="overflow-hidden rounded-3xl border border-rose-200/75 bg-white/90 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/90">
            <div className="whisper-gradient p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/75 bg-white/20">
                  {!avatarFailed ? (
                    <Image
                      key={profile.avatarUrl}
                      src={profile.avatarUrl}
                      alt={`${profile.displayName} (${profile.handle})`}
                      fill
                      sizes="64px"
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
                <div className="min-w-0">
                  <h1 className="font-display text-xl font-extrabold truncate">
                    {profile.handle}
                  </h1>
                  <p className="text-xs font-medium text-white/90">
                    {profile.displayName} · {profile.status}
                  </p>
                </div>
              </div>
              <p className="mt-4 font-display text-lg font-bold leading-snug">
                {profile.promptHeadline}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-xs font-semibold text-[#64535C] dark:text-[#B4A6AF]">
                  Your Shareable Link
                </span>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-rose-200/80 bg-[#FFF9F8] p-2 dark:border-white/10 dark:bg-[#100C14]">
                  <Link2
                    className="ml-2 h-4 w-4 shrink-0 text-[#FF2E63]"
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate text-xs font-medium text-[#191116] dark:text-white">
                    {shareUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl whisper-gradient px-3.5 py-2 text-xs font-bold text-white whitespace-nowrap cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Scannable QR Code Card Section */}
              <div className="rounded-2xl border border-rose-200/80 bg-[#FFF9F8] p-4 dark:border-white/10 dark:bg-[#100C14]">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <QrCode
                      className="h-4 w-4 text-[#FF2E63] dark:text-[#FF7A59]"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-semibold text-[#191116] dark:text-white">
                      Scan to Send Whisper
                    </span>
                  </div>
                  <span className="text-xs text-[#64535C] dark:text-[#A696A1] truncate max-w-[140px]">
                    {profile.handle.trim() || '@prettyychaos_'}
                  </span>
                </div>

                <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-center">
                  <div className="shrink-0 overflow-hidden rounded-2xl border border-rose-200/80 bg-white p-2 shadow-xs">
                    <canvas
                      ref={qrCanvasRef}
                      role="img"
                      aria-label={`QR code for ${shareUrl}`}
                      className="block h-[148px] w-[148px]"
                    />
                  </div>

                  <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
                    <p className="text-xs leading-relaxed text-[#64535C] dark:text-[#B4A6AF]">
                      Let friends point their camera at this code to open your
                      anonymous confession link instantly.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="mt-3 inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-rose-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-[#191116] transition-colors hover:bg-rose-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 whitespace-nowrap cursor-pointer"
                    >
                      {qrDownloaded ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                          <span>QR Saved</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Download QR PNG</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onGoToSend}
                className="flex min-h-[46px] w-full items-center justify-center rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#191116] hover:bg-rose-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 cursor-pointer"
              >
                Preview Public Profile
              </button>
            </div>
          </div>
        </div>

        {/* Right: Customize Prompt & Safety Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-rose-200/75 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/90">
            <h2 className="font-display text-lg font-extrabold text-[#191116] dark:text-white">
              Customize Profile Card
            </h2>
            <p className="mt-1 text-xs text-[#64535C] dark:text-[#A696A1]">
              Changes update your Send Whisper landing card immediately.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profile-handle-input"
                  className="mb-1.5 block text-xs font-semibold text-[#64535C] dark:text-[#B4A6AF]"
                >
                  Handle
                </label>
                <input
                  id="profile-handle-input"
                  type="text"
                  maxLength={28}
                  value={profile.handle}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, handle: e.target.value })
                  }
                  className="w-full rounded-xl border border-rose-200/80 bg-[#FFF9F8] px-3.5 py-2.5 text-sm text-[#191116] focus:border-[#FF2E63] focus:outline-none dark:border-white/10 dark:bg-[#100C14] dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-name-input"
                  className="mb-1.5 block text-xs font-semibold text-[#64535C] dark:text-[#B4A6AF]"
                >
                  Display Name
                </label>
                <input
                  id="profile-name-input"
                  type="text"
                  maxLength={32}
                  value={profile.displayName}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, displayName: e.target.value })
                  }
                  className="w-full rounded-xl border border-rose-200/80 bg-[#FFF9F8] px-3.5 py-2.5 text-sm text-[#191116] focus:border-[#FF2E63] focus:outline-none dark:border-white/10 dark:bg-[#100C14] dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="profile-status-input"
                  className="mb-1.5 block text-xs font-semibold text-[#64535C] dark:text-[#B4A6AF]"
                >
                  Current Status
                </label>
                <input
                  id="profile-status-input"
                  type="text"
                  maxLength={60}
                  value={profile.status}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, status: e.target.value })
                  }
                  className="w-full rounded-xl border border-rose-200/80 bg-[#FFF9F8] px-3.5 py-2.5 text-sm text-[#191116] focus:border-[#FF2E63] focus:outline-none dark:border-white/10 dark:bg-[#100C14] dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="profile-prompt-input"
                  className="mb-1.5 block text-xs font-semibold text-[#64535C] dark:text-[#B4A6AF]"
                >
                  Prompt Question
                </label>
                <input
                  id="profile-prompt-input"
                  type="text"
                  maxLength={100}
                  value={profile.promptHeadline}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...profile,
                      promptHeadline: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-rose-200/80 bg-[#FFF9F8] px-3.5 py-2.5 text-sm text-[#191116] focus:border-[#FF2E63] focus:outline-none dark:border-white/10 dark:bg-[#100C14] dark:text-white"
                />
              </div>
            </div>
          </div>

          <AvatarGeneratorCard
            currentAvatarUrl={profile.avatarUrl}
            onApplyAvatar={(nextAvatarUrl) => {
              setAvatarFailed(false);
              onUpdateProfile({ ...profile, avatarUrl: nextAvatarUrl });
            }}
          />

          {/* Theme Settings Section */}
          <section
            aria-labelledby="theme-settings-heading"
            className="rounded-3xl border border-rose-200/75 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/90"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="theme-settings-heading"
                className="font-display text-base font-extrabold text-[#191116] dark:text-white"
              >
                Theme Settings
              </h2>
              <span className="text-xs text-[#64535C] dark:text-[#A696A1]">
                {themePreference === 'system'
                  ? `Using System (${systemPrefersDark ? 'Dark' : 'Light'})`
                  : `Manual override: ${themePreference === 'dark' ? 'Dark' : 'Light'}`}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#64535C] dark:text-[#A696A1]">
              Choose Light, Dark, or follow your operating system preference.
            </p>

            <div
              role="radiogroup"
              aria-label="App theme mode"
              className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3"
            >
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = themePreference === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onChangeThemePreference(option.id)}
                    className={`flex min-h-[56px] items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-[#FF2E63] bg-[#FF2E63]/10 text-[#191116] dark:border-[#FF7A59] dark:bg-[#FF2E63]/20 dark:text-white'
                        : 'border-rose-200/80 bg-[#FFF9F8] text-[#57454E] hover:border-rose-300 dark:border-white/10 dark:bg-[#100C14] dark:text-[#C5B6BF] dark:hover:bg-white/5'
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        active
                          ? 'whisper-gradient text-white'
                          : 'bg-rose-100/80 text-[#D91B4E] dark:bg-white/10 dark:text-[#FF8C6B]'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold leading-tight whitespace-nowrap">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-tight text-[#64535C] dark:text-[#A696A1] truncate">
                        {option.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="rounded-3xl border border-rose-200/75 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/90">
            <h2 className="font-display text-base font-extrabold text-[#191116] dark:text-white">
              Moderation &amp; Demo State
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={blockedAliases.length === 0}
                onClick={onUnblockAll}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-200/80 bg-white px-4 py-2 text-xs font-semibold text-[#191116] disabled:opacity-50 hover:bg-rose-50 dark:border-white/15 dark:bg-white/5 dark:text-white cursor-pointer disabled:cursor-not-allowed"
              >
                <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Unblock All ({blockedAliases.length})</span>
              </button>

              <button
                type="button"
                onClick={onResetDemo}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-200/80 bg-white px-4 py-2 text-xs font-semibold text-[#191116] hover:bg-rose-50 dark:border-white/15 dark:bg-white/5 dark:text-white cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Inbox &amp; Profile</span>
              </button>

              <button
                type="button"
                onClick={onOpenGuidelines}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-200/80 bg-white px-4 py-2 text-xs font-semibold text-[#D91B4E] hover:bg-rose-50 dark:border-white/15 dark:bg-white/5 dark:text-[#FF8C6B] cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Guidelines &amp; Privacy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
