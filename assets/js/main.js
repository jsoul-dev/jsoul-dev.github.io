import { $, reduceMotion } from './utils.js';
import { trackPointer } from './pointer.js';
import { startGate, playCut } from './gate.js';
import { startRain } from './rain.js';
import { startProfileParallax } from './parallax.js';
import { setupPlayer } from './player.js';
import { decodeTitle } from './title.js';

const GATE_EXIT_MS = 1250;

const gateEl = $('#gate');
const profile = $('#profile');
const dock = $('#dock');

trackPointer();
const player = setupPlayer();
decodeTitle();

if (document.documentElement.classList.contains('js')) {
  // Keep the profile out of the tab order and the accessibility tree until the gate is open.
  profile.inert = true;
  dock.inert = true;
  const gate = startGate();
  let entered = false;

  const revealProfile = () => {
    document.body.classList.add('entered');
    profile.inert = false;
    dock.inert = false;
    startRain();
    startProfileParallax();
    player.play();
    player.enableWheel();
    profile.focus({ preventScroll: true });
  };

  const removeGate = (delay) =>
    setTimeout(() => {
      gate.stop();
      gateEl.remove();
    }, delay);

  gateEl.addEventListener('click', () => {
    if (entered) return;
    entered = true;

    if (reduceMotion.matches) {
      gateEl.style.transition = 'opacity 300ms';
      gateEl.style.opacity = '0';
      removeGate(320);
    } else {
      playCut(gate);
      removeGate(GATE_EXIT_MS);
    }
    revealProfile();
  });
}
