/* Légion Pixel — Pixel art : palettes, sprites des soldats, armes, icônes et moteur de sprites */
'use strict';
/* ================= PIXEL ART : DONNÉES & MOTEUR ================= */
// Lettres "moyennes" -> ombrées automatiquement [clair, sombre]
const SHADE = {s:['z','S'], T:['u','t'], A:['H','a'], y:['F','Y'], b:['c','B'], p:['i','P'], n:['2','N'],
  h:['3','j'], r:['4','R'], g:['v','G'], m:['5','M'], k:['K','x'], w:['W','6'], l:['8','7'], d:['0','D']};
const BASE_PAL = {
  o:'#1a1020', e:'#20142e', q:'#7ae0ff', f:'#ff8a2a', '9':'#ffe066',
  z:'#ffd9b8', s:'#f0b088', S:'#c27b58',
  F:'#fff2a8', y:'#f2c14a', Y:'#b8861a',
  c:'#c9925a', b:'#8f5c30', B:'#5a3519',
  i:'#8c7a6a', p:'#655548', P:'#43372e',
  '2':'#6a4630', n:'#4a2e1e', N:'#2e1a10',
  '3':'#9a6238', h:'#6b3d1e', j:'#43240f',
  '4':'#ffa04a', r:'#e0702a', R:'#a04818',
  v:'#5f9a4a', g:'#3e7034', G:'#264a22',
  '5':'#b9bfcc', m:'#868c9c', M:'#585d6c',
  K:'#6a6a88', k:'#40405a', x:'#26263a',
  W:'#ffffff', w:'#c8d0dc', '6':'#8a94a8',
  '8':'#ffffff', l:'#e8e0d0', '7':'#b0a690',
  '0':'#c08a50', d:'#8a5a2b', D:'#5a3519'
};
const LVL_PAL = [null,
  {H:'#e0ad70', A:'#a8743e', a:'#6e4824'},  // 1 cuir
  {H:'#d6dbe4', A:'#9298a6', a:'#5c606e'},  // 2 fer
  {H:'#e6f2ff', A:'#82abd8', a:'#4a6a94'},  // 3 acier
  {H:'#fff3a8', A:'#e8b838', a:'#a87a18'},  // 4 or
  {H:'#f6d8ff', A:'#b46ce4', a:'#6a389c'}]; // 5 mythique
const TEAM_PAL = {blue:{u:'#8cc0ff', T:'#3b7ff0', t:'#1f4aa8'}, red:{u:'#ff9a8a', T:'#e04646', t:'#8e2430'}};

/* -------- SOLDATS (remplissage seul : contour + ombrage auto) -------- */
const UNITS_ART = {
  sword: { // Le chevalier errant : casque à nasal, tabard, cape
    hand:[18,17], plume:[10,0],
    body:[
"..........AAAA",
"........HAAAAAAA",
".......HAAAAAAAAA",
".......AAAAAAAAAAA",
".......aaaaaaaaaaaa",
".......AAAzzzzzAz",
".......AAasssesAss",
".......aAassssssS",
"........aasssssS",
".........aSSSS",
"......ttmmTTTTTHAA",
".....tttmmTTyTTAAAA",
".....tttmmTyyyTmAAm",
".....tttmmTTyTTmmmm",
".....tttmTTTyTTT.mm",
".....tttmTTTTTTT.mm",
".....tttBbbbybbB.zs",
".....tttTTTTTTTT",
".....ttTTTTtTTTT"],
    legs:[[
"........ppp.ppp",
"........ppp.ppp",
"........AAA.AAA",
"........AAA.AAA",
"........nnn.nnn",
".......nnnn.nnnn"],[
".......ppp..ppp",
"......ppp....ppp",
"......AAA.....AAA",
".....AAA......AAA",
".....nnn......nnn",
"....nnnn......nnnn"]]
  },
  archer: { // L'éclaireuse : capuche, cape verte, carquois
    hand:[18,16], plume:[9,0],
    body:[
".........TTTT",
"........TTTTTTT",
".......TTTTTTTTT",
"......TTTTTTTTTTT",
"......tTTThhhhzzT",
"......tTTThzzzzzz",
"......tTTTssssess",
"......tTTTsssssssS",
".......tTTsssssSS",
"...l.l..tTTSSSS",
"...7l7ggggggggggg",
"...BbBgggbAAAAbggg",
"...BbBggbbAHAAbbggc",
"...BbBggbbAAAAbb.cc",
"...BbBggbbbAAbbb.cc",
"...BbBggbbbbbbbb.zs",
"...BbBggBByBBBBB",
"....BBggbbbbbbbb",
"......ggbbb.bbbb"],
    legs:[[
"........ppp.ppp",
"........ppp.ppp",
"........ppp.ppp",
"........nnn.nnn",
"........nnn.nnn",
".......nnnn.nnnn"],[
".......ppp..ppp",
"......ppp....ppp",
"......ppp.....ppp",
".....nnn......nnn",
".....nnn......nnn",
"....nnnn......nnnn"]]
  },
  spear: { // Le lansquenet : chapeau de fer, moustache, manches bouffantes
    hand:[19,16], plume:[10,-1],
    body:[
"..........AAA",
".........HAAAA",
"........HAAAAAA",
"........AAAAAAA",
".....aaaaaaaaaaaaaa",
".......hhzzzzzz",
".......hhssssess",
".......hhsssssssS",
"........hsjjjjs",
"........SsssssS",
".........SSSS",
"......TlTAAAAAATlT",
".....TlTlAHAAAAATlTl",
".....lTlTAHAAAAAlTlT",
".....TlTlAAAAAAATlTl",
"......lTTAAAAAAA..lTzs",
"......TlTyyyyyyy....",
"......lTTlTlTlTl",
".......TTlTlTlTl",
"........lTlTlTlT"],
    legs:[[
".........lll.lll",
".........lll.lll",
".........lll.lll",
".........nnn.nnn",
"........nnnn.nnnn"],[
"........lll...lll",
".......lll.....lll",
"......lll......lll",
"......nnn.......nnn",
".....nnnn.......nnnn"]]
  },
  guard: { // Le colosse : heaume, épaulières massives, cotte de mailles
    hand:[19,13], hand2:[6,12], plume:null,
    body:[
"..........tTu",
".........tTTTu",
"........HAAAAAAA",
".......HAAAAAAAAA",
".......AAAAAAAAAA",
".......AAAAAAAAAA",
".......AAAAAeeeee",
".......aAAAAAAAAA",
".......aAAAAAAxAx",
".......aaAAAAAAAA",
"........aaaaaaaa",
"...HAAAAmmmmmmmAAAAH",
"..HAAAAAaTTTTTTaAAAAAH",
"..AAAAAAaTTyTTTaAAAAAA",
"..aAAAAAaTyyyTTaAAAAAa",
"...aaaa.ATTyTTTA.aaaa",
"...mmm..ATTTTTTA..mmm",
"...mmm..ATTTTTTA..mmm",
"...AAA..aaaaaaaa..AAA",
"........mmmmmmmm",
"........MmMmMmMm"],
    legs:[[
"........AAA..AAA",
"........AHA..AHA",
"........AAA..AAA",
"........aAa..aAa",
".......AAAA..AAAA",
".......aaaa..aaaa"],[
".......AAA....AAA",
"......AHA......AHA",
"......AAA......AAA",
".....aAa........aAa",
"....AAAA........AAAA",
"....aaaa........aaaa"]]
  },
  bomber: { // Le sapeur : casquette à lunettes, barbe rousse, bandoulière
    hand:[18,16], plume:[10,0],
    body:[
"..........bbbb",
"........bbbbbbbb",
".......bbbbbbbbbb",
".......BBBqyBqyBbbbb",
".......hzzzzzzzzz",
".......hssssesss",
".......hrrsssssssS",
".......rrrrrrrrr",
"........rrrrrrr",
"..........rrr",
"......TTTkTTTTTT",
".....TTTTTkTTTTTT",
".....TTkTTTkTTTTTT",
".....TTTkTTTkTTTcc",
".....TbbbkbbbkbbTcc",
".....TbbbbkbkbbbTzs",
".....TbbbbbkbbbbT",
"......bbbbbbbbbb",
"......bbbbb.bbbb"],
    legs:[[
".......ppp..ppp",
".......ppp..ppp",
".......nnn..nnn",
"......nnnn..nnnn"],[
"......ppp....ppp",
".....ppp......ppp",
".....nnn......nnn",
"....nnnn......nnnn"]]
  }
};
const PLUME = ["..TTT","TTTTt",".TTt.","..t.."];

/* -------- ARMES (contours manuels) -------- */
const WEAP = {
  sword:{x:4, y:13.5, px:[
"...oo...",
"..oWwo..",
"..oWwo..",
"..oWwo..",
"..oWwo..",
"..oWwo..",
"..oWwo..",
"..oWwo..",
"..oWwo..",
"..oWwo..",
".oooooo.",
"oFyyyyYo",
".oooooo.",
"..oBBo..",
"..oBBo..",
"..oyyo..",
"...oo..."]},
  spear:{x:3, y:24.5, px:[
"..oo..",
".oWwo.",
".oWwo.",
"oWWw6o",
"oWw66o",
".oW6o.",
"..oo..",
".oyYo.",
".oTto.",
"oTTtto",
".oTto.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oDDo.",
"..oo.."]},
  bow:{x:4.5, y:9, px:[
"oo.....",
"l0o....",
"l.0o...",
"l..0o..",
"l..0do.",
"l...0do",
"l...0do",
"l...0do",
"l...yyo",
"l...yyo",
"l...0do",
"l...0do",
"l...0do",
"l..0do.",
"l..0o..",
"l.0o...",
"l0o....",
"oo....."]},
  shield:{x:6, y:8, px:[
".oooooooooo.",
"oHHHHHHHHHAo",
"oHTTTTTTTTao",
"oATTTTyTTTao",
"oATTTTyTTTao",
"oATTyyyyyTao",
"oATTTTyTTTao",
"oATTTTyTTTao",
"oATuTTTTTTao",
"oAuTTTTTTtao",
"oATTTTTTTtao",
"oATTTTTTTtao",
"oaATTTTTTaao",
".oaATTTTaao.",
"..oaATTaao..",
"...oaaaao...",
"....oooo...."]},
  mace:{x:2.5, y:9.5, px:[
"o.oo.o",
".oKKo.",
"oKkkko",
"okkkxo",
".oxxo.",
"o.oo.o",
".oddo.",
".oddo.",
".oddo.",
".oddo.",
".oDDo.",
"..oo.."]},
  bomb:{x:3.5, y:4.5, px:[
"....9f.",
"...ol..",
".ooloo.",
"oKKkkko",
"oKkkkxo",
"okkkkxo",
"okkkxxo",
".ooooo."]}
};

/* -------- ICÔNES D'INTERFACE (9x9) -------- */
const ICON_PAL = {o:'#1a1020', w:'#ffffff', l:'#c8cbd8', g:'#7a7f95', d:'#4a4e62', y:'#f5c542', Y:'#b8861a', F:'#fff2a8',
  r:'#e04848', R:'#8e2430', b:'#3b7ff0', B:'#1f4aa8', n:'#8a5a2b', N:'#4a2c1a', G:'#5bbf4a', v:'#2f7a24', p:'#b46ce4'};
const ICONS = {
  coin:["..ooooo..",".oFFyyyo.","oFFyyyyYo","oFyyYyyYo","oFyyYyyYo","oyyyYyyYo","oyyyyyYYo",".oYYYYYo.","..ooooo.."],
  heart:[".oo...oo.","owro.orro","orrrorrRo","orrrrrrRo",".orrrrRo.","..orrRo..","...oRo...","....o....","........."],
  atk:["......oo.",".....owlo","....owlo.","...owlo..","o.owlo...","oyolo....",".oyo.....","onoyo....","oo.oo...."],
  range:["..ooooo..",".orwwwro.","orwrrrwro","owrwwwrwo","owrwrwrwo","owrwwwrwo","orwrrrwro",".orwwwro.","..ooooo.."],
  speed:["...oooo..","...onno..","...onno..","...onno..","...onnoo.","..onnnnno",".onnnnnno",".oNNNNNNo","..oooooo."],
  shield:["ooooooooo","owwwbbbbo","owwbbbbBo","owbbybbBo","obbyyybBo",".obbybBo.",".obbbBBo.","..obBBo..","...ooo..."],
  gear:["...ooo...",".oollloo.",".olllllo.","olllolllo","ollo.ollo","olllolllo",".olllllo.",".oollloo.","...ooo..."],
  help:[".ooooo...","owwwwwo..","owoooowo.",".o..owwo.","...owwo..","...owo...","....o....","...owo...","...ooo..."],
  back:[".........","...oo....","..owo....",".owwooooo","owwwwwwwo",".owwooooo","..owo....","...oo....","........."],
  close:["oo.....oo","owo...owo",".owo.owo.","..owowo..","...owo...","..owowo..",".owo.owo.","owo...owo","oo.....oo"],
  play:["oo.......","owoo.....","owwwoo...","owwwwwoo.","owwwwwwwo","owwwwwoo.","owwwoo...","owoo.....","oo......."],
  pause:["ooo..ooo.","owo..owo.","owo..owo.","owo..owo.","owo..owo.","owo..owo.","owo..owo.","owo..owo.","ooo..ooo."],
  ffwd:["o...o....","oo..oo...","owo.owo..","owwoowwo.","owwwowwwo","owwoowwo.","owo.owo..","oo..oo...","o...o...."],
  trash:["...ooo...","ooooooooo","olllllllo","ooooooooo",".olglglo.",".olglglo.",".olglglo.",".olglglo.",".ooooooo."],
  undo:["oo.oooo..","owowwwwo.","owwoooowo","owwwo.owo","ooooo.owo","o.....owo","owo..owwo",".owwwwwo.","..ooooo.."],
  erase:[".....ooo.","....orrro","...orrrRo","..owrrRo.",".owwwRo..","owwwwo...","owwwo....",".ooo.....","........."],
  person:["...ooo...","..owwwo..","..owwwo..","...ooo...","..ooooo..",".obbbbbo.",".obbbbbo.",".obbbbbo.",".ooooooo."],
  lock:["..ooooo..",".oo...oo.",".o.....o.","ooooooooo","oyyyyyyYo","oyyyoyyYo","oyyyoyyYo","oYYYYYYYo","ooooooooo"],
  star:["....o....","...oFo...","oooFyyooo","oFFyyyyYo",".oyyyyYo.","..oyyyYo.",".oyyoyYo.","oyyo.oYYo","ooo...ooo"],
  crown:[".........","o...o...o","oo.oyo.oo","oyoyyyoyo","oyyyyyyyo","oyyryyryo","oYYYYYYYo","ooooooooo","........."],
  dice:["ooooooooo","owwwwwwlo","owowwwwlo","owwwwwwlo","owwwowwlo","owwwwwwlo","owwwwwolo","ollllllgo","ooooooooo"],
  swords:["oo.....oo","olo...olo",".olo.olo.","..olwlo..","...owo...","..oyoyo..",".oyo.oyo.","ono...ono","oo.....oo"],
  flag:["oo.......","onooooo..","onorrrroo","onorrrrro","onorrrroo","onooooo..","ono......","ono......","ooo......"],
  up:["....o....","...oGo...","..oGGGo..",".oGGGGGo.","oooGGGooo","..oGGGo..","..oGGGo..","..ovvvo..","..ooooo.."],
  spear:["......ooo",".....owwo","....owwoo","...onoo..","..ono....",".ono.....","ono......","oo.......","........."],
  bomb:["......yo.",".....on..","..ooono..",".oddddo..","odlddddo.","odddddNo.","oddddNNo.",".odNNNo..","..oooo..."],
  sound:["....o....","...oo..o.","ooool.o.o","olllo.o.o","olllo.o.o","ooool.o.o","...oo..o.","....o....","........."],
  mute:["....o....","...oo....","ooool.o.o","olllo..o.","olllo..o.","ooool.o.o","...oo....","....o....","........."]
};

/* -------- COFFRES -------- */
const CHEST = [
"..oooooooooooo..",
".oBbbbbbbbbbbbo.",
"oBbbbbbbbbbbbbBo",
"oByyyyyyyyyyyyBo",
"oooooooyyooooooo",
"oBbbbbboyobbbbBo",
"oBbbbbbbobbbbbBo",
"oBbbbbbbbbbbbbBo",
"oByyyyyyyyyyyyBo",
".oooooooooooooo."];

/* -------- POLICE BITMAP DU TITRE -------- */
const FONT = {
  A:[".###.","#...#","#####","#...#","#...#"], C:[".####","#....","#....","#....",".####"],
  D:["####.","#...#","#...#","#...#","####."], E:["#####","#....","####.","#....","#####"],
  F:["#####","#....","####.","#....","#...."], G:[".####","#....","#..##","#...#",".####"],
  I:["#####","..#..","..#..","..#..","#####"], L:["#....","#....","#....","#....","#####"],
  N:["#...#","##..#","#.#.#","#..##","#...#"], O:[".###.","#...#","#...#","#...#",".###."],
  P:["####.","#...#","####.","#....","#...."], R:["####.","#...#","####.","#..#.","#...#"],
  S:[".####","#....",".###.","....#","####."], T:["#####","..#..","..#..","..#..","..#.."],
  V:["#...#","#...#","#...#",".#.#.","..#.."], X:["#...#",".#.#.","..#..",".#.#.","#...#"],
  U:["#...#","#...#","#...#","#...#",".###."], B:["####.","#...#","####.","#...#","####."],
  " ":[".....",".....",".....",".....","....."], "!":["..#..","..#..","..#..",".....","..#.."]
};

/* ================= MOTEUR ================= */
const sprCache = new Map();
function palFor(lvl, team){
  const p = Object.assign({}, BASE_PAL, LVL_PAL[lvl || 1], TEAM_PAL[team || 'blue']);
  if (lvl >= 5) p.e = '#7af0ff';
  return p;
}
// Construit une grille : ajoute ombrage + contour automatique
function compileGrid(rows, W, H, ox, oy){
  const g = Array.from({length:H}, () => Array(W).fill('.'));
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.' && g[oy + j] && ox + i < W) g[oy + j][ox + i] = r[i]; });
  const E = (x, y) => x < 0 || y < 0 || x >= W || y >= H || g[y][x] === '.';
  const out = g.map(r => r.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = g[y][x];
    if (c === '.') { if (!E(x - 1, y) || !E(x + 1, y) || !E(x, y - 1) || !E(x, y + 1)) out[y][x] = 'o'; continue; }
    const sh = SHADE[c]; if (!sh) continue;
    if (E(x + 1, y) || E(x, y + 1)) out[y][x] = sh[1];
    else if (E(x - 1, y) || E(x, y - 1)) out[y][x] = sh[0];
  }
  return out;
}
function paintGrid(grid, pal, flash, scale = 1){
  const h = grid.length, w = grid[0].length, c = document.createElement('canvas');
  c.width = w * scale; c.height = h * scale; const x = c.getContext('2d');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const ch = grid[j][i]; if (ch === '.' || ch === ' ') continue;
    const col = flash ? (ch === 'o' ? '#ffffff' : '#ffffff') : pal[ch]; if (!col) continue;
    x.fillStyle = col; x.fillRect(i * scale, j * scale, scale, scale);
  }
  return c;
}
const SPR_W = 26, SPR_TOP = 5;
function unitH(type){ const U = UNITS_ART[type]; return SPR_TOP + U.body.length + U.legs[0].length + 1; }
// Sprite de corps : pieds en bas au centre (x = 13)
function bodySprite(type, lvl, team, frame, flash){
  const key = `b${type}${lvl}${team}${frame}${flash ? 1 : 0}`;
  let c = sprCache.get(key); if (c) return c;
  const U = UNITS_ART[type];
  let rows = U.body.concat(U.legs[frame]).map(r => r.split(''));
  if (lvl >= 3 && U.plume) {
    // plumet ajouté au-dessus du casque
    const [px, py] = U.plume, top = SPR_TOP + py - PLUME.length;
    rows = rows.map(r => r.join(''));
    const all = Array(SPR_TOP).fill('').concat(rows);
    PLUME.forEach((pr, j) => {
      const y = top + j + 1; if (y < 0) return;
      let r = (all[y] || '').padEnd(px + pr.length, '.').split('');
      for (let i = 0; i < pr.length; i++) if (pr[i] !== '.' && r[px + i] === '.') r[px + i] = lvl >= 5 ? (pr[i] === 't' ? 'Y' : 'y') : pr[i];
      all[y] = r.join('');
    });
    const g = compileGrid(all, SPR_W, unitH(type), 1, 0);
    c = paintGrid(g, palFor(lvl, team), flash);
  } else {
    const g = compileGrid(rows.map(r => r.join('')), SPR_W, unitH(type), 1, SPR_TOP);
    c = paintGrid(g, palFor(lvl, team), flash);
  }
  sprCache.set(key, c); return c;
}
function weaponSprite(name, lvl, team, flash){
  const key = `w${name}${lvl}${team}${flash ? 1 : 0}`;
  let c = sprCache.get(key); if (c) return c;
  c = paintGrid(WEAP[name].px, palFor(lvl, team), flash); sprCache.set(key, c); return c;
}
