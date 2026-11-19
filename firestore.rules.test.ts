import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.join(process.cwd(), 'firestore.rules');
const blueprintPath = path.join(process.cwd(), 'firebase-blueprint.json');
const rules = fs.readFileSync(rulesPath, 'utf-8');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8')) as {
  entities: Record<string, unknown>;
  firestore: Record<string, unknown>;
};

test('firestore.rules includes default-deny catch-all and enforces Eight Pillars guards', () => {
  assert.match(rules, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);
  assert.match(rules, /function isValidId\(id\)/);
  assert.match(rules, /function isEmailVerified\(\)/);
  assert.match(rules, /request\.auth\.token\.email_verified == true/);
  assert.match(rules, /function canonicalFriendshipId\(uidA, uidB\)/);
  assert.match(rules, /incoming\(\)\.status == 'pending'/);
  assert.match(rules, /existing\(\)\.recipientId == request\.auth\.uid/);
  assert.match(rules, /exists\(\/databases\/\$\(database\)\/documents\/publicUsers\/\$\(incoming\(\)\.recipientId\)\)/);
  assert.match(rules, /allow list: if isEmailVerified\(\)\s*&& request\.auth\.uid in resource\.data\.participants/);
  assert.match(rules, /match \/users\/\{userId\}[\s\S]*allow list: if false;/);
});

test('firebase-blueprint.json matches every Firestore collection secured in firestore.rules', () => {
  assert.ok(blueprint.entities.PublicUser);
  assert.ok(blueprint.entities.PrivateUser);
  assert.ok(blueprint.entities.Friendship);
  assert.ok(blueprint.firestore['/publicUsers/{userId}']);
  assert.ok(blueprint.firestore['/users/{userId}']);
  assert.ok(blueprint.firestore['/friendships/{friendshipId}']);
  assert.match(rules, /match \/publicUsers\/\{userId\}/);
  assert.match(rules, /match \/users\/\{userId\}/);
  assert.match(rules, /match \/friendships\/\{friendshipId\}/);
});
