import { $, clamp } from './utils.js';

const VOLUME_STEP = 0.02;
const WHEEL_NOTCH = 100;
const FADE_IN_MS = 2000;

export function setupPlayer() {
  const audio = $('#bg-audio');
  const dock = $('#dock');
  const button = $('#play');
  const slider = $('#volume');
  const output = $('#volume-out');
  const status = $('#dock-status');
  let fadeId = 0;
  let wheelEnabled = false;
  let wheelAcc = 0;

  const volume = () => parseFloat(slider.value);

  function showVolume(v) {
    const percent = Math.round(v * 100);
    output.textContent = `${percent}%`;
    slider.setAttribute('aria-valuetext', `${percent} percent`);
  }

  function setVolume(v) {
    cancelAnimationFrame(fadeId);
    const next = clamp(Math.round(v / VOLUME_STEP) * VOLUME_STEP, 0, 1);
    slider.value = String(next);
    audio.volume = next;
    showVolume(next);
  }

  function fadeTo(target, ms) {
    cancelAnimationFrame(fadeId);
    const from = audio.volume;
    const start = performance.now();
    const step = (now) => {
      const k = clamp((now - start) / ms, 0, 1);
      audio.volume = clamp(from + (target - from) * k, 0, 1);
      if (k < 1) fadeId = requestAnimationFrame(step);
    };
    fadeId = requestAnimationFrame(step);
  }

  function render(playing) {
    button.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
    button.dataset.playing = String(playing);
  }

  function play() {
    if (volume() === 0) setVolume(0.2);
    audio.volume = 0;
    const attempt = audio.play();
    if (attempt && attempt.catch) {
      attempt.catch(() => {
        status.textContent = 'press play to start';
        render(false);
      });
    }
  }

  button.addEventListener('click', () => (audio.paused ? play() : audio.pause()));

  slider.addEventListener('input', () => setVolume(volume()));

  // Mouse wheel changes the volume 2% per notch. When the page itself can
  // scroll, the wheel scrolls it as usual except while over the player.
  window.addEventListener(
    'wheel',
    (e) => {
      if (!wheelEnabled || e.ctrlKey) return;
      const pageScrolls = document.documentElement.scrollHeight > window.innerHeight + 1;
      if (pageScrolls && !dock.contains(e.target)) return;
      e.preventDefault();

      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 33;
      if (e.deltaMode === 2) delta *= window.innerHeight;
      wheelAcc += delta;

      const notches = Math.trunc(Math.abs(wheelAcc) / WHEEL_NOTCH);
      if (notches === 0) return;
      const direction = wheelAcc < 0 ? 1 : -1;
      wheelAcc -= Math.sign(wheelAcc) * notches * WHEEL_NOTCH;
      setVolume(volume() + direction * notches * VOLUME_STEP);
    },
    { passive: false }
  );

  audio.addEventListener('playing', () => {
    render(true);
    status.textContent = 'on loop';
    fadeTo(volume(), FADE_IN_MS);
  });
  audio.addEventListener('pause', () => {
    cancelAnimationFrame(fadeId);
    render(false);
  });
  audio.addEventListener('waiting', () => {
    status.textContent = 'loading';
  });
  audio.addEventListener('error', () => {
    status.textContent = 'audio unavailable';
    button.disabled = true;
    render(false);
  });

  audio.volume = volume();
  showVolume(volume());
  render(false);

  return {
    play,
    enableWheel() {
      wheelEnabled = true;
    },
  };
}
