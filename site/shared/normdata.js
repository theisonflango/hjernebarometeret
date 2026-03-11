// ═══════════════════════════════════════════════════════════════
//  HB_NORM — Percentil-normdata for Hjernebarometeret
//  Beregner befolkningspercentiler baseret på publiceret forskning
// ═══════════════════════════════════════════════════════════════
(function() {
  'use strict';

  // ─── Matematik ───────────────────────────────────────────────

  // Error function (Abramowitz & Stegun approximation)
  function erf(x) {
    var a1=.254829592, a2=-.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=.3275911;
    var s = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    var t = 1 / (1 + p * x);
    return s * (1 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1) * t * Math.exp(-x * x));
  }

  function normalCDF(x) {
    return 0.5 * (1 + erf(x / Math.SQRT2));
  }

  function scoreToPercentile(value, mean, sd) {
    if (sd <= 0) return 50;
    var z = (value - mean) / sd;
    var pct = normalCDF(z) * 100;
    return Math.max(0.1, Math.min(99.9, Math.round(pct * 10) / 10));
  }

  // ─── Normtabeller ───────────────────────────────────────────

  // IQ: Wechsler standardfordeling
  var IQ_NORMS = { mean: 100, sd: 15, source: 'Wechsler IQ-skala' };

  // PSS-10: Cohen & Janicki-Deverts (2012), n=2.387
  var PSS_NORMS = {
    overall: { mean: 15.21, sd: 7.28, n: 2387 },
    age: {
      '18-29': { mean: 16.78, sd: 7.55 },
      '30-44': { mean: 15.03, sd: 7.22 },
      '45-54': { mean: 14.75, sd: 7.10 },
      '55-64': { mean: 13.41, sd: 6.83 },
      '65+':   { mean: 12.00, sd: 6.30 }
    },
    gender: {
      male:   { mean: 14.00, sd: 6.89 },
      female: { mean: 16.14, sd: 7.56 }
    },
    source: 'Cohen & Janicki-Deverts (2012), n=2.387'
  };

  // AQ-50: Baron-Cohen et al. (2001)
  var AQ_NORMS = {
    general: { mean: 16.4, sd: 6.3, n: 174 },
    clinical: { mean: 35.8, sd: 6.5 },
    thresholds: { screening: 26, clinical: 32 },
    source: 'Baron-Cohen et al. (2001)'
  };

  // Big Five IPIP: Johnson (2014), n=300.000+
  // 12 items per trait, 1-5 Likert, raw range 12-60
  // Normer skaleret fra 120-item IPIP-NEO til 12-item via proportionel skalering
  var BIGFIVE_NORMS = {
    O: { mean: 37.4, sd: 7.5 },   // Openness
    C: { mean: 35.2, sd: 7.4 },   // Conscientiousness
    E: { mean: 33.6, sd: 8.0 },   // Extraversion
    A: { mean: 38.0, sd: 6.9 },   // Agreeableness
    N: { mean: 30.8, sd: 8.0 },   // Neuroticism
    source: 'Johnson (2014) IPIP, n=300.000+'
  };

  // ADHD: Intervalbaseret (ingen populationsnormer for screeningstools)
  var ADHD_RANGES = {
    quick: [
      { min: 0,  max: 32, label: 'Lav',     desc: 'Under klinisk grænseværdi. De fleste i befolkningen scorer i dette interval.' },
      { min: 33, max: 57, label: 'Moderat',  desc: 'Over screeningsgrænsen. Ca. 20-30% af den screenede population scorer her.' },
      { min: 58, max: 100, label: 'Forhøjet', desc: 'Over klinisk grænseværdi. Ca. 10-15% af den screenede population scorer her.' }
    ],
    source: 'Kliniske cutoffs (ASRS v1.1)'
  };

  // ─── Dispatch ───────────────────────────────────────────────

  function getPercentile(testType, score, options) {
    options = options || {};
    var result = { percentile: null, label: '', description: '', source: '' };

    switch (testType) {
      case 'iq':
        result.percentile = scoreToPercentile(score, IQ_NORMS.mean, IQ_NORMS.sd);
        result.source = IQ_NORMS.source;
        break;

      case 'stress':
        var norm = PSS_NORMS.overall;
        if (options.age && PSS_NORMS.age[options.age]) norm = PSS_NORMS.age[options.age];
        else if (options.gender && PSS_NORMS.gender[options.gender]) norm = PSS_NORMS.gender[options.gender];
        result.percentile = scoreToPercentile(score, norm.mean, norm.sd);
        result.source = PSS_NORMS.source;
        break;

      case 'autisme':
        result.percentile = scoreToPercentile(score, AQ_NORMS.general.mean, AQ_NORMS.general.sd);
        result.source = AQ_NORMS.source;
        break;

      case 'personlighed':
        // score = { traitKey: 'O', pctNormalized: 72 }
        if (score && score.traitKey && BIGFIVE_NORMS[score.traitKey]) {
          var raw = (score.pctNormalized / 100) * 48 + 12;
          var norm = BIGFIVE_NORMS[score.traitKey];
          result.percentile = scoreToPercentile(raw, norm.mean, norm.sd);
        }
        result.source = BIGFIVE_NORMS.source;
        break;

      case 'adhd':
        var totalPct = typeof score === 'object' ? score.totalPct : score;
        var range = null;
        for (var i = 0; i < ADHD_RANGES.quick.length; i++) {
          var r = ADHD_RANGES.quick[i];
          if (totalPct >= r.min && totalPct <= r.max) { range = r; break; }
        }
        if (range) {
          result.label = range.label;
          result.description = range.desc;
        }
        result.source = ADHD_RANGES.source;
        return result; // no percentile for ADHD
    }

    // Generate label from percentile
    if (result.percentile !== null) {
      result.label = getNormLabel(result.percentile);
      result.description = formatPercentile(result.percentile);
    }
    return result;
  }

  function getNormLabel(pct) {
    if (pct >= 95) return 'Meget over gennemsnittet';
    if (pct >= 75) return 'Over gennemsnittet';
    if (pct >= 60) return 'Lidt over gennemsnittet';
    if (pct >= 40) return 'Gennemsnitligt';
    if (pct >= 25) return 'Lidt under gennemsnittet';
    if (pct >= 5)  return 'Under gennemsnittet';
    return 'Meget under gennemsnittet';
  }

  function formatPercentile(pct) {
    if (pct === null) return '';
    var rounded = Math.round(pct);
    return 'Du scorer højere end ' + rounded + '% af befolkningen';
  }

  // ─── Convenience: get all Big Five percentiles ──────────────

  function getBigFivePercentiles(traitPct) {
    var result = {};
    var keys = ['O', 'C', 'E', 'A', 'N'];
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (traitPct[key] !== undefined) {
        var r = getPercentile('personlighed', { traitKey: key, pctNormalized: traitPct[key] });
        result[key] = r.percentile;
      }
    }
    return result;
  }

  // ─── Public API ─────────────────────────────────────────────

  window.HB_NORM = {
    getPercentile: getPercentile,
    getNormLabel: getNormLabel,
    formatPercentile: formatPercentile,
    getBigFivePercentiles: getBigFivePercentiles,
    // Exposed for profilecard.js
    norms: {
      iq: IQ_NORMS,
      stress: PSS_NORMS,
      autisme: AQ_NORMS,
      personlighed: BIGFIVE_NORMS,
      adhd: ADHD_RANGES
    }
  };
})();
