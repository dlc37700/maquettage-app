import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useProject } from '../hooks/useProject';

function AiModal({ sketchDataUrl, onClose, onApply }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

  const generate = () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError('');
    setPreviewUrl('');
    const subject = prompt.trim();
    // Keep subject first and prominent; "dessin de" anchors French words in their French meaning
    // (avoids e.g. "papillon" being interpreted as the dog breed instead of a butterfly)
    const enhanced = `dessin de ${subject}, illustration colorée, fond blanc, style simple et propre`;
    const negative = `dog breed, ugly, blurry, text, watermark, signature`;
    const seed = Math.floor(Math.random() * 99999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?width=512&height=512&model=flux&nologo=true&seed=${seed}&negative=${encodeURIComponent(negative)}`;
    setPreviewUrl(url);
  };

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
            disabled={!prompt.trim() || loading}
            style={{ padding: '10px 16px', backgroundColor: prompt.trim() && !loading ? '#6C63FF' : '#E5E7EB', color: prompt.trim() && !loading ? 'white' : '#9CA3AF', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: prompt.trim() && !loading ? 'pointer' : 'default', flexShrink: 0 }}
          >
            {loading ? '⏳' : '✨ Générer'}
          </button>
        </div>

        {previewUrl && (
          <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', border: '2px solid #DDD6FE', height: 220, backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#F9FAFB' }}>
                <div style={{ fontSize: 36 }}>🎨</div>
                <span style={{ fontSize: 13, color: '#6B7280', fontFamily: 'Nunito, sans-serif' }}>L&apos;IA dessine...</span>
              </div>
            )}
            <img
              src={previewUrl}
              alt="Résultat IA"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: loading ? 'none' : 'block' }}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError("Impossible de générer l'image. Réessayez."); }}
            />
          </div>
        )}

        {error && <p style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          {previewUrl && !loading && (
            <button
              onClick={() => onApply(previewUrl)}
              style={{ flex: 1, padding: '11px 0', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
            >
              ✅ Appliquer
            </button>
          )}
          <button
            onClick={onClose}
            style={{ flex: previewUrl && !loading ? 0 : 1, padding: '11px 20px', backgroundColor: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
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
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen');
  const [penColor, setPenColor] = useState('#1F2937');
  const [lineWidth, setLineWidth] = useState(4);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const lastPt = useRef(null);

  const p = comp.props;
  // Always use refs so effects/handlers read latest values without stale closure issues
  const bgColorRef = useRef(p.bgColor || '#FFFFFF');
  const drawingDataRef = useRef(p.drawingData || null);
  bgColorRef.current = p.bgColor || '#FFFFFF';
  drawingDataRef.current = p.drawingData || null;

  const showAiResult = !!(p.aiImageUrl && p.showAiResult);
  const toolbarH = isReadOnly ? 0 : TOOLBAR_H;
  const canvasW = Math.round(comp.position.width);
  const canvasH = Math.round(comp.position.height - toolbarH);

  // Initialize (or reinitialize) the canvas from saved drawingData
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColorRef.current;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (drawingDataRef.current) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = drawingDataRef.current;
    }
  };

  // Re-init when canvas logical size or background color changes
  useEffect(() => {
    initCanvas();
  }, [canvasW, canvasH, p.bgColor]); // eslint-disable-line react-hooks/exhaustive-deps

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
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (isEraser ? lineWidth * 2.5 : lineWidth) / 2, 0, Math.PI * 2);
    ctx.fillStyle = isEraser ? bgColorRef.current : penColor;
    ctx.fill();
  };

  const handlePointerMove = (e) => {
    if (!isPointerDown || isReadOnly || showAiResult) return;
    e.stopPropagation();
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    const isEraser = tool === 'eraser';
    ctx.beginPath();
    ctx.moveTo(lastPt.current.x, lastPt.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? bgColorRef.current : penColor;
    ctx.lineWidth = isEraser ? lineWidth * 5 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
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
      ctx.fillStyle = bgColorRef.current;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { drawingData: null, aiImageUrl: null, showAiResult: false } });
  };

  const backToDrawing = (e) => {
    e.stopPropagation();
    dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { showAiResult: false } });
  };

  const applyAiImage = (url) => {
    dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { aiImageUrl: url, showAiResult: true } });
    setShowAiModal(false);
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
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: p.borderRadius ?? 8, overflow: 'hidden', border: `1px solid ${p.borderColor || '#E5E7EB'}` }}>

      {!isReadOnly && (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px', backgroundColor: '#F9FAFB', borderBottom: `1px solid ${p.borderColor || '#E5E7EB'}`, flexShrink: 0, height: TOOLBAR_H, boxSizing: 'border-box' }}
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
              <span style={{ fontSize: 11, color: '#10B981', fontFamily: 'Nunito, sans-serif', fontWeight: 700, flex: 1 }}>✨ Image IA</span>
              <button style={btn(false, '#7C3AED')} onClick={e => { e.stopPropagation(); setShowAiModal(true); }}>🔄 Regénérer</button>
              <button style={btn(false, '#6B7280')} onClick={backToDrawing}>✏️ Dessin</button>
              <button style={btn(false, '#EF4444')} onClick={clearDrawing}>🗑️</button>
            </>
          )}
        </div>
      )}

      {/* AI result display – always in DOM so canvas doesn't unmount */}
      <div style={{ display: showAiResult ? 'flex' : 'none', flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: p.bgColor || '#FFFFFF', overflow: 'hidden' }}>
        {p.aiImageUrl && <img src={p.aiImageUrl} alt="IA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
      </div>

      {/* Drawing canvas – kept mounted so content is preserved when switching to/from AI result */}
      <canvas
        ref={canvasRef}
        width={canvasW}
        height={canvasH}
        style={{ display: showAiResult ? 'none' : 'block', flexShrink: 0, cursor: isReadOnly ? 'default' : tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none' }}
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
  );
}
