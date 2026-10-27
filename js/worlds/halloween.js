// Halloween: niedlich-gruselige Nachtwelt mit Vollmond, Kürbissen, Spukhaus, Friedhof und Geisterbahn.
// Sterne: Spukhaus-Turm, Friedhofs-Labyrinth, Geisterbahn, Hexenbesen-Flug.
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';
import { pathRide } from '../rides.js';
import { Kit, boxList, meshOf } from './city-kit.js';
import { at } from './city-models.js';

const WOOD = '#4a3a5e', DARK = '#2b2233', STONE = '#7d7690', BARK = '#4a3628';

export const halloween = {
  id: 'halloween',
  name: 'Halloween',
  seed: 102,
  theme: {
    sky: ['#120a2a', '#3d1f66', '#ff8a3d'], fog: '#2e1d4a', sea: '#241a4a', fogNear: 70, fogFar: 220,
    light: { hemi: 1.0, sun: 0.9, sunColor: '#c9b8ff', sky: '#b4a6ff', ground: '#4a3a66' },
  },
  stars: { house: 'Spukhaus', graveyard: 'Friedhofs-Labyrinth', ghosttrain: 'Geisterbahn', broom: 'Hexenbesen-Flug' },
  build(w) {
    const K = new Kit(w);
    const B = w.box.bind(w);
    const pumpkinBody = boxList(), pumpkinFace = boxList(), glow = boxList(), fogList = boxList();
    w.island(116, '#4f6e3c', '#6b5a48');
    exitPortal(w, 53, 'hub');

    // ---------------- Bausteine ----------------
    // Leuchtender Kürbis (Körper + Gesicht), Gesicht schaut in Richtung ry
    const pumpkin = (x, z, s = 1, ry = 0, y = 0) => {
      const P = at(pumpkinBody, x, z, ry, y), F = at(pumpkinFace, x, z, ry, y);
      P(1.1 * s, 0.85 * s, 1.0 * s, '#ff7a1a', 0, 0.43 * s, 0);
      P(0.8 * s, 0.95 * s, 1.12 * s, '#ff8c2a', 0, 0.48 * s, 0);
      P(1.24 * s, 0.7 * s, 0.7 * s, '#f06a10', 0, 0.4 * s, 0);
      P(0.14 * s, 0.3 * s, 0.14 * s, '#3c7a2a', 0, 1.0 * s, 0);
      F(0.22 * s, 0.18 * s, 0.05 * s, '#ffe066', -0.22 * s, 0.6 * s, 0.56 * s);
      F(0.22 * s, 0.18 * s, 0.05 * s, '#ffe066', 0.22 * s, 0.6 * s, 0.56 * s);
      F(0.5 * s, 0.12 * s, 0.05 * s, '#ffe066', 0, 0.32 * s, 0.56 * s);
      F(0.12 * s, 0.1 * s, 0.05 * s, '#ffe066', -0.12 * s, 0.4 * s, 0.56 * s);
      F(0.12 * s, 0.1 * s, 0.05 * s, '#ffe066', 0.12 * s, 0.4 * s, 0.56 * s);
    };
    const lantern = (x, z, h = 3.2) => {
      B(0.22, h, 0.22, '#1d1724', x, h / 2, z);
      B(0.9, 0.12, 0.12, '#1d1724', x + 0.35, h - 0.1, z);
      glow(0.45, 0.55, 0.45, '#ffcf5a', x + 0.7, h - 0.55, z);
      B(0.6, 0.14, 0.6, '#1d1724', x + 0.7, h - 0.2, z);
    };
    // krummer, kahler Baum
    const deadTree = (x, z, s = 1) => {
      const lean = w.r(-0.15, 0.15);
      B(0.7 * s, 4.4 * s, 0.7 * s, BARK, x, 2.2 * s, z, w.r(0, 3), 0, lean);
      B(0.5 * s, 2.2 * s, 0.5 * s, BARK, x - lean * 3 * s, 5.1 * s, z, 0, 0, lean * 2 - 0.2);
      for (let i = 0; i < 5; i++) {
        const a = w.r(0, Math.PI * 2), hy = w.r(2.6, 5.4) * s, len = w.r(1.4, 2.4) * s;
        B(len, 0.22 * s, 0.22 * s, BARK, x + Math.cos(a) * len * 0.45, hy, z - Math.sin(a) * len * 0.45, a, 0, w.r(0.3, 0.7));
        B(len * 0.5, 0.16 * s, 0.16 * s, BARK, x + Math.cos(a) * len * 0.9, hy + 0.5 * s, z - Math.sin(a) * len * 0.9, a + 0.6, 0, 0.9);
      }
      w.solids.push({ min: new THREE.Vector3(x - 0.35 * s, 0, z - 0.35 * s), max: new THREE.Vector3(x + 0.35 * s, 4 * s, z + 0.35 * s) });
    };
    const grave = (x, z, ry = 0, c = STONE) => {
      const G = at(B, x, z, ry);
      G(1.0, 1.2, 0.3, c, 0, 0.6, 0);
      G(0.7, 0.25, 0.3, c, 0, 1.3, 0);
      G(0.4, 0.15, 0.32, c, 0, 1.45, 0);
      G(0.5, 0.08, 0.05, '#5a5468', 0, 0.85, 0.16);
      G(1.2, 0.1, 1.6, '#3f5a32', 0, 0.05, 0.9);
    };
    const fence = (x1, z1, x2, z2) => {
      const len = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(x2 - x1, z2 - z1), n = Math.round(len / 0.7);
      B(0.08, 0.1, len, DARK, (x1 + x2) / 2, 0.5, (z1 + z2) / 2, ry);
      B(0.08, 0.1, len, DARK, (x1 + x2) / 2, 1.2, (z1 + z2) / 2, ry);
      for (let i = 0; i <= n; i++) {
        const t = i / n, px = x1 + (x2 - x1) * t, pz = z1 + (z2 - z1) * t;
        B(0.1, 1.5, 0.1, DARK, px, 0.75, pz);
        B(0.16, 0.16, 0.16, DARK, px, 1.55, pz, Math.PI / 4, Math.PI / 4);
      }
    };
    const web = (x, y, z, ry, s = 1) => {
      for (let i = 0; i < 4; i++) B(0.03, 1.8 * s, 0.03, '#e8e4f2', x, y, z, ry, 0, i * Math.PI / 4);
      for (const r of [0.35, 0.65]) for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 4 + Math.PI / 8;
        const c = at(B, x, z, ry, y);
        c(0.03, r * 0.8 * s, 0.03, '#e8e4f2', Math.cos(a) * r * s, Math.sin(a) * r * s, 0, 0, 0, a);
      }
    };
    const fog = (x, z, sx, sz) => fogList(sx, w.r(0.3, 0.8), sz, '#d8ccff', x, w.r(0.3, 0.9), z, w.r(0, 3));

    // ---------------- Mond und Himmel ----------------
    const moon = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff3c4', fog: false }));
    moon.position.set(46, 34, -175);
    w.add(moon);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(24, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffe7a0', transparent: true, opacity: 0.18, fog: false, depthWrite: false }));
    halo.position.copy(moon.position);
    w.add(halo);
    const craters = boxList();
    for (const [dx, dy, s] of [[-6, 5, 4], [5, -4, 5], [7, 7, 3], [-3, -8, 3.5], [-9, -2, 2.5]]) craters(s, s, 1, '#e8d79a', dx, dy, 16);
    const cm = meshOf(craters, 'basic', { fog: false });
    cm.position.copy(moon.position);
    cm.lookAt(0, 0, 40);
    w.add(cm);
    // Sterne am Himmel
    const sky = boxList();
    for (let i = 0; i < 70; i++) {
      const a = w.r(-Math.PI * 0.9, -Math.PI * 0.1), r = w.r(170, 200), y = w.r(40, 110);
      sky(0.9, 0.9, 0.9, '#ffffff', Math.cos(a) * r, y, Math.sin(a) * r);
    }
    for (let i = 0; i < 40; i++) {
      const a = w.r(0, Math.PI * 2), r = w.r(170, 200);
      sky(0.8, 0.8, 0.8, '#fff6d0', Math.cos(a) * r, w.r(60, 120), Math.sin(a) * r);
    }
    w.add(meshOf(sky, 'basic', { fog: false }));

    // ---------------- Wege ----------------
    const PATH = '#8a7d6a';
    w.path(0, 46, 0, -14, 3.4, PATH);
    w.path(0, 22, -46, 22, 2.6, PATH);
    w.path(-46, 22, -54, -1.4, 2.6, PATH);
    w.path(0, 8, 30, 8, 2.6, PATH);
    w.path(30, 8, 28, 4, 2.6, PATH);
    w.path(-14, 30, -26, 33, 2.6, PATH);
    for (let z = 44; z >= -10; z -= 6) for (const s of [-1, 1]) pumpkin(s * 2.6, z + (s > 0 ? 3 : 0), w.r(0.6, 0.9), -s * 0.7);
    for (const z of [36, 24, 12, 0]) { lantern(-3.6, z); lantern(3.6, z - 0.01); }
    w.coinLine(0, 30, 0, -10, 6);

    // ---------------- Stern 1: Spukhaus ----------------
    const HZ = -16, HN = -30; // Süd- und Nordwand
    const WALL = 13;
    K.solid(0, WALL, HN, 18.6, WALL, 0.6, WOOD, { studs: false, safe: true });
    for (const s of [-1, 1]) K.solid(s * 9, WALL, -23, 0.6, WALL, 14, WOOD, { studs: false, safe: true });
    for (const s of [-1, 1]) K.solid(s * 5.3, 4.4, HZ, 8, 4.4, 0.6, WOOD, { studs: false, safe: true });
    K.solid(0, 4.4, HZ, 2.6, 1.0, 0.6, WOOD, { studs: false });
    w.gateAt(new THREE.Vector3(0, 0, HZ), 's', 'Spukhaus');
    // Bretter-Optik
    for (let y = 0.8; y < WALL; y += 1.6) {
      B(18.7, 0.08, 0.05, '#3a2c4a', 0, y, HN - 0.33);
      for (const s of [-1, 1]) B(0.05, 0.08, 14, '#3a2c4a', s * 9.33, y, -23);
    }
    for (let y = 0.8; y < 4.4; y += 1.6) for (const s of [-1, 1]) B(8, 0.08, 0.05, '#3a2c4a', s * 5.3, y, HZ + 0.33);
    // kaputte Bretter oben an der offenen Südseite
    for (const s of [-1, 1]) {
      B(0.6, 6, 0.6, WOOD, s * 9, 7.4, HZ);
      B(3, 0.5, 0.3, WOOD, s * 7.8, 6.2, HZ, 0, 0, s * 0.3);
      B(2.4, 0.5, 0.3, WOOD, s * 8, 8.6, HZ, 0, 0, -s * 0.2);
    }
    // Fenster (leuchtend) an Nord-, Ost- und Westseite
    for (const y of [2.4, 7, 11]) {
      for (const x of [-5.5, 0, 5.5]) {
        glow(1.4, 1.6, 0.08, '#ffd25a', x, y, HN - 0.34);
        B(1.7, 0.14, 0.12, DARK, x, y, HN - 0.38); B(0.14, 1.8, 0.12, DARK, x, y, HN - 0.38);
      }
      for (const s of [-1, 1]) for (const z of [-26.5, -19.5]) {
        glow(0.08, 1.6, 1.4, '#ffd25a', s * 9.34, y, z);
        B(0.12, 0.14, 1.7, DARK, s * 9.38, y, z); B(0.12, 1.8, 0.14, DARK, s * 9.38, y, z);
      }
    }
    // Dach: nur die Nordhälfte ist noch da, Süden nur Dachbalken
    const slope = Math.atan2(4, 7), sl = Math.hypot(4, 7) + 0.6;
    B(20, 0.4, sl, '#2b1f3a', 0, WALL + 2, -26.5, 0, -slope);
    for (const x of [-2, 3, 7.5]) B(0.35, 0.35, sl, '#3a2c4a', x, WALL + 2, -19.5, 0, slope);
    B(20, 0.4, 0.4, '#2b1f3a', 0, WALL + 4, -23);
    K.solid(5, WALL + 5.5, -26, 1.4, 3, 1.4, '#5a4a6e', { studs: false });
    // Veranda über der Tür
    B(5, 0.25, 2, '#2b1f3a', 0, 4.7, HZ + 1.1, 0, 0.15);
    for (const s of [-1, 1]) B(0.25, 4.6, 0.25, DARK, s * 2.3, 2.3, HZ + 2);
    pumpkin(-3.2, HZ + 1.2, 0.9, 0); pumpkin(3.2, HZ + 1.2, 1.1, 0.2);
    // Innen: Boden, Kamin, Teppich, Spinnweben
    B(17.4, 0.06, 13.4, '#3a2a22', 0, 0.04, -23);
    B(6, 0.07, 4, '#7a2a4a', 0, 0.06, -21);
    K.solid(0, 3, -29.1, 4, 3, 1.2, '#5a5468', { studs: false });
    glow(2, 1.2, 0.1, '#ff8a2a', 0, 0.9, -28.45);
    web(-8.5, 4, -29.5, Math.PI / 4); web(8.5, 4, -29.5, -Math.PI / 4); web(-8.5, 10, -16.6, -Math.PI / 4);
    // Treppe 1 (Ostwand, nach Norden)
    for (let i = 1; i <= 9; i++) {
      const top = 0.5 * i, z = -17.6 - (i - 1) * 1.1;
      K.solid(7.25, top, z, 2.9, top, 1.1, i % 2 ? '#6b5a7e' : '#5a4a6e');
    }
    K.solid(6.55, 5.0, -28.35, 4.3, 0.5, 2.7, '#6b5a7e');
    w.coin(6.55, 5, -28.35);
    // schwebende Plattformen (Bücherregale, Kronleuchter)
    const plats = [[2.6, 6.0, -28.6], [-0.8, 7.0, -27.8], [-4.3, 8.0, -28.4]];
    plats.forEach(([x, top, z], i) => {
      K.solid(x, top, z, 2.2, 0.5, 2.2, ['#8a5e33', '#b05fd0', '#8a5e33'][i]);
      B(0.08, WALL - top, 0.08, '#c8ccd2', x, top + (WALL - top) / 2, z);
      if (i === 1) w.coin(x, top, z);
    });
    for (const [x, top, z] of plats) { glow(0.2, 0.4, 0.2, '#ffe9a0', x + 0.7, top + 0.2, z + 0.7); B(0.15, 0.3, 0.15, '#f4efe6', x + 0.7, top - 0.05 + 0.15, z + 0.7); }
    K.solid(-7.4, 9.0, -26.95, 2.6, 0.5, 5.5, '#6b5a7e');
    // Treppe 2 (Westwand, nach Süden) zum Dachboden
    for (let i = 1; i <= 5; i++) K.solid(-7.4, 9 + 0.5 * i, -23.6 + (i - 1) * 1.1, 2.6, 0.5, 1.1, i % 2 ? '#5a4a6e' : '#6b5a7e');
    K.solid(-6.6, 12, -17.475, 4.2, 0.5, 2.35, '#6b5a7e');
    w.coin(-6.6, 12, -17.5);
    B(1.2, 0.8, 0.8, '#8a5e33', -5.5, 12.4, -17.2);
    // Turm außen an der Südwest-Ecke mit offener Glockenstube
    K.solid(-9.0, 13.2, -17.5, 1.6, 1.2, 1.6, '#5a4a6e');
    K.solid(-11, 14.4, -18, 4, 14.4, 4, '#5a4a6e', { studs: false, safe: true });
    for (let y = 2.5; y < 14; y += 3.5) for (const [dx, dz] of [[0, 2.04], [-2.04, 0]]) glow(dz ? 1 : 0.08, 1.4, dz ? 0.08 : 1, '#ffd25a', -11 + dx, y, -18 + dz);
    for (const [dx, dz] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) B(0.3, 3.4, 0.3, DARK, -11 + dx, 16.1, -18 + dz);
    w.cone(3.4, 5, '#2b1f3a', -11, 17.8, -18, { seg: 4, ry: Math.PI / 4 });
    B(0.12, 1.4, 0.12, '#ffcf5a', -11, 23.4, -18);
    w.star('house', -11, 14.4, -18, 'Spukhaus');
    w.sign('Spukhaus', 0, 9.6, -15.5, { bg: '#7a3fb0', size: 1.3 });

    // ---------------- Stern 2: Friedhofs-Labyrinth ----------------
    const mz = { x0: -50, z0: -14, C: 7, S: 3.6 };
    w.maze({ ...mz, H: 3.8, color: '#6f6a7f', label: 'Friedhof', starId: 'graveyard', starLabel: 'Friedhofs-Labyrinth', row: 3 });
    for (let i = 0; i <= 7; i++) for (const z of [mz.z0, mz.z0 + 7 * 3.6]) B(0.8, 0.5, 0.8, '#8a849a', mz.x0 + i * 3.6, 4.05, z);
    // Grabsteine in einigen Zellen (an der Wand, Wege bleiben frei)
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) {
      if ((i * 3 + j * 5) % 4) continue;
      const cx = mz.x0 + (i + 0.5) * 3.6, cz = mz.z0 + (j + 0.5) * 3.6;
      B(0.7, 0.9, 0.22, '#9a94aa', cx - 1.2, 0.45, cz - 1.45);
      B(0.45, 0.2, 0.22, '#9a94aa', cx - 1.2, 1.0, cz - 1.45);
      if ((i + j) % 3 === 0) pumpkin(cx + 1.2, cz - 1.3, 0.45, 0);
    }
    for (const [i, j] of [[1, 1], [3, 5], [5, 2], [2, 3]]) w.coin(mz.x0 + (i + 0.5) * 3.6, 0, mz.z0 + (j + 0.5) * 3.6);
    // Friedhofstor-Bogen
    const gz = mz.z0 + 3.5 * 3.6;
    for (const s of [-1, 1]) B(0.8, 5.2, 0.8, '#8a849a', mz.x0 - 0.2, 2.6, gz + s * 2.1);
    B(0.8, 0.6, 5, '#8a849a', mz.x0 - 0.2, 5.4, gz);
    for (let z = mz.z0 - 4; z < mz.z0 + 26; z += 2.2) fog(w.r(-48, -26), z, w.r(4, 7), w.r(2, 4));
    // Gräber draußen
    for (const [x, z] of [[-54, 6], [-55, 10], [-54, -10], [-55, -6], [-20, -18], [-18, 14], [-21, 4]]) grave(x, z, w.r(-0.3, 0.3) + Math.PI / 2);
    fence(-56, -16, -56, 14);

    // ---------------- Stern 3: Geisterbahn ----------------
    const GW = '#3b2a55';
    K.solid(36, 7, -26, 20.6, 7, 0.6, GW, { studs: false, safe: true });
    K.solid(26, 7, -16, 0.6, 7, 20.6, GW, { studs: false, safe: true });
    K.solid(46, 7, -16, 0.6, 7, 20.6, GW, { studs: false, safe: true });
    for (const [x0, x1] of [[25.7, 30], [33, 40.5], [43.5, 46.3]]) K.solid((x0 + x1) / 2, 7, -6, x1 - x0, 7, 0.6, GW, { studs: false, safe: true });
    for (const x of [31.5, 42]) K.solid(x, 7, -6, 3, 3, 0.6, GW, { studs: false });
    B(21, 0.5, 21, '#24183a', 36, 7.25, -16);
    for (let i = 0; i < 10; i++) B(2, 0.6, 0.3, i % 2 ? '#ff7a1a' : '#b05fd0', 27 + i * 2, 6.5, -5.6);
    // Geisterkopf über dem Eingang
    B(5, 4, 0.4, '#f4f0ff', 36.75, 9, -5.9);
    B(4, 1, 0.4, '#f4f0ff', 36.75, 11.3, -5.9);
    for (const s of [-1, 1]) B(0.9, 1.2, 0.1, '#1d1724', 36.75 + s * 1.1, 9.6, -5.66);
    B(1.4, 0.9, 0.1, '#1d1724', 36.75, 8, -5.66);
    w.sign('Geisterbahn', 36.75, 13.2, -5.5, { bg: '#b05fd0', size: 1.2 });
    // Strecke
    const trackPts = [[31.5, 2], [31.5, -5], [31, -12], [33, -19], [37, -23], [42, -21], [43, -15], [39, -12], [42, -8], [42, -3], [40, 2], [36, 4], [33.5, 3.5]];
    const tCurve = new THREE.CatmullRomCurve3(trackPts.map(([x, z]) => new THREE.Vector3(x, 0.05, z)), true, 'catmullrom', 0.5);
    const TL = tCurve.getLength(), TN = Math.ceil(TL / 0.8);
    for (let i = 0; i < TN; i++) {
      const p = tCurve.getPointAt(i / TN), t = tCurve.getTangentAt(i / TN), ry = Math.atan2(t.x, t.z);
      B(1.6, 0.1, 0.3, '#3a2a22', p.x, 0.06, p.z, ry);
      for (const s of [-0.55, 0.55]) B(0.12, 0.14, 0.86, '#9a94aa', p.x + Math.cos(ry) * s, 0.13, p.z - Math.sin(ry) * s, ry);
    }
    const cart = boxList();
    cart(1.7, 0.7, 2.2, '#8a3fd0', 0, 0.6, 0);
    cart(1.8, 0.2, 2.3, '#ff7a1a', 0, 1.0, 0);
    cart(1.7, 0.9, 0.3, '#8a3fd0', 0, 1.3, -0.95);
    cart(1.3, 0.25, 1.0, '#2b1f3a', 0, 0.98, -0.3);
    for (const s of [-1, 1]) for (const zz of [-0.7, 0.7]) cart(0.2, 0.4, 0.4, '#1d1724', s * 0.85, 0.22, zz);
    const cartG = new THREE.Group();
    cartG.add(meshOf(cart));
    const cf = boxList();
    pumpkinLocal(cf);
    const cfm = meshOf(cf, 'lambert', { emissive: '#7a2a00' });
    cfm.position.set(0, 1.05, 0.85);
    cartG.add(cfm);
    const ghostSt = w.station(28, 2, 'Geisterbahn', '#b05fd0');
    w.addRide(pathRide(w, {
      points: trackPts.map(([x, z]) => [x, 0.05, z]), closed: true, duration: 24, vehicle: cartG, seat: [0, 0.2, -0.3],
      name: 'Geisterbahn', starId: 'ghosttrain', station: ghostSt, exit: new THREE.Vector3(28, 0, 5.6), idle: 'wait', flat: true,
      camera(pos, fwd, out) {
        const f = new THREE.Vector3(fwd.x, 0, fwd.z).normalize();
        out.pos.copy(pos).addScaledVector(f, -4.5).add(new THREE.Vector3(0, 3, 0));
        out.look.copy(pos).addScaledVector(f, 4).add(new THREE.Vector3(0, 1, 0));
      },
    }));
    // Spuk innen: auf- und abtauchende Gespenster, Spinne, Kürbisse, Spinnweben
    const spooks = [];
    for (const [x, z] of [[34.5, -14], [39.5, -19.5], [38.5, -8.5]]) {
      const g = boxList();
      g(1.2, 1.4, 1.0, '#f4f0ff', 0, 1.6, 0);
      g(1.3, 0.6, 1.1, '#f4f0ff', 0, 0.8, 0);
      for (const s of [-1, 1]) g(0.22, 0.32, 0.05, '#1d1724', s * 0.25, 1.9, 0.52);
      g(0.3, 0.3, 0.05, '#1d1724', 0, 1.45, 0.52);
      const m = meshOf(g, 'lambert', { emissive: '#6a6a90' });
      m.position.set(x, 0, z);
      w.add(m);
      spooks.push(m);
    }
    const bigSpider = boxList();
    bigSpider(1.2, 0.9, 1.4, '#2b2233', 0, 0, 0);
    bigSpider(0.8, 0.6, 0.7, '#2b2233', 0, -0.1, 0.9);
    for (const s of [-1, 1]) bigSpider(0.16, 0.16, 0.05, '#ff5a5a', s * 0.2, 0.05, 1.26);
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) bigSpider(1.4, 0.12, 0.12, '#2b2233', s * 1.1, -0.3, 0.5 - i * 0.4, 0, 0, s * -0.5);
    bigSpider(0.04, 6, 0.04, '#e8e4f2', 0, 3.2, 0);
    const spiderM = meshOf(bigSpider);
    spiderM.position.set(40, 4, -24.2);
    w.add(spiderM);
    w.updaters.push((dt, t) => {
      spooks.forEach((m, i) => { m.position.y = Math.max(0, Math.sin(t * 1.3 + i * 2.1)) * 1.6 + 0.2; m.rotation.y = Math.sin(t * 0.7 + i) * 0.6; });
      spiderM.position.y = 3.2 + Math.sin(t * 0.9) * 1.6;
    });
    for (const [x, z, ry] of [[29, -9, 0.6], [29, -20, 0.3], [44.5, -24, -0.5], [44.5, -11, -1.2], [35, -24.5, 0], [37, -1, 2.6]]) pumpkin(x, z, 0.9, ry);
    web(26.4, 5, -25.6, Math.PI / 4, 1.3); web(45.6, 5, -25.6, -Math.PI / 4, 1.3); web(36, 6, -25.6, 0, 1.2);
    for (const [x, z] of [[30, -16], [41, -17], [44, -5.5]]) { B(0.3, 0.8, 0.3, '#f4efe6', x, 0.4, z); glow(0.2, 0.3, 0.2, '#ffe9a0', x, 0.95, z); }
    w.coin(36, 0, -16); w.coin(28, 0, -24);

    // ---------------- Stern 4: Hexenbesen-Flug ----------------
    // Hexenhaus mit Kessel
    K.solid(-44, 4, 44, 8, 4, 7, '#5a4a6e', { studs: false, safe: true });
    for (let i = 0; i < 4; i++) B(9 - i * 2.2, 1.2, 8 - i * 2, i % 2 ? '#6a2f8a' : '#4a2366', -44 + i * 0.25, 4.6 + i * 1.2, 44, 0.1 * i);
    B(0.6, 1.6, 0.6, '#6a2f8a', -43, 9.6, 44, 0, 0, 0.5);
    glow(1.2, 1.2, 0.08, '#9dff6a', -46, 2.2, 47.54);
    glow(1.2, 1.2, 0.08, '#9dff6a', -42, 2.2, 47.54);
    B(1.3, 2.4, 0.08, '#2b1f3a', -44, 1.2, 47.54);
    w.sign('Hexenhaus', -44, 7.4, 48, { bg: '#6a2f8a', size: 0.9 });
    w.cyl(1.4, 1.1, 1.5, '#1d1724', -34, 0, 40, { seg: 10 });
    glow(2.1, 0.12, 2.1, '#7dff4a', -34, 1.42, 40);
    for (let i = 0; i < 3; i++) B(0.3, 0.6, 0.3, '#3a2a22', -34 + Math.cos(i * 2.1) * 1.1, 0.25, 40 + Math.sin(i * 2.1) * 1.1);
    const bubbles = [];
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshBasicMaterial({ color: '#b8ff7a', transparent: true }));
      w.add(m);
      bubbles.push(m);
    }
    w.updaters.push((dt, t) => bubbles.forEach((m, i) => {
      const k = (t * 0.6 + i / 6) % 1;
      m.position.set(-34 + Math.sin(i * 2.4) * 0.6, 1.5 + k * 2.2, 40 + Math.cos(i * 2.4) * 0.6);
      m.material.opacity = 1 - k;
    }));
    w.coinRing(-34, 0, 40, 3.2, 6);
    // Besen
    const broom = boxList();
    broom(0.18, 0.18, 3.4, '#8a5e33', 0, 1.0, 0.3);
    broom(0.7, 0.7, 1.2, '#e0b04a', 0, 1.0, -1.85);
    broom(0.5, 0.5, 0.3, '#b07b2a', 0, 1.0, -1.2);
    broom(0.5, 0.12, 0.6, '#6a2f8a', 0, 1.12, -0.2);
    broom(0.16, 0.16, 0.16, '#ffd25a', 0, 1.0, 2.05);
    const broomG = new THREE.Group();
    broomG.add(meshOf(broom));
    const broomSt = w.station(-26, 34, 'Hexenbesen', '#6a2f8a');
    w.addRide(pathRide(w, {
      points: [[-26, 0.9, 29.8], [-26, 4, 23], [-24, 12, 8], [-24, 20, -14], [-6, 26, -40], [16, 28, -46], [36, 30, -34], [50, 26, -6], [40, 22, 24],
        [16, 18, 32], [-4, 13, 36], [-18, 8, 40], [-28, 3, 37]],
      closed: true, duration: 30, vehicle: broomG, seat: [0, 0.15, -0.1], name: 'Hexenbesen-Flug', starId: 'broom',
      station: broomSt, exit: new THREE.Vector3(-22.2, 0, 34), idle: 'wait', bank: 0,
      animate(v, t, riding) { v.children[0].position.y = riding ? 0 : Math.sin(t * 2) * 0.12; },
      camera(pos, fwd, out) {
        const f = new THREE.Vector3(fwd.x, 0, fwd.z).normalize();
        out.pos.copy(pos).addScaledVector(f, -8).add(new THREE.Vector3(0, 3.5, 0));
        out.look.copy(pos).addScaledVector(f, 5).add(new THREE.Vector3(0, 0.5, 0));
      },
    }));

    // ---------------- Kürbisfeld mit Vogelscheuche ----------------
    for (let i = 0; i < 18; i++) pumpkin(w.r(24, 50), w.r(26, 46), w.r(0.7, 1.4), w.r(-0.8, 0.8));
    for (let x = 24; x <= 50; x += 3) B(0.5, 0.15, 22, '#4a3a22', x, 0.08, 36);
    const sc = at(B, 37, 36, 0);
    sc(0.25, 3.4, 0.25, '#7a5a3a', 0, 1.7, 0);
    sc(3, 0.22, 0.22, '#7a5a3a', 0, 2.6, 0);
    sc(1.0, 1.3, 0.6, '#5a7a3a', 0, 2.5, 0);
    sc(0.8, 0.8, 0.8, '#e8c87a', 0, 3.6, 0);
    sc(1.3, 0.12, 1.3, '#4a3a22', 0, 4.05, 0);
    sc(0.7, 0.5, 0.7, '#4a3a22', 0, 4.3, 0);
    for (const s of [-1, 1]) sc(0.12, 0.12, 0.05, '#1d1724', s * 0.18, 3.7, 0.41);
    sc(0.3, 0.06, 0.05, '#1d1724', 0, 3.45, 0.41);
    for (const [x, z] of [[27, 50], [47, 50]]) { B(2.2, 1.2, 1.4, '#d8b04a', x, 0.6, z); B(2.2, 0.1, 1.42, '#b08a2a', x, 0.9, z); }
    fence(22, 24, 52, 24); fence(22, 24, 22, 48);
    w.coinRing(37, 0, 36, 7, 8);
    w.sign('Kürbisfeld', 37, 3.2, 23.5, { bg: '#ff7a1a', size: 0.9 });

    // ---------------- Hexenteich hinter dem Spukhaus ----------------
    w.water(0, -44, 14, 7, { color: '#3fae6a', emissive: '#1a5a2a' });
    for (const s of [-1, 1]) w.rock(s * 8.5, -44, 0.8, '#6a6478');
    pumpkin(-6, -39.5, 0.8, 0); pumpkin(6, -39.5, 0.8, 0);

    // ---------------- Bäume, Zäune, Grabsteine, Laternen, Nebel ----------------
    for (const [x, z] of [[-14, -40], [-22, -48], [-34, -40], [-44, -52], [-52, -30], [-30, -26], [14, -40], [22, -50], [34, -42], [48, -50], [54, -32],
      [52, 6], [52, 16], [-14, 44], [-52, 30], [-34, 52], [14, 46], [16, -10], [18, 16], [-18, -8], [-12, 12], [10, 26]]) deadTree(x, z, w.r(0.9, 1.3));
    fence(-10, 28, -10, 50); fence(10, 28, 10, 50);
    for (const [x, z] of [[-14, 18], [-17, 17], [14, 2], [17, 0], [-6, -36], [6, -36], [24, 12], [-30, 14]]) grave(x, z, w.r(-0.3, 0.3));
    for (const [x, z] of [[-24, 24.2], [-40, 24.2], [16, 10], [24, 10], [-52, 12], [36, 12], [-24, 30]]) lantern(x, z, 3);
    for (const [x, z, s] of [[-8, 40, 1.2], [8, 34, 1.4], [-20, 26, 1], [20, 4, 1.2], [-30, 18, 1], [12, -20, 1.3], [-14, -26, 1], [16, -32, 1.1], [-40, 30, 1.3], [-50, 50, 1.6],
      [52, -16, 1.2], [50, -24, 1], [22, -2, 0.9], [-20, 40, 1], [44, 54, 1.2], [-8, 52, 1], [8, 52, 1.1]]) pumpkin(x, z, s, Math.atan2(-x, 37 - z));
    for (let i = 0; i < 24; i++) fog(w.r(-55, 55), w.r(-55, 55), w.r(4, 9), w.r(3, 6));
    w.coinLine(-12, 22, -40, 22, 5);
    w.coinLine(14, 8, 26, 8, 3);
    w.coinLine(-2, -40, 2, -48, 3);
    w.coinLine(4, 47, 8, 52, 3);
    w.coinLine(20, -30, 20, -50, 4);
    w.coinLine(-20, -30, -40, -46, 4);

    // ---------------- Tiere ----------------
    for (let i = 0; i < 4; i++) w.animal('bat', { pos: new THREE.Vector3(-11, 0, -18), y: 18 + i * 2, behavior: 'fly', radius: 6 + i * 2, speed: (i % 2 ? -1 : 1) * 4, scale: 1.4 });
    for (let i = 0; i < 2; i++) w.animal('bat', { pos: new THREE.Vector3(36, 0, 36), y: 8 + i * 3, behavior: 'fly', radius: 9, speed: 5, scale: 1.4 });
    w.animal('ghost', { pos: new THREE.Vector3(-40, 0, 2), y: 0.2, behavior: 'flutter', radius: 3, hungry: true });
    w.animal('ghost', { pos: new THREE.Vector3(-14, 0, 20), y: 0.4, behavior: 'flutter', radius: 4 });
    w.animal('ghost', { pos: new THREE.Vector3(0, 0, -23), y: 5, behavior: 'flutter', radius: 4 });
    w.animal('ghost', { pos: new THREE.Vector3(0, 0, 0), y: 22, behavior: 'fly', radius: 22, speed: 1.6 });
    w.animal('cat', { pos: new THREE.Vector3(-6, 0, 30), radius: 3, speed: 1, color: '#1d1a22', hungry: true });
    w.animal('cat', { pos: new THREE.Vector3(-41.5, 0, 48.6), behavior: 'perch', color: '#1d1a22' });
    w.animal('cat', { pos: new THREE.Vector3(30, 0, 40), radius: 4, speed: 1, color: '#1d1a22' });
    w.animal('spider', { pos: new THREE.Vector3(6, 0, 18), radius: 3, speed: 0.8, scale: 1.2, hungry: true });
    w.animal('spider', { pos: new THREE.Vector3(-20, 0, 34), radius: 3, speed: 0.8, scale: 1.2, hungry: true });
    w.animal('spider', { pos: new THREE.Vector3(44, 0, 0), radius: 3, speed: 0.8 });
    const raven = ['#1d1a22', '#2b2233', '#111111'];
    w.animal('bird', { pos: new THREE.Vector3(14, 1.6, 2), behavior: 'perch', colors: raven, hungry: true });
    w.animal('bird', { pos: new THREE.Vector3(-30, 1.6, 14), behavior: 'perch', colors: raven });
    w.animal('bird', { pos: new THREE.Vector3(0, 0, -44), y: 10, behavior: 'fly', radius: 10, speed: 4, colors: raven });

    // Gesammelte Teile als wenige Meshes
    w.add(meshOf(pumpkinBody, 'lambert', { emissive: '#7a2a00' }));
    w.add(meshOf(pumpkinFace, 'basic'));
    w.add(meshOf(glow, 'basic'));
    const fogMesh = meshOf(fogList, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.1, depthWrite: false }));
    w.add(fogMesh);
    w.updaters.push((dt, t) => { fogMesh.position.x = Math.sin(t * 0.15) * 1.5; fogMesh.position.z = Math.cos(t * 0.12) * 1.2; });
    K.flush();

    // kleiner Kürbis vorne am Geisterbahn-Wagen
    function pumpkinLocal(b) {
      b(0.6, 0.45, 0.5, '#ff7a1a', 0, 0.22, 0);
      b(0.1, 0.18, 0.1, '#3c7a2a', 0, 0.52, 0);
      b(0.12, 0.1, 0.03, '#ffe066', -0.12, 0.3, 0.26);
      b(0.12, 0.1, 0.03, '#ffe066', 0.12, 0.3, 0.26);
    }
  },
};
