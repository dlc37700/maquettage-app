import React, { useRef } from 'react';
import { useProject } from '../hooks/useProject';
import { exportProjectAsJson, importProjectFromJson } from '../utils/exportJson';
import { exportProjectAsHtml } from '../utils/exportHtml';

export default function Toolbar({ sessionCode, isCreator, onCollabClick, onAdminClick }) {
  const { state, dispatch } = useProject();
  const projectNameLocked = !!(sessionCode && !isCreator);
  const importRef = useRef(null);

  const handleExportJson = () => {
    exportProjectAsJson(state);
  };

  const handleImportJson = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const project = await importProjectFromJson(file);
      dispatch({ type: 'LOAD_PROJECT', project });
    } catch (err) {
      alert(err.message);
    }
    e.target.value = '';
  };

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  return (
    <div style={{
      height: 50,
      backgroundColor: '#1e1b4b',
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px',
      gap: 6,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
        <span style={{ fontSize: 20 }}>📱</span>
        <span style={{
          color: 'white', fontSize: 15, fontWeight: 900,
          fontFamily: 'Nunito, sans-serif', letterSpacing: -0.5,
        }}>
          Maquet<span style={{ color: '#A78BFA' }}>App</span>
        </span>
      </div>

      {/* Project name */}
      <div style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 4 }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          value={state.projectName}
          onChange={e => !projectNameLocked && dispatch({ type: 'SET_PROJECT_NAME', name: e.target.value })}
          readOnly={projectNameLocked}
          title={projectNameLocked ? 'Seul le créateur de la session peut modifier le nom du projet' : undefined}
          style={{
            backgroundColor: projectNameLocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            color: projectNameLocked ? 'rgba(255,255,255,0.5)' : 'white',
            padding: '5px 12px',
            paddingRight: projectNameLocked ? 28 : 12,
            fontSize: 13,
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            outline: 'none',
            width: 130,
            cursor: projectNameLocked ? 'default' : 'text',
          }}
          placeholder="Nom du projet…"
        />
        {projectNameLocked && (
          <span style={{ position: 'absolute', right: 8, fontSize: 13, pointerEvents: 'none' }} title="Seul le créateur peut modifier le nom">🔒</span>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Undo / Redo */}
      <IconBtn onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo} title="Annuler (Ctrl+Z)" emoji="↩️" />
      <IconBtn onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo} title="Refaire (Ctrl+Y)" emoji="↪️" />

      <div style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' }} />

      {/* Export HTML */}
      <ToolBtn
        onClick={() => exportProjectAsHtml(state)}
        title="Exporter en HTML (code réel)"
        emoji="</>"
        label="HTML"
        color="#F472B6"
      />

      {/* Export JSON */}
      <ToolBtn
        onClick={handleExportJson}
        title="Sauvegarder (JSON)"
        emoji="💾"
        label="Sauvegarder"
        color="#34D399"
      />

      {/* Import JSON */}
      <input
        ref={importRef}
        type="file"
        accept=".json"
        onChange={handleImportJson}
        style={{ display: 'none' }}
      />
      <ToolBtn
        onClick={() => importRef.current?.click()}
        title="Charger un projet (JSON)"
        emoji="📂"
        label="Charger"
        color="#60A5FA"
      />

      <div style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' }} />

      {/* Collaboration */}
      {sessionCode ? (
        <button
          onClick={onCollabClick}
          title="Session collaborative active"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 9px', borderRadius: 7, border: 'none',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(108,99,255,0.4))',
            color: '#A78BFA', fontSize: 12, fontFamily: 'Nunito, sans-serif',
            fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 0 0 1.5px #7C3AED',
            animation: 'pulse-border 2s ease-in-out infinite',
          }}
        >
          <span style={{ fontSize: 14 }}>👥</span>
          <span style={{ letterSpacing: 2, fontFamily: 'monospace', fontSize: 13 }}>{sessionCode}</span>
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#34D399', display: 'inline-block', flexShrink: 0 }} />
        </button>
      ) : (
        <ToolBtn
          onClick={onCollabClick}
          title="Travail collaboratif"
          emoji="👥"
          label="Collaborer"
          color="#A78BFA"
        />
      )}

      {/* Admin */}
      {onAdminClick && (
        <IconBtn onClick={onAdminClick} title="Espace enseignant" emoji="👨‍🏫" />
      )}
    </div>
  );
}

function ToolBtn({ onClick, disabled, title, emoji, label, color = 'white' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 8px',
        borderRadius: 7,
        border: 'none',
        backgroundColor: disabled ? 'transparent' : 'rgba(255,255,255,0.08)',
        color: disabled ? 'rgba(255,255,255,0.25)' : color,
        fontSize: 11,
        fontFamily: 'Nunito, sans-serif',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = disabled ? 'transparent' : 'rgba(255,255,255,0.08)'; }}
    >
      <span style={{ fontSize: 13 }}>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

function IconBtn({ onClick, disabled, title, emoji }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '5px 7px', borderRadius: 7, border: 'none',
        backgroundColor: disabled ? 'transparent' : 'rgba(255,255,255,0.08)',
        color: disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)',
        fontSize: 15, cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = disabled ? 'transparent' : 'rgba(255,255,255,0.08)'; }}
    >
      {emoji}
    </button>
  );
}
