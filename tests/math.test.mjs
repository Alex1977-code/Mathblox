import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRADES, generateTask, checkTyped, fmt, seededRng } from '../js/math.js';

const stripHtml = (s) => s.replace(/<[^>]+>/g, ' ');

test('jede Klasse und Stufe liefert gültige Aufgaben', () => {
  const rng = seededRng(42);
  for (const { grade } of GRADES) {
    for (let diff = 0; diff < 3; diff++) {
      for (let i = 0; i < 400; i++) {
        const t = generateTask(grade, diff, rng);
        const ctx = `Klasse ${grade}, Stufe ${diff}: ${stripHtml(t.question)}`;
        assert.ok(t.question && !/undefined|NaN|Infinity/.test(t.question), ctx);
        assert.equal(t.choices.length, 4, ctx);
        assert.equal(t.choices.filter((c) => c.correct).length, 1, ctx);
        const htmls = t.choices.map((c) => c.html);
        assert.equal(new Set(htmls).size, 4, `doppelte Auswahl: ${ctx} -> ${htmls}`);
        assert.ok(htmls.every((h) => !/undefined|NaN|Infinity/.test(h)), ctx);
        if (t.kind === 'num') {
          assert.ok(Number.isFinite(t.a), ctx);
          assert.ok(checkTyped(t, String(t.a)), `getippte Lösung abgelehnt: ${ctx} = ${t.a}`);
          assert.ok(!checkTyped(t, String(t.a + 1)), ctx);
          if (grade <= 6) assert.ok(t.a >= 0, `negatives Ergebnis in Klasse ${grade}: ${ctx}`);
        } else {
          assert.ok(Number.isInteger(t.n) && Number.isInteger(t.d) && t.d > 0, ctx);
          assert.ok(checkTyped(t, `${t.n}/${t.d}`), ctx);
        }
      }
    }
  }
});

test('Kürzaufgaben verlangen den vollständig gekürzten Bruch', () => {
  const task = { kind: 'frac', n: 2, d: 3, exact: true };
  assert.ok(checkTyped(task, '2/3'));
  assert.ok(!checkTyped(task, '4/6'));
  assert.ok(checkTyped({ ...task, exact: false }, '4/6'));
});

test('getippte Antworten: Komma, Minus, Leerzeichen', () => {
  assert.ok(checkTyped({ kind: 'num', a: 0.75 }, '0,75'));
  assert.ok(checkTyped({ kind: 'num', a: -4 }, '−4'));
  assert.ok(checkTyped({ kind: 'num', a: -4 }, '-4'));
  assert.ok(checkTyped({ kind: 'num', a: 625000 }, '625 000'));
  assert.ok(!checkTyped({ kind: 'num', a: 3 }, ''));
});

test('Zahlenformat ist deutsch', () => {
  assert.equal(fmt(0.1 + 0.2), '0,3');
  assert.equal(fmt(-5), '−5');
  assert.equal(fmt(1234), '1234');
  assert.equal(fmt(625000), '625 000');
});
