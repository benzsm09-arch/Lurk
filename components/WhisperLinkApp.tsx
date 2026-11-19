'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import TopNav, { ActiveTab } from './TopNav';
import SendWhisperView from './SendWhisperView';
import InboxView from './InboxView';
import FriendsView from './FriendsView';
import ProfileShareView from './ProfileShareView';
import ClueMiniGameModal from './ClueMiniGameModal';
import StoryReplyModal from './StoryReplyModal';
import { GuidelinesModal } from './GuidelinesModal';
import { FirestoreErrorBoundary } from './FirestoreErrorBoundary';
import {
  DEFAULT_PROFILE,
  INITIAL_MESSAGES,
  MessageDraft,
  ThemePreference,
  UserProfile,
  WhisperMessage,
  advanceClueUnlock,
  answerGuessWho,
  blockSenderAndDelete,
  createInitialDraft,
  createWhisperMessage,
  filterInboxMessages,
  resolveThemeIsDark,
  sanitizeMessageDraft,
  sanitizeThemePreference,
  sanitizeUserProfile,
} from '@/lib/whisperlink';
import {
  CELEBRATION_EVENT,
  CelebrationToastPayload,
  triggerConfettiExplosion,
} from '@/lib/confetti';
import { triggerHaptic } from '@/lib/haptics';
import { auth, googleProvider, testConnection } from '@/lib/firebase';
import {
  FriendshipRecord,
  PublicUserRecord,
  assignFriendToGuessOptions,
  filterDiscoverableUsers,
  partitionFriendships,
} from '@/lib/friends';
import {
  removeFriendshipEdge,
  respondToFriendRequest,
  sendFriendRequestToUser,
  subscribePublicDirectory,
  subscribeUserFriendships,
  syncSignedInUserToFirestore,
} from '@/lib/friends-firestore';

const STORAGE_KEY = 'whisperlink_state_v1';
const STORAGE_EVENT = 'whisperlink-store-change';

interface PersistedState {
  messages: WhisperMessage[];
  blockedAliases: string[];
  profile: UserProfile;
  themePreference: ThemePreference;
  draft: MessageDraft;
}

const DEFAULT_STORE: PersistedState = {
  messages: INITIAL_MESSAGES,
  blockedAliases: [],
  profile: DEFAULT_PROFILE,
  themePreference: 'system',
  draft: createInitialDraft(),
};

let cachedRaw: string | null = null;
let cachedParsed: PersistedState = DEFAULT_STORE;

function getStoreSnapshot(): PersistedState {
  if (typeof window === 'undefined') return DEFAULT_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORE;
    if (raw === cachedRaw) return cachedParsed;
    const parsed = JSON.parse(raw) as Partial<PersistedState> & {
      isDark?: unknown;
    };
    cachedRaw = raw;
    cachedParsed = {
      messages: Array.isArray(parsed.messages)
        ? parsed.messages
        : INITIAL_MESSAGES,
      blockedAliases: Array.isArray(parsed.blockedAliases)
        ? parsed.blockedAliases
        : [],
      profile: sanitizeUserProfile(parsed.profile),
      themePreference: sanitizeThemePreference(
        parsed.themePreference,
        parsed.isDark
      ),
      draft: sanitizeMessageDraft(parsed.draft),
    };
    return cachedParsed;
  } catch {
    return DEFAULT_STORE;
  }
}

function getServerSnapshot(): PersistedState {
  return DEFAULT_STORE;
}

function subscribeStore(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener('storage', handler);
  window.addEventListener(STORAGE_EVENT, handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(STORAGE_EVENT, handler);
  };
}

function writeStore(next: PersistedState): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(next);
    cachedRaw = serialized;
    cachedParsed = next;
    window.localStorage.setItem(STORAGE_KEY, serialized);
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}

function subscribeSystemDark(callback: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function getSystemDarkSnapshot(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getSystemDarkServerSnapshot(): boolean {
  return false;
}

export default function WhisperLinkApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('send');
  const [activeClueMsgId, setActiveClueMsgId] = useState<string | null>(null);
  const [activeStoryMsgId, setActiveStoryMsgId] = useState<string | null>(null);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [celebrationToast, setCelebrationToast] =
    useState<CelebrationToastPayload | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [publicUsers, setPublicUsers] = useState<PublicUserRecord[]>([]);
  const [friendships, setFriendships] = useState<FriendshipRecord[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  const store = useSyncExternalStore(
    subscribeStore,
    getStoreSnapshot,
    getServerSnapshot
  );

  const systemPrefersDark = useSyncExternalStore(
    subscribeSystemDark,
    getSystemDarkSnapshot,
    getSystemDarkServerSnapshot
  );

  const { messages, blockedAliases, profile, themePreference, draft } = store;
  const isDark = resolveThemeIsDark(themePreference, systemPrefersDark);

  // Sync dark class onto <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Verify Firestore connectivity on mount
  useEffect(() => {
    void testConnection();
  }, []);

  // Subscribe to Firebase Auth state and gate Firestore listeners strictly on auth
  useEffect(() => {
    let active = true;
    let unsubPublic: (() => void) | null = null;
    let unsubFriends: (() => void) | null = null;

    const cleanupListeners = () => {
      if (unsubPublic) {
        unsubPublic();
        unsubPublic = null;
      }
      if (unsubFriends) {
        unsubFriends();
        unsubFriends = null;
      }
    };

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!active) return;
      cleanupListeners();

      if (!user) {
        setAuthUser(null);
        setAuthReady(true);
        setPublicUsers([]);
        setFriendships([]);
        return;
      }

      setAuthUser(user);
      setAuthReady(true);
      setAuthError(null);

      void syncSignedInUserToFirestore(user, getStoreSnapshot().profile).catch(
        (err) => {
          if (active) {
            setAuthError(
              err instanceof Error ? err.message : 'Failed to sync your profile.'
            );
          }
        }
      );

      unsubPublic = subscribePublicDirectory(
        (users) => {
          if (active) setPublicUsers(users);
        },
        (err) => {
          if (active) setAuthError(err.message);
        }
      );

      unsubFriends = subscribeUserFriendships(
        user.uid,
        (edges) => {
          if (active) setFriendships(edges);
        },
        (err) => {
          if (active) setAuthError(err.message);
        }
      );
    });

    return () => {
      active = false;
      cleanupListeners();
      unsubAuth();
    };
  }, []);

  // Listen for celebration feedback events and auto-dismiss after 3.2s
  useEffect(() => {
    let dismissTimer: number | undefined;
    const handleCelebration = (e: Event) => {
      const custom = e as CustomEvent<CelebrationToastPayload>;
      if (!custom.detail) return;
      setCelebrationToast(custom.detail);
      if (dismissTimer) window.clearTimeout(dismissTimer);
      dismissTimer = window.setTimeout(() => {
        setCelebrationToast((prev) =>
          prev?.id === custom.detail.id ? null : prev
        );
      }, 3200);
    };
    window.addEventListener(CELEBRATION_EVENT, handleCelebration);
    return () => {
      window.removeEventListener(CELEBRATION_EVENT, handleCelebration);
      if (dismissTimer) window.clearTimeout(dismissTimer);
    };
  }, []);

  const visibleMessages = filterInboxMessages(messages, 'all', blockedAliases);
  const unreadCount = visibleMessages.filter((m) => !m.isRead).length;

  const { accepted: acceptedFriends, incomingPending, outgoingPending } =
    authUser
      ? partitionFriendships(friendships, authUser.uid)
      : { accepted: [], incomingPending: [], outgoingPending: [] };

  const discoverableUsers = authUser
    ? filterDiscoverableUsers(
        publicUsers,
        authUser.uid,
        friendships,
        friendSearchQuery
      )
    : [];

  const handleDraftChange = useCallback(
    (updater: MessageDraft | ((prev: MessageDraft) => MessageDraft)) => {
      const current = getStoreSnapshot();
      const nextDraft =
        typeof updater === 'function' ? updater(current.draft) : updater;
      writeStore({ ...current, draft: nextDraft });
    },
    []
  );

  const handleSendMessage = (submittedDraft: MessageDraft) => {
    const current = getStoreSnapshot();
    const nextMsg = createWhisperMessage(submittedDraft, Date.now());
    writeStore({
      ...current,
      messages: [nextMsg, ...current.messages],
      draft: createInitialDraft(),
    });
  };

  const handleAnswerGuessWho = (messageId: string, chosenIndex: number) => {
    const target = messages.find((m) => m.id === messageId);
    const wasUnanswered = target?.guessWho?.selectedIndex === null;
    const correctName =
      target?.guessWho?.options[target.guessWho.correctIndex] ?? undefined;
    const { updatedMessages, isCorrect } = answerGuessWho(messages, messageId, chosenIndex);
    writeStore({ ...store, messages: updatedMessages });
    if (wasUnanswered) {
      triggerConfettiExplosion(
        isCorrect ? 'guess_who_win' : 'guess_who_done',
        correctName
      );
    }
  };

  const handleAdvanceClue = (messageId: string) => {
    const prevMsg = messages.find((m) => m.id === messageId);
    const wasUnlocked = Boolean(prevMsg?.clueDrop?.unlocked);
    const updatedMessages = advanceClueUnlock(messages, messageId);
    writeStore({ ...store, messages: updatedMessages });
    const nextMsg = updatedMessages.find((m) => m.id === messageId);
    if (!wasUnlocked && nextMsg?.clueDrop?.unlocked) {
      triggerConfettiExplosion('clue_unlocked');
    }
  };

  const handleSaveReply = (messageId: string, replyText: string) => {
    const updatedMessages = messages.map((m) =>
      m.id === messageId ? { ...m, isRead: true, repliedText: replyText } : m
    );
    writeStore({ ...store, messages: updatedMessages });
  };

  const handleDeleteBlock = (messageId: string) => {
    triggerHaptic('destructive');
    const { updatedMessages, updatedBlockedAliases } = blockSenderAndDelete(
      messages,
      blockedAliases,
      messageId
    );
    writeStore({
      ...store,
      messages: updatedMessages,
      blockedAliases: updatedBlockedAliases,
    });
  };

  const handleSelectTab = (tab: ActiveTab) => {
    if (tab !== activeTab) {
      triggerHaptic('tap_light');
    }
    setActiveTab(tab);
  };

  const handleResetDemo = () => {
    writeStore({
      ...DEFAULT_STORE,
      themePreference: store.themePreference,
    });
  };

  const handleSetThemePreference = (nextPref: ThemePreference) => {
    triggerHaptic('tap_light');
    writeStore({ ...store, themePreference: nextPref });
  };

  const handleUpdateProfile = (nextProfile: UserProfile) => {
    writeStore({ ...store, profile: nextProfile });
    if (authUser) {
      void syncSignedInUserToFirestore(authUser, nextProfile).catch((err) => {
        setAuthError(
          err instanceof Error ? err.message : 'Failed to sync profile update.'
        );
      });
    }
  };

  const handleSignInGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google sign-in failed.'
      );
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-out failed.');
    }
  };

  const handleSendFriendRequest = async (recipient: PublicUserRecord) => {
    if (!authUser) return;
    await sendFriendRequestToUser(
      {
        uid: authUser.uid,
        handle: profile.handle,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      },
      recipient
    );
    triggerHaptic('tap_light');
  };

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    await respondToFriendRequest(friendshipId, 'accepted');
    triggerHaptic('celebrate_send');
  };

  const handleDeclineFriendRequest = async (friendshipId: string) => {
    await respondToFriendRequest(friendshipId, 'declined');
    triggerHaptic('tap_light');
  };

  const handleRemoveFriendship = async (friendshipId: string) => {
    await removeFriendshipEdge(friendshipId);
    triggerHaptic('destructive');
  };

  const handlePickFriendInQuiz = (friendName: string) => {
    triggerHaptic('tap_light');
    const current = getStoreSnapshot();
    const { options } = assignFriendToGuessOptions(
      current.draft.guessOptions,
      friendName
    );
    writeStore({
      ...current,
      draft: {
        ...current.draft,
        gameMode: 'guess_who',
        guessOptions: options,
      },
    });
    setActiveTab('send');
  };

  const activeClueMsg = activeClueMsgId
    ? messages.find((m) => m.id === activeClueMsgId) ?? null
    : null;
  const activeStoryMsg = activeStoryMsgId
    ? messages.find((m) => m.id === activeStoryMsgId) ?? null
    : null;

  return (
    <FirestoreErrorBoundary>
      <div className="relative min-h-screen overflow-x-clip">
        {/* Subtle atmospheric gradient backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#FF2E63]/16 via-[#FF5A4E]/12 to-[#FF9233]/16 blur-3xl dark:from-[#FF2E63]/20 dark:via-[#FF5A4E]/10 dark:to-[#FF9233]/12" />
        </div>

        <TopNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          unreadCount={unreadCount}
          pendingFriendsCount={incomingPending.length}
          isDark={isDark}
          onToggleTheme={() =>
            handleSetThemePreference(isDark ? 'light' : 'dark')
          }
        />

        <main>
          {activeTab === 'send' && (
            <SendWhisperView
              profile={profile}
              draft={draft}
              acceptedFriends={acceptedFriends}
              onDraftChange={handleDraftChange}
              onSendMessage={handleSendMessage}
              onGoToInbox={() => handleSelectTab('inbox')}
              onGoToFriends={() => handleSelectTab('friends')}
              onOpenGuidelines={() => {
                triggerHaptic('modal_open');
                setIsGuidelinesOpen(true);
              }}
            />
          )}

          {activeTab === 'inbox' && (
            <InboxView
              profile={profile}
              messages={messages}
              blockedAliases={blockedAliases}
              onAnswerGuessWho={handleAnswerGuessWho}
              onOpenClueGame={(msg) => {
                triggerHaptic('modal_open');
                setActiveClueMsgId(msg.id);
              }}
              onOpenStoryReply={(msg) => {
                triggerHaptic('modal_open');
                setActiveStoryMsgId(msg.id);
              }}
              onDeleteBlock={handleDeleteBlock}
              onResetDemo={handleResetDemo}
              onGoToSend={() => handleSelectTab('send')}
            />
          )}

          {activeTab === 'friends' && (
            <FriendsView
              authUser={authUser}
              authReady={authReady}
              authError={authError}
              profile={profile}
              acceptedFriends={acceptedFriends}
              incomingRequests={incomingPending}
              outgoingRequests={outgoingPending}
              discoverableUsers={discoverableUsers}
              searchQuery={friendSearchQuery}
              onSearchQueryChange={setFriendSearchQuery}
              onSignInGoogle={handleSignInGoogle}
              onSignOut={handleSignOut}
              onSendFriendRequest={handleSendFriendRequest}
              onAcceptRequest={(friendshipId) =>
                handleAcceptFriendRequest(friendshipId)
              }
              onDeclineRequest={handleDeclineFriendRequest}
              onRemoveFriendship={handleRemoveFriendship}
              onPickFriendInQuiz={handlePickFriendInQuiz}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileShareView
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              themePreference={themePreference}
              systemPrefersDark={systemPrefersDark}
              onChangeThemePreference={handleSetThemePreference}
              blockedAliases={blockedAliases}
              onUnblockAll={() => writeStore({ ...store, blockedAliases: [] })}
              onResetDemo={handleResetDemo}
              onGoToSend={() => handleSelectTab('send')}
              onOpenGuidelines={() => {
                triggerHaptic('modal_open');
                setIsGuidelinesOpen(true);
              }}
            />
          )}
        </main>

      <AnimatePresence>
        {activeClueMsg && (
          <ClueMiniGameModal
            message={activeClueMsg}
            onAdvanceStep={handleAdvanceClue}
            onClose={() => setActiveClueMsgId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeStoryMsg && (
          <StoryReplyModal
            message={activeStoryMsg}
            profile={profile}
            onSaveReply={handleSaveReply}
            onClose={() => setActiveStoryMsgId(null)}
          />
        )}
      </AnimatePresence>

      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />

      <AnimatePresence>
        {celebrationToast && (
          <motion.div
            key={celebrationToast.id}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="pointer-events-auto fixed top-16 left-1/2 z-[130] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-rose-200/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-xl dark:border-white/15 dark:bg-[#1A1320]/95"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl whisper-gradient text-white">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold leading-tight text-[#191116] dark:text-white truncate">
                {celebrationToast.title}
              </p>
              <p className="mt-0.5 text-xs text-[#64535C] dark:text-[#B4A6AF] truncate">
                {celebrationToast.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCelebrationToast(null)}
              aria-label="Dismiss celebration message"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#64535C] hover:bg-rose-50 dark:text-[#A696A1] dark:hover:bg-white/10 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </FirestoreErrorBoundary>
  );
}
