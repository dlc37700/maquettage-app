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
      return `<p style="${base}color:${props.textColor};font-size:${props.fontSize || 16}px;font-weight:${fw};font-family:${props.fontFamily || 'Nunito'},sans-serif;font-style:${props.fontStyle || 'normal'};text-decoration:${props.textDecoration || 'none'};text-align:${props.textAlign || 'left'};margin:0;display:flex;align-items:${vAlign};line-height:1.4;overflow:hidden;padding:2px 4px;white-space:pre-wrap;word-break:break-word">${escHtml(props.label)}</p>`;
    }

    case 'input':
      return `<div style="${base}display:flex;flex-direction:column;gap:4px">
  <label style="font-size:12px;color:#6B7280;font-family:${props.fontFamily || 'Nunito'},sans-serif;font-weight:600">${escHtml(props.label)}</label>
  <input type="text" placeholder="${escHtml(props.placeholder)}" style="flex:1;${getBgCss(props.bgColor, props.bgGradient)};color:${props.textColor};border-radius:${props.borderRadius || 8}px;border:1.5px solid #E5E7EB;padding:0 12px;font-size:14px;font-family:${props.fontFamily || 'Nunito'},sans-serif;outline:none;width:100%;box-sizing:border-box">
</div>`;

    case 'checkbox':
      return `<label style="${base}display:flex;align-items:center;gap:10px;cursor:pointer;font-family:${props.fontFamily || 'Nunito'},sans-serif;color:${props.textColor};font-size:${props.fontSize || 14}px">
  <input type="checkbox"${props.checked ? ' checked' : ''} style="width:18px;height:18px;accent-color:${props.accentColor};cursor:pointer;flex-shrink:0">
  <span>${escHtml(props.label)}</span>
</label>`;

    case 'radio':
      return `<label style="${base}display:flex;align-items:center;gap:10px;cursor:pointer;font-family:${props.fontFamily || 'Nunito'},sans-serif;color:${props.textColor};font-size:${props.fontSize || 14}px">
  <input type="radio"${props.checked ? ' checked' : ''} style="width:18px;height:18px;accent-color:${props.accentColor};cursor:pointer;flex-shrink:0">
  <span>${escHtml(props.label)}</span>
</label>`;

    case 'image':
      if (props.imageData) {
        return `<img src="${props.imageData}" alt="" style="${base}border-radius:${props.borderRadius || 8}px;object-fit:${props.objectFit || 'cover'}">`;
      }
      return `<div style="${base}${getBgCss(props.bgColor, props.bgGradient)};border-radius:${props.borderRadius || 8}px;display:flex;align-items:center;justify-content:center;border:2px dashed #D1D5DB">
  <span style="font-size:32px">🖼️</span>
</div>`;

    case 'avatar':
      if (props.imageData) {
        return `<img src="${props.imageData}" alt="" style="${base}border-radius:50%;object-fit:cover">`;
      }
      if (props.emoji) {
        const emojiSize = Math.round(Math.min(pos.width, pos.height) * 0.55);
        return `<div style="${base}${getBgCss(props.bgColor, props.bgGradient)};border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden">
  <span style="font-size:${emojiSize}px;line-height:1">${escHtml(props.emoji)}</span>
</div>`;
      }
      return `<div style="${base}${getBgCss(props.bgColor, props.bgGradient)};border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden">
  <i data-lucide="user" style="width:${Math.round(Math.min(pos.width, pos.height) * 0.55)}px;height:${Math.round(Math.min(pos.width, pos.height) * 0.55)}px;color:white"></i>
</div>`;

    case 'icon':
      return `<div style="${base}display:flex;align-items:center;justify-content:center">
  <i data-lucide="${lucideRef(props.iconName || 'star')}" style="width:${Math.round(Math.min(pos.width, pos.height) * 0.55)}px;height:${Math.round(Math.min(pos.width, pos.height) * 0.55)}px;color:${props.color}"></i>
</div>`;

    case 'header':
      return `<header style="${base}${getBgCss(props.bgColor, props.bgGradient)};display:flex;align-items:center;padding:0 16px;gap:12px">
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
        return `<div style="${base}border-radius:${props.borderRadius || 0}px;overflow:hidden"><img src="${props.backgroundImage}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></div>`;
      }
      return `<div style="${base}${getBgCss(props.bgColor, props.bgGradient)};border-radius:${props.borderRadius || 0}px"></div>`;

    case 'switch': {
      const id = `sw-${Math.random().toString(36).slice(2, 7)}`;
      return `<label for="${id}" style="${base}display:flex;align-items:center;gap:12px;cursor:pointer;font-family:${props.fontFamily || 'Nunito'},sans-serif;font-size:${props.fontSize || 14}px;color:#1F2937">
  <span style="flex:1">${escHtml(props.label)}</span>
  <input type="checkbox" id="${id}" role="switch"${props.checked ? ' checked' : ''} style="width:46px;height:26px;appearance:none;background-color:${props.checked ? props.activeColor : '#D1D5DB'};border-radius:13px;position:relative;cursor:pointer;flex-shrink:0;transition:background .15s;outline:none" onclick="this.style.backgroundColor=this.checked?'${props.activeColor}':'#D1D5DB'">
</label>`;
    }

    case 'slider':
      return `<div style="${base}display:flex;align-items:center">
  <input type="range" value="${props.value || 60}" min="0" max="100" style="flex:1;accent-color:${props.activeColor};cursor:pointer">
</div>`;

    case 'listitem':
      return `<div${navOnclick} style="${base}${getBgCss(props.bgColor, props.bgGradient)};border-bottom:1px solid #F3F4F6;display:flex;align-items:center;padding:0 16px;gap:12px${navOnclick ? ';cursor:pointer' : ''}">
  <div style="width:34px;height:34px;background-color:#EDE9FE;border-radius:9px;flex-shrink:0"></div>
  <span style="flex:1;color:${props.textColor};font-size:14px;font-family:${props.fontFamily || 'Nunito'},sans-serif;font-weight:600">${escHtml(props.label)}</span>
  <i data-lucide="chevron-right" style="width:16px;height:16px;color:#9CA3AF"></i>
</div>`;

    case 'badge':
      return `<span style="${base}${getBgCss(props.bgColor, props.bgGradient)};color:${props.textColor};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${Math.round(Math.min(pos.width, pos.height) * 0.38)}px;font-weight:700;font-family:${props.fontFamily || 'Nunito'},sans-serif">${props.count ?? 0}</span>`;

    case 'separator':
      return `<hr style="${base}border:none;border-top:1px solid ${props.color || '#E5E7EB'};margin:0">`;

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
