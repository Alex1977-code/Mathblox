// Erzeugt ein Obby-Level aus Blöcken: Sprünge, Treppen, bewegte Plattformen,
// Lava-Steine, Mathe-Tore, Bonus-Truhen und das Ziel.
import * as THREE from '../vendor/three.module.min.js';
import { seededRng } from './math.js';

const COLORS = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff924c', '#52a675', '#4cc9f0', '#f15bb5'];

let studTex = null;
function studTexture() {
  if (studTex) return studTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(0,0,0,0.10)';
  g.lineWidth = 2;
  g.strokeRect(1, 1, 62, 62);
  const grad = g.createRadialGradient(28, 28, 2, 32, 32, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(0,0,0,0.12)');
  g.fillStyle = grad;
  g.beginPath(); g.arc(32, 32, 14, 0, Math.PI * 2); g.fill();
  studTex = new THREE.CanvasTexture(c);
  studTex.wrapS = studTex.wrapT = THREE.RepeatWrapping;
  studTex.colorSpace = THREE.SRGBColorSpace;
  studTex.anisotropy = 4;
  return studTex;
}

const matCache = new Map();
function blockMat(color) {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshLambertMaterial({ color, map: studTexture() }));
  return matCache.get(color);
}

// Box-Geometrie, deren UVs mit der Größe wachsen (eine Noppe pro Einheit)
function blockGeometry(w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const idx = f * 4 + i;
      uv.setXY(idx, uv.getX(idx) * dims[f][0], uv.getY(idx) * dims[f][1]);
    }
  }
  return geo;
}

function textSprite(text, { bg = '#2f7df6', fg = '#fff', size = 1.6 } = {}) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.beginPath();
  if (g.roundRect) g.roundRect(8, 8, 240, 112, 28); else g.rect(8, 8, 240, 112);
  g.fill();
  g.fillStyle = fg;
  g.font = '700 64px Fredoka, system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false }));
  s.scale.set(size * 2, size, 1);
  return s;
}

export class Level {
  /**
   * @param {THREE.Scene} scene
   * @param {number} number Levelnummer (ab 1) – bestimmt Layout und Hindernis-Schwierigkeit
   */
  constructor(scene, number) {
    this.scene = scene;
    this.number = number;
    this.root = new THREE.Group();
    scene.add(this.root);
    this.solids = [];   // {min, max, mesh, half, moving?}
    this.kills = [];
    this.coins = [];
    this.gates = [];
    this.chests = [];
    this.finish = null;
    this.spawn = new THREE.Vector3(0, 0, 0);
    this.rng = seededRng(number * 7919 + 13);
    this.colorIdx = Math.floor(this.rng() * COLORS.length);
    this.build();
  }

  r(a, b) { return a + this.rng() * (b - a); }
  nextColor() { this.colorIdx = (this.colorIdx + 1 + Math.floor(this.rng() * 2)) % COLORS.length; return COLORS[this.colorIdx]; }

  // Block mit Oberkante bei `top`
  block(x, top, z, w, h, d, color, list = this.solids) {
    const mesh = new THREE.Mesh(blockGeometry(w, h, d), blockMat(color));
    mesh.position.set(x, top - h / 2, z);
    mesh.receiveShadow = true;
    mesh.castShadow = h > 1.5;
    this.root.add(mesh);
    const half = new THREE.Vector3(w / 2, h / 2, d / 2);
    const c = { mesh, half, min: new THREE.Vector3(), max: new THREE.Vector3() };
    this.updateBounds(c);
    list.push(c);
    return c;
  }

  updateBounds(c) {
    c.min.copy(c.mesh.position).sub(c.half);
    c.max.copy(c.mesh.position).add(c.half);
  }

  coin(x, y, z) {
    const mesh = new THREE.Mesh(this.coinGeo, this.coinMat);
    mesh.position.set(x, y + 1.1, z);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    this.root.add(mesh);
    this.coins.push({ mesh, taken: false, baseY: y + 1.1 });
  }

  build() {
    const lv = this.number;
    this.coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 20);
    this.coinMat = new THREE.MeshStandardMaterial({ color: '#ffc531', metalness: 0.6, roughness: 0.3, emissive: '#5a3c00' });

    // Start-Insel
    this.block(0, 0, 0, 10, 2, 10, '#9aa5b1');
    this.block(0, -2, 0, 8, 3, 8, '#7a4a1d');
    const startSign = textSprite(`Level ${lv}`, { bg: '#2fbf4a', size: 1.4 });
    startSign.position.set(0, 4.2, -4.5);
    this.root.add(startSign);
    this.cursor = new THREE.Vector3(0, 0, -5);

    const gateCount = Math.min(3 + Math.floor((lv - 1) / 2), 6);
    const pool = ['jumps', 'stairs'];
    if (lv >= 2) pool.push('movingX');
    if (lv >= 3) pool.push('lava');
    if (lv >= 4) pool.push('movingZ', 'narrow');
    if (lv >= 6) pool.push('vanish');
    this.gapMin = 1.6 + Math.min(lv, 10) * 0.08;
    this.gapMax = 2.4 + Math.min(lv, 10) * 0.14;

    for (let g = 0; g < gateCount; g++) {
      const segs = 1 + (lv >= 3 && this.rng() < 0.6 ? 1 : 0);
      for (let s = 0; s < segs; s++) this.segment(pool[Math.floor(this.rng() * pool.length)]);
      this.gate(g, gateCount, g % 2 === 1 || (lv === 1 && g === 1));
    }
    this.segment(pool[Math.floor(this.rng() * pool.length)]);
    this.buildFinish();
    this.decorate();
  }

  segment(type) {
    const c = this.cursor;
    const R = (a, b) => this.r(a, b);
    const clampX = (x) => Math.max(-7, Math.min(7, x));
    switch (type) {
      case 'jumps': {
        const n = 3 + Math.floor(this.rng() * 3);
        for (let i = 0; i < n; i++) {
          const size = R(2.4, 3.6), gap = R(this.gapMin, this.gapMax);
          const dy = R(-0.6, 0.9), x = clampX(c.x + R(-2, 2));
          const z = c.z - gap - size / 2;
          c.set(x, c.y + dy, z);
          this.block(x, c.y, z, size, 1, size, this.nextColor());
          if (this.rng() < 0.5) this.coin(x, c.y, z);
          c.z = z - size / 2;
        }
        break;
      }
      case 'stairs': {
        const n = 4 + Math.floor(this.rng() * 3), dir = this.rng() < 0.5 ? -1 : 1;
        const col = this.nextColor();
        c.z -= 1.2;
        for (let i = 0; i < n; i++) {
          const up = i < n / 2 + 1 ? 1.1 : -0.8;
          c.y += up;
          c.x = clampX(c.x + dir * 0.8);
          const z = c.z - 1.6;
          this.block(c.x, c.y, z, 3, 1 + Math.max(0, up), 2.2, col);
          if (i === n - 1) this.coin(c.x, c.y, z);
          c.z = z - 1.1 - (i % 2 ? 0.8 : 0.4);
        }
        break;
      }
      case 'movingX': {
        const z = c.z - 3.5, amp = R(2.5, 4), speed = R(0.6, 1.1) + this.number * 0.03;
        const p = this.block(c.x, c.y, z, 3.2, 0.8, 3.2, '#ffffff');
        p.mesh.material = new THREE.MeshLambertMaterial({ color: '#4cc9f0', map: studTexture(), emissive: '#0a3550' });
        p.moving = { axis: 'x', base: p.mesh.position.clone(), amp, speed, phase: R(0, 6) };
        this.coin(c.x, c.y, z);
        c.z = z - 1.6 - R(2, 2.8);
        this.landing();
        break;
      }
      case 'movingZ': {
        const span = R(9, 12), z0 = c.z - 2.2, z1 = c.z - span + 2.2;
        const p = this.block(c.x, c.y, z0, 3.2, 0.8, 3.2, '#ffffff');
        p.mesh.material = new THREE.MeshLambertMaterial({ color: '#4cc9f0', map: studTexture(), emissive: '#0a3550' });
        p.moving = { axis: 'z', base: new THREE.Vector3(c.x, p.mesh.position.y, (z0 + z1) / 2), amp: (z0 - z1) / 2, speed: R(0.5, 0.8), phase: Math.PI / 2 };
        p.mesh.position.z = (z0 + z1) / 2 + (z0 - z1) / 2;
        this.updateBounds(p);
        c.z -= span;
        this.landing();
        break;
      }
      case 'lava': {
        const len = R(12, 16), w = 5;
        const z = c.z - 1.5 - len / 2;
        this.block(c.x, c.y, z, w, 1, len, '#9aa5b1');
        const strips = 3 + Math.floor(this.rng() * 2);
        for (let i = 0; i < strips; i++) {
          const sz = z + len / 2 - (i + 1) * (len / (strips + 1));
          const full = this.rng() < 0.45;
          const sw = full ? w : w * 0.6, sx = full ? c.x : c.x + (i % 2 ? 1 : -1) * (w - sw) / 2;
          const k = this.block(sx, c.y + (full ? 0.35 : 1.4), sz, sw, full ? 0.35 : 1.4, full ? 0.9 : 1.2, '#ff2a2a', this.kills);
          k.mesh.material = new THREE.MeshLambertMaterial({ color: '#ff3b1f', emissive: '#c01800' });
        }
        this.coin(c.x, c.y, z);
        c.z = z - len / 2;
        break;
      }
      case 'narrow': {
        const len = R(9, 13), z = c.z - 1.4 - len / 2;
        this.block(c.x, c.y, z, 1.1, 1, len, this.nextColor());
        this.coin(c.x, c.y, z - len / 4);
        this.coin(c.x, c.y, z + len / 4);
        c.z = z - len / 2;
        this.landing();
        break;
      }
      case 'vanish': {
        // Plattformen, die verschwinden, kurz nachdem man draufsteht
        const n = 3 + Math.floor(this.rng() * 2);
        for (let i = 0; i < n; i++) {
          const gap = R(this.gapMin, this.gapMax - 0.3), z = c.z - gap - 1.5;
          c.x = clampX(c.x + R(-1.5, 1.5));
          const p = this.block(c.x, c.y, z, 3, 0.6, 3, '#ffffff');
          p.mesh.material = new THREE.MeshLambertMaterial({ color: '#c9f2ff', transparent: true, opacity: 0.85 });
          p.vanish = { timer: -1 };
          c.z = z - 1.5;
        }
        this.landing();
        break;
      }
      default:
        break;
    }
  }

  // Kleine sichere Plattform nach einem schwierigen Abschnitt
  landing() {
    const c = this.cursor;
    const z = c.z - 2;
    this.block(c.x, c.y, z, 4, 1, 4, this.nextColor());
    c.z = z - 2;
  }

  gate(index, total, withChest) {
    const c = this.cursor;
    const depth = 10, w = 10;
    const gap = 2;
    const zc = c.z - gap - depth / 2;
    const x = Math.max(-5, Math.min(5, c.x));
    this.block(x, c.y, zc, w, 1.5, depth, '#9aa5b1');
    // Torwand mit Durchgang
    const wallH = 7, doorW = 2.6, doorH = 3.4, wallW = w + 8;
    const side = (wallW - doorW) / 2;
    const wallCol = '#3d4a5c';
    this.block(x - doorW / 2 - side / 2, c.y + wallH, zc, side, wallH, 0.8, wallCol);
    this.block(x + doorW / 2 + side / 2, c.y + wallH, zc, side, wallH, 0.8, wallCol);
    this.block(x, c.y + wallH, zc, doorW, wallH - doorH, 0.8, wallCol);
    // Tür: leuchtender Block, solide bis die Aufgabe gelöst ist
    const doorMat = new THREE.MeshLambertMaterial({ color: '#58a6ff', emissive: '#1f5fbf', transparent: true, opacity: 0.75 });
    const door = this.block(x, c.y + doorH, zc, doorW, doorH, 0.5, '#58a6ff');
    door.mesh.material = doorMat;
    const sign = textSprite(`${index + 1} / ${total}`, { bg: '#ffc531', fg: '#17233b', size: 1.1 });
    sign.position.set(x, c.y + doorH + 1.3, zc + 0.6);
    this.root.add(sign);
    const q = textSprite('? = ?', { bg: '#2f7df6', size: 1.0 });
    q.position.set(x, c.y + doorH / 2, zc + 0.5);
    q.scale.set(1.8, 0.9, 1);
    this.root.add(q);
    this.gates.push({
      door, sign, q,
      open: false,
      // Auslösebereich direkt vor der Tür
      trigger: { min: new THREE.Vector3(x - doorW / 2 - 0.3, c.y, zc + 0.25), max: new THREE.Vector3(x + doorW / 2 + 0.3, c.y + 3, zc + 1.6) },
      checkpoint: new THREE.Vector3(x, c.y, zc - 2.6),
      index,
    });
    for (const dx of [-3, 3]) this.coin(x + dx, c.y, zc + 3);

    if (withChest) {
      const cx = x + (this.rng() < 0.5 ? -3.5 : 3.5), cz = zc - 3;
      const chest = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1), new THREE.MeshLambertMaterial({ color: '#a0522d' }));
      body.position.y = 0.45;
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.35, 1.05), new THREE.MeshLambertMaterial({ color: '#ffc531', emissive: '#4a3000' }));
      lid.position.y = 1.05;
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.1), new THREE.MeshLambertMaterial({ color: '#ffe680' }));
      lock.position.set(0, 0.8, 0.53);
      chest.add(body, lid, lock);
      chest.traverse((o) => { o.castShadow = true; });
      chest.position.set(cx, c.y, cz);
      chest.rotation.y = cx > x ? -0.4 : 0.4;
      this.root.add(chest);
      const star = textSprite('Bonus', { bg: '#ffc531', fg: '#17233b', size: 0.8 });
      star.position.set(cx, c.y + 2.1, cz);
      this.root.add(star);
      this.chests.push({ group: chest, lid, label: star, pos: new THREE.Vector3(cx, c.y, cz), state: 'closed' });
    }
    c.set(x, c.y, zc - depth / 2);
  }

  buildFinish() {
    const c = this.cursor;
    const z = c.z - 2.5 - 5;
    this.block(c.x, c.y, z, 10, 1.5, 10, '#ffc531');
    const gold = new THREE.MeshStandardMaterial({ color: '#ffc531', metalness: 0.8, roughness: 0.25, emissive: '#3a2a00' });
    const trophy = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.4), new THREE.MeshLambertMaterial({ color: '#3d4a5c' }));
    base.position.y = 0.25;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 0.9, 12), gold);
    stem.position.y = 0.95;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.35, 1.1, 20), gold);
    cup.position.y = 1.95;
    trophy.add(base, stem, cup);
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 8, 16, Math.PI), gold);
      h.position.set(0.8 * s, 2.0, 0);
      h.rotation.z = -Math.PI / 2 * s;
      trophy.add(h);
    }
    trophy.traverse((o) => { o.castShadow = true; });
    trophy.position.set(c.x, c.y, z - 1);
    this.root.add(trophy);
    // Zielbogen
    for (const s of [-1, 1]) this.block(c.x + 4.4 * s, c.y + 6, z + 3.5, 0.8, 6, 0.8, '#ffffff');
    const banner = textSprite('ZIEL', { bg: '#ef3e3e', size: 1.8 });
    banner.position.set(c.x, c.y + 6.4, z + 3.5);
    this.root.add(banner);
    this.finish = { trophy, min: new THREE.Vector3(c.x - 5, c.y, z - 5), max: new THREE.Vector3(c.x + 5, c.y + 4, z + 2.5) };
    this.endZ = z;
  }

  decorate() {
    // Wolken und schwebende Inseln für Tiefenwirkung
    const cloudMat = new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 });
    const count = 14 + Math.floor(-this.endZ / 15);
    for (let i = 0; i < count; i++) {
      const cl = new THREE.Group();
      const parts = 3 + Math.floor(this.rng() * 3);
      for (let p = 0; p < parts; p++) {
        const s = this.r(2, 4);
        const m = new THREE.Mesh(new THREE.BoxGeometry(s * 1.6, s * 0.7, s), cloudMat);
        m.position.set(p * 2 - parts, this.r(-0.5, 0.5), this.r(-1, 1));
        cl.add(m);
      }
      const side = this.rng() < 0.5 ? -1 : 1;
      cl.position.set(side * this.r(18, 45), this.r(-6, 22), this.r(this.endZ - 20, 20));
      this.root.add(cl);
    }
    for (let i = 0; i < 8; i++) {
      const side = this.rng() < 0.5 ? -1 : 1;
      const s = this.r(4, 9);
      const x = side * this.r(22, 40), z = this.r(this.endZ, 0), y = this.r(-12, 2);
      const top = new THREE.Mesh(blockGeometry(s, 1.2, s), blockMat('#52a675'));
      top.position.set(x, y, z);
      const bottom = new THREE.Mesh(new THREE.ConeGeometry(s * 0.6, s, 4), new THREE.MeshLambertMaterial({ color: '#7a4a1d' }));
      bottom.position.set(x, y - 0.6 - s / 2, z);
      bottom.rotation.set(Math.PI, Math.PI / 4, 0);
      this.root.add(top, bottom);
    }
  }

  update(dt, time) {
    for (const s of this.solids) {
      if (s.moving) {
        const m = s.moving;
        const prev = s.mesh.position.clone();
        const off = Math.sin(time * m.speed + m.phase) * m.amp;
        s.mesh.position.copy(m.base);
        s.mesh.position[m.axis] += off;
        s.delta = s.mesh.position.clone().sub(prev);
        this.updateBounds(s);
      }
      if (s.vanish && s.vanish.timer >= 0) {
        s.vanish.timer += dt;
        const t = s.vanish.timer;
        if (t < 0.9) {
          s.mesh.position.x += Math.sin(t * 60) * 0.02;
          s.mesh.material.opacity = 0.85 - t * 0.5;
        } else if (!s.gone) {
          s.gone = true;
          s.mesh.visible = false;
        }
        if (t > 3.5) { s.gone = false; s.mesh.visible = true; s.vanish.timer = -1; s.mesh.material.opacity = 0.85; }
      }
    }
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
    for (const g of this.gates) {
      if (g.opening !== undefined) {
        g.opening += dt;
        const k = Math.min(g.opening / 0.6, 1);
        g.door.mesh.scale.set(1 - k, 1 - k, 1 - k);
        g.door.mesh.material.opacity = 0.75 * (1 - k);
        g.q.material.opacity = 1 - k;
        if (k >= 1) { g.door.mesh.visible = false; g.q.visible = false; delete g.opening; }
      }
    }
    for (const ch of this.chests) {
      if (ch.state === 'open' && ch.lid.rotation.x > -1.6) {
        ch.lid.rotation.x -= dt * 4;
        ch.lid.position.z = -0.3;
      }
    }
    if (this.finish) this.finish.trophy.rotation.y += dt;
  }

  // Tür öffnen: Kollider entfernen und Animation starten
  openGate(g) {
    g.open = true;
    g.opening = 0;
    this.solids = this.solids.filter((s) => s !== g.door);
    g.sign.material.color.set('#8fff9f');
  }

  dispose() {
    this.scene.remove(this.root);
    const shared = new Set(matCache.values());
    this.root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const m = o.material;
      if (!m || Array.isArray(m) || shared.has(m)) return;
      if (m.map && m.map !== studTex) m.map.dispose();
      m.dispose();
    });
  }
}
