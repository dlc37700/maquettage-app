import React, { useState, useRef } from 'react';
import { useProject, useActiveScreen } from '../hooks/useProject';

function ScreenThumbnail({ screen, isActive, onClick, onRename, onDelete, onDuplicate }) {
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

  const bgPreview = screen.backgroundColor || '#FFFFFF';

  return (
    <div
      className="screen-thumb"
      onClick={onClick}
      style={{
        padding: '8px',
        borderRadius: 10,
        backgroundColor: isActive ? 'rgba(109, 40, 217, 0.3)' : 'rgba(255,255,255,0.05)',
        border: isActive ? '2px solid #7C3AED' : '2px solid transparent',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {/* Mini preview */}
      <div style={{
        width: '100%',
        paddingBottom: '216%',
        backgroundColor: bgPreview,
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        {/* Simplified component previews */}
        {screen.components.slice(0, 6).map((comp) => {
          const scaleX = 140 / 390;
          const scaleY = 302 / 844;
          return (
            <div
              key={comp.id}
              style={{
                position: 'absolute',
                left: comp.position.x * scaleX,
                top: comp.position.y * scaleY,
                width: comp.position.width * scaleX,
                height: comp.position.height * scaleY,
                backgroundColor: comp.props?.bgColor || comp.props?.color || '#6C63FF',
                borderRadius: (comp.props?.borderRadius || 0) * scaleX,
                opacity: comp.props?.opacity ?? 1,
              }}
            />
          );
        })}
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

      {/* Actions (hover) */}
      {isActive && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 4,
          marginTop: 6,
        }}>
          <button
            onClick={startEdit}
            title="Renommer"
            style={actionBtnStyle}
          >✏️</button>
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            title="Dupliquer"
            style={actionBtnStyle}
          >📋</button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Supprimer"
            style={{ ...actionBtnStyle, color: '#FCA5A5' }}
          >🗑️</button>
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

export default function ScreenManager() {
  const { state, dispatch } = useProject();

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
            onClick={() => dispatch({ type: 'SET_ACTIVE_SCREEN', id: screen.id })}
            onRename={(name) => dispatch({ type: 'RENAME_SCREEN', id: screen.id, name })}
            onDelete={() => dispatch({ type: 'DELETE_SCREEN', id: screen.id })}
            onDuplicate={() => dispatch({ type: 'DUPLICATE_SCREEN', id: screen.id })}
          />
        ))}
      </div>

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
    </div>
  );
}
