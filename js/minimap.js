// Mini-Karte: beim Laden einer Welt einmal von oben gerendert, darüber live Spieler, Ziele, Autos und Sterne.
// Antippen vergrößert die Karte.
import * as THREE from '../vendor/three.module.min.js';

const RES = 256;

export class Minimap {
  constructor(renderer, canvas) {
    this.renderer = renderer;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bg = document.createElement('canvas');
    this.bg.width = this.bg.height = RES;
    this.rt = new THREE.WebGLRenderTarget(RES, RES);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
    this.big = false;
    this.ready = false;
    this.lastDraw = 0;
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.big = !this.big;
      canvas.classList.toggle('big', this.big);
      this.lastDraw = 0;
    });
  }

  // Draufsicht der Welt rendern. keep: Objekte der Szene, die mitgezeichnet werden (Lichter, Meer, Welt)
  build(scene, stage, keep, seaColor) {
    const box = new THREE.Box3();
    if (stage.terr) {
      const t = stage.terr;
      box.set(new THREE.Vector3(t.x0, 0, t.z0), new THREE.Vector3(t.x0 + t.cols * t.cell, 0, t.z0 + t.rows * t.cell));
    } else {
      for (const s of stage.solids) { box.expandByPoint(s.min); box.expandByPoint(s.max); }
      box.expandByScalar(6);
    }
    let top = 60;
    for (const s of stage.solids) top = Math.max(top, s.max.y + 20);
    const cx = (box.min.x + box.max.x) / 2, cz = (box.min.z + box.max.z) / 2;
    const half = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2;
    this.view = { x0: cx - half, z0: cz - half, span: half * 2 };
    const cam = this.cam;
    Object.assign(cam, { left: -half, right: half, top: half, bottom: -half, near: 1, far: top + 50 });
    cam.updateProjectionMatrix();
    cam.position.set(cx, top, cz);
    cam.up.set(0, 0, -1); // Norden (−z) oben
    cam.lookAt(cx, 0, cz);

    // Alles außer Welt, Meer und Licht ausblenden, ebenso Schilder und Wolken
    const hidden = [];
    const hide = (o) => { if (o.visible) { o.visible = false; hidden.push(o); } };
    for (const c of scene.children) if (!keep.includes(c) && !c.isLight) hide(c);
    stage.root.traverse((o) => { if (o.isSprite || o.userData.noMap) hide(o); });
    const fog = scene.fog, bgc = scene.background;
    scene.fog = null;
    scene.background = new THREE.Color(seaColor);
    const r = this.renderer;
    r.setRenderTarget(this.rt);
    r.render(scene, cam);
    const px = new Uint8Array(RES * RES * 4);
    r.readRenderTargetPixels(this.rt, 0, 0, RES, RES, px);
    r.setRenderTarget(null);
    scene.fog = fog;
    scene.background = bgc;
    for (const o of hidden) o.visible = true;

    // Pixel stehen unten beginnend im Puffer: zeilenweise spiegeln
    const img = new ImageData(RES, RES);
    for (let y = 0; y < RES; y++) img.data.set(px.subarray((RES - 1 - y) * RES * 4, (RES - y) * RES * 4), y * RES * 4);
    this.bg.getContext('2d').putImageData(img, 0, 0);
    this.ready = true;
    this.lastDraw = 0;
  }

  // Weltkoordinaten → Kartenpunkt (0..size)
  toMap(x, z, size) {
    const v = this.view;
    return [((x - v.x0) / v.span) * size, ((z - v.z0) / v.span) * size];
  }

  draw(now, { player, heading, target, speeder, starts, cars, stars }) {
    if (!this.ready || now - this.lastDraw < 0.1) return;
    this.lastDraw = now;
    const cv = this.canvas, dpr = Math.min(2, window.devicePixelRatio || 1);
    const css = cv.clientWidth || 120;
    if (cv.width !== Math.round(css * dpr)) cv.width = cv.height = Math.round(css * dpr);
    const S = cv.width, g = this.ctx;
    g.clearRect(0, 0, S, S);
    g.drawImage(this.bg, 0, 0, S, S);
    const dot = (x, z, r, fill, stroke = '#ffffff') => {
      const [u, v] = this.toMap(x, z, S);
      g.beginPath(); g.arc(u, v, r * dpr, 0, Math.PI * 2);
      g.fillStyle = fill; g.fill();
      g.lineWidth = 1.5 * dpr; g.strokeStyle = stroke; g.stroke();
    };
    for (const s of stars) {
      const [u, v] = this.toMap(s.x, s.z, S);
      g.font = `${11 * dpr}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#ffd23f'; g.strokeStyle = '#7a5a00'; g.lineWidth = 2 * dpr;
      g.strokeText('★', u, v); g.fillText('★', u, v);
    }
    for (const c of cars) dot(c.x, c.z, 2.6, '#2f7df6');
    for (const m of starts) dot(m.x, m.z, 3.6, m.color, '#17233b');
    if (speeder) dot(speeder.x, speeder.z, 4.5, '#ff3b30');
    if (target) {
      const pulse = 4 + Math.sin(now * 6) * 1.5;
      dot(target.x, target.z, pulse, '#ffd23f', '#17233b');
    }
    // Spieler als Pfeil in Blickrichtung
    const [u, v] = this.toMap(player.x, player.z, S);
    g.save();
    g.translate(u, v);
    g.rotate(Math.PI - heading); // Blickrichtung (sin h, cos h) in x/z; Karte: z nach unten
    g.beginPath();
    g.moveTo(0, -7 * dpr); g.lineTo(5 * dpr, 5 * dpr); g.lineTo(0, 2.5 * dpr); g.lineTo(-5 * dpr, 5 * dpr); g.closePath();
    g.fillStyle = '#ffffff'; g.fill();
    g.lineWidth = 1.5 * dpr; g.strokeStyle = '#17233b'; g.stroke();
    g.restore();
  }
}
