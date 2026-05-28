import React, { useState } from 'react';
import { useProject } from '../hooks/useProject';
import { sendBgRequest } from '../services/session';

function BgPreview({ backgroundColor, backgroundGradient, backgroundImage, size = 40 }) {
  let style = { width: size, height: size, borderRadius: 6, flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)' };
  if (backgroundImage) {
    style.backgroundImage = `url(${backgroundImage})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  } else if (backgroundGradient && backgroundGradient.from && backgroundGradient.to) {
    style.background = `linear-gradient(${backgroundGradient.angle ?? 135}deg, ${backgroundGradient.from}, ${backgroundGradient.to})`;
  } else {
    style.backgroundColor = backgroundColor || '#FFFFFF';
  }
  return <div style={style} />;
}

export default function BgApplyModal({ sourceScreen, allScreens, sessionCode, myNickname, onClose }) {
  const { dispatch } = useProject();

  const ownScreens = allScreens.filter(s => !s._remote);
  // Group remote screens by _clientId
  const remoteGroups = {};
  allScreens.filter(s => s._remote).forEach(s => {
    const key = s._clientId || s._nickname || 'unknown';
    if (!remoteGroups[key]) remoteGroups[key] = { nickname: s._nickname, clientId: s._clientId, screens: [] };
    remoteGroups[key].screens.push(s);
  });

  const allSelectableIds = allScreens.map(s => s.id);
  const [checked, setChecked] = useState(new Set());

  const toggleAll = () => {
    if (checked.size === allSelectableIds.length) {
      setChecked(new Set());
    } else {
      setChecked(new Set(allSelectableIds));
    }
  };

  const toggleScreen = (id) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleValidate = () => {
    if (checked.size === 0) return;

    const { backgroundColor, backgroundGradient, backgroundImage } = sourceScreen;

    // Apply to own screens immediately
    const ownCheckedIds = ownScreens.filter(s => checked.has(s.id)).map(s => s.id);
    if (ownCheckedIds.length > 0) {
      dispatch({
        type: 'APPLY_BACKGROUND_TO_SCREENS',
        screenIds: ownCheckedIds,
        backgroundColor,
        backgroundGradient: backgroundGradient ?? null,
        backgroundImage: backgroundImage ?? null,
      });
    }

    // Send requests to remote members
    Object.entries(remoteGroups).forEach(([, group]) => {
      const remoteCheckedIds = group.screens.filter(s => checked.has(s.id)).map(s => s.id);
      if (remoteCheckedIds.length > 0 && group.clientId) {
        sendBgRequest(sessionCode, group.clientId, {
          fromNickname: myNickname,
          backgroundColor,
          backgroundGradient: backgroundGradient ?? null,
          backgroundImage: backgroundImage ?? null,
          screenIds: remoteCheckedIds,
        });
      }
    });

    onClose();
  };

  const allChecked = checked.size === allSelectableIds.length && allSelectableIds.length > 0;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9200,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Nunito, sans-serif',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#1e1b2e',
          borderRadius: 16,
          padding: '24px',
          minWidth: 360,
          maxWidth: 480,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid rgba(124,58,237,0.3)',
          color: 'white',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BgPreview
            backgroundColor={sourceScreen?.backgroundColor}
            backgroundGradient={sourceScreen?.backgroundGradient}
            backgroundImage={sourceScreen?.backgroundImage}
            size={48}
          />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#A78BFA' }}>Appliquer l'arrière-plan</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              Depuis : {sourceScreen?.name || 'Accueil'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer', padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Select all toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={toggleAll}
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.4)',
              color: '#A78BFA',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 12,
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {allChecked ? 'Tout décocher' : 'Tout cocher'}
          </button>
        </div>

        {/* Screen list */}
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Own screens */}
          {ownScreens.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#7C3AED', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>
                Mes écrans
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {ownScreens.map(screen => (
                  <ScreenRow
                    key={screen.id}
                    screen={screen}
                    checked={checked.has(screen.id)}
                    onToggle={() => toggleScreen(screen.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Remote screens grouped by member */}
          {Object.entries(remoteGroups).map(([key, group]) => (
            <div key={key}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#10B981', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>
                {group.nickname || 'Inconnu'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {group.screens.map(screen => (
                  <ScreenRow
                    key={screen.id}
                    screen={screen}
                    checked={checked.has(screen.id)}
                    onToggle={() => toggleScreen(screen.id)}
                    isRemote
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleValidate}
            disabled={checked.size === 0}
            style={{
              background: checked.size === 0 ? 'rgba(124,58,237,0.3)' : '#7C3AED',
              border: 'none',
              color: checked.size === 0 ? 'rgba(255,255,255,0.3)' : 'white',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 13,
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              cursor: checked.size === 0 ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            Valider ({checked.size})
          </button>
        </div>
      </div>
    </div>
  );
}

function ScreenRow({ screen, checked, onToggle, isRemote }) {
  let bgStyle = {};
  if (screen.backgroundImage) {
    bgStyle.backgroundImage = `url(${screen.backgroundImage})`;
    bgStyle.backgroundSize = 'cover';
    bgStyle.backgroundPosition = 'center';
  } else if (screen.backgroundGradient && screen.backgroundGradient.from && screen.backgroundGradient.to) {
    bgStyle.background = `linear-gradient(${screen.backgroundGradient.angle ?? 135}deg, ${screen.backgroundGradient.from}, ${screen.backgroundGradient.to})`;
  } else {
    bgStyle.backgroundColor = screen.backgroundColor || '#FFFFFF';
  }

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 8px',
        borderRadius: 8,
        cursor: 'pointer',
        backgroundColor: checked
          ? (isRemote ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.15)')
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${checked
          ? (isRemote ? 'rgba(16,185,129,0.4)' : 'rgba(124,58,237,0.4)')
          : 'rgba(255,255,255,0.06)'}`,
        transition: 'background 0.12s, border 0.12s',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        style={{ accentColor: isRemote ? '#10B981' : '#7C3AED', width: 15, height: 15, cursor: 'pointer' }}
      />
      {/* Color swatch */}
      <div style={{ width: 28, height: 28, borderRadius: 5, border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0, ...bgStyle }} />
      <span style={{ fontSize: 12, fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {screen.name}
      </span>
    </label>
  );
}
