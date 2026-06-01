import React, { useState } from 'react';
import { useProject } from '../hooks/useProject';
import { sendBgRequest } from '../services/session';

function bgStyle(screen) {
  if (screen?.backgroundImage) {
    return { backgroundImage: `url(${screen.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  if (screen?.backgroundGradient?.from && screen?.backgroundGradient?.to) {
    return { background: `linear-gradient(${screen.backgroundGradient.angle ?? 135}deg, ${screen.backgroundGradient.from}, ${screen.backgroundGradient.to})` };
  }
  return { backgroundColor: screen?.backgroundColor || '#FFFFFF' };
}

function BgPreview({ screen, size = 40, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      title={screen?.name}
      style={{
        width: size, height: Math.round(size * 1.6), borderRadius: 7, flexShrink: 0,
        border: selected ? '2.5px solid #A78BFA' : '2px solid rgba(255,255,255,0.12)',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: selected ? '0 0 0 3px rgba(167,139,250,0.35)' : 'none',
        transition: 'border 0.12s, box-shadow 0.12s',
        overflow: 'hidden',
        position: 'relative',
        ...bgStyle(screen),
      }}
    >
      {selected && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,58,237,0.18)' }}>
          <span style={{ fontSize: 14 }}>✓</span>
        </div>
      )}
    </div>
  );
}

export default function BgApplyModal({ activeScreenId, allScreens, sessionCode, myNickname, onClose }) {
  const { dispatch } = useProject();

  const ownScreens = allScreens.filter(s => !s._remote);
  const remoteGroups = {};
  allScreens.filter(s => s._remote).forEach(s => {
    const key = s._clientId || s._nickname || 'unknown';
    if (!remoteGroups[key]) remoteGroups[key] = { nickname: s._nickname, clientId: s._clientId, screens: [] };
    remoteGroups[key].screens.push(s);
  });

  // Source: one of the user's own screens
  const defaultSourceId = ownScreens.find(s => s.id === activeScreenId)?.id || ownScreens[0]?.id || null;
  const [sourceId, setSourceId] = useState(defaultSourceId);
  const sourceScreen = ownScreens.find(s => s.id === sourceId) || ownScreens[0];

  // Targets: all screens (own + remote)
  const allSelectableIds = allScreens.filter(s => s.id !== sourceId).map(s => s.id);
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
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // When source changes, uncheck it if it was checked
  const handleSourceChange = (id) => {
    setSourceId(id);
    setChecked(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleValidate = () => {
    if (checked.size === 0 || !sourceScreen) return;
    const { backgroundColor, backgroundGradient, backgroundImage } = sourceScreen;

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

  const allChecked = allSelectableIds.length > 0 && checked.size === allSelectableIds.length;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9200, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#1e1b2e', borderRadius: 16, padding: '24px', minWidth: 360, maxWidth: 500, maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(124,58,237,0.3)', color: 'white' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#A78BFA' }}>🎨 Appliquer un arrière-plan</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 18, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        {/* ── Step 1: Source screen ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#A78BFA', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
            1 · Fond à appliquer (mon écran)
          </div>
          {ownScreens.length === 0 ? (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Aucun écran disponible</div>
          ) : (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {ownScreens.map(s => (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <BgPreview screen={s} size={48} selected={s.id === sourceId} onClick={() => handleSourceChange(s.id)} />
                  <span style={{ fontSize: 9, color: s.id === sourceId ? '#A78BFA' : 'rgba(255,255,255,0.45)', fontWeight: 700, maxWidth: 58, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)' }} />

        {/* ── Step 2: Target screens ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#A78BFA', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              2 · Appliquer sur…
            </div>
            {allSelectableIds.length > 0 && (
              <button
                onClick={toggleAll}
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)', color: '#A78BFA', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' }}
              >
                {allChecked ? 'Tout décocher' : 'Tout cocher'}
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Own screens (excluding source) */}
            {ownScreens.filter(s => s.id !== sourceId).length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#7C3AED', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>Mes écrans</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {ownScreens.filter(s => s.id !== sourceId).map(screen => (
                    <ScreenRow key={screen.id} screen={screen} checked={checked.has(screen.id)} onToggle={() => toggleScreen(screen.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Remote screens */}
            {Object.entries(remoteGroups).map(([key, group]) => (
              <div key={key}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#10B981', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>
                  👤 {group.nickname || 'Inconnu'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {group.screens.map(screen => (
                    <ScreenRow key={screen.id} screen={screen} checked={checked.has(screen.id)} onToggle={() => toggleScreen(screen.id)} isRemote />
                  ))}
                </div>
              </div>
            ))}

            {allSelectableIds.length === 0 && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '12px 0' }}>
                Aucun autre écran disponible
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            onClick={handleValidate}
            disabled={checked.size === 0}
            style={{ background: checked.size === 0 ? 'rgba(124,58,237,0.3)' : '#7C3AED', border: 'none', color: checked.size === 0 ? 'rgba(255,255,255,0.3)' : 'white', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: checked.size === 0 ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
          >
            Valider ({checked.size})
          </button>
        </div>
      </div>
    </div>
  );
}

function ScreenRow({ screen, checked, onToggle, isRemote }) {
  return (
    <label
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
        backgroundColor: checked ? (isRemote ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.15)') : 'rgba(255,255,255,0.04)',
        border: `1px solid ${checked ? (isRemote ? 'rgba(16,185,129,0.4)' : 'rgba(124,58,237,0.4)') : 'rgba(255,255,255,0.06)'}`,
        transition: 'background 0.12s, border 0.12s',
      }}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} style={{ accentColor: isRemote ? '#10B981' : '#7C3AED', width: 15, height: 15, cursor: 'pointer' }} />
      <div style={{ width: 28, height: 44, borderRadius: 5, border: '1px solid rgba(255,255,255,0.12)', flexShrink: 0, overflow: 'hidden', ...bgStyle(screen) }} />
      <span style={{ fontSize: 12, fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {screen.name}
      </span>
    </label>
  );
}
