// Teneriffa: offene Insel nach echten Koordinaten. 1 Einheit ≈ 133 m in der Fläche, 100 m in der Höhe.
// Norden = −z, Osten = +x. Teide, Las Cañadas, Anaga, Teno, Masca, Orte, Straßen und das Wolkenmeer im Norden.
import * as THREE from '../../vendor/three.module.min.js';
import { pathRide, part } from '../rides.js';
import { studTexture } from '../blocks.js';
import { makeAnimal } from '../animals.js';
import { compact } from './africa-kit.js';

// S: Vergrößerung gegenüber dem ursprünglichen Maßstab (200 m pro Einheit); alle Gelände-Breiten skalieren mit
const S = 1.5;
const LON0 = -16.52, LAT0 = 28.29, KX = 490 * S, KZ = 555 * S;
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

// Weitere Orte und Sehenswürdigkeiten
Object.assign(P, {
  tacoronte: geo(-16.410, 28.477), santaUrsula: geo(-16.490, 28.425), realejos: geo(-16.585, 28.383), rambla: geo(-16.652, 28.390),
  bajamar: geo(-16.345, 28.550), hidalgo: geo(-16.328, 28.571), sanAndres: geo(-16.196, 28.503), tegueste: geo(-16.338, 28.518),
  cruzCarmen: geo(-16.280, 28.532), benijo: geo(-16.183, 28.565), izana: geo(-16.511, 28.300), humboldt: geo(-16.488, 28.398),
  fasnia: geo(-16.440, 28.236), poris: geo(-16.436, 28.160), arico: geo(-16.482, 28.180), sanIsidro: geo(-16.553, 28.096),
  abrigos: geo(-16.592, 28.042), galletas: geo(-16.660, 28.016), arona: geo(-16.680, 28.100), waterpark: geo(-16.712, 28.090),
  monkeys: geo(-16.695, 28.078), caleta: geo(-16.755, 28.100), callao: geo(-16.769, 28.127), barranco: geo(-16.712, 28.134),
  guia: geo(-16.775, 28.210), alcala: geo(-16.822, 28.207), arena: geo(-16.826, 28.228), tamaimo: geo(-16.820, 28.265),
  tanque: geo(-16.788, 28.364), camel: geo(-16.775, 28.352), lunar: geo(-16.618, 28.168), castillo: geo(-16.7655, 28.3738),
  tram: geo(-16.252, 28.468), casaBalcones: geo(-16.5215, 28.3915),
  cactus: geo(-16.668, 28.085), palmetum: geo(-16.262, 28.452),
});
P.mall = [P.waterpark[0] - 25, P.waterpark[1] + 3];      // Einkaufszentrum im Thai-Stil neben dem Wasserpark
P.rock = [P.americas[0] + 7, P.americas[1] - 5];          // Rock-Café an der Strandpromenade
P.taoro = [P.puerto[0] + 5, P.puerto[1] + 11];            // Taoro-Park über Puerto de la Cruz
P.whale = [P.gigantes[0] + 7, P.gigantes[1] - 7];         // Walskelett an der Promenade

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
  [P.laguna, P.cruzCarmen, P.taganana],                                           // TF-12 durch Anaga
  [P.laguna, geo(-16.40, 28.43), geo(-16.46, 28.36), P.izana, P.portillo],        // TF-24 über die Cumbre Dorsal
  [P.laguna, P.tegueste, P.bajamar, P.hidalgo],
  [P.americas, P.caleta, P.callao, geo(-16.80, 28.20)],
  [P.icod, P.tanque, P.santiago],
  [P.sanIsidro, P.granadilla, P.arico, P.fasnia, geo(-16.39, 28.30)],
];
// Straßenbahn Santa Cruz – La Laguna (neben der Straße)
const TRAM = [P.tram, geo(-16.275, 28.468), geo(-16.300, 28.478), [P.laguna[0] + 7, P.laguna[1] + 4]];

// Ebene Flächen für Orte, Stationen, Parks (x, z, Radius in Einheiten)
const PADS = [
  [...P.teide, 3.2, 1.5], [...P.airport, 11, 45], [...P.cableBase, 4], [...P.cableTop, 2.5, 2], [...P.parador, 4],
  [...P.icod, 8], [...P.guimar, 9], [...P.tenoFaro, 6], [...P.mascaBeach, 4, 3], [...P.gigantes, 5], [...P.masca, 4, 3],
  [...P.loro, 7], [...P.santaCruz, 7], [...P.laguna, 6], [...P.candelaria, 4], [...P.medano, 4], [...P.tfn, 9],
  [...P.waterpark, 11], [...P.izana, 7], [...P.camel, 9, 10], [...P.lunar, 6], [...P.monkeys, 5], [...P.castillo, 4, 3],
  [...P.hidalgo, 3, 4], [...P.humboldt, 3, 5], [...P.sanIsidro, 6],
  [...P.cactus, 13, 8], [...P.mall, 10, 8], [...P.palmetum, 8, 6], [...P.taoro, 7, 6],
];

// Strände: [Name, lon, lat, Länge, goldener Sand?, Extras]. Liegen genau auf der Küstenlinie des Modells.
const BEACH_LIST = [
  ['Playa del Duque', -16.744, 28.091, 14, true, { tower: true }], ['Playa de Fañabé', -16.736, 28.083, 14, true, {}],
  ['Playa de Troya', -16.729, 28.066, 12, true, { volley: true }], ['Playa de las Vistas', -16.720, 28.048, 16, true, { tower: true }],
  ['Playa de la Arena', -16.835, 28.230, 10, false, {}], ['Playa Jardín', -16.561, 28.417, 14, false, { garden: true }],
  ['Playa Martiánez', -16.538, 28.417, 8, false, {}], ['El Bollullo', -16.514, 28.407, 8, false, { wild: true }],
  ['Playa del Socorro', -16.599, 28.396, 8, false, { surf: true }], ['Playa de El Médano', -16.536, 28.045, 14, true, { surf: true }],
  ['La Tejita', -16.553, 28.034, 12, true, { wild: true }], ['Playa de Almáciga', -16.190, 28.567, 10, false, { wild: true, surf: true }],
  ['Playa San Juan', -16.814, 28.182, 10, false, {}], ['El Puertito', -16.777, 28.114, 8, false, { turtles: true }],
  ['Playa de Abades', -16.438, 28.143, 10, true, {}], ['Playa de Candelaria', -16.368, 28.352, 8, false, {}],
];
export const BEACHES = BEACH_LIST.map(([name, lo, la, len, gold, o]) => {
  const [px, pz] = geo(lo, la);
  let best = null, bd = Infinity;
  for (let i = 0, j = COAST.length - 1; i < COAST.length; j = i++) {
    const [ax, az] = COAST[j], [bx, bz] = COAST[i], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2));
    const qx = ax + dx * t, qz = az + dz * t, d = Math.hypot(px - qx, pz - qz);
    if (d < bd) { bd = d; best = { x: qx, z: qz, ux: dx / Math.sqrt(l2), uz: dz / Math.sqrt(l2) }; }
  }
  let nx = best.uz, nz = -best.ux;                                   // Normale zum Meer hin
  if (insideCoast(best.x + nx * 6, best.z + nz * 6)) { nx = -nx; nz = -nz; }
  // Etwas landeinwärts, damit der Sand auf Land beginnt
  return { name, len: len * S, gold, ...o, x: best.x - nx * 2, z: best.z - nz * 2, ux: best.ux, uz: best.uz, nx, nz };
});

// Sperrflächen für Häuser (x, z, Radius): Parks, Tore, Bahnhöfe
const KEEP = [
  [...P.airport, 32], [...P.icod, 11], [...P.guimar, 12], [...P.loro, 10], [...P.auditorio, 6], [...P.candelaria, 7], [...P.cableBase, 7],
  [...P.waterpark, 14], [...P.izana, 10], [...P.camel, 12], [...P.lunar, 9], [...P.monkeys, 7], [...P.castillo, 6], [...P.gigantes, 5],
  [...P.hidalgo, 4], [...P.humboldt, 4], [...P.parador, 6], [...P.casaBalcones, 5],
  [...P.cactus, 16], [...P.mall, 14], [...P.palmetum, 11], [...P.taoro, 9], [...P.rock, 6], [P.loro[0] + 11, P.loro[1] - 2, 6],
  [P.taoro[0], P.taoro[1] - 9, 4], [P.puerto[0] - 2, P.puerto[1] - 5, 6], [...P.whale, 7],
  ...BEACHES.flatMap((b) => [-0.4, -0.2, 0, 0.2, 0.4].map((t) => [b.x + b.ux * b.len * t, b.z + b.uz * b.len * t, 4])),
];
const onRoad = (x, z, m) => ROADS.some((r) => lineDist(x, z, r) < m) || lineDist(x, z, TRAM) < m;

function baseHeight(x, z) {
  const inIsland = insideCoast(x, z);
  // Roque de Garachico (kleine Felsinsel) und Montaña Roja ragen aus dem Meer/Strand
  const [rgx, rgz] = geo(-16.762, 28.381);
  const islet = Math.max(0, 90 - Math.hypot(x - rgx, z - rgz) * 70 / S);
  if (!inIsland) return islet > 0 ? islet : -100;
  const d = coastDist(x, z), dk = d / (5 * S);
  // Flach an der Küste, steiler im Inneren (Flughafen Süd ~60 m, Vilaflor ~1400 m)
  let h = 2050 * (1 - Math.exp(-((dk / 8) ** 2)));
  // Cumbre Dorsal: Rücken vom Teide nach La Laguna
  const dd = lineDist(x, z, DORSAL);
  const tDors = Math.max(0, Math.min(1, (x - DORSAL[0][0]) / (DORSAL[2][0] - DORSAL[0][0])));
  h = Math.max(h, (2050 - tDors * 1100) * Math.exp(-((dd / (16 * S)) ** 2)) * Math.min(1, dk / 2));
  // Anaga und Teno: zerklüftete Gebirge
  const da = lineDist(x, z, ANAGA);
  const anaga = 950 * Math.exp(-((da / (9 * S)) ** 2)) * Math.min(1, dk / 0.7);
  const [tx, tz] = geo(-16.84, 28.33);
  const teno = 1050 * Math.exp(-((Math.hypot(x - tx, z - tz) / (22 * S)) ** 2)) * Math.min(1, dk / 0.35);
  h = Math.max(h, anaga, teno);
  const rugged = Math.exp(-((da / (14 * S)) ** 2)) + Math.exp(-((Math.hypot(x - tx, z - tz) / (26 * S)) ** 2));
  // Orotava-Tal und Masca-Schlucht
  h -= 500 * Math.exp(-((lineDist(x, z, OROTAVA) / (14 * S)) ** 2)) * smooth(0.5, 3, dk);
  h -= 650 * Math.exp(-((lineDist(x, z, MASCA_GORGE) / (2.2 * S)) ** 2));
  // Las Cañadas: Caldera mit flachem Boden und Steilwand (Lücken bei Boca de Tauce und El Portillo)
  const ex = (x - P.caldera[0]) / (40 * S), ez = (z - P.caldera[1]) / (27 * S);
  const e = Math.hypot(ex, ez);
  const ang = Math.atan2(ez, ex);
  if (e < 1) h = 2150 + noise(x / (9 * S), z / (9 * S)) * 25;
  const gap = Math.max(Math.exp(-(((x - P.tauce[0]) ** 2 + (z - P.tauce[1]) ** 2) / (60 * S * S))), Math.exp(-(((x - P.portillo[0]) ** 2 + (z - P.portillo[1]) ** 2) / (120 * S * S))));
  if (ang > -0.6 && e > 0.88 && e < 1.25) h = Math.max(h, 2150 + 420 * Math.exp(-(((e - 1.02) / 0.07) ** 2)) * (1 - gap));
  // Teide und Pico Viejo
  const rt = Math.hypot(x - P.teide[0], z - P.teide[1]);
  if (rt < 17.5 * S) h = Math.max(h, 3718 - 1520 * (rt / (17.5 * S)) ** 0.9);
  const rp = Math.hypot(x - P.pico[0], z - P.pico[1]);
  if (rp < 12 * S) h = Math.max(h, 3135 - 950 * (rp / (12 * S)));
  if (rp < 2.2 * S) h -= 120; // Krater des Pico Viejo
  // Montaña Roja
  const rr = Math.hypot(x - P.roja[0], z - P.roja[1]);
  if (rr < 4 * S) h = Math.max(h, 171 * (1 - rr / (4 * S)) + 20);
  // Rauschen (weniger auf Straßen, mehr in Anaga/Teno)
  const road = Math.min(...ROADS.map((r) => lineDist(x, z, r)));
  const amp = (e < 1 || rt < 17.5 * S ? 15 : 45 + 160 * Math.min(1, rugged)) * smooth(1.2, 5, road);
  h += (noise(x / (7 * S), z / (7 * S)) * 0.7 + noise(x / (2.6 * S), z / (2.6 * S)) * 0.3) * amp;
  // Küste: Strände flach, Klippen bei Los Gigantes/Teno
  const cliff = Math.hypot(x - P.gigantes[0], z - P.gigantes[1]) < 18 * S || Math.hypot(x - tx, z - tz) < 26 * S;
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
    return (lineZ - z) / (12 * S);
  }
  return (P.teide[1] + 4 * S - z) / (12 * S);
}

function colorAt(x, z, h) {
  const m = h * 100;
  const v = noise(x / 3, z / 3) * 0.06;
  const c = new THREE.Color();
  const n = northness(x, z);
  const rt = Math.hypot(x - P.teide[0], z - P.teide[1]), rp = Math.hypot(x - P.pico[0], z - P.pico[1]);
  const ex = (x - P.caldera[0]) / (40 * S), ez = (z - P.caldera[1]) / (27 * S);
  if (m < 70) c.set(n > 0 || x < -120 * S ? '#3d3a38' : '#e6cd8c');                       // schwarzer/goldener Sand
  else if (Math.hypot(x - P.roja[0], z - P.roja[1]) < 4 * S) c.set('#b5532c');            // Montaña Roja
  else if (rt < 17 * S && m > 2300) c.set(m > 3450 ? '#d8cbb3' : (noise(x / 2, z / 2) > 0.2 ? '#4a3f3a' : '#7a5040')); // Teide
  else if (rp < 12 * S && m > 2300) c.set('#5a4a44');
  else if (Math.hypot(ex, ez) < 1) c.set(noise(x / 6, z / 6) > 0.25 ? '#4a4442' : '#cdb488');          // Caldera: Lava und Bimsstein
  else if (m > 2200) c.set('#a08c6a');
  else if (m > 1050) c.set(n > -0.3 ? '#3d7a3a' : '#4a8040');                         // Kanarenkiefern-Gürtel
  else if (lineDist(x, z, ANAGA) < 14 * S) c.set('#2f6a3a');                              // Lorbeerwald Anaga
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
  n = Math.round(n * 1.4);
  r = Math.max(r * 1.5, 4.2 * Math.sqrt(n)); // Platz für alle Häuser
  const placed = [], all = (w.houses ||= []);
  for (let k = 0; k < n * 12 && placed.length < n; k++) {
    const a = w.r(0, Math.PI * 2), d = Math.sqrt(w.rng()) * r;
    const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    const wd = w.r(o.minW || 3, o.maxW || 5), dp = w.r(o.minW || 3, o.maxW || 5);
    if (w.heightAt(x, z) <= 0.4 || w.heightAt(x + wd / 2, z) <= 0.4 || w.heightAt(x, z + dp / 2) <= 0.4) continue;
    if (all.some(([px, pz, pw]) => Math.abs(px - x) < (pw + wd) / 2 + 1.2 && Math.abs(pz - z) < (pw + dp) / 2 + 1.2)) continue;
    if (o.avoid && o.avoid(x, z)) continue;
    const half = Math.max(wd, dp) / 2;
    if (KEEP.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr + half) || onRoad(x, z, half + 1.6)) continue;
    const h = w.r(o.minH || 3, o.maxH || 5.5);
    lightHouse(w, x, z, wd, dp, h, { roof: o.roof, balcony: o.balcony, wall: o.walls ? w.pick(o.walls) : undefined });
    placed.push([x, z, Math.max(wd, dp)]);
    all.push(placed[placed.length - 1]);
  }
  for (let i = 0; i < Math.ceil(n / 4); i++) {
    const x = cx + w.r(-r, r), z = cz + w.r(-r, r);
    if (!onRoad(x, z, 2) && !KEEP.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr + 1) && !placed.some(([px, pz, pw]) => Math.abs(px - x) < pw / 2 + 1 && Math.abs(pz - z) < pw / 2 + 1)) palm(w, x, z);
  }
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
      const lift = (k % 2) * 0.03;
      w.box(2.4, 0.12, 2.3, '#4a4d52', x, h + 0.04 + lift, z, ry);
      if (k % 2 === 0) w.box(0.15, 0.13, 0.9, '#f2f2f2', x, h + 0.06, z, ry);
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

// Thai-Dach: zwei steile Stufen mit goldenem First und Spitzen
function thaiRoof(w, x, y, z, wd, dp, color = '#c0392b', trim = '#ffd23f') {
  for (let t = 0; t < 2; t++) {
    const k = 1 - t * 0.4, yy = y + t * 1.4, rh = dp * k * 0.36;
    for (const sg of [-1, 1]) w.box(wd * k + 0.6, 0.25, dp * k * 0.64, t ? '#2fa84f' : color, x, yy + rh / 2, z + sg * dp * k / 4, 0, sg * 0.75);
    w.box(wd * k + 0.7, 0.22, 0.3, trim, x, yy + rh + 0.08, z);
  }
  for (const sg of [-1, 1]) w.cone(0.22, 1.3, trim, x + sg * (wd / 2 + 0.2), y + dp * 0.3, z, { seg: 5, shadow: false });
}

// Goldene Elefanten-Statue auf Sockel (Blick nach +z)
function elephantStatue(w, x, y, z, c = '#d4a017') {
  w.block(x, y + 0.8, z, 3, 0.8, 4, '#efe3c8', { plain: true });
  const b = y + 0.8;
  w.box(2.2, 1.6, 3, c, x, b + 2, z);
  for (const [dx, dz] of [[-0.7, -1], [0.7, -1], [-0.7, 1], [0.7, 1]]) w.box(0.6, 1.3, 0.6, c, x + dx, b + 0.65, z + dz);
  w.box(1.5, 1.4, 1.2, c, x, b + 2.4, z + 1.9);
  for (const sg of [-1, 1]) w.box(0.15, 1.2, 1, c, x + sg * 0.9, b + 2.4, z + 1.6);
  w.box(0.45, 1.5, 0.45, c, x, b + 1.3, z + 2.6, 0, 0.2);
}

// Fischerboote, die im Hafen schaukeln
function boats(w, list) {
  const gs = list.map(([x, z, ry, c]) => {
    const g = new THREE.Group();
    part(g, 1.4, 0.6, 3.4, c, 0, 0.1, 0);
    part(g, 1.5, 0.15, 3.5, '#ffffff', 0, 0.45, 0);
    part(g, 0.8, 0.7, 0.9, '#ffffff', 0, 0.8, -0.5);
    part(g, 0.08, 1.8, 0.08, '#6b4423', 0, 1.3, 0.6);
    g.position.set(x, -0.25, z);
    g.rotation.y = ry;
    w.add(g);
    return g;
  });
  w.updaters.push((dt, t) => gs.forEach((g, i) => { g.position.y = -0.25 + Math.sin(t * 1.6 + i) * 0.08; g.rotation.z = Math.sin(t * 1.2 + i * 2) * 0.05; }));
}

// Säulenkaktus mit Armen
function cactus(w, x, z, s = 1) {
  const y = w.heightAt(x, z);
  w.box(0.6 * s, 3 * s, 0.6 * s, '#3f8a3a', x, y + 1.5 * s, z);
  w.box(0.9 * s, 0.4 * s, 0.4 * s, '#3f8a3a', x + 0.55 * s, y + 1.4 * s, z);
  w.box(0.4 * s, 1.1 * s, 0.4 * s, '#3f8a3a', x + 0.9 * s, y + 1.95 * s, z);
  w.box(0.8 * s, 0.4 * s, 0.4 * s, '#3f8a3a', x - 0.5 * s, y + 2 * s, z);
  w.box(0.4 * s, 0.8 * s, 0.4 * s, '#3f8a3a', x - 0.8 * s, y + 2.4 * s, z);
  w.box(0.3 * s, 0.25 * s, 0.3 * s, '#ff595e', x, y + 3.1 * s, z);
}

// ---------- Welt ----------
export const tenerife = {
  id: 'tenerife',
  name: 'Teneriffa',
  seed: 103,
  theme: { sky: ['#1a7fd8', '#7cc8ff', '#eaf7ff'], fog: '#d6eeff', sea: '#1f8fc9', fogNear: 150, fogFar: 480 },
  stars: {
    cablecar: 'Seilbahn zum Teide', teide: 'Teide-Gipfel (3718 m)', drago: 'Drachenbaum von Icod', masca: 'Masca-Schlucht',
    whales: 'Wal-Tour Los Gigantes', pyramids: 'Pyramiden von Güímar', lighthouse: 'Leuchtturm von Teno',
    cactus: 'Kaktus-Labyrinth', agatha: 'Agatha-Christie-Treppe',
    waterpark: 'Wasserrutsche', observatory: 'Sternwarte Izaña', castle: 'Castillo de San Miguel', camels: 'Kamel-Safari',
    tram: 'Straßenbahn nach La Laguna', lunar: 'Paisaje Lunar', rental: 'Mietwagen-Profi (3 Aufträge)',
  },
  missionStar: { id: 'rental', count: 3 },
  build(w) {
    const cell = 3, x0 = -205 * S, z0 = -175 * S, cols = Math.ceil(410 * S / cell), rows = Math.ceil(345 * S / cell);
    w.terrain({ x0, z0, cols, rows, cell, step: 0.5, height: (x, z) => heightM(x, z) / 100, color: colorAt });
    w.killY = -1.6;
    w.viewDist = 80; // viele Tiere: nur die nahen zeichnen

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

    // Mietwagen am Flughafen: einsteigen und die große Insel erkunden, Aufträge erledigen
    lightHouse(w, ax - 13, az - 6, 6, 3.4, 3, { wall: '#ffd23f', roofColor: '#17233b' });
    sign(w, 'Mietwagen', [ax - 13, az - 6], 5.5, { bg: '#17233b', fg: '#ffd23f' });
    w.box(20, 0.08, 7, '#5a5f66', ax - 12, ay + 0.05, az - 13);
    w.car({ x: ax - 20, z: az - 13, kind: 'taxi', ry: Math.PI });
    w.car({ x: ax - 13, z: az - 13, kind: 'sport', ry: Math.PI });
    w.car({ x: ax - 6, z: az - 13, kind: 'monster', ry: Math.PI });
    w.star('rental', ax - 13, ay + 16, az - 6, 'Mietwagen-Profi');
    w.car({ x: P.santaCruz[0] - 10, z: P.santaCruz[1] - 4, kind: 'police', ry: Math.PI / 2 });
    w.car({ x: P.puerto[0] + 12, z: P.puerto[1] - 6, kind: 'pizza', ry: Math.PI });
    w.car({ x: P.parador[0] + 7, z: P.parador[1] + 3, kind: 'taxi', ry: 0 });
    w.mission({ type: 'taxi', label: 'Taxi zum Strand', start: [ax - 4, az - 22], time: 90, reward: 40,
      stages: [{ at: [ax + 2, az - 16], text: 'Hol die Urlauberin am Terminal ab', person: true }, { at: [P.cristianos[0] + 4, P.cristianos[1] - 6], text: 'Fahr sie nach Los Cristianos' }] });
    w.mission({ type: 'race', label: 'Rallye Las Cañadas', start: [P.parador[0] + 6, P.parador[1] - 4], time: 120, reward: 60,
      stages: [{ at: P.tauce, text: 'Checkpoint Boca de Tauce' }, { at: [P.cableBase[0] + 4, P.cableBase[1] + 4], text: 'Checkpoint Seilbahn' }, { at: P.portillo, text: 'Checkpoint El Portillo' }, { at: [P.parador[0] + 6, P.parador[1] + 6], text: 'Ziel: Parador' }] });
    w.mission({ type: 'pizza', label: 'Pizza für La Orotava', start: [P.puerto[0] + 12, P.puerto[1] - 11], time: 75, reward: 40,
      stages: [{ at: [P.orotava[0] + 2, P.orotava[1] + 8], text: 'Liefere die Pizza nach La Orotava' }, { at: [P.realejos[0], P.realejos[1] + 6], text: 'Noch eine nach Los Realejos' }] });
    w.mission({ type: 'taxi', label: 'Taxi zur Altstadt', start: [P.santaCruz[0] - 10, P.santaCruz[1] - 10], time: 80, reward: 40,
      stages: [{ at: [P.santaCruz[0] - 4, P.santaCruz[1] - 12], text: 'Hol den Fahrgast am Hafen ab', person: true }, { at: [P.laguna[0] - 8, P.laguna[1] + 10], text: 'Bring ihn nach La Laguna' }] });
    w.mission({ type: 'police', label: 'Raser an der Küste', start: [P.americas[0] + 14, P.americas[1] - 16], time: 70, reward: 50, speed: 13,
      path: [[P.americas[0] + 10, P.americas[1] - 20], [P.cristianos[0] + 16, P.cristianos[1] - 18], [P.airport[0] - 30, P.airport[1] - 14], [P.cristianos[0] + 22, P.cristianos[1] - 28], [P.adeje[0] + 6, P.adeje[1] + 6]] });

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
    for (let k = 0; k < 140; k++) {
      const a = w.r(0, Math.PI * 2), d = Math.sqrt(w.rng());
      const x = P.caldera[0] + Math.cos(a) * d * 38 * S, z = P.caldera[1] + Math.sin(a) * d * 25 * S;
      const h = w.heightAt(x, z);
      if (h < 20 || h > 23.5) continue;
      if (k % 3 === 0) { w.box(0.35, 2.6, 0.35, '#d6283c', x, h + 1.3, z); w.box(0.6, 0.6, 0.6, '#5a8a3a', x, h + 0.3, z); }
      else w.box(1.4, 0.9, 1.2, '#f4f1e6', x, h + 0.45, z, w.r(0, 3));
    }
    w.animal('lizard', { pos: new THREE.Vector3(rx + 3, 0, rz + 4), radius: 4, speed: 1.2, hungry: true });
    for (let i = 0; i < 2; i++) w.animal('bird', { pos: new THREE.Vector3(P.caldera[0] + i * 10, 0, P.caldera[1]), y: 24 + i * 2, behavior: 'fly', radius: 12, speed: 5, colors: ['#5b7fb8', '#3d5a80', '#7a8fa8'], scale: 0.7 });

    // Kanarenkiefern im Waldgürtel, Lorbeerwald in Anaga, Wolfsmilch im Süden
    let placed = 0;
    for (let k = 0; k < 8000 && placed < 320; k++) {
      const x = w.r(-190, 190) * S, z = w.r(-165, 160) * S, h = w.heightAt(x, z);
      if (h < 10.5 || h > 20.5) continue;
      if (Math.hypot((x - P.caldera[0]) / (40 * S), (z - P.caldera[1]) / (27 * S)) < 1.05) continue;
      w.tree('pine', x, z, w.r(1.1, 1.5), h, false);
      placed++;
    }
    placed = 0;
    for (let k = 0; k < 3000 && placed < 80; k++) {
      const x = w.r(100, 195) * S, z = w.r(-165, -120) * S, h = w.heightAt(x, z);
      if (h < 2 || lineDist(x, z, ANAGA) > 12 * S) continue;
      w.tree('oak', x, z, w.r(0.9, 1.3), h, false);
      placed++;
    }
    for (let k = 0; k < 300; k++) {
      const x = w.r(-150, 80) * S, z = w.r(30, 160) * S, h = w.heightAt(x, z);
      if (h < 0.8 || h > 9 || northness(x, z) > 0) continue;
      const s = w.r(0.4, 0.9);
      w.box(s * 1.3, s * 0.7, s * 1.2, k % 2 ? '#7f9a5a' : '#9aa86a', x, h + s * 0.35, z, w.r(0, 3));
    }

    // Wolkenmeer über der Nordseite (Passatwolken)
    const cloudGeo = new THREE.BoxGeometry(1, 1, 1);
    const clouds = new THREE.InstancedMesh(cloudGeo, new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.72, depthWrite: false }), 160);
    const m4 = new THREE.Matrix4();
    let ci = 0;
    for (let k = 0; k < 5000 && ci < 160; k++) {
      const x = w.r(-150, 170) * S, z = w.r(-150, 0) * S, h = w.heightAt(x, z);
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
    sign(w, 'Goldstrand Las Teresitas', P.teresitas, 5, { bg: '#e8b04a', fg: '#17233b' });
    {
      // Goldener Sandstrand entlang der Küste, Wellenbrecher davor, Sonnenschirme
      const a = geo(-16.198, 28.498), b = geo(-16.176, 28.517);
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
      let nx = uz, nz = -ux;
      if (w.heightAt((a[0] + b[0]) / 2 + nx * 8, (a[1] + b[1]) / 2 + nz * 8) > 0) { nx = -nx; nz = -nz; }
      const ry = Math.atan2(ux, uz);
      for (let k = 0; k <= L; k += 3) {
        const x = a[0] + ux * k, z = a[1] + uz * k;
        w.box(3, 0.3, 3, '#f2c94c', x + nx * 1, 0.45, z + nz * 1, ry);
        w.box(3, 0.3, 3, '#f2c94c', x + nx * 4, 0.15, z + nz * 4, ry);
        if (k % 6 === 0) w.box(3.6, 1.4, 1.6, '#7a7470', x + nx * 13, 0.2, z + nz * 13, ry);
        if (k % 6 === 3) { w.box(0.12, 2, 0.12, '#ffffff', x + nx * 2.5, 1.4, z + nz * 2.5); w.cone(1.1, 0.6, k % 4 ? '#ff595e' : '#2f7df6', x + nx * 2.5, 2.2, z + nz * 2.5, { seg: 8, shadow: false }); }
      }
    }
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
    for (let k = 0; k < 24; k++) {
      const t = w.rng(), x = P.puerto[0] - (20 + t * 80) * S, z = P.puerto[1] + 6 + w.r(-4, 6) + t * 20 * S;
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
    town(w, P.garachico[0], P.garachico[1] + 6, 6, 12, { roof: 'tile' });
    sign(w, 'Garachico', P.garachico, 7);
    town(w, P.buenavista[0], P.buenavista[1] + 2, 6, 10);
    // Teno: Leuchtturm (Wendeltreppe)
    lighthouse(w, P.tenoFaro, 'lighthouse');
    sign(w, 'Punta de Teno', [P.tenoFaro[0] + 6, P.tenoFaro[1] + 4], 4, { size: 0.9 });
    // Masca: Bergdorf, Schlucht und Strand (Tor am Strand)
    town(w, P.masca[0], P.masca[1], 4, 7, { minH: 2.5, maxH: 3.5, roof: 'tile' });
    sign(w, 'Masca', P.masca, 7);
    const [mbx, mbz] = P.mascaBeach, mby = w.heightAt(mbx, mbz);
    // Wanderweg durch die Schlucht: Felsstufen von je 0,5 hinab zum Strand
    const [vx, vz] = P.masca, vy = w.heightAt(vx, vz);
    const ex = mbx + 6, ez = mbz - 1.5, nT = Math.max(4, Math.ceil((vy - mby) / 0.5));
    for (let k = 1; k <= nT; k++) {
      const t = k / (nT + 1), x = vx + (ex - vx) * t, z = vz + (ez - vz) * t;
      const top = vy + (mby - vy) * t;
      const ground = w.heightAt(x, z);
      if (ground >= top) continue;
      w.block(x, top, z, 2.2, top - ground + 0.6, 2.2, '#8a7a6a');
    }
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
    town(w, P.americas[0], P.americas[1] - 10, 12, 22, { minW: 4, maxW: 7, minH: 6, maxH: 13, balcony: '#ffffff', walls: ['#ffffff', '#f6f1e7', '#f4e2c8'] });
    town(w, P.cristianos[0] + 2, P.cristianos[1] - 10, 7, 12, { minH: 3, maxH: 7 });
    sign(w, 'Playa de las Américas', P.americas, 14);
    sign(w, 'Los Cristianos', P.cristianos, 9);
    for (let k = 0; k < 10; k++) {
      const x = P.americas[0] + w.r(-14, 10), z = P.americas[1] + 8 + w.r(-1, 2);
      if (w.heightAt(x, z) <= 0.3) continue;
      w.box(0.12, 2, 0.12, '#ffffff', x, w.heightAt(x, z) + 1, z);
      w.cone(1.1, 0.6, k % 2 ? '#ff595e' : '#ffd23f', x, w.heightAt(x, z) + 1.9, z, { seg: 8, shadow: false });
    }
    town(w, P.medano[0] + 3, P.medano[1] - 9, 5, 9);
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

    // ---------- Weitere Orte ----------
    const TOWNS = [
      ['tacoronte', 'Tacoronte', 7, 12, { roof: 'tile' }], ['santaUrsula', 'Santa Úrsula', 6, 10], ['realejos', 'Los Realejos', 8, 14, { roof: 'tile', balcony: '#6b4423' }],
      ['rambla', 'San Juan de la Rambla', 5, 8, { roof: 'tile' }], ['bajamar', 'Bajamar', 5, 9], ['sanAndres', 'San Andrés', 5, 9, { walls: ['#f2d16b', '#5b8fd6', '#d2693c', '#7fb069', '#ffffff'] }],
      ['tegueste', 'Tegueste', 5, 8, { roof: 'tile' }], ['fasnia', 'Fasnia', 4, 6], ['poris', 'Poris de Abona', 4, 7], ['arico', 'Arico', 4, 6, { roof: 'tile' }],
      ['sanIsidro', 'San Isidro', 7, 12], ['abrigos', 'Los Abrigos', 4, 7], ['galletas', 'Las Galletas', 6, 10, { balcony: '#ffffff' }],
      ['arona', 'Arona', 5, 8, { roof: 'tile' }], ['caleta', 'La Caleta', 5, 8, { balcony: '#ffffff' }], ['callao', 'Callao Salvaje', 6, 10, { minH: 4, maxH: 8, balcony: '#ffffff' }],
      ['guia', 'Guía de Isora', 6, 10], ['alcala', 'Alcalá', 4, 7], ['arena', 'Puerto de Santiago', 6, 11, { minH: 3, maxH: 7, balcony: '#ffffff' }],
      ['tamaimo', 'Tamaimo', 4, 6], ['tanque', 'El Tanque', 4, 6, { roof: 'tile' }],
    ];
    for (const [k, name, r, n, o] of TOWNS) { town(w, P[k][0], P[k][1], r, n, o); sign(w, name, P[k], 8, { size: 1 }); }
    sign(w, 'Adeje', P.adeje, 8, { size: 1 });
    sign(w, 'Granadilla', P.granadilla, 8, { size: 1 });
    sign(w, 'Santiago del Teide', P.santiago, 8, { size: 1 });
    town(w, P.santiago[0], P.santiago[1], 4, 6, { roof: 'tile' });
    sign(w, 'Playa San Juan', P.sanJuan, 7, { size: 1 });

    // Wasserpark: Turm im Tempelstil, Rutsche ins Wellenbecken
    const [wpx, wpz] = P.waterpark, wpy = w.heightAt(wpx, wpz);
    w.box(24, 0.08, 20, '#efe3c8', wpx, wpy + 0.04, wpz);
    w.water(wpx + 5, wpz + 4, 11, 8, { top: wpy + 0.12, color: '#38d0f0' });
    w.water(wpx - 7, wpz + 6, 6, 4, { top: wpy + 0.12, color: '#5fe0f5' });
    const twx = wpx - 7, twz = wpz - 5, twTop = wpy + 13;
    w.block(twx, twTop - 6, twz, 6, 7, 6, '#f2d16b');
    w.block(twx, twTop, twz, 4.4, 6, 4.4, '#e8b04a');
    w.box(5.4, 0.5, 5.4, '#c0392b', twx, twTop + 0.25, twz);
    w.cone(2.6, 4.5, '#ffd23f', twx, twTop + 0.5, twz, { seg: 8 });
    for (const [ddx, ddz] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) w.cone(0.6, 2.4, '#ffd23f', twx + ddx, twTop - 5.5, twz + ddz, { seg: 6, shadow: false });
    const slidePts = [[twx + 3.4, twTop + 0.4, twz], [twx + 6, twTop - 3, twz - 3], [twx + 9, twTop - 6, twz + 1], [twx + 6, twTop - 9, twz + 5], [twx + 10, wpy + 2, twz + 7], [wpx + 4, wpy + 0.3, wpz + 4]];
    const slideCurve = new THREE.CatmullRomCurve3(slidePts.map((q) => new THREE.Vector3(...q)));
    for (let k = 0; k <= 40; k++) {
      const p = slideCurve.getPointAt(k / 40), tn = slideCurve.getTangentAt(k / 40);
      w.box(1.6, 0.25, 1.4, k % 2 ? '#2f7df6' : '#4cc9f0', p.x, p.y - 0.45, p.z, Math.atan2(tn.x, tn.z));
    }
    const tube = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.32, 8, 16), new THREE.MeshLambertMaterial({ color: '#ff595e' }));
    ring.rotation.x = Math.PI / 2;
    tube.add(ring);
    const wst2 = w.station(wpx + 2, wpz - 7, 'Wasserrutsche', '#2f7df6', wpy);
    w.addRide(pathRide(w, {
      points: slidePts, closed: false, duration: 7, vehicle: tube, seat: [0, -0.2, 0], flat: true, idle: 'wait', name: 'Wasserrutsche', starId: 'waterpark', station: wst2,
      exit: new THREE.Vector3(wpx + 4, wpy, wpz - 1),
      animate(v, t, riding) { if (riding) v.rotateY(t * 4 % (Math.PI * 2)); },
    }));
    for (let k = 0; k < 8; k++) w.box(0.9, 0.25, 2, k % 2 ? '#ffffff' : '#ff595e', wpx - 9 + k * 2.2, wpy + 0.2, wpz - 1);
    for (let k = 0; k < 10; k++) palm(w, wpx + w.r(-11, 11), wpz + (k % 2 ? 9 : -9) + w.r(-1, 1));
    sign(w, 'Wasserpark im Thai-Stil', [wpx, wpz - 9], 7, { bg: '#c0392b', fg: '#ffd23f', size: 1.3 });
    thaiRoof(w, twx, twTop - 6, twz, 6.4, 6.4);
    // Eingangstor mit Thai-Dach, goldene Elefanten, Strömungskanal rund um den Park
    for (const sg of [-1, 1]) w.block(wpx + sg * 2.6, wpy + 4, wpz - 11, 0.9, 4, 0.9, '#c0392b', { plain: true });
    thaiRoof(w, wpx, wpy + 4, wpz - 11, 6.4, 2.4);
    for (const sg of [-1, 1]) elephantStatue(w, wpx + sg * 6, wpy, wpz - 12);
    for (const [x, z, ww, dd] of [[0, -9.6, 22.8, 1.6], [0, 9.6, 22.8, 1.6], [-11.4, 0, 1.6, 17.6], [11.4, 0, 1.6, 17.6]]) w.water(wpx + x, wpz + z, ww, dd, { top: wpy + 0.14, color: '#2fc4e8' });
    for (let k = 0; k < 6; k++) w.box(1.4, 0.5, 1.4, '#ffd23f', wpx - 10 + k * 4, wpy + 0.3, wpz + 9.6);

    // Einkaufszentrum im Thai-Stil gleich nebenan
    const [mlx, mlz] = P.mall, mly = w.heightAt(mlx, mlz);
    w.box(22, 0.08, 14, '#e9dcc0', mlx, mly + 0.04, mlz);
    w.block(mlx, mly + 5, mlz + 1, 16, 5, 8, '#f4e2c8', { plain: true, safe: true });
    thaiRoof(w, mlx, mly + 5, mlz + 1, 16, 8);
    for (const sg of [-1, 1]) { w.block(mlx + sg * 9.5, mly + 3.5, mlz + 1, 3, 3.5, 6, '#f4e2c8', { plain: true, safe: true }); thaiRoof(w, mlx + sg * 9.5, mly + 3.5, mlz + 1, 3, 6); }
    for (let k = -3; k <= 3; k++) w.box(1.6, 2.2, 0.08, k === 0 ? '#ffd23f' : ['#7cc4ff', '#ff9fc4', '#9be38a'][(k + 3) % 3], mlx + k * 2.1, mly + 1.4, mlz - 3.05);
    for (const sg of [-1, 1]) elephantStatue(w, mlx + sg * 4.5, mly, mlz - 6);
    sign(w, 'Einkaufszentrum', [mlx, mlz - 3], 9.5, { bg: '#c0392b', fg: '#ffd23f' });
    for (let k = 0; k < 6; k++) palm(w, mlx - 9 + k * 3.6, mlz - 8);
    w.animal('cat', { pos: new THREE.Vector3(mlx + 3, 0, mlz - 6), radius: 3, speed: 1, color: '#d9cbb0', hungry: true });

    // Affenpark bei Los Cristianos
    const [mkx, mkz] = P.monkeys, mky = w.heightAt(mkx, mkz);
    for (let k = 0; k < 4; k++) w.tree('palm', mkx + w.r(-4, 4), mkz + w.r(-4, 4), w.r(0.9, 1.2), mky, false);
    for (let i = 0; i < 4; i++) w.animal('monkey', { pos: new THREE.Vector3(mkx + w.r(-3, 3), 0, mkz + w.r(-3, 3)), radius: 4, speed: 1.4, hungry: i === 0 });
    sign(w, 'Affenpark', P.monkeys, 6, { bg: '#7a4a2a' });
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; w.box(1.2, 1, 0.15, '#8a5e33', mkx + Math.cos(a) * 5.5, mky + 0.5, mkz + Math.sin(a) * 5.5, a + Math.PI / 2); }
    w.block(mkx + 2, mky + 2.4, mkz - 2, 2.6, 0.4, 2.6, '#8a5e33', { plain: true });
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) w.box(0.25, 2.2, 0.25, '#6b4423', mkx + 2 + dx, mky + 1.1, mkz - 2 + dz);
    for (let i = 0; i < 3; i++) w.animal('monkey', { pos: new THREE.Vector3(mkx + w.r(-3, 3), 0, mkz + w.r(-3, 3)), radius: 4, speed: 1.6 });

    // Kaktusfarm mit Kaktus-Labyrinth (Tor mit Aufgabe, Stern in der hintersten Ecke)
    const [kfx, kfz] = P.cactus, kfy = w.heightAt(kfx, kfz);
    w.maze({ x0: kfx - 10.2, z0: kfz - 10.2, C: 6, S: 3.4, color: '#4f8a3a', label: 'Kaktus-Labyrinth', starId: 'cactus', y: kfy, row: 2 });
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2, d = 12.5 + (k % 3);
      const x = kfx + Math.cos(a) * d, z = kfz + Math.sin(a) * d;
      if (x < kfx - 11 && Math.abs(z - (kfz - 10.2 + 2.5 * 3.4)) < 3) continue;
      if (k % 3 === 2) { const y = w.heightAt(x, z); for (let q = 0; q < 3; q++) w.box(0.9, 1.1, 0.2, '#5f9a48', x + q * 0.4 - 0.4, y + 0.5 + q * 0.5, z, q - 1); w.box(0.25, 0.25, 0.25, '#ffd23f', x, y + 1.9, z); }
      else cactus(w, x, z, w.r(0.8, 1.3));
    }
    lightHouse(w, kfx + 4, kfz - 14, 6, 3.4, 3, { wall: '#f6f1e7', roof: 'tile' });
    sign(w, 'Kaktusfarm', [kfx + 4, kfz - 14], 6, { bg: '#4f8a3a' });

    // Rock-Café an der Promenade von Playa de las Américas (mit Riesengitarre)
    const [rcx, rcz] = P.rock;
    const rcTop = lightHouse(w, rcx, rcz, 7, 5, 4, { wall: '#2b2b2b', roofColor: '#17233b', window: '#ffd23f' });
    const rcy = rcTop - 4;
    w.box(1.8, 2.4, 0.4, '#e8262b', rcx + 4.6, rcy + 1.6, rcz + 2.8, 0, 0, 0.25);
    w.box(1.4, 1.8, 0.42, '#e8262b', rcx + 4.9, rcy + 3.1, rcz + 2.8, 0, 0, 0.25);
    w.box(0.35, 4, 0.3, '#6b4423', rcx + 5.5, rcy + 5.2, rcz + 2.8, 0, 0, 0.25);
    w.box(0.6, 1, 0.32, '#2b2b2b', rcx + 6.05, rcy + 7.4, rcz + 2.8, 0, 0, 0.25);
    sign(w, 'Rock-Café', [rcx, rcz], 6.5, { bg: '#17233b', fg: '#ffd23f' });

    // Walskelett an der Promenade von Los Gigantes
    const [wsx, wsz] = P.whale, wsy = w.heightAt(wsx, wsz);
    w.box(14, 0.4, 3, '#8d939b', wsx, wsy + 0.2, wsz);
    for (let k = 0; k < 14; k++) {
      const x = wsx - 6 + k * 0.9, sz = 1 - Math.abs(k - 5) / 11;
      w.box(0.6, 0.6, 0.6, '#f2ece0', x, wsy + 2.4, wsz);
      if (k > 1 && k < 10) for (const sg of [-1, 1]) {
        w.box(0.18, 0.18, 1.2 * sz, '#f2ece0', x, wsy + 2.3, wsz + sg * 0.6 * sz, 0, sg * 0.5);
        w.box(0.18, 1.6 * sz, 0.18, '#f2ece0', x, wsy + 1.5, wsz + sg * 1.15 * sz);
      }
    }
    w.box(2.6, 1, 1.6, '#f2ece0', wsx - 7.2, wsy + 2.2, wsz);
    for (const sg of [-1, 1]) w.box(3.2, 0.25, 0.25, '#f2ece0', wsx - 8, wsy + 1.6, wsz + sg * 0.6, sg * 0.15);
    for (const dx of [-4, 0, 4]) w.box(0.3, 2.2, 0.3, '#5a5f66', wsx + dx, wsy + 1.2, wsz);
    sign(w, 'Walskelett', [wsx, wsz], 5, { bg: '#1f8fc9', size: 1 });
    boats(w, [[P.gigantes[0] - 7, P.gigantes[1] + 1, 0.3, '#ffffff'], [P.gigantes[0] - 8, P.gigantes[1] - 3, -0.2, '#1f8fc9'], [P.gigantes[0] - 10, P.gigantes[1] + 5, 1.2, '#e8262b']]);

    // Palmetum: Palmenpark auf dem Hügel am Meer in Santa Cruz
    const [pmx, pmz] = P.palmetum, pmy = w.heightAt(pmx, pmz);
    w.water(pmx + 2, pmz + 1, 4, 3, { top: pmy + 0.1, color: '#4fc0f0' });
    for (let k = 0; k < 26; k++) { const a = w.r(0, Math.PI * 2), d = w.r(1.5, 7.5); palm(w, pmx + Math.cos(a) * d, pmz + Math.sin(a) * d); }
    for (let k = 0; k < 10; k++) w.box(1.4, 0.06, 1.4, '#d9cbb0', pmx - 7 + k * 1.5, pmy + 0.04, pmz - 0.5 + Math.sin(k) * 1.2);
    sign(w, 'Palmetum – Palmenpark', P.palmetum, 7, { bg: '#2fa84f' });

    // Hafen von Puerto de la Cruz: Mole, Leuchtfeuer, Fischerboote
    const hpx = P.puerto[0] - 2, hpz = P.puerto[1] - 5;
    w.block(hpx, 1.1, hpz - 6, 2.6, 3, 12, '#8d939b', { plain: true, safe: true });
    w.block(hpx + 4, 1.1, hpz - 12.6, 10, 3, 2, '#7a7470', { plain: true, safe: true });
    w.box(0.9, 2.6, 0.9, '#ffffff', hpx + 8, 2.4, hpz - 12.6); w.box(1.1, 0.7, 1.1, '#2fbf4a', hpx + 8, 4, hpz - 12.6);
    boats(w, [[hpx + 3, hpz - 6, 0.1, '#1f8fc9'], [hpx + 5.5, hpz - 8, -0.3, '#ffd23f'], [hpx + 3.4, hpz - 9.6, 0.2, '#e8262b'], [hpx - 3.5, hpz - 7, 0.5, '#2fbf4a']]);
    sign(w, 'Hafen Puerto de la Cruz', [hpx, hpz - 2], 4, { size: 0.9 });

    // Steakhaus am Papageienpark (Punta Brava)
    const shx = P.loro[0] + 11, shz = P.loro[1] - 2;
    const shTop = lightHouse(w, shx, shz, 7, 5, 3.4, { wall: '#6b4423', roof: 'tile', window: '#ffd23f' });
    const shy = shTop - 3.4;
    w.box(7, 0.2, 2.6, '#c9a46a', shx, shy + 0.1, shz + 3.8);
    for (let k = 0; k < 3; k++) { w.box(0.9, 0.7, 0.9, '#ffffff', shx - 2.2 + k * 2.2, shy + 0.55, shz + 3.8); w.cone(0.9, 0.5, '#e8262b', shx - 2.2 + k * 2.2, shy + 2, shz + 3.8, { seg: 8, shadow: false }); w.box(0.08, 1.5, 0.08, '#ffffff', shx - 2.2 + k * 2.2, shy + 1.2, shz + 3.8); }
    sign(w, 'Steakhaus', [shx, shz], 5.5, { bg: '#6b4423', fg: '#ffd23f', size: 1 });

    // Agatha-Christie-Treppe: bunte Stufen hinauf zum Taoro-Park mit dem alten Grand Hotel
    const [tox, toz] = P.taoro, g0 = w.heightAt(tox, toz - 14), topP = g0 + 5.5;
    const tiles = ['#f2d16b', '#5b8fd6', '#ffffff', '#d2693c'];
    for (let k = 1; k <= 10; k++) {
      const z = toz - 4.5 - (10 - k + 0.5) * 0.9, top = g0 + k * 0.5;
      w.block(tox, top, z, 3, Math.max(0.6, top - w.heightAt(tox, z) + 1), 0.95, tiles[k % 4], { plain: true });
      for (const sg of [-1, 1]) w.box(0.12, 0.9, 0.95, '#2b2b2b', tox + sg * 1.55, top + 0.45, z);
    }
    let lowP = Infinity;
    for (const [dx, dz] of [[-6, -4.5], [6, -4.5], [-6, 4.5], [6, 4.5]]) lowP = Math.min(lowP, w.heightAt(tox + dx, toz + dz));
    w.block(tox, topP, toz, 12, topP - lowP + 1.5, 9, '#e9dcc0', { plain: true, safe: true });
    w.block(tox, topP + 4, toz + 2.6, 10, 4, 3.6, '#f6f1e7', { plain: true, safe: true });
    w.box(10.4, 0.25, 2.4, '#b5532c', tox, topP + 4.5, toz + 3.5, 0, 0.55); w.box(10.4, 0.25, 2.4, '#b5532c', tox, topP + 4.5, toz + 1.7, 0, -0.55);
    for (let k = -2; k <= 2; k++) w.box(1, 1.2, 0.08, '#3d5a80', tox + k * 2, topP + 2.2, toz + 0.76);
    for (const dx of [-4.5, 4.5]) w.tree('palm', tox + dx, toz - 2.5, 0.9, topP, false);
    w.star('agatha', tox, topP, toz - 2, 'Agatha-Christie-Treppe');
    sign(w, 'Agatha-Christie-Treppe', [tox, toz - 14], 4.5, { bg: '#5b8fd6', size: 1 });
    sign(w, 'Agatha Christie war 1927 im Hotel Taoro zu Gast', [tox, toz + 2.6], topP - w.heightAt(tox, toz + 2.6) + 6.5, { bg: '#ffffff', fg: '#17233b', size: 0.7 });

    // Barranco del Infierno: Wasserfall am Ende der Schlucht
    const [bix, biz] = P.barranco, biy = w.heightAt(bix, biz);
    w.box(6, 9, 3, '#6b5a50', bix, biy + 4.5, biz - 3);
    const fall = w.box(1.4, 8, 0.3, '#9fe3ff', bix, biy + 4.2, biz - 1.35);
    void fall;
    w.water(bix, biz + 0.5, 4, 3, { top: biy + 0.12, color: '#4fc0f0' });
    for (let k = 0; k < 6; k++) { const x = bix + w.r(-5, 5), z = biz + w.r(2, 6); w.tree('oak', x, z, w.r(0.7, 1), w.heightAt(x, z), false); }
    sign(w, 'Barranco del Infierno', [bix, biz + 3], 6, { bg: '#2f6a3a', size: 0.9 });

    // Sternwarte Izaña auf der Cumbre Dorsal (Tor, Kuppel erklimmen)
    const [izx, izz] = P.izana, izy = w.heightAt(izx, izz);
    w.enclosure({ x: izx, z: izz, w: 12, d: 12, side: 's', h: 4.4, color: '#e9edf2', label: 'Sternwarte Izaña', y: izy, cap: '#c8ccd2' });
    w.block(izx, izy + 3, izz - 1, 6, 3, 6, '#ffffff');
    w.block(izx, izy + 2, izz + 2.8, 2, 2, 1.2, '#d9dee5');
    w.block(izx, izy + 1, izz + 4, 2, 1, 1.2, '#d9dee5');
    w.sphere(2, '#f4f6f8', izx - 1.2, izy + 3, izz - 2, { half: true });
    w.box(0.6, 2.4, 1.2, '#2b2b2b', izx - 1.2, izy + 4.3, izz - 2.2, 0, 0.5);
    w.star('observatory', izx + 1.6, izy + 3, izz + 0.6, 'Sternwarte Izaña');
    for (const [ddx, ddz, r] of [[-14, -4, 2.2], [-10, 8, 1.8], [12, -6, 2.6], [15, 5, 1.6]]) {
      const x = izx + ddx, z = izz + ddz, y = w.heightAt(x, z);
      w.block(x, y + 2.4, z, r * 2, 2.4, r * 2, '#ffffff');
      w.sphere(r, '#f4f6f8', x, y + 2.4, z, { half: true, seg: 12 });
    }
    sign(w, 'Sternwarte Izaña (2390 m)', [izx, izz + 9], 6, { bg: '#3d5a80' });

    // Mirador de Humboldt: Blick ins Orotava-Tal
    const [hux, huz] = P.humboldt, huy = w.heightAt(hux, huz);
    w.box(6, 0.3, 4, '#c9b48a', hux, huy + 0.15, huz);
    for (let k = -2; k <= 2; k++) w.box(0.15, 1, 0.15, '#6b4423', hux + k * 1.4, huy + 0.6, huz - 2);
    w.box(6, 0.15, 0.15, '#6b4423', hux, huy + 1.1, huz - 2);
    w.box(0.3, 1.3, 0.3, '#2b2b2b', hux + 1.5, huy + 0.8, huz - 1); w.box(0.4, 0.4, 0.9, '#3d5a80', hux + 1.5, huy + 1.6, huz - 1.1);
    sign(w, 'Mirador de Humboldt', P.humboldt, 5, { bg: '#2f6a3a', size: 0.9 });
    // Casa de los Balcones in La Orotava
    const [cbx2, cbz2] = P.casaBalcones;
    const cbTop = lightHouse(w, cbx2, cbz2, 9, 4, 5.6, { wall: '#f6f1e7', roof: 'tile' });
    for (let f = 0; f < 2; f++) w.box(8, 0.8, 0.7, '#6b4423', cbx2, cbTop - 4.2 + f * 2.8, cbz2 + 2.35);
    sign(w, 'Casa de los Balcones', P.casaBalcones, 9, { bg: '#6b4423', size: 0.9 });

    // Castillo de San Miguel in Garachico
    const [csx, csz] = P.castillo, csy = w.heightAt(csx, csz);
    w.enclosure({ x: csx, z: csz, w: 8, d: 8, side: 's', h: 4.4, color: '#7a7470', label: 'Castillo de San Miguel', y: csy, cap: '#5a5552' });
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
      w.box(0.9, 0.9, 0.9, '#7a7470', csx - 3 + k * 2, csy + 5, csz + s * 3.8);
      w.box(0.9, 0.9, 0.9, '#7a7470', csx + s * 3.8, csy + 5, csz - 3 + k * 2);
    }
    w.block(csx - 1.5, csy + 1.2, csz - 1.5, 2.2, 1.2, 2.2, '#8a8480');
    w.block(csx + 1, csy + 2.4, csz - 2, 2.2, 2.4, 2.2, '#8a8480');
    w.star('castle', csx + 1, csy + 2.4, csz - 2, 'Castillo de San Miguel');
    w.box(0.5, 0.5, 2, '#2b2b2b', csx + 2.6, csy + 4.8, csz - 4.4);

    // Kamel-Safari bei El Tanque
    const [kmx, kmz] = P.camel, kmy = w.heightAt(kmx, kmz);
    const kst = w.station(kmx + 4.5, kmz, 'Kamel-Safari', '#c9a46a', kmy);
    const camel = makeAnimal('camel', { pos: new THREE.Vector3() }).g;
    const camelLoop = [];
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; camelLoop.push([kmx - 3 + Math.cos(a) * 6, 0, kmz + Math.sin(a) * 5]); }
    w.addRide(pathRide(w, {
      points: camelLoop, closed: true, duration: 18, vehicle: camel, seat: [0, 2.3, -0.2], ground: true, flat: true, idle: 'wait', name: 'Kamel-Safari', starId: 'camels', station: kst,
      exit: new THREE.Vector3(kmx + 4.5, kmy, kmz + 3),
    }));
    for (let i = 0; i < 3; i++) w.animal('camel', { pos: new THREE.Vector3(kmx - 3 + w.r(-8, 8), 0, kmz + 9 + w.r(-2, 2)), radius: 3, speed: 0.6, hungry: i === 1 });
    sign(w, 'Kamel-Safari', [kmx + 4.5, kmz - 3], 6, { bg: '#c9a46a' });

    // Paisaje Lunar: weiße Tuffsäulen – hüpf nach oben!
    const [lux, luz] = P.lunar;
    const pillars = [[0, 0, 1], [2.4, 0.8, 2], [4.4, -0.6, 3], [5.6, -2.8, 3.9], [4.2, -4.8, 4.8], [1.8, -5.4, 5.6], [-0.4, -4.2, 6.4]];
    pillars.forEach(([ddx, ddz, top], i) => {
      const x = lux + ddx, z = luz + ddz, g = w.heightAt(x, z);
      w.block(x, g + top, z, i === pillars.length - 1 ? 2.4 : 1.9, top + 1, i === pillars.length - 1 ? 2.4 : 1.9, i % 2 ? '#efe6d2' : '#e2d6bc');
    });
    const [lpx2, lpz2] = [lux - 0.4, luz - 4.2];
    w.star('lunar', lpx2, w.heightAt(lpx2, lpz2) + 6.4, lpz2, 'Paisaje Lunar');
    for (let k = 0; k < 14; k++) {
      const a = w.r(0, Math.PI * 2), d = w.r(5, 9), x = lux + Math.cos(a) * d, z = luz - 2 + Math.sin(a) * d;
      const hh = w.r(2, 6);
      w.cone(w.r(0.6, 1.1), hh, '#ece2cc', x, w.heightAt(x, z), z, { seg: 6, shadow: false });
    }
    sign(w, 'Paisaje Lunar', [lux + 4, luz + 3], 5, { bg: '#b39062' });

    // Straßenbahn Santa Cruz – La Laguna
    const tram = new THREE.Group();
    part(tram, 1.9, 2.1, 7, '#ffffff', 0, 1.25, 0);
    part(tram, 1.95, 0.8, 6.4, '#3d5a80', 0, 1.7, 0);
    part(tram, 1.96, 0.25, 7.02, '#2fa84f', 0, 0.35, 0);
    part(tram, 0.1, 0.9, 0.1, '#2b2b2b', 0, 2.75, 0);
    const tst = w.station(P.tram[0] + 3.5, P.tram[1] + 1, 'Straßenbahn', '#2fa84f', w.heightAt(P.tram[0] + 3.5, P.tram[1] + 1));
    const tramPts = [];
    for (let i = 1; i < TRAM.length; i++) {
      const [a1, b1] = TRAM[i - 1], [a2, b2] = TRAM[i], n = Math.ceil(Math.hypot(a2 - a1, b2 - b1) / 6);
      for (let k = 0; k < n; k++) tramPts.push([a1 + (a2 - a1) * k / n, 0.1, b1 + (b2 - b1) * k / n]);
    }
    tramPts.push([TRAM[TRAM.length - 1][0], 0.1, TRAM[TRAM.length - 1][1]]);
    w.addRide(pathRide(w, {
      points: tramPts, closed: false, duration: 16, vehicle: tram, seat: [0, 0.4, 1.5], ground: true, flat: true, idle: 'wait', name: 'Straßenbahn nach La Laguna', starId: 'tram', station: tst,
      exit: new THREE.Vector3(TRAM[TRAM.length - 1][0] + 2.5, 0, TRAM[TRAM.length - 1][1]),
    }));
    for (const [x, , z] of tramPts) { const h = w.heightAt(x, z); if (h > 0) w.box(2.2, 0.06, 2.2, '#8d939b', x, h + 0.05, z); }

    // Santa Cruz: Plaza de España mit Wasserbecken und Denkmal
    const [plx, plz] = [P.santaCruz[0] + 5, P.santaCruz[1] + 6], ply = w.heightAt(plx, plz);
    w.water(plx, plz, 6, 6, { top: ply + 0.1, color: '#4fc0f0' });
    w.box(1, 6, 1, '#efe3cf', plx, ply + 3, plz);
    w.box(2.6, 0.6, 0.6, '#efe3cf', plx, ply + 4.6, plz);

    // Punta del Hidalgo: moderner Leuchtturm, Roques de Anaga vor Benijo
    const [hix, hiz] = P.hidalgo, hiy = w.heightAt(hix, hiz);
    w.block(hix, hiy + 11, hiz, 2.2, 11, 2.2, '#f4f6f8');
    w.box(2.8, 1.4, 2.8, '#fff4a0', hix, hiy + 11.8, hiz);
    w.box(3, 0.4, 3, '#e8262b', hix, hiy + 12.7, hiz);
    sign(w, 'Faro de Punta del Hidalgo', [hix, hiz + 4], 4, { size: 0.8 });
    const [bnx, bnz] = P.benijo;
    for (const [ddx, ddz, hh, r] of [[2, -9, 8, 2.6], [8, -11, 6, 2], [-4, -10, 5, 1.8]]) w.cone(r, hh + 3, '#4a4442', bnx + ddx, -3, bnz + ddz, { seg: 6 });
    sign(w, 'Playa de Benijo', P.benijo, 5, { size: 0.9 });
    const [ccx, ccz] = P.cruzCarmen, ccy = w.heightAt(ccx, ccz);
    w.box(0.4, 4, 0.4, '#ffffff', ccx + 2, ccy + 2, ccz); w.box(2, 0.4, 0.4, '#ffffff', ccx + 2, ccy + 3, ccz);
    sign(w, 'Cruz del Carmen', [ccx, ccz + 2], 6, { bg: '#2f6a3a', size: 0.9 });
    // Charco de la Laja: Naturbecken an der Nordküste
    const [rbx, rbz] = [P.rambla[0], P.rambla[1] - 4];
    w.water(rbx, rbz, 5, 3, { top: 0.25, color: '#38c8f0' });
    for (let k = 0; k < 8; k++) w.box(w.r(1, 2), w.r(0.8, 1.6), w.r(1, 2), '#3d3a38', rbx + w.r(-3.5, 3.5), 0.3, rbz + (k % 2 ? 2 : -2), w.r(0, 3));

    // Fähre Los Cristianos – La Gomera, Nachbarinsel am Horizont
    const gx2 = (-17.24 - LON0) * KX, gz2 = -(28.10 - LAT0) * KZ;
    w.cone(95, 14, '#5f7a52', gx2, -6, gz2, { seg: 14, shadow: false });
    w.sign('La Gomera', gx2 + 60, 14, gz2 - 40, { bg: '#2f6a3a', fg: '#ffffff', size: 2 });
    const ferry = new THREE.Group();
    part(ferry, 4, 2, 12, '#ffffff', 0, 0.4, 0);
    part(ferry, 3.6, 1.6, 7, '#ffffff', 0, 2.2, -1);
    part(ferry, 4.05, 0.5, 12.05, '#1f8fc9', 0, 0.2, 0);
    part(ferry, 1, 1.6, 1, '#e8262b', 0, 3.6, -2);
    w.add(ferry);
    const fA = new THREE.Vector3(P.cristianos[0] - 6, -0.6, P.cristianos[1] + 12), fB = new THREE.Vector3(gx2 + 80, -0.6, gz2 - 30);
    w.updaters.push((dt, t) => {
      const c = (t / 70) % 2, k = c < 1 ? c : 2 - c;
      ferry.position.lerpVectors(fA, fB, k);
      ferry.rotation.y = Math.atan2(fB.x - fA.x, fB.z - fA.z) + (c < 1 ? 0 : Math.PI);
    });


    // ---------- Strände ----------
    // Sandstreifen entlang der Küste (golden oder schwarzer Vulkansand), Schirme, Liegen, Möwen und Krabben
    for (const b of BEACHES) {
      const sand = b.gold ? '#f2c94c' : '#3d3a38', ry = Math.atan2(b.ux, b.uz);
      const at = (t, n) => [b.x + b.ux * t + b.nx * n, b.z + b.uz * t + b.nz * n];
      for (let t = -b.len / 2; t <= b.len / 2; t += 3) {
        for (const [n, y] of [[-1.5, null], [1.5, 0.3], [4.5, 0.05]]) {
          const [x, z] = at(t, n), h = w.heightAt(x, z);
          if (y === null && h > 3) continue;
          w.box(3, 0.3, 3, sand, x, (y ?? Math.max(0.5, h) + 0.1) - 0.15, z, ry);
        }
        const k = Math.round(t / 3);
        if (!b.wild && k % 2 === 0) {
          const [x, z] = at(t, -0.5), h = Math.max(0.6, w.heightAt(x, z));
          w.box(0.1, 2, 0.1, '#ffffff', x, h + 1, z);
          w.cone(1.1, 0.6, ['#ff595e', '#2f7df6', '#ffd23f', '#2fbf4a'][(k / 2 + 8) % 4 | 0], x, h + 1.9, z, { seg: 8, shadow: false });
          const [lx2, lz2] = at(t + 1, -0.5);
          w.box(0.8, 0.25, 1.8, '#ffffff', lx2, h + 0.3, lz2, ry + Math.PI / 2);
        }
      }
      const [sx, sz] = at(0, -4);
      sign(w, b.name, [sx, sz], 4, { bg: b.gold ? '#e8b04a' : '#3d3a38', fg: b.gold ? '#17233b' : '#ffffff', size: 0.9 });
      if (b.tower) {
        const [tx2, tz2] = at(b.len * 0.3, -1), th = Math.max(0.6, w.heightAt(tx2, tz2));
        for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) w.box(0.15, 2.4, 0.15, '#ffffff', tx2 + dx, th + 1.2, tz2 + dz);
        w.box(1.8, 1.2, 1.8, '#e8262b', tx2, th + 3, tz2); w.box(2, 0.2, 2, '#ffd23f', tx2, th + 3.7, tz2);
      }
      if (b.volley) {
        const [vx, vz] = at(-b.len * 0.3, -1), vh = Math.max(0.6, w.heightAt(vx, vz));
        for (const s2 of [-1, 1]) w.box(0.12, 2.4, 0.12, '#ffffff', vx + b.ux * s2 * 3, vh + 1.2, vz + b.uz * s2 * 3);
        w.box(0.05, 0.8, 6, '#f2f2f2', vx, vh + 2, vz, ry);
      }
      if (b.surf) for (let i = 0; i < 3; i++) { const [x, z] = at(-3 + i * 3, 9 + i * 2); w.box(0.6, 0.1, 2.2, ['#ff595e', '#4cc9f0', '#ffd23f'][i], x, 0.05, z, ry + 0.4); w.box(0.06, 2.4, 0.06, '#ffffff', x, 1.25, z); w.box(0.05, 1.8, 1.2, ['#ff595e', '#4cc9f0', '#ffd23f'][i], x, 1.5, z + 0.6, ry + 0.4); }
      if (b.garden) for (let i = 0; i < 6; i++) { const [x, z] = at(-b.len / 2 + i * b.len / 5, -6); palm(w, x, z); }
      // Tiere am Strand
      const [gx3, gz3] = at(0, 0);
      w.animal('bird', { pos: new THREE.Vector3(gx3, 0, gz3), behavior: 'walk', radius: 3, speed: 0.9, colors: ['#ffffff', '#e6e8ea', '#9aa1ab'], scale: 0.7 });
      w.animal('bird', { pos: new THREE.Vector3(gx3, 0, gz3), y: 7 + (b.len % 3), behavior: 'fly', radius: 8, speed: 4, colors: ['#ffffff', '#e6e8ea', '#9aa1ab'], scale: 0.7 });
      if (!b.gold) { const [cx2, cz2] = at(b.len * 0.4, -0.5); w.animal('crab', { pos: new THREE.Vector3(cx2, 0, cz2), radius: 1.5, speed: 0.5, hungry: b.name === 'Playa Jardín' }); }
      if (b.turtles) for (let i = 0; i < 4; i++) { const [x, z] = at(-4 + i * 3, 8 + (i % 2) * 3); w.animal('turtle', { pos: new THREE.Vector3(x, -0.9, z), y: -0.9, behavior: 'swim', radius: 4, speed: 0.5, hungry: i === 1 }); }
    }
    sign(w, 'El Puertito: hier schwimmen Meeresschildkröten!', (() => { const b = BEACHES.find((q) => q.turtles); return [b.x - b.nx * 6, b.z - b.nz * 6]; })(), 5.5, { bg: '#2fa84f', size: 0.8 });
    w.animal('dog', { pos: new THREE.Vector3(BEACHES[3].x, 0, BEACHES[3].z), radius: 5, speed: 2.2, hungry: true });

    // ---------- Noch mehr Tiere ----------
    const A = (kind, [x, z], o = {}) => w.animal(kind, { pos: new THREE.Vector3(x, 0, z), ...o });
    const near = ([x, z], r) => [x + w.r(-r, r), z + w.r(-r, r)];
    // Papageienpark: Seelöwen, Flamingos
    const [lpx3, lpz3] = P.loro, lpy3 = w.heightAt(lpx3, lpz3);
    w.water(lpx3 - 4, lpz3 + 4, 4, 3, { top: lpy3 + 0.1, color: '#4fc0f0' });
    for (let i = 0; i < 2; i++) A('seal', [lpx3 - 4 + i, lpz3 + 4], { y: lpy3 + 0.05, radius: 1.2, speed: 0.6, hungry: i === 0 });
    for (let i = 0; i < 4; i++) A('flamingo', [lpx3 + 4 + i * 0.8, lpz3 - 3], { radius: 1.5, speed: 0.5 });
    // Delfine und Grindwale vor der Südwestküste
    for (const [lo, la] of [[-16.75, 28.06], [-16.80, 28.10], [-16.70, 28.02], [-16.86, 28.17]]) {
      const [x, z] = geo(lo, la);
      A('dolphin', [x, z], { y: -0.8, behavior: 'jump', radius: 7 });
      A('dolphin', [x + 4, z + 3], { y: -0.8, behavior: 'jump', radius: 6 });
    }
    for (const [lo, la] of [[-16.82, 28.12], [-16.88, 28.20]]) A('whale', geo(lo, la), { y: -1.6, behavior: 'jump', radius: 10 });
    // Las Cañadas: Wildkaninchen, Eidechsen, Turmfalken
    for (let i = 0; i < 4; i++) A('rabbit', near(P.caldera, 25), { behavior: 'hop', radius: 6, speed: 2, color: '#a08a6a', hungry: i === 0 });
    for (let i = 0; i < 4; i++) A('lizard', near(P.caldera, 25), { radius: 3, speed: 1.2 });
    for (let i = 0; i < 2; i++) { const [x, z] = near(P.caldera, 20); A('bird', [x, z], { y: 30 + i * 3, behavior: 'fly', radius: 14, speed: 4, colors: ['#a0612a', '#d9a441', '#5a3a1a'], scale: 0.8 }); }
    // Teidefinken (blau) im Kiefernwald bei Vilaflor
    for (let i = 0; i < 3; i++) { const [x, z] = near(P.vilaflor, 10); A('bird', [x, z], { y: w.heightAt(x, z) + 3 + i, behavior: 'flutter', radius: 5, colors: ['#5b8fd6', '#3d5a80', '#9fc4f0'], scale: 0.55 }); }
    // Teno und Anaga: Ziegenherden, Bauernhof mit Hühnern, Schmetterlinge im Lorbeerwald
    for (let i = 0; i < 5; i++) A('goat', near(P.buenavista, 10), { radius: 5, speed: 0.8, hungry: i === 2 });
    for (let i = 0; i < 4; i++) A('goat', near(P.taganana, 8), { radius: 5, speed: 0.8 });
    for (let i = 0; i < 4; i++) A('chicken', near([P.buenavista[0] + 6, P.buenavista[1] - 6], 3), { radius: 3, speed: 1, hungry: i === 0 });
    for (let i = 0; i < 6; i++) { const [x, z] = near(P.cruzCarmen, 8); A('butterfly', [x, z], { y: w.heightAt(x, z) + 1.4, behavior: 'flutter', radius: 4, color: w.pick(['#ffd23f', '#ff8a1f', '#5fb0ff']) }); }
    for (let i = 0; i < 5; i++) { const [x, z] = near(P.orotava, 8); A('butterfly', [x, z], { y: w.heightAt(x, z) + 1.4, behavior: 'flutter', radius: 4, color: w.pick(['#ff5fb0', '#ffd23f', '#b07bff']) }); }
    for (let i = 0; i < 4; i++) { const [x, z] = near(P.vilaflor, 8); A('bee', [x, z], { y: w.heightAt(x, z) + 1, behavior: 'flutter', radius: 3 }); }
    // Katzen und Hunde in den Orten, Kanarienvögel, Fische im Naturbecken
    for (const [k, c] of [['garachico', '#f08a1f'], ['icod', '#ffffff'], ['orotava', '#3a3a3a'], ['candelaria', '#d9cbb0'], ['adeje', '#f08a1f'], ['tacoronte', '#3a3a3a']]) A('cat', near(P[k], 4), { radius: 3, speed: 0.9, color: c });
    for (const k of ['icod', 'sanIsidro', 'guia']) A('dog', near(P[k], 4), { radius: 4, speed: 2 });
    for (const k of ['garachico', 'realejos', 'tegueste']) { const [x, z] = near(P[k], 4); A('bird', [x, z], { y: w.heightAt(x, z) + 4, behavior: 'flutter', radius: 4, colors: ['#ffe14d', '#f2c200', '#ffd23f'], scale: 0.55 }); }
    for (let i = 0; i < 4; i++) A('fish', [P.rambla[0] + w.r(-2, 2), P.rambla[1] - 4 + w.r(-1, 1)], { y: 0.05, behavior: 'swim', radius: 1.5, speed: 0.6, color: w.pick(['#ffd23f', '#4cc9f0', '#ff595e']) });

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

    // Jedes Tier zu wenigen Meshes zusammenfassen (Beine/Flügel bleiben beweglich) – spart viele Draw-Calls
    for (const a of w.animals) compact(a.g);
    compact(camel);
  },
};
