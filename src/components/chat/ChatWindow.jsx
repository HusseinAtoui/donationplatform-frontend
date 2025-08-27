// src/components/chat/ChatWindow.jsx
import React, { useState } from 'react';
import './ChatWindow.css';

export default function ChatWindow({ conversation, me }) {
  const [messages, setMessages] = useState(conversation.messages || []);
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    setMessages([
      ...messages,
      { id: Date.now(), senderId: me.id, text, createdAt: new Date().toISOString() },
    ]);
    setText('');
  };

  return (
    <div className="chat-window">
      <header className="chat-header">{conversation.name}</header>

      <div className="chat-body">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.senderId === me.id ? 'mine' : ''}`}>
            <div className="msg-text">{m.text}</div>
            <div className="msg-time">{new Date(m.createdAt).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>

      <footer className="chat-footer">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </footer>
    </div>
  );
}
