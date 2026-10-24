/* Légion Pixel — Champ de bataille : sol, caméra, grille spatiale, effets, simulation et rendu */
'use strict';
/* ---------- SOL DE BATAILLE ---------- */
const THEMES = {
  grass: {base:['#3f7d3a','#467f3c','#3a7334','#4b8a40'], det:[['#5fa34d',.05],['#2f6129',.04],['#f2e86a',.004],['#ffffff',.003],['#8a7a62',.003]], deco:['tuft','tuft','flower','rock']},
  forest:{base:['#2d5a33','#2a5330','#31613a','#27502c'], det:[['#3e7344',.05],['#1c3820',.06],['#8a5a2b',.004]], deco:['tuft','mush','rock','tuft']},
  sand:  {base:['#d9b56a','#d3ad62','#dfbd74','#cfa85e'], det:[['#c49a52',.06],['#efd69a',.04],['#8a6a3a',.003]], deco:['rock','cactus','bone']},
  snow:  {base:['#dfe8f2','#d6e1ee','#e8eff7','#d0dbe8'], det:[['#c3d1e2',.07],['#ffffff',.05],['#9fb2c8',.004]], deco:['rock','pine','tuft']}
};
const DECO = {
  tuft:{p:{g:'#2f6129',G:'#5fa34d'}, g:["G.G.G","gGgGg"]},
  flower:{p:{w:'#ffffff',y:'#f2c14a',g:'#2f6129'}, g:[".w.",'wyw',".g."]},
  rock:{p:{o:'#3a3446',l:'#a8a0b0',m:'#7a7288'}, g:[".ooo.","olllo","ommmo",".ooo."]},
  mush:{p:{o:'#3a1020',r:'#d94040',w:'#ffffff',s:'#e8dcc0'}, g:[".ooo.","orwro","ooooo",".oso."]},
  cactus:{p:{o:'#1f3a1a',g:'#5a9a3a'}, g:[".o.","ogo","ogoo","oggo","ogo.","ogo."]},
  bone:{p:{w:'#f0e8d8',o:'#8a7a62'}, g:["w...w",".www.","w...w"]},
  pine:{p:{o:'#1a3020',g:'#2e5a3a',w:'#ffffff',b:'#5a3519'}, g:["..o..",".owo.",".ogo.","ogggo","owggo",".ooo.","..b.."]}
};
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function genGround(theme, gw, gh, seed){
  const th = THEMES[theme] || THEMES.grass, rng = mulberry32(seed || 7);
  const base = th.base.map(hex), det = th.det.map(([c, p]) => [hex(c), p]);
  const c = document.createElement('canvas'); c.width = Math.max(1, gw); c.height = Math.max(1, gh);
  const x = c.getContext('2d'), img = x.createImageData(c.width, c.height), d = img.data, ph = rng() * 10;
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
    const v = Math.sin(i * .09 + ph) * Math.sin(j * .11 + ph * 2) + Math.sin((i + j) * .035 + ph) * .6 + (rng() - .5) * .8;
    let col = base[clamp(Math.floor((v + 2) / 4 * base.length), 0, base.length - 1)];
    const r = rng(); let acc = 0; for (const [dc, p] of det) { acc += p; if (r < acc) { col = dc; break; } }
    const o = (j * c.width + i) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const nd = Math.floor(gw * gh / 900);
  for (let k = 0; k < nd; k++) {
    const D = DECO[th.deco[Math.floor(rng() * th.deco.length)]];
    x.drawImage(paintGrid(D.g, D.p, false), rng() * gw | 0, rng() * gh | 0);
  }
  return c;
}

/* ---------- CHAMP DE BATAILLE ---------- */
const cv = $('#cv'), ctx = cv.getContext('2d');
const art = document.createElement('canvas'), actx = art.getContext('2d');
const G = {W:256, Hw:400, k:1, shake:0, cam:{z:1, x:0, y:0}, camT:null, slowT:0, lastKill:null};
let B = null, ground = null, groundKey = '';
let units = [], projectiles = [], particles = [], corpses = [], waves = [], decals = [], texts = [];
let uid = 1;
const MAXU = 600;
function resize(){
  if (cur !== 'battle') return;
  const r = $('#cwrap').getBoundingClientRect(); if (r.width < 10 || r.height < 10) return;
  cv.width = Math.round(r.width * DPR); cv.height = Math.round(r.height * DPR);
  cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
  G.k = r.width / G.W; G.Hw = Math.round(r.height / G.k);
  art.width = G.W; art.height = G.Hw;
  ensureGround(); camClamp();
}
// le sol est généré une fois (assez haut pour tout l'écran) : les corps s'y incrustent
function ensureGround(){
  const key = B ? B.theme + B.seed : 'grass3', h = Math.max(G.Hw, Math.ceil(window.innerHeight / G.k) + 8);
  if (ground && groundKey === key && ground.height >= G.Hw) return;
  ground = genGround(B ? B.theme : 'grass', G.W, h, B ? B.seed : 3); groundKey = key;
}
window.addEventListener('resize', () => { resize(); if (cur === 'menu') sizeScene(); });
if (window.ResizeObserver) new ResizeObserver(() => resize()).observe($('#cwrap'));
/* ---------- CAMÉRA (pincer pour zoomer, glisser pour se déplacer) ---------- */
function camClamp(){
  const c = G.cam; c.z = clamp(c.z, 1, 3);
  c.x = clamp(c.x, 0, G.W - G.W / c.z); c.y = clamp(c.y, 0, G.Hw - G.Hw / c.z);
}
function camReset(){ G.cam = {z:1, x:0, y:0}; G.camT = null; }
function camStep(dt){
  const T = G.camT; if (!T) return;
  const c = G.cam, f = 1 - Math.exp(-3.5 * dt);
  c.z += (T.z - c.z) * f;
  c.x += (T.x - G.W / c.z / 2 - c.x) * f; c.y += (T.y - G.Hw / c.z / 2 - c.y) * f;
  camClamp();
}
// zones de déploiement (espace art)
const zone = team => team === 'red' ? {y0:44, y1:Math.round(G.Hw * .43)} : {y0:Math.round(G.Hw * .58), y1:G.Hw - 6};
const FORM = {6:[[-12,-6],[0,-6],[12,-6],[-12,6],[0,6],[12,6]], 4:[[-9,-6],[9,-6],[-9,6],[9,6]], 3:[[-11,6],[11,6],[0,-6]], 2:[[-11,0],[11,0]], 1:[[0,0]]};
// encombrement d'une escouade (pour le placement)
const ext = type => { const F = FORM[UT[type].squad], r = UT[type].r;
  return {w:Math.max(...F.map(f => Math.abs(f[0]))) * 2 + r * 2, h:Math.max(22, Math.max(...F.map(f => Math.abs(f[1]))) * 2 + 12)}; };
function makeUnit(type, lvl, team, x, y){
  const T = UT[type];
  return {id:uid++, type, lvl, team, x, y, hp:T.hp * HPM(lvl), maxHp:T.hp * HPM(lvl), dmg:T.dmg * DMGM(lvl), range:T.range, cdMax:T.cd, cd:rnd() * .6,
    spd:T.spd, armor:T.armor, r:T.r, face:team === 'blue' ? 1 : -1, target:null, rt:0, atk:0, walk:rnd(), moving:false, flash:0, drop:0, aim:0,
    dead:false, kx:0, ky:0, stun:0, chargeCd:0, charging:false, vx:0, vy:0};
}
function squadSlots(type, team, x, y){
  return FORM[UT[type].squad].map(([dx, dy]) => [x + dx, y + (team === 'red' ? -dy : dy)]);
}
function clampSquad(type, team, x, y){
  const z = zone(team), e = ext(type), mx = e.w / 2 - 2, my = e.h / 2 - 6;
  return [clamp(x, mx, G.W - mx), clamp(y, z.y0 + my, z.y1 - my)];
}
function spawnSquad(type, lvl, team, x, y){
  squadSlots(type, team, x, y).forEach(([sx, sy], i) => {
    const u = makeUnit(type, lvl, team, sx + (rnd() - .5) * 2, sy + (rnd() - .5) * 2); u.drop = .35 + i * .06; units.push(u);
  });
  B.squads.push({team, x, y, type, lvl});
}
function squadFree(type, team, x, y){
  const e = ext(type);
  for (const q of B.squads) {
    if (q.team !== team) continue;
    const f = ext(q.type);
    if (Math.abs(q.x - x) < (e.w + f.w) / 2 * .85 && Math.abs(q.y - y) < (e.h + f.h) / 2 * .85) return false;
  }
  return true;
}
function resetWorld(){ units = []; projectiles = []; particles = []; corpses = []; waves = []; decals = []; texts = []; ground = null; G.slowT = 0; G.lastKill = null; camReset(); }

/* ---------- GRILLE SPATIALE (des centaines de soldats sans ralentir) ---------- */
const CELL = 36, grid = new Map();
function buildGrid(){
  grid.clear();
  for (const u of units) {
    if (u.dead || u.drop > 0) continue;
    const k = (u.x / CELL | 0) + (u.y / CELL | 0) * 64;
    let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(u);
  }
}
function near(x, y, fn){
  const cx = x / CELL | 0, cy = y / CELL | 0;
  for (let j = cy - 1; j <= cy + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) {
    const a = grid.get(i + j * 64); if (a) for (const o of a) fn(o);
  }
}
const alive = team => { let n = 0; for (const u of units) if (!u.dead && u.team === team) n++; return n; };

/* ---------- PARTICULES & EFFETS ---------- */
function burst(x, y, cols, n, spd, life, g = 120, up = 30, size = 1){
  if (particles.length > 1400) return;
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, s = spd * (.3 + rnd() * .7);
    particles.push({x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s * .6 - up * rnd(), life:life * (.6 + rnd() * .4), max:life, col:cols[Math.floor(rnd() * cols.length)], g, s:size + (rnd() < .3 ? 1 : 0)});
  }
}
// mini police 3x5 pour les bulles de combat
const MICRO = {C:['111','100','100','100','111'],H:['101','101','111','101','101'],A:['010','101','111','101','101'],R:['110','101','110','101','101'],G:['111','100','101','101','111'],E:['111','100','110','100','111'],
  '!':['1','1','1','0','1'],T:['111','010','010','010','010'],I:['111','010','010','010','111'],N:['101','111','111','111','101'],B:['110','101','110','101','110'],O:['111','101','101','101','111'],M:['101','111','111','101','101'],P:['111','101','111','100','100'],S:['111','100','111','001','111'],K:['101','110','100','110','101'],L:['100','100','100','100','111'],U:['101','101','101','101','111'],' ':['0','0','0','0','0']};
function popText(x, y, txt, col){ texts.push({x, y, txt, col, t:0}); }
function drawMicro(c, txt, x, y, col){
  const w = [...txt].reduce((s, ch) => s + (MICRO[ch] || MICRO[' '])[0].length + 1, -1);
  let cx = Math.round(x - w / 2); y = Math.round(y);
  for (const ch of txt) {
    const g = MICRO[ch] || MICRO[' '];
    for (let j = 0; j < 5; j++) for (let i = 0; i < g[j].length; i++) if (g[j][i] === '1') {
      c.fillStyle = '#1a1020'; c.fillRect(cx + i - 1, y + j, 3, 1); c.fillRect(cx + i, y + j - 1, 1, 3);
    }
    cx += g[0].length + 1;
  }
  cx = Math.round(x - w / 2);
  for (const ch of txt) {
    const g = MICRO[ch] || MICRO[' '];
    c.fillStyle = col;
    for (let j = 0; j < 5; j++) for (let i = 0; i < g[j].length; i++) if (g[j][i] === '1') c.fillRect(cx + i, y + j, 1, 1);
    cx += g[0].length + 1;
  }
}

/* ---------- SIMULATION ---------- */
function pickTarget(u){
  if (u.type === 'bomber') {
    let best = null, bs = -1e9;
    for (const o of units) {
      if (o.dead || o.team === u.team || o.drop > 0) continue;
      const d = Math.hypot(o.x - u.x, o.y - u.y); if (d > u.range + 90) continue;
      let n = 0; near(o.x, o.y, p => { if (p.team === o.team && !p.dead && Math.abs(p.x - o.x) < 30 && Math.hypot(p.x - o.x, p.y - o.y) < 30) n++; });
      const sc = n * 40 - d * .3 - (d < UT.bomber.minR ? 200 : 0);
      if (sc > bs) { bs = sc; best = o; }
    }
    if (best) return best;
  }
  let best = null, bd = 1e18;
  for (const o of units) {
    if (o.dead || o.team === u.team || o.drop > 0) continue;
    let d = (o.x - u.x) ** 2 + (o.y - u.y) ** 2;
    if (o.type === 'guard' && d < UT.guard.taunt ** 2) d *= .3; // provocation
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}
function nearestThreat(u){
  let best = null, bd = 1e9;
  near(u.x, u.y, o => {
    if (o.dead || o.team === u.team || o.drop > 0 || UT[o.type].proj) return;
    const d = Math.hypot(o.x - u.x, o.y - u.y); if (d < bd) { bd = d; best = o; }
  });
  return best ? {o:best, d:bd} : null;
}
function damage(t, dmg, src, opts = {}){
  if (t.dead) return;
  let m = opts.pierce ? 1 : 1 - t.armor;
  t.hp -= dmg * m * (.9 + rnd() * .2); t.flash = .08;
  const hy = t.y - (t.type === 'guard' ? 20 : 16);
  if (t.armor >= .3 && !opts.pierce) { burst(t.x, hy, ['#ffffff','#ffe9a0'], 3, 40, .25, 80, 10); sfx('clang'); }
  else { burst(t.x, hy, ['#ffffff','#ffd27a','#d94040'], 3, 40, .3, 120, 15); sfx('hit'); }
  if (opts.kb) { const dx = t.x - (src ? src.x : t.x), dy = t.y - (src ? src.y : t.y), d = Math.hypot(dx, dy) || 1; const k = opts.kb * (t.type === 'guard' ? .35 : 1); t.kx += dx / d * k * 8; t.ky += dy / d * k * 8; }
  if (t.hp <= 0) kill(t);
}
function kill(u){
  u.dead = true; u.hp = 0;
  // les coups puissants (explosion, charge, bouclier) font voler le corps
  const kb = Math.hypot(u.kx, u.ky), fly = kb > 5;
  corpses.push({u, t:0, x:u.x, y:u.y, vx:fly ? u.kx * 3 : 0, vy:fly ? u.ky * 2 : 0, h:0, vh:fly ? 40 + kb * 6 : 0,
    rot:0, spin:fly ? (u.kx >= 0 ? 1 : -1) * (7 + rnd() * 6) : 0, landed:!fly, lt:0});
  G.lastKill = {x:u.x, y:u.y};
  burst(u.x, u.y - 12, [TEAM_PAL[u.team].T, TEAM_PAL[u.team].t, '#d8cfc0'], 10, 50, .6, 140, 30);
  sfx('die');
}
// silhouette assombrie pour les corps incrustés dans le sol
function corpseSprite(u){
  const key = `c${u.type}${u.lvl}${u.team}`;
  let c = sprCache.get(key); if (c) return c;
  const s = bodySprite(u.type, u.lvl, u.team, 0, false);
  c = document.createElement('canvas'); c.width = s.width; c.height = s.height;
  const x = c.getContext('2d'); x.drawImage(s, 0, 0);
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(40,20,30,.38)'; x.fillRect(0, 0, c.width, c.height);
  sprCache.set(key, c); return c;
}
function bakeCorpse(k){
  if (!ground) return;
  const g = ground.getContext('2d'), u = k.u, x = Math.round(k.x), y = Math.round(k.y);
  g.fillStyle = 'rgba(110,20,30,.55)';
  for (let i = 0; i < 6; i++) g.fillRect(x + Math.round((rnd() - .5) * 10), y - 1 + Math.round((rnd() - .5) * 4), 1 + (rnd() < .4 ? 1 : 0), 1);
  const s = corpseSprite(u);
  g.save(); g.globalAlpha = .9; g.translate(x, y - 3); g.rotate(k.rot); g.drawImage(s, -12, -s.height); g.restore();
}
function stepCorpses(dt){
  for (const k of corpses) {
    k.t += dt;
    if (!k.landed) {
      k.x += k.vx * dt; k.y += k.vy * dt; k.h += k.vh * dt; k.vh -= 330 * dt; k.rot += k.spin * dt;
      if (k.h <= 0 && k.vh < 0) {
        k.h = 0; k.landed = true; k.lt = k.t; k.rot = (k.spin >= 0 ? 1 : -1) * Math.PI / 2;
        k.x = clamp(k.x, 6, G.W - 6); k.y = clamp(k.y, 36, G.Hw - 2);
        burst(k.x, k.y, ['#d8cfc0', '#a89a80'], 6, 40, .4, 60, 8); sfx('land');
      }
    } else if (!k.spin) k.rot = k.u.face * Math.PI / 2 * Math.min(1, k.t * 5);
    if (k.landed && k.t - k.lt > .45) { bakeCorpse(k); k.done = true; }
  }
  corpses = corpses.filter(k => !k.done);
}
function attack(u, t){
  const T = UT[u.type], A = UNITS_ART[u.type];
  const hx = u.x + u.face * (A.hand[0] - 11), hy = u.y - (unitH(u.type) - SPR_TOP - A.hand[1]);
  if (T.proj === 'arrow') {
    const d = Math.hypot(t.x - u.x, t.y - u.y), fly = .25 + d / 190;
    const tx = t.x + t.vx * fly * .8, ty = t.y + t.vy * fly * .8;
    projectiles.push({k:'arrow', x0:hx, y0:hy - 3, x1:tx, y1:ty - 8, p:0, dur:fly, h:8 + d * .22, dmg:u.dmg, team:u.team, tgt:t, sx:u.x, x:hx, y:hy});
    sfx('shoot');
  } else if (T.proj === 'bomb') {
    const d = Math.hypot(t.x - u.x, t.y - u.y);
    projectiles.push({k:'bomb', x0:hx, y0:hy - 6, x1:t.x + (rnd() - .5) * 8, y1:t.y + (rnd() - .5) * 6, p:0, dur:.5 + d / 200, h:16 + d * .25, dmg:u.dmg, team:u.team, aoe:T.aoe, x:hx, y:hy, fuse:.35});
    sfx('throw');
  } else if (u.type === 'sword') {
    let mult = 1;
    if (u.charging) { mult = 2; u.charging = false; u.chargeCd = 7; popText(t.x, t.y - 32, 'CHARGE!', '#ffd35a'); sfx('bash'); }
    damage(t, u.dmg * mult, u, {kb:mult > 1 ? 1 : 0});
  } else if (u.type === 'spear') {
    let mult = 1;
    if (t.charging) { mult = 2; t.charging = false; t.chargeCd = 7; t.stun = .6; popText(t.x, t.y - 32, 'BRISE!', '#ffffff'); }
    damage(t, u.dmg * mult, u, {pierce:true});
    // transperce : touche aussi l'ennemi derrière
    const dx = t.x - u.x, dy = t.y - u.y, d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
    for (const o of units) {
      if (o === t || o.dead || o.team === u.team || o.drop > 0) continue;
      const rx = o.x - t.x, ry = o.y - t.y, along = rx * nx + ry * ny, lat = Math.abs(rx * ny - ry * nx);
      if (along > 0 && along < 24 && lat < 9) { damage(o, u.dmg * .7, u, {pierce:true}); burst(o.x, o.y - 14, ['#ffffff'], 4, 50, .2, 0, 0); break; }
    }
    sfx('pierce');
  } else if (u.type === 'guard') {
    damage(t, u.dmg, u, {kb:1.4});
    for (const o of units) if (o !== t && !o.dead && o.team !== u.team && Math.hypot(o.x - t.x, o.y - t.y) < 14) damage(o, u.dmg * .5, u, {kb:1});
    G.shake = Math.max(G.shake, 1.5); sfx('bash');
  }
}
function sim(dt){
  buildGrid();
  for (const u of units) {
    if (u.dead) continue;
    u.cd -= dt; u.atk = Math.max(0, u.atk - dt / .32); u.chargeCd -= dt;
    const ox = u.x, oy = u.y;
    if (u.kx || u.ky) { u.x += u.kx * dt; u.y += u.ky * dt; const f = Math.exp(-8 * dt); u.kx *= f; u.ky *= f; if (Math.abs(u.kx) + Math.abs(u.ky) < .5) u.kx = u.ky = 0; }
    if (u.drop > 0) continue;
    if (u.stun > 0) { u.stun -= dt; u.moving = false; continue; }
    u.rt -= dt;
    if (!u.target || u.target.dead || u.rt <= 0) { u.target = pickTarget(u); u.rt = .35 + rnd() * .25; }
    const t = u.target; u.moving = false;
    if (!t) { u.charging = false; continue; }
    const dx = t.x - u.x, dy = t.y - u.y, d = Math.hypot(dx, dy) || .01;
    u.aim = Math.atan2(dy, Math.abs(dx));
    const reach = u.range + u.r + t.r;
    const T = UT[u.type];
    // repli (archère / sapeur)
    if (T.kite) {
      const th = nearestThreat(u);
      if (th && th.d < T.kite && u.cd > .25) {
        const ax = u.x - th.o.x, ay = u.y - th.o.y, ad = Math.hypot(ax, ay) || 1;
        u.x += ax / ad * u.spd * .85 * dt; u.y += ay / ad * u.spd * .85 * dt; u.moving = true; u.walk += dt;
        u.face = th.o.x > u.x ? 1 : -1;
        u.vx = (u.x - ox) / dt; u.vy = (u.y - oy) / dt;
        continue;
      }
    }
    if (Math.abs(dx) > 2) u.face = dx > 0 ? 1 : -1;
    // charge de l'épéiste
    if (u.type === 'sword' && !u.charging && u.chargeCd <= 0 && d > 34 && d < 110) {
      u.charging = true; sfx('charge');
    }
    if (d > reach) {
      const sp = u.spd * (u.charging ? 2.6 : 1);
      u.x += dx / d * sp * dt; u.y += dy / d * sp * dt; u.moving = true; u.walk += dt;
      if (u.charging && rnd() < .5) particles.push({x:u.x - u.face * 4, y:u.y, vx:-u.face * 10, vy:-8, life:.35, max:.35, col:'#d8cfc0', g:0, s:1 + (rnd() < .5 ? 1 : 0)});
    } else if (u.cd <= 0) {
      if (T.minR && d < T.minR) { /* trop près pour lancer */ }
      else { attack(u, t); u.cd = u.cdMax * (.9 + rnd() * .2); u.atk = 1; }
    }
    u.vx = (u.x - ox) / Math.max(dt, .001); u.vy = (u.y - oy) / Math.max(dt, .001);
  }
  // séparation (les corps se bousculent)
  for (const a of units) {
    if (a.dead || a.drop > 0) continue;
    near(a.x, a.y, b => {
      if (b.id <= a.id || b.dead) return;
      const dx = b.x - a.x; if (dx > 24 || dx < -24) return;
      const dy = b.y - a.y; if (dy > 24 || dy < -24) return;
      const rr = a.r + b.r, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr) {
        const d = Math.sqrt(d2) || .01, push = (rr - d) * .5, nx = dx / d, ny = dy / d;
        const wa = a.type === 'guard' ? .25 : 1, wb = b.type === 'guard' ? .25 : 1, s = wa + wb;
        a.x -= nx * push * 2 * wa / s; a.y -= ny * push * 2 * wa / s; b.x += nx * push * 2 * wb / s; b.y += ny * push * 2 * wb / s;
      }
    });
  }
  for (const u of units) { u.x = clamp(u.x, 6, G.W - 6); u.y = clamp(u.y, 36, G.Hw - 2); }
  // projectiles
  for (const p of projectiles) {
    if (p.landed) {
      p.fuse -= dt; if (p.fuse <= 0) { explode(p); p.done = true; } continue;
    }
    p.p += dt / p.dur; const q = Math.min(1, p.p);
    const px = p.x, py = p.y - (p.hh || 0);
    p.x = p.x0 + (p.x1 - p.x0) * q; p.y = p.y0 + (p.y1 - p.y0) * q; p.hh = Math.sin(q * Math.PI) * p.h;
    p.ang = Math.atan2(p.y - p.hh - py, p.x - px);
    if (p.p >= 1) {
      if (p.k === 'arrow') { arrowLand(p); p.done = true; }
      else { p.landed = true; p.x = p.x1; p.y = p.y1; p.hh = 0; sfx('land'); }
    }
  }
  projectiles = projectiles.filter(p => !p.done);
  units = units.filter(u => !u.dead);
}
function arrowLand(p){
  let hit = null;
  const t = p.tgt;
  if (t && !t.dead && Math.hypot(t.x - p.x1, t.y - 8 - p.y1) < 10) hit = t;
  else for (const o of units) if (!o.dead && o.team !== p.team && Math.hypot(o.x - p.x1, o.y - 8 - p.y1) < 8) { hit = o; break; }
  if (hit) {
    // le gardien bloque les flèches de face
    if (hit.type === 'guard' && Math.sign(p.sx - hit.x) === hit.face && rnd() < .65) {
      burst(hit.x + hit.face * 6, hit.y - 16, ['#ffffff','#ffe9a0'], 5, 50, .25, 60, 10); sfx('block');
      if (rnd() < .3) popText(hit.x, hit.y - 34, 'BLOK', '#ffffff');
      return;
    }
    damage(hit, p.dmg, null, {});
  } else decals.push({k:'arrow', x:p.x1, y:p.y1 + 8, t:0, max:3, a:p.ang});
}
function explode(p){
  for (const u of units) {
    if (u.dead || u.team === p.team) continue;
    const d = Math.hypot(u.x - p.x1, u.y - p.y1);
    if (d < p.aoe + u.r) damage(u, p.dmg * (1 - .5 * d / (p.aoe + u.r)), {x:p.x1, y:p.y1}, {kb:1.6 * (1 - d / (p.aoe + u.r))});
  }
  waves.push({x:p.x1, y:p.y1, t:0, max:.3, r:p.aoe});
  decals.push({k:'scorch', x:p.x1, y:p.y1, r:Math.round(p.aoe * .55), t:0, max:7});
  burst(p.x1, p.y1 - 3, ['#ffd35a','#ff8a2a','#ff5a2a','#fff2a8'], 18, 80, .45, 40, 40, 2);
  burst(p.x1, p.y1 - 3, ['#3a3346','#5a5266','#2a2433'], 10, 35, .9, -30, 20, 2);
  G.shake = Math.max(G.shake, 3); sfx('boom');
}
function stepFx(dt){
  for (const u of units) {
    u.flash = Math.max(0, u.flash - dt);
    if (u.drop > 0) { u.drop -= dt; if (u.drop <= 0) { u.drop = 0; burst(u.x, u.y, ['#d8cfc0','#a89a80'], 6, 30, .35, 60, 5); sfx('land'); } }
  }
  for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= dt; }
  particles = particles.filter(p => p.life > 0);
  stepCorpses(dt);
  for (const a of [waves, decals, texts]) a.forEach(o => o.t += dt);
  waves = waves.filter(w => w.t < w.max); decals = decals.filter(d => d.t < d.max); texts = texts.filter(o => o.t < 1);
  G.shake = Math.max(0, G.shake - dt * 16);
}

/* ---------- RENDU (basse résolution puis agrandi) ---------- */
function pixLine(c, x0, y0, x1, y1, col){
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  c.fillStyle = col;
  for (let k = 0; k < 64; k++) { c.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
function pixCircle(c, cx, cy, r, col, dash){
  c.fillStyle = col; const n = Math.max(16, Math.round(r * 2.4));
  for (let i = 0; i < n; i++) { if (dash && (i % 4 > 1)) continue; const a = i / n * Math.PI * 2; c.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * .55), 1, 1); }
}
function render(t){
  const c = actx; c.imageSmoothingEnabled = false; c.setTransform(1, 0, 0, 1, 0, 0);
  ensureGround(); c.drawImage(ground, 0, 0);
  const deploy = B.mode === 'story' && (B.phase === 'draft' || B.phase === 'ready');
  if (deploy) drawZones(t);
  for (const d of decals) {
    if (d.k === 'scorch') { const e = pixEllipse(d.r, Math.round(d.r * .45), `rgba(30,20,15,${(.22 * (1 - d.t / d.max)).toFixed(2)})`); c.drawImage(e, Math.round(d.x - d.r), Math.round(d.y - d.r * .45)); }
    else { c.globalAlpha = 1 - d.t / d.max; pixLine(c, d.x, d.y, d.x - Math.cos(d.a) * 5, d.y - Math.sin(d.a) * 5 - 1, '#8a5a2b'); c.fillStyle = '#e04646'; c.fillRect(Math.round(d.x - Math.cos(d.a) * 5), Math.round(d.y - Math.sin(d.a) * 5 - 1), 1, 1); c.globalAlpha = 1; }
  }
  for (const k of corpses) {
    const u = k.u, s = bodySprite(u.type, u.lvl, u.team, 0, false);
    if (k.h > 0) { const sh = pixEllipse(5, 2, 'rgba(0,0,0,.25)'); c.drawImage(sh, Math.round(k.x - 5), Math.round(k.y - 2)); }
    c.save(); c.translate(Math.round(k.x), Math.round(k.y - 3 - k.h));
    c.rotate(k.rot); c.drawImage(s, -12, -s.height); c.restore();
  }
  const sorted = units.slice().sort((a, b) => a.y - b.y);
  for (const u of sorted) {
    if (u.drop > 0) {
      const sh = pixEllipse(Math.max(1, Math.round(7 * (1 - u.drop))), 2, 'rgba(0,0,0,.25)');
      c.drawImage(sh, Math.round(u.x - sh.width / 2), Math.round(u.y - 2));
      drawUnitAt(c, u, u.x, u.y - u.drop * 130, t, clamp(1 - u.drop * 2, 0, 1));
    } else drawUnitAt(c, u, u.x, u.y, t);
  }
  if (B.ghost && deploy) drawGhost(t);
  for (const p of projectiles) {
    const sh = pixEllipse(2, 1, 'rgba(0,0,0,.25)'); c.drawImage(sh, Math.round(p.x - 2), Math.round(p.y - 1 + (p.k === 'arrow' ? 8 : 0)));
    if (p.k === 'arrow') {
      const x = p.x, y = p.y - p.hh, ca = Math.cos(p.ang), sa = Math.sin(p.ang);
      pixLine(c, x - ca * 6, y - sa * 6, x, y, '#c9925a');
      c.fillStyle = '#ffffff'; c.fillRect(Math.round(x + ca), Math.round(y + sa), 1, 1);
      c.fillStyle = TEAM_PAL[p.team].T; c.fillRect(Math.round(x - ca * 6), Math.round(y - sa * 6), 1, 1);
    } else {
      const s = weaponSprite('bomb', 1, p.team, p.landed && Math.floor(t * 16) % 2 === 0);
      c.drawImage(s, Math.round(p.x - 3), Math.round(p.y - p.hh - 7));
      if (rnd() < .5) particles.push({x:p.x + 2, y:p.y - p.hh - 8, vx:(rnd() - .5) * 8, vy:-10, life:.25, max:.25, col:rnd() < .5 ? '#ffe066' : '#ff8a2a', g:0, s:1});
    }
  }
  for (const w of waves) { const q = w.t / w.max; pixCircle(c, w.x, w.y, w.r * (.3 + q * .8), q < .5 ? '#fff2a8' : '#ff8a2a'); }
  for (const p of particles) { c.globalAlpha = clamp(p.life / p.max * 1.5, 0, 1); c.fillStyle = p.col; c.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
  c.globalAlpha = 1;
  for (const u of units) {
    if (u.hp >= u.maxHp || u.drop > 0) continue;
    const w = u.type === 'guard' ? 18 : 12, x = Math.round(u.x - w / 2), y = Math.round(u.y - unitH(u.type) + 2);
    c.fillStyle = '#1a1020'; c.fillRect(x - 1, y - 1, w + 2, 4);
    c.fillStyle = u.team === 'blue' ? '#1f4aa8' : '#8e2430'; c.fillRect(x, y, w, 2);
    c.fillStyle = u.team === 'blue' ? '#8cc0ff' : '#ff9a8a'; c.fillRect(x, y, Math.max(1, Math.round(w * u.hp / u.maxHp)), 2);
  }
  for (const o of texts) drawMicro(c, o.txt, o.x, o.y - o.t * 14, o.col);
  // mise à l'échelle sans flou
  ctx.imageSmoothingEnabled = false; ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#1a1020'; ctx.fillRect(0, 0, cv.width, cv.height);
  const cm = G.cam, s = G.k * DPR * cm.z;
  const sx = G.shake > 0 ? Math.round((rnd() - .5) * G.shake) * s : 0, sy = G.shake > 0 ? Math.round((rnd() - .5) * G.shake) * s : 0;
  ctx.drawImage(art, cm.x, cm.y, G.W / cm.z, G.Hw / cm.z, sx, sy, G.W * G.k * DPR, G.Hw * G.k * DPR);
  // bandes noires « cinéma » pendant le ralenti final
  if (G.slowT > 0) { const bh = Math.round(cv.height * .06 * Math.min(1, G.slowT * 3)); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, bh); ctx.fillRect(0, cv.height - bh, cv.width, bh); }
}
function drawZones(t){
  const c = actx;
  for (const team of ['red', 'blue']) {
    const z = zone(team), top = team === 'red' ? 0 : z.y0 - 30, bot = team === 'red' ? z.y1 : G.Hw;
    c.fillStyle = team === 'red' ? 'rgba(217,64,64,.12)' : `rgba(59,127,240,${B.sel != null ? (.12 + .06 * (Math.floor(t * 4) % 2)).toFixed(2) : .1})`;
    c.fillRect(0, top, G.W, bot - top);
    const ly = team === 'red' ? z.y1 : z.y0 - 30;
    c.fillStyle = team === 'red' ? 'rgba(120,20,30,.7)' : 'rgba(220,235,255,.75)';
    for (let x = 2; x < G.W; x += 6) c.fillRect(x, ly, 3, 1);
  }
  // niveaux des escouades ennemies (pastilles)
  for (const q of B.squads) {
    const y = Math.round(q.y + (q.team === 'red' ? 12 : 12)), x = Math.round(q.x - (q.lvl * 3 - 1) / 2);
    c.fillStyle = '#1a1020'; c.fillRect(x - 1, y - 1, q.lvl * 3 + 1, 4);
    for (let i = 0; i < q.lvl; i++) { c.fillStyle = q.lvl >= 5 ? '#e0a0ff' : '#ffd35a'; c.fillRect(x + i * 3, y, 2, 2); }
  }
}
function drawGhost(t){
  const g = B.ghost, o = B.offers[B.sel]; if (!o) return;
  const c = actx, ok = g.ok, T = UT[o.type];
  if (T.range > 40) pixCircle(c, g.x, g.y, T.range, ok ? 'rgba(255,255,255,.6)' : 'rgba(255,90,90,.6)', true);
  squadSlots(o.type, 'blue', g.x, g.y).forEach(([x, y], i) => drawUnitAt(c, {type:o.type, lvl:o.lvl, team:'blue', face:1, atk:0, moving:false, walk:0, flash:0, id:i, cd:0, cdMax:1, aim:-.3}, x, y, t, ok ? .7 : .35));
  if (!ok) drawMicro(c, 'TROP PRES', g.x, g.y + 10, '#ff9a8a');
}
