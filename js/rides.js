// Fahrgeschäfte. Jede Fahrt hat einen Sitz (Object3D), an dem der Avatar während der Fahrt sitzt.
// Schnittstelle: { name, starId, station, exit, duration, seat, update(dt, time, riding, t), camera? }
import * as THREE from '../vendor/three.module.min.js';
import { plainMat } from './blocks.js';

const UNIT = new THREE.BoxGeometry(1, 1, 1);
UNIT.userData.shared = true;

export function part(parent, w, h, d, color, x, y, z, emissive) {
  const m = new THREE.Mesh(UNIT, plainMat(color, emissive));
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

export function seatAt(parent, x, y, z) {
  const s = new THREE.Object3D();
  s.position.set(x, y, z);
  parent.add(s);
  return s;
}

const smooth = (t) => t * t * (3 - 2 * t);

// ---------- Holzachterbahn ----------
export function coaster(w, points, { name = 'Holzachterbahn', starId, station, exit, color = '#d23c3c' }) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), true, 'catmullrom', 0.5);
  const L = curve.getLength();
  const N = Math.ceil(L / 1.1);
  const up = new THREE.Vector3(0, 1, 0);
  const left = [], right = [];
  for (let i = 0; i < N; i++) {
    const u = i / N, p = curve.getPointAt(u), t = curve.getTangentAt(u);
    const side = t.clone().cross(up).normalize();
    left.push(p.clone().addScaledVector(side, 0.55));
    right.push(p.clone().addScaledVector(side, -0.55));
    // Schwellen und Holzstützen werden als Deko gebündelt
    w.box(1.6, 0.14, 0.35, '#8a5e33', p.x, p.y - 0.12, p.z, Math.atan2(t.x, t.z), -Math.asin(t.y));
    if (i % 3 === 0 && p.y > 0.8) {
      for (const sd of [-0.7, 0.7]) w.box(0.28, p.y, 0.28, '#a07040', p.x + side.x * sd, p.y / 2 - 0.15, p.z + side.z * sd);
      if (p.y > 4) w.box(1.6, 0.14, 0.14, '#8a5e33', p.x, p.y / 2, p.z, Math.atan2(t.x, t.z));
    }
  }
  const railMat = new THREE.MeshLambertMaterial({ color: '#c8ccd2' });
  for (const pts of [left, right]) {
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), N * 2, 0.09, 5, true), railMat);
    m.castShadow = true;
    w.add(m);
  }
  // Zug aus drei Wagen
  const cars = [];
  for (let k = 0; k < 3; k++) {
    const car = new THREE.Group();
    part(car, 1.5, 0.6, 1.9, color, 0, 0.35, 0);
    part(car, 1.5, 0.8, 0.25, '#ffd23f', 0, 0.75, 0.85);
    part(car, 1.2, 0.15, 1.3, '#3b2a1a', 0, 0.62, -0.1);
    for (const s of [-1, 1]) part(car, 0.12, 0.5, 0.12, '#ffd23f', 0.6 * s, 1.0, -0.6);
    w.add(car);
    cars.push(car);
  }
  const seat = seatAt(cars[0], 0, -0.15, -0.2);

  // Fahrt vorab berechnen: Kettenlift bis zum höchsten Punkt, danach Schwung durch die Höhe
  let topU = 0, topY = -1;
  for (let i = 0; i < 200; i++) { const y = curve.getPointAt(i / 200).y; if (y > topY) { topY = y; topU = i / 200; } }
  const table = [0];
  let s = 0, time = 0;
  const dtS = 1 / 30;
  while (s < L) {
    const u = s / L, y = curve.getPointAt(u).y;
    let v = u < topU ? 4.5 : Math.min(20, Math.sqrt(16 + 2 * 9.81 * Math.max(0, topY - y)) * 0.92);
    if (u > 0.94) v = Math.max(2.5, v * (1 - (u - 0.94) / 0.08));
    s += v * dtS;
    time += dtS;
    table.push(Math.min(s, L));
  }
  const duration = time;
  const sAt = (t) => { const i = Math.min(table.length - 1, t / dtS); const i0 = Math.floor(i); return table[i0] + (table[Math.min(i0 + 1, table.length - 1)] - table[i0]) * (i - i0); };
  const tmpT = new THREE.Vector3();
  const place = (sArc) => {
    cars.forEach((car, k) => {
      const u = (((sArc - k * 2.1) % L) + L) % L / L;
      const p = curve.getPointAt(u);
      car.position.copy(p).add(new THREE.Vector3(0, 0.05, 0));
      car.lookAt(tmpT.copy(p).add(curve.getTangentAt(u)));
    });
  };
  return {
    name, starId, station, exit, duration, seat,
    update(dt, t, riding, rt) {
      // Leerfahrten, wenn niemand mitfährt – 5 Sekunden Halt in der Station
      if (riding) place(sAt(rt));
      else { const c = t % (duration + 5); place(c < 5 ? 0 : sAt(c - 5)); }
    },
  };
}

// ---------- Freifallturm ----------
export function dropTower(w, { x, z, height = 36, name = 'Freifallturm', starId, station, exit }) {
  w.block(x, height, z, 1.8, height, 1.8, '#e8e8f0');
  for (let y = 4; y < height; y += 4) w.box(2.1, 0.3, 2.1, '#ff595e', x, y, z);
  w.box(3, 1.2, 3, '#ffd23f', x, height + 0.6, z);
  const ring = new THREE.Group();
  part(ring, 5.4, 0.5, 5.4, '#2f7df6', 0, 0, 0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const seatBox = part(ring, 0.9, 1.1, 0.5, '#ffd23f', Math.sin(a) * 2.2, 0.6, Math.cos(a) * 2.2);
    seatBox.rotation.y = a;
  }
  ring.position.set(x, 1.4, z);
  w.add(ring);
  // Sitz zeigt nach außen (Süden)
  const seat = seatAt(ring, 0, -0.35, 2.75);
  const duration = 10.5;
  const yAt = (t) => {
    if (t < 5) return 1.4 + smooth(t / 5) * (height - 6);
    if (t < 6.6) return height - 4.6;
    if (t < 7.7) { const k = (t - 6.6) / 1.1; return height - 4.6 - k * k * (height - 12); }
    return Math.max(1.4, 7.4 - smooth(Math.min(1, (t - 7.7) / 2.4)) * 6);
  };
  return {
    name, starId, station, exit, duration, seat,
    camera(pos, fwd, out) { out.pos.set(pos.x, pos.y + 2.5, pos.z + 11); out.look.set(pos.x, pos.y + 1, pos.z); },
    update(dt, t, riding, rt) {
      ring.position.y = riding ? yAt(rt) : yAt((t % 16) < 10.5 ? t % 16 : 0);
      ring.rotation.y = riding ? 0 : Math.sin(t * 0.3) * 0.2;
    },
  };
}

// ---------- Piratenschiff ----------
export function pirateShip(w, { x, z, name = 'Piratenschiff', starId, station, exit }) {
  const pivotY = 11;
  for (const s of [-1, 1]) {
    w.box(0.6, 12, 0.6, '#5b3a1e', x - 3, 5.6, z + 3.4 * s, 0, 0, 0.3);
    w.box(0.6, 12, 0.6, '#5b3a1e', x + 3, 5.6, z + 3.4 * s, 0, 0, -0.3);
  }
  w.box(0.5, 0.5, 7.4, '#3b2a1a', x, pivotY, z);
  const pivot = new THREE.Group();
  pivot.position.set(x, pivotY, z);
  w.add(pivot);
  const ship = new THREE.Group();
  ship.position.y = -8.2;
  pivot.add(ship);
  part(ship, 12, 1.6, 3.6, '#7a4a2a', 0, 0, 0);
  part(ship, 10, 0.8, 3.0, '#5b3a1e', 0, -1.1, 0);
  part(ship, 12.4, 0.2, 3.8, '#ffd23f', 0, 0.85, 0);
  part(ship, 2, 2, 3.6, '#7a4a2a', 6.2, 0.9, 0);
  part(ship, 2, 2, 3.6, '#7a4a2a', -6.2, 0.9, 0);
  part(ship, 0.3, 6, 0.3, '#3b2a1a', 0, 3.8, 0);
  part(ship, 0.15, 3.5, 3.0, '#f2f2f2', 0, 4.4, 0);
  for (const s of [-1, 1]) part(pivot, 0.3, 8.2, 0.3, '#3b2a1a', 0, -4.1, 1.6 * s);
  const seat = seatAt(ship, 4.5, 0.05, 0);
  seat.rotation.y = Math.PI / 2;
  const duration = 14;
  return {
    name, starId, station, exit, duration, seat,
    camera(pos, fwd, out) { out.pos.set(x, pivotY - 3, z + 18); out.look.set(pos.x, pos.y + 1, pos.z); },
    update(dt, t, riding, rt) {
      const amp = riding ? 1.15 * Math.sin(Math.min(1, rt / duration) * Math.PI) : 0.25;
      pivot.rotation.z = Math.sin((riding ? rt : t) * 1.05) * amp;
    },
  };
}

// ---------- Karussell ----------
export function carousel(w, { x, z, name = 'Karussell', starId, station, exit }) {
  const base = new THREE.Group();
  base.position.set(x, 0, z);
  w.add(base);
  w.block(x, 0.5, z, 3, 0.5, 3, '#ffffff');
  w.box(0.8, 6, 0.8, '#ffd23f', x, 3.5, z);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(7.2, 2.6, 12), plainMat('#ff7eb3'));
  roof.position.set(x, 7.6, z);
  roof.castShadow = true;
  w.add(roof);
  const spin = new THREE.Group();
  base.add(spin);
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 0.4, 24), plainMat('#fff1f7'));
  disk.position.y = 0.35;
  spin.add(disk);
  const horses = [];
  const cols = ['#ffffff', '#ffd1e4', '#cfe8ff', '#fff3b0'];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const h = new THREE.Group();
    h.position.set(Math.sin(a) * 4.6, 1.4, Math.cos(a) * 4.6);
    h.rotation.y = a + Math.PI / 2;
    part(h, 0.12, 5.4, 0.12, '#ffd23f', 0, 1.6, 0);
    part(h, 0.6, 0.6, 1.4, cols[i % 4], 0, 0, 0);
    part(h, 0.4, 0.8, 0.4, cols[i % 4], 0, 0.5, 0.65);
    part(h, 0.4, 0.4, 0.6, cols[i % 4], 0, 0.85, 0.85);
    part(h, 0.12, 0.5, 0.3, '#b07bff', 0, 0.9, 0.5);
    for (const [lx, lz] of [[-0.2, 0.5], [0.2, 0.5], [-0.2, -0.5], [0.2, -0.5]]) part(h, 0.14, 0.6, 0.14, cols[i % 4], lx, -0.5, lz);
    spin.add(h);
    horses.push(h);
  }
  const seat = seatAt(horses[0], 0, -0.55, 0);
  const duration = 12;
  return {
    name, starId, station, exit, duration, seat,
    camera(pos, fwd, out) { out.pos.set(x + 3, 6, z + 14); out.look.set(pos.x, pos.y + 1, pos.z); },
    update(dt, t, riding, rt) {
      spin.rotation.y += dt * (riding ? 0.4 + 0.5 * Math.sin(Math.min(1, rt / duration) * Math.PI) : 0.3);
      horses.forEach((h, i) => { h.position.y = 1.4 + Math.sin(t * 2 + i) * 0.35; });
    },
  };
}

// ---------- Riesenrad ----------
export function ferrisWheel(w, { x, z, r = 11, name = 'Riesenrad', starId, station, exit }) {
  const cy = r + 2.5;
  for (const s of [-1, 1]) {
    w.box(0.6, cy + 1, 0.6, '#c8ccd2', x - 3.2, cy / 2, z + 2.2 * s, 0, 0, -0.25);
    w.box(0.6, cy + 1, 0.6, '#c8ccd2', x + 3.2, cy / 2, z + 2.2 * s, 0, 0, 0.25);
  }
  w.box(0.6, 0.6, 5, '#8d939b', x, cy, z);
  const wheel = new THREE.Group();
  wheel.position.set(x, cy, z);
  w.add(wheel);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.25, 6, 48), plainMat('#ff7eb3'));
  wheel.add(rim);
  const rim2 = rim.clone();
  rim2.scale.setScalar(0.55);
  wheel.add(rim2);
  const n = 10;
  const gondolas = [];
  const cols = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#b07bff'];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const spoke = part(wheel, 0.15, r, 0.15, '#ffffff', Math.cos(a) * r / 2, Math.sin(a) * r / 2, 0);
    spoke.rotation.z = a - Math.PI / 2;
    const g = new THREE.Group();
    g.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
    const c = cols[i % cols.length];
    part(g, 2, 0.2, 2, c, 0, -1.9, 0);
    part(g, 2, 1, 0.15, c, 0, -1.35, 0.95);
    part(g, 2, 1, 0.15, c, 0, -1.35, -0.95);
    part(g, 2.3, 0.2, 2.3, c, 0, 0.1, 0);
    part(g, 0.1, 2, 0.1, '#ffffff', 0, -0.9, 0);
    wheel.add(g);
    gondolas.push(g);
  }
  const seat = seatAt(gondolas[0], 0, -2.6, 0);
  const speed = 0.38;
  const duration = (Math.PI * 2) / speed;
  // Gondel 0 soll beim Einsteigen unten sein: Winkel -π/2
  const startAngle = -Math.PI / 2;
  let angle = 0;
  return {
    name, starId, station, exit, duration, seat,
    camera(pos, fwd, out) { out.pos.set(pos.x * 0.5 + x * 0.5, pos.y + 2, z + 13); out.look.set(pos.x, pos.y, pos.z); },
    update(dt, t, riding, rt) {
      angle = riding ? startAngle + rt * speed : angle + dt * 0.12;
      wheel.rotation.z = angle;
      for (const g of gondolas) g.rotation.z = -angle; // Gondeln bleiben waagrecht
    },
  };
}

// ---------- Bootstour ----------
export function boatTour(w, { cx, cz, rx, rz, y = -0.75, name = 'Bootstour', starId, station, exit }) {
  const boat = new THREE.Group();
  part(boat, 2.4, 0.8, 4.2, '#ffffff', 0, 0, 0);
  part(boat, 2.6, 0.25, 4.4, '#ff595e', 0, 0.45, 0);
  part(boat, 1.8, 0.2, 3.4, '#a0764e', 0, 0.35, 0);
  part(boat, 0.15, 2.2, 0.15, '#3b2a1a', 0, 1.4, 1.2);
  part(boat, 2.2, 0.15, 2.4, '#ffd23f', 0, 2.5, 0.2);
  w.add(boat);
  const seat = seatAt(boat, 0, -0.35, -0.6);
  const duration = 20;
  const placeAt = (a) => {
    boat.position.set(cx + Math.cos(a) * rx, y + Math.sin(a * 6) * 0.08, cz + Math.sin(a) * rz);
    // Bewegungsrichtung = Ableitung der Ellipse
    boat.rotation.y = Math.atan2(-Math.sin(a) * rx, Math.cos(a) * rz);
    boat.rotation.z = Math.sin(a * 5) * 0.05;
  };
  return {
    name, starId, station, exit, duration, seat,
    update(dt, t, riding, rt) {
      placeAt(Math.PI + (riding ? (rt / duration) * Math.PI * 2 : 0) + (riding ? 0 : Math.sin(t) * 0.01));
    },
  };
}

// ---------- Allgemeine Fahrt entlang eines Pfads ----------
/**
 * Ein Fahrzeug (THREE.Group, Front = +z) fährt einen Pfad ab. Einmal pro Fahrt (geschlossener Pfad: eine Runde).
 * points: [[x, y, z], …]; ground: true = y aus dem Gelände + y-Wert als Abstand; idle: 'loop' | 'wait'
 * seat: [x, y, z] Sitzposition im Fahrzeug (Füße), flat: Fahrzeug nicht nach oben/unten neigen
 * animate(vehicle, t, riding): optionale Zusatzanimation (Rotoren, Flügel …)
 */
export function pathRide(w, { points, closed = true, duration = 18, vehicle, seat = [0, 0, 0], name, starId, station, exit, ground = false, idle = 'loop', flat = false, camera, animate, bank = 0 }) {
  const pts = points.map(([x, y, z]) => new THREE.Vector3(x, ground ? w.heightAt(x, z) + y : y, z));
  const curve = new THREE.CatmullRomCurve3(pts, closed, 'catmullrom', 0.5);
  w.add(vehicle);
  const seatObj = seatAt(vehicle, ...seat);
  const tmp = new THREE.Vector3(), tan = new THREE.Vector3();
  const place = (u) => {
    u = Math.min(Math.max(u, 0), closed ? 0.99999 : 1);
    const p = curve.getPointAt(u);
    if (ground) p.y = Math.max(p.y, w.heightAt(p.x, p.z) + points[0][1]);
    vehicle.position.copy(p);
    curve.getTangentAt(u, tan);
    if (flat) tan.y = 0;
    vehicle.lookAt(tmp.copy(p).add(tan));
    if (bank) vehicle.rotateZ(bank);
  };
  place(0);
  return {
    name, starId, station, exit, duration, seat: seatObj, camera,
    update(dt, t, riding, rt) {
      let u;
      if (riding) u = rt / duration;
      else if (idle === 'loop') { const c = t % (duration + 6); u = c < 6 ? 0 : (c - 6) / duration; }
      else u = 0;
      place(closed ? u % 1 : u);
      if (animate) animate(vehicle, t, riding);
    },
  };
}
