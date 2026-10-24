/* Légion Pixel — Pixel art d'interface : palettes, icônes, coffres et police du titre */
'use strict';
/* ================= PIXEL ART : PALETTES & ICÔNES (les soldats sont dans units.js) ================= */
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
const TEAM_PAL = {blue:{u:'#8cc0ff', T:'#3b7ff0', t:'#1f4aa8'}, red:{u:'#ff9a8a', T:'#e04646', t:'#8e2430'}};

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
  mute:["....o....","...oo....","ooool.o.o","olllo..o.","olllo..o.","ooool.o.o","...oo....","....o....","........."],
  home:["....o....","...owo...","..owwwo..",".owwwwwo.","owwwwwwwo",".owwoowo.",".owwoowo.",".owwoowo.",".ooooooo."],
  bolt:[".....ooo.","....oyyo.","...oyyo..","..oyyoooo",".oyyyyyyo","ooooyyo..","...oyo...","..oyo....","..oo....."]
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

/* ================= MOTEUR DES GRILLES DE LETTRES ================= */
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
