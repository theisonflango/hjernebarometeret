// ═══════════════════════════════════════════════════════════════
//  HB_CARD — Delbart profilkort for Hjernebarometeret
//  Canvas-baseret PNG-generering til Instagram Stories / posts
// ═══════════════════════════════════════════════════════════════
(function() {
  'use strict';

  // ─── Test-konfiguration ─────────────────────────────────────

  var CONFIG = {
    iq: {
      accent: '#6b4c9a', accentDark: '#2a1f3d', accentLight: '#c4a8e8',
      name: 'IQ-Test', icon: '\u25C8',
      getHero: function(s) { return { main: '' + s.iq, sub: getIQClass(s.iq), pct: s.pct }; },
      drawVisual: drawBellCurve
    },
    adhd: {
      accent: '#2e6b9e', accentDark: '#152535', accentLight: '#7db5e0',
      name: 'ADHD-Screening', icon: '\u26A1',
      getHero: function(s) { return { main: s.totalPct + '%', sub: s.profileType || s.level, pct: null }; },
      drawVisual: drawADHDBars
    },
    autisme: {
      accent: '#3a7d5e', accentDark: '#152e22', accentLight: '#7dc4a0',
      name: 'Autisme-Test', icon: '\uD83E\uDDE9',
      getHero: function(s) { return { main: s.t + '/50', sub: s.categoryLabel || getCatLabel(s.category), pct: null }; },
      drawVisual: drawAutismeScale
    },
    personlighed: {
      accent: '#b8860b', accentDark: '#302510', accentLight: '#e0c060',
      name: 'Personlighedstest', icon: '\uD83C\uDF1F',
      getHero: function(s) { return { main: null, sub: null, pct: null }; },
      drawVisual: drawPersonlighedRadar
    },
    stress: {
      accent: '#c2553a', accentDark: '#351a14', accentLight: '#e88a70',
      name: 'Stress & Udbr\u00e6ndthed', icon: '\uD83D\uDD25',
      getHero: function(s) { return { main: s.pssTotal + '/40', sub: s.burnoutProfile || s.level, pct: null }; },
      drawVisual: drawStressRadar
    },
    eq: {
      accent: '#7a6b3a', accentDark: '#2e2816', accentLight: '#c4b070',
      name: 'Emotionel Intelligens', icon: '\uD83D\uDCA1',
      getHero: function(s) { return { main: s.total + '/165', sub: s.profile || getEQProfile(s), pct: null }; },
      drawVisual: drawEQRadar
    },
    karriere: {
      accent: '#2a7d8f', accentDark: '#152e35', accentLight: '#7dc4c8',
      name: 'Karrieretest', icon: '\uD83E\uDDED',
      getHero: function(s) { return { main: s.hollandCode || '?', sub: getRIASECLabel(s.primaryType), pct: null }; },
      drawVisual: drawKarriereHexagon
    }
  };

  function getIQClass(iq) {
    if (iq >= 130) return 'Meget h\u00f8j';
    if (iq >= 120) return 'Superior';
    if (iq >= 110) return 'Over gennemsnittet';
    if (iq >= 90) return 'Gennemsnitlig';
    if (iq >= 80) return 'Under gennemsnittet';
    return 'Lav';
  }

  function getCatLabel(cat) {
    var labels = { high: 'H\u00f8j', elevated: 'Forh\u00f8jet', average: 'Gennemsnitlig', low: 'Lav' };
    return labels[cat] || cat;
  }

  // ─── Barometer SVG → Image ──────────────────────────────────

  var barometerSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 100 100" fill="none">' +
    '<path d="M50 5 A45 45 0 0 1 95 50" stroke="#d45454" stroke-width="8" fill="none" stroke-linecap="round"/>' +
    '<path d="M50 5 A45 45 0 0 0 5 50" stroke="#4a8ec2" stroke-width="8" fill="none" stroke-linecap="round"/>' +
    '<circle cx="50" cy="50" r="6" fill="white"/>' +
    '<line x1="50" y1="50" x2="50" y2="18" stroke="white" stroke-width="3" stroke-linecap="round" transform="rotate(-30,50,50)"/>' +
  '</svg>';

  function loadBarometerImage() {
    return new Promise(function(resolve) {
      var img = new Image();
      img.onload = function() { resolve(img); };
      img.onerror = function() { resolve(null); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(barometerSVG);
    });
  }

  // ─── Font loading ───────────────────────────────────────────

  function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('600 72px "Source Serif 4"'),
      document.fonts.load('400 36px Figtree')
    ]).catch(function() {});
  }

  // ─── Canvas drawing helpers ─────────────────────────────────

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawRadar(ctx, dims, cx, cy, radius) {
    var n = dims.length;
    var step = (Math.PI * 2) / n;
    var start = -Math.PI / 2;

    // Grid rings
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (var ring = 1; ring <= 4; ring++) {
      ctx.beginPath();
      var r = radius * ring / 4;
      for (var i = 0; i <= n; i++) {
        var a = start + (i % n) * step;
        var x = cx + r * Math.cos(a);
        var y = cy + r * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Axis lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    for (var i = 0; i < n; i++) {
      var a = start + i * step;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
      ctx.stroke();
    }

    // Data polygon fill
    ctx.beginPath();
    for (var i = 0; i <= n; i++) {
      var a = start + (i % n) * step;
      var r = radius * (dims[i % n].pct / 100);
      var x = cx + r * Math.cos(a);
      var y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dots and labels
    for (var i = 0; i < n; i++) {
      var a = start + i * step;
      var r = radius * (dims[i].pct / 100);
      var dx = cx + r * Math.cos(a);
      var dy = cy + r * Math.sin(a);

      // Dot
      ctx.beginPath();
      ctx.arc(dx, dy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Label
      var lx = cx + (radius + 40) * Math.cos(a);
      var ly = cy + (radius + 40) * Math.sin(a);
      ctx.textAlign = lx < cx - 5 ? 'right' : lx > cx + 5 ? 'left' : 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '400 26px Figtree, sans-serif';
      ctx.fillText(dims[i].label, lx, ly - 14);
      ctx.fillStyle = '#fff';
      ctx.font = '600 30px "Source Serif 4", serif';
      ctx.fillText(dims[i].pct + '%', lx, ly + 16);
    }
  }

  // ─── Test-specifikke visuals ────────────────────────────────

  function drawBellCurve(ctx, scores, cx, cy, w, h) {
    var iq = scores.iq;
    var halfW = w / 2;
    var pts = [];

    // Generate bell curve points (mean=100, sd=15, range 55-145)
    for (var x = 0; x <= 100; x++) {
      var iqVal = 55 + x * 0.9; // 55 to 145
      var z = (iqVal - 100) / 15;
      var y = Math.exp(-0.5 * z * z);
      pts.push({ x: cx - halfW + (x / 100) * w, y: cy + h * 0.5 - y * h * 0.8 });
    }

    // Fill under curve
    ctx.beginPath();
    ctx.moveTo(pts[0].x, cy + h * 0.5);
    for (var i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[pts.length - 1].x, cy + h * 0.5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();

    // Curve line
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      i === 0 ? ctx.moveTo(pts[i].x, pts[i].y) : ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // User's position marker
    var userX = cx - halfW + ((iq - 55) / 90) * w;
    var userZ = (iq - 100) / 15;
    var userY = cy + h * 0.5 - Math.exp(-0.5 * userZ * userZ) * h * 0.8;

    // Vertical dashed line
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(userX, userY);
    ctx.lineTo(userX, cy + h * 0.5);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Dot at position
    ctx.beginPath();
    ctx.arc(userX, userY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Axis labels
    ctx.font = '400 22px Figtree, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var labels = [70, 85, 100, 115, 130];
    for (var i = 0; i < labels.length; i++) {
      var lx = cx - halfW + ((labels[i] - 55) / 90) * w;
      ctx.fillText('' + labels[i], lx, cy + h * 0.55);
    }
  }

  function drawADHDBars(ctx, scores, cx, cy, w, h) {
    var bars;
    if (scores.mode === 'diva') {
      bars = [
        { label: 'Opm\u00e6rksomhed', pct: scores.aPct || 0 },
        { label: 'Hyperaktivitet', pct: scores.hiPct || 0 },
        { label: 'Funktionsniveau', pct: scores.funcPct || 0 }
      ];
    } else {
      bars = [
        { label: 'Opm\u00e6rksomhed', pct: scores.attention || 0 },
        { label: 'Hyperaktivitet', pct: scores.hyperactivity || 0 },
        { label: 'Regulering', pct: scores.regulation || 0 },
        { label: 'Funktionsniveau', pct: scores.functioning || 0 }
      ];
    }

    var barH = 28;
    var gap = 20;
    var totalH = bars.length * (barH + gap) - gap;
    var startY = cy - totalH / 2;
    var barW = w * 0.7;
    var barX = cx - barW / 2;

    for (var i = 0; i < bars.length; i++) {
      var by = startY + i * (barH + gap);
      // Label
      ctx.font = '400 22px Figtree, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(bars[i].label, barX, by - 4);

      // Pct label
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = '600 22px Figtree, sans-serif';
      ctx.fillText(bars[i].pct + '%', barX + barW, by - 4);

      // Background bar
      drawRoundedRect(ctx, barX, by, barW, barH, barH / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();

      // Fill bar
      var fillW = Math.max(barH, barW * bars[i].pct / 100);
      drawRoundedRect(ctx, barX, by, fillW, barH, barH / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fill();
    }
  }

  function drawAutismeScale(ctx, scores, cx, cy, w, h) {
    var total = scores.t;
    var barW = w * 0.75;
    var barH = 20;
    var barX = cx - barW / 2;
    var barY = cy - 20;

    // Scale bar background
    var grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, 'rgba(74,190,138,0.3)');
    grad.addColorStop(0.52, 'rgba(226,180,77,0.3)');
    grad.addColorStop(0.64, 'rgba(212,84,84,0.3)');
    grad.addColorStop(1, 'rgba(212,84,84,0.4)');
    drawRoundedRect(ctx, barX, barY, barW, barH, barH / 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Thresholds
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    var t26x = barX + (26 / 50) * barW;
    var t32x = barX + (32 / 50) * barW;
    ctx.beginPath(); ctx.moveTo(t26x, barY - 15); ctx.lineTo(t26x, barY + barH + 15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(t32x, barY - 15); ctx.lineTo(t32x, barY + barH + 15); ctx.stroke();
    ctx.setLineDash([]);

    // Threshold labels
    ctx.font = '400 18px Figtree, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('26', t26x, barY + barH + 20);
    ctx.fillText('32', t32x, barY + barH + 20);

    // User marker
    var userX = barX + (total / 50) * barW;
    ctx.beginPath();
    ctx.arc(userX, barY + barH / 2, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.font = '700 16px Figtree, sans-serif';
    ctx.fillStyle = '#1c1b1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('' + total, userX, barY + barH / 2 + 1);

    // Scale labels
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '400 18px Figtree, sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText('0', barX, barY + barH + 20);
    ctx.textAlign = 'right';
    ctx.fillText('50', barX + barW, barY + barH + 20);

    // Domain mini-bars below
    if (scores.d) {
      var domains = [
        { label: 'Social', pct: (scores.d.social || 0) * 10 },
        { label: 'Skift', pct: (scores.d.switching || 0) * 10 },
        { label: 'Detalje', pct: (scores.d.detail || 0) * 10 },
        { label: 'Komm.', pct: (scores.d.communication || 0) * 10 },
        { label: 'Fantasi', pct: (scores.d.imagination || 0) * 10 }
      ];
      var miniY = barY + barH + 70;
      var miniW = barW / domains.length - 12;
      for (var i = 0; i < domains.length; i++) {
        var mx = barX + i * (miniW + 12);
        // Mini bar bg
        drawRoundedRect(ctx, mx, miniY, miniW, 12, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fill();
        // Mini bar fill
        var fw = Math.max(12, miniW * domains[i].pct / 100);
        drawRoundedRect(ctx, mx, miniY, fw, 12, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fill();
        // Label
        ctx.font = '400 16px Figtree, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(domains[i].label, mx + miniW / 2, miniY + 20);
      }
    }
  }

  function drawPersonlighedRadar(ctx, scores, cx, cy, w, h) {
    var tp = scores.traitPct || {};
    var dims = [
      { label: '\u00c5benhed', pct: tp.O || 50 },
      { label: 'Samvittighedsfuldhed', pct: tp.C || 50 },
      { label: 'Ekstraversion', pct: tp.E || 50 },
      { label: 'Venlighed', pct: tp.A || 50 },
      { label: 'Neuroticisme', pct: tp.N || 50 }
    ];
    drawRadar(ctx, dims, cx, cy, Math.min(w, h) * 0.38);
  }

  function getEQProfile(s) {
    if (!s.subscales) return '';
    var p = s.subscales.perception ? s.subscales.perception.pct : 0;
    var m = s.subscales.managing ? s.subscales.managing.pct : 0;
    var o = s.subscales.others ? s.subscales.others.pct : 0;
    var u = s.subscales.utilization ? s.subscales.utilization.pct : 0;
    if (p >= 75 && o >= 75 && m >= 70 && u >= 70) return 'Den Empatiske Leder';
    if (p >= 75 && o >= 70) return 'Den Sociale Antenne';
    if (m >= 75 && u >= 70) return 'Den Selvregulerede';
    if (u >= 75) return 'Den Kreative Motor';
    if (p >= 70 && m < 60) return 'Den Sensitive Observat\u00f8r';
    if (o >= 70 && p < 60) return 'Den Omsorgsfulde';
    if (s.total >= 118) return 'Den Balancerede';
    return 'Udvikleren';
  }

  function drawEQRadar(ctx, scores, cx, cy, w, h) {
    var subs = scores.subscales || {};
    var dims = [
      { label: 'Perception', pct: subs.perception ? subs.perception.pct : 50 },
      { label: 'Anvendelse', pct: subs.utilization ? subs.utilization.pct : 50 },
      { label: 'Regulering', pct: subs.managing ? subs.managing.pct : 50 },
      { label: 'Social EQ', pct: subs.others ? subs.others.pct : 50 }
    ];
    drawRadar(ctx, dims, cx, cy, Math.min(w, h) * 0.38);
  }

  // ─── Karriere: RIASEC helpers ──────────────────────────────

  function getRIASECLabel(type) {
    var labels = { R: 'Realistisk', I: 'Investigativ', A: 'Artistisk', S: 'Social', E: 'Entrepren\u00f8r', C: 'Konventionel' };
    return labels[type] || type || '';
  }

  function drawKarriereHexagon(ctx, scores, cx, cy, w, h) {
    var ri = scores.riasec || {};
    var dims = [
      { label: 'R', pct: ri.R || 0 },
      { label: 'I', pct: ri.I || 0 },
      { label: 'A', pct: ri.A || 0 },
      { label: 'S', pct: ri.S || 0 },
      { label: 'E', pct: ri.E || 0 },
      { label: 'C', pct: ri.C || 0 }
    ];
    drawRadar(ctx, dims, cx, cy, Math.min(w, h) * 0.34);
  }

  function drawStressRadar(ctx, scores, cx, cy, w, h) {
    var dims = [
      { label: 'Stress', pct: scores.pssPct || 0 },
      { label: 'Hj\u00e6lpel\u00f8shed', pct: scores.helpPct || 0 },
      { label: 'Self-eff.\u2193', pct: scores.effPct || 0 },
      { label: 'Udmattelse', pct: scores.exhPct || 0 },
      { label: 'Kynisme', pct: scores.cynPct || 0 },
      { label: 'Pr\u00e6station\u2193', pct: scores.accPct || 0 }
    ];
    drawRadar(ctx, dims, cx, cy, Math.min(w, h) * 0.34);
  }

  // ─── Personlighed: get profile label ────────────────────────

  function getPersonlighedLabel(tp) {
    if (!tp) return '';
    if (tp.O >= 65 && tp.E >= 65 && tp.A < 35) return 'Visionæren';
    if (tp.C >= 65 && tp.A >= 65 && tp.N < 35) return 'Diplomaten';
    if (tp.O >= 65 && tp.N >= 65) return 'Den Kreative Sjæl';
    if (tp.E >= 65 && tp.A >= 65) return 'Den Sociale Leder';
    if (tp.C >= 65 && tp.N < 35) return 'Strategen';
    if (tp.O >= 65) return 'Opdageren';
    if (tp.C >= 65) return 'Den Disciplinerede';
    if (tp.E >= 65) return 'Energibundtet';
    if (tp.A >= 65) return 'Mægleren';
    if (tp.N >= 65) return 'Den Følsomme';
    return 'Balanceret';
  }

  // ─── Main generate ─────────────────────────────────────────

  async function generate(testType, scores, options) {
    if (!scores || !CONFIG[testType]) return null;
    options = options || {};
    var format = options.format || 'story';
    var W = 1080;
    var H = format === 'square' ? 1080 : 1920;
    var cfg = CONFIG[testType];
    var hero = cfg.getHero(scores);

    await ensureFonts();
    var baroImg = await loadBarometerImage();

    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    // ── Background gradient ──
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#1c1b1a');
    bgGrad.addColorStop(0.4, cfg.accentDark);
    bgGrad.addColorStop(1, '#1c1b1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle noise pattern
    ctx.globalAlpha = 0.03;
    for (var i = 0; i < 8000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
    ctx.globalAlpha = 1;

    // ── Decorative accent glow ──
    var glowGrad = ctx.createRadialGradient(W / 2, H * 0.35, 0, W / 2, H * 0.35, W * 0.6);
    glowGrad.addColorStop(0, cfg.accent + '15');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Layout calculations ──
    var isSquare = format === 'square';
    var topY = isSquare ? 60 : 100;
    var brandY = isSquare ? 110 : 200;
    var badgeY = isSquare ? 170 : 300;
    var heroY = isSquare ? 230 : 420;
    var subY, visualCY, visualH, pctY, footerY;

    if (isSquare) {
      subY = 350;
      visualCY = 600;
      visualH = 300;
      pctY = 800;
      footerY = 1000;
    } else {
      subY = 640;
      visualCY = 920;
      visualH = 420;
      pctY = 1220;
      footerY = 1780;
    }

    // ── Barometer icon ──
    if (baroImg) {
      var iconSize = isSquare ? 60 : 80;
      ctx.drawImage(baroImg, W / 2 - iconSize / 2, topY, iconSize, iconSize);
    }

    // ── Brand name ──
    ctx.font = '600 ' + (isSquare ? 30 : 36) + 'px "Source Serif 4", serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Hjernebarometeret', W / 2, brandY);

    // ── Test name badge ──
    ctx.font = '600 ' + (isSquare ? 18 : 22) + 'px Figtree, sans-serif';
    ctx.fillStyle = cfg.accentLight;
    ctx.letterSpacing = '3px';
    var badgeText = '\u2500\u2500\u2500  ' + cfg.name.toUpperCase() + '  \u2500\u2500\u2500';
    ctx.fillText(badgeText, W / 2, badgeY);
    ctx.letterSpacing = '0px';

    // ── Hero score ──
    if (hero.main) {
      ctx.font = '600 ' + (isSquare ? 120 : 180) + 'px "Source Serif 4", serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(hero.main, W / 2, heroY);
    }

    // ── Classification / subtitle ──
    if (hero.sub) {
      ctx.font = '500 ' + (isSquare ? 26 : 34) + 'px Figtree, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(hero.sub, W / 2, hero.main ? subY : heroY);
    }

    // ── Personlighed special: show profile label as hero ──
    if (testType === 'personlighed') {
      var profileLabel = getPersonlighedLabel(scores.traitPct);
      ctx.font = '600 ' + (isSquare ? 56 : 72) + 'px "Source Serif 4", serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(profileLabel, W / 2, heroY - 20);

      ctx.font = '400 ' + (isSquare ? 24 : 30) + 'px Figtree, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('Big Five Personlighedsprofil', W / 2, heroY + (isSquare ? 40 : 50));
    }

    // ── Visual element ──
    var visualW = isSquare ? W * 0.85 : W * 0.8;
    cfg.drawVisual(ctx, scores, W / 2, visualCY, visualW, visualH);

    // ── Percentile (if available) ──
    if (window.HB_NORM) {
      var normResult = null;
      if (testType === 'iq') {
        normResult = HB_NORM.getPercentile('iq', scores.iq);
      } else if (testType === 'stress') {
        normResult = HB_NORM.getPercentile('stress', scores.pssTotal);
      } else if (testType === 'autisme') {
        normResult = HB_NORM.getPercentile('autisme', scores.t);
      } else if (testType === 'eq') {
        normResult = HB_NORM.getPercentile('eq', scores.total);
      }
      // For karriere/personlighed we skip percentile (interest profile / 5 traits)
      // For ADHD no population percentile

      if (normResult && normResult.percentile !== null) {
        // Percentile badge
        var pctText = 'H\u00f8jere end ' + Math.round(normResult.percentile) + '% af befolkningen';
        ctx.font = '400 ' + (isSquare ? 22 : 26) + 'px Figtree, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(pctText, W / 2, pctY);

        ctx.font = '400 ' + (isSquare ? 14 : 16) + 'px Figtree, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillText(normResult.source, W / 2, pctY + (isSquare ? 28 : 32));
      }
    }

    // ── Footer branding ──
    ctx.font = '500 ' + (isSquare ? 22 : 26) + 'px Figtree, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('hjernebarometeret.dk', W / 2, footerY);

    // Small barometer in footer
    if (baroImg) {
      var footIconSize = isSquare ? 30 : 36;
      ctx.globalAlpha = 0.35;
      ctx.drawImage(baroImg, W / 2 - footIconSize / 2, footerY + (isSquare ? 25 : 30), footIconSize, footIconSize);
      ctx.globalAlpha = 1;
    }

    // ── Subtle top/bottom edge lines ──
    ctx.strokeStyle = cfg.accent + '30';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W * 0.15, 40); ctx.lineTo(W * 0.85, 40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W * 0.15, H - 40); ctx.lineTo(W * 0.85, H - 40); ctx.stroke();

    return canvas;
  }

  // ─── Download ───────────────────────────────────────────────

  async function download(testType, scores, options) {
    var canvas = await generate(testType, scores, options);
    if (!canvas) return;
    canvas.toBlob(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'hjernebarometeret-' + testType + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 5000);
    }, 'image/png');
  }

  // ─── Share (Web Share API) ──────────────────────────────────

  function canShare() {
    return !!(navigator.share && navigator.canShare);
  }

  async function share(testType, scores, options) {
    var canvas = await generate(testType, scores, options);
    if (!canvas) return;
    var blob = await new Promise(function(r) { canvas.toBlob(r, 'image/png'); });
    var file = new File([blob], 'hjernebarometeret-' + testType + '.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Hjernebarometeret',
          text: 'Se mit resultat fra Hjernebarometeret'
        });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // user cancelled
      }
    }
    // Fallback to download
    download(testType, scores, options);
  }

  // ─── Public API ─────────────────────────────────────────────

  window.HB_CARD = {
    generate: generate,
    download: download,
    share: share,
    canShare: canShare
  };
})();
