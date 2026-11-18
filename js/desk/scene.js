/* The home desk: lays out the art, runs the idle loops and the little toys (lamp, camera, Game Boy …).
 * The four "doors" (monitor, CD player, notebook, phone) hand off to Pages for their own transitions.
 */
(function () {
  const W = 1600, H = 900;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  // id, art(), x, y, rotation, extra options. Listed back to front.
  // tilt: CSS 3D tilt for things lying flat on the desk. door: page it opens. drag: visitors can move it.
  const LAYOUT = [
    ['shelf', () => Art.shelf(), 10, 20, 0],
    ['p-ocean', () => Art.polaroidSvg(110, 138, CONTENT.photos[0]), 300, 56, -7, { swing: 1 }],
    ['p-sky', () => Art.polaroidSvg(104, 130, CONTENT.photos[1], '#f4c8d4'), 430, 150, 6, { swing: 1 }],
    ['p-palms', () => Art.polaroidSvg(108, 134, CONTENT.photos[2]), 568, 54, -3, { swing: 1 }],
    ['poster-beach', () => Art.poster(150, 100, 'beach', '#f4c8d4'), 1110, -14, -2, { swing: 1 }],
    ['poster-flowers', () => Art.poster(140, 160, 'flowers'), 1300, -10, 2, { swing: 1 }],
    ['poster-city', () => Art.poster(150, 196, 'city', '#cfe0fb'), 1448, -10, -2, { swing: 1 }],
    ['shelf-plant', () => Art.shelfPlant(), 690, 18, 0],
    ['vines', () => Art.vinesLeft(), -20, -10, 0],
    ['small-plant', () => Art.smallPlant(), 790, 372, 0],
    ['lamp', () => Art.lamp(), 14, 284, 0, { label: 'lights', toy: 'lamp' }],
    ['cases', () => Art.caseStack(), 300, 404, 0],
    ['cup', () => Art.pencilCup('cream'), 168, 420, 0],
    ['plant-bear', () => Art.gummyBear('#cfe0fb'), 236, 486, -8, { toy: 'bear', label: 'boop' }],
    ['headphones', () => Art.headphones(), 330, 396, -2, { label: 'listen', toy: 'headphones' }],
    ['monitor', () => Art.monitor(), 900, 150, 0, { door: 'projects', label: 'projects' }],
    ['camera', () => Art.camera(), 1074, 46, -3, { label: 'say cheese', toy: 'camera' }],
    ['bear', () => Art.gummyBear('#a9c8f8'), 1282, 66, 6, { toy: 'bear', label: 'boop' }],
    ['tower', () => Art.tower(), 1386, 282, 0],
    ['tv', () => Art.tv(), 1402, 130, 0, { label: 'channel', toy: 'tv' }],
    ['sticky', () => Art.stickyNote(), 1318, 196, 8, { swing: 1 }],
    ['cup-mesh', () => Art.pencilCup('mesh'), 1494, 468, 0],
    ['gameboy', () => Art.gameboy(), 698, 404, 7, { label: 'play', toy: 'gameboy' }],
    ['discman', () => Art.discman(), 58, 562, -3, { door: 'experience', label: 'experience' }],
    ['notebook', () => Art.notebook(), 54, 690, -5, { door: 'about', label: 'about me', tilt: 'perspective(900px) rotateX(46deg)' }],
    ['pen', () => Art.pen(), 250, 792, -16, { drag: 1 }],
    ['watch', () => Art.watch(), 446, 640, 12, { tilt: 'perspective(800px) rotateX(38deg)', toy: 'watch' }],
    ['phone', () => Art.flipPhone(), 566, 500, -10, { door: 'contact', label: 'contact' }],
    ['keyboard', () => Art.keyboard(), 856, 548, 1, { tilt: 'perspective(1100px) rotateX(44deg)', toy: 'keyboard' }],
    ['cd', () => Art.cd(210), 596, 726, 0, { tilt: 'perspective(900px) rotateX(58deg)', toy: 'cd', label: 'spin me' }],
    ['tamagotchi', () => Art.tamagotchi(), 742, 676, -8, { label: 'feed me', toy: 'tamagotchi' }],
    ['usb', () => Art.usb(), 330, 812, 14, { drag: 1 }],
    ['mousepad', () => Art.mousepad(), 1214, 716, -4, { tilt: 'perspective(900px) rotateX(52deg)' }],
    ['mouse', () => Art.mouse(), 1300, 712, -8, { toy: 'mouse' }],
    ['d-palms', () => Art.polaroidSvg(124, 150, CONTENT.photos[3]), 918, 736, -9, { tilt: 'perspective(900px) rotateX(36deg)', drag: 1 }],
    ['d-grass', () => Art.polaroidSvg(124, 150, CONTENT.photos[4]), 1064, 744, 7, { tilt: 'perspective(900px) rotateX(36deg)', drag: 1 }],
    ['sd', () => Art.sdcard(), 860, 806, -18, { drag: 1, tilt: 'perspective(600px) rotateX(40deg)' }],
    ['mug', () => Art.mug(), 1438, 672, 0, { label: 'sip', toy: 'mug' }],
  ];

  let stage, objs = {};
  let mm; // gsap.matchMedia — every idle loop lives inside it so reduced-motion reverts them
  let reduced = false;
  let night = false;
  let snaps = 0;

  // ------------------------------------------------------------ build
  function build(stageEl) {
    stage = stageEl;
    stage.innerHTML = `<div class="room-layer">${Art.room()}</div>`;
    LAYOUT.forEach(([id, art, x, y, rot, o], i) => {
      o = o || {};
      const el = document.createElement('div');
      el.className = 'obj obj-' + id + (o.door ? ' is-door' : '') + (o.toy ? ' is-toy' : '') + (o.drag ? ' is-drag' : '');
      el.dataset.id = id;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.zIndex = 10 + i;
      el.innerHTML = `<div class="obj-tilt"${o.tilt ? ` style="transform:${o.tilt}"` : ''}><div class="obj-in">${art()}</div></div>`;
      const inner = $('.obj-in', el);
      gsap.set(inner, { rotation: rot });
      if (o.door || o.toy) {
        el.tabIndex = 0;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', o.door ? 'Open ' + o.label : (o.label || id));
      }
      stage.append(el);
      objs[id] = { el, inner, rot, o, x, y };
    });

    // two separate layers (not nested) so their blend modes reach the art underneath
    ['night night-dark', 'night night-warm'].forEach((c) => {
      const n = document.createElement('div');
      n.className = c;
      stage.append(n);
    });

    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.setAttribute('aria-hidden', 'true');
    stage.append(tag);

    wire();
    idle();
    watchClock();
  }

  // ------------------------------------------------------------ idle loops
  function idle() {
    mm = gsap.matchMedia();
    mm.add({ reduce: '(prefers-reduced-motion: reduce)', ok: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
      reduced = ctx.conditions.reduce;
      if (reduced) return;
      // vines and hanging keychains sway from their tops
      $$('.vine', stage).forEach((v, i) => gsap.to(v, { rotation: i % 2 ? 2.2 : -2.6, duration: 3 + (i % 3), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.3 }));
      $$('.swing', stage).forEach((s, i) => gsap.fromTo(s, { rotation: -7 }, { rotation: 7, duration: 1.6 + (i % 3) * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      // clouds drift across the monitor
      gsap.to($('.obj-monitor .clouds'), { x: -120, duration: 26, ease: 'none', repeat: -1, yoyo: true });
      // steam
      $$('.obj-mug .steam path').forEach((p, i) => gsap.fromTo(p, { y: 10, autoAlpha: 0, scaleY: 0.8 }, { y: -18, autoAlpha: 0.8, scaleY: 1.1, duration: 2.4, ease: 'sine.out', repeat: -1, delay: i * 1.1, yoyo: false, transformOrigin: '50% 100%' }));
      // virtual pets breathe
      gsap.to('.obj-tamagotchi .pet', { y: -3, duration: 0.5, ease: 'steps(1)', yoyo: true, repeat: -1 });
      gsap.to('.obj-gameboy .pet', { x: 8, duration: 1.2, ease: 'steps(3)', yoyo: true, repeat: -1 });
      // CD on the desk turns slowly
      gsap.to('.obj-cd .disc', { rotation: 360, duration: 14, ease: 'none', repeat: -1 });
      // little TV shows bubbles drifting
      gsap.to('.obj-tv .tv-channel', { y: -6, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      // phone screen glints now and then
      gsap.to('.obj-phone .screen-glow', { fill: '#ffffff', duration: 0.25, repeat: -1, yoyo: true, repeatDelay: 4 });
      // door objects breathe so people notice them
      Object.values(objs).filter((b) => b.o.door).forEach((b, i) => {
        gsap.to(b.el, { y: -5, duration: 1.6 + i * 0.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.4 });
      });
    });
  }

  function watchClock() {
    const t = $('.obj-watch .watch-time'), d = $('.obj-watch .watch-date');
    const tick = () => {
      const now = new Date();
      t.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      d.textContent = now.toLocaleDateString([], { weekday: 'short' }).toUpperCase();
    };
    tick();
    setInterval(tick, 15000);
  }

  // ------------------------------------------------------------ hover tag
  function showTag(b) {
    const tag = $('.tag', stage);
    if (!b.o.label) return;
    tag.textContent = b.o.door ? b.o.label + ' ▸' : b.o.label;
    tag.classList.toggle('door', !!b.o.door);
    const r = b.el.getBoundingClientRect(), s = stageRect();
    const k = s.width / W;
    const x = (r.left + r.width / 2 - s.left) / k, y = (r.top - s.top) / k;
    gsap.killTweensOf(tag);
    gsap.set(tag, { x: x, y: Math.max(24, y - 10), xPercent: -50, yPercent: -100 });
    gsap.fromTo(tag, { autoAlpha: 0, scale: 0.6, rotation: -6 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.35, ease: 'back.out(2.5)' });
  }
  function hideTag() { gsap.to($('.tag', stage), { autoAlpha: 0, scale: 0.8, duration: 0.15 }); }
  const stageRect = () => stage.getBoundingClientRect();

  // ------------------------------------------------------------ wiring
  function wire() {
    Object.entries(objs).forEach(([id, b]) => {
      const { el, inner, o } = b;
      if (o.door || o.toy || o.swing) {
        el.addEventListener('pointerenter', () => {
          showTag(b);
          if (reduced) return;
          if (o.swing) gsap.fromTo(inner, { rotation: b.rot }, { keyframes: { rotation: [b.rot + 6, b.rot - 4, b.rot + 2, b.rot] }, duration: 1.1, ease: 'sine.out', transformOrigin: '50% 0%', overwrite: 'auto' });
          else gsap.to(inner, { y: -8, scale: 1.04, rotation: b.rot + (o.door ? 2 : 1), duration: 0.35, ease: 'back.out(3)', overwrite: 'auto' });
          if (id === 'discman') gsap.to($('.lid', el), { scaleY: 0.9, svgOrigin: '180 46', duration: 0.3, ease: 'power2.out' });
          if (id === 'notebook') gsap.to($('.cover', el), { scaleY: 0.92, svgOrigin: '180 12', duration: 0.3 });
          if (id === 'monitor') gsap.to($('.cursor', el), { x: 110, y: 82, duration: 0.6, ease: 'power2.inOut' });
        });
        el.addEventListener('pointerleave', () => {
          hideTag();
          if (o.swing) return;
          gsap.to(inner, { y: 0, scale: 1, rotation: b.rot, duration: 0.6, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
          if (id === 'discman') gsap.to($('.lid', el), { scaleY: 1, svgOrigin: '180 46', duration: 0.5, ease: 'bounce.out' });
          if (id === 'notebook') gsap.to($('.cover', el), { scaleY: 1, svgOrigin: '180 12', duration: 0.4 });
        });
      }
      if (o.door) {
        const go = () => window.Pages && Pages.open(o.door);
        el.addEventListener('click', go);
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      }
      if (o.toy && TOYS[o.toy]) {
        const fn = () => TOYS[o.toy](b);
        el.addEventListener('click', fn);
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
      }
      if (o.drag) makeDraggable(b);
    });

    // the mouse on the desk follows the visitor's pointer (and the cursor on the monitor copies it)
    const mx = gsap.quickTo($('.obj-mouse .mouse-body'), 'x', { duration: 0.5, ease: 'power3' });
    const my = gsap.quickTo($('.obj-mouse .mouse-body'), 'y', { duration: 0.5, ease: 'power3' });
    const cx = gsap.quickTo($('.obj-monitor .cursor'), 'x', { duration: 0.4, ease: 'power3' });
    const cy = gsap.quickTo($('.obj-monitor .cursor'), 'y', { duration: 0.4, ease: 'power3' });
    window.addEventListener('pointermove', (e) => {
      if (reduced || document.body.dataset.page !== 'home') return;
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      mx(nx * 60); my(ny * 30);
      if (!$('.obj-monitor:hover')) { cx(nx * 300); cy(ny * 220); }
    });

    // typing on the real keyboard presses the keys on the drawn one
    window.addEventListener('keydown', (e) => {
      if (document.body.dataset.page !== 'home' || e.metaKey || e.ctrlKey) return;
      let k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === '\\') k = 'backslash';
      if (e.code === 'ShiftRight') k = 'ShiftRight';
      const key = $$('.obj-keyboard .key', stage).find((g) => g.dataset.k === k);
      if (key) press(key);
    });
    $$('.obj-keyboard .key', stage).forEach((g) => g.addEventListener('pointerdown', () => press(g)));
  }

  function press(key) {
    Sound.click();
    gsap.fromTo($('.cap', key), { y: 0 }, { y: 3, duration: 0.06, yoyo: true, repeat: 1, ease: 'power1.inOut' });
    const cap = $('.cap rect', key);
    if (!cap.dataset.fill) cap.dataset.fill = cap.getAttribute('fill');
    const was = cap.dataset.fill;
    gsap.killTweensOf(cap);
    cap.setAttribute('fill', '#ffe59a');
    gsap.delayedCall(0.18, () => cap.setAttribute('fill', was));
  }

  function makeDraggable(b) {
    Draggable.create(b.el, {
      type: 'x,y',
      inertia: true,
      bounds: { minX: -b.x - 40, maxX: W - b.x - 80, minY: 560 - b.y, maxY: H - b.y - 40 },
      zIndexBoost: true,
      onPress() { hideTag(); },
      onDragStart() { gsap.to(b.inner, { scale: 1.08, rotation: b.rot - 5, duration: 0.2 }); },
      onRelease() { gsap.to(b.inner, { scale: 1, rotation: b.rot, duration: 0.7, ease: 'elastic.out(1, 0.45)' }); },
    });
  }

  // ------------------------------------------------------------ toys
  function floatUp(html, fromEl, opts) {
    // particles that pop out of an object (notes, hearts, stars) using Physics2D
    opts = opts || {};
    const r = fromEl.getBoundingClientRect(), s = stageRect(), k = s.width / W;
    const x0 = (r.left + r.width * (opts.ox || 0.5) - s.left) / k, y0 = (r.top + r.height * (opts.oy || 0.3) - s.top) / k;
    for (let i = 0; i < (opts.count || 5); i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.innerHTML = Array.isArray(html) ? html[i % html.length] : html;
      stage.append(p);
      gsap.set(p, { x: x0, y: y0, xPercent: -50, yPercent: -50, scale: 0.4 + Math.random() * 0.5, rotation: gsap.utils.random(-30, 30) });
      gsap.to(p, {
        duration: 1.6 + Math.random() * 0.6,
        physics2D: { velocity: gsap.utils.random(260, 420), angle: gsap.utils.random(-125, -55), gravity: opts.gravity || 260 },
        rotation: '+=' + gsap.utils.random(-90, 90),
        autoAlpha: 0, ease: 'power1.in',
        onComplete: () => p.remove(),
      });
    }
  }
  const NOTE = '<svg viewBox="0 0 30 34" width="30" height="34"><path d="M10 4L28 0V24" stroke="#3d63c4" stroke-width="3" fill="none"/><path d="M10 4V28" stroke="#3d63c4" stroke-width="3"/><ellipse cx="6" cy="28" rx="6" ry="4.5" fill="#3d63c4"/><ellipse cx="24" cy="24" rx="6" ry="4.5" fill="#3d63c4"/></svg>';
  const HEART = '<svg viewBox="-20 -20 40 40" width="34" height="34"><path d="' + 'M0 16C-27 -2 -16 -22 0 -8C16 -22 27 -2 0 16Z' + '" fill="#7fa6ea" stroke="#2b3a67" stroke-width="2"/></svg>';
  const STAR = () => `<svg viewBox="-20 -20 40 40" width="36" height="36"><path d="${Art.starPath(0, 0, 18, 0.5)}" fill="#cfe0fb" stroke="#2b3a67" stroke-width="2" stroke-linejoin="round"/></svg>`;

  const TOYS = {
    lamp() {
      night = !night;
      Sound.click();
      document.body.classList.toggle('is-night', night);
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
      tl.to('.obj-lamp .lamp-head', { rotation: night ? -6 : 0, duration: 0.25, yoyo: true, repeat: 1 })
        .to('.night', { autoAlpha: night ? 1 : 0, duration: 0.7 }, 0)
        .to('.obj-lamp .lamp-glow', { autoAlpha: night ? 1 : 0, duration: 0.5 }, 0.1);
      if (night) tl.fromTo('.night-warm', { opacity: 0.3 }, { opacity: 1, duration: 0.08, repeat: 3, yoyo: true, ease: 'steps(1)' }, 0.75);
      const btn = $('#lampBtn'); if (btn) btn.setAttribute('aria-pressed', night);
    },
    camera(b) {
      Sound.shutter();
      const flash = document.createElement('div');
      flash.className = 'camera-flash';
      document.body.append(flash);
      gsap.timeline()
        .to(b.inner, { scale: 0.94, duration: 0.08, yoyo: true, repeat: 1 })
        .fromTo($('.flash-bulb', b.el), { attr: { fill: '#fff8c0' } }, { attr: { fill: '#fbfbff' }, duration: 0.6 }, 0)
        .fromTo(flash, { autoAlpha: 0.95 }, { autoAlpha: 0, duration: 0.7, ease: 'power2.out', onComplete: () => flash.remove() }, 0.05);
      // a fresh polaroid slides out and drops onto the desk; you can drag it around after
      const scenes = CONTENT.photos;
      const scene = scenes[snaps++ % scenes.length];
      const p = document.createElement('div');
      p.className = 'obj is-drag snap';
      p.style.left = '1130px'; p.style.top = '120px'; p.style.zIndex = 60;
      p.innerHTML = `<div class="obj-tilt"><div class="obj-in">${Art.polaroidSvg(96, 118, scene)}</div></div>`;
      stage.append(p);
      const inner = $('.obj-in', p);
      const tx = gsap.utils.random(-600, 200), ty = gsap.utils.random(620, 700) - 120;
      const rot = gsap.utils.random(-20, 20);
      gsap.timeline()
        .fromTo(inner, { scaleY: 0.1, y: -10, autoAlpha: 0 }, { scaleY: 1, y: 0, autoAlpha: 1, transformOrigin: '50% 0%', duration: 0.45, ease: 'power2.out' }, 0.15)
        .to(p, { x: tx, duration: 1.1, ease: 'power1.out' }, 0.6)
        .to(p, { y: ty, duration: 1.1, ease: 'bounce.out' }, 0.6)
        .to(inner, { rotation: rot, duration: 1.1, ease: 'power2.out' }, 0.6);
      const b2 = { el: p, inner, rot, x: 1130, y: 120 };
      setTimeout(() => {
        Draggable.create(p, { type: 'x,y', inertia: true, zIndexBoost: true,
          onDragStart() { gsap.to(inner, { scale: 1.08, duration: 0.2 }); },
          onRelease() { gsap.to(inner, { scale: 1, duration: 0.6, ease: 'elastic.out(1, .45)' }); } });
      }, 1800);
      return b2;
    },
    headphones(b) {
      Sound.melody();
      gsap.timeline()
        .to(b.inner, { scaleX: 1.08, scaleY: 0.92, duration: 0.1, transformOrigin: '50% 100%' })
        .to(b.inner, { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1.2, .3)' })
        .to($$('.cup', b.el), { scale: 1.06, transformOrigin: '50% 50%', duration: 0.12, yoyo: true, repeat: 7 }, 0);
      floatUp(NOTE, b.el, { count: 7, gravity: 120 });
    },
    gameboy(b) {
      Sound.coin();
      const pet = $('.pet', b.el), hearts = $('.lcd-hearts', b.el), btn = $('.btn-a', b.el);
      gsap.timeline()
        .to(btn, { scale: 0.8, svgOrigin: '146 172', duration: 0.06, yoyo: true, repeat: 1 })
        .to(pet, { y: -18, duration: 0.18, ease: 'steps(3)' }, 0)
        .to(pet, { y: 0, duration: 0.24, ease: 'steps(3)' })
        .fromTo(hearts, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.6, ease: 'steps(3)' }, 0.1);
      floatUp(STAR(), b.el, { count: 3, oy: 0.2 });
    },
    tamagotchi(b) {
      Sound.pop();
      gsap.timeline()
        .to(b.inner, { rotation: b.rot - 10, duration: 0.1 })
        .to(b.inner, { rotation: b.rot, duration: 0.8, ease: 'elastic.out(1.2, .3)' })
        .fromTo($('.hearts', b.el), { autoAlpha: 1 }, { autoAlpha: 0, duration: 1, ease: 'steps(4)' }, 0)
        .to($('.pet', b.el), { scaleY: 0.8, svgOrigin: '78 96', duration: 0.1, yoyo: true, repeat: 3 }, 0);
      floatUp(HEART, b.el, { count: 4 });
    },
    tv(b) {
      Sound.blip(220);
      const ch = $('.tv-channel', b.el), st = $('.tv-static', b.el);
      const n = (+ch.dataset.ch + 1) % 4;
      const channels = [
        () => [[40, 44, 10], [70, 50, 14], [104, 46, 9], [52, 78, 15], [88, 84, 12], [118, 80, 8], [36, 106, 9], [74, 108, 10], [110, 108, 13]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#9cc6ff" stroke="#fff" stroke-width="2"/>`).join(''),
        () => `<rect x="22" y="26" width="112" height="94" fill="#2a3a7a"/>` + [[40, 40], [90, 50], [120, 36], [60, 70], [110, 90], [34, 96], [80, 104]].map(([x, y]) => `<path d="${Art.starPath(x, y, 5, 0.45)}" fill="#fff6c8"/>`).join(''),
        () => `<rect x="22" y="26" width="112" height="94" fill="url(#gSky)"/>` + Art.cloud(34, 40, 0.5) + Art.cloud(76, 70, 0.4) + `<path d="M22 104Q78 90 134 106V120H22Z" fill="url(#gGrass)"/>`,
        () => `<rect x="22" y="26" width="112" height="94" fill="#f6e3ef"/>` + Art.pixelHeart(54, 52, 7, '#7fa6ea'),
      ];
      gsap.timeline()
        .to(st, { opacity: 1, duration: 0.05 })
        .to(st, { opacity: 0.4, duration: 0.05, repeat: 5, yoyo: true, ease: 'steps(1)' })
        .add(() => { ch.innerHTML = channels[n](); ch.dataset.ch = n; })
        .to(st, { opacity: 0, duration: 0.15 })
        .fromTo(b.inner, { rotation: b.rot - 3 }, { rotation: b.rot, duration: 0.5, ease: 'elastic.out(1, .3)' }, 0);
    },
    bear(b) {
      Sound.pop();
      gsap.timeline()
        .to($('.bear', b.el), { scaleY: 0.7, scaleX: 1.2, duration: 0.12, ease: 'power2.in' })
        .to($('.bear', b.el), { scaleY: 1, scaleX: 1, duration: 0.9, ease: 'elastic.out(1.4, .25)' });
    },
    mug(b) {
      Sound.blip(330);
      gsap.timeline()
        .to(b.inner, { rotation: -16, x: -14, y: -24, duration: 0.45, ease: 'power2.inOut', transformOrigin: '30% 90%' })
        .to(b.inner, { rotation: 0, x: 0, y: 0, duration: 0.6, ease: 'bounce.out' }, '+=0.35');
      floatUp('<svg viewBox="0 0 40 40" width="38" height="38"><circle cx="20" cy="20" r="14" fill="#fff" opacity=".85"/></svg>', b.el, { count: 4, gravity: -40, oy: 0.1 });
    },
    cd(b) {
      Sound.whoosh();
      const disc = $('.disc', b.el);
      gsap.to(disc, { rotation: '+=' + 1080, duration: 2.2, ease: 'power4.out' });
      floatUp(STAR(), b.el, { count: 3 });
    },
    watch(b) {
      Sound.blip(1320);
      gsap.fromTo($('.watch-time', b.el), { opacity: 0 }, { opacity: 1, duration: 0.1, repeat: 6, yoyo: true, ease: 'steps(1)' });
    },
    keyboard() { /* keys handle their own clicks */ },
    mouse(b) {
      Sound.click();
      gsap.fromTo($('.mouse-body', b.el), { scaleY: 0.94 }, { scaleY: 1, svgOrigin: '62 150', duration: 0.3, ease: 'back.out(3)' });
    },
  };

  // ------------------------------------------------------------ door animations (played before the page opens)
  const doors = {
    projects() {
      const el = objs.monitor.el;
      const icon = $('.icon[data-icon="folder"]', el);
      return gsap.timeline()
        .to($('.cursor', el), { x: -150, y: -108, duration: 0.45, ease: 'power2.inOut' })
        .to(icon, { scale: 1.15, svgOrigin: '100 84', duration: 0.08, yoyo: true, repeat: 3 })
        .add(() => Sound.click(), '<');
    },
    experience() {
      const el = objs.discman.el;
      Sound.click();
      return gsap.timeline()
        .to($('.lid', el), { scaleY: -0.55, svgOrigin: '180 46', duration: 0.55, ease: 'back.out(1.6)' })
        .to($('.disc-spin', el), { rotation: 720, duration: 1.2, ease: 'power2.in' }, 0.2)
        .to($('.disc-wrap', el), { y: -26, duration: 0.5, ease: 'power2.out' }, 0.5);
    },
    about() {
      const el = objs.notebook.el;
      Sound.whoosh();
      return gsap.timeline()
        .to($('.cover', el), { scaleY: -0.25, svgOrigin: '180 12', duration: 0.55, ease: 'power2.inOut' });
    },
    contact() {
      const b = objs.phone;
      Sound.ring();
      CustomWiggle.create('ringWiggle', { wiggles: 10, type: 'uniform' });
      return gsap.timeline()
        .to(b.inner, { x: 6, duration: 0.6, ease: 'ringWiggle' })
        .to($('.screen-glow', b.el), { fill: '#ffffff', duration: 0.1, repeat: 3, yoyo: true }, 0);
    },
  };
  function resetDoor(name) {
    const el = objs[{ projects: 'monitor', experience: 'discman', about: 'notebook', contact: 'phone' }[name]].el;
    if (name === 'experience') {
      return gsap.timeline()
        .to($('.disc-wrap', el), { y: 0, duration: 0.3 })
        .to($('.lid', el), { scaleY: 1, svgOrigin: '180 46', duration: 0.5, ease: 'bounce.out' })
        .set($('.disc-spin', el), { rotation: 0 });
    }
    if (name === 'about') return gsap.to($('.cover', el), { scaleY: 1, svgOrigin: '180 12', duration: 0.6, ease: 'bounce.out' });
    return gsap.timeline();
  }

  // ------------------------------------------------------------ entrance
  function entrance() {
    if (reduced) return gsap.fromTo(stage, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
    const wall = ['shelf', 'p-ocean', 'p-sky', 'p-palms', 'poster-beach', 'poster-flowers', 'poster-city', 'sticky'].map((k) => objs[k].inner);
    const desk = LAYOUT.map((l) => l[0]).filter((k) => !['shelf', 'p-ocean', 'p-sky', 'p-palms', 'poster-beach', 'poster-flowers', 'poster-city', 'sticky', 'vines', 'shelf-plant'].includes(k)).map((k) => objs[k].inner);
    const mon = objs.monitor.el;
    const tl = gsap.timeline();
    tl.set(stage, { autoAlpha: 1 })
      .from('.room-layer', { autoAlpha: 0, duration: 0.5 })
      .from([objs.vines.inner, objs['shelf-plant'].inner], { y: -300, duration: 1, ease: 'power3.out', stagger: 0.1 }, 0.1)
      .from(wall, { y: -60, rotation: () => gsap.utils.random(-25, 25), autoAlpha: 0, transformOrigin: '50% 0%', duration: 0.9, ease: 'elastic.out(1, .5)', stagger: 0.05 }, 0.2)
      .from(desk, { y: -140, autoAlpha: 0, duration: 0.8, ease: 'bounce.out', stagger: { each: 0.035, from: 'random' } }, 0.35)
      .from($('.screen', mon), { autoAlpha: 0, duration: 0.01 }, 1.2)
      .fromTo($('.flash', mon), { opacity: 1 }, { opacity: 0, duration: 0.6, ease: 'power2.out' }, 1.2)
      .from($$('.icon', mon), { scale: 0, svgOrigin: '100 160', stagger: 0.08, duration: 0.4, ease: 'back.out(3)' }, 1.35)
      .from($$('.obj-keyboard .key .cap', stage), { y: -6, duration: 0.25, stagger: { each: 0.004, from: 'start' }, ease: 'power1.out' }, 1.1);
    return tl;
  }

  window.Scene = {
    build, entrance, doors, resetDoor, toys: TOYS,
    obj: (id) => objs[id],
    get stage() { return stage; },
    get reduced() { return reduced; },
    W, H,
  };
})();
