const test = require('node:test');
const assert = require('node:assert/strict');
const { buildStoredTokenResponse, addRequestHistoryItem, loadRequestHistory } = require('../public/storage-utils.js');

test('buildStoredTokenResponse stores an expiry timestamp and preserves the response payload', () => {
  const response = {
    accessToken: 'abc',
    tokenType: 'Bearer',
    expiresIn: 3600,
    cached: false
  };

  const stored = buildStoredTokenResponse(response);

  assert.equal(stored.accessToken, 'abc');
  assert.equal(stored.expiresAt > Date.now(), true);
  assert.equal(stored.cached, false);
});

test('addRequestHistoryItem prepends a new request and keeps a limited history', () => {
  const history = addRequestHistoryItem([], {
    method: 'GET',
    path: '/users',
    body: { displayName: 'Example' }
  }, 2);

  assert.equal(history.length, 1);
  assert.equal(history[0].path, '/users');
  assert.deepEqual(history[0].body, { displayName: 'Example' });
});

test('loadRequestHistory returns empty array when no history exists', () => {
  assert.deepEqual(loadRequestHistory('missing-key'), []);
});
