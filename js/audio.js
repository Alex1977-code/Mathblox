// Kleine Sound-Effekte, live per WebAudio erzeugt – keine Audiodateien nötig.

let ctx = null;
let muted = false;

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

// Muss aus einer Nutzer-Geste heraus aufgerufen werden (Browser-Regel)
export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
}

function tone(freq, start, dur, { type = 'square', vol = 0.12, slide = 0 } = {}) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  coin() { tone(988, 0, 0.07, { vol: 0.08 }); tone(1319, 0.07, 0.15, { vol: 0.08 }); },
  jump() { tone(330, 0, 0.16, { type: 'triangle', vol: 0.12, slide: 400 }); },
  land() { tone(140, 0, 0.06, { type: 'triangle', vol: 0.08 }); },
  right() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.18, { type: 'triangle', vol: 0.14 })); },
  wrong() { tone(220, 0, 0.18, { type: 'sawtooth', vol: 0.08 }); tone(165, 0.16, 0.3, { type: 'sawtooth', vol: 0.08 }); },
  die() { tone(440, 0, 0.4, { type: 'square', vol: 0.08, slide: -360 }); },
  open() { tone(392, 0, 0.12, { type: 'triangle' }); tone(587, 0.1, 0.25, { type: 'triangle' }); },
  click() { tone(660, 0, 0.04, { type: 'triangle', vol: 0.06 }); },
  win() {
    [523, 523, 523, 698, 880, 784, 1047].forEach((f, i) =>
      tone(f, [0, 0.12, 0.24, 0.36, 0.6, 0.78, 0.96][i], i === 6 ? 0.5 : 0.16, { type: 'triangle', vol: 0.14 }));
  },
};

export function vibrate(ms) {
  try { if (!muted && navigator.vibrate) navigator.vibrate(ms); } catch { /* nicht unterstützt */ }
}
