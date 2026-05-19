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
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('maquetapp-visited');
  });

  const closeWelcome = () => {
    localStorage.setItem('maquetapp-visited', '1');
    setShowWelcome(false);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (state.selectedComponentId) {
          dispatch({ type: 'DUPLICATE_COMPONENT', id: state.selectedComponentId });
        }
        return;
      }
      if (!isTyping && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (state.selectedComponentId) {
          e.preventDefault();
          dispatch({ type: 'DELETE_COMPONENT', id: state.selectedComponentId });
        }
        return;
      }
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_SELECTED_COMPONENT', id: null });
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dispatch, state.selectedComponentId]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: 'Nunito, sans-serif',
    }}>
      <Toolbar canvasRef={canvasRef} onHelp={() => setShowWelcome(true)} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Left: Screen Manager + Component Palette */}
        <div style={{ display: 'flex', height: '100%', flexShrink: 0 }}>
          <ScreenManager />
          <ComponentPalette />
        </div>

        {/* Center: Canvas area */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          background: 'linear-gradient(135deg, #f1f0ff 0%, #e8f4fd 50%, #f0fdf4 100%)',
          padding: '32px 24px',
          position: 'relative',
        }}>
          {/* Grid pattern */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, #c4b5fd 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.3,
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Screen name badge */}
            <div style={{
              textAlign: 'center',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
              <div style={{
                backgroundColor: '#6C63FF',
                color: 'white',
                padding: '4px 16px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'Nunito, sans-serif',
                boxShadow: '0 2px 8px rgba(108,99,255,0.35)',
              }}>
                📱 {state.screens.find(s => s.id === state.activeScreenId)?.name || 'Écran'}
              </div>
              <div style={{
                color: '#9CA3AF', fontSize: 11, fontFamily: 'Nunito, sans-serif',
              }}>
                390 × 844 px
              </div>
            </div>

            <PhoneFrame canvasRef={canvasRef} />
          </div>
        </div>

        {/* Right: Properties Panel */}
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
