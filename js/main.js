/* ===========================
   SEEDIGITAL – MAIN JAVASCRIPT
   =========================== */

// ---- Navbar scroll effect ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
});

// ---- Active nav link highlight ----
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
function updateActiveLink() {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 120) current = s.getAttribute('id'); });
  navLinks.forEach(l => { l.classList.remove('active'); if (l.getAttribute('href') === '#' + current) l.classList.add('active'); });
}
window.addEventListener('scroll', updateActiveLink);
updateActiveLink();

// ---- Mobile nav toggle ----
const navToggle  = document.getElementById('nav-toggle');
const navLinksEl = document.getElementById('nav-links');
navToggle.addEventListener('click', () => { navLinksEl.classList.toggle('open'); navToggle.classList.toggle('open'); });
navLinksEl.querySelectorAll('a').forEach(l => l.addEventListener('click', () => { navLinksEl.classList.remove('open'); navToggle.classList.remove('open'); }));

// ---- Scroll fade-in ----
const fadeEls = document.querySelectorAll('.fade-in');
const fadeObs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), 60 * i); fadeObs.unobserve(e.target); } });
}, { threshold: 0.12 });
fadeEls.forEach(el => fadeObs.observe(el));



// ---- Counter animation ----
function animateCounter(el, target) {
  const isPct = el.textContent.includes('%'), hasPlus = el.textContent.includes('+');
  let v = 0; const step = target / (1800 / 16);
  const ti = setInterval(() => { v += step; if (v >= target) { v = target; clearInterval(ti); } el.textContent = (hasPlus?'+':'') + Math.floor(v) + (isPct?'%':''); }, 16);
}
const statsObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.querySelectorAll('.stat-number').forEach(el => { const n = parseInt(el.textContent.replace(/[^0-9]/g,'')); if (!isNaN(n)) animateCounter(el, n); }); statsObs.unobserve(e.target); } });
}, { threshold: 0.5 });
const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObs.observe(heroStats);


// ============================================================
//  EARTH GLOBE + TELECOM ANIMATION
// ============================================================
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, cx, cy, GR;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    cx = W / 2; cy = H / 2;
    GR = Math.min(W, H) * 0.38;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── LOAD EARTH NIGHT TEXTURE ───────────────────────────── */
  const earthImg = new Image();
  earthImg.src = 'images/earth_night.png';
  let earthReady = false;
  earthImg.onload = () => { earthReady = true; };

  /* ── AURORA COLOUR PALETTE ──────────────────────────────── */
  const PAL = [
    [0,  230, 210],  // teal
    [0,  255, 255],  // cyan
    [57, 255, 186],  // green
    [130, 60, 240],  // violet
    [180, 80, 255],  // purple
    [40, 140, 255],  // blue
  ];

  function auroraColor(t, offset = 0, alpha = 1) {
    const cycle = ((t * 0.000022 + offset) % 1 + 1) % 1;
    const idx = cycle * (PAL.length - 1);
    const lo = Math.floor(idx), hi = Math.min(lo + 1, PAL.length - 1);
    const f = idx - lo;
    const r = PAL[lo][0]*(1-f) + PAL[hi][0]*f;
    const g = PAL[lo][1]*(1-f) + PAL[hi][1]*f;
    const b = PAL[lo][2]*(1-f) + PAL[hi][2]*f;
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;
  }
  const WHITE = a => `rgba(220,255,250,${a})`;
  const DARK  = a => `rgba(4,10,24,${a})`;

  /* ── AURORA SHIMMER BACKGROUND ──────────────────────────── */
  function drawShimmer(t) {
    const a = 0.035 + 0.020 * Math.sin(t * 0.0003);
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.60);
    g.addColorStop(0,   auroraColor(t, 0.0, a));
    g.addColorStop(0.5, auroraColor(t, 0.3, a * 0.4));
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Aurora ribbon curtains
    for (let i = 0; i < 4; i++) {
      const yMid = H * (0.10 + i * 0.20);
      const amp  = 20 + i * 9;
      const bA   = 0.055 + 0.035 * Math.sin(t * 0.00025 + i * 1.1);
      const band = 30 + i * 14;
      const rg   = ctx.createLinearGradient(0, yMid - band, 0, yMid + band);
      rg.addColorStop(0,   'rgba(0,0,0,0)');
      rg.addColorStop(0.5, auroraColor(t, i * 0.25, bA));
      rg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.moveTo(0, yMid);
      for (let x = 0; x <= W; x += 8) {
        const y = yMid + Math.sin(x * 0.0022 + t * (0.00020 + i * 0.00007) + i * 1.4) * amp
                        + Math.sin(x * 0.0038 + t * 0.00014) * amp * 0.30;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, yMid + band * 2);
      ctx.lineTo(0, yMid + band * 2);
      ctx.closePath();
      ctx.fillStyle = rg;
      ctx.fill();
    }
  }

  /* ── SLOW RADAR RINGS ───────────────────────────────────── */
  const WAVE_COUNT = 5;
  const waves = Array.from({length: WAVE_COUNT}, (_, i) => ({ phase: i / WAVE_COUNT }));

  function drawRadar(t) {
    const maxR = Math.max(W, H) * 0.72;
    waves.forEach((w, wi) => {
      const prog = ((t * 0.000032 + w.phase) % 1);
      const r    = GR + prog * (maxR - GR);
      const op   = (1 - prog) * 0.38;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = auroraColor(t, wi / WAVE_COUNT, op);
      ctx.lineWidth   = 1.2;
      ctx.stroke();
      if (prog < 0.055) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = auroraColor(t, wi / WAVE_COUNT + 0.5, (0.055 - prog) * 9);
        ctx.lineWidth   = 2.5;
        ctx.stroke();
      }
    });
  }

  /* ── EARTH GLOBE ─────────────────────────────────────────── */
  function drawGlobe(t) {
    /* Rotation: image offset scrolls left slowly
       Full image width = 360° → offset in pixels from image width */

    // ① Atmosphere outer glow
    const atmos = ctx.createRadialGradient(cx, cy, GR * 0.90, cx, cy, GR * 1.35);
    atmos.addColorStop(0,   auroraColor(t, 0,    0.32));
    atmos.addColorStop(0.4, auroraColor(t, 0.20, 0.12));
    atmos.addColorStop(1,   auroraColor(t, 0.40, 0));
    ctx.beginPath();
    ctx.arc(cx, cy, GR * 1.35, 0, Math.PI * 2);
    ctx.fillStyle = atmos;
    ctx.fill();

    // ② Clip to globe circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, GR, 0, Math.PI * 2);
    ctx.clip();

    if (earthReady) {
      /* Cylindrical scrolling: we draw the map image twice side-by-side
         and offset by a fraction of image width to simulate slow rotation */
      const imgW  = earthImg.naturalWidth  || earthImg.width;
      const imgH  = earthImg.naturalHeight || earthImg.height;

      // Map image covers globe diameter × 2 in width, diameter in height
      const drawW = GR * 2 * 3.2;   // wide enough to scroll
      const drawH = GR * 2;
      const drawX = cx - GR;
      const drawY = cy - GR;

      // horizontal scroll: full image = 1 full rotation. Period ≈ 120s
      const scrollFrac = (t * 0.0000083) % 1;
      const scrollPx   = scrollFrac * drawW;

      // draw image twice so it wraps
      ctx.globalAlpha = 0.92;
      ctx.drawImage(earthImg, drawX - scrollPx,         drawY, drawW, drawH);
      ctx.drawImage(earthImg, drawX - scrollPx + drawW, drawY, drawW, drawH);
      ctx.globalAlpha = 1;

      // dark polar caps (pseudo-spherical shading)
      const topFade = ctx.createLinearGradient(cx, cy - GR, cx, cy - GR * 0.55);
      topFade.addColorStop(0, DARK(0.65));
      topFade.addColorStop(1, DARK(0));
      ctx.fillStyle = topFade;
      ctx.fillRect(cx - GR, cy - GR, GR * 2, GR * 0.45);

      const botFade = ctx.createLinearGradient(cx, cy + GR * 0.55, cx, cy + GR);
      botFade.addColorStop(0, DARK(0));
      botFade.addColorStop(1, DARK(0.70));
      ctx.fillStyle = botFade;
      ctx.fillRect(cx - GR, cy + GR * 0.55, GR * 2, GR * 0.45);

      // side edge darkening (spherical curvature illusion)
      const leftDark = ctx.createLinearGradient(cx - GR, cy, cx - GR * 0.60, cy);
      leftDark.addColorStop(0, DARK(0.80));
      leftDark.addColorStop(1, DARK(0));
      ctx.fillStyle = leftDark;
      ctx.fillRect(cx - GR, cy - GR, GR * 0.40, GR * 2);

      const rightDark = ctx.createLinearGradient(cx + GR * 0.60, cy, cx + GR, cy);
      rightDark.addColorStop(0, DARK(0));
      rightDark.addColorStop(1, DARK(0.80));
      ctx.fillStyle = rightDark;
      ctx.fillRect(cx + GR * 0.60, cy - GR, GR * 0.40, GR * 2);

    } else {
      // Fallback while image loads: dark sphere with grid
      const ocean = ctx.createRadialGradient(cx - GR * 0.25, cy - GR * 0.22, 0, cx, cy, GR);
      ocean.addColorStop(0, 'rgba(12,30,70,0.95)');
      ocean.addColorStop(1, 'rgba(2,8,24,1)');
      ctx.arc(cx, cy, GR, 0, Math.PI * 2);
      ctx.fillStyle = ocean;
      ctx.fill();
    }

    // ③ Grid lines overlay on top of the texture (subtle)
    const spin   = t * 0.0000083 * Math.PI * 2;
    const gridOp = 0.14;
    ctx.lineWidth = 0.6;

    // latitude
    const LATS = 9;
    for (let i = 1; i < LATS; i++) {
      const lat = -Math.PI / 2 + (i / LATS) * Math.PI;
      const ey  = cy + GR * Math.sin(lat);
      const er  = Math.sqrt(Math.max(0, GR * GR - (ey - cy) ** 2));
      ctx.beginPath();
      ctx.ellipse(cx, ey, er, 2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = auroraColor(t, i / LATS, gridOp);
      ctx.stroke();
    }
    // longitude (spinning)
    const LONS = 12;
    for (let i = 0; i < LONS; i++) {
      const angle = (i / LONS) * Math.PI + spin;
      ctx.beginPath();
      ctx.ellipse(cx, cy, GR * Math.abs(Math.cos(angle)), GR, Math.PI / 2, 0, Math.PI * 2);
      ctx.strokeStyle = auroraColor(t, i / LONS, gridOp);
      ctx.stroke();
    }

    ctx.restore(); // end clip

    // ④ Specular highlight (top-left gleam for 3D depth)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, GR, 0, Math.PI * 2);
    ctx.clip();
    const spec = ctx.createRadialGradient(cx - GR * 0.28, cy - GR * 0.28, 0, cx - GR * 0.28, cy - GR * 0.28, GR * 0.65);
    spec.addColorStop(0, WHITE(0.18));
    spec.addColorStop(0.5, WHITE(0.05));
    spec.addColorStop(1, WHITE(0));
    ctx.fillStyle = spec;
    ctx.fillRect(cx - GR, cy - GR, GR * 2, GR * 2);
    ctx.restore();

    // ⑤ Border ring with aurora colour
    ctx.beginPath();
    ctx.arc(cx, cy, GR, 0, Math.PI * 2);
    ctx.strokeStyle = auroraColor(t, 0, 0.60);
    ctx.lineWidth   = 1.8;
    ctx.stroke();
  }

  /* ── DEVICE NODES ───────────────────────────────────────── */
  const DEVICES = [
    { emoji: '📡', name: 'Satélite',  angleDeg: -90,  dist: 1.65 },
    { emoji: '🏢', name: 'Servidor',  angleDeg: -40,  dist: 1.58 },
    { emoji: '📱', name: 'App Móvil', angleDeg:   5,  dist: 1.62 },
    { emoji: '🔒', name: 'Seguridad', angleDeg:  50,  dist: 1.58 },
    { emoji: '📷', name: 'Cámara',    angleDeg: 100,  dist: 1.62 },
    { emoji: '🏠', name: 'Hogar',     angleDeg: 150,  dist: 1.65 },
    { emoji: '📶', name: 'Red',       angleDeg: 205,  dist: 1.58 },
    { emoji: '🖥️', name: 'Monitor',  angleDeg: 255,  dist: 1.62 },
  ].map(d => ({ ...d, a: d.angleDeg * Math.PI / 180 }));

  function nodePos(d, t) {
    const float = 5 * Math.sin(t * 0.00032 + d.a);
    return { x: cx + Math.cos(d.a) * (GR * d.dist + float), y: cy + Math.sin(d.a) * (GR * d.dist + float) };
  }
  function surfPt(d) {
    return { x: cx + Math.cos(d.a) * GR, y: cy + Math.sin(d.a) * GR };
  }
  function ctrlPt(sp, np) {
    const mx = (sp.x + np.x) / 2, my = (sp.y + np.y) / 2;
    const dx = mx - cx, dy = my - cy;
    const len = Math.hypot(dx, dy) || 1;
    return { x: mx + (dx / len) * GR * 0.22, y: my + (dy / len) * GR * 0.22 };
  }

  /* ── PARTICLES ON ARCS ──────────────────────────────────── */
  const particles = DEVICES.flatMap((_, i) =>
    Array.from({length: 3}, (__, j) => ({ dev: i, prog: j / 3, speed: 0.00040 + Math.random() * 0.00025, cOff: i / DEVICES.length }))
  );

  function bezier(p0, cp, p1, t2) {
    const m = 1 - t2;
    return { x: m*m*p0.x + 2*m*t2*cp.x + t2*t2*p1.x, y: m*m*p0.y + 2*m*t2*cp.y + t2*t2*p1.y };
  }

  function drawArcs(t) {
    DEVICES.forEach((d, i) => {
      const sp = surfPt(d), np = nodePos(d, t), cp = ctrlPt(sp, np);
      const grad = ctx.createLinearGradient(sp.x, sp.y, np.x, np.y);
      grad.addColorStop(0,   auroraColor(t, i / DEVICES.length,       0.75));
      grad.addColorStop(0.5, auroraColor(t, i / DEVICES.length + 0.2, 0.30));
      grad.addColorStop(1,   auroraColor(t, i / DEVICES.length + 0.4, 0.04));
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.quadraticCurveTo(cp.x, cp.y, np.x, np.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 1.4;
      ctx.stroke();

      // dot on globe surface
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = auroraColor(t, i / DEVICES.length, 1);
      ctx.fill();
    });
  }

  function drawParticles(t) {
    particles.forEach(p => {
      p.prog += p.speed;
      if (p.prog > 1) p.prog = 0;
      const d = DEVICES[p.dev];
      const pos = bezier(surfPt(d), ctrlPt(surfPt(d), nodePos(d, t)), nodePos(d, t), p.prog);
      const alpha = Math.sin(p.prog * Math.PI);
      const pg = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 9);
      pg.addColorStop(0, auroraColor(t, p.cOff, alpha * 0.65));
      pg.addColorStop(1, auroraColor(t, p.cOff, 0));
      ctx.beginPath(); ctx.arc(pos.x, pos.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = pg; ctx.fill();
      ctx.beginPath(); ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = WHITE(alpha * 0.95); ctx.fill();
    });
  }

  function drawNodes(t) {
    const fs = Math.max(12, Math.min(20, W * 0.016));
    DEVICES.forEach((d, i) => {
      const { x, y } = nodePos(d, t);
      const pulse = 1 + 0.06 * Math.sin(t * 0.0005 + d.a * 2);
      const r = fs * 1.55 * pulse;
      const nc = auroraColor(t, i / DEVICES.length, 1);

      const halo = ctx.createRadialGradient(x, y, 0, x, y, r * 3.2);
      halo.addColorStop(0,   auroraColor(t, i / DEVICES.length, 0.20));
      halo.addColorStop(0.7, auroraColor(t, i / DEVICES.length, 0.05));
      halo.addColorStop(1,   auroraColor(t, i / DEVICES.length, 0));
      ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
      ctx.fillStyle = halo; ctx.fill();

      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle   = DARK(0.92); ctx.fill();
      ctx.strokeStyle = nc; ctx.lineWidth = 2; ctx.stroke();

      ctx.beginPath(); ctx.arc(x, y, r * 0.68, 0, Math.PI * 2);
      ctx.strokeStyle = auroraColor(t, i / DEVICES.length + 0.5, 0.28);
      ctx.lineWidth = 0.8; ctx.stroke();

      ctx.font = `${Math.round(r * 0.90)}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.95;
      ctx.fillText(d.emoji, x, y + 1);
      ctx.globalAlpha = 1;

      ctx.font      = `600 ${Math.max(9, Math.round(fs * 0.60))}px Inter,sans-serif`;
      ctx.fillStyle = auroraColor(t, i / DEVICES.length, 0.90);
      ctx.textBaseline = 'top';
      ctx.fillText(d.name, x, y + r + 7);
      ctx.textBaseline = 'middle';
    });
  }

  /* ── MAIN LOOP ──────────────────────────────────────────── */
  function loop(t) {
    ctx.clearRect(0, 0, W, H);
    drawShimmer(t);
    drawRadar(t);
    drawArcs(t);
    drawParticles(t);
    drawGlobe(t);
    drawNodes(t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

})();


// ---- Logo → scroll to top ----
const logoLink = document.getElementById('nav-logo-link');
if (logoLink) logoLink.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ---- Trigger initial animations ----
window.dispatchEvent(new Event('scroll'));
