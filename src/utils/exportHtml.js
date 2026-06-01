import { getShapeSvgInner } from '../data/shapes';

function getBgCss(bgColor, bgGradient) {
  if (bgGradient && bgGradient.from && bgGradient.to) {
    return `background:linear-gradient(${bgGradient.angle ?? 135}deg,${bgGradient.from},${bgGradient.to})`;
  }
  return `background-color:${bgColor}`;
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function lucideRef(name) {
  if (!name) return '';
  // Convert PascalCase to kebab-case for lucide web component
  return name.replace(/([A-Z])/g, (m, l, i) => (i > 0 ? '-' : '') + l.toLowerCase());
}

function compToHtml(comp) {
  const { type, props, position: pos, zIndex } = comp;
  const base = `position:absolute;left:${pos.x}px;top:${pos.y}px;width:${pos.width}px;height:${pos.height}px;opacity:${props.opacity ?? 1};z-index:${zIndex || 1};box-sizing:border-box;`;
  const navOnclick = props.navigateTo
    ? ` onclick="document.querySelectorAll('.screen').forEach((el)=>el.style.display=el.id==='screen-${props.navigateTo}'?'block':'none')"`
    : '';

  switch (type) {
    case 'button': {
      const iconOnly = props.iconPosition === 'only';
      const useEmoji = iconOnly && props.emoji;
      const emojiSize = Math.round(Math.min(pos.width, pos.height) * 0.52);
      const iconHtml = useEmoji
        ? `<span style="font-size:${emojiSize}px;line-height:1">${escHtml(props.emoji)}</span>`
        : props.iconName
          ? `<i data-lucide="${lucideRef(props.iconName)}" style="width:${(props.fontSize || 16) + 4}px;height:${(props.fontSize || 16) + 4}px;flex-shrink:0"></i>`
          : '';
      const labelHtml = !iconOnly && props.label ? `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-style:${props.fontStyle || 'normal'};text-decoration:${props.textDecoration || 'none'}">${escHtml(props.label)}</span>` : '';
      const flexDir = props.iconPosition === 'right' ? 'row-reverse' : 'row';
      const shadow = props.bgColor === 'transparent' ? '' : ';box-shadow:0 2px 8px rgba(0,0,0,0.15)';
      return `<button${navOnclick} style="${base}${getBgCss(props.bgColor, props.bgGradient)};color:${props.textColor};font-size:${props.fontSize || 16}px;border-radius:${props.borderRadius || 12}px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;flex-direction:${flexDir};font-family:${props.fontFamily || 'Nunito'},sans-serif;font-weight:700${shadow};padding:0 12px">${iconHtml}${labelHtml}</button>`;
    }

    case 'text': {
      const fw = props.fontWeight === 'bold' ? 700 : props.fontWeight === 'semibold' ? 600 : 400;
      const vAlign = props.verticalAlign === 'top' ? 'flex-start' : props.verticalAlign === 'bottom' ? 'flex-end' : 'center';
      return `<p${navOnclick} style="${base}color:${props.textColor};font-size:${props.fontSize || 16}px;font-weight:${fw};font-family:${props.fontFamily || 'Nunito'},sans-serif;font-style:${props.fontStyle || 'normal'};text-decoration:${props.textDecoration || 'none'};text-align:${props.textAlign || 'left'};margin:0;display:flex;align-items:${vAlign};line-height:1.4;overflow:hidden;padding:2px 4px;white-space:pre-wrap;word-break:break-word${navOnclick ? ';cursor:pointer' : ''}">${escHtml(props.label)}</p>`;
    }

    case 'input':
      return `<div style="${base}display:flex;flex-direction:column;gap:4px">
  <label style="font-size:12px;color:#6B7280;font-family:${props.fontFamily || 'Nunito'},sans-serif;font-weight:600">${escHtml(props.label)}</label>
  <input type="text" placeholder="${escHtml(props.placeholder)}" style="flex:1;${getBgCss(props.bgColor, props.bgGradient)};color:${props.textColor};border-radius:${props.borderRadius || 8}px;border:1.5px solid #E5E7EB;padding:0 12px;font-size:14px;font-family:${props.fontFamily || 'Nunito'},sans-serif;outline:none;width:100%;box-sizing:border-box">
</div>`;

    case 'searchbar': {
      const iconColor = props.iconColor || '#9CA3AF';
      const br = props.borderRadius ?? 24;
      const fs = props.fontSize || 14;
      const ff = props.fontFamily || 'Nunito';
      const bg = props.bgColor || '#F3F4F6';
      const tc = props.textColor || '#6B7280';
      const clearBtn = props.showClearBtn
        ? `<span style="width:${Math.round(fs*1.2)}px;height:${Math.round(fs*1.2)}px;border-radius:50%;background:${iconColor}33;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:${Math.round(fs*0.6)}px;color:${iconColor}">✕</span>`
        : '';
      return `<div${navOnclick} style="${base}background:${bg};border-radius:${br}px;display:flex;align-items:center;padding:0 12px;gap:8px;box-sizing:border-box;overflow:hidden${navOnclick ? ';cursor:pointer' : ''}">
  <svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(fs*1.15)}" height="${Math.round(fs*1.15)}" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  <span style="flex:1;color:${tc};font-size:${fs}px;font-family:${ff},sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(props.placeholder || 'Rechercher…')}</span>
  ${clearBtn}
</div>`;
    }

    case 'checkbox':
      return `<label${navOnclick} style="${base}display:flex;align-items:center;gap:10px;cursor:pointer;font-family:${props.fontFamily || 'Nunito'},sans-serif;color:${props.textColor};font-size:${props.fontSize || 14}px${navOnclick ? ';cursor:pointer' : ''}">
  <input type="checkbox"${props.checked ? ' checked' : ''} style="width:18px;height:18px;accent-color:${props.accentColor};cursor:pointer;flex-shrink:0">
  <span>${escHtml(props.label)}</span>
</label>`;

    case 'radio':
      return `<label${navOnclick} style="${base}display:flex;align-items:center;gap:10px;cursor:pointer;font-family:${props.fontFamily || 'Nunito'},sans-serif;color:${props.textColor};font-size:${props.fontSize || 14}px${navOnclick ? ';cursor:pointer' : ''}">
  <input type="radio"${props.checked ? ' checked' : ''} style="width:18px;height:18px;accent-color:${props.accentColor};cursor:pointer;flex-shrink:0">
  <span>${escHtml(props.label)}</span>
</label>`;

    case 'image': {
      const imgBr = props.borderRadius ?? 8;
      const animType = props.animationType || '';
      const animCss = animType ? `animation:maquetapp-${animType} ${animType === 'float' ? '2s ease-in-out' : animType === 'pulse' ? '1.5s ease-in-out' : '3s linear'} infinite;transform-origin:center center;` : '';
      if (props.imageData) {
        const fit = props.frameless ? (props.objectFit || 'contain') : (props.objectFit || 'cover');
        const overflow = props.frameless ? '' : 'overflow:hidden;';
        return `<img${navOnclick} src="${props.imageData}" alt="" style="${base}border-radius:${imgBr}px;object-fit:${fit};${overflow}${animCss}${navOnclick ? ';cursor:pointer' : ''}">`;
      }
      return `<div${navOnclick} style="${base}${props.frameless ? '' : getBgCss(props.bgColor, props.bgGradient) + ';'}border-radius:${imgBr}px;display:flex;align-items:center;justify-content:center;border:${props.frameless ? '1.5px' : '2px'} dashed #D1D5DB${navOnclick ? ';cursor:pointer' : ''}">
  <span style="font-size:32px">🖼️</span>
</div>`;
    }

    case 'avatar':
      if (props.imageData) {
        return `<img${navOnclick} src="${props.imageData}" alt="" style="${base}border-radius:50%;object-fit:cover${navOnclick ? ';cursor:pointer' : ''}">`;
      }
      if (props.emoji) {
        const emojiSize = Math.round(Math.min(pos.width, pos.height) * 0.55);
        return `<div${navOnclick} style="${base}${getBgCss(props.bgColor, props.bgGradient)};border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden${navOnclick ? ';cursor:pointer' : ''}">
  <span style="font-size:${emojiSize}px;line-height:1">${escHtml(props.emoji)}</span>
</div>`;
      }
      return `<div${navOnclick} style="${base}${getBgCss(props.bgColor, props.bgGradient)};border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden${navOnclick ? ';cursor:pointer' : ''}">
  <i data-lucide="user" style="width:${Math.round(Math.min(pos.width, pos.height) * 0.55)}px;height:${Math.round(Math.min(pos.width, pos.height) * 0.55)}px;color:white"></i>
</div>`;

    case 'icon':
      return `<div${navOnclick} style="${base}display:flex;align-items:center;justify-content:center${navOnclick ? ';cursor:pointer' : ''}">
  <i data-lucide="${lucideRef(props.iconName || 'star')}" style="width:${Math.round(Math.min(pos.width, pos.height) * 0.55)}px;height:${Math.round(Math.min(pos.width, pos.height) * 0.55)}px;color:${props.color}"></i>
</div>`;

    case 'header':
      return `<header${navOnclick} style="${base}${getBgCss(props.bgColor, props.bgGradient)};display:flex;align-items:center;padding:0 16px;gap:12px${navOnclick ? ';cursor:pointer' : ''}">
  ${props.showBack ? `<button onclick="history.back()" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;padding:0"><i data-lucide="arrow-left" style="width:20px;height:20px;color:${props.textColor}"></i></button>` : ''}
  <span style="color:${props.textColor};font-size:18px;font-weight:700;font-family:${props.fontFamily || 'Nunito'},sans-serif;flex:1;text-align:${props.textAlign || 'left'}">${escHtml(props.title)}</span>
</header>`;

    case 'navbar':
      return `<nav style="${base}${getBgCss(props.bgColor, props.bgGradient)};border-top:1px solid #E5E7EB;display:flex;align-items:center;justify-content:space-around;padding:0 8px">
  ${['home','search','heart','user'].map((ic, i) => `<a href="#" style="display:flex;flex-direction:column;align-items:center;gap:2px;text-decoration:none"><i data-lucide="${ic}" style="width:22px;height:22px;color:${i === 0 ? props.activeColor : '#9CA3AF'}"></i>${i === 0 ? `<span style="width:4px;height:4px;border-radius:50%;background:${props.activeColor};display:block"></span>` : ''}</a>`).join('')}
</nav>`;

    case 'card':
      if (props.backgroundImage) {
        return `<div${navOnclick} style="${base}border-radius:${props.borderRadius || 16}px;box-shadow:0 2px 16px rgba(0,0,0,0.10);overflow:hidden${navOnclick ? ';cursor:pointer' : ''}"><img src="${props.backgroundImage}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></div>`;
      }
      return `<div${navOnclick} style="${base}${getBgCss(props.bgColor, props.bgGradient)};border-radius:${props.borderRadius || 16}px;box-shadow:0 2px 16px rgba(0,0,0,0.10)${navOnclick ? ';cursor:pointer' : ''}"></div>`;

    case 'colorblock':
      if (props.backgroundImage) {
        return `<div${navOnclick} style="${base}border-radius:${props.borderRadius || 0}px;overflow:hidden${navOnclick ? ';cursor:pointer' : ''}"><img src="${props.backgroundImage}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></div>`;
      }
      return `<div${navOnclick} style="${base}${getBgCss(props.bgColor, props.bgGradient)};border-radius:${props.borderRadius || 0}px${navOnclick ? ';cursor:pointer' : ''}"></div>`;

    case 'switch': {
      const id = `sw-${Math.random().toString(36).slice(2, 7)}`;
      return `<label${navOnclick} for="${id}" style="${base}display:flex;align-items:center;gap:12px;cursor:pointer;font-family:${props.fontFamily || 'Nunito'},sans-serif;font-size:${props.fontSize || 14}px;color:#1F2937${navOnclick ? ';cursor:pointer' : ''}">
  <span style="flex:1">${escHtml(props.label)}</span>
  <input type="checkbox" id="${id}" role="switch"${props.checked ? ' checked' : ''} style="width:46px;height:26px;appearance:none;background-color:${props.checked ? props.activeColor : '#D1D5DB'};border-radius:13px;position:relative;cursor:pointer;flex-shrink:0;transition:background .15s;outline:none" onclick="this.style.backgroundColor=this.checked?'${props.activeColor}':'#D1D5DB'">
</label>`;
    }

    case 'slider':
      return `<div${navOnclick} style="${base}display:flex;align-items:center${navOnclick ? ';cursor:pointer' : ''}">
  <input type="range" value="${props.value || 60}" min="0" max="100" style="flex:1;accent-color:${props.activeColor};cursor:pointer">
</div>`;

    case 'listitem':
      return `<div${navOnclick} style="${base}${getBgCss(props.bgColor, props.bgGradient)};border-bottom:1px solid #F3F4F6;display:flex;align-items:center;padding:0 16px;gap:12px${navOnclick ? ';cursor:pointer' : ''}">
  <div style="width:34px;height:34px;background-color:#EDE9FE;border-radius:9px;flex-shrink:0"></div>
  <span style="flex:1;color:${props.textColor};font-size:14px;font-family:${props.fontFamily || 'Nunito'},sans-serif;font-weight:600">${escHtml(props.label)}</span>
  <i data-lucide="chevron-right" style="width:16px;height:16px;color:#9CA3AF"></i>
</div>`;

    case 'badge':
      return `<span${navOnclick} style="${base}${getBgCss(props.bgColor, props.bgGradient)};color:${props.textColor};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${Math.round(Math.min(pos.width, pos.height) * 0.38)}px;font-weight:700;font-family:${props.fontFamily || 'Nunito'},sans-serif${navOnclick ? ';cursor:pointer' : ''}">${props.count ?? 0}</span>`;

    case 'separator':
      if (navOnclick) {
        return `<div${navOnclick} style="${base}display:flex;align-items:center;cursor:pointer"><hr style="width:100%;border:none;border-top:1px solid ${props.color || '#E5E7EB'};margin:0"></div>`;
      }
      return `<hr style="${base}border:none;border-top:1px solid ${props.color || '#E5E7EB'};margin:0">`;

    case 'keyboard': {
      const rows = [['A','Z','E','R','T','Y','U','I','O','P'],['Q','S','D','F','G','H','J','K','L','M'],['⇧','W','X','C','V','B','N','⌫'],['123','espace','↵']];
      const kbBg = props.bgColor || '#D1D5DB';
      const keyBg = props.keyColor || '#FFFFFF';
      const keyTxt = props.keyTextColor || '#1F2937';
      const accent = props.accentColor || '#6C63FF';
      const rowsHtml = rows.map(row => {
        const keysHtml = row.map(k => {
          const isSpace = k === 'espace'; const isWide = k==='⇧'||k==='⌫'||k==='123'||k==='↵'; const isAcc = isSpace||k==='↵';
          return `<div style="flex:${isSpace?4:isWide?1.6:1};background:${isAcc?accent:keyBg};border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:${isAcc?'#fff':keyTxt};box-shadow:0 1px 0 rgba(0,0,0,0.18)">${escHtml(k)}</div>`;
        }).join('');
        return `<div style="display:flex;flex:1;gap:3px">${keysHtml}</div>`;
      }).join('');
      return `<div${navOnclick} style="${base}background:${kbBg};border-radius:${props.borderRadius||0}px;display:flex;flex-direction:column;gap:3px;padding:4px 6px;box-sizing:border-box${navOnclick ? ';cursor:pointer' : ''}">${rowsHtml}</div>`;
    }
    case 'calendar': {
      const accent = props.accentColor || '#6C63FF';
      const hBg = props.headerBgColor || accent;
      const calBg = props.bgColor || '#FFFFFF';
      const tc = props.textColor || '#1F2937';
      const br = props.borderRadius ?? 12;
      const events = props.events || {};
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
      const DAYS_FR = ['Lu','Ma','Me','Je','Ve','Sa','Di'];
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      let firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
      const cells = [];
      for (let i = 0; i < firstDay; i++) cells.push(null);
      for (let d = 1; d <= daysInMonth; d++) cells.push(d);
      while (cells.length % 7 !== 0) cells.push(null);
      const dayLabels = DAYS_FR.map(d => `<div style="text-align:center;font-size:9px;font-weight:700;color:#9CA3AF">${d}</div>`).join('');
      const dayCells = cells.map(d => {
        const ev = d ? events[`${year}-${month}-${d}`] : null;
        const isToday = d === now.getDate();
        const bg = isToday ? accent : 'transparent';
        const color = isToday ? 'white' : d ? tc : 'transparent';
        const evHtml = ev ? `<div style="width:90%;background:${accent}33;border-radius:2px;font-size:7px;color:${accent};font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center">${escHtml(ev)}</div>` : '';
        return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;aspect-ratio:1;background:${bg};border-radius:4px;overflow:hidden"><span style="font-size:10px;font-weight:${isToday?800:400};color:${color};line-height:1.1">${d||''}</span>${evHtml}</div>`;
      }).join('');
      return `<div${navOnclick} style="${base}background:${calBg};border-radius:${br}px;overflow:hidden;font-family:Nunito,sans-serif;display:flex;flex-direction:column${navOnclick ? ';cursor:pointer' : ''}"><div style="background:${hBg};padding:6px 10px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="color:white;font-weight:800;font-size:13px">${MONTHS_FR[month]} ${year}</span></div><div style="display:grid;grid-template-columns:repeat(7,1fr);padding:4px 6px 2px;flex-shrink:0">${dayLabels}</div><div style="flex:1;display:grid;grid-template-columns:repeat(7,1fr);padding:0 6px 4px;align-content:start;gap:1px">${dayCells}</div></div>`;
    }

    case 'table': {
      const data = Array.isArray(props.data) ? props.data : [];
      const borderColor = props.borderColor || '#E5E7EB';
      const br = props.borderRadius ?? 8;
      const fs = props.fontSize || 13;
      const ff = props.fontFamily || 'Nunito';
      const rowsHtml = data.map((row, ri) => {
        const isHeader = ri === 0 && props.headerRow;
        const rowBg = isHeader ? (props.headerBgColor || '#6C63FF') : ri % 2 === 1 ? (props.altRowColor || '#F3F4F6') : (props.cellBgColor || '#FFFFFF');
        const rowTxt = isHeader ? (props.headerTextColor || '#FFFFFF') : (props.textColor || '#1F2937');
        const fw = isHeader ? 700 : 400;
        const cellsHtml = row.map((cell, ci) => {
          const borderRight = ci < row.length - 1 ? `border-right:1px solid ${borderColor};` : '';
          return `<td style="flex:1;padding:4px 6px;background:${rowBg};color:${rowTxt};font-weight:${fw};font-size:${fs}px;font-family:${ff},sans-serif;text-align:center;${borderRight}border-bottom:1px solid ${borderColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(cell)}</td>`;
        }).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('');
      return `<table${navOnclick} style="${base}border-collapse:collapse;border-radius:${br}px;overflow:hidden;border:1px solid ${borderColor};font-family:${ff},sans-serif${navOnclick ? ';cursor:pointer' : ''}">${rowsHtml}</table>`;
    }

    case 'drawing': {
      const src = props.showAiResult && props.aiImageUrl ? props.aiImageUrl : (props.drawingData || null);
      const br = props.borderRadius ?? 8;
      const border = `1px solid ${props.borderColor || '#E5E7EB'}`;
      if (!src) return `<div${navOnclick} style="${base}background:${props.bgColor||'#FFFFFF'};border-radius:${br}px;border:${border}${navOnclick ? ';cursor:pointer' : ''}"></div>`;
      return `<img${navOnclick} src="${escHtml(src)}" style="${base}border-radius:${br}px;border:${border};object-fit:contain;background:${props.bgColor||'#FFFFFF'}${navOnclick ? ';cursor:pointer' : ''}" />`;
    }

    case 'weekcalendar': {
      const slots = props.slots || {};
      const DAYS = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
      const DAY_LABELS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
      const ROWS = ['matin','apresmidi'];
      const ROW_LABELS = ['Matin','Apr&egrave;s-midi'];
      const hBg = props.headerBgColor || '#6C63FF';
      const hTxt = props.headerTextColor || '#FFFFFF';
      const rlBg = props.rowLabelBgColor || '#F5F3FF';
      const rlTxt = props.rowLabelTextColor || '#4C1D95';
      const cBg = props.cellBgColor || '#FFFFFF';
      const cTxt = props.cellTextColor || '#1F2937';
      const bc = props.borderColor || '#E5E7EB';
      const fs = props.fontSize || 11;
      const ff = props.fontFamily || 'Nunito';
      const br = props.borderRadius ?? 8;
      const colW = `calc((100% - 44px) / 7)`;
      const headerCells = DAY_LABELS.map(l =>
        `<th style="width:${colW};background:${hBg};color:${hTxt};font-weight:800;text-align:center;padding:4px 2px;border-right:1px solid ${bc};font-size:${fs}px;font-family:${ff},sans-serif">${l}</th>`
      ).join('');
      const dataRows = ROWS.map((row, ri) => {
        const cells = DAYS.map((day, di) => {
          const val = escHtml(slots[day]?.[row] || '');
          const borderRight = di < DAYS.length - 1 ? `border-right:1px solid ${bc};` : '';
          return `<td style="background:${cBg};color:${cTxt};text-align:center;padding:3px 2px;font-size:${fs}px;font-family:${ff},sans-serif;${borderRight}overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${val}</td>`;
        }).join('');
        const borderBottom = ri < ROWS.length - 1 ? `border-bottom:1px solid ${bc};` : '';
        return `<tr style="${borderBottom}"><td style="width:44px;background:${rlBg};color:${rlTxt};font-weight:700;text-align:center;padding:3px 2px;font-size:${fs - 1}px;font-family:${ff},sans-serif;border-right:1px solid ${bc};line-height:1.2">${ROW_LABELS[ri]}</td>${cells}</tr>`;
      }).join('');
      return `<table${navOnclick} style="${base}border-collapse:collapse;border-radius:${br}px;overflow:hidden;border:1px solid ${bc};font-family:${ff},sans-serif;background:${props.bgColor||'#FFFFFF'}${navOnclick ? ';cursor:pointer' : ''}"><thead><tr><th style="width:44px;background:${hBg};border-right:1px solid ${bc};padding:4px 2px"></th>${headerCells}</tr></thead><tbody>${dataRows}</tbody></table>`;
    }

    case 'shape': {
      const svgInner = getShapeSvgInner(props.shape || 'circle', props.fillColor || '#6C63FF', props.strokeColor || 'transparent', props.strokeWidth ?? 0);
      return `<svg${navOnclick} style="${base}${navOnclick ? ';cursor:pointer' : ''};overflow:visible" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${svgInner}</svg>`;
    }

    default:
      return '';
  }
}

function screenToHtml(screen, index, total, allScreens) {
  const sorted = [...screen.components].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
  const components = sorted.map(compToHtml).filter(Boolean).join('\n    ');

  const screenBgCss = screen.backgroundImage
    ? `background-image:url(${screen.backgroundImage});background-size:cover;background-position:center;background-repeat:no-repeat`
    : getBgCss(screen.backgroundColor, screen.backgroundGradient);
  return `<!-- ===== Écran: ${escHtml(screen.name)} ===== -->
<div id="screen-${screen.id}" class="screen" style="display:${index === 0 ? 'block' : 'none'};position:relative;width:390px;height:844px;${screenBgCss};overflow:hidden;flex-shrink:0">
    ${components}
</div>`;
}

export function exportProjectAsHtml(state) {
  const { screens, projectName } = state;

  const screensHtml = screens.map((s, i) => screenToHtml(s, i, screens.length, screens)).join('\n\n');

  const navHtml = screens.length > 1 ? `
  <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap">
    ${screens.map((s, i) => `<button onclick="showScreen('${s.id}')" id="nav-${s.id}" style="padding:6px 14px;border-radius:20px;border:none;cursor:pointer;font-family:Nunito,sans-serif;font-size:12px;font-weight:700;background-color:${i === 0 ? '#6C63FF' : '#E5E7EB'};color:${i === 0 ? 'white' : '#374151'}">${escHtml(s.name)}</button>`).join('')}
  </div>
  <script>
    function showScreen(id) {
      document.querySelectorAll('.screen').forEach(el => el.style.display = el.id === 'screen-' + id ? 'block' : 'none');
      document.querySelectorAll('[id^="nav-"]').forEach(btn => {
        btn.style.backgroundColor = btn.id === 'nav-' + id ? '#6C63FF' : '#E5E7EB';
        btn.style.color = btn.id === 'nav-' + id ? 'white' : '#374151';
      });
    }
  <\/script>` : '';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(projectName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Josefin+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;600;700&family=Nunito:wght@400;600;700;800;900&family=Open+Sans:wght@400;600;700&family=Oswald:wght@400;700&family=Pacifico&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;600;700&family=Quicksand:wght@400;600;700&family=Raleway:wght@400;600;700&family=Roboto:wght@400;700&family=Ubuntu:wght@400;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"><\/script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      background: linear-gradient(135deg, #f1f0ff 0%, #e8f4fd 50%, #f0fdf4 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: Nunito, sans-serif;
    }
    h1 {
      margin: 0 0 16px;
      font-size: 18px;
      color: #6C63FF;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .phone-shell {
      width: 430px;
      background: #111827;
      border-radius: 52px;
      padding: 20px 20px;
      box-shadow: 0 30px 80px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1);
    }
    .phone-notch {
      width: 120px;
      height: 34px;
      background: #111827;
      border-radius: 0 0 20px 20px;
      margin: 0 auto 6px;
    }
    .phone-screen {
      border-radius: 36px;
      overflow: hidden;
      position: relative;
    }
    @keyframes maquetapp-spin3d { from{transform:perspective(500px) rotateY(0deg)} to{transform:perspective(500px) rotateY(360deg)} }
    @keyframes maquetapp-spinz  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes maquetapp-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8%)} }
    @keyframes maquetapp-pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
  </style>
</head>
<body>
  <h1>📱 ${escHtml(projectName)}</h1>
  <div class="phone-shell">
    <div class="phone-notch"></div>
    <div class="phone-screen">
${screensHtml}
    </div>
  </div>
  ${navHtml}
  <script>
    lucide.createIcons();
  <\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(projectName || 'projet').replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
