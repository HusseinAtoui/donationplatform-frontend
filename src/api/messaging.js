// src/api/messaging.js
const ENV_BASE = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) || '';
// Prefer a proxy-friendly base in dev; fallback to localhost:4000/api if no env:
const API_ROOT =
  (ENV_BASE && ENV_BASE.replace(/\/$/, '')) ||
  (typeof window !== 'undefined' && window.location?.host?.includes('localhost:3000')
    ? 'http://localhost:4000/api'
    : '/api');

const BASES = [`${API_ROOT}/messages`, `${API_ROOT}/msg`]; // try both

function getToken() {
  return localStorage.getItem('token') || '';
}

function authHeaders(json = false) {
  const h = {
    Authorization: `Bearer ${getToken()}`,
    Accept: 'application/json',
  };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

/** Try multiple URLs and return the first successful JSON response. Keeps going on 404/CORS/network errors. */
async function fetchFirstJson(urls, init) {
  let lastErr = null;
  for (const url of urls) {
    try {
      // Helpful debug:
      // console.log('[messaging] →', init?.method || 'GET', url);
      const res = await fetch(url, { ...init, mode: 'cors' });
      if (res.ok) {
        // Prefer JSON; if not JSON, try anyway.
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) return await res.json();
        try {
          return await res.json();
        } catch {
          return null;
        }
      } else {
        // Non-2xx; continue to next candidate
        const msg = `HTTP ${res.status} ${res.statusText} at ${url}`;
        // console.warn('[messaging]', msg);
        lastErr = new Error(msg);
        continue;
      }
    } catch (e) {
      // Network/CORS error; try next
      // console.warn('[messaging] network error', url, e?.message);
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error('Failed to fetch');
}

export async function listConversations() {
  const urls = BASES.map((b) => `${b}/conversations`);
  return fetchFirstJson(urls, {
    headers: authHeaders(),
  });
}

export async function startConversation({ ngoId, userId }) {
  const body = JSON.stringify({ ngoId, userId });
  // Some backends use /start; others use /conversations/start
  const urls = BASES.flatMap((b) => [`${b}/start`, `${b}/conversations/start`]);
  return fetchFirstJson(urls, {
    method: 'POST',
    headers: authHeaders(true),
    body,
  });
}

// supports either { from } (ISO) or { cursor } (token)
export async function getMessages(conversationId, { from, limit = 100, cursor } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (limit) params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);

  // Try /conversations/:id/messages then /:id/messages
  const pathA = (b) => `${b}/conversations/${encodeURIComponent(conversationId)}/messages?${params}`;
  const pathB = (b) => `${b}/${encodeURIComponent(conversationId)}/messages?${params}`;
  const urls = BASES.flatMap((b) => [pathA(b), pathB(b)]);

  return fetchFirstJson(urls, {
    headers: authHeaders(),
  });
}

export async function sendMessage(conversationId, { text, attachments }) {
  const body = JSON.stringify({ text, attachments });
  const pathA = (b) => `${b}/conversations/${encodeURIComponent(conversationId)}/messages`;
  const pathB = (b) => `${b}/${encodeURIComponent(conversationId)}/messages`;
  const urls = BASES.flatMap((b) => [pathA(b), pathB(b)]);

  return fetchFirstJson(urls, {
    method: 'POST',
    headers: authHeaders(true),
    body,
  });
}

export async function markRead(conversationId) {
  const pathA = (b) => `${b}/conversations/${encodeURIComponent(conversationId)}/read`;
  const pathB = (b) => `${b}/${encodeURIComponent(conversationId)}/read`;
  const urls = BASES.flatMap((b) => [pathA(b), pathB(b)]);

  return fetchFirstJson(urls, {
    method: 'POST',
    headers: authHeaders(),
  });
}

export async function presignUpload({ conversationId, filename, contentType }) {
  const urls = BASES.map((b) => `${b}/attachments/presign`);
  const body = JSON.stringify({ conversationId, filename, contentType });
  return fetchFirstJson(urls, {
    method: 'POST',
    headers: authHeaders(true),
    body,
  });
}

export async function uploadToS3(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!res.ok) throw new Error('S3 upload failed');
}
