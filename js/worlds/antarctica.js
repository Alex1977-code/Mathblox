// Antarktis: Eis- und Schneelandschaft mit Gletscher, Eisbergen in der Bucht, Pinguin-Kolonie,
// bunter Forschungsstation mit Funkmast und Polarlichtern am Dämmerungshimmel.
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';
import { pathRide, part } from '../rides.js';
import { collider, solidBox, studBlocks, groundPath, coinsAt, coinTrail, beast, compact, stepMountain, smooth, clamp01, edgeDist, rectDist, segDist, hash, V } from './africa-kit.js';

const FLAT = [[-10, 6, 10, 62], [-46, -2, -14, 26], [-6, -24, 22, -4], [10, 14, 26, 30]];
const BAY = { x: 4, z: -46, rx: 19, rz: 21 };
const qBay = (x, z) => ((x - BAY.x) / BAY.rx) ** 2 + ((z - BAY.z) / BAY.rz) ** 2;
const TRACK = [[17, 16.5], [24, 26], [36, 28], [46, 18], [48, 2], [44, -14], [38, -26], [30, -30], [26, -20], [30, -8], [26, 4], [18, 8]];
const trackDist = (x, z) => { let d = 1e9; for (let i = 0; i < TRACK.length; i++) d = Math.min(d, segDist(x, z, TRACK[i], TRACK[(i + 1) % TRACK.length])); return d; };
// Gletscherzunge: fließt von Nordwesten zur Bucht
const GL_A = [-58, -50], GL_B = [-15, -36];
function glacier(x, z) {
  const dx = GL_B[0] - GL_A[0], dz = GL_B[1] - GL_A[1], L2 = dx * dx + dz * dz;
  const t = clamp01(((x - GL_A[0]) * dx + (z - GL_A[1]) * dz) / L2);
  const d = segDist(x, z, GL_A, GL_B);
  return { t, d, w: 1 - smooth(clamp01((d - 6) / 7)) };
}

function height(x, z) {
  const e = edgeDist(x, z);
  if (e > 62) return 0;
  if (qBay(x, z) < 1) return 0;
  if (e > 57) return 0.5;
  const g = glacier(x, z);
  const glH = g.w > 0 ? (3.2 + 6 * (1 - g.t)) * g.w : 0;
  const d = Math.min(...FLAT.map((r) => rectDist(x, z, r)), trackDist(x, z) - 2.5, (Math.sqrt(qBay(x, z)) - 1) * 10);
  const hills = (1.6 + Math.sin(x * 0.11 + 0.7) * Math.cos(z * 0.09 - 0.4) * 1.6 + Math.sin((x - z) * 0.05) * 0.8) * smooth(clamp01(d / 8)) * smooth(clamp01((57 - e) / 6));
  return 1 + Math.max(0, hills, glH);
}

function color(x, z, h) {
  const e = edgeDist(x, z), r = hash(x, z);
  if (e > 57) return r < 0.5 ? '#c9d2dc' : '#b9c4cf';
  const g = glacier(x, z);
  if (g.w > 0.35) {
    const crev = Math.sin(g.t * 60) > 0.86 && Math.abs(Math.sin(x * 0.7 + z)) > 0.2;
    return crev ? '#6fa8d8' : r < 0.5 ? '#d6ecfb' : '#c6e2f7';
  }
  if (trackDist(x, z) < 1.4) return r < 0.5 ? '#e2eaf2' : '#dae3ed';
  if (h > 3.4 && r < 0.35) return '#7d8590';
  return r < 0.33 ? '#f6f9fc' : r < 0.66 ? '#e9f1fa' : '#dde9f5';
}

export const antarctica = {
  id: 'antarctica',
  name: 'Antarktis',
  seed: 207,
  theme: {
    sky: ['#0e1a4a', '#2c4f9a', '#a8cbe8'], fog: '#9cb8d6', sea: '#1f4f7a', fogNear: 120, fogFar: 380,
    light: { hemi: 1.85, sun: 1.8, sunColor: '#ffe6cc', sky: '#e6efff', ground: '#7d93b8' },
  },
  stars: { iceberg: 'Eisberg-Parkour', snowmobile: 'Schneemobil-Tour', station: 'Forschungsstation' },
  build(w) {
    w.terrain({ x0: -66, z0: -66, cols: 66, rows: 66, cell: 2, step: 0.5, height, color, side: 0.8 });
    const H = (x, z) => w.heightAt(x, z);
    exitPortal(w, 53, 'worldtour');
    const SB = studBlocks(w);
    const G = 1;

    // ---------- Berge und Eisberge im Meer ----------
    const snowy = (cx, cz, s) => stepMountain(w, cx, cz, [[34 * s, 7, '#9aa8b8'], [27 * s, 7, '#c8d4e2'], [20 * s, 7, '#e8eef6'], [13 * s, 6, '#f6f9fc'], [7 * s, 5, '#ffffff']]);
    snowy(-150, -40, 1.3); snowy(-110, -130, 1.5); snowy(-30, -175, 1.2); snowy(60, -180, 1.4); snowy(150, -90, 1.2);
    const berg = (x, z, s, tall = 1) => {
      w.box(6 * s, 3 * s * tall, 5 * s, '#eef8ff', x, -0.8 + 1.4 * s * tall, z, s);
      w.box(4 * s, 5 * s * tall, 3.4 * s, '#f8fcff', x + 0.6 * s, -0.8 + 2.5 * s * tall, z - 0.4 * s, s + 0.5);
      w.box(2.2 * s, 2 * s * tall, 2 * s, '#cfeaff', x - 1.4 * s, -0.8 + 4 * s * tall, z + 0.6 * s, s + 1);
      w.box(7 * s, 0.6, 6 * s, '#a8d8f0', x, -0.75, z, s);
    };
    for (const [x, z, s, t] of [[-10, -52, 1, 1.2], [18, -60, 1.3, 1], [-30, -76, 1.8, 1.3], [44, -72, 1.5, 1], [76, -30, 2, 1.1], [-80, 14, 1.8, 1], [30, 80, 1.6, 1], [-60, 74, 1.4, 1.2], [84, 40, 1.6, 1]]) berg(x, z, s, t);

    // ---------- Polarlichter ----------
    const ribbons = [];
    const auroraCols = [['#5dffa8', '#3ad0ff'], ['#7dff7a', '#b06bff'], ['#4affd0', '#ff6bd8']];
    auroraCols.forEach(([c1, c2], k) => {
      const seg = 48, geo = new THREE.PlaneGeometry(240, 26, seg, 1);
      const cols = [], a = new THREE.Color(c1), b = new THREE.Color(c2);
      for (let j = 0; j <= 1; j++) for (let i = 0; i <= seg; i++) {
        const c = j === 0 ? b : a; // oben (j=0) Farbe 2, unten Farbe 1
        cols.push(c.r, c.g, c.b, j === 0 ? 0.0 : 0.9);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 4));
      const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(-20 + k * 30, 36 + k * 7, -125 - k * 22);
      m.rotation.x = -0.25;
      m.userData.base = Float32Array.from(geo.attributes.position.array);
      w.add(m);
      ribbons.push(m);
    });
    w.updaters.push((dt, t) => {
      ribbons.forEach((m, k) => {
        const pos = m.geometry.attributes.position, base = m.userData.base;
        for (let i = 0; i < pos.count; i++) {
          const x = base[i * 3], y = base[i * 3 + 1];
          pos.array[i * 3 + 2] = Math.sin(x * 0.03 + t * 0.35 + k * 2) * 18 + Math.sin(x * 0.011 - t * 0.2) * 10;
          pos.array[i * 3 + 1] = y + Math.sin(x * 0.05 + t * 0.6 + k) * 3 * (y > 0 ? 1.4 : 1);
        }
        pos.needsUpdate = true;
        m.material.opacity = 0.42 + Math.sin(t * 0.5 + k * 1.7) * 0.18;
      });
    });

    // ---------- Schneefall ----------
    {
      const n = 700, p = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { p[i * 3] = w.r(-60, 60); p[i * 3 + 1] = w.r(0, 30); p[i * 3 + 2] = w.r(-60, 60); }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
      const snow = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.22, transparent: true, opacity: 0.85, depthWrite: false }));
      snow.frustumCulled = false;
      w.add(snow);
      w.updaters.push((dt, t) => {
        for (let i = 0; i < n; i++) {
          p[i * 3 + 1] -= dt * (1.2 + (i % 5) * 0.2);
          p[i * 3] += Math.sin(t + i) * dt * 0.4;
          if (p[i * 3 + 1] < 0) p[i * 3 + 1] += 30;
        }
        geo.attributes.position.needsUpdate = true;
      });
    }

    // ---------- Wege (Fußspuren-Pfade) ----------
    const trail = '#d2deea';
    groundPath(w, [[0, 48], [0, 0], [4, -18]], 3, trail);
    groundPath(w, [[0, 26], [-16, 12]], 2.6, trail);
    groundPath(w, [[0, 24], [14, 22]], 2.6, trail);
    groundPath(w, [[2, -6], [2, -22]], 2.6, trail);

    // ---------- Stern 1: Eisberg-Parkour in der Bucht ----------
    const iceC = '#e6f6ff';
    const floes = [[4, 0.6, -28.2, 3], [1.5, 0.9, -32, 2.8], [4.5, 1.2, -35.8, 2.8], [1, 1.6, -39.8, 2.6], [4, 2.0, -43.6, 2.6], [0.5, 2.4, -47.4, 2.6]];
    const icePts = [[2, H(2, -23), -23]];
    floes.forEach(([x, top, z, s], i) => {
      SB.add(x, top, z, s, top + 1.2, s, i % 2 ? '#d6f0ff' : iceC, { ice: true });
      w.box(s + 0.4, 0.3, s + 0.4, '#a8d8f0', x, -0.7, z);
      icePts.push([x, top, z]);
      if (i % 2 === 0) w.coin(x, top, z);
    });
    SB.add(3, 3.0, -53, 6, 4, 5, '#f2faff', { ice: true });
    SB.add(4.5, 4.2, -55.5, 2.6, 1.2, 2.6, '#dff3ff', { ice: true });
    SB.add(2, 5.4, -56.5, 3, 2.4, 3, '#ffffff', { safe: true });
    icePts.push([3, 3.0, -52], [4.5, 4.2, -55.5], [2, 5.4, -56.5]);
    w.icePts = icePts;
    for (const [dx, dz, sx, sy, sz, c] of [[-2, -3, 3, 5, 3, '#eef8ff'], [4, -6, 4, 7, 3, '#f8fcff'], [6.5, -1.5, 2, 4, 2.5, '#cfeaff']]) w.box(sx, sy, sz, c, 3 + dx, 1 + sy / 2, -56.5 + dz, 0.3);
    w.box(8, 1, 7, '#a8d8f0', 3, -0.6, -54);
    w.star('iceberg', 2, 5.4, -56.5, 'Eisberg-Parkour');
    w.coin(3, 3.0, -52);
    w.sign('Eisberg-Parkour', 2, H(2, -23) + 3.4, -22, { bg: '#2f7df6', size: 0.8 });
    w.sign('Achtung: eiskaltes Wasser!', 6, H(6, -22) + 2.2, -22.5, { bg: '#ffffff', fg: '#c0392b', size: 0.55 });

    // ---------- Gletscher: Spalten und Eiskanten ----------
    for (let i = 0; i < 18; i++) {
      const t = 0.15 + i / 18 * 0.8, x = GL_A[0] + (GL_B[0] - GL_A[0]) * t + w.r(-5, 5), z = GL_A[1] + (GL_B[1] - GL_A[1]) * t + w.r(-5, 5);
      if (glacier(x, z).w < 0.6 || edgeDist(x, z) > 56) continue;
      w.box(w.r(1.5, 3), w.r(0.8, 1.8), w.r(1.2, 2.4), w.pick(['#e8f6ff', '#cfeaff', '#f4fbff']), x, H(x, z) + 0.5, z, w.r(0, 3), w.r(-0.2, 0.2));
    }
    w.sign('Gletscher', -24, H(-24, -36) + 3.5, -32, { bg: '#5fb0e8', size: 0.8 });

    // ---------- Pinguin-Kolonie (viele stehende Pinguine aus Klötzchen) ----------
    const decoPenguin = (x, z, s, ry, chick) => {
      const y = H(x, z), c = Math.cos(ry), sn = Math.sin(ry);
      const B = (bw, bh, bd, col, dx, dy, dz) => w.box(bw * s, bh * s, bd * s, col, x + (dx * c + dz * sn) * s, y + dy * s, z + (-dx * sn + dz * c) * s, ry);
      if (chick) {
        B(0.72, 0.8, 0.62, '#9aa0a8', 0, 0.42, 0);
        B(0.5, 0.42, 0.46, '#2a2f3a', 0, 1.0, 0.02);
        B(0.32, 0.18, 0.06, '#ffffff', 0, 0.98, 0.25);
        B(0.1, 0.07, 0.14, '#2a2a2a', 0, 0.93, 0.31);
        return;
      }
      B(0.62, 0.95, 0.52, '#1c2230', 0, 0.55, 0);
      B(0.46, 0.75, 0.06, '#ffffff', 0, 0.5, 0.27);
      B(0.4, 0.18, 0.07, '#ffe6a0', 0, 0.86, 0.27);
      B(0.46, 0.4, 0.44, '#1c2230', 0, 1.2, 0.02);
      B(0.48, 0.2, 0.18, '#ffb020', 0, 1.1, 0.12);
      B(0.1, 0.08, 0.22, '#ff8a1f', 0, 1.16, 0.3);
      B(0.42, 0.06, 0.26, '#ff9a1f', 0, 0.03, 0.1);
      for (const sd of [-1, 1]) B(0.08, 0.52, 0.26, '#1c2230', sd * 0.34, 0.62, 0);
    };
    const KX = 9, KZ = -14;
    for (let i = 0, n = 0; i < 120 && n < 40; i++) {
      const a = w.r(0, Math.PI * 2), r = Math.sqrt(w.rng()) * 9, x = KX + Math.cos(a) * r * 1.3, z = KZ + Math.sin(a) * r * 0.8;
      if (Math.abs(x - 2) < 2 || qBay(x, z) < 1.2) continue;
      const chick = n % 4 === 3;
      decoPenguin(x, z, chick ? 0.75 : w.r(1.2, 1.45), w.r(-0.8, 0.8) + (x > KX ? 0.4 : -0.4), chick);
      n++;
    }
    w.sign('Kaiserpinguine', KX, 4.2, KZ + 8, { bg: '#1c2230', size: 0.8 });

    // ---------- Stern 2: Schneemobil-Tour ----------
    const sy = H(16, 22);
    const st = w.station(16, 22, 'Schneemobil-Tour', '#e8262b', sy);
    const sm = new THREE.Group();
    part(sm, 1.2, 0.5, 2.6, '#e8262b', 0, 0.55, 0);
    part(sm, 1.0, 0.35, 1.0, '#e8262b', 0, 0.92, 0.85);
    part(sm, 0.9, 0.5, 0.08, '#bfe6ff', 0, 1.3, 1.25).rotation.x = -0.4;
    part(sm, 0.8, 0.25, 1.3, '#1a1a1a', 0, 0.92, -0.45);
    part(sm, 1.0, 0.4, 1.7, '#2b2b2b', 0, 0.22, -0.5);
    part(sm, 1.24, 0.12, 2.64, '#ffd23f', 0, 0.36, 0);
    for (const s of [-1, 1]) {
      part(sm, 0.18, 0.08, 1.6, '#c8ccd2', s * 0.55, 0.05, 1.1);
      part(sm, 0.18, 0.08, 0.45, '#c8ccd2', s * 0.55, 0.16, 1.95).rotation.x = -0.6;
      part(sm, 0.1, 0.45, 0.1, '#555555', s * 0.55, 0.3, 1.0);
    }
    part(sm, 0.4, 0.2, 0.1, '#fff7c0', 0, 0.8, 1.36, '#8a7a30');
    part(sm, 0.9, 0.08, 0.08, '#333333', 0, 1.3, 0.5);
    part(sm, 0.08, 1.4, 0.08, '#333333', 0.45, 1.3, -1.2);
    part(sm, 0.5, 0.35, 0.04, '#ff7a1f', 0.7, 1.85, -1.2);
    compact(sm);
    w.addRide(pathRide(w, {
      points: TRACK.map(([x, z]) => [x, 0, z]), closed: true, duration: 28, vehicle: sm, seat: [0, 0.2, -0.45],
      name: 'Schneemobil-Tour', starId: 'snowmobile', station: st, exit: V(12.5, sy, 23.5), ground: true, flat: true,
    }));
    for (let i = 0; i < TRACK.length; i += 3) { const [x, z] = TRACK[i]; const y = H(x + 2.4, z); w.box(0.15, 1.6, 0.15, '#ff7a1f', x + 2.4, y + 0.8, z); }

    // ---------- Stern 3: Forschungsstation mit Funkmast ----------
    const RX = -30, RZ = 12;
    w.enclosure({ x: RX, z: RZ, w: 26, d: 22, side: 'e', h: 4.4, y: G, color: '#8a96a6', label: 'Forschungsstation', cap: '#ffd23f' });
    const container = (x, z, sx, sz, top, col) => {
      const s = solidBox(w, x, top, z, sx, 2.6, sz, col, { safe: true });
      const along = sx > sz, len = along ? sx : sz;
      const rib = '#' + new THREE.Color(col).multiplyScalar(0.78).getHexString();
      for (let u = -len / 2 + 0.4; u < len / 2; u += 0.6) for (const sd of [-1, 1]) w.box(along ? 0.12 : 0.06, 2.3, along ? 0.06 : 0.12, rib, x + (along ? u : sd * (sx / 2 + 0.03)), top - 1.3, z + (along ? sd * (sz / 2 + 0.03) : u));
      w.box(along ? 0.1 : sx + 0.05, 2.62, along ? sz + 0.05 : 0.1, '#ffffff', x + (along ? sx / 2 : 0), top - 1.3, z + (along ? 0 : sz / 2));
      return s;
    };
    // Kletterweg: Kiste → Container → Kiste → Container
    SB.add(-20.5, G + 1.2, 18.6, 2, 1.2, 2, '#c8a060');
    container(-24, 18.6, 5, 2.6, G + 2.6, '#e8262b');
    SB.add(-23, G + 3.8, 18.6, 1.6, 1.2, 1.6, '#c8a060');
    container(-27.5, 18.6, 5, 2.6, G + 5.2, '#2f7df6');
    // Spirale um den Funkmast
    const MX = -32, MZ = 17.5, mastPts = [[-20.5, G + 1.2, 18.6], [-22.4, G + 2.6, 18.6], [-23, G + 3.8, 18.6], [-26.2, G + 5.2, 18.6]];
    for (let i = 0; i < 10; i++) {
      const a = 0.9 + i * 0.8, x = MX + Math.cos(a) * 3, z = MZ + Math.sin(a) * 3, top = G + 5.2 + 1.1 * (i + 1);
      SB.add(x, top, z, 2, 0.4, 2, i % 2 ? '#ffd23f' : '#ff7a1f');
      mastPts.push([x, top, z]);
      if (i % 4 === 1) w.coin(x, top, z);
    }
    const mTop = G + 5.2 + 1.1 * 11;
    SB.add(MX, mTop, MZ, 3, 0.4, 3, '#ffd23f', { safe: true });
    mastPts.push([MX + 0.8, mTop, MZ + 0.8]);
    w.mastPts = mastPts;
    collider(w, MX, mTop - 0.4, MZ, 1, mTop - 0.4 - G, 1);
    for (const [dx, dz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) w.box(0.14, mTop + 8 - G, 0.14, '#d8dde4', MX + dx, (G + mTop + 8) / 2, MZ + dz);
    for (let y = G + 1; y < mTop + 8; y += 1.4) { w.box(1.0, 0.08, 0.08, '#e8262b', MX, y, MZ - 0.45, 0, 0, 0.6); w.box(0.08, 0.08, 1.0, '#e8262b', MX + 0.45, y, MZ, 0.6); }
    w.box(2.4, 0.08, 0.08, '#d8dde4', MX, mTop + 5, MZ);
    w.box(0.08, 0.08, 2.4, '#d8dde4', MX, mTop + 6.5, MZ);
    const blink = w.sphere(0.3, '#ff3b2f', MX, mTop + 8.2, MZ, { seg: 8, emissive: '#ff0000' });
    w.updaters.push((dt, t) => { blink.visible = Math.sin(t * 4) > 0; });
    w.star('station', MX + 0.8, mTop, MZ + 0.8, 'Forschungsstation');
    // Wohnmodule, Kuppel, Tanks, Windrad
    for (const [x, z, sx, sz, col] of [[-38, 19, 6, 3, '#ff7a1f'], [-38, 5.5, 3, 6, '#ffd23f'], [-26, 5, 6, 3, '#2fbf4a']]) {
      for (const [dx, dz] of [[-sx / 2 + 0.4, -sz / 2 + 0.4], [sx / 2 - 0.4, -sz / 2 + 0.4], [-sx / 2 + 0.4, sz / 2 - 0.4], [sx / 2 - 0.4, sz / 2 - 0.4]]) w.box(0.25, 0.8, 0.25, '#555555', x + dx, G + 0.4, z + dz);
      solidBox(w, x, G + 3.4, z, sx, 2.6, sz, col, { safe: true });
      for (let k = -1; k <= 1; k += 2) w.box(sx > sz ? 0.9 : 0.06, 0.7, sx > sz ? 0.06 : 0.9, '#bfe6ff', x + (sx > sz ? k * 1.4 : sx / 2 + 0.03), G + 2.4, z + (sx > sz ? sz / 2 + 0.03 : k * 1.4));
    }
    w.sphere(3, '#f4f8fc', -33, G, 7, { half: true, seg: 18 });
    collider(w, -33, G + 2.4, 7, 4.2, 2.4, 4.2);
    w.box(4.4, 0.6, 4.4, '#8a96a6', -33, G + 0.3, 7);
    for (const z of [11, 13.5]) { w.cyl(1, 1, 3.2, '#d8dde4', -41, G, z, { seg: 10 }); collider(w, -41, G + 3.2, z, 2, 3.2, 2); }
    {
      w.box(0.35, 10, 0.35, '#e8eef4', -20, G + 5, 3.5);
      const rotor = new THREE.Group();
      rotor.position.set(-20, G + 10, 4);
      for (let b = 0; b < 3; b++) { const arm = new THREE.Group(); arm.rotation.z = b * Math.PI * 2 / 3; part(arm, 0.35, 4, 0.12, '#ffffff', 0, 2, 0); rotor.add(arm); }
      part(rotor, 0.6, 0.6, 0.9, '#d8dde4', 0, 0, -0.3);
      compact(rotor);
      w.add(rotor);
      w.updaters.push((dt, t) => { rotor.rotation.z = t * 2.2; });
      collider(w, -20, G + 10, 3.5, 0.4, 10, 0.4);
    }
    for (const [z, c1, c2] of [[7, '#e8262b', '#ffffff'], [17, '#2f7df6', '#ffd23f']]) {
      w.box(0.15, 5, 0.15, '#cccccc', -15, G + 2.5, z);
      w.box(0.05, 0.6, 1.2, c1, -15, G + 4.6, z + 0.65);
      w.box(0.05, 0.6, 1.2, c2, -15, G + 4.0, z + 0.65);
    }
    w.sign('Funkmast', MX, mTop + 9.6, MZ, { bg: '#e8262b', size: 0.8 });

    // ---------- Tiere ----------
    const A = (kind, x, z, o = {}) => beast(w, kind, { pos: V(x, 0, z), ...o });
    A('penguin', KX - 4, KZ + 3, { radius: 4, speed: 0.6, scale: 1.35, hungry: true });
    A('penguin', KX + 3, KZ - 2, { radius: 4, speed: 0.5, scale: 1.35 });
    A('penguin', KX + 6, KZ + 4, { radius: 3, speed: 0.5, scale: 0.6, hungry: true });
    A('penguin', KX - 1, KZ - 5, { radius: 3, speed: 0.6, scale: 0.6 });
    A('penguin', -6, 30, { radius: 3, speed: 0.6, scale: 1.3, hungry: true });
    A('seal', 3, -52, { pos: V(4.5, 3.0, -51.5), y: 3.0, radius: 0.8, speed: 0.3, hungry: true });
    A('seal', 30, -36, { radius: 2, speed: 0.3, hungry: true });
    A('seal', 34, -32, { radius: 2, speed: 0.3 });
    A('seal', 4.5, -36, { pos: V(4.5, 1.2, -35.8), y: 1.2, radius: 0.5, speed: 0.2 });
    for (const [x, z] of [[-6, -86], [34, -84], [74, -6], [-74, -40]]) A('whale', x, z, { pos: V(x, -0.8, z), y: -0.8, behavior: 'jump', radius: 12 });
    const skua = ['#7a6a5a', '#5a4a3a', '#3a2a1a'];
    for (let i = 0; i < 3; i++) A('bird', i === 2 ? RX : KX, i === 2 ? RZ : KZ, { pos: V(i === 2 ? RX : KX, 0, i === 2 ? RZ : KZ), y: 10 + i * 3, behavior: 'fly', radius: 10 + i * 3, speed: (i % 2 ? -1 : 1) * 4.5, colors: skua });

    // ---------- Münzen ----------
    coinTrail(w, 0, 30, 0, 12, 4);
    coinTrail(w, 2, -4, 2, -20, 4);
    coinTrail(w, -4, 22, -14, 13, 3);
    coinTrail(w, 4, 23, 12, 22, 3);
    for (const [x, z] of TRACK.filter((_, i) => i % 2 === 1)) coinsAt(w, [[x + 2.5, z + 1]]);
    coinsAt(w, [[-22, -24], [-30, -30], [-40, -38], [20, -20], [26, -36], [40, 40], [-30, 40], [-44, 30], [44, 30], [-20, 44], [-36, 14], [-28, 11], [-22, 8], [-39, 1.5], [14, -10], [16, -18], [12, -20], [-12, 36], [12, 40], [30, 46], [-46, -14], [50, -4]]);

    SB.flush();
  },
};
