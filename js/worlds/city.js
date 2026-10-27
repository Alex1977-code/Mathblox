// Großstadt „Sonnenstadt“: sonnige Kalifornien-Stadt mit Palmenalleen, Downtown-Wolkenkratzern,
// Strand mit Pier und Riesenrad, Hügeln mit MATHBLOX-Schriftzug und Sternwarte, Freeway und Villen mit Pool.
// Sterne: Feuertreppe am Hochhaus, Taxi-Tour (auch über den Freeway), Hubschrauber-Rundflug, Baukran.
// Straßen sind 8 breit und frei von festen Hindernissen (später fahrbare Autos).
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';
import { pathRide } from '../rides.js';
import { Kit, boxList, meshOf, roundedLoop, loopMovers } from './city-kit.js';
import { at, carModel, busModel, vanModel, taxiModel, policeCarModel, fireTruckModel, heliBody, rotorModel } from './city-models.js';

const ASPHALT = '#4a4e57', LINE = '#f4f4f0', YELLOW = '#ffd23f', WALK = '#e2d6c8', SAND = '#f3dca0';
const ROAD_X = [-36, 0, 36], ROAD_Z = [-40, -8, 24];
const FWY_Z = -50, FWY_Y = 5; // Freeway (Hochstraße) im Norden

// Pixel-Schrift (5×5) für den Schriftzug auf dem Hügel
const FONT = {
  M: ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X'],
  A: ['.XXX.', 'X...X', 'XXXXX', 'X...X', 'X...X'],
  T: ['XXXXX', '..X..', '..X..', '..X..', '..X..'],
  H: ['X...X', 'X...X', 'XXXXX', 'X...X', 'X...X'],
  B: ['XXXX.', 'X...X', 'XXXX.', 'X...X', 'XXXX.'],
  L: ['X....', 'X....', 'X....', 'X....', 'XXXXX'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.'],
  X: ['X...X', '.X.X.', '..X..', '.X.X.', 'X...X'],
};

function vehicle(model, ...args) {
  const b = boxList();
  model(b, ...args);
  const g = new THREE.Group();
  g.add(meshOf(b));
  return g;
}

// Höhe der Freeway-Fahrbahn an Stelle x (Rampen an beiden Enden)
const fwyY = (x) => (Math.abs(x) <= 30 ? FWY_Y : Math.max(0, FWY_Y * (54 - Math.abs(x)) / 24));

export const city = {
  id: 'city',
  name: 'Großstadt',
  seed: 101,
  theme: {
    sky: ['#4a5fb8', '#f49a9a', '#ffd9a0'], fog: '#f6cfb0', sea: '#2f8fc8', fogNear: 110, fogFar: 290,
    light: { hemi: 1.5, sun: 2.2, sunColor: '#ffd9b0', sky: '#fff2e2', ground: '#9a8ab0' },
  },
  stars: { skyscraper: 'Wolkenkratzer', taxi: 'Taxi-Tour', heli: 'Hubschrauber-Rundflug', crane: 'Baukran', driver: 'Profi-Fahrer (3 Aufträge)' },
  missionStar: { id: 'driver', count: 3 },
  build(w) {
    const K = new Kit(w);
    const B = w.box.bind(w);
    const glow = boxList();
    w.island(116, WALK, SAND);
    exitPortal(w, 53, 'hub');

    // Sehr hohe, schlanke Palme (Los-Angeles-Stil)
    const palm = (x, z, h = 13, y0 = 0) => {
      const lean = w.r(-0.05, 0.05);
      for (let y = 0; y < h; y += 1.5) B(0.42, 1.55, 0.42, y % 3 ? '#9a7a55' : '#8a6a48', x + lean * y, y0 + y + 0.75, z);
      const tx = x + lean * h, ty = y0 + h + 0.2;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        B(0.5, 0.12, 2.6, i % 2 ? '#3f9a49' : '#2f8a3c', tx + Math.sin(a) * 1.1, ty - 0.3, z + Math.cos(a) * 1.1, a, 0.45);
      }
      B(0.6, 0.5, 0.6, '#6b4a2a', tx, ty, z);
      w.solids.push({ min: new THREE.Vector3(x - 0.21, y0, z - 0.21), max: new THREE.Vector3(x + 0.21, y0 + 4, z + 0.21) });
    };

    // ---------------- Straßen ----------------
    const road = (x1, z1, x2, z2) => B(Math.abs(x2 - x1) || 8, 0.06, Math.abs(z2 - z1) || 8, ASPHALT, (x1 + x2) / 2, 0.03, (z1 + z2) / 2);
    for (const z of ROAD_Z) road(z === -40 ? -58 : -40, z, z === -40 ? 58 : 40, z);
    for (const x of ROAD_X) road(x, -44, x, 28);
    road(-56, -44, -56, -54); road(56, -44, 56, -54); // Auffahrten zum Freeway
    const nearX = (v) => ROAD_X.some((x) => Math.abs(v - x) < 7.5);
    const nearZ = (v) => ROAD_Z.some((z) => Math.abs(v - z) < 7.5);
    for (const z of ROAD_Z) for (let x = z === -40 ? -56 : -38; x <= (z === -40 ? 56 : 38); x += 3.5) if (!nearX(x)) B(1.8, 0.07, 0.22, YELLOW, x, 0.04, z);
    for (const x of ROAD_X) for (let z = -42; z <= 26; z += 3.5) if (!nearZ(z)) B(0.22, 0.07, 1.8, YELLOW, x, 0.04, z);
    for (const z of ROAD_Z) for (const s of [-1, 1]) for (const [xa, xb] of [[-32, -4], [4, 32]]) B(xb - xa, 0.12, 0.3, '#f4ece2', (xa + xb) / 2, 0.06, z + s * 4.15);
    for (const x of ROAD_X) for (const s of [-1, 1]) for (const [za, zb] of [[-36, -12], [-4, 20]]) B(0.3, 0.12, zb - za, '#f4ece2', x + s * 4.15, 0.06, (za + zb) / 2);
    for (const X of ROAD_X) for (const Z of ROAD_Z) {
      for (const s of [-1, 1]) for (let k = -3; k <= 3; k++) {
        B(2, 0.07, 0.55, LINE, X + s * 5.6, 0.045, Z + k * 1.1);
        B(0.55, 0.07, 2, LINE, X + k * 1.1, 0.045, Z + s * 5.6);
      }
      for (const [sx, sz, red] of [[1, 1, true], [-1, -1, false]]) {
        const px = X + sx * 4.8, pz = Z + sz * 4.8;
        B(0.22, 4.2, 0.22, '#2d3440', px, 2.1, pz);
        B(0.5, 1.5, 0.45, '#1d2228', px, 4.6, pz);
        glow(0.3, 0.3, 0.48, red ? '#ff3b30' : '#3a1414', px, 5.1, pz);
        glow(0.3, 0.3, 0.48, '#3a3010', px, 4.6, pz);
        glow(0.3, 0.3, 0.48, red ? '#103a18' : '#34e05a', px, 4.1, pz);
      }
    }

    // ---------------- Hochhäuser ----------------
    const tower = (x, z, sx, sz, h, o = {}) => {
      const y0 = o.y0 || 0, wall = o.wall || '#e4e7ec', glass = o.glass || '#8cc8f0', trim = o.trim || '#9aa3ad';
      K.solid(x, y0 + h, z, sx, h, sz, wall, { studs: false, safe: true });
      if (!y0) for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const len = nz ? sx : sz;
        B(nz ? len - 1 : 0.1, 2.6, nz ? 0.1 : len - 1, '#4d6b88', x + nx * (sx / 2 + 0.04), 1.5, z + nz * (sz / 2 + 0.04));
      }
      for (let y = y0 + (y0 ? 1.6 : 4.4); y < y0 + h - 1; y += o.floor || 3) {
        B(sx - 0.8, 1.5, 0.1, glass, x, y, z + sz / 2 + 0.04);
        B(sx - 0.8, 1.5, 0.1, glass, x, y, z - sz / 2 - 0.04);
        B(0.1, 1.5, sz - 0.8, glass, x + sx / 2 + 0.04, y, z);
        B(0.1, 1.5, sz - 0.8, glass, x - sx / 2 - 0.04, y, z);
      }
      const hy = (y0 ? 0 : 3) + y0, hh = y0 + h - 0.6 - hy;
      for (let u = -sx / 2 + 1.7; u < sx / 2 - 0.9; u += 1.7) for (const s of [-1, 1]) B(0.22, hh, 0.16, wall, x + u, hy + hh / 2, z + s * (sz / 2 + 0.08));
      for (let u = -sz / 2 + 1.7; u < sz / 2 - 0.9; u += 1.7) for (const s of [-1, 1]) B(0.16, hh, 0.22, wall, x + s * (sx / 2 + 0.08), hy + hh / 2, z + u);
      B(sx + 0.4, 0.5, sz + 0.4, trim, x, y0 + h + 0.25, z);
      if (o.top) return tower(x + (o.top[3] || 0), z + (o.top[4] || 0), o.top[0], o.top[1], o.top[2], { ...o, y0: y0 + h, top: o.top2, top2: null });
      if (o.antenna) { B(0.3, o.antenna, 0.3, '#c8ccd2', x, y0 + h + o.antenna / 2, z); glow(0.5, 0.5, 0.5, '#ff3b30', x, y0 + h + o.antenna, z); }
      if (o.ac) for (let i = 0; i < 2; i++) B(1.6, 1, 1.4, '#b7bec6', x - sx / 4 + i * sx / 2, y0 + h + 1, z - sz / 5);
      return y0 + h;
    };
    // Downtown: hohe Türme links und rechts, die Allee zur Bergkette bleibt frei
    tower(-23.5, 2.5, 11, 10, 30, { wall: '#f2e2d2', glass: '#7fbde8', top: [8, 7, 8], antenna: 6 });
    tower(23.5, 2.5, 11, 10, 34, { wall: '#d6e2ef', glass: '#6fb3e6', top: [8, 7, 6], top2: [5, 5, 4], antenna: 5 });
    tower(-14.5, 4, 5, 8, 21, { wall: '#ffd9c8', glass: '#86c6ee', ac: true });
    tower(14.5, 4, 5, 8, 24, { wall: '#d8efe4', glass: '#7fd0c0', ac: true });
    // flache Pastell-Häuser an der Palmenallee
    for (const s of [-1, 1]) {
      K.solid(s * 9, 7, 3, 5, 7, 9, s < 0 ? '#ffe0b8' : '#e8d8f4', { studs: false, safe: true });
      for (const y of [2, 5]) B(0.1, 1.4, 7.6, '#9fd3f5', s * 6.45, y, 3);
      B(5.4, 0.4, 9.4, '#ffffff', s * 9, 7.2, 3);
    }

    // ---------------- Läden mit Markisen ----------------
    const shop = (x, z, sw, h, wall, awn, label) => {
      const dep = 6, zf = z + dep / 2;
      K.solid(x, h, z, sw, h, dep, wall, { studs: false, safe: true });
      B(sw - 1.2, 1.9, 0.1, '#9fd3f5', x - 0.5, 1.4, zf + 0.04);
      B(1.1, 2.2, 0.12, '#6b4423', x + sw / 2 - 1.1, 1.1, zf + 0.05);
      B(sw + 0.2, 0.3, dep + 0.2, '#ffffff', x, h + 0.15, z);
      B(sw - 0.6, 3, 0.1, '#9fd3f5', x, h - 1.8, zf + 0.04);
      const n = Math.round(sw / 0.55);
      for (let i = 0; i < n; i++) B(sw / n + 0.01, 0.1, 1.7, i % 2 ? awn : '#ffffff', x - sw / 2 + (i + 0.5) * sw / n, 2.95, zf + 0.8, 0, 0.35);
      B(sw, 0.25, 0.12, awn, x, 2.68, zf + 1.6);
      B(sw - 1, 0.7, 0.14, '#ffffff', x, 3.75, zf + 0.06);
      w.sign(label, x, 3.9, zf + 0.5, { bg: awn, size: 0.85 });
    };
    shop(-27, 15, 5.4, 5, '#ffd0c0', '#ff5f6e', 'Bäckerei');
    shop(-21, 15, 5.4, 6.5, '#c8e8f6', '#2f9df6', 'Spielzeug');
    shop(-15, 15, 5.4, 5, '#fff0b8', '#2fbf6a', 'Saftbar');
    shop(-9, 15, 5.4, 6, '#ead8f6', '#b05fd0', 'Bücher');
    shop(9, 15, 5.4, 6, '#ffd6e0', '#ff5fb0', 'Eiscafé');
    shop(15, 15, 5.4, 5, '#d8f4e0', '#ff8a1f', 'Surfshop');
    shop(21, 15, 5.4, 6.5, '#ffe6c8', '#e0663a', 'Tacos');
    shop(27, 15, 5.4, 5, '#d0ecf7', '#1fb5c9', 'Fahrräder');
    B(1.2, 0.9, 0.8, '#ff9f1a', -15, 0.45, 19.4);
    B(1.2, 0.2, 0.8, '#ff3b30', -15, 0.95, 19.4);

    // ---------------- Feuerwehr und Polizei (Südwesten) ----------------
    K.solid(-24, 7, 38, 16, 7, 10, '#d23c3c', { studs: false, safe: true });
    B(16.4, 0.4, 10.4, '#f2f2f2', -24, 7.2, 38);
    for (const x of [-29, -24, -19]) {
      B(3.6, 4, 0.1, '#f2f2f2', x, 2, 32.96);
      for (let y = 0.6; y < 4; y += 0.8) B(3.4, 0.08, 0.12, '#c8ccd2', x, y, 32.92);
    }
    K.solid(-34, 12, 40, 3, 12, 3, '#b8302e', { studs: false, safe: true });
    for (let y = 2; y < 12; y += 3) B(0.8, 1, 0.1, '#9fd3f5', -34, y, 38.45);
    w.sign('Feuerwehr', -24, 8.6, 32.6, { bg: '#d23c3c', size: 1.1 });
    fireTruckModel(at(B, -24, 30.2, Math.PI / 2));
    K.solid(-24, 7, 52, 16, 7, 8, '#f4f6fa', { studs: false, safe: true });
    B(16.1, 0.8, 8.1, '#1f5fd6', -24, 2.9, 52);
    B(16.4, 0.4, 8.4, '#c8ccd2', -24, 7.2, 52);
    for (let x = -30; x <= -18; x += 3) B(1.6, 1.3, 0.1, '#9fd3f5', x, 5.2, 47.95);
    B(2.2, 2.3, 0.12, '#4d6b88', -24, 1.15, 47.94);
    glow(0.8, 0.4, 0.8, '#3b8cff', -24, 7.6, 52);
    w.sign('Polizei', -24, 9, 47.5, { bg: '#1f5fd6', size: 1.1 });
    policeCarModel(at(B, -17.5, 45.6, Math.PI / 2));

    // ---------------- Tankstelle (Osten) ----------------
    for (const [x, z] of [[44, 2], [54, 2], [44, 10], [54, 10]]) K.solid(x, 4.6, z, 0.6, 4.6, 0.6, '#e6e8ea', { studs: false });
    B(13, 0.6, 10, '#ffffff', 49, 4.9, 6);
    B(13.1, 0.3, 10.1, '#ff8a5a', 49, 4.65, 6);
    for (const z of [3.5, 8.5]) {
      K.solid(49, 0.3, z, 7, 0.3, 1.4, '#c8ccd2', { studs: false });
      for (const x of [46.5, 51.5]) {
        K.solid(x, 2.1, z, 0.9, 1.8, 0.7, '#ff8a5a', { studs: false });
        B(0.7, 0.5, 0.72, '#1d2430', x, 1.6, z);
        B(0.2, 0.6, 0.2, '#222', x + 0.5, 1.3, z);
      }
    }
    K.solid(50, 4, 16.5, 12, 4, 5, '#fff4e6', { studs: false, safe: true });
    B(9, 2, 0.1, '#9fd3f5', 49, 1.6, 13.96);
    B(12.2, 0.6, 5.2, '#ff8a5a', 50, 4.1, 16.5);
    w.sign('Tankstelle', 49, 6.6, 6, { bg: '#ff8a5a', size: 1.1 });
    carModel(at(B, 46.5, 6, 0), '#2f9df6');

    // ---------------- Park mit Brunnen und Ententeich ----------------
    B(28, 0.08, 24, '#7cc24a', -18, 0.04, -24);
    w.path(-32, -24, -4, -24, 2.4, '#f0e2c0');
    w.path(-18, -36, -18, -12, 2.4, '#f0e2c0');
    for (const [x, z, ww, dd] of [[-18, -27.6, 7.8, 0.8], [-18, -20.4, 7.8, 0.8], [-21.6, -24, 0.8, 6.4], [-14.4, -24, 0.8, 6.4]]) K.solid(x, 0.6, z, ww, 0.6, dd, '#e8dcc8', { studs: false, safe: true });
    w.water(-18, -24, 6.4, 6.4, { top: 0.45, color: '#5cc8ff' });
    K.solid(-18, 2.4, -24, 1, 2.4, 1, '#e8dcc8', { studs: false });
    B(2.6, 0.3, 2.6, '#e8dcc8', -18, 2.5, -24);
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.45, 2.6, 8), new THREE.MeshBasicMaterial({ color: '#bfeaff', transparent: true, opacity: 0.7 }));
    jet.position.set(-18, 4, -24);
    w.add(jet);
    w.updaters.push((dt, t) => { jet.scale.y = 1 + Math.sin(t * 4) * 0.15; });
    w.coinRing(-18, 0, -24, 6.5, 10);
    w.water(-9, -31, 8, 6, { color: '#4fb8f0' });
    for (let i = 0; i < 4; i++) w.animal('duck', { pos: new THREE.Vector3(-10 + i, 0.05, -31), behavior: 'swim', radius: 2.5, speed: 0.7, hungry: i === 0 });
    for (const [x, z, ry] of [[-26, -21.5, 0], [-10, -21.5, 0], [-26, -26.5, Math.PI], [-21, -15, Math.PI / 2]]) {
      const bb = at(B, x, z, ry);
      bb(2.4, 0.15, 0.7, '#a0764e', 0, 0.6, 0);
      bb(2.4, 0.6, 0.12, '#a0764e', 0, 1.0, -0.35);
      for (const s of [-1, 1]) bb(0.15, 0.6, 0.6, '#3a3f47', s * 1, 0.3, 0);
    }
    B(0.2, 3, 0.2, '#ff5fb0', -28, 1.5, -33); B(0.2, 3, 0.2, '#ff5fb0', -28, 1.5, -31);
    B(1.2, 0.2, 2.4, '#ffd23f', -28, 2.4, -32);
    B(1.1, 0.12, 4, '#2f7df6', -28, 1.3, -29.2, 0, -0.55);
    for (const s of [-1, 1]) B(0.2, 3.2, 0.2, '#e8262b', -22 + s * 1.6, 1.6, -34);
    B(3.6, 0.2, 0.2, '#e8262b', -22, 3.2, -34);
    for (const s of [-1, 1]) { B(0.05, 2.2, 0.05, '#555', -22 + s * 0.8, 2.0, -34); B(0.7, 0.1, 0.35, '#ffd23f', -22 + s * 0.8, 0.9, -34); }
    w.flowers(-27, -14.5, 6, 2.5, 25, ['#ff595e', '#ffd23f', '#ffffff', '#b07bff']);
    w.flowers(-9, -14.5, 6, 2.5, 25, ['#ff5fb0', '#ffd23f', '#ffffff']);
    for (const [x, z] of [[-30, -14], [-30, -30], [-6, -14], [-12, -35], [-25, -35], [-6, -24]]) palm(x, z, w.r(9, 12));
    for (const [x, z] of [[-30, -20], [-14, -14]]) w.tree('blossom', x, z, 0.9);
    w.sign('Stadtpark', -18, 3.2, -11.6, { bg: '#2fbf4a', size: 0.9 });

    // ---------------- Plaza am Portal ----------------
    B(24, 0.06, 28, '#f6e6cf', 0, 0.035, 43);
    for (let i = 0; i < 6; i++) B(24, 0.07, 0.25, '#e8cfae', 0, 0.04, 31 + i * 4.5);
    for (const s of [-1, 1]) {
      K.solid(s * 9, 0.5, 40, 4, 0.5, 4, '#e8cfae', { studs: false });
      B(3.6, 0.1, 3.6, '#7cc24a', s * 9, 0.52, 40);
      w.flowers(s * 9, 40, 3.2, 3.2, 14, ['#ff595e', '#ffd23f', '#ffffff', '#ff5fb0']);
      palm(s * 9.5, 48, 12);
      const bb = at(B, s * 6.5, 44, -s * Math.PI / 2);
      bb(2.4, 0.15, 0.7, '#a0764e', 0, 0.6, 0);
      bb(2.4, 0.6, 0.12, '#a0764e', 0, 1.0, -0.35);
    }
    w.sign('Willkommen in der Sonnenstadt!', -9, 4.2, 36.5, { bg: '#ff8a5a', size: 0.8 });
    w.coinRing(0, 0, 40, 4.5, 6);

    // ---------------- Palmenalleen, Laternen, parkende Autos ----------------
    for (let z = 20; z >= -36; z -= 7) if (!nearZ(z)) for (const s of [-1, 1]) palm(s * 5.2, z, w.r(13, 16));
    for (let x = -32; x <= 32; x += 8) if (Math.abs(x) > 6) palm(x, 28.6, w.r(12, 15));
    for (let z = -33; z <= 56; z += 7) palm(-41.6, z, w.r(12, 16));
    for (const x of [-26, -14, 14, 26]) { w.lamp(x, 20.4); w.lamp(x, -11.6); }
    const parked = [['#2f9df6', 3, -16, 0], ['#ff595e', 3, -31, Math.PI], ['#ffffff', 10, -11.2, Math.PI / 2], ['#8ac926', 22, -11.2, Math.PI / 2], ['#b07bff', 16, -4.8, -Math.PI / 2], ['#ffd23f', 26, -4.8, -Math.PI / 2]];
    for (const [c, x, z, ry] of parked) carModel(at(B, x, z, ry), c);

    // ---------------- Fahrende Autos (Deko, nicht fest) ----------------
    const cars = [vehicle(carModel, '#e8262b'), vehicle(busModel, '#2f9df6'), vehicle(carModel, '#ffffff'), vehicle(vanModel, '#ff8a1f'), vehicle(carModel, '#2fbf4a')];
    cars.forEach((c) => w.add(c));
    w.updaters.push(loopMovers(roundedLoop([[-34, 22], [34, 22], [34, -38], [-34, -38]], 0.05, 4.5), cars, 8));

    // ---------------- Freeway (Hochstraße) mit Rampen ----------------
    K.solid(0, FWY_Y, FWY_Z, 60, 0.8, 10, ASPHALT, { studs: false, safe: true });
    for (const s of [-1, 1]) {
      for (let i = 0; i < 24; i++) { const x = s * (30.5 + i); K.solid(x, fwyY(x), FWY_Z, 1.0, Math.min(0.8, fwyY(x) + 0.7), 10, ASPHALT, { hidden: true, safe: true }); }
      const ang = Math.atan2(FWY_Y, 24), len = Math.hypot(24, FWY_Y);
      B(len, 0.7, 10, ASPHALT, s * 42, FWY_Y / 2 - 0.35, FWY_Z, 0, 0, -s * ang);
      for (const zz of [-4.85, 4.85]) B(len, 0.8, 0.3, '#e8e2d6', s * 42, FWY_Y / 2 + 0.3, FWY_Z + zz, 0, 0, -s * ang);
      for (let x = 34; x <= 50; x += 8) for (const zz of [-3, 3]) B(0.9, fwyY(x) - 0.4, 0.9, '#d8d0c4', s * x, (fwyY(x) - 0.4) / 2, FWY_Z + zz);
    }
    for (const zz of [-4.85, 4.85]) K.solid(0, FWY_Y + 0.8, FWY_Z + zz, 60, 0.8, 0.3, '#e8e2d6', { studs: false });
    for (let x = -28; x <= 28; x += 3.5) B(1.8, 0.07, 0.22, '#ffffff', x, FWY_Y + 0.04, FWY_Z);
    for (let x = -26; x <= 26; x += 13) for (const zz of [-3, 3]) K.solid(x, FWY_Y - 0.8, FWY_Z + zz, 1.2, FWY_Y - 0.8, 1.2, '#d8d0c4', { studs: false });
    // Schilderbrücke über dem Freeway
    for (const zz of [-5.3, 5.3]) B(0.3, 5, 0.3, '#5a616b', -12, FWY_Y + 2.5, FWY_Z + zz);
    B(0.3, 0.3, 10.9, '#5a616b', -12, FWY_Y + 5, FWY_Z);
    B(0.2, 1.6, 8, '#1f7a4a', -12.1, FWY_Y + 4.2, FWY_Z);
    w.sign('Freeway · Sternwarte · Strand', -12, FWY_Y + 6.4, FWY_Z, { bg: '#1f7a4a', size: 0.8 });
    w.coinLine(-24, FWY_Z, 24, FWY_Z, 7, FWY_Y);

    // ---------------- Hügel mit Schriftzug und Sternwarte ----------------
    const hill = (x, z) => {
      const t = -z - 56;
      let h = t * 1.15 + 2.5 * Math.sin(x * 0.15) + 1.5 * Math.sin(x * 0.37 + z * 0.2) + 2;
      if (Math.abs(x) <= 30 && z < -60 && z > -64) h = 13;
      else if (Math.abs(x) <= 30 && z <= -64) h = Math.max(h, 15 + (t - 10) * 0.9);
      if (Math.abs(x) <= 10 && z <= -72 && z >= -80) h = 27;
      if (x >= 36 && x <= 52 && z <= -56 && z >= -64) h = 8;
      if (x < -34) h *= Math.max(0, Math.min(1, (x + 50) / 16));
      return Math.round(h);
    };
    const hillCol = ['#c8a860', '#d6b86e', '#bfa058', '#e0c27a'];
    for (let cz = -58; cz >= -86; cz -= 4) for (let cx = -46; cx <= 72; cx += 4) {
      const h = hill(cx, cz);
      if (h < 1) continue;
      K.solid(cx, h, cz, 4, h + 4, 4, hillCol[(cx + cz) & 3], { studs: false, safe: true, hidden: true });
      B(4, h + 4, 4, h > 20 ? '#d9c08a' : hillCol[((cx + cz) / 4) & 3], cx, (h - 4) / 2, cz);
      if (((cx * 7 + cz * 3) & 7) < 3) B(1.4, 0.9, 1.2, '#5f8a3a', cx + 1, h + 0.4, cz + 0.6);
      if (((cx * 5 + cz) & 15) === 0 && h < 13) palm(cx + 1.2, cz - 1, 7, h);
    }
    // MATHBLOX-Buchstaben
    const P = 1.1, word = 'MATHBLOX', adv = 6.8, x0 = -(word.length * adv - 1.3) / 2;
    [...word].forEach((ch, k) => {
      const lx = x0 + k * adv, by = 14 + (k % 3) * 0.3;
      FONT[ch].forEach((row, r) => [...row].forEach((c, col) => {
        if (c === 'X') B(P, P, 0.5, '#ffffff', lx + col * P + P / 2, by + (4 - r) * P + P / 2, -61);
      }));
      for (const dx of [1, 4]) B(0.15, 2, 0.15, '#6a6a6a', lx + dx * P, by + 0.2, -61.5);
    });
    // Sternwarte
    B(18, 4, 6, '#f6f2ea', 0, 29, -76);
    B(6, 6, 6, '#f6f2ea', 0, 30, -76);
    for (let x = -7; x <= 7; x += 2) if (Math.abs(x) > 3) B(0.8, 2, 0.1, '#7a8aa0', x, 29, -72.96);
    w.sphere(3.2, '#4a5a6a', 0, 33, -76, { half: true, seg: 14 });
    for (const s of [-1, 1]) w.sphere(1.9, '#4a5a6a', s * 7.5, 31, -76, { half: true, seg: 12 });
    w.sign('Sternwarte', 0, 38, -74, { bg: '#4a5fb8', size: 1.1 });
    // Villa mit Pool auf dem Hügel
    K.solid(44, 11.5, -62, 12, 3.5, 5, '#ffffff', { studs: false, safe: true });
    B(7, 2.6, 4.4, '#f4efe6', 46, 12.8, -62.4);
    B(12.1, 1.6, 0.1, '#9fd3f5', 44, 10, -59.45);
    w.water(44, -57.5, 9, 3, { top: 8.08, color: '#5fe0f0' });

    // ---------------- Strand mit Pier, Riesenrad und Rettungstürmen (Westen) ----------------
    B(17, 0.08, 91.5, SAND, -49.5, 0.04, 10.25);
    B(17, 0.08, 13.5, SAND, -49.5, 0.04, -51.25);
    w.path(-42.6, -35, -42.6, 58, 2.2, '#f7c9b8');
    const tower2 = (x, z, c) => {
      const L = at(B, x, z, -Math.PI / 2);
      for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) L(0.2, 2.2, 0.2, '#f4f4f0', dx, 1.1, dz);
      L(2.6, 0.2, 2.6, '#f4f4f0', 0, 2.3, 0);
      L(2.2, 1.6, 2.2, c, 0, 3.2, 0);
      L(2.0, 0.6, 0.06, '#9fd3f5', 0, 3.5, 1.11);
      L(2.6, 0.2, 2.6, '#f4f4f0', 0, 4.1, 0);
      L(1.0, 0.1, 3, '#e8d8b8', 0, 1.2, 2.3, 0, 0.75);
      L(0.08, 2, 0.08, '#555', 1.1, 5.1, 1.1);
      L(0.7, 0.4, 0.04, '#e8262b', 1.45, 5.8, 1.1);
    };
    tower2(-53, -26, '#7fd0f0'); tower2(-53, 16, '#ffd23f'); tower2(-53, 38, '#ff9ab0');
    const umbrella = (x, z, c) => {
      B(0.12, 2.4, 0.12, '#ffffff', x, 1.2, z);
      B(2.6, 0.15, 2.6, c, x, 2.4, z); B(1.8, 0.2, 1.8, c, x, 2.55, z); B(0.9, 0.2, 0.9, '#ffffff', x, 2.7, z);
      B(1, 0.04, 2, w.pick(['#ffffff', '#ff5fb0', '#2f9df6']), x + 1.2, 0.1, z + 0.5);
    };
    for (const [x, z, c] of [[-49, -16, '#ff5f6e'], [-51, -8, '#2f9df6'], [-48.5, 8, '#ffd23f'], [-50, 26, '#2fbf6a'], [-48.5, 46, '#ff8a1f'], [-51, 52, '#b05fd0']]) umbrella(x, z, c);
    for (const zz of [-33, -27]) B(0.15, 2.4, 0.15, '#ffffff', -47, 1.2, zz);
    B(0.05, 0.9, 6, '#f4f4f0', -47, 2, -30);
    for (const [z, c] of [[30, '#ff5f6e'], [31, '#2f9df6'], [32, '#ffd23f']]) B(0.5, 2.2, 0.12, c, -46, 1.1, z, 0, 0, 0.15);
    B(1.4, 0.8, 1.4, '#e8c87a', -55, 0.4, -16); B(0.6, 0.8, 0.6, '#e8c87a', -55, 1.2, -16);
    // Pier mit Riesenrad
    K.solid(-79, 0.5, 0, 42, 3, 8, '#b08a5e', { safe: true });
    for (let x = -60; x >= -99; x -= 3.5) for (const s of [-1, 1]) B(0.4, 2.2, 0.4, '#6b4a2a', x, -1.2, s * 3.6);
    for (const s of [-1, 1]) { B(40, 0.1, 0.1, '#f4f4f0', -79, 1.6, s * 3.9); for (let x = -60; x >= -99; x -= 2) B(0.1, 1.1, 0.1, '#f4f4f0', x, 1.05, s * 3.9); }
    for (const s of [-1, 1]) B(0.6, 6, 0.6, '#f4f4f0', -59.5, 3.5, s * 4);
    B(0.6, 1.2, 8.6, '#f4f4f0', -59.5, 6.6, 0);
    w.sign('Sonnenstadt-Pier', -59.2, 8.2, 0, { bg: '#2f9df6', size: 1.1 });
    K.solid(-70, 3.5, 2.4, 3, 3, 2.4, '#ffd6e0', { studs: false });
    for (let i = 0; i < 6; i++) B(0.5, 0.1, 1.2, i % 2 ? '#ff5fb0' : '#ffffff', -71.25 + i * 0.5, 3.4, 0.9, 0, 0.35);
    w.sign('Eis', -70, 4.4, 0.6, { bg: '#ff5fb0', size: 0.7 });
    for (const x of [-64, -76, -96]) for (const s of [-1, 1]) { B(0.15, 3, 0.15, '#2d3440', x, 2, s * 3.6); glow(0.4, 0.4, 0.4, '#fff4c2', x, 3.6, s * 3.6); }
    const WX = -88, WY = 14.5, WR = 10;
    for (const s of [-1, 1]) for (const dz of [-1.6, 1.6]) B(0.5, WY + 0.5, 0.5, '#f4f4f0', WX + s * 3.5 * 0.5, WY / 2 + 0.5, dz, 0, 0, s * 0.25);
    B(0.6, 0.6, 3.6, '#c8ccd2', WX, WY, 0);
    const wheel = new THREE.Group();
    wheel.position.set(WX, WY, 0);
    const wb = boxList();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2, a2 = ((i + 0.5) / 24) * Math.PI * 2;
      wb(0.3, 0.35, 2.7, i % 2 ? '#ff5fb0' : '#ffd23f', 0, Math.cos(a2) * WR, Math.sin(a2) * WR, 0, -a2);
      wb(0.3, 0.25, 1.5, '#ffffff', 0, Math.cos(a2) * WR * 0.55, Math.sin(a2) * WR * 0.55, 0, -a2);
      if (i % 2 === 0) wb(0.12, WR, 0.12, '#ffffff', 0, Math.cos(a) * WR / 2, Math.sin(a) * WR / 2, 0, -a);
    }
    wheel.add(meshOf(wb));
    w.add(wheel);
    const NG = 12, gGeo = new THREE.BoxGeometry(1.4, 1.2, 1.4);
    const gond = new THREE.InstancedMesh(gGeo, new THREE.MeshLambertMaterial({ color: '#ffffff' }), NG);
    const gCols = ['#ff5f6e', '#ffd23f', '#2fbf6a', '#2f9df6', '#b05fd0', '#ff8a1f'];
    for (let i = 0; i < NG; i++) gond.setColorAt(i, new THREE.Color(gCols[i % gCols.length]));
    gond.castShadow = true;
    w.add(gond);
    const gm = new THREE.Matrix4();
    w.updaters.push((dt, t) => {
      const rot = t * 0.12;
      wheel.rotation.x = rot;
      for (let i = 0; i < NG; i++) {
        const a = rot + (i / NG) * Math.PI * 2;
        gm.makeTranslation(WX, WY + Math.cos(a) * WR - 0.9, Math.sin(a) * WR);
        gond.setMatrixAt(i, gm);
      }
      gond.instanceMatrix.needsUpdate = true;
    });
    gond.frustumCulled = false;
    w.coinLine(-62, 0, -84, 0, 6, 0.5);
    w.coinLine(-48, -30, -48, 40, 6);
    // Segelboote draußen
    const boat = (x, z, ry, c) => {
      const bb = at(B, x, z, ry, -0.8);
      bb(2.4, 0.9, 6, '#ffffff', 0, 0.3, 0);
      bb(2.5, 0.25, 6.1, c, 0, 0.75, 0);
      bb(0.15, 6, 0.15, '#c8ccd2', 0, 3.5, 0.8);
      bb(0.1, 4.5, 2.4, '#ffffff', 0, 3.6, -0.4);
    };
    boat(-92, 26, 0.4, '#2f9df6'); boat(-98, -24, -0.3, '#ff5f6e'); boat(-74, 44, 1.2, '#ffd23f');

    // ---------------- Villa mit Pool (Südosten) ----------------
    K.solid(23, 4, 37, 14, 4, 7, '#ffffff', { studs: false, safe: true });
    K.solid(25, 7.5, 36.5, 8, 3.5, 6, '#f4ece0', { studs: false, safe: true });
    B(13.6, 2.4, 0.1, '#9fd3f5', 23, 1.6, 40.55);
    B(7.6, 2.2, 0.1, '#9fd3f5', 25, 5.8, 39.55);
    B(14.6, 0.3, 7.6, '#d8c8b0', 23, 4.15, 37);
    w.water(23, 46, 9, 4, { top: 0.1, color: '#5fe0f0' });
    for (const [x, z, ww, dd] of [[23, 43.6, 10, 0.8], [23, 48.4, 10, 0.8], [18.1, 46, 0.8, 5.6], [27.9, 46, 0.8, 5.6]]) B(ww, 0.2, dd, '#f4efe6', x, 0.1, z);
    for (const x of [19, 22]) { B(0.8, 0.3, 2, '#ffffff', x, 0.35, 51); B(0.8, 0.5, 0.2, '#ffffff', x, 0.6, 50.1, 0, -0.5); }
    palm(30, 44, 11); palm(16, 50, 13);
    w.sign('Villa', 23, 9.8, 40, { bg: '#ff8a5a', size: 0.8 });

    // ---------------- Taxi-Tour (über Strandallee und Freeway) ----------------
    const taxiPts = roundedLoop([[14, 26], [-38, 26], [-38, -42], [-56, -42], [-56, FWY_Z], [56, FWY_Z], [56, -42], [38, -42], [38, 26]], 0.05, 4.5)
      .map(([x, y, z]) => [x, Math.abs(z - FWY_Z) < 0.01 ? fwyY(x) + 0.05 : y, z]);
    const taxiSt = w.station(18, 31.5, 'Taxi-Tour', '#e0a800');
    w.addRide(pathRide(w, {
      points: taxiPts, closed: true, duration: 34, vehicle: vehicle(taxiModel), seat: [0, 0.2, -0.6], name: 'Taxi-Tour', starId: 'taxi',
      station: taxiSt, exit: new THREE.Vector3(21.5, 0, 31.5), idle: 'loop',
    }));

    // ---------------- Stern 1: Feuertreppe am Hochhaus (Osten) ----------------
    w.enclosure({ x: 49, z: -24, w: 16, d: 22, side: 'w', h: 4.4, color: '#e8c8a8', label: 'Wolkenkratzer' });
    const TW = 48, D = -1; // Westwand des Hochhauses, Treppe nach Westen
    const roofY = 24.5;
    K.solid(52, roofY, -24, 8, roofY, 16, '#c8644a', { studs: false, safe: true });
    for (let y = 2; y < roofY - 1; y += 3) {
      B(0.1, 1.4, 14.8, '#9fd3f5', 56.04, y, -24);
      for (const s of [-1, 1]) B(6.8, 1.4, 0.1, '#9fd3f5', 52, y, -24 + s * 8.04);
      for (const z of [-31, -30, -18, -17]) B(0.1, 1.4, 0.8, '#9fd3f5', TW - 0.06, y, z);
    }
    for (let y = 3.3; y < roofY; y += 3) B(8.2, 0.25, 16.2, '#a84e38', 52, y, -24);
    const metal = '#3a3f47', rail = '#22262b';
    const laneA = TW + D * 0.7, laneB = TW + D * 2.1, landX = TW + D * 1.4, outer = TW + D * 2.85;
    const zS = -19.75, zN = -28.25;
    const railAt = (z, top, len) => { K.solid(outer, top + 1.1, z, 0.1, 1.1, len, rail, { hidden: true }); B(0.08, 0.08, len, rail, outer, top + 1.05, z); };
    let h = 3.0;
    const landing = (z, top, first) => {
      K.solid(landX, top, z, 2.8, 0.35, 1.5, metal, { studs: false });
      if (!first) railAt(z, top, 1.5);
      const endZ = z === zS ? -19.02 : -28.98;
      if (!first) { K.solid(landX, top + 1.1, endZ, 2.8, 1.1, 0.06, rail, { hidden: true }); B(2.8, 0.08, 0.08, rail, landX, top + 1.05, endZ); }
      for (const s of [-1, 1]) B(0.08, 1.1, 0.08, rail, outer, top + 0.55, z + s * 0.7);
    };
    landing(zS, h, true);
    w.coin(landX, h, zS);
    for (let k = 0; k < 6; k++) {
      const north = k % 2 === 0, lx = north ? laneA : laneB;
      for (let i = 1; i <= 7; i++) {
        const top = h + 0.5 * i, z = north ? -20.5 - (i - 0.5) : -27.5 + (i - 0.5);
        K.solid(lx, top, z, 1.4, 0.35, 1.0, metal, { studs: false });
        railAt(z, top, 1.0);
        B(0.08, 1.1, 0.08, rail, outer, top + 0.55, z);
      }
      h += 3.5;
      landing(north ? zN : zS, h, false);
      w.coin(landX, h, north ? zN : zS);
    }
    // Kisten zum ersten Absatz (die Leiter ist hochgeklappt)
    K.solid(43.6, 1.0, -16.4, 1.8, 1.0, 1.8, '#c49a6c', { safe: true });
    K.solid(46.6, 2.0, -17.6, 1.8, 2.0, 1.8, '#a0764e', { safe: true });
    for (const s of [-1, 1]) B(0.1, 3.4, 0.1, rail, outer, 4.9, zS + s * 0.6);
    for (let y = 3.6; y < 6.5; y += 0.5) B(0.08, 0.08, 1.2, rail, outer, y, zS);
    for (const [x, z, sx, sz] of [[52, -31.95, 8, 0.1], [52, -16.05, 8, 0.1], [55.95, -24, 0.1, 16], [48.05, -26.3, 0.1, 11.4], [48.05, -17.45, 0.1, 2.9]]) {
      K.solid(x, roofY + 1.1, z, sx, 1.1, sz, '#a84e38', { studs: false });
    }
    const deck = roofY + 3;
    K.solid(51, roofY + 1.2, -21.5, 2, 1.2, 2, '#b7bec6', { safe: true });
    B(1.6, 0.1, 1.6, '#5a616b', 51, roofY + 1.25, -21.5);
    K.solid(52.5, deck, -25.5, 3, 0.4, 3, '#6b4423', { safe: true });
    for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) B(0.25, 2.6, 0.25, '#6b4423', 52.5 + dx, roofY + 1.3, -25.5 + dz);
    w.star('skyscraper', 52.5, deck, -25.5, 'Wolkenkratzer');
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B(0.25, 3, 0.25, '#6b4423', 53.5 + dx, roofY + 1.5, -29.5 + dz);
    w.cyl(1.5, 1.5, 3, '#8a5e33', 53.5, roofY + 3, -29.5, { seg: 10 });
    w.cone(1.7, 1.2, '#5b3a1e', 53.5, roofY + 6, -29.5, { seg: 10 });
    B(0.2, 6, 0.2, '#c8ccd2', 50, roofY + 3, -30);
    glow(0.4, 0.4, 0.4, '#ff3b30', 50, roofY + 6, -30);
    w.sign('Feuertreppe', 44.2, 6.8, -16.4, { bg: '#c8644a', size: 0.8 });
    w.coin(46.6, 2.0, -17.6);

    // ---------------- Stern 2: Baustelle mit Kran ----------------
    w.enclosure({ x: 18, z: -24, w: 26, d: 22, side: 'w', h: 4.4, color: '#f2efe6', label: 'Baustelle', cap: '#ff8a1f' });
    for (let x = 6; x <= 30; x += 2) for (const z of [-12.55, -35.45]) B(1, 0.6, 0.06, '#e8262b', x, 2.2, z);
    B(26, 0.06, 22, '#c0a47c', 18, 0.04, -24);
    const beam = '#ff8a1f';
    const corners = [[10, -17], [25, -17], [25, -32], [10, -32]];
    const segs = [];
    for (let side = 0; side < 4; side++) {
      const [ax, az] = corners[side], [bx, bz] = corners[(side + 1) % 4];
      for (const t of [2.5, 7.5, 12.5]) segs.push([ax + (bx - ax) * t / 15, az + (bz - az) * t / 15, ax !== bx]);
    }
    [...segs, ...segs.slice(0, 5)].forEach(([x, z, alongX], n) => {
      const top = 1 + n;
      K.solid(x, top, z, alongX ? 3.5 : 1.2, 0.5, alongX ? 1.2 : 3.5, beam);
      B(alongX ? 3.5 : 0.3, 0.6, alongX ? 0.3 : 3.5, '#c4661a', x, top - 0.75, z);
      if (n % 2 === 1) w.coin(x, top, z);
    });
    for (const [x, z] of [[11.5, -18.5], [23.5, -18.5], [23.5, -30.5], [11.5, -30.5], [17.5, -18.5], [17.5, -30.5], [11.5, -24.5], [23.5, -24.5]]) B(0.5, 12.4, 0.5, '#8d939b', x, 6.2, z);
    for (const y of [4, 8, 12]) {
      for (const z of [-18.5, -30.5]) B(12.5, 0.4, 0.4, '#8d939b', 17.5, y, z);
      for (const x of [11.5, 23.5]) B(0.4, 0.4, 12.5, '#8d939b', x, y, -24.5);
    }
    K.solid(17.5, 9, -24.5, 6, 9, 6, '#d8d0c4', { studs: false });
    K.solid(17.5, 9.35, -24.5, 10, 0.35, 10, '#d8d0c4', { studs: false });
    K.solid(28.5, 17.6, -24.5, 2, 17.6, 2, '#ffd23f', { studs: false, hidden: true });
    for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) B(0.25, 17.6, 0.25, '#ffc31a', 28.5 + dx, 8.8, -24.5 + dz);
    for (let y = 1; y < 17.6; y += 1.6) {
      B(2, 0.18, 0.18, '#ffc31a', 28.5, y, -25.4, 0, 0, 0.6); B(2, 0.18, 0.18, '#ffc31a', 28.5, y, -23.6, 0, 0, -0.6);
      B(0.18, 0.18, 2, '#ffc31a', 27.6, y, -24.5, 0, 0.6); B(0.18, 0.18, 2, '#ffc31a', 29.4, y, -24.5, 0, -0.6);
    }
    K.solid(28.5, 18, -24.5, 3, 0.4, 3, '#ffd23f', { safe: true });
    K.solid(28.5, 18, -32.25, 1.4, 0.4, 12.5, '#ffd23f');
    for (const s of [-1, 1]) B(0.15, 0.15, 13, '#ffc31a', 28.5 + s * 0.6, 19.2, -32.5);
    for (let z = -26.5; z > -38.5; z -= 1.5) for (const s of [-1, 1]) B(0.12, 1.4, 0.12, '#ffc31a', 28.5 + s * 0.6, 18.6, z, 0, 0.5);
    B(1.4, 0.4, 7, '#ffd23f', 28.5, 18.6, -19);
    B(2, 2, 2, '#8d939b', 28.5, 17.6, -16.5);
    B(0.4, 4, 0.4, '#ffc31a', 28.5, 20.5, -24.5);
    B(1.8, 1.6, 1.8, '#ffd23f', 30.2, 16.6, -24.5);
    B(0.1, 0.9, 1.4, '#9fd3f5', 31.15, 16.8, -24.5);
    w.star('crane', 28.5, 18, -37.5, 'Baukran');
    w.sign('Baukran', 28.5, 21.6, -26, { bg: '#ff8a1f', size: 0.8 });
    const hook = boxList();
    hook(0.06, 9, 0.06, '#222222', 0, -4.5, 0);
    hook(0.5, 0.5, 0.3, '#3a3f47', 0, -9.1, 0);
    hook(4, 0.4, 0.5, '#e8262b', 0, -9.6, 0);
    const hookMesh = meshOf(hook);
    hookMesh.position.set(28.5, 17.6, -31);
    w.add(hookMesh);
    w.updaters.push((dt, t) => { hookMesh.rotation.x = Math.sin(t * 0.8) * 0.06; hookMesh.rotation.y = t * 0.15; });
    for (const [x, z, c] of [[8, -33, '#a0764e'], [8.5, -15, '#8d939b'], [14, -14.5, '#c49a6c']]) B(2, 1, 1.6, c, x, 0.5, z);
    for (let i = 0; i < 4; i++) B(0.4, 0.4, 5, '#8d939b', 21 + i * 0.45, 0.2 + (i % 2) * 0.4, -14.6, Math.PI / 2);
    B(1.6, 1.6, 2.6, '#ffd23f', 7.5, 0.8, -28);
    B(1.6, 0.8, 1, '#3a3f47', 7.5, 1.6, -27);

    // ---------------- Hubschrauber-Landeplatz ----------------
    K.solid(50, 0.3, 44, 9, 0.3, 9, '#5a616b', { studs: false, safe: true });
    for (const [ww, dd, x, z] of [[0.6, 3.6, 48.8, 44], [0.6, 3.6, 51.2, 44], [2.4, 0.6, 50, 44]]) B(ww, 0.06, dd, '#ffffff', x, 0.33, z);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; B(0.9, 0.06, 0.3, '#ffd23f', 50 + Math.cos(a) * 3.6, 0.33, 44 + Math.sin(a) * 3.6, -a + Math.PI / 2); }
    const heliSt = w.station(42, 35, 'Hubschrauber', '#e8262b');
    const heli = vehicle(heliBody);
    const rotor = boxList();
    rotorModel(rotor);
    const rotorMesh = meshOf(rotor);
    rotorMesh.position.set(0, 3.95, -1.45);
    heli.add(rotorMesh);
    const tail = boxList();
    tail(0.06, 1.6, 0.25, '#2b2f36', 0, 0, 0);
    tail(0.06, 0.25, 1.6, '#2b2f36', 0, 0, 0);
    const tailMesh = meshOf(tail);
    tailMesh.position.set(0.15, 2.8, -6.0);
    heli.add(tailMesh);
    w.addRide(pathRide(w, {
      points: [[50, 0.3, 44], [50, 6, 39], [46, 22, 26], [36, 40, 4], [26, 42, -40], [22, 44, -66], [0, 46, -94], [-24, 44, -68], [-50, 36, -34],
        [-80, 28, -8], [-82, 28, 16], [-56, 30, 30], [-28, 28, 46], [0, 26, 56], [24, 20, 58], [42, 10, 56], [49, 3, 49]],
      closed: true, duration: 36, vehicle: heli, seat: [0, 0.25, 0.4], name: 'Hubschrauber-Rundflug', starId: 'heli',
      station: heliSt, exit: new THREE.Vector3(42, 0, 39), idle: 'wait', flat: true,
      animate(v, t, riding) { rotorMesh.rotation.y = t * (riding ? 18 : 5); tailMesh.rotation.x = t * 25; },
      camera(pos, fwd, out) {
        const f = new THREE.Vector3(fwd.x, 0, fwd.z).normalize();
        out.pos.copy(pos).addScaledVector(f, -11).add(new THREE.Vector3(0, 5.5, 0));
        out.look.copy(pos).addScaledVector(f, 6).add(new THREE.Vector3(0, -0.5, 0));
      },
    }));
    w.sign('Rundflug', 50, 6, 49.5, { bg: '#e8262b', size: 0.8 });

    // ---------------- Fahrbare Autos und Aufträge ----------------
    // Parkreihe auf der Straße vor der Plaza: einsteigen (Taxi, Polizei, Pizza gratis; Sportwagen und Monstertruck kosten Münzen)
    for (const [x, kind] of [[-30, 'police'], [-16, 'taxi'], [16, 'pizza'], [30, 'sport']]) w.car({ x, z: 26.2, kind, ry: Math.PI / 2 });
    w.sign('Autos: einsteigen und Aufträge erledigen!', 0, 5.2, 21.2, { bg: '#ffc531', fg: '#17233b', size: 0.8 });
    w.star('driver', 0, 16, 26, 'Profi-Fahrer');
    w.mission({ type: 'taxi', label: 'Taxi zum Strand', start: [-36, 12], time: 60, reward: 35,
      stages: [{ at: [0, -8], text: 'Hol den Fahrgast an der Kreuzung ab', person: true }, { at: [-52, -40], text: 'Bring ihn zum Strand' }] });
    w.mission({ type: 'pizza', label: 'Pizza-Blitz', start: [36, 12], time: 55, reward: 35,
      stages: [{ at: [-36, -8], text: 'Liefere die Pizza in den Westen' }, { at: [36, -40], text: 'Noch eine Pizza in den Norden' }] });
    w.mission({ type: 'race', label: 'Freeway-Rennen', start: [36, -26], time: 60, reward: 50,
      stages: [{ at: [56, -48], text: 'Hoch auf den Freeway!' }, { at: [0, -50], text: 'Über die Hochstraße' }, { at: [-56, -48], text: 'Runter von der Rampe' }, { at: [-36, 24], text: 'Ziel: Strandallee' }] });
    w.mission({ type: 'police', label: 'Raser stoppen', start: [0, 12], time: 60, reward: 45, speed: 12,
      path: [[-36, -40], [0, -40], [36, -40], [36, -8], [36, 24], [0, 24], [-36, 24], [-36, -8]] });

    // ---------------- Tiere ----------------
    const pigeon = ['#9aa1ab', '#7d8590', '#5f6670'], gull = ['#ffffff', '#e6e8ea', '#9aa1ab'];
    w.animal('bird', { pos: new THREE.Vector3(-5, 0, 33), behavior: 'walk', radius: 2.5, speed: 0.8, colors: pigeon, hungry: true });
    w.animal('bird', { pos: new THREE.Vector3(5, 0, 36), behavior: 'walk', radius: 3, speed: 0.8, colors: pigeon });
    w.animal('bird', { pos: new THREE.Vector3(-16, 0, -18), behavior: 'walk', radius: 3, speed: 0.8, colors: pigeon });
    w.animal('bird', { pos: new THREE.Vector3(-21, 6.5, 15), behavior: 'perch', colors: pigeon });
    for (let i = 0; i < 3; i++) w.animal('bird', { pos: new THREE.Vector3(-58, 0, i * 20 - 20), y: 8 + i * 3, behavior: 'fly', radius: 10 + i * 3, speed: 5, colors: gull });
    w.animal('bird', { pos: new THREE.Vector3(-50, 0, 2), behavior: 'walk', radius: 3, speed: 0.8, colors: gull });
    w.animal('dog', { pos: new THREE.Vector3(-47, 0, 20), radius: 4, speed: 2.4, hungry: true });
    w.animal('dog', { pos: new THREE.Vector3(-26, 0, -30), radius: 4, speed: 2.2, hungry: true });
    w.animal('cat', { pos: new THREE.Vector3(-74, 0.5, -2), radius: 2, speed: 0.6, color: '#f08a1f', hungry: true });
    w.animal('cat', { pos: new THREE.Vector3(-18, 0, 10), radius: 3, speed: 0.8, color: '#3a3a3a' });
    w.animal('cat', { pos: new THREE.Vector3(9, 0.5, 40), behavior: 'perch', color: '#ffffff' });
    for (const [x, z] of [[-76, 22], [-80, -26]]) w.animal('dolphin', { pos: new THREE.Vector3(x, -0.8, z), y: -0.8, behavior: 'jump', radius: 8 });

    w.coinLine(0, 18, 0, -4, 5);
    w.coinLine(-30, 36, -30, 48, 3);
    w.coinLine(44, 12, 54, 12, 3);

    w.add(meshOf(glow, 'basic'));
    K.flush();
  },
};
