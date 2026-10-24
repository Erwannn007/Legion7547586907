/* Légion Pixel — Méta-jeu : armée, coffres, aide, réglages et démarrage */
'use strict';
/* ---------- ARMÉE ---------- */
function buildArmy(){
  const el = $('#army-grid'); el.innerHTML = '';
  for (const t of TYPES) {
    const c = SAV.cards[t], need = UP_N[c.lvl], max = c.lvl >= 5;
    const canUp = c.u && !max && c.n >= need && SAV.gold >= UP_G[c.lvl];
    const b = document.createElement('button'); b.className = 'ucard pp' + (c.u ? '' : ' locked') + (canUp ? ' can' : '');
    b.style.setProperty('--tier', c.u ? `var(--t${c.lvl})` : '');
    b.insertAdjacentHTML('beforeend', '<div class="por"></div>');
    b.firstChild.appendChild(portrait(t, c.lvl, 'blue', 3));
    b.insertAdjacentHTML('beforeend', `<div class="un">${UT[t].name}</div>
      <div class="ul">${c.u ? `Nv ${c.lvl} · ${LVL_NAMES[c.lvl]}` : `Niveau ${lvLabel(UT[t].unlock)} requis`}</div>
      ${c.u ? `<div class="bar ${max ? 'full' : c.n >= need ? 'ok' : ''}"><i style="width:${max ? 100 : Math.min(100, c.n / need * 100)}%"></i><span>${max ? 'MAX' : `${c.n}/${need}`}</span></div>` : ''}
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
  openModal(`<div class="mc"><div class="kick">${U.era.toUpperCase()} · ${U.role.toUpperCase()} · RANG ${LVL_NAMES[L].toUpperCase()}</div><h3 style="margin-top:0">${U.name}</h3>
    <div class="evo" id="evo"></div>
    <p style="text-align:center;margin:2px 0">${U.desc}</p>
    <div class="ability"><b>${U.ab}</b>${U.abd}</div>
    ${statBar('heart', 'Vie', hp(L), hp(L) / 1500, hp(nl) / 1500, max ? hp(L) : `${hp(L)}>${hp(nl)}`)}
    ${statBar('atk', 'Attaque', dm(L), dm(L) * (U.aoe ? 1.6 : 1) / U.cd / 60, dm(nl) * (U.aoe ? 1.6 : 1) / U.cd / 60, max ? dm(L) : `${dm(L)}>${dm(nl)}`)}
    ${statBar('range', 'Portée', U.range, U.range / 140, U.range / 140, U.range > 40 ? 'Loin' : U.range > 15 ? 'Lance' : 'Contact')}
    ${statBar('speed', 'Vitesse', U.spd, U.spd / 45, U.spd / 45, U.spd)}
    ${statBar('shield', 'Armure', U.armor, U.armor / .55, U.armor / .55, Math.round(U.armor * 100) + '%')}
    <div class="vs"><div class="good"><b>Fort contre</b><br>${U.good}</div><div class="bad"><b>Faible contre</b><br>${U.bad}</div></div>
    ${max ? '<p><b>Niveau maximum atteint</b></p>' : `<div class="bar ${c.n >= need ? 'ok' : ''}"><i style="width:${Math.min(100, c.n / need * 100)}%"></i><span>${c.n} / ${need} cartes</span></div>`}
    <div class="mbtns">
      ${max ? '' : `<button class="pb big ${ok ? 'green' : ''}" id="m-up" ${ok ? '' : 'disabled'}>${ic('up', 3)}Nv${L + 1} ${ic('coin', 2)}${cost}</button>`}
      <button class="pb ghost" id="m-x">Fermer</button></div></div>`, m => {
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
    return `<div class="chest pp ${it.rare ? 'rare' : ''} ${it.id === 'free' && !dis ? 'ready' : ''}"><div class="cimg"></div><div class="ci"><div class="ct">${it.name}</div><div class="cd">${it.desc}</div>
      <button class="pb sm ${dis ? '' : 'brass'}" ${dis ? 'disabled' : ''}>${lbl}</button></div></div>`;
  }).join('');
  el.querySelectorAll('.chest').forEach((d, k) => {
    const it = items[k];
    const g = it.rare ? CHEST.map(r => r.replace(/b/g, 'g').replace(/B/g, 'G')) : CHEST;
    const pal = it.rare ? Object.assign({}, BASE_PAL, {g:'#7a4fc0', G:'#3e2470'}) : BASE_PAL;
    const cs = paintGrid(g, pal, false, 5 * DPR); cs.style.width = '80px'; cs.style.height = '50px'; cs.style.animationDelay = -k * .7 + 's';
    d.querySelector('.cimg').appendChild(cs);
    d.querySelector('button').onclick = () => {
      if (it.id === 'free') { if (SAV.lastFree + FREE_CD > Date.now()) return; SAV.lastFree = Date.now(); SAV.gold += 40; }
      else { if (SAV.gold < it.cost) return; SAV.gold -= it.cost; }
      const got = rollCards(it.n); save(); sfx('coin'); refreshGold(); buildShop();
      openModal(`<div class="mc"><h3>${it.name}</h3>${lootHtml(got)}
        <div class="mbtns"><button class="pb big brass" id="m-x">Super !</button></div></div>`, m => { fillLoot(m); m.querySelector('#m-x').onclick = closeModal; });
    };
  });
}

/* ---------- AIDE & RÉGLAGES ---------- */
$('#b-help').onclick = () => openModal(`<div class="help"><h3>Comment jouer</h3>
  <h4>Le principe</h4><p>Comme dans Epic Battle Simulator : l’armée ennemie est déjà rangée en haut. Avec votre budget, recrutez et peignez librement vos soldats dans la zone bleue, puis lancez la bataille et regardez le carnage.</p>
  <h4>Les étoiles</h4><p>Gagner donne 1 étoile. Gagner en dépensant peu en donne 2 ou 3 : les seuils sont les traits blancs sur la jauge de budget. Votre armée est mémorisée, vous pouvez la retoucher et réessayer.</p>
  <h4>Les boss</h4><p>Chaque chapitre se termine par un Seigneur de guerre géant : très résistant, il balaie tout autour de lui.</p>
  <h4>Caméra</h4><p>Pincez le terrain pour zoomer, glissez pour vous déplacer, touchez deux fois pour revoir tout le champ de bataille.</p>
  <h4>35 soldats de toutes les époques</h4><p>Chevaliers et archères, elfes, orcs, trolls et nécromanciens, samouraïs et vikings, fusiliers et chars d’assaut, cyborgs, drones et mécas : chaque soldat a sa capacité (soins, poison, foudre en chaîne, vol, laser, invocation…). Touchez une carte dans Armée pour lire ses forces et faiblesses. La campagne en débloque de nouveaux à presque chaque victoire ; le bac à sable les offre tous.</p>
  <h4>Progression</h4><p>Les victoires rapportent pièces et cartes. Dans Armée, montez chaque soldat jusqu’au niveau 5 : cuir, fer, acier, or, puis mythique. Un soldat amélioré coûte toujours le même prix, mais vaut beaucoup plus.</p>
  <h4>Bac à sable</h4><p>Placez jusqu’à ${MAXU} soldats des deux camps à tous les niveaux, puis lancez la bataille. Le pinceau pose 1, 6 ou 24 soldats en formation, le dé génère deux armées au hasard, et le bouton retour rejoue la même bataille.</p>
  <div class="mbtns"><button class="pb brass" id="m-x">Compris</button></div></div>`, m => m.querySelector('#m-x').onclick = closeModal);
$('#b-set').onclick = function openSet(){
  openModal(`<h3>Réglages</h3>
    <div class="toggle"><span>Effets sonores</span><button class="pb sm ${SAV.sound ? 'green' : ''}" id="m-snd" style="width:96px">${ic(SAV.sound ? 'sound' : 'mute', 2)}${SAV.sound ? 'Oui' : 'Non'}</button></div>
    <div class="mbtns"><button class="pb red" id="m-rst">Effacer la progression</button><button class="pb ghost" id="m-x">Fermer</button></div>
    <p style="text-align:center;font-size:14px;color:var(--mut);margin-top:12px">Légion Pixel · v4.0 · sauvegarde locale</p>`, m => {
    m.querySelector('#m-snd').onclick = () => { SAV.sound = !SAV.sound; save(); openSet(); sfx('click'); };
    m.querySelector('#m-rst').onclick = () => confirmBox('Tout effacer ?', 'Pièces, cartes, niveaux et étoiles seront perdus définitivement.', 'Effacer', () => {
      localStorage.removeItem(SAVE_KEY); SAV = defSave(); save(); refreshGold(); updateHome(); scene.list = []; sizeScene();
    });
    m.querySelector('#m-x').onclick = closeModal;
  });
};

/* ---------- DÉMARRAGE ---------- */
decorate();
updateHome();
setInterval(updateBadges, 30000);
document.querySelectorAll('.cnt').forEach(el => el.insertAdjacentHTML('afterbegin', ic('person', 2)));
refreshGold();
requestAnimationFrame(loop);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => sizeScene());
sizeScene();
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
if (isIOS && !standalone) $('#install-hint').classList.remove('hidden');
// iOS en mode app : la hauteur rapportée oublie parfois la barre d'état et laisse une bande vide en bas
function fitApp(){
  const app = $('#app');
  if (!standalone) { app.style.height = ''; app.style.bottom = ''; return; }
  const portraitMode = matchMedia('(orientation: portrait)').matches;
  const h = Math.max(window.innerHeight, document.documentElement.clientHeight, isIOS ? (portraitMode ? screen.height : screen.width) : 0);
  app.style.bottom = 'auto'; app.style.height = h + 'px';
}
fitApp();
window.addEventListener('resize', fitApp);
window.addEventListener('orientationchange', () => setTimeout(() => { fitApp(); resize(); sizeScene(); }, 300));
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
