import { getShapeSvgInner } from '../data/shapes';
import { getFontworkSvg } from '../data/fontwork';
import { renderChartSvg, DEFAULT_CHART_DATA_STR } from '../data/chartHelper';

export function getBgCss(bgColor, bgGradient) {
  if (bgGradient && bgGradient.from && bgGradient.to) {
    return `background:linear-gradient(${bgGradient.angle ?? 135}deg,${bgGradient.from},${bgGradient.to})`;
  }
  return `background-color:${bgColor || 'transparent'}`;
}

export function escHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function lucideRef(name) {
  if (!name) return '';
  // Convert PascalCase to kebab-case for lucide web component
  return name.replace(/([A-Z])/g, (m, l, i) => (i > 0 ? '-' : '') + l.toLowerCase());
}

function tablerRef(name) {
  if (!name) return '';
  // Tabler react names are IconHome -> webfont class ti-home
  return name.replace(/^Icon/, '').replace(/([A-Z])/g, (m, l, i) => (i > 0 ? '-' : '') + l.toLowerCase()).replace(/([a-z])(\d)/g, '$1-$2');
}

function iconHtml(name, iconSet, sizePx, color) {
  if (!name) return '';
  if (iconSet === 'tabler') {
    return `<i class="ti ti-${tablerRef(name)}" style="font-size:${sizePx}px;color:${color};line-height:1"></i>`;
  }
  return `<i data-lucide="${lucideRef(name)}" style="width:${sizePx}px;height:${sizePx}px;color:${color}"></i>`;
}

export function compToHtml(comp, canvasW = 390, canvasH = 844) {
  const { type, props, position: pos, zIndex } = comp;
  const _transforms = [];
  if (props.rotation) _transforms.push(`rotate(${props.rotation}deg)`);
  if (props.flipH) _transforms.push('scaleX(-1)');
  if (props.flipV) _transforms.push('scaleY(-1)');
  const _transformCss = _transforms.length ? `transform:${_transforms.join(' ')};transform-origin:center center;` : '';
  const base = `position:absolute;left:${pos.x}px;top:${pos.y}px;width:${pos.width}px;height:${pos.height}px;opacity:${props.opacity ?? 1};z-index:${zIndex || 1};box-sizing:border-box;${_transformCss}`;
  const navOnclick = props.navigateTo
    ? ` onclick="showScreen('${props.navigateTo}');return false;"`
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
      const labelHtml = !iconOnly && props.label ? `<span style="white-space:pre-wrap;word-break:break-word;text-align:center;line-height:1.2;font-style:${props.fontStyle || 'normal'};text-decoration:${props.textDecoration || 'none'}">${escHtml(props.label)}</span>` : '';
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
      return `<div${navOnclick} style="${base}display:flex;flex-direction:column;gap:4px${navOnclick ? ';cursor:pointer' : ''}">
  <label style="font-size:${props.labelFontSize || 12}px;color:#6B7280;font-family:${props.fontFamily || 'Nunito'},sans-serif;font-weight:600">${escHtml(props.label)}</label>
  <input type="text" placeholder="${escHtml(props.placeholder)}" ${navOnclick ? 'readonly ' : ''}style="flex:1;${getBgCss(props.bgColor, props.bgGradient)};color:${props.textColor || '#1F2937'};border-radius:${props.borderRadius || 8}px;border:1.5px solid #E5E7EB;padding:0 12px;font-size:${props.fontSize || 14}px;font-family:${props.fontFamily || 'Nunito'},sans-serif;outline:none;width:100%;box-sizing:border-box">
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
  <span style="flex:1;color:${tc};font-size:${fs}px;font-family:${ff},sans-serif;overflow:hidden;white-space:pre-wrap;word-break:break-word;line-height:1.2">${escHtml(props.placeholder || 'Rechercher…')}</span>
  ${clearBtn}
</div>`;
    }

    case 'checkbox':
      return `<label${navOnclick} style="${base}display:flex;align-items:center;gap:10px;cursor:pointer;font-family:${props.fontFamily || 'Nunito'},sans-serif;color:${props.textColor};font-size:${props.fontSize || 14}px${navOnclick ? ';cursor:pointer' : ''}">
  <input type="checkbox"${props.checked ? ' checked' : ''} style="width:18px;height:18px;accent-color:${props.accentColor};cursor:pointer;flex-shrink:0">
  <span style="white-space:pre-wrap;word-break:break-word;line-height:1.3">${escHtml(props.label)}</span>
</label>`;

    case 'radio':
      return `<label${navOnclick} style="${base}display:flex;align-items:center;gap:10px;cursor:pointer;font-family:${props.fontFamily || 'Nunito'},sans-serif;color:${props.textColor};font-size:${props.fontSize || 14}px${navOnclick ? ';cursor:pointer' : ''}">
  <input type="radio"${props.checked ? ' checked' : ''} style="width:18px;height:18px;accent-color:${props.accentColor};cursor:pointer;flex-shrink:0">
  <span style="white-space:pre-wrap;word-break:break-word;line-height:1.3">${escHtml(props.label)}</span>
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

    case 'icon': {
      const hasIconBg = 'bgColor' in props;
      const iconBgCss = hasIconBg ? `;${getBgCss(props.bgColor, props.bgGradient)};border-radius:${props.borderRadius ?? 100}px` : '';
      return `<div${navOnclick} style="${base}display:flex;align-items:center;justify-content:center${iconBgCss}${navOnclick ? ';cursor:pointer' : ''}">
  ${iconHtml(props.iconName || 'Star', props.iconSet || 'lucide', Math.round(Math.min(pos.width, pos.height) * 0.55), props.color)}
</div>`;
    }

    case 'header':
      return `<header${navOnclick} style="${base}${getBgCss(props.bgColor, props.bgGradient)};display:flex;align-items:center;padding:0 16px;gap:12px${navOnclick ? ';cursor:pointer' : ''}">
  ${props.showBack ? `<button onclick="(function(){var h=window._screenHistory;if(h&&h.length>1){h.pop();showScreen(h[h.length-1]);}else{var first=document.querySelector('.screen');if(first)showScreen(first.id.replace('screen-',''));}})()" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;padding:0"><i data-lucide="arrow-left" style="width:20px;height:20px;color:${props.textColor}"></i></button>` : ''}
  <span style="color:${props.textColor};font-size:18px;font-weight:700;font-family:${props.fontFamily || 'Nunito'},sans-serif;flex:1;text-align:${props.textAlign || 'left'}">${escHtml(props.title)}</span>
</header>`;

    case 'navbar': {
      const defaultNavItems = [
        { iconName: 'Home', iconSet: 'lucide', label: 'Accueil', navigateTo: '' },
        { iconName: 'Search', iconSet: 'lucide', label: 'Recherche', navigateTo: '' },
        { iconName: 'Heart', iconSet: 'lucide', label: 'Favoris', navigateTo: '' },
        { iconName: 'User', iconSet: 'lucide', label: 'Profil', navigateTo: '' },
      ];
      const navItems = Array.isArray(props.items) ? props.items : defaultNavItems;
      const activeIndex = props.activeIndex ?? 0;
      const navIconSize = Math.max(14, Math.round(Math.min((pos.width / navItems.length) * 0.45, pos.height * 0.4)));
      const navLabelSize = Math.max(8, Math.round(pos.height * 0.13));
      return `<nav${navOnclick} style="${base}${getBgCss(props.bgColor, props.bgGradient)};border-top:1px solid ${props.borderTopColor || '#E5E7EB'};display:flex;align-items:center;justify-content:space-around;padding:0 4px${navOnclick ? ';cursor:pointer' : ''}">
  ${navItems.map((item, i) => {
    const isActive = i === activeIndex;
    const color = item.color || (isActive ? (props.activeColor || '#6C63FF') : (props.inactiveColor || '#9CA3AF'));
    const itemClick = item.navigateTo ? ` onclick="showScreen('${item.navigateTo}');return false;"` : '';
    const labelOrDot = props.showLabels !== false
      ? `<span style="font-size:${navLabelSize}px;color:${color};font-family:Nunito,sans-serif;font-weight:${isActive ? 700 : 400};line-height:1">${escHtml(item.label || '')}</span>`
      : (isActive ? `<span style="width:4px;height:4px;border-radius:50%;background:${props.activeColor || '#6C63FF'};display:block"></span>` : '');
    return `<a href="javascript:void(0)"${itemClick} style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;flex:1;height:100%;text-decoration:none;cursor:${item.navigateTo ? 'pointer' : 'default'}">${iconHtml(item.iconName, item.iconSet || 'lucide', navIconSize, color)}${labelOrDot}</a>`;
  }).join('')}
</nav>`;
    }

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
  <span style="flex:1;color:${props.textColor};font-size:14px;font-family:${props.fontFamily || 'Nunito'},sans-serif;font-weight:600;white-space:pre-wrap;word-break:break-word;line-height:1.3">${escHtml(props.label)}</span>
  <i data-lucide="chevron-right" style="width:16px;height:16px;color:#9CA3AF;flex-shrink:0"></i>
</div>`;

    case 'badge':
      return `<span${navOnclick} style="${base}${getBgCss(props.bgColor, props.bgGradient)};color:${props.textColor};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${Math.round(Math.min(pos.width, pos.height) * 0.38)}px;font-weight:700;font-family:${props.fontFamily || 'Nunito'},sans-serif${navOnclick ? ';cursor:pointer' : ''}">${props.count ?? 0}</span>`;

    case 'separator': {
      const sepColor = props.color || '#E5E7EB';
      const sepThick = props.thickness ?? 2;
      const sepStyle = props.lineStyle || 'solid';
      let lineHtml = '';
      if (sepStyle === 'wavy') {
        const w = pos.width; const h = pos.height;
        const amp = Math.max(2, sepThick * 2); const freq = 10;
        let path = `M0,${h / 2}`;
        for (let x = 0; x < w; x += freq) path += ` Q${x + freq / 2},${h / 2 - amp} ${x + freq},${h / 2}`;
        lineHtml = `<svg style="position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible" viewBox="0 0 ${w} ${h}"><path d="${path}" stroke="${sepColor}" stroke-width="${sepThick}" fill="none"/></svg>`;
      } else if (sepStyle === 'zigzag') {
        const w = pos.width; const h = pos.height;
        const amp = Math.max(2, sepThick * 2); const freq = 10;
        let pts = '';
        for (let x = 0; x <= w; x += freq) pts += `${x},${Math.round(x / freq) % 2 === 0 ? h / 2 + amp : h / 2 - amp} `;
        lineHtml = `<svg style="position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible" viewBox="0 0 ${w} ${h}"><polyline points="${pts.trim()}" stroke="${sepColor}" stroke-width="${sepThick}" fill="none"/></svg>`;
      } else if (sepStyle === 'long-dash') {
        const dash = sepThick * 8; const gap = sepThick * 3;
        lineHtml = `<div style="position:absolute;left:0;top:50%;width:100%;height:${sepThick}px;transform:translateY(-50%);background:repeating-linear-gradient(to right,${sepColor} 0,${sepColor} ${dash}px,transparent ${dash}px,transparent ${dash + gap}px)"></div>`;
      } else if (sepStyle === 'dash-dot') {
        const dash = sepThick * 6; const dot = sepThick; const gap = sepThick * 2;
        lineHtml = `<div style="position:absolute;left:0;top:50%;width:100%;height:${sepThick}px;transform:translateY(-50%);background:repeating-linear-gradient(to right,${sepColor} 0,${sepColor} ${dash}px,transparent ${dash}px,transparent ${dash + gap}px,${sepColor} ${dash + gap}px,${sepColor} ${dash + gap + dot}px,transparent ${dash + gap + dot}px,transparent ${dash + gap * 2 + dot}px)"></div>`;
      } else if (sepStyle === 'double') {
        const g = Math.max(2, sepThick);
        lineHtml = `<div style="position:absolute;left:0;top:50%;transform:translateY(-50%);width:100%;display:flex;flex-direction:column;gap:${g}px"><div style="width:100%;height:${sepThick}px;background:${sepColor}"></div><div style="width:100%;height:${sepThick}px;background:${sepColor}"></div></div>`;
      } else {
        const bs = sepStyle === 'dashed' ? 'dashed' : sepStyle === 'dotted' ? 'dotted' : 'solid';
        lineHtml = `<div style="position:absolute;left:0;top:50%;width:100%;height:0;transform:translateY(-50%);border-top:${sepThick}px ${bs} ${sepColor}"></div>`;
      }
      return `<div${navOnclick} style="${base}${navOnclick ? ';cursor:pointer' : ''}">${lineHtml}</div>`;
    }

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
      const bfs = props.fontSize || 11;
      const headerFs = bfs + 2, dayLabelFs = Math.max(6, bfs - 1), dayNumFs = bfs, eventFs = Math.max(5, bfs - 3);
      const dayLabels = DAYS_FR.map(d => `<div style="text-align:center;font-size:${dayLabelFs}px;font-weight:700;color:#9CA3AF">${d}</div>`).join('');
      const dayCells = cells.map(d => {
        const ev = d ? events[`${year}-${month}-${d}`] : null;
        const isToday = d === now.getDate();
        const bg = isToday ? accent : 'transparent';
        const color = isToday ? 'white' : d ? tc : 'transparent';
        const evHtml = ev ? `<div style="width:90%;background:${accent}33;border-radius:2px;font-size:${eventFs}px;color:${accent};font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center">${escHtml(ev)}</div>` : '';
        return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;aspect-ratio:1;background:${bg};border-radius:4px;overflow:hidden"><span style="font-size:${dayNumFs}px;font-weight:${isToday?800:400};color:${color};line-height:1.1">${d||''}</span>${evHtml}</div>`;
      }).join('');
      return `<div${navOnclick} style="${base}background:${calBg};border-radius:${br}px;overflow:hidden;font-family:Nunito,sans-serif;display:flex;flex-direction:column${navOnclick ? ';cursor:pointer' : ''}"><div style="background:${hBg};padding:6px 10px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="color:white;font-weight:800;font-size:${headerFs}px">${MONTHS_FR[month]} ${year}</span></div><div style="display:grid;grid-template-columns:repeat(7,1fr);padding:4px 6px 2px;flex-shrink:0">${dayLabels}</div><div style="flex:1;display:grid;grid-template-columns:repeat(7,1fr);padding:0 6px 4px;align-content:start;gap:1px">${dayCells}</div></div>`;
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
          return `<td style="flex:1;padding:4px 6px;background:${rowBg};color:${rowTxt};font-weight:${fw};font-size:${fs}px;font-family:${ff},sans-serif;text-align:center;${borderRight}border-bottom:1px solid ${borderColor};overflow:hidden;white-space:pre-wrap;word-break:break-word">${escHtml(cell)}</td>`;
        }).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('');
      return `<table${navOnclick} style="${base}border-collapse:collapse;border-radius:${br}px;overflow:hidden;border:1px solid ${borderColor};font-family:${ff},sans-serif${navOnclick ? ';cursor:pointer' : ''}">${rowsHtml}</table>`;
    }

    case 'torch': {
      const torchId = `torch-${Math.random().toString(36).slice(2, 8)}`;
      const offC = props.offColor || '#1C1C1E';
      const onC = props.onColor || '#FFD60A';
      const iconC = props.iconColor || '#FFFFFF';
      const br = props.borderRadius ?? 18;
      const iconSz = Math.round(Math.min(pos.width, pos.height) * 0.42);
      const boltSvg = `<svg width="${iconSz}" height="${iconSz}" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14H11L9 22L19 10H11L13 2Z" fill="`;
      const svgOff = boltSvg + iconC + `"/></svg>`;
      const svgOn = boltSvg + `#1C1C1E"/></svg>`;
      return `<button id="${torchId}" style="${base}background:${offC};border-radius:${br}px;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:background .2s,box-shadow .3s" onclick="(function(btn){if(btn._ts){btn._ts.getTracks().forEach(t=>t.stop());btn._ts=null;btn.style.background='${offC}';btn.style.boxShadow='0 2px 8px rgba(0,0,0,0.3)';btn.innerHTML='${svgOff.replace(/'/g, "\\'")}'}else{navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(s=>{var t=s.getVideoTracks()[0];t.applyConstraints({advanced:[{torch:true}]}).then(()=>{btn._ts=s;btn.style.background='${onC}';btn.style.boxShadow='0 0 24px 8px ${onC}66';btn.innerHTML='${svgOn.replace(/'/g, "\\'")}'})}).catch(()=>alert('Torche non disponible sur cet appareil'))}})(this)">${svgOff}</button>`;
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
          return `<td style="background:${cBg};color:${cTxt};text-align:center;padding:3px 2px;font-size:${fs}px;font-family:${ff},sans-serif;${borderRight}overflow:hidden;white-space:pre-wrap;word-break:break-word">${val}</td>`;
        }).join('');
        const borderBottom = ri < ROWS.length - 1 ? `border-bottom:1px solid ${bc};` : '';
        return `<tr style="${borderBottom}"><td style="width:44px;background:${rlBg};color:${rlTxt};font-weight:700;text-align:center;padding:3px 2px;font-size:${fs - 1}px;font-family:${ff},sans-serif;border-right:1px solid ${bc};line-height:1.2">${ROW_LABELS[ri]}</td>${cells}</tr>`;
      }).join('');
      return `<table${navOnclick} style="${base}border-collapse:collapse;border-radius:${br}px;overflow:hidden;border:1px solid ${bc};font-family:${ff},sans-serif;background:${props.bgColor||'#FFFFFF'}${navOnclick ? ';cursor:pointer' : ''}"><thead><tr><th style="width:44px;background:${hBg};border-right:1px solid ${bc};padding:4px 2px"></th>${headerCells}</tr></thead><tbody>${dataRows}</tbody></table>`;
    }

    case 'chart': {
      const chartUid = `c${Math.random().toString(36).slice(2)}`;
      const chartSvg = renderChartSvg(props.chartType || 'bar', props.chartData || DEFAULT_CHART_DATA_STR, props, chartUid);
      return `<div${navOnclick} style="${base}border-radius:8px;overflow:hidden;${navOnclick ? 'cursor:pointer;' : ''}">${chartSvg}</div>`;
    }

    case 'fontwork': {
      const fwUid = `fw${Math.random().toString(36).slice(2)}`;
      const fwSvg = getFontworkSvg(props.letter || 'A', props.style || 'fill', props, fwUid);
      const fwAnim = props.animationType ? `animation:maquetapp-${props.animationType} ${props.animationType === 'float' ? '2s ease-in-out' : props.animationType === 'pulse' ? '1.5s ease-in-out' : '3s linear'} infinite;transform-origin:center center;` : '';
      return `<div${navOnclick} style="${base}${fwAnim}${navOnclick ? 'cursor:pointer;' : ''}"><svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">${fwSvg}</svg></div>`;
    }

    case 'textwork': {
      const twUid = `tw${Math.random().toString(36).slice(2)}`;
      const twSvg = getFontworkSvg(props.text || 'Mon Texte', props.style || 'fill', props, twUid);
      const twAnim = props.animationType ? `animation:maquetapp-${props.animationType} ${props.animationType === 'float' ? '2s ease-in-out' : props.animationType === 'pulse' ? '1.5s ease-in-out' : '3s linear'} infinite;transform-origin:center center;` : '';
      return `<div${navOnclick} style="${base}${twAnim}${navOnclick ? 'cursor:pointer;' : ''}"><svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">${twSvg}</svg></div>`;
    }

    case 'aiimage': {
      if (!props.imageData) {
        return `<div${navOnclick} style="${base}display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#F5F3FF;border:2px dashed #A78BFA;border-radius:8px;gap:6px"><span style="font-size:28px">🤖</span><span style="color:#6C63FF;font-size:11px;font-family:Nunito,sans-serif;font-weight:700">Génération IA</span></div>`;
      }
      const aiAnim = props.animationType ? `animation:maquetapp-${props.animationType} ${props.animationType === 'float' ? '2s ease-in-out' : props.animationType === 'pulse' ? '1.5s ease-in-out' : '3s linear'} infinite;transform-origin:center center;` : '';
      const aiPersp = props.animationType === 'spin3d' ? `perspective:600px;perspective-origin:center center;` : '';
      if (props.animationType === 'spin3d') {
        return `<div${navOnclick} style="${base}${aiPersp}${navOnclick ? 'cursor:pointer;' : ''}"><div style="width:100%;height:100%;${aiAnim}"><img src="${props.imageData}" alt="" style="width:100%;height:100%;object-fit:contain;display:block" /></div></div>`;
      }
      return `<div${navOnclick} style="${base}${aiAnim}${navOnclick ? 'cursor:pointer;' : ''}"><img src="${props.imageData}" alt="" style="width:100%;height:100%;object-fit:contain;display:block" /></div>`;
    }

    case 'shape': {
      const svgInner = getShapeSvgInner(props.shape || 'circle', props.fillColor || '#6C63FF', props.strokeColor || 'transparent', props.strokeWidth ?? 0);
      const shapeText = props.text || '';
      const fc = props.textColor || '#FFFFFF';
      const fs = props.fontSize || 16;
      const ff = props.fontFamily || 'Nunito';
      const fw = props.fontWeight === 'bold' ? 700 : props.fontWeight === 'semibold' ? 600 : 400;
      const textHtml = shapeText ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:6px;pointer-events:none"><span style="color:${fc};font-size:${fs}px;font-family:${ff},sans-serif;font-weight:${fw};text-align:center;word-break:break-word;line-height:1.2;white-space:pre-wrap">${escHtml(shapeText)}</span></div>` : '';
      const shapeAnim = props.animationType ? `animation:maquetapp-${props.animationType} ${props.animationType === 'float' ? '2s ease-in-out' : props.animationType === 'pulse' ? '1.5s ease-in-out' : '3s linear'} infinite;transform-origin:center center;` : '';
      return `<div${navOnclick} style="${base}position:relative;${shapeAnim}${navOnclick ? 'cursor:pointer;' : ''}"><svg style="position:absolute;inset:0;width:100%;height:100%;overflow:visible" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${svgInner}</svg>${textHtml}</div>`;
    }

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
      let da = '';
      if (style === 'dashed') da = `stroke-dasharray="${thick*4} ${thick*2}"`;
      else if (style === 'dotted') da = `stroke-dasharray="${thick} ${thick*2}"`;
      else if (style === 'long-dash') da = `stroke-dasharray="${thick*8} ${thick*3}"`;
      else if (style === 'dash-dot') da = `stroke-dasharray="${thick*6} ${thick*2} ${thick} ${thick*2}"`;
      const uid = `ml${Math.random().toString(36).slice(2,8)}`;
      const aSize = Math.max(6, thick * 5);
      const hasA = props.arrowStart && props.arrowStart !== 'none';
      const hasB = props.arrowEnd && props.arrowEnd !== 'none';
      let defs = '';
      if (hasA || hasB) {
        const mkr = (id, type, isStart) => {
          if (type === 'arrow') return `<marker id="${id}" markerWidth="${aSize}" markerHeight="${aSize}" refX="${isStart ? aSize : 0}" refY="${aSize/2}" orient="auto${isStart ? '-start-reverse' : ''}"><polygon points="0 0, ${aSize} ${aSize/2}, 0 ${aSize}" fill="${color}"/></marker>`;
          return `<marker id="${id}" markerWidth="${aSize}" markerHeight="${aSize}" refX="${aSize/2}" refY="${aSize/2}" orient="auto"><circle cx="${aSize/2}" cy="${aSize/2}" r="${aSize/2-0.5}" fill="${color}"/></marker>`;
        };
        defs = `<defs>${hasA ? mkr(`${uid}s`, props.arrowStart, true) : ''}${hasB ? mkr(`${uid}e`, props.arrowEnd, false) : ''}</defs>`;
      }
      const lineType = props.lineType || 'straight';
      const CW = canvasW, CH = canvasH;
      const cx1 = (props.cx1abs ?? 0.5) * CW - pos.x;
      const cy1 = (props.cy1abs ?? 0.15) * CH - pos.y;
      const cx2 = (props.cx2abs ?? 0.5) * CW - pos.x;
      const cy2 = (props.cy2abs ?? 0.85) * CH - pos.y;
      const pathD = lineType === 'curve'
        ? `M ${lx1} ${ly1} Q ${cx1} ${cy1} ${lx2} ${ly2}`
        : lineType === 'cubic'
        ? `M ${lx1} ${ly1} C ${cx1} ${cy1} ${cx2} ${cy2} ${lx2} ${ly2}`
        : null;
      let lineEl;
      if (style === 'double' && !pathD) {
        const offset = thick + 1;
        const angle = Math.atan2(ly2 - ly1, lx2 - lx1);
        const dx = Math.sin(angle) * offset;
        const dy = -Math.cos(angle) * offset;
        lineEl = `<line x1="${lx1+dx}" y1="${ly1+dy}" x2="${lx2+dx}" y2="${ly2+dy}" stroke="${color}" stroke-width="${thick}" stroke-linecap="round"/><line x1="${lx1-dx}" y1="${ly1-dy}" x2="${lx2-dx}" y2="${ly2-dy}" stroke="${color}" stroke-width="${thick}" stroke-linecap="round"/>`;
      } else if (pathD) {
        lineEl = `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="${thick}" stroke-linecap="round" ${da} ${hasA ? `marker-start="url(#${uid}s)"` : ''} ${hasB ? `marker-end="url(#${uid}e)"` : ''}/>`;
      } else {
        lineEl = `<line x1="${lx1}" y1="${ly1}" x2="${lx2}" y2="${ly2}" stroke="${color}" stroke-width="${thick}" stroke-linecap="round" ${da} ${hasA ? `marker-start="url(#${uid}s)"` : ''} ${hasB ? `marker-end="url(#${uid}e)"` : ''}/>`;
      }
      return `<svg${navOnclick} style="${base}overflow:visible${navOnclick ? ';cursor:pointer' : ''}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${defs}${lineEl}</svg>`;
    }

    case 'schedule': {
      const slots = Array.isArray(props.slots) ? props.slots : [];
      const bgColor = props.bgColor || '#FFFFFF';
      const timeColor = props.timeColor || '#6C63FF';
      const textColor = props.textColor || '#1F2937';
      const borderColor = props.borderColor || '#F3F4F6';
      const br = props.borderRadius ?? 12;
      const fs = props.fontSize || 14;
      const ff = props.fontFamily || 'Nunito';
      const rowH = Math.round(pos.height / Math.max(1, slots.length));

      const rowsHtml = slots.map((slot, i) => {
        const borderBottom = i < slots.length - 1 ? `border-bottom:1px solid ${borderColor};` : '';
        const hh = String(slot.hour).padStart(2, '0');
        const mm = String(slot.minute).padStart(2, '0');
        const dotColor = slot.color || timeColor;
        const labelHtml = props.showLabels !== false
          ? `<span style="flex:1;font-size:${Math.round(fs*0.9)}px;color:${textColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:${ff},sans-serif">${escHtml(slot.label || '')}</span>`
          : '';
        return `<div style="display:flex;align-items:center;gap:8px;padding:0 ${Math.round(pos.width*0.03)}px;height:${rowH}px;${borderBottom}">
  <div style="width:8px;height:8px;border-radius:50%;background:${dotColor};flex-shrink:0"></div>
  <span style="font-size:${fs}px;font-weight:800;color:${timeColor};font-family:monospace;flex-shrink:0">${hh}:${mm}</span>
  ${labelHtml}
</div>`;
      }).join('');

      return `<div${navOnclick} style="${base}background:${bgColor};border-radius:${br}px;overflow:hidden;display:flex;flex-direction:column${navOnclick ? ';cursor:pointer' : ''}">${rowsHtml}</div>`;
    }

    default:
      return '';
  }
}

function screenToHtml(screen, index, total, allScreens, canvasW = 390, canvasH = 844) {
  const sorted = [...screen.components].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
  const components = sorted.map(c => compToHtml(c, canvasW, canvasH)).filter(Boolean).join('\n    ');

  const screenBgCss = screen.backgroundImage
    ? `background-image:url(${screen.backgroundImage});background-size:cover;background-position:center;background-repeat:no-repeat`
    : getBgCss(screen.backgroundColor || '#FFFFFF', screen.backgroundGradient);
  return `<!-- ===== Écran: ${escHtml(screen.name)} ===== -->
<div id="screen-${screen.id}" class="screen" style="display:${index === 0 ? 'block' : 'none'};position:relative;width:${canvasW}px;height:${canvasH}px;${screenBgCss};overflow:hidden;flex-shrink:0">
    ${components}
</div>`;
}

export function exportProjectAsHtml(state) {
  const { screens, projectName, canvasW = 390, canvasH = 844 } = state;

  const screensHtml = screens.map((s, i) => screenToHtml(s, i, screens.length, screens, canvasW, canvasH)).join('\n\n');

  const navBtnsHtml = screens.length > 1
    ? `<div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap">
    ${screens.map((s, i) => `<button onclick="showScreen('${s.id}')" id="nav-${s.id}" style="padding:6px 14px;border-radius:20px;border:none;cursor:pointer;font-family:Nunito,sans-serif;font-size:12px;font-weight:700;background-color:${i === 0 ? '#6C63FF' : '#E5E7EB'};color:${i === 0 ? 'white' : '#374151'}">${escHtml(s.name)}</button>`).join('')}
  </div>`
    : '';
  const navHtml = `${navBtnsHtml}
  <script>
    window._screenHistory = window._screenHistory || [];
    function showScreen(id) {
      var target = document.getElementById('screen-' + id);
      if (!target) return;
      document.querySelectorAll('.screen').forEach(function(el){ el.style.display = 'none'; });
      target.style.display = 'block';
      document.querySelectorAll('[id^="nav-"]').forEach(function(btn){
        btn.style.backgroundColor = btn.id === 'nav-' + id ? '#6C63FF' : '#E5E7EB';
        btn.style.color = btn.id === 'nav-' + id ? 'white' : '#374151';
      });
      if (window._screenHistory[window._screenHistory.length - 1] !== id) {
        window._screenHistory.push(id);
      }
    }
  <\/script>`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(projectName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Josefin+Sans:wght@400;600;700&family=Lato:wght@400;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;600;700&family=Nunito:wght@400;600;700;800;900&family=Open+Sans:wght@400;600;700&family=Oswald:wght@400;700&family=Pacifico&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;600;700&family=Quicksand:wght@400;600;700&family=Raleway:wght@400;600;700&family=Roboto:wght@400;700&family=Ubuntu:wght@400;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"><\/script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">
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
    @keyframes maquetapp-spin3d { from{transform:rotateY(0deg) rotateX(10deg)} to{transform:rotateY(360deg) rotateX(10deg)} }
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
