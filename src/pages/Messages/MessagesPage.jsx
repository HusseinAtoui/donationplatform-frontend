// src/pages/MessagesPage.jsx
import React, { useEffect, useState } from 'react';
import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import { listConversations, startConversation } from '../../api/messaging';
import './messages.css';

function getMe() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const [, p2] = token.split('.');
    const payload = JSON.parse(atob(p2));
    return { id: payload.id, role: payload.role, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

const isFn = (x) => typeof x === 'function';

export default function MessagesPage() {
  const [me] = useState(getMe());
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [newTarget, setNewTarget] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setErr('');
        const res = await listConversations();
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.conversations)
          ? res.conversations
          : [];
        if (!mounted) return;
        setConversations(list);
        if (!active && list.length) setActive(list[0]);
      } catch (e) {
        console.error(e);
        if (mounted) setErr('Failed to load conversations.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sanity log (once)
  useEffect(() => {
    // If either prints "object"/"undefined", the import/export is wrong.
    console.log('MessagesPage sanity', {
      ConversationList: typeof ConversationList,
      ChatWindow: typeof ChatWindow,
    });
  }, []);

  async function handleStart() {
    const target = newTarget.trim();
    if (!target) return;
    try {
      const body = me?.role === 'user' ? { ngoId: target } : { userId: target };
      const { conversation } = await startConversation(body);
      setConversations((prev) => {
        const exists = prev.find((p) => p.id === conversation.id);
        return exists ? prev : [conversation, ...prev];
      });
      setActive(conversation);
      setNewTarget('');
    } catch (e) {
      console.error(e);
      alert('Failed to start conversation');
    }
  }

  return (
    <div className="messages-page">
      <aside className="sidebar">
        <div className="start-box">
          <input
            placeholder={me?.role === 'user' ? 'NGO ID' : 'User ID'}
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleStart();
            }}
          />
        </div>
        <button className="start-btn" onClick={handleStart} disabled={!newTarget.trim()}>
          Start
        </button>

        {loading ? (
          <div className="loading">Loading…</div>
        ) : err ? (
          <div className="error-msg">{err}</div>
        ) : isFn(ConversationList) ? (
          <ConversationList
            conversations={conversations}
            activeId={active?.id}
            onSelect={setActive}
          />
        ) : (
          <div className="error-msg">ConversationList import isn’t a component (see console)</div>
        )}
      </aside>

      <main className="main">
        {isFn(ChatWindow) ? (
          <ChatWindow conversation={active} me={me} />
        ) : (
          <div className="error-msg">ChatWindow import isn’t a component (see console)</div>
        )}
        {!active && !loading && !err && (
          <div className="empty-hint">Select a conversation or start a new one.</div>
        )}
      </main>
    </div>
  );
}
