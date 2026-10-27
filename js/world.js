// Offene Welten: Inseln mit Zäunen und Mathe-Toren, Portalen, Sternen, Tieren und Fahrgeschäften.
// Die Physik in main.js nutzt dieselben Listen wie bei den Parkour-Leveln (solids, kills, coins, gates).
import * as THREE from '../vendor/three.module.min.js';
import { blockMat, blockGeometry, textSprite, disposeTree, studTexture } from './blocks.js';
import { makeAnimal, updateAnimal, heartBurst } from './animals.js';
import { seededRng } from './math.js';

const UNIT = new THREE.BoxGeometry(1, 1, 1);
UNIT.userData.shared = true;

const SIDES = {
  s: new THREE.Vector3(0, 0, 1),
  n: new THREE.Vector3(0, 0, -1),
  e: new THREE.Vector3(1, 0, 0),
  w: new THREE.Vector3(-1, 0, 0),
};
// Blickrichtung (rotation.y), mit der man von außen auf eine Seite zuläuft
export const FACING = { s: Math.PI, n: 0, e: -Math.PI / 2, w: Math.PI / 2 };

function aabb(cx, y0, cz, hx, h, hz) {
  return { min: new THREE.Vector3(cx - hx, y0, cz - hz), max: new THREE.Vector3(cx + hx, y0 + h, cz + hz) };
}

let swirlTex = null;
function swirlTexture() {
  if (swirlTex) return swirlTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.4, '#cfe8ff');
  grad.addColorStop(1, '#6aa8ff');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = 'rgba(255,255,255,0.8)';
  g.lineWidth = 5;
  for (let k = 0; k < 4; k++) {
    g.beginPath();
    for (let i = 0; i < 60; i++) {
      const a = k * Math.PI / 2 + i * 0.09, r = i;
      const x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r;
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.stroke();
  }
  swirlTex = new THREE.CanvasTexture(c);
  swirlTex.colorSpace = THREE.SRGBColorSpace;
  swirlTex.userData.shared = true;
  return swirlTex;
}

function starGeometry() {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.42 : 1, a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r * 0.9, y = Math.sin(a) * r * 0.9;
    if (i) s.lineTo(x, y); else s.moveTo(x, y);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 1 });
  g.center();
  return g;
}

export class World {
  /**
   * @param {THREE.Scene} scene
   * @param {object} def Weltbeschreibung aus worlds.js
   * @param {string[]} collected bereits gefundene Sterne
   */
  constructor(scene, def, collected = [], ctx = {}) {
    this.scene = scene;
    this.def = def;
    this.id = def.id;
    this.name = def.name;
    this.isWorld = true;
    this.root = new THREE.Group();
    scene.add(this.root);
    this.solids = [];
    this.kills = [];
    this.coins = [];
    this.gates = [];
    this.chests = [];
    this.stars = [];
    this.portals = [];
    this.animals = [];
    this.rides = [];
    this.updaters = [];
    this.particles = [];
    this.finish = null;
    this.spawn = new THREE.Vector3();
    this.spawnYaw = 0;
    this.killY = -1.6;
    this.collected = new Set(collected);
    this.rng = seededRng(def.seed || 1);
    this.decoList = [];
    this.coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 20);
    this.coinMat = new THREE.MeshStandardMaterial({ color: '#ffc531', metalness: 0.6, roughness: 0.3, emissive: '#5a3c00' });
    this.starGeo = starGeometry();
    def.build(this, ctx);
    this.flushDeco();
  }

  r(a, b) { return a + this.rng() * (b - a); }
  pick(arr) { return arr[Math.floor(this.rng() * arr.length)]; }

  // ---------- Bausteine ----------

  // Fester Block mit Oberkante bei `top`
  block(x, top, z, w, h, d, color, o = {}) {
    const mat = o.mat || (o.plain ? new THREE.MeshLambertMaterial({ color }) : blockMat(color));
    const mesh = new THREE.Mesh(o.plain ? UNIT : blockGeometry(w, h, d), mat);
    if (o.plain) mesh.scale.set(w, h, d);
    mesh.position.set(x, top - h / 2, z);
    mesh.receiveShadow = true;
    mesh.castShadow = h > 1.2 && !o.noShadow;
    this.root.add(mesh);
    const c = { mesh, half: new THREE.Vector3(w / 2, h / 2, d / 2), min: new THREE.Vector3(), max: new THREE.Vector3(), safe: !!o.safe, ice: !!o.ice };
    c.min.copy(mesh.position).sub(c.half);
    c.max.copy(mesh.position).add(c.half);
    (o.kill ? this.kills : this.solids).push(c);
    return c;
  }

  updateBounds(c) {
    c.min.copy(c.mesh.position).sub(c.half);
    c.max.copy(c.mesh.position).add(c.half);
  }

  // Nicht-kollidierender Deko-Quader (Mitte bei x,y,z); alle werden zu einem InstancedMesh gebündelt
  box(w, h, d, color, x, y, z, ry = 0, rx = 0, rz = 0) {
    this.decoList.push({ w, h, d, color, x, y, z, ry, rx, rz });
  }

  flushDeco() {
    const n = this.decoList.length;
    if (!n) return;
    const mesh = new THREE.InstancedMesh(UNIT, new THREE.MeshLambertMaterial({ color: '#ffffff' }), n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
    this.decoList.forEach((b, i) => {
      e.set(b.rx, b.ry, b.rz, 'YXZ');
      q.setFromEuler(e);
      m.compose(p.set(b.x, b.y, b.z), q, s.set(b.w, b.h, b.d));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, col.set(b.color));
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    this.root.add(mesh);
    this.decoList = [];
  }

  add(obj) { this.root.add(obj); return obj; }

  sign(text, x, y, z, o = {}) {
    const s = textSprite(text, o);
    s.position.set(x, y, z);
    this.root.add(s);
    return s;
  }

  // Insel: Wiese auf Sand, alles darauf ist „sicherer Boden“ für die Rückkehr nach einem Sturz
  island(size, grass, sand) {
    this.block(0, 0, 0, size, 4, size, grass, { safe: true });
    this.block(0, -0.2, 0, size + 10, 4, size + 10, sand, { safe: true });
    this.size = size;
  }

  ground(x, z, w, d, color, top = 0, o = {}) {
    return this.block(x, top, z, w, Math.max(0.6, top + 2), d, color, { safe: true, ...o });
  }

  path(x1, z1, x2, z2, width, color) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    this.box(width, 0.06, len + width, color, (x1 + x2) / 2, 0.03, (z1 + z2) / 2, Math.atan2(x2 - x1, z2 - z1));
  }

  water(x, z, w, d, o = {}) {
    const top = o.top ?? 0.04;
    const mat = new THREE.MeshLambertMaterial({ color: o.color || '#3fa9f5', transparent: true, opacity: 0.85, emissive: o.emissive || '#0b3a66' });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, top, z);
    m.receiveShadow = true;
    this.root.add(m);
    if (o.deadly) this.kills.push({ ...aabb(x, -1, z, w / 2, top + 1 - 0.05, d / 2) });
    return m;
  }

  // ---------- Pflanzen & Deko ----------

  tree(kind, x, z, s = 1, y = 0, solid = true) {
    const B = (w, h, d, c, dx, dy, dz, ry = 0, rx = 0, rz = 0) => this.box(w * s, h * s, d * s, c, x + dx * s, y + dy * s, z + dz * s, ry, rx, rz);
    switch (kind) {
      case 'palm': {
        let px = 0;
        const lean = this.r(-0.4, 0.4);
        for (let i = 0; i < 6; i++) { B(0.55, 1.05, 0.55, i % 2 ? '#a07040' : '#8a5e33', px, 0.5 + i, 0); px += lean * 0.18; }
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          B(0.7, 0.14, 2.6, i % 2 ? '#3fae49' : '#2f9a3c', px + Math.sin(a) * 1.1, 6.2, Math.cos(a) * 1.1, a, 0.35);
        }
        B(0.35, 0.35, 0.35, '#6b4423', px + 0.3, 5.8, 0.2);
        B(0.35, 0.35, 0.35, '#6b4423', px - 0.25, 5.75, -0.25);
        break;
      }
      case 'pine':
        B(0.6, 2, 0.6, '#6b4423', 0, 1, 0);
        B(3.2, 1.4, 3.2, '#1f6b3a', 0, 2.4, 0);
        B(2.4, 1.3, 2.4, '#23784a', 0, 3.6, 0);
        B(1.5, 1.2, 1.5, '#2a8a55', 0, 4.7, 0);
        break;
      case 'birch':
        B(0.5, 4, 0.5, '#f2f0ea', 0, 2, 0);
        B(0.52, 0.15, 0.3, '#222', 0, 1.2, 0);
        B(0.52, 0.12, 0.3, '#222', 0, 2.6, 0.05);
        B(2.4, 2.2, 2.4, '#8fd16a', 0, 4.6, 0);
        B(1.6, 1, 1.6, '#a6e07f', 0, 6, 0);
        break;
      case 'blossom':
        B(0.6, 2.4, 0.6, '#7a4a2a', 0, 1.2, 0);
        B(3, 2, 3, '#ffb7d5', 0, 3.4, 0);
        B(2, 1, 2, '#ffd1e4', 0, 4.8, 0);
        break;
      default: // Laubbaum
        B(0.7, 2.6, 0.7, '#7a4a2a', 0, 1.3, 0);
        B(3.2, 2.4, 3.2, '#3e9d47', 0, 3.6, 0);
        B(2.2, 1.2, 2.2, '#4fb556', 0, 5.3, 0);
        break;
    }
    if (solid) this.solids.push(aabb(x, y, z, 0.35 * s, 3 * s, 0.35 * s));
  }

  flowers(cx, cz, w, d, n, colors) {
    for (let i = 0; i < n; i++) {
      const x = cx + this.r(-w / 2, w / 2), z = cz + this.r(-d / 2, d / 2);
      this.box(0.08, 0.4, 0.08, '#3c8c3c', x, 0.2, z);
      this.box(0.3, 0.2, 0.3, this.pick(colors), x, 0.48, z);
    }
  }

  bushes(cx, cz, w, d, n, color = '#3c9a46') {
    for (let i = 0; i < n; i++) {
      const s = this.r(0.6, 1.3);
      this.box(s * 1.4, s, s * 1.2, color, cx + this.r(-w / 2, w / 2), s / 2, cz + this.r(-d / 2, d / 2), this.r(0, 3));
    }
  }

  rock(x, z, s = 1, color = '#8d939b') {
    this.box(1.6 * s, 1 * s, 1.3 * s, color, x, 0.5 * s, z, this.r(0, 3));
    this.box(1 * s, 0.6 * s, 0.9 * s, '#a3a9b0', x + 0.3 * s, 1.1 * s, z - 0.1 * s, this.r(0, 3));
  }

  lamp(x, z) {
    this.box(0.25, 3.2, 0.25, '#2d3440', x, 1.6, z);
    this.box(0.6, 0.6, 0.6, '#fff4c2', x, 3.4, z);
    this.box(0.8, 0.15, 0.8, '#2d3440', x, 3.78, z);
  }

  // ---------- Spielobjekte ----------

  coin(x, y, z) {
    const mesh = new THREE.Mesh(this.coinGeo, this.coinMat);
    mesh.position.set(x, y + 1.1, z);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    this.root.add(mesh);
    this.coins.push({ mesh, taken: false, baseY: y + 1.1 });
  }

  coinRing(cx, y, cz, r, n) {
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; this.coin(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r); }
  }

  coinLine(x1, z1, x2, z2, n, y = 0) {
    for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); this.coin(x1 + (x2 - x1) * t, y, z1 + (z2 - z1) * t); }
  }

  // Stern auf einer Oberfläche (y = Höhe der Oberfläche)
  star(id, x, y, z, label) {
    const got = this.collected.has(id);
    const g = new THREE.Group();
    const mat = got
      ? new THREE.MeshLambertMaterial({ color: '#c9d2dc', transparent: true, opacity: 0.6 })
      : new THREE.MeshStandardMaterial({ color: '#ffd23f', emissive: '#a06a00', metalness: 0.5, roughness: 0.3 });
    const m = new THREE.Mesh(this.starGeo, mat);
    m.castShadow = true;
    g.add(m);
    let beam = null;
    if (!got) {
      beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 60, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: '#fff3a0', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
      beam.position.y = 30;
      g.add(beam);
    }
    g.position.set(x, y + 1.4, z);
    this.root.add(g);
    this.stars.push({ id, label, group: g, mesh: m, beam, got, pos: g.position });
  }

  animal(kind, o) {
    const a = makeAnimal(kind, o);
    this.root.add(a.g);
    this.animals.push(a);
    return a;
  }

  // Umzäunter Bereich mit Mathe-Tor. side = Seite mit dem Tor (n, s, e, w)
  enclosure({ x, z, w, d, side = 's', h = 4.4, color = '#8a5e33', label, y = 0, mat, cap }) {
    const t = 0.8, doorW = 2.6, doorH = 3.4;
    const wall = (cx, cz, ww, dd, hh = h, top = y + h) => this.block(cx, top, cz, ww, hh, dd, color, { mat });
    const n = SIDES[side];
    const alongX = side === 'n' || side === 's';
    for (const sd of ['n', 's', 'e', 'w']) {
      const nn = SIDES[sd];
      const cx = x + nn.x * w / 2, cz = z + nn.z * d / 2;
      const len = sd === 'n' || sd === 's' ? w + t : d + t;
      if (sd !== side) {
        if (sd === 'n' || sd === 's') wall(cx, cz, len, t); else wall(cx, cz, t, len);
        continue;
      }
      const seg = (len - doorW) / 2, off = doorW / 2 + seg / 2;
      if (alongX) {
        wall(cx - off, cz, seg, t); wall(cx + off, cz, seg, t);
        wall(cx, cz, doorW, t, h - doorH);
      } else {
        wall(cx, cz - off, t, seg); wall(cx, cz + off, t, seg);
        wall(cx, cz, t, doorW, h - doorH);
      }
    }
    if (cap) for (const sd of ['n', 's', 'e', 'w']) {
      // Zinnen/Abschluss oben auf der Mauer (nur Deko)
      const nn = SIDES[sd], len = sd === 'n' || sd === 's' ? w : d, cnt = Math.floor(len / 2);
      for (let i = 0; i <= cnt; i++) {
        const u = -len / 2 + (i / cnt) * len;
        const px = sd === 'n' || sd === 's' ? x + u : x + nn.x * w / 2, pz = sd === 'n' || sd === 's' ? z + nn.z * d / 2 : z + u;
        this.box(0.8, 0.7, 0.8, cap, px, y + h + 0.35, pz);
      }
    }
    const dc = new THREE.Vector3(x + n.x * w / 2, y, z + n.z * d / 2);
    return this.gateAt(dc, side, label, doorW, doorH);
  }

  // Tür in einer Wandöffnung bei `dc` (Mitte unten), die nach `side` zeigt
  gateAt(dc, side, label, doorW = 2.6, doorH = 3.4) {
    const n = SIDES[side];
    const alongX = side === 'n' || side === 's';
    const door = this.block(dc.x, dc.y + doorH, dc.z, alongX ? doorW : 0.5, doorH, alongX ? 0.5 : doorW, '#58a6ff');
    door.mesh.material = new THREE.MeshLambertMaterial({ color: '#58a6ff', emissive: '#1f5fbf', transparent: true, opacity: 0.75 });
    const q = textSprite('? = ?', { bg: '#2f7df6', size: 1.0 });
    q.scale.set(1.8, 0.9, 1);
    q.position.copy(dc).addScaledVector(n, 0.5).add(new THREE.Vector3(0, doorH / 2, 0));
    this.root.add(q);
    const sign = textSprite(label, { bg: '#ffc531', fg: '#17233b', size: 0.9 });
    sign.position.copy(dc).addScaledVector(n, 0.7).add(new THREE.Vector3(0, doorH + 1.6, 0));
    this.root.add(sign);
    const tc = dc.clone().addScaledVector(n, 0.25 + 0.7);
    const hx = alongX ? doorW / 2 + 0.3 : 0.7, hz = alongX ? 0.7 : doorW / 2 + 0.3;
    const g = {
      door, q, sign, label, open: false, index: this.gates.length,
      trigger: aabb(tc.x, dc.y, tc.z, hx, 3, hz),
      checkpoint: dc.clone().addScaledVector(n, -2.6),
      outside: dc.clone().addScaledVector(n, 2.8),
    };
    this.gates.push(g);
    return g;
  }

  // Portal (Torbogen mit Strudel). facing = Seite, von der man hineinläuft
  portal({ x, z, y = 0, facing = 's', label, color = '#7a5cff', target, sub }) {
    const n = SIDES[facing], alongX = facing === 'n' || facing === 's';
    const W = 3.6, H = 4.8;
    for (const s of [-1, 1]) {
      const px = alongX ? x + s * (W / 2 + 0.5) : x, pz = alongX ? z : z + s * (W / 2 + 0.5);
      this.block(px, y + H, pz, 1, H, 1, color);
    }
    this.block(x, y + H + 1, z, alongX ? W + 2 : 1, 1, alongX ? 1 : W + 2, color);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.8, 32), new THREE.MeshBasicMaterial({ map: swirlTexture(), transparent: true, opacity: 0.9, side: THREE.DoubleSide, color }));
    disc.scale.y = H / 3.6;
    disc.position.set(x, y + H / 2, z);
    disc.rotation.y = alongX ? 0 : Math.PI / 2;
    this.root.add(disc);
    const sign = textSprite(label, { bg: color, size: 1.1 });
    sign.position.set(x + n.x * 0.8, y + H + 2.6, z + n.z * 0.8);
    this.root.add(sign);
    let subSign = null;
    if (sub) {
      subSign = textSprite(sub, { bg: '#ffffff', fg: '#17233b', size: 0.75 });
      subSign.position.set(x + n.x * 0.8, y + H + 1.55, z + n.z * 0.8);
      this.root.add(subSign);
    }
    const p = {
      label, target, disc,
      trigger: aabb(x, y, z, alongX ? W / 2 : 0.6, H, alongX ? 0.6 : W / 2),
      outside: new THREE.Vector3(x + n.x * 3, y, z + n.z * 3),
      front: new THREE.Vector3(x + n.x * 12, y, z + n.z * 12),
      facing,
    };
    this.portals.push(p);
    return p;
  }

  // Einstiegsplatte eines Fahrgeschäfts
  station(x, z, label, color = '#ff595e', y = 0) {
    this.block(x, y + 0.3, z, 3.4, 0.3, 3.4, color);
    this.box(3.6, 0.1, 3.6, '#ffffff', x, y + 0.02, z);
    const s = textSprite(label, { bg: color, size: 0.9 });
    s.position.set(x, y + 3.2, z);
    this.root.add(s);
    const t = textSprite('Fahrkarte lösen', { bg: '#ffffff', fg: '#17233b', size: 0.6 });
    t.position.set(x, y + 2.3, z);
    this.root.add(t);
    return aabb(x, y, z, 1.7, 2, 1.7);
  }

  addRide(ride) {
    this.rides.push(ride);
    // Stern schwebt hoch über der Station – man bekommt ihn nur durch die Fahrt
    if (ride.starId) {
      const c = ride.station.min.clone().add(ride.station.max).multiplyScalar(0.5);
      this.star(ride.starId, c.x, ride.station.min.y + 5, c.z, this.def.stars?.[ride.starId] || ride.name);
    }
    return ride;
  }

  // ---------- Laufzeit ----------

  update(dt, time, ridingRide, rideT) {
    for (const s of this.solids) {
      if (s.moving) {
        const m = s.moving, prev = s.mesh.position.clone();
        s.mesh.position.copy(m.base);
        s.mesh.position[m.axis] += Math.sin(time * m.speed + m.phase) * m.amp;
        s.delta = s.mesh.position.clone().sub(prev);
        this.updateBounds(s);
      }
    }
    for (const a of this.animals) updateAnimal(a, dt, time);
    for (const c of this.coins) {
      if (c.taken) {
        if (c.mesh.visible) {
          c.mesh.position.y += dt * 6;
          c.mesh.scale.multiplyScalar(0.9);
          if (c.mesh.scale.x < 0.1) c.mesh.visible = false;
        }
        continue;
      }
      c.mesh.rotation.z += dt * 3;
      c.mesh.position.y = c.baseY + Math.sin(time * 2 + c.mesh.position.z) * 0.15;
    }
    for (const s of this.stars) {
      s.mesh.rotation.y += dt * 1.6;
      s.mesh.position.y = Math.sin(time * 2) * 0.2;
    }
    for (const p of this.portals) p.disc.rotation.z = -time * 1.5;
    for (const g of this.gates) {
      if (g.opening === undefined) continue;
      g.opening += dt;
      const k = Math.min(g.opening / 0.6, 1);
      g.door.mesh.scale.setScalar(1 - k);
      g.door.mesh.material.opacity = 0.75 * (1 - k);
      g.q.material.opacity = 1 - k;
      if (k >= 1) { g.door.mesh.visible = false; g.q.visible = false; delete g.opening; }
    }
    for (const r of this.rides) r.update(dt, time, r === ridingRide, rideT);
    for (const u of this.updaters) u(dt, time);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.userData.life -= dt;
      p.position.y += p.userData.v * dt;
      p.material.opacity = Math.min(1, p.userData.life);
      if (p.userData.life <= 0) { this.root.remove(p); p.material.map.dispose(); p.material.dispose(); this.particles.splice(i, 1); }
    }
  }

  openGate(g) {
    g.open = true;
    g.opening = 0;
    this.solids = this.solids.filter((s) => s !== g.door);
    g.sign.material.color.set('#8fff9f');
  }

  feedAnimal(a) {
    a.feed.fed = true;
    a.feed.bubble.visible = false;
    a.happy = 2;
    this.particles.push(...heartBurst(this.root, a.g.position));
  }

  collectStar(s) {
    s.got = true;
    this.collected.add(s.id);
    s.mesh.material = new THREE.MeshLambertMaterial({ color: '#c9d2dc', transparent: true, opacity: 0.6 });
    if (s.beam) s.beam.visible = false;
  }

  dispose() {
    this.scene.remove(this.root);
    disposeTree(this.root);
    this.coinGeo.dispose();
    this.starGeo.dispose();
  }
}

export { studTexture };
