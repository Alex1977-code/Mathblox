// Australien: rotes Outback mit heiligem Monolith-Felsen (Uluru-artig, wird NICHT bestiegen),
// Opernhaus mit Segeldächern am Hafen, Bogenbrücke zum Hochklettern, Korallenriff mit Glasbodenboot.
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal, inRects } from './common.js';
import { pathRide, part } from '../rides.js';

const G = 1;
const ULX = -34, ULZ = -10; // heiliger Felsen
const uf = (x, z) => ((x - ULX) / 15) ** 4 + ((z - ULZ) / 7) ** 4;
const inInlet = (x, z) => x > 2 && x < 36 && z < -20 && !(x < 16 && z > -34); // Hafenbucht
const inLagoon = (x, z) => x > 42 && z > -24 && z < 40;
const outback = (x, z) => x < -6 && z > -40;

function height(x, z) {
  if (inInlet(x, z)) return 0;
  const m = Math.max(Math.abs(x), Math.abs(z));
  const coast = 58.5 + 1.2 * Math.sin(x * 0.21) + 1.2 * Math.cos(z * 0.17);
  if (m > coast + 2.5) return 0;
  if (m > coast || inLagoon(x, z)) return 0.5;
  const f = uf(x, z);
  if (f < 1) return 7 + 6 * Math.sqrt(1 - f);
  return G;
}

function color(x, z, h) {
  const n = Math.sin(x * 1.5 + z * 0.8) * Math.cos(z * 1.2 - x * 0.6);
  if (h <= 0.5) return inLagoon(x, z) ? (n > 0.3 ? '#cdb983' : '#d8c48e') : '#f2e2b0';
  if (h > G) return Math.round(x / 2) % 3 === 0 ? '#b8461f' : n > 0.2 ? '#d0602f' : '#c8542a';
  if (x > 2 && x < 18 && z > -36 && z < -18) return '#d8d2c4';
  if (outback(x, z)) return n > 0.35 ? '#c86c38' : n < -0.35 ? '#da8a50' : '#d27a42';
  if (x < 4 && z < -40) return n > 0 ? '#c9a46a' : '#bf9a60';
  return n > 0.3 ? '#9cbf5a' : n < -0.3 ? '#b2c66a' : '#a6c460';
}

export const australia = {
  id: 'australia',
  name: 'Australien',
  seed: 206,
  theme: {
    sky: ['#1f7fe0', '#8fd0ff', '#fff2dc'], fog: '#f2e2c8', sea: '#1f8fd0', fogNear: 100, fogFar: 240,
    light: { hemi: 1.6, sun: 2.4, sunColor: '#fff0d0', sky: '#ffffff', ground: '#a07050' },
  },
  stars: { bridgeclimb: 'Brückenkletterei', reef: 'Glasbodenboot', uluru: 'Aussichtspunkt' },
  build(w) {
    w.terrain({ x0: -64, z0: -64, cols: 64, rows: 64, cell: 2, step: 0.5, height, color });
    exitPortal(w, 53, 'worldtour');

    // ---------- Helfer ----------
    const P = (x, y, z) => new THREE.Vector3(x, y, z);
    const S = (x, top, z, sx, h, sz, c, safe = false) => {
      if (c) w.box(sx, h, sz, c, x, top - h / 2, z);
      const s = { min: P(x - sx / 2, top - h, z - sz / 2), max: P(x + sx / 2, top, z + sz / 2), safe };
      w.solids.push(s);
      return s;
    };
    const beam = (a, b, t, c) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      const hd = Math.hypot(dx, dz), L = Math.hypot(hd, dy);
      w.box(t, t, L, c, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, Math.atan2(dx, dz), -Math.atan2(dy, hd));
    };
    const path = (x1, z1, x2, z2, wd, c, y = G) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      w.box(wd, 0.06, len + wd, c, (x1 + x2) / 2, y + 0.03, (z1 + z2) / 2, Math.atan2(x2 - x1, z2 - z1));
    };
    const eucalyptus = (x, z, s = 1) => {
      const y = w.heightAt(x, z), H = 6 * s;
      w.box(0.55 * s, H, 0.55 * s, '#ddd6c8', x, y + H / 2, z);
      w.box(0.57 * s, 1.2 * s, 0.57 * s, '#b8ab98', x, y + H * 0.35, z);
      w.box(0.3 * s, 2.2 * s, 0.3 * s, '#ddd6c8', x + 0.8 * s, y + H - 0.4 * s, z, 0, 0, -0.6);
      w.box(0.3 * s, 2 * s, 0.3 * s, '#ddd6c8', x - 0.7 * s, y + H - 0.8 * s, z + 0.3 * s, 0, 0.3, 0.6);
      const cs = ['#7fa88a', '#6f9a7c', '#8fb89a'];
      w.box(2.6 * s, 1.4 * s, 2.4 * s, w.pick(cs), x + 1.4 * s, y + H + 0.4 * s, z, w.r(0, 1));
      w.box(2.4 * s, 1.3 * s, 2.6 * s, w.pick(cs), x - 1.2 * s, y + H + 0.1 * s, z + 0.5 * s, w.r(0, 1));
      w.box(2 * s, 1.2 * s, 2 * s, w.pick(cs), x, y + H + 1.3 * s, z - 0.4 * s, w.r(0, 1));
      w.solids.push({ min: P(x - 0.3 * s, y, z - 0.3 * s), max: P(x + 0.3 * s, y + 3, z + 0.3 * s) });
      return y + H;
    };

    // ---------- Wege ----------
    path(0, 50, 0, -16, 3.5, '#c9a46a');
    path(0, 30, -24, 18, 3, '#d9a070');
    path(0, 8, 36, 8, 3, '#c9a46a');
    path(0, -16, -6, -46, 3, '#c9a46a');
    w.sign('Australien', 6, G + 6.2, 30, { bg: '#d2532c', size: 1.4 });
    w.sign("G'day – Willkommen!", 6, G + 4.9, 30, { bg: '#ffd23f', fg: '#17233b', size: 0.8 });
    for (const s of [-1, 1]) w.box(0.3, 5.6, 0.3, '#7a4a2a', 6 + s * 3.4, G + 2.8, 30);

    // ---------- Hafen: Geländer am Wasser ----------
    const RAIL = '#e0e0e0';
    S(26, G + 1, -20.2, 20, 1, 0.25, RAIL);
    S(16.2, G + 1, -27, 0.25, 1, 14, RAIL);
    S(9, G + 1, -34.2, 14, 1, 0.25, RAIL);
    S(1.8, G + 1, -46, 0.25, 1, 24, RAIL);
    S(36.2, G + 1, -39, 0.25, 1, 38, RAIL);
    for (let x = 17; x <= 35; x += 2.5) w.box(0.3, 1.2, 0.3, '#5a6270', x, G + 0.6, -20.2);

    // ---------- Opernhaus mit Segeldächern ----------
    const OX = 9, OZ = -27;
    S(OX, G + 1.5, OZ - 0.5, 12, 1.5, 8, '#d8c0a0', true);
    for (let k = 0; k < 3; k++) S(OX, G + 0.5 * (k + 1), OZ + 4.15 - 0.6 * k, 12, 0.5 * (k + 1), 0.6, '#cdb594', true);
    // Segeldach: zwei gebogene Dreiecks-Schalen, die sich oben am First treffen (Öffnung nach vorn = +z)
    const shellMat = new THREE.MeshLambertMaterial({ color: '#f7f4ec', side: THREE.DoubleSide, emissive: '#2a2a28' });
    const sail = (x, z, L, H, W, ry) => {
      const sh = new THREE.Shape();
      sh.moveTo(-L, 0);
      sh.quadraticCurveTo(-L * 0.2, H * 1.1, L * 0.3, H);
      sh.quadraticCurveTo(L * 0.18, H * 0.4, 0, 0);
      sh.lineTo(-L, 0);
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: false });
      geo.rotateY(-Math.PI / 2); // Profil in der z-y-Ebene, vorne = +z
      const g = new THREE.Group();
      const tilt = Math.atan2(W / 2, H);
      for (const s of [-1, 1]) {
        const m = new THREE.Mesh(geo, shellMat);
        m.position.x = s * W / 2;
        m.rotation.z = s * tilt;
        m.castShadow = true;
        g.add(m);
      }
      g.position.set(x, G + 1.5, z);
      g.rotation.y = ry;
      w.add(g);
    };
    // große und kleine Halle, Segel hintereinander; hinten je ein kleines Segel in Gegenrichtung
    // Hallen liegen in x-Richtung (Segel-Profil vom Spawn aus sichtbar), Öffnung nach Osten zum Hafen
    for (const [hz, k] of [[OZ - 2.2, 1], [OZ + 2.0, 0.8]]) {
      sail(OX + 2.6 * k, hz, 3.6 * k, 7.2 * k, 4.4 * k, Math.PI / 2);
      sail(OX + 0.2 * k, hz, 3.2 * k, 6.0 * k, 4.0 * k, Math.PI / 2);
      sail(OX - 2.0 * k, hz, 2.6 * k, 4.6 * k, 3.6 * k, Math.PI / 2);
      sail(OX - 3.4 * k, hz, 1.6 * k, 3.4 * k, 3.2 * k, -Math.PI / 2);
      w.box(0.1, 2.2 * k, 3.4 * k, '#b08a5a', OX + 2.65 * k, G + 1.5 + 1.1 * k, hz);
    }
    w.sign('Opernhaus', OX, G + 10.5, OZ + 3, { bg: '#2f7df6', size: 1 });

    // ---------- Bogenbrücke über die Hafeneinfahrt ----------
    const BZ = -46, DECK = 5, AX = 19, AL = 15, AH = 17;
    const archY = (x) => -0.8 + AH * (1 - ((x - AX) / AL) ** 2);
    S(19, DECK, BZ, 46, 0.8, 6, null, true); // Fahrbahn x -4 … 42
    w.box(46, 0.1, 6, '#4a4f57', 19, DECK - 0.04, BZ);
    for (let x = -3; x <= 41; x += 3) w.box(1.4, 0.11, 0.15, '#ffffff', x, DECK - 0.02, BZ);
    w.box(46, 1.0, 6.2, '#6f7882', 19, DECK - 1.2, BZ);
    S(19, DECK + 1, BZ - 3, 46, 1, 0.2, RAIL);
    S(-0.5, DECK + 1, BZ + 3, 9, 1, 0.2, RAIL);
    S(25, DECK + 1, BZ + 3, 34, 1, 0.2, RAIL);
    // Treppen an beiden Enden
    for (let k = 0; k < 8; k++) {
      const top = DECK - 0.5 * (k + 1);
      if (top <= G) break;
      S(-4.6 - 1.2 * k, top, BZ, 1.2, top - G + 0.5, 6, k % 2 ? '#b9b2a6' : '#c9c2b6', true);
      S(42.6 + 1.2 * k, top, BZ, 1.2, top - G + 0.5, 6, k % 2 ? '#b9b2a6' : '#c9c2b6', true);
    }
    // Granit-Pylone
    for (const px of [0, 38]) for (const s of [-1, 1]) {
      S(px, 15, BZ + s * 3.6, 3, 15, 2.2, '#c9b996');
      w.box(3.4, 0.6, 2.6, '#b5a582', px, 15.3, BZ + s * 3.6);
      for (let y = 3; y < 15; y += 3) w.box(3.1, 0.15, 2.3, '#b5a582', px, y, BZ + s * 3.6);
    }
    // Bögen (Ober- und Untergurt mit Streben) auf beiden Seiten
    const STEEL = '#7d8894', STEEL2 = '#66717c';
    for (const s of [-1, 1]) {
      const z = BZ + s * 3.4;
      let prev = null, prevB = null;
      for (let x = AX - AL; x <= AX + AL + 0.01; x += 1.5) {
        const yt = archY(x) + 1.6 + 1.2 * ((x - AX) / AL) ** 2, yb = archY(x);
        const pt = [x, yt, z], pb = [x, yb, z];
        if (prev) { beam(prev, pt, 0.45, STEEL); beam(prevB, pb, 0.55, STEEL); beam(prevB, pt, 0.18, STEEL2); }
        beam(pb, pt, 0.2, STEEL2);
        if (yb > DECK + 0.5) w.box(0.15, yb - DECK, 0.15, STEEL2, x, (yb + DECK) / 2, z);
        prev = pt; prevB = pb;
      }
      for (let x = AX - 10; x <= AX + 10; x += 5) w.box(0.3, 0.3, 6.8, STEEL2, x, archY(x) + 1.2, BZ);
    }
    // Kletterweg auf dem südlichen Bogen: Stufen bis zum Gipfel
    const climbZ = BZ + 3.4;
    const xAt = (y) => AX - AL * Math.sqrt(Math.max(0, 1 - (y - 0.8) / AH)); // Obergurt erreicht Höhe y
    const summit = archY(AX) + 1.7;
    let px = xAt(DECK), prev = DECK, n = 0;
    while (px < AX - 1.7) { // Stufen: höchstens 0,9 hoch, mindestens 0,7 breit, nie über dem Bogen
      const x1 = Math.min(AX - 1.6, Math.max(px + 0.7, xAt(prev + 0.9)));
      const top = Math.min(prev + 0.9, archY(x1) + 1.6);
      S((px + x1) / 2, top, climbZ, x1 - px, 1.5, 1.6, n % 2 ? '#9aa4ae' : '#b9c2cc');
      if (n % 4 === 2) w.coin((px + x1) / 2, top, climbZ);
      px = x1; prev = top; n++;
    }
    S(AX, summit + 0.3, climbZ, 3.2, 0.6, 2, '#ffd23f', true);
    for (const [dx, c] of [[-0.8, '#2f5fd6'], [0.8, '#d2532c']]) { w.box(0.1, 3, 0.1, '#ffffff', AX + dx, summit + 1.8, climbZ - 0.8); w.box(1.2, 0.7, 0.05, c, AX + dx + 0.6, summit + 2.9, climbZ - 0.8); }
    w.star('bridgeclimb', AX, summit + 0.3, climbZ, 'Brückenkletterei');
    w.sign('Brückenkletterei', 5, DECK + 3.6, BZ + 3.6, { bg: '#2f5fd6', size: 0.8 });
    w.coinLine(-2, BZ, 40, BZ, 8, DECK);
    // Fähre im Hafen
    const ferry = new THREE.Group();
    part(ferry, 2.6, 1, 6, '#1d7a3a', 0, 0, 0);
    part(ferry, 2.4, 1.3, 4.2, '#fff2b0', 0, 1.1, 0);
    part(ferry, 2.6, 0.2, 4.4, '#1d7a3a', 0, 1.85, 0);
    w.add(ferry);
    w.updaters.push((dt, t) => {
      const u = Math.sin(t * 0.1);
      ferry.position.set(26, -0.6, -40 + u * 16);
      ferry.rotation.y = Math.cos(t * 0.1) > 0 ? Math.PI : 0;
    });

    // ---------- Heiliger Felsen im Outback ----------
    for (let i = 0; i < 48; i++) { // Rundweg
      const a = (i / 48) * Math.PI * 2, b = ((i + 1) / 48) * Math.PI * 2;
      const r = (t) => Math.pow(Math.abs(Math.cos(t)) ** 4 + Math.abs(Math.sin(t)) ** 4, -0.25) * 1.18;
      const ax = ULX + Math.cos(a) * 15 * r(a) * 1.0, az = ULZ + Math.sin(a) * 7 * r(a) * 1.5;
      const bx = ULX + Math.cos(b) * 15 * r(b) * 1.0, bz = ULZ + Math.sin(b) * 7 * r(b) * 1.5;
      path(ax, az, bx, bz, 2.2, '#e8b88a');
      if (i % 3 === 0) { // Seil-Absperrung zum Felsen hin
        const px = ULX + (ax - ULX) * 0.9, pz = ULZ + (az - ULZ) * 0.9;
        w.box(0.15, 1, 0.15, '#6b4423', px, G + 0.5, pz);
      }
    }
    w.sign('Bitte nicht besteigen – heiliger Ort', ULX + 6, G + 4.2, ULZ + 13.5, { bg: '#7a2a12', size: 0.9 });
    w.sign('Heiliger Felsen der Ureinwohner', ULX + 6, G + 5.4, ULZ + 13.5, { bg: '#ffffff', fg: '#7a2a12', size: 0.7 });
    w.box(0.3, 4, 0.3, '#5b3a1e', ULX + 6, G + 2, ULZ + 13.8);
    // Aussichtspunkt mit Tor: Treppe zur Plattform
    const VX = -34, VZ = 18;
    w.enclosure({ x: VX, z: VZ, w: 12, d: 12, side: 'e', h: 4.4, y: G, color: '#9a6a3d', label: 'Aussichtspunkt', cap: '#7a4a2a' });
    [[-30.5, 21.5], [-32.4, 22.2], [-34.3, 22.2], [-36.2, 22.2], [-38.1, 21.4], [-38.1, 19.5]].forEach(([x, z], i) => S(x, G + 1 + i, z, 1.8, 1 + i, 1.8, i % 2 ? '#b07a48' : '#c08a58'));
    const PT = G + 7;
    S(-37, PT, 15.5, 5, 7, 5, '#a0764e', true);
    for (const [a, b] of [[-2.3, -2.3], [2.3, -2.3], [-2.3, 2.3], [2.3, 2.3]]) w.box(0.25, 3.2, 0.25, '#6b4423', -37 + a, PT + 1.6, 15.5 + b);
    w.box(5.4, 0.3, 5.4, '#7a4a2a', -37, PT + 3.3, 15.5);
    w.box(0.3, 1, 0.3, '#30343a', -36, PT + 0.5, 13.6);
    w.box(0.5, 0.3, 0.7, '#30343a', -36, PT + 1.1, 13.6);
    w.star('uluru', -37.5, PT, 16, 'Aussichtspunkt');
    // Outback-Deko: Termitenhügel, Spinifex-Gras, tote Bäume
    for (const [x, z] of [[-14, 2], [-48, 36], [-20, 44], [-52, 8], [-14, 24], [-46, -30]]) {
      const y = w.heightAt(x, z);
      w.box(1.6, 1.4, 1.6, '#b0623a', x, y + 0.7, z); w.box(1.1, 1.4, 1.1, '#a85a34', x, y + 2.1, z); w.box(0.6, 1.0, 0.6, '#b0623a', x, y + 3.3, z);
      w.solids.push({ min: P(x - 0.8, y, z - 0.8), max: P(x + 0.8, y + 3.8, z + 0.8) });
    }
    for (let i = 0; i < 110; i++) {
      const x = w.r(-57, -8), z = w.r(-38, 56);
      if (uf(x, z) < 2.2 || inRects(x, z, [[-41, 11, -27, 25], [-26, 14, 2, 32]])) continue;
      const s = w.r(0.4, 0.9);
      w.box(s * 1.4, s * 0.7, s * 1.4, w.pick(['#c8b85a', '#b8a84a', '#d8c070']), x, G + s * 0.35, z, w.r(0, 3));
    }
    for (const [x, z] of [[-52, 46], [-18, -32], [-54, -20]]) {
      w.box(0.4, 4, 0.4, '#8a7a6a', x, G + 2, z);
      w.box(0.25, 2, 0.25, '#8a7a6a', x + 0.6, G + 3.8, z, 0, 0, -0.7);
      w.box(0.25, 1.6, 0.25, '#8a7a6a', x - 0.5, G + 3.4, z, 0, 0, 0.8);
    }

    // ---------- Korallenriff mit Glasbodenboot ----------
    const lagoon = w.shape(new THREE.PlaneGeometry(16.5, 64), '#12b0d8', 50.25, 0.95, 8, { rx: -Math.PI / 2, opacity: 0.45, emissive: '#04506e', shadow: false });
    lagoon.material.depthWrite = false;
    const CORAL = ['#ff5f7e', '#ff8a1f', '#b07bff', '#ffd23f', '#3fd0ff', '#ff3b9a', '#7ae05a'];
    for (let i = 0; i < 170; i++) {
      const cl = Math.floor(i / 7), x = 44 + ((cl * 37) % 13) + w.r(-1.2, 1.2), z = -21 + ((cl * 23) % 58) + w.r(-1.2, 1.2), c = w.pick(CORAL), k = i % 4;
      if (k === 0) { for (let j = 0; j < 3; j++) w.box(0.18, w.r(0.5, 0.9), 0.18, c, x + w.r(-0.3, 0.3), 0.75, z + w.r(-0.3, 0.3), 0, w.r(-0.4, 0.4), w.r(-0.4, 0.4)); }
      else if (k === 1) w.box(w.r(0.7, 1.3), 0.4, w.r(0.7, 1.3), c, x, 0.65, z, w.r(0, 3));
      else if (k === 2) { w.box(0.15, 0.4, 0.15, c, x, 0.65, z); w.box(1.2, 0.12, 1.2, c, x, 0.86, z, w.r(0, 3)); }
      else w.box(0.5, 0.5, 0.5, c, x, 0.7, z, w.r(0, 3), 0.3);
    }
    const st = w.station(38.5, 8, 'Glasbodenboot', '#1fb0d0', G);
    S(41.8, G, 8, 3.2, 0.5, 2.4, '#a0764e', true); // Steg
    const boat = new THREE.Group();
    part(boat, 2.6, 0.7, 5, '#ffffff', 0, 0, 0);
    part(boat, 2.8, 0.2, 5.2, '#1fb0d0', 0, 0.4, 0);
    part(boat, 2.0, 0.1, 4.2, '#8a6a4a', 0, 0.3, -0.2);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 2.4), new THREE.MeshLambertMaterial({ color: '#9ff4ff', transparent: true, opacity: 0.55, emissive: '#1a6070' }));
    glass.position.set(0, 0.37, 0.4);
    boat.add(glass);
    for (const [a, b] of [[1.1, 2], [-1.1, 2], [1.1, -2], [-1.1, -2]]) part(boat, 0.1, 2.6, 0.1, '#ffffff', a, 1.6, b);
    part(boat, 2.7, 0.15, 4.6, '#ffd23f', 0, 2.95, 0);
    const rpts = [];
    for (let i = 0; i < 14; i++) { const a = Math.PI + (i / 14) * Math.PI * 2; rpts.push([50 + Math.cos(a) * 5.5, 0.9, 8 - Math.sin(a) * 24]); }
    w.addRide(pathRide(w, {
      points: rpts, closed: true, duration: 30, vehicle: boat, seat: [0, 0.0, -1.3], flat: true,
      name: 'Glasbodenboot', starId: 'reef', station: st, exit: P(38.5, G, 11.6), idle: 'wait',
      camera(pos, fwd, out) { out.pos.set(pos.x - fwd.x * 5, pos.y + 5.5, pos.z - fwd.z * 5); out.look.set(pos.x + fwd.x * 4, pos.y - 1, pos.z + fwd.z * 4); },
      animate(v, t) { v.rotateZ(Math.sin(t * 1.3) * 0.03); },
    }));
    w.sign('Korallenriff', 40, G + 5, 0, { bg: '#1fb0d0', size: 1 });

    // ---------- Eukalyptuswald ----------
    const trees = [];
    for (const [x, z] of [[12, 18], [20, 26], [28, 16], [14, 40], [26, 44], [34, 30], [-10, 44], [-8, 12], [10, -6], [22, -10], [34, 0], [-6, -26], [-14, -48], [38, 48], [16, 52]]) trees.push([x, z, eucalyptus(x, z, w.r(0.9, 1.2))]);
    w.sign('Eukalyptuswald', 22, G + 4, 32, { bg: '#5f8a6a', size: 0.9 });

    // ---------- Tiere ----------
    const A = (kind, x, z, o = {}) => w.animal(kind, { pos: P(x, o.y ?? 0, z), ...o });
    for (const [x, z, h] of [[-8, 26, true], [-18, 36, false], [-44, 44, false], [-50, 24, false], [-20, 8, false], [-12, -30, false]]) A('kangaroo', x, z, { behavior: 'hop', radius: 6, speed: 2.4, hungry: h });
    A('emu', -24, -32, { radius: 5, speed: 1.2, hungry: true });
    A('emu', -30, -36, { radius: 5, speed: 1.1 });
    A('emu', -52, 0, { radius: 5, speed: 1.1 });
    // Koalas sitzen in den Eukalyptusbäumen
    [0, 2, 4, 5].forEach((i) => { const [x, z, top] = trees[i]; A('koala', x + 0.8, z, { y: top - 0.6, behavior: 'perch' }); });
    w.box(0.9, 0.8, 0.9, '#8a7a6a', 6, G + 0.4, 18);
    A('koala', 6, 18, { y: G + 0.8, behavior: 'perch', hungry: true });
    // Wombats (rundliche Hasen)
    A('rabbit', 18, 34, { radius: 3, speed: 0.8, color: '#7a6a5a', scale: 1.6, hungry: true });
    A('rabbit', 30, 22, { radius: 3, speed: 0.8, color: '#6b5b4b', scale: 1.5 });
    // Kakadus
    for (let i = 0; i < 3; i++) A('bird', 20, 24, { y: 10 + i * 2, behavior: 'fly', radius: 8 + i * 4, speed: (i % 2 ? -1 : 1) * 4, colors: ['#ffffff', '#f4f4f4', '#ffe066'] });
    // Riff: bunte Fische, Schildkröte; Delfine im Hafen und im Meer
    const FC = [['#ff8a1f', '#ffffff'], ['#2f6fe0', '#ffd23f'], ['#ffd23f', '#2b2b2b'], ['#ff5fb0', '#ffffff'], ['#3fd0ff', '#ff8a1f']];
    for (let i = 0; i < 9; i++) { const [c, c2] = FC[i % 5]; A('fish', w.r(46, 54), w.r(-16, 32), { y: 0.62, behavior: 'swim', radius: 3, speed: 1.2, color: c, color2: c2 }); }
    A('turtle', 52, 20, { y: 0.55, behavior: 'swim', radius: 3, speed: 0.4 });
    A('turtle', 44, 34, { y: 0.5, radius: 2, speed: 0.3, hungry: true });
    for (const [x, z] of [[24, -32], [12, -54]]) A('dolphin', x, z, { y: -0.8, behavior: 'jump', radius: 6 });
    A('dolphin', 66, 20, { y: -0.8, behavior: 'jump', radius: 8 });
    A('whale', 70, -30, { y: -0.8, behavior: 'jump', radius: 14 });

    // ---------- Münzen ----------
    w.coinLine(0, 44, 0, -12, 8, G);
    w.coinLine(4, 8, 34, 8, 6, G);
    w.coinLine(-4, 28, -22, 19, 4, G);
    w.coinRing(ULX, G, ULZ, 19, 12);
    w.coinLine(46, -16, 46, 30, 6, 0.5);
  },
};
