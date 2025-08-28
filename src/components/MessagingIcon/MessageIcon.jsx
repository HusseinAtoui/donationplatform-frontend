// components/MessageIcon/MessageIcon.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listConversations, getMe } from '../../api/messaging';
import './MessageIcon.css';

const POLL_MS = 30000;

const MessageIcon = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const meIdRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    const init = async () => {
      try {
        setIsLoading(true);
        const me = await getMe().catch(() => null);
        meIdRef.current = me?.id || null;
        await fetchUnreadCount();
        setError(null);
      } catch (err) {
        console.error('Failed initial unread check:', err);
        setError('Failed to load notifications');
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    init();
    const intervalId = setInterval(fetchUnreadCount, POLL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchUnreadCount();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      alive = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const conversations = await listConversations();
      const meId = meIdRef.current;
      const storedRole = localStorage.getItem('role');

      const totalUnread = conversations.reduce((total, conv) => {
        if (meId) {
          if (conv.userId === meId) return total + (conv.userUnread || 0);
          if (conv.ngoId === meId) return total + (conv.ngoUnread || 0);
          return total;
        }
        if (storedRole === 'user') return total + (conv.userUnread || 0);
        if (storedRole === 'ngo') return total + (conv.ngoUnread || 0);
        return total + Math.max(conv.userUnread || 0, conv.ngoUnread || 0);
      }, 0);

      setUnreadCount(totalUnread);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
      setError('Failed to load notifications');
    }
  };

  const handleClick = () => {
    navigate('/messages');
  };

  return (
    <button
      type="button"
      className="message-icon-container no-background"
      onClick={handleClick}
      aria-label={isLoading ? 'Messages' : `Messages, ${unreadCount} unread`}
      title="Messages"
    >
      <div className="message-icon">
        {/* Outline-only Instagram-style paper plane */}
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <path
            d="M22 2L11 13"
            stroke="#5FAB7D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 2L14.5 22l-3.5-9L2 9l20-7Z"
            stroke="#5FAB7D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {unreadCount > 0 && (
          <div className="notification-badge" aria-live="polite">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </div>

      {error && <span className="visually-hidden">{error}</span>}
    </button>
  );
};

export default MessageIcon;
