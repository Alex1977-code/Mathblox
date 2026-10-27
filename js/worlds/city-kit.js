// Hilfsfunktionen für Großstadt und Halloween: viele Quader zu EINEM Mesh zusammenfassen
// (spart Draw-Calls) und feste Kollisionskästen ohne eigenes Mesh.
import * as THREE from '../../vendor/three.module.min.js';
import { studTexture, blockGeometry } from '../blocks.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _c = new THREE.Color();

/** Quader {w,h,d,color,x,y,z,ry,rx,rz} (Mitte bei x,y,z) zu einer Geometrie mit Vertex-Farben verschmelzen */
export function mergeBoxes(boxes, studs = false) {
  const pos = [], nor = [], col = [], uv = [], idx = [];
  let base = 0;
  for (const b of boxes) {
    const g = studs ? blockGeometry(b.w, b.h, b.d) : new THREE.BoxGeometry(b.w, b.h, b.d);
    _e.set(b.rx || 0, b.ry || 0, b.rz || 0, 'YXZ');
    _q.setFromEuler(_e);
    _m.compose(_p.set(b.x, b.y, b.z), _q, _s);
    g.applyMatrix4(_m);
    _c.set(b.color);
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    for (let i = 0; i < P.count; i++) {
      pos.push(P.getX(i), P.getY(i), P.getZ(i));
      nor.push(N.getX(i), N.getY(i), N.getZ(i));
      col.push(_c.r, _c.g, _c.b);
      uv.push(U.getX(i), U.getY(i));
    }
    for (let i = 0; i < g.index.count; i++) idx.push(g.index.getX(i) + base);
    base += P.count;
    g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

/** Sammler für Quader eines Modells (Fahrzeug, Laternen …). b(w,h,d,color,x,y,z,ry,rx,rz) */
export function boxList() {
  const list = [];
  const b = (w, h, d, color, x, y, z, ry = 0, rx = 0, rz = 0) => { list.push({ w, h, d, color, x, y, z, ry, rx, rz }); };
  b.list = list;
  return b;
}

/** Ein Mesh aus gesammelten Quadern; mat: 'lambert' | 'basic' | Material */
export function meshOf(b, mat = 'lambert', o = {}) {
  const list = b.list || b;
  const material = mat === 'basic' ? new THREE.MeshBasicMaterial({ vertexColors: true, ...o })
    : mat === 'lambert' ? new THREE.MeshLambertMaterial({ vertexColors: true, ...o }) : mat;
  const m = new THREE.Mesh(mergeBoxes(list), material);
  m.castShadow = mat !== 'basic';
  m.receiveShadow = true;
  return m;
}

/**
 * Baukasten: feste Noppen-Blöcke werden gesammelt und am Ende als ein Mesh gezeichnet,
 * die Kollision läuft über einfache Kästen in w.solids.
 */
export class Kit {
  constructor(w) {
    this.w = w;
    this.studBoxes = [];
  }

  // Fester Quader mit Oberkante `top`. o.studs=false → glatte Deko-Box, o.hidden → nur Kollision
  solid(x, top, z, sx, h, sz, color, o = {}) {
    if (!o.hidden) {
      if (o.studs === false) this.w.box(sx, h, sz, color, x, top - h / 2, z);
      else this.studBoxes.push({ w: sx, h, d: sz, color, x, y: top - h / 2, z });
    }
    const c = {
      min: new THREE.Vector3(x - sx / 2, top - h, z - sz / 2),
      max: new THREE.Vector3(x + sx / 2, top, z + sz / 2),
      safe: !!o.safe, ice: !!o.ice,
    };
    this.w.solids.push(c);
    return c;
  }

  flush() {
    if (!this.studBoxes.length) return;
    const m = new THREE.Mesh(mergeBoxes(this.studBoxes, true), new THREE.MeshLambertMaterial({ vertexColors: true, map: studTexture() }));
    m.castShadow = true;
    m.receiveShadow = true;
    this.w.add(m);
    this.studBoxes = [];
  }
}

/** Polygon-Ecken [[x,z],…] → Punkte mit abgerundeten Kurven für CatmullRom (y fest) */
export function roundedLoop(corners, y, r = 4, step = 12) {
  const out = [];
  const n = corners.length;
  for (let i = 0; i < n; i++) {
    const P = corners[(i - 1 + n) % n], C = corners[i], N = corners[(i + 1) % n];
    const d1x = P[0] - C[0], d1z = P[1] - C[1], l1 = Math.hypot(d1x, d1z);
    const d2x = N[0] - C[0], d2z = N[1] - C[1], l2 = Math.hypot(d2x, d2z);
    const A = [C[0] + d1x / l1 * r, C[1] + d1z / l1 * r], B = [C[0] + d2x / l2 * r, C[1] + d2z / l2 * r];
    out.push([A[0], y, A[1]]);
    out.push([(A[0] + B[0]) / 2 * 0.7 + C[0] * 0.3, y, (A[1] + B[1]) / 2 * 0.7 + C[1] * 0.3]);
    out.push([B[0], y, B[1]]);
    // Zwischenpunkte auf langen Geraden halten die Kurve gerade
    const seg = l2 - 2 * r, k = Math.floor(seg / step);
    for (let j = 1; j <= k; j++) {
      const t = (r + (seg * j) / (k + 1)) / l2;
      out.push([C[0] + d2x * t, y, C[1] + d2z * t]);
    }
  }
  return out;
}

/** Fahrzeuge, die als Deko im Kreis fahren. Gibt ein Update (dt, t) zurück. */
export function loopMovers(points, movers, speed) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), true, 'catmullrom', 0.5);
  const L = curve.getLength();
  const tan = new THREE.Vector3(), tmp = new THREE.Vector3();
  return (dt, t) => {
    movers.forEach((m, i) => {
      const u = (((t * speed) / L + i / movers.length) % 1 + 1) % 1;
      curve.getPointAt(u, m.position);
      curve.getTangentAt(u, tan);
      tan.y = 0;
      m.lookAt(tmp.copy(m.position).add(tan));
    });
  };
}
