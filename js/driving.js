// Fahrbare Autos (Klötzchen-Modelle) und Auftrags-Markierungen. Die Fahrphysik steckt in main.js.
import * as THREE from '../vendor/three.module.min.js';
import { plainMat, textSprite } from './blocks.js';

const UNIT = new THREE.BoxGeometry(1, 1, 1);
UNIT.userData.shared = true;

function part(parent, w, h, d, color, x, y, z, emissive) {
  const m = new THREE.Mesh(UNIT, plainMat(color, emissive));
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

// Fahrzeugtypen: Name, Höchstgeschwindigkeit, Beschleunigung, Lenkung, Preis (0 = frei)
export const CAR_TYPES = {
  taxi: { name: 'Taxi', max: 20, acc: 13, turn: 2.2, price: 0, color: '#ffc531' },
  police: { name: 'Polizeiauto', max: 24, acc: 15, turn: 2.3, price: 0, color: '#ffffff' },
  pizza: { name: 'Pizza-Flitzer', max: 18, acc: 12, turn: 2.6, price: 0, color: '#ff7a1a' },
  sport: { name: 'Sportwagen', max: 30, acc: 19, turn: 2.4, price: 150, color: '#e8262b' },
  monster: { name: 'Monstertruck', max: 21, acc: 12, turn: 2.0, price: 250, color: '#2fbf4a', hop: 13 },
};

export function makeCar(kind = 'taxi', color) {
  const t = CAR_TYPES[kind];
  const c = color || t.color;
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const big = kind === 'monster';
  const lift = big ? 1.0 : 0;
  part(body, 2.0, 0.8, 4.0, c, 0, 0.75 + lift, 0);
  part(body, 1.8, 0.75, kind === 'sport' ? 1.6 : 2.1, c, 0, 1.5 + lift, kind === 'sport' ? -0.3 : -0.2);
  part(body, 1.82, 0.5, kind === 'sport' ? 1.4 : 1.9, '#9fd4ff', 0, 1.55 + lift, kind === 'sport' ? -0.3 : -0.2);
  part(body, 1.7, 0.25, 0.1, '#fff6c4', 0, 0.85 + lift, 2.02, '#a08a00');
  part(body, 1.7, 0.25, 0.1, '#ff3b3b', 0, 0.85 + lift, -2.02, '#800000');
  if (kind === 'taxi') { part(body, 0.8, 0.35, 0.4, '#17233b', 0, 2.05, -0.2); part(body, 2.02, 0.2, 4.02, '#17233b', 0, 0.75, 0); }
  if (kind === 'police') {
    part(body, 2.02, 0.35, 2.0, '#2f5fd6', 0, 0.8, 0);
    body.userData.lights = [part(body, 0.5, 0.25, 0.35, '#ff3b3b', -0.35, 2.0, -0.2, '#ff0000'), part(body, 0.5, 0.25, 0.35, '#3b6bff', 0.35, 2.0, -0.2, '#0030ff')];
  }
  if (kind === 'pizza') { part(body, 1.2, 0.7, 1.0, '#ffffff', 0, 2.2, -0.6); part(body, 1.22, 0.3, 1.02, '#e8262b', 0, 2.2, -0.6); }
  if (kind === 'sport') part(body, 2.1, 0.12, 0.5, '#17233b', 0, 1.55, -1.9);
  const wheels = [];
  const wr = big ? 0.95 : 0.45;
  for (const [x, z] of [[-1.05, 1.3], [1.05, 1.3], [-1.05, -1.3], [1.05, -1.3]]) {
    const wg = new THREE.Group();
    wg.position.set(x * (big ? 1.15 : 1), wr, z);
    part(wg, big ? 0.7 : 0.35, wr * 2, wr * 2, '#222222', 0, 0, 0);
    part(wg, big ? 0.72 : 0.37, wr * 0.8, wr * 0.8, '#c8ccd2', 0, 0, 0);
    g.add(wg);
    wheels.push(wg);
  }
  const seat = new THREE.Object3D();
  seat.position.set(-0.45, 0.35 + lift, -0.2);
  g.add(seat);
  return { group: g, body, wheels, seat, kind, type: t };
}

// Auftrags-Startpunkt: leuchtender Ring mit Schild
export function missionMarker(label, color = '#ffc531') {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.18, 6, 32), new THREE.MeshBasicMaterial({ color }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.2;
  g.add(ring);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 3, 24, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
  glow.position.y = 1.5;
  g.add(glow);
  const s = textSprite(label, { bg: color, fg: '#17233b', size: 0.9 });
  s.position.y = 4.2;
  g.add(s);
  g.userData.ring = ring;
  return g;
}

// Ziel-Markierung für laufende Aufträge (eine, wird verschoben)
export function targetBeacon() {
  const g = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 40, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#4cff7a', transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
  beam.position.y = 20;
  g.add(beam);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3, 0.25, 6, 32), new THREE.MeshBasicMaterial({ color: '#4cff7a' }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.3;
  g.add(ring);
  g.visible = false;
  return g;
}

// Pfeil über dem Auto, der zum Ziel zeigt
export function guideArrow() {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.4, 8), new THREE.MeshBasicMaterial({ color: '#4cff7a' }));
  cone.rotation.x = Math.PI / 2;
  g.add(cone);
  g.visible = false;
  return g;
}

// Kleine Person (Fahrgast / Kunde)
export function makePerson(shirt = '#ff5fb0') {
  const g = new THREE.Group();
  part(g, 0.45, 0.8, 0.45, '#1d3a7a', 0, 0.4, 0);
  part(g, 0.8, 0.8, 0.45, shirt, 0, 1.2, 0);
  part(g, 0.5, 0.5, 0.5, '#ffd23f', 0, 1.85, 0);
  part(g, 0.25, 0.7, 0.25, '#ffd23f', 0.55, 1.6, 0).rotation.z = 2.6;
  return g;
}
