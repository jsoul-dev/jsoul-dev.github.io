import { $, reduceMotion } from './utils.js';
import { pointer, stepPointer } from './pointer.js';

/** Moves the backdrop, portrait and name at different depths with the pointer. */
export function startProfileParallax() {
  if (reduceMotion.matches) return;
  const backdrop = $('#backdrop');
  const portrait = $('#plx-portrait');
  const name = $('#plx-name');

  function frame(now) {
    stepPointer(now);
    const { px, py } = pointer;
    backdrop.style.transform = `translate3d(${(-px * 22).toFixed(2)}px, ${(-py * 14).toFixed(2)}px, 0)`;
    portrait.style.transform = `translate3d(${(px * 12).toFixed(2)}px, ${(py * 8).toFixed(2)}px, 0)`;
    name.style.transform = `translate3d(${(px * -7).toFixed(2)}px, ${(py * -4).toFixed(2)}px, 0)`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
