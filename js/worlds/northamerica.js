// Nordamerika: Hafenstadt mit Freiheitsstatue, rote Hängebrücke, Grand Canyon mit Rafting,
// Wald mit Blockhütten und Totempfählen, Prärie mit Bisons.
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal, inRects } from './common.js';
import { pathRide, part } from '../rides.js';

const G = 1; // Bodenhöhe
const xc = (z) => 44 + 5 * Math.sin(z * 0.07 + 1); // Flusslauf im Canyon
const inBay = (x, z) => x > -16 && x < 20 && z < -14;
const onIsland = (x, z) => Math.hypot(x + 7, z + 25) < 7.5;
const inCanyon = (x, z) => x > 28 && z < 12;

function height(x, z) {
  if (inCanyon(x, z) && z < 9 && Math.abs(x - xc(z)) < 3.5) return 0; // Fluss bis ins Meer
  if (inBay(x, z)) return onIsland(x, z) ? G : 0;
  const m = Math.max(Math.abs(x), Math.abs(z));
  const coast = 58.5 + 1.2 * Math.sin(x * 0.17) + 1.2 * Math.cos(z * 0.13);
  if (m > coast + 2.5) return 0;
  if (m > coast) return 0.5;
  if (inCanyon(x, z)) {
    const d = Math.abs(x - xc(z));
    const top = z > 2 ? 11 - (z - 2) * 1.6 : 11;
    const t = d < 5.5 ? G : G + 2 * Math.ceil((d - 5.5) / 2);
    return Math.max(G, Math.min(top, t));
  }
  return G;
}

const BANDS = ['#b8481f', '#d0662f', '#e39a5c', '#c4542a', '#ecb77f', '#c76a36'];
function color(x, z, h) {
  const n = Math.sin(x * 1.7 + z * 0.9) * Math.cos(z * 1.3 - x * 0.4);
  if (h <= 0.5) return '#ead9a0';
  if (inCanyon(x, z)) {
    if (h >= 11) return n > 0.3 ? '#b98a4e' : '#cc8f52';
    if (h > G) return BANDS[Math.round(h) % BANDS.length];
    return '#c68752';
  }
  if (inBay(x, z)) return Math.hypot(x + 7, z + 25) > 6.2 ? '#e6d49a' : '#79c25a';
  if (x < -16 && z < -6) return n > 0.5 ? '#9aa0a7' : '#a6abb1';
  if (x > 6 && z > 12) return n > 0.2 ? '#c9bf63' : n < -0.4 ? '#a9b65a' : '#bdb75e';
  if (x < -8 && z > -6) return n > 0.3 ? '#4f9a45' : '#5aa64c';
  return n > 0.4 ? '#69b84f' : '#74c257';
}

export const northamerica = {
  id: 'northamerica',
  name: 'Nordamerika',
  seed: 204,
  theme: {
    sky: ['#2f7fd0', '#9fd2ff', '#f2f8ff'], fog: '#d8e8f5', sea: '#2f7fc0', fogNear: 100, fogFar: 240,
    light: { hemi: 1.6, sun: 2.3, sunColor: '#fff2dc', sky: '#ffffff', ground: '#8a7a60' },
  },
  stars: { liberty: 'Freiheitsstatue', rafting: 'Canyon-Rafting', bridge: 'Hängebrücke' },
  build(w) {
    w.terrain({ x0: -64, z0: -64, cols: 64, rows: 64, cell: 2, step: 0.5, height, color });
    exitPortal(w, 53, 'worldtour');

    // ---------- Helfer ----------
    // fester Quader aus Deko-Box + unsichtbarer Kollision (billig: kein eigener Draw-Call)
    const S = (x, top, z, sx, h, sz, c, safe = false) => {
      if (c) w.box(sx, h, sz, c, x, top - h / 2, z);
      const s = { min: new THREE.Vector3(x - sx / 2, top - h, z - sz / 2), max: new THREE.Vector3(x + sx / 2, top, z + sz / 2), safe };
      w.solids.push(s);
      return s;
    };
    // Balken zwischen zwei Punkten
    const beam = (a, b, t, c) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      const hd = Math.hypot(dx, dz), L = Math.hypot(hd, dy);
      w.box(t, t, L, c, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, Math.atan2(dx, dz), -Math.atan2(dy, hd));
    };
    // Box in einem um ry gedrehten lokalen Koordinatensystem (für Tiere/Figuren aus Klötzchen)
    const rb = (cx, cy, cz, ry, lx, ly, lz, sx, sy, sz, c, rx = 0) => {
      const cs = Math.cos(ry), sn = Math.sin(ry);
      w.box(sx, sy, sz, c, cx + lx * cs + lz * sn, cy + ly, cz - lx * sn + lz * cs, ry, rx);
    };
    const P = (x, y, z) => new THREE.Vector3(x, y, z);

    // Wege, Laternen, Blumen auf Bodenhöhe G (die w.path/lamp/flowers-Varianten liegen auf y = 0)
    const path = (x1, z1, x2, z2, wd, c) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      w.box(wd, 0.06, len + wd, c, (x1 + x2) / 2, G + 0.03, (z1 + z2) / 2, Math.atan2(x2 - x1, z2 - z1));
    };
    const lamp = (x, z) => {
      w.box(0.25, 3.2, 0.25, '#2d3440', x, G + 1.6, z);
      w.box(0.6, 0.6, 0.6, '#fff4c2', x, G + 3.4, z);
      w.box(0.8, 0.15, 0.8, '#2d3440', x, G + 3.78, z);
    };
    const flowers = (cx, cz, wd, dd, n, cols) => {
      for (let i = 0; i < n; i++) {
        const x = cx + w.r(-wd / 2, wd / 2), z = cz + w.r(-dd / 2, dd / 2);
        w.box(0.08, 0.4, 0.08, '#3c8c3c', x, G + 0.2, z);
        w.box(0.3, 0.2, 0.3, w.pick(cols), x, G + 0.48, z);
      }
    };

    // ---------- Wege & Promenade ----------
    path(0, 50, 0, -13, 4, '#d9cdb4');
    path(0, 6, 30, 6, 3, '#d9cdb4');
    path(30, 6, 46, 12, 3, '#d9cdb4');
    path(0, 22, -24, 22, 3, '#c9b48a');
    path(0, 28, 26, 28, 3, '#d9cdb4');
    path(0, -8, -18, -8, 3, '#bfc3c8');
    w.box(36, 0.08, 3.4, '#cfc7b8', 2, G + 0.04, -12.3); // Hafenpromenade
    w.box(3.4, 0.08, 40, '#cfc7b8', -17.7, G + 0.04, -34);
    // Geländer am Hafenbecken (fest, mit Lücke für den Steg)
    S(-7.25, G + 1, -14.2, 17.5, 1, 0.25, '#e8e8e8');
    S(11.75, G + 1, -14.2, 16.5, 1, 0.25, '#e8e8e8');
    S(-16.2, G + 1, -36, 0.25, 1, 44, '#e8e8e8');
    S(20.2, G + 1, -36, 0.25, 1, 44, '#e8e8e8');
    for (let x = -15; x <= 19; x += 2.5) if (Math.abs(x - 2) > 2) w.box(0.3, 1.2, 0.3, '#5a6270', x, G + 0.6, -14.2);
    w.sign('Nordamerika', -6, 6.2, 30, { bg: '#1d7a6a', size: 1.4 });
    w.sign('Willkommen!', -6, 4.8, 30, { bg: '#ffffff', fg: '#17233b', size: 0.9 });
    w.box(0.3, 4.4, 0.3, '#5b3a1e', -9, G + 2.2, 30);
    w.box(0.3, 4.4, 0.3, '#5b3a1e', -3, G + 2.2, 30);
    for (const z of [26, 14, 2, -8]) { lamp(-2.8, z); lamp(2.8, z); }
    flowers(-6, 40, 5, 8, 24, ['#ff595e', '#ffd23f', '#ffffff']);
    flowers(6, 40, 5, 8, 24, ['#ff595e', '#ffd23f', '#ffffff']);

    // ---------- Ahornbäume (Kanada) ----------
    const maple = (x, z, s = 1) => {
      const y = w.heightAt(x, z);
      const c1 = w.pick(['#d9472b', '#e8622a', '#f08a24', '#c93a2a']), c2 = w.pick(['#f0a030', '#e8b33a', '#e8622a']);
      w.box(0.7 * s, 2.6 * s, 0.7 * s, '#6b4423', x, y + 1.3 * s, z);
      w.box(3.4 * s, 2.4 * s, 3.4 * s, c1, x, y + 3.6 * s, z);
      w.box(2.4 * s, 1.3 * s, 2.4 * s, c2, x, y + 5.3 * s, z);
      w.box(1.4 * s, 0.9 * s, 1.4 * s, c1, x + 1.2 * s, y + 4.6 * s, z - 0.8 * s);
      w.solids.push({ min: P(x - 0.35 * s, y, z - 0.35 * s), max: P(x + 0.35 * s, y + 3 * s, z + 0.35 * s) });
    };
    for (const [x, z] of [[-15, 46], [15, 47], [-16, 36], [9, 16], [-9, 14], [14, 0], [20, -6], [8, -6], [-11, 2], [24, 16], [-12, 48]]) maple(x, z, w.r(0.9, 1.15));

    // ---------- Großstadt am Hafen ----------
    const street = (x1, z1, x2, z2) => {
      w.box(Math.abs(x2 - x1) || 4, 0.07, Math.abs(z2 - z1) || 4, '#4b5058', (x1 + x2) / 2, G + 0.04, (z1 + z2) / 2);
      const n = Math.floor(Math.max(Math.abs(x2 - x1), Math.abs(z2 - z1)) / 3);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        w.box(x1 === x2 ? 0.15 : 1.2, 0.08, x1 === x2 ? 1.2 : 0.15, '#f2f2f2', x1 + (x2 - x1) * t, G + 0.05, z1 + (z2 - z1) * t);
      }
    };
    street(-46, -50, -46, -12); street(-34, -50, -34, -12); street(-58, -38, -20, -38); street(-58, -26, -20, -26); street(-58, -12, -18, -12);
    const tower = (x, z, wd, dd, h, wall, win = '#bfe3ff') => w.house(x, z, wd, dd, h, { wall, window: win, roof: 'flat', roofColor: '#6b7480', door: 's', y: G });
    tower(-52, -44, 7, 7, 16, '#b5654a', '#ffe9b0');
    tower(-28, -42, 7, 6, 20, '#7fa8c9');
    tower(-52, -32, 8, 7, 12, '#d8c9a8');
    tower(-28, -32, 6, 6, 23, '#6f8fb0');
    tower(-52, -20, 7, 7, 10, '#c4a484', '#ffe9b0');
    tower(-40, -20, 6, 6, 14, '#9bb8d3');
    tower(-28, -20, 6, 6, 18, '#8fa9bf');
    tower(-54, -54, 6, 5, 9, '#b07a5a', '#ffe9b0');
    // Wolkenkratzer mit Stufen und Spitze (Empire-State-artig)
    tower(-40, -32, 8, 8, 16, '#d6cbb5', '#ffe9b0');
    w.box(6, 8, 6, '#d6cbb5', -40, G + 20, -32);
    w.box(4, 6, 4, '#cfc4ad', -40, G + 27, -32);
    w.box(2.4, 2.5, 2.4, '#cfc4ad', -40, G + 31.2, -32);
    w.box(0.5, 6, 0.5, '#e8e8e8', -40, G + 35.4, -32);
    for (let y = 17; y < 30; y += 2) for (const s of [-1, 1]) {
      const half = y < 24 ? 3.02 : 2.02;
      w.box(half * 2 - 1, 0.9, 0.05, '#ffe9b0', -40, G + y, -32 + s * half);
      w.box(0.05, 0.9, half * 2 - 1, '#ffe9b0', -40 + s * half, G + y, -32);
    }
    // Silberner Turm mit Krone (Chrysler-artig)
    tower(-40, -44, 6, 6, 26, '#c9ced6');
    for (let i = 0; i < 4; i++) {
      const s = 4.6 - i * 1.1;
      w.box(s, 1.4, s, i % 2 ? '#e8ecf0' : '#b9c0c8', -40, G + 26.7 + i * 1.4, -44);
      w.box(s * 0.6, 0.8, s + 0.06, '#2b3440', -40, G + 26.7 + i * 1.4, -44);
    }
    w.box(0.35, 5, 0.35, '#e8ecf0', -40, G + 34.6, -44);
    // Wassertürme auf Dächern
    for (const [x, z, h] of [[-52, -32, 12], [-52, -20, 10]]) {
      w.box(1.8, 1.8, 1.8, '#8a5a33', x + 1.5, G + h + 2.3, z + 1.5);
      w.box(2, 0.6, 2, '#5b3a1e', x + 1.5, G + h + 3.4, z + 1.5);
      for (const [a, b] of [[0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]) w.box(0.15, 1.4, 0.15, '#5b3a1e', x + 1.5 + a, G + h + 0.7, z + 1.5 + b);
    }
    w.sign('Großstadt', -34, 5.5, -9, { bg: '#e0a800', fg: '#17233b', size: 1.1 });
    // Gelbe Taxis fahren um die Häuserblöcke
    const taxiLoop = (pts, offset, speed) => {
      const car = new THREE.Group();
      part(car, 1.5, 0.6, 2.8, '#ffc20e', 0, 0.55, 0);
      part(car, 1.3, 0.5, 1.5, '#2b3440', 0, 1.1, -0.1);
      part(car, 1.36, 0.12, 1.56, '#ffc20e', 0, 1.4, -0.1);
      part(car, 0.6, 0.25, 0.25, '#ffffff', 0, 1.58, -0.1);
      w.add(car);
      const segs = pts.map((p, i) => [p, pts[(i + 1) % pts.length]]);
      const lens = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
      const total = lens.reduce((a, b) => a + b, 0);
      w.updaters.push((dt, t) => {
        let s = (t * speed + offset) % total, k = 0;
        while (s > lens[k]) { s -= lens[k]; k++; }
        const [a, b] = segs[k], f = s / lens[k];
        car.position.set(a[0] + (b[0] - a[0]) * f, G, a[1] + (b[1] - a[1]) * f);
        car.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
      });
    };
    taxiLoop([[-45, -37], [-21, -37], [-21, -25], [-45, -25]], 0, 6);
    taxiLoop([[-45, -37], [-21, -37], [-21, -25], [-45, -25]], 36, 6);
    taxiLoop([[-35, -25], [-35, -13], [-57, -13], [-57, -25]], 10, 5);

    // ---------- Hängebrücke über die Hafeneinfahrt ----------
    const RED = '#c8402c', RED2 = '#a8321f', BZ = -50, DECK = 4.5;
    S(2, DECK, BZ, 46, 0.8, 4.4, null, true); // Fahrbahn x -21 … 25
    w.box(46, 0.1, 4.4, '#4a4f57', 2, DECK - 0.04, BZ);
    for (let x = -20; x <= 24; x += 3) w.box(1.4, 0.11, 0.15, '#ffd23f', x, DECK - 0.02, BZ);
    for (const s of [-1, 1]) {
      w.box(46, 1.3, 0.3, RED, 2, DECK - 1.2, BZ + s * 2.1);
      for (let x = -20; x <= 24; x += 2) w.box(0.18, 1.3, 0.18, RED2, x, DECK - 1.2, BZ + s * 2.1, 0, 0, 0.6 * (x % 4 ? 1 : -1));
    }
    // Geländer mit Lücken (Treppe Ost, Pfeiler-Aufstieg)
    S(2, DECK + 1, BZ - 2.1, 46, 1, 0.2, '#e0e0e0');
    S(-4.5, DECK + 1, BZ + 2.1, 33, 1, 0.2, '#e0e0e0');
    S(19, DECK + 1, BZ + 2.1, 6, 1, 0.2, '#e0e0e0');
    S(25, DECK + 1, BZ, 0.2, 1, 4.4, '#e0e0e0');
    // Treppe West (Richtung Stadt) und Ost (nach Süden)
    for (let k = 0; k < 6; k++) {
      const top = DECK - 0.5 * (k + 1);
      S(-21.65 - 1.3 * k, top, BZ, 1.3, top - G + 0.5, 4.4, k % 2 ? '#b9b2a6' : '#c9c2b6', true);
      S(23.5, top, BZ + 2.85 + 1.3 * k, 3, top - G + 0.5, 1.3, k % 2 ? '#b9b2a6' : '#c9c2b6', true);
    }
    // Pfeiler (Türme)
    const towerTop = 24;
    for (const tx of [-7.5, 11.5]) {
      for (const s of [-1, 1]) {
        S(tx, towerTop + 0.6, BZ + s * 3.2, 1.6, towerTop + 1.6, 1.6, RED);
        for (let y = 2; y < towerTop; y += 3) w.box(1.7, 0.2, 1.7, RED2, tx, y, BZ + s * 3.2);
      }
      for (const y of [11, 17]) w.box(1.2, 1.4, 5, RED, tx, y, BZ);
      if (tx < 0) w.box(1.4, 1.4, 8, RED, tx, towerTop - 0.4, BZ);
    }
    S(11.5, towerTop, BZ, 2.4, 1, 8, RED2, true); // Plattform oben auf dem Ostpfeiler
    w.star('bridge', 11.5, towerTop, BZ, 'Hängebrücke');
    // Tragseile mit Hängern
    for (const s of [-1, 1]) {
      const cz = BZ + s * 3.2;
      const cy = (x) => (x < -7.5 ? 2.5 + (towerTop + 0.8 - 2.5) * (x + 24) / 16.5
        : x > 11.5 ? 2.5 + (towerTop + 0.8 - 2.5) * (27 - x) / 15.5
          : 6.2 + (towerTop + 0.8 - 6.2) * ((x - 2) / 9.5) ** 2);
      let prev = null;
      for (let x = -24; x <= 27.01; x += 1.5) {
        const p = [x, cy(x), cz];
        if (prev) beam(prev, p, 0.35, RED);
        prev = p;
        if (x > -21 && x < 25 && Math.abs(x + 7.5) > 1 && Math.abs(x - 11.5) > 4) w.box(0.08, cy(x) - DECK, 0.08, RED2, x, (cy(x) + DECK) / 2, cz - s * 0.9);
      }
    }
    for (const x of [-24, 27]) w.box(3, 3, 8, '#b9b2a6', x, 2.5, BZ);
    // Pfeiler-Aufstieg: Plattformen rund um den Ostpfeiler
    const climb = [[14.4, -45.4], [11.5, -44], [8.6, -45.4], [8.6, -48.2], [8.6, -51], [8.6, -53.8], [10, -56.4], [13, -56.4],
      [14.4, -53.8], [14.4, -51], [14.4, -48.2], [14.4, -45.4], [11.5, -44], [8.6, -45.4], [8.6, -48.2], [8.6, -51]];
    climb.forEach(([x, z], i) => {
      const top = DECK + 1.15 * (i + 1);
      S(x, top, z, 1.8, 0.5, 1.8, i % 2 ? '#e8e2d8' : '#ffb03a');
      if (i % 4 === 2) w.coin(x, top, z);
    });
    w.sign('Pfeiler-Aufstieg', 15, DECK + 3.4, BZ + 2.4, { bg: RED, size: 0.75 });
    w.sign('Hängebrücke', -26, 8, BZ + 3, { bg: RED, size: 1 });
    w.coinLine(-18, BZ, 22, BZ, 8, DECK);
    // Schlepper fährt unter der Brücke hin und her
    const tug = new THREE.Group();
    part(tug, 2.2, 0.9, 4.4, '#e8262b', 0, 0, 0);
    part(tug, 2.3, 0.2, 4.5, '#ffffff', 0, 0.5, 0);
    part(tug, 1.6, 1.2, 1.6, '#ffffff', 0, 1.2, -0.4);
    part(tug, 0.5, 1.2, 0.5, '#222222', 0, 2.2, -0.4);
    tug.position.set(0, -0.6, -44);
    w.add(tug);
    w.updaters.push((dt, t) => {
      const u = Math.sin(t * 0.12);
      tug.position.x = 2 + u * 13;
      tug.rotation.y = Math.cos(t * 0.12) > 0 ? Math.PI / 2 : -Math.PI / 2;
      tug.rotation.z = Math.sin(t * 2) * 0.03;
    });

    // ---------- Freiheitsstatue auf der Insel ----------
    const SX = -7, SZ = -25, GREEN = '#5fb8a0', GREEN2 = '#4ea08a';
    S(SX, G, -16, 3, 1.2, 4.6, '#a0764e', true); // Steg zur Insel
    for (let z = -17.5; z <= -14.5; z += 1) w.box(3.1, 0.08, 0.15, '#7a5230', SX, G + 0.02, z);
    for (let z = -17; z <= -15; z += 2) for (const s of [-1, 1]) w.box(0.3, 2.6, 0.3, '#6b4423', SX + s * 1.6, -0.2, z);
    w.enclosure({ x: SX, z: SZ, w: 12, d: 12, side: 's', h: 4.4, y: G, color: '#c9bfae', label: 'Freiheitsstatue', cap: '#b5ab99' });
    // Treppe innen am Sockel
    [[4.5, -27.8], [6.3, -28.6], [6.3, -30.4], [6.3, -32.2], [6.3, -34], [6.3, -35.8]].forEach(([x, z], i) => {
      S(x + SX - 2, G + 1 + i, z + SZ + 32, 1.8, 1 + i, 1.8, i % 2 ? '#d8cfbe' : '#c9bfae');
    });
    // Sockel
    S(SX, 8, SZ, 6, 7, 6, '#d8cfbe', true);
    w.box(6.6, 0.5, 6.6, '#c9bfae', SX, 7.8, SZ);
    w.box(6.4, 0.4, 6.4, '#c9bfae', SX, G + 0.2, SZ);
    for (const s of [-1, 1]) { w.box(3.2, 3.2, 0.1, '#bfb5a2', SX, 4.6, SZ + s * 3.02); w.box(0.1, 3.2, 3.2, '#bfb5a2', SX + s * 3.02, 4.6, SZ); }
    // Statue (Blick nach Süden; rechter Arm mit Fackel auf der Westseite)
    S(SX, 19, SZ, 3.2, 11, 3.2, null);
    w.box(3.6, 4, 3.6, GREEN, SX, 10, SZ);
    w.box(3.2, 4, 3.2, GREEN, SX, 14, SZ);
    w.box(2.8, 3, 2.6, GREEN, SX, 17.5, SZ);
    for (let i = -1; i <= 1; i++) w.box(0.25, 8, 0.1, GREEN2, SX + i * 0.9, 12, SZ + 1.82);
    w.box(3.0, 0.8, 2.8, GREEN2, SX, 18.6, SZ, 0, 0, 0.25); // Schärpe
    w.box(0.8, 0.8, 0.8, GREEN, SX, 19.3, SZ);
    w.box(1.6, 1.8, 1.6, GREEN, SX, 20.5, SZ);
    w.box(1.2, 0.5, 0.1, '#79c9b2', SX, 20.6, SZ + 0.82);
    for (const s of [-1, 1]) w.box(0.18, 0.18, 0.05, '#2f6f60', SX + s * 0.35, 20.8, SZ + 0.83);
    w.box(1.8, 0.4, 1.8, GREEN2, SX, 21.5, SZ);
    for (let i = 0; i < 7; i++) {
      const a = (i - 3) * 0.45;
      w.box(0.22, 1.3, 0.22, GREEN, SX + Math.sin(a) * 0.95, 22.1, SZ + Math.cos(a) * 0.95, 0, Math.cos(a) * 0.5, -Math.sin(a) * 0.5);
    }
    w.box(0.9, 6, 0.9, GREEN, SX - 1.7, 22, SZ, 0, 0, 0.06); // rechter Arm
    w.box(0.6, 1.6, 0.6, '#c9a24a', SX - 1.6, 24.6, SZ);
    S(SX - 1.6, 25.5, SZ, 2, 0.6, 2, '#d8b45a');
    w.cone(0.55, 1.1, '#ff9a1f', SX - 1.6, 25.5, SZ, { emissive: '#c25a00', opacity: 0.85, shadow: false });
    w.star('liberty', SX - 1.6, 25.5, SZ, 'Freiheitsstatue');
    w.box(0.5, 2.0, 1.3, '#9fd6c4', SX + 1.9, 16.6, SZ + 0.6, 0, -0.3, 0.1); // Tafel
    w.box(0.7, 0.7, 2.2, GREEN, SX + 1.6, 16, SZ + 0.2, 0, 0.6);
    // Kletter-Plattformen rund um die Statue
    for (let i = 1; i <= 15; i++) {
      const a = 2.0 + Math.PI * 4 - (15 - i) * 0.8, top = 8 + 1.1 * i;
      const x = SX + Math.cos(a) * 3, z = SZ + Math.sin(a) * 3;
      S(x, top, z, 1.6, 0.5, 1.6, i % 2 ? '#79c9b2' : '#d8b45a');
      if (i % 5 === 3) w.coin(x, top, z);
    }
    w.coinLine(SX, -14.5, SX, -17, 2, G);

    // ---------- Grand Canyon mit Rafting ----------
    for (let z = 4; z > -58; z -= 5) { // Stromschnellen
      w.box(1.6, 0.08, 0.9, '#ffffff', xc(z) + w.r(-1.5, 1.5), -0.74, z, w.r(0, 3));
      w.box(0.8, 0.08, 0.6, '#e8f6ff', xc(z) + w.r(-2, 2), -0.73, z - 2, w.r(0, 3));
    }
    for (let i = 0; i < 40; i++) { // Wüstensträucher auf dem Plateau
      const x = w.r(30, 57), z = w.r(-56, 0);
      const h = w.heightAt(x, z);
      if (h < 10.9) continue;
      const s = w.r(0.5, 1.1);
      w.box(s * 1.3, s * 0.8, s * 1.2, w.pick(['#7d8f4a', '#6b7f3f', '#8c9a55']), x, h + s * 0.4, z, w.r(0, 3));
    }
    const st = w.station(xc(11), 11, 'Rafting', '#e8622a', G);
    w.sign('Grand Canyon', xc(11) - 6, G + 5, 13, { bg: '#c4542a', size: 1.1 });
    const raft = new THREE.Group();
    for (const s of [-1, 1]) {
      part(raft, 0.6, 0.6, 3.4, '#ffb000', s * 1.05, 0.1, 0);
      part(raft, 2.7, 0.6, 0.6, '#ffb000', 0, 0.1, s * 1.45);
      part(raft, 0.12, 0.1, 1.8, '#7a4a2a', s * 1.5, 0.45, 0.6).rotation.z = s * 0.6;
    }
    part(raft, 1.6, 0.12, 2.4, '#2f5fd6', 0, -0.1, 0);
    part(raft, 0.5, 0.6, 0.5, '#e8262b', 0, 0.35, 0.9);
    part(raft, 0.42, 0.25, 0.42, '#ffd23f', 0, 0.75, 0.9);
    const pts = [];
    for (let z = 6.5; z > -62; z -= 4) pts.push([xc(z), -0.55, z]);
    pts.push([xc(-62) - 1, -0.55, -67], [xc(-62) - 4, -0.55, -73]);
    w.addRide(pathRide(w, {
      points: pts, closed: false, duration: 24, vehicle: raft, seat: [0, -0.15, -0.45], flat: true,
      name: 'Canyon-Rafting', starId: 'rafting', station: st, exit: P(xc(11) - 3.6, G, 12.5), idle: 'wait',
      animate(v, t) { v.rotateZ(Math.sin(t * 3.1) * 0.07); v.rotateX(Math.sin(t * 2.3) * 0.04); v.position.y += Math.sin(t * 4) * 0.06; },
    }));
    w.coinLine(30, 6, 44, 11, 5, G);

    // ---------- Prärie ----------
    for (let i = 0; i < 90; i++) {
      const x = w.r(9, 56), z = w.r(14, 56);
      if (inRects(x, z, [[14, 22, 26, 34], [36, 38, 46, 50], [6, 26, 30, 30]])) continue;
      w.box(0.5, w.r(0.3, 0.6), 0.12, w.pick(['#a9b84e', '#c4c05a', '#8faa48']), x, G + 0.2, z, w.r(0, 3));
    }
    // Pferdekoppel
    const rail = (x1, z1, x2, z2) => {
      const len = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(x2 - x1, z2 - z1);
      for (const y of [0.6, 1.1]) w.box(0.12, 0.12, len, '#8a5a33', (x1 + x2) / 2, G + y, (z1 + z2) / 2, ry);
      for (let i = 0; i <= Math.ceil(len / 2); i++) { const t = i / Math.ceil(len / 2); w.box(0.2, 1.4, 0.2, '#6b4423', x1 + (x2 - x1) * t, G + 0.7, z1 + (z2 - z1) * t); }
      S((x1 + x2) / 2, G + 1.2, (z1 + z2) / 2, Math.max(0.3, Math.abs(x2 - x1)), 1.2, Math.max(0.3, Math.abs(z2 - z1)), null);
    };
    rail(14, 22, 26, 22); rail(26, 22, 26, 34); rail(14, 34, 26, 34); rail(14, 22, 14, 26); rail(14, 30, 14, 34);
    w.sign('Pferdekoppel', 20, G + 3, 22, { bg: '#8a5a33', size: 0.8 });
    // Scheune
    w.house(46, 24, 8, 10, 5, { wall: '#b8322a', roof: 'gable', roofColor: '#5a5f66', door: 'w', window: '#fff4d6' });
    w.box(0.1, 3, 3, '#ffffff', 41.94, G + 1.8, 24);
    w.box(0.12, 0.25, 4.2, '#ffffff', 41.92, G + 1.8, 24, 0.0, 0.62);
    w.box(0.12, 0.25, 4.2, '#ffffff', 41.92, G + 1.8, 24, 0.0, -0.62);
    for (const [x, z] of [[38, 30], [40, 31.5], [36.5, 32]]) { w.box(1.8, 1.2, 1.2, '#e3c75a', x, G + 0.6, z, 0.3); w.box(1.2, 0.6, 1.0, '#d8bb4a', x, G + 1.5, z, 0.3); }
    // Windrad
    w.box(0.5, 9, 0.5, '#8d939b', 41, G + 4.5, 44);
    for (const s of [-1, 1]) w.box(0.15, 9.4, 0.15, '#8d939b', 41 + s * 1.2, G + 4.5, 44, 0, 0, -s * 0.13);
    w.box(0.6, 0.6, 1.2, '#6b7480', 41, G + 9.2, 44);
    w.box(0.15, 1.6, 2, '#c8402c', 41, G + 9.2, 45.4);
    const fan = new THREE.Group();
    fan.position.set(41, G + 9.2, 43.3);
    for (let i = 0; i < 3; i++) { const m = part(fan, 0.5, 4.6, 0.06, '#e8e8e8', 0, 0, 0); m.rotation.z = i * Math.PI / 3; }
    part(fan, 0.6, 0.6, 0.2, '#c8402c', 0, 0, 0.05);
    w.add(fan);
    w.updaters.push((dt) => { fan.rotation.z += dt * 1.5; });
    // Planwagen
    w.box(2.2, 0.8, 4, '#8a5a33', 30, G + 1.1, 46, 0.4);
    w.box(2.3, 1.8, 3.6, '#f2ead8', 30, G + 2.3, 46, 0.4);
    for (const [a, b] of [[1.2, 1.4], [-1.2, 1.4], [1.2, -1.4], [-1.2, -1.4]]) w.box(0.2, 1.2, 1.2, '#5b3a1e', 30 + a * Math.cos(0.4) + b * Math.sin(0.4), G + 0.6, 46 - a * Math.sin(0.4) + b * Math.cos(0.4), 0.4);
    w.sign('Prärie', 32, G + 4, 20, { bg: '#b8962e', size: 1 });

    // ---------- Wald mit Blockhütten, Totempfählen und Bären ----------
    const cabin = (x, z, door) => {
      w.house(x, z, 7, 6, 3.6, { wall: '#9a6a3d', roof: 'gable', roofColor: '#4a3020', door, window: '#ffe9a8', y: G });
      for (let y = 0.4; y < 3.6; y += 0.6) { w.box(7.15, 0.18, 0.1, '#6b4423', x, G + y, z + 3.03); w.box(7.15, 0.18, 0.1, '#6b4423', x, G + y, z - 3.03); }
      w.box(1.2, 5.5, 1.2, '#8d939b', x + 2.6, G + 2.75, z - 1.5);
      w.box(1.4, 0.4, 1.4, '#6b7480', x + 2.6, G + 5.6, z - 1.5);
    };
    cabin(-30, 8, 'e'); cabin(-46, 22, 's'); cabin(-26, 44, 'n');
    const totem = (x, z, ry) => {
      const cols = ['#c8402c', '#1d7a6a', '#ffd23f', '#2b2b2b', '#e8622a'];
      for (let i = 0; i < 5; i++) {
        const y = G + 0.8 + i * 1.5;
        w.box(1.3, 1.5, 1.3, cols[i % 5], x, y, z, ry);
        rb(x, y + 0.25, z, ry, 0.35, 0, 0.66, 0.35, 0.3, 0.05, '#ffffff');
        rb(x, y + 0.25, z, ry, -0.35, 0, 0.66, 0.35, 0.3, 0.05, '#ffffff');
        rb(x, y + 0.25, z, ry, 0.35, 0, 0.69, 0.15, 0.2, 0.05, '#111111');
        rb(x, y + 0.25, z, ry, -0.35, 0, 0.69, 0.15, 0.2, 0.05, '#111111');
        rb(x, y - 0.35, z, ry, 0, 0, 0.72, i % 2 ? 0.3 : 0.8, 0.25, i % 2 ? 0.5 : 0.15, i % 2 ? '#ffd23f' : '#ffffff');
      }
      rb(x, G + 7.6, z, ry, 0, 0, 0.1, 4.4, 0.4, 0.8, '#1d7a6a');
      rb(x, G + 7.6, z, ry, 0, 0.1, 0.1, 3.4, 0.3, 0.85, '#c8402c');
      rb(x, G + 8.1, z, ry, 0, 0, 0.5, 0.4, 0.4, 0.8, '#ffd23f');
      w.solids.push({ min: P(x - 0.65, G, z - 0.65), max: P(x + 0.65, G + 8, z + 0.65) });
    };
    totem(-20, 16, Math.PI / 2); totem(-38, 12, 0.3); totem(-40, 34, 0.9);
    w.sign('Totempfähle', -20, G + 10, 16, { bg: '#1d7a6a', size: 0.8 });
    // Lagerfeuer
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; w.box(0.35, 0.35, 1.4, '#6b4423', -36 + Math.cos(a) * 0.5, G + 0.2, 16 + Math.sin(a) * 0.5, a); }
    const fire = w.cone(0.6, 1.2, '#ff8a1f', -36, G + 0.3, 16, { emissive: '#c24a00', shadow: false });
    w.updaters.push((dt, t) => { fire.scale.y = 1 + Math.sin(t * 9) * 0.15 + Math.sin(t * 13) * 0.1; });
    for (const [x, z, r] of [[-33, 16, 1.57], [-39, 16, 1.57], [-36, 19, 0]]) w.box(2, 0.5, 0.6, '#7a4a2a', x, G + 0.25, z, r);
    // See mit Kanu
    w.water(-46, 4, 14, 10, { top: G + 0.05, color: '#3f8fd0' });
    w.box(0.9, 0.4, 3.6, '#c8402c', -44, G + 0.2, 3, 0.5);
    // Bären (Deko aus Klötzchen)
    const bear = (x, z, ry, s, c) => {
      const y = G;
      rb(x, y + 1.2 * s, z, ry, 0, 0, 0, 1.4 * s, 1.1 * s, 2.2 * s, c);
      rb(x, y + 1.6 * s, z, ry, 0, 0, 0.4 * s, 1.2 * s, 0.5 * s, 1.0 * s, c);
      rb(x, y + 1.55 * s, z, ry, 0, 0, 1.4 * s, 0.9 * s, 0.85 * s, 0.8 * s, c);
      rb(x, y + 1.4 * s, z, ry, 0, 0, 1.9 * s, 0.45 * s, 0.4 * s, 0.4 * s, '#c8a27a');
      rb(x, y + 1.5 * s, z, ry, 0, 0, 2.12 * s, 0.18 * s, 0.14 * s, 0.06 * s, '#111');
      for (const sx of [-1, 1]) {
        rb(x, y + 2.05 * s, z, ry, sx * 0.32 * s, 0, 1.3 * s, 0.25 * s, 0.25 * s, 0.15 * s, c);
        rb(x, y + 1.7 * s, z, ry, sx * 0.24 * s, 0, 1.81 * s, 0.1 * s, 0.1 * s, 0.04 * s, '#111');
        for (const sz of [-0.7, 0.7]) rb(x, y + 0.35 * s, z, ry, sx * 0.45 * s, 0, sz * s, 0.4 * s, 0.7 * s, 0.45 * s, c);
      }
    };
    bear(-38, 4, 0.8, 1, '#6b4423'); bear(-36.5, 6.2, 2.2, 0.55, '#7a5230'); bear(-52, 38, -0.6, 1, '#3b2a1e');
    w.sign('Bären-See', -46, G + 4, 10, { bg: '#5b3a1e', size: 0.8 });
    // Nadelwald
    const forest = [[-58, -6, -8, 58]];
    const keep = [[-34, 4, -24, 13], [-51, 17, -40, 28], [-31, 39, -20, 49], [-54, -2, -38, 10], [-41, 11, -31, 21], [-24, 12, -16, 20], [-42, 30, -36, 38], [-26, 18, -4, 26], [-56, 34, -48, 42], [-13, 9, -5, 22]];
    let n = 0;
    for (let k = 0; k < 900 && n < 55; k++) {
      const x = w.r(-57, -9), z = w.r(-4, 56);
      if (!inRects(x, z, forest) || inRects(x, z, keep)) continue;
      w.tree(w.pick(['pine', 'pine', 'birch']), x, z, w.r(1.0, 1.5), G);
      n++;
    }
    flowers(-14, 30, 8, 10, 30, ['#ffd23f', '#ffffff', '#b07bff']);

    // ---------- Tiere ----------
    const A = (kind, x, z, o = {}) => w.animal(kind, { pos: P(x, o.y ?? 0, z), ...o });
    for (let i = 0; i < 6; i++) A('bison', 30 + (i % 3) * 5, 36 + Math.floor(i / 3) * 6, { radius: 6, speed: 0.7, hungry: i === 1 });
    A('horse', 18, 26, { radius: 3, speed: 1.2, color: '#8a5a2b', saddle: '#c8402c', hungry: true });
    A('horse', 22, 30, { radius: 3, speed: 1.1, color: '#3b2a1a' });
    A('horse', 20, 32, { radius: 2.5, speed: 1, color: '#e8dcc4' });
    // Weißkopfseeadler: brauner Körper, weißer Kopf und Schwanz
    const eagle = (a) => {
      part(a.body, 0.38, 0.38, 0.4, '#ffffff', 0, 0.37, 0.12);
      part(a.body, 0.16, 0.14, 0.24, '#ffc020', 0, 0.3, 0.38);
      for (const s of [-1, 1]) part(a.body, 0.02, 0.06, 0.06, '#111111', s * 0.195, 0.42, 0.22);
      return a;
    };
    const ec = ['#5b3a1e', '#4a2e17', '#ffffff'];
    for (let i = 0; i < 3; i++) eagle(A('bird', 44, -24 + i * 10, { y: 17 + i * 3, behavior: 'fly', radius: 9 + i * 3, speed: (i % 2 ? -1 : 1) * 5, colors: ec, scale: 1.7 }));
    w.box(0.35, 1.3, 0.35, '#6b4423', 4.2, G + 0.65, 18);
    w.box(1.2, 0.15, 0.25, '#6b4423', 4.2, G + 1.3, 18);
    eagle(A('bird', 4.2, 18, { y: G + 1.35, behavior: 'perch', colors: ec, scale: 1.4, hungry: true }));
    // Waschbären (graue Katzen mit Maske und Ringelschwanz)
    for (const [x, z] of [[-26, 13], [-44, 28]]) {
      const a = A('cat', x, z, { radius: 3, speed: 1, color: '#8d8f94', scale: 1.25 });
      part(a.head, 0.37, 0.1, 0.04, '#222222', 0, 0.04, 0.155);
      part(a.head, 0.2, 0.1, 0.04, '#e8e8e8', 0, -0.07, 0.155);
      for (const [y, z2] of [[0, -0.365], [-0.164, -0.173]]) part(a.tail, 0.11, 0.11, 0.1, '#2b2b2b', 0, y, z2).rotation.x = 0.7;
    }
    for (let i = 0; i < 3; i++) A('rabbit', -10 - i * 2, 18 + i * 2, { behavior: 'hop', radius: 4, speed: 2, color: i ? '#c8b49a' : '#9a8a78', hungry: i === 0 });
    A('rabbit', 12, 10, { behavior: 'hop', radius: 3, speed: 2, color: '#d8c8b0', hungry: true });
    for (let i = 0; i < 2; i++) A('duck', -48 + i * 2, 4, { y: G + 0.05, behavior: 'swim', radius: 3, speed: 0.7 });
    for (const [x, z] of [[8, -26], [10, -38]]) A('seal', x, z, { y: -0.75, behavior: 'swim', radius: 3, speed: 0.6 });
    A('whale', -24, -78, { y: -0.8, behavior: 'jump', radius: 14 });
    if (0) for (let i = 0; i < 4; i++) A('butterfly', w.r(-14, 14), w.r(0, 44), { y: G + 1.2, behavior: 'flutter', radius: 4, color: w.pick(['#ff8a1f', '#ffd23f', '#5fb0ff']) });

    // ---------- Münzen ----------
    w.coinLine(0, 44, 0, -10, 8, G);
    w.coinLine(4, 28, 24, 28, 5, G);
    w.coinRing(33, G, 40, 9, 8);
    w.coinLine(-4, 22, -22, 22, 5, G);
    w.coinLine(-20, -8, -20, -46, 6, G);
  },
};
