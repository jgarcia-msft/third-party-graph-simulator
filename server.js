const express = require('express');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const tokenCache = new Map();

function buildCacheKey({ tenantId, clientId, clientSecret }) {
  return crypto
    .createHash('sha256')
    .update(`${tenantId}|${clientId}|${clientSecret}`)
    .digest('hex');
}

async function acquireToken({ tenantId, clientId, clientSecret }) {
  const cacheKey = buildCacheKey({ tenantId, clientId, clientSecret });
  const cached = tokenCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached, cached: true };
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await axios.post(tokenUrl, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const tokenData = response.data;
  const expiresAt = Date.now() + (tokenData.expires_in - 30) * 1000;

  const entry = {
    accessToken: tokenData.access_token,
    tokenType: tokenData.token_type,
    expiresIn: tokenData.expires_in,
    expiresAt
  };

  tokenCache.set(cacheKey, entry);
  return { ...entry, cached: false };
}

app.post('/api/token', async (req, res) => {
  try {
    const { tenantId, clientId, clientSecret } = req.body;
    if (!tenantId || !clientId || !clientSecret) {
      return res.status(400).json({ error: 'tenantId, clientId, and clientSecret are required.' });
    }

    const token = await acquireToken({ tenantId, clientId, clientSecret });
    return res.json({
      accessToken: token.accessToken,
      tokenType: token.tokenType,
      expiresIn: token.expiresIn,
      cached: token.cached
    });
  } catch (error) {
    const message = error.response?.data || error.message;
    return res.status(500).json({ error: 'Token acquisition failed.', details: message });
  }
});

app.post('/api/graph', async (req, res) => {
  try {
    const { tenantId, clientId, clientSecret, method, path: graphPath, body, headers } = req.body;
    if (!tenantId || !clientId || !clientSecret || !method || !graphPath) {
      return res.status(400).json({ error: 'tenantId, clientId, clientSecret, method, and path are required.' });
    }

    const token = await acquireToken({ tenantId, clientId, clientSecret });
    const url = graphPath.startsWith('http')
      ? graphPath
      : `https://graph.microsoft.com/v1.0${graphPath.startsWith('/') ? '' : '/'}${graphPath}`;

    const response = await axios({
      url,
      method,
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json',
        ...(headers || {})
      },
      data: body || undefined,
      validateStatus: () => true
    });

    return res.status(response.status).json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
  } catch (error) {
    const message = error.response?.data || error.message;
    return res.status(500).json({ error: 'Graph request failed.', details: message });
  }
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
