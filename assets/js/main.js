document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('bg-audio');
  const toggleBtn = document.getElementById('audio-toggle');
  const iconMuted = document.getElementById('icon-muted');
  const iconUnmuted = document.getElementById('icon-unmuted');
  const volumeSlider = document.getElementById('volume-slider');
  const nowPlaying = document.getElementById('now-playing');
  const audioControls = document.querySelector('.audio-controls');
  const enterOverlay = document.getElementById('enter-overlay');

  const FADE_DURATION = 2000; // 2 seconds fade
  
  let isPlaying = false;
  let fadeInterval = null;

  // Set initial state
  audio.volume = 0;
  audio.loop = true;

  const volumePercent = document.getElementById('volume-percent');

  // Volume slider event
  volumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (volumePercent) {
      volumePercent.textContent = Math.round(val * 100) + '%';
    }
    if (isPlaying && !fadeInterval) {
      audio.volume = val;
        if (val === 0) {
          audio.pause();
          if (nowPlaying) nowPlaying.classList.remove('visible');
          if (audioControls) audioControls.classList.remove('is-playing');
          iconUnmuted.classList.add('hidden');
          iconMuted.classList.remove('hidden');
        } else {
          if (audio.paused) audio.play();
          if (nowPlaying) nowPlaying.classList.add('visible');
          if (audioControls) audioControls.classList.add('is-playing');
          iconMuted.classList.add('hidden');
          iconUnmuted.classList.remove('hidden');
        }
    }
  });

  function fadeAudio(targetVolume, callback) {
    if (fadeInterval) clearInterval(fadeInterval);
    
    const steps = 40; // Total steps
    const intervalTime = FADE_DURATION / steps;
    const volumeStep = (targetVolume - audio.volume) / steps;

    fadeInterval = setInterval(() => {
      let newVolume = audio.volume + volumeStep;
      
      if (volumeStep > 0 && newVolume >= targetVolume) {
        audio.volume = targetVolume;
        clearInterval(fadeInterval);
        fadeInterval = null;
        if (callback) callback();
      } else if (volumeStep < 0 && newVolume <= targetVolume) {
        audio.volume = targetVolume;
        clearInterval(fadeInterval);
        fadeInterval = null;
        if (callback) callback();
      } else {
        audio.volume = Math.max(0, Math.min(1, newVolume));
      }
    }, intervalTime);
  }

  function playAudio() {
    audio.play().then(() => {
      isPlaying = true;
      if (parseFloat(volumeSlider.value) === 0) {
        volumeSlider.value = "0.2";
        if (volumePercent) volumePercent.textContent = '20%';
      }
      iconMuted.classList.add('hidden');
      iconUnmuted.classList.remove('hidden');
      audio.volume = parseFloat(volumeSlider.value);
      if (nowPlaying) nowPlaying.classList.add('visible');
      if (audioControls) audioControls.classList.add('is-playing');
    }).catch(err => {
      console.error("Audio playback failed:", err);
    });
  }

  function pauseAudio() {
    isPlaying = false;
    iconUnmuted.classList.add('hidden');
    iconMuted.classList.remove('hidden');
    audio.volume = 0;
    audio.pause();
    if (nowPlaying) nowPlaying.classList.remove('visible');
    if (audioControls) audioControls.classList.remove('is-playing');
  }

  // Handle enter overlay
  enterOverlay.addEventListener('click', () => {
    enterOverlay.classList.add('fade-out');
    setTimeout(() => {
      enterOverlay.style.display = 'none';
    }, 800);
    
    // Trigger animations
    document.body.classList.add('loaded');

    // Start music
    playAudio();
  });

  // Toggle button logic
  toggleBtn.addEventListener('click', () => {
    if (!isPlaying || parseFloat(volumeSlider.value) === 0) {
      playAudio();
    } else {
      pauseAudio();
    }
  });

  // Tab Title Hacker Animation
  const titleText = "Jsoul";
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let iteration = 0;
  let isDeleting = false;

  function animateTitle() {
    if (!isDeleting) {
      let displayLength = Math.floor(iteration) + 1;
      if (displayLength > titleText.length) displayLength = titleText.length;
      
      let textToShow = titleText.substring(0, displayLength).split("").map((char, index) => {
        if (index < Math.floor(iteration)) {
          return char;
        }
        return letters[Math.floor(Math.random() * letters.length)];
      }).join("");

      document.title = textToShow + " _";

      if (iteration >= titleText.length) {
        document.title = titleText; // Lock in without cursor
        isDeleting = true;
        iteration = 0;
        setTimeout(animateTitle, 3000); // Pause at full text
        return;
      }
      
      iteration += 1 / 3; // Scramble 3 times before locking a character
      setTimeout(animateTitle, 60);
    } else {
      if (iteration === 0) {
        document.title = titleText + " _";
        iteration += 1 / 2;
        setTimeout(animateTitle, 800); // Pause with cursor before deleting
        return;
      }

      let currentLength = titleText.length - Math.floor(iteration);
      if (currentLength < 0) {
        document.title = "_";
        isDeleting = false;
        iteration = 0;
        setTimeout(animateTitle, 500); // Pause before re-typing
        return;
      }

      let textToShow = titleText.substring(0, currentLength).split("").map((char, index) => {
        if (index === currentLength - 1) {
          return letters[Math.floor(Math.random() * letters.length)];
        }
        return char;
      }).join("");

      document.title = textToShow + " _";
      iteration += 1 / 2; // Scramble 2 times before deleting a character
      setTimeout(animateTitle, 60);
    }
  }
  
  // Start title animation
  animateTitle();
  // Red Rain Effect
  const canvas = document.getElementById('rain-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let drops = [];

    function initRain() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      drops = [];
      const dropCount = Math.floor(width / 3); // Restore original density
      for (let i = 0; i < dropCount; i++) {
        drops.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: Math.random() * 20 + 10,
          speed: Math.random() * 10 + 15,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
    }

    function drawRain() {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 17, 17, ${d.opacity})`;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.length * 0.1, d.y + d.length); // Slight wind angle
        ctx.stroke();
        
        d.y += d.speed;
        d.x += d.speed * 0.1;
        
        if (d.y > height) {
          d.y = -d.length;
          d.x = Math.random() * width;
        }
      }
      requestAnimationFrame(drawRain);
    }

    window.addEventListener('resize', initRain);
    initRain();
    drawRain();
  }
});
