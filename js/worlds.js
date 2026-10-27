// Die Welten: Mathe-Insel (Start) mit Portalen zu drei Themenwelten. Jede Themenwelt hat vier Sterne.
import * as THREE from '../vendor/three.module.min.js';
import { blockMat, studTexture } from './blocks.js';
import { coaster, dropTower, pirateShip, carousel, ferrisWheel, boatTour } from './rides.js';

const inRects = (x, z, rects) => rects.some(([x1, z1, x2, z2]) => x >= x1 && x <= x2 && z >= z1 && z <= z2);

// Bäume zufällig verteilen, aber nicht in freizuhaltenden Bereichen
function scatterTrees(w, kinds, n, half, avoid, s = [0.9, 1.3]) {
  let placed = 0, tries = 0;
  while (placed < n && tries++ < n * 30) {
    const x = w.r(-half, half), z = w.r(-half, half);
    if (inRects(x, z, avoid)) continue;
    w.tree(w.pick(kinds), x, z, w.r(s[0], s[1]));
    placed++;
  }
}

function exitPortal(w, z = 53) {
  w.portal({ x: 0, z, facing: 'n', label: 'Zur Mathe-Insel', color: '#2f7df6', target: 'hub' });
  w.spawn.set(0, 0, z - 16);
  w.spawnYaw = 0;
}

// ---------------------------------------------------------------------------
export const WORLDS = {
  hub: {
    id: 'hub',
    name: 'Mathe-Insel',
    seed: 11,
    theme: { sky: ['#1f7fe0', '#7cc4ff', '#d9f0ff'], fog: '#bfe3ff', sea: '#2f8fd8' },
    build(w, ctx) {
      w.island(100, '#6cc24a', '#f1d38b');
      w.spawn.set(0, 0, 26);
      w.spawnYaw = 0;
      // Platz mit Brunnen
      w.box(26, 0.08, 26, '#ddd6c6', 0, 0.04, 0);
      for (const [x1, z1, x2, z2] of [[0, 13, 0, 46], [-13, 0, -27, 0], [13, 0, 27, 0], [-10, -13, -10, -27], [10, -13, 10, -27]]) w.path(x1, z1, x2, z2, 3.2, '#ddd6c6');
      for (const [x, z, ww, dd] of [[0, -3.4, 7.6, 0.8], [0, 3.4, 7.6, 0.8], [-3.4, 0, 0.8, 6], [3.4, 0, 0.8, 6]]) w.block(x, 0.6, z, ww, 0.6, dd, '#b9c3cf');
      w.water(0, 0, 6, 6, { top: 0.45, color: '#5cc8ff' });
      w.block(0, 2.4, 0, 1, 2.4, 1, '#b9c3cf');
      w.box(2.4, 0.3, 2.4, '#b9c3cf', 0, 2.5, 0);
      const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.4, 2.4, 8), new THREE.MeshBasicMaterial({ color: '#bfeaff', transparent: true, opacity: 0.7 }));
      jet.position.set(0, 3.8, 0);
      w.add(jet);
      w.updaters.push((dt, t) => { jet.scale.y = 1 + Math.sin(t * 4) * 0.15; });
      w.coinRing(0, 0, 0, 8, 12);

      const stars = ctx.worldStars || {};
      const sub = (id) => `★ ${(stars[id] || []).length} / 4`;
      w.portal({ x: -30, z: 0, facing: 'e', label: 'Papageien-Paradies', color: '#2fbf4a', target: 'tropical', sub: sub('tropical') });
      w.portal({ x: 30, z: 0, facing: 'w', label: 'Märchenschloss', color: '#ff5fb0', target: 'castle', sub: sub('castle') });
      w.portal({ x: 10, z: -30, facing: 's', label: 'Achterbahn-Park', color: '#ef3e3e', target: 'coaster', sub: sub('coaster') });
      w.portal({ x: -10, z: -30, facing: 's', label: 'Wolken-Parkour', color: '#3aa6ff', target: 'parkour', sub: `Level ${ctx.level || 1}` });
      w.sign('Löse die Aufgabe am Portal!', 0, 4.2, 18, { bg: '#ffffff', fg: '#17233b', size: 1 });
      for (const [x, z] of [[-6, 16], [6, 16], [-16, 6], [16, 6], [-16, -6], [16, -6]]) w.lamp(x, z);

      // Teich mit Enten
      w.water(-20, 22, 10, 7, { color: '#4fb8f0' });
      for (let i = 0; i < 3; i++) w.animal('duck', { pos: new THREE.Vector3(-20 + i, 0.05, 22), behavior: 'swim', radius: 3, speed: 0.8, hungry: i === 0 });
      w.animal('swan', { pos: new THREE.Vector3(-18, 0.05, 23), behavior: 'swim', radius: 2.5, speed: 0.5 });
      for (let i = 0; i < 4; i++) w.animal('rabbit', { pos: new THREE.Vector3(18 + i * 2, 0, 20 - i * 2), behavior: 'hop', radius: 6, speed: 2.2, color: i % 2 ? '#c8b49a' : '#e8e2d8', hungry: i < 2 });
      for (let i = 0; i < 6; i++) w.animal('butterfly', { pos: new THREE.Vector3(w.r(-30, 30), 1.2, w.r(-20, 30)), behavior: 'flutter', radius: 4, color: w.pick(['#ff8a1f', '#5fb0ff', '#ffd23f', '#ff5fb0']), y: 1.2 });
      w.flowers(-20, 30, 14, 8, 50, ['#ff595e', '#ffd23f', '#ffffff', '#b07bff']);
      w.flowers(22, -16, 14, 10, 40, ['#ff5fb0', '#ffffff', '#ffd23f']);
      scatterTrees(w, ['oak', 'birch', 'blossom'], 45, 47, [[-16, -16, 16, 16], [-3, 12, 3, 48], [-36, -6, -12, 6], [12, -6, 36, 6], [-16, -36, 16, -10], [-26, 17, -14, 27]]);
      w.coinLine(-14, 0, -24, 0, 4);
      w.coinLine(14, 0, 24, 0, 4);
      w.coinLine(0, 14, 0, 22, 3);
    },
  },

  // -------------------------------------------------------------------------
  tropical: {
    id: 'tropical',
    name: 'Papageien-Paradies',
    seed: 23,
    theme: { sky: ['#0f8fd6', '#6fd0ff', '#e8fbff'], fog: '#c4f0ff', sea: '#1fb5c9' },
    stars: { tower: 'Papageien-Turm', ice: 'Pinguin-Eiswelt', lagoon: 'Delfin-Lagune', boat: 'Bootstour' },
    build(w) {
      w.island(116, '#5cbf4c', '#f3dc9c');
      exitPortal(w);
      for (const [x, z, ww, dd] of [[0, 55, 116, 6], [0, -55, 116, 6], [55, 0, 6, 116], [-55, 0, 6, 116]]) w.box(ww, 0.06, dd, '#f3dc9c', x, 0.03, z);
      w.path(0, 44, 0, 10, 3, '#efd9a0');
      w.path(0, 10, -18, 10, 3, '#efd9a0');
      w.path(-18, 10, -18, -8, 3, '#efd9a0');
      w.path(0, 10, 17, 10, 3, '#efd9a0');
      w.path(17, 10, 17, -8, 3, '#efd9a0');
      w.path(0, 10, 0, -56, 3, '#efd9a0');
      w.path(0, 30, 50, 30, 3, '#efd9a0');
      w.path(50, 30, 50, 20, 3, '#efd9a0');

      // 1) Papageien-Turm: Spirale um einen Riesenbaum
      w.enclosure({ x: -30, z: -8, w: 22, d: 22, side: 'e', color: '#8a5e33', label: 'Papageien-Turm', cap: '#3fae49' });
      w.block(-30, 17, -8, 3, 17, 3, '#7a4a2a');
      for (let i = 0; i < 15; i++) {
        const a = i * 0.75, top = 1.1 * (i + 1);
        w.block(-30 + Math.cos(a) * 5, top, -8 + Math.sin(a) * 5, 2.6, 0.6, 2.6, i % 2 ? '#8a5e33' : '#3fae49');
        if (i % 4 === 2) w.coin(-30 + Math.cos(a) * 5, top, -8 + Math.sin(a) * 5);
      }
      w.block(-30, 18, -8, 6, 1.2, 6, '#2f9a3c');
      for (let i = 0; i < 6; i++) { const a = i * 1.05; w.box(3, 1.2, 3, '#3fae49', -30 + Math.cos(a) * 7.5, 19 + (i % 2), -8 + Math.sin(a) * 7.5, a); }
      w.star('tower', -30, 18, -8, 'Papageien-Turm');
      const pc = [['#e8262b', '#ffd23f', '#1f7de0'], ['#1f9de0', '#ffd23f', '#1d56b3'], ['#2fbf4a', '#ff595e', '#ffd23f'], ['#ffd23f', '#1f7de0', '#2fbf4a']];
      for (let i = 0; i < 6; i++) w.animal('parrot', { pos: new THREE.Vector3(-30, 0, -8), y: 6 + i * 2.4, behavior: 'fly', radius: 8 + (i % 3), speed: (i % 2 ? 1 : -1) * 3.2, colors: pc[i % 4] });

      // 2) Pinguin-Eiswelt: rutschige Eisschollen über eiskaltem Wasser
      const iceMat = new THREE.MeshLambertMaterial({ color: '#d6f3ff', map: studTexture(), transparent: true, opacity: 0.85 });
      w.enclosure({ x: 30, z: -8, w: 24, d: 22, side: 'w', mat: iceMat, label: 'Pinguin-Eiswelt', cap: '#ffffff' });
      w.box(4, 0.06, 22, '#ffffff', 20, 0.03, -8);
      w.water(32, -8, 20, 22, { deadly: true, top: 0.2, color: '#2f6fb5', emissive: '#08294d' });
      const floeMat = new THREE.MeshLambertMaterial({ color: '#f2fbff', map: studTexture() });
      const floes = [[24.6, -5], [27.4, -1.6], [30.6, -4.4], [33.2, -8.4], [30.4, -12.2], [33.6, -15.8], [37, -12.6]];
      floes.forEach(([x, z], i) => { w.block(x, 0.6, z, 2.6, 1, 2.6, '#f2fbff', { mat: floeMat, ice: true }); if (i % 2) w.coin(x, 0.6, z); });
      w.block(39.5, 1.6, -16, 4, 2, 4, '#f2fbff', { mat: floeMat, ice: true });
      w.block(39.8, 2.8, -16.4, 2.4, 1.2, 2.4, '#ffffff', { mat: floeMat });
      w.star('ice', 39.8, 2.8, -16.4, 'Pinguin-Eiswelt');
      w.block(34, 0.6, 0, 6, 1, 4, '#f2fbff', { mat: floeMat, ice: true });
      for (let i = 0; i < 3; i++) w.animal('penguin', { pos: new THREE.Vector3(33 + i, 0.6, 0), behavior: 'walk', radius: 1.2, speed: 0.7, hungry: i === 1 });
      for (let i = 0; i < 2; i++) w.animal('penguin', { pos: new THREE.Vector3(20, 0, -14 + i * 3), behavior: 'walk', radius: 1.2, speed: 0.6 });

      // 3) Delfin-Lagune: Steg mit Tor, dann über Steine zur Sterninsel
      w.block(0, 0.3, -65, 4, 2, 14, '#a0764e', { safe: true });
      for (const s of [-1, 1]) w.block(s * 5.15, 4.7, -67, 7.7, 6, 0.8, '#8a5e33');
      w.block(0, 4.7, -67, 2.6, 1.0, 0.8, '#8a5e33');
      w.gateAt(new THREE.Vector3(0, 0.3, -67), 's', 'Delfin-Lagune');
      const stones = [[1.5, 0.5, -74.5], [-1, 0.9, -77.6], [1.8, 0.6, -80.8], [-0.8, 1.1, -83.8], [1.2, 0.7, -86.8]];
      stones.forEach(([x, top, z], i) => { w.block(x, top, z, 2.3, top + 2, 2.3, '#8d939b'); if (i === 2) w.coin(x, top, z); });
      w.block(0, 0.8, -93, 7, 3, 7, '#f3dc9c', { safe: true });
      w.tree('palm', 2, -95, 1);
      w.star('lagoon', -1, 0.8, -92, 'Delfin-Lagune');
      for (const [x, z] of [[-8, -78], [9, -82], [-7, -92], [10, -74], [8, -96]]) w.animal('dolphin', { pos: new THREE.Vector3(x, -0.8, z), y: -0.8, behavior: 'jump', radius: 7 });

      // 4) Bootstour an der Ostküste
      const st = w.station(50, 20, 'Bootstour', '#1fb5c9');
      w.block(58.5, 0.3, 20, 11, 2, 3, '#a0764e', { safe: true });
      w.addRide(boatTour(w, { cx: 78, cz: 20, rx: 14, rz: 24, starId: 'boat', station: st, exit: new THREE.Vector3(50, 0, 23.5) }));
      for (const [x, z] of [[88, 4], [84, 40]]) w.animal('dolphin', { pos: new THREE.Vector3(x, -0.8, z), y: -0.8, behavior: 'jump', radius: 8 });
      for (let i = 0; i < 2; i++) w.animal('turtle', { pos: new THREE.Vector3(76 + i * 4, -0.9, 20), y: -0.9, behavior: 'swim', radius: 5, speed: 0.6 });

      // Flamingo-Teich, Strand-Schildkröte, Papagei auf der Stange
      w.water(-26, 30, 12, 8, { color: '#5fd0e8' });
      for (let i = 0; i < 4; i++) w.animal('flamingo', { pos: new THREE.Vector3(-28 + i * 1.5, 0.05, 30), y: 0.05, behavior: 'walk', radius: 3.5, speed: 0.6, hungry: i % 2 === 0 });
      w.animal('turtle', { pos: new THREE.Vector3(30, 0, 50), behavior: 'walk', radius: 3, speed: 0.4, hungry: true });
      w.box(0.25, 2, 0.25, '#7a4a2a', 8, 1, 36);
      w.box(1.4, 0.15, 0.2, '#7a4a2a', 8, 2, 36);
      w.animal('parrot', { pos: new THREE.Vector3(8, 2.05, 36), behavior: 'perch', hungry: true });
      for (let i = 0; i < 5; i++) w.animal('butterfly', { pos: new THREE.Vector3(w.r(-40, 40), 1.2, w.r(10, 45)), y: 1.2, behavior: 'flutter', radius: 5, color: w.pick(['#ff8a1f', '#5fb0ff', '#ff5fb0']) });

      w.flowers(-12, 40, 16, 10, 40, ['#ff3b5c', '#ff8a1f', '#ffd23f', '#ff5fb0']);
      w.flowers(24, 40, 16, 10, 40, ['#ff3b5c', '#ffffff', '#ffd23f']);
      for (let i = 0; i < 10; i++) w.rock(w.r(-50, 50), w.pick([-52, 52]) + w.r(-2, 2), w.r(0.6, 1.2));
      scatterTrees(w, ['palm'], 45, 52, [[-43, -21, -17, 5], [16, -21, 44, 5], [-6, -60, 6, 12], [-3, 12, 3, 58], [44, 14, 58, 26], [-34, 24, -18, 36], [3, 32, 13, 40], [-8, 6, 20, 14]], [0.9, 1.3]);
      w.coinLine(0, 40, 0, 14, 6);
      w.coinLine(4, 30, 46, 30, 8);
      w.coinRing(-26, 0, 30, 7, 10);
    },
  },

  // -------------------------------------------------------------------------
  castle: {
    id: 'castle',
    name: 'Märchenschloss',
    seed: 37,
    theme: { sky: ['#6a5acd', '#ffa6c9', '#ffe6f0'], fog: '#ffd6e8', sea: '#58a6ff' },
    stars: { towerTop: 'Schlossturm', carousel: 'Karussell', wheel: 'Riesenrad', maze: 'Hecken-Irrgarten' },
    build(w) {
      w.island(116, '#7fd36a', '#efe0b5');
      exitPortal(w);
      w.path(0, 46, 0, -14, 4, '#f4e7c9');
      w.path(0, 22, -30, 22, 3, '#f4e7c9');
      w.path(0, 37, 16, 37, 3, '#f4e7c9');
      w.path(0, 16, 30, 16, 3, '#f4e7c9');

      // 1) Schloss mit Turm, Wendeltreppe außen am Turm, Stern auf der Plattform
      const stone = '#f4eef8';
      w.enclosure({ x: 0, z: -26, w: 30, d: 22, side: 's', h: 6, color: stone, label: 'Märchenschloss', cap: '#e4d6f0' });
      const roofMat = new THREE.MeshLambertMaterial({ color: '#4a7bd6' });
      for (const [x, z] of [[-15, -15], [15, -15], [-15, -37], [15, -37]]) {
        w.block(x, 11, z, 4.4, 11, 4.4, '#efe6f7');
        const cone = new THREE.Mesh(new THREE.ConeGeometry(3.4, 5, 4), roofMat);
        cone.position.set(x, 13.5, z);
        cone.rotation.y = Math.PI / 4;
        cone.castShadow = true;
        w.add(cone);
        w.box(0.1, 2, 0.1, '#ffffff', x, 17, z);
        w.box(1.2, 0.7, 0.05, '#ff5fb0', x + 0.6, 17.6, z);
      }
      w.block(0, 16, -28, 6, 16, 6, '#f8f3fb');
      for (let i = 0; i < 14; i++) {
        const a = Math.PI / 2 + i * 0.7, top = 1.1 * (i + 1);
        w.block(Math.cos(a) * 6.3, top, -28 + Math.sin(a) * 6.3, 2.4, 0.6, 2.4, i % 2 ? '#ffd1e4' : '#cfe8ff');
        if (i % 4 === 1) w.coin(Math.cos(a) * 6.3, top, -28 + Math.sin(a) * 6.3);
      }
      w.block(0, 16.6, -28, 8, 0.6, 8, '#ffd1e4');
      for (const [x, z] of [[-3.6, -31.6], [3.6, -31.6], [-3.6, -24.4], [3.6, -24.4]]) w.box(0.8, 1.2, 0.8, '#f8f3fb', x, 17.2, z);
      w.box(0.12, 4, 0.12, '#ffffff', 3, 18.6, -31);
      w.box(1.6, 0.9, 0.05, '#ff5fb0', 3.8, 20, -31);
      w.star('towerTop', 0, 16.6, -28, 'Schlossturm');
      // Wassergraben mit Brücke und Schwänen
      w.water(-11, -12, 18, 3.2, { color: '#7ac8ff' });
      w.water(11, -12, 18, 3.2, { color: '#7ac8ff' });
      w.box(4, 0.3, 3.6, '#c9a27a', 0, 0.15, -12);
      for (let i = 0; i < 3; i++) w.animal('swan', { pos: new THREE.Vector3(i % 2 ? 10 : -10, 0.05, -12), behavior: 'swim', radius: 3, speed: 0.5, hungry: i === 0 });

      // Feuerwerk über dem Schloss
      const fwGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      const sparks = [];
      const fwCols = ['#ff595e', '#ffd23f', '#8ac926', '#4cc9f0', '#f15bb5', '#ffffff'];
      for (let i = 0; i < 80; i++) {
        const m = new THREE.Mesh(fwGeo, new THREE.MeshBasicMaterial({ color: fwCols[i % fwCols.length], transparent: true }));
        m.visible = false;
        w.add(m);
        sparks.push({ m, v: new THREE.Vector3(), life: 0 });
      }
      let nextFw = 2, idx = 0;
      w.updaters.push((dt, t) => {
        if (t > nextFw) {
          nextFw = t + 2.5 + Math.random() * 2;
          const c = new THREE.Vector3(w.r(-20, 20), w.r(28, 38), w.r(-40, -20));
          const col = fwCols[Math.floor(Math.random() * fwCols.length)];
          for (let k = 0; k < 26; k++) {
            const sp = sparks[idx++ % sparks.length];
            sp.m.position.copy(c);
            sp.m.material.color.set(col);
            sp.v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(9 + Math.random() * 3);
            sp.life = 1.6;
            sp.m.visible = true;
          }
        }
        for (const sp of sparks) {
          if (sp.life <= 0) continue;
          sp.life -= dt;
          sp.v.y -= 6 * dt;
          sp.v.multiplyScalar(1 - dt * 1.2);
          sp.m.position.addScaledVector(sp.v, dt);
          sp.m.material.opacity = Math.min(1, sp.life);
          if (sp.life <= 0) sp.m.visible = false;
        }
      });

      // 2) Karussell
      w.addRide(carousel(w, { x: -30, z: 10, starId: 'carousel', station: w.station(-30, 20, 'Karussell', '#ff5fb0'), exit: new THREE.Vector3(-30, 0, 23) }));
      // 3) Riesenrad
      w.addRide(ferrisWheel(w, { x: 32, z: 4, starId: 'wheel', station: w.station(32, 11.5, 'Riesenrad', '#b07bff'), exit: new THREE.Vector3(35, 0, 13) }));

      // 4) Hecken-Irrgarten (zufälliges, aber festes Labyrinth)
      const C = 7, S = 3.4, x0 = 19, z0 = 25, hedge = '#2f8a3c';
      const cells = Array.from({ length: C * C }, () => ({ e: true, s: true, seen: false }));
      const at = (i, j) => cells[j * C + i];
      const stack = [[0, 3]];
      at(0, 3).seen = true;
      const dist = new Map([['0,3', 0]]);
      let far = [0, 3], farD = 0;
      while (stack.length) {
        const [i, j] = stack[stack.length - 1];
        const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([di, dj]) => [i + di, j + dj]).filter(([a, b]) => a >= 0 && b >= 0 && a < C && b < C && !at(a, b).seen);
        if (!nb.length) { stack.pop(); continue; }
        const [a, b] = nb[Math.floor(w.rng() * nb.length)];
        if (a > i) at(i, j).e = false; else if (a < i) at(a, b).e = false; else if (b > j) at(i, j).s = false; else at(a, b).s = false;
        at(a, b).seen = true;
        const d = dist.get(`${i},${j}`) + 1;
        dist.set(`${a},${b}`, d);
        if (d > farD) { farD = d; far = [a, b]; }
        stack.push([a, b]);
      }
      const H = 3.8;
      for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) {
        const c = at(i, j), cx = x0 + i * S, cz = z0 + j * S;
        if (c.e && i < C - 1) w.block(cx + S, H, cz + S / 2, 0.7, H, S + 0.7, hedge);
        if (c.s && j < C - 1) w.block(cx + S / 2, H, cz + S, S + 0.7, H, 0.7, hedge);
      }
      // Außenhecke mit Tor im Westen (Zeile 3)
      w.block(x0 + C * S / 2, H, z0, C * S + 0.7, H, 0.7, hedge);
      w.block(x0 + C * S / 2, H, z0 + C * S, C * S + 0.7, H, 0.7, hedge);
      w.block(x0 + C * S, H, z0 + C * S / 2, 0.7, H, C * S + 0.7, hedge);
      w.block(x0, H, z0 + 1.5 * S, 0.7, H, 3 * S + 0.7, hedge);
      w.block(x0, H, z0 + 5.5 * S, 0.7, H, 3 * S + 0.7, hedge);
      w.block(x0, H, z0 + 3.5 * S, 0.7, H - 3.4, S - 0.7, hedge);
      w.gateAt(new THREE.Vector3(x0, 0, z0 + 3.5 * S), 'w', 'Irrgarten', 2.6, 3.4);
      w.star('maze', x0 + (far[0] + 0.5) * S, 0, z0 + (far[1] + 0.5) * S, 'Hecken-Irrgarten');
      w.coin(x0 + 0.5 * S, 0, z0 + 3.5 * S);

      // Einhörner, Enten, Hasen, Schmetterlinge
      for (let i = 0; i < 3; i++) w.animal('unicorn', { pos: new THREE.Vector3(-14 + i * 3, 0, 36), radius: 7, speed: 1.1, hungry: i < 2 });
      w.water(-38, 38, 10, 7, { color: '#7ac8ff' });
      for (let i = 0; i < 3; i++) w.animal('duck', { pos: new THREE.Vector3(-38 + i, 0.05, 38), behavior: 'swim', radius: 3, speed: 0.7, hungry: i === 2 });
      for (let i = 0; i < 3; i++) w.animal('rabbit', { pos: new THREE.Vector3(-40 + i * 3, 0, -6), behavior: 'hop', radius: 5, speed: 2, color: '#ffffff' });
      for (let i = 0; i < 7; i++) w.animal('butterfly', { pos: new THREE.Vector3(w.r(-40, 40), 1.4, w.r(0, 45)), y: 1.4, behavior: 'flutter', radius: 5, color: w.pick(['#ff5fb0', '#b07bff', '#ffd23f', '#5fb0ff']) });
      w.flowers(-14, 36, 20, 12, 60, ['#ff5fb0', '#ffffff', '#ffd23f', '#b07bff']);
      w.flowers(16, -2, 10, 8, 30, ['#ff5fb0', '#ffffff']);
      for (const z of [40, 32, 24, 16, 8]) { w.lamp(-3, z); w.lamp(3, z); }
      scatterTrees(w, ['blossom', 'oak', 'blossom'], 38, 52, [[-20, -40, 20, -8], [-40, 0, -20, 26], [18, -10, 46, 21], [16, 21, 46, 52], [-4, -8, 4, 58], [-30, 20, 0, 24], [-26, 28, -2, 44], [-45, 32, -31, 44]]);
      w.coinLine(0, 40, 0, -4, 8);
      w.coinRing(-14, 0, 36, 6, 10);
      w.coinLine(4, 16, 26, 16, 5);
    },
  },

  // -------------------------------------------------------------------------
  coaster: {
    id: 'coaster',
    name: 'Achterbahn-Park',
    seed: 51,
    theme: { sky: ['#2a7fd4', '#8fd0ff', '#fff2d6'], fog: '#d8ecff', sea: '#3a8fd8' },
    stars: { coaster: 'Holzachterbahn', drop: 'Freifallturm', ship: 'Piratenschiff', forest: 'Kletterwald' },
    build(w) {
      w.island(116, '#7caa4e', '#e9d9a6');
      exitPortal(w);
      w.path(0, 46, 0, 0, 4, '#d9c79a');
      w.path(0, 14, -10, 14, 3, '#d9c79a');
      w.path(0, 22, 32, 22, 3, '#d9c79a');
      w.path(0, 0, 30, 0, 3, '#d9c79a');
      w.path(30, 0, 30, -15, 3, '#d9c79a');
      w.path(0, 34, -16, 34, 3, '#d9c79a');
      // Heidekraut (lila) – typisch für die Heide
      for (let i = 0; i < 220; i++) {
        const x = w.r(-55, 55), z = w.r(-55, 55);
        if (inRects(x, z, [[-52, -26, 2, 12], [-2, -60, 2, 60], [24, -30, 36, 26]])) continue;
        const s = w.r(0.5, 1.1);
        w.box(s * 1.3, s * 0.5, s, w.pick(['#9b59b6', '#b37ad1', '#8e44ad']), x, s * 0.25, z, w.r(0, 3));
      }

      // 1) Holzachterbahn
      const st = w.station(-10, 11.5, 'Holzachterbahn', '#d23c3c');
      w.addRide(coaster(w, [
        [-6, 1.2, 8], [-14, 1.2, 8], [-22, 3, 8], [-30, 8, 8], [-38, 14, 8], [-44, 17, 6], [-48, 15, 2], [-50, 8, -4],
        [-48, 2.5, -12], [-42, 6, -18], [-34, 10, -22], [-26, 5, -24], [-18, 2.5, -22], [-12, 7, -18], [-8, 9, -12],
        [-6, 5, -6], [-4, 2.5, 0], [-2, 1.6, 5],
      ], { starId: 'coaster', station: st, exit: new THREE.Vector3(-10, 0, 14.5) }));
      // 2) Freifallturm
      w.addRide(dropTower(w, { x: 30, z: -24, starId: 'drop', station: w.station(30, -17.5, 'Freifallturm', '#2f7df6'), exit: new THREE.Vector3(30, 0, -14.5) }));
      // 3) Piratenschiff
      w.addRide(pirateShip(w, { x: 32, z: 12, starId: 'ship', station: w.station(32, 19.5, 'Piratenschiff', '#7a4a2a'), exit: new THREE.Vector3(35, 0, 21) }));

      // 4) Kletterwald: Plattformen und Hängebrücken bis zum Baumhaus
      const wood = '#a0764e', plank = '#c49a6c';
      w.enclosure({ x: -30, z: 34, w: 24, d: 20, side: 'e', color: '#7a5230', label: 'Kletterwald', cap: '#5b3a1e' });
      const plat = (x, top, z, s = 2.5) => { w.block(x, top, z, s, 0.5, s, wood); w.box(0.4, top, 0.4, '#5b3a1e', x, top / 2, z); };
      const bridge = (x1, x2, z, top) => {
        w.block((x1 + x2) / 2, top, z, Math.abs(x2 - x1), 0.3, 0.9, plank);
        for (const s of [-1, 1]) w.box(Math.abs(x2 - x1), 0.08, 0.08, '#e8d8b0', (x1 + x2) / 2, top + 1, z + s * 0.5);
      };
      plat(-24, 1.0, 40, 3);
      plat(-24, 2.0, 35.5);
      bridge(-25.25, -30.75, 35.5, 2.0);
      plat(-32, 2.0, 35.5);
      plat(-32, 3.2, 31);
      bridge(-33.25, -37.25, 31, 3.2);
      plat(-38.5, 3.2, 31);
      plat(-38.5, 4.4, 26.5);
      bridge(-37.25, -31.25, 26.5, 4.4);
      plat(-30, 4.4, 26.5);
      plat(-25.5, 5.6, 26.5);
      plat(-25.5, 6.8, 31);
      w.block(-25.5, 8.0, 36.5, 4, 0.5, 4, wood);
      w.box(0.5, 8, 0.5, '#5b3a1e', -25.5, 4, 36.5);
      w.box(4.4, 0.3, 4.4, '#7a4a2a', -25.5, 11.4, 36.5);
      w.box(0.3, 3.2, 0.3, '#5b3a1e', -27.3, 9.7, 38.3);
      w.box(0.3, 3.2, 0.3, '#5b3a1e', -23.7, 9.7, 38.3);
      w.box(0.3, 3.2, 0.3, '#5b3a1e', -27.3, 9.7, 34.7);
      w.box(0.3, 3.2, 0.3, '#5b3a1e', -23.7, 9.7, 34.7);
      w.star('forest', -25.5, 8.0, 36.5, 'Kletterwald');
      w.coin(-32, 2.0, 35.5);
      w.coin(-38.5, 4.4, 26.5);
      w.coin(-25.5, 6.8, 31);
      for (const [x, z] of [[-40, 41], [-35, 42], [-41, 36], [-19.5, 26], [-35, 25.5]]) w.tree('pine', x, z, 1.1, 0, false);

      // Schafweide mit Heidschnucken und Hütehund
      const fence = (x1, z1, x2, z2) => w.block((x1 + x2) / 2, 1, (z1 + z2) / 2, Math.max(0.3, Math.abs(x2 - x1)), 1, Math.max(0.3, Math.abs(z2 - z1)), '#a07040');
      fence(14, 30, 40, 30); fence(14, 46, 40, 46); fence(40, 30, 40, 46); fence(14, 30, 14, 36); fence(14, 40, 14, 46);
      for (let i = 0; i < 7; i++) w.animal('sheep', { pos: new THREE.Vector3(22 + (i % 4) * 3, 0, 36 + Math.floor(i / 4) * 3), radius: 6, speed: 0.6, hungry: i === 0 || i === 4 });
      w.animal('dog', { pos: new THREE.Vector3(27, 0, 38), radius: 8, speed: 2.6, hungry: true });
      w.sign('Heidschnucken-Weide', 27, 3, 30.5, { bg: '#7a4a2a', size: 0.8 });
      for (let i = 0; i < 8; i++) w.animal('bee', { pos: new THREE.Vector3(w.r(-20, 50), 1, w.r(-40, 50)), y: 1, behavior: 'flutter', radius: 3 });
      for (let i = 0; i < 3; i++) w.animal('rabbit', { pos: new THREE.Vector3(10 + i * 3, 0, -40), behavior: 'hop', radius: 6, speed: 2.2, hungry: i === 1 });

      scatterTrees(w, ['birch', 'pine', 'pine'], 40, 52, [[-54, -28, 4, 14], [-4, -8, 4, 58], [22, -30, 38, 26], [12, 28, 42, 48], [-44, 22, -16, 46], [-14, 10, 4, 18]], [0.9, 1.4]);
      w.coinLine(0, 42, 0, 4, 8);
      w.coinLine(4, 22, 28, 22, 5);
      w.coinRing(16, 0, -40, 5, 8);
    },
  },
};

export const THEME_WORLDS = ['tropical', 'castle', 'coaster'];
