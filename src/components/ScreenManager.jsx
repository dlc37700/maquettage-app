import React, { useState, useRef, useEffect } from 'react';
import { useProject, useActiveScreen } from '../hooks/useProject';
import BgApplyModal from './BgApplyModal';
import { getClientNickname, listenSessionMembers, sendScreenTransfer, getClientId } from '../services/session';
import { getShapeSvgInner } from '../data/shapes';

const THUMB_W = 120;
const SCALE = THUMB_W / 390;
const THUMB_H = Math.round(844 * SCALE);

function getBg(bgColor, bgGradient) {
  if (bgGradient && bgGradient.from && bgGradient.to) {
    return { background: `linear-gradient(${bgGradient.angle ?? 135}deg, ${bgGradient.from}, ${bgGradient.to})` };
  }
  return { backgroundColor: bgColor };
}

function MiniComp({ comp }) {
  const { type, props, position: pos, zIndex } = comp;
  const base = {
    position: 'absolute', left: pos.x, top: pos.y,
    width: pos.width, height: pos.height,
    opacity: props.opacity ?? 1, zIndex: zIndex || 1, overflow: 'hidden',
  };
  switch (type) {
    case 'button':
      return (
        <div style={{ ...base, ...getBg(props.bgColor, props.bgGradient), borderRadius: props.borderRadius, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: props.bgColor === 'transparent' ? 'none' : '0 2px 8px rgba(0,0,0,0.15)' }}>
          {props.emoji && props.iconPosition === 'only'
            ? <span style={{ fontSize: Math.min(pos.width, pos.height) * 0.52, lineHeight: 1 }}>{props.emoji}</span>
            : <span style={{ color: props.textColor, fontSize: props.fontSize, fontFamily: props.fontFamily || 'Nunito', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 8px' }}>{props.label}</span>}
        </div>
      );
    case 'text': {
      const fw = props.fontWeight === 'bold' ? 700 : props.fontWeight === 'semibold' ? 600 : 400;
      return <div style={{ ...base, color: props.textColor, fontSize: props.fontSize, fontFamily: props.fontFamily || 'Nunito', fontWeight: fw, display: 'flex', alignItems: 'center', lineHeight: 1.4 }}>{props.label}</div>;
    }
    case 'input':
      return <div style={{ ...base, ...getBg(props.bgColor, props.bgGradient), borderRadius: props.borderRadius, border: '1.5px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
        <span style={{ color: props.textColor, fontSize: 13, fontFamily: props.fontFamily || 'Nunito' }}>{props.placeholder}</span>
      </div>;
    case 'checkbox':
    case 'radio':
      return (
        <div style={{ ...base, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, flexShrink: 0, borderRadius: type === 'radio' ? '50%' : 4, border: `2px solid ${props.accentColor}`, backgroundColor: props.checked ? props.accentColor : 'white' }} />
          <span style={{ color: props.textColor, fontSize: props.fontSize, fontFamily: props.fontFamily || 'Nunito' }}>{props.label}</span>
        </div>
      );
    case 'image':
      if (props.imageData) return <img src={props.imageData} alt="" style={{ ...base, objectFit: 'cover', borderRadius: props.borderRadius }} />;
      return <div style={{ ...base, ...getBg(props.bgColor, props.bgGradient), borderRadius: props.borderRadius, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #D1D5DB' }}><span style={{ fontSize: 24 }}>🖼️</span></div>;
    case 'avatar':
      if (props.imageData) return <img src={props.imageData} alt="" style={{ ...base, objectFit: 'cover', borderRadius: '50%' }} />;
      if (props.emoji) return <div style={{ ...base, ...getBg(props.bgColor, props.bgGradient), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: Math.min(pos.width, pos.height) * 0.55, lineHeight: 1 }}>{props.emoji}</span></div>;
      return <div style={{ ...base, ...getBg(props.bgColor, props.bgGradient), borderRadius: '50%' }} />;
    case 'header':
      return <div style={{ ...base, ...getBg(props.bgColor, props.bgGradient), display: 'flex', alignItems: 'center', padding: '0 16px' }}>
        <span style={{ color: props.textColor, fontSize: 18, fontWeight: 700, fontFamily: props.fontFamily || 'Nunito' }}>{props.title}</span>
      </div>;
    case 'navbar':
      return <div style={{ ...base, ...getBg(props.bgColor, props.bgGradient), borderTop: '1px solid #E5E7EB' }} />;
    case 'card':
      return <div style={{ ...base, ...getBg(props.bgColor, props.bgGradient), borderRadius: props.borderRadius, boxShadow: '0 2px 16px rgba(0,0,0,0.10)' }} />;
    case 'colorblock':
      return <div style={{ ...base, ...getBg(props.bgColor, props.bgGradient), borderRadius: props.borderRadius || 0 }} />;
    case 'switch':
      return (
        <div style={{ ...base, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: 1, color: '#1F2937', fontSize: props.fontSize, fontFamily: props.fontFamily || 'Nunito' }}>{props.label}</span>
          <div style={{ width: 46, height: 26, backgroundColor: props.checked ? props.activeColor : '#D1D5DB', borderRadius: 13, flexShrink: 0 }} />
        </div>
      );
    case 'slider':
      return (
        <div style={{ ...base, display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: `${props.value}%`, height: '100%', backgroundColor: props.activeColor, borderRadius: 3 }} />
          </div>
        </div>
      );
    case 'listitem':
      return (
        <div style={{ ...base, ...getBg(props.bgColor, props.bgGradient), display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ width: 34, height: 34, backgroundColor: '#EDE9FE', borderRadius: 9, flexShrink: 0 }} />
          <span style={{ flex: 1, color: props.textColor, fontSize: 14, fontFamily: props.fontFamily || 'Nunito', fontWeight: 600 }}>{props.label}</span>
        </div>
      );
    case 'badge':
      return <div style={{ ...base, ...getBg(props.bgColor, props.bgGradient), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: props.textColor, fontSize: Math.min(pos.width, pos.height) * 0.38, fontWeight: 700, fontFamily: props.fontFamily || 'Nunito' }}>{props.count}</div>;
    case 'icon': {
      const hasBg = 'bgColor' in props;
      return (
        <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', ...(hasBg ? { ...getBg(props.bgColor, props.bgGradient), borderRadius: props.borderRadius ?? 100 } : {}) }}>
          <div style={{ width: Math.min(pos.width, pos.height) * 0.55, height: Math.min(pos.width, pos.height) * 0.55, backgroundColor: props.color || '#6C63FF', borderRadius: 2 }} />
        </div>
      );
    }
    case 'separator':
      return <div style={{ ...base, borderTop: `1px solid ${props.color || '#E5E7EB'}` }} />;
    case 'shape': {
      const svgInner = getShapeSvgInner(props.shape || 'circle', props.fillColor || '#6C63FF', props.strokeColor || 'transparent', props.strokeWidth ?? 0);
      return <div style={base}><svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" dangerouslySetInnerHTML={{ __html: svgInner }} /></div>;
    }
    default:
      return <div style={{ ...base, backgroundColor: '#E5E7EB' }} />;
  }
}

function ScreenThumbnail({ screen, isActive, isRemote, onClick, onRename, onDelete, onDuplicate, onTransfer, showTransfer }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(screen.name);
  const inputRef = useRef(null);

  const startEdit = (e) => {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const commitEdit = () => {
    setEditing(false);
    if (name.trim()) onRename(name.trim());
    else setName(screen.name);
  };

  return (
    <div
      className="screen-thumb"
      onClick={onClick}
      style={{
        padding: '8px',
        borderRadius: 10,
        backgroundColor: isRemote
          ? (isActive ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.07)')
          : (isActive ? 'rgba(109,40,217,0.3)' : 'rgba(255,255,255,0.05)'),
        border: isRemote
          ? `2px solid ${isActive ? '#10B981' : 'rgba(16,185,129,0.3)'}`
          : isActive ? '2px solid #7C3AED' : '2px solid transparent',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {isRemote && (
        <div style={{
          position: 'absolute', top: 4, left: 4, right: 4, zIndex: 2,
          backgroundColor: '#10B981', borderRadius: 4,
          fontSize: 9, fontWeight: 800, color: 'white',
          padding: '2px 5px', fontFamily: 'Nunito, sans-serif',
          textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{screen._nickname || '👤'}</div>
      )}
      {/* Mini preview — CSS scale */}
      <div style={{ width: THUMB_W, height: THUMB_H, borderRadius: 6, overflow: 'hidden', position: 'relative', margin: '0 auto 6px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', flexShrink: 0 }}>
        {(() => {
          const thumbBg = screen.backgroundImage
            ? { backgroundImage: `url(${screen.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : getBg(screen.backgroundColor, screen.backgroundGradient);
          return (
            <div style={{ position: 'absolute', top: 0, left: 0, width: 390, height: 844, ...thumbBg, transform: `scale(${SCALE})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
              {[...screen.components].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1)).map(comp => (
                <MiniComp key={comp.id} comp={comp} />
              ))}
            </div>
          );
        })()}
      </div>

      {/* Screen name */}
      {editing ? (
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') { setEditing(false); setName(screen.name); } }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            fontSize: 11,
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: '1px solid #7C3AED',
            borderRadius: 4,
            padding: '2px 4px',
            outline: 'none',
          }}
        />
      ) : (
        <div style={{
          color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
          fontSize: 11,
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 700,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {screen.name}
        </div>
      )}

      {/* Actions — own screens only */}
      {isActive && !isRemote && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 6 }}>
          <button onClick={startEdit} title="Renommer" style={actionBtnStyle}>✏️</button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} title="Dupliquer" style={actionBtnStyle}>📋</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Supprimer" style={{ ...actionBtnStyle, color: '#FCA5A5' }}>🗑️</button>
          {showTransfer && (
            <button onClick={(e) => { e.stopPropagation(); onTransfer(); }} title="Transférer à un membre" style={actionBtnStyle}>📤</button>
          )}
        </div>
      )}
    </div>
  );
}

const actionBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  padding: '2px 4px',
  borderRadius: 4,
  color: 'rgba(255,255,255,0.8)',
};

export default function ScreenManager({ isCreator = false, sessionCode = null }) {
  const { state, dispatch } = useProject();
  const [showBgModal, setShowBgModal] = useState(false);
  const [sessionMembers, setSessionMembers] = useState([]);
  const [transferingScreen, setTransferingScreen] = useState(null);

  useEffect(() => {
    if (!sessionCode) return;
    return listenSessionMembers(sessionCode, getClientId(), setSessionMembers);
  }, [sessionCode]);

  const handleTransfer = (screen, member) => {
    sendScreenTransfer(sessionCode, member.clientId, screen, getClientNickname());
    dispatch({ type: 'TRANSFER_SCREEN', id: screen.id });
    setTransferingScreen(null);
  };

  const addScreen = () => {
    dispatch({ type: 'ADD_SCREEN' });
  };

  return (
    <div style={{
      width: 158,
      minWidth: 140,
      height: '100%',
      background: 'linear-gradient(180deg, #13111f 0%, #1e1b2e 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '14px 10px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ color: '#A78BFA', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
          Écrans ({state.screens.length})
        </div>
        <button
          onClick={addScreen}
          style={{
            width: '100%',
            padding: '7px 0',
            borderRadius: 8,
            border: '1.5px dashed #7C3AED',
            backgroundColor: 'rgba(124,58,237,0.15)',
            color: '#A78BFA',
            fontSize: 12,
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            transition: 'background-color 0.15s',
          }}
        >
          ➕ Nouvel écran
        </button>
      </div>

      {/* Screen list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {state.screens.map((screen) => (
          <ScreenThumbnail
            key={screen.id}
            screen={screen}
            isActive={screen.id === state.activeScreenId}
            isRemote={!!screen._remote}
            showTransfer={!!sessionCode && !screen._remote && sessionMembers.length > 0}
            onClick={() => dispatch({ type: 'SET_ACTIVE_SCREEN', id: screen.id })}
            onRename={(name) => dispatch({ type: 'RENAME_SCREEN', id: screen.id, name })}
            onDelete={() => dispatch({ type: 'DELETE_SCREEN', id: screen.id })}
            onDuplicate={() => dispatch({ type: 'DUPLICATE_SCREEN', id: screen.id })}
            onTransfer={() => setTransferingScreen(screen)}
          />
        ))}
      </div>

      {transferingScreen && (
        <div
          onClick={() => setTransferingScreen(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9050, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#1e1b2e', borderRadius: 16, padding: 24, width: 320, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid rgba(167,139,250,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>📤</span>
              <div>
                <div style={{ color: 'white', fontSize: 15, fontWeight: 900 }}>Transférer l'écran</div>
                <div style={{ color: '#A78BFA', fontSize: 12, marginTop: 2 }}>"{transferingScreen.name}"</div>
              </div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>
              ⚠️ L'écran sera retiré de ta session et envoyé au destinataire.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {sessionMembers.map(member => (
                <button
                  key={member.clientId}
                  onClick={() => handleTransfer(transferingScreen, member)}
                  style={{ padding: '11px 16px', borderRadius: 10, border: '1.5px solid rgba(167,139,250,0.3)', backgroundColor: 'rgba(124,58,237,0.15)', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito, sans-serif', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: 'white', flexShrink: 0 }}>
                    {member.nickname[0]?.toUpperCase() || '?'}
                  </div>
                  {member.nickname}
                </button>
              ))}
            </div>
            <button
              onClick={() => setTransferingScreen(null)}
              style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {sessionCode && (
        <div style={{ padding: '6px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setShowBgModal(true)}
            style={{
              width: '100%',
              padding: '7px 0',
              borderRadius: 8,
              border: '1.5px solid rgba(124,58,237,0.5)',
              backgroundColor: 'rgba(124,58,237,0.12)',
              color: '#A78BFA',
              fontSize: 11,
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              transition: 'background-color 0.15s',
            }}
          >
            🎨 Appliquer arrière-plan à…
          </button>
        </div>
      )}

      <div style={{
        padding: '6px 10px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        textAlign: 'center',
        fontFamily: 'Nunito, sans-serif',
      }}>
        Max. 10 écrans recommandé
      </div>

      {showBgModal && (
        <BgApplyModal
          activeScreenId={state.activeScreenId}
          allScreens={state.screens}
          sessionCode={sessionCode}
          myNickname={getClientNickname()}
          onClose={() => setShowBgModal(false)}
        />
      )}
    </div>
  );
}
