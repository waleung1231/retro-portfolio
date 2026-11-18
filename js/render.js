/* Draws pages and elements. Used by both the editor and the public site so they always look the same. */
(function () {
  const FONTS = {
    doodle: "'Gaegu', 'Chalkboard SE', 'Comic Sans MS', cursive",
    pixel: "'Pixelify Sans', 'VT323', monospace",
    plain: "'Nunito', system-ui, sans-serif",
  };

  /** Outer box (position/size) + inner box (rotation). Keeping them apart lets the site drag the outer box. */
  function element(project, el) {
    const box = document.createElement('div');
    box.className = 'el el-' + el.type;
    box.dataset.id = el.id;
    const inner = document.createElement('div');
    inner.className = 'el-inner';
    box.append(inner);
    if (el.type === 'text') {
      const t = document.createElement('div');
      t.className = 'el-text';
      inner.append(t);
    } else {
      const im = document.createElement('img');
      im.draggable = false;
      im.alt = el.name || '';
      inner.append(im);
    }
    update(project, el, box);
    return box;
  }

  function update(project, el, box) {
    box.style.left = el.x + 'px';
    box.style.top = el.y + 'px';
    box.style.width = el.w + 'px';
    box.style.height = el.h + 'px';
    box.querySelector('.el-inner').style.transform = 'rotate(' + el.rotation + 'deg)';
    box.classList.toggle('is-link', !!el.link);
    box.dataset.fx = el.type === 'text' && el.effect ? el.effect : '';
    if (el.type === 'text') {
      const t = box.querySelector('.el-text');
      if (t.textContent !== el.text && document.activeElement !== t) t.textContent = el.text;
      t.style.fontFamily = FONTS[el.font] || FONTS.doodle;
      t.style.fontSize = el.size + 'px';
      t.style.color = el.color;
      t.style.textAlign = el.align || 'left';
    } else {
      const a = Store.assetById(project, el.assetId);
      const im = box.querySelector('img');
      const src = a ? a.src : '';
      if (im.getAttribute('src') !== src) im.setAttribute('src', src);
      box.classList.toggle('missing', !a);
    }
  }

  function background(project, page, stage) {
    const a = page.background.assetId ? Store.assetById(project, page.background.assetId) : null;
    stage.style.backgroundColor = page.background.color || '#f4ecdc';
    stage.style.backgroundImage = a ? 'url("' + a.src + '")' : 'none';
  }

  window.Render = { element, update, background, FONTS };
})();
