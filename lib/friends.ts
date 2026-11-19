import { UserProfile } from './whisperlink';

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export interface PublicUserRecord {
  uid: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
  status: string;
  discoverable: boolean;
}

export interface FriendshipRecord {
  id: string;
  participants: [string, string];
  requesterId: string;
  recipientId: string;
  requesterHandle: string;
  requesterName: string;
  requesterAvatar: string;
  recipientHandle: string;
  recipientName: string;
  recipientAvatar: string;
  status: FriendshipStatus;
}

export interface FriendViewItem {
  friendshipId: string;
  uid: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
  status: FriendshipStatus;
  direction: 'incoming' | 'outgoing';
}

export type DiscoverRelationStatus =
  | 'none'
  | 'accepted'
  | 'pending_outgoing'
  | 'pending_incoming'
  | 'declined';

export interface DiscoverableUserItem extends PublicUserRecord {
  relationStatus: DiscoverRelationStatus;
  friendshipId: string | null;
}

export function buildCanonicalFriendshipId(uidA: string, uidB: string): string {
  const sorted = [uidA.trim(), uidB.trim()].sort();
  return `${sorted[0]}__${sorted[1]}`;
}

export function clampBlueprintString(
  value: string,
  maxLength: number,
  fallback: string = ''
): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback.slice(0, maxLength);
  return trimmed.slice(0, maxLength);
}

export function buildPublicUserWriteData(
  uid: string,
  profile: UserProfile
): Omit<PublicUserRecord, 'uid'> & { uid: string } {
  const handleBase = clampBlueprintString(profile.handle, 32, '@lurkuser');
  const normalizedHandle = handleBase.startsWith('@')
    ? handleBase.slice(0, 32)
    : `@${handleBase}`.slice(0, 32);

  return {
    uid: clampBlueprintString(uid, 128),
    handle: normalizedHandle.length >= 2 ? normalizedHandle : '@lurk',
    displayName: clampBlueprintString(profile.displayName, 40, 'Lurk User'),
    avatarUrl: clampBlueprintString(
      profile.avatarUrl,
      20000,
      '/images/character-avatar.jpg'
    ),
    status: profile.status.trim().slice(0, 80),
    discoverable: true,
  };
}

export function buildFriendRequestWriteData(
  requester: {
    uid: string;
    handle: string;
    displayName: string;
    avatarUrl: string;
  },
  recipient: PublicUserRecord
): Omit<FriendshipRecord, 'id'> {
  const sortedParticipants = [requester.uid, recipient.uid].sort() as [
    string,
    string,
  ];
  return {
    participants: sortedParticipants,
    requesterId: clampBlueprintString(requester.uid, 128),
    recipientId: clampBlueprintString(recipient.uid, 128),
    requesterHandle: clampBlueprintString(requester.handle, 32, '@lurk'),
    requesterName: clampBlueprintString(requester.displayName, 40, 'Friend'),
    requesterAvatar: clampBlueprintString(
      requester.avatarUrl,
      20000,
      '/images/character-avatar.jpg'
    ),
    recipientHandle: clampBlueprintString(recipient.handle, 32, '@lurk'),
    recipientName: clampBlueprintString(recipient.displayName, 40, 'Friend'),
    recipientAvatar: clampBlueprintString(
      recipient.avatarUrl,
      20000,
      '/images/character-avatar.jpg'
    ),
    status: 'pending',
  };
}

export function partitionFriendships(
  friendships: FriendshipRecord[],
  currentUid: string
): {
  accepted: FriendViewItem[];
  incomingPending: FriendViewItem[];
  outgoingPending: FriendViewItem[];
} {
  const accepted: FriendViewItem[] = [];
  const incomingPending: FriendViewItem[] = [];
  const outgoingPending: FriendViewItem[] = [];

  for (const edge of friendships) {
    const isRequester = edge.requesterId === currentUid;
    const isRecipient = edge.recipientId === currentUid;
    if (!isRequester && !isRecipient) continue;

    const item: FriendViewItem = {
      friendshipId: edge.id,
      uid: isRequester ? edge.recipientId : edge.requesterId,
      handle: isRequester ? edge.recipientHandle : edge.requesterHandle,
      displayName: isRequester ? edge.recipientName : edge.requesterName,
      avatarUrl: isRequester ? edge.recipientAvatar : edge.requesterAvatar,
      status: edge.status,
      direction: isRequester ? 'outgoing' : 'incoming',
    };

    if (edge.status === 'accepted') {
      accepted.push(item);
    } else if (edge.status === 'pending') {
      if (isRecipient) {
        incomingPending.push(item);
      } else {
        outgoingPending.push(item);
      }
    }
  }

  return { accepted, incomingPending, outgoingPending };
}

export function filterDiscoverableUsers(
  users: PublicUserRecord[],
  currentUid: string,
  friendships: FriendshipRecord[],
  queryText: string
): DiscoverableUserItem[] {
  const q = queryText.trim().toLowerCase();
  const byPeer = new Map<string, FriendshipRecord>();
  for (const edge of friendships) {
    const peerUid =
      edge.requesterId === currentUid
        ? edge.recipientId
        : edge.recipientId === currentUid
          ? edge.requesterId
          : null;
    if (peerUid) byPeer.set(peerUid, edge);
  }

  return users
    .filter((u) => {
      if (u.uid === currentUid || !u.discoverable) return false;
      if (!q) return true;
      return (
        u.handle.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q)
      );
    })
    .map((u) => {
      const edge = byPeer.get(u.uid);
      let relationStatus: DiscoverRelationStatus = 'none';
      if (edge) {
        if (edge.status === 'accepted') relationStatus = 'accepted';
        else if (edge.status === 'declined') relationStatus = 'declined';
        else if (edge.requesterId === currentUid)
          relationStatus = 'pending_outgoing';
        else relationStatus = 'pending_incoming';
      }
      return {
        ...u,
        relationStatus,
        friendshipId: edge?.id ?? null,
      };
    });
}

export function assignFriendToGuessOptions(
  currentOptions: [string, string, string, string],
  friendName: string,
  preferredSlot?: number
): { options: [string, string, string, string]; slotUsed: number } {
  const cleaned = friendName.trim().slice(0, 28);
  if (!cleaned) {
    return { options: currentOptions, slotUsed: -1 };
  }

  const normalizedTarget = cleaned.toLowerCase();
  const existingIdx = currentOptions.findIndex(
    (opt) => opt.trim().toLowerCase() === normalizedTarget
  );
  if (existingIdx !== -1) {
    return { options: currentOptions, slotUsed: existingIdx };
  }

  const next = [...currentOptions] as [string, string, string, string];
  if (
    typeof preferredSlot === 'number' &&
    preferredSlot >= 0 &&
    preferredSlot <= 3
  ) {
    next[preferredSlot] = cleaned;
    return { options: next, slotUsed: preferredSlot };
  }

  const emptyIdx = next.findIndex((opt) => opt.trim().length === 0);
  const targetIdx = emptyIdx !== -1 ? emptyIdx : 3;
  next[targetIdx] = cleaned;
  return { options: next, slotUsed: targetIdx };
}

export function fillGuessOptionsWithFriends(
  currentOptions: [string, string, string, string],
  friends: { displayName: string }[]
): [string, string, string, string] {
  let next = [...currentOptions] as [string, string, string, string];
  for (const friend of friends) {
    const emptyIdx = next.findIndex((opt) => opt.trim().length === 0);
    if (emptyIdx === -1) break;
    const res = assignFriendToGuessOptions(next, friend.displayName, emptyIdx);
    next = res.options;
  }
  return next;
}
