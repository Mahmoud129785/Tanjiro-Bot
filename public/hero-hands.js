/* Home hero — two hands made of dots that dissolve between two poses.
   Port of the supplied landing page script. Differences from the original, all on purpose:
   - it sizes itself to the hero element (not the window) and follows it with a ResizeObserver;
   - dots are faded out around the real text blocks (measured from the DOM), so nothing overlaps;
   - it pauses off-screen, shows one still frame for reduced motion, and returns a disposer so the
     hash router can tear it down when the page changes.
   Artwork: the original four-tile hands sheet (left/right hand x pose A/B), passed in as o.sheet. */
(function () {
  const LOOP = 20, LEVELS = [0, .26, .52, .78, 1], PAD = 14, FADE = 52;
  const RECTS = { LA: [0, .06, .47, .40], RA: [.53, .06, .47, .40], LB: [0, .55, .47, .40], RB: [.53, .55, .47, .40] };
  const fract = (n) => n - Math.floor(n);
  const hash = (a, b) => fract(Math.sin(a * 127.1 + b * 311.7) * 43758.5453);
  const smooth = (a, b, x) => { const q = Math.max(0, Math.min(1, (x - a) / (b - a))); return q * q * (3 - 2 * q); };
  const mixAt = (t, on, off, dur) => smooth(on, on + dur, t) * (1 - smooth(off, off + dur, t));

  window.mountHeroHands = function (hero, o) {
    const canvas = hero.querySelector('canvas'), ctx = canvas.getContext('2d');
    const animate = o.animate !== false, ink = o.ink || '#0A0A0A';
    const img = new Image(), tiles = {};
    let W = 0, H = 0, DPR = 1, step = 7, rowStep = 14, cols = 0, rows = 0, R = 3.2;
    let fA, fB, aCtx, bCtx, quiet = null, raf = 0, ro = null, io = null, ready = false, visible = true, dead = false;
    const t0 = performance.now();

    function setup() {
      W = hero.clientWidth; H = hero.clientHeight;
      if (!W || !H) return;
      DPR = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.floor(W * DPR); canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      step = Math.max(5, W / 205); rowStep = step * 2.05; cols = Math.ceil(W / step); rows = Math.ceil(H / rowStep); R = step * .46;
      fA = document.createElement('canvas'); fB = document.createElement('canvas');
      fA.width = fB.width = cols; fA.height = fB.height = rows;
      aCtx = fA.getContext('2d', { willReadFrequently: true }); bCtx = fB.getContext('2d', { willReadFrequently: true });
      measure();
    }

    /* A per-cell multiplier: 0 right under any text block, easing back to 1 a short way out. */
    function measure() {
      const h = hero.getBoundingClientRect(), boxes = [];
      (o.avoid ? o.avoid() : []).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width && r.height) boxes.push([r.left - h.left - PAD, r.top - h.top - PAD, r.right - h.left + PAD, r.bottom - h.top + PAD]);
      });
      quiet = new Float32Array(cols * rows).fill(1);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const px = (i + .5) * step, py = (j + .5) * rowStep;
        let m = 1;
        for (const b of boxes) {
          const d = Math.hypot(Math.max(b[0] - px, 0, px - b[2]), Math.max(b[1] - py, 0, py - b[3]));
          m = Math.min(m, smooth(0, FADE, d));
        }
        quiet[j * cols + i] = m;
      }
    }

    function makeTiles() {
      if (!img.naturalWidth) return;
      Object.entries(RECTS).forEach(([key, r]) => {
        const tile = document.createElement('canvas'); tile.width = 420; tile.height = Math.round(420 * r[3] / r[2]);
        const c = tile.getContext('2d'); c.imageSmoothingQuality = 'high';
        c.drawImage(img, img.naturalWidth * r[0], img.naturalHeight * r[1], img.naturalWidth * r[2], img.naturalHeight * r[3], 0, 0, tile.width, tile.height);
        tiles[key] = tile;
      });
      ready = true;
      hero.classList.add('kh-ready');
      if (!animate) frame(7); else start();
    }

    function drawHand(target, tile, side, t) {
      const portrait = H > W, hw = W * (portrait ? .82 : .53), hh = hw * (.40 * 1520) / (.47 * 2688), cy = H * (portrait ? .6 : .54);
      const ph = side === 'left' ? 0 : Math.PI, a = 2 * Math.PI * t / LOOP;
      const reach = (.035 * Math.sin(a + ph) + .012 * Math.sin(2 * a + 1.3 + ph)) * W;
      const scale = 1 + .07 * Math.sin(a + .9 + ph), rot = (side === 'left' ? 1 : -1) * .045 * Math.sin(a + 2.1 + ph);
      const x = side === 'left' ? reach - W * .045 : W - hw + W * .045 - reach;
      target.save(); target.setTransform(cols / W, 0, 0, rows / H, 0, 0);
      const px = side === 'left' ? 0 : W;
      target.translate(px, cy); target.rotate(rot); target.scale(scale, scale); target.translate(-px, -cy);
      target.drawImage(tile, x, cy - hh / 2, hw, hh); target.restore();
    }

    function frame(t) {
      if (!ready || !cols) return;
      aCtx.fillStyle = '#fff'; bCtx.fillStyle = '#fff'; aCtx.fillRect(0, 0, cols, rows); bCtx.fillRect(0, 0, cols, rows);
      drawHand(aCtx, tiles.LA, 'left', t); drawHand(aCtx, tiles.RA, 'right', t);
      drawHand(bCtx, tiles.LB, 'left', t); drawHand(bCtx, tiles.RB, 'right', t);
      const A = aCtx.getImageData(0, 0, cols, rows).data, B = bCtx.getImageData(0, 0, cols, rows).data, tick = Math.floor(t * 7);
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = ink;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const seed = .55 * hash(i, j) + .45 * hash(j * 3.1, 7.7);
        const m = i < cols / 2 ? mixAt(t, 6.2, 14.6, 1.6) : mixAt(t, 2.4, 10.4, 1.6), front = Math.abs(seed - m) < .12;
        const shift = hash(j, tick) > .965 ? Math.round((hash(tick, j) - .5) * 8) : 0;
        const si = Math.max(0, Math.min(cols - 1, i - shift)), idx = (j * cols + si) * 4;
        const data = seed < m ? B : A;
        let v = Math.max(0, Math.min(1, (1 - data[idx] / 255 - .16) / .42));
        v *= .86 + .14 * Math.sin(t * 3.2 + seed * 40);
        const cx = Math.abs((i + .5) / cols - .5);
        v *= smooth(.035, .11, cx) * quiet[j * cols + i];
        if (front) { v *= Math.abs(seed - m) / .12; if (hash(i + tick, j) <= .4) v *= .3; }
        let level = 0; for (const l of LEVELS) if (v >= l - .13) level = l;
        if (level > 0) {
          const rr = R * (level === .26 ? .38 : level);
          ctx.beginPath(); ctx.arc((i + .5) * step, (j + .5) * rowStep, rr, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    function loop(now) {
      raf = 0;
      if (dead || !visible) return;
      frame(((now - t0) / 1000) % LOOP);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (animate && ready && visible && !raf && !dead) raf = requestAnimationFrame(loop); }

    img.crossOrigin = 'anonymous'; // the dots are read back from the pixels, so the host must allow CORS
    img.onload = makeTiles;
    img.onerror = () => hero.classList.add('kh-nofx');
    img.src = o.sheet;
    setup();
    ro = new ResizeObserver(() => { setup(); if (ready && !animate) frame(7); });
    ro.observe(hero);
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: 0 });
      io.observe(hero);
    }
    // text metrics change once web fonts arrive, so measure again
    document.fonts?.ready.then(() => { if (!dead) { measure(); if (ready && !animate) frame(7); } });

    return function dispose() {
      dead = true; if (raf) cancelAnimationFrame(raf); raf = 0;
      ro && ro.disconnect(); io && io.disconnect();
    };
  };
})();
