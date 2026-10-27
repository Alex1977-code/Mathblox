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
};

export const ANIMAL_NAMES = {
  parrot: 'den Papagei', flamingo: 'den Flamingo', penguin: 'den Pinguin', dolphin: 'den Delfin', turtle: 'die Schildkröte',
  sheep: 'die Heidschnucke', swan: 'den Schwan', duck: 'die Ente', rabbit: 'den Hasen', unicorn: 'das Einhorn', dog: 'den Hütehund',
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
    const top = { parrot: 1.4, flamingo: 3.2, penguin: 1.9, turtle: 1.5, sheep: 2.2, swan: 2.0, duck: 1.2, rabbit: 1.6, unicorn: 3.6, dog: 1.8 }[kind] || 2;
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
