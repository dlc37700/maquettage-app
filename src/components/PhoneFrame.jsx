import React, { forwardRef } from 'react';
import Canvas from './Canvas';

const PhoneFrame = forwardRef(function PhoneFrame({ canvasRef }, _ref) {
  return (
    <div
      style={{
        position: 'relative',
        width: 430,
        height: 932,
        background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
        borderRadius: 54,
        boxShadow: `
          0 0 0 2px #3a3a3a,
          0 0 0 4px #111,
          0 30px 80px rgba(0,0,0,0.5),
          0 10px 30px rgba(0,0,0,0.3),
          inset 0 1px 0 rgba(255,255,255,0.1)
        `,
        padding: '20px 20px',
        flexShrink: 0,
      }}
    >
      {/* Side buttons left */}
      <div style={{ position: 'absolute', left: -4, top: 130, width: 4, height: 36, backgroundColor: '#2a2a2a', borderRadius: '4px 0 0 4px', boxShadow: '-1px 0 3px rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'absolute', left: -4, top: 180, width: 4, height: 56, backgroundColor: '#2a2a2a', borderRadius: '4px 0 0 4px', boxShadow: '-1px 0 3px rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'absolute', left: -4, top: 248, width: 4, height: 56, backgroundColor: '#2a2a2a', borderRadius: '4px 0 0 4px', boxShadow: '-1px 0 3px rgba(0,0,0,0.5)' }} />

      {/* Side button right */}
      <div style={{ position: 'absolute', right: -4, top: 190, width: 4, height: 80, backgroundColor: '#2a2a2a', borderRadius: '0 4px 4px 0', boxShadow: '1px 0 3px rgba(0,0,0,0.5)' }} />

      {/* Screen bezel */}
      <div
        style={{
          width: 390,
          height: 892,
          backgroundColor: '#000',
          borderRadius: 44,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Dynamic island / notch */}
        <div style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 34,
          backgroundColor: '#000',
          borderRadius: 20,
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 12,
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#1a1a1a', border: '2px solid #2a2a2a' }} />
        </div>

        {/* Status bar */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 52,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          padding: '0 24px 8px',
          zIndex: 998,
          pointerEvents: 'none',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>
            9:41
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect x="0" y="4" width="3" height="8" rx="1" fill="rgba(255,255,255,0.9)" />
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="rgba(255,255,255,0.9)" />
              <rect x="9" y="0.5" width="3" height="11.5" rx="1" fill="rgba(255,255,255,0.9)" />
              <rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="rgba(255,255,255,0.5)" />
            </svg>
            <svg width="16" height="12" viewBox="0 0 24 18" fill="none">
              <path d="M12 3C8.13 3 4.64 4.56 2.1 7.1L0 5C3.08 1.9 7.32 0 12 0s8.92 1.9 12 5l-2.1 2.1C19.36 4.56 15.87 3 12 3z" fill="rgba(255,255,255,0.9)"/>
              <path d="M12 9c-2.21 0-4.21.9-5.66 2.34L4.24 9.24C6.22 7.26 8.97 6 12 6s5.78 1.26 7.76 3.24l-2.1 2.1C16.21 9.9 14.21 9 12 9z" fill="rgba(255,255,255,0.9)"/>
              <circle cx="12" cy="15" r="3" fill="rgba(255,255,255,0.9)"/>
            </svg>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <div style={{ width: 22, height: 11, border: '1.5px solid rgba(255,255,255,0.8)', borderRadius: 3, padding: 1.5, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '75%', height: '100%', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 1.5 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Canvas area (below status bar) */}
        <div style={{ position: 'absolute', top: 48, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
          <Canvas canvasRef={canvasRef} />
        </div>

        {/* Home indicator */}
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 130,
          height: 5,
          backgroundColor: 'rgba(255,255,255,0.4)',
          borderRadius: 3,
          zIndex: 999,
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
});

export default PhoneFrame;
