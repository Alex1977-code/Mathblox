// Wilder Westen: Wüstenstadt mit Hauptstraße, Tafelberg, Goldmine, Dampflok und Goldgräber-Camp
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';
import { coaster, pathRide, part } from '../rides.js';

const G = 0.5; // Bodenhöhe der flachen Wüste (Gelände-Mindesthöhe)

const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
function noise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(i, j) + (hash(i + 1, j) - hash(i, j)) * u, b = hash(i, j + 1) + (hash(i + 1, j + 1) - hash(i, j + 1)) * u;
  return a + (b - a) * v;
}

// Fasst die einfarbigen Klötzchen jeder Gruppe zu einem Mesh zusammen (weniger Draw-Calls).
// Untergruppen (bewegte Gelenke) bleiben erhalten und werden einzeln zusammengefasst.
function bake(root) {
  root.updateMatrixWorld(true);
  const groups = [];
  root.traverse((o) => { if (!o.isMesh && !o.isSprite) groups.push(o); });
  const m = new THREE.Matrix4(), inv = new THREE.Matrix4(), nm = new THREE.Matrix3(), v = new THREE.Vector3();
  for (const grp of groups) {
    const meshes = grp.children.filter((c) => c.isMesh && c.material?.isMeshLambertMaterial && !c.material.map && !c.material.transparent && c.material.emissive.getHex() === 0);
    if (meshes.length < 2) continue;
    inv.copy(grp.matrixWorld).invert();
    const pos = [], nor = [], col = [];
    for (const mesh of meshes) {
      m.multiplyMatrices(inv, mesh.matrixWorld);
      nm.getNormalMatrix(m);
      const g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
      const P = g.attributes.position, N = g.attributes.normal, c = mesh.material.color;
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(m); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z);
        col.push(c.r, c.g, c.b);
      }
      if (g !== mesh.geometry) g.dispose();
      grp.remove(mesh);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    const out = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    out.castShadow = true;
    out.receiveShadow = true;
    grp.add(out);
  }
  return root;
}

const OVAL = { cx: 0, cz: -6, rx: 34, rz: 30 };   // Eisenbahn-Rundkurs
const MESA = { x: -40, z: -40 };                  // Tafelberg (Kletterei)
const MINE = { x: 45, z: -46 };                   // Minenberg
const BUTTES = [[-16, -49, 3.6, 9], [10, -50, 3, 6.5], [-52, -14, 2.6, 7.5], [22, -54, 2.4, 5]];
// Grubenbahn: Kettenlift am Südhang, Abfahrt durch den Stollen im Berg
const TRACK = [
  [22, 1.2, -34], [28, 1.2, -34], [34, 2, -33.5], [40, 4.5, -33], [46, 7.5, -33], [51, 10.5, -33.5], [55, 13.5, -37],
  [55.5, 14.5, -43], [53, 12.5, -48.5], [49, 7, -52], [44, 3, -53], [38.5, 2.6, -51], [34, 4, -47.5], [29.5, 6, -45.5],
  [24, 4.5, -45], [18.5, 2.4, -42], [16, 1.5, -37.5], [18, 1.2, -34.3],
];
const mountain = (x, z) => {
  const r = Math.hypot(x - MINE.x, z - MINE.z);
  return r >= 13 ? 0 : Math.min(15.5, 4 + (13 - r) * 1.35 + noise(x * 0.35, z * 0.35) * 2.5);
};

export const western = {
  id: 'western',
  name: 'Wilder Westen',
  seed: 104,
  theme: {
    sky: ['#2f7fd0', '#8fc8f0', '#ffe2b0'], fog: '#f2d6a6', sea: '#d9a866', fogNear: 110, fogFar: 260,
    light: { hemi: 1.5, sun: 2.4, sunColor: '#fff0d0', sky: '#ffffff', ground: '#c9955a' },
  },
  stars: { mine: 'Grubenbahn', train: 'Dampflok-Rundfahrt', mesa: 'Tafelberg', tower: 'Wasserturm' },
  build(w) {
    // ---------- Gelände ----------
    const curve = new THREE.CatmullRomCurve3(TRACK.map((p) => new THREE.Vector3(...p)), true, 'catmullrom', 0.5);
    const samples = curve.getSpacedPoints(320);
    const carve = (x, z) => {
      let m = Infinity;
      for (const s of samples) if (Math.abs(s.x - x) < 2.2 && Math.abs(s.z - z) < 2.2 && Math.hypot(s.x - x, s.z - z) < 2.2) m = Math.min(m, s.y - 0.7);
      return m;
    };
    const height = (x, z) => {
      const ad = Math.max(Math.abs(x), Math.abs(z));
      let h = G;
      if (ad > 56) { h = 9 + Math.floor(hash(Math.floor((x + 200) / 8), Math.floor((z + 200) / 8)) * 4) * 2.5; if (ad > 61) h += 3.5; }
      const mx = Math.abs(x - MESA.x), mz = Math.abs(z - MESA.z);
      if (mx < 8 && mz < 8 && mx + mz < 13) h = 18.5;
      for (const [bx, bz, r, bh] of BUTTES) if (Math.hypot(x - bx, z - bz) < r) h = Math.max(h, bh);
      // Canyon: Felsrücken parallel zur Ostklippe
      if (x > 41 && x < 47 && Math.abs(z) < 19) h = Math.max(h, 7 + Math.floor(hash(Math.floor(z / 6), 3) * 3) * 1.5);
      const m = mountain(x, z);
      if (m) h = Math.max(h, m);
      if (x > 12 && z < -26) h = Math.min(h, carve(x, z));
      return Math.max(h, G);
    };
    w.terrain({
      x0: -66, z0: -66, cols: 66, rows: 66, cell: 2, step: 0.5, height,
      color: (x, z, h) => {
        if (h >= 3) {
          if (h === 18.5) return '#d98a52';
          return Math.floor(h / 2.5) % 2 ? '#c0603a' : '#cf7447';
        }
        if (h > G) return '#d9a868';
        const n = hash(Math.floor(x / 2), Math.floor(z / 2));
        return n < 0.15 ? '#d9b06c' : n > 0.85 ? '#ecca8a' : '#e3bd7a';
      },
    });
    exitPortal(w, 53, 'hub');

    // ---------- Helfer ----------
    const solid = (x, z, hx, hz, h, y0 = G) => w.solids.push({ min: new THREE.Vector3(x - hx, y0, z - hz), max: new THREE.Vector3(x + hx, y0 + h, z + hz) });
    const road = (x1, z1, x2, z2, width, color, y = 0.03) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      w.box(width, 0.06, len + width, color, (x1 + x2) / 2, G + y, (z1 + z2) / 2, Math.atan2(x2 - x1, z2 - z1));
    };
    // Deko-Gruppe mit eigener Drehung: Teile in lokalen Koordinaten
    const local = (cx, cz, ry, y0 = G) => (bw, bh, bd, c, lx, ly, lz, rx = 0, rz = 0, dry = 0) => {
      const cs = Math.cos(ry), sn = Math.sin(ry);
      w.box(bw, bh, bd, c, cx + lx * cs + lz * sn, y0 + ly, cz - lx * sn + lz * cs, ry + dry, rx, rz);
    };
    const flatAt = (x, z) => w.heightAt(x, z) === G;
    const cactus = (x, z, s = 1) => {
      if (!flatAt(x, z)) return;
      const L = local(x, z, w.r(0, Math.PI));
      const c = '#4f9a45', c2 = '#5fb050';
      L(0.7 * s, 4 * s, 0.7 * s, c, 0, 2 * s, 0);
      L(1.0 * s, 0.5 * s, 0.5 * s, c, 0.75 * s, 1.6 * s, 0);
      L(0.5 * s, 1.6 * s, 0.5 * s, c2, 1.1 * s, 2.3 * s, 0);
      if (s > 0.8) { L(0.9 * s, 0.5 * s, 0.5 * s, c, -0.7 * s, 2.5 * s, 0); L(0.5 * s, 1.2 * s, 0.5 * s, c2, -1.0 * s, 3.0 * s, 0); }
      L(0.45 * s, 0.3 * s, 0.45 * s, '#ff8fb8', 0, 4.1 * s, 0);
      solid(x, z, 0.35 * s, 0.35 * s, 4 * s);
    };
    const smallCactus = (x, z) => {
      if (!flatAt(x, z)) return;
      w.box(0.9, 0.9, 0.9, '#5aa64e', x, G + 0.45, z, 0.4);
      w.box(0.3, 0.25, 0.3, '#ffd23f', x, G + 1.0, z);
      const L = local(x + 1.5, z, w.r(0, 3));
      L(0.9, 0.9, 0.25, '#6cbf5a', 0, 0.5, 0, 0, 0.3);
      L(0.7, 0.7, 0.22, '#6cbf5a', 0.5, 1.2, 0.1, 0, -0.4);
      L(0.25, 0.25, 0.25, '#ff5f8f', 0.7, 1.6, 0.1);
    };
    const barrel = (x, z, y = G, c = '#8a5a2b') => {
      for (const r of [0, Math.PI / 4]) w.box(0.8, 1.1, 0.8, c, x, y + 0.55, z, r);
      for (const yy of [0.25, 0.85]) for (const r of [0, Math.PI / 4]) w.box(0.84, 0.08, 0.84, '#3b3b3b', x, y + yy, z, r);
      solid(x, z, 0.4, 0.4, 1.1, y);
    };
    const hay = (x, z, ry = 0, y = G) => {
      const L = local(x, z, ry, y);
      L(1.7, 1, 1.1, '#e8c85a', 0, 0.5, 0);
      for (const o of [-0.45, 0.45]) L(0.08, 1.04, 1.14, '#b8953a', o, 0.5, 0);
      solid(x, z, 0.75, 0.75, 1, y);
    };
    const crate = (x, z, y = G, s = 1) => {
      w.box(s, s, s, '#b8864e', x, y + s / 2, z);
      w.box(s * 1.02, s * 0.15, s * 1.02, '#8a5e33', x, y + s * 0.5, z);
      solid(x, z, s / 2, s / 2, s, y);
    };
    const wagon = (x, z, ry) => {
      const L = local(x, z, ry);
      L(2.2, 0.7, 4.2, '#8a5a2b', 0, 1.3, 0);
      L(2.4, 1.6, 3.6, '#f4eee0', 0, 2.4, 0);
      L(1.8, 0.5, 3.6, '#f4eee0', 0, 3.4, 0);
      for (const o of [-1.2, 0, 1.2]) L(2.5, 0.12, 0.12, '#cfc6b0', 0, 3.25, o);
      for (const [wx, wz] of [[-1.25, 1.4], [1.25, 1.4], [-1.25, -1.4], [1.25, -1.4]]) {
        for (const r of [0, Math.PI / 4]) L(0.14, 1.3, 1.3, '#5b3a1e', wx, 0.75, wz, r);
        L(0.18, 0.3, 0.3, '#3b2a1a', wx, 0.75, wz);
      }
      L(0.2, 0.2, 2.6, '#6b4423', 0, 0.9, 3.3);
      solid(x, z, 1.6, 1.6, 3.5);
    };
    const rocks = (x, z, s = 1) => {
      if (!flatAt(x, z)) return;
      w.box(1.6 * s, 1 * s, 1.3 * s, '#b0653f', x, G + 0.5 * s, z, w.r(0, 3));
      w.box(1 * s, 0.6 * s, 0.9 * s, '#c97a4f', x + 0.3 * s, G + 1.1 * s, z - 0.1 * s, w.r(0, 3));
    };
    const fenceLine = (x1, z1, x2, z2, h = 1.3) => {
      const len = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(x2 - x1, z2 - z1), n = Math.max(1, Math.round(len / 2.5));
      for (let i = 0; i <= n; i++) w.box(0.25, h + 0.1, 0.25, '#6b4423', x1 + (x2 - x1) * i / n, G + h / 2, z1 + (z2 - z1) * i / n);
      for (const yy of [0.5, 1.05]) w.box(0.12, 0.16, len, '#8a5e33', (x1 + x2) / 2, G + yy * h / 1.3, (z1 + z2) / 2, ry);
      solid((x1 + x2) / 2, (z1 + z2) / 2, Math.max(0.15, Math.abs(x2 - x1) / 2), Math.max(0.15, Math.abs(z2 - z1) / 2), h);
    };

    // Westernhaus mit Scheinfassade, Veranda und Schild. side: 'e' (Front nach +x) oder 'w'
    const shop = ({ x, z, ww, d, h, side, wall, trim, label, roof = 'flat', balcony, sign = '#5b3a1e' }) => {
      const s = side === 'e' ? 1 : -1, fx = x + s * ww / 2;
      w.house(x, z, ww, d, h, { wall, roof, roofColor: roof === 'gable' ? trim : '#6b4a32', door: side, window: '#3d5f80', doorColor: '#4a2e18', balcony, shutters: false });
      if (roof !== 'gable') {
        w.box(0.3, 2.4, d + 0.4, wall, fx + s * 0.15, G + h + 0.9, z);
        w.box(0.45, 0.3, d + 0.7, trim, fx + s * 0.18, G + h + 2.15, z);
        w.box(0.45, 0.25, d + 0.5, trim, fx + s * 0.18, G + h - 0.1, z);
      }
      // Veranda (begehbar) mit Dach
      w.block(fx + s * 1.1, G + 0.35, z, 2.2, 0.6, d, '#a0764e');
      for (const o of [-d / 2 + 0.3, 0, d / 2 - 0.3]) w.box(0.22, 3.0, 0.22, '#6b4423', fx + s * 2.0, G + 1.85, z + o);
      w.box(2.5, 0.16, d + 0.3, trim, fx + s * 1.15, G + 3.45, z, 0, 0, -s * 0.14);
      w.sign(label, fx + s * 0.6, G + h + 1.0, z, { bg: sign, fg: '#ffe9b0', size: 0.85 });
      return fx;
    };

    // ---------- Hauptstraße ----------
    const dirt = '#c99a5e';
    road(0, 48, 0, -22, 9, dirt);
    for (let z = 40; z > -20; z -= 4) w.box(w.r(0.4, 1.2), 0.07, w.r(0.3, 0.8), '#b9894f', w.r(-3.5, 3.5), G + 0.04, z + w.r(-1, 1), w.r(0, 3));

    // Westseite (Fronten nach Osten)
    const sx = shop({ x: -12.5, z: 13, ww: 9, d: 10, h: 6.4, side: 'e', wall: '#b5703f', trim: '#7a3f22', label: 'Saloon', balcony: '#6b4423', sign: '#8a2f1f' });
    // Schwingtüren des Saloons
    const doors = [];
    for (const sd of [-1, 1]) {
      const pv = new THREE.Group();
      pv.position.set(sx + 0.12, G + 1.45, 13 + sd * 0.62);
      part(pv, 0.08, 1.0, 0.56, '#d9a35a', 0, 0, -sd * 0.29);
      part(pv, 0.1, 0.12, 0.6, '#7a3f22', 0, 0.5, -sd * 0.29);
      w.add(bake(pv));
      doors.push([pv, sd]);
    }
    w.updaters.push((dt, t) => { for (const [pv, sd] of doors) pv.rotation.y = sd * Math.max(0, Math.sin(t * 1.3)) * 0.9; });
    // Anbindebalken
    w.box(0.2, 1.1, 0.2, '#6b4423', -4.8, G + 0.55, 10);
    w.box(0.2, 1.1, 0.2, '#6b4423', -4.8, G + 0.55, 16);
    w.box(0.15, 0.15, 6.2, '#8a5e33', -4.8, G + 1.1, 13);
    w.water(-4.1, 13, 0.8, 3, { top: G + 0.6, color: '#5fb0e8' });
    w.box(1, 0.6, 3.3, '#7a5230', -4.1, G + 0.29, 13);

    shop({ x: -12, z: 0, ww: 8, d: 8, h: 5, side: 'e', wall: '#d8cbb0', trim: '#7d8590', label: 'Bank', sign: '#2f6b3a' });
    for (const o of [-2.6, 2.6]) w.box(0.5, 4.4, 0.5, '#f2ece0', -7.85, G + 2.6, o);
    w.box(0.2, 1.2, 1.4, '#3b3f48', -7.9, G + 3.5, 0);
    for (let i = 0; i < 3; i++) w.box(0.4, 0.25, 0.7, '#ffd23f', -6.4, G + 0.5 + i * 0.25, -2.6 + i * 0.1);
    shop({ x: -12.5, z: -12.5, ww: 9, d: 11, h: 8.6, side: 'e', wall: '#7f9bb0', trim: '#e8e2d8', label: 'Hotel', balcony: '#e8e2d8', sign: '#2f4f7f' });

    // Ostseite (Fronten nach Westen)
    const shx = shop({ x: 12, z: 13, ww: 8, d: 8, h: 4.6, side: 'w', wall: '#d9c39a', trim: '#6b4423', label: '★ Sheriff', sign: '#3a5a8a' });
    for (let i = 0; i < 4; i++) w.box(0.08, 1.0, 0.08, '#2b2b2b', shx - 0.05, G + 1.7, 15.3 + i * 0.25);
    w.box(0.1, 0.5, 0.5, '#ffd23f', shx - 0.06, G + 3.6, 13);
    w.box(0.1, 0.5, 0.5, '#ffd23f', shx - 0.06, G + 3.6, 13, 0, Math.PI / 4);
    // Schaukelstuhl auf der Veranda
    w.box(0.7, 0.1, 0.7, '#7a4a2a', shx - 1.3, G + 1.1, 10.6);
    w.box(0.1, 0.9, 0.7, '#7a4a2a', shx - 1.0, G + 1.55, 10.6);
    shop({ x: 12.5, z: 0.5, ww: 9, d: 10, h: 5.4, side: 'w', wall: '#8fae7a', trim: '#f2ece0', label: 'Gemischtwaren', sign: '#7a4a2a' });
    crate(6.6, -2.4, G + 0.35, 0.8); crate(6.6, -1.4, G + 0.35, 0.8); crate(6.6, -1.9, G + 1.15, 0.7);
    barrel(6.7, 3.6, G + 0.35); barrel(6.7, 4.6, G + 0.35);
    w.box(0.6, 0.5, 0.6, '#ff8a1f', 6.6, G + 0.6, 2.2); w.box(0.6, 0.5, 0.6, '#e8262b', 6.6, G + 0.6, 1.4);
    // Pferdestall (Scheune mit Satteldach)
    w.house(12.5, -12.5, 9, 10, 5.5, { wall: '#a8442e', roof: 'gable', roofColor: '#5b3a1e', door: 'w', window: '#f2ece0', doorColor: '#f2ece0' });
    w.box(0.1, 3.2, 3.2, '#5b3a1e', 7.96, G + 1.6, -12.5);
    w.box(0.12, 0.2, 4.4, '#f2ece0', 7.95, G + 1.6, -12.5, 0, 0.62);
    w.box(0.12, 0.2, 4.4, '#f2ece0', 7.95, G + 1.6, -12.5, 0, -0.62);
    w.sign('Pferdestall', 7.4, G + 7.2, -12.5, { bg: '#5b3a1e', fg: '#ffe9b0', size: 0.8 });
    hay(6.2, -17, 0); hay(6.2, -17, 0, G + 1); hay(6.4, -8.4, 0.2);

    // Kapelle am Ende der Straße
    w.house(0, -27, 7, 9, 5, { wall: '#f4efe6', roof: 'gable', roofColor: '#6b4a32', door: 's', window: '#7cc4ff', doorColor: '#7a4a2a' });
    w.box(2.2, 3.4, 2.2, '#f4efe6', 0, G + 7.3, -23.6);
    w.box(1.0, 1.0, 1.0, '#ffd23f', 0, G + 7.4, -22.45);
    w.box(2.6, 0.25, 2.6, '#6b4a32', 0, G + 9.1, -23.6);
    w.box(1.7, 1.7, 1.7, '#6b4a32', 0, G + 9.8, -23.6, Math.PI / 4, 0.62);
    w.box(0.15, 1.2, 0.15, '#ffd23f', 0, G + 11.2, -23.6);

    // Gassen-Deko
    barrel(-7.5, 6.8); barrel(-7.2, 7.8); crate(-8.2, -6.4); hay(8.6, 7.6, 0.3);
    barrel(7.3, -5.6); crate(7.6, 18.6); barrel(-7.4, 19.6);
    for (const z of [30, 22, -6, -18]) { w.box(0.2, 3, 0.2, '#6b4423', -5, G + 1.5, z); w.box(0.5, 0.5, 0.5, '#ffe9a8', -5, G + 3.1, z); w.box(0.2, 3, 0.2, '#6b4423', 5, G + 1.5, z); w.box(0.5, 0.5, 0.5, '#ffe9a8', 5, G + 3.1, z); }
    w.sign('Wilder Westen', 0, G + 4.3, 31, { bg: '#8a2f1f', fg: '#ffe9b0', size: 1.0 });
    w.box(0.4, 6, 0.4, '#6b4423', -6, G + 3, 31); w.box(0.4, 6, 0.4, '#6b4423', 6, G + 3, 31);
    w.box(12.6, 0.4, 0.4, '#6b4423', 0, G + 5.2, 31);
    solid(-6, 31, 0.2, 0.2, 6); solid(6, 31, 0.2, 0.2, 6);

    // ---------- Eisenbahn ----------
    const ovalPt = (a, r = 0) => [OVAL.cx + (OVAL.rx + r) * Math.cos(a), OVAL.cz + (OVAL.rz + r) * Math.sin(a)];
    const NS = 170;
    for (let i = 0; i < NS; i++) {
      const a = (i / NS) * Math.PI * 2, b = ((i + 1) / NS) * Math.PI * 2;
      const [x, z] = ovalPt(a), [x2, z2] = ovalPt(b);
      const ry = Math.atan2(x2 - x, z2 - z), len = Math.hypot(x2 - x, z2 - z);
      w.box(3.2, 0.06, len + 0.05, '#b8946a', (x + x2) / 2, G + 0.04, (z + z2) / 2, ry);
      w.box(2.4, 0.14, 0.45, '#6b4423', x, G + 0.12, z, ry);
      for (const r of [-0.7, 0.7]) {
        const [p1x, p1z] = ovalPt(a, r), [p2x, p2z] = ovalPt(b, r);
        w.box(0.16, 0.16, Math.hypot(p2x - p1x, p2z - p1z) + 0.06, '#9aa0a8', (p1x + p2x) / 2, G + 0.27, (p1z + p2z) / 2, ry);
      }
      if (i % 14 === 7) {
        const [tx, tz] = ovalPt(a, 3);
        if (Math.abs(tx) > 7 || tz < 0) { w.box(0.25, 5, 0.25, '#7a5230', tx, G + 2.5, tz); w.box(1.6, 0.2, 0.2, '#7a5230', tx, G + 4.6, tz, ry + Math.PI / 2); }
      }
    }
    // Bahnübergang
    for (const [x, z] of [[-5.5, 26.5], [5.5, 21.5]]) {
      w.box(0.2, 3, 0.2, '#f2f2f2', x, G + 1.5, z);
      w.box(1.6, 0.25, 0.08, '#e8262b', x, G + 2.9, z, 0, 0, 0.7);
      w.box(1.6, 0.25, 0.08, '#e8262b', x, G + 2.9, z, 0, 0, -0.7);
    }
    // Bahnhof
    w.house(-46.5, -6, 7, 13, 4.6, { wall: '#d9b47a', roof: 'flat', roofColor: '#7a3f22', door: 'e', window: '#3d5f80', doorColor: '#5b3a1e' });
    w.block(-40.5, G + 0.25, -6, 7, 0.6, 16, '#a0764e');
    for (const z of [-13, -6, 1]) w.box(0.25, 3.4, 0.25, '#6b4423', -37.6, G + 1.9, z);
    w.box(4.4, 0.2, 16.4, '#7a3f22', -40, G + 3.65, -6, 0, 0, 0.1);
    w.sign('Bahnhof', -42.6, G + 6.6, -6, { bg: '#7a3f22', fg: '#ffe9b0', size: 1 });
    w.box(1.6, 0.5, 0.6, '#7a4a2a', -42.5, G + 0.75, -11); w.box(1.6, 0.6, 0.1, '#7a4a2a', -42.5, G + 1.2, -11.3);
    crate(-42.6, 1.2, G + 0.25); crate(-42.4, 2.3, G + 0.25, 0.8); barrel(-42.6, -1.4, G + 0.25);
    wagon(-46, 12, 0.3);
    // Dampflok
    const loco = new THREE.Group();
    part(loco, 2.0, 0.45, 6.8, '#2b2b2b', 0, 0.65, 0);
    part(loco, 1.7, 1.7, 3.8, '#1f2126', 0, 1.75, 1.0);
    for (const z of [0.0, 1.4, 2.6]) part(loco, 1.78, 0.18, 0.18, '#d9a32b', 0, 1.75, z);
    part(loco, 1.2, 0.5, 0.6, '#d9a32b', 0, 2.75, 0.4);
    part(loco, 0.6, 1.4, 0.6, '#2b2b2b', 0, 3.2, 2.4);
    part(loco, 1.0, 0.35, 1.0, '#2b2b2b', 0, 4.0, 2.4);
    part(loco, 0.6, 0.6, 0.3, '#fff3a0', 0, 2.2, 3.05, '#c9a000');
    part(loco, 2.0, 0.55, 0.6, '#c8322b', 0, 0.5, 3.6).rotation.x = 0.5;
    part(loco, 2.3, 0.15, 2.4, '#2b2b2b', 0, 0.95, -1.9);
    part(loco, 2.3, 2.0, 0.2, '#a8322b', 0, 2.0, -0.8);
    for (const s of [-1, 1]) { part(loco, 0.2, 2.0, 0.2, '#a8322b', s * 1.05, 2.0, -3.0); part(loco, 0.2, 0.9, 2.2, '#a8322b', s * 1.05, 1.45, -1.9); }
    part(loco, 2.7, 0.2, 2.8, '#2b2b2b', 0, 3.1, -1.9);
    for (const [z, r] of [[1.9, 0.55], [0.6, 0.55], [-0.7, 0.55], [-2.4, 0.4]]) for (const s of [-1, 1]) part(loco, 0.18, r * 2, r * 2, '#c8322b', s * 1.05, r, z);
    part(loco, 2.2, 1.0, 2.4, '#5b3a1e', 0, 1.2, -4.6);
    part(loco, 1.8, 0.5, 2.0, '#2b2b2b', 0, 1.9, -4.6);
    for (const s of [-1, 1]) for (const z of [-3.9, -5.3]) part(loco, 0.18, 0.8, 0.8, '#c8322b', s * 1.0, 0.4, z);
    bake(loco);
    // Rauchwölkchen (Weltkoordinaten)
    const puffs = [], puffMat = new THREE.MeshLambertMaterial({ color: '#f2f2f2', transparent: true, opacity: 0.85 });
    const puffGeo = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(puffGeo, puffMat); m.userData.age = 99; w.add(m); puffs.push(m); }
    const chimney = new THREE.Vector3(), lastAge = puffs.map(() => 0);
    const trainPts = [];
    for (let i = 0; i < 48; i++) { const [x, z] = ovalPt(Math.PI + (i / 48) * Math.PI * 2); trainPts.push([x, G + 0.35, z]); }
    w.addRide(pathRide(w, {
      points: trainPts, closed: true, duration: 30, vehicle: loco, seat: [0, 0.95, -1.9], flat: true,
      name: 'Dampflok', starId: 'train', station: w.station(-39.2, -6, 'Dampflok', '#a8322b', G + 0.25), exit: new THREE.Vector3(-41, G + 0.55, 0.5),
      animate(v, t) {
        chimney.set(0, 4.3, 2.4);
        v.localToWorld(chimney);
        puffs.forEach((m, i) => {
          const age = (t + i * 0.28) % 2.5;
          if (age < lastAge[i]) m.userData.origin = chimney.clone();
          lastAge[i] = age;
          const o = m.userData.origin || chimney;
          m.position.set(o.x + Math.sin(i * 2.1) * age * 0.4, o.y + age * 2.2, o.z + Math.cos(i * 1.7) * age * 0.4);
          m.scale.setScalar((0.45 + age * 0.55) * (age > 2 ? (2.5 - age) * 2 : 1));
          m.rotation.y = age;
        });
      },
    }));

    // ---------- Stern 1: Grubenbahn durch den Minenberg ----------
    w.addRide(coaster(w, TRACK, { name: 'Grubenbahn', starId: 'mine', color: '#7a4a2a', station: w.station(26, -30.5, 'Grubenbahn', '#7a4a2a', G), exit: new THREE.Vector3(30.5, G, -28.5) }));
    // Stollen: Holzbögen und Dach, wo die Bahn durch den Berg fährt
    let firstArch = null;
    for (let i = 0; i < 160; i++) {
      const u = i / 160, p = curve.getPointAt(u), t = curve.getTangentAt(u);
      if (mountain(p.x, p.z) < p.y + 2.6) continue;
      const ry = Math.atan2(t.x, t.z), sxv = Math.cos(ry), szv = -Math.sin(ry);
      if (i % 2 === 0) {
        for (const s of [-1.3, 1.3]) w.box(0.32, 3.4, 0.32, '#6b4423', p.x + sxv * s, p.y + 1.5, p.z + szv * s, ry);
        w.box(3.0, 0.35, 0.4, '#6b4423', p.x, p.y + 3.1, p.z, ry);
        firstArch ??= p.clone();
      }
      w.box(3.6, 0.3, 1.3, '#5b3a1e', p.x, p.y + 3.4, p.z, ry);
    }
    if (firstArch) w.sign('Goldmine', firstArch.x, firstArch.y + 5, firstArch.z, { bg: '#5b3a1e', fg: '#ffd23f', size: 1 });
    // Minenwagen und Erz am Bergfuß
    const cartAt = (x, z, ry) => {
      const L = local(x, z, ry);
      L(1.4, 0.8, 1.8, '#5b5f68', 0, 0.75, 0);
      L(1.2, 0.3, 1.6, '#ffd23f', 0, 1.2, 0);
      for (const [a, b] of [[-0.7, 0.6], [0.7, 0.6], [-0.7, -0.6], [0.7, -0.6]]) L(0.12, 0.5, 0.5, '#2b2b2b', a, 0.3, b);
      solid(x, z, 0.9, 0.9, 1.3);
    };
    cartAt(20, -28.5, 0.3); cartAt(31, -40, 1.2);
    for (let i = 0; i < 5; i++) w.box(0.5, 0.4, 0.5, '#ffd23f', 33 + w.r(-1, 1), G + 0.3, -38 + w.r(-1, 1), w.r(0, 3));
    w.box(0.15, 2, 0.15, '#6b4423', 22.5, G + 1, -27); w.box(0.5, 0.6, 0.5, '#ffb020', 22.5, G + 2.2, -27);

    // ---------- Stern 2: Tafelberg-Kletterei ----------
    const MR = 9.25;
    const corners = [[MESA.x + 6, MESA.z + MR], [MESA.x - MR, MESA.z + MR], [MESA.x - MR, MESA.z - MR], [MESA.x + MR, MESA.z - MR], [MESA.x + MR, MESA.z + MR]];
    const along = (dist) => {
      for (let k = 0; k < corners.length - 1; k++) {
        const [ax, az] = corners[k], [bx, bz] = corners[k + 1], L = Math.hypot(bx - ax, bz - az);
        if (dist <= L) return [ax + (bx - ax) * dist / L, az + (bz - az) * dist / L];
        dist -= L;
      }
      return corners[corners.length - 1];
    };
    for (let i = 0; i < 17; i++) {
      const [x, z] = along(i * 3.3), top = G + 1 + i;
      w.block(x, top, z, 2.4, 0.7, 2.4, i % 2 ? '#a8552f' : '#b9653a');
      w.box(1.6, 0.5, 1.6, '#93492a', x, top - 0.95, z, 0.4);
      if (i % 4 === 2) w.coin(x, top, z);
    }
    // Gesteinsbänder an den Wänden
    for (const [yy, c] of [[4, '#e0905a'], [9, '#a94f2e'], [13.5, '#e0905a']]) {
      for (const s of [-1, 1]) {
        w.box(12, 0.7, 0.1, c, MESA.x, yy, MESA.z + s * 8.05);
        w.box(0.1, 0.7, 12, c, MESA.x + s * 8.05, yy, MESA.z);
      }
    }
    w.star('mesa', MESA.x, 18.5, MESA.z, 'Tafelberg');
    w.sign('Tafelberg', MESA.x + 7, G + 3.6, MESA.z + 11.5, { bg: '#a8552f', fg: '#ffe9b0', size: 0.9 });
    w.box(0.15, 4, 0.15, '#6b4423', MESA.x + 3, 18.5 + 2, MESA.z - 3);
    w.box(1.6, 1, 0.08, '#e8262b', MESA.x + 3.8, 18.5 + 3.4, MESA.z - 3);
    for (const [dx, dz] of [[-4, 3], [4, 4], [-3, -5]]) { w.box(0.6, 2.6, 0.6, '#4f9a45', MESA.x + dx, 18.5 + 1.3, MESA.z + dz); w.box(0.9, 0.4, 0.4, '#4f9a45', MESA.x + dx + 0.5, 18.5 + 1.3, MESA.z + dz); w.box(0.4, 0.9, 0.4, '#5fb050', MESA.x + dx + 0.85, 18.5 + 1.8, MESA.z + dz); }

    // ---------- Stern 3: Goldgräber-Camp mit Wasserturm ----------
    w.enclosure({ x: 40, z: 40, w: 22, d: 22, side: 'w', h: 4.4, color: '#8a5e33', label: 'Goldgräber-Camp', y: G, cap: '#6b4423' });
    w.box(22, 0.06, 22, '#d9b073', 40, G + 0.04, 40);
    const peak = w.spiralTower({ x: 43, z: 43, y: G, r: 5.6, n: 13, rise: 1.05, size: 2.4, a0: Math.PI, da: 0.72, colors: ['#a0764e', '#c49a6c'], column: '#5b3a1e', colW: 0.8, top: '#7a5230', topSize: 4.2, starId: 'tower', label: 'Wasserturm' });
    w.cyl(3, 3, 4.2, '#8a5e33', 43, peak - 4.3, 43, { seg: 14 });
    for (const yy of [0.8, 2.2, 3.6]) w.box(6.15, 0.18, 0.4, '#3b3b3b', 43, peak - 4.3 + yy, 43 + 2.95);
    for (const [lx, lz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) w.box(0.35, peak - 4.3 - G, 0.35, '#6b4423', 43 + lx, (G + peak - 4.3) / 2, 43 + lz);
    for (const yy of [3, 7]) { w.box(4.3, 0.2, 0.2, '#6b4423', 43, G + yy, 41); w.box(4.3, 0.2, 0.2, '#6b4423', 43, G + yy, 45); w.box(0.2, 0.2, 4.3, '#6b4423', 41, G + yy, 43); w.box(0.2, 0.2, 4.3, '#6b4423', 45, G + yy, 43); }
    w.sign('Wasserturm', 43, peak + 5, 43, { bg: '#2f6fb5', size: 0.9 });
    // Camp: Zelte, Goldwaschrinne, Lagerfeuer
    const tent = (x, z, ry) => { const L = local(x, z, ry); L(0.15, 2.6, 3.4, '#f4eee0', -0.85, 1.1, 0, 0, -0.55); L(0.15, 2.6, 3.4, '#e8dcc0', 0.85, 1.1, 0, 0, 0.55); L(0.2, 2.4, 0.2, '#6b4423', 0, 1.2, 1.7); solid(x, z, 1.2, 1.2, 2.2); };
    tent(33, 47.5, 0); tent(37.5, 47.5, 0);
    w.water(34.5, 33.6, 7, 1.2, { top: G + 0.12, color: '#5fb0e8' });
    w.box(7.2, 0.5, 0.25, '#8a5e33', 34.5, G + 0.3, 33); w.box(7.2, 0.5, 0.25, '#8a5e33', 34.5, G + 0.3, 34.2);
    for (let i = 0; i < 8; i++) w.box(0.3, 0.25, 0.3, '#ffd23f', w.r(31, 38), G + 0.25, w.r(35, 37), w.r(0, 3));
    w.cyl(0.55, 0.45, 0.12, '#9aa0a8', 38.5, G, 35.5);
    for (let i = 0; i < 6; i++) { const a = i * 1.05; w.box(0.4, 0.3, 0.4, '#8d939b', 36 + Math.cos(a) * 0.8, G + 0.15, 42 + Math.sin(a) * 0.8, a); }
    w.box(0.5, 0.5, 0.5, '#ff8a1f', 36, G + 0.35, 42, 0.5); w.box(0.3, 0.6, 0.3, '#ffd23f', 36, G + 0.6, 42, 0.2);
    cartAt(48, 33, 0.4);
    for (let i = 0; i < 4; i++) rocks(31 + i * 1.8, 31, 0.5);
    w.coinLine(32, 40, 37, 40, 3, G);

    // ---------- Canyon im Osten mit Felsbogen ----------
    for (const [x, y, len, rz] of [[47.5, 8.4, 3.2, 0.5], [50.3, 9.6, 3.2, 0.15], [53.2, 9.6, 3.2, -0.15], [55.6, 9.2, 2.6, -0.4]]) w.box(len, 1.4, 3, '#c0603a', x, y, 0, 0, 0, rz);
    road(51.5, -20, 51.5, 20, 3, '#d9b06c');
    w.coinLine(51.5, -16, 51.5, 16, 8, G);
    rocks(49, -10, 0.8); rocks(54, 7, 0.9); rocks(53.5, 14, 0.6);
    w.sign('Canyon', 51.5, G + 4, 21, { bg: '#c0603a', fg: '#ffe9b0', size: 0.9 });

    // ---------- Ranch mit Koppel ----------
    fenceLine(-54, 30, -30, 30); fenceLine(-54, 52, -30, 52); fenceLine(-54, 30, -54, 52); fenceLine(-30, 30, -30, 38.5); fenceLine(-30, 43.5, -30, 52);
    w.house(-48, 46, 8, 6, 4.5, { wall: '#a8442e', roof: 'gable', roofColor: '#5b3a1e', door: 'e', window: '#f2ece0', doorColor: '#f2ece0' });
    w.sign('Ranch', -30, G + 4.2, 41, { bg: '#7a3f22', fg: '#ffe9b0', size: 0.9 });
    w.box(0.3, 3.6, 0.3, '#6b4423', -30, G + 1.8, 38.6); w.box(0.3, 3.6, 0.3, '#6b4423', -30, G + 1.8, 43.4); w.box(0.3, 0.4, 5.2, '#6b4423', -30, G + 3.5, 41);
    hay(-36, 48, 0.2); hay(-34, 48.4, 1.4); hay(-35, 48.2, 0.8, G + 1);
    w.water(-42, 35, 3, 1, { top: G + 0.55, color: '#5fb0e8' }); w.box(3.3, 0.55, 1.3, '#7a5230', -42, G + 0.27, 35);
    // Windrad mit Wassertrog
    const WX = -20, WZ = 33;
    for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) w.box(0.25, 9.4, 0.25, '#8a8f98', WX + lx * 0.8, G + 4.6, WZ + lz * 0.8, 0, -lz * 0.08, lx * 0.08);
    for (const yy of [2.5, 5, 7.5]) w.box(1.8 - yy * 0.1, 0.12, 1.8 - yy * 0.1, '#8a8f98', WX, G + yy, WZ);
    solid(WX, WZ, 1.4, 1.4, 4);
    const rotor = new THREE.Group();
    rotor.position.set(WX, G + 9.6, WZ + 0.6);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; part(rotor, 0.5, 1.9, 0.05, i % 2 ? '#e8262b' : '#f4eee0', Math.sin(a) * 1.5, Math.cos(a) * 1.5, 0).rotation.z = -a; }
    part(rotor, 0.5, 0.5, 0.4, '#3b3b3b', 0, 0, 0);
    w.add(bake(rotor));
    w.box(0.15, 0.6, 2.6, '#8a8f98', WX, G + 9.6, WZ - 1.2);
    w.box(0.08, 1.4, 1.6, '#e8262b', WX, G + 9.8, WZ - 2.6);
    w.updaters.push((dt) => { rotor.rotation.z -= dt * 1.8; });
    w.water(WX + 3, WZ, 1.2, 3, { top: G + 0.6, color: '#5fb0e8' }); w.box(1.5, 0.6, 3.3, '#7a5230', WX + 3, G + 0.29, WZ);
    wagon(-13, 43, -0.4);
    wagon(15, 44, 0.5);

    // ---------- Steppenläufer ----------
    const weeds = [];
    for (const [x1, z1, x2, z2, sp] of [[-30, -54, 30, -54, 3], [26, -22, 26, 18, 2.4], [8, 28, 27, 28, 2], [-28, 12, -28, -20, 2.6]]) {
      const g = new THREE.Group();
      for (let k = 0; k < 3; k++) part(g, 1.1, 1.1, 1.1, k % 2 ? '#b8955a' : '#a07a45', 0, 0, 0).rotation.set(k * 0.7, k * 1.1, k * 0.4);
      w.add(bake(g));
      weeds.push({ g, x1, z1, x2, z2, sp, len: Math.hypot(x2 - x1, z2 - z1) });
    }
    w.updaters.push((dt, t) => {
      for (const s of weeds) {
        const k = ((t * s.sp) % s.len) / s.len;
        s.g.position.set(s.x1 + (s.x2 - s.x1) * k, G + 0.6 + Math.abs(Math.sin(t * 3 + s.len)) * 0.7, s.z1 + (s.z2 - s.z1) * k);
        s.g.rotation.x = t * 4;
        s.g.rotation.z = t * 2;
      }
    });

    // ---------- Kakteen, Felsen ----------
    const avoid = [[-18, -24, 18, 50], [-56, 26, -26, 56], [-52, -16, -33, 16], [28, 28, 52, 52], [-50, -50, -30, -28], [12, -58, 58, -24], [38, -22, 58, 22], [-24, 28, -10, 40], [-30, -14, 30, 4]];
    const inAvoid = (x, z) => avoid.some(([a, b, c, d]) => x >= a && x <= c && z >= b && z <= d);
    let placed = 0;
    for (let k = 0; k < 600 && placed < 34; k++) {
      const x = w.r(-54, 54), z = w.r(-54, 54);
      if (inAvoid(x, z)) continue;
      // nicht auf den Schienen
      const e = ((x - OVAL.cx) / OVAL.rx) ** 2 + ((z - OVAL.cz) / OVAL.rz) ** 2;
      if (e > 0.82 && e < 1.2) continue;
      if (Math.hypot(x, z - 45) < 9) continue;
      if (placed % 3 === 2) smallCactus(x, z); else cactus(x, z, w.r(0.8, 1.25));
      placed++;
    }
    for (let k = 0; k < 14; k++) { const x = w.r(-54, 54), z = w.r(-54, 54); if (!inAvoid(x, z)) rocks(x, z, w.r(0.5, 1.1)); }

    // ---------- Tiere ----------
    const V = (x, z) => new THREE.Vector3(x, 0, z);
    w.animal('horse', { pos: V(-3.8, 11), radius: 1.2, speed: 0.4, color: '#8a5a2b', saddle: '#5b2a1a', hungry: true });
    w.animal('horse', { pos: V(-3.8, 15.5), behavior: 'perch', color: '#3b2a1a', saddle: '#a8322b' });
    for (let i = 0; i < 4; i++) w.animal('cow', { pos: V(-48 + i * 4, 36 + (i % 2) * 6), radius: 5, speed: 0.6, hungry: i === 1 });
    [['#f2ece0', '#7a3f22'], ['#2b2b2b', '#a8322b'], ['#d9a65a', '#5b2a1a']].forEach(([c, s], i) => w.animal('horse', { pos: V(-38 + i * 3, 42), radius: 6, speed: 1.2, color: c, saddle: s, hungry: i === 2 }));
    for (let i = 0; i < 4; i++) w.animal('chicken', { pos: V(5 + i * 0.8, -7 + i), radius: 3, speed: 0.9, hungry: i === 0 });
    w.animal('lizard', { pos: V(-30, -27), radius: 3, speed: 1.4, hungry: true });
    w.animal('lizard', { pos: V(50, -6), radius: 4, speed: 1.6 });
    w.animal('lizard', { pos: V(20, 36), radius: 3, speed: 1.2 });
    w.animal('horse', { pos: V(46, 36), radius: 3, speed: 0.5, color: '#8d8f94', scale: 0.8 });
    w.animal('dog', { pos: V(8, 9), radius: 3, speed: 1.6 });
    const vult = ['#4a3528', '#2b1f17', '#e8d8c8'];
    w.animal('bird', { pos: new THREE.Vector3(MESA.x, 0, MESA.z), y: 25, behavior: 'fly', radius: 9, speed: 3, colors: vult, scale: 1.6 });
    w.animal('bird', { pos: new THREE.Vector3(MESA.x, 0, MESA.z), y: 28, behavior: 'fly', radius: 13, speed: -3.4, colors: vult, scale: 1.6 });
    w.animal('bird', { pos: new THREE.Vector3(50, 0, 0), y: 16, behavior: 'fly', radius: 8, speed: 3, colors: vult, scale: 1.6 });
    w.animal('bird', { pos: new THREE.Vector3(0, 0, -6), y: 22, behavior: 'fly', radius: 20, speed: 4, colors: vult, scale: 1.6 });
    w.animal('bird', { pos: new THREE.Vector3(MESA.x + 2, 18.5, MESA.z + 1), y: 18.5, behavior: 'perch', colors: vult, scale: 1.4 });

    // ---------- Münzen ----------
    w.coinLine(0, 40, 0, -16, 10, G);
    w.coinRing(WX, G, WZ, 4, 8);
    w.coinRing(-42, G, 41, 5, 6);
    w.coinLine(-30, -54, 30, -54, 8, G);
    w.coinLine(18, -26, 30, -26, 4, G);
    w.coinLine(-26, -2, -26, -14, 4, G);
    w.coinLine(26, 4, 26, 16, 4, G);
    for (const c of w.coins) c.mesh.castShadow = false;
    for (const a of w.animals) bake(a.g);
  },
};
