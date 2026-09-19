/* КУРСОР */
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.left = mx + 'px'; dot.style.top = my + 'px';
});
(function animCursor() {
  rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
  ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
  requestAnimationFrame(animCursor);
})();
const HOVER_SEL = 'a,button,.project-row,.rail-link,.rail-logo,.btn-morph,.island-dot,.island-add,.island-trigger,.about-card,.cube-scene,.cw-dot,.cw-visitors,.face-visitors,.virus-window';
document.addEventListener('mouseover', e => {
  if (e.target.closest(HOVER_SEL)) { ring.classList.add('hover'); dot.style.width = dot.style.height = '12px'; }
});
document.addEventListener('mouseout', e => {
  if (e.target.closest(HOVER_SEL)) { ring.classList.remove('hover'); dot.style.width = dot.style.height = '8px'; }
});

/* СЧЁТЧИК ПОСЕЩЕНИЙ (+1 за каждое обновление) */
(function initVisitors() {
  let n = 0;
  try {
    n = parseInt(localStorage.getItem('inky_visits') || '0', 10);
    if (isNaN(n) || n < 0) n = 0;
    n += 1;
    localStorage.setItem('inky_visits', String(n));
  } catch (e) { n = 1; }
  document.querySelectorAll('[data-visitors]').forEach(el => { el.textContent = n.toLocaleString('ru-RU'); });
})();

/* ПАРАЛЛАКС ЗВЁЗД */
const starsParallax = document.getElementById('starsParallax');
let tMX = 0, tMY = 0, cMX = 0, cMY = 0;
addEventListener('mousemove', e => {
  tMX = (e.clientX / innerWidth - 0.5) * 2;
  tMY = (e.clientY / innerHeight - 0.5) * 2;
});
(function animParallax() {
  cMX += (tMX - cMX) * 0.05; cMY += (tMY - cMY) * 0.05;
  starsParallax.style.transform = `translate(${cMX * 20}px, ${cMY * 20}px)`;
  requestAnimationFrame(animParallax);
})();
addEventListener('mouseleave', () => { tMX = 0; tMY = 0; });

/* КУБ + УДЕРЖАНИЕ 10с */
let hackActive = false;
const HOLD_TIME = 10;
const CUBE_CIRC = 2 * Math.PI * 92;

(function initCube() {
  const scene = document.getElementById('cubeScene');
  const stage = document.getElementById('cubeStage');
  const cube  = document.getElementById('cube');
  const overlay = document.getElementById('chargeOverlay');
  const fill = document.getElementById('chargeFill');
  const count = document.getElementById('chargeCount');
  if (!scene || !cube) return;

  let rotX = -14, rotY = 0, velX = 0, velY = 0;
  let dragging = false, lastX = 0, lastY = 0, idle = 0;
  let holdStart = 0, holdTick = null, fired = false;
  const AUTO = 0.25, BASE = -14, FRICTION = 0.94, IDLE_DELAY = 60;

  const apply = () => { cube.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`; };
  apply();

  (function loop() {
    if (!dragging && !hackActive) {
      if (Math.abs(velX) > 0.01 || Math.abs(velY) > 0.01) {
        rotY += velX; rotX += velY;
        velX *= FRICTION; velY *= FRICTION;
        rotX = Math.max(-70, Math.min(70, rotX));
        idle = 0; apply();
      } else {
        velX = velY = 0; idle++;
        if (idle > IDLE_DELAY) {
          rotY += AUTO;
          rotX += (BASE - rotX) * 0.03;
          apply();
        }
      }
    }
    requestAnimationFrame(loop);
  })();

  function updateCharge(progress) {
    const remain = Math.max(0, HOLD_TIME * (1 - progress));
    count.textContent = remain.toFixed(1);
    fill.style.strokeDashoffset = CUBE_CIRC * (1 - progress);
  }

  function startHold() {
    if (hackActive || fired) return;
    holdStart = performance.now();
    overlay.classList.add('charging');
    stage.classList.add('charging');
    updateCharge(0);
    holdTick = setInterval(() => {
      const elapsed = (performance.now() - holdStart) / 1000;
      const p = Math.min(elapsed / HOLD_TIME, 1);
      updateCharge(p);
      if (p >= 1) {
        clearInterval(holdTick); holdTick = null;
        fired = true;
        overlay.classList.remove('charging');
        stage.classList.remove('charging');
        startHack();
      }
    }, 60);
  }

  function cancelHold() {
    if (holdTick) { clearInterval(holdTick); holdTick = null; }
    overlay.classList.remove('charging');
    stage.classList.remove('charging');
    if (!fired) updateCharge(0);
  }

  function startDrag(e) {
    if (hackActive) return;
    dragging = true;
    scene.classList.add('dragging');
    stage.classList.add('dragging');
    const p = e.touches ? e.touches[0] : e;
    lastX = p.clientX; lastY = p.clientY;
    velX = velY = 0; idle = 0;
    startHold();
  }
  function moveDrag(e) {
    if (!dragging) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - lastX;
    const dy = p.clientY - lastY;
    const k = 0.5;
    rotY += dx * k;
    rotX = Math.max(-70, Math.min(70, rotX - dy * k));
    velX = dx * k; velY = -dy * k;
    lastX = p.clientX; lastY = p.clientY;
    apply();
    if (e.cancelable && e.type === 'touchmove') e.preventDefault();
  }
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    scene.classList.remove('dragging');
    stage.classList.remove('dragging');
    idle = 0;
    if (!fired) cancelHold();
  }

  scene.addEventListener('mousedown', startDrag);
  addEventListener('mousemove', moveDrag);
  addEventListener('mouseup', endDrag);
  scene.addEventListener('touchstart', startDrag, { passive: true });
  addEventListener('touchmove', moveDrag, { passive: false });
  addEventListener('touchend', endDrag);
  addEventListener('touchcancel', endDrag);

  window.__resetCubeFired = () => { fired = false; updateCharge(0); };
})();

/* DYNAMIC ISLAND */
const island = document.getElementById('island');
document.getElementById('islandTrigger').addEventListener('click', e => {
  e.stopPropagation(); island.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (!e.target.closest('.island')) island.classList.remove('open');
});

/* ТЕМЫ */
const hexToRgb = h => { h = h.replace('#',''); if (h.length === 3) h = h.split('').map(c=>c+c).join(''); return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) }; };
const rgbToHex = (r,g,b) => '#' + [r,g,b].map(v => Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
const mix = (a,b,w) => { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.r*w+B.r*(1-w), A.g*w+B.g*(1-w), A.b*w+B.b*(1-w)); };
const rgba = (h,a) => { const c = hexToRgb(h); return `rgba(${c.r},${c.g},${c.b},${a})`; };
const relLum = h => { const c = hexToRgb(h); const ch = v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*ch(c.r)+0.7152*ch(c.g)+0.0722*ch(c.b); };
function buildCustomTheme(hex) {
  const light = relLum(hex) > 0.62; const v = {};
  if (light) {
    v['--c-bg-deep']=mix(hex,'#fff',0.10); v['--c-bg-mid']=mix(hex,'#fff',0.06); v['--c-bg-glow']='#fff';
    v['--c-text']='#15131f'; v['--c-text-dim']='rgba(21,19,31,0.62)'; v['--c-text-faint']='rgba(21,19,31,0.38)';
    v['--c-glass-bg']='rgba(255,255,255,0.55)'; v['--c-glass-border']='rgba(21,19,31,0.10)';
    v['--c-surface']='rgba(21,19,31,0.045)'; v['--c-surface-hover']='rgba(21,19,31,0.085)';
    v['--c-accent-strong']=mix(hex,'#000',0.62); v['--c-accent']=mix(hex,'#000',0.80);
    v['--c-accent-soft']=rgba(v['--c-accent-strong'],0.16); v['--c-accent-line']=rgba(v['--c-accent-strong'],0.24);
    v['--nebula-1']=mix(hex,'#fff',0.55); v['--nebula-2']=mix(hex,'#fff',0.35); v['--nebula-3']=mix(hex,'#fff',0.65);
    v['--comet-color']=v['--c-accent-strong'];
  } else {
    v['--c-bg-deep']=mix(hex,'#000',0.10); v['--c-bg-mid']=mix(hex,'#000',0.16); v['--c-bg-glow']=mix(hex,'#000',0.28);
    v['--c-text']='#fff'; v['--c-text-dim']='rgba(226,222,240,0.6)'; v['--c-text-faint']='rgba(226,222,240,0.35)';
    v['--c-glass-bg']=rgba(hex,0.05); v['--c-glass-border']=rgba(mix(hex,'#fff',0.6),0.18);
    v['--c-surface']='rgba(255,255,255,0.04)'; v['--c-surface-hover']='rgba(255,255,255,0.08)';
    v['--c-accent']=mix(hex,'#fff',0.72); v['--c-accent-strong']=hex;
    v['--c-accent-soft']=rgba(v['--c-accent'],0.25); v['--c-accent-line']=rgba(v['--c-accent'],0.28);
    v['--nebula-1']=mix(hex,'#000',0.65); v['--nebula-2']=mix(hex,'#000',0.5); v['--nebula-3']=mix(hex,'#000',0.35);
    v['--comet-color']=v['--c-accent'];
  }
  return v;
}
const CUSTOM_KEYS = ['--c-bg-deep','--c-bg-mid','--c-bg-glow','--c-text','--c-text-dim','--c-text-faint','--c-glass-bg','--c-glass-border','--c-surface','--c-surface-hover','--c-accent','--c-accent-strong','--c-accent-soft','--c-accent-line','--nebula-1','--nebula-2','--nebula-3','--comet-color'];
const clearCustom = () => CUSTOM_KEYS.forEach(k => document.documentElement.style.removeProperty(k));
function setTheme(t) {
  if (t !== 'custom') clearCustom();
  document.body.setAttribute('data-theme', t);
  document.querySelectorAll('.island-dot').forEach(d => d.classList.toggle('active', d.dataset.set === t));
  try { localStorage.setItem('theme', t); } catch(e){}
}
function applyCustom(hex) {
  const v = buildCustomTheme(hex);
  Object.entries(v).forEach(([k,val]) => document.documentElement.style.setProperty(k,val));
  document.getElementById('customDot').style.display = 'inline-block';
  document.getElementById('customSep').style.display = 'block';
  setTheme('custom');
  try { localStorage.setItem('customColor', hex); } catch(e){}
}
document.querySelectorAll('.island-dot[data-set]').forEach(d => {
  d.addEventListener('click', () => {
    const t = d.dataset.set;
    if (t === 'custom') { applyCustom(localStorage.getItem('customColor') || document.getElementById('customColorInput').value); return; }
    setTheme(t);
    d.animate([{transform:'scale(1.12)'},{transform:'scale(1.4)'},{transform:'scale(1.12)'}], {duration:500, easing:'cubic-bezier(0.34,1.56,0.64,1)'});
  });
});
document.getElementById('customColorInput').addEventListener('input', e => applyCustom(e.target.value));
try {
  const sc = localStorage.getItem('customColor');
  const st = localStorage.getItem('theme');
  if (sc) { document.getElementById('customColorInput').value = sc; document.getElementById('customDot').style.display='inline-block'; document.getElementById('customSep').style.display='block'; if (st === 'custom') applyCustom(sc); }
  if (st && st !== 'custom') setTheme(st);
} catch(e){}

/* НАВИГАЦИЯ */
function go(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior:'smooth', block:'start' }); }
function scrollTop() { scrollTo({ top: 0, behavior: 'smooth' }); }
document.querySelectorAll('.rail-link[data-nav],.rail-logo[data-nav]').forEach(el => {
  el.addEventListener('click', () => {
    const t = el.dataset.nav;
    if (t === 'hero') scrollTop(); else go(t);
  });
});
function updateActiveRail() {
  const secs = ['hero','projects','about'];
  const y = scrollY + innerHeight * 0.4;
  let active = 'hero';
  secs.forEach(id => { const el = document.getElementById(id); if (el && el.offsetTop <= y) active = id; });
  document.querySelectorAll('.rail-link[data-nav]').forEach(l => l.classList.toggle('active', l.dataset.nav === active));
}
addEventListener('scroll', updateActiveRail, { passive: true });
updateActiveRail();

/* КАРТОЧКИ */
function rowGlow(e, el) {
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
  el.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
}
window.rowGlow = rowGlow;

/* КЛИК-ЭФФЕКТ */
addEventListener('click', e => {
  if (e.target.closest('.project-row,.rail-link,.rail-logo,.btn-morph,.warp,.island,.about-card,.cube-scene,.cube-window,.cw-dot,.cw-visitors,.face-visitors,.virus-window,.hack-terminal,.crash-screen')) return;
  const b = document.createElement('div');
  b.className = 'burst';
  b.style.left = e.clientX + 'px'; b.style.top = e.clientY + 'px';
  const f = document.createElement('div'); f.className = 'burst-flash'; b.appendChild(f);
  [280,200,140].forEach((s,i) => {
    const r = document.createElement('div'); r.className = 'burst-ring';
    r.style.width = r.style.height = s + 'px';
    r.style.animationDelay = i * 0.06 + 's';
    b.appendChild(r);
  });
  for (let i = 0; i < 16; i++) {
    const sh = document.createElement('div'); sh.className = 'burst-shard';
    sh.style.setProperty('--angle', (360/16*i) + 'deg');
    sh.style.setProperty('--dist', (90 + Math.random()*70) + 'px');
    sh.style.animationDelay = Math.random() * 0.1 + 's';
    b.appendChild(sh);
  }
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 1400);
});

/* WARP */
let warping = false;
function goWarp(e, url) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (warping) return;
  warping = true;
  const warp = document.getElementById('warp');
  const flash = document.getElementById('warpFlash');
  warp.style.setProperty('--warp-color', '#29b6f6');
  flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
  warp.classList.add('active');
  setTimeout(() => { location.href = url; }, 1800);
  setTimeout(() => { warp.classList.remove('active'); warping = false; }, 3000);
}
window.goWarp = goWarp;
window.go = go;
addEventListener('pageshow', () => { document.getElementById('warp').classList.remove('active'); warping = false; });

/* КОСМОС */
function createTwinkles() {
  const s = document.querySelector('.stars-parallax');
  const c = innerWidth < 500 ? 22 : 60;
  for (let i = 0; i < c; i++) {
    const st = document.createElement('div'); st.className = 'twinkle';
    const sz = 1 + Math.random() * 2.5;
    st.style.width = st.style.height = sz + 'px';
    st.style.left = Math.random() * 100 + '%';
    st.style.top = Math.random() * 100 + '%';
    st.style.animationDelay = Math.random() * 3 + 's';
    st.style.animationDuration = (2 + Math.random() * 3) + 's';
    s.appendChild(st);
  }
}
function createMotes() {
  const s = document.querySelector('.stars-parallax');
  const c = innerWidth < 500 ? 20 : 45;
  for (let i = 0; i < c; i++) {
    const m = document.createElement('div'); m.className = 'mote';
    const sz = 2 + Math.random() * 3;
    m.style.width = m.style.height = sz + 'px';
    m.style.left = (20 + Math.random() * 60) + '%';
    m.style.top  = (20 + Math.random() * 60) + '%';
    m.style.setProperty('--dx', (Math.random() - 0.5) * 300 + 'px');
    m.style.setProperty('--dy', (Math.random() - 0.5) * 300 + 'px');
    const d = 20 + Math.random() * 25;
    m.style.animationDuration = d + 's';
    m.style.animationDelay = -Math.random() * d + 's';
    s.appendChild(m);
  }
}
function createShootingStar() {
  const s = document.querySelector('.stars-parallax');
  const st = document.createElement('div'); st.className = 'shooting';
  const sx = Math.random() * innerWidth * 0.8 + innerWidth * 0.3;
  const sy = Math.random() * innerHeight * 0.5;
  st.style.left = sx + 'px'; st.style.top = sy + 'px';
  st.style.transform = 'rotate(-30deg)';
  s.appendChild(st);
  const dist = 500 + Math.random() * 400;
  st.animate([
    { transform: 'translate(0,0) rotate(-30deg)', opacity: 0 },
    { transform: `translate(${-dist*0.3}px, ${dist*0.15}px) rotate(-30deg)`, opacity: 1, offset: 0.15 },
    { transform: `translate(${-dist}px, ${dist*0.5}px) rotate(-30deg)`, opacity: 0 }
  ], { duration: 1200 + Math.random() * 800, easing: 'ease-out' }).onfinish = () => st.remove();
}
function scheduleShootingStar() {
  const n = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i++) setTimeout(createShootingStar, i * 200);
  setTimeout(scheduleShootingStar, 1400 + Math.random() * 2400);
}
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach((en, i) => {
      if (en.isIntersecting) {
        setTimeout(() => en.target.classList.add('in'), i * 120);
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -80px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}
addEventListener('load', () => {
  createTwinkles(); createMotes();
  setTimeout(scheduleShootingStar, 1000);
  initReveal();
});

/* ХАК-СЦЕНАРИЙ */
const sleep = ms => new Promise(r => setTimeout(r, ms));

const HACK_LINES = [
  { text: '$ ./exploit.sh --target=inky://core --mode=full --verbose', delay: 320, typed: true },
  { text: '[*] Инициализация фреймворка v4.2.1', delay: 160 },
  { text: '[*] Загрузка ядерных модулей...', delay: 220 },
  { text: '[+] netfilter_bypass.ko ............. OK', delay: 90 },
  { text: '[+] memory_inject.ko ................ OK', delay: 90 },
  { text: '[+] kernel_rootkit.ko ............... OK', delay: 90 },
  { text: '[*] Сканирование целевой сети...', delay: 240 },
  { text: '[+] Открытые порты: 22/tcp  80/tcp  443/tcp', delay: 180 },
  { text: '[*] Брутфорс SSH-учёток (rockyou.txt)', delay: 260 },
  { text: '[+] Попытка 47/1000 ................. отказ', delay: 120 },
  { text: '[+] Попытка 312/1000 ................ отказ', delay: 120 },
  { text: '[+] Попытка 891/1000 ................ УСПЕХ', delay: 180 },
  { text: '[+] Пароль: ************', delay: 200 },
  { text: '[*] Подключение к цели...', delay: 220 },
  { text: '[+] SSH-сессия установлена', delay: 200 },
  { text: '[*] Эскалация привилегий (CVE-2024-1337)', delay: 260 },
  { text: '[+] Root-доступ получен', delay: 220 },
  { text: '[*] Запуск DDoS-атаки...', delay: 260 },
  { text: '[+] Отправка 1,048,576 пакетов/сек', delay: 200 },
  { text: '[+] Цель насыщена: 100% packet loss', delay: 200 },
  { text: '[*] Внедрение полезной нагрузки...', delay: 260 },
  { text: '[+] payload.exe ..................... выполнено', delay: 90 },
  { text: '[+] virus.dll ....................... выполнено', delay: 90 },
  { text: '[+] backdoor.exe .................... выполнено', delay: 90 },
  { text: '[*] Открытие бэкдоров...', delay: 260 },
  { text: '[+] Бэкдор на порту 1337 ............ активен', delay: 100 },
  { text: '[+] Бэкдор на порту 4444 ............ активен', delay: 100 },
  { text: '[+] Бэкдор на порту 5555 ............ активен', delay: 100 },
  { text: '[+] Бэкдор на порту 6666 ............ активен', delay: 100 },
  { text: '[+] Бэкдор на порту 7777 ............ активен', delay: 150 },
  { text: '[*] Похищение данных...', delay: 240 },
  { text: '[+] Утечка: 4.2 ГБ / 4.2 ГБ', delay: 260 },
  { text: '[*] Заметание следов...', delay: 240 },
  { text: '[+] Логи очищены', delay: 140 },
  { text: '[+] История bash очищена', delay: 140 },
  { text: '[+] Файлы удалены', delay: 180 },
  { text: '', delay: 260 },
  { text: '[✓] ROOT-ДОСТУП ПОЛУЧЕН', delay: 260 },
  { text: '[✓] СИСТЕМА СКОМПРОМЕТИРОВАНА', delay: 260 },
  { text: '[✓] ПОЛНЫЙ КОНТРОЛЬ ДОСТИГНУТ', delay: 340 },
  { text: '', delay: 200 },
  { text: '> Активация протокола распространения...', delay: 300, typed: true },
  { text: '> Запуск: virus.exe --spread', delay: 340, typed: true },
  { text: '> Статус: РАСПРОСТРАНЕНИЕ', delay: 260 }
];

const VIRUS_SPECS = [
  { type: 'bsod' }, { type: 'ransom' }, { type: 'alert' },
  { type: 'term' }, { type: 'progress' }, { type: 'skull' },
  { type: 'win95' }, { type: 'matrix' }, { type: 'trace' }
];

async function startHack() {
  if (hackActive) return;
  hackActive = true;

  document.body.classList.add('glitching');
  triggerBurst(innerWidth / 2, innerHeight / 2);
  await sleep(400);
  document.body.classList.remove('glitching');
  await sleep(150);

  const term = document.getElementById('hackTerminal');
  const body = document.getElementById('htBody');
  body.innerHTML = '';
  term.classList.add('active');
  await sleep(400);

  for (const line of HACK_LINES) {
    const div = document.createElement('div');
    div.className = 'ht-line';
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;

    if (line.typed && line.text) {
      for (let i = 0; i < line.text.length; i++) {
        div.textContent += line.text[i];
        body.scrollTop = body.scrollHeight;
        await sleep(14);
      }
    } else {
      div.textContent = line.text;
    }
    div.classList.add('done');
    await sleep(line.delay || 100);
  }

  await sleep(800);
  term.classList.remove('active');
  await sleep(200);
  spawnVirusWindows();
  await sleep(1800);
  showCrash();
}

function triggerBurst(x, y) {
  const b = document.createElement('div');
  b.className = 'burst';
  b.style.left = x + 'px'; b.style.top = y + 'px';
  const f = document.createElement('div'); f.className = 'burst-flash'; b.appendChild(f);
  [400, 280, 180].forEach((s, i) => {
    const r = document.createElement('div'); r.className = 'burst-ring';
    r.style.width = r.style.height = s + 'px';
    r.style.animationDelay = i * 0.08 + 's';
    b.appendChild(r);
  });
  for (let i = 0; i < 24; i++) {
    const sh = document.createElement('div'); sh.className = 'burst-shard';
    sh.style.setProperty('--angle', (360/24*i) + 'deg');
    sh.style.setProperty('--dist', (150 + Math.random()*120) + 'px');
    sh.style.animationDelay = Math.random() * 0.15 + 's';
    b.appendChild(sh);
  }
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 1600);
}

function spawnVirusWindows() {
  const layer = document.getElementById('virusLayer');
  const spots = [
    { x: 4,  y: 6  }, { x: 52, y: 4  }, { x: 24, y: 32 },
    { x: 60, y: 34 }, { x: 8,  y: 58 }, { x: 46, y: 60 },
    { x: 28, y: 16 }, { x: 62, y: 66 }, { x: 14, y: 40 }
  ];
  VIRUS_SPECS.forEach((spec, i) => {
    setTimeout(() => {
      const w = createVirusWindow(spec, spots[i] || { x: 20 + Math.random()*50, y: 10 + Math.random()*60 });
      layer.appendChild(w);
    }, i * 170);
  });
}

function createVirusWindow(spec, pos) {
  const el = document.createElement('div');
  el.className = 'virus-window ' + spec.type;
  el.style.left = pos.x + '%';
  el.style.top  = pos.y + '%';

  const bar = (title, color) => `
    <div class="vw-bar">
      <span class="vw-dot" style="background:${color}"></span>
      <span class="vw-dot" style="background:${color};opacity:.6"></span>
      <span class="vw-dot" style="background:${color};opacity:.3"></span>
      <span class="vw-title">${title}</span>
      <span class="vw-x">✕</span>
    </div>`;

  let html = '';
  switch (spec.type) {
    case 'bsod':
      html = bar('SYSTEM_FAILURE', '#fff') + `
        <div class="vw-body">
          <div class="vw-face">:(</div>
          <div style="font-size:.85rem;font-weight:600;margin-bottom:8px;">На вашем устройстве возникла проблема, и его необходимо перезагрузить.</div>
          <div style="font-size:.68rem;opacity:.7;margin-top:10px;">STOP CODE: 0x00000DEAD<br>kernel_rootkit.sys · SYSTEM_SERVICE_EXCEPTION</div>
          <div style="font-size:.65rem;margin-top:12px;opacity:.6;">Прогресс: 47% завершено</div>
        </div>`;
      break;
    case 'ransom':
      html = bar('RANSOMWARE_LOCK', '#ff2b2b') + `
        <div class="vw-body">
          <div style="text-align:center;font-weight:700;font-size:.9rem;">🔒 ВАШИ ФАЙЛЫ ЗАШИФРОВАНЫ</div>
          <div style="text-align:center;font-size:.7rem;opacity:.8;margin-top:6px;">Все документы, фото и базы данных зашифрованы алгоритмом AES-256.</div>
          <div class="vw-countdown" id="ransomCd">09:59</div>
          <div style="text-align:center;font-size:.68rem;">Осталось времени до удаления ключа</div>
          <div class="vw-warn">Отправьте 0.5 BTC на адрес:<br><b>bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</b></div>
        </div>`;
      break;
    case 'alert':
      html = bar('Security Alert', '#febc2e') + `
        <div class="vw-body">
          <div class="vw-icon">⚠</div>
          <div style="font-weight:600;font-size:.85rem;">Обнаружена подозрительная активность</div>
          <div style="font-size:.72rem;opacity:.75;margin-top:8px;">Внешнее подключение с IP <b>185.220.101.42</b> пытается получить доступ к системным файлам.</div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;">
            <span style="background:#febc2e;color:#000;padding:6px 16px;border-radius:100px;font-size:.7rem;font-weight:600;">Разрешить</span>
            <span style="background:rgba(255,255,255,.1);color:#fff;padding:6px 16px;border-radius:100px;font-size:.7rem;font-weight:600;">Запретить</span>
          </div>
        </div>`;
      break;
    case 'term':
      html = bar('root@target:~#', '#00ff66') + `
        <div class="vw-body">
          <div>$ sudo rm -rf /*</div>
          <div style="opacity:.8;">[sudo] password for root: ******</div>
          <div style="opacity:.8;">Удаление: /usr/bin ......... OK</div>
          <div style="opacity:.8;">Удаление: /etc/passwd ...... OK</div>
          <div style="opacity:.8;">Удаление: /var/log ......... OK</div>
          <div style="opacity:.8;">Форматирование: /dev/sda1 .. OK</div>
          <div style="color:#ff5b5b;margin-top:6px;">[!] КРИТИЧЕСКАЯ ОШИБКА — СИСТЕМА ПОВРЕЖДЕНА</div>
          <div>$ _<span style="animation:caretBlink .8s steps(2) infinite;">▋</span></div>
        </div>`;
      break;
    case 'progress':
      html = bar('Загрузка вируса...', '#4a9eff') + `
        <div class="vw-body">
          <div style="font-size:.8rem;font-weight:600;">Установка payload_v4.exe</div>
          <div style="font-size:.68rem;opacity:.7;margin-top:4px;">Файл 1 из 3</div>
          <div class="vw-bar-track"><div class="vw-bar-fill" style="width:0%"></div></div>
          <div class="vw-bar-label"><span id="vpFile">init.exe</span><span id="vpPct">0%</span></div>
          <div style="font-size:.65rem;opacity:.5;margin-top:10px;">Не выключайте устройство...</div>
        </div>`;
      break;
    case 'skull':
      html = bar('ACCESS DENIED', '#7d5fff') + `
        <div class="vw-body">
          <div class="vw-skull">☠</div>
          <div style="font-weight:700;font-size:.9rem;color:#7d5fff;">ДОСТУП ЗАПРЕЩЁН</div>
          <div style="font-size:.7rem;opacity:.7;margin-top:8px;">Ваш IP заблокирован администратором</div>
          <div style="font-size:.62rem;opacity:.5;margin-top:6px;">IP: 185.220.101.42 · PORT: 443</div>
        </div>`;
      break;
    case 'win95':
      html = bar('Ошибка', '#c0c0c0') + `
        <div class="vw-body">
          <div class="vw-w95-icon">❌</div>
          <div>
            <div style="font-weight:700;margin-bottom:6px;">Программа выполнила недопустимую операцию и будет закрыта.</div>
            <div style="font-size:.68rem;">Если проблема не исчезнет, обратитесь к разработчику программы.</div>
            <div class="vw-buttons"><span class="vw-btn">OK</span><span class="vw-btn">Отмена</span></div>
          </div>
        </div>`;
      break;
    case 'matrix':
      html = bar('TRACE_ROUTE', '#00ff66') + `
        <canvas class="vw-canvas"></canvas>
        <div class="vw-body">
          <div>TRACING ROUTE TO 185.220.101.42</div>
          <div style="opacity:.8;margin-top:6px;">1  192.168.1.1        1ms</div>
          <div style="opacity:.8;">2  10.0.0.1           4ms</div>
          <div style="opacity:.8;">3  172.16.0.1         12ms</div>
          <div style="opacity:.8;">4  185.220.101.42     ***</div>
          <div style="color:#ff5b5b;margin-top:6px;">[!] СОЕДИНЕНИЕ УСТАНОВЛЕНО</div>
        </div>`;
      break;
    case 'trace':
      html = bar('IP_TRACE', '#b060ff') + `
        <div class="vw-body">
          <div style="font-weight:600;font-size:.8rem;margin-bottom:8px;">Трассировка соединения</div>
          <div class="vw-trace-row"><span>IP адрес:</span><span>185.220.101.42</span></div>
          <div class="vw-trace-row"><span>Страна:</span><span>🇳🇱 Нидерланды</span></div>
          <div class="vw-trace-row"><span>Провайдер:</span><span>Tor Exit Node</span></div>
          <div class="vw-trace-row"><span>Порт:</span><span>443 (HTTPS)</span></div>
          <div class="vw-trace-row"><span>Статус:</span><span style="color:#ff5b5b;">ВЗЛОМ</span></div>
          <div style="font-size:.65rem;opacity:.6;margin-top:10px;">Логирование отключено. Следы заметены.</div>
        </div>`;
      break;
  }
  el.innerHTML = html;

  if (spec.type === 'ransom') {
    let t = 599;
    const el2 = el.querySelector('#ransomCd');
    const iv = setInterval(() => {
      t--; if (t < 0) { clearInterval(iv); return; }
      const m = String(Math.floor(t / 60)).padStart(2, '0');
      const s = String(t % 60).padStart(2, '0');
      if (el2) el2.textContent = m + ':' + s;
    }, 1000);
    el._interval = iv;
  }
  if (spec.type === 'progress') {
    const fill = el.querySelector('.vw-bar-fill');
    const pct = el.querySelector('#vpPct');
    const file = el.querySelector('#vpFile');
    let p = 0;
    const files = ['init.exe','payload.dll','virus.sys','kernel_rt.ko','backdoor.exe'];
    const iv = setInterval(() => {
      p += Math.random() * 8 + 2;
      if (p > 100) { p = 100; clearInterval(iv); }
      fill.style.width = p + '%';
      pct.textContent = Math.floor(p) + '%';
      file.textContent = files[Math.min(files.length - 1, Math.floor(p / 25))];
    }, 250);
    el._interval = iv;
  }
  if (spec.type === 'matrix') {
    const cv = el.querySelector('.vw-canvas');
    cv.width = 340; cv.height = 220;
    const ctx = cv.getContext('2d');
    const chars = '01アイウエオカキクケコサシスセソ'.split('');
    const drops = Array(Math.floor(cv.width / 12)).fill(1);
    const iv = setInterval(() => {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = '#00ff66';
      ctx.font = '12px monospace';
      for (let i = 0; i < drops.length; i++) {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 12, drops[i] * 12);
        if (drops[i] * 12 > cv.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }, 60);
    el._interval = iv;
  }

  return el;
}

function showCrash() {
  const screen = document.getElementById('crashScreen');
  const bar = document.getElementById('crashBar');
  const status = document.getElementById('crashStatus');
  screen.classList.add('active');

  const DURATION = 10;
  const start = performance.now();

  function tick() {
    const t = Math.min((performance.now() - start) / 1000, DURATION);
    const p = t / DURATION;
    bar.style.width = (p * 100) + '%';
    const remain = Math.max(0, Math.ceil(DURATION - t));
    status.textContent = `Сбой ядра · восстановление через ${remain}с`;
    if (t < DURATION) requestAnimationFrame(tick);
    else restoreSite();
  }
  requestAnimationFrame(tick);
}

function restoreSite() {
  document.getElementById('crashScreen').classList.remove('active');
  document.querySelectorAll('.virus-window').forEach(w => {
    if (w._interval) clearInterval(w._interval);
    w.classList.add('closing');
    setTimeout(() => w.remove(), 400);
  });
  const overlay = document.getElementById('chargeOverlay');
  const stage = document.getElementById('cubeStage');
  overlay.classList.remove('charging');
  stage.classList.remove('charging');
  const fill = document.getElementById('chargeFill');
  const count = document.getElementById('chargeCount');
  if (fill) fill.style.strokeDashoffset = CUBE_CIRC;
  if (count) count.textContent = '10.0';
  hackActive = false;
  if (typeof window.__resetCubeFired === 'function') window.__resetCubeFired();
}
