import React, { useEffect, useRef, useState } from 'react';
import { useProject, useActiveScreen } from '../hooks/useProject';
import PhoneFrame from './PhoneFrame';
import ComponentPalette from './ComponentPalette';
import PropertiesPanel from './PropertiesPanel';
import { exportProjectAsJson, importProjectFromJson } from '../utils/exportJson';
import { exportScreenAsPng } from '../utils/exportPng';
import { exportProjectAsHtml } from '../utils/exportHtml';

// ─── helpers ────────────────────────────────────────────────────────────────

function getBg(bgColor, bgGradient) {
  if (bgGradient?.from && bgGradient?.to) {
    return { background: `linear-gradient(${bgGradient.angle ?? 135}deg, ${bgGradient.from}, ${bgGradient.to})` };
  }
  return { backgroundColor: bgColor || '#FFFFFF' };
}

const MINI_W = 54;
const MINI_SCALE = MINI_W / 390;
const MINI_H = Math.round(844 * MINI_SCALE);

function MiniThumb({ screen }) {
  return (
    <div style={{ width: MINI_W, height: MINI_H, borderRadius: 5, overflow: 'hidden', position: 'relative', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 390, height: 844, ...getBg(screen.backgroundColor, screen.backgroundGradient), transform: `scale(${MINI_SCALE})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        {screen.components.map(comp => (
          <div key={comp.id} style={{ position: 'absolute', left: comp.position.x, top: comp.position.y, width: comp.position.width, height: comp.position.height, backgroundColor: comp.props.bgColor || '#E5E7EB', borderRadius: comp.props.borderRadius || 0, opacity: comp.props.opacity ?? 1 }} />
        ))}
      </div>
    </div>
  );
}

// ─── bottom nav button ───────────────────────────────────────────────────────

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer', color: active ? '#A78BFA' : 'rgba(255,255,255,0.45)', transition: 'color 0.15s' }}
    >
      <span style={{ fontSize: 19, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 10, fontFamily: 'Nunito, sans-serif', fontWeight: 700, letterSpacing: 0.2 }}>{label}</span>
      {active && <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#A78BFA', marginTop: -1 }} />}
    </button>
  );
}

// ─── screens sheet ───────────────────────────────────────────────────────────

function ScreensSheet({ onClose }) {
  const { state, dispatch } = useProject();
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const ownCount = state.screens.filter(s => !s._remote).length;

  const commitEdit = (screen) => {
    dispatch({ type: 'RENAME_SCREEN', id: screen.id, name: editName.trim() || screen.name });
    setEditingId(null);
  };

  return (
    <div style={{ backgroundColor: '#13111f', height: '65vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ color: '#A78BFA', fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Mes écrans ({ownCount})
        </div>
        <button
          onClick={() => dispatch({ type: 'ADD_SCREEN' })}
          style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px dashed #7C3AED', backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA', fontSize: 12, fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' }}
        >
          ➕ Ajouter
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {state.screens.map((screen) => {
          const isActive = screen.id === state.activeScreenId;
          const isRemote = !!screen._remote;
          return (
            <div
              key={screen.id}
              onClick={() => { dispatch({ type: 'SET_ACTIVE_SCREEN', id: screen.id }); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, backgroundColor: isRemote ? (isActive ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.07)') : (isActive ? 'rgba(109,40,217,0.3)' : 'rgba(255,255,255,0.05)'), border: `2px solid ${isRemote ? (isActive ? '#10B981' : 'rgba(16,185,129,0.3)') : (isActive ? '#7C3AED' : 'transparent')}`, cursor: 'pointer' }}
            >
              <MiniThumb screen={screen} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {isRemote && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#10B981', marginBottom: 3 }}>{screen._nickname || '👤'}</div>
                )}
                {editingId === screen.id && !isRemote ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => commitEdit(screen)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commitEdit(screen); }}
                    onClick={e => e.stopPropagation()}
                    style={{ width: '100%', fontSize: 14, fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: 'white', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid #7C3AED', borderRadius: 6, padding: '4px 8px', outline: 'none', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {screen.name}
                  </div>
                )}
              </div>
              {!isRemote && (
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setEditingId(screen.id); setEditName(screen.name); }} style={{ background: 'none', border: 'none', fontSize: 17, cursor: 'pointer', padding: 5 }}>✏️</button>
                  <button onClick={() => dispatch({ type: 'DUPLICATE_SCREEN', id: screen.id })} style={{ background: 'none', border: 'none', fontSize: 17, cursor: 'pointer', padding: 5 }}>📋</button>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_SCREEN', id: screen.id })}
                    disabled={ownCount <= 1}
                    style={{ background: 'none', border: 'none', fontSize: 17, cursor: ownCount > 1 ? 'pointer' : 'default', padding: 5, opacity: ownCount <= 1 ? 0.3 : 1 }}
                  >🗑️</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── more sheet ──────────────────────────────────────────────────────────────

function MoreSheet({ onExportPng, onExportHtml, onExportJson, onImportJson, onHelp, onCollabClick, onAdminClick, sessionCode, exporting, onClose }) {
  const { dispatch, state } = useProject();
  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const rows = [
    { icon: '↩️', label: 'Annuler', disabled: !canUndo, onClick: () => { dispatch({ type: 'UNDO' }); onClose(); } },
    { icon: '↪️', label: 'Refaire', disabled: !canRedo, onClick: () => { dispatch({ type: 'REDO' }); onClose(); } },
    null,
    { icon: '🖼️', label: exporting ? 'Export en cours…' : 'Exporter PNG', color: '#A78BFA', disabled: exporting, onClick: () => { onExportPng(); onClose(); } },
    { icon: '</>', label: 'Exporter HTML', color: '#F472B6', onClick: () => { onExportHtml(); onClose(); } },
    { icon: '💾', label: 'Sauvegarder JSON', color: '#34D399', onClick: () => { onExportJson(); onClose(); } },
    { icon: '📂', label: 'Charger un projet', color: '#60A5FA', onClick: () => { onImportJson(); onClose(); } },
    null,
    { icon: '👥', label: sessionCode ? `Session : ${sessionCode}` : 'Collaborer', color: '#A78BFA', onClick: () => { onCollabClick(); onClose(); } },
    { icon: '❓', label: 'Aide', color: '#FCD34D', onClick: () => { onHelp(); onClose(); } },
    { icon: '👨‍🏫', label: 'Espace enseignant', color: 'rgba(255,255,255,0.35)', onClick: () => { onAdminClick(); onClose(); } },
  ];

  return (
    <div style={{ backgroundColor: '#1e1b2e', maxHeight: '65vh', overflowY: 'auto', padding: '12px 14px 20px' }}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, paddingLeft: 2 }}>Plus d'options</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((row, i) =>
          row === null ? (
            <div key={i} style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
          ) : (
            <button
              key={row.label}
              onClick={row.disabled ? undefined : row.onClick}
              disabled={row.disabled}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', cursor: row.disabled ? 'default' : 'pointer', textAlign: 'left', fontFamily: 'Nunito, sans-serif', opacity: row.disabled ? 0.4 : 1 }}
            >
              <span style={{ fontSize: 20, lineHeight: 1, minWidth: 24, textAlign: 'center' }}>{row.icon}</span>
              <span style={{ color: row.color || 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 700 }}>{row.label}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ─── main mobile layout ──────────────────────────────────────────────────────

export default function MobileLayout({ sessionCode, onCollabClick, onHelp, onAdminClick }) {
  const { state, dispatch } = useProject();
  const activeScreen = useActiveScreen();
  const canvasRef = useRef(null);
  const phoneScaleWrapperRef = useRef(null);
  const importRef = useRef(null);

  const [phoneScale, setPhoneScale] = useState(0.65);
  const [activeSheet, setActiveSheet] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const update = () => {
      const availW = window.innerWidth - 24;
      const availH = window.innerHeight - 52 - 56 - 68;
      const scale = Math.min(availW / 430, availH / 932, 1);
      setPhoneScale(Math.max(0.32, scale));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const toggleSheet = (name) => setActiveSheet(prev => prev === name ? null : name);
  const closeSheet = () => setActiveSheet(null);

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
    await exportScreenAsPng(canvasRef.current, activeScreen?.name);
    if (wrapper && prev) {
      Object.assign(wrapper.style, prev);
    }
    setExporting(false);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'Nunito, sans-serif' }}>

      {/* ── Top bar ── */}
      <div style={{ height: 52, backgroundColor: '#1e1b4b', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6, flexShrink: 0, boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>📱</span>
        <span style={{ color: 'white', fontSize: 14, fontWeight: 900, letterSpacing: -0.5, flexShrink: 0 }}>
          Maquet<span style={{ color: '#A78BFA' }}>App</span>
        </span>
        <input
          value={state.projectName}
          onChange={e => dispatch({ type: 'SET_PROJECT_NAME', name: e.target.value })}
          style={{ flex: 1, minWidth: 0, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', padding: '4px 9px', fontSize: 12, fontFamily: 'Nunito, sans-serif', fontWeight: 700, outline: 'none' }}
          placeholder="Nom du projet…"
        />
        {sessionCode && (
          <button
            onClick={onCollabClick}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, border: 'none', backgroundColor: 'rgba(124,58,237,0.35)', color: '#A78BFA', fontSize: 11, fontWeight: 800, cursor: 'pointer', boxShadow: '0 0 0 1.5px #7C3AED', flexShrink: 0 }}
          >
            <span>👥</span>
            <span style={{ fontFamily: 'monospace', letterSpacing: 2, fontSize: 12 }}>{sessionCode}</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34D399', display: 'inline-block' }} />
          </button>
        )}
      </div>

      {/* ── Canvas ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(135deg, #f1f0ff 0%, #e8f4fd 50%, #f0fdf4 100%)', position: 'relative', padding: '8px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #c4b5fd 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.3, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ backgroundColor: '#6C63FF', color: 'white', padding: '3px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'Nunito, sans-serif', boxShadow: '0 2px 8px rgba(108,99,255,0.35)' }}>
              📱 {activeScreen?.name || 'Écran'}
            </div>
            <div style={{ color: '#9CA3AF', fontSize: 10, fontFamily: 'Nunito, sans-serif', backgroundColor: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: 10 }}>
              {Math.round(phoneScale * 100)}%
            </div>
          </div>
          <div style={{ width: 430 * phoneScale, height: 932 * phoneScale, position: 'relative', flexShrink: 0 }}>
            <div ref={phoneScaleWrapperRef} style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${phoneScale})`, transformOrigin: 'top left' }}>
              <PhoneFrame canvasRef={canvasRef} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom sheet backdrop ── */}
      {activeSheet && (
        <div
          onClick={closeSheet}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 200 }}
        />
      )}

      {/* ── Bottom sheet panel ── */}
      {activeSheet && (
        <div style={{
          position: 'fixed', bottom: 56, left: 0, right: 0, zIndex: 201,
          borderRadius: '18px 18px 0 0',
          overflow: 'hidden',
          boxShadow: '0 -6px 32px rgba(0,0,0,0.35)',
        }}>
          {/* drag handle */}
          <div style={{ backgroundColor: activeSheet === 'components' || activeSheet === 'properties' ? '#fff' : '#13111f', padding: '10px 0 0', display: 'flex', justifyContent: 'center', cursor: 'pointer' }} onClick={closeSheet}>
            <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.35)' }} />
          </div>

          {activeSheet === 'screens' && <ScreensSheet onClose={closeSheet} />}

          {activeSheet === 'components' && (
            <div style={{ maxHeight: '65vh', overflowY: 'auto', display: 'flex' }}>
              <ComponentPalette mobile />
            </div>
          )}

          {activeSheet === 'properties' && (
            <div style={{ maxHeight: '65vh', overflowY: 'auto', display: 'flex' }}>
              <PropertiesPanel mobile />
            </div>
          )}

          {activeSheet === 'more' && (
            <MoreSheet
              onExportPng={handleExportPng}
              onExportHtml={() => exportProjectAsHtml(state)}
              onExportJson={() => exportProjectAsJson(state)}
              onImportJson={() => importRef.current?.click()}
              onHelp={onHelp}
              onCollabClick={onCollabClick}
              onAdminClick={onAdminClick}
              sessionCode={sessionCode}
              exporting={exporting}
              onClose={closeSheet}
            />
          )}
        </div>
      )}

      <input ref={importRef} type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />

      {/* ── Bottom nav ── */}
      <div style={{ height: 56, backgroundColor: '#1e1b4b', display: 'flex', alignItems: 'stretch', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', zIndex: 300, position: 'relative' }}>
        <NavBtn icon="📋" label="Écrans" active={activeSheet === 'screens'} onClick={() => toggleSheet('screens')} />
        <NavBtn icon="➕" label="Ajouter" active={activeSheet === 'components'} onClick={() => toggleSheet('components')} />
        <NavBtn icon="⚙️" label="Propriétés" active={activeSheet === 'properties'} onClick={() => toggleSheet('properties')} />
        <NavBtn icon="···" label="Plus" active={activeSheet === 'more'} onClick={() => toggleSheet('more')} />
      </div>
    </div>
  );
}
