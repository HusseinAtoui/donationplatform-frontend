// src/api/messaging.js
const API_ROOT = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
// Try both /messages and /msg bases to match how the backend might be mounted.
const BASES = [`${API_ROOT}/messages`];

function getToken() {
  return localStorage.getItem('token') || '';
}

function getRole() {
  return localStorage.getItem('role') || '';
}

function authHeaders(json = false) {
  const h = { Authorization: `Bearer ${getToken()}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

/** Try multiple URLs and return the first successful JSON response. */
async function fetchFirstJson(urls, init) {
  let lastStatus = 0;
  let lastBody = '';
  for (const url of urls) {
    try {
      const res = await fetch(url, init);
      if (res.ok) {
        try { return await res.json(); } catch { return null; }
      }
      lastStatus = res.status;
      try { lastBody = await res.text(); } catch { lastBody = ''; }
    } catch (e) {
      lastStatus = 0;
      lastBody = e?.message || 'network error';
    }
  }
  const list = urls.map(u => {
    try { return new URL(u).pathname; } catch { return u; }
  }).join(' | ');
  throw new Error(`All endpoints failed for: ${list} (last ${lastStatus}) ${lastBody}`);
}

/** Who am I? */
export async function getMe() {
  const role = getRole();
  const token = getToken();
  const url = role === 'ngo' ? `${API_ROOT}/ngo/me` : `${API_ROOT}/user/me`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to load current user.');
  const data = await res.json();
  // Normalize shape
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
  const body = { ...(ngoId ? { ngoId } : {}), ...(userId ? { userId } : {}) };
  const init = {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(body),
  };
  const urls = BASES.map(b => `${b}/conversations/start`);
  const json = await fetchFirstJson(urls, init);
  return json?.conversation;
}

/** List my conversations */
export async function listConversations() {
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
  const init = { method: 'POST', headers: authHeaders(true), body: JSON.stringify({}) };
  const urls = BASES.map(b => `${b}/conversations/${encodeURIComponent(conversationId)}/read`);
  await fetchFirstJson(urls, init);
  return true;
}

/** Get S3 pre-signed URL for an attachment */
export async function presignAttachment({ filename, contentType, conversationId }) {
  const init = {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ filename, contentType, conversationId }),
  };
  const urls = BASES.map(b => `${b}/attachments/presign`);
  const json = await fetchFirstJson(urls, init);
  // Expecting: { uploadUrl, requiredHeaders, file: { key, url, contentType } }
  return json;
}
