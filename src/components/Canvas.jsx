import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useProject, useActiveScreen } from '../hooks/useProject';
import * as LucideIcons from 'lucide-react';
import * as TablerIcons from '@tabler/icons-react';

const CANVAS_W = 390;
const CANVAS_H = 844;

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
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commitEdit(); e.stopPropagation(); }}
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', outline: `2px solid ${p.headerBgColor || '#6C63FF'}`, borderRadius: 2, background: p.cellBgColor || '#FFFFFF', color: p.cellTextColor || '#1F2937', fontSize: fs, fontFamily: ff, textAlign: 'center', padding: '0 2px', boxSizing: 'border-box', zIndex: 10 }}
                  />
                ) : (
                  <span style={{ color: p.cellTextColor || '#1F2937', fontSize: fs, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center', lineHeight: 1.2 }}>{val}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
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
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') commitEdit(); e.stopPropagation(); }}
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    style={{ width: '100%', height: '100%', border: 'none', outline: '2px solid #6C63FF', borderRadius: 2, background: bg, color: tc, fontSize: fs, fontFamily: ff, fontWeight: cellFw(ri), textAlign: 'center', padding: '0 2px', boxSizing: 'border-box' }}
                  />
                ) : (
                  <span style={{ color: tc, fontWeight: cellFw(ri), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>{cell}</span>
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

    case 'image':
      if (props.imageData) {
        return (
          <div style={{ width: '100%', height: '100%', borderRadius: props.borderRadius || 8, overflow: 'hidden' }}>
            <img src={props.imageData} alt="" style={{ width: '100%', height: '100%', objectFit: props.objectFit || 'cover', display: 'block' }} />
          </div>
        );
      }
      return (
        <div style={{ width: '100%', height: '100%', ...getBg(props.bgColor, props.bgGradient), borderRadius: props.borderRadius || 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #D1D5DB' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: Math.min(pos.width, pos.height) * 0.28 }}>🖼️</div>
            <div style={{ fontSize: 11, marginTop: 4, fontFamily: 'Nunito, sans-serif', color: '#9CA3AF' }}>Cliquer pour importer</div>
          </div>
        </div>
      );

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

    case 'separator':
      return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}><div style={{ width: '100%', height: 1.5, backgroundColor: props.color }} /></div>;

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

    case 'table':
      return <TableRenderer comp={comp} isReadOnly={isReadOnly} />;

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
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [dispatch, state, setGuides]);

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
        return (
          <div key={comp.id}
            className={isRemote ? undefined : 'canvas-component'}
            onMouseDown={isRemote ? undefined : (e) => handleComponentMouseDown(e, comp.id)}
            onTouchStart={isRemote ? undefined : (e) => handleComponentTouchStart(e, comp.id)}
            style={{ position: 'absolute', left: x, top: y, width, height, opacity: comp.props.opacity ?? 1, zIndex: comp.zIndex || 1, outline: isSelected ? '2px solid #6C63FF' : undefined, outlineOffset: isSelected ? '1px' : undefined }}>
            <div className="component-outline" style={{ width: '100%', height: '100%' }}>
              <ComponentRenderer comp={comp} isReadOnly={isRemote} />
            </div>
            {!isRemote && comp.props?.navigateTo && (
              <div style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, backgroundColor: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
                <span style={{ fontSize: 9, color: 'white', lineHeight: 1 }}>🔗</span>
              </div>
            )}
            {isSelected && ['nw', 'ne', 'sw', 'se'].map((h) => (
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
    </div>
  );
}
