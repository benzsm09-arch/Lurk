# Firestore Security Specification (`security_spec.md`)

## Phase 0: Data Invariants

1. **Identity Integrity (`publicUsers` & `users`)**:
   - A `PublicUser` document at `/publicUsers/{userId}` can only be created or updated by `request.auth.uid == userId` with a verified email token (`request.auth.token.email_verified == true`).
   - `PublicUser` never stores PII (`email`, `phone`, `address`). Verified `email` is isolated in `/users/{userId}`, readable/writable strictly by the owning user.
2. **Canonical Friendship Edge (`/friendships/{friendshipId}`)**:
   - Document ID MUST equal the deterministic sorted pair `<uidMin>__<uidMax>` so duplicate or parallel requests between the same two users are structurally impossible.
   - `participants` MUST be a 2-element list containing both `requesterId` and `recipientId`, and `requesterId != recipientId`.
   - On `create`, `requesterId` MUST equal `request.auth.uid`, `status` MUST equal `'pending'`, and `recipientId` MUST exist in `/publicUsers/{recipientId}`.
3. **State Machine Integrity & Tiered Updates**:
   - Only `recipientId` may transition a `'pending'` request to `'accepted'` or `'declined'`. The requester cannot self-accept their own request.
   - Once `status` reaches `'accepted'` or `'declined'` (terminal states), no further `update` transitions are allowed (`delete` is permitted by either participant to cancel or unfriend).
4. **Temporal & Structural Integrity**:
   - All `createdAt` and `updatedAt` timestamps must match `request.time`; `createdAt`, `requesterId`, `recipientId`, and `participants` are immutable after creation.
   - Every string and list is strictly size-bounded and key-allowlisted (`hasAll` + `hasOnly` on create, `affectedKeys().hasOnly(...)` on update).

## The "Dirty Dozen" Adversarial Payloads

| # | Target Collection | Attack Vector | Expected Result |
|---|-------------------|---------------|-----------------|
| 1 | `/users/{victimUid}` | Authenticated attacker reads another user's private PII doc | `PERMISSION_DENIED` |
| 2 | `/publicUsers/{userId}` | Unverified email token attempts profile write | `PERMISSION_DENIED` |
| 3 | `/publicUsers/{userId}` | Shadow field injection (`isAdmin: true`, `email: "leak@x.com"`) | `PERMISSION_DENIED` |
| 4 | `/publicUsers/{victimUid}` | Authenticated user overwrites another user's public profile | `PERMISSION_DENIED` |
| 5 | `/friendships/{id}` | Self-friending (`requesterId == recipientId == auth.uid`) | `PERMISSION_DENIED` |
| 6 | `/friendships/{id}` | Identity spoofing (`requesterId` set to another user's UID) | `PERMISSION_DENIED` |
| 7 | `/friendships/{id}` | Pre-accepted state shortcut (`status: "accepted"` on `create`) | `PERMISSION_DENIED` |
| 8 | `/friendships/{id}` | Orphaned request (`recipientId` does not exist in `/publicUsers`) | `PERMISSION_DENIED` |
| 9 | `/friendships/{id}` | Non-canonical / oversized path ID (`id` > 128 chars or not `min__max`) | `PERMISSION_DENIED` |
| 10 | `/friendships/{id}` | Requester attempts to self-accept their own pending request | `PERMISSION_DENIED` |
| 11 | `/friendships/{id}` | Recipient updates `requesterId` or `createdAt` alongside `status` | `PERMISSION_DENIED` |
| 12 | `/friendships/{id}` | Third-party user attempts to list, read, update, or delete someone else's friendship | `PERMISSION_DENIED` |
