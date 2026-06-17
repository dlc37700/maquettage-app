import { getBgCss, escHtml, compToHtml } from './exportHtml.js';

// Render one screen at mini-phone scale (scale 0.533 → ~208×450px content)
function miniScreenInner(screen, canvasW = 390, canvasH = 844) {
  const sorted = [...screen.components].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
  const comps = sorted.map(c => compToHtml(c, canvasW, canvasH)).filter(Boolean).join('\n');
  const bgCss = screen.backgroundImage
    ? `background-image:url(${screen.backgroundImage});background-size:cover;background-position:center;background-repeat:no-repeat`
    : getBgCss(screen.backgroundColor || '#FFFFFF', screen.backgroundGradient);
  return `<div style="position:relative;width:${canvasW}px;height:${canvasH}px;${bgCss};overflow:hidden;flex-shrink:0">${comps}</div>`;
}

const SCALE = 0.533;

function phoneCard(screen, index, canvasW = 390, canvasH = 844) {
  const scaledW = Math.round(canvasW * SCALE);
  const scaledH = Math.round(canvasH * SCALE);
  const outerW = scaledW + 24 + 8;
  const outerH = scaledH + 30 + 8 + 14;
  return `
  <div class="screen-card">
    <div class="screen-label-row">
      <div class="num-circle">${index + 1}</div>
      <div class="screen-name" contenteditable="true">${escHtml(screen.name)}</div>
    </div>
    <div class="phone" style="width:${outerW}px;height:${outerH}px;">
      <div class="phone-notch"></div>
      <div class="phone-content" style="width:${scaledW}px;height:${scaledH}px;overflow:hidden;position:relative;border-radius:20px;">
        <div style="transform:scale(${SCALE});transform-origin:top left;width:${canvasW}px;height:${canvasH}px;position:absolute;top:0;left:0;">
          ${miniScreenInner(screen, canvasW, canvasH)}
        </div>
      </div>
    </div>
    <div class="annotation" contenteditable="true">Description de cet écran…</div>
  </div>`;
}

function navSvg(screens) {
  const n = screens.length;
  if (n === 0) return '';
  const BOX_W = 160, BOX_H = 80, GAP_X = 60, GAP_Y = 60;
  const COLS = n <= 3 ? n : Math.ceil(n / 2);
  const ROWS = Math.ceil(n / COLS);
  const svgW = COLS * BOX_W + (COLS - 1) * GAP_X + 60;
  const svgH = ROWS * BOX_H + (ROWS - 1) * GAP_Y + 60;

  const COLORS = ['#FF5C5C', '#2E3192', '#F4B860', '#6BBE8C', '#A78BFA', '#06B6D4', '#EC4899', '#84CC16'];

  const boxes = screens.map((s, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = 30 + col * (BOX_W + GAP_X);
    const y = 30 + row * (BOX_H + GAP_Y);
    const cx = x + BOX_W / 2;
    const cy = y + BOX_H / 2;
    const color = COLORS[i % COLORS.length];
    const textColor = (i === 2) ? '#0F1B2D' : 'white';
    return { x, y, cx, cy, color, textColor, s };
  });

  const rects = boxes.map(({ x, y, color, textColor, s }) => `
    <rect x="${x}" y="${y}" width="${BOX_W}" height="${BOX_H}" rx="12" fill="${color}" stroke="#0F1B2D" stroke-width="1.5"/>
    <text x="${x + BOX_W / 2}" y="${y + 26}" text-anchor="middle" font-family="Outfit" font-size="10" fill="${textColor}" font-weight="700" letter-spacing="1">ÉCRAN</text>
    <text x="${x + BOX_W / 2}" y="${y + 50}" text-anchor="middle" font-family="Fraunces" font-size="15" fill="${textColor}" font-weight="700">${escHtml(s.name.length > 16 ? s.name.slice(0, 14) + '…' : s.name)}</text>
  `).join('');

  const arrows = boxes.slice(1).map(({ cx, cy }, i) => {
    const prev = boxes[i];
    return `<line x1="${prev.cx}" y1="${prev.cy}" x2="${cx - 5}" y2="${cy}" stroke="#0F1B2D" stroke-width="2" marker-end="url(#arrowBlk)" opacity="0.5" stroke-dasharray="6,4"/>`;
  }).join('');

  return `<svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
    <defs>
      <marker id="arrowBlk" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
        <path d="M0,0 L0,6 L8,3 z" fill="#0F1B2D" opacity="0.5"/>
      </marker>
    </defs>
    ${arrows}
    ${rects}
  </svg>`;
}

function posterMiniScreens(screens, canvasW, canvasH) {
  const PSCALE = 0.22;
  const pw = Math.round(canvasW * PSCALE);
  const ph = Math.round(canvasH * PSCALE);
  return screens.slice(0, 4).map((s, i) => `
    <div style="border:1.5px solid #0F1B2D;border-radius:8px;overflow:hidden;position:relative;aspect-ratio:${canvasW}/${canvasH};box-shadow:2px 2px 0 #0F1B2D;">
      <div style="position:absolute;top:3px;left:50%;transform:translateX(-50%);background:#0F1B2D;color:white;padding:1px 6px;font-size:7px;border-radius:3px;font-family:JetBrains Mono,monospace;font-weight:600;z-index:5;white-space:nowrap;">${i + 1} · ${escHtml(s.name.slice(0, 10))}</div>
      <div style="overflow:hidden;width:${pw}px;height:${ph}px;">
        <div style="transform:scale(${PSCALE});transform-origin:top left;width:${canvasW}px;height:${canvasH}px;">
          ${miniScreenInner(s, canvasW, canvasH)}
        </div>
      </div>
    </div>`).join('');
}

const ROLE_META = [
  { key: 'chef', emoji: '👑', label: 'Chef·fe de projet', color: 'var(--indigo)', bullets: ["A coordonné l'équipe", 'A tenu le carnet de bord', "A présenté le besoin à l'oral"] },
  { key: 'designer', emoji: '🎨', label: 'Designer', color: 'var(--coral)', bullets: ['A conçu les écrans', 'A créé le logo', "A mis en page l'affiche"] },
  { key: 'redacteur', emoji: '✍️', label: 'Rédacteur·rice', color: 'var(--mustard)', bullets: ['A rédigé le cahier des charges', 'A écrit les textes', 'A corrigé le dossier'] },
  { key: 'porteparole', emoji: '🎤', label: 'Porte-parole', color: 'var(--green)', bullets: [" A préparé le plan de l'oral", 'A présenté la maquette', 'A répondu aux questions'] },
];

const CONSTRAINT_ICONS = {
  'Technique': '⚙️', 'Économique': '💰', 'Légale': '🔒', 'Ergonomique': '👁️', 'Esthétique': '🎨', 'Environnementale': '🌱',
};

function teamCardsHtml(brief) {
  return ROLE_META.map(r => {
    const name = brief?.team?.[r.key]?.trim();
    return `
    <div class="card">
      <div class="icon-big" style="background:${r.color};">${r.emoji}</div>
      <h3 contenteditable="true">${escHtml(name || 'Prénom')}</h3>
      <p class="role" contenteditable="true">${r.label}</p>
      <ul>
        ${r.bullets.map(b => `<li contenteditable="true">${escHtml(b)}</li>`).join('')}
      </ul>
    </div>`;
  }).join('');
}

function functionsHtml(brief) {
  const fns = (brief?.functions || []).filter(f => f.text?.trim());
  if (fns.length === 0) {
    return `
      <div class="function-row"><div class="num">01</div><div class="desc" contenteditable="true"><strong>Permettre à l'utilisateur</strong> de réaliser la fonction principale de votre appli.</div><div class="priority">★★★</div></div>
      <div class="function-row"><div class="num">02</div><div class="desc" contenteditable="true"><strong>Afficher</strong> les informations importantes pour l'utilisateur.</div><div class="priority">★★★</div></div>
      <div class="function-row"><div class="num">03</div><div class="desc" contenteditable="true"><strong>Envoyer</strong> une notification ou un rappel à l'utilisateur.</div><div class="priority">★★★</div></div>`;
  }
  return fns.map((f, i) => {
    const priorityClass = f.priority === 2 ? 'med' : f.priority === 1 ? 'low' : '';
    const stars = '★'.repeat(f.priority || 1);
    return `<div class="function-row"><div class="num">${String(i + 1).padStart(2, '0')}</div><div class="desc" contenteditable="true">${escHtml(f.text)}</div><div class="priority ${priorityClass}">${stars}</div></div>`;
  }).join('');
}

function constraintsHtml(brief) {
  const cons = (brief?.constraints || []).filter(c => c.text?.trim());
  if (cons.length === 0) {
    return Object.entries(CONSTRAINT_ICONS).map(([type, icon]) => `
      <div class="constraint">
        <div class="ic">${icon}</div>
        <h4 contenteditable="true">${escHtml(type)}</h4>
        <p contenteditable="true">Précisez la contrainte ${type.toLowerCase()} de votre application.</p>
      </div>`).join('');
  }
  return cons.map(c => `
    <div class="constraint">
      <div class="ic">${CONSTRAINT_ICONS[c.type] || '📌'}</div>
      <h4 contenteditable="true">${escHtml(c.type)}</h4>
      <p contenteditable="true">${escHtml(c.text)}</p>
    </div>`).join('');
}

export function exportProjectAsDossier(state) {
  const { screens: allScreens, projectName = 'Mon Application', canvasW = 390, canvasH = 844, projectBrief: brief = null } = state;
  const screens = allScreens.filter(s => !s._remote);
  const title = escHtml(projectName);
  const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  const screensHtml = screens.map((s, i) => phoneCard(s, i, canvasW, canvasH)).join('');
  const navDiagram = navSvg(screens);
  const posterScreens = posterMiniScreens(screens, canvasW, canvasH);

  const teamNames = ROLE_META.map(r => brief?.team?.[r.key]?.trim()).filter(Boolean);
  const teamLine = teamNames.length > 0 ? [...new Set(teamNames)].join(' · ') : 'Prénom Prénom Prénom';
  const slogan = brief?.slogan?.trim() || 'Slogan ou description courte de l\'application.';
  const subtitle = brief?.need?.trim() || 'Décrivez ici en une ou deux phrases le problème que votre application résout et à qui elle s\'adresse.';
  const needText = brief?.need?.trim() || 'Décrivez ici en 3 à 5 phrases ce que fait votre application, à qui elle s\'adresse, et pourquoi elle est utile. Expliquez comment elle résout le problème identifié.';
  const audience = brief?.audience?.trim() || 'Décrivez votre utilisateur type.';
  const age = brief?.age?.trim() || 'Âge de l\'utilisateur type';
  const problem = brief?.problem?.trim() || 'Le problème qu\'il rencontre au quotidien.';
  const teamFooterHtml = ROLE_META.map(r => {
    const name = brief?.team?.[r.key]?.trim();
    return `<span class="member">${r.emoji} ${escHtml((name || 'PRÉNOM').toUpperCase())}</span>`;
  }).join('\n        ');
  const functionsListHtml = (brief?.functions || []).filter(f => f.text?.trim()).slice(0, 5)
    .map(f => `<li contenteditable="true">${escHtml(f.text)}</li>`).join('') ||
    `<li contenteditable="true">Première fonction principale</li><li contenteditable="true">Deuxième fonction principale</li><li contenteditable="true">Troisième fonction</li>`;
  const constraintsListHtml = (brief?.constraints || []).filter(c => c.text?.trim())
    .map(c => `<li contenteditable="true">${escHtml(c.text)}</li>`).join('') ||
    `<li contenteditable="true">Gratuite, sans publicité</li><li contenteditable="true">Contrainte technique importante</li>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Dossier de projet</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,800;0,9..144,900;1,9..144,600&family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root {
    --ink:#0F1B2D; --ink-soft:#2C3E5C; --paper:#FBF7F0; --paper-2:#F4ECDD;
    --indigo:#2E3192; --indigo-2:#4548BB; --coral:#FF5C5C; --mustard:#F4B860;
    --green:#6BBE8C; --line:#E2D6BC;
    --shadow:0 12px 40px -16px rgba(15,27,45,0.25);
    --shadow-sm:0 4px 18px -8px rgba(15,27,45,0.18);
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{font-family:'Outfit',sans-serif;background:var(--paper);color:var(--ink);line-height:1.6;font-weight:400;overflow-x:hidden;}
  body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.06 0 0 0 0 0.1 0 0 0 0 0.18 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");pointer-events:none;z-index:1;opacity:0.6;}
  .page{max-width:1100px;margin:0 auto;padding:80px 60px;position:relative;z-index:2;}
  h1,h2,h3{font-family:'Fraunces',serif;font-weight:800;letter-spacing:-0.02em;line-height:1.05;}
  .display{font-family:'Fraunces',serif;font-weight:900;font-size:clamp(48px,8vw,110px);line-height:0.92;letter-spacing:-0.04em;}
  .display em{font-style:italic;font-weight:400;color:var(--coral);}
  .label-mono{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;color:var(--indigo);}
  .accent{color:var(--coral);}

  /* EDIT BAR */
  #edit-bar{position:fixed;top:0;left:0;right:0;z-index:9999;background:var(--ink);color:var(--paper);display:flex;align-items:center;justify-content:space-between;padding:10px 24px;font-family:'JetBrains Mono',monospace;font-size:12px;gap:16px;box-shadow:0 2px 16px rgba(0,0,0,0.4);}
  #edit-bar .hint{opacity:0.6;font-size:11px;}
  #edit-bar button{background:var(--coral);color:white;border:none;padding:8px 20px;border-radius:8px;font-family:'Outfit',sans-serif;font-weight:700;font-size:13px;cursor:pointer;transition:opacity 0.2s;}
  #edit-bar button:hover{opacity:0.85;}
  body{padding-top:52px;}
  [contenteditable]{outline:none;border-radius:4px;transition:background 0.15s;}
  [contenteditable]:hover{background:rgba(46,49,146,0.06);}
  [contenteditable]:focus{background:rgba(46,49,146,0.1);box-shadow:0 0 0 2px var(--indigo-2);}

  /* HERO */
  .hero{min-height:80vh;display:flex;flex-direction:column;justify-content:center;position:relative;padding-bottom:0;}
  .hero .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:60px;padding-bottom:20px;border-bottom:1.5px solid var(--ink);}
  .hero .topbar .dot{width:10px;height:10px;background:var(--coral);border-radius:50%;display:inline-block;margin-right:10px;}
  .hero .tag{display:inline-block;background:var(--ink);color:var(--paper);padding:8px 18px;border-radius:100px;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:24px;}
  .hero .subtitle{font-family:'Fraunces',serif;font-style:italic;font-weight:400;font-size:clamp(18px,2vw,28px);color:var(--ink-soft);max-width:680px;line-height:1.4;margin-top:24px;}
  .hero .meta{display:flex;gap:50px;margin-top:50px;flex-wrap:wrap;}
  .hero .meta-item .ml{display:block;margin-bottom:6px;}
  .hero .meta-item .value{font-family:'Fraunces',serif;font-size:20px;font-weight:600;}

  /* SECTIONS */
  section{padding:80px 0;position:relative;}
  .section-header{margin-bottom:50px;display:grid;grid-template-columns:1fr 2fr;gap:40px;align-items:end;border-bottom:2px solid var(--ink);padding-bottom:20px;}
  .section-number{font-family:'Fraunces',serif;font-style:italic;font-weight:400;font-size:80px;color:var(--coral);line-height:0.8;}
  .section-header h2{font-size:clamp(28px,4vw,48px);}
  .section-intro{font-family:'Fraunces',serif;font-style:italic;font-size:18px;line-height:1.5;color:var(--ink-soft);max-width:700px;margin-bottom:40px;}

  /* SCREENS */
  .screens-section{background:var(--ink);color:var(--paper);padding:80px 0;border-radius:32px;margin:60px 0;}
  .screens-section .page{padding-top:0;padding-bottom:0;}
  .screens-section h2,.screens-section .section-header h2{color:var(--paper);}
  .screens-section .section-number{color:var(--mustard);}
  .screens-section .section-intro{color:rgba(251,247,240,0.75);}
  .screens-section .section-header{border-bottom-color:rgba(251,247,240,0.25);}
  .screens-grid{display:flex;flex-wrap:wrap;gap:50px 40px;margin-top:50px;justify-content:center;}
  .screen-card{display:flex;flex-direction:column;align-items:center;}
  .screen-label-row{display:flex;align-items:center;gap:10px;margin-bottom:16px;width:100%;}
  .num-circle{width:32px;height:32px;border:2px solid var(--mustard);color:var(--mustard);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-weight:800;font-size:15px;flex-shrink:0;}
  .screen-name{font-family:'Fraunces',serif;font-size:18px;font-weight:600;color:var(--paper);}
  .phone{background:var(--paper);border-radius:36px;border:4px solid #1a1a1a;padding:14px 12px 16px;position:relative;box-shadow:0 20px 50px -10px rgba(0,0,0,0.5);overflow:hidden;display:flex;align-items:center;justify-content:center;}
  .phone-notch{position:absolute;top:14px;left:50%;transform:translateX(-50%);width:70px;height:16px;background:#1a1a1a;border-radius:0 0 12px 12px;z-index:10;}
  .phone-content{border-radius:20px;overflow:hidden;}
  .annotation{margin-top:16px;padding:12px 16px;background:rgba(244,184,96,0.12);border-left:3px solid var(--mustard);border-radius:0 8px 8px 0;font-family:'Fraunces',serif;font-style:italic;font-size:13px;line-height:1.5;color:rgba(251,247,240,0.8);max-width:240px;}

  /* NAV DIAGRAM */
  .nav-diagram{background:white;border:2px solid var(--ink);border-radius:20px;padding:40px;margin-top:40px;box-shadow:var(--shadow);}

  /* TEAM / CDC */
  .cards-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-top:24px;}
  .card{background:white;border:1.5px solid var(--ink);border-radius:14px;padding:28px;box-shadow:var(--shadow-sm);position:relative;}
  .card .icon-big{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:14px;}
  .card h3{font-size:20px;margin-bottom:6px;}
  .card .role{color:var(--coral);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;}
  .card ul{list-style:none;padding:0;}
  .card ul li{padding:7px 0;border-bottom:1px dashed var(--line);font-size:14px;}
  .card ul li:last-child{border-bottom:none;}

  /* FUNCTIONS */
  .functions{display:grid;gap:14px;margin-top:20px;}
  .function-row{display:grid;grid-template-columns:50px 1fr auto;gap:18px;padding:18px;background:var(--paper-2);border:1.5px solid var(--ink);border-radius:12px;align-items:center;}
  .function-row:hover{transform:translateX(4px);transition:transform 0.2s;}
  .function-row .num{font-family:'Fraunces',serif;font-size:34px;font-weight:900;color:var(--coral);line-height:1;font-style:italic;}
  .function-row .desc{font-size:15px;line-height:1.4;}
  .function-row .priority{color:var(--coral);font-size:16px;letter-spacing:0.1em;}
  .function-row .priority.med{opacity:0.6;}
  .function-row .priority.low{opacity:0.35;}

  /* CONTRAINTES */
  .constraints{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;}
  .constraint{background:white;border:1.5px solid var(--ink);border-radius:14px;padding:22px;box-shadow:var(--shadow-sm);}
  .constraint .ic{width:42px;height:42px;background:var(--indigo);color:white;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:12px;}
  .constraint h4{font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--indigo);margin-bottom:6px;}
  .constraint p{font-size:14px;color:var(--ink-soft);line-height:1.5;}

  /* PERSONA */
  .cdc-card{background:white;border:1.5px solid var(--ink);border-radius:16px;padding:36px;margin-bottom:24px;position:relative;box-shadow:var(--shadow-sm);}
  .cdc-card .pin{position:absolute;top:-12px;left:28px;background:var(--coral);color:white;padding:5px 12px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;text-transform:uppercase;box-shadow:2px 2px 0 var(--ink);}
  .persona{display:grid;grid-template-columns:auto 1fr;gap:28px;align-items:start;margin-top:16px;}
  .persona .avatar{width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,var(--mustard),var(--coral));display:flex;align-items:center;justify-content:center;font-size:56px;border:3px solid var(--ink);box-shadow:4px 4px 0 var(--ink);}
  .persona-info h4{font-family:'Fraunces',serif;font-size:22px;margin-bottom:4px;}
  .persona-info ul{list-style:none;padding:0;}
  .persona-info ul li{padding:7px 0;border-bottom:1px dashed var(--line);display:flex;gap:12px;align-items:baseline;font-size:14px;}
  .persona-info ul li strong{font-weight:600;min-width:120px;color:var(--indigo);}

  /* POSTER */
  .poster-frame{background:linear-gradient(135deg,#fff,var(--paper));border:3px solid var(--ink);box-shadow:10px 10px 0 var(--ink);padding:40px;margin-top:40px;position:relative;max-width:800px;margin-left:auto;margin-right:auto;display:grid;grid-template-rows:auto auto 1fr auto;gap:24px;}
  .poster-header{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;border-bottom:2px solid var(--ink);padding-bottom:16px;}
  .poster-logo{width:70px;height:70px;background:var(--coral);border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:36px;transform:rotate(-4deg);box-shadow:4px 4px 0 var(--ink);}
  .poster-name h1{font-family:'Fraunces',serif;font-size:38px;font-weight:900;line-height:1;margin-top:4px;}
  .poster-name .slogan{font-family:'Fraunces',serif;font-style:italic;font-size:14px;color:var(--ink-soft);margin-top:4px;}
  .poster-badge{background:var(--ink);color:var(--paper);padding:6px 12px;border-radius:10px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;transform:rotate(3deg);white-space:nowrap;}
  .poster-body{display:grid;grid-template-columns:1.2fr 1fr;gap:24px;}
  .poster-section-block h3{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;color:var(--coral);margin-bottom:8px;}
  .poster-section-block p{font-size:12px;line-height:1.5;margin-bottom:12px;}
  .poster-section-block ul{list-style:none;padding:0;}
  .poster-section-block ul li{font-size:11px;padding:4px 0;padding-left:16px;position:relative;line-height:1.4;}
  .poster-section-block ul li::before{content:'→';position:absolute;left:0;color:var(--coral);font-weight:700;}
  .poster-screens{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .poster-footer{border-top:1.5px solid var(--ink);padding-top:12px;display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;font-size:11px;}
  .poster-footer .team{display:flex;gap:5px;flex-wrap:wrap;}
  .poster-footer .member{background:var(--ink);color:var(--paper);padding:3px 8px;border-radius:100px;font-size:9px;}

  /* FOOTER */
  .end-note{text-align:center;padding:60px 0;color:var(--ink-soft);}
  .end-note .big-emoji{font-size:50px;margin-bottom:16px;}
  .end-note h3{font-family:'Fraunces',serif;font-size:32px;margin-bottom:12px;}

  @media(max-width:768px){
    .page{padding:40px 20px;}
    .section-header{grid-template-columns:1fr;gap:16px;}
    .persona{grid-template-columns:1fr;}
    .poster-body{grid-template-columns:1fr;}
    .hero .meta{gap:24px;}
  }
  @media print{
    #edit-bar{display:none!important;}
    body{padding-top:0!important;background:white;}
    body::before{display:none;}
    section{page-break-inside:avoid;padding:40px 0;}
    .screens-section{page-break-before:always;}
  }
</style>
</head>
<body>

<!-- ========== BARRE D'ÉDITION ========== -->
<div id="edit-bar">
  <div>
    <span>📝</span>&nbsp;
    <strong>Mode édition</strong>&nbsp;
    <span class="hint">— Cliquez sur n'importe quel texte pour le modifier directement</span>
  </div>
  <button onclick="saveDossier()">⬇ Télécharger le dossier</button>
</div>

<!-- ========== HERO ========== -->
<div class="page hero">
  <div class="topbar">
    <div style="display:flex;align-items:center;font-family:'JetBrains Mono',monospace;font-size:13px;">
      <span class="dot"></span>
      <span contenteditable="true">DOSSIER DE PROJET — TECHNOLOGIE</span>
    </div>
    <div style="font-family:'JetBrains Mono',monospace;font-size:13px;" contenteditable="true">4ᵉ TECHNO / ${new Date().getFullYear()}</div>
  </div>

  <span class="tag" contenteditable="true">Projet technologie</span>
  <h1 class="display" contenteditable="true">${title}</h1>
  <p class="subtitle" contenteditable="true">${escHtml(subtitle)}</p>

  <div class="meta">
    <div class="meta-item">
      <span class="label-mono ml">Équipe</span>
      <span class="value" contenteditable="true">${escHtml(teamLine)}</span>
    </div>
    <div class="meta-item">
      <span class="label-mono ml">Classe</span>
      <span class="value" contenteditable="true">4ᵉ X</span>
    </div>
    <div class="meta-item">
      <span class="label-mono ml">Date</span>
      <span class="value">${today}</span>
    </div>
    <div class="meta-item">
      <span class="label-mono ml">Écrans</span>
      <span class="value">${screens.length} écran${screens.length > 1 ? 's' : ''}</span>
    </div>
  </div>
</div>

<!-- ========== SECTION 01 — ÉQUIPE ========== -->
<section>
<div class="page">
  <div class="section-header">
    <div class="section-number">01</div>
    <h2>L'équipe et les rôles</h2>
  </div>
  <p class="section-intro" contenteditable="true">Chaque membre de l'équipe a un rôle principal. Modifiez les cartes ci-dessous pour ajuster les contributions.</p>
  <div class="cards-grid">
    ${teamCardsHtml(brief)}
  </div>
</div>
</section>

<!-- ========== SECTION 02 — LE BESOIN ========== -->
<section style="background:var(--paper-2);">
<div class="page">
  <div class="section-header">
    <div class="section-number">02</div>
    <h2>Le besoin qu'on résout</h2>
  </div>
  <p class="section-intro" contenteditable="true">Tout commence par un vrai problème, observé dans la vraie vie. Décrivez-le ici.</p>

  <div style="background:var(--mustard);padding:28px 36px;border-radius:16px;margin:28px 0;border:1.5px solid var(--ink);box-shadow:4px 4px 0 var(--ink);transform:rotate(-0.5deg);">
    <div style="font-size:26px;margin-bottom:8px;">💭</div>
    <p style="font-family:'Fraunces',serif;font-style:italic;font-size:20px;line-height:1.4;color:var(--ink);" contenteditable="true">« ${escHtml(problem)} »</p>
  </div>

  <div class="cdc-card">
    <div class="pin">PARTIE 1 — À QUI ?</div>
    <h3>Notre utilisateur cible</h3>
    <p style="font-family:'Fraunces',serif;font-style:italic;color:var(--indigo);margin-top:8px;font-size:16px;" contenteditable="true">À qui s'adresse l'application ?</p>
    <div class="persona">
      <div class="avatar" contenteditable="true">🧒</div>
      <div class="persona-info">
        <h4 contenteditable="true">${escHtml(audience)}</h4>
        <p style="color:var(--ink-soft);margin-bottom:14px;font-style:italic;" contenteditable="true">${escHtml(age)}</p>
        <ul>
          <li><strong>Le problème</strong> <span contenteditable="true">${escHtml(problem)}</span></li>
          <li><strong>Public visé</strong> <span contenteditable="true">${escHtml(audience)}</span></li>
          <li><strong>Âge</strong> <span contenteditable="true">${escHtml(age)}</span></li>
        </ul>
      </div>
    </div>
  </div>

  <div class="cdc-card">
    <div class="pin">PARTIE 2 — À QUOI ?</div>
    <h3>Le besoin qu'on identifie</h3>
    <p style="font-family:'Fraunces',serif;font-style:italic;color:var(--indigo);margin-top:8px;font-size:16px;" contenteditable="true">À quoi sert l'application ?</p>
    <p style="font-size:16px;line-height:1.6;margin-top:16px;" contenteditable="true">${escHtml(needText)}</p>
  </div>
</div>
</section>

<!-- ========== SECTION 03 — FONCTIONS ========== -->
<section>
<div class="page">
  <div class="section-header">
    <div class="section-number">03</div>
    <h2>Ce que l'appli doit faire</h2>
  </div>
  <p class="section-intro" contenteditable="true">Listez les fonctions principales de votre application. Chaque fonction commence par un verbe à l'infinitif.</p>

  <div class="cdc-card">
    <div class="pin">PARTIE 3 — QUE FAIRE ?</div>
    <div class="functions">
      ${functionsHtml(brief)}
    </div>
  </div>
</div>
</section>

<!-- ========== SECTION 04 — CONTRAINTES ========== -->
<section style="background:var(--paper-2);">
<div class="page">
  <div class="section-header">
    <div class="section-number">04</div>
    <h2>Les contraintes à respecter</h2>
  </div>
  <p class="section-intro" contenteditable="true">Notre projet doit respecter ces contraintes pour être utile, utilisable et acceptable.</p>
  <div class="cdc-card">
    <div class="pin">PARTIE 4 — CONTRAINTES</div>
    <div class="constraints">
      ${constraintsHtml(brief)}
    </div>
  </div>
</div>
</section>

<!-- ========== SECTION 05 — ÉCRANS ========== -->
<section class="screens-section">
<div class="page">
  <div class="section-header">
    <div class="section-number">05</div>
    <h2>Les écrans de l'appli</h2>
  </div>
  <p class="section-intro" contenteditable="true">Voici les ${screens.length} écran${screens.length > 1 ? 's' : ''} principal${screens.length > 1 ? 'aux' : ''} conçu${screens.length > 1 ? 's' : ''} avec MaquetApp. Cliquez sur le titre ou l'annotation pour les modifier.</p>
  <div class="screens-grid">
    ${screensHtml}
  </div>
</div>
</section>

<!-- ========== SECTION 06 — NAVIGATION ========== -->
<section>
<div class="page">
  <div class="section-header">
    <div class="section-number">06</div>
    <h2>Schéma de navigation</h2>
  </div>
  <p class="section-intro" contenteditable="true">Comment passe-t-on d'un écran à l'autre ? Ce schéma montre les liens de navigation entre les écrans.</p>
  <div class="nav-diagram">
    ${navDiagram}
    <p style="margin-top:20px;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--ink-soft);border-top:1px dashed var(--line);padding-top:16px;" contenteditable="true">→ Complétez ce schéma à la main ou dans un outil de dessin pour préciser les flèches et les conditions de navigation.</p>
  </div>
</div>
</section>

<!-- ========== SECTION 07 — AFFICHE A3 ========== -->
<section style="background:var(--paper-2);">
<div class="page">
  <div class="section-header">
    <div class="section-number">07</div>
    <h2>Notre affiche A3</h2>
  </div>
  <p class="section-intro" contenteditable="true">Maquette de l'affiche de présentation. Modifiez le contenu directement dans cette page.</p>

  <div class="poster-frame">
    <span style="position:absolute;top:10px;left:14px;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.15em;" contenteditable="true">PROJET TECHNO</span>
    <span style="position:absolute;top:10px;right:14px;font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--ink-soft);" contenteditable="true">${new Date().getFullYear()}</span>

    <div class="poster-header">
      <div class="poster-logo" contenteditable="true">📱</div>
      <div class="poster-name">
        <span class="label-mono" style="font-size:10px;" contenteditable="true">Notre application mobile</span>
        <h1 contenteditable="true">${title}</h1>
        <p class="slogan" contenteditable="true">${escHtml(slogan)}</p>
      </div>
      <div class="poster-badge" contenteditable="true">4ᵉ · ${new Date().getFullYear()}</div>
    </div>

    <div class="poster-body">
      <div>
        <div class="poster-section-block">
          <h3>→ Le besoin</h3>
          <p contenteditable="true">${escHtml(needText)}</p>
        </div>
        <div class="poster-section-block">
          <h3>→ Les fonctions principales</h3>
          <ul>
            ${functionsListHtml}
          </ul>
        </div>
        <div class="poster-section-block">
          <h3>→ Les contraintes</h3>
          <ul>
            ${constraintsListHtml}
          </ul>
        </div>
      </div>
      <div>
        <div class="poster-section-block">
          <h3>→ Les écrans</h3>
          <div class="poster-screens">
            ${posterScreens}
          </div>
        </div>
        <div class="poster-section-block" style="margin-top:14px;">
          <h3>→ Le parcours type</h3>
          <p contenteditable="true">Décrivez ici en une phrase le parcours d'un utilisateur type dans l'application, de son déclencheur jusqu'à son objectif atteint.</p>
        </div>
      </div>
    </div>

    <div class="poster-footer">
      <div class="team" contenteditable="true">
        ${teamFooterHtml}
      </div>
      <span contenteditable="true">COLLÈGE · CLASSE</span>
    </div>
  </div>
</div>
</section>

<!-- ========== FOOTER ========== -->
<div class="end-note">
  <div class="big-emoji">🚀</div>
  <h3>Projet réalisé avec MaquetApp</h3>
  <p style="max-width:500px;margin:0 auto;" contenteditable="true">Exporté le ${today}. Modifiez ce dossier directement dans votre navigateur, puis cliquez sur « Télécharger » pour sauvegarder.</p>
  <p style="margin-top:24px;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;opacity:0.5;">${title} · Dossier de projet technologie</p>
</div>

<script>
function saveDossier() {
  var clone = document.documentElement.cloneNode(true);
  var bar = clone.querySelector('#edit-bar');
  if (bar) bar.remove();
  clone.querySelectorAll('[contenteditable]').forEach(function(el) {
    el.removeAttribute('contenteditable');
  });
  // Remove inline padding-top added for edit bar
  var body = clone.querySelector('body');
  if (body) body.style.paddingTop = '0';
  var html = '<!DOCTYPE html>\\n' + clone.outerHTML;
  var blob = new Blob([html], { type: 'text/html' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '${title.replace(/[^a-zA-Z0-9]/g, '_')}_dossier.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
}
</script>
</body>
</html>`;
}
