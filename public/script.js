const tenantInput = document.getElementById('tenantId');
const clientInput = document.getElementById('clientId');
const secretInput = document.getElementById('clientSecret');
const tokenResult = document.getElementById('tokenResult');
const responseResult = document.getElementById('responseResult');
const getTokenButton = document.getElementById('getTokenButton');
const sendRequestButton = document.getElementById('sendRequestButton');
const clearButton = document.getElementById('clearButton');
const toggleTokenButton = document.getElementById('toggleTokenButton');
const clearHistoryButton = document.getElementById('clearHistoryButton');
const requestHistoryList = document.getElementById('requestHistoryList');
const methodInput = document.getElementById('method');
const pathInput = document.getElementById('graphPath');
const bodyInput = document.getElementById('requestBody');

let tokenResponseData = null;
let showFullTokenResponse = false;
let requestHistory = [];
let serverHealthCheckTimer = null;
let storageClearedDueToServerShutdown = false;

const storageHelper = window.storageUtils;

function formatJson(value) {
  try {
    return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value, null, 2);
  } catch {
    return value;
  }
}

async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!text) {
    return { text: '', parsed: null };
  }

  if (contentType.includes('application/json')) {
    try {
      return { text, parsed: JSON.parse(text) };
    } catch {
      return { text, parsed: null };
    }
  }

  return { text, parsed: text };
}

function getCredentials() {
  return {
    tenantId: tenantInput.value.trim(),
    clientId: clientInput.value.trim(),
    clientSecret: secretInput.value.trim()
  };
}

function hydrateCredentials() {
  const savedCredentials = storageHelper.loadCredentialsFromStorage();
  if (!savedCredentials) {
    return;
  }

  if (savedCredentials.tenantId) {
    tenantInput.value = savedCredentials.tenantId;
  }
  if (savedCredentials.clientId) {
    clientInput.value = savedCredentials.clientId;
  }
  if (savedCredentials.clientSecret) {
    secretInput.value = savedCredentials.clientSecret;
  }
}

function persistCredentials() {
  const creds = getCredentials();
  storageHelper.saveCredentialsToStorage(creds);
}

function loadStoredState() {
  hydrateCredentials();

  const savedToken = storageHelper.loadTokenFromStorage();
  if (savedToken) {
    tokenResponseData = savedToken;
    showFullTokenResponse = false;
    toggleTokenButton.disabled = false;
    toggleTokenButton.textContent = 'Show full response';
    renderTokenResponse();
  }

  requestHistory = storageHelper.loadRequestHistory();
  renderRequestHistory();
}

function renderRequestHistory() {
  if (!requestHistory.length) {
    requestHistoryList.innerHTML = '<li class="history-empty">No saved requests yet.</li>';
    return;
  }

  requestHistoryList.innerHTML = requestHistory
    .map((item) => `
      <li class="history-item" data-id="${item.id}">
        <button class="history-button" type="button">
          <span class="history-method">${item.method}</span>
          <span class="history-path">${item.path}</span>
        </button>
      </li>
    `)
    .join('');
}

function persistRequestHistory() {
  storageHelper.saveRequestHistory(requestHistory);
  renderRequestHistory();
}

function restoreRequestFromHistory(item) {
  methodInput.value = item.method || 'GET';
  pathInput.value = item.path || '';
  bodyInput.value = item.body ? formatJson(item.body) : '';
  responseResult.textContent = 'Loaded a saved request. Click Send Graph Request to reuse it.';
}

function shouldMaskTokenField(key) {
  return /token|secret|password|authorization/i.test(key);
}

function maskTokenResponse(value) {
  if (Array.isArray(value)) {
    return value.map(maskTokenResponse);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        shouldMaskTokenField(key) ? '***' : maskTokenResponse(nestedValue)
      ])
    );
  }

  return value;
}

function renderTokenResponse() {
  if (!tokenResponseData) {
    tokenResult.textContent = 'Token response will appear here.';
    return;
  }

  const displayValue = showFullTokenResponse ? tokenResponseData : maskTokenResponse(tokenResponseData);
  tokenResult.textContent = formatJson(displayValue);
}

function resetTokenResponseState() {
  tokenResponseData = null;
  showFullTokenResponse = false;
  toggleTokenButton.disabled = true;
  toggleTokenButton.textContent = 'Show full response';
  renderTokenResponse();
}

function clearStoredDataBecauseServerStopped() {
  if (storageClearedDueToServerShutdown) {
    return;
  }

  storageClearedDueToServerShutdown = true;
  storageHelper.clearAllStoredData();
  resetTokenResponseState();
  requestHistory = [];
  renderRequestHistory();
  tokenResult.textContent = 'The server stopped. Stored app data was cleared.';
  responseResult.textContent = 'The server stopped. Stored app data was cleared.';
}

async function checkServerHealth() {
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }

    storageClearedDueToServerShutdown = false;
  } catch {
    clearStoredDataBecauseServerStopped();
  }
}

function startServerHealthMonitor() {
  if (serverHealthCheckTimer) {
    return;
  }

  checkServerHealth();
  serverHealthCheckTimer = window.setInterval(checkServerHealth, 3000);
}

function toggleTokenResponseView() {
  if (!tokenResponseData) {
    return;
  }

  showFullTokenResponse = !showFullTokenResponse;
  toggleTokenButton.textContent = showFullTokenResponse ? 'Hide full response' : 'Show full response';
  renderTokenResponse();
}

async function requestToken() {
  const creds = getCredentials();
  if (!creds.tenantId || !creds.clientId || !creds.clientSecret) {
    tokenResponseData = null;
    showFullTokenResponse = false;
    toggleTokenButton.disabled = true;
    toggleTokenButton.textContent = 'Show full response';
    tokenResult.textContent = 'Tenant ID, Client ID, and Client Secret are required.';
    return;
  }

  tokenResult.textContent = 'Requesting token...';
  try {
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    });
    const data = await response.json();
    tokenResponseData = data;
    showFullTokenResponse = false;
    toggleTokenButton.disabled = false;
    toggleTokenButton.textContent = 'Show full response';
    storageHelper.saveTokenToStorage(data);
    renderTokenResponse();
  } catch (error) {
    tokenResponseData = null;
    showFullTokenResponse = false;
    toggleTokenButton.disabled = true;
    toggleTokenButton.textContent = 'Show full response';
    tokenResult.textContent = `Token error: ${error.message}`;
  }
}

async function sendGraphRequest() {
  const creds = getCredentials();
  const graphPath = pathInput.value.trim();
  const method = methodInput.value;
  let body = bodyInput.value.trim();

  if (!creds.tenantId || !creds.clientId || !creds.clientSecret) {
    responseResult.textContent = 'Tenant ID, Client ID, and Client Secret are required.';
    return;
  }
  if (!graphPath) {
    responseResult.textContent = 'Graph path is required.';
    return;
  }

  let parsedBody;
  if (body) {
    try {
      parsedBody = JSON.parse(body);
    } catch {
      responseResult.textContent = 'Request body must be valid JSON.';
      return;
    }
  }

  responseResult.textContent = 'Sending request...';

  try {
    const response = await fetch('/api/graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...creds,
        method,
        path: graphPath,
        body: parsedBody
      })
    });

    const body = await readResponseBody(response);
    const payload = body.parsed ?? body.text;
    const summary = {
      status: response.status,
      statusText: response.statusText,
      body: payload
    };

    responseResult.textContent = formatJson(summary);
    requestHistory = storageHelper.addRequestHistoryItem(requestHistory, { method, path: graphPath, body: parsedBody });
    persistRequestHistory();
  } catch (error) {
    responseResult.textContent = `Graph request error: ${error.message}`;
  }
}

tenantInput.addEventListener('input', persistCredentials);
clientInput.addEventListener('input', persistCredentials);
secretInput.addEventListener('input', persistCredentials);

getTokenButton.addEventListener('click', requestToken);
sendRequestButton.addEventListener('click', sendGraphRequest);
toggleTokenButton.addEventListener('click', toggleTokenResponseView);
clearButton.addEventListener('click', () => {
  resetTokenResponseState();
  storageHelper.clearTokenFromStorage();
  storageHelper.clearCredentialsFromStorage();
  tenantInput.value = '';
  clientInput.value = '';
  secretInput.value = '';
  responseResult.textContent = 'Graph response will appear here.';
});

clearHistoryButton.addEventListener('click', () => {
  requestHistory = [];
  storageHelper.clearRequestHistory();
  renderRequestHistory();
});

requestHistoryList.addEventListener('click', (event) => {
  const historyButton = event.target.closest('.history-button');
  if (!historyButton) {
    return;
  }

  const item = requestHistory.find((entry) => entry.id === historyButton.parentElement.dataset.id);
  if (item) {
    restoreRequestFromHistory(item);
  }
});

loadStoredState();
startServerHealthMonitor();

window.addEventListener('beforeunload', () => {
  storageHelper.clearAllStoredData();
});
