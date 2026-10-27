// Klötzchen-Tiere mit einfacher Bewegung. Alle Modelle schauen in +z-Richtung, Füße bei y = 0.
import * as THREE from '../vendor/three.module.min.js';
import { plainMat, textSprite } from './blocks.js';

const geoCache = new Map();
function boxGeo(w, h, d) {
  const k = `${w}|${h}|${d}`;
  if (!geoCache.has(k)) { const g = new THREE.BoxGeometry(w, h, d); g.userData.shared = true; geoCache.set(k, g); }
  return geoCache.get(k);
}

function bx(parent, w, h, d, color, x, y, z, emissive) {
  const m = new THREE.Mesh(boxGeo(w, h, d), plainMat(color, emissive));
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

// Drehpunkt-Gruppe für Beine/Flügel
function pivot(parent, x, y, z) {
  const p = new THREE.Group();
  p.position.set(x, y, z);
  parent.add(p);
  return p;
}

function legs4(g, color, w, h, spreadX, spreadZ, y) {
  const out = [];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const p = pivot(g, sx * spreadX, y, sz * spreadZ);
    bx(p, w, h, w, color, 0, -h / 2, 0);
    out.push(p);
  }
  return out;
}

const BUILDERS = {
  parrot(opts) {
    const g = new THREE.Group();
    const [c1, c2, c3] = opts.colors || ['#e8262b', '#ffd23f', '#1f7de0'];
    const body = new THREE.Group();
    body.position.y = 0.5;
    g.add(body);
    bx(body, 0.4, 0.5, 0.45, c1, 0, 0, 0);
    bx(body, 0.34, 0.34, 0.36, c1, 0, 0.36, 0.12);
    bx(body, 0.14, 0.18, 0.18, '#f0e6c8', 0, 0.32, 0.36);
    bx(body, 0.1, 0.12, 0.1, '#222', 0, 0.26, 0.46);
    bx(body, 0.06, 0.06, 0.02, '#111', 0.15, 0.42, 0.26);
    bx(body, 0.06, 0.06, 0.02, '#111', -0.15, 0.42, 0.26);
    bx(body, 0.26, 0.12, 0.7, c3, 0, -0.18, -0.5).rotation.x = -0.4;
    const wings = [];
    for (const s of [-1, 1]) {
      const p = pivot(body, 0.2 * s, 0.12, 0);
      bx(p, 0.6, 0.06, 0.4, c2, 0.3 * s, 0, 0);
      bx(p, 0.3, 0.05, 0.36, c3, 0.68 * s, 0, -0.02);
      wings.push(p);
    }
    return { g, wings, body };
  },
  flamingo() {
    const g = new THREE.Group();
    const pink = '#ff7eb3';
    const body = new THREE.Group();
    body.position.y = 1.5;
    g.add(body);
    bx(body, 0.55, 0.45, 0.8, pink, 0, 0, 0);
    bx(body, 0.4, 0.15, 0.3, '#e0558f', 0, 0.12, -0.45);
    bx(body, 0.12, 0.9, 0.12, pink, 0, 0.6, 0.35);
    bx(body, 0.22, 0.22, 0.3, pink, 0, 1.1, 0.42);
    bx(body, 0.1, 0.1, 0.22, '#222', 0, 1.02, 0.66);
    bx(body, 0.04, 0.05, 0.02, '#111', 0.11, 1.15, 0.5);
    bx(body, 0.04, 0.05, 0.02, '#111', -0.11, 1.15, 0.5);
    const legs = [];
    for (const s of [-1, 1]) {
      const p = pivot(g, 0.12 * s, 1.3, 0);
      bx(p, 0.07, 1.3, 0.07, '#e0558f', 0, -0.65, 0);
      legs.push(p);
    }
    return { g, legs, body };
  },
  penguin() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.6, 0.85, 0.5, '#1c2230', 0, 0.55, 0);
    bx(body, 0.44, 0.65, 0.06, '#ffffff', 0, 0.5, 0.26);
    bx(body, 0.46, 0.38, 0.44, '#1c2230', 0, 1.15, 0.02);
    bx(body, 0.3, 0.16, 0.05, '#ffffff', 0, 1.14, 0.25);
    bx(body, 0.12, 0.08, 0.16, '#ff9a1f', 0, 1.08, 0.3);
    bx(body, 0.06, 0.06, 0.02, '#111', 0.1, 1.2, 0.27);
    bx(body, 0.06, 0.06, 0.02, '#111', -0.1, 1.2, 0.27);
    bx(body, 0.16, 0.06, 0.24, '#ff9a1f', 0.14, 0.03, 0.08);
    bx(body, 0.16, 0.06, 0.24, '#ff9a1f', -0.14, 0.03, 0.08);
    const wings = [];
    for (const s of [-1, 1]) {
      const p = pivot(body, 0.32 * s, 0.85, 0);
      bx(p, 0.08, 0.55, 0.3, '#1c2230', 0, -0.27, 0);
      wings.push(p);
    }
    return { g, wings, body };
  },
  dolphin() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.6, 0.6, 2.0, '#7b93a8', 0, 0, 0);
    bx(body, 0.5, 0.25, 1.6, '#e8eef3', 0, -0.25, 0.1);
    bx(body, 0.36, 0.3, 0.6, '#7b93a8', 0, -0.08, 1.2);
    bx(body, 0.1, 0.5, 0.4, '#6a8197', 0, 0.45, -0.1).rotation.x = -0.5;
    bx(body, 1.0, 0.1, 0.35, '#6a8197', 0, 0, -1.15);
    bx(body, 0.06, 0.08, 0.02, '#111', 0.26, 0.12, 0.8);
    bx(body, 0.06, 0.08, 0.02, '#111', -0.26, 0.12, 0.8);
    return { g, body };
  },
  turtle() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 1.0, 0.4, 1.2, '#3f7d3a', 0, 0.42, 0);
    bx(body, 0.7, 0.2, 0.9, '#5ea24f', 0, 0.68, 0);
    bx(body, 0.3, 0.28, 0.4, '#9ccf6b', 0, 0.38, 0.75);
    bx(body, 0.05, 0.06, 0.02, '#111', 0.1, 0.46, 0.96);
    bx(body, 0.05, 0.06, 0.02, '#111', -0.1, 0.46, 0.96);
    const legs = legs4(g, '#9ccf6b', 0.24, 0.3, 0.42, 0.42, 0.3);
    return { g, legs, body };
  },
  sheep() {
    // Heidschnucke: graue Wolle, schwarzer Kopf und Beine, kleine Hörner
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.85, 0.75, 1.2, '#b9b4ab', 0, 0.95, 0);
    bx(body, 0.9, 0.3, 1.1, '#cfcac1', 0, 1.3, 0);
    const head = pivot(body, 0, 1.1, 0.7);
    bx(head, 0.38, 0.44, 0.48, '#1d1d1d', 0, 0, 0.12);
    bx(head, 0.5, 0.1, 0.16, '#1d1d1d', 0, 0.12, 0);
    for (const s of [-1, 1]) bx(head, 0.12, 0.26, 0.12, '#d9cbb0', 0.26 * s, 0.16, -0.05).rotation.z = 0.5 * s;
    bx(head, 0.05, 0.06, 0.02, '#fff', 0.12, 0.08, 0.37);
    bx(head, 0.05, 0.06, 0.02, '#fff', -0.12, 0.08, 0.37);
    const legs = legs4(g, '#1d1d1d', 0.16, 0.6, 0.26, 0.4, 0.6);
    return { g, legs, body, head };
  },
  swan() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.7, 0.5, 1.1, '#ffffff', 0, 0.25, 0);
    bx(body, 0.5, 0.3, 0.4, '#f2f2f2', 0, 0.55, -0.4);
    bx(body, 0.16, 0.8, 0.16, '#ffffff', 0, 0.85, 0.42);
    bx(body, 0.2, 0.2, 0.32, '#ffffff', 0, 1.25, 0.52);
    bx(body, 0.1, 0.1, 0.2, '#ff8a1f', 0, 1.2, 0.76);
    bx(body, 0.04, 0.05, 0.02, '#111', 0.1, 1.3, 0.6);
    bx(body, 0.04, 0.05, 0.02, '#111', -0.1, 1.3, 0.6);
    return { g, body };
  },
  duck() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.45, 0.35, 0.65, '#a0764e', 0, 0.2, 0);
    bx(body, 0.3, 0.3, 0.3, '#1f7a4a', 0, 0.5, 0.25);
    bx(body, 0.14, 0.07, 0.18, '#ffb020', 0, 0.45, 0.46);
    bx(body, 0.32, 0.06, 0.06, '#fff', 0, 0.37, 0.25);
    return { g, body };
  },
  rabbit(opts) {
    const g = new THREE.Group();
    const c = opts.color || '#c8b49a';
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.45, 0.42, 0.6, c, 0, 0.3, 0);
    bx(body, 0.34, 0.32, 0.34, c, 0, 0.6, 0.28);
    bx(body, 0.08, 0.38, 0.12, c, 0.09, 0.95, 0.24);
    bx(body, 0.08, 0.38, 0.12, c, -0.09, 0.95, 0.24);
    bx(body, 0.05, 0.28, 0.02, '#f7b6c2', 0.09, 0.95, 0.31);
    bx(body, 0.05, 0.28, 0.02, '#f7b6c2', -0.09, 0.95, 0.31);
    bx(body, 0.18, 0.18, 0.12, '#ffffff', 0, 0.35, -0.33);
    bx(body, 0.05, 0.05, 0.02, '#111', 0.1, 0.66, 0.45);
    bx(body, 0.05, 0.05, 0.02, '#111', -0.1, 0.66, 0.45);
    return { g, body };
  },
  unicorn() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.8, 0.75, 1.6, '#ffffff', 0, 1.35, 0);
    const head = pivot(body, 0, 1.75, 0.8);
    bx(head, 0.4, 0.9, 0.4, '#ffffff', 0, 0.2, 0);
    bx(head, 0.42, 0.42, 0.7, '#ffffff', 0, 0.62, 0.25);
    bx(head, 0.1, 0.5, 0.1, '#ffd23f', 0, 1.0, 0.38, '#5a4500').rotation.x = 0.5;
    bx(head, 0.12, 0.9, 0.36, '#ff7eb3', 0, 0.45, -0.22);
    bx(head, 0.06, 0.06, 0.02, '#111', 0.22, 0.7, 0.42);
    bx(head, 0.06, 0.06, 0.02, '#111', -0.22, 0.7, 0.42);
    bx(body, 0.16, 0.8, 0.2, '#b07bff', 0, 1.2, -0.9).rotation.x = 0.4;
    const legs = legs4(g, '#ffffff', 0.2, 1.0, 0.28, 0.6, 1.0);
    return { g, legs, body, head };
  },
  dog() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.5, 0.45, 0.95, '#2b2b2b', 0, 0.7, 0);
    bx(body, 0.52, 0.2, 0.5, '#ffffff', 0, 0.55, 0.25);
    const head = pivot(body, 0, 1.0, 0.55);
    bx(head, 0.42, 0.4, 0.42, '#2b2b2b', 0, 0, 0);
    bx(head, 0.24, 0.2, 0.25, '#ffffff', 0, -0.08, 0.3);
    bx(head, 0.08, 0.08, 0.05, '#111', 0, -0.02, 0.43);
    bx(head, 0.12, 0.2, 0.08, '#2b2b2b', 0.17, 0.25, -0.05);
    bx(head, 0.12, 0.2, 0.08, '#2b2b2b', -0.17, 0.25, -0.05);
    const tail = pivot(body, 0, 0.85, -0.5);
    bx(tail, 0.1, 0.1, 0.45, '#ffffff', 0, 0.1, -0.2).rotation.x = 0.6;
    const legs = legs4(g, '#2b2b2b', 0.14, 0.5, 0.17, 0.33, 0.5);
    return { g, legs, body, head, tail };
  },
  bee() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.22, 0.22, 0.12, '#ffd23f', 0, 0, 0.1);
    bx(body, 0.22, 0.22, 0.1, '#1d1d1d', 0, 0, 0);
    bx(body, 0.22, 0.22, 0.12, '#ffd23f', 0, 0, -0.1);
    const wings = [];
    for (const s of [-1, 1]) {
      const p = pivot(body, 0.1 * s, 0.12, 0);
      const w = new THREE.Mesh(boxGeo(0.25, 0.02, 0.16), new THREE.MeshBasicMaterial({ color: '#e8f7ff', transparent: true, opacity: 0.7 }));
      w.position.x = 0.12 * s;
      p.add(w);
      wings.push(p);
    }
    return { g, wings, body };
  },
  butterfly(opts) {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.06, 0.06, 0.35, '#222', 0, 0, 0);
    const wings = [];
    for (const s of [-1, 1]) {
      const p = pivot(body, 0.03 * s, 0, 0);
      bx(p, 0.32, 0.02, 0.3, opts.color || '#ff8a1f', 0.17 * s, 0, 0.05);
      bx(p, 0.22, 0.02, 0.2, '#ffffff', 0.13 * s, 0.005, -0.12);
      wings.push(p);
    }
    return { g, wings, body };
  },

  // Allgemeiner Vogel (Adler, Geier, Kanarienvogel, Tukan …) – über colors einfärben
  bird(opts) { return BUILDERS.parrot(opts); },

  // Vierbeiner-Baukasten: Körper, Kopf, Beine, optional Schwanz/Hals
  lion() {
    const { g, body, legs, head, tail } = quad({ body: [1.0, 0.8, 1.6], color: '#d9a441', legH: 0.7, head: [0.6, 0.6, 0.6], headY: 1.45, headZ: 0.95, tail: '#b07f2a' });
    bx(head, 1.0, 1.0, 0.45, '#8a5a1e', 0, 0, -0.15);
    bx(head, 0.3, 0.2, 0.15, '#f0d39a', 0, -0.12, 0.32);
    eyes(head, 0.16, 0.08, 0.31);
    return { g, body, legs, head, tail };
  },
  tiger() {
    const r = quad({ body: [0.9, 0.75, 1.7], color: '#f08a1f', legH: 0.65, head: [0.6, 0.55, 0.6], headY: 1.3, headZ: 1.0, tail: '#f08a1f' });
    for (let i = -2; i <= 2; i++) bx(r.body, 0.92, 0.12, 0.12, '#1d1d1d', 0, 1.25, i * 0.3);
    eyes(r.head, 0.15, 0.08, 0.31);
    return r;
  },
  elephant() {
    const r = quad({ body: [1.8, 1.7, 2.6], color: '#9aa1a8', legH: 1.3, legW: 0.55, head: [1.2, 1.2, 1.0], headY: 2.7, headZ: 1.6, tail: '#8a9198' });
    bx(r.head, 0.35, 1.6, 0.35, '#9aa1a8', 0, -0.9, 0.55);
    for (const s of [-1, 1]) bx(r.head, 0.15, 1.1, 0.9, '#b3b9bf', s * 0.7, 0, -0.1);
    for (const s of [-1, 1]) bx(r.head, 0.12, 0.12, 0.6, '#fffaf0', s * 0.35, -0.45, 0.6);
    eyes(r.head, 0.3, 0.2, 0.51);
    return r;
  },
  giraffe() {
    const r = quad({ body: [0.9, 0.9, 1.7], color: '#f2c14e', legH: 1.8, legW: 0.22, head: [0.4, 0.4, 0.7], headY: 4.4, headZ: 1.3, neck: [0.35, 2.4, 0.35], tail: '#c98a2a' });
    for (const [x, y, z] of [[0.46, 2.4, 0.3], [-0.46, 2.6, -0.4], [0.46, 2.7, -0.5], [-0.46, 2.2, 0.5]]) bx(r.body, 0.04, 0.3, 0.35, '#a0622a', x, y, z);
    for (const s of [-1, 1]) bx(r.head, 0.08, 0.3, 0.08, '#a0622a', s * 0.12, 0.3, -0.15);
    eyes(r.head, 0.14, 0.05, 0.36);
    return r;
  },
  zebra() {
    const r = quad({ body: [0.8, 0.8, 1.6], color: '#ffffff', legH: 0.9, head: [0.4, 0.5, 0.8], headY: 1.9, headZ: 1.0, tail: '#1d1d1d' });
    for (let i = -3; i <= 3; i++) bx(r.body, 0.82, 0.82, 0.1, '#1d1d1d', 0, 1.3, i * 0.22);
    bx(r.head, 0.1, 0.3, 0.7, '#1d1d1d', 0, 0.35, -0.2);
    eyes(r.head, 0.15, 0.1, 0.41);
    return r;
  },
  horse(o) {
    const c = o.color || '#8a5a2b';
    const r = quad({ body: [0.85, 0.85, 1.8], color: c, legH: 1.1, head: [0.42, 0.5, 0.9], headY: 2.3, headZ: 1.1, tail: '#2b1a0e', neck: [0.4, 0.8, 0.4] });
    bx(r.head, 0.12, 0.5, 0.8, '#2b1a0e', 0, 0.35, -0.3);
    eyes(r.head, 0.16, 0.1, 0.46);
    if (o.saddle) bx(r.body, 0.9, 0.15, 0.6, o.saddle, 0, 1.58, 0);
    return r;
  },
  cow() {
    const r = quad({ body: [1.0, 0.9, 1.7], color: '#ffffff', legH: 0.8, head: [0.55, 0.55, 0.6], headY: 1.65, headZ: 1.05, tail: '#ffffff' });
    for (const [x, y, z] of [[0.51, 1.3, 0.2], [-0.51, 1.4, -0.4], [0.2, 1.71, -0.3]]) bx(r.body, 0.05, 0.4, 0.5, '#1d1d1d', x, y, z);
    bx(r.head, 0.4, 0.25, 0.1, '#f7b6c2', 0, -0.15, 0.32);
    for (const s of [-1, 1]) bx(r.head, 0.1, 0.25, 0.1, '#e8e2d8', s * 0.25, 0.35, 0);
    eyes(r.head, 0.15, 0.1, 0.31);
    return r;
  },
  bison() {
    const r = quad({ body: [1.2, 1.2, 1.8], color: '#5b3a1e', legH: 0.8, head: [0.8, 0.8, 0.6], headY: 1.6, headZ: 1.1, tail: '#3b2a1a' });
    bx(r.body, 1.3, 0.7, 0.9, '#4a2e17', 0, 1.9, 0.5);
    for (const s of [-1, 1]) bx(r.head, 0.12, 0.3, 0.12, '#e8e2d8', s * 0.45, 0.35, 0);
    eyes(r.head, 0.22, 0.1, 0.31);
    return r;
  },
  camel() {
    const r = quad({ body: [0.9, 0.9, 1.8], color: '#d4a96a', legH: 1.5, legW: 0.22, head: [0.4, 0.4, 0.8], headY: 3.0, headZ: 1.5, neck: [0.3, 1.2, 0.3], tail: '#b8894a' });
    bx(r.body, 0.7, 0.6, 0.6, '#d4a96a', 0, 2.2, -0.3);
    eyes(r.head, 0.15, 0.08, 0.41);
    return r;
  },
  llama(o) {
    const r = quad({ body: [0.7, 0.75, 1.2], color: o.color || '#f2ead8', legH: 0.9, legW: 0.18, head: [0.36, 0.42, 0.55], headY: 2.6, headZ: 0.7, neck: [0.32, 1.2, 0.32], tail: o.color || '#f2ead8' });
    for (const s of [-1, 1]) bx(r.head, 0.08, 0.3, 0.08, o.color || '#f2ead8', s * 0.12, 0.35, -0.1);
    eyes(r.head, 0.12, 0.05, 0.28);
    return r;
  },
  goat() {
    const r = quad({ body: [0.6, 0.6, 1.0], color: '#7a5a3a', legH: 0.6, legW: 0.14, head: [0.35, 0.4, 0.5], headY: 1.3, headZ: 0.6, tail: '#5b3a1e' });
    for (const s of [-1, 1]) bx(r.head, 0.08, 0.35, 0.08, '#d9cbb0', s * 0.12, 0.3, -0.15).rotation.x = -0.6;
    bx(r.head, 0.1, 0.2, 0.08, '#e8e2d8', 0, -0.3, 0.2);
    eyes(r.head, 0.12, 0.08, 0.26);
    return r;
  },
  hippo() {
    const r = quad({ body: [1.4, 1.1, 2.0], color: '#8f7f99', legH: 0.5, legW: 0.4, head: [1.0, 0.8, 0.9], headY: 1.1, headZ: 1.3, tail: '#7f6f89' });
    bx(r.head, 0.9, 0.3, 0.3, '#f7b6c2', 0, -0.25, 0.4);
    eyes(r.head, 0.25, 0.3, 0.46);
    return r;
  },
  kangaroo() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.6, 1.0, 0.6, '#c68a4e', 0, 1.1, 0).rotation.x = 0.25;
    bx(body, 0.4, 0.45, 0.5, '#c68a4e', 0, 1.85, 0.25);
    for (const s of [-1, 1]) bx(body, 0.12, 0.35, 0.12, '#c68a4e', s * 0.12, 2.2, 0.15);
    bx(body, 0.2, 0.2, 1.1, '#b07a40', 0, 0.45, -0.6).rotation.x = -0.4;
    for (const s of [-1, 1]) bx(body, 0.2, 0.5, 0.7, '#b07a40', s * 0.2, 0.3, 0.1);
    for (const s of [-1, 1]) bx(body, 0.1, 0.4, 0.1, '#b07a40', s * 0.22, 1.2, 0.35);
    bx(body, 0.3, 0.3, 0.1, '#e8c79a', 0, 1.0, 0.33);
    eyes(body, 0.12, 1.92, 0.51);
    return { g, body };
  },
  koala() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.6, 0.7, 0.5, '#9aa1a8', 0, 0.35, 0);
    bx(body, 0.55, 0.5, 0.5, '#9aa1a8', 0, 0.9, 0.05);
    for (const s of [-1, 1]) bx(body, 0.3, 0.3, 0.12, '#c8ccd2', s * 0.35, 1.1, 0);
    bx(body, 0.16, 0.2, 0.1, '#2b2b2b', 0, 0.85, 0.3);
    eyes(body, 0.12, 0.98, 0.31);
    return { g, body };
  },
  panda() {
    const r = quad({ body: [0.9, 0.85, 1.2], color: '#ffffff', legH: 0.5, legW: 0.3, legColor: '#1d1d1d', head: [0.7, 0.6, 0.6], headY: 1.2, headZ: 0.75, tail: '#ffffff' });
    bx(r.body, 0.92, 0.35, 0.4, '#1d1d1d', 0, 1.05, 0.3);
    for (const s of [-1, 1]) { bx(r.head, 0.18, 0.18, 0.12, '#1d1d1d', s * 0.36, 0.33, 0); bx(r.head, 0.16, 0.14, 0.04, '#1d1d1d', s * 0.15, 0.05, 0.31); }
    bx(r.head, 0.1, 0.08, 0.04, '#1d1d1d', 0, -0.12, 0.31);
    return r;
  },
  monkey() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.45, 0.55, 0.35, '#7a4a2a', 0, 0.75, 0);
    bx(body, 0.4, 0.38, 0.38, '#7a4a2a', 0, 1.2, 0.05);
    bx(body, 0.28, 0.24, 0.06, '#e8c79a', 0, 1.15, 0.25);
    for (const s of [-1, 1]) { bx(body, 0.14, 0.6, 0.14, '#7a4a2a', s * 0.3, 0.75, 0); bx(body, 0.16, 0.5, 0.16, '#7a4a2a', s * 0.12, 0.25, 0); bx(body, 0.12, 0.16, 0.06, '#e8c79a', s * 0.24, 1.25, 0); }
    bx(body, 0.08, 0.08, 0.7, '#7a4a2a', 0, 0.6, -0.45).rotation.x = -0.8;
    eyes(body, 0.08, 1.24, 0.28);
    return { g, body };
  },
  cat(o) {
    const c = o.color || '#222222';
    const r = quad({ body: [0.35, 0.35, 0.75], color: c, legH: 0.3, legW: 0.1, head: [0.35, 0.32, 0.3], headY: 0.75, headZ: 0.45, tail: c });
    for (const s of [-1, 1]) bx(r.head, 0.1, 0.14, 0.06, c, s * 0.12, 0.2, 0);
    for (const s of [-1, 1]) bx(r.head, 0.07, 0.07, 0.02, '#ffe14d', s * 0.08, 0.03, 0.16, '#806a00');
    return r;
  },
  chicken() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.4, 0.4, 0.5, '#ffffff', 0, 0.45, 0);
    bx(body, 0.26, 0.3, 0.26, '#ffffff', 0, 0.78, 0.2);
    bx(body, 0.08, 0.14, 0.14, '#e8262b', 0, 0.98, 0.2);
    bx(body, 0.1, 0.06, 0.1, '#ffb020', 0, 0.76, 0.37);
    bx(body, 0.06, 0.25, 0.06, '#ffb020', 0.08, 0.13, 0);
    bx(body, 0.06, 0.25, 0.06, '#ffb020', -0.08, 0.13, 0);
    return { g, body };
  },
  emu() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.7, 0.7, 1.0, '#5b4a3a', 0, 1.6, 0);
    bx(body, 0.15, 1.0, 0.15, '#7a6a5a', 0, 2.3, 0.45);
    bx(body, 0.22, 0.22, 0.35, '#3b4a6a', 0, 2.85, 0.55);
    const legs = [];
    for (const s of [-1, 1]) { const p = pivot(g, 0.15 * s, 1.3, 0); bx(p, 0.1, 1.3, 0.1, '#6a5a4a', 0, -0.65, 0); legs.push(p); }
    eyes(body, 0.1, 2.9, 0.73);
    return { g, legs, body };
  },
  lizard() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.35, 0.18, 0.9, '#3b3f3a', 0, 0.15, 0);
    bx(body, 0.26, 0.16, 0.3, '#3b3f3a', 0, 0.16, 0.55);
    bx(body, 0.14, 0.1, 0.8, '#3b3f3a', 0, 0.1, -0.8);
    for (const [x, z] of [[0.25, 0.3], [-0.25, 0.3], [0.25, -0.3], [-0.25, -0.3]]) bx(body, 0.2, 0.06, 0.1, '#2b2f2a', x, 0.06, z);
    bx(body, 0.2, 0.05, 0.4, '#5b8fd6', 0.18, 0.18, 0.1);
    return { g, body };
  },
  crab(opts) {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    const c = opts.color || '#e0482a';
    bx(body, 0.6, 0.22, 0.45, c, 0, 0.2, 0);
    for (const s of [-1, 1]) {
      bx(body, 0.08, 0.16, 0.08, c, s * 0.12, 0.36, 0.18);
      bx(body, 0.1, 0.1, 0.1, '#111', s * 0.12, 0.47, 0.18);
      for (let i = 0; i < 3; i++) bx(body, 0.32, 0.06, 0.07, c, s * 0.4, 0.12, -0.14 + i * 0.13);
      bx(body, 0.2, 0.16, 0.2, c, s * 0.28, 0.22, 0.36);
    }
    return { g, body };
  },
  seal() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.6, 0.5, 1.3, '#6b7680', 0, 0.25, 0);
    bx(body, 0.45, 0.45, 0.45, '#6b7680', 0, 0.55, 0.65);
    bx(body, 0.6, 0.06, 0.3, '#5b6670', 0, 0.03, -0.75);
    for (const s of [-1, 1]) bx(body, 0.3, 0.06, 0.2, '#5b6670', s * 0.4, 0.05, 0.3);
    eyes(body, 0.12, 0.65, 0.88);
    return { g, body };
  },
  whale() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 2.0, 1.8, 6.0, '#3b4a5a', 0, 0, 0);
    bx(body, 1.8, 0.6, 5.0, '#d8dee4', 0, -0.8, 0.3);
    bx(body, 3.2, 0.2, 1.0, '#3b4a5a', 0, 0, -3.4);
    for (const s of [-1, 1]) bx(body, 1.2, 0.15, 0.6, '#3b4a5a', s * 1.4, -0.5, 1.2);
    eyes(body, 0.95, 0.1, 2.0);
    return { g, body };
  },
  fish(o) {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    const c = o.color || '#ff8a1f';
    bx(body, 0.2, 0.4, 0.6, c, 0, 0, 0);
    bx(body, 0.06, 0.4, 0.3, o.color2 || '#ffffff', 0, 0, -0.4);
    bx(body, 0.21, 0.42, 0.08, o.color2 || '#ffffff', 0, 0, 0.1);
    return { g, body };
  },
  bat() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.25, 0.3, 0.3, '#2b2233', 0, 0, 0);
    for (const s of [-1, 1]) bx(body, 0.06, 0.12, 0.06, '#2b2233', s * 0.08, 0.2, 0.05);
    const wings = [];
    for (const s of [-1, 1]) {
      const p = pivot(body, 0.12 * s, 0.05, 0);
      bx(p, 0.6, 0.04, 0.35, '#3d3047', 0.3 * s, 0, 0);
      wings.push(p);
    }
    for (const s of [-1, 1]) bx(body, 0.05, 0.05, 0.02, '#ff3b3b', s * 0.06, 0.04, 0.16, '#ff0000');
    return { g, wings, body };
  },
  ghost() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    const mat = new THREE.MeshLambertMaterial({ color: '#f4f8ff', emissive: '#6f7f99', transparent: true, opacity: 0.85 });
    for (const [w, h, d, y] of [[0.9, 1.0, 0.8, 1.2], [1.0, 0.6, 0.9, 0.6], [0.6, 0.4, 0.6, 1.8]]) {
      const m = new THREE.Mesh(boxGeo(w, h, d), mat);
      m.position.y = y;
      body.add(m);
    }
    for (const s of [-1, 1]) bx(body, 0.16, 0.24, 0.02, '#1d1d1d', s * 0.18, 1.45, 0.41);
    bx(body, 0.2, 0.2, 0.02, '#1d1d1d', 0, 1.1, 0.41);
    return { g, body };
  },
  spider() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.6, 0.45, 0.7, '#2b2233', 0, 0.45, -0.1);
    bx(body, 0.4, 0.3, 0.35, '#2b2233', 0, 0.42, 0.4);
    for (const s of [-1, 1]) bx(body, 0.08, 0.08, 0.02, '#ff3b3b', s * 0.1, 0.5, 0.58, '#ff0000');
    const legs = [];
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const p = pivot(body, 0.25 * s, 0.45, 0.25 - i * 0.18);
      bx(p, 0.7, 0.06, 0.06, '#2b2233', 0.35 * s, -0.12, 0).rotation.z = -0.5 * s;
      legs.push(p);
    }
    return { g, body, legs };
  },
  alien() {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    bx(body, 0.5, 0.7, 0.35, '#7be07b', 0, 0.75, 0);
    bx(body, 0.7, 0.55, 0.55, '#7be07b', 0, 1.4, 0);
    for (const s of [-1, 1]) { bx(body, 0.2, 0.26, 0.04, '#111', s * 0.17, 1.45, 0.28); bx(body, 0.05, 0.4, 0.05, '#7be07b', s * 0.15, 1.85, 0); bx(body, 0.12, 0.12, 0.12, '#ffe14d', s * 0.15, 2.08, 0, '#806a00'); }
    const legs = [];
    for (const s of [-1, 1]) { const p = pivot(g, 0.13 * s, 0.4, 0); bx(p, 0.16, 0.4, 0.16, '#5fc45f', 0, -0.2, 0); legs.push(p); }
    return { g, body, legs };
  },
  dragon(o) {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);
    const c = o.color || '#2fbf4a', c2 = o.color2 || '#ffd23f';
    bx(body, 1.4, 1.3, 3.2, c, 0, 0, 0);
    bx(body, 1.2, 0.5, 2.6, c2, 0, -0.55, 0.1);
    bx(body, 0.6, 0.7, 1.6, c, 0, 0.6, 2.0).rotation.x = -0.5;
    bx(body, 0.9, 0.8, 1.2, c, 0, 1.2, 2.9);
    bx(body, 0.7, 0.3, 0.6, c2, 0, 0.95, 3.5);
    for (const s of [-1, 1]) { bx(body, 0.15, 0.5, 0.15, '#fffaf0', s * 0.3, 1.75, 2.7).rotation.x = -0.6; bx(body, 0.12, 0.14, 0.04, '#ffe14d', s * 0.3, 1.35, 3.5, '#806a00'); }
    bx(body, 0.5, 0.5, 2.8, c, 0, 0.1, -2.8).rotation.x = 0.15;
    bx(body, 0.9, 0.12, 0.7, c2, 0, 0.25, -4.2);
    for (let i = 0; i < 4; i++) bx(body, 0.12, 0.4, 0.4, c2, 0, 0.8, 1 - i * 0.8);
    const wings = [];
    for (const s of [-1, 1]) {
      const p = pivot(body, 0.6 * s, 0.5, 0.3);
      bx(p, 3.2, 0.1, 2.0, c, 1.6 * s, 0, 0);
      bx(p, 2.6, 0.08, 1.4, c2, 1.5 * s, -0.04, -0.2);
      wings.push(p);
    }
    return { g, wings, body };
  },
};

// Hilfen für die neuen Tiere
function eyes(parent, dx, y, z) {
  for (const s of [-1, 1]) bx(parent, 0.07, 0.08, 0.02, '#111', s * dx, y, z);
}
function quad({ body: [bw, bh, bd], color, legH, legW = 0.22, legColor, head: [hw, hh, hd], headY, headZ, neck, tail }) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  bx(body, bw, bh, bd, color, 0, legH + bh / 2, 0);
  if (neck) bx(body, neck[0], neck[1], neck[2], color, 0, legH + bh + neck[1] / 2 - 0.2, bd / 2 - neck[2]);
  const head = pivot(body, 0, headY, headZ);
  bx(head, hw, hh, hd, color, 0, 0, 0);
  const legs = legs4(g, legColor || color, legW, legH, bw / 2 - legW / 2, bd / 2 - legW, legH);
  let tailP = null;
  if (tail) { tailP = pivot(body, 0, legH + bh * 0.8, -bd / 2); bx(tailP, 0.08, 0.08, 0.6, tail, 0, -0.1, -0.25).rotation.x = 0.7; }
  return { g, body, legs, head, tail: tailP };
}


export const ANIMAL_NAMES = {
  parrot: 'den Papagei', flamingo: 'den Flamingo', penguin: 'den Pinguin', dolphin: 'den Delfin', turtle: 'die Schildkröte',
  sheep: 'die Heidschnucke', swan: 'den Schwan', duck: 'die Ente', rabbit: 'den Hasen', unicorn: 'das Einhorn', dog: 'den Hund',
  lion: 'den Löwen', tiger: 'den Tiger', elephant: 'den Elefanten', giraffe: 'die Giraffe', zebra: 'das Zebra', horse: 'das Pferd',
  cow: 'die Kuh', bison: 'den Bison', camel: 'das Kamel', llama: 'das Lama', goat: 'die Ziege', hippo: 'das Nilpferd',
  kangaroo: 'das Känguru', koala: 'den Koala', panda: 'den Panda', monkey: 'den Affen', cat: 'die Katze', chicken: 'das Huhn',
  emu: 'den Emu', lizard: 'die Eidechse', crab: 'die Krabbe', seal: 'die Robbe', whale: 'den Wal', fish: 'den Fisch', bat: 'die Fledermaus',
  ghost: 'das Gespenst', spider: 'die Spinne', alien: 'das Marsmännchen', dragon: 'den Drachen', bird: 'den Vogel',
};

/**
 * Erzeugt ein Tier.
 * @param {string} kind Tierart (siehe BUILDERS)
 * @param {object} o {pos, behavior: walk|hop|fly|swim|jump|flutter|perch, radius, speed, y, colors, color, scale, hungry}
 */
export function makeAnimal(kind, o = {}) {
  const parts = BUILDERS[kind](o);
  const a = {
    kind,
    ...parts,
    behavior: o.behavior || 'walk',
    home: o.pos.clone(),
    radius: o.radius ?? 5,
    speed: o.speed ?? 1.2,
    y: o.y ?? o.pos.y,
    target: o.pos.clone(),
    timer: Math.random() * 3,
    phase: Math.random() * Math.PI * 2,
    happy: 0,
    moving: false,
  };
  a.g.position.copy(o.pos);
  if (o.scale) a.g.scale.setScalar(o.scale);
  a.g.rotation.y = Math.random() * Math.PI * 2;
  if (o.hungry) {
    const bubble = textSprite('?', { bg: '#ffffff', fg: '#2f7df6', size: 0.7 });
    bubble.scale.set(0.9, 0.9, 1);
    const top = { parrot: 1.4, flamingo: 3.2, penguin: 1.9, turtle: 1.5, sheep: 2.2, swan: 2.0, duck: 1.2, rabbit: 1.6, unicorn: 3.6, dog: 1.8,
      lion: 2.6, tiger: 2.2, elephant: 4.4, giraffe: 5.4, zebra: 2.9, horse: 3.4, cow: 2.6, bison: 3.0, camel: 4.0, llama: 3.6, goat: 2.0,
      hippo: 2.4, kangaroo: 2.8, koala: 1.7, panda: 2.2, monkey: 1.9, cat: 1.3, chicken: 1.4, emu: 3.6, lizard: 0.9, crab: 0.9, seal: 1.4,
      ghost: 2.6, spider: 1.3, alien: 2.6 }[kind] || 2;
    bubble.position.y = top * (o.scale || 1);
    a.g.add(bubble);
    a.feed = { bubble, fed: false };
  }
  return a;
}

const tmp = new THREE.Vector3();

export function updateAnimal(a, dt, time) {
  a.phase += dt;
  const g = a.g;
  const flap = (amp, speed) => { if (a.wings) a.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * Math.sin(time * speed + a.phase) * amp; }); };

  if (a.happy > 0) {
    a.happy -= dt;
    g.rotation.y += dt * 8;
    g.position.y = a.y + Math.abs(Math.sin(a.happy * 8)) * 0.6;
    flap(1, 20);
    return;
  }

  switch (a.behavior) {
    case 'fly': {
      // Kreisbahn um den Heimatpunkt
      const t = time * a.speed / a.radius + a.phase * 0.0;
      const ang = t + a.home.x;
      g.position.set(a.home.x + Math.cos(ang) * a.radius, a.y + Math.sin(time * 1.3 + a.home.z) * 1.2, a.home.z + Math.sin(ang) * a.radius);
      g.rotation.y = -ang + (a.speed > 0 ? 0 : Math.PI);
      g.rotation.z = 0.3;
      flap(0.9, 14);
      return;
    }
    case 'flutter': {
      a.timer -= dt;
      if (a.timer <= 0) {
        a.target.set(a.home.x + (Math.random() - 0.5) * a.radius * 2, a.y + Math.random() * 2, a.home.z + (Math.random() - 0.5) * a.radius * 2);
        a.timer = 1 + Math.random() * 2;
      }
      tmp.copy(a.target).sub(g.position);
      g.position.addScaledVector(tmp, Math.min(1, dt * 1.2));
      g.rotation.y = Math.atan2(tmp.x, tmp.z);
      flap(1.1, a.kind === 'bee' ? 40 : 16);
      return;
    }
    case 'jump': {
      // Delfin: springt in Bögen aus dem Wasser
      const period = 3.2, t = ((time + a.phase * 3) % period) / period;
      const ang = Math.floor((time + a.phase * 3) / period) * 1.7 + a.home.x;
      const dir = tmp.set(Math.cos(ang), 0, Math.sin(ang));
      const along = (t - 0.5) * a.radius;
      g.position.set(a.home.x + dir.x * along, a.y - 1.2 + Math.sin(t * Math.PI) * 3.2, a.home.z + dir.z * along);
      g.rotation.y = Math.atan2(dir.x, dir.z);
      a.body.rotation.x = -Math.cos(t * Math.PI) * 0.9;
      g.visible = t > 0.06 && t < 0.94;
      return;
    }
    case 'perch':
      a.body.position.y = (a.body.userData.y0 ??= a.body.position.y) + Math.sin(time * 2 + a.phase) * 0.03;
      flap(Math.sin(time * 0.7 + a.phase) > 0.92 ? 0.9 : 0, 18);
      if (a.head) a.head.rotation.y = Math.sin(time * 0.6 + a.phase) * 0.5;
      return;
    default:
      break;
  }

  // Laufen / Hoppeln / Schwimmen: zufällige Ziele im Umkreis
  a.timer -= dt;
  if (a.timer <= 0) {
    if (a.moving || Math.random() < 0.4) {
      a.moving = false;
      a.timer = 1 + Math.random() * 3;
    } else {
      const ang = Math.random() * Math.PI * 2, r = Math.random() * a.radius;
      a.target.set(a.home.x + Math.cos(ang) * r, a.y, a.home.z + Math.sin(ang) * r);
      a.moving = true;
      a.timer = 8;
    }
  }
  if (a.moving) {
    tmp.copy(a.target).sub(g.position);
    tmp.y = 0;
    const d = tmp.length();
    if (d < 0.2) { a.moving = false; a.timer = 1 + Math.random() * 3; }
    else {
      tmp.multiplyScalar(1 / d);
      g.position.addScaledVector(tmp, Math.min(d, a.speed * dt));
      const want = Math.atan2(tmp.x, tmp.z);
      let diff = want - g.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      g.rotation.y += diff * Math.min(1, dt * 6);
    }
  }
  const walk = a.moving ? Math.sin(time * 9 + a.phase) : 0;
  if (a.legs) a.legs.forEach((l, i) => { l.rotation.x = (i % 2 === (i < 2 ? 0 : 1) ? 1 : -1) * walk * 0.6; });
  if (a.behavior === 'hop') g.position.y = a.y + (a.moving ? Math.abs(Math.sin(time * 9 + a.phase)) * 0.35 : 0);
  else if (a.behavior === 'swim') g.position.y = a.y + Math.sin(time * 1.5 + a.phase) * 0.05;
  else g.position.y = a.y;
  if (a.kind === 'penguin') a.body.rotation.z = walk * 0.15;
  if (a.wings && a.kind === 'penguin') flap(a.moving ? 0.4 : 0.1, 10);
  if (a.tail) a.tail.rotation.y = Math.sin(time * 12) * 0.5;
  if (a.head && !a.moving && a.kind === 'sheep') a.head.rotation.x = Math.max(0, Math.sin(time * 0.8 + a.phase)) * 0.7; // grasen
}

// Herzchen, wenn ein Tier gefüttert wurde
export function heartBurst(parent, pos) {
  const hearts = [];
  for (let i = 0; i < 6; i++) {
    const s = textSprite('♥', { bg: 'rgba(0,0,0,0)', fg: '#ff4d8d', size: 0.6 });
    s.scale.set(0.6, 0.6, 1);
    s.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 1 + Math.random(), (Math.random() - 0.5) * 1.2));
    s.userData.v = 1.5 + Math.random();
    s.userData.life = 1.6;
    parent.add(s);
    hearts.push(s);
  }
  return hearts;
}
