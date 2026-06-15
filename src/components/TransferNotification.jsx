import React from 'react';
import { useProject } from '../hooks/useProject';
import { clearTransfer, getClientId } from '../services/session';

export default function TransferNotification({ sessionCode, transfers }) {
  const { dispatch } = useProject();

  if (!transfers || transfers.length === 0) return null;
  const transfer = transfers[0];
  const myClientId = getClientId();

  const handleAccept = () => {
    dispatch({ type: 'RECEIVE_TRANSFERRED_SCREEN', screen: transfer.screen });
    clearTransfer(sessionCode, myClientId, transfer.id);
  };

  const handleDecline = () => {
    clearTransfer(sessionCode, myClientId, transfer.id);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9100, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ backgroundColor: '#1e1b2e', borderRadius: 16, padding: 24, maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(124,58,237,0.35)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>📨</span>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#A78BFA' }}>Transfert d'écran</div>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 20 }}>
          <strong style={{ color: 'white' }}>{transfer.fromNickname || 'Quelqu\'un'}</strong> te transfère l'écran{' '}
          <strong style={{ color: '#A78BFA' }}>"{transfer.screen?.name || 'Sans nom'}"</strong>.
          <br />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            {transfer.screen?.components?.length ?? 0} composant{(transfer.screen?.components?.length ?? 0) !== 1 ? 's' : ''}
          </span>
        </div>
        {transfers.length > 1 && (
          <div style={{ backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '6px 12px', marginBottom: 16, fontSize: 12, color: '#FCD34D' }}>
            +{transfers.length - 1} autre{transfers.length > 2 ? 's' : ''} transfert{transfers.length > 2 ? 's' : ''} en attente
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleDecline} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '10px 0', fontSize: 13, fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
            ❌ Refuser
          </button>
          <button onClick={handleAccept} style={{ flex: 1, background: '#7C3AED', border: 'none', color: 'white', borderRadius: 8, padding: '10px 0', fontSize: 13, fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
            ✅ Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
