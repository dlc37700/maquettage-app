import React, { useState, useEffect, useRef } from 'react';
import { subscribeToMessages, sendMessage, getClientNickname } from '../services/session';

function formatTime(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ChatPanel({ sessionCode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const seenCountRef = useRef(0);
  const inputRef = useRef(null);
  const myNickname = getClientNickname() || 'Moi';

  useEffect(() => {
    if (!sessionCode) return;
    const unsub = subscribeToMessages(sessionCode, setMessages);
    return unsub;
  }, [sessionCode]);

  useEffect(() => {
    if (open) {
      seenCountRef.current = messages.length;
      setUnread(0);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'instant' });
        inputRef.current?.focus();
      }, 50);
    } else {
      setUnread(Math.max(0, messages.length - seenCountRef.current));
    }
  }, [messages, open]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(sessionCode, trimmed);
    setText('');
    inputRef.current?.focus();
  };

  if (!sessionCode) return null;

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 8000, fontFamily: 'Nunito, sans-serif' }}>
      {open ? (
        <div style={{
          width: 320, height: 440,
          backgroundColor: 'white',
          borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
          border: '1px solid rgba(0,0,0,0.07)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #7C3AED, #6C63FF)',
            padding: '11px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15 }}>💬</span>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>Discussion</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}
              title="Réduire"
            >✕</button>
          </div>

          {/* Messages list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 48, lineHeight: 1.8 }}>
                Aucun message pour l'instant.<br />
                Dis bonjour à tes camarades ! 👋
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.nickname === myNickname;
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {!isMe && (
                    <span style={{ fontSize: 10, color: '#6B7280', marginBottom: 3, fontWeight: 800, paddingLeft: 4 }}>
                      {msg.nickname}
                    </span>
                  )}
                  <div style={{
                    maxWidth: '82%', padding: '8px 12px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor: isMe ? '#6C63FF' : '#F3F4F6',
                    color: isMe ? 'white' : '#1F2937',
                    fontSize: 13, lineHeight: 1.45, wordBreak: 'break-word',
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                    {isMe ? 'Moi · ' : ''}{formatTime(msg.at)}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={{ padding: '8px 10px 10px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Écrire un message…"
              maxLength={500}
              style={{
                flex: 1, padding: '8px 14px', borderRadius: 20,
                border: '1.5px solid #E5E7EB', fontSize: 13,
                outline: 'none', fontFamily: 'Nunito, sans-serif',
                backgroundColor: '#F9FAFB', color: '#1F2937',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none', flexShrink: 0,
                backgroundColor: text.trim() ? '#6C63FF' : '#E5E7EB',
                color: text.trim() ? 'white' : '#9CA3AF',
                cursor: text.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, transition: 'background-color 0.15s',
              }}
              title="Envoyer"
            >➤</button>
          </div>
        </div>
      ) : (
        /* Collapsed button */
        <button
          onClick={() => setOpen(true)}
          title="Ouvrir la discussion"
          style={{
            width: 52, height: 52, borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, #7C3AED, #6C63FF)',
            color: 'white', fontSize: 22, cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(108,99,255,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', transition: 'transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          💬
          {unread > 0 && (
            <div style={{
              position: 'absolute', top: -4, right: -4,
              backgroundColor: '#EF4444', color: 'white',
              borderRadius: '50%', width: 20, height: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, fontFamily: 'Nunito, sans-serif',
              border: '2px solid white',
            }}>
              {unread > 9 ? '9+' : unread}
            </div>
          )}
        </button>
      )}
    </div>
  );
}
