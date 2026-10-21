import { reduceMotion } from './utils.js';

const IDLE_MS = 2500;

export const pointer = {
  x: 0,
  y: 0,
  tx: 0,
  ty: 0,
  px: 0,
  py: 0,
  lastMove: -Infinity,
};

export function trackPointer() {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.lastMove = performance.now();
    },
    { passive: true }
  );
}

/**
 * Eases the shared parallax position toward the pointer. When the pointer has
 * been idle (or on touch screens) it drifts on its own. Returns true when idle.
 */
export function stepPointer(now) {
  const idle = now - pointer.lastMove > IDLE_MS;
  let tx = pointer.tx;
  let ty = pointer.ty;

  if (reduceMotion.matches) {
    tx = 0;
    ty = 0;
  } else if (idle) {
    const t = now / 1000;
    tx = Math.sin(t * 0.45) * 0.65;
    ty = Math.cos(t * 0.33) * 0.45;
  }

  pointer.px += (tx - pointer.px) * 0.07;
  pointer.py += (ty - pointer.py) * 0.07;
  return idle;
}
