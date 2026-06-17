import React, { useState } from 'react';

// Mandatory project-brief questionnaire, shown once when a NEW session is created.
// Follows the structure of the "Carnet de bord élève" workbook (rôles, cahier des charges).
export const EMPTY_BRIEF = {
  slogan: '',
  team: { chef: '', designer: '', redacteur: '', porteparole: '' },
  audience: '', age: '', problem: '',
  need: '',
  functions: [{ text: '', priority: 3 }, { text: '', priority: 3 }, { text: '', priority: 2 }],
  constraints: [{ type: 'Esthétique', text: '' }],
};

const ROLES = [
  { key: 'chef', emoji: '👑', label: 'Chef de projet' },
  { key: 'designer', emoji: '🎨', label: 'Designer' },
  { key: 'redacteur', emoji: '✍️', label: 'Rédacteur' },
  { key: 'porteparole', emoji: '🎤', label: 'Porte-parole' },
];

const CONSTRAINT_TYPES = ['Esthétique', 'Technique', 'Économique', 'Légale', 'Ergonomique', 'Environnementale'];

export default function ProjectBriefWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState(() => JSON.parse(JSON.stringify(EMPTY_BRIEF)));
  const [error, setError] = useState('');

  const set = (changes) => setBrief(b => ({ ...b, ...changes }));
  const setTeam = (key, name) => setBrief(b => ({ ...b, team: { ...b.team, [key]: name } }));

  const setFunctionAt = (i, changes) => setBrief(b => ({
    ...b, functions: b.functions.map((f, idx) => idx === i ? { ...f, ...changes } : f),
  }));
  const addFunction = () => setBrief(b => b.functions.length >= 5 ? b : { ...b, functions: [...b.functions, { text: '', priority: 1 }] });
  const removeFunction = (i) => setBrief(b => b.functions.length <= 3 ? b : { ...b, functions: b.functions.filter((_, idx) => idx !== i) });

  const setConstraintAt = (i, changes) => setBrief(b => ({
    ...b, constraints: b.constraints.map((c, idx) => idx === i ? { ...c, ...changes } : c),
  }));
  const addConstraint = () => setBrief(b => b.constraints.length >= 6 ? b : { ...b, constraints: [...b.constraints, { type: 'Technique', text: '' }] });
  const removeConstraint = (i) => setBrief(b => b.constraints.length <= 1 ? b : { ...b, constraints: b.constraints.filter((_, idx) => idx !== i) });

  const STEPS = [
    { title: '1. Notre équipe', validate: () => ROLES.every(r => brief.team[r.key].trim()) ? '' : 'Indique un prénom pour chaque rôle (un même prénom peut tenir plusieurs rôles).' },
    { title: '2. À qui s\'adresse l\'appli ?', validate: () => (!brief.audience.trim() || !brief.age.trim() || !brief.problem.trim()) ? 'Remplis les 3 champs avant de continuer.' : '' },
    { title: '3. À quoi sert l\'appli ?', validate: () => brief.need.trim().length < 10 ? 'Décris le besoin en au moins une phrase complète.' : '' },
    { title: '4. Que doit faire l\'appli ?', validate: () => brief.functions.filter(f => f.text.trim()).length < 3 ? 'Indique au moins 3 fonctions.' : '' },
    { title: '5. Quelles sont les contraintes ?', validate: () => brief.constraints.filter(c => c.text.trim()).length < 1 ? 'Indique au moins une contrainte.' : '' },
    { title: '6. Slogan', validate: () => brief.slogan.trim() ? '' : 'Donne un slogan à ton application.' },
  ];

  const goNext = () => {
    const msg = STEPS[step].validate();
    if (msg) { setError(msg); return; }
    setError('');
    if (step === STEPS.length - 1) {
      onComplete(brief);
    } else {
      setStep(s => s + 1);
    }
  };
  const goBack = () => { setError(''); if (step === 0) onCancel(); else setStep(s => s - 1); };

  const input = {
    width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid rgba(167,139,250,0.3)',
    backgroundColor: 'rgba(255,255,255,0.06)', color: 'white', fontSize: 13, fontWeight: 600,
    fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box', marginBottom: 10,
  };
  const label = { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 5, borderRadius: 3,
            backgroundColor: i <= step ? '#A78BFA' : 'rgba(255,255,255,0.12)',
          }} />
        ))}
      </div>

      <h3 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '0 0 4px' }}>
        📝 {STEPS[step].title}
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11.5, margin: '0 0 14px' }}>
        Cahier des charges — étape {step + 1} / {STEPS.length}. Toutes les réponses sont obligatoires.
      </p>

      {step === 0 && (
        <div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 12 }}>
            Si vous êtes 3, un membre peut cumuler deux rôles (réécris simplement son prénom deux fois).
          </p>
          {ROLES.map(r => (
            <div key={r.key}>
              <label style={label}>{r.emoji} {r.label}</label>
              <input style={input} value={brief.team[r.key]} onChange={e => setTeam(r.key, e.target.value)} placeholder="Prénom et nom" />
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div>
          <label style={label}>Public visé (qui va utiliser l'appli ?)</label>
          <input style={input} value={brief.audience} onChange={e => set({ audience: e.target.value })} placeholder="Ex. les collégiens qui prennent les transports en commun" />
          <label style={label}>Âge</label>
          <input style={input} value={brief.age} onChange={e => set({ age: e.target.value })} placeholder="Ex. 11 à 15 ans" />
          <label style={label}>Le problème de départ</label>
          <textarea style={{ ...input, minHeight: 70, resize: 'vertical' }} value={brief.problem} onChange={e => set({ problem: e.target.value })} placeholder="Quel est le problème qui dérange ton utilisateur ?" />
        </div>
      )}

      {step === 2 && (
        <div>
          <label style={label}>Rédige le besoin : à quoi sert l'appli et comment répond-elle au problème ?</label>
          <textarea style={{ ...input, minHeight: 130, resize: 'vertical' }} value={brief.need} onChange={e => set({ need: e.target.value })} placeholder="Notre appli sert à..." />
        </div>
      )}

      {step === 3 && (
        <div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 10 }}>
            3 à 5 fonctions. Chaque fonction commence par un verbe à l'infinitif.
          </p>
          {brief.functions.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'flex-start' }}>
              <input
                style={{ ...input, marginBottom: 0, flex: 1 }}
                value={f.text}
                onChange={e => setFunctionAt(i, { text: e.target.value })}
                placeholder={`Fonction ${i + 1} (ex. Envoyer une notification…)`}
              />
              <select
                value={f.priority}
                onChange={e => setFunctionAt(i, { priority: Number(e.target.value) })}
                style={{ ...input, marginBottom: 0, width: 110, padding: '9px 6px' }}
              >
                <option value={3}>★★★</option>
                <option value={2}>★★</option>
                <option value={1}>★</option>
              </select>
              {brief.functions.length > 3 && (
                <button onClick={() => removeFunction(i)} style={removeBtnStyle}>✕</button>
              )}
            </div>
          ))}
          {brief.functions.length < 5 && (
            <button onClick={addFunction} style={addBtnStyle}>+ Ajouter une fonction</button>
          )}
        </div>
      )}

      {step === 4 && (
        <div>
          {brief.constraints.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'flex-start' }}>
              <select
                value={c.type}
                onChange={e => setConstraintAt(i, { type: e.target.value })}
                style={{ ...input, marginBottom: 0, width: 140 }}
              >
                {CONSTRAINT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                style={{ ...input, marginBottom: 0, flex: 1 }}
                value={c.text}
                onChange={e => setConstraintAt(i, { text: e.target.value })}
                placeholder="Ex. 3 couleurs dominantes maximum"
              />
              {brief.constraints.length > 1 && (
                <button onClick={() => removeConstraint(i)} style={removeBtnStyle}>✕</button>
              )}
            </div>
          ))}
          {brief.constraints.length < 6 && (
            <button onClick={addConstraint} style={addBtnStyle}>+ Ajouter une contrainte</button>
          )}
        </div>
      )}

      {step === 5 && (
        <div>
          <label style={label}>Slogan de l'application (une phrase courte)</label>
          <input style={input} value={brief.slogan} onChange={e => set({ slogan: e.target.value })} placeholder="Ex. Ne perds plus jamais tes affaires de cours !" />
        </div>
      )}

      {error && (
        <p style={{ color: '#FCA5A5', fontSize: 12, fontWeight: 700, margin: '4px 0 12px' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={goBack} style={backBtnStyle}>← {step === 0 ? 'Annuler' : 'Précédent'}</button>
        <button onClick={goNext} style={nextBtnStyle}>{step === STEPS.length - 1 ? 'Terminer ✓' : 'Suivant →'}</button>
      </div>
    </div>
  );
}

const addBtnStyle = {
  background: 'rgba(167,139,250,0.15)', border: '1px dashed rgba(167,139,250,0.4)',
  color: '#A78BFA', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'Nunito, sans-serif', width: '100%',
};
const removeBtnStyle = {
  background: 'rgba(252,165,165,0.12)', border: 'none', color: '#FCA5A5',
  borderRadius: 8, width: 34, height: 34, fontSize: 13, cursor: 'pointer', flexShrink: 0,
};
const backBtnStyle = {
  flex: 1, padding: '10px 14px', borderRadius: 9, border: '1.5px solid rgba(255,255,255,0.15)',
  backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 800,
  cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
};
const nextBtnStyle = {
  flex: 2, padding: '10px 14px', borderRadius: 9, border: 'none',
  background: 'linear-gradient(135deg, #7C3AED, #6C63FF)', color: 'white', fontSize: 13, fontWeight: 800,
  cursor: 'pointer', fontFamily: 'Nunito, sans-serif', boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
};
