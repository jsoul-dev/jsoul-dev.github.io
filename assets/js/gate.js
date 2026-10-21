import { $, clamp, easeOut, reduceMotion } from './utils.js';
import { pointer, stepPointer } from './pointer.js';
import { buildWordmark, redrawCell, WORDMARK_FONT_LOAD } from './wordmark.js';

const PARALLAX_X = 22;
const PARALLAX_Y = 14;

export function startGate() {
  const gate = $('#gate');
  const canvas = $('#ascii');
  const ctx = canvas.getContext('2d');
  let wordmark = null;
  let dpr = 1;
  let vw = 0;
  let vh = 0;
  let running = true;
  let startTime = performance.now();
  let lensX = window.innerWidth / 2;
  let lensY = window.innerHeight / 2;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    wordmark = buildWordmark();
  }

  function frame(now) {
    if (!running) return;
    const idle = stepPointer(now);
    const t = (now - startTime) / 1000;
    const still = reduceMotion.matches;

    if (!still) {
      // Many characters flip at the start, then it settles into a quiet shimmer.
      const burst = Math.max(14, 320 * Math.pow(Math.max(0, 1 - t / 1.8), 2));
      for (let n = 0; n < burst; n++) {
        const layer = wordmark.layers[(Math.random() * wordmark.layers.length) | 0];
        redrawCell(wordmark, layer, (Math.random() * layer.cx.length) | 0);
      }
    }

    const ox = (vw - wordmark.width) / 2;
    const oy = (vh - wordmark.height) / 2 - 10;
    const lensR = clamp(Math.min(vw, vh) * 0.36, 120, 300);

    const targetX = idle ? vw / 2 + pointer.px * vw * 0.34 : pointer.x;
    const targetY = idle ? vh / 2 + pointer.py * vh * 0.3 : pointer.y;
    lensX += (targetX - lensX) * 0.14;
    lensY += (targetY - lensY) * 0.14;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);

    for (const layer of wordmark.layers) {
      const k = still ? 1 : clamp((t - layer.delay) / 0.9, 0, 1);
      if (k <= 0) continue;
      const e = easeOut(k);
      const dx = pointer.px * PARALLAX_X * layer.depth;
      const dy = pointer.py * PARALLAX_Y * layer.depth + (1 - e) * 44 * layer.depth;
      ctx.globalAlpha = e;
      ctx.drawImage(layer.canvas, ox + dx, oy + dy, wordmark.width, wordmark.height);

      if (!still) {
        // Characters under the lens flicker.
        for (let n = 0; n < 4; n++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.sqrt(Math.random()) * lensR;
          const cx = Math.floor((lensX + Math.cos(angle) * radius - (ox + dx)) / wordmark.cw);
          const cy = Math.floor((lensY + Math.sin(angle) * radius - (oy + dy)) / wordmark.ch);
          if (cx < 0 || cy < 0 || cx >= wordmark.cols || cy >= wordmark.rows) continue;
          const idx = layer.index[cy * wordmark.cols + cx];
          if (idx >= 0) redrawCell(wordmark, layer, idx);
        }
      }
    }
    ctx.globalAlpha = 1;

    // The lens tints only the characters, not the empty background.
    ctx.globalCompositeOperation = 'source-atop';
    const g = ctx.createRadialGradient(lensX, lensY, 0, lensX, lensY, lensR);
    g.addColorStop(0, 'rgba(224, 21, 27, 0.95)');
    g.addColorStop(0.55, 'rgba(224, 21, 27, 0.4)');
    g.addColorStop(1, 'rgba(224, 21, 27, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(lensX - lensR, lensY - lensR, lensR * 2, lensR * 2);
    ctx.globalCompositeOperation = 'source-over';

    requestAnimationFrame(frame);
  }

  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!running) return;
      resize();
      startTime = performance.now() - 5000;
    }, 150);
  }
  window.addEventListener('resize', onResize);

  const fontReady = Promise.race([
    document.fonts.load(WORDMARK_FONT_LOAD),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
  fontReady.then(() => {
    resize();
    startTime = performance.now();
    requestAnimationFrame(frame);
  });

  return {
    gate,
    canvas,
    stop() {
      running = false;
      window.removeEventListener('resize', onResize);
    },
  };
}

/** Splits a snapshot of the gate along a red slash and slides the halves apart. */
export function playCut(gateApi) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const wrap = document.createElement('div');
  wrap.className = 'cut';
  wrap.setAttribute('aria-hidden', 'true');

  const halves = ['a', 'b'].map((side) => {
    const half = document.createElement('div');
    half.className = `cut-half ${side}`;
    const inner = document.createElement('div');
    inner.className = 'cut-inner';
    const snapshot = document.createElement('canvas');
    snapshot.width = gateApi.canvas.width;
    snapshot.height = gateApi.canvas.height;
    snapshot.style.width = `${vw}px`;
    snapshot.style.height = `${vh}px`;
    snapshot.getContext('2d').drawImage(gateApi.canvas, 0, 0);
    inner.appendChild(snapshot);
    half.appendChild(inner);
    wrap.appendChild(half);
    return half;
  });

  const line = document.createElement('div');
  line.className = 'cut-line';
  wrap.appendChild(line);
  document.body.appendChild(wrap);
  gateApi.gate.classList.add('is-leaving');

  const rotate = 'rotate(-10deg)';
  const easing = 'cubic-bezier(0.7, 0, 0.2, 1)';
  const part = (half, distance) =>
    half.animate(
      [{ transform: `${rotate} translateY(0)` }, { transform: `${rotate} translateY(${distance}%)` }],
      { duration: 950, delay: 140, easing, fill: 'forwards' }
    );
  part(halves[0], -64);
  part(halves[1], 64);

  line
    .animate(
      [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
      { duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' }
    )
    .finished.then(() => {
      line.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: 'forwards' });
    });

  setTimeout(() => wrap.remove(), 1250);
}
