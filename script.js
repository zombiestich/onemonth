/**
 * One Month Anniversary Card - Interactive Experience
 * Handles all interactions: hotspot clicks, scratching, animations, and replay
 */

const STATE = {
  isRevealed: false,
  isScratchingComplete: false,
  isAnimating: false,
};

const ELEMENTS = {
  cardStage: document.getElementById('cardStage'),
  calendarShell: document.getElementById('calendarShell'),
  certificateShell: document.getElementById('certificateShell'),
  calendarHotspot: document.getElementById('calendarHotspot'),
  scratchCanvas: document.getElementById('scratchCanvas'),
  transitionField: document.getElementById('transitionField'),
  celebrationField: document.getElementById('celebrationField'),
  replayButton: document.getElementById('replayButton'),
};

/**
 * Initialize the scratch canvas with a coating layer
 */
function initializeScratchCanvas() {
  const canvas = ELEMENTS.scratchCanvas;
  const rect = canvas.parentElement.getBoundingClientRect();
  
  canvas.width = rect.width;
  canvas.height = rect.height;

  const ctx = canvas.getContext('2d');
  
  // Draw coating layer (grayscale gradient with pattern)
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#333333');
  gradient.addColorStop(1, '#1a1a1a');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add subtle texture
  ctx.fillStyle = 'rgba(100, 100, 100, 0.1)';
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 2 + 1;
    ctx.fillRect(x, y, size, size);
  }
}

/**
 * Handle scratching on the canvas
 */
function setupScratchInteraction() {
  const canvas = ELEMENTS.scratchCanvas;
  const ctx = canvas.getContext('2d');
  
  let isDrawing = false;
  let scratchPercentage = 0;

  function scratch(e) {
    if (!isDrawing || STATE.isScratchingComplete) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let x, y;
    
    if (e.touches) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }

    // Clear circular area with eraser
    ctx.clearRect(x - 20, y - 20, 40, 40);
    
    // Calculate scratch percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let transparentPixels = 0;
    
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) transparentPixels++;
    }
    
    scratchPercentage = (transparentPixels / (data.length / 4)) * 100;
    
    // Complete reveal at 50% scratched
    if (scratchPercentage > 50 && !STATE.isScratchingComplete) {
      STATE.isScratchingComplete = true;
      canvas.classList.add('is-clearing');
      triggerCelebration();
      setTimeout(() => {
        showReplayButton();
      }, 800);
    }
  }

  canvas.addEventListener('mousedown', () => { isDrawing = true; });
  canvas.addEventListener('mouseup', () => { isDrawing = false; });
  canvas.addEventListener('mousemove', scratch);
  
  canvas.addEventListener('touchstart', () => { isDrawing = true; });
  canvas.addEventListener('touchend', () => { isDrawing = false; });
  canvas.addEventListener('touchmove', scratch);
}

/**
 * Reveal the certificate with animation
 */
function revealCertificate() {
  if (STATE.isRevealed || STATE.isAnimating) return;
  
  STATE.isAnimating = true;
  STATE.isRevealed = true;

  // Animate calendar exit
  ELEMENTS.calendarShell.classList.add('is-exiting');
  
  // Show certificate
  setTimeout(() => {
    ELEMENTS.certificateShell.classList.add('is-live', 'is-entering');
    STATE.isAnimating = false;
  }, 400);
}

/**
 * Trigger celebration particles
 */
function triggerCelebration() {
  const field = ELEMENTS.celebrationField;
  const particles = ['🎉', '✨', '💫', '🌟', '💕'];
  
  for (let i = 0; i < 12; i++) {
    const bit = document.createElement('div');
    bit.className = 'celebration-bit';
    bit.textContent = particles[Math.floor(Math.random() * particles.length)];
    
    const duration = 1500 + Math.random() * 500;
    const delay = (i / 12) * 200;
    const x = (Math.random() - 0.5) * 400;
    const y = (Math.random() - 0.5) * 400;
    const rotation = Math.random() * 360;
    
    bit.style.setProperty('--duration', `${duration}ms`);
    bit.style.setProperty('--delay', `${delay}ms`);
    bit.style.setProperty('--x', `${x}px`);
    bit.style.setProperty('--y', `${y}px`);
    bit.style.setProperty('--rotation', `${rotation}deg`);
    
    field.appendChild(bit);
  }
  
  field.classList.add('is-active');
  
  setTimeout(() => {
    field.classList.remove('is-active');
    field.innerHTML = '';
  }, 2200);
}

/**
 * Show replay button
 */
function showReplayButton() {
  ELEMENTS.replayButton.classList.add('is-visible');
}

/**
 * Reset to initial state
 */
function resetExperience() {
  STATE.isRevealed = false;
  STATE.isScratchingComplete = false;
  STATE.isAnimating = false;

  // Reset animations
  ELEMENTS.calendarShell.classList.remove('is-exiting');
  ELEMENTS.certificateShell.classList.remove('is-live', 'is-entering');
  ELEMENTS.scratchCanvas.classList.remove('is-clearing');
  ELEMENTS.replayButton.classList.remove('is-visible');
  
  // Redraw scratch canvas
  initializeScratchCanvas();
  
  // Clear celebration field
  ELEMENTS.celebrationField.innerHTML = '';
  ELEMENTS.celebrationField.classList.remove('is-active');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  ELEMENTS.calendarHotspot.addEventListener('click', revealCertificate);
  ELEMENTS.calendarHotspot.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      revealCertificate();
    }
  });

  ELEMENTS.replayButton.addEventListener('click', resetExperience);
  ELEMENTS.replayButton.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      resetExperience();
    }
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (STATE.isRevealed && !STATE.isScratchingComplete) {
      initializeScratchCanvas();
    }
  });
}

/**
 * Initialize the experience
 */
function initialize() {
  initializeScratchCanvas();
  setupScratchInteraction();
  setupEventListeners();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
