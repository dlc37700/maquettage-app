import React from 'react';

export default function WelcomeModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)',
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fade-in"
        style={{
          backgroundColor: 'white',
          borderRadius: 24,
          padding: '36px 40px',
          maxWidth: 520,
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 12 }}>📱</div>
        <h1 style={{
          fontSize: 26, fontWeight: 900,
          color: '#1e1b4b', fontFamily: 'Nunito, sans-serif',
          margin: '0 0 8px',
        }}>
          Bienvenue sur <span style={{ color: '#6C63FF' }}>MaquetApp</span> !
        </h1>
        <p style={{ color: '#6B7280', fontSize: 14, fontFamily: 'Nunito, sans-serif', lineHeight: 1.6, marginBottom: 24 }}>
          Crée tes maquettes d'écrans mobiles facilement. Glisse des composants,
          personalise-les et exporte ton travail en PNG ou JSON.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28, textAlign: 'left' }}>
          {[
            { emoji: '🧩', title: 'Composants', text: 'Glisse ou clique sur un composant dans la palette de gauche' },
            { emoji: '✏️', title: 'Édition', text: 'Clique sur un élément pour le sélectionner et modifier ses propriétés' },
            { emoji: '🖱️', title: 'Déplacement', text: 'Clique et glisse les composants pour les repositionner' },
            { emoji: '📐', title: 'Redimensionnement', text: 'Utilise les poignées aux coins pour changer la taille' },
            { emoji: '📱', title: 'Multi-écrans', text: 'Ajoute plusieurs écrans dans le panneau de gauche' },
            { emoji: '💾', title: 'Sauvegarde', text: 'Exporte en PNG ou JSON et recharge ton projet plus tard' },
          ].map(tip => (
            <div key={tip.title} style={{
              padding: '12px 14px',
              backgroundColor: '#F5F3FF',
              borderRadius: 12,
              display: 'flex', gap: 10,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{tip.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#4C1D95', fontFamily: 'Nunito, sans-serif' }}>{tip.title}</div>
                <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Nunito, sans-serif', lineHeight: 1.4, marginTop: 2 }}>{tip.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Nunito, sans-serif' }}>
            Raccourcis : <strong>Ctrl+Z</strong> Annuler · <strong>Ctrl+Y</strong> Refaire · <strong>Ctrl+D</strong> Dupliquer · <strong>Suppr</strong> Effacer
          </div>
          <a
            href="/tutoriel-enseignant.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '10px 32px',
              backgroundColor: '#F5F3FF',
              color: '#6C63FF',
              border: '2px solid #DDD6FE',
              borderRadius: 12,
              fontSize: 13,
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 800,
              cursor: 'pointer',
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            📄 Tutoriel enseignant (PDF)
          </a>
          <button
            onClick={onClose}
            style={{
              padding: '12px 32px',
              backgroundColor: '#6C63FF',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(108,99,255,0.4)',
              transition: 'transform 0.1s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            🚀 Commencer à créer !
          </button>
        </div>
      </div>
    </div>
  );
}
