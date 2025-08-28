/// pages/Messages/MessagesPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import {
  getMe,
  listConversations,
  listMessages,
  sendMessage,
  startConversation,
  markRead,
  presignAttachment,
} from '../../api/messaging';
import leoProfanity from 'leo-profanity';
import Sentiment from 'sentiment';

import './messages.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
const CACHE_KEY = 'chat_profile_cache_v1';

// ---------- tiny cache helpers ----------
function loadCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; } }
function saveCache(cache) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {} }
function getCached(kind, id) { const c = loadCache(); return c?.[kind]?.[id] || null; }
function setCached(kind, id, data) { const c = loadCache(); c[kind] = c[kind] || {}; c[kind][id] = { ...(c[kind][id] || {}), ...data }; saveCache(c); }

// ---------- helpers ----------


// ---- lightweight safety (profanity + sentiment) ----
const sentiment = new Sentiment();
// load default (EN) bad-words dictionary
leoProfanity.loadDictionary();

function moderateText(raw) {
  if (!raw || typeof raw !== 'string') {
    return { allowed: true, cleaned: raw, reason: '' };
  }

  // Mask profanity (e.g., sh**)
  const cleaned = leoProfanity.clean(raw);

  // Very negative tone? (tune threshold as you like)
  const { score } = sentiment.analyze(raw);
  // e.g., -4 and below we block and ask to rephrase
  if (score <= -4) {
    return {
      allowed: false,
      cleaned,
      reason: 'Your message does not fit our community guidelines. \n Please rephrase and try again.',
    };
  }

  // Allowed. If profanity was masked, we still send the masked text.
  return {
    allowed: true,
    cleaned,
    reason: cleaned !== raw ? 'Profanity was masked.' : '',
  };
}

const isUUID = (s) => typeof s === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

const API_ORIGIN = (() => {
  try { return new URL(API_BASE).origin; } catch { return window.location.origin; }
})();
function normalizeAvatarUrl(url) {
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || /^data:/i.test(url)) return url; // already absolute
  const clean = String(url).replace(/^(\.\/|\/)+/, '');
  return `${API_ORIGIN}/${clean}`;
}
function validName(name, id) {
  return Boolean(name && !isUUID(name) && name !== id);
}

async function fetchUserPublic(id) {
  try {
    const tries = [
      `${API_BASE}/user/public/${encodeURIComponent(id)}`,
      `${API_BASE}/user/public?id=${encodeURIComponent(id)}`,
    ];
    for (const url of tries) {
      const r = await fetch(url);
      if (!r.ok) continue;
      const j = await r.json();
      return { name: j.name || '', avatar: j.avatarUrl || '' };
    }
  } catch {}
  return null;
}
async function fetchNgoPublic(id) {
  try {
    const tries = [
      `${API_BASE}/ngo/public/${encodeURIComponent(id)}`,
      `${API_BASE}/ngo/public?id=${encodeURIComponent(id)}`,
    ];
    for (const url of tries) {
      const r = await fetch(url);
      if (!r.ok) continue;
      const j = await r.json();
      return { name: j.name || '', avatar: j.logoUrl || j.avatarUrl || '' };
    }
  } catch {}
  return null;
}

/** Figure out "the other side" purely by comparing IDs — no role branching */
function figureOther(c, meId) {
  let otherId = null;
  let otherKind = null;

  if (c.userId === meId) { otherId = c.ngoId;  otherKind = 'ngo';  }
  else if (c.ngoId === meId) { otherId = c.userId; otherKind = 'user'; }
  else if (c.userId && c.userId !== meId) { otherId = c.userId; otherKind = 'user'; }
  else { otherId = c.ngoId; otherKind = 'ngo'; }

  const stampedName   = otherKind === 'ngo'  ? (c.ngoName || '')   : (c.userName || '');
  const stampedAvatar = otherKind === 'ngo'  ? (c.ngoAvatar || '') : (c.userAvatar || '');

  return { otherKind, otherId, stampedName, stampedAvatar };
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
const [popup, setPopup] = useState({ show: false, message: '' });

  const [me, setMe] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [paging, setPaging] = useState({});
  const [sending, setSending] = useState(false);

  // auth guard
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  // bootstrap
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const meRes = await getMe();
        setMe(meRes);

        // 1) load
        let convs = await listConversations();
// 2) compute other side & seed display fields (from stamped + cache)
convs = convs.map((c) => {
  const { otherKind, otherId, stampedName, stampedAvatar } = figureOther(c, meRes.id);
  const cached = getCached(otherKind, otherId) || {};

  let name   = cached.name   || stampedName || c.name || '';
  let avatar = cached.avatar || stampedAvatar || c.avatar || '';

  // Never show the raw ID as the name in the list
  if (!validName(name, otherId)) {
    name = otherKind === 'ngo' ? 'Unknown NGO' : 'Unknown User';
  }

  // 👇 derive *my* unread for each conversation
  const mineUnread = c.userId === meRes.id ? (c.userUnread || 0) : (c.ngoUnread || 0);

  return {
    ...c,
    otherKind,
    otherId,
    displayName: name,
    displayAvatar: normalizeAvatarUrl(avatar),
    unread: mineUnread, // 👈 add this
    lastMessage: typeof c.lastMessage === 'string'
      ? { text: c.lastMessage }
      : (c.lastMessage || null),
  };
});


        // 3) hydrate any placeholder/UUID/equal-to-id names and fix avatars
        const need = convs.filter(c => !validName(c.displayName, c.otherId));
        await Promise.all(need.map(async (c) => {
          const prof = c.otherKind === 'ngo'
            ? await fetchNgoPublic(c.otherId)
            : await fetchUserPublic(c.otherId);
          if (prof) {
            const newName = prof.name || c.displayName;
            const newAvatar = normalizeAvatarUrl(prof.avatar || '');
            if (validName(newName, c.otherId)) c.displayName = newName;
            if (newAvatar && !c.displayAvatar) c.displayAvatar = newAvatar;
            setCached(c.otherKind, c.otherId, { name: c.displayName, avatar: c.displayAvatar });
          }
        }));

        // 4) sort & set
        convs.sort((a, b) => (b.lastTimestamp || '').localeCompare(a.lastTimestamp || ''));
        setConversations(convs);

        if (convs.length) {
          const first = convs[0];
          const { messages, nextCursor } = await listMessages(first.id, { limit: 50 });
          setActive({ ...first, messages });
          setPaging((p) => ({ ...p, [first.id]: { nextCursor } }));
          await markRead(first.id).catch(() => {});
        }
      } catch (e) {
        setErr(e.message || 'Failed to load messages.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // deep link (?withUser= / ?withNgo=) — role-agnostic: start convo then figureOther()
  useEffect(() => {
    (async () => {
      if (!me?.id) return;

      const withUser   = searchParams.get('withUser');
      const withNgo    = searchParams.get('withNgo');
      const withName   = searchParams.get('withName') || '';
      const withAvatar = searchParams.get('withAvatar') || '';
      const reqId      = searchParams.get('requestId') || '';

      let conv = null;
      if (withUser) conv = await startConversation({ userId: withUser }).catch(() => null);
      if (!conv && withNgo) conv = await startConversation({ ngoId: withNgo }).catch(() => null);
      if (!conv?.id) return;

      const { otherKind, otherId, stampedName, stampedAvatar } = figureOther(conv, me.id);

      const cached = getCached(otherKind, otherId) || {};
      let name   = withName   || cached.name   || stampedName || '';
      let avatar = withAvatar || cached.avatar || stampedAvatar || '';

      // If still invalid, hydrate from /public
      if (!validName(name, otherId) || !avatar) {
        const prof = otherKind === 'ngo' ? await fetchNgoPublic(otherId) : await fetchUserPublic(otherId);
        if (prof) {
          if (!validName(name, otherId) && prof.name) name = prof.name;
          if (!avatar && prof.avatar) avatar = prof.avatar;
        }
      }

      // Final fallbacks + normalization
      if (!validName(name, otherId)) name = otherKind === 'ngo' ? 'Unknown NGO' : 'Unknown User';
      avatar = normalizeAvatarUrl(avatar);

      setCached(otherKind, otherId, { name, avatar });
// compute my unread for this conversation
const mineUnread = conv.userId === me.id ? (conv.userUnread || 0) : (conv.ngoUnread || 0);

     const enriched = {
  ...conv,
  otherKind,
  otherId,
  displayName: name,
  displayAvatar: avatar,
  unread: mineUnread, // 👈 add this
  contextRequestId: reqId || undefined,
  lastMessage: typeof conv.lastMessage === 'string'
    ? { text: conv.lastMessage }
    : (conv.lastMessage || null),
};


      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === enriched.id);
        if (idx === -1) return [enriched, ...prev];
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...enriched };
        const [moved] = copy.splice(idx, 1);
        return [moved, ...copy];
      });

      const { messages, nextCursor } = await listMessages(enriched.id, { limit: 50 });
      setActive({ ...enriched, messages });
      setPaging((p) => ({ ...p, [enriched.id]: { nextCursor } }));
      await markRead(enriched.id).catch(() => {});
    })();
  }, [me?.id, searchParams]);

  // small poll to keep messages fresh
  useEffect(() => {
    if (!active?.id) return;
    const iv = setInterval(async () => {
      try {
        const { messages, nextCursor } = await listMessages(active.id, { limit: 50 });
        setActive(a => (a && a.id === active.id) ? { ...a, messages } : a);
        setPaging(p => ({ ...p, [active.id]: { nextCursor } }));
      } catch {}
    }, 4000);
    return () => clearInterval(iv);
  }, [active?.id]);

  // mark read on focus
  useEffect(() => {
    const onFocus = () => { if (active?.id) markRead(active.id).catch(() => {}); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [active?.id]);

  // search/filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => (c.displayName || '').toLowerCase().includes(q));
  }, [conversations, search]);

  // open convo
const onSelectConv = useCallback(async (conv) => {
  try {
    if (!conv?.id) return;
    const { messages, nextCursor } = await listMessages(conv.id, { limit: 50 });
    setActive({ ...conv, messages });
    setPaging((p) => ({ ...p, [conv.id]: { nextCursor } }));
    await markRead(conv.id).catch(() => {});

    // 👇 immediately clear unread locally
    setConversations(list => list.map(c =>
      c.id === conv.id ? { ...c, unread: 0 } : c
    ));
  } catch (e) {
    setErr(e.message || 'Failed to open conversation.');
  }
}, []);

// poll the conversation list to refresh unread counters & last message
useEffect(() => {
  let alive = true;

  const tick = async () => {
    try {
      // need me.id to compute 'mineUnread'
      if (!me?.id) return;
      const latest = await listConversations();

      // merge by id, keep ordering by lastTimestamp desc
      setConversations(prev => {
        const prevById = Object.fromEntries(prev.map(x => [x.id, x]));
        const merged = latest.map(c => {
          const existing = prevById[c.id] || {};
          const { otherKind, otherId } = figureOther(c, me.id);
          const mineUnread = c.userId === me.id ? (c.userUnread || 0) : (c.ngoUnread || 0);
          return {
            ...existing,
            ...c,
            otherKind,
            otherId,
            // keep any already normalized/stamped display fields if present
            displayName: existing.displayName || c.displayName || existing.name || c.name || '',
            displayAvatar: existing.displayAvatar || c.displayAvatar || existing.avatar || c.avatar || '',
            unread: mineUnread,
            lastMessage: typeof c.lastMessage === 'string'
              ? { text: c.lastMessage }
              : (c.lastMessage || null),
          };
        });

        // sort newest first
        merged.sort((a, b) => (b.lastTimestamp || '').localeCompare(a.lastTimestamp || ''));
        return merged;
      });
    } catch (_) {}
  };

  // first run, then poll
  tick();
  const iv = setInterval(tick, 20000); // every 20s
  return () => { alive = false; clearInterval(iv); };
}, [me?.id]);

  // pagination
  const loadOlder = useCallback(async () => {
    if (!active?.id) return;
    const cursor = paging[active.id]?.nextCursor;
    if (!cursor) return;
    try {
      const { messages, nextCursor } = await listMessages(active.id, { limit: 50, cursor });
      setActive((a) => ({ ...a, messages: [...messages, ...(a?.messages || [])] }));
      setPaging((p) => ({ ...p, [active.id]: { nextCursor } }));
    } catch (e) { console.error(e); }
  }, [active?.id, paging]);

// send
const onSend = useCallback(
  async ({ text, files }) => {
    if (!active?.id) return;
    if (!text && (!files || !files.length)) return;

    setSending(true);
    try {
      // 🔒 Safety first
      const { allowed, cleaned, reason } = moderateText(text);
if (!allowed) {
  setPopup({ show: true, message: reason || 'Please rephrase your message.' });
  setSending(false);
  return;
}

      const finalText = cleaned;

      let attachments = [];
      if (files?.length) {
        const uploaded = [];
        for (const f of files) {
          const { uploadUrl, requiredHeaders, file } = await presignAttachment({
            filename: f.name,
            contentType: f.type || 'application/octet-stream',
            conversationId: active.id,
          });
          const headers = Object.assign({ 'Content-Type': f.type || 'application/octet-stream' }, requiredHeaders || {});
          await fetch(uploadUrl, { method: 'PUT', headers, body: f });
          uploaded.push(file);
        }
        attachments = uploaded;
      }

      const msg = await sendMessage(active.id, { text: finalText, attachments });
      setActive((a) => ({ ...a, messages: [ ...(a?.messages || []), msg ] }));

      setConversations((list) => {
        const idx = list.findIndex((c) => c.id === active.id);
        if (idx === -1) return list;
        const copy = [...list];
        copy[idx] = {
          ...copy[idx],
          lastMessage: { text: msg.text || (attachments.length ? '[attachment]' : '') },
          lastTimestamp: msg.createdAt,
          // clear my unread for the active one if you want
          unread: 0,
        };
        const [moved] = copy.splice(idx, 1);
        return [moved, ...copy];
      });

      // optional: if (reason) toast it instead of alert:
      // if (reason) console.info(reason);
    } catch (e) {
      alert(e.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  },
  [active?.id]
);

  return (
    <div className="messages-page">
      <aside className="sidebar">
        <div className="go-back" onClick={() => navigate('/')}>&larr; Home</div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading">Loading…</div>
        ) : err ? (
          <div className="error-msg">{err}</div>
        ) : (
          <ConversationList
            conversations={filtered}
            activeId={active?.id}
            onSelect={onSelectConv}
          />
        )}
      </aside>

      <main className="main">
        {active ? (
          <ChatWindow
            conversation={active}     // uses displayName/displayAvatar + otherKind/otherId
            me={me}
            onSend={onSend}
            sending={sending}
            onLoadOlder={loadOlder}
            hasMore={!!paging[active.id]?.nextCursor}
          />
        ) : (
          <div className="empty-hint">Select a conversation to start chatting</div>
        )}
      </main>
      {popup.show && (
  <div className="popup-overlay">
    <div className="popup-box">
      <p>{popup.message}</p>
      <button onClick={() => setPopup({ show: false, message: '' })}>OK</button>
    </div>
  </div>
)}

    </div>
  );
}
