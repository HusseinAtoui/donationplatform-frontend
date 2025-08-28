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
import './messages.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';
const CACHE_KEY = 'chat_profile_cache_v1';

// ---- tiny cache helpers ----
function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}
function getCached(kind, id) {
  const c = loadCache();
  return c?.[kind]?.[id] || null;
}
function setCached(kind, id, data) {
  const c = loadCache();
  c[kind] = c[kind] || {};
  c[kind][id] = { ...(c[kind][id] || {}), ...data };
  saveCache(c);
}

// ---- public profile fetchers ----
async function fetchUserPublic(id) {
  try {
    const r = await fetch(`${API_BASE}/user/public/${encodeURIComponent(id)}`);
    if (!r.ok) return null;
    const j = await r.json();
    return { name: j.name || '', avatar: j.avatarUrl || '' };
  } catch { return null; }
}

// If you added /api/ngo/public/:id, implement this and call it when otherType==='ngo'
async function fetchNgoPublic(id) {
  try {
    const r = await fetch(`${API_BASE}/ngo/public/${encodeURIComponent(id)}`);
    if (!r.ok) return null;
    const j = await r.json();
    return { name: j.name || '', avatar: j.logoUrl || j.avatarUrl || '' };
  } catch { return null; }
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

        // 1) pull raw list
        let convs = await listConversations();

        // 2) normalize + try cache immediately (no flicker)
        convs = convs.map((c) => {
          const otherType = meRes.role === 'ngo' ? 'user' : 'ngo';
          const otherId   = otherType === 'user' ? c.userId : c.ngoId;

          // Prefer backend-stamped display fields if present
          let name =
            (otherType === 'user' ? c.userName : c.ngoName) ||
            c.name || c.displayName || c.userName || c.ngoName || '';
          let avatar =
            (otherType === 'user' ? c.userAvatar : c.ngoAvatar) ||
            c.avatar || c.avatarUrl || c.userAvatar || c.ngoAvatar || '';

          // overlay from cache (wins if present)
          const cached = getCached(otherType, otherId);
          if (cached) {
            name   = cached.name   || name;
            avatar = cached.avatar || avatar;
          }

          if (!name) name = otherId || c.id; // final fallback

          return {
            ...c,
            otherType,
            otherId,
            name,
            avatar,
            lastMessage:
              typeof c.lastMessage === 'string'
                ? { text: c.lastMessage }
                : (c.lastMessage || null),
          };
        });

        // 3) hydrate any missing bits from server
        const need = convs.filter((c) => !c.name || c.name === c.otherId || !c.avatar);
        await Promise.all(
          need.map(async (c) => {
            const prof = c.otherType === 'user'
              ? await fetchUserPublic(c.otherId)
              : await fetchNgoPublic(c.otherId); // if not implemented, returns null
            if (prof) {
              if (!c.name   || c.name === c.otherId) c.name   = prof.name   || c.name;
              if (!c.avatar)                           c.avatar = prof.avatar || c.avatar;
              setCached(c.otherType, c.otherId, { name: c.name, avatar: c.avatar });
            }
          })
        );

        // 4) now render
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

  // deep link from Admin: ?withUser/withNgo + optional withName/withAvatar/requestId
  useEffect(() => {
    (async () => {
      if (!me?.id || !me?.role) return;

      const withUser   = searchParams.get('withUser');
      const withNgo    = searchParams.get('withNgo');
      const withName   = searchParams.get('withName') || '';
      const withAvatar = searchParams.get('withAvatar') || '';
      const reqId      = searchParams.get('requestId') || '';

      let conv = null;
      if (withUser && me.role === 'ngo')      conv = await startConversation({ userId: withUser });
      else if (withNgo && me.role === 'user') conv = await startConversation({ ngoId: withNgo });
      else return;

      if (!conv?.id) return;

      const otherType = me.role === 'ngo' ? 'user' : 'ngo';
      const otherId   = otherType === 'user' ? conv.userId : conv.ngoId;

      // prefer explicit link params, then cache, then stamped/server
      const cached = getCached(otherType, otherId) || {};
      let name =
        withName ||
        cached.name ||
        (otherType === 'user' ? conv.userName : conv.ngoName) ||
        conv.name || conv.userName || conv.ngoName || otherId;

      let avatar =
        withAvatar ||
        cached.avatar ||
        (otherType === 'user' ? conv.userAvatar : conv.ngoAvatar) ||
        conv.avatarUrl || '';

      // fetch server if still thin
      if (!withName || !withAvatar) {
        const prof = otherType === 'user' ? await fetchUserPublic(otherId) : await fetchNgoPublic(otherId);
        if (prof) {
          if (!withName)   name   = prof.name   || name;
          if (!withAvatar) avatar = prof.avatar || avatar;
        }
      }

      setCached(otherType, otherId, { name, avatar });

      const enriched = {
        ...conv,
        otherType,
        otherId,
        name,
        avatar,
        contextRequestId: reqId || undefined,
        lastMessage:
          typeof conv.lastMessage === 'string'
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
  }, [me?.id, me?.role, searchParams]);

  // filter/search
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => (c.name || '').toLowerCase().includes(q));
  }, [conversations, search]);

  // open conversation
  const onSelectConv = useCallback(async (conv) => {
    try {
      if (!conv?.id) return;
      const { messages, nextCursor } = await listMessages(conv.id, { limit: 50 });
      setActive({ ...conv, messages });
      setPaging((p) => ({ ...p, [conv.id]: { nextCursor } }));
      await markRead(conv.id).catch(() => {});
    } catch (e) {
      setErr(e.message || 'Failed to open conversation.');
    }
  }, []);

  // pagination
  const loadOlder = useCallback(async () => {
    if (!active?.id) return;
    const cursor = paging[active.id]?.nextCursor;
    if (!cursor) return;
    try {
      const { messages, nextCursor } = await listMessages(active.id, { limit: 50, cursor });
      setActive((a) => ({ ...a, messages: [...messages, ...(a?.messages || [])] }));
      setPaging((p) => ({ ...p, [active.id]: { nextCursor } }));
    } catch (e) {
      console.error(e);
    }
  }, [active?.id, paging]);

  // send
  const onSend = useCallback(
    async ({ text, files }) => {
      if (!active?.id) return;
      if (!text && (!files || !files.length)) return;
      setSending(true);
      try {
        let attachments = [];
        if (files?.length) {
          const uploaded = [];
          for (const f of files) {
            const { uploadUrl, requiredHeaders, file } = await presignAttachment({
              filename: f.name,
              contentType: f.type || 'application/octet-stream',
              conversationId: active.id,
            });

            // Include any required headers from server (e.g., x-amz-acl: public-read)
            const headers = Object.assign(
              { 'Content-Type': f.type || 'application/octet-stream' },
              requiredHeaders || {}
            );

            await fetch(uploadUrl, { method: 'PUT', headers, body: f });
            uploaded.push(file);
          }
          attachments = uploaded;
        }

        const msg = await sendMessage(active.id, { text, attachments });
        setActive((a) => ({ ...a, messages: [ ...(a?.messages || []), msg ] }));

        setConversations((list) => {
          const idx = list.findIndex((c) => c.id === active.id);
          if (idx === -1) return list;
          const copy = [...list];
          copy[idx] = {
            ...copy[idx],
            lastMessage: { text: msg.text || (attachments.length ? '[attachment]' : '') },
            lastTimestamp: msg.createdAt,
          };
          const [moved] = copy.splice(idx, 1);
          return [moved, ...copy];
        });
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
        <div className="go-back" onClick={() => navigate('/')}>
          &larr; Home
        </div>

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
            conversation={active}     // header should read conversation.name + conversation.avatar
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
    </div>
  );
}
