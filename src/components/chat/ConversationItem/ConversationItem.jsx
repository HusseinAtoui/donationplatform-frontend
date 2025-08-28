// components/chat/ConversationItem/ConversationItem.jsx
import React from 'react';
import './ConversationItem.css';

export default function ConversationItem({ conversation, active, onSelect }) {
  const handleClick = () => onSelect?.(conversation);
  const hasAvatar = Boolean(conversation.avatar);

  return (
    <div className={`conversation-item ${active ? 'active' : ''}`} onClick={handleClick}>
      {hasAvatar && (
        <div className="conv-avatar">
          <img src={conversation.avatar} alt={conversation.name} />
        </div>
      )}
      <div className={`conv-info ${hasAvatar ? '' : 'no-avatar'}`}>
        <div className="conv-name">{conversation.name || conversation.id}</div>
        <div className="conv-last">
          {conversation.lastMessage ? conversation.lastMessage.text : 'No messages yet'}
        </div>
      </div>
    </div>
  );
}
