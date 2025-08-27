import React from 'react';
import ConversationItem from './ConversationItem/ConversationItem';

export default function ConversationList({ conversations, activeId, onSelect }) {
  return (
    <div className="conversation-list">
      {conversations.map((c) => (
        <ConversationItem
          key={c.id}
          conversation={c}
          active={c.id === activeId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
