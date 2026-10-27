// Afrika: goldene Savanne mit Wasserloch, Akazien und Affenbrotbäumen, Kilimandscharo im Hintergrund,
// Ägypten-Ecke mit Pyramiden und Sphinx, Lehmhütten-Dorf und bunter Markt.
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';
import { pathRide, part } from '../rides.js';
import { collider, solidBox, studBlocks, groundPath, groundFlowers, tufts, stone, coinsAt, coinTrail, beast, compact, stepMountain, smooth, clamp01, edgeDist, rectDist, segDist, hash, V } from './africa-kit.js';

// Flache Bauplätze: Spawn-Korridor, Mitte, Markt, Dorf, Ägypten, Affenbrotbaum
const FLAT = [[-10, 8, 10, 62], [-16, -16, 16, 12], [12, 18, 48, 46], [-52, 14, -16, 50], [0, -56, 56, -10], [-52, -52, -20, -16]];
const POND = { x: -30, z: -2, rx: 9, rz: 6.5 };
// Safari-Strecke (wird im Gelände als Piste eingefärbt und eingeebnet)
const TRACK = [[8.5, 11], [10, 3], [9, -6], [4, -15], [-6, -20], [-16, -16], [-24, -12.5], [-34, -12.5], [-43, -7], [-45, 3], [-40, 10], [-30, 11.5], [-20, 12], [-12, 14], [-4, 13], [3, 9]];
const trackDist = (x, z) => { let d = 1e9; for (let i = 0; i < TRACK.length; i++) d = Math.min(d, segDist(x, z, TRACK[i], TRACK[(i + 1) % TRACK.length])); return d; };
const pondQ = (x, z) => ((x - POND.x) / POND.rx) ** 2 + ((z - POND.z) / POND.rz) ** 2;

function height(x, z) {
  const e = edgeDist(x, z);
  if (e > 62) return 0;
  if (e > 57) return 0.5;
  const q = pondQ(x, z);
  if (q < 1) return 0.5;
  let d = Math.min(...FLAT.map((r) => rectDist(x, z, r)), (Math.sqrt(q) - 1) * 7, trackDist(x, z) - 2.5);
  const wgt = smooth(clamp01(d / 9)) * smooth(clamp01((57 - e) / 6));
  const hills = 1.4 + 1.4 * Math.sin(x * 0.1 + 0.5) * Math.cos(z * 0.085 - 0.3) + 0.9 * Math.sin((x + z) * 0.06 + 1);
  return 1 + wgt * Math.max(0, hills);
}

function color(x, z, h) {
  const e = edgeDist(x, z), r = hash(x, z);
  if (e > 57) return r < 0.5 ? '#f1d38b' : '#ecca7e';
  if (pondQ(x, z) < 1) return '#7a6a45';
  if (pondQ(x, z) < 1.7) return r < 0.5 ? '#8fb04a' : '#9cbc52';
  if (trackDist(x, z) < 1.6) return r < 0.5 ? '#c08d55' : '#b8844c';
  if (x > -1 && z < -9 && z > -57) return r < 0.4 ? '#ead08e' : r < 0.8 ? '#e4c682' : '#efd89a'; // Wüste
  if (h > 3) return r < 0.5 ? '#c9a446' : '#bf9a3f';
  const n = Math.sin(x * 0.13 + 2) * Math.sin(z * 0.11 - 1) + Math.sin((x - z) * 0.05);
  if (n > 0.9) return r < 0.5 ? '#b9b04a' : '#a9a443'; // grünere Flecken
  if (n < -1.1) return r < 0.5 ? '#d29a52' : '#c98f4a'; // rötliche Erde
  return r < 0.33 ? '#dcb54e' : r < 0.66 ? '#d4ab45' : '#e3bf5c';
}

export const africa = {
  id: 'africa',
  name: 'Afrika',
  seed: 201,
  theme: {
    sky: ['#3a86d8', '#9fd0f5', '#ffe2b0'], fog: '#f2d9a8', sea: '#2f8fc9', fogNear: 80, fogFar: 300,
    light: { hemi: 1.55, sun: 2.4, sunColor: '#fff0d0', sky: '#ffffff', ground: '#b08a50' },
  },
  stars: { safari: 'Safari-Tour', pyramid: 'Pyramide', baobab: 'Baumhaus' },
  build(w) {
    w.terrain({ x0: -66, z0: -66, cols: 66, rows: 66, cell: 2, step: 0.5, height, color });
    const H = (x, z) => w.heightAt(x, z);
    exitPortal(w, 53, 'worldtour');
    const SB = studBlocks(w);

    // ---------- Kilimandscharo (weit im Norden, Stufen-Berg mit Schneekappe) ----------
    const mountain = (cx, cz, tiers, base) => stepMountain(w, cx, cz, tiers, base);
    mountain(-14, -205, [[78, 6, '#8a7a55'], [70, 6, '#83744f'], [62, 6, '#7d7050'], [54, 6, '#6f6a4c'], [46, 6, '#6a6250'], [39, 5, '#77706a'], [33, 5, '#8a8580'], [28, 4, '#e8eef8'], [24, 4, '#f4f8ff'], [19, 3, '#ffffff']], -2);
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; w.box(9, 5, 4, '#eef4ff', -14 + Math.cos(a) * 31, 42, -205 + Math.sin(a) * 31, Math.PI / 2 - a); }
    mountain(50, -190, [[30, 7, '#7d7050'], [23, 7, '#6f6a4c'], [16, 7, '#6a6250'], [10, 6, '#8a8580'], [5, 4, '#f4f8ff']], -2);
    w.sign('Kilimandscharo 5895 m', -6, 6.5, -14, { bg: '#7a4a2a', size: 0.8 });

    // ---------- Wege ----------
    const sand = '#e7cf9a';
    groundPath(w, [[0, 48], [0, 0], [0, -6], [6, -14], [8, -30], [20, -30]], 3, sand);
    groundPath(w, [[0, 32], [14, 32], [44, 32]], 3, sand);
    groundPath(w, [[0, 26], [-12, 30], [-20, 31]], 3, sand);
    groundPath(w, [[0, -6], [-14, -22], [-30, -28]], 2.6, sand);
    groundPath(w, [[-4, 0], [-16, 0]], 2.4, sand);

    // ---------- Wasserloch ----------
    w.water(POND.x, POND.z, POND.rx * 2 - 0.5, POND.rz * 2 - 0.5, { top: 0.85, color: '#58b4d8', emissive: '#0d3a50' });
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * Math.PI * 2, x = POND.x + Math.cos(a) * (POND.rx + 1.2), z = POND.z + Math.sin(a) * (POND.rz + 1.2);
      if (i % 3) tufts(w, x, z, 1.2, 1.2, 2, ['#5e8a2e', '#79a83a'], 0.6, 1.3);
      else w.box(0.15, 1.6, 0.15, '#6f8f35', x, H(x, z) + 0.8, z);
    }
    for (let i = 0; i < 5; i++) w.box(1.2, 0.08, 1.2, '#4f9a3a', POND.x + w.r(-5, 5), 0.9, POND.z + w.r(-3, 3), w.r(0, 3));

    // ---------- Bäume: Akazien und Affenbrotbäume ----------
    const acacia = (x, z, s = 1) => {
      const y = H(x, z), lean = w.r(-0.15, 0.15);
      w.box(0.5 * s, 3.4 * s, 0.5 * s, '#5a4330', x, y + 1.7 * s, z, 0, 0, lean);
      for (const sd of [-1, 1]) w.box(0.3 * s, 2.2 * s, 0.3 * s, '#5a4330', x + sd * 0.8 * s, y + 3.6 * s, z, 0, 0, -sd * 0.6);
      w.box(6.4 * s, 0.6 * s, 4.6 * s, '#5f8c2c', x, y + 4.6 * s, z, w.r(0, 3));
      w.box(4.4 * s, 0.5 * s, 3.4 * s, '#73a236', x + 0.4 * s, y + 5.1 * s, z - 0.2 * s, w.r(0, 3));
      w.box(2.6 * s, 0.4 * s, 2.2 * s, '#83b240', x - 0.6 * s, y + 5.4 * s, z + 0.4 * s, w.r(0, 3));
      collider(w, x, y + 3 * s, z, 0.6 * s, 3 * s, 0.6 * s);
    };
    const baobab = (x, z, s = 1) => {
      const y = H(x, z);
      for (const a of [0, Math.PI / 4]) w.box(2.2 * s, 5.4 * s, 2.2 * s, '#9c8472', x, y + 2.7 * s, z, a);
      w.box(2.6 * s, 0.8 * s, 2.6 * s, '#8f7866', x, y + 0.4 * s, z, 0.3);
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2 + 0.4, bx = x + Math.cos(a) * 1.1 * s, bz = z + Math.sin(a) * 1.1 * s;
        w.box(0.45 * s, 2 * s, 0.45 * s, '#8f7866', bx, y + 6.1 * s, bz, -a, 0, 0.6);
        w.box(1.4 * s, 0.8 * s, 1.4 * s, '#6f9a35', x + Math.cos(a) * 2 * s, y + 7.2 * s, z + Math.sin(a) * 2 * s, a);
      }
      collider(w, x, y + 5.4 * s, z, 2.2 * s, 5.4 * s, 2.2 * s);
    };
    for (const [x, z, s] of [[24, -2, 1.1], [32, 12, 1], [44, 2, 1.2], [18, 6, 0.9], [-14, -40, 1.1], [-2, -44, 1], [-22, 20, 0.9], [38, -2, 0.8], [50, 14, 1], [-46, -6, 1], [-8, -24, 0.9], [26, 50, 1], [-46, 50, 1], [52, -4, 0.9]]) acacia(x, z, s);
    for (const [x, z, s] of [[-18, -46, 1.2], [44, 16, 1.1], [-50, 8, 1], [16, 52, 1]]) baobab(x, z, s);
    tufts(w, 0, 0, 112, 112, 380, ['#c9a03a', '#d8b450', '#b8902f', '#e2c46a'], 0.35, 1.0,
      (x, z) => edgeDist(x, z) > 56 || pondQ(x, z) < 1.3 || trackDist(x, z) < 2 || (x > -1 && z < -9) || Math.abs(x) < 3 || (x > 12 && x < 48 && z > 18 && z < 46));
    for (const [x, z, s] of [[14, -2, 0.8], [-48, -14, 1], [48, 26, 0.7], [-12, 44, 0.8], [20, 14, 0.6]]) stone(w, x, z, s, '#a08d70');
    // Termitenhügel
    for (const [x, z] of [[28, 8], [-6, -46], [46, -2], [-46, 0]]) {
      const y = H(x, z);
      w.box(1.4, 1.4, 1.4, '#b3653a', x, y + 0.7, z);
      w.box(0.9, 1.4, 0.9, '#a85c33', x, y + 2.0, z, 0.4);
      w.box(0.45, 1, 0.45, '#b3653a', x + 0.1, y + 3.1, z);
    }

    // ---------- Stern 1: Safari-Tour ----------
    const sy = H(8, 16);
    const st = w.station(8, 16, 'Safari-Tour', '#5c7a2e', sy);
    const jeep = new THREE.Group();
    part(jeep, 2.3, 0.9, 4.2, '#d6b36a', 0, 1.0, 0);
    part(jeep, 2.32, 0.18, 4.22, '#5c7a2e', 0, 0.62, 0);
    part(jeep, 2.0, 0.5, 1.3, '#d6b36a', 0, 1.6, 1.4);
    part(jeep, 2.1, 0.8, 0.12, '#bfe6ff', 0, 2.1, 0.75);
    for (const [px, pz] of [[-1.05, 0.7], [1.05, 0.7], [-1.05, -1.9], [1.05, -1.9]]) part(jeep, 0.12, 1.7, 0.12, '#3b3b3b', px, 2.3, pz);
    part(jeep, 2.3, 0.12, 2.8, '#5c7a2e', 0, 3.15, -0.6);
    part(jeep, 1.9, 0.5, 0.6, '#7a4a2a', 0, 1.6, -0.4);
    part(jeep, 1.9, 0.5, 0.6, '#7a4a2a', 0, 1.6, -1.5);
    for (const [px, pz] of [[-1.15, 1.35], [1.15, 1.35], [-1.15, -1.35], [1.15, -1.35]]) part(jeep, 0.5, 0.95, 0.95, '#2b2b2b', px, 0.48, pz);
    part(jeep, 0.9, 0.9, 0.35, '#2b2b2b', 0, 1.2, -2.2);
    for (const s of [-1, 1]) part(jeep, 0.4, 0.3, 0.1, '#fff7c0', s * 0.75, 1.15, 2.12, '#8a7a30');
    compact(jeep);
    w.addRide(pathRide(w, {
      points: TRACK.map(([x, z]) => [x, 0, z]), closed: true, duration: 30, vehicle: jeep, seat: [0, 1.0, -1.5],
      name: 'Safari-Tour', starId: 'safari', station: st, exit: V(11.6, sy, 18.5), ground: true, flat: true,
    }));

    // ---------- Stern 2: Pyramide (Tor im Westen) ----------
    const PX = 34, PZ = -30, PY = H(PX, PZ);
    w.enclosure({ x: PX, z: PZ, w: 27, d: 27, side: 'w', h: 4.4, y: PY, color: '#d8b878', label: 'Pyramide', cap: '#c8a463' });
    const tiers = 7;
    for (let k = 0; k < tiers; k++) {
      const s = 21 - 3 * k, top = PY + 1.6 * (k + 1);
      SB.add(PX, top, PZ, s, 1.6, s, k === tiers - 1 ? '#ffd23f' : k % 2 ? '#dcbc78' : '#e6c888');
    }
    w.star('pyramid', PX, PY + 1.6 * tiers, PZ, 'Pyramide');
    for (let k = 1; k < tiers - 1; k += 2) w.coin(PX - (21 - 3 * k) / 2 + 0.7, PY + 1.6 * (k + 1), PZ);
    w.box(1.4, 2.2, 0.2, '#3a2a1a', PX - 10.6, PY + 1.1, PZ);
    // Kleine Pyramiden und Obelisken
    const smallPyr = (x, z, s, n) => { const y = H(x, z); for (let k = 0; k < n; k++) solidBox(w, x, y + (k + 1) * 1.2, z, s - k * (s / n), 1.2, s - k * (s / n), k % 2 ? '#d9b97a' : '#e3c487'); };
    smallPyr(10, -46, 10, 5);
    smallPyr(1, -53, 6, 4);
    for (const z of [-26.2, -33.8]) {
      const y = H(18.4, z);
      solidBox(w, 18.4, y + 6, z, 0.9, 6, 0.9, '#d3b26f');
      w.box(0.6, 0.6, 0.6, '#ffd23f', 18.4, y + 6.3, z, Math.PI / 4, Math.PI / 4);
    }
    // Sphinx (schaut nach Süden)
    {
      const x = 14, z = -20, y = H(x, z), c = '#d9b77a', c2 = '#cfa96a';
      solidBox(w, x, y + 2.2, z - 1.5, 3.2, 2.2, 7, c);
      w.box(3.4, 0.8, 7.2, c2, x, y + 0.4, z - 1.5);
      for (const s of [-1, 1]) w.box(0.9, 0.7, 3.4, c, x + s * 1.0, y + 0.35, z + 3.2);
      solidBox(w, x, y + 4.4, z + 1.2, 2.2, 2.2, 2.2, c);
      w.box(2.4, 1.4, 1.4, c, x, y + 3.7, z + 0.7);
      for (let i = 0; i < 5; i++) w.box(2.9 - i * 0.05, 0.22, 1.5, i % 2 ? '#2f5fd6' : '#ffd23f', x, y + 4.8 - i * 0.45, z + 0.9);
      w.box(2.6, 0.5, 2.4, '#ffd23f', x, y + 4.75, z + 1.2);
      for (const s of [-1, 1]) w.box(0.25, 0.25, 0.08, '#3a2a1a', x + s * 0.5, y + 3.9, z + 2.32);
      w.box(0.4, 0.4, 0.3, c2, x, y + 3.5, z + 2.4);
      w.box(0.9, 0.12, 0.08, '#8a6a40', x, y + 3.05, z + 2.33);
      w.box(0.5, 1.2, 0.4, '#2f5fd6', x, y + 2.7, z + 2.35);
      w.box(0.6, 0.6, 3, c, x, y + 1.2, z - 5.6);
    }
    for (const [x, z] of [[24, -13], [40, -12], [17, -36], [50, -14], [3, -22]]) w.tree('palm', x, z, 1.1, H(x, z));
    w.sign('Ägypten', 16, PY + 6.5, -16, { bg: '#c8a463', fg: '#3a2a1a', size: 0.9 });

    // ---------- Stern 3: Baumhaus im riesigen Affenbrotbaum ----------
    const BX = -36, BZ = -34, BY = H(BX, BZ);
    const trunkTop = BY + 14.5;
    collider(w, BX, trunkTop, BZ, 5, trunkTop - BY, 5, { safe: true });
    for (const a of [0, Math.PI / 4, Math.PI / 8, -Math.PI / 8]) w.box(5.2, trunkTop - BY, 5.2, a ? '#a08672' : '#957c69', BX, (BY + trunkTop) / 2, BZ, a);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      w.box(2.2, 2.2, 1.4, '#8f7866', BX + Math.cos(a) * 2.9, BY + 1, BZ + Math.sin(a) * 2.9, -a);
      w.box(0.3, trunkTop - BY - 2, 0.3, '#86705f', BX + Math.cos(a + 0.2) * 2.75, (BY + trunkTop) / 2, BZ + Math.sin(a + 0.2) * 2.75);
    }
    const steps = 13, sr = 4.3, sda = 0.74, a0 = Math.PI / 2;
    for (let i = 0; i < steps; i++) {
      const a = a0 + i * sda, px = BX + Math.cos(a) * sr, pz = BZ + Math.sin(a) * sr, top = BY + 1.1 * (i + 1);
      SB.add(px, top, pz, 2.2, 0.5, 2.2, i % 3 === 2 ? '#c49a6c' : '#7a5230');
      w.box(0.25, top - BY, 0.25, '#5b3a1e', px, (BY + top) / 2 - 0.25, pz);
      if (i % 4 === 1) w.coin(px, top, pz);
    }
    // Plattform mit Hütte oben auf dem Stamm
    const floor = trunkTop + 0.8;
    SB.add(BX, floor, BZ, 5, 0.8, 5, '#a0764e', { safe: true });
    const la = a0 + (steps - 1) * sda, open = Math.abs(Math.sin(la)) > Math.abs(Math.cos(la)) ? (Math.sin(la) < 0 ? 'n' : 's') : (Math.cos(la) < 0 ? 'w' : 'e');
    for (const [sd, dx, dz, sx, sz] of [['n', 0, -2.4, 5, 0.15], ['s', 0, 2.4, 5, 0.15], ['w', -2.4, 0, 0.15, 5], ['e', 2.4, 0, 0.15, 5]]) {
      if (sd === open) continue;
      w.box(sx, 0.15, sz, '#e8d8b0', BX + dx, floor + 1, BZ + dz);
      w.box(sx === 5 ? 5 : 0.15, 1, sz === 5 ? 5 : 0.15, '#7a5230', BX + dx, floor + 0.5, BZ + dz);
    }
    for (const [dx, dz] of [[-2.3, -2.3], [2.3, -2.3], [-2.3, 2.3], [2.3, 2.3]]) w.box(0.3, 3.2, 0.3, '#5b3a1e', BX + dx, floor + 1.6, BZ + dz);
    for (let k = 0; k < 4; k++) w.box(6.2 - k * 1.4, 0.5, 6.2 - k * 1.4, k % 2 ? '#b8914a' : '#c9a25a', BX, floor + 3.4 + k * 0.5, BZ, k * 0.3);
    w.star('baobab', BX, floor, BZ, 'Baumhaus');
    w.coin(BX + 1.5, floor, BZ + 1.5);
    // Krone: Äste mit Blätterbüscheln (über dem Kletterweg)
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + 0.2, r = 5.5 + (i % 3);
      w.box(0.8, 0.8, r, '#957c69', BX + Math.cos(a) * r / 2, floor + 2.6 + (i % 2) * 1.2, BZ + Math.sin(a) * r / 2, Math.PI / 2 - a, -0.25);
      w.box(2.6, 1.4, 2.6, i % 2 ? '#6f9a35' : '#5f8c2c', BX + Math.cos(a) * r, floor + 3.4 + (i % 2) * 1.2, BZ + Math.sin(a) * r, a);
    }
    w.sign('Baumhaus', BX, BY + 4.2, BZ + 6.5, { bg: '#7a5230', size: 0.8 });

    // ---------- Lehmhütten-Dorf ----------
    const VX = -34, VZ = 32;
    const hut = (x, z, r = 1.8, mud = '#b0764a') => {
      const y = H(x, z);
      for (const a of [0, Math.PI / 4]) w.box(2 * r, 2.2, 2 * r, mud, x, y + 1.1, z, a);
      w.box(2 * r + 0.1, 0.3, 2 * r + 0.1, '#8a5a35', x, y + 0.15, z, Math.PI / 8);
      const toC = Math.atan2(VX - x, VZ - z);
      w.box(0.9, 1.6, 0.2, '#3a2416', x + Math.sin(toC) * r * 0.98, y + 0.8, z + Math.cos(toC) * r * 0.98, toC);
      for (let k = 0; k < 5; k++) for (const a of [0, Math.PI / 4]) {
        const s = (2 * r + 1) * (1 - k / 5.2);
        w.box(s, 0.5, s, k % 2 ? '#b8914a' : '#c9a25a', x, y + 2.35 + k * 0.48, z, a + k * 0.1);
      }
      w.box(0.12, 0.8, 0.12, '#5b3a1e', x, y + 4.9, z);
      collider(w, x, y + 3, z, 2 * r * 0.85, 3, 2 * r * 0.85, { safe: true });
    };
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * 0.3 + i / 7 * Math.PI * 1.5;
      hut(VX + Math.cos(a) * 9, VZ + Math.sin(a) * 9, i % 3 === 1 ? 2.1 : 1.8, i % 2 ? '#b0764a' : '#a86d42');
    }
    // Dornenzaun (Boma) mit Öffnung nach Osten
    for (let i = 0; i < 44; i++) {
      const a = i / 44 * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.32) continue;
      const x = VX + Math.cos(a) * 14, z = VZ + Math.sin(a) * 14;
      w.box(2.2, 1.1, 1.0, i % 2 ? '#7a5a3a' : '#6b4e33', x, H(x, z) + 0.55, z, Math.PI / 2 - a);
      w.box(1.4, 0.6, 0.8, '#5f7a35', x, H(x, z) + 1.25, z, Math.PI / 2 - a + 0.3);
    }
    // Feuerstelle, Kornspeicher, Hocker
    {
      const y = H(VX, VZ);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; w.box(0.5, 0.35, 0.5, '#7d7468', VX + Math.cos(a) * 1.1, y + 0.18, VZ + Math.sin(a) * 1.1, a); }
      w.box(0.8, 0.2, 0.2, '#5b3a1e', VX, y + 0.2, VZ, 0.5);
      w.box(0.8, 0.2, 0.2, '#5b3a1e', VX, y + 0.2, VZ, -0.6);
      const flame = w.shape(new THREE.ConeGeometry(0.5, 1.2, 6), '#ff9a1f', VX, y + 0.8, VZ, { emissive: '#c84a00' });
      const flame2 = w.shape(new THREE.ConeGeometry(0.28, 0.8, 6), '#ffe14a', VX, y + 0.7, VZ, { emissive: '#d8a000' });
      w.updaters.push((dt, t) => { flame.scale.y = 1 + Math.sin(t * 9) * 0.15; flame2.scale.y = 1 + Math.sin(t * 13 + 1) * 0.2; flame.rotation.y = t * 2; });
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3; w.box(0.6, 0.4, 0.6, '#7a4a2a', VX + Math.cos(a) * 3, y + 0.2, VZ + Math.sin(a) * 3); }
      const gx = VX - 5, gz = VZ - 4, gy = H(gx, gz);
      for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) w.box(0.2, 1.2, 0.2, '#5b3a1e', gx + dx, gy + 0.6, gz + dz);
      w.box(1.8, 1.4, 1.8, '#b0764a', gx, gy + 1.9, gz, Math.PI / 4);
      for (let k = 0; k < 3; k++) w.box(2.4 - k * 0.7, 0.4, 2.4 - k * 0.7, '#c9a25a', gx, gy + 2.8 + k * 0.4, gz);
      // bunte Tücher auf einer Leine
      for (let i = 0; i < 5; i++) w.box(0.9, 1.1, 0.06, ['#e8262b', '#2f5fd6', '#ffd23f', '#e8262b', '#2fbf4a'][i], VX + 4 + i * 1.1, y + 1.5, VZ - 6);
      w.box(6, 0.05, 0.05, '#3a2416', VX + 6.2, y + 2.05, VZ - 6);
      for (const dx of [3.4, 9]) w.box(0.15, 2.1, 0.15, '#5b3a1e', VX + dx, y + 1.05, VZ - 6);
    }
    w.sign('Lehmhütten-Dorf', VX + 15, H(VX + 15, VZ) + 3.4, VZ, { bg: '#a86d42', size: 0.8 });
    groundFlowers(w, VX + 4, VZ + 8, 6, 4, 18, ['#ff7a1f', '#ffd23f', '#e8262b']);

    // ---------- Markt ----------
    const MZ = 32;
    const goods = [['#ffd23f', '#f2c12e'], ['#ff8a1f', '#ff6a1f'], ['#5fae3a', '#e8262b'], ['#8a3fa0', '#b05fd0'], ['#e8262b', '#ff595e'], ['#f0e0b0', '#c8a060']];
    const awn = [['#e8262b', '#ffd23f'], ['#2f5fd6', '#ffffff'], ['#2fbf4a', '#ffd23f'], ['#ff7a1f', '#ffffff'], ['#b05fd0', '#ffd23f'], ['#1fb5c9', '#ff595e']];
    let si = 0;
    for (const x of [19, 26.5, 34, 41.5]) for (const side of [-1, 1]) {
      const z = MZ + side * 4.6, y = H(x, z), [a1, a2] = awn[si % awn.length], [g1, g2] = goods[si % goods.length];
      solidBox(w, x, y + 1.0, z, 3.4, 1.0, 1.4, '#8a5e33');
      w.box(3.5, 0.12, 1.5, '#c49a6c', x, y + 1.05, z);
      for (const dx of [-1.6, 1.6]) for (const dz of [-0.9, 0.9]) w.box(0.15, 2.8 + (dz * side > 0 ? -0.4 : 0.2), 0.15, '#5b3a1e', x + dx, y + 1.4, z + dz);
      for (let k = 0; k < 4; k++) w.box(0.9, 0.12, 2.6, k % 2 ? a2 : a1, x - 1.35 + k * 0.9, y + 2.9, z - side * 0.2, 0, -side * 0.28);
      for (let k = 0; k < 7; k++) w.box(0.38, 0.38, 0.38, k % 2 ? g1 : g2, x - 1.2 + k * 0.4, y + 1.3 + (k % 3 === 1 ? 0.25 : 0), z + w.r(-0.3, 0.3), w.r(0, 3));
      w.box(0.7, 0.5, 0.7, '#c8a060', x + 2.1, y + 0.25, z - side * 0.2);
      w.box(0.5, 0.15, 0.5, g1, x + 2.1, y + 0.55, z - side * 0.2);
      si++;
    }
    for (let i = 0; i < 6; i++) w.box(0.9, 1.2, 0.06, ['#e8262b', '#ffd23f', '#2fbf4a', '#2f5fd6', '#ff7a1f', '#b05fd0'][i], 20 + i * 4.6, H(20, MZ) + 3.4, MZ, 0, 0, 0.05);
    w.box(28, 0.05, 0.05, '#3a2416', 31.5, H(20, MZ) + 4.05, MZ);
    for (const x of [17, 46]) w.box(0.2, 4.3, 0.2, '#5b3a1e', x, H(x, MZ) + 2.15, MZ);
    w.sign('Markt', 15, H(15, MZ) + 4.6, MZ, { bg: '#e8262b', size: 0.9 });

    // ---------- Löwenfelsen ----------
    const LX = -8, LZ = -32, LY = H(LX, LZ);
    solidBox(w, LX, LY + 2.2, LZ, 6, 2.2, 5, '#9a8a78', { safe: true });
    solidBox(w, LX + 0.8, LY + 3.6, LZ - 0.6, 3.6, 1.4, 3.2, '#a8988a', { safe: true });
    w.box(3, 0.8, 2.2, '#8d7e6c', LX - 2.6, LY + 0.4, LZ + 2.4, 0.4);
    w.box(1.5, 1.2, 1.4, '#8d7e6c', LX + 3.4, LY + 0.6, LZ + 2, 0.8);

    // ---------- Tiere ----------
    const A = (kind, x, z, o = {}) => beast(w, kind, { pos: V(x, 0, z), ...o });
    A('elephant', -18, 7, { radius: 4, speed: 0.8, hungry: true });
    A('elephant', -15, 9, { radius: 4, speed: 0.7 });
    A('elephant', -17, 10, { radius: 3, speed: 0.9, scale: 0.6 });
    for (const [x, z, h] of [[-32, -2, true], [-27, 0, false], [-34, 2, false]]) A('hippo', x, z, { pos: V(x, 0.45, z), y: 0.45, behavior: 'swim', radius: 2.5, speed: 0.4, hungry: h });
    for (let i = 0; i < 5; i++) A('flamingo', -24 + (i % 2), -4 + i * 1.3, { radius: 1.6, speed: 0.5 });
    for (let i = 0; i < 4; i++) A('zebra', 30 + i * 2.5, 4 + (i % 2) * 3, { radius: 7, speed: 1.2, hungry: i === 1 });
    for (let i = 0; i < 3; i++) A('giraffe', 22 + i * 3, -6 + i * 2, { radius: 6, speed: 0.8, hungry: i === 0 });
    A('lion', LX + 0.8, LZ - 0.6, { pos: V(LX + 0.8, LY + 3.6, LZ - 0.6), y: LY + 3.6, radius: 0.6, speed: 0.4 });
    A('lion', LX - 3, LZ + 4, { radius: 2.5, speed: 0.6 });
    A('lion', LX + 3, LZ + 4.5, { radius: 2.5, speed: 0.6, scale: 0.7 });
    for (let i = 0; i < 3; i++) A('camel', 2 + i * 2.5, -38 + i * 1.5, { radius: 4, speed: 0.7, hungry: i === 2 });
    A('monkey', BX + 1.2, BZ + 2.4, { pos: V(BX + 1.2, floor + 1.08, BZ + 2.4), y: floor + 1.08, behavior: 'perch' });
    A('monkey', BX - 6, BZ + 3, { radius: 3, speed: 1.4 });
    const bc = [['#5fa8e8', '#7a4fc0', '#2a5fa0'], ['#2fbf4a', '#1f7de0', '#ffd23f'], ['#ff7a1f', '#ffd23f', '#5a3a1a']];
    for (let i = 0; i < 3; i++) A('bird', BX, BZ, { pos: V(BX, 0, BZ), y: floor + 4 + i * 1.5, behavior: 'fly', radius: 9 + i * 2, speed: (i % 2 ? -1 : 1) * 4, colors: bc[i] });

    // ---------- Münzen ----------
    coinTrail(w, 0, 30, 0, 12, 5);
    coinTrail(w, 18, MZ, 44, MZ, 6);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; coinsAt(w, [[VX + Math.cos(a) * 5, VZ + Math.sin(a) * 5]]); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; coinsAt(w, [[POND.x + Math.cos(a) * (POND.rx + 2.2), POND.z + Math.sin(a) * (POND.rz + 2.2)]]); }
    coinTrail(w, 3, -9, 7.5, -26, 5);
    coinTrail(w, 26, 10, 46, 8, 5);
    coinTrail(w, -4, -10, -20, -26, 4);
    coinsAt(w, [[LX + 0.8, LZ - 0.6, LY + 3.6], [-40, -12], [-44, 0], [-36, 12], [12, -16]]);

    SB.flush();
  },
};
