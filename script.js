/* ═══════════════════════════════════════════════════════════════
   BIRTHDAY WEBSITE — script.js
   Complete interaction, animation, and effect engine
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ──────────────────────────────────────────────────────────────
//  CONSTANTS & STATE
// ──────────────────────────────────────────────────────────────
const TOTAL_SLIDES = 11;
let currentSlide = 1;
let isTransitioning = false;
let audioPlaying = false;
let surpriseRevealed = false;
let fireworksAnimId = null;
let particleAnimId = null;

// Touch/swipe tracking
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

// DOM refs (populated after DOMContentLoaded)
let DOM = {};

// ──────────────────────────────────────────────────────────────
//  INITIALISE
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  cacheDom();
  setIntroDate();
  buildDotNav();
  spawnIntroHearts();
  startAmbientParticles();
  runIntroLoader();
  bindEvents();
});

function cacheDom() {
  DOM = {
    introScreen:      document.getElementById('introScreen'),
    mainPresentation: document.getElementById('mainPresentation'),
    loaderFill:       document.getElementById('loaderFill'),
    loaderText:       document.getElementById('loaderText'),
    introDate:        document.getElementById('introDate'),
    floatingIntroHearts: document.getElementById('floatingIntroHearts'),
    audioBtn:         document.getElementById('audioBtn'),
    audioIcon:        document.getElementById('audioIcon'),
    bgAudio:          document.getElementById('bgAudio'),
    navPrev:          document.getElementById('navPrev'),
    navNext:          document.getElementById('navNext'),
    dotNav:           document.getElementById('dotNav'),
    currentSlideNum:  document.getElementById('currentSlideNum'),
    totalSlideNum:    document.getElementById('totalSlideNum'),
    progressBarFill:  document.getElementById('progressBarFill'),
    swipeHint:        document.getElementById('swipeHint'),
    slidesWrapper:    document.getElementById('slidesWrapper'),
    slides:           document.querySelectorAll('.slide'),
    surpriseBtn:      document.getElementById('surpriseBtn'),
    surpriseMessage:  document.getElementById('surpriseMessage'),
    confettiContainer: document.getElementById('confettiContainer'),
    finaleHearts:     document.getElementById('finaleHearts'),
    fireworksCanvas:  document.getElementById('fireworksCanvas'),
    particleCanvas:   document.getElementById('particleCanvas'),
  };
  DOM.totalSlideNum.textContent = TOTAL_SLIDES;
}

// ──────────────────────────────────────────────────────────────
//  INTRO DATE
// ──────────────────────────────────────────────────────────────
function setIntroDate() {
  const now = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  DOM.introDate.textContent = now.toLocaleDateString('en-GB', opts).toUpperCase();
}

// ──────────────────────────────────────────────────────────────
//  INTRO LOADER & TRANSITION
// ──────────────────────────────────────────────────────────────
const loaderMessages = [
  'Gathering roses... 🌹',
  'Wrapping love in pixels... 💖',
  'Adding sparkles... ✨',
  'Pouring from the heart... 🫂',
  'Almost ready for you... 🎂',
];

function runIntroLoader() {
  let progress = 0;
  let msgIndex = 0;

  const interval = setInterval(() => {
    progress += Math.random() * 4 + 1.5;
    if (progress > 100) progress = 100;
    DOM.loaderFill.style.width = progress + '%';

    // Cycle messages
    const newMsgIndex = Math.floor((progress / 100) * loaderMessages.length);
    if (newMsgIndex !== msgIndex && newMsgIndex < loaderMessages.length) {
      msgIndex = newMsgIndex;
      DOM.loaderText.textContent = loaderMessages[msgIndex];
    }

    if (progress >= 100) {
      clearInterval(interval);
      DOM.loaderText.textContent = 'Ready! 💕';
      setTimeout(transitionToPresentation, 900);
    }
  }, 60);
}

function transitionToPresentation() {
  DOM.introScreen.classList.add('fade-out');
  DOM.mainPresentation.classList.remove('hidden');

  setTimeout(() => {
    DOM.mainPresentation.classList.add('visible');
    DOM.introScreen.style.display = 'none';
    activateSlide(1, 'none');

    // Kick off slide-1 specific effects
    startTypingEffect(document.querySelector('.typing-text'));
    spawnFloatingHearts(document.getElementById('heartsLayer1'), 8);
    spawnSparkles(document.getElementById('sparkleTrail1'), 12);
  }, 600);
}

// ──────────────────────────────────────────────────────────────
//  DOT NAVIGATION BUILD
// ──────────────────────────────────────────────────────────────
function buildDotNav() {
  for (let i = 1; i <= TOTAL_SLIDES; i++) {
    const dot = document.createElement('button');
    dot.classList.add('dot');
    dot.setAttribute('aria-label', `Go to slide ${i}`);
    if (i === 1) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    DOM.dotNav.appendChild(dot);
  }
}

function updateDotNav(slideNum) {
  DOM.dotNav.querySelectorAll('.dot').forEach((dot, idx) => {
    dot.classList.toggle('active', idx + 1 === slideNum);
  });
}

// ──────────────────────────────────────────────────────────────
//  SLIDE NAVIGATION
// ──────────────────────────────────────────────────────────────
function goToSlide(targetNum) {
  if (isTransitioning || targetNum === currentSlide) return;
  if (targetNum < 1 || targetNum > TOTAL_SLIDES) return;

  const direction = targetNum > currentSlide ? 'next' : 'prev';
  const prevSlide = currentSlide;
  currentSlide = targetNum;

  isTransitioning = true;

  // Deactivate old slide
  const oldSlide = document.querySelector(`.slide[data-slide="${prevSlide}"]`);
  oldSlide.classList.remove('active');
  oldSlide.classList.add(direction === 'next' ? 'exit-left' : 'exit-right');

  setTimeout(() => {
    oldSlide.classList.remove('exit-left', 'exit-right');
    isTransitioning = false;
  }, 900);

  // Activate new slide
  activateSlide(currentSlide, direction);
  updateUI(currentSlide);
}

function activateSlide(slideNum, direction) {
  const slide = document.querySelector(`.slide[data-slide="${slideNum}"]`);
  if (!slide) return;

  // Reset animation classes so they re-trigger
  slide.querySelectorAll('.fade-in-up').forEach(el => {
    el.style.transitionDelay = '';
    el.classList.remove('fade-in-up');
    void el.offsetWidth; // reflow
    el.classList.add('fade-in-up');
  });

  slide.classList.add('active');

  // Slide-specific effects
  onSlideEnter(slideNum);
}

function updateUI(slideNum) {
  DOM.currentSlideNum.textContent = slideNum;
  updateDotNav(slideNum);
  DOM.progressBarFill.style.width = ((slideNum / TOTAL_SLIDES) * 100) + '%';
  DOM.navPrev.classList.toggle('disabled', slideNum === 1);
  DOM.navNext.classList.toggle('disabled', slideNum === TOTAL_SLIDES);
}

// ──────────────────────────────────────────────────────────────
//  PER-SLIDE ENTRY EFFECTS
// ──────────────────────────────────────────────────────────────
function onSlideEnter(slideNum) {
  switch (slideNum) {
    case 1:
      spawnFloatingHearts(document.getElementById('heartsLayer1'), 8);
      spawnSparkles(document.getElementById('sparkleTrail1'), 12);
      setTimeout(() => startTypingEffect(document.querySelector('.typing-text')), 300);
      break;
    case 3:
      spawnPetals(document.getElementById('petalsLayer'), 14);
      break;
    case 11:
      launchFinale();
      break;
  }
}

// ──────────────────────────────────────────────────────────────
//  TYPING EFFECT
// ──────────────────────────────────────────────────────────────
function startTypingEffect(el) {
  if (!el) return;
  const text = el.dataset.text || el.textContent;
  el.textContent = '';
  el.classList.add('typing-cursor');

  let i = 0;
  const typeInterval = setInterval(() => {
    // Handle emoji sequences (multi-char) gracefully
    el.textContent = [...text].slice(0, i + 1).join('');
    i++;
    if (i >= [...text].length) {
      clearInterval(typeInterval);
      setTimeout(() => el.classList.remove('typing-cursor'), 1000);
    }
  }, 65);
}

// ──────────────────────────────────────────────────────────────
//  FLOATING HEARTS
// ──────────────────────────────────────────────────────────────
const HEARTS = ['❤️','💕','💖','💗','💓','🌹','💝','💞'];

function spawnFloatingHearts(container, count) {
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const h = document.createElement('span');
    h.classList.add('intro-heart');
    h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    h.style.cssText = `
      left: ${Math.random() * 100}%;
      font-size: ${0.6 + Math.random() * 1.2}rem;
      --dur: ${3 + Math.random() * 4}s;
      --delay: ${Math.random() * 4}s;
    `;
    container.appendChild(h);
  }
}

// ──────────────────────────────────────────────────────────────
//  SPARKLES
// ──────────────────────────────────────────────────────────────
const SPARKLES = ['✦','✧','⋆','✺','✹','✸','★','☆'];

function spawnSparkles(container, count) {
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.classList.add('sparkle');
    s.textContent = SPARKLES[Math.floor(Math.random() * SPARKLES.length)];
    const colors = ['#f9a8d4','#fde68a','#ddd6fe','#a5f3fc','#ffffff'];
    s.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      color: ${colors[Math.floor(Math.random() * colors.length)]};
      --sz: ${0.5 + Math.random() * 0.8}rem;
      --dur: ${1.2 + Math.random() * 2}s;
      --delay: ${Math.random() * 3}s;
    `;
    container.appendChild(s);
  }
}

// ──────────────────────────────────────────────────────────────
//  PETALS (Slide 3)
// ──────────────────────────────────────────────────────────────
const PETALS_CHARS = ['🌸','🌺','🌷','🌼','💮'];

function spawnPetals(container, count) {
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.classList.add('petal');
    p.textContent = PETALS_CHARS[Math.floor(Math.random() * PETALS_CHARS.length)];
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      font-size: ${0.7 + Math.random() * 0.8}rem;
      --dur: ${4 + Math.random() * 4}s;
      --delay: ${Math.random() * 5}s;
    `;
    container.appendChild(p);
  }
}

// ──────────────────────────────────────────────────────────────
//  FINALE EFFECTS
// ──────────────────────────────────────────────────────────────
function launchFinale() {
  // Confetti burst
  setTimeout(() => launchConfetti(), 400);
  // Floating finale hearts
  setTimeout(() => spawnFinaleHearts(), 600);
  // Fireworks
  setTimeout(() => startFireworks(), 200);
}

// ── Confetti ──
const CONFETTI_COLORS = ['#ec4899','#a855f7','#f59e0b','#fde68a','#f9a8d4','#ffffff','#6ee7b7','#93c5fd'];

function launchConfetti() {
  const container = DOM.confettiContainer;
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < 120; i++) {
    const piece = document.createElement('div');
    piece.classList.add('confetti-piece');
    const size = 4 + Math.random() * 8;
    const isCircle = Math.random() > 0.5;
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${isCircle ? size : size * 2.5}px;
      background: ${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
      border-radius: ${isCircle ? '50%' : '2px'};
      --dur: ${2.5 + Math.random() * 3}s;
      --delay: ${Math.random() * 3}s;
      transform: rotate(${Math.random() * 360}deg);
    `;
    container.appendChild(piece);
  }
}

// ── Finale Hearts ──
function spawnFinaleHearts() {
  const container = DOM.finaleHearts;
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < 20; i++) {
    const h = document.createElement('span');
    h.classList.add('finale-heart');
    h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    h.style.cssText = `
      left: ${Math.random() * 100}%;
      --size: ${0.8 + Math.random() * 1.5}rem;
      --dur: ${4 + Math.random() * 5}s;
      --delay: ${Math.random() * 5}s;
    `;
    container.appendChild(h);
  }
}

// ── Fireworks Canvas ──
const fireworks = [];
const particles_fw = [];

function startFireworks() {
  const canvas = DOM.fireworksCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function randomFireworkColor() {
    const colors = ['#ec4899','#a855f7','#f59e0b','#fde68a','#f9a8d4','#ffffff','#6ee7b7','#c4b5fd'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function createFirework() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.6;
    const color = randomFireworkColor();
    const particleCount = 50 + Math.floor(Math.random() * 30);

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 / particleCount) * i;
      const speed = 2 + Math.random() * 5;
      particles_fw.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.02,
        color,
        size: 2 + Math.random() * 2,
      });
    }
  }

  // Launch fireworks on a schedule
  let fwInterval = setInterval(() => {
    if (currentSlide !== 11) {
      clearInterval(fwInterval);
      if (fireworksAnimId) cancelAnimationFrame(fireworksAnimId);
      return;
    }
    createFirework();
    if (Math.random() > 0.5) createFirework(); // double burst
  }, 700);

  function animateFireworks() {
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = particles_fw.length - 1; i >= 0; i--) {
      const p = particles_fw[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.vx *= 0.98;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles_fw.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    fireworksAnimId = requestAnimationFrame(animateFireworks);
  }

  animateFireworks();
}

// ──────────────────────────────────────────────────────────────
//  AMBIENT PARTICLE CANVAS (global background stars)
// ──────────────────────────────────────────────────────────────
function startAmbientParticles() {
  const canvas = DOM.particleCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const stars = [];
  const STAR_COUNT = 80;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: 0.3 + Math.random() * 1.2,
      opacity: Math.random(),
      speed: 0.003 + Math.random() * 0.01,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = Date.now() * 0.001;

    stars.forEach(s => {
      const alpha = 0.2 + 0.6 * Math.abs(Math.sin(t * s.speed + s.phase));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    particleAnimId = requestAnimationFrame(animateStars);
  }

  animateStars();
}

// ──────────────────────────────────────────────────────────────
//  INTRO FLOATING HEARTS
// ──────────────────────────────────────────────────────────────
function spawnIntroHearts() {
  const container = DOM.floatingIntroHearts;
  if (!container) return;

  for (let i = 0; i < 15; i++) {
    const h = document.createElement('span');
    h.classList.add('intro-heart');
    h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    h.style.cssText = `
      left: ${Math.random() * 100}%;
      font-size: ${0.6 + Math.random() * 0.8}rem;
      --dur: ${5 + Math.random() * 6}s;
      --delay: ${Math.random() * 6}s;
    `;
    container.appendChild(h);
  }
}

// ──────────────────────────────────────────────────────────────
//  AUDIO (Web Audio API fallback + file support)
// ──────────────────────────────────────────────────────────────
let audioCtx = null;
let gainNode = null;
let oscillatorNodes = [];
let useWebAudio = false;

function initAudio() {
  // Try to play the MP3 file first
  const audio = DOM.bgAudio;

  audio.addEventListener('error', () => {
    // Fallback: generate gentle ambient tone with Web Audio API
    useWebAudio = true;
    startWebAudioMusic();
  });

  audio.play().then(() => {
    audioPlaying = true;
    DOM.audioBtn.classList.add('playing');
    DOM.audioIcon.textContent = '🎵';
  }).catch(() => {
    // File not found, use Web Audio fallback
    useWebAudio = true;
    startWebAudioMusic();
  });
}

function startWebAudioMusic() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 2);
    gainNode.connect(audioCtx.destination);

    // Gentle ambient chord: D minor pentatonic-ish
    const notes = [293.66, 349.23, 392.00, 440.00, 523.25]; // D4 F4 G4 A4 C5
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      oscGain.gain.setValueAtTime(0.15 / notes.length, audioCtx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(gainNode);
      osc.start();
      oscillatorNodes.push(osc);

      // Slow gentle vibrato
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.3 + i * 0.05, audioCtx.currentTime);
      lfoGain.gain.setValueAtTime(2, audioCtx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
    });

    audioPlaying = true;
    DOM.audioBtn.classList.add('playing');
    DOM.audioIcon.textContent = '🎵';
  } catch(e) {
    console.log('Web Audio not available');
  }
}

function toggleAudio() {
  if (!audioCtx && !DOM.bgAudio.src) {
    initAudio();
    return;
  }

  if (useWebAudio) {
    if (audioPlaying) {
      gainNode && gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
      audioPlaying = false;
      DOM.audioBtn.classList.remove('playing');
      DOM.audioIcon.textContent = '🔇';
    } else {
      gainNode && gainNode.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.5);
      audioPlaying = true;
      DOM.audioBtn.classList.add('playing');
      DOM.audioIcon.textContent = '🎵';
    }
  } else {
    if (audioPlaying) {
      DOM.bgAudio.pause();
      audioPlaying = false;
      DOM.audioBtn.classList.remove('playing');
      DOM.audioIcon.textContent = '🔇';
    } else {
      DOM.bgAudio.play();
      audioPlaying = true;
      DOM.audioBtn.classList.add('playing');
      DOM.audioIcon.textContent = '🎵';
    }
  }
}

// ──────────────────────────────────────────────────────────────
//  SURPRISE BUTTON
// ──────────────────────────────────────────────────────────────
function triggerSurprise() {
  if (surpriseRevealed) return;
  surpriseRevealed = true;

  DOM.surpriseBtn.style.transform = 'scale(0.9)';
  setTimeout(() => {
    DOM.surpriseBtn.style.transform = '';
    DOM.surpriseMessage.classList.remove('hidden');

    // Extra confetti burst on surprise reveal
    launchConfetti();

    // Scroll message into view on mobile
    DOM.surpriseMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 200);
}

// ──────────────────────────────────────────────────────────────
//  EVENT BINDING
// ──────────────────────────────────────────────────────────────
function bindEvents() {
  // Nav buttons
  DOM.navNext.addEventListener('click', () => goToSlide(currentSlide + 1));
  DOM.navPrev.addEventListener('click', () => goToSlide(currentSlide - 1));

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      goToSlide(currentSlide + 1);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      goToSlide(currentSlide - 1);
    }
  });

  // Touch / swipe
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dt = Date.now() - touchStartTime;

    // Only horizontal swipes faster than 400ms with > 40px travel
    if (dt < 400 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goToSlide(currentSlide + 1); // swipe left → next
      else         goToSlide(currentSlide - 1); // swipe right → prev
    }
  }, { passive: true });

  // Audio button
  DOM.audioBtn.addEventListener('click', () => {
    if (!audioCtx && !audioPlaying) {
      initAudio();
    } else {
      toggleAudio();
    }
  });

  // Surprise button
  if (DOM.surpriseBtn) {
    DOM.surpriseBtn.addEventListener('click', triggerSurprise);
  }

  // Hide swipe hint after first nav
  const hideHint = () => {
    if (DOM.swipeHint) {
      DOM.swipeHint.style.opacity = '0';
      DOM.swipeHint.style.transition = 'opacity 0.5s';
    }
  };
  DOM.navNext.addEventListener('click', hideHint, { once: true });
  document.addEventListener('touchend', hideHint, { once: true });
  document.addEventListener('keydown', hideHint, { once: true });

  // Handle window resize for canvases
  window.addEventListener('resize', () => {
    if (DOM.fireworksCanvas) {
      DOM.fireworksCanvas.width = DOM.fireworksCanvas.offsetWidth;
      DOM.fireworksCanvas.height = DOM.fireworksCanvas.offsetHeight;
    }
  });
}

// ──────────────────────────────────────────────────────────────
//  SCROLL-WITHIN-SLIDE (prevent triggering nav)
// ──────────────────────────────────────────────────────────────
// Handled by CSS: .slide.active .slide-content has overflow-y: auto

// ──────────────────────────────────────────────────────────────
//  MOUSE SPARKLE TRAIL (desktop magic)
// ──────────────────────────────────────────────────────────────
(function initMouseTrail() {
  let trailTimeout;

  document.addEventListener('mousemove', (e) => {
    clearTimeout(trailTimeout);
    trailTimeout = setTimeout(() => {
      const spark = document.createElement('span');
      spark.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        pointer-events: none;
        z-index: 9999;
        font-size: ${0.4 + Math.random() * 0.5}rem;
        opacity: 1;
        transition: opacity 0.6s ease, transform 0.6s ease;
        transform: translate(-50%, -50%) scale(1);
      `;
      spark.textContent = SPARKLES[Math.floor(Math.random() * SPARKLES.length)];
      spark.style.color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      document.body.appendChild(spark);

      requestAnimationFrame(() => {
        spark.style.opacity = '0';
        spark.style.transform = `translate(-50%, -100%) scale(0.3)`;
      });

      setTimeout(() => spark.remove(), 700);
    }, 16);
  });
})();
