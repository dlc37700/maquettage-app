import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '../hooks/useProject';
import { useImageLibrary } from '../hooks/useImageLibrary';

// BFS flood-fill background removal. Expects a data URL (no CORS issues).
async function removeBg(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.width, h = img.height;
        const offscreen = document.createElement('canvas');
        offscreen.width = w; offscreen.height = h;
        const ctx = offscreen.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Sample many edge pixels to robustly estimate background colour
        const edgePts = [];
        const step = Math.max(1, Math.floor(Math.min(w, h) / 20));
        for (let x = 0; x < w; x += step) { edgePts.push([x, 0]); edgePts.push([x, h - 1]); }
        for (let y = step; y < h - step; y += step) { edgePts.push([0, y]); edgePts.push([w - 1, y]); }
        let bgR = 0, bgG = 0, bgB = 0;
        edgePts.forEach(([x, y]) => { const i = (y * w + x) * 4; bgR += d[i]; bgG += d[i+1]; bgB += d[i+2]; });
        bgR = Math.round(bgR / edgePts.length);
        bgG = Math.round(bgG / edgePts.length);
        bgB = Math.round(bgB / edgePts.length);

        const T = 48;
        const dist2 = (pi) => { const dr=d[pi]-bgR, dg=d[pi+1]-bgG, db=d[pi+2]-bgB; return dr*dr+dg*dg+db*db; };
        const isBg = (pi) => dist2(pi) < T*T*3;

        // BFS from all edges
        const visited = new Uint8Array(w * h);
        const stack = [];
        for (let x = 0; x < w; x++) { stack.push(x, 0); stack.push(x, h - 1); }
        for (let y = 1; y < h - 1; y++) { stack.push(0, y); stack.push(w - 1, y); }
        let si = 0;
        while (si < stack.length) {
          const x = stack[si++], y = stack[si++];
          const idx = y * w + x;
          if (visited[idx]) continue;
          visited[idx] = 1;
          const pi = idx * 4;
          if (!isBg(pi)) continue;
          d[pi + 3] = 0;
          if (x > 0)   stack.push(x - 1, y);
          if (x < w-1) stack.push(x + 1, y);
          if (y > 0)   stack.push(x, y - 1);
          if (y < h-1) stack.push(x, y + 1);
        }

        // Soft feathering: pixels near the transparent boundary get reduced alpha
        const alpha = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) alpha[i] = d[i * 4 + 3];
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            if (alpha[idx] === 0) continue;
            const hasTransparentNeighbor =
              alpha[(y-1)*w+x] === 0 || alpha[(y+1)*w+x] === 0 ||
              alpha[y*w+(x-1)] === 0 || alpha[y*w+(x+1)] === 0;
            if (hasTransparentNeighbor) d[idx * 4 + 3] = Math.min(d[idx * 4 + 3], 180);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(offscreen.toDataURL('image/png'));
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// Phase 1: Load image without CORS (always works for display — no cache poisoning).
function loadImage(url, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    const img = new Image();
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); reject(new Error('load_error')); };
    img.src = url;
  });
}

// Phase 2 (optional): Try to get pixel-accessible data URL via a separate CORS request.
// Resolves with data URL on success, null on any failure (never rejects).
function tryGetDataUrlCors(url) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 15000);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      clearTimeout(timer);
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || 512;
        c.height = img.naturalHeight || 512;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      } catch { resolve(null); }
    };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = url;
  });
}

const ANIM_TYPES = [
  { id: '',        label: '— Aucune',        icon: '○' },
  { id: 'spin3d',  label: 'Rotation 3D ↻',   icon: '🔄' },
  { id: 'spinz',   label: 'Rotation Z ↺',    icon: '🌀' },
  { id: 'float',   label: 'Flottement ↕',    icon: '🕊️' },
  { id: 'pulse',   label: 'Pulsation ◉',     icon: '💫' },
];

const SUGGESTIONS = ['🌸 Fleur', '🏠 Maison', '🚗 Voiture', '🦋 Papillon', '🐱 Chat', '⭐ Étoile', '🌳 Arbre', '🍎 Pomme'];

function AiModal({ sketchDataUrl, onClose, onApply }) {
  const [prompt, setPrompt] = useState('');
  const [resultDataUrl, setResultDataUrl] = useState('');
  const [step, setStep] = useState('idle'); // idle | fetching | removing | done | error
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [animType, setAnimType] = useState('');
  const [removeBgOn, setRemoveBgOn] = useState(true);
  const inputRef = useRef(null);
  const cancelledRef = useRef(false);
  const timerRef = useRef(null);
  const lastUrlRef = useRef('');

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);
  useEffect(() => { return () => { cancelledRef.current = true; clearInterval(timerRef.current); }; }, []);

  const isWorking = step === 'fetching' || step === 'removing';

  const generate = async (urlOverride) => {
    if (isWorking) return;
    const subject = prompt.trim();
    if (!subject && !urlOverride) return;

    cancelledRef.current = false;
    setStep('fetching');
    setError('');
    setResultDataUrl('');
    setElapsed(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    const seed = Math.floor(Math.random() * 99999);
    const enhanced = animType === 'spin3d'
      ? `rendu 3D photoréaliste de ${subject}, objet seul centré, vue légèrement de face en angle 3/4, fond blanc pur, éclairage studio, haute qualité`
      : `illustration vectorielle colorée de ${subject}, fond blanc pur uni, style flat design moderne, contours nets, objet centré`;
    const negative = animType === 'spin3d'
      ? `background, shadow, multiple objects, text, watermark, ugly, blurry`
      : `background texture, ugly, blurry, text, watermark, signature, multiple objects`;
    const url = urlOverride || `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?width=512&height=512&model=flux&nologo=true&seed=${seed}&negative=${encodeURIComponent(negative)}`;
    lastUrlRef.current = url;

    try {
      // Phase 1: load without CORS — always succeeds if URL is reachable
      await loadImage(url, 90000);
      if (cancelledRef.current) return;

      let finalDataUrl = url; // default: show via URL directly

      // Phase 2: optional bg removal — separate CORS request, silent fallback
      if (removeBgOn) {
        setStep('removing');
        const dataUrl = await tryGetDataUrlCors(url);
        if (!cancelledRef.current && dataUrl) {
          finalDataUrl = await removeBg(dataUrl);
        }
      }

      if (cancelledRef.current) return;
      setResultDataUrl(finalDataUrl);
      setStep('done');
    } catch (e) {
      if (cancelledRef.current) return;
      setStep('error');
      setError(e.message === 'timeout'
        ? "L'image prend trop de temps à générer. Réessayez."
        : "Impossible de charger l'image. Vérifiez votre connexion et réessayez.");
    } finally {
      clearInterval(timerRef.current);
    }
  };

  const cancel = () => {
    cancelledRef.current = true;
    clearInterval(timerRef.current);
    setStep('idle');
    setElapsed(0);
  };

  const retry = () => generate(lastUrlRef.current);

  const progressPct = Math.min(100, (elapsed / 30) * 100);
  const statusLabel = step === 'fetching'
    ? (animType === 'spin3d' ? `🎨 Rendu 3D… ${elapsed}s` : `🎨 L'IA dessine… ${elapsed}s`)
    : step === 'removing' ? '✂️ Suppression du fond…' : null;

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      onClick={isWorking ? undefined : onClose}
      onMouseDown={e => e.stopPropagation()}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: 'white', borderRadius: 20, padding: '28px 28px 24px', width: 440, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', fontFamily: 'Nunito, sans-serif' }}
      >
        <div style={{ fontSize: 38, textAlign: 'center', marginBottom: 6 }}>🤖</div>
        <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#1e1b4b', textAlign: 'center' }}>Générer avec l&apos;IA</h3>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6B7280', lineHeight: 1.5, textAlign: 'center' }}>
          Décrivez ce que vous voulez générer
        </p>

        {sketchDataUrl && (
          <div style={{ marginBottom: 14, borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB', height: 80, backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={sketchDataUrl} alt="Votre dessin" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          </div>
        )}

        {/* Quick suggestion chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
          {SUGGESTIONS.map(s => {
            const label = s.replace(/^.+? /, '');
            return (
              <button
                key={s}
                onClick={() => { setPrompt(label); setTimeout(() => inputRef.current?.focus(), 30); }}
                style={{ padding: '4px 9px', borderRadius: 20, border: '1.5px solid #DDD6FE', backgroundColor: '#F5F3FF', color: '#7C3AED', fontSize: 11, fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' }}
              >
                {s}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            ref={inputRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isWorking && generate()}
            placeholder={animType === 'spin3d' ? 'Ex: une robe, une voiture, un vase…' : 'Ex: un papillon, une maison rouge, un chat…'}
            disabled={isWorking}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #DDD6FE', fontSize: 14, fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box', opacity: isWorking ? 0.6 : 1 }}
          />
          {isWorking ? (
            <button
              onClick={cancel}
              style={{ padding: '10px 14px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
            >
              ✕ Annuler
            </button>
          ) : (
            <button
              onClick={() => generate()}
              disabled={!prompt.trim()}
              style={{ padding: '10px 16px', backgroundColor: prompt.trim() ? '#6C63FF' : '#E5E7EB', color: prompt.trim() ? 'white' : '#9CA3AF', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: prompt.trim() ? 'pointer' : 'default', flexShrink: 0 }}
            >
              ✨ Générer
            </button>
          )}
        </div>

        {/* Options row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280', fontWeight: 700, cursor: 'pointer' }}>
            <input type="checkbox" checked={removeBgOn} onChange={e => setRemoveBgOn(e.target.checked)} style={{ cursor: 'pointer' }} />
            Supprimer le fond
          </label>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700 }}>Animation :</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {ANIM_TYPES.map(a => (
              <button
                key={a.id}
                onClick={() => setAnimType(a.id)}
                title={a.label}
                style={{ padding: '4px 8px', borderRadius: 7, border: `1.5px solid ${animType === a.id ? '#6C63FF' : '#E5E7EB'}`, backgroundColor: animType === a.id ? '#EDE9FE' : '#F9FAFB', color: animType === a.id ? '#6C63FF' : '#6B7280', fontSize: 11, fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' }}
              >
                {a.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        {isWorking && (
          <div style={{ marginBottom: 10, height: 4, backgroundColor: '#EDE9FE', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: '#6C63FF', borderRadius: 2, transition: 'width 0.8s linear' }} />
          </div>
        )}

        {/* Preview */}
        {(isWorking || step === 'done' || step === 'error') && (
          <div style={{
            marginBottom: 14, borderRadius: 12, border: '2px solid #DDD6FE', height: 200,
            background: 'repeating-conic-gradient(#e0e0e0 0% 25%, white 0% 50%) 0 0 / 16px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
          }}>
            {isWorking && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(249,250,251,0.92)' }}>
                <div style={{ fontSize: 32 }}>🎨</div>
                <span style={{ fontSize: 13, color: '#6B7280', fontFamily: 'Nunito, sans-serif' }}>{statusLabel}</span>
              </div>
            )}
            {resultDataUrl && !isWorking && (
              <img
                src={resultDataUrl}
                alt="Résultat IA"
                style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  animation: animType ? `maquetapp-${animType} ${animType === 'float' ? '2s ease-in-out' : animType === 'pulse' ? '1.5s ease-in-out' : '3s linear'} infinite` : undefined,
                  transformOrigin: 'center center',
                }}
              />
            )}
            {step === 'error' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 28 }}>⚠️</span>
                <span style={{ fontSize: 12, color: '#EF4444', fontFamily: 'Nunito, sans-serif', textAlign: 'center', padding: '0 16px' }}>{error}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {step === 'done' && resultDataUrl && (
            <button
              onClick={() => onApply(resultDataUrl, prompt.trim(), animType)}
              style={{ flex: 1, padding: '11px 0', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
            >
              ✅ Appliquer{animType ? ` (${ANIM_TYPES.find(a=>a.id===animType)?.icon})` : ''}
            </button>
          )}
          {step === 'done' && resultDataUrl && (
            <button
              onClick={() => generate()}
              style={{ padding: '11px 14px', backgroundColor: '#EDE9FE', color: '#6C63FF', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
            >
              🔄 Régénérer
            </button>
          )}
          {step === 'error' && (
            <button
              onClick={retry}
              style={{ flex: 1, padding: '11px 0', backgroundColor: '#6C63FF', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
            >
              🔄 Réessayer
            </button>
          )}
          <button
            onClick={isWorking ? undefined : onClose}
            disabled={isWorking}
            style={{ flex: (step === 'done' && resultDataUrl) || step === 'error' ? 0 : 1, padding: '11px 20px', backgroundColor: '#F3F4F6', color: isWorking ? '#D1D5DB' : '#6B7280', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: isWorking ? 'default' : 'pointer', flexShrink: 0 }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const TOOLBAR_H = 34;

export default function DrawingRenderer({ comp, isReadOnly }) {
  const { dispatch } = useProject();
  const { save: saveToLibrary, isFull } = useImageLibrary();
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [penColor, setPenColor] = useState('#1F2937');
  const [lineWidth, setLineWidth] = useState(4);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const lastPt = useRef(null);
  const lastPromptRef = useRef('');
  const lastAnimTypeRef = useRef('');

  const p = comp.props;
  const bgColorRef = useRef(p.bgColor || '#FFFFFF');
  const drawingDataRef = useRef(p.drawingData || null);
  const framelessRef = useRef(!!p.frameless);
  bgColorRef.current = p.bgColor || '#FFFFFF';
  drawingDataRef.current = p.drawingData || null;
  framelessRef.current = !!p.frameless;

  const showAiResult = !!(p.aiImageUrl && p.showAiResult);
  const frameless = !!p.frameless;
  const toolbarH = isReadOnly ? 0 : TOOLBAR_H;
  const canvasW = Math.round(comp.position.width);
  const canvasH = Math.round(comp.position.height - toolbarH);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (framelessRef.current) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = bgColorRef.current;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (drawingDataRef.current) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = drawingDataRef.current;
    }
  };

  useEffect(() => {
    initCanvas();
  }, [canvasW, canvasH, p.bgColor, p.frameless]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCanvas = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { drawingData: dataUrl } });
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy };
  };

  const handlePointerDown = (e) => {
    if (isReadOnly || showAiResult) return;
    e.stopPropagation();
    e.preventDefault();
    setIsPointerDown(true);
    const pos = getPos(e);
    lastPt.current = pos;
    const ctx = canvasRef.current.getContext('2d');
    const isEraser = tool === 'eraser';
    if (isEraser && framelessRef.current) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, lineWidth * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, (isEraser ? lineWidth * 2.5 : lineWidth) / 2, 0, Math.PI * 2);
      ctx.fillStyle = isEraser ? bgColorRef.current : penColor;
      ctx.fill();
    }
  };

  const handlePointerMove = (e) => {
    if (!isPointerDown || isReadOnly || showAiResult) return;
    e.stopPropagation();
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    const isEraser = tool === 'eraser';
    if (isEraser && framelessRef.current) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(lastPt.current.x, lastPt.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.lineWidth = lineWidth * 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.moveTo(lastPt.current.x, lastPt.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = isEraser ? bgColorRef.current : penColor;
      ctx.lineWidth = isEraser ? lineWidth * 5 : lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    lastPt.current = pos;
  };

  const handlePointerUp = (e) => {
    if (!isPointerDown) return;
    e?.stopPropagation();
    setIsPointerDown(false);
    saveCanvas();
  };

  const clearDrawing = (e) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (framelessRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = bgColorRef.current;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { drawingData: null, aiImageUrl: null, showAiResult: false } });
  };

  const backToDrawing = (e) => {
    e.stopPropagation();
    dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { showAiResult: false } });
  };

  const applyAiImage = (dataUrl, promptText, animationType) => {
    lastPromptRef.current = promptText || 'Image IA';
    lastAnimTypeRef.current = animationType || '';
    dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { aiImageUrl: dataUrl, showAiResult: true, animationType: animationType || '' } });
    setShowAiModal(false);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    if (!p.aiImageUrl) return;
    const name = lastPromptRef.current || 'Image IA';
    const animationType = p.animationType || lastAnimTypeRef.current || '';
    const saved = saveToLibrary(p.aiImageUrl, name, { animationType });
    if (saved) {
      // Reset zone so user can generate another image
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (framelessRef.current) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = bgColorRef.current;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
      dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { drawingData: null, aiImageUrl: null, showAiResult: false } });
      setSaveMsg('✅ Sauvegardé !');
      setTimeout(() => setSaveMsg(''), 2500);
    } else {
      setSaveMsg(isFull ? '⚠️ Bibliothèque pleine (20 max)' : '⚠️ Erreur');
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const btn = (active, textColor) => ({
    padding: '3px 8px', height: 26,
    backgroundColor: active ? '#6C63FF' : '#F3F4F6',
    color: active ? 'white' : (textColor || '#374151'),
    border: 'none', borderRadius: 6,
    fontSize: 11, fontFamily: 'Nunito, sans-serif', fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
    flexShrink: 0, whiteSpace: 'nowrap',
  });

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {!isReadOnly && (
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_COMPONENT', id: comp.id }); }}
          title="Supprimer la zone de dessin"
          style={{ position: 'absolute', top: -8, right: -8, zIndex: 20, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#EF4444', border: '2px solid white', color: 'white', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, boxShadow: '0 1px 5px rgba(0,0,0,0.35)', padding: 0 }}
        >×</button>
      )}
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: p.borderRadius ?? 8, overflow: 'hidden', border: frameless ? 'none' : `1px solid ${p.borderColor || '#E5E7EB'}` }}>

      {!isReadOnly && (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px', backgroundColor: frameless ? 'rgba(255,255,255,0.85)' : '#F9FAFB', borderBottom: frameless ? 'none' : `1px solid ${p.borderColor || '#E5E7EB'}`, flexShrink: 0, height: TOOLBAR_H, boxSizing: 'border-box', backdropFilter: frameless ? 'blur(4px)' : undefined, position: frameless ? 'absolute' : undefined, top: frameless ? 0 : undefined, left: frameless ? 0 : undefined, right: frameless ? 0 : undefined, zIndex: frameless ? 2 : undefined, borderRadius: frameless ? '8px 8px 0 0' : undefined }}
          onMouseDown={e => e.stopPropagation()}
        >
          {!showAiResult ? (
            <>
              <button style={btn(tool === 'pen')} onClick={e => { e.stopPropagation(); setTool('pen'); }} title="Stylo">✏️</button>
              <button style={btn(tool === 'eraser')} onClick={e => { e.stopPropagation(); setTool('eraser'); }} title="Gomme">⬜</button>
              <input
                type="color" value={penColor}
                onChange={e => setPenColor(e.target.value)}
                onMouseDown={e => e.stopPropagation()}
                title="Couleur"
                style={{ width: 22, height: 22, padding: 0, border: '1px solid #E5E7EB', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}
              />
              <input
                type="range" min={1} max={24} value={lineWidth}
                onChange={e => setLineWidth(+e.target.value)}
                onMouseDown={e => e.stopPropagation()}
                title={`Épaisseur: ${lineWidth}px`}
                style={{ width: 48, flexShrink: 0 }}
              />
              <div style={{ flex: 1 }} />
              <button style={btn(false, '#7C3AED')} onClick={e => { e.stopPropagation(); setShowAiModal(true); }} title="Générer avec l'IA">
                🤖 IA
              </button>
              <button style={btn(false, '#EF4444')} onClick={clearDrawing} title="Effacer tout">🗑️</button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 11, color: '#10B981', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>✨ Image IA</span>
              {saveMsg && <span style={{ fontSize: 10, color: saveMsg.startsWith('✅') ? '#10B981' : '#F59E0B', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>{saveMsg}</span>}
              <div style={{ flex: 1 }} />
              <button style={btn(false, '#10B981')} onClick={handleSave} title="Sauvegarder dans Mes images">💾 Sauvegarder</button>
              <button style={btn(false, '#7C3AED')} onClick={e => { e.stopPropagation(); setShowAiModal(true); }}>🔄 Regénérer</button>
              <button style={btn(false, '#6B7280')} onClick={backToDrawing}>✏️ Dessin</button>
              <button style={btn(false, '#EF4444')} onClick={clearDrawing}>🗑️</button>
            </>
          )}
        </div>
      )}

      {/* AI result — checkerboard background to show transparency */}
      <div style={{
        display: showAiResult ? 'flex' : 'none', flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        background: frameless
          ? 'transparent'
          : 'repeating-conic-gradient(#ebebeb 0% 25%, white 0% 50%) 0 0 / 16px 16px',
      }}>
        {p.aiImageUrl && <img src={p.aiImageUrl} alt="IA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
      </div>

      {/* Drawing canvas – kept mounted so content is preserved when switching to/from AI result */}
      <canvas
        ref={canvasRef}
        width={canvasW}
        height={canvasH}
        style={{ display: showAiResult ? 'none' : 'block', flexShrink: 0, cursor: isReadOnly ? 'default' : tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none', marginTop: frameless && !isReadOnly ? TOOLBAR_H : 0 }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />

      {showAiModal && (
        <AiModal
          sketchDataUrl={p.drawingData || null}
          onClose={() => setShowAiModal(false)}
          onApply={applyAiImage}
        />
      )}
    </div>
    </div>
  );
}
