import React, { useEffect, useState } from 'react';
import { useProject } from '../hooks/useProject';
import { listenBgRequests, clearBgRequest, getClientId } from '../services/session';

export default function BgRequestNotification({ sessionCode }) {
  const { state, dispatch } = useProject();
  const [request, setRequest] = useState(null);

  useEffect(() => {
    if (!sessionCode) return;
    const myClientId = getClientId();
    const unsub = listenBgRequests(sessionCode, myClientId, (req) => {
      setRequest(req);
    });
    return unsub;
  }, [sessionCode]);

  if (!request) return null;

  const { fromNickname, backgroundColor, backgroundGradient, backgroundImage, screenIds = [] } = request;

  // Build preview style
  let previewStyle = { width: 60, height: 60, borderRadius: 10, border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 };
  if (backgroundImage) {
    previewStyle.backgroundImage = `url(${backgroundImage})`;
    previewStyle.backgroundSize = 'cover';
    previewStyle.backgroundPosition = 'center';
  } else if (backgroundGradient && backgroundGradient.from && backgroundGradient.to) {
    previewStyle.background = `linear-gradient(${backgroundGradient.angle ?? 135}deg, ${backgroundGradient.from}, ${backgroundGradient.to})`;
  } else {
    previewStyle.backgroundColor = backgroundColor || '#FFFFFF';
  }

  const myClientId = getClientId();

  const handleAccept = () => {
    // Only apply to own screens that still exist in current state
    const ownIds = new Set(state.screens.filter(s => !s._remote).map(s => s.id));
    const validIds = screenIds.filter(id => ownIds.has(id));
    if (validIds.length > 0) {
      dispatch({
        type: 'APPLY_BACKGROUND_TO_SCREENS',
        screenIds: validIds,
        backgroundColor,
        backgroundGradient: backgroundGradient ?? null,
        backgroundImage: backgroundImage ?? null,
      });
    }
    clearBgRequest(sessionCode, myClientId);
    setRequest(null);
  };

  const handleDecline = () => {
    clearBgRequest(sessionCode, myClientId);
    setRequest(null);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9100,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Nunito, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: '#1e1b2e',
          borderRadius: 16,
          padding: '24px',
          maxWidth: 380,
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid rgba(124,58,237,0.35)',
          color: 'white',
        }}
      >
        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🎨</span>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#A78BFA' }}>Demande d&apos;arrière-plan</div>
        </div>

        {/* Message + preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={previewStyle} />
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
            <strong style={{ color: 'white' }}>{fromNickname || 'Quelqu’un'}</strong> souhaite appliquer son fond d&apos;écran à{' '}
            <strong style={{ color: '#A78BFA' }}>{screenIds.length} de tes écrans</strong>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleDecline}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)',
              borderRadius: 8,
              padding: '10px 0',
              fontSize: 13,
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ❌ Refuser
          </button>
          <button
            onClick={handleAccept}
            style={{
              flex: 1,
              background: '#7C3AED',
              border: 'none',
              color: 'white',
              borderRadius: 8,
              padding: '10px 0',
              fontSize: 13,
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✅ Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
