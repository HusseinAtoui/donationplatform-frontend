// src/api/messaging.js
const API_ROOT = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
const BASES = [`${API_ROOT}/messages`];

const AUTH_ERR = 'AUTH_FAIL';

function getToken() {
  return localStorage.getItem('token') || '';
}
function getRole() {
  return (localStorage.getItem('role') || '').toLowerCase();
}
function authHeaders(json = false) {
  const token = getToken();
  const h = { Authorization: `Bearer ${token}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}
function ensureToken() {
  const t = getToken();
  if (!t) {
    const err = new Error(AUTH_ERR);
    err.code = AUTH_ERR;
    throw err;
  }
}

/** Fetch with auth that throws AUTH_FAIL on 401/403 and NO_AUTH when token missing */
async function authedFetch(url, init = {}) {
  ensureToken();
  const res = await fetch(url, init);
  if (res.status === 401 || res.status === 403) {
    const err = new Error(AUTH_ERR);
    err.code = AUTH_ERR;
    err.status = res.status;
    // Optional: read body for logging
    try { err.body = await res.text(); } catch {}
    throw err;
  }
  return res;
}

/** Try multiple URLs with authed fetch; return first successful JSON. */
async function fetchFirstJson(urls, init) {
  let lastErr;
  for (const url of urls) {
    try {
      const res = await authedFetch(url, init);
      if (res.ok) {
        try { return await res.json(); } catch { return null; }
      } else {
        lastErr = new Error(`HTTP ${res.status}`);
        lastErr.status = res.status;
        try { lastErr.body = await res.text(); } catch {}
      }
    } catch (e) {
      // Bubble up auth failures immediately to stop loops
      if (e && (e.code === AUTH_ERR || e.message === AUTH_ERR)) throw e;
      lastErr = e;
    }
  }
  if (lastErr) throw lastErr;
  throw new Error('All endpoints failed');
}

/** Who am I? */
export async function getMe() {
  const role = getRole();
  ensureToken();
  const url = role === 'ngo' ? `${API_ROOT}/ngo/me` : `${API_ROOT}/user/me`;
  const res = await authedFetch(url, { headers: authHeaders() });
  const data = await res.json();

  return {
    id: data.id || data._id || data.user?.id || data.profile?.id || data.ngo?.id,
    role: role || data.role || (data.ngo ? 'ngo' : 'user'),
    name: data.name || data.profile?.name || data.user?.name || data.ngo?.name || '',
    email: data.email || data.profile?.email || data.user?.email || data.ngo?.email || '',
    raw: data
  };
}

/** Start or fetch a conversation */
export async function startConversation({ ngoId, userId }) {
  ensureToken();
  const body = { ...(ngoId ? { ngoId } : {}), ...(userId ? { userId } : {}) };
  const init = { method: 'POST', headers: authHeaders(true), body: JSON.stringify(body) };
  const urls = BASES.map(b => `${b}/conversations/start`);
  const json = await fetchFirstJson(urls, init);
  return json?.conversation;
}

/** List my conversations */
export async function listConversations() {
  ensureToken();
  const init = { headers: authHeaders() };
  const urls = BASES.map(b => `${b}/conversations`);
  const json = await fetchFirstJson(urls, init);
  return json?.conversations || [];
}

/** Get messages in a conversation (optionally with cursor/limit/from) */
export async function listMessages(
  conversationId,
  { limit = 50, cursor = null, from = null } = {}
) {
  ensureToken();
  const qs = new URLSearchParams();
  if (limit) qs.set('limit', String(limit));
  if (cursor) qs.set('cursor', cursor);
  if (from) qs.set('from', from);

  const init = { headers: authHeaders() };
  const urls = BASES.map(
    b => `${b}/conversations/${encodeURIComponent(conversationId)}/messages?${qs.toString()}`
  );
  const json = await fetchFirstJson(urls, init);
  return { messages: json?.messages || [], nextCursor: json?.nextCursor || null };
}

/** Send a message */
export async function sendMessage(conversationId, { text = '', attachments = [] }) {
  ensureToken();
  const init = {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ text, attachments }),
  };
  const urls = BASES.map(b => `${b}/conversations/${encodeURIComponent(conversationId)}/messages`);
  const json = await fetchFirstJson(urls, init);
  return json?.message;
}

/** Mark a conversation as read for current actor */
export async function markRead(conversationId) {
  ensureToken();
  const init = { method: 'POST', headers: authHeaders(true), body: JSON.stringify({}) };
  const urls = BASES.map(b => `${b}/conversations/${encodeURIComponent(conversationId)}/read`);
  await fetchFirstJson(urls, init);
  return true;
}

/** Get S3 pre-signed URL for an attachment */
export async function presignAttachment({ filename, contentType, conversationId }) {
  ensureToken();
  const init = {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ filename, contentType, conversationId }),
  };
  const urls = BASES.map(b => `${b}/attachments/presign`);
  const json = await fetchFirstJson(urls, init);
  return json; // { uploadUrl, requiredHeaders, file:{ key, url, contentType } }
}
