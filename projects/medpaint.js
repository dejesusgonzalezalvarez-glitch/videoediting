// Medieval painted textures (canvas2D, deterministic). Same flat-with-dark-seams style as paint.js.
import { tex, rng } from './paint.js';

const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;

/** heraldic banner: deep blue field, gold cross, red border, fleur-de-lis corners */
export function heraldicBanner(field = '#2d4f8f', border = '#8c2029') {
  const [c, g] = cv(256, 512), r = rng(19);
  g.fillStyle = field; g.fillRect(0, 0, 256, 512);
  g.fillStyle = border; g.fillRect(0, 0, 256, 26); g.fillRect(0, 486, 256, 26); g.fillRect(0, 0, 26, 512); g.fillRect(230, 0, 26, 512);
  g.fillStyle = "#d8a648";
  g.fillRect(108, 40, 40, 432); g.fillRect(36, 180, 184, 38);
  // fleur-de-lis in each quarter
  const lis = (x, y) => {
    g.save(); g.translate(x, y); g.scale(0.5, 0.5);
    g.beginPath(); g.moveTo(0, -60); g.quadraticCurveTo(26, -18, 16, 22); g.lineTo(-16, 22); g.quadraticCurveTo(-26, -18, 0, -60); g.fill();
    g.beginPath(); g.ellipse(-34, -6, 22, 11, -0.5, 0, 7); g.fill();
    g.beginPath(); g.ellipse(34, -6, 22, 11, 0.5, 0, 7); g.fill();
    g.fillRect(-40, 22, 80, 12); g.restore();
  };
  lis(64, 96); lis(192, 96); lis(64, 320); lis(192, 320);
  // cloth weave
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.06})`; g.fillRect(r() * 256, r() * 512, 2 + r() * 4, 1 + r() * 2); }
  // frayed bottom edge
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(i * 26, 512); g.lineTo(i * 26 + 13, 470 + r() * 18); g.lineTo(i * 26 + 26, 512); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  return c;
}

/** thatched roof */
export function thatch(seed = 21) {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = "#9a7a42"; g.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 9; row++) for (let col = -1; col < 9; col++) {
    const x = col * 30 + (row % 2) * 15, y = row * 29;
    g.fillStyle = hsl(38 + r() * 8, 40, 42 + r() * 14);
    g.beginPath(); g.roundRect(x + 2, y + 2, 27, 26, 5); g.fill();
    g.fillStyle = 'rgba(255,225,170,.22)'; g.fillRect(x + 5, y + 4, 18, 4);
    g.strokeStyle = 'rgba(70,50,22,.45)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + 3, y + 27); g.lineTo(x + 27, y + 27); g.stroke();
  }
  return c;
}

/** cobblestone plaza */
export function cobbles(seed = 22) {
  const [c, g] = cv(512, 512), r = rng(seed);
  g.fillStyle = "#4d4740"; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 11; row++) for (let col = -1; col < 11; col++) {
    const x = col * 50 + (row % 2) * 25 + r() * 4, y = row * 48 + r() * 4;
    const w = 42 + r() * 8, h = 38 + r() * 8;
    const L = 52 + r() * 16;
    g.fillStyle = hsl(34 + r() * 10, 8 + r() * 8, L);
    g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, r() * 0.4, 0, 7); g.fill();
    g.fillStyle = `rgba(255,240,210,${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(x + w / 2, y + h / 2 - 3, w / 2.4, h / 3, 0, 0, 7); g.fill();
  }
  return c;
}

/** weathered medieval plaster with timber beams */
export function timberWall(seed = 23) {
  const [c, g] = cv(256, 256), r = rng(seed);
  g.fillStyle = "#e4dcc6"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { g.fillStyle = hsl(36, 18, 72 + r() * 12, 0.5); g.beginPath(); g.ellipse(r() * 256, r() * 256, 14 + r() * 40, 8 + r() * 20, r() * 3, 0, 7); g.fill(); }
  g.fillStyle = "#5a3f28";
  g.fillRect(0, 0, 256, 18); g.fillRect(0, 238, 256, 18); g.fillRect(0, 0, 18, 256); g.fillRect(238, 0, 18, 256);
  g.fillRect(118, 0, 20, 256);
  g.strokeStyle = "#3c2a1a"; g.lineWidth = 3;
  g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.stroke();
  return c;
}

export const texOf = (c, rx = 1, ry = 1) => tex(c, rx, ry);
