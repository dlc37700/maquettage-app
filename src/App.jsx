import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ProjectProvider, useProject } from './hooks/useProject';
import Toolbar from './components/Toolbar';
import ComponentPalette from './components/ComponentPalette';
import ScreenManager from './components/ScreenManager';
import PhoneFrame from './components/PhoneFrame';
import PropertiesPanel from './components/PropertiesPanel';
import WelcomeModal from './components/WelcomeModal';
import CollabModal from './components/CollabModal';
import ChatPanel from './components/ChatPanel';
import AdminPanel from './components/AdminPanel';
import MobileLayout from './components/MobileLayout';
import BgRequestNotification from './components/BgRequestNotification';
import TransferNotification from './components/TransferNotification';
import { writeOwnScreens, loadSessionOnce, subscribeToSession, getClientId, registerPresence, listenTransfers } from './services/session';
import { isFirebaseConfigured } from './services/firebase';

const SESSION_STORAGE_KEY = 'maquetapp-session-code';

function AppInner() {
  const { state, dispatch } = useProject();
  const canvasRef = useRef(null);
  const phoneScaleWrapperRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem('maquetapp-visited'));
  const [phoneScale, setPhoneScale] = useState(0.8);
  const [sessionCode, setSessionCode] = useState(null);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isCreator, setIsCreator] = useState(false);
  const [pendingTransfers, setPendingTransfers] = useState([]);

  const closeWelcome = () => {
    localStorage.setItem('maquetapp-visited', '1');
    setShowWelcome(false);
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Debounced write of own screens whenever state changes
  useEffect(() => {
    if (!sessionCode) return;
    const ownScreens = state.screens.filter(s => !s._remote);
    if (ownScreens.length === 0) return;
    const timer = setTimeout(() => {
      writeOwnScreens(sessionCode, ownScreens, state.projectName);
    }, 800);
    return () => clearTimeout(timer);
  }, [state.screens, state.projectName, sessionCode]);

  // Real-time sync of remote screens
  useEffect(() => {
    if (!sessionCode) return;
    const unsub = subscribeToSession(sessionCode, (remoteScreens) => {
      dispatch({ type: 'SYNC_SCREENS', remoteScreens });
    });
    return unsub;
  }, [sessionCode, dispatch]);

  // Presence: mark this client online; auto-remove on disconnect
  useEffect(() => {
    if (!sessionCode || !isFirebaseConfigured) return;
    return registerPresence(sessionCode);
  }, [sessionCode]);

  useEffect(() => {
    if (!sessionCode) return;
    return listenTransfers(sessionCode, getClientId(), setPendingTransfers);
  }, [sessionCode]);

  const joinSession = useCallback((code, sessionData, options = {}) => {
    if (sessionData) dispatch({ type: 'LOAD_PROJECT', project: sessionData });
    if (options.projectName) dispatch({ type: 'SET_PROJECT_NAME', name: options.projectName });
    if (options.initialScreenName) dispatch({ type: 'RENAME_FIRST_OWN_SCREEN', name: options.initialScreenName });
    setIsCreator(options.isCreator || false);
    setSessionCode(code);
    localStorage.setItem(SESSION_STORAGE_KEY, code);
    setShowCollabModal(false);
  }, [dispatch]);

  const leaveSession = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.location.reload();
  }, []);

  // On mount: reconnect to saved session if any
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!saved) return;
    loadSessionOnce(saved).then((sessionData) => {
      if (!sessionData || sessionData.blocked) { localStorage.removeItem(SESSION_STORAGE_KEY); return; }
      dispatch({ type: 'LOAD_PROJECT', project: sessionData });
      setSessionCode(saved);
      setIsCreator(sessionData.creatorId === getClientId());
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const updateScale = () => {
      const dt = state.deviceType ?? 'phone';
      const or = state.orientation ?? 'portrait';
      const frameDims = {
        phone:  { portrait: [430, 932], landscape: [932, 430] },
        tablet: { portrait: [820, 1100], landscape: [1100, 820] },
      };
      const [frameW, frameH] = (frameDims[dt] || frameDims.phone)[or] || frameDims.phone.portrait;
      const availableH = window.innerHeight - 56 - 80;
      const availableW = window.innerWidth - 200 - 158 - 230 - 64;
      const scale = Math.min(1, availableH / frameH, availableW / frameW);
      setPhoneScale(Math.max(0.35, scale));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [state.deviceType, state.orientation]);

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
      const activeScreenObj = state.screens.find(s => s.id === state.activeScreenId);
      if (activeScreenObj?._remote) return;
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

  const modals = (
    <>
      {showWelcome && <WelcomeModal onClose={closeWelcome} />}
      {showCollabModal && (
        <CollabModal
          state={state}
          sessionCode={sessionCode}
          onJoin={joinSession}
          onLeave={leaveSession}
          onClose={() => setShowCollabModal(false)}
        />
      )}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </>
  );

  if (isMobile) {
    return (
      <>
        <MobileLayout
          sessionCode={sessionCode}
          isCreator={isCreator}
          onCollabClick={() => setShowCollabModal(true)}
          onHelp={() => setShowWelcome(true)}
          onAdminClick={() => setShowAdmin(true)}
        />
        {modals}
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: 'Nunito, sans-serif' }}>
      <Toolbar
        sessionCode={sessionCode}
        isCreator={isCreator}
        onCollabClick={() => setShowCollabModal(true)}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ display: 'flex', height: '100%', flexShrink: 0 }}>
          <ScreenManager isCreator={isCreator} sessionCode={sessionCode} />
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
            {/* Screen name badge + device controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ backgroundColor: '#6C63FF', color: 'white', padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: 'Nunito, sans-serif', boxShadow: '0 2px 8px rgba(108,99,255,0.35)' }}>
                {activeScreen?.name || 'Écran'}
              </div>
              <div style={{ color: '#9CA3AF', fontSize: 11, fontFamily: 'Nunito, sans-serif' }}>{state.canvasW ?? 390} × {state.canvasH ?? 844} px</div>
              <div style={{ color: '#9CA3AF', fontSize: 10, fontFamily: 'Nunito, sans-serif', backgroundColor: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: 10 }}>
                {Math.round(phoneScale * 100)}%
              </div>
              {/* Device mode picker */}
              <div style={{ display: 'flex', gap: 2, backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: 10, padding: 3 }}>
                <DeviceBtn active={(state.deviceType ?? 'phone') === 'phone'} title="Téléphone" onClick={() => dispatch({ type: 'SET_DEVICE_MODE', deviceType: 'phone', orientation: state.orientation ?? 'portrait' })}>📱</DeviceBtn>
                <DeviceBtn active={(state.deviceType ?? 'phone') === 'tablet'} title="Tablette" onClick={() => dispatch({ type: 'SET_DEVICE_MODE', deviceType: 'tablet', orientation: state.orientation ?? 'portrait' })}>⬜</DeviceBtn>
                <div style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.1)', margin: '2px 1px' }} />
                <DeviceBtn active={(state.orientation ?? 'portrait') === 'portrait'} title="Portrait" onClick={() => dispatch({ type: 'SET_DEVICE_MODE', deviceType: state.deviceType ?? 'phone', orientation: 'portrait' })}>▯</DeviceBtn>
                <DeviceBtn active={(state.orientation ?? 'portrait') === 'landscape'} title="Paysage" onClick={() => dispatch({ type: 'SET_DEVICE_MODE', deviceType: state.deviceType ?? 'phone', orientation: 'landscape' })}>▭</DeviceBtn>
              </div>
            </div>

            {/* Scaled phone wrapper */}
            {(() => {
              const frameDims = {
                phone:  { portrait: [430, 932], landscape: [932, 430] },
                tablet: { portrait: [820, 1100], landscape: [1100, 820] },
              };
              const [activeFrameW, activeFrameH] = (frameDims[state.deviceType ?? 'phone'] || frameDims.phone)[state.orientation ?? 'portrait'];
              return (
                <div style={{ width: activeFrameW * phoneScale, height: activeFrameH * phoneScale, position: 'relative', flexShrink: 0 }}>
                  <div ref={phoneScaleWrapperRef} style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${phoneScale})`, transformOrigin: 'top left' }}>
                    <PhoneFrame canvasRef={canvasRef} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <PropertiesPanel />
      </div>
      <ChatPanel sessionCode={sessionCode} />
      {modals}
      {sessionCode && <BgRequestNotification sessionCode={sessionCode} />}
      {sessionCode && pendingTransfers.length > 0 && (
        <TransferNotification sessionCode={sessionCode} transfers={pendingTransfers} />
      )}
    </div>
  );
}

function DeviceBtn({ active, title, onClick, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '3px 7px', borderRadius: 7, border: 'none', cursor: 'pointer',
        backgroundColor: active ? '#6C63FF' : 'transparent',
        color: active ? 'white' : '#6B7280',
        fontSize: 13, lineHeight: 1, transition: 'all 0.15s',
        fontFamily: 'Nunito, sans-serif', fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

export default function App() {
  return (
    <ProjectProvider>
      <AppInner />
    </ProjectProvider>
  );
}
