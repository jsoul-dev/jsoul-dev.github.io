import { $, reduceMotion } from './utils.js';

export function startRain() {
  const canvas = $('#rain');
  const ctx = canvas.getContext('2d');
  let w = 0;
  let h = 0;
  let drops = [];

  function init() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const far = Math.floor(w / 9);
    const near = Math.floor(w / 22);
    drops = [];
    for (let i = 0; i < far + near; i++) {
      const isNear = i >= far;
      drops.push({
        x: Math.random() * w,
        y: Math.random() * h,
        len: isNear ? 18 + Math.random() * 16 : 8 + Math.random() * 10,
        speed: isNear ? 16 + Math.random() * 8 : 7 + Math.random() * 5,
        alpha: isNear ? 0.28 + Math.random() * 0.22 : 0.1 + Math.random() * 0.12,
        width: isNear ? 1.5 : 1,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    for (const d of drops) {
      ctx.lineWidth = d.width;
      ctx.strokeStyle = `rgba(224, 21, 27, ${d.alpha})`;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.len * 0.18, d.y + d.len);
      ctx.stroke();
      d.y += d.speed;
      d.x += d.speed * 0.18;
      if (d.y > h) {
        d.y = -d.len;
        d.x = Math.random() * w - 40;
      }
    }
    requestAnimationFrame(draw);
  }

  init();
  window.addEventListener('resize', init);
  if (!reduceMotion.matches) requestAnimationFrame(draw);
}
