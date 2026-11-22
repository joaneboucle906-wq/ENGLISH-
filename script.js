/* Création automatique du personnage dans chaque scène */
const FIG = p => `
  <g id="${p}-lL"><path d="M0 0 V78 H13"/></g>
  <g id="${p}-lR"><path d="M0 0 V78 H13"/></g>
  <g id="${p}-body">
    <g id="${p}-aL"><path d="M0 0 V42"/><g id="${p}-aL2"><path d="M0 0 V42"/></g></g>
    <path d="M0 0 V-82"/>
    <circle cx="0" cy="-106" r="24" fill="#fff"/>
    <circle id="${p}-eA" cx="9" cy="-110" r="3.4" fill="#0f172a" stroke="none"/>
    <circle id="${p}-eB" cx="-7" cy="-110" r="3.4" fill="#0f172a" stroke="none" opacity="0"/>
    <path id="${p}-mouth" d="M0 -96 Q8 -94 16 -96" stroke-width="4"/>
    <g id="${p}-aR"><path d="M0 0 V42"/><g id="${p}-aR2"><path d="M0 0 V42"/></g></g>
  </g>`;
document.querySelectorAll('g.fig').forEach(g => {
  g.innerHTML = FIG(g.id);
});
let P = '';
const $ = id => document.getElementById(P + id);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eseg = (t, a, b) => ease(seg(t, a, b));
const bell = (t, a, b) => Math.sin(Math.PI * seg(t, a, b));
const mx = (a, b, w) => [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w];
const RAD = Math.PI / 180;
const setT = (id, s) => { const el = $(id); if (el) el.setAttribute('transform', s); };
const setO = (id, o) => { const el = $(id); if (el) el.setAttribute('opacity', o); };
const setF = (id, c) => { const el = $(id); if (el) el.style.fill = c; };
const setX = (id, s) => { const el = $(id); if (el) el.textContent = s; };
const L1 = 42, L2 = 42, SY = -66;
const fc = p => {
  const f = p.face === undefined ? 1 : p.face;
  return Math.abs(f) < 0.03 ? 0.03 : f;
};
/* Cinématique inverse pour les bras */
function ik(sx, sy, tx, ty, l1, l2, bend) {
  let dx = tx - sx, dy = ty - sy, D = Math.hypot(dx, dy);
  const m = l1 + l2 - 0.5;
  if (D > m) { dx *= m / D; dy *= m / D; D = m; }
  if (D < 10) { const k = 10 / (D || 1); dx = dx * k || 0; dy = dy * k || 10; D = 10; }
  const phi = Math.atan2(-dx, dy);
  const al = Math.acos(clamp((l1 * l1 + D * D - l2 * l2) / (2 * l1 * D), -1, 1));
  const a = phi + bend * al;
  const ex = sx - l1 * Math.sin(a), ey = sy + l1 * Math.cos(a);
  const b = Math.atan2(-(sx + dx - ex), sy + dy - ey);
  return [a / RAD, (b - a) / RAD];
}
function toLocal(p, wx, wy) {
  const sg = (p.face === undefined || p.face >= 0) ? 1 : -1;
  const a = -(p.lean || 0) * RAD;
  const x = (wx - p.x) * sg, y = wy - p.y;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
}
function handWorld(p, g) {
  const a = g[0] * RAD, b = (g[0] + g[1]) * RAD;
  const x = -L1 * Math.sin(a) - L2 * Math.sin(b);
  const y = SY + L1 * Math.cos(a) + L2 * Math.cos(b);
  const l = (p.lean || 0) * RAD;
  return [
    p.x + fc(p) * (x * Math.cos(l) - y * Math.sin(l)),
    p.y + x * Math.sin(l) + y * Math.cos(l)
  ];
}
function pose(id, p) {
  setT(id, `translate(${p.x} ${p.y}) scale(${fc(p)} 1)`);
  setT(id + '-body', `rotate(${p.lean || 0})`);
  setT(id + '-lL', `rotate(${p.lL || 0})`);
  setT(id + '-lR', `rotate(${p.lR || 0})`);
  const out = {};
  for (const s of ['L', 'R']) {
    const h = p['h' + s];
    let g;
    if (h) {
      const q = toLocal(p, h[0], h[1]);
      g = ik(0, SY, q[0], q[1], L1, L2, 1);
    } else {
      g = p['a' + s] ||;
    }
    setT(`${id}-a${s}`, `translate(0 ${SY}) rotate(${g[0]})`);
    setT(`${id}-a${s}2`, `translate(0 ${L1}) rotate(${g[1]})`);
    out['h' + s] = handWorld(p, g);
  }
  const fr = p.front || 0;
  const sm = p.smile === undefined ? 0.2 : p.smile;
  const cx = 8 * (1 - fr);
  const mouth = $(id + '-mouth');
  if (mouth) mouth.setAttribute('d', `M${cx - 8} -96 Q${cx} ${-96 + 16 * sm} ${cx + 8} -96`);
  const eA = $(id + '-eA');
  const eB = $(id + '-eB');
  if (eA) eA.setAttribute('cx', 9 - 2 * fr);
  if (eB) eB.setAttribute('opacity', fr);
  return out;
}
const wk = (t, mov, k) => {
  const ph = Math.sin(t * k);
  return {
    ph,
    lL: 26 * ph * mov,
    lR: -26 * ph * mov,
    y: 400 - 78 * Math.cos(26 * RAD * Math.abs(ph) * mov)
  };
};
const fade = (t, L) => clamp(t / 0.4) * (1 - seg(t, L - 0.6, L));
/* Définition des 12 animations (s0 à s11) */
const scenes = [];
/* Scène 0 : Sommaire (marche devant les 5 étapes) */
scenes.push((() => {
  const LOOP = 11, SX =, ST =;
  function scene(t) {
    setO('art', fade(t, LOOP));
    const u = seg(t, 0.3, 10.2) * 5, k = Math.min(4, Math.floor(u)), f = u - k;
    const w = clamp((f - 0.45) / 0.55);
    const x = lerp(ST[k], ST[k + 1], ease(w));
    const mov = Math.sin(Math.PI * w);
    const g = wk(t, mov, 12);
    const d = eseg(f, 0.05, 0.15) * (1 - eseg(f, 0.35, 0.45)) * (u < 5 ? 1 : 0);
    const hR = mx([x + 8 - g.ph * 16 * mov, g.y + 12], [SX[k] - 34, 160], d);
    pose('f', { x, y: g.y, face: 1, lL: g.lL, lR: g.lR, aL: [g.ph * 18 * mov, 0], hR, smile: 0.7 });
    for (let i = 0; i < 5; i++) setF('sgb' + i, u >= i + 0.05 ? '#dbeafe' : '#ffffff');
  }
  return { P: 's0-', loop: LOOP, fn: scene };
})());
/* Scène 1 : Introduction (tirer la flèche rouge PRIX à l'horizontale) */
scenes.push((() => {
  const LOOP = 9;
  function scene(t) {
    const p1 = eseg(t, 0, 1.4), p2 = eseg(t, 1.5, 5.0), r = eseg(t, 7.2, 9);
    const m3 = (a, b, c) => lerp(lerp(lerp(a, b, p1), c, p2), a, r);
    const hold = seg(t, 5.0, 5.6) * (1 - r);
    const ax = m3(575, 575, 560), th = m3(0, -5, 90), ay = m3(300, 165, 275) + 3 * Math.sin(t * 4) * hold;
    setT('arrow', `translate(${ax} ${ay}) rotate(${th})`);
    const fl = clamp(p1 * 4) * (1 - clamp(p2 * 1.6)) * (1 - r);
    setT('flame', `translate(0 82) scale(1 ${(0.2 + fl * (0.8 + 0.25 * Math.sin(t * 35))).toFixed(3)}) translate(0 -82)`);
    setO('flame', fl > 0.03 ? 1 : 0);
    const ten = lerp(lerp(0.35, 1, clamp(p1 * 2)), 0.35, r);
    const brace = clamp(p1 * 2) * (1 - r);
    const fx = m3(215, 262, 205), lean = m3(2, 18, -16);
    const jig = bell(t, 1.6, 5.0) * Math.sin((t - 1.5) * 5) * 9;
    const h = pose('f', {
      x: fx, y: 322, face: 1, lean, lL: 22 * brace, lR: -26 * brace,
      hR: [fx + 66 + jig, 262], hL: [fx + 52 + jig, 270], smile: m3(0.2, -0.8, 1)
    });
    const A = [ax - 25 * Math.sin(th * RAD), ay + 25 * Math.cos(th * RAD)];
    const H = h.hR, sag = 46 * (1 - ten);
    const rope = $('rope');
    if (rope) rope.setAttribute('d', `M${H[0]} ${H[1]} Q${(H[0] + A[0]) / 2} ${(H[1] + A[1]) / 2 + sag} ${A[0]} ${A[1]}`);
  }
  return { P: 's1-', loop: LOOP, fn: scene };
})());
/* Scène 2 : I.A Taux directeurs */
scenes.push((() => {
  const LOOP = 9;
  function scene(t) {
    setO('art', fade(t, LOOP));
    const pr = eseg(t, 1.2, 4.5) * (1 - eseg(t, 7.2, 8.8));
    const a = lerp(-32, 36, pr);
    setT('lv', `translate(335 350) rotate(${a})`);
    const tip = [335 + 85 * Math.sin(a * RAD), 350 - 85 * Math.cos(a * RAD)];
    const g = wk(t, (pr > 0.02 && pr < 0.98) ? 1 : 0, 12);
    pose('f', {
      x: tip[0] - 72, y: g.y, face: 1, lean: 6 * pr, lL: g.lL, lR: g.lR,
      hR: tip, hL: [tip[0] - 4, tip[1] + 8], smile: lerp(0.2, 0.9, seg(t, 4.2, 5))
    });
    const gh = 240 * lerp(0.2, 0.9, pr);
    const gf = $('gf');
    if (gf) { gf.setAttribute('y', 356 - gh); gf.setAttribute('height', gh); }
    setX('rt', 'TAUX ' + Math.round(lerp(2, 6, pr)) + '%');
    for (let i = 0; i < 6; i++) setO('cn' + i, clamp((6 * (1 - 0.85 * pr) - i) * 3));
  }
  return { P: 's2-', loop: LOOP, fn: scene };
})());
/* Scène 3 : I.B Open market */
scenes.push((() => {
  const LOOP = 10;
  function scene(t) {
    setO('art', fade(t, LOOP));
    const fx = t < 3.4 ? lerp(190, 560, ease(seg(t, 0.3, 3))) : lerp(560, 190, ease(seg(t, 3.9, 6.5)));
    const face = lerp(1, -1, eseg(t, 3.4, 3.9)), sg = face >= 0 ? 1 : -1;
    const mov = ((t > 0.3 && t < 3) || (t > 3.9 && t < 6.5)) ? 1 : 0, g = wk(t, mov, 12);
    const ex = eseg(t, 3, 3.3) * (1 - eseg(t, 3.5, 3.8));
    const dep = eseg(t, 6.5, 7.1) * (1 - eseg(t, 7.3, 7.7));
    let hR = mx([fx + sg * 32, g.y - 40], [fx + sg * 62, g.y - 34], ex);
    hR = mx(hR, [fx + sg * 60, g.y - 30], dep);
    const h = pose('f', { x: fx, y: g.y, face, lL: g.lL, lR: g.lR, hR, hL: [hR[0] - sg * 8, hR[1] + 8], smile: 0.6 });
    const dp = eseg(t, 3, 3.6), dxy = mx(h.hR, [655, 345], dp);
    setT('doc', `translate(${dxy[0]} ${dxy[1]}) scale(${t < 3.6 ? 1 : 0.001})`);
    let bxy =, bs = 0.001;
    if (t >= 3.1 && t < 3.8) { bxy = mx([655, 350], h.hR, eseg(t, 3.1, 3.8)); bs = 1; }
    else if (t >= 3.8 && t < 6.9) { bxy = h.hR; bs = 1; }
    else if (t >= 6.9 && t < 7.6) { bxy = mx(h.hR, [90, 350], eseg(t, 6.9, 7.6)); bs = Math.max(0.001, 1 - eseg(t, 7.3, 7.6)); }
    setT('bag', `translate(${bxy[0]} ${bxy[1]}) scale(${bs})`);
  }
  return { P: 's3-', loop: LOOP, fn: scene };
})());
/* Scène 4 : I.C Réserves obligatoires */
scenes.push((() => {
  const LOOP = 9;
  function scene(t) {
    setO('art', fade(t, LOOP));
    const close = eseg(t, 1.5, 4.5) * (1 - eseg(t, 7.2, 8.8));
    const W = 270 * close;
    setT('wheel', `translate(520 215) rotate(${W})`);
    const g = (180 + (W % 90)) * RAD;
    const HV = [520 + 30 * Math.cos(g), 215 + 30 * Math.sin(g)];
    const reach = bell(t, 1.0, 5.0);
    const hR = mx([445, 330], HV, clamp(reach * 2.5));
    pose('f', { x: 435, y: 322, face: 1, lean: 10 * clamp(reach * 2), hR, hL:, smile: lerp(0.2, 0.9, close) });
    const lvl = lerp(65, 195, close);
    const res = $('res');
    if (res) { res.setAttribute('y', 336 - lvl); res.setAttribute('height', lvl); }
    const fl = $('flow');
    if (fl) {
      fl.setAttribute('stroke-width', Math.max(1.5, 10 * (1 - 0.85 * close)));
      fl.setAttribute('opacity', 1 - 0.7 * close);
    }
  }
  return { P: 's4-', loop: LOOP, fn: scene };
})());

/* Scène 5 : II.A Hausse des taux et épargne */
scenes.push((() => {
  const LOOP = 9.5;
  function scene(t) {
setO('art', fade(t, LOOP));
const moveRight = eseg(t, 3.2, 5.5) * (1 - eseg(t, 7.6, 9.2));
const fx = lerp(240, 520, moveRight);
const mov = bell(t, 3.2, 5.5) + bell(t, 7.6, 9.2);
const g = wk(t, mov, 12);
const face = t > 7.6 ? -1 : 1;
pose('f', {
x: fx, y: g.y, face, lL: g.lL, lR: g.lR,
hR: moveRight > 0.7 ? [560, 290] : undefined,
smile: lerp(-0.5, 0.9, moveRight)
});
const sc = 1 + 0.18 * moveRight;
setT('pig', translate(580 330) scale(${sc}) translate(-580 -330));
}
return { P: 's5-', loop: LOOP, fn: scene };
})());
/* Scène 6 : II.B Baisse consommation & investissement */
scenes.push((() => {
const LOOP = 9.5;
function scene(t) {
setO('art', fade(t, LOOP));
const brake = eseg(t, 1.5, 4.5) * (1 - eseg(t, 7.5, 9.2));
const cx = lerp(120, 340, ease(seg(t, 0.4, 3.2)));
setT('cart', translate(${cx} 325));
pose('f', {
x: cx - 50, y: 322, face: 1, lean: lerp(12, -14, brake),
lL: lerp(15, 22, brake), lR: lerp(-15, -24, brake),
hR: [cx - 10, 325], hL: [cx - 16, 330], smile: lerp(0.1, 0.85, brake)
});
const py = lerp(150, 270, brake);
const pa = lerp(0, 65, brake);
setT('parr', translate(620 ${py}) rotate(${pa}));
}
return { P: 's6-', loop: LOOP, fn: scene };
})());
/* Scène 7 : II.C Appréciation de la monnaie */
scenes.push((() => {
const LOOP = 9.5;
function scene(t) {
setO('art', fade(t, LOOP));
const up = eseg(t, 1.4, 4.6) * (1 - eseg(t, 7.4, 9.2));
const cy = lerp(290, 145, up);
setT('curr', translate(260 ${cy}));
const iy = lerp(155, 295, up);
setT('imp', translate(560 ${iy}));
pose('f', {
x: 410, y: 322, face: 1,
hL: [320, cy], hR: [500, iy], smile: lerp(0.1, 0.9, up)
});
}
return { P: 's7-', loop: LOOP, fn: scene };
})());
/* Scène 8 : III.A Risque de récession (balance) */
scenes.push((() => {
const LOOP = 10;
function scene(t) {
setO('art', fade(t, LOOP));
const tilt = Math.sin(seg(t, 0.8, 8.8) * Math.PI * 2) * 20;
setT('beam', translate(400 210) rotate(${tilt}));
const rad = tilt * RAD;
const lx = 400 - 180 * Math.cos(rad), ly = 210 - 180 * Math.sin(rad);
const rx = 400 + 180 * Math.cos(rad), ry = 210 + 180 * Math.sin(rad);
setT('panL', translate(${lx} ${ly}));
setT('panR', translate(${rx} ${ry}));
pose('f', {
x: 400, y: 322, front: 1, lean: tilt * 0.35,
hL: [lx + 30, ly + 20], hR: [rx - 30, ry + 20], smile: -0.35
});
}
return { P: 's8-', loop: LOOP, fn: scene };
})());
/* Scène 9 : III.B Délais d'action (horloge) */
scenes.push((() => {
const LOOP = 10;
function scene(t) {
setO('art', fade(t, LOOP));
const pull = eseg(t, 0.8, 2.2) * (1 - eseg(t, 8.2, 9.6));
setT('sw', translate(190 340) rotate(${lerp(-25, 30, pull)}));
const spin = seg(t, 2.0, 6.2) * 720;
setT('hand', translate(410 180) rotate(${spin}));
const drop = eseg(t, 5.8, 7.6) * (1 - eseg(t, 8.2, 9.6));
setT('pbox', translate(630 ${lerp(180, 310, drop)}));
pose('f', {
x: 135, y: 322, face: 1, lean: 8 * pull,
hR: [190 + 60 * Math.sin(lerp(-25, 30, pull) * RAD), 340 - 60 * Math.cos(lerp(-25, 30, pull) * RAD)],
smile: lerp(0.1, 0.85, drop)
});
}
return { P: 's9-', loop: LOOP, fn: scene };
})());
/* Scène 10 : III.C Inflation par les coûts (choc d'offre) */
scenes.push((() => {
const LOOP = 9.5;
function scene(t) {
setO('art', fade(t, LOOP));
const shock = eseg(t, 1.0, 4.0) * (1 - eseg(t, 7.4, 9.2));
const flameScale = 0.6 + 0.9 * shock + 0.15 * Math.sin(t * 25) * shock;
setT('fire', translate(230 330) scale(${flameScale}) translate(-230 -330));
const pushBack = eseg(t, 3.0, 5.2) * (1 - eseg(t, 7.4, 9.2));
const py = lerp(280, 145, shock) + 40 * pushBack;
setT('costp', translate(590 ${py}));
pose('f', {
x: 420, y: 322, face: 1, lean: 12 * pushBack,
hR: [535, py], hL: [525, py + 15], smile: -0.6
});
}
return { P: 's10-', loop: LOOP, fn: scene };
})());
/* Scène 11 : Conclusion (équilibre stable) */
scenes.push((() => {
const LOOP = 9;
function scene(t) {
setO('art', fade(t, LOOP));
const settle = eseg(t, 0.8, 3.2);
const wave = Math.sin(t * 4) * 14 * (1 - settle);
setT('cbeam', translate(400 220) rotate(${wave}));
const rad = wave * RAD;
setT('cL', translate(${400 - 170 * Math.cos(rad)} ${220 - 170 * Math.sin(rad)}));
setT('cR', translate(${400 + 170 * Math.cos(rad)} ${220 + 170 * Math.sin(rad)}));
pose('f', {
x: 400, y: 322, front: 1,
aL: [lerp(-20, -145, settle), -15],
aR: [lerp(20, 145, settle), 15],
smile: 1
});
}
return { P: 's11-', loop: LOOP, fn: scene };
})());
/* Navigation entre les diapositives et boucle d'animation */
const slides = Array.from(document.querySelectorAll('.slide'));
const countEl = document.getElementById('count');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const fsBtn = document.getElementById('fs');
let cur = 0;
let startTime = performance.now();
function show(idx) {
cur = (idx + slides.length) % slides.length;
slides.forEach((s, i) => s.classList.toggle('on', i === cur));
if (countEl) countEl.textContent = ${cur + 1} / ${slides.length};
startTime = performance.now();
history.replaceState(null, '', #${cur + 1});
}
const hashIdx = parseInt(location.hash.replace('#', ''), 10);
if (hashIdx >= 1 && hashIdx <= slides.length) cur = hashIdx - 1;
show(cur);
if (prevBtn) prevBtn.addEventListener('click', () => show(cur - 1));
if (nextBtn) nextBtn.addEventListener('click', () => show(cur + 1));
if (fsBtn) {
fsBtn.addEventListener('click', () => {
if (!document.fullscreenElement) {
document.documentElement.requestFullscreen().catch(() => {});
} else {
document.exitFullscreen().catch(() => {});
}
});
}
document.addEventListener('keydown', e => {
if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) {
e.preventDefault();
show(cur + 1);
} else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) {
e.preventDefault();
show(cur - 1);
} else if (e.key === 'Home') {
e.preventDefault();
show(0);
} else if (e.key === 'End') {
e.preventDefault();
show(slides.length - 1);
}
});
/* Boucle de rendu à 60 FPS */
function tick(now) {
const activeSlide = slides[cur];
const animAttr = activeSlide ? activeSlide.getAttribute('data-anim') : null;
if (animAttr !== null) {
const s = scenes[parseInt(animAttr, 10)];
if (s) {
P = s.P;
const elapsed = ((now - startTime) / 1000) % s.loop;
s.fn(elapsed);
}
}
requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
