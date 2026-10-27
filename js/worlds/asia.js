// Asien: Chinesische Mauer über Hügeln, rote Pagode, Bambuswald mit Pandas, Kirschblüten und Koi-Teich,
// schneebedeckter Vulkan, Reisterrassen, weißer Kuppelpalast mit Wasserbecken und Drachenboot-See.
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';
import { pathRide, part } from '../rides.js';
import { collider, solidBox, studBlocks, groundPath, groundFlowers, tufts, stone, coinsAt, coinTrail, beast, compact, stepMountain, smooth, clamp01, edgeDist, rectDist, segDist, hash, V } from './africa-kit.js';

// Mauer: achsenparalleler Zickzack-Weg über den Hügelkamm, steigt nach Nordosten an
const WALL = [[-50, -6], [-50, -24], [-36, -24], [-36, -38], [-22, -38], [-22, -50], [-6, -50]];
const WALL_LEN = WALL.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - WALL[i][0], p[1] - WALL[i][1]), 0);
function wallNear(x, z) {
  let best = 1e9, prog = 0, run = 0;
  for (let i = 1; i < WALL.length; i++) {
    const a = WALL[i - 1], b = WALL[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d = segDist(x, z, a, b);
    if (d < best) {
      const t = clamp01(((x - a[0]) * (b[0] - a[0]) + (z - a[1]) * (b[1] - a[1])) / (L * L));
      best = d; prog = (run + t * L) / WALL_LEN;
    }
    run += L;
  }
  return { d: best, s: prog };
}
const crest = (s) => 1 + 6.5 * s;

const FLAT = [[-10, 8, 10, 62], [-14, -14, 14, 12], [17, -49, 51, -15], [14, -12, 56, 18], [-54, 20, -12, 54]];
const POND = { x: 0, z: -4, rx: 9, rz: 5 };
const LAKE = { x: -34, z: 37, rx: 13, rz: 10 };
const q = (o, x, z) => ((x - o.x) / o.rx) ** 2 + ((z - o.z) / o.rz) ** 2;
const terraceK = (x, z) => Math.min(Math.floor((x - 16) / 4.5), Math.floor((z - 20) / 4), Math.floor((57 - edgeDist(x, z)) / 1.5));

function height(x, z) {
  const e = edgeDist(x, z);
  if (e > 62) return 0;
  if (e > 57) return 0.5;
  if (q(LAKE, x, z) < 1) return 0;
  if (q(POND, x, z) < 1) return 0.5;
  if (x > 16 && z > 20) return 1 + Math.max(0, terraceK(x, z));
  const wn = wallNear(x, z);
  const ridge = crest(wn.s) * (1 - smooth(clamp01((wn.d - 1.5) / 15))) - 1;
  const d = Math.min(...FLAT.map((r) => rectDist(x, z, r)), (Math.sqrt(q(LAKE, x, z)) - 1) * 8);
  const hills = (1.2 + Math.sin(x * 0.12) * Math.cos(z * 0.1 + 1) * 1.2) * smooth(clamp01(d / 8)) * smooth(clamp01((57 - e) / 6));
  return 1 + Math.max(ridge, hills, 0);
}

function color(x, z, h) {
  const e = edgeDist(x, z), r = hash(x, z);
  if (e > 57) return r < 0.5 ? '#f1d38b' : '#ead09a';
  if (q(LAKE, x, z) < 1.5 && q(LAKE, x, z) >= 1) return r < 0.5 ? '#d9cf9a' : '#cfc590';
  if (q(POND, x, z) < 1) return '#5d7a6a';
  if (x > 16 && z > 20 && terraceK(x, z) >= 0) return (Math.floor(z / 2) + terraceK(x, z)) % 3 === 0 ? '#6ab8b0' : r < 0.5 ? '#86c95a' : '#7cc050';
  if (h > 4) return r < 0.5 ? '#5e9a48' : '#56913f';
  return r < 0.33 ? '#6fb552' : r < 0.66 ? '#66ad4b' : '#78bd5a';
}

export const asia = {
  id: 'asia',
  name: 'Asien',
  seed: 202,
  theme: {
    sky: ['#3a7fd0', '#a8d4ff', '#fff0f5'], fog: '#e8e4f2', sea: '#2f8fc9', fogNear: 120, fogFar: 380,
    light: { hemi: 1.6, sun: 2.2, sunColor: '#fff2e6', sky: '#ffffff', ground: '#7d9a7a' },
  },
  stars: { wall: 'Chinesische Mauer', pagoda: 'Pagode', dragonboat: 'Drachenboot' },
  build(w) {
    w.terrain({ x0: -66, z0: -66, cols: 66, rows: 66, cell: 2, step: 0.5, height, color });
    const H = (x, z) => w.heightAt(x, z);
    exitPortal(w, 53, 'worldtour');
    const SB = studBlocks(w);

    // ---------- Schneevulkan im Hintergrund ----------
    const fuji = stepMountain(w, 36, -215, [[74, 5, '#5f7396'], [66, 5, '#62789c'], [58, 5, '#667ea3'], [50, 5, '#6a83a8'], [42, 5, '#7088ad'], [35, 5, '#7890b4'], [28, 5, '#e6eef8'], [22, 5, '#f2f6fc'], [17, 4, '#ffffff']]);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; w.box(8, 6, 3, '#f4f8ff', 36 + Math.cos(a) * 30, fuji - 13, -215 + Math.sin(a) * 30, Math.PI / 2 - a); }
    w.box(18, 1, 18, '#c8d0dc', 36, fuji + 0.1, -215, Math.PI / 6);

    // ---------- Wege ----------
    const sand = '#e2d3a8';
    groundPath(w, [[0, 48], [0, 3]], 3, sand);
    groundPath(w, [[0, -11], [0, -14], [34, -14], [34, -18]], 3, sand);
    groundPath(w, [[0, -14], [-30, -12], [-48, -2]], 2.6, sand);
    groundPath(w, [[0, 22], [14, 9], [29, 9]], 2.6, sand);
    groundPath(w, [[0, 26], [-17, 36]], 2.6, sand);
    groundPath(w, [[0, 32], [18, 32]], 2.6, sand);

    // ---------- Torii über dem Weg ----------
    {
      const z = 13, y = H(0, z);
      for (const s of [-1, 1]) {
        solidBox(w, s * 3.2, y + 5.2, z, 0.8, 5.2, 0.8, '#d6342a');
        w.box(1.1, 0.5, 1.1, '#2b2b2b', s * 3.2, y + 0.25, z);
      }
      w.box(9.4, 0.6, 1.1, '#2b2b2b', 0, y + 5.9, z);
      w.box(8.8, 0.5, 0.9, '#d6342a', 0, y + 5.4, z);
      for (const s of [-1, 1]) w.box(1.2, 0.5, 1.1, '#2b2b2b', s * 4.6, y + 6.05, z, 0, 0, s * 0.25);
      w.box(7.6, 0.4, 0.6, '#d6342a', 0, y + 4.3, z);
      w.box(0.5, 1, 0.3, '#2b2b2b', 0, y + 4.9, z);
    }

    // ---------- Koi-Teich mit roter Bogenbrücke ----------
    w.water(POND.x, POND.z, POND.rx * 2 - 0.4, POND.rz * 2 - 0.4, { top: 0.85, color: '#4fb8c8', emissive: '#0b3a4a' });
    for (let i = 0; i < 7; i++) {
      const x = POND.x + w.r(-7, 7), z = POND.z + w.r(-3.4, 3.4);
      if (Math.abs(x) < 2.2) continue;
      w.box(0.9, 0.06, 0.9, '#4f9a3a', x, 0.9, z, w.r(0, 3));
      if (i % 2) w.box(0.25, 0.2, 0.25, '#ffb7d5', x + 0.2, 1.0, z);
    }
    const bridge = [[3, 1, 1.5], [1, -1, 2.0], [-1, -7, 2.5], [-7, -9, 2.0], [-9, -11, 1.5]];
    for (const [z1, z2, top] of bridge) {
      SB.add(0, top, (z1 + z2) / 2, 3, 0.5, z1 - z2, '#9a4a2a', { safe: true });
      for (const s of [-1, 1]) w.box(0.18, 0.18, z1 - z2, '#d6342a', s * 1.45, top + 1, (z1 + z2) / 2);
    }
    for (let z = 2.5; z >= -10.5; z -= 1.6) {
      const top = bridge.find(([z1, z2]) => z <= z1 && z >= z2)?.[2] ?? 1.5;
      for (const s of [-1, 1]) w.box(0.25, 1.1, 0.25, '#d6342a', s * 1.45, top + 0.5, z);
    }
    for (const [z1, z2, top] of bridge) for (const s of [-1, 1]) w.box(0.16, 0.7, z1 - z2 + 0.02, '#d6342a', s * 1.52, top - 0.35, (z1 + z2) / 2);
    w.sign('Koi-Teich', -9, 3.2, 4, { bg: '#d6342a', size: 0.8 });
    // Steinlaternen
    const stoneLantern = (x, z) => {
      const y = H(x, z);
      w.box(0.9, 0.3, 0.9, '#9a9a92', x, y + 0.15, z);
      w.box(0.35, 1.0, 0.35, '#a8a8a0', x, y + 0.8, z);
      w.box(0.8, 0.6, 0.8, '#b8b8b0', x, y + 1.6, z);
      w.box(0.45, 0.35, 0.82, '#ffe8a0', x, y + 1.6, z);
      w.box(1.2, 0.25, 1.2, '#8a8a82', x, y + 2.05, z, Math.PI / 4);
      w.box(0.3, 0.3, 0.3, '#8a8a82', x, y + 2.3, z);
    };
    for (const [x, z] of [[-10, -9], [10, -9], [-10, 1.5], [10, 1.5], [-3, 6], [3, 6]]) stoneLantern(x, z);
    // rote Papierlaternen an Pfosten entlang des Weges
    for (const z of [9, 18, 26]) for (const s of [-1, 1]) {
      const x = s * 2.6, y = H(x, z);
      w.box(0.18, 3.4, 0.18, '#3a2416', x, y + 1.7, z);
      w.box(0.8, 0.12, 0.12, '#3a2416', x - s * 0.3, y + 3.3, z);
      w.box(0.6, 0.75, 0.6, '#e8262b', x - s * 0.55, y + 2.75, z);
      w.box(0.66, 0.1, 0.66, '#ffd23f', x - s * 0.55, y + 3.15, z);
      w.box(0.66, 0.1, 0.66, '#ffd23f', x - s * 0.55, y + 2.35, z);
    }
    // Leuchtende Laternen-Kette über dem Teich
    const glow = new THREE.MeshLambertMaterial({ color: '#ff5a3a', emissive: '#c02010' });
    const lanterns = [];
    for (let i = 0; i < 6; i++) {
      const m = w.shape(new THREE.SphereGeometry(0.35, 8, 6), '#ff5a3a', -6 + i * 2.4, 4.6 - Math.sin(i / 5 * Math.PI) * 0.6, -12, { mat: glow, scale: [1, 1.3, 1] });
      lanterns.push(m);
    }
    for (const s of [-1, 1]) w.box(0.2, 4.6, 0.2, '#3a2416', s * 7.2, 2.3, -12);
    w.box(14.4, 0.05, 0.05, '#3a2416', 0, 4.9, -12);
    w.updaters.push((dt, t) => { lanterns.forEach((m, i) => { m.rotation.z = Math.sin(t * 1.4 + i) * 0.12; }); });

    // ---------- Stern 1: Chinesische Mauer ----------
    const wallStone = '#a89f8f', walkway = '#8f8676', merlon = '#9a907f';
    let progress = 0, segCount = 0;
    const T = (s) => Math.round(crest(s) * 2) / 2 + 3.5;
    const ground = (x, z, sx, sz) => Math.max(H(x - sx / 2 + 0.1, z - sz / 2 + 0.1), H(x + sx / 2 - 0.1, z - sz / 2 + 0.1), H(x - sx / 2 + 0.1, z + sz / 2 - 0.1), H(x + sx / 2 - 0.1, z + sz / 2 - 0.1));
    const wallPts = [];
    const tower = (x, z, top, size, roof) => {
      const g = Math.min(H(x, z), top - 4);
      solidBox(w, x, top, z, size, top - g + 1, size, '#9c9384', { safe: true });
      for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const k of [-1, 1]) w.box(nz ? 0.6 : 0.08, 1.0, nz ? 0.08 : 0.6, '#3a3430', x + nx * (size / 2 + 0.02) + (nz ? k * size / 4 : 0), top - 2, z + nz * (size / 2 + 0.02) + (nx ? k * size / 4 : 0));
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
        const u = -size / 2 + 0.3 + i * (size - 0.6) / 3;
        w.box(0.55, 0.7, 0.55, merlon, x + u, top + 0.35, z + s * (size / 2 - 0.28));
        w.box(0.55, 0.7, 0.55, merlon, x + s * (size / 2 - 0.28), top + 0.35, z + u);
      }
      if (roof) {
        for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) w.box(0.4, 3.4, 0.4, '#d6342a', x + dx * (size / 2 - 0.7), top + 1.7, z + dz * (size / 2 - 0.7));
        w.box(size + 1.6, 0.4, size + 1.6, '#2f4f4f', x, top + 3.6, z);
        w.box(size, 0.5, size, '#36605a', x, top + 4.0, z);
        w.box(size - 1.6, 0.6, size - 1.6, '#2f4f4f', x, top + 4.5, z);
        for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) w.box(0.4, 0.4, 1.2, '#ffd23f', x + dx * (size / 2 + 0.6), top + 3.9, z + dz * (size / 2 + 0.6), Math.atan2(dx, dz), -0.5);
        w.box(0.3, 1.2, 0.3, '#ffd23f', x, top + 5.3, z);
      }
    };
    const broken = new Set(['2:3', '4:3', '6:4']);
    let run = 0;
    for (let i = 1; i < WALL.length; i++) {
      const [ax, az] = WALL[i - 1], [bx, bz] = WALL[i], L = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L;
      const m0 = i === 1 ? 0 : 2.5, m1 = i === WALL.length - 1 ? 3 : 2.5, n = Math.round((L - m0 - m1) / 2), seg = (L - m0 - m1) / n;
      for (let j = 0; j < n; j++) {
        const u = m0 + seg * (j + 0.5);
        const x = ax + dx * u, z = az + dz * u, s = (run + u) / WALL_LEN;
        const sx = dx ? seg : 3, sz = dz ? seg : 3;
        const top = Math.max(T(s), ground(x, z, sx, sz) + 3);
        wallPts.push([x, top, z]);
        if (broken.has(`${i}:${j}`)) {
          for (let k = 0; k < 3; k++) w.box(w.r(0.6, 1.2), 0.6, w.r(0.6, 1.2), wallStone, x + w.r(-1, 1), H(x, z) + 0.3, z + w.r(-1, 1), w.r(0, 3));
          w.box(sx, 1.2, sz, wallStone, x, H(x, z) + 0.2, z);
          wallPts.pop();
          continue;
        }
        const g = H(x, z);
        collider(w, x, top, z, sx, top - g + 1, sz, { safe: true });
        w.box(sx + (dx ? 0.02 : 0), top - g + 1, sz + (dz ? 0.02 : 0), j % 2 ? wallStone : '#a39a8a', x, (top + g - 1) / 2, z);
        w.box(dx ? seg + 0.02 : 2.2, 0.08, dz ? seg + 0.02 : 2.2, walkway, x, top + 0.04, z);
        for (const sd of [-1, 1]) {
          const mx = x + (dx ? 0 : sd * 1.3), mz = z + (dz ? 0 : sd * 1.3);
          collider(w, mx, top + 0.7, mz, dx ? seg : 0.4, 0.7, dz ? seg : 0.4);
          w.box(dx ? 0.7 : 0.4, 0.7, dz ? 0.7 : 0.4, merlon, mx - dx * 0.5, top + 0.35, mz - dz * 0.5);
          w.box(dx ? 0.7 : 0.4, 0.35, dz ? 0.7 : 0.4, merlon, mx + dx * 0.5, top + 0.18, mz + dz * 0.5);
        }
        if (segCount++ % 5 === 2) w.coin(x, top, z);
      }
      run += L;
      // Wachturm an der Ecke
      if (i < WALL.length - 1) {
        const s = run / WALL_LEN, top = T(s) + 1.1;
        tower(bx, bz, top, 5, false);
        wallPts.push([bx, top, bz]);
      }
    }
    // Höchster Wachturm mit Pavillon-Dach und Stern
    const [ex, ez] = WALL[WALL.length - 1];
    const lastTop = wallPts[wallPts.length - 1][1];
    SB.add(ex - 2.6, lastTop + 1.1, ez, 1.6, 1.1, 2.2, '#b8ae9c');
    tower(ex + 1, ez, lastTop + 2.2, 6, true);
    w.star('wall', ex + 1, lastTop + 2.2, ez, 'Chinesische Mauer');
    // Treppe hinauf zum Anfang der Mauer
    const [sx0, sz0] = WALL[0], t0 = wallPts[0][1];
    for (let k = 1; k <= 3; k++) {
      const z = sz0 + 0.75 + (k - 1) * 1.5, top = t0 - 0.9 * k;
      if (top <= H(sx0, z) + 0.3) break;
      solidBox(w, sx0, top, z, 3, top - H(sx0, z) + 1, 1.5, '#a39a8a');
    }
    w.sign('Chinesische Mauer', sx0, H(sx0, sz0 + 6) + 4, sz0 + 6, { bg: '#8f2a2a', size: 0.8 });
    w.wallPts = wallPts;

    // ---------- Stern 2: Pagode im Hof ----------
    const PX = 34, PZ = -32, PY = H(PX, PZ);
    w.enclosure({ x: PX, z: PZ, w: 26, d: 26, side: 's', h: 4.4, y: PY, color: '#c0392b', label: 'Pagode', cap: '#2f4f4f' });
    SB.add(PX, PY + 1, PZ, 19, 1, 19, '#d8d0c0', { safe: true });
    SB.add(PX, PY + 0.5, PZ + 10.25, 4, 0.5, 1.5, '#d8d0c0');
    const R = [8, 6.5, 5, 3.5], red = '#c0392b', tile = '#2e5e4e';
    const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    for (let k = 0; k < 4; k++) {
      const Y = PY + 1 + 3 * k, C = R[k] - 1.5;
      solidBox(w, PX, Y + 2.6, PZ, 2 * C, 2.6, 2 * C, red);
      for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const fx = PX + nx * (C + 0.03), fz = PZ + nz * (C + 0.03);
        w.box(nz ? 1.4 : 0.08, 1.9, nz ? 0.08 : 1.4, k === 0 && nz === 1 ? '#5a1a10' : '#ffd23f', fx, Y + 1.05, fz);
        w.box(nz ? 1.0 : 0.1, 1.5, nz ? 0.1 : 1.0, '#7a1a10', fx, Y + 1.05, fz);
        for (const s of [-1, 1]) w.box(nz ? 0.3 : 0.12, 2.6, nz ? 0.12 : 0.3, '#8a1f14', fx + (nz ? s * (C - 0.2) : 0), Y + 1.3, fz + (nx ? s * (C - 0.2) : 0));
      }
      solidBox(w, PX, Y + 3, PZ, 2 * R[k], 0.4, 2 * R[k], tile, { safe: true });
      w.box(2 * R[k] + 0.1, 0.14, 2 * R[k] + 0.1, '#ffd23f', PX, Y + 2.55, PZ);
      for (const [dx, dz] of corners) w.box(0.35, 0.35, 1.1, '#ffd23f', PX + dx * (R[k] - 0.1), Y + 3.2, PZ + dz * (R[k] - 0.1), Math.atan2(dx, dz), -0.6);
      // Sprungblock in einer Ecke der Fläche darunter
      const S = k === 0 ? 9.5 : R[k - 1], [cx, cz] = corners[k], base = k === 0 ? PY + 1 : PY + 1 + 3 * k;
      SB.add(PX + cx * (S - 0.75), base + 1.5, PZ + cz * (S - 0.75), 1.4, 1.5, 1.4, '#e8262b');
      w.box(1.45, 0.15, 1.45, '#ffd23f', PX + cx * (S - 0.75), base + 1.45, PZ + cz * (S - 0.75));
      if (k > 0) w.coin(PX + cx * (S - 0.75), base + 1.5, PZ + cz * (S - 0.75));
    }
    const top = PY + 13;
    for (const [dx, dz] of corners) w.box(0.25, 3, 0.25, red, PX + dx * 1.6, top + 1.5, PZ + dz * 1.6);
    w.box(4.6, 0.4, 4.6, tile, PX, top + 3.2, PZ);
    w.box(3.2, 0.4, 3.2, '#36605a', PX, top + 3.6, PZ);
    for (let i = 0; i < 5; i++) w.box(0.5 - i * 0.05, 0.5, 0.5 - i * 0.05, '#ffd23f', PX, top + 4.1 + i * 0.55, PZ, i * 0.4);
    w.star('pagoda', PX, top, PZ, 'Pagode');
    for (const [x, z] of [[24, -42], [44, -42], [24, -23], [44, -23]]) w.tree('blossom', x, z, 0.8, H(x, z));

    // ---------- Weißer Kuppelpalast mit Wasserbecken ----------
    const TX = 42, TZ = 3, TY = H(TX, TZ), marble = '#f4f1ea';
    solidBox(w, TX, TY + 1.2, TZ, 18, 1.2, 18, '#ece6da', { safe: true });
    solidBox(w, TX - 9.75, TY + 0.8, TZ, 1.5, 0.8, 7, '#e2dccf');
    solidBox(w, TX - 11.25, TY + 0.4, TZ, 1.5, 0.4, 7, '#e2dccf');
    const HB = TY + 1.2;
    solidBox(w, TX, HB + 7, TZ, 11, 7, 11, marble);
    for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const fx = TX + nx * 5.53, fz = TZ + nz * 5.53;
      w.box(nz ? 3.2 : 0.1, 4.6, nz ? 0.1 : 3.2, '#c9c2b2', fx, HB + 2.3, fz);
      w.box(nz ? 2.4 : 0.12, 4.0, nz ? 0.12 : 2.4, '#3a4a5a', fx, HB + 2.0, fz);
      for (const s of [-1, 1]) {
        w.box(nz ? 1.6 : 0.12, 0.25, nz ? 0.12 : 1.6, '#3a4a5a', fx + (nz ? s * 0.6 : 0), HB + 4.2, fz + (nx ? s * 0.6 : 0), 0, 0, nz ? -s * 0.5 : 0);
        for (const r of [0, 1]) w.box(nz ? 1.1 : 0.12, 1.5, nz ? 0.12 : 1.1, '#3a4a5a', fx + (nz ? s * 3.6 : 0), HB + 1.2 + r * 2.6, fz + (nx ? s * 3.6 : 0));
      }
      w.box(nz ? 11.2 : 0.14, 0.3, nz ? 0.14 : 11.2, '#d9c9a0', fx, HB + 6.6, fz);
    }
    for (const a of [0, Math.PI / 4]) w.box(6.4, 1.6, 6.4, marble, TX, HB + 7.8, TZ, a);
    w.sphere(4.1, marble, TX, HB + 10.8, TZ, { seg: 20, scale: [1, 1.22, 1] });
    w.box(0.3, 2.2, 0.3, '#ffd23f', TX, HB + 16.6, TZ);
    w.box(0.6, 0.6, 0.6, '#ffd23f', TX, HB + 16, TZ, Math.PI / 4);
    for (const [dx, dz] of corners) {
      for (const [ox, oz] of [[0.8, 0.8], [-0.8, 0.8], [0.8, -0.8], [-0.8, -0.8]]) w.box(0.25, 1.6, 0.25, marble, TX + dx * 4.2 + ox, HB + 7.8, TZ + dz * 4.2 + oz);
      w.box(2.2, 0.3, 2.2, marble, TX + dx * 4.2, HB + 8.7, TZ + dz * 4.2);
      w.box(1.4, 1.1, 1.4, marble, TX + dx * 4.2, HB + 9.3, TZ + dz * 4.2, Math.PI / 4);
      w.box(0.15, 0.8, 0.15, '#ffd23f', TX + dx * 4.2, HB + 10.2, TZ + dz * 4.2);
      // Minarette
      const mx = TX + dx * 8.2, mz = TZ + dz * 8.2;
      for (const a of [0, Math.PI / 4]) w.box(1.3, 13, 1.3, marble, mx, HB + 6.5, mz, a);
      for (const hh of [4.5, 9]) w.box(2, 0.35, 2, '#e2dccf', mx, HB + hh, mz, Math.PI / 8);
      for (const a of [0, Math.PI / 4]) w.box(1.6, 0.9, 1.6, marble, mx, HB + 13.5, mz, a);
      w.box(1.1, 0.8, 1.1, marble, mx, HB + 14.3, mz, Math.PI / 4);
      w.box(0.12, 0.8, 0.12, '#ffd23f', mx, HB + 15, mz);
      collider(w, mx, HB + 13, mz, 1.5, 13, 1.5);
    }
    // Wasserbecken mit Zypressen
    const poolY = H(24, TZ);
    for (const [x, z, sx, sz] of [[24, TZ - 2.1, 13, 0.6], [24, TZ + 2.1, 13, 0.6], [17.6, TZ, 0.6, 4.8], [30.4, TZ, 0.6, 4.8]]) w.box(sx, 0.5, sz, '#e8e2d6', x, poolY + 0.25, z);
    w.water(24, TZ, 12.4, 3.6, { top: poolY + 0.35, color: '#6fc4f0', emissive: '#1a4a70' });
    for (let x = 18.5; x <= 30; x += 2.9) for (const s of [-1, 1]) {
      const z = TZ + s * 3.6, y = H(x, z);
      w.box(0.9, 3.4, 0.9, '#2f6b3a', x, y + 1.9, z);
      w.box(0.6, 1.2, 0.6, '#357a42', x, y + 4.0, z);
    }
    w.sign('Palast', TX - 11, TY + 5.5, TZ, { bg: '#2f7df6', size: 0.8 });

    // ---------- Reisterrassen ----------
    for (let i = 0; i < 360; i++) {
      const x = w.r(18, 56), z = w.r(22, 56);
      if (edgeDist(x, z) > 55.5 || terraceK(x, z) < 0) continue;
      const fx = Math.floor(x) + 0.5, fz = Math.floor(z * 1.5) / 1.5, y = H(fx, fz);
      if (Math.abs(H(fx + 0.6, fz) - y) > 0.1 || Math.abs(H(fx - 0.6, fz) - y) > 0.1) continue;
      w.box(0.18, 0.55, 0.18, i % 3 ? '#4f9a2a' : '#6fb83a', fx, y + 0.27, fz);
      w.box(0.12, 0.4, 0.12, '#8fd04a', fx + 0.2, y + 0.2, fz + 0.1, 0, 0.3);
    }
    w.sign('Reisterrassen', 20, 4.2, 30, { bg: '#4f9a2a', size: 0.8 });

    // ---------- Bambuswald ----------
    const bambooAvoid = (x, z) => Math.hypot(x + 38, z - 8) < 5 || segDist(x, z, [0, -14], [-30, -12]) < 2.5 || segDist(x, z, [-30, -12], [-48, -2]) < 2.5 || Math.hypot(x + 28, z - 5) < 3;
    for (let i = 0, n = 0; i < 600 && n < 230; i++) {
      const x = w.r(-56, -20), z = w.r(-6, 22);
      if (edgeDist(x, z) > 56 || bambooAvoid(x, z) || wallNear(x, z).d < 3) continue;
      const y = H(x, z), h = w.r(5, 9), c = w.pick(['#6fa83a', '#7fbf45', '#5e9632', '#8acb52']);
      w.box(0.28, h, 0.28, c, x, y + h / 2, z);
      for (let k = 1; k < h - 1; k += 1.4) w.box(0.34, 0.1, 0.34, '#4a7a28', x, y + k, z);
      w.box(1.2, 0.5, 0.5, '#5aa83a', x + 0.5, y + h - 0.4, z, w.r(0, 3), 0, 0.3);
      w.box(0.5, 0.45, 1.1, '#6fbf45', x - 0.3, y + h - 1.2, z + 0.3, w.r(0, 3));
      if (n % 6 === 0) collider(w, x, y + 3, z, 0.3, 3, 0.3);
      n++;
    }
    w.sign('Bambuswald', -30, H(-30, 8) + 4, 8, { bg: '#4f9a2a', size: 0.8 });

    // ---------- Stern 3: Drachenboot auf dem See ----------
    for (let i = 0; i < 30; i++) {
      const a = i / 30 * Math.PI * 2, x = LAKE.x + Math.cos(a) * (LAKE.rx + 0.6), z = LAKE.z + Math.sin(a) * (LAKE.rz + 0.6);
      if (Math.abs(a) < 0.3 || Math.abs(a - Math.PI * 2) < 0.3) continue;
      if (i % 2) tufts(w, x, z, 1.4, 1.4, 2, ['#5e8a2e', '#79a83a'], 0.8, 1.6);
    }
    const sx = LAKE.x + LAKE.rx + 4.5, sz = LAKE.z, sy = H(sx, sz);
    const st = w.station(sx, sz, 'Drachenboot', '#d6342a', sy);
    solidBox(w, LAKE.x + LAKE.rx + 0.6, sy, sz, 4.6, 1.8, 2.6, '#a0764e', { safe: true });
    for (const s of [-1, 1]) w.box(0.25, 2.2, 0.25, '#6b4423', LAKE.x + LAKE.rx - 1.4, sy - 0.6, sz + s * 1.2);
    const boat = new THREE.Group();
    part(boat, 1.5, 0.6, 7.4, '#d6342a', 0, 0.1, 0);
    part(boat, 1.0, 0.4, 6.6, '#8a2a1a', 0, -0.3, 0);
    part(boat, 1.62, 0.14, 7.6, '#ffd23f', 0, 0.45, 0);
    for (let i = -3; i <= 3; i++) part(boat, 1.56, 0.22, 0.6, i % 2 ? '#2fbf4a' : '#1f8a3a', 0, 0.15, i * 1.0);
    part(boat, 0.7, 1.4, 0.7, '#2fbf4a', 0, 0.9, 3.8);
    part(boat, 0.9, 0.8, 1.3, '#2fbf4a', 0, 1.8, 4.2);
    part(boat, 0.7, 0.4, 0.9, '#ffd23f', 0, 1.6, 5.0);
    part(boat, 0.6, 0.18, 0.8, '#e8262b', 0, 1.3, 4.95);
    for (const s of [-1, 1]) {
      part(boat, 0.12, 0.25, 0.25, '#ffffff', s * 0.45, 2.0, 4.6);
      part(boat, 0.08, 0.12, 0.12, '#111111', s * 0.5, 2.0, 4.65);
      part(boat, 0.12, 0.7, 0.12, '#ffd23f', s * 0.3, 2.45, 3.9).rotation.x = -0.6;
    }
    for (let i = 0; i < 4; i++) part(boat, 0.1, 0.4, 0.3, '#e8262b', 0, 2.3 - i * 0.35, 3.75 - i * 0.12);
    part(boat, 0.5, 1.2, 0.5, '#2fbf4a', 0, 0.9, -3.8);
    part(boat, 0.4, 0.4, 1.1, '#ffd23f', 0, 1.6, -4.1);
    part(boat, 0.8, 0.6, 0.8, '#e8262b', 0, 0.75, 2.3);
    part(boat, 0.85, 0.08, 0.85, '#f4e8c8', 0, 1.06, 2.3);
    part(boat, 0.08, 2.2, 0.08, '#3a2416', 0, 1.5, -3.2);
    part(boat, 0.05, 0.7, 1.0, '#ffd23f', 0, 2.2, -3.7);
    const oars = [];
    for (const z of [1.2, -0.4, -2.0]) for (const s of [-1, 1]) {
      const o = part(boat, 1.8, 0.1, 0.22, '#c49a6c', s * 1.3, 0.25, z);
      o.rotation.z = s * 0.5;
      oars.push([o, s]);
    }
    compact(boat, oars.map(([o]) => o));
    const route = [];
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; route.push([LAKE.x + Math.cos(a) * 9, -0.45, LAKE.z - Math.sin(a) * 6]); }
    w.addRide(pathRide(w, {
      points: route, closed: true, duration: 26, vehicle: boat, seat: [0, -0.35, -1.2], flat: true,
      name: 'Drachenboot', starId: 'dragonboat', station: st, exit: V(sx + 0.5, sy, sz + 3.6),
      animate(v, t) { for (const [o, s] of oars) { o.rotation.y = Math.sin(t * 5) * 0.5; o.rotation.z = s * (0.45 + Math.cos(t * 5) * 0.15); } },
    }));
    for (const [x, z] of [[-40, 32], [-30, 42], [-26, 30]]) {
      w.box(1.4, 0.06, 1.4, '#3f8f3a', x, -0.72, z, w.r(0, 3));
      w.box(0.4, 0.4, 0.4, '#ff8ac0', x, -0.5, z);
    }

    // ---------- Kirschblüten und Deko ----------
    for (const [x, z, s] of [[-12, -6, 1.1], [12, -2, 1], [-13, 4, 0.9], [11, -10, 1.1], [-8, 14, 0.9], [8, 16, 1], [-12, 24, 1], [12, 26, 0.9], [-10, 34, 1.1], [10, 40, 1], [-22, 16, 1], [18, -6, 0.9], [-4, -20, 1], [14, -22, 1.1], [-14, -18, 0.9], [-20, 48, 1.2], [6, 48, 1], [52, -10, 1], [-6, 54, 1]]) w.tree('blossom', x, z, s, H(x, z));
    for (const [x, z] of [[-30, -48], [-44, -38], [-16, -54], [-54, -26], [8, -40], [-10, -36]]) w.tree('pine', x, z, 1.2, H(x, z));
    groundFlowers(w, -6, 30, 6, 10, 26, ['#ffb7d5', '#ffffff', '#ff5fb0']);
    groundFlowers(w, 8, 30, 6, 10, 26, ['#ffb7d5', '#ffd23f', '#ff8ac0']);
    tufts(w, 0, 0, 112, 112, 160, ['#4f9a3a', '#5fae45', '#3f8a32'], 0.3, 0.7, (x, z) => edgeDist(x, z) > 56 || Math.abs(x) < 3 || (x > 16 && z > 20) || q(LAKE, x, z) < 1.3 || q(POND, x, z) < 1.3);
    for (const [x, z, s] of [[-8, -26, 1], [20, -12, 0.7], [-26, -4, 0.8], [52, 20, 0.8]]) stone(w, x, z, s, '#8d939b');

    // ---------- Tiere ----------
    const A = (kind, x, z, o = {}) => beast(w, kind, { pos: V(x, 0, z), ...o });
    A('panda', -38, 8, { radius: 3, speed: 0.6, hungry: true });
    A('panda', -36, 10, { radius: 3, speed: 0.5 });
    A('panda', -39, 6, { radius: 2, speed: 0.6, scale: 0.6 });
    const c2 = WALL[2], c2top = wallPts.find(([x, , z]) => x === c2[0] && z === c2[1])[1];
    A('monkey', c2[0], c2[1], { pos: V(c2[0] + 1.2, c2top, c2[1] + 1.2), y: c2top, behavior: 'perch' });
    A('monkey', -26, 12, { radius: 4, speed: 1.4, hungry: true });
    A('tiger', -24, 4, { radius: 4, speed: 1.0, hungry: true });
    A('tiger', -22, 8, { radius: 3, speed: 0.8, scale: 0.65 });
    A('elephant', 22, -9, { radius: 3, speed: 0.7, hungry: true });
    A('elephant', 25, -7, { radius: 3, speed: 0.6, scale: 0.6 });
    for (let i = 0; i < 4; i++) A('bird', i < 2 ? LAKE.x : 36, i < 2 ? LAKE.z : 38, { pos: V(i < 2 ? LAKE.x : 36, 0, i < 2 ? LAKE.z : 38), y: (i < 2 ? 8 : 13) + i, behavior: 'fly', radius: 8 + i * 1.5, speed: (i % 2 ? -1 : 1) * 3.5, colors: ['#ffffff', '#f4f4f4', '#222222'] });
    const koi = [['#ff7a1f', '#ffffff'], ['#ffffff', '#e8262b'], ['#ffd23f', '#ff7a1f'], ['#ff5a1f', '#222222'], ['#ffffff', '#ff7a1f'], ['#ffb03a', '#ffffff']];
    koi.forEach(([c1, c2c], i) => A('fish', -5 + i * 2, -4 + (i % 2 ? 2 : -2), { pos: V(-5 + i * 2 + (i > 2 ? 1 : -1), 0.68, -4 + (i % 2 ? 2 : -2)), y: 0.68, behavior: 'swim', radius: 2.5, speed: 0.9, color: c1, color2: c2c, hungry: i === 1 }));

    // ---------- Münzen ----------
    coinTrail(w, 0, 30, 0, 16, 4);
    coinsAt(w, [[0, -1, 2.5], [0, -4, 2.5], [0, -7, 2.5]]);
    coinTrail(w, 4, -14, 30, -14, 6);
    coinTrail(w, -6, -14, -28, -12, 5);
    coinTrail(w, 4, 18, 26, 9, 5);
    coinTrail(w, -4, 28, -14, 34, 3);
    coinTrail(w, 22, 30, 50, 34, 6);
    coinsAt(w, [[-38, 4], [-34, 12], [-42, 12], [26, 9], [26, -3], [-50, 0]]);

    SB.flush();
  },
};
