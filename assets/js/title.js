import { reduceMotion } from './utils.js';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Scrambles the tab title once, then settles on the final text. */
export function decodeTitle(final = 'Jsoul') {
  if (reduceMotion.matches) {
    document.title = final;
    return;
  }
  let step = 0;
  const id = setInterval(() => {
    step += 1 / 3;
    if (step >= final.length) {
      clearInterval(id);
      document.title = final;
      return;
    }
    document.title = [...final]
      .map((char, n) => (n < Math.floor(step) ? char : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
      .join('');
  }, 60);
}
