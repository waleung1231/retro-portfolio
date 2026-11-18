/* Project storage shared by the editor and the site.
 * - Saves the whole project to IndexedDB (autosave).
 * - Tells other open windows when it changed (BroadcastChannel), so every window shows the newest data.
 */
(function () {
  const DB_NAME = 'portfolio-editor';
  const STORE = 'kv';
  const KEY = 'project';
  const FORMAT = 'portfolio-editor';
  const STAGE = { w: 1440, h: 900 };

  const windowId = Math.random().toString(36).slice(2);
  let memoryCopy = null; // fallback when IndexedDB is unavailable (private mode, some file:// setups)

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('no indexedDB'));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function load() {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const req = db.transaction(STORE).objectStore(STORE).get(KEY);
        req.onsuccess = () => resolve(req.result ? normalize(req.result) : null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return memoryCopy ? normalize(JSON.parse(JSON.stringify(memoryCopy))) : null;
    }
  }

  async function save(project) {
    project.updatedAt = Date.now();
    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(project, KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      memoryCopy = JSON.parse(JSON.stringify(project));
    }
    if (channel) channel.postMessage({ type: 'saved', updatedAt: project.updatedAt, from: windowId });
    return project.updatedAt;
  }

  let channel = null;
  try { channel = new BroadcastChannel('portfolio-editor'); } catch (e) { /* old browser: focus check still works */ }

  /** cb(updatedAt) runs when another window saved newer data. */
  function onExternalChange(cb) {
    if (channel) channel.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'saved' && e.data.from !== windowId) cb(e.data.updatedAt);
    });
    // Safety net: when this window comes back into focus, check for newer data.
    const check = async () => {
      if (document.hidden) return;
      const p = await load();
      if (p) cb(p.updatedAt);
    };
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
  }

  /** Fill in missing fields so older or hand-edited files still open. */
  function normalize(p) {
    if (!p || typeof p !== 'object') throw new Error('Not a project file');
    if (p.format && p.format !== FORMAT) throw new Error('This file is not a portfolio editor project');
    if (!Array.isArray(p.pages) || !p.pages.length) throw new Error('The project has no pages');
    p.format = FORMAT;
    p.version = 1;
    p.name = p.name || 'my portfolio';
    p.introWord = p.introWord == null ? 'portfolio' : p.introWord;
    p.assets = Array.isArray(p.assets) ? p.assets : [];
    p.pages.forEach((pg) => {
      pg.id = pg.id || uid('page');
      pg.name = pg.name || 'page';
      pg.background = pg.background || { color: '#f4ecdc', assetId: null };
      pg.elements = Array.isArray(pg.elements) ? pg.elements : [];
      pg.elements.forEach((el) => {
        el.id = el.id || uid('el');
        el.type = el.type || 'image';
        el.rotation = +el.rotation || 0;
        el.hidden = !!el.hidden;
        el.locked = !!el.locked;
        el.link = el.link || null;
      });
    });
    p.updatedAt = p.updatedAt || 0;
    return p;
  }

  /** Brand-new project: starter content if available, else one empty page. */
  function freshProject() {
    if (window.makeStarterProject) return normalize(window.makeStarterProject());
    const deck = (window.DECK && window.DECK.assets) || [];
    return normalize({
      name: 'my portfolio',
      assets: deck.map((a) => Object.assign({}, a)),
      pages: [{ id: uid('page'), name: 'home', background: { color: '#f4ecdc', assetId: null }, elements: [] }],
    });
  }

  function assetById(project, id) {
    return project.assets.find((a) => a.id === id) || null;
  }

  window.Store = { load, save, onExternalChange, normalize, freshProject, uid, assetById, STAGE, FORMAT };
})();
