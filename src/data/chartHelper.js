export const CHART_TYPES = [
  { id: 'bar',   label: 'Barres',    icon: '📊' },
  { id: 'line',  label: 'Courbe',    icon: '📈' },
  { id: 'pie',   label: 'Camembert', icon: '🥧' },
  { id: 'donut', label: 'Anneau',    icon: '⭕' },
];

export const DEFAULT_CHART_DATA_STR = 'Jan,30\nFév,55\nMar,40\nAvr,70\nMai,60\nJui,85';

export function parseChartData(str) {
  if (!str) return [];
  return str.trim().split('\n')
    .map(line => {
      const i = line.indexOf(',');
      if (i === -1) return null;
      const label = line.slice(0, i).trim();
      const value = parseFloat(line.slice(i + 1).trim());
      return (label && !isNaN(value)) ? { label, value } : null;
    })
    .filter(Boolean);
}

const PIE_COLORS = ['#6C63FF','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#8B5CF6','#06B6D4','#F97316','#84CC16'];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderChartSvg(chartType, dataStr, props, uid = 'c') {
  const data = parseChartData(dataStr || DEFAULT_CHART_DATA_STR);
  if (!data.length) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="100%" height="100%"><rect width="300" height="200" fill="white"/><text x="150" y="100" text-anchor="middle" fill="#9CA3AF" font-size="14" font-family="sans-serif">Aucune donnée</text></svg>`;
  }

  const color      = props.color    || '#6C63FF';
  const color2     = props.color2   || '#EC4899';
  const showGrid   = props.showGrid   !== false;
  const showLabels = props.showLabels !== false;
  const showValues = props.showValues !== false;
  const fillArea   = props.fillArea   !== false;

  // ── Bar chart ──────────────────────────────────────────────────────────────
  if (chartType === 'bar') {
    const VW = 300, VH = 200;
    const ml = 40, mr = 12, mt = 22, mb = 34;
    const cw = VW - ml - mr, ch = VH - mt - mb;
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const n = data.length;
    const slot = cw / n;
    const bw = Math.max(4, slot * 0.62);

    let grid = `<rect width="${VW}" height="${VH}" fill="white"/>`;
    if (showGrid) {
      for (let i = 0; i <= 4; i++) {
        const gy = (mt + ch * i / 4).toFixed(1);
        const gv = Math.round(maxVal * (4 - i) / 4);
        grid += `<line x1="${ml}" y1="${gy}" x2="${ml + cw}" y2="${gy}" stroke="#F3F4F6" stroke-width="${i === 4 ? 1.2 : 0.8}"/>`;
        grid += `<text x="${ml - 5}" y="${(parseFloat(gy) + 3).toFixed(1)}" text-anchor="end" fill="#9CA3AF" font-size="8.5" font-family="sans-serif">${gv}</text>`;
      }
    }

    let bars = `<defs><linearGradient id="bg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="${color}88"/></linearGradient></defs>`;
    data.forEach((d, i) => {
      const bh  = Math.max(2, ch * d.value / maxVal);
      const bx  = (ml + i * slot + (slot - bw) / 2).toFixed(1);
      const by  = (mt + ch - bh).toFixed(1);
      const mid = (ml + i * slot + slot / 2).toFixed(1);
      bars += `<rect x="${bx}" y="${by}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="url(#bg${uid})" rx="3" ry="3"/>`;
      if (showValues && bh > 16) {
        bars += `<text x="${mid}" y="${(parseFloat(by) - 4).toFixed(1)}" text-anchor="middle" fill="#374151" font-size="9" font-weight="600" font-family="sans-serif">${d.value}</text>`;
      }
      if (showLabels) {
        bars += `<text x="${mid}" y="${(mt + ch + 16).toFixed(1)}" text-anchor="middle" fill="#6B7280" font-size="9" font-family="sans-serif">${esc(d.label)}</text>`;
      }
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="100%" height="100%" preserveAspectRatio="none">${grid}${bars}</svg>`;
  }

  // ── Line chart ─────────────────────────────────────────────────────────────
  if (chartType === 'line') {
    const VW = 300, VH = 200;
    const ml = 40, mr = 12, mt = 22, mb = 34;
    const cw = VW - ml - mr, ch = VH - mt - mb;
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const n = data.length;

    const pts = data.map((d, i) => ({
      x: n === 1 ? ml + cw / 2 : ml + i * cw / (n - 1),
      y: mt + ch * (1 - d.value / maxVal),
    }));

    let grid = `<rect width="${VW}" height="${VH}" fill="white"/>`;
    if (showGrid) {
      for (let i = 0; i <= 4; i++) {
        const gy = (mt + ch * i / 4).toFixed(1);
        const gv = Math.round(maxVal * (4 - i) / 4);
        grid += `<line x1="${ml}" y1="${gy}" x2="${ml + cw}" y2="${gy}" stroke="#F3F4F6" stroke-width="${i === 4 ? 1.2 : 0.8}"/>`;
        grid += `<text x="${ml - 5}" y="${(parseFloat(gy) + 3).toFixed(1)}" text-anchor="end" fill="#9CA3AF" font-size="8.5" font-family="sans-serif">${gv}</text>`;
      }
    }

    let area = '';
    if (fillArea && n > 1) {
      const aPath = `M${pts[0].x.toFixed(1)},${(mt + ch).toFixed(1)} ${pts.map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} L${pts[n - 1].x.toFixed(1)},${(mt + ch).toFixed(1)} Z`;
      area = `<defs><linearGradient id="lg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.28"/><stop offset="100%" stop-color="${color}" stop-opacity="0.03"/></linearGradient></defs><path d="${aPath}" fill="url(#lg${uid})"/>`;
    }

    const polyStr = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    let dots = '';
    pts.forEach((p, i) => {
      const mx = p.x.toFixed(1);
      dots += `<circle cx="${mx}" cy="${p.y.toFixed(1)}" r="4" fill="${color2}" stroke="white" stroke-width="1.5"/>`;
      if (showValues) {
        dots += `<text x="${mx}" y="${(p.y - 9).toFixed(1)}" text-anchor="middle" fill="#374151" font-size="9" font-weight="600" font-family="sans-serif">${data[i].value}</text>`;
      }
      if (showLabels) {
        dots += `<text x="${mx}" y="${(mt + ch + 16).toFixed(1)}" text-anchor="middle" fill="#6B7280" font-size="9" font-family="sans-serif">${esc(data[i].label)}</text>`;
      }
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="100%" height="100%" preserveAspectRatio="none">${grid}${area}<polyline points="${polyStr}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}</svg>`;
  }

  // ── Pie / Donut ────────────────────────────────────────────────────────────
  if (chartType === 'pie' || chartType === 'donut') {
    const VW = 220, VH = 220;
    const cx = 110, cy = 110, outerR = 90;
    const innerR = chartType === 'donut' ? 46 : 0;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;

    let slices = `<rect width="${VW}" height="${VH}" fill="white"/>`;
    let startAngle = -Math.PI / 2;
    data.forEach((d, i) => {
      const sweep = (d.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sweep;
      const large = sweep > Math.PI ? 1 : 0;
      const c = PIE_COLORS[i % PIE_COLORS.length];

      const ox1 = (cx + outerR * Math.cos(startAngle)).toFixed(2);
      const oy1 = (cy + outerR * Math.sin(startAngle)).toFixed(2);
      const ox2 = (cx + outerR * Math.cos(endAngle)).toFixed(2);
      const oy2 = (cy + outerR * Math.sin(endAngle)).toFixed(2);

      let path;
      if (chartType === 'donut') {
        const ix1 = (cx + innerR * Math.cos(endAngle)).toFixed(2);
        const iy1 = (cy + innerR * Math.sin(endAngle)).toFixed(2);
        const ix2 = (cx + innerR * Math.cos(startAngle)).toFixed(2);
        const iy2 = (cy + innerR * Math.sin(startAngle)).toFixed(2);
        path = `M${ox1},${oy1} A${outerR},${outerR} 0 ${large} 1 ${ox2},${oy2} L${ix1},${iy1} A${innerR},${innerR} 0 ${large} 0 ${ix2},${iy2} Z`;
      } else {
        path = `M${cx},${cy} L${ox1},${oy1} A${outerR},${outerR} 0 ${large} 1 ${ox2},${oy2} Z`;
      }
      slices += `<path d="${path}" fill="${c}" stroke="white" stroke-width="1.5"/>`;

      if (sweep > 0.22) {
        const midA = startAngle + sweep / 2;
        const lr = chartType === 'donut' ? (outerR + innerR) / 2 : outerR * 0.65;
        const lx = (cx + lr * Math.cos(midA)).toFixed(1);
        const ly = (cy + lr * Math.sin(midA)).toFixed(1);
        const pct = Math.round(d.value / total * 100);
        if (showValues) {
          slices += `<text x="${lx}" y="${(parseFloat(ly) + (showLabels ? 0 : 4)).toFixed(1)}" text-anchor="middle" fill="white" font-size="11" font-weight="700" font-family="sans-serif">${pct}%</text>`;
        }
        if (showLabels) {
          slices += `<text x="${lx}" y="${(parseFloat(ly) + (showValues ? 13 : 4)).toFixed(1)}" text-anchor="middle" fill="white" font-size="9" font-family="sans-serif">${esc(d.label)}</text>`;
        }
      }
      startAngle = endAngle;
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">${slices}</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="100%" height="100%"><rect width="300" height="200" fill="white"/><text x="150" y="100" text-anchor="middle" fill="#9CA3AF" font-size="14" font-family="sans-serif">Type inconnu</text></svg>`;
}
