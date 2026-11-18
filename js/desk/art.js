/* Hand-built SVG art for the Y2K desk (clear-blue plastic, cream electronics, warm afternoon light).
 * Every object is drawn in its own coordinate box (1 unit = 1px on the 1600x900 stage) and keeps its
 * moving parts in named groups (.lid, .disc, .screen, .cover …) so GSAP can animate them.
 * Shared gradients live once in Art.defs() and are referenced by id from every object.
 */
(function () {
  const INK = '#2b3a67';

  // ------------------------------------------------------------ small helpers
  const svg = (w, h, body, extra) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ${extra || ''} xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

  function starPath(cx, cy, r, inner) {
    const ri = r * (inner || 0.48);
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? ri : r;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
    }
    return d + 'Z';
  }
  // puffy star: rounded corners via stroke-linejoin on a thick stroke of the same color
  const star = (cx, cy, r, fill, cls) => `<path class="${cls || ''}" d="${starPath(cx, cy, r, 0.5)}" fill="${fill || 'url(#gBlue)'}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  const sparkle = (cx, cy, r, fill) => `<path d="M${cx} ${cy - r}Q${cx + r * 0.15} ${cy - r * 0.15} ${cx + r} ${cy}Q${cx + r * 0.15} ${cy + r * 0.15} ${cx} ${cy + r}Q${cx - r * 0.15} ${cy + r * 0.15} ${cx - r} ${cy}Q${cx - r * 0.15} ${cy - r * 0.15} ${cx} ${cy - r}Z" fill="${fill || '#fff'}"/>`;

  function heartPath(cx, cy, s) {
    // s = half width
    return `M${cx} ${cy + s * 0.9}C${cx - s * 1.5} ${cy - s * 0.1} ${cx - s * 0.9} ${cy - s * 1.25} ${cx} ${cy - s * 0.45}C${cx + s * 0.9} ${cy - s * 1.25} ${cx + s * 1.5} ${cy - s * 0.1} ${cx} ${cy + s * 0.9}Z`;
  }
  const heart = (cx, cy, s, fill, stroke) => `<path d="${heartPath(cx, cy, s)}" fill="${fill || '#7fa6ea'}" ${stroke === false ? '' : `stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"`}/>`;

  // pixel heart from a bitmap
  function pixelHeart(x, y, px, fill) {
    const rows = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
    let s = '';
    rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === '1') s += `<rect x="${x + i * px}" y="${y + j * px}" width="${px}" height="${px}"/>`; }));
    return `<g fill="${fill}">${s}</g>`;
  }
  // tiny pixel cat face for LCD screens
  function pixelCat(x, y, px, fill) {
    const rows = [
      '1000001',
      '1100011',
      '1111111',
      '1011101',
      '1111111',
      '1101011',
      '0111110',
    ];
    let s = '';
    rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === '1') s += `<rect x="${x + i * px}" y="${y + j * px}" width="${px}" height="${px}"/>`; }));
    return `<g fill="${fill || '#3b4a3c'}">${s}</g>`;
  }

  // heart-shaped pothos leaf pointing along angle a (deg)
  function leaf(x, y, size, a, tone) {
    const s = size;
    const fill = tone === 1 ? 'url(#gLeafB)' : 'url(#gLeaf)';
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})">
      <path d="M0 0C${s * 0.25} ${-s * 0.55} ${s * 1.05} ${-s * 0.6} ${s * 1.25} 0C${s * 1.05} ${s * 0.6} ${s * 0.25} ${s * 0.55} 0 0Z" fill="${fill}" stroke="#2f5a2c" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M${s * 0.08} 0Q${s * 0.6} ${-s * 0.04} ${s * 1.12} 0" stroke="#2f5a2c" stroke-width="1" fill="none" opacity=".55"/>
      <path d="M${s * 0.35} ${-s * 0.18}Q${s * 0.55} ${-s * 0.3} ${s * 0.75} ${-s * 0.28}" stroke="#d9f2b8" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round"/>
    </g>`;
  }

  /** A hanging vine: stem along a quadratic curve with leaves alternating left/right. */
  function vine(x0, y0, len, bend, count, seed) {
    let r = seed || 1;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push([x0 + Math.sin(t * Math.PI * 0.9) * bend + bend * 0.25 * t, y0 + t * len]);
    }
    const d = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
    let leaves = '';
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 0.6);
      const p = pts[Math.round(t * 24)];
      const side = i % 2 ? 1 : -1;
      const size = 20 + rnd() * 12 - t * 4;
      leaves += leaf(p[0], p[1], size, 90 + side * (55 + rnd() * 30), i % 3 === 0 ? 1 : 0);
    }
    return `<path d="${d}" stroke="#3d6b33" stroke-width="2.6" fill="none" stroke-linecap="round"/>${leaves}`;
  }

  // clouds
  const cloud = (x, y, s, op) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op || 1}"><path d="M0 30C-2 18 10 10 20 14C24 2 44 0 50 12C58 4 74 8 74 20C86 20 90 34 80 38L4 38C-4 38 -6 32 0 30Z" fill="#fff"/><path d="M6 36L78 36" stroke="#d7e8fb" stroke-width="3" stroke-linecap="round"/></g>`;

  // ------------------------------------------------------------ shared defs
  function defs() {
    return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
      <linearGradient id="gBlue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfe3ff"/><stop offset=".45" stop-color="#86b2f2"/><stop offset="1" stop-color="#3d6fd1"/></linearGradient>
      <linearGradient id="gBlueClear" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9eaff" stop-opacity=".95"/><stop offset=".5" stop-color="#8db9f5" stop-opacity=".78"/><stop offset="1" stop-color="#4a7fdc" stop-opacity=".9"/></linearGradient>
      <linearGradient id="gBlueDeep" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7aa0ec"/><stop offset=".55" stop-color="#3a5fc4"/><stop offset="1" stop-color="#22398a"/></linearGradient>
      <linearGradient id="gNavy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4d64b8"/><stop offset="1" stop-color="#26357a"/></linearGradient>
      <linearGradient id="gCream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf5e7"/><stop offset="1" stop-color="#e6d7b8"/></linearGradient>
      <linearGradient id="gCreamSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9dbbd"/><stop offset="1" stop-color="#d4c29d"/></linearGradient>
      <linearGradient id="gChrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7fc"/><stop offset=".5" stop-color="#c3cddd"/><stop offset="1" stop-color="#8e9bb3"/></linearGradient>
      <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f8fe3"/><stop offset=".6" stop-color="#9cc8f6"/><stop offset="1" stop-color="#d6ecfd"/></linearGradient>
      <linearGradient id="gGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6d670"/><stop offset="1" stop-color="#5b9a43"/></linearGradient>
      <linearGradient id="gLcd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dfe6d6"/><stop offset="1" stop-color="#aeb9a6"/></linearGradient>
      <linearGradient id="gLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fd26a"/><stop offset="1" stop-color="#4f8f3a"/></linearGradient>
      <linearGradient id="gLeafB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c2e48a"/><stop offset="1" stop-color="#6aa44a"/></linearGradient>
      <linearGradient id="gWall" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#fbf0db"/><stop offset="1" stop-color="#f0dfbf"/></linearGradient>
      <linearGradient id="gDesk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ead2a8"/><stop offset="1" stop-color="#dcbd8c"/></linearGradient>
      <linearGradient id="gCoffee" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a3a"/><stop offset="1" stop-color="#5a3420"/></linearGradient>
      <linearGradient id="gCD" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e9eef8"/><stop offset=".18" stop-color="#f6c6e6"/><stop offset=".32" stop-color="#bfe3ff"/>
        <stop offset=".46" stop-color="#d9f7d0"/><stop offset=".6" stop-color="#fff2b8"/><stop offset=".74" stop-color="#d4c4ff"/>
        <stop offset=".88" stop-color="#b7e0ff"/><stop offset="1" stop-color="#e9eef8"/></linearGradient>
      <radialGradient id="gCDShine" cx=".5" cy=".5" r=".5"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <radialGradient id="gGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d8" stop-opacity=".95"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>
      <radialGradient id="gBulb" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#fffdf2"/><stop offset=".6" stop-color="#ffe9a8"/><stop offset="1" stop-color="#f2c76a"/></radialGradient>
      <linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <pattern id="pGrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#e2cfa8" stroke-width="1.2" opacity=".7"/></pattern>
      <pattern id="pMesh" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0L8 8M8 0L0 8" stroke="#6f8fd6" stroke-width="1" opacity=".7"/></pattern>
      <pattern id="pLines" width="10" height="22" patternUnits="userSpaceOnUse"><path d="M0 21H10" stroke="#bcd0f2" stroke-width="1.2"/></pattern>
      <pattern id="pDots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="2.4" fill="#fff" opacity=".35"/></pattern>
      <filter id="fSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="fShadow" x="-10%" y="-10%" width="130%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#5b4220" flood-opacity=".22"/></filter>
    </defs></svg>`;
  }

  // ------------------------------------------------------------ room
  function room() {
    // wall + light + desk in one backdrop
    return svg(1600, 900, `
      <rect width="1600" height="900" fill="url(#gWall)"/>
      <rect width="1600" height="620" fill="url(#pGrid)"/>
      <path d="M760 0L1180 0L700 620L180 620Z" fill="#fff" opacity=".18" filter="url(#fSoft)"/>
      <path d="M1220 0L1420 0L1000 620L800 620Z" fill="#fff" opacity=".12" filter="url(#fSoft)"/>
      <rect y="560" width="1600" height="60" fill="#d9c09a" opacity=".35" filter="url(#fSoft)"/>
      <path d="M0 604Q800 588 1600 600L1600 900L0 900Z" fill="url(#gDesk)"/>
      <path d="M0 604Q800 588 1600 600" stroke="#c7a676" stroke-width="3" fill="none"/>
      <path d="M0 640Q800 626 1600 636" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/>
      <ellipse cx="320" cy="700" rx="420" ry="90" fill="#fff4d6" opacity=".35" filter="url(#fSoft)"/>
    `, 'class="room" preserveAspectRatio="none"');
  }

  // ------------------------------------------------------------ wall things
  function shelf() {
    let books = '';
    const cols = ['#7fa6ea', '#f2e8d3', '#4f72c9', '#cfe0fb', '#f7f0df', '#6b8fdc', '#e9dfc7', '#94b7f0'];
    let x = 14;
    cols.forEach((c, i) => {
      const w = 18 + (i * 7) % 12, h = 92 + (i * 13) % 30;
      books += `<rect x="${x}" y="${190 - h}" width="${w}" height="${h}" rx="3" fill="${c}" stroke="${INK}" stroke-width="1.8"/>
        <rect x="${x + 3}" y="${190 - h + 12}" width="${w - 6}" height="6" fill="#fff" opacity=".55"/>
        <rect x="${x + 3}" y="${190 - h + h * 0.6}" width="${w - 6}" height="3" fill="${INK}" opacity=".25"/>`;
      x += w + 2;
    });
    return svg(260, 300, `
      ${books}
      <g class="tilt-book" style="transform-origin:236px 190px">
        <rect x="${x + 6}" y="104" width="22" height="88" rx="3" fill="#b9d4fb" stroke="${INK}" stroke-width="1.8" transform="rotate(14 ${x + 17} 190)"/>
      </g>
      <rect x="0" y="190" width="260" height="16" rx="3" fill="url(#gCream)" stroke="${INK}" stroke-width="2"/>
      <rect x="0" y="204" width="260" height="6" fill="#c8b48e" opacity=".6"/>
      <g class="swing" style="transform-origin:200px 206px">
        <path d="M200 206 L200 238" stroke="#9fb2d6" stroke-width="2.4" stroke-dasharray="2 3" stroke-linecap="round"/>
        ${star(200, 262, 26, 'url(#gBlueClear)')}
        ${sparkle(192, 254, 6)}
      </g>
    `);
  }

  function polaroid(w, h, scene, tape) {
    const ph = h - 32;
    const id = 'pc' + Math.random().toString(36).slice(2, 7);
    const scenes = {
      ocean: `<rect width="${w}" height="${ph}" fill="url(#gSky)"/><rect y="${ph * 0.55}" width="${w}" height="${ph * 0.45}" fill="#3f7fd6"/>
        <path d="M0 ${ph * 0.6}H${w}" stroke="#bfe0ff" stroke-width="2"/>
        ${[0.66, 0.74, 0.84].map((t, i) => `<path d="M${w * 0.3 + i * 6} ${ph * t}h${w * 0.4 - i * 10}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="${0.9 - i * 0.2}"/>`).join('')}
        <circle cx="${w * 0.52}" cy="${ph * 0.42}" r="${w * 0.12}" fill="#fff8d8" opacity=".9"/>${cloud(w * 0.05, ph * 0.12, 0.35)}`,
      sky: `<rect width="${w}" height="${ph}" fill="url(#gSky)"/>${cloud(w * 0.1, ph * 0.25, 0.55)}${cloud(w * 0.45, ph * 0.5, 0.45)}${cloud(w * 0.6, ph * 0.12, 0.3, 0.8)}
        <path d="M0 ${ph}L${w * 0.15} ${ph * 0.82}L${w * 0.3} ${ph * 0.9}L${w * 0.35} ${ph}Z" fill="#4b5f8a" opacity=".5"/>`,
      palms: `<rect width="${w}" height="${ph}" fill="url(#gSky)"/><rect y="${ph * 0.75}" width="${w}" height="${ph * 0.25}" fill="#e9d6a8"/>
        ${[0.25, 0.6, 0.82].map((t, i) => {
          const px = w * t, top = ph * (0.18 + i * 0.08);
          return `<path d="M${px} ${ph * 0.8}Q${px + 4} ${(ph * 0.8 + top) / 2} ${px - 2} ${top}" stroke="#3a3f5c" stroke-width="2.4" fill="none"/>
          <g fill="#2f4a3a">${[-60, -20, 20, 60, 160, 200].map((a) => `<path d="M${px - 2} ${top}q${Math.cos(a * Math.PI / 180) * 10} ${-8 + Math.sin(a * Math.PI / 180) * 4} ${Math.cos(a * Math.PI / 180) * 18} ${4 + Math.abs(Math.sin(a * Math.PI / 180)) * 6}" stroke="#2f4a3a" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('')}</g>`;
        }).join('')}`,
      sunset: `<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4b9a"/><stop offset=".55" stop-color="#c58bb8"/><stop offset="1" stop-color="#f5b98a"/></linearGradient>
        <rect width="${w}" height="${ph}" fill="url(#${id}s)"/>
        <path d="M0 ${ph}V${ph * 0.7}h${w * 0.12}v-${ph * 0.18}h${w * 0.1}v${ph * 0.1}h${w * 0.1}v-${ph * 0.3}h${w * 0.08}v${ph * 0.22}h${w * 0.14}v-${ph * 0.12}h${w * 0.1}v${ph * 0.15}h${w * 0.12}v-${ph * 0.24}h${w * 0.08}v${ph * 0.3}h${w * 0.08}V${ph}Z" fill="#2a2f55"/>
        <circle cx="${w * 0.78}" cy="${ph * 0.2}" r="${w * 0.05}" fill="#fff6d0"/>`,
      flowers: `<rect width="${w}" height="${ph}" fill="url(#gSky)"/>${[[0.25, 0.4, 1], [0.65, 0.3, 0.8], [0.45, 0.72, 1.1], [0.85, 0.75, 0.7], [0.12, 0.85, 0.7]].map(([fx, fy, s]) => {
          const cx = w * fx, cy = ph * fy, r = w * 0.09 * s;
          return `<g>${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="${cx + Math.cos(a * Math.PI / 180) * r}" cy="${cy + Math.sin(a * Math.PI / 180) * r}" rx="${r * 0.7}" ry="${r * 0.45}" transform="rotate(${a} ${cx + Math.cos(a * Math.PI / 180) * r} ${cy + Math.sin(a * Math.PI / 180) * r})" fill="#fff" stroke="#c9d7ef" stroke-width="1"/>`).join('')}<circle cx="${cx}" cy="${cy}" r="${r * 0.45}" fill="#f6cf5a"/></g>`;
        }).join('')}`,
      grass: `<rect width="${w}" height="${ph}" fill="url(#gSky)"/>${cloud(w * 0.15, ph * 0.18, 0.5)}<path d="M0 ${ph * 0.66}Q${w * 0.5} ${ph * 0.52} ${w} ${ph * 0.68}V${ph}H0Z" fill="url(#gGrass)"/>`,
    };
    return `<g filter="url(#fShadow)"><rect width="${w}" height="${h}" rx="3" fill="#fdfbf5" stroke="#d9cfbc" stroke-width="1.5"/></g>
      <svg x="8" y="8" width="${w - 16}" height="${ph - 4}" viewBox="0 0 ${w} ${ph}" preserveAspectRatio="xMidYMid slice">${/\.(png|jpe?g|webp|gif)$/i.test(scene) ? `<image href="${scene}" width="${w}" height="${ph}" preserveAspectRatio="xMidYMid slice"/>` : scenes[scene] || scenes.sky}</svg>
      <rect x="8" y="8" width="${w - 16}" height="${ph - 4}" fill="none" stroke="#c6bba6" stroke-width="1"/>
      ${tape ? `<rect x="${w / 2 - 22}" y="-10" width="44" height="18" fill="${tape}" opacity=".75" transform="rotate(-4 ${w / 2} 0)"/>` : `<circle cx="${w / 2}" cy="6" r="5" fill="#6f95e6" stroke="${INK}" stroke-width="1.5"/><circle cx="${w / 2 - 1.5}" cy="4.5" r="1.5" fill="#fff"/>`}`;
  }
  const polaroidSvg = (w, h, scene, tape) => svg(w, h + 12, `<g transform="translate(0 10)">${polaroid(w, h, scene, tape)}</g>`, 'overflow="visible"');

  function poster(w, h, scene, tapeColor) {
    const id = 'ps' + Math.random().toString(36).slice(2, 7);
    const art = {
      flowers: `<rect width="${w}" height="${h}" fill="#cfe6fb"/>${[[0.2, 0.25, 1.1], [0.62, 0.18, 0.9], [0.4, 0.55, 1.3], [0.82, 0.5, 1], [0.15, 0.8, 0.9], [0.7, 0.85, 1.2]].map(([fx, fy, s]) => {
          const cx = w * fx, cy = h * fy, r = 13 * s;
          return `<g>${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${cx + Math.cos(a * Math.PI / 180) * r}" cy="${cy + Math.sin(a * Math.PI / 180) * r}" rx="${r * 0.75}" ry="${r * 0.5}" transform="rotate(${a} ${cx + Math.cos(a * Math.PI / 180) * r} ${cy + Math.sin(a * Math.PI / 180) * r})" fill="#fff" stroke="#bccde9" stroke-width="1.2"/>`).join('')}<circle cx="${cx}" cy="${cy}" r="${r * 0.5}" fill="#f4c94e" stroke="#d9a73a" stroke-width="1"/></g>`;
        }).join('')}${leaf(w * 0.05, h * 0.5, 22, -20)}${leaf(w * 0.9, h * 0.3, 18, 200, 1)}`,
      city: `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26346f"/><stop offset=".5" stop-color="#7a6db4"/><stop offset=".8" stop-color="#e59bb0"/><stop offset="1" stop-color="#f6c38c"/></linearGradient>
        <rect width="${w}" height="${h}" fill="url(#${id})"/>
        <path d="M${w * 0.8} ${h * 0.1}a14 14 0 1 0 10 22a11 11 0 1 1 -10 -22z" fill="#fff4cc"/>
        ${[[0.1, 0.12], [0.3, 0.2], [0.5, 0.08], [0.62, 0.3], [0.2, 0.35]].map(([x, y]) => `<circle cx="${w * x}" cy="${h * y}" r="1.6" fill="#fff"/>`).join('')}
        <path d="M0 ${h}V${h * 0.62}h18v-20h14v12h12v-40h16v30h12v-16h18v26h14v-50h12v44h16v-22h16v36h14v-14h${w}V${h}Z" fill="#232a55"/>
        ${[[0.12, 0.7], [0.28, 0.58], [0.85, 0.66]].map(([x, y]) => `<g><path d="M${w * x} ${h}Q${w * x + 3} ${h * (y + 1) / 2} ${w * x - 2} ${h * y}" stroke="#141a3a" stroke-width="3" fill="none"/>${[-50, -10, 30, 150, 190, 230].map((a) => `<path d="M${w * x - 2} ${h * y}q${Math.cos(a * Math.PI / 180) * 12} -6 ${Math.cos(a * Math.PI / 180) * 22} ${6 + Math.abs(Math.sin(a * Math.PI / 180)) * 6}" stroke="#141a3a" stroke-width="3.4" fill="none" stroke-linecap="round"/>`).join('')}</g>`).join('')}`,
      beach: `<rect width="${w}" height="${h}" fill="url(#gSky)"/>${cloud(w * 0.1, h * 0.15, 0.6)}${cloud(w * 0.55, h * 0.3, 0.4)}<rect y="${h * 0.6}" width="${w}" height="${h * 0.15}" fill="#4f8fe3"/><rect y="${h * 0.75}" width="${w}" height="${h * 0.25}" fill="#ecdcb0"/><path d="M0 ${h * 0.75}Q${w * 0.25} ${h * 0.72} ${w * 0.5} ${h * 0.76}T${w} ${h * 0.75}" stroke="#fff" stroke-width="3" fill="none"/>`,
    };
    return svg(w, h + 14, `<g transform="translate(0 8)"><g filter="url(#fShadow)"><rect width="${w}" height="${h}" fill="#fff"/></g>
      <svg x="6" y="6" width="${w - 12}" height="${h - 12}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${art[scene]}</svg>
      <rect x="${w / 2 - 26}" y="-10" width="52" height="18" fill="${tapeColor || '#a9c6f2'}" opacity=".8" transform="rotate(3 ${w / 2} 0)"/></g>`, 'overflow="visible"');
  }

  function vinesLeft() {
    return svg(300, 470, `
      <g class="vine v1" style="transform-origin:40px 0">${vine(40, -10, 440, 40, 13, 3)}</g>
      <g class="vine v2" style="transform-origin:120px 0">${vine(120, -10, 300, -30, 9, 7)}</g>
      <g class="vine v3" style="transform-origin:200px 0">${vine(200, -10, 200, 26, 6, 11)}</g>
    `, 'overflow="visible"');
  }

  function shelfPlant() {
    return svg(300, 420, `
      <g class="vine v1" style="transform-origin:110px 120px">${vine(110, 110, 290, -36, 10, 5)}</g>
      <g class="vine v2" style="transform-origin:190px 120px">${vine(190, 110, 220, 30, 8, 9)}</g>
      <g class="vine v3" style="transform-origin:150px 120px">${vine(150, 110, 150, 12, 5, 2)}</g>
      <g>${leaf(150, 70, 34, -110)}${leaf(150, 70, 30, -60, 1)}${leaf(150, 72, 28, -160, 1)}${leaf(150, 75, 26, -20)}</g>
      <path d="M100 74H200L190 128H110Z" fill="url(#gCream)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
      <rect x="96" y="68" width="108" height="12" rx="3" fill="#f7efdc" stroke="${INK}" stroke-width="2"/>
      ${heart(150, 100, 10, '#7fa6ea')}
      <rect x="20" y="128" width="260" height="14" rx="3" fill="url(#gCream)" stroke="${INK}" stroke-width="2"/>
    `, 'overflow="visible"');
  }

  // ------------------------------------------------------------ left side of desk
  function lamp() {
    return svg(220, 330, `
      <g class="lamp-glow" opacity="0"><ellipse cx="120" cy="250" rx="160" ry="90" fill="url(#gGlow)"/></g>
      <ellipse cx="96" cy="312" rx="78" ry="14" fill="#5b4220" opacity=".18"/>
      <path d="M40 300Q40 280 96 278Q152 280 152 300Q152 314 96 316Q40 314 40 300Z" fill="url(#gBlueDeep)" stroke="${INK}" stroke-width="2.2"/>
      <ellipse cx="96" cy="292" rx="46" ry="9" fill="#a9c6f5" opacity=".7"/>
      <path d="M92 290L100 160" stroke="${INK}" stroke-width="15" stroke-linecap="round"/>
      <path d="M92 290L100 160" stroke="#f5ecd8" stroke-width="10" stroke-linecap="round"/>
      <circle cx="100" cy="160" r="11" fill="url(#gBlueDeep)" stroke="${INK}" stroke-width="2"/>
      <g class="lamp-head" style="transform-origin:100px 160px">
        <path d="M100 160L118 118" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>
        <path d="M100 160L118 118" stroke="#f5ecd8" stroke-width="8" stroke-linecap="round"/>
        <path d="M8 108Q20 22 110 18Q196 22 208 108Q208 120 108 122Q8 120 8 108Z" fill="url(#gBlueDeep)" stroke="${INK}" stroke-width="2.4"/>
        <path d="M34 70Q50 36 98 30" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55"/>
        <ellipse cx="108" cy="112" rx="94" ry="12" fill="#ffeeb8" stroke="${INK}" stroke-width="2"/>
        <ellipse class="bulb" cx="108" cy="114" rx="40" ry="7" fill="url(#gBulb)"/>
      </g>
    `, 'overflow="visible"');
  }

  function pencilCup(variant) {
    const blue = variant === 'mesh';
    const pens = [[-14, '#3d63c4', 70], [-4, '#f4ecdd', 84], [8, '#7fa6ea', 76], [16, '#2b3a67', 64], [-22, '#cfe0fb', 58]];
    return svg(120, 190, `
      ${pens.map(([a, c, l], i) => `<g transform="rotate(${a} 60 120)"><rect x="${50 + i * 4}" y="${110 - l}" width="9" height="${l + 20}" rx="3" fill="${c}" stroke="${INK}" stroke-width="1.6"/><path d="M${50 + i * 4} ${110 - l}l4.5 -10l4.5 10z" fill="${i % 2 ? '#2b3a67' : '#f0d9a8'}" stroke="${INK}" stroke-width="1.2"/></g>`).join('')}
      ${blue
        ? `<path d="M22 100H98L92 182H28Z" fill="url(#pMesh)" stroke="#3d63c4" stroke-width="2.6"/><path d="M22 100H98" stroke="#3d63c4" stroke-width="5"/><path d="M26 176H94" stroke="#3d63c4" stroke-width="4"/>`
        : `<path d="M22 100H98L94 180Q60 188 26 180Z" fill="url(#gCream)" stroke="${INK}" stroke-width="2.2"/>${pixelHeart(44, 124, 4.6, '#7fa6ea')}`}
      ${blue ? `<g class="swing" style="transform-origin:96px 104px"><path d="M96 104v24" stroke="#9fb2d6" stroke-width="2" stroke-dasharray="2 3"/>${star(96, 142, 15, '#f7efdc')}</g>` : ''}
    `, 'overflow="visible"');
  }

  function caseStack() {
    // upright CD / cassette cases behind the headphones
    let s = '';
    const n = 9;
    for (let i = 0; i < n; i++) {
      const x = i * 22, h = 150 + ((i * 17) % 34);
      const c = i % 3 === 0 ? '#e9e2d3' : i % 3 === 1 ? '#c9dbf7' : '#f4efe4';
      s += `<rect x="${x}" y="${190 - h}" width="20" height="${h}" rx="2" fill="${c}" stroke="${INK}" stroke-width="1.6"/>
        <rect x="${x + 4}" y="${190 - h + 10}" width="12" height="${h * 0.35}" fill="#7fa6ea" opacity="${0.35 + (i % 2) * 0.3}"/>
        <rect x="${x + 4}" y="${190 - h * 0.4}" width="12" height="4" fill="${INK}" opacity=".3"/>`;
    }
    return svg(200, 200, s + `<rect x="-6" y="188" width="210" height="8" rx="3" fill="#cbb084" opacity=".5"/>`);
  }

  function headphones() {
    return svg(270, 200, `
      <path d="M44 128Q36 18 135 14Q234 18 226 128" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>
      <path d="M44 128Q36 18 135 14Q234 18 226 128" fill="none" stroke="#f4ecdb" stroke-width="16" stroke-linecap="round"/>
      <path d="M70 60Q100 30 135 28" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
      <g class="cup cup-l">
        <ellipse cx="54" cy="140" rx="46" ry="52" fill="url(#gNavy)" stroke="${INK}" stroke-width="2.4"/>
        <ellipse cx="66" cy="140" rx="40" ry="48" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="2.4"/>
        <ellipse cx="66" cy="140" rx="26" ry="32" fill="#c6dcfb" opacity=".6" stroke="#5c83d6" stroke-width="1.5"/>
        <circle cx="66" cy="140" r="9" fill="url(#gChrome)" stroke="${INK}" stroke-width="1.5"/>
        <path d="M44 112Q54 100 70 102" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
      </g>
      <g class="cup cup-r">
        <ellipse cx="216" cy="140" rx="46" ry="52" fill="url(#gNavy)" stroke="${INK}" stroke-width="2.4"/>
        <ellipse cx="204" cy="140" rx="40" ry="48" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="2.4"/>
        <ellipse cx="204" cy="140" rx="26" ry="32" fill="#c6dcfb" opacity=".6" stroke="#5c83d6" stroke-width="1.5"/>
        <circle cx="204" cy="140" r="9" fill="url(#gChrome)" stroke="${INK}" stroke-width="1.5"/>
        <path d="M184 112Q194 100 210 102" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
      </g>
      <path d="M60 192Q90 220 150 210" stroke="#d9d2c2" stroke-width="3" fill="none"/>
    `, 'overflow="visible"');
  }

  /** Portable CD player. Parts: .lid (hinges at the back), .disc (spins), .disc-wrap (lifts out). */
  function discman() {
    return svg(360, 200, `
      <ellipse cx="180" cy="176" rx="170" ry="22" fill="#5b4220" opacity=".2"/>
      <path d="M14 112Q14 168 180 172Q346 168 346 112L346 100L14 100Z" fill="url(#gNavy)" stroke="${INK}" stroke-width="2.4"/>
      <path d="M22 136Q180 160 338 136" stroke="#8fa8e6" stroke-width="2" fill="none" opacity=".7"/>
      <g class="btns">
        ${[0, 1, 2, 3].map((i) => `<rect class="btn" x="${236 + i * 22}" y="142" width="18" height="10" rx="4" fill="url(#gChrome)" stroke="${INK}" stroke-width="1.4"/>`).join('')}
        <rect x="70" y="140" width="64" height="16" rx="3" fill="#1d2652" stroke="${INK}" stroke-width="1.4"/>
        <text class="lcd-text" x="102" y="152" font-family="Pixelify Sans, monospace" font-size="10" fill="#8ff0ff" text-anchor="middle">01 00:00</text>
      </g>
      <path d="M330 120Q362 128 352 158" stroke="#d9d2c2" stroke-width="3" fill="none"/>
      <!-- tray -->
      <ellipse cx="180" cy="100" rx="166" ry="62" fill="#1c2a66" stroke="${INK}" stroke-width="2.2"/>
      <ellipse cx="180" cy="100" rx="150" ry="52" fill="#2b3c88"/>
      <g class="disc-wrap">
        <!-- the disc is a real circle squashed into perspective, so spinning .disc-spin looks right -->
        <g transform="translate(180 100) scale(1 .344)">
          <g class="disc-spin">
            <circle r="128" fill="url(#gCD)" stroke="#9aa7c4" stroke-width="3"/>
            <circle r="128" fill="url(#gCDShine)"/>
            <path d="M-90 -60A110 110 0 0 1 10 -112" stroke="#fff" stroke-width="12" fill="none" opacity=".7" stroke-linecap="round"/>
            <path d="M90 60A110 110 0 0 1 -10 112" stroke="#fff" stroke-width="8" fill="none" opacity=".45" stroke-linecap="round"/>
            <circle r="32" fill="#e8edf6" stroke="#9aa7c4" stroke-width="2.5"/>
            <circle r="11" fill="#2b3c88"/>
            <path d="${starPath(62, 34, 16, 0.5)}" fill="#7fa6ea"/>
          </g>
        </g>
      </g>
      <!-- lid (hinged at the back edge, y≈44) -->
      <g class="lid" style="transform-origin:180px 46px">
        <ellipse cx="180" cy="98" rx="168" ry="64" fill="url(#gBlueDeep)" stroke="${INK}" stroke-width="2.6"/>
        <ellipse cx="180" cy="98" rx="168" ry="64" fill="url(#pDots)" opacity=".5"/>
        <ellipse cx="180" cy="96" rx="120" ry="40" fill="none" stroke="#a9c3f5" stroke-width="2" opacity=".6"/>
        <ellipse cx="180" cy="96" rx="30" ry="12" fill="url(#gChrome)" stroke="${INK}" stroke-width="1.8"/>
        <ellipse cx="180" cy="94" rx="10" ry="4" fill="#fff" opacity=".8"/>
        <path d="M40 74Q90 42 170 38" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55"/>
        <path d="M260 140Q300 128 320 108" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".35"/>
        <text x="286" y="80" font-family="Pixelify Sans, monospace" font-size="11" fill="#dce8ff" opacity=".8">ESP</text>
      </g>
    `, 'overflow="visible"');
  }

  function cdStackSmall() {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += `<g transform="translate(${i * 3} ${-i * 15}) rotate(${(i % 2 ? 3 : -2)} 70 120)">
        <rect x="6" y="100" width="130" height="16" rx="2" fill="#e9eef7" stroke="${INK}" stroke-width="1.6"/>
        <rect x="6" y="100" width="130" height="5" fill="#fff" opacity=".7"/>
        <rect x="10" y="108" width="40" height="5" fill="#7fa6ea" opacity=".7"/></g>`;
    }
    return svg(150, 130, s);
  }

  /** Spiral notebook (flat on the desk; the scene tilts it in 3D). Parts: .cover */
  function notebook() {
    let rings = '';
    for (let i = 0; i < 11; i++) rings += `<rect x="${14 + i * 30}" y="0" width="8" height="26" rx="4" fill="url(#gChrome)" stroke="${INK}" stroke-width="1.5"/>`;
    return svg(360, 250, `
      <rect x="10" y="20" width="340" height="226" rx="8" fill="#5b4220" opacity=".15" transform="translate(6 8)"/>
      <rect x="6" y="14" width="344" height="228" rx="8" fill="#f9f6ef" stroke="${INK}" stroke-width="2"/>
      <g class="cover">
        <rect x="4" y="12" width="344" height="228" rx="8" fill="#fbfaf4" stroke="${INK}" stroke-width="2.2"/>
        <rect x="4" y="12" width="344" height="228" rx="8" fill="url(#pGrid)" opacity=".5"/>
        ${heart(90, 90, 20, '#9cc0f5')}${heart(290, 70, 13, '#cfe0fb')}${heart(240, 190, 16, '#7fa6ea')}
        ${star(60, 180, 16, '#cfe0fb')}${star(170, 120, 22, 'url(#gBlueClear)')}${star(310, 160, 12, '#9cc0f5')}
        ${heart(140, 200, 9, '#cfe0fb')}${star(220, 60, 10, '#e9f1ff')}
        <rect x="200" y="96" width="110" height="40" rx="5" fill="#fff" stroke="${INK}" stroke-width="1.5"/>
        <text x="255" y="122" font-family="Gaegu, cursive" font-size="20" font-weight="700" fill="${INK}" text-anchor="middle">about me</text>
      </g>
      ${rings}
    `, 'overflow="visible"');
  }

  function pen() {
    return svg(240, 40, `
      <g transform="rotate(0)">
        <rect x="30" y="10" width="180" height="20" rx="10" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="2"/>
        <rect x="40" y="13" width="150" height="5" rx="2.5" fill="#fff" opacity=".6"/>
        <path d="M30 12L4 20L30 28Z" fill="#f2ead9" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M10 18L4 20L10 22Z" fill="${INK}"/>
        <rect x="190" y="6" width="40" height="28" rx="8" fill="url(#gBlueDeep)" stroke="${INK}" stroke-width="2"/>
        <rect x="150" y="2" width="60" height="7" rx="3.5" fill="url(#gChrome)" stroke="${INK}" stroke-width="1.5"/>
      </g>`, 'overflow="visible"');
  }

  function watch() {
    return svg(150, 220, `
      ${[0, 1, 2, 3].map((i) => `<rect x="44" y="${2 + i * 18}" width="62" height="16" rx="5" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="1.6"/>`).join('')}
      ${[0, 1, 2, 3].map((i) => `<rect x="44" y="${150 + i * 18}" width="62" height="16" rx="5" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="1.6"/>`).join('')}
      <rect x="22" y="70" width="106" height="86" rx="18" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="2.4"/>
      <rect x="22" y="70" width="106" height="86" rx="18" fill="url(#pDots)" opacity=".4"/>
      <rect x="36" y="84" width="78" height="56" rx="8" fill="url(#gLcd)" stroke="${INK}" stroke-width="1.8"/>
      <text class="watch-time" x="75" y="118" font-family="Pixelify Sans, monospace" font-size="21" fill="#2f3a35" text-anchor="middle">12:00</text>
      <text class="watch-date" x="75" y="133" font-family="Pixelify Sans, monospace" font-size="9" fill="#2f3a35" text-anchor="middle" opacity=".7">MON</text>
      ${[0, 1].map((i) => `<rect x="${12 + i * 118}" y="${92 + 0}" width="8" height="16" rx="3" fill="url(#gChrome)" stroke="${INK}" stroke-width="1.3"/>`).join('')}
      <path d="M32 82Q50 74 80 76" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>
    `, 'overflow="visible"');
  }

  /** Flip phone. Parts: .top (hinged at the middle), .screen-glow */
  function flipPhone() {
    let keys = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) keys += `<rect x="${24 + c * 26}" y="${198 + r * 17}" width="22" height="13" rx="6" fill="#e7eefc" stroke="${INK}" stroke-width="1.2"/>`;
    return svg(130, 290, `
      <g class="bottom">
        <path d="M14 170Q14 160 24 160H106Q116 160 116 170L112 276Q112 286 100 286H30Q18 286 18 276Z" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="2.2"/>
        <circle cx="65" cy="180" r="13" fill="url(#gChrome)" stroke="${INK}" stroke-width="1.6"/>
        <circle cx="65" cy="180" r="5" fill="#9cb7e8"/>
        <rect x="24" y="174" width="18" height="11" rx="5" fill="#cf5f72" opacity=".85" stroke="${INK}" stroke-width="1.1"/>
        <rect x="88" y="174" width="18" height="11" rx="5" fill="#6fbf7a" opacity=".85" stroke="${INK}" stroke-width="1.1"/>
        ${keys}
      </g>
      <rect x="22" y="152" width="86" height="14" rx="6" fill="url(#gBlueDeep)" stroke="${INK}" stroke-width="1.8"/>
      <g class="top" style="transform-origin:65px 158px">
        <path d="M18 18Q18 4 34 4H96Q112 4 112 18L110 150Q110 158 100 158H30Q20 158 20 150Z" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="2.2"/>
        <rect x="50" y="12" width="30" height="5" rx="2.5" fill="${INK}" opacity=".5"/>
        <rect x="28" y="26" width="74" height="104" rx="6" fill="#20306a" stroke="${INK}" stroke-width="1.8"/>
        <rect class="screen-glow" x="32" y="30" width="66" height="96" rx="4" fill="#dbe9ff"/>
        ${pixelHeart(43, 58, 6.4, '#5f86de')}
        <rect x="36" y="34" width="58" height="7" fill="#9cb7e8"/>
        <path d="M24 30Q26 14 50 10" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>
      </g>
    `, 'overflow="visible"');
  }

  /** Clear-blue handheld console. Parts: .lcd, .pet, .btn-a, .btn-b */
  function gameboy() {
    return svg(180, 280, `
      <path d="M10 22Q10 6 26 6H154Q170 6 170 22V230Q170 272 128 272H26Q10 272 10 256Z" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="2.4"/>
      <path d="M10 22Q10 6 26 6H154Q170 6 170 22V230Q170 272 128 272H26Q10 272 10 256Z" fill="url(#pDots)" opacity=".35"/>
      <path d="M24 16Q60 10 120 12" stroke="#fff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>
      <g opacity=".35" stroke="#2a4fae" stroke-width="1.2" fill="none"><path d="M40 150h30M50 160h40M120 200l20 10M30 230q20 10 40 0"/><circle cx="80" cy="240" r="6"/></g>
      <rect x="26" y="24" width="128" height="104" rx="8" fill="#344a8f" stroke="${INK}" stroke-width="2"/>
      <rect class="lcd" x="40" y="34" width="100" height="80" rx="3" fill="url(#gLcd)"/>
      <g class="pet">${pixelCat(70, 56, 5.5, '#3b4a3c')}</g>
      <g class="lcd-hearts" opacity="0">${pixelHeart(48, 40, 2.5, '#3b4a3c')}${pixelHeart(116, 44, 2.5, '#3b4a3c')}</g>
      <text x="90" y="110" font-family="Pixelify Sans, monospace" font-size="8" fill="#3b4a3c" text-anchor="middle">♥ ♥ ♥</text>
      <circle cx="34" cy="64" r="3" fill="#e36a7a"/>
      <!-- d-pad -->
      <g transform="translate(50 178)"><path d="M-8 -26H8V-8H26V8H8V26H-8V8H-26V-8H-8Z" fill="#2b3a67" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><circle r="5" fill="#3e4f86"/></g>
      <circle class="btn-b" cx="118" cy="190" r="13" fill="#2b3a67" stroke="${INK}" stroke-width="1.6"/>
      <circle class="btn-a" cx="146" cy="172" r="13" fill="#2b3a67" stroke="${INK}" stroke-width="1.6"/>
      <text x="118" y="214" font-size="9" font-family="Pixelify Sans, monospace" fill="${INK}" text-anchor="middle">B</text>
      <text x="146" y="196" font-size="9" font-family="Pixelify Sans, monospace" fill="${INK}" text-anchor="middle">A</text>
      <rect x="62" y="226" width="22" height="7" rx="3.5" fill="#2b3a67" transform="rotate(-20 73 230)"/>
      <rect x="92" y="226" width="22" height="7" rx="3.5" fill="#2b3a67" transform="rotate(-20 103 230)"/>
      <g opacity=".6">${[0, 1, 2, 3, 4].map((i) => `<rect x="${124 + i * 7}" y="236" width="3" height="22" rx="1.5" fill="#2a4fae" transform="rotate(-25 130 245)"/>`).join('')}</g>
    `, 'overflow="visible"');
  }

  /** Egg-shaped virtual pet. Parts: .pet, .hearts */
  function tamagotchi() {
    return svg(180, 170, `
      <path d="M150 40Q165 30 172 50" stroke="#a8b6d3" stroke-width="3" stroke-dasharray="3 4" fill="none" stroke-linecap="round"/>
      <g class="swing" style="transform-origin:172px 52px"><path d="M172 52v18" stroke="#a8b6d3" stroke-width="3" stroke-dasharray="3 4" stroke-linecap="round"/>${star(172, 86, 15, '#cfe0fb')}</g>
      <path d="M78 10C120 10 146 46 146 88C146 132 116 160 78 160C40 160 10 132 10 88C10 46 36 10 78 10Z" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="2.4"/>
      <path d="M78 10C120 10 146 46 146 88C146 132 116 160 78 160C40 160 10 132 10 88C10 46 36 10 78 10Z" fill="url(#pDots)" opacity=".45"/>
      <path d="M36 40Q52 20 76 18" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>
      <rect x="40" y="52" width="76" height="62" rx="10" fill="#f6f2e7" stroke="${INK}" stroke-width="1.8"/>
      <rect x="48" y="60" width="60" height="46" rx="3" fill="url(#gLcd)"/>
      <g class="pet">${pixelCat(64, 68, 4, '#3b4a3c')}</g>
      <g class="hearts" opacity="0">${pixelHeart(52, 62, 2, '#3b4a3c')}${pixelHeart(92, 62, 2, '#3b4a3c')}</g>
      ${[0, 1, 2].map((i) => `<circle class="t-btn" cx="${56 + i * 22}" cy="${134 - (i === 1 ? -4 : 0)}" r="7" fill="url(#gBlueDeep)" stroke="${INK}" stroke-width="1.5"/>`).join('')}
    `, 'overflow="visible"');
  }

  function usb() {
    return svg(130, 50, `<rect x="30" y="8" width="90" height="34" rx="10" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="2"/><rect x="40" y="14" width="60" height="6" rx="3" fill="#fff" opacity=".6"/><rect x="4" y="14" width="30" height="22" rx="2" fill="url(#gChrome)" stroke="${INK}" stroke-width="1.8"/><rect x="10" y="19" width="6" height="5" fill="${INK}" opacity=".5"/><rect x="20" y="19" width="6" height="5" fill="${INK}" opacity=".5"/>`);
  }
  function sdcard() {
    return svg(70, 70, `<path d="M8 6H46L62 22V62Q62 66 58 66H12Q8 66 8 62Z" fill="#2c3f86" stroke="${INK}" stroke-width="2"/><rect x="14" y="30" width="42" height="26" rx="2" fill="#dfe7f6"/><text x="35" y="47" font-size="10" font-family="Pixelify Sans, monospace" fill="${INK}" text-anchor="middle">SD</text>${[0, 1, 2, 3].map((i) => `<rect x="${14 + i * 8}" y="10" width="5" height="12" fill="#f2c96a"/>`).join('')}`);
  }

  function smallPlant() {
    return svg(130, 170, `
      ${leaf(65, 96, 34, -100)}${leaf(65, 96, 30, -50, 1)}${leaf(65, 96, 30, -150, 1)}${leaf(65, 98, 28, -10)}${leaf(65, 98, 26, -175)}${leaf(65, 90, 24, -75, 1)}
      <path d="M28 96H102L94 160H36Z" fill="url(#gCream)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
      ${heart(65, 128, 11, '#7fa6ea')}
    `, 'overflow="visible"');
  }

  // ------------------------------------------------------------ the computer
  /** CRT monitor. Parts: .screen (clip group), .clouds, .cursor, .icon, .power-led */
  function monitor() {
    const icon = (x, y, kind, label) => {
      const shapes = {
        folder: `<path d="M0 6Q0 2 4 2H14L18 7H36Q40 7 40 11V30Q40 34 36 34H4Q0 34 0 30Z" fill="#f2cf68" stroke="#8a6a1f" stroke-width="1.6"/><path d="M0 13H40" stroke="#c99f39" stroke-width="1.4"/>`,
        globe: `<circle cx="20" cy="18" r="16" fill="#cfe6ff" stroke="${INK}" stroke-width="1.6"/><ellipse cx="20" cy="18" rx="7" ry="16" fill="none" stroke="${INK}" stroke-width="1.3"/><path d="M4 18H36M7 9H33M7 27H33" stroke="${INK}" stroke-width="1.2"/>`,
        music: `<path d="M14 6L34 2V26" stroke="#2b3a67" stroke-width="3" fill="none"/><path d="M14 6V30" stroke="#2b3a67" stroke-width="3"/><ellipse cx="10" cy="30" rx="6" ry="4.5" fill="#2b3a67"/><ellipse cx="30" cy="26" rx="6" ry="4.5" fill="#2b3a67"/>`,
        note: `<rect x="4" y="0" width="30" height="36" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.5"/><path d="M10 10H28M10 17H28M10 24H22" stroke="#7fa6ea" stroke-width="2"/>`,
      };
      return `<g class="icon" data-icon="${kind}" transform="translate(${x} ${y})">${shapes[kind]}<text x="20" y="48" font-family="Pixelify Sans, monospace" font-size="10" fill="#fff" text-anchor="middle" style="paint-order:stroke" stroke="#2b3a67" stroke-width="2.4">${label}</text></g>`;
    };
    return svg(500, 500, `
      <ellipse cx="250" cy="484" rx="200" ry="16" fill="#5b4220" opacity=".2"/>
      <!-- back of the CRT -->
      <path d="M86 40L414 40L440 330L60 330Z" fill="url(#gCreamSide)" stroke="${INK}" stroke-width="2.2" transform="translate(0 6)"/>
      <!-- stand -->
      <path d="M180 410H320L340 470H160Z" fill="url(#gCream)" stroke="${INK}" stroke-width="2.2"/>
      <!-- front bezel -->
      <rect x="20" y="20" width="460" height="400" rx="26" fill="url(#gCream)" stroke="${INK}" stroke-width="2.6"/>
      <rect x="28" y="26" width="444" height="12" rx="6" fill="#fff" opacity=".45"/>
      <rect x="44" y="40" width="412" height="314" rx="22" fill="#d8c9a8" stroke="${INK}" stroke-width="2"/>
      <!-- screen -->
      <clipPath id="screenClip"><rect x="58" y="52" width="384" height="290" rx="20"/></clipPath>
      <g class="screen" clip-path="url(#screenClip)">
        <rect x="58" y="52" width="384" height="290" fill="url(#gSky)"/>
        <g class="clouds">${cloud(80, 90, 0.9)}${cloud(250, 70, 1.2)}${cloud(370, 140, 0.8, 0.9)}${cloud(160, 170, 0.6, 0.8)}${cloud(470, 90, 1, 0.9)}${cloud(-60, 140, 0.7)}</g>
        <path d="M58 270Q180 236 300 252Q380 258 442 240V342H58Z" fill="url(#gGrass)"/>
        <path d="M58 290Q200 264 442 280" stroke="#c4e68f" stroke-width="3" fill="none" opacity=".6"/>
        <g class="tree" transform="translate(330 222)"><circle cx="0" cy="0" r="16" fill="#5a9a43"/><circle cx="14" cy="4" r="12" fill="#6aac4c"/><circle cx="-12" cy="6" r="11" fill="#4f8a3c"/></g>
        ${icon(80, 66, 'folder', 'projects')}${icon(80, 130, 'globe', 'internet')}${icon(80, 194, 'folder', 'stuff')}${icon(80, 256, 'music', 'mixtape')}
        <g class="cursor" transform="translate(250 180)"><path d="M0 0V22L6 16L10 26L14 24L10 14H18Z" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/></g>
        <rect class="scan" x="58" y="52" width="384" height="290" fill="url(#pLines)" opacity=".18"/>
        <rect class="flash" x="58" y="52" width="384" height="290" fill="#fff" opacity="0"/>
        <path d="M70 70Q130 58 200 60" stroke="#fff" stroke-width="10" fill="none" opacity=".18" stroke-linecap="round"/>
      </g>
      <rect x="58" y="52" width="384" height="290" rx="20" fill="none" stroke="${INK}" stroke-width="2"/>
      <!-- bottom controls -->
      ${[0, 1, 2, 3].map((i) => `<circle cx="${190 + i * 26}" cy="386" r="7" fill="#e8dcc2" stroke="${INK}" stroke-width="1.6"/>`).join('')}
      <circle class="power-led" cx="420" cy="386" r="5" fill="#7fe08c" stroke="${INK}" stroke-width="1.3"/>
      ${heart(352, 386, 9, '#7fa6ea')}
      ${star(40, 210, 10, '#cfe0fb')}${heart(36, 250, 7, '#9cc0f5')}${star(466, 120, 9, '#9cc0f5')}
    `, 'overflow="visible"');
  }

  function stickyNote() {
    return svg(90, 90, `<g filter="url(#fShadow)"><path d="M4 4H86V74L70 86H4Z" fill="#fbecb3" stroke="#d9c47a" stroke-width="1.5"/></g><path d="M70 86V74H86" fill="#e8d58d"/>${heart(45, 46, 18, 'none')}<path d="${heartPath(45, 46, 18)}" fill="none" stroke="${INK}" stroke-width="2.4"/>`, 'overflow="visible"');
  }

  /** Point-and-shoot camera. Parts: .flash-bulb, .lens-glass */
  function camera() {
    return svg(190, 130, `
      <rect x="10" y="22" width="170" height="100" rx="14" fill="url(#gChrome)" stroke="${INK}" stroke-width="2.4"/>
      <rect x="10" y="22" width="56" height="100" rx="14" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="2.2"/>
      <rect x="120" y="10" width="40" height="16" rx="5" fill="url(#gChrome)" stroke="${INK}" stroke-width="2"/>
      <rect class="flash-bulb" x="20" y="34" width="34" height="18" rx="4" fill="#fbfbff" stroke="${INK}" stroke-width="1.6"/>
      <circle cx="110" cy="74" r="38" fill="#cfd8e6" stroke="${INK}" stroke-width="2.2"/>
      <circle cx="110" cy="74" r="28" fill="#4a5674" stroke="${INK}" stroke-width="2"/>
      <circle class="lens-glass" cx="110" cy="74" r="18" fill="#1b2340"/>
      <circle cx="102" cy="66" r="6" fill="#fff" opacity=".7"/><circle cx="117" cy="82" r="3" fill="#8fb6ff" opacity=".7"/>
      ${heart(36, 96, 9, '#cfe0fb')}${star(160, 46, 7, '#7fa6ea')}
      <path d="M20 28Q60 24 100 26" stroke="#fff" stroke-width="3" fill="none" opacity=".8" stroke-linecap="round"/>
      <g class="swing" style="transform-origin:176px 108px"><path d="M176 108q4 20 -4 34" stroke="#a8b6d3" stroke-width="3" stroke-dasharray="3 4" fill="none" stroke-linecap="round"/>${star(170, 160, 18, 'url(#gBlueClear)')}</g>
    `, 'overflow="visible"');
  }

  function gummyBear(color) {
    const c = color || '#9cc0f5';
    return svg(90, 110, `
      <g class="bear" style="transform-origin:45px 108px">
        <circle cx="22" cy="18" r="11" fill="${c}" stroke="#3d63c4" stroke-width="1.6" opacity=".95"/>
        <circle cx="68" cy="18" r="11" fill="${c}" stroke="#3d63c4" stroke-width="1.6" opacity=".95"/>
        <ellipse cx="45" cy="36" rx="28" ry="24" fill="${c}" stroke="#3d63c4" stroke-width="1.8" opacity=".95"/>
        <ellipse cx="45" cy="80" rx="30" ry="28" fill="${c}" stroke="#3d63c4" stroke-width="1.8" opacity=".95"/>
        <ellipse cx="18" cy="70" rx="9" ry="13" fill="${c}" stroke="#3d63c4" stroke-width="1.6" transform="rotate(30 18 70)"/>
        <ellipse cx="72" cy="70" rx="9" ry="13" fill="${c}" stroke="#3d63c4" stroke-width="1.6" transform="rotate(-30 72 70)"/>
        <ellipse cx="28" cy="102" rx="12" ry="8" fill="${c}" stroke="#3d63c4" stroke-width="1.6"/>
        <ellipse cx="62" cy="102" rx="12" ry="8" fill="${c}" stroke="#3d63c4" stroke-width="1.6"/>
        <circle cx="36" cy="34" r="2.6" fill="#2b3a67"/><circle cx="54" cy="34" r="2.6" fill="#2b3a67"/>
        <path d="M40 43Q45 47 50 43" stroke="#2b3a67" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <ellipse cx="32" cy="24" rx="7" ry="4" fill="#fff" opacity=".7"/>
        <ellipse cx="32" cy="66" rx="8" ry="10" fill="#fff" opacity=".35"/>
      </g>`, 'overflow="visible"');
  }

  function tower() {
    return svg(220, 430, `
      <ellipse cx="110" cy="418" rx="110" ry="14" fill="#5b4220" opacity=".2"/>
      <rect x="10" y="10" width="200" height="404" rx="10" fill="url(#gCream)" stroke="${INK}" stroke-width="2.4"/>
      <rect x="18" y="16" width="184" height="8" rx="4" fill="#fff" opacity=".5"/>
      <rect x="30" y="40" width="160" height="34" rx="4" fill="#efe5cf" stroke="${INK}" stroke-width="1.8"/>
      <rect x="44" y="54" width="110" height="5" rx="2.5" fill="${INK}" opacity=".6"/>
      <rect x="164" y="52" width="14" height="9" rx="2" fill="#e5d8bb" stroke="${INK}" stroke-width="1.2"/>
      <rect x="30" y="84" width="160" height="34" rx="4" fill="#efe5cf" stroke="${INK}" stroke-width="1.8"/>
      <rect x="44" y="98" width="110" height="5" rx="2.5" fill="${INK}" opacity=".6"/>
      <rect x="128" y="132" width="62" height="22" rx="3" fill="#efe5cf" stroke="${INK}" stroke-width="1.6"/>
      <rect x="136" y="141" width="46" height="4" fill="${INK}" opacity=".6"/>
      ${heart(60, 160, 14, '#9cc0f5')}${star(160, 200, 14, '#cfe0fb')}${heart(50, 240, 10, '#cfe0fb')}${heart(110, 210, 11, '#7fa6ea')}
      <g transform="rotate(-6 100 300)"><rect x="56" y="250" width="88" height="104" fill="#fff" stroke="#d7cdb8" stroke-width="1.5"/>
        <svg x="62" y="256" width="76" height="76" viewBox="0 0 76 76"><rect width="76" height="76" fill="url(#gSky)"/>${cloud(6, 10, 0.4)}<path d="M0 60Q38 48 76 58V76H0Z" fill="#e9d6a8"/><path d="M50 70Q52 50 48 36" stroke="#2f4a3a" stroke-width="2"/><path d="M48 36q-10 -2 -16 6M48 36q10 -4 16 4M48 36q-4 -8 -12 -8M48 36q6 -8 14 -6" stroke="#2f4a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>
        <rect x="80" y="244" width="40" height="12" fill="#a9c6f2" opacity=".8"/></g>
      ${star(40, 370, 12, '#9cc0f5')}
      <rect x="168" y="360" width="22" height="34" rx="3" fill="#efe5cf" stroke="${INK}" stroke-width="1.5"/>
      <circle class="power-led" cx="179" cy="384" r="4" fill="#7fe08c"/>
    `, 'overflow="visible"');
  }

  /** Little clear-blue CRT TV. Parts: .tv-screen, .tv-channel */
  function tv() {
    return svg(190, 160, `
      <ellipse cx="96" cy="152" rx="80" ry="8" fill="#5b4220" opacity=".18"/>
      <path d="M140 20L178 32L180 132L140 140Z" fill="url(#gBlueDeep)" stroke="${INK}" stroke-width="2"/>
      <rect x="8" y="12" width="140" height="132" rx="20" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="2.4"/>
      <rect x="8" y="12" width="140" height="132" rx="20" fill="url(#pDots)" opacity=".45"/>
      <clipPath id="tvClip"><rect x="22" y="26" width="112" height="94" rx="14"/></clipPath>
      <g class="tv-screen" clip-path="url(#tvClip)">
        <rect x="22" y="26" width="112" height="94" fill="#e3f0ff"/>
        <g class="tv-channel" data-ch="0">
          ${[[40, 44, 10], [70, 50, 14], [104, 46, 9], [52, 78, 15], [88, 84, 12], [118, 80, 8], [36, 106, 9], [74, 108, 10], [110, 108, 13]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#9cc6ff" stroke="#fff" stroke-width="2"/>`).join('')}
        </g>
        <rect class="tv-static" x="22" y="26" width="112" height="94" fill="#c8d2e6" opacity="0"/>
      </g>
      <rect x="22" y="26" width="112" height="94" rx="14" fill="none" stroke="${INK}" stroke-width="2"/>
      <path d="M30 34Q50 28 80 30" stroke="#fff" stroke-width="5" fill="none" opacity=".6" stroke-linecap="round"/>
      <rect x="70" y="128" width="16" height="6" rx="3" fill="${INK}" opacity=".6"/>
    `, 'overflow="visible"');
  }

  // ------------------------------------------------------------ front of the desk
  /** Keyboard; each key is <g class="key" data-k="…"> so real key presses can light it up. */
  function keyboard() {
    const u = 31, x0 = 22, y0 = 52, kh = 28;
    const rows = [
      ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', ['Backspace', 2]],
      [['Tab', 1.5], 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', ['\\', 1.5]],
      [['CapsLock', 1.75], 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", ['Enter', 2.25]],
      [['Shift', 2.25], 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', ['ShiftRight', 2.75]],
      [['Control', 1.5], ['Alt', 1.25], [' ', 8.75], ['AltRight', 1.25], ['Meta', 1.25], ['ControlRight', 1]],
    ];
    let keys = '';
    const key = (k, x, y, w, h, blue) => {
      const fill = blue ? 'url(#gBlue)' : '#f8f2e4';
      const side = blue ? '#3f63b8' : '#cdbd9b';
      const label = k.length === 1 && k !== ' ' ? k.toUpperCase() : '';
      keys += `<g class="key" data-k="${k === '\\' ? 'backslash' : k.replace('"', '&quot;')}">
        <rect x="${x}" y="${y + 3}" width="${w}" height="${h}" rx="5" fill="${side}" stroke="${INK}" stroke-width="1.3"/>
        <g class="cap"><rect x="${x}" y="${y}" width="${w}" height="${h - 2}" rx="5" fill="${fill}" stroke="${INK}" stroke-width="1.3"/>
        <rect x="${x + 4}" y="${y + 3}" width="${w - 8}" height="5" rx="2.5" fill="#fff" opacity=".55"/>
        ${label ? `<text x="${x + w / 2}" y="${y + h - 9}" font-family="Nunito, sans-serif" font-size="9" font-weight="700" fill="${blue ? '#fff' : '#6c7590'}" text-anchor="middle">${label.replace('<', '&lt;').replace('&', '&amp;')}</text>` : ''}</g></g>`;
    };
    // function row
    key('Escape', x0, 16, u * 1.2, 24, true);
    for (let i = 0; i < 12; i++) key('F' + (i + 1), x0 + u * 1.6 + i * (u * 1.0) + Math.floor(i / 4) * 8, 16, u * 0.9, 24, false);
    rows.forEach((row, r) => {
      let x = x0;
      row.forEach((k) => {
        const [name, w] = Array.isArray(k) ? k : [k, 1];
        const blue = Array.isArray(k) || ['`', '-', '='].includes(name);
        key(name, x + 1, y0 + r * (kh + 4), u * w - 3, kh, blue);
        x += u * w;
      });
    });
    // arrows cluster
    const ax = x0 + u * 15 + 14;
    key('ArrowUp', ax + u, y0 + 3 * (kh + 4), u - 3, kh, true);
    key('ArrowLeft', ax, y0 + 4 * (kh + 4), u - 3, kh, true);
    key('ArrowDown', ax + u, y0 + 4 * (kh + 4), u - 3, kh, true);
    key('ArrowRight', ax + u * 2, y0 + 4 * (kh + 4), u - 3, kh, true);
    ['Insert', 'Home', 'PageUp'].forEach((k, i) => key(k, ax + i * u, y0, u - 3, kh, false));
    ['Delete', 'End', 'PageDown'].forEach((k, i) => key(k, ax + i * u, y0 + kh + 4, u - 3, kh, false));
    const W = ax + u * 3 + 18;
    return svg(W, 232, `
      <rect x="6" y="10" width="${W - 6}" height="222" rx="20" fill="#5b4220" opacity=".18" transform="translate(4 8)"/>
      <rect x="2" y="2" width="${W - 6}" height="222" rx="18" fill="url(#gCream)" stroke="${INK}" stroke-width="2.4"/>
      <rect x="10" y="6" width="${W - 24}" height="6" rx="3" fill="#fff" opacity=".6"/>
      ${keys}
      ${[0, 1, 2].map((i) => `<circle cx="${W - 70 + i * 16}" cy="28" r="3.5" fill="${i === 0 ? '#7fe08c' : '#e9dfc7'}" stroke="${INK}" stroke-width="1"/>`).join('')}
    `);
  }

  function mousepad() {
    return svg(320, 180, `
      <rect x="4" y="4" width="312" height="172" rx="40" fill="#3f5fb5" stroke="${INK}" stroke-width="2"/>
      <rect x="4" y="4" width="312" height="172" rx="40" fill="url(#pDots)" opacity=".5"/>
      ${star(60, 50, 14, '#cfe0fb')}${star(250, 130, 18, '#cfe0fb')}${star(270, 44, 10, '#e9f1ff')}${star(80, 140, 10, '#9cc0f5')}${sparkle(160, 40, 8)}${sparkle(200, 150, 6)}
    `);
  }

  /** Clear-blue mouse; .mouse-body is moved by the pointer. */
  function mouse() {
    return svg(130, 160, `
      <path d="M60 4Q70 -20 100 -24" stroke="#d9d2c2" stroke-width="3" fill="none"/>
      <g class="mouse-body">
        <ellipse cx="62" cy="150" rx="46" ry="10" fill="#1d2652" opacity=".3"/>
        <path d="M62 8C100 8 116 40 116 80C116 124 96 150 62 150C28 150 8 124 8 80C8 40 24 8 62 8Z" fill="url(#gBlueClear)" stroke="${INK}" stroke-width="2.4"/>
        <path d="M62 8V64M10 64Q62 74 114 64" stroke="${INK}" stroke-width="1.8" fill="none" opacity=".7"/>
        <rect x="56" y="24" width="12" height="26" rx="6" fill="url(#gChrome)" stroke="${INK}" stroke-width="1.5"/>
        <path d="M24 34Q36 16 56 14" stroke="#fff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>
        <g opacity=".4" fill="#2a4fae"><circle cx="40" cy="100" r="3"/><circle cx="80" cy="110" r="2"/><rect x="50" y="88" width="24" height="10" rx="3"/></g>
      </g>`, 'overflow="visible"');
  }

  /** Mug. Parts: .steam path(s) */
  function mug() {
    return svg(150, 210, `
      <g class="steam" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".75">
        <path class="s1" d="M50 60Q40 40 52 26Q64 12 54 -6"/>
        <path class="s2" d="M78 64Q68 44 80 30Q92 16 82 -2"/>
      </g>
      <ellipse cx="66" cy="200" rx="58" ry="8" fill="#5b4220" opacity=".2"/>
      <path d="M116 100Q148 104 146 136Q144 166 110 166" fill="none" stroke="${INK}" stroke-width="14"/>
      <path d="M116 100Q148 104 146 136Q144 166 110 166" fill="none" stroke="#f6efe0" stroke-width="9"/>
      <path d="M12 76H120V180Q120 198 100 198H32Q12 198 12 180Z" fill="url(#gCream)" stroke="${INK}" stroke-width="2.4"/>
      <ellipse cx="66" cy="76" rx="54" ry="12" fill="#f7f0e0" stroke="${INK}" stroke-width="2.2"/>
      <ellipse cx="66" cy="78" rx="46" ry="8" fill="url(#gCoffee)"/>
      ${heart(66, 132, 20, '#7fa6ea')}
      <path d="M24 92V170" stroke="#fff" stroke-width="5" opacity=".6" stroke-linecap="round"/>
    `, 'overflow="visible"');
  }

  /** Loose CD on the desk; the whole thing spins. */
  function cd(size) {
    const s = size || 240, r = s / 2;
    return svg(s, s, `
      <g class="disc" style="transform-origin:${r}px ${r}px">
        <circle cx="${r}" cy="${r}" r="${r - 3}" fill="url(#gCD)" stroke="#9aa7c4" stroke-width="2"/>
        <circle cx="${r}" cy="${r}" r="${r - 3}" fill="url(#gCDShine)"/>
        <path d="M${r * 0.35} ${r * 0.55}A${r * 0.7} ${r * 0.7} 0 0 1 ${r * 0.9} ${r * 0.25}" stroke="#fff" stroke-width="${s * 0.04}" fill="none" opacity=".7" stroke-linecap="round"/>
        <path d="M${r * 1.65} ${r * 1.4}A${r * 0.7} ${r * 0.7} 0 0 1 ${r * 1.15} ${r * 1.75}" stroke="#fff" stroke-width="${s * 0.025}" fill="none" opacity=".55" stroke-linecap="round"/>
        <circle cx="${r}" cy="${r}" r="${r * 0.27}" fill="#eef2f9" stroke="#9aa7c4" stroke-width="1.5"/>
        <circle cx="${r}" cy="${r}" r="${r * 0.12}" fill="#f6efe1" stroke="#9aa7c4" stroke-width="1.5"/>
      </g>`, 'overflow="visible"');
  }

  window.Art = {
    INK, defs, room, shelf, polaroidSvg, polaroid, poster, vinesLeft, shelfPlant, lamp, pencilCup, caseStack, headphones,
    discman, cdStackSmall, notebook, pen, watch, flipPhone, gameboy, tamagotchi, usb, sdcard, smallPlant, monitor,
    stickyNote, camera, gummyBear, tower, tv, keyboard, mousepad, mouse, mug, cd,
    // bits reused by the pages
    star, starPath, heart, heartPath, sparkle, pixelHeart, pixelCat, cloud, leaf, svg,
  };
})();
