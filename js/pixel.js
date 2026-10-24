/* Légion Pixel — Moteur de pixel art : rampes de couleurs, primitives ombrées, contours sélectifs */
'use strict';
const HR = 2; // les soldats sont dessinés en double résolution (2 pixels de sprite par pixel du monde)
const OUTL = '#140c1c';
const LIGHT = (() => { const v = [-.5, -.62, .68], n = Math.hypot(...v); return v.map(a => a / n); })();

/* ---------- COULEURS : rampes à 5 tons avec décalage de teinte ---------- */
// 0 reflet · 1 clair · 2 base · 3 ombre · 4 ombre profonde (les reflets tirent vers le jaune, les ombres vers le violet)
function hexRgb(h){ return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function rgbHsl([r, g, b]){
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = (mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
  }
  return [h, s, l];
}
function hslHex(h, s, l){
  const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}
const toward = (h, t, a) => { const d = ((t - h + 540) % 360) - 180; return (h + Math.sign(d) * Math.min(Math.abs(d), a) + 360) % 360; };
const RAMP = [[.17, 16, -.04], [.08, 7, 0], [0, 0, 0], [-.14, -9, -.02], [-.27, -18, -.06]];
const rampCache = {};
function ramp(hex){
  if (Array.isArray(hex)) return hex;
  if (rampCache[hex]) return rampCache[hex];
  const [h, s, l] = rgbHsl(hexRgb(hex)), grey = s < .07;
  return rampCache[hex] = RAMP.map(([dl, dh, ds], i) => {
    if (i === 2) return hex;
    const hh = grey ? (dh > 0 ? 45 : 255) : dh > 0 ? toward(h, 50, dh) : toward(h, 255, -dh);
    const ss = grey ? Math.abs(dh) * .006 : Math.min(1, Math.max(0, s + ds));
    return hslHex(hh, ss, Math.min(.97, Math.max(.05, l + dl)));
  });
}
// rampe lumineuse (magie, lasers) : pas d'ombre, du blanc au cœur
const glowRamp = (core, mid, edge) => [core, core, mid, edge, edge];

/* ---------- TOILE DE SPRITE ---------- */
const litLv = (nx, ny, nz) => { const d = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]; return d > .86 ? 0 : d > .6 ? 1 : d > .02 ? 2 : 3; };
class Spr {
  constructor(w, h){ this.w = w; this.h = h; this.m = new Array(w * h).fill(null); this.l = new Uint8Array(w * h); this.p = new Uint16Array(w * h); this.k = 0; }
  get(x, y){ return x < 0 || y < 0 || x >= this.w || y >= this.h ? null : this.m[y * this.w + x]; }
  // remplit les pixels où f(cx, cy) renvoie un niveau (0..4) ; o.d assombrit, o.ol trace un liseré interne
  fill(x0, y0, x1, y1, mat, f, o = {}){
    const id = ++this.k, W = this.w, d = o.d || 0, pts = [];
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(W - 1, Math.ceil(x1)); y1 = Math.min(this.h - 1, Math.ceil(y1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const v = f(x + .5, y + .5); if (v == null) continue;
      const i = y * W + x; this.m[i] = mat; this.l[i] = Math.max(0, Math.min(4, v + d)); this.p[i] = id; pts.push(i);
    }
    if (o.ol !== false && o.lv == null) for (const i of pts) {
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy, lv] of [[1, 0, 4], [0, 1, 4], [-1, 0, 3]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= this.h) continue;
        const j = ny * W + nx;
        if (this.m[j] && this.p[j] !== id && this.m[j] !== mat) { this.l[i] = Math.max(this.l[i], lv); break; }
      }
    }
    return this;
  }
  ell(cx, cy, rx, ry, mat, o = {}){
    return this.fill(cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1, mat, (x, y) => {
      const nx = (x - cx) / rx, ny = (y - cy) / ry, r2 = nx * nx + ny * ny;
      if (r2 > 1 || (o.if && !o.if(x, y))) return null; return o.lv != null ? o.lv : litLv(nx, ny, Math.sqrt(1 - r2));
    }, o);
  }
  // boîte ombrée comme un cylindre vertical ; o.cut arrondit les coins
  box(x, y, w, h, mat, o = {}){
    const c = o.cut || 0;
    return this.fill(x, y, x + w - 1, y + h - 1, mat, (px, py) => {
      const ix = px - x - .5, iy = py - y - .5;
      if (c && (ix < c || ix > w - 1 - c) && (iy < c || iy > h - 1 - c) && Math.min(ix, w - 1 - ix) + Math.min(iy, h - 1 - iy) < c) return null;
      if (o.lv != null) return o.lv;
      const nx = Math.max(-.98, Math.min(.98, (px - x - w / 2) / (w / 2))), ny = o.ny != null ? o.ny : (iy === 0 ? -.6 : 0);
      return litLv(nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)));
    }, o);
  }
  // membre en forme de gélule, ombré comme un tube
  limb(x0, y0, x1, y1, r, mat, o = {}){
    const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
    return this.fill(Math.min(x0, x1) - r - 1, Math.min(y0, y1) - r - 1, Math.max(x0, x1) + r + 1, Math.max(y0, y1) + r + 1, mat, (x, y) => {
      const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / L2)), qx = x - x0 - t * dx, qy = y - y0 - t * dy, d2 = qx * qx + qy * qy;
      if (d2 > r * r) return null; if (o.lv != null) return o.lv;
      const nx = qx / r, ny = qy / r; return litLv(nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)));
    }, o);
  }
  // polygone ; ombrage cylindrique sur sa largeur (ou niveau fixe o.lv)
  poly(pts, mat, o = {}){
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), cw = (x1 - x0) / 2 || 1;
    return this.fill(x0 - 1, y0 - 1, x1 + 1, y1 + 1, mat, (x, y) => {
      let ins = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
      }
      if (!ins) return null; if (o.lv != null) return o.lv;
      const nx = Math.max(-.98, Math.min(.98, (x - x0 - cw) / cw)), ny = o.ny || 0;
      return litLv(nx, ny, Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)));
    }, o);
  }
  px(x, y, mat, lv = 2){
    x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    const i = y * this.w + x; this.m[i] = mat; this.l[i] = lv; this.p[i] = ++this.k; return this;
  }
  line(x0, y0, x1, y1, mat, lv = 2){
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (let k = 0; k < 200; k++) { this.px(x0, y0, mat, lv); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
    return this;
  }
  // motif dessiné à la main : chaque lettre renvoie vers [matière, niveau]
  stamp(x, y, rows, map){
    rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const k = map[r[i]]; if (k) this.px(x + i, y + j, k[0], k[1]); } });
    return this;
  }
  // assombrit les pixels déjà posés dans une zone (ombre portée)
  shade(f, by = 1){
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const i = y * this.w + x; if (this.m[i] && f(x + .5, y + .5)) this.l[i] = Math.min(4, this.l[i] + by); }
    return this;
  }
  // motif sur une matière déjà posée (cotte de mailles, écailles, bois…)
  tex(x0, y0, x1, y1, mat, f, by = 1){
    for (let y = Math.max(0, y0 | 0); y <= Math.min(this.h - 1, y1); y++) for (let x = Math.max(0, x0 | 0); x <= Math.min(this.w - 1, x1); x++) {
      const i = y * this.w + x; if (this.m[i] === mat && f(x, y)) this.l[i] = Math.max(0, Math.min(4, this.l[i] + by));
    }
    return this;
  }
  erase(f){ for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (f(x + .5, y + .5)) this.m[y * this.w + x] = null; return this; }
}

/* ---------- RENDU : pixels + contour sélectif ---------- */
const rgbCache = {};
const rgbOf = h => rgbCache[h] || (rgbCache[h] = hexRgb(h));
// contour coloré du côté éclairé (haut/gauche), presque noir du côté ombré
function rasterize(S, pal, flash){
  const { w, h } = S, d = new Uint8ClampedArray(w * h * 4), M = S.m;
  const at = (x, y) => x < 0 || y < 0 || x >= w || y >= h ? null : M[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, m = M[i]; let col = null;
    if (m) col = flash ? '#ffffff' : (pal[m] || ['#ff00ff', '#ff00ff', '#ff00ff', '#ff00ff', '#ff00ff'])[S.l[i]];
    else {
      const r = at(x + 1, y), b = at(x, y + 1), l = at(x - 1, y), u = at(x, y - 1);
      if (r || b) col = flash ? '#ffffff' : pal.noOutline && pal.noOutline[r || b] ? null : (pal[r || b] || [OUTL])[4];
      else if (l || u) col = flash ? '#ffffff' : OUTL;
    }
    if (!col) continue;
    const [R, G, B] = rgbOf(col), o = i * 4; d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = 255;
  }
  return { w, h, data: d };
}
function rasterCanvas(img){
  const c = document.createElement('canvas'); c.width = img.w; c.height = img.h;
  const x = c.getContext('2d'), id = x.createImageData(img.w, img.h); id.data.set(img.data); x.putImageData(id, 0, 0);
  return c;
}
