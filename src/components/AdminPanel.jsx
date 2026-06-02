import React, { useState, useEffect, useCallback } from 'react';
import { getShapeSvgInner } from '../data/shapes';
import { isFirebaseConfigured } from '../services/firebase';
import {
  getAllSessions, setSessionBlocked, setSessionSchoolName, removeMember, deleteSession,
  getSessionMessages, sendAdminMessage, exportSessionAsJson, exportSessionAsHtml, exportMemberAsHtml,
} from '../services/admin';
import {
  loginTeacher, createTeacher, getAllTeachers, deleteTeacher,
  updateTeacherSchools, updateTeacherPassword, getOrCreateSuperAdminProfile,
} from '../services/teachers';

const SUPERADMIN_LOGIN = 'prof';
const SUPERADMIN_PASSWORD = 'mazari37';
const SESSION_KEY = 'maquetapp-teacher-session';

// ──────────────────────────────────────
// Helpers
// ──────────────────────────────────────

function timeAgo(ts) {
  if (!ts) return 'jamais';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${d}j`;
}

function formatDate(ts) {
  if (!ts) return '?';
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const THUMB_W = 90;
const SCALE = THUMB_W / 390;
const THUMB_H = Math.round(844 * SCALE);

function getBg(bgColor, bgGradient) {
  if (bgGradient) return { background: bgGradient };
  return { backgroundColor: bgColor || '#FFFFFF' };
}

function MiniComp({ comp }) {
  const { type, props = {}, position: pos = {}, zIndex: z = 1 } = comp;
  const base = { position: 'absolute', left: pos.x ?? 0, top: pos.y ?? 0, width: pos.width ?? 40, height: pos.height ?? 20, opacity: props.opacity ?? 1, zIndex: z, boxSizing: 'border-box', overflow: 'hidden' };
  const bgStyle = props.bgGradient?.from && props.bgGradient?.to
    ? { background: `linear-gradient(${props.bgGradient.angle ?? 135}deg,${props.bgGradient.from},${props.bgGradient.to})` }
    : { backgroundColor: props.bgColor || 'transparent' };

  switch (type) {
    case 'text': return (
      <div style={{ ...base, color: props.textColor || '#1F2937', fontSize: props.fontSize || 16, fontWeight: props.fontWeight === 'bold' ? 700 : props.fontWeight === 'semibold' ? 600 : 400, fontStyle: props.fontStyle || 'normal', textAlign: props.textAlign || 'left', display: 'flex', alignItems: props.verticalAlign === 'top' ? 'flex-start' : props.verticalAlign === 'bottom' ? 'flex-end' : 'center', padding: '2px 4px', lineHeight: 1.3, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
        {props.label || ''}
      </div>
    );
    case 'button': return (
      <div style={{ ...base, ...bgStyle, color: props.textColor || 'white', fontSize: props.fontSize || 16, fontWeight: 700, borderRadius: props.borderRadius || 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {props.iconPosition === 'only' && props.emoji ? props.emoji : (props.label || '')}
      </div>
    );
    case 'image': return props.imageData
      ? <img src={props.imageData} alt="" style={{ ...base, borderRadius: props.borderRadius ?? 8, objectFit: props.frameless ? (props.objectFit || 'contain') : (props.objectFit || 'cover'), overflow: props.frameless ? undefined : 'hidden' }} />
      : <div style={{ ...base, backgroundColor: props.frameless ? 'transparent' : '#F3F4F6', border: '1.5px dashed #D1D5DB', borderRadius: props.borderRadius ?? 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🖼️</div>;
    case 'avatar': return props.imageData
      ? <img src={props.imageData} alt="" style={{ ...base, borderRadius: '50%', objectFit: 'cover' }} />
      : <div style={{ ...base, ...bgStyle, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(Math.min(pos.width || 40, pos.height || 40) * 0.5) }}>{props.emoji || '👤'}</div>;
    case 'header': return (
      <div style={{ ...base, ...bgStyle, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
        <span style={{ color: props.textColor || '#1F2937', fontSize: props.fontSize || 18, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.title || ''}</span>
      </div>
    );
    case 'navbar': {
      const items = props.items || [];
      return (
        <div style={{ ...base, ...bgStyle, borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 4px' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1, overflow: 'hidden' }}>
              <div style={{ width: 18, height: 18, borderRadius: 3, backgroundColor: i === 0 ? (props.activeColor || '#6C63FF') : 'rgba(0,0,0,0.12)', flexShrink: 0 }} />
              {item.label && <span style={{ fontSize: 8, color: i === 0 ? (props.activeColor || '#6C63FF') : '#9CA3AF', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', lineHeight: 1 }}>{item.label}</span>}
            </div>
          ))}
        </div>
      );
    }
    case 'card':
    case 'colorblock': return props.backgroundImage
      ? <img src={props.backgroundImage} alt="" style={{ ...base, borderRadius: props.borderRadius || (type === 'card' ? 16 : 0), objectFit: 'cover' }} />
      : <div style={{ ...base, ...bgStyle, borderRadius: props.borderRadius || (type === 'card' ? 16 : 0) }} />;
    case 'input': return (
      <div style={{ ...base, backgroundColor: props.bgColor || '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: props.borderRadius || 8, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
        <span style={{ color: '#9CA3AF', fontSize: props.fontSize || 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.placeholder || props.label || ''}</span>
      </div>
    );
    case 'searchbar': return (
      <div style={{ ...base, backgroundColor: props.bgColor || '#F3F4F6', borderRadius: props.borderRadius ?? 24, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 5, overflow: 'hidden' }}>
        <span style={{ fontSize: Math.min(props.fontSize || 14, 14), flexShrink: 0 }}>🔍</span>
        <span style={{ color: props.textColor || '#9CA3AF', fontSize: Math.min(props.fontSize || 14, 11), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{props.placeholder || 'Rechercher…'}</span>
        {props.showClearBtn && <span style={{ color: props.iconColor || '#9CA3AF', fontSize: 9, flexShrink: 0 }}>✕</span>}
      </div>
    );
    case 'listitem': return (
      <div style={{ ...base, ...bgStyle, borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
        <div style={{ width: 34, height: 34, backgroundColor: '#EDE9FE', borderRadius: 9, flexShrink: 0 }} />
        <span style={{ flex: 1, color: props.textColor || '#1F2937', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{props.label || ''}</span>
      </div>
    );
    case 'badge': return (
      <div style={{ ...base, ...bgStyle, color: props.textColor || 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(Math.min(pos.width || 20, pos.height || 20) * 0.38), fontWeight: 700 }}>
        {props.count ?? 0}
      </div>
    );
    case 'separator': return <hr style={{ ...base, border: 'none', borderTop: `1px solid ${props.color || '#E5E7EB'}`, margin: 0 }} />;
    case 'drawing': {
      const src = props.showAiResult && props.aiImageUrl ? props.aiImageUrl : (props.drawingData || null);
      if (src) return <img src={src} alt="dessin" style={{ ...base, borderRadius: props.borderRadius || 8, objectFit: 'contain', border: `1px solid ${props.borderColor || '#E5E7EB'}`, backgroundColor: props.bgColor || '#FFFFFF' }} />;
      return <div style={{ ...base, backgroundColor: props.bgColor || '#FFFFFF', border: `1px solid ${props.borderColor || '#E5E7EB'}`, borderRadius: props.borderRadius || 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#9CA3AF' }}>🖌️</div>;
    }
    case 'weekcalendar': {
      const hBg = props.headerBgColor || '#6C63FF';
      const hTxt = props.headerTextColor || '#FFFFFF';
      const rlBg = props.rowLabelBgColor || '#F5F3FF';
      const bc = props.borderColor || '#E5E7EB';
      const fs = Math.min(props.fontSize || 11, 8);
      const DAY_LABELS = ['Lu','Ma','Me','Je','Ve','Sa','Di'];
      return (
        <div style={{ ...base, border: `1px solid ${bc}`, borderRadius: props.borderRadius || 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: props.bgColor || '#FFFFFF' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '18px repeat(7,1fr)', flexShrink: 0 }}>
            <div style={{ backgroundColor: hBg, borderRight: `1px solid ${bc}`, borderBottom: `1px solid ${bc}` }} />
            {DAY_LABELS.map(l => <div key={l} style={{ backgroundColor: hBg, color: hTxt, textAlign: 'center', fontSize: fs - 1, fontWeight: 700, padding: '1px 0', borderRight: `1px solid ${bc}`, borderBottom: `1px solid ${bc}` }}>{l}</div>)}
          </div>
          {['Mat.','A-M'].map((rl, ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: '18px repeat(7,1fr)', flex: 1, minHeight: 0 }}>
              <div style={{ backgroundColor: rlBg, fontSize: fs - 2, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${bc}`, borderBottom: ri === 0 ? `1px solid ${bc}` : 'none' }}>{rl}</div>
              {DAY_LABELS.map((_, di) => <div key={di} style={{ backgroundColor: props.cellBgColor || '#FFFFFF', borderRight: di < 6 ? `1px solid ${bc}` : 'none', borderBottom: ri === 0 ? `1px solid ${bc}` : 'none' }} />)}
            </div>
          ))}
        </div>
      );
    }
    case 'shape': {
      const svgInner = getShapeSvgInner(props.shape || 'circle', props.fillColor || '#6C63FF', props.strokeColor || 'transparent', props.strokeWidth ?? 0);
      return <div style={base}><svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" dangerouslySetInnerHTML={{ __html: svgInner }} /></div>;
    }
    default: return <div style={{ ...base, ...bgStyle, borderRadius: props.borderRadius || 0 }} />;
  }
}

function MiniScreen({ screen }) {
  const bgStyle = screen.backgroundImage
    ? { backgroundImage: `url(${screen.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : getBg(screen.backgroundColor, screen.backgroundGradient);
  return (
    <div style={{ width: THUMB_W, height: THUMB_H, borderRadius: 6, overflow: 'hidden', position: 'relative', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', border: '1px solid #E5E7EB' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 390, height: 844, ...bgStyle, transform: `scale(${SCALE})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        {[...(screen.components || [])].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1)).map(comp => (
          <MiniComp key={comp.id} comp={comp} />
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 2, left: 0, right: 0, textAlign: 'center', fontSize: 7, color: 'rgba(0,0,0,0.5)', fontFamily: 'Nunito, sans-serif', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 2px', backgroundColor: 'rgba(255,255,255,0.7)' }}>{screen.name}</div>
    </div>
  );
}

function StatusBadge({ session }) {
  if (session.blocked) return <span style={{ backgroundColor: '#FEE2E2', color: '#EF4444', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>🔴 Bloquée</span>;
  if (session.isActive) return <span style={{ backgroundColor: '#D1FAE5', color: '#10B981', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>🟢 Active</span>;
  return <span style={{ backgroundColor: '#F3F4F6', color: '#6B7280', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>⚫ Inactive</span>;
}

const btn = (extra = {}) => ({
  border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
  fontWeight: 700, fontSize: 12, padding: '5px 10px', ...extra,
});

function SessionCard({ session, onSelect, onBlock, onDelete }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${session.blocked ? '#FCA5A5' : '#E5E7EB'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 22, color: session.blocked ? '#EF4444' : session.isActive ? '#7C3AED' : '#9CA3AF', letterSpacing: 3 }}>{session.code}</span>
        <StatusBadge session={session} />
        {session.className && <span style={{ backgroundColor: '#EDE9FE', color: '#6D28D9', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 800 }}>🏫 {session.className}</span>}
      </div>
      {session.projectName && <p style={{ color: '#7C3AED', fontSize: 12, fontWeight: 700, margin: '0 0 4px' }}>📁 {session.projectName}</p>}
      <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 4px' }}>Créée le {formatDate(session.createdAt)} par <strong>{session.createdBy}</strong></p>
      <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 8px' }}>Dernière activité : {timeAgo(session.lastActivity)}</p>
      {session.members.length > 0 && (
        <p style={{ color: '#4B5563', fontSize: 12, margin: '0 0 12px' }}>
          👤 {session.members.map(m => m.nickname).join(', ')}
        </p>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => onSelect(session)} style={{ ...btn({ backgroundColor: 'rgba(108,99,255,0.1)', color: '#6C63FF' }) }}>👁️ Détails</button>
        <button onClick={(e) => onBlock(session, e)} style={{ ...btn({ backgroundColor: session.blocked ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: session.blocked ? '#10B981' : '#EF4444' }) }}>
          {session.blocked ? '🔓 Débloquer' : '🔒 Bloquer'}
        </button>
        <button onClick={(e) => onDelete(session, e)} style={{ ...btn({ backgroundColor: 'rgba(239,68,68,0.08)', color: '#DC2626', border: '1px solid rgba(239,68,68,0.2)' }) }}>🗑️ Supprimer</button>
      </div>
    </div>
  );
}

function SessionList({ sessions, onSelect, onBlock, onDelete }) {
  const [openGroups, setOpenGroups] = useState({});
  const [openClasses, setOpenClasses] = useState({});

  if (sessions.length === 0) {
    return <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 40 }}>Aucune session trouvée.</div>;
  }

  // Group by école
  const groupMap = {};
  const groupOrder = [];
  for (const s of sessions) {
    const key = (s.schoolName || '').trim() || 'Sans établissement';
    if (!groupMap[key]) { groupMap[key] = []; groupOrder.push(key); }
    groupMap[key].push(s);
  }

  // Default: all closed
  const isOpen = (key) => (key in openGroups ? openGroups[key] : false);
  const toggle = (key) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const isClassOpen = (key) => (key in openClasses ? openClasses[key] : false);
  const toggleClass = (key) => setOpenClasses(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {groupOrder.map(groupKey => {
        const groupSessions = groupMap[groupKey];
        const activeCount = groupSessions.filter(s => s.isActive).length;
        const open = isOpen(groupKey);

        // Sub-group by className within this école
        const classMap = {};
        const classOrder = [];
        for (const s of groupSessions) {
          const cls = (s.className || '').trim().toUpperCase() || 'SANS CLASSE';
          if (!classMap[cls]) { classMap[cls] = []; classOrder.push(cls); }
          classMap[cls].push(s);
        }
        classOrder.sort((a, b) => a === 'SANS CLASSE' ? 1 : b === 'SANS CLASSE' ? -1 : a.localeCompare(b));

        return (
          <div key={groupKey} style={{ borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <button
              onClick={() => toggle(groupKey)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', backgroundColor: open ? '#F5F3FF' : 'white', border: 'none', borderBottom: open ? '1px solid #E5E7EB' : 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', transition: 'background 0.15s' }}
            >
              <span style={{ fontSize: 13, display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#7C3AED' }}>▶</span>
              <span style={{ fontWeight: 900, fontSize: 14, color: '#1F2937', flex: 1, textAlign: 'left' }}>🏫 {groupKey}</span>
              <span style={{ backgroundColor: '#EDE9FE', color: '#6D28D9', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{groupSessions.length} session{groupSessions.length > 1 ? 's' : ''}</span>
              {activeCount > 0 && <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>🟢 {activeCount} active{activeCount > 1 ? 's' : ''}</span>}
            </button>
            {open && (
              <div style={{ padding: '8px 10px 10px', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {classOrder.map(cls => {
                  const clsKey = `${groupKey}::${cls}`;
                  const clsOpen = isClassOpen(clsKey);
                  const clsSessions = classMap[cls];
                  const clsActive = clsSessions.filter(s => s.isActive).length;
                  return (
                    <div key={cls} style={{ borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                      <button
                        onClick={() => toggleClass(clsKey)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', backgroundColor: clsOpen ? '#EDE9FE' : '#F9FAFB', border: 'none', borderBottom: clsOpen ? '1px solid #E5E7EB' : 'none', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', transition: 'background 0.15s' }}
                      >
                        <span style={{ fontSize: 11, display: 'inline-block', transform: clsOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#A78BFA' }}>▶</span>
                        <span style={{ fontWeight: 800, fontSize: 13, color: '#4C1D95', flex: 1, textAlign: 'left' }}>📚 {cls}</span>
                        <span style={{ backgroundColor: '#F3F4F6', color: '#6B7280', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{clsSessions.length} session{clsSessions.length > 1 ? 's' : ''}</span>
                        {clsActive > 0 && <span style={{ backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>🟢 {clsActive}</span>}
                      </button>
                      {clsOpen && (
                        <div style={{ padding: 10, backgroundColor: 'white', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 8 }}>
                          {clsSessions.map(session => (
                            <SessionCard key={session.code} session={session} onSelect={onSelect} onBlock={onBlock} onDelete={onDelete} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────
// Session Detail View (shared)
// ──────────────────────────────────────

function SessionDetail({ session, sessions, onBack, onClose, onRefreshSessions }) {
  const [detailTab, setDetailTab] = useState('members');
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [adminMsgText, setAdminMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [editingSchool, setEditingSchool] = useState(false);
  const [schoolInput, setSchoolInput] = useState('');
  const [savingSchool, setSavingSchool] = useState(false);

  const currentSession = sessions.find(s => s.code === session.code) || session;

  // Unique school names from all sessions for datalist autocomplete
  const knownSchools = [...new Set(sessions.map(s => s.schoolName).filter(Boolean))].sort();

  const handleEditSchool = () => {
    setSchoolInput(currentSession.schoolName || '');
    setEditingSchool(true);
  };

  const handleSaveSchool = async () => {
    setSavingSchool(true);
    await setSessionSchoolName(currentSession.code, schoolInput.trim());
    await onRefreshSessions();
    setSavingSchool(false);
    setEditingSchool(false);
  };

  const handleBlock = async () => {
    await setSessionBlocked(currentSession.code, !currentSession.blocked);
    await onRefreshSessions();
  };

  const handleRemoveMember = async (code, clientId) => {
    if (!window.confirm('Retirer ce membre de la session ?')) return;
    await removeMember(code, clientId);
    await onRefreshSessions();
  };

  const handleDeleteSession = async () => {
    if (!window.confirm(`Supprimer définitivement la session ${currentSession.code} et toutes ses données ?`)) return;
    await deleteSession(currentSession.code);
    await onRefreshSessions();
    onBack();
  };

  const handleLoadMessages = async (code) => {
    setMessagesLoading(true);
    const msgs = await getSessionMessages(code);
    setMessages(msgs);
    setMessagesLoading(false);
  };

  const handleSendAdminMessage = async (code) => {
    if (!adminMsgText.trim()) return;
    setSendingMsg(true);
    await sendAdminMessage(code, adminMsgText);
    setAdminMsgText('');
    const msgs = await getSessionMessages(code);
    setMessages(msgs);
    setSendingMsg(false);
  };

  const copyCode = (code) => navigator.clipboard.writeText(code).catch(() => {});

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 9500, fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1e1b2e', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ ...btn({ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 13 }) }}>← Retour</button>
        <span style={{ color: 'white', fontWeight: 900, fontSize: 18, fontFamily: 'monospace', letterSpacing: 4 }}>{currentSession.code}</span>
        <StatusBadge session={currentSession} />
        {currentSession.className && <span style={{ backgroundColor: 'rgba(167,139,250,0.25)', color: '#C4B5FD', borderRadius: 6, padding: '3px 10px', fontSize: 13, fontWeight: 800 }}>📚 {currentSession.className}</span>}
        {/* Établissement éditable */}
        {editingSchool ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
            <input
              list="known-schools-list"
              value={schoolInput}
              onChange={e => setSchoolInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveSchool(); if (e.key === 'Escape') setEditingSchool(false); }}
              autoFocus
              placeholder="Nom de l'établissement…"
              style={{ padding: '5px 10px', borderRadius: 7, border: '1.5px solid #7C3AED', fontSize: 13, fontFamily: 'Nunito, sans-serif', outline: 'none', minWidth: 200 }}
            />
            <datalist id="known-schools-list">
              {knownSchools.map(s => <option key={s} value={s} />)}
            </datalist>
            <button
              onClick={handleSaveSchool}
              disabled={savingSchool}
              style={{ ...btn({ backgroundColor: '#10B981', color: 'white', fontSize: 12 }) }}
            >
              {savingSchool ? '⏳' : '✅ Sauver'}
            </button>
            <button onClick={() => setEditingSchool(false)} style={{ ...btn({ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 12 }) }}>✕</button>
          </div>
        ) : (
          <button
            onClick={handleEditSchool}
            title="Modifier l'établissement"
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px dashed rgba(255,255,255,0.3)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}
          >
            🏫 {currentSession.schoolName || 'Sans établissement'} <span style={{ fontSize: 11, opacity: 0.7 }}>✏️</span>
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={handleBlock} style={{ ...btn({ backgroundColor: currentSession.blocked ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: currentSession.blocked ? '#10B981' : '#EF4444' }) }}>
          {currentSession.blocked ? '🔓 Débloquer' : '🔒 Bloquer'}
        </button>
        <button onClick={() => exportSessionAsHtml(currentSession)} style={{ ...btn({ backgroundColor: 'rgba(108,99,255,0.2)', color: '#6C63FF' }) }}>📥 Tout HTML</button>
        <button onClick={() => exportSessionAsJson(currentSession)} style={{ ...btn({ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }) }}>📥 Tout JSON</button>
        <button onClick={handleDeleteSession} style={{ ...btn({ backgroundColor: 'rgba(239,68,68,0.25)', color: '#FCA5A5' }) }}>🗑️ Supprimer</button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', marginLeft: 4 }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 0, flexShrink: 0 }}>
        {[
          { id: 'members', label: `👤 Membres (${currentSession.members.length})` },
          { id: 'chat', label: '💬 Messagerie' },
        ].map(tab => (
          <button key={tab.id} onClick={() => {
            setDetailTab(tab.id);
            if (tab.id === 'chat' && messages.length === 0) handleLoadMessages(currentSession.code);
          }} style={{ padding: '10px 20px', border: 'none', borderBottom: `3px solid ${detailTab === tab.id ? '#7C3AED' : 'transparent'}`, backgroundColor: 'transparent', color: detailTab === tab.id ? '#7C3AED' : '#6B7280', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', transition: 'all 0.15s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {detailTab === 'members' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, backgroundColor: '#F9FAFB' }}>
          {currentSession.members.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 40 }}>Aucun membre dans cette session.</div>
          )}
          {currentSession.members.map(member => (
            <div key={member.clientId} style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: member.online ? '#10B981' : '#D1D5DB', flexShrink: 0 }} title={member.online ? 'En ligne' : 'Hors ligne'} />
                <span style={{ fontWeight: 900, fontSize: 15, color: '#1F2937' }}>👤 {member.nickname}</span>
                <span style={{ color: '#9CA3AF', fontSize: 12 }}>{timeAgo(member.updatedAt)}</span>
                <span style={{ color: '#6B7280', fontSize: 12, marginLeft: 4 }}>{member.screens.length} écran{member.screens.length !== 1 ? 's' : ''}</span>
                {member.pin && <span style={{ color: '#6B7280', fontSize: 12, marginLeft: 4 }}>🔑 PIN: <code style={{ backgroundColor: 'rgba(167,139,250,0.15)', color: '#A78BFA', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontFamily: 'monospace', fontWeight: 900, letterSpacing: 2 }}>{member.pin}</code></span>}
                <div style={{ flex: 1 }} />
                <button onClick={() => exportMemberAsHtml(member, currentSession.projectName)} style={{ ...btn({ backgroundColor: 'rgba(108,99,255,0.1)', color: '#6C63FF' }) }}>📥 Télécharger HTML</button>
                <button onClick={() => handleRemoveMember(currentSession.code, member.clientId)} style={{ ...btn({ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }) }}>🚫 Retirer</button>
              </div>
              {member.screens.length > 0 && (
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {member.screens.map((screen, i) => (
                    <MiniScreen key={screen.id || i} screen={screen} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chat tab */}
      {detailTab === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#F9FAFB' }}>
          <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid #E5E7EB', backgroundColor: 'white', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Message du professeur</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={adminMsgText}
                onChange={e => setAdminMsgText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendAdminMessage(currentSession.code)}
                placeholder="Écrivez un message visible de tous les élèves…"
                disabled={sendingMsg}
                style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1.5px solid #DDD6FE', fontSize: 13, fontFamily: 'Nunito, sans-serif', outline: 'none', color: '#1F2937', backgroundColor: '#FAFAFA' }}
              />
              <button
                onClick={() => handleSendAdminMessage(currentSession.code)}
                disabled={sendingMsg || !adminMsgText.trim()}
                style={{ ...btn({ backgroundColor: sendingMsg || !adminMsgText.trim() ? '#E5E7EB' : '#7C3AED', color: sendingMsg || !adminMsgText.trim() ? '#9CA3AF' : 'white', padding: '9px 16px' }), flexShrink: 0 }}
              >
                {sendingMsg ? '⏳' : '📨 Envoyer'}
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ color: '#374151', fontSize: 13, fontWeight: 700 }}>Historique de la messagerie</span>
              <button onClick={() => handleLoadMessages(currentSession.code)} style={{ ...btn({ backgroundColor: '#F3F4F6', color: '#6B7280' }) }}>🔄 Actualiser</button>
            </div>
            {messagesLoading ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 40 }}>⏳ Chargement…</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 40 }}>Aucun message dans cette session.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ backgroundColor: msg.isAdmin ? '#EDE9FE' : 'white', borderRadius: 10, padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', border: `1px solid ${msg.isAdmin ? '#C4B5FD' : '#E5E7EB'}` }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: msg.isAdmin ? '#7C3AED' : '#374151' }}>{msg.nickname || 'Anonyme'}</span>
                      {msg.isAdmin && <span style={{ fontSize: 10, backgroundColor: '#7C3AED', color: 'white', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>PROF</span>}
                      <span style={{ color: '#9CA3AF', fontSize: 11 }}>{formatDate(msg.at)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{msg.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────
// Sessions Dashboard (shared logic)
// ──────────────────────────────────────

function SessionsDashboard({ teacherCode, includeOrphans = false, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadSessions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const data = await getAllSessions(teacherCode, includeOrphans);
    setSessions(data);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [teacherCode]);

  useEffect(() => {
    if (isFirebaseConfigured) loadSessions();
  }, [loadSessions]);

  const handleBlock = async (session, e) => {
    e?.stopPropagation();
    await setSessionBlocked(session.code, !session.blocked);
    await loadSessions(true);
  };

  const handleDeleteSession = async (session, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Supprimer définitivement la session ${session.code} et toutes ses données ?`)) return;
    await deleteSession(session.code);
    const updated = await getAllSessions(teacherCode, includeOrphans);
    setSessions(updated);
    if (selected?.code === session.code) setSelected(null);
  };

  const copyCode = (code, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(code).catch(() => {});
  };

  if (selected) {
    return (
      <SessionDetail
        session={selected}
        sessions={sessions}
        onBack={() => setSelected(null)}
        onClose={onClose}
        onRefreshSessions={() => loadSessions(true)}
      />
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20, backgroundColor: '#F9FAFB' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => loadSessions(true)} disabled={refreshing} style={{ ...btn({ backgroundColor: '#F3F4F6', color: '#6B7280' }) }}>
          {refreshing ? '⏳' : '🔄'} Actualiser
        </button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 40 }}>⏳ Chargement des sessions…</div>
      ) : (
        <SessionList sessions={sessions} onSelect={setSelected} onBlock={handleBlock} onDelete={handleDeleteSession} />
      )}
    </div>
  );
}

// ──────────────────────────────────────
// Super-Admin: Teachers Management tab
// ──────────────────────────────────────

function TeachersManagement({ onClose }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allSessions, setAllSessions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createLogin, setCreateLogin] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createDisplay, setCreateDisplay] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(null); // { schoolCode }
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [t, s] = await Promise.all([getAllTeachers(), getAllSessions(null)]);
    setTeachers(t);
    setAllSessions(s);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sessionCountForTeacher = (schoolCode) =>
    allSessions.filter(s => s.teacherCode === schoolCode).length;

  const handleDelete = async (teacher) => {
    if (!window.confirm(`Supprimer le compte de ${teacher.displayName} (${teacher.login}) ?`)) return;
    await deleteTeacher(teacher.id);
    await load();
  };

  const handleCreate = async () => {
    setCreateError('');
    if (!createLogin.trim() || !createPassword.trim() || !createDisplay.trim()) {
      setCreateError('Tous les champs sont obligatoires.');
      return;
    }
    setCreating(true);
    const result = await createTeacher({ login: createLogin, password: createPassword, displayName: createDisplay });
    setCreating(false);
    if (result.error) { setCreateError(result.error); return; }
    setCreateSuccess({ schoolCode: result.schoolCode });
    setCreateLogin('');
    setCreatePassword('');
    setCreateDisplay('');
    await load();
  };

  if (loading) return <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 40 }}>⏳ Chargement…</div>;

  return (
    <div style={{ padding: 20 }}>
      {/* Create account */}
      <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showCreate ? 16 : 0 }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#374151' }}>➕ Créer un compte enseignant</span>
          <button onClick={() => { setShowCreate(v => !v); setCreateError(''); setCreateSuccess(null); }}
            style={{ ...btn({ backgroundColor: showCreate ? '#F3F4F6' : '#7C3AED', color: showCreate ? '#6B7280' : 'white', fontSize: 12, padding: '6px 14px' }) }}>
            {showCreate ? 'Annuler' : '+ Créer'}
          </button>
        </div>
        {showCreate && (
          <div>
            {createSuccess ? (
              <div style={{ backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                <p style={{ color: '#065F46', fontWeight: 800, fontSize: 14, margin: '0 0 6px' }}>✅ Compte créé avec succès !</p>
                <p style={{ color: '#065F46', fontSize: 13, margin: '0 0 4px' }}>Code établissement :</p>
                <div style={{ backgroundColor: '#ECFDF5', border: '2px solid #10B981', borderRadius: 8, padding: '10px 16px', textAlign: 'center' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 900, color: '#065F46', letterSpacing: 4 }}>{createSuccess.schoolCode}</span>
                </div>
                <p style={{ color: '#047857', fontSize: 12, margin: '8px 0 0' }}>⚠️ Donnez ce code à vos élèves pour qu'ils puissent rejoindre vos sessions !</p>
                <button onClick={() => { setCreateSuccess(null); setShowCreate(false); }}
                  style={{ ...btn({ backgroundColor: '#10B981', color: 'white', fontSize: 13, padding: '8px 16px', marginTop: 12 }) }}>
                  Fermer
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={createDisplay} onChange={e => setCreateDisplay(e.target.value)} placeholder="Nom affiché (ex : M. Dupont)" style={inputStyle} />
                <input value={createLogin} onChange={e => setCreateLogin(e.target.value.toLowerCase())} placeholder="Identifiant (login)" style={inputStyle} />
                <input type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} placeholder="Mot de passe" style={inputStyle} />
                {createError && <p style={{ color: '#EF4444', fontSize: 12, margin: 0 }}>{createError}</p>}
                <button onClick={handleCreate} disabled={creating}
                  style={{ ...btn({ backgroundColor: '#7C3AED', color: 'white', fontSize: 13, padding: '9px 0', width: '100%', borderRadius: 8 }) }}>
                  {creating ? '⏳ Création…' : '🚀 Créer le compte'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Teachers list */}
      <h3 style={{ fontSize: 14, fontWeight: 800, color: '#374151', margin: '0 0 12px' }}>Enseignants ({teachers.length})</h3>
      {teachers.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 20 }}>Aucun enseignant créé.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {teachers.map(teacher => (
            <div key={teacher.id} style={{ backgroundColor: 'white', borderRadius: 12, padding: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1F2937' }}>{teacher.displayName}</div>
                <div style={{ color: '#6B7280', fontSize: 12 }}>@{teacher.login}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 14, color: '#7C3AED', letterSpacing: 2 }}>{teacher.schoolCode}</div>
                <div style={{ color: '#9CA3AF', fontSize: 11 }}>Code établissement</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#374151' }}>{sessionCountForTeacher(teacher.schoolCode)}</div>
                <div style={{ color: '#9CA3AF', fontSize: 11 }}>sessions</div>
              </div>
              <div style={{ color: '#9CA3AF', fontSize: 11 }}>
                {Array.isArray(teacher.schools) && teacher.schools.length > 0
                  ? teacher.schools.join(', ')
                  : <em>Aucun établissement</em>}
              </div>
              <button onClick={() => handleDelete(teacher)} style={{ ...btn({ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }) }}>🗑️ Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────
// Teacher: My School tab
// ──────────────────────────────────────

function MySchoolTab({ teacherSession, onSessionUpdate, hidePasswordChange = false }) {
  const [schools, setSchools] = useState(() => Array.isArray(teacherSession.schools) ? teacherSession.schools : []);
  const [newSchool, setNewSchool] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(teacherSession.schoolCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAddSchool = async () => {
    const trimmed = newSchool.trim();
    if (!trimmed || schools.includes(trimmed)) return;
    const updated = [...schools, trimmed];
    setSchools(updated);
    setNewSchool('');
    setSaving(true);
    await updateTeacherSchools(teacherSession.teacherId, updated);
    setSaving(false);
    setSaveMsg('Établissement ajouté !');
    setTimeout(() => setSaveMsg(''), 2000);
    onSessionUpdate({ ...teacherSession, schools: updated });
  };

  const handleRemoveSchool = async (school) => {
    const updated = schools.filter(s => s !== school);
    setSchools(updated);
    setSaving(true);
    await updateTeacherSchools(teacherSession.teacherId, updated);
    setSaving(false);
    setSaveMsg('Établissement supprimé !');
    setTimeout(() => setSaveMsg(''), 2000);
    onSessionUpdate({ ...teacherSession, schools: updated });
  };

  const handleChangePassword = async () => {
    setPwdError('');
    setPwdSuccess('');
    if (!oldPwd || !newPwd) { setPwdError('Remplissez tous les champs.'); return; }
    if (oldPwd !== teacherSession.password) { setPwdError('Ancien mot de passe incorrect.'); return; }
    if (newPwd.length < 4) { setPwdError('Le nouveau mot de passe doit faire au moins 4 caractères.'); return; }
    setSavingPwd(true);
    await updateTeacherPassword(teacherSession.teacherId, newPwd);
    setSavingPwd(false);
    setPwdSuccess('Mot de passe modifié !');
    setOldPwd('');
    setNewPwd('');
    onSessionUpdate({ ...teacherSession, password: newPwd });
    // Update sessionStorage
    const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (stored) sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...stored, password: newPwd }));
  };

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* School code */}
      <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: '#374151' }}>🔑 Votre code établissement</h3>
        <div style={{ backgroundColor: '#F5F3FF', border: '2px solid #7C3AED', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 900, color: '#5B21B6', letterSpacing: 4 }}>{teacherSession.schoolCode}</span>
          <button onClick={handleCopyCode} style={{ ...btn({ backgroundColor: copied ? '#D1FAE5' : '#7C3AED', color: copied ? '#065F46' : 'white', fontSize: 13, padding: '8px 16px' }) }}>
            {copied ? '✅ Copié !' : '📋 Copier'}
          </button>
        </div>
        <p style={{ color: '#6B7280', fontSize: 12, margin: '10px 0 0' }}>Donnez ce code à vos élèves lors de la création de session.</p>
      </div>

      {/* Schools */}
      <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: '#374151' }}>🏛️ Mes établissements déclarés</h3>
        {schools.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 12px' }}>Aucun établissement déclaré.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {schools.map(school => (
              <div key={school} style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#F9FAFB', borderRadius: 8, padding: '8px 12px', border: '1px solid #E5E7EB' }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151' }}>{school}</span>
                <button onClick={() => handleRemoveSchool(school)} style={{ ...btn({ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '3px 8px' }) }}>✕</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newSchool}
            onChange={e => setNewSchool(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddSchool()}
            placeholder="Nom de l'établissement…"
            maxLength={60}
            style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
          />
          <button onClick={handleAddSchool} disabled={saving || !newSchool.trim()}
            style={{ ...btn({ backgroundColor: !newSchool.trim() ? '#F3F4F6' : '#7C3AED', color: !newSchool.trim() ? '#9CA3AF' : 'white', padding: '8px 14px' }) }}>
            ➕ Ajouter
          </button>
        </div>
        {saveMsg && <p style={{ color: '#10B981', fontSize: 12, margin: '8px 0 0', fontWeight: 700 }}>✅ {saveMsg}</p>}
      </div>

      {/* Change password */}
      {!hidePasswordChange && (
        <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: '#374151' }}>🔒 Changer mon mot de passe</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="Ancien mot de passe" style={inputStyle} />
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Nouveau mot de passe" style={inputStyle} />
            {pwdError && <p style={{ color: '#EF4444', fontSize: 12, margin: 0 }}>{pwdError}</p>}
            {pwdSuccess && <p style={{ color: '#10B981', fontSize: 12, margin: 0, fontWeight: 700 }}>✅ {pwdSuccess}</p>}
            <button onClick={handleChangePassword} disabled={savingPwd}
              style={{ ...btn({ backgroundColor: '#7C3AED', color: 'white', fontSize: 13, padding: '9px 0', width: '100%', borderRadius: 8 }) }}>
              {savingPwd ? '⏳ Enregistrement…' : '💾 Changer le mot de passe'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────
// Shared input style
// ──────────────────────────────────────

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1.5px solid #DDD6FE',
  fontSize: 13,
  fontFamily: 'Nunito, sans-serif',
  outline: 'none',
  color: '#1F2937',
  backgroundColor: '#FAFAFA',
  boxSizing: 'border-box',
};

// ──────────────────────────────────────
// Main AdminPanel
// ──────────────────────────────────────

export default function AdminPanel({ onClose }) {
  const [authSession, setAuthSession] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch { return null; }
  });
  const [screen, setScreen] = useState('login'); // 'login' | 'create'
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'admin' | 'school'

  // Create account state
  const [createDisplay, setCreateDisplay] = useState('');
  const [createLogin, setCreateLogin] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createConfirm, setCreateConfirm] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdInfo, setCreatedInfo] = useState(null);

  const handleLogin = async () => {
    setLoginError('');
    setLoggingIn(true);
    if (loginInput.trim() === SUPERADMIN_LOGIN && passwordInput === SUPERADMIN_PASSWORD) {
      const profile = await getOrCreateSuperAdminProfile();
      const sess = {
        role: 'superadmin',
        teacherId: 'superadmin',
        schoolCode: profile?.schoolCode || 'ENS-PROF',
        login: SUPERADMIN_LOGIN,
        displayName: 'Super Admin',
        schools: profile?.schools || [],
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
      setAuthSession(sess);
      setActiveTab('sessions');
      setLoggingIn(false);
      return;
    }
    const teacher = await loginTeacher(loginInput, passwordInput);
    setLoggingIn(false);
    if (!teacher) { setLoginError('Identifiants incorrects.'); return; }
    const sess = {
      role: 'teacher',
      teacherId: teacher.id,
      schoolCode: teacher.schoolCode,
      login: teacher.login,
      displayName: teacher.displayName,
      password: teacher.password,
      schools: teacher.schools || [],
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    setAuthSession(sess);
    setActiveTab('sessions');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthSession(null);
    setScreen('login');
    setLoginInput('');
    setPasswordInput('');
  };

  const handleCreateAccount = async () => {
    setCreateError('');
    if (!createDisplay.trim() || !createLogin.trim() || !createPassword.trim()) {
      setCreateError('Tous les champs sont obligatoires.');
      return;
    }
    if (createPassword !== createConfirm) {
      setCreateError('Les mots de passe ne correspondent pas.');
      return;
    }
    setCreating(true);
    const result = await createTeacher({ login: createLogin, password: createPassword, displayName: createDisplay });
    setCreating(false);
    if (result.error) { setCreateError(result.error); return; }
    setCreatedInfo({ schoolCode: result.schoolCode, teacherId: result.id, login: createLogin.trim().toLowerCase(), displayName: createDisplay.trim(), password: createPassword });
  };

  const handleContinueAfterCreate = () => {
    if (!createdInfo) return;
    const sess = {
      role: 'teacher',
      teacherId: createdInfo.teacherId,
      schoolCode: createdInfo.schoolCode,
      login: createdInfo.login,
      displayName: createdInfo.displayName,
      password: createdInfo.password,
      schools: [],
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sess));
    setAuthSession(sess);
    setActiveTab('sessions');
    setScreen('login');
    setCreatedInfo(null);
  };

  // ── Login screen ──
  if (!authSession) {
    if (screen === 'create') {
      return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9500, fontFamily: 'Nunito, sans-serif' }}>
          <div style={{ backgroundColor: '#1e1b2e', borderRadius: 16, padding: 32, width: 400, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid rgba(167,139,250,0.2)', position: 'relative' }}>
            <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>👨‍🏫</div>
              <h2 style={{ color: 'white', margin: 0, fontSize: 18, fontWeight: 900 }}>Créer un compte enseignant</h2>
            </div>

            {createdInfo ? (
              <div>
                <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: 20, marginBottom: 16, textAlign: 'center' }}>
                  <p style={{ color: '#34D399', fontWeight: 800, fontSize: 14, margin: '0 0 8px' }}>✅ Compte créé avec succès !</p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '0 0 12px' }}>Votre code établissement :</p>
                  <div style={{ backgroundColor: 'rgba(124,58,237,0.2)', border: '2px solid #7C3AED', borderRadius: 10, padding: '14px 20px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 900, color: '#A78BFA', letterSpacing: 6 }}>{createdInfo.schoolCode}</span>
                  </div>
                  <p style={{ color: '#FCD34D', fontSize: 12, margin: '10px 0 0', fontWeight: 700 }}>⚠️ Donnez ce code à vos élèves !</p>
                </div>
                <button onClick={handleContinueAfterCreate}
                  style={{ ...btn({ backgroundColor: '#7C3AED', color: 'white', fontSize: 14, padding: '11px 0', width: '100%', borderRadius: 10 }) }}>
                  Continuer vers mon espace →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={createDisplay} onChange={e => setCreateDisplay(e.target.value)} placeholder="Nom affiché (ex : M. Dupont)" style={{ ...inputStyle, backgroundColor: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(167,139,250,0.3)', color: 'white' }} />
                <input value={createLogin} onChange={e => setCreateLogin(e.target.value.toLowerCase())} placeholder="Identifiant (login)" style={{ ...inputStyle, backgroundColor: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(167,139,250,0.3)', color: 'white' }} />
                <input type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} placeholder="Mot de passe" style={{ ...inputStyle, backgroundColor: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(167,139,250,0.3)', color: 'white' }} />
                <input type="password" value={createConfirm} onChange={e => setCreateConfirm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateAccount()} placeholder="Confirmer le mot de passe" style={{ ...inputStyle, backgroundColor: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(167,139,250,0.3)', color: 'white' }} />
                {createError && <p style={{ color: '#FCA5A5', fontSize: 12, margin: 0 }}>{createError}</p>}
                <button onClick={handleCreateAccount} disabled={creating}
                  style={{ ...btn({ backgroundColor: '#7C3AED', color: 'white', fontSize: 14, padding: '11px 0', width: '100%', borderRadius: 10, marginTop: 4 }) }}>
                  {creating ? '⏳ Création…' : '🚀 Créer mon compte'}
                </button>
                <button onClick={() => setScreen('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Nunito, sans-serif', textAlign: 'center', padding: '4px' }}>
                  ← Retour à la connexion
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Login form
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9500, fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ backgroundColor: '#1e1b2e', borderRadius: 16, padding: 32, width: 360, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid rgba(167,139,250,0.2)', textAlign: 'center', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer' }}>✕</button>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍🏫</div>
          <h2 style={{ color: 'white', margin: '0 0 20px', fontSize: 20, fontWeight: 900 }}>Espace Enseignant</h2>
          <input
            value={loginInput}
            onChange={e => { setLoginInput(e.target.value); setLoginError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Identifiant"
            autoFocus
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${loginError ? '#EF4444' : 'rgba(167,139,250,0.4)'}`, backgroundColor: 'rgba(167,139,250,0.08)', color: 'white', fontSize: 15, fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
          />
          <input
            type="password"
            value={passwordInput}
            onChange={e => { setPasswordInput(e.target.value); setLoginError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Mot de passe"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${loginError ? '#EF4444' : 'rgba(167,139,250,0.4)'}`, backgroundColor: 'rgba(167,139,250,0.08)', color: 'white', fontSize: 15, fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
          />
          {loginError && <p style={{ color: '#EF4444', fontSize: 12, margin: '0 0 10px', textAlign: 'left' }}>{loginError}</p>}
          <button onClick={handleLogin} disabled={loggingIn} style={{ ...btn({ backgroundColor: '#7C3AED', color: 'white', fontSize: 14, padding: '10px 0', width: '100%', borderRadius: 10, marginTop: 4 }) }}>
            {loggingIn ? '⏳ Connexion…' : 'Accéder'}
          </button>
          <button onClick={() => { setScreen('create'); setCreateError(''); setCreatedInfo(null); setCreateDisplay(''); setCreateLogin(''); setCreatePassword(''); setCreateConfirm(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(167,139,250,0.7)', fontSize: 12, fontFamily: 'Nunito, sans-serif', marginTop: 14, textDecoration: 'underline' }}>
            Créer un compte enseignant
          </button>
        </div>
      </div>
    );
  }

  const isSuperAdmin = authSession.role === 'superadmin';

  // ── Super-Admin Dashboard ──
  if (isSuperAdmin) {
    const tabs = [
      { id: 'sessions', label: '📋 Mes sessions' },
      { id: 'school', label: '🏫 Mon établissement' },
      { id: 'admin', label: '👑 Gestion Admin' },
    ];

    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 9500, fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#1e1b2e', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 20 }}>👑</span>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>Espace Super-Admin</span>
          <div style={{ backgroundColor: 'rgba(124,58,237,0.3)', border: '1px solid rgba(167,139,250,0.4)', borderRadius: 8, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#C4B5FD', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Code :</span>
            <span style={{ fontFamily: 'monospace', color: '#A78BFA', fontWeight: 900, fontSize: 14, letterSpacing: 2 }}>{authSession.schoolCode}</span>
            <button onClick={() => navigator.clipboard.writeText(authSession.schoolCode).catch(() => {})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', fontSize: 12, padding: 0, lineHeight: 1 }}>📋</button>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={handleLogout} style={{ ...btn({ backgroundColor: 'rgba(239,68,68,0.2)', color: '#FCA5A5', fontSize: 12 }) }}>🚪 Déconnexion</button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', flexShrink: 0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '10px 20px', border: 'none', borderBottom: `3px solid ${activeTab === tab.id ? '#7C3AED' : 'transparent'}`, backgroundColor: 'transparent', color: activeTab === tab.id ? '#7C3AED' : '#6B7280', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {!isFirebaseConfigured && (
          <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 0, padding: '10px 20px' }}>
            <p style={{ color: '#92400E', fontSize: 13, margin: 0 }}>⚠️ Firebase non configuré.</p>
          </div>
        )}

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'sessions' && <SessionsDashboard teacherCode={authSession.schoolCode} includeOrphans={true} onClose={onClose} />}
          {activeTab === 'school' && (
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F9FAFB' }}>
              <MySchoolTab
                teacherSession={authSession}
                hidePasswordChange={true}
                onSessionUpdate={(updated) => {
                  setAuthSession(updated);
                  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
                }}
              />
            </div>
          )}
          {activeTab === 'admin' && (
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F9FAFB' }}>
              <TeachersManagement onClose={onClose} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Teacher Dashboard ──
  const tabs = [
    { id: 'sessions', label: '📋 Mes sessions' },
    { id: 'school', label: '🏫 Mon établissement' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 9500, fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1e1b2e', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 20 }}>👨‍🏫</span>
        <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>{authSession.displayName}</span>
        <div style={{ backgroundColor: 'rgba(124,58,237,0.3)', border: '1px solid rgba(167,139,250,0.4)', borderRadius: 8, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#C4B5FD', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Code :</span>
          <span style={{ fontFamily: 'monospace', color: '#A78BFA', fontWeight: 900, fontSize: 14, letterSpacing: 2 }}>{authSession.schoolCode}</span>
          <button onClick={() => navigator.clipboard.writeText(authSession.schoolCode).catch(() => {})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', fontSize: 12, padding: 0, lineHeight: 1 }}>📋</button>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={handleLogout} style={{ ...btn({ backgroundColor: 'rgba(239,68,68,0.2)', color: '#FCA5A5', fontSize: 12 }) }}>🚪 Déconnexion</button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', flexShrink: 0 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '10px 20px', border: 'none', borderBottom: `3px solid ${activeTab === tab.id ? '#7C3AED' : 'transparent'}`, backgroundColor: 'transparent', color: activeTab === tab.id ? '#7C3AED' : '#6B7280', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {!isFirebaseConfigured && (
        <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 0, padding: '10px 20px' }}>
          <p style={{ color: '#92400E', fontSize: 13, margin: 0 }}>⚠️ Firebase non configuré.</p>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'sessions' && <SessionsDashboard teacherCode={authSession.schoolCode} onClose={onClose} />}
        {activeTab === 'school' && (
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#F9FAFB' }}>
            <MySchoolTab
              teacherSession={authSession}
              onSessionUpdate={(updated) => {
                setAuthSession(updated);
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
