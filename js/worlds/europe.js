// Europa: Eiffelturm, Uhrturm mit Parlament, Arena aus Bögen, Windmühlen mit Tulpenfeldern,
// Kanalstadt mit Brücken und Gondeln, Fachwerkdorf, Cafés und ein großes Säulentor.
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';
import { pathRide, part } from '../rides.js';
import { collider, solidBox, studBlocks, groundPath, groundFlowers, tufts, stone, coinsAt, coinTrail, beast, compact, cheapHouse, smooth, clamp01, edgeDist, rectDist, hash, V } from './africa-kit.js';

const FLAT = [[-10, 4, 10, 62], [-18, -46, 18, 6], [-56, -54, -16, -22], [12, -52, 54, -10], [-58, -20, -20, 20], [-56, 18, -12, 54], [10, 6, 56, 54]];
const OUT = [18, 14, 48, 46], INN = [24, 20, 42, 40];
const inR = (x, z, [x1, z1, x2, z2]) => x > x1 && x < x2 && z > z1 && z < z2;
const isCanal = (x, z) => inR(x, z, OUT) && !inR(x, z, INN);

function height(x, z) {
  const e = edgeDist(x, z);
  if (e > 62) return 0;
  if (e > 57) return 0.5;
  if (isCanal(x, z)) return 0;
  const d = Math.min(...FLAT.map((r) => rectDist(x, z, r)));
  const hills = (1.3 + Math.sin(x * 0.13 + 1) * Math.cos(z * 0.11) * 1.3) * smooth(clamp01(d / 6)) * smooth(clamp01((57 - e) / 6));
  return 1 + Math.max(0, hills);
}

function color(x, z, h) {
  const e = edgeDist(x, z), r = hash(x, z);
  if (e > 57) return r < 0.5 ? '#f1d38b' : '#ead09a';
  if (inR(x, z, [16, 12, 50, 48])) return r < 0.5 ? '#d8c8a8' : '#cfbf9e'; // Kanal-Ufer aus Stein
  if (inR(x, z, [-14, -40, 14, 4])) return r < 0.5 ? '#cfc8bb' : '#c4bdb0'; // Platz
  return r < 0.33 ? '#6fbf55' : r < 0.66 ? '#66b44e' : '#79c75e';
}

// Quader zwischen zwei Punkten (für Streben am Eiffelturm)
function beam(w, [x1, y1, z1], [x2, y2, z2], t, color) {
  const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, len = Math.hypot(dx, dy, dz);
  w.box(t, len, t, color, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, Math.atan2(dx, dz), Math.atan2(Math.hypot(dx, dz), dy));
}

export const europe = {
  id: 'europe',
  name: 'Europa',
  seed: 203,
  theme: {
    sky: ['#3a7fd0', '#a8d4ff', '#eef6ff'], fog: '#d8e6f2', sea: '#2f8fc9', fogNear: 110, fogFar: 330,
    light: { hemi: 1.6, sun: 2.2, sunColor: '#fff6e8', sky: '#ffffff', ground: '#7d9a8a' },
  },
  stars: { eiffel: 'Eiffelturm', gondola: 'Gondelfahrt', colosseum: 'Arena' },
  build(w) {
    w.terrain({ x0: -66, z0: -66, cols: 66, rows: 66, cell: 2, step: 0.5, height, color });
    const H = (x, z) => w.heightAt(x, z);
    exitPortal(w, 53, 'worldtour');
    const SB = studBlocks(w);
    const G = 1;

    // ---------- Wege ----------
    const pave = '#e0d6c2';
    groundPath(w, [[0, 48], [0, -20]], 3.2, pave);
    groundPath(w, [[-2, -6], [-18, -32]], 2.6, pave);
    groundPath(w, [[2, -6], [22, -14], [32, -14]], 2.6, pave);
    groundPath(w, [[0, 22], [14, 34]], 2.6, pave);
    groundPath(w, [[0, 26], [-22, 34]], 2.6, pave);
    groundPath(w, [[-4, 0], [-30, 2]], 2.6, pave);

    // ---------- Säulentor ----------
    {
      const z = 10, c = '#e6dcc4', c2 = '#d6caae';
      for (const x of [-8.9, -5.5, -2.1, 2.1, 5.5, 8.9]) {
        solidBox(w, x, G + 7, z, 1.2, 7, 1.2, c);
        w.box(1.5, 0.4, 1.5, c2, x, G + 0.2, z);
        w.box(1.5, 0.4, 1.5, c2, x, G + 6.8, z);
        for (const dz of [-1.2, 1.2]) w.box(1.0, 7, 1.0, c, x, G + 3.5, z + dz);
      }
      collider(w, 0, G + 10, z, 19.6, 3, 3.8);
      w.box(19.6, 1.6, 3.8, c, 0, G + 7.8, z);
      w.box(19.8, 0.3, 4.0, c2, 0, G + 8.75, z);
      w.box(9, 1.3, 3.2, c, 0, G + 9.5, z);
      w.box(9.2, 0.25, 3.4, c2, 0, G + 10.25, z);
      // Viergespann (grün)
      for (let i = 0; i < 4; i++) {
        const x = -1.5 + i;
        w.box(0.55, 0.8, 1.6, '#4f9a7a', x, G + 11, z - 0.4);
        w.box(0.4, 0.8, 0.5, '#4f9a7a', x, G + 11.6, z + 0.35, 0, -0.4);
        for (const [lx, lz] of [[-0.15, 0.5], [0.15, -0.5]]) w.box(0.15, 0.6, 0.15, '#4f9a7a', x + lx, G + 10.6, z - 0.4 + lz);
      }
      w.box(2, 0.8, 1.2, '#4f9a7a', 0, G + 11, z - 1.6);
      w.box(0.5, 1.4, 0.5, '#4f9a7a', 0, G + 12, z - 1.7);
      w.box(0.12, 1.8, 0.12, '#4f9a7a', 0.4, G + 12.4, z - 1.7);
      for (const s of [-1, 1]) {
        solidBox(w, s * 12.5, G + 5, z, 4, 5, 5, c);
        w.box(4.4, 0.4, 5.4, c2, s * 12.5, G + 5.2, z);
        w.box(1, 2.4, 0.1, '#5a6a7a', s * 12.5, G + 2.6, z + 2.52);
      }
    }

    // ---------- Stern 1: Eiffelturm ----------
    const EX = 0, EZ = -28, iron = '#7a5c44', iron2 = '#6a4e38';
    const C = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    const lv = [[9, G], [4.4, G + 10], [2.3, G + 20], [0.6, G + 35]];
    for (let s = 0; s < 3; s++) {
      const [r0, y0] = lv[s], [r1, y1] = lv[s + 1];
      for (const [cx, cz] of C) {
        beam(w, [EX + cx * r0, y0, EZ + cz * r0], [EX + cx * r1, y1, EZ + cz * r1], s === 2 ? 0.5 : 1.1 - s * 0.25, iron);
        for (const o of [-1, 1]) beam(w, [EX + cx * (r0 + o * 0.5 * (s ? 0.5 : 1)), y0, EZ + cz * (r0 - o * 0.5 * (s ? 0.5 : 1))], [EX + cx * r1, y1, EZ + cz * r1], 0.3, iron2);
      }
      // Kreuzstreben auf den vier Seiten
      const n = s === 2 ? 4 : 3;
      for (let k = 0; k < n; k++) {
        const ta = k / n, tb = (k + 1) / n, ra = r0 + (r1 - r0) * ta, rb = r0 + (r1 - r0) * tb, ya = y0 + (y1 - y0) * ta, yb = y0 + (y1 - y0) * tb;
        for (let f = 0; f < 4; f++) {
          const [ax, az] = C[f], [bx, bz] = C[(f + 1) % 4];
          beam(w, [EX + ax * ra, ya, EZ + az * ra], [EX + bx * rb, yb, EZ + bz * rb], 0.22, iron2);
          beam(w, [EX + bx * ra, ya, EZ + bz * ra], [EX + ax * rb, yb, EZ + az * rb], 0.22, iron2);
          beam(w, [EX + ax * rb, yb, EZ + az * rb], [EX + bx * rb, yb, EZ + bz * rb], 0.3, iron);
        }
      }
    }
    // Bögen zwischen den Beinen
    for (let f = 0; f < 4; f++) {
      const [ax, az] = C[f], [bx, bz] = C[(f + 1) % 4];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8, a = t * Math.PI, u = -Math.cos(a), r = 7.3;
        const mx = (ax + bx) / 2, mz = (az + bz) / 2, tx = (bx - ax) / 2, tz = (bz - az) / 2;
        w.box(1.1, 0.45, 0.5, iron, EX + mx * r + tx * u * 6.2, G + 3.2 + Math.sin(a) * 3.2, EZ + mz * r + tz * u * 6.2, Math.atan2(tx, tz) + Math.PI / 2, 0, (tx || tz) ? -Math.cos(a) * 0.9 * Math.sign(tx + tz) : 0);
      }
    }
    // Plattform 1 (Ring um das Treppenloch) und Plattform 2
    for (const [dx, dz, sx, sz] of [[0, -5.7, 13.6, 2.4], [0, 5.7, 13.6, 2.4], [-5.7, 0, 2.4, 9], [5.7, 0, 2.4, 9]]) solidBox(w, EX + dx, G + 10, EZ + dz, sx, 0.6, sz, '#5a4434', { safe: true });
    for (const [dx, dz, sx, sz] of [[0, -6.9, 13.8, 0.1], [0, 6.9, 13.8, 0.1], [-6.9, 0, 0.1, 13.8], [6.9, 0, 0.1, 13.8]]) {
      w.box(sx, 0.9, sz, iron2, EX + dx, G + 10.5, EZ + dz);
      w.box(sx || 0.2, 0.3, sz || 0.2, '#ffd23f', EX + dx, G + 9.6, EZ + dz);
    }
    solidBox(w, EX, G + 20, EZ, 7.2, 0.6, 7.2, '#5a4434', { safe: true });
    w.box(7.6, 0.9, 7.6, iron2, EX, G + 19.2, EZ);
    solidBox(w, EX, G + 32, EZ, 3, 0.6, 3, '#5a4434', { safe: true });
    w.box(1.6, 1.2, 1.6, '#8a6a50', EX, G + 35.6, EZ);
    w.box(0.3, 4, 0.3, '#c8c8c8', EX, G + 38.2, EZ);
    w.box(0.6, 0.6, 0.6, '#ff3b2f', EX, G + 40.4, EZ);
    // Treppenplattformen: drei Wendel
    const stairs = [];
    const spiral = (r, n, da, a0, y0) => {
      for (let i = 0; i < n; i++) {
        const a = a0 + i * da, x = EX + Math.cos(a) * r, z = EZ + Math.sin(a) * r, top = y0 + i + 1;
        SB.add(x, top, z, 2, 0.5, 2, i % 2 ? '#c8a07a' : '#a07a58');
        stairs.push([x, top, z]);
        if (i % 4 === 2) w.coin(x, top, z);
      }
    };
    spiral(3.2, 9, 0.75, Math.PI / 2, G);
    const a1 = Math.PI / 2 + 8 * 0.75;
    spiral(5.3, 9, 0.5, a1 + 0.6, G + 10);
    const a2 = a1 + 0.6 + 8 * 0.5;
    spiral(3.0, 11, 0.75, a2 + 0.5, G + 20);
    w.star('eiffel', EX, G + 32, EZ, 'Eiffelturm');
    w.sign('Eiffelturm', EX, G + 4.5, EZ + 10.5, { bg: '#2f5fd6', size: 0.9 });

    // ---------- Cafés am Platz ----------
    const umb = [['#e8262b', '#ffffff'], ['#2f5fd6', '#ffffff'], ['#2fbf4a', '#ffffff'], ['#ff7a1f', '#ffffff']];
    let ui = 0;
    for (const s of [-1, 1]) {
      const hx = s * 14;
      cheapHouse(w, hx, -6, 6, 10, 6, { wall: s < 0 ? '#f0dcb0' : '#f4e2d0', roof: 'flat', roofColor: '#9aa3ad', door: s < 0 ? 'e' : 'w', shutters: '#3f7f5f' });
      for (let k = 0; k < 5; k++) w.box(0.12, 1.2, 2, k % 2 ? '#ffffff' : (s < 0 ? '#e8262b' : '#2f5fd6'), hx - s * 3.4, G + 3.0, -10 + k * 2, 0, 0, s * 0.5);
      w.sign(s < 0 ? 'Café' : 'Bistro', hx - s * 3.2, G + 5, -6, { bg: s < 0 ? '#e8262b' : '#2f5fd6', size: 0.7 });
      for (const z of [-11, -6, -1]) {
        const x = s * 7.5, [c1, c2] = umb[ui++ % umb.length];
        solidBox(w, x, G + 1, z, 1.2, 1, 1.2, '#ffffff');
        w.box(0.12, 2.8, 0.12, '#888888', x, G + 1.4, z);
        for (let k = 0; k < 4; k++) w.box(1.6, 0.15, 1.6, k % 2 ? c2 : c1, x, G + 2.85, z, k * Math.PI / 8, 0.25, 0);
        w.box(0.8, 0.6, 0.8, c1, x, G + 3.1, z);
        for (const [dx, dz] of [[-1.1, 0], [1.1, 0]]) { w.box(0.6, 0.5, 0.6, '#3a3a3a', x + dx, G + 0.25, z + dz); w.box(0.6, 0.6, 0.1, '#3a3a3a', x + dx * 1.25, G + 0.75, z + dz); }
        w.box(0.3, 0.3, 0.3, '#ffffff', x + 0.2, G + 1.15, z);
      }
    }
    for (const [x, z] of [[-4.5, 2], [4.5, 2], [-4.5, -16], [4.5, -16]]) {
      const y = H(x, z);
      w.box(0.2, 3.4, 0.2, '#2d3440', x, y + 1.7, z);
      w.box(0.6, 0.6, 0.6, '#fff4c2', x, y + 3.5, z);
      w.box(0.8, 0.15, 0.8, '#2d3440', x, y + 3.9, z);
    }

    // ---------- Uhrturm mit Parlament ----------
    const BX = -22, BZ = -40, stoneC = '#d8c79a', stoneD = '#c4b283';
    solidBox(w, BX, G + 22, BZ, 4.6, 22, 4.6, stoneC);
    for (let y = 2; y < 15; y += 2.6) for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const k of [-1, 1]) w.box(nz ? 0.5 : 0.08, 1.8, nz ? 0.08 : 0.5, '#7a8a9a', BX + nx * 2.33 + (nz ? k * 1 : 0), G + y + 1, BZ + nz * 2.33 + (nx ? k * 1 : 0));
    for (const [cx, cz] of C) w.box(0.5, 22, 0.5, stoneD, BX + cx * 2.3, G + 11, BZ + cz * 2.3);
    w.box(5.4, 4.4, 5.4, stoneD, BX, G + 17.6, BZ);
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      w.box(nz ? 3.6 : 0.1, 3.6, nz ? 0.1 : 3.6, '#ffd23f', BX + nx * 2.72, G + 17.6, BZ + nz * 2.72);
      w.box(nz ? 3.0 : 0.12, 3.0, nz ? 0.12 : 3.0, '#fdfbf2', BX + nx * 2.74, G + 17.6, BZ + nz * 2.74);
      for (let h = 0; h < 12; h++) { const a = h / 12 * Math.PI * 2; w.box(nz ? 0.18 : 0.14, 0.18, nz ? 0.14 : 0.18, '#2b2b2b', BX + nx * 2.8 + (nz ? Math.sin(a) * 1.25 : 0), G + 17.6 + Math.cos(a) * 1.25, BZ + nz * 2.8 + (nx ? Math.sin(a) * 1.25 : 0)); }
    }
    w.box(4.4, 2.4, 4.4, stoneC, BX, G + 21, BZ);
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) w.box(nz ? 2.6 : 0.1, 1.6, nz ? 0.1 : 2.6, '#3a4a5a', BX + nx * 2.22, G + 21, BZ + nz * 2.22);
    for (let k = 0; k < 5; k++) w.box(4.6 - k * 0.95, 1.4, 4.6 - k * 0.95, k % 2 ? '#3a4a5a' : '#46586a', BX, G + 22.9 + k * 1.3, BZ);
    w.box(0.2, 2, 0.2, '#ffd23f', BX, G + 30, BZ);
    for (const [cx, cz] of C) w.box(0.3, 1.6, 0.3, '#ffd23f', BX + cx * 2.1, G + 23, BZ + cz * 2.1);
    // Uhrzeiger (Süd- und Ostseite) zeigen die echte Uhrzeit
    const hands = [];
    for (const [nx, nz] of [[0, 1], [1, 0]]) {
      const g = new THREE.Group();
      g.position.set(BX + nx * 2.86, G + 17.6, BZ + nz * 2.86);
      g.rotation.y = Math.atan2(nx, nz);
      const hh = part(g, 0.18, 0.8, 0.06, '#1a1a1a', 0, 0.4, 0);
      const mm = part(g, 0.12, 1.15, 0.06, '#1a1a1a', 0, 0.57, 0.04);
      const ph = new THREE.Group(), pm = new THREE.Group();
      g.add(ph, pm); ph.add(hh); pm.add(mm);
      w.add(g);
      hands.push([ph, pm]);
    }
    w.updaters.push(() => {
      const d = new Date(), m = d.getMinutes() + d.getSeconds() / 60, h = (d.getHours() % 12) + m / 60;
      for (const [ph, pm] of hands) { ph.rotation.z = -h / 12 * Math.PI * 2; pm.rotation.z = -m / 60 * Math.PI * 2; }
    });
    // Parlament
    solidBox(w, -36, G + 7, -42, 22, 7, 7, stoneC);
    for (let x = -46.5; x <= -25.5; x += 1.5) {
      w.box(0.35, 8.6, 0.35, stoneD, x, G + 4.3, -38.4);
      w.box(0.7, 2.6, 0.06, '#7a8a9a', x + 0.75, G + 4.4, -38.47);
      w.box(0.2, 1.2, 0.2, stoneD, x, G + 9.2, -38.4);
    }
    w.box(22.2, 0.3, 7.2, '#46586a', -36, G + 7.2, -42);
    for (let x = -45; x <= -27; x += 2) w.box(1, 1.3, 1, '#46586a', x, G + 7.9, -42, Math.PI / 4);
    solidBox(w, -48, G + 15, -42, 6, 15, 6, stoneC);
    for (let k = 0; k < 4; k++) w.box(0.5, 2.4, 0.5, '#ffd23f', -48 + (k % 2 ? 2.7 : -2.7), G + 16.2, -42 + (k < 2 ? 2.7 : -2.7));
    for (let y = 3; y < 14; y += 3) w.box(1.4, 1.8, 0.1, '#7a8a9a', -48, G + y, -38.95);
    w.sign('Uhrturm', BX + 4, G + 6, BZ + 5, { bg: '#46586a', size: 0.8 });

    // ---------- Stern 3: Arena aus Bögen ----------
    const AX = 32, AZ = -30, AR = 13, N = 24, segL = 2 * Math.PI * AR / N, t = 1.4, AH = 8.6, arenaC = '#d9c6a0', arenaD = '#c4ae86';
    for (let k = 0; k < N; k++) {
      const a = k / N * Math.PI * 2, sa = Math.sin(a), ca = Math.cos(a);
      const x = AX + AR * sa, z = AZ + AR * ca;
      const h = ca > 0.3 ? AH - 2.4 + (k % 2) * 0.4 : AH;
      if (k === 0) {
        for (const s of [-1, 1]) solidBox(w, x + s * 1.55, G + h, z, 0.5, h, t, arenaC);
        collider(w, x, G + h, z, 2.6, h - 3.4, t);
        w.box(2.6, h - 3.4, t, arenaC, x, G + 3.4 + (h - 3.4) / 2, z);
        w.gateAt(V(x, G, z), 's', 'Arena');
        continue;
      }
      const hx = segL / 2 * Math.abs(ca) + t / 2 * Math.abs(sa), hz = segL / 2 * Math.abs(sa) + t / 2 * Math.abs(ca);
      collider(w, x, G + h, z, hx * 2, h, hz * 2);
      w.box(segL + 0.15, h, t, k % 2 ? arenaC : '#dccaa6', x, G + h / 2, z, a);
      for (let tier = 0; tier < Math.floor(h / 2.8); tier++) {
        const ox = AX + (AR + t / 2 + 0.02) * sa, oz = AZ + (AR + t / 2 + 0.02) * ca;
        w.box(1.6, 1.9, 0.15, '#5a4a3a', ox, G + 1.3 + tier * 2.8, oz, a);
        w.box(0.4, 2.6, 0.3, arenaD, ox + Math.cos(a) * segL / 2, G + 1.4 + tier * 2.8, oz - Math.sin(a) * segL / 2, a);
        w.box(segL + 0.2, 0.3, 0.35, arenaD, ox, G + 2.65 + tier * 2.8, oz, a);
      }
      // Sitzreihen innen (fest, als Stufen)
      for (let r = 0; r < 3; r++) {
        const rr = AR - 1.6 - r * 1.3, top = G + 4.6 - r * 1.4, sx = AX + rr * sa, sz = AZ + rr * ca, L = 2 * Math.PI * rr / N;
        const shx = L / 2 * Math.abs(ca) + 0.65 * Math.abs(sa), shz = L / 2 * Math.abs(sa) + 0.65 * Math.abs(ca);
        if (ca > 0.85) continue;
        collider(w, sx, top, sz, shx * 2, top - G, shz * 2);
        w.box(L + 0.12, top - G, 1.3, r % 2 ? '#c9b48c' : '#d4c09a', sx, (top + G) / 2, sz, a);
      }
    }
    w.box(17.4, 0.08, 17.4, '#e8d8a8', AX, G + 0.04, AZ);
    // Säulen-Parkour zum Siegerpodest in der Mitte
    const cols = [];
    for (let i = 0; i < 7; i++) {
      const a = Math.PI / 2 + 0.35 + i * 0.62, x = AX + Math.cos(a) * 5.6, z = AZ + Math.sin(a) * 5.6, top = G + 1 + i;
      SB.add(x, top, z, 1.6, top - G, 1.6, i % 2 ? '#efe8dc' : '#e2d8c8');
      w.box(1.9, 0.3, 1.9, '#d6ccb8', x, top - 0.15, z);
      cols.push([x, top, z]);
      if (i % 3 === 1) w.coin(x, top, z);
    }
    SB.add(AX, G + 8, AZ, 5, 8, 5, '#f2ece0', { safe: true });
    for (const [cx, cz] of C) w.box(0.4, 1.2, 0.4, '#ffd23f', AX + cx * 2.3, G + 8.6, AZ + cz * 2.3);
    w.star('colosseum', AX, G + 8, AZ, 'Arena');
    for (const [dx, c] of [[-3, '#e8262b'], [3, '#2f5fd6']]) { w.box(0.15, 4, 0.15, '#666666', AX + dx, G + 10.6, AZ - AR); w.box(1.6, 1, 0.05, c, AX + dx + 0.85, G + 12, AZ - AR); }

    // ---------- Windmühlen mit Tulpenfeldern ----------
    const tulipCols = ['#e8262b', '#ffd23f', '#ff5fb0', '#ff7a1f', '#ffffff', '#b05fd0'];
    let fi = 0;
    for (const [x1, z1, x2, z2] of [[-56, -16, -38, -8], [-56, -4, -42, 4], [-52, 14, -40, 20], [-32, -16, -22, -8], [-30, 12, -20, 18]]) {
      for (let z = z1; z <= z2; z += 1.2) {
        const c = tulipCols[(fi + Math.floor((z - z1) / 2.4)) % tulipCols.length];
        for (let x = x1; x <= x2; x += 0.9) {
          if (edgeDist(x, z) > 56) continue;
          const y = H(x, z);
          w.box(0.08, 0.45, 0.08, '#3c8c3c', x, y + 0.22, z);
          w.box(0.3, 0.3, 0.3, c, x, y + 0.55, z);
        }
      }
      fi += 2;
    }
    const mills = [];
    const mill = (x, z, body, cap) => {
      const y = H(x, z);
      for (let k = 0; k < 3; k++) for (const a of [0, Math.PI / 4]) w.box(5 - k * 0.9, 3, 5 - k * 0.9, k ? body : '#8a6a50', x, y + 1.5 + k * 3, z, a);
      collider(w, x, y + 9, z, 4, 9, 4);
      w.box(1.2, 2, 0.1, '#5a3a20', x, y + 1, z + 2.5);
      for (const k of [1, 2]) w.box(0.8, 0.8, 0.1, '#7cc4ff', x, y + 1.6 + k * 3, z + 2.1 - k * 0.4);
      for (let k = 0; k < 3; k++) w.box(3.2 - k * 1, 0.7, 3.4 - k * 1, cap, x, y + 9.3 + k * 0.6, z);
      w.box(2.2, 0.15, 0.6, '#5a3a20', x, y + 3.2, z + 2.4);
      const sails = new THREE.Group();
      sails.position.set(x, y + 8.6, z + 2.4);
      for (let b = 0; b < 4; b++) {
        const arm = new THREE.Group();
        arm.rotation.z = b * Math.PI / 2;
        part(arm, 0.25, 6, 0.2, '#5a3a20', 0, 3, 0);
        part(arm, 1.3, 5, 0.08, '#f4efe6', 0.75, 3.4, 0.05);
        for (let k = 0; k < 4; k++) part(arm, 1.4, 0.1, 0.12, '#5a3a20', 0.7, 1.4 + k * 1.3, 0.06);
        sails.add(arm);
      }
      part(sails, 0.6, 0.6, 0.6, '#5a3a20', 0, 0, 0);
      compact(sails);
      w.add(sails);
      mills.push(sails);
    };
    mill(-46, 8, '#c84a3a', '#3a4a3a');
    mill(-30, -4, '#3f6fa0', '#3a3a3a');
    w.updaters.push((dt, t) => { mills.forEach((m, i) => { m.rotation.z = t * (0.6 + i * 0.15); }); });
    w.sign('Tulpenfelder', -36, H(-36, 4) + 3.2, 4, { bg: '#ff5fb0', size: 0.8 });

    // ---------- Fachwerkdorf ----------
    const VX = -34, VZ = 36;
    const nests = [];
    for (const [x, z, sx, sz, h, door, rc] of [[-44, 28, 6, 5, 5.6, 'e', '#a8432a'], [-44, 38, 5, 6, 5.6, 'e', '#7a3a2a'], [-34, 46, 7, 5, 5.6, 'n', '#a8432a'], [-24, 44, 5, 5, 5.6, 'w', '#8a3a2a'], [-34, 26, 6, 5, 5.6, 's', '#7a3a2a'], [-22, 28, 5, 6, 5.6, 'w', '#a8432a']]) {
      const top = cheapHouse(w, x, z, sx, sz, h, { wall: '#f6efe0', roof: 'gable', roofColor: rc, door, timber: '#5a3a20', window: '#9fd0f0', shutters: null, chimney: '#8a5a40', pitch: 0.55 });
      nests.push([x + (sx >= sz ? sx / 4 : (sx >= sz ? 0 : sx / 5)), top, z + (sx >= sz ? sz / 5 : sz / 4), sx >= sz ? sz : sx]);
      for (let k = 0; k < 4; k++) w.box(0.5, 0.3, 0.12, w.pick(['#e8262b', '#ff5fb0', '#ffd23f']), x - sx / 4 + k * 0.5 * (sx / 4), H(x, z) + 1.0, z + (door === 's' ? sz / 2 + 0.15 : 0));
    }
    // Brunnen und Maibaum
    {
      const y = H(VX, VZ);
      solidBox(w, VX, y + 0.8, VZ, 2.6, 0.8, 2.6, '#9a9a92');
      w.water(VX, VZ, 2, 2, { top: y + 0.75, color: '#5cc8ff' });
      for (const s of [-1, 1]) w.box(0.2, 2.2, 0.2, '#5a3a20', VX + s * 1.1, y + 1.9, VZ);
      w.box(2.6, 0.9, 1.4, '#a8432a', VX, y + 3.2, VZ, 0, 0, 0);
      const mx = VX + 5, mz = VZ + 3, my = H(mx, mz);
      collider(w, mx, my + 12, mz, 0.5, 12, 0.5);
      for (let k = 0; k < 12; k++) w.box(0.4, 1, 0.4, k % 2 ? '#2f5fd6' : '#ffffff', mx, my + 0.5 + k, mz, k * 0.3);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; w.box(0.5, 0.5, 0.5, '#3f8a3a', mx + Math.cos(a) * 1.2, my + 11, mz + Math.sin(a) * 1.2); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; w.box(0.08, 4, 0.08, ['#e8262b', '#ffd23f', '#2f5fd6'][i % 3], mx + Math.cos(a) * 1.0, my + 9, mz + Math.sin(a) * 1.0, 0, Math.sin(a) * 0.3, -Math.cos(a) * 0.3); }
    }
    w.sign('Fachwerkdorf', -22, H(-22, 34) + 3.6, 35, { bg: '#7a3a2a', size: 0.8 });
    groundFlowers(w, VX, VZ, 12, 8, 30, ['#e8262b', '#ffd23f', '#ffffff', '#ff5fb0']);
    // Koppel für Pferde und Weide für Schafe
    const fence = (x1, z1, x2, z2) => {
      const len = Math.hypot(x2 - x1, z2 - z1), n = Math.ceil(len / 2);
      for (let i = 0; i <= n; i++) { const x = x1 + (x2 - x1) * i / n, z = z1 + (z2 - z1) * i / n; w.box(0.25, 1.2, 0.25, '#8a5e33', x, H(x, z) + 0.6, z); }
      const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, ry = Math.atan2(x2 - x1, z2 - z1);
      for (const hh of [0.5, 1.0]) w.box(0.12, 0.12, len, '#a07040', mx, H(mx, mz) + hh, mz, ry);
      collider(w, mx, H(mx, mz) + 1.1, mz, Math.max(0.3, Math.abs(x2 - x1)), 1.1, Math.max(0.3, Math.abs(z2 - z1)));
    };
    fence(-16, 42, -16, 52); fence(-16, 52, -6, 52); fence(-6, 42, -6, 48); fence(-16, 42, -6, 42);

    // ---------- Stern 2: Gondelfahrt durch die Kanäle ----------
    for (const [x, z, sx, sz] of [[21, 30, 6, 32], [45, 30, 6, 32], [33, 17, 18, 6], [33, 43, 18, 6]]) w.water(x, z, sx - 0.1, sz - 0.1, { top: -0.55, color: '#3f9fa8', emissive: '#0b3a40' });
    // Brücken (Stufen hinauf und hinunter)
    const bridgeX = [[14, 15, 1.5], [15, 16, 2.0], [16, 17, 2.5], [17, 25, 3.0], [25, 26, 2.5], [26, 27, 2.0], [27, 28, 1.5]];
    for (const [a, b, top] of bridgeX) {
      solidBox(w, (a + b) / 2, top, 30, b - a, top === 3 ? 0.6 : top - G + 0.5, 3, top === 3 ? '#e0d2b8' : '#d6c6a8', { safe: true });
      for (const s of [-1, 1]) w.box(b - a + 0.02, 0.8, 0.2, '#f2ece0', (a + b) / 2, top + 0.4, 30 + s * 1.4);
    }
    const bridgeZ = [[50, 49, 1.5], [49, 48, 2.0], [48, 47, 2.5], [47, 39, 3.0], [39, 38, 2.5], [38, 37, 2.0], [37, 36, 1.5]];
    for (const [a, b, top] of bridgeZ) {
      solidBox(w, 33, top, (a + b) / 2, 3, top === 3 ? 0.6 : top - G + 0.5, a - b, top === 3 ? '#e0d2b8' : '#d6c6a8', { safe: true });
      for (const s of [-1, 1]) w.box(0.2, 0.8, a - b + 0.02, '#f2ece0', 33 + s * 1.4, top + 0.4, (a + b) / 2);
    }
    // Häuser auf der Insel und an den Ufern
    const pal = ['#e0a84a', '#e89a9a', '#c8643c', '#f0dcb0', '#f0a070', '#d8b0d0', '#9cc0a0'];
    let hi = 0;
    const vh = (x, z, sx, sz, h, door) => cheapHouse(w, x, z, sx, sz, h, { wall: pal[hi++ % pal.length], roof: 'flat', roofColor: '#b8643c', door, window: '#5a7a9a', sill: '#ffffff', shutters: '#3f7f5f' });
    vh(27.5, 23.5, 5, 5, 6, 's'); vh(33.5, 23, 5, 4, 7.5, 's'); vh(27.5, 36.5, 5, 5, 5.5, 'e'); vh(39.5, 36.5, 4, 5, 6.5, 'w');
    for (const z of [20.5, 28.5, 36.5]) vh(51.5, z, 4, 6, 6 + (z % 3), 'w');
    for (const x of [22, 30, 38, 46]) vh(x, 10.5, 6, 5, 5.5 + (x % 4) * 0.5, 's');
    for (const x of [24, 42]) vh(x, 49.5, 6, 4, 5.5, 'n');
    // Glockenturm
    solidBox(w, 39.5, G + 15, 24, 3.4, 15, 3.4, '#b85a3a');
    w.box(3.8, 2.4, 3.8, '#f2ece0', 39.5, G + 13.8, 24);
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) w.box(nz ? 1.6 : 0.1, 1.6, nz ? 0.1 : 1.6, '#3a3a3a', 39.5 + nx * 1.92, G + 13.8, 24 + nz * 1.92);
    for (let k = 0; k < 4; k++) w.box(3 - k * 0.75, 1.2, 3 - k * 0.75, '#4f9a7a', 39.5, G + 15.6 + k * 1.1, 24);
    w.box(0.3, 1, 0.3, '#ffd23f', 39.5, G + 20.4, 24);
    // Gondel-Pfähle und Anlegestelle
    for (const [x, z] of [[19, 33], [19, 37], [23.2, 25], [42.8, 35], [30, 15.6], [36, 44.4]]) {
      for (let k = 0; k < 6; k++) w.box(0.3, 0.6, 0.3, k % 2 ? '#2f5fd6' : '#ffffff', x, -0.6 + k * 0.6, z);
      w.box(0.4, 0.3, 0.4, '#ffd23f', x, 3.05, z);
    }
    const st = w.station(15.5, 35, 'Gondelfahrt', '#2f5fd6', G);
    solidBox(w, 18.6, G, 35, 2.2, 1.6, 2.4, '#8a5e33', { safe: true });
    const gond = new THREE.Group();
    part(gond, 1.2, 0.5, 6.0, '#1a1a1a', 0, 0, 0);
    part(gond, 0.9, 0.3, 5.2, '#1a1a1a', 0, -0.3, 0);
    part(gond, 0.6, 0.5, 1.0, '#1a1a1a', 0, 0.35, 3.2);
    part(gond, 0.4, 0.6, 0.6, '#1a1a1a', 0, 0.8, 3.7);
    part(gond, 0.12, 0.9, 0.5, '#d8d8d8', 0, 1.3, 3.95);
    for (let k = 0; k < 4; k++) part(gond, 0.1, 0.1, 0.35, '#d8d8d8', 0, 0.95 + k * 0.2, 4.25);
    part(gond, 0.6, 0.5, 1.0, '#1a1a1a', 0, 0.35, -3.2);
    part(gond, 0.4, 0.5, 0.4, '#1a1a1a', 0, 0.75, -3.6);
    part(gond, 1.0, 0.25, 1.6, '#c0392b', 0, 0.35, 0.2);
    part(gond, 1.0, 0.6, 0.25, '#c0392b', 0, 0.55, -0.6);
    part(gond, 1.25, 0.08, 6.0, '#ffd23f', 0, 0.26, 0);
    // Gondoliere mit Ringelhemd und Strohhut
    part(gond, 0.5, 0.8, 0.3, '#1a2a4a', 0, 0.65, -2.6);
    for (let k = 0; k < 4; k++) part(gond, 0.56, 0.18, 0.34, k % 2 ? '#e8262b' : '#ffffff', 0, 1.15 + k * 0.18, -2.6);
    part(gond, 0.38, 0.38, 0.38, '#f2c49a', 0, 2.0, -2.6);
    part(gond, 0.7, 0.08, 0.7, '#f0d27a', 0, 2.24, -2.6);
    part(gond, 0.4, 0.18, 0.4, '#f0d27a', 0, 2.36, -2.6);
    part(gond, 0.42, 0.06, 0.42, '#e8262b', 0, 2.3, -2.6);
    const oar = part(gond, 0.1, 0.1, 3.2, '#8a5e33', 0.5, 1.1, -2.2);
    oar.rotation.x = 0.5;
    compact(gond, [oar]);
    const gpts = [[21, 34], [21, 22], [22.5, 17.8], [27, 17], [39, 17], [43.5, 17.8], [45, 22], [45, 38], [43.5, 42.2], [39, 43], [27, 43], [22.5, 42.2], [21, 38]].map(([x, z]) => [x, -0.5, z]);
    w.addRide(pathRide(w, {
      points: gpts, closed: true, duration: 30, vehicle: gond, seat: [0, -0.4, 0.4], flat: true,
      name: 'Gondelfahrt', starId: 'gondola', station: st, exit: V(15.5, G, 38.6),
      animate(v, t) { oar.rotation.y = Math.sin(t * 1.6) * 0.35; },
    }));
    w.sign('Kanalstadt', 15, G + 4.6, 26, { bg: '#2f5fd6', size: 0.8 });
    // Café-Tische auf der Piazza
    for (const [x, z] of [[31, 29], [35, 31]]) {
      solidBox(w, x, G + 1, z, 1, 1, 1, '#ffffff');
      w.box(0.1, 2.6, 0.1, '#888888', x, G + 1.3, z);
      w.box(2, 0.2, 2, '#2fbf4a', x, G + 2.7, z, 0.4);
    }

    // ---------- Bäume, Büsche, Deko ----------
    for (const [x, z, k, s] of [[-12, 18, 'oak', 1], [12, 18, 'oak', 1.1], [-14, 28, 'birch', 1], [-8, 46, 'oak', 1.1], [8, 46, 'oak', 1], [-20, -14, 'oak', 1.1], [20, -6, 'birch', 1], [-12, -46, 'oak', 1], [12, -46, 'oak', 1.1], [-40, -18, 'birch', 1], [-56, 22, 'pine', 1.1], [-20, 52, 'oak', 1], [52, -4, 'oak', 1], [52, 6, 'birch', 1], [-4, -52, 'pine', 1.1], [4, 54, 'birch', 1], [-56, -30, 'pine', 1]]) w.tree(k, x, z, s, H(x, z));
    for (const [x, z] of [[-6, 20], [6, 20], [-6, 32], [6, 32]]) { const y = H(x, z); w.box(1.6, 1.2, 1.6, '#3c9a46', x, y + 0.6, z); w.box(1, 0.6, 1, '#4fb556', x, y + 1.4, z); }
    tufts(w, 0, 0, 112, 112, 120, ['#4f9a3a', '#5fae45'], 0.3, 0.6, (x, z) => edgeDist(x, z) > 56 || Math.abs(x) < 3 || inR(x, z, [14, 8, 56, 56]) || inR(x, z, [-14, -40, 14, 4]));
    for (const [x, z, s] of [[-8, -50, 0.8], [50, -46, 0.8], [-54, 4, 0.7]]) stone(w, x, z, s, '#8d939b');

    // ---------- Tiere ----------
    const A = (kind, x, z, o = {}) => beast(w, kind, { pos: V(x, 0, z), ...o });
    const stork = ['#ffffff', '#1a1a1a', '#1a1a1a'];
    nests.slice(0, 3).forEach(([x, top, z, span], i) => {
      const ny = top + span * 0.55 + 1.2;
      w.box(1.4, 0.4, 1.4, '#7a5a3a', x, ny - 0.2, z);
      if (i < 2) A('bird', x, z, { pos: V(x, ny, z), y: ny, behavior: 'perch', colors: stork, scale: 1.3 });
    });
    A('bird', VX, VZ, { pos: V(VX, 0, VZ), y: 16, behavior: 'fly', radius: 12, speed: 4, colors: stork, scale: 1.4 });
    A('cow', -26, 6, { radius: 3, speed: 0.5, hungry: true });
    A('cow', -23, 4, { radius: 3, speed: 0.4 });
    for (let i = 0; i < 3; i++) A('sheep', -10 + i * 2.5, -48 + (i % 2) * 2, { radius: 4, speed: 0.5, hungry: i === 1 });
    A('horse', -12, 46, { radius: 2.5, speed: 1, color: '#8a5a30', hungry: true });
    A('horse', -9, 48, { radius: 2.5, speed: 0.9, color: '#f2f2f2' });
    const pigeon = ['#9aa3b0', '#7d8794', '#5a6470'];
    A('bird', -3, -4, { radius: 3, speed: 1, behavior: 'hop', colors: pigeon, hungry: true });
    A('bird', 3, -10, { radius: 3, speed: 1, behavior: 'hop', colors: pigeon });
    A('bird', 0, -8, { pos: V(0, 0, -8), y: 9, behavior: 'fly', radius: 8, speed: -4, colors: pigeon });
    for (let i = 0; i < 2; i++) A('duck', 45, 26 + i * 6, { pos: V(45, -0.55, 26 + i * 6), y: -0.55, behavior: 'swim', radius: 2, speed: 0.6, hungry: i === 0 });

    // ---------- Münzen ----------
    coinTrail(w, 0, 30, 0, 14, 4);
    coinsAt(w, [[0, 10], [0, 6], [-5.5, 10], [5.5, 10]]);
    coinTrail(w, 0, 2, 0, -18, 4);
    coinTrail(w, -4, -10, -16, -29, 4);
    coinTrail(w, 6, -8, 30, -14, 5);
    coinTrail(w, 4, 25, 13, 33, 3);
    coinsAt(w, [[21, 30, 3], [33, 43, 3], [33, 30], [30, 26], [36, 34]]);
    coinTrail(w, -6, 28, -20, 34, 3);
    coinsAt(w, [[VX + 3, VZ - 3], [VX - 3, VZ + 3], [-46, 2], [-36, -6], [-26, 8], [-50, -10]]);
    coinTrail(w, -22, -34, -42, -34, 4);

    SB.flush();
  },
};
