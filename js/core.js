/* Légion Pixel — Données des unités, sauvegarde, son, interface pixel, écrans et menu */
'use strict';
/* =========================================================
   LÉGION PIXEL — batailles épiques, 100 % pixel art, hors ligne
   ========================================================= */
const SAVE_KEY = 'legion-pixel-save-v1';
const $ = s => document.querySelector(s);
const rnd = Math.random;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const DPR = Math.max(1, Math.min(3, Math.round(window.devicePixelRatio || 1)));
const PX = 3; // taille d'un pixel d'interface en px CSS

/* ---------- UNITÉS ---------- */
// capacités : proj (projectile) · aoe · kite (recule) · minR · pierce · charge (multiplicateur) · taunt · block (bloque de face)
// deflect (renvoie les tirs) · cleave (frappe autour) · kb (repousse) · stun · steal (vol de vie) · regen · rage · burn · heal
// aura (soins de zone) · raise (relève les morts) · spores · resist (résiste aux tirs) · dodge · backline · snipe · burst · fly · boom (explose)
const UT = {
  sword: {name:'Épéiste', era:'Médiéval', role:'Mêlée', cost:10, hp:130, dmg:17, range:8, cd:.75, spd:40, squad:6, armor:.2, r:7, unlock:0, charge:2,
    ab:'Charge', abd:'Fonce sur sa cible et double les dégâts de son premier coup. Se recharge en 7 s.',
    good:'Archers, Sapeurs', bad:'Lanciers, Gardiens',
    desc:'Chevalier errant, rapide et bien protégé. Idéal pour plonger sur la ligne arrière.'},
  archer:{name:'Archère', era:'Médiéval', role:'Distance', cost:12, hp:60, dmg:15, range:135, cd:1.4, spd:32, squad:6, armor:0, r:6, unlock:0, proj:'arrow', kite:28,
    ab:'Volée', abd:'Tire en cloche à très longue portée et recule quand un ennemi s’approche.',
    good:'Lanciers, Sapeurs', bad:'Épéistes, Gardiens',
    desc:'Éclaireuse des bois. Fragile, mais elle arrose l’ennemi bien avant le contact.'},
  spear: {name:'Lancier', era:'Médiéval', role:'Allonge', cost:12, hp:110, dmg:22, range:26, cd:1.3, spd:32, squad:6, armor:.15, r:7, unlock:2, pierce:true,
    ab:'Transperce', abd:'Ignore l’armure et touche aussi l’ennemi placé derrière sa cible. Brise les charges.',
    good:'Gardiens, Cavaliers', bad:'Archères, Sapeurs',
    desc:'Lansquenet à la pique interminable. Il tient la ligne et punit les cavaliers téméraires.'},
  guard: {name:'Gardien', era:'Médiéval', role:'Tank', cost:30, hp:560, dmg:16, range:10, cd:1.25, spd:21, squad:2, armor:.5, r:11, unlock:5, taunt:80, block:.65, kb:1.4, cleave:14,
    ab:'Rempart', abd:'Attire les ennemis proches, bloque les flèches de face et repousse au bouclier.',
    good:'Archères, Épéistes', bad:'Lanciers, Cyborgs',
    desc:'Colosse en armure de plates. Seul, mais il vaut une escouade entière en défense.'},
  bomber:{name:'Sapeur', era:'Médiéval', role:'Zone', cost:30, hp:75, dmg:34, range:105, minR:30, cd:2.8, spd:26, squad:4, armor:0, r:7, unlock:9, proj:'bomb', aoe:30, kite:34,
    ab:'Grenade', abd:'Vise le groupe le plus serré. L’explosion blesse et repousse. Inutile à bout portant.',
    good:'Groupes serrés, Lanciers', bad:'Épéistes, Ninjas',
    desc:'Artificier barbu à lunettes. Lent à recharger, dévastateur sur une formation compacte.'},

  skel:  {name:'Squelette', era:'Fantastique', role:'Horde', cost:5, hp:45, dmg:10, range:8, cd:.9, spd:34, squad:6, armor:0, r:6, unlock:1, resist:.5,
    ab:'Os creux', abd:'Les flèches et les balles le traversent à moitié. Pas cher : noyez l’ennemi sous le nombre.',
    good:'Archères, Fusiliers', bad:'Sapeurs, Samouraïs',
    desc:'Un tas d’os animé, armé d’une épée rouillée. Seul il ne vaut rien, par cinquante il fait peur.'},
  goblin:{name:'Gobelin', era:'Fantastique', role:'Kamikaze', cost:6, hp:40, dmg:60, range:4, cd:1, spd:56, squad:6, armor:0, r:5, unlock:2, boom:24,
    ab:'Tonneau de poudre', abd:'Court vers l’ennemi et explose à son contact, en blessant tout le groupe autour.',
    good:'Groupes serrés, Tanks lents', bad:'Archères, Mitrailleurs',
    desc:'Petit, vert et ravi de tout faire sauter, y compris lui-même.'},
  viking:{name:'Viking', era:'Histoire', role:'Mêlée', cost:16, hp:210, dmg:24, range:9, cd:1, spd:36, squad:4, armor:.25, r:8, unlock:3, block:.35, kb:.6,
    ab:'Bouclier rond', abd:'Bloque une partie des tirs de face et repousse ceux qu’il frappe à la hache.',
    good:'Archères, Épéistes', bad:'Lanciers, Samouraïs',
    desc:'Pillard des mers du Nord, barbe tressée et hache affûtée. Solide et polyvalent.'},
  legion:{name:'Légionnaire', era:'Histoire', role:'Ligne', cost:14, hp:170, dmg:18, range:10, cd:.9, spd:30, squad:6, armor:.35, r:7, unlock:3, block:.65,
    ab:'Tortue', abd:'Son grand bouclier bloque la plupart des tirs venus de face. Il frappe vite au glaive.',
    good:'Archères, Fusiliers', bad:'Sapeurs, Lanciers',
    desc:'Soldat de Rome, discipliné et lourdement protégé. La ligne idéale face aux tireurs.'},
  elf:   {name:'Rôdeuse elfe', era:'Fantastique', role:'Tireur', cost:18, hp:70, dmg:13, range:160, cd:.9, spd:36, squad:6, armor:0, r:6, unlock:4, proj:'arrow', kite:30,
    ab:'Tir elfique', abd:'Tire plus vite et plus loin que l’Archère, puis recule avec grâce.',
    good:'Mages, Lanciers', bad:'Ninjas, Cavaliers',
    desc:'Archère des forêts éternelles. Sa portée est la plus longue de toutes les tireuses.'},
  orc:   {name:'Berserker orc', era:'Fantastique', role:'Furie', cost:16, hp:210, dmg:24, range:9, cd:.9, spd:38, squad:4, armor:.1, r:8, unlock:4, rage:true, cleave:10,
    ab:'Rage', abd:'Plus il est blessé, plus il frappe fort : jusqu’à deux fois plus à l’agonie. Sa hache touche aussi les voisins.',
    good:'Squelettes, Épéistes', bad:'Archères, Gardiens',
    desc:'Une montagne de muscles verts qui ne connaît ni la peur ni la retraite.'},
  dwarf: {name:'Nain', era:'Fantastique', role:'Rempart', cost:20, hp:240, dmg:22, range:8, cd:1.1, spd:27, squad:4, armor:.4, r:7, unlock:5, stun:.35,
    ab:'Marteau runique', abd:'Un coup sur trois environ assomme la cible pendant près d’une seconde.',
    good:'Orcs, Vampires', bad:'Lanciers, Mages',
    desc:'Petit mais indestructible, caché derrière sa barbe et son armure de forge.'},
  priest:{name:'Prêtresse', era:'Fantastique', role:'Soin', cost:22, hp:95, dmg:24, range:95, cd:1.3, spd:30, squad:3, armor:0, r:7, unlock:6, proj:'heal', kite:30,
    ab:'Lumière', abd:'Soigne l’allié blessé le plus proche. Sans blessé, elle frappe l’ennemi d’un rayon sacré.',
    good:'Armées de mêlée', bad:'Ninjas, Gobelins',
    desc:'Gardienne du temple. Une ligne de front qu’elle soigne tient deux fois plus longtemps.'},
  rifle: {name:'Fusilier', era:'Moderne', role:'Tireur', cost:16, hp:85, dmg:20, range:130, cd:1.1, spd:32, squad:6, armor:.05, r:6, unlock:6, proj:'bullet', kite:26,
    ab:'Feu à volonté', abd:'Ses balles volent droit et vite : impossible de les esquiver.',
    good:'Archères, Orcs', bad:'Légionnaires, Squelettes',
    desc:'Soldat du siècle dernier, casque et fusil. Précis, efficace, sans fioritures.'},
  ninja: {name:'Ninja', era:'Histoire', role:'Assassin', cost:20, hp:95, dmg:30, range:8, cd:.6, spd:62, squad:3, armor:0, r:6, unlock:7, dodge:.4, backline:true,
    ab:'Ombre', abd:'Contourne la mêlée pour égorger les tireurs et esquive 40 % des coups.',
    good:'Archères, Mages, Tireurs', bad:'Gardiens, Nains',
    desc:'Personne ne le voit venir. Lâchez-le sur les flancs, il ira tout seul vers l’arrière.'},
  samurai:{name:'Samouraï', era:'Histoire', role:'Duelliste', cost:26, hp:250, dmg:36, range:12, cd:1.1, spd:38, squad:3, armor:.2, r:8, unlock:7, cleave:16,
    ab:'Iaijutsu', abd:'Chaque coup de katana tranche en arc et blesse tous les ennemis devant lui.',
    good:'Squelettes, Vikings, Hordes', bad:'Fusiliers, Lance-flammes',
    desc:'Guerrier d’honneur en armure laquée. Une lame, un geste, trois ennemis à terre.'},
  mage:  {name:'Pyromancien', era:'Fantastique', role:'Magie', cost:28, hp:80, dmg:30, range:120, cd:2.2, spd:28, squad:3, armor:0, r:7, unlock:8, proj:'fire', aoe:22, burn:8, kite:30,
    ab:'Boule de feu', abd:'Une boule de feu explose sur la cible et enflamme tout le groupe pendant 3 s.',
    good:'Groupes serrés, Myconides', bad:'Ninjas, Cavaliers',
    desc:'Vieux sage au chapeau pointu. Sa barbe a déjà brûlé deux fois.'},
  mush:  {name:'Myconide', era:'Invention', role:'Poison', cost:14, hp:170, dmg:8, range:8, cd:1, spd:24, squad:4, armor:0, r:7, unlock:8, spores:true,
    ab:'Spores', abd:'Libère toutes les 3 s un nuage toxique qui empoisonne les ennemis autour. Explose en spores à sa mort.',
    good:'Hordes, Squelettes, Gobelins', bad:'Pyromanciens, Tireurs',
    desc:'Un champignon qui marche. Lent, mou, et terriblement contagieux.'},
  vampire:{name:'Vampire', era:'Fantastique', role:'Prédateur', cost:30, hp:220, dmg:26, range:8, cd:.7, spd:48, squad:2, armor:.1, r:7, unlock:9, steal:.6,
    ab:'Morsure', abd:'Récupère 60 % des dégâts qu’il inflige. Il se soigne en combattant.',
    good:'Épéistes, Fusiliers', bad:'Prêtresses, Paladins',
    desc:'Noble de la nuit aux griffes acérées. Plus le combat dure, plus il est en forme.'},
  troll: {name:'Troll', era:'Fantastique', role:'Géant', cost:60, hp:1150, dmg:46, range:12, cd:1.8, spd:20, squad:1, armor:.15, r:13, unlock:10, regen:14, cleave:18, kb:1.5,
    ab:'Régénération', abd:'Reprend 14 PV par seconde et balaie tout autour de lui à la massue.',
    good:'Hordes, Épéistes', bad:'Pyromanciens, Lance-flammes',
    desc:'Géant des cavernes au gros nez. Seul le feu l’empêche vraiment de guérir.'},
  shaman:{name:'Chaman', era:'Fantastique', role:'Foudre', cost:30, hp:110, dmg:24, range:115, cd:2, spd:28, squad:2, armor:0, r:7, unlock:10, proj:'chain', kite:30,
    ab:'Arc électrique', abd:'Un éclair frappe sa cible puis rebondit sur 3 ennemis proches.',
    good:'Hordes, Drones', bad:'Golems, Ninjas',
    desc:'Il parle aux orages. Son bâton crépite d’une foudre qui saute de soldat en soldat.'},
  knight:{name:'Cavalier', era:'Médiéval', role:'Cavalerie', cost:45, hp:500, dmg:34, range:12, cd:1.2, spd:54, squad:2, armor:.35, r:12, unlock:11, charge:3, kb:1.5,
    ab:'Charge à la lance', abd:'Galope sur l’ennemi : le premier coup de lance fait trois fois plus de dégâts et renverse.',
    good:'Archères, Tireurs, Mages', bad:'Lanciers, Légionnaires',
    desc:'Chevalier en armure sur son destrier caparaçonné. Le plus rapide des soldats lourds.'},
  gunner:{name:'Mitrailleur', era:'Moderne', role:'Barrage', cost:30, hp:140, dmg:7, range:115, cd:2, spd:24, squad:2, armor:.1, r:8, unlock:11, proj:'bullet', burst:6,
    ab:'Rafale', abd:'Lâche une rafale de 6 balles qui balaie les rangs ennemis.',
    good:'Hordes, Gobelins, Squelettes', bad:'Légionnaires, Golems',
    desc:'Un bandana, une mitrailleuse et beaucoup trop de munitions.'},
  necro: {name:'Nécromancien', era:'Fantastique', role:'Invocateur', cost:34, hp:110, dmg:20, range:115, cd:1.8, spd:26, squad:2, armor:0, r:7, unlock:12, proj:'shadow', raise:true, kite:30,
    ab:'Armée des morts', abd:'Les ennemis qui meurent près de lui se relèvent en squelettes pour son camp.',
    good:'Grosses mêlées, Hordes', bad:'Prêtresses, Ninjas',
    desc:'Sorcier encapuchonné au bâton crâne. Chaque mort ennemi grossit ses rangs.'},
  flamer:{name:'Lance-flammes', era:'Moderne', role:'Brasier', cost:28, hp:170, dmg:9, range:38, cd:.18, spd:28, squad:2, armor:.15, r:8, unlock:12, proj:'cone', burn:7,
    ab:'Brasier', abd:'Crache un cône de feu continu qui enflamme tout ce qu’il touche.',
    good:'Trolls, Myconides, Hordes', bad:'Tireurs, Sapeurs',
    desc:'Masque à gaz, réservoirs sur le dos : rien ne repousse là où il passe.'},
  paladin:{name:'Paladin', era:'Fantastique', role:'Saint', cost:40, hp:430, dmg:26, range:10, cd:1.2, spd:30, squad:2, armor:.35, r:9, unlock:13, aura:16,
    ab:'Aura sacrée', abd:'Toutes les 2 s, soigne de 16 PV les alliés autour de lui.',
    good:'Vampires, Nécromanciens', bad:'Lanciers, Cyborgs',
    desc:'Chevalier sacré au heaume ailé. Le cœur d’une ligne de front qui ne cède pas.'},
  sniper:{name:'Tireur d’élite', era:'Moderne', role:'Précision', cost:34, hp:60, dmg:110, range:230, cd:3.4, spd:26, squad:2, armor:0, r:6, unlock:13, proj:'bullet', snipe:true, kite:40,
    ab:'Tir d’élite', abd:'Vise toujours l’ennemi le plus robuste à portée, de l’autre bout du champ.',
    good:'Gardiens, Trolls, Cavaliers', bad:'Ninjas, Gobelins',
    desc:'Caché sous sa tenue de camouflage. Un tir toutes les trois secondes, mais quel tir.'},
  cyborg:{name:'Cyborg', era:'Futur', role:'Laser', cost:36, hp:270, dmg:28, range:140, cd:1.4, spd:30, squad:3, armor:.3, r:7, unlock:14, proj:'laser', pierce:true,
    ab:'Rayon laser', abd:'Un rayon instantané qui ignore l’armure et traverse toute la ligne.',
    good:'Gardiens, Légionnaires', bad:'Ninjas, Lames plasma',
    desc:'Mi-homme, mi-machine, son œil rouge ne rate jamais rien.'},
  drone: {name:'Drone', era:'Futur', role:'Aérien', cost:22, hp:70, dmg:9, range:95, cd:.45, spd:50, squad:3, armor:0, r:6, unlock:14, proj:'bolt', fly:true,
    ab:'Vol', abd:'Survole la mêlée sans être bloqué et mitraille avec de petits lasers.',
    good:'Mêlée lente, Golems', bad:'Chamans, Mitrailleurs',
    desc:'Quadricoptère de combat. Il passe au-dessus de tout le monde.'},
  minotaur:{name:'Minotaure', era:'Fantastique', role:'Bélier', cost:55, hp:880, dmg:50, range:12, cd:1.6, spd:30, squad:1, armor:.2, r:13, unlock:15, charge:2.5, kb:2, cleave:16,
    ab:'Coup de cornes', abd:'Charge tête baissée : le premier coup fait 2,5 fois plus mal et envoie valser tout le monde.',
    good:'Lignes serrées, Légionnaires', bad:'Lanciers, Tireurs d’élite',
    desc:'Mi-homme, mi-taureau, armé d’une hache double plus grande que lui.'},
  saber: {name:'Lame plasma', era:'Futur', role:'Duelliste', cost:34, hp:230, dmg:34, range:10, cd:.7, spd:46, squad:3, armor:.15, r:7, unlock:15, deflect:.5, charge:2,
    ab:'Renvoi', abd:'Dévie la moitié des tirs avec sa lame d’énergie et bondit sur sa cible.',
    good:'Fusiliers, Cyborgs, Archères', bad:'Trolls, Minotaures',
    desc:'Chevalier des étoiles au sabre lumineux aux couleurs de son camp.'},
  golem: {name:'Golem', era:'Fantastique', role:'Colosse', cost:80, hp:2100, dmg:40, range:12, cd:2.2, spd:16, squad:1, armor:.55, r:14, unlock:16, resist:.3, cleave:22, kb:1.8,
    ab:'Peau de pierre', abd:'Les tirs ne lui font presque rien et ses poings secouent tout autour de lui.',
    good:'Archères, Fusiliers, Drones', bad:'Lanciers, Cyborgs',
    desc:'Un rocher vivant animé par une rune lumineuse. Lent, mais impossible à arrêter.'},
  dragon:{name:'Dragonnet', era:'Fantastique', role:'Aérien', cost:50, hp:330, dmg:9, range:42, cd:.22, spd:38, squad:1, armor:.1, r:10, unlock:17, proj:'cone', burn:6, fly:true,
    ab:'Souffle de feu', abd:'Vole au-dessus des lignes et crache un torrent de flammes.',
    good:'Mêlée, Trolls, Myconides', bad:'Tireurs d’élite, Chamans',
    desc:'Un jeune dragon aux écailles de son camp. Déjà assez grand pour tout brûler.'},
  tank:  {name:'Char d’assaut', era:'Moderne', role:'Blindé', cost:140, hp:2700, dmg:90, range:150, minR:26, cd:3.2, spd:15, squad:1, armor:.6, r:16, unlock:18, proj:'shell', aoe:32,
    ab:'Obus', abd:'Un obus explosif à longue portée. Blindage énorme, mais aveugle de tout près.',
    good:'Tout ce qui est serré', bad:'Gobelins, Ninjas, Cyborgs',
    desc:'Quarante tonnes d’acier aux couleurs de son camp. Le roi du champ de bataille.'},
  mech:  {name:'Méca', era:'Futur', role:'Titan', cost:160, hp:3100, dmg:46, range:165, minR:24, cd:2.6, spd:17, squad:1, armor:.5, r:18, unlock:19, proj:'rocket', aoe:26, burst:3,
    ab:'Salve de roquettes', abd:'Tire 3 roquettes à tête chercheuse qui explosent sur l’ennemi.',
    good:'Hordes, Chars', bad:'Cyborgs, Ninjas',
    desc:'Robot de combat piloté, haut comme une maison. La fin de toutes les guerres.'}
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
  cards:Object.fromEntries(TYPES.map(t => [t, {lvl:1, n:0, u:UT[t].unlock === 0}]))});
let SAV;
function load(){
  let d = null; try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch(e) {}
  SAV = Object.assign(defSave(), d || {});
  const dc = defSave().cards;
  for (const k in dc) SAV.cards[k] = Object.assign(dc[k], (d && d.cards && d.cards[k]) || {});
  // les nouveaux soldats déjà mérités par la campagne sont débloqués d'office
  for (const t of TYPES) if (UT[t].unlock && UT[t].unlock <= SAV.cleared) SAV.cards[t].u = true;
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
    case 'gun': noise(.05, .2, 3500); tone(400, 120, .05, 'square', .04); break;
    case 'laser': tone(1800, 300, .14, 'sawtooth', .04); break;
    case 'zap': noise(.12, .14, 6000); tone(900, 1800, .1, 'square', .04); break;
    case 'flame': noise(.12, .07, 1200); break;
    case 'magic': tone(600, 1200, .18, 'triangle', .06); break;
    case 'heal': tone(880, 0, .08, 'sine', .05); tone(1320, 0, .12, 'sine', .04, .06); break;
    case 'rocket': noise(.25, .12, 1500); tone(220, 500, .2, 'sawtooth', .03); break;
    case 'cannon': noise(.3, .4, 500); tone(90, 40, .3, 'sine', .3); break;
    case 'raise': tone(140, 280, .3, 'triangle', .07); break;
  } } catch(e) {}
}
window.addEventListener('pointerdown', () => ac(), {once:true});

/* ---------- INTERFACE PIXEL : icônes (les cadres sont en CSS pur) ---------- */
function gridURL(grid, pal, s){ return paintGrid(grid, pal, false, s).toDataURL(); }
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
    const n = el.dataset.ic, small = el.classList.contains('chip') || (n === 'chest' && el.classList.contains('tab'));
    el.insertAdjacentHTML('afterbegin', ic(n, small ? 2 : 3));
  });
}

/* ---------- DESSIN DES SOLDATS (le contexte est en pixels du monde ; les sprites sont en double résolution) ---------- */
const shadowCache = {};
function pixEllipse(rx, ry, col){
  const k = rx + '_' + ry + col; if (shadowCache[k]) return shadowCache[k];
  const c = document.createElement('canvas'); c.width = rx * 2 + 1; c.height = ry * 2 + 1;
  const x = c.getContext('2d'); x.fillStyle = col;
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx + .5) + (j * j) / (ry * ry + .5) <= 1) x.fillRect(i + rx, j + ry, 1, 1);
  return shadowCache[k] = c;
}
// hauteur de vol (en pixels du monde) des unités aériennes
const flyH = (u, t) => UNITS_ART[u.type].fly ? 9 + Math.sin(t * 4 + u.id) * 1.5 : 0;
const IDLE_ANG = {swing:.3, slash:.45, heavy:.5, stab:.9, cast:.12, couch:1.25, thrust:.18};
function drawUnitAt(c, u, X, Y, t, alpha){
  const A = UNITS_ART[u.type], sc = u.sc || 1;
  c.save(); if (alpha != null) c.globalAlpha = alpha;
  c.translate(Math.round(X * HR) / HR, Math.round(Y * HR) / HR); c.scale(1 / HR, 1 / HR);
  const sw = Math.round(A.sw * sc), sh = pixEllipse(sw, Math.round(4 * sc), 'rgba(0,0,0,.3)');
  c.drawImage(sh, -sw, -Math.round(4 * sc));
  if (u.lvl >= 5 || sc > 1) {
    const p = Math.floor((t * 6 + u.id) % 4), col = sc > 1 ? 'rgba(255,90,60,.3)' : 'rgba(190,110,255,.28)';
    const au = pixEllipse(Math.round((sw + 5 + (p > 1 ? 2 : 0))), Math.round(8 * sc), col); c.drawImage(au, -au.width / 2 | 0, -Math.round(8 * sc));
  }
  c.translate(0, -Math.round(flyH(u, t) * HR * sc));
  c.scale((u.face || 1) * sc, sc);
  const p = u.atk > 0 ? 1 - u.atk : 0, sp = Math.sin(p * Math.PI);
  const body0 = A.anim === 'recoil' ? -Math.round(sp * 2) : Math.round(sp * (A.anim === 'slam' || A.anim === 'claw' ? 5 : 3));
  const bob = (!u.moving && Math.sin(t * 3 + u.id * 1.7) > .55) ? -1 : 0;
  const frame = A.fly ? Math.floor(t * 10 + u.id) % 4 : u.moving ? WALK_SEQ[Math.floor(u.walk * (u.charging ? 16 : 9)) % 4] : 0;
  const fl = u.flash > 0;
  const body = bodySprite(u.type, u.lvl, u.team, frame, fl);
  const bx = -A.w / 2 + body0, by = -(A.h - 1) + bob;
  const hx = bx + A.hand[0], hy = by + A.hand[1];
  const dw = (name, wx, wy, ang) => {
    const s = weaponSprite(name, u.lvl, u.team, fl), W = WEAP[name];
    c.save(); c.translate(Math.round(wx), Math.round(wy)); if (ang) c.rotate(ang);
    c.drawImage(s, -W.g[0], -W.g[1]); c.restore();
  };
  const e = p < .45 ? p / .45 : 1, idle = IDLE_ANG[A.anim] || 0;
  // armes tenues derrière le corps
  if (A.wp2 === 'mace') dw('mace', bx + A.hand2[0], by + A.hand2[1], u.atk > 0 ? -2.2 + p * 3.2 : -.5);
  if (A.anim === 'thrust' && !(u.atk > 0)) dw(A.wp, hx, hy, idle);
  c.drawImage(body, bx, by);
  if (A.wp) switch (A.anim) {
    case 'swing': dw(A.wp, hx, hy, u.atk > 0 ? -1.3 + e * 3 : (u.charging ? 1.2 : idle)); break;
    case 'slash': dw(A.wp, hx, hy, u.atk > 0 ? -1.7 + e * 3.6 : (u.charging ? 1.3 : idle)); break;
    case 'heavy': dw(A.wp, hx, hy, u.atk > 0 ? (p < .35 ? idle - p / .35 * 2.8 : -2.3 + Math.min(1, (p - .35) / .3) * 3.9) : idle); break;
    case 'stab': dw(A.wp, hx + Math.round(sp * 6), hy, u.atk > 0 ? 1.5 : idle); break;
    case 'thrust': if (u.atk > 0) dw(A.wp, hx + Math.round(sp * 18), hy - 4, Math.PI / 2 - .08); break;
    case 'couch': dw(A.wp, hx + Math.round(sp * 14), hy, u.atk > 0 || u.charging ? 1.45 : idle); break;
    case 'bow': dw(A.wp, hx - Math.round(sp * 4), hy, clamp(u.aim || 0, -1.1, .9) * .6); break;
    case 'gun': case 'spray': {
      const ang = clamp(u.aim || 0, -.7, .7), W = WEAP[A.wp], rc = A.anim === 'gun' && p < .4 ? 3 : 0;
      dw(A.wp, hx - rc, hy, ang);
      if (A.anim === 'gun' && u.atk > 0 && p < .25) {
        const tx = hx - rc + Math.cos(ang) * (W.tip[0] - W.g[0]) - Math.sin(ang) * (W.tip[1] - W.g[1]), ty = hy + Math.sin(ang) * (W.tip[0] - W.g[0]) + Math.cos(ang) * (W.tip[1] - W.g[1]);
        c.fillStyle = '#fff6c0'; c.fillRect(Math.round(tx), Math.round(ty) - 2, 4, 4); c.fillStyle = '#ffb432'; c.fillRect(Math.round(tx) + 4, Math.round(ty) - 1, 3, 2); c.fillRect(Math.round(tx) + 1, Math.round(ty) - 4, 2, 2); c.fillRect(Math.round(tx) + 1, Math.round(ty) + 2, 2, 2);
      }
      break;
    }
    case 'cast': dw(A.wp, hx, hy - Math.round(sp * 8), idle - sp * .5); break;
    case 'throw':
      if (u.cd < u.cdMax * .6 && !(u.atk > 0)) dw(A.wp, hx, hy - 6, 0);
      else if (u.atk > 0 && p < .3) dw(A.wp, hx - 8, hy - 18, 0);
      break;
    case 'bash': dw(A.wp, hx - 6 + Math.round(sp * 10), hy + 4, 0); break;
    default: dw(A.wp, hx, hy, 0);
  }
  if (A.wp2 && A.wp2 !== 'mace') dw(A.wp2, bx + A.hand2[0] + Math.round(sp * 2), by + A.hand2[1], 0);
  c.restore();
}
// portrait net, pré-agrandi (pas de flou sur iOS) ; les très grands soldats sont réduits
function portrait(type, lvl, team = 'blue', s = 2, att){
  const A = UNITS_ART[type], fit = Math.min(1, 62 / A.h, 70 / A.w);
  const k = Math.max(1, Math.round(s * fit * DPR / HR)); // pixels d'écran par pixel de sprite
  const W = Math.ceil(A.w / HR) + 8, H = Math.ceil((A.h + (A.fly ? 20 : 0)) / HR) + 5;
  const c = document.createElement('canvas'); c.width = W * HR * k; c.height = H * HR * k;
  c.style.width = c.width / DPR + 'px'; c.style.height = c.height / DPR + 'px';
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.scale(HR * k, HR * k);
  drawUnitAt(x, Object.assign({type, lvl, team, face:1, atk:0, moving:false, walk:0, flash:0, id:1, cd:0, cdMax:1, aim:-.2}, att || {}), W / 2, H - 2.5, 0);
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
const TABS = ['menu', 'story', 'army', 'shop'];
function go(name){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  $('#s-' + name).classList.add('on'); cur = name;
  $('#tabbar').classList.toggle('hidden', !TABS.includes(name));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === name));
  refreshGold();
  if (name === 'story') buildStory();
  if (name === 'army') buildArmy();
  if (name === 'shop') buildShop();
  if (name === 'battle') resize();
  if (name === 'menu') { updateHome(); sizeScene(); }
}
const totalStars = () => Object.values(SAV.stars).reduce((a, b) => a + b, 0);
let shownGold = null;
function refreshGold(){
  document.querySelectorAll('.goldv').forEach(e => {
    e.textContent = SAV.gold;
    if (shownGold != null && shownGold !== SAV.gold) { e.parentNode.classList.remove('ticker'); void e.offsetWidth; e.parentNode.classList.add('ticker'); }
  });
  shownGold = SAV.gold;
  document.querySelectorAll('.starv').forEach(e => e.textContent = `${totalStars()}/${NLEV * 3}`);
  updateBadges();
}
// pastilles rouges sur les onglets : amélioration possible / coffre gratuit prêt
function updateBadges(){
  const up = TYPES.some(t => { const c = SAV.cards[t]; return c.u && c.lvl < 5 && c.n >= UP_N[c.lvl] && SAV.gold >= UP_G[c.lvl]; });
  const free = SAV.lastFree + 4 * 3600 * 1000 <= Date.now();
  for (const [tab, on] of [['army', up], ['shop', free]]) {
    const el = document.querySelector(`.tab[data-tab="${tab}"]`); if (!el) continue;
    let d = el.querySelector('.dot'); if (on && !d) el.insertAdjacentHTML('beforeend', '<i class="dot"></i>'); else if (!on && d) d.remove();
  }
}
function updateHome(){
  const done = Math.min(SAV.cleared, NLEV), next = Math.min(NLEV, SAV.cleared + 1);
  $('#prog-t').textContent = `${done}/${NLEV}`; $('#prog-b').style.width = done / NLEV * 100 + '%';
  $('#play-sub').textContent = SAV.cleared >= NLEV ? 'Campagne terminée !' : `${lvLabel(next)} · ${LEVELS[next - 1].n}`;
}
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
  sfx('click'); if (b.dataset.go === 'sandbox') startSandbox(); else go(b.dataset.go);
}));
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { if (cur === b.dataset.tab) return; sfx('click'); go(b.dataset.tab); }));
$('#b-play').insertAdjacentHTML('afterbegin', ic('swords', 4));
$('#b-play').addEventListener('click', () => { sfx('click'); if (SAV.cleared >= NLEV) go('story'); else levelModal(SAV.cleared + 1); });
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
  scene.art.width = scene.W * HR; scene.art.height = scene.H * HR;
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
  a.setTransform(HR, 0, 0, HR, 0, 0); a.drawImage(scene.bg, 0, 0);
  for (const m of scene.list) {
    m.x += m.spd * dt; m.walk += dt * .8;
    if (m.x > scene.W + 20 || m.x < -20) Object.assign(m, newMarcher(m.spd > 0 ? -18 : scene.W + 18));
  }
  scene.list.slice().sort((p, q) => p.y - q.y).forEach(m => drawUnitAt(a, m, m.x, scene.ground + 8 + m.y, t));
  const c = scene.cv.getContext('2d'); c.imageSmoothingEnabled = false;
  c.drawImage(scene.art, 0, 0, scene.W * scene.S * DPR, scene.H * scene.S * DPR);
}
