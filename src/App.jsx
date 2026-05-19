import React, { useEffect, useRef, useState } from 'react';
import { ProjectProvider, useProject } from './hooks/useProject';
import Toolbar from './components/Toolbar';
import ComponentPalette from './components/ComponentPalette';
import ScreenManager from './components/ScreenManager';
import PhoneFrame from './components/PhoneFrame';
import PropertiesPanel from './components/PropertiesPanel';
import WelcomeModal from './components/WelcomeModal';

function AppInner() {
  const { state, dispatch } = useProject();
  const canvasRef = useRef(null);
  const phoneScaleWrapperRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('maquetapp-visited'));
  const [phoneScale, setPhoneScale] = useState(0.8);

  const closeWelcome = () => {
    localStorage.setItem('maquetapp-visited', '1');
    setShowWelcome(false);
  };

  useEffect(() => {
    const updateScale = () => {
      const availableH = window.innerHeight - 56 - 80;
      const availableW = window.innerWidth - 200 - 158 - 230 - 64;
      const phoneH = 932;
      const phoneW = 430;
      const scale = Math.min(1, availableH / phoneH, availableW / phoneW);
      setPhoneScale(Math.max(0.45, scale));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); dispatch({ type: 'UNDO' }); return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault(); dispatch({ type: 'REDO' }); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (state.selectedComponentId) dispatch({ type: 'DUPLICATE_COMPONENT', id: state.selectedComponentId });
        return;
      }
      if (!isTyping && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (state.selectedComponentId) { e.preventDefault(); dispatch({ type: 'DELETE_COMPONENT', id: state.selectedComponentId }); }
        return;
      }
      if (e.key === 'Escape') dispatch({ type: 'SET_SELECTED_COMPONENT', id: null });
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dispatch, state.selectedComponentId]);

  const activeScreen = state.screens.find(s => s.id === state.activeScreenId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'Nunito, sans-serif' }}>
      <Toolbar canvasRef={canvasRef} phoneScaleWrapperRef={phoneScaleWrapperRef} onHelp={() => setShowWelcome(true)} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ display: 'flex', height: '100%', flexShrink: 0 }}>
          <ScreenManager />
          <ComponentPalette />
        </div>

        {/* Center canvas area */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'auto', background: 'linear-gradient(135deg, #f1f0ff 0%, #e8f4fd 50%, #f0fdf4 100%)',
          padding: '16px', position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #c4b5fd 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.3, pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {/* Screen name badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ backgroundColor: '#6C63FF', color: 'white', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif', boxShadow: '0 2px 8px rgba(108,99,255,0.35)' }}>
                📱 {activeScreen?.name || 'Écran'}
              </div>
              <div style={{ color: '#9CA3AF', fontSize: 11, fontFamily: 'Nunito, sans-serif' }}>390 × 844 px</div>
              <div style={{ color: '#9CA3AF', fontSize: 10, fontFamily: 'Nunito, sans-serif', backgroundColor: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: 10 }}>
                {Math.round(phoneScale * 100)}%
              </div>
            </div>

            {/* Scaled phone wrapper */}
            <div style={{ width: 430 * phoneScale, height: 932 * phoneScale, position: 'relative', flexShrink: 0 }}>
              <div ref={phoneScaleWrapperRef} style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${phoneScale})`, transformOrigin: 'top left' }}>
                <PhoneFrame canvasRef={canvasRef} />
              </div>
            </div>
          </div>
        </div>

        <PropertiesPanel />
      </div>
      {showWelcome && <WelcomeModal onClose={closeWelcome} />}
    </div>
  );
}

export default function App() {
  return (
    <ProjectProvider>
      <AppInner />
    </ProjectProvider>
  );
}
