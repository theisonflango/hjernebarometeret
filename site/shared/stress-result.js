// Hjernebarometerets oprindelige svartrin er 1–5. PSS-10 tæller 0–4.
(function () {
  const reverse = new Set([4, 5, 7, 8]);
  const version = 'pss10-pilot-2';
  const sessionKey = 'hb_pilot_pss10';

  function score(data) {
    if (!data || !Array.isArray(data.answers)) return null;
    if (data.test_version && !['v1.0', version].includes(data.test_version)) return null;
    const pilot = data.test_version === version;
    if (pilot && data.answers.length !== 10) return null;
    const seen = new Set();
    let sum = 0;
    for (const row of data.answers) {
      if (!row || !Number.isInteger(row.id) || row.id < 1 || row.id > 10) continue;
      // Older unversioned data must identify the original PSS block explicitly.
      if (!data.test_version && row.scale !== 'pss') return null;
      if (row.scale && row.scale !== 'pss') return null;
      if (seen.has(row.id) || !Number.isInteger(row.chosen) || row.chosen < 1 || row.chosen > 5) return null;
      seen.add(row.id);
      sum += reverse.has(row.id) ? 5 - row.chosen : row.chosen - 1;
    }
    return seen.size === 10 ? sum : null;
  }

  window.HB_STRESS = { score, version, sessionKey };
})();
