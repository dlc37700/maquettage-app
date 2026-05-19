import React, { useRef } from 'react';
import { useProject, useActiveScreen } from '../hooks/useProject';
import { COMPONENT_DEFINITIONS, ICON_OPTIONS, THEMES } from '../data/componentDefinitions';

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

function ComponentProperties({ comp }) {
  const { dispatch } = useProject();
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
            <SelectInput
              value={p.iconName || ''}
              onChange={v => update({ iconName: v })}
              options={[{ value: '', label: 'Aucune icône' }, ...ICON_OPTIONS.map(n => ({ value: n, label: n }))]}
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
      {'bgColor' in p && comp.type !== 'image' && <Field label="Fond"><ColorInput value={p.bgColor} onChange={v => update({ bgColor: v })} /></Field>}
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
          <SelectInput value={p.iconName} onChange={v => update({ iconName: v })} options={ICON_OPTIONS.map(n => ({ value: n, label: n }))} />
        </Field>
      )}
      {'label' in p && comp.type === 'switch' && <Field label="Texte"><TextInput value={p.label} onChange={v => update({ label: v })} /></Field>}
      <Field label={`Opacité (${Math.round((p.opacity ?? 1) * 100)}%)`}><RangeInput value={Math.round((p.opacity ?? 1) * 100)} onChange={v => update({ opacity: v / 100 })} /></Field>

      <SectionTitle>Ordre</SectionTitle>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => dispatch({ type: 'SET_Z_INDEX', id: comp.id, zIndex: maxZ + 1 })} style={aBtnStyle('#EDE9FE', '#6C63FF')}>⬆️ Devant</button>
        <button onClick={() => dispatch({ type: 'SET_Z_INDEX', id: comp.id, zIndex: Math.max(0, (comp.zIndex || 1) - 1) })} style={aBtnStyle('#F3F4F6', '#374151')}>⬇️ Derrière</button>
      </div>
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
      <Field label="Fond"><ColorInput value={screen.backgroundColor} onChange={v => dispatch({ type: 'SET_BACKGROUND', color: v })} /></Field>
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
