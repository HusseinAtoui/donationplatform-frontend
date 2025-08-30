// components/chat/ChatWindow.jsx
import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://api.tyebetyebak.org/api';
const isUUID = (s) =>
  typeof s === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

async function fetchFirstJson(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const j = await res.json();
      if (j && (j.name || j.logoUrl || j.avatarUrl)) return j;
    } catch {}
  }
  return null;
}
async function fetchPublicProfile(kind, id) {
  const enc = encodeURIComponent(id);
  const urls = [
    `${API_BASE}/${kind}/public/${enc}`,
    `${API_BASE}/${kind}/public?id=${enc}`,
  ];
  return fetchFirstJson(urls);
}

export default function ChatWindow({
  conversation,
  me,
  onSend,
  sending = false,
  onLoadOlder,
  hasMore = false,
}) {
  const [messages, setMessages] = useState(conversation.messages || []);
  const [text, setText] = useState('');
  const bodyRef = useRef(null);
  const bottomRef = useRef(null); // 👈 anchor to scroll to

  // seed from parent (role-agnostic fields)
  const [displayName, setDisplayName] = useState(conversation.displayName || '');
  const [displayAvatar, setDisplayAvatar] = useState(conversation.displayAvatar || '');
  const [hydratedFor, setHydratedFor] = useState(null);

  useEffect(() => { setMessages(conversation.messages || []); }, [conversation.id, conversation.messages]);

  useEffect(() => {
    setDisplayName(conversation.displayName || '');
    setDisplayAvatar(conversation.displayAvatar || '');
    setHydratedFor(null);
  }, [conversation.id, conversation.displayName, conversation.displayAvatar]);

  // Always keep latest message visible (no window scrolling)
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    } else if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await onSend?.({ text: trimmed, files: [] });
    setText('');
    // ensure we stay on the newest bubble after send
    requestAnimationFrame(() => {
      if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    });
  };
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending) handleSend();
    }
  };

  // Self-hydrate if missing/UUID/equal-to-id
  useEffect(() => {
    let cancelled = false;
    const otherId = conversation.otherId;
    const otherKind = conversation.otherKind; // 'ngo' or 'user'
    const missing = !displayName || isUUID(displayName) || displayName === otherId;

    if (!missing || !otherId || !otherKind) return;
    if (hydratedFor === otherId) return;

    (async () => {
      const j = await fetchPublicProfile(otherKind, otherId);
      if (cancelled) return;
      setHydratedFor(otherId);
      if (j) {
        const name = j.name || (otherKind === 'ngo' ? 'Unknown NGO' : 'Unknown User');
        const avatar = j.logoUrl || j.avatarUrl || '';
        setDisplayName(name);
        if (avatar && !displayAvatar) setDisplayAvatar(avatar);
      }
    })();

    return () => { cancelled = true; };
  }, [displayName, displayAvatar, conversation.otherId, conversation.otherKind, hydratedFor]);

  const headerName =
    !displayName || isUUID(displayName) || displayName === conversation.otherId
      ? (conversation.otherKind === 'ngo' ? 'Unknown NGO' : 'Unknown User')
      : displayName;

  return (
    <div className="chat-window">
      <header className="chat-header">
        <span>{headerName}</span>
        {hasMore && (
          <button className="load-older" onClick={onLoadOlder} style={{ marginLeft: 'auto' }}>
            Load older
          </button>
        )}
      </header>

      <div className="chat-body" ref={bodyRef}>
        {messages.map((m) => (
          <div key={m.id || m.createdAtId} className={`msg ${m.senderId === me.id ? 'mine' : ''}`}>
            {m.text ? <div className="msg-text">{m.text}</div> : null}
            <div className="msg-time">
              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} /> {/* 👈 invisible anchor */}
      </div>

      <footer className="chat-footer">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message…"
          disabled={sending}
        />
        <button onClick={handleSend} disabled={sending || !text.trim()}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </footer>
    </div>
  );
}
