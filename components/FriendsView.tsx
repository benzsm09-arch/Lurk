'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Check,
  Clock,
  HelpCircle,
  LogIn,
  LogOut,
  Search,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  DiscoverableUserItem,
  FriendViewItem,
  PublicUserRecord,
} from '@/lib/friends';
import { UserProfile } from '@/lib/whisperlink';
import { triggerHaptic } from '@/lib/haptics';

interface FriendsViewProps {
  authUser: User | null;
  authReady: boolean;
  authError: string | null;
  profile: UserProfile;
  acceptedFriends: FriendViewItem[];
  incomingRequests: FriendViewItem[];
  outgoingRequests: FriendViewItem[];
  discoverableUsers: DiscoverableUserItem[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSignInGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSendFriendRequest: (recipient: PublicUserRecord) => Promise<void>;
  onAcceptRequest: (friendshipId: string, friendName: string) => Promise<void>;
  onDeclineRequest: (friendshipId: string) => Promise<void>;
  onRemoveFriendship: (friendshipId: string) => Promise<void>;
  onPickFriendInQuiz: (friendName: string) => void;
}

function FriendAvatar({
  src,
  name,
  sizeClass = 'h-11 w-11',
}: {
  src: string;
  name: string;
  sizeClass?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`relative ${sizeClass} shrink-0 overflow-hidden rounded-full border border-rose-200/80 bg-rose-100/70 dark:border-white/15 dark:bg-white/10`}
    >
      {!failed ? (
        <Image
          key={src}
          src={src}
          alt={name}
          fill
          sizes="48px"
          referrerPolicy="no-referrer"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display text-xs font-bold text-[#D91B4E] dark:text-[#FF8C6B]">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export default function FriendsView({
  authUser,
  authReady,
  authError,
  profile,
  acceptedFriends,
  incomingRequests,
  outgoingRequests,
  discoverableUsers,
  searchQuery,
  onSearchQueryChange,
  onSignInGoogle,
  onSignOut,
  onSendFriendRequest,
  onAcceptRequest,
  onDeclineRequest,
  onRemoveFriendship,
  onPickFriendInQuiz,
}: FriendsViewProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = async (id: string, fn: () => Promise<void>) => {
    setActionError(null);
    setBusyId(id);
    try {
      await fn();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not complete friend action.'
      );
    } finally {
      setBusyId(null);
    }
  };

  if (!authReady) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-12 md:pt-10">
        <div className="rounded-3xl border border-rose-200/75 bg-white/90 p-10 text-center dark:border-white/10 dark:bg-[#17121C]/90">
          <p className="text-sm font-medium text-[#64535C] dark:text-[#A696A1]">
            Connecting your friend circle...
          </p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-12 md:pt-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <section className="lg:col-span-7 rounded-3xl border border-rose-200/75 bg-white/90 p-8 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/90">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl whisper-gradient text-white whisper-glow">
              <Users className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-[#191116] dark:text-white sm:text-3xl text-balance">
              Build your Lurk Friend Circle
            </h1>
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-[#64535C] dark:text-[#B4A6AF]">
              Sign in with Google to publish your handle to the directory, send
              and accept friend requests stored in Firestore, and pick accepted
              friends directly inside the{' '}
              <strong className="font-semibold text-[#191116] dark:text-white">
                Guess Who Quiz
              </strong>{' '}
              game mode.
            </p>

            {authError && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              >
                {authError}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap_light');
                void onSignInGoogle();
              }}
              className="mt-6 inline-flex min-h-[48px] items-center gap-2.5 rounded-2xl whisper-gradient px-6 py-3 text-sm font-bold text-white whisper-glow transition-transform active:scale-[0.985] cursor-pointer"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>Sign in with Google</span>
            </button>
          </section>

          <aside className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-rose-200/70 bg-white/80 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/80">
              <h2 className="font-display text-sm font-bold text-[#191116] dark:text-white">
                How Friends Connect to Guess Who
              </h2>
              <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-[#64535C] dark:text-[#B4A6AF]">
                <li>1. Sign in to sync your public handle and custom avatar.</li>
                <li>2. Send requests to friends or accept incoming invites.</li>
                <li>
                  3. Select accepted friends with one tap when creating a{' '}
                  <strong className="font-semibold text-[#191116] dark:text-white">
                    Guess Who Quiz
                  </strong>{' '}
                  whisper.
                </li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-12 md:pt-10">
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#FF2E63] dark:text-[#FF7A59]">
            Synced Circle · {profile.handle}
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[#191116] dark:text-white sm:text-3xl">
            Friends &amp; Requests
          </h1>
          <p className="mt-1 text-sm text-[#64535C] dark:text-[#B4A6AF]">
            Accept friend requests and pick friends directly in Guess Who Quiz.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200/75 bg-white/90 px-3 py-1.5 dark:border-white/10 dark:bg-[#17121C]/90">
            <FriendAvatar
              src={profile.avatarUrl}
              name={profile.displayName}
              sizeClass="h-8 w-8"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#191116] dark:text-white truncate max-w-[140px]">
                {profile.displayName}
              </p>
              <p className="text-[11px] text-[#64535C] dark:text-[#A696A1] truncate max-w-[140px]">
                {profile.handle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap_light');
              void onSignOut();
            }}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-rose-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-[#191116] hover:bg-rose-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 whitespace-nowrap cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {actionError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          {actionError}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Requests Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Incoming Requests */}
          <section
            aria-labelledby="incoming-requests-heading"
            className="rounded-3xl border border-rose-200/75 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/90"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="incoming-requests-heading"
                className="font-display text-base font-extrabold text-[#191116] dark:text-white"
              >
                Incoming Requests
              </h2>
              <span className="font-mono-tabular text-xs font-semibold text-[#FF2E63] dark:text-[#FF7A59]">
                {incomingRequests.length}
              </span>
            </div>

            {incomingRequests.length === 0 ? (
              <p className="mt-4 text-xs leading-relaxed text-[#64535C] dark:text-[#A696A1]">
                No pending friend requests right now. Share your handle so
                friends can find you.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {incomingRequests.map((req) => (
                  <li
                    key={req.friendshipId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200/70 bg-[#FFF9F8] p-3.5 dark:border-white/10 dark:bg-[#100C14]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FriendAvatar src={req.avatarUrl} name={req.displayName} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#191116] dark:text-white truncate">
                          {req.displayName}
                        </p>
                        <p className="text-xs text-[#64535C] dark:text-[#A696A1] truncate">
                          {req.handle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busyId === req.friendshipId}
                        onClick={() =>
                          runAction(req.friendshipId, () =>
                            onAcceptRequest(req.friendshipId, req.displayName)
                          )
                        }
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl whisper-gradient px-3.5 py-2 text-xs font-bold text-white whitespace-nowrap cursor-pointer disabled:opacity-60"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Accept</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyId === req.friendshipId}
                        aria-label={`Decline friend request from ${req.displayName}`}
                        onClick={() =>
                          runAction(req.friendshipId, () =>
                            onDeclineRequest(req.friendshipId)
                          )
                        }
                        className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-rose-200/80 bg-white px-2.5 text-xs font-semibold text-[#64535C] hover:bg-rose-50 dark:border-white/15 dark:bg-white/5 dark:text-[#A696A1] cursor-pointer disabled:opacity-60"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Outgoing Sent Requests */}
          <section
            aria-labelledby="sent-requests-heading"
            className="rounded-3xl border border-rose-200/75 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/90"
          >
            <div className="flex items-center justify-between gap-2">
              <h2
                id="sent-requests-heading"
                className="font-display text-base font-extrabold text-[#191116] dark:text-white"
              >
                Sent Requests
              </h2>
              <span className="font-mono-tabular text-xs text-[#64535C] dark:text-[#A696A1]">
                {outgoingRequests.length}
              </span>
            </div>

            {outgoingRequests.length === 0 ? (
              <p className="mt-4 text-xs text-[#64535C] dark:text-[#A696A1]">
                No outgoing requests waiting.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {outgoingRequests.map((req) => (
                  <li
                    key={req.friendshipId}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200/70 bg-[#FFF9F8] p-3.5 dark:border-white/10 dark:bg-[#100C14]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FriendAvatar src={req.avatarUrl} name={req.displayName} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#191116] dark:text-white truncate">
                          {req.displayName}
                        </p>
                        <p className="text-xs text-[#64535C] dark:text-[#A696A1] truncate">
                          {req.handle} · Pending
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={busyId === req.friendshipId}
                      onClick={() =>
                        runAction(req.friendshipId, () =>
                          onRemoveFriendship(req.friendshipId)
                        )
                      }
                      className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-rose-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-[#64535C] hover:bg-rose-50 dark:border-white/15 dark:bg-white/5 dark:text-[#B4A6AF] cursor-pointer disabled:opacity-60"
                    >
                      <span>Cancel</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right: Accepted Friends + Find People Directory */}
        <div className="lg:col-span-7 space-y-6">
          {/* Accepted Friends */}
          <section
            aria-labelledby="my-friends-heading"
            className="rounded-3xl border border-rose-200/75 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/90"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="my-friends-heading"
                className="font-display text-lg font-extrabold text-[#191116] dark:text-white"
              >
                My Friends ({acceptedFriends.length})
              </h2>
              <span className="text-xs text-[#64535C] dark:text-[#A696A1]">
                Available in Guess Who Quiz
              </span>
            </div>

            {acceptedFriends.length === 0 ? (
              <p className="mt-4 text-xs leading-relaxed text-[#64535C] dark:text-[#A696A1]">
                You haven&apos;t added any friends yet. Find someone below to
                send a friend request!
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {acceptedFriends.map((friend) => (
                  <li
                    key={friend.friendshipId}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-rose-200/70 bg-[#FFF9F8] p-4 dark:border-white/10 dark:bg-[#100C14]"
                  >
                    <div className="flex items-center gap-3">
                      <FriendAvatar
                        src={friend.avatarUrl}
                        name={friend.displayName}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#191116] dark:text-white truncate">
                          {friend.displayName}
                        </p>
                        <p className="text-xs text-[#64535C] dark:text-[#A696A1] truncate">
                          {friend.handle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onPickFriendInQuiz(friend.displayName)}
                        className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#FF2E63]/30 bg-rose-50/70 px-3 py-1.5 text-xs font-bold text-[#D91B4E] hover:bg-rose-100/70 dark:border-[#FF7A59]/30 dark:bg-[#FF2E63]/15 dark:text-[#FF9D80] whitespace-nowrap cursor-pointer"
                      >
                        <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Use in Guess Who</span>
                      </button>
                      <button
                        type="button"
                        disabled={busyId === friend.friendshipId}
                        aria-label={`Remove ${friend.displayName} from friends`}
                        onClick={() =>
                          runAction(friend.friendshipId, () =>
                            onRemoveFriendship(friend.friendshipId)
                          )
                        }
                        className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-rose-200/80 bg-white text-[#64535C] hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-white/10 dark:bg-white/5 dark:text-[#A696A1] dark:hover:text-red-300 cursor-pointer disabled:opacity-60"
                      >
                        <UserMinus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Directory Search */}
          <section
            aria-labelledby="discover-friends-heading"
            className="rounded-3xl border border-rose-200/75 bg-white/90 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#17121C]/90"
          >
            <h2
              id="discover-friends-heading"
              className="font-display text-lg font-extrabold text-[#191116] dark:text-white"
            >
              Find Friends on Lurk
            </h2>
            <p className="mt-1 text-xs text-[#64535C] dark:text-[#A696A1]">
              Search by handle or name to send a friend request.
            </p>

            <div className="relative mt-4">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#96838D]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                aria-label="Search Lurk users"
                placeholder="Search by @handle or display name..."
                className="w-full rounded-2xl border border-rose-200/80 bg-[#FFF9F8] py-2.5 pl-10 pr-4 text-sm text-[#191116] placeholder:text-[#96838D] focus:border-[#FF2E63] focus:outline-none dark:border-white/10 dark:bg-[#100C14] dark:text-white"
              />
            </div>

            {discoverableUsers.length === 0 ? (
              <p className="mt-4 text-xs text-[#64535C] dark:text-[#A696A1]">
                {searchQuery.trim()
                  ? 'No matching Lurk profiles found.'
                  : 'No other public profiles in the directory yet. When friends sign in, they appear here automatically.'}
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {discoverableUsers.map((person) => (
                  <li
                    key={person.uid}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200/70 bg-[#FFF9F8] p-3.5 dark:border-white/10 dark:bg-[#100C14]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FriendAvatar
                        src={person.avatarUrl}
                        name={person.displayName}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#191116] dark:text-white truncate">
                          {person.displayName}
                        </p>
                        <p className="text-xs text-[#64535C] dark:text-[#A696A1] truncate">
                          {person.handle}
                        </p>
                      </div>
                    </div>

                    {person.relationStatus === 'accepted' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <UserCheck className="h-4 w-4" aria-hidden="true" />
                        <span>Friends</span>
                      </span>
                    )}

                    {person.relationStatus === 'pending_outgoing' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64535C] dark:text-[#A696A1]">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        <span>Requested</span>
                      </span>
                    )}

                    {person.relationStatus === 'pending_incoming' &&
                      person.friendshipId && (
                        <button
                          type="button"
                          disabled={busyId === person.friendshipId}
                          onClick={() =>
                            runAction(person.friendshipId!, () =>
                              onAcceptRequest(
                                person.friendshipId!,
                                person.displayName
                              )
                            )
                          }
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl whisper-gradient px-3.5 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-60"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Accept Request</span>
                        </button>
                      )}

                    {(person.relationStatus === 'none' ||
                      person.relationStatus === 'declined') && (
                      <button
                        type="button"
                        disabled={busyId === person.uid}
                        onClick={() =>
                          runAction(person.uid, () =>
                            onSendFriendRequest(person)
                          )
                        }
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#FF2E63]/35 bg-white px-3.5 py-2 text-xs font-bold text-[#D91B4E] hover:bg-rose-50 dark:border-[#FF7A59]/35 dark:bg-white/5 dark:text-[#FF9D80] dark:hover:bg-white/10 whitespace-nowrap cursor-pointer disabled:opacity-60"
                      >
                        <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Add Friend</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
