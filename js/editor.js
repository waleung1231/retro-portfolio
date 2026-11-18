/* Layout editor: pages, shared asset library, canvas with move/resize/rotate, layers, undo, autosave. */
(function () {
  const $ = (s) => document.querySelector(s);
  const STAGE = Store.STAGE;
  const SWATCHES = ['#4a4049', '#faf5ea', '#f4ecdc', '#f3e3d3', '#e3b9b2', '#cf9a97', '#ecdba0', '#b9c9a8',
    '#8fa58a', '#a3c4bc', '#c9dbe0', '#aebfcd', '#8199ae', '#c7b9d4', '#9d8aa8', '#dccfb9'];

  let project = null;
  let pageId = null;
  let selectedId = null;
  let editingId = null;
  let filter = 'all';
  let scale = 1;
  let gesture = null;
  let pendingExternal = false;
  const history = [];
  const future = [];

  const stage = $('#stage');
  const elementsEl = $('#elements');
  const selectionEl = $('#selection');
  const wrap = $('#stageWrap');

  // ------------------------------------------------------------ helpers
  const page = () => project.pages.find((p) => p.id === pageId) || project.pages[0];
  const selected = () => (selectedId ? page().elements.find((e) => e.id === selectedId) || null : null);
  const snapshot = () => JSON.stringify(project);

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  function remember(key, value) {
    try { localStorage.setItem('editor.' + key, value); } catch (e) { /* storage blocked: fine */ }
  }
  function recall(key) {
    try { return localStorage.getItem('editor.' + key); } catch (e) { return null; }
  }

  // ------------------------------------------------------------ history + saving
  function pushHistory(snap) {
    history.push(snap || snapshot());
    if (history.length > 100) history.shift();
    future.length = 0;
  }

  /** Every edit goes through here: remember the old state for undo, change, save, redraw. */
  function commit(mutate) {
    pushHistory();
    mutate();
    scheduleSave();
    renderAll();
  }

  function restore(json) {
    project = Store.normalize(JSON.parse(json));
    if (!project.pages.some((p) => p.id === pageId)) pageId = project.pages[0].id;
    if (!selected()) selectedId = null;
    editingId = null;
    scheduleSave();
    renderAll();
  }

  function undo() {
    if (!history.length) return toast('nothing to undo');
    future.push(snapshot());
    restore(history.pop());
  }
  function redo() {
    if (!future.length) return toast('nothing to redo');
    history.push(snapshot());
    restore(future.pop());
  }

  let saveTimer = null;
  function scheduleSave() {
    $('#saveState').textContent = 'saving…';
    $('#saveState').classList.add('busy');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      saveTimer = null;
      await Store.save(project);
      $('#saveState').textContent = 'saved ✓';
      $('#saveState').classList.remove('busy');
    }, 250);
  }

  // Another window saved newer data: switch to it (after any drag in progress ends).
  async function pullExternal(updatedAt) {
    if (updatedAt <= project.updatedAt || saveTimer) return;
    if (gesture || editingId) { pendingExternal = true; return; }
    const fresh = await Store.load();
    if (!fresh || fresh.updatedAt <= project.updatedAt) return;
    project = fresh;
    if (!project.pages.some((p) => p.id === pageId)) pageId = project.pages[0].id;
    if (!selected()) selectedId = null;
    renderAll();
    $('#saveState').textContent = 'synced ✓';
  }

  // ------------------------------------------------------------ rendering
  function renderAll() {
    renderTabs();
    renderLibrary();
    renderStage();
    renderLayers();
    renderInspector();
    $('#projectName').value = project.name;
    $('#undoBtn').disabled = !history.length;
    $('#redoBtn').disabled = !future.length;
  }

  function renderTabs() {
    const nav = $('#pageTabs');
    nav.innerHTML = '';
    project.pages.forEach((p, i) => {
      const b = document.createElement('button');
      b.className = 'tab' + (p.id === pageId ? ' on' : '');
      b.title = (i === 0 ? 'home page · ' : '') + 'double-click to rename';
      b.innerHTML = (i === 0 ? '⌂ ' : '') + '<span class="tname"></span>' +
        (project.pages.length > 1 ? '<span class="x" title="Delete page">×</span>' : '');
      b.querySelector('.tname').textContent = p.name;
      b.onclick = (e) => {
        if (e.target.classList.contains('x')) return deletePage(p);
        if (p.id !== pageId) switchPage(p.id);
      };
      b.ondblclick = () => renameInline(b.querySelector('.tname'), p.name, (v) => commit(() => (p.name = v)));
      nav.append(b);
    });
  }

  function renderLibrary() {
    const grid = $('#assetGrid');
    grid.innerHTML = '';
    const used = usedAssetIds();
    const list = project.assets.filter((a) => filter === 'all' || (a.kind || 'mine') === filter);
    list.forEach((a) => {
      const b = document.createElement('button');
      b.className = 'asset' + (a.kind === 'background' ? ' bg' : '') + (used.has(a.id) ? ' in-use' : '');
      b.title = a.name + (a.kind === 'background' ? ' (click: set as page background)' : ' (click: add to page)');
      const im = document.createElement('img');
      im.src = a.src;
      im.alt = a.name;
      im.loading = 'lazy';
      b.append(im);
      const del = document.createElement('span');
      del.className = 'del';
      del.textContent = '×';
      del.title = 'Remove from library';
      b.append(del);
      b.onclick = (e) => (e.target === del ? deleteAsset(a) : useAsset(a));
      grid.append(b);
    });
    $('#libraryHint').textContent = list.length
      ? 'Click to add to the page. Backgrounds fill the page.'
      : filter === 'mine' ? 'Upload transparent PNG, WebP, GIF or SVG images.' : 'Nothing here yet.';
  }

  function renderStage() {
    const pg = page();
    Render.background(project, pg, stage);
    const existing = new Map([...elementsEl.children].map((n) => [n.dataset.id, n]));
    pg.elements.forEach((el) => {
      let box = existing.get(el.id);
      if (box) existing.delete(el.id);
      else box = Render.element(project, el);
      Render.update(project, el, box);
      box.classList.toggle('is-hidden', el.hidden);
      box.classList.toggle('locked', el.locked);
      elementsEl.append(box); // append keeps DOM order = stacking order
    });
    existing.forEach((n) => n.remove());
    renderSelection();
  }

  function renderSelection() {
    const el = selected();
    if (!el || el.hidden) { selectionEl.hidden = true; return; }
    selectionEl.hidden = false;
    Object.assign(selectionEl.style, {
      left: el.x + 'px', top: el.y + 'px', width: el.w + 'px', height: el.h + 'px',
      transform: 'rotate(' + el.rotation + 'deg)', borderWidth: 2 / scale + 'px',
    });
    selectionEl.style.setProperty('--hs', 14 / scale + 'px');
    selectionEl.classList.toggle('locked', el.locked);
  }

  function renderLayers() {
    const ol = $('#layers');
    ol.innerHTML = '';
    const els = page().elements;
    if (!els.length) {
      ol.innerHTML = '<li class="empty">This page is empty. Click an asset to add it.</li>';
      return;
    }
    [...els].reverse().forEach((el) => {
      const li = document.createElement('li');
      li.className = 'layer' + (el.id === selectedId ? ' sel' : '') + (el.hidden ? ' is-hidden' : '');
      li.dataset.id = el.id;
      const a = el.type === 'image' ? Store.assetById(project, el.assetId) : null;
      li.innerHTML = '<span class="grip" title="Drag to reorder">⋮⋮</span>' +
        (a ? '<img class="thumb" alt="">' : '<span class="thumb">Aa</span>') +
        '<span class="lname"></span>' +
        '<button class="ic eye' + (el.hidden ? '' : ' on') + '" title="' + (el.hidden ? 'Show' : 'Hide') + '">' + (el.hidden ? '◌' : '👁') + '</button>' +
        '<button class="ic lock' + (el.locked ? ' on' : '') + '" title="' + (el.locked ? 'Unlock' : 'Lock') + '">' + (el.locked ? '🔒' : '🔓') + '</button>' +
        '<button class="ic del" title="Delete from page (the asset stays in the library)">🗑</button>';
      if (a) li.querySelector('img').src = a.src;
      li.querySelector('.lname').textContent = el.name || (el.type === 'text' ? el.text : 'element');
      li.onclick = (e) => {
        if (layerDrag && layerDrag.moved) return;
        if (e.target.closest('.eye')) return commit(() => (el.hidden = !el.hidden));
        if (e.target.closest('.lock')) return commit(() => (el.locked = !el.locked));
        if (e.target.closest('.del')) return deleteElement(el.id);
        select(el.id);
      };
      li.ondblclick = (e) => {
        if (e.target.closest('.ic')) return;
        renameInline(li.querySelector('.lname'), el.name || '', (v) => commit(() => (el.name = v)));
      };
      li.onpointerdown = (e) => {
        if (e.button !== 0 || e.target.closest('.ic, input')) return;
        layerDrag = { id: el.id, y0: e.clientY, moved: false, li };
      };
      ol.append(li);
    });
  }

  // Drag a layer row up or down to change stacking order (pointer events: works with mouse and touch).
  let layerDrag = null;
  window.addEventListener('pointermove', (e) => {
    if (!layerDrag) return;
    if (!layerDrag.moved && Math.abs(e.clientY - layerDrag.y0) < 5) return;
    e.preventDefault();
    layerDrag.moved = true;
    layerDrag.li.style.opacity = '.5';
    const ol = $('#layers');
    const r = ol.getBoundingClientRect();
    if (e.clientY < r.top + 24) ol.scrollTop -= 12;
    if (e.clientY > r.bottom - 24) ol.scrollTop += 12;
    clearDropMarks();
    const rows = [...ol.querySelectorAll('.layer')];
    let target = rows.find((row) => { const b = row.getBoundingClientRect(); return e.clientY >= b.top && e.clientY <= b.bottom; });
    if (!target) target = e.clientY < r.top ? rows[0] : rows[rows.length - 1];
    if (!target || target === layerDrag.li) { layerDrag.target = null; return; }
    const b = target.getBoundingClientRect();
    layerDrag.target = target.dataset.id;
    layerDrag.above = e.clientY < b.top + b.height / 2;
    target.classList.add(layerDrag.above ? 'drop-before' : 'drop-after');
  });
  window.addEventListener('pointerup', () => {
    if (!layerDrag) return;
    const d = layerDrag;
    clearDropMarks();
    d.li.style.opacity = '';
    if (d.moved && d.target) reorder(d.id, d.target, d.above);
    setTimeout(() => (layerDrag = null), 0); // let the click handler see that this was a drag
  });

  function clearDropMarks() {
    document.querySelectorAll('.drop-before,.drop-after').forEach((n) => n.classList.remove('drop-before', 'drop-after'));
  }

  /** The list shows the front-most layer on top, so "above" in the list means later in the array. */
  function reorder(dragId, targetId, above) {
    commit(() => {
      const arr = page().elements;
      const from = arr.findIndex((e) => e.id === dragId);
      const [item] = arr.splice(from, 1);
      const t = arr.findIndex((e) => e.id === targetId);
      arr.splice(above ? t + 1 : t, 0, item);
    });
  }

  function renderInspector() {
    const box = $('#inspector');
    box.innerHTML = '';
    const el = selected();
    const add = (html) => { const d = document.createElement('div'); d.innerHTML = html; box.append(...d.childNodes); };
    const pg = page();

    if (!el) {
      add('<h2>page: <span id="ipName"></span></h2>');
      $('#ipName').textContent = pg.name;
      add('<label>background color<div class="swatches" id="bgSw"></div></label>');
      swatches($('#bgSw'), pg.background.color, (c) => commit(() => (pg.background.color = c)));
      const bgA = pg.background.assetId && Store.assetById(project, pg.background.assetId);
      add('<label>background image<div class="row"><span id="bgName"></span>' +
        (bgA ? '<button class="small" id="bgClear">remove</button>' : '') + '</div></label>');
      $('#bgName').textContent = bgA ? bgA.name : 'none (pick one under “backgrounds”)';
      if (bgA) $('#bgClear').onclick = () => commit(() => (pg.background.assetId = null));
      if (project.pages[0] !== pg) {
        add('<button class="small" id="makeHome">⌂ make this the home page</button>');
        $('#makeHome').onclick = () => commit(() => {
          project.pages.splice(project.pages.indexOf(pg), 1);
          project.pages.unshift(pg);
        });
      }
      const starterPage = window.makeStarterProject && window.makeStarterProject().pages.find((x) => x.id === pg.id);
      if (starterPage) {
        add('<button class="small" id="resetPage">↺ reset this page to the starter design</button>');
        $('#resetPage').onclick = () => {
          commit(() => { pg.background = starterPage.background; pg.elements = starterPage.elements; selectedId = null; });
          toast('Page reset to the starter design. Undo brings your version back.');
        };
      }
      add('<label>intro word (animated when the site opens)<input type="text" id="introWord" maxlength="16"></label>');
      $('#introWord').value = project.introWord;
      $('#introWord').onchange = (e) => commit(() => (project.introWord = e.target.value.trim()));
      add('<p class="hint">Tip: double-click a page tab or layer to rename it. Delete key removes the selected element.</p>');
      return;
    }

    add('<h2 id="iName"></h2>');
    $('#iName').textContent = el.name || (el.type === 'text' ? 'text' : 'element');
    if (el.locked) add('<p class="hint">🔒 Locked: unlock it in the layer list to move it. Locked elements also stay put on the site.</p>');

    // where it goes when clicked on the site
    const opts = ['<option value="">nothing</option>']
      .concat(project.pages.map((p) => '<option value="page:' + p.id + '">page: ' + escapeHtml(p.name) + '</option>'))
      .concat(['<option value="url">a web link…</option>']);
    add('<label>when clicked on the site, open<select id="linkSel">' + opts.join('') + '</select></label>');
    const sel = $('#linkSel');
    sel.value = !el.link ? '' : el.link.page ? 'page:' + el.link.page : 'url';
    if (el.link && el.link.url != null) {
      add('<label>web address<input type="url" id="linkUrl" placeholder="https://"></label>');
      $('#linkUrl').value = el.link.url;
      $('#linkUrl').onchange = (e) => commit(() => (el.link = { url: e.target.value.trim() }));
    }
    sel.onchange = () => commit(() => {
      const v = sel.value;
      el.link = !v ? null : v === 'url' ? { url: (el.link && el.link.url) || '' } : { page: v.slice(5) };
    });

    if (el.type === 'text') {
      const fxNames = { '': 'none', typewriter: 'typewriter', split: 'letters drop in', blur: 'blur in', shiny: 'shine', decrypt: 'decode' };
      add('<label>animation on the site<select id="fxSel">' + Object.keys(fxNames).map((k) => '<option value="' + k + '">' + fxNames[k] + '</option>').join('') + '</select></label>');
      $('#fxSel').value = el.effect || '';
      $('#fxSel').onchange = (e) => commit(() => (el.effect = e.target.value || undefined));
      if (el.effect === 'typewriter') add('<p class="hint">Typewriter: put a line with just --- between phrases to type several in a loop.</p>');
      add('<label>font<select id="fontSel"><option value="doodle">doodle</option><option value="pixel">pixel</option><option value="plain">plain</option></select></label>');
      $('#fontSel').value = el.font;
      $('#fontSel').onchange = (e) => commit(() => (el.font = e.target.value));
      add('<label>color<div class="swatches" id="txtSw"></div></label>');
      swatches($('#txtSw'), el.color, (c) => commit(() => (el.color = c)));
      add('<div class="row"><button class="small" data-al="left">⇤ left</button><button class="small" data-al="center">≡ center</button><button class="small" data-al="right">⇥ right</button></div>');
      box.querySelectorAll('[data-al]').forEach((b) => (b.onclick = () => commit(() => (el.align = b.dataset.al))));
      add('<p class="hint">Double-click the text on the page to type. Resize the box to change the text size.</p>');
    }
    add('<div class="row"><button class="small" id="dupBtn">⧉ duplicate</button><button class="small" id="delBtn">🗑 delete</button></div>');
    $('#dupBtn').onclick = duplicate;
    $('#delBtn').onclick = () => deleteElement(el.id);
  }

  function swatches(container, current, onPick) {
    SWATCHES.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'swatch' + (c.toLowerCase() === String(current).toLowerCase() ? ' on' : '');
      b.style.background = c;
      b.title = c;
      b.onclick = () => onPick(c);
      container.append(b);
    });
  }

  function renameInline(span, value, done) {
    const input = document.createElement('input');
    input.value = value;
    span.replaceWith(input);
    input.focus();
    input.select();
    let finished = false;
    const finish = (ok) => {
      if (finished) return;
      finished = true;
      const v = input.value.trim();
      if (ok && v && v !== value) done(v); else renderAll();
    };
    input.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); };
    input.onblur = () => finish(true);
    input.onclick = (e) => e.stopPropagation();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function fitStage() {
    const r = wrap.getBoundingClientRect();
    scale = Math.max(0.1, Math.min((r.width - 48) / STAGE.w, (r.height - 48) / STAGE.h));
    stage.style.transform = 'scale(' + scale + ')';
    stage.style.left = Math.round((r.width - STAGE.w * scale) / 2) + 'px';
    stage.style.top = Math.round((r.height - STAGE.h * scale) / 2) + 'px';
    renderSelection();
  }

  // ------------------------------------------------------------ actions
  function select(id) {
    if (editingId && editingId !== id) stopEditing();
    selectedId = id;
    renderLayers();
    renderInspector();
    renderSelection();
  }

  function switchPage(id) {
    stopEditing();
    pageId = id;
    selectedId = null;
    remember('page', id);
    renderAll();
  }

  function addPage() {
    let n = project.pages.length + 1;
    while (project.pages.some((p) => p.name === 'page ' + n)) n++;
    const p = { id: Store.uid('page'), name: 'page ' + n, background: { color: '#f4ecdc', assetId: null }, elements: [] };
    commit(() => project.pages.push(p));
    switchPage(p.id);
  }

  function deletePage(p) {
    if (project.pages.length < 2) return;
    commit(() => {
      project.pages = project.pages.filter((x) => x !== p);
      project.pages.forEach((pg) => pg.elements.forEach((e) => { if (e.link && e.link.page === p.id) e.link = null; }));
      if (pageId === p.id) { pageId = project.pages[0].id; selectedId = null; }
    });
    toast('Deleted page “' + p.name + '”. Undo brings it back.');
  }

  function usedAssetIds() {
    const s = new Set();
    project.pages.forEach((p) => {
      if (p.background.assetId) s.add(p.background.assetId);
      p.elements.forEach((e) => e.assetId && s.add(e.assetId));
    });
    return s;
  }

  function useAsset(a) {
    if (a.kind === 'background') {
      commit(() => (page().background.assetId = a.id));
      toast('background set for “' + page().name + '”');
      return;
    }
    const longest = 260;
    const ratio = (a.h || 1) / (a.w || 1);
    const w = ratio <= 1 ? longest : Math.round(longest / ratio);
    const h = Math.round(w * ratio);
    const jitter = () => Math.round((Math.random() - 0.5) * 80);
    const el = {
      id: Store.uid('el'), type: 'image', assetId: a.id, name: a.name,
      x: Math.round(STAGE.w / 2 - w / 2) + jitter(), y: Math.round(STAGE.h / 2 - h / 2) + jitter(),
      w, h, rotation: 0, hidden: false, locked: false, link: null,
    };
    commit(() => page().elements.push(el));
    select(el.id);
  }

  function addText() {
    const el = {
      id: Store.uid('el'), type: 'text', text: 'double-click to type', name: 'text', font: 'doodle', size: 36,
      color: '#4a4049', align: 'left', x: 560, y: 400, w: 340, h: 90, rotation: 0, hidden: false, locked: false, link: null,
    };
    commit(() => page().elements.push(el));
    select(el.id);
  }

  function deleteAsset(a) {
    const where = project.pages.filter((p) => p.background.assetId === a.id || p.elements.some((e) => e.assetId === a.id));
    if (where.length) return toast('“' + a.name + '” is used on: ' + where.map((p) => p.name).join(', ') + '. Remove it there first.');
    commit(() => {
      project.assets = project.assets.filter((x) => x !== a);
      if (a.id.startsWith('deck-')) project.removedDeck = (project.removedDeck || []).concat(a.id);
    });
    toast('Removed “' + a.name + '” from the library. Undo brings it back.');
  }

  /** Removes the element from the page only. The asset stays in the library. */
  function deleteElement(id) {
    if (editingId === id) editingId = null;
    commit(() => {
      page().elements = page().elements.filter((e) => e.id !== id);
      if (selectedId === id) selectedId = null;
    });
  }

  function duplicate() {
    const el = selected();
    if (!el) return;
    const copy = Object.assign(JSON.parse(JSON.stringify(el)), { id: Store.uid('el'), x: el.x + 24, y: el.y + 24, locked: false });
    commit(() => {
      const arr = page().elements;
      arr.splice(arr.indexOf(el) + 1, 0, copy);
    });
    select(copy.id);
  }

  // ------------------------------------------------------------ uploads
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('Could not read this image'));
      im.src = src;
    });
  }

  async function upload(files) {
    const added = [];
    for (const file of files) {
      if (!/^image\//.test(file.type)) { toast(file.name + ' is not an image'); continue; }
      try {
        let src = await readFile(file);
        const im = await loadImage(src);
        let w = im.naturalWidth || 300, h = im.naturalHeight || 300;
        const MAX = 1600; // keep the project file small; transparency is kept
        if (file.type !== 'image/svg+xml' && file.type !== 'image/gif' && Math.max(w, h) > MAX) {
          const k = MAX / Math.max(w, h);
          w = Math.round(w * k); h = Math.round(h * k);
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(im, 0, 0, w, h);
          src = c.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.9);
        }
        added.push({ id: Store.uid('asset'), name: file.name.replace(/\.[^.]+$/, ''), src, kind: 'mine', w, h });
      } catch (e) {
        toast(file.name + ': ' + e.message);
      }
    }
    if (!added.length) return;
    commit(() => project.assets.unshift(...added));
    filter = 'mine';
    document.querySelectorAll('#filters button').forEach((b) => b.classList.toggle('on', b.dataset.kind === 'mine'));
    renderLibrary();
    toast(added.length + ' image' + (added.length > 1 ? 's' : '') + ' added. Click to place on the page.');
  }

  // ------------------------------------------------------------ canvas gestures
  function stagePoint(e) {
    const r = stage.getBoundingClientRect();
    return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
  }
  const rad = (d) => (d * Math.PI) / 180;
  const rotateVec = (v, deg) => ({ x: v.x * Math.cos(rad(deg)) - v.y * Math.sin(rad(deg)), y: v.x * Math.sin(rad(deg)) + v.y * Math.cos(rad(deg)) });

  elementsEl.addEventListener('pointerdown', (e) => {
    const boxEl = e.target.closest('.el');
    if (editingId && boxEl && boxEl.dataset.id === editingId) return; // typing inside text
    if (!boxEl) return;
    e.preventDefault();
    const el = page().elements.find((x) => x.id === boxEl.dataset.id);
    if (!el) return;
    select(el.id);
    if (el.locked) return;
    beginGesture(e, 'move', el);
  });

  selectionEl.addEventListener('pointerdown', (e) => {
    const h = e.target.dataset.h;
    const el = selected();
    if (!h || !el || el.locked) return;
    e.preventDefault();
    e.stopPropagation();
    beginGesture(e, h === 'rot' ? 'rotate' : 'resize', el, h);
  });

  wrap.addEventListener('pointerdown', (e) => {
    if (e.target === wrap || e.target === stage || e.target === elementsEl) select(null);
  });

  function beginGesture(e, type, el, handle) {
    gesture = { type, el, handle, p0: stagePoint(e), start: Object.assign({}, el), snap: snapshot(), moved: false };
    window.addEventListener('pointermove', moveGesture);
    window.addEventListener('pointerup', endGesture, { once: true });
    window.addEventListener('pointercancel', endGesture, { once: true });
  }

  function moveGesture(e) {
    if (!gesture) return;
    const { el, start, p0 } = gesture;
    const p = stagePoint(e);
    gesture.moved = true;
    if (gesture.type === 'move') {
      let dx = p.x - p0.x, dy = p.y - p0.y;
      if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      el.x = Math.round(start.x + dx);
      el.y = Math.round(start.y + dy);
    } else if (gesture.type === 'rotate') {
      const c = { x: start.x + start.w / 2, y: start.y + start.h / 2 };
      let a = (Math.atan2(p.y - c.y, p.x - c.x) * 180) / Math.PI + 90;
      if (e.shiftKey) a = Math.round(a / 15) * 15;
      a = ((a + 540) % 360) - 180;
      el.rotation = Math.round(a * 10) / 10;
    } else {
      // Resize from a corner; the opposite corner stays where it is, even when rotated.
      const sx = gesture.handle.includes('e') ? 1 : -1;
      const sy = gesture.handle.includes('s') ? 1 : -1;
      const c0 = { x: start.x + start.w / 2, y: start.y + start.h / 2 };
      const off = rotateVec({ x: -sx * start.w / 2, y: -sy * start.h / 2 }, start.rotation);
      const anchor = { x: c0.x + off.x, y: c0.y + off.y };
      const v = rotateVec({ x: p.x - anchor.x, y: p.y - anchor.y }, -start.rotation);
      let w = Math.max(12, sx * v.x), h = Math.max(12, sy * v.y);
      if (!e.shiftKey) { // keep proportions unless Shift is held
        const k = Math.max(w / start.w, h / start.h);
        w = Math.max(12, start.w * k); h = Math.max(12, start.h * k);
      }
      const half = rotateVec({ x: sx * w / 2, y: sy * h / 2 }, start.rotation);
      el.w = Math.round(w);
      el.h = Math.round(h);
      el.x = Math.round(anchor.x + half.x - w / 2);
      el.y = Math.round(anchor.y + half.y - h / 2);
      if (el.type === 'text') el.size = Math.max(6, Math.round(start.size * Math.sqrt((w * h) / (start.w * start.h))));
    }
    const box = elementsEl.querySelector('[data-id="' + el.id + '"]');
    if (box) Render.update(project, el, box);
    renderSelection();
  }

  function endGesture() {
    window.removeEventListener('pointermove', moveGesture);
    const g = gesture;
    gesture = null;
    if (g && g.moved && JSON.stringify(g.start) !== JSON.stringify(g.el)) {
      pushHistory(g.snap);
      scheduleSave();
      renderAll();
    }
    if (pendingExternal) { pendingExternal = false; Store.load().then((p) => p && pullExternal(p.updatedAt)); }
  }

  // text editing
  elementsEl.addEventListener('dblclick', (e) => {
    const boxEl = e.target.closest('.el-text') && e.target.closest('.el');
    if (!boxEl) return;
    const el = page().elements.find((x) => x.id === boxEl.dataset.id);
    if (!el || el.locked) return;
    editingId = el.id;
    boxEl.classList.add('editing');
    const t = boxEl.querySelector('.el-text');
    t.contentEditable = 'plaintext-only';
    if (t.contentEditable !== 'plaintext-only') t.contentEditable = 'true';
    t.focus();
    document.getSelection().selectAllChildren(t);
    t.onblur = stopEditing;
    t.onkeydown = (ev) => { ev.stopPropagation(); if (ev.key === 'Escape') t.blur(); };
  });

  function stopEditing() {
    if (!editingId) return;
    const id = editingId;
    editingId = null;
    const boxEl = elementsEl.querySelector('[data-id="' + id + '"]');
    const el = page().elements.find((x) => x.id === id);
    if (!boxEl) return;
    const t = boxEl.querySelector('.el-text');
    t.contentEditable = 'false';
    t.onblur = null;
    boxEl.classList.remove('editing');
    const value = t.innerText.replace(/\n$/, '');
    if (el && value !== el.text) commit(() => { el.text = value; if (!el.name || el.name === 'text') el.name = value.split('\n')[0].slice(0, 24) || 'text'; });
    if (pendingExternal) { pendingExternal = false; Store.load().then((p) => p && pullExternal(p.updatedAt)); }
  }

  // ------------------------------------------------------------ keyboard
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || editingId;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); return e.shiftKey ? redo() : undo(); }
    if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); return redo(); }
    if (typing) return;
    const el = selected();
    if (!el) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteElement(el.id); }
    else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicate(); }
    else if (e.key.startsWith('Arrow') && !el.locked) {
      e.preventDefault();
      const d = e.shiftKey ? 10 : 1;
      commit(() => {
        if (e.key === 'ArrowLeft') el.x -= d;
        if (e.key === 'ArrowRight') el.x += d;
        if (e.key === 'ArrowUp') el.y -= d;
        if (e.key === 'ArrowDown') el.y += d;
      });
    } else if (e.key === 'Escape') select(null);
  });

  // ------------------------------------------------------------ export / import
  function exportProject() {
    const blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'project.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Saved project.json. Put it next to index.html to publish it.');
  }

  async function importProject(file) {
    try {
      const data = Store.normalize(JSON.parse(await file.text()));
      commit(() => {
        project = data;
        pageId = project.pages[0].id;
        selectedId = null;
      });
      toast('Imported ' + file.name + '. Undo brings back the previous project.');
    } catch (e) {
      toast('Could not import: ' + e.message);
    }
  }

  // ------------------------------------------------------------ wiring
  $('#addPage').onclick = addPage;
  $('#undoBtn').onclick = undo;
  $('#redoBtn').onclick = redo;
  $('#previewBtn').onclick = () => window.open('index.html?preview#' + encodeURIComponent(page().id), '_blank');
  $('#exportBtn').onclick = exportProject;
  $('#importBtn').onclick = () => $('#importFile').click();
  $('#importFile').onchange = (e) => { if (e.target.files[0]) importProject(e.target.files[0]); e.target.value = ''; };
  $('#uploadBtn').onclick = () => $('#uploadFile').click();
  $('#uploadFile').onchange = (e) => { upload([...e.target.files]); e.target.value = ''; };
  $('#addText').onclick = addText;
  $('#projectName').onchange = (e) => commit(() => (project.name = e.target.value.trim() || 'my portfolio'));
  $('#projectName').onkeydown = (e) => { if (e.key === 'Enter') e.target.blur(); };
  $('#filters').onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    filter = b.dataset.kind;
    document.querySelectorAll('#filters button').forEach((x) => x.classList.toggle('on', x === b));
    renderLibrary();
  };
  wrap.addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); wrap.classList.add('dragover'); } });
  wrap.addEventListener('dragleave', (e) => { if (e.target === wrap) wrap.classList.remove('dragover'); });
  wrap.addEventListener('drop', (e) => { e.preventDefault(); wrap.classList.remove('dragover'); upload([...e.dataTransfer.files]); });
  window.addEventListener('resize', fitStage);
  window.addEventListener('beforeunload', () => { if (saveTimer) Store.save(project); });

  async function init() {
    project = await Store.load();
    if (!project) {
      project = Store.freshProject();
      await Store.save(project);
    }
    // New pieces added to the asset deck since this project was made show up in the library.
    const removed = new Set(project.removedDeck || []);
    const have = new Set(project.assets.map((a) => a.id));
    const fresh = ((window.DECK && window.DECK.assets) || []).filter((a) => !have.has(a.id) && !removed.has(a.id));
    if (fresh.length) {
      project.assets.push(...fresh.map((a) => Object.assign({}, a)));
      await Store.save(project);
    }
    const last = recall('page');
    pageId = project.pages.some((p) => p.id === last) ? last : project.pages[0].id;
    Store.onExternalChange(pullExternal);
    renderAll();
    fitStage();
    $('#saveState').textContent = 'saved ✓';
    window.__editor = { get project() { return project; }, undo, redo, select }; // handy for debugging
  }
  init();
})();
