'use client';

import { Inbox, Link2, Moon, Send, Sun, Users } from 'lucide-react';

export type ActiveTab = 'send' | 'inbox' | 'friends' | 'profile';

interface TopNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  unreadCount: number;
  pendingFriendsCount?: number;
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function TopNav({
  activeTab,
  onSelectTab,
  unreadCount,
  pendingFriendsCount = 0,
  isDark,
  onToggleTheme,
}: TopNavProps) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-rose-200/60 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#110C14]/85">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('send')}
            className="whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2E63]"
          >
            <span className="inline-block font-display text-[22px] leading-none font-extrabold tracking-[-0.03em] text-[#191116] transition-opacity hover:opacity-80 dark:text-white whitespace-nowrap">
              Lurk
            </span>
          </button>

          {/* Zone 2: Clean single-line text navigation links (Desktop) */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => onSelectTab('send')}
              className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'send'
                  ? 'text-[#191116] dark:text-white font-semibold'
                  : 'text-[#64535C] hover:text-[#191116] dark:text-[#A696A1] dark:hover:text-white'
              }`}
            >
              Send Whisper
              {activeTab === 'send' && (
                <span className="absolute inset-x-0 -bottom-[15px] h-0.5 whisper-gradient rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('inbox')}
              className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'inbox'
                  ? 'text-[#191116] dark:text-white font-semibold'
                  : 'text-[#64535C] hover:text-[#191116] dark:text-[#A696A1] dark:hover:text-white'
              }`}
            >
              Owner Inbox{' '}
              <span className="font-mono-tabular text-xs text-[#FF2E63] dark:text-[#FF7A59]">
                ({unreadCount})
              </span>
              {activeTab === 'inbox' && (
                <span className="absolute inset-x-0 -bottom-[15px] h-0.5 whisper-gradient rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('friends')}
              className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'friends'
                  ? 'text-[#191116] dark:text-white font-semibold'
                  : 'text-[#64535C] hover:text-[#191116] dark:text-[#A696A1] dark:hover:text-white'
              }`}
            >
              Friends
              {pendingFriendsCount > 0 && (
                <>
                  {' '}
                  <span className="font-mono-tabular text-xs text-[#FF2E63] dark:text-[#FF7A59]">
                    ({pendingFriendsCount})
                  </span>
                </>
              )}
              {activeTab === 'friends' && (
                <span className="absolute inset-x-0 -bottom-[15px] h-0.5 whisper-gradient rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'text-[#191116] dark:text-white font-semibold'
                  : 'text-[#64535C] hover:text-[#191116] dark:text-[#A696A1] dark:hover:text-white'
              }`}
            >
              My Link
              {activeTab === 'profile' && (
                <span className="absolute inset-x-0 -bottom-[15px] h-0.5 whisper-gradient rounded-full" />
              )}
            </button>
          </nav>

          {/* Zone 3: Prominent Theme Toggle reflecting active theme */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-pressed={isDark}
              aria-label={
                isDark
                  ? 'Current theme: Dark. Switch to Light mode'
                  : 'Current theme: Light. Switch to Dark mode'
              }
              data-testid="theme-toggle-button"
              data-theme={isDark ? 'dark' : 'light'}
              className={`group inline-flex min-h-[44px] items-center gap-2.5 rounded-full border p-1 pr-3.5 text-xs font-bold tracking-tight transition-all duration-150 active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2E63] ${
                isDark
                  ? 'border-white/25 bg-[#1E1626] text-white shadow-md shadow-black/40 hover:border-amber-300/50 hover:bg-[#271D32]'
                  : 'border-[#FF2E63]/35 bg-white text-[#191116] shadow-md shadow-[#FF2E63]/15 hover:border-[#FF2E63]/60 hover:bg-[#FFF5F2]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`relative flex items-center rounded-full p-0.5 transition-colors duration-150 ${
                  isDark ? 'bg-black/40' : 'bg-rose-100/80'
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150 ${
                    !isDark
                      ? 'whisper-gradient text-white shadow-sm scale-100'
                      : 'text-[#8C7A86] scale-90 opacity-65 group-hover:opacity-90'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                </span>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150 ${
                    isDark
                      ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-[#191116] shadow-sm scale-100'
                      : 'text-[#9A818D] scale-90 opacity-65 group-hover:opacity-90'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                </span>
              </span>

              <span className="font-display text-xs font-bold">
                {isDark ? 'Dark' : 'Light'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Thumb-Zone Bottom Bar (<= 60px height, well below 15% of 844px) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 grid h-15 grid-cols-4 border-t border-rose-200/70 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#110C14]/92 md:hidden"
      >
        <button
          type="button"
          onClick={() => onSelectTab('send')}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
            activeTab === 'send'
              ? 'text-[#FF2E63] dark:text-[#FF7A59]'
              : 'text-[#64535C] dark:text-[#A696A1]'
          }`}
        >
          <Send className="h-5 w-5" aria-hidden="true" />
          <span>Send</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('inbox')}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
            activeTab === 'inbox'
              ? 'text-[#FF2E63] dark:text-[#FF7A59]'
              : 'text-[#64535C] dark:text-[#A696A1]'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Inbox className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="font-mono-tabular absolute -right-3 -top-1 text-[10px] font-bold text-[#FF2E63] dark:text-[#FF7A59]">
                {unreadCount}
              </span>
            )}
          </div>
          <span>Inbox</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('friends')}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
            activeTab === 'friends'
              ? 'text-[#FF2E63] dark:text-[#FF7A59]'
              : 'text-[#64535C] dark:text-[#A696A1]'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Users className="h-5 w-5" aria-hidden="true" />
            {pendingFriendsCount > 0 && (
              <span className="font-mono-tabular absolute -right-3 -top-1 text-[10px] font-bold text-[#FF2E63] dark:text-[#FF7A59]">
                {pendingFriendsCount}
              </span>
            )}
          </div>
          <span>Friends</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('profile')}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
            activeTab === 'profile'
              ? 'text-[#FF2E63] dark:text-[#FF7A59]'
              : 'text-[#64535C] dark:text-[#A696A1]'
          }`}
        >
          <Link2 className="h-5 w-5" aria-hidden="true" />
          <span>My Link</span>
        </button>
      </nav>
    </>
  );
}
