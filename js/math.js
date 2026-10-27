// Aufgaben-Generator für Klasse 1–10 mit drei Schwierigkeitsstufen.
// Reine Logik ohne DOM, damit sie auch mit `node --test` geprüft werden kann.

export const DIFFICULTIES = ['leicht', 'mittel', 'schwer'];

const MINUS = '−';
const NBSP = ' ';

// ---------- Hilfsfunktionen ----------

const round6 = (x) => Math.round(x * 1e6) / 1e6;

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
const lcm = (a, b) => (a / gcd(a, b)) * b;

export function reduce(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  return [n / g, d / g];
}

// Zahl im deutschen Format: Dezimalkomma, schmales Leerzeichen als Tausendertrenner.
export function fmt(x) {
  x = round6(x);
  const neg = x < 0;
  const [int, dec] = Math.abs(x).toString().split('.');
  const intPart = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) : int;
  return (neg ? MINUS : '') + intPart + (dec ? ',' + dec : '');
}

// Zahl in Klammern, wenn negativ – für Terme wie 3 · (−4).
const fmtP = (x) => (x < 0 ? `(${fmt(x)})` : fmt(x));

export function fracHtml(n, d) {
  if (d === 1) return fmt(n);
  const sign = n < 0 ? MINUS : '';
  return `${sign}<span class="frac"><span>${Math.abs(n)}</span><span>${d}</span></span>`;
}

const sup = (b, e) => `${b}<sup>${e}</sup>`;

function makeRng(rng) {
  const ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const nz = (a, b) => { let v = 0; while (v === 0) v = ri(a, b); return v; };
  return { ri, pick, nz, rng };
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Ergebnis-Konstruktoren der einzelnen Aufgabentypen
const num = (q, a, extra = {}) => ({ kind: 'num', q, a: round6(a), ...extra });
const frac = (q, n, d, extra = {}) => {
  const [rn, rd] = reduce(n, d);
  return { kind: 'frac', q, n: rn, d: rd, ...extra };
};

// ---------- Aufgabentypen je Klasse ----------
// Jede Klasse hat drei Stufen (leicht, mittel, schwer); jede Stufe eine Liste von Generatoren.

const T = {
  // Klasse 1
  add10: ({ ri }) => { const a = ri(1, 9), b = ri(1, 10 - a); return num(`${a} + ${b}`, a + b); },
  sub10: ({ ri }) => { const a = ri(1, 10), b = ri(0, a); return num(`${a} ${MINUS} ${b}`, a - b); },
  add20easy: ({ ri }) => { const a = ri(10, 18), b = ri(1, 19 - a); return num(`${a} + ${b}`, a + b); },
  sub20easy: ({ ri }) => { const a = ri(11, 19), b = ri(1, a - 10); return num(`${a} ${MINUS} ${b}`, a - b); },
  add20cross: ({ ri }) => {
    const a = ri(3, 9), b = ri(11 - a, 9);
    return num(`${a} + ${b}`, a + b, { explain: `${a} + ${10 - a} = 10, dann + ${b - (10 - a)} = ${a + b}` });
  },
  sub20cross: ({ ri }) => {
    const u = ri(1, 8), a = 10 + u, b = ri(u + 1, 9);
    return num(`${a} ${MINUS} ${b}`, a - b, { explain: `${a} ${MINUS} ${u} = 10, dann ${MINUS} ${b - u} = ${a - b}` });
  },
  missingAdd: ({ ri }) => { const s = ri(8, 20), a = ri(1, s - 1); return num(`${a} + ☐ = ${s}`, s - a, { explain: `${s} ${MINUS} ${a} = ${s - a}` }); },

  // Klasse 2
  tens: ({ ri, pick }) => {
    const a = ri(1, 9) * 10;
    if (pick([true, false])) { const b = ri(1, (100 - a) / 10) * 10; return num(`${a} + ${b}`, a + b); }
    const b = ri(1, a / 10) * 10; return num(`${a} ${MINUS} ${b}`, a - b);
  },
  twoPlusOne: ({ ri, pick }) => {
    const a = ri(21, 89), b = ri(2, 9);
    return pick([true, false]) ? num(`${a} + ${b}`, a + b) : num(`${a} ${MINUS} ${b}`, a - b);
  },
  add100: ({ ri }) => { const a = ri(11, 79), b = ri(11, 99 - a); return num(`${a} + ${b}`, a + b); },
  sub100: ({ ri }) => { const a = ri(30, 99), b = ri(11, a - 5); return num(`${a} ${MINUS} ${b}`, a - b); },
  times2510: ({ ri, pick }) => { const a = pick([2, 5, 10]), b = ri(1, 10); return num(`${b} · ${a}`, a * b); },
  times: ({ ri }) => { const a = ri(2, 10), b = ri(2, 10); return num(`${a} · ${b}`, a * b); },
  div2510: ({ ri, pick }) => { const a = pick([2, 5, 10]), b = ri(1, 10); return num(`${a * b} : ${a}`, b); },
  double: ({ ri, pick }) => {
    if (pick([true, false])) { const a = ri(6, 49); return num(`Das Doppelte von ${a}`, 2 * a); }
    const a = ri(3, 49) * 2; return num(`Die Hälfte von ${a}`, a / 2);
  },

  // Klasse 3
  divTable: ({ ri }) => { const a = ri(2, 10), b = ri(2, 10); return num(`${a * b} : ${a}`, b, { explain: `${a} · ${b} = ${a * b}` }); },
  add1000: ({ ri }) => { const a = ri(101, 799), b = ri(101, 999 - a); return num(`${a} + ${b}`, a + b); },
  sub1000: ({ ri }) => { const a = ri(300, 999), b = ri(101, a - 50); return num(`${a} ${MINUS} ${b}`, a - b); },
  times10: ({ ri, pick }) => {
    const t = pick([10, 100]), a = ri(2, 9) * pick([1, 10]);
    return a * t <= 1000 ? num(`${a} · ${t}`, a * t) : num(`${a} · 10`, a * 10);
  },
  twoTimesOne: ({ ri }) => {
    const a = ri(12, 49), b = ri(2, 9);
    return num(`${a} · ${b}`, a * b, { explain: `${Math.floor(a / 10) * 10} · ${b} + ${a % 10} · ${b} = ${a * b}` });
  },
  missingFactor: ({ ri }) => { const a = ri(2, 10), b = ri(2, 10); return num(`☐ · ${a} = ${a * b}`, b, { explain: `${a * b} : ${a} = ${b}` }); },
  div2by1: ({ ri }) => { const d = ri(2, 9), q = ri(11, Math.floor(99 / d)); return num(`${d * q} : ${d}`, q); },

  // Klasse 4
  add10000: ({ ri, pick }) => {
    const a = ri(10, 60) * 100 + pick([0, 50]), b = ri(10, 35) * 100 + pick([0, 50]);
    return pick([true, false]) ? num(`${fmt(a)} + ${fmt(b)}`, a + b) : num(`${fmt(a + b)} ${MINUS} ${fmt(b)}`, a);
  },
  rounding: ({ ri, pick }) => {
    const x = ri(1001, 98999), [p, name] = pick([[10, 'Zehner'], [100, 'Hunderter'], [1000, 'Tausender']]);
    return num(`Runde ${fmt(x)} auf ${name}`, Math.round(x / p) * p);
  },
  threeTimesOne: ({ ri }) => { const a = ri(102, 329), b = ri(2, 9); return num(`${a} · ${b}`, a * b); },
  div3by1: ({ ri }) => { const d = ri(2, 9), q = ri(Math.ceil(100 / d), Math.floor(999 / d)); return num(`${d * q} : ${d}`, q); },
  twoTimesTwo: ({ ri }) => { const a = ri(12, 49), b = ri(11, 29); return num(`${a} · ${b}`, a * b); },
  pointBeforeLine: ({ ri, pick }) => {
    const a = ri(2, 20), b = ri(2, 9), c = ri(2, 9);
    return pick([true, false])
      ? num(`${a} + ${b} · ${c}`, a + b * c, { explain: `Punkt vor Strich: ${b} · ${c} = ${b * c}, dann ${a} + ${b * c}` })
      : num(`${b} · ${c} ${MINUS} ${Math.min(a, b * c)}`, b * c - Math.min(a, b * c));
  },
  million: ({ ri, pick }) => {
    const a = ri(10, 60) * 10000 + pick([0, 5000]), b = ri(10, 39) * 10000 + pick([0, 5000]);
    return num(`${fmt(a)} + ${fmt(b)}`, a + b);
  },

  // Klasse 5
  brackets: ({ ri, pick }) => {
    const a = ri(2, 9), b = ri(2, 12), c = ri(2, 12);
    return pick([true, false])
      ? num(`${a} · (${b} + ${c})`, a * (b + c), { explain: `Klammer zuerst: ${b} + ${c} = ${b + c}` })
      : num(`(${b + c + a} ${MINUS} ${c}) · ${a}`, (b + a) * a);
  },
  units: ({ ri, pick }) => {
    const [from, to, f] = pick([['km', 'm', 1000], ['m', 'cm', 100], ['kg', 'g', 1000], ['h', 'min', 60], ['min', 's', 60], ['m', 'mm', 1000], ['€', 'ct', 100]]);
    const x = ri(2, 12);
    return num(`${x} ${from} = ☐ ${to}`, x * f, { unit: to });
  },
  squares: ({ ri }) => { const a = ri(11, 20); return num(sup(a, 2), a * a, { explain: `${a} · ${a} = ${a * a}` }); },
  powers: ({ ri, pick }) => {
    const [b, e] = pick([[2, ri(3, 10)], [3, ri(2, 5)], [10, ri(2, 6)], [5, ri(2, 4)]]);
    return num(sup(b, e), b ** e, { explain: `${b} wird ${e}-mal mit sich selbst multipliziert` });
  },
  rectangle: ({ ri, pick }) => {
    const a = ri(3, 15), b = ri(2, 12);
    return pick([true, false])
      ? num(`Rechteck ${a} cm × ${b} cm: Fläche in cm²`, a * b, { explain: `A = a · b = ${a} · ${b}` })
      : num(`Rechteck ${a} cm × ${b} cm: Umfang in cm`, 2 * (a + b), { explain: `U = 2 · (${a} + ${b})` });
  },
  threeTimesTwo: ({ ri }) => { const a = ri(101, 299), b = ri(11, 25); return num(`${a} · ${b}`, a * b); },
  divBy2digit: ({ ri }) => { const d = ri(11, 25), q = ri(12, 40); return num(`${fmt(d * q)} : ${d}`, q); },
  gcdLcm: ({ ri, pick }) => {
    if (pick([true, false])) {
      const g = ri(2, 9), a = g * ri(2, 6), b = g * ri(2, 7);
      return num(`ggT(${a}, ${b})`, gcd(a, b), { explain: 'größter gemeinsamer Teiler' });
    }
    const a = ri(2, 12), b = ri(3, 15);
    return num(`kgV(${a}, ${b})`, lcm(a, b), { explain: 'kleinstes gemeinsames Vielfaches' });
  },

  // Klasse 6
  fracSameDen: ({ ri, pick }) => {
    const d = ri(3, 12), a = ri(1, d - 1), b = ri(1, d - 1);
    if (pick([true, false]) || a === b) return frac(`${fracHtml(a, d)} + ${fracHtml(b, d)}`, a + b, d);
    const [x, y] = a > b ? [a, b] : [b, a];
    return frac(`${fracHtml(x, d)} ${MINUS} ${fracHtml(y, d)}`, x - y, d);
  },
  fracOf: ({ ri }) => {
    const d = ri(2, 10), n = ri(1, d - 1), w = d * ri(2, 10);
    return num(`${fracHtml(n, d)} von ${w}`, (w / d) * n, { explain: `${w} : ${d} = ${w / d}, mal ${n}` });
  },
  simplify: ({ ri }) => {
    let n = ri(1, 9), d = ri(n + 1, 12);
    [n, d] = reduce(n, d);
    const k = ri(2, 6);
    return frac(`Kürze vollständig: ${fracHtml(n * k, d * k)}`, n, d, { exact: true, explain: `Zähler und Nenner durch ${k} teilen` });
  },
  decAdd: ({ ri, pick }) => {
    const a = ri(10, 99) / pick([10, 100]), b = ri(10, 99) / pick([10, 100]);
    return pick([true, false]) ? num(`${fmt(a)} + ${fmt(b)}`, a + b) : num(`${fmt(Math.max(a, b))} ${MINUS} ${fmt(Math.min(a, b))}`, Math.abs(a - b));
  },
  fracToDec: ({ pick }) => {
    const [n, d] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [7, 10], [1, 8], [3, 8], [1, 20], [3, 20], [1, 25]]);
    return num(`${fracHtml(n, d)} als Dezimalzahl`, n / d);
  },
  fracAddUnlike: ({ ri, pick }) => {
    const d1 = ri(2, 6), d2 = pick([2, 3, 4, 5, 6, 8].filter((x) => x !== d1)), n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1);
    const d = lcm(d1, d2);
    return frac(`${fracHtml(n1, d1)} + ${fracHtml(n2, d2)}`, n1 * (d / d1) + n2 * (d / d2), d, { explain: `Hauptnenner ${d}` });
  },
  fracMul: ({ ri }) => {
    const d1 = ri(2, 7), d2 = ri(2, 7), n1 = ri(1, d1), n2 = ri(1, d2);
    return frac(`${fracHtml(n1, d1)} · ${fracHtml(n2, d2)}`, n1 * n2, d1 * d2, { explain: 'Zähler mal Zähler, Nenner mal Nenner' });
  },
  decMul: ({ ri, pick }) => {
    if (pick([true, false])) { const a = ri(2, 9) / 10, b = ri(2, 9) / 10; return num(`${fmt(a)} · ${fmt(b)}`, a * b, { explain: 'Nachkommastellen zusammenzählen' }); }
    const a = ri(11, 999) / 10, t = pick([10, 100]);
    return pick([true, false]) ? num(`${fmt(a)} · ${t}`, a * t) : num(`${fmt(a)} : ${t}`, a / t);
  },

  // Klasse 7
  negAdd: ({ ri, pick }) => {
    const a = ri(-15, 15), b = ri(1, 15);
    return pick([true, false]) ? num(`${fmt(a)} + ${b}`, a + b) : num(`${fmt(a)} ${MINUS} ${b}`, a - b);
  },
  negSub: ({ nz }) => { const a = nz(-12, 12), b = nz(-12, -1); return num(`${fmt(a)} ${MINUS} (${fmt(b)})`, a - b, { explain: 'Minus mal Minus wird Plus' }); },
  negMul: ({ nz, pick }) => {
    const a = nz(-12, 12), b = nz(-10, 10);
    if (pick([true, false])) return num(`${fmtP(a)} · ${fmtP(b)}`, a * b, { explain: 'Gleiche Vorzeichen: plus, verschiedene: minus' });
    return num(`${fmtP(a * b)} : ${fmtP(b)}`, a);
  },
  percentOf: ({ ri, pick }) => {
    const p = pick([10, 20, 25, 50, 5, 30, 75, 40, 15]), g = ri(2, 20) * 20;
    return num(`${p} % von ${g}`, (p * g) / 100, { explain: `${g} : 100 · ${p}` });
  },
  percentRate: ({ ri, pick }) => {
    const p = pick([10, 20, 25, 50, 5, 40, 75]), g = ri(1, 10) * 20;
    return num(`${(p * g) / 100} von ${g} sind ☐ %`, p, { unit: '%' });
  },
  linEq: ({ ri, nz, pick }) => {
    const x = nz(-9, 12), a = ri(2, 9), b = nz(-20, 20), c = a * x + b;
    return num(`${a}x ${b < 0 ? MINUS : '+'} ${Math.abs(b)} = ${fmt(c)}`, x, { explain: `${a}x = ${fmt(c - b)}, also x = ${fmt(x)}`, prefix: 'x =' });
  },
  ruleOfThree: ({ ri, pick }) => {
    const [item, unit] = pick([['Hefte', '€'], ['Brötchen', '€'], ['Äpfel', 'ct'], ['Kinokarten', '€']]);
    const p = ri(2, 9), a = ri(2, 6), b = ri(3, 12);
    return num(`${a} ${item} kosten ${a * p} ${unit}. Was kosten ${b} ${item}?`, b * p, { unit, explain: `1 ${item.slice(0, -1)} kostet ${p} ${unit}` });
  },
  baseValue: ({ ri, pick }) => {
    const p = pick([10, 20, 25, 50, 5]), g = ri(2, 20) * 20;
    return num(`${p} % sind ${(p * g) / 100}. Wie viel sind 100 %?`, g);
  },

  // Klasse 8
  substitute: ({ ri, nz }) => {
    const a = ri(2, 9), b = nz(-10, 10), x = nz(-6, 8);
    return num(`${a}a ${b < 0 ? MINUS : '+'} ${Math.abs(b)} für a = ${fmt(x)}`, a * x + b);
  },
  negPowers: ({ ri, pick }) => {
    const b = pick([-2, -3, 2, 3, 4, -1, -5]), e = ri(2, Math.abs(b) >= 4 ? 3 : 4);
    return num(sup(b < 0 ? `(${fmt(b)})` : b, e), b ** e);
  },
  eqBrackets: ({ ri, nz }) => {
    const x = nz(-6, 10), a = ri(2, 6), b = nz(-8, 8);
    return num(`${a}(x ${b < 0 ? MINUS : '+'} ${Math.abs(b)}) = ${fmt(a * (x + b))}`, x, { prefix: 'x =' });
  },
  eqBothSides: ({ ri, nz }) => {
    const x = nz(-8, 10), c = ri(1, 6), a = c + ri(1, 6), b = nz(-15, 15), d = (a - c) * x + b;
    return num(`${a}x ${b < 0 ? MINUS : '+'} ${Math.abs(b)} = ${c === 1 ? '' : c}x ${d < 0 ? MINUS : '+'} ${Math.abs(d)}`, x, { prefix: 'x =' });
  },
  binomial: ({ ri, pick }) => {
    const base = pick([10, 20, 30, 40, 50]), k = ri(1, 3), plus = pick([true, false]), v = plus ? base + k : base - k;
    return num(`Berechne geschickt: ${sup(v, 2)}`, v * v, { explain: `(${base} ${plus ? '+' : MINUS} ${k})² = ${base * base} ${plus ? '+' : MINUS} ${2 * base * k} + ${k * k}` });
  },
  system: ({ ri, nz, pick }) => {
    const x = nz(-5, 9), y = nz(-5, 9), askX = pick([true, false]);
    return num(`x + y = ${fmt(x + y)} und x ${MINUS} y = ${fmt(x - y)}. ${askX ? 'x' : 'y'} = ?`, askX ? x : y, { explain: 'Beide Gleichungen addieren: 2x = …' });
  },

  // Klasse 9
  roots: ({ ri, pick }) => {
    if (pick([true, false, false])) { const a = ri(2, 9); return num(`√${fmt((a / 10) ** 2)}`, a / 10); }
    const a = ri(4, 25); return num(`√${a * a}`, a, { explain: `${a} · ${a} = ${a * a}` });
  },
  pythHyp: ({ ri, pick }) => {
    const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]), k = ri(1, a > 5 ? 2 : 4);
    return num(`Rechtwinkliges Dreieck: a = ${a * k}, b = ${b * k}. c = ?`, c * k, { explain: `c² = a² + b² = ${(c * k) ** 2}` });
  },
  pythLeg: ({ ri, pick }) => {
    const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10]]), k = ri(1, 3);
    return num(`Hypotenuse c = ${c * k}, Kathete a = ${a * k}. b = ?`, b * k, { explain: `b² = c² ${MINUS} a² = ${(b * k) ** 2}` });
  },
  quadPure: ({ ri }) => { const x = ri(2, 15); return num(`x² = ${x * x}. Positive Lösung?`, x, { prefix: 'x =' }); },
  quadFactor: ({ nz, pick }) => {
    let r1 = nz(-8, 9), r2 = nz(-8, 9);
    if (r1 === r2) r2 = r1 + 1 === 0 ? r1 + 2 : r1 + 1;
    const p = -(r1 + r2), q = r1 * r2, big = pick([true, false]);
    const pt = p === 0 ? '' : ` ${p < 0 ? MINUS : '+'} ${Math.abs(p) === 1 ? '' : Math.abs(p)}x`;
    return num(`x²${pt} ${q < 0 ? MINUS : '+'} ${Math.abs(q)} = 0. ${big ? 'Größere' : 'Kleinere'} Lösung?`, big ? Math.max(r1, r2) : Math.min(r1, r2), { prefix: 'x =', explain: `(x ${MINUS} ${fmtP(r1)})(x ${MINUS} ${fmtP(r2)}) = 0` });
  },
  negExp: ({ pick }) => {
    const [b, e] = pick([[2, 1], [2, 2], [2, 3], [3, 2], [10, 2], [5, 1], [4, 2], [10, 3]]);
    return frac(sup(b, MINUS + e), 1, b ** e, { explain: `${sup(b, MINUS + e)} = 1 : ${sup(b, e)}` });
  },

  // Klasse 10
  powerLaws: ({ ri, pick }) => {
    const b = pick([2, 3, 5, 'a']), m = ri(2, 9), n = ri(2, 6), op = pick(['mul', 'div', 'pow']);
    if (op === 'mul') return num(`${sup(b, m)} · ${sup(b, n)} = ${sup(b, '☐')}`, m + n, { explain: 'Exponenten addieren' });
    if (op === 'div') return num(`${sup(b, m + n)} : ${sup(b, n)} = ${sup(b, '☐')}`, m, { explain: 'Exponenten subtrahieren' });
    return num(`(${sup(b, m)})<sup>${n}</sup> = ${sup(b, '☐')}`, m * n, { explain: 'Exponenten multiplizieren' });
  },
  linFunc: ({ ri, nz }) => {
    const m = nz(-5, 5), b = nz(-9, 9), x = nz(-5, 6);
    return num(`f(x) = ${m === 1 ? '' : m === -1 ? MINUS : fmt(m)}x ${b < 0 ? MINUS : '+'} ${Math.abs(b)}. f(${fmt(x)}) = ?`, m * x + b);
  },
  slope: ({ ri, nz }) => {
    const m = nz(-4, 5), x1 = ri(-3, 3), x2 = x1 + ri(1, 4), y1 = ri(-5, 5), y2 = y1 + m * (x2 - x1);
    return num(`Steigung der Geraden durch P(${fmt(x1)} | ${fmt(y1)}) und Q(${fmt(x2)} | ${fmt(y2)})`, m, { prefix: 'm =', explain: `m = (${fmt(y2)} ${MINUS} ${fmtP(y1)}) : (${fmt(x2)} ${MINUS} ${fmtP(x1)})` });
  },
  zero: ({ nz }) => {
    const x = nz(-8, 8), m = nz(-5, 5), b = -m * x;
    return num(`Nullstelle von f(x) = ${fmt(m)}x ${b < 0 ? MINUS : '+'} ${Math.abs(b)}`, x, { prefix: 'x =' });
  },
  logs: ({ ri, pick }) => {
    const b = pick([2, 3, 10, 5]), e = ri(b === 2 ? 2 : 1, b === 2 ? 8 : b === 10 ? 6 : 4);
    return num(`log<sub>${b}</sub>(${fmt(b ** e)})`, e, { explain: `${sup(b, e)} = ${fmt(b ** e)}` });
  },
  vertex: ({ nz, pick }) => {
    const d = nz(-6, 6), e = nz(-9, 9), askX = pick([true, false]);
    return num(`f(x) = (x ${d < 0 ? '+' : MINUS} ${Math.abs(d)})² ${e < 0 ? MINUS : '+'} ${Math.abs(e)}. Scheitelpunkt: ${askX ? 'x' : 'y'} = ?`, askX ? d : e);
  },
  trig: ({ pick }) => {
    const [q, a] = pick([['sin(30°)', 0.5], ['cos(60°)', 0.5], ['tan(45°)', 1], ['sin(90°)', 1], ['cos(0°)', 1], ['sin(0°)', 0], ['cos(90°)', 0], ['sin(150°)', 0.5], ['cos(180°)', -1]]);
    return num(q, a);
  },
  compound: ({ ri, pick }) => {
    const k = ri(1, 10) * 100, p = pick([10, 20, 5]), n = 2;
    return num(`${fmt(k)} € mit ${p} % Zinsen pro Jahr. Guthaben nach ${n} Jahren in €?`, k * (1 + p / 100) ** n, { unit: '€', explain: `${fmt(k)} · ${fmt(1 + p / 100)}²` });
  },
};

export const GRADES = [
  { grade: 1, topics: 'Plus & Minus bis 20', levels: [[T.add10, T.sub10], [T.add20easy, T.sub20easy, T.add10], [T.add20cross, T.sub20cross, T.missingAdd]] },
  { grade: 2, topics: 'Rechnen bis 100, Einmaleins', levels: [[T.tens, T.twoPlusOne], [T.add100, T.sub100, T.times2510], [T.times, T.div2510, T.double]] },
  { grade: 3, topics: 'Einmaleins, Zahlen bis 1000', levels: [[T.times, T.divTable], [T.add1000, T.sub1000, T.times10], [T.twoTimesOne, T.missingFactor, T.div2by1]] },
  { grade: 4, topics: 'Große Zahlen, schriftlich rechnen', levels: [[T.add10000, T.rounding], [T.threeTimesOne, T.div3by1], [T.twoTimesTwo, T.pointBeforeLine, T.million]] },
  { grade: 5, topics: 'Klammern, Potenzen, Größen', levels: [[T.brackets, T.units, T.pointBeforeLine], [T.squares, T.powers, T.rectangle], [T.threeTimesTwo, T.divBy2digit, T.gcdLcm]] },
  { grade: 6, topics: 'Brüche & Dezimalzahlen', levels: [[T.fracSameDen, T.fracOf], [T.simplify, T.decAdd, T.fracToDec], [T.fracAddUnlike, T.fracMul, T.decMul]] },
  { grade: 7, topics: 'Negative Zahlen, Prozent, Gleichungen', levels: [[T.negAdd, T.negSub], [T.negMul, T.percentOf, T.percentRate], [T.linEq, T.ruleOfThree, T.baseValue]] },
  { grade: 8, topics: 'Terme, Gleichungen, Systeme', levels: [[T.substitute, T.negPowers], [T.eqBrackets, T.eqBothSides], [T.binomial, T.system]] },
  { grade: 9, topics: 'Wurzeln, Pythagoras, quadratisch', levels: [[T.roots, T.squares], [T.pythHyp, T.pythLeg], [T.quadPure, T.quadFactor, T.negExp]] },
  { grade: 10, topics: 'Funktionen, Potenzen, Logarithmen', levels: [[T.powerLaws, T.linFunc], [T.slope, T.zero, T.logs], [T.vertex, T.trig, T.compound, T.quadFactor]] },
];

// ---------- Antwortmöglichkeiten ----------

function numDistractors(a, R, allowNeg) {
  const isInt = Number.isInteger(a);
  const decPlaces = isInt ? 0 : (a.toString().split('.')[1] || '').length;
  const unit = isInt ? 1 : 10 ** -decPlaces;
  const mag = Math.abs(a);
  const offs = [unit, -unit, 2 * unit, -2 * unit];
  if (mag >= 10) offs.push(10 * unit, -10 * unit);
  if (mag >= 100) offs.push(100, -100, 20, -20);
  if (mag >= 1000) offs.push(1000, -1000);
  const cands = offs.map((o) => a + o);
  if (a !== 0) cands.push(-a);
  if (!isInt) cands.push(a * 10, a / 10);
  if (mag >= 12 && isInt) {
    const s = String(mag);
    const swapped = Number(s.slice(0, -2) + s.slice(-1) + s.slice(-2, -1));
    cands.push(Math.sign(a) * swapped);
  }
  const out = new Set();
  for (const c of shuffle(cands.map(round6), R.rng)) {
    if (out.size >= 3) break;
    if (c === a || (!allowNeg && c < 0) || out.has(c)) continue;
    out.add(c);
  }
  let k = 3;
  while (out.size < 3) { const c = round6(a + k * unit); if (c !== a && (allowNeg || c >= 0)) out.add(c); k++; }
  return [...out];
}

function fracDistractors(n, d, R, exact) {
  const cands = [[n + 1, d], [n - 1, d], [n, d + 1], [d, n], [n * 2, d * 2], [n + d, d], [n, d * 2]];
  const out = [];
  const seen = new Set([`${n}/${d}`]);
  for (const [cn, cd] of shuffle(cands, R.rng)) {
    if (out.length >= 3) break;
    if (cd <= 0 || cn <= 0) continue;
    let shown = reduce(cn, cd);
    if (shown[0] === n && shown[1] === d) {
      // Gleicher Wert: nur bei Kürzaufgaben als ungekürzte Falle sinnvoll
      if (!exact) continue;
      shown = [cn, cd];
    }
    const key = `${shown[0]}/${shown[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(shown);
  }
  for (let k = 2; out.length < 3; k++) {
    const shown = reduce(n + k, d), key = `${shown[0]}/${shown[1]}`;
    if (!seen.has(key)) { seen.add(key); out.push(shown); }
  }
  return out;
}

const answerHtml = (t) => (t.kind === 'frac' ? fracHtml(t.n, t.d) : fmt(t.a));

// ---------- Öffentliche API ----------

/**
 * Erzeugt eine Aufgabe.
 * @param {number} grade 1–10
 * @param {number} difficulty 0 = leicht, 1 = mittel, 2 = schwer
 * @param {() => number} rng Zufallsquelle (0..1)
 */
export function generateTask(grade, difficulty, rng = Math.random) {
  const R = makeRng(rng);
  const g = GRADES[Math.min(Math.max(grade, 1), 10) - 1];
  difficulty = Math.min(Math.max(difficulty, 0), 2);
  // Meist aus der gewählten Stufe, manchmal Wiederholung leichterer Stufen
  const lvl = difficulty > 0 && rng() < 0.25 ? R.ri(0, difficulty - 1) : difficulty;
  const gen = R.pick(g.levels[lvl]);
  const t = gen(R);
  const allowNeg = grade >= 7;

  let choices;
  if (t.kind === 'frac') {
    choices = [[t.n, t.d], ...fracDistractors(t.n, t.d, R, t.exact)].map(([n, d], i) => ({ html: fracHtml(n, d), correct: i === 0 }));
  } else {
    choices = [t.a, ...numDistractors(t.a, R, allowNeg || t.a < 0)].map((v, i) => ({ html: fmt(v), correct: i === 0 }));
  }
  shuffle(choices, rng);

  return {
    ...t,
    grade,
    difficulty: lvl,
    question: t.q,
    answerHtml: answerHtml(t),
    choices,
  };
}

// Prüft eine getippte Antwort. Akzeptiert Komma oder Punkt, "−" oder "-", Brüche als "a/b".
export function checkTyped(task, input) {
  const s = String(input).trim().replace(/\s| /g, '').replace(/[−–]/g, '-').replace(',', '.');
  if (!s) return false;
  if (task.kind === 'frac') {
    let n, d;
    if (s.includes('/')) {
      [n, d] = s.split('/').map(Number);
    } else {
      n = Number(s); d = 1;
      if (!Number.isInteger(n)) { // Dezimalzahl als Wert eines Bruchs akzeptieren (nicht bei Kürzaufgaben)
        return !task.exact && Math.abs(n - task.n / task.d) < 1e-9;
      }
    }
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return false;
    if (task.exact) {
      const [sn, sd] = d < 0 ? [-n, -d] : [n, d];
      return sn === task.n && sd === task.d;
    }
    return Math.abs(n / d - task.n / task.d) < 1e-9;
  }
  if (s.includes('/')) {
    const [n, d] = s.split('/').map(Number);
    return d !== 0 && Math.abs(n / d - task.a) < 1e-9;
  }
  const v = Number(s);
  return Number.isFinite(v) && Math.abs(v - task.a) < 1e-9;
}

// Deterministischer Zufall (für Level-Layouts und Tests)
export function seededRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
