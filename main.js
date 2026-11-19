const WORK = [
  ['w01', 'Dubai Property', 'Real estate'],
  ['w13', 'Eden Haven Sorrento', 'Real estate'],
  ['w19', 'Luxury Consumer Breakdown', 'YouTube · 16:9'],
  ['w03', 'Fibonacci Reel', 'Rinu FX'],
  ['w02', 'Forex vs Indian Stocks', 'Fintech · Malayalam'],
  ['w07', 'What is Forex?', '5-chapter explainer'],
  ['w10', 'Prop Firm vs Broker', '3D · Malayalam'],
  ['w06', 'Drawdown Rules', 'Fintech explainer'],
  ['w05', 'Infographic Explainer', 'Talking head + data'],
  ['w14', 'Festival Stage', 'Videography'],
  ['w15', 'Live Concert', 'Videography'],
  ['w17', 'Crowd Shot', 'Videography'],
  ['w18', 'EV Showroom', 'Automotive'],
  ['w12', 'TradeX Ad 02', 'Ad creative'],
];

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---- glass + bubbles (decorative, so built here rather than in the HTML) --
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const isChromium = !!window.chrome || /Chrome\//.test(navigator.userAgent);
const lensOK = fine && isChromium && innerWidth > 860 && CSS.supports('backdrop-filter', 'url(#lens)');
if (lensOK) {
  // one shared lens: wobbly noise pushes what is behind the glass sideways
  const holder = document.createElement('div');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  holder.innerHTML = '<svg width="0" height="0"><filter id="lens" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.004 0.006" numOctaves="1" seed="11" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G"/>'
    + '</filter></svg>';
  document.body.prepend(holder);
  document.documentElement.classList.add('lens');
}

// ---- nav background ------------------------------------------------------
const nav = document.getElementById('nav');
const markNav = () => nav.classList.toggle('is-solid', scrollY > (reduced ? 40 : innerHeight * 0.9));
addEventListener('scroll', markNav, { passive: true });
markNav();

// ---- scroll-linked animation --------------------------------------------
// Everything is tied to scroll position, so it moves with the page and
// reverses when you scroll back up.
// each section picks its own way in, fresh on every visit
const ARRIVALS = ['rise', 'left', 'right', 'zoom', 'tiltL', 'tiltR'];
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const scrubEls = [...document.querySelectorAll('.reveal')].map((el) => ({ el, y: 0, mode: el.id === 'car' ? 'rise' : pick(ARRIVALS) }));
const heroEl = document.querySelector('.hero');
const heroCopy = document.querySelector('.hero__copy');
const heroStats = document.querySelector('.stats');
let scrubQueued = false;
let melt = null;           // set once the liquid photo is running
let ink = null;            // set once the page-to-page melt is running
let pageTop = (el) => el.getBoundingClientRect().top + scrollY;
let meltY = scrollY;
const applyScroll = () => {
  scrubQueued = false;
  const vh = innerHeight;
  const p = clamp(scrollY / vh, 0, 1);
  heroEl.style.setProperty('--p', p.toFixed(3));
  heroEl.style.setProperty('--z', (1 + p * 0.1).toFixed(3));
  const m = clamp(p / 0.92, 0, 1);
  const g = m * m * (3 - 2 * m);
  heroEl.style.setProperty('--fade', (1 - g).toFixed(3));
  heroEl.style.visibility = g >= 1 ? 'hidden' : '';
  heroEl.style.pointerEvents = g > 0.7 ? 'none' : '';
  if (melt) melt(g, scrollY - meltY);
  meltY = scrollY;
  if (ink) ink();
  heroCopy.style.transform = `translate3d(0, ${(-p * 120).toFixed(1)}px, 0)`;
  heroCopy.style.opacity = clamp(1 - p * 2.8, 0, 1).toFixed(3);
  heroStats.style.transform = `translate3d(0, ${(-p * 60).toFixed(1)}px, 0)`;
  heroStats.style.opacity = clamp(1 - p * 3.2, 0, 1).toFixed(3);
  scrubEls.forEach((item) => {
    const top = item.el.getBoundingClientRect().top - item.y;   // ignore our own offset
    const t = clamp((vh - top) / (vh * 0.62), 0, 1);
    const e = 1 - (1 - t) ** 3;
    const r = 1 - e;
    item.y = item.mode === 'rise' || item.mode.startsWith('tilt') ? r * 38 : 0;
    item.el.style.opacity = e.toFixed(3);
    let tf = `translate3d(0, ${item.y.toFixed(1)}px, 0)`;
    if (item.mode === 'left') tf = `translate3d(${(-r * 110).toFixed(1)}px, 0, 0)`;
    if (item.mode === 'right') tf = `translate3d(${(r * 110).toFixed(1)}px, 0, 0)`;
    if (item.mode === 'zoom') tf = `scale(${(0.86 + 0.14 * e).toFixed(4)})`;
    if (item.mode === 'tiltL') tf += ` rotate(${(-r * 3.5).toFixed(2)}deg)`;
    if (item.mode === 'tiltR') tf += ` rotate(${(r * 3.5).toFixed(2)}deg)`;
    item.el.style.transform = tf;
  });
};
const queueScroll = () => {
  if (scrubQueued) return;
  scrubQueued = true;
  requestAnimationFrame(applyScroll);
};
if (reduced) {
  scrubEls.forEach(({ el }) => { el.style.opacity = 1; });
} else {
  document.documentElement.classList.add('scrub');
  addEventListener('scroll', queueScroll, { passive: true });
  addEventListener('resize', queueScroll);
  addEventListener('load', queueScroll);
  applyScroll();
}

// ---- carousel ------------------------------------------------------------
const car = document.getElementById('car');
const track = document.getElementById('track');
const countEl = document.getElementById('count');
const prev = document.getElementById('prev');
const next = document.getElementById('next');

const cards = WORK.map(([id, title, tag], i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'card';
  b.dataset.i = i;
  b.setAttribute('aria-label', `Play ${title}`);
  const clip = document.createElement('video');
  clip.muted = true;
  clip.defaultMuted = true;
  clip.loop = true;
  clip.playsInline = true;
  clip.preload = 'none';
  clip.poster = `assets/thumbs/${id}.jpg`;
  clip.src = `assets/previews/${id}.mp4`;
  clip.setAttribute('aria-hidden', 'true');
  clip.tabIndex = -1;
  const play = document.createElement('span');
  play.className = 'card__play';
  play.textContent = '▶';
  play.setAttribute('aria-hidden', 'true');
  const meta = document.createElement('span');
  meta.className = 'card__meta';
  const small = document.createElement('small');
  small.textContent = tag;
  const strong = document.createElement('strong');
  strong.textContent = title;
  meta.append(small, strong);
  b.append(clip, play, meta);
  track.appendChild(b);
  return b;
});

const last = WORK.length - 1;
const N = WORK.length;
// shortest signed distance around the loop, so card 1 follows card 12
const wrap = (v) => { const m = ((v % N) + N) % N; return m > N / 2 ? m - N : m; };
const wrapIndex = (v) => ((v % N) + N) % N;
countEl.nextSibling.textContent = ` / ${N}`;
let pos = 0;
let target = 0;
let vel = 0;
let raf = 0;
let running = false;
let step = 1;
let grabbed = 0;
const lag = cards.map(() => 0);   // each card trails the track by its own amount

// live previews: only the cards around the centre play, and only on screen
let shownNear = -1;
let carVisible = false;
let carSeen = false;
let carAway = false;      // the work page has been fully covered by the next one
const carState = () => { carVisible = carSeen && !carAway; syncClips(); };
const syncClips = () => {
  const modal = document.getElementById('player').open;
  cards.forEach((c, i) => {
    const v = c.querySelector('video');
    const dist = Math.abs(wrap(i - shownNear));
    const on = carVisible && !modal && !reduced && dist <= 1;
    if (dist <= 3) v.preload = 'auto';
    if (on && v.paused) v.play().catch(() => { /* poster stays */ });
    if (!on && !v.paused) v.pause();
  });
};
new IntersectionObserver(([e]) => {
  carSeen = e.isIntersecting;
  carState();
}, { threshold: 0.25 }).observe(car);

const measure = () => {
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
  step = cards[0].offsetWidth + gap;
};

const paint = () => {
  const x = car.clientWidth / 2 - cards[0].offsetWidth / 2;
  track.style.transform = `translate3d(${x}px, 0, 0)`;
  const reach = Math.ceil(car.clientWidth / 2 / step) + 1;
  cards.forEach((c, i) => {
    const w = wrap(i - pos);
    if (Math.abs(w) > reach) {            // off screen: nothing to draw
      if (c.style.visibility !== 'hidden') c.style.visibility = 'hidden';
      return;
    }
    if (c.style.visibility) c.style.visibility = '';
    const d = clamp(w, -3, 3);
    const gap = pos - lag[i];                      // how far this card is trailing
    const squash = clamp(Math.abs(gap) * 0.16, 0, 0.1);
    const flat = 1 - Math.min(Math.abs(w), 3) * 0.045 + squash;
    c.style.transform = `translate3d(${(((w - i) * step) + gap * step * 0.55).toFixed(1)}px, 0, 0) `
      + `skewX(${clamp(-gap * 11, -11, 11).toFixed(2)}deg) scale(${flat.toFixed(3)}, ${(flat - squash * 2).toFixed(3)})`;
  });
  const near = wrapIndex(Math.round(pos));
  if (near !== shownNear) { shownNear = near; syncClips(); }
  countEl.textContent = String(near + 1).padStart(2, '0');
};

const animate = () => {
  if (reduced) { pos = target; lag.fill(pos); paint(); return; }
  if (running) return;
  running = true;
  const tick = () => {
    if (!drag) {
      // a soft under-damped spring: it overshoots a touch, then settles
      vel = (vel + (target - pos) * 0.035) * 0.82;
      pos += vel;
    }
    let spread = 0;
    lag.forEach((l, i) => {
      const k = 0.26 - Math.min(Math.abs(wrap(i - grabbed)), 4) * 0.035;
      lag[i] = l + (pos - l) * k;
      spread = Math.max(spread, Math.abs(pos - lag[i]));
    });
    paint();
    if (!drag && Math.abs(target - pos) < 0.0015 && Math.abs(vel) < 0.0015 && spread < 0.002) {
      pos = target; vel = 0; lag.fill(pos); paint();
      running = false;
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
};

const go = (i) => { target = i; animate(); };
prev.addEventListener('click', () => go(Math.round(target) - 1));
next.addEventListener('click', () => go(Math.round(target) + 1));
car.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') { e.preventDefault(); go(Math.round(target) - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); go(Math.round(target) + 1); }
});

// drag: only a real movement counts, so a plain click still opens the video
let drag = null;
let moved = false;
car.addEventListener('pointerdown', (e) => {
  if (e.button) return;
  const under = e.target.closest ? e.target.closest('.card') : null;
  grabbed = under ? Number(under.dataset.i) : Math.round(pos);
  drag = { x: e.clientX, start: pos, lastX: e.clientX, lastT: e.timeStamp, v: 0, id: e.pointerId };
  vel = 0;
  moved = false;
  animate();
});
car.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  if (!moved && Math.abs(dx) > 6) {
    moved = true;
    car.classList.add('is-drag');
    car.setPointerCapture(drag.id);
  }
  if (!moved) return;
  const dt = Math.max(1, e.timeStamp - drag.lastT);
  drag.v = (e.clientX - drag.lastX) / dt;
  drag.lastX = e.clientX;
  drag.lastT = e.timeStamp;
  const nextPos = drag.start - dx / step;
  vel = nextPos - pos;
  pos = nextPos;
  target = pos;
});
const endDrag = () => {
  if (!drag) return;
  const flick = moved ? clamp(-drag.v * 1.4, -3, 3) : 0;
  const wasMoved = moved;
  drag = null;
  car.classList.remove('is-drag');
  if (wasMoved) go(Math.round(pos + flick));
  else go(Math.round(target));
  // the click that follows a drag must be ignored, but no later one
  setTimeout(() => { moved = false; }, 60);
};
car.addEventListener('pointerup', endDrag);
car.addEventListener('pointercancel', endDrag);

// ---- auto-scroll ----------------------------------------------------------
// A slow continuous drift while the section is on screen. Hovering slows it,
// and any hands-on control (drag, arrows, keys) holds it for a moment.
if (!reduced) {
  const SPEED = 0.45;          // cards per second
  const HOLD = 2500;           // ms to wait after the visitor takes over
  let holdUntil = 0;
  let hovering = false;
  let rate = 1;
  let lastT = performance.now();
  const hold = () => { holdUntil = performance.now() + HOLD; };
  car.addEventListener('pointerenter', () => { hovering = true; });
  car.addEventListener('pointerleave', () => { hovering = false; });
  car.addEventListener('pointerdown', hold);
  car.addEventListener('pointerup', hold);
  car.addEventListener('keydown', hold);
  prev.addEventListener('click', hold);
  next.addEventListener('click', hold);
  const drift = (now) => {
    requestAnimationFrame(drift);
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const stopped = !carVisible || drag || now < holdUntil
      || document.getElementById('player').open || document.visibilityState === 'hidden';
    const wanted = stopped ? 0 : hovering ? 0.28 : 1;
    rate += (wanted - rate) * Math.min(1, dt * 4);   // ease in and out of motion
    if (rate < 0.004 || drag) return;
    target += SPEED * rate * dt;
    animate();
  };
  requestAnimationFrame(drift);
}

// ---- video player --------------------------------------------------------
const player = document.getElementById('player');
const video = document.getElementById('playerVideo');
const playerTitle = document.getElementById('playerTitle');
let opener = null;

track.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card || moved) return;
  const [id, title] = WORK[Number(card.dataset.i)];
  opener = card;
  playerTitle.textContent = title;
  video.src = `assets/work/${id}.mp4`;
  player.classList.remove('wide');
  video.onloadedmetadata = () => player.classList.toggle('wide', video.videoWidth > video.videoHeight);
  player.showModal();
  syncClips();
  video.play().catch(() => { /* autoplay refused: the controls are there */ });
});

player.addEventListener('close', () => {
  video.pause();
  video.removeAttribute('src');
  video.load();
  syncClips();
  if (opener) opener.focus();
});
document.getElementById('playerClose').addEventListener('click', () => player.close());
player.addEventListener('click', (e) => { if (e.target === player) player.close(); });

// ---- copy buttons --------------------------------------------------------
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-copy]');
  if (!b || !navigator.clipboard) return;
  navigator.clipboard.writeText(b.dataset.copy).then(() => {
    const was = b.textContent;
    b.textContent = 'Copied';
    setTimeout(() => { b.textContent = was; }, 1500);
  }, () => {});
});

// ---- jelly images --------------------------------------------------------
// Each image is a soft sheet of springs on a small grid. Moving the cursor
// pushes nearby nodes; neighbours pull on each other, so the push ripples out
// and the picture wobbles back to rest. Asleep whenever nothing is moving.
const jellies = [];
window.__jelly = jellies;   // read by tests
function makeJelly(img, focalX) {
  const canvas = document.createElement('canvas');
  canvas.className = 'jelly';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) return;
  const shader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER,
    'attribute vec2 p;attribute vec2 u;attribute float l;varying vec2 vU;varying float vL;'
    + 'void main(){vU=u;vL=l;gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER,
    'precision mediump float;uniform sampler2D t;varying vec2 vU;varying float vL;'
    + 'void main(){vec3 c=texture2D(t,vU).rgb;'
    + 'c+=max(vL,0.)*vec3(.55,.42,.34);c*=1.+min(vL,0.)*.55;gl_FragColor=vec4(c,1.);}'));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

  const buf = gl.createBuffer();
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  const bind = (name, n, off) => {
    const a = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, n, gl.FLOAT, false, 20, off);
  };
  bind('p', 2, 0);
  bind('u', 2, 8);
  bind('l', 1, 16);

  const j = {
    img, canvas, cols: 0, rows: 0, w: 0, h: 0, awake: false,
    dx: null, dy: null, vx: null, vy: null, verts: null, indices: 0, sx: 1, sy: 1,
  };

  const build = () => {
    const box = canvas.getBoundingClientRect();
    if (box.width < 2) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    j.w = box.width;
    j.h = box.height;
    j.cols = clamp(Math.round(box.width / 26), 10, 64);
    j.rows = clamp(Math.round(box.height / 26), 10, 40);
    const n = (j.cols + 1) * (j.rows + 1);
    j.dx = new Float32Array(n);
    j.dy = new Float32Array(n);
    j.vx = new Float32Array(n);
    j.vy = new Float32Array(n);
    j.verts = new Float32Array(n * 5);
    const idx = new Uint16Array(j.cols * j.rows * 6);
    let w = 0;
    for (let r = 0; r < j.rows; r++) {
      for (let c = 0; c < j.cols; c++) {
        const a = r * (j.cols + 1) + c;
        const b = a + j.cols + 1;
        idx[w++] = a; idx[w++] = b; idx[w++] = a + 1;
        idx[w++] = a + 1; idx[w++] = b; idx[w++] = b + 1;
      }
    }
    j.indices = idx.length;
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    // same crop as object-fit: cover
    const ca = box.width / box.height;
    const ta = img.naturalWidth / img.naturalHeight;
    j.sx = ca > ta ? 1 : ca / ta;
    j.sy = ca > ta ? ta / ca : 1;
    draw();
  };

  const draw = () => {
    const { cols, rows, dx, dy, verts, w, h, sx, sy } = j;
    const ox = focalX * (1 - sx);
    const oy = 0.5 * (1 - sy);
    let o = 0;
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const i = r * (cols + 1) + c;
        const gx = c / cols;
        const gy = r / rows;
        verts[o++] = gx * 2 - 1;
        verts[o++] = 1 - gy * 2;
        verts[o++] = ox + (gx - dx[i] / w) * sx;
        verts[o++] = oy + (gy - dy[i] / h) * sy;
        const left = c > 0 ? dx[i - 1] : 0;
        const right = c < cols ? dx[i + 1] : 0;
        const up = r > 0 ? dy[i - cols - 1] : 0;
        const down = r < rows ? dy[i + cols + 1] : 0;
        verts[o++] = clamp((right - left + down - up) * -0.018, -0.5, 0.42);
      }
    }
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.TRIANGLES, j.indices, gl.UNSIGNED_SHORT, 0);
  };

  const STIFF = 0.022;   // pull back to rest
  const LINK = 0.2;      // how strongly neighbours drag each other
  const DAMP = 0.945;    // lower = stops sooner
  j.step = () => {
    const { cols, rows, dx, dy, vx, vy } = j;
    let energy = 0;
    const W = cols + 1;
    for (let r = 1; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        const i = r * W + c;
        const lx = dx[i - 1] + dx[i + 1] + dx[i - W] + dx[i + W] - 4 * dx[i];
        const ly = dy[i - 1] + dy[i + 1] + dy[i - W] + dy[i + W] - 4 * dy[i];
        vx[i] = (vx[i] + lx * LINK - dx[i] * STIFF) * DAMP;
        vy[i] = (vy[i] + ly * LINK - dy[i] * STIFF) * DAMP;
      }
    }
    for (let r = 1; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        const i = r * W + c;
        dx[i] = clamp(dx[i] + vx[i], -78, 78);
        dy[i] = clamp(dy[i] + vy[i], -78, 78);
        energy += vx[i] * vx[i] + vy[i] * vy[i] + dx[i] * dx[i] * 0.02 + dy[i] * dy[i] * 0.02;
      }
    }
    draw();
    return energy;
  };

  j.push = (px, py, mx, my, power) => {
    if (!j.w) return;
    const { cols, rows, vx, vy, w, h } = j;
    const R = Math.max(110, Math.min(w, h) * 0.34);
    for (let r = 1; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        const ax = (c / cols) * w - px;
        const ay = (r / rows) * h - py;
        const q = 1 - (ax * ax + ay * ay) / (R * R);
        if (q <= 0) continue;
        const i = r * (cols + 1) + c;
        vx[i] += mx * q * q * power;
        vy[i] += my * q * q * power;
      }
    }
  };

  img.after(canvas);
  new ResizeObserver(build).observe(canvas);
  build();
  canvas.classList.add('is-on');
  jellies.push(j);
}

// ---- liquid first page ---------------------------------------------------
// A small real-time fluid simulation. The cursor stirs a velocity field, which
// carries a map of "where each pixel of the photo came from", so the picture
// swirls like liquid and then flows back. Asleep whenever nothing is moving.
function makeFluid(img, focalX) {
  const canvas = document.createElement('canvas');
  canvas.className = 'jelly';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return false;
  if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) return false;

  const HEAD = 'precision highp float;precision highp sampler2D;varying vec2 v;';
  const NEAR = 'uniform vec2 E;'
    + 'vec4 l(sampler2D t){return texture2D(t,v-vec2(E.x,0.));}'
    + 'vec4 r(sampler2D t){return texture2D(t,v+vec2(E.x,0.));}'
    + 'vec4 b(sampler2D t){return texture2D(t,v-vec2(0.,E.y));}'
    + 'vec4 u(sampler2D t){return texture2D(t,v+vec2(0.,E.y));}';
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const vert = compile(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}');
  let failed = false;
  const program = (body) => {
    const p = gl.createProgram();
    gl.attachShader(p, vert);
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, HEAD + body));
    gl.bindAttribLocation(p, 0, 'p');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) failed = true;
    return { p, at: {} };
  };

  const P = {
    splat: program('uniform sampler2D T;uniform vec2 A,B,F,S;uniform float R;void main(){vec2 q=v*S-A,w=B-A;'
      + 'vec2 d=q-w*clamp(dot(q,w)/max(dot(w,w),.0001),0.,1.);vec4 c=texture2D(T,v);c.xy+=F*exp(-dot(d,d)/(R*R));gl_FragColor=c;}'),
    curl: program(NEAR + 'uniform sampler2D T;void main(){gl_FragColor=vec4(.5*(r(T).y-l(T).y-u(T).x+b(T).x),0.,0.,1.);}'),
    swirl: program(NEAR + 'uniform sampler2D V,C;uniform float K,D;void main(){'
      + 'vec2 f=.5*vec2(abs(u(C).x)-abs(b(C).x),abs(r(C).x)-abs(l(C).x));f/=length(f)+.0001;'
      + 'f*=K*texture2D(C,v).x;f.y=-f.y;gl_FragColor=vec4(texture2D(V,v).xy+f*D,0.,1.);}'),
    div: program(NEAR + 'uniform sampler2D T;void main(){gl_FragColor=vec4(.5*(r(T).x-l(T).x+u(T).y-b(T).y),0.,0.,1.);}'),
    press: program(NEAR + 'uniform sampler2D T,D;void main(){gl_FragColor=vec4((l(T).x+r(T).x+b(T).x+u(T).x-texture2D(D,v).x)*.25,0.,0.,1.);}'),
    grad: program(NEAR + 'uniform sampler2D T,V;void main(){gl_FragColor=vec4(texture2D(V,v).xy-.5*vec2(r(T).x-l(T).x,u(T).x-b(T).x),0.,1.);}'),
    flow: program('uniform sampler2D T;uniform vec2 E;uniform float D,K,M;void main(){'
      + 'vec2 w=texture2D(T,v-D*texture2D(T,v).xy*E).xy*K;float s=length(w);if(s>M)w*=M/s;gl_FragColor=vec4(w,0.,1.);}'),
    carry: program('uniform sampler2D T,V;uniform vec2 E;uniform float D,K,M,W;void main(){'
      + 'vec2 s=texture2D(V,v).xy*E*D;vec2 d=(texture2D(T,v-s).xy-s)*K;float n=length(d*vec2(W,1.));'
      + 'if(n>M)d*=M/n;gl_FragColor=vec4(d,0.,1.);}'),
    show: program(NEAR + 'uniform sampler2D I,T;uniform vec2 O,Z,C,D;uniform float G,Y,S,W;'
      + 'float H(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}'
      + 'float N(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(H(i),H(i+vec2(1.,0.)),f.x),mix(H(i+vec2(0.,1.)),H(i+vec2(1.,1.)),f.x),f.y);}'
      + 'float F(vec2 p){return .5*N(p)+.3*N(p*2.1+3.1)+.2*N(p*4.3+7.7);}'
      + 'vec3 pic(vec2 q){q=clamp(q,0.,1.);return texture2D(I,vec2(O.x+q.x*Z.x,O.y+(1.-q.y)*Z.y)).rgb;}'
      + 'void main(){vec2 d=texture2D(T,v).xy;float m=1.;'
      + 'if(G>0.){vec2 p=v*vec2(W,1.),o=p-C*vec2(W,1.);'
      + 'float e=clamp((F(p*2.4+S)-.22)/.56,0.,1.),z=length(o)/(.75*W+.4),f=e;'
      + 'vec2 w=(vec2(F(p*1.7+S+9.),F(p*1.7+S+21.))-.47)*.42*G;'
      + 'if(Y>.5&&Y<1.5)f=z+(e-.5)*.34;'
      + 'else if(Y>1.5&&Y<2.5)f=dot(v-.5,D)*.72+.5+(e-.5)*.34;'
      + 'else if(Y>2.5){float t=G*G*2.6*exp(-dot(o,o)*1.5),c1=cos(t),s1=sin(t);'
      + 'w+=(vec2(c1*o.x-s1*o.y,s1*o.x+c1*o.y)-o)/vec2(W,1.);f=1.-z+(e-.5)*.3;}'
      + 'f=clamp(f,0.,1.);float g=mix(-.13,1.13,G);m=smoothstep(g-.13,g+.13,f);'
      + 'float k=m*(1.-m)*4.;d+=w+(vec2(F(p*5.+S),F(p*5.+S+5.))-.47)*.05*k;}'
      + 'vec2 a=d*.03;vec3 c=vec3(pic(v+d+a).r,pic(v+d).g,pic(v+d-a).b);'
      + 'float s=clamp((r(T).x-l(T).x+u(T).y-b(T).y)*11.,-.6,.6);'
      + 'c+=max(s,0.)*vec3(.34,.27,.22);c*=1.+min(s,0.)*.5;gl_FragColor=vec4(c*m,m);}'),
  };
  if (failed) return false;

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.BLEND);

  const newTex = (fill) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    fill();
    return t;
  };
  const photo = newTex(() => gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img));

  const target = (w, h) => {
    const tex = newTex(() => gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null));
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fb, w, h, ok: gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE };
  };
  const pair = (w, h) => {
    const d = { a: target(w, h), b: target(w, h), swap() { const t = d.a; d.a = d.b; d.b = t; } };
    return d;
  };
  const drop = (d) => [d.a, d.b].forEach((t) => { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); });

  const run = (prog, to, values) => {
    gl.useProgram(prog.p);
    let unit = 0;
    Object.keys(values).forEach((k) => {
      if (!(k in prog.at)) prog.at[k] = gl.getUniformLocation(prog.p, k);
      const val = values[k];
      if (typeof val === 'number') gl.uniform1f(prog.at[k], val);
      else if (val.length === 2) gl.uniform2f(prog.at[k], val[0], val[1]);
      else {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, val.tex || val);
        gl.uniform1i(prog.at[k], unit++);
      }
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, to ? to.fb : null);
    gl.viewport(0, 0, to ? to.w : canvas.width, to ? to.h : canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const wipe = (d) => [d.a, d.b].forEach((t) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  });

  const STIR = 0.7;        // how hard the cursor pushes the liquid
  const SWIRL = 9;        // how curly it gets
  const FLOW_KEEP = 0.986; // how long the liquid keeps moving (per 60fps frame)
  const SHAPE_KEEP = 0.968; // how quickly the photo settles back
  const REST_MS = 5000;

  const j = { img, canvas, awake: false, w: 0, h: 0, fluid: true };
  let vel; let shape; let press; let curl; let div; let simH = 0; let simW = 0; let last = 0; let touched = 0; let queue = [];
  let ox = 0; let oy = 0; let sx = 1; let sy = 1;
  let gone = 0; let mode = -1; let seed = 0; let focus = [0.5, 0.5]; let dir = [0, 1]; let dirty = false;

  const show = () => run(P.show, null, {
    I: photo, T: shape.a, E: [1 / shape.a.w, 1 / shape.a.h], O: [ox, oy], Z: [sx, sy],
    G: gone, Y: mode, S: seed, C: focus, D: dir, W: canvas.width / canvas.height,
  });

  const build = () => {
    const box = canvas.getBoundingClientRect();
    if (box.width < 2) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(box.width * dpr);
    canvas.height = Math.round(box.height * dpr);
    j.w = box.width;
    j.h = box.height;
    const ratio = box.width / box.height;
    simH = Math.round(clamp(box.height / 5, 96, 170));
    simW = Math.round(simH * ratio);
    const shapeH = Math.round(clamp(box.height / 2, 260, 480));
    if (vel) [vel, shape, press].forEach(drop);
    if (curl) { gl.deleteTexture(curl.tex); gl.deleteFramebuffer(curl.fb); gl.deleteTexture(div.tex); gl.deleteFramebuffer(div.fb); }
    vel = pair(simW, simH);
    press = pair(simW, simH);
    shape = pair(Math.round(shapeH * ratio), shapeH);
    curl = target(simW, simH);
    div = target(simW, simH);
    [vel, press, shape].forEach(wipe);
    const ta = img.naturalWidth / img.naturalHeight;
    sx = ratio > ta ? 1 : ratio / ta;
    sy = ratio > ta ? ta / ratio : 1;
    ox = focalX * (1 - sx);
    oy = 0.5 * (1 - sy);
    show();
  };

  j.step = () => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 1 / 30) || 1 / 60;
    last = now;
    if (gone >= 1 && !dirty) return 0;
    dirty = true;
    if (gone >= 1 || now - touched > REST_MS) {
      dirty = false;
      [vel, press, shape].forEach(wipe);
      queue = [];
      show();
      return 0;
    }
    const E = [1 / simW, 1 / simH];
    const R = simH * 0.085;
    queue.forEach((s) => {
      run(P.splat, vel.b, {
        T: vel.a, A: [s.ax, s.ay], B: [s.bx, s.by], F: [s.fx * 60 * STIR, s.fy * 60 * STIR], S: [simW, simH], R,
      });
      vel.swap();
    });
    queue = [];
    run(P.curl, curl, { T: vel.a, E });
    run(P.swirl, vel.b, { V: vel.a, C: curl, E, K: SWIRL, D: dt });
    vel.swap();
    run(P.div, div, { T: vel.a, E });
    for (let i = 0; i < 18; i++) {
      run(P.press, press.b, { T: press.a, D: div, E });
      press.swap();
    }
    run(P.grad, vel.b, { T: press.a, V: vel.a, E });
    vel.swap();
    run(P.flow, vel.b, { T: vel.a, E, D: dt, K: FLOW_KEEP ** (dt * 60), M: simH * 5 });
    vel.swap();
    run(P.carry, shape.b, {
      T: shape.a, V: vel.a, E, D: dt, K: SHAPE_KEEP ** (dt * 60), M: 0.075, W: simW / simH,
    });
    shape.swap();
    show();
    return 1;
  };

  j.push = (px, py, mx, my, power) => {
    if (!j.w) return;
    const sc = simH / j.h;
    const g = power / 0.2;
    const s = {
      ax: (px - mx) * sc, ay: (j.h - py + my) * sc, bx: px * sc, by: (j.h - py) * sc, fx: mx * sc * g, fy: -my * sc * g,
    };
    const end = queue[queue.length - 1];
    if (queue.length >= 4) {
      end.bx = s.bx; end.by = s.by; end.fx += s.fx; end.fy += s.fy;
    } else queue.push(s);
    touched = performance.now();
  };

  // the way the photo melts is chosen fresh each time you come back to the top
  j.pickMelt = (force) => {
    let next = force;
    if (next === undefined) {
      do { next = Math.floor(Math.random() * 4); } while (next === mode);
    }
    mode = next;
    seed = Math.random() * 40;
    focus = [0.3 + Math.random() * 0.5, 0.3 + Math.random() * 0.4];
    const turn = Math.random() * Math.PI * 2;
    dir = [Math.cos(turn), Math.sin(turn)];
    j.mode = mode;
  };
  j.pickMelt();

  const setMelt = (g, dy) => {
    if (g <= 0 && gone > 0) j.pickMelt();
    if (g === gone && !dy) return;
    gone = g;
    if (dy && g < 1 && j.w) {
      const push = clamp(dy, -60, 60);
      j.push(Math.random() * j.w, Math.random() * j.h, (Math.random() - 0.5) * push * 0.5, -push * 0.6, 0.2);
    }
    touched = performance.now();
    j.awake = true;
    wakeJellies();
  };

  canvas.addEventListener('webglcontextlost', () => {
    canvas.style.display = 'none';
    j.w = 0;
    j.awake = false;
    melt = null;
    document.documentElement.classList.remove('melt');
  });
  img.after(canvas);
  build();
  if (!vel || !vel.a.ok || !shape.a.ok) { canvas.remove(); return false; }
  new ResizeObserver(build).observe(canvas);
  canvas.classList.add('is-on');
  jellies.push(j);
  melt = setMelt;
  document.documentElement.classList.add('melt');
  return true;
}

// ---- every page melts into the next --------------------------------------
// Each page holds still while the next one slides over it. Between them sits a
// sheet of liquid ink, the same black as the page, that dissolves the old page
// as the new one arrives. Each crossing picks its own shape, it follows the
// scroll exactly, and nothing runs while you are not scrolling.
function makeInk() {
  const canvas = document.createElement('canvas');
  canvas.className = 'ink';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, 'precision highp float;varying vec2 v;uniform float G,Y,S,W,A,B;uniform vec2 C,D;'
    + 'float H(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}'
    + 'float N(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(H(i),H(i+vec2(1.,0.)),f.x),mix(H(i+vec2(0.,1.)),H(i+vec2(1.,1.)),f.x),f.y);}'
    + 'float F(vec2 p){return .5*N(p)+.3*N(p*2.1+3.1)+.2*N(p*4.3+7.7);}'
    + 'void main(){vec2 q=vec2(v.x*W,A-v.y);float e=clamp((F(q*2.4+S)-.22)/.56,0.,1.),f=e;'
    + 'if(Y>.5&&Y<1.5)f=length((v-C)*vec2(W,1.))/(.75*W+.4)+(e-.5)*.34;'
    + 'else if(Y>1.5&&Y<2.5)f=dot(v-.5,D)*.72+.5+(e-.5)*.34;'
    + 'else if(Y>2.5)f=abs(v.y-B)*1.5+(e-.5)*.4;'
    + 'float g=mix(-.13,1.13,G),a=1.-smoothstep(g-.13,g+.13,clamp(f,0.,1.));'
    + 'gl_FragColor=vec4(0.,0.,0.,a);}'));
  gl.bindAttribLocation(prog, 0, 'p');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const at = {};
  ['G', 'Y', 'S', 'W', 'A', 'B', 'C', 'D'].forEach((n) => { at[n] = gl.getUniformLocation(prog, n); });

  const pages = [...document.querySelectorAll('#work, #about, #tools, .process, #contact')];
  const sheet = document.querySelector('.sheet');
  const away = pages.map(() => false);
  const pin = () => {
    pages.forEach((el) => { el.style.top = `${Math.min(0, innerHeight - el.offsetHeight)}px`; });
    queueScroll();
  };
  pages.forEach((el, i) => { el.style.zIndex = i * 2 + 1; });
  document.documentElement.classList.add('stack');
  const watch = new ResizeObserver(pin);
  pages.forEach((el) => watch.observe(el));
  pageTop = (el) => {
    const i = pages.indexOf(el);
    if (i < 0) return el.getBoundingClientRect().top + scrollY;
    let y = sheet.getBoundingClientRect().top + scrollY + parseFloat(getComputedStyle(sheet).paddingTop);
    for (let n = 0; n < i; n++) y += pages[n].offsetHeight;
    return y;
  };
  let active = -1;
  let mode = -1;
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const roll = (force) => {
    let next = force;
    if (next === undefined) {
      do { next = Math.floor(Math.random() * 4); } while (next === mode);
    }
    mode = next;
    gl.uniform1f(at.Y, mode);
    gl.uniform1f(at.S, Math.random() * 40);
    gl.uniform2f(at.C, 0.25 + Math.random() * 0.5, 0.25 + Math.random() * 0.5);
    const turn = Math.random() * Math.PI * 2;
    gl.uniform2f(at.D, Math.cos(turn), Math.sin(turn));
  };
  const size = () => {
    canvas.width = Math.round(innerWidth * 0.6);
    canvas.height = Math.round(innerHeight * 0.6);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(at.W, innerWidth / innerHeight);
    queueScroll();
  };
  addEventListener('resize', size);
  sheet.appendChild(canvas);
  size();
  roll();
  pin();
  let shown = false;
  const update = () => {
    const vh = innerHeight;
    const tops = pages.map((el) => el.getBoundingClientRect().top);
    let near = -1;
    let t = 0;
    for (let i = 1; i < pages.length; i++) {
      const q = 1 - tops[i] / vh;
      if (q > 0 && q < 1) { near = i; t = q; }
    }
    pages.forEach((el, i) => {
      // the ink is fully solid by now, so the page under it can go
      const gone = i < pages.length - 1 && tops[i + 1] <= Math.max(vh * 0.12, 72);
      if (gone === away[i]) return;
      away[i] = gone;
      el.style.visibility = gone ? 'hidden' : '';
      if (el.id === 'work') { carAway = gone; carState(); }
    });
    if (near !== active) {
      active = near;
      if (near > 0) {
        roll();
        canvas.style.zIndex = near * 2;
      }
    }
    const g = near > 0 ? smooth(0.14, 0.88, t) : 0;
    if (g < 0.002) {
      if (shown) { canvas.style.visibility = 'hidden'; shown = false; }
      return;
    }
    if (!shown) { canvas.style.visibility = 'visible'; shown = true; }
    gl.uniform1f(at.G, g);
    gl.uniform1f(at.A, scrollY / vh);
    gl.uniform1f(at.B, t);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  window.__ink = { roll: (m) => roll(m), mode: () => mode };   // read by tests
  return update;
}

function wakeJellies() {
  if (wakeJellies.on) return;
  wakeJellies.on = true;
  const frame = () => {
    let any = false;
    jellies.forEach((j) => {
      if (!j.awake) return;
      if (j.step() < 0.02) j.awake = false;
      else any = true;
    });
    if (any) requestAnimationFrame(frame);
    else wakeJellies.on = false;
  };
  requestAnimationFrame(frame);
}

if (!reduced) {
  const wrapIfNeeded = (img) => {
    const box = document.createElement('span');
    box.className = 'jelly-box';
    img.before(box);
    box.appendChild(img);
  };
  const setup = (img, focal, liquid) => {
    const go2 = () => (liquid && makeFluid(img, focal)) || makeJelly(img, focal);
    if (img.complete && img.naturalWidth) go2();
    else img.addEventListener('load', go2, { once: true });
  };
  setup(document.querySelector('.hero__bg'), 0.79, true);
  if (fine) {
    const others = [document.querySelector('.about__photo img')];
    others.forEach((img) => { wrapIfNeeded(img); img.loading = 'eager'; setup(img, 0.5); });
  }

  ink = makeInk();
  queueScroll();

  let lastX = null;
  let lastY = null;
  let pressed = false;
  addEventListener('pointerdown', () => { pressed = true; }, { passive: true });
  addEventListener('pointerup', () => { pressed = false; }, { passive: true });
  addEventListener('pointercancel', () => { pressed = false; }, { passive: true });
  addEventListener('pointermove', (e) => {
    const mx = lastX === null ? 0 : e.clientX - lastX;
    const my = lastY === null ? 0 : e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    if (!mx && !my) return;
    let woke = false;
    jellies.forEach((j) => {
      const b = j.canvas.getBoundingClientRect();
      if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) return;
      j.push(e.clientX - b.left, e.clientY - b.top, mx, my, pressed ? 0.42 : 0.2);
      j.awake = true;
      woke = true;
    });
    if (woke) wakeJellies();
  }, { passive: true });
}

let syncGlide = () => {};

// ---- soft scrolling (mouse and trackpad only) ------------------------------
if (fine && !reduced) {
  document.documentElement.style.scrollBehavior = 'auto';
  let want = scrollY;
  let gliding = false;
  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
  syncGlide = () => { gliding = false; want = scrollY; };
  const glide = () => {
    if (!gliding) return;
    const d = want - scrollY;
    if (Math.abs(d) < 0.6) { scrollTo(0, want); gliding = false; return; }
    scrollTo(0, scrollY + d * 0.06);
    requestAnimationFrame(glide);
  };
  const glideTo = (y) => {
    want = clamp(y, 0, maxScroll());
    if (!gliding) { gliding = true; requestAnimationFrame(glide); }
  };
  addEventListener('wheel', (e) => {
    if (e.ctrlKey || document.getElementById('player').open) return;
    e.preventDefault();
    if (inTransition) return;
    const unit = e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? innerHeight : 1;
    glideTo((gliding ? want : scrollY) + e.deltaY * unit);
  }, { passive: false });
  addEventListener('scroll', () => { if (!gliding) want = scrollY; }, { passive: true });
}

// ---- section transitions -------------------------------------------------
// Each menu click covers the screen with a randomly chosen effect, jumps while
// covered, then uncovers. Never the same effect twice in a row.
const NAMES = { '#top': 'Home', '#work': 'Work', '#about': 'About', '#tools': 'Tools', '#contact': 'Contact' };
const PALETTES = [
  { a: '#ff4a12', t: '#140403' },
  { a: '#f6e9dd', t: '#140403' },
  { a: '#8f1a08', t: '#f6e9dd' },
  { a: '#c8240c', t: '#f6e9dd' },
];
const EASE = 'cubic-bezier(.76, 0, .24, 1)';
const between = (a, b) => a + Math.random() * (b - a);
const shuffled = (n) => {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
function tiles(layer, cols, rows, color) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const el = document.createElement('i');
      el.style.cssText = `left:${(c / cols) * 100}%;top:${(r / rows) * 100}%;width:calc(${100 / cols}% + 2px);height:calc(${100 / rows}% + 2px);background:${color}`;
      layer.appendChild(el);
      out.push(el);
    }
  }
  return out;
}
const play = (items) => Promise.all(items.map(([el, frames, delay, dur]) => el.animate(frames, {
  duration: dur || 460, delay: delay || 0, easing: EASE, fill: 'both',
}).finished));

// every effect returns cover() and reveal()
const EFFECTS = {
  shutters(layer, color) {
    const n = Math.round(between(6, 12));
    const bars = tiles(layer, n, 1, color);
    const order = Math.random() < 0.5 ? shuffled(n) : [...Array(n).keys()];
    const from = Math.random() < 0.5 ? 'top' : 'bottom';
    const to = from === 'top' ? 'bottom' : 'top';
    bars.forEach((b) => { b.style.transformOrigin = from; });
    return {
      cover: () => play(bars.map((b, i) => [b, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], order[i] * 34])),
      reveal: () => {
        bars.forEach((b) => { b.style.transformOrigin = to; });
        return play(bars.map((b, i) => [b, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], order[i] * 34]));
      },
    };
  },
  blinds(layer, color) {
    const n = Math.round(between(5, 9));
    const bars = tiles(layer, 1, n, color);
    const origin = (i, flip) => ((i % 2 === 0) !== flip ? 'left' : 'right');
    bars.forEach((b, i) => { b.style.transformOrigin = origin(i, false); });
    return {
      cover: () => play(bars.map((b, i) => [b, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], i * 40])),
      reveal: () => {
        bars.forEach((b, i) => { b.style.transformOrigin = origin(i, true); });
        return play(bars.map((b, i) => [b, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], (n - i) * 40]));
      },
    };
  },
  tiles(layer, color) {
    const cols = innerWidth < 560 ? 5 : 11;
    const rows = innerWidth < 560 ? 9 : 6;
    const ts = tiles(layer, cols, rows, color);
    const a = shuffled(ts.length);
    const step = 300 / ts.length;
    return {
      cover: () => play(ts.map((t, i) => [t, [{ transform: 'scale(0) rotate(40deg)' }, { transform: 'scale(1.02) rotate(0deg)' }], a[i] * step, 340])),
      reveal: () => {
        const b = shuffled(ts.length);
        return play(ts.map((t, i) => [t, [{ transform: 'scale(1.02) rotate(0deg)' }, { transform: 'scale(0) rotate(-40deg)' }], b[i] * step, 340]));
      },
    };
  },
  iris(layer, color, point) {
    const [el] = tiles(layer, 1, 1, color);
    const hole = `${between(15, 85).toFixed(0)}% ${between(15, 85).toFixed(0)}%`;
    return {
      cover: () => play([[el, [
        { clipPath: `circle(0% at ${point.x}px ${point.y}px)` },
        { clipPath: `circle(150% at ${point.x}px ${point.y}px)` }], 0, 620]]),
      reveal: () => play([[el, [
        { clipPath: `circle(150% at ${hole})` },
        { clipPath: `circle(0% at ${hole})` }], 0, 620]]),
    };
  },
  slash(layer, color) {
    const [el] = tiles(layer, 1, 1, color);
    const angle = between(-16, 16).toFixed(1);
    const sign = Math.random() < 0.5 ? 1 : -1;
    el.style.left = '-30%';
    el.style.width = '160%';
    const at = (x) => ({ transform: `translateX(${x}%) skewX(${angle}deg)` });
    return {
      cover: () => play([[el, [at(sign * -105), at(0)], 0, 560]]),
      reveal: () => play([[el, [at(0), at(sign * 105)], 0, 560]]),
    };
  },
  split(layer, color) {
    const [a, b] = tiles(layer, 1, 2, color);
    return {
      cover: () => play([
        [a, [{ transform: 'translateY(-101%)' }, { transform: 'translateY(0)' }]],
        [b, [{ transform: 'translateY(101%)' }, { transform: 'translateY(0)' }]],
      ]),
      reveal: () => play([
        [a, [{ transform: 'translateX(0)' }, { transform: 'translateX(-101%)' }]],
        [b, [{ transform: 'translateX(0)' }, { transform: 'translateX(101%)' }]],
      ]),
    };
  },
};

let lastEffect = '';
let inTransition = false;
window.__tx = { log: [] };   // read by tests

async function transitionTo(hash, point) {
  const target = hash === '#top' ? null : document.querySelector(hash);
  const jump = () => {
    document.documentElement.style.scrollBehavior = 'auto';
    const y = target ? pageTop(target) - 70 : 0;
    scrollTo(0, y);
    syncGlide();
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    history.pushState(null, '', hash === '#top' ? location.pathname + location.search : hash);
  };
  if (reduced) { jump(); return; }
  if (inTransition) return;
  inTransition = true;
  const name = pick(Object.keys(EFFECTS).filter((n) => n !== lastEffect));
  lastEffect = name;
  window.__tx.log.push(name);
  const palette = pick(PALETTES);
  const layer = document.createElement('div');
  layer.className = 'tx';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  const fx = EFFECTS[name](layer, palette.a, point);
  const label = document.createElement('span');
  label.className = 'tx__label';
  label.textContent = NAMES[hash] || '';
  label.style.color = palette.t;
  layer.appendChild(label);
  const labelIn = label.animate(
    [{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'scale(1)' }],
    { duration: 260, delay: 300, easing: 'ease-out', fill: 'both' },
  );
  try {
    await fx.cover();
    await labelIn.finished;
    jump();
    await new Promise((r) => setTimeout(r, 180));
    label.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'both' });
    await fx.reveal();
  } finally {
    layer.remove();
    inTransition = false;
  }
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const hash = a.getAttribute('href');
  if (hash !== '#top' && !document.querySelector(hash)) return;
  e.preventDefault();
  transitionTo(hash, { x: e.clientX || innerWidth / 2, y: e.clientY || innerHeight / 2 });
});

// ---- start ---------------------------------------------------------------
const layout = () => { measure(); paint(); };
addEventListener('resize', layout);
layout();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
