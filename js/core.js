/* Légion Pixel — Données des unités, sauvegarde, son, interface pixel, écrans et menu */
'use strict';
/* =========================================================
   LÉGION PIXEL — draft & bataille, 100 % pixel art, hors ligne
   ========================================================= */
const SAVE_KEY = 'legion-pixel-save-v1';
const $ = s => document.querySelector(s);
const rnd = Math.random;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const DPR = Math.max(1, Math.min(3, Math.round(window.devicePixelRatio || 1)));
const PX = 3; // taille d'un pixel d'interface en px CSS

/* ---------- UNITÉS ---------- */
const UT = {
  sword: {name:'Épéiste', role:'Mêlée', ic:'atk', hp:130, dmg:17, range:8, cd:.75, spd:40, squad:6, armor:.2, r:7, unlock:0,
    ab:'Charge', abd:'Fonce sur sa cible et double les dégâts de son premier coup. Se recharge en 7 s.',
    good:'Archers, Grenadiers', bad:'Lanciers, Gardiens',
    desc:'Chevalier errant, rapide et bien protégé. Idéal pour plonger sur la ligne arrière.'},
  archer:{name:'Archère', role:'Distance', ic:'range', hp:60, dmg:15, range:135, cd:1.4, spd:32, squad:6, armor:0, r:6, unlock:0, proj:'arrow', kite:28,
    ab:'Volée', abd:'Tire en cloche à très longue portée et recule quand un ennemi s’approche.',
    good:'Lanciers, Grenadiers', bad:'Épéistes, Gardiens',
    desc:'Éclaireuse des bois. Fragile, mais elle arrose l’ennemi bien avant le contact.'},
  spear: {name:'Lancier', role:'Allonge', ic:'spear', hp:110, dmg:22, range:26, cd:1.3, spd:32, squad:6, armor:.15, r:7, unlock:2, pierce:true,
    ab:'Transperce', abd:'Ignore l’armure et touche aussi l’ennemi placé derrière sa cible. Brise les charges.',
    good:'Gardiens, Épéistes', bad:'Archères, Grenadiers',
    desc:'Lansquenet à la pique interminable. Il tient la ligne et punit les cavaliers téméraires.'},
  guard: {name:'Gardien', role:'Tank', ic:'shield', hp:560, dmg:16, range:10, cd:1.25, spd:21, squad:2, armor:.5, r:11, unlock:5, taunt:80,
    ab:'Rempart', abd:'Attire les ennemis proches, bloque les flèches de face et repousse au bouclier.',
    good:'Archères, Épéistes', bad:'Lanciers',
    desc:'Colosse en armure de plates. Seul, mais il vaut une escouade entière en défense.'},
  bomber:{name:'Sapeur', role:'Zone', ic:'bomb', hp:75, dmg:34, range:105, minR:30, cd:2.8, spd:26, squad:4, armor:0, r:7, unlock:9, proj:'bomb', aoe:30, kite:34,
    ab:'Grenade', abd:'Vise le groupe le plus serré. L’explosion blesse et repousse. Inutile à bout portant.',
    good:'Groupes serrés, Lanciers', bad:'Épéistes, Archères',
    desc:'Artificier barbu à lunettes. Lent à recharger, dévastateur sur une formation compacte.'}
};
const TYPES = Object.keys(UT);
const HPM = l => Math.pow(1.27, l - 1), DMGM = l => Math.pow(1.22, l - 1);
const UP_N = [0, 3, 6, 12, 20], UP_G = [0, 80, 200, 500, 1200];
const LVL_NAMES = ['', 'Cuir', 'Fer', 'Acier', 'Or', 'Mythique'];
const CHAPTERS = [
  {name:'Plaines d’Émeraude', theme:'grass'}, {name:'Forêt des Brumes', theme:'forest'},
  {name:'Dunes Ardentes', theme:'sand'}, {name:'Toundra Glacée', theme:'snow'}];
const NLEV = CHAPTERS.length * 5;
const lvLabel = i => `${Math.ceil(i / 5)}-${(i - 1) % 5 + 1}`;

/* ---------- SAUVEGARDE ---------- */
const defSave = () => ({v:2, gold:120, sound:true, cleared:0, stars:{}, lastFree:0,
  cards:{sword:{lvl:1,n:0,u:true},archer:{lvl:1,n:0,u:true},spear:{lvl:1,n:0,u:false},guard:{lvl:1,n:0,u:false},bomber:{lvl:1,n:0,u:false}}});
let SAV;
function load(){
  let d = null; try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch(e) {}
  SAV = Object.assign(defSave(), d || {});
  const dc = defSave().cards;
  for (const k in dc) SAV.cards[k] = Object.assign(dc[k], (d && d.cards && d.cards[k]) || {});
}
function save(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAV)); } catch(e) {} }
load();
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}

/* ---------- SON 8-BIT ---------- */
let AC = null, MASTER = null, NOISE = null; const lastS = {};
function ac(){
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); MASTER = AC.createGain(); MASTER.gain.value = .5; MASTER.connect(AC.destination); } catch(e) { return null; } }
  if (AC.state === 'suspended') AC.resume(); return AC;
}
function tone(f1, f2, dur, type, vol, delay = 0){
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f1, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(MASTER); o.start(t); o.stop(t + dur + .02);
}
function noise(dur, vol, freq, delay = 0){
  if (!NOISE) { NOISE = AC.createBuffer(1, AC.sampleRate * .6, AC.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = AC.currentTime + delay, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = NOISE; f.type = 'lowpass'; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(MASTER); s.start(t); s.stop(t + dur + .02);
}
function sfx(n){
  if (!SAV.sound || !ac()) return;
  const now = performance.now(); if (lastS[n] && now - lastS[n] < 45) return; lastS[n] = now;
  try { switch (n) {
    case 'hit': noise(.06, .18, 1800); break;
    case 'clang': tone(1500, 900, .08, 'square', .04); noise(.04, .1, 4000); break;
    case 'block': tone(2200, 1800, .1, 'square', .05); break;
    case 'shoot': tone(900, 380, .09, 'triangle', .07); break;
    case 'throw': tone(300, 600, .12, 'sine', .07); break;
    case 'boom': noise(.45, .45, 700); tone(140, 40, .35, 'sine', .3); break;
    case 'charge': tone(200, 500, .25, 'sawtooth', .05); break;
    case 'pierce': tone(700, 200, .12, 'sawtooth', .05); noise(.05, .1, 2500); break;
    case 'bash': noise(.1, .25, 500); tone(160, 80, .12, 'square', .07); break;
    case 'die': tone(320, 90, .2, 'square', .045); break;
    case 'place': tone(520, 0, .06, 'square', .06); tone(780, 0, .08, 'square', .05, .05); break;
    case 'land': noise(.08, .12, 600); break;
    case 'click': tone(660, 0, .04, 'square', .05); break;
    case 'coin': tone(988, 0, .07, 'square', .06); tone(1319, 0, .12, 'square', .06, .07); break;
    case 'horn': tone(220, 0, .25, 'sawtooth', .08); tone(330, 0, .4, 'sawtooth', .07, .2); break;
    case 'win': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0, .18, 'square', .07, i * .12)); break;
    case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, 0, .22, 'triangle', .09, i * .16)); break;
    case 'up': [440, 554, 659, 880, 1108].forEach((f, i) => tone(f, 0, .12, 'square', .06, i * .07)); break;
    case 'err': tone(160, 120, .12, 'square', .06); break;
  } } catch(e) {}
}
window.addEventListener('pointerdown', () => ac(), {once:true});

/* ---------- INTERFACE PIXEL : cadres 9-slice & icônes ---------- */
const FR_PANEL = [".ooooo.","oLLLLLo","oLMMMDo","oLMMMDo","oLMMMDo","oDDDDDo",".ooooo."];
const FR_BTN   = [".ooooo.","oLLLLLo","oLMMMDo","oLMMMDo","oMMMMDo","oDDDDDo","oXXXXXo",".ooooo."];
const FR_BTNP  = [".ooooo.","oDDDDDo","oMMMMMo","oMMMMMo","oMMMMMo","oMMMMMo","oMMMMMo",".ooooo."];
const FR_COLS = {
  parch:{L:'#fff6d8',M:'#f0dcae',D:'#c9a66b',X:'#8a6a3a'}, sel:{L:'#fffbe8',M:'#fff3c8',D:'#e8a51c',X:'#8a6a3a'},
  wood:{L:'#a06a3c',M:'#7a4e2a',D:'#54331a',X:'#301c0e'}, brass:{L:'#fff2a8',M:'#f2c14a',D:'#c8891c',X:'#7a5010'},
  blue:{L:'#9cc8ff',M:'#3b7ff0',D:'#2557b8',X:'#163a80'}, red:{L:'#ffa8a0',M:'#d94040',D:'#a02828',X:'#601818'},
  green:{L:'#b6f0a0',M:'#5bbf4a',D:'#3a8a2c',X:'#1f5216'}, navy:{L:'#4a5a9a',M:'#27305e',D:'#1a2044',X:'#0e1230'},
  dark:{L:'#3a2a50',M:'#241a34',D:'#170f22',X:'#0a0610'}, gray:{L:'#b0aab8',M:'#7c7688',D:'#5a5466',X:'#3a3444'}
};
function gridURL(grid, pal, s){ return paintGrid(grid, pal, false, s).toDataURL(); }
function frameRule(sel, grid, cols, sl){
  const s = PX * DPR, url = gridURL(grid, Object.assign({o:'#1a1020'}, cols), s);
  return `${sel}{border-style:solid;border-width:${sl[0]*PX}px ${sl[1]*PX}px ${sl[2]*PX}px ${sl[3]*PX}px;border-image:url(${url}) ${sl[0]*s} ${sl[1]*s} ${sl[2]*s} ${sl[3]*s} fill stretch;background:transparent}`;
}
(function injectFrames(){
  const P = [3, 3, 3, 3], Bt = [3, 3, 4, 3];
  let css = '';
  css += frameRule('.pp', FR_PANEL, FR_COLS.parch, P);
  css += frameRule('.pp.sel', FR_PANEL, FR_COLS.sel, P);
  css += frameRule('.pn', FR_PANEL, FR_COLS.navy, P);
  css += frameRule('.pn2', FR_PANEL, FR_COLS.dark, P);
  css += frameRule('.pr', FR_PANEL, FR_COLS.red, P);
  css += frameRule('.pbl', FR_PANEL, FR_COLS.blue, P);
  for (const [k, c] of [['', 'wood'], ['.brass', 'brass'], ['.blue', 'blue'], ['.red', 'red'], ['.green', 'green'], ['.on', 'brass']]) {
    css += frameRule('.pb' + k, FR_BTN, FR_COLS[c], Bt);
    css += frameRule('.pb' + k + ':active:not(:disabled)', FR_BTNP, FR_COLS[c], Bt);
  }
  css += frameRule('.pb:disabled', FR_BTN, FR_COLS.gray, Bt) + '.pb:disabled{color:#d8d2e0;opacity:.85}';
  css += '.pb.on{color:#3a2205;text-shadow:none}';
  // fond en planches de bois
  const tile = [];
  for (let y = 0; y < 16; y++) { let r = ''; for (let x = 0; x < 16; x++) {
    const seam = y % 8 === 7, joint = (y < 8 ? x === 5 : x === 12) && !seam;
    r += seam ? 'D' : joint ? 'D' : ((x * 7 + y * 3) % 11 === 0 ? 'L' : (y % 8 === 0 ? 'L' : 'M'));
  } tile.push(r); }
  const turl = gridURL(tile, {L:'#3e2616', M:'#33200f', D:'#1e1209'}, PX * DPR);
  css += `body{background-image:url(${turl})}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();
const icCache = {};
const OFF_MAP = {y:'g', Y:'d', F:'l'};
function icURL(name, s, off){
  const k = name + s + (off ? 'o' : ''); if (icCache[k]) return icCache[k];
  let g = ICONS[name], pal = ICON_PAL;
  if (name === 'chest') { g = CHEST; pal = BASE_PAL; }
  if (off) g = g.map(r => r.replace(/[yYF]/g, c => OFF_MAP[c]));
  return icCache[k] = gridURL(g, pal, s * DPR);
}
function ic(name, s = 3, off = false){
  const w = (name === 'chest' ? 16 : 9) * s, h = (name === 'chest' ? 10 : 9) * s;
  return `<img class="ic" alt="" src="${icURL(name, s, off)}" style="width:${w}px;height:${h}px">`;
}
function starsHtml(n, s = 2){ return [1, 2, 3].map(k => ic('star', s, k > n)).join(''); }
function decorate(root){
  (root || document).querySelectorAll('[data-ic]').forEach(el => {
    if (el.dataset.icDone) return; el.dataset.icDone = 1;
    el.insertAdjacentHTML('afterbegin', ic(el.dataset.ic, el.classList.contains('chip') ? 3 : 3));
  });
}

/* ---------- DESSIN DES SOLDATS (espace "art", 1 px = 1 pixel du sprite) ---------- */
const shadowCache = {};
function pixEllipse(rx, ry, col){
  const k = rx + '_' + ry + col; if (shadowCache[k]) return shadowCache[k];
  const c = document.createElement('canvas'); c.width = rx * 2 + 1; c.height = ry * 2 + 1;
  const x = c.getContext('2d'); x.fillStyle = col;
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx + .5) + (j * j) / (ry * ry + .5) <= 1) x.fillRect(i + rx, j + ry, 1, 1);
  return shadowCache[k] = c;
}
function drawUnitAt(c, u, X, Y, t, alpha){
  const x = Math.round(X), y = Math.round(Y), A = UNITS_ART[u.type];
  c.save(); if (alpha != null) c.globalAlpha = alpha;
  const sw = u.type === 'guard' ? 9 : 7, sh = pixEllipse(sw, 2, 'rgba(0,0,0,.3)');
  c.drawImage(sh, x - sw, y - 2);
  if (u.lvl >= 5) {
    const p = Math.floor((t * 6 + u.id) % 4);
    const au = pixEllipse(10 + (p > 1 ? 1 : 0), 4, 'rgba(190,110,255,.28)'); c.drawImage(au, x - au.width / 2 | 0, y - 4);
  }
  c.translate(x, y);
  c.scale(u.face || 1, 1);
  const p = u.atk > 0 ? 1 - u.atk : 0;
  const lean = u.atk > 0 ? Math.round(Math.sin(p * Math.PI) * 1.5) : 0;
  const bob = (!u.moving && Math.sin(t * 3 + u.id * 1.7) > .55) ? -1 : 0;
  const frame = u.moving ? (Math.floor(u.walk * (u.charging ? 14 : 8)) % 2) : 0;
  const fl = u.flash > 0;
  const body = bodySprite(u.type, u.lvl, u.team, frame, fl), H = body.height;
  const bx = -12 + lean, by = -H + bob; // origine du sprite (pieds au centre)
  const hand = A.hand, hx = bx + 1 + hand[0], hy = by + SPR_TOP + hand[1];
  const dw = (name, wx, wy, ang) => {
    const s = weaponSprite(name, u.lvl, u.team, fl), W = WEAP[name];
    c.save(); c.translate(Math.round(wx), Math.round(wy)); if (ang) c.rotate(ang);
    c.drawImage(s, -Math.round(W.x), -Math.round(W.y)); c.restore();
  };
  // armes derrière le corps
  if (u.type === 'guard') {
    const h2 = A.hand2, mx = bx + 1 + h2[0], my = by + SPR_TOP + h2[1];
    dw('mace', mx, my, u.atk > 0 ? -2.2 + p * 3.2 : -.5);
  }
  if (u.type === 'spear' && !(u.atk > 0)) dw('spear', hx, hy, .18);
  c.drawImage(body, bx, by);
  switch (u.type) {
    case 'sword': {
      const e = p < .45 ? p / .45 : 1;
      dw('sword', hx, hy, u.atk > 0 ? -1.3 + e * 3 : (u.charging ? 1.2 : .3)); break;
    }
    case 'spear': if (u.atk > 0) dw('spear', hx + Math.round(Math.sin(p * Math.PI) * 9), hy - 2, Math.PI / 2 - .08); break;
    case 'archer': {
      const a = clamp(u.aim || 0, -1.1, .9) - .5, back = u.atk > 0 ? Math.round(Math.sin(p * Math.PI) * 2) : 0;
      dw('bow', hx - back, hy - 3, a + .5);
      break;
    }
    case 'bomber':
      if (u.cd < u.cdMax * .6 && !(u.atk > 0)) dw('bomb', hx, hy - 3, 0);
      else if (u.atk > 0 && p < .3) dw('bomb', hx - 4, hy - 9, 0);
      break;
    case 'guard': {
      const off = u.atk > 0 ? Math.round(Math.sin(p * Math.PI) * 5) : 0;
      dw('shield', hx - 3 + off, hy + 2, 0); break;
    }
  }
  c.restore();
}
// portrait net, pré-agrandi (pas de flou sur iOS)
function portrait(type, lvl, team = 'blue', s = 2, att){
  const A = UNITS_ART[type], H = unitH(type) + 6, W = 34;
  const c = document.createElement('canvas'); c.width = W * s * DPR; c.height = H * s * DPR;
  c.style.width = W * s + 'px'; c.style.height = H * s + 'px';
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.scale(s * DPR, s * DPR);
  drawUnitAt(x, Object.assign({type, lvl, team, face:1, atk:0, moving:false, walk:0, flash:0, id:1, cd:0, cdMax:1, aim:-.2}, att || {}), 15, H - 3, 0);
  return c;
}

/* ---------- TITRE & TEXTE PIXEL ---------- */
function pixelText(lines, px, top, bot){
  const W = Math.max(...lines.map(l => l.length * 6 - 1)), H = lines.length * 7 - 2;
  const c = document.createElement('canvas'); c.width = (W + 4) * px; c.height = (H + 6) * px;
  const x = c.getContext('2d');
  const drawAll = (dx, dy, col) => lines.forEach((ln, li) => {
    const lw = ln.length * 6 - 1, ox = Math.floor((W - lw) / 2);
    [...ln].forEach((chr, ci) => {
      const gl = FONT[chr] || FONT[' '];
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (gl[j][i] === '#') {
        x.fillStyle = col || (j < 2 ? top : j < 4 ? bot : '#a8721c');
        x.fillRect((2 + ox + ci * 6 + i + dx) * px, (2 + li * 7 + j + dy) * px, px, px);
      }
    });
  });
  for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[1,-1],[-1,1],[0,2],[1,2],[-1,2],[0,3],[1,3],[-1,3]]) drawAll(dx, dy, '#1a1020');
  drawAll(0, 0);
  return c;
}
function pixelTextEl(lines, cssPx, top, bot){
  const c = pixelText(lines, cssPx * DPR, top, bot);
  c.style.width = c.width / DPR + 'px'; c.style.height = c.height / DPR + 'px'; return c;
}

/* ---------- ÉCRANS ---------- */
let cur = 'menu';
function go(name){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  $('#s-' + name).classList.add('on'); cur = name;
  refreshGold();
  if (name === 'story') buildStory();
  if (name === 'army') buildArmy();
  if (name === 'shop') buildShop();
  if (name === 'battle') resize();
  if (name === 'menu') sizeScene();
}
function refreshGold(){ document.querySelectorAll('.goldv').forEach(e => e.textContent = SAV.gold); }
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
  sfx('click'); if (b.dataset.go === 'sandbox') startSandbox(); else go(b.dataset.go);
}));
function openModal(html, bind){ $('#mbox').innerHTML = html; decorate($('#mbox')); $('#modal').classList.remove('hidden'); if (bind) bind($('#mbox')); }
function closeModal(){ $('#modal').classList.add('hidden'); delete $('#mbox').dataset.lock; }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && !$('#mbox').dataset.lock) closeModal(); });
function confirmBox(title, text, yes, onYes){
  openModal(`<h3>${title}</h3><p style="text-align:center">${text}</p><div class="mbtns"><button class="pb red" id="m-yes">${yes}</button><button class="pb" id="m-no">Annuler</button></div>`, m => {
    m.querySelector('#m-yes').onclick = () => { closeModal(); onYes(); };
    m.querySelector('#m-no').onclick = closeModal;
  });
}

/* ---------- MENU : scène pixel animée ---------- */
(function(){ const t = pixelTextEl(['LEGION', 'PIXEL'], 6, '#fff2a8', '#f5c542'); t.id = 'title'; $('#title').replaceWith(t); })();
const scene = {cv:$('#scene'), art:document.createElement('canvas'), list:[], S:3};
function sizeScene(){
  const r = scene.cv.getBoundingClientRect(); if (r.width < 10) return;
  scene.cv.width = Math.round(r.width * DPR); scene.cv.height = Math.round(r.height * DPR);
  scene.W = Math.ceil(r.width / scene.S); scene.H = Math.ceil(r.height / scene.S);
  scene.art.width = scene.W; scene.art.height = scene.H;
  const mb = $('#menu-btns').getBoundingClientRect();
  scene.ground = Math.round((mb.top - r.top) / scene.S) - 16;
  scene.bg = buildSceneBg(scene.W, scene.H, scene.ground);
  if (!scene.list.length) for (let i = 0; i < 6; i++) scene.list.push(newMarcher(i * (scene.W / 6)));
}
function buildSceneBg(W, H, gy){
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const sky = ['#1b1a3a', '#2a2350', '#3d2c62', '#5b3a6e', '#8a4a6a', '#c46a5a', '#e89a5a'];
  const band = Math.max(1, Math.floor(gy / sky.length));
  for (let y = 0; y < gy; y++) {
    const i = Math.min(sky.length - 1, Math.floor(y / band)), f = (y % band) / band;
    for (let X = 0; X < W; X++) {
      const dither = ((X + y) % 2 === 0) && f > .5 && i < sky.length - 1;
      x.fillStyle = dither ? sky[i + 1] : sky[i]; x.fillRect(X, y, 1, 1);
    }
  }
  const rng = mulberry32(5);
  for (let i = 0; i < 40; i++) { x.fillStyle = rng() < .3 ? '#fff6d8' : '#a8a0d0'; x.fillRect(rng() * W | 0, rng() * gy * .45 | 0, 1, 1); }
  // soleil couchant
  const sun = pixEllipse(9, 9, '#ffd36a'); x.drawImage(sun, W * .72 | 0, gy - 34);
  // montagnes
  const ridge = (base, amp, col, seed, fr) => {
    const r2 = mulberry32(seed); let h = 0; x.fillStyle = col;
    for (let X = 0; X < W; X++) { h += (r2() - .5) * 2.2; h *= .96; const yy = base - amp * (.6 + .4 * Math.sin(X * fr + seed)) - h; x.fillRect(X, yy | 0, 1, gy - yy + 1); }
  };
  ridge(gy - 14, 22, '#4a2f5e', 3, .05); ridge(gy - 6, 14, '#36234a', 9, .09);
  // château
  const cx = W * .18 | 0, cy = gy - 22; x.fillStyle = '#24182f';
  x.fillRect(cx, cy, 26, 22); x.fillRect(cx - 4, cy - 10, 8, 32); x.fillRect(cx + 22, cy - 10, 8, 32); x.fillRect(cx + 9, cy - 16, 8, 38);
  for (const [tx, ty, w] of [[cx - 4, cy - 12, 8], [cx + 22, cy - 12, 8], [cx + 9, cy - 18, 8]]) for (let k = 0; k < w; k += 2) x.fillRect(tx + k, ty, 1, 2);
  x.fillStyle = '#ffd36a'; x.fillRect(cx + 12, cy - 8, 2, 3); x.fillRect(cx + 1, cy + 6, 2, 3); x.fillRect(cx + 25, cy + 2, 2, 3);
  x.fillStyle = '#e04646'; x.fillRect(cx + 13, cy - 24, 1, 6); x.fillRect(cx + 14, cy - 24, 4, 3);
  // sol
  const g = genGround('grass', W, H - gy, 11); x.drawImage(g, 0, gy);
  x.fillStyle = '#2f6129'; x.fillRect(0, gy, W, 1);
  x.fillStyle = 'rgba(10,6,16,.5)'; x.fillRect(0, gy + 12, W, H);
  return c;
}
function newMarcher(x){
  const pool = TYPES.filter(t => SAV.cards[t].u);
  const type = pool[Math.floor(rnd() * pool.length)], red = rnd() < .35;
  return {type, lvl:1 + Math.floor(rnd() * 5), team:red ? 'red' : 'blue', face:red ? -1 : 1, x, y:rnd() * 6, spd:(red ? -1 : 1) * (9 + rnd() * 5),
    moving:true, walk:rnd(), atk:0, flash:0, id:Math.floor(rnd() * 99), cd:0, cdMax:1, aim:-.2};
}
function drawScene(dt, t){
  if (!scene.bg) return;
  const a = scene.art.getContext('2d'); a.imageSmoothingEnabled = false;
  a.drawImage(scene.bg, 0, 0);
  for (const m of scene.list) {
    m.x += m.spd * dt; m.walk += dt * .8;
    if (m.x > scene.W + 20 || m.x < -20) Object.assign(m, newMarcher(m.spd > 0 ? -18 : scene.W + 18));
  }
  scene.list.slice().sort((p, q) => p.y - q.y).forEach(m => drawUnitAt(a, m, m.x, scene.ground + 8 + m.y, t));
  const c = scene.cv.getContext('2d'); c.imageSmoothingEnabled = false;
  c.drawImage(scene.art, 0, 0, scene.W * scene.S * DPR, scene.H * scene.S * DPR);
}
