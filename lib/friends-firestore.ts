import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from './firebase';
import {
  FriendshipRecord,
  PublicUserRecord,
  buildCanonicalFriendshipId,
  buildFriendRequestWriteData,
  buildPublicUserWriteData,
  clampBlueprintString,
} from './friends';
import { UserProfile } from './whisperlink';

export async function syncSignedInUserToFirestore(
  user: User,
  profile: UserProfile
): Promise<void> {
  const uid = user.uid;
  const email = clampBlueprintString(user.email ?? '', 254, 'user@lurk.app');

  const privatePath = `users/${uid}`;
  try {
    const privateRef = doc(db, 'users', uid);
    const privateSnap = await getDoc(privateRef);
    if (!privateSnap.exists()) {
      await setDoc(privateRef, {
        uid,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(privateRef, {
        email,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }

  const publicPath = `publicUsers/${uid}`;
  try {
    const publicRef = doc(db, 'publicUsers', uid);
    const publicSnap = await getDoc(publicRef);
    const payload = buildPublicUserWriteData(uid, profile);
    if (!publicSnap.exists()) {
      await setDoc(publicRef, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(publicRef, {
        handle: payload.handle,
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl,
        status: payload.status,
        discoverable: payload.discoverable,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }
}

export function subscribePublicDirectory(
  onData: (users: PublicUserRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, 'publicUsers'),
    where('discoverable', '==', true)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list: PublicUserRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: String(data.uid ?? d.id),
          handle: String(data.handle ?? '@lurk'),
          displayName: String(data.displayName ?? 'Lurk User'),
          avatarUrl: String(data.avatarUrl ?? '/images/character-avatar.jpg'),
          status: String(data.status ?? ''),
          discoverable: Boolean(data.discoverable),
        };
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'publicUsers');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export function subscribeUserFriendships(
  uid: string,
  onData: (friendships: FriendshipRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, 'friendships'),
    where('participants', 'array-contains', uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list: FriendshipRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        const participants = Array.isArray(data.participants)
          ? ([String(data.participants[0] ?? ''), String(data.participants[1] ?? '')] as [
              string,
              string,
            ])
          : (['', ''] as [string, string]);
        return {
          id: d.id,
          participants,
          requesterId: String(data.requesterId ?? ''),
          recipientId: String(data.recipientId ?? ''),
          requesterHandle: String(data.requesterHandle ?? '@lurk'),
          requesterName: String(data.requesterName ?? 'Friend'),
          requesterAvatar: String(
            data.requesterAvatar ?? '/images/character-avatar.jpg'
          ),
          recipientHandle: String(data.recipientHandle ?? '@lurk'),
          recipientName: String(data.recipientName ?? 'Friend'),
          recipientAvatar: String(
            data.recipientAvatar ?? '/images/character-avatar.jpg'
          ),
          status:
            data.status === 'accepted' || data.status === 'declined'
              ? data.status
              : 'pending',
        };
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'friendships');
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) onError(wrapped);
      }
    }
  );
}

export async function sendFriendRequestToUser(
  requester: {
    uid: string;
    handle: string;
    displayName: string;
    avatarUrl: string;
  },
  recipient: PublicUserRecord
): Promise<void> {
  const friendshipId = buildCanonicalFriendshipId(requester.uid, recipient.uid);
  const path = `friendships/${friendshipId}`;
  try {
    const docRef = doc(db, 'friendships', friendshipId);
    const existingSnap = await getDoc(docRef);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      if (existingData.status === 'declined') {
        await deleteDoc(docRef);
      } else {
        return;
      }
    }
    const payload = buildFriendRequestWriteData(requester, recipient);
    await setDoc(docRef, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function respondToFriendRequest(
  friendshipId: string,
  decision: 'accepted' | 'declined'
): Promise<void> {
  const path = `friendships/${friendshipId}`;
  try {
    await updateDoc(doc(db, 'friendships', friendshipId), {
      status: decision,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeFriendshipEdge(friendshipId: string): Promise<void> {
  const path = `friendships/${friendshipId}`;
  try {
    await deleteDoc(doc(db, 'friendships', friendshipId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
