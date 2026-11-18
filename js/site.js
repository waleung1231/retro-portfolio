/* Public site: shows the published layout. Visitors can drag things around and click them to explore.
 * Animation uses GSAP (per the gsap-skills reference). The intro word animation follows the idea of the
 * boknows text-image template: letters turn into little pictures and spring back.
 */
(function () {
  // gsap, Draggable and InertiaPlugin come from vendor/reactbits.bundle.js (registered there).
  const RB = window.ReactBits || null;
  let fxMounts = [];
  const $ = (s) => document.querySelector(s);
  const STAGE = Store.STAGE;
  const preview = new URLSearchParams(location.search).has('preview');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  let project = null;
  let current = null;
  let draggables = [];
  let busy = false;
  const stage = $('#stage');
  const viewport = $('#viewport');
  const tip = $('#tip');

  // ------------------------------------------------------------ loading
  async function loadProject() {
    if (preview) {
      const p = await Store.load();
      if (p) return p;
    }
    try {
      const res = await fetch('project.json', { cache: 'no-cache' });
      if (res.ok) return Store.normalize(await res.json());
    } catch (e) { /* not published yet, or opened from a file */ }
    return Store.freshProject();
  }

  // ------------------------------------------------------------ layout
  function fit() {
    const w = viewport.clientWidth, h = viewport.clientHeight;
    const s = Math.min(w / STAGE.w, h / STAGE.h);
    stage.style.transform = 'scale(' + s + ')';
    stage.style.left = Math.round((w - STAGE.w * s) / 2) + 'px';
    stage.style.top = Math.round((h - STAGE.h * s) / 2) + 'px';
  }

  function pageFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    return project.pages.find((p) => p.id === id) || project.pages[0];
  }

  function buildMenu() {
    $('#siteName').textContent = '✿ ' + project.name;
    document.title = project.name;
    const nav = $('#menu');
    nav.innerHTML = '';
    project.pages.forEach((p, i) => {
      const a = document.createElement('a');
      a.href = '#' + encodeURIComponent(p.id);
      a.textContent = i === 0 ? '⌂ ' + p.name : p.name;
      a.dataset.id = p.id;
      nav.append(a);
    });
  }

  // ------------------------------------------------------------ pages
  function draw(page) {
    draggables.forEach((d) => d.kill());
    draggables = [];
    if (RB) fxMounts.forEach((n) => RB.unmount(n));
    fxMounts = [];
    gsap.killTweensOf('.el-inner');
    stage.innerHTML = '';
    current = page;
    Render.background(project, page, stage);
    document.body.style.setProperty('--bgc', page.background.color);
    document.querySelectorAll('#menu a').forEach((a) => a.classList.toggle('on', a.dataset.id === page.id));
    let z = 1;
    page.elements.forEach((el) => {
      if (el.hidden) return;
      const box = Render.element(project, el);
      if (el.locked) box.classList.add('locked');
      box.style.zIndex = z++;
      stage.append(box);
      const inner = box.querySelector('.el-inner');
      inner.style.transform = '';
      gsap.set(inner, { rotation: el.rotation });
      wire(el, box, inner);
      if (RB && el.type === 'text' && el.effect && !reduced.matches) {
        // React Bits text animation: replace the plain text with the animated component.
        const t = box.querySelector('.el-text');
        t.textContent = '';
        const mount = document.createElement('div');
        t.append(mount);
        if (RB.textEffect(mount, el.effect, { text: el.text, color: el.color, align: el.align })) fxMounts.push(mount);
        else t.textContent = el.text;
      }
    });
  }

  function wire(el, box, inner) {
    const go = () => open(el.link);
    const label = el.link ? (el.link.page ? '→ ' + ((project.pages.find((p) => p.id === el.link.page) || {}).name || 'page') : '↗ ' + shortUrl(el.link.url)) : '';

    box.addEventListener('pointerenter', () => {
      if (label) { tip.textContent = label; tip.hidden = false; }
      if (!reduced.matches) gsap.to(inner, { scale: 1.06, rotation: el.rotation + (el.link ? 3 : 1.5), duration: 0.35, ease: 'back.out(3)', overwrite: 'auto' });
    });
    box.addEventListener('pointermove', (e) => { tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; });
    box.addEventListener('pointerleave', () => {
      tip.hidden = true;
      gsap.to(inner, { scale: 1, rotation: el.rotation, duration: 0.45, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
    });

    if (el.locked) {
      if (el.link) box.addEventListener('click', go);
      return;
    }
    // Visitors can push things around; a click without dragging opens the link.
    const d = Draggable.create(box, {
      type: 'x,y',
      bounds: { minX: -el.x - el.w * 0.6, maxX: STAGE.w - el.x - el.w * 0.4, minY: -el.y - el.h * 0.6, maxY: STAGE.h - el.y - el.h * 0.4 },
      inertia: !reduced.matches,
      minimumMovement: 4,
      zIndexBoost: true,
      onPress() { tip.hidden = true; },
      onDragStart() { if (!reduced.matches) gsap.to(inner, { scale: 1.1, rotation: el.rotation - 4, duration: 0.2, overwrite: 'auto' }); },
      onRelease() { gsap.to(inner, { scale: 1, rotation: el.rotation, duration: 0.6, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' }); },
      onClick() { if (el.link) go(); },
    })[0];
    draggables.push(d);
  }

  function shortUrl(u) {
    try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return 'link'; }
  }

  function open(link) {
    if (!link) return;
    if (link.page) location.hash = encodeURIComponent(link.page);
    else if (link.url) window.open(link.url, '_blank', 'noopener');
  }

  function enter() {
    const inners = stage.querySelectorAll('.el-inner');
    if (reduced.matches) return gsap.fromTo(stage, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
    gsap.set(stage, { autoAlpha: 1 });
    const tl = gsap.timeline();
    tl.from(inners, { scale: 0, autoAlpha: 0, duration: 0.6, ease: 'back.out(1.8)', stagger: { each: 0.045, from: 'random' } });
    // gentle idle float for clickable things, so visitors notice them
    tl.add(() => stage.querySelectorAll('.el.is-link .el-inner').forEach((n, i) => {
      gsap.to(n, { y: -6, duration: 1.4 + (i % 4) * 0.25, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: (i % 5) * 0.2 });
    }));
    return tl;
  }

  async function show(page, animate) {
    if (busy) return;
    if (current && current.id === page.id && animate) return;
    busy = true;
    tip.hidden = true;
    if (current && animate && !reduced.matches) {
      await gsap.to(stage.querySelectorAll('.el-inner'), { scale: 0, autoAlpha: 0, duration: 0.22, ease: 'power2.in', stagger: { each: 0.015, from: 'random' } });
    }
    draw(page);
    busy = false;
    if (animate) enter();
  }

  // ------------------------------------------------------------ intro word
  function stickerMap() {
    const letters = (window.DECK && window.DECK.letters) || [];
    const byChar = {};
    letters.forEach((src) => {
      const ch = src.match(/letter-\d+-(.)\.svg$/);
      if (ch) (byChar[ch[1]] = byChar[ch[1]] || []).push(src);
    });
    const extras = ['star', 'heart', 'cd-disc', 'sparkle', 'pixel-heart', 'pixel-star', 'floppy'].map((n) => 'assets/deck/' + n + '.svg');
    return { byChar, extras };
  }

  function intro() {
    const word = (project.introWord || '').trim();
    const box = $('#intro');
    if (!word) return Promise.resolve();
    return new Promise((resolve) => {
      const h1 = $('#word');
      h1.innerHTML = '';
      h1.setAttribute('aria-label', word);
      const { byChar, extras } = stickerMap();
      const used = {};
      const letters = Array.from(word).map((ch, i) => {
        const span = document.createElement('span');
        span.className = 'letter';
        span.innerHTML = '<span class="ch"></span><span class="stk"><img alt=""></span>';
        span.querySelector('.ch').textContent = ch === ' ' ? ' ' : ch;
        const pool = byChar[ch.toLowerCase()] || [];
        const k = used[ch] = (used[ch] || 0) + 1;
        span.querySelector('img').src = pool.length ? pool[(k - 1 + i) % pool.length] : extras[i % extras.length];
        h1.append(span);
        return span;
      }).filter((s) => s.textContent.trim());

      box.hidden = false;
      gsap.set(box, { autoAlpha: 1 });
      const boot = $('#boot');
      boot.textContent = '';
      if (RB && !reduced.matches) RB.introLine(boot, ['booting up ' + project.name + '…', 'welcome to my desk ✿']);
      else boot.textContent = 'welcome to my desk ✿';
      const tilt = [-9, 7, -5, 8, -7, 6, -4];

      const swap = (span, i, hold) => {
        const ch = span.querySelector('.ch'), stk = span.querySelector('.stk');
        const t = gsap.timeline();
        t.to(span, { paddingLeft: '0.1em', paddingRight: '0.1em', duration: 0.3, ease: 'power2.out' })
          .to(ch, { scale: 0.3, autoAlpha: 0, duration: 0.14, ease: 'power2.in' }, '<')
          .fromTo(stk, { scale: 0.35, rotation: tilt[i % 7] - 8, autoAlpha: 0 }, { scale: 1, rotation: tilt[i % 7], autoAlpha: 1, duration: 0.42, ease: 'back.out(2.6)' }, '<0.05')
          .to(stk, { scale: 0.35, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, '+=' + hold)
          .to(ch, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)' }, '<0.15')
          .to(span, { paddingLeft: '0.02em', paddingRight: '0.02em', duration: 0.4, ease: 'power2.inOut' }, '<');
        return t;
      };

      let done = false;
      const tl = gsap.timeline();
      const finish = () => {
        if (done) return;
        done = true;
        tl.kill();
        letters.forEach((s) => s.onpointerenter = null);
        gsap.timeline({ onComplete: () => { box.hidden = true; resolve(); } })
          .to('#introWindow', { scale: 0.85, y: -30, autoAlpha: 0, duration: 0.4, ease: 'back.in(1.6)' })
          .to(box, { autoAlpha: 0, duration: 0.3 }, '-=0.1');
      };
      box.onclick = finish;
      document.addEventListener('keydown', function onKey(e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { document.removeEventListener('keydown', onKey); finish(); } });

      if (reduced.matches) { tl.to({}, { duration: 1.2 }).add(finish); return; }

      tl.from('#introWindow', { scale: 0.6, autoAlpha: 0, duration: 0.5, ease: 'back.out(1.7)' })
        .from(letters.map((s) => s.querySelector('.ch')), { y: -120, rotation: () => gsap.utils.random(-30, 30), autoAlpha: 0, duration: 0.7, ease: 'bounce.out', stagger: 0.07 }, '-=0.1');
      letters.forEach((s, i) => tl.add(swap(s, i, 0.35), 1.3 + i * 0.16));
      tl.from('.enter', { autoAlpha: 0, y: 10, duration: 0.4 }, '>-0.2');
      tl.to({}, { duration: 1.6 }).add(finish);

      // hover a letter to see its picture again
      letters.forEach((s, i) => (s.onpointerenter = () => { if (tl.progress() > 0.5) swap(s, i, 0.25); }));
    });
  }

  // ------------------------------------------------------------ start
  function clock() {
    const t = $('#clock');
    const now = new Date();
    t.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    t.dateTime = now.toISOString();
  }

  async function init() {
    project = await loadProject();
    if (RB && !reduced.matches) { RB.clickSpark('#3b3340'); RB.noise(9); }
    buildMenu();
    fit();
    gsap.set(stage, { autoAlpha: 0 });
    draw(pageFromHash());
    let seen = false;
    try { seen = sessionStorage.getItem('introSeen') === '1'; } catch (e) { /* storage blocked */ }
    if (!seen && !preview) {
      await intro();
      try { sessionStorage.setItem('introSeen', '1'); } catch (e) { /* fine */ }
    }
    enter();

    window.addEventListener('hashchange', () => show(pageFromHash(), true));
    window.addEventListener('resize', fit);
    $('#replay').onclick = async () => { await intro(); draw(current); enter(); };
    clock();
    setInterval(clock, 10000);

    if (preview) {
      $('#badge').hidden = false;
      Store.onExternalChange(async (updatedAt) => {
        if (updatedAt <= project.updatedAt) return;
        const p = await Store.load();
        if (!p) return;
        project = p;
        buildMenu();
        draw(project.pages.find((x) => x.id === current.id) || project.pages[0]);
      });
    }
    window.__site = { get project() { return project; } };
  }
  init();
})();
