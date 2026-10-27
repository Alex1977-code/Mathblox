// Klötzchen-Modelle für die Großstadt (Fahrzeuge). Alle Modelle: Front = +z, Boden bei y = 0.
// B(w, h, d, color, x, y, z, ry, rx, rz) – lokale Koordinaten; mit at() an eine Stelle der Welt setzen.

/** Lokale Box-Funktion an Position (x, y0, z) mit Drehung ry */
export function at(B, x, z, ry = 0, y0 = 0) {
  const c = Math.cos(ry), s = Math.sin(ry);
  return (w, h, d, color, lx, ly, lz, bry = 0, rx = 0, rz = 0) => B(w, h, d, color, x + lx * c + lz * s, y0 + ly, z - lx * s + lz * c, ry + bry, rx, rz);
}

const GLASS = '#9fd3f5', TYRE = '#22252a';

function wheels(B, hx, zs, r = 0.32) {
  for (const z of zs) for (const s of [-1, 1]) {
    B(0.32, r * 2, r * 2, TYRE, s * hx, r, z);
    B(0.34, r * 0.8, r * 0.8, '#c8ccd2', s * hx, r, z);
  }
}

export function carModel(B, color) {
  B(1.8, 0.7, 3.8, color, 0, 0.7, 0);
  B(1.62, 0.6, 2.0, GLASS, 0, 1.35, -0.25);
  B(1.66, 0.14, 2.1, color, 0, 1.72, -0.25);
  for (const s of [-1, 1]) B(0.12, 0.6, 0.12, color, s * 0.78, 1.35, 0.7);
  B(1.84, 0.2, 0.2, '#d8dde3', 0, 0.45, 1.92);
  B(1.84, 0.2, 0.2, '#d8dde3', 0, 0.45, -1.92);
  for (const s of [-1, 1]) {
    B(0.4, 0.22, 0.06, '#fff6c4', s * 0.6, 0.85, 1.91);
    B(0.4, 0.22, 0.06, '#ff4040', s * 0.6, 0.85, -1.91);
  }
  wheels(B, 0.85, [1.2, -1.2]);
}

export function busModel(B, color) {
  B(2.5, 2.6, 9, color, 0, 1.75, 0);
  B(2.56, 0.9, 7.6, GLASS, 0, 2.3, -0.3);
  B(2.2, 1.2, 0.08, GLASS, 0, 2.2, 4.51);
  B(2.56, 0.25, 9.06, '#ffffff', 0, 1.25, 0);
  B(2.3, 0.2, 7.5, '#f2f2f2', 0, 3.12, 0);
  B(1.4, 0.4, 0.1, '#1d2430', 0, 2.95, 4.52);
  for (const s of [-1, 1]) B(0.45, 0.25, 0.08, '#fff6c4', s * 0.85, 0.85, 4.52);
  B(0.08, 2.0, 1.2, '#4f6f8f', 1.27, 1.55, 2.6);
  wheels(B, 1.15, [3, -3], 0.45);
}

export function vanModel(B, color) {
  B(2, 2.2, 4.6, color, 0, 1.45, -0.2);
  B(2, 1.2, 1.2, color, 0, 0.95, 2.6);
  B(1.8, 0.7, 0.08, GLASS, 0, 1.95, 2.12);
  B(2.04, 0.5, 3.4, '#ffffff', 0, 1.7, -0.6);
  wheels(B, 0.95, [1.9, -1.6]);
}

// Offenes Taxi (Cabrio), damit man den Avatar sieht
export function taxiModel(B) {
  const Y = '#ffcc1a';
  B(1.9, 0.8, 4.0, Y, 0, 0.72, 0);
  B(1.9, 0.5, 1.3, Y, 0, 1.3, 1.25);
  B(1.7, 0.6, 0.08, GLASS, 0, 1.75, 0.65, 0, -0.3);
  B(1.9, 0.5, 0.9, Y, 0, 1.3, -1.6);
  for (const s of [-1, 1]) B(0.12, 0.45, 1.6, Y, s * 0.89, 1.32, -0.25);
  B(1.6, 0.3, 1.1, '#3b2a1a', 0, 1.12, -0.6);
  B(1.6, 0.8, 0.25, '#3b2a1a', 0, 1.55, -1.1);
  for (let i = 0; i < 8; i++) for (const s of [-1, 1]) B(0.05, 0.16, 0.5, i % 2 ? '#111111' : '#ffffff', s * 0.96, 0.95, -1.75 + i * 0.5);
  // Taxi-Schild auf einem Bügel
  for (const s of [-1, 1]) B(0.1, 0.9, 0.1, '#333333', s * 0.6, 1.95, -1.6);
  B(1.4, 0.45, 0.4, '#fff3a0', 0, 2.5, -1.6);
  for (const s of [-1, 1]) {
    B(0.4, 0.22, 0.06, '#fff6c4', s * 0.6, 0.85, 2.01);
    B(0.4, 0.22, 0.06, '#ff4040', s * 0.6, 0.85, -2.01);
  }
  wheels(B, 0.9, [1.3, -1.3]);
}

export function policeCarModel(B) {
  carModel(B, '#ffffff');
  B(1.84, 0.3, 3.84, '#1f5fd6', 0, 0.75, 0);
  B(1.0, 0.18, 0.35, '#2f7df6', 0, 1.88, -0.25);
}

export function fireTruckModel(B) {
  const R = '#d8262b';
  B(2.4, 2.4, 3, R, 0, 1.6, 3.2);
  B(2.2, 1.0, 0.08, GLASS, 0, 2.2, 4.71);
  B(2.4, 1.8, 6.4, R, 0, 1.3, -1.5);
  B(2.44, 0.3, 6.44, '#e8e8e8', 0, 1.6, -1.5);
  B(0.8, 0.3, 0.8, '#3b8cff', 0, 2.95, 3.6);
  // Leiter
  for (const s of [-1, 1]) B(0.12, 0.12, 7, '#d8dde3', s * 0.5, 2.6, -1.0, 0, -0.08);
  for (let i = 0; i < 9; i++) B(1.0, 0.08, 0.08, '#d8dde3', 0, 2.6 + (i - 4) * 0.06, -4.2 + i * 0.8);
  wheels(B, 1.1, [3.2, -0.5, -3.4], 0.45);
}

// Hubschrauber ohne Dach (Rotor separat), Kufen bei y = 0
export function heliBody(B) {
  const R = '#e8262b';
  for (const s of [-1, 1]) {
    B(0.15, 0.15, 3.8, '#3a3f47', s * 0.95, 0.08, 0.2);
    B(0.12, 0.6, 0.12, '#3a3f47', s * 0.95, 0.4, 1.0);
    B(0.12, 0.6, 0.12, '#3a3f47', s * 0.95, 0.4, -0.7);
  }
  B(2.1, 0.35, 3.4, R, 0, 0.85, 0.2);
  B(2.1, 1.2, 0.9, R, 0, 1.45, 1.95);
  B(1.9, 0.9, 0.12, GLASS, 0, 2.15, 2.25, 0, -0.5);
  for (const s of [-1, 1]) B(0.14, 0.55, 2.8, R, s * 1.0, 1.25, 0.2);
  B(2.1, 2.2, 0.5, R, 0, 1.95, -1.35);
  B(1.6, 0.25, 1.4, '#ffffff', 0, 1.15, -0.4);
  B(0.5, 0.5, 5, R, 0, 2.2, -4.0);
  B(0.14, 1.4, 0.9, '#ffffff', 0, 2.8, -6.2);
  B(1.6, 0.12, 0.5, '#ffffff', 0, 2.3, -5.6);
  B(0.3, 0.9, 0.3, '#3a3f47', 0, 3.4, -1.2);
  B(2.14, 0.3, 0.6, '#ffffff', 0, 2.95, -1.35);
}

export function rotorModel(B) {
  B(0.5, 0.25, 0.5, '#3a3f47', 0, 0, 0);
  B(8, 0.08, 0.38, '#2b2f36', 0, 0.05, 0);
  B(0.38, 0.08, 8, '#2b2f36', 0, 0.05, 0);
}
