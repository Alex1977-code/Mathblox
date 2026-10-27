// Gemeinsame Bau-Helfer für die Kontinent-Welten Afrika, Asien, Europa und Antarktis.
// Ziel: viel Inhalt bei wenigen Draw-Calls (Deko und feste Teile laufen über gebündelte Quader).
import * as THREE from '../../vendor/three.module.min.js';
import { blockGeometry, studTexture } from '../blocks.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- Mathe-Helfer fürs Gelände ----------
export const smooth = (t) => t * t * (3 - 2 * t);
export const clamp01 = (t) => Math.min(1, Math.max(0, t));
// „Abgerundetes Quadrat“: Abstand zur Mitte, an dem die Insel endet (~57 Land, ~62 Strand)
export const edgeDist = (x, z) => Math.pow(Math.pow(Math.abs(x) / 60, 4) + Math.pow(Math.abs(z) / 60, 4), 0.25) * 60;
export const rectDist = (x, z, [x1, z1, x2, z2]) => Math.hypot(Math.max(x1 - x, 0, x - x2), Math.max(z1 - z, 0, z - z2));
export function segDist(x, z, [ax, az], [bx, bz]) {
  const dx = bx - ax, dz = bz - az, t = clamp01(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz));
  return Math.hypot(x - ax - dx * t, z - az - dz * t);
}
export function hash(x, z) { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); }

// Unsichtbarer Kollisionsquader mit Oberkante `top`
export function collider(w, x, top, z, sx, sy, sz, o = {}) {
  const c = { min: V(x - sx / 2, top - sy, z - sz / 2), max: V(x + sx / 2, top, z + sz / 2), safe: !!o.safe, ice: !!o.ice };
  (o.kill ? w.kills : w.solids).push(c);
  return c;
}

// Fester Quader ohne eigenen Draw-Call (Aussehen über w.box)
export function solidBox(w, x, top, z, sx, sy, sz, color, o = {}) {
  w.box(sx, sy, sz, color, x, top - sy / 2, z);
  return collider(w, x, top, z, sx, sy, sz, o);
}

/**
 * Noppen-Blöcke gebündelt: ein InstancedMesh je Blockgröße (gleiche Optik wie w.block).
 * add(x, top, z, sx, sy, sz, color, {safe, ice, opacity}) · flush() am Ende von build aufrufen.
 */
export function studBlocks(w) {
  const groups = new Map();
  return {
    add(x, top, z, sx, sy, sz, color, o = {}) {
      const key = `${sx}|${sy}|${sz}|${o.opacity || 1}`;
      if (!groups.has(key)) groups.set(key, { sx, sy, sz, opacity: o.opacity, list: [] });
      groups.get(key).list.push({ x, y: top - sy / 2, z, color });
      return collider(w, x, top, z, sx, sy, sz, o);
    },
    flush() {
      const m = new THREE.Matrix4(), col = new THREE.Color();
      for (const g of groups.values()) {
        const mat = new THREE.MeshLambertMaterial({ color: '#ffffff', map: studTexture(), transparent: !!g.opacity, opacity: g.opacity || 1 });
        const mesh = new THREE.InstancedMesh(blockGeometry(g.sx, g.sy, g.sz), mat, g.list.length);
        g.list.forEach((b, i) => {
          mesh.setMatrixAt(i, m.makeTranslation(b.x, b.y, b.z));
          mesh.setColorAt(i, col.set(b.color));
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.computeBoundingSphere();
        w.add(mesh);
      }
      groups.clear();
    },
  };
}

// Weg auf dem Gelände: kurze Stücke, die der Geländehöhe folgen
export function groundPath(w, pts, width, color) {
  for (let k = 1; k < pts.length; k++) {
    const [x1, z1] = pts[k - 1], [x2, z2] = pts[k];
    const len = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.ceil(len / 1.6)), ry = Math.atan2(x2 - x1, z2 - z1);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t;
      w.box(width, 0.08, len / n + 0.25, color, x, w.heightAt(x, z) + 0.04, z, ry);
    }
  }
}

// Blumen, Grasbüschel und Steine auf dem Gelände
export function groundFlowers(w, cx, cz, sw, sd, n, colors, stem = '#3c8c3c') {
  for (let i = 0; i < n; i++) {
    const x = cx + w.r(-sw / 2, sw / 2), z = cz + w.r(-sd / 2, sd / 2), y = w.heightAt(x, z);
    w.box(0.08, 0.4, 0.08, stem, x, y + 0.2, z);
    w.box(0.3, 0.22, 0.3, w.pick(colors), x, y + 0.48, z);
  }
}
export function tufts(w, cx, cz, sw, sd, n, colors, hMin = 0.4, hMax = 0.9, avoid) {
  for (let i = 0; i < n; i++) {
    const x = cx + w.r(-sw / 2, sw / 2), z = cz + w.r(-sd / 2, sd / 2);
    if (avoid && avoid(x, z)) continue;
    const h = w.r(hMin, hMax), y = w.heightAt(x, z), c = w.pick(colors);
    w.box(0.14, h, 0.14, c, x, y + h / 2, z, w.r(0, 3), 0.2);
    w.box(0.14, h * 0.8, 0.14, c, x + 0.15, y + h * 0.4, z + 0.1, w.r(0, 3), -0.3);
  }
}
export function stone(w, x, z, s, color = '#9a8f80', y = w.heightAt(x, z)) {
  w.box(1.6 * s, 1 * s, 1.3 * s, color, x, y + 0.45 * s, z, w.r(0, 3));
  w.box(1 * s, 0.6 * s, 0.9 * s, color, x + 0.3 * s, y + 1.05 * s, z - 0.1 * s, w.r(0, 3));
}

// Münzen auf dem Gelände
export function coinsAt(w, list) { for (const [x, z, y] of list) w.coin(x, y ?? w.heightAt(x, z), z); }
export function coinTrail(w, x1, z1, x2, z2, n) {
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); const x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t; w.coin(x, w.heightAt(x, z), z); }
}

// Einfaches Haus aus gebündelten Quadern: fester Körper, Fenster, Tür, Sattel- oder Flachdach
export function cheapHouse(w, x, z, sx, sz, h, o = {}) {
  const y = o.y ?? w.heightAt(x, z);
  const wall = o.wall || '#f4efe6', win = o.window || '#7cc4ff', side = o.door || 's';
  solidBox(w, x, y + h, z, sx, h, sz, wall, { safe: true });
  const floors = Math.max(1, Math.floor(h / 2.8));
  for (let f = 0; f < floors; f++) {
    const wy = y + 1.6 + f * 2.8;
    for (const [nx, nz, len] of [[0, 1, sx], [0, -1, sx], [1, 0, sz], [-1, 0, sz]]) {
      const cnt = Math.max(1, Math.floor(len / 2.2));
      for (let k = 0; k < cnt; k++) {
        const u = -len / 2 + (k + 0.5) * (len / cnt);
        const isDoor = f === 0 && k === Math.floor(cnt / 2) && ((side === 's' && nz === 1) || (side === 'n' && nz === -1) || (side === 'e' && nx === 1) || (side === 'w' && nx === -1));
        const px = nz ? x + u : x + nx * (sx / 2 + 0.03), pz = nz ? z + nz * (sz / 2 + 0.03) : z + u;
        if (isDoor) { w.box(nz ? 1.1 : 0.07, 2, nz ? 0.07 : 1.1, o.doorColor || '#6b4423', px, y + 1, pz); continue; }
        w.box(nz ? 0.8 : 0.06, 1.0, nz ? 0.06 : 0.8, win, px, wy, pz);
        if (o.shutters) for (const s of [-1, 1]) w.box(nz ? 0.32 : 0.08, 1.05, nz ? 0.08 : 0.32, o.shutters, px + (nz ? s * 0.56 : 0), wy, pz + (nz ? 0 : s * 0.56));
        if (o.sill) w.box(nz ? 1.0 : 0.2, 0.12, nz ? 0.2 : 1.0, o.sill, px, wy - 0.56, pz);
      }
    }
  }
  if (o.timber) {
    // Fachwerk: Balken an den Kanten und zwischen den Stockwerken
    for (const [nx, nz, len] of [[0, 1, sx], [0, -1, sx], [1, 0, sz], [-1, 0, sz]]) {
      const px = x + nx * (sx / 2 + 0.05), pz = z + nz * (sz / 2 + 0.05);
      for (let f = 0; f <= floors; f++) w.box(nz ? len : 0.12, 0.22, nz ? 0.12 : len, o.timber, px, y + Math.min(h - 0.11, f * 2.8 + 0.11), pz);
      for (const u of [-len / 2 + 0.1, len / 2 - 0.1, 0]) w.box(nz ? 0.22 : 0.12, h, nz ? 0.12 : 0.22, o.timber, px + (nz ? u : 0), y + h / 2, pz + (nz ? 0 : u));
      for (let f = 0; f < floors; f++) for (const s of [-1, 1]) {
        const u = s * len / 4;
        w.box(nz ? 0.16 : 0.12, 3.1, nz ? 0.12 : 0.16, o.timber, px + (nz ? u : 0), y + f * 2.8 + 1.4, pz + (nz ? 0 : u), 0, nz ? 0 : s * 0.75, nz ? s * 0.75 : 0);
      }
    }
  }
  if (o.roof === 'gable') {
    const rc = o.roofColor || '#c0392b', along = sx >= sz;
    const span = along ? sz : sx, len = (along ? sx : sz) + 0.6, rh = span * (o.pitch || 0.4);
    const slope = Math.atan2(rh, span / 2), sl = Math.hypot(rh, span / 2) + 0.35;
    for (const s of [-1, 1]) {
      if (along) w.box(len, 0.25, sl, rc, x, y + h + rh / 2, z + s * span / 4, 0, s * slope);
      else w.box(sl, 0.25, len, rc, x + s * span / 4, y + h + rh / 2, z, 0, 0, -s * slope);
    }
    // Giebeldreieck schließen
    for (let i = 0; i < 4; i++) {
      const t = (i + 0.5) / 4, gw = span * (1 - t) * 0.98, gy = y + h + rh * t - rh / 8;
      if (along) for (const s of [-1, 1]) w.box(0.1, rh / 4, gw, wall, x + s * (sx / 2 - 0.05), gy, z);
      else for (const s of [-1, 1]) w.box(gw, rh / 4, 0.1, wall, x, gy, z + s * (sz / 2 - 0.05));
    }
    if (o.chimney) w.box(0.7, rh + 1, 0.7, o.chimney, x + (along ? sx / 4 : span / 5), y + h + rh / 2 + 0.3, z + (along ? span / 5 : sz / 4));
  } else if (o.roof !== 'none') {
    w.box(sx + 0.3, 0.3, sz + 0.3, o.roofColor || '#d9d2c3', x, y + h + 0.15, z);
  }
  return y + h;
}

/**
 * Fasst die unbeweglichen Würfel-Teile eines Modells (Tier, Fahrzeug) je Knoten zu einem Mesh mit
 * Vertex-Farben zusammen. Bewegliche Teile (Beine, Flügel, Kopf …) sind eigene Gruppen und bleiben erhalten.
 * keep: Meshes, die einzeln bleiben sollen (z. B. drehende Räder).
 */
let vcMat = null;
export function compact(root, keep = []) {
  if (!vcMat) { vcMat = new THREE.MeshLambertMaterial({ vertexColors: true }); vcMat.userData.shared = true; }
  const skip = new Set(keep);
  const nodes = [];
  root.traverse((o) => nodes.push(o));
  for (const node of nodes) {
    const meshes = node.children.filter((c) => c.isMesh && !c.isInstancedMesh && !c.children.length && !skip.has(c) && !c.material.transparent && c.material.color);
    if (meshes.length < 2) continue;
    const pos = [], nor = [], col = [];
    for (const m of meshes) {
      m.updateMatrix();
      const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrix);
      const p = g.attributes.position.array, n = g.attributes.normal.array, c = m.material.color;
      for (let i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); }
      for (let i = 0; i < p.length / 3; i++) col.push(c.r, c.g, c.b);
      g.dispose();
      node.remove(m);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    const mm = new THREE.Mesh(geo, vcMat);
    mm.castShadow = true;
    mm.receiveShadow = true;
    node.add(mm);
  }
  return root;
}

// Tier erzeugen und gleich zusammenfassen (spart Draw-Calls)
export function beast(w, kind, o) {
  const a = w.animal(kind, o);
  compact(a.g);
  return a;
}

// Stufen-Berg aus gedrehten Quadern (fern im Hintergrund). tiers: [[radius, höhe, farbe], …] von unten nach oben
export function stepMountain(w, cx, cz, tiers, base = -2) {
  let y = base;
  for (const [r, h, c] of tiers) {
    for (const a of [0, Math.PI / 6, Math.PI / 3]) w.box(r * 1.9, h, r * 1.9, c, cx, y + h / 2, cz, a);
    y += h;
  }
  return y;
}

export function group() { return new THREE.Group(); }
export { V };
