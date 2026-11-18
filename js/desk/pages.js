/* The four rooms you can step into from the desk. Each has its own way in and out:
 *   projects   – the camera dives into the CRT, the screen powers on into a little desktop OS
 *   experience – the CD player opens, the disc flies out and becomes a "now playing" tracklist
 *   about      – the notebook lifts off the desk and its cover swings open
 *   contact    – the flip phone rings, flies up and boots into a messages screen
 * React Bits components (Folder, DecryptedText, TextType, CircularText, ElasticSlider, Stack,
 * StickerPeel, Magnet, DotGrid, Shuffle, GlareHover) are mounted through RB.mount from the bundle.
 */
(function () {
  const C = window.CONTENT;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad2 = (n) => String(n).padStart(2, '0');

  let current = null;   // name of the open page
  let busy = false;
  const built = {};
  const reduced = () => Scene.reduced;

  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  /** Where a desk object sits on screen right now, as a plain rect. */
  const rectOf = (node) => { const r = node.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; };

  /** Tween values that make `node` (laid out at its final place) start on top of `from`. */
  function fromRect(node, from, extra) {
    const to = rectOf(node);
    const s = Math.min(from.w / to.w, from.h / to.h);
    return Object.assign({ x: from.cx - to.cx, y: from.cy - to.cy, scale: s }, extra || {});
  }

  // ================================================================== PROJECTS
  function buildProjects() {
    const page = el(`<section class="page page-projects" aria-label="Projects" hidden>
      <div class="crt">
        <div class="wallpaper">${Art.svg(1600, 900, `<rect width="1600" height="900" fill="url(#gSky)"/>
          <g class="wp-clouds">${Art.cloud(120, 120, 2.2)}${Art.cloud(700, 70, 2.8)}${Art.cloud(1200, 180, 2)}${Art.cloud(420, 330, 1.4, 0.9)}${Art.cloud(1000, 400, 1.2, 0.8)}${Art.cloud(1700, 120, 2.4)}${Art.cloud(-300, 260, 1.8)}</g>
          <path d="M0 690Q400 600 800 640Q1200 680 1600 600V900H0Z" fill="url(#gGrass)"/>
          <path d="M0 740Q500 680 1600 720" stroke="#c4e68f" stroke-width="8" fill="none" opacity=".5"/>`, 'preserveAspectRatio="xMidYMid slice"')}</div>
        <div class="os-title"><span class="glitch-mount"></span></div>
        <div class="icons">
          ${C.projects.map((p, i) => `<div class="proj" data-i="${i}" title="${esc(p.title)}">
            <div class="folder-mount"></div><span class="proj-label">${esc(p.title)}</span></div>`).join('')}
          <a class="proj proj-link" href="https://github.com/waleung1231" target="_blank" rel="noopener"><div class="globe">${Art.svg(48, 48, `<circle cx="24" cy="24" r="20" fill="#cfe6ff" stroke="#2b3a67" stroke-width="2.4"/><ellipse cx="24" cy="24" rx="9" ry="20" fill="none" stroke="#2b3a67" stroke-width="2"/><path d="M4 24H44M7 13H41M7 35H41" stroke="#2b3a67" stroke-width="2"/>`)}</div><span class="proj-label">more on github ↗</span></a>
        </div>
        <div class="windows"></div>
        <div class="taskbar">
          <button class="start" aria-haspopup="true" aria-expanded="false">✿ start</button>
          <div class="start-menu" hidden>
            <button data-go="about">📓 about me</button>
            <button data-go="experience">💿 experience</button>
            <button data-go="contact">📱 contact</button>
            <hr><button data-go="home">⏻ shut down</button>
          </div>
          <div class="tasks"></div>
          <span class="tray">🔈 <time class="tray-clock"></time></span>
        </div>
        <div class="scanlines"></div><div class="vignette"></div>
      </div>
    </section>`);
    document.body.append(page);
    built.projects = page;

    RB.mount($('.glitch-mount', page), 'GlitchText', { children: 'projects.exe', speed: 0.8, enableShadows: true, enableOnHover: true, className: 'os-glitch' });

    C.projects.forEach((p, i) => {
      const host = $(`.proj[data-i="${i}"]`, page);
      const papers = [p.tags[0] || '', p.tags[1] || '', p.tags[2] || '★'].map((t) => RB.html(`<span>${esc(t)}</span>`, 'paper-tag'));
      RB.mount($('.folder-mount', host), 'Folder', { color: p.color, size: 0.9, items: papers });
      host.addEventListener('click', () => toggleWindow(i, host));
    });

    // start menu
    const start = $('.start', page), menu = $('.start-menu', page);
    start.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.hidden;
      menu.hidden = !open;
      start.setAttribute('aria-expanded', open);
      if (open) gsap.from($$('button, hr', menu), { x: -20, autoAlpha: 0, stagger: 0.04, duration: 0.25 });
    });
    page.addEventListener('click', () => { menu.hidden = true; start.setAttribute('aria-expanded', false); });
    $$('[data-go]', menu).forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));

    const clock = () => { $('.tray-clock', page).textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
    clock(); setInterval(clock, 15000);

    return page;
  }

  /** Welcome window, typed out with React Bits TextType. Opened once the page has a size. */
  function welcome() {
    const w = openWin({ id: 'welcome', title: 'welcome.txt', x: 0.6, y: 0.2, body: '<div class="type-mount"></div>' }, null);
    if (w._typed) return;
    w._typed = true;
    RB.mount($('.type-mount', w), 'TextType', {
      text: ["hi! these folders are things I've built.\nclick one to open it ✿", 'tip: drag windows around by their title bar.'],
      typingSpeed: 38, pauseDuration: 2400, loop: true, cursorCharacter: '▌', className: 'win-type',
    });
  }

  let zTop = 10;
  function openWin(o, fromNode) {
    const page = built.projects;
    const wins = $('.windows', page);
    const existing = $(`.win[data-id="${o.id}"]`, wins);
    if (existing) { focus(existing); return existing; }
    const w = el(`<div class="win" data-id="${o.id}" role="dialog" aria-label="${esc(o.title)}">
      <div class="win-bar"><span class="win-dots"><i></i><i></i><i></i></span><b>${esc(o.title)}</b><button class="win-x" aria-label="Close">✕</button></div>
      <div class="win-body">${o.body}</div></div>`);
    wins.append(w);
    const pr = page.getBoundingClientRect();
    const ww = Math.min(440, pr.width - 24);
    const narrow = pr.width < 700;
    gsap.set(w, { left: narrow ? (pr.width - ww) / 2 : Math.max(12, Math.min(pr.width - ww - 12, pr.width * o.x)), top: narrow ? pr.height * (o.id === 'welcome' ? 0.66 : 0.18) : Math.max(56, pr.height * o.y), width: ww });
    focus(w);
    Draggable.create(w, { trigger: $('.win-bar', w), bounds: page, inertia: true, onPress: () => focus(w) });
    w.addEventListener('pointerdown', () => focus(w));
    $('.win-x', w).addEventListener('click', (e) => { e.stopPropagation(); closeWin(w); });

    // taskbar button
    const task = el(`<button class="task" data-id="${o.id}">${esc(o.title)}</button>`);
    task.addEventListener('click', () => focus(w));
    $('.tasks', page).append(task);
    gsap.from(task, { y: 30, duration: 0.3, ease: 'back.out(2)' });

    if (reduced()) return w;
    if (fromNode) {
      const f = rectOf(fromNode);
      gsap.from(w, Object.assign(fromRect(w, f), { autoAlpha: 0, duration: 0.5, ease: 'back.out(1.4)', clearProps: 'scale' }));
    } else {
      gsap.from(w, { scale: 0.6, autoAlpha: 0, duration: 0.45, ease: 'back.out(2)', delay: 0.5 });
    }
    return w;
  }
  function focus(w) { w.style.zIndex = ++zTop; $$('.win', w.parentNode).forEach((x) => x.classList.toggle('focused', x === w)); Sound.click(); }
  function closeWin(w) {
    const id = w.dataset.id;
    const task = $(`.task[data-id="${id}"]`, built.projects);
    const proj = id.startsWith('p') ? $(`.proj[data-i="${id.slice(1)}"]`, built.projects) : null;
    const folder = proj && $('.folder.open', proj);
    if (folder) folder.click(); // close the React Bits folder too
    gsap.to(w, Object.assign(proj && !reduced() ? (() => { const f = rectOf(proj), t = rectOf(w); return { x: '+=' + (f.cx - t.cx), y: '+=' + (f.cy - t.cy), scale: 0.1 }; })() : { scale: 0.8 },
      { autoAlpha: 0, duration: 0.35, ease: 'power2.in', onComplete: () => { w.remove(); if (task) task.remove(); } }));
  }

  function toggleWindow(i, host) {
    const page = built.projects;
    const open = $(`.win[data-id="p${i}"]`, page);
    if (open) { closeWin(open); return; }
    const p = C.projects[i];
    Sound.pop();
    const w = openWin({
      id: 'p' + i, title: p.title.replace(/\s+/g, '_') + '.exe', x: 0.36 + (i % 3) * 0.06, y: 0.14 + (i % 2) * 0.08,
      body: `<div class="proj-win">
        <div class="pw-head" style="--c:${p.color}"><span class="pw-num">${pad2(i + 1)}</span><h3 class="dec-mount"></h3></div>
        <p class="pw-blurb"></p>
        <div class="pw-tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        ${p.url ? `<a class="pw-open" href="${esc(p.url)}" target="_blank" rel="noopener">open project ↗</a>` : ''}
      </div>`,
    }, host);
    // React Bits DecryptedText for the title, GSAP ScrambleText for the blurb
    RB.mount($('.dec-mount', w), 'DecryptedText', { text: p.title, animateOn: 'view', speed: 40, maxIterations: 14, sequential: true, revealDirection: 'start', characters: '▓▒░█<>/\\*#01', className: 'dec-on', encryptedClassName: 'dec-off' });
    const blurb = $('.pw-blurb', w);
    if (reduced()) blurb.textContent = p.blurb;
    else gsap.to(blurb, { duration: 1.2, delay: 0.35, scrambleText: { text: p.blurb, chars: 'lowerCase', speed: 0.6, revealDelay: 0.2 } });
    gsap.from($$('.pw-tags span, .pw-open', w), { y: 12, autoAlpha: 0, stagger: 0.07, delay: 0.6, duration: 0.35, ease: 'back.out(2)' });
  }

  const projects = {
    async enter() {
      const page = built.projects || (built.projects = buildProjects());
      const mon = Scene.obj('monitor').el;
      Sound.powerOn();
      if (reduced()) { page.hidden = false; welcome(); return gsap.fromTo(page, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }); }
      await View.zoomTo($('.screen', mon), 1.0, 1.1);
      page.hidden = false;
      const crt = $('.crt', page);
      const tl = gsap.timeline();
      tl.set(page, { autoAlpha: 1 })
        .fromTo(crt, { scaleY: 0.006, scaleX: 0.3, filter: 'brightness(4)' }, { scaleX: 1, duration: 0.18, ease: 'power2.out' })
        .to(crt, { scaleY: 1, duration: 0.35, ease: 'power4.out' })
        .to(crt, { filter: 'brightness(1)', duration: 0.5 }, '<')
        .from($$('.proj', page), { y: 30, scale: 0.4, autoAlpha: 0, stagger: 0.07, duration: 0.5, ease: 'back.out(2.2)' }, '-=0.2')
        .from($('.taskbar', page), { yPercent: 100, duration: 0.4, ease: 'power3.out' }, '<')
        .from($('.os-title', page), { y: -30, autoAlpha: 0, duration: 0.4 }, '<0.1')
        .add(welcome, '-=0.3');
      gsap.to($('.wp-clouds', page), { x: -260, duration: 40, ease: 'none', repeat: -1, yoyo: true });
      return tl;
    },
    async exit() {
      const page = built.projects;
      $$('.win', page).filter((w) => w.dataset.id !== 'welcome').forEach((w) => closeWin(w));
      Sound.powerOff();
      if (!reduced()) {
        const crt = $('.crt', page);
        await gsap.timeline()
          .to(crt, { scaleY: 0.006, filter: 'brightness(5)', duration: 0.28, ease: 'power3.in' })
          .to(crt, { scaleX: 0, duration: 0.2, ease: 'power3.in' })
          .set(page, { autoAlpha: 0 })
          .set(crt, { clearProps: 'all' });
        page.hidden = true;
        await View.unzoom(0.9);
      } else {
        await gsap.to(page, { autoAlpha: 0, duration: 0.25 });
        page.hidden = true;
      }
    },
  };

  // ================================================================== EXPERIENCE
  let exp = { i: 0, spin: null, playing: true, timer: null, sec: 0 };
  function buildExperience() {
    const stars = Array.from({ length: 34 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${(i * 53) % 100}%;--d:${(i % 5) * 0.4}s"></i>`).join('');
    const page = el(`<section class="page page-exp" aria-label="Experience" hidden>
      <div class="exp-bg"><div class="exp-stars">${stars}</div></div>
      <div class="exp-wrap">
        <div class="disc-zone">
          <div class="circ-mount"></div>
          <div class="big-cd" title="drag to scratch">${Art.cd(440)}</div>
          <div class="cd-label"><b>${esc(C.short)}'s</b><span>greatest hits</span></div>
        </div>
        <div class="player">
          <div class="lcd">
            <div class="lcd-row"><span class="lcd-track">TRACK 01</span><span class="lcd-time">00:00</span></div>
            <div class="lcd-title"></div>
            <div class="lcd-prog"><i></i></div>
          </div>
          <div class="viz">${Array.from({ length: 28 }, () => '<i></i>').join('')}</div>
          <ol class="tracks">${C.experience.map((e, i) => `<li><button data-i="${i}"><span class="t-n">${pad2(i + 1)}</span><span class="t-name"><b>${esc(e.role)}</b> <em>${esc(e.org)}</em></span><span class="t-len">${e.len}</span></button></li>`).join('')}</ol>
          <div class="liner" aria-live="polite"><h3></h3><p class="liner-when"></p><p class="liner-text"></p><ul class="liner-points"></ul><a class="liner-link" target="_blank" rel="noopener"></a></div>
          <div class="controls">
            <button class="c-prev" aria-label="Previous track">⏮</button>
            <button class="c-play" aria-label="Pause">⏸</button>
            <button class="c-next" aria-label="Next track">⏭</button>
            <div class="vol-mount"></div>
          </div>
        </div>
      </div>
      <button class="page-close eject">⏏ eject</button>
    </section>`);
    document.body.append(page);

    RB.mount($('.circ-mount', page), 'CircularText', { text: '✦ NOW PLAYING ✦ EXPERIENCE ✦ ' + C.short.toUpperCase() + "'S DESK ", spinDuration: 24, onHover: 'speedUp', className: 'exp-circ' });
    RB.mount($('.vol-mount', page), 'ElasticSlider', { defaultValue: 50, maxValue: 100, leftIcon: RB.html('🔈', 'vol-ico'), rightIcon: RB.html('🔊', 'vol-ico'), onChange: (v) => Sound.setVolume(v / 100) });

    $$('.tracks button', page).forEach((b) => b.addEventListener('click', () => playTrack(+b.dataset.i, true)));
    $('.c-prev', page).addEventListener('click', () => playTrack((exp.i - 1 + C.experience.length) % C.experience.length, true));
    $('.c-next', page).addEventListener('click', () => playTrack((exp.i + 1) % C.experience.length, true));
    $('.c-play', page).addEventListener('click', () => setPlaying(!exp.playing));
    $('.eject', page).addEventListener('click', () => go('home'));

    // spinning disc you can grab and scratch (Draggable rotation + inertia)
    const disc = $('.big-cd .disc', page);
    exp.spin = gsap.to(disc, { rotation: '+=360', duration: 3, ease: 'none', repeat: -1, paused: true });
    Draggable.create($('.big-cd', page), {
      type: 'rotation', inertia: true,
      onPress() { exp.spin.pause(); gsap.to('.viz i', { scaleY: 0.1, duration: 0.2 }); },
      onDrag() { if (Math.abs(this.deltaX) + Math.abs(this.deltaY) > 4) Sound.blip(200 + Math.random() * 300); },
      onThrowComplete() { if (exp.playing) exp.spin.play(); },
      onRelease() { if (!this.tween && exp.playing) exp.spin.play(); },
    });
    return page;
  }

  function setPlaying(on) {
    exp.playing = on;
    const page = built.experience;
    $('.c-play', page).textContent = on ? '⏸' : '▶';
    $('.c-play', page).setAttribute('aria-label', on ? 'Pause' : 'Play');
    if (on) { exp.spin.play(); viz(true); gsap.to(exp.spin, { timeScale: 1, duration: 0.6 }); }
    else { gsap.to(exp.spin, { timeScale: 0, duration: 1.2, ease: 'power2.out' }); viz(false); }
  }

  let vizTl = null;
  function viz(on) {
    const bars = $$('.viz i', built.experience);
    if (vizTl) vizTl.kill();
    if (!on || reduced()) { gsap.to(bars, { scaleY: 0.08, duration: 0.4 }); return; }
    vizTl = gsap.to(bars, { scaleY: () => gsap.utils.random(0.15, 1), duration: 0.18, ease: 'power1.inOut', stagger: { each: 0.015, from: 'center' }, repeat: -1, repeatRefresh: true });
  }

  // liner notes: role, where + when, a one-line summary, then the details
  function fillLiner(liner, e) {
    $('h3', liner).textContent = e.role;
    $('.liner-when', liner).textContent = [e.where || e.org, e.when].filter(Boolean).join(' · ');
    $('.liner-text', liner).textContent = e.text;
    $('.liner-points', liner).innerHTML = (e.points || []).map((t) => `<li>${esc(t)}</li>`).join('');
    const link = $('.liner-link', liner);
    link.hidden = !e.url;
    if (e.url) { link.href = e.url; link.textContent = '↗ ' + e.url.replace(/^https?:\/\//, '').replace(/\/$/, ''); }
    liner.scrollTop = 0;
  }

  function playTrack(i, sound) {
    const page = built.experience;
    const e = C.experience[i];
    exp.i = i; exp.sec = 0;
    if (sound) Sound.track(i);
    $$('.tracks button', page).forEach((b) => b.classList.toggle('on', +b.dataset.i === i));
    $('.lcd-track', page).textContent = 'TRACK ' + pad2(i + 1);
    const title = $('.lcd-title', page);
    const liner = $('.liner', page);
    const [m, s] = e.len.split(':').map(Number);
    const total = m * 60 + s;
    if (reduced()) {
      title.textContent = e.role + ' · ' + e.org;
      fillLiner(liner, e);
    } else {
      gsap.to(title, { duration: 0.8, scrambleText: { text: e.role + ' · ' + e.org, chars: 'upperCase', speed: 0.5 } });
      gsap.timeline()
        .to(liner, { rotationY: 90, duration: 0.2, ease: 'power2.in' })
        .add(() => fillLiner(liner, e))
        .to(liner, { rotationY: 0, duration: 0.45, ease: 'back.out(2)' })
        .from($$('.liner > *', liner), { y: 10, autoAlpha: 0, stagger: 0.06, duration: 0.3 }, '<0.1');
      gsap.fromTo($('.big-cd', page), { scale: 0.96 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, .4)' });
    }
    // fake playback clock + progress bar
    clearInterval(exp.timer);
    const prog = $('.lcd-prog i', page), time = $('.lcd-time', page);
    const tick = () => {
      if (exp.playing) exp.sec = Math.min(total, exp.sec + 1);
      time.textContent = pad2(Math.floor(exp.sec / 60)) + ':' + pad2(exp.sec % 60);
      gsap.to(prog, { scaleX: exp.sec / total, duration: 0.9, ease: 'none' });
      if (exp.sec >= total) playTrack((i + 1) % C.experience.length, false);
    };
    tick();
    exp.timer = setInterval(tick, 1000);
    if (!exp.playing) setPlaying(true);
  }

  const experience = {
    async enter() {
      const page = built.experience || (built.experience = buildExperience());
      const dm = Scene.obj('discman').el;
      page.hidden = false;
      const from = rectOf($('.disc-wrap', dm));
      const big = $('.big-cd', page);
      if (reduced()) { gsap.set(page, { autoAlpha: 1 }); exp.spin.play(); playTrack(0, false); return; }
      gsap.set(page, { autoAlpha: 1, clipPath: `circle(0px at ${from.cx}px ${from.cy}px)` });
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
      tl.to(page, { clipPath: `circle(${Math.hypot(innerWidth, innerHeight)}px at ${from.cx}px ${from.cy}px)`, duration: 1.0 })
        .from(big, Object.assign(fromRect(big, from), { scaleY: (fromRect(big, from).scale) * 0.344, rotation: -200, duration: 1.1, ease: 'power3.out' }), 0.1)
        .from($('.circ-mount', page), { scale: 0.3, autoAlpha: 0, rotation: -90, duration: 0.8, ease: 'back.out(1.6)' }, 0.7)
        .from($('.cd-label', page), { autoAlpha: 0, y: 10, duration: 0.4 }, 0.9)
        .from($('.lcd', page), { y: -30, autoAlpha: 0, duration: 0.5, ease: 'back.out(2)' }, 0.6)
        .from($$('.tracks li', page), { x: 80, autoAlpha: 0, stagger: 0.08, duration: 0.5, ease: 'back.out(1.7)' }, 0.7)
        .from($$('.viz i', page), { scaleY: 0, stagger: 0.01, duration: 0.3 }, 0.9)
        .from([$('.liner', page), $('.controls', page), $('.eject', page)], { y: 30, autoAlpha: 0, stagger: 0.1, duration: 0.4 }, 1)
        .add(() => { exp.spin.play(); exp.playing = true; viz(true); playTrack(exp.i, true); }, 1.0);
      return tl;
    },
    async exit() {
      const page = built.experience;
      clearInterval(exp.timer);
      exp.spin.pause();
      viz(false);
      const dm = Scene.obj('discman').el;
      const to = rectOf($('.disc-wrap', dm));
      if (reduced()) { await gsap.to(page, { autoAlpha: 0, duration: 0.25 }); page.hidden = true; return; }
      const big = $('.big-cd', page);
      const v = fromRect(big, to);
      await gsap.timeline({ defaults: { ease: 'power3.inOut' } })
        .to([$('.player', page), $('.circ-mount', page), $('.cd-label', page), $('.eject', page)], { autoAlpha: 0, y: 20, duration: 0.3, stagger: 0.04 })
        .to(big, { x: v.x, y: v.y, scale: v.scale, scaleY: v.scale * 0.344, rotation: '-=300', duration: 0.8 }, 0.1)
        .to(page, { clipPath: `circle(0px at ${to.cx}px ${to.cy}px)`, duration: 0.8 }, 0.25);
      page.hidden = true;
      gsap.set([big, $('.player', page), $('.circ-mount', page), $('.cd-label', page), $('.eject', page)], { clearProps: 'all' });
      gsap.set(page, { clearProps: 'clipPath' });
    },
  };

  // ================================================================== ABOUT
  function buildAbout() {
    const a = C.about;
    const doodleStar = (x, y, r) => `<path class="draw" d="${Art.starPath(x, y, r, 0.5)}" fill="none" stroke="#5f86de" stroke-width="2.4" stroke-linejoin="round"/>`;
    const stickerSrc = (inner, w, h) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>`);
    const stickers = [
      stickerSrc(`<path d="${Art.starPath(60, 60, 54, 0.5)}" fill="#9cc0f5" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><path d="${Art.starPath(60, 60, 54, 0.5)}" fill="none" stroke="#2b3a67" stroke-width="2.5" stroke-linejoin="round"/><circle cx="46" cy="44" r="8" fill="#fff" opacity=".7"/>`, 120, 120),
      stickerSrc(`<path d="${Art.heartPath(60, 60, 44)}" fill="#f4b8c8" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><path d="${Art.heartPath(60, 60, 44)}" fill="none" stroke="#2b3a67" stroke-width="2.5"/><ellipse cx="40" cy="44" rx="9" ry="6" fill="#fff" opacity=".7"/>`, 120, 120),
      stickerSrc(`<circle cx="60" cy="60" r="54" fill="#fff"/><circle cx="60" cy="60" r="50" fill="#dfe9fb" stroke="#2b3a67" stroke-width="2.5"/>${Art.pixelCat(32, 32, 8, '#2b3a67')}`, 120, 120),
      stickerSrc(`<rect x="6" y="20" width="148" height="70" rx="35" fill="#fff"/><rect x="12" y="26" width="136" height="58" rx="29" fill="#fbecb3" stroke="#2b3a67" stroke-width="2.5"/><text x="80" y="66" font-family="Arial Rounded MT Bold, Arial" font-size="26" font-weight="700" fill="#2b3a67" text-anchor="middle">hi :)</text>`, 160, 110),
    ];
    const photos = C.photos;
    const page = el(`<section class="page page-about" aria-label="About me" hidden>
      <div class="about-bg"></div>
      <div class="book">
        <div class="book-page right">
          <h3 class="hand">school</h3>
          <ul class="edu">${a.education.map((e) => `<li><b>${esc(e.school)}</b><span>${esc(e.what)}</span><em>${esc(e.when)}</em></li>`).join('')}</ul>
          <h3 class="hand">things I use</h3>
          <ul class="skills">${a.skills.map((s) => `<li><svg viewBox="0 0 24 24" width="22" height="22"><rect x="2" y="2" width="20" height="20" rx="4" fill="#fff" stroke="#2b3a67" stroke-width="2"/><path class="tick" d="M6 12l4 4 8-9" fill="none" stroke="#3d63c4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>${esc(s)}</li>`).join('')}</ul>
          <div class="stack-wrap"><div class="stack-mount"></div><p class="stack-hint">drag the photos ↻</p></div>
        </div>
        <div class="book-cover">
          <div class="face front">
            ${Art.svg(400, 520, `<rect width="400" height="520" rx="14" fill="#fbfaf4"/><rect width="400" height="520" rx="14" fill="url(#pGrid)" opacity=".6"/>
              ${Art.heart(90, 110, 30, '#9cc0f5')}${Art.heart(320, 90, 20, '#cfe0fb')}${Art.heart(280, 420, 26, '#7fa6ea')}${Art.star(80, 400, 26, '#cfe0fb')}${Art.star(210, 250, 40, 'url(#gBlueClear)')}${Art.star(340, 320, 18, '#9cc0f5')}
              <rect x="120" y="160" width="200" height="70" rx="8" fill="#fff" stroke="#2b3a67" stroke-width="2.5"/>
              <text x="220" y="206" font-family="Gaegu, cursive" font-size="36" font-weight="700" fill="#2b3a67" text-anchor="middle">about me</text>`, 'preserveAspectRatio="none"')}
          </div>
          <div class="face back book-page left">
            <h2 class="hand hello"><span class="shuffle-mount"></span></h2>
            ${Art.svg(260, 20, `<path class="draw" d="M4 12Q60 2 120 10T256 8" fill="none" stroke="#5f86de" stroke-width="3" stroke-linecap="round"/>`, 'class="underline"')}
            <div class="lines">${a.paragraphs.map((t) => `<p class="para">${esc(t)}</p>`).join('')}</div>
            ${Art.svg(120, 80, doodleStar(30, 40, 22) + doodleStar(80, 30, 14) + `<path class="draw" d="M70 60q14 10 30 -4" fill="none" stroke="#5f86de" stroke-width="2.4" stroke-linecap="round"/>`, 'class="doodles"')}
          </div>
        </div>
        <div class="spine">${Array.from({ length: 13 }, () => '<i></i>').join('')}</div>
      </div>
      <div class="sticker-layer">${stickers.map((_, i) => `<div class="sticker-slot s${i}"></div>`).join('')}</div>
      <button class="page-close close-book">✕ close notebook</button>
    </section>`);
    document.body.append(page);

    $('.close-book', page).addEventListener('click', () => go('home'));
    page._stickers = stickers;
    const cards = photos.map((s) => RB.html(Art.svg(200, 236, Art.polaroid(200, 236, s)), 'stack-card'));
    RB.mount($('.stack-mount', page), 'Stack', { cards, randomRotation: true, sensitivity: 120, sendToBackOnClick: true });
    return page;
  }

  let shuffleMounted = false;
  /** React Bits Shuffle: the greeting's letters slot-machine into place (and again on hover). */
  function mountHello(page) {
    if (shuffleMounted) return;
    RB.mount($('.shuffle-mount', page), 'Shuffle', { text: C.about.hello, tag: 'span', textAlign: 'left', shuffleTimes: 2, duration: 0.4, stagger: 0.03, triggerOnHover: true, scrollTrigger: false, className: 'hello-shuffle' });
    shuffleMounted = true;
  }
  const about = {
    async enter() {
      const page = built.about || (built.about = buildAbout());
      page.hidden = false;
      gsap.set(page, { autoAlpha: 1 });
      if (!page._stickersMounted) {
        // React Bits StickerPeel: peel on hover, drag anywhere on the page. Mounted once the page has a size.
        const L = $('.sticker-layer', page).getBoundingClientRect();
        const spots = [[0.07, 0.16], [0.86, 0.12], [0.05, 0.7], [0.84, 0.76]];
        page._stickers.forEach((src, i) => RB.mount($('.sticker-slot.s' + i, page), 'StickerPeel', {
          imageSrc: src, width: i === 3 ? 120 : 92, rotate: [20, -15, 8, -6][i], peelBackHoverPct: 25, peelBackActivePct: 40,
          shadowIntensity: 0.4, lightingIntensity: 0.08, initialPosition: { x: Math.round(L.width * spots[i][0]), y: Math.round(L.height * spots[i][1]) } }));
        page._stickersMounted = true;
      }
      const book = $('.book', page), cover = $('.book-cover', page);
      const paras = $$('.para', page), draws = $$('.draw', page), ticks = $$('.tick', page);
      // GSAP SplitText wraps the paragraphs into real lines so each one can be "written" in.
      // autoSplit re-splits after fonts load or the window resizes.
      const writeLines = () => {
        if (page._split) page._split.revert();
        page._split = SplitText.create(paras, {
          type: 'lines', linesClass: 'line', autoSplit: true,
          onSplit(self) {
            gsap.set(paras, { autoAlpha: 1 });
            return gsap.fromTo(self.lines, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.45, stagger: 0.12, ease: 'power1.inOut' });
          },
        });
      };
      if (reduced()) { gsap.set(cover, { rotationY: -180 }); mountHello(page); return gsap.from(page, { autoAlpha: 0, duration: 0.3 }); }
      const nb = Scene.obj('notebook').el;
      const from = rectOf(nb);
      gsap.set(cover, { rotationY: 0 });
      gsap.set(draws, { drawSVG: '0%' });
      gsap.set(ticks, { drawSVG: '0%' });
      gsap.set(paras, { autoAlpha: 0 });
      const startPos = (() => { const to = rectOf(book); const s = from.w / (to.w / 2); return { x: from.cx - (to.x + to.w * 0.75), y: from.cy - to.cy, scale: s, rotation: -5, rotationX: 50 }; })();
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
      tl.from($('.about-bg', page), { autoAlpha: 0, duration: 0.5 })
        .from(book, Object.assign(startPos, { duration: 1.0, transformOrigin: '75% 50%' }), 0)
        .to(cover, { rotationY: -180, duration: 1.0, ease: 'power2.inOut' }, 0.85)
        .add(() => Sound.whoosh(), 0.85)
        .add(() => mountHello(page), 1.5)
        .add(writeLines, 1.6)
        .to(draws, { drawSVG: '100%', duration: 0.7, stagger: 0.15, ease: 'power1.inOut' }, 1.7)
        .from($$('.right h3, .edu li', page), { x: 20, autoAlpha: 0, stagger: 0.1, duration: 0.4 }, 1.3)
        .from($$('.skills li', page), { x: 20, autoAlpha: 0, stagger: 0.06, duration: 0.3 }, 1.6)
        .to(ticks, { drawSVG: '100%', duration: 0.25, stagger: 0.12, ease: 'power2.out' }, 2.1)
        .from($('.stack-wrap', page), { y: 60, rotation: 10, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.6)' }, 1.8)
        .add(() => gsap.from($$('.sticker-container', page), { scale: 0, rotation: -40, stagger: 0.12, duration: 0.6, ease: 'back.out(3)', clearProps: 'transform' }), 2.0)
        .from($('.close-book', page), { y: 30, autoAlpha: 0, duration: 0.4 }, 2.1);
      return tl;
    },
    async exit() {
      const page = built.about;
      if (reduced()) { await gsap.to(page, { autoAlpha: 0, duration: 0.25 }); page.hidden = true; return; }
      const book = $('.book', page), cover = $('.book-cover', page);
      const nb = Scene.obj('notebook').el;
      const from = rectOf(nb), to = rectOf(book);
      Sound.whoosh();
      await gsap.timeline({ defaults: { ease: 'power3.inOut' } })
        .to([$('.sticker-layer', page), $('.close-book', page)], { autoAlpha: 0, duration: 0.25 })
        .to(cover, { rotationY: 0, duration: 0.7 }, 0.1)
        .to(book, { x: from.cx - (to.x + to.w * 0.75), y: from.cy - to.cy, scale: from.w / (to.w / 2), rotation: -5, rotationX: 50, transformOrigin: '75% 50%', duration: 0.8 }, 0.7)
        .to(page, { autoAlpha: 0, duration: 0.3 }, 1.25);
      page.hidden = true;
      gsap.set([book, cover, $('.sticker-layer', page), $('.close-book', page)], { clearProps: 'all' });
    },
  };

  // ================================================================== CONTACT
  let msgTl = null;
  function buildContact() {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
    const sub = { 1: 'in', 2: 'gh', 0: 'home' };
    const page = el(`<section class="page page-contact" aria-label="Contact" hidden>
      <div class="contact-bg"><div class="dots-mount"></div></div>
      <div class="phone-wrap">
        <div class="big-phone">
          <div class="bp-top">
            <div class="bp-speaker"></div>
            <div class="bp-screen">
              <div class="bp-status"><span>▂▄▆ ${esc(C.short)}</span><span class="bp-clock"></span><span>▮▮▮▯</span></div>
              <div class="bp-msgs" aria-live="polite"></div>
              <div class="bp-menu">${C.contact.map((c) => `<a href="${esc(c.url)}" target="_blank" rel="noopener" data-key="${c.key}"><b>${c.key}</b> ${esc(c.label)} ↗</a>`).join('')}<button data-key="0"><b>0</b> back to desk</button></div>
            </div>
          </div>
          <div class="bp-hinge"></div>
          <div class="bp-bottom">
            <div class="bp-nav"><button class="bp-call" aria-label="Call">📞</button><span class="bp-dpad"><i></i></span><button class="bp-end" aria-label="Hang up">⏻</button></div>
            <div class="bp-keys">${keys.map((k) => `<button data-key="${k}"><b>${k}</b>${sub[k] ? `<small>${sub[k]}</small>` : ''}</button>`).join('')}</div>
          </div>
        </div>
      </div>
      <div class="contact-notes">
        ${C.contact.map((c, i) => `<div class="magnet-slot m${i}"></div>`).join('')}
      </div>
      <button class="page-close hangup">⏻ hang up</button>
    </section>`);
    document.body.append(page);

    RB.mount($('.dots-mount', page), 'DotGrid', { dotSize: 6, gap: 26, baseColor: '#b9d2f7', activeColor: '#3d63c4', proximity: 130, shockRadius: 220, shockStrength: 4, resistance: 700, returnDuration: 1.4 });
    C.contact.forEach((c, i) => {
      RB.mount($('.magnet-slot.m' + i, page), 'Magnet', {
        padding: 80, magnetStrength: 3,
        children: `<a class="note-link n${i}" href="${esc(c.url)}" target="_blank" rel="noopener"><span class="pin"></span>${esc(c.label)} ↗<small>press ${c.key}</small></a>`,
      });
    });

    const press = (k) => {
      Sound.dtmf(k);
      const b = $(`.bp-keys [data-key="${CSS.escape(k)}"]`, page);
      if (b) gsap.fromTo(b, { scale: 0.86, backgroundColor: '#ffe59a' }, { scale: 1, backgroundColor: '#e7eefc', duration: 0.4, ease: 'back.out(3)', clearProps: 'backgroundColor' });
      const link = C.contact.find((c) => c.key === k);
      if (link) {
        const a = $(`.bp-menu [data-key="${k}"]`, page);
        gsap.fromTo(a, { backgroundColor: '#3d63c4', color: '#fff' }, { backgroundColor: 'transparent', color: '#20306a', duration: 0.8, clearProps: 'all' });
        setTimeout(() => window.open(link.url, '_blank', 'noopener'), 260);
      }
      if (k === '0') go('home');
    };
    $$('.bp-keys button', page).forEach((b) => b.addEventListener('click', () => press(b.dataset.key)));
    $('.bp-menu button', page).addEventListener('click', () => go('home'));
    $('.bp-end', page).addEventListener('click', () => go('home'));
    $('.hangup', page).addEventListener('click', () => go('home'));
    $('.bp-call', page).addEventListener('click', () => { Sound.ring(); typeMessages(true); });
    window.addEventListener('keydown', (e) => {
      if (current !== 'contact' || e.metaKey || e.ctrlKey) return;
      if (/^[0-9*#]$/.test(e.key)) press(e.key);
    });
    const clock = () => { $('.bp-clock', page).textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
    clock(); setInterval(clock, 15000);
    return page;
  }

  /** Messages appear one by one, each typed with React Bits TextType. */
  function typeMessages(again) {
    const page = built.contact;
    const box = $('.bp-msgs', page);
    const menu = $('.bp-menu', page);
    if (msgTl) msgTl.kill();
    $$('.bubble', box).forEach((b) => { const m = b.querySelector('.tt'); if (m) RB.unmount(m); });
    box.innerHTML = '';
    gsap.set(menu, { autoAlpha: 0 });
    const msgs = again ? ['calling… just kidding ☺', 'pick 1 or 2 below!'] : ['hi!! 👋', 'thanks for visiting my desk ✿', 'press a number to say hi ↓'];
    let i = 0;
    const next = () => {
      if (current !== 'contact') return;
      if (i >= msgs.length) { gsap.to(menu, { autoAlpha: 1, duration: 0.3 }); gsap.from($$('a, button', menu), { x: -16, autoAlpha: 0, stagger: 0.08, duration: 0.3 }); return; }
      const b = el('<div class="bubble"><span class="dots"><i></i><i></i><i></i></span><div class="tt"></div></div>');
      box.append(b);
      Sound.blip(1046 + i * 120);
      gsap.from(b, { scale: 0.3, autoAlpha: 0, transformOrigin: '0% 100%', duration: 0.35, ease: 'back.out(2.5)' });
      const dots = $('.dots', b);
      gsap.to($$('i', dots), { y: -4, duration: 0.25, stagger: 0.1, yoyo: true, repeat: 3 });
      const text = msgs[i++];
      gsap.delayedCall(reduced() ? 0 : 0.5, () => {
        dots.remove();
        if (reduced()) { $('.tt', b).textContent = text; next(); return; }
        // TextType doesn't report the end of its last sentence when loop is off, so time the next bubble ourselves
        RB.mount($('.tt', b), 'TextType', { text: [text], typingSpeed: 24, loop: false, showCursor: false, as: 'span' });
        const target = $('.tt', b);
        const wait = () => {
          if (current !== 'contact') return;
          if (target.textContent.length >= text.length) { msgTl = gsap.delayedCall(0.35, next); box.scrollTop = box.scrollHeight; }
          else msgTl = gsap.delayedCall(0.1, wait);
        };
        wait();
      });
      box.scrollTop = box.scrollHeight;
    };
    next();
  }

  const contact = {
    async enter() {
      const page = built.contact || (built.contact = buildContact());
      page.hidden = false;
      gsap.set(page, { autoAlpha: 1 });
      const phone = $('.big-phone', page);
      const top = $('.bp-top', page);
      if (reduced()) { typeMessages(); return; }
      const from = rectOf(Scene.obj('phone').el);
      const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
      tl.from($('.contact-bg', page), { autoAlpha: 0, duration: 0.6 })
        .from(phone, Object.assign(fromRect(phone, from), { rotation: -10, duration: 0.9 }), 0)
        .from(top, { rotationX: -160, transformOrigin: '50% 100%', duration: 0.7, ease: 'back.out(1.4)' }, 0.75)
        .add(() => Sound.powerOn(), 0.9)
        .fromTo($('.bp-screen', page), { filter: 'brightness(3) saturate(0)' }, { filter: 'brightness(1) saturate(1)', duration: 0.6 }, 1.1)
        .from($$('.magnet-slot', page), { y: 80, rotation: () => gsap.utils.random(-30, 30), autoAlpha: 0, stagger: 0.15, duration: 0.7, ease: 'back.out(1.8)' }, 1.0)
        .from($('.hangup', page), { y: 30, autoAlpha: 0, duration: 0.4 }, 1.2)
        .add(() => typeMessages(), 1.3);
      return tl;
    },
    async exit() {
      const page = built.contact;
      if (reduced()) { await gsap.to(page, { autoAlpha: 0, duration: 0.25 }); page.hidden = true; return; }
      const phone = $('.big-phone', page);
      const to = rectOf(Scene.obj('phone').el);
      const v = fromRect(phone, to);
      Sound.powerOff();
      await gsap.timeline({ defaults: { ease: 'power3.inOut' } })
        .to([$$('.magnet-slot', page), $('.hangup', page)], { autoAlpha: 0, y: 40, duration: 0.3 })
        .to($('.bp-screen', page), { filter: 'brightness(0.2)', duration: 0.25 }, 0)
        .to(phone, { x: v.x, y: v.y, scale: v.scale, rotation: -10, duration: 0.8 }, 0.15)
        .to(page, { autoAlpha: 0, duration: 0.3 }, 0.75);
      page.hidden = true;
      gsap.set([phone, $('.bp-screen', page), $$('.magnet-slot', page), $('.hangup', page), $('.bp-top', page), $('.contact-bg', page)], { clearProps: 'all' });
    },
  };

  // ================================================================== routing
  const PAGES = { projects, experience, about, contact };

  let pending = null; // a click that arrived mid-transition; run it when the current one finishes
  function flush() {
    if (!pending) return;
    const next = pending;
    pending = null;
    go(next);
  }

  async function open(name) {
    if (!PAGES[name] || current === name) return;
    if (busy) { pending = name; return; }
    busy = true;
    try {
      if (current) await closeCurrent();
      if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
      document.body.dataset.page = name;
      setMenu(name);
      gsap.killTweensOf('.obj', 'y');
      if (!reduced()) await Scene.doors[name]();
      document.body.classList.add('in-page');
      current = name;
      await PAGES[name].enter();
    } finally { busy = false; flush(); }
  }

  async function closeCurrent() {
    const name = current;
    if (!name) return;
    await PAGES[name].exit();
    current = null;
    document.body.classList.remove('in-page');
    document.body.dataset.page = 'home';
    await Scene.resetDoor(name);
  }

  async function go(name) {
    if (name === 'home' || !name) {
      if (busy) { pending = 'home'; return; }
      if (!current) return;
      busy = true;
      try {
        await closeCurrent();
        if (location.hash) history.replaceState(null, '', location.pathname + location.search);
        setMenu('home');
      } finally { busy = false; flush(); }
      return;
    }
    open(name);
  }

  function setMenu(name) {
    $$('#menu a').forEach((a) => a.classList.toggle('on', a.dataset.go === name));
  }

  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) go('home'); });
  window.addEventListener('hashchange', () => go(location.hash.slice(1) || 'home'));

  window.Pages = { open, go, get current() { return current; } };
})();
