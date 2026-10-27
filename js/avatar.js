// Klötzchen-Avatar mit Hüten und Farben. Füße liegen bei y = 0, Blickrichtung ist +z.
import * as THREE from '../vendor/three.module.min.js';

export const SHOP = {
  hat: [
    { id: 'none', name: 'Ohne', price: 0, icon: '—' },
    { id: 'cap', name: 'Kappe', price: 30, icon: '🧢' },
    { id: 'party', name: 'Partyhut', price: 50, icon: '🎉' },
    { id: 'tophat', name: 'Zylinder', price: 80, icon: '🎩' },
    { id: 'horns', name: 'Wikinger', price: 120, icon: '🐂' },
    { id: 'crown', name: 'Krone', price: 150, icon: '👑' },
    { id: 'halo', name: 'Heiligenschein', price: 250, icon: '😇' },
    { id: 'wizard', name: 'Zauberhut', price: 400, icon: '🧙' },
  ],
  shirt: [
    { id: '#2f7df6', name: 'Blau', price: 0 },
    { id: '#ef3e3e', name: 'Rot', price: 0 },
    { id: '#2fbf4a', name: 'Grün', price: 0 },
    { id: '#ffb020', name: 'Orange', price: 0 },
    { id: '#ff5fb0', name: 'Pink', price: 15 },
    { id: '#8b5cf6', name: 'Lila', price: 15 },
    { id: '#14c8c8', name: 'Türkis', price: 15 },
    { id: '#222831', name: 'Schwarz', price: 25 },
    { id: '#ffffff', name: 'Weiß', price: 25 },
    { id: 'gold', name: 'Gold', price: 200 },
  ],
  pants: [
    { id: '#1d3a7a', name: 'Jeans', price: 0 },
    { id: '#3b3b3b', name: 'Grau', price: 0 },
    { id: '#2fbf4a', name: 'Grün', price: 0 },
    { id: '#7a4a1d', name: 'Braun', price: 0 },
    { id: '#ef3e3e', name: 'Rot', price: 15 },
    { id: '#ffffff', name: 'Weiß', price: 15 },
    { id: '#8b5cf6', name: 'Lila', price: 15 },
    { id: 'gold', name: 'Gold', price: 200 },
  ],
  skin: [
    { id: '#ffd23f', name: 'Klassik', price: 0 },
    { id: '#f6d2b0', name: 'Hell', price: 0 },
    { id: '#d6a274', name: 'Mittel', price: 0 },
    { id: '#8d5a3b', name: 'Dunkel', price: 0 },
    { id: '#7be07b', name: 'Alien', price: 60 },
    { id: '#9fd8ff', name: 'Eis', price: 60 },
  ],
};

export const DEFAULT_OUTFIT = { hat: 'none', shirt: '#2f7df6', pants: '#1d3a7a', skin: '#ffd23f' };

function faceTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#1a1a1a';
  g.beginPath(); g.ellipse(44, 52, 8, 12, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(84, 52, 8, 12, 0, 0, Math.PI * 2); g.fill();
  g.lineWidth = 7; g.lineCap = 'round'; g.strokeStyle = '#1a1a1a';
  g.beginPath(); g.arc(64, 70, 26, 0.18 * Math.PI, 0.82 * Math.PI); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const matFor = (color) => color === 'gold'
  ? new THREE.MeshStandardMaterial({ color: '#ffc531', metalness: 0.7, roughness: 0.3 })
  : new THREE.MeshLambertMaterial({ color });

function box(w, h, d, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true;
  return m;
}

function buildHat(id) {
  const g = new THREE.Group();
  const L = (c, e) => new THREE.MeshLambertMaterial({ color: c, emissive: e || 0x000000 });
  switch (id) {
    case 'cap': {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.22, 16), L('#e23b3b'));
      top.position.y = 0.1;
      const brim = box(0.5, 0.05, 0.35, L('#e23b3b'));
      brim.position.set(0, 0.0, 0.38);
      g.add(top, brim);
      break;
    }
    case 'party': {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 16), L('#ff5fb0'));
      cone.position.y = 0.35;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), L('#ffe14d'));
      ball.position.y = 0.72;
      g.add(cone, ball);
      break;
    }
    case 'tophat': {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 20), L('#1c1c1c'));
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.6, 20), L('#1c1c1c'));
      top.position.y = 0.3;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.1, 20), L('#c0392b'));
      band.position.y = 0.08;
      g.add(brim, top, band);
      break;
    }
    case 'horns': {
      const helm = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), L('#9aa3ad'));
      for (const s of [-1, 1]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.45, 10), L('#fff6dc'));
        horn.position.set(0.4 * s, 0.22, 0);
        horn.rotation.z = -0.9 * s;
        g.add(horn);
      }
      g.add(helm);
      break;
    }
    case 'crown': {
      const mat = new THREE.MeshStandardMaterial({ color: '#ffc531', metalness: 0.8, roughness: 0.25 });
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 8, 1, true), mat);
      ring.position.y = 0.1;
      g.add(ring);
      for (let i = 0; i < 8; i++) {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 4), mat);
        const a = (i / 8) * Math.PI * 2;
        sp.position.set(Math.sin(a) * 0.32, 0.29, Math.cos(a) * 0.32);
        g.add(sp);
      }
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), L('#e0245e', '#600'));
      gem.position.set(0, 0.12, 0.35);
      g.add(gem);
      break;
    }
    case 'halo': {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 24),
        new THREE.MeshBasicMaterial({ color: '#fff3a0' }));
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.35;
      halo.userData.spin = true;
      g.add(halo);
      break;
    }
    case 'wizard': {
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 20), L('#3b2a8f'));
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 20), L('#3b2a8f'));
      cone.position.y = 0.45;
      cone.rotation.z = 0.15;
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), new THREE.MeshBasicMaterial({ color: '#ffe14d' }));
      star.position.set(0.12, 0.45, 0.28);
      g.add(brim, cone, star);
      break;
    }
    default:
      break;
  }
  return g;
}

export class Avatar {
  constructor(outfit = DEFAULT_OUTFIT) {
    this.group = new THREE.Group();
    this.face = faceTexture();
    this.phase = 0;
    this.build(outfit);
  }

  build(outfit) {
    this.outfit = { ...DEFAULT_OUTFIT, ...outfit };
    const g = this.group;
    while (g.children.length) g.remove(g.children[0]);
    const skin = matFor(this.outfit.skin);
    const shirt = matFor(this.outfit.shirt);
    const pants = matFor(this.outfit.pants);

    const limb = (w, h, d, mat, x, y) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      const m = box(w, h, d, mat);
      m.position.y = -h / 2;
      pivot.add(m);
      g.add(pivot);
      return pivot;
    };
    this.legL = limb(0.48, 0.9, 0.5, pants, -0.25, 0.9);
    this.legR = limb(0.48, 0.9, 0.5, pants, 0.25, 0.9);
    const torso = box(1.0, 0.9, 0.5, shirt);
    torso.position.y = 1.35;
    g.add(torso);
    this.armL = limb(0.42, 0.88, 0.46, skin, -0.72, 1.78);
    this.armR = limb(0.42, 0.88, 0.46, skin, 0.72, 1.78);
    // Ärmel in Shirtfarbe
    for (const arm of [this.armL, this.armR]) {
      const sleeve = box(0.44, 0.34, 0.48, shirt);
      sleeve.position.y = -0.16;
      arm.add(sleeve);
    }
    const faceMat = new THREE.MeshLambertMaterial({ map: this.face, color: this.outfit.skin === 'gold' ? '#ffc531' : this.outfit.skin });
    const headMats = [skin, skin, skin, skin, faceMat, skin];
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.62, 0.62), headMats);
    this.head.castShadow = true;
    this.head.position.y = 2.12;
    g.add(this.head);
    this.hat = buildHat(this.outfit.hat);
    this.hat.position.y = 2.43;
    g.add(this.hat);
  }

  // speed: horizontale Geschwindigkeit, airborne: in der Luft
  animate(dt, speed, airborne, time) {
    const k = Math.min(speed / 8, 1);
    if (airborne) {
      this.legL.rotation.x = THREE.MathUtils.lerp(this.legL.rotation.x, 0.5, 0.2);
      this.legR.rotation.x = THREE.MathUtils.lerp(this.legR.rotation.x, -0.3, 0.2);
      this.armL.rotation.x = THREE.MathUtils.lerp(this.armL.rotation.x, -2.6, 0.2);
      this.armR.rotation.x = THREE.MathUtils.lerp(this.armR.rotation.x, -2.6, 0.2);
    } else {
      this.phase += dt * (4 + speed * 1.3);
      const s = Math.sin(this.phase) * 0.9 * k;
      this.legL.rotation.x = s;
      this.legR.rotation.x = -s;
      this.armL.rotation.x = -s;
      this.armR.rotation.x = s;
      if (k < 0.05) {
        const idle = Math.sin(time * 2) * 0.05;
        this.armL.rotation.x = idle;
        this.armR.rotation.x = -idle;
      }
    }
    this.hat.traverse((o) => { if (o.userData.spin) o.rotation.z += dt * 2; });
  }
}
