/* Légion Pixel — Modes de jeu : campagne, bac à sable, panneau, contrôles tactiles et boucle */
'use strict';
/* ---------- CAMPAGNE ---------- */
function levelDef(i){
  const rng = mulberry32(i * 7919 + 13), boss = i % 5 === 0;
  const avail = TYPES.filter(t => UT[t].unlock < i);
  const n = Math.min(8, 3 + Math.floor((i - 1) / 3)) + (boss ? 1 : 0);
  const base = Math.min(5, 1 + Math.floor((i - 1) / 4));
  const squads = [], newest = avail[avail.length - 1];
  for (let k = 0; k < n; k++) {
    let type = avail[Math.floor(rng() * avail.length)];
    if (k === 1 && avail.length > 2) type = newest;
    let lvl = base; const rr = rng();
    if (boss && rr < .4) lvl = Math.min(5, base + 1); else if (rr < .22 && base > 1) lvl = base - 1;
    // position libre : profondeur selon le rôle (0 = front, 1 = fond)
    const T = UT[type], dRange = T.proj ? [.55, 1] : type === 'spear' ? [.1, .5] : [0, .35];
    let nx = 0, d = 0;
    for (let tries = 0; tries < 30; tries++) {
      nx = .08 + rng() * .84; d = dRange[0] + rng() * (dRange[1] - dRange[0]);
      if (!squads.some(s => Math.abs(s.nx - nx) < .18 && Math.abs(s.d - d) < .3)) break;
    }
    squads.push({type, lvl, nx, d});
  }
  return {i, boss, ch:Math.floor((i - 1) / 5), n:squads.length, squads, base};
}
function enemyPos(s){
  const z = zone('red');
  return clampSquad(s.type, 'red', Math.round(22 + s.nx * (G.W - 44)), Math.round(z.y1 - 8 - s.d * (z.y1 - z.y0 - 16)));
}
// bannière de chapitre : le terrain du chapitre et quelques ennemis typiques
const banCache = {};
function chapterBanner(ci){
  if (banCache[ci]) return cloneCanvas(banCache[ci]);
  const W = 120, H = 34, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.drawImage(genGround(CHAPTERS[ci].theme, W, H, ci * 13 + 4), 0, 0);
  const boss = levelDef(ci * 5 + 5).squads;
  [0, 1, 2].forEach(k => {
    const s = boss[k % boss.length];
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
function levelModal(i){
  const d = levelDef(i), grp = {};
  d.squads.forEach(s => { const k = s.type + s.lvl; grp[k] = grp[k] || {type:s.type, lvl:s.lvl, n:0}; grp[k].n++; });
  const first = SAV.cleared < i;
  openModal(`<div class="mc"><div class="chban" id="lban" style="width:100%;margin:6px 0 0"><div class="chn"><small>CHAPITRE ${d.ch + 1}${d.boss ? ' · BOSS' : ''}</small><b>${d.boss ? 'Boss ' : 'Niveau '}${lvLabel(i)}</b></div></div>
    <p style="text-align:center">Les éclaireurs repèrent <b>${d.n} escouades</b> ennemies. Vous en recruterez autant, une par manche.</p>
    <div class="eprev" id="ep"></div>
    <div class="kick">${first ? 'RÉCOMPENSES · PREMIÈRE VICTOIRE' : 'RÉCOMPENSES'}</div>
    <div class="rew"><span class="pill">${ic('coin', 2)} ${first ? 40 + i * 12 : Math.round((40 + i * 12) / 2)}</span><span class="pill">${ic('chest', 2)} ${first ? 3 + Math.floor(i / 3) : 2} cartes</span></div>
    <div class="mbtns"><button class="pb big brass" id="m-play" data-ic="swords">Combattre</button><button class="pb ghost" id="m-x">Retour</button></div></div>`, m => {
    m.querySelector('#lban').prepend(chapterBanner(d.ch));
    const ep = m.querySelector('#ep');
    Object.values(grp).forEach(g => { const dv = document.createElement('div'); dv.appendChild(portrait(g.type, g.lvl, 'red', 1)); dv.insertAdjacentHTML('beforeend', `<span>${g.n}× Nv${g.lvl}</span>`); ep.appendChild(dv); });
    m.querySelector('#m-play').onclick = () => { closeModal(); startStory(i); };
    m.querySelector('#m-x').onclick = closeModal;
  });
}
function startStory(i){
  closeModal();
  const def = levelDef(i);
  B = {mode:'story', def, round:0, rounds:def.n, phase:'draft', offers:[], sel:null, rerolls:1, speed:1, ended:false, shown:false,
    theme:CHAPTERS[def.ch].theme, seed:i * 31 + 5, squads:[], msg:'', ghost:null};
  resetWorld(); go('battle');
  $('#b-title').textContent = `${def.boss ? 'Boss ' : 'Niveau '}${lvLabel(i)}`;
  nextRound();
}
function makeOffers(){
  const av = TYPES.filter(t => SAV.cards[t].u), pool = av.slice(), out = [];
  for (let k = 0; k < 3; k++) { if (!pool.length) pool.push(...av); const t = pool.splice(Math.floor(rnd() * pool.length), 1)[0]; out.push({type:t, lvl:SAV.cards[t].lvl}); }
  return out;
}
function nextRound(){
  if (B.round >= B.rounds) { B.phase = 'ready'; B.sel = null; B.ghost = null; buildPanel(); return; }
  const s = B.def.squads[B.round], [x, y] = enemyPos(s);
  spawnSquad(s.type, s.lvl, 'red', x, y);
  B.msg = `L’ennemi déploie : <b>${UT[s.type].name} Nv${s.lvl}</b>. À vous !`;
  B.offers = makeOffers(); B.sel = null; B.ghost = null; buildPanel();
}
function ghostAt(p){
  const o = B.offers[B.sel]; if (!o) return null;
  const [x, y] = clampSquad(o.type, 'blue', p.x, p.y);
  return {x, y, ok:squadFree(o.type, 'blue', x, y)};
}
function placeAt(p){
  if (B.sel == null) { toast('Choisissez d’abord une carte'); sfx('err'); return; }
  const g = ghostAt(p);
  if (!g.ok) { toast('Trop près d’une autre escouade'); sfx('err'); return; }
  const o = B.offers[B.sel];
  spawnSquad(o.type, o.lvl, 'blue', g.x, g.y); sfx('place');
  B.round++; nextRound();
}
function startFight(){
  B.phase = 'fight'; B.startBlue = alive('blue'); B.ended = false; B.ghost = null;
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
  const i = B.def.i, ratio = alive('blue') / Math.max(1, B.startBlue);
  const stars = win ? (ratio >= .6 ? 3 : ratio >= .3 ? 2 : 1) : 0;
  const first = win && SAV.cleared < i;
  const gold = win ? (first ? 40 + i * 12 : Math.round((40 + i * 12) / 2)) : 10 + i * 2;
  SAV.gold += gold;
  const unlocked = [];
  if (first) { SAV.cleared = i; for (const t of TYPES) if (UT[t].unlock === i && !SAV.cards[t].u) { SAV.cards[t].u = true; unlocked.push(t); } }
  const got = win ? rollCards(first ? 3 + Math.floor(i / 3) : 2) : {};
  if (win) SAV.stars[i] = Math.max(SAV.stars[i] || 0, stars);
  save(); sfx(win ? 'win' : 'lose');
  openModal(`<div class="mc"><div id="bn"></div>
    ${win ? `<div class="stars3">${starsHtml(stars, 5)}</div>` : `<p style="text-align:center">Améliorez vos soldats dans l’Armée, ou contrez mieux les escouades ennemies.</p>`}
    <div class="rew"><span class="pill">${ic('coin', 2)} +${gold}</span></div>
    ${win ? lootHtml(got) : ''}
    ${unlocked.map(t => `<div class="pp nu"><b>NOUVEAU SOLDAT : ${UT[t].name.toUpperCase()}</b><div id="nu-${t}"></div><div style="font-size:15px;color:var(--mut)">${UT[t].ab} — ${UT[t].abd}</div></div>`).join('')}
    <div class="mbtns">
      ${win && i < NLEV ? `<button class="pb big brass" id="m-next" data-ic="play">Niveau suivant</button>` : ''}
      <button class="pb ${win ? '' : 'brass big'}" id="m-retry" data-ic="undo">Rejouer</button>
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
function paintAt(p){
  if (B.erase) {
    let hit = false;
    for (const u of units) if (Math.hypot(u.x - p.x, u.y - 10 - p.y) < 13) { u.dead = true; hit = true; }
    if (hit) { units = units.filter(u => !u.dead); burst(p.x, p.y, ['#d8cfc0'], 5, 30, .3, 40, 10); }
    return;
  }
  if (units.length >= MAXU) { toast(`Maximum ${MAXU} soldats`); return; }
  // pinceau en formation : rangs serrés comme une vraie armée
  const n = B.brush, cols = n === 1 ? 1 : n === 6 ? 3 : 6, sp = B.type === 'guard' ? 20 : 11;
  for (let k = 0; k < n && units.length < MAXU; k++) {
    const ox = ((k % cols) - (cols - 1) / 2) * sp, oy = (Math.floor(k / cols) - (Math.ceil(n / cols) - 1) / 2) * sp * .9;
    const u = makeUnit(B.type, B.lvl, B.team, clamp(p.x + ox + (rnd() - .5) * 2, 6, G.W - 6), clamp(p.y + 10 + oy, 36, G.Hw - 2));
    u.drop = .15 + rnd() * .15; units.push(u);
  }
  sfx('place');
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
  if (B.mode === 'story') sub.textContent = B.phase === 'draft' ? `Manche ${B.round + 1} sur ${B.rounds}` : B.phase === 'ready' ? 'Armées prêtes' : 'Bataille en cours';
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
let dragCard = null;
function buildPanel(){
  bp.classList.toggle('compact', B.mode === 'story' && B.phase !== 'draft' && B.phase !== 'ready');
  if (B.mode === 'story') {
    if (B.phase === 'draft') {
      const o = B.sel != null ? B.offers[B.sel] : null;
      bp.innerHTML = `<div class="phead"><div class="phint">${o ? `<b>${UT[o.type].ab}</b> : ${UT[o.type].abd}` : B.msg}</div>
        <button class="pb sm" id="b-rr" ${B.rerolls ? '' : 'disabled'} style="width:64px;flex:none">${ic('dice', 2)}${B.rerolls}</button></div>
        <div class="cards">${B.offers.map((o, k) => `<div class="dcard pp ${B.sel === k ? 'sel' : ''}" data-k="${k}" style="--tier:var(--t${o.lvl})"><div class="pc"></div>
        <div class="dn">${UT[o.type].name}</div><div class="dl">${[1,2,3,4,5].map(l => `<i class="${l <= o.lvl ? 'on' : ''}"></i>`).join('')}</div>
        <div class="dr">${ic(UT[o.type].ic, 2)} ×${UT[o.type].squad}</div></div>`).join('')}</div>`;
      bp.querySelectorAll('.dcard').forEach(d => {
        const k = +d.dataset.k, o = B.offers[k];
        d.querySelector('.pc').appendChild(portrait(o.type, o.lvl, 'blue', 2));
        d.addEventListener('pointerdown', e => { dragCard = {k, x:e.clientX, y:e.clientY, moved:false, id:e.pointerId}; try { d.releasePointerCapture(e.pointerId); } catch(_) {} });
      });
      bp.querySelector('#b-rr').onclick = () => { if (!B.rerolls) return; B.rerolls--; B.offers = makeOffers(); B.sel = null; sfx('coin'); buildPanel(); };
    } else if (B.phase === 'ready') {
      bp.innerHTML = `<div class="pbig"><div class="phint" style="text-align:center">Toutes les escouades sont en place. Rapport de force estimé :</div>${powerBar()}
        <button class="pb big brass" id="b-fight" data-ic="swords">Lancer la bataille</button></div>`;
      bp.querySelector('#b-fight').onclick = startFight;
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
  if (B.phase === 'end') { go('story'); return; }
  confirmBox('Abandonner ?', 'La bataille sera perdue, sans récompense.', 'Abandonner', () => { B = null; go('story'); });
};

/* ---------- ENTRÉES ---------- */
function toArt(e){ const r = cv.getBoundingClientRect(), c = G.cam; return {x:c.x + (e.clientX - r.left) / G.k / c.z, y:c.y + (e.clientY - r.top) / G.k / c.z, inside:e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom}; }
// glisser une carte vers le terrain
document.addEventListener('pointermove', e => {
  if (!dragCard || !B || B.phase !== 'draft') return;
  if (!dragCard.moved && Math.hypot(e.clientX - dragCard.x, e.clientY - dragCard.y) > 12) {
    dragCard.moved = true; B.sel = dragCard.k;
    bp.querySelectorAll('.dcard').forEach(d => d.classList.toggle('sel', +d.dataset.k === B.sel));
    const o = B.offers[B.sel]; bp.querySelector('.phint').innerHTML = `<b>${UT[o.type].ab}</b> : ${UT[o.type].abd}`;
  }
  if (dragCard.moved) { const p = toArt(e); B.ghost = p.inside ? ghostAt({x:p.x, y:p.y - 14}) : null; }
});
document.addEventListener('pointerup', e => {
  if (!dragCard || !B) { dragCard = null; return; }
  const d = dragCard; dragCard = null;
  if (B.phase !== 'draft') return;
  if (d.moved) { const p = toArt(e); B.ghost = null; if (p.inside) placeAt({x:p.x, y:p.y - 14}); }
  else { sfx('click'); B.sel = B.sel === d.k ? null : d.k; buildPanel(); }
});
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
    painting = false; panning = null; B.ghost = null; G.camT = null;
    const [a, b] = [...ptrs.values()], r = cv.getBoundingClientRect(), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    pinch = {d:Math.hypot(a.x - b.x, a.y - b.y) || 1, z:G.cam.z, ax:G.cam.x + (mx - r.left) / G.k / G.cam.z, ay:G.cam.y + (my - r.top) / G.k / G.cam.z};
    return;
  }
  const p = toArt(e);
  const placing = B.mode === 'sandbox' || (B.phase === 'draft' && (B.sel != null || G.cam.z === 1));
  if (!placing) {
    const now = performance.now(); if (now - lastTap < 300) camReset(); lastTap = now;
    panning = {x:e.clientX, y:e.clientY, cx:G.cam.x, cy:G.cam.y}; G.camT = null; return;
  }
  if (B.mode === 'story') {
    if (B.sel == null) { toast('Choisissez d’abord une carte'); sfx('err'); return; }
    painting = true; B.ghost = ghostAt(p);
    return;
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
  if (B.mode === 'story') { if (B.phase === 'draft' && B.sel != null) B.ghost = ghostAt(p); return; }
  const gap = B.erase ? 6 : B.brush > 6 ? 56 : B.brush > 1 ? 30 : 12;
  if (Math.hypot(p.x - lastPaint.x, p.y - lastPaint.y) >= gap) { lastPaint = p; paintAt(p); }
});
const endPaint = e => {
  ptrs.delete(e.pointerId);
  if (pinch) { if (ptrs.size < 2) pinch = null; painting = false; return; }
  panning = null;
  if (painting && B && B.mode === 'story' && B.phase === 'draft' && B.ghost) { B.ghost = null; placeAt(toArt(e)); }
  painting = false;
};
cv.addEventListener('pointerup', endPaint);
cv.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); pinch = null; panning = null; painting = false; if (B) B.ghost = null; });
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
