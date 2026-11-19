import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_MESSAGES,
  MAX_VOICE_DURATION_SEC,
  advanceClueUnlock,
  answerGuessWho,
  blockSenderAndDelete,
  computeElapsedRecordSeconds,
  computeRemainingRecordSeconds,
  countMessagesByFilter,
  createInitialDraft,
  createWhisperMessage,
  filterInboxMessages,
  formatVoiceDuration,
  resolveThemeIsDark,
  sanitizeMessageDraft,
  sanitizeThemePreference,
  sanitizeUserProfile,
  spinTruthOrDarePrompt,
  validateMessageDraft,
} from './whisperlink';
import {
  LURK_CONFETTI_COLORS,
  getCelebrationFeedback,
  getConfettiBursts,
} from './confetti-config';
import {
  buildQrDownloadFilename,
  buildShareSlug,
  buildShareUrl,
  generateShareQrDataUrl,
} from './qr';
import { getHapticPattern, triggerHaptic } from './haptics';
import {
  FriendshipRecord,
  PublicUserRecord,
  assignFriendToGuessOptions,
  buildCanonicalFriendshipId,
  buildFriendRequestWriteData,
  buildPublicUserWriteData,
  fillGuessOptionsWithFriends,
  filterDiscoverableUsers,
  partitionFriendships,
} from './friends';
import {
  generateCharacterAvatarDataUrl,
  generateCharacterAvatarSvg,
  generateCharacterAvatarTraits,
} from './avatar-generator';

test('validateMessageDraft rejects empty messages and incomplete game attachments', () => {
  const emptyDraft = createInitialDraft();
  assert.equal(validateMessageDraft(emptyDraft).valid, false);

  const guessIncomplete = {
    ...createInitialDraft(),
    text: 'Guess who sent this!',
    gameMode: 'guess_who' as const,
    guessOptions: ['Alex', 'Sam', '', 'Jordan'] as [string, string, string, string],
  };
  assert.equal(validateMessageDraft(guessIncomplete).valid, false);

  const guessValid = {
    ...guessIncomplete,
    guessOptions: ['Alex', 'Sam', 'Taylor', 'Jordan'] as [string, string, string, string],
  };
  assert.equal(validateMessageDraft(guessValid).valid, true);

  const clueMissing = {
    ...createInitialDraft(),
    text: 'Check the hint',
    gameMode: 'clue_drop' as const,
    clueHint: ' ',
  };
  assert.equal(validateMessageDraft(clueMissing).valid, false);
});

test('createWhisperMessage builds structured payloads for each game mode', () => {
  const draft = {
    ...createInitialDraft(),
    text: 'See if you can decode this.',
    gameMode: 'clue_drop' as const,
    clueHint: 'Starts with L',
  };
  const created = createWhisperMessage(draft, 1795012000000);
  assert.equal(created.gameMode, 'clue_drop');
  assert.equal(created.clueDrop?.hint, 'Starts with L');
  assert.equal(created.clueDrop?.unlocked, false);
  assert.equal(created.clueDrop?.progress, 0);
  assert.equal(created.clueDrop?.requiredSteps, 3);
});

test('advanceClueUnlock completes after 3 steps and unlocks the clue', () => {
  const clueMsg = INITIAL_MESSAGES.find((m) => m.gameMode === 'clue_drop');
  assert.ok(clueMsg);

  let state = advanceClueUnlock(INITIAL_MESSAGES, clueMsg.id);
  assert.equal(state.find((m) => m.id === clueMsg.id)?.clueDrop?.progress, 1);
  assert.equal(state.find((m) => m.id === clueMsg.id)?.clueDrop?.unlocked, false);

  state = advanceClueUnlock(state, clueMsg.id);
  state = advanceClueUnlock(state, clueMsg.id);
  const unlocked = state.find((m) => m.id === clueMsg.id)?.clueDrop;
  assert.equal(unlocked?.progress, 3);
  assert.equal(unlocked?.unlocked, true);
});

test('answerGuessWho records selected option and evaluates correctness', () => {
  const quizMsg = INITIAL_MESSAGES.find((m) => m.gameMode === 'guess_who');
  assert.ok(quizMsg && quizMsg.guessWho);

  const wrong = answerGuessWho(INITIAL_MESSAGES, quizMsg.id, 0);
  assert.equal(wrong.isCorrect, false);
  assert.equal(
    wrong.updatedMessages.find((m) => m.id === quizMsg.id)?.guessWho?.selectedIndex,
    0
  );

  const right = answerGuessWho(
    INITIAL_MESSAGES,
    quizMsg.id,
    quizMsg.guessWho.correctIndex
  );
  assert.equal(right.isCorrect, true);
});

test('blockSenderAndDelete removes message, blocks alias, and updates counts', () => {
  const target = INITIAL_MESSAGES[0];
  const { updatedMessages, updatedBlockedAliases } = blockSenderAndDelete(
    INITIAL_MESSAGES,
    [],
    target.id
  );
  assert.equal(updatedMessages.length, INITIAL_MESSAGES.length - 1);
  assert.ok(updatedBlockedAliases.includes(target.senderAlias));

  const counts = countMessagesByFilter(updatedMessages, updatedBlockedAliases);
  assert.equal(counts.all, INITIAL_MESSAGES.length - 1);
  assert.equal(counts.clue_drop, 0);

  const filtered = filterInboxMessages(
    INITIAL_MESSAGES,
    'all',
    updatedBlockedAliases
  );
  assert.equal(filtered.some((m) => m.senderAlias === target.senderAlias), false);
});

test('spinTruthOrDarePrompt returns a different prompt than the current one', () => {
  const first = spinTruthOrDarePrompt(undefined, () => 0);
  const second = spinTruthOrDarePrompt(first.prompt, () => 0);
  assert.notEqual(second.prompt, first.prompt);
});

test('voice_note supports 5-minute (300s) duration and formats mm:ss', () => {
  const draft = {
    ...createInitialDraft(),
    text: 'Long midnight confession.',
    gameMode: 'voice_note' as const,
    voiceRecorded: true,
    voiceDurationSec: 300,
  };
  const created = createWhisperMessage(draft, 1795013000000);
  assert.equal(created.voiceNote?.durationSec, 300);
  assert.equal(formatVoiceDuration(300), '5:00');
  assert.equal(formatVoiceDuration(6), '0:06');
});

test('5-minute countdown timer helpers compute remaining and elapsed seconds accurately', () => {
  const start = 1795014000000;
  assert.equal(MAX_VOICE_DURATION_SEC, 300);
  assert.equal(computeRemainingRecordSeconds(start, start), 300);
  assert.equal(formatVoiceDuration(computeRemainingRecordSeconds(start, start)), '5:00');
  assert.equal(computeRemainingRecordSeconds(start, start + 1200), 299);
  assert.equal(formatVoiceDuration(computeRemainingRecordSeconds(start, start + 1200)), '4:59');
  assert.equal(computeRemainingRecordSeconds(start, start + 305000), 0);
  assert.equal(computeElapsedRecordSeconds(start, start + 4200), 4);
  assert.equal(computeElapsedRecordSeconds(start, start + 200), 1);
});

test('sanitizeMessageDraft restores persisted text safely and rejects invalid fields', () => {
  const restored = sanitizeMessageDraft({
    text: 'Saved across tabs',
    gameMode: 'clue_drop',
    clueHint: 'Starts with A',
  });
  assert.equal(restored.text, 'Saved across tabs');
  assert.equal(restored.gameMode, 'clue_drop');
  assert.equal(restored.clueHint, 'Starts with A');

  const malformed = sanitizeMessageDraft({
    text: 123,
    gameMode: 'invalid_mode',
    guessCorrectIndex: 99,
  });
  assert.equal(malformed.text, '');
  assert.equal(malformed.gameMode, 'none');
  assert.equal(malformed.guessCorrectIndex, 0);
});

test('sanitizeUserProfile migrates legacy profile photo URL to illustrated character avatar', () => {
  const migrated = sanitizeUserProfile({
    handle: '@custom_handle',
    displayName: 'Maya',
    status: 'Online',
    promptHeadline: 'Ask anything',
    avatarUrl: '/images/profile-avatar.jpg',
  });
  assert.equal(migrated.avatarUrl, '/images/character-avatar.jpg');
  assert.equal(migrated.handle, '@custom_handle');

  const customAvatar = sanitizeUserProfile({
    avatarUrl: '/images/custom-avatar.png',
  });
  assert.equal(customAvatar.avatarUrl, '/images/custom-avatar.png');
});

test('getConfettiBursts configures Sunset bursts with reduced-motion safeguard', () => {
  const sendBursts = getConfettiBursts('whisper_sent');
  assert.equal(sendBursts.length, 3);
  assert.equal(sendBursts[0].options.disableForReducedMotion, true);
  assert.deepEqual(sendBursts[0].options.colors, LURK_CONFETTI_COLORS);

  const clueBursts = getConfettiBursts('clue_unlocked');
  assert.equal(clueBursts.length, 2);
  assert.ok((clueBursts[0].options.particleCount ?? 0) >= 60);

  const guessWinBursts = getConfettiBursts('guess_who_win');
  const guessDoneBursts = getConfettiBursts('guess_who_done');
  assert.ok(
    (guessWinBursts[0].options.particleCount ?? 0) >
      (guessDoneBursts[0].options.particleCount ?? 0)
  );
});

test('getCelebrationFeedback returns contextual messages, chimes, and haptics', () => {
  const sent = getCelebrationFeedback('whisper_sent', '@prettyychaos_');
  assert.equal(sent.title, 'Whisper delivered!');
  assert.equal(sent.subtitle, 'Sent anonymously to @prettyychaos_');
  assert.ok(sent.chimeNotes.length >= 3);
  assert.ok(sent.hapticPattern.length >= 1);

  const clue = getCelebrationFeedback('clue_unlocked');
  assert.equal(clue.title, 'Identity clue unlocked!');
  assert.equal(clue.subtitle, 'All 3 Signal Keys decoded');

  const guessWin = getCelebrationFeedback('guess_who_win', 'Devon');
  assert.equal(guessWin.title, 'Nailed the guess!');
  assert.equal(guessWin.subtitle, 'You spotted Devon');

  const guessDone = getCelebrationFeedback('guess_who_done', 'Devon');
  assert.equal(guessDone.title, 'Guess revealed');
  assert.equal(guessDone.subtitle, 'It was Devon');
});

test('QR share helpers normalize handle and generate a valid PNG data URL', async () => {
  assert.equal(buildShareSlug('@prettyychaos_'), 'prettyychaos_');
  assert.equal(buildShareSlug('  @lurk user! '), 'lurkuser');
  assert.equal(buildShareSlug('   '), 'prettyychaos_');
  assert.equal(buildShareUrl('@maya_99'), 'https://whisperlink.app/maya_99');
  assert.equal(buildQrDownloadFilename('@maya_99'), 'lurk-maya_99-qr.png');

  const dataUrl = await generateShareQrDataUrl('@maya_99');
  assert.ok(dataUrl.startsWith('data:image/png;base64,'));
  assert.ok(dataUrl.length > 200);
});

test('Haptic API patterns and reduced-motion safeguards behave accurately', () => {
  assert.deepEqual(getHapticPattern('modal_open'), [12, 18, 12]);
  assert.deepEqual(getHapticPattern('celebrate_send'), [16, 24, 24]);
  assert.deepEqual(getHapticPattern('error_nudge'), [22, 28, 22]);

  // Safe no-op in Node SSR environment
  assert.equal(triggerHaptic('tap_light'), false);

  // Mock browser navigator.vibrate + reduced-motion check
  const prevWindow = (globalThis as { window?: unknown }).window;
  const prevNavigator = (globalThis as { navigator?: unknown }).navigator;
  const recordedCalls: unknown[] = [];

  try {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        matchMedia: () => ({ matches: false }),
      },
    });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        vibrate: (pattern: number[]) => {
          recordedCalls.push(pattern);
          return true;
        },
      },
    });

    assert.equal(triggerHaptic('modal_open'), true);
    assert.deepEqual(recordedCalls, [[12, 18, 12]]);

    // Respects prefers-reduced-motion
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        matchMedia: () => ({ matches: true }),
      },
    });
    assert.equal(triggerHaptic('celebrate_send'), false);
    assert.equal(recordedCalls.length, 1);
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: prevWindow,
    });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: prevNavigator,
    });
  }
});

test('Theme preference sanitization and Light/Dark/System resolution work accurately', () => {
  assert.equal(sanitizeThemePreference('light', true), 'light');
  assert.equal(sanitizeThemePreference('dark', false), 'dark');
  assert.equal(sanitizeThemePreference('system', true), 'system');
  assert.equal(sanitizeThemePreference(undefined, true), 'dark');
  assert.equal(sanitizeThemePreference(undefined, false), 'light');
  assert.equal(sanitizeThemePreference('invalid', undefined), 'system');

  assert.equal(resolveThemeIsDark('light', true), false);
  assert.equal(resolveThemeIsDark('dark', false), true);
  assert.equal(resolveThemeIsDark('system', true), true);
  assert.equal(resolveThemeIsDark('system', false), false);
});

test('Friends domain helpers build canonical IDs, partition edges, and filter directory', () => {
  assert.equal(buildCanonicalFriendshipId('uid_b', 'uid_a'), 'uid_a__uid_b');
  assert.equal(buildCanonicalFriendshipId(' uid_2 ', 'uid_1'), 'uid_1__uid_2');

  const publicPayload = buildPublicUserWriteData('uid_me', {
    handle: 'maya_star',
    displayName: 'Maya',
    status: 'Online',
    promptHeadline: 'Ask me',
    avatarUrl: '/images/character-avatar.jpg',
  });
  assert.equal(publicPayload.handle, '@maya_star');
  assert.equal(publicPayload.discoverable, true);

  const users: PublicUserRecord[] = [
    {
      uid: 'uid_me',
      handle: '@maya_star',
      displayName: 'Maya',
      avatarUrl: '/images/character-avatar.jpg',
      status: 'Online',
      discoverable: true,
    },
    {
      uid: 'uid_alex',
      handle: '@alex_v',
      displayName: 'Alex',
      avatarUrl: '/images/character-avatar.jpg',
      status: 'Gaming',
      discoverable: true,
    },
    {
      uid: 'uid_sam',
      handle: '@sam_k',
      displayName: 'Sam',
      avatarUrl: '/images/character-avatar.jpg',
      status: 'Chilling',
      discoverable: true,
    },
    {
      uid: 'uid_jordan',
      handle: '@jordan_x',
      displayName: 'Jordan',
      avatarUrl: '/images/character-avatar.jpg',
      status: 'Hidden',
      discoverable: false,
    },
  ];

  const reqPayload = buildFriendRequestWriteData(
    {
      uid: 'uid_me',
      handle: '@maya_star',
      displayName: 'Maya',
      avatarUrl: '/images/character-avatar.jpg',
    },
    users[1]
  );
  assert.deepEqual(reqPayload.participants, ['uid_alex', 'uid_me']);
  assert.equal(reqPayload.status, 'pending');

  const friendships: FriendshipRecord[] = [
    {
      id: 'uid_alex__uid_me',
      participants: ['uid_alex', 'uid_me'],
      requesterId: 'uid_me',
      recipientId: 'uid_alex',
      requesterHandle: '@maya_star',
      requesterName: 'Maya',
      requesterAvatar: '/images/character-avatar.jpg',
      recipientHandle: '@alex_v',
      recipientName: 'Alex',
      recipientAvatar: '/images/character-avatar.jpg',
      status: 'accepted',
    },
    {
      id: 'uid_me__uid_sam',
      participants: ['uid_me', 'uid_sam'],
      requesterId: 'uid_sam',
      recipientId: 'uid_me',
      requesterHandle: '@sam_k',
      requesterName: 'Sam',
      requesterAvatar: '/images/character-avatar.jpg',
      recipientHandle: '@maya_star',
      recipientName: 'Maya',
      recipientAvatar: '/images/character-avatar.jpg',
      status: 'pending',
    },
  ];

  const partitioned = partitionFriendships(friendships, 'uid_me');
  assert.equal(partitioned.accepted.length, 1);
  assert.equal(partitioned.accepted[0].displayName, 'Alex');
  assert.equal(partitioned.incomingPending.length, 1);
  assert.equal(partitioned.incomingPending[0].displayName, 'Sam');
  assert.equal(partitioned.outgoingPending.length, 0);

  const directory = filterDiscoverableUsers(users, 'uid_me', friendships, '');
  assert.equal(directory.length, 2);
  assert.equal(
    directory.find((u) => u.uid === 'uid_alex')?.relationStatus,
    'accepted'
  );
  assert.equal(
    directory.find((u) => u.uid === 'uid_sam')?.relationStatus,
    'pending_incoming'
  );

  const searched = filterDiscoverableUsers(users, 'uid_me', friendships, '@sam');
  assert.equal(searched.length, 1);
  assert.equal(searched[0].uid, 'uid_sam');
});

test('Guess Who friend selection helpers assign and fill slots without duplicates', () => {
  const initial: [string, string, string, string] = ['Riley', '', '', ''];
  const dup = assignFriendToGuessOptions(initial, 'riley');
  assert.equal(dup.slotUsed, 0);
  assert.deepEqual(dup.options, ['Riley', '', '', '']);

  const added = assignFriendToGuessOptions(initial, 'Alex');
  assert.equal(added.slotUsed, 1);
  assert.deepEqual(added.options, ['Riley', 'Alex', '', '']);

  const filled = fillGuessOptionsWithFriends(added.options, [
    { displayName: 'Alex' },
    { displayName: 'Sam' },
    { displayName: 'Taylor' },
    { displayName: 'Jordan' },
  ]);
  assert.deepEqual(filled, ['Riley', 'Alex', 'Sam', 'Taylor']);
});

test('Procedural Avatar Generator builds valid SVG data URLs accepted by sanitizeUserProfile', () => {
  const traits = generateCharacterAvatarTraits('midnight dj with headphones', 42);
  assert.equal(traits.style, 'midnight_cyber');
  assert.equal(traits.accessory, 'headphones');

  const svg = generateCharacterAvatarSvg(traits);
  assert.ok(svg.startsWith('<svg '));
  assert.ok(svg.includes('</svg>'));

  const dataUrl = generateCharacterAvatarDataUrl(traits);
  assert.ok(dataUrl.startsWith('data:image/svg+xml;base64,'));

  const sanitized = sanitizeUserProfile({ avatarUrl: dataUrl });
  assert.equal(sanitized.avatarUrl, dataUrl);
});

