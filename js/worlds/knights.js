// Ritterburg: graue Steinburg auf dem Hügel mit Wassergraben, Fachwerkdorf, Turnierplatz, Mühle und Drache
import * as THREE from '../../vendor/three.module.min.js';
import { exitPortal } from './common.js';
import { pathRide, part } from '../rides.js';

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

const G = 0.5;   // flaches Land
const HT = 5;    // Burgberg (Plateau)
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };

// Burg (Innenhof) und Wassergraben
const CX = 0, CZ = -32, CW = 28, CD = 24;           // Burgmauer x −14..14, z −44..−20
const inRect = (x, z, x1, z1, x2, z2) => x >= x1 && x <= x2 && z >= z1 && z <= z2;
const inMoat = (x, z) => inRect(x, z, -18.5, -48.5, 18.5, -15.5) && !inRect(x, z, -15.5, -45.5, 15.5, -18.5);
const MAZE = { x0: 33, z0: -50, C: 7, S: 3.2 };
const LIST = { x1: 22, x2: 50, z: 19 };             // Turnierbahn

// Pferd aus Klötzchen (Front +z); gibt Beine für die Galopp-Animation zurück
function makeHorse(g, color, blanket, trim) {
  part(g, 0.9, 0.85, 2.0, color, 0, 1.45, 0);
  part(g, 0.5, 1.0, 0.5, color, 0, 2.1, 0.95).rotation.x = 0.45;
  part(g, 0.45, 0.5, 0.95, color, 0, 2.6, 1.35);
  part(g, 0.16, 0.6, 0.9, '#2b1a0e', 0, 2.55, 0.8).rotation.x = 0.45;
  for (const s of [-1, 1]) part(g, 0.06, 0.08, 0.08, '#111', s * 0.23, 2.7, 1.55);
  part(g, 0.18, 0.7, 0.18, '#2b1a0e', 0, 1.4, -1.1).rotation.x = 0.4;
  part(g, 1.02, 0.7, 1.5, blanket, 0, 1.3, -0.05);
  part(g, 1.04, 0.12, 1.52, trim, 0, 0.98, -0.05);
  const legs = [];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const p = new THREE.Group();
    p.position.set(sx * 0.3, 1.1, sz * 0.75);
    part(p, 0.2, 1.1, 0.2, color, 0, -0.55, 0);
    g.add(p);
    legs.push(p);
  }
  return legs;
}
// Ritter (ohne Waffen) mit Wimpel-Stange
function makeKnight(g, tabard, plume) {
  part(g, 1.0, 0.25, 0.5, '#9aa3ad', 0, 1.9, 0);
  part(g, 0.7, 0.9, 0.45, tabard, 0, 2.45, 0);
  part(g, 0.5, 0.55, 0.5, '#c8ced6', 0, 3.2, 0);
  part(g, 0.52, 0.08, 0.3, '#2b2f36', 0, 3.22, 0.12);
  part(g, 0.12, 0.45, 0.4, plume, 0, 3.65, -0.05);
  for (const s of [-1, 1]) part(g, 0.2, 0.7, 0.2, '#9aa3ad', s * 0.45, 2.4, 0.1);
  part(g, 0.08, 3.2, 0.08, '#7a4a2a', 0.55, 3.1, 0.2);
  part(g, 0.05, 0.6, 1.0, plume, 0.55, 4.3, -0.3);
}

// Freundlicher Drache als Fahrzeug (Front +z)
function makeDragon() {
  const g = new THREE.Group();
  const c = '#3fbf5a', c2 = '#ffd23f';
  part(g, 1.8, 1.5, 3.6, c, 0, 1.3, 0);
  part(g, 1.6, 0.5, 3.0, c2, 0, 0.55, 0.1);
  part(g, 0.8, 0.9, 1.8, c, 0, 2.1, 2.2).rotation.x = -0.6;
  part(g, 1.2, 1.0, 1.4, c, 0, 2.9, 3.2);
  part(g, 0.9, 0.4, 0.8, c2, 0, 2.6, 3.9);
  for (const s of [-1, 1]) {
    part(g, 0.22, 0.24, 0.05, '#ffffff', s * 0.35, 3.15, 3.92);
    part(g, 0.12, 0.14, 0.05, '#111', s * 0.35, 3.13, 3.95);
    part(g, 0.18, 0.55, 0.18, '#fffaf0', s * 0.35, 3.6, 2.9).rotation.x = -0.5;
    part(g, 0.25, 0.12, 0.05, '#ff8fb8', s * 0.5, 2.85, 3.92);
  }
  part(g, 0.6, 0.6, 3.2, c, 0, 1.3, -3.2).rotation.x = 0.2;
  part(g, 1.2, 0.15, 0.9, c2, 0, 1.0, -4.9);
  for (let i = 0; i < 4; i++) part(g, 0.15, 0.45, 0.45, c2, 0, 2.15, 1.3 - i * 0.9);
  part(g, 1.0, 0.2, 1.1, '#c0392b', 0, 2.1, -0.3);
  const wings = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group();
    p.position.set(s * 0.85, 1.7, 0.4);
    part(p, 3.6, 0.12, 2.2, c, s * 1.8, 0, 0);
    part(p, 3.0, 0.1, 1.5, c2, s * 1.7, -0.05, -0.25);
    g.add(p);
    wings.push([p, s]);
  }
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) part(g, 0.4, 0.8, 0.5, c, sx * 0.6, 0.35, sz * 1.1);
  return { g, wings };
}

export const knights = {
  id: 'knights',
  name: 'Ritterburg',
  seed: 105,
  theme: {
    sky: ['#3d7fcf', '#a9d2f5', '#f4f1e6'], fog: '#d8e4ee', sea: '#3a7fc0', fogNear: 100, fogFar: 250,
    light: { hemi: 1.55, sun: 2.3, sunColor: '#fff3dc', sky: '#ffffff', ground: '#6d8f6a' },
  },
  stars: { keep: 'Burgfried', dragon: 'Drachenflug', joust: 'Turnier-Ritt', dungeon: 'Schatzkammer' },
  build(w) {
    // ---------- Gelände ----------
    const roads = [[0, 50, 0, -14, 3.2], [0, 30, -30, 16, 2.6], [0, 24, 18, 19, 2.6], [-30, 16, -44, -6, 2.4], [0, -6, 26, -36, 2.2]];
    const segDist = (x, z, [x1, z1, x2, z2]) => {
      const dx = x2 - x1, dz = z2 - z1, t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / (dx * dx + dz * dz)));
      return Math.hypot(x - x1 - dx * t, z - z1 - dz * t);
    };
    const onRoad = (x, z) => roads.some((r) => segDist(x, z, r) < r[4] / 2 + 0.3);
    const hillH = (x, z) => {
      const dx = Math.max(0, Math.abs(x) - 20), dz = Math.max(0, z + 13);
      return HT - Math.hypot(dx, dz) * 0.45;
    };
    const height = (x, z) => {
      const d = Math.pow(Math.abs(x) ** 4 + Math.abs(z) ** 4, 0.25);
      if (d > 60.5) return 0;
      let h = G;
      const hh = hillH(x, z);
      if (z < -10 || Math.abs(x) < 32) h = Math.max(h, hh);
      if (inMoat(x, z)) h = HT - 1;
      return h;
    };
    w.terrain({
      x0: -66, z0: -66, cols: 66, rows: 66, cell: 2, step: 0.5, height,
      color: (x, z, h) => {
        const d = Math.pow(Math.abs(x) ** 4 + Math.abs(z) ** 4, 0.25);
        if (inMoat(x, z)) return '#6d6a5a';
        if (inRect(x, z, -14, -44, 14, -20)) return (Math.floor(x / 2) + Math.floor(z / 2)) % 2 ? '#a5a39a' : '#9a978d';
        if (h >= HT && d > 56) return '#8d8f92';
        if (h <= G && d > 57) return '#ecdba8';
        if (onRoad(x, z)) return '#b9a78a';
        if (inRect(x, z, -38, 9, -22, 23)) return (Math.floor(x / 2) + Math.floor(z / 2)) % 2 ? '#c2b8a6' : '#b3a995';
        if (inRect(x, z, 18, 8, 54, 30)) return '#d9c79a';
        if (inRect(x, z, -57, -52, -34, -14)) { const k = Math.floor((z + 52) / 4) % 3; return ['#e2c24a', '#7ab04a', '#d9b23a'][k]; }
        const n = hash(Math.floor(x / 2), Math.floor(z / 2));
        if (h > G + 0.5) return n > 0.5 ? '#5fae4a' : '#58a444';
        return n < 0.2 ? '#5fb84d' : n > 0.85 ? '#74c45a' : '#68bd50';
      },
    });
    exitPortal(w, 53, 'hub');

    // ---------- Helfer ----------
    const solid = (x, z, hx, hz, h, y0 = G) => w.solids.push({ min: new THREE.Vector3(x - hx, y0, z - hz), max: new THREE.Vector3(x + hx, y0 + h, z + hz) });
    const local = (cx, cz, ry, y0 = G) => (bw, bh, bd, c, lx, ly, lz, rx = 0, rz = 0, dry = 0) => {
      const cs = Math.cos(ry), sn = Math.sin(ry);
      w.box(bw, bh, bd, c, cx + lx * cs + lz * sn, y0 + ly, cz - lx * sn + lz * cs, ry + dry, rx, rz);
    };
    const flag = (x, y, z, c, h = 3) => { w.box(0.12, h, 0.12, '#5b3a1e', x, y + h / 2, z); w.box(0.05, 0.7, 1.2, c, x, y + h - 0.45, z + 0.62); };
    const barrel = (x, z, y = G) => {
      for (const r of [0, Math.PI / 4]) w.box(0.8, 1.1, 0.8, '#8a5a2b', x, y + 0.55, z, r);
      for (const yy of [0.25, 0.85]) for (const r of [0, Math.PI / 4]) w.box(0.84, 0.08, 0.84, '#3b3b3b', x, y + yy, z, r);
      solid(x, z, 0.4, 0.4, 1.1, y);
    };
    const stone = '#7d828c', stoneD = '#5d626b', slate = '#3d4a6b';
    const coneMat = new THREE.MeshLambertMaterial({ color: slate });
    const roofCone = (x, y, z, r, h) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 4), coneMat); m.position.set(x, y + h / 2, z); m.rotation.y = Math.PI / 4; m.castShadow = true; w.add(m); };
    const tower = (x, z, s, h, y = HT, roof = true) => {
      w.block(x, y + h, z, s, h, s, stoneD);
      for (let i = 0; i < 4; i++) for (const k of [-1, 1]) {
        const u = (i % 2 ? 1 : -1) * (s / 2 - 0.35);
        if (i < 2) w.box(0.7, 0.8, 0.7, stoneD, x + u * k * (i ? 1 : -1), y + h + 0.4, z + k * (s / 2 - 0.35));
        else w.box(0.7, 0.8, 0.7, stoneD, x + k * (s / 2 - 0.35), y + h + 0.4, z + u * k);
      }
      for (const yy of [h * 0.45, h * 0.75]) for (const [nx, nz] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) w.box(nz ? 0.4 : 0.06, 0.9, nz ? 0.06 : 0.4, '#2b2f36', x + nx * (s / 2 + 0.02), y + yy, z + nz * (s / 2 + 0.02));
      if (roof) roofCone(x, y + h + 0.8, z, s * 0.78, s * 1.1);
    };
    // Fachwerkhaus: weiße Wände, braune Balken, rotes Satteldach
    const fachwerk = (x, z, ww, d, h, door) => {
      const y = w.heightAt(x, z);
      w.house(x, z, ww, d, h, { wall: '#f4efe2', roof: 'gable', roofColor: w.pick(['#c0392b', '#b5432a', '#a8322b']), door, window: '#6fa8d8', doorColor: '#6b3f1f', shutters: false });
      const beam = '#5b3a1e';
      for (const [nx, nz, len] of [[0, 1, ww], [0, -1, ww], [1, 0, d], [-1, 0, d]]) {
        const cnt = Math.max(1, Math.floor(len / 2.6));
        const px = (u) => (nz ? x + u : x + nx * (ww / 2 + 0.05)), pz = (u) => (nz ? z + nz * (d / 2 + 0.05) : z + u);
        for (let k = 0; k <= cnt; k++) { const u = -len / 2 + k * (len / cnt); w.box(nz ? 0.25 : 0.1, h, nz ? 0.1 : 0.25, beam, px(u), y + h / 2, pz(u)); }
        for (const yy of [0.1, 1.0, h / 2 + 0.6, h - 0.1]) w.box(nz ? len : 0.1, 0.2, nz ? 0.1 : len, beam, px(0), y + yy, pz(0));
        for (let k = 0; k < cnt; k++) {
          if (k % 2 && h > 4) {
            const u = -len / 2 + (k + 0.5) * (len / cnt), seg = len / cnt;
            w.box(nz ? 0.18 : 0.1, Math.hypot(seg, h / 2 - 0.6) * 0.9, nz ? 0.1 : 0.18, beam, px(u), y + h * 0.75 + 0.1, pz(u), 0, nz ? 0 : 0.7, nz ? 0.7 : 0);
          }
        }
      }
      w.box(0.9, 1.6, 0.9, '#8d8f92', x + ww / 4, y + h + d * 0.3, z);
    };
    const stall = (x, z, ry, c) => {
      const L = local(x, z, ry);
      L(3, 1, 1.4, '#8a5e33', 0, 0.5, 0);
      for (const sx of [-1.4, 1.4]) for (const sz of [-0.6, 0.6]) L(0.15, 2.6, 0.15, '#5b3a1e', sx, 1.3, sz);
      for (let i = 0; i < 5; i++) L(0.62, 0.15, 1.9, i % 2 ? '#ffffff' : c, -1.24 + i * 0.62, 2.7, 0.1, -0.25);
      for (let i = 0; i < 4; i++) L(0.35, 0.3, 0.35, w.pick(['#e8262b', '#ffb020', '#7ac943', '#ffd23f', '#a0522d']), -1 + i * 0.65, 1.15, 0.1);
      solid(x, z, 1.5, 1.5, 1);
    };

    // ---------- Burg ----------
    w.enclosure({ x: CX, z: CZ, w: CW, d: CD, side: 's', h: 7, color: stone, label: 'Burgtor', y: HT, cap: stoneD });
    for (const [x, z] of [[-14, -44], [14, -44], [-14, -20], [14, -20]]) tower(x, z, 4.6, 11);
    for (const x of [-3.2, 3.2]) tower(x, -20, 2.6, 9.5, HT, false);
    w.box(9, 1, 3, stoneD, 0, HT + 9.6, -20);
    for (let i = -4; i <= 4; i += 2) w.box(0.7, 0.8, 0.7, stoneD, i, HT + 10.5, -21.2);
    w.sign('Ritterburg', 0, HT + 12.6, -19, { bg: '#7a1f2b', fg: '#ffe9b0', size: 1.1 });
    // Banner an der Mauer
    for (const x of [-9, -6, 6, 9]) { w.box(1.4, 3, 0.08, x % 2 ? '#c0392b' : '#2f5fd6', x, HT + 4.4, -19.55); w.box(0.5, 0.5, 0.09, '#ffd23f', x, HT + 4.6, -19.5); }
    // Wassergraben und Zugbrücke
    for (const [x, z, ww, dd] of [[0, -17, 37, 3], [0, -47, 37, 3], [-17, -32, 3, 27], [17, -32, 3, 27]]) w.water(x, z, ww, dd, { top: HT - 0.3, color: '#4f9fd8' });
    w.block(0, HT + 0.15, -17, 4, 0.5, 4.2, '#8a5e33', { safe: true });
    for (let i = -1.5; i <= 1.5; i += 1) w.box(0.9, 0.06, 4.2, '#a0764e', i, HT + 0.18, -17);
    for (const s of [-1, 1]) w.box(0.12, 0.12, 5.4, '#3b3b3b', s * 1.9, HT + 3.2, -17.6, 0, 0.62);
    // Burgfried mit Wendeltreppe
    const peak = w.spiralTower({ x: 0, z: -33, y: HT, r: 5.6, n: 16, rise: 1.1, size: 2.4, a0: Math.PI / 2, da: 0.66, colors: ['#9aa0a8', '#8a8f98'], column: stoneD, colW: 6, top: '#6b7079', topSize: 8, starId: 'keep', label: 'Burgfried' });
    for (let i = 0; i < 8; i++) {
      const u = -3.5 + i;
      if (i % 2 === 0) { w.box(0.8, 0.9, 0.5, stoneD, u, peak + 0.45, -33 - 3.75); w.box(0.8, 0.9, 0.5, stoneD, u, peak + 0.45, -33 + 3.75); w.box(0.5, 0.9, 0.8, stoneD, -3.75, peak + 0.45, -33 + u); w.box(0.5, 0.9, 0.8, stoneD, 3.75, peak + 0.45, -33 + u); }
    }
    flag(2.6, peak, -35.6, '#c0392b', 4);
    for (const yy of [HT + 6, HT + 12]) for (const [nx, nz] of [[0, 1], [1, 0], [-1, 0]]) w.box(nz ? 0.5 : 0.06, 1.2, nz ? 0.06 : 0.5, '#2b2f36', nx * 3.03, yy, -33 + nz * 3.03);
    // Innenhof
    w.box(1.6, 0.8, 1.6, stoneD, -9, HT + 0.4, -24); w.water(-9, -24, 1.1, 1.1, { top: HT + 0.7, color: '#4f9fd8' });
    for (const s of [-1, 1]) w.box(0.15, 2.2, 0.15, '#5b3a1e', -9 + s * 0.7, HT + 1.5, -24); w.box(1.7, 0.2, 0.2, '#5b3a1e', -9, HT + 2.6, -24);
    solid(-9, -24, 0.8, 0.8, 0.8, HT);
    barrel(10, -24, HT); barrel(11, -24.2, HT); barrel(10.5, -25.2, HT);
    w.box(4, 0.15, 1.2, '#8a5e33', 8.5, HT + 1, -40); w.box(4, 0.8, 1.2, '#6b4423', 8.5, HT + 0.5, -40);
    for (const x of [-11, -8]) w.box(1.4, 1, 1.0, '#e8c85a', x, HT + 0.5, -41);

    // ---------- Stern: Drachenflug ----------
    const dragon = makeDragon();
    bake(dragon.g);
    w.addRide(pathRide(w, {
      points: [[-12, G + 1.2, 2], [-16, 6, -5], [-24, 12, -16], [-30, 18, -32], [-22, 22, -50], [0, 25, -58], [22, 22, -50], [32, 20, -32],
        [26, 18, -12], [12, 16, 0], [-4, 15, 8], [-24, 13, 24], [-40, 11, 16], [-36, 8, 4], [-24, 4, 2], [-15, G + 1.4, 3.5]],
      closed: true, duration: 28, vehicle: dragon.g, seat: [0, 1.15, -0.4], name: 'Drachenflug', starId: 'dragon', bank: 0,
      station: w.station(-9, 5.5, 'Drachenflug', '#2f9a4a', G), exit: new THREE.Vector3(-5.5, G, 7.5),
      animate(v, t) { for (const [p, s] of dragon.wings) p.rotation.z = s * Math.sin(t * 5) * 0.5; },
    }));
    w.box(5, 0.5, 4.2, '#8a5e33', -12.5, G + 0.25, 2.5);
    w.sign('Drachennest', -12.5, G + 5, 0, { bg: '#2f9a4a', size: 0.8 });
    // Deko-Drache kreist um den Burgfried
    w.animal('dragon', { pos: new THREE.Vector3(0, 0, -33), y: peak + 9, behavior: 'fly', radius: 15, speed: 5, color: '#e8742b', color2: '#ffd23f' });

    // ---------- Stern: Turnier-Ritt ----------
    const { x1, x2, z: lz } = LIST;
    for (let x = x1; x < x2; x += 2) w.box(2, 0.25, 0.25, x % 4 ? '#c0392b' : '#ffffff', x + 1, G + 1.1, lz);
    for (let x = x1; x <= x2; x += 2) w.box(0.2, 1.2, 0.2, '#5b3a1e', x, G + 0.6, lz);
    solid((x1 + x2) / 2, lz, (x2 - x1) / 2, 0.15, 1.2);
    // Zaun um den Turnierplatz
    const fence = (ax, az, bx, bz) => {
      const len = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az);
      for (let i = 0; i <= len; i += 2.5) w.box(0.2, 1.1, 0.2, '#6b4423', ax + (bx - ax) * i / len, G + 0.55, az + (bz - az) * i / len);
      w.box(0.12, 0.16, len, '#8a5e33', (ax + bx) / 2, G + 0.9, (az + bz) / 2, ry);
      solid((ax + bx) / 2, (az + bz) / 2, Math.max(0.15, Math.abs(bx - ax) / 2), Math.max(0.15, Math.abs(bz - az) / 2), 1.1);
    };
    fence(19, 13, 53, 13); fence(19, 25, 53, 25); fence(53, 13, 53, 25); fence(19, 13, 19, 16); fence(19, 22, 19, 25);
    // Tribünen mit gestreiften Dächern und Fahnen
    for (const [sz, dir] of [[9.5, -1], [28.5, 1]]) {
      for (let k = 0; k < 3; k++) w.block(36, G + 0.6 + k * 0.6, sz + dir * k * 1.1, 18, 0.6 + k * 0.6, 1.2, k % 2 ? '#a0764e' : '#8a5e33');
      for (const x of [27.5, 36, 44.5]) for (const zz of [sz - dir * 0.4, sz + dir * 2.6]) w.box(0.25, 4.6, 0.25, '#5b3a1e', x, G + 2.3, zz);
      for (let i = 0; i < 9; i++) w.box(2, 0.15, 3.8, i % 2 ? '#ffffff' : (dir < 0 ? '#c0392b' : '#2f5fd6'), 28 + i * 2, G + 4.6, sz + dir * 1.1, 0, dir * 0.12);
      for (const x of [27, 31.5, 36, 40.5, 45]) flag(x, G + 4.6, sz + dir * 1.1, w.pick(['#c0392b', '#2f5fd6', '#ffd23f', '#2f9a4a']), 2.4);
      for (let i = 0; i < 6; i++) { const x = 28 + i * 3; w.box(0.5, 0.7, 0.4, w.pick(['#e8262b', '#2f7df6', '#ffd23f', '#8ac926', '#b07bff']), x, G + 1.8 + (i % 3) * 0.6, sz + dir * (i % 3) * 1.1); w.box(0.4, 0.4, 0.4, '#f2c9a0', x, G + 2.35 + (i % 3) * 0.6, sz + dir * (i % 3) * 1.1); }
    }
    w.sign('Turnierplatz', 36, G + 7.4, 9.5, { bg: '#7a1f2b', fg: '#ffe9b0', size: 1 });
    // Reitpferd für den Turnier-Ritt
    const steed = new THREE.Group();
    const steedLegs = makeHorse(steed, '#f2ece0', '#2f5fd6', '#ffd23f');
    part(steed, 0.08, 2.6, 0.08, '#7a4a2a', 0.6, 2.6, 0.3);
    part(steed, 0.05, 0.6, 1.0, '#ffd23f', 0.6, 3.6, -0.2);
    bake(steed);
    const jz = 17.2, jz2 = 20.8;
    w.addRide(pathRide(w, {
      points: [[x1 - 2, G, jz], [x1 + 6, G, jz], [x1 + 14, G, jz], [x1 + 22, G, jz], [x2 - 1, G, jz], [x2 + 1.6, G, lz], [x2 - 1, G, jz2],
        [x2 - 8, G, jz2], [x1 + 12, G, jz2], [x1 + 4, G, jz2], [x1 - 2.4, G, lz + 1.2]],
      closed: true, duration: 16, vehicle: steed, seat: [0, 0.75, -0.1], flat: true, idle: 'wait',
      name: 'Turnier-Ritt', starId: 'joust', station: w.station(15, 19, 'Turnier-Ritt', '#c0392b', G), exit: new THREE.Vector3(15, G, 23.5),
      animate(v, t, riding) { steedLegs.forEach((l, i) => { l.rotation.x = riding ? Math.sin(t * 12 + (i % 2 ? 0 : Math.PI) + (i > 1 ? 0.8 : 0)) * 0.7 : 0; }); },
    }));
    // Zwei Ritter reiten zur Übung hin und her
    const riders = [];
    [['#8a5a2b', '#c0392b', '#ffd23f', '#c0392b', jz2 + 1.6, 0], ['#3b2a1a', '#2f9a4a', '#ffffff', '#2f9a4a', jz - 1.6, Math.PI]].forEach(([hc, bl, tr, tab, z, ph]) => {
      const g = new THREE.Group();
      const legs = makeHorse(g, hc, bl, tr);
      makeKnight(g, tab, tr === '#ffffff' ? '#2f9a4a' : '#ffd23f');
      w.add(bake(g));
      riders.push({ g, legs, z, ph });
    });
    w.updaters.push((dt, t) => {
      for (const r of riders) {
        const s = Math.sin(t * 0.45 + r.ph), c = Math.cos(t * 0.45 + r.ph);
        r.g.position.set(36 + s * 12.5, G, r.z);
        r.g.rotation.y = c > 0 ? Math.PI / 2 : -Math.PI / 2;
        const gallop = Math.abs(c) > 0.25;
        r.legs.forEach((l, i) => { l.rotation.x = gallop ? Math.sin(t * 11 + (i % 2 ? 0 : Math.PI) + (i > 1 ? 0.8 : 0)) * 0.6 : 0; });
        r.g.position.y = G + (gallop ? Math.abs(Math.sin(t * 11)) * 0.12 : 0);
      }
    });

    // ---------- Stern: Schatzkammer-Labyrinth ----------
    const { x0, z0, C, S } = MAZE;
    w.box(C * S, 0.06, C * S, '#3a3640', x0 + C * S / 2, G + 0.04, z0 + C * S / 2);
    w.maze({ x0, z0, C, S, H: 3.8, color: '#6b6f78', label: 'Schatzkammer', starId: 'dungeon', starLabel: 'Schatzkammer', y: G, row: 3 });
    const ms = w.stars[w.stars.length - 1].pos;
    for (let i = 0; i < 7; i++) w.box(0.4, 0.25, 0.6, '#ffd23f', ms.x + w.r(-1.1, 1.1), G + 0.15, ms.z + w.r(-1.1, 1.1), w.r(0, 3));
    w.box(1.2, 0.7, 0.8, '#8a5a2b', ms.x + 0.6, G + 0.35, ms.z - 0.9); w.box(1.25, 0.3, 0.85, '#ffd23f', ms.x + 0.6, G + 0.8, ms.z - 0.9);
    for (const [x, z] of [[x0, z0 + 2.2 * S], [x0, z0 + 4.8 * S], [x0 + C * S / 2, z0 + C * S], [x0 + C * S, z0 + C * S / 2]]) {
      w.box(0.25, 0.6, 0.25, '#5b3a1e', x, G + 2.7, z + (z === z0 + C * S ? 0.45 : 0));
      w.box(0.35, 0.4, 0.35, '#ffb020', x, G + 3.15, z + (z === z0 + C * S ? 0.45 : 0));
    }
    for (let i = 0; i <= C; i++) { w.box(0.9, 0.7, 0.9, '#5d626b', x0 + i * S, G + 4.15, z0); w.box(0.9, 0.7, 0.9, '#5d626b', x0 + i * S, G + 4.15, z0 + C * S); }
    w.coin(x0 + 0.5 * S, G, z0 + 3.5 * S);

    // ---------- Dorf mit Marktplatz ----------
    fachwerk(-44, 8, 7, 6, 5.2, 'e');
    fachwerk(-44, 21, 6, 7, 4.6, 'e');
    fachwerk(-31, 30, 8, 6, 5.4, 'n');
    fachwerk(-19, 30, 6, 6, 4.4, 'n');
    fachwerk(-31, 2, 7, 5, 4.8, 's');
    fachwerk(-49, 33, 6, 6, 4.2, 'e');
    fachwerk(-16, 44, 6, 6, 4.4, 'n');
    // Brunnen
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; w.box(1.6, 0.7, 0.5, '#9aa0a8', -30 + Math.cos(a) * 1.9, G + 0.35, 16 + Math.sin(a) * 1.9, -a + Math.PI / 2); }
    w.water(-30, 16, 3.2, 3.2, { top: G + 0.55, color: '#5cc0f0' });
    w.box(0.6, 2.2, 0.6, '#9aa0a8', -30, G + 1.1, 16); w.box(1.4, 0.3, 1.4, '#9aa0a8', -30, G + 2.2, 16);
    solid(-30, 16, 2.1, 2.1, 0.7);
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 1.4, 8), new THREE.MeshBasicMaterial({ color: '#bfeaff', transparent: true, opacity: 0.7 }));
    jet.position.set(-30, G + 3, 16);
    w.add(jet);
    w.updaters.push((dt, t) => { jet.scale.y = 1 + Math.sin(t * 4) * 0.2; });
    stall(-36, 12, 0.6, '#c0392b'); stall(-24, 12, -0.6, '#2f5fd6'); stall(-36, 20.5, Math.PI - 0.6, '#2f9a4a'); stall(-24, 20.5, Math.PI + 0.6, '#ffb020');
    w.sign('Marktplatz', -30, G + 5.4, 16, { bg: '#7a4a2a', fg: '#ffe9b0', size: 0.9 });
    barrel(-38.5, 15.5); barrel(-38.4, 16.6); barrel(-21.5, 16);
    for (const [x, z] of [[-22, 8], [-38, 8], [-22, 24], [-38, 24]]) { w.box(0.2, 3, 0.2, '#3b3b3b', x, G + 1.5, z); w.box(0.5, 0.6, 0.5, '#ffe9a8', x, G + 3.2, z); }

    // ---------- Mühle und Felder ----------
    const MX = -45, MZ = -6;
    w.block(MX, G + 6, MZ, 4.4, 6, 4.4, '#e8e2d2', { plain: true });
    w.box(4.6, 0.3, 4.6, '#5b3a1e', MX, G + 3, MZ);
    w.box(3.6, 3, 3.6, '#e8e2d2', MX, G + 7.5, MZ);
    w.box(4.4, 0.25, 4.4, '#a8322b', MX, G + 9.6, MZ, 0, 0.62);
    w.box(4.0, 2.2, 3.0, '#a8322b', MX, G + 9.8, MZ);
    w.box(1.2, 2.0, 0.1, '#6b3f1f', MX, G + 1, MZ + 2.22);
    const sails = new THREE.Group();
    sails.position.set(MX, G + 8.4, MZ + 2.4);
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Group();
      arm.rotation.z = i * Math.PI / 2;
      part(arm, 0.3, 6.5, 0.2, '#6b4423', 0, 3.25, 0);
      part(arm, 1.6, 5, 0.08, '#f4efe2', 0.95, 3.8, 0.05);
      sails.add(arm);
    }
    part(sails, 0.7, 0.7, 0.6, '#3b3b3b', 0, 0, 0);
    w.add(bake(sails));
    w.updaters.push((dt) => { sails.rotation.z -= dt * 0.8; });
    w.sign('Mühle', MX, G + 13.6, MZ, { bg: '#7a4a2a', fg: '#ffe9b0', size: 0.8 });
    for (let z = -50; z < -14; z += 4) for (let x = -56; x < -34; x += 1.6) {
      const k = Math.floor((z + 52) / 4) % 3;
      if (k === 1) w.box(0.7, 0.6, 0.7, '#3f8f3a', x + 0.4, G + 0.3, z + 1.5);
      else w.box(1.2, 0.9, 2.6, k ? '#e8c85a' : '#f0d060', x + 0.6, G + 0.45, z + 1.8);
    }
    for (const [x, z] of [[-40, -10], [-38, -11.2]]) w.box(1.4, 1, 1.4, '#e8c85a', x, G + 0.5, z, 0.3);
    // Vogelscheuche
    w.box(0.2, 2.6, 0.2, '#6b4423', -46, G + 1.3, -36); w.box(2, 0.18, 0.18, '#6b4423', -46, G + 2.2, -36);
    w.box(0.7, 0.9, 0.4, '#2f5fd6', -46, G + 2.1, -36); w.box(0.5, 0.5, 0.5, '#e8c85a', -46, G + 2.85, -36); w.box(0.8, 0.15, 0.8, '#a0522d', -46, G + 3.15, -36);

    // ---------- Pferdekoppel, Stall ----------
    const pfence = (ax, az, bx, bz) => {
      const len = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az);
      for (let i = 0; i <= len; i += 2.5) w.box(0.22, 1.3, 0.22, '#f2ece0', ax + (bx - ax) * i / len, G + 0.65, az + (bz - az) * i / len);
      for (const yy of [0.55, 1.1]) w.box(0.12, 0.14, len, '#f2ece0', (ax + bx) / 2, G + yy, (az + bz) / 2, ry);
      solid((ax + bx) / 2, (az + bz) / 2, Math.max(0.15, Math.abs(bx - ax) / 2), Math.max(0.15, Math.abs(bz - az) / 2), 1.3);
    };
    pfence(26, 36, 52, 36); pfence(26, 52, 52, 52); pfence(52, 36, 52, 52); pfence(26, 36, 26, 42); pfence(26, 46, 26, 52);
    w.house(47, 48, 7, 5, 4, { wall: '#a0764e', roof: 'gable', roofColor: '#7a3f22', door: 'n', window: '#f2ece0', doorColor: '#5b3a1e' });
    w.sign('Pferdekoppel', 26, G + 3, 44, { bg: '#7a4a2a', fg: '#ffe9b0', size: 0.8 });

    // ---------- Bäume, Büsche, Blumen ----------
    const avoid = [[-58, -58, 34, -10], [-54, -2, -10, 38], [16, 6, 56, 34], [24, 34, 54, 54], [-6, -12, 6, 58], [-20, 38, -12, 50], [-20, -4, -1, 18], [31, -52, 58, -24]];
    const inAvoid = (x, z) => avoid.some(([a, b, c, d]) => x >= a && x <= c && z >= b && z <= d);
    let placed = 0;
    for (let k = 0; k < 800 && placed < 38; k++) {
      const x = w.r(-55, 55), z = w.r(-55, 55);
      if (inAvoid(x, z) || onRoad(x, z) || w.heightAt(x, z) !== G) continue;
      const d = Math.pow(Math.abs(x) ** 4 + Math.abs(z) ** 4, 0.25);
      if (d > 54) continue;
      w.tree(w.pick(['oak', 'oak', 'pine', 'birch']), x, z, w.r(0.9, 1.3), G);
      placed++;
    }
    for (const [cx, cz] of [[-8, 20], [8, 30], [-12, 34], [10, 42], [-24, 44], [20, 2]]) for (let i = 0; i < 14; i++) {
      const x = cx + w.r(-2.5, 2.5), z = cz + w.r(-2, 2);
      w.box(0.08, 0.4, 0.08, '#3c8c3c', x, G + 0.2, z);
      w.box(0.3, 0.2, 0.3, w.pick(['#ff595e', '#ffd23f', '#ffffff', '#b07bff']), x, G + 0.48, z);
    }

    // ---------- Tiere ----------
    const V = (x, z) => new THREE.Vector3(x, 0, z);
    [['#8a5a2b', true], ['#f2ece0', false], ['#2b2b2b', false], ['#d9a65a', false]].forEach(([c, h], i) => w.animal('horse', { pos: V(32 + i * 4, 42 + (i % 2) * 4), radius: 6, speed: 1.1, color: c, saddle: i % 2 ? '#c0392b' : '#2f5fd6', hungry: h }));
    for (let i = 0; i < 5; i++) w.animal('chicken', { pos: V(-34 + i * 2, 26 - (i % 2) * 2), radius: 3, speed: 0.9, hungry: i === 2 });
    for (let i = 0; i < 5; i++) w.animal('sheep', { pos: V(-24 + (i % 3) * 3, -12 + Math.floor(i / 3) * 3), radius: 4, speed: 0.5, hungry: i === 1 });
    for (let i = 0; i < 3; i++) w.animal('goat', { pos: V(22 + i * 2, -14 - i * 2), radius: 4, speed: 0.8, hungry: i === 0 });
    for (let i = 0; i < 3; i++) w.animal('duck', { pos: new THREE.Vector3(-8 + i * 7, HT - 0.3, -17), y: HT - 0.3, behavior: 'swim', radius: 1.2, speed: 0.6, hungry: i === 1 });
    w.animal('bird', { pos: new THREE.Vector3(0, 0, -33), y: peak + 4, behavior: 'fly', radius: 9, speed: -4, colors: ['#8a5a2b', '#5b3a1e', '#e8d8c8'], scale: 1.3 });
    // Falke sitzt auf einer Zinne (gegenüber der Fahne, damit er nicht im Tuch steckt)
    w.animal('bird', { pos: new THREE.Vector3(-3.75, peak, -34.5), y: peak + 0.92, behavior: 'perch', colors: ['#8a5a2b', '#5b3a1e', '#e8d8c8'], scale: 1.1 });
    w.animal('cat', { pos: V(-28, 4), radius: 3, speed: 0.8, color: '#f08a1f' });
    w.animal('dog', { pos: V(-6, 26), radius: 4, speed: 1.4 });

    // ---------- Münzen ----------
    w.coinLine(0, 42, 0, 6, 7, G);
    for (let i = 0; i < 4; i++) { const z = 2 - i * 4; w.coin(0, w.heightAt(0, z), z); }
    w.coinRing(-30, G, 16, 5, 8);
    w.coinLine(24, 15.4, 48, 15.4, 6, G);
    w.coinLine(-50, -48, -50, -18, 5, G);
    w.coin(0, HT + 0.4, -17);
    w.coinLine(-11, -23, 11, -23, 5, HT);
    w.coinLine(30, 40, 30, 50, 3, G);
    w.coinLine(-24, 38, -40, 38, 4, G);
    for (const c of w.coins) c.mesh.castShadow = false;
    for (const a of w.animals) bake(a.g);
  },
};
