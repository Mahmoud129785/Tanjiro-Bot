/* Curved image row — a vanilla re-working of the "Tilted Grid" hero.
   One row of artwork streams around the inside of a cylinder: flat at the centre, curling toward
   the viewer at both ends, fading into the page. Every tile is cut into vertical slices, each a
   flat facet turned a few degrees around the axis, so an image truly bends. Transform-only on the
   compositor; the edge fade is a static mask. */
(function () {
  const SLICES = 14, CAMERA = 1.6, MAX_W = 55;
  const arc = (b) => (CAMERA - 1 + Math.cos(b)) / (2 * CAMERA * Math.sin(b));
  const deg = (r) => (r * 180) / Math.PI;
  function measure(w, h, tile, aspect, gap, bend) {
    const th = Math.min(tile / 100 * h, (MAX_W / 100 * w) / aspect), radius = w * arc(bend);
    if (!(th > 0) || !(radius > 0)) return { columns: 2, sweep: 0, unit: 0, limit: 0 };
    const unit = deg(th / radius), pitch = (aspect + gap / 100) * unit, limit = deg(bend) + aspect * unit / 2;
    const columns = Math.min(40, Math.max(2, Math.ceil(2 * limit / pitch))), sweep = +(columns * pitch / 2).toFixed(4);
    return { columns, sweep, unit: +unit.toFixed(4), limit: +Math.min(sweep, limit).toFixed(4) };
  }
  window.mountTiltedGrid = function (host, o) {
    const images = o.images, speed = o.speed || 5, tile = o.tileHeight || 62, aspect = o.aspect || 16 / 9, gap = o.gap || 6, axis = o.axis || 50;
    const bend = Math.min(85, Math.max(5, o.curve || 78)) * Math.PI / 180, fade = o.fade || 14, uid = 'tg' + Math.random().toString(36).slice(2, 8);
    host.style.containerType = 'size';
    const band = document.createElement('div'), style = document.createElement('style');
    band.setAttribute('aria-hidden', 'true'); band.className = 'tg-band';
    const mask = `linear-gradient(90deg,transparent,#0A0A0A ${fade}%,#0A0A0A ${100 - fade}%,transparent)`;
    band.style.cssText = `position:absolute;inset:0;pointer-events:none;mask-image:${mask};-webkit-mask-image:${mask};opacity:0;transition:opacity .6s`;
    host.append(style, band);
    let L = null, ro = null;
    function build(w, h) {
      L = measure(w, h, tile, aspect, gap, bend);
      const { columns, sweep, unit, limit } = L, r = 100 * arc(bend), radius = r.toFixed(3) + 'cqw';
      const u = (n) => `calc(${+n.toFixed(4)} * min(${tile}cqh, ${+(MAX_W / aspect).toFixed(4)}cqw))`;
      const turn = (d) => `translateZ(${radius}) rotateY(${+d.toFixed(4)}deg) translateZ(-${radius})`;
      const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4);
      style.textContent = `@keyframes ${uid}{from{transform:${turn(-sweep)}}to{transform:${turn(sweep)}}0%,${hide}%,${100 - hide}%,100%{visibility:hidden}${hide + .001}%,${100 - hide - .001}%{visibility:visible}}.${uid}{animation-play-state:running}@media(prefers-reduced-motion:reduce){.${uid}{animation-play-state:paused}}`;
      band.style.perspective = (r * CAMERA).toFixed(3) + 'cqw'; band.style.perspectiveOrigin = `50% ${axis}%`;
      const share = aspect / SLICES, duration = columns * speed;
      band.innerHTML = '';
      for (let t = 0; t < columns; t++) {
        const first = columns - 1 - t, el = document.createElement('div');
        el.className = uid;
        el.style.cssText = `position:absolute;left:calc(50% - ${u(aspect / 2)});top:calc(${axis}% - ${u(.5)});width:${u(aspect)};height:${u(1)};transform-style:preserve-3d;animation:${uid} ${duration}s linear ${-t * speed}s infinite`;
        let src = images[first % images.length];
        const slices = [];
        for (let k = 0; k < SLICES; k++) {
          const s = document.createElement('div'), im = document.createElement('img');
          s.style.cssText = `position:absolute;top:0;overflow:hidden;background:#fff;left:${u((aspect - share) / 2)};width:${k === SLICES - 1 ? u(share) : `calc(${u(share)} + 1px)`};height:${u(1)};transform:${turn((aspect / 2 - (k + .5) * share) * unit)};${k === 0 ? 'border-radius:10px 0 0 10px;' : ''}${k === SLICES - 1 ? 'border-radius:0 10px 10px 0;' : ''}`;
          im.src = src; im.alt = ''; im.draggable = false; im.decoding = 'async';
          im.style.cssText = `position:absolute;top:0;max-width:none;object-fit:cover;left:${u(-k * share)};width:${u(aspect)};height:${u(1)}`;
          s.append(im); el.append(s); slices.push(im);
        }
        el.addEventListener('animationiteration', (e) => {
          const lap = Math.round(e.elapsedTime / duration); src = images[(lap * columns + first) % images.length];
          slices.forEach((im) => { im.src = src; });
        });
        band.append(el);
      }
      band.style.opacity = 1;
    }
    ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect, n = measure(width, height, tile, aspect, gap, bend);
      if (!L || n.columns !== L.columns || n.sweep !== L.sweep || n.unit !== L.unit) build(width, height);
    });
    ro.observe(host);
    return () => { ro.disconnect(); band.remove(); style.remove(); };
  };
})();
