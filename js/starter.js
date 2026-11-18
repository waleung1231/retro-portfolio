/* Starter project: a first draft of the portfolio built from the asset deck and the resume.
 * Everything here is editable in the editor. Phone and email are intentionally left out (lama, 2026-10-06).
 */
(function () {
  const INK = '#4a4049';

  window.makeStarterProject = function () {
    const deck = (window.DECK && window.DECK.assets) || [];
    const size = {};
    deck.forEach((a) => (size[a.id] = a));
    let n = 0;
    const id = (p) => p + '-' + (++n).toString(36);

    // image element; w is the width on the 1440x900 stage, height follows the asset's shape
    function img(asset, x, y, w, rotation, link, name) {
      const a = size['deck-' + asset] || { w: 100, h: 100, name: asset };
      return { id: id('el'), type: 'image', assetId: 'deck-' + asset, name: name || a.name,
        x, y, w, h: Math.round(w * a.h / a.w), rotation: rotation || 0, hidden: false, locked: false, link: link || null };
    }
    function text(t, x, y, w, h, opts) {
      opts = opts || {};
      return { id: id('el'), type: 'text', text: t, name: opts.name || t.split('\n')[0].slice(0, 24),
        font: opts.font || 'doodle', size: opts.size || 28, color: opts.color || INK, align: opts.align || 'left',
        x, y, w, h, rotation: opts.rotation || 0, hidden: false, locked: !!opts.locked, link: opts.link || null,
        effect: opts.effect || undefined };
    }
    const page = (pid, name, bg, color, elements) => ({ id: pid, name, background: { assetId: bg ? 'deck-bg-' + bg : null, color }, elements });
    const go = (pid) => ({ page: pid });
    const url = (href) => ({ url: href });
    const home = () => text('← back home', 40, 820, 220, 50, { font: 'pixel', size: 26, link: go('home'), name: 'back home' });

    const pages = [
      page('home', 'home', 'retro-room', '#9a88b4', [
        // wall
        img('cartoon-poster', 70, 50, 230, -3, go('about'), 'poster → about'),
        img('note-green-blank', 340, 80, 220, 4),
        text('hi! click around\nmy desk to explore ✿', 362, 128, 180, 100, { size: 23, rotation: 4, name: 'note text', effect: 'typewriter' }),
        img('calendar-big', 1140, 40, 230, 2),
        img('note-pink', 1010, 120, 110, -6),
        // back of the desk
        img('orchid', 60, 350, 210, 0),
        img('lava-lamp-y2k', 300, 380, 92, 0),
        img('crt-pc', 450, 196, 470, 0, go('projects'), 'computer → projects'),
        img('pc-tower', 950, 330, 185, 0),
        img('plush-penguin', 985, 228, 115, 4),
        img('noodle-cup', 1170, 488, 125, 0),
        img('juice-box', 1310, 510, 100, 6),
        // front of the desk
        img('vhs-tape', 80, 660, 260, -6, go('experience'), 'tape → experience'),
        img('puzzle-cube', 360, 700, 92, -8),
        img('retro-keyboard', 440, 640, 480, -1),
        img('tamagotchi-y2k', 950, 680, 100, 10),
        img('diary', 1100, 610, 150, 8, go('about'), 'diary → about'),
        img('flip-phone-silver', 1300, 612, 84, -14, go('contact'), 'phone → contact'),
        img('bead-bracelet', 860, 790, 90, 0),
        // labels
        text('projects', 585, 150, 200, 44, { font: 'doodle', color: '#fbf3e4', size: 36, align: 'center', link: go('projects'), effect: 'split' }),
        text('about me', 85, 288, 200, 40, { font: 'doodle', color: '#fbf3e4', size: 32, align: 'center', link: go('about'), effect: 'blur' }),
        text('experience', 95, 785, 240, 40, { font: 'doodle', color: '#3b2a22', size: 32, align: 'center', link: go('experience'), effect: 'blur' }),
        text('contact', 1240, 785, 170, 40, { font: 'doodle', color: '#3b2a22', size: 32, align: 'center', link: go('contact'), effect: 'blur' }),
      ]),
      page('about', 'about', 'pink-desk', '#efc3cf', [
        img('laptop', 60, 70, 380, -4),
        img('mug', 110, 420, 170, 6),
        img('succulent', 300, 470, 130, -4),
        img('note-green-blank', 1110, 460, 270, -5),
        text('skills:\nPython · SQL · R\nTensorFlow · OpenCV\nD3.js · Raspberry Pi', 1150, 512, 200, 160, { size: 22, rotation: -5, name: 'skills' }),
        img('planner', 470, 520, 400, 2),
        img('ereader', 1210, 90, 150, 8),
        img('washi-tape', 1000, 120, 100, -20),
        img('eraser', 920, 760, 120, 14),
        img('bead-bracelet', 300, 700, 110, 0),
        text('about me', 480, 60, 500, 80, { font: 'pixel', size: 60, effect: 'split' }),
        text("Hi, I'm Wan-Rong (Emma) Leung.\nI study Development Engineering at UC Berkeley (Master of DevEng, 2026–2027) after a B.S. in Data Science at UC San Diego (2022–2026).\n\nI like building things that mix data, hardware and people: gesture-controlled audio, a robotic flower that reacts to smiles, and tools for teams working with little or no internet.",
          480, 160, 640, 340, { size: 27, name: 'about text' }),
        home(),
      ]),
      page('projects', 'projects', 'pixel-desktop', '#aebfcd', [
        text('projects.exe', 40, 4, 300, 30, { font: 'pixel', size: 20, locked: true }),
        img('pixel-folder', 140, 140, 150, 0, url('https://waleung1231.github.io/Hand-Controlled-Bidirectional-Audio-Player/'), 'folder → audio player'),
        text('hand-controlled\naudio player', 110, 270, 210, 70, { font: 'pixel', size: 20, align: 'center' }),
        img('pixel-folder-pink', 440, 140, 150, 0, url('https://vae-rav.spwnd.dev/'), 'folder → VAE audio'),
        text('VAE audio\nscrubbing', 410, 270, 210, 70, { font: 'pixel', size: 20, align: 'center' }),
        img('pixel-folder-blue', 740, 140, 150, 0, url('https://github.com/waleung1231/Robotic-Flower'), 'folder → robotic flower'),
        text('robotic flower', 710, 270, 210, 70, { font: 'pixel', size: 20, align: 'center' }),
        img('pixel-folder', 140, 400, 150, 0, url('https://tanya301.github.io/dsc106_final_project'), 'folder → hospital viz'),
        text('hospital recovery\ndata viz', 110, 530, 210, 70, { font: 'pixel', size: 20, align: 'center' }),
        img('pixel-folder-pink', 440, 400, 150, 0, url('https://github.com/waleung1231/Bitcoin-Sentiment-Analysis'), 'folder → bitcoin'),
        text('bitcoin sentiment', 410, 530, 210, 70, { font: 'pixel', size: 20, align: 'center' }),
        img('pixel-window-error', 1000, 420, 360, 3),
        img('pixel-floppy', 1180, 150, 110, 0),
        img('pixel-trash', 1290, 760, 70, 0),
        img('pixel-progress', 760, 620, 330, 0),
        home(),
      ]),
      page('experience', 'experience', 'grid-yellow', '#fbf6e6', [
        text('experience', 520, 40, 420, 80, { font: 'pixel', size: 56, align: 'center', effect: 'decrypt' }),
        img('note-green-blank', 90, 160, 300, -4),
        text('illuminAid · PM\nSep 2026–now\nLeading a 5-person team on an offline-first projector system for classrooms.', 130, 215, 215, 200, { size: 19, rotation: -4 }),
        img('note-green-blank', 430, 180, 300, 3),
        text('UC Berkeley PIT Clinic\nData Systems Analyst\nA live project dashboard for the City of Emeryville.', 470, 235, 215, 190, { size: 19, rotation: 3 }),
        img('note-green-blank', 770, 160, 300, -2),
        text('IEEE @ UCSD\nVice Chair Internal\nCreative direction for 80+ events and a 450+ member community.', 810, 215, 215, 190, { size: 19, rotation: -2 }),
        img('note-green-blank', 1100, 190, 300, 5),
        text('Research + teaching\nHDSI Lab · Minces Lab\nTILOS bootcamp · Chadwick', 1140, 245, 215, 190, { size: 19, rotation: 5 }),
        img('walkman', 200, 560, 200, -8),
        img('cassette-clear', 470, 620, 200, 6),
        img('boombox', 720, 560, 280, 0),
        img('cds', 1060, 600, 190, -6),
        img('alarm-clock', 1260, 560, 120, 8),
        home(),
      ]),
      page('contact', 'contact', 'grid-yellow', '#fbf6e6', [
        img('mac-hello', 160, 220, 300, -4),
        img('lava-lamp-y2k', 1300, 120, 90, 0),
        img('flip-phone-silver', 1060, 260, 150, 10),
        img('candybar-phone', 1230, 420, 110, -8),
        text('say hi!', 560, 260, 320, 80, { font: 'pixel', size: 52, align: 'center', effect: 'shiny' }),
        text('LinkedIn ↗', 560, 400, 320, 50, { font: 'pixel', size: 30, align: 'center', link: url('https://linkedin.com/in/wan-rong-leung-228650271') }),
        text('GitHub ↗', 560, 470, 320, 50, { font: 'pixel', size: 30, align: 'center', link: url('https://github.com/waleung1231') }),
        img('film-camera', 560, 610, 220, 6),
        img('puzzle-cube', 900, 680, 110, -8),
        img('gamepad', 1080, 650, 220, 4),
        home(),
      ]),
    ];

    return {
      name: 'my portfolio',
      introWord: 'portfolio',
      assets: deck.map((a) => Object.assign({}, a)),
      pages,
    };
  };
})();
