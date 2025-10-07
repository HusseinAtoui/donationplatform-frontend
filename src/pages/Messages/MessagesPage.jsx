import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
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

// ---- lightweight safety (profanity + sentiment) ----
const sentiment = new Sentiment();
leoProfanity.loadDictionary();
function moderateText(raw) {
  if (!raw || typeof raw !== 'string') return { allowed: true, cleaned: raw, reason: '' };
  const cleaned = leoProfanity.clean(raw);
  const { score } = sentiment.analyze(raw);
  if (score <= -4) {
    return { allowed: false, cleaned, reason: 'Your message does not fit our community guidelines.\nPlease rephrase and try again.' };
  }
  return { allowed: true, cleaned, reason: cleaned !== raw ? 'Profanity was masked.' : '' };
}

const isUUID = (s) => typeof s === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

const API_ORIGIN = (() => { try { return new URL(API_BASE).origin; } catch { return window.location.origin; }})();
function normalizeAvatarUrl(url) {
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || /^data:/i.test(url)) return url;
  const clean = String(url).replace(/^(\.\/|\/)+/, '');
  return `${API_ORIGIN}/${clean}`;
}
function validName(name, id) { return Boolean(name && !isUUID(name) && name !== id); }

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

/** Figure out "the other side" purely by comparing IDs */
function figureOther(c, meId) {
  let otherId = null, otherKind = null;
  if (c.userId === meId) { otherId = c.ngoId;  otherKind = 'ngo'; }
  else if (c.ngoId === meId) { otherId = c.userId; otherKind = 'user'; }
  else if (c.userId && c.userId !== meId) { otherId = c.userId; otherKind = 'user'; }
  else { otherId = c.ngoId; otherKind = 'ngo'; }
  const stampedName   = otherKind === 'ngo' ? (c.ngoName || '') : (c.userName || '');
  const stampedAvatar = otherKind === 'ngo' ? (c.ngoAvatar || '') : (c.userAvatar || '');
  return { otherKind, otherId, stampedName, stampedAvatar };
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { conversationId } = useParams(); // 👈 controls list-only vs chat-only on phones

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

        // 1) load convs
        let convs = await listConversations();

        // 2) compute other side & seed display fields
        convs = convs.map((c) => {
          const { otherKind, otherId, stampedName, stampedAvatar } = figureOther(c, meRes.id);
          const cached = getCached(otherKind, otherId) || {};
          let name   = cached.name   || stampedName || c.name || '';
          let avatar = cached.avatar || stampedAvatar || c.avatar || '';
          if (!validName(name, otherId)) name = otherKind === 'ngo' ? 'Unknown NGO' : 'Unknown User';
          const mineUnread = c.userId === meRes.id ? (c.userUnread || 0) : (c.ngoUnread || 0);
          return {
            ...c,
            otherKind,
            otherId,
            displayName: name,
            displayAvatar: normalizeAvatarUrl(avatar),
            unread: mineUnread,
            lastMessage: typeof c.lastMessage === 'string' ? { text: c.lastMessage } : (c.lastMessage || null),
          };
        });

        // 3) hydrate any placeholder names + avatars
        const need = convs.filter(c => !validName(c.displayName, c.otherId));
        await Promise.all(need.map(async (c) => {
          const prof = c.otherKind === 'ngo' ? await fetchNgoPublic(c.otherId) : await fetchUserPublic(c.otherId);
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

        // Open only if route has :conversationId (Instagram phone logic)
        if (conversationId) {
          const found = convs.find(c => c.id === conversationId);
          if (found) {
            const { messages, nextCursor } = await listMessages(found.id, { limit: 50 });
            setActive({ ...found, messages });
            setPaging((p) => ({ ...p, [found.id]: { nextCursor } }));
            await markRead(found.id).catch(() => {});
          }
        } else {
          setActive(null); // list-only until user taps
        }
      } catch (e) {
        setErr(e.message || 'Failed to load messages.');
      } finally {
        setLoading(false);
      }
    })();
  }, [conversationId, navigate]);

  // deep link (?withUser= / ?withNgo=)
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
      if (!validName(name, otherId) || !avatar) {
        const prof = otherKind === 'ngo' ? await fetchNgoPublic(otherId) : await fetchUserPublic(otherId);
        if (prof) {
          if (!validName(name, otherId) && prof.name) name = prof.name;
          if (!avatar && prof.avatar) avatar = prof.avatar;
        }
      }
      if (!validName(name, otherId)) name = otherKind === 'ngo' ? 'Unknown NGO' : 'Unknown User';
      avatar = normalizeAvatarUrl(avatar);
      setCached(otherKind, otherId, { name, avatar });

      const mineUnread = conv.userId === me.id ? (conv.userUnread || 0) : (conv.ngoUnread || 0);
      const enriched = {
        ...conv,
        otherKind,
        otherId,
        displayName: name,
        displayAvatar: avatar,
        unread: mineUnread,
        contextRequestId: reqId || undefined,
        lastMessage: typeof conv.lastMessage === 'string' ? { text: conv.lastMessage } : (conv.lastMessage || null),
      };

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === enriched.id);
        if (idx === -1) return [enriched, ...prev];
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...enriched };
        const [moved] = copy.splice(idx, 1);
        return [moved, ...copy];
      });

      // Navigate to full thread (so phone shows chat page)
      navigate(`/messages/${enriched.id}`, { replace: true });

      const { messages, nextCursor } = await listMessages(enriched.id, { limit: 50 });
      setActive({ ...enriched, messages });
      setPaging((p) => ({ ...p, [enriched.id]: { nextCursor } }));
      await markRead(enriched.id).catch(() => {});
    })();
  }, [me?.id, searchParams, navigate]);

  // keep active thread fresh
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

  // filter list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => (c.displayName || '').toLowerCase().includes(q));
  }, [conversations, search]);

  // open convo (navigate to route like IG)
  const onSelectConv = useCallback(async (conv) => {
    try {
      if (!conv?.id) return;
      navigate(`/messages/${conv.id}`); // route drives phone UI
      const { messages, nextCursor } = await listMessages(conv.id, { limit: 50 });
      setActive({ ...conv, messages });
      setPaging((p) => ({ ...p, [conv.id]: { nextCursor } }));
      await markRead(conv.id).catch(() => {});
      // clear unread locally
      setConversations(list => list.map(c =>
        c.id === conv.id ? { ...c, unread: 0 } : c
      ));
    } catch (e) {
      setErr(e.message || 'Failed to open conversation.');
    }
  }, [navigate]);

  // poll list for unread counters & last message
  useEffect(() => {
    const tick = async () => {
      try {
        if (!me?.id) return;
        const latest = await listConversations();
        setConversations(prev => {
          const prevById = Object.fromEntries(prev.map(x => [x.id, x]));
          const merged = latest.map(c => {
            const existing = prevById[c.id] || {};
            const { otherKind, otherId } = figureOther(c, me.id);
            const mineUnread = c.userId === me.id ? (c.userUnread || 0) : (c.ngoUnread || 0);
            return {
              ...existing, ...c, otherKind, otherId,
              displayName: existing.displayName || c.displayName || existing.name || c.name || '',
              displayAvatar: existing.displayAvatar || c.displayAvatar || existing.avatar || c.avatar || '',
              unread: mineUnread,
              lastMessage: typeof c.lastMessage === 'string' ? { text: c.lastMessage } : (c.lastMessage || null),
            };
          });
          merged.sort((a, b) => (b.lastTimestamp || '').localeCompare(a.lastTimestamp || ''));
          return merged;
        });
      } catch {}
    };
    tick();
    const iv = setInterval(tick, 20000);
    return () => clearInterval(iv);
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

  // route-mode class for mobile panes: list-only vs chat-only
  const mobileMode = conversationId ? 'mode-chat' : 'mode-list';

  return (
    <div className={`messages-page ${mobileMode}`}>
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
            conversation={active}
            me={me}
            onSend={async ({ text, files }) => {
              if (!active?.id) return;
              if (!text && (!files || !files.length)) return;
              setSending(true);
              try {
                const { allowed, cleaned, reason } = moderateText(text);
                if (!allowed) { setPopup({ show: true, message: reason || 'Please rephrase your message.' }); setSending(false); return; }

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

                const msg = await sendMessage(active.id, { text: cleaned, attachments });
                setActive((a) => ({ ...a, messages: [ ...(a?.messages || []), msg ] }));
                setConversations((list) => {
                  const idx = list.findIndex((c) => c.id === active.id);
                  if (idx === -1) return list;
                  const copy = [...list];
                  copy[idx] = {
                    ...copy[idx],
                    lastMessage: { text: msg.text || (attachments.length ? '[attachment]' : '') },
                    lastTimestamp: msg.createdAt,
                    unread: 0,
                  };
                  const [moved] = copy.splice(idx, 1);
                  return [moved, ...copy];
                });
              } catch (e) {
                alert(e.message || 'Failed to send message.');
              } finally {
                setSending(false);
              }
            }}
            sending={sending}
            onLoadOlder={loadOlder}
            hasMore={!!paging[active.id]?.nextCursor}
            onBack={() => navigate('/messages')}  // 👈 back like Instagram
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
