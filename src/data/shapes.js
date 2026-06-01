export const SHAPES_CATEGORIES = [
  { label: 'Basiques', shapes: [
    { id: 'circle', label: 'Cercle' },
    { id: 'ellipse', label: 'Ellipse' },
    { id: 'rect', label: 'Rectangle' },
    { id: 'rounded', label: 'Arrondi' },
    { id: 'triangle', label: 'Triangle ▲' },
    { id: 'diamond', label: 'Losange' },
  ]},
  { label: 'Polygones', shapes: [
    { id: 'pentagon', label: 'Pentagone' },
    { id: 'hexagon', label: 'Hexagone' },
    { id: 'octagon', label: 'Octogone' },
    { id: 'trapeze', label: 'Trapèze' },
    { id: 'parallelogram', label: 'Parallélogramme' },
  ]},
  { label: 'Étoiles', shapes: [
    { id: 'star5', label: '★ 5 branches' },
    { id: 'star4', label: '✦ 4 branches' },
    { id: 'star6', label: '✡ 6 branches' },
  ]},
  { label: 'Spéciales', shapes: [
    { id: 'heart', label: 'Cœur' },
    { id: 'cloud', label: 'Nuage' },
    { id: 'speech', label: 'Bulle' },
    { id: 'lightning', label: 'Éclair' },
    { id: 'moon', label: 'Lune' },
    { id: 'cross', label: 'Croix' },
  ]},
  { label: 'Flèches', shapes: [
    { id: 'arrow_right', label: '→' },
    { id: 'arrow_left', label: '←' },
    { id: 'arrow_up', label: '↑' },
    { id: 'arrow_down', label: '↓' },
  ]},
  { label: '3D', shapes: [
    { id: 'cube3d', label: 'Cube' },
    { id: 'cylinder3d', label: 'Cylindre' },
    { id: 'cone3d', label: 'Cône' },
    { id: 'pyramid3d', label: 'Pyramide' },
  ]},
];

export function getShapeSvgInner(shapeId, fill = '#6C63FF', stroke = 'none', sw = 0) {
  const f = fill;
  const s = stroke === 'transparent' ? 'none' : stroke;
  const swStr = sw > 0 ? `stroke="${s}" stroke-width="${sw}"` : '';
  const pathAttrs = `fill="${f}" ${swStr}`;

  switch (shapeId) {
    case 'circle':
      return `<ellipse cx="50" cy="50" rx="48" ry="48" ${pathAttrs}/>`;
    case 'ellipse':
      return `<ellipse cx="50" cy="50" rx="48" ry="30" ${pathAttrs}/>`;
    case 'rect':
      return `<rect x="2" y="2" width="96" height="96" rx="0" ${pathAttrs}/>`;
    case 'rounded':
      return `<rect x="2" y="2" width="96" height="96" rx="12" ${pathAttrs}/>`;
    case 'triangle':
      return `<path d="M50,3 L97,97 L3,97 Z" ${pathAttrs}/>`;
    case 'triangle_inv':
      return `<path d="M3,3 L97,3 L50,97 Z" ${pathAttrs}/>`;
    case 'diamond':
      return `<path d="M50,3 L97,50 L50,97 L3,50 Z" ${pathAttrs}/>`;
    case 'pentagon':
      return `<path d="M50,3 L97,36 L79,95 L21,95 L3,36 Z" ${pathAttrs}/>`;
    case 'hexagon':
      return `<path d="M50,3 L93,26.5 L93,73.5 L50,97 L7,73.5 L7,26.5 Z" ${pathAttrs}/>`;
    case 'octagon':
      return `<path d="M30,3 L70,3 L97,30 L97,70 L70,97 L30,97 L3,70 L3,30 Z" ${pathAttrs}/>`;
    case 'trapeze':
      return `<path d="M20,3 L80,3 L97,97 L3,97 Z" ${pathAttrs}/>`;
    case 'parallelogram':
      return `<path d="M18,3 L97,3 L82,97 L3,97 Z" ${pathAttrs}/>`;
    case 'star5':
      return `<path d="M50,3 L61.8,36.8 L97.6,36.8 L68.1,57.3 L79.9,91.1 L50,70.6 L20.1,91.1 L31.9,57.3 L2.4,36.8 L38.2,36.8 Z" ${pathAttrs}/>`;
    case 'star6':
      return `<path d="M50,3 L59,32 L88,18 L71,46 L97,63 L65,63 L50,95 L35,63 L3,63 L29,46 L12,18 L41,32 Z" ${pathAttrs}/>`;
    case 'star4':
      return `<path d="M50,3 L57,43 L97,50 L57,57 L50,97 L43,57 L3,50 L43,43 Z" ${pathAttrs}/>`;
    case 'heart':
      return `<path d="M50,88 C30,73 3,58 3,35 C3,18 16,6 30,6 C38,6 45,10 50,17 C55,10 62,6 70,6 C84,6 97,18 97,35 C97,58 70,73 50,88 Z" ${pathAttrs}/>`;
    case 'cloud':
      return `<path d="M22,70 Q5,70 5,52 Q5,38 18,33 Q16,18 28,14 Q36,8 45,17 Q52,8 65,13 Q79,13 83,26 Q95,26 95,40 Q95,55 83,59 Z" ${pathAttrs}/>`;
    case 'speech':
      return `<path d="M3,3 L97,3 L97,72 L60,72 L45,97 L45,72 L3,72 Z" ${pathAttrs}/>`;
    case 'lightning':
      return `<path d="M60,3 L20,55 L48,55 L40,97 L80,45 L52,45 Z" ${pathAttrs}/>`;
    case 'moon':
      return `<path d="M75,10 A45,45 0 1 0 75,90 A30,30 0 1 1 75,10 Z" ${pathAttrs}/>`;
    case 'cross':
      return `<path d="M35,3 L65,3 L65,35 L97,35 L97,65 L65,65 L65,97 L35,97 L35,65 L3,65 L3,35 L35,35 Z" ${pathAttrs}/>`;
    case 'arrow_right':
      return `<path d="M3,35 L63,35 L63,15 L97,50 L63,85 L63,65 L3,65 Z" ${pathAttrs}/>`;
    case 'arrow_left':
      return `<path d="M97,35 L37,35 L37,15 L3,50 L37,85 L37,65 L97,65 Z" ${pathAttrs}/>`;
    case 'arrow_up':
      return `<path d="M35,97 L35,37 L15,37 L50,3 L85,37 L65,37 L65,97 Z" ${pathAttrs}/>`;
    case 'arrow_down':
      return `<path d="M35,3 L35,63 L15,63 L50,97 L85,63 L65,63 L65,3 Z" ${pathAttrs}/>`;
    case 'cube3d':
      return `<path d="M50,10 L90,30 L50,50 L10,30 Z" fill="${f}" style="filter:brightness(1.15)" ${swStr}/>` +
             `<path d="M90,30 L90,70 L50,90 L50,50 Z" fill="${f}" style="filter:brightness(0.85)" ${swStr}/>` +
             `<path d="M10,30 L50,50 L50,90 L10,70 Z" fill="${f}" style="filter:brightness(0.65)" ${swStr}/>`;
    case 'cylinder3d':
      return `<path d="M20,25 L80,25 L80,80 L20,80 Z" fill="${f}" ${swStr}/>` +
             `<ellipse cx="50" cy="80" rx="30" ry="10" fill="${f}" style="filter:brightness(0.8)" ${swStr}/>` +
             `<ellipse cx="50" cy="25" rx="30" ry="10" fill="${f}" style="filter:brightness(1.15)" ${swStr}/>`;
    case 'cone3d':
      return `<path d="M50,5 L90,85 L10,85 Z" fill="${f}" ${swStr}/>` +
             `<ellipse cx="50" cy="85" rx="40" ry="12" fill="${f}" style="filter:brightness(0.75)" ${swStr}/>`;
    case 'pyramid3d':
      return `<path d="M50,5 L85,85 L15,85 Z" fill="${f}" ${swStr}/>` +
             `<path d="M50,5 L85,85 L50,75 L50,5 Z" fill="${f}" style="filter:brightness(0.75)" ${swStr}/>` +
             `<path d="M15,85 L85,85 L50,75 Z" fill="${f}" style="filter:brightness(0.55)" ${swStr}/>`;
    default:
      return `<ellipse cx="50" cy="50" rx="48" ry="48" ${pathAttrs}/>`;
  }
}
