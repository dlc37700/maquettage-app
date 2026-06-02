export const FONTWORK_STYLES = [
  { id: 'fill',       label: 'Plein',     group: '2D' },
  { id: 'outline',    label: 'Contour',   group: '2D' },
  { id: 'gradient_v', label: 'Dégradé ↕', group: '2D' },
  { id: 'gradient_h', label: 'Dégradé →', group: '2D' },
  { id: 'extrude',    label: 'Extrusion', group: '3D' },
  { id: 'shadow',     label: 'Ombre',     group: '3D' },
  { id: 'chrome',     label: 'Chrome',    group: '3D' },
  { id: 'neon',       label: 'Néon',      group: '3D' },
];

function escSvg(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function getFontworkSvg(text, style, props, uid = 'fw') {
  const fill = props.fillColor || '#6C63FF';
  const stroke = props.strokeColor || '#4C3FBF';
  const sw = props.strokeWidth ?? 0;
  const ff = `${props.fontFamily || 'Impact'}, Arial Black, sans-serif`;
  const extColor = props.extrudeColor || '#3B2FA0';
  const depth = Math.max(1, Math.min(20, props.extrudeDepth ?? 6));
  const gradFrom = props.gradientFrom || fill;
  const gradTo = props.gradientTo || '#EC4899';

  const t = escSvg(text || 'A');
  const strokePart = sw > 0 ? `stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"` : '';
  const base = `text-anchor="middle" dominant-baseline="central" x="50" y="50" font-size="82" font-family="${ff}" font-weight="900" textLength="95" lengthAdjust="spacingAndGlyphs"`;

  switch (style) {
    case 'fill':
      return `<text ${base} fill="${fill}" ${strokePart}>${t}</text>`;

    case 'outline':
      return `<text ${base} fill="none" stroke="${stroke}" stroke-width="${Math.max(1, sw || 3)}" stroke-linejoin="round">${t}</text>`;

    case 'gradient_v':
      return `<defs><linearGradient id="g${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${gradFrom}"/><stop offset="100%" stop-color="${gradTo}"/></linearGradient></defs><text ${base} fill="url(#g${uid})" ${strokePart}>${t}</text>`;

    case 'gradient_h':
      return `<defs><linearGradient id="g${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${gradFrom}"/><stop offset="100%" stop-color="${gradTo}"/></linearGradient></defs><text ${base} fill="url(#g${uid})" ${strokePart}>${t}</text>`;

    case 'extrude': {
      let layers = '';
      for (let i = depth; i >= 1; i--) {
        const d = (i * 0.7).toFixed(1);
        layers += `<text ${base} fill="${extColor}" transform="translate(${d},${d})">${t}</text>`;
      }
      return `${layers}<text ${base} fill="${fill}" ${strokePart}>${t}</text>`;
    }

    case 'shadow': {
      const dx = (depth * 0.6).toFixed(1);
      const blur = (depth * 0.45).toFixed(1);
      return `<defs><filter id="f${uid}" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="${dx}" dy="${dx}" stdDeviation="${blur}" flood-color="${extColor}" flood-opacity="0.85"/></filter></defs><text ${base} fill="${fill}" ${strokePart} filter="url(#f${uid})">${t}</text>`;
    }

    case 'chrome':
      return `<defs><linearGradient id="g${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="22%" stop-color="${fill}"/><stop offset="52%" stop-color="#FFFFFFBB"/><stop offset="78%" stop-color="${extColor}"/><stop offset="100%" stop-color="${fill}"/></linearGradient></defs><text ${base} fill="url(#g${uid})" stroke="${extColor}" stroke-width="${Math.max(0.5, sw || 1)}" stroke-linejoin="round">${t}</text>`;

    case 'neon': {
      const gr = (depth * 0.65).toFixed(1);
      return `<defs><filter id="f${uid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="${gr}" result="blur"/><feFlood flood-color="${fill}" result="c"/><feComposite in="c" in2="blur" operator="in" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><text ${base} fill="${fill}" stroke="${fill}" stroke-width="0.5" stroke-linejoin="round" filter="url(#f${uid})">${t}</text>`;
    }

    default:
      return `<text ${base} fill="${fill}">${t}</text>`;
  }
}
