// Teneriffa: offene Insel nach echten Koordinaten. 1 Einheit = 200 m in der Fläche, 100 m in der Höhe.
// Norden = −z, Osten = +x. Teide, Las Cañadas, Anaga, Teno, Masca, Orte, Straßen und das Wolkenmeer im Norden.
import * as THREE from '../../vendor/three.module.min.js';
import { pathRide, part } from '../rides.js';
import { studTexture } from '../blocks.js';

const LON0 = -16.52, LAT0 = 28.29, KX = 490, KZ = 555;
const geo = (lon, lat) => [(lon - LON0) * KX, -(lat - LAT0) * KZ];

// Küstenlinie im Uhrzeigersinn ab Punta de Teno
const COAST = [
  [-16.921, 28.342], [-16.905, 28.320], [-16.870, 28.290], [-16.842, 28.247], [-16.840, 28.235], [-16.815, 28.180],
  [-16.785, 28.125], [-16.745, 28.085], [-16.717, 28.047], [-16.705, 28.000], [-16.660, 28.008], [-16.600, 28.020],
  [-16.540, 28.032], [-16.500, 28.070], [-16.433, 28.155], [-16.405, 28.220], [-16.372, 28.290], [-16.367, 28.352],
  [-16.322, 28.400], [-16.245, 28.457], [-16.190, 28.505], [-16.150, 28.540], [-16.125, 28.580], [-16.200, 28.570],
  [-16.260, 28.567], [-16.325, 28.580], [-16.345, 28.555], [-16.410, 28.515], [-16.470, 28.465], [-16.550, 28.420],
  [-16.620, 28.392], [-16.650, 28.395], [-16.720, 28.375], [-16.765, 28.376], [-16.860, 28.375], [-16.900, 28.365],
].map(([lo, la]) => geo(lo, la));

function insideCoast(x, z) {
  let c = false;
  for (let i = 0, j = COAST.length - 1; i < COAST.length; j = i++) {
    const [xi, zi] = COAST[i], [xj, zj] = COAST[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
function segDist(x, z, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
  const t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0;
  return Math.hypot(x - ax - dx * t, z - az - dz * t);
}
function coastDist(x, z) {
  let d = Infinity;
  for (let i = 0, j = COAST.length - 1; i < COAST.length; j = i++) d = Math.min(d, segDist(x, z, ...COAST[j], ...COAST[i]));
  return d;
}
function lineDist(x, z, pts) {
  let d = Infinity;
  for (let i = 1; i < pts.length; i++) d = Math.min(d, segDist(x, z, ...pts[i - 1], ...pts[i]));
  return d;
}

// Wertrauschen (deterministisch)
function hash(i, j) {
  let h = (i * 374761393 + j * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return (a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz) * 2 - 1;
}

const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

// Wichtige Punkte
const P = {
  teide: geo(-16.6425, 28.2724), pico: geo(-16.665, 28.255), caldera: geo(-16.62, 28.24),
  cableBase: geo(-16.6148, 28.2557),
  roques: geo(-16.630, 28.220), parador: geo(-16.638, 28.226), portillo: geo(-16.564, 28.303), tauce: geo(-16.684, 28.212),
  santaCruz: geo(-16.2546, 28.4636), auditorio: geo(-16.2490, 28.4565), laguna: geo(-16.3159, 28.4853), tfn: geo(-16.3415, 28.4827),
  teresitas: geo(-16.186, 28.508), anagaFaro: geo(-16.135, 28.574), taganana: geo(-16.205, 28.562),
  puerto: geo(-16.5490, 28.4140), loro: geo(-16.5640, 28.4100), martianez: geo(-16.5400, 28.4175), orotava: geo(-16.5230, 28.3900),
  icod: geo(-16.7203, 28.3667), garachico: geo(-16.7640, 28.3720), buenavista: geo(-16.858, 28.372), tenoFaro: geo(-16.9185, 28.3415),
  masca: geo(-16.8420, 28.3060), mascaBeach: geo(-16.8615, 28.2905), gigantes: geo(-16.8395, 28.2445), santiago: geo(-16.815, 28.296),
  sanJuan: geo(-16.813, 28.182), americas: geo(-16.728, 28.062), cristianos: geo(-16.716, 28.052), medano: geo(-16.538, 28.046),
  roja: geo(-16.548, 28.031), airport: geo(-16.572, 28.047), vilaflor: geo(-16.636, 28.157), granadilla: geo(-16.578, 28.118),
  candelaria: geo(-16.371, 28.354), guimar: geo(-16.413, 28.321), adeje: geo(-16.726, 28.122),
};

// Bergstation La Rambleta: 7 Einheiten unterhalb des Gipfels in Richtung Talstation
P.cableTop = (() => { const dx = P.cableBase[0] - P.teide[0], dz = P.cableBase[1] - P.teide[1], l = Math.hypot(dx, dz); return [P.teide[0] + dx / l * 7, P.teide[1] + dz / l * 7]; })();

const DORSAL = [geo(-16.565, 28.300), geo(-16.47, 28.37), geo(-16.37, 28.44)];
const ANAGA = [geo(-16.30, 28.535), geo(-16.22, 28.548), geo(-16.14, 28.565)];
const MASCA_GORGE = [geo(-16.8465, 28.3015), geo(-16.852, 28.296), P.mascaBeach];
const OROTAVA = [P.puerto, geo(-16.535, 28.37), geo(-16.555, 28.33)];

// Straßen (TF-1, TF-5/TF-42, TF-21, TF-436)
const ROADS = [
  [P.santaCruz, geo(-16.30, 28.42), P.candelaria, geo(-16.39, 28.30), geo(-16.44, 28.17), geo(-16.50, 28.09), P.airport, geo(-16.65, 28.06), P.cristianos, P.americas, P.adeje],
  [P.santaCruz, P.laguna, geo(-16.41, 28.47), geo(-16.49, 28.43), P.puerto, geo(-16.62, 28.388), P.icod, P.garachico, P.buenavista],
  [P.orotava, geo(-16.50, 28.35), geo(-16.53, 28.32), P.portillo, P.cableBase, P.parador, P.tauce, geo(-16.66, 28.18), P.vilaflor, P.granadilla, P.airport],
  [P.adeje, geo(-16.80, 28.20), P.gigantes, P.santiago, P.masca, P.buenavista],
];

// Ebene Flächen für Orte, Stationen, Parks (x, z, Radius in Einheiten)
const PADS = [
  [...P.teide, 3.2, 1.5], [...P.airport, 11, 45], [...P.cableBase, 4], [...P.cableTop, 2.5, 2], [...P.parador, 4],
  [...P.icod, 8], [...P.guimar, 9], [...P.tenoFaro, 6], [...P.mascaBeach, 4], [...P.gigantes, 5], [...P.masca, 4],
  [...P.loro, 7], [...P.santaCruz, 7], [...P.laguna, 6], [...P.candelaria, 4], [...P.medano, 4], [...P.tfn, 9],
];

function baseHeight(x, z) {
  const inIsland = insideCoast(x, z);
  // Roque de Garachico (kleine Felsinsel) und Montaña Roja ragen aus dem Meer/Strand
  const [rgx, rgz] = geo(-16.762, 28.381);
  const islet = Math.max(0, 90 - Math.hypot(x - rgx, z - rgz) * 70);
  if (!inIsland) return islet > 0 ? islet : -100;
  const d = coastDist(x, z), dk = d / 5;
  // Flach an der Küste, steiler im Inneren (Flughafen Süd ~60 m, Vilaflor ~1400 m)
  let h = 2050 * (1 - Math.exp(-((dk / 8) ** 2)));
  // Cumbre Dorsal: Rücken vom Teide nach La Laguna
  const dd = lineDist(x, z, DORSAL);
  const tDors = Math.max(0, Math.min(1, (x - DORSAL[0][0]) / (DORSAL[2][0] - DORSAL[0][0])));
  h = Math.max(h, (2050 - tDors * 1100) * Math.exp(-((dd / 16) ** 2)) * Math.min(1, dk / 2));
  // Anaga und Teno: zerklüftete Gebirge
  const da = lineDist(x, z, ANAGA);
  const anaga = 950 * Math.exp(-((da / 9) ** 2)) * Math.min(1, dk / 0.7);
  const [tx, tz] = geo(-16.84, 28.33);
  const teno = 1050 * Math.exp(-((Math.hypot(x - tx, z - tz) / 22) ** 2)) * Math.min(1, dk / 0.35);
  h = Math.max(h, anaga, teno);
  const rugged = Math.exp(-((da / 14) ** 2)) + Math.exp(-((Math.hypot(x - tx, z - tz) / 26) ** 2));
  // Orotava-Tal und Masca-Schlucht
  h -= 500 * Math.exp(-((lineDist(x, z, OROTAVA) / 14) ** 2)) * smooth(0.5, 3, dk);
  h -= 650 * Math.exp(-((lineDist(x, z, MASCA_GORGE) / 2.2) ** 2));
  // Las Cañadas: Caldera mit flachem Boden und Steilwand (Lücken bei Boca de Tauce und El Portillo)
  const ex = (x - P.caldera[0]) / 40, ez = (z - P.caldera[1]) / 27;
  const e = Math.hypot(ex, ez);
  const ang = Math.atan2(ez, ex);
  if (e < 1) h = 2150 + noise(x / 9, z / 9) * 25;
  const gap = Math.max(Math.exp(-(((x - P.tauce[0]) ** 2 + (z - P.tauce[1]) ** 2) / 60)), Math.exp(-(((x - P.portillo[0]) ** 2 + (z - P.portillo[1]) ** 2) / 120)));
  if (ang > -0.6 && e > 0.88 && e < 1.25) h = Math.max(h, 2150 + 420 * Math.exp(-(((e - 1.02) / 0.07) ** 2)) * (1 - gap));
  // Teide und Pico Viejo
  const rt = Math.hypot(x - P.teide[0], z - P.teide[1]);
  if (rt < 17.5) h = Math.max(h, 3718 - 1520 * (rt / 17.5) ** 0.9);
  const rp = Math.hypot(x - P.pico[0], z - P.pico[1]);
  if (rp < 12) h = Math.max(h, 3135 - 950 * (rp / 12));
  if (rp < 2.2) h -= 120; // Krater des Pico Viejo
  // Montaña Roja
  const rr = Math.hypot(x - P.roja[0], z - P.roja[1]);
  if (rr < 4) h = Math.max(h, 171 * (1 - rr / 4) + 20);
  // Rauschen (weniger auf Straßen, mehr in Anaga/Teno)
  const road = Math.min(...ROADS.map((r) => lineDist(x, z, r)));
  const amp = (e < 1 || rt < 17.5 ? 15 : 45 + 160 * Math.min(1, rugged)) * smooth(1.2, 5, road);
  h += (noise(x / 7, z / 7) * 0.7 + noise(x / 2.6, z / 2.6) * 0.3) * amp;
  // Küste: Strände flach, Klippen bei Los Gigantes/Teno
  const cliff = Math.hypot(x - P.gigantes[0], z - P.gigantes[1]) < 18 || Math.hypot(x - tx, z - tz) < 26;
  h *= cliff ? Math.min(1, dk / 0.1) : smooth(0, 0.5, dk) * 0.85 + 0.15 * Math.min(1, dk / 0.1);
  return Math.max(h, 8 + islet);
}

const padCache = PADS.map(([x, z, r, f = 12]) => [x, z, r, null, f]);
// Ebene Fläche mit weichem Übergang (Rand 8 Einheiten), damit keine Klippen an den Rändern entstehen
function heightM(x, z) {
  const base = baseHeight(x, z);
  let best = null, bestD = Infinity;
  for (const p of padCache) {
    const d = Math.hypot(x - p[0], z - p[1]) - p[2];
    if (d < p[4] && d < bestD) { best = p; bestD = d; }
  }
  if (!best || base < 0) return base;
  if (best[3] === null) best[3] = baseHeight(best[0], best[1]);
  const t = smooth(0, best[4], bestD);
  return best[3] * (1 - t) + base * t;
}

// Nordseite (Passat, grün) gegenüber trockenem Süden
function northness(x, z) {
  if (x > DORSAL[0][0]) {
    const t = (x - DORSAL[0][0]) / (DORSAL[2][0] - DORSAL[0][0]);
    const lineZ = DORSAL[0][1] + (DORSAL[2][1] - DORSAL[0][1]) * Math.min(1.4, t);
    return (lineZ - z) / 12;
  }
  return (P.teide[1] + 4 - z) / 12;
}

function colorAt(x, z, h) {
  const m = h * 100;
  const v = noise(x / 3, z / 3) * 0.06;
  const c = new THREE.Color();
  const n = northness(x, z);
  const rt = Math.hypot(x - P.teide[0], z - P.teide[1]), rp = Math.hypot(x - P.pico[0], z - P.pico[1]);
  const ex = (x - P.caldera[0]) / 40, ez = (z - P.caldera[1]) / 27;
  if (m < 70) c.set(n > 0 || x < -120 ? '#3d3a38' : '#e6cd8c');                       // schwarzer/goldener Sand
  else if (Math.hypot(x - P.roja[0], z - P.roja[1]) < 4) c.set('#b5532c');            // Montaña Roja
  else if (rt < 17 && m > 2300) c.set(m > 3450 ? '#d8cbb3' : (noise(x / 2, z / 2) > 0.2 ? '#4a3f3a' : '#7a5040')); // Teide
  else if (rp < 12 && m > 2300) c.set('#5a4a44');
  else if (Math.hypot(ex, ez) < 1) c.set(noise(x / 6, z / 6) > 0.25 ? '#4a4442' : '#cdb488');          // Caldera: Lava und Bimsstein
  else if (m > 2200) c.set('#a08c6a');
  else if (m > 1050) c.set(n > -0.3 ? '#3d7a3a' : '#4a8040');                         // Kanarenkiefern-Gürtel
  else if (lineDist(x, z, ANAGA) < 14) c.set('#2f6a3a');                              // Lorbeerwald Anaga
  else if (n > 0) c.set(m < 500 ? '#6aa84a' : '#56963f');                             // grüner Norden
  else c.set(m < 400 ? '#c9a46a' : '#b39062');                                        // trockener Süden
  return c.offsetHSL(0, 0, v).getHex();
}

// ---------- Bau-Helfer ----------
const WALLS = ['#ffffff', '#f6f1e7', '#f2d16b', '#e8b04a', '#d2693c', '#5b8fd6', '#7fb069', '#e89aa8', '#ffffff', '#f6f1e7'];

// Leichtes Haus: Deko-Quader + Kollisionskasten (keine eigenen Meshes → sehr billig)
function lightHouse(w, x, z, wd, dp, h, o = {}) {
  const y = w.heightAt(x, z);
  const wall = o.wall || w.pick(WALLS);
  w.box(wd, h + 1.5, dp, wall, x, y + (h - 1.5) / 2, z);
  w.solids.push({ min: new THREE.Vector3(x - wd / 2, y - 1.5, z - dp / 2), max: new THREE.Vector3(x + wd / 2, y + h, z + dp / 2), safe: true });
  const floors = Math.max(1, Math.floor(h / 2.8));
  for (let f = 0; f < floors; f++) {
    const wy = y + 1.5 + f * 2.8;
    for (const s of [-1, 1]) {
      w.box(0.8, 1.0, 0.06, o.window || '#3d5a80', x - wd / 4, wy, z + s * (dp / 2 + 0.02));
      w.box(0.8, 1.0, 0.06, o.window || '#3d5a80', x + wd / 4, wy, z + s * (dp / 2 + 0.02));
      if (o.balcony && f > 0) w.box(1.4, 0.9, 0.5, o.balcony, x + wd / 4, wy - 0.4, z + s * (dp / 2 + 0.25));
    }
  }
  w.box(1, 1.9, 0.07, '#6b4423', x, y + 0.95, z + dp / 2 + 0.03);
  if (o.roof === 'tile') {
    const rh = Math.min(wd, dp) * 0.3;
    w.box(wd + 0.4, 0.25, dp * 0.62, '#b5532c', x, y + h + rh / 2, z + dp / 4, 0, 0.55);
    w.box(wd + 0.4, 0.25, dp * 0.62, '#b5532c', x, y + h + rh / 2, z - dp / 4, 0, -0.55);
  } else {
    w.box(wd + 0.2, 0.3, dp + 0.2, o.roofColor || '#e9e4da', x, y + h + 0.15, z);
  }
  return y + h;
}

function town(w, cx, cz, r, n, o = {}) {
  const placed = [];
  for (let k = 0; k < n * 8 && placed.length < n; k++) {
    const a = w.r(0, Math.PI * 2), d = Math.sqrt(w.rng()) * r;
    const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    const wd = w.r(o.minW || 3, o.maxW || 5), dp = w.r(o.minW || 3, o.maxW || 5);
    if (w.heightAt(x, z) <= 0.4 || w.heightAt(x + wd / 2, z) <= 0.4 || w.heightAt(x, z + dp / 2) <= 0.4) continue;
    if (placed.some(([px, pz, pw]) => Math.abs(px - x) < (pw + wd) / 2 + 1.2 && Math.abs(pz - z) < (pw + dp) / 2 + 1.2)) continue;
    if (o.avoid && o.avoid(x, z)) continue;
    const h = w.r(o.minH || 3, o.maxH || 5.5);
    lightHouse(w, x, z, wd, dp, h, { roof: o.roof, balcony: o.balcony, wall: o.walls ? w.pick(o.walls) : undefined });
    placed.push([x, z, Math.max(wd, dp)]);
  }
  for (let i = 0; i < Math.ceil(n / 4); i++) palm(w, cx + w.r(-r, r), cz + w.r(-r, r));
  return placed;
}

function palm(w, x, z) {
  if (w.heightAt(x, z) <= 0.3) return;
  w.tree('palm', x, z, w.r(0.8, 1.2), w.heightAt(x, z), false);
}

function road(w, pts, coins = 0) {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
    const len = Math.hypot(bx - ax, bz - az), n = Math.ceil(len / 2);
    const ry = Math.atan2(bx - ax, bz - az);
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      const h = w.heightAt(x, z);
      if (h <= 0) continue;
      w.box(2.4, 0.12, 2.3, '#4a4d52', x, h + 0.04, z, ry);
      if (k % 2 === 0) w.box(0.15, 0.13, 0.9, '#f2f2f2', x, h + 0.05, z, ry);
      acc += 2;
      if (coins && acc % coins < 2) w.coin(x, h, z);
    }
  }
}

function sign(w, text, [x, z], dy = 6, o = {}) {
  w.sign(text, x, w.heightAt(x, z) + dy, z, { bg: o.bg || '#1f8fc9', fg: o.fg || '#ffffff', size: o.size || 1.2 });
}

// Leuchtturm als Wendeltreppe mit rot-weißen Ringen
function lighthouse(w, [x, z], starId) {
  const y = w.heightAt(x, z);
  const top = w.spiralTower({ x, z, y, r: 4.4, n: 12, rise: 1.1, size: 2.3, da: 0.75, colors: ['#ffffff', '#e8262b'], column: '#ffffff', colW: 2.6, top: '#e8262b', topSize: 4, starId, label: 'Leuchtturm von Teno' });
  for (let k = 0; k < 5; k++) w.box(2.7, 1.2, 2.7, '#e8262b', x, y + 1.5 + k * 2.6, z);
  w.box(2.2, 1.6, 2.2, '#fff4a0', x, top + 1.8, z);
  w.box(2.8, 0.4, 2.8, '#e8262b', x, top + 2.8, z);
}

// ---------- Welt ----------
export const tenerife = {
  id: 'tenerife',
  name: 'Teneriffa',
  seed: 103,
  theme: { sky: ['#1a7fd8', '#7cc8ff', '#eaf7ff'], fog: '#d6eeff', sea: '#1f8fc9', fogNear: 140, fogFar: 420 },
  stars: {
    cablecar: 'Seilbahn zum Teide', teide: 'Teide-Gipfel (3718 m)', drago: 'Drachenbaum von Icod', masca: 'Masca-Schlucht',
    whales: 'Wal-Tour Los Gigantes', pyramids: 'Pyramiden von Güímar', lighthouse: 'Leuchtturm von Teno',
  },
  build(w) {
    const cell = 2.5, x0 = -205, z0 = -175, cols = Math.ceil(410 / cell), rows = Math.ceil(335 / cell);
    w.terrain({ x0, z0, cols, rows, cell, step: 0.5, height: (x, z) => heightM(x, z) / 100, color: colorAt });
    w.killY = -1.6;

    // Ankunft: Flughafen Teneriffa Süd
    const [ax, az] = P.airport, ay = w.heightAt(ax, az);
    w.box(26, 0.1, 3.4, '#3d4450', ax, ay + 0.05, az + 6, 0.05);
    for (let k = -5; k <= 5; k++) w.box(1.5, 0.11, 0.3, '#ffffff', ax + k * 2.3, ay + 0.06, az + 6 + k * 0.115);
    lightHouse(w, ax + 9, az - 7, 14, 4, 4.5, { wall: '#f4f6f8', roofColor: '#c8ccd2', window: '#7cc4ff' });
    w.box(1.6, 8, 1.6, '#f4f6f8', ax + 17, ay + 4, az - 13);
    w.box(2.6, 1.6, 2.6, '#7cc4ff', ax + 17, ay + 8.8, az - 13);
    w.box(1.6, 1.6, 9, '#ffffff', ax - 7, ay + 1.4, az + 6, Math.PI / 2 + 0.05);
    w.box(10, 0.25, 1.8, '#ffffff', ax - 7, ay + 1.3, az + 6, 0.05);
    w.box(0.25, 2, 1.6, '#1f8fc9', ax - 10.6, ay + 2.6, az + 6, 0.05);
    w.portal({ x: ax, z: az + 1, facing: 'n', label: 'Zur Mathe-Insel', color: '#2f7df6', target: 'hub' });
    w.spawn.set(ax, ay, az - 12);
    w.spawnYaw = 0;
    sign(w, 'Willkommen auf Teneriffa!', [ax, az - 26], 6, { bg: '#ffd23f', fg: '#17233b', size: 1.3 });

    // Straßen mit Münzen, Guagua (Linienbus) auf der TF-1
    ROADS.forEach((r, i) => road(w, r, i === 2 ? 14 : 22));
    const bus = new THREE.Group();
    part(bus, 1.8, 1.6, 5, '#2fa84f', 0, 1.1, 0);
    part(bus, 1.82, 0.6, 4.6, '#cfe8ff', 0, 1.5, 0.1);
    part(bus, 1.84, 0.2, 5.02, '#ffffff', 0, 0.45, 0);
    w.add(bus);
    const busPts = [];
    for (let i = 1; i < ROADS[0].length; i++) {
      const [ax2, az2] = ROADS[0][i - 1], [bx2, bz2] = ROADS[0][i], n = Math.ceil(Math.hypot(bx2 - ax2, bz2 - az2) / 2);
      for (let k = 0; k < n; k++) busPts.push([ax2 + (bx2 - ax2) * k / n, az2 + (bz2 - az2) * k / n]);
    }
    w.updaters.push((dt, t) => {
      const L = busPts.length, f = (t * 3) % (2 * L), i = f < L ? Math.floor(f) : Math.floor(2 * L - f - 1);
      const [bx3, bz3] = busPts[Math.max(0, Math.min(L - 1, i))], [nx, nz] = busPts[Math.max(0, Math.min(L - 1, i + (f < L ? 1 : -1)))];
      bus.position.set(bx3, w.heightAt(bx3, bz3), bz3);
      bus.rotation.y = Math.atan2(nx - bx3, nz - bz3);
    });

    // ---------- Teide, Seilbahn, Las Cañadas ----------
    const [cbx, cbz] = P.cableBase, cby = w.heightAt(cbx, cbz);
    const [ctx, ctz] = P.cableTop, cty = w.heightAt(ctx, ctz);
    lightHouse(w, cbx + 3, cbz + 2.5, 5, 3.4, 3.2, { wall: '#d9d2c3', roofColor: '#8d939b' });
    lightHouse(w, ctx + 3.3, ctz - 1.6, 3, 3, 2.6, { wall: '#d9d2c3', roofColor: '#8d939b' });
    sign(w, 'Teleférico del Teide', [cbx + 3, cbz + 2.5], 6.5, { bg: '#e8262b' });
    const steps = 30;
    for (let k = 1; k < steps; k++) {
      const t = k / steps, x = cbx + (ctx - cbx) * t, z = cbz + (ctz - cbz) * t;
      w.box(0.08, 0.08, 0.6, '#2b2b2b', x, cby + 4 + (cty - cby) * t - Math.sin(t * Math.PI) * 1.2, z, Math.atan2(ctx - cbx, ctz - cbz));
    }
    const midX = (cbx + ctx) / 2, midZ = (cbz + ctz) / 2, midY = w.heightAt(midX, midZ);
    w.box(0.7, (cby + cty) / 2 + 4 - midY, 0.7, '#9aa5b1', midX, (midY + (cby + cty) / 2 + 4) / 2, midZ);
    const cabin = new THREE.Group();
    part(cabin, 2.2, 2.2, 2.2, '#e8262b', 0, 1.1, 0);
    part(cabin, 2.25, 0.9, 2.25, '#bfe3ff', 0, 1.6, 0);
    part(cabin, 0.12, 1.4, 0.12, '#2b2b2b', 0, 2.9, 0);
    const station = w.station(cbx - 2.5, cbz + 1, 'Seilbahn', '#e8262b', cby);
    w.addRide(pathRide(w, {
      points: [[cbx, cby + 2.6, cbz], [midX, (cby + cty) / 2 + 1.2, midZ], [ctx, cty + 2.6, ctz]], closed: false, duration: 16,
      vehicle: cabin, seat: [0, -0.1, 0], flat: true, idle: 'wait', name: 'Teleférico del Teide', starId: 'cablecar', station,
      exit: new THREE.Vector3(ctx + 1.5, cty, ctz + 1.1),
      camera(pos, fwd, out) { out.pos.set(pos.x + 6, pos.y + 3, pos.z + 9); out.look.set(pos.x, pos.y + 1, pos.z); },
    }));
    // Gipfelpfad (Genehmigung nötig) und Krater mit Schwefeldampf
    const [tx, tz] = P.teide, ty = w.heightAt(tx, tz);
    // Gipfelpfad: Felsstufen (je ~1 hoch, springen!) zur Plattform vor dem Krater-Tor
    const lx0 = tx + 4.2, lz0 = tz;
    const nSteps = Math.max(3, Math.ceil((ty - cty) / 1.0));
    for (let k = 1; k <= nSteps; k++) {
      const t = k / nSteps, x = ctx + (lx0 - ctx) * t, z = ctz + (lz0 - ctz) * t;
      const top = cty + (ty - cty) * t;
      w.block(x, top, z, 2.2, top - w.heightAt(x, z) + 1.5, 2.2, k === nSteps ? '#8a7a6a' : '#6b5a50');
    }
    w.enclosure({ x: tx, z: tz, w: 5.6, d: 5.6, side: 'e', h: 4.4, color: '#5a4a44', label: 'Gipfel-Genehmigung', y: ty, cap: '#d8cbb3' });
    w.star('teide', tx, ty, tz, 'Teide-Gipfel (3718 m)');
    for (let k = 0; k < 6; k++) w.box(0.6, 0.06, 0.6, '#f2e15a', tx + w.r(-2.5, 2.5), ty + 0.04, tz + w.r(-2.5, 2.5));
    const steam = [];
    for (let k = 0; k < 8; k++) {
      const s = w.sphere(0.5, '#ffffff', tx + w.r(-2, 2), ty + 1, tz + w.r(-2, 2), { opacity: 0.5, shadow: false, seg: 8 });
      s.userData.base = s.position.clone();
      steam.push(s);
    }
    w.updaters.push((dt, t) => steam.forEach((s, i) => {
      const k = ((t * 0.3 + i / steam.length) % 1);
      s.position.set(s.userData.base.x, s.userData.base.y + k * 4, s.userData.base.z);
      s.scale.setScalar(0.6 + k * 1.6);
      s.material.opacity = 0.5 * (1 - k);
    }));
    sign(w, 'Teide 3718 m – höchster Berg Spaniens', [tx, tz + 6], 6.5, { bg: '#7a5040' });

    // Roques de García mit dem Roque Cinchado und Parador
    const [rx, rz] = P.roques, ry = w.heightAt(rx, rz);
    w.box(1.4, 3, 1.4, '#6b5040', rx, ry + 1.5, rz);
    w.box(2.6, 2.4, 2.4, '#7a5a48', rx, ry + 4.2, rz, 0.4);
    w.box(2.2, 1.2, 2, '#6b5040', rx + 0.3, ry + 5.9, rz, 0.2);
    for (let k = 0; k < 5; k++) w.box(w.r(2, 3.5), w.r(3, 7), w.r(2, 3), '#5a4a44', rx + 4 + k * 3, ry + 2, rz - 2 + w.r(-1, 1), w.r(0, 1));
    lightHouse(w, P.parador[0], P.parador[1], 9, 5, 3.4, { wall: '#efe3cf', roof: 'tile' });
    sign(w, 'Las Cañadas', P.parador, 6);
    // Retama (weiß blühend) und Tajinaste rojo (rote Blütensäulen)
    for (let k = 0; k < 70; k++) {
      const a = w.r(0, Math.PI * 2), d = Math.sqrt(w.rng());
      const x = P.caldera[0] + Math.cos(a) * d * 38, z = P.caldera[1] + Math.sin(a) * d * 25;
      const h = w.heightAt(x, z);
      if (h < 20 || h > 23.5) continue;
      if (k % 3 === 0) { w.box(0.35, 2.6, 0.35, '#d6283c', x, h + 1.3, z); w.box(0.6, 0.6, 0.6, '#5a8a3a', x, h + 0.3, z); }
      else w.box(1.4, 0.9, 1.2, '#f4f1e6', x, h + 0.45, z, w.r(0, 3));
    }
    w.animal('lizard', { pos: new THREE.Vector3(rx + 3, 0, rz + 4), radius: 4, speed: 1.2, hungry: true });
    for (let i = 0; i < 2; i++) w.animal('bird', { pos: new THREE.Vector3(P.caldera[0] + i * 10, 0, P.caldera[1]), y: 24 + i * 2, behavior: 'fly', radius: 12, speed: 5, colors: ['#5b7fb8', '#3d5a80', '#7a8fa8'], scale: 0.7 });

    // Kanarenkiefern im Waldgürtel, Lorbeerwald in Anaga, Wolfsmilch im Süden
    let placed = 0;
    for (let k = 0; k < 4000 && placed < 170; k++) {
      const x = w.r(-190, 190), z = w.r(-165, 160), h = w.heightAt(x, z);
      if (h < 10.5 || h > 20.5) continue;
      if (Math.hypot((x - P.caldera[0]) / 40, (z - P.caldera[1]) / 27) < 1.05) continue;
      w.tree('pine', x, z, w.r(1.1, 1.5), h, false);
      placed++;
    }
    placed = 0;
    for (let k = 0; k < 2000 && placed < 45; k++) {
      const x = w.r(100, 195), z = w.r(-165, -120), h = w.heightAt(x, z);
      if (h < 2 || lineDist(x, z, ANAGA) > 12) continue;
      w.tree('oak', x, z, w.r(0.9, 1.3), h, false);
      placed++;
    }
    for (let k = 0; k < 160; k++) {
      const x = w.r(-150, 80), z = w.r(30, 160), h = w.heightAt(x, z);
      if (h < 0.8 || h > 9 || northness(x, z) > 0) continue;
      const s = w.r(0.4, 0.9);
      w.box(s * 1.3, s * 0.7, s * 1.2, k % 2 ? '#7f9a5a' : '#9aa86a', x, h + s * 0.35, z, w.r(0, 3));
    }

    // Wolkenmeer über der Nordseite (Passatwolken)
    const cloudGeo = new THREE.BoxGeometry(1, 1, 1);
    const clouds = new THREE.InstancedMesh(cloudGeo, new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.72, depthWrite: false }), 90);
    const m4 = new THREE.Matrix4();
    let ci = 0;
    for (let k = 0; k < 3000 && ci < 90; k++) {
      const x = w.r(-150, 170), z = w.r(-150, 0), h = w.heightAt(x, z);
      if (northness(x, z) < 0.6 || h < 4 || h > 11) continue;
      m4.compose(new THREE.Vector3(x, w.r(12.5, 14.5), z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, w.r(0, 3), 0)), new THREE.Vector3(w.r(8, 16), w.r(1.5, 2.6), w.r(6, 12)));
      clouds.setMatrixAt(ci++, m4);
    }
    clouds.count = ci;
    clouds.computeBoundingSphere();
    w.add(clouds);
    w.updaters.push((dt, t) => { clouds.position.x = Math.sin(t * 0.05) * 6; });

    // ---------- Orte ----------
    // Santa Cruz: Hafen, Auditorio, Zwillingstürme, Plaza de España
    town(w, P.santaCruz[0] - 4, P.santaCruz[1] + 2, 16, 26, { minH: 4, maxH: 9, balcony: '#8a5e33' });
    const [aux, auz] = P.auditorio, auy = w.heightAt(aux, auz);
    w.box(6, 2, 5, '#f4f6f8', aux, auy + 1, auz);
    for (let k = 0; k < 9; k++) w.box(1.2, 0.5, 6.5 - k * 0.3, '#ffffff', aux - 2 + k * 0.6, auy + 2.5 + Math.sin(k / 8 * Math.PI) * 4.5 + k * 0.4, auz, 0, 0, -0.4 + k * 0.08);
    sign(w, 'Auditorio', P.auditorio, 10, { bg: '#2f7df6' });
    for (const s of [-1, 1]) lightHouse(w, P.santaCruz[0] + 8 + s * 2.6, P.santaCruz[1] - 6, 3, 3, 15, { wall: '#d9e2ea', window: '#7cc4ff' });
    w.water(P.santaCruz[0] - 2, P.santaCruz[1] + 4, 5, 5, { top: w.heightAt(P.santaCruz[0] - 2, P.santaCruz[1] + 4) + 0.06, color: '#4fc0f0' });
    sign(w, 'Santa Cruz de Tenerife', P.santaCruz, 13);
    for (let k = 0; k < 3; k++) w.box(3, 2.2, 10, '#ffffff', P.santaCruz[0] + 14 + k * 5, -0.2, P.santaCruz[1] + 8, 0.7);
    // Las Teresitas (goldener Sand) mit Palmen
    for (let k = 0; k < 8; k++) palm(w, P.teresitas[0] + w.r(-6, 6), P.teresitas[1] + w.r(-3, 3));
    sign(w, 'Las Teresitas', P.teresitas, 5);
    // La Laguna: bunte Altstadt mit Kathedrale, Flughafen Nord
    town(w, P.laguna[0], P.laguna[1], 12, 24, { roof: 'tile', balcony: '#7a4a2a', walls: ['#f2d16b', '#5b8fd6', '#d2693c', '#7fb069', '#f6f1e7', '#e8b04a'] });
    const [lx, lz] = P.laguna, ly = w.heightAt(lx, lz);
    w.box(5, 5, 8, '#efe3cf', lx, ly + 2.5, lz);
    for (const s of [-1, 1]) w.box(1.8, 9, 1.8, '#efe3cf', lx + s * 1.8, ly + 4.5, lz + 4.5);
    w.sphere(1.6, '#d9cbb0', lx, ly + 5, lz - 1, { half: true });
    sign(w, 'San Cristóbal de La Laguna', P.laguna, 11);
    const [nx, nz] = P.tfn, ny = w.heightAt(nx, nz);
    w.box(30, 0.1, 3, '#3d4450', nx, ny + 0.05, nz, -1.2);
    sign(w, 'Flughafen Nord', P.tfn, 4, { size: 0.9 });
    // Anaga: Taganana und Leuchtturm-Blick
    town(w, P.taganana[0], P.taganana[1], 5, 8, { minH: 2.5, maxH: 4 });
    sign(w, 'Anaga – Lorbeerwald', [P.taganana[0] - 10, P.taganana[1] + 8], 8, { bg: '#2f6a3a' });
    // Candelaria: Basilika und die Statuen der Guanchen-Könige
    const [cx, cz] = P.candelaria, cy = w.heightAt(cx, cz);
    w.box(5, 4, 7, '#f4f1e8', cx + 2, cy + 2, cz);
    w.box(2, 9, 2, '#f4f1e8', cx + 4, cy + 4.5, cz - 3);
    w.box(2.4, 1, 2.4, '#b5532c', cx + 4, cy + 9.5, cz - 3);
    for (let k = 0; k < 9; k++) { w.box(0.7, 2.2, 0.6, '#5a4a3a', cx - 4 + k * 0.9, cy + 1.1 + 0.6, cz + 4.5); w.box(0.9, 0.6, 0.9, '#8d939b', cx - 4 + k * 0.9, cy + 0.3, cz + 4.5); }
    town(w, cx - 5, cz - 6, 6, 8);
    sign(w, 'Candelaria', P.candelaria, 11);

    // Pyramiden von Güímar (Park mit Tor, Stufenpyramide erklimmen)
    const [gx, gz] = P.guimar, gy = w.heightAt(gx, gz);
    w.enclosure({ x: gx, z: gz, w: 16, d: 16, side: 'w', h: 4.4, color: '#3b3836', label: 'Pyramiden von Güímar', y: gy, cap: '#5a5552' });
    for (let k = 0; k < 4; k++) w.block(gx + 2, gy + 1 + k, gz, 9 - k * 2, 1 + k, 9 - k * 2, '#3b3836');
    w.star('pyramids', gx + 2, gy + 4, gz, 'Pyramiden von Güímar');
    for (const [dx, dz] of [[-4.5, -5.5], [-4.5, 5.5]]) for (let k = 0; k < 2; k++) w.box(4 - k * 1.6, 1, 3 - k * 1.2, '#3b3836', gx + dx, gy + 0.5 + k, gz + dz);
    town(w, gx - 14, gz - 4, 6, 8);

    // Puerto de la Cruz: Lago Martiánez, Playa Jardín, Papageienpark
    town(w, P.puerto[0], P.puerto[1] + 2, 12, 24, { minH: 3, maxH: 8, balcony: '#7a4a2a' });
    const [mx, mz] = P.martianez, my = Math.max(0.6, w.heightAt(mx, mz));
    for (let k = 0; k < 3; k++) w.water(mx + k * 4 - 4, mz - 1, 3.4, 3, { top: my + 0.1, color: '#38c8f0' });
    sign(w, 'Puerto de la Cruz', P.puerto, 9);
    const [lpx, lpz] = P.loro, lpy = w.heightAt(lpx, lpz);
    w.box(14, 0.08, 12, '#7fb069', lpx, lpy + 0.04, lpz);
    w.water(lpx + 3, lpz + 3, 6, 4, { top: lpy + 0.1, color: '#3fb8e8' });
    for (let i = 0; i < 2; i++) w.animal('dolphin', { pos: new THREE.Vector3(lpx + 3, 0, lpz + 3), y: lpy - 0.5, behavior: 'jump', radius: 3 });
    lightHouse(w, lpx - 4, lpz - 3, 4, 3, 3, { wall: '#e8f4ff', roofColor: '#bfe3ff' });
    for (let i = 0; i < 3; i++) w.animal('penguin', { pos: new THREE.Vector3(lpx - 4 + i, lpy, lpz + 1), y: lpy, radius: 1.5, speed: 0.6 });
    w.box(0.25, 2, 0.25, '#7a4a2a', lpx - 1, lpy + 1, lpz - 4);
    w.animal('parrot', { pos: new THREE.Vector3(lpx - 1, lpy + 2.05, lpz - 4), y: lpy + 2.05, behavior: 'perch', hungry: true });
    for (let i = 0; i < 4; i++) w.animal('parrot', { pos: new THREE.Vector3(lpx, 0, lpz), y: lpy + 5 + i, behavior: 'fly', radius: 6 + i, speed: (i % 2 ? 3 : -3), colors: [['#e8262b', '#ffd23f', '#1f7de0'], ['#1f9de0', '#ffd23f', '#1d56b3'], ['#2fbf4a', '#ff595e', '#ffd23f']][i % 3] });
    sign(w, 'Papageienpark', P.loro, 6, { bg: '#2fbf4a' });
    // La Orotava: Balkonhäuser
    town(w, P.orotava[0], P.orotava[1], 10, 18, { roof: 'tile', balcony: '#6b4423', walls: ['#f6f1e7', '#f2d16b', '#ffffff', '#e8b04a'] });
    sign(w, 'La Orotava', P.orotava, 8);
    // Bananenplantagen an der Nordküste
    for (let k = 0; k < 14; k++) {
      const t = w.rng(), x = P.puerto[0] - 20 - t * 80, z = P.puerto[1] + 6 + w.r(-4, 6) + t * 20;
      const h = w.heightAt(x, z);
      if (h < 0.6 || h > 6) continue;
      w.box(8, 1.1, 0.3, '#d9cbb0', x, h + 0.55, z - 3); w.box(8, 1.1, 0.3, '#d9cbb0', x, h + 0.55, z + 3);
      for (let a = -3; a <= 3; a += 1.5) for (let b = -2; b <= 2; b += 2) {
        w.box(0.2, 1.4, 0.2, '#7a8a3a', x + a, h + 0.7, z + b);
        w.box(1.4, 0.15, 0.5, '#4fb33a', x + a, h + 1.5, z + b, a + b, 0.4);
        w.box(0.5, 0.15, 1.4, '#3fa32a', x + a, h + 1.5, z + b, a - b, 0, 0.4);
      }
    }
    // Icod de los Vinos: Drachenbaum im Park (Tor, Klettern bis in die Krone)
    town(w, P.icod[0] + 6, P.icod[1] + 10, 8, 14);
    const [dx0, dz0] = P.icod, dy0 = w.heightAt(dx0, dz0);
    w.enclosure({ x: dx0, z: dz0, w: 15, d: 15, side: 's', h: 4.4, color: '#e9e4da', label: 'Parque del Drago', y: dy0, cap: '#b5532c' });
    w.block(dx0, dy0 + 7, dz0, 2.6, 7, 2.6, '#8a8076');
    w.box(3.4, 2, 3.4, '#9a9086', dx0, dy0 + 1, dz0);
    const branches = [[0, 1.6], [1.3, 2.8], [2.6, 4.0], [3.9, 5.2], [5.2, 6.4]];
    branches.forEach(([a, top]) => {
      const bx2 = dx0 + Math.cos(a) * 3.8, bz2 = dz0 + Math.sin(a) * 3.8;
      w.block(bx2, dy0 + top, bz2, 2.2, 0.5, 2.2, '#8a8076');
      w.box(0.6, 0.6, 3.6, '#8a8076', (dx0 + bx2) / 2, dy0 + top - 0.2, (dz0 + bz2) / 2, Math.atan2(bx2 - dx0, bz2 - dz0), -0.3);
      for (let s = 0; s < 5; s++) w.box(0.25, 0.9, 0.25, '#4f8a3a', bx2 + w.r(-0.9, 0.9), dy0 + top + 0.5, bz2 + w.r(-0.9, 0.9), 0, w.r(-0.5, 0.5), w.r(-0.5, 0.5));
    });
    w.block(dx0, dy0 + 7.6, dz0, 4, 0.6, 4, '#5f9a48');
    for (let s = 0; s < 28; s++) w.box(0.3, 1.1, 0.3, s % 2 ? '#4f8a3a' : '#6aa84a', dx0 + w.r(-2, 2) * (s < 14 ? 1 : 1.8), dy0 + 8.2, dz0 + w.r(-2, 2) * (s < 14 ? 1 : 1.8), 0, w.r(-0.6, 0.6), w.r(-0.6, 0.6));
    w.star('drago', dx0, dy0 + 7.6, dz0, 'Drachenbaum von Icod');
    sign(w, 'Drago Milenario – ein uralter Drachenbaum', [dx0, dz0 + 10], 6, { bg: '#4f8a3a', size: 0.9 });
    // Garachico mit dem Roque und Naturbecken
    town(w, P.garachico[0], P.garachico[1] + 1, 6, 12, { roof: 'tile' });
    sign(w, 'Garachico', P.garachico, 7);
    town(w, P.buenavista[0], P.buenavista[1] + 2, 6, 10);
    // Teno: Leuchtturm (Wendeltreppe)
    lighthouse(w, P.tenoFaro, 'lighthouse');
    sign(w, 'Punta de Teno', [P.tenoFaro[0] + 6, P.tenoFaro[1] + 4], 4, { size: 0.9 });
    // Masca: Bergdorf, Schlucht und Strand (Tor am Strand)
    town(w, P.masca[0], P.masca[1], 4, 7, { minH: 2.5, maxH: 3.5, roof: 'tile' });
    sign(w, 'Masca', P.masca, 7);
    const [mbx, mbz] = P.mascaBeach, mby = w.heightAt(mbx, mbz);
    w.enclosure({ x: mbx, z: mbz, w: 7, d: 7, side: 'e', h: 4.4, color: '#6b5a50', label: 'Strand von Masca', y: mby, cap: '#8a7a6a' });
    w.star('masca', mbx, mby, mbz, 'Masca-Schlucht');
    for (let k = 0; k < 4; k++) w.animal('goat', { pos: new THREE.Vector3(P.masca[0] + w.r(-5, 5), 0, P.masca[1] + w.r(-5, 5)), radius: 5, speed: 0.8, hungry: k === 0 });
    // Los Gigantes: Hafen, Wal-Tour vor den Klippen
    town(w, P.gigantes[0] + 4, P.gigantes[1] + 2, 6, 12, { minH: 3, maxH: 7, balcony: '#ffffff' });
    sign(w, 'Los Gigantes', P.gigantes, 8);
    const [gix, giz] = P.gigantes, giy = w.heightAt(gix, giz);
    const wst = w.station(gix - 1, giz + 3, 'Wal-Tour', '#1f8fc9', giy);
    const boat = new THREE.Group();
    part(boat, 2.6, 0.9, 5, '#ffffff', 0, 0, 0);
    part(boat, 2.8, 0.25, 5.2, '#1f8fc9', 0, 0.5, 0);
    part(boat, 2, 1.4, 2, '#ffffff', 0, 1.3, -0.8);
    part(boat, 2.1, 0.5, 2.1, '#7cc4ff', 0, 1.6, -0.8);
    w.addRide(pathRide(w, {
      points: [[gix - 6, -0.75, giz + 4], [gix - 16, -0.75, giz - 2], [gix - 22, -0.75, giz - 18], [gix - 18, -0.75, giz - 30], [gix - 28, -0.75, giz - 14], [gix - 26, -0.75, giz + 10], [gix - 12, -0.75, giz + 10]],
      closed: true, duration: 22, vehicle: boat, seat: [0, -0.4, 0.9], flat: true, idle: 'wait', name: 'Wal-Tour Los Gigantes', starId: 'whales', station: wst,
      exit: new THREE.Vector3(gix + 1.5, giy, giz + 5),
    }));
    for (const [ddx, ddz] of [[-20, -10], [-26, -24], [-30, 4]]) w.animal('whale', { pos: new THREE.Vector3(gix + ddx, -0.8, giz + ddz), y: -1.6, behavior: 'jump', radius: 9 });
    for (const [ddx, ddz] of [[-14, -20], [-24, 0]]) w.animal('dolphin', { pos: new THREE.Vector3(gix + ddx, -0.8, giz + ddz), y: -0.8, behavior: 'jump', radius: 7 });
    // Süden: Hotels, Strände, Montaña Roja, El Médano
    town(w, P.americas[0], P.americas[1] - 2, 12, 22, { minW: 4, maxW: 7, minH: 6, maxH: 13, balcony: '#ffffff', walls: ['#ffffff', '#f6f1e7', '#f4e2c8'] });
    town(w, P.cristianos[0] + 2, P.cristianos[1] - 4, 7, 12, { minH: 3, maxH: 7 });
    sign(w, 'Playa de las Américas', P.americas, 14);
    sign(w, 'Los Cristianos', P.cristianos, 9);
    for (let k = 0; k < 10; k++) {
      const x = P.americas[0] + w.r(-14, 10), z = P.americas[1] + 8 + w.r(-1, 2);
      if (w.heightAt(x, z) <= 0.3) continue;
      w.box(0.12, 2, 0.12, '#ffffff', x, w.heightAt(x, z) + 1, z);
      w.cone(1.1, 0.6, k % 2 ? '#ff595e' : '#ffd23f', x, w.heightAt(x, z) + 1.9, z, { seg: 8, shadow: false });
    }
    town(w, P.medano[0] + 3, P.medano[1] - 2, 5, 9);
    sign(w, 'El Médano', P.medano, 7);
    for (let k = 0; k < 4; k++) {
      const kite = w.box(1.6, 0.1, 0.7, ['#ff595e', '#2fbf4a', '#ffd23f', '#2f7df6'][k], P.medano[0] + 6 + k * 3, 9 + k, P.medano[1] + 12, 0, 0, 0.6);
      void kite;
    }
    sign(w, 'Vilaflor', P.vilaflor, 6);
    town(w, P.vilaflor[0], P.vilaflor[1], 5, 8, { roof: 'tile' });
    town(w, P.granadilla[0], P.granadilla[1], 5, 8);
    town(w, P.adeje[0], P.adeje[1], 5, 8);
    town(w, P.sanJuan[0] + 2, P.sanJuan[1], 4, 6);

    // Tiere: Kanarienvögel, Eidechsen, Katzen, Hasen, Schildkröten
    for (let i = 0; i < 3; i++) w.animal('bird', { pos: new THREE.Vector3(P.orotava[0] + i * 4, 0, P.orotava[1]), y: 9 + i, behavior: 'flutter', radius: 6, colors: ['#ffe14d', '#f2c200', '#ffd23f'], scale: 0.55 });
    w.box(0.2, 1.6, 0.2, '#7a4a2a', P.puerto[0] + 3, w.heightAt(P.puerto[0] + 3, P.puerto[1]) + 0.8, P.puerto[1]);
    w.animal('bird', { pos: new THREE.Vector3(P.puerto[0] + 3, 0, P.puerto[1]), y: w.heightAt(P.puerto[0] + 3, P.puerto[1]) + 1.65, behavior: 'perch', colors: ['#ffe14d', '#f2c200', '#ffd23f'], scale: 0.6, hungry: true });
    w.animal('cat', { pos: new THREE.Vector3(P.laguna[0] + 6, 0, P.laguna[1] + 6), radius: 4, speed: 1, color: '#f08a1f', hungry: true });
    w.animal('cat', { pos: new THREE.Vector3(P.santaCruz[0] - 6, 0, P.santaCruz[1] + 6), radius: 4, speed: 1, color: '#222222' });
    w.animal('rabbit', { pos: new THREE.Vector3(P.vilaflor[0] + 8, 0, P.vilaflor[1] - 6), behavior: 'hop', radius: 6, speed: 2, color: '#a08a6a', hungry: true });
    w.animal('lizard', { pos: new THREE.Vector3(P.americas[0] + 12, 0, P.americas[1] - 10), radius: 4, speed: 1.2 });
    w.animal('dog', { pos: new THREE.Vector3(ax - 6, 0, az - 16), radius: 5, speed: 2, hungry: true });
    w.animal('turtle', { pos: new THREE.Vector3(P.medano[0] + 10, -0.9, P.medano[1] + 12), y: -0.9, behavior: 'swim', radius: 5, speed: 0.5 });

    // Münzen rund um die Ankunft
    w.coinRing(ax, ay, az - 18, 5, 8);
  },
};
