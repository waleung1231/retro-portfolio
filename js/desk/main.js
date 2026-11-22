/* Boots the desk: fits the 1600x900 scene to the window, owns the "camera" (zooming into objects),
 * the menu bar, the intro loader and the global React Bits click sparks.
 */
(function () {
  const $ = (s) => document.querySelector(s);
  const W = 1600, H = 900;
  const viewport = $('#viewport'), sizer = $('#sizer'), cam = $('#cam'), stage = $('#stage');
  let scale = 1;

  // ------------------------------------------------------------ fitting
  function fit() {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const portrait = vw / vh < 0.95;
    // landscape: show the whole desk. portrait: fill the height and let people swipe sideways.
    scale = portrait ? (vh * 0.98) / H : Math.min(vw / W, vh / H);
    const sw = W * scale, sh = H * scale;
    sizer.style.width = Math.max(vw, sw) + 'px';
    sizer.style.height = vh + 'px';
    stage.style.transform = `scale(${scale})`;
    stage.style.left = Math.max(0, (vw - sw) / 2) + 'px';
    stage.style.top = Math.max(0, (vh - sh) / 2) + 'px';
    // letterbox colour matches the wall above the desk line and the desk below it
    const deskLine = Math.max(0, (vh - sh) / 2) + 600 * scale;
    document.documentElement.style.setProperty('--desk-line', deskLine + 36 + 'px');
    viewport.classList.toggle('pan', portrait);
    return portrait;
  }

  // ------------------------------------------------------------ camera
  /** Zoom the whole scene so `node` fills the window. fill < 1 leaves a margin. */
  function zoomTo(node, fill, duration) {
    const r = node.getBoundingClientRect();
    const vr = viewport.getBoundingClientRect();
    const c = cam.getBoundingClientRect();
    const k = Math.max(vr.width / r.width, vr.height / r.height) * (fill || 1);
    const rcx = r.left + r.width / 2, rcy = r.top + r.height / 2;
    const tx = vr.left + vr.width / 2 - c.left - (rcx - c.left) * k;
    const ty = vr.top + vr.height / 2 - c.top - (rcy - c.top) * k;
    return gsap.to(cam, { x: tx, y: ty, scale: k, duration: duration || 1, ease: 'power3.inOut' }).then();
  }
  function unzoom(duration) {
    return gsap.to(cam, { x: 0, y: 0, scale: 1, duration: duration || 0.9, ease: 'power3.inOut' }).then();
  }
  window.View = { zoomTo, unzoom, fit, get scale() { return scale; } };

  // ------------------------------------------------------------ menu bar
  function menu() {
    const links = [['home', '⌂ desk'], ['about', 'about'], ['projects', 'projects'], ['experience', 'experience'], ['contact', 'contact']];
    $('#menu').innerHTML = links.map(([id, label]) => `<a href="#${id === 'home' ? '' : id}" data-go="${id}"${id === 'home' ? ' class="on"' : ''}>${label}</a>`).join('');
    $('#menu').addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      e.preventDefault();
      Sound.click();
      Pages.go(a.dataset.go);
    });
    const snd = $('#soundBtn');
    const paint = () => { snd.textContent = Sound.muted ? '🔇' : '🔊'; snd.setAttribute('aria-pressed', !Sound.muted); };
    paint();
    snd.addEventListener('click', () => { Sound.toggle(); paint(); });
    $('#lampBtn').addEventListener('click', () => { if (Pages.current) Pages.go('home'); Scene.toys.lamp(); });
    const clock = () => { $('#clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
    clock(); setInterval(clock, 15000);
  }

  // ------------------------------------------------------------ intro loader
  function loader() {
    const box = $('#loader');
    const bar = $('#loaderBar');
    if (Scene.reduced) { box.remove(); return Promise.resolve(); }
    return new Promise((resolve) => {
      const words = $('#loaderText');
      RB.mount(words, 'TextType', { text: ['booting up the desk…'], typingSpeed: 40, loop: false, cursorCharacter: '▌' });
      gsap.timeline({ onComplete: resolve })
        .from('#loader .loader-win', { scale: 0.7, autoAlpha: 0, duration: 0.45, ease: 'back.out(2)' })
        .to(bar, { scaleX: 1, duration: 1.3, ease: 'steps(12)' }, 0.3)
        .to('#loader .loader-win', { scale: 0.85, y: -20, autoAlpha: 0, duration: 0.35, ease: 'back.in(2)' }, '+=0.15')
        .to(box, { autoAlpha: 0, duration: 0.35, onComplete: () => { RB.unmount(words); box.remove(); } }, '-=0.1');
    });
  }

  // ------------------------------------------------------------ view chooser (desk vs. recruiter view)
  const CHOICE_KEY = 'viewChoice';
  function getChoice() { try { return localStorage.getItem(CHOICE_KEY); } catch (e) { return null; } }
  function setChoice(v) { try { localStorage.setItem(CHOICE_KEY, v); } catch (e) { /* storage blocked: just ask again next time */ } }

  /** Ask first-time visitors how they want to look around. Resolves once it closes (or right away if not needed). */
  function chooser() {
    if (getChoice() || Pages.current) return Promise.resolve();
    return new Promise((resolve) => {
      const box = document.createElement('div');
      box.className = 'chooser';
      box.innerHTML = `
        <div class="loader-win chooser-win" role="dialog" aria-modal="true" aria-labelledby="chooserTitle" aria-describedby="chooserText">
          <div class="titlebar"><i></i><b id="chooserTitle">how do you want to look around?</b><i></i><button class="chooser-x" type="button" aria-label="Close and explore the desk">✕</button></div>
          <div class="chooser-body">
            <p id="chooserText">hi! pick whichever suits you, you can switch any time from the menu bar.</p>
            <button class="chooser-btn desk" type="button"><span class="ico" aria-hidden="true">✿</span><span>explore my desk<small>click around the interactive desk</small></span></button>
            <a class="chooser-btn simple" href="simple.html"><span class="ico" aria-hidden="true">📄</span><span>quick view for recruiters<small>everything on one plain, skimmable page</small></span></a>
          </div>
        </div>`;
      document.body.append(box);
      const win = box.querySelector('.chooser-win');
      const focusables = [...box.querySelectorAll('button, a')];
      const deskBtn = box.querySelector('.chooser-btn.desk');
      let done = false;

      function close() {
        if (done) return;
        done = true;
        setChoice('desk');
        window.removeEventListener('keydown', onKey, true);
        const finish = () => { box.remove(); resolve(); };
        if (Scene.reduced) return finish();
        gsap.timeline({ onComplete: finish })
          .to(win, { scale: 0.85, y: -20, autoAlpha: 0, duration: 0.3, ease: 'back.in(2)' })
          .to(box, { autoAlpha: 0, duration: 0.25 }, '-=0.1');
      }
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
        if (e.key === 'Tab') { // keep focus inside the window
          const i = focusables.indexOf(document.activeElement);
          const next = e.shiftKey ? (i <= 0 ? focusables.length - 1 : i - 1) : (i === focusables.length - 1 ? 0 : i + 1);
          e.preventDefault();
          focusables[next].focus();
          return;
        }
        // don't let typing reach the drawn keyboard behind the window
        e.stopPropagation();
      }
      window.addEventListener('keydown', onKey, true);
      deskBtn.addEventListener('click', () => { Sound.click(); close(); });
      box.querySelector('.chooser-x').addEventListener('click', () => { Sound.click(); close(); });
      box.querySelector('.chooser-btn.simple').addEventListener('click', () => { setChoice('simple'); });
      box.addEventListener('click', (e) => { if (e.target === box) close(); });

      if (!Scene.reduced) {
        // opacity (not autoAlpha) so the window stays focusable while it animates in
        gsap.from(box, { opacity: 0, duration: 0.3 });
        gsap.from(win, { scale: 0.7, opacity: 0, duration: 0.45, ease: 'back.out(2)' });
      }
      deskBtn.focus();
    });
  }

  // ------------------------------------------------------------ start
  async function init() {
    // ?view=desk means they picked the desk already (e.g. a link back from the simple view): remember it, skip the chooser
    const wantsDesk = new URLSearchParams(location.search).get('view') === 'desk';
    if (wantsDesk) setChoice('desk');
    document.body.dataset.page = 'home';
    document.getElementById('defs').innerHTML = Art.defs();
    Scene.build(stage);
    const portrait = fit();
    if (portrait) viewport.scrollLeft = (sizer.clientWidth - viewport.clientWidth) * 0.55;
    window.addEventListener('resize', () => { if (!Pages.current) fit(); });
    // clicking an object focuses it, and browsers like to scroll a clipped box to show focus; keep the desk put
    viewport.addEventListener('scroll', () => {
      if (viewport.scrollTop) viewport.scrollTop = 0;
      if (!viewport.classList.contains('pan') && viewport.scrollLeft) viewport.scrollLeft = 0;
    });
    stage.addEventListener('scroll', () => { stage.scrollTop = 0; stage.scrollLeft = 0; }); // older browsers without overflow: clip
    menu();
    RB.mount($('#sparks'), 'ClickSpark', { global: true, sparkColor: '#5f86de', sparkSize: 12, sparkRadius: 22, sparkCount: 9, duration: 450 });
    gsap.set(stage, { autoAlpha: 0 });
    await document.fonts.ready.catch(() => {});
    await loader();
    await Scene.entrance();
    const start = location.hash.slice(1);
    // ?view=desk (or a #page link) means they already know what they came for: skip the chooser
    if (start) Pages.open(start);
    else if (!wantsDesk) await chooser();
    const hint = $('#hint');
    gsap.fromTo(hint, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)' });
    gsap.to(hint, { autoAlpha: 0, y: 20, duration: 0.4, delay: 6 });
  }
  init();
})();
