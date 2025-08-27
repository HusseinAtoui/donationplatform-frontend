// src/pages/MessagesPage.jsx
import React, { useEffect, useState } from 'react';
import ConversationList from '../../components/chat/ConversationList';
import ChatWindow from '../../components/chat/ChatWindow';
import './messages.css';

// Dummy user
function getMe() {
  return { id: 'u1', role: 'user', name: 'John Doe', email: 'john@example.com' };
}

// Dummy conversations
const MOCK_CONVERSATIONS = [
  {
    id: 'c1',
    name: 'Helping Hands NGO',
    avatar: '/placeholder-avatar.png',
    messages: [
      { id: 'm1', senderId: 'u1', text: 'Hi there!', createdAt: new Date() },
      { id: 'm2', senderId: 'ngo1', text: 'Hello! How can we help you?', createdAt: new Date() },
    ],
  },
  {
    id: 'c2',
    name: 'Kind Hearts',
    avatar: '/placeholder-avatar.png',
    messages: [
      { id: 'm1', senderId: 'ngo2', text: 'Thanks for your donation!', createdAt: new Date() },
      { id: 'm2', senderId: 'u1', text: 'You are welcome!', createdAt: new Date() },
    ],
  },
  {
    id: 'c3',
    name: 'Care for All',
    avatar: '/placeholder-avatar.png',
    messages: [
      { id: 'm1', senderId: 'ngo3', text: 'Can we schedule a visit?', createdAt: new Date() },
      { id: 'm2', senderId: 'u1', text: 'Sure, I am available tomorrow.', createdAt: new Date() },
    ],
  },
];

export default function MessagesPage() {
  const [me] = useState(getMe());
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Dummy load
    setTimeout(() => {
      setConversations(MOCK_CONVERSATIONS);
      setActive(MOCK_CONVERSATIONS[0]); // start with first active
      setLoading(false);
    }, 300); // simulate API delay
  }, []);

  const filtered = conversations.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="messages-page">
      {/* Sidebar */}
      <aside className="sidebar">
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
            onSelect={setActive}
          />
        )}
      </aside>

      {/* Main Chat Window */}
      <main className="main">
        {active ? (
          <ChatWindow conversation={active} me={me} />
        ) : (
          <div className="empty-hint">Select a conversation to start chatting</div>
        )}
      </main>
    </div>
  );
}
