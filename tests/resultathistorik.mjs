import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createContext, runInContext } from 'node:vm';

// Kald det sædvanlige lagrings-API med en opsamler i hukommelsen.
function summaryWriter(withScoring = true) {
  const rows = [];
  const db = {
    from(table) {
      assert.equal(table, 'test_results');
      return { insert: async row => rows.push(row) };
    }
  };
  const client = createContext({
    HB_AUTH: { user: { id: 'fiktiv' }, supabase: db },
    localStorage: { setItem() {} }
  });
  client.window = client;
  const scripts = withScoring ? ['adhd-result', 'stress-result', 'payment'] : ['payment'];
  for (const name of scripts) {
    const script = new URL('../site/shared/' + name + '.js', import.meta.url);
    runInContext(readFileSync(script, 'utf8'), client, { filename: name });
  }
  return (type, record) => {
    client.HB_PAY.saveResults(type, record);
    return rows.pop().score_summary;
  };
}

test('ADHD-oversigten bruger kun gyldige del A-svar eller en genkendelig ældre optælling', () => {
  const write = summaryWriter();
  const legacy = { mode: 'asrs', partATotal: 6, partAScore: 0, totalPct: 99, profileType: 'Kombineret' };
  assert.equal(write('adhd', legacy), 'ADHD-screening · 0 af 6 svar i tællefeltet');
  assert.equal(write('adhd', { ...legacy, answers: [] }), 'ADHD-screening');
  const answers = [2, 2, 2, 3, 0, 0].map((chosen, i) => ({ id: i + 1, chosen }));
  assert.equal(write('adhd', { ...legacy, answers }), 'ADHD-screening · 4 af 6 svar i tællefeltet');
});

test('stressoversigten kan skelne nul fra en ufuldstændig besvarelse', () => {
  const write = summaryWriter();
  const legacy = { test_version: 'v1.0', burnoutProfile: 'Fuldt burnout-syndrom', pssTotal: 40 };
  const answers = [1, 1, 1, 5, 5, 1, 5, 5, 1, 1].map((chosen, i) => ({ id: i + 1, chosen }));
  assert.equal(write('stress', { ...legacy, answers }), 'Oplevet stress · 0 af 40 point');
  assert.equal(write('stress', { ...legacy, answers: answers.slice(1) }), 'Oplevet stress');
  assert.equal(write('stress', legacy), 'Oplevet stress');
});

test('en side uden de faglige moduler gemmer alene testnavnet', () => {
  const write = summaryWriter(false);
  assert.equal(write('adhd', { totalPct: 100 }), 'ADHD-screening');
  assert.equal(write('stress', { pssTotal: 0 }), 'Oplevet stress');
});
