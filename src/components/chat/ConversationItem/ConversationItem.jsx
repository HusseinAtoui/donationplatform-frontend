import React, { useEffect, useMemo, useState } from 'react';
import './ConversationItem.css';

export default function ConversationItem({ conversation, active, onSelect }) {
  const handleClick = () => onSelect?.(conversation);

  const initials = useMemo(() => {
    const n = conversation.displayName || conversation.name || conversation.id || '';
    return (n.trim()[0] || '?').toUpperCase();
  }, [conversation.displayName, conversation.name, conversation.id]);

  const [imgSrc, setImgSrc] = useState(conversation.displayAvatar || '');
  const [showImg, setShowImg] = useState(Boolean(conversation.displayAvatar));

  useEffect(() => {
    setImgSrc(conversation.displayAvatar || '');
    setShowImg(Boolean(conversation.displayAvatar));
  }, [conversation.displayAvatar, conversation.id]);

  return (
    <div className={`conversation-item ${active ? 'active' : ''}`} onClick={handleClick}>
      <div className="conv-avatar" aria-hidden="true">
        {showImg ? (
          <img
            src={imgSrc}
            alt=""
            onError={() => setShowImg(false)}  // fallback to initials if 404/invalid
          />
        ) : (
          <span className="conv-initials">{initials}</span>
        )}
      </div>

      <div className="conv-info">
        <div className="conv-name">{(conversation.displayName || conversation.name || conversation.id)}</div>
        <div className="conv-last">
          {conversation.lastMessage ? conversation.lastMessage.text : 'No messages yet'}
        </div>
      </div>
    </div>
  );
}
