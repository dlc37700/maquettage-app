import React, { forwardRef } from 'react';
import Canvas from './Canvas';
import { useProject } from '../hooks/useProject';

const FRAME_DIMS = {
  phone:  { portrait: [430, 932], landscape: [932, 430] },
  tablet: { portrait: [820, 1100], landscape: [1100, 820] },
};
const CANVAS_DIMS = {
  phone:  { portrait: [390, 844], landscape: [844, 390] },
  tablet: { portrait: [768, 1024], landscape: [1024, 768] },
};

const PhoneFrame = forwardRef(function PhoneFrame({ canvasRef }, _ref) {
  const { state } = useProject();
  const deviceType = state.deviceType ?? 'phone';
  const orientation = state.orientation ?? 'portrait';
  const isLandscape = orientation === 'landscape';
  const isTablet = deviceType === 'tablet';

  const [frameW, frameH] = FRAME_DIMS[deviceType][orientation];
  const [canvasW, canvasH] = CANVAS_DIMS[deviceType][orientation];
  const pad = isTablet ? 16 : 20;
  const fRad = isTablet ? 24 : 54;
  const bRad = isTablet ? 18 : 44;

  return (
    <div style={{
      position: 'relative', width: frameW, height: frameH,
      background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
      borderRadius: fRad,
      boxShadow: '0 0 0 2px #3a3a3a, 0 0 0 4px #111, 0 30px 80px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      padding: pad,
      flexShrink: 0,
    }}>
      {/* Phone side buttons (portrait only) */}
      {!isTablet && !isLandscape && (<>
        <div style={{ position: 'absolute', left: -4, top: 130, width: 4, height: 36, backgroundColor: '#2a2a2a', borderRadius: '4px 0 0 4px', boxShadow: '-1px 0 3px rgba(0,0,0,0.5)' }} />
        <div style={{ position: 'absolute', left: -4, top: 180, width: 4, height: 56, backgroundColor: '#2a2a2a', borderRadius: '4px 0 0 4px', boxShadow: '-1px 0 3px rgba(0,0,0,0.5)' }} />
        <div style={{ position: 'absolute', left: -4, top: 248, width: 4, height: 56, backgroundColor: '#2a2a2a', borderRadius: '4px 0 0 4px', boxShadow: '-1px 0 3px rgba(0,0,0,0.5)' }} />
        <div style={{ position: 'absolute', right: -4, top: 190, width: 4, height: 80, backgroundColor: '#2a2a2a', borderRadius: '0 4px 4px 0', boxShadow: '1px 0 3px rgba(0,0,0,0.5)' }} />
      </>)}
      {/* Phone landscape side buttons */}
      {!isTablet && isLandscape && (<>
        <div style={{ position: 'absolute', top: -4, left: 130, width: 36, height: 4, backgroundColor: '#2a2a2a', borderRadius: '4px 4px 0 0' }} />
        <div style={{ position: 'absolute', top: -4, left: 190, width: 80, height: 4, backgroundColor: '#2a2a2a', borderRadius: '4px 4px 0 0' }} />
        <div style={{ position: 'absolute', bottom: -4, left: 180, width: 56, height: 4, backgroundColor: '#2a2a2a', borderRadius: '0 0 4px 4px' }} />
        <div style={{ position: 'absolute', bottom: -4, left: 248, width: 56, height: 4, backgroundColor: '#2a2a2a', borderRadius: '0 0 4px 4px' }} />
      </>)}
      {/* Screen bezel */}
      <div style={{
        width: canvasW, height: canvasH,
        backgroundColor: '#000', borderRadius: bRad,
        overflow: 'hidden', position: 'relative',
      }}>
        {/* Notch/camera - portrait phone */}
        {!isTablet && !isLandscape && (
          <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 120, height: 34, backgroundColor: '#000', borderRadius: 20, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#1a1a1a', border: '2px solid #2a2a2a' }} />
          </div>
        )}
        {/* Notch/camera - landscape phone */}
        {!isTablet && isLandscape && (
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 34, height: 120, backgroundColor: '#000', borderRadius: 20, zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#1a1a1a', border: '2px solid #2a2a2a' }} />
          </div>
        )}
        {/* Camera - tablet portrait */}
        {isTablet && !isLandscape && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#1a1a1a', border: '2px solid #2a2a2a', zIndex: 999 }} />
        )}
        {/* Camera - tablet landscape */}
        {isTablet && isLandscape && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#1a1a1a', border: '2px solid #2a2a2a', zIndex: 999 }} />
        )}

        {/* Status bar (portrait) */}
        {!isLandscape && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 52, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 24px 8px', zIndex: 998, pointerEvents: 'none' }}>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>9:41</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><rect x="0" y="4" width="3" height="8" rx="1" fill="rgba(255,255,255,0.9)" /><rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="rgba(255,255,255,0.9)" /><rect x="9" y="0.5" width="3" height="11.5" rx="1" fill="rgba(255,255,255,0.9)" /><rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="rgba(255,255,255,0.5)" /></svg>
              <svg width="16" height="12" viewBox="0 0 24 18" fill="none"><path d="M12 3C8.13 3 4.64 4.56 2.1 7.1L0 5C3.08 1.9 7.32 0 12 0s8.92 1.9 12 5l-2.1 2.1C19.36 4.56 15.87 3 12 3z" fill="rgba(255,255,255,0.9)"/><path d="M12 9c-2.21 0-4.21.9-5.66 2.34L4.24 9.24C6.22 7.26 8.97 6 12 6s5.78 1.26 7.76 3.24l-2.1 2.1C16.21 9.9 14.21 9 12 9z" fill="rgba(255,255,255,0.9)"/><circle cx="12" cy="15" r="3" fill="rgba(255,255,255,0.9)"/></svg>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <div style={{ width: 22, height: 11, border: '1.5px solid rgba(255,255,255,0.8)', borderRadius: 3, padding: 1.5, display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '75%', height: '100%', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 1.5 }} />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Status bar (landscape) */}
        {isLandscape && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: isTablet ? 0 : 50, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 998, pointerEvents: 'none' }}>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>9:41</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <svg width="14" height="10" viewBox="0 0 16 12" fill="none"><rect x="0" y="4" width="3" height="8" rx="1" fill="rgba(255,255,255,0.9)" /><rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill="rgba(255,255,255,0.9)" /><rect x="9" y="0.5" width="3" height="11.5" rx="1" fill="rgba(255,255,255,0.9)" /><rect x="13.5" y="0" width="2.5" height="12" rx="1" fill="rgba(255,255,255,0.5)" /></svg>
              <div style={{ width: 20, height: 10, border: '1.5px solid rgba(255,255,255,0.8)', borderRadius: 3, padding: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '75%', height: '100%', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 1 }} />
              </div>
            </div>
          </div>
        )}

        {/* Canvas area */}
        <div style={{ position: 'absolute', top: isLandscape ? 40 : 48, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
          <Canvas canvasRef={canvasRef} />
        </div>

        {/* Home indicator (portrait) */}
        {!isLandscape && (
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', width: isTablet ? 100 : 130, height: 5, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 3, zIndex: 999, pointerEvents: 'none' }} />
        )}
        {/* Home indicator (landscape) */}
        {isLandscape && (
          <div style={{ position: 'absolute', right: isTablet ? 10 : 14, top: '50%', transform: 'translateY(-50%)', width: 5, height: isTablet ? 100 : 80, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 3, zIndex: 999, pointerEvents: 'none' }} />
        )}
      </div>
    </div>
  );
});

export default PhoneFrame;
