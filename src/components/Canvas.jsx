import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useProject, useActiveScreen } from '../hooks/useProject';
import * as LucideIcons from 'lucide-react';
import * as TablerIcons from '@tabler/icons-react';
import DrawingRenderer from './DrawingRenderer';
import { getShapeSvgInner } from '../data/shapes';
import { getFontworkSvg } from '../data/fontwork';

const CANVAS_W = 390;
const CANVAS_H = 844;

// Inject CSS keyframes for image animations (once)
if (typeof document !== 'undefined' && !document.getElementById('maquetapp-anims')) {
  const s = document.createElement('style');
  s.id = 'maquetapp-anims';
  s.textContent = `
    @keyframes maquetapp-spin3d { from{transform:perspective(500px) rotateY(0deg)} to{transform:perspective(500px) rotateY(360deg)} }
    @keyframes maquetapp-spinz  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes maquetapp-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8%)} }
    @keyframes maquetapp-pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
  `;
  document.head.appendChild(s);
}

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

function ShapeWithText({ comp, isReadOnly }) {
  const { state, dispatch } = useProject();
  const p = comp.props;
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);
  const isSelected = state.selectedComponentId === comp.id;

  const startEdit = (e) => {
    if (isReadOnly) return;
    if (!isSelected) return;
    e.stopPropagation();
    setEditValue(p.text || '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const commitEdit = () => {
    setEditing(false);
    dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { text: editValue } });
  };

  const svgInner = getShapeSvgInner(p.shape || 'circle', p.fillColor || '#6C63FF', p.strokeColor || 'transparent', p.strokeWidth ?? 0);
  const fs = p.fontSize || 16;
  const fc = p.textColor || '#FFFFFF';
  const ff = `${p.fontFamily || 'Nunito'}, sans-serif`;
  const fw = p.fontWeight === 'bold' ? 700 : p.fontWeight === 'semibold' ? 600 : 400;

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative', cursor: isReadOnly ? 'default' : isSelected ? 'text' : 'default' }}
      onClick={startEdit}
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
        style={{ display: 'block', position: 'absolute', inset: 0, overflow: 'visible' }}
        dangerouslySetInnerHTML={{ __html: svgInner }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, pointerEvents: 'none' }}>
        {editing ? (
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => { if (e.key === 'Escape') setEditing(false); e.stopPropagation(); }}
            onMouseDown={e => e.stopPropagation()}
            style={{ pointerEvents: 'all', width: '100%', height: '100%', textAlign: 'center', background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: fc, fontSize: fs, fontFamily: ff, fontWeight: fw, caretColor: fc, overflow: 'hidden', lineHeight: 1.3 }}
          />
        ) : (
          p.text ? <span style={{ textAlign: 'center', color: fc, fontSize: fs, fontFamily: ff, fontWeight: fw, userSelect: 'none', wordBreak: 'break-word', lineHeight: 1.2, whiteSpace: 'pre-wrap' }}>{p.text}</span> : null
        )}
      </div>
      {isSelected && !isReadOnly && !p.text && !editing && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'Nunito, sans-serif' }}>cliquer pour écrire</span>
        </div>
      )}
    </div>
  );
}

function LightningBolt({ color, size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L3 14H11L9 22L19 10H11L13 2Z" fill={color}/>
    </svg>
  );
}

function TorchButton({ comp, isReadOnly }) {
  const p = comp.props;
  const [on, setOn] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const toggle = async () => {
    if (!isReadOnly) return;
    if (on) {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const track = stream.getVideoTracks()[0];
        await track.applyConstraints({ advanced: [{ torch: true }] });
        streamRef.current = stream;
        setOn(true);
      } catch {
        alert('Torche non disponible sur cet appareil.');
      }
    }
  };

  const w = comp.position.width;
  const h = comp.position.height;
  const br = p.borderRadius ?? 18;
  const iconSize = Math.round(Math.min(w, h) * 0.42);
  const bgColor = on ? (p.onColor || '#FFD60A') : (p.offColor || '#1C1C1E');
  const iconColor = on ? '#1C1C1E' : (p.iconColor || '#FFFFFF');

  return (
    <div
      onClick={toggle}
      style={{
        width: '100%', height: '100%',
        backgroundColor: bgColor,
        borderRadius: br,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: isReadOnly ? 'pointer' : 'default',
        boxShadow: on ? `0 0 24px 8px ${p.onColor || '#FFD60A'}66` : '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'background-color 0.2s, box-shadow 0.3s',
        userSelect: 'none',
      }}
    >
      <LightningBolt color={iconColor} size={iconSize} />
    </div>
  );
}

function getBg(bgColor, bgGradient) {
  if (bgGradient && bgGradient.from && bgGradient.to) {
    return { background: `linear-gradient(${bgGradient.angle ?? 135}deg, ${bgGradient.from}, ${bgGradient.to})` };
  }
  return { backgroundColor: bgColor };
}

function CalendarRenderer({ comp, isReadOnly }) {
  const { state, dispatch } = useProject();
  const isSelected = state.selectedComponentId === comp.id;
  const p = comp.props;
  const events = p.events || {};

  const today = new Date();
  const [month, setMonth] = React.useState(today.getMonth());
  const [year, setYear] = React.useState(today.getFullYear());
  const [editingDay, setEditingDay] = useState(null);
  const [editValue, setEditValue] = useState('');

  const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const DAYS_FR = ['Lu','Ma','Me','Je','Ve','Sa','Di'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d) => d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
  const dayKey = (d) => `${year}-${month}-${d}`;

  const accent = p.accentColor || '#6C63FF';
  const headerBg = p.headerBgColor || accent;
  const calBg = p.bgColor || '#FFFFFF';
  const textColor = p.textColor || '#1F2937';
  const br = p.borderRadius ?? 12;
  const fontFamily = `${p.fontFamily || 'Nunito'}, sans-serif`;
  const headerFs = Math.max(10, Math.min(14, comp.position.height * 0.042));
  const dayLabelFs = Math.max(7, Math.min(11, comp.position.width / 50));
  const dayNumFs = Math.max(8, Math.min(13, comp.position.width / 40));
  const eventFs = Math.max(6, Math.min(9, comp.position.width / 52));

  const prevMonth = (e) => {
    e.stopPropagation();
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  };
  const nextMonth = (e) => {
    e.stopPropagation();
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  };

  const startEdit = (e, d) => {
    if (!d || isReadOnly) return;
    e.stopPropagation();
    setEditValue(events[dayKey(d)] || '');
    setEditingDay(d);
  };

  const commitEdit = () => {
    if (editingDay === null || isReadOnly) return;
    const key = dayKey(editingDay);
    const newEvents = { ...events };
    if (editValue.trim()) newEvents[key] = editValue.trim();
    else delete newEvents[key];
    dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { events: newEvents } });
    setEditingDay(null);
  };

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: calBg, borderRadius: br, overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily }}>
      <div style={{ backgroundColor: headerBg, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'white', fontSize: headerFs + 4, cursor: 'pointer', padding: '0 6px', lineHeight: 1, fontFamily }}>‹</button>
        <span style={{ color: 'white', fontWeight: 800, fontSize: headerFs }}>{MONTHS_FR[month]} {year}</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'white', fontSize: headerFs + 4, cursor: 'pointer', padding: '0 6px', lineHeight: 1, fontFamily }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '4px 6px 2px', flexShrink: 0 }}>
        {DAYS_FR.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: dayLabelFs, fontWeight: 700, color: '#9CA3AF' }}>{d}</div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '0 6px 4px', alignContent: 'start', gap: 1 }}>
        {cells.map((d, i) => {
          const key = d ? dayKey(d) : null;
          const eventText = key ? events[key] : null;
          const isEditing = editingDay === d && d !== null;
          return (
            <div key={i} onClick={(e) => startEdit(e, d)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', aspectRatio: '1', cursor: d ? 'text' : 'default', backgroundColor: isToday(d) ? accent : 'transparent', borderRadius: 4, overflow: 'hidden', padding: '1px 0', position: 'relative' }}>
              {isEditing ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commitEdit(); e.stopPropagation(); }}
                  onMouseDown={e => e.stopPropagation()}
                  onTouchStart={e => e.stopPropagation()}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', outline: `2px solid ${accent}`, borderRadius: 4, background: calBg, color: textColor, fontSize: eventFs, fontFamily, textAlign: 'center', padding: 0, boxSizing: 'border-box', zIndex: 10 }}
                />
              ) : (
                <>
                  <span style={{ fontSize: dayNumFs, fontWeight: isToday(d) ? 800 : 400, color: isToday(d) ? 'white' : d ? textColor : 'transparent', lineHeight: 1.1 }}>{d || ''}</span>
                  {eventText && (
                    <div style={{ width: '90%', backgroundColor: accent + '33', borderRadius: 2, padding: '0 1px', marginTop: 1 }}>
                      <span style={{ fontSize: eventFs, color: accent, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', textAlign: 'center', lineHeight: 1.2 }}>{eventText}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyCalendarRenderer({ comp, isReadOnly }) {
  const { dispatch } = useProject();
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const p = comp.props;
  const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const ROWS = ['matin', 'apresmidi'];
  const ROW_LABELS = ['Matin', 'Après-midi'];
  const slots = p.slots || {};
  const border = `1px solid ${p.borderColor || '#E5E7EB'}`;
  const fs = p.fontSize || 11;
  const ff = `${p.fontFamily || 'Nunito'}, sans-serif`;

  const startEdit = (e, day, row) => {
    if (isReadOnly) return;
    e.stopPropagation();
    setEditValue(slots[day]?.[row] || '');
    setEditingCell({ day, row });
  };

  const commitEdit = () => {
    if (!editingCell || isReadOnly) return;
    const { day, row } = editingCell;
    const newSlots = { ...slots };
    if (!newSlots[day]) newSlots[day] = { matin: '', apresmidi: '' };
    newSlots[day] = { ...newSlots[day], [row]: editValue };
    dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { slots: newSlots } });
    setEditingCell(null);
  };

  const colCount = DAYS.length + 1;
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `44px repeat(${DAYS.length}, 1fr)`,
    width: '100%',
    flex: 1,
    minHeight: 0,
  };

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: p.borderRadius ?? 8, overflow: 'hidden', border, display: 'flex', flexDirection: 'column', fontFamily: ff, fontSize: fs, backgroundColor: p.bgColor || '#FFFFFF' }}>
      {/* Header row */}
      <div style={{ ...gridStyle, flexShrink: 0 }}>
        <div style={{ backgroundColor: p.headerBgColor || '#6C63FF', borderRight: border, borderBottom: border }} />
        {DAY_LABELS.map((label, i) => (
          <div key={i} style={{ backgroundColor: p.headerBgColor || '#6C63FF', color: p.headerTextColor || '#FFFFFF', fontWeight: 800, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 2px', borderRight: i < DAYS.length - 1 ? border : 'none', borderBottom: border, fontSize: fs }}>
            {label}
          </div>
        ))}
      </div>
      {/* Data rows */}
      {ROWS.map((row, ri) => (
        <div key={row} style={{ ...gridStyle, flex: 1, minHeight: 0 }}>
          <div style={{ backgroundColor: p.rowLabelBgColor || '#F5F3FF', color: p.rowLabelTextColor || '#4C1D95', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 3px', textAlign: 'center', borderRight: border, borderBottom: ri < ROWS.length - 1 ? border : 'none', fontSize: fs - 1, lineHeight: 1.2 }}>
            {ROW_LABELS[ri]}
          </div>
          {DAYS.map((day, di) => {
            const isEditing = editingCell?.day === day && editingCell?.row === row;
            const val = slots[day]?.[row] || '';
            return (
              <div key={day} onClick={(e) => startEdit(e, day, row)}
                style={{ backgroundColor: p.cellBgColor || '#FFFFFF', borderRight: di < DAYS.length - 1 ? border : 'none', borderBottom: ri < ROWS.length - 1 ? border : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 3px', cursor: 'text', position: 'relative', minWidth: 0 }}>
                {isEditing ? (
                  <textarea
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); } if (e.key === 'Escape') commitEdit(); e.stopPropagation(); }}
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', outline: `2px solid ${p.headerBgColor || '#6C63FF'}`, borderRadius: 2, background: p.cellBgColor || '#FFFFFF', color: p.cellTextColor || '#1F2937', fontSize: fs, fontFamily: ff, textAlign: 'center', padding: '2px', boxSizing: 'border-box', zIndex: 10, resize: 'none', overflow: 'auto' }}
                  />
                ) : (
                  <span style={{ color: p.cellTextColor || '#1F2937', fontSize: fs, overflow: 'hidden', whiteSpace: 'pre-wrap', width: '100%', textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word' }}>{val}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ScheduleRenderer({ comp, isReadOnly }) {
  const { dispatch } = useProject();
  const [editing, setEditing] = useState(null); // { slotId, field: 'hour'|'minute'|'label', value }

  const p = comp.props;
  const slots = Array.isArray(p.slots) ? p.slots : [];
  const ff = `${p.fontFamily || 'Nunito'}, sans-serif`;
  const rowH = Math.max(32, (comp.position.height) / Math.max(1, slots.length));

  const updateSlot = (id, changes) => {
    const newSlots = slots.map(s => s.id === id ? { ...s, ...changes } : s);
    dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { slots: newSlots } });
  };

  const startEdit = (e, slotId, field, currentValue) => {
    if (isReadOnly) return;
    e.stopPropagation();
    setEditing({ slotId, field, value: String(currentValue) });
  };

  const commitEdit = () => {
    if (!editing) return;
    const { slotId, field, value } = editing;
    if (field === 'hour') {
      const h = Math.max(0, Math.min(23, parseInt(value) || 0));
      updateSlot(slotId, { hour: h });
    } else if (field === 'minute') {
      const m = Math.max(0, Math.min(59, parseInt(value) || 0));
      updateSlot(slotId, { minute: m });
    } else if (field === 'label') {
      updateSlot(slotId, { label: value });
    }
    setEditing(null);
  };

  const adjustTime = (e, slotId, field, delta) => {
    e.stopPropagation();
    if (isReadOnly) return;
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;
    if (field === 'hour') updateSlot(slotId, { hour: ((slot.hour + delta + 24) % 24) });
    else updateSlot(slotId, { minute: ((slot.minute + delta + 60) % 60) });
  };

  const timeFs = Math.max(12, Math.min(22, rowH * 0.42));
  const labelFs = Math.max(10, Math.min(16, rowH * 0.35));
  const dotSize = Math.max(6, Math.min(10, rowH * 0.22));
  const padH = Math.max(6, comp.position.width * 0.03);
  const spinBtnStyle = {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: Math.max(7, timeFs * 0.42), lineHeight: 1,
    color: '#9CA3AF', padding: '0 1px', userSelect: 'none', display: 'block',
  };

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: p.bgColor || '#FFFFFF', borderRadius: p.borderRadius ?? 12, overflow: 'hidden', fontFamily: ff, display: 'flex', flexDirection: 'column' }}>
      {slots.map((slot, i) => {
        const isEditingH = editing?.slotId === slot.id && editing?.field === 'hour';
        const isEditingM = editing?.slotId === slot.id && editing?.field === 'minute';
        const isEditingL = editing?.slotId === slot.id && editing?.field === 'label';
        const borderBottom = i < slots.length - 1 ? `1px solid ${p.borderColor || '#F3F4F6'}` : 'none';

        return (
          <div key={slot.id || i} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: padH * 0.6, padding: `0 ${padH}px`, borderBottom, minHeight: 0, overflow: 'hidden' }}>
            {/* Color dot */}
            <div style={{ width: dotSize, height: dotSize, borderRadius: '50%', backgroundColor: slot.color || p.timeColor || '#6C63FF', flexShrink: 0 }} />

            {/* Hour spinner */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              {!isReadOnly && <button style={spinBtnStyle} onMouseDown={(e) => adjustTime(e, slot.id, 'hour', 1)}>▲</button>}
              {isEditingH ? (
                <input
                  autoFocus
                  value={editing.value}
                  onChange={e => setEditing(ed => ({ ...ed, value: e.target.value }))}
                  onBlur={commitEdit}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commitEdit(); e.stopPropagation(); }}
                  onMouseDown={e => e.stopPropagation()}
                  style={{ width: timeFs * 1.4, fontSize: timeFs, fontWeight: 800, color: p.timeColor || '#6C63FF', fontFamily: 'monospace', textAlign: 'center', border: 'none', outline: `2px solid ${p.timeColor || '#6C63FF'}`, borderRadius: 4, background: 'rgba(108,99,255,0.08)', padding: 0 }}
                />
              ) : (
                <span
                  onClick={(e) => startEdit(e, slot.id, 'hour', slot.hour)}
                  style={{ fontSize: timeFs, fontWeight: 800, color: p.timeColor || '#6C63FF', fontFamily: 'monospace', cursor: isReadOnly ? 'default' : 'text', lineHeight: 1, minWidth: timeFs * 1.2, textAlign: 'center' }}
                >
                  {String(slot.hour).padStart(2, '0')}
                </span>
              )}
              {!isReadOnly && <button style={spinBtnStyle} onMouseDown={(e) => adjustTime(e, slot.id, 'hour', -1)}>▼</button>}
            </div>

            {/* Colon separator */}
            <span style={{ fontSize: timeFs, fontWeight: 800, color: p.timeColor || '#6C63FF', lineHeight: 1, flexShrink: 0, marginBottom: !isReadOnly ? 2 : 0 }}>:</span>

            {/* Minute spinner */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              {!isReadOnly && <button style={spinBtnStyle} onMouseDown={(e) => adjustTime(e, slot.id, 'minute', 1)}>▲</button>}
              {isEditingM ? (
                <input
                  autoFocus
                  value={editing.value}
                  onChange={e => setEditing(ed => ({ ...ed, value: e.target.value }))}
                  onBlur={commitEdit}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commitEdit(); e.stopPropagation(); }}
                  onMouseDown={e => e.stopPropagation()}
                  style={{ width: timeFs * 1.4, fontSize: timeFs, fontWeight: 800, color: p.timeColor || '#6C63FF', fontFamily: 'monospace', textAlign: 'center', border: 'none', outline: `2px solid ${p.timeColor || '#6C63FF'}`, borderRadius: 4, background: 'rgba(108,99,255,0.08)', padding: 0 }}
                />
              ) : (
                <span
                  onClick={(e) => startEdit(e, slot.id, 'minute', slot.minute)}
                  style={{ fontSize: timeFs, fontWeight: 800, color: p.timeColor || '#6C63FF', fontFamily: 'monospace', cursor: isReadOnly ? 'default' : 'text', lineHeight: 1, minWidth: timeFs * 1.2, textAlign: 'center' }}
                >
                  {String(slot.minute).padStart(2, '0')}
                </span>
              )}
              {!isReadOnly && <button style={spinBtnStyle} onMouseDown={(e) => adjustTime(e, slot.id, 'minute', -1)}>▼</button>}
            </div>

            {/* Label */}
            {p.showLabels !== false && (
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                {isEditingL ? (
                  <input
                    autoFocus
                    value={editing.value}
                    onChange={e => setEditing(ed => ({ ...ed, value: e.target.value }))}
                    onBlur={commitEdit}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commitEdit(); e.stopPropagation(); }}
                    onMouseDown={e => e.stopPropagation()}
                    style={{ width: '100%', fontSize: labelFs, fontFamily: ff, color: p.textColor || '#1F2937', border: 'none', outline: `2px solid ${p.timeColor || '#6C63FF'}`, borderRadius: 4, background: 'rgba(108,99,255,0.05)', padding: '1px 4px', boxSizing: 'border-box' }}
                  />
                ) : (
                  <span
                    onClick={(e) => startEdit(e, slot.id, 'label', slot.label || '')}
                    style={{ fontSize: labelFs, color: p.textColor || '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', cursor: isReadOnly ? 'default' : 'text' }}
                  >
                    {slot.label || ''}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TableRenderer({ comp, isReadOnly }) {
  const { state, dispatch } = useProject();
  const isSelected = state.selectedComponentId === comp.id;
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const p = comp.props;
  const data = Array.isArray(p.data) ? p.data : [];

  const cellBg = (ri) => {
    if (ri === 0 && p.headerRow) return p.headerBgColor || '#6C63FF';
    return ri % 2 === 1 ? (p.altRowColor || '#F3F4F6') : (p.cellBgColor || '#FFFFFF');
  };
  const cellTxt = (ri) => ri === 0 && p.headerRow ? (p.headerTextColor || '#FFFFFF') : (p.textColor || '#1F2937');
  const cellFw = (ri) => ri === 0 && p.headerRow ? 700 : 400;
  const border = `1px solid ${p.borderColor || '#E5E7EB'}`;

  const startEdit = (e, ri, ci) => {
    if (isReadOnly) return;
    e.stopPropagation();
    setEditValue((data[ri] || [])[ci] || '');
    setEditingCell({ ri, ci });
  };

  const commitEdit = () => {
    if (!editingCell || isReadOnly) return;
    const { ri, ci } = editingCell;
    const newData = data.map((row, r) => r === ri ? row.map((c, col) => col === ci ? editValue : c) : row);
    dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: comp.id, props: { data: newData } });
    setEditingCell(null);
  };

  const fs = p.fontSize || 13;
  const ff = `${p.fontFamily || 'Nunito'}, sans-serif`;

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: p.borderRadius || 8, overflow: 'hidden', border, display: 'flex', flexDirection: 'column', fontSize: fs, fontFamily: ff }}>
      {data.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', flex: 1, borderBottom: ri < data.length - 1 ? border : 'none', minHeight: 0 }}>
          {row.map((cell, ci) => {
            const isEditing = editingCell?.ri === ri && editingCell?.ci === ci;
            const bg = cellBg(ri);
            const tc = cellTxt(ri);
            return (
              <div key={ci} onClick={(e) => startEdit(e, ri, ci)}
                style={{ flex: 1, backgroundColor: bg, borderRight: ci < row.length - 1 ? border : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px 4px', minWidth: 0, cursor: 'text', position: 'relative' }}>
                {isEditing ? (
                  <textarea
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); } if (e.key === 'Escape') commitEdit(); e.stopPropagation(); }}
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', outline: '2px solid #6C63FF', borderRadius: 2, background: bg, color: tc, fontSize: fs, fontFamily: ff, fontWeight: cellFw(ri), textAlign: 'center', padding: '2px', boxSizing: 'border-box', resize: 'none', overflow: 'auto' }}
                  />
                ) : (
                  <span style={{ color: tc, fontWeight: cellFw(ri), overflow: 'hidden', whiteSpace: 'pre-wrap', width: '100%', textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.2 }}>{cell}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function NavbarRenderer({ comp, isReadOnly }) {
  const { state, dispatch } = useProject();
  const isSelected = state.selectedComponentId === comp.id;
  const p = comp.props;

  const DEFAULT_ITEMS = [
    { iconName: 'Home', iconSet: 'lucide', label: 'Accueil', navigateTo: '' },
    { iconName: 'Search', iconSet: 'lucide', label: 'Recherche', navigateTo: '' },
    { iconName: 'Heart', iconSet: 'lucide', label: 'Favoris', navigateTo: '' },
    { iconName: 'User', iconSet: 'lucide', label: 'Profil', navigateTo: '' },
  ];
  const items = Array.isArray(p.items) ? p.items : DEFAULT_ITEMS;
  const selectedItemIdx = isSelected ? (state.selectedNavbarItemIndex ?? null) : null;
  const activeIndex = p.activeIndex ?? 0;

  const handleItemMouseDown = (e, i) => {
    if (!isSelected || isReadOnly) return;
    e.stopPropagation();
    dispatch({ type: 'SET_NAVBAR_ITEM', index: selectedItemIdx === i ? null : i });
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      ...getBg(p.bgColor, p.bgGradient),
      borderTop: `1px solid ${p.borderTopColor || '#E5E7EB'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 4px',
    }}>
      {items.map((item, i) => {
        const isActive = i === activeIndex;
        const isItemSel = isSelected && selectedItemIdx === i;
        const globalColor = isActive ? (p.activeColor || '#6C63FF') : (p.inactiveColor || '#9CA3AF');
        const color = item.color || globalColor;
        const iconSize = Math.min(
          (comp.position.width / items.length) * 0.45,
          comp.position.height * 0.4
        );
        return (
          <div key={i}
            onMouseDown={(e) => handleItemMouseDown(e, i)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 2, flex: 1, height: '100%',
              backgroundColor: isItemSel ? 'rgba(108,99,255,0.1)' : 'transparent',
              borderRadius: 6,
              outline: isItemSel ? '2px solid #6C63FF' : 'none',
              outlineOffset: '-2px',
              cursor: isSelected && !isReadOnly ? 'pointer' : 'default',
            }}>
            <AnyIcon name={item.iconName} iconSet={item.iconSet || 'lucide'} color={color} size={Math.max(14, iconSize)} />
            {p.showLabels !== false && (
              <span style={{
                fontSize: Math.max(8, comp.position.height * 0.13),
                color, fontFamily: 'Nunito, sans-serif',
                fontWeight: isActive ? 700 : 400,
                lineHeight: 1,
              }}>
                {item.label || ''}
              </span>
            )}
            {isActive && !p.showLabels && (
              <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: p.activeColor || '#6C63FF' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FontworkRenderer({ comp }) {
  const p = comp.props;
  const uid = `fw${comp.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const svgContent = getFontworkSvg(p.letter || 'A', p.style || 'fill', p, uid);
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}

function ComponentRenderer({ comp, isReadOnly }) {
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

    case 'searchbar': {
      const iconColor = props.iconColor || '#9CA3AF';
      const ff = `${props.fontFamily || 'Nunito'}, sans-serif`;
      const br = props.borderRadius ?? 24;
      const fs = props.fontSize || 14;
      return (
        <div style={{ width: '100%', height: '100%', ...getBg(props.bgColor, null), borderRadius: br, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, boxSizing: 'border-box', overflow: 'hidden' }}>
          <LucideIcons.Search size={Math.round(fs * 1.15)} color={iconColor} strokeWidth={2.2} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, color: props.textColor || '#6B7280', fontSize: fs, fontFamily: ff, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1 }}>
            {props.placeholder || 'Rechercher…'}
          </span>
          {props.showClearBtn && (
            <div style={{ width: Math.round(fs * 1.2), height: Math.round(fs * 1.2), borderRadius: '50%', backgroundColor: iconColor + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LucideIcons.X size={Math.round(fs * 0.7)} color={iconColor} strokeWidth={2.5} />
            </div>
          )}
        </div>
      );
    }

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

    case 'image': {
      const br = props.borderRadius ?? 8;
      const animType = props.animationType || '';
      const animStyle = animType ? {
        animation: `maquetapp-${animType} ${animType === 'float' ? '2s ease-in-out' : animType === 'pulse' ? '1.5s ease-in-out' : '3s linear'} infinite`,
        transformOrigin: 'center center',
      } : {};
      if (props.imageData) {
        if (props.frameless) {
          // No clipping wrapper — image floats freely, transparent PNGs show through
          return (
            <img
              src={props.imageData}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: props.objectFit || 'contain', display: 'block', borderRadius: br, ...animStyle }}
            />
          );
        }
        return (
          <div style={{ width: '100%', height: '100%', borderRadius: br, overflow: 'hidden' }}>
            <img src={props.imageData} alt="" style={{ width: '100%', height: '100%', objectFit: props.objectFit || 'cover', display: 'block', ...animStyle }} />
          </div>
        );
      }
      return (
        <div style={{ width: '100%', height: '100%', ...(!props.frameless && getBg(props.bgColor, props.bgGradient)), borderRadius: br, display: 'flex', alignItems: 'center', justifyContent: 'center', border: props.frameless ? '1.5px dashed #D1D5DB' : '2px dashed #D1D5DB' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: Math.min(pos.width, pos.height) * 0.28 }}>🖼️</div>
            <div style={{ fontSize: 11, marginTop: 4, fontFamily: 'Nunito, sans-serif', color: '#9CA3AF' }}>Cliquer pour importer</div>
          </div>
        </div>
      );
    }

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

    case 'icon': {
      const hasBg = 'bgColor' in props;
      return (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...(hasBg ? { ...getBg(props.bgColor, props.bgGradient), borderRadius: props.borderRadius ?? 100 } : {}),
        }}>
          <AnyIcon name={props.iconName} iconSet={props.iconSet || 'lucide'} color={props.color} size={Math.max(16, iconSize)} />
        </div>
      );
    }

    case 'navbar':
      return <NavbarRenderer comp={comp} isReadOnly={isReadOnly} />;

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

    case 'separator': {
      const sepColor = props.color || '#E5E7EB';
      const sepThick = props.thickness ?? 2;
      const sepStyle = props.lineStyle || 'solid';
      let sepContent;
      if (sepStyle === 'long-dash') {
        sepContent = <div style={{ width: '100%', height: sepThick, background: `repeating-linear-gradient(to right, ${sepColor} 0px, ${sepColor} 18px, transparent 18px, transparent 26px)` }} />;
      } else if (sepStyle === 'dash-dot') {
        sepContent = <div style={{ width: '100%', height: sepThick, background: `repeating-linear-gradient(to right, ${sepColor} 0px, ${sepColor} 10px, transparent 10px, transparent 14px, ${sepColor} 14px, ${sepColor} 16px, transparent 16px, transparent 22px)` }} />;
      } else if (sepStyle === 'wavy') {
        const amp = Math.max(3, sepThick * 2);
        sepContent = <svg width="100%" height={amp * 2 + 4} viewBox={`0 0 200 ${amp * 2 + 4}`} preserveAspectRatio="none"><path d={`M0,${amp+2} Q5,2 10,${amp+2} Q15,${amp*2+2} 20,${amp+2} Q25,2 30,${amp+2} Q35,${amp*2+2} 40,${amp+2} Q45,2 50,${amp+2} Q55,${amp*2+2} 60,${amp+2} Q65,2 70,${amp+2} Q75,${amp*2+2} 80,${amp+2} Q85,2 90,${amp+2} Q95,${amp*2+2} 100,${amp+2} Q105,2 110,${amp+2} Q115,${amp*2+2} 120,${amp+2} Q125,2 130,${amp+2} Q135,${amp*2+2} 140,${amp+2} Q145,2 150,${amp+2} Q155,${amp*2+2} 160,${amp+2} Q165,2 170,${amp+2} Q175,${amp*2+2} 180,${amp+2} Q185,2 190,${amp+2} Q195,${amp*2+2} 200,${amp+2}`} stroke={sepColor} strokeWidth={sepThick} fill="none" /></svg>;
      } else if (sepStyle === 'zigzag') {
        const zh = Math.max(6, sepThick * 3);
        sepContent = <svg width="100%" height={zh} viewBox={`0 0 200 ${zh}`} preserveAspectRatio="none"><polyline points={`0,${zh/2} 5,0 10,${zh} 15,0 20,${zh} 25,0 30,${zh} 35,0 40,${zh} 45,0 50,${zh} 55,0 60,${zh} 65,0 70,${zh} 75,0 80,${zh} 85,0 90,${zh} 95,0 100,${zh} 105,0 110,${zh} 115,0 120,${zh} 125,0 130,${zh} 135,0 140,${zh} 145,0 150,${zh} 155,0 160,${zh} 165,0 170,${zh} 175,0 180,${zh} 185,0 190,${zh} 195,0 200,${zh/2}`} stroke={sepColor} strokeWidth={sepThick} fill="none" /></svg>;
      } else if (sepStyle === 'double') {
        sepContent = <div style={{ width: '100%', borderTop: `${Math.max(3, sepThick + 2)}px double ${sepColor}` }} />;
      } else {
        // solid, dashed, dotted
        sepContent = <div style={{ width: '100%', borderTop: `${sepThick}px ${sepStyle} ${sepColor}` }} />;
      }
      return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>{sepContent}</div>;
    }

    case 'colorblock':
      if (props.backgroundImage) {
        return <div style={{ width: '100%', height: '100%', borderRadius: props.borderRadius || 0, overflow: 'hidden' }}>
          <img src={props.backgroundImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>;
      }
      return <div style={{ width: '100%', height: '100%', ...getBg(props.bgColor, props.bgGradient), borderRadius: props.borderRadius }} />;

    case 'keyboard': {
      const rows = [
        ['A','Z','E','R','T','Y','U','I','O','P'],
        ['Q','S','D','F','G','H','J','K','L','M'],
        ['⇧','W','X','C','V','B','N','⌫'],
        ['123','espace','↵'],
      ];
      const kbBg = props.bgColor || '#D1D5DB';
      const keyBg = props.keyColor || '#FFFFFF';
      const keyTxt = props.keyTextColor || '#1F2937';
      const accent = props.accentColor || '#6C63FF';
      const rowGap = Math.max(2, pos.height * 0.015);
      const keyGap = Math.max(2, pos.width * 0.008);
      const keyRadius = Math.max(3, pos.width * 0.012);
      const fontSize = Math.max(8, Math.min(15, pos.height * 0.065));
      return (
        <div style={{ width: '100%', height: '100%', backgroundColor: kbBg, borderRadius: props.borderRadius || 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: `${rowGap}px ${keyGap * 2}px`, gap: rowGap, boxSizing: 'border-box' }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', flex: 1, justifyContent: 'center', gap: keyGap }}>
              {row.map((key) => {
                const isSpace = key === 'espace';
                const isWideKey = key === '⇧' || key === '⌫' || key === '123' || key === '↵';
                const isAccent = isSpace || key === '↵';
                return (
                  <div key={key} style={{ flex: isSpace ? 4 : isWideKey ? 1.6 : 1, backgroundColor: isAccent ? accent : keyBg, borderRadius: keyRadius, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize, fontFamily: 'Nunito, sans-serif', fontWeight: 600, color: isAccent ? '#fff' : keyTxt, boxShadow: '0 1px 0 rgba(0,0,0,0.18)', minWidth: 0 }}>
                    {key}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    case 'calendar':
      return <CalendarRenderer comp={comp} isReadOnly={isReadOnly} />;

    case 'weekcalendar':
      return <WeeklyCalendarRenderer comp={comp} isReadOnly={isReadOnly} />;

    case 'schedule':
      return <ScheduleRenderer comp={comp} isReadOnly={isReadOnly} />;

    case 'drawing':
      return <DrawingRenderer comp={comp} isReadOnly={isReadOnly} />;

    case 'torch':
      return <TorchButton comp={comp} isReadOnly={isReadOnly} />;

    case 'table':
      return <TableRenderer comp={comp} isReadOnly={isReadOnly} />;

    case 'shape':
      return <ShapeWithText comp={comp} isReadOnly={isReadOnly} />;

    case 'fontwork':
      return <FontworkRenderer comp={comp} />;

    case 'line': {
      const w = pos.width;
      const h = pos.height;
      const lx1 = (props.x1f ?? 0.05) * w;
      const ly1 = (props.y1f ?? 0.5) * h;
      const lx2 = (props.x2f ?? 0.95) * w;
      const ly2 = (props.y2f ?? 0.5) * h;
      const color = props.color || '#374151';
      const thick = props.thickness ?? 2;
      const style = props.lineStyle || 'solid';
      let dashArray;
      if (style === 'dashed') dashArray = `${thick*4},${thick*2}`;
      else if (style === 'dotted') dashArray = `${thick},${thick*2}`;
      else if (style === 'long-dash') dashArray = `${thick*8},${thick*3}`;
      else if (style === 'dash-dot') dashArray = `${thick*6},${thick*2},${thick},${thick*2}`;
      const uid = comp.id.slice(-6);
      const aSize = Math.max(6, thick * 5);
      const hasArrows = props.arrowStart !== 'none' || props.arrowEnd !== 'none';
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
          {hasArrows && (
            <defs>
              {props.arrowStart === 'arrow' && <marker id={`as${uid}`} markerWidth={aSize} markerHeight={aSize} refX={aSize} refY={aSize/2} orient="auto-start-reverse"><polygon points={`0 0, ${aSize} ${aSize/2}, 0 ${aSize}`} fill={color} /></marker>}
              {props.arrowStart === 'dot' && <marker id={`as${uid}`} markerWidth={aSize} markerHeight={aSize} refX={aSize/2} refY={aSize/2} orient="auto"><circle cx={aSize/2} cy={aSize/2} r={aSize/2 - 0.5} fill={color} /></marker>}
              {props.arrowEnd === 'arrow' && <marker id={`ae${uid}`} markerWidth={aSize} markerHeight={aSize} refX={0} refY={aSize/2} orient="auto"><polygon points={`0 0, ${aSize} ${aSize/2}, 0 ${aSize}`} fill={color} /></marker>}
              {props.arrowEnd === 'dot' && <marker id={`ae${uid}`} markerWidth={aSize} markerHeight={aSize} refX={aSize/2} refY={aSize/2} orient="auto"><circle cx={aSize/2} cy={aSize/2} r={aSize/2 - 0.5} fill={color} /></marker>}
            </defs>
          )}
          <line
            x1={lx1} y1={ly1} x2={lx2} y2={ly2}
            stroke={color} strokeWidth={thick}
            strokeDasharray={dashArray}
            strokeLinecap="round"
            markerStart={props.arrowStart !== 'none' ? `url(#as${uid})` : undefined}
            markerEnd={props.arrowEnd !== 'none' ? `url(#ae${uid})` : undefined}
          />
        </svg>
      );
    }

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
  const [guides, setGuides] = useState([]);
  const [linePreview, setLinePreview] = useState(null); // { x1, y1, x2, y2 }
  const drawLineStart = useRef(null);

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

  const handleComponentTouchStart = useCallback((e, compId) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const touch = e.touches[0];
    dispatch({ type: 'SET_SELECTED_COMPONENT', id: compId });
    const screen = state.screens.find(s => s.id === state.activeScreenId);
    const comp = screen?.components.find(c => c.id === compId);
    if (!comp) return;
    const { scaleX, scaleY } = getScale();
    dragState.current = {
      type: 'move', compId,
      startMouseX: touch.clientX, startMouseY: touch.clientY,
      origX: comp.position.x, origY: comp.position.y,
      width: comp.position.width, height: comp.position.height,
      scaleX, scaleY,
    };
  }, [state, dispatch, getScale]);

  const handleResizeTouchStart = useCallback((e, compId, handle) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const screen = state.screens.find(s => s.id === state.activeScreenId);
    const comp = screen?.components.find(c => c.id === compId);
    if (!comp) return;
    const { scaleX, scaleY } = getScale();
    const touch = e.touches[0];
    dragState.current = {
      type: 'resize', compId, handle,
      startMouseX: touch.clientX, startMouseY: touch.clientY,
      origX: comp.position.x, origY: comp.position.y,
      origW: comp.position.width, origH: comp.position.height,
      scaleX, scaleY,
    };
  }, [state, getScale]);

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

  const handleRotateMouseDown = useCallback((e, compId) => {
    if (e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    const screen = state.screens.find(s => s.id === state.activeScreenId);
    const comp = screen?.components.find(c => c.id === compId);
    if (!comp) return;
    const rect = ref.current.getBoundingClientRect();
    const { scaleX, scaleY } = getScale();
    // Component center in client coordinates
    const centerClientX = rect.left + (comp.position.x + comp.position.width / 2) / scaleX;
    const centerClientY = rect.top + (comp.position.y + comp.position.height / 2) / scaleY;
    const startAngle = Math.atan2(e.clientY - centerClientY, e.clientX - centerClientX) * 180 / Math.PI;
    dragState.current = {
      type: 'rotate', compId,
      centerClientX, centerClientY,
      startAngle,
      origRotation: comp.props.rotation || 0,
    };
  }, [state, getScale, ref]);

  const handleLineEndpointMouseDown = useCallback((e, compId, endpoint) => {
    if (e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    const s = state.screens.find(s => s.id === state.activeScreenId);
    const comp = s?.components.find(c => c.id === compId);
    if (!comp) return;
    const { scaleX, scaleY } = getScale();
    const p = comp.props;
    const pos = comp.position;
    dragState.current = {
      type: 'moveLineEndpoint',
      compId, endpoint,
      scaleX, scaleY,
      startMouseX: e.clientX, startMouseY: e.clientY,
      origAx: pos.x + (p.x1f ?? 0.05) * pos.width,
      origAy: pos.y + (p.y1f ?? 0.5) * pos.height,
      origBx: pos.x + (p.x2f ?? 0.95) * pos.width,
      origBy: pos.y + (p.y2f ?? 0.5) * pos.height,
    };
  }, [state, getScale]);

  useEffect(() => {
    const MIN_SIZE = 20;
    const SNAP_DIST = 6;

    // Returns snapped {x, y} and alignment guide lines for a move operation
    const computeSnap = (ds, rawX, rawY) => {
      const w = ds.width, h = ds.height;
      const activeScreen = state.screens.find(s => s.id === state.activeScreenId);
      const others = (activeScreen?.components || []).filter(c => c.id !== ds.compId);
      const xT = [0, CANVAS_W / 2, CANVAS_W, ...others.flatMap(c => [c.position.x, c.position.x + c.position.width / 2, c.position.x + c.position.width])];
      const yT = [0, CANVAS_H / 2, CANVAS_H, ...others.flatMap(c => [c.position.y, c.position.y + c.position.height / 2, c.position.y + c.position.height])];
      let x = rawX, y = rawY;
      let bx = SNAP_DIST, by = SNAP_DIST, gx = null, gy = null;
      for (const t of xT) {
        for (const [a, off] of [[rawX, 0], [rawX + w / 2, -w / 2], [rawX + w, -w]]) {
          const d = Math.abs(a - t);
          if (d < bx) { bx = d; x = t + off; gx = t; }
        }
      }
      for (const t of yT) {
        for (const [a, off] of [[rawY, 0], [rawY + h / 2, -h / 2], [rawY + h, -h]]) {
          const d = Math.abs(a - t);
          if (d < by) { by = d; y = t + off; gy = t; }
        }
      }
      const gs = [];
      if (gx !== null) gs.push({ axis: 'v', pos: gx });
      if (gy !== null) gs.push({ axis: 'h', pos: gy });
      return { x: Math.max(0, Math.min(x, CANVAS_W - w)), y: Math.max(0, Math.min(y, CANVAS_H - h)), guides: gs };
    };

    const doResize = (ds, dx, dy) => {
      let { origX: x, origY: y, origW: w, origH: h } = ds;
      switch (ds.handle) {
        case 'se': w = Math.max(MIN_SIZE, ds.origW + dx); h = Math.max(MIN_SIZE, ds.origH + dy); break;
        case 'sw': w = Math.max(MIN_SIZE, ds.origW - dx); x = ds.origX + ds.origW - w; h = Math.max(MIN_SIZE, ds.origH + dy); break;
        case 'ne': w = Math.max(MIN_SIZE, ds.origW + dx); h = Math.max(MIN_SIZE, ds.origH - dy); y = ds.origY + ds.origH - h; break;
        case 'nw': w = Math.max(MIN_SIZE, ds.origW - dx); x = ds.origX + ds.origW - w; h = Math.max(MIN_SIZE, ds.origH - dy); y = ds.origY + ds.origH - h; break;
      }
      return { x: Math.max(0, x), y: Math.max(0, y), width: Math.min(w, CANVAS_W - Math.max(0, x)), height: Math.min(h, CANVAS_H - Math.max(0, y)) };
    };

    const onMouseMove = (e) => {
      const ds = dragState.current;
      if (!ds) return;
      if (ds.type === 'moveLineEndpoint') {
        const dx = (e.clientX - ds.startMouseX) * ds.scaleX;
        const dy = (e.clientY - ds.startMouseY) * ds.scaleY;
        let ax = ds.origAx, ay = ds.origAy, bx = ds.origBx, by = ds.origBy;
        if (ds.endpoint === 'a') { ax += dx; ay += dy; } else { bx += dx; by += dy; }
        const pad = 10;
        const x = Math.min(ax, bx) - pad;
        const y = Math.min(ay, by) - pad;
        const w = Math.max(20, Math.abs(bx - ax) + pad * 2);
        const h = Math.max(20, Math.abs(by - ay) + pad * 2);
        dispatch({ type: 'MOVE_LINE_ENDPOINT', id: ds.compId, x, y, width: w, height: h, x1f: (ax-x)/w, y1f: (ay-y)/h, x2f: (bx-x)/w, y2f: (by-y)/h, commit: false });
        return;
      }
      if (ds.type === 'rotate') {
        const dx = e.clientX - ds.centerClientX;
        const dy = e.clientY - ds.centerClientY;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        let rotation = Math.round(ds.origRotation + angle - ds.startAngle);
        rotation = ((rotation % 360) + 360) % 360;
        // Snap to 0/45/90/135/180/225/270/315 when close
        const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
        for (const snap of snapAngles) {
          if (Math.abs(rotation - snap) < 5) { rotation = snap % 360; break; }
        }
        dispatch({ type: 'UPDATE_COMPONENT_PROPS', id: ds.compId, props: { rotation } });
        return;
      }
      const dx = (e.clientX - ds.startMouseX) * ds.scaleX;
      const dy = (e.clientY - ds.startMouseY) * ds.scaleY;
      if (ds.type === 'move') {
        const { x, y, guides: g } = computeSnap(ds, ds.origX + dx, ds.origY + dy);
        setGuides(g);
        dispatch({ type: 'MOVE_COMPONENT', id: ds.compId, x, y });
      } else if (ds.type === 'resize') {
        setGuides([]);
        const pos = doResize(ds, dx, dy);
        dispatch({ type: 'RESIZE_COMPONENT', id: ds.compId, ...pos });
      }
    };
    const onMouseUp = (e) => {
      const ds = dragState.current;
      if (!ds) return;
      setGuides([]);
      if (ds.type === 'moveLineEndpoint') {
        const dx = (e.clientX - ds.startMouseX) * ds.scaleX;
        const dy = (e.clientY - ds.startMouseY) * ds.scaleY;
        let ax = ds.origAx, ay = ds.origAy, bx = ds.origBx, by = ds.origBy;
        if (ds.endpoint === 'a') { ax += dx; ay += dy; } else { bx += dx; by += dy; }
        const pad = 10;
        const x = Math.min(ax, bx) - pad;
        const y = Math.min(ay, by) - pad;
        const w = Math.max(20, Math.abs(bx - ax) + pad * 2);
        const h = Math.max(20, Math.abs(by - ay) + pad * 2);
        dispatch({ type: 'MOVE_LINE_ENDPOINT', id: ds.compId, x, y, width: w, height: h, x1f: (ax-x)/w, y1f: (ay-y)/h, x2f: (bx-x)/w, y2f: (by-y)/h, commit: true });
        dragState.current = null;
        return;
      }
      if (ds.type === 'rotate') { dragState.current = null; return; }
      const dx = (e.clientX - ds.startMouseX) * ds.scaleX;
      const dy = (e.clientY - ds.startMouseY) * ds.scaleY;
      if (ds.type === 'move') {
        const { x, y } = computeSnap(ds, ds.origX + dx, ds.origY + dy);
        if (Math.abs(x - ds.origX) > 1 || Math.abs(y - ds.origY) > 1) dispatch({ type: 'COMMIT_MOVE', id: ds.compId, x, y });
      } else if (ds.type === 'resize') {
        const activeScreen = state.screens.find(s => s.id === state.activeScreenId);
        const comp = activeScreen?.components.find(c => c.id === ds.compId);
        if (comp) dispatch({ type: 'COMMIT_RESIZE', id: ds.compId, x: comp.position.x, y: comp.position.y, width: comp.position.width, height: comp.position.height });
      }
      dragState.current = null;
    };
    const onTouchMove = (e) => {
      const ds = dragState.current;
      if (!ds || e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dx = (touch.clientX - ds.startMouseX) * ds.scaleX;
      const dy = (touch.clientY - ds.startMouseY) * ds.scaleY;
      if (ds.type === 'move') {
        const { x, y, guides: g } = computeSnap(ds, ds.origX + dx, ds.origY + dy);
        setGuides(g);
        dispatch({ type: 'MOVE_COMPONENT', id: ds.compId, x, y });
      } else if (ds.type === 'resize') {
        setGuides([]);
        const pos = doResize(ds, dx, dy);
        dispatch({ type: 'RESIZE_COMPONENT', id: ds.compId, ...pos });
      }
    };
    const onTouchEnd = (e) => {
      const ds = dragState.current;
      if (!ds) return;
      setGuides([]);
      if (e.changedTouches.length === 0) { dragState.current = null; return; }
      const touch = e.changedTouches[0];
      const dx = (touch.clientX - ds.startMouseX) * ds.scaleX;
      const dy = (touch.clientY - ds.startMouseY) * ds.scaleY;
      if (ds.type === 'move') {
        const { x, y } = computeSnap(ds, ds.origX + dx, ds.origY + dy);
        if (Math.abs(x - ds.origX) > 1 || Math.abs(y - ds.origY) > 1) dispatch({ type: 'COMMIT_MOVE', id: ds.compId, x, y });
      } else if (ds.type === 'resize') {
        const activeScreen = state.screens.find(s => s.id === state.activeScreenId);
        const comp = activeScreen?.components.find(c => c.id === ds.compId);
        if (comp) dispatch({ type: 'COMMIT_RESIZE', id: ds.compId, x: comp.position.x, y: comp.position.y, width: comp.position.width, height: comp.position.height });
      }
      dragState.current = null;
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_PENDING_TOOL', tool: null });
        drawLineStart.current = null;
        setLinePreview(null);
      }
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [dispatch, state, setGuides, setLinePreview]);

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
        const rotation = comp.props.rotation || 0;
        const flipH = comp.props.flipH || false;
        const flipV = comp.props.flipV || false;
        const transforms = [];
        if (rotation) transforms.push(`rotate(${rotation}deg)`);
        if (flipH) transforms.push('scaleX(-1)');
        if (flipV) transforms.push('scaleY(-1)');
        const transformStr = transforms.length ? transforms.join(' ') : undefined;
        return (
          <div key={comp.id}
            className={isRemote ? undefined : 'canvas-component'}
            onMouseDown={isRemote ? undefined : (e) => handleComponentMouseDown(e, comp.id)}
            onTouchStart={isRemote ? undefined : (e) => handleComponentTouchStart(e, comp.id)}
            style={{ position: 'absolute', left: x, top: y, width, height, opacity: comp.props.opacity ?? 1, zIndex: comp.zIndex || 1, outline: isSelected ? '2px solid #6C63FF' : undefined, outlineOffset: isSelected ? '1px' : undefined, transform: transformStr, transformOrigin: 'center center' }}>
            <div className="component-outline" style={{ width: '100%', height: '100%' }}>
              <ComponentRenderer comp={comp} isReadOnly={isRemote} />
            </div>
            {!isRemote && comp.props?.navigateTo && (
              <div style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, backgroundColor: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
                <span style={{ fontSize: 9, color: 'white', lineHeight: 1 }}>🔗</span>
              </div>
            )}
            {isSelected && (
              <div
                onMouseDown={(e) => handleRotateMouseDown(e, comp.id)}
                style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', width: 20, height: 20, borderRadius: '50%', backgroundColor: '#6C63FF', border: '2px solid white', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', zIndex: 15, boxShadow: '0 1px 5px rgba(0,0,0,0.35)', userSelect: 'none' }}
                title="Pivoter"
              >↻</div>
            )}
            {isSelected && comp.type === 'line' && (() => {
              const lx1 = (comp.props.x1f ?? 0.05) * width;
              const ly1 = (comp.props.y1f ?? 0.5) * height;
              const lx2 = (comp.props.x2f ?? 0.95) * width;
              const ly2 = (comp.props.y2f ?? 0.5) * height;
              return (
                <>
                  <div onMouseDown={(e) => handleLineEndpointMouseDown(e, comp.id, 'a')} style={{ position: 'absolute', left: lx1 - 7, top: ly1 - 7, width: 14, height: 14, borderRadius: '50%', backgroundColor: '#6C63FF', border: '2px solid white', cursor: 'move', zIndex: 15, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} title="Point A" />
                  <div onMouseDown={(e) => handleLineEndpointMouseDown(e, comp.id, 'b')} style={{ position: 'absolute', left: lx2 - 7, top: ly2 - 7, width: 14, height: 14, borderRadius: '50%', backgroundColor: '#EC4899', border: '2px solid white', cursor: 'move', zIndex: 15, boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} title="Point B" />
                </>
              );
            })()}
            {isSelected && comp.type !== 'line' && ['nw', 'ne', 'sw', 'se'].map((h) => (
              <div key={h} className={`resize-handle ${h}`} onMouseDown={(e) => handleResizeMouseDown(e, comp.id, h)} onTouchStart={(e) => handleResizeTouchStart(e, comp.id, h)} />
            ))}
          </div>
        );
      })}
      {/* Alignment guide lines */}
      {guides.map((g, i) => (
        <div key={i} style={{
          position: 'absolute', pointerEvents: 'none', zIndex: 9998,
          backgroundColor: '#FF3B82',
          ...(g.axis === 'v'
            ? { left: Math.round(g.pos) - 0.5, top: 0, width: 1, height: CANVAS_H }
            : { top: Math.round(g.pos) - 0.5, left: 0, height: 1, width: CANVAS_W }),
        }} />
      ))}
      {/* Read-only overlay for remote screens */}
      {isRemote && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 9999, cursor: 'default' }} title={`Écran de ${screen._nickname || 'un camarade'} — lecture seule`} />
      )}
      {/* Draw-line mode overlay */}
      {state.pendingTool === 'line' && !isRemote && (
        <div
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            const rect = ref.current.getBoundingClientRect();
            const { scaleX, scaleY } = getScale();
            const cx = Math.max(0, Math.min(CANVAS_W, (e.clientX - rect.left) * scaleX));
            const cy = Math.max(0, Math.min(CANVAS_H, (e.clientY - rect.top) * scaleY));
            drawLineStart.current = { x: cx, y: cy };
            setLinePreview({ x1: cx, y1: cy, x2: cx, y2: cy });
          }}
          onMouseMove={(e) => {
            if (!drawLineStart.current) return;
            const rect = ref.current.getBoundingClientRect();
            const { scaleX, scaleY } = getScale();
            const cx = Math.max(0, Math.min(CANVAS_W, (e.clientX - rect.left) * scaleX));
            const cy = Math.max(0, Math.min(CANVAS_H, (e.clientY - rect.top) * scaleY));
            setLinePreview({ x1: drawLineStart.current.x, y1: drawLineStart.current.y, x2: cx, y2: cy });
          }}
          onMouseUp={(e) => {
            if (!drawLineStart.current) { dispatch({ type: 'SET_PENDING_TOOL', tool: null }); return; }
            const rect = ref.current.getBoundingClientRect();
            const { scaleX, scaleY } = getScale();
            const cx = Math.max(0, Math.min(CANVAS_W, (e.clientX - rect.left) * scaleX));
            const cy = Math.max(0, Math.min(CANVAS_H, (e.clientY - rect.top) * scaleY));
            const x1 = drawLineStart.current.x, y1 = drawLineStart.current.y;
            const x2 = cx, y2 = cy;
            const pad = 10;
            const bx = Math.min(x1, x2) - pad;
            const by = Math.min(y1, y2) - pad;
            const bw = Math.max(20, Math.abs(x2 - x1) + pad * 2);
            const bh = Math.max(20, Math.abs(y2 - y1) + pad * 2);
            dispatch({ type: 'ADD_COMPONENT', componentType: 'line', x: bx, y: by, overrideProps: { x1f: (x1-bx)/bw, y1f: (y1-by)/bh, x2f: (x2-bx)/bw, y2f: (y2-by)/bh }, overrideSize: { width: bw, height: bh } });
            drawLineStart.current = null;
            setLinePreview(null);
          }}
          style={{ position: 'absolute', inset: 0, zIndex: 9997, cursor: 'crosshair' }}
        />
      )}
      {/* Line draw preview */}
      {linePreview && (
        <svg style={{ position: 'absolute', inset: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: 'none', zIndex: 9998, overflow: 'visible' }} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
          <line x1={linePreview.x1} y1={linePreview.y1} x2={linePreview.x2} y2={linePreview.y2} stroke="#6C63FF" strokeWidth={2} strokeDasharray="6,3" strokeLinecap="round" />
          <circle cx={linePreview.x1} cy={linePreview.y1} r={5} fill="#6C63FF" />
          <circle cx={linePreview.x2} cy={linePreview.y2} r={5} fill="#EC4899" />
        </svg>
      )}
      {/* Draw mode banner */}
      {state.pendingTool === 'line' && !isRemote && (
        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#6C63FF', color: 'white', fontSize: 11, fontFamily: 'Nunito, sans-serif', fontWeight: 700, padding: '5px 14px', borderRadius: 20, zIndex: 10000, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          ✏️ Cliquez et glissez pour tracer la ligne — Échap pour annuler
        </div>
      )}
    </div>
  );
}
