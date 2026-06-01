import React, { useState } from 'react';
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
  const { dispatch } = useProject();
  const { images, remove: removeImage } = useImageLibrary();
  const [search, setSearch] = useState('');
  const [openPresets, setOpenPresets] = useState(true);
  const [openCategories, setOpenCategories] = useState({});
  const [openAvatars, setOpenAvatars] = useState(true);
  const [openImages, setOpenImages] = useState(true);

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
                  onClick={() => addComponent(def.type)}
                  title={def.tooltip}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 8, cursor: 'grab', border: '1px solid rgba(255,255,255,0.05)' }}
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
