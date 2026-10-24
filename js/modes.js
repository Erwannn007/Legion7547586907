/* Légion Pixel — Modes de jeu : campagne, bac à sable, panneau, contrôles tactiles et boucle */
'use strict';
/* ---------- CAMPAGNE : 20 batailles écrites à la main ---------- */
// bloc ennemi : [type, nombre, x (0 = gauche, 1 = droite), rang (0 = devant, 2 = fond), colonnes, niveau?]
// 'lord' = Seigneur de guerre (boss géant)
const LEVELS = [
  {n:'Premier sang', lv:1, d:'Une patrouille ennemie barre la route des plaines.',
    h:'Choisissez l’Épéiste, peignez des soldats dans la zone bleue puis touchez Combattre. Moins vous dépensez, plus vous gagnez d’étoiles.',
    b:[['sword', 10, .5, 0, 5]]},
  {n:'Pluie de flèches', lv:1, d:'Des archères abritées derrière quelques épéistes.',
    h:'Les archères sont fragiles mais tirent de loin. Attaquez par les côtés pour les atteindre vite.',
    b:[['sword', 6, .5, 0, 6], ['archer', 12, .5, 2, 6]]},
  {n:'La ligne', lv:1, d:'Une vraie ligne de bataille. Vos Lanciers sont arrivés.',
    h:'Le Lancier ignore l’armure et touche aussi le soldat derrière sa cible : parfait contre une ligne serrée.',
    b:[['sword', 10, .25, 0, 5], ['sword', 10, .75, 0, 5], ['archer', 10, .5, 2, 5]]},
  {n:'Embuscade', lv:1, d:'L’ennemi a caché des troupes sur ses flancs.',
    h:'Ne mettez pas tout au centre : gardez des soldats sur les côtés pour ne pas être encerclé.',
    b:[['sword', 12, .12, 0, 3], ['sword', 12, .88, 0, 3], ['goblin', 8, .5, 0, 8], ['archer', 12, .5, 2, 6]]},
  {n:'Le Seigneur des Plaines', lv:1, d:'Un Seigneur de guerre géant mène l’armée des plaines.',
    h:'Le Seigneur encaisse énormément et balaie tout autour de lui. Les Lanciers ignorent son armure : entourez-le.',
    b:[['lord', 1, .5, 1, 1, 2], ['sword', 10, .25, 0, 5], ['sword', 10, .75, 0, 5], ['skel', 12, .5, 0, 6], ['archer', 14, .5, 2, 7]]},

  {n:'Le mur de lances', lv:2, d:'Un mur de piques sur toute la largeur. Le Gardien rejoint votre armée.',
    h:'Les charges s’y brisent. Arrosez-le d’archères et faites tenir la ligne par un Gardien, qui attire les coups.',
    b:[['spear', 24, .5, 0, 12], ['elf', 10, .5, 2, 10]]},
  {n:'Les fantômes de la forêt', lv:2, d:'Des dizaines d’archères cachées dans la brume.',
    h:'Le Gardien bloque les flèches qui arrivent de face. Placez-en devant vos troupes.',
    b:[['viking', 8, .5, 0, 8], ['elf', 14, .2, 1, 7], ['elf', 14, .8, 1, 7], ['archer', 10, .5, 2, 5]]},
  {n:'Bouclier contre bouclier', lv:2, d:'L’ennemi avance derrière ses propres Gardiens.',
    h:'Les Gardiens résistent à presque tout, sauf aux Lanciers qui ignorent leur armure.',
    b:[['guard', 4, .5, 0, 4], ['legion', 12, .5, 1, 6], ['spear', 12, .5, 1, 6], ['archer', 14, .5, 2, 7]]},
  {n:'La horde', lv:2, d:'Une marée d’épéistes déferle sur la forêt.',
    h:'Tenez une ligne continue de Lanciers appuyée par des Gardiens : une horde éparpillée se fait découper.',
    b:[['orc', 12, .18, 0, 6], ['skel', 30, .5, 0, 10], ['orc', 12, .82, 0, 6], ['goblin', 12, .5, 1, 12]]},
  {n:'Le Roi Sylvain', lv:2, d:'Le roi de la forêt défend son trône. Vos Sapeurs sont arrivés.',
    h:'Les Sapeurs font exploser les groupes serrés : idéal contre l’escorte du roi. Gardez-les loin du Seigneur.',
    b:[['lord', 1, .5, 1, 1, 3], ['guard', 4, .5, 0, 4], ['dwarf', 8, .18, 0, 4], ['dwarf', 8, .82, 0, 4], ['priest', 3, .5, 1, 3], ['elf', 18, .5, 2, 9]]},

  {n:'Artillerie', lv:3, d:'Des Sapeurs pilonnent depuis l’arrière des dunes.',
    h:'Les explosions punissent les troupes serrées : étalez vos soldats en lignes fines et foncez sur les Sapeurs.',
    b:[['guard', 4, .5, 0, 4], ['viking', 12, .5, 0, 6], ['bomber', 10, .5, 2, 5]]},
  {n:'Tempête de sable', lv:3, d:'Une armée de tireurs vous attend dans les dunes.',
    h:'Avancez vite : des Épéistes en Charge atteignent l’arrière avant que la pluie de flèches ne fasse trop de dégâts.',
    b:[['spear', 16, .5, 0, 8], ['bomber', 6, .5, 1, 6], ['rifle', 16, .25, 2, 8], ['archer', 16, .75, 2, 8]]},
  {n:'Le carré', lv:3, d:'Une formation compacte, hérissée de piques.',
    h:'Un groupe aussi serré est le rêve d’un Sapeur.',
    b:[['legion', 24, .5, 0, 8], ['guard', 6, .5, 1, 6], ['archer', 18, .5, 2, 9]]},
  {n:'Double front', lv:3, d:'Deux colonnes avancent sur vos flancs.',
    h:'Gardez le centre léger et doublez vos défenses sur les côtés.',
    b:[['samurai', 9, .18, 0, 3], ['ninja', 9, .82, 0, 3], ['sword', 12, .5, 0, 6], ['archer', 12, .5, 1, 6], ['mage', 6, .5, 2, 6]]},
  {n:'Le Sultan des Dunes', lv:3, d:'Le maître des sables et ses artificiers.',
    h:'Ne groupez pas vos troupes face aux Sapeurs, et gardez de quoi achever le Seigneur.',
    b:[['lord', 1, .5, 1, 1, 4], ['troll', 1, .5, 0, 1], ['spear', 20, .5, 0, 10], ['bomber', 4, .18, 1, 4], ['bomber', 4, .82, 1, 4], ['mage', 6, .5, 2, 6], ['archer', 14, .5, 2, 7]]},

  {n:'Les loups de l’hiver', lv:4, d:'Des épéistes aguerris surgissent du blizzard.',
    h:'Ils frappent fort. Si ça coince, montez vos soldats au rang Or dans l’Armée.',
    b:[['knight', 6, .15, 0, 3], ['vampire', 6, .85, 0, 3], ['sword', 20, .5, 1, 10], ['archer', 20, .5, 2, 10, 3]]},
  {n:'Forteresse de glace', lv:4, d:'Un rempart de Gardiens protège une armée de tireurs.',
    h:'Contournez le rempart par les côtés, ou percez-le avec des Lanciers.',
    b:[['guard', 8, .5, 0, 8], ['gunner', 4, .5, 1, 4, 3], ['shaman', 4, .5, 1, 4, 3], ['archer', 30, .5, 2, 10, 3]]},
  {n:'Le grand assaut', lv:4, d:'La plus grande armée que vous ayez affrontée.',
    h:'Pas de recette unique : observez sa composition et répondez arme par arme.',
    b:[['sword', 24, .18, 0, 8], ['tank', 1, .5, 1, 1, 3], ['cyborg', 6, .5, 0, 6], ['spear', 24, .82, 0, 8], ['necro', 4, .5, 1, 4, 3], ['flamer', 4, .5, 1, 4, 3], ['archer', 24, .5, 2, 12, 3]]},
  {n:'La garde royale', lv:4, d:'L’élite de l’Empereur tient le col.',
    h:'Les Paladins soignent leurs voisins : concentrez-vous sur eux, et méfiez-vous du tireur d’élite.',
    b:[['paladin', 6, .5, 0, 6], ['saber', 9, .5, 0, 9], ['spear', 24, .5, 1, 12], ['sniper', 4, .5, 2, 4], ['drone', 9, .5, 2, 9]]},
  {n:'L’Empereur de Givre', lv:4, d:'Le dernier Seigneur de guerre. Tout se joue ici.',
    h:'Gagnez en dépensant le moins possible pour décrocher les trois étoiles.',
    b:[['lord', 1, .5, 1, 1, 5], ['golem', 1, .2, 0, 1], ['minotaur', 1, .8, 0, 1], ['guard', 6, .5, 0, 6], ['spear', 20, .18, 0, 5], ['spear', 20, .82, 0, 5], ['dragon', 2, .5, 1, 2], ['mech', 1, .5, 2, 1], ['archer', 24, .5, 2, 12]]}
];
const LORD_COST = 300, BUDGET_X = 1.5, STAR3 = .64, STAR2 = .8;
const r10 = v => Math.round(v / 10) * 10;
function levelDef(i){
  const L = LEVELS[i - 1], ch = Math.floor((i - 1) / 5);
  const blocks = L.b.map(([type, n, x, row, cols, lv]) => ({type, n, x, row, cols, lvl:lv || L.lv}));
  // un Seigneur plus gradé que son armée vaut plus cher
  const value = blocks.reduce((s, k) => s + (k.type === 'lord' ? LORD_COST * Math.pow(1.3, k.lvl - L.lv - 1) : UT[k.type].cost * k.n), 0);
  const budget = r10(value * BUDGET_X);
  return {i, ch, boss:i % 5 === 0, name:L.n, desc:L.d, hint:L.h, blocks, count:blocks.reduce((s, k) => s + k.n, 0),
    budget, s3:r10(budget * STAR3), s2:r10(budget * STAR2)};
}
const starsFor = (d, spent) => spent <= d.s3 ? 3 : spent <= d.s2 ? 2 : 1;
// l'armée ennemie se range en formations, rang par rang
function spawnEnemies(d){
  const z = zone('red');
  d.blocks.forEach(k => {
    const ay = z.y1 - 10 - k.row * 28, cx = k.x * G.W;
    if (k.type === 'lord') { const u = makeLord(k.lvl, 'red', cx, clamp(ay - 4, z.y0 + 14, z.y1)); u.drop = .9; units.push(u); return; }
    const sp = gapOf(k.type), sy = Math.round(gapOf(k.type) * .9);
    for (let j = 0; j < k.n; j++) {
      const col = j % k.cols, row = Math.floor(j / k.cols);
      const x = clamp(cx + (col - (k.cols - 1) / 2) * sp, 8, G.W - 8), y = clamp(ay - row * sy, z.y0 + 4, z.y1);
      const u = makeUnit(k.type, k.lvl, 'red', x + (rnd() - .5) * 2, y); u.drop = .2 + rnd() * .7; units.push(u);
    }
  });
}
// bannière de chapitre : le terrain du chapitre et quelques ennemis typiques
const banCache = {};
function chapterBanner(ci){
  if (banCache[ci]) return cloneCanvas(banCache[ci]);
  const W = 120, H = 34, c = document.createElement('canvas'); c.width = W * HR; c.height = H * HR;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.scale(HR, HR);
  x.drawImage(genGround(CHAPTERS[ci].theme, W, H, ci * 13 + 4), 0, 0);
  const types = levelDef(ci * 5 + 5).blocks.filter(k => k.type !== 'lord' && UNITS_ART[k.type].h < 64);
  [0, 1, 2].forEach(k => {
    const s = types[k % types.length];
    drawUnitAt(x, {type:s.type, lvl:s.lvl, team:'red', face:-1, atk:0, moving:false, walk:0, flash:0, id:k, cd:0, cdMax:1, aim:-.2}, W - 14 - k * 17, H - 3 - (k % 2) * 2, 0);
  });
  banCache[ci] = c; return cloneCanvas(c);
}
function cloneCanvas(src){ const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); return c; }
function buildStory(){
  let h = '';
  CHAPTERS.forEach((ch, ci) => {
    const lockCh = ci * 5 + 1 > SAV.cleared + 1;
    let st = 0; for (let j = 1; j <= 5; j++) st += SAV.stars[ci * 5 + j] || 0;
    h += `<div class="chap pp ${lockCh ? 'lock' : ''}"><div class="chban" data-ci="${ci}"><div class="chn"><small>CHAPITRE ${ci + 1}</small><b>${ch.name}</b></div>
      <div class="chs chip pn st">${ic('star', 2)}${st}/15</div></div><div class="nodes">`;
    for (let j = 1; j <= 5; j++) {
      const i = ci * 5 + j, lock = i > SAV.cleared + 1, s = SAV.stars[i] || 0, curL = i === SAV.cleared + 1;
      h += `<button class="pb node ${curL ? 'brass cur' : j === 5 && !lock ? 'red' : !lock ? 'done' : ''}" data-l="${i}" ${lock ? 'disabled' : ''}>
        ${lock ? ic('lock', 2) : j === 5 ? ic('crown', 3) : `<span>${lvLabel(i)}</span>`}<span class="st">${lock || curL ? '' : starsHtml(s, 1)}</span></button>`;
    }
    h += '</div></div>';
  });
  const el = $('#story-list'); el.innerHTML = h;
  $('#story-sub').textContent = `${Math.min(SAV.cleared, NLEV)}/${NLEV} niveaux · ${totalStars()} étoiles`;
  el.querySelectorAll('.chban').forEach(b => b.prepend(chapterBanner(+b.dataset.ci)));
  el.querySelectorAll('.node').forEach(b => b.onclick = () => { sfx('click'); levelModal(+b.dataset.l); });
  const curN = el.querySelector('.node.cur'); if (curN) curN.scrollIntoView({block:'center'});
}
const goldFor = (i, first) => first ? 40 + i * 12 : Math.round((40 + i * 12) / 2);
function levelModal(i){
  const d = levelDef(i), grp = {}, first = SAV.cleared < i, best = SAV.stars[i] || 0;
  d.blocks.forEach(k => { const key = k.type + k.lvl; grp[key] = grp[key] || {type:k.type, lvl:k.lvl, n:0}; grp[key].n += k.n; });
  openModal(`<div class="mc"><div class="chban" id="lban" style="width:100%;margin:6px 0 0"><div class="chn"><small>CHAPITRE ${d.ch + 1}${d.boss ? ' · BOSS' : ''} · ${lvLabel(i)}</small><b>${d.name}</b></div></div>
    <p style="text-align:center;margin:2px 0">${d.desc}</p>
    <div class="tip">${ic('help', 2)}<span>${d.hint}</span></div>
    <div class="kick">ARMÉE ENNEMIE · ${d.count} SOLDATS</div>
    <div class="eprev" id="ep"></div>
    <div class="kick">OBJECTIFS ${best ? '· MEILLEUR ' + '★'.repeat(best) : ''}</div>
    <div class="goals">
      <div><span>${starsHtml(1, 2)}</span><b>Victoire</b></div>
      <div><span>${starsHtml(2, 2)}</span><b>≤ ${d.s2}</b></div>
      <div><span>${starsHtml(3, 2)}</span><b>≤ ${d.s3}</b></div>
    </div>
    <p style="text-align:center;font-size:14px;color:var(--mut);margin:0">Budget de recrutement : <b style="color:var(--gold)">${d.budget}</b>. Les étoiles dépendent de ce que vous dépensez.</p>
    <div class="rew"><span class="pill">${ic('coin', 2)} ${goldFor(i, first)}</span><span class="pill">${ic('chest', 2)} ${first ? 3 + Math.floor(i / 3) : 2} cartes</span></div>
    <div class="mbtns"><button class="pb big brass" id="m-play" data-ic="swords">Déployer l’armée</button><button class="pb ghost" id="m-x">Retour</button></div></div>`, m => {
    m.querySelector('#lban').prepend(chapterBanner(d.ch));
    const ep = m.querySelector('#ep');
    Object.values(grp).forEach(g => {
      const dv = document.createElement('div'), lord = g.type === 'lord';
      dv.appendChild(portrait(lord ? 'guard' : g.type, g.lvl, 'red', lord ? 2 : 1));
      if (lord) dv.classList.add('lord');
      dv.insertAdjacentHTML('beforeend', `<span>${lord ? 'SEIGNEUR' : g.n + '×'} Nv${g.lvl}</span>`); ep.appendChild(dv);
    });
    m.querySelector('#m-play').onclick = () => { closeModal(); startStory(i); };
    m.querySelector('#m-x').onclick = closeModal;
  });
}
// l'armée déployée est mémorisée par niveau pour pouvoir la retoucher entre deux essais
function saveArmy(i){
  SAV.armies = SAV.armies || {};
  SAV.armies[i] = units.filter(u => u.team === 'blue').map(u => [TYPES.indexOf(u.type), Math.round(u.x), Math.round(u.y)]);
  save();
}
function restoreArmy(i){
  const a = SAV.armies && SAV.armies[i]; if (!a) return 0;
  let n = 0;
  for (const [ti, x, y] of a) {
    const t = TYPES[ti], c = SAV.cards[t]; if (!c || !c.u || B.spent + UT[t].cost > B.budget) continue;
    const u = makeUnit(t, c.lvl, 'blue', x, y); u.cost = UT[t].cost; u.drop = .1 + rnd() * .3; units.push(u); B.spent += u.cost; n++;
  }
  return n;
}
function startStory(i){
  closeModal();
  const def = levelDef(i);
  B = {mode:'story', def, phase:'deploy', budget:def.budget, spent:0, type:TYPES.find(t => SAV.cards[t].u), brush:6, erase:false, speed:1,
    ended:false, shown:false, theme:CHAPTERS[def.ch].theme, seed:i * 31 + 5, squads:[]};
  resetWorld(); go('battle');
  $('#b-title').textContent = `${lvLabel(i)} · ${def.name}`;
  spawnEnemies(def);
  const n = restoreArmy(i);
  buildPanel();
  toast(n ? 'Votre armée précédente est en place' : 'Peignez vos soldats dans la zone bleue');
}
function startFight(){
  if (!alive('blue')) { toast('Déployez au moins un soldat'); sfx('err'); return; }
  saveArmy(B.def.i);
  B.phase = 'fight'; B.startBlue = alive('blue'); B.ended = false; B.erase = false;
  for (const u of units) u.drop = 0;
  sfx('horn'); buildPanel();
  if (!SAV.tipCam) { SAV.tipCam = 1; save(); toast('À l’attaque ! Pincez pour zoomer'); } else toast('À l’attaque !');
}
function rollCards(n){
  const av = TYPES.filter(t => SAV.cards[t].u), got = {};
  for (let k = 0; k < n; k++) { const t = av[Math.floor(rnd() * av.length)]; got[t] = (got[t] || 0) + 1; SAV.cards[t].n += 1; }
  return got;
}
function lootHtml(got){ return `<div class="loot" id="loot">${Object.keys(got).map((t, i) => `<div data-t="${t}" style="animation-delay:${i * .12}s"><span>+${got[t]}</span></div>`).join('')}</div>`; }
function fillLoot(m){ m.querySelectorAll('#loot div').forEach(d => d.insertBefore(portrait(d.dataset.t, SAV.cards[d.dataset.t].lvl, 'blue', 2), d.firstChild)); }
function endStory(win){
  const d = B.def, i = d.i, spent = B.spent;
  const stars = win ? starsFor(d, spent) : 0, prev = SAV.stars[i] || 0;
  const first = win && SAV.cleared < i;
  const bonus = Math.max(0, stars - prev) * 15;
  const gold = win ? goldFor(i, first) + bonus : 10 + i * 2;
  SAV.gold += gold;
  const unlocked = [];
  if (first) { SAV.cleared = i; for (const t of TYPES) if (UT[t].unlock === i && !SAV.cards[t].u) { SAV.cards[t].u = true; unlocked.push(t); } }
  const got = win ? rollCards(first ? 3 + Math.floor(i / 3) : 2) : {};
  if (win) SAV.stars[i] = Math.max(prev, stars);
  save(); sfx(win ? 'win' : 'lose');
  const next = stars === 1 ? d.s2 : stars === 2 ? d.s3 : 0;
  openModal(`<div class="mc"><div id="bn"></div>
    ${win ? `<div class="stars3">${starsHtml(stars, 5)}</div>
      <p style="text-align:center;margin:0">Recrutement : <b style="color:var(--gold)">${spent}</b> / ${d.budget} pièces</p>
      ${next ? `<div class="tip">${ic('star', 2)}<span>Pour ${stars + 1} étoiles, gagnez en dépensant au plus <b>${next}</b>.</span></div>` : ''}`
    : `<div class="tip">${ic('help', 2)}<span>${d.hint}</span></div><p style="text-align:center;margin:0;color:var(--mut)">Retouchez votre armée, ou renforcez vos soldats dans l’onglet Armée.</p>`}
    <div class="rew"><span class="pill">${ic('coin', 2)} +${gold}</span>${bonus ? `<span class="pill">${ic('star', 2)} bonus +${bonus}</span>` : ''}</div>
    ${win ? lootHtml(got) : ''}
    ${unlocked.map(t => `<div class="pp nu"><b>NOUVEAU SOLDAT : ${UT[t].name.toUpperCase()}</b><div id="nu-${t}"></div><div style="font-size:15px;color:var(--mut)">${UT[t].ab} — ${UT[t].abd}</div></div>`).join('')}
    <div class="mbtns">
      ${win && i < NLEV ? `<button class="pb big brass" id="m-next" data-ic="play">Bataille suivante</button>` : ''}
      <button class="pb ${win ? '' : 'brass big'}" id="m-retry" data-ic="undo">${win ? 'Rejouer pour les étoiles' : 'Retoucher l’armée'}</button>
      <button class="pb ghost" id="m-cont" data-ic="flag">Carte de campagne</button>
    </div></div>`, m => {
    $('#mbox').dataset.lock = '1';
    m.querySelector('#bn').appendChild(pixelTextEl([win ? 'VICTOIRE!' : 'DEFAITE'], 4, win ? '#fff2a8' : '#ffb0b0', win ? '#f5c542' : '#d94040'));
    if (win) fillLoot(m);
    unlocked.forEach(t => m.querySelector('#nu-' + t).appendChild(portrait(t, 1, 'blue', 3)));
    const nx = m.querySelector('#m-next'); if (nx) nx.onclick = () => { closeModal(); levelModal(i + 1); };
    m.querySelector('#m-retry').onclick = () => startStory(i);
    m.querySelector('#m-cont').onclick = () => { closeModal(); go('story'); };
  });
}

/* ---------- BAC À SABLE ---------- */
function startSandbox(){
  closeModal();
  B = {mode:'sandbox', run:false, speed:1, type:'sword', lvl:1, team:'blue', erase:false, brush:1, snapshot:null, theme:'grass', seed:99, squads:[], ended:false};
  resetWorld(); go('battle');
  $('#b-title').textContent = 'Bac à sable'; buildPanel();
  toast('Touchez ou glissez sur le terrain');
}
let painting = false, lastPaint = null;
const freeSpot = (x, y, team) => !units.some(u => u.team === team && Math.abs(u.x - x) < 7 && Math.abs(u.y - y) < 6);
function paintAt(p){
  const story = B.mode === 'story', team = story ? 'blue' : B.team;
  if (B.erase) {
    let hit = false;
    for (const u of units) if ((!story || u.team === 'blue') && Math.hypot(u.x - p.x, u.y - 10 - p.y) < 13) { u.dead = true; hit = true; if (story) B.spent -= u.cost || 0; }
    if (hit) { units = units.filter(u => !u.dead); burst(p.x, p.y, ['#d8cfc0'], 5, 30, .3, 40, 10); if (story) updBudget(); }
    return;
  }
  const z = zone('blue');
  if (story && p.y + 10 < z.y0 - 24) { toast('Placez vos soldats dans la zone bleue'); sfx('err'); return; }
  if (units.length >= MAXU) { toast(`Maximum ${MAXU} soldats`); return; }
  // pinceau en formation : rangs serrés comme une vraie armée
  const n = B.brush, cols = n === 1 ? 1 : n === 6 ? 3 : 6, sp = gapOf(B.type);
  const lvl = story ? SAV.cards[B.type].lvl : B.lvl, cost = story ? UT[B.type].cost : 0;
  let placed = 0, broke = false;
  for (let k = 0; k < n && units.length < MAXU; k++) {
    const ox = ((k % cols) - (cols - 1) / 2) * sp, oy = (Math.floor(k / cols) - (Math.ceil(n / cols) - 1) / 2) * sp * .9;
    const x = clamp(p.x + ox + (rnd() - .5) * 2, 6, G.W - 6), y = story ? clamp(p.y + 10 + oy, z.y0 + 4, z.y1) : clamp(p.y + 10 + oy, 36, G.Hw - 2);
    if (!freeSpot(x, y, team)) continue;
    if (story && B.spent + cost > B.budget) { broke = true; break; }
    const u = makeUnit(B.type, lvl, team, x, y); u.cost = cost;
    u.drop = .15 + rnd() * .15; units.push(u); placed++; if (story) B.spent += cost;
  }
  if (placed) sfx('place');
  if (broke) { toast('Budget épuisé'); if (!placed) sfx('err'); }
  if (story) updBudget();
}
const BRUSHES = [1, 6, 24];
// bataille aléatoire : deux armées rangées (mêlée devant, tireurs derrière)
function sbRandom(){
  resetWorld(); B.squads = []; B.run = false; B.snapshot = null;
  const n = 6 + Math.floor(rnd() * 5);
  for (const team of ['blue', 'red']) {
    const z = zone(team), rows = {front:[], mid:[], back:[]};
    for (let k = 0; k < n; k++) {
      const t = TYPES[Math.floor(rnd() * TYPES.length)];
      rows[UT[t].proj ? 'back' : t === 'spear' ? 'mid' : 'front'].push(t);
    }
    const ys = team === 'blue' ? {front:z.y0 + 14, mid:z.y0 + 40, back:z.y0 + 66} : {front:z.y1 - 14, mid:z.y1 - 40, back:z.y1 - 66};
    for (const r in rows) rows[r].forEach((t, i, a) => {
      const x = Math.round(G.W * (i + 1) / (a.length + 1)), y = clamp(ys[r], z.y0 + 8, z.y1 - 8);
      spawnSquad(t, B.lvl, team, x + (rnd() - .5) * 6, y);
    });
  }
  sfx('horn'); buildPanel(); toast('Armées prêtes : lancez !');
}
function sbGo(){
  if (B.run) { B.run = false; buildPanel(); return; }
  if (!alive('blue') || !alive('red')) { toast('Placez des soldats dans les deux camps'); sfx('err'); return; }
  B.snapshot = units.map(u => ({type:u.type, lvl:u.lvl, team:u.team, x:u.x, y:u.y}));
  B.run = true; B.ended = false; B.shown = false; sfx('horn'); buildPanel();
}
function sbRestore(){
  if (!B.snapshot) { toast('Lancez d’abord une bataille'); return; }
  resetWorld(); B.squads = []; units = B.snapshot.map(s => makeUnit(s.type, s.lvl, s.team, s.x, s.y));
  B.run = false; B.ended = false; buildPanel();
}

/* ---------- PANNEAU & HUD ---------- */
const bp = $('#bpanel');
function updHud(){
  const sub = $('#b-sub');
  if (B.mode === 'story') sub.textContent = B.phase === 'deploy' ? 'Déployez votre armée' : 'Bataille en cours';
  else sub.textContent = B.run ? 'Bataille en cours' : 'Placez les deux armées';
}
function powerOf(team){ let s = 0; for (const u of units) if (u.team === team) s += u.hp / (1 - u.armor) * u.dmg / u.cdMax; return s; }
function powerBar(){
  const b = powerOf('blue'), r = powerOf('red'), pct = b + r ? b / (b + r) * 100 : 50;
  return `<div class="pw"><i style="width:${pct}%"></i><span><b>Vous ${Math.round(pct)}%</b><b>${Math.round(100 - pct)}% Ennemi</b></span></div>`;
}
// mise à jour en place pour que la barre glisse au lieu de sauter
function updatePower(){
  const w = document.getElementById('pwrap'); if (!w) return;
  const b = powerOf('blue'), r = powerOf('red'), pct = b + r ? b / (b + r) * 100 : 50, l = w.querySelectorAll('b');
  w.querySelector('i').style.width = pct + '%'; l[0].textContent = `Vous ${Math.round(pct)}%`; l[1].textContent = `${Math.round(100 - pct)}% Ennemi`;
}
// jauge de budget : ce qui est dépensé, avec les seuils des étoiles
function updBudget(){
  const d = B.def, v = $('#bud-v'), i = $('#bud-i'); if (!v) return;
  const left = B.budget - B.spent, st = starsFor(d, B.spent);
  v.textContent = left; i.style.width = B.spent / B.budget * 100 + '%';
  i.className = st === 3 ? 's3' : st === 2 ? 's2' : 's1';
  $('#bud-s').innerHTML = alive('blue') ? starsHtml(st, 2) : '';
  $('#cnt-b').lastChild.textContent = alive('blue');
}
// la rangée de soldats défile : on garde sa position quand le panneau est reconstruit
function buildPanel(){
  const o = bp.querySelector('.sbu'), sl = o ? o.scrollLeft : 0;
  buildPanel0();
  const n = bp.querySelector('.sbu'); if (n) n.scrollLeft = sl;
}
function buildPanel0(){
  bp.classList.toggle('compact', B.mode === 'story' && B.phase !== 'deploy');
  if (B.mode === 'story') {
    if (B.phase === 'deploy') {
      const d = B.def;
      bp.innerHTML = `<div class="budget"><span class="bv">${ic('coin', 2)}<b id="bud-v"></b></span>
          <div class="bbar"><i id="bud-i"></i><em style="left:${d.s3 / d.budget * 100}%"></em><em style="left:${d.s2 / d.budget * 100}%"></em></div><span id="bud-s" class="bst"></span></div>
        <div class="sbu">${TYPES.filter(t => SAV.cards[t].u).map(t => `<button data-t="${t}" class="pb ${B.type === t && !B.erase ? 'on' : ''}" aria-label="${UT[t].name}">
          <span class="cost">${ic('coin', 1)}${UT[t].cost}</span></button>`).join('')}</div>
        <div class="sbr">
          <button class="pb sm" id="sb-br">${ic('person', 2)}×${B.brush}</button>
          <button class="pb sm ${B.erase ? 'on' : ''}" id="sb-er" aria-label="Gomme">${ic('erase', 2)}</button>
          <button class="pb sm" id="sb-cl" aria-label="Tout retirer">${ic('trash', 2)}</button>
          <button class="pb green fightb" id="b-fight">${ic('swords', 2)}Combattre</button>
        </div>`;
      bp.querySelectorAll('.sbu button').forEach(b => {
        const t = b.dataset.t, c = SAV.cards[t];
        b.prepend(portrait(t, c.lvl, 'blue', 2));
        if (c.u) b.style.setProperty('--tier', `var(--t${c.lvl})`);
        b.onclick = () => { if (!c.u) return; B.type = t; B.erase = false; sfx('click'); buildPanel(); toast(`${UT[t].name} Nv${c.lvl} · ${UT[t].cost} pièces par soldat`); };
      });
      bp.querySelector('#sb-br').onclick = () => { B.brush = BRUSHES[(BRUSHES.indexOf(B.brush) + 1) % BRUSHES.length]; B.erase = false; sfx('click'); buildPanel(); };
      bp.querySelector('#sb-er').onclick = () => { B.erase = !B.erase; sfx('click'); buildPanel(); };
      bp.querySelector('#sb-cl').onclick = () => { units = units.filter(u => u.team !== 'blue'); B.spent = 0; sfx('click'); updBudget(); };
      bp.querySelector('#b-fight').onclick = startFight;
      decorate(bp); updHud(); updBudget(); return;
    } else {
      bp.innerHTML = `<div class="frow"><div id="pwrap">${powerBar()}</div>
        <button class="pb" id="b-spd" aria-label="Vitesse">${ic('ffwd', 2)}x${B.speed}</button></div>`;
      bp.querySelector('#b-spd').onclick = () => { B.speed = B.speed >= 3 ? 1 : B.speed + 1; sfx('click'); buildPanel(); };
    }
  } else {
    bp.innerHTML = `<div class="sbu">${TYPES.map(t => `<button data-t="${t}" class="pb ${B.type === t && !B.erase ? 'on' : ''}" aria-label="${UT[t].name}"></button>`).join('')}</div>
      <div class="sbr">
        <div class="seg">${[1,2,3,4,5].map(l => `<button class="pb ${B.lvl === l ? 'on' : ''}" data-l="${l}">${l}</button>`).join('')}</div>
        <div style="flex:1"></div>
        <div class="seg"><button class="pb ${B.team === 'blue' ? 'blue' : ''}" data-tm="blue">Bleu</button><button class="pb ${B.team === 'red' ? 'red' : ''}" data-tm="red">Rouge</button></div>
      </div>
      <div class="sbr">
        <button class="pb sm" id="sb-br">${ic('person', 2)}×${B.brush}</button>
        <button class="pb sm" id="sb-rd" aria-label="Bataille aléatoire">${ic('dice', 2)}</button>
        <button class="pb sm ${B.erase ? 'on' : ''}" id="sb-er">${ic('erase', 2)}</button>
        <button class="pb sm" id="sb-cl">${ic('trash', 2)}</button>
        <button class="pb sm" id="sb-rs">${ic('undo', 2)}</button>
        <button class="pb sm" id="sb-sp">${ic('ffwd', 2)}${B.speed}</button>
        <button class="pb sm ${B.run ? 'red' : 'green'}" id="sb-go">${ic(B.run ? 'pause' : 'play', 2)}</button>
      </div>`;
    bp.querySelectorAll('.sbu button').forEach(b => {
      b.appendChild(portrait(b.dataset.t, B.lvl, B.team, 2));
      b.onclick = () => { B.type = b.dataset.t; B.erase = false; sfx('click'); buildPanel(); };
    });
    bp.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { B.lvl = +b.dataset.l; sfx('click'); buildPanel(); });
    bp.querySelectorAll('[data-tm]').forEach(b => b.onclick = () => { B.team = b.dataset.tm; sfx('click'); buildPanel(); });
    bp.querySelector('#sb-br').onclick = () => { B.brush = BRUSHES[(BRUSHES.indexOf(B.brush) + 1) % BRUSHES.length]; B.erase = false; sfx('click'); buildPanel(); };
    bp.querySelector('#sb-rd').onclick = sbRandom;
    bp.querySelector('#sb-er').onclick = () => { B.erase = !B.erase; buildPanel(); };
    bp.querySelector('#sb-cl').onclick = () => { resetWorld(); B.squads = []; B.run = false; B.snapshot = null; buildPanel(); };
    bp.querySelector('#sb-rs').onclick = sbRestore;
    bp.querySelector('#sb-sp').onclick = () => { B.speed = B.speed >= 3 ? 1 : B.speed + 1; buildPanel(); };
    bp.querySelector('#sb-go').onclick = sbGo;
  }
  decorate(bp); updHud();
}
let toastT = null;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 1600); }
$('#b-quit').onclick = () => {
  if (B.mode === 'sandbox') { B = null; go('menu'); return; }
  if (B.phase === 'end' || B.phase === 'deploy') { B = null; go('story'); return; }
  confirmBox('Abandonner ?', 'La bataille sera perdue, sans récompense.', 'Abandonner', () => { B = null; go('story'); });
};

/* ---------- ENTRÉES ---------- */
function toArt(e){ const r = cv.getBoundingClientRect(), c = G.cam; return {x:c.x + (e.clientX - r.left) / G.k / c.z, y:c.y + (e.clientY - r.top) / G.k / c.z, inside:e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom}; }
// un doigt : placer / peindre (ou déplacer la caméra pendant le combat) ; deux doigts : zoom + déplacement
const ptrs = new Map(); let pinch = null, panning = null, lastTap = 0;
function zoomAround(clientX, clientY, z){
  const r = cv.getBoundingClientRect(), c = G.cam, ax = c.x + (clientX - r.left) / G.k / c.z, ay = c.y + (clientY - r.top) / G.k / c.z;
  c.z = clamp(z, 1, 3); c.x = ax - (clientX - r.left) / G.k / c.z; c.y = ay - (clientY - r.top) / G.k / c.z; camClamp();
}
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); if (!B) return;
  ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
  try { cv.setPointerCapture(e.pointerId); } catch(_) {}
  if (ptrs.size >= 2) {
    painting = false; panning = null; G.camT = null;
    const [a, b] = [...ptrs.values()], r = cv.getBoundingClientRect(), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    pinch = {d:Math.hypot(a.x - b.x, a.y - b.y) || 1, z:G.cam.z, ax:G.cam.x + (mx - r.left) / G.k / G.cam.z, ay:G.cam.y + (my - r.top) / G.k / G.cam.z};
    return;
  }
  const p = toArt(e);
  const placing = B.mode === 'sandbox' || B.phase === 'deploy';
  if (!placing) {
    const now = performance.now(); if (now - lastTap < 300) camReset(); lastTap = now;
    panning = {x:e.clientX, y:e.clientY, cx:G.cam.x, cy:G.cam.y}; G.camT = null; return;
  }
  painting = true; lastPaint = p; paintAt(p);
});
cv.addEventListener('pointermove', e => {
  if (!B || !ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (pinch && ptrs.size >= 2) {
    const [a, b] = [...ptrs.values()], r = cv.getBoundingClientRect(), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, c = G.cam;
    c.z = clamp(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, 1, 3);
    c.x = pinch.ax - (mx - r.left) / G.k / c.z; c.y = pinch.ay - (my - r.top) / G.k / c.z; camClamp();
    return;
  }
  if (panning) {
    const c = G.cam; c.x = panning.cx - (e.clientX - panning.x) / G.k / c.z; c.y = panning.cy - (e.clientY - panning.y) / G.k / c.z; camClamp();
    return;
  }
  if (!painting) return;
  const p = toArt(e);
  const gap = B.erase ? 6 : B.brush > 6 ? 56 : B.brush > 1 ? 30 : 12;
  if (Math.hypot(p.x - lastPaint.x, p.y - lastPaint.y) >= gap) { lastPaint = p; paintAt(p); }
});
const endPaint = e => {
  ptrs.delete(e.pointerId);
  if (pinch) { if (ptrs.size < 2) pinch = null; painting = false; return; }
  panning = null;
  painting = false;
};
cv.addEventListener('pointerup', endPaint);
cv.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); pinch = null; panning = null; painting = false; });
cv.addEventListener('wheel', e => { e.preventDefault(); G.camT = null; zoomAround(e.clientX, e.clientY, G.cam.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, {passive:false});
document.addEventListener('gesturestart', e => e.preventDefault());

/* ---------- BOUCLE ---------- */
let lastT = 0, hudAcc = 0;
function loop(ts){
  requestAnimationFrame(loop);
  const t = ts / 1000, rdt = Math.min(.05, (ts - lastT) / 1000 || 0); lastT = ts;
  // ralenti cinématique sur le dernier coup
  if (G.slowT > 0) G.slowT = Math.max(0, G.slowT - rdt);
  const dt = rdt * (G.slowT > 0 ? .28 : 1);
  if (cur === 'battle' && B) {
    const fighting = (B.mode === 'story' && B.phase === 'fight') || (B.mode === 'sandbox' && B.run);
    const steps = fighting && !(G.slowT > 0) ? B.speed : 1;
    for (let s = 0; s < steps; s++) { stepFx(dt); if (fighting) sim(dt); }
    if (fighting || (B.ended && !B.shown)) checkEnd(rdt);
    camStep(rdt);
    render(t);
    hudAcc += rdt;
    if (hudAcc > .2) {
      hudAcc = 0;
      $('#cnt-b').lastChild.textContent = alive('blue'); $('#cnt-r').lastChild.textContent = alive('red');
      updatePower();
    }
  } else if (cur === 'menu') drawScene(rdt, t);
}
function checkEnd(rdt){
  const b = alive('blue'), r = alive('red');
  if (!B.ended && (b === 0 || r === 0)) {
    B.ended = true; B.endT = 2.2; G.slowT = 1.6;
    if (G.lastKill) G.camT = {x:G.lastKill.x, y:G.lastKill.y - 10, z:2.2};
  }
  if (B.ended && !B.shown) {
    B.endT -= rdt;
    if (B.endT <= 0) {
      B.shown = true;
      if (B.mode === 'story') { B.phase = 'end'; endStory(r === 0 && b > 0); }
      else { B.run = false; G.camT = {x:G.W / 2, y:G.Hw / 2, z:1}; toast(b && !r ? 'Victoire des Bleus !' : r && !b ? 'Victoire des Rouges !' : 'Égalité !'); sfx('win'); buildPanel(); }
    }
  }
}
