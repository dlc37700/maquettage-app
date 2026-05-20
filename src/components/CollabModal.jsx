import React, { useState, useEffect, useRef } from 'react';
import { isFirebaseConfigured } from '../services/firebase';
import { generateSessionCode, writeOwnScreens, loadSessionOnce, setClientNickname, getClientNickname, getClientId } from '../services/session';
import { initSessionMeta } from '../services/admin';

export default function CollabModal({ state, sessionCode, onJoin, onLeave, onClose }) {
  const [joinInput, setJoinInput] = useState('');
  const [nickname, setNickname] = useState(() => getClientNickname());
  const [projectName, setProjectName] = useState(() => state.projectName || '');
  const [className, setClassName] = useState(() => localStorage.getItem('maquettage_classname') || '');
  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('maquettage_schoolname') || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const joinRef = useRef(null);

  useEffect(() => {
    if (!sessionCode) setTimeout(() => joinRef.current?.focus(), 100);
  }, [sessionCode]);

  const handleCreate = async () => {
    if (!nickname.trim()) { setError('Entre ton prénom avant de créer une session.'); return; }
    if (!projectName.trim()) { setError('Entre le nom du projet avant de créer une session.'); return; }
    if (!className.trim()) { setError('Entre le nom de ta classe avant de créer une session.'); return; }
    if (!schoolName.trim()) { setError('Entre le nom de ton établissement avant de créer une session.'); return; }
    setLoading(true);
    setClientNickname(nickname.trim());
    localStorage.setItem('maquettage_classname', className.trim());
    localStorage.setItem('maquettage_schoolname', schoolName.trim());
    const code = generateSessionCode();
    const trimmedName = projectName.trim();
    const ownScreens = state.screens.filter(s => !s._remote);
    writeOwnScreens(code, ownScreens, trimmedName);
    initSessionMeta(code, nickname.trim(), className.trim(), schoolName.trim());
    onJoin(code, null, { projectName: trimmedName, isCreator: true });
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!nickname.trim()) { setError('Entre ton prénom avant de rejoindre une session.'); return; }
    const code = joinInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 6) { setError('Le code doit avoir exactement 6 caractères.'); return; }
    setLoading(true);
    setError('');
    const project = await loadSessionOnce(code);
    if (!project) {
      setError('Session introuvable. Vérifie le code et réessaie.');
      setLoading(false);
      return;
    }
    if (project?.blocked) {
      setError('Cette session a été bloquée par l\'enseignant.');
      setLoading(false);
      return;
    }
    setClientNickname(nickname.trim());
    onJoin(code, project, { isCreator: project.creatorId === getClientId() });
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLeave = () => { onLeave(); onClose(); };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#1e1b2e',
          borderRadius: 16,
          padding: 28,
          width: 420,
          maxWidth: '90vw',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          border: '1px solid rgba(167,139,250,0.2)',
          fontFamily: 'Nunito, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>👥</span>
            <span style={{ color: 'white', fontSize: 18, fontWeight: 900 }}>Travail collaboratif</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}
          >✕</button>
        </div>

        {!isFirebaseConfigured ? (
          <NotConfigured />
        ) : sessionCode ? (
          <ActiveSession code={sessionCode} onCopy={handleCopy} copied={copied} onLeave={handleLeave} nickname={getClientNickname()} />
        ) : (
          <StartSession
            nickname={nickname}
            setNickname={setNickname}
            projectName={projectName}
            setProjectName={setProjectName}
            className={className}
            setClassName={setClassName}
            schoolName={schoolName}
            setSchoolName={setSchoolName}
            joinInput={joinInput}
            setJoinInput={setJoinInput}
            onJoin={handleJoin}
            onCreate={handleCreate}
            loading={loading}
            error={error}
            setError={setError}
            joinRef={joinRef}
          />
        )}
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <div>
      <div style={{ backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <p style={{ color: '#FCD34D', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          <strong>⚠️ Firebase non configuré</strong><br />
          Pour activer la collaboration, il faut connecter une base de données Firebase.
        </p>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.8, margin: 0 }}>
        <strong style={{ color: 'white' }}>Étapes à suivre :</strong><br />
        1. Aller sur <strong>console.firebase.google.com</strong><br />
        2. Créer un projet → activer <em>Realtime Database</em><br />
        3. Choisir le mode test (règles ouvertes)<br />
        4. Dans <em>Paramètres du projet</em> → copier la config<br />
        5. Ajouter les variables dans Vercel :<br />
        &nbsp;&nbsp;<code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>VITE_FIREBASE_API_KEY</code><br />
        &nbsp;&nbsp;<code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>VITE_FIREBASE_DATABASE_URL</code><br />
        &nbsp;&nbsp;<code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>VITE_FIREBASE_PROJECT_ID</code>
      </p>
    </div>
  );
}

function ActiveSession({ code, onCopy, copied, onLeave, nickname }) {
  return (
    <div>
      <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>👋</span>
        <span style={{ color: '#34D399', fontSize: 13, fontWeight: 700 }}>Connecté en tant que <em style={{ fontStyle: 'normal', color: 'white' }}>{nickname || 'Anonyme'}</em></span>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
        Session active ! Partage ce code avec tes camarades pour travailler ensemble.
      </p>

      <div style={{ backgroundColor: 'rgba(109,40,217,0.2)', border: '2px solid #7C3AED', borderRadius: 12, padding: '16px 20px', marginBottom: 16, textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Code de session</div>
        <div style={{ color: '#A78BFA', fontSize: 36, fontWeight: 900, letterSpacing: 10, fontFamily: 'monospace' }}>{code}</div>
      </div>

      <button
        onClick={onCopy}
        style={{
          width: '100%', padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
          backgroundColor: copied ? 'rgba(52,211,153,0.2)' : 'rgba(167,139,250,0.2)',
          color: copied ? '#34D399' : '#A78BFA',
          fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
          marginBottom: 12,
        }}
      >
        {copied ? '✅ Code copié !' : '📋 Copier le code'}
      </button>

      <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0, lineHeight: 1.7 }}>
          💡 <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Comment ça marche :</strong><br />
          Chacun travaille sur ses propres écrans. Les modifications de chacun apparaissent en temps réel chez tous les membres. Les écrans des autres sont visibles mais non modifiables.
        </p>
      </div>

      <button
        onClick={onLeave}
        style={{
          width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(252,165,165,0.3)',
          cursor: 'pointer', backgroundColor: 'rgba(252,165,165,0.1)',
          color: '#FCA5A5', fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
        }}
      >
        🚪 Quitter la session
      </button>
    </div>
  );
}

function StartSession({ nickname, setNickname, projectName, setProjectName, className, setClassName, schoolName, setSchoolName, joinInput, setJoinInput, onJoin, onCreate, loading, error, setError, joinRef }) {
  const fieldStyle = (hasError) => ({
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1.5px solid ${hasError ? '#FCA5A5' : 'rgba(167,139,250,0.3)'}`,
    backgroundColor: 'rgba(255,255,255,0.06)', color: 'white',
    fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  });

  return (
    <div>
      {/* Nickname input — required for both actions */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#A78BFA', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          👤 Ton prénom
        </div>
        <input
          value={nickname}
          onChange={e => { setNickname(e.target.value); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') onJoin(); }}
          placeholder="Entre ton prénom…"
          maxLength={20}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            border: `1.5px solid ${error && !nickname.trim() ? '#FCA5A5' : 'rgba(167,139,250,0.4)'}`,
            backgroundColor: 'rgba(167,139,250,0.08)', color: 'white',
            fontSize: 15, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0', fontFamily: 'Nunito, sans-serif' }}>
          Ton prénom sera affiché à côté de tes écrans.
        </p>
      </div>

      {error && <p style={{ color: '#FCA5A5', fontSize: 12, margin: '-4px 0 12px', fontFamily: 'Nunito, sans-serif' }}>{error}</p>}

      {/* Create */}
      <div style={{ backgroundColor: 'rgba(109,40,217,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
        <div style={{ color: '#A78BFA', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          ✨ Créer une nouvelle session
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 12px', lineHeight: 1.5 }}>
          Génère un code et partage-le avec tes camarades.
        </p>

        {/* Project name */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>📁 Nom du projet *</div>
          <input
            value={projectName}
            onChange={e => { setProjectName(e.target.value); setError(''); }}
            placeholder="Ex : Application météo…"
            maxLength={40}
            style={fieldStyle(error && !projectName.trim())}
          />
        </div>

        {/* Class name */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>🏫 Classe *</div>
          <input
            value={className}
            onChange={e => { setClassName(e.target.value); setError(''); }}
            placeholder="Ex : 4C, 3B, 5ème 2…"
            maxLength={20}
            style={fieldStyle(error && !className.trim())}
          />
        </div>

        {/* School name */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>🏛️ Établissement *</div>
          <input
            value={schoolName}
            onChange={e => { setSchoolName(e.target.value); setError(''); }}
            placeholder="Ex : Collège Montaigne, Lycée Hugo…"
            maxLength={60}
            style={fieldStyle(error && !schoolName.trim())}
          />
        </div>

        <button
          onClick={onCreate}
          disabled={loading}
          style={{
            width: '100%', padding: '10px', borderRadius: 8, border: 'none', cursor: loading ? 'wait' : 'pointer',
            background: 'linear-gradient(135deg, #7C3AED, #6C63FF)',
            color: 'white', fontSize: 13, fontWeight: 800, fontFamily: 'Nunito, sans-serif',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '⏳ Création…' : '🚀 Créer une session'}
        </button>
      </div>

      {/* Join */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 18 }}>
        <div style={{ color: 'white', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          🔗 Rejoindre une session
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 12px', lineHeight: 1.5 }}>
          Entre le code donné par ton enseignant ou un camarade.
        </p>
        <input
          ref={joinRef}
          value={joinInput}
          onChange={e => { setJoinInput(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') onJoin(); }}
          placeholder="ABCDEF"
          maxLength={6}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            border: `1.5px solid rgba(255,255,255,0.15)`,
            backgroundColor: 'rgba(255,255,255,0.08)', color: 'white',
            fontSize: 22, fontWeight: 900, fontFamily: 'monospace',
            letterSpacing: 8, textAlign: 'center', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={onJoin}
          disabled={loading || joinInput.length === 0}
          style={{
            width: '100%', marginTop: 10, padding: '10px', borderRadius: 8, border: 'none',
            cursor: loading || joinInput.length === 0 ? 'not-allowed' : 'pointer',
            backgroundColor: 'rgba(96,165,250,0.2)', color: '#60A5FA',
            fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif',
            opacity: joinInput.length === 0 ? 0.5 : 1,
          }}
        >
          {loading ? '⏳ Connexion…' : '🔗 Rejoindre'}
        </button>
      </div>
    </div>
  );
}
