import React, { useState, useRef, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import * as TablerIcons from '@tabler/icons-react';
import { LUCIDE_CATEGORIES, TABLER_CATEGORIES } from '../data/iconLibraries';

export default function IconPicker({ value, iconSet = 'lucide', onChange, onSetChange }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(iconSet === 'tabler' ? 'tabler' : 'lucide');
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const lucideCategories = Object.entries(LUCIDE_CATEGORIES);
  const tablerCategories = Object.entries(TABLER_CATEGORIES);

  const filteredLucide = search
    ? lucideCategories.map(([cat, icons]) => [cat, icons.filter(n => n.toLowerCase().includes(search.toLowerCase()))]).filter(([, icons]) => icons.length > 0)
    : lucideCategories;

  const filteredTabler = search
    ? tablerCategories.map(([cat, icons]) => [cat, icons.filter(n => n.toLowerCase().includes(search.toLowerCase()))]).filter(([, icons]) => icons.length > 0)
    : tablerCategories;

  const select = (name, set) => {
    onChange(name, set); // 2nd arg = set, lets callers do one combined update
    onSetChange(set);
    setOpen(false);
    setSearch('');
  };

  // Preview of current icon
  const PreviewIcon = () => {
    if (!value) return <span style={{ color: '#9CA3AF', fontSize: 11 }}>Aucune</span>;
    if (iconSet === 'tabler') {
      const T = TablerIcons[value];
      return T ? <T size={18} /> : <span style={{ fontSize: 10 }}>{value}</span>;
    }
    const L = LucideIcons[value];
    return L ? <L size={18} /> : <span style={{ fontSize: 10 }}>{value}</span>;
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 12, fontFamily: 'Nunito, sans-serif', backgroundColor: '#F9FAFB', color: '#1F2937', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PreviewIcon />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120, fontSize: 11 }}>
            {value || 'Choisir une icône…'}
          </span>
        </div>
        <span style={{ fontSize: 9, color: '#9CA3AF' }}>▼</span>
      </button>

      {open && (
        <div style={{ position: 'fixed', zIndex: 99999, width: 320, maxHeight: 420, backgroundColor: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', border: '1px solid #E5E7EB', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          ref={el => {
            if (!el) return;
            const trigger = ref.current?.querySelector('button');
            if (!trigger) return;
            const r = trigger.getBoundingClientRect();
            el.style.top = `${Math.min(r.bottom + 4, window.innerHeight - 440)}px`;
            el.style.left = `${Math.min(r.left, window.innerWidth - 330)}px`;
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', padding: '8px 8px 0' }}>
            {['lucide', 'tabler'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '6px 4px', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'Nunito, sans-serif', fontWeight: 700, borderRadius: '6px 6px 0 0', backgroundColor: tab === t ? '#6C63FF' : 'transparent', color: tab === t ? 'white' : '#6B7280' }}>
                {t === 'lucide' ? '🔷 Lucide (600+)' : '🔶 Tabler (200+)'}
              </button>
            ))}
          </div>
          {/* Search */}
          <div style={{ padding: '8px 8px 4px' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher…" style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 12, fontFamily: 'Nunito, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {/* None option */}
          <div style={{ padding: '0 8px 4px' }}>
            <button onClick={() => select('', tab)} style={{ width: '100%', padding: '4px', borderRadius: 6, border: '1px dashed #E5E7EB', fontSize: 11, cursor: 'pointer', color: '#9CA3AF', backgroundColor: 'transparent', fontFamily: 'Nunito, sans-serif' }}>
              ✕ Aucune icône
            </button>
          </div>
          {/* Icons grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
            {(tab === 'lucide' ? filteredLucide : filteredTabler).map(([cat, icons]) => (
              <div key={cat}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, padding: '6px 2px 3px' }}>{cat}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                  {icons.map(name => {
                    const isSelected = value === name && iconSet === tab;
                    if (tab === 'lucide') {
                      const L = LucideIcons[name];
                      if (!L) return null;
                      return (
                        <button key={name} onClick={() => select(name, 'lucide')} title={name}
                          style={{ width: 36, height: 36, border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#6C63FF' : 'transparent', color: isSelected ? 'white' : '#374151' }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                          <L size={18} />
                        </button>
                      );
                    } else {
                      const T = TablerIcons[name];
                      if (!T) return null;
                      return (
                        <button key={name} onClick={() => select(name, 'tabler')} title={name}
                          style={{ width: 36, height: 36, border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#6C63FF' : 'transparent', color: isSelected ? 'white' : '#374151' }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                          <T size={18} />
                        </button>
                      );
                    }
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
