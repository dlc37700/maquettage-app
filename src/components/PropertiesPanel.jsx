import React, { useRef } from 'react';
import { useProject, useActiveScreen } from '../hooks/useProject';
import { COMPONENT_DEFINITIONS, THEMES } from '../data/componentDefinitions';
// ICON_OPTIONS removed — now using IconPicker with iconLibraries
import IconPicker from './IconPicker';

function Field({ label, children }) {
  return <div style={{ marginBottom: 12 }}><div style={{ color: '#6B7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>{children}</div>;
}
function TextInput({ value, onChange, placeholder }) {
  return <input value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'Nunito, sans-serif', outline: 'none', color: '#1F2937', backgroundColor: '#F9FAFB' }} />;
}
function NumberInput({ value, onChange, min = 0, max = 999 }) {
  return <input type="number" value={value ?? 0} min={min} max={max} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'Nunito, sans-serif', outline: 'none', color: '#1F2937', backgroundColor: '#F9FAFB' }} />;
}
function ColorInput({ value, onChange }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2 }} /><input value={value || ''} onChange={e => onChange(e.target.value)} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 12, fontFamily: 'Nunito, sans-serif', outline: 'none', color: '#1F2937', backgroundColor: '#F9FAFB' }} /></div>;
}
function RangeInput({ value, onChange, min = 0, max = 100 }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="range" value={value ?? max} min={min} max={max} onChange={e => onChange(Number(e.target.value))} style={{ flex: 1, accentColor: '#6C63FF' }} /><span style={{ fontSize: 12, color: '#6B7280', minWidth: 30, textAlign: 'right', fontFamily: 'Nunito, sans-serif' }}>{value}</span></div>;
}
function Toggle({ value, onChange }) {
  return <div onClick={() => onChange(!value)} style={{ width: 46, height: 26, backgroundColor: value ? '#6C63FF' : '#D1D5DB', borderRadius: 13, position: 'relative', cursor: 'pointer' }}><div style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 20, height: 20, backgroundColor: 'white', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', transition: 'left 0.15s' }} /></div>;
}
function SelectInput({ value, onChange, options }) {
  return <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'Nunito, sans-serif', outline: 'none', color: '#1F2937', backgroundColor: '#F9FAFB', cursor: 'pointer' }}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, color: '#4C1D95', padding: '8px 0 4px', borderTop: '1px solid #F3F4F6', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{children}</div>;
}
function aBtnStyle(bg, color) {
  return { flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none', backgroundColor: bg, color, fontSize: 12, fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' };
}

function ImageUpload({ value, onChange, shape = 'rect' }) {
  const inputRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image trop grande (max 5 Mo)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      <button onClick={() => inputRef.current?.click()} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1.5px dashed #A78BFA', backgroundColor: '#F5F3FF', color: '#6C63FF', fontSize: 12, fontFamily: 'Nunito, sans-serif', fontWeight: 700, cursor: 'pointer' }}>
        📁 Choisir une image…
      </button>
      {value && (
        <div style={{ marginTop: 8, position: 'relative' }}>
          <img src={value} alt="" style={{ width: '100%', maxHeight: 80, objectFit: 'cover', borderRadius: shape === 'circle' ? '50%' : 8, display: 'block' }} />
          <button onClick={() => onChange(null)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}
    </div>
  );
}

const GRADIENT_PRESETS = [
  { from: '#6C63FF', to: '#EC4899', angle: 135 },
  { from: '#3B82F6', to: '#06B6D4', angle: 135 },
  { from: '#F97316', to: '#EF4444', angle: 135 },
  { from: '#10B981', to: '#06B6D4', angle: 135 },
  { from: '#8B5CF6', to: '#3B82F6', angle: 135 },
  { from: '#EC4899', to: '#F97316', angle: 135 },
  { from: '#1E1B4B', to: '#6C63FF', angle: 135 },
  { from: '#F59E0B', to: '#EF4444', angle: 135 },
];

function BgPicker({ bgColor, bgGradient, onColorChange, onGradientChange }) {
  const isGrad = !!bgGradient;
  const grad = bgGradient || { from: bgColor || '#6C63FF', to: '#EC4899', angle: 135 };

  const tabStyle = (active) => ({
    flex: 1, padding: '4px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 11, fontFamily: 'Nunito, sans-serif', fontWeight: 700,
    backgroundColor: active ? '#6C63FF' : 'transparent',
    color: active ? 'white' : '#9CA3AF',
  });

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, backgroundColor: '#F3F4F6', borderRadius: 8, padding: 3 }}>
        <button style={tabStyle(!isGrad)} onClick={() => onGradientChange(null)}>Uni</button>
        <button style={tabStyle(isGrad)} onClick={() => onGradientChange(grad)}>Dégradé</button>
      </div>

      {!isGrad ? (
        <ColorInput value={bgColor} onChange={onColorChange} />
      ) : (
        <div>
          {/* Two color pickers */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2, fontFamily: 'Nunito', fontWeight: 700 }}>Début</div>
              <ColorInput value={grad.from} onChange={v => onGradientChange({ ...grad, from: v })} />
            </div>
            <div style={{ fontSize: 16, color: '#9CA3AF', marginTop: 12 }}>→</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2, fontFamily: 'Nunito', fontWeight: 700 }}>Fin</div>
              <ColorInput value={grad.to} onChange={v => onGradientChange({ ...grad, to: v })} />
            </div>
          </div>
          {/* Angle */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2, fontFamily: 'Nunito', fontWeight: 700 }}>Direction</div>
            <SelectInput
              value={String(grad.angle ?? 135)}
              onChange={v => onGradientChange({ ...grad, angle: Number(v) })}
              options={[
                { value: '0',   label: '↓ Haut → Bas' },
                { value: '90',  label: '→ Gauche → Droite' },
                { value: '135', label: '↘ Diagonal' },
                { value: '45',  label: '↗ Diagonal' },
                { value: '180', label: '↑ Bas → Haut' },
                { value: '270', label: '← Droite → Gauche' },
              ]}
            />
          </div>
          {/* Preview + presets */}
          <div style={{ height: 28, borderRadius: 8, marginBottom: 6, background: `linear-gradient(${grad.angle ?? 135}deg, ${grad.from}, ${grad.to})` }} />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {GRADIENT_PRESETS.map((p, i) => (
              <div
                key={i}
                onClick={() => onGradientChange({ ...p })}
                title={`${p.from} → ${p.to}`}
                style={{ width: 22, height: 22, borderRadius: 6, cursor: 'pointer', background: `linear-gradient(135deg, ${p.from}, ${p.to})`, border: '2px solid transparent', outline: grad.from === p.from && grad.to === p.to ? '2px solid #6C63FF' : 'none' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ComponentProperties({ comp }) {
  const { dispatch, state } = useProject();
  const screen = useActiveScreen();
  if (!comp || !screen) return null;
  const update = (props) => dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props });
  const p = comp.props, pos = comp.position;
  const maxZ = Math.max(1, ...screen.components.map(c => c.zIndex || 1));

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button onClick={() => dispatch({ type: 'DUPLICATE_COMPONENT', id: comp.id })} style={aBtnStyle('#EDE9FE', '#6C63FF')}>📋 Dupliquer</button>
        <button onClick={() => dispatch({ type: 'DELETE_COMPONENT', id: comp.id })} style={aBtnStyle('#FEE2E2', '#DC2626')}>🗑️ Supprimer</button>
      </div>

      <SectionTitle>Position & Taille</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <Field label="X (px)"><NumberInput value={Math.round(pos.x)} onChange={v => dispatch({ type: 'COMMIT_MOVE', id: comp.id, x: v, y: pos.y })} max={390} /></Field>
        <Field label="Y (px)"><NumberInput value={Math.round(pos.y)} onChange={v => dispatch({ type: 'COMMIT_MOVE', id: comp.id, x: pos.x, y: v })} max={844} /></Field>
        <Field label="Largeur"><NumberInput value={Math.round(pos.width)} onChange={v => dispatch({ type: 'COMMIT_RESIZE', id: comp.id, x: pos.x, y: pos.y, width: v, height: pos.height })} min={10} max={390} /></Field>
        <Field label="Hauteur"><NumberInput value={Math.round(pos.height)} onChange={v => dispatch({ type: 'COMMIT_RESIZE', id: comp.id, x: pos.x, y: pos.y, width: pos.width, height: v })} min={10} max={844} /></Field>
      </div>

      <SectionTitle>Apparence</SectionTitle>

      {/* Image upload for image and avatar */}
      {(comp.type === 'image' || comp.type === 'avatar') && (
        <Field label="Image">
          <ImageUpload value={p.imageData} onChange={v => update({ imageData: v })} shape={comp.type === 'avatar' ? 'circle' : 'rect'} />
        </Field>
      )}

      {/* Button icon options */}
      {comp.type === 'button' && (
        <>
          <Field label="Icône">
            <IconPicker
              value={p.iconName || ''}
              iconSet={p.iconSet || 'lucide'}
              onChange={v => update({ iconName: v })}
              onSetChange={s => update({ iconSet: s })}
            />
          </Field>
          {p.iconName && (
            <Field label="Position icône">
              <SelectInput
                value={p.iconPosition || 'left'}
                onChange={v => update({ iconPosition: v })}
                options={[{ value: 'left', label: 'Gauche' }, { value: 'right', label: 'Droite' }, { value: 'only', label: 'Icône seule' }]}
              />
            </Field>
          )}
        </>
      )}

      {'label' in p && comp.type !== 'switch' && <Field label="Texte"><TextInput value={p.label} onChange={v => update({ label: v })} /></Field>}
      {'title' in p && <Field label="Titre"><TextInput value={p.title} onChange={v => update({ title: v })} /></Field>}
      {'placeholder' in p && <Field label="Placeholder"><TextInput value={p.placeholder} onChange={v => update({ placeholder: v })} /></Field>}
      {'bgColor' in p && comp.type !== 'image' && (
        <Field label="Fond">
          <BgPicker
            bgColor={p.bgColor}
            bgGradient={p.bgGradient || null}
            onColorChange={v => update({ bgColor: v, bgGradient: null })}
            onGradientChange={g => update({ bgGradient: g })}
          />
        </Field>
      )}
      {'textColor' in p && <Field label="Texte"><ColorInput value={p.textColor} onChange={v => update({ textColor: v })} /></Field>}
      {'color' in p && comp.type === 'icon' && <Field label="Couleur"><ColorInput value={p.color} onChange={v => update({ color: v })} /></Field>}
      {'activeColor' in p && <Field label="Couleur active"><ColorInput value={p.activeColor} onChange={v => update({ activeColor: v })} /></Field>}
      {'accentColor' in p && <Field label="Accentuation"><ColorInput value={p.accentColor} onChange={v => update({ accentColor: v })} /></Field>}
      {'fontSize' in p && <Field label={`Police (${p.fontSize}px)`}><RangeInput value={p.fontSize} onChange={v => update({ fontSize: v })} min={8} max={48} /></Field>}
      {'fontWeight' in p && <Field label="Style"><SelectInput value={p.fontWeight} onChange={v => update({ fontWeight: v })} options={[{ value: 'normal', label: 'Normal' }, { value: 'semibold', label: 'Semi-gras' }, { value: 'bold', label: 'Gras' }]} /></Field>}
      {'borderRadius' in p && <Field label={`Arrondi (${p.borderRadius}px)`}><RangeInput value={p.borderRadius} onChange={v => update({ borderRadius: v })} max={60} /></Field>}
      {'checked' in p && <Field label="Coché"><Toggle value={p.checked} onChange={v => update({ checked: v })} /></Field>}
      {'showBack' in p && <Field label="Bouton retour"><Toggle value={p.showBack} onChange={v => update({ showBack: v })} /></Field>}
      {('value' in p) && comp.type === 'slider' && <Field label={`Valeur (${p.value}%)`}><RangeInput value={p.value} onChange={v => update({ value: v })} /></Field>}
      {'count' in p && <Field label="Nombre"><NumberInput value={p.count} onChange={v => update({ count: v })} max={99} /></Field>}
      {('iconName' in p) && comp.type === 'icon' && (
        <Field label="Icône">
          <IconPicker
            value={p.iconName}
            iconSet={p.iconSet || 'lucide'}
            onChange={v => update({ iconName: v })}
            onSetChange={s => update({ iconSet: s })}
          />
        </Field>
      )}
      {'label' in p && comp.type === 'switch' && <Field label="Texte"><TextInput value={p.label} onChange={v => update({ label: v })} /></Field>}
      <Field label={`Opacité (${Math.round((p.opacity ?? 1) * 100)}%)`}><RangeInput value={Math.round((p.opacity ?? 1) * 100)} onChange={v => update({ opacity: v / 100 })} /></Field>

      <SectionTitle>Ordre</SectionTitle>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => dispatch({ type: 'SET_Z_INDEX', id: comp.id, zIndex: maxZ + 1 })} style={aBtnStyle('#EDE9FE', '#6C63FF')}>⬆️ Devant</button>
        <button onClick={() => dispatch({ type: 'SET_Z_INDEX', id: comp.id, zIndex: Math.max(0, (comp.zIndex || 1) - 1) })} style={aBtnStyle('#F3F4F6', '#374151')}>⬇️ Derrière</button>
      </div>

      <SectionTitle>Navigation</SectionTitle>
      <Field label="Lien vers écran">
        <select
          value={p.navigateTo || ''}
          onChange={e => update({ navigateTo: e.target.value })}
          style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: 'Nunito, sans-serif', outline: 'none', color: '#1F2937', backgroundColor: '#F9FAFB', cursor: 'pointer' }}
        >
          <option value="">— Aucune navigation —</option>
          {screen.components && state.screens.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function ScreenProperties() {
  const { dispatch } = useProject();
  const screen = useActiveScreen();
  if (!screen) return null;
  return (
    <div>
      <Field label="Nom"><TextInput value={screen.name} onChange={v => dispatch({ type: 'RENAME_SCREEN', id: screen.id, name: v })} /></Field>
      <Field label="Fond">
        <BgPicker
          bgColor={screen.backgroundColor}
          bgGradient={screen.backgroundGradient || null}
          onColorChange={v => dispatch({ type: 'SET_BACKGROUND', color: v, gradient: null })}
          onGradientChange={g => dispatch({ type: 'SET_BACKGROUND', color: screen.backgroundColor, gradient: g })}
        />
      </Field>
      <SectionTitle>Thèmes rapides</SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {THEMES.map(theme => (
          <button key={theme.label} onClick={() => dispatch({ type: 'SET_BACKGROUND', color: theme.bg })} title={theme.label}
            style={{ width: 36, height: 36, backgroundColor: theme.bg, border: `2px solid ${theme.color}`, borderRadius: 8, cursor: 'pointer', fontSize: 10, fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: theme.color }}>
            {theme.label.slice(0, 2)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PropertiesPanel() {
  const { state } = useProject();
  const screen = useActiveScreen();
  const selectedComp = screen?.components.find(c => c.id === state.selectedComponentId);
  const def = selectedComp ? COMPONENT_DEFINITIONS.find(d => d.type === selectedComp.type) : null;
  return (
    <div style={{ width: 230, minWidth: 200, height: '100%', backgroundColor: '#FFFFFF', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #F3F4F6', backgroundColor: '#FAFAFA' }}>
        <div style={{ color: '#6C63FF', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>Propriétés</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1F2937', fontFamily: 'Nunito, sans-serif' }}>{selectedComp ? (def?.label || selectedComp.type) : 'Écran'}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {selectedComp ? <ComponentProperties comp={selectedComp} /> : <ScreenProperties />}
      </div>
    </div>
  );
}
