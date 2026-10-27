// Mars: rote Planetenoberfläche mit Kratern, Canyon und Vulkan, Marsbasis mit Glaskuppeln, Rakete und Rover.
// Geringere Schwerkraft: höhere, langsamere Sprünge.
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';
import { pathRide, part, seatAt } from '../rides.js';
import { plainMat } from '../blocks.js';

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

const G = 3; // mittlere Bodenhöhe (Canyon und Krater liegen tiefer)
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
function noise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(i, j) + (hash(i + 1, j) - hash(i, j)) * u, b = hash(i, j + 1) + (hash(i + 1, j + 1) - hash(i, j + 1)) * u;
  return a + (b - a) * v;
}
const smooth = (t) => t * t * (3 - 2 * t);

// Ebene Bauflächen [x1, z1, x2, z2]
const FLATS = [[-40, -14, 18, 10], [-9, 6, 9, 58], [26, -42, 42, -26], [18, -14, 46, 12], [10, 16, 28, 30]];
const CRATER = { x: -34, z: -34 };                         // Krater-Parkour
const CANYON = [[-48, 4], [-46, 24], [-30, 40], [-12, 46]];
const SMALL = [[20, 40, 4.5], [-20, 22, 3.5], [10, -46, 5], [-52, -8, 3.5], [48, 22, 4], [-4, -36, 4], [36, 50, 3.5]];
const HILLS = [[46, 40, 11, 6], [-10, -52, 10, 5], [52, -10, 7, 4]];
const BASE = { x: 0, z: -8, w: 30, d: 24 };               // Marsbasis (umzäunt)
const PAD = { x: 34, z: -34 };                            // Startrampe

export const mars = {
  id: 'mars',
  name: 'Mars',
  seed: 106,
  gravity: 16,
  jump: 11,
  killY: -5,
  theme: {
    sky: ['#140a1e', '#5a2a2a', '#e89a5a'], fog: '#d08458', sea: '#9a4a2a', seaY: -0.8, fogNear: 90, fogFar: 240,
    light: { hemi: 1.25, sun: 2.1, sunColor: '#ffd8b0', sky: '#ffc9a0', ground: '#7a3a22' },
  },
  stars: { rocket: 'Raketenstart', rover: 'Rover-Tour', crater: 'Krater-Parkour', antenna: 'Funkturm' },
  build(w) {
    // ---------- Gelände ----------
    const canyonInfo = (x, z) => {
      let best = Infinity, sBest = 0, acc = 0;
      for (let k = 0; k < CANYON.length - 1; k++) {
        const [x1, z1] = CANYON[k], [x2, z2] = CANYON[k + 1], dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz);
        const t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / (L * L)));
        const d = Math.hypot(x - x1 - dx * t, z - z1 - dz * t);
        if (d < best) { best = d; sBest = acc + t * L; }
        acc += L;
      }
      return [best, sBest, acc];
    };
    const height = (x, z) => {
      const ad = Math.max(Math.abs(x), Math.abs(z));
      if (ad > 56) return 9.5 + Math.floor(hash(Math.floor((x + 200) / 8), Math.floor((z + 200) / 8)) * 4) * 1.5 + (ad > 61 ? 3 : 0);
      let h = G + (noise(x * 0.07, z * 0.07) - 0.5) * 2.6;
      let ft = 1;
      for (const [a, b, c, d] of FLATS) ft = Math.min(ft, Math.hypot(Math.max(a - x, 0, x - c), Math.max(b - z, 0, z - d)) / 6);
      h = G + (h - G) * ft;
      for (const [hx, hz, R, H] of HILLS) { const r = Math.hypot(x - hx, z - hz); if (r < R) h = Math.max(h, G + H * (1 - (r / R) ** 2)); }
      for (const [cx, cz, R] of SMALL) {
        const r = Math.hypot(x - cx, z - cz);
        if (r < R + 1.5) h += (r < R ? -1.6 * (1 - (r / R) ** 2) : 0) + 1.1 * Math.max(0, 1 - Math.abs(r - R) / 1.5);
      }
      // großer Krater mit Rampe nach Südosten
      const r = Math.hypot(x - CRATER.x, z - CRATER.z);
      if (r < 19) {
        h = r < 13 ? 1 : Math.max(h, G + 4 * Math.max(0, 1 - Math.abs(r - 15) / 4));
        const ux = Math.SQRT1_2, uz = Math.SQRT1_2, px = x - CRATER.x, pz = z - CRATER.z;
        const along = px * ux + pz * uz, perp = Math.abs(px * uz - pz * ux);
        if (along > 4 && perp < 2.6) h = Math.min(h, 1 + (along - 4) * 0.45);
      }
      // Canyon
      const [d, s, L] = canyonInfo(x, z);
      if (d < 9) {
        const floor = 0.5 + Math.max(0, 7 - s, s - (L - 7)) * 0.4;
        h = Math.min(h, floor + Math.max(0, d - 3) * 0.95);
      }
      return Math.max(h, 0.5);
    };
    w.terrain({
      x0: -66, z0: -66, cols: 66, rows: 66, cell: 2, step: 0.5, height,
      color: (x, z, h) => {
        const n = hash(Math.floor(x / 2), Math.floor(z / 2));
        if (h > 9) return n > 0.5 ? '#8e3a22' : '#7f3420';
        if (h < 1.6) return n > 0.5 ? '#8a3a20' : '#7e341d';
        if (h > G + 2.4) return n > 0.5 ? '#a8492a' : '#9c4226';
        return n < 0.18 ? '#a94e2a' : n > 0.85 ? '#c26a40' : '#b85a31';
      },
    });
    exitPortal(w, 53, 'hub');

    // ---------- Helfer ----------
    const solid = (x, z, hx, hz, h, y0 = G) => w.solids.push({ min: new THREE.Vector3(x - hx, y0, z - hz), max: new THREE.Vector3(x + hx, y0 + h, z + hz) });
    const H = (x, z) => w.heightAt(x, z);
    const noFog = (mesh) => { mesh.material.fog = false; mesh.material.needsUpdate = true; return mesh; };
    const rock = (x, z, s = 1) => {
      const y = H(x, z);
      w.box(1.6 * s, 1 * s, 1.3 * s, '#8a3e24', x, y + 0.4 * s, z, w.r(0, 3));
      w.box(1 * s, 0.6 * s, 0.9 * s, '#a04a2c', x + 0.3 * s, y + 1 * s, z - 0.1 * s, w.r(0, 3));
    };

    // ---------- Himmel: Vulkan, zwei Monde, Sterne ----------
    noFog(w.cyl(20, 120, 66, '#b06a4e', -110, -12, -240, { seg: 28, shadow: false }));
    noFog(w.cyl(12, 20, 2, '#7a3a2a', -110, 53.5, -240, { seg: 20, shadow: false }));
    noFog(w.cyl(30, 60, 14, '#a85c40', 120, -6, -215, { seg: 24, shadow: false }));
    noFog(w.sphere(7, '#b3a08e', 60, 62, -200, { seg: 10, scale: [1.35, 1, 1], emissive: '#3a2e26', shadow: false }));
    noFog(w.sphere(3.5, '#cbbcaa', -40, 80, -210, { seg: 10, emissive: '#3a2e26', shadow: false }));
    {
      const pts = [];
      for (let i = 0; i < 260; i++) {
        const a = w.r(0, Math.PI * 2), e = w.r(0.3, 1.45), R = 380;
        pts.push(Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R, Math.sin(a) * Math.cos(e) * R);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffffff', size: 2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.8 }));
      p.frustumCulled = false;
      w.add(p);
    }

    // ---------- Weg vom Portal zur Basis ----------
    w.box(5, 0.06, 50, '#d9895a', 0, G + 0.04, 30);
    for (let z = 52; z > 8; z -= 3) { w.box(0.3, 0.12, 0.3, '#ffd23f', -2.7, G + 0.08, z, 0, 0, 0); w.box(0.3, 0.12, 0.3, '#ffd23f', 2.7, G + 0.08, z); }
    w.sign('Willkommen auf dem Mars!', 0, G + 4.6, 28, { bg: '#d2532c', size: 0.9 });
    w.box(0.3, 4.2, 0.3, '#d8dde3', -3.6, G + 2.1, 28); w.box(0.3, 4.2, 0.3, '#d8dde3', 3.6, G + 2.1, 28);
    solid(-3.6, 28, 0.15, 0.15, 4.2); solid(3.6, 28, 0.15, 0.15, 4.2);

    // ---------- Stern: Funkturm in der Marsbasis ----------
    const white = '#e6eaef', grey = '#9aa3ae';
    w.enclosure({ x: BASE.x, z: BASE.z, w: BASE.w, d: BASE.d, side: 's', h: 4.4, color: white, label: 'Marsbasis', y: G, cap: '#ff8a1f' });
    w.box(BASE.w, 0.06, BASE.d, '#a9b2bd', BASE.x, G + 0.04, BASE.z);
    for (let i = -6; i <= 6; i++) w.box(0.9, 0.07, BASE.d, i % 2 ? '#b8c0ca' : '#a9b2bd', i * 2.1, G + 0.05, BASE.z);
    const peak = w.spiralTower({ x: 0, z: -11, y: G, r: 6, n: 11, rise: 2, size: 2.6, a0: Math.PI / 2, da: 0.8, colors: ['#ff8a1f', '#e6eaef'], column: '#7d8590', colW: 1.6, top: '#cfd5dc', topSize: 5, starId: 'antenna', label: 'Funkturm' });
    for (let y = G + 2; y < peak; y += 3) { w.box(2.2, 0.15, 0.15, grey, 0, y, -11, 0.6); w.box(2.2, 0.15, 0.15, grey, 0, y + 1.5, -11, -0.6); }
    w.box(0.25, 6, 0.25, grey, 1.6, peak + 3, -12.6);
    const dish = w.cyl(2.4, 0.6, 0.8, '#f2f4f7', -1.2, peak + 2.2, -12.4, { seg: 16, rx: 0.7 });
    dish.castShadow = false;
    const beacon = w.shape(new THREE.BoxGeometry(0.5, 0.5, 0.5), '#ff2020', 1.6, peak + 6.2, -12.6, { emissive: '#ff0000' });
    w.updaters.push((dt, t) => { beacon.visible = Math.sin(t * 4) > 0; dish.rotation.y = t * 0.3; });
    w.sign('Funkturm', 0, peak + 8, -11, { bg: '#2f5fd6', size: 0.9 });
    // kleine Kuppeln und Labor in der Basis
    for (const sx of [-1, 1]) {
      w.cyl(3.4, 3.4, 0.5, white, sx * 10.5, G, -15.5, { seg: 20 });
      w.sphere(3.2, '#bfe8ff', sx * 10.5, G + 0.5, -15.5, { half: true, opacity: 0.35, seg: 20, shadow: false });
      for (let i = 0; i < 3; i++) w.box(0.8, 0.9, 0.8, '#3fae49', sx * 10.5 + (i - 1) * 1.3, G + 0.95, -15.5);
    }
    w.block(10.5, G + 3, -1, 5, 3, 3.5, white, { plain: true });
    w.box(4.2, 0.6, 0.06, '#5fb0ff', 10.5, G + 2, 0.78);
    w.box(5.2, 0.3, 3.7, '#ff8a1f', 10.5, G + 3.15, -1);
    for (let i = 0; i < 3; i++) w.box(1, 1, 1, '#c8ced6', -11 + i * 1.2, G + 0.5, -1.5);
    w.box(1, 1, 1, '#ff8a1f', -10.4, G + 1.5, -1.5);
    solid(-9.8, -1.5, 1.8, 0.5, 1);
    w.box(0.12, 4, 0.12, '#d8dde3', -12, G + 2, 1.5); w.box(1.6, 1, 0.06, '#2f7df6', -11.2, G + 3.4, 1.5); w.box(0.6, 0.4, 0.07, '#ffffff', -11.5, G + 3.6, 1.5);

    // ---------- Wohnkuppeln mit Gewächshaus ----------
    const dome = (x, z, r, plants) => {
      w.cyl(r + 0.2, r + 0.2, 0.4, white, x, G, z, { seg: 24 });
      w.sphere(r, '#bfe8ff', x, G + 0.4, z, { half: true, opacity: 0.3, seg: 24, shadow: false });
      if (plants) {
        for (let i = -2; i <= 2; i++) {
          w.box(1, 0.6, r * 1.1, '#7a4a2a', x + i * 1.6, G + 0.7, z);
          for (let k = -2; k <= 2; k++) w.box(0.6, w.r(0.6, 1.2), 0.6, w.pick(['#3fae49', '#5fc45f', '#2f9a3c']), x + i * 1.6, G + 1.3, z + k * r * 0.2);
        }
        for (let k = 0; k < 6; k++) w.box(0.35, 0.35, 0.35, w.pick(['#ff595e', '#ffd23f', '#ff8a1f']), x + w.r(-3, 3), G + 1.9, z + w.r(-2, 2));
      } else {
        w.box(2, 0.8, 1, '#5b6470', x - 1.5, G + 0.8, z - r * 0.5);
        w.box(1.4, 0.6, 2.4, '#2f7df6', x + 1.6, G + 0.7, z + 0.4);
        w.box(1.2, 1.2, 0.2, '#1f2b3a', x - 1.5, G + 1.8, z - r * 0.5);
      }
    };
    dome(-28, -3, 7.5, true);
    dome(-24, 15, 5.5, false);
    w.sign('Gewächshaus', -28, G + 9.5, -3, { bg: '#2f9a4a', size: 0.9 });
    w.sign('Wohnkuppel', -24, G + 7.2, 15, { bg: '#2f7df6', size: 0.8 });
    // Verbindungsröhren
    const tube = (x1, z1, x2, z2) => {
      const len = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(x2 - x1, z2 - z1);
      w.box(2.2, 2.2, len, white, (x1 + x2) / 2, G + 1.2, (z1 + z2) / 2, ry);
      w.box(2.25, 0.4, len - 0.4, '#5fb0ff', (x1 + x2) / 2, G + 1.6, (z1 + z2) / 2, ry);
    };
    tube(-25.5, 4.2, -24.8, 9.6);
    tube(-20.5, -3, -15.5, -3);
    // Solarpaneele
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const x = 23 + c * 5.5, z = -9 + r * 5.5;
      w.box(0.25, 1.4, 0.25, grey, x, G + 0.7, z);
      w.box(4.2, 0.15, 2.8, '#1f3a7a', x, G + 1.55, z, 0, -0.45);
      w.box(4.25, 0.05, 0.06, '#9ab8e8', x, G + 1.62, z, 0, -0.45);
      w.box(0.06, 0.05, 2.85, '#9ab8e8', x, G + 1.62, z, 0, -0.45);
      solid(x, z, 0.2, 0.2, 1.4);
    }
    w.sign('Solarpark', 31, G + 4, 13, { bg: '#1f3a7a', size: 0.8 });
    // Kabel von den Paneelen zur Basis
    w.box(9, 0.12, 0.2, '#3b3f48', 18, G + 0.06, -1);

    // ---------- Stern: Raketenstart ----------
    w.block(PAD.x, G + 0.5, PAD.z, 9, 1, 9, '#8d939b');
    for (const [dx, dz] of [[-4.2, 0], [4.2, 0], [0, -4.2], [0, 4.2]]) w.box(dx ? 0.3 : 8.6, 0.05, dz ? 0.3 : 8.6, '#ffd23f', PAD.x + dx, G + 1.03, PAD.z + dz);
    w.box(1.2, 0.05, 1.2, '#ffd23f', PAD.x, G + 1.03, PAD.z, Math.PI / 4);
    // Startturm
    const TX = PAD.x + 4.2;
    for (const [dx, dz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) w.box(0.3, 20, 0.3, '#c0392b', TX + dx, G + 11, PAD.z + dz);
    for (let y = 2; y < 20; y += 2.5) { w.box(1.9, 0.2, 0.2, '#c0392b', TX, G + 1 + y, PAD.z - 0.8, 0, 0, 0.6); w.box(1.9, 0.2, 0.2, '#c0392b', TX, G + 1 + y, PAD.z + 0.8, 0, 0, -0.6); }
    w.box(2.2, 0.3, 0.3, '#7d8590', TX - 1.4, G + 14, PAD.z);
    solid(TX, PAD.z, 1, 1, 20, G + 1);
    const rocket = new THREE.Group();
    const add = (geo, color, x, y, z, rx = 0) => { const m = new THREE.Mesh(geo, plainMat(color)); m.position.set(x, y, z); m.rotation.x = rx; m.castShadow = true; rocket.add(m); return m; };
    add(new THREE.CylinderGeometry(1.5, 1.5, 10, 16), '#f2f4f7', 0, 6.5, 0);
    for (const y of [3.4, 9.6]) add(new THREE.CylinderGeometry(1.55, 1.55, 0.6, 16), '#d2322b', 0, y, 0);
    add(new THREE.CylinderGeometry(0.9, 1.3, 1.5, 12), '#5b6470', 0, 0.75, 0);
    add(new THREE.CylinderGeometry(1.9, 1.5, 0.9, 16), '#f2f4f7', 0, 11.95, 0);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const f = part(rocket, 0.25, 3, 2.2, '#d2322b', Math.sin(a) * 1.9, 2.2, Math.cos(a) * 1.9); f.rotation.y = a; }
    part(rocket, 0.8, 0.8, 0.1, '#5fb0ff', 0, 7.5, 1.52);
    part(rocket, 1.2, 0.5, 0.1, '#2f5fd6', 0, 5.2, 1.52);
    bake(rocket);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(1.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.35 }));
    glass.position.y = 12.4;
    rocket.add(glass);
    const flameMat = new THREE.MeshBasicMaterial({ color: '#ff8a1f' }), flameMat2 = new THREE.MeshBasicMaterial({ color: '#fff3a0' });
    const flame = new THREE.Group();
    const f1 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 4, 10), flameMat); f1.rotation.x = Math.PI; f1.position.y = -2; flame.add(f1);
    const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.4, 8), flameMat2); f2.rotation.x = Math.PI; f2.position.y = -1.2; flame.add(f2);
    flame.visible = false;
    rocket.add(flame);
    const rseat = seatAt(rocket, 0, 12.0, 0);
    rocket.position.set(PAD.x, G + 1, PAD.z);
    w.add(rocket);
    // Rauchwolken beim Start
    const smokeMat = new THREE.MeshLambertMaterial({ color: '#e8d8c8', transparent: true, opacity: 0.7 });
    const smoke = [];
    for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), smokeMat); m.visible = false; w.add(m); smoke.push(m); }
    const RH = 70, duration = 17;
    const yAt = (t) => {
      if (t < 2.5) return 0;
      if (t < 9) return RH * ((t - 2.5) / 6.5) ** 2;
      if (t < 10.5) return RH;
      if (t < 16) return RH * (1 - smooth((t - 10.5) / 5.5));
      return 0;
    };
    const rocketStation = w.station(PAD.x - 7.5, PAD.z + 6.5, 'Raketenstart', '#d2322b', G);
    w.addRide({
      name: 'Raketenstart', starId: 'rocket', station: rocketStation, exit: new THREE.Vector3(PAD.x - 11, G, PAD.z + 8.5), duration, seat: rseat,
      camera(pos, fwd, out) { out.pos.set(PAD.x - 15, pos.y + 1.5, PAD.z + 16); out.look.set(pos.x, pos.y - 1, pos.z); },
      update(dt, t, riding, rt) {
        const tt = riding ? rt : 0;
        const y = yAt(tt);
        rocket.position.y = G + 1 + y;
        const firing = riding && ((tt > 1.5 && tt < 9.5) || (tt > 12 && tt < 15.8));
        flame.visible = firing;
        if (firing) flame.scale.set(1, 0.8 + Math.random() * 0.5 + (tt < 9.5 ? 0.4 : 0), 1);
        rocket.position.x = PAD.x + (riding && tt > 1.5 && tt < 3 ? (Math.random() - 0.5) * 0.15 : 0);
        smoke.forEach((m, i) => {
          const k = riding ? (tt - 2 - i * 0.12) : -1;
          m.visible = k > 0 && k < 4;
          if (!m.visible) return;
          const a = i * 0.785, r = 2 + k * 2.2;
          m.position.set(PAD.x + Math.cos(a) * r, G + 1.6 + k * 0.4, PAD.z + Math.sin(a) * r);
          m.scale.setScalar(1.5 + k * 1.2);
        });
      },
    });
    w.sign('Startrampe', PAD.x - 4, G + 4.5, PAD.z + 5.6, { bg: '#d2322b', size: 0.8 });

    // ---------- Stern: Rover-Tour ----------
    const rover = new THREE.Group();
    part(rover, 2.4, 0.5, 3.6, '#f2f4f7', 0, 1.0, 0);
    part(rover, 2.0, 0.6, 2.4, '#d8dde3', 0, 1.5, -0.3);
    part(rover, 2.8, 0.1, 2.6, '#1f3a7a', 0, 1.86, -0.4);
    for (const x of [-1.35, 1.35]) for (const z of [-1.3, 0, 1.3]) { part(rover, 0.5, 0.9, 0.9, '#3b3f48', x, 0.45, z); part(rover, 0.52, 0.4, 0.4, '#9aa3ae', x, 0.45, z); }
    part(rover, 0.15, 1.4, 0.15, '#9aa3ae', 0.8, 2.5, 1.3);
    part(rover, 0.6, 0.35, 0.4, '#f2f4f7', 0.8, 3.3, 1.3);
    part(rover, 0.25, 0.25, 0.1, '#2b2f36', 0.8, 3.3, 1.52);
    part(rover, 0.1, 1.2, 0.1, '#9aa3ae', -0.9, 2.4, -1.4);
    part(rover, 0.7, 0.08, 0.7, '#f2f4f7', -0.9, 3.0, -1.4);
    part(rover, 2.0, 0.2, 0.3, '#ff8a1f', 0, 1.1, 1.85);
    bake(rover);
    w.addRide(pathRide(w, {
      points: [[18, 0, 24], [30, 0, 26], [40, 0, 30], [47, 0, 40], [42, 0, 50], [24, 0, 47], [8, 0, 46], [-6, 0, 47], [-14, 0, 46], [-30, 0, 40],
        [-46, 0, 24], [-48, 0, 6], [-46, 0, -10], [-38, 0, -15], [-28, 0, -15.5], [-18, 0, -23], [0, 0, -26], [16, 0, -24], [22, 0, -15], [18, 0, -5], [17, 0, 8], [16, 0, 18]],
      closed: true, ground: true, duration: 40, vehicle: rover, seat: [0, 1.9, -0.6], flat: false,
      name: 'Rover-Tour', starId: 'rover', station: w.station(14, 22.5, 'Rover-Tour', '#ff8a1f', G), exit: new THREE.Vector3(10.5, G, 22.5),
    }));
    // Rover-Garage
    w.block(22.5, G + 4, 27.5, 9, 4, 4, white, { plain: true });
    w.box(9.2, 0.4, 4.2, '#ff8a1f', 22.5, G + 4.2, 27.5);
    w.box(4, 3, 0.06, '#5b6470', 22.5, G + 1.5, 25.47);
    w.sign('Rover-Garage', 22.5, G + 5.6, 25.4, { bg: '#ff8a1f', size: 0.8 });

    // ---------- Stern: Krater-Parkour ----------
    const R0 = 10, a0 = Math.PI / 4 + 0.75;
    let top = 1;
    const rocks = [];
    for (let i = 0; i < 8; i++) {
      const a = a0 + i * 0.66;
      top = 1 + 2 + i * 1.6;
      const x = CRATER.x + Math.cos(a) * R0, z = CRATER.z + Math.sin(a) * R0;
      w.block(x, top, z, 2.6, top - 0.5, 2.6, i % 2 ? '#8a3e24' : '#9c4a2c');
      w.box(1.8, 0.6, 1.8, '#b0583a', x + 0.2, top + 0.2, z - 0.1, 0.5);
      rocks.push([x, top, z]);
      if (i % 2) w.coin(x, top + 0.6, z);
    }
    const ptop = top + 0.8;
    w.block(CRATER.x, ptop, CRATER.z, 6, ptop - 0.5, 6, '#7f3420');
    w.box(3, 1.2, 3, '#9c4a2c', CRATER.x - 0.4, ptop - 1, CRATER.z + 0.3, 0.7);
    w.star('crater', CRATER.x, ptop, CRATER.z, 'Krater-Parkour');
    w.sign('Krater-Parkour', CRATER.x + 15, H(CRATER.x + 15, CRATER.z + 15) + 4.6, CRATER.z + 15, { bg: '#8a3e24', size: 0.9 });
    w.sign('Wenig Schwerkraft: Du springst viel höher!', CRATER.x + 15, H(CRATER.x + 15, CRATER.z + 15) + 3.5, CRATER.z + 15, { bg: '#ffffff', fg: '#17233b', size: 0.6 });
    w.box(0.2, 3, 0.2, '#d8dde3', CRATER.x + 1.2, ptop + 1.5, CRATER.z + 1.2);
    w.box(1.4, 0.9, 0.06, '#ffffff', CRATER.x + 1.9, ptop + 2.6, CRATER.z + 1.2);
    w.box(0.5, 0.4, 0.07, '#d2322b', CRATER.x + 1.9, ptop + 2.6, CRATER.z + 1.21);
    for (let i = 0; i < 9; i++) { const a = w.r(0, Math.PI * 2), r = w.r(3, 11); const x = CRATER.x + Math.cos(a) * r, z = CRATER.z + Math.sin(a) * r; if (!rocks.some(([rx, , rz]) => Math.hypot(rx - x, rz - z) < 3)) rock(x, z, w.r(0.4, 0.8)); }

    // ---------- Deko: Felsen, Flaggen, Meteoriten ----------
    const avoidR = [[-42, -20, 20, 12], [-10, 4, 10, 58], [24, -44, 44, -24], [16, -14, 48, 14], [8, 14, 30, 32]];
    let placed = 0;
    for (let k = 0; k < 400 && placed < 32; k++) {
      const x = w.r(-54, 54), z = w.r(-54, 54);
      if (avoidR.some(([a, b, c, d]) => x >= a && x <= c && z >= b && z <= d)) continue;
      if (Math.hypot(x - CRATER.x, z - CRATER.z) < 18) continue;
      if (canyonInfo(x, z)[0] < 4) continue;
      rock(x, z, w.r(0.5, 1.5));
      placed++;
    }
    for (const [x, z] of [[36, 50], [10, -46]]) { w.box(1.4, 1.2, 1.2, '#4a3a3a', x, H(x, z) + 0.5, z, 0.6, 0.3); w.box(0.5, 0.5, 0.5, '#8a8f98', x + 0.4, H(x, z) + 1.2, z, 0.2); }
    w.sign('Canyon', -30, H(-30, 40) + 6, 40, { bg: '#8a3e24', size: 0.9 });

    // ---------- Tiere: Marsmännchen und Roboterhunde ----------
    const V = (x, z) => new THREE.Vector3(x, 0, z);
    for (const [x, z, hungry, r] of [[-6, 28, true, 4], [6, 12, false, 3], [-24, 22, true, 4], [-30, -8, false, 3], [-4, -2, true, 3], [32, 18, false, 4], [-30, -30, true, 4], [26, -24, false, 3], [-40, 34, true, 3], [40, 4, false, 3]]) {
      w.animal('alien', { pos: V(x, z), behavior: 'hop', radius: r, speed: 1.3, hungry });
    }
    const robo = { '2b2b2b': '#8d97a5', ffffff: '#d0d6de', '111111': '#2fd0ff' };
    for (const [x, z] of [[8, 30], [-12, 6], [36, -20]]) {
      const a = w.animal('dog', { pos: V(x, z), radius: 4, speed: 1.6 });
      a.g.traverse((o) => { if (!o.isMesh) return; const k = o.material.color.getHexString(); if (robo[k]) o.material = plainMat(robo[k], k === '111111' ? '#1aa0d0' : undefined); });
    }

    // ---------- Münzen ----------
    w.coinLine(0, 44, 0, 8, 8, G);
    w.coinRing(-28, G, -3, 4.5, 8);
    w.coinRing(PAD.x, G + 1, PAD.z, 3.2, 6);
    for (let c = 0; c < 4; c++) w.coin(25.75 + c * 5.5, G, -6.25);
    w.coinLine(-44, 16, -22, 42, 7, 0.5);
    w.coinLine(-11, -5, 11, -5, 4, G);
    w.coinLine(18, 40, 40, 44, 5, G);
    for (const c of w.coins) {
      // Münzen auf Gelände-Höhe bringen
      const p = c.mesh.position, gy = H(p.x, p.z);
      if (p.y - 1.1 < gy) { c.baseY = gy + 1.1; p.y = c.baseY; }
      c.mesh.castShadow = false;
    }
    for (const a of w.animals) bake(a.g);
  },
};
