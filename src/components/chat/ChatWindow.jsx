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
}) {
  const [messages, setMessages] = useState(conversation.messages || []);
  const [text, setText] = useState('');
  const bodyRef = useRef();

  useEffect(() => {
    setMessages(conversation.messages || []);
  }, [conversation.id, conversation.messages]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await onSend?.({ text: trimmed, files: [] }); // no files
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending) handleSend();
    }
  };

  return (
    <div className="chat-window">
      <header className="chat-header">
        {conversation.avatar ? (
          <img
            src={conversation.avatar}
            alt={conversation.name}
            style={{ width: 36, height: 36, borderRadius: '50%', marginRight: 8 }}
          />
        ) : null}
        <span>{conversation.name}</span>
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
