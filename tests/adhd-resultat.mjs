import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const window = {};
runInNewContext(readFileSync(new URL('../site/shared/adhd-result.js', import.meta.url), 'utf8'), { window });
const { fromRecord, version } = window.HB_ADHD;
const rows = answers => answers.map((chosen, i) => ({ id:i + 1, part:'A', chosen }));
const draft = answers => ({ mode:'asrs', resultVersion:version, adultConfirmed:true, partATotal:6, answers:rows(answers) });

test('den danske skabelons seks tællefelter og overgangen ved fire', () => {
  // Manuelt aflæste profiler. 0 er Aldrig og 4 er Meget ofte.
  for (const [input, count] of [
    [[0,0,0,0,0,0],0], [[1,1,1,2,2,2],0], [[2,2,2,2,2,2],3], [[1,1,1,3,3,3],3],
    [[2,2,2,3,2,2],4], [[2,2,2,3,3,2],5], [[2,2,2,3,3,3],6], [[4,4,4,4,4,4],6],
  ]) {
    const result = fromRecord(draft(input));
    assert.equal(result.score, count);
    assert.match(result.interpretation, count < 4 ? /Færre end fire/ : /Fire eller flere/);
  }
});

test('uafsluttede, dobbelte, ugyldige eller ukendte besvarelser giver ingen fortolkning', () => {
  const record = draft([0,0,0,0,0,0]);
  for (const change of [
    { answers:[] }, { answers:null }, { answers:[...record.answers,record.answers[0]] },
    { answers:rows([0,0,0,0,0,null]) }, { answers:rows([0,0,0,0,0,'0']) },
    { answers:rows([0,0,0,0,0,5]) }, { answers:rows([0,0,0,0,0,1.5]) },
    { partATotal:18 }, { adultConfirmed:false }, { age:16 }, { mode:'diva' }, { resultVersion:'ukendt' },
  ]) assert.equal(fromRecord({ ...record, partAScore:0, ...change }), null);
  assert.equal(fromRecord({ ...record, partAScore:0, answers:undefined }), null);
});

test('tidligere ASRS-data bliver vist som en historisk optælling', () => {
  const old = { mode:'asrs', partATotal:6, partAScore:6, profileType:'kombineret', totalPct:80, age:36 };
  const result = fromRecord({ ...old, answers:[...rows([0,0,0,0,0,0]), { id:19, chosen:3 }] });
  assert.equal(result.score, 0);
  assert.equal(result.legacy, true);
  assert.match(result.interpretation, /tidligere/);
  assert.equal(fromRecord(old).score, 6);
  for (const value of [null, undefined, '0', 0.5, -1, 7]) assert.equal(fromRecord({ ...old, partAScore:value }), null);
  assert.equal(fromRecord({ partAScore:0 }), null);
  assert.equal(fromRecord({ ...old, answers:[] }), null);
  assert.doesNotMatch(JSON.stringify(result), /kombineret|80%/);
});

test('den tidligere pilot med omskrevne spørgsmål får sin egen historiske forklaring', () => {
  const old = { ...draft([2, 2, 2, 3, 0, 0]), resultVersion: 'del-a-2' };
  const result = fromRecord(old);
  assert.equal(result.score, 4);
  assert.equal(result.legacy, true);
  assert.match(result.interpretation, /omskrevne/);
  assert.doesNotMatch(result.draftNote, /overførte/);
  assert.equal(fromRecord({ ...old, adultConfirmed: false }), null);
  assert.equal(fromRecord({ ...old, answers: [...old.answers, { id: 7, part: 'B', chosen: 3 }] }), null);
});
