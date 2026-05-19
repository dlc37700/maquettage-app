import React, { useRef, useState } from 'react';
import { useProject, useActiveScreen } from '../hooks/useProject';
import { exportProjectAsJson, importProjectFromJson } from '../utils/exportJson';
import { exportScreenAsPng } from '../utils/exportPng';

export default function Toolbar({ canvasRef, phoneScaleWrapperRef, onHelp }) {
  const { state, dispatch } = useProject();
  const screen = useActiveScreen();
  const importRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPng = async () => {
    if (!canvasRef?.current) return;
    setExporting(true);
    const wrapper = phoneScaleWrapperRef?.current;
    const prev = wrapper ? { transform: wrapper.style.transform, position: wrapper.style.position, top: wrapper.style.top, left: wrapper.style.left, zIndex: wrapper.style.zIndex } : null;
    if (wrapper) {
      wrapper.style.transform = 'scale(1)';
      wrapper.style.position = 'fixed';
      wrapper.style.top = '0';
      wrapper.style.left = '0';
      wrapper.style.zIndex = '99999';
    }
    await new Promise(r => setTimeout(r, 80));
    await exportScreenAsPng(canvasRef.current, screen?.name);
    if (wrapper && prev) {
      wrapper.style.transform = prev.transform;
      wrapper.style.position = prev.position;
      wrapper.style.top = prev.top;
      wrapper.style.left = prev.left;
      wrapper.style.zIndex = prev.zIndex;
    }
    setExporting(false);
  };

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
      height: 56,
      backgroundColor: '#1e1b4b',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 10,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <span style={{ fontSize: 22 }}>📱</span>
        <span style={{
          color: 'white', fontSize: 16, fontWeight: 900,
          fontFamily: 'Nunito, sans-serif', letterSpacing: -0.5,
        }}>
          Maquet<span style={{ color: '#A78BFA' }}>App</span>
        </span>
      </div>

      {/* Project name */}
      <div style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 4 }} />
      <input
        value={state.projectName}
        onChange={e => dispatch({ type: 'SET_PROJECT_NAME', name: e.target.value })}
        style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          color: 'white',
          padding: '5px 12px',
          fontSize: 13,
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 700,
          outline: 'none',
          width: 180,
        }}
        placeholder="Nom du projet…"
      />

      <div style={{ flex: 1 }} />

      {/* Undo / Redo */}
      <ToolBtn
        onClick={() => dispatch({ type: 'UNDO' })}
        disabled={!canUndo}
        title="Annuler (Ctrl+Z)"
        emoji="↩️"
        label="Annuler"
      />
      <ToolBtn
        onClick={() => dispatch({ type: 'REDO' })}
        disabled={!canRedo}
        title="Refaire (Ctrl+Y)"
        emoji="↪️"
        label="Refaire"
      />

      <div style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' }} />

      {/* Export PNG */}
      <ToolBtn
        onClick={handleExportPng}
        disabled={exporting}
        title="Exporter en PNG"
        emoji="🖼️"
        label="PNG"
        color="#A78BFA"
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

      {/* Help */}
      <ToolBtn
        onClick={onHelp}
        title="Aide"
        emoji="❓"
        label="Aide"
        color="#FCD34D"
      />
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
        gap: 5,
        padding: '6px 10px',
        borderRadius: 8,
        border: 'none',
        backgroundColor: disabled ? 'transparent' : 'rgba(255,255,255,0.08)',
        color: disabled ? 'rgba(255,255,255,0.25)' : color,
        fontSize: 12,
        fontFamily: 'Nunito, sans-serif',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = disabled ? 'transparent' : 'rgba(255,255,255,0.08)'; }}
    >
      <span style={{ fontSize: 14 }}>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}
