// Südamerika: Amazonas-Regenwald mit Fluss, Ruinenstadt auf Terrassen (Machu-Picchu-artig),
// Zuckerhut-Felsen mit Seilbahn, Strand mit Wellen-Promenade und bunte Häuser.
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal, inRects } from './common.js';
import { pathRide, part } from '../rides.js';

const G = 1;
const MX = -22, MZ = -30; // Ruinenberg
const TERR = [[6, 15], [10, 11.5], [14, 8], [18, 4.5]]; // [Radius, Höhe] der Terrassen
const supd = (x, z) => Math.pow(Math.abs(x - MX) ** 4 + Math.abs(z - MZ) ** 4, 0.25);
const ringE = (x, z) => Math.hypot((x + 34) / 14, (z - 28) / 12); // Amazonas-Schleife
const SLX = 44, SLZ = -44; // Zuckerhut

function height(x, z) {
  if (Math.abs(ringE(x, z) - 1) < 0.22) return 0;
  if (x < -46 && Math.abs(z - 28) < 3) return 0;
  const m = Math.max(Math.abs(x), Math.abs(z));
  const coast = 58.5 + 1.2 * Math.sin(x * 0.19) + 1.2 * Math.cos(z * 0.15);
  let h = m > coast + 2.5 ? 0 : m > coast ? 0.5 : G;
  if (x > 28 && z < -28) h = 0; // Bucht
  if (h > 0.5 && x > 44 && z > -28) h = 0.5; // Strand
  const c = supd(x, z);
  for (let i = 0; i < TERR.length; i++) if (c < TERR[i][0]) { h = Math.max(h, TERR[i][1]); break; }
  h = Math.max(h, 36 - Math.hypot(x + 26, z + 52) * 3.2); // spitzer Berg dahinter
  const ds = Math.hypot(x - SLX, (z - SLZ) / 1.2);
  if (ds < 9) h = Math.max(h, 6 + 22 * Math.sqrt(1 - (ds / 9) ** 2));
  const du = Math.hypot(x - 34, z + 36);
  if (du < 5) h = Math.max(h, 4 + 6 * Math.sqrt(1 - (du / 5) ** 2)); // kleiner Vorberg
  return h;
}

function color(x, z, h) {
  const n = Math.sin(x * 1.3 + z * 0.7) * Math.cos(z * 1.1 - x * 0.5);
  if (h <= 0.5) return '#f0dca0';
  if (Math.hypot(x - SLX, (z - SLZ) / 1.2) < 9.5 || Math.hypot(x - 34, z + 36) < 5.5) return h > 9 ? (n > 0.3 ? '#8f8a80' : '#a39d92') : (n > 0 ? '#5e9e48' : '#7f7a70');
  if (Math.hypot(x + 26, z + 52) < 11 && h > 16) return h > 26 ? '#7f7a70' : n > 0 ? '#3f8f3a' : '#4f9a45';
  const c = supd(x, z);
  if (c < 18) {
    for (const [R, hh] of TERR) if (c < R) return c > R - 2 && h === hh ? '#a39c8e' : (hh === 15 ? '#86c860' : n > 0.2 ? '#6cbd4f' : '#62b247');
  }
  if (x < -8 && z > -6) return n > 0.3 ? '#3f8f3a' : n < -0.3 ? '#2f7f34' : '#45963f';
  if (x > 4 && x < 30 && z < -6 && z > -42) return n > 0.2 ? '#d8c8a8' : '#cdbd9c';
  return n > 0.4 ? '#69b84f' : '#74c257';
}

export const southamerica = {
  id: 'southamerica',
  name: 'Südamerika',
  seed: 205,
  theme: {
    sky: ['#2f8fd8', '#9fe0ff', '#f0fff0'], fog: '#d0eedc', sea: '#2f9fc0', fogNear: 100, fogFar: 240,
    light: { hemi: 1.6, sun: 2.3, sunColor: '#fff4dc', sky: '#ffffff', ground: '#6d9070' },
  },
  stars: { machupicchu: 'Ruinenstadt', amazon: 'Amazonas-Boot', cablecar: 'Zuckerhut-Seilbahn' },
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
    const flowers = (cx, cz, wd, dd, n, cols) => {
      for (let i = 0; i < n; i++) {
        const x = cx + w.r(-wd / 2, wd / 2), z = cz + w.r(-dd / 2, dd / 2), y = w.heightAt(x, z);
        w.box(0.08, 0.4, 0.08, '#3c8c3c', x, y + 0.2, z);
        w.box(0.3, 0.2, 0.3, w.pick(cols), x, y + 0.48, z);
      }
    };
    // Urwaldriese mit Brettwurzeln, Lianen und Blüten
    const jungleTree = (x, z, s = 1) => {
      const y = w.heightAt(x, z), H = 9 * s;
      w.box(0.9 * s, H, 0.9 * s, '#6b5a44', x, y + H / 2, z);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; w.box(0.25, 1.6 * s, 1.4 * s, '#5b4a36', x + Math.sin(a) * 0.6 * s, y + 0.8 * s, z + Math.cos(a) * 0.6 * s, a); }
      const c1 = w.pick(['#2f7f34', '#2a7330', '#3a8a3a']), c2 = w.pick(['#45a046', '#3f9a42', '#58ad4c']);
      w.box(6 * s, 1.6 * s, 6 * s, c1, x, y + H, z, w.r(0, 1));
      w.box(4.2 * s, 1.4 * s, 4.2 * s, c2, x + 0.4 * s, y + H + 1.3 * s, z - 0.3 * s, w.r(0, 1));
      w.box(3 * s, 1 * s, 3 * s, c1, x - 1.8 * s, y + H - 0.9 * s, z + 1.5 * s);
      for (let i = 0; i < 3; i++) {
        const lx = x + w.r(-2.6, 2.6) * s, lz = z + w.r(-2.6, 2.6) * s, L = w.r(3, 6) * s;
        w.box(0.12, L, 0.12, '#4f8a2a', lx, y + H - 0.8 * s - L / 2, lz);
        if (i === 0) w.box(0.4, 0.3, 0.4, w.pick(['#ff3b7a', '#ffd23f', '#ff8a1f']), lx, y + H - 0.8 * s - L, lz);
      }
      w.solids.push({ min: P(x - 0.45 * s, y, z - 0.45 * s), max: P(x + 0.45 * s, y + 3, z + 0.45 * s) });
    };
    const fern = (x, z) => {
      const y = w.heightAt(x, z), s = w.r(0.7, 1.3);
      for (let i = 0; i < 3; i++) w.box(0.3 * s, 0.08, 1.6 * s, w.pick(['#3f9a42', '#4fae4a', '#2f8a36']), x, y + 0.4 * s, z, i * 1.05, 0.5);
    };

    // ---------- Wege, Plätze, Wellen-Pflaster ----------
    const WAVE = (x1, x2, z1, z2) => { // schwarz-weißes Wellenmuster auf hellem Grund
      w.box(x2 - x1, 0.06, z2 - z1, '#f4f1ea', (x1 + x2) / 2, G + 0.03, (z1 + z2) / 2);
      const wd = x2 - x1;
      for (let z = z1 + 0.6; z < z2; z += 0.55) {
        const off = Math.sin(z * 0.9) * wd * 0.28;
        w.box(wd * 0.22, 0.07, 0.6, '#2b2b2b', (x1 + x2) / 2 + off, G + 0.04, z, 0, 0, 0);
      }
    };
    WAVE(-3, 3, -10, 46);
    path(-3, -6, -18, -6, 3, '#d8c8a8');
    path(3, -6, 40, -6, 3, '#d8c8a8');
    path(3, 20, 40, 20, 3, '#d8c8a8');
    path(-3, 28, -12, 28, 3, '#c9a77a');
    w.cyl(6, 6, 0.08, '#e8dcc0', 0, G, -8, { seg: 24, shadow: false });
    // Brunnen auf der Plaza
    S(0, G + 0.7, -8, 4, 0.7, 4, '#d8cbb0');
    w.water(0, -8, 3.4, 3.4, { top: G + 0.75, color: '#5cc8ff' });
    w.box(0.6, 2.2, 0.6, '#d8cbb0', 0, G + 1.8, -8);
    w.box(1.6, 0.3, 1.6, '#d8cbb0', 0, G + 2.9, -8);
    w.sign('Südamerika', 0, G + 6.5, 30, { bg: '#2fbf4a', size: 1.4 });
    w.sign('¡Bienvenidos! – Willkommen!', 0, G + 5.1, 30, { bg: '#ffd23f', fg: '#17233b', size: 0.8 });
    for (const s of [-1, 1]) w.box(0.3, 6, 0.3, '#7a4a2a', s * 4.5, G + 3, 30);
    // Karnevals-Wimpel über der Allee
    const flagCols = ['#ff3b5c', '#ffd23f', '#2fbf4a', '#3fa9f5', '#ff8a1f', '#b07bff'];
    for (const z of [18, 4]) {
      w.box(9, 0.06, 0.06, '#ffffff', 0, G + 6.4, z);
      for (let i = 0; i < 9; i++) w.box(0.4, 0.4, 0.05, flagCols[i % 6], -4 + i, G + 6.1, z, 0, 0, 0.785);
      for (const s of [-1, 1]) w.box(0.25, 6.6, 0.25, '#f4f1ea', s * 4.6, G + 3.3, z);
    }
    for (const z of [46, 38, 30, 14, 4]) for (const s of [-1, 1]) w.tree('palm', s * 6.2, z, 0.95, G, true);
    flowers(-8, 40, 4, 10, 20, ['#ff3b7a', '#ffd23f', '#ff8a1f']);
    flowers(8, 40, 4, 10, 20, ['#ff3b7a', '#ffd23f', '#b07bff']);

    // ---------- Bunte Häuser ----------
    const HC = ['#ff5f7e', '#ffd23f', '#3fbfd8', '#8ac926', '#ff8a1f', '#b07bff', '#2fbfa0', '#f15bb5'];
    let hi = 0;
    for (const z of [-38, -28, -18]) for (const x of [7, 13, 19, 25]) {
      if (x === 25 && z === -18) continue;
      const h = 4 + ((hi * 7) % 4);
      w.house(x, z, 5, 5, h, { wall: HC[hi % HC.length], roof: hi % 3 ? 'gable' : 'flat', roofColor: '#c8643c', door: 's', window: '#ffffff', shutters: hi % 2 ? '#2b5fae' : '#ffffff', y: G });
      if (hi % 3 === 0) { w.box(0.08, 0.08, 4.4, '#ffffff', x + 2.6, G + h + 0.6, z); for (let k = 0; k < 4; k++) w.box(0.5, 0.6, 0.05, flagCols[(k + hi) % 6], x + 2.6, G + h + 0.25, z - 1.5 + k); }
      hi++;
    }
    path(4, -42, 4, -10, 2, '#cdbd9c');
    path(4, -23, 28, -23, 2, '#cdbd9c');
    path(4, -33, 28, -33, 2, '#cdbd9c');
    w.sign('Bunte Altstadt', 18, G + 9, -12, { bg: '#ff5f7e', size: 1 });

    // ---------- Ruinenstadt auf Terrassen ----------
    // Hof am Fuß des Berges mit Tor; „fliegende Treppen“ (Steine aus der Mauer) führen hoch
    const STONE = '#9a9488';
    S(MX - 4, G + 4.4, -8.5, 0.8, 4.4, 7, STONE);
    S(MX + 4, G + 4.4, -8.5, 0.8, 4.4, 7, STONE);
    S(MX - 2.85, G + 4.4, -5, 3.1, 4.4, 0.8, STONE);
    S(MX + 2.85, G + 4.4, -5, 3.1, 4.4, 0.8, STONE);
    S(MX, G + 4.4, -5, 2.6, 1.0, 0.8, STONE);
    for (const s of [-1, 1]) w.box(1.2, 0.9, 1.2, '#8a8478', MX + s * 4, G + 4.85, -5);
    w.gateAt(P(MX, G, -5), 's', 'Ruinenstadt');
    const levels = [G, 4.5, 8, 11.5, 15], walls = [MZ + 18, MZ + 14, MZ + 10, MZ + 6];
    walls.forEach((wz, k) => {
      const L = levels[k];
      S(MX - 1.2, L + 1.15, wz + 0.5, 1.4, 0.4, 1.0, '#b5ad9e');
      S(MX + 1.2, L + 2.3, wz + 0.5, 1.4, 0.4, 1.0, '#b5ad9e');
      w.coin(MX + 1.2, L + 2.3, wz + 0.5);
    });
    // Ruinen oben: Mauerreste ohne Dach, Strohdach-Häuser, Sonnenstein
    const T = 15;
    const ruin = (x, z, wd, dd, h, thatch) => {
      for (const s of [-1, 1]) { S(x, T + h, z + s * dd / 2, wd, h, 0.5, STONE); S(x + s * wd / 2, T + h, z, 0.5, h, dd, STONE); }
      w.box(0.8, 1, 0.55, '#3b3a36', x, T + h - 1.1, z + dd / 2, 0);
      if (thatch) for (const s of [-1, 1]) w.box(wd + 0.6, 0.3, dd * 0.62, '#c8a85a', x, T + h + dd * 0.18, z + s * dd * 0.25, 0, s * 0.6);
    };
    ruin(MX - 3, MZ - 3, 3.4, 3, 1.8, true);
    ruin(MX + 3, MZ - 3.2, 3.2, 2.6, 1.4, false);
    ruin(MX - 4, MZ + 2.6, 2.6, 2.6, 1.6, true);
    w.box(1.2, 1, 1.2, '#b5ad9e', MX + 3, T + 0.5, MZ + 2.5);
    w.box(0.5, 1.2, 0.8, '#b5ad9e', MX + 3, T + 1.6, MZ + 2.5);
    w.star('machupicchu', MX, T, MZ, 'Ruinenstadt');
    w.sign('Ruinenstadt', MX, T + 6, MZ + 4, { bg: '#7a6a50', size: 1 });
    for (let k = 1; k < 4; k++) w.coinLine(MX - 3, walls[k] + 2, MX - 7, walls[k] + 2, 2, levels[k]);

    // ---------- Zuckerhut mit Seilbahn ----------
    const topY = w.heightAt(SLX, SLZ);
    S(SLX, topY + 0.6, SLZ, 5, 1.2, 5, '#d8d2c4');
    w.box(4, 3, 2.4, '#e8e2d4', SLX, topY + 2.1, SLZ - 1.2);
    w.box(4.4, 0.3, 2.8, '#c8643c', SLX, topY + 3.7, SLZ - 1.2);
    const bot = [30, G + 7, -20], tp = [SLX, topY + 7.5, SLZ + 2.5];
    S(30, G + 6.4, -20.5, 2.2, 6.4, 1.2, null);
    w.box(0.6, 6.4, 0.6, '#c8ccd2', 29, G + 3.2, -21);
    w.box(0.6, 6.4, 0.6, '#c8ccd2', 31, G + 3.2, -21);
    w.box(3, 0.6, 1.4, '#e8262b', 30, G + 6.7, -21);
    for (const s of [-1, 1]) w.box(0.4, 7.5, 0.4, '#c8ccd2', SLX + s * 1.6, topY + 3.75, SLZ + 2.5);
    w.box(3.6, 0.5, 0.6, '#e8262b', SLX, topY + 7.6, SLZ + 2.5);
    for (const off of [-0.25, 0.25]) beam([bot[0] + off, bot[1], bot[2]], [tp[0] + off, tp[1], tp[2]], 0.08, '#30343a');
    const st = w.station(30, -17, 'Seilbahn', '#e8262b', G);
    const gon = new THREE.Group();
    part(gon, 0.15, 0.7, 0.15, '#30343a', 0, -0.35, 0);
    part(gon, 0.8, 0.3, 0.6, '#30343a', 0, 0, 0);
    part(gon, 2.6, 0.25, 2.6, '#e8262b', 0, -0.75, 0);
    for (const [a, b] of [[1.1, 1.1], [-1.1, 1.1], [1.1, -1.1], [-1.1, -1.1]]) part(gon, 0.15, 2.3, 0.15, '#ffffff', a, -2.0, b);
    part(gon, 2.4, 0.4, 2.4, '#e8262b', 0, -3.25, 0);
    part(gon, 2.4, 0.6, 0.1, '#ffffff', 0, -2.75, 1.15);
    part(gon, 2.4, 0.6, 0.1, '#ffffff', 0, -2.75, -1.15);
    part(gon, 0.1, 0.6, 2.4, '#ffffff', 1.15, -2.75, 0);
    part(gon, 0.1, 0.6, 2.4, '#ffffff', -1.15, -2.75, 0);
    const N = 8, cpts = [];
    for (let i = 0; i <= N; i++) { const t = i / N; cpts.push([bot[0] + (tp[0] - bot[0]) * t, bot[1] + (tp[1] - bot[1]) * t - Math.sin(t * Math.PI) * 0.8, bot[2] + (tp[2] - bot[2]) * t]); }
    for (let i = N - 1; i >= 0; i--) cpts.push(cpts[i].slice());
    w.addRide(pathRide(w, {
      points: cpts, closed: false, duration: 30, vehicle: gon, seat: [0, -3.05, -0.3], flat: true,
      name: 'Zuckerhut-Seilbahn', starId: 'cablecar', station: st, exit: P(30, G, -13.4), idle: 'wait',
      camera(pos, fwd, out) { out.pos.set(pos.x - 9, pos.y + 2.5, pos.z + 6); out.look.set(pos.x + 2, pos.y - 1, pos.z - 3); },
      animate(v, t) { v.rotateX(Math.sin(t * 1.7) * 0.04); },
    }));
    w.sign('Zuckerhut', SLX, topY + 7.5, SLZ, { bg: '#e8262b', size: 1 });

    // ---------- Strand & Promenade ----------
    WAVE(38.5, 43.8, -26, 56);
    for (let z = -24; z <= 54; z += 3) w.box(0.25, 0.5, 0.25, '#f4f1ea', 43.6, G + 0.25, z);
    for (const z of [-20, -6, 8, 22, 36, 50]) w.tree('palm', 47, z, 1.05, 0.5, true);
    const umbrella = (x, z, c) => {
      w.box(0.12, 2.6, 0.12, '#ffffff', x, 0.5 + 1.3, z);
      w.box(2.6, 0.2, 2.6, c, x, 0.5 + 2.6, z, 0.4);
      w.box(1.8, 0.25, 1.8, c, x, 0.5 + 2.8, z, 1.2);
      w.box(0.9, 0.08, 2, '#ffffff', x + 1.4, 0.55, z + 0.4, 0.2);
    };
    [[52, -14, '#ff3b5c'], [54, -2, '#ffd23f'], [51, 14, '#3fa9f5'], [53, 28, '#2fbf4a'], [52, 42, '#ff8a1f']].forEach(([x, z, c]) => umbrella(x, z, c));
    for (const s of [-1, 1]) w.box(0.15, 2.4, 0.15, '#ffffff', 53, 0.5 + 1.2, 6 + s * 4);
    w.box(0.05, 0.8, 8, '#f4f1ea', 53, 0.5 + 2.0, 6);
    w.box(2.4, 2.2, 2.4, '#3fbfd8', 41.5, G + 1.1, 2);
    w.box(3, 0.3, 3, '#ffd23f', 41.5, G + 2.35, 2);
    w.sign('Strand-Promenade', 42, G + 4, 18, { bg: '#3fa9f5', size: 0.9 });

    // ---------- Amazonas-Regenwald ----------
    const RC = [-34, 28];
    const st2 = w.station(-12.5, 28, 'Amazonas-Boot', '#2f8a3c', G);
    S(-15.7, G, 28, 3, 0.4, 2.4, '#8a5e33', true); // Bootssteg
    const boat = new THREE.Group();
    part(boat, 2.4, 0.8, 5.2, '#8a5e33', 0, 0, 0);
    part(boat, 2.6, 0.2, 5.4, '#ffd23f', 0, 0.45, 0);
    part(boat, 1.9, 0.15, 4.4, '#c49a6c', 0, 0.35, 0);
    for (const [a, b] of [[1, 1.8], [-1, 1.8], [1, -1.8], [-1, -1.8]]) part(boat, 0.12, 1.9, 0.12, '#5b3a1e', a, 1.3, b);
    part(boat, 2.6, 0.2, 4.2, '#2fbf4a', 0, 2.3, 0);
    part(boat, 0.6, 0.6, 0.8, '#30343a', 0, 0.7, -2.2);
    const rpts = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; rpts.push([RC[0] + Math.cos(a) * 14, -0.6, RC[1] - Math.sin(a) * 12]); }
    w.addRide(pathRide(w, {
      points: rpts, closed: true, duration: 28, vehicle: boat, seat: [0, -0.35, -0.6], flat: true,
      name: 'Amazonas-Boot', starId: 'amazon', station: st2, exit: P(-12.5, G, 31.6), idle: 'wait',
      animate(v, t) { v.rotateZ(Math.sin(t * 1.4) * 0.04); v.position.y += Math.sin(t * 2) * 0.05; },
    }));
    w.sign('Amazonas', -20, G + 5, 21, { bg: '#2f8a3c', size: 1 });
    // dichter Wald (innen auf der Flussinsel und außen)
    let nt = 0;
    for (let k = 0; k < 1500 && nt < 46; k++) {
      const x = w.r(-58, -10), z = w.r(-2, 57);
      const e = ringE(x, z);
      if (Math.abs(e - 1) < 0.36 || (x < -44 && Math.abs(z - 28) < 5)) continue;
      if (inRects(x, z, [[-16, 23, -8, 33], [-14, 25, -2, 31], [-58, -6, -2, 0]])) continue;
      if (Math.abs(x + 22) < 7 && z < 9) continue;
      jungleTree(x, z, w.r(0.8, 1.15));
      nt++;
    }
    for (let i = 0; i < 70; i++) {
      const x = w.r(-58, -9), z = w.r(-3, 57);
      if (Math.abs(ringE(x, z) - 1) < 0.3 || inRects(x, z, [[-16, 24, -8, 32]])) continue;
      fern(x, z);
    }
    for (let i = 0; i < 14; i++) { // Bromelien und Riesenblätter am Ufer
      const a = w.r(0, Math.PI * 2), r = w.r(1.35, 1.45), x = RC[0] + Math.cos(a) * 14 * r, z = RC[1] + Math.sin(a) * 12 * r;
      if (x > -18 && Math.abs(z - 28) < 5) continue;
      w.box(0.9, 0.5, 0.9, w.pick(['#ff3b7a', '#ff8a1f', '#ffd23f']), x, w.heightAt(x, z) + 0.25, z, a);
    }

    // ---------- Tiere ----------
    const A = (kind, x, z, o = {}) => w.animal(kind, { pos: P(x, o.y ?? 0, z), ...o });
    // Lamas am Berg und oben in der Ruinenstadt
    A('llama', -10, -10, { radius: 3, speed: 0.8, color: '#f2ead8', hungry: true });
    A('llama', -8, -14, { radius: 3, speed: 0.7, color: '#8a5a2b' });
    A('llama', -34, -6, { radius: 3, speed: 0.7, color: '#d9c4a0' });
    A('llama', MX + 2, MZ - 1, { radius: 2.5, speed: 0.6, color: '#ffffff' });
    A('llama', MX - 1, MZ + 3, { radius: 2, speed: 0.6, color: '#6b4423' });
    // Affen im Wald, ein Faultier hängt kopfüber am Ast
    A('monkey', -10, 36, { radius: 3, speed: 1.4, hungry: true });
    A('monkey', -14, 44, { radius: 4, speed: 1.6 });
    A('monkey', -30, 4, { radius: 4, speed: 1.5 });
    const branch = (x, z, y, len = 3) => { w.box(len, 0.3, 0.3, '#6b5a44', x, y, z); w.box(0.5, y - G, 0.5, '#6b5a44', x - len / 2, (y + G) / 2, z); };
    branch(-12, 50, G + 4.2); A('monkey', -11.5, 50, { y: G + 4.35, behavior: 'perch' });
    branch(-26, -2, G + 3.6);
    const sloth = A('monkey', -25.5, -2, { y: G + 3.45, behavior: 'perch', scale: 1.2 });
    sloth.g.rotation.set(Math.PI, 0.3, 0);
    // Tukane: schwarz mit weißer Kehle und großem orangem Schnabel
    const toucan = (a) => {
      part(a.body, 0.3, 0.22, 0.05, '#ffffff', 0, 0.26, 0.31);
      part(a.body, 0.18, 0.22, 0.6, '#ff8a1f', 0, 0.34, 0.55);
      part(a.body, 0.19, 0.1, 0.12, '#1a1a1a', 0, 0.3, 0.84);
      part(a.body, 0.1, 0.1, 0.03, '#3fa9f5', 0.17, 0.42, 0.24);
      part(a.body, 0.1, 0.1, 0.03, '#3fa9f5', -0.17, 0.42, 0.24);
      return a;
    };
    const tc = ['#1a1a1a', '#1a1a1a', '#2b2b2b'];
    toucan(A('bird', -30, 26, { y: 12, behavior: 'fly', radius: 8, speed: 3.5, colors: tc, scale: 1.4 }));
    toucan(A('bird', -40, 40, { y: 13, behavior: 'fly', radius: 6, speed: -3, colors: tc, scale: 1.4 }));
    w.box(0.4, 1.3, 0.4, '#6b5a44', -6, G + 0.65, 33);
    toucan(A('bird', -6, 33, { y: G + 1.3, behavior: 'perch', colors: tc, scale: 1.3, hungry: true }));
    // Aras (Papageien)
    const mc = [['#e8262b', '#ffd23f', '#1f7de0'], ['#1f7de0', '#ffd23f', '#1d56b3'], ['#2fbf4a', '#e8262b', '#1f7de0']];
    for (let i = 0; i < 3; i++) A('parrot', -34, 28, { y: 14 + i * 2, behavior: 'fly', radius: 16 + i * 4, speed: (i % 2 ? -1 : 1) * 4, colors: mc[i] });
    w.box(0.3, 1.5, 0.3, '#6b5a44', 6.5, G + 0.75, -4);
    w.box(1.2, 0.15, 0.2, '#6b5a44', 6.5, G + 1.5, -4);
    A('parrot', 6.5, -4, { y: G + 1.55, behavior: 'perch', colors: mc[1], hungry: true, scale: 1.2 });
    // Schildkröten am Strand und im Fluss
    A('turtle', 50, 22, { y: 0.5, radius: 3, speed: 0.4, hungry: true });
    A('turtle', 55, -8, { y: 0.5, radius: 3, speed: 0.35 });
    A('turtle', -34, 40, { y: -0.85, behavior: 'swim', radius: 2, speed: 0.5 });
    // Rosa Flussdelfine im Amazonas, graue Delfine im Meer
    const pink = new THREE.MeshLambertMaterial({ color: '#f29cb4' }), pinkB = new THREE.MeshLambertMaterial({ color: '#ffd6e0' });
    for (const [x, z] of [[-34, 16], [-48, 28], [-27, 39]]) {
      const d = A('dolphin', x, z, { y: -0.8, behavior: 'jump', radius: 3 });
      d.g.traverse((m) => { if (m.material?.color) { const hx = m.material.color.getHexString(); if (hx === '7b93a8' || hx === '6a8197') m.material = pink; else if (hx === 'e8eef3') m.material = pinkB; } });
    }
    for (const [x, z] of [[66, 10], [64, 34], [36, -54]]) A('dolphin', x, z, { y: -0.8, behavior: 'jump', radius: 8 });
    for (let i = 0; i < 3; i++) A('butterfly', w.r(-30, -10), w.r(0, 50), { y: G + 1.5, behavior: 'flutter', radius: 4, color: w.pick(['#3fa9f5', '#ffd23f', '#ff3b7a']) });
    w.sign('Rosa Flussdelfine!', -34, G + 4.5, 12, { bg: '#f29cb4', fg: '#17233b', size: 0.7 });

    // ---------- Münzen ----------
    w.coinLine(0, 44, 0, -2, 8, G);
    w.coinLine(6, -6, 36, -6, 6, G);
    w.coinLine(-4, 28, -10, 28, 2, G);
    w.coinLine(MX, -2, MX, -10, 3, G);
    w.coinLine(42, -20, 42, 50, 9, G);
    w.coinLine(6, -23, 26, -23, 6, G);
    w.coinLine(8, 20, 36, 20, 5, G);
  },
};
