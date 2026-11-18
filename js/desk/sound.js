/* Tiny WebAudio synth for the desk's blips, keypad tones and CD "tracks". No audio files.
 * Sound starts only after a click (browsers require it) and can be muted from the menu bar.
 */
(function () {
  let ctx = null, master = null;
  let volume = 0.5;
  let muted = false;
  try { muted = localStorage.getItem('desk-muted') === '1'; } catch (e) { /* storage blocked */ }

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : volume * 0.35;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, gain) {
    const c = ac();
    if (!c || muted) return;
    const t = c.currentTime + (start || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // midi -> Hz

  const Sound = {
    blip(pitch) { tone(pitch || 880, 0, 0.08, 'square', 0.18); },
    pop() { tone(520, 0, 0.06, 'triangle', 0.3); tone(980, 0.04, 0.08, 'triangle', 0.2); },
    click() { tone(1800, 0, 0.025, 'square', 0.12); },
    whoosh() {
      const c = ac(); if (!c || muted) return;
      const t = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.35);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.45);
    },
    // phone keypad (real DTMF pairs)
    dtmf(k) {
      const map = { 1: [697, 1209], 2: [697, 1336], 3: [697, 1477], 4: [770, 1209], 5: [770, 1336], 6: [770, 1477], 7: [852, 1209], 8: [852, 1336], 9: [852, 1477], '*': [941, 1209], 0: [941, 1336], '#': [941, 1477] };
      const f = map[k] || [697, 1209];
      tone(f[0], 0, 0.16, 'sine', 0.22); tone(f[1], 0, 0.16, 'sine', 0.22);
    },
    ring() { for (let i = 0; i < 6; i++) { tone(i % 2 ? 1320 : 1760, i * 0.07, 0.06, 'square', 0.12); } },
    shutter() { tone(2400, 0, 0.03, 'square', 0.2); tone(600, 0.05, 0.05, 'square', 0.15); },
    powerOn() { [48, 55, 60, 64, 67, 72].forEach((n, i) => tone(N(n), i * 0.06, 0.25, 'triangle', 0.18)); },
    powerOff() { [72, 67, 60, 48].forEach((n, i) => tone(N(n), i * 0.05, 0.18, 'triangle', 0.15)); },
    coin() { tone(N(83), 0, 0.07, 'square', 0.18); tone(N(88), 0.07, 0.2, 'square', 0.18); },
    // little chiptune phrase per CD track
    track(i) {
      const scales = [[60, 64, 67, 72, 67, 64], [62, 65, 69, 74, 69, 72], [57, 60, 64, 69, 72, 76], [64, 67, 71, 76, 74, 71], [55, 59, 62, 67, 71, 74]];
      const s = scales[i % scales.length];
      s.forEach((n, j) => { tone(N(n), j * 0.11, 0.16, 'square', 0.14); if (j % 2 === 0) tone(N(n - 12), j * 0.11, 0.2, 'triangle', 0.2); });
    },
    melody() { [72, 76, 79, 84, 79, 76, 72].forEach((n, i) => tone(N(n), i * 0.12, 0.18, 'triangle', 0.18)); },
    setVolume(v) { volume = Math.max(0, Math.min(1, v)); if (master && !muted) master.gain.value = volume * 0.35; },
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem('desk-muted', muted ? '1' : '0'); } catch (e) { /* fine */ }
      if (master) master.gain.value = muted ? 0 : volume * 0.35;
      if (!muted) Sound.blip(1046);
      return muted;
    },
  };
  window.Sound = Sound;
})();
