export const $ = (selector) => document.querySelector(selector);
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
