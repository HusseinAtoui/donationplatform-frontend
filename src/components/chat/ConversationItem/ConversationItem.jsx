import React from 'react';
import './ConversationItem.css';

export default function ConversationItem({ conversation, active, onSelect }) {
  const handleClick = () => {
    if (onSelect) onSelect(conversation);
  };

  return (
    <div
      className={`conversation-item ${active ? 'active' : ''}`}
      onClick={handleClick}
    >
      <div className="conv-avatar">
        <img src={conversation.avatar || '/placeholder-avatar.png'} alt={conversation.name} />
      </div>
      <div className="conv-info">
        <div className="conv-name">{conversation.name || conversation.id}</div>
        <div className="conv-last">
          {conversation.lastMessage ? conversation.lastMessage.text : 'No messages yet'}
        </div>
      </div>
    </div>
  );
}
