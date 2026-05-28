import React, { useState, useEffect, useRef } from 'react';
import { isFirebaseConfigured } from '../services/firebase';
import {
  generateSessionCode, writeOwnScreens, loadSessionOnce,
  setClientNickname, getClientNickname, getClientId,
  saveMemberRecord, prepareJoin, verifyAndRestoreMember, claimMemberIdentity,
  getOrCreateClientPin,
} from '../services/session';
import { initSessionMeta } from '../services/admin';
import { getTeacherBySchoolCode } from '../services/teachers';

export default function CollabModal({ state, sessionCode, onJoin, onLeave, onClose }) {
  // Create form state
  const [nickname, setNickname] = useState(() => getClientNickname());
  const [projectName, setProjectName] = useState(() => state.projectName || '');
  const [className, setClassName] = useState(() => localStorage.getItem('maquettage_classname') || '');
  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('maquettage_schoolname') || '');
  // Teacher code step state
  const [pendingTeacherCode, setPendingTeacherCode] = useState('');
  const [pendingSchool, setPendingSchool] = useState('');
  const [teacherCodeInput, setTeacherCodeInput] = useState('');
  const [teacherSchools, setTeacherSchools] = useState([]);
  const [teacherCodeError, setTeacherCodeError] = useState('');
  const [teacherCodeValidated, setTeacherCodeValidated] = useState(false);
  // Join form state
  const [joinInput, setJoinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  // Multi-step join flow
  // 'form' | 'teacher_code' | 'pick_member' | 'pin_entry' | 'claim_no_pin' | 'new_member' | 'show_pin'
  const [joinStep, setJoinStep] = useState('form');
  const [joinCode, setJoinCode] = useState('');
  const [sessionMembers, setSessionMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [newNickname, setNewNickname] = useState(() => getClientNickname());
  const [assignedPin, setAssignedPin] = useState('');
  const [pendingJoin, setPendingJoin] = useState(null); // {code, nickname} to finalize after showing pin
  const joinRef = useRef(null);

  useEffect(() => {
    if (!sessionCode && joinStep === 'form') setTimeout(() => joinRef.current?.focus(), 100);
  }, [sessionCode, joinStep]);

  const handleCreate = () => {
    if (!nickname.trim()) { setError('Entre ton prénom avant de créer une session.'); return; }
    if (!projectName.trim()) { setError('Entre le nom du projet avant de créer une session.'); return; }
    if (!className.trim()) { setError('Entre le nom de ta classe avant de créer une session.'); return; }
    setError('');
    // Go to teacher code step before finalizing creation
    setTeacherCodeInput('');
    setPendingTeacherCode('');
    setPendingSchool('');
    setTeacherSchools([]);
    setTeacherCodeError('');
    setTeacherCodeValidated(false);
    setJoinStep('teacher_code');
  };

  const handleValidateTeacherCode = async () => {
    const code = teacherCodeInput.trim().toUpperCase();
    if (!code) {
      // Skip step — no teacher code
      await handleFinalizeCreate(null, '');
      return;
    }
    setLoading(true);
    setTeacherCodeError('');
    const teacher = await getTeacherBySchoolCode(code);
    setLoading(false);
    if (!teacher) {
      setTeacherCodeError('Code invalide. Vérifie le code fourni par ton professeur.');
      return;
    }
    const schools = Array.isArray(teacher.schools) ? teacher.schools : [];
    setPendingTeacherCode(teacher.schoolCode);
    setTeacherSchools(schools);
    setTeacherCodeValidated(true);
    if (schools.length === 0) {
      // No schools declared — continue without school selection
      setPendingSchool('');
    } else {
      setPendingSchool(schools[0]);
    }
  };

  const handleSkipTeacherCode = async () => {
    await handleFinalizeCreate(null, '');
  };

  const handleFinalizeCreate = async (teacherCode, school) => {
    setLoading(true);
    setClientNickname(nickname.trim());
    localStorage.setItem('maquettage_classname', className.trim());
    const code = generateSessionCode();
    const trimmedName = projectName.trim();
    const ownScreens = state.screens.filter(s => !s._remote);
    writeOwnScreens(code, ownScreens, trimmedName);
    initSessionMeta(code, nickname.trim(), className.trim(), school || '', teacherCode, school || '', projectName.trim());
    await saveMemberRecord(code, getClientId(), nickname.trim());
    const pin = getOrCreateClientPin();
    setAssignedPin(pin);
    setPendingJoin({ code, nickname: nickname.trim(), projectName: trimmedName, isCreator: true, isNew: false });
    setJoinStep('show_pin');
    setLoading(false);
  };

  const handleConfirmTeacherCode = async () => {
    await handleFinalizeCreate(pendingTeacherCode || null, pendingSchool);
  };

  const handleCheckCode = async () => {
    const code = joinInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 6) { setError('Le code doit avoir exactement 6 caractères.'); return; }
    setLoading(true); setError('');
    const result = await prepareJoin(code);
    setLoading(false);
    if (result.error === 'not_found') { setError('Session introuvable. Vérifie le code et réessaie.'); return; }
    if (result.error === 'blocked') { setError("Cette session a été bloquée par l'enseignant."); return; }
    if (result.error) { setError('Erreur réseau. Réessaie.'); return; }
    if (result.alreadyMember) {
      // Same device, same clientId → join directly
      setLoading(true);
      setClientNickname(result.myNickname);
      const project = await loadSessionOnce(code);
      onJoin(code, project, { isCreator: false });
      setLoading(false);
      return;
    }
    setJoinCode(code);
    setSessionMembers(result.members);
    setNewNickname(getClientNickname());
    setJoinStep(result.members.length > 0 ? 'pick_member' : 'new_member');
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setPinInput('');
    setPinError('');
    setJoinStep(member.hasPin ? 'pin_entry' : 'claim_no_pin');
  };

  const handleVerifyPin = async () => {
    if (pinInput.length !== 4) { setPinError('Le code PIN doit avoir exactement 4 chiffres.'); return; }
    setLoading(true); setPinError('');
    const ok = await verifyAndRestoreMember(joinCode, selectedMember.clientId, pinInput);
    if (ok) {
      setClientNickname(selectedMember.nickname);
      const project = await loadSessionOnce(joinCode);
      onJoin(joinCode, project, { isCreator: false });
    } else {
      setPinError('Code PIN incorrect. Réessaie ou rejoins comme nouveau membre.');
      setLoading(false);
    }
  };

  const handleClaimIdentity = async () => {
    setLoading(true);
    const pin = await claimMemberIdentity(joinCode, selectedMember.clientId, selectedMember.nickname);
    setClientNickname(selectedMember.nickname);
    setAssignedPin(pin);
    setPendingJoin({ code: joinCode, nickname: selectedMember.nickname });
    setJoinStep('show_pin');
    setLoading(false);
  };

  const handleJoinAsNew = async () => {
    const name = newNickname.trim();
    if (!name) { setError('Entre ton prénom avant de rejoindre.'); return; }
    setLoading(true); setError('');
    setClientNickname(name);
    await saveMemberRecord(joinCode, getClientId(), name);
    const pin = getOrCreateClientPin();
    setAssignedPin(pin);
    setPendingJoin({ code: joinCode, nickname: name, isNew: true });
    setJoinStep('show_pin');
    setLoading(false);
  };

  const handleFinalizeJoin = async () => {
    if (!pendingJoin) return;
    setLoading(true);
    if (pendingJoin.isCreator) {
      // Creator: their screens are already in local state, just open the session
      onJoin(pendingJoin.code, null, { projectName: pendingJoin.projectName, isCreator: true });
    } else if (pendingJoin.isNew) {
      // New member: count existing screens to give a unique name, then start fresh
      const existingProject = await loadSessionOnce(pendingJoin.code);
      const screenCount = existingProject?.screens?.length || 0;
      const initialScreenName = screenCount > 0 ? `Écran ${screenCount + 1}` : 'Accueil';
      onJoin(pendingJoin.code, null, { isCreator: false, initialScreenName });
    } else {
      // Returning member (claim or PIN verify): restore existing screens from Firebase
      const project = await loadSessionOnce(pendingJoin.code);
      onJoin(pendingJoin.code, project, { isCreator: false });
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const handleLeave = () => { onLeave(); onClose(); };

  const s = {
    card: { backgroundColor: '#1e1b2e', borderRadius: 16, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid rgba(167,139,250,0.2)', fontFamily: 'Nunito, sans-serif' },
    field: (err) => ({ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${err ? '#FCA5A5' : 'rgba(167,139,250,0.3)'}`, backgroundColor: 'rgba(255,255,255,0.06)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box' }),
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div onClick={e => e.stopPropagation()} style={s.card}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>👥</span>
            <span style={{ color: 'white', fontSize: 18, fontWeight: 900 }}>Travail collaboratif</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {!isFirebaseConfigured ? <NotConfigured /> :
         sessionCode ? <ActiveSession code={sessionCode} onCopy={handleCopy} copied={copied} onLeave={handleLeave} nickname={getClientNickname()} /> :
         joinStep === 'teacher_code' ? (
          <TeacherCodeStep
            teacherCodeInput={teacherCodeInput}
            setTeacherCodeInput={setTeacherCodeInput}
            teacherCodeError={teacherCodeError}
            teacherCodeValidated={teacherCodeValidated}
            teacherSchools={teacherSchools}
            pendingTeacherCode={pendingTeacherCode}
            pendingSchool={pendingSchool}
            setPendingSchool={setPendingSchool}
            loading={loading}
            onValidate={handleValidateTeacherCode}
            onSkip={handleSkipTeacherCode}
            onConfirm={handleConfirmTeacherCode}
            onBack={() => setJoinStep('form')}
          />
         ) :
         joinStep === 'pick_member' ? (
          <PickMemberStep
            code={joinCode}
            members={sessionMembers}
            onSelect={handleSelectMember}
            onNew={() => setJoinStep('new_member')}
            onBack={() => setJoinStep('form')}
          />
         ) :
         joinStep === 'pin_entry' ? (
          <PinEntryStep
            member={selectedMember}
            pinInput={pinInput}
            setPinInput={setPinInput}
            pinError={pinError}
            loading={loading}
            onVerify={handleVerifyPin}
            onBack={() => setJoinStep('pick_member')}
            onNew={() => setJoinStep('new_member')}
          />
         ) :
         joinStep === 'claim_no_pin' ? (
          <ClaimNoPinStep
            member={selectedMember}
            loading={loading}
            onClaim={handleClaimIdentity}
            onBack={() => setJoinStep('pick_member')}
            onNew={() => setJoinStep('new_member')}
          />
         ) :
         joinStep === 'show_pin' ? (
          <ShowPinStep
            pin={assignedPin}
            nickname={pendingJoin?.nickname || ''}
            loading={loading}
            isCreator={pendingJoin?.isCreator || false}
            onContinue={handleFinalizeJoin}
          />
         ) :
         joinStep === 'new_member' ? (
          <NewMemberStep
            nickname={newNickname}
            setNickname={setNewNickname}
            error={error}
            loading={loading}
            onJoin={handleJoinAsNew}
            onBack={() => setJoinStep(sessionMembers.length > 0 ? 'pick_member' : 'form')}
          />
         ) : (
          <StartSession
            nickname={nickname} setNickname={setNickname}
            projectName={projectName} setProjectName={setProjectName}
            className={className} setClassName={setClassName}
            joinInput={joinInput} setJoinInput={setJoinInput}
            onCheckCode={handleCheckCode}
            onCreate={handleCreate}
            loading={loading} error={error} setError={setError}
            joinRef={joinRef}
            fieldStyle={s.field}
          />
         )
        }
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
      <button onClick={onCopy} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', backgroundColor: copied ? 'rgba(52,211,153,0.2)' : 'rgba(167,139,250,0.2)', color: copied ? '#34D399' : '#A78BFA', fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif', marginBottom: 12 }}>
        {copied ? '✅ Code copié !' : '📋 Copier le code'}
      </button>
      <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0, lineHeight: 1.7 }}>
          💡 <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Comment ça marche :</strong><br />
          Chacun travaille sur ses propres écrans. Les modifications de chacun apparaissent en temps réel chez tous les membres.
        </p>
      </div>
      <button onClick={onLeave} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(252,165,165,0.3)', cursor: 'pointer', backgroundColor: 'rgba(252,165,165,0.1)', color: '#FCA5A5', fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>
        🚪 Quitter la session
      </button>
    </div>
  );
}

function PickMemberStep({ code, members, onSelect, onNew, onBack }) {
  const COLORS = ['#6C63FF','#EC4899','#10B981','#F59E0B','#3B82F6','#8B5CF6','#EF4444','#F97316'];
  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', padding: '0 0 12px', fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Retour
      </button>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ color: '#A78BFA', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Session {code}</div>
        <div style={{ color: 'white', fontSize: 16, fontWeight: 900 }}>Qui es-tu ?</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>Clique sur ton prénom pour retrouver tes écrans</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
        {members.map((m, i) => (
          <button key={m.clientId} onClick={() => onSelect(m)}
            style={{ padding: '12px 8px', borderRadius: 10, border: `2px solid ${COLORS[i % COLORS.length]}40`, cursor: 'pointer', backgroundColor: `${COLORS[i % COLORS.length]}18`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'Nunito, sans-serif', transition: 'all 0.15s' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: 'white' }}>
              {m.nickname[0]?.toUpperCase() || '?'}
            </div>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{m.nickname}</span>
            {m.hasPin
              ? <span style={{ fontSize: 10, color: '#A78BFA' }}>🔒 Code PIN</span>
              : <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Sans code PIN</span>
            }
          </button>
        ))}
      </div>
      <button onClick={onNew} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>
        Je ne suis pas dans la liste →
      </button>
    </div>
  );
}

function PinEntryStep({ member, pinInput, setPinInput, pinError, loading, onVerify, onBack, onNew }) {
  const COLORS = ['#6C63FF','#EC4899','#10B981','#F59E0B','#3B82F6','#8B5CF6','#EF4444','#F97316'];
  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', padding: '0 0 12px', fontFamily: 'Nunito, sans-serif' }}>
        ← Retour
      </button>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: COLORS[0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: 'white', margin: '0 auto 10px' }}>
          {member?.nickname[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ color: 'white', fontSize: 16, fontWeight: 900 }}>Bienvenue, {member?.nickname} !</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>Entre ton code PIN à 4 chiffres</div>
      </div>
      <input
        autoFocus
        type="text"
        inputMode="numeric"
        maxLength={4}
        value={pinInput}
        onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4)); }}
        onKeyDown={e => { if (e.key === 'Enter') onVerify(); }}
        placeholder="• • • •"
        style={{ width: '100%', padding: '14px', borderRadius: 10, border: `2px solid ${pinError ? '#FCA5A5' : 'rgba(167,139,250,0.4)'}`, backgroundColor: 'rgba(167,139,250,0.08)', color: 'white', fontSize: 28, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 14, textAlign: 'center', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
      />
      {pinError && <p style={{ color: '#FCA5A5', fontSize: 12, margin: '0 0 10px', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>{pinError}</p>}
      <button onClick={onVerify} disabled={loading || pinInput.length !== 4}
        style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: loading || pinInput.length !== 4 ? 'not-allowed' : 'pointer', background: pinInput.length === 4 ? 'linear-gradient(135deg, #7C3AED, #6C63FF)' : 'rgba(255,255,255,0.1)', color: pinInput.length === 4 ? 'white' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 800, fontFamily: 'Nunito, sans-serif', marginBottom: 10 }}>
        {loading ? '⏳ Vérification…' : '✅ Confirmer'}
      </button>
      <button onClick={onNew} style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Nunito, sans-serif' }}>
        Pas mon code → rejoindre comme nouveau membre
      </button>
    </div>
  );
}

function NewMemberStep({ nickname, setNickname, error, loading, onJoin, onBack }) {
  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', padding: '0 0 12px', fontFamily: 'Nunito, sans-serif' }}>
        ← Retour
      </button>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🆕</div>
        <div style={{ color: 'white', fontSize: 16, fontWeight: 900 }}>Nouveau membre</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>Un code PIN te sera attribué pour la prochaine fois</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#A78BFA', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>👤 Ton prénom</div>
        <input
          autoFocus
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onJoin(); }}
          placeholder="Entre ton prénom…"
          maxLength={20}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${error && !nickname.trim() ? '#FCA5A5' : 'rgba(167,139,250,0.4)'}`, backgroundColor: 'rgba(167,139,250,0.08)', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>
      {error && <p style={{ color: '#FCA5A5', fontSize: 12, margin: '-8px 0 12px', fontFamily: 'Nunito, sans-serif' }}>{error}</p>}
      <button onClick={onJoin} disabled={loading || !nickname.trim()}
        style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: loading || !nickname.trim() ? 'not-allowed' : 'pointer', background: nickname.trim() ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.1)', color: nickname.trim() ? 'white' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 800, fontFamily: 'Nunito, sans-serif' }}>
        {loading ? '⏳ Connexion…' : '🚀 Rejoindre la session'}
      </button>
    </div>
  );
}

function StartSession({ nickname, setNickname, projectName, setProjectName, className, setClassName, joinInput, setJoinInput, onCheckCode, onCreate, loading, error, setError, joinRef, fieldStyle }) {
  return (
    <div>
      {/* Nickname input for create */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ color: '#A78BFA', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>👤 Ton prénom</div>
        <input value={nickname} onChange={e => { setNickname(e.target.value); setError(''); }} placeholder="Entre ton prénom…" maxLength={20}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${error && !nickname.trim() ? '#FCA5A5' : 'rgba(167,139,250,0.4)'}`, backgroundColor: 'rgba(167,139,250,0.08)', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0', fontFamily: 'Nunito, sans-serif' }}>Ton prénom sera affiché à côté de tes écrans.</p>
      </div>
      {error && <p style={{ color: '#FCA5A5', fontSize: 12, margin: '-4px 0 12px', fontFamily: 'Nunito, sans-serif' }}>{error}</p>}

      {/* Create */}
      <div style={{ backgroundColor: 'rgba(109,40,217,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
        <div style={{ color: '#A78BFA', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>✨ Créer une nouvelle session</div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 12px', lineHeight: 1.5 }}>Génère un code et partage-le avec tes camarades.</p>
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>📁 Nom du projet *</div>
          <input value={projectName} onChange={e => { setProjectName(e.target.value); setError(''); }} placeholder="Ex : Application météo…" maxLength={40} style={fieldStyle(error && !projectName.trim())} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.8 }}>🏫 Classe *</div>
          <input value={className} onChange={e => { setClassName(e.target.value); setError(''); }} placeholder="Ex : 4C, 3B, 5ème 2…" maxLength={20} style={fieldStyle(error && !className.trim())} />
        </div>
        <button onClick={onCreate} disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', cursor: loading ? 'wait' : 'pointer', background: 'linear-gradient(135deg, #7C3AED, #6C63FF)', color: 'white', fontSize: 13, fontWeight: 800, fontFamily: 'Nunito, sans-serif', opacity: loading ? 0.7 : 1 }}>
          {loading ? '⏳ Création…' : '🚀 Créer une session'}
        </button>
      </div>

      {/* Join */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 18 }}>
        <div style={{ color: 'white', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🔗 Rejoindre une session</div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 12px', lineHeight: 1.5 }}>Entre le code donné par ton enseignant ou un camarade.</p>
        <input ref={joinRef} value={joinInput} onChange={e => { setJoinInput(e.target.value.toUpperCase()); setError(''); }} onKeyDown={e => { if (e.key === 'Enter') onCheckCode(); }} placeholder="ABCDEF" maxLength={6}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', fontSize: 22, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 8, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
        <button onClick={onCheckCode} disabled={loading || joinInput.length === 0}
          style={{ width: '100%', marginTop: 10, padding: '10px', borderRadius: 8, border: 'none', cursor: loading || joinInput.length === 0 ? 'not-allowed' : 'pointer', backgroundColor: 'rgba(96,165,250,0.2)', color: '#60A5FA', fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif', opacity: joinInput.length === 0 ? 0.5 : 1 }}>
          {loading ? '⏳ Connexion…' : '🔗 Rejoindre'}
        </button>
      </div>
    </div>
  );
}

function TeacherCodeStep({ teacherCodeInput, setTeacherCodeInput, teacherCodeError, teacherCodeValidated, teacherSchools, pendingTeacherCode, pendingSchool, setPendingSchool, loading, onValidate, onSkip, onConfirm, onBack }) {
  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', padding: '0 0 12px', fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
        ← Retour
      </button>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>🏫</div>
        <div style={{ color: 'white', fontSize: 16, fontWeight: 900 }}>Code établissement</div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>Entrez le code fourni par votre professeur (ex : ENS-A3F7)</div>
      </div>

      {!teacherCodeValidated ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <input
              autoFocus
              value={teacherCodeInput}
              onChange={e => { setTeacherCodeInput(e.target.value.toUpperCase()); }}
              onKeyDown={e => { if (e.key === 'Enter') onValidate(); }}
              placeholder="ENS-XXXX"
              maxLength={8}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${teacherCodeError ? '#FCA5A5' : 'rgba(167,139,250,0.4)'}`, backgroundColor: 'rgba(167,139,250,0.08)', color: 'white', fontSize: 18, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 4, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
            />
            {teacherCodeError && <p style={{ color: '#FCA5A5', fontSize: 12, margin: '6px 0 0', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>{teacherCodeError}</p>}
          </div>
          <button onClick={onValidate} disabled={loading}
            style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer', background: 'linear-gradient(135deg, #7C3AED, #6C63FF)', color: 'white', fontSize: 14, fontWeight: 800, fontFamily: 'Nunito, sans-serif', marginBottom: 10 }}>
            {loading ? '⏳ Vérification…' : '✅ Valider le code'}
          </button>
          <div style={{ textAlign: 'center' }}>
            <button onClick={onSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'Nunito, sans-serif', textDecoration: 'underline', padding: '4px 8px' }}>
              Passer cette étape
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <p style={{ color: '#34D399', fontSize: 13, fontWeight: 700, margin: 0 }}>✅ Code valide : <span style={{ fontFamily: 'monospace', letterSpacing: 2 }}>{pendingTeacherCode}</span></p>
          </div>
          {teacherSchools.length === 0 ? (
            <div style={{ backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
              <p style={{ color: '#FCD34D', fontSize: 12, margin: 0 }}>ℹ️ Ce professeur n'a déclaré aucun établissement. Vous pouvez continuer.</p>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>🏛️ Votre établissement</div>
              <select
                value={pendingSchool}
                onChange={e => setPendingSchool(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid rgba(167,139,250,0.3)', backgroundColor: 'rgba(255,255,255,0.06)', color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}
              >
                {teacherSchools.map(s => (
                  <option key={s} value={s} style={{ backgroundColor: '#1e1b2e' }}>{s}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={onConfirm} disabled={loading}
            style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontSize: 14, fontWeight: 800, fontFamily: 'Nunito, sans-serif' }}>
            {loading ? '⏳ Création…' : '🚀 Créer la session'}
          </button>
        </>
      )}
    </div>
  );
}

function ClaimNoPinStep({ member, loading, onClaim, onBack, onNew }) {
  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', padding: '0 0 12px', fontFamily: 'Nunito, sans-serif' }}>
        ← Retour
      </button>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: 'white', margin: '0 auto 10px' }}>
          {member?.nickname[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ color: 'white', fontSize: 16, fontWeight: 900 }}>Tu es {member?.nickname} ?</div>
      </div>
      <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <p style={{ color: '#FCD34D', fontSize: 12, margin: 0, lineHeight: 1.7 }}>
          ⚠️ Ce membre n'a pas encore de code PIN.<br />
          Si tu es bien <strong>{member?.nickname}</strong>, clique sur <strong>"C'est moi"</strong> pour récupérer tes écrans.<br />
          Un code PIN te sera attribué — <strong>note-le bien !</strong>
        </p>
      </div>
      <button onClick={onClaim} disabled={loading}
        style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', fontSize: 14, fontWeight: 800, fontFamily: 'Nunito, sans-serif', marginBottom: 10 }}>
        {loading ? '⏳ En cours…' : "✅ C'est moi, récupérer mes écrans"}
      </button>
      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <button onClick={onNew} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', fontSize: 11, fontFamily: 'Nunito, sans-serif', textDecoration: 'underline', padding: '4px 8px' }}>
          Ce n'est pas moi
        </button>
      </div>
    </div>
  );
}

function ShowPinStep({ pin, nickname, loading, isCreator, onContinue }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(pin).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>🔑</div>
      <div style={{ color: 'white', fontSize: 18, fontWeight: 900, marginBottom: 4 }}>Ton code PIN</div>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 20 }}>Note-le bien, tu en auras besoin pour te reconnecter !</div>
      <div style={{ backgroundColor: 'rgba(109,40,217,0.25)', border: '2px solid #7C3AED', borderRadius: 16, padding: '20px 24px', marginBottom: 8, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{nickname}</div>
        <div style={{ color: '#A78BFA', fontSize: 52, fontWeight: 900, fontFamily: 'monospace', letterSpacing: 16 }}>{pin}</div>
      </div>
      <button onClick={copy} style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: copied ? 'rgba(52,211,153,0.15)' : 'rgba(167,139,250,0.1)', color: copied ? '#34D399' : '#A78BFA', fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif', marginBottom: 16 }}>
        {copied ? '✅ Copié !' : '📋 Copier le code'}
      </button>
      <div style={{ backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: 10, marginBottom: 16, textAlign: 'left' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0, lineHeight: 1.6 }}>
          💡 La prochaine fois que tu rejoindras cette session depuis un autre ordinateur, clique sur ton prénom et entre ce code à 4 chiffres.
        </p>
      </div>
      <button onClick={onContinue} disabled={loading}
        style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontSize: 14, fontWeight: 800, fontFamily: 'Nunito, sans-serif' }}>
        {loading ? '⏳ Connexion…' : isCreator ? '🚀 Lancer la session →' : '🚀 Rejoindre la session →'}
      </button>
    </div>
  );
}
