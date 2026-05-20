import React, { useRef, useEffect, useCallback } from 'react';
import { useProject, useActiveScreen } from '../hooks/useProject';
import * as LucideIcons from 'lucide-react';
import * as TablerIcons from '@tabler/icons-react';

const CANVAS_W = 390;
const CANVAS_H = 844;

function LucideIcon({ name, size = 24, color = '#6C63FF' }) {
  const Icon = LucideIcons[name];
  if (!Icon) return <LucideIcons.Circle size={size} color={color} />;
  return <Icon size={size} color={color} />;
}

function AnyIcon({ name, iconSet, size = 24, color = '#6C63FF', strokeWidth = 2 }) {
  if (!name) return null;
  if (iconSet === 'tabler') {
    const T = TablerIcons[name];
    return T ? <T size={size} color={color} stroke={color} /> : null;
  }
  const L = LucideIcons[name];
  return L ? <L size={size} color={color} strokeWidth={strokeWidth} /> : null;
}

function getBg(bgColor, bgGradient) {
  if (bgGradient && bgGradient.from && bgGradient.to) {
    return { background: `linear-gradient(${bgGradient.angle ?? 135}deg, ${bgGradient.from}, ${bgGradient.to})` };
  }
  return { backgroundColor: bgColor };
}

function ComponentRenderer({ comp }) {
  const { type, props, position: pos } = comp;
  const iconSize = Math.min(pos.width, pos.height) * 0.55;

  switch (type) {
    case 'button': {
      const iconOnly = props.iconPosition === 'only';
      const useEmoji = iconOnly && props.emoji;
      return (
        <div style={{
          width: '100%', height: '100%',
          ...getBg(props.bgColor, props.bgGradient), color: props.textColor,
          fontSize: props.fontSize, borderRadius: props.borderRadius,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontFamily: `${props.fontFamily || 'Nunito'}, sans-serif`,
          boxShadow: props.bgColor === 'transparent' ? 'none' : '0 2px 8px rgba(0,0,0,0.15)',
          gap: 6, padding: '0 12px', overflow: 'hidden',
        }}>
          {useEmoji
            ? <span style={{ fontSize: Math.min(pos.width, pos.height) * 0.52, lineHeight: 1 }}>{props.emoji}</span>
            : <>
                {props.iconName && props.iconPosition !== 'right' && <AnyIcon name={props.iconName} iconSet={props.iconSet || 'lucide'} size={props.fontSize + 4} color={props.textColor} strokeWidth={2.5} />}
                {!iconOnly && props.label && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: props.fontStyle || 'normal', textDecoration: props.textDecoration || 'none' }}>{props.label}</span>}
                {props.iconName && props.iconPosition === 'right' && <AnyIcon name={props.iconName} iconSet={props.iconSet || 'lucide'} size={props.fontSize + 4} color={props.textColor} strokeWidth={2.5} />}
              </>
          }
        </div>
      );
    }

    case 'text': {
      const fw = props.fontWeight === 'bold' ? 700 : props.fontWeight === 'semibold' ? 600 : 400;
      const vAlign = props.verticalAlign === 'top' ? 'flex-start' : props.verticalAlign === 'bottom' ? 'flex-end' : 'center';
      return <div style={{ width: '100%', height: '100%', color: props.textColor, fontSize: props.fontSize, fontWeight: fw, fontFamily: `${props.fontFamily || 'Nunito'}, sans-serif`, fontStyle: props.fontStyle || 'normal', textDecoration: props.textDecoration || 'none', textAlign: props.textAlign || 'left', display: 'flex', alignItems: vAlign, lineHeight: 1.4, overflow: 'hidden', padding: '2px 4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{props.label}</div>;
    }

    case 'input':
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
          {props.label && <div style={{ fontSize: 11, color: '#6B7280', fontFamily: `${props.fontFamily || 'Nunito'}, sans-serif`, fontWeight: 600 }}>{props.label}</div>}
          <div style={{ flex: 1, ...getBg(props.bgColor, props.bgGradient), border: '1.5px solid #D1D5DB', borderRadius: props.borderRadius, color: props.textColor, fontSize: 14, padding: '0 12px', display: 'flex', alignItems: 'center', fontFamily: `${props.fontFamily || 'Nunito'}, sans-serif` }}>{props.placeholder}</div>
        </div>
      );

    case 'checkbox':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: '100%' }}>
          <div style={{ width: 20, height: 20, border: `2px solid ${props.accentColor || '#6C63FF'}`, borderRadius: 5, backgroundColor: props.checked ? (props.accentColor || '#6C63FF') : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {props.checked && <LucideIcons.Check size={13} color="white" strokeWidth={3} />}
          </div>
          <span style={{ color: props.textColor, fontSize: props.fontSize || 14, fontFamily: `${props.fontFamily || 'Nunito'}, sans-serif` }}>{props.label}</span>
        </div>
      );

    case 'radio':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: '100%' }}>
          <div style={{ width: 20, height: 20, border: `2px solid ${props.accentColor || '#6C63FF'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {props.checked && <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: props.accentColor || '#6C63FF' }} />}
          </div>
          <span style={{ color: props.textColor, fontSize: props.fontSize || 14, fontFamily: `${props.fontFamily || 'Nunito'}, sans-serif` }}>{props.label}</span>
        </div>
      );

    case 'image':
      if (props.imageData) {
        return (
          <div style={{ width: '100%', height: '100%', borderRadius: props.borderRadius || 8, overflow: 'hidden' }}>
            <img src={props.imageData} alt="" style={{ width: '100%', height: '100%', objectFit: props.objectFit || 'cover', display: 'block' }} />
          </div>
        );
      }
      return (
        <div style={{ width: '100%', height: '100%', ...getBg(props.bgColor, props.bgGradient), borderRadius: props.borderRadius || 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #D1D5DB' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: Math.min(pos.width, pos.height) * 0.28 }}>🖼️</div>
            <div style={{ fontSize: 11, marginTop: 4, fontFamily: 'Nunito, sans-serif', color: '#9CA3AF' }}>Cliquer pour importer</div>
          </div>
        </div>
      );

    case 'avatar':
      if (props.imageData) {
        return (
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
            <img src={props.imageData} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        );
      }
      if (props.emoji) {
        return (
          <div style={{ width: '100%', height: '100%', ...getBg(props.bgColor, props.bgGradient), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <span style={{ fontSize: Math.min(pos.width, pos.height) * 0.55, lineHeight: 1 }}>{props.emoji}</span>
          </div>
        );
      }
      return <div style={{ width: '100%', height: '100%', ...getBg(props.bgColor, props.bgGradient), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><LucideIcons.User size={Math.min(pos.width, pos.height) * 0.55} color="white" /></div>;

    case 'icon':
      return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AnyIcon name={props.iconName} iconSet={props.iconSet || 'lucide'} color={props.color} size={Math.max(16, iconSize)} /></div>;

    case 'navbar':
      return (
        <div style={{ width: '100%', height: '100%', ...getBg(props.bgColor, props.bgGradient), borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px' }}>
          {['Home', 'Search', 'Heart', 'User'].map((ic, i) => (
            <div key={ic} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <LucideIcon name={ic} color={i === 0 ? props.activeColor : '#9CA3AF'} size={22} />
              {i === 0 && <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: props.activeColor }} />}
            </div>
          ))}
        </div>
      );

    case 'header':
      return (
        <div style={{ width: '100%', height: '100%', ...getBg(props.bgColor, props.bgGradient), display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
          {props.showBack && <LucideIcon name="ArrowLeft" color={props.textColor} size={20} />}
          <span style={{ color: props.textColor, fontSize: 18, fontWeight: 700, fontFamily: `${props.fontFamily || 'Nunito'}, sans-serif`, flex: 1, textAlign: props.textAlign || 'left' }}>{props.title}</span>
        </div>
      );

    case 'card':
      if (props.backgroundImage) {
        return <div style={{ width: '100%', height: '100%', borderRadius: props.borderRadius, boxShadow: '0 2px 16px rgba(0,0,0,0.10)', overflow: 'hidden' }}>
          <img src={props.backgroundImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>;
      }
      return <div style={{ width: '100%', height: '100%', ...getBg(props.bgColor, props.bgGradient), borderRadius: props.borderRadius, boxShadow: '0 2px 16px rgba(0,0,0,0.10)' }} />;

    case 'switch':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
          <span style={{ color: '#1F2937', fontSize: props.fontSize || 14, fontFamily: `${props.fontFamily || 'Nunito'}, sans-serif`, flex: 1 }}>{props.label}</span>
          <div style={{ width: 46, height: 26, backgroundColor: props.checked ? props.activeColor : '#D1D5DB', borderRadius: 13, position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, left: props.checked ? 23 : 3, width: 20, height: 20, backgroundColor: 'white', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', transition: 'left 0.15s' }} />
          </div>
        </div>
      );

    case 'slider':
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: `${props.value}%`, height: '100%', backgroundColor: props.activeColor, borderRadius: 3 }} />
            <div style={{ position: 'absolute', left: `${props.value}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 18, height: 18, backgroundColor: props.activeColor, borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
          </div>
        </div>
      );

    case 'listitem':
      return (
        <div style={{ width: '100%', height: '100%', ...getBg(props.bgColor, props.bgGradient), borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12 }}>
          <div style={{ width: 34, height: 34, backgroundColor: '#EDE9FE', borderRadius: 9, flexShrink: 0 }} />
          <span style={{ flex: 1, color: props.textColor, fontSize: 14, fontFamily: `${props.fontFamily || 'Nunito'}, sans-serif`, fontWeight: 600 }}>{props.label}</span>
          <LucideIcons.ChevronRight size={16} color="#9CA3AF" />
        </div>
      );

    case 'badge':
      return <div style={{ width: '100%', height: '100%', ...getBg(props.bgColor, props.bgGradient), borderRadius: '50%', color: props.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.min(pos.width, pos.height) * 0.38, fontWeight: 700, fontFamily: `${props.fontFamily || 'Nunito'}, sans-serif` }}>{props.count}</div>;

    case 'separator':
      return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}><div style={{ width: '100%', height: 1.5, backgroundColor: props.color }} /></div>;

    case 'colorblock':
      if (props.backgroundImage) {
        return <div style={{ width: '100%', height: '100%', borderRadius: props.borderRadius || 0, overflow: 'hidden' }}>
          <img src={props.backgroundImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>;
      }
      return <div style={{ width: '100%', height: '100%', ...getBg(props.bgColor, props.bgGradient), borderRadius: props.borderRadius }} />;

    default:
      return <div style={{ width: '100%', height: '100%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#6B7280', fontFamily: 'Nunito, sans-serif' }}>{type}</div>;
  }
}

export default function Canvas({ canvasRef }) {
  const { state, dispatch } = useProject();
  const screen = useActiveScreen();
  const localRef = useRef(null);
  const ref = canvasRef || localRef;
  const dragState = useRef(null);

  // Calculate scale factors based on rendered size vs logical size
  const getScale = useCallback(() => {
    if (!ref.current) return { scaleX: 1, scaleY: 1 };
    const rect = ref.current.getBoundingClientRect();
    return {
      scaleX: CANVAS_W / (rect.width || CANVAS_W),
      scaleY: CANVAS_H / (rect.height || CANVAS_H),
    };
  }, [ref]);

  const handleCanvasClick = useCallback((e) => {
    if (e.target === ref.current) dispatch({ type: 'SET_SELECTED_COMPONENT', id: null });
  }, [dispatch, ref]);

  const handleDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');
    if (!componentType) return;
    const rect = ref.current.getBoundingClientRect();
    const { scaleX, scaleY } = getScale();
    const overrideRaw = e.dataTransfer.getData('overrideProps');
    const overrideProps = overrideRaw ? JSON.parse(overrideRaw) : undefined;
    const sizeRaw = e.dataTransfer.getData('overrideSize');
    const overrideSize = sizeRaw ? JSON.parse(sizeRaw) : undefined;
    dispatch({
      type: 'ADD_COMPONENT',
      componentType,
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
      overrideProps,
      overrideSize,
    });
  }, [dispatch, ref, getScale]);

  const handleComponentMouseDown = useCallback((e, compId) => {
    if (e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    dispatch({ type: 'SET_SELECTED_COMPONENT', id: compId });
    const screen = state.screens.find(s => s.id === state.activeScreenId);
    const comp = screen?.components.find(c => c.id === compId);
    if (!comp) return;
    const { scaleX, scaleY } = getScale();
    dragState.current = {
      type: 'move', compId,
      startMouseX: e.clientX, startMouseY: e.clientY,
      origX: comp.position.x, origY: comp.position.y,
      width: comp.position.width, height: comp.position.height,
      scaleX, scaleY,
    };
  }, [state, dispatch, getScale]);

  const handleResizeMouseDown = useCallback((e, compId, handle) => {
    if (e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    const screen = state.screens.find(s => s.id === state.activeScreenId);
    const comp = screen?.components.find(c => c.id === compId);
    if (!comp) return;
    const { scaleX, scaleY } = getScale();
    dragState.current = {
      type: 'resize', compId, handle,
      startMouseX: e.clientX, startMouseY: e.clientY,
      origX: comp.position.x, origY: comp.position.y,
      origW: comp.position.width, origH: comp.position.height,
      scaleX, scaleY,
    };
  }, [state, getScale]);

  useEffect(() => {
    const MIN_SIZE = 20;
    const onMouseMove = (e) => {
      const ds = dragState.current;
      if (!ds) return;
      const dx = (e.clientX - ds.startMouseX) * ds.scaleX;
      const dy = (e.clientY - ds.startMouseY) * ds.scaleY;
      if (ds.type === 'move') {
        dispatch({ type: 'MOVE_COMPONENT', id: ds.compId, x: Math.max(0, Math.min(ds.origX + dx, CANVAS_W - ds.width)), y: Math.max(0, Math.min(ds.origY + dy, CANVAS_H - ds.height)) });
      } else if (ds.type === 'resize') {
        let { origX: x, origY: y, origW: w, origH: h } = ds;
        switch (ds.handle) {
          case 'se': w = Math.max(MIN_SIZE, ds.origW + dx); h = Math.max(MIN_SIZE, ds.origH + dy); break;
          case 'sw': w = Math.max(MIN_SIZE, ds.origW - dx); x = ds.origX + ds.origW - w; h = Math.max(MIN_SIZE, ds.origH + dy); break;
          case 'ne': w = Math.max(MIN_SIZE, ds.origW + dx); h = Math.max(MIN_SIZE, ds.origH - dy); y = ds.origY + ds.origH - h; break;
          case 'nw': w = Math.max(MIN_SIZE, ds.origW - dx); x = ds.origX + ds.origW - w; h = Math.max(MIN_SIZE, ds.origH - dy); y = ds.origY + ds.origH - h; break;
        }
        x = Math.max(0, x); y = Math.max(0, y);
        w = Math.min(w, CANVAS_W - x); h = Math.min(h, CANVAS_H - y);
        dispatch({ type: 'RESIZE_COMPONENT', id: ds.compId, x, y, width: w, height: h });
      }
    };
    const onMouseUp = (e) => {
      const ds = dragState.current;
      if (!ds) return;
      const dx = (e.clientX - ds.startMouseX) * ds.scaleX;
      const dy = (e.clientY - ds.startMouseY) * ds.scaleY;
      if (ds.type === 'move') {
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) dispatch({ type: 'COMMIT_MOVE', id: ds.compId, x: Math.max(0, Math.min(ds.origX + dx, CANVAS_W - ds.width)), y: Math.max(0, Math.min(ds.origY + dy, CANVAS_H - ds.height)) });
      } else if (ds.type === 'resize') {
        const screen = state.screens.find(s => s.id === state.activeScreenId);
        const comp = screen?.components.find(c => c.id === ds.compId);
        if (comp) dispatch({ type: 'COMMIT_RESIZE', id: ds.compId, x: comp.position.x, y: comp.position.y, width: comp.position.width, height: comp.position.height });
      }
      dragState.current = null;
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
  }, [dispatch, state]);

  if (!screen) return null;
  const sortedComponents = [...(screen.components || [])].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
  const isRemote = !!screen._remote;
  const screenBg = screen.backgroundImage
    ? { backgroundImage: `url(${screen.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
    : getBg(screen.backgroundColor, screen.backgroundGradient);

  return (
    <div ref={ref}
      onClick={isRemote ? undefined : handleCanvasClick}
      onDragOver={isRemote ? undefined : handleDragOver}
      onDrop={isRemote ? undefined : handleDrop}
      style={{ ...screenBg, position: 'relative', width: CANVAS_W, height: CANVAS_H, overflow: 'hidden', flexShrink: 0 }}>
      {sortedComponents.map((comp) => {
        const isSelected = !isRemote && comp.id === state.selectedComponentId;
        const { x, y, width, height } = comp.position;
        return (
          <div key={comp.id}
            className={isRemote ? undefined : 'canvas-component'}
            onMouseDown={isRemote ? undefined : (e) => handleComponentMouseDown(e, comp.id)}
            style={{ left: x, top: y, width, height, opacity: comp.props.opacity ?? 1, zIndex: comp.zIndex || 1, outline: isSelected ? '2px solid #6C63FF' : undefined, outlineOffset: isSelected ? '1px' : undefined }}>
            <div className="component-outline" style={{ width: '100%', height: '100%' }}>
              <ComponentRenderer comp={comp} />
            </div>
            {!isRemote && comp.props?.navigateTo && (
              <div style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, backgroundColor: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
                <span style={{ fontSize: 9, color: 'white', lineHeight: 1 }}>🔗</span>
              </div>
            )}
            {isSelected && ['nw', 'ne', 'sw', 'se'].map((h) => (
              <div key={h} className={`resize-handle ${h}`} onMouseDown={(e) => handleResizeMouseDown(e, comp.id, h)} />
            ))}
          </div>
        );
      })}
      {/* Read-only overlay for remote screens */}
      {isRemote && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 9999, cursor: 'default' }} title={`Écran de ${screen._nickname || 'un camarade'} — lecture seule`} />
      )}
    </div>
  );
}
