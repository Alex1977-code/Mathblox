import * as THREE from '../vendor/three.module.min.js';
import { generateTask, checkTyped, GRADES } from './math.js';
import { Level } from './level.js';
import { World } from './world.js';
import { WORLDS, THEME_WORLDS } from './worlds.js';
import { ANIMAL_NAMES } from './animals.js';
import { Avatar, SHOP, DEFAULT_OUTFIT } from './avatar.js';
import { Input } from './controls.js';
import { sfx, unlockAudio, setMuted, vibrate } from './audio.js';

const $ = (id) => document.getElementById(id);

// ---------- Spielstand ----------
const SAVE_KEY = 'mathblox-save-v1';
const DEFAULT_SAVE = {
  coins: 0,
  owned: [],
  outfit: { ...DEFAULT_OUTFIT },
  grade: 3,
  difficulty: 0,
  mode: 'choice',
  muted: false,
  level: 1,
  unlocked: 1,
  stars: {},
  worldStars: {},
  worldDone: {},
  stats: { solved: 0, correct: 0 },
};

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return { ...structuredClone(DEFAULT_SAVE), ...s, outfit: { ...DEFAULT_OUTFIT, ...s.outfit }, stats: { ...DEFAULT_SAVE.stats, ...s.stats } };
    }
  } catch { /* Speicher nicht verfügbar */ }
  return structuredClone(DEFAULT_SAVE);
}
const save = loadSave();
function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* ignorieren */ }
}
setMuted(save.muted);

// ---------- Renderer & Szene ----------
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const skyCanvas = document.createElement('canvas');
skyCanvas.width = 2; skyCanvas.height = 256;
const skyTex = new THREE.CanvasTexture(skyCanvas);
skyTex.colorSpace = THREE.SRGBColorSpace;
scene.background = skyTex;
scene.fog = new THREE.Fog('#bfe3ff', 70, 170);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
const hemi = new THREE.HemisphereLight('#ffffff', '#6d8fb0', 1.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff4e0', 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 90 });
sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);

const sea = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshLambertMaterial({ color: '#3a8fd8' }));
sea.rotation.x = -Math.PI / 2;
sea.position.y = -45;
scene.add(sea);

const PARKOUR_THEME = { sky: ['#1f7fe0', '#7cc4ff', '#d9f0ff'], fog: '#bfe3ff', sea: '#3a8fd8', seaY: -45, fogNear: 70, fogFar: 170 };
function setTheme(t) {
  const g = skyCanvas.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, t.sky[0]);
  grad.addColorStop(0.55, t.sky[1]);
  grad.addColorStop(1, t.sky[2]);
  g.fillStyle = grad;
  g.fillRect(0, 0, 2, 256);
  skyTex.needsUpdate = true;
  scene.fog.color.set(t.fog);
  scene.fog.near = t.fogNear ?? 90;
  scene.fog.far = t.fogFar ?? 230;
  sea.material.color.set(t.sea);
  sea.position.y = t.seaY ?? -0.8;
  const L = t.light || {};
  hemi.intensity = L.hemi ?? 1.6;
  hemi.color.set(L.sky || '#ffffff');
  hemi.groundColor.set(L.ground || '#6d8fb0');
  sun.intensity = L.sun ?? 2.2;
  sun.color.set(L.sunColor || '#fff4e0');
}

const avatar = new Avatar(save.outfit);
scene.add(avatar.group);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = camera.aspect < 1 ? 72 : 60;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------- Konfetti ----------
const confetti = [];
{
  const geo = new THREE.BoxGeometry(0.18, 0.18, 0.05);
  const cols = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#f15bb5', '#ffffff'];
  for (let i = 0; i < 90; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cols[i % cols.length] }));
    m.visible = false;
    scene.add(m);
    confetti.push({ m, v: new THREE.Vector3(), life: 0 });
  }
}
function burst(pos, n = 40) {
  let k = 0;
  for (const c of confetti) {
    if (c.life > 0) continue;
    c.m.position.copy(pos);
    c.v.set((Math.random() - 0.5) * 10, 6 + Math.random() * 8, (Math.random() - 0.5) * 10);
    c.life = 1.4 + Math.random() * 0.6;
    c.m.visible = true;
    if (++k >= n) break;
  }
}
function updateConfetti(dt) {
  for (const c of confetti) {
    if (c.life <= 0) continue;
    c.life -= dt;
    c.v.y -= 20 * dt;
    c.m.position.addScaledVector(c.v, dt);
    c.m.rotation.x += dt * 8;
    c.m.rotation.y += dt * 6;
    if (c.life <= 0) c.m.visible = false;
  }
}

// ---------- Spieler & Physik ----------
const SPEED = 7.5, JUMP = 14.5, GRAVITY = 38, R = 0.4, H = 2.3;
const player = {
  pos: new THREE.Vector3(),
  vel: new THREE.Vector3(),
  grounded: false,
  ground: null,
  coyote: 0,
  jumpBuffer: 0,
  facing: Math.PI,
  checkpoint: new THREE.Vector3(),
  lastSafe: null,
};

let stage = null;   // aktuelles Parkour-Level oder aktuelle Welt
let state = 'menu';
let time = 0;
let run = null;     // Statistik des laufenden Levels
let streak = 0;
let ride = null, rideT = 0;
const cam = { yaw: 0, pitch: 0.38, dist: 10 };

const input = new Input({ canvas, joyZone: $('joy-zone'), joyBase: $('joy-base'), joyKnob: $('joy-knob'), jumpBtn: $('btn-jump') });

function overlaps(min, max) {
  const p = player.pos;
  return p.x + R > min.x && p.x - R < max.x && p.y + H > min.y && p.y < max.y && p.z + R > min.z && p.z - R < max.z;
}
const solidActive = (s) => !s.gone;

function moveAxis(axis, d, wasGrounded) {
  const p = player.pos;
  p[axis] += d;
  let landed = null;
  for (const s of stage.solids) {
    if (!solidActive(s) || !overlaps(s.min, s.max)) continue;
    if (axis === 'y') {
      if (d <= 0) { p.y = s.max.y; player.vel.y = 0; landed = s; } else { p.y = s.min.y - H - 1e-3; player.vel.y = Math.min(player.vel.y, 0); }
      continue;
    }
    // Kleine Kanten automatisch hochsteigen
    const step = s.max.y - p.y;
    if (wasGrounded && step > 0 && step <= 0.55) {
      const oldY = p.y;
      p.y = s.max.y + 1e-3;
      if (!stage.solids.some((o) => o !== s && solidActive(o) && overlaps(o.min, o.max))) continue;
      p.y = oldY;
    }
    if (d > 0) p[axis] = s.min[axis] - R - 1e-3;
    else if (d < 0) p[axis] = s.max[axis] + R + 1e-3;
    player.vel[axis] = 0;
  }
  if (stage.terr) {
    const h = terrainTop();
    if (axis === 'y') {
      if (p.y < h) { p.y = h; player.vel.y = Math.max(0, player.vel.y); if (d <= 0) landed = TERRAIN; }
    } else if (h > p.y + 1e-3) {
      // Gelände: Stufen bis TERRAIN_STEP hochlaufen, höhere Kanten blockieren
      if (h - p.y <= (wasGrounded ? TERRAIN_STEP : 0.35)) p.y = h;
      else { p[axis] -= d; player.vel[axis] = 0; }
    }
  }
  return landed;
}

const TERRAIN = { safe: true, terrain: true };
const TERRAIN_STEP = 1.05;
function terrainTop() {
  const p = player.pos, r = R - 0.05;
  return Math.max(stage.heightAt(p.x - r, p.z - r), stage.heightAt(p.x + r, p.z - r), stage.heightAt(p.x - r, p.z + r), stage.heightAt(p.x + r, p.z + r));
}

// Bewegte Plattformen schieben den Spieler aus sich heraus
function depenetrate() {
  const p = player.pos;
  for (const s of stage.solids) {
    if (!s.moving || !overlaps(s.min, s.max)) continue;
    const opts = [
      [s.max.y - p.y, 'up'],
      [p.x + R - s.min.x, '-x'], [s.max.x - (p.x - R), '+x'],
      [p.z + R - s.min.z, '-z'], [s.max.z - (p.z - R), '+z'],
    ].sort((a, b) => a[0] - b[0]);
    const [amt, dir] = opts[0];
    if (dir === 'up') { p.y += amt; player.vel.y = Math.max(0, player.vel.y); player.ground = s; }
    else if (dir === '-x') p.x -= amt + 1e-3;
    else if (dir === '+x') p.x += amt + 1e-3;
    else if (dir === '-z') p.z -= amt + 1e-3;
    else p.z += amt + 1e-3;
  }
}

function respawn() {
  player.pos.copy(stage.isWorld && player.lastSafe ? player.lastSafe : player.checkpoint);
  player.vel.set(0, 0, 0);
  player.ground = null;
  player.grounded = false;
}

function die() {
  if (run) run.falls++;
  sfx.die();
  vibrate(120);
  const f = $('flash');
  f.classList.add('on');
  requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('on')));
  respawn();
}

let safeTimer = 0;
function stepPlayer(dt) {
  // Mitfahren auf bewegten Plattformen
  const g = player.ground;
  if (g && g.delta && player.grounded) player.pos.add(g.delta);
  if (g && g.vanish && g.vanish.timer < 0 && player.grounded) g.vanish.timer = 0;
  depenetrate();

  const mv = state === 'play' ? input.getMove() : { x: 0, y: 0 };
  const fwd = new THREE.Vector3(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw));
  const right = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw));
  const dir = fwd.multiplyScalar(mv.y).add(right.multiplyScalar(mv.x));
  // Auf Eis rutscht man
  const accel = player.grounded ? (g && g.ice ? 2.2 : 16) : 7;
  const k = Math.min(1, accel * dt);
  player.vel.x += (dir.x * SPEED - player.vel.x) * k;
  player.vel.z += (dir.z * SPEED - player.vel.z) * k;
  if (dir.lengthSq() > 0.01) {
    const target = Math.atan2(dir.x, dir.z);
    let diff = target - player.facing;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    player.facing += diff * Math.min(1, dt * 14);
  }

  if (state === 'play' && input.consumeJump()) player.jumpBuffer = 0.15;
  player.jumpBuffer -= dt;
  player.coyote = player.grounded ? 0.12 : player.coyote - dt;
  if (player.jumpBuffer > 0 && player.coyote > 0) {
    player.vel.y = stage.jump ?? JUMP;
    player.jumpBuffer = 0;
    player.coyote = 0;
    player.grounded = false;
    player.ground = null;
    sfx.jump();
  }
  player.vel.y = Math.max(player.vel.y - (stage.gravity ?? GRAVITY) * dt, -45);

  const wasGrounded = player.grounded;
  const fallSpeed = player.vel.y;
  const steps = 3, h = dt / steps;
  let landed = null;
  for (let i = 0; i < steps; i++) {
    moveAxis('x', player.vel.x * h, wasGrounded);
    moveAxis('z', player.vel.z * h, wasGrounded);
    landed = moveAxis('y', player.vel.y * h, wasGrounded) || (player.vel.y === 0 ? landed : null);
  }
  player.grounded = !!landed;
  player.ground = landed;
  if (landed && !wasGrounded && fallSpeed < -12) sfx.land();
  // Letzte sichere Stelle merken (offene Welten)
  safeTimer -= dt;
  if (landed && landed.safe && safeTimer <= 0) {
    safeTimer = 0.4;
    (player.lastSafe ??= new THREE.Vector3()).copy(player.pos);
  }
}

// Bereich verlassen? Dann darf derselbe Auslöser wieder reagieren
function inZone(obj, zone) {
  const hit = overlaps(zone.min, zone.max);
  if (obj.cooldown && !hit) obj.cooldown = false;
  return hit && !obj.cooldown;
}

function checkWorld() {
  const p = player.pos;
  if (p.y < (stage.killY ?? stage.minY - 18)) return die();
  for (const k of stage.kills) if (overlaps(k.min, k.max)) return die();

  const center = p.clone(); center.y += 1.1;
  for (const c of stage.coins) {
    if (!c.taken && c.mesh.position.distanceToSquared(center) < 1.6) {
      c.taken = true;
      addCoins(1);
      run.coins++;
      sfx.coin();
    }
  }
  for (const g of stage.gates) {
    if (!g.open && overlaps(g.trigger.min, g.trigger.max)) return openTask({ type: 'gate', gate: g });
  }
  for (const ch of stage.chests) {
    const d = Math.hypot(p.x - ch.pos.x, p.z - ch.pos.z);
    if (ch.cooldown && d > 2.6) ch.cooldown = false;
    if (ch.state === 'closed' && !ch.cooldown && d < 1.7 && Math.abs(p.y - ch.pos.y) < 1.5) return openTask({ type: 'chest', chest: ch });
  }
  if (stage.finish && overlaps(stage.finish.min, stage.finish.max)) return levelComplete();
  if (!stage.isWorld) return;

  for (const s of stage.stars) {
    if (!s.got && s.pos.distanceToSquared(center) < 2.6) collectStar(s);
  }
  for (const pt of stage.portals) {
    const hit = stage.portalHit(pt, p);
    if (pt.cooldown && !hit) pt.cooldown = false;
    if (!hit || pt.cooldown) continue;
    if (pt.free) return travel(pt.target);
    return openTask({ type: 'portal', portal: pt });
  }
  for (const r of stage.rides) {
    if (inZone(r, r.station)) return openTask({ type: 'ride', ride: r });
  }
  for (const a of stage.animals) {
    if (!a.feed || a.feed.fed) continue;
    const d = Math.hypot(p.x - a.g.position.x, p.z - a.g.position.z);
    if (a.cooldown && d > 3) a.cooldown = false;
    if (!a.cooldown && d < 1.9 && Math.abs(p.y - a.g.position.y) < 2.6) return openTask({ type: 'feed', animal: a });
  }
}

// ---------- Kamera ----------
const camTarget = new THREE.Vector3();
const seatPos = new THREE.Vector3(), seatFwd = new THREE.Vector3(), seatQuat = new THREE.Quaternion();
const rideCam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
function updateCamera(dt, snap = false) {
  const look = input.consumeLook();
  if (state === 'play') {
    cam.yaw -= look.dx * 0.0075;
    cam.pitch = THREE.MathUtils.clamp(cam.pitch + look.dy * 0.005, -0.15, 1.25);
    cam.dist = THREE.MathUtils.clamp(cam.dist + input.consumeZoom(), 5, 18);
  }
  if (state === 'ride' && ride) {
    if (ride.camera) ride.camera(seatPos, seatFwd, rideCam);
    else {
      const flat = seatFwd.clone(); flat.y = 0; flat.normalize();
      rideCam.pos.copy(seatPos).addScaledVector(flat, -7).add(new THREE.Vector3(0, 3.5, 0));
      rideCam.look.copy(seatPos).addScaledVector(flat, 3).add(new THREE.Vector3(0, 1.2, 0));
    }
    camera.position.lerp(rideCam.pos, snap ? 1 : 1 - Math.exp(-dt * 6));
    camera.lookAt(rideCam.look);
  } else {
    const dist = cam.dist * (camera.aspect < 1 ? 1.25 : 1);
    camTarget.copy(player.pos).add(new THREE.Vector3(0, 2, 0));
    const want = new THREE.Vector3(
      Math.sin(cam.yaw) * Math.cos(cam.pitch),
      Math.sin(cam.pitch),
      Math.cos(cam.yaw) * Math.cos(cam.pitch),
    ).multiplyScalar(dist).add(camTarget);
    if (snap) camera.position.copy(want);
    else camera.position.lerp(want, 1 - Math.exp(-dt * 14));
    const lookAt = camTarget.clone();
    if (state === 'shop') {
      // Avatar links bzw. oben im Bild, damit der Shop Platz hat
      const right = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw));
      lookAt.addScaledVector(right, camera.aspect > 1 ? 2.2 : 0).add(new THREE.Vector3(0, camera.aspect > 1 ? -0.6 : -4.3, 0));
    }
    camera.lookAt(lookAt);
  }
  const focus = state === 'ride' ? seatPos : player.pos;
  sun.position.copy(focus).add(new THREE.Vector3(14, 30, 10));
  sun.target.position.copy(focus);
}

// ---------- Level & Welten laden ----------
function clearStage() {
  if (stage) stage.dispose();
  stage = null;
  player.lastSafe = null;
  run = { coins: 0, tasks: 0, correct: 0, mistakes: 0, falls: 0, start: performance.now() };
  streak = 0;
  ride = null;
}

function loadLevel(n) {
  clearStage();
  setTheme(PARKOUR_THEME);
  stage = new Level(scene, n);
  stage.minY = Math.min(...stage.solids.map((s) => s.max.y));
  player.checkpoint.copy(stage.spawn);
  respawn();
  player.facing = Math.PI;
  Object.assign(cam, { yaw: 0, pitch: 0.38, dist: 10 });
  updateHud();
}

function loadWorld(id) {
  clearStage();
  const def = WORLDS[id];
  setTheme(def.theme);
  stage = new World(scene, def, save.worldStars[id] || [], { worldStars: save.worldStars, level: save.level });
  stage.gravity = def.gravity;
  stage.jump = def.jump;
  player.checkpoint.copy(stage.spawn);
  respawn();
  player.facing = stage.spawnYaw + Math.PI;
  Object.assign(cam, { yaw: stage.spawnYaw, pitch: 0.32, dist: 10 });
  save.place = id;
  persist();
  updateHud();
}

// Reise durch ein Portal
function travel(target) {
  sfx.open();
  const from = stage ? (stage.isWorld ? stage.id : 'parkour') : null;
  if (target === 'parkour') { startParkour(save.level); return; }
  loadWorld(target);
  // Zurück auf der Insel: vor dem Portal der Welt herauskommen, aus der man kommt
  if (WORLDS[target].isHub && from) {
    const pt = stage.portals.find((p) => p.target === from || (from === 'parkour' && p.target === 'parkour'));
    if (pt) {
      pt.cooldown = true;
      player.pos.copy(pt.front);
      player.checkpoint.copy(pt.front);
      cam.yaw = pt.angle + Math.PI;
      player.facing = pt.angle;
    }
  }
  updateCamera(0, true);
  setState('play');
  show('hud');
  toast(WORLDS[target].name);
}

// ---------- HUD ----------
function addCoins(n) {
  save.coins += n;
  persist();
  $('hud-coins').textContent = save.coins;
}

function totalStars() { return THEME_WORLDS.reduce((s, id) => s + (save.worldStars[id] || []).length, 0); }
const MAX_STARS = THEME_WORLDS.reduce((s, id) => s + Object.keys(WORLDS[id].stars || {}).length, 0);

function updateHud() {
  $('hud-coins').textContent = save.coins;
  const gates = $('hud-gates');
  if (stage.isWorld) {
    $('hud-level').textContent = stage.name;
    if (stage.def.isHub) gates.innerHTML = `<i class="open wide">★ ${totalStars()} / ${MAX_STARS}</i>`;
    else gates.innerHTML = Object.keys(stage.def.stars).map((id) => `<i class="${stage.collected.has(id) ? 'open' : ''}">★</i>`).join('');
  } else {
    $('hud-level').textContent = `Level ${stage.number} · Klasse ${save.grade}`;
    gates.innerHTML = stage.gates.map((g) => `<i class="${g.open ? 'open' : ''}">${g.open ? '✓' : g.index + 1}</i>`).join('');
  }
  const st = $('hud-streak');
  st.hidden = streak < 2;
  st.textContent = `${streak}er-Serie!`;
}

let toastTimer = 0;
function toast(text, ms = 1500) {
  const t = $('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

// ---------- Bildschirme ----------
const screens = ['menu', 'levels', 'shop', 'hud', 'task', 'pause', 'done'];
function show(...ids) {
  for (const s of screens) $(s).hidden = !ids.includes(s);
}

function setState(s) {
  state = s;
  $('hud').classList.toggle('riding', s === 'ride');
  input.enabled = s === 'play';
  if (s !== 'play') input.reset();
}

const isTouch = window.matchMedia('(pointer: coarse)').matches;
if (!isTouch) $('hud-hint').textContent = 'WASD / Pfeile laufen · Leertaste springen · Maus ziehen zum Umschauen';

function enterFullscreen() {
  unlockAudio();
  if (!isTouch) return;
  try {
    const fs = document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
    fs?.then(() => screen.orientation?.lock?.('landscape')).catch(() => {});
  } catch { /* Vollbild nicht erlaubt */ }
}

function beginPlay(label) {
  updateCamera(0, true);
  setState('play');
  show('hud');
  const hint = $('hud-hint');
  hint.style.opacity = '1';
  setTimeout(() => { hint.style.opacity = '0'; }, 7000);
  toast(label);
}

function startParkour(n = save.level) {
  enterFullscreen();
  save.level = n;
  persist();
  loadLevel(n);
  beginPlay(`Level ${n}`);
}

function startAdventure() {
  enterFullscreen();
  if (!stage || stage.id !== 'hub') loadWorld('hub');
  else { respawn(); Object.assign(cam, { yaw: 0, pitch: 0.32, dist: 10 }); player.facing = Math.PI; }
  beginPlay('Mathe-Insel');
}

let reloadOnMenu = false;
function goMenu() {
  if (reloadOnMenu) { location.reload(); return; }
  setState('menu');
  if (!stage || stage.id !== 'hub') loadWorld('hub');
  player.lastSafe = null;
  respawn();
  renderMenu();
  show('menu');
}

// ---------- Menü ----------
const DIFF_NAMES = ['Leicht', 'Mittel', 'Schwer'];
function renderMenu() {
  const gg = $('grade-grid');
  gg.innerHTML = GRADES.map(({ grade }) => `<button type="button" role="radio" aria-checked="${grade === save.grade}" data-g="${grade}">${grade}</button>`).join('');
  $('grade-topic').textContent = GRADES[save.grade - 1].topics;
  for (const b of $('diff-seg').children) b.setAttribute('aria-checked', String(Number(b.dataset.v) === save.difficulty));
  for (const b of $('mode-seg').children) b.setAttribute('aria-checked', String(b.dataset.v === save.mode));
  $('play-level').textContent = `★ ${totalStars()} / ${MAX_STARS}`;
  $('menu-coins').textContent = save.coins;
  const { solved, correct } = save.stats;
  $('menu-stats').textContent = solved ? `${solved} Aufgaben · ${Math.round((correct / solved) * 100)} % richtig` : 'Noch keine Aufgaben gelöst';
  $('btn-sound').textContent = save.muted ? '🔇' : '🔊';
}

$('grade-grid').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  save.grade = Number(b.dataset.g);
  persist();
  sfx.click();
  renderMenu();
});
$('diff-seg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  save.difficulty = Number(b.dataset.v);
  persist();
  renderMenu();
});
$('mode-seg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  save.mode = b.dataset.v;
  persist();
  renderMenu();
});
$('btn-play').addEventListener('click', () => startAdventure());
$('btn-sound').addEventListener('click', () => {
  save.muted = !save.muted;
  setMuted(save.muted);
  persist();
  unlockAudio();
  renderMenu();
});

// Parkour-Level-Auswahl
$('btn-levels').addEventListener('click', () => {
  const total = Math.max(20, save.unlocked + 5);
  let html = '';
  for (let i = 1; i <= total; i++) {
    const st = save.stars[i] || 0;
    const locked = i > save.unlocked;
    html += `<button type="button" data-l="${i}" ${locked ? 'disabled' : ''} class="${i === save.level ? 'current' : ''}">${locked ? '🔒' : i}<small>${'★'.repeat(st)}</small></button>`;
  }
  $('level-grid').innerHTML = html;
  $('levels-info').textContent = `Freigeschaltet bis Level ${save.unlocked}. Jedes Level hat neue Hindernisse.`;
  show('levels');
});
$('level-grid').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  startParkour(Number(b.dataset.l));
});
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => goMenu()));

// ---------- Shop ----------
let shopTab = 'hat';
function renderShop() {
  $('shop-coins').textContent = save.coins;
  for (const t of $('shop-tabs').children) t.setAttribute('aria-selected', String(t.dataset.tab === shopTab));
  $('shop-grid').innerHTML = SHOP[shopTab].map((it) => {
    const key = `${shopTab}:${it.id}`;
    const owned = it.price === 0 || save.owned.includes(key);
    const on = save.outfit[shopTab] === it.id;
    const swatch = shopTab === 'hat'
      ? `<span class="sw" style="background:#eef4fb">${it.icon}</span>`
      : `<span class="sw" style="background:${it.id === 'gold' ? 'linear-gradient(135deg,#fff3b0,#ffc531 50%,#d99a00)' : it.id}"></span>`;
    const price = owned ? `<span class="price owned">${on ? 'An' : 'Gekauft'}</span>` : `<span class="price">${it.price} Münzen</span>`;
    return `<button type="button" class="shop-item" data-id="${it.id}" aria-pressed="${on}">${swatch}<span>${it.name}</span>${price}</button>`;
  }).join('');
}
$('btn-shop').addEventListener('click', () => {
  unlockAudio();
  setState('shop');
  $('shop-msg').textContent = '';
  renderShop();
  show('shop');
});
$('shop-tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  shopTab = b.dataset.tab;
  $('shop-msg').textContent = '';
  renderShop();
});
$('shop-grid').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const it = SHOP[shopTab].find((x) => x.id === b.dataset.id);
  const key = `${shopTab}:${it.id}`;
  const owned = it.price === 0 || save.owned.includes(key);
  const msg = $('shop-msg');
  if (!owned) {
    if (save.coins < it.price) {
      msg.textContent = `Dir fehlen noch ${it.price - save.coins} Münzen. Löse Aufgaben, um mehr zu sammeln!`;
      sfx.wrong();
      return;
    }
    save.coins -= it.price;
    save.owned.push(key);
    msg.textContent = `${it.name} gekauft!`;
    sfx.right();
  } else {
    msg.textContent = '';
    sfx.click();
  }
  save.outfit[shopTab] = it.id;
  persist();
  avatar.build(save.outfit);
  renderShop();
});

// ---------- Aufgaben ----------
let task = null;      // aktuelle Aufgabe
let taskCtx = null;   // {type: gate|chest|portal|ride|feed, …}
let typed = '';
let answered = false;

function openTask(ctx) {
  taskCtx = ctx;
  setState('task');
  player.vel.set(0, player.vel.y > 0 ? 0 : player.vel.y, 0);
  newTask();
  show('hud', 'task');
}

// Bei falscher Antwort gibt es eine neue Aufgabe (Tore, Portale, Fahrten) oder es geht einfach weiter
const retryTypes = new Set(['gate', 'portal', 'ride']);

function newTask() {
  // Bonus-Truhen sind eine Stufe schwerer (bis maximal "schwer")
  const diff = taskCtx.type === 'chest' ? Math.min(2, save.difficulty + 1) : save.difficulty;
  task = generateTask(save.grade, diff);
  answered = false;
  typed = '';
  renderTask();
}

function taskTitle() {
  const c = taskCtx;
  switch (c.type) {
    case 'gate': return stage.isWorld ? [`Tor: ${c.gate.label}`, ''] : [`Mathe-Tor ${c.gate.index + 1} von ${stage.gates.length}`, ''];
    case 'chest': return ['Bonus-Truhe · +25', 'bonus'];
    case 'portal': return [`Eintrittskarte: ${c.portal.label}`, 'ticket'];
    case 'ride': return [`Fahrkarte: ${c.ride.name}`, 'ticket'];
    case 'feed': return [`Füttere ${ANIMAL_NAMES[c.animal.kind] || 'das Tier'}`, 'feed'];
    default: return ['Aufgabe', ''];
  }
}

const KEYS = ['7', '8', '9', '⌫', '4', '5', '6', '−', '1', '2', '3', '/', ',', '0', 'OK'];
function renderTask() {
  const [title, cls] = taskTitle();
  const badge = $('task-title');
  badge.textContent = title;
  badge.className = `task-badge ${cls}`;
  const q = $('task-q');
  q.innerHTML = task.question;
  q.classList.toggle('long', q.textContent.length > 20);
  $('task-feedback').hidden = true;
  const typing = save.mode === 'type';
  $('task-choices').hidden = typing;
  $('task-keypad').hidden = !typing;
  $('task-input').hidden = !typing;
  if (typing) {
    $('task-prefix').textContent = task.prefix || '';
    $('task-unit').textContent = task.unit || '';
    $('task-typed').textContent = '';
    $('task-keypad').innerHTML = KEYS.map((k) => {
      const kc = k === 'OK' ? 'ok' : ['⌫', '−', '/', ','].includes(k) ? 'fn' : '';
      return `<button type="button" class="${kc}" data-k="${k}">${k}</button>`;
    }).join('');
  } else {
    $('task-choices').innerHTML = task.choices.map((c, i) => `<button type="button" class="choice" data-i="${i}">${c.html}</button>`).join('');
  }
}

function pressKey(k) {
  if (answered) return;
  sfx.click();
  if (k === 'OK') return submitTyped();
  if (k === '⌫') typed = typed.slice(0, -1);
  else if (k === '−') typed = typed.startsWith('−') ? typed.slice(1) : '−' + typed;
  else if (typed.length < 10) typed += k;
  $('task-typed').textContent = typed;
}

function submitTyped() {
  if (!typed) return;
  finishAnswer(checkTyped(task, typed));
}

$('task-keypad').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) pressKey(b.dataset.k);
});
$('task-choices').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || answered) return;
  const c = task.choices[Number(b.dataset.i)];
  for (const [i, el] of [...$('task-choices').children].entries()) {
    el.disabled = true;
    if (task.choices[i].correct) el.classList.add('right');
  }
  if (!c.correct) b.classList.add('wrong');
  finishAnswer(c.correct);
});
window.addEventListener('keydown', (e) => {
  if (state !== 'task' || save.mode !== 'type' || answered) return;
  if (/^[0-9]$/.test(e.key)) pressKey(e.key);
  else if (e.key === ',' || e.key === '.') pressKey(',');
  else if (e.key === '-') pressKey('−');
  else if (e.key === '/') pressKey('/');
  else if (e.key === 'Backspace') pressKey('⌫');
  else if (e.key === 'Enter') pressKey('OK');
});

function rewardFor(type) {
  if (type === 'chest') return 25;
  if (type === 'feed') return 5 + Math.min(streak - 1, 5);
  return 10 + Math.min(streak - 1, 5) * 2;
}

function finishAnswer(correct) {
  answered = true;
  run.tasks++;
  save.stats.solved++;
  const fb = $('task-feedback');
  fb.hidden = false;
  if (correct) {
    run.correct++;
    save.stats.correct++;
    streak++;
    const bonus = rewardFor(taskCtx.type);
    addCoins(bonus);
    sfx.right();
    fb.innerHTML = `<p class="big good">${pick(['Super!', 'Richtig!', 'Klasse!', 'Stark!', 'Genau!'])}</p><p>+${bonus} Münzen${streak >= 2 ? ` · ${streak}er-Serie` : ''}</p>`;
    setTimeout(() => solved(), 900);
  } else {
    run.mistakes++;
    streak = 0;
    sfx.wrong();
    vibrate([60, 40, 60]);
    if (save.mode === 'type') $('task-typed').textContent = typed;
    const explain = task.explain ? `<p class="explain">${task.explain}</p>` : '';
    const retry = retryTypes.has(taskCtx.type);
    fb.innerHTML = `<p class="big bad">Leider falsch</p><p>Richtig ist: <b>${task.prefix ? task.prefix + ' ' : ''}${task.answerHtml}${task.unit ? ' ' + task.unit : ''}</b></p>${explain}`
      + `<button type="button" class="btn ${retry ? 'btn-blue' : 'btn-ghost'}" id="task-retry">${retry ? 'Neue Aufgabe' : 'Weiter'}</button>`;
    $('task-keypad').hidden = true;
    $('task-retry').addEventListener('click', () => {
      if (retry) newTask();
      else { if (taskCtx.type === 'chest') lockChest(taskCtx.chest); closeTask(); }
    });
    $('task-retry').focus();
  }
  persist();
  updateHud();
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function solved() {
  if (state !== 'task') return;
  const c = taskCtx;
  switch (c.type) {
    case 'gate': {
      const g = c.gate;
      stage.openGate(g);
      player.checkpoint.copy(g.checkpoint);
      if (stage.isWorld) (player.lastSafe ??= new THREE.Vector3()).copy(g.checkpoint);
      burst(g.door.mesh.position.clone(), 50);
      sfx.open();
      toast(stage.isWorld ? `${g.label} ist offen!` : 'Tor offen! Checkpoint ✓');
      break;
    }
    case 'chest': {
      const ch = c.chest;
      ch.state = 'open';
      ch.label.visible = false;
      burst(ch.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 40);
      toast('+25 Münzen!');
      break;
    }
    case 'feed':
      stage.feedAnimal(c.animal);
      toast('Mjam! Danke!');
      break;
    case 'portal':
      taskCtx = null;
      travel(c.portal.target);
      return;
    case 'ride':
      taskCtx = null;
      startRide(c.ride);
      return;
    default:
      break;
  }
  closeTask(false);
}

function lockChest(ch) {
  ch.state = 'locked';
  ch.lid.material = ch.lid.material.clone();
  ch.lid.material.color.set('#7d8590');
  ch.lid.material.emissive.set('#000000');
  ch.label.visible = false;
}

function closeTask(pushBack = true) {
  const c = taskCtx;
  if (pushBack && c) {
    if (c.type === 'gate') {
      // Ein Stück zurück, damit sich das Tor nicht sofort wieder meldet
      if (c.gate.outside) { player.pos.x = c.gate.outside.x; player.pos.z = c.gate.outside.z; }
      else player.pos.z = c.gate.trigger.max.z + R + 0.3;
    }
    if (c.type === 'chest') c.chest.cooldown = true;
    if (c.type === 'portal') c.portal.cooldown = true;
    if (c.type === 'ride') c.ride.cooldown = true;
    if (c.type === 'feed') c.animal.cooldown = true;
  }
  taskCtx = null;
  setState('play');
  show('hud');
  updateHud();
}
$('task-close').addEventListener('click', () => closeTask(true));

// ---------- Fahrgeschäfte ----------
function startRide(r) {
  ride = r;
  rideT = 0;
  setState('ride');
  show('hud');
  sfx.open();
  toast(`${r.name} – los geht's!`);
  stage.update(0, time, ride, 0);
  r.seat.updateWorldMatrix(true, false);
  r.seat.getWorldPosition(seatPos);
  r.seat.getWorldDirection(seatFwd);
  updateCamera(0, true);
}

function endRide() {
  const r = ride;
  ride = null;
  avatar.group.rotation.set(0, 0, 0);
  player.pos.copy(r.exit);
  player.vel.set(0, 0, 0);
  player.checkpoint.copy(r.exit);
  (player.lastSafe ??= new THREE.Vector3()).copy(r.exit);
  r.cooldown = true;
  setState('play');
  const s = stage.stars.find((x) => x.id === r.starId);
  if (s && !s.got) collectStar(s);
  else toast('Das war toll!');
}

// ---------- Sterne ----------
function collectStar(s) {
  stage.collectStar(s);
  const list = (save.worldStars[stage.id] ||= []);
  if (!list.includes(s.id)) list.push(s.id);
  addCoins(20);
  sfx.win();
  burst(s.pos.clone(), 70);
  const total = Object.keys(stage.def.stars).length;
  toast(`★ ${s.label}! (${list.length}/${total})`, 2200);
  persist();
  updateHud();
  if (list.length >= total && !save.worldDone[stage.id]) {
    save.worldDone[stage.id] = true;
    addCoins(100);
    persist();
    setTimeout(() => showWorldDone(), 1600);
  }
}

// ---------- Level-Ende ----------
let doneMode = 'parkour';
function levelComplete() {
  setState('done');
  doneMode = 'parkour';
  sfx.win();
  burst(stage.finish.trophy.position.clone().add(new THREE.Vector3(0, 2.5, 0)), 90);
  const stars = run.mistakes === 0 ? 3 : run.mistakes <= 2 ? 2 : 1;
  const reward = 20 + stars * 10;
  addCoins(reward);
  const n = stage.number;
  save.stars[n] = Math.max(save.stars[n] || 0, stars);
  save.unlocked = Math.max(save.unlocked, n + 1);
  save.level = n + 1;
  persist();
  const secs = Math.round((performance.now() - run.start) / 1000);
  $('done-title').textContent = stars === 3 ? 'Perfekt gelöst!' : 'Level geschafft!';
  $('done-stars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">★</span>`).join('');
  $('done-stats').innerHTML = `
    <dt>Aufgaben richtig</dt><dd>${run.correct} von ${run.tasks}</dd>
    <dt>Münzen gesammelt</dt><dd>${run.coins}</dd>
    <dt>Ziel-Bonus</dt><dd>+${reward}</dd>
    <dt>Zeit</dt><dd>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</dd>
    <dt>Abgestürzt</dt><dd>${run.falls}×</dd>`;
  $('btn-next').textContent = `Weiter zu Level ${n + 1}`;
  $('btn-done-menu').textContent = 'Zur Mathe-Insel';
  setTimeout(() => { if (state === 'done') show('done'); }, 1100);
}

function showWorldDone() {
  if (state !== 'play') { setTimeout(showWorldDone, 800); return; }
  setState('done');
  doneMode = 'world';
  sfx.win();
  burst(player.pos.clone().add(new THREE.Vector3(0, 2, 0)), 90);
  $('done-title').textContent = `${stage.name} geschafft!`;
  $('done-stars').innerHTML = '<span class="on">★</span><span class="on">★</span><span class="on">★</span>';
  $('done-stats').innerHTML = `
    <dt>Sterne</dt><dd>${stage.collected.size} von ${Object.keys(stage.def.stars).length}</dd>
    <dt>Welt-Bonus</dt><dd>+100</dd>
    <dt>Alle Welten</dt><dd>★ ${totalStars()} / ${MAX_STARS}</dd>`;
  $('btn-next').textContent = 'Weiter erkunden';
  $('btn-done-menu').textContent = 'Zur Mathe-Insel';
  show('done');
}

$('btn-next').addEventListener('click', () => {
  if (doneMode === 'parkour') startParkour(save.level);
  else { setState('play'); show('hud'); }
});
$('btn-done-menu').addEventListener('click', () => travel('hub'));

// ---------- Pause ----------
function pause() {
  if (state !== 'play') return;
  setState('pause');
  const where = stage.isWorld ? stage.name : `Level ${stage.number}`;
  $('pause-info').textContent = `${where} · Klasse ${save.grade} · ${DIFF_NAMES[save.difficulty]}`;
  $('btn-restart').hidden = !!stage.isWorld;
  $('btn-hub').hidden = stage.id === 'hub';
  show('hud', 'pause');
}
$('btn-pause').addEventListener('click', pause);
$('btn-resume').addEventListener('click', () => { setState('play'); show('hud'); });
$('btn-respawn').addEventListener('click', () => { respawn(); setState('play'); show('hud'); });
$('btn-restart').addEventListener('click', () => startParkour(stage.number));
$('btn-hub').addEventListener('click', () => travel('hub'));
$('btn-menu').addEventListener('click', () => goMenu());
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (state === 'play') pause(); else if (state === 'pause') { setState('play'); show('hud'); } } });

// iOS: Zoom-Gesten unterbinden
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

// ---------- Hauptschleife ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;
  if (stage) {
    if (state === 'ride') rideT += dt;
    stage.focus = camera.position;
    if (state !== 'pause') stage.update(dt, time, ride, rideT);
    if (state === 'play') {
      stepPlayer(dt);
      checkWorld();
    } else if (state === 'task' || state === 'done') {
      stepPlayer(dt); // Schwerkraft weiterlaufen lassen, aber ohne Eingabe
    }
    if (state === 'menu' || state === 'shop') {
      // Kamera kreist im Menü langsam um den Avatar, im Shop steht sie still
      if (state === 'menu') cam.yaw += dt * 0.25;
      cam.pitch = 0.22;
      cam.dist = state === 'shop' ? 6 : 9;
      player.facing = cam.yaw;
    }
    if (state === 'ride' && ride) {
      ride.seat.getWorldPosition(seatPos);
      ride.seat.getWorldDirection(seatFwd);
      ride.seat.getWorldQuaternion(seatQuat);
      avatar.group.position.copy(seatPos);
      avatar.group.quaternion.copy(seatQuat);
      avatar.sit(dt, time);
      player.pos.copy(seatPos);
      if (rideT >= ride.duration) endRide();
    } else {
      const speed = Math.hypot(player.vel.x, player.vel.z);
      avatar.group.position.copy(player.pos);
      avatar.group.rotation.set(0, player.facing, 0);
      avatar.animate(dt, state === 'menu' || state === 'shop' ? 0 : speed, !player.grounded && state !== 'menu' && state !== 'shop', time);
    }
    updateCamera(dt);
  }
  updateConfetti(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---------- Start ----------
const fontsReady = document.fonts?.ready ?? Promise.resolve();
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(() => {
  goMenu();
  updateCamera(0, true);
  requestAnimationFrame(frame);
});

if ('serviceWorker' in navigator && window.isSecureContext && !location.hostname.endsWith('claude.ai')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // Beim Zurückkehren in die App nach einer neuen Version schauen
        document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
      })
      .catch(() => { /* offline-Modus nicht verfügbar */ });
  });
  // Neue Version aktiv: im Menü sofort neu laden, im Spiel erst beim nächsten Menübesuch
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    if (state === 'menu') location.reload();
    else reloadOnMenu = true;
  });
}

// Test-Zugriff für automatisierte Prüfungen (nur mit ?debug in der Adresse)
if (new URLSearchParams(location.search).has('debug')) {
  window.__mathblox = {
    player, input, save, cam, camera,
    get stage() { return stage; }, get level() { return stage; }, get state() { return state; }, get ride() { return ride; }, get task() { return task; },
    get drawCalls() { return renderer.info.render.calls; },
    startGame: startParkour, startParkour, startAdventure, travel, loadWorld, levelComplete, openTask, startRide,
  };
}
