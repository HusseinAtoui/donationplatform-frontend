// components/chat/ChatWindow.jsx
import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';

export default function ChatWindow({
  conversation,
  me,
  onSend,
  sending = false,
  onLoadOlder,
  hasMore = false,
  onBack, // navigate('/messages')
}) {
  const [messages, setMessages] = useState(conversation.messages || []);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { setMessages(conversation.messages || []); }, [conversation.id, conversation.messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await onSend?.({ text: trimmed, files: [] });
    setText('');
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' }));
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending) handleSend();
    }
  };

  const headerName = conversation.displayName || 'Conversation';

  return (
    <div className="chat-window">
      <header className="chat-header">
        {/* SMALL CIRCULAR BACK ICON */}
        <button
          type="button"
          className="back-btn"
          aria-label="Back to list"
          onClick={onBack}
        />
        <span
          className="header-title"
          onClick={onBack}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onBack?.()}
          title="Back to conversations"
        >
          {headerName}
        </span>

        {hasMore && (
          <button type="button" className="older-btn" onClick={onLoadOlder}>
            Load older
          </button>
        )}
      </header>

      <div className="chat-body">
        {messages.map((m) => (
          <div key={m.id || m.createdAtId} className={`msg ${m.senderId === me?.id ? 'mine' : ''}`}>
            {m.text ? <div className="msg-text">{m.text}</div> : null}
            <div className="msg-time">
              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <footer className="chat-footer">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message…"
          disabled={sending}
        />
        <button type="button" onClick={handleSend} disabled={sending || !text.trim()}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </footer>
    </div>
  );
}
