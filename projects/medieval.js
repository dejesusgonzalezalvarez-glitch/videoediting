// ================= MEDIEVAL CAST =================
// Flat 2D bean-head cards drawn with the Pen API from toonbase.js.
// Design space 600 x 1000, soles at y = 975 (card is 2.25 m tall).

const STEEL = "#b7bec7", STEEL_D = "#79818b", GOLD = "#d8a648", LEATH = "#6b4526";

export const MED = {
  knight: { tunic: "#2d4f8f", cape: "#8c2029", skin: SKIN, helm: true, armor: true, sword: true, shield: true },
  villA: { tunic: "#6d7f4a", skin: "#f5c9a0", hair: "#3b2a1c" },
  villB: { tunic: "#8a5d3b", skin: "#ecd0b6", hair: "#2b211c", dress: "#a8563f" },
  villC: { tunic: "#46587a", skin: "#c99067", hair: "#1e1714", hood: "#5c4a33" },
  smith: { tunic: "#3d474e", skin: "#c99067", apron: "#5a3b2a", stout: true, hair: "#241a12" },
};

/** medieval front-facing character. opts: expr, blink, look, facing, seed, L/R arm poses, tilt, headTilt, bob, step */
export const medFront = (p, key, opts = {}) => {
  const O = typeof key === "string" ? MED[key] : key;
  const {
    expr = "neutral", blink = 0, look = 0, facing = 0, seed = 3, L = "hang", R = "hang",
    tilt = 0, headTilt = 0, bob = 0, step = 0, light = rad(-120),
  } = opts;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.12 : 1.08, legsL = 1.38, sole = 975;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300;
  const legCol = mix(O.tunic, INK, 0.62), armCol = mix(O.tunic, INK, 0.5);
  p.rot = null;

  // ---- cape behind ----
  if (O.cape) {
    const cp = [[cx - 0.48 * W, chin + 0.08 * HH], [cx + 0.48 * W, chin + 0.08 * HH],
      [cx + 0.62 * W, sole - 0.55 * HH], [cx + 0.2 * W, sole - 0.45 * HH],
      [cx - 0.2 * W, sole - 0.5 * HH], [cx - 0.62 * W, sole - 0.55 * HH]];
    p.gradFill(cp, O.cape, mul(O.cape, [0.6, 0.6, 0.7]), light);
    p.inkRing(cp, ow * 0.8, thick);
  }

  // ---- legs ----
  for (const side of [-1, 1]) {
    const up = Math.max(0, Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0))) * 30 * (step ? 1 : 0));
    const hx = cx + side * 16 * u, fx = cx + side * 22 * u, fy = sole - 4 * u - up;
    p.stroke(curve([hx, hipY], [(hx + fx) / 2 + side * 2 * u, (hipY + fy) / 2], [fx, fy]), 5.8 * u, legCol);
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u + 3, INK);
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u, LEATH);
  }

  // ---- torso ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06 * (O.stout ? 1.12 : 1), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.17 : 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];

  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    switch (pose) {
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.1 * HH]], front: false, finger: true };
      case "up": return { pts: [s, [X(14), s[1] - 0.3 * HH], [X(22), s[1] - 0.75 * HH]], front: false };
      case "wave": return { pts: [s, [X(16), s[1] - 0.2 * HH], [X(30 + 10 * Math.sin(opts.wv || 0)), s[1] - 0.62 * HH]], front: false };
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.3 * HH]], front: false };
      case "belly": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.25 * T.a, torsoBot - 0.35 * HH]], front: true };
      case "temple": return { pts: [s, [X(26), s[1] + 0.05 * HH], [cx + side * (H.a + 16 * u), hc - 0.1 * HH]], front: false };
      case "lift": return { pts: [s, [X(20), s[1] - 0.25 * HH], [X(4), s[1] - 0.82 * HH]], front: false };
      case "reach": { const lf = (opts.lift || 0) * 0.62 * HH; return { pts: [s, [X(42), s[1] - 0.12 * HH - lf * 0.6], [X(82), s[1] - 0.5 * HH - lf]], front: false }; }
      case "shield": return { pts: [s, [X(4), s[1] + 0.4 * HH], [tcx + side * 0.6 * T.a, torsoBot - 0.1 * HH]], front: true };
      case "cross": return { pts: [s, [X(2), s[1] + 0.38 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "sword": return { pts: [s, [X(18), s[1] - 0.12 * HH], [X(34), s[1] - 0.42 * HH]], front: false };
      case "swordUp": return { pts: [s, [X(10), s[1] - 0.35 * HH], [X(16), s[1] - 0.8 * HH]], front: false };
      case "pray": return { pts: [s, [X(10), s[1] - 0.05 * HH], [X(20), s[1] - 0.22 * HH]], front: true };
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.04 * HH]], front: false };
    }
  };
  const arms = [arm(-1, L), arm(1, R)];
  const drawArm = (a) => {
    p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
    const [hx, hy] = a.pts[2];
    p.dot(hx, hy, 5.5 * u);
    if (a.finger) { const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy); p.stroke([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], 2.6 * u); }
  };

  // sword behind the arm
  if (O.sword && (R === "sword" || R === "swordUp")) {
    const [hx, hy] = arms[1].pts[2];
    const dx = hx - arms[1].pts[1][0], dy = hy - arms[1].pts[1][1], l = Math.hypot(dx, dy) || 1;
    const ux = dx / l, uy = dy / l, px = -uy, py = ux;
    const tipx = hx + ux * 118 * u, tipy = hy + uy * 118 * u;
    p.poly([[hx + px * 7 * u, hy + py * 7 * u], [hx - px * 7 * u, hy - py * 7 * u], [tipx - px * 4 * u, tipy - py * 4 * u], [tipx + px * 4 * u, tipy + py * 4 * u]], "#d6dbe0", 2.4 * u);
    p.poly([[hx + px * 4 * u, hy + py * 4 * u], [hx - px * 4 * u, hy - py * 4 * u], [hx - ux * 8 * u, hy - uy * 8 * u], [hx + ux * 8 * u, hy + uy * 8 * u]], GOLD, 2 * u);
  }
  for (const a of arms) if (!a.front) drawArm(a);

  // ---- torso fill ----
  const base = O.armor ? STEEL : O.tunic;
  const shad = O.armor ? STEEL_D : mul(O.tunic, [0.64, 0.66, 0.74]);
  p.gradFill(tp, base, shad, light);
  p.clip(tp, () => {
    if (O.armor) {
      // steel breastplate with a heraldic surcoat and gold cross
      p.poly([[tcx - 1.5 * T.a, chin - 0.12 * HH], [tcx + 1.5 * T.a, chin - 0.12 * HH], [tcx + 1.42 * T.a, torsoBot - 0.12 * HH], [tcx - 1.42 * T.a, torsoBot - 0.12 * HH]], O.tunic, 0);
      p.poly([[tcx - 0.28 * T.a, chin - 0.12 * HH], [tcx + 0.28 * T.a, chin - 0.12 * HH], [tcx + 0.28 * T.a, torsoBot - 0.12 * HH], [tcx - 0.28 * T.a, torsoBot - 0.12 * HH]], O.tunic, 0);
      p.poly([[tcx - 0.62 * T.a, chin + 0.06 * HH], [tcx + 0.62 * T.a, chin + 0.06 * HH], [tcx + 0.62 * T.a, chin + 0.2 * HH], [tcx - 0.62 * T.a, chin + 0.2 * HH]], GOLD, 0);
      p.poly([[tcx - 0.16 * T.a, chin + 0.06 * HH], [tcx + 0.16 * T.a, chin + 0.06 * HH], [tcx + 0.16 * T.a, torsoBot - 0.14 * HH], [tcx - 0.16 * T.a, torsoBot - 0.14 * HH]], GOLD, 0);
      p.band([[tcx - 1.42 * T.a, torsoBot - 0.22 * HH], [tcx + 1.42 * T.a, torsoBot - 0.22 * HH]], LEATH, 0.09 * HH, 1.5 * u);
      for (let i = -2; i <= 2; i++) p.dot(tcx + i * 0.32 * T.a, torsoBot - 0.22 * HH, 2.4 * u, GOLD);
    } else {
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.24 * HH], [tcx + 1.4 * T.a, torsoBot - 0.24 * HH]], LEATH, 0.055 * HH, 1.2 * u);
      if (O.apron) p.poly([[tcx - 0.5 * T.a, torsoBot - 0.3 * HH], [tcx + 0.5 * T.a, torsoBot - 0.3 * HH], [tcx + 0.58 * T.a, torsoBot + 0.25 * HH], [tcx - 0.58 * T.a, torsoBot + 0.25 * HH]], O.apron, 1.6 * u);
      p.stroke([[tcx - 0.2 * T.a, chin + 0.02 * HH], [tcx, chin + 0.16 * HH], [tcx + 0.2 * T.a, chin + 0.02 * HH]], 2 * u);
    }
  });
  p.inkRing(tp, ow, thick);
  // skirt / tunic hem
  if (!O.dress) {
    const sk = [[tcx - 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 1.0 * T.a, torsoBot + 0.3 * HH], [tcx - 1.0 * T.a, torsoBot + 0.3 * HH]];
    p.gradFill(sk, O.armor ? STEEL : O.tunic, shad, light); p.poly(sk, null, ow * 0.8);
  }
  if (O.armor) for (const s of [-1, 1]) {
    const sp = ellPts(tcx + s * 0.72 * T.a, chin + 0.1 * HH, 0.44 * T.a, 0.14 * HH, 180, 360, s * 8, 20);
    p.poly(sp, "#c5ccd3", 1.8 * u);
  }

  // ---- head ----
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt;
  p.rot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;

  if (O.hood) { // hood behind the head
    const hb = blobPts(cx, hc - 0.05 * HH, { ...H, a: H.a * 1.2, b: H.b * 1.18, asym: 0, egg: 0.05, seed: H.seed + 4 });
    p.gradFill(hb, O.hood, mul(O.hood, [0.62, 0.62, 0.72]), light);
    p.inkRing(hb, ow * 0.9, thick);
  }
  const hp = blobPts(cx, hc, H);
  if (O.hair && !O.helm && !O.hood) { const hb = blobPts(cx, hc - 0.03 * HH, { ...H, a: H.a * 1.05, b: H.b * 1.06 }); p.poly(hb, O.hair, 0); }
  p.shadedFill(hp, skin, mul(skin, [0.96, 0.86, 0.84]), light, H.a);
  p.inkRing(hp, ow, thick);

  if (O.helm) {
    const bandY = hc - H.b * 0.40;
    const bowl = ellPts(cx, bandY, H.a * 1.07, H.b * 0.70, 180, 360, 0, 48);
    p.shadedFill(bowl, STEEL, STEEL_D, light, H.a, 0.4);
    p.clip(bowl, () => p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 4 * u, "#ffffff55"));
    p.inkRing(bowl, ow * 0.9, thick);
    p.band([[cx - H.a * 1.03, bandY], [cx + H.a * 1.03, bandY]], GOLD, 7 * u, 1.8 * u, "round");
    // nose guard
    p.poly(rrect(cx - 5.5 * u, bandY - 2 * u, cx + 5.5 * u, hc + 0.34 * H.b, 3 * u), STEEL, ow * 0.55);
    for (const s of [-1, 1]) p.dot(cx + s * 0.56 * H.a, bandY, 2.2 * u, "#fff3c4");
  }
  if (O.cape && O.armor) { // gold clasp at the neck
    p.dot(cx, chin + 0.06 * HH, 7 * u, GOLD);
  }

  faceFront(p, cx, hc, W, expr, facing, look, lid, !!O.helm, skin, O.moustache, !!O.stout);
  p.rot = null;

  // ---- shield in front (held by the left hand) ----
  if (O.shield && L === "shield") {
    const sx = tcx - 0.5 * T.a, sy = torsoBot + 0.02 * HH, sw = 0.36 * W, sh = 0.78 * HH;
    const sp = [[sx - sw, sy - sh], [sx + sw, sy - sh], [sx + sw * 0.92, sy + sh * 0.1], [sx, sy + sh], [sx - sw * 0.92, sy + sh * 0.1]];
    p.gradFill(sp, "#b8322f", "#7d1d22", light);
    p.clip(sp, () => {
      p.poly([[sx - 0.18 * sw, sy - sh * 0.92], [sx + 0.18 * sw, sy - sh * 0.92], [sx + 0.18 * sw, sy + sh * 0.55], [sx - 0.18 * sw, sy + sh * 0.55]], "#efe6cf", 0);
      p.poly([[sx - 0.62 * sw, sy - sh * 0.32], [sx + 0.62 * sw, sy - sh * 0.32], [sx + 0.62 * sw, sy - sh * 0.08], [sx - 0.62 * sw, sy - sh * 0.08]], "#efe6cf", 0);
    });
    p.inkRing(sp, ow, thick);
  }
};

// ---------------- 2D effects ----------------
/** torch flame: k = 0..1 flicker phase */
export const fxFlame = (p, k) => {
  const g = p.g; g.save();
  const h = 150 + Math.sin(k * 6.283) * 18;
  g.globalAlpha = 0.95;
  g.fillStyle = "#e8632a";
  g.beginPath(); g.moveTo(300, 620 - h); g.quadraticCurveTo(360, 520 - h * 0.4, 322, 620); g.quadraticCurveTo(300, 640, 278, 620); g.quadraticCurveTo(240, 520 - h * 0.4, 300, 620 - h); g.fill();
  g.fillStyle = "#f6c04a";
  g.beginPath(); g.moveTo(300, 600 - h * 0.6); g.quadraticCurveTo(330, 530 - h * 0.2, 310, 600); g.quadraticCurveTo(300, 615, 290, 600); g.quadraticCurveTo(270, 530 - h * 0.2, 300, 600 - h * 0.6); g.fill();
  g.fillStyle = "#fff3c4";
  g.beginPath(); g.ellipse(300, 585 - h * 0.25, 14, 26, 0, 0, 7); g.fill();
  g.restore();
};
/** rising ember */
export const fxEmber = (p, k) => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - k);
  g.fillStyle = k < 0.5 ? "#ffc35a" : "#ff8a3a";
  g.beginPath(); g.arc(300, 520 - k * 320, 9 + k * 5, 0, 7); g.fill();
  g.restore();
};
/** chimney smoke puff */
export const fxSmoke = (p, k) => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 0.55 - k * 0.5);
  g.fillStyle = "#c9c2b6";
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(300 + (i - 1.5) * 34 * k, 520 - k * 180, 60 + k * 90, 44 + k * 70, 0, 0, 7); g.fill(); }
  g.restore();
};
/** bell glow ring (reveal) */
export const fxGlow = (p, k) => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 0.8 - k * 0.8);
  g.strokeStyle = "#ffe9a8"; g.lineWidth = 14;
  g.beginPath(); g.arc(300, 500, 120 + k * 190, 0, 7); g.stroke();
  g.restore();
};
/** stone dust mote drifting */
export const fxMote = (p, col) => { p.poly([[300, 380], [420, 470], [300, 620], [180, 470]], col, 12); };
