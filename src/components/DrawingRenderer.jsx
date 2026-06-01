import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '../hooks/useProject';
import { useImageLibrary } from '../hooks/useImageLibrary';

// BFS flood-fill from all edges to remove uniform background, outputs transparent PNG data URL.
// Falls back to original URL if CORS or canvas access fails.
async function removeBg(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.width, h = img.height;
        const offscreen = document.createElement('canvas');
        offscreen.width = w;
        offscreen.height = h;
        const ctx = offscreen.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Sample 8 points around the edges to estimate background color
        const pts = [[0,0],[w-1,0],[0,h-1],[w-1,h-1],[Math.floor(w/2),0],[0,Math.floor(h/2)],[w-1,Math.floor(h/2)],[Math.floor(w/2),h-1]];
        let bgR=0, bgG=0, bgB=0;
        pts.forEach(([x,y]) => { const i=(y*w+x)*4; bgR+=d[i]; bgG+=d[i+1]; bgB+=d[i+2]; });
        bgR=Math.round(bgR/pts.length); bgG=Math.round(bgG/pts.length); bgB=Math.round(bgB/pts.length);

        const T = 40; // colour distance threshold
        const isBg = (pi) => {
          const dr=d[pi]-bgR, dg=d[pi+1]-bgG, db=d[pi+2]-bgB;
          return (dr*dr + dg*dg + db*db) < T*T*3;
        };

        const visited = new Uint8Array(w * h);
        const stack = [];
        for (let x=0; x<w; x++) { stack.push(x, 0); stack.push(x, h-1); }
        for (let y=1; y<h-1; y++) { stack.push(0, y); stack.push(w-1, y); }

        let si = 0;
        while (si < stack.length) {
          const x=stack[si++], y=stack[si++];
          const idx=y*w+x;
          if (visited[idx]) continue;
          visited[idx]=1;
          const pi=idx*4;
          if (!isBg(pi)) continue;
          d[pi+3]=0;
          if (x>0)   { stack.push(x-1, y); }
          if (x<w-1) { stack.push(x+1, y); }
          if (y>0)   { stack.push(x, y-1); }
          if (y<h-1) { stack.push(x, y+1); }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(offscreen.toDataURL('image/png'));
      } catch {
        resolve(url); // CORS blocked — use original
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

function AiModal({ sketchDataUrl, onClose, onApply }) {
  const [prompt, setPrompt] = useState('');
  const [pollinationsUrl, setPollinationsUrl] = useState('');
  const [resultDataUrl, setResultDataUrl] = useState('');
  const [step, setStep] = useState('idle'); // idle | fetching | removing | done | error
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

  const generate = () => {
    if (!prompt.trim() || step === 'fetching' || step === 'removing') return;
    setStep('fetching');
    setError('');
    setResultDataUrl('');
    const subject = prompt.trim();
    const enhanced = `dessin de ${subject}, illustration colorée, fond blanc, style simple et propre`;
    const negative = `dog breed, ugly, blurry, text, watermark, signature`;
    const seed = Math.floor(Math.random() * 99999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?width=512&height=512&model=flux&nologo=true&seed=${seed}&negative=${encodeURIComponent(negative)}`;
    setPollinationsUrl(url);
  };

  const handleImgLoad = async () => {
    setStep('removing');
    const dataUrl = await removeBg(pollinationsUrl);
    setResultDataUrl(dataUrl);
    setStep('done');
  };

  const handleImgError = () => {
    setStep('error');
    setError("Impossible de générer l'image. Réessayez.");
  };

  const isWorking = step === 'fetching' || step === 'removing';
  const canApply = step === 'done' && resultDataUrl;

  const statusLabel = step === 'fetching' ? '🎨 L\'IA dessine…' : step === 'removing' ? '✂️ Détourage…' : null;

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      onMouseDown={e => e.stopPropagation()}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: 'white', borderRadius: 20, padding: '28px 28px 24px', width: 440, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', fontFamily: 'Nunito, sans-serif' }}
      >
        <div style={{ fontSize: 38, textAlign: 'center', marginBottom: 6 }}>🤖</div>
        <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: '#1e1b4b', textAlign: 'center' }}>Améliorer avec l&apos;IA</h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.5, textAlign: 'center' }}>
          Décrivez votre dessin (ex : <em>un papillon</em>, <em>une maison</em>)
        </p>

        {sketchDataUrl && (
          <div style={{ marginBottom: 14, borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB', height: 100, backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={sketchDataUrl} alt="Votre dessin" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            ref={inputRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generate()}
            placeholder="Ex: un papillon, une maison rouge, un chat qui dort..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #DDD6FE', fontSize: 14, fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box' }}
          />
          <button
            onClick={generate}
            disabled={!prompt.trim() || isWorking}
            style={{ padding: '10px 16px', backgroundColor: prompt.trim() && !isWorking ? '#6C63FF' : '#E5E7EB', color: prompt.trim() && !isWorking ? 'white' : '#9CA3AF', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: prompt.trim() && !isWorking ? 'pointer' : 'default', flexShrink: 0 }}
          >
            {isWorking ? '⏳' : '✨ Générer'}
          </button>
        </div>

        {/* Hidden img to trigger Pollinations load + CORS for canvas */}
        {pollinationsUrl && (
          <img
            key={pollinationsUrl}
            src={pollinationsUrl}
            crossOrigin="anonymous"
            style={{ display: 'none' }}
            onLoad={handleImgLoad}
            onError={handleImgError}
          />
        )}

        {/* Preview with checkerboard to show transparency */}
        {(isWorking || canApply) && (
          <div style={{
            marginBottom: 16, borderRadius: 12, border: '2px solid #DDD6FE', height: 220,
            background: 'repeating-conic-gradient(#e0e0e0 0% 25%, white 0% 50%) 0 0 / 16px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
          }}>
            {isWorking && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(249,250,251,0.92)' }}>
                <div style={{ fontSize: 36 }}>🎨</div>
                <span style={{ fontSize: 13, color: '#6B7280', fontFamily: 'Nunito, sans-serif' }}>{statusLabel}</span>
              </div>
            )}
            {resultDataUrl && (
              <img src={resultDataUrl} alt="Résultat IA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}
          </div>
        )}

        {error && <p style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          {canApply && (
            <button
              onClick={() => onApply(resultDataUrl, prompt.trim())}
              style={{ flex: 1, padding: '11px 0', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
            >
              ✅ Appliquer
            </button>
          )}
          <button
            onClick={onClose}
            style={{ flex: canApply ? 0 : 1, padding: '11px 20px', backgroundColor: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Annuler
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

  const applyAiImage = (dataUrl, promptText) => {
    lastPromptRef.current = promptText || 'Image IA';
    dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { aiImageUrl: dataUrl, showAiResult: true } });
    setShowAiModal(false);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    if (!p.aiImageUrl) return;
    const name = lastPromptRef.current || 'Image IA';
    const saved = saveToLibrary(p.aiImageUrl, name);
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
