import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const window = {};
runInNewContext(readFileSync(new URL('../site/shared/stress-result.js', import.meta.url), 'utf8'), { window });
const { score, version } = window.HB_STRESS;
const makeAnswers = values => values.map((chosen, i) => ({ id: i + 1, chosen }));
const middle = makeAnswers(Array(10).fill(3));

test('faste kontrolbesvarelser inklusive de tidligere visningsgrænser', () => {
  const fixtures = [
    [0,  [1, 1, 1, 5, 5, 1, 5, 5, 1, 1]],
    [13, [5, 5, 5, 4, 5, 1, 5, 5, 1, 1]],
    [14, [5, 5, 5, 3, 5, 1, 5, 5, 1, 1]],
    [20, [3, 3, 3, 3, 3, 3, 3, 3, 3, 3]],
    [21, [4, 3, 3, 3, 3, 3, 3, 3, 3, 3]],
    [26, [5, 5, 5, 1, 1, 5, 3, 5, 1, 1]],
    [27, [5, 5, 5, 1, 1, 5, 2, 5, 1, 1]],
    [40, [5, 5, 5, 1, 1, 5, 1, 1, 5, 5]]
  ];
  for (const [expected, values] of fixtures) {
    assert.equal(score({ test_version: version, answers: makeAnswers(values) }), expected);
  }
});

test('genberegner gammel PSS-sum uafhængigt af de 20 lokale tillæg', () => {
  for (const extra of [1, 3, 5]) {
    const answers = [...middle, ...Array.from({ length: 20 }, (_, i) => ({ id: 11 + i, chosen: extra }))];
    assert.equal(score({ test_version: 'v1.0', answers, pssTotal: 40, burnoutProfile: 'Udbrændthed' }), 20);
  }
  assert.equal(score({ answers: middle.map(row => ({ ...row, scale: 'pss' })) }), 20);
});

test('kræver ti identificerbare valide svar, selv når en gammel sum findes', () => {
  for (const answers of [
    undefined, [], middle.slice(1), [...middle, middle[0]],
    middle.map(row => row.id === 2 ? { ...row, scale: 'burnout' } : row),
    ...[null, 0, 6, '3', 3.5].map(chosen => [{ id: 1, chosen }, ...middle.slice(1)])
  ]) {
    assert.equal(score({ test_version: 'v1.0', answers, pssTotal: 0 }), null);
  }
  assert.equal(score({ answers: middle }), null);
  assert.equal(score({ test_version: 'ukendt', answers: middle }), null);
});
