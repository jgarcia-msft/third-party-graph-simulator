const STORAGE_KEYS = {
  token: 'graphSimulator.token',
  requestHistory: 'graphSimulator.requestHistory',
  credentials: 'graphSimulator.credentials'
};

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }

  return null;
}

function buildStoredTokenResponse(response) {
  return {
    ...response,
    storedAt: Date.now(),
    expiresAt: Date.now() + (Number(response.expiresIn || 0) * 1000 || 0)
  };
}

function serializeForStorage(value) {
  return JSON.stringify(value);
}

function deserializeFromStorage(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function saveTokenToStorage(tokenResponse) {
  const storage = getStorage();
  if (!tokenResponse || !storage) {
    return;
  }

  const storedValue = serializeForStorage(buildStoredTokenResponse(tokenResponse));
  storage.setItem(STORAGE_KEYS.token, storedValue);
}

function loadTokenFromStorage() {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const storedValue = storage.getItem(STORAGE_KEYS.token);
  const parsed = deserializeFromStorage(storedValue);

  if (!parsed) {
    return null;
  }

  if (parsed.expiresAt && parsed.expiresAt <= Date.now()) {
    const storage = getStorage();
    if (storage) {
      storage.removeItem(STORAGE_KEYS.token);
    }
    return null;
  }

  return parsed;
}

function clearTokenFromStorage() {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(STORAGE_KEYS.token);
  }
}

function addRequestHistoryItem(existingHistory, request, maxItems = 10) {
  const nextItem = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    method: request.method,
    path: request.path,
    body: request.body,
    createdAt: Date.now()
  };

  const nextHistory = [nextItem, ...(existingHistory || [])].slice(0, maxItems);
  return nextHistory;
}

function saveRequestHistory(history) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEYS.requestHistory, serializeForStorage(history));
}

function loadRequestHistory(storageKey = STORAGE_KEYS.requestHistory) {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const storedValue = storage.getItem(storageKey);
  const parsed = deserializeFromStorage(storedValue);
  return Array.isArray(parsed) ? parsed : [];
}

function clearRequestHistory() {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(STORAGE_KEYS.requestHistory);
  }
}

function saveCredentialsToStorage(credentials) {
  const storage = getStorage();
  if (!credentials || !storage) {
    return;
  }

  storage.setItem(STORAGE_KEYS.credentials, serializeForStorage(credentials));
}

function loadCredentialsFromStorage() {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const storedValue = storage.getItem(STORAGE_KEYS.credentials);
  const parsed = deserializeFromStorage(storedValue);
  return parsed && typeof parsed === 'object' ? parsed : null;
}

function clearCredentialsFromStorage() {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(STORAGE_KEYS.credentials);
  }
}

var storageUtils = {
  STORAGE_KEYS,
  buildStoredTokenResponse,
  saveTokenToStorage,
  loadTokenFromStorage,
  clearTokenFromStorage,
  addRequestHistoryItem,
  saveRequestHistory,
  loadRequestHistory,
  clearRequestHistory,
  saveCredentialsToStorage,
  loadCredentialsFromStorage,
  clearCredentialsFromStorage
};

if (typeof module !== 'undefined') {
  module.exports = storageUtils;
}

if (typeof window !== 'undefined') {
  window.storageUtils = storageUtils;
}
