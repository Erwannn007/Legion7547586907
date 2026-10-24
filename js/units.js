/* Légion Pixel — Les 35 soldats : matières, gabarits de corps, dessins et armes (double résolution) */
'use strict';
/* ---------- MATIÈRES ---------- */
const MAT = {
  skin:'#f2b48c', tan:'#c98a5c', umber:'#8e5a3a', elf:'#f9dcc6', orc:'#74ab3e', gob:'#a8cc4c', troll:'#7fa2b0', bone:'#ebe2c8', pale:'#d9d3ec', fur:'#8e5e38', furL:'#d2b08a', stone:'#928c9c', moss:'#5e9c40',
  linen:'#e6d8b2', leather:'#9c6636', dleather:'#5e3d27', cloth:'#5a5570', black:'#2e2a3c', red:'#bc3540', green:'#3f8c3c', forest:'#2e6c3c', purple:'#7a3cb6',
  khaki:'#a39a62', olive:'#5e6c36', snow:'#eceff6', navy:'#2c3b6c', steel:'#acb4c6', iron:'#5f6476', gold:'#f2c24a', bronze:'#c88a3c', wood:'#9c6438', dwood:'#6a4026', rope:'#c9a66c',
  hair:'#6c4224', blond:'#efc85e', jet:'#2c2436', silver:'#d8dae8', ginger:'#d2662c', pupil:'#1c1424', blush:'#ff9a8c', glass:'#78d6ff', lens:'#3a4a7a',
  fire:glowRamp('#fff8c8', '#ffb432', '#e2541e'), holy:glowRamp('#ffffff', '#fff2a0', '#e6b83a'), void:glowRamp('#f4d0ff', '#b25eff', '#5c2c9c'),
  zap:glowRamp('#ffffff', '#a0f4ff', '#3aa2e2'), toxic:glowRamp('#f0ffc4', '#9cff4c', '#3c9c2c'), blood:glowRamp('#ffffff', '#ff5c4c', '#a01a1a')
};
const LVL_A = [null, '#a8743e', '#9da3b3', '#8cb8ec', '#f2c040', '#c27ef4'];   // cuir, fer, acier, or, mythique
const LVL_TRIM = [null, '#7c5434', '#8c92a2', '#e4e8f2', '#ffd84a', '#fff0a8'];
const TEAMS = {
  blue:{T:'#3d80f2', V:'#28418f', U:glowRamp('#f0fcff', '#64d8ff', '#2a7cd8')},
  red: {T:'#e24a40', V:'#8c2434', U:glowRamp('#fff4dc', '#ff8c3a', '#c42c1c')}};
const palCache = {};
function palFor(lvl, team){
  const k = (lvl || 1) + (team || 'blue'); if (palCache[k]) return palCache[k];
  const p = {}, T = TEAMS[team || 'blue']; for (const m in MAT) p[m] = ramp(MAT[m]);
  p.A = ramp(LVL_A[lvl || 1]); p.trim = ramp(LVL_TRIM[lvl || 1]); p.T = ramp(T.T); p.V = ramp(T.V); p.U = T.U;
  p.eyeL = lvl >= 5 ? T.U : p.pupil; // les mythiques ont les yeux qui brillent
  return palCache[k] = p;
}

/* ---------- GABARIT HUMAIN : repère aux pieds, x vers l'avant, y vers le haut ---------- */
const R0 = {x:24, y:54, s:1};
const P = (R, dx, dy) => [R.x + dx * R.s, R.y - dy * R.s];
// cycle de marche : [cheville arrière, cheville avant, levée arrière, levée avant]
const WALK = [[-3, 3, 0, 0], [-6, 7, 0, 0], [-1, 2, 0, 2], [7, -6, 0, 0]];
function legs(S, R, f, o = {}){
  const W = WALK[f], s = R.s, hip = o.hip || 14, w = (o.w || 2.6) * s, st = o.stride || 1;
  const leg = (hx, ax, lift, d) => {
    const [x0, y0] = P(R, hx, hip), [x2, y2] = P(R, ax * st, 3 + lift), kx = (x0 + x2) / 2 + 1.2 * s, ky = (y0 + y2) / 2;
    S.limb(x0, y0, kx, ky, w, o.pants || 'cloth', {d});
    S.limb(kx, ky, x2, y2, w * .9, o.shin || o.pants || 'cloth', {d});
    if (o.knee) S.ell(kx + .6 * s, ky, 1.9 * s, 1.7 * s, o.knee, {d});
    if (o.boots !== false) {
      const top = y2 - 1.5 * s, bot = R.y - lift * s;
      if (o.sandal) { S.box(x2 - 2.5 * s, bot - 1, 6.5 * s, 2, o.boots, {d}); S.line(x2 - 1, top + 1, x2 + 1, bot - 2, o.boots, 3 + d); }
      else S.box(x2 - 3 * s, top, 7 * s, bot - top + 1, o.boots || 'dleather', {d, cut:1});
    }
  };
  leg(-2, W[0], W[2], 1); leg(2, W[1], W[3], 0);
}
function torso(S, R, mat, o = {}){
  const w = o.w || 6, top = o.top || 28, bot = o.bot || 12.5, l = o.lean || 0;
  return S.poly([P(R, -w + l, top), P(R, w + l, top), P(R, w + 1 + l * .6, 21), P(R, w, bot), P(R, -w, bot), P(R, -w - 1 + l * .6, 21)], mat, o);
}
function arm(S, R, near, hx, hy, mat, o = {}){
  const s = R.s, [sx, sy] = P(R, (near ? 4 : -4) + (o.sx || 0), o.sy || 25), [x2, y2] = P(R, hx, hy), d = near ? 0 : 1, w = (o.w || 2.3) * s;
  const ex = sx + (x2 - sx) * .35, ey = Math.max(sy + 5 * s, (sy + y2) / 2 + 2 * s);
  S.limb(sx, sy, ex, ey, w, mat, {d}); S.limb(ex, ey, x2, y2, w * .92, o.fore || mat, {d});
  if (o.hand !== false) S.ell(x2, y2, 2.1 * s, 2.1 * s, o.hand || 'skin', {d});
  if (o.pad) S.ell(sx, sy + .5 * s, 4 * s, 3.3 * s, o.pad, {d});
}
function head(S, R, skin, o = {}){
  const s = R.s, [cx, cy] = P(R, o.dx != null ? o.dx : 1, o.dy || 37);
  if (o.neck !== false) S.box(cx - 3 * s, cy + 4 * s, 6 * s, 5 * s, skin, {d:1});
  S.ell(cx, cy, (o.r || 7) * s, (o.ry || o.r || 7) * s, skin);
  if (o.ear !== false) S.ell(cx - 4 * s, cy + 1 * s, 1.5 * s, 2.2 * s, skin, {d:1});
  return [cx, cy];
}
function face(S, cx, cy, o = {}){
  const sk = o.skin || 'skin', e = o.eye || 'eyeL';
  if (o.eyes !== false) { S.px(cx + 2, cy, e, 2).px(cx + 2, cy + 1, e, 2).px(cx + 5, cy, e, 2).px(cx + 5, cy + 1, e, 2); S.px(cx + 1, cy + 1, sk, 3); }
  if (o.brow) S.line(cx + 1, cy - 2, cx + 2, cy - 2, o.brow, 3).line(cx + 5, cy - 2, cx + 6, cy - 2, o.brow, 3);
  if (o.nose !== false) S.px(cx + 7, cy + 2, sk, 2).px(cx + 6, cy + 3, sk, 3);
  if (o.mouth !== false) S.line(cx + 4, cy + 4, cx + 5, cy + 4, sk, 4);
  if (o.blush) S.px(cx + 6, cy + 2, 'blush', 2).px(cx + 1, cy + 3, 'blush', 2);
}
// calotte (cheveux, casque, capuche) : l'ellipse de la tête, gardée là où keep(x, y) est vrai
function cap(S, cx, cy, mat, keep, o = {}){ return S.ell(cx + (o.dx || -.5), cy + (o.dy || -1.5), o.rx || 7.8, o.ry || 7.6, mat, Object.assign({if:keep}, o)); }
function cape(S, R, mat, f, o = {}){
  const sw = [0, -1, 1, -2][f], b = o.bot || 6;
  S.poly([P(R, -6, 28), P(R, 3, 28), P(R, -1, b), P(R, -8 + sw, b - 1), P(R, -12 + sw, b + 1), P(R, -9, 20)], mat, {d:1});
  S.poly([P(R, -6, 28), P(R, -1, 28), P(R, -8 + sw, b), P(R, -12 + sw, b + 1), P(R, -9, 20)], o.lining || mat, {d:2, ol:false});
}
function plume(S, x, y, mat, f){
  const w = [0, 1, 0, -1][f];
  S.ell(x, y, 2.6, 2.2, mat).ell(x - 3, y - .5 + w * .3, 3, 2, mat).ell(x - 6, y + .5 + w * .5, 2.6, 1.7, mat).ell(x - 8.5, y + 1.5 + w * .6, 1.6, 1.2, mat);
}
// robe longue qui cache les jambes (les pieds dépassent)
function robe(S, R, f, mat, o = {}){
  const sw = [0, 1, 0, -1][f], s = R.s;
  legs(S, R, f, {pants:mat, boots:o.boots || 'dleather', stride:.6});
  S.poly([P(R, -6, 28), P(R, 6, 28), P(R, 8 + sw, 6), P(R, 9 + sw, 3.5), P(R, -9 + sw, 3.5), P(R, -8 + sw, 6)], mat);
  S.tex(R.x - 10 * s, R.y - 6 * s, R.x + 10 * s, R.y - 3 * s, mat, (x, y) => (x + f) % 4 === 0, 1);
  if (o.hem) S.poly([P(R, -9 + sw, 6), P(R, 9 + sw, 6), P(R, 9 + sw, 3.5), P(R, -9 + sw, 3.5)], o.hem, {ny:-.2});
}
const mail = (S, x0, y0, x1, y1, mat) => S.tex(x0, y0, x1, y1, mat, (x, y) => (x + y) % 2 === 0 && y % 2 === 0, 1);

/* ---------- LES SOLDATS ---------- */
// w,h : taille du sprite · hand : main d'arme · wp : arme · anim : geste d'attaque · sw : largeur de l'ombre (en pixels de sprite)
const UNITS_ART = {
  sword: {w:48, h:56, hand:[36, 37], wp:'sword', anim:'swing', sw:14, draw(S, L, f){
    const R = R0;
    cape(S, R, 'T', f, {lining:'V'});
    arm(S, R, false, -8, 16, 'steel', {hand:'dleather'});
    legs(S, R, f, {pants:'cloth', shin:L >= 2 ? 'A' : 'cloth', boots:L >= 2 ? 'A' : 'dleather', knee:L >= 3 ? 'A' : null});
    torso(S, R, 'steel'); mail(S, 17, 26, 31, 42, 'steel');
    S.poly([P(R, -4, 27), P(R, 5, 27), P(R, 6, 7), P(R, 1, 5), P(R, -4, 7)], 'T');
    if (L >= 4) { S.line(...P(R, -4, 26), ...P(R, -4, 8), 'trim', 1).line(...P(R, 5, 26), ...P(R, 6, 8), 'trim', 2); }
    S.stamp(...P(R, -1, 24), ['.y.', 'yyy', '.y.', '.y.'], {y:['trim', 1]});
    S.box(...P(R, -6, 14), 13, 2, 'leather', {ny:-.3}); S.px(...P(R, 2, 13.5), 'trim', 0);
    arm(S, R, true, 12, 17, 'steel', {hand:'dleather', pad:L >= 2 ? 'A' : null});
    const [cx, cy] = head(S, R, 'skin'); face(S, cx, cy, {brow:'hair'});
    cap(S, cx, cy, 'A', (x, y) => y < cy - 1 || (x < cx - 2 && y < cy + 5));
    S.line(cx - 8, cy - 2, cx + 7, cy - 2, 'A', 3); S.box(cx + 6, cy - 3, 2, 6, 'A', {ny:0});
    if (L >= 3) plume(S, cx - 2, cy - 9, 'T', f);
  }},
  archer: {w:48, h:56, hand:[39, 38], wp:'bow', anim:'bow', sw:13, draw(S, L, f){
    const R = R0;
    S.box(...P(R, -10, 32), 5, 17, 'leather', {cut:1}); // carquois
    for (let k = 0; k < 3; k++) { S.line(...P(R, -9 + k * 1.5, 34 + k), ...P(R, -9 + k * 1.5, 31), 'wood', 2); S.px(...P(R, -9 + k * 1.5, 35 + k), 'T', 1).px(...P(R, -9 + k * 1.5, 36 + k), 'linen', 1); }
    cape(S, R, 'forest', f, {bot:9});
    arm(S, R, false, -7, 17, 'forest', {hand:'skin', fore:L >= 2 ? 'leather' : 'forest'});
    legs(S, R, f, {pants:'cloth', boots:'leather', shin:L >= 3 ? 'leather' : 'cloth'});
    torso(S, R, 'leather', {w:5.5});
    S.poly([P(R, 6, 28), P(R, 3, 28), P(R, -6, 15), P(R, -4, 13)], 'T'); // écharpe
    S.box(...P(R, -6, 14), 12, 2, 'dleather'); S.px(...P(R, 1, 13.5), 'trim', 0);
    arm(S, R, true, 15, 16, 'forest', {hand:'skin', fore:'leather'});
    const [cx, cy] = head(S, R, 'skin'); face(S, cx, cy, {brow:'ginger', blush:true});
    S.ell(cx - 7, cy + 3, 2.5, 4, 'ginger'); // tresse
    cap(S, cx, cy, 'forest', (x, y) => y < cy - 2 || x < cx + 1, {ry:8.2, rx:8.2});
    S.poly([[cx - 6, cy - 7], [cx - 13, cy - 3], [cx - 7, cy - 1]], 'forest', {d:1});
    S.line(cx - 1, cy - 2, cx + 7, cy - 3, 'forest', 3);
    if (L >= 4) S.line(cx - 3, cy - 4, cx + 6, cy - 5, 'trim', 1);
    if (L >= 3) { S.line(cx - 7, cy - 7, cx - 12, cy - 13, 'T', 1); S.line(cx - 6, cy - 7, cx - 11, cy - 13, 'T', 3); }
  }},
  spear: {w:48, h:56, hand:[36, 36], wp:'spear', anim:'thrust', sw:13, draw(S, L, f){
    const R = R0;
    arm(S, R, false, -7, 17, 'T', {hand:'skin'});
    legs(S, R, f, {pants:'T', shin:'linen', boots:'dleather'});
    S.tex(16, 40, 32, 48, 'T', (x, y) => x % 3 === 0, 2);
    torso(S, R, 'linen');
    if (L >= 2) S.poly([P(R, -5, 27), P(R, 6, 27), P(R, 7, 20), P(R, 5, 14), P(R, -5, 14), P(R, -6, 20)], 'A');
    S.box(...P(R, -6, 14), 13, 2, 'leather'); S.px(...P(R, 3, 13.5), 'trim', 0);
    // manches bouffantes à crevés
    S.ell(...P(R, 5, 24), 4, 4, 'T'); S.line(...P(R, 3, 27), ...P(R, 7, 21), 'linen', 1);
    arm(S, R, true, 12, 18, 'T', {hand:'skin', fore:'linen', w:2.1});
    const [cx, cy] = head(S, R, 'skin'); face(S, cx, cy, {brow:'hair', mouth:false});
    S.stamp(cx + 2, cy + 3, ['.hhhh', 'hh..hh'], {h:['hair', 2]}); // moustache
    S.ell(cx - 4, cy - 1, 4, 5, 'hair', {if:(x, y) => x < cx - 2 && y > cy - 3});
    cap(S, cx, cy, 'A', (x, y) => y < cy - 3, {ry:8});
    S.ell(cx, cy - 3.5, 11.5, 2.2, 'A', {if:(x, y) => y > cy - 4}); // bord du chapeau de fer
    S.px(cx, cy - 11, 'A', 1);
    if (L >= 3) plume(S, cx - 3, cy - 10, 'T', f);
    if (L >= 4) S.line(cx - 7, cy - 4, cx + 6, cy - 4, 'trim', 1);
  }},
  guard: {w:60, h:66, hand:[44, 42], hand2:[18, 40], wp:'shield', wp2:'mace', anim:'bash', sw:18, draw(S, L, f){
    const R = {x:29, y:64, s:1.25};
    arm(S, R, false, -8, 19, 'A', {hand:'iron', pad:'A'});
    legs(S, R, f, {pants:'iron', shin:'A', boots:'A', knee:'A', w:2.9});
    torso(S, R, 'A', {w:7});
    S.tex(18, 30, 42, 50, 'A', (x, y) => y % 5 === 0, 1);
    S.poly([P(R, -4, 27), P(R, 5, 27), P(R, 6, 6), P(R, 0.5, 4), P(R, -4, 6)], 'T');
    S.stamp(...P(R, -.5, 23), ['.yy.', 'yyyy', '.yy.', '.yy.'], {y:['trim', 1]});
    S.box(...P(R, -7, 13.5), 18, 3, 'dleather'); S.box(...P(R, 1, 13.5), 3, 3, 'trim', {ny:0});
    S.poly([P(R, -7, 12), P(R, 7, 12), P(R, 8, 7), P(R, -8, 7)], 'steel'); mail(S, 14, 46, 46, 56, 'steel');
    arm(S, R, true, 12, 18, 'A', {hand:'iron', pad:'A'});
    S.ell(...P(R, -5, 26), 5.5, 4.5, 'A'); S.ell(...P(R, 5, 26), 5.5, 4.5, 'A');
    S.line(...P(R, -9, 25), ...P(R, -2, 25), 'trim', 2); S.line(...P(R, 1, 25), ...P(R, 9, 25), 'trim', 2);
    // heaume
    const [cx, cy] = P(R, 1, 35);
    S.box(cx - 7, cy - 8, 15, 16, 'A', {cut:3});
    S.box(cx - 1, cy - 1, 10, 2, 'pupil', {lv:2}); S.px(cx + 2, cy - 1, 'eyeL', 2).px(cx + 6, cy - 1, 'eyeL', 2);
    for (let k = 0; k < 3; k++) S.px(cx + 4 + k * 2, cy + 3, 'pupil', 2);
    S.line(cx + 3, cy - 7, cx + 3, cy + 6, 'A', 1);
    if (L >= 3) { S.ell(cx - 1, cy - 10, 6, 2.6, 'T'); S.ell(cx - 6, cy - 9, 3, 3, 'T'); }
    if (L >= 4) S.line(cx - 7, cy - 3, cx + 8, cy - 3, 'trim', 1);
  }},
  bomber: {w:48, h:56, hand:[35, 37], wp:'bomb', anim:'throw', sw:13, draw(S, L, f){
    const R = R0;
    S.ell(...P(R, -8, 22), 5, 6, 'dleather'); S.box(...P(R, -11, 27), 5, 3, 'leather'); // sacoche
    arm(S, R, false, -7, 17, 'T', {hand:'dleather', fore:'linen'});
    legs(S, R, f, {pants:'khaki', boots:'dleather'});
    torso(S, R, 'T');
    S.poly([P(R, -5, 26), P(R, 6, 26), P(R, 6, 12), P(R, -5, 12)], 'leather'); // tablier
    S.poly([P(R, 6, 28), P(R, 3, 28), P(R, -6, 15), P(R, -4, 13)], 'dleather');
    for (let k = 0; k < 3; k++) S.ell(...P(R, 3 - k * 3, 25 - k * 3.6), 1.6, 1.6, 'black');
    arm(S, R, true, 11, 17, 'T', {hand:'dleather', fore:'linen'});
    const [cx, cy] = head(S, R, 'skin'); face(S, cx, cy, {mouth:false});
    S.ell(cx + 2, cy + 4, 6, 4.5, 'ginger', {if:(x, y) => y > cy + 1}); // barbe
    S.ell(cx - 3, cy + 1, 3, 4, 'ginger', {if:(x, y) => y > cy});
    cap(S, cx, cy, 'leather', (x, y) => y < cy - 2 || (x < cx - 3 && y < cy + 2));
    S.box(cx - 1, cy - 4, 9, 2, 'dleather', {lv:3});
    S.ell(cx + 1.5, cy - 4, 2, 2, 'glass'); S.ell(cx + 5.5, cy - 4, 2, 2, 'glass');
    if (L >= 3) S.ell(cx - 2, cy - 9, 2, 2, 'T');
    if (L >= 4) S.line(cx - 6, cy - 2, cx - 1, cy - 2, 'trim', 1);
  }},

  /* ===== Fantastique ===== */
  elf: {w:48, h:58, hand:[39, 40], wp:'ebow', anim:'bow', sw:12, draw(S, L, f){
    const R = {x:24, y:56, s:1};
    S.poly([P(R, -2, 39), P(R, -7, 38), P(R, -11, 24), P(R, -8, 22), P(R, -4, 30)], 'silver'); // longue chevelure
    cape(S, R, 'T', f, {lining:'V', bot:4});
    arm(S, R, false, -7, 18, 'forest', {hand:'elf', w:2});
    legs(S, R, f, {pants:'forest', boots:'leather', shin:'leather', w:2.3, hip:15});
    torso(S, R, 'forest', {w:5, top:29});
    S.poly([P(R, -5, 22), P(R, 5, 22), P(R, 6, 13), P(R, 1, 9), P(R, -5, 13)], 'green');
    S.tex(18, 33, 30, 46, 'green', (x, y) => (x * 3 + y * 2) % 7 === 0, -1); // feuillage
    S.box(...P(R, -5, 15), 11, 2, 'gold', {ny:-.3});
    if (L >= 2) S.ell(...P(R, 4, 26), 3.5, 3, 'gold');
    arm(S, R, true, 15, 17, 'forest', {hand:'elf', w:2});
    const [cx, cy] = head(S, R, 'elf', {dy:38, ear:false}); face(S, cx, cy, {skin:'elf', brow:'silver'});
    S.poly([[cx - 3, cy], [cx - 11, cy - 6], [cx - 4, cy + 3]], 'elf', {d:1}); // oreille pointue
    cap(S, cx, cy, 'silver', (x, y) => y < cy - 3 || (x < cx - 1 && y < cy - 1) || (x < cx - 5));
    S.line(cx - 6, cy - 4, cx + 7, cy - 4, L >= 3 ? 'gold' : 'green', 1);
    if (L >= 4) S.ell(cx + 2, cy - 5, 1.5, 1.5, 'U', {lv:1});
  }},
  orc: {w:52, h:60, hand:[40, 39], wp:'axe2', anim:'heavy', sw:15, draw(S, L, f){
    const R = {x:25, y:58, s:1.12};
    arm(S, R, false, -8, 17, 'orc', {hand:'orc', w:2.8, fore:L >= 2 ? 'dleather' : 'orc'});
    legs(S, R, f, {pants:'dleather', boots:'fur', w:2.9});
    S.poly([P(R, -6, 14), P(R, 6, 14), P(R, 8, 5), P(R, 0, 7), P(R, -8, 5)], 'fur'); // pagne
    torso(S, R, 'orc', {w:7, lean:1});
    S.poly([P(R, -6, 27), P(R, -3, 27), P(R, 7, 15), P(R, 4, 14)], 'dleather');
    for (let k = 0; k < 3; k++) S.line(...P(R, 1 + k * 2, 22 - k), ...P(R, 3 + k * 2, 20 - k), 'T', 1); // peinture de guerre
    S.box(...P(R, -7, 15), 15, 2.5, 'leather'); S.ell(...P(R, 1, 14), 1.8, 1.6, 'bone');
    arm(S, R, true, 12, 17, 'orc', {hand:'orc', w:2.8, fore:L >= 2 ? 'dleather' : 'orc', pad:L >= 3 ? 'A' : 'fur'});
    if (L >= 3) for (let k = 0; k < 3; k++) S.px(...P(R, 2 + k * 2.5, 29.5), 'steel', 0);
    const [cx, cy] = head(S, R, 'orc', {dy:35, r:6.6}); face(S, cx, cy, {skin:'orc', brow:'jet', mouth:false});
    S.px(cx + 3, cy + 4, 'bone', 1).px(cx + 3, cy + 3, 'bone', 0).px(cx + 6, cy + 4, 'bone', 1).px(cx + 6, cy + 3, 'bone', 0); // défenses
    S.line(cx + 2, cy + 5, cx + 6, cy + 5, 'orc', 4);
    for (let k = 0; k < 5; k++) S.ell(cx - 4 + k * 2.2, cy - 7 - Math.sin(k * .8) * 1.5, 1.7, 2.6, L >= 4 ? 'T' : 'jet'); // crête
    S.line(cx - 1, cy - 1, cx + 6, cy + 2, 'T', 2);
    if (L >= 5) S.line(cx - 2, cy - 2, cx - 2, cy + 3, 'U', 1);
  }},
  goblin: {w:42, h:46, hand:[30, 30], wp:'keg', anim:'none', sw:10, draw(S, L, f){
    const R = {x:20, y:44, s:.82};
    arm(S, R, false, 6, 19, 'gob', {hand:'gob'});
    legs(S, R, f, {pants:'gob', boots:false, w:2.5, hip:12});
    S.poly([P(R, -6, 12), P(R, 6, 12), P(R, 7, 4), P(R, 2, 6), P(R, -1, 3), P(R, -6, 5)], 'T'); // haillons
    torso(S, R, 'gob', {w:6, top:24, bot:11});
    S.box(...P(R, -6, 13), 13, 2.5, 'dleather');
    arm(S, R, true, 13, 19, 'gob', {hand:'gob'});
    const [cx, cy] = head(S, R, 'gob', {dy:33, r:8.5, ry:8, ear:false});
    S.poly([[cx - 4, cy - 1], [cx - 15, cy - 7], [cx - 5, cy + 3]], 'gob', {d:1});
    S.px(cx - 10, cy - 4, 'gob', 4).px(cx - 8, cy - 3, 'gob', 4);
    S.ell(cx + 1.5, cy - 1, 2, 2, 'gold', {lv:1}).ell(cx + 5.5, cy - 1, 2, 2, 'gold', {lv:1});
    S.px(cx + 2, cy - 1, 'eyeL', 2).px(cx + 6, cy - 1, 'eyeL', 2);
    S.line(cx + 1, cy + 3, cx + 7, cy + 4, 'pupil', 2); S.px(cx + 3, cy + 4, 'bone', 0).px(cx + 5, cy + 4, 'bone', 0);
    S.px(cx + 9, cy + 1, 'gob', 2).px(cx + 10, cy + 2, 'gob', 3);
    cap(S, cx, cy, L >= 3 ? 'A' : 'leather', (x, y) => y < cy - 4, {ry:8.6, rx:9});
    if (L >= 4) S.px(cx, cy - 10, 'trim', 0);
  }},
  troll: {w:72, h:78, hand:[56, 50], wp:'club', anim:'heavy', sw:22, draw(S, L, f){
    const R = {x:33, y:76, s:1.55};
    arm(S, R, false, -7, 12, 'troll', {hand:'troll', w:2.7});
    legs(S, R, f, {pants:'troll', boots:false, w:3, hip:13, stride:.7});
    for (const dx of [-3, 3]) S.ell(...P(R, dx + WALK[f][dx < 0 ? 0 : 1] * .7, 1.2), 3.4, 2, 'troll', {d:dx < 0 ? 1 : 0});
    S.poly([P(R, -6, 14), P(R, 7, 14), P(R, 8, 6), P(R, 1, 8), P(R, -6, 6)], 'leather');
    S.poly([P(R, -6, 27), P(R, 6, 29), P(R, 9, 21), P(R, 8, 12), P(R, -6, 12), P(R, -8, 22)], 'troll');
    S.ell(...P(R, 3, 17), 6.5, 5.5, 'troll'); // ventre
    S.tex(10, 20, 64, 64, 'troll', (x, y) => (x * 7 + y * 3) % 23 === 0, 1);
    if (L >= 2) for (let k = 0; k < 4; k++) S.ell(...P(R, -2 + k * 2.4, 25.5 - k * .6), 1.1, 1.4, 'bone');
    if (L >= 3) S.ell(...P(R, -3, 27), 5, 3.5, 'A');
    arm(S, R, true, 15, 17, 'troll', {hand:'troll', w:2.9, sy:26});
    const [cx, cy] = head(S, R, 'troll', {dx:5, dy:30, r:5, neck:false, ear:false});
    S.ell(cx + 6, cy + 2, 3, 2.4, 'troll'); // gros nez
    S.px(cx + 3, cy - 1, 'eyeL', 2).px(cx + 3, cy, 'eyeL', 2); S.line(cx + 1, cy - 3, cx + 4, cy - 2, 'troll', 4);
    S.px(cx + 4, cy + 5, 'bone', 0).px(cx + 4, cy + 4, 'bone', 1).px(cx + 7, cy + 5, 'bone', 0);
    S.ell(cx - 2, cy - 6, 4, 2, 'moss');
    if (L >= 4) S.px(cx - 4, cy + 2, 'gold', 0).px(cx - 4, cy + 3, 'gold', 2);
  }},
  mage: {w:48, h:60, hand:[36, 39], wp:'fstaff', anim:'cast', sw:12, draw(S, L, f){
    const R = {x:24, y:58, s:1};
    arm(S, R, false, -6, 18, 'T', {hand:'skin'});
    robe(S, R, f, 'T', {hem:L >= 2 ? 'trim' : 'V'});
    S.box(...P(R, -6, 16), 13, 2, 'gold', {ny:-.3});
    S.poly([P(R, 0, 28), P(R, 3, 28), P(R, 2, 5), P(R, 0, 5)], 'V');
    if (L >= 4) S.stamp(...P(R, 0, 12), ['y', 'yy', 'y'], {y:['fire', 1]});
    arm(S, R, true, 12, 18, 'T', {hand:'skin', fore:'V'});
    const [cx, cy] = head(S, R, 'skin', {dy:37}); face(S, cx, cy, {brow:'silver', mouth:false});
    S.poly([[cx - 2, cy + 2], [cx + 8, cy + 2], [cx + 4, cy + 13], [cx + 1, cy + 9]], 'silver'); // longue barbe
    S.line(cx + 3, cy + 3, cx + 7, cy + 3, 'silver', 1);
    S.ell(cx, cy - 3, 11, 2.4, 'V'); // bord du chapeau
    S.poly([[cx - 7, cy - 4], [cx + 7, cy - 4], [cx + 1, cy - 12], [cx - 5, cy - 19], [cx - 9, cy - 17], [cx - 4, cy - 12]], 'V');
    S.box(cx - 6, cy - 6, 13, 2, L >= 3 ? 'gold' : 'T', {ny:-.2});
    if (L >= 4) S.ell(cx - 7.5, cy - 17.5, 1.6, 1.6, 'fire', {lv:1});
  }},
  priest: {w:48, h:60, hand:[36, 39], wp:'hstaff', anim:'cast', sw:12, draw(S, L, f){
    const R = {x:24, y:58, s:1};
    S.poly([P(R, -3, 40), P(R, -8, 38), P(R, -9, 22), P(R, -4, 26)], 'snow', {d:1}); // voile
    arm(S, R, false, -6, 18, 'snow', {hand:'skin'});
    robe(S, R, f, 'snow', {hem:'T'});
    S.poly([P(R, -2, 28), P(R, 2, 28), P(R, 3, 6), P(R, -1, 6)], 'T'); // étole
    S.stamp(...P(R, -1, 16), ['.y.', 'yyy', '.y.'], {y:['trim', 1]});
    S.box(...P(R, -6, 17), 13, 2, 'gold', {ny:-.3});
    arm(S, R, true, 12, 18, 'snow', {hand:'skin'});
    const [cx, cy] = head(S, R, 'skin', {dy:37}); face(S, cx, cy, {brow:'blond', blush:true});
    S.ell(cx - 2, cy + 1, 5.5, 6, 'blond', {if:(x, y) => x < cx - 1 && y > cy - 3});
    cap(S, cx, cy, 'snow', (x, y) => y < cy - 3 || x < cx - 2, {rx:8.4, ry:8.2});
    S.line(cx - 6, cy - 4, cx + 7, cy - 4, 'gold', 1);
    if (L >= 3) S.ell(cx + 1, cy - 5, 1.4, 1.4, 'T', {lv:1});
    if (L >= 4) S.ell(cx - 1, cy - 12, 6, 1.6, 'holy', {lv:2, if:(x, y) => Math.abs(y - (cy - 12)) > .6 || Math.abs(x - cx + 1) > 4.3});
  }},
  necro: {w:48, h:60, hand:[36, 39], wp:'nstaff', anim:'cast', sw:12, draw(S, L, f){
    const R = {x:24, y:58, s:1};
    cape(S, R, 'black', f, {lining:'void', bot:3});
    arm(S, R, false, -6, 18, 'black', {hand:'pale'});
    robe(S, R, f, 'black', {hem:'T'});
    S.tex(14, 36, 34, 52, 'black', (x, y) => (x + y * 3) % 9 === 0, -2);
    S.poly([P(R, -1, 28), P(R, 2, 28), P(R, 3, 6), P(R, 0, 6)], 'T');
    S.box(...P(R, -6, 16), 13, 2, 'bone', {ny:-.3});
    arm(S, R, true, 12, 18, 'black', {hand:'pale'});
    S.ell(...P(R, 5, 26), 3.6, 3.2, 'bone'); S.px(...P(R, 6, 26), 'pupil', 2).px(...P(R, 4, 26), 'pupil', 2); // crâne d'épaule
    const [cx, cy] = head(S, R, 'pale', {dy:37});
    cap(S, cx, cy, 'black', (x, y) => y < cy - 2 || x < cx + 2, {rx:8.6, ry:8.6});
    S.poly([[cx - 5, cy - 7], [cx - 3, cy - 15], [cx + 3, cy - 6]], 'black');
    S.box(cx + 2, cy - 2, 6, 6, 'pale', {d:2}); S.px(cx + 4, cy, 'void', 1).px(cx + 7, cy, 'void', 1);
    if (L >= 3) S.ell(cx - 3, cy - 15, 1.4, 1.4, 'void', {lv:1});
  }},
  skel: {w:48, h:56, hand:[35, 37], wp:'bsword', anim:'swing', sw:11, draw(S, L, f){
    const R = R0;
    arm(S, R, false, -7, 17, 'bone', {hand:'bone', w:1.3});
    legs(S, R, f, {pants:'bone', w:1.4, boots:'bone'});
    S.poly([P(R, -5, 15), P(R, 5, 15), P(R, 6, 8), P(R, 1, 10), P(R, -2, 7), P(R, -5, 9)], 'T'); // pagne déchiré
    S.box(...P(R, -1, 27), 2, 13, 'bone'); // colonne
    for (let k = 0; k < 4; k++) S.box(...P(R, -5 + k * .5, 25.5 - k * 2.8), 10 - k, 1, 'bone', {lv:k ? 2 : 1});
    S.ell(...P(R, 0, 14), 5, 2.5, 'bone');
    arm(S, R, true, 11, 17, 'bone', {hand:'bone', w:1.3});
    if (L >= 2) S.ell(...P(R, 4, 25), 3.6, 2.8, 'A');
    const [cx, cy] = head(S, R, 'bone', {neck:false, ear:false, r:6.6});
    S.ell(cx + 2, cy, 2, 2, 'pupil', {lv:2}).ell(cx + 5.5, cy, 1.8, 2, 'pupil', {lv:2});
    S.px(cx + 2, cy, 'blood', 1).px(cx + 5, cy, 'blood', 1);
    S.box(cx + 1, cy + 4, 6, 3, 'bone', {lv:3}); for (let k = 0; k < 3; k++) S.px(cx + 2 + k * 2, cy + 5, 'pupil', 2);
    S.px(cx + 6, cy + 2, 'pupil', 2);
    if (L >= 3) cap(S, cx, cy, 'A', (x, y) => y < cy - 3, {rx:7.4, ry:7});
    if (L >= 4) S.line(cx - 6, cy - 4, cx + 6, cy - 4, 'trim', 1);
  }},
  dwarf: {w:50, h:52, hand:[37, 34], wp:'hammer', anim:'heavy', sw:15, draw(S, L, f){
    const R = {x:24, y:50, s:1};
    cape(S, R, 'T', f, {lining:'V', bot:6});
    arm(S, R, false, -8, 14, 'A', {hand:'dleather', pad:'A', sy:22, w:2.7});
    legs(S, R, f, {pants:'cloth', boots:'A', hip:9, w:3, stride:.7});
    torso(S, R, 'A', {w:8, top:24, bot:8});
    S.tex(14, 26, 34, 44, 'A', (x, y) => y % 4 === 0, 1);
    S.box(...P(R, -8, 10), 17, 3, 'leather'); S.box(...P(R, -1, 10.5), 4, 4, 'trim', {cut:1});
    arm(S, R, true, 13, 15, 'A', {hand:'dleather', pad:'A', sy:22, w:2.7});
    const [cx, cy] = head(S, R, 'skin', {dy:31, r:6.8, neck:false}); face(S, cx, cy, {mouth:false, brow:'ginger'});
    S.poly([[cx - 4, cy + 1], [cx + 8, cy + 1], [cx + 7, cy + 9], [cx + 3, cy + 15], [cx - 1, cy + 12], [cx - 5, cy + 6]], 'ginger'); // barbe
    S.tex(cx - 5, cy + 2, cx + 8, cy + 15, 'ginger', (x, y) => (x + y) % 3 === 0, 1);
    S.box(cx + 1, cy + 9, 4, 2, 'trim', {ny:0});
    cap(S, cx, cy, 'A', (x, y) => y < cy - 2 || (x < cx - 3 && y < cy + 3));
    S.line(cx - 8, cy - 2, cx + 7, cy - 2, 'trim', 2);
    if (L >= 2) { S.poly([[cx - 6, cy - 5], [cx - 12, cy - 9], [cx - 13, cy - 15], [cx - 9, cy - 9], [cx - 5, cy - 8]], 'bone'); S.poly([[cx + 4, cy - 6], [cx + 9, cy - 11], [cx + 9, cy - 16], [cx + 6, cy - 10], [cx + 2, cy - 8]], 'bone'); }
    if (L >= 4) S.ell(cx, cy - 7, 1.5, 1.5, 'U', {lv:1});
  }},
  paladin: {w:52, h:60, hand:[39, 40], wp:'phammer', anim:'heavy', sw:15, draw(S, L, f){
    const R = {x:25, y:58, s:1.1};
    cape(S, R, 'T', f, {lining:'V', bot:4});
    arm(S, R, false, -7, 17, 'A', {hand:'A', pad:'A'});
    legs(S, R, f, {pants:'A', shin:'A', boots:'A', knee:'trim'});
    torso(S, R, 'A');
    S.poly([P(R, -5, 26), P(R, 6, 26), P(R, 7, 5), P(R, 1, 3), P(R, -5, 5)], 'snow');
    S.stamp(...P(R, -1, 23), ['.T.', 'TTT', '.T.', '.T.', '.T.'], {T:['T', 1]});
    S.box(...P(R, -6, 14), 13, 2, 'trim', {ny:-.3});
    arm(S, R, true, 12, 17, 'A', {hand:'A', pad:'A'});
    S.ell(...P(R, 5, 26), 4.6, 3.8, 'A'); S.line(...P(R, 2, 28), ...P(R, 8, 27), 'trim', 1);
    const [cx, cy] = head(S, R, 'skin'); face(S, cx, cy, {brow:'blond'});
    cap(S, cx, cy, 'A', (x, y) => y < cy - 1 || (x < cx - 1 && y < cy + 6));
    S.line(cx - 7, cy - 2, cx + 7, cy - 2, 'trim', 1);
    // ailes du heaume
    S.poly([[cx - 5, cy - 4], [cx - 13, cy - 13], [cx - 9, cy - 4]], 'snow');
    S.poly([[cx - 5, cy - 1], [cx - 14, cy - 8], [cx - 9, cy]], 'snow', {d:1});
    if (L >= 4) S.ell(cx, cy - 13, 6.5, 1.6, 'holy', {lv:2, if:(x, y) => Math.abs(y - (cy - 13)) > .6 || Math.abs(x - cx) > 4.5});
  }},

  /* ===== Créatures mythiques ===== */
  minotaur: {w:72, h:80, hand:[55, 52], wp:'gaxe', anim:'heavy', sw:22, draw(S, L, f){
    const R = {x:34, y:78, s:1.5};
    arm(S, R, false, -7, 15, 'fur', {hand:'fur', w:2.8, fore:'A'});
    legs(S, R, f, {pants:'fur', boots:'black', w:3, hip:13, stride:.7});
    S.poly([P(R, -6, 14), P(R, 7, 14), P(R, 6, 10), P(R, 1, 9), P(R, -6, 10)], 'T');
    torso(S, R, 'fur', {w:7.5, top:29});
    S.ell(...P(R, 2, 22), 5.5, 6, 'furL', {d:0}); // poitrail
    S.tex(10, 22, 66, 70, 'fur', (x, y) => (x * 5 + y * 3) % 11 === 0, 1);
    S.box(...P(R, -7, 15), 16, 2, 'dleather'); S.box(...P(R, 1, 15.5), 3, 3, 'trim', {ny:0});
    arm(S, R, true, 14, 17, 'fur', {hand:'fur', w:2.9, fore:'A', pad:L >= 3 ? 'A' : null});
    const [cx, cy] = head(S, R, 'fur', {dx:3, dy:34, r:5.6, ear:false});
    S.box(cx + 1, cy - 1, 9, 6, 'furL', {cut:2}); // museau
    S.px(cx + 8, cy + 1, 'pupil', 2).px(cx + 8, cy + 3, 'pupil', 2);
    S.ell(cx + 6, cy + 5, 2.2, 1.6, 'gold', {if:(x, y) => y > cy + 5});
    S.px(cx + 2, cy - 3, 'eyeL', 2).px(cx + 4, cy - 3, 'blood', 1);
    S.poly([[cx - 4, cy - 4], [cx - 13, cy - 7], [cx - 15, cy - 14], [cx - 10, cy - 9], [cx - 3, cy - 7]], 'bone');
    S.poly([[cx + 1, cy - 6], [cx + 6, cy - 12], [cx + 6, cy - 18], [cx + 9, cy - 11], [cx + 4, cy - 4]], 'bone');
    S.ell(cx - 5, cy - 3, 2.4, 1.6, 'fur', {d:1});
    if (L >= 4) S.line(cx - 12, cy - 9, cx - 8, cy - 7, 'trim', 1);
  }},
  vampire: {w:48, h:58, hand:[37, 34], anim:'claw', sw:12, draw(S, L, f){
    const R = {x:24, y:56, s:1};
    S.poly([P(R, -5, 32), P(R, 4, 32), P(R, 2, 4), P(R, -9, 3), P(R, -13 + [0, -1, 1, -2][f], 5), P(R, -9, 26)], 'black'); // cape
    S.poly([P(R, -5, 30), P(R, -2, 30), P(R, -8, 6), P(R, -12, 6), P(R, -8, 24)], 'T', {d:1, ol:false});
    arm(S, R, false, -7, 17, 'black', {hand:'pale'});
    legs(S, R, f, {pants:'black', boots:'black', w:2.3});
    torso(S, R, 'purple', {w:5.5});
    S.poly([P(R, -1, 28), P(R, 3, 28), P(R, 2, 17), P(R, 0, 17)], 'snow');
    S.px(...P(R, 1, 26), 'blood', 1);
    S.box(...P(R, -6, 14), 12, 2, 'black');
    arm(S, R, true, 12, 21, 'purple', {hand:'pale'});
    S.line(...P(R, 13, 22.5), ...P(R, 15, 23), 'bone', 0); S.line(...P(R, 13, 21), ...P(R, 15, 21), 'bone', 0);
    S.poly([P(R, -6, 31), P(R, -5, 38), P(R, -2, 30)], 'black'); // col
    const [cx, cy] = head(S, R, 'pale', {dy:36}); face(S, cx, cy, {skin:'pale', eye:'blood', mouth:false});
    S.px(cx + 4, cy + 4, 'pale', 4).px(cx + 5, cy + 5, 'bone', 0);
    cap(S, cx, cy, 'jet', (x, y) => (y < cy - 3 + (Math.abs(x - cx - 2) < 1 ? 2 : 0)) || x < cx - 3);
    if (L >= 3) S.ell(cx - 1, cy - 7, 1.2, 1.2, 'blood', {lv:1});
    if (L >= 4) S.line(...P(R, -5, 28), ...P(R, 5, 28), 'trim', 1);
  }},
  golem: {w:76, h:80, hand:[61, 52], anim:'slam', sw:24, draw(S, L, f){
    const R = {x:35, y:78, s:1.6};
    const W2 = WALK[f];
    for (const [i, dx] of [[0, -3.5], [1, 3.5]]) {
      const ax = W2[i] * .6 + dx * .5;
      S.box(...P(R, dx - 3 + ax * .3, 14), 6 * 1.6, 9 * 1.6, 'stone', {d:i ? 0 : 1, cut:2});
      S.box(...P(R, ax - 4, 5), 9 * 1.6, 5 * 1.6, 'stone', {d:i ? 0 : 1, cut:2});
    }
    S.ell(...P(R, -9, 18), 4.5 * 1.6, 5.5 * 1.6, 'stone', {d:1}); // poing arrière
    S.box(...P(R, -8, 30), 16 * 1.6, 17 * 1.6, 'stone', {cut:4});
    S.box(...P(R, -5, 34), 11 * 1.6, 5 * 1.6, 'stone', {cut:3});
    S.ell(...P(R, -6, 30), 5 * 1.6, 3.5 * 1.6, 'moss');
    S.tex(8, 18, 70, 76, 'stone', (x, y) => (x * 13 + y * 7) % 31 === 0 || (x * 3 + y * 11) % 37 === 0, 2); // fissures
    S.ell(...P(R, 1, 21), 3.6, 3.6, 'U', {lv:1}); S.ell(...P(R, 1, 21), 1.8, 1.8, 'U', {lv:0});
    S.line(...P(R, 1, 18), ...P(R, 1, 14), 'U', 2).line(...P(R, -2, 23), ...P(R, -6, 25), 'U', 2);
    S.ell(...P(R, 15, 18), 5 * 1.6, 5.5 * 1.6, 'stone'); S.ell(...P(R, 12, 25), 4.5 * 1.6, 4 * 1.6, 'stone');
    if (L >= 3) S.ell(...P(R, 12, 26), 3.5 * 1.6, 2.2 * 1.6, 'A');
    const [hx, hy] = P(R, 3, 32); S.px(hx + 3, hy, 'U', 1).px(hx + 6, hy, 'U', 1).px(hx + 3, hy + 1, 'U', 2).px(hx + 6, hy + 1, 'U', 2);
    if (L >= 4) S.ell(hx - 3, hy - 8, 2, 2, 'trim');
  }},
  dragon: {w:68, h:60, hand:[60, 30], fly:true, anim:'breath', sw:14, draw(S, L, f){
    const flap = [0, -6, 2, 6][f];
    const wing = (d, y0) => S.poly([[30, 26], [16, y0 - 12 + flap], [4, y0 - 6 + flap], [10, y0 + 2 + flap * .5], [18, y0 + 6], [26, 34]], 'T', {d, ny:-.3});
    wing(1, 20);
    S.poly([[18, 38], [6, 44], [2, 52], [8, 47], [16, 44], [24, 42]], 'V'); // queue
    S.poly([[2, 52], [0, 56], [5, 51]], 'gold');
    S.ell(28, 38, 11, 8, 'V'); S.ell(30, 41, 8, 4.5, 'linen'); S.tex(20, 30, 40, 46, 'V', (x, y) => (x + y * 2) % 5 === 0, 1);
    S.limb(22, 44, 20, 52, 2.4, 'V', {d:1}); S.limb(33, 45, 34, 53, 2.6, 'V');
    S.limb(36, 34, 46, 26, 3.2, 'V'); // cou
    S.ell(50, 24, 6.5, 5, 'V'); S.box(52, 24, 10, 5, 'V', {cut:2}); S.box(53, 28, 8, 2, 'linen', {lv:2});
    S.px(52, 22, 'gold', 0).px(52, 23, 'eyeL', 2).px(60, 25, 'pupil', 2);
    S.poly([[46, 20], [40, 12], [48, 18]], 'bone'); S.poly([[50, 19], [47, 10], [52, 18]], 'bone');
    for (let k = 0; k < 4; k++) S.poly([[24 + k * 5, 31 - k * 1.5], [26 + k * 5, 27 - k * 2], [28 + k * 5, 31 - k * 1.5]], 'gold', {lv:k ? 2 : 1});
    wing(0, 24);
    S.line(30, 27, 18, 13 + flap, 'V', 2); S.line(30, 27, 6, 19 + flap, 'V', 2);
    if (L >= 3) S.ell(31, 38, 5, 3, 'A');
    if (L >= 4) S.px(51, 21, 'trim', 0);
  }},
  shaman: {w:48, h:62, hand:[36, 41], wp:'sstaff', anim:'cast', sw:12, draw(S, L, f){
    const R = {x:24, y:60, s:1};
    S.poly([P(R, -3, 37), P(R, -11, 30), P(R, -9, 16), P(R, -4, 22)], 'silver', {d:1}); // peau de loup
    arm(S, R, false, -7, 17, 'tan', {hand:'tan'});
    legs(S, R, f, {pants:'leather', boots:'fur'});
    S.poly([P(R, -6, 14), P(R, 6, 14), P(R, 7, 5), P(R, -7, 5)], 'T'); S.tex(14, 44, 34, 56, 'T', (x, y) => x % 3 === 0 && y % 2 === 0, -1);
    torso(S, R, 'tan', {w:5.5});
    for (let k = 0; k < 3; k++) S.line(...P(R, -3, 25 - k * 3), ...P(R, 4, 25 - k * 3), 'zap', 2);
    S.ell(...P(R, 1, 27), 4, 1.5, 'bone');
    arm(S, R, true, 12, 18, 'tan', {hand:'tan'});
    const [cx, cy] = head(S, R, 'tan', {dy:36}); face(S, cx, cy, {skin:'tan', brow:'jet'});
    S.line(cx + 1, cy + 1, cx + 6, cy + 1, 'zap', 2);
    cap(S, cx, cy, 'silver', (x, y) => y < cy - 2 || x < cx - 2, {rx:8.4, ry:8});
    S.px(cx + 5, cy - 4, 'pupil', 2); S.poly([[cx - 2, cy - 8], [cx - 1, cy - 13], [cx + 2, cy - 7]], 'silver');
    for (let k = 0; k < (L >= 3 ? 4 : 2); k++) S.limb(cx - 5 - k * 2, cy - 7 + k, cx - 9 - k * 3, cy - 15 + k * 1.5, 1.2, k % 2 ? 'T' : 'snow');
  }},
  mush: {w:46, h:50, hand:[33, 36], anim:'slam', sw:13, draw(S, L, f){
    const R = {x:22, y:48, s:1};
    legs(S, R, f, {pants:'linen', boots:false, w:2.4, hip:8, stride:.6});
    for (const dx of [-3, 3]) S.ell(...P(R, dx + WALK[f][dx < 0 ? 0 : 1] * .6, 1.5), 3, 2, 'linen', {d:dx < 0 ? 1 : 0});
    S.poly([P(R, -6, 24), P(R, 6, 24), P(R, 8, 12), P(R, 6, 6), P(R, -6, 6), P(R, -8, 12)], 'linen');
    S.tex(12, 22, 34, 44, 'linen', (x, y) => x % 4 === 1 && y % 3 === 0, 1);
    S.px(...P(R, 2, 18), 'toxic', 1).px(...P(R, 5, 18), 'toxic', 1).line(...P(R, 2, 14), ...P(R, 5, 14), 'linen', 4);
    S.limb(...P(R, 5, 14), ...P(R, 11, 12), 2, 'linen');
    S.ell(...P(R, 0, 29), 15, 9, 'T', {if:(x, y) => y < R.y - 23}); // chapeau
    S.ell(...P(R, 0, 23.5), 13, 2, 'V', {lv:3});
    for (const [dx, dy, r] of [[-7, 30, 2.4], [1, 34, 2], [6, 28, 2.6], [-2, 28, 1.6], [10, 27, 1.4], [-11, 27, 1.5]]) S.ell(...P(R, dx, dy), r, r * .8, 'linen');
    if (L >= 3) S.ell(...P(R, 0, 36), 2, 1.5, 'toxic', {lv:1});
    if (L >= 4) S.line(...P(R, -12, 24), ...P(R, 12, 24), 'trim', 1);
  }},

  /* ===== Histoire ===== */
  viking: {w:50, h:58, hand:[37, 37], hand2:[38, 39], wp:'vaxe', wp2:'rshield', anim:'swing', sw:14, draw(S, L, f){
    const R = {x:24, y:56, s:1.05};
    S.poly([P(R, -6, 29), P(R, 2, 29), P(R, -2, 8), P(R, -11, 9), P(R, -9, 24)], 'fur', {d:1});
    arm(S, R, false, -6, 17, 'steel', {hand:'skin'});
    legs(S, R, f, {pants:'cloth', boots:'fur', shin:'leather'});
    S.tex(16, 40, 34, 50, 'leather', (x, y) => (x + y) % 3 === 0, 1);
    torso(S, R, 'steel'); mail(S, 16, 24, 34, 44, 'steel');
    S.poly([P(R, -5, 22), P(R, 6, 22), P(R, 7, 8), P(R, -5, 8)], 'T');
    S.box(...P(R, -6, 14), 13, 2.5, 'leather'); S.box(...P(R, 0, 14.5), 3, 3, 'trim', {ny:0});
    arm(S, R, true, 12, 17, 'steel', {hand:'skin', fore:'leather'});
    const [cx, cy] = head(S, R, 'skin'); face(S, cx, cy, {mouth:false});
    S.poly([[cx - 3, cy + 1], [cx + 8, cy + 2], [cx + 7, cy + 8], [cx + 4, cy + 12], [cx + 1, cy + 8]], 'blond');
    S.ell(cx + 4, cy + 12, 1.3, 1.3, 'trim');
    S.ell(cx - 5, cy + 2, 3, 5, 'blond');
    cap(S, cx, cy, 'A', (x, y) => y < cy - 2);
    S.box(cx - 1, cy - 9, 2, 7, 'trim', {ny:0}); S.line(cx - 8, cy - 2, cx + 7, cy - 2, 'trim', 2);
    if (L >= 3) { S.poly([[cx - 6, cy - 5], [cx - 11, cy - 9], [cx - 10, cy - 14], [cx - 8, cy - 9], [cx - 5, cy - 8]], 'bone'); S.poly([[cx + 5, cy - 6], [cx + 9, cy - 10], [cx + 10, cy - 15], [cx + 7, cy - 10], [cx + 3, cy - 8]], 'bone'); }
  }},
  legion: {w:48, h:58, hand:[35, 38], hand2:[38, 39], wp:'gladius', wp2:'scutum', anim:'stab', sw:13, draw(S, L, f){
    const R = {x:24, y:56, s:1};
    cape(S, R, 'T', f, {lining:'V', bot:10});
    arm(S, R, false, -6, 18, 'skin', {hand:'skin'});
    legs(S, R, f, {pants:'skin', boots:'leather', sandal:true, shin:L >= 3 ? 'A' : 'skin'});
    S.poly([P(R, -6, 15), P(R, 6, 15), P(R, 7, 8), P(R, -7, 8)], 'T');
    for (let k = -5; k <= 5; k += 2) S.line(...P(R, k, 13), ...P(R, k, 8), 'leather', 2);
    torso(S, R, 'A');
    for (let k = 0; k < 4; k++) S.line(...P(R, -6, 24 - k * 3), ...P(R, 7, 24 - k * 3), 'A', 3);
    S.box(...P(R, -6, 15), 13, 2, 'leather');
    arm(S, R, true, 11, 17, 'skin', {hand:'skin', pad:'A'});
    const [cx, cy] = head(S, R, 'skin'); face(S, cx, cy, {brow:'hair'});
    cap(S, cx, cy, 'A', (x, y) => y < cy - 2 || (x < cx - 2 && y < cy + 5));
    S.box(cx + 3, cy - 2, 2, 7, 'A', {ny:0}); // couvre-joue
    S.line(cx - 8, cy - 2, cx + 7, cy - 2, 'trim', 1);
    S.ell(cx - .5, cy - 10, 8, 3, 'T', {if:(x, y) => y < cy - 9}); S.tex(cx - 9, cy - 13, cx + 8, cy - 9, 'T', (x, y) => x % 2 === 0, 1);
  }},
  samurai: {w:50, h:58, hand:[37, 37], wp:'katana', anim:'slash', sw:14, draw(S, L, f){
    const R = {x:24, y:56, s:1};
    S.limb(...P(R, -4, 30), ...P(R, -10, 40), 1, 'dwood'); S.box(...P(R, -12, 44), 4, 3, 'T', {ny:0}); // sashimono
    arm(S, R, false, -6, 17, 'T', {hand:'skin', pad:'T'});
    legs(S, R, f, {pants:'black', boots:'dleather', w:3.1});
    S.poly([P(R, -7, 15), P(R, 7, 15), P(R, 8, 7), P(R, -8, 7)], 'T');
    S.tex(14, 40, 34, 48, 'T', (x, y) => y % 3 === 0, 1);
    torso(S, R, 'T');
    S.tex(16, 26, 32, 42, 'T', (x, y) => y % 3 === 0, 1); S.tex(16, 26, 32, 42, 'T', (x, y) => y % 3 === 1 && x % 3 === 0, -1);
    S.box(...P(R, -6, 15), 13, 2, 'trim', {ny:-.2});
    arm(S, R, true, 12, 17, 'T', {hand:'skin'});
    S.box(...P(R, 2, 28), 7, 7, 'T', {cut:1}); S.line(...P(R, 2, 24), ...P(R, 8, 24), 'trim', 1); // sode
    const [cx, cy] = head(S, R, 'skin'); face(S, cx, cy, {brow:'jet', mouth:false});
    S.box(cx + 2, cy + 2, 6, 4, 'black', {cut:1}); S.line(cx + 3, cy + 3, cx + 6, cy + 3, 'black', 1); // menpo
    cap(S, cx, cy, 'black', (x, y) => y < cy - 2, {ry:8});
    S.poly([[cx - 8, cy - 3], [cx + 6, cy - 3], [cx + 9, cy - 1], [cx - 10, cy + 4], [cx - 9, cy - 1]], 'black'); // shikoro
    S.poly([[cx - 2, cy - 8], [cx - 6, cy - 15], [cx - 1, cy - 9], [cx + 2, cy - 9], [cx + 6, cy - 15], [cx + 2, cy - 8]], L >= 3 ? 'gold' : 'trim');
    if (L >= 4) S.ell(cx, cy - 8, 1.5, 1.5, 'T', {lv:1});
  }},
  ninja: {w:46, h:54, hand:[34, 36], wp:'kunai', anim:'stab', sw:11, draw(S, L, f){
    const R = {x:22, y:52, s:.95};
    arm(S, R, false, -8, 15, 'black', {hand:'black', w:2});
    legs(S, R, f, {pants:'black', boots:'black', w:2.4});
    S.tex(10, 36, 34, 50, 'black', (x, y) => y === 46, 1);
    torso(S, R, 'black', {w:5});
    S.poly([P(R, 6, 27), P(R, 3, 27), P(R, -5, 16), P(R, -3, 14)], 'black', {d:1});
    S.box(...P(R, -5, 15), 11, 2.5, 'T');
    arm(S, R, true, 12, 18, 'black', {hand:'black', w:2});
    const [cx, cy] = head(S, R, 'black', {dy:36});
    S.box(cx, cy - 1, 8, 3, 'skin', {cut:0}); S.px(cx + 2, cy, 'eyeL', 2).px(cx + 5, cy, 'eyeL', 2);
    S.line(cx - 7, cy - 4, cx + 7, cy - 4, 'T', 1); S.line(cx - 7, cy - 3, cx + 7, cy - 3, 'T', 3);
    const fl = [0, 1, -1, 1][f]; S.limb(cx - 7, cy - 3, cx - 14, cy - 2 + fl, 1, 'T'); S.limb(cx - 7, cy - 2, cx - 12, cy + 2 - fl, 1, 'T', {d:1});
    if (L >= 4) S.ell(cx + 1, cy - 4, 1.2, 1.2, 'trim', {lv:0});
  }},
  knight: {w:76, h:76, hand:[50, 37], wp:'lance', anim:'couch', sw:24, draw(S, L, f){
    // le cheval
    const hx = [[0, 0, 0, 0], [5, -5, -4, 4], [2, -2, 2, -2], [-5, 5, 4, -4]][f], lift = [[0, 0, 0, 0], [0, 0, 0, 0], [3, 0, 0, 3], [0, 0, 0, 0]][f];
    const legH = (x0, dx, ln, d) => { S.limb(x0, 52, x0 + dx * .5, 62, 2.6, 'snow', {d}); S.limb(x0 + dx * .5, 62, x0 + dx, 71 - ln, 2.2, 'snow', {d}); S.box(x0 + dx - 2, 71 - ln, 5, 3, 'black', {d}); };
    legH(26, hx[0], lift[0], 1); legH(50, hx[1], lift[1], 1);
    S.poly([[16, 44], [8, 52], [6, 60], [12, 54], [18, 50]], 'jet'); // queue
    S.ell(38, 50, 17, 9, 'snow');
    S.poly([[48, 46], [56, 30], [64, 32], [60, 46]], 'snow'); // encolure
    S.box(58, 28, 13, 8, 'snow', {cut:2}); S.ell(58, 31, 5, 5, 'snow');
    S.px(62, 30, 'pupil', 2).px(68, 34, 'pupil', 3); S.poly([[56, 27], [57, 22], [59, 27]], 'snow');
    S.poly([[52, 30], [57, 27], [56, 38], [50, 44]], 'jet');
    // caparaçon aux couleurs de l'équipe
    S.poly([[22, 42], [54, 42], [57, 56], [46, 60], [30, 60], [20, 56]], 'T');
    S.tex(20, 54, 58, 60, 'T', (x, y) => y === 57 || (y === 58 && x % 4 === 0), 2);
    S.line(20, 56, 57, 56, 'trim', 1);
    S.box(56, 26, 10, 6, 'A', {cut:1}); // chanfrein
    legH(30, hx[2], lift[2], 0); legH(54, hx[3], lift[3], 0);
    // le cavalier
    const R = {x:38, y:52, s:1};
    S.limb(38, 42, 43, 47, 2.6, 'A'); S.box(42, 46, 5, 3, 'A');
    torso(S, R, 'A', {bot:9});
    S.poly([P(R, -4, 27), P(R, 5, 27), P(R, 6, 9), P(R, -4, 9)], 'T');
    S.stamp(...P(R, -1, 23), ['.y.', 'yyy', '.y.'], {y:['trim', 1]});
    arm(S, R, true, 12, 15, 'A', {hand:'A', pad:'A'});
    const [cx, cy] = P(R, 1, 36);
    S.box(cx - 6, cy - 7, 13, 14, 'A', {cut:3}); S.box(cx + 1, cy - 1, 6, 2, 'pupil', {lv:2}); S.px(cx + 3, cy - 1, 'eyeL', 2);
    S.line(cx + 3, cy + 2, cx + 6, cy + 2, 'A', 4);
    plume(S, cx - 2, cy - 9, 'T', f);
    if (L >= 4) S.line(cx - 6, cy - 4, cx + 6, cy - 4, 'trim', 1);
  }},

  /* ===== Moderne ===== */
  rifle: {w:48, h:56, hand:[33, 37], hand2:[42, 35], wp:'rifle', anim:'gun', sw:12, draw(S, L, f){
    const R = R0;
    S.box(...P(R, -10, 30), 6, 12, 'olive', {cut:1}); // sac
    arm(S, R, false, 18, 21, 'V', {hand:'skin'});
    legs(S, R, f, {pants:'olive', boots:'black', knee:L >= 3 ? 'black' : null});
    S.tex(16, 40, 34, 52, 'olive', (x, y) => (x * 3 + y * 5) % 7 < 2, 1);
    torso(S, R, 'V');
    S.poly([P(R, -5, 27), P(R, 6, 27), P(R, 6, 15), P(R, -5, 15)], 'khaki'); // gilet
    for (let k = 0; k < 3; k++) S.box(...P(R, -4 + k * 3.5, 21), 3, 4, 'olive', {cut:0});
    S.box(...P(R, -6, 14), 13, 2, 'black'); S.px(...P(R, 2, 13.5), 'trim', 0);
    arm(S, R, true, 9, 17, 'V', {hand:'skin'});
    S.box(...P(R, 3, 26), 3, 3, 'T', {lv:1});
    const [cx, cy] = head(S, R, 'skin'); face(S, cx, cy, {brow:'hair'});
    cap(S, cx, cy, 'olive', (x, y) => y < cy - 2, {rx:8.4, ry:8});
    S.ell(cx, cy - 2.5, 9.5, 1.6, 'olive', {if:(x, y) => y > cy - 3});
    S.line(cx - 7, cy - 5, cx + 6, cy - 5, 'T', 1);
    S.tex(cx - 8, cy - 10, cx + 8, cy - 4, 'olive', (x, y) => (x + y) % 3 === 0, 1);
    if (L >= 4) S.px(cx - 2, cy - 7, 'trim', 0);
  }},
  gunner: {w:52, h:58, hand:[34, 40], hand2:[44, 38], wp:'mgun', anim:'gun', sw:15, draw(S, L, f){
    const R = {x:25, y:56, s:1.08};
    arm(S, R, false, 17, 18, 'skin', {hand:'black', w:2.8});
    legs(S, R, f, {pants:'olive', boots:'black', w:3});
    torso(S, R, 'olive', {w:7});
    S.poly([P(R, 6, 28), P(R, 3, 28), P(R, -6, 14), P(R, -3, 13)], 'dleather');
    for (let k = 0; k < 6; k++) S.box(...P(R, 4.5 - k * 1.8, 26 - k * 2.4), 2, 3, 'gold', {ny:-.4});
    S.box(...P(R, -7, 14), 15, 2.5, 'black');
    arm(S, R, true, 8, 15, 'skin', {hand:'black', w:2.9, pad:'olive'});
    const [cx, cy] = head(S, R, 'tan', {dy:36}); face(S, cx, cy, {skin:'tan', brow:'jet'});
    S.ell(cx + 4, cy + 4, 4, 2.5, 'jet', {if:(x, y) => y > cy + 3}); // barbe de trois jours
    cap(S, cx, cy, 'T', (x, y) => y < cy - 3, {ry:7.4});
    S.line(cx - 7, cy - 3, cx + 7, cy - 3, 'T', 3);
    S.limb(cx - 7, cy - 3, cx - 12, cy + 1, 1.2, 'T', {d:1}); S.limb(cx - 7, cy - 3, cx - 11, cy + 4, 1.2, 'T', {d:2});
    if (L >= 3) S.ell(...P(R, -2, 21), 2.2, 2.2, 'black');
    if (L >= 4) S.px(cx + 1, cy - 6, 'trim', 0);
  }},
  sniper: {w:48, h:56, hand:[32, 36], hand2:[42, 35], wp:'srifle', anim:'gun', sw:12, draw(S, L, f){
    const R = R0;
    S.poly([P(R, -4, 34), P(R, -11, 30), P(R, -13, 10), P(R, -6, 12), P(R, -2, 24)], 'moss', {d:1}); // ghillie
    S.tex(8, 20, 24, 48, 'moss', (x, y) => (x * 5 + y * 3) % 4 === 0, 1);
    arm(S, R, false, 18, 19, 'moss', {hand:'black'});
    legs(S, R, f, {pants:'olive', boots:'black'});
    torso(S, R, 'moss'); S.tex(16, 26, 32, 44, 'moss', (x, y) => (x * 7 + y * 3) % 5 === 0, 1); S.tex(16, 26, 32, 44, 'moss', (x, y) => (x * 3 + y * 7) % 6 === 0, -1);
    S.box(...P(R, -6, 14), 13, 2, 'dleather');
    arm(S, R, true, 8, 18, 'moss', {hand:'black'});
    const [cx, cy] = head(S, R, 'skin'); face(S, cx, cy, {brow:'hair'});
    S.line(cx + 1, cy + 3, cx + 7, cy + 3, 'T', 1); S.box(cx + 1, cy + 3, 7, 3, 'T', {cut:1});
    cap(S, cx, cy, 'moss', (x, y) => y < cy - 2 || x < cx, {rx:8.6, ry:8.4});
    S.tex(cx - 9, cy - 10, cx + 8, cy + 6, 'moss', (x, y) => (x * 5 + y) % 3 === 0, 1);
    S.ell(cx - 3, cy - 9, 2, 1.4, 'forest'); S.ell(cx + 3, cy - 9, 1.6, 1.2, 'green');
    if (L >= 4) S.px(cx - 6, cy - 4, 'trim', 0);
  }},
  flamer: {w:50, h:58, hand:[33, 40], hand2:[42, 38], wp:'flamer', anim:'spray', sw:14, draw(S, L, f){
    const R = {x:25, y:56, s:1.05};
    S.box(...P(R, -13, 33), 5, 17, 'T', {cut:2}); S.box(...P(R, -9, 33), 5, 17, 'T', {cut:2, d:1});
    S.box(...P(R, -13, 33), 9, 1.5, 'iron'); S.ell(...P(R, -10.5, 34.5), 1.4, 1.4, 'iron');
    S.limb(...P(R, -8, 17), ...P(R, 4, 12), 1.1, 'black'); // tuyau
    arm(S, R, false, 16, 17, 'khaki', {hand:'black', w:2.7});
    legs(S, R, f, {pants:'khaki', boots:'black', w:3, knee:'iron'});
    torso(S, R, 'khaki', {w:6.5});
    S.tex(14, 26, 36, 46, 'khaki', (x, y) => y % 4 === 0, 1);
    S.poly([P(R, 6, 28), P(R, 3, 28), P(R, -6, 15), P(R, -3, 14)], 'black');
    S.box(...P(R, -7, 14), 14, 2.5, 'black');
    arm(S, R, true, 8, 16, 'khaki', {hand:'black', w:2.8});
    const [cx, cy] = head(S, R, 'khaki', {dy:37, ear:false});
    cap(S, cx, cy, 'khaki', (x, y) => true, {rx:7.4, ry:7.4});
    S.ell(cx + 2, cy - 1, 2, 2, 'glass', {lv:1}); S.ell(cx + 6, cy - 1, 1.8, 2, 'glass', {lv:1});
    S.px(cx + 1, cy - 2, 'glass', 0).px(cx + 5, cy - 2, 'glass', 0);
    S.ell(cx + 6, cy + 4, 2.6, 2.6, 'iron'); S.px(cx + 7, cy + 4, 'black', 2);
    S.line(cx - 6, cy - 5, cx + 4, cy - 7, 'T', 1);
    if (L >= 4) S.ell(cx - 3, cy - 3, 1.3, 1.3, 'trim');
  }},
  tank: {w:80, h:56, hand:[76, 25], muzzle:[78, 25], vehicle:true, anim:'recoil', sw:28, draw(S, L, f){
    // chenilles
    S.box(6, 40, 64, 13, 'black', {cut:5});
    S.box(8, 42, 60, 9, 'iron', {cut:4});
    for (let k = 0; k < 6; k++) { const x = 13 + k * 10; S.ell(x, 46.5, 3.6, 3.6, 'steel'); S.px(x, 46, 'black', 2); }
    S.tex(6, 40, 70, 53, 'black', (x, y) => (x + f * 2) % 4 === 0 && (y === 40 || y === 52), -1);
    // caisse
    S.poly([[4, 40], [10, 30], [62, 30], [72, 38], [70, 42], [6, 42]], 'T');
    S.tex(4, 30, 72, 42, 'T', (x, y) => (x * 3 + y * 7) % 13 < 3, 1);
    if (L >= 3) S.box(8, 38, 60, 4, 'A', {ny:0});
    S.box(52, 32, 8, 3, 'black', {lv:3});
    // tourelle et canon
    S.box(55, 22, 24, 5, 'iron', {cut:1}); S.box(74, 21, 6, 7, 'iron', {cut:1});
    S.poly([[20, 30], [24, 20], [34, 16], [50, 16], [58, 21], [60, 30]], 'T');
    S.tex(20, 16, 60, 30, 'T', (x, y) => (x * 5 + y * 3) % 11 < 2, 1);
    S.ell(41, 23, 4.5, 4.5, L >= 4 ? 'gold' : 'trim', {lv:1, if:(x, y) => Math.abs(x - 41) + Math.abs(y - 23) < 4.6});
    S.box(32, 12, 10, 5, 'iron', {cut:1});
    if (L >= 2) { S.limb(37, 12, 37, 6, 3, 'skin'); S.box(33, 3, 8, 4, 'olive', {cut:1}); S.px(39, 6, 'eyeL', 2); }
    S.line(28, 15, 26, 2, 'black', 2);
    S.box(26, 2, 6, 4, 'T', {lv:1});
    if (L >= 5) S.ell(66, 34, 1.6, 1.6, 'U', {lv:0});
  }},

  /* ===== Futuriste ===== */
  cyborg: {w:48, h:56, hand:[33, 37], hand2:[41, 35], wp:'lrifle', anim:'gun', sw:13, draw(S, L, f){
    const R = R0;
    S.box(...P(R, -10, 31), 6, 12, 'iron', {cut:2}); S.line(...P(R, -8, 29), ...P(R, -8, 22), 'U', 1);
    arm(S, R, false, 17, 19, 'steel', {hand:'iron'});
    legs(S, R, f, {pants:'black', shin:'steel', boots:'iron', knee:'U'});
    torso(S, R, 'black');
    S.poly([P(R, -5, 27), P(R, 6, 27), P(R, 7, 19), P(R, 4, 15), P(R, -5, 15)], 'steel');
    S.line(...P(R, 0, 25), ...P(R, 0, 17), 'U', 1); S.line(...P(R, -3, 21), ...P(R, 4, 21), 'U', 2);
    S.box(...P(R, -6, 14), 13, 2, 'iron');
    arm(S, R, true, 9, 17, 'steel', {hand:'iron', pad:'T'});
    const [cx, cy] = head(S, R, 'skin'); face(S, cx, cy, {brow:'jet', eyes:false});
    S.px(cx + 2, cy, 'pupil', 2).px(cx + 2, cy + 1, 'pupil', 2);
    S.ell(cx + 5, cy, 3.2, 4, 'iron', {if:(x, y) => x > cx + 2}); S.ell(cx + 5.5, cy, 1.6, 1.6, 'blood', {lv:1});
    cap(S, cx, cy, 'jet', (x, y) => y < cy - 3 || (x < cx - 3 && y < cy + 2), {ry:7.4});
    S.line(cx - 4, cy - 6, cx + 5, cy - 6, 'steel', 1);
    if (L >= 4) S.line(cx - 7, cy - 3, cx - 7, cy + 2, 'U', 1);
  }},
  mech: {w:80, h:84, hand:[66, 44], muzzle:[78, 44], vehicle:true, anim:'recoil', sw:28, draw(S, L, f){
    const W2 = WALK[f];
    const leg = (x0, ax, d) => {
      S.limb(x0, 54, x0 + 4 + ax * .3, 66, 4, 'iron', {d}); S.limb(x0 + 4 + ax * .3, 66, x0 + ax * .8, 77, 3.4, 'A', {d});
      S.ell(x0 + 4 + ax * .3, 66, 3.6, 3.6, 'T', {d}); S.box(x0 + ax * .8 - 6, 77, 14, 5, 'iron', {d, cut:2});
    };
    leg(32, W2[0] * 1.2, 1);
    S.box(14, 22, 10, 16, 'T', {cut:2}); S.box(16, 18, 6, 5, 'iron'); // pod à roquettes
    for (let k = 0; k < 3; k++) S.ell(19, 26 + k * 4, 1.6, 1.6, 'blood', {lv:k ? 2 : 1});
    S.box(24, 28, 34, 26, 'A', {cut:4});
    S.box(28, 48, 26, 8, 'iron', {cut:2});
    S.poly([[36, 26], [52, 26], [56, 36], [50, 42], [36, 42]], 'glass'); S.line(39, 29, 44, 29, 'glass', 0); S.line(38, 30, 39, 33, 'glass', 0);
    S.ell(44, 36, 2.6, 3.2, 'black', {lv:3}); S.px(45, 35, 'eyeL', 2); // pilote
    S.box(26, 30, 8, 12, 'T', {cut:1}); S.tex(26, 30, 34, 42, 'T', (x, y) => y % 3 === 0, 1);
    S.line(28, 46, 54, 46, 'U', 1);
    leg(46, W2[1] * 1.2, 0);
    S.ell(56, 34, 6, 6, 'iron'); S.limb(56, 36, 60, 44, 4, 'A');
    S.box(56, 40, 22, 8, 'iron', {cut:1}); S.box(60, 39, 10, 10, 'T', {cut:1});
    for (let k = 0; k < 3; k++) S.line(70, 41 + k * 2.5, 78, 41 + k * 2.5, 'black', 2);
    if (L >= 4) S.ell(30, 24, 2, 2, 'trim');
    if (L >= 5) S.ell(50, 24, 2, 2, 'U', {lv:1});
  }},
  drone: {w:44, h:34, hand:[32, 25], muzzle:[38, 26], fly:true, vehicle:true, anim:'recoil', sw:10, draw(S, L, f){
    const sp = f % 2;
    for (const x of [8, 36]) {
      S.box(x - 1, 6, 2, 6, 'iron');
      if (sp) S.line(x - 7, 5, x + 7, 5, 'steel', 1); else { S.line(x - 7, 4, x - 1, 5, 'steel', 1); S.line(x + 1, 5, x + 7, 6, 'steel', 3); }
    }
    S.line(8, 11, 36, 11, 'iron', 2);
    S.ell(22, 17, 12, 7, 'T'); S.ell(22, 14, 9, 3.5, 'V', {if:(x, y) => y < 14});
    S.box(13, 21, 18, 4, 'iron', {cut:1});
    S.ell(29, 17, 3.6, 3.6, 'black'); S.ell(29.5, 17, 1.8, 1.8, 'U', {lv:1});
    S.box(26, 24, 12, 3, 'black'); S.px(38, 25, 'iron', 2);
    S.line(14, 18, 20, 18, 'trim', L >= 4 ? 1 : 3);
    if (L >= 3) S.limb(12, 25, 9, 30, 1, 'iron');
  }},
  saber: {w:48, h:56, hand:[36, 37], wp:'psaber', anim:'slash', sw:13, draw(S, L, f){
    const R = R0;
    cape(S, R, 'V', f, {lining:'T'});
    arm(S, R, false, -8, 16, 'snow', {hand:'black'});
    legs(S, R, f, {pants:'black', shin:'snow', boots:'snow', knee:'T'});
    torso(S, R, 'snow');
    S.poly([P(R, -2, 27), P(R, 4, 27), P(R, 3, 14), P(R, -1, 14)], 'T');
    S.line(...P(R, 1, 26), ...P(R, 1, 16), 'U', 1);
    S.box(...P(R, -6, 14), 13, 2, 'black'); S.px(...P(R, 2, 13.5), 'U', 1);
    arm(S, R, true, 12, 17, 'snow', {hand:'black', pad:'snow'});
    const [cx, cy] = head(S, R, 'snow', {ear:false});
    S.poly([[cx + 1, cy - 2], [cx + 8, cy - 1], [cx + 7, cy + 2], [cx + 1, cy + 1]], 'black', {lv:2});
    S.line(cx + 2, cy, cx + 7, cy, 'U', 1);
    S.line(cx - 6, cy + 3, cx + 5, cy + 5, 'snow', 3);
    S.poly([[cx - 3, cy - 6], [cx - 1, cy - 11], [cx + 2, cy - 6]], 'T');
    if (L >= 4) S.line(cx - 7, cy - 2, cx - 3, cy - 6, 'trim', 1);
  }}
};

/* ---------- ARMES (dessinées pointe vers le haut, ou canon vers la droite pour les armes à feu) ---------- */
// g : point de prise · tip : bouche du canon · gun : tenue à l'horizontale
const WEAP = {
  sword: {w:12, h:36, g:[6, 28], draw(S, L){
    S.box(5, 2, 3, 21, 'steel', {ny:0}); S.px(6, 1, 'steel', 1); S.line(6, 4, 6, 20, 'steel', L >= 5 ? 0 : 1);
    if (L >= 5) S.line(5, 3, 5, 21, 'U', 1);
    S.box(1, 23, 11, 2, 'trim', {ny:-.4}); S.box(5, 25, 3, 6, 'dleather'); S.tex(5, 25, 7, 31, 'dleather', (x, y) => y % 2 === 0, 1);
    S.ell(6.5, 32.5, 2, 2, 'trim');
  }},
  spear: {w:9, h:58, g:[4, 40], draw(S, L){
    S.box(4, 12, 2, 45, 'wood'); S.tex(4, 12, 5, 57, 'wood', (x, y) => y % 7 === 0, 1);
    S.poly([[4.5, 0], [8, 7], [5.5, 12], [3.5, 12], [1, 7]], 'steel'); S.line(4, 2, 4, 10, 'steel', 0);
    S.box(3, 12, 4, 2, 'trim', {ny:0}); S.ell(4.5, 15.5, 2.4, 1.8, 'T');
  }},
  bow: {w:12, h:36, g:[8, 18], draw(S, L){
    const pts = [[3, 1], [7, 6], [9, 12], [9, 24], [7, 30], [3, 35]];
    for (let k = 0; k < pts.length - 1; k++) S.limb(...pts[k], ...pts[k + 1], 1.3, L >= 4 ? 'gold' : 'wood');
    S.line(3, 2, 3, 34, 'linen', 0); S.box(8, 15, 3, 6, 'dleather', {ny:0});
  }},
  ebow: {w:14, h:42, g:[9, 21], draw(S, L){
    const pts = [[2, 1], [6, 3], [8, 9], [10, 15], [10, 27], [8, 33], [6, 39], [2, 41]];
    for (let k = 0; k < pts.length - 1; k++) S.limb(...pts[k], ...pts[k + 1], 1.2, k === 0 || k === 6 ? 'gold' : 'forest');
    S.line(3, 2, 3, 40, 'U', 1); S.box(9, 18, 3, 6, 'gold', {ny:0});
    S.ell(12, 13, 1.6, 2.4, 'green'); S.ell(12, 29, 1.6, 2.4, 'green');
  }},
  shield: {w:26, h:34, g:[13, 15], draw(S, L){
    S.poly([[1, 1], [24, 1], [24, 15], [12.5, 33], [1, 15]], 'A', {ny:-.2});
    S.poly([[3, 3], [22, 3], [22, 15], [12.5, 30], [3, 15]], 'T', {ny:-.2});
    S.tex(3, 3, 22, 30, 'T', (x, y) => x < 12 && y < 15 && (x + y) % 2 === 0, -1);
    S.stamp(9, 7, ['..yy..', '..yy..', 'yyyyyy', 'yyyyyy', '..yy..', '..yy..', '..yy..'], {y:['trim', 1]});
    if (L >= 4) S.ell(12.5, 22, 2, 2, 'U', {lv:1});
  }},
  mace: {w:14, h:28, g:[7, 22], draw(S, L){
    S.box(6, 8, 3, 19, 'dwood'); S.ell(7.5, 6, 5, 5, 'iron');
    for (const [x, y] of [[7, 0], [1, 6], [13, 6], [3, 2], [11, 2]]) S.px(x, y, 'steel', 1);
    S.box(5, 25, 5, 2, 'trim');
  }},
  bomb: {w:16, h:18, g:[8, 11], draw(S, L){
    S.ell(8, 11, 6, 6, 'black'); S.box(6, 3, 4, 3, 'iron'); S.line(9, 2, 11, 0, 'rope', 1);
    S.px(12, 0, 'fire', 0); S.ell(5.5, 8.5, 1.4, 1.4, 'black', {lv:0});
    S.px(8, 12, 'T', 1).px(9, 12, 'T', 1).px(8, 13, 'T', 2);
  }},
  axe2: {w:24, h:42, g:[12, 33], draw(S, L){
    S.box(11, 4, 3, 37, 'dwood'); S.tex(11, 4, 13, 41, 'dwood', (x, y) => y % 4 === 0, 1);
    S.poly([[11, 6], [4, 2], [1, 10], [4, 18], [11, 14]], 'iron'); S.poly([[13, 6], [20, 2], [23, 10], [20, 18], [13, 14]], 'iron');
    S.line(1, 9, 4, 3, 'steel', 0); S.line(23, 9, 20, 3, 'steel', 0);
    S.poly([[12.5, 0], [14, 5], [11, 5]], 'steel'); S.box(10, 22, 5, 2, 'T', {ny:0});
    if (L >= 4) S.line(4, 10, 9, 10, 'U', 1);
  }},
  keg: {w:18, h:20, g:[9, 11], draw(S, L){
    S.box(2, 5, 14, 14, 'wood', {cut:3}); S.tex(2, 5, 16, 19, 'wood', (x, y) => x % 4 === 0, 1);
    S.box(2, 7, 14, 1, 'iron', {lv:2}); S.box(2, 16, 14, 1, 'iron', {lv:3});
    S.stamp(6, 10, ['.ww.', 'wpwp', '.ww.'], {w:['bone', 1], p:['pupil', 2]});
    S.line(9, 4, 12, 0, 'rope', 1); S.px(13, 0, 'fire', 0);
  }},
  club: {w:18, h:44, g:[9, 36], draw(S, L){
    S.poly([[7, 42], [11, 42], [14, 8], [9, 1], [4, 8]], 'wood');
    S.tex(4, 1, 14, 42, 'wood', (x, y) => (x * 3 + y) % 5 === 0, 1);
    for (const [x, y] of [[3, 8], [15, 10], [4, 16], [14, 4], [13, 18]]) S.px(x, y, L >= 3 ? 'steel' : 'bone', 0);
    S.box(6, 34, 7, 3, 'leather');
  }},
  fstaff: {w:14, h:50, g:[7, 30], draw(S, L){
    S.box(6, 10, 2, 39, 'dwood'); S.poly([[3, 4], [6, 10], [8, 10], [11, 4], [9, 8], [5, 8]], 'gold');
    S.ell(7, 5, 4, 4, 'fire', {lv:2}); S.ell(6.5, 4.5, 2.2, 2.2, 'fire', {lv:0});
    if (L >= 3) S.px(7, 0, 'fire', 1);
  }},
  hstaff: {w:14, h:50, g:[7, 30], draw(S, L){
    S.box(6, 12, 2, 37, 'linen'); S.ell(7, 6, 5.5, 5.5, 'gold', {if:(x, y) => (x - 7) ** 2 + (y - 6) ** 2 > 9});
    S.ell(7, 6, 2.4, 2.4, 'holy', {lv:1}); S.box(5, 12, 4, 2, 'gold');
    if (L >= 3) S.ell(7, 18, 1.4, 2, 'T');
  }},
  nstaff: {w:14, h:50, g:[7, 30], draw(S, L){
    S.box(6, 10, 2, 39, 'dwood'); S.tex(6, 10, 7, 49, 'dwood', (x, y) => y % 5 === 0, 1);
    S.ell(7, 5.5, 4.6, 4.6, 'bone'); S.box(5, 9, 5, 3, 'bone', {lv:2});
    S.px(5, 5, 'void', 1).px(9, 5, 'void', 1).px(7, 8, 'pupil', 2);
    S.line(1, 9, 3, 13, 'void', 2);
  }},
  bsword: {w:10, h:28, g:[5, 22], draw(S, L){
    S.box(4, 2, 3, 15, 'bronze', {ny:0}); S.px(5, 1, 'bronze', 1); S.px(6, 6, 'dleather', 2).px(4, 11, 'dleather', 2);
    S.box(1, 17, 9, 2, 'iron'); S.box(4, 19, 3, 5, 'dleather'); S.ell(5.5, 25, 1.5, 1.5, 'iron');
  }},
  hammer: {w:20, h:36, g:[10, 29], draw(S, L){
    S.box(9, 8, 3, 27, 'wood'); S.box(2, 2, 16, 9, 'iron', {cut:1}); S.box(2, 2, 3, 9, 'A', {ny:0}); S.box(15, 2, 3, 9, 'A', {ny:0});
    if (L >= 3) S.stamp(8, 4, ['u.u', '.u.', 'u.u'], {u:['U', 1]});
    S.box(8, 26, 5, 2, 'trim');
  }},
  phammer: {w:22, h:46, g:[11, 36], draw(S, L){
    S.box(10, 10, 3, 35, 'linen'); S.tex(10, 10, 12, 45, 'linen', (x, y) => y % 4 === 0, 1);
    S.box(2, 2, 19, 11, 'A', {cut:2}); S.box(8, 1, 7, 13, 'trim', {cut:1}); S.stamp(10, 4, ['.h.', 'hhh', '.h.'], {h:['holy', 1]});
    S.box(9, 42, 5, 3, 'trim');
  }},
  gaxe: {w:34, h:52, g:[17, 42], draw(S, L){
    S.box(16, 6, 3, 45, 'dwood');
    S.poly([[16, 8], [6, 2], [1, 12], [3, 24], [16, 18]], 'A'); S.poly([[19, 8], [29, 2], [34, 12], [32, 24], [19, 18]], 'A');
    S.line(1, 12, 6, 2, 'steel', 0); S.line(34, 12, 29, 2, 'steel', 0);
    S.box(14, 9, 7, 9, 'trim', {cut:1}); S.poly([[17.5, 0], [19, 6], [16, 6]], 'steel');
  }},
  sstaff: {w:16, h:52, g:[8, 32], draw(S, L){
    S.box(7, 9, 2, 42, 'wood'); S.tex(7, 9, 8, 51, 'wood', (x, y) => y % 6 === 0, 2);
    S.ell(8, 5, 4, 4, 'zap', {lv:2}); S.ell(8, 5, 2, 2, 'zap', {lv:0});
    S.poly([[4, 9], [8, 12], [12, 9], [8, 10]], 'bone');
    S.limb(6, 13, 2, 22, 1.2, 'T'); S.limb(10, 13, 13, 21, 1.2, 'snow');
  }},
  vaxe: {w:16, h:32, g:[6, 25], draw(S, L){
    S.box(5, 3, 3, 28, 'wood');
    S.poly([[8, 3], [14, 1], [15, 8], [13, 14], [8, 10]], 'iron'); S.line(15, 2, 15, 9, 'steel', 0); S.line(13, 13, 15, 9, 'steel', 1);
    S.box(4, 26, 5, 2, 'leather');
  }},
  rshield: {w:24, h:24, g:[12, 12], draw(S, L){
    S.ell(12, 12, 11, 11, 'A'); S.ell(12, 12, 9.4, 9.4, 'wood');
    S.ell(12, 12, 9.4, 9.4, 'T', {if:(x, y) => Math.abs(x - y) < 4 || Math.abs(x + y - 24) < 0});
    S.tex(3, 3, 21, 21, 'wood', (x, y) => x % 3 === 0, 1);
    S.ell(12, 12, 3, 3, 'iron'); S.px(11, 11, 'steel', 0);
  }},
  gladius: {w:10, h:26, g:[5, 21], draw(S, L){
    S.poly([[5, 0], [7.5, 3], [7.5, 15], [2.5, 15], [2.5, 3]], 'steel'); S.line(4, 3, 4, 14, 'steel', 0);
    S.box(1, 15, 9, 2, 'trim'); S.box(4, 17, 3, 6, 'wood'); S.ell(5.5, 24, 2, 1.6, 'trim');
  }},
  scutum: {w:18, h:32, g:[9, 16], draw(S, L){
    S.box(1, 1, 16, 30, 'A', {cut:2}); S.box(2, 2, 14, 28, 'T', {cut:2});
    S.stamp(5, 7, ['y......y', '.y....y.', '..y..y..', '...yy...', '...yy...', '..y..y..', '.y....y.', 'y......y'], {y:['trim', 1]});
    S.ell(9, 16, 2.6, 2.6, 'trim'); S.box(2, 3, 2, 26, 'T', {lv:1});
  }},
  katana: {w:10, h:42, g:[5, 34], draw(S, L){
    const pts = [[6, 1], [5, 10], [5, 20], [5, 28]];
    for (let k = 0; k < 3; k++) S.limb(...pts[k], ...pts[k + 1], 1, 'steel');
    S.line(4, 4, 4, 27, 'steel', 0); if (L >= 5) S.line(6, 6, 6, 27, 'U', 1);
    S.ell(5, 29, 3, 1.3, 'gold'); S.box(4, 30, 3, 9, 'T'); S.tex(4, 30, 6, 39, 'T', (x, y) => (x + y) % 2 === 0, 2);
  }},
  kunai: {w:8, h:18, g:[4, 13], draw(S, L){
    S.poly([[4, 0], [6.5, 6], [4.5, 9], [3.5, 9], [1.5, 6]], 'steel'); S.line(3, 3, 3, 7, 'steel', 0);
    S.box(3, 9, 2, 6, 'T'); S.ell(4, 16, 2, 2, 'iron', {if:(x, y) => (x - 4) ** 2 + (y - 16) ** 2 > 1});
  }},
  lance: {w:12, h:70, g:[6, 54], draw(S, L){
    S.poly([[6, 0], [8, 40], [9, 46], [3, 46], [4, 40]], 'T'); S.tex(3, 0, 9, 46, 'T', (x, y) => (x + y) % 6 < 2, -1);
    S.line(6, 2, 7, 40, 'T', 0);
    S.poly([[3, 46], [9, 46], [11, 50], [1, 50]], 'A'); S.box(5, 50, 3, 18, 'wood');
    S.poly([[6, 10], [12, 13], [6, 16]], 'trim');
  }},
  psaber: {w:8, h:40, g:[4, 34], draw(S, L){
    S.box(2, 1, 4, 28, 'U', {lv:2}); S.box(3, 1, 2, 28, 'U', {lv:0}); S.px(3, 0, 'U', 1);
    S.box(2, 29, 4, 9, 'steel'); S.line(2, 31, 5, 31, 'black', 2).line(2, 34, 5, 34, 'black', 2); S.px(4, 29, 'trim', 0);
  }},
  rifle: {w:36, h:12, g:[11, 7], tip:[35, 3], gun:true, draw(S, L){
    S.poly([[1, 3], [10, 3], [12, 7], [6, 9], [1, 8]], 'wood');
    S.box(10, 2, 15, 4, 'iron'); S.box(24, 2, 11, 2, 'iron'); S.box(14, 6, 3, 5, 'black');
    S.box(16, 2, 9, 2, 'wood', {lv:1}); S.px(34, 1, 'iron', 1); S.box(12, 6, 2, 3, 'iron');
    if (L >= 3) S.box(17, 0, 5, 2, 'black');
  }},
  mgun: {w:42, h:16, g:[13, 9], tip:[41, 5], gun:true, draw(S, L){
    S.box(1, 4, 11, 6, 'iron', {cut:1}); S.box(10, 3, 18, 6, 'black'); S.box(26, 4, 15, 3, 'iron');
    for (let k = 0; k < 4; k++) S.px(28 + k * 3, 4, 'black', 2);
    S.ell(18, 12, 4.2, 3.6, 'olive'); S.box(14, 9, 2, 4, 'black');
    S.limb(18, 9, 22, 6, .8, 'gold', {lv:1}); S.box(10, 2, 8, 1, 'steel', {lv:1});
  }},
  srifle: {w:50, h:12, g:[15, 7], tip:[49, 4], gun:true, draw(S, L){
    S.poly([[1, 3], [12, 3], [14, 7], [8, 10], [1, 9]], 'olive');
    S.box(12, 3, 16, 4, 'black'); S.box(27, 3, 22, 2, 'iron');
    S.box(14, 0, 12, 3, 'black', {cut:1}); S.px(25, 1, 'glass', 0).px(14, 1, 'glass', 2);
    S.box(15, 7, 2, 4, 'black'); S.line(40, 5, 37, 10, 'iron', 2).line(40, 5, 43, 10, 'iron', 2);
  }},
  flamer: {w:32, h:16, g:[10, 9], tip:[31, 6], gun:true, draw(S, L){
    S.box(1, 4, 10, 6, 'iron', {cut:1}); S.box(9, 4, 14, 5, 'T'); S.box(22, 5, 9, 3, 'iron');
    S.box(29, 4, 3, 5, 'black'); S.ell(16, 11, 3, 3, 'iron'); S.box(11, 9, 2, 5, 'black');
    S.px(31, 9, 'fire', 0).px(31, 10, 'fire', 2);
  }},
  lrifle: {w:36, h:14, g:[11, 8], tip:[35, 5], gun:true, draw(S, L){
    S.poly([[1, 4], [10, 3], [12, 9], [3, 10]], 'snow');
    S.box(10, 2, 18, 6, 'snow', {cut:1}); S.box(27, 3, 8, 3, 'iron'); S.px(35, 4, 'U', 1);
    S.line(12, 5, 26, 5, 'U', 1); S.box(14, 8, 3, 5, 'black'); S.box(20, 0, 6, 2, 'black');
  }}
};

/* ---------- SPRITES ---------- */
const sprCache = new Map();
const WALK_SEQ = [1, 2, 3, 2];
function unitH(type){ return UNITS_ART[type].h / HR; }
// grille brute d'un soldat (sans couleurs) : réutilisée par toutes les variantes de couleur
const gridCache = new Map();
function unitGrid(type, lvl, frame){
  const k = type + lvl + frame; let S = gridCache.get(k); if (S) return S;
  const A = UNITS_ART[type]; S = new Spr(A.w, A.h); A.draw(S, lvl, frame); gridCache.set(k, S); return S;
}
function bodySprite(type, lvl, team, frame, flash){
  const key = `b${type}${lvl}${team}${frame}${flash ? 1 : 0}`;
  let c = sprCache.get(key); if (c) return c;
  c = rasterCanvas(rasterize(unitGrid(type, lvl, frame), palFor(lvl, team), flash));
  sprCache.set(key, c); return c;
}
function weaponSprite(name, lvl, team, flash){
  const key = `w${name}${lvl}${team}${flash ? 1 : 0}`;
  let c = sprCache.get(key); if (c) return c;
  const W = WEAP[name], S = new Spr(W.w, W.h); W.draw(S, lvl);
  c = rasterCanvas(rasterize(S, palFor(lvl, team), flash)); sprCache.set(key, c); return c;
}
