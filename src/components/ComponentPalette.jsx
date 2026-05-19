import React, { useState } from 'react';
import { COMPONENT_DEFINITIONS } from '../data/componentDefinitions';
import { useProject } from '../hooks/useProject';

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

export default function ComponentPalette() {
  const { dispatch } = useProject();
  const [search, setSearch] = useState('');
  const [tooltip, setTooltip] = useState(null);

  const filtered = COMPONENT_DEFINITIONS.filter(d =>
    d.label.toLowerCase().includes(search.toLowerCase())
  );
  const groups = groupBy(filtered, 'category');

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('componentType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleClick = (type) => {
    dispatch({ type: 'ADD_COMPONENT', componentType: type, x: 60, y: 100 });
  };

  return (
    <div style={{
      width: 200,
      minWidth: 180,
      height: '100%',
      background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: '16px 12px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ color: '#A78BFA', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
          Composants
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher…"
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: 12,
            fontFamily: 'Nunito, sans-serif',
            outline: 'none',
          }}
        />
      </div>

      {/* Component list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {Object.entries(groups).map(([category, items]) => (
          <div key={category} style={{ marginBottom: 12 }}>
            <div style={{
              color: '#7C3AED',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              padding: '4px 4px',
              marginBottom: 4,
            }}>
              {category}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {items.map((def) => (
                <div
                  key={def.type}
                  className="palette-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, def.type)}
                  onClick={() => handleClick(def.type)}
                  onMouseEnter={() => setTooltip(def)}
                  onMouseLeave={() => setTooltip(null)}
                  title={def.tooltip}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 10px',
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    borderRadius: 8,
                    cursor: 'grab',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{def.icon}</span>
                  <span style={{
                    color: 'rgba(255,255,255,0.88)',
                    fontSize: 12,
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {def.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginTop: 20, fontFamily: 'Nunito, sans-serif' }}>
            Aucun composant trouvé
          </div>
        )}
      </div>

      {/* Tip */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        textAlign: 'center',
        fontFamily: 'Nunito, sans-serif',
        lineHeight: 1.4,
      }}>
        Glisse ou clique pour ajouter
      </div>
    </div>
  );
}
