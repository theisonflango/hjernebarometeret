// Fælles læsning af nye og tidligere besvarelser. ASRS v1.1, del A.
(function () {
  'use strict';
  const thresholds = [2, 2, 2, 3, 3, 3];
  const version = 'del-a-2';
  const limitation = 'Tallet viser, hvor mange af seks svar der når spørgsmålets grænse. Det kan hverken fastslå eller udelukke ADHD. En faglig vurdering tager også højde for din historie, din hverdag og andre mulige forklaringer.';
  const draftNote = 'Dette er et arbejdsudkast. Den danske ordlyd og retten til at bruge den afventer afklaring.';

  function countPartA(answers) {
    if (!Array.isArray(answers)) return null;
    let score = 0;
    for (let i = 0; i < thresholds.length; i++) {
      const matches = answers.filter(a => a && a.id === i + 1);
      if (matches.length !== 1) return null;
      const { chosen, part } = matches[0];
      if ((part !== undefined && part !== 'A') || !Number.isInteger(chosen) || chosen < 0 || chosen > 4) return null;
      if (chosen >= thresholds[i]) score++;
    }
    return score;
  }

  function fromRecord(record) {
    if (!record || record.mode !== 'asrs') return null;
    if (record.resultVersion !== undefined && record.resultVersion !== version) return null;
    if (record.partATotal !== undefined && record.partATotal !== 6) return null;
    if (record.age !== undefined && (!Number.isInteger(record.age) || record.age < 18)) return null;
    const legacy = record.resultVersion !== version;
    if (!legacy && record.adultConfirmed !== true) return null;
    let score;
    if (Object.prototype.hasOwnProperty.call(record, 'answers')) {
      score = countPartA(record.answers);
    } else if (legacy && record.partATotal === 6) {
      // Ældre poster kan have en sum uden råsvar. Beskadigede råsvar må aldrig blive til nul.
      score = record.partAScore;
    }
    if (!Number.isInteger(score) || score < 0 || score > 6) return null;
    const interpretation = legacy
      ? 'Tallet stammer fra en tidligere webudgave. Den tidligere typebetegnelse er trukket tilbage, og instruktionen og aldersafgrænsningen var anderledes. En ny besvarelse med den aftalte periode er nødvendig for at fortolke mønstret som en aktuel screening.'
      : score >= 4
        ? 'Fire eller flere svar ligger i screeningsområdet. Det er en anledning til at tale med din læge om, hvorvidt en nærmere vurdering er relevant.'
        : 'Færre end fire svar ligger i screeningsområdet. Hvis vanskeligheder påvirker din hverdag, kan du stadig tale med din læge om dem.';
    return { score, legacy, interpretation, limitation, draftNote };
  }

  window.HB_ADHD = { version, sessionKey:'hb_adhd_pilot_del_a_2', countPartA, fromRecord };
})();
