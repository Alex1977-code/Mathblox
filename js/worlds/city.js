// Großstadt: Straßenraster mit Ampeln und Zebrastreifen, Wolkenkratzer, Läden, Park, Hafen.
// Sterne: Feuertreppe am Hochhaus, Taxi-Tour, Hubschrauber-Rundflug, Baukran.
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';
import { pathRide } from '../rides.js';
import { Kit, boxList, meshOf, roundedLoop, loopMovers } from './city-kit.js';
import { at, carModel, busModel, vanModel, taxiModel, policeCarModel, fireTruckModel, heliBody, rotorModel } from './city-models.js';

const ASPHALT = '#3f444c', LINE = '#f4f4f0', YELLOW = '#ffd23f', WALK = '#c9ccd0';
const ROAD_X = [-36, 0, 36], ROAD_Z = [-40, -8, 24];

function vehicle(model, ...args) {
  const b = boxList();
  model(b, ...args);
  const g = new THREE.Group();
  g.add(meshOf(b));
  return g;
}

export const city = {
  id: 'city',
  name: 'Großstadt',
  seed: 101,
  theme: { sky: ['#3f86d6', '#9fcbf0', '#eef6ff'], fog: '#d6e6f5', sea: '#2f78b8', fogNear: 100, fogFar: 260 },
  stars: { skyscraper: 'Wolkenkratzer', taxi: 'Taxi-Tour', heli: 'Hubschrauber-Rundflug', crane: 'Baukran' },
  build(w) {
    const K = new Kit(w);
    const B = w.box.bind(w);
    w.island(116, WALK, '#9aa1a8');
    exitPortal(w, 53, 'hub');

    // ---------------- Straßen ----------------
    const road = (x1, z1, x2, z2) => B(Math.abs(x2 - x1) || 8, 0.06, Math.abs(z2 - z1) || 8, ASPHALT, (x1 + x2) / 2, 0.03, (z1 + z2) / 2);
    for (const z of ROAD_Z) road(-40, z, 40, z);
    for (const x of ROAD_X) road(x, -44, x, 28);
    const nearX = (v) => ROAD_X.some((x) => Math.abs(v - x) < 7.5);
    const nearZ = (v) => ROAD_Z.some((z) => Math.abs(v - z) < 7.5);
    // Mittellinien (gestrichelt) – nicht auf Kreuzungen
    for (const z of ROAD_Z) for (let x = -38; x <= 38; x += 3.5) if (!nearX(x)) B(1.8, 0.07, 0.22, YELLOW, x, 0.04, z);
    for (const x of ROAD_X) for (let z = -42; z <= 26; z += 3.5) if (!nearZ(z)) B(0.22, 0.07, 1.8, YELLOW, x, 0.04, z);
    // Bordsteinkanten
    for (const z of ROAD_Z) for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
      const xa = [-40, -32, 4, 40][i], xb = [-40, -4, 32, 40][i];
      if (xa === xb) continue;
      B(xb - xa, 0.12, 0.3, '#e6e8ea', (xa + xb) / 2, 0.06, z + s * 4.15);
    }
    for (const x of ROAD_X) for (const s of [-1, 1]) for (const [za, zb] of [[-36, -12], [-4, 20]]) B(0.3, 0.12, zb - za, '#e6e8ea', x + s * 4.15, 0.06, (za + zb) / 2);
    // Zebrastreifen an jeder Kreuzung + Ampeln
    const glow = boxList();
    for (const X of ROAD_X) for (const Z of ROAD_Z) {
      for (const s of [-1, 1]) {
        for (let k = -3; k <= 3; k++) {
          B(2, 0.07, 0.55, LINE, X + s * 5.6, 0.045, Z + k * 1.1);
          B(0.55, 0.07, 2, LINE, X + k * 1.1, 0.045, Z + s * 5.6);
        }
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
    // Innenstadt west (Block C) und ost (Block D)
    tower(-24, 3, 10, 9, 30, { wall: '#d9dee6', glass: '#7fbde8', ac: true });
    tower(-11, 3, 9, 9, 33, { wall: '#c4ccd8', glass: '#6fb3e6', top: [6.5, 6.5, 9], antenna: 6 });
    tower(11, 3, 9, 9, 36, { wall: '#f0e6d6', glass: '#86c6ee', top: [7, 7, 6, 0, 0], top2: [4, 4, 4], antenna: 4 });
    tower(24, 3, 10, 9, 24, { wall: '#cfe0d6', glass: '#7fd0c0', ac: true });
    // Osten
    tower(49.5, -30, 12, 9, 34, { wall: '#3d4a5c', glass: '#9fd3f5', trim: '#28313d', antenna: 5 });
    tower(49.5, -17.5, 12, 8, 20, { wall: '#e8d8c4', glass: '#7fbde8', ac: true });
    // Süden: Wohnturm, Hotel
    tower(-49, 43, 12, 12, 26, { wall: '#f2d6c2', glass: '#8cc8f0', top: [8, 8, 6] });
    tower(24, 44, 12, 9, 20, { wall: '#ffffff', glass: '#6fb3e6', ac: true });
    w.sign('Hotel', 24, 22.5, 49, { bg: '#2f5fd6', size: 1.2 });

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
      w.sign(label, x, 3.8, zf + 0.5, { bg: awn, size: 0.6 });
    };
    shop(-27, 15, 5.4, 5, '#f2c6a0', '#e8262b', 'Bäckerei');
    shop(-21, 15, 5.4, 6.5, '#cfe3f2', '#2f7df6', 'Spielzeug');
    shop(-15, 15, 5.4, 5, '#f7e6a8', '#2fbf4a', 'Gemüse');
    shop(-9, 15, 5.4, 6, '#e6d0f0', '#b05fd0', 'Bücher');
    shop(9, 15, 5.4, 6, '#ffd6e0', '#ff5fb0', 'Eiscafé');
    shop(15, 15, 5.4, 5, '#d8f0d0', '#ff8a1f', 'Blumen');
    shop(21, 15, 5.4, 6.5, '#f0e0c8', '#7a4a2a', 'Pizza');
    shop(27, 15, 5.4, 5, '#d0e4f7', '#1fb5c9', 'Fahrräder');
    // Eiswagen / Obststand vor den Läden
    B(1.2, 0.9, 0.8, '#ff9f1a', -15, 0.45, 19.4);
    B(1.2, 0.2, 0.8, '#ff3b30', -15, 0.95, 19.4);

    // ---------------- Polizei und Feuerwehr ----------------
    K.solid(-49.5, 8, 6, 14, 8, 12, '#eef2f7', { studs: false, safe: true });
    B(14.1, 0.8, 12.1, '#1f5fd6', -49.5, 2.9, 6);
    B(14.4, 0.4, 12.4, '#c8ccd2', -49.5, 8.2, 6);
    for (let z = 1.5; z <= 10.5; z += 3) B(0.1, 1.3, 1.6, '#9fd3f5', -42.45, 5.4, z);
    B(0.12, 2.3, 2.2, '#4d6b88', -42.44, 1.15, 6);
    glow(0.8, 0.4, 0.8, '#3b8cff', -49.5, 8.6, 6);
    w.sign('Polizei', -42, 9.7, 6, { bg: '#1f5fd6', size: 1.2 });
    policeCarModel(at(B, -44.5, 16, Math.PI / 2));
    // Feuerwehrwache mit drei Toren und Schlauchturm (Tore nach Norden)
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

    // ---------------- Tankstelle ----------------
    for (const [x, z] of [[44, 2], [54, 2], [44, 10], [54, 10]]) K.solid(x, 4.6, z, 0.6, 4.6, 0.6, '#e6e8ea', { studs: false });
    B(13, 0.6, 10, '#ffffff', 49, 4.9, 6);
    B(13.1, 0.3, 10.1, '#2fbf4a', 49, 4.65, 6);
    for (const z of [3.5, 8.5]) {
      K.solid(49, 0.3, z, 7, 0.3, 1.4, '#c8ccd2', { studs: false });
      for (const x of [46.5, 51.5]) {
        K.solid(x, 2.1, z, 0.9, 1.8, 0.7, '#2fbf4a', { studs: false });
        B(0.7, 0.5, 0.72, '#1d2430', x, 1.6, z);
        B(0.2, 0.6, 0.2, '#222', x + 0.5, 1.3, z);
      }
    }
    K.solid(50, 4, 16.5, 12, 4, 5, '#f4f1ea', { studs: false, safe: true });
    B(9, 2, 0.1, '#9fd3f5', 49, 1.6, 13.96);
    B(12.2, 0.6, 5.2, '#2fbf4a', 50, 4.1, 16.5);
    w.sign('Tankstelle', 49, 6.6, 6, { bg: '#2fbf4a', size: 1.1 });
    B(0.3, 5, 0.3, '#5a616b', 41.5, 2.5, -2);
    B(2.2, 2.6, 0.3, '#2fbf4a', 41.5, 5.6, -2);
    for (let i = 0; i < 3; i++) B(1.6, 0.4, 0.32, '#ffffff', 41.5, 6.4 - i * 0.7, -2);
    carModel(at(B, 46.5, 6, 0), '#ff8a1f');

    // ---------------- Park mit Brunnen und Ententeich ----------------
    B(28, 0.08, 24, '#6cc24a', -18, 0.04, -24);
    w.path(-32, -24, -4, -24, 2.4, '#e2d5b5');
    w.path(-18, -36, -18, -12, 2.4, '#e2d5b5');
    for (const [x, z, ww, dd] of [[-18, -27.6, 7.8, 0.8], [-18, -20.4, 7.8, 0.8], [-21.6, -24, 0.8, 6.4], [-14.4, -24, 0.8, 6.4]]) K.solid(x, 0.6, z, ww, 0.6, dd, '#b9c3cf', { studs: false, safe: true });
    w.water(-18, -24, 6.4, 6.4, { top: 0.45, color: '#5cc8ff' });
    K.solid(-18, 2.4, -24, 1, 2.4, 1, '#b9c3cf', { studs: false });
    B(2.6, 0.3, 2.6, '#b9c3cf', -18, 2.5, -24);
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
    // Spielplatz: Rutsche und Schaukel
    B(0.2, 3, 0.2, '#ff5fb0', -28, 1.5, -33); B(0.2, 3, 0.2, '#ff5fb0', -28, 1.5, -31);
    B(1.2, 0.2, 2.4, '#ffd23f', -28, 2.4, -32);
    B(1.1, 0.12, 4, '#2f7df6', -28, 1.3, -29.2, 0, -0.55);
    for (const s of [-1, 1]) B(0.2, 3.2, 0.2, '#e8262b', -22 + s * 1.6, 1.6, -34);
    B(3.6, 0.2, 0.2, '#e8262b', -22, 3.2, -34);
    for (const s of [-1, 1]) { B(0.05, 2.2, 0.05, '#555', -22 + s * 0.8, 2.0, -34); B(0.7, 0.1, 0.35, '#ffd23f', -22 + s * 0.8, 0.9, -34); }
    w.flowers(-27, -14.5, 6, 2.5, 25, ['#ff595e', '#ffd23f', '#ffffff', '#b07bff']);
    w.flowers(-9, -14.5, 6, 2.5, 25, ['#ff5fb0', '#ffd23f', '#ffffff']);
    for (const [x, z, k] of [[-30, -14, 'oak'], [-30, -20, 'blossom'], [-6, -14, 'oak'], [-6, -20, 'blossom'], [-12, -35, 'oak'], [-30, -27, 'oak'], [-25, -35, 'birch'], [-6, -25, 'birch'], [-14, -14, 'blossom']]) w.tree(k, x, z, 0.9);
    w.sign('Stadtpark', -18, 3.2, -11.6, { bg: '#2fbf4a', size: 0.9 });

    // ---------------- Plaza am Portal ----------------
    B(24, 0.06, 28, '#e3dccd', 0, 0.035, 43);
    for (let i = 0; i < 6; i++) B(24, 0.07, 0.25, '#cbbfa6', 0, 0.04, 31 + i * 4.5);
    for (const s of [-1, 1]) {
      K.solid(s * 9, 0.5, 40, 4, 0.5, 4, '#9aa3ad', { studs: false });
      B(3.6, 0.1, 3.6, '#6cc24a', s * 9, 0.52, 40);
      w.flowers(s * 9, 40, 3.2, 3.2, 14, ['#ff595e', '#ffd23f', '#ffffff', '#ff5fb0']);
      w.tree('blossom', s * 9, 48, 0.9);
      const bb = at(B, s * 6.5, 44, -s * Math.PI / 2);
      bb(2.4, 0.15, 0.7, '#a0764e', 0, 0.6, 0);
      bb(2.4, 0.6, 0.12, '#a0764e', 0, 1.0, -0.35);
    }
    w.coinRing(0, 0, 40, 4.5, 6);
    // Taxistand
    const taxiPts = roundedLoop([[10, 26], [-38, 26], [-38, -6], [-2, -6], [-2, -42], [38, -42], [38, 26]], 0.05, 4.5);
    const taxiSt = w.station(14, 31.5, 'Taxi-Tour', '#e0a800');
    const taxi = vehicle(taxiModel);
    w.addRide(pathRide(w, {
      points: taxiPts, closed: true, duration: 28, vehicle: taxi, seat: [0, 0.2, -0.6], name: 'Taxi-Tour', starId: 'taxi',
      station: taxiSt, exit: new THREE.Vector3(17.5, 0, 31.5), idle: 'loop', flat: true,
    }));

    // ---------------- Laternen, Bäume, parkende Autos ----------------
    for (const z of [-30, -18, 0, 8]) for (const s of [-1, 1]) w.lamp(s * 4.8, z);
    for (const x of [-26, -14, 14, 26]) { w.lamp(x, 20.4); w.lamp(x, -11.6); }
    for (const x of [-20, 16]) w.lamp(x, 27.6);
    for (const [x, z] of [[-5.2, -2], [5.2, -2], [-5.2, 11], [5.2, 11], [-40.8, -8], [40.8, 28.5]]) w.tree('oak', x, z, 0.75);
    const parked = [['#2f7df6', 3, -16, 0], ['#ff595e', 3, -31, Math.PI], ['#ffffff', 10, -11.2, Math.PI / 2], ['#8ac926', 22, -11.2, Math.PI / 2], ['#b07bff', 16, -4.8, -Math.PI / 2], ['#ffd23f', 26, -4.8, -Math.PI / 2]];
    for (const [c, x, z, ry] of parked) carModel(at(B, x, z, ry), c);

    // ---------------- Fahrende Autos (Deko) ----------------
    const cars = [vehicle(carModel, '#e8262b'), vehicle(busModel, '#2f7df6'), vehicle(carModel, '#ffffff'), vehicle(vanModel, '#ff8a1f'), vehicle(carModel, '#2fbf4a')];
    cars.forEach((c) => w.add(c));
    w.updaters.push(loopMovers(roundedLoop([[-34, 22], [34, 22], [34, -38], [-34, -38]], 0.05, 4.5), cars, 8));

    // ---------------- Stern 1: Feuertreppe am Hochhaus ----------------
    w.enclosure({ x: -49, z: -24, w: 16, d: 22, side: 'e', h: 4.4, color: '#c9b49a', label: 'Wolkenkratzer', cap: '#9a8670' });
    const TW = -48; // Ostwand des Hochhauses
    const roofY = 24.5;
    K.solid(-52, roofY, -24, 8, roofY, 16, '#b5523b', { studs: false, safe: true });
    for (let y = 2; y < roofY - 1; y += 3) {
      B(0.1, 1.4, 14.8, '#9fd3f5', -55.96 - 0.08, y, -24);
      for (const s of [-1, 1]) B(6.8, 1.4, 0.1, '#9fd3f5', -52, y, -24 + s * 8.04);
      for (const z of [-31, -30, -18, -17]) B(0.1, 1.4, 0.8, '#9fd3f5', TW + 0.06, y, z);
    }
    for (let y = 3.3; y < roofY; y += 3) B(8.2, 0.25, 16.2, '#9c4230', -52, y, -24);
    // Treppe: Spur A (an der Wand) Süd→Nord, Spur B (außen) Nord→Süd
    const metal = '#3a3f47', rail = '#22262b';
    const laneA = TW + 0.7, laneB = TW + 2.1, landX = TW + 1.4, outer = TW + 2.85;
    const zS = -19.75, zN = -28.25;
    const railAt = (z, top, len) => { K.solid(outer, top + 1.1, z, 0.1, 1.1, len, rail, { hidden: true }); B(0.08, 0.08, len, rail, outer, top + 1.05, z); };
    let h = 3.0;
    const landing = (z, top, first) => {
      K.solid(landX, top, z, 2.8, 0.35, 1.5, metal, { studs: false });
      if (!first) railAt(z, top, 1.5);
      const endZ = z === zS ? -19.02 : -28.98;
      K.solid(landX, top + 1.1, endZ, 2.8, 1.1, 0.06, rail, { hidden: true });
      B(2.8, 0.08, 0.08, rail, landX, top + 1.05, endZ);
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
    // Leiter-Kisten zum ersten Absatz (die Leiter ist hochgeklappt)
    K.solid(-43.8, 1.0, -17.6, 1.8, 1.0, 1.8, '#c49a6c', { safe: true });
    K.solid(-43.8, 2.0, -19.75, 1.8, 2.0, 1.8, '#a0764e', { safe: true });
    B(0.1, 3, 0.6, rail, outer - 0.1, 4.6, zS, 0, 0, 0);
    // Dach: Brüstung, Klimagerät, Aussichtsdeck mit Stern, Wassertank
    for (const [x, z, sx, sz] of [[-52, -31.95, 8, 0.1], [-52, -16.05, 8, 0.1], [-55.95, -24, 0.1, 16], [-48.05, -25.25, 0.1, 13.5]]) {
      K.solid(x, roofY + 1.1, z, sx, 1.1, sz, '#9c4230', { studs: false });
    }
    K.solid(-51, roofY + 1, -21.5, 2, 1, 2, '#b7bec6', { safe: true });
    K.solid(-52.5, roofY + 2, -25.5, 3, 0.4, 3, '#6b4423', { safe: true });
    for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) B(0.25, 1.6, 0.25, '#6b4423', -52.5 + dx, roofY + 0.8, -25.5 + dz);
    w.star('skyscraper', -52.5, roofY + 2, -25.5, 'Wolkenkratzer');
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B(0.25, 3, 0.25, '#6b4423', -53.5 + dx, roofY + 1.5, -29.5 + dz);
    w.cyl(1.5, 1.5, 3, '#8a5e33', -53.5, roofY + 3, -29.5, { seg: 10 });
    w.cone(1.7, 1.2, '#5b3a1e', -53.5, roofY + 6, -29.5, { seg: 10 });
    B(0.2, 6, 0.2, '#c8ccd2', -50, roofY + 3, -30);
    glow(0.4, 0.4, 0.4, '#ff3b30', -50, roofY + 6, -30);
    w.sign('Feuertreppe', -44.2, 6.8, -16.4, { bg: '#b5523b', size: 0.8 });
    w.coin(-43.8, 2.0, -19.75);

    // ---------------- Stern 2: Baustelle mit Kran ----------------
    w.enclosure({ x: 18, z: -24, w: 26, d: 22, side: 'w', h: 4.4, color: '#f2efe6', label: 'Baustelle', cap: '#ff8a1f' });
    for (let x = 6; x <= 30; x += 2) for (const z of [-12.55, -35.45]) B(1, 0.6, 0.06, '#e8262b', x, 2.2, z);
    B(26, 0.06, 22, '#b0946c', 18, 0.04, -24);
    const beam = '#ff8a1f';
    const corners = [[10, -17], [25, -17], [25, -32], [10, -32]];
    const segs = [];
    for (let side = 0; side < 4; side++) {
      const [ax, az] = corners[side], [bx, bz] = corners[(side + 1) % 4];
      for (const t of [2.5, 7.5, 12.5]) segs.push([ax + (bx - ax) * t / 15, az + (bz - az) * t / 15, ax !== bx]);
    }
    const path = [...segs, ...segs.slice(0, 5)];
    path.forEach(([x, z, alongX], n) => {
      const top = 1 + n;
      K.solid(x, top, z, alongX ? 3.5 : 1.2, 0.5, alongX ? 1.2 : 3.5, beam);
      B(alongX ? 3.5 : 0.3, 0.6, alongX ? 0.3 : 3.5, '#c4661a', x, top - 0.75, z);
      if (n % 2 === 1) w.coin(x, top, z);
    });
    // Stahlskelett (Deko) und Betonkern
    for (const [x, z] of [[11.5, -18.5], [23.5, -18.5], [23.5, -30.5], [11.5, -30.5], [17.5, -18.5], [17.5, -30.5], [11.5, -24.5], [23.5, -24.5]]) B(0.5, 14, 0.5, '#8d939b', x, 7, z);
    for (const y of [4.5, 9, 13.5]) {
      for (const z of [-18.5, -30.5]) B(12.5, 0.4, 0.4, '#8d939b', 17.5, y, z);
      for (const x of [11.5, 23.5]) B(0.4, 0.4, 12.5, '#8d939b', x, y, -24.5);
    }
    K.solid(17.5, 9, -24.5, 6, 9, 6, '#c8c4bc', { studs: false });
    K.solid(17.5, 9.35, -24.5, 10, 0.35, 10, '#c8c4bc', { studs: false });
    // Kran: Turm, Ausleger nach Norden über die Straße, Gegengewicht im Süden
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
    // schwingende Last am Haken
    const hook = boxList();
    hook(0.06, 9, 0.06, '#222222', 0, -4.5, 0);
    hook(0.5, 0.5, 0.3, '#3a3f47', 0, -9.1, 0);
    hook(4, 0.4, 0.5, '#e8262b', 0, -9.6, 0);
    const hookMesh = meshOf(hook);
    hookMesh.position.set(28.5, 17.6, -31);
    w.add(hookMesh);
    w.updaters.push((dt, t) => { hookMesh.rotation.x = Math.sin(t * 0.8) * 0.06; hookMesh.rotation.y = t * 0.15; });
    // Baumaterial
    for (const [x, z, c] of [[8, -33, '#a0764e'], [8.5, -15, '#8d939b'], [14, -14.5, '#c49a6c']]) B(2, 1, 1.6, c, x, 0.5, z);
    for (let i = 0; i < 4; i++) B(0.4, 0.4, 5, '#8d939b', 21 + i * 0.45, 0.2 + (i % 2) * 0.4, -14.6, Math.PI / 2);
    B(1.6, 1.6, 2.6, '#ffd23f', 7.5, 0.8, -28);
    B(1.6, 0.8, 1, '#3a3f47', 7.5, 1.6, -27);

    // ---------------- Hafen ----------------
    // Kaimauer
    for (const [x, z, ww, dd] of [[0, -61, 126, 4]]) B(ww, 0.3, dd, '#8d939b', x, -0.05, z);
    K.solid(20, 0.3, -73.5, 4, 2.6, 21, '#a0764e', { safe: true });
    for (let z = -64; z >= -83; z -= 3) for (const s of [-1, 1]) B(0.4, 2.2, 0.4, '#5b3a1e', 20 + s * 2, -0.9, z);
    K.solid(20, 0.3, -87, 7, 2.6, 7, '#8d939b', { safe: true });
    for (let i = 0; i < 5; i++) B(2.4 - i * 0.12, 2, 2.4 - i * 0.12, i % 2 ? '#ffffff' : '#e8262b', 20, 1.3 + i * 2, -88);
    K.solid(20, 10.3, -88, 2.4, 10, 2.4, '#ffffff', { hidden: true });
    B(2.6, 1.4, 2.6, '#fff3a0', 20, 11, -88);
    B(3, 0.4, 3, '#e8262b', 20, 11.9, -88);
    w.coinLine(20, -66, 20, -82, 5);
    // Boote am Steg
    const boat = (x, z, ry, c, sail) => {
      const bb = at(B, x, z, ry, -0.8);
      bb(2.4, 0.9, 6, '#ffffff', 0, 0.3, 0);
      bb(2.5, 0.25, 6.1, c, 0, 0.75, 0);
      bb(1.6, 1, 2, '#ffffff', 0, 1.3, -0.6);
      bb(1.62, 0.4, 1.6, '#9fd3f5', 0, 1.4, -0.6);
      if (sail) { bb(0.15, 6, 0.15, '#c8ccd2', 0, 3.5, 0.8); bb(0.1, 4.5, 2.4, '#ffffff', 0, 3.6, -0.4); }
    };
    boat(14.5, -70, 0, '#2f7df6', true);
    boat(25.5, -76, 0, '#e8262b', false);
    boat(14.5, -80, 0, '#2fbf4a', false);
    boat(-30, -70, 0.3, '#ffd23f', true);
    // Fähre fährt draußen im Kreis
    const ferry = boxList();
    ferry(4, 1.6, 12, '#ffffff', 0, 0.3, 0);
    ferry(4.1, 0.4, 12.1, '#2f5fd6', 0, 1.2, 0);
    ferry(3.4, 1.8, 6, '#ffffff', 0, 2.3, -1);
    ferry(3.45, 0.6, 5.6, '#9fd3f5', 0, 2.5, -1);
    ferry(1, 1.6, 1, '#e8262b', 0, 4, -2.5);
    const ferryMesh = meshOf(ferry);
    w.add(ferryMesh);
    w.updaters.push((dt, t) => {
      const a = t * 0.05;
      ferryMesh.position.set(Math.cos(a) * 30 - 14, -0.8, -100 + Math.sin(a) * 10);
      ferryMesh.rotation.y = Math.atan2(-Math.sin(a) * 30, Math.cos(a) * 10);
    });
    // Container (man kann darauf klettern)
    const cc = ['#e8262b', '#2f7df6', '#2fbf4a', '#ff8a1f', '#b05fd0', '#1fb5c9'];
    const contain = (x, top, z, c) => {
      K.solid(x, top, z, 6, 2.6, 2.6, c, { studs: false, safe: true });
      for (let u = -2.6; u <= 2.6; u += 0.65) for (const s of [-1, 1]) B(0.12, 2.3, 0.08, '#' + new THREE.Color(c).multiplyScalar(0.75).getHexString(), x + u, top - 1.3, z + s * 1.32);
    };
    contain(-50, 2.6, -55, cc[0]); contain(-50, 2.6, -51.6, cc[1]); contain(-43, 2.6, -55, cc[2]);
    contain(-50, 5.2, -55, cc[3]); contain(-43, 2.6, -51.6, cc[4]); contain(-36, 2.6, -55, cc[5]);
    K.solid(-38, 1.0, -50, 1.8, 1.0, 1.8, '#c49a6c', { safe: true });
    K.solid(-45, 3.8, -55, 1.6, 1.2, 1.6, '#c49a6c', { safe: true });
    w.coin(-36, 2.6, -55); w.coin(-43, 2.6, -51.6); w.coin(-50, 5.2, -55);
    // Hafenkran (Portalkran)
    for (const [dx, dz] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) B(0.6, 12, 0.6, '#2f7df6', -18 + dx, 6, -56 + dz);
    B(7, 1.2, 1.2, '#2f7df6', -18, 12.5, -54);
    B(7, 1.2, 1.2, '#2f7df6', -18, 12.5, -58);
    B(1.4, 1.2, 14, '#2f7df6', -18, 13.3, -60);
    B(2, 1.8, 2, '#ffd23f', -18, 11.6, -60);
    B(0.06, 6, 0.06, '#222', -18, 7.7, -64);
    B(6, 2.6, 2.6, '#ff8a1f', -18, 3.4, -64);
    // Fischbude
    K.solid(0, 3, -51, 6, 3, 4, '#ffffff', { studs: false, safe: true });
    for (let i = 0; i < 12; i++) B(0.5, 0.1, 1.6, i % 2 ? '#1fb5c9' : '#ffffff', -2.75 + i * 0.5, 3.0, -48.4, 0, 0.35);
    w.sign('Fischbrötchen', 0, 4.4, -48.6, { bg: '#1fb5c9', size: 0.8 });
    w.sign('Hafen', 20, 3.6, -61, { bg: '#2f5fd6', size: 1 });
    w.coinLine(-12, -47, 12, -47, 5);
    for (const x of [-30, -6, 8, 34, 48]) w.lamp(x, -58.5);
    for (const [x, z] of [[46, -50], [52, -54], [-56, -46], [-56, 24], [-44, 26.5], [56, 26.5], [56, 56], [-56, 56], [-30, 56], [30, 56]]) w.tree('oak', x, z, 1);
    for (const [x, z] of [[-40, 50], [-34, 52], [36, 54], [12, 52], [-12, 52]]) w.tree('birch', x, z, 0.9);

    // ---------------- Hubschrauber-Landeplatz ----------------
    K.solid(50, 0.3, 44, 9, 0.3, 9, '#5a616b', { studs: false, safe: true });
    for (const [ww, dd, x, z] of [[0.6, 3.6, 48.8, 44], [0.6, 3.6, 51.2, 44], [2.4, 0.6, 50, 44]]) B(ww, 0.06, dd, '#ffffff', x, 0.33, z);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; B(0.9, 0.06, 0.3, '#ffd23f', 50 + Math.cos(a) * 3.6, 0.33, 44 + Math.sin(a) * 3.6, -a + Math.PI / 2); }
    const heliSt = w.station(42, 35, 'Hubschrauber', '#e8262b');
    const heli = vehicle(heliBody);
    const rotor = boxList();
    rotorModel(rotor);
    const rotorMesh = meshOf(rotor);
    rotorMesh.position.set(0, 3.95, -1.2);
    heli.add(rotorMesh);
    const tail = boxList();
    tail(0.06, 1.6, 0.25, '#2b2f36', 0, 0, 0);
    tail(0.06, 0.25, 1.6, '#2b2f36', 0, 0, 0);
    const tailMesh = meshOf(tail);
    tailMesh.position.set(0.15, 2.8, -6.0);
    heli.add(tailMesh);
    w.addRide(pathRide(w, {
      points: [[50, 0.3, 44], [50, 6, 39], [46, 22, 26], [36, 44, 4], [14, 48, -22], [-12, 48, -42], [-40, 46, -40], [-56, 44, -12],
        [-46, 40, 18], [-24, 34, 40], [0, 30, 52], [24, 22, 58], [42, 10, 56], [49, 3, 49]],
      closed: true, duration: 32, vehicle: heli, seat: [0, 0.25, 0.4], name: 'Hubschrauber-Rundflug', starId: 'heli',
      station: heliSt, exit: new THREE.Vector3(42, 0, 39), idle: 'wait', flat: true,
      animate(v, t, riding) { rotorMesh.rotation.y = t * (riding ? 18 : 5); tailMesh.rotation.x = t * 25; },
      camera(pos, fwd, out) {
        const f = new THREE.Vector3(fwd.x, 0, fwd.z).normalize();
        out.pos.copy(pos).addScaledVector(f, -11).add(new THREE.Vector3(0, 5.5, 0));
        out.look.copy(pos).addScaledVector(f, 6).add(new THREE.Vector3(0, -0.5, 0));
      },
    }));
    w.sign('Rundflug', 50, 6, 49.5, { bg: '#e8262b', size: 0.8 });

    // ---------------- Tiere ----------------
    const pigeon = ['#9aa1ab', '#7d8590', '#5f6670'];
    w.animal('bird', { pos: new THREE.Vector3(-5, 0, 33), behavior: 'walk', radius: 2.5, speed: 0.8, colors: pigeon, hungry: true });
    w.animal('bird', { pos: new THREE.Vector3(5, 0, 36), behavior: 'walk', radius: 3, speed: 0.8, colors: pigeon });
    w.animal('bird', { pos: new THREE.Vector3(-16, 0, -18), behavior: 'walk', radius: 3, speed: 0.8, colors: pigeon });
    w.animal('bird', { pos: new THREE.Vector3(-18, 0, -24), y: 11, behavior: 'fly', radius: 9, speed: 4, colors: pigeon });
    w.animal('bird', { pos: new THREE.Vector3(0, 0, 0), y: 20, behavior: 'fly', radius: 16, speed: -5, colors: pigeon });
    w.animal('bird', { pos: new THREE.Vector3(-21, 6.5, 15), behavior: 'perch', colors: pigeon });
    for (let i = 0; i < 2; i++) w.animal('bird', { pos: new THREE.Vector3(10, 0, -72), y: 9 + i * 3, behavior: 'fly', radius: 12 + i * 4, speed: 5, colors: ['#ffffff', '#e6e8ea', '#9aa1ab'] });
    w.animal('dog', { pos: new THREE.Vector3(-26, 0, -30), radius: 4, speed: 2.2, hungry: true });
    w.animal('dog', { pos: new THREE.Vector3(7, 0, 45), radius: 3, speed: 1.6, hungry: true });
    w.animal('cat', { pos: new THREE.Vector3(-36, 2.6, -55), behavior: 'perch', color: '#f08a1f', hungry: true });
    w.animal('cat', { pos: new THREE.Vector3(-18, 0, 10), radius: 3, speed: 0.8, color: '#3a3a3a' });
    w.animal('cat', { pos: new THREE.Vector3(9, 0.5, 40), behavior: 'perch', color: '#ffffff' });

    w.coinLine(0, 18, 0, -4, 5);
    w.coinLine(-30, 36, -30, 48, 3);
    w.coinLine(-46, 2, -46, 12, 3);
    w.coinLine(44, 12, 54, 12, 3);

    // Leuchtende Teile (Ampeln, Lichter) als ein Mesh
    w.add(meshOf(glow, 'basic'));
    K.flush();
  },
};
