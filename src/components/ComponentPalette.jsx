import React, { useState, useRef, useEffect } from 'react';
import { removeBg, waitForImage, imageUrlToDataUrl } from '../utils/aiImageUtils';
import { COMPONENT_DEFINITIONS, BUTTON_PRESETS, AVATAR_PRESETS } from '../data/componentDefinitions';
import { useProject } from '../hooks/useProject';
import { useImageLibrary } from '../hooks/useImageLibrary';

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

const PRESET_BTN_SIZE = { width: 64, height: 64 };
const PRESET_AVATAR_SIZE = { width: 64, height: 64 };

const CATEGORY_ICONS = {
  Navigation: '🧭', Social: '👥', Communication: '💬',
  Actions: '⚡', Commerce: '🛒', Médias: '🎬', Quotidien: '☀️',
};

export default function ComponentPalette({ mobile = false }) {
  const { dispatch, state } = useProject();
  const { images, remove: removeImage } = useImageLibrary();
  const [search, setSearch] = useState('');
  const [openPresets, setOpenPresets] = useState(true);
  const [openCategories, setOpenCategories] = useState({});
  const [openAvatars, setOpenAvatars] = useState(true);
  const [openImages, setOpenImages] = useState(true);
  const [openAiImages, setOpenAiImages] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStep, setAiStep] = useState('idle'); // idle | fetching | removing | done | error
  const [aiResult, setAiResult] = useState('');
  const [aiElapsed, setAiElapsed] = useState(0);
  const [aiRemoveBgOn, setAiRemoveBgOn] = useState(true);
  const aiCancelledRef = useRef(false);
  const aiTimerRef = useRef(null);

  useEffect(() => () => { aiCancelledRef.current = true; clearInterval(aiTimerRef.current); }, []);

  const generateAiImage = async () => {
    const subject = aiPrompt.trim();
    if (!subject || aiStep === 'fetching' || aiStep === 'removing') return;
    aiCancelledRef.current = false;
    setAiStep('fetching');
    setAiResult('');
    setAiElapsed(0);
    clearInterval(aiTimerRef.current);
    aiTimerRef.current = setInterval(() => setAiElapsed(e => e + 1), 1000);

    const seed = Math.floor(Math.random() * 99999);
    const enhanced = `${subject}, flat design illustration, white background, centered, colorful, clean`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?width=512&height=512&nologo=true&seed=${seed}`;

    try {
      // Use <img> tag — no CORS restriction for display, works even without CORS headers
      await waitForImage(url, 90000);
      if (aiCancelledRef.current) { clearInterval(aiTimerRef.current); return; }

      let finalResult = url;
      if (aiRemoveBgOn) {
        setAiStep('removing');
        if (aiCancelledRef.current) { clearInterval(aiTimerRef.current); return; }
        // Try to get a dataUrl for canvas processing (needs CORS headers from server)
        const dataUrl = await imageUrlToDataUrl(url);
        if (dataUrl) {
          finalResult = await removeBg(dataUrl);
        }
        // If imageUrlToDataUrl returned null (no CORS), we keep the URL as-is
      }

      if (aiCancelledRef.current) { clearInterval(aiTimerRef.current); return; }
      setAiResult(finalResult);
      setAiStep('done');
    } catch {
      if (!aiCancelledRef.current) setAiStep('error');
    } finally {
      clearInterval(aiTimerRef.current);
    }
  };

  const [openWebImages, setOpenWebImages] = useState(true);
  const [webQuery, setWebQuery] = useState('');
  const [webFilter, setWebFilter] = useState('all');
  const [webImages, setWebImages] = useState([]);
  const [webLoading, setWebLoading] = useState(false);
  const [webError, setWebError] = useState('');

  const searchWebImages = async (q, filter) => {
    const base = (q !== undefined ? q : webQuery).trim();
    if (!base) return;
    const f = filter !== undefined ? filter : webFilter;
    let finalQuery = base;
    if (f === 'photos') finalQuery += ' photograph';
    if (f === 'dessins') finalQuery += ' illustration OR drawing OR clipart OR cartoon OR vector';
    setWebLoading(true);
    setWebError('');
    setWebImages([]);
    try {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(finalQuery)}&gsrnamespace=6&prop=imageinfo&iiprop=url%7Cmime%7Cwidth%7Cheight&iiurlwidth=250&gsrlimit=32&format=json&origin=*`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const pages = data.query?.pages;
      if (!pages) { setWebImages([]); setWebLoading(false); return; }
      let results = Object.values(pages)
        .filter(p => p.imageinfo?.[0]?.mime?.startsWith('image/'))
        .map(p => ({ thumbUrl: p.imageinfo[0].thumburl, fullUrl: p.imageinfo[0].url, title: p.title.replace('File:', ''), isSvg: p.imageinfo[0].mime === 'image/svg+xml' }))
        .filter(r => r.thumbUrl);
      if (f === 'photos') results = results.filter(r => !r.isSvg);
      if (f === 'dessins') results = [...results.filter(r => r.isSvg), ...results.filter(r => !r.isSvg)];
      setWebImages(results.slice(0, 24));
      if (results.length === 0) setWebError('Aucune image trouvée.');
    } catch (e) {
      setWebError('Erreur de recherche. Vérifiez votre connexion.');
    }
    setWebLoading(false);
  };

  const filtered = COMPONENT_DEFINITIONS.filter(d => d.label.toLowerCase().includes(search.toLowerCase()));
  const groups = groupBy(filtered, 'category');

  const addComponent = (type, overrideProps, overrideSize) => {
    dispatch({ type: 'ADD_COMPONENT', componentType: type, x: 60, y: 100, overrideProps, overrideSize });
  };

  const toggleCat = (cat) => setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

  const presetCategories = Object.entries(groupBy(BUTTON_PRESETS, 'category'));

  return (
    <div style={{ width: mobile ? '100%' : 210, minWidth: mobile ? 0 : 190, height: '100%', background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ color: '#A78BFA', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Composants</div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher…" style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 12, fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>

        {!search && (
          <>
            {/* Button presets */}
            <div style={{ marginBottom: 10 }}>
              <button onClick={() => setOpenPresets(v => !v)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 4px', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>🎯 Boutons présets</span>
                <span style={{ fontSize: 9 }}>{openPresets ? '▲' : '▼'}</span>
              </button>
              {openPresets && presetCategories.map(([cat, items]) => {
                const isOpen = openCategories[cat] !== false;
                return (
                  <div key={cat} style={{ marginBottom: 6 }}>
                    <button onClick={() => toggleCat(cat)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#C4B5FD', fontSize: 9, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', padding: '3px 6px', borderRadius: 6, marginBottom: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{CATEGORY_ICONS[cat] || '•'} {cat}</span>
                      <span style={{ fontSize: 8 }}>{isOpen ? '▲' : '▼'}</span>
                    </button>
                    {isOpen && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
                        {items.map((preset) => (
                          <div
                            key={preset.label}
                            className="palette-item"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('componentType', 'button');
                              e.dataTransfer.setData('overrideProps', JSON.stringify({ iconName: preset.iconName, bgColor: preset.bgColor, iconPosition: 'only', borderRadius: 16, emoji: preset.emoji }));
                              e.dataTransfer.setData('overrideSize', JSON.stringify(PRESET_BTN_SIZE));
                              e.dataTransfer.effectAllowed = 'copy';
                            }}
                            onClick={() => addComponent('button', { iconName: preset.iconName, bgColor: preset.bgColor, iconPosition: 'only', borderRadius: 16, emoji: preset.emoji }, PRESET_BTN_SIZE)}
                            title={preset.label}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '5px 2px', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 7, cursor: 'grab', border: `1px solid ${preset.bgColor}40` }}
                          >
                            <div style={{ width: 26, height: 26, backgroundColor: preset.bgColor, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                              {preset.emoji}
                            </div>
                            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9, fontFamily: 'Nunito, sans-serif', fontWeight: 700, textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', width: '100%', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {preset.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Avatar presets */}
            <div style={{ marginBottom: 10 }}>
              <button onClick={() => setOpenAvatars(v => !v)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 4px', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>👤 Avatars présets</span>
                <span style={{ fontSize: 9 }}>{openAvatars ? '▲' : '▼'}</span>
              </button>
              {openAvatars && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 }}>
                  {AVATAR_PRESETS.map((preset) => (
                    <div
                      key={preset.label}
                      className="palette-item"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('componentType', 'avatar');
                        e.dataTransfer.setData('overrideProps', JSON.stringify({ bgColor: preset.bgColor, emoji: preset.emoji }));
                        e.dataTransfer.setData('overrideSize', JSON.stringify(PRESET_AVATAR_SIZE));
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={() => addComponent('avatar', { bgColor: preset.bgColor, emoji: preset.emoji }, PRESET_AVATAR_SIZE)}
                      title={preset.label}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 2px', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 7, cursor: 'grab', border: `1px solid ${preset.bgColor}40` }}
                    >
                      <div style={{ width: 28, height: 28, backgroundColor: preset.bgColor, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        {preset.emoji}
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 8, fontFamily: 'Nunito, sans-serif', fontWeight: 700, textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', width: '100%', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {preset.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', margin: '4px 0 10px' }} />
          </>
        )}

        {/* Mes images library */}
        {!search && images.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={() => setOpenImages(v => !v)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 4px', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span>🖼️ Mes images <span style={{ backgroundColor: '#6C63FF', color: 'white', borderRadius: 8, padding: '1px 5px', fontSize: 9, fontWeight: 800, marginLeft: 4 }}>{images.length}</span></span>
              <span style={{ fontSize: 9 }}>{openImages ? '▲' : '▼'}</span>
            </button>
            {openImages && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                {images.map(img => (
                  <div
                    key={img.id}
                    className="palette-item"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('componentType', 'image');
                      e.dataTransfer.setData('overrideProps', JSON.stringify({ frameless: true, imageData: img.dataUrl, animationType: img.animationType || '' }));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => addComponent('image', { frameless: true, imageData: img.dataUrl, animationType: img.animationType || '' })}
                    title={img.name}
                    style={{ position: 'relative', borderRadius: 7, overflow: 'hidden', cursor: 'grab', border: '1px solid rgba(255,255,255,0.12)', background: 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 10px 10px' }}
                  >
                    <img src={img.dataUrl} alt={img.name} style={{ width: '100%', height: 54, objectFit: 'contain', display: 'block' }} />
                    {img.animationType && (
                      <div style={{ position: 'absolute', top: 3, left: 3, backgroundColor: '#6C63FF', borderRadius: 4, fontSize: 9, padding: '1px 4px', color: 'white', fontWeight: 800 }}>🔄</div>
                    )}
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.75)', padding: '2px 4px', backgroundColor: 'rgba(0,0,0,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>{img.name}</div>
                    <button
                      onClick={e => { e.stopPropagation(); removeImage(img.id); }}
                      style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#EF4444', border: 'none', color: 'white', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, fontWeight: 900 }}
                      title="Supprimer"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', margin: '8px 0 6px' }} />
          </div>
        )}

        {/* AI image generation */}
        {!search && (
          <div style={{ marginBottom: 10 }}>
            <button onClick={() => setOpenAiImages(v => !v)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 4px', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>🤖 IA Images</span>
              <span style={{ fontSize: 9 }}>{openAiImages ? '▲' : '▼'}</span>
            </button>
            {openAiImages && (
              <div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                  <input
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && generateAiImage()}
                    placeholder="Décris une image…"
                    style={{ flex: 1, padding: '5px 8px', borderRadius: 7, border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 11, fontFamily: 'Nunito, sans-serif', outline: 'none' }}
                  />
                  <button
                    onClick={aiStep === 'fetching' || aiStep === 'removing'
                      ? () => { aiCancelledRef.current = true; clearInterval(aiTimerRef.current); setAiStep('idle'); }
                      : generateAiImage}
                    style={{ padding: '5px 8px', borderRadius: 7, border: 'none', backgroundColor: aiStep === 'fetching' || aiStep === 'removing' ? '#EF4444' : '#6C63FF', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
                  >
                    {aiStep === 'fetching' || aiStep === 'removing' ? '✕' : '✨'}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div onClick={() => setAiRemoveBgOn(v => !v)} style={{ width: 32, height: 18, backgroundColor: aiRemoveBgOn ? '#6C63FF' : '#6B7280', borderRadius: 9, position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: aiRemoveBgOn ? 15 : 2, width: 14, height: 14, backgroundColor: 'white', borderRadius: '50%', transition: 'left 0.15s' }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: 'Nunito, sans-serif' }}>Supprimer fond</span>
                </div>
                {(aiStep === 'fetching' || aiStep === 'removing') && (
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: 'Nunito, sans-serif', textAlign: 'center', padding: '8px 0' }}>
                    {aiStep === 'removing' ? '✂️ Suppression du fond…' : `🎨 Génération… ${aiElapsed}s`}
                  </div>
                )}
                {aiStep === 'error' && (
                  <div style={{ color: '#F87171', fontSize: 10, fontFamily: 'Nunito, sans-serif', marginBottom: 4 }}>Service IA indisponible. Réessayez.</div>
                )}
                {aiStep === 'done' && aiResult && (
                  <div>
                    <div
                      className="palette-item"
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('componentType', 'image');
                        e.dataTransfer.setData('overrideProps', JSON.stringify({ frameless: true, imageData: aiResult }));
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={() => addComponent('image', { frameless: true, imageData: aiResult })}
                      style={{ borderRadius: 8, overflow: 'hidden', cursor: 'grab', border: '2px solid #6C63FF', background: 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 10px 10px', marginBottom: 4 }}
                    >
                      <img src={aiResult} alt="IA" style={{ width: '100%', height: 90, objectFit: 'contain', display: 'block' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setAiStep('idle'); setAiResult(''); }} style={{ flex: 1, padding: '4px', borderRadius: 6, border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 10, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>Effacer</button>
                      <button onClick={generateAiImage} style={{ flex: 1, padding: '4px', borderRadius: 6, border: 'none', backgroundColor: 'rgba(108,99,255,0.4)', color: 'white', fontSize: 10, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700 }}>🔄 Regénérer</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', margin: '8px 0 6px' }} />
          </div>
        )}

        {/* Web image search */}
        {!search && (
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={() => setOpenWebImages(v => !v)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 4px', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span>🌐 Images Web</span>
              <span style={{ fontSize: 9 }}>{openWebImages ? '▲' : '▼'}</span>
            </button>
            {openWebImages && (
              <div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                  <input
                    value={webQuery}
                    onChange={e => setWebQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchWebImages()}
                    placeholder="Ex: chat, montagne…"
                    style={{ flex: 1, padding: '5px 8px', borderRadius: 7, border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 11, fontFamily: 'Nunito, sans-serif', outline: 'none' }}
                  />
                  <button
                    onClick={() => searchWebImages()}
                    disabled={webLoading}
                    style={{ padding: '5px 8px', borderRadius: 7, border: 'none', backgroundColor: '#6C63FF', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', opacity: webLoading ? 0.6 : 1 }}
                  >
                    {webLoading ? '…' : '🔍'}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                  {[{ id: 'all', label: '🌐 Tout' }, { id: 'photos', label: '📷 Photos' }, { id: 'dessins', label: '🎨 Dessins' }].map(f => (
                    <button
                      key={f.id}
                      onClick={() => { setWebFilter(f.id); if (webQuery.trim()) searchWebImages(webQuery, f.id); }}
                      style={{ flex: 1, padding: '3px 2px', borderRadius: 6, border: webFilter === f.id ? '1px solid #A78BFA' : '1px solid rgba(255,255,255,0.15)', backgroundColor: webFilter === f.id ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.05)', color: webFilter === f.id ? '#A78BFA' : 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
                    >{f.label}</button>
                  ))}
                </div>
                {webError && <div style={{ color: '#F87171', fontSize: 10, fontFamily: 'Nunito, sans-serif', marginBottom: 4 }}>{webError}</div>}
                {webLoading && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Nunito, sans-serif', textAlign: 'center', padding: '10px 0' }}>Recherche…</div>}
                {webImages.length > 0 && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 4 }}>
                      {webImages.map((img, i) => (
                        <div
                          key={i}
                          className="palette-item"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('componentType', 'image');
                            e.dataTransfer.setData('overrideProps', JSON.stringify({ frameless: false, imageData: img.fullUrl }));
                            e.dataTransfer.setData('overrideSize', JSON.stringify({ width: 270, height: 160 }));
                            e.dataTransfer.effectAllowed = 'copy';
                          }}
                          onClick={() => addComponent('image', { frameless: false, imageData: img.fullUrl }, { width: 270, height: 160 })}
                          title={img.title}
                          style={{ position: 'relative', borderRadius: 7, overflow: 'hidden', cursor: 'grab', border: '1px solid rgba(255,255,255,0.12)', background: 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 10px 10px' }}
                        >
                          <img src={img.thumbUrl} alt={img.title} style={{ width: '100%', height: 54, objectFit: 'cover', display: 'block' }} />
                          {img.isSvg && <div style={{ position: 'absolute', top: 2, left: 2, backgroundColor: '#7C3AED', borderRadius: 3, fontSize: 8, padding: '1px 3px', color: 'white', fontWeight: 800 }}>SVG</div>}
                        </div>
                      ))}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>Source: Wikimedia Commons (CC)</div>
                  </>
                )}
              </div>
            )}
            <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', margin: '8px 0 6px' }} />
          </div>
        )}

        {/* Regular components */}
        {Object.entries(groups).map(([category, items]) => (
          <div key={category} style={{ marginBottom: 12 }}>
            <div style={{ color: '#7C3AED', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 4px', marginBottom: 4 }}>{category}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {items.map((def) => (
                <div
                  key={def.type}
                  className="palette-item"
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('componentType', def.type); e.dataTransfer.effectAllowed = 'copy'; }}
                  onClick={() => def.type === 'line'
                    ? dispatch({ type: 'SET_PENDING_TOOL', tool: 'line' })
                    : addComponent(def.type)
                  }
                  title={def.tooltip}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', backgroundColor: def.type === 'line' && state.pendingTool === 'line' ? 'rgba(108,99,255,0.25)' : 'rgba(255,255,255,0.07)', borderRadius: 8, cursor: 'grab', border: def.type === 'line' && state.pendingTool === 'line' ? '1px solid #6C63FF' : '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{def.icon}</span>
                  <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 12, fontFamily: 'Nunito, sans-serif', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{def.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginTop: 20, fontFamily: 'Nunito, sans-serif' }}>Aucun composant trouvé</div>}
      </div>

      <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontSize: 10, textAlign: 'center', fontFamily: 'Nunito, sans-serif', lineHeight: 1.4 }}>
        Glisse ou clique pour ajouter
      </div>
    </div>
  );
}
