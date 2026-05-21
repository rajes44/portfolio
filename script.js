/* =============================================
   SCRIPT.JS — SPACE PORTFOLIO
   ============================================= */

// ============================================
// 1. SPACE CANVAS — Stars, Galaxy, Shooting Stars
// ============================================

const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');

let W, H;
let stars = [];
let galaxyDust = [];
let shootingStars = [];
let nebulae = [];
let animFrameId;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

// --- Star ---
class Star {
  constructor() { this.reset(true); }
  reset(initial = false) {
    this.x = Math.random() * W;
    this.y = initial ? Math.random() * H : Math.random() * H;
    this.r = Math.random() * 1.8 + 0.2;
    this.baseR = this.r;
    this.alpha = Math.random() * 0.8 + 0.2;
    this.tw = Math.random() * 4000 + 2000;
    this.twPhase = Math.random() * Math.PI * 2;
    this.color = this.randomStarColor();
  }
  randomStarColor() {
    const colors = ['#ffffff','#ffffffcc','#a78bfa88','#38bdf888','#f472b666','#fbbf2455'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  draw(t) {
    const pulse = Math.sin(t / this.tw * Math.PI * 2 + this.twPhase);
    const a = this.alpha * (0.7 + 0.3 * pulse);
    const r = this.baseR * (0.9 + 0.1 * pulse);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Galaxy Dust Particle ---
class GalaxyDust {
  constructor() { this.reset(); }
  reset() {
    this.cx = W * 0.6 + (Math.random() - 0.5) * W * 0.4;
    this.cy = H * 0.35 + (Math.random() - 0.5) * H * 0.3;
    this.angle = Math.random() * Math.PI * 2;
    this.radius = Math.random() * Math.min(W, H) * 0.22 + 20;
    this.speed = (Math.random() * 0.0002 + 0.00005) * (Math.random() < 0.5 ? 1 : -1);
    this.alpha = Math.random() * 0.4 + 0.05;
    this.size = Math.random() * 2 + 0.5;
    const hue = Math.floor(Math.random() * 80 + 220);
    this.color = `hsl(${hue},70%,70%)`;
  }
  update() { this.angle += this.speed; }
  draw() {
    const x = this.cx + Math.cos(this.angle) * this.radius * (1 + 0.3 * Math.sin(this.angle * 3));
    const y = this.cy + Math.sin(this.angle) * this.radius * 0.45;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Shooting Star (with fire trail) ---
class ShootingStar {
  constructor() { this.init(); }
  init() {
    this.x = Math.random() * W;
    this.y = Math.random() * H * 0.5;
    this.len = Math.random() * 180 + 80;
    this.speed = Math.random() * 10 + 8;
    this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;
    this.alpha = 1;
    this.alive = true;
    this.trail = [];
    // Fire colors: white core → yellow → orange → red → transparent
    this.coreColors = [
      [255, 255, 255],
      [255, 240, 150],
      [255, 160, 60],
      [220, 50, 20],
    ];
    this.maxTrail = 40;
    this.width = Math.random() * 2 + 1.5;
  }
  update() {
    this.trail.push({ x: this.x, y: this.y, alpha: 1 });
    if (this.trail.length > this.maxTrail) this.trail.shift();
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    if (this.x > W + 100 || this.y > H + 100) {
      this.alive = false;
    }
  }
  draw() {
    if (this.trail.length < 2) return;
    for (let i = 1; i < this.trail.length; i++) {
      const p = (i) / this.trail.length;
      const p2 = (i - 1) / this.trail.length;
      const t = this.trail[i];
      const t2 = this.trail[i - 1];

      // Interpolate color across trail
      const ci = Math.floor(p * (this.coreColors.length - 1));
      const cn = Math.min(ci + 1, this.coreColors.length - 1);
      const f = (p * (this.coreColors.length - 1)) - ci;
      const r = Math.round(this.coreColors[ci][0] * (1-f) + this.coreColors[cn][0] * f);
      const g = Math.round(this.coreColors[ci][1] * (1-f) + this.coreColors[cn][1] * f);
      const b = Math.round(this.coreColors[ci][2] * (1-f) + this.coreColors[cn][2] * f);

      ctx.save();
      ctx.globalAlpha = p * this.alpha;
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.lineWidth = this.width * p;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
      ctx.beginPath();
      ctx.moveTo(t2.x, t2.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
      ctx.restore();
    }
    // Draw bright head
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(255,255,220,0.9)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Nebula Glow ---
class Nebula {
  constructor() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.r = Math.random() * 200 + 100;
    const hue = Math.floor(Math.random() * 300);
    this.color = `hsl(${hue},60%,50%)`;
    this.alpha = Math.random() * 0.04 + 0.01;
  }
  draw() {
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
    grad.addColorStop(0, this.color.replace('hsl', 'hsla').replace(')', `, ${this.alpha})`));
    grad.addColorStop(1, 'transparent');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function initSpace() {
  stars = Array.from({ length: 280 }, () => new Star());
  galaxyDust = Array.from({ length: 200 }, () => new GalaxyDust());
  nebulae = Array.from({ length: 8 }, () => new Nebula());
}

let lastShoot = 0;
let shootInterval = 2500;
let frameCount = 0;

function drawSpace(t) {
  ctx.clearRect(0, 0, W, H);

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#00000f');
  bg.addColorStop(0.4, '#020218');
  bg.addColorStop(0.7, '#04031a');
  bg.addColorStop(1, '#06021c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Nebulae
  nebulae.forEach(n => n.draw());

  // Galaxy core glow
  const gc = ctx.createRadialGradient(W * 0.6, H * 0.35, 0, W * 0.6, H * 0.35, Math.min(W, H) * 0.25);
  gc.addColorStop(0, 'rgba(100,60,200,0.10)');
  gc.addColorStop(0.5, 'rgba(60,40,150,0.05)');
  gc.addColorStop(1, 'transparent');
  ctx.fillStyle = gc;
  ctx.beginPath();
  ctx.ellipse(W * 0.6, H * 0.35, Math.min(W,H)*0.25, Math.min(W,H)*0.12, -0.3, 0, Math.PI*2);
  ctx.fill();

  // Galaxy dust
  galaxyDust.forEach(p => { p.update(); p.draw(); });

  // Stars
  stars.forEach(s => s.draw(t));

  // Shooting stars
  if (t - lastShoot > shootInterval) {
    shootingStars.push(new ShootingStar());
    lastShoot = t;
    shootInterval = Math.random() * 3000 + 2000;
  }

  shootingStars = shootingStars.filter(s => s.alive);
  shootingStars.forEach(s => { s.update(); s.draw(); });

  frameCount++;
  animFrameId = requestAnimationFrame(drawSpace);
}

// ============================================
// 2. SPLASH EFFECT
// ============================================

function createSplash(x, y, color) {
  const overlay = document.getElementById('splashOverlay');
  const el = document.createElement('div');
  el.classList.add('splash-ripple');
  const size = Math.max(window.innerWidth, window.innerHeight) * 0.1;
  el.style.cssText = `
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    background: radial-gradient(circle, ${color}55 0%, ${color}22 40%, transparent 70%);
    border: 2px solid ${color}44;
  `;
  overlay.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function initSplash() {
  document.querySelectorAll('.splash-btn').forEach(el => {
    el.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      const color = this.dataset.color || '#a78bfa';
      // Multiple waves
      createSplash(x, y, color);
      setTimeout(() => createSplash(x + (Math.random()-0.5)*30, y + (Math.random()-0.5)*30, color), 120);
      setTimeout(() => createSplash(x + (Math.random()-0.5)*50, y + (Math.random()-0.5)*50, color), 240);
    });
  });
}

// ============================================
// 3. NAVBAR
// ============================================

function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const links = navLinks.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  // Active link on scroll
  const sections = document.querySelectorAll('section[id]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = navLinks.querySelector(`a[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => obs.observe(s));
}

// ============================================
// 4. TYPEWRITER
// ============================================

function initTypewriter() {
  const el = document.getElementById('typewriter');
  const phrases = [
    'Digital Marketing Enthusiast',
    'Founder of Yazra Marketing',
    'Social Media Strategist',
    'Brand Builder',
    'Content Creator',
    'BSc CS AIML Student',
    'Hackathon Champion',
  ];
  let pi = 0, ci = 0, deleting = false;

  function type() {
    const phrase = phrases[pi];
    if (!deleting) {
      el.textContent = phrase.slice(0, ci + 1);
      ci++;
      if (ci === phrase.length) {
        deleting = true;
        setTimeout(type, 1800);
        return;
      }
      setTimeout(type, 75);
    } else {
      el.textContent = phrase.slice(0, ci - 1);
      ci--;
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        setTimeout(type, 400);
        return;
      }
      setTimeout(type, 40);
    }
  }

  setTimeout(type, 800);
}

// ============================================
// 5. REVEAL ON SCROLL
// ============================================

function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
          // Trigger skill bars
          entry.target.querySelectorAll('.skill-fill').forEach(bar => {
            bar.style.width = bar.dataset.width + '%';
          });
        }, 100 * (entry.target.dataset.delay || 0));
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  els.forEach((el, i) => {
    el.dataset.delay = i % 3;
    obs.observe(el);
  });
}

// ============================================
// 6. COUNTER ANIMATION
// ============================================

function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = +entry.target.dataset.target;
        let current = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(timer); }
          entry.target.textContent = Math.floor(current);
        }, 20);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => obs.observe(c));
}

// ============================================
// 7. CONTACT FORM
// ============================================

function initForm() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    setTimeout(() => {
      success.style.display = 'block';
      form.reset();
      btn.innerHTML = '<span>Send Message</span>';
      btn.disabled = false;
      setTimeout(() => { success.style.display = 'none'; }, 4000);
    }, 1500);
  });
}

// ============================================
// 8. CURSOR PARTICLE TRAIL
// ============================================

function initCursorTrail() {
  const trailColors = ['#a78bfa','#38bdf8','#34d399','#f472b6','#fbbf24','#f97316'];
  let lastX = 0, lastY = 0;

  document.addEventListener('mousemove', (e) => {
    const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
    if (dist < 15) return;
    lastX = e.clientX;
    lastY = e.clientY;

    const dot = document.createElement('div');
    dot.style.cssText = `
      position: fixed;
      left: ${e.clientX}px;
      top: ${e.clientY}px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${trailColors[Math.floor(Math.random() * trailColors.length)]};
      pointer-events: none;
      z-index: 9998;
      transform: translate(-50%, -50%);
      transition: all 0.5s ease;
      box-shadow: 0 0 6px currentColor;
    `;
    document.body.appendChild(dot);
    requestAnimationFrame(() => {
      dot.style.opacity = '0';
      dot.style.transform = 'translate(-50%, -50%) scale(0)';
    });
    setTimeout(() => dot.remove(), 500);
  });
}

// ============================================
// 9. PARTICLE BURST ON BUTTON CLICKS
// ============================================

function initParticleBurst() {
  document.querySelectorAll('.btn, .project-link, .social-icon').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX || rect.left + rect.width / 2;
      const y = e.clientY || rect.top + rect.height / 2;
      const color = this.dataset.color || '#a78bfa';

      for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        const angle = (i / 12) * Math.PI * 2;
        const speed = Math.random() * 80 + 40;
        const size = Math.random() * 6 + 3;
        p.style.cssText = `
          position: fixed;
          left: ${x}px;
          top: ${y}px;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color};
          pointer-events: none;
          z-index: 10000;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 ${size*2}px ${color};
          transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        `;
        document.body.appendChild(p);
        requestAnimationFrame(() => {
          p.style.left = `${x + Math.cos(angle) * speed}px`;
          p.style.top = `${y + Math.sin(angle) * speed}px`;
          p.style.opacity = '0';
          p.style.transform = 'translate(-50%, -50%) scale(0)';
        });
        setTimeout(() => p.remove(), 700);
      }
    });
  });
}

// ============================================
// 10. SMOOTH SECTION TRANSITIONS
// ============================================

function initSectionEffects() {
  // Add staggered reveal to project cards
  document.querySelectorAll('.project-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.08}s`;
  });

  // Skill bar glow on hover
  document.querySelectorAll('.skill-fill').forEach(fill => {
    const color = fill.style.getPropertyValue('--color');
    fill.addEventListener('mouseenter', () => {
      fill.style.boxShadow = `0 0 12px ${color}`;
    });
    fill.addEventListener('mouseleave', () => {
      fill.style.boxShadow = 'none';
    });
  });
}

// ============================================
// 11. TILT EFFECT ON CARDS
// ============================================

function initTilt() {
  document.querySelectorAll('.project-card, .about-card').forEach(card => {
    card.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      this.style.transform = `translateY(-8px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
    });
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
    });
  });
}

// ============================================
// INIT
// ============================================

window.addEventListener('resize', () => {
  resize();
  initSpace();
});

document.addEventListener('DOMContentLoaded', () => {
  resize();
  initSpace();
  drawSpace(0);

  initSplash();
  initNavbar();
  initTypewriter();
  initReveal();
  initCounters();
  initForm();
  initCursorTrail();
  initParticleBurst();
  initSectionEffects();
  initTilt();
});
