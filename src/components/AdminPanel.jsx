import React, { useState, useEffect, useCallback } from 'react';
import { isFirebaseConfigured } from '../services/firebase';
import { getAllSessions, setSessionBlocked, removeMember, exportSessionAsJson, exportMemberAsJson } from '../services/admin';

const ADMIN_PWD = import.meta.env.VITE_ADMIN_PASSWORD || 'prof';

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

function MiniScreen({ screen }) {
  return (
    <div style={{ width: THUMB_W, height: THUMB_H, borderRadius: 6, overflow: 'hidden', position: 'relative', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', border: '1px solid #E5E7EB' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 390, height: 844, ...getBg(screen.backgroundColor, screen.backgroundGradient), transform: `scale(${SCALE})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        {[...(screen.components || [])].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1)).map(comp => (
          <div key={comp.id} style={{
            position: 'absolute',
            left: comp.position?.x ?? 0,
            top: comp.position?.y ?? 0,
            width: comp.position?.width ?? 40,
            height: comp.position?.height ?? 20,
            backgroundColor: comp.props?.bgColor || comp.props?.textColor || '#C4B5FD',
            borderRadius: comp.props?.borderRadius || 0,
            opacity: comp.props?.opacity ?? 1,
            zIndex: comp.zIndex || 1,
          }} />
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

const SCHOOL_ORDER = ['Collège Montaigne', 'Collège P. de Commynes', 'Autre'];
const SCHOOL_COLORS = {
  'Collège Montaigne':     { bg: '#EDE9FE', border: '#7C3AED', text: '#5B21B6', dot: '#7C3AED' },
  'Collège P. de Commynes': { bg: '#DBEAFE', border: '#2563EB', text: '#1D4ED8', dot: '#3B82F6' },
  'Autre':                  { bg: '#F3F4F6', border: '#9CA3AF', text: '#6B7280', dot: '#9CA3AF' },
};

function SessionCard({ session, onSelect, onBlock, onCopy }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `1px solid ${session.blocked ? '#FCA5A5' : '#E5E7EB'}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 22, color: session.blocked ? '#EF4444' : session.isActive ? '#7C3AED' : '#9CA3AF', letterSpacing: 3 }}>{session.code}</span>
        <StatusBadge session={session} />
        {session.className && <span style={{ backgroundColor: '#EDE9FE', color: '#6D28D9', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 800 }}>🏫 {session.className}</span>}
      </div>
      <p style={{ color: '#6B7280', fontSize: 12, margin: '0 0 4px' }}>Créée le {formatDate(session.createdAt)} par <strong>{session.createdBy}</strong></p>
      <p style={{ color: '#9CA3AF', fontSize: 12, margin: '0 0 8px' }}>Dernière activité : {timeAgo(session.lastActivity)}</p>
      {session.members.length > 0 && (
        <p style={{ color: '#4B5563', fontSize: 12, margin: '0 0 12px' }}>
          👤 {session.members.map(m => m.nickname).join(', ')}
        </p>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => onSelect(session)} style={{ ...btn({ backgroundColor: 'rgba(108,99,255,0.1)', color: '#6C63FF' }) }}>👁️ Détails</button>
        <button onClick={(e) => onCopy(session.code, e)} style={{ ...btn({ backgroundColor: '#F3F4F6', color: '#374151' }) }}>📋 Copier code</button>
        <button onClick={(e) => onBlock(session, e)} style={{ ...btn({ backgroundColor: session.blocked ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: session.blocked ? '#10B981' : '#EF4444' }) }}>
          {session.blocked ? '🔓 Débloquer' : '🔒 Bloquer'}
        </button>
      </div>
    </div>
  );
}

function SessionsBySchool({ sessions, onSelect, onBlock, onCopy }) {
  const groups = {};
  for (const s of sessions) {
    const key = s.schoolName && SCHOOL_ORDER.includes(s.schoolName) ? s.schoolName : 'Autre';
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {SCHOOL_ORDER.filter(k => groups[k]).map(school => {
        const c = SCHOOL_COLORS[school];
        return (
          <div key={school}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c.dot, flexShrink: 0 }} />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: c.text, fontFamily: 'Nunito, sans-serif' }}>{school}</h2>
              <span style={{ backgroundColor: c.bg, color: c.text, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{groups[school].length} session{groups[school].length > 1 ? 's' : ''}</span>
              <div style={{ flex: 1, height: 1, backgroundColor: c.border, opacity: 0.25 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {groups[school].map(session => (
                <SessionCard key={session.code} session={session} onSelect={onSelect} onBlock={onBlock} onCopy={onCopy} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPanel({ onClose }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('maquetapp-admin') === ADMIN_PWD);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const loadSessions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const data = await getAllSessions();
    setSessions(data);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, []);

  useEffect(() => {
    if (authed && isFirebaseConfigured) loadSessions();
  }, [authed, loadSessions]);

  const handleLogin = () => {
    if (pwdInput === ADMIN_PWD) {
      sessionStorage.setItem('maquetapp-admin', ADMIN_PWD);
      setAuthed(true);
    } else {
      setPwdError('Mot de passe incorrect');
    }
  };

  const handleBlock = async (session, e) => {
    e?.stopPropagation();
    await setSessionBlocked(session.code, !session.blocked);
    await loadSessions(true);
    if (selected?.code === session.code) {
      setSelected(prev => prev ? { ...prev, blocked: !prev.blocked } : prev);
    }
  };

  const handleRemoveMember = async (code, clientId) => {
    if (!window.confirm('Retirer ce membre de la session ?')) return;
    await removeMember(code, clientId);
    const updated = await getAllSessions();
    setSessions(updated);
    const refreshed = updated.find(s => s.code === code);
    setSelected(refreshed || null);
  };

  const copyCode = (code, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(code).catch(() => {});
  };

  // Login screen
  if (!authed) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9500, fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ backgroundColor: '#1e1b2e', borderRadius: 16, padding: 32, width: 360, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid rgba(167,139,250,0.2)', textAlign: 'center', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer' }}>✕</button>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👨‍🏫</div>
          <h2 style={{ color: 'white', margin: '0 0 20px', fontSize: 20, fontWeight: 900 }}>Espace Enseignant</h2>
          <input
            type="password"
            value={pwdInput}
            onChange={e => { setPwdInput(e.target.value); setPwdError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Mot de passe"
            autoFocus
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${pwdError ? '#EF4444' : 'rgba(167,139,250,0.4)'}`, backgroundColor: 'rgba(167,139,250,0.08)', color: 'white', fontSize: 15, fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
          />
          {pwdError && <p style={{ color: '#EF4444', fontSize: 12, margin: '0 0 10px', textAlign: 'left' }}>{pwdError}</p>}
          <button onClick={handleLogin} style={{ ...btn({ backgroundColor: '#7C3AED', color: 'white', fontSize: 14, padding: '10px 0', width: '100%', borderRadius: 10, marginTop: 4 }) }}>
            Accéder
          </button>
        </div>
      </div>
    );
  }

  // Detail view
  if (selected) {
    const session = sessions.find(s => s.code === selected.code) || selected;
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 9500, fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ backgroundColor: '#1e1b2e', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={() => setSelected(null)} style={{ ...btn({ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 13 }) }}>← Retour</button>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 18, fontFamily: 'monospace', letterSpacing: 4 }}>{session.code}</span>
          <StatusBadge session={session} />
          {session.className && <span style={{ backgroundColor: 'rgba(167,139,250,0.25)', color: '#C4B5FD', borderRadius: 6, padding: '3px 10px', fontSize: 13, fontWeight: 800 }}>🏫 {session.className}</span>}
          {session.schoolName && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>{session.schoolName}</span>}
          <div style={{ flex: 1 }} />
          <button onClick={() => handleBlock(session)} style={{ ...btn({ backgroundColor: session.blocked ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: session.blocked ? '#10B981' : '#EF4444' }) }}>
            {session.blocked ? '🔓 Débloquer' : '🔒 Bloquer'}
          </button>
          <button onClick={() => exportSessionAsJson(session)} style={{ ...btn({ backgroundColor: 'rgba(108,99,255,0.2)', color: '#6C63FF' }) }}>📥 Tout télécharger</button>
          <button onClick={() => copyCode(session.code)} style={{ ...btn({ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }) }}>📋 Copier code</button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', marginLeft: 8 }}>✕</button>
        </div>

        {/* Members */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, backgroundColor: '#F9FAFB' }}>
          {session.members.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 40 }}>Aucun membre dans cette session.</div>
          )}
          {session.members.map(member => (
            <div key={member.clientId} style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: member.online ? '#10B981' : '#D1D5DB', flexShrink: 0 }} title={member.online ? 'En ligne' : 'Hors ligne'} />
                <span style={{ fontWeight: 900, fontSize: 15, color: '#1F2937' }}>👤 {member.nickname}</span>
                <span style={{ color: '#9CA3AF', fontSize: 12 }}>{timeAgo(member.updatedAt)}</span>
                <span style={{ color: '#6B7280', fontSize: 12, marginLeft: 4 }}>{member.screens.length} écran{member.screens.length !== 1 ? 's' : ''}</span>
                {member.pin && <span style={{ color: '#6B7280', fontSize: 12, marginLeft: 4 }}>🔑 PIN: <code style={{backgroundColor:'rgba(167,139,250,0.15)', color:'#A78BFA', borderRadius:4, padding:'1px 6px', fontSize:11, fontFamily:'monospace', fontWeight:900, letterSpacing:2}}>{member.pin}</code></span>}
                <div style={{ flex: 1 }} />
                <button onClick={() => exportMemberAsJson(member)} style={{ ...btn({ backgroundColor: 'rgba(108,99,255,0.1)', color: '#6C63FF' }) }}>📥 Télécharger</button>
                <button onClick={() => handleRemoveMember(session.code, member.clientId)} style={{ ...btn({ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }) }}>🚫 Retirer de la session</button>
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
      </div>
    );
  }

  // List view
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 9500, fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1e1b2e', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 20 }}>👨‍🏫</span>
        <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>Espace Enseignant</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => loadSessions(true)} disabled={refreshing} style={{ ...btn({ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }) }}>
          {refreshing ? '⏳' : '🔄'} Actualiser
        </button>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}>✕ Fermer</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20, backgroundColor: '#F9FAFB' }}>
        {!isFirebaseConfigured && (
          <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <p style={{ color: '#92400E', fontSize: 13, margin: 0 }}>⚠️ Firebase non configuré — l'espace enseignant nécessite une base de données Firebase.</p>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 40 }}>⏳ Chargement des sessions…</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 40 }}>Aucune session trouvée.</div>
        ) : (
          <SessionsBySchool sessions={sessions} onSelect={setSelected} onBlock={handleBlock} onCopy={copyCode} />
        )}
      </div>
    </div>
  );
}
