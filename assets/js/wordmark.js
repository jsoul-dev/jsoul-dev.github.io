import { clamp } from './utils.js';

export const ANGLE = 10;

const WORD = 'Jsoul';
const WORD_FONT = '"Archivo Black", "Arial Black", Impact, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace';

// Characters grouped by visual weight, lightest first.
const LEVELS = [
  [' '],
  ['.', '`', "'"],
  [':', ',', ';', '"'],
  ['-', '~', '=', '+', 'i'],
  ['[', ']', '{', '}', '|', '/', '1', 'l'],
  ['x', 'n', 'u', 'o', '*', 'c', 'z'],
  ['%', '&', '8', 'B', 'W'],
  ['@', '#', '$', 'M', '%'],
];
const LEVEL_ALPHA = [0, 0.18, 0.3, 0.42, 0.56, 0.7, 0.82, 0.94];
const MIN_LEVEL = 3;

// Parallax depth and entrance delay per letter.
const DEPTH = [0.9, 0.6, 1.2, 0.8, 1.0];
const DELAY = [0.0, 0.14, 0.28, 0.42, 0.56];

function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const size = r * 2 + 1;
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += src[y * w + clamp(x, 0, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = sum / size;
      sum += src[y * w + clamp(x + r + 1, 0, w - 1)] - src[y * w + clamp(x - r, 0, w - 1)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[clamp(y, 0, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / size;
      sum += tmp[clamp(y + r + 1, 0, h - 1) * w + x] - tmp[clamp(y - r, 0, h - 1) * w + x];
    }
  }
  return out;
}

function hash(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Renders each letter of the wordmark to its own ASCII canvas so the layers
 * can move independently. Narrow screens stack the word on two lines.
 */
export function buildWordmark() {
  const vw = window.innerWidth;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const stacked = vw < 560;
  const lines = stacked ? [[0, 2], [2, WORD.length]] : [[0, WORD.length]];
  const W = Math.min(vw * (stacked ? 0.9 : 0.86), 1180);
  const cols = stacked ? 64 : vw < 1000 ? 140 : 190;
  const cw = W / cols;
  const fs = cw / 0.6;
  const ch = fs * 1.12;
  const ys = cw / ch;
  const skew = Math.tan((ANGLE * Math.PI) / 180);
  const capH = 0.72;

  const probe = document.createElement('canvas').getContext('2d');
  probe.font = `100px ${WORD_FONT}`;
  const lineUnits = lines.map(([a, b]) => probe.measureText(WORD.slice(a, b)).width / 100);
  const F = (cols - 6) / (Math.max(...lineUnits) + skew * capH);
  probe.font = `${F}px ${WORD_FONT}`;

  const lineStep = capH * F + F * 0.12;
  const baseline = capH * F + 1.5 / ys;
  const rows = Math.ceil((baseline + lineStep * (lines.length - 1) + F * 0.05 + 1.5 / ys) * ys);

  const layers = [];
  for (let i = 0; i < WORD.length; i++) {
    const li = lines.findIndex(([a, b]) => i >= a && i < b);
    const [lineStart] = lines[li];
    const x0 = (cols - (lineUnits[li] * F + skew * capH * F)) / 2;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = cols;
    maskCanvas.height = rows;
    const mc = maskCanvas.getContext('2d', { willReadFrequently: true });
    mc.setTransform(1, 0, 0, ys, 0, 0);
    mc.font = `${F}px ${WORD_FONT}`;
    mc.fillStyle = '#fff';
    mc.translate(x0 + probe.measureText(WORD.slice(lineStart, i)).width, baseline + lineStep * li);
    mc.transform(1, 0, -skew, 1, 0, 0);
    mc.fillText(WORD[i], 0, 0);

    const alpha = mc.getImageData(0, 0, cols, rows).data;
    const mask = new Float32Array(cols * rows);
    for (let k = 0; k < mask.length; k++) mask[k] = alpha[k * 4 + 3] / 255;
    const soft = boxBlur(boxBlur(mask, cols, rows, 2), cols, rows, 2);
    const at = (x, y) => soft[clamp(y, 0, rows - 1) * cols + clamp(x, 0, cols - 1)];

    const cx = [];
    const cy = [];
    const cl = [];
    const index = new Int32Array(cols * rows).fill(-1);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (mask[y * cols + x] < 0.4) continue;
        // Light from the top left: edges facing it brighten, the far edges dim a little.
        const lit = at(x + 2, y + 1) - at(x - 2, y - 1);
        const light = 0.74 + lit * 0.9;
        const noise = (hash(x, y, i) - 0.5) * 0.08;
        const L = clamp(light * 0.85 + soft[y * cols + x] * 0.2 + noise, 0, 0.999);
        index[y * cols + x] = cx.length;
        cx.push(x);
        cy.push(y);
        cl.push(Math.max(MIN_LEVEL, Math.floor(L * 8)));
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(cols * cw * dpr);
    canvas.height = Math.ceil(rows * ch * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.font = `${fs}px ${MONO}`;
    ctx.textBaseline = 'top';
    for (let level = 1; level < LEVELS.length; level++) {
      ctx.fillStyle = `rgba(236, 229, 214, ${LEVEL_ALPHA[level]})`;
      const set = LEVELS[level];
      for (let n = 0; n < cx.length; n++) {
        if (cl[n] !== level) continue;
        ctx.fillText(set[(Math.random() * set.length) | 0], cx[n] * cw, cy[n] * ch + (ch - fs) / 2);
      }
    }

    layers.push({ canvas, ctx, cx, cy, cl, index, depth: DEPTH[i % DEPTH.length], delay: DELAY[i % DELAY.length] });
  }

  return { layers, cols, rows, cw, ch, fs, width: cols * cw, height: rows * ch };
}

export function redrawCell(wordmark, layer, n) {
  const { ctx } = layer;
  const x = layer.cx[n] * wordmark.cw;
  const y = layer.cy[n] * wordmark.ch;
  const level = layer.cl[n];
  const set = LEVELS[level];
  ctx.clearRect(x - 0.5, y - 0.5, wordmark.cw + 1, wordmark.ch + 1);
  ctx.fillStyle = `rgba(236, 229, 214, ${LEVEL_ALPHA[level]})`;
  ctx.fillText(set[(Math.random() * set.length) | 0], x, y + (wordmark.ch - wordmark.fs) / 2);
}

export const WORDMARK_FONT_LOAD = '100px "Archivo Black"';
