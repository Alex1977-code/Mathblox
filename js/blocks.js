// Gemeinsame Bausteine für Parkour-Level und offene Welten: Noppen-Blöcke, Schilder, Materialien.
import * as THREE from '../vendor/three.module.min.js';

let studTex = null;
export function studTexture() {
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
export function blockMat(color) {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshLambertMaterial({ color, map: studTexture() }));
  return matCache.get(color);
}

const plainCache = new Map();
// Einfarbiges Material ohne Noppen (für Tiere, Deko) – geteilt, daher beim Aufräumen nicht freigeben
export function plainMat(color, emissive) {
  const key = `${color}|${emissive || ''}`;
  if (!plainCache.has(key)) plainCache.set(key, new THREE.MeshLambertMaterial({ color, emissive: emissive || '#000000' }));
  return plainCache.get(key);
}

export function isSharedMaterial(m) {
  return m.userData.shared || [...matCache.values()].includes(m) || [...plainCache.values()].includes(m);
}
export function isSharedTexture(t) { return t === studTex || t?.userData?.shared; }

// Box-Geometrie, deren UVs mit der Größe wachsen (eine Noppe pro Einheit)
export function blockGeometry(w, h, d) {
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

// Schild als Sprite; die Breite passt sich dem Text an
export function textSprite(text, { bg = '#2f7df6', fg = '#fff', size = 1.6 } = {}) {
  const c = document.createElement('canvas');
  const g0 = c.getContext('2d');
  g0.font = '700 64px Fredoka, system-ui, sans-serif';
  const w = Math.max(256, Math.ceil(g0.measureText(text).width + 72));
  c.width = w; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.beginPath();
  if (g.roundRect) g.roundRect(8, 8, w - 16, 112, 28); else g.rect(8, 8, w - 16, 112);
  g.fill();
  g.fillStyle = fg;
  g.font = '700 64px Fredoka, system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false }));
  s.scale.set(size * (w / 128), size, 1);
  return s;
}

export function disposeTree(root) {
  root.traverse((o) => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      if (isSharedMaterial(m)) continue;
      if (m.map && !isSharedTexture(m.map)) m.map.dispose();
      m.dispose();
    }
  });
}
