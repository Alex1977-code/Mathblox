// Eingabe: virtueller Joystick + Sprungknopf (Touch), WASD/Pfeile + Leertaste, Kamera per Wischen/Maus.

const JOY_RADIUS = 55;

export class Input {
  constructor({ canvas, joyZone, joyBase, joyKnob, jumpBtn }) {
    this.joy = { x: 0, y: 0 };
    this.keys = new Set();
    this.look = { dx: 0, dy: 0 };
    this.zoom = 0;
    this.jumpQueued = false;
    this.enabled = true;
    this.joyId = null;
    this.lookId = null;
    this.joyBase = joyBase;
    this.joyKnob = joyKnob;
    this.homeStyle = { left: joyBase.style.left, bottom: joyBase.style.bottom };

    // Joystick: erscheint dort, wo der Daumen aufsetzt
    joyZone.addEventListener('pointerdown', (e) => {
      if (this.joyId !== null) return;
      e.preventDefault();
      this.joyId = e.pointerId;
      joyZone.setPointerCapture(e.pointerId);
      const zr = joyZone.getBoundingClientRect();
      this.center = { x: e.clientX, y: e.clientY };
      joyBase.style.left = `${e.clientX - zr.left - 65}px`;
      joyBase.style.bottom = `${zr.bottom - e.clientY - 65}px`;
      joyBase.classList.add('active');
      this.updateJoy(e);
    });
    joyZone.addEventListener('pointermove', (e) => { if (e.pointerId === this.joyId) this.updateJoy(e); });
    const endJoy = (e) => {
      if (e.pointerId !== this.joyId) return;
      this.joyId = null;
      this.joy.x = this.joy.y = 0;
      joyKnob.style.transform = '';
      joyBase.classList.remove('active');
      joyBase.style.left = this.homeStyle.left;
      joyBase.style.bottom = this.homeStyle.bottom;
    };
    joyZone.addEventListener('pointerup', endJoy);
    joyZone.addEventListener('pointercancel', endJoy);

    jumpBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.jumpQueued = true;
      jumpBtn.classList.add('down');
    });
    const up = () => jumpBtn.classList.remove('down');
    jumpBtn.addEventListener('pointerup', up);
    jumpBtn.addEventListener('pointercancel', up);
    jumpBtn.addEventListener('pointerleave', up);

    // Kamera drehen: Ziehen auf der freien Fläche
    canvas.addEventListener('pointerdown', (e) => {
      if (this.lookId !== null) return;
      this.lookId = e.pointerId;
      this.lastLook = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.lookId) return;
      this.look.dx += e.clientX - this.lastLook.x;
      this.look.dy += e.clientY - this.lastLook.y;
      this.lastLook = { x: e.clientX, y: e.clientY };
    });
    const endLook = (e) => { if (e.pointerId === this.lookId) this.lookId = null; };
    canvas.addEventListener('pointerup', endLook);
    canvas.addEventListener('pointercancel', endLook);
    canvas.addEventListener('wheel', (e) => { this.zoom += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      if (e.code === 'Space' && !e.repeat) this.jumpQueued = true;
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  updateJoy(e) {
    let dx = e.clientX - this.center.x, dy = e.clientY - this.center.y;
    const len = Math.hypot(dx, dy);
    if (len > JOY_RADIUS) { dx *= JOY_RADIUS / len; dy *= JOY_RADIUS / len; }
    this.joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.joy.x = dx / JOY_RADIUS;
    this.joy.y = -dy / JOY_RADIUS;
  }

  // Bewegungsrichtung: x = rechts, y = vorwärts, Länge 0..1
  getMove() {
    let x = this.joy.x, y = this.joy.y;
    const k = this.keys;
    if (k.has('KeyW') || k.has('ArrowUp')) y += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) y -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    if (len < 0.12) return { x: 0, y: 0 };
    return { x, y };
  }

  consumeJump() { const j = this.jumpQueued; this.jumpQueued = false; return j; }
  consumeLook() { const l = { ...this.look }; this.look.dx = this.look.dy = 0; return l; }
  consumeZoom() { const z = this.zoom; this.zoom = 0; return z; }

  reset() {
    this.jumpQueued = false;
    this.keys.clear();
    this.look.dx = this.look.dy = 0;
  }
}
