import React from 'react';

export default function ChatWindow({ conversation, me }) {
  if (!conversation) {
    return <div className="chat-window empty">Select a conversation or start a new one.</div>;
  }

  return (
    <div className="chat-window">
      <header className="chat-header">
        <h3>{conversation.title || conversation.id}</h3>
        <span className="muted">{me?.name || me?.email || 'You'}</span>
      </header>

      <div className="chat-body">
        {(conversation.messages || []).map((m) => (
          <div
            key={m.id || `${m.senderId}-${m.createdAt}`}
            className={`msg ${m.senderId === me?.id ? 'mine' : ''}`}
          >
            <div className="msg-text">{m.text}</div>
            <div className="msg-time">
              {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
            </div>
          </div>
        ))}
      </div>

      <footer className="chat-footer muted">Composer goes here…</footer>
    </div>
  );
}
