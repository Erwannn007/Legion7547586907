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
const G = {W:256, Hw:400, k:1, shake:0, cam:{z:1, x:0, y:0}, camT:null, slowT:0, lastKill:null, time:0};
let B = null, ground = null, groundKey = '';
let units = [], projectiles = [], particles = [], corpses = [], waves = [], decals = [], texts = [], beams = [], clouds = [];
let uid = 1;
const MAXU = 600;
function resize(){
  if (cur !== 'battle') return;
  const r = $('#cwrap').getBoundingClientRect(); if (r.width < 10 || r.height < 10) return;
  cv.width = Math.round(r.width * DPR); cv.height = Math.round(r.height * DPR);
  cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
  G.k = r.width / G.W; G.Hw = Math.round(r.height / G.k);
  art.width = G.W * HR; art.height = G.Hw * HR;
  ensureGround(); camClamp();
}
// le sol est généré une fois (assez haut pour tout l'écran), en double résolution : les corps s'y incrustent
function ensureGround(){
  const key = B ? B.theme + B.seed : 'grass3', h = Math.max(G.Hw, Math.ceil(window.innerHeight / G.k) + 8);
  if (ground && groundKey === key && ground.height >= G.Hw * HR) return;
  const g = genGround(B ? B.theme : 'grass', G.W, h, B ? B.seed : 3);
  ground = document.createElement('canvas'); ground.width = G.W * HR; ground.height = h * HR;
  const x = ground.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(g, 0, 0, ground.width, ground.height);
  groundKey = key;
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
// espacement des rangs selon la carrure du soldat
const gapOf = type => Math.max(11, Math.round(UT[type].r * 1.6));
function makeUnit(type, lvl, team, x, y){
  const T = UT[type];
  return {id:uid++, type, lvl, team, x, y, hp:T.hp * HPM(lvl), maxHp:T.hp * HPM(lvl), dmg:T.dmg * DMGM(lvl), range:T.range, cdMax:T.cd, cd:rnd() * .6,
    spd:T.spd, armor:T.armor, r:T.r, face:team === 'blue' ? 1 : -1, target:null, rt:0, atk:0, walk:rnd(), moving:false, flash:0, drop:0, aim:0,
    dead:false, kx:0, ky:0, stun:0, chargeCd:0, charging:false, vx:0, vy:0, fly:!!T.fly, fh:0,
    burnT:0, burnD:0, poisonT:0, poisonD:0, auraT:1 + rnd(), sporeT:1 + rnd() * 2};
}
// Seigneur de guerre : un Gardien géant qui mène l'armée ennemie des boss
function makeLord(lvl, team, x, y){
  const u = makeUnit('guard', lvl, team, x, y);
  u.sc = 2; u.hp = u.maxHp = u.hp * 14; u.dmg *= 3; u.r = 18; u.spd = 17; u.cdMax = 1.5; u.lord = true;
  return u;
}
function squadSlots(type, team, x, y){
  const k = gapOf(type) / 11;
  return FORM[UT[type].squad].map(([dx, dy]) => [x + dx * k, y + (team === 'red' ? -dy : dy) * k]);
}
function spawnSquad(type, lvl, team, x, y){
  squadSlots(type, team, x, y).forEach(([sx, sy], i) => {
    const u = makeUnit(type, lvl, team, sx + (rnd() - .5) * 2, sy + (rnd() - .5) * 2); u.drop = .35 + i * .06; units.push(u);
  });
  B.squads.push({team, x, y, type, lvl});
}
function resetWorld(){ units = []; projectiles = []; particles = []; corpses = []; waves = []; decals = []; texts = []; beams = []; clouds = []; ground = null; G.slowT = 0; G.lastKill = null; camReset(); }

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
// hauteur du torse (pour viser, saigner, afficher la vie)
const bodyY = (u, f = .55) => u.y - (unitH(u.type) * f + u.fh) * (u.sc || 1);

/* ---------- PARTICULES & EFFETS ---------- */
function burst(x, y, cols, n, spd, life, g = 120, up = 30, size = 1){
  if (particles.length > 1400) return;
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, s = spd * (.3 + rnd() * .7);
    particles.push({x, y, vx:Math.cos(a) * s, vy:Math.sin(a) * s * .6 - up * rnd(), life:life * (.6 + rnd() * .4), max:life, col:cols[Math.floor(rnd() * cols.length)], g, s:size + (rnd() < .3 ? 1 : 0)});
  }
}
const FIRE = ['#fff8c8', '#ffd35a', '#ff8a2a', '#e2541e'], SMOKE = ['#3a3346', '#5a5266', '#2a2433'], HOLY = ['#ffffff', '#fff2a0', '#ffd84a'], VOID = ['#f4d0ff', '#b25eff', '#7a3cb6'], ZAP = ['#ffffff', '#a0f4ff', '#3aa2e2'], TOX = ['#f0ffc4', '#9cff4c', '#3c9c2c'];
const teamGlow = team => team === 'blue' ? ['#f0fcff', '#64d8ff', '#2a7cd8'] : ['#fff4dc', '#ff8c3a', '#c42c1c'];
// mini police 3x5 pour les bulles de combat
const MICRO = {C:['111','100','100','100','111'],H:['101','101','111','101','101'],A:['010','101','111','101','101'],R:['110','101','110','101','101'],G:['111','100','101','101','111'],E:['111','100','110','100','111'],
  '!':['1','1','1','0','1'],T:['111','010','010','010','010'],I:['111','010','010','010','111'],N:['101','111','111','111','101'],B:['110','101','110','101','110'],O:['111','101','101','101','111'],M:['101','111','111','101','101'],P:['111','101','111','100','100'],S:['111','100','111','001','111'],K:['101','110','100','110','101'],L:['100','100','100','100','111'],U:['101','101','101','101','111'],V:['101','101','101','101','010'],D:['110','101','101','101','110'],'+':['000','010','111','010','000'],' ':['0','0','0','0','0']};
function popText(x, y, txt, col){ if (texts.length < 60) texts.push({x, y, txt, col, t:0}); }
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
const isFoe = (u, o) => !o.dead && o.team !== u.team && o.drop <= 0;
function pickTarget(u){
  const T = UT[u.type];
  // soigneuse : l'allié blessé le plus proche d'abord
  if (T.proj === 'heal') {
    let best = null, bd = (u.range + 70) ** 2;
    for (const o of units) {
      if (o === u || o.dead || o.team !== u.team || o.drop > 0 || o.hp > o.maxHp * .92) continue;
      const d = (o.x - u.x) ** 2 + (o.y - u.y) ** 2; if (d < bd) { bd = d; best = o; }
    }
    if (best) return best;
  }
  // artillerie : le groupe le plus serré
  if (T.aoe && T.proj) {
    let best = null, bs = -1e9;
    for (const o of units) {
      if (!isFoe(u, o)) continue;
      const d = Math.hypot(o.x - u.x, o.y - u.y); if (d > u.range + 90) continue;
      let n = 0; near(o.x, o.y, p => { if (p.team === o.team && !p.dead && Math.abs(p.x - o.x) < 30 && Math.hypot(p.x - o.x, p.y - o.y) < 30) n++; });
      const sc = n * 40 - d * .3 - (T.minR && d < T.minR ? 200 : 0);
      if (sc > bs) { bs = sc; best = o; }
    }
    if (best) return best;
  }
  // tireur d'élite : la cible la plus robuste à portée
  if (T.snipe) {
    let best = null, bh = 0;
    for (const o of units) if (isFoe(u, o) && Math.hypot(o.x - u.x, o.y - u.y) < u.range + 30 && o.maxHp > bh) { bh = o.maxHp; best = o; }
    if (best) return best;
  }
  let best = null, bd = 1e18;
  for (const o of units) {
    if (!isFoe(u, o)) continue;
    let d = (o.x - u.x) ** 2 + (o.y - u.y) ** 2;
    const O = UT[o.type];
    if (O.taunt && d < O.taunt ** 2) d *= .3; // provocation
    if (T.backline && O.proj) d *= .15;      // l'assassin file vers les tireurs
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}
function nearestThreat(u){
  let best = null, bd = 1e9;
  near(u.x, u.y, o => {
    if (!isFoe(u, o) || UT[o.type].proj) return;
    const d = Math.hypot(o.x - u.x, o.y - u.y); if (d < bd) { bd = d; best = o; }
  });
  return best ? {o:best, d:bd} : null;
}
// renvoie les dégâts réellement infligés
function damage(t, dmg, src, opts = {}){
  if (t.dead) return 0;
  const T = UT[t.type];
  if (T.dodge && !opts.aoe && rnd() < T.dodge) { if (rnd() < .4) popText(t.x, bodyY(t, 1) - 6, 'MISS', '#d8cfc0'); return 0; }
  let m = opts.pierce ? 1 : 1 - t.armor;
  if (opts.proj && T.resist) m *= T.resist;
  const dealt = Math.min(t.hp, dmg * m * (.9 + rnd() * .2));
  t.hp -= dealt; t.flash = .08;
  const hy = bodyY(t);
  if (!opts.quiet) {
    if (t.armor >= .3 && !opts.pierce) { burst(t.x, hy, ['#ffffff','#ffe9a0'], 3, 40, .25, 80, 10); sfx('clang'); }
    else if (t.type === 'golem' || t.type === 'tank' || t.type === 'mech' || t.type === 'drone') { burst(t.x, hy, ['#ffffff','#c8c0d0','#ffd27a'], 3, 40, .25, 80, 10); sfx('clang'); }
    else if (t.type === 'skel') { burst(t.x, hy, ['#ebe2c8','#ffffff'], 3, 40, .3, 120, 15); sfx('hit'); }
    else { burst(t.x, hy, ['#ffffff','#ffd27a','#d94040'], 3, 40, .3, 120, 15); sfx('hit'); }
  }
  if (opts.kb) { const dx = t.x - (src ? src.x : t.x), dy = t.y - (src ? src.y : t.y), d = Math.hypot(dx, dy) || 1; const k = opts.kb * (t.lord ? .06 : t.r >= 11 ? .35 : 1); t.kx += dx / d * k * 8; t.ky += dy / d * k * 8; }
  if (opts.burn) { t.burnT = 3; t.burnD = Math.max(t.burnD, opts.burn); }
  if (opts.poison) { t.poisonT = Math.max(t.poisonT, 1.2); t.poisonD = Math.max(t.poisonD, opts.poison); }
  if (opts.stun && rnd() < opts.stun) { t.stun = Math.max(t.stun, .8); popText(t.x, bodyY(t, 1) - 6, 'K O', '#ffd35a'); }
  if (t.hp <= 0) kill(t, src);
  return dealt;
}
const heal = (t, v) => { if (t.dead) return; const h = Math.min(v, t.maxHp - t.hp); t.hp += h; if (h > 1) burst(t.x, bodyY(t), HOLY, 3, 20, .5, -30, 10); };
const NO_RAISE = {tank:1, mech:1, drone:1, golem:1, mush:1, goblin:1};
function kill(u, src){
  u.dead = true; u.hp = 0;
  // les coups puissants (explosion, charge, bouclier) font voler le corps
  const kb = Math.hypot(u.kx, u.ky), fly = kb > 5 || u.fly, A = UNITS_ART[u.type];
  corpses.push({u, t:0, x:u.x, y:u.y, vx:fly ? u.kx * 3 : 0, vy:fly ? u.ky * 2 : 0, h:u.fh, vh:fly ? 40 + kb * 6 : 0,
    rot:0, spin:fly && !A.vehicle ? (u.kx >= 0 ? 1 : -1) * (7 + rnd() * 6) : 0, landed:!fly, lt:0});
  G.lastKill = {x:u.x, y:u.y};
  burst(u.x, u.y - 12, [TEAM_PAL[u.team].T, TEAM_PAL[u.team].t, '#d8cfc0'], 10, 50, .6, 140, 30);
  if (A.vehicle || u.type === 'golem') { burst(u.x, u.y - 10, FIRE, 14, 60, .5, 40, 40, 2); burst(u.x, u.y - 10, SMOKE, 10, 30, 1, -30, 20, 2); sfx('boom'); G.shake = Math.max(G.shake, 2); }
  else sfx('die');
  if (u.type === 'mush') clouds.push({x:u.x, y:u.y, r:30, t:0, max:4, team:u.team, dps:u.dmg * .9});
  // nécromancie : le mort se relève dans le camp du nécromancien
  if (!NO_RAISE[u.type] && !u.lord && units.length < MAXU) {
    for (const n of units) {
      if (n.dead || n.team === u.team || !UT[n.type].raise || Math.hypot(n.x - u.x, n.y - u.y) > 90 || rnd() > .45) continue;
      const s = makeUnit('skel', n.lvl, n.team, u.x, u.y); s.drop = .5; s.raised = true; units.push(s);
      burst(u.x, u.y - 4, VOID, 10, 30, .7, -40, 20); sfx('raise'); break;
    }
  }
}
// silhouette assombrie pour les corps incrustés dans le sol
function corpseSprite(u){
  const key = `c${u.type}${u.lvl}${u.team}`;
  let c = sprCache.get(key); if (c) return c;
  const s = bodySprite(u.type, u.lvl, u.team, 0, false);
  c = document.createElement('canvas'); c.width = s.width; c.height = s.height;
  const x = c.getContext('2d'); x.drawImage(s, 0, 0);
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(40,20,30,.42)'; x.fillRect(0, 0, c.width, c.height);
  sprCache.set(key, c); return c;
}
function drawCorpse(c, k, s){
  const u = k.u, sc = u.sc || 1;
  c.save(); c.translate(Math.round(k.x * HR) / HR, Math.round((k.y - 3 - k.h) * HR) / HR);
  c.rotate(k.rot); c.scale(u.face * sc / HR, sc / HR); c.drawImage(s, -s.width / 2, -s.height + 2); c.restore();
}
function bakeCorpse(k){
  if (!ground) return;
  const g = ground.getContext('2d'), x = Math.round(k.x), y = Math.round(k.y);
  g.setTransform(HR, 0, 0, HR, 0, 0);
  if (!UNITS_ART[k.u.type].vehicle && k.u.type !== 'golem') {
    g.fillStyle = k.u.type === 'skel' ? 'rgba(220,210,190,.5)' : 'rgba(110,20,30,.55)';
    for (let i = 0; i < 6; i++) g.fillRect(x + Math.round((rnd() - .5) * 10), y - 1 + Math.round((rnd() - .5) * 4), 1 + (rnd() < .4 ? 1 : 0), 1);
  } else { g.fillStyle = 'rgba(25,18,20,.35)'; for (let i = 0; i < 10; i++) g.fillRect(x + Math.round((rnd() - .5) * 18), y - 1 + Math.round((rnd() - .5) * 6), 2, 1); }
  g.globalAlpha = .9; drawCorpse(g, k, corpseSprite(k.u)); g.globalAlpha = 1;
  g.setTransform(1, 0, 0, 1, 0, 0);
}
function stepCorpses(dt){
  for (const k of corpses) {
    k.t += dt;
    if (!k.landed) {
      k.x += k.vx * dt; k.y += k.vy * dt; k.h += k.vh * dt; k.vh -= 330 * dt; k.rot += k.spin * dt;
      if (k.h <= 0 && k.vh < 0) {
        k.h = 0; k.landed = true; k.lt = k.t; k.rot = UNITS_ART[k.u.type].vehicle ? 0 : (k.spin >= 0 ? 1 : -1) * Math.PI / 2;
        k.x = clamp(k.x, 6, G.W - 6); k.y = clamp(k.y, 36, G.Hw - 2);
        burst(k.x, k.y, ['#d8cfc0', '#a89a80'], 6, 40, .4, 60, 8); sfx('land');
      }
    } else if (!k.spin && !UNITS_ART[k.u.type].vehicle) k.rot = Math.PI / 2 * Math.min(1, k.t * 5);
    if (k.landed && k.t - k.lt > .45) { bakeCorpse(k); k.done = true; }
  }
  corpses = corpses.filter(k => !k.done);
}
// position de la main (ou de la bouche du canon) dans le monde
function handPos(u){
  const A = UNITS_ART[u.type], sc = u.sc || 1, m = A.muzzle || A.hand;
  return [u.x + u.face * (m[0] - A.w / 2) / HR * sc, u.y - ((A.h - 1 - m[1]) / HR + u.fh) * sc];
}
function shoot(u, t, k, o = {}){
  const [hx, hy] = handPos(u), d = Math.hypot(t.x - u.x, t.y - u.y);
  const P = {arrow:[190, .25, .22], bomb:[200, .5, .25], fire:[170, .3, .18], shell:[260, .25, .12], rocket:[150, .2, .06], bullet:[520, .02, 0], bolt:[300, .05, 0], shadow:[150, .1, 0], heal:[170, .1, .05]}[k];
  const dur = P[1] + d / P[0], ty = bodyY(t);
  const lead = k === 'bullet' ? 0 : .8, tx = t.x + t.vx * dur * lead, tyy = ty + t.vy * dur * lead;
  projectiles.push(Object.assign({k, x0:hx, y0:hy, x1:tx, y1:tyy, gy:t.y + t.vy * dur * lead, p:0, dur, h:k === 'arrow' ? 8 + d * .22 : k === 'bomb' ? 16 + d * .25 : P[2] * d,
    dmg:u.dmg, team:u.team, tgt:t, sx:u.x, x:hx, y:hy, src:u, delay:0, col:u.type === 'elf' ? '#9cff4c' : null}, o));
}
// rayon instantané : touche la cible et tout ce qui est aligné derrière
function laser(u, t){
  const [hx, hy] = handPos(u), dx = t.x - u.x, dy = t.y - u.y, d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d, L = u.range + 30;
  for (const o of units) {
    if (!isFoe(u, o)) continue;
    const rx = o.x - u.x, ry = o.y - u.y, along = rx * nx + ry * ny, lat = Math.abs(rx * ny - ry * nx);
    if (along > 0 && along < L && lat < 5 + o.r * .4) {
      if (UT[o.type].deflect && rnd() < UT[o.type].deflect) { burst(o.x, bodyY(o), teamGlow(o.team), 5, 50, .25, 0, 0); continue; }
      damage(o, u.dmg * (o === t ? 1 : .7), u, {pierce:true, proj:true, quiet:o !== t});
    }
  }
  beams.push({x0:hx, y0:hy, x1:hx + nx * L, y1:hy + ny * L, t:0, max:.18, cols:['#ffffff', '#ff5c4c', '#a01a1a'], w:2});
  sfx('laser');
}
function chain(u, t){
  const hit = new Set(); let cur = t, [px, py] = handPos(u), dmg = u.dmg;
  for (let k = 0; k < 4 && cur; k++) {
    hit.add(cur); const cy = bodyY(cur);
    beams.push({x0:px, y0:py, x1:cur.x, y1:cy, t:0, max:.25, cols:ZAP, zig:true});
    damage(cur, dmg, u, {quiet:k > 0}); burst(cur.x, cy, ZAP, 4, 40, .2, 0, 0);
    px = cur.x; py = cy; dmg *= .75;
    let nx = null, nd = 46; near(cur.x, cur.y, o => { if (!isFoe(u, o) || hit.has(o)) return; const d = Math.hypot(o.x - cur.x, o.y - cur.y); if (d < nd) { nd = d; nx = o; } });
    cur = nx;
  }
  sfx('zap');
}
// cône de flammes (lance-flammes, dragon)
function flames(u, t){
  const [hx, hy] = handPos(u), a = Math.atan2(t.y - u.y, t.x - u.x), R = u.range + u.r + 6;
  near(u.x, u.y, o => {
    if (!isFoe(u, o)) return;
    const dx = o.x - u.x, dy = o.y - u.y, d = Math.hypot(dx, dy); if (d > R + o.r) return;
    let da = Math.abs(Math.atan2(dy, dx) - a); if (da > Math.PI) da = Math.PI * 2 - da;
    if (da < .55 || d < 8) damage(o, u.dmg, u, {burn:UT[u.type].burn * DMGM(u.lvl), quiet:true});
  });
  if (particles.length < 1300) for (let i = 0; i < 7; i++) {
    const aa = a + (rnd() - .5) * .9, s = 70 + rnd() * 60;
    particles.push({x:hx, y:hy, vx:Math.cos(aa) * s, vy:Math.sin(aa) * s * .7 - 6, life:.3 + rnd() * .15, max:.4, col:FIRE[Math.floor(rnd() * 4)], g:-40, s:1 + (rnd() < .4 ? 1 : 0)});
  }
  sfx('flame');
}
function attack(u, t){
  const T = UT[u.type];
  if (T.boom) { blast(u.x, u.y - 2, T.boom, u.dmg, u.team, 1.4, u); u.kx = u.ky = 0; kill(u); return; }
  if (T.proj) {
    if (t.team === u.team) { shoot(u, t, 'heal'); sfx('heal'); return; }
    switch (T.proj) {
      case 'laser': laser(u, t); return;
      case 'chain': chain(u, t); return;
      case 'cone': flames(u, t); return;
      case 'heal': shoot(u, t, 'heal', {dmg:u.dmg * .7}); sfx('magic'); return;
      case 'bullet': case 'rocket': {
        const n = T.burst || 1;
        for (let i = 0; i < n; i++) shoot(u, t, T.proj, {delay:i * (T.proj === 'rocket' ? .22 : .09), x1:t.x + (n > 1 ? (rnd() - .5) * 12 : 0), y1:bodyY(t) + (n > 1 ? (rnd() - .5) * 8 : 0), aoe:T.aoe});
        sfx(T.proj === 'rocket' ? 'rocket' : 'gun'); return;
      }
      case 'bomb': shoot(u, t, 'bomb', {x1:t.x + (rnd() - .5) * 8, y1:t.y + (rnd() - .5) * 6, aoe:T.aoe, fuse:.35}); sfx('throw'); return;
      case 'shell': shoot(u, t, 'shell', {x1:t.x + (rnd() - .5) * 6, y1:t.y + (rnd() - .5) * 4, aoe:T.aoe}); sfx('cannon'); G.shake = Math.max(G.shake, 1); return;
      case 'fire': shoot(u, t, 'fire', {x1:t.x, y1:t.y, aoe:T.aoe, burn:T.burn * DMGM(u.lvl)}); sfx('magic'); return;
      case 'shadow': shoot(u, t, 'shadow'); sfx('magic'); return;
      default: shoot(u, t, T.proj); sfx('shoot'); return;
    }
  }
  // mêlée
  let mult = T.rage ? 2 - u.hp / u.maxHp : 1, kb = T.kb || 0;
  if (u.charging) { mult *= T.charge; kb = Math.max(kb, 1.2); u.charging = false; u.chargeCd = 7; popText(t.x, bodyY(t, 1) - 8, 'CHARGE!', '#ffd35a'); sfx('bash'); }
  // une pique brise les charges
  if (T.pierce && t.charging) { mult *= 2; t.charging = false; t.chargeCd = 7; t.stun = .6; popText(t.x, bodyY(t, 1) - 8, 'BRISE!', '#ffffff'); }
  const dealt = damage(t, u.dmg * mult, u, {kb, pierce:T.pierce, stun:T.stun});
  if (T.steal && dealt) { u.hp = Math.min(u.maxHp, u.hp + dealt * T.steal); burst(u.x, bodyY(u), ['#ff5c4c', '#a01a1a'], 3, 20, .4, -20, 5); }
  if (T.pierce) {
    // transperce : touche aussi l'ennemi derrière
    const dx = t.x - u.x, dy = t.y - u.y, d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
    for (const o of units) {
      if (o === t || !isFoe(u, o)) continue;
      const rx = o.x - t.x, ry = o.y - t.y, along = rx * nx + ry * ny, lat = Math.abs(rx * ny - ry * nx);
      if (along > 0 && along < 24 && lat < 9) { damage(o, u.dmg * .7, u, {pierce:true}); burst(o.x, o.y - 14, ['#ffffff'], 4, 50, .2, 0, 0); break; }
    }
    sfx('pierce');
  }
  if (T.cleave) {
    const sr = u.lord ? 30 : T.cleave + t.r * .5;
    for (const o of units) if (o !== t && isFoe(u, o) && Math.hypot(o.x - t.x, o.y - t.y) < sr && (o.x - u.x) * u.face > -6) damage(o, u.dmg * mult * .55, u, {kb:kb * .7, quiet:true});
    if (u.r >= 11 || u.lord) { G.shake = Math.max(G.shake, u.lord ? 3.5 : 1.5); sfx(u.lord ? 'boom' : 'bash'); }
    waves.push({x:t.x, y:t.y, t:0, max:.2, r:sr * .8, col:'#ffffff'});
  }
}
// explosion : dégâts dégressifs + recul
function blast(x, y, r, dmg, team, kb, src, burn){
  for (const u of units) {
    if (u.dead || u.team === team || u.drop > 0) continue;
    const d = Math.hypot(u.x - x, u.y - y);
    if (d < r + u.r) damage(u, dmg * (1 - .5 * d / (r + u.r)), {x, y}, {kb:kb * (1 - d / (r + u.r)), aoe:true, burn, quiet:true});
  }
  waves.push({x, y, t:0, max:.3, r});
  decals.push({k:'scorch', x, y, r:Math.round(r * .55), t:0, max:7});
  burst(x, y - 3, FIRE, 18, 80, .45, 40, 40, 2);
  burst(x, y - 3, SMOKE, 10, 35, .9, -30, 20, 2);
  G.shake = Math.max(G.shake, 3); sfx('boom');
}
// tir bloqué de face par un bouclier, ou dévié par une lame d'énergie
function blocked(hit, p){
  const H = UT[hit.type];
  const front = H.block && Math.sign(p.sx - hit.x) === hit.face && rnd() < H.block, defl = H.deflect && rnd() < H.deflect;
  if (!front && !defl) return false;
  burst(hit.x + hit.face * 6, bodyY(hit), defl ? teamGlow(hit.team) : ['#ffffff','#ffe9a0'], 5, 50, .25, 60, 10); sfx('block');
  if (rnd() < .3) popText(hit.x, bodyY(hit, 1) - 8, defl ? 'RENVOI' : 'BLOK', '#ffffff');
  return true;
}
function sim(dt){
  G.time += dt;
  buildGrid();
  for (const u of units) {
    if (u.dead) continue;
    const T = UT[u.type];
    u.fh = u.fly ? flyH(u, G.time) : 0;
    u.cd -= dt; u.atk = Math.max(0, u.atk - dt / .32); u.chargeCd -= dt;
    // états : brûlure, poison, régénération, auras
    if (u.burnT > 0) { u.burnT -= dt; u.hp -= u.burnD * dt; if (rnd() < dt * 12) particles.push({x:u.x + (rnd() - .5) * 6, y:bodyY(u, .4 + rnd() * .5), vx:0, vy:-18, life:.35, max:.35, col:FIRE[Math.floor(rnd() * 4)], g:0, s:1}); if (u.burnT <= 0) u.burnD = 0; }
    if (u.poisonT > 0) { u.poisonT -= dt; u.hp -= u.poisonD * dt; if (rnd() < dt * 6) particles.push({x:u.x + (rnd() - .5) * 6, y:bodyY(u, .8), vx:0, vy:-10, life:.4, max:.4, col:TOX[Math.floor(rnd() * 3)], g:0, s:1}); }
    if (T.regen && u.burnT <= 0) u.hp = Math.min(u.maxHp, u.hp + T.regen * HPM(u.lvl) * dt);
    if (u.hp <= 0 && !u.dead) { kill(u); continue; }
    if (T.aura && (u.auraT -= dt) <= 0) {
      u.auraT = 2; const v = T.aura * DMGM(u.lvl);
      near(u.x, u.y, o => { if (!o.dead && o.team === u.team && Math.hypot(o.x - u.x, o.y - u.y) < 42) heal(o, v); });
      waves.push({x:u.x, y:u.y, t:0, max:.4, r:40, col:'#fff2a0'});
    }
    if (T.spores && (u.sporeT -= dt) <= 0 && u.drop <= 0) { u.sporeT = 3; clouds.push({x:u.x, y:u.y, r:22, t:0, max:2.5, team:u.team, dps:u.dmg * .8}); }
    const ox = u.x, oy = u.y;
    if (u.kx || u.ky) { u.x += u.kx * dt; u.y += u.ky * dt; const f = Math.exp(-8 * dt); u.kx *= f; u.ky *= f; if (Math.abs(u.kx) + Math.abs(u.ky) < .5) u.kx = u.ky = 0; }
    if (u.drop > 0) continue;
    if (u.stun > 0) { u.stun -= dt; u.moving = false; continue; }
    u.rt -= dt;
    if (!u.target || u.target.dead || u.rt <= 0) { u.target = pickTarget(u); u.rt = .35 + rnd() * .25; }
    const t = u.target; u.moving = false;
    if (!t) { u.charging = false; continue; }
    const dx = t.x - u.x, dy = t.y - u.y, d = Math.hypot(dx, dy) || .01;
    u.aim = Math.atan2(dy - (t.fh - u.fh) * .5, Math.abs(dx));
    const reach = u.range + u.r + t.r;
    // repli des tireurs
    if (T.kite && t.team !== u.team) {
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
    // charge
    if (T.charge && !u.charging && u.chargeCd <= 0 && d > 34 && d < 110 && t.team !== u.team) { u.charging = true; sfx('charge'); }
    if (d > reach) {
      const sp = u.spd * (u.charging ? (u.spd > 45 ? 1.7 : 2.6) : 1);
      u.x += dx / d * sp * dt; u.y += dy / d * sp * dt; u.moving = true; u.walk += dt;
      if (u.charging && !u.fly && rnd() < .5) particles.push({x:u.x - u.face * 4, y:u.y, vx:-u.face * 10, vy:-8, life:.35, max:.35, col:'#d8cfc0', g:0, s:1 + (rnd() < .5 ? 1 : 0)});
    } else if (u.cd <= 0) {
      if (T.minR && d < T.minR) { /* trop près pour tirer */ }
      else { attack(u, t); u.cd = u.cdMax * (.9 + rnd() * .2); u.atk = 1; }
    }
    u.vx = (u.x - ox) / Math.max(dt, .001); u.vy = (u.y - oy) / Math.max(dt, .001);
  }
  // séparation (les corps se bousculent ; les volants passent au-dessus)
  for (const a of units) {
    if (a.dead || a.drop > 0) continue;
    near(a.x, a.y, b => {
      if (b.id <= a.id || b.dead || a.fly !== b.fly) return;
      const dx = b.x - a.x; if (dx > 30 || dx < -30) return;
      const dy = b.y - a.y; if (dy > 30 || dy < -30) return;
      const rr = a.r + b.r, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr) {
        const d = Math.sqrt(d2) || .01, push = (rr - d) * .5, nx = dx / d, ny = dy / d;
        const wa = a.lord ? .04 : a.r >= 11 ? .25 : 1, wb = b.lord ? .04 : b.r >= 11 ? .25 : 1, s = wa + wb;
        a.x -= nx * push * 2 * wa / s; a.y -= ny * push * 2 * wa / s; b.x += nx * push * 2 * wb / s; b.y += ny * push * 2 * wb / s;
      }
    });
  }
  for (const u of units) { u.x = clamp(u.x, 6, G.W - 6); u.y = clamp(u.y, 36, G.Hw - 2); }
  // nuages toxiques
  for (const cl of clouds) {
    cl.t += dt;
    near(cl.x, cl.y, o => { if (!o.dead && o.team !== cl.team && Math.hypot(o.x - cl.x, o.y - cl.y) < cl.r + o.r * .5) { o.poisonT = Math.max(o.poisonT, .8); o.poisonD = Math.max(o.poisonD, cl.dps); } });
  }
  clouds = clouds.filter(c => c.t < c.max);
  // projectiles
  for (const p of projectiles) {
    if (p.delay > 0) { p.delay -= dt; if (p.delay <= 0 && p.src && !p.src.dead) { const [hx, hy] = handPos(p.src); p.x0 = p.x = hx; p.y0 = p.y = hy; } continue; }
    if (p.landed) { p.fuse -= dt; if (p.fuse <= 0) { blast(p.x1, p.y1, p.aoe, p.dmg, p.team, 1.6); p.done = true; } continue; }
    p.p += dt / p.dur; const q = Math.min(1, p.p);
    const px = p.x, py = p.y - (p.hh || 0);
    p.x = p.x0 + (p.x1 - p.x0) * q; p.y = p.y0 + (p.y1 - p.y0) * q; p.hh = Math.sin(q * Math.PI) * p.h;
    p.ang = Math.atan2(p.y - p.hh - py, p.x - px);
    if ((p.k === 'rocket' || p.k === 'shell' || p.k === 'fire') && rnd() < .6) particles.push({x:p.x, y:p.y - p.hh, vx:(rnd() - .5) * 6, vy:-6, life:.4, max:.4, col:p.k === 'fire' ? FIRE[Math.floor(rnd() * 4)] : SMOKE[Math.floor(rnd() * 3)], g:0, s:1});
    if (p.k === 'shadow' && rnd() < .5) particles.push({x:p.x, y:p.y, vx:0, vy:-4, life:.3, max:.3, col:VOID[Math.floor(rnd() * 3)], g:0, s:1});
    if (p.p >= 1) { land(p); }
  }
  projectiles = projectiles.filter(p => !p.done);
  units = units.filter(u => !u.dead);
}
function land(p){
  switch (p.k) {
    case 'bomb': p.landed = true; p.x = p.x1; p.y = p.y1; p.hh = 0; sfx('land'); return;
    case 'shell': case 'rocket': p.done = true; blast(p.x1, p.k === 'rocket' ? p.gy || p.y1 : p.y1, p.aoe, p.dmg, p.team, 1.6); return;
    case 'fire': p.done = true; blast(p.x1, p.y1, p.aoe, p.dmg, p.team, .6, null, p.burn); return;
    case 'heal': p.done = true;
      if (p.tgt && p.tgt.team === p.team) heal(p.tgt, p.dmg);
      else if (p.tgt && !p.tgt.dead && Math.hypot(p.tgt.x - p.x1, bodyY(p.tgt) - p.y1) < 12) { damage(p.tgt, p.dmg, null, {proj:true}); burst(p.x1, p.y1, HOLY, 5, 40, .3, 0, 0); }
      return;
  }
  p.done = true;
  // flèches, balles, éclairs : touchent la cible ou ce qui se trouve là
  let hit = null; const t = p.tgt;
  if (t && !t.dead && Math.hypot(t.x - p.x1, bodyY(t) - p.y1) < 11) hit = t;
  else for (const o of units) if (!o.dead && o.team !== p.team && Math.hypot(o.x - p.x1, bodyY(o) - p.y1) < 8) { hit = o; break; }
  if (hit) {
    if (blocked(hit, p)) return;
    damage(hit, p.dmg, p.src, {proj:true});
    if (p.k === 'shadow') burst(p.x1, p.y1, VOID, 5, 40, .3, 0, 0);
  } else if (p.k === 'arrow') decals.push({k:'arrow', x:p.x1, y:p.gy != null ? p.gy : p.y1 + 8, t:0, max:3, a:p.ang});
}
function stepFx(dt){
  for (const u of units) {
    u.flash = Math.max(0, u.flash - dt);
    if (u.drop > 0) { u.drop -= dt; if (u.drop <= 0) { u.drop = 0; burst(u.x, u.y, ['#d8cfc0','#a89a80'], 6, 30, .35, 60, 5); sfx('land'); } }
  }
  for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= dt; }
  particles = particles.filter(p => p.life > 0);
  stepCorpses(dt);
  for (const a of [waves, decals, texts, beams]) a.forEach(o => o.t += dt);
  waves = waves.filter(w => w.t < w.max); decals = decals.filter(d => d.t < d.max); texts = texts.filter(o => o.t < 1); beams = beams.filter(b => b.t < b.max);
  G.shake = Math.max(0, G.shake - dt * 16);
}

/* ---------- RENDU (basse résolution ×2 puis agrandi) ---------- */
function pixLine(c, x0, y0, x1, y1, col){
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  c.fillStyle = col;
  for (let k = 0; k < 800; k++) { c.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
// trait fin, à la résolution des sprites
function hrLine(c, x0, y0, x1, y1, col){ c.save(); c.scale(1 / HR, 1 / HR); pixLine(c, x0 * HR, y0 * HR, x1 * HR, y1 * HR, col); c.restore(); }
function pixCircle(c, cx, cy, r, col, dash){
  c.fillStyle = col; const n = Math.max(16, Math.round(r * 2.4));
  for (let i = 0; i < n; i++) { if (dash && (i % 4 > 1)) continue; const a = i / n * Math.PI * 2; c.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * .55), 1, 1); }
}
function drawBeam(c, b){
  const q = b.t / b.max, col = b.cols[Math.min(2, Math.floor(q * 3))];
  if (b.zig) {
    let px = b.x0, py = b.y0; const n = 5;
    for (let i = 1; i <= n; i++) {
      const f = i / n, x = b.x0 + (b.x1 - b.x0) * f + (i < n ? (rnd() - .5) * 6 : 0), y = b.y0 + (b.y1 - b.y0) * f + (i < n ? (rnd() - .5) * 6 : 0);
      hrLine(c, px, py, x, y, col); hrLine(c, px + .5, py, x + .5, y, b.cols[1]); px = x; py = y;
    }
  } else { hrLine(c, b.x0, b.y0 - .5, b.x1, b.y1 - .5, b.cols[1]); hrLine(c, b.x0, b.y0, b.x1, b.y1, col); hrLine(c, b.x0, b.y0 + .5, b.x1, b.y1 + .5, b.cols[2]); }
}
function drawProjectile(c, p, t){
  if (p.delay > 0) return;
  const sh = pixEllipse(2, 1, 'rgba(0,0,0,.25)'); c.drawImage(sh, Math.round(p.x - 2), Math.round((p.gy != null ? p.y0 + (p.gy - p.y0) * Math.min(1, p.p) : p.y) - 1 + (p.k === 'arrow' ? 8 : 0)));
  const x = p.x, y = p.y - (p.hh || 0), ca = Math.cos(p.ang || 0), sa = Math.sin(p.ang || 0);
  switch (p.k) {
    case 'arrow':
      hrLine(c, x - ca * 6, y - sa * 6, x, y, '#c9925a');
      c.fillStyle = '#ffffff'; c.fillRect(Math.round(x + ca), Math.round(y + sa), 1, 1);
      c.fillStyle = p.col || TEAM_PAL[p.team].T; c.fillRect(Math.round(x - ca * 6), Math.round(y - sa * 6), 1, 1); break;
    case 'bomb': {
      const s = weaponSprite('bomb', 1, p.team, p.landed && Math.floor(t * 16) % 2 === 0);
      c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(1 / HR, 1 / HR); c.drawImage(s, -8, -14); c.restore();
      if (rnd() < .5) particles.push({x:p.x + 2, y:y - 7, vx:(rnd() - .5) * 8, vy:-10, life:.25, max:.25, col:rnd() < .5 ? '#ffe066' : '#ff8a2a', g:0, s:1});
      break;
    }
    case 'fire': { const f = Math.floor(t * 12) % 2; c.drawImage(pixEllipse(3 + f, 3 + f, '#e2541e'), Math.round(x - 3 - f), Math.round(y - 3 - f)); c.drawImage(pixEllipse(2, 2, '#ffb432'), Math.round(x - 2), Math.round(y - 2)); c.fillStyle = '#fff8c8'; c.fillRect(Math.round(x - 1), Math.round(y - 1), 1, 1); break; }
    case 'shell': c.drawImage(pixEllipse(2, 1, '#2e2a3c'), Math.round(x - 2), Math.round(y - 1)); c.fillStyle = '#ffd35a'; c.fillRect(Math.round(x), Math.round(y), 1, 1); break;
    case 'rocket': hrLine(c, x - ca * 5, y - sa * 5, x, y, '#acb4c6'); c.fillStyle = '#e24a40'; c.fillRect(Math.round(x), Math.round(y), 1, 1); c.fillStyle = FIRE[Math.floor(t * 20) % 3]; c.fillRect(Math.round(x - ca * 6), Math.round(y - sa * 6), 1, 1); break;
    case 'bullet': hrLine(c, x - ca * 4, y - sa * 4, x, y, '#fff2a0'); hrLine(c, x - ca * 1, y - sa * 1, x, y, '#ffffff'); break;
    case 'bolt': { const g = teamGlow(p.team); hrLine(c, x - ca * 5, y - sa * 5, x, y, g[1]); hrLine(c, x - ca * 2, y - sa * 2, x, y, g[0]); break; }
    case 'shadow': c.drawImage(pixEllipse(2, 2, '#7a3cb6'), Math.round(x - 2), Math.round(y - 2)); c.fillStyle = '#f4d0ff'; c.fillRect(Math.round(x), Math.round(y - 1), 1, 1); break;
    case 'heal': c.drawImage(pixEllipse(2, 2, p.tgt && p.tgt.team === p.team ? '#ffd84a' : '#fff2a0'), Math.round(x - 2), Math.round(y - 2)); c.fillStyle = '#ffffff'; c.fillRect(Math.round(x), Math.round(y), 1, 1); break;
  }
}
function render(t){
  const c = actx; c.imageSmoothingEnabled = false; c.setTransform(HR, 0, 0, HR, 0, 0);
  ensureGround(); c.drawImage(ground, 0, 0, G.W, ground.height / HR);
  const deploy = B.mode === 'story' && B.phase === 'deploy';
  if (deploy) drawZones(t);
  for (const d of decals) {
    if (d.k === 'scorch') { const e = pixEllipse(d.r, Math.round(d.r * .45), `rgba(30,20,15,${(.22 * (1 - d.t / d.max)).toFixed(2)})`); c.drawImage(e, Math.round(d.x - d.r), Math.round(d.y - d.r * .45)); }
    else { c.globalAlpha = 1 - d.t / d.max; hrLine(c, d.x, d.y, d.x - Math.cos(d.a) * 5, d.y - Math.sin(d.a) * 5 - 1, '#8a5a2b'); c.fillStyle = '#e04646'; c.fillRect(Math.round(d.x - Math.cos(d.a) * 5), Math.round(d.y - Math.sin(d.a) * 5 - 1), 1, 1); c.globalAlpha = 1; }
  }
  for (const cl of clouds) {
    const q = cl.t / cl.max, a = Math.min(1, (1 - q) * 3) * .3, r = Math.round(cl.r * (.6 + Math.min(1, cl.t * 3) * .4));
    c.drawImage(pixEllipse(r, Math.round(r * .5), `rgba(140,230,70,${a.toFixed(2)})`), Math.round(cl.x - r), Math.round(cl.y - r * .5));
    if (rnd() < .3) particles.push({x:cl.x + (rnd() - .5) * r * 2, y:cl.y + (rnd() - .5) * r, vx:0, vy:-6, life:.6, max:.6, col:TOX[Math.floor(rnd() * 3)], g:0, s:1});
  }
  for (const k of corpses) {
    if (k.h > 0) { const sh = pixEllipse(5, 2, 'rgba(0,0,0,.25)'); c.drawImage(sh, Math.round(k.x - 5), Math.round(k.y - 2)); }
    drawCorpse(c, k, bodySprite(k.u.type, k.u.lvl, k.u.team, 0, false));
  }
  // les volants sont dessinés après les soldats au sol
  const sorted = units.slice().sort((a, b) => (a.fly - b.fly) || (a.y - b.y));
  for (const u of sorted) {
    if (u.drop > 0) {
      const sh = pixEllipse(Math.max(1, Math.round(7 * (1 - u.drop))), 2, 'rgba(0,0,0,.25)');
      c.drawImage(sh, Math.round(u.x - sh.width / 2), Math.round(u.y - 2));
      drawUnitAt(c, u, u.x, u.y - u.drop * 130, t, clamp(1 - u.drop * 2, 0, 1));
    } else drawUnitAt(c, u, u.x, u.y, t);
  }
  for (const p of projectiles) drawProjectile(c, p, t);
  for (const b of beams) drawBeam(c, b);
  for (const w of waves) { const q = w.t / w.max; pixCircle(c, w.x, w.y, w.r * (.3 + q * .8), w.col || (q < .5 ? '#fff2a8' : '#ff8a2a')); }
  for (const p of particles) { c.globalAlpha = clamp(p.life / p.max * 1.5, 0, 1); c.fillStyle = p.col; const z = Math.ceil(p.s * 1.5) / HR; c.fillRect(Math.round(p.x * HR) / HR, Math.round(p.y * HR) / HR, z, z); }
  c.globalAlpha = 1;
  for (const u of units) {
    if (u.hp >= u.maxHp || u.drop > 0) continue;
    const w = clamp(Math.round(u.r * 1.6), 10, 28) * (u.sc || 1), x = Math.round(u.x - w / 2), y = Math.round(u.y - (unitH(u.type) + u.fh) * (u.sc || 1) - 1);
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
  ctx.drawImage(art, cm.x * HR, cm.y * HR, G.W / cm.z * HR, G.Hw / cm.z * HR, sx, sy, G.W * G.k * DPR, G.Hw * G.k * DPR);
  // bandes noires « cinéma » pendant le ralenti final
  if (G.slowT > 0) { const bh = Math.round(cv.height * .06 * Math.min(1, G.slowT * 3)); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, bh); ctx.fillRect(0, cv.height - bh, cv.width, bh); }
}
function drawZones(t){
  const c = actx;
  for (const team of ['red', 'blue']) {
    const z = zone(team), top = team === 'red' ? 0 : z.y0, bot = team === 'red' ? z.y1 : G.Hw;
    c.fillStyle = team === 'red' ? 'rgba(217,64,64,.1)' : `rgba(77,141,255,${(.1 + .04 * (Math.floor(t * 2) % 2)).toFixed(2)})`;
    c.fillRect(0, top, G.W, bot - top);
    const ly = team === 'red' ? z.y1 : z.y0;
    c.fillStyle = team === 'red' ? 'rgba(255,84,104,.75)' : 'rgba(160,200,255,.85)';
    for (let x = 2; x < G.W; x += 6) c.fillRect(x, ly, 3, 1);
  }
}
