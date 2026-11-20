/* Live trading-style board for the Statistics page.
   Every point is a real reading from /api/stats (emitted by app.js as `tb:stats`);
   history is kept in sessionStorage so the chart survives navigation. Nothing is invented. */
(function () {
  var KEY = 'tb-mk', MAX = 90, hist = [];
  try { hist = JSON.parse(sessionStorage.getItem('tb-mk') || '[]') || []; } catch (e) { hist = []; }
  var SER = [
    ['ms', 'Response', 'الاستجابة', ' ms', true],
    ['online', 'Visitors', 'الزوار', '', false],
    ['active', 'Bots live', 'بوتات متصلة', '', false],
    ['total', 'Installs', 'التنصيبات', '', false]
  ];
  var sel = 'ms', raf = 0, hover = -1, drawT = 0;
  function ar() { return document.documentElement.lang === 'ar'; }
  function t(a, b) { return ar() ? b : a; }
  function push(d) {
    if (!d) return;
    hist.push({ t: Date.now(), ms: +d.ms || 0, online: +d.online || 0, active: +d.active || 0, total: +d.total || 0 });
    if (hist.length > MAX) hist = hist.slice(-MAX);
    try { sessionStorage.setItem(KEY, JSON.stringify(hist)); } catch (e) {}
  }
  function fmt(v) { return Math.round(v).toLocaleString(ar() ? 'ar' : 'en'); }
  function render() {
    var host = document.getElementById('mk'); if (!host) return;
    if (!host.dataset.ready) {
      host.dataset.ready = '1';
      host.innerHTML = '<div class="mk-top"><div class="mk-tabs" role="tablist"></div><div class="mk-live"><span class="mk-pulse"></span>LIVE</div></div>'
        + '<div class="mk-price"><b class="ltr"></b><span class="mk-chg ltr"></span></div>'
        + '<div class="mk-chart"><canvas></canvas><div class="mk-tip ltr" hidden></div></div>'
        + '<div class="mk-tape"><div class="mk-tape-in ltr"></div></div>';
      var cv = host.querySelector('canvas');
      cv.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); hover = (e.clientX - r.left) / r.width; draw(); });
      cv.addEventListener('pointerleave', function () { hover = -1; draw(); });
      host.querySelector('.mk-tabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; sel = b.dataset.k; render(); anim(); });
    }
    host.querySelector('.mk-tabs').innerHTML = SER.map(function (s) {
      return '<button role="tab" data-k="' + s[0] + '" class="' + (s[0] === sel ? 'on' : '') + '" aria-selected="' + (s[0] === sel) + '">' + t(s[1], s[2]) + '</button>';
    }).join('');
    var last = hist[hist.length - 1], prev = hist[hist.length - 2];
    var tape = SER.map(function (s) {
      if (!last) return '<span>' + t(s[1], s[2]) + ' —</span>';
      var d = prev ? last[s[0]] - prev[s[0]] : 0, good = s[4] ? d <= 0 : d >= 0;
      return '<span>' + t(s[1], s[2]) + ' <b>' + fmt(last[s[0]]) + s[3] + '</b> <i class="' + (d === 0 ? '' : good ? 'up' : 'dn') + '">' + (d > 0 ? '▲' : d < 0 ? '▼' : '•') + ' ' + fmt(Math.abs(d)) + '</i></span>';
    }).join('');
    host.querySelector('.mk-tape-in').innerHTML = tape + tape;
    var s = SER.filter(function (x) { return x[0] === sel; })[0];
    var price = host.querySelector('.mk-price b'), chg = host.querySelector('.mk-chg');
    if (!last) { price.textContent = '—'; chg.textContent = t('Waiting for the bot server…', 'بانتظار سيرفر البوت…'); chg.className = 'mk-chg'; return; }
    var first = hist[0][sel], cur = last[sel], diff = cur - first, pct = first ? diff / first * 100 : 0, good = s[4] ? diff <= 0 : diff >= 0;
    countTo(price, cur, s[3]);
    chg.textContent = (diff >= 0 ? '+' : '') + fmt(diff) + s[3] + '  (' + (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%)';
    chg.className = 'mk-chg ltr ' + (diff === 0 ? '' : good ? 'up' : 'dn');
  }
  function countTo(el, to, suf) {
    var from = +el.dataset.v || 0, t0 = performance.now(); el.dataset.v = to;
    (function step(n) { var k = Math.min(1, (n - t0) / 700), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e) + suf; if (k < 1) requestAnimationFrame(step); })(t0);
  }
  function anim() { drawT = performance.now(); cancelAnimationFrame(raf); (function f() { draw(); if (performance.now() - drawT < 900) raf = requestAnimationFrame(f); })(); }
  function draw() {
    var host = document.getElementById('mk'); if (!host) return;
    var cv = host.querySelector('canvas'); if (!cv) return;
    var dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
    var cs = getComputedStyle(host), line = cs.getPropertyValue('--mk-grid') || 'rgba(255,255,255,.07)';
    c.strokeStyle = line; c.lineWidth = 1;
    for (var g = 1; g < 5; g++) { c.beginPath(); c.moveTo(0, h * g / 5); c.lineTo(w, h * g / 5); c.stroke(); }
    var v = hist.map(function (p) { return p[sel]; });
    if (v.length < 2) { c.fillStyle = 'rgba(255,255,255,.45)'; c.font = '13px DM Sans, sans-serif'; c.textAlign = 'center'; c.fillText(t('Collecting live readings…', 'جارٍ جمع القراءات المباشرة…'), w / 2, h / 2); return; }
    var mn = Math.min.apply(0, v), mx = Math.max.apply(0, v); if (mx === mn) { mx += 1; mn -= 1; }
    var pad = (mx - mn) * .18; mn -= pad; mx += pad;
    var prog = Math.min(1, (performance.now() - drawT) / 900), e = 1 - Math.pow(1 - prog, 3);
    var X = function (i) { return i / (v.length - 1) * w; }, Y = function (y) { return h - (y - mn) / (mx - mn) * h; };
    var s = SER.filter(function (x) { return x[0] === sel; })[0], up = s[4] ? v[v.length - 1] <= v[0] : v[v.length - 1] >= v[0];
    var col = up ? '#00E676' : '#FF3D57';
    var n = Math.max(2, Math.ceil(v.length * e));
    var grd = c.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, up ? 'rgba(0,230,118,.35)' : 'rgba(255,61,87,.35)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    c.beginPath(); c.moveTo(X(0), Y(v[0]));
    for (var i = 1; i < n; i++) { var mxp = (X(i - 1) + X(i)) / 2; c.bezierCurveTo(mxp, Y(v[i - 1]), mxp, Y(v[i]), X(i), Y(v[i])); }
    c.lineTo(X(n - 1), h); c.lineTo(0, h); c.closePath(); c.fillStyle = grd; c.fill();
    c.beginPath(); c.moveTo(X(0), Y(v[0]));
    for (i = 1; i < n; i++) { mxp = (X(i - 1) + X(i)) / 2; c.bezierCurveTo(mxp, Y(v[i - 1]), mxp, Y(v[i]), X(i), Y(v[i])); }
    c.strokeStyle = col; c.lineWidth = 2.2; c.shadowColor = col; c.shadowBlur = 12; c.stroke(); c.shadowBlur = 0;
    var lx = X(n - 1), ly = Y(v[n - 1]), pulse = (performance.now() % 1600) / 1600;
    c.fillStyle = col; c.beginPath(); c.arc(lx, ly, 4, 0, 7); c.fill();
    c.globalAlpha = 1 - pulse; c.beginPath(); c.arc(lx, ly, 4 + pulse * 14, 0, 7); c.strokeStyle = col; c.lineWidth = 1.5; c.stroke(); c.globalAlpha = 1;
    c.setLineDash([4, 4]); c.strokeStyle = col; c.globalAlpha = .5; c.beginPath(); c.moveTo(0, ly); c.lineTo(w, ly); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    var tip = host.querySelector('.mk-tip');
    if (hover >= 0) {
      var hi = Math.round(hover * (v.length - 1)), hx = X(hi), hy = Y(v[hi]);
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(hx, 0); c.lineTo(hx, h); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(hx, hy, 4, 0, 7); c.fill();
      tip.hidden = false; tip.style.left = Math.min(w - 120, Math.max(0, hx - 60)) + 'px';
      tip.textContent = fmt(v[hi]) + s[3] + ' · ' + new Date(hist[hi].t).toLocaleTimeString(ar() ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } else tip.hidden = true;
  }
  window.addEventListener('tb:stats', function (e) { push(e.detail); render(); anim(); });
  window.addEventListener('resize', draw);
  setInterval(function () { if (document.getElementById('mk')) { if (!document.getElementById('mk').dataset.ready) render(); draw(); } }, 60);
})();
