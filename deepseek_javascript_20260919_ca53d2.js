/* КУРСОР */
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
document.addEventListener('mousemove', (e) => {
  mx = e.clientX;
  my = e.clientY;
  dot.style.left = mx + 'px';
  dot.style.top = my + 'px';
});
function animCursor() {
  rx += (mx - rx) * 0.18;
  ry += (my - ry) * 0.18;
  ring.style.left = rx + 'px';
  ring.style.top = ry + 'px';
  requestAnimationFrame(animCursor);
}
animCursor();
const hoverTargets = 'a,button,.project-row,.rail-link,.rail-logo,.btn-morph,.island-dot,.island-add,.island-trigger,.about-card,.cube-scene,.cw-dot,.cw-visitors,.face-visitors,.or-close';
document.addEventListener('mouseover', (e) => {
  if (e.target.closest(hoverTargets)) {
    ring.classList.add('hover');
    dot.style.width = '12px';
    dot.style.height = '12px';
  }
});
document.addEventListener('mouseout', (e) => {
  if (e.target.closest(hoverTargets)) {
    ring.classList.remove('hover');
    dot.style.width = '8px';
    dot.style.height = '8px';
  }
});

/* ============================================================
   СЧЁТЧИК ПОСЕЩЕНИЙ
   ============================================================ */
async function loadVisitors() {
  let count = null;
  try {
    const res = await fetch('https://api.counterapi.dev/v1/inky-showcase-2026/visits/up', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.count === 'number') count = data.count;
    }
  } catch (e) {}
  if (count === null) {
    try {
      let local = parseInt(localStorage.getItem('inky_visits') || '0', 10);
      local += 1;
      localStorage.setItem('inky_visits', local);
      count = 1287 + local;
    } catch (e) {
      count = 1287;
    }
  }
  const txt = count.toLocaleString('ru-RU');
  document.querySelectorAll('[data-visitors]').forEach((el) => {
    el.textContent = txt;
    el.style.transition = 'opacity .5s ease';
    el.style.opacity = '0';
    setTimeout(() => { el.style.opacity = '1'; }, 50);
  });
}
loadVisitors();

/* ПАРАЛЛАКС */
const starsParallax = document.getElementById('starsParallax');
let targetMX = 0, targetMY = 0, currentMX = 0, currentMY = 0;
document.addEventListener('mousemove', (e) => {
  targetMX = (e.clientX / window.innerWidth - 0.5) * 2;
  targetMY = (e.clientY / window.innerHeight - 0.5) * 2;
});
function animateParallax() {
  currentMX += (targetMX - currentMX) * 0.05;
  currentMY += (targetMY - currentMY) * 0.05;
  starsParallax.style.transform = `translate(${currentMX * 20}px, ${currentMY * 20}px)`;
  requestAnimationFrame(animateParallax);
}
animateParallax();
document.addEventListener('mouseleave', () => { targetMX = 0; targetMY = 0; });

/* 3D КУБ + УДЕРЖАНИЕ */
(function () {
  const scene = document.getElementById('cubeScene');
  const stage = document.getElementById('cubeStage');
  const cube = document.getElementById('cube');
  const chargeOverlay = document.getElementById('chargeOverlay');
  const chargeFill = document.getElementById('chargeFill');
  const chargeCount = document.getElementById('chargeCount');
  const overloadReveal = document.getElementById('overloadReveal');
  if (!scene || !stage || !cube) return;

  let rotX = -14, rotY = 0;
  let velX = 0, velY = 0;
  let isDragging = false;
  let lastX = 0, lastY = 0;
  let idleTime = 0;
  const AUTO_SPEED = 0.25;
  const BASE_TILT = -14;
  const FRICTION = 0.94;
  const IDLE_DELAY = 60;

  // charge state
  let holdStart = 0;
  let holdInterval = null;
  let chargeProgress = 0;
  let chargeCompleted = false;

  function apply() {
    cube.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  }
  apply();

  function loop() {
    if (!isDragging) {
      if (Math.abs(velX) > 0.01 || Math.abs(velY) > 0.01) {
        rotY += velX;
        rotX += velY;
        velX *= FRICTION;
        velY *= FRICTION;
        rotX = Math.max(-70, Math.min(70, rotX));
        idleTime = 0;
        apply();
      } else {
        velX = 0;
        velY = 0;
        idleTime++;
        if (idleTime > IDLE_DELAY) {
          rotY += AUTO_SPEED;
          rotX += (BASE_TILT - rotX) * 0.03;
          apply();
        }
      }
    }
    requestAnimationFrame(loop);
  }
  loop();

  function updateChargeUI(progress) {
    const remaining = Math.max(0, 10 - progress * 10).toFixed(1);
    chargeCount.textContent = remaining;
    const circumference = 2 * Math.PI * 92;
    const offset = circumference * (1 - progress);
    chargeFill.style.strokeDashoffset = offset;
  }

  function startCharge() {
    if (chargeCompleted) return;
    holdStart = Date.now();
    chargeOverlay.classList.add('charging');
    stage.classList.add('charging');
    chargeProgress = 0;
    updateChargeUI(0);
    holdInterval = setInterval(() => {
      const elapsed = (Date.now() - holdStart) / 1000;
      const progress = Math.min(elapsed / 10, 1);
      chargeProgress = progress;
      updateChargeUI(progress);
      if (progress >= 1) {
        clearInterval(holdInterval);
        holdInterval = null;
        chargeCompleted = true;
        triggerOverload();
      }
    }, 50);
  }

  function cancelCharge() {
    if (holdInterval) {
      clearInterval(holdInterval);
      holdInterval = null;
    }
    chargeOverlay.classList.remove('charging');
    stage.classList.remove('charging');
    if (!chargeCompleted) {
      chargeProgress = 0;
      updateChargeUI(0);
    }
  }

  function triggerOverload() {
    // взрывной эффект
    const burst = document.createElement('div');
    burst.className = 'burst';
    burst.style.left = '50%';
    burst.style.top = '50%';
    burst.style.position = 'absolute';
    const flash = document.createElement('div');
    flash.className = 'burst-flash';
    burst.appendChild(flash);
    [280, 200, 140].forEach((s, i) => {
      const r = document.createElement('div');
      r.className = 'burst-ring';
      r.style.width = s + 'px';
      r.style.height = s + 'px';
      r.style.animationDelay = (i * 0.06) + 's';
      burst.appendChild(r);
    });
    for (let i = 0; i < 16; i++) {
      const sh = document.createElement('div');
      sh.className = 'burst-shard';
      sh.style.setProperty('--angle', (360 / 16 * i) + 'deg');
      sh.style.setProperty('--dist', (90 + Math.random() * 70) + 'px');
      sh.style.animationDelay = (Math.random() * 0.1) + 's';
      burst.appendChild(sh);
    }
    stage.appendChild(burst);
    setTimeout(() => burst.remove(), 1400);

    // показать оверлей
    overloadReveal.classList.add('active');
  }

  window.closeReveal = function () {
    overloadReveal.classList.remove('active');
    chargeCompleted = false;
    chargeProgress = 0;
    updateChargeUI(0);
    chargeOverlay.classList.remove('charging');
    stage.classList.remove('charging');
  };

  function startDrag(e) {
    isDragging = true;
    scene.classList.add('dragging');
    stage.classList.add('dragging');
    const p = e.touches ? e.touches[0] : e;
    lastX = p.clientX;
    lastY = p.clientY;
    velX = 0;
    velY = 0;
    idleTime = 0;
    startCharge();
  }

  function moveDrag(e) {
    if (!isDragging) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - lastX;
    const dy = p.clientY - lastY;
    const k = 0.5;
    rotY += dx * k;
    rotX -= dy * k;
    rotX = Math.max(-70, Math.min(70, rotX));
    velX = dx * k;
    velY = -dy * k;
    lastX = p.clientX;
    lastY = p.clientY;
    apply();
    if (e.cancelable && e.type === 'touchmove') e.preventDefault();
  }

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    scene.classList.remove('dragging');
    stage.classList.remove('dragging');
    idleTime = 0;
    if (!chargeCompleted) cancelCharge();
  }

  scene.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', moveDrag);
  window.addEventListener('mouseup', endDrag);
  scene.addEventListener('touchstart', startDrag, { passive: true });
  window.addEventListener('touchmove', moveDrag, { passive: false });
  window.addEventListener('touchend', endDrag);
  window.addEventListener('touchcancel', endDrag);
})();

/* DYNAMIC ISLAND */
const island = document.getElementById('island');
const islandTrigger = document.getElementById('islandTrigger');
islandTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  island.classList.toggle('open');
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.island')) island.classList.remove('open');
});

/* ЦВЕТОВЫЕ УТИЛИТЫ */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(full.substring(0, 2), 16),
    g: parseInt(full.substring(2, 4), 16),
    b: parseInt(full.substring(4, 6), 16),
  };
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}
function mix(hexA, hexB, weight) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return rgbToHex(a.r * weight + b.r * (1 - weight), a.g * weight + b.g * (1 - weight), a.b * weight + b.b * (1 - weight));
}
function rgba(hex, alpha) {
  const c = hexToRgb(hex);
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}
function relLuminance(hex) {
  const c = hexToRgb(hex);
  const chan = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(c.r) + 0.7152 * chan(c.g) + 0.0722 * chan(c.b);
}
function buildCustomTheme(hex) {
  const lum = relLuminance(hex);
  const isLight = lum > 0.62;
  let vars = {};
  if (isLight) {
    vars['--c-bg-deep'] = mix(hex, '#ffffff', 0.10);
    vars['--c-bg-mid'] = mix(hex, '#ffffff', 0.06);
    vars['--c-bg-glow'] = '#ffffff';
    vars['--c-text'] = '#15131f';
    vars['--c-text-dim'] = 'rgba(21,19,31,0.62)';
    vars['--c-text-faint'] = 'rgba(21,19,31,0.38)';
    vars['--c-glass-bg'] = 'rgba(255,255,255,0.55)';
    vars['--c-glass-border'] = 'rgba(21,19,31,0.10)';
    vars['--c-surface'] = 'rgba(21,19,31,0.045)';
    vars['--c-surface-hover'] = 'rgba(21,19,31,0.085)';
    vars['--c-accent-strong'] = mix(hex, '#000000', 0.62);
    vars['--c-accent'] = mix(hex, '#000000', 0.80);
    vars['--c-accent-soft'] = rgba(vars['--c-accent-strong'], 0.16);
    vars['--c-accent-line'] = rgba(vars['--c-accent-strong'], 0.24);
    vars['--nebula-1'] = mix(hex, '#ffffff', 0.55);
    vars['--nebula-2'] = mix(hex, '#ffffff', 0.35);
    vars['--nebula-3'] = mix(hex, '#ffffff', 0.65);
    vars['--comet-color'] = vars['--c-accent-strong'];
  } else {
    vars['--c-bg-deep'] = mix(hex, '#000000', 0.10);
    vars['--c-bg-mid'] = mix(hex, '#000000', 0.16);
    vars['--c-bg-glow'] = mix(hex, '#000000', 0.28);
    vars['--c-text'] = '#ffffff';
    vars['--c-text-dim'] = 'rgba(226,222,240,0.6)';
    vars['--c-text-faint'] = 'rgba(226,222,240,0.35)';
    vars['--c-glass-bg'] = rgba(hex, 0.05);
    vars['--c-glass-border'] = rgba(mix(hex, '#ffffff', 0.6), 0.18);
    vars['--c-surface'] = 'rgba(255,255,255,0.04)';
    vars['--c-surface-hover'] = 'rgba(255,255,255,0.08)';
    vars['--c-accent'] = mix(hex, '#ffffff', 0.72);
    vars['--c-accent-strong'] = hex;
    vars['--c-accent-soft'] = rgba(vars['--c-accent'], 0.25);
    vars['--c-accent-line'] = rgba(vars['--c-accent'], 0.28);
    vars['--nebula-1'] = mix(hex, '#000000', 0.65);
    vars['--nebula-2'] = mix(hex, '#000000', 0.5);
    vars['--nebula-3'] = mix(hex, '#000000', 0.35);
    vars['--comet-color'] = vars['--c-accent'];
  }
  return vars;
}
function clearCustomInlineVars() {
  const keys = [
    '--c-bg-deep', '--c-bg-mid', '--c-bg-glow', '--c-text', '--c-text-dim', '--c-text-faint',
    '--c-glass-bg', '--c-glass-border', '--c-surface', '--c-surface-hover',
    '--c-accent', '--c-accent-strong', '--c-accent-soft', '--c-accent-line',
    '--nebula-1', '--nebula-2', '--nebula-3', '--comet-color'
  ];
  keys.forEach((k) => document.documentElement.style.removeProperty(k));
}
function setActiveTheme(theme) {
  if (theme !== 'custom') clearCustomInlineVars();
  document.body.setAttribute('data-theme', theme);
  document.querySelectorAll('.island-dot').forEach((d) => {
    d.classList.toggle('active', d.getAttribute('data-set') === theme);
  });
  try { localStorage.setItem('theme', theme); } catch (e) {}
}
function applyCustomColor(hex) {
  const vars = buildCustomTheme(hex);
  Object.keys(vars).forEach((k) => document.documentElement.style.setProperty(k, vars[k]));
  document.getElementById('customDot').style.display = 'inline-block';
  document.getElementById('customSep').style.display = 'block';
  setActiveTheme('custom');
  try { localStorage.setItem('customColor', hex); } catch (e) {}
}
document.querySelectorAll('.island-dot[data-set]').forEach((d) => {
  d.addEventListener('click', () => {
    const theme = d.getAttribute('data-set');
    if (theme === 'custom') {
      const saved = localStorage.getItem('customColor') || document.getElementById('customColorInput').value;
      applyCustomColor(saved);
      return;
    }
    setActiveTheme(theme);
    d.animate(
      [{ transform: 'scale(1.12)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1.12)' }],
      { duration: 500, easing: 'cubic-bezier(0.34,1.56,0.64,1)' }
    );
  });
});
document.getElementById('customColorInput').addEventListener('input', (e) => applyCustomColor(e.target.value));
try {
  const savedColor = localStorage.getItem('customColor');
  const saved = localStorage.getItem('theme');
  if (savedColor) {
    document.getElementById('customColorInput').value = savedColor;
    document.getElementById('customDot').style.display = 'inline-block';
    document.getElementById('customSep').style.display = 'block';
    if (saved === 'custom') applyCustomColor(savedColor);
  }
  if (saved && saved !== 'custom') setActiveTheme(saved);
} catch (e) {}

/* НАВИГАЦИЯ */
function go(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('.rail-link[data-nav],.rail-logo[data-nav]').forEach((el) => {
  el.addEventListener('click', () => {
    const t = el.getAttribute('data-nav');
    if (t === 'hero') scrollTop();
    else go(t);
  });
});
function updateActiveRail() {
  const sections = ['hero', 'projects', 'about'];
  const scrollY = window.scrollY + window.innerHeight * 0.4;
  let active = 'hero';
  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el && el.offsetTop <= scrollY) active = id;
  });
  document.querySelectorAll('.rail-link[data-nav]').forEach((l) => {
    l.classList.toggle('active', l.getAttribute('data-nav') === active);
  });
}
window.addEventListener('scroll', updateActiveRail, { passive: true });
updateActiveRail();

/* КАРТОЧКИ */
function rowGlow(e, el) {
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width) * 100 + '%');
  el.style.setProperty('--my', ((e.clientY - rect.top) / rect.height) * 100 + '%');
}
function openProject(el) {
  goWarp(window.event, 'https://t.me/linksys_robot');
}

/* КЛИК-ЭФФЕКТ */
document.addEventListener('click', (e) => {
  if (e.target.closest('.project-row,.rail-link,.rail-logo,.btn-morph,.warp,.island,.about-card,.cube-scene,.cube-window,.cw-dot,.cw-visitors,.face-visitors,.or-close')) return;
  const burst = document.createElement('div');
  burst.className = 'burst';
  burst.style.left = e.clientX + 'px';
  burst.style.top = e.clientY + 'px';
  const flash = document.createElement('div');
  flash.className = 'burst-flash';
  burst.appendChild(flash);
  [280, 200, 140].forEach((s, i) => {
    const r = document.createElement('div');
    r.className = 'burst-ring';
    r.style.width = s + 'px';
    r.style.height = s + 'px';
    r.style.animationDelay = (i * 0.06) + 's';
    burst.appendChild(r);
  });
  for (let i = 0; i < 16; i++) {
    const sh = document.createElement('div');
    sh.className = 'burst-shard';
    sh.style.setProperty('--angle', (360 / 16 * i) + 'deg');
    sh.style.setProperty('--dist', (90 + Math.random() * 70) + 'px');
    sh.style.animationDelay = (Math.random() * 0.1) + 's';
    burst.appendChild(sh);
  }
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1400);
});

/* WARP */
let isWarping = false;
function goWarp(e, url) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (isWarping) return;
  isWarping = true;
  const warp = document.getElementById('warp');
  const flash = document.getElementById('warpFlash');
  warp.style.setProperty('--warp-color', '#29b6f6');
  flash.classList.remove('on');
  void flash.offsetWidth;
  flash.classList.add('on');
  warp.classList.add('active');
  setTimeout(() => {
    window.location.href = url;
  }, 1800);
  setTimeout(() => {
    warp.classList.remove('active');
    isWarping = false;
  }, 3000);
}
window.addEventListener('pageshow', () => {
  document.getElementById('warp').classList.remove('active');
  isWarping = false;
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    setTimeout(() => {
      document.getElementById('warp').classList.remove('active');
      isWarping = false;
    }, 300);
  }
});

/* КОСМОС */
function createTwinkles() {
  const s = document.querySelector('.stars-parallax');
  const c = window.innerWidth < 500 ? 22 : 60;
  for (let i = 0; i < c; i++) {
    const st = document.createElement('div');
    st.className = 'twinkle';
    const sz = 1 + Math.random() * 2.5;
    st.style.width = sz + 'px';
    st.style.height = sz + 'px';
    st.style.left = Math.random() * 100 + '%';
    st.style.top = Math.random() * 100 + '%';
    st.style.animationDelay = (Math.random() * 3) + 's';
    st.style.animationDuration = (2 + Math.random() * 3) + 's';
    s.appendChild(st);
  }
}
function createMotes() {
  const s = document.querySelector('.stars-parallax');
  const c = window.innerWidth < 500 ? 20 : 45;
  for (let i = 0; i < c; i++) {
    const m = document.createElement('div');
    m.className = 'mote';
    const sz = 2 + Math.random() * 3;
    m.style.width = sz + 'px';
    m.style.height = sz + 'px';
    m.style.left = (20 + Math.random() * 60) + '%';
    m.style.top = (20 + Math.random() * 60) + '%';
    m.style.setProperty('--dx', ((Math.random() - 0.5) * 300) + 'px');
    m.style.setProperty('--dy', ((Math.random() - 0.5) * 300) + 'px');
    const d = 20 + Math.random() * 25;
    m.style.animationDuration = d + 's';
    m.style.animationDelay = (-Math.random() * d) + 's';
    s.appendChild(m);
  }
}
function createShootingStar() {
  const s = document.querySelector('.stars-parallax');
  const st = document.createElement('div');
  st.className = 'shooting';
  const sx = Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.3;
  const sy = Math.random() * window.innerHeight * 0.5;
  st.style.left = sx + 'px';
  st.style.top = sy + 'px';
  st.style.transform = 'rotate(-30deg)';
  s.appendChild(st);
  const dur = 1200 + Math.random() * 800;
  const dist = 500 + Math.random() * 400;
  st.animate(
    [
      { transform: 'translate(0,0) rotate(-30deg)', opacity: 0 },
      { transform: `translate(${-dist * 0.3}px, ${dist * 0.15}px) rotate(-30deg)`, opacity: 1, offset: 0.15 },
      { transform: `translate(${-dist}px, ${dist * 0.5}px) rotate(-30deg)`, opacity: 0 }
    ],
    { duration: dur, easing: 'ease-out' }
  ).onfinish = () => st.remove();
}
function scheduleShootingStar() {
  const b = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < b; i++) {
    setTimeout(createShootingStar, i * 200);
  }
  setTimeout(scheduleShootingStar, 1400 + Math.random() * 2400);
}
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('in');
          }, i * 120);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -80px 0px' }
  );
  els.forEach((el) => obs.observe(el));
}
window.addEventListener('load', () => {
  createTwinkles();
  createMotes();
  setTimeout(scheduleShootingStar, 1000);
  initScrollReveal();
});