/* Légion Pixel — Méta-jeu : armée, coffres, aide, réglages et démarrage */
'use strict';
/* ---------- ARMÉE ---------- */
function buildArmy(){
  const el = $('#army-grid'); el.innerHTML = '';
  for (const t of TYPES) {
    const c = SAV.cards[t], need = UP_N[c.lvl], max = c.lvl >= 5;
    const canUp = c.u && !max && c.n >= need && SAV.gold >= UP_G[c.lvl];
    const b = document.createElement('button'); b.className = 'ucard pp' + (c.u ? '' : ' locked');
    b.appendChild(portrait(t, c.lvl, 'blue', 3));
    b.insertAdjacentHTML('beforeend', `<div class="un">${UT[t].name}</div>
      <div class="ul">${c.u ? `Nv ${c.lvl} · ${LVL_NAMES[c.lvl]}` : `Niveau ${lvLabel(UT[t].unlock)} requis`}</div>
      ${c.u ? `<div class="bar ${max ? 'full' : ''}"><i style="width:${max ? 100 : Math.min(100, c.n / need * 100)}%"></i><span>${max ? 'MAX' : `${c.n}/${need}`}</span></div>` : ''}
      ${canUp ? `<div class="badge">${ic('up', 3)}</div>` : !c.u ? `<div class="badge">${ic('lock', 3)}</div>` : ''}`);
    b.onclick = () => { sfx('click'); openUnit(t); };
    el.appendChild(b);
  }
}
function statBar(icName, label, val, frac, nfrac, valTxt){
  const pips = [...Array(10)].map((_, k) => `<i class="${k < Math.round(frac * 10) ? 'on' : k < Math.round(nfrac * 10) ? 'nx' : ''}"></i>`).join('');
  return `<div class="sbar">${ic(icName, 2)}<span class="lbl">${label}</span><span class="pips">${pips}</span><span class="v">${valTxt}</span></div>`;
}
function openUnit(t){
  const c = SAV.cards[t], U = UT[t], L = c.lvl, max = L >= 5;
  if (!c.u) {
    openModal(`<div class="mc"><h3>${U.name}</h3><div id="pp"></div><p style="text-align:center">${U.desc}</p>
      <p style="text-align:center"><b>Terminez le niveau ${lvLabel(U.unlock)} de la campagne pour le recruter.</b></p>
      <div class="mbtns"><button class="pb" id="m-x">Fermer</button></div></div>`, m => {
      const p = portrait(t, 1, 'blue', 4); p.style.filter = 'brightness(0) opacity(.5)'; m.querySelector('#pp').appendChild(p);
      m.querySelector('#m-x').onclick = closeModal;
    });
    return;
  }
  const hp = l => Math.round(U.hp * HPM(l)), dm = l => Math.round(U.dmg * DMGM(l));
  const need = UP_N[L], cost = UP_G[L], ok = !max && c.n >= need && SAV.gold >= cost;
  const nl = max ? L : L + 1;
  openModal(`<div class="mc"><h3>${U.name}</h3>
    <div class="evo" id="evo"></div>
    <p style="text-align:center;margin:2px 0">${U.desc}</p>
    <div class="ability"><b>${U.ab}</b>${U.abd}</div>
    ${statBar('heart', 'Vie', hp(L), hp(L) / 1500, hp(nl) / 1500, max ? hp(L) : `${hp(L)}>${hp(nl)}`)}
    ${statBar('atk', 'Attaque', dm(L), dm(L) * (U.aoe ? 1.6 : 1) / U.cd / 60, dm(nl) * (U.aoe ? 1.6 : 1) / U.cd / 60, max ? dm(L) : `${dm(L)}>${dm(nl)}`)}
    ${statBar('range', 'Portée', U.range, U.range / 140, U.range / 140, U.range > 40 ? 'Loin' : U.range > 15 ? 'Lance' : 'Contact')}
    ${statBar('speed', 'Vitesse', U.spd, U.spd / 45, U.spd / 45, U.spd)}
    ${statBar('shield', 'Armure', U.armor, U.armor / .55, U.armor / .55, Math.round(U.armor * 100) + '%')}
    <div class="vs"><div class="good"><b>Fort contre</b><br>${U.good}</div><div class="bad"><b>Faible contre</b><br>${U.bad}</div></div>
    ${max ? '<p><b>Niveau maximum atteint</b></p>' : `<div class="bar"><i style="width:${Math.min(100, c.n / need * 100)}%"></i><span>${c.n} / ${need} cartes</span></div>`}
    <div class="mbtns">
      ${max ? '' : `<button class="pb big ${ok ? 'green' : ''}" id="m-up" ${ok ? '' : 'disabled'}>${ic('up', 3)}Nv${L + 1} ${ic('coin', 2)}${cost}</button>`}
      <button class="pb" id="m-x">Fermer</button></div></div>`, m => {
    const evo = m.querySelector('#evo');
    for (let l = 1; l <= 5; l++) {
      const d = document.createElement('div'); d.className = l === L ? 'cur' : l > L ? 'fut' : '';
      d.appendChild(portrait(t, l, 'blue', 2)); d.insertAdjacentHTML('beforeend', `Nv${l}`); evo.appendChild(d);
    }
    const up = m.querySelector('#m-up');
    if (up) up.onclick = () => { if (!ok) return; c.n -= need; SAV.gold -= cost; c.lvl++; save(); sfx('up'); refreshGold(); buildArmy(); openUnit(t); };
    m.querySelector('#m-x').onclick = closeModal;
  });
}

/* ---------- COFFRES ---------- */
const FREE_CD = 4 * 3600 * 1000;
function buildShop(){
  const el = $('#shop-list'), left = SAV.lastFree + FREE_CD - Date.now();
  const items = [
    {id:'free', name:'Bourse du camp', desc:'3 cartes et 40 pièces, toutes les 4 heures.', cost:0, n:3, rare:false},
    {id:'wood', name:'Coffre de bois', desc:'5 cartes de vos soldats débloqués.', cost:150, n:5, rare:false},
    {id:'royal', name:'Coffre royal', desc:'16 cartes : le meilleur rapport.', cost:420, n:16, rare:true}];
  el.innerHTML = items.map(it => {
    const dis = it.id === 'free' ? left > 0 : SAV.gold < it.cost;
    const lbl = it.id === 'free' ? (left > 0 ? `${Math.floor(left / 3600000)}h${String(Math.ceil(left % 3600000 / 60000)).padStart(2, '0')}` : 'Gratuit') : `${ic('coin', 2)}${it.cost}`;
    return `<div class="chest pp"><div class="cimg"></div><div class="ci"><div class="ct">${it.name}</div><div class="cd">${it.desc}</div>
      <button class="pb sm ${dis ? '' : 'brass'}" ${dis ? 'disabled' : ''}>${lbl}</button></div></div>`;
  }).join('');
  el.querySelectorAll('.chest').forEach((d, k) => {
    const it = items[k];
    const g = it.rare ? CHEST.map(r => r.replace(/b/g, 'g').replace(/B/g, 'G')) : CHEST;
    const pal = it.rare ? Object.assign({}, BASE_PAL, {g:'#7a4fc0', G:'#3e2470'}) : BASE_PAL;
    const cs = paintGrid(g, pal, false, 5 * DPR); cs.style.width = '80px'; cs.style.height = '50px';
    d.querySelector('.cimg').appendChild(cs);
    d.querySelector('button').onclick = () => {
      if (it.id === 'free') { if (SAV.lastFree + FREE_CD > Date.now()) return; SAV.lastFree = Date.now(); SAV.gold += 40; }
      else { if (SAV.gold < it.cost) return; SAV.gold -= it.cost; }
      const got = rollCards(it.n); save(); sfx('coin'); refreshGold(); buildShop();
      openModal(`<div class="mc"><h3>${it.name}</h3>${lootHtml(got)}
        <div class="mbtns"><button class="pb brass" id="m-x">Super !</button></div></div>`, m => { fillLoot(m); m.querySelector('#m-x').onclick = closeModal; });
    };
  });
}

/* ---------- AIDE & RÉGLAGES ---------- */
$('#b-help').onclick = () => openModal(`<div class="help"><h3>Comment jouer</h3>
  <h4>Le draft</h4><p>À chaque manche, l’ennemi déploie une escouade en haut. Choisissez une carte parmi trois, puis faites-la glisser où vous voulez dans votre zone bleue (ou touchez la carte, puis le terrain). Le dé relance les cartes une fois par bataille.</p>
  <h4>La bataille</h4><p>Les soldats combattent seuls. Plus il vous reste de survivants, plus vous gagnez d’étoiles.</p>
  <h4>Caméra</h4><p>Pincez le terrain pour zoomer, glissez pour vous déplacer, touchez deux fois pour revoir tout le champ de bataille.</p>
  <h4>Cinq soldats, cinq styles</h4><p>L’Épéiste charge les lignes arrière. L’Archère tire en cloche et recule. Le Lancier transperce les armures et brise les charges. Le Gardien attire les coups et bloque les flèches. Le Sapeur fait exploser les groupes serrés.</p>
  <h4>Progression</h4><p>Les victoires rapportent pièces et cartes. Dans Armée, montez chaque soldat jusqu’au niveau 5 : cuir, fer, acier, or, puis mythique.</p>
  <h4>Bac à sable</h4><p>Placez jusqu’à ${MAXU} soldats des deux camps à tous les niveaux, puis lancez la bataille. Le pinceau pose 1, 6 ou 24 soldats en formation, le dé génère deux armées au hasard, et le bouton retour rejoue la même bataille.</p>
  <div class="mbtns"><button class="pb brass" id="m-x">Compris</button></div></div>`, m => m.querySelector('#m-x').onclick = closeModal);
$('#b-set').onclick = function openSet(){
  openModal(`<h3>Réglages</h3>
    <div class="toggle"><span>Effets sonores</span><button class="pb sm ${SAV.sound ? 'green' : ''}" id="m-snd" style="width:96px">${ic(SAV.sound ? 'sound' : 'mute', 2)}${SAV.sound ? 'Oui' : 'Non'}</button></div>
    <div class="mbtns"><button class="pb red" id="m-rst">Effacer la progression</button><button class="pb" id="m-x">Fermer</button></div>
    <p style="text-align:center;font-size:14px;color:var(--mut);margin-top:12px">Légion Pixel · v2.1 · sauvegarde locale</p>`, m => {
    m.querySelector('#m-snd').onclick = () => { SAV.sound = !SAV.sound; save(); openSet(); sfx('click'); };
    m.querySelector('#m-rst').onclick = () => confirmBox('Tout effacer ?', 'Pièces, cartes, niveaux et étoiles seront perdus définitivement.', 'Effacer', () => {
      localStorage.removeItem(SAVE_KEY); SAV = defSave(); save(); refreshGold(); scene.list = []; sizeScene();
    });
    m.querySelector('#m-x').onclick = closeModal;
  });
};

/* ---------- DÉMARRAGE ---------- */
decorate();
document.querySelectorAll('.cnt').forEach(el => el.insertAdjacentHTML('afterbegin', ic('person', 2)));
refreshGold();
requestAnimationFrame(loop);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => sizeScene());
sizeScene();
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
if (isIOS && !standalone) $('#install-hint').classList.remove('hidden');
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
