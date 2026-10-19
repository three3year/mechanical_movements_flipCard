// 第十六章「雜項裝置」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, turned, inSolid, polyGap, pieceBox, plateLayers, guidedBetween, assertOnePiece, assertThrottle, assertShaftInBearings } from "./helpers.js";
import { deg, quatMul, quatRotate, partPoint, rotateAbout, add, sub, scale, cross, dot, dist, len, norm, lerp3, rot2, polar, X, Y, Z, TAU } from "../models/kit.js";
import { rackShape } from "../models/shapes.js";
import { pathLength } from "../models/flow.js";
import { lineAngle } from "../models/ruler-lines.js";
import * as cramp from "../models/cramp-drill.js";

import * as m350 from "../models/fig350.js";
import * as m351 from "../models/fig351.js";
import * as m352 from "../models/fig352.js";
import * as m353 from "../models/fig353.js";
import * as m354 from "../models/fig354.js";
import * as m355 from "../models/fig355.js";
import * as m356 from "../models/fig356.js";
import * as m357 from "../models/fig357.js";
import * as m358 from "../models/fig358.js";
import * as m359 from "../models/fig359.js";
import * as m360 from "../models/fig360.js";
import * as m361 from "../models/fig361.js";
import * as m362 from "../models/fig362.js";
import * as m363 from "../models/fig363.js";
import * as m364 from "../models/fig364.js";
import * as m365 from "../models/fig365.js";
import * as m366 from "../models/fig366.js";
import * as m367 from "../models/fig367.js";
import * as m368 from "../models/fig368.js";
import * as m369 from "../models/fig369.js";
import * as m370 from "../models/fig370.js";
import * as m371 from "../models/fig371.js";
import * as m372 from "../models/fig372.js";
import * as m373 from "../models/fig373.js";
import * as m374 from "../models/fig374.js";
import * as m375 from "../models/fig375.js";
import * as m376 from "../models/fig376.js";
import * as m377 from "../models/fig377.js";
import * as m378 from "../models/fig378.js";
import * as m379 from "../models/fig379.js";
import * as m380 from "../models/fig380.js";
import * as m381 from "../models/fig381.js";
import * as m382 from "../models/fig382.js";
import * as m383 from "../models/fig383.js";
import * as m384 from "../models/fig384.js";
import * as m385 from "../models/fig385.js";
import * as m386 from "../models/fig386.js";
import * as m387 from "../models/fig387.js";
import * as m388 from "../models/fig388.js";
import * as m389 from "../models/fig389.js";
import * as m390 from "../models/fig390.js";
import * as m391 from "../models/fig391.js";
import * as m392 from "../models/fig392.js";
import * as m393 from "../models/fig393.js";
import * as m394 from "../models/fig394.js";
import * as m395 from "../models/fig395.js";
import * as m396 from "../models/fig396.js";
import * as m397 from "../models/fig397.js";
import * as m398 from "../models/fig398.js";
import * as m399 from "../models/fig399.js";
import * as m400 from "../models/fig400.js";
import * as m401 from "../models/fig401.js";
import * as m402 from "../models/fig402.js";
import { penetrationDepth, polygonsOverlap, pointInPolygon, circlePolygon, edgeDistance, placeOutline } from "../models/contact.js";

/**
 * 螺紋的物理定義(viewer/parts.js 的 worm:hand +1 是右旋——螺紋沿局部 +z 往前時繞 +z 正轉):螺桿在固定的螺孔裡
 * 繞自己的 +z 轉 dθ(右手定則),就沿 +z 前進 hand · 螺距 · dθ / 2π;左旋(hand −1)反過來。螺帽在固定的螺桿上
 * 繞螺紋的 +z 轉 dθ 也一樣(兩者相對的螺旋運動)。
 */
const screwLead = (worm, turn) => ((worm.hand ?? 1) * worm.pitch * turn) / TAU;
/** 群組零件 group 轉 dAngle(繞 group.axis)時,它的螺紋塊 worm(局部軸 worm.axis,省略為 z)在固定的螺孔裡往世界的哪裡前進 */
const screwTravel = (group, worm, dAngle) => {
  const w = partPoint([0, 0, 0], group.axis, 0, worm.axis ?? Z); // 螺紋的 +z 在世界裡的方向
  return scale(w, screwLead(worm, dAngle * dot(w, norm(group.axis))));
};

test("第 350 種:上溝槽的銷靜止、下溝槽的銷沿水平線移動,槓桿把橫移運動傳給導件 a、a 內的桿", () => {
  const xs = sweep(m350.RANGE[1], 20, m350.RANGE[0]).map((x) => m350.traverse(x).rod);
  assert.ok(xs.every((x, i) => i === 0 || x > xs[i - 1]), "下銷往右,桿也往右");
  assert.ok(Math.max(...xs) - Math.min(...xs) > 1, "桿橫移");
});

test("第 351 種:搗錘:缺齒小齒輪把桿抬起,直到齒脫離齒條,讓桿落下", () => {
  const thetas = sweep(-4 * Math.PI, 1440);
  const stamps = thetas.map((t) => m351.stamp(t));
  let drops = 0;
  let longest = 0;
  let run = 0;
  for (let i = 1; i < stamps.length; i++) {
    const d = stamps[i].lift - stamps[i - 1].lift;
    if (stamps[i].engaged) assert.ok(d >= -1e-9, "齒咬著齒條時桿只往上");
    if (d < -1e-9) {
      if (run === 0) drops++;
      run++;
      longest = Math.max(longest, run);
    } else run = 0;
  }
  assert.equal(drops, 2, "每轉一圈落下一次");
  assert.ok(longest >= 20, "落下是一段過程(佔小齒輪好幾度),不是瞬移");
  close(Math.max(...stamps.map((s) => s.lift)), m351.TOP, "抬起的高度 = 齒托著齒條滾過的節圓弧長", 0.01);
  assert.ok(m351.TOP > m351.geometry.LEN * m351.geometry.R, "最後一齒過了接觸點還托著桿往上,直到齒尖退出齒條");
  // 齒尖退出齒條的齒頂線才放手:齒頂半徑 cos(EXIT) = 齒條齒頂線離軸心的距離
  const { R } = m351.geometry;
  const m = (2 * R) / 14;
  close((R + m) * Math.cos(m351.EXIT), R - m, "放手時齒尖正好在齒條的齒頂線上");
});

test("第 352 種:中式絞盤的另一種配置:轉一圈,重物上升兩段圓周差的一半", () => {
  const [r1, r2] = m352.radii;
  close(m352.pulleyY(2 * Math.PI) - m352.pulleyY(0), Math.PI * (r1 - r2), "每圈上升 π(R₁ − R₂)");
  // 繩不打滑:左導輪的表面速度是大段捲進的速度、右導輪是小段放出的速度(繩心繞鼓的半徑 × ω),
  // 吊重滑輪是兩者的平均(一邊升一邊轉)
  const [a, b] = [m352.sheaves(1), m352.sheaves(2)];
  const [w1, w2] = m352.windRadii;
  close((b.left - a.left) * part(m352.default, "guideL").radius, w1, "左導輪的表面速度 = 大段捲進的速度", 1e-9);
  close((b.right - a.right) * part(m352.default, "guideR").radius, w2, "右導輪的表面速度 = 小段放出的速度", 1e-9);
  close(Math.abs(b.pulley - a.pulley) * part(m352.default, "pulley").radius, (w1 + w2) / 2, "吊重滑輪的表面速度 = 兩者的平均", 1e-9);
});

test("第 353 種:跳動錘的變形:推板每經過一次把錘頭抬起,滑脫後落下", () => {
  const hs = sweep(2 * Math.PI, 360).map(m353.hammer);
  let drops = 0;
  for (let i = 1; i < hs.length; i++) if (hs[i - 1] > 0.1 && hs[i] < hs[i - 1] - 0.02) drops++;
  assert.ok(Math.max(...hs) > 0.2, "錘頭被抬起");
  assert.ok(drops >= 6, "推板輪轉一圈,錘子落下六次");
  // 原文:「錘柄為第一類槓桿」——推板把尾端往下壓才抬得起錘頭,尾端在輪的左側,所以輪逆時針轉;滑脫後錘頭落回砧上
  assert.ok(m353.default.driver.speed > 0, "推板輪逆時針轉");
  assert.ok(Math.min(...hs) < 0.01, "推板滑脫後錘頭落回砧上");
});

test("第 354 種:十字頭內的無端溝槽讓十字頭以均勻的速度往復", () => {
  const ys = sweep(2 * Math.PI, 360).map(m354.crosshead);
  const v = ys.slice(1).map((y, i) => Math.abs(y - ys[i]));
  const moving = v.filter((d) => d > 0);
  assert.ok(Math.max(...moving) - Math.min(...moving) < 1e-6, "速度大小處處相同(勻速)");
  close(Math.max(...ys) - Math.min(...ys), 3.2, "行程 = 曲柄直徑", 1e-9);
});

// ── 第 350–354 種(model-audit-fixes-3 票 26) ──

/** 板件零件在姿勢下:世界座標的點換到板的局部座標(板繞 z 轉) */
const toLocal = (pose, [x, y]) => rot2([x - pose.position[0], y - pose.position[1]], -(pose.angle ?? 0));
/** 圓(圓心 c、半徑 r)整個在多邊形 hole 裡(孔和銷同徑時,孔的多邊形邊在圓內一點點,留 0.002) */
const circleInside = (c, r, hole) => circlePolygon(c, r - 0.002, 24).every((q) => pointInPolygon(q, hole));
/** 零件裡沿 z 的圓柱(銷、軸;含零件本體是圓柱的),換成世界座標:{ c: [x, y], r, z0, z1 } */
const zPins = (p, origin = [0, 0, 0]) =>
  [...(p.kind === "cylinder" && !p.axis ? [{ ...p, at: [0, 0, 0] }] : []), ...(p.pieces ?? [])]
    .filter((q) => q.kind === "cylinder" && !q.axis)
    .map((q) => {
      const at = (q.at ?? [0, 0, 0]).map((v, k) => v + origin[k]);
      return { c: [at[0], at[1]], r: q.radius, z0: at[2] - q.length / 2, z1: at[2] + q.length / 2 };
    });

test("第 350 種:槓桿中段的轂鉸在桿上,上下兩道長孔各套著一個銷(原圖與 507movements 的動畫)", () => {
  const def = m350.default;
  const lever = part(def, "lever");
  const holes = lever.shape.holes;
  const t = lever.thickness / 2;
  for (const x of sweep(def.driver.range[1], 40, def.driver.range[0])) {
    const pose = def.pose(x).parts;
    const L = pose.lever;
    const [z0, z1] = [L.position[2] - t, L.position[2] + t];
    const through = (pins) => pins.filter((p) => p.z0 <= z0 + 1e-9 && p.z1 >= z1 - 1e-9);
    // 上溝槽裡靜止的銷(機架上)、下溝槽裡的動銷(主動件)、桿上的樞銷(轂)
    const fixed = through(zPins(part(def, "frame")));
    const low = through(zPins(part(def, "pinLow"), pose.pinLow.position));
    const pivot = through(zPins(part(def, "rod"), pose.rod.position));
    assert.equal(fixed.length, 1, "上溝槽裡有一根固定在機架上的銷");
    assert.equal(low.length, 1, "下溝槽裡有一根動銷");
    assert.equal(pivot.length, 1, "桿上有一根穿過槓桿的樞銷");
    const where = (pin) => {
      const c = toLocal(L, pin.c);
      return { c, hole: holes.findIndex((h) => circleInside(c, pin.r, h)) };
    };
    const [u, d, h] = [where(fixed[0]), where(low[0]), where(pivot[0])];
    assert.ok(u.hole >= 0 && d.hole >= 0 && h.hole >= 0, `x ${x.toFixed(2)}:三根銷都在槓桿的孔裡(上 ${u.hole}、下 ${d.hole}、轂 ${h.hole})`);
    assert.equal(new Set([u.hole, d.hole, h.hole]).size, 3, "三根銷各在自己的孔裡");
    close(Math.hypot(...h.c), 0, "樞銷在槓桿的轂上,不沿槓桿滑", 1e-9);
    assert.ok(u.c[0] * d.c[0] < 0, "轂在兩道長孔之間(槓桿中段)");
    assert.ok(Math.abs(u.c[1]) < 1e-9 && Math.abs(d.c[1]) < 1e-9, "兩個銷都在長孔的中心線上");
  }
});

test("第 350 種:槓桿的擺角照原圖(左右各 36° 以上),兩個銷都沿長孔滑,桿全程留在導件 a、a 裡", () => {
  const def = m350.default;
  const lever = part(def, "lever");
  const [a, b] = def.driver.range;
  const topPin = zPins(part(def, "frame")).find((q) => pointInPolygon(toLocal(def.pose(0).parts.lever, q.c), lever.shape.outline)).c;
  const tilt = (x) => {
    const low = def.pose(x).parts.pinLow.position;
    return Math.atan2(low[0] - topPin[0], topPin[1] - low[1]); // 從鉛直往右為正
  };
  const [left, right] = [(-tilt(a) * 180) / Math.PI, (tilt(b) * 180) / Math.PI];
  assert.ok(left >= 36 && right >= 36, `擺角左 ${left.toFixed(1)}°、右 ${right.toFixed(1)}°(原圖左 46°、右 36°,動畫 ±45°)`);
  // 兩個銷在長孔裡滑:槓桿局部座標上的位置在行程裡有變
  const along = (x, pin) => toLocal(def.pose(x).parts.lever, pin)[0];
  assert.ok(Math.abs(along(a, topPin) - along(0, topPin)) > 0.15, "上面的銷沿長孔滑");
  const lowAt = (x) => def.pose(x).parts.pinLow.position;
  assert.ok(Math.abs(along(a, lowAt(a)) - along(0, lowAt(0))) > 0.3, "下面的銷沿長孔滑");
  // 桿全程穿過兩個導件
  const rod = part(def, "rod").pieces.find((q) => q.kind === "cylinder" && q.axis?.[0] === 1);
  const guides = ["labelA1", "labelA2"].map((id) => {
    const c = part(def, id).center;
    const box = part(def, "frame").pieces.find((q) => q.kind === "box" && Math.abs(q.at[0] - c[0]) < 1e-9 && Math.abs(q.at[1] - c[1]) < 1e-9);
    return [box.at[0] - box.size[0] / 2, box.at[0] + box.size[0] / 2];
  });
  for (const x of sweep(b, 40, a)) {
    const cx = def.pose(x).parts.rod.position[0] + (rod.at?.[0] ?? 0);
    for (const [g0, g1] of guides) assert.ok(cx - rod.length / 2 <= g0 && cx + rod.length / 2 >= g1, `x ${x.toFixed(2)}:桿穿過導件 ${g0.toFixed(2)}..${g1.toFixed(2)}`);
  }
});

test("第 351 種:導座在整個行程都包住桿身的左、前、後三面(右邊讓齒條通過)", () => {
  const def = m351.default;
  const body = part(def, "stamp").pieces.reduce((a, q) => (q.kind === "box" && q.size[1] > (a?.size[1] ?? 0) ? q : a), null);
  const boxes = part(def, "guides").pieces.filter((q) => q.kind === "box").map((q) => pieceBox(q, part(def, "guides").center ?? [0, 0, 0]));
  const overlap = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0);
  const names = { left: "左", front: "前", back: "後" };
  for (const th of sweep(-2 * Math.PI, 96)) {
    const { lo, hi } = pieceBox(body, def.pose(th).parts.stamp.position);
    const wraps = (face) =>
      boxes.some((g) => {
        const ys = overlap(lo[1], hi[1], g.lo[1], g.hi[1]) > 0.3;
        if (face === "left") return Math.abs(g.hi[0] - lo[0]) < 0.005 && ys && g.lo[2] <= lo[2] + 1e-9 && g.hi[2] >= hi[2] - 1e-9;
        const xs = g.lo[0] <= lo[0] + 1e-9 && g.hi[0] >= hi[0] - 0.05;
        if (face === "front") return Math.abs(g.lo[2] - hi[2]) < 0.005 && ys && xs;
        return Math.abs(g.hi[2] - lo[2]) < 0.005 && ys && xs;
      });
    for (const face of Object.keys(names)) assert.ok(wraps(face), `轉角 ${th.toFixed(2)}:導座貼著桿身的${names[face]}面`);
  }
});

test("第 351 種:垂直撞擊式落下——搗錘落回停點時,衝頭底面正好落在臼裡的砧面上", () => {
  const def = m351.default;
  const head = part(def, "stamp").pieces.find((q) => q.kind === "lathe");
  const ths = sweep(-2 * Math.PI, 720);
  const low = Math.min(...ths.map((v) => m351.stamp(v).lift));
  const rest = ths.find((th) => !m351.stamp(th).engaged && m351.stamp(th).lift === low);
  const pos = def.pose(rest).parts.stamp.position;
  const bottom = pos[1] + Math.min(...head.profile.map(([, y]) => y));
  const x = pos[0] + head.at[0];
  const posed = new Set(Object.keys(def.pose(0).parts));
  const under = def.parts
    .filter((p) => !posed.has(p.id) && p.pieces)
    .flatMap((p) => p.pieces.filter((q) => q.kind === "box").map((q) => pieceBox(q, p.center ?? [0, 0, 0])))
    .filter((q) => q.lo[0] <= x && x <= q.hi[0] && q.lo[2] <= 0 && 0 <= q.hi[2] && q.hi[1] <= bottom + 1e-6);
  assert.ok(under.length, "衝頭下方有砧(臼底)");
  close(Math.max(...under.map((q) => q.hi[1])), bottom, "衝頭落在砧面上", 0.005);
});

/** 第 352 種的繩:各點在不在鼓上(哪一段)、繞軸的角;兩段上各捲著幾圈;繩長 */
function ropeOnDrum352(def, theta) {
  const drum = part(def, "drum");
  const c = drum.center;
  const segs = drum.pieces.filter((q) => q.kind === "cylinder" && q.radius > 0.2).map((q) => ({ r: q.radius, x0: c[0] + q.at[2] - q.length / 2, x1: c[0] + q.at[2] + q.length / 2 }));
  const pts = def.pose(theta).paths.rope.points;
  const info = pts.map((p) => {
    const [y, z] = [p[1] - c[1], p[2] - c[2]];
    const r = Math.hypot(y, z);
    const seg = segs.findIndex((s) => p[0] >= s.x0 - 1e-9 && p[0] <= s.x1 + 1e-9 && r >= s.r - 1e-9 && r <= s.r + 0.06);
    return { p, a: Math.atan2(z, y), seg };
  });
  const turns = segs.map((_, k) => {
    let sum = 0;
    for (let i = 1; i < info.length; i++) if (info[i].seg === k && info[i - 1].seg === k) sum += Math.atan2(Math.sin(info[i].a - info[i - 1].a), Math.cos(info[i].a - info[i - 1].a));
    return Math.abs(sum) / (2 * Math.PI);
  });
  const length = pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]), 0);
  return { info, turns, length, segs };
}

test("第 352 種:繩照第 129 種捲在鼓上——繩長不變、大段捲進一圈小段就放出一圈、繩頭跟著鼓轉、繩從鼓的切線離開", () => {
  const def = m352.default;
  const [a, b] = def.driver.range;
  const c = part(def, "drum").center;
  const first = ropeOnDrum352(def, a);
  assert.equal(first.segs.length, 2, "鼓分大小兩段");
  const big = first.segs[0].r > first.segs[1].r ? 0 : 1;
  for (const th of sweep(b, 24, a)) {
    const now = ropeOnDrum352(def, th);
    close(now.length, first.length, `轉角 ${th.toFixed(2)}:繩長不變`, 0.01);
    close(now.turns[big] - first.turns[big], (th - a) / (2 * Math.PI), "大段每轉一圈多捲一圈", 0.02);
    close(now.turns[1 - big] - first.turns[1 - big], -(th - a) / (2 * Math.PI), "小段每轉一圈放出一圈", 0.02);
    assert.ok(now.turns.every((n) => n >= 0.9), "兩段上始終捲著繩");
    // 繩的兩頭固定在鼓上:轉回鼓的局部座標後位置不變
    for (const [p, p0] of [[now.info[0].p, first.info[0].p], [now.info.at(-1).p, first.info.at(-1).p]]) {
      const back = rot2([p[1] - c[1], p[2] - c[2]], -(th - a));
      close(Math.hypot(back[0] - (p0[1] - c[1]), back[1] - (p0[2] - c[2])), 0, "繩頭跟著鼓轉", 1e-6);
      close(p[0], p0[0], "繩頭不沿軸移動", 1e-6);
    }
    // 繩離開鼓的那一點:往外的一段和半徑垂直(切線離開,不是從鼓頂沿半徑離開)
    let leaves = 0;
    for (let i = 0; i < now.info.length - 1; i++) {
      const [u, v] = [now.info[i], now.info[i + 1]];
      if (u.seg >= 0 === v.seg >= 0) continue;
      leaves++;
      const [on, off] = u.seg >= 0 ? [u, v] : [v, u];
      const d = [off.p[1] - on.p[1], off.p[2] - on.p[2]];
      const radial = [on.p[1] - c[1], on.p[2] - c[2]];
      const cos = (d[0] * radial[0] + d[1] * radial[1]) / (Math.hypot(...d) * Math.hypot(...radial));
      assert.ok(Math.abs(cos) < 0.05, `轉角 ${th.toFixed(2)}:繩從鼓的切線離開(cos ${cos.toFixed(3)})`);
    }
    assert.equal(leaves, 2, "繩在兩段上各離開鼓一次");
  }
});

// 原圖(images/352.png,212 px 高):架頭頂約在 y 5、兩個導輪的軸約在 y 79、鼓軸約在 y 165,
// 導輪在架頭頂到鼓軸之間 (79 − 5) / (165 − 5) ≈ 46% 處
test("第 352 種:鼓軸穿過兩根架腳上的軸孔、兩端伸出腳外;導輪掛在架腳中段(原圖約在架頭頂到鼓軸之間 46% 處)", () => {
  const def = m352.default;
  const drum = part(def, "drum");
  const axle = drum.pieces.reduce((a, q) => (q.kind === "cylinder" && q.radius < (a?.radius ?? 1) ? q : a), null);
  const [x0, x1] = [drum.center[0] + (axle.at?.[2] ?? 0) - axle.length / 2, drum.center[0] + (axle.at?.[2] ?? 0) + axle.length / 2];
  const frame = part(def, "frame");
  const legs = frame.pieces.filter((q) => q.kind === "box" && q.angle);
  assert.equal(legs.length, 4, "A 形架的兩根腳(各在軸孔上下分成兩段)");
  const inBox = (q, p) => {
    const d = p.map((v, k) => v - q.at[k]);
    const [u, w] = rot2([d[0], d[1]], -q.angle);
    return Math.abs(u) <= q.size[0] / 2 && Math.abs(w) <= q.size[1] / 2 && Math.abs(d[2]) <= q.size[2] / 2;
  };
  // 鼓軸的表面(軸線上下前後各一條)不埋進實心的腳
  for (const [dy, dz] of [[0, 0], [axle.radius, 0], [-axle.radius, 0], [0, axle.radius], [0, -axle.radius]]) {
    const hit = sweep(4, 1600, -4).filter((x) => legs.some((q) => inBox(q, [x, drum.center[1] + dy, drum.center[2] + dz])));
    assert.deepEqual(hit, [], "鼓軸不埋在實心的架腳裡");
  }
  // 軸孔:架腳在鼓軸處的一塊(沿 x 擠出的板)開著圓孔,孔套著鼓軸
  const bosses = frame.pieces.filter((q) => q.kind === "plate" && q.axis?.[0] === 1 && (q.shape.holes ?? []).length);
  assert.equal(bosses.length, 2, "兩根架腳在鼓軸處各有開了軸孔的一塊");
  for (const b of bosses) {
    assert.ok(Math.abs(b.at[1] - drum.center[1]) < 1e-9 && Math.abs(b.at[2] - drum.center[2]) < 1e-9, "軸孔在鼓軸上");
    const hole = b.shape.holes[0];
    const r = Math.max(...hole.map(([u, v]) => Math.hypot(u, v)));
    assert.ok(r >= axle.radius - 1e-9 && r <= axle.radius + 0.011, `軸孔(半徑 ${r.toFixed(3)})套著鼓軸(${axle.radius})`);
    assert.ok(x0 < b.at[0] - b.thickness / 2 - 0.02 && x1 > b.at[0] + b.thickness / 2 + 0.02, `鼓軸(${x0.toFixed(2)}..${x1.toFixed(2)})整根穿過軸孔、兩端伸出`);
    const linked = legs.filter((q) => sweep(0.5, 50, -0.5).some((k) => inBox(q, [b.at[0], b.at[1] + k * 0.5, 0])));
    assert.equal(linked.length, 2, "開軸孔的一塊上下各接著一段架腳");
  }
  const top = Math.max(...frame.pieces.filter((q) => q.kind === "box" && !q.angle).map((q) => pieceBox(q).hi[1]));
  for (const id of ["guideL", "guideR"]) {
    const f = (top - part(def, id).center[1]) / (top - drum.center[1]);
    assert.ok(Math.abs(f - 0.46) < 0.04, `${id} 掛在架腳中段(離架頭頂 ${(f * 100).toFixed(0)}%,原圖約 46%)`);
  }
});

test("第 353 種:推板輪的軸往後穿過支架、錘柄的軸承環坐在支柱頂上", () => {
  const def = m353.default;
  const wheel = part(def, "wheel");
  const frame = part(def, "frame");
  const bracket = frame.pieces.find((q) => q.kind === "plate" && pointInPolygon(wheel.center, q.shape.outline));
  assert.ok(bracket, "推板輪後面有支架");
  const b0 = bracket.at[2] - bracket.thickness / 2;
  const axle = zPins(wheel, wheel.center).find((q) => Math.hypot(q.c[0] - wheel.center[0], q.c[1] - wheel.center[1]) < 1e-9);
  assert.ok(axle && axle.z0 <= b0 + 1e-9 && axle.z1 >= wheel.center[2], "推板輪的軸從輪一路穿過支架");
  // 支架在軸處開了軸孔:軸從孔裡穿過,不是埋在實心的板裡
  const local = [wheel.center[0] - (bracket.at?.[0] ?? 0), wheel.center[1] - (bracket.at?.[1] ?? 0)];
  assert.ok(!inSolid(local, bracket.shape), "軸的中心不在支架的實體裡(開了軸孔)");
  const hole = (bracket.shape.holes ?? []).find((h) => pointInPolygon(local, h));
  assert.ok(hole, "支架有一個套著軸的孔");
  const r = Math.min(...hole.map(([x, y]) => Math.hypot(x - local[0], y - local[1])));
  assert.ok(r >= axle.r - 1e-9 && r <= axle.r + 0.011, `軸孔(半徑 ${r.toFixed(3)})套著軸(${axle.r})`);
  const ring = frame.pieces.find((q) => q.kind === "cylinder" && q.inner);
  const column = frame.pieces.find((q) => q.kind === "box" && Math.abs(q.at[0] - ring.at[0]) < 1e-9 && q.at[1] < ring.at[1]);
  assertOnePiece({ pieces: [column, ring] }, "軸承環坐在支柱頂上");
  // 支柱頂的兩個角不超出軸承環的外圓
  const cb = pieceBox(column);
  for (const x of [cb.lo[0], cb.hi[0]]) assert.ok(Math.hypot(x - ring.at[0], cb.hi[1] - ring.at[1]) <= ring.radius + 1e-9, `支柱頂角(x ${x.toFixed(3)})在軸承環的外圓之內`);
});

test("第 353 種:錘柄為第一類槓桿——支點在錘頭與推板壓著的尾端之間,推板把尾端往下壓、錘頭就抬起", () => {
  const def = m353.default;
  const hammer = part(def, "hammer");
  const wheel = part(def, "wheel");
  const handle = hammer.pieces[0].shape.outline;
  const head = hammer.pieces.find((q) => q.kind === "plate" && q.thickness > 0.5).shape.outline;
  const mid = head.reduce((s, p) => [s[0] + p[0] / head.length, s[1] + p[1] / head.length], [0, 0]);
  const [px, py] = hammer.center;
  const headAt = (angle) => placeOutline([mid], hammer.center, angle)[0];
  let pressed = 0;
  for (const b of sweep((2 * Math.PI) / 6, 120)) {
    const pose = def.pose(b).parts;
    const placed = placeOutline(handle, hammer.center, pose.hammer.angle);
    const star = placeOutline(wheel.shape.outline, wheel.center, pose.wheel.angle);
    const gap = (p) => (pointInPolygon(p, star) ? 0 : edgeDistance(p, star));
    const contact = placed.reduce((q, p) => (gap(p) < gap(q) ? p : q));
    if (gap(contact) > 0.01 || m353.hammer(b) < 0.05) continue; // 推板沒壓著(落下中或停在砧上)
    pressed++;
    const h = headAt(pose.hammer.angle);
    assert.ok((contact[0] - px) * (h[0] - px) + (contact[1] - py) * (h[1] - py) < 0, "支點在錘頭與尾端的接觸點之間");
    assert.ok(contact[1] < py + 0.2 && h[1] > headAt(0)[1], "推板壓著尾端時,錘頭比落在砧上時高");
  }
  assert.ok(pressed > 5, "推板壓著尾端把錘頭抬起");
});

test("第 354 種:十字頭是開槽的板,溝槽比曲柄銷寬,曲柄銷整圈都在溝槽裡、不碰槽壁", () => {
  const def = m354.default;
  const pin = part(def, "crank").pieces.find((q) => q.kind === "cylinder" && q.accent);
  const layers = plateLayers(part(def, "crosshead"));
  const z = pin.at[2] + pin.length / 2 - 0.02; // 銷的前端
  const solids = layers.filter((l) => l.z0 <= z && z <= l.z1).map((l) => l.solid);
  assert.ok(solids.length, "銷的前端伸到十字頭有溝槽的那一層板");
  for (const th of sweep(2 * Math.PI, 360)) {
    const pose = def.pose(th).parts;
    const w = rot2([pin.at[0], pin.at[1]], pose.crank.angle);
    const c = [w[0] - pose.crosshead.position[0], w[1] - pose.crosshead.position[1]];
    const g = guidedBetween(c, pin.radius, solids);
    const d = (th * 180) / Math.PI;
    assert.ok(g.open && g.depth < 0.003, `轉角 ${d.toFixed(0)}°:銷在溝裡、不穿進槽壁(穿入 ${g.depth.toFixed(3)})`);
    if (![90, 270].some((e) => Math.abs(d - e) < 15)) assert.ok(g.sides, `轉角 ${d.toFixed(0)}°:溝的兩側都貼著銷`);
  }
});

test("第 354 種:曲柄臂貼在曲柄盤面上、銷立在臂上;十字頭的板與上下兩根桿連成一件", () => {
  const def = m354.default;
  assertOnePiece(part(def, "crank"), "曲柄的盤、臂、銷與軸連成一件");
  assertOnePiece(part(def, "crosshead"), "十字頭的板、島、壓條與上下桿連成一件");
  // assertOnePiece 只看外輪廓、不看孔:另外量臂的背面落在盤面的正面上,而且臂蓋住的是盤的實心部分(不是軸孔)
  const crank = part(def, "crank");
  const disc = crank.pieces.find((q) => q.kind === "plate" && q.shape.holes?.length && q.thickness < 0.1);
  const arm = crank.pieces.find((q) => q.kind === "box");
  close(pieceBox(arm).lo[2], pieceBox(disc).hi[2], "臂的背面貼著盤面", 1e-9);
  const [hole] = disc.shape.holes;
  const holeR = Math.max(...hole.map(([x, y]) => Math.hypot(x, y)));
  assert.ok(pieceBox(arm).hi[0] > holeR + 0.1, "臂伸過軸孔、壓在盤的實心部分上");
});

test("第 355 種:陀螺儀:碟片高速旋轉時不掉落,而是繞鉛直軸轉(進動)", () => {
  const cs = sweep(1, 24).map((p) => m355.gyro(p).center);
  assert.ok(cs.every((c) => Math.abs(c[1] - cs[0][1]) < 1e-12), "碟片中心高度不變(不掉落)");
  const r = cs.map((c) => Math.hypot(c[0] + 1.3, c[2]));
  assert.ok(r.every((x) => Math.abs(x - r[0]) < 1e-9), "繞鉛直軸畫圓");
  close(m355.gyro(1).spin, 2 * Math.PI * m355.SPIN_PER_TURN, "碟片自轉遠快於進動");
});

test("第 355 種:環 A 的樞軸 F 以臂接在環上:臂從 F 的球出發,末端落在環的寬度與厚度裡", () => {
  const arm = m355.F_ARM;
  assert.ok(Math.hypot(...arm[0]) < m355.F_BALL, "臂的起點在 F 的球裡");
  const [x, y] = arm.at(-1);
  const r = Math.abs(x - m355.ARM);
  assert.ok(r >= m355.RING_INNER && r <= m355.RING_OUTER, `末端到環心 ${r}`);
  assert.ok(Math.abs(y) <= m355.RING_WIDTH / 2, `末端在環的寬度裡 ${y}`);
});

test("第 356 種:Bohnenberger 陀螺儀:整台儀器傾斜時三個環的位置跟著改變,球的軸始終朝同一方向", () => {
  const tilts = sweep(m356.TILT, 24, -m356.TILT);
  const rel = (a, b) => quatMul([-a[0], -a[1], -a[2], a[3]], b);
  const same = (u, v, msg) => u.forEach((c, k) => close(c, v[k], msg, 1e-9));
  for (const t of tilts) {
    const g = m356.instrument(t);
    same(quatRotate(g.qBall, [0, 0, 1]), m356.AXIS, "球軸方向不變");
    same(quatRotate(g.qA, [0, 0, 1]), [0, 0, 1], "A 隨座繞水平的耳軸傾斜");
    same(quatRotate(rel(g.qA, g.qA1), [0, 1, 0]), [0, 1, 0], "A¹ 只繞 A 頂端與底端的樞軸(A 的局部 Y)轉");
    same(quatRotate(rel(g.qA1, g.qA2), [0, 0, 1]), [0, 0, 1], "A² 只繞 A¹ 側面的樞軸(A¹ 的局部 Z)轉");
    same(quatRotate(rel(g.qA2, g.qBall), [0, 0, 1]), [1, 0, 0], "球軸在 A² 的局部 X(兩端進 A² 的軸承)");
  }
  const span = (key) => Math.max(...tilts.map((t) => m356.instrument(t)[key])) - Math.min(...tilts.map((t) => m356.instrument(t)[key]));
  assert.ok(span("beta") > deg(3) && span("gamma") > deg(20), "A¹、A² 各自真的轉了,不是跟著座一起傾斜");
});

test("第 356 種:三個環之間的樞銷都伸進相接的兩個環(樞銷的徑向範圍蓋住外環的內緣與內環的外緣)", () => {
  for (const { from, to, outer, inner } of m356.PIVOTS) {
    assert.ok(from < inner.outer && from >= inner.inner - 1e-9, `樞銷伸進內環 ${from}`);
    assert.ok(to > outer.inner, `樞銷伸進外環 ${to}`);
  }
});

// 第 357 種:量各零件姿勢下的實際位置(四元數擺放的軸、群組上的銷),斷言對到原文
const def357 = m357.default;
const P357 = m357.PERIOD;
/** 零件 id 上局部座標 local 的點在世界中的位置 */
function at357(pose, id, local) {
  const pp = pose.parts[id];
  const pt = part(def357, id);
  const center = pp.position ?? pt.center ?? [0, 0, 0];
  if (pp.rotation) return add(center, quatRotate(pp.rotation, local));
  return partPoint(center, pt.axis ?? [0, 0, 1], pp.angle ?? 0, local);
}
const axis357 = (pose, id, local = [0, 0, 1]) => quatRotate(pose.parts[id].rotation, local);
const lineGap = (p, a, dir) => len(cross(sub(p, a), norm(dir)));
// 叉的兩股(局部 x 離軸線的兩塊)
const prongs357 = (id) => part(def357, id).pieces.filter((pc) => pc.kind === "box" && Math.abs(pc.at[0]) > 0.1);

test("第 357 種:輪 A 的傾向是變為垂直位置;調速器越快,傾向越強——B 的傾角隨轉速一路減小、趨近垂直而不越過", () => {
  // 量畫面上的輪軸(B)和水平的夾角(外端朝下為正),對一輪之內的轉速排序。傾角和轉速的對應是推斷的示意(不模擬角動量),
  // 這裡只驗原文說的方向:越快越接近垂直、不越過
  const rows = sweep(P357, 96).map((p) => ({ s: m357.speedAt(p), tilt: Math.asin(-axis357(def357.pose(p), "shaftB")[1]) }));
  rows.sort((a, b) => a.s - b.s);
  for (let i = 1; i < rows.length; i++) if (rows[i].s - rows[i - 1].s > 1e-9) assert.ok(rows[i].tilt < rows[i - 1].tilt, `轉速 ${rows[i].s.toFixed(2)}:越快越接近垂直`);
  assert.ok(rows[0].tilt > deg(15), `最慢時明顯傾斜(${((rows[0].tilt * 180) / Math.PI).toFixed(1)}°)`);
  assert.ok(rows.every((r) => r.tilt > 0), "全程外端朝下,沒有越過垂直");
  assert.ok(rows.at(-1).tilt < deg(3), "最快時接近垂直");
  // 轉速升高的半輪裡,傾角一路減小
  const ps = sweep(P357 / 2, 48);
  const shown = ps.map((p) => Math.asin(-axis357(def357.pose(p), "shaftB")[1]));
  for (let i = 1; i < shown.length; i++) assert.ok(shown[i] < shown[i - 1] && shown[i] > 0, `進程 ${ps[i].toFixed(2)}:輪面往垂直轉、不越過`);
});

test("第 357 種:B 於中點以鉸接裝在 H 上,輪 A 在鉸接處;照原圖萬向接頭與 I 在左、B 的外端在右", () => {
  const { R_J, OUTER, D_I } = m357.geometry;
  const cradle = part(def357, "cradle");
  const trunnion = cradle.pieces.find((pc) => pc.kind === "cylinder" && !pc.axis && pc.at[2] < -0.5);
  assert.ok(trunnion, "托架往後伸出的鉸接軸");
  const bearing = part(def357, "frameH").pieces.find((pc) => pc.kind === "cylinder" && !pc.axis && pc.inner);
  close(Math.hypot(bearing.at[0] - cradle.center[0], bearing.at[1] - cradle.center[1]), 0, "鉸接軸的軸承在 H 上、和鉸接同軸");
  assert.ok(trunnion.at[2] - trunnion.length / 2 < bearing.at[2] - bearing.length / 2 && trunnion.at[2] + trunnion.length / 2 > bearing.at[2] + bearing.length / 2, "鉸接軸穿過 H 的軸承");
  close(R_J, OUTER, "鉸接在 B 的中點:到萬向接頭與到外端一樣遠");
  for (const p of sweep(P357, 24)) {
    const pose = def357.pose(p);
    const hinge = cradle.center;
    const u = axis357(pose, "shaftB");
    close(len(sub(pose.parts.shaftB.position, hinge)), 0, "輪 A 的中心在鉸接軸的軸線上", 1e-9);
    const joint = pose.parts.cross.position;
    const end = at357(pose, "collar", [OUTER, 0, 0]);
    close(len(sub(joint, sub(hinge, scale(u, R_J)))), 0, "萬向接頭在 B 的內端", 1e-9);
    close(len(sub(end, add(hinge, scale(u, OUTER)))), 0, "外端軸環在 B 上", 1e-9);
    assert.ok(joint[0] < 0 && end[0] > 0, "萬向接頭在左、外端在右");
    assert.ok(at357(pose, "shaftB1", [0, 0, -D_I])[0] < -1.5, "小齒輪 I 在左");
  }
});

test("第 357 種:部件 B 透過桿 C、D 與閥桿相連——外端升高時經 C 把閥桿 D 往上拉;C 的兩端套在銷上", () => {
  const { OUTER, C_Z, LC, LD, GUIDE } = m357.geometry;
  const rows = sweep(P357, 96).map((p) => {
    const pose = def357.pose(p);
    const pin = at357(pose, "collar", [OUTER, 0, C_Z]);
    const lower = at357(pose, "rodC", [0, 0, 0]);
    const upper = at357(pose, "rodC", [LC, 0, 0]);
    const bottom = at357(pose, "valveD", [0, -LD, C_Z]);
    close(len(sub(lower, pin)), 0, "C 的下端套在外端軸環的銷上", 1e-9);
    close(len(sub(upper, bottom)), 0, "C 的上端套在閥桿下端的銷上", 1e-9);
    close(pose.parts.valveD.position[0], 0, "閥桿沿罩頂導套的軸線上下", 1e-12);
    return { s: m357.speedAt(p), end: pin[1], valve: pose.parts.valveD.position[1] };
  });
  for (const r of rows) assert.ok(r.valve - LD < GUIDE[0] && r.valve > GUIDE[1], "閥桿全程穿過罩頂的導套");
  rows.sort((a, b) => a.s - b.s);
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].s - rows[i - 1].s < 1e-9) continue;
    assert.ok(rows[i].end > rows[i - 1].end, "轉得越快,B 的外端越高");
    assert.ok(rows[i].valve > rows[i - 1].valve, "外端升高,閥桿跟著被拉起");
  }
});

test("第 357 種:彈簧 L 透過槓桿 N 與桿 P 連接於閥桿上,抵抗輪 A 變垂直的傾向——閥桿越高,彈簧被壓得越短", () => {
  const { N_SHORT, N_LONG, P_Z, N_Z, SPRING_FOOT } = m357.geometry;
  const n = part(def357, "leverN");
  assert.ok(part(def357, "casing").pieces.some((pc) => pc.kind === "cylinder" && !pc.axis && Math.hypot(pc.at[0] - n.center[0], pc.at[1] - n.center[1]) < 1e-9), "N 的樞軸銷在外殼(罩)上");
  const rest = def357.pose(0).parts;
  const rows = sweep(P357, 96).map((p) => {
    const pose = def357.pose(p);
    const parts = pose.parts;
    close(len(sub(parts.rodP.from, at357(pose, "leverN", [...N_SHORT, P_Z - N_Z]))), 0, "P 的一端套在 N 短臂的銷上", 1e-9);
    close(len(sub(parts.rodP.to, at357(pose, "valveD", [0, 0, P_Z]))), 0, "P 的另一端套在閥桿上端的銷上", 1e-9);
    close(len(sub(parts.rodP.to, parts.rodP.from)), len(sub(rest.rodP.to, rest.rodP.from)), "桿 P 長度不變", 1e-9);
    close(len(sub(parts.springL.to, at357(pose, "leverN", [...N_LONG, 0]))), 0, "彈簧 L 的上端接在 N 長臂的末端", 1e-9);
    close(len(sub(parts.springL.from, [...SPRING_FOOT, N_Z])), 0, "彈簧 L 的下端固定在外殼的耳上", 1e-12);
    return { valve: parts.valveD.position[1], spring: len(sub(parts.springL.to, parts.springL.from)) };
  });
  rows.sort((a, b) => a.valve - b.valve);
  for (let i = 1; i < rows.length; i++) if (rows[i].valve - rows[i - 1].valve > 1e-9) assert.ok(rows[i].spring < rows[i - 1].spring, "閥桿越高,彈簧被壓得越短(彈簧抵抗)");
  assert.ok(rows[0].spring - rows[rows.length - 1].spring > 0.15, "彈簧的伸縮看得出來");
  assert.ok(rows[rows.length - 1].spring > 0.6, "最快時彈簧也沒被壓到底");
});

test("第 357 種(進程型):框架 H 由引擎透過傘齒輪傳動驅動——轉速一輪之內起伏,立軸照轉速的積分轉,水平軸經傘齒輪咬合帶動", () => {
  assert.equal(def357.driver.mode, "progress");
  const P = P357;
  const speeds = sweep(P, 480).map(m357.speedAt);
  close(m357.speedAt(P), m357.speedAt(0), "一輪之後轉速回到原值", 1e-9);
  assert.ok(Math.max(...speeds) > Math.min(...speeds) + 5, "轉速起伏看得出來");
  const spin = (p) => def357.pose(p).parts.spindle.angle;
  close(spin(P) - spin(0), TAU * P, `一輪恰好轉 ${P} 圈`, 1e-9);
  const h = 1e-4;
  const rate = (p) => (spin(p + h) - spin(p - h)) / (2 * h) / m357.speedAt(p);
  for (const p of sweep(P, 37).slice(1, -1)) close(rate(p), rate(P / 3), `進程 ${p.toFixed(2)}:立軸的轉角增量和轉速成正比`, 1e-5);
  const { spindle: gs, contact } = m357.gears;
  const r = sub(contact, gs.apex);
  for (const p of sweep(P, 24)) {
    const [a, b] = [def357.pose(p).parts, def357.pose(p + h).parts];
    const vs = cross([0, b.spindle.angle - a.spindle.angle, 0], r);
    const vd = cross([b.driveShaft.angle - a.driveShaft.angle, 0, 0], r);
    close(len(sub(vs, vd)), 0, `進程 ${p.toFixed(2)}:兩個傘齒輪在咬合處的節圓線速度相等`, 1e-9 + 1e-6 * len(vs));
  }
});

test("第 357 種:小齒輪 I 繞著靜止的齒環 G 旋轉,輪 A 便繞自己的軸快速旋轉——I 照 H 轉過的角度沿 G 滾,A 經萬向接頭跟著 B¹ 轉", () => {
  const h = 2e-4;
  // 繞軸 axis 從方向 a 轉到方向 b 的角度
  const twist = (a, b, axis) => Math.atan2(dot(cross(a, b), axis), dot(a, b));
  let spinB1 = 0;
  let spinB = 0;
  let spinH = 0;
  const ps = sweep(P357, 2400);
  for (let i = 1; i < ps.length; i++) {
    const [a, b] = [def357.pose(ps[i - 1]), def357.pose(ps[i])];
    spinB1 += twist(axis357(a, "shaftB1", [1, 0, 0]), axis357(b, "shaftB1", [1, 0, 0]), axis357(b, "shaftB1"));
    spinB += twist(axis357(a, "shaftB", [1, 0, 0]), axis357(b, "shaftB", [1, 0, 0]), axis357(b, "shaftB"));
    spinH += b.parts.spindle.angle - a.parts.spindle.angle;
  }
  // I 與 G 的齒數、I 的節圓半徑從零件讀;I 咬在 G 上的半徑由姿勢量(I 的中心離立軸多遠)
  const gearI = part(def357, "shaftB1").pieces.find((pc) => pc.kind === "gear");
  const ringG = part(def357, "ringG");
  const reach = sweep(P357, 48).map((p) => {
    const c = at357(def357.pose(p), "shaftB1", gearI.at);
    return Math.hypot(c[0], c[2]);
  });
  const mean = reach.reduce((x, y) => x + y, 0) / reach.length;
  close(ringG.teeth / gearI.teeth, mean / gearI.radius, "G 與 I 的齒距一樣(齒數比 = 咬合半徑比)", 0.03 * (mean / gearI.radius));
  close(spinB1 / spinH, ringG.teeth / gearI.teeth, "H 轉一圈,I 沿 G 滾、自轉 G 與 I 的齒數比那麼多圈", 1e-3);
  assert.ok(Math.abs(spinB - spinB1) < 1, "萬向接頭:A 和 B¹ 轉的圈數一樣(只有一圈之內的快慢起伏)");
  assert.ok(spinB / spinH > 7, "輪 A 轉得比 H 快得多");
  // 滾而不滑:I 和 G 接觸處(I 節圓的最低點),H 帶著它繞立軸走的速度,被 I 自轉的速度抵掉
  for (const p of sweep(P357, 24)) {
    const [a, b] = [def357.pose(p), def357.pose(p + h)];
    const axis = axis357(a, "shaftB1");
    const center = at357(a, "shaftB1", gearI.at);
    const down = norm(sub([0, -1, 0], scale(axis, -axis[1])));
    const contact = add(center, scale(down, gearI.radius));
    const wI = twist(axis357(a, "shaftB1", [1, 0, 0]), axis357(b, "shaftB1", [1, 0, 0]), axis);
    const orbit = cross([0, b.parts.spindle.angle - a.parts.spindle.angle, 0], contact);
    const roll = cross(scale(axis, wI), sub(contact, center));
    assert.ok(len(add(orbit, roll)) < 0.04 * len(orbit), `進程 ${p.toFixed(2)}:I 在 G 上滾、不打滑(差 ${(len(add(orbit, roll)) / len(orbit)).toFixed(3)})`);
  }
});

test("第 357 種:B、B¹ 以萬向接頭相連——十字頭的兩支銷互相垂直、各穿過一支叉的兩股;B¹ 穿過 H 上的球面軸套", () => {
  const { R_J } = m357.geometry;
  const ball = part(def357, "bushing");
  const seat = part(def357, "frameH").pieces.find((pc) => pc.kind === "cylinder" && pc.axis && pc.inner === ball.radius);
  assert.ok(seat && len(sub(seat.at, ball.center)) < 1e-9, "球面軸套坐在 H 的座裡");
  for (const p of sweep(P357, 48)) {
    const pose = def357.pose(p);
    const J = pose.parts.cross.position;
    const [x, y] = [axis357(pose, "cross", [1, 0, 0]), axis357(pose, "cross", [0, 1, 0])];
    close(dot(x, y), 0, "十字頭的兩支銷互相垂直", 1e-9);
    close(dot(x, axis357(pose, "shaftB1")), 0, "穿過 B¹ 叉的銷垂直於 B¹", 1e-9);
    close(dot(y, axis357(pose, "shaftB")), 0, "穿過 B 叉的銷垂直於 B", 1e-9);
    for (const pc of prongs357("shaftB1")) close(lineGap(at357(pose, "shaftB1", [pc.at[0], 0, 0]), J, x), 0, "B¹ 叉的兩股套在十字頭的一支銷上", 1e-9);
    for (const pc of prongs357("shaftB")) close(lineGap(at357(pose, "shaftB", [pc.at[0], 0, -R_J]), J, y), 0, "B 叉的兩股套在十字頭的另一支銷上", 1e-9);
    close(lineGap(ball.center, J, axis357(pose, "shaftB1")), 0, "B¹ 的軸線穿過球面軸套的中心", 1e-9);
  }
});

test("第 357 種:I 全程咬在冠狀齒環 G 上(I 隨 B 的傾角擺動、沿軸滑,節圓最低點離 G 的節面不到 0.025)", () => {
  // G 的節面:齒環盤面(盤的頂面)往上半個齒高;I 的節圓半徑與齒寬:都從零件讀
  const ringG = part(def357, "ringG");
  const gearI = part(def357, "shaftB1").pieces.find((pc) => pc.kind === "gear");
  const pitchY = ringG.center[1] + ringG.width / 2 + ringG.toothDepth / 2;
  for (const p of sweep(P357, 48)) {
    const pose = def357.pose(p);
    const axis = axis357(pose, "shaftB1");
    const center = at357(pose, "shaftB1", gearI.at);
    const lowest = center[1] - gearI.radius * Math.hypot(axis[0], axis[2]);
    assert.ok(Math.abs(lowest - pitchY) < 0.025, `進程 ${p.toFixed(2)}:I 的節圓貼著 G 的節面(差 ${(lowest - pitchY).toFixed(3)})`);
    const r = Math.hypot(center[0], center[2]);
    assert.ok(r - gearI.width / 2 > ringG.ring && r + gearI.width / 2 < ringG.radius + 0.02, "I 的齒寬落在 G 的齒圈上");
  }
});

test("第 357 種(推斷):閥桿上段的環槽經叉形槓桿與閥桿拉節流閥;轉得太快時閥桿升高、關小節流閥,滑桿每一段都看得出變化", () => {
  assertThrottle(def357, sweep(P357, 96), "valveD");
  assert.equal(def357.target, "valve", "目標件是被調節的節流閥");
  close(m357.opening(P357), m357.opening(0), "一輪之後節流閥回到原處", 1e-9);
  const travel = def357.pose(P357 / 2).parts.valveD.position[1] - def357.pose(0).parts.valveD.position[1];
  for (let i = 0; i < 12; i++) {
    const seg = sweep(((i + 1) * P357) / 12, 10, (i * P357) / 12).map((p) => def357.pose(p).parts.valveD.position[1]);
    assert.ok(Math.max(...seg) - Math.min(...seg) > 0.08 * travel, `滑桿第 ${i + 1}/12 段:閥桿有看得出的升降`);
  }
});

test("第 363 種:蹺蹺板:長板繞支點作有限的擺動", () => {
  const [lo, hi] = m363.RANGE;
  const pose = (a) => m363.default.pose(a).parts.board.angle;
  close(pose(hi + 1), hi, "擺動有限");
  close(pose(lo - 1), lo, "擺動有限");
});

test("第 363 種:板穿過立柱的榫眼,樞銷穿過立柱與板(原圖:立柱高出板、頂端圓弧,板上的虛線是穿過立柱的那段)", () => {
  const def = m363.default;
  const stand = def.parts.find((p) => p.id === "stand");
  const board = def.parts.find((p) => p.id === "board");
  const [px, py] = board.center;
  const plank = pieceBox(board.pieces.find((q) => q.kind === "box" && q.size[0] > 2), board.center);
  const pin = stand.pieces.find((q) => q.kind === "cylinder" && !q.axis && dist(q.at, board.center) < 1e-9);
  assert.ok(pin, "樞銷在板的支點上、沿前後方向");
  const [z0, z1] = [pin.at[2] - pin.length / 2, pin.at[2] + pin.length / 2];
  assert.ok(plank.lo[1] < py && py < plank.hi[1] && z0 < plank.lo[2] && plank.hi[2] < z1, "樞銷從板的中間穿過、伸出板的前後兩側");
  // 板的前後各有立柱的一片(榫眼的兩頰),樞銷穿進兩片
  const cheeks = stand.pieces.filter((q) => q.kind === "box").map((q) => pieceBox(q)).filter((b) => b.lo[0] < px && px < b.hi[0] && b.lo[1] < py && py < b.hi[1]);
  assert.ok(cheeks.some((b) => b.hi[2] <= plank.lo[2] + 1e-9 && b.hi[2] > z0) && cheeks.some((b) => b.lo[2] >= plank.hi[2] - 1e-9 && b.lo[2] < z1), "板前、板後都有立柱,樞銷穿進兩邊");
  // 立柱高出板
  const top = Math.max(...stand.pieces.filter((q) => q.kind !== "plate").map((q) => (q.kind === "box" ? pieceBox(q).hi[1] : q.at[1] + q.radius)));
  assert.ok(top > py + 0.3, `立柱頂(${top.toFixed(2)})高出板`);
});

test("第 363 種:擺動的範圍由板端碰到地面擋住,擺幅照原圖(約 33°)", () => {
  const def = m363.default;
  const board = def.parts.find((p) => p.id === "board");
  const stand = def.parts.find((p) => p.id === "stand");
  const ground = Math.max(...stand.pieces.filter((q) => q.kind === "box").map((q) => pieceBox(q).hi[1]).filter((y) => y < board.center[1] - 1));
  // 板(長板與座位)各角的世界座標
  const corners = (a) =>
    board.pieces.flatMap((q) => {
      const pts = q.kind === "box" ? [-1, 1].flatMap((sx) => [-1, 1].map((sy) => [q.at[0] + (sx * q.size[0]) / 2, q.at[1] + (sy * q.size[1]) / 2])) : q.shape.outline;
      return pts.map((p) => add(board.center, [...rot2(p, a), 0]));
    });
  const low = (a) => corners(a).reduce((m, p) => (p[1] < m[1] ? p : m));
  const base = stand.pieces.filter((q) => q.kind === "box").map((q) => pieceBox(q)).find((b) => Math.abs(b.hi[1] - ground) < 1e-9);
  for (const end of m363.RANGE) {
    const p = low(def.pose(end).parts.board.angle);
    close(p[1], ground, `擺到 ${((end * 180) / Math.PI).toFixed(1)}°:板端碰到地面`, 1e-6);
    assert.ok(base.lo[0] <= p[0] && p[0] <= base.hi[0], "碰到的地方有底座(地面)");
  }
  for (const a of sweep(m363.RANGE[1], 40, m363.RANGE[0]).slice(1, -1)) assert.ok(low(a)[1] > ground, "範圍內板不碰地");
  for (const end of m363.RANGE) assert.ok(Math.abs(end) > deg(30) && Math.abs(end) < deg(36), `擺幅 ${((end * 180) / Math.PI).toFixed(1)}° 接近原圖的 33°`);
});

test("第 365 種:滾子的旋轉同時產生桿的縱向運動與旋轉運動(兩滾子的軸彼此傾斜)", () => {
  const { TILT, RR, ROD } = m365.geometry;
  const m = m365.rodMotion(1);
  close(m.advance, RR * Math.cos(TILT), "縱向:滾子表面速度沿桿軸的分量");
  close(Math.abs(m.spin) * ROD, RR * Math.sin(TILT), "旋轉:沿桿圓周的分量");
  close(m.back, -1, "兩滾子反向轉");
});

test("第 365 種:桿全程在底板上方(桿最低時下端也不穿到地面以下)", () => {
  const def = m365.default;
  const rod = def.parts.find((p) => p.id === "rod");
  const frame = def.parts.find((p) => p.id === "frame");
  const floor = Math.min(...frame.pieces.filter((q) => q.kind === "box").map((q) => q.at[1] + q.size[1] / 2));
  for (const v of sweep(m365.RANGE[1], 40, m365.RANGE[0])) {
    const bottom = def.pose(v).parts.rod.position[1] - rod.length / 2;
    assert.ok(bottom > floor, `主動量 ${v.toFixed(2)}:桿的下端(${bottom.toFixed(2)})在底板頂面(${floor.toFixed(2)})上方`);
  }
});

// 第 358–361 種共用:兩個外框(pieceBox)是否重疊
const boxesOverlap = (a, b) => [0, 1, 2].every((k) => a.lo[k] < b.hi[k] && b.lo[k] < a.hi[k]);

const d358 = m358.default;
const carriageX = (t) => d358.pose(t).parts.carriage.position[0];

// 原文:托架的快慢依皮帶在鏈索輪上作用處的直徑而變。理想的鏈索輪(皮帶垂直於軸捲上、往固定的方向拉)托架速度 = 作用處皮帶中心的半徑 ρ × 角速度;
// 這個模型偏離理想的量都從皮帶的外形量出來,不用模型的公式:
//  ・螺旋的升程:作用處每轉一弧度沿軸挪 h,捲進的皮帶 w 比 ρ 多(由捲著的皮帶最後一小段量);
//  ・作用處沿軸挪動:往上那一段(和垂直於軸的平面夾 γ)的長度每弧度變 h·sin γ 以內;
//  ・作用處的半徑變小:最後一段(沿軸斜 β)兩端的深度差每弧度變 h·k(k 是錐面的斜度),長度跟著變 h·k·sin β 以內;
//    托架走的是最後一段沿軸的分量,最多再除以 cos β。
// 所以 w − h(sin γ + k sin β) ≤ 速度 ≤ (w + h(sin γ + k sin β)) / cos β,大端的 ρ 大,速度就快(留 2% 給以折線量的誤差)
function speed358(t) {
  const rate = (carriageX(t) - carriageX(t + 1e-4)) / 1e-4;
  const pts = d358.pose(t).paths.belt.points;
  const k = pts.findLastIndex((p) => p[0] > -1.7 && p[0] < 0.6 && Math.abs(Math.hypot(p[1], p[2]) - m358.radiusAt(p[0])) < 0.1);
  const [q, p] = [pts[k - 1], pts[k]];
  const turn = Math.abs(Math.atan2(p[2], p[1]) - Math.atan2(q[2], q[1]));
  const w = dist(p, q) / turn;
  const h = Math.abs(p[0] - q[0]) / turn;
  const up = sub(pts[k + 1], p);
  const last = sub(pts.at(-1), pts.at(-2));
  const [sinG, sinB, cosB] = [Math.abs(up[0]) / len(up), Math.abs(last[2]) / len(last), Math.abs(last[0]) / len(last)];
  const slope = Math.abs(m358.radiusAt(1) - m358.radiusAt(0));
  const c = h * (sinG + slope * sinB);
  return { rate, rho: Math.hypot(p[1], p[2]), lo: (w - c) * 0.98, hi: ((w + c) / cosB) * 1.02 };
}

test("第 358 種:托架的橫移速度依皮帶在鏈索輪上作用處的直徑而變:作用處在大端時快、在小端時慢", () => {
  const rows = sweep(m358.RANGE[1] - 0.05, 40, 0.05).map(speed358);
  assert.ok(rows.every((r) => r.rate > 0), "曲柄往前轉,托架一路被拉向鏈索輪");
  assert.ok(rows.every((r, i) => i === 0 || (r.rate < rows[i - 1].rate && r.rho < rows[i - 1].rho)), "作用處往小端走(直徑變小),托架越走越慢");
  for (const r of rows) assert.ok(r.lo <= r.rate && r.rate <= r.hi, `作用處半徑 ${r.rho.toFixed(3)}:托架速度 ${r.rate.toFixed(3)} 在 ${r.lo.toFixed(3)}..${r.hi.toFixed(3)} 之間`);
  const [a, b] = [rows[0], rows.at(-1)];
  assert.ok(a.rho / b.rho > 2, "作用處的直徑大端是小端的兩倍以上");
  assert.ok(a.rate / b.rate >= a.lo / b.hi, `快慢比 ${(a.rate / b.rate).toFixed(2)} 反映直徑比 ${(a.rho / b.rho).toFixed(2)}(扣掉升程與斜段,至少 ${(a.lo / b.hi).toFixed(2)})`);
});

test("第 358 種:皮帶長不變——托架走過的距離就是捲進鏈索輪的皮帶長(扣掉斜段的變化)", () => {
  const L0 = pathLength(d358.pose(0).paths.belt.points);
  for (const t of sweep(m358.RANGE[1], 60)) close(pathLength(d358.pose(t).paths.belt.points), L0, `曲柄轉 ${t.toFixed(2)}:皮帶長不變`, 5e-3);
});

test("第 358 種:皮帶從鏈索輪的切線方向(大致垂直於軸)離開、被捲進去,繞過導輪轉成沿軸向接到托架", () => {
  const guide = part(d358, "guide");
  assert.ok(guide, "機架上有導輪(推斷)");
  for (const t of sweep(m358.RANGE[1], 12)) {
    const pose = d358.pose(t);
    const pts = pose.paths.belt.points;
    const onFusee = (p) => p[0] > -1.7 && p[0] < 0.6 && Math.abs(Math.hypot(p[1], p[2]) - m358.radiusAt(p[0])) < 0.1;
    const k = pts.findLastIndex(onFusee);
    assert.ok(k >= 0, `曲柄轉 ${t.toFixed(2)}:皮帶捲在鏈索輪上`);
    const p = pts[k];
    const d = [0, 1, 2].map((i) => pts[k + 1][i] - p[i]);
    const dl = Math.hypot(...d);
    assert.ok(Math.abs(d[0]) / dl < Math.sin(deg(25)), `曲柄轉 ${t.toFixed(2)}:離開鏈索輪的一段大致垂直於軸(${((Math.asin(Math.abs(d[0]) / dl) * 180) / Math.PI).toFixed(1)}°)`);
    const radial = [0, p[1], p[2]];
    assert.ok(Math.abs(d[1] * radial[1] + d[2] * radial[2]) / dl / Math.hypot(p[1], p[2]) < 0.02, `曲柄轉 ${t.toFixed(2)}:沿切線離開`);
    // 曲柄往前轉(繞 +x)時鏈索輪在這一點的表面速度朝鏈索輪裡面捲:和皮帶離開的方向相反
    const surface = [0, -p[2], p[1]];
    assert.ok(surface[1] * d[1] + surface[2] * d[2] < 0, `曲柄轉 ${t.toFixed(2)}:鏈索輪轉動把皮帶捲進去`);
    // 繞過導輪:離開鏈索輪之後、最後一段之前的點都在導輪的輪面上
    const g = pose.parts.guide?.position ?? guide.center;
    const onGuide = pts.slice(k + 2, -1).map((q) => Math.hypot(q[0] - g[0], q[1] - g[1]));
    assert.ok(onGuide.length >= 3 && onGuide.every((r) => Math.abs(r - onGuide[0]) < 1e-6), `曲柄轉 ${t.toFixed(2)}:皮帶繞在導輪上`);
    const e = [0, 1, 2].map((i) => pts.at(-1)[i] - pts.at(-2)[i]);
    assert.ok(e[0] / Math.hypot(...e) > Math.cos(deg(10)), `曲柄轉 ${t.toFixed(2)}:最後一段沿軸向往托架`);
  }
  // 導輪隨皮帶轉、不打滑:皮帶繞在導輪上的半徑 × 導輪轉角 = 托架走的(皮帶在導輪頂上往鏈索輪那邊走,導輪逆時針)
  const [a, b] = [0.4, 6.5].map((t) => d358.pose(t));
  const g = b.parts.guide?.position ?? guide.center;
  const q = b.paths.belt.points.at(-2);
  const moved = b.parts.carriage.position[0] - a.parts.carriage.position[0];
  close((b.parts.guide.angle - a.parts.guide.angle) * Math.hypot(q[0] - g[0], q[1] - g[1]), -moved, "導輪輪面走的 = 托架走的", 0.02 * Math.abs(moved));
});

test("第 358 種:皮帶捲在鏈索輪的螺旋槽裡:貼著鏈索輪面與凸條的側面(間隙接近 0),全程不穿進凸條與鏈索輪面", () => {
  const fz = part(d358, "fusee");
  const ridge = fz.pieces.find((q) => q.kind === "tube");
  const beltR = part(d358, "belt").radius;
  const cosA = Math.cos(Math.atan(Math.abs(m358.radiusAt(1) - m358.radiusAt(0)))); // 錐面的斜度
  for (const t of sweep(m358.RANGE[1], 10, 1)) {
    const pose = d358.pose(t);
    const R = ridge.points.map((p) => partPoint(fz.center, X, pose.parts.fusee.angle, p));
    const ridgeGap = (p) => Math.min(...R.slice(1).map((q, i) => segDist(p, R[i], q))) - ridge.radius - beltR;
    const coneGap = (p) => (Math.hypot(p[1], p[2]) - m358.radiusAt(p[0])) * cosA - beltR;
    const pts = pose.paths.belt.points;
    const coil = pts.filter((p) => p[0] > -1.6 && p[0] < 0.5 && Math.hypot(p[1], p[2]) - m358.radiusAt(p[0]) < 0.12).slice(1); // 第一點是繩頭
    assert.ok(coil.length > 10, `曲柄轉 ${t.toFixed(2)}:皮帶捲在鏈索輪上`);
    for (const p of coil) {
      const [g, c] = [ridgeGap(p), coneGap(p)];
      assert.ok(g > -0.003 && g < 0.006, `曲柄轉 ${t.toFixed(2)}:捲著的皮帶(x ${p[0].toFixed(2)})貼著凸條的側面(間隙 ${g.toFixed(4)})`);
      assert.ok(c > -0.002 && c < 0.004, `曲柄轉 ${t.toFixed(2)}:捲著的皮帶(x ${p[0].toFixed(2)})貼著鏈索輪面(間隙 ${c.toFixed(4)})`);
    }
    // 整條皮帶(含往上離開的一段)沿線取點,都不穿進凸條
    for (let i = 1; i < pts.length; i++) {
      for (let k = 0; k <= 8; k++) {
        const p = lerp3(pts[i - 1], pts[i], k / 8);
        if (p[0] < -1.6 || p[0] > 0.6 || Math.hypot(p[1], p[2]) > 1.2) continue;
        assert.ok(ridgeGap(p) > -0.003, `曲柄轉 ${t.toFixed(2)}:皮帶(${p.map((v) => v.toFixed(2))})不穿進凸條(${ridgeGap(p).toFixed(4)})`);
      }
    }
  }
});

test("第 358 種:托架的輪子坐在導軌上滾,機架連成一件,鏈索輪軸穿過兩端的軸承;托架全程不碰鏈索輪與它的軸", () => {
  const frame = part(d358, "frame");
  assertOnePiece(frame, "機架的每一塊連成一件(底座、軸承座、導軌、導輪的座)");
  const rails = frame.pieces.filter((q) => q.kind === "box" && q.size[0] > 4 && q.size[2] < 0.5).map((q) => pieceBox(q)).sort((a, b) => b.hi[1] - a.hi[1]);
  assert.equal(rails.length, 2, "上下兩條導軌");
  const fuseeShaft = part(d358, "fusee").pieces.find((q) => q.kind === "cylinder" && q.length > 3);
  const shaft = { from: fuseeShaft.at[2] - fuseeShaft.length / 2, to: fuseeShaft.at[2] + fuseeShaft.length / 2 };
  const bearings = frame.pieces.filter((q) => q.kind === "cylinder" && q.axis?.[0] === 1 && Math.abs(q.inner - fuseeShaft.radius) < 0.01);
  assert.ok(bearings.some((q) => q.at[0] < -1.6 && q.at[0] > shaft.from) && bearings.some((q) => q.at[0] > 0.5 && q.at[0] < shaft.to), "鏈索輪兩側各有一個軸承,軸穿過去");
  const wheels = [["wheelTop", rails[0], 1], ["wheelBottom", rails[1], -1]];
  const x0 = carriageX(0);
  for (const t of sweep(m358.RANGE[1], 24)) {
    const pose = d358.pose(t);
    for (const [id, rail, side] of wheels) {
      const w = part(d358, id);
      const { position, angle } = pose.parts[id];
      const wz = [position[2] - w.width / 2, position[2] + w.width / 2];
      assert.ok(wz[0] < rail.hi[2] && rail.lo[2] < wz[1], `${id}:輪和導軌在同一個深度`);
      assert.ok(position[0] > rail.lo[0] && position[0] < rail.hi[0], `${id}:輪在導軌的範圍內`);
      const gap = side > 0 ? position[1] - w.radius - rail.hi[1] : rail.lo[1] - (position[1] + w.radius);
      close(gap, 0, `曲柄轉 ${t.toFixed(2)}:${id} ${side > 0 ? "壓在上導軌頂面" : "頂著下導軌底面"}`, 1e-6);
      close(angle * w.radius, -side * (pose.parts.carriage.position[0] - x0), `${id}:沿導軌滾、不打滑`, 1e-6);
    }
    const c = pose.parts.carriage.position;
    const fx = { lo: [shaft.from, -1, -1], hi: [shaft.to, 1, 1] };
    for (const q of part(d358, "carriage").pieces) assert.ok(!boxesOverlap(pieceBox(q, c), fx), `曲柄轉 ${t.toFixed(2)}:托架不碰鏈索輪與它的軸`);
  }
});

const d359 = m359.default;
// 繩在心軸上捲了幾圈:貼著心軸(離軸不到心軸半徑 + 0.06)的相鄰兩點之間轉過的角度加起來
function wraps359(pts) {
  const shaft = part(d359, "spindle").pieces[0].radius;
  const on = (p) => Math.hypot(p[0], p[2]) < shaft + 0.06;
  let sum = 0;
  for (let i = 1; i < pts.length; i++) {
    if (!on(pts[i]) || !on(pts[i - 1])) continue;
    const d = Math.atan2(pts[i][2], pts[i][0]) - Math.atan2(pts[i - 1][2], pts[i - 1][0]);
    sum += Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
  }
  return sum / (2 * Math.PI);
}

test("第 359 種:原始鑽孔裝置:按下橫桿時繩解開、心軸轉;放開時繩反向捲回,下一次心軸往另一個方向轉", () => {
  const S = m359.STROKE;
  const down1 = m359.pump(0.5 * S).spindle - m359.pump(0).spindle;
  const down2 = m359.pump(2.5 * S).spindle - m359.pump(2 * S).spindle;
  assert.ok(down1 * down2 < 0, "相鄰兩次按下,心軸轉向相反");
  close(m359.pump(S).spindle, 0, "按到底時繩完全解開", 1e-12);
  assert.ok(m359.pump(2 * S).bar > m359.pump(S).bar, "飛輪的動量把繩捲回、橫桿被拉起");
});

test("第 359 種:繩長不變——心軸的轉角由繩長算出,兩股繩在按下、放開的全程都不伸縮", () => {
  const S = m359.STROKE;
  const L0 = ["cordL", "cordR"].map((id) => pathLength(d359.pose(0).paths[id].points));
  for (const v of sweep(4 * S, 160))
    ["cordL", "cordR"].forEach((id, i) => close(pathLength(d359.pose(v).paths[id].points), L0[i], `行程 ${v.toFixed(2)}:${id} 的長度不變`, 0.01));
});

test("第 359 種:橫桿在上時繩在心軸上捲約 2.5 圈(原圖);按到底時繩完全解開;繩的一端繫在橫桿端", () => {
  const S = m359.STROKE;
  for (const id of ["cordL", "cordR"]) {
    const top = wraps359(d359.pose(0).paths[id].points);
    assert.ok(top > 2.2 && top < 2.8, `${id}:橫桿在上時捲 ${top.toFixed(2)} 圈`);
    assert.ok(wraps359(d359.pose(S).paths[id].points) < 0.05, `${id}:按到底時繩完全解開`);
    assert.ok(wraps359(d359.pose(2 * S).paths[id].points) > 2.2, `${id}:飛輪的動量把繩反方向捲回`);
  }
  for (const v of sweep(2 * S, 8)) {
    const pose = d359.pose(v);
    const end = pose.paths.cordR.points[0];
    close(Math.hypot(end[0] - 1.8, end[1] - pose.parts.bar.position[1], end[2]), 0, "繩繫在橫桿右端", 1e-9);
  }
});

test("第 359 種:心軸往下伸進鑽頭夾頭,鑽尖的柄插進夾頭", () => {
  const sp = part(d359, "spindle").pieces;
  const cyl = sp.filter((q) => q.kind === "cylinder");
  const shaft = cyl.reduce((a, b) => (a.length > b.length ? a : b));
  const chuck = cyl.find((q) => q !== shaft && q.radius > shaft.radius && q.at[2] < -1.5);
  const bit = sp.filter((q) => q.kind === "lathe").find((q) => Math.min(...q.profile.map((p) => p[1])) < -2.5);
  const range = (q) => [q.at[2] - q.length / 2, q.at[2] + q.length / 2];
  const [s0] = range(shaft);
  const [c0, c1] = range(chuck);
  assert.ok(s0 > c0 && s0 < c1 - 0.05, "心軸下端伸進夾頭");
  const bitTop = Math.max(...bit.profile.map((p) => p[1]));
  assert.ok(bitTop > c0 + 0.05 && bitTop < c1, "鑽尖的柄插進夾頭");
});

const d360 = m360.default;
test("第 360 種:樑擺動時,鼓輪經棘爪與棘輪帶動飛輪軸只朝一個方向(原圖逆時針)轉;飛輪連續旋轉", () => {
  const S = m360.SWING;
  const fs = sweep(8 * S, 400).map((v) => m360.beam(v).fly);
  assert.ok(fs.every((f, i) => i === 0 || f > fs[i - 1]), "飛輪只朝一個方向(逆時針)轉,而且不停(由擺動運動所產生的連續旋轉運動)");
  // 鼓輪往回轉時,棘爪不帶飛輪:飛輪靠動量繼續往前、越轉越慢
  const back = [2.2, 2.6, 3.0, 3.4].map((k) => m360.beam(k * S));
  assert.ok(back.every((b) => !b.engaged), "回擺時棘爪沒有推");
  assert.ok(back[1].drum < back[0].drum, "鼓輪反轉");
  const d = back.slice(1).map((b, i) => b.fly - back[i].fly);
  assert.ok(d[0] > d[1] && d[1] > d[2] && d[2] > 0, "滑行越來越慢");
  // 推的時候棘輪和鼓輪鎖在一起;每一程推完正好前進一程(3 齒)
  const [p1, p2] = [m360.beam(1.2 * S), m360.beam(1.8 * S)];
  assert.ok(p1.engaged && p2.engaged);
  close(p2.fly - p1.fly, p2.drum - p1.drum, "推動時飛輪跟著鼓輪轉", 1e-9);
  close(m360.beam(6 * S).fly - m360.beam(2 * S).fly, m360.stroke.SPAN, "每一程前進一程", 1e-9);
  close(m360.stroke.SPAN, m360.stroke.STROKE_TEETH * m360.stroke.PITCH, "一程剛好整數齒(棘爪每程在同一個相位碰上齒面)", 1e-9);
  assert.ok(m360.stroke.returnCoast < m360.stroke.PITCH, "回程裡飛輪滑行不到一齒:下一程棘爪碰上的是面前第一個齒面,不會走過齒面");
});

test("第 360 種:右端弧形頭的繩照原圖沿鼓輪右側鉛直落下、捲在鼓輪上:樑右端往上時鼓輪逆時針轉", () => {
  const drum = part(d360, "drum");
  const S = m360.SWING;
  for (const v of sweep(4 * S, 32)) {
    const pts = d360.pose(v).paths.ropeR.points;
    let k = 0;
    pts.slice(1).forEach((p, i) => {
      if (Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]) > Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1])) k = i;
    });
    const [a, b] = [pts[k], pts[k + 1]];
    close(a[0], b[0], `擺動 ${v.toFixed(2)}:繩鉛直落下`, 1e-6);
    const rho = Math.hypot(b[0] - drum.center[0], b[1] - drum.center[1]);
    close(b[0] - drum.center[0], rho, `擺動 ${v.toFixed(2)}:繩在鼓輪右側的切點落到鼓輪上`, 1e-6);
    const wound = pts.slice(k + 1);
    assert.ok(wound.length > 4 && wound.every((p) => Math.abs(Math.hypot(p[0] - drum.center[0], p[1] - drum.center[1]) - rho) < 1e-6), `擺動 ${v.toFixed(2)}:繩捲在鼓輪上`);
  }
  const [p0, p1] = [d360.pose(0.2 * S), d360.pose(0.6 * S)];
  assert.ok(p1.parts.beam.angle > p0.parts.beam.angle, "樑右端往上");
  assert.ok(p1.parts.drum.angle > p0.parts.drum.angle, "鼓輪逆時針轉(原圖)");
});

test("第 360 種:兩條繩的長度全程不變", () => {
  const S = m360.SWING;
  for (const id of ["ropeR", "ropeL"]) {
    const L0 = pathLength(d360.pose(0).paths[id].points);
    for (const v of sweep(4 * S, 80)) close(pathLength(d360.pose(v).paths[id].points), L0, `擺動 ${v.toFixed(3)}:${id} 長度不變`, 2e-3);
  }
});

test("第 360 種:鼓輪的渦卷彈簧(推斷)內端在鼓輪上、外端插在機架上:繩拉著鼓輪轉時上緊,樑往回擺時把鼓輪轉回", () => {
  const drum = part(d360, "drum");
  const c = drum.center;
  const wire = part(d360, "spring").radius;
  const S = m360.SWING;
  const ang = (p) => Math.atan2(p[1] - c[1], p[0] - c[0]);
  const wrapA = (x) => Math.atan2(Math.sin(x), Math.cos(x));
  // 量彈簧路徑本身:從內端到外端繞了幾圈
  const turns = (pts) => Math.abs(pts.slice(1).reduce((s, p, i) => s + wrapA(ang(p) - ang(pts[i])), 0)) / (2 * Math.PI);
  // 輪轂:鼓輪後面、比鼓輪小的那一段圓柱
  const hub = drum.pieces.filter((q) => q.kind === "cylinder" && (q.at?.[2] ?? 0) < 0 && q.radius < 0.5).reduce((a, b) => (a.radius > b.radius ? a : b));
  const hz = [c[2] + hub.at[2] - hub.length / 2, c[2] + hub.at[2] + hub.length / 2];
  const boxes = part(d360, "frame").pieces.filter((q) => q.kind === "box").map((q) => pieceBox(q));
  const p0 = d360.pose(0);
  const out0 = p0.paths.spring.points.at(-1);
  assert.ok(boxes.some((b) => [0, 1, 2].every((k) => b.lo[k] - 1e-9 <= out0[k] && out0[k] <= b.hi[k] + 1e-9)), "外端插在機架的柱頂");
  const local = (p, a) => rot2([p[0] - c[0], p[1] - c[1]], -a); // 鼓輪的局部座標
  const in0 = local(p0.paths.spring.points[0], p0.parts.drum.angle);
  const rows = sweep(4 * S, 40).map((v) => {
    const pose = d360.pose(v);
    const pts = pose.paths.spring.points;
    const a = pose.parts.drum.angle;
    const inner = pts[0];
    close(Math.hypot(inner[0] - c[0], inner[1] - c[1]), hub.radius + wire, `擺動 ${v.toFixed(3)}:內端貼在輪轂外緣`, 1e-6);
    assert.ok(hz[0] <= inner[2] && inner[2] <= hz[1], `擺動 ${v.toFixed(3)}:內端和輪轂在同一個深度`);
    close(dist([...local(inner, a), 0], [...in0, 0]), 0, `擺動 ${v.toFixed(3)}:內端固定在輪轂上、跟著鼓輪轉`, 1e-6);
    close(dist(pts.at(-1), out0), 0, `擺動 ${v.toFixed(3)}:外端停在柱頂不動`, 1e-9);
    // 相鄰兩圈不互相穿過:沿每個方向,彈簧線依序穿過那條射線的半徑往外遞增,相鄰兩次相差至少一個線徑
    for (let k = 0; k < 24; k++) {
      const ray = (k * Math.PI) / 12;
      const rs = [];
      pts.slice(1).forEach((q, i) => {
        const [da, db] = [wrapA(ang(pts[i]) - ray), wrapA(ang(q) - ray)];
        if (((da <= 0 && db > 0) || (da >= 0 && db < 0)) && Math.abs(da - db) < 1) {
          const t = da / (da - db);
          rs.push(Math.hypot(...[0, 1].map((j) => pts[i][j] + (q[j] - pts[i][j]) * t - c[j])));
        }
      });
      assert.ok(rs.length >= 3, `擺動 ${v.toFixed(3)}:每個方向都繞了好幾圈`);
      rs.slice(1).forEach((r, i) => assert.ok(r - rs[i] > 2 * wire, `擺動 ${v.toFixed(3)}:相鄰兩圈之間有空隙(${(r - rs[i]).toFixed(3)})`));
    }
    return { drum: a, turns: turns(pts) };
  });
  // 上緊:鼓輪往前(逆時針)轉得越多,彈簧繞的圈數越多;一程裡看得出變化
  const sorted = [...rows].sort((a, b) => a.drum - b.drum);
  sorted.slice(1).forEach((r, i) => assert.ok(r.drum - sorted[i].drum < 1e-9 || r.turns > sorted[i].turns, "鼓輪往前轉,彈簧繞得更緊(圈數變多)"));
  assert.ok(sorted.at(-1).turns - sorted[0].turns > 0.2, `一程裡彈簧圈數的變化看得出來(${(sorted.at(-1).turns - sorted[0].turns).toFixed(2)} 圈)`);
  // 往回擺時鼓輪轉回原處(彈簧放鬆);繩在上面驗過一直拉緊、長度不變
  close(d360.pose(4 * S).parts.drum.angle, p0.parts.drum.angle, "樑擺回起點時鼓輪轉回原處", 1e-9);
});

test("第 360 種:球的中心開了一個鉛直的孔,左繩從孔裡穿過、不碰球(不靠豁免)", () => {
  const ball = part(d360, "ball");
  const rope = part(d360, "ropeL");
  assert.equal(ball.kind, "lathe", "球是帶中孔的旋轉體");
  assert.deepEqual(ball.axis, [0, 1, 0], "孔沿鉛直方向(繩的方向)");
  const hole = Math.min(...ball.profile.map((p) => p[0]));
  assert.ok(hole >= rope.radius && hole < rope.radius + 0.02, `孔(半徑 ${hole})比繩粗一點`);
  for (const v of sweep(2 * m360.SWING, 8)) {
    const pose = d360.pose(v);
    const b = pose.parts.ball.position;
    const inBall = pose.paths.ropeL.points.filter((p) => Math.abs(p[1] - b[1]) < 0.3);
    assert.ok(inBall.length >= 2 && inBall.every((p) => Math.hypot(p[0] - b[0], p[2] - b[2]) + rope.radius <= hole + 1e-9), `擺動 ${v.toFixed(3)}:繩在孔裡`);
  }
  assert.ok(!(d360.waivers ?? []).some((w) => w.parts?.includes("ball")), "球與繩不用豁免");
});

test("第 360 種:左繩沿左弧形頭垂下、穿過球,球下面還垂著一段(讓人拉動樑的拉繩,球是握把)", () => {
  const ball = part(d360, "ball");
  for (const v of sweep(2 * m360.SWING, 8)) {
    const pose = d360.pose(v);
    const pts = pose.paths.ropeL.points;
    const b = pose.parts.ball.position;
    const low = Math.min(...pts.map((p) => p[1]));
    const R = ball.radius ?? Math.max(...ball.profile.map((q) => q[0]));
    assert.ok(b[1] - R - low > 1.5 * 2 * R, "球下還垂著約兩個球徑長的繩");
    const through = (p) => Math.abs(p[0] - b[0]) < 1e-9 && Math.abs(p[2] - b[2]) < 1e-9;
    assert.ok(pts.some((p) => through(p) && p[1] > b[1] + R) && pts.some((p) => through(p) && p[1] < b[1] - R), "繩從球的中心穿過");
  }
});

test("第 360 種:樑的樞軸是一根銷,從樑的輪轂穿進 A 形架頂", () => {
  const beam = part(d360, "beam");
  const frame = part(d360, "frame");
  const hub = beam.pieces.find((q) => q.kind === "cylinder");
  const pin = frame.pieces.find((q) => q.kind === "cylinder" && !q.inner && Math.hypot(q.at[0] - beam.center[0], q.at[1] - beam.center[1]) < 1e-9);
  assert.ok(pin, "A 形架頂上有樑的樞銷");
  close(hub.inner, pin.radius, "樞銷穿過樑的輪轂孔", 1e-9);
  const zr = (q, o = 0) => [o + (q.at?.[2] ?? 0) - q.length / 2, o + (q.at?.[2] ?? 0) + q.length / 2];
  const [p0, p1] = zr(pin);
  const [h0, h1] = zr(hub, beam.center[2]);
  assert.ok(p0 <= h0 && p1 >= h1, "銷穿過整個輪轂");
  const plate = frame.pieces.find((q) => q.kind === "plate");
  assert.ok(p0 < plate.at[2] + plate.thickness / 2 - 0.05, "銷伸進 A 形架");
  assert.ok(inSolid([beam.center[0], beam.center[1]], plate.shape), "銷在 A 形架頂上");
});

const d361 = m361.default;
// 沿 x 軸的零件上沿局部 z(= 世界 x)的銷:世界座標的軸線範圍與位置
function axialPin361(id, pose) {
  const p = part(d361, id);
  const q = p.pieces.find((s) => s.kind === "cylinder" && s.at?.[1] > 0.3 && s.radius < 0.1);
  const pp = pose.parts[id];
  const c = pp.position ?? p.center;
  const ends = [q.at[2] - q.length / 2, q.at[2] + q.length / 2].map((z) => partPoint(c, X, pp.angle ?? 0, [q.at[0], q.at[1], z]));
  return { x0: Math.min(ends[0][0], ends[1][0]), x1: Math.max(ends[0][0], ends[1][0]), y: ends[0][1], z: ends[0][2], r: q.radius, c };
}

test("第 361 種:接合時皮帶輪側面的銷伸到軸上的銷旁邊(軸向重疊),在側面推著它轉(間隙 0、不穿入)", () => {
  for (const a of sweep(2 * Math.PI, 24)) {
    const pose = d361.pose(a, "on");
    const s = axialPin361("lowerShaft", pose);
    const p = axialPin361("pulley", pose);
    assert.ok(Math.min(s.x1, p.x1) - Math.max(s.x0, p.x0) > 0.1, `曲柄轉 ${a.toFixed(2)}:兩銷沿軸向重疊`);
    close(Math.hypot(s.y - p.y, s.z - p.z), s.r + p.r, `曲柄轉 ${a.toFixed(2)}:兩銷側面相碰`, 1e-6);
    const ahead = Math.atan2(s.z - s.c[2], s.y - s.c[1]) - Math.atan2(p.z - p.c[2], p.y - p.c[1]);
    assert.ok(Math.atan2(Math.sin(ahead), Math.cos(ahead)) > 0, "軸上的銷在皮帶輪的銷前面(被推的那一側)");
  }
  close(turned(d361, "lowerShaft", 0.5, 2.5, "on"), turned(d361, "pulley", 0.5, 2.5, "on"), "接合時下方軸跟著皮帶輪轉");
});

test("第 361 種:脫開時皮帶輪的銷退到軸上的銷外面(軸向不重疊),皮帶輪空轉、下方軸停住", () => {
  for (const a of sweep(2 * Math.PI, 24)) {
    const pose = d361.pose(a, "off");
    const s = axialPin361("lowerShaft", pose);
    const p = axialPin361("pulley", pose);
    assert.ok(Math.max(s.x0, p.x0) - Math.min(s.x1, p.x1) > 0.05, `曲柄轉 ${a.toFixed(2)}:兩銷沿軸向分開`);
  }
  close(turned(d361, "lowerShaft", 0.5, 2.5, "off"), 0, "脫開時軸不轉");
  assert.ok(Math.abs(turned(d361, "pulley", 0.5, 2.5, "off")) > 1, "皮帶輪照轉");
});

// 網頁切換狀態的接續規則(viewer/viewer.js 的 setState 與 apply):畫出的轉角 = pose 的轉角 + 偏移;
// 切換時,沒標 posed 的零件的偏移改成「切換前畫出的轉角 − 新狀態的轉角」(接續、不跳動);
// posed 為 true、或是列出新狀態的陣列時不接續,偏移歸零,畫出新狀態 pose 的轉角。
// frames:依序的 [曲柄轉角, 狀態];回傳每一格畫出的姿勢(轉角換成畫出的轉角)
function replay361(frames) {
  const offsets = {};
  const shown = {};
  let prev = null;
  return frames.map(([a, state]) => {
    const pose = d361.pose(a, state);
    if (prev && state !== prev) {
      for (const [id, p] of Object.entries(pose.parts)) {
        const posed = part(d361, id).posed;
        if (posed === true || (Array.isArray(posed) && posed.includes(state))) delete offsets[id];
        else if (p.angle != null && shown[id] != null) offsets[id] = shown[id] - p.angle;
      }
    }
    prev = state;
    const parts = {};
    for (const [id, p] of Object.entries(pose.parts)) {
      parts[id] = p.angle == null ? p : { ...p, angle: p.angle + (offsets[id] ?? 0) };
      if (p.angle != null) shown[id] = parts[id].angle;
    }
    return { a, state, pose: { ...pose, parts } };
  });
}

test("第 361 種:在網頁上脫開時下方軸停在原處;再接合時(不論脫開時皮帶輪轉了多少)兩根銷又是側面相碰", () => {
  for (const [a1, a2] of [[1, 2.3], [0.4, 4.1], [2, 2.9], [3, 9.7]]) {
    const frames = [...sweep(a1, 6).map((a) => [a, "on"]), ...sweep(a2, 6, a1).map((a) => [a, "off"]), ...sweep(a2 + 3, 12, a2).map((a) => [a, "on"])];
    const shown = replay361(frames);
    const stop = shown.findIndex((f) => f.state === "off");
    for (const f of shown.filter((f) => f.state === "off")) close(f.pose.parts.lowerShaft.angle, shown[stop - 1].pose.parts.lowerShaft.angle, `脫開(曲柄轉 ${f.a.toFixed(2)}):下方軸停在脫開那一刻的位置`, 1e-9);
    for (const f of shown.filter((f, i) => f.state === "on" && i > stop)) {
      const s = axialPin361("lowerShaft", f.pose);
      const p = axialPin361("pulley", f.pose);
      close(Math.hypot(s.y - p.y, s.z - p.z), s.r + p.r, `${a1} 脫開、${a2} 再接合後曲柄轉 ${f.a.toFixed(2)}:兩銷側面相碰`, 1e-6);
    }
  }
});

test("第 361 種:推皮帶輪的彎槓桿繞右立柱上的樞軸擺動,下端的銷夾在輪轂兩個環之間", () => {
  const lever = part(d361, "lever");
  const frame = part(d361, "frame");
  const pivotPin = frame.pieces.find((q) => q.kind === "cylinder" && Math.hypot(q.at[0] - lever.center[0], q.at[1] - lever.center[1]) < 1e-9);
  assert.ok(pivotPin, "立柱上有槓桿的樞銷");
  const post = frame.pieces.map((q) => pieceBox(q)).find((b) => b.hi[1] - b.lo[1] > 3 && b.lo[0] <= lever.center[0] && lever.center[0] <= b.hi[0]);
  assert.ok(post, "樞軸在右立柱上");
  const pb = pieceBox(pivotPin);
  const plate = lever.pieces.find((q) => q.kind === "plate");
  const lz = [lever.center[2] + plate.at[2] - plate.thickness / 2, lever.center[2] + plate.at[2] + plate.thickness / 2];
  assert.ok(pb.lo[2] <= lz[0] && pb.hi[2] > post.lo[2] + 0.05, "樞銷從槓桿穿進立柱");
  const pin = lever.pieces.find((q) => q.kind === "cylinder");
  const pulley = part(d361, "pulley");
  const hub = pulley.pieces.find((q) => q.kind === "cylinder" && q.radius > 0.1 && q.radius < 0.3 && q.length > 0.3);
  const collars = pulley.pieces.filter((q) => q.kind === "cylinder" && q.radius > hub.radius && q.radius < 0.5);
  assert.equal(collars.length, 2, "輪轂上兩個環");
  const angles = {};
  for (const st of ["on", "off"]) {
    const pose = d361.pose(1, st);
    angles[st] = pose.parts.lever.angle;
    const c = partPoint(lever.center, [0, 0, 1], pose.parts.lever.angle, pin.at);
    const px = pose.parts.pulley.position[0];
    const faces = collars.map((q) => [px + q.at[2] - q.length / 2, px + q.at[2] + q.length / 2]).sort((a, b) => a[0] - b[0]);
    const gaps = [c[0] - pin.radius - faces[0][1], faces[1][0] - (c[0] + pin.radius)];
    assert.ok(gaps.every((g) => g >= -1e-9 && g < 0.003), `${st}:銷夾在兩環之間(間隙 ${gaps.map((g) => g.toFixed(4))})`);
    const axisY = pose.parts.pulley.position[1];
    const pz = [c[2] - pin.length / 2, c[2] + pin.length / 2];
    assert.ok(pz.every((z) => z < -hub.radius), `${st}:銷在輪轂後面,不碰輪轂`);
    assert.ok(Math.hypot(c[1] - axisY, pz[1]) < collars[0].radius - pin.radius, `${st}:銷伸到環的範圍裡`);
  }
  assert.ok(Math.abs(angles.on - angles.off) > 0.05, "切換狀態時槓桿繞樞軸擺動");
});

test("第 361 種:左端的飛輪是裝在軸上的實心碟;兩根軸穿過立柱,立柱站在底座上(推斷)", () => {
  const up = part(d361, "upper").pieces.filter((q) => q.kind === "cylinder");
  const fly = up.reduce((a, b) => (a.radius > b.radius ? a : b));
  const shaft = up.reduce((a, b) => (a.length > b.length ? a : b));
  const zr = (q) => [(q.at?.[2] ?? 0) - q.length / 2, (q.at?.[2] ?? 0) + q.length / 2];
  assert.ok(!fly.inner, "飛輪是實心碟,不是浮在軸外的環");
  assert.ok(zr(shaft)[0] < zr(fly)[1] - 0.05, "軸穿進飛輪");
  const frame = part(d361, "frame");
  assertOnePiece(frame, "兩根立柱接在底座上,機架連成一件");
  const posts = frame.pieces.filter((q) => q.kind === "box" && q.size[1] > 3).map((q) => pieceBox(q));
  assert.equal(posts.length, 2, "兩根立柱(原圖)");
  for (const b of posts) assert.ok(b.lo[2] < -0.07 && b.hi[2] > 0.07, "軸(z = 0)穿過立柱");
});

test("第 362 種:銷在下方圓筒的傾斜溝槽中,圓筒轉一圈,上方軸與鼓輪橫移一個來回", () => {
  const xs = sweep(2 * Math.PI, 72).map(m362.traverse);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.8, "橫移");
  close(m362.traverse(2 * Math.PI), m362.traverse(0), "一圈回到原處", 1e-12);
});

// 點到線段的距離(三維)
function segDist(p, a, b) {
  const ab = sub(b, a);
  const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / dot(ab, ab)));
  return dist(p, add(a, scale(ab, t)));
}
// 點到有限圓柱(圓心 c、單位軸 axis、半長 half、半徑 r)表面的距離;在圓柱裡面為負
function cylinderDist(p, c, axis, half, r) {
  const d = sub(p, c);
  const t = dot(d, axis);
  const radial = len(sub(d, scale(axis, t)));
  const over = Math.abs(t) - half;
  if (over <= 0) return radial <= r ? Math.max(radial - r, over) : radial - r;
  return radial <= r ? over : Math.hypot(over, radial - r);
}
// 折線(tube 的 points)細分成密的點
const densify = (points, n = 8) => points.slice(1).flatMap((b, i) => Array.from({ length: n }, (_, k) => lerp3(points[i], b, k / n)));

test("第 362 種:銷在溝槽裡作動:溝槽最陡處也比銷寬,銷全程不碰凸棱,兩側都有凸棱夾著", () => {
  const def = m362.default;
  const cyl = def.parts.find((p) => p.id === "cylinder");
  const ribs = cyl.pieces.filter((q) => q.kind === "tube");
  const up = def.parts.find((p) => p.id === "upper");
  const pin = up.pieces.find((q) => q.axis === Y || (q.axis && q.axis[1] === 1));
  for (const theta of sweep(2 * Math.PI, 360)) {
    const { upper, cylinder } = def.pose(theta).parts;
    const c = add(pin.at, upper.position);
    const [a, b] = [add(c, [0, -pin.length / 2, 0]), add(c, [0, pin.length / 2, 0])];
    // 每道凸棱的點換到世界座標,量到銷的軸線的距離,扣掉銷與凸棱的半徑就是間隙
    const gaps = ribs.map((rib) => Math.min(...densify(rib.points).map((q) => segDist(partPoint(cyl.center, cyl.axis, cylinder.angle, q), a, b))) - pin.radius - rib.radius);
    assert.ok(Math.min(...gaps) >= 0, `θ = ${theta.toFixed(2)}:銷不穿進凸棱(間隙 ${gaps.map((g) => g.toFixed(3))})`);
    assert.ok(Math.max(...gaps) < 0.03, `θ = ${theta.toFixed(2)}:銷的兩側都有凸棱夾著(間隙 ${gaps.map((g) => g.toFixed(3))})`);
  }
});

test("第 362 種:鼓輪的橫移全程收在兩根立柱之間,上方軸全程穿過兩根立柱", () => {
  const def = m362.default;
  const up = def.parts.find((p) => p.id === "upper");
  const [shaft, drum] = up.pieces.filter((q) => q.kind === "cylinder" && q.axis === X).sort((p, q) => p.radius - q.radius);
  const posts = def.parts
    .find((p) => p.id === "frame")
    .pieces.filter((q) => q.kind === "box" && q.at[1] - q.size[1] / 2 < drum.at[1] && drum.at[1] < q.at[1] + q.size[1] / 2)
    .map((q) => [q.at[0] - q.size[0] / 2, q.at[0] + q.size[0] / 2]);
  for (const theta of sweep(2 * Math.PI, 72)) {
    const dx = def.pose(theta).parts.upper.position[0];
    const [d0, d1] = [drum.at[0] + dx - drum.length / 2, drum.at[0] + dx + drum.length / 2];
    assert.ok(posts.every(([p0, p1]) => p1 < d0 || d1 < p0), `θ = ${theta.toFixed(2)}:鼓輪(${d0.toFixed(2)}..${d1.toFixed(2)})不穿進立柱`);
    assert.ok(posts.some(([, p1]) => p1 < d0) && posts.some(([p0]) => d1 < p0), "鼓輪兩側都有立柱");
    const [s0, s1] = [shaft.at[0] + dx - shaft.length / 2, shaft.at[0] + dx + shaft.length / 2];
    const holding = posts.filter(([p0, p1]) => s0 < p0 && p1 < s1);
    assert.equal(holding.length, posts.length, `θ = ${theta.toFixed(2)}:上方軸(${s0.toFixed(2)}..${s1.toFixed(2)})整段穿過每根立柱`);
  }
});

// 第 364 種的「一格」從外形量:相鄰兩道斜棱下端的角距;凸柱數從小輪上的滾子數
function ribPitch364() {
  const def = m364.default;
  const ends = part(def, "big").pieces.filter((q) => q.kind === "tube").map((q) => Math.atan2(q.points[0][1], q.points[0][0])).sort((a, b) => a - b);
  const gaps = ends.map((a, i) => (i ? a - ends[i - 1] : a + 2 * Math.PI - ends.at(-1)));
  for (const g of gaps) close(g, gaps[0], "斜棱等距排一圈", 1e-9);
  return { pitch: gaps[0], studs: part(def, "small").pieces.filter((q) => q.kind === "cylinder" && q.axis).length };
}
const bigTurn364 = (a, b) => m364.default.pose(b).parts.big.angle - m364.default.pose(a).parts.big.angle;

test("第 364 種:小輪連續旋轉,大輪間歇旋轉:每根凸柱的滾子推著斜棱走過時推一格,其餘時間不動", () => {
  const { pitch, studs } = ribPitch364();
  const per = (2 * Math.PI) / studs;
  close(Math.abs(bigTurn364(0, -per)), pitch, "每根凸柱推一格(大輪轉過相鄰兩道斜棱的角距)", 1e-9);
  const as = sweep(-2 * Math.PI, 720).map(m364.bigAngle);
  assert.ok(as.every((a, i) => i === 0 || a >= as[i - 1] - 1e-12), "大輪只朝一個方向轉");
  const still = as.slice(1).filter((a, i) => Math.abs(a - as[i]) < 1e-12).length;
  assert.ok(still > 0.3 * as.length, "間歇:滾子走在斜棱之外的時候大輪停住(至少三成的時間)");
});

test("第 364 種:大輪照原圖:半徑約是凸柱伸出長度的 1.5 倍,一圈 12 道斜棱、每道從下端斜到上端跨一格,只占輪面中段;小輪一圈推 8 格", () => {
  const def = m364.default;
  const small = def.parts.find((p) => p.id === "small");
  const big = def.parts.find((p) => p.id === "big");
  const reach = Math.max(...small.pieces.filter((q) => q.kind === "cylinder" && q.axis).map((q) => Math.hypot(q.at[0], q.at[1])));
  const wheel = big.pieces.reduce((m, q) => (q.kind === "cylinder" && q.radius > (m?.radius ?? 0) ? q : m), null);
  const ratio = wheel.radius / reach;
  assert.ok(ratio > 1.4 && ratio < 1.65, `大輪半徑 / 凸柱伸出長度 = ${ratio.toFixed(2)}(原圖約 1.5)`);
  const ribs = big.pieces.filter((q) => q.kind === "tube");
  assert.equal(ribs.length, 12, "原圖一圈約 12 道斜溝");
  for (const rib of ribs) {
    const [p, q] = [rib.points[0], rib.points.at(-1)];
    const span = Math.atan2(p[0] * q[1] - p[1] * q[0], p[0] * q[0] + p[1] * q[1]);
    close(Math.abs(span), (2 * Math.PI) / 12, "每道斜棱從下端到上端跨一格", 1e-9);
    assert.ok(Math.abs(q[2] - p[2]) < 0.6 * wheel.length, "斜棱只占輪面中段(上下留出滾子走過時大輪停住的空檔)");
  }
  const { pitch, studs } = ribPitch364();
  assert.equal(studs, 8, "小輪一圈八根凸柱(原圖)");
  close(Math.abs(bigTurn364(0, -2 * Math.PI)), studs * pitch, "小輪轉一圈,每根凸柱各推一格:大輪轉過 8 道斜棱的角距", 1e-9);
});

test("第 364 種:由接觸算:推動時滾子貼著斜棱,全程不穿進任何斜棱", () => {
  const def = m364.default;
  const small = def.parts.find((p) => p.id === "small");
  const big = def.parts.find((p) => p.id === "big");
  const rollers = small.pieces.filter((q) => q.kind === "cylinder" && q.axis);
  const ribs = big.pieces.filter((q) => q.kind === "tube");
  let pushes = 0;
  for (const theta of sweep(-2 * Math.PI / 8, 240)) {
    const { small: s, big: b } = def.pose(theta).parts;
    const ribPts = ribs.map((rib) => densify(rib.points.map((p) => partPoint(big.center, big.axis, b.angle, p)), Math.ceil(240 / (rib.points.length - 1))));
    const gaps = rollers.map((r) => {
      const c = partPoint(small.center, small.axis ?? Z, s.angle, r.at);
      const axis = sub(partPoint(small.center, small.axis ?? Z, s.angle, add(r.at, r.axis)), c);
      return Math.min(...ribPts.map((pts, i) => Math.min(...pts.map((p) => cylinderDist(p, c, axis, r.length / 2, r.radius))) - ribs[i].radius));
    });
    assert.ok(Math.min(...gaps) > -0.005, `θ = ${theta.toFixed(3)}:滾子不穿進斜棱(${Math.min(...gaps).toFixed(4)})`);
    if (m364.drive(theta).y !== null) {
      pushes++;
      assert.ok(Math.min(...gaps) < 0.01, `θ = ${theta.toFixed(3)}:推著的時候滾子貼著斜棱(間隙 ${Math.min(...gaps).toFixed(4)})`);
    }
  }
  assert.ok(pushes > 0);
});

test("第 366 種:鑽床:大傘齒輪帶動鑽桿旋轉;踩下踏板時鑽桿被壓下,但照樣跟著小傘齒輪轉", () => {
  const def = m366.default;
  const up = def.pose(1.3, "up").parts.spindle;
  const down = def.pose(1.3, "down").parts.spindle;
  close(up.angle, down.angle, "鑽桿在小傘齒輪中滑動,仍一起轉");
  assert.ok(up.position[1] - down.position[1] > 0.3, `踩下踏板,鑽桿下降(${(up.position[1] - down.position[1]).toFixed(3)})`);
  close(Math.abs(m366.drill(1) - m366.drill(0)), 30 / 12, "轉速比 = 齒數比", 1e-9);
});

// ── 第 366 種(model-audit-fixes-3 票 30) ──

/** 繞 z 轉的零件(板件、群組)在姿勢下:局部的點換到世界座標 */
const toWorld = (pose, [x, y]) => {
  const [u, v] = rot2([x, y], pose.angle ?? 0);
  return [u + pose.position[0], v + pose.position[1]];
};
const near = (a, b, eps = 1e-9) => Math.hypot(a[0] - b[0], a[1] - b[1]) < eps;
/** 穿過 z0..z1 整個深度的銷 */
const spanning = (pins, z0, z1) => pins.filter((p) => p.z0 <= z0 + 1e-9 && p.z1 >= z1 - 1e-9);
/** 板件零件在姿勢下佔的深度 */
const depthOf = (p, pose) => [pose.position[2] - p.thickness / 2, pose.position[2] + p.thickness / 2];

test("第 366 種:踩下踏板(長的右端往下),短的左端抬起、經直桿推起槓桿左端,槓桿右端把鑽桿壓下(原文「透過連接於上方槓桿的踏板加以下壓」;原圖槓桿支點在中間、踏板支點在左邊地上)", () => {
  const def = m366.default;
  const lever = part(def, "lever");
  const treadle = part(def, "treadle");
  assert.equal(lever.kind, "plate", "槓桿是一塊繞支點轉的板");
  assert.equal(treadle.kind, "plate", "踏板是一塊繞支點轉的板");
  const framePins = zPins(part(def, "frame"));
  const at = (state) => {
    const pose = def.pose(0.7, state).parts;
    const rod = pose.rodToTreadle;
    // 直桿兩端各套在槓桿、踏板往前伸的銷上
    const pinOn = (p, end) => zPins(p).find((q) => near(toWorld(pose[p.id], q.c), end) && q.z1 + pose[p.id].position[2] >= end[2]);
    const L = pinOn(lever, rod.from);
    const T = pinOn(treadle, rod.to);
    assert.ok(L && T, `${state}:直桿上端套在槓桿的銷上、下端套在踏板的銷上`);
    // 槓桿與踏板都繞機架上的銷擺
    assert.ok(spanning(framePins, ...depthOf(lever, pose.lever)).some((q) => near(q.c, pose.lever.position)), `${state}:槓桿的支點是機架上穿過槓桿的銷`);
    assert.ok(spanning(framePins, ...depthOf(treadle, pose.treadle)).some((q) => near(q.c, pose.treadle.position)), `${state}:踏板的支點是機架上穿過踏板的銷`);
    // 鑽桿頂的套環上的銷,穿在槓桿右端的長孔裡
    const swivel = spanning(zPins(part(def, "swivel"), pose.swivel.position), ...depthOf(lever, pose.lever));
    assert.equal(swivel.length, 1, `${state}:套環上有一根銷穿過槓桿`);
    const S = toLocal(pose.lever, swivel[0].c);
    const g = guidedBetween(S, swivel[0].r, [lever.shape]);
    assert.ok(g.open && g.depth < 0.005 && g.sides, `${state}:套環的銷在槓桿的長孔裡、兩側貼著孔壁(穿入 ${g.depth.toFixed(3)})`);
    return { pose, rod, L: toWorld(pose.lever, L.c), T: toWorld(pose.treadle, T.c), lx: L.c[0], tx: T.c[0], sx: S[0], S: swivel[0].c };
  };
  const up = at("up");
  const down = at("down");
  const length = (r) => Math.hypot(...[0, 1, 2].map((k) => r.to[k] - r.from[k]));
  close(length(down.rod), length(up.rod), "直桿長度不變", 1e-9);
  // 支點在中間:槓桿的支點在直桿的銷與長孔之間;踏板的支點在直桿的銷與腳踩的一端之間,腳踩的那一臂長
  assert.ok(up.lx < 0 && up.sx > 0, "槓桿的支點在左端(直桿)與右端(鑽桿頂)之間");
  const foot = Math.max(...treadle.shape.outline.map(([x]) => x));
  assert.ok(up.tx < 0 && foot > 3 * -up.tx, "踏板的支點在左端(直桿)與右端(腳踩)之間,腳踩的一臂長得多");
  // 踩下:右端往下 → 左端往上 → 直桿推起槓桿左端 → 槓桿右端往下壓鑽桿
  const footY = (s) => toWorld(s.pose.treadle, [foot, 0])[1];
  assert.ok(footY(down) < footY(up) - 0.5, "踩下時踏板的右端往下");
  assert.ok(down.T[1] > up.T[1] + 0.2, "踏板的左端抬起");
  assert.ok(down.L[1] > up.L[1] + 0.2, "直桿推起槓桿的左端");
  assert.ok(down.S[1] < up.S[1] - 0.3, "槓桿右端(套環的銷)往下");
  assert.ok(Math.abs(down.sx - up.sx) > 0.005, "套環的銷沿長孔滑(槓桿端走圓弧、鑽桿走直線)");
  const drop = up.pose.spindle.position[1] - down.pose.spindle.position[1];
  close(drop, up.S[1] - down.S[1], "鑽桿和套環一起下降", 1e-9);
  close(up.pose.swivel.position[0], up.pose.spindle.position[0], "套環套在鑽桿上", 1e-9);
});

test("第 366 種:小傘齒輪在大齒輪上方、齒朝下(原圖);踏板放開或踩下,鍵條都在小傘齒輪的輪轂裡(原文「透過鍵條與溝槽使其與傘齒輪一同旋轉」)", () => {
  const def = m366.default;
  const small = part(def, "smallGear");
  assert.ok(small.center[1] > m366.APEX[1] && small.axis[1] < 0, "小傘齒輪在錐頂上方,齒朝下");
  // 小齒輪(連輪轂)沿鑽桿佔的高度:局部 z 朝下(axis −y)
  const along = [{ z: 0, h: small.pieces[0].width }, ...small.pieces.slice(1).filter((q) => q.kind === "cylinder").map((q) => ({ z: q.at[2], h: q.length }))];
  const gearY = [Math.min(...along.map((q) => small.center[1] - q.z - q.h / 2)), Math.max(...along.map((q) => small.center[1] - q.z + q.h / 2))];
  const key = part(def, "spindle").pieces.find((q) => q.kind === "box" && q.accent);
  for (const state of ["up", "down"]) {
    const y = def.pose(0, state).parts.spindle.position[1] + key.at[2];
    const overlap = Math.min(gearY[1], y + key.size[2] / 2) - Math.max(gearY[0], y - key.size[2] / 2);
    assert.ok(overlap > 0.2, `${state}:鍵條伸進小傘齒輪的輪轂(重疊 ${overlap.toFixed(3)})`);
  }
});

test("第 366 種:大齒輪的軸只從輪轂往右穿出機架接曲柄,不伸到鑽桿;鑽桿穿過機架上下橫樑的軸承", () => {
  const def = m366.default;
  const big = part(def, "bigGear");
  // 大齒輪的局部 z 朝 −x:每一塊的 x 範圍
  const xs = big.pieces.filter((q) => q.kind === "cylinder").map((q) => big.center[0] - (q.at?.[2] ?? 0) - q.length / 2);
  const keyR = Math.max(...part(def, "spindle").pieces.filter((q) => q.kind === "box").map((q) => Math.abs(q.at[0]) + q.size[0] / 2));
  assert.ok(Math.min(...xs) >= big.center[0] - 1e-9, "軸從輪的中心往右伸,不穿過錐頂");
  assert.ok(big.center[0] - big.pieces[0].width / 2 > keyR + 0.03, "大齒輪的小端離鑽桿的鍵條有間隙");
  const frame = part(def, "frame").pieces;
  const shaft = big.pieces.find((q) => q.kind === "cylinder" && q.radius < 0.1 && !q.accent);
  assertShaftInBearings({ at: [big.center[0] - shaft.at[2], big.center[1], big.center[2]], axis: [1, 0, 0], radius: shaft.radius, length: shaft.length }, frame, "大齒輪的軸");
  const spindleShaft = part(def, "spindle").pieces[0];
  for (const state of ["up", "down"]) {
    const y = def.pose(0, state).parts.spindle.position[1];
    assertShaftInBearings({ at: [0, y + spindleShaft.at[2], 0], axis: [0, 1, 0], radius: spindleShaft.radius, length: spindleShaft.length }, frame, `${state}:鑽桿`);
    assert.equal(frame.filter((q) => q.inner && q.axis?.[1] === 1).length, 2, "上下橫樑各有一個軸承環");
  }
  assertOnePiece(part(def, "frame"), "機架(含槓桿支柱、踏板托架、底座)是一件");
});

test("第 366 種:夾頭套在鑽桿下端,鑽頭接在夾頭的底面", () => {
  const def = m366.default;
  const [shaft, chuck] = part(def, "spindle").pieces;
  const bit = part(def, "spindle").pieces.find((q) => q.kind === "lathe");
  const span = (q) => [q.at[2] - q.length / 2, q.at[2] + q.length / 2];
  const [c0, c1] = span(chuck);
  assert.ok(span(shaft)[0] > c0 && span(shaft)[0] < c1, "鑽桿下端伸進夾頭");
  close(Math.max(...bit.profile.map(([, z]) => z)), c0, "鑽頭的上端在夾頭的底面", 1e-9);
  assert.ok(Math.max(...bit.profile.map(([r]) => r)) <= chuck.radius, "鑽頭不比夾頭粗");
});

test("第 367 種:平行尺:尺葉保持平行,刻度指示兩尺葉之間的寬度", () => {
  for (const a of sweep(m367.RANGE[1], 6, m367.RANGE[0])) {
    const { lineStart, lineNow } = m367.default.pose(a).paths;
    close(lineAngle(lineStart.points), lineAngle(lineNow.points), "兩條線平行", 1e-12);
  }
  const angles = sweep(m367.RANGE[1], 10, m367.RANGE[0]).sort((a, b) => m367.ruler(a).gap - m367.ruler(b).gap);
  assert.ok(m367.ruler(angles.at(-1)).gap > m367.ruler(angles[0]).gap + 0.4, "擺開時寬度變大");
  // 「黃銅弧形外緣的指向可指示兩個尺葉之間的寬度」:弧固定在下尺葉上,與上尺葉刻度相交的位置(上尺葉局部座標)隨寬度單調移動
  const [s0, s1] = m367.SCALE;
  const marks = angles.map((a) => m367.reading(a) - m367.ruler(a).dx);
  const dir = Math.sign(marks.at(-1) - marks[0]);
  for (let i = 1; i < marks.length; i++) assert.ok(dir * (marks[i] - marks[i - 1]) > 0, "寬度越大,讀數越往刻度的另一頭");
  assert.ok(marks.every((x) => x >= s0 && x <= s1), "讀數始終落在刻度上");
});

// 第 367 種連桿上的孔(連桿局部座標的圓心、半徑)與連桿的深度範圍
function linkHoles367(link) {
  const plates = link.kind === "plate" ? [{ shape: link.shape, at: [0, 0, 0], thickness: link.thickness }] : link.pieces.filter((q) => q.kind === "plate");
  const holes = plates.flatMap((q) =>
    (q.shape.holes ?? []).map((h) => {
      const c = [h.reduce((s, p) => s + p[0], 0) / h.length, h.reduce((s, p) => s + p[1], 0) / h.length];
      return { c: [c[0] + (q.at?.[0] ?? 0), c[1] + (q.at?.[1] ?? 0)], r: Math.max(...h.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1]))), z: [(q.at?.[2] ?? 0) - q.thickness / 2, (q.at?.[2] ?? 0) + q.thickness / 2] };
    }),
  );
  return holes.sort((a, b) => a.c[0] - b.c[0]);
}

test("第 367 種:兩根連桿照原圖從上尺葉的樞軸往右下接到下尺葉", () => {
  const def = m367.default;
  for (const a of sweep(m367.RANGE[1], 10, m367.RANGE[0])) {
    const parts = def.pose(a).parts;
    for (const id of ["linkL", "linkR"]) {
      const link = def.parts.find((p) => p.id === id);
      const [lowEnd, highEnd] = linkHoles367(link).map((h) => partPoint(parts[id].position, Z, parts[id].angle, [...h.c, 0])).sort((p, q) => p[1] - q[1]);
      assert.ok(highEnd[0] < lowEnd[0] - 0.05, `${id}:上端在左、下端在右(上 ${highEnd[0].toFixed(2)},下 ${lowEnd[0].toFixed(2)})`);
    }
  }
});

test("第 367 種:連桿的四個鉸點都有鉚釘:尺葉上的鉚釘穿過連桿的孔", () => {
  const def = m367.default;
  const ruler = (id) => def.parts.find((p) => p.id === id);
  for (const a of sweep(m367.RANGE[1], 6, m367.RANGE[0])) {
    const parts = def.pose(a).parts;
    const origin = (id) => parts[id]?.position ?? ruler(id).center ?? [0, 0, 0];
    for (const id of ["linkL", "linkR"]) {
      const link = ruler(id);
      const holes = linkHoles367(link).map((h) => ({ ...h, w: partPoint(parts[id].position, Z, parts[id].angle, [...h.c, 0]) }));
      assert.equal(holes.length, 2, `${id} 兩端各一個孔`);
      const [low, high] = holes.sort((p, q) => p.w[1] - q.w[1]);
      for (const [hole, rid] of [[low, "lower"], [high, "upper"]]) {
        const o = origin(rid);
        const [hz0, hz1] = [parts[id].position[2] + hole.z[0], parts[id].position[2] + hole.z[1]];
        const rivet = (ruler(rid).pieces ?? []).find((q) => {
          if (q.kind !== "cylinder" || q.axis) return false;
          const c = add(o, q.at);
          return Math.hypot(c[0] - hole.w[0], c[1] - hole.w[1]) < 1e-6 && q.radius <= hole.r + 1e-9 && q.radius > hole.r - 0.01 && c[2] - q.length / 2 <= hz0 && c[2] + q.length / 2 >= hz1;
        });
        assert.ok(rivet, `連角 ${a.toFixed(2)}:${id} 接 ${rid} 的孔裡有 ${rid} 上的鉚釘,穿過整個連桿厚度`);
        const face = add(o, [0, 0, (ruler(rid).thickness ?? 0.1) / 2])[2];
        assert.ok(add(o, rivet.at)[2] - rivet.length / 2 <= face + 1e-9, "鉚釘從尺葉面上立起");
      }
    }
  }
});

// 第 368 種的零件:主動件(水平軸)上的正齒輪與垂直傘齒輪、圓筒上的水平傘齒輪與筒身、齒條上的齒與尖端
function parts368() {
  const def = m368.default;
  const drv = part(def, def.driver.part);
  const cyl = part(def, "cylinder");
  const rack = part(def, "rack");
  const gearsOf = (p) => (p.pieces ?? []).filter((q) => q.kind === "gear");
  const spur = gearsOf(drv).find((q) => !q.cone);
  const bevelV = gearsOf(drv).find((q) => q.cone);
  const bevelH = gearsOf(cyl).find((q) => q.cone);
  const body = cyl.pieces.filter((q) => q.kind === "cylinder").reduce((a, b) => (a.radius >= b.radius ? a : b));
  const teeth = rack.pieces.find((q) => q.kind === "rack");
  const tip = rack.pieces.find((q) => q.kind === "lathe");
  return { def, drv, cyl, rack, spur, bevelV, bevelH, body, teeth, tip };
}
// 群組零件上的一點(局部座標)在零件轉角 angle 時的世界位置
const at368 = (p, angle, local) => partPoint(p.center, p.axis, angle, local);
// 標記桿尖端的世界位置(lathe 的剖面從半徑 0 的尖端起;齒條只平移)
const tip368 = (v) => add(m368.default.pose(v).parts.rack.position, parts368().tip.at);
// 點到圓筒軸線的水平距離(圓筒的軸直立)
const fromAxis368 = (q) => Math.hypot(q[0] - parts368().cyl.center[0], q[2] - parts368().cyl.center[2]);

test("第 368 種:正齒輪帶動傘齒輪、藉此讓圓筒旋轉:正齒輪與垂直傘齒輪裝在同一根水平軸上,垂直傘齒輪咬著板上的水平傘齒輪,水平傘齒輪與圓筒同軸", () => {
  const { def, drv, cyl, spur, bevelV, bevelH, body } = parts368();
  assert.ok(spur && bevelV, "主動的水平軸上有正齒輪與傘齒輪");
  close(drv.axis[1], 0, "主動件的軸水平");
  const onAxis = (q) => !q.axis && Math.abs(q.at?.[0] ?? 0) < 1e-12 && Math.abs(q.at?.[1] ?? 0) < 1e-12;
  assert.ok(onAxis(spur) && onAxis(bevelV), "正齒輪與傘齒輪都在水平軸的軸線上");
  assert.ok(bevelH, "圓筒的直立軸上有傘齒輪");
  close(Math.abs(cyl.axis[1]), 1, "圓筒的軸直立");
  assert.ok(onAxis(bevelH) && onAxis(body), "水平傘齒輪與圓筒同軸");
  // 兩個傘齒輪的節錐頂重合、兩軸垂直、錐距相等:兩節錐沿一條母線相貼
  const apex = (p, q) => at368(p, 0, add(q.at ?? [0, 0, 0], [0, 0, q.radius / Math.tan(q.cone) - q.width / 2]));
  assert.ok(dist(apex(drv, bevelV), apex(cyl, bevelH)) < 1e-9, "兩個傘齒輪的節錐頂重合(兩軸相交)");
  close(dot(drv.axis, cyl.axis), 0, "兩軸垂直");
  close(bevelV.cone + bevelH.cone, Math.PI / 2, "兩節錐角和為直角");
  close(bevelV.radius / Math.sin(bevelV.cone), bevelH.radius / Math.sin(bevelH.cone), "錐距相等");
  // 接觸點的節圓速度相等:正齒輪(與垂直傘齒輪)轉一圈,圓筒轉「齒數比」圈
  const ratio = bevelV.teeth / bevelH.teeth;
  for (const v of sweep(def.driver.range[0], 12)) {
    close(Math.abs(turned(def, "cylinder", 0, v)), Math.abs(turned(def, def.driver.part, 0, v)) * ratio, `主動量 ${v.toFixed(2)}:圓筒轉角 = 正齒輪轉角 × 傘齒輪齒數比`);
  }
});

test("第 368 種:同一個正齒輪也與齒條嚙合:齒條的節線與正齒輪的節圓相切、齒距相同,正齒輪轉一圈齒條移動節圓周長", () => {
  const { def, drv, spur, teeth } = parts368();
  close(teeth.pitch, (2 * Math.PI * spur.radius) / spur.teeth, "齒條的齒距 = 正齒輪的節圓齒距");
  const line = add(def.pose(0).parts.rack.position, teeth.at ?? [0, 0, 0]); // 齒條節線上的一點
  const along = quatRotate(teeth.rotation, X); // 齒條的長度方向
  close(Math.abs(along[1]), 1, "齒條直立");
  // 節線與正齒輪軸是兩條垂直的直線:公垂線長 = 節圓半徑,齒朝著正齒輪的軸
  const n = cross(drv.axis, along);
  const d = dot(sub(at368(drv, 0, spur.at), line), scale(n, 1 / len(n)));
  close(Math.abs(d), spur.radius, "齒條節線到正齒輪軸的距離 = 節圓半徑");
  close(dot(quatRotate(teeth.rotation, Y), scale(n, Math.sign(d) / len(n))), 1, "齒條的齒朝著正齒輪");
  for (const v of sweep(def.driver.range[0] + 2 * Math.PI, 6)) {
    const move = sub(def.pose(v - 2 * Math.PI).parts.rack.position, def.pose(v).parts.rack.position);
    close(Math.abs(move[1]), 2 * Math.PI * spur.radius, `主動量 ${v.toFixed(2)}:正齒輪轉一圈,齒條移動節圓周長`);
    close(Math.hypot(move[0], move[2]), 0, "齒條只沿直立方向移動");
  }
});

test("第 368 種:標記點從圓筒的一端橫移至另一端:尖端全程在筒面上(不埋進圓筒)", () => {
  const { def, tip, body, cyl } = parts368();
  assert.ok(tip.profile[0][0] === 0 && tip.profile[0][1] === 0, "尖端在剖面的起點、半徑 0");
  const bottom = cyl.center[1] + (body.at?.[2] ?? 0) - body.length / 2;
  const top = bottom + body.length;
  const [from, to] = def.driver.range;
  for (const v of sweep(from, 96, to)) {
    const q = tip368(v);
    const r = fromAxis368(q);
    assert.ok(r >= body.radius - 1e-9 && r <= body.radius + 0.01, `主動量 ${v.toFixed(2)}:尖端在筒面上(離軸 ${r.toFixed(4)},筒半徑 ${body.radius})`);
    assert.ok(q[1] > bottom && q[1] < top, `主動量 ${v.toFixed(2)}:尖端在筒的高度以內`);
  }
  const ys = [tip368(from)[1], tip368(to)[1]].sort((a, b) => a - b);
  assert.ok(ys[0] - bottom < 0.3 && top - ys[1] < 0.3, `尖端從靠近一端走到靠近另一端(${ys[0].toFixed(2)}..${ys[1].toFixed(2)},筒 ${bottom.toFixed(2)}..${top.toFixed(2)})`);
});

test("第 368 種:於圓筒上描繪螺旋線:線從尖端畫出、在筒面上隨圓筒轉、單調上升,每圈的升距約筒徑的 0.7 倍(決定 (b):照原圖筒面的螺旋線斜度)", () => {
  const { def, body, cyl } = parts368();
  const [from] = def.driver.range;
  for (const v of sweep(from, 8).slice(1)) {
    const pts = def.pose(v).paths.helix.points;
    assert.ok(dist(pts.at(-1), tip368(v)) < 1e-9, `主動量 ${v.toFixed(2)}:線的最新一點就是尖端`);
    for (const q of pts) assert.ok(Math.abs(fromAxis368(q) - body.radius) <= 0.01, "線在筒面上");
    const ys = pts.map((q) => q[1]);
    assert.ok(ys.every((y, i) => i === 0 || y > ys[i - 1]), "螺旋線沿圓筒單調上升");
    // 主動量 0 時畫下的第一點,跟著圓筒轉過的角度移動
    const start = add(cyl.center, rotateAbout(sub(tip368(0), cyl.center), cyl.axis, turned(def, "cylinder", 0, v)));
    assert.ok(dist(pts[0], start) < 1e-9, `主動量 ${v.toFixed(2)}:畫上去的線跟著圓筒轉`);
  }
  const rise = Math.abs(tip368(from)[1] - tip368(0)[1]);
  const turns = Math.abs(turned(def, "cylinder", 0, from)) / (2 * Math.PI);
  const lead = rise / turns;
  assert.ok(lead > 0.6 * 2 * body.radius && lead < 0.8 * 2 * body.radius, `每圈升距 ${lead.toFixed(3)} 約筒徑 ${2 * body.radius} 的 0.7 倍`);
  assert.ok(turns > 1.4, `筒高內繞超過一圈半(${turns.toFixed(2)} 圈)`);
});

test("第 368 種:齒條穿過板上的導槽往下伸(原圖),全程在槽裡、槽只比齒條大一點", () => {
  const { def, rack } = parts368();
  const board = part(def, "frame").pieces.find((q) => q.kind === "plate" && q.axis?.[1] === 1 && q.shape.holes?.length);
  assert.ok(board, "機架有一塊水平的板,開了槽");
  const [y0, y1] = [board.at[1] - board.thickness / 2, board.at[1] + board.thickness / 2];
  // 槽:板件的局部 y 對到世界的 −z
  const slot = board.shape.holes[0].map(([u, v]) => [board.at[0] + u, board.at[2] - v]);
  const sx = [Math.min(...slot.map((p) => p[0])), Math.max(...slot.map((p) => p[0]))];
  const sz = [Math.min(...slot.map((p) => p[1])), Math.max(...slot.map((p) => p[1]))];
  // 齒條各塊的世界外框(齒條只平移)
  const boxOf = (q, pos) => {
    if (q.kind === "box" || q.kind === "cylinder") return pieceBox(q, pos);
    if (q.kind !== "rack") return null;
    const pts = rackShape(q).outline.flatMap(([u, v]) => [-q.width / 2, q.width / 2].map((w) => add(add(pos, q.at ?? [0, 0, 0]), quatRotate(q.rotation, [u, v, w]))));
    return { lo: [0, 1, 2].map((k) => Math.min(...pts.map((p) => p[k]))), hi: [0, 1, 2].map((k) => Math.max(...pts.map((p) => p[k]))) };
  };
  const [from, to] = def.driver.range;
  for (const v of sweep(from, 48, to)) {
    const pos = def.pose(v).parts.rack.position;
    const boxes = rack.pieces.map((q) => boxOf(q, pos)).filter(Boolean);
    assert.ok(Math.min(...boxes.map((b) => b.lo[1])) < y0 && Math.max(...boxes.map((b) => b.hi[1])) > y1, `主動量 ${v.toFixed(2)}:齒條穿過板`);
    const inBoard = boxes.filter((b) => b.lo[1] < y1 && b.hi[1] > y0);
    for (const b of inBoard) assert.ok(b.lo[0] >= sx[0] && b.hi[0] <= sx[1] && b.lo[2] >= sz[0] && b.hi[2] <= sz[1], `主動量 ${v.toFixed(2)}:板的高度上齒條在槽裡`);
    const lo = [0, 2].map((k) => Math.min(...inBoard.map((b) => b.lo[k])));
    const hi = [0, 2].map((k) => Math.max(...inBoard.map((b) => b.hi[k])));
    assert.ok(lo[0] - sx[0] <= 0.02 && sx[1] - hi[0] <= 0.02 && lo[1] - sz[0] <= 0.02 && sz[1] - hi[1] <= 0.02, `主動量 ${v.toFixed(2)}:槽只比齒條大一點(導引齒條)`);
  }
});

test("第 368 種:齒條在板下的那一段沿背後的直立導槽走(下端的導座):背面與兩側都貼著導槽", () => {
  const { def, rack } = parts368();
  const frame = part(def, "frame");
  const board = frame.pieces.find((q) => q.kind === "plate" && q.axis?.[1] === 1);
  const under = board.at[1] - board.thickness / 2;
  const boxes = frame.pieces.filter((q) => q.kind === "box").map((q) => pieceBox(q));
  const bar = rack.pieces.filter((q) => q.kind === "box").reduce((a, b) => (a.size[1] >= b.size[1] ? a : b)); // 齒段以下的齒條身
  const [from, to] = def.driver.range;
  for (const v of sweep(from, 24, to)) {
    const b = pieceBox(bar, def.pose(v).parts.rack.position);
    const [y0, y1] = [b.lo[1], Math.min(b.hi[1], under)]; // 齒條身在板下的那一段
    assert.ok(y1 - y0 > 0.3, `主動量 ${v.toFixed(2)}:齒條身有一段在板下`);
    const spans = (g) => g.lo[1] <= y0 + 1e-9 && g.hi[1] >= y1 - 1e-9;
    const zOver = (g) => g.lo[2] < b.hi[2] && g.hi[2] > b.lo[2];
    const back = boxes.find((g) => spans(g) && g.lo[0] <= b.lo[0] && g.hi[0] >= b.hi[0] && g.hi[2] <= b.lo[2] + 1e-9 && b.lo[2] - g.hi[2] <= 0.02);
    const left = boxes.find((g) => spans(g) && zOver(g) && g.hi[0] <= b.lo[0] + 1e-9 && b.lo[0] - g.hi[0] <= 0.02);
    const right = boxes.find((g) => spans(g) && zOver(g) && g.lo[0] >= b.hi[0] - 1e-9 && g.lo[0] - b.hi[0] <= 0.02);
    assert.ok(back && left && right, `主動量 ${v.toFixed(2)}:齒條身的背面(${!!back})、左側(${!!left})、右側(${!!right})貼著導槽`);
  }
});

test("第 368 種:水平軸由板上的兩個軸承座撐著(原圖),軸穿過軸承環", () => {
  const { drv } = parts368();
  const shaft = drv.pieces.filter((q) => q.kind === "cylinder" && !q.axis && !q.inner).reduce((a, b) => (a.length >= b.length ? a : b));
  const [s0, s1] = [-1, 1].map((s) => dot(at368(drv, 0, add(shaft.at ?? [0, 0, 0], [0, 0, (s * shaft.length) / 2])), drv.axis)).sort((a, b) => a - b);
  const line = at368(drv, 0, [0, 0, 0]);
  const rings = part(m368.default, "frame").pieces.filter((q) => {
    if (q.kind !== "cylinder" || !q.inner || Math.abs(Math.abs(dot(q.axis ?? Z, drv.axis)) - 1) > 1e-9) return false;
    const d = sub(q.at, line);
    return len(sub(d, scale(drv.axis, dot(d, drv.axis)))) < 1e-9;
  });
  assert.ok(rings.length >= 2, `水平軸上有兩個軸承環(${rings.length})`);
  for (const q of rings) {
    const c = dot(q.at, drv.axis);
    assert.ok(s0 <= c - q.length / 2 && c + q.length / 2 <= s1, "軸穿過整個軸承環");
    assert.ok(q.inner - shaft.radius >= -1e-9 && q.inner - shaft.radius <= 0.01, `軸(半徑 ${shaft.radius})套在軸承環的孔裡(孔 ${q.inner})`);
  }
});

test("第 368 種:直立軸往下穿過水平傘齒輪底下的軸承座與板,下端進底座的軸承:軸經過的機架都開了孔(孔徑等於軸徑)", () => {
  const { def, cyl } = parts368();
  const shaft = cyl.pieces.filter((q) => q.kind === "cylinder").reduce((a, b) => (a.radius <= b.radius ? a : b));
  const [y0, y1] = [cyl.center[1] + shaft.at[2] - shaft.length / 2, cyl.center[1] + shaft.at[2] + shaft.length / 2]; // 圓筒的局部 z 沿世界 y
  const [ax, az] = [cyl.center[0], cyl.center[2]];
  let crossed = 0;
  for (const q of part(def, "frame").pieces) {
    if (q.kind === "plate" && q.axis?.[1] === 1) {
      const [p0, p1] = [q.at[1] - q.thickness / 2, q.at[1] + q.thickness / 2];
      const local = [ax - q.at[0], -(az - q.at[2])]; // 板件的局部 y 對到世界的 −z
      if (p1 <= y0 || p0 >= y1 || !pointInPolygon(local, q.shape.outline)) continue;
      crossed++;
      assert.ok(!inSolid(local, q.shape), `軸穿過的板件(y ${p0.toFixed(2)}–${p1.toFixed(2)})在軸的地方開了孔`);
      const hole = q.shape.holes.find((h) => pointInPolygon(local, h));
      const r = Math.min(...hole.map(([u, v]) => Math.hypot(u - local[0], v - local[1])));
      assert.ok(r >= shaft.radius - 1e-9 && r <= shaft.radius + 0.01, `孔(${r.toFixed(3)})套著軸(${shaft.radius})`);
    } else if (q.kind === "box") {
      const b = pieceBox(q);
      const through = b.lo[1] < y1 && b.hi[1] > y0 && b.lo[0] < ax && b.hi[0] > ax && b.lo[2] < az && b.hi[2] > az;
      assert.ok(!through, `軸不穿過實心的方塊(y ${b.lo[1].toFixed(2)}–${b.hi[1].toFixed(2)})`);
    }
  }
  assert.ok(crossed >= 3, `軸穿過軸承座、板與底座的軸承(${crossed})`);
});

test("第 369 種:擺線擺:擺錘沿擺線運動(擺線的長度不變,擺錘始終在擺線上)", () => {
  for (const p of sweep(1, 36)) {
    const { bob, phi, side } = m369.pendulum(p);
    // 擺線上的點:(a(φ + sin φ), −3a − a cos φ)(相對懸掛點)
    close(bob[0] - m369.top[0], side * m369.A * (phi + Math.sin(phi)), "擺錘在擺線上", 1e-12);
    close(bob[1] - m369.top[1], -3 * m369.A - m369.A * Math.cos(phi), "擺錘在擺線上", 1e-12);
  }
});

test("第 369 種:原圖的虛線擺線是預覽運動線,不畫成零件;只畫擺線(線)與擺錘", () => {
  const def = m369.default;
  assert.equal(part(def, "path"), undefined, "沒有畫出擺錘軌跡的零件");
  assert.deepEqual(Object.keys(def.pose(0.1).paths), ["thread"], "路徑只有擺線");
  assert.ok(!def.waivers.some((w) => w.parts.includes("path")), "軌跡的豁免拿掉");
});

test("第 369 種:兩片擺線頰板裝在支架上,支架(橫樑、立柱、斜撐)與頰板連成一件", () => {
  assertOnePiece(part(m369.default, "frame"), "支架與頰板各塊相連");
});

test("第 369 種:擺線靠著擺向那一側的頰板捲上去:捲著的那段貼著頰板(間隙接近 0),直線段全程不穿進頰板", () => {
  const def = m369.default;
  const r = part(def, "thread").radius;
  const cheeks = part(def, "frame").pieces.filter((q) => q.role === "cheek");
  assert.equal(cheeks.length, 2, "左右兩片頰板");
  const solids = cheeks.map((q) => q.shape.outline.map(([x, y]) => [x + (q.at?.[0] ?? 0), y + (q.at?.[1] ?? 0)]));
  // 線心到頰板的距離減掉線的半徑:負的是穿入
  const gap = (q) => Math.min(...solids.map((s) => (pointInPolygon(q, s) ? -edgeDistance(q, s) : edgeDistance(q, s)))) - r;
  for (const p of sweep(1, 48)) {
    const pts = def.pose(p).paths.thread.points;
    const { phi } = m369.pendulum(p);
    const wrapped = pts.slice(0, -1);
    if (phi > 0.05) for (const q of wrapped.slice(1)) assert.ok(Math.abs(gap(q)) < 0.01, `進程 ${p.toFixed(3)}:捲著的線貼著頰板(間隙 ${gap(q).toFixed(4)})`);
    const [a, b] = [pts.at(-2), pts.at(-1)];
    for (let i = 0; i <= 40; i++) {
      const q = [a[0] + ((b[0] - a[0]) * i) / 40, a[1] + ((b[1] - a[1]) * i) / 40];
      assert.ok(gap(q) > -0.005, `進程 ${p.toFixed(3)}:垂下的線不穿進頰板(${gap(q).toFixed(4)})`);
    }
  }
});

test("第 370 種:拋光鏡面:長桿有縱向與擺動運動,棘輪(鏡面)由偏心輪帶動的制動爪推動,每圈間歇地轉一格", () => {
  // 照原圖的方向,曲柄順時針轉(主動量減少)是往前
  const ps = sweep(-2 * Math.PI, 72).map((t) => m370.polish(t));
  const angles = ps.map((p) => p.angle);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.2, "長桿擺動");
  const slide = ps.map((p) => dist(p.pin, m370.guide));
  assert.ok(Math.max(...slide) - Math.min(...slide) > 0.6, "長桿沿長度方向在軌道的兩根銷之間滑動");
  ps.forEach((p) => close(dist(p.pin, p.center), 2.0, "棘輪裝在長桿上的固定位置", 1e-9));
  close(m370.polish(-2 * Math.PI).rel - m370.polish(0).rel, m370.STEP, "每圈轉一格", 1e-12);
  // 由接觸算:一程比一齒多,爪尖先空走一段才碰上齒面;制動爪沒推的時候棘輪不動
  const { SWEEP, SLACK, STEP } = m370.geometry;
  assert.ok(SWEEP > STEP && SLACK > 0, "一程比一齒多一點");
  const rel = ps.map((p) => p.rel);
  const movedWhileIdle = ps.filter((p, i) => i > 0 && !p.engaged && !ps[i - 1].engaged && Math.abs(rel[i] - rel[i - 1]) > 1e-12);
  assert.equal(movedWhileIdle.length, 0, "制動爪沒頂著齒面時,棘輪不動(間歇)");
  assert.ok(ps.some((p) => p.engaged) && ps.some((p) => !p.engaged), "每圈有推、有停");
});

// 第 370 種的制動爪與棘輪:世界座標的外形(棘輪可以多轉 extra)
function pawl370(t, extra = 0) {
  const def = m370.default;
  const p = def.pose(t).parts;
  const pawl = placeOutline(part(def, "pawl").shape.outline, p.pawl.position, p.pawl.angle);
  const wheel = placeOutline(part(def, "ratchet").shape.outline, p.ratchet.position, p.ratchet.angle + extra);
  const c = p.ratchet.position;
  return { pawl, wheel, r: (q) => Math.hypot(q[0] - c[0], q[1] - c[1]), polar: (q) => Math.atan2(q[1] - c[1], q[0] - c[0]), engaged: m370.polish(t).engaged };
}

test("第 370 種:制動爪是鉤形(原圖):爪身繞在齒尖外、只有鉤尖伸進一個齒間;推動時鉤尖落到齒根、頂著齒面推(棘輪少轉一點就穿入),全程不穿進棘輪", () => {
  const { inner, outer, STEP } = m370.geometry;
  let pushes = 0;
  for (const t of sweep(-2 * Math.PI, 144)) {
    const { pawl, wheel, r, polar, engaged } = pawl370(t);
    assert.ok(penetrationDepth(pawl, wheel) < 0.005, `曲柄轉 ${t.toFixed(2)}:爪不穿進棘輪(${penetrationDepth(pawl, wheel).toFixed(4)})`);
    const inside = pawl.filter((q) => r(q) < outer);
    const a0 = polar(inside[0] ?? pawl[0]);
    const spread = inside.map((q) => Math.atan2(Math.sin(polar(q) - a0), Math.cos(polar(q) - a0)));
    assert.ok(Math.max(0, ...spread) - Math.min(0, ...spread) < STEP, `曲柄轉 ${t.toFixed(2)}:伸進齒尖圓內的只有鉤尖(在一個齒間裡)`);
    if (!engaged) continue;
    pushes++;
    assert.ok(Math.min(...pawl.map(r)) < inner + 0.15 * (outer - inner), `曲柄轉 ${t.toFixed(2)}:推動時鉤落到齒根(齒深的 15% 以內)`);
    assert.ok(polyGap(pawl, wheel) < 0.005, `曲柄轉 ${t.toFixed(2)}:推動時鉤尖貼著齒面`);
    // 照原圖的方向,棘輪被推得逆時針轉(轉角增加):少轉一點,齒面就壓進鉤尖
    const less = pawl370(t, -0.03);
    assert.ok(penetrationDepth(less.pawl, less.wheel) > 0.005, `曲柄轉 ${t.toFixed(2)}:棘輪少轉 0.03 就穿進鉤尖(是爪推的)`);
  }
  assert.ok(pushes > 10, "有推動的相位");
});

test("第 370 種:止回爪(推斷)擋住棘輪往回轉:鉸在長桿的托架上,全程不穿進棘輪;制動爪沒推的時候,棘輪往回轉一點(間隙加 0.01)就頂到止回爪", () => {
  const def = m370.default;
  const { backlash } = m370.geometry;
  const rod = part(def, "rod");
  const pin = rod.pieces.find((q) => q.kind === "cylinder");
  let idle = 0;
  for (const t of sweep(-2 * Math.PI, 72)) {
    const p = def.pose(t).parts;
    const detent = placeOutline(part(def, "detent").shape.outline, p.detent.position, p.detent.angle);
    const wheel = (extra) => placeOutline(part(def, "ratchet").shape.outline, p.ratchet.position, p.ratchet.angle + extra);
    const at = add(p.rod.position, [...rot2([pin.at[0], pin.at[1]], p.rod.angle), 0]);
    close(dist([at[0], at[1], 0], [p.detent.position[0], p.detent.position[1], 0]), 0, `曲柄轉 ${t.toFixed(2)}:止回爪鉸在托架的銷上`, 1e-9);
    assert.ok(penetrationDepth(detent, wheel(0)) < 0.005, `曲柄轉 ${t.toFixed(2)}:止回爪不穿進棘輪`);
    if (m370.polish(t).engaged) continue;
    idle++;
    assert.ok(penetrationDepth(detent, wheel(-(backlash + 0.01))) > 0.005, `曲柄轉 ${t.toFixed(2)}:棘輪往回轉就頂到止回爪`);
  }
  assert.ok(idle > 10, "有制動爪沒推的相位");
});

test("第 370 種:曲柄從哪個相位起轉一圈都推一格:爪一程掃過的角度比一齒多出約半齒(推程先空走一段、退回時越過下一齒),又不到兩齒", () => {
  const { SWEEP, STEP } = m370.geometry;
  assert.ok(SWEEP - STEP > 0.35 * STEP, `多出的量 ${((SWEEP - STEP) / STEP).toFixed(2)} 齒,要大於 0.35 齒`);
  assert.ok(2 * STEP - SWEEP > 0.35 * STEP, `離兩齒還有 ${((2 * STEP - SWEEP) / STEP).toFixed(2)} 齒,要大於 0.35 齒`);
  for (const s of sweep(-2 * Math.PI, 8)) close(m370.polish(s - 2 * Math.PI).rel - m370.polish(s).rel, m370.STEP, `從 ${s.toFixed(2)} 起轉一圈推一格`, 1e-9);
});

// 零件一塊的 z 範圍
const zRange = (q, base = 0) => { const b = pieceBox(q); return [b.lo[2] + base, b.hi[2] + base]; };

test("第 370 種:手柄轉曲柄——曲柄臂、曲柄銷、偏心輪、手柄臂都裝在曲柄軸上;軸從手柄臂往後穿過上樑,上樑後面是偏心輪、曲柄臂,曲柄銷插進長桿頂端,長桿在上樑後面", () => {
  const def = m370.default;
  const crank = part(def, "crank");
  assertOnePiece(crank, "曲柄的各塊連成一件");
  const [arm, pin, axle, ecc, handle] = crank.pieces;
  const beam = zRange(part(def, "frame").pieces[0]);
  const rodZ = def.pose(0).parts.rod.position[2];
  const rod = [rodZ - part(def, "rod").thickness / 2, rodZ + part(def, "rod").thickness / 2];
  assert.ok(zRange(handle)[0] >= beam[1], "手柄臂在上樑前面");
  assert.ok(zRange(ecc)[1] <= beam[0] && zRange(arm)[1] <= zRange(ecc)[0], "上樑後面依序是偏心輪、曲柄臂");
  assert.ok(zRange(axle)[0] <= zRange(arm)[0] + 1e-9 && zRange(axle)[1] >= zRange(handle)[0], "曲柄軸從曲柄臂穿到手柄臂(經過上樑)");
  assert.ok(rod[1] <= beam[0] && rod[1] <= zRange(arm)[0], "長桿在上樑與曲柄臂後面");
  assert.ok(zRange(pin)[0] < rod[1] && zRange(pin)[1] >= zRange(arm)[0], "曲柄銷從曲柄臂往後插進長桿");
  // 曲柄銷在長桿頂端的孔裡(各相位)
  for (const t of sweep(-2 * Math.PI, 24)) {
    const p = def.pose(t).parts;
    const c = add(m370.crankCenter, [...rot2([pin.at[0], pin.at[1]], p.crank.angle), 0]);
    close(dist(c, [...p.rod.position.slice(0, 2), 0]), 0, "曲柄銷在長桿頂端", 1e-9);
  }
});

test("第 370 種:偏心環套住偏心輪(同一層、環的內緣貼著偏心輪),偏心桿全程接到制動爪的鉸點", () => {
  const def = m370.default;
  const ecc = part(def, "crank").pieces[3];
  const strap = part(def, "strap");
  const hole = strap.shape.holes[0];
  const holeR = Math.max(...hole.map(([x, y]) => Math.hypot(x, y)));
  close(holeR, ecc.radius, "環的內徑等於偏心輪", 1e-9);
  for (const t of sweep(-2 * Math.PI, 36)) {
    const p = def.pose(t).parts;
    const z = p.strap.position[2];
    assert.ok(Math.abs(z - ecc.at[2]) < 1e-9, "偏心環和偏心輪在同一層");
    const c = add(m370.crankCenter, [...rot2([ecc.at[0], ecc.at[1]], p.crank.angle), 0]);
    close(dist([...p.strap.position.slice(0, 2), 0], c), 0, `曲柄轉 ${t.toFixed(2)}:環套在偏心輪上`, 1e-9);
    const eye = strap.shape.holes[1].reduce((s, q) => [s[0] + q[0] / strap.shape.holes[1].length, s[1] + q[1] / strap.shape.holes[1].length], [0, 0]);
    const at = add(p.strap.position, [...rot2(eye, p.strap.angle), 0]);
    close(dist([at[0], at[1], 0], [...p.slider.position.slice(0, 2), 0]), 0, `曲柄轉 ${t.toFixed(2)}:偏心桿的眼在爪的鉸點`, 1e-6);
  }
});

test("第 370 種:照原圖,長桿下端偏右、制動爪在長桿左側,鏡面是比棘輪大的方板,下軌的兩根銷夾著長桿", () => {
  const def = m370.default;
  assert.ok(m370.guide[0] > m370.crankCenter[0], "長桿下端偏右");
  const mirrorBox = part(def, "ratchet").pieces[0];
  const outer = Math.max(...part(def, "ratchet").shape.outline.map(([x, y]) => Math.hypot(x, y)));
  assert.ok(mirrorBox.size[0] > 2 * outer, "鏡面比棘輪大");
  const reach = Math.hypot(mirrorBox.size[0], mirrorBox.size[1]) / 2;
  const { ROD_HALF, PIN_R } = m370.geometry;
  for (const t of sweep(-2 * Math.PI, 72)) {
    const p = m370.polish(t);
    // 爪的鉸點在長桿左側
    const k = (p.hinge[1] - p.pin[1]) / p.dir[1];
    assert.ok(p.hinge[0] < p.pin[0] + k * p.dir[0], `曲柄轉 ${t.toFixed(2)}:制動爪在長桿左側`);
    // 兩根銷各在長桿一側,離長桿中線剛好是長桿半寬加銷的半徑(貼著,不穿入)
    const side = m370.railPins.map((q) => { const d = sub(q, p.pin); return d[0] * p.dir[1] - d[1] * p.dir[0]; });
    assert.ok(side[0] * side[1] < 0, "兩根銷在長桿兩側");
    for (const s of side) assert.ok(Math.abs(s) >= ROD_HALF + PIN_R - 1e-9 && Math.abs(s) < ROD_HALF + PIN_R + 0.01, `曲柄轉 ${t.toFixed(2)}:銷夾著長桿(${Math.abs(s).toFixed(4)})`);
    // 鏡面轉到哪裡都不掃到軌道的銷
    for (const q of m370.railPins) assert.ok(dist(q, p.center) > reach + PIN_R, "鏡面不掃到銷");
  }
});

test("第 384 種:螺旋線描繪儀:小輪繞中心滾動,同時沿螺紋移動,畫出渦線", () => {
  const ds = sweep(m384.RANGE[1], 30).map((p) => m384.helicograph(p).d);
  assert.ok(ds.every((d, i) => i === 0 || d > ds[i - 1]), "離中心越來越遠(渦線)");
  const h = m384.helicograph(1);
  close(Math.log(h.d / m384.helicograph(0).d), m384.K, "每轉一弧度,距離按固定比例增加", 1e-12);
});

test("第 384 種:小輪在紙上純滾動——接觸紙面的那一點沿滾動方向(垂直於臂)的速度約為 0(不是往反方向刷過紙面)", () => {
  const def = m384.default;
  const paper = part(def, "paper");
  const top = paper.center[1] + paper.size[1] / 2;
  const conj = ([x, y, z, w]) => [-x, -y, -z, w];
  for (const psi of [1, 5, 10]) {
    const e = 1e-5;
    const a = def.pose(psi).parts.wheel;
    const b = def.pose(psi + e).parts.wheel;
    const down = [0, top - a.position[1], 0]; // 輪心到紙面的接觸點
    const local = quatRotate(conj(a.rotation), down);
    const pa = add(a.position, down);
    const pb = add(b.position, quatRotate(b.rotation, local));
    // 滾動方向:臂繞中心轉時輪心走的切線方向(小輪同時沿臂往外移,那是沿輪軸的側滑,不是滾動)
    const tangent = [-Math.sin(psi), 0, -Math.cos(psi)];
    const v = dot(sub(pb, pa), tangent) / e;
    const vc = dot(sub(b.position, a.position), tangent) / e;
    assert.ok(Math.abs(v) < 0.01 * vc, `ψ = ${psi}:接觸點沿滾動方向的速度 ${v.toFixed(3)} 應約為 0(輪心 ${vc.toFixed(3)})`);
  }
});

test("第 384 種:小輪旋在螺紋軸上——照小輪實際的轉動(轉向由上一條的純滾動鎖住)與螺紋的旋向(零件的 hand),螺紋把小輪沿臂往外推,渦線由內往外", () => {
  const def = m384.default;
  const arm = part(def, "arm");
  const worm = arm.pieces.find((q) => q.kind === "worm");
  const conj = ([x, y, z, w]) => [-x, -y, -z, w];
  for (const psi of [1, 5, 10]) {
    const e = 1e-5;
    const a = def.pose(psi).parts.wheel;
    const b = def.pose(psi + e).parts.wheel;
    // 小輪這一步的轉動(世界座標的轉動向量):dq = q_b · q_a⁻¹,小角度時 ≈ 2·(x, y, z)
    const dq = quatMul(b.rotation, conj(a.rotation));
    const omega = scale([dq[0], dq[1], dq[2]], 2 * Math.sign(dq[3]));
    // 螺紋的 +z 在世界裡的方向(臂的局部 → 世界);臂繞 +Y 轉,在這個水平方向上沒有分量,所以 omega 沿它的分量就是小輪相對螺紋軸的自轉
    const u = partPoint([0, 0, 0], arm.axis, psi, worm.axis ?? Z);
    const turn = dot(omega, u);
    const along = dot(sub(b.position, a.position), u); // 小輪沿螺紋軸實際走的量
    const lead = screwLead(worm, turn); // 螺帽照這個旋向轉這個角度,螺紋把它推的量
    assert.ok(Math.abs(along - lead) < 1e-3 * Math.abs(lead), `ψ = ${psi}:小輪沿螺紋軸走 ${along.toExponential(3)},螺紋推 ${lead.toExponential(3)}`);
    assert.ok(lead > 0, `ψ = ${psi}:照這個旋向與自轉,螺紋把小輪往外推(渦線由內往外)`);
  }
});

test("第 384 種:中心尖插進紙裡、頂上有握柄,固定不動;臂端的扁環套在尖上繞著轉", () => {
  const def = m384.default;
  const paper = part(def, "paper");
  const top = paper.center[1] + paper.size[1] / 2;
  const bottom = paper.center[1] - paper.size[1] / 2;
  const center = part(def, "center");
  assert.ok(center, "中心尖是一個零件");
  assert.ok(!def.pose(3).parts.center, "中心尖固定不動");
  const y0 = center.center?.[1] ?? 0;
  const prof = center.profile.map(([r, y]) => [r, y + y0]);
  const tip = Math.min(...prof.map(([, y]) => y));
  assert.ok(tip < top && tip > bottom, `尖端插進紙裡(尖端 ${tip.toFixed(3)}、紙面 ${top.toFixed(3)})`);
  // 中心尖在高度 y 的半徑(取通過那個高度的各段之中最大的)
  const rAt = (y) => Math.max(0, ...prof.slice(1).flatMap(([r1, y1], i) => {
    const [r0, yy0] = prof[i];
    if ((y - yy0) * (y - y1) > 0 || yy0 === y1) return [];
    return [r0 + ((r1 - r0) * (y - yy0)) / (y1 - yy0)];
  }));
  const arm = part(def, "arm");
  const ring = arm.pieces.find((q) => q.role === "ring");
  assert.ok(ring, "臂端有扁環");
  // 臂的局部 z 是世界的 Y(繞中心尖轉的軸)
  assert.deepEqual([ring.at?.[0] ?? 0, ring.at?.[1] ?? 0], [0, 0], "扁環和臂的轉軸同軸");
  const ry = arm.center[1] + (ring.at?.[2] ?? 0);
  const [r0, r1] = [ry - ring.length / 2, ry + ring.length / 2];
  for (const y of [r0 + 0.005, ry, r1 - 0.005]) {
    const fit = ring.inner - rAt(y);
    assert.ok(fit >= -1e-9 && fit <= 0.01, `扁環的孔套著中心尖(高度 ${y.toFixed(2)}:孔 ${ring.inner}、尖 ${rAt(y).toFixed(3)})`);
  }
  assert.ok(rAt(r0 - 0.01) > ring.inner, "扁環下面有凸緣托著");
  const knob = Math.max(...prof.filter(([, y]) => y > r1 + 0.05).map(([r]) => r));
  assert.ok(knob > 2 * ring.inner, "扁環上方有比尖粗的握柄");
});

test("第 371 種:兩面有齒的曼格輪:小齒輪均勻旋轉,輪交替地往兩個方向轉,換向時小齒輪穿過開口到另一面", () => {
  const ws = sweep(4 * Math.PI * 60 / 8, 800).map((t) => m371.mangle(t));
  const dirs = ws.slice(1).map((w, i) => Math.sign(w.wheel - ws[i].wheel)).filter(Boolean);
  const changes = dirs.slice(1).filter((d, i) => d !== dirs[i]).length;
  assert.ok(changes >= 1, "輪換向");
  assert.ok(ws.some((w) => w.z > 0.2) && ws.some((w) => w.z < -0.2), "小齒輪在兩面之間換");
  close(Math.max(...ws.map((w) => w.wheel)) - Math.min(...ws.map((w) => w.wheel)), m371.TRAVEL, "單向轉將近一圈", 0.01);
});

// 第 371 種的量測:小齒輪軸心(世界)、輪緣兩端的端點(換面時小齒輪繞著它)
const m371Ends = (w) => m371.ENDS.map((a) => polar(m371.R, w + a));

test("第 371 種:小齒輪咬著一面的齒時,接觸點上小齒輪的節圓和輪面同向、同速(滾動不滑,輪的轉向由小齒輪決定)", () => {
  let checked = 0;
  for (const t of sweep(m371.PERIOD, 600)) {
    const m = m371.mangle(t);
    if (Math.abs(Math.abs(m.z) - m371.RHO) > 1e-9 || Math.abs(Math.abs(m371.mangle(t + 1e-4).z) - m371.RHO) > 1e-9) continue;
    const dw = (m371.mangle(t + 1e-4).wheel - m.wheel) / 1e-4;
    // 小齒輪(繞 +x 轉,角速度 1)在靠輪面那一側的節點往 ±y 走;輪面在 9 點鐘處往 −R·dw 的 y 方向走
    const pinionV = Math.sign(m.z) * m371.RP;
    const wheelV = -m371.R * dw;
    close(wheelV, pinionV, `小齒輪轉 ${t.toFixed(2)}:接觸點同向同速`, 1e-3);
    checked++;
  }
  assert.ok(checked > 300, "兩面都量到");
});

test("第 371 種:換面時小齒輪繞過輪緣的端點、從開口穿到另一面:繞端點時一直咬著端點的齒,全程不碰另一端與輪緣", () => {
  const tip = m371.RP + m371.M; // 小齒輪齒頂半徑
  const endTip = m371.H + m371.M; // 端點齒的齒頂半徑
  let switching = 0;
  for (const t of sweep(m371.PERIOD, 1200)) {
    const m = m371.mangle(t);
    const p = [-m371.R, 0, m.z];
    const d = m371Ends(m.wheel).map((e) => dist(p, e));
    const local = ((Math.PI - m.wheel) % TAU + TAU) % TAU; // 小齒輪在輪上的角度
    const onRim = local > m371.ENDS[0] && local < m371.ENDS[1];
    if (onRim) {
      close(Math.abs(m.z), m371.RHO, `小齒輪轉 ${t.toFixed(2)}:在輪緣上時咬著一面的齒`, 1e-9);
      assert.ok(Math.abs(m.z) - tip > m371.RIM, "齒頂不碰輪緣");
    } else {
      switching++;
      const near = Math.min(...d);
      close(near, m371.RHO, `小齒輪轉 ${t.toFixed(2)}:繞端點時和端點的齒節圓相切`, 0.005);
      assert.ok(Math.max(...d) > tip + endTip + 0.03, `小齒輪轉 ${t.toFixed(2)}:不碰另一端的齒(${Math.max(...d).toFixed(3)})`);
    }
  }
  assert.ok(switching > 20, "有換面");
  // 換面時穿過開口:小齒輪的軸心走到兩面正中(z = 0)時,在開口裡
  const mid = sweep(m371.PERIOD, 2400).map((t) => m371.mangle(t)).filter((m) => Math.abs(m.z) < 0.01);
  assert.ok(mid.length > 0 && mid.every((m) => { const l = ((Math.PI - m.wheel) % TAU + TAU) % TAU; return l < m371.ENDS[0] || l > m371.ENDS[1]; }), "穿過開口");
});

test("第 371 種:小齒輪軸在軸承座的前後長槽裡滑:軸全程在槽裡、不穿進槽壁,咬著一面時軸靠在槽的一端", () => {
  const def = m371.default;
  const shaft = part(def, "pinion").pieces.find((q) => q.kind === "cylinder");
  const r = shaft.radius;
  const blocks = part(def, "frame").pieces.filter((q) => q.role === "bearing").map((q) => pieceBox(q));
  assert.ok(blocks.length >= 3, "長槽的框(上下兩條、前後兩端)");
  const x = -m371.R - 0.4; // 軸承座所在的 x
  const around = blocks.filter((b) => b.lo[0] <= x && x <= b.hi[0]);
  // 軸的截面(y–z 平面)到每一塊的距離
  const gapTo = (z, b) => Math.hypot(Math.max(b.lo[1] - 0, 0, 0 - b.hi[1]), Math.max(b.lo[2] - z, 0, z - b.hi[2])) - r;
  for (const t of sweep(m371.PERIOD, 400)) {
    const z = m371.mangle(t).z;
    for (const b of around) assert.ok(gapTo(z, b) > -1e-9, `小齒輪轉 ${t.toFixed(2)}:軸不穿進槽壁`);
    assert.ok(around.some((b) => b.lo[1] > 0) && around.some((b) => b.hi[1] < 0), "槽的上下兩側都有壁");
  }
  for (const s of [1, -1]) assert.ok(around.some((b) => Math.abs(gapTo(s * m371.RHO, b)) < 0.01 && (s > 0 ? b.lo[2] > 0 : b.hi[2] < 0)), "咬著一面時軸靠在槽端");
});

test("第 372 種:懷特氏測功計:框架靜止時運動經水平齒輪傳到另一個垂直齒輪;框架放開時框架隨之旋轉", () => {
  const held = m372.dynamometer(1, "held");
  close(held.carrier, 0, "框架不動");
  close(held.sun2, -1, "另一個垂直齒輪反向轉");
  const free = m372.dynamometer(1, "free");
  close(free.carrier, 0.5, "框架跟著轉(負載擋住另一個齒輪時,轉一半)");
});

test("第 372 種:環形框架是垂直於軸的環,輪轂在軸的中點(兩立柱正中),四個傘齒輪都在環裡,齒輪照原圖佔兩立柱間距約八成;輪轂套在軸上", () => {
  const def = m372.default;
  const frame = part(def, "frame");
  const hoop = frame.pieces.find((q) => q.role === "hoop");
  const hub = frame.pieces.find((q) => q.role === "hub");
  assert.ok(hoop && hoop.kind === "lathe" && hoop.axis === X, "環繞軸(x)轉:環面垂直於軸");
  const pillars = part(def, "stand").pieces.filter((q) => q.role === "pillar").map((q) => q.at[0]);
  assert.equal(pillars.length, 2, "兩根立柱");
  const mid = (pillars[0] + pillars[1]) / 2;
  close((hoop.at?.[0] ?? 0), mid, "環在兩立柱正中", 1e-9);
  close(hub.at[0], mid, "輪轂在軸的中點", 1e-9);
  const inner = Math.min(...hoop.profile.map(([r]) => r));
  // 四個傘齒輪的錐頂都在環心:齒頂離錐頂最遠 √2 ×(節圓半徑 + 齒頂高)
  const reach = Math.SQRT2 * (m372.R + m372.M);
  assert.ok(reach < inner, `傘齒輪都在環裡(齒頂 ${reach.toFixed(3)}、環內緣 ${inner.toFixed(3)})`);
  const span = Math.abs(pillars[1] - pillars[0]);
  const ratio = (2 * (m372.R + m372.M)) / span;
  assert.ok(ratio > 0.7, `四個傘齒輪圍成的方框佔兩立柱間距約八成(原圖約八成,這裡 ${ratio.toFixed(2)})`);
  // 輪轂套在軸上:空心,軸從孔裡穿過
  const shaft = part(def, "shaft").pieces.find((q) => q.kind === "cylinder" && q.length > 4);
  assert.ok(hub.inner >= shaft.radius && hub.inner < shaft.radius + 0.01, `輪轂的孔套著軸(孔 ${hub.inner}、軸 ${shaft.radius})`);
});

test("第 372 種:兩個水平傘齒輪裝在框架上:框架的徑向軸從輪轂穿過行星齒輪伸進環,框架轉時行星齒輪跟著公轉", () => {
  const def = m372.default;
  const frame = part(def, "frame");
  const hub = frame.pieces.find((q) => q.role === "hub");
  const hoop = frame.pieces.find((q) => q.role === "hoop");
  const inner = Math.min(...hoop.profile.map(([r]) => r));
  const axles = frame.pieces.filter((q) => q.role === "planetAxle").map((q) => pieceBox(q));
  assert.equal(axles.length, 2, "上下兩根徑向軸");
  for (const b of axles) {
    const [lo, hi] = [Math.min(Math.abs(b.lo[1]), Math.abs(b.hi[1])), Math.max(Math.abs(b.lo[1]), Math.abs(b.hi[1]))];
    assert.ok(lo < hub.radius && hi > inner, `徑向軸從輪轂(${lo.toFixed(2)})伸進環(${hi.toFixed(2)})`);
  }
  for (const a of sweep(4, 16)) {
    const pose = def.pose(a, "free").parts;
    for (const [id, s] of [["planetTop", 1], ["planetBottom", -1]]) {
      const axis = quatRotate(pose.frame.rotation, [0, s, 0]);
      const c = pose[id].position;
      close(len(cross(c, axis)), 0, `主動量 ${a}:${id} 的中心在框架的徑向軸上`, 1e-9);
      assert.ok(dot(c, axis) > 0, `${id} 在軸的那一端`);
    }
  }
});

test("第 372 種:框架保持靜止時,繫在環周圍的皮帶吊著重錘,重錘對軸的力矩和框架被帶的方向相反;拿掉重錘框架就跟著轉", () => {
  const def = m372.default;
  const hoop = part(def, "frame").pieces.find((q) => q.role === "hoop");
  const outer = Math.max(...hoop.profile.map(([r]) => r));
  const lenOf = (pts) => pts.slice(1).reduce((s, p, i) => s + dist(p, pts[i]), 0);
  const l0 = lenOf(def.pose(0, "held").paths.band.points);
  const w0 = def.pose(0, "held").parts.weight.position;
  for (const a of sweep(6, 12)) {
    const pose = def.pose(a, "held");
    const pts = pose.paths.band.points;
    assert.notEqual(pose.paths.band.visible, false, "掛著重錘時看得到皮帶");
    close(lenOf(pts), l0, "皮帶長度不變", 1e-9);
    assert.deepEqual(pose.parts.weight.position, w0, "框架不動,重錘不動");
    // 皮帶捲在環的外緣上,從切點垂直往下接到重錘
    const onHoop = pts.filter((p) => Math.abs(Math.hypot(p[1], p[2]) - outer) < 0.05);
    assert.ok(onHoop.length >= 5, "皮帶捲在環的外緣上");
    const [t, end] = [pts.at(-2), pts.at(-1)];
    close(t[0], end[0], "垂直往下", 1e-9);
    close(t[2], end[2], "垂直往下", 1e-9);
    assert.ok(end[1] < t[1] && Math.abs(end[1] - pose.parts.weight.position[1]) < 0.5, "下端吊著重錘");
    // 重錘往下拉(−y)在切點的力矩(繞 +x):r × F 的 x 分量 = −r_z·(−1)
    const torque = t[2];
    const carried = Math.sign(m372.dynamometer(1, "free").carrier); // 放開時框架被帶的方向
    assert.ok(Math.sign(torque) === -carried, "重錘的力矩和框架被帶的方向相反");
  }
  const free = def.pose(1, "free");
  assert.equal(free.parts.weight.visible, false, "框架放開時重錘拿掉了");
  assert.equal(free.paths.band.visible, false, "皮帶也拿掉");
});

test("第 372 種:右傘齒輪在軸上鬆轉,套筒上的皮帶輪接被量測的機器:皮帶繞在皮帶輪的輪緣上,輪緣走多少皮帶就走多少(不打滑)", () => {
  const def = m372.default;
  const sun2 = part(def, "sun2");
  const shaft = part(def, "shaft").pieces.find((q) => q.kind === "cylinder" && q.length > 4);
  const sleeve = sun2.pieces.find((q) => q.kind === "cylinder" && q.inner);
  assert.ok(sleeve && sleeve.inner >= shaft.radius && sleeve.inner < shaft.radius + 0.01, "右齒輪的套筒套在軸上(空心)");
  // 皮帶輪:套筒上最大的圓柱(兩片擋邊除外);世界座標的軸線沿 x、過原點
  const pulley = sun2.pieces.filter((q) => q.kind === "cylinder" && q.length > 0.1).sort((a, b) => b.radius - a.radius)[0];
  const px = sun2.center[0] - pulley.at[2]; // 局部 z 沿 −x
  for (const state of ["held", "free"]) {
    const pose = def.pose(0, state);
    const pts = pose.paths.loadBelt.points;
    const wrapped = pts.filter((q) => Math.abs(q[0] - px) < 1e-9 && Math.abs(Math.hypot(q[1], q[2]) - pulley.radius) < 0.03);
    assert.ok(wrapped.length >= pts.length - 2, `${state}:除了往下伸出圖外的兩端,皮帶都貼在輪緣上(${wrapped.length}/${pts.length})`);
    // 皮帶內面貼著的輪緣頂點轉一點走的距離(沿皮帶在頂點的方向)= 皮帶走的距離
    const top = pts.reduce((a, b) => (b[1] > a[1] ? b : a));
    const i = pts.indexOf(top);
    const along = norm(sub(pts[i + 1], pts[i - 1]));
    const rim = [top[0], top[1] * (pulley.radius / Math.hypot(top[1], top[2])), top[2] * (pulley.radius / Math.hypot(top[1], top[2]))];
    const p1 = def.pose(0.01, state);
    const turn = p1.parts.sun2.angle - pose.parts.sun2.angle;
    const moved = sub(rotateAbout(rim, sun2.axis, turn), rim);
    close(p1.paths.loadBelt.phase - pose.paths.loadBelt.phase, dot(moved, along), `${state}:皮帶跟著輪緣走`, 1e-5);
  }
});

const d373 = m373.default;
const STATES373 = ["light", "heavy"];
// 零件局部座標的點換到世界座標(零件繞自己的 z 軸轉;沒給姿勢的零件在定義的位置)
function at373(pose, id, local) {
  const q = pose[id] ?? {};
  const c = q.position ?? part(d373, id).center ?? [0, 0, 0];
  const [x, y] = rot2(local, q.angle ?? 0);
  return [c[0] + x, c[1] + y, c[2] + (local[2] ?? 0)];
}
const role373 = (id, role) => part(d373, id).pieces.filter((q) => q.role === role);
const flat373 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

test("第 373 種:羅伯特氏裝置:指示器的讀數不隨大輪轉速改變,只隨載重改變", () => {
  close(d373.pose(0.5, "light").parts.needle.angle, d373.pose(5, "light").parts.needle.angle, "速度不同,指示器不變");
  assert.notEqual(d373.pose(1, "light").parts.needle.angle, d373.pose(1, "heavy").parts.needle.angle, "重量不同,指示器改變");
});

// #373-1:原圖小車底盤伸出一根直桿到刻度盤左側,盤裡是渦卷彈簧(英文 spiral spring)、指針在盤心
test("第 373 種:直桿一端以銷接在小車上,另一端經繞在捲筒上的繩拉動與指針同軸的捲筒;桿長、繩長不變", () => {
  assert.equal(part(d373, "rod")?.kind, "link", "小車到刻度盤是一根直桿");
  const [lug] = role373("cart", "lug");
  const [drum] = role373("needle", "drum");
  const axis = part(d373, "needle").center;
  const cordR = part(d373, "cord").radius;
  const rows = STATES373.map((s) => {
    const pose = d373.pose(1.3, s);
    const { from, to } = pose.parts.rod;
    close(dist(from, at373(pose.parts, "cart", lug.pin)), 0, `${s}:直桿以銷接在小車的耳上`, 1e-9);
    const cord = pose.paths.cord.points;
    close(dist(cord[0], to), 0, `${s}:繩接在直桿的另一端`, 1e-9);
    // 繩從切點離開捲筒:切點之後每一點都貼在捲筒上,直段和半徑垂直,而且和直桿成一直線(拉力沿著桿)
    for (const p of cord.slice(1)) close(flat373(p, axis), drum.radius + cordR, `${s}:繩繞在捲筒上`, 1e-9);
    const straight = sub(cord[1], cord[0]);
    close(dot(norm(straight), norm(sub(cord[1], axis))), 0, `${s}:繩沿切線離開捲筒`, 1e-9);
    close(len(cross(norm(straight), norm(sub(to, from)))), 0, `${s}:繩與直桿成一直線`, 1e-9);
    const end = cord[cord.length - 1];
    return { rod: dist(from, to), cord: pathLength(cord), x: from[0], needle: pose.parts.needle.angle, anchor: Math.atan2(end[1] - axis[1], end[0] - axis[0]) };
  });
  const [light, heavy] = rows;
  close(heavy.rod, light.rod, "桿長不變", 1e-9);
  close(heavy.cord, light.cord, "繩長不變", 2e-3);
  // 繩的固定端在捲筒上,跟著指針轉
  close(heavy.anchor - light.anchor, heavy.needle - light.needle, "繩的固定端跟著捲筒與指針轉", 1e-9);
  // 「重量的差異則會立即造成變化」:載重重時摩擦力大,小車與直桿被輪面往左帶得多,拉出的繩多,指針順時針多轉
  assert.ok(heavy.x < light.x - 0.05, `載重重時小車往左多移(輕 ${light.x.toFixed(3)}、重 ${heavy.x.toFixed(3)})`);
  assert.ok(heavy.needle < light.needle - 0.3, "指針順時針多轉");
});

test("第 373 種:載重改變時刻度盤與渦卷彈簧的外端不動,彈簧內端跟著指針的軸轉", () => {
  const axis = part(d373, "needle").center;
  const [stud] = role373("dial", "stud");
  const wire = part(d373, "spring").radius;
  const rows = STATES373.map((s) => {
    const pose = d373.pose(0.4, s);
    assert.equal(pose.parts.dial, undefined, `${s}:刻度盤固定,沒有姿勢`);
    assert.ok(pose.paths.spring, "彈簧是盤裡的渦卷彈簧(路徑)");
    const pts = pose.paths.spring.points;
    const [inner, outer] = [pts[0], pts[pts.length - 1]];
    close(flat373(outer, at373(pose.parts, "dial", stud.at)) - wire - stud.radius, 0, `${s}:彈簧外端靠在盤上的柱`, 1e-9);
    return { outer, inner: Math.atan2(inner[1] - axis[1], inner[0] - axis[0]), needle: pose.parts.needle.angle };
  });
  const [light, heavy] = rows;
  close(dist(heavy.outer, light.outer), 0, "彈簧外端(固定端)不動", 1e-9);
  close(heavy.inner - light.inner, heavy.needle - light.needle, "彈簧內端跟著指針的軸轉", 1e-9);
});

test("第 373 種:盤右側的螺桿穿過右立柱上的孔,軸環與螺帽夾住立柱;盤底坐在立柱伸出的架子上", () => {
  const dial = part(d373, "dial");
  const frame = part(d373, "frame");
  const [screw, collar, nut] = ["screw", "collar", "nut"].map((r) => pieceBox(role373("dial", r)[0], dial.center));
  const posts = frame.pieces.filter((q) => q.role === "post").map((q) => pieceBox(q));
  assert.ok(posts.length > 0, "右立柱");
  const [x0, x1] = [Math.min(...posts.map((b) => b.lo[0])), Math.max(...posts.map((b) => b.hi[0]))];
  assert.ok(screw.lo[0] < x0 && screw.hi[0] > x1, "螺桿穿過立柱");
  close(collar.hi[0], x0, "軸環貼著立柱左面", 1e-9);
  close(nut.lo[0], x1, "螺帽貼著立柱右面", 1e-9);
  const apart = (a, b) => [0, 1, 2].some((k) => a.hi[k] <= b.lo[k] + 1e-9 || b.hi[k] <= a.lo[k] + 1e-9);
  for (const b of posts) assert.ok(apart(b, screw), "螺桿從立柱的孔穿過,不碰立柱");
  const [rim] = role373("dial", "rim");
  const R = Math.max(...rim.shape.outline.map((p) => Math.hypot(p[0], p[1])));
  const shelf = pieceBox(frame.pieces.find((q) => q.role === "shelf"));
  close(shelf.hi[1], dial.center[1] - R, "盤底坐在架子上", 1e-9);
  assert.ok(shelf.lo[0] < dial.center[0] && shelf.hi[0] >= x0 - 1e-9, "架子在盤底下、接到立柱");
});

// #373-3:原圖皮帶從大輪軸上四根彎輪輻的小輪往左上伸出圖外
test("第 373 種:皮帶往左上接到天軸上的主動皮帶輪(推斷,原圖伸出圖外),天軸在吊架的軸承裡;皮帶不打滑,大輪逆時針轉", () => {
  assert.equal(d373.driver.part, "drivePulley", "主動件是帶動皮帶的皮帶輪");
  const drive = part(d373, "drivePulley");
  const wheel = part(d373, "wheel");
  assert.ok(drive.center[0] < wheel.center[0] - 2 && drive.center[1] > wheel.center[1] + 1, "主動皮帶輪在大輪的左上方");
  close(turned(d373, "wheel", 0, 1) * m373.HUB, turned(d373, "drivePulley", 0, 1) * drive.radius, "皮帶不打滑", 1e-9);
  assert.ok(turned(d373, "wheel", 0, 1) > 0, "大輪逆時針轉:輪頂往左,把小車往指示器的反方向帶");
  const [shaft] = role373("drivePulley", "shaft");
  const hanger = part(d373, "hanger");
  const [bearing] = role373("hanger", "bearing");
  const sb = pieceBox(shaft, drive.center);
  const bb = pieceBox(bearing, hanger.center);
  close(flat373(add(hanger.center, bearing.at), drive.center), 0, "軸承環和天軸同心", 1e-9);
  assert.ok(shaft.radius < bearing.inner, "天軸在軸承環的孔裡");
  assert.ok(sb.lo[2] <= bb.lo[2] && sb.hi[2] >= bb.hi[2], "天軸穿過軸承環");
});

test("第 373 種:大輪軸上皮帶繞的小輪以四根彎輪輻接到輪轂(原圖)", () => {
  const [ring] = role373("wheel", "beltRing");
  const [hub] = role373("wheel", "beltHub");
  const [main] = role373("wheel", "hub");
  const spokes = role373("wheel", "spoke");
  assert.equal(spokes.length, 4, "四根輪輻");
  const outer = Math.max(...ring.shape.outline.map((p) => Math.hypot(p[0], p[1])));
  const inner = Math.min(...ring.shape.holes[0].map((p) => Math.hypot(p[0], p[1])));
  close(outer, m373.HUB, "皮帶繞在小輪上", 1e-6);
  const zs = (q) => {
    const b = pieceBox(q);
    return [b.lo[2], b.hi[2]];
  };
  const zTouch = (a, b) => a[0] <= b[1] + 1e-9 && b[0] <= a[1] + 1e-9;
  assert.ok(zTouch(zs(hub), zs(main)), "小輪的輪轂接在大輪的輪轂上");
  for (const s of spokes) {
    const rs = s.shape.outline.map((p) => Math.hypot(p[0], p[1]));
    assert.ok(Math.min(...rs) <= hub.radius && Math.max(...rs) >= inner, "輪輻從輪轂伸進輪環");
    assert.ok(zTouch(zs(s), zs(hub)) && zTouch(zs(s), zs(ring)), "輪輻和輪轂、輪環在同一層");
    // 彎輪輻:中心線的中點偏離兩端的連線
    const [a, m, b] = s.line;
    const off = Math.abs((b[0] - a[0]) * (m[1] - a[1]) - (b[1] - a[1]) * (m[0] - a[0])) / Math.hypot(b[0] - a[0], b[1] - a[1]);
    assert.ok(off > 0.03, `輪輻是彎的(中點偏離 ${off.toFixed(3)})`);
  }
});

// #373-4:原圖小車輪中心有軸頭
test("第 373 種:小車輪有輪軸,軸穿過車斗下兩片軸架的孔;輪頂和底板留間隙;兩個狀態都壓在大輪輪面上", () => {
  const wheel = part(d373, "wheel");
  const [board] = role373("cart", "board");
  assert.ok(board, "車斗的底板");
  const boardBottom = board.at[1] - board.size[1] / 2;
  for (const s of STATES373) {
    const pose = d373.pose(0.7, s).parts;
    for (const id of ["cartWheelL", "cartWheelR"]) {
      const w = part(d373, id);
      const c = pose[id].position;
      close(flat373(c, wheel.center), m373.WHEEL.r + w.radius, `${s} ${id}:壓在大輪的輪面上`, 1e-9);
      const [axle] = (w.pieces ?? []).filter((q) => q.role === "axle");
      assert.ok(axle, `${id} 有輪軸`);
      const ab = pieceBox(axle, c);
      const hangers = role373("cart", "hanger").filter((q) => q.wheel === id);
      assert.equal(hangers.length, 2, `${id} 兩側各一片軸架`);
      for (const h of hangers) {
        close(flat373(at373(pose, "cart", h.hole), c), 0, `${s} ${id}:軸架的孔和輪心同心`, 1e-9);
        assert.ok(h.holeRadius > axle.radius, "軸在孔裡");
        const z = pose.cart.position[2] + h.at[2];
        assert.ok(ab.lo[2] < z - h.thickness / 2 && ab.hi[2] > z + h.thickness / 2, `${id}:輪軸穿過軸架`);
      }
      const local = toLocal(pose.cart, c);
      assert.ok(boardBottom - (local[1] + w.radius) >= 0.03, `${s} ${id}:輪頂和底板留間隙`);
    }
  }
});

test("第 373 種:載重放在車斗上:兩個狀態每一袋重物的底都貼著車斗頂(間隙接近 0、不穿入),重物跟著小車傾斜", () => {
  const box = part(d373, "cart").pieces[0];
  const top = box.at[1] + box.size[1] / 2;
  for (const s of STATES373) {
    const pose = d373.pose(0.7, s).parts;
    close(pose.load.angle, pose.cart.angle, `${s}:重物跟著小車傾斜`, 1e-12);
    const [, dy] = toLocal(pose.cart, pose.load.position);
    const sy = pose.load.scale?.[1] ?? 1;
    for (const q of part(d373, "load").pieces) {
      const a = q.angle ?? 0;
      const half = (q.size[1] / 2) * Math.cos(a) + (q.size[0] / 2) * Math.abs(Math.sin(a));
      const bottom = dy + sy * ((q.at?.[1] ?? 0) - half);
      assert.ok(Math.abs(bottom - top) < 0.005, `${s}:重物的底貼著車斗頂(${(bottom - top).toFixed(4)})`);
    }
  }
});

test("第 374 種:踏板上的滾子經無端皮帶帶動軸上的偏心輪:踏板上下一次,軸轉一圈", () => {
  const angles = sweep(2 * Math.PI, 72).map((t) => m374.treadle(t).angle);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.3, "踏板上下擺");
  for (const t of sweep(2 * Math.PI, 12)) {
    const r = m374.treadle(t);
    close(Math.hypot(r.roller[0] - r.e[0], r.roller[1] - r.e[1]), m374.SPAN, "皮帶長度不變", 1e-9);
  }
  // 「透過一條無端皮帶,將旋轉運動從踏板傳遞給軸」:主動件是踏板,踩下、放開一個來回,軸朝同一方向轉一圈
  const def = m374.default;
  assert.equal(def.driver.part, "treadle");
  const stroke = 2 * Math.abs(m374.PEDAL[0] - m374.PEDAL[1]);
  close(m374.shaftAngle(stroke) - m374.shaftAngle(0), 2 * Math.PI, "一個來回轉一圈", 1e-6);
  const th = sweep(2 * stroke, 200).map(m374.shaftAngle);
  assert.ok(th.every((t, i) => i === 0 || t >= th[i - 1] - 1e-9), "軸只朝一個方向轉");
});

// 第 374 種的偏心輪板與軸:定義裡帶孔的那塊板、穿過它的圓柱
const eccentricOf = (def) => {
  const shaft = part(def, "shaft");
  const disk = shaft.pieces.find((q) => q.kind === "plate" && q.shape.holes.length);
  const axle = shaft.pieces.find((q) => q.kind === "cylinder");
  const ringOf = (pts, at = [0, 0]) => {
    const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length], [0, 0]);
    return { c: [c[0] + at[0], c[1] + at[1]], r: Math.max(...pts.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1]))) };
  };
  return { disk: ringOf(disk.shape.outline, disk.at), hole: ringOf(disk.shape.holes[0], disk.at), axle };
};

test("第 374 種:偏心輪的孔正好套住軸(軸帶著偏心輪轉);偏心距是偏心輪半徑的一半(507movements 的動畫:2.5 / 5)", () => {
  const { disk, hole, axle } = eccentricOf(m374.default);
  close(Math.hypot(...hole.c), 0, "孔在軸心", 1e-9);
  close(hole.r, axle.radius, "孔徑等於軸徑", 1e-3);
  close(Math.hypot(...disk.c) / disk.r, 0.5, "偏心距 / 偏心輪半徑", 0.02);
});

test("第 374 種:滾子另成零件,用一根銷裝在踏板上:中心始終在銷上、孔套著銷,銷穿過整個滾子", () => {
  const def = m374.default;
  const treadle = part(def, "treadle");
  const roller = part(def, "roller");
  assert.ok(roller, "滾子是自己的零件(會轉)");
  const pin = treadle.pieces.find((q) => q.role === "rollerPin");
  assert.ok(pin, "踏板上有滾子的銷");
  const wheel = roller.pieces.find((q) => q.kind === "plate");
  const holeR = Math.max(...wheel.shape.holes[0].map((p) => Math.hypot(...p)));
  close(holeR, pin.radius, "滾子的孔等於銷徑", 1e-3);
  const [p0, p1] = [pin.at[2] - pin.length / 2, pin.at[2] + pin.length / 2];
  const [r0, r1] = [(wheel.at?.[2] ?? 0) - wheel.thickness / 2, (wheel.at?.[2] ?? 0) + wheel.thickness / 2];
  assert.ok(p0 <= r0 && r1 <= p1, `銷(z ${p0}..${p1})穿過整個滾子(z ${r0}..${r1})`);
  const plate = treadle.pieces.find((q) => q.kind === "plate");
  assert.ok(p0 <= plate.at[2] - plate.thickness / 2 + 1e-9, "銷從踏板背面穿出");
  close(plate.at[2] + plate.thickness / 2, r0, "滾子貼著踏板正面", 1e-9);
  const stroke = 2 * Math.abs(m374.PEDAL[0] - m374.PEDAL[1]);
  for (const v of sweep(stroke, 40)) {
    const pose = def.pose(v).parts;
    const [x, y] = rot2(pin.at, pose.treadle.angle);
    const at = [treadle.center[0] + x, treadle.center[1] + y];
    close(dist([...at, 0], [pose.roller.position[0], pose.roller.position[1], 0]), 0, `行程 ${v.toFixed(2)}:滾子中心在踏板的銷上`, 1e-9);
  }
});

test("第 374 種:皮帶在偏心輪與滾子上都不打滑:輪面相對皮帶繞過的那一段不動,滾子照皮帶走的長度轉", () => {
  const def = m374.default;
  const { disk } = eccentricOf(def);
  const roller = part(def, "roller");
  const rollerR = Math.max(...roller.pieces.find((q) => q.kind === "plate").shape.outline.map((p) => Math.hypot(...p)));
  const shaft = part(def, "shaft");
  const diskAt = shaft.pieces.find((q) => q.kind === "plate" && q.shape.holes.length).at;
  // 皮帶繞過某個輪的那一段的中點(離輪心等距的點裡排在中間的那一個)與輪心連線的角度
  const midWrap = (points, c) => {
    const d = points.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1]));
    const r = Math.min(...d);
    const on = d.map((x, i) => (Math.abs(x - r) < 1e-6 ? i : -1)).filter((i) => i >= 0);
    const p = points[on[Math.floor(on.length / 2)]];
    return Math.atan2(p[1] - c[1], p[0] - c[0]);
  };
  const stroke = 2 * Math.abs(m374.PEDAL[0] - m374.PEDAL[1]);
  const dv = stroke / 4000;
  const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  for (const v of sweep(2 * stroke, 60).slice(0, -1)) {
    const [a, b] = [def.pose(v), def.pose(v + dv)];
    const travel = b.paths.belt.phase - a.paths.belt.phase;
    assert.ok(Math.abs(travel) > 1e-6, "皮帶在走");
    const eccAt = (pose) => {
      const [x, y] = rot2(diskAt, pose.parts.shaft.angle);
      return [shaft.center[0] + x, shaft.center[1] + y];
    };
    const slipE = (pose) => midWrap(pose.paths.belt.points, eccAt(pose));
    const slipR = (pose) => midWrap(pose.paths.belt.points, pose.parts.roller.position);
    const ecc = (b.parts.shaft.angle - a.parts.shaft.angle - wrapPi(slipE(b) - slipE(a))) * disk.r;
    const rol = (b.parts.roller.angle - a.parts.roller.angle - wrapPi(slipR(b) - slipR(a))) * rollerR;
    close(ecc / travel, 1, `行程 ${v.toFixed(2)}:偏心輪面和皮帶同速`, 2e-3);
    close(rol / travel, 1, `行程 ${v.toFixed(2)}:滾子面和皮帶同速`, 2e-3);
  }
});

test("第 375 種:滾壓輪:輪軸接在直立軸上,輪在環形鍋盆裡繞行並滾動(不打滑)", () => {
  const a = m375.runners(0);
  const b = m375.runners(1);
  const { RUN, WHEEL } = m375.geometry;
  close(Math.abs(b.roll - a.roll) * WHEEL, Math.abs(b.shaft - a.shaft) * RUN, "輪滾過的長度 = 繞行的弧長");
});

// 群組零件裡沿自己軸線放的圓柱(at 只有沿軸的分量)→ 世界座標的 { at, axis, radius, length }
const alongAxis = (p, q) => ({ at: add(p.center, scale(p.axis, q.at?.[2] ?? 0)), axis: p.axis, radius: q.radius, length: q.length });

test("第 375 種:頂上的傘齒輪照原圖約 2 : 1(水平的大、垂直的小,原圖量約 2.1),直立軸轉速是主動軸的一半", () => {
  const def = m375.default;
  const [big, small] = ["shaft", "drive"].map((id) => part(def, id).pieces.find((q) => q.kind === "gear"));
  const ratio = big.radius / small.radius;
  assert.ok(ratio > 1.8 && ratio < 2.4, `水平傘齒輪約為垂直的兩倍(${ratio.toFixed(2)})`);
  close(big.teeth / small.teeth, ratio, "齒數比等於節圓半徑比", 1e-9);
  close(Math.abs(turned(def, "shaft", 0, 1) / turned(def, "drive", 0, 1)), small.teeth / big.teeth, "直立軸轉速比", 1e-9);
});

test("第 375 種:直立軸上穿過橫樑的軸承、下端立在盆底中央的腳軸承裡;主動軸由橫樑上的短立柱撐著;門形框的橫樑和立柱同一個平面、立在底座上", () => {
  const def = m375.default;
  const frame = part(def, "frame");
  const shaft = part(def, "shaft");
  const drive = part(def, "drive");
  const vertical = alongAxis(shaft, shaft.pieces.find((q) => q.kind === "cylinder" && q.length > 2));
  assertShaftInBearings(vertical, frame.pieces, "直立軸");
  const rings = frame.pieces.filter((q) => q.kind === "cylinder" && q.inner && q.axis?.[1] === 1);
  assert.ok(rings.length >= 2, "直立軸上下各一個軸承");
  const ys = rings.map((q) => q.at[1]);
  const { FLOOR, WHEEL } = m375.geometry;
  assert.ok(Math.min(...ys) < FLOOR && Math.max(...ys) > FLOOR + 2 * WHEEL, "一個在盆底、一個在輪的上方(橫樑)");
  const base = frame.pieces.find((q) => q.role === "base");
  close(vertical.at[1] - vertical.length / 2, base.at[1] + base.size[1] / 2, "直立軸的下端立在底座上", 1e-9);
  const driveShaft = alongAxis(drive, drive.pieces.find((q) => q.kind === "cylinder" && q.length > 1));
  assertShaftInBearings(driveShaft, frame.pieces, "主動軸");
  assertOnePiece({ pieces: frame.pieces.filter((q) => q.kind !== "lathe") }, "橫樑、立柱、軸承與底座接成一件");
  const beam = frame.pieces.filter((q) => q.role === "beam");
  const posts = frame.pieces.filter((q) => q.role === "post");
  assert.ok(beam.length && posts.length === 2, "門形框:橫樑與兩根立柱");
  for (const q of [...beam, ...posts]) close(q.at[2], 0, "橫樑、立柱和直立軸在同一個平面", 1e-9);
});

// 第 376 種:輪緣板(帶孔的那塊)的內面半徑與正面的 z
const rimOf376 = () => {
  const rim = part(m376.default, "wheel").pieces.find((q) => q.kind === "plate" && q.shape.holes.length);
  return { inner: Math.min(...rim.shape.holes[0].map((p) => Math.hypot(...p))), front: (rim.at?.[2] ?? 0) + rim.thickness / 2 };
};
const LEGS_376 = ["FF", "FB", "HF", "HB"];

test("第 376 種:馬在輪心朝轉向的那一側(逆時針轉時在左)、身體前高後低,重量對輪軸的力矩和輪的轉向同號(原文:藉由試圖沿其內側往上行走的動物之重量而轉動)", () => {
  const def = m376.default;
  close(turned(def, "wheel", 0, 1), 2 * Math.PI, "進程一圈,輪逆時針轉一圈");
  const horse = part(def, "horse");
  const body = horse.pieces.find((q) => q.kind === "plate").shape.outline;
  // 輪廓的面積重心
  let [area, cx] = [0, 0];
  body.forEach((p, i) => {
    const q = body[(i + 1) % body.length];
    const c = p[0] * q[1] - q[0] * p[1];
    area += c / 2;
    cx += ((p[0] + q[0]) * c) / 6;
  });
  const x = horse.center[0] + cx / area;
  const torque = -x; // 重量往下:對輪軸的力矩 z 分量 = x · (−mg)
  assert.ok(torque > 0.3, `馬的重心在輪心左邊夠遠(x ${x.toFixed(2)}),重量讓輪逆時針轉`);
  const nose = body.reduce((a, b) => (b[0] < a[0] ? b : a));
  const tail = body.reduce((a, b) => (b[0] > a[0] ? b : a));
  assert.ok(nose[1] - tail[1] > 0.5, "馬面朝左往上爬:頭那一端比臀部高(原圖前高後低)");
});

test("第 376 種:四隻蹄輪流踩在輪緣內面:支撐的蹄貼著輪緣內面、和輪面一起往後走,抬起的蹄離開輪面;腿接在馬身上,兩節長度不變", () => {
  const def = m376.default;
  const { inner } = rimOf376();
  const dp = 1e-5;
  const len0 = {};
  const seen = Object.fromEntries(LEGS_376.map((k) => [k, { stance: 0, lift: 0 }]));
  for (const p of sweep(0.25, 500)) {
    const pose = def.pose(p).parts;
    const next = def.pose(p + dp).parts;
    let standing = 0;
    for (const k of LEGS_376) {
      const [leg, shin] = [pose[`leg${k}`], pose[`shin${k}`]];
      close(Math.hypot(leg.to[0] - shin.from[0], leg.to[1] - shin.from[1]), 0, "兩節在膝相接(上下兩層)", 1e-9);
      const lengths = [dist(leg.from, leg.to), dist(shin.from, shin.to)];
      len0[k] ??= { lengths, top: leg.from };
      lengths.forEach((l, i) => close(l, len0[k].lengths[i], `腿 ${k} 第 ${i + 1} 節長度不變`, 1e-9));
      close(dist(leg.from, len0[k].top), 0, `腿 ${k} 接在馬身上的那一端不動`, 1e-9);
      const gap = inner - (Math.hypot(shin.to[0], shin.to[1]) + part(def, `shin${k}`).width / 2);
      assert.ok(gap > -1e-9, `進程 ${p.toFixed(3)}:蹄 ${k} 不穿進輪緣(${gap.toFixed(4)})`);
      seen[k].lift = Math.max(seen[k].lift, gap);
      if (gap > 1e-9) continue;
      standing++;
      seen[k].stance++;
      const hoof = next[`shin${k}`].to;
      if (inner - (Math.hypot(hoof[0], hoof[1]) + part(def, `shin${k}`).width / 2) > 1e-9) continue;
      const moved = Math.atan2(hoof[1], hoof[0]) - Math.atan2(shin.to[1], shin.to[0]);
      close(moved, next.wheel.angle - pose.wheel.angle, `進程 ${p.toFixed(3)}:支撐的蹄 ${k} 和輪面同速`, 1e-9);
    }
    assert.ok(standing >= 2, `進程 ${p.toFixed(3)}:至少兩隻蹄踩在輪緣上(${standing})`);
  }
  for (const k of LEGS_376) assert.ok(seen[k].stance > 50 && seen[k].lift > 0.1, `蹄 ${k} 輪流踩下與抬起`);
});

test("第 376 種:輪心的軸和輪一起轉(原圖輪心打斜線是剖開的軸),往後穿過軸承座;輪轂接到格子,螺栓在輪緣正面,轉向箭頭在輪緣前面", () => {
  const def = m376.default;
  const wheel = part(def, "wheel");
  const frame = part(def, "frame");
  const axle = wheel.pieces.find((q) => q.role === "axle");
  assert.ok(axle, "軸是輪的一部分");
  assert.ok(!frame.pieces.some((q) => q.kind === "cylinder" && !q.inner), "機架上沒有固定軸");
  assertShaftInBearings({ at: axle.at, radius: axle.radius, length: axle.length }, frame.pieces, "輪軸");
  const hub = wheel.pieces.find((q) => q.role === "hub");
  const bars = wheel.pieces.filter((q) => q.role === "grid");
  const reach = (q) => {
    const [x, y] = rot2([-q.at[0], -q.at[1]], -(q.angle ?? 0));
    return Math.hypot(Math.max(Math.abs(x) - q.size[0] / 2, 0), Math.max(Math.abs(y) - q.size[1] / 2, 0));
  };
  assert.ok(bars.filter((q) => reach(q) <= hub.radius).length >= 4, "最內圈的四根格條碰到輪轂");
  const { front } = rimOf376();
  const bolts = wheel.pieces.filter((q) => q.kind === "sphere");
  assert.ok(bolts.length >= 8 && bolts.every((q) => Math.abs(q.at[2] - front) < 1e-9), "螺栓在輪緣正面(看得到)");
  assert.ok(wheel.spinOffset > front, "轉向箭頭在輪緣前面");
  assert.ok(bars.some((q) => q.accent), "一根格條塗記號色,看得出輪在轉");
});

test("第 376 種:軸端的大齒輪咬著小齒輪把動力傳出去(原文:驅動渡輪的槳輪等;推斷),小齒輪是目標件、照齒數比反向轉", () => {
  const def = m376.default;
  const wheel = part(def, "wheel");
  const gear = wheel.pieces.find((q) => q.kind === "gear");
  const axle = wheel.pieces.find((q) => q.role === "axle");
  assert.ok(gear, "軸端有大齒輪");
  assert.ok(Math.abs(gear.at[2] - (axle.at[2] - axle.length / 2)) < gear.width, "大齒輪在軸的後端");
  const pinion = part(def, "pinion");
  assert.equal(def.target, "pinion");
  close(pinion.center[2], gear.at[2], "兩個齒輪同一層", 1e-9);
  close(Math.hypot(pinion.center[0], pinion.center[1]), gear.radius + pinion.radius, "節圓相切", 1e-9);
  close(turned(def, "pinion", 0, 0.1) / turned(def, "wheel", 0, 0.1), -gear.teeth / pinion.teeth, "轉速比", 1e-9);
  const pin = pinion.pieces.find((q) => q.kind === "cylinder");
  assertShaftInBearings({ at: add(pinion.center, pin.at), radius: pin.radius, length: pin.length }, part(def, "frame").pieces, "小齒輪的軸");
});

// 第 377 種:圓筒的踏板(沿軸的長方塊)在世界中的中心;軸沿 x,ψ 從 +y 往 +z 量
const treads377 = (angle) => {
  const drum = part(m377.default, "drum");
  return drum.pieces.filter((q) => q.role === "tread").map((q) => ({ q, at: partPoint([0, 0, 0], drum.axis, angle, q.at) }));
};
const psi = (p) => Math.atan2(p[2], p[1]);

test("第 377 種:人在圓筒朝讀者那一側往上爬,重量經支撐腳壓在踏板上,對軸的力矩和圓筒的轉向同號(原文:藉由人們踩踏於周邊踏板上的重量而轉動),人那一側往下走;重心在支撐腳上方", () => {
  const def = m377.default;
  const spin = turned(def, "drum", 0, 0.01);
  assert.ok(spin > 0, "圓筒繞 +x 轉:朝讀者(+z)那一側往下走");
  const treadOuter = Math.max(...treads377(0).map((t) => Math.hypot(t.at[1], t.at[2]) + t.q.size[0] / 2));
  // 重量經支撐腳傳到踏板:在腳和踏板的接觸點,重量 (0, −mg, 0) 對 x 軸的力矩 = −z · (−mg) = z · mg
  const contacts = [];
  for (const p of sweep(0.25, 200)) {
    const pose = def.pose(p).parts;
    for (const k of ["A", "B"]) {
      const foot = pose[`shin${k}`].to;
      const r = Math.hypot(foot[1], foot[2]);
      if (r - part(def, `shin${k}`).width / 2 - treadOuter > 1e-9) continue; // 抬起的腳
      const c = [foot[0], (foot[1] * treadOuter) / r, (foot[2] * treadOuter) / r]; // 腳底貼著踏板外緣的那一點
      contacts.push(c);
      assert.ok(c[2] > 0.3, `進程 ${p.toFixed(3)}:腳 ${k} 踩在 +z 那一側、離軸夠遠(z ${c[2].toFixed(2)})`);
      assert.equal(Math.sign(c[2]), Math.sign(spin), "力矩和轉向同號");
    }
  }
  // 重心(軀幹的中心)在支撐腳上方:支撐腳的接觸點從重心前面(圓筒那一側,z 小)被帶到重心後面,重心不在腳的外側
  // (在腳外側就是往後仰、吊在橫桿上);而且不比接觸點的平均位置更往外(在支撐腳上方或略往圓筒那側)
  const person = part(def, "person");
  const torso = person.pieces.find((q) => q.role === "torso");
  const com = person.center[2] + torso.at[2];
  const zs = contacts.map((c) => c[2]);
  const mean = zs.reduce((a, b) => a + b, 0) / zs.length;
  assert.ok(com > Math.min(...zs) && com < Math.max(...zs), `重心 z ${com.toFixed(2)} 在支撐腳走過的範圍 ${Math.min(...zs).toFixed(2)}–${Math.max(...zs).toFixed(2)} 之內`);
  assert.ok(com <= mean + 1e-9, `重心 z ${com.toFixed(2)} 不比支撐腳的平均位置(${mean.toFixed(2)})更往外`);
  const before = treads377(0).map((t) => psi(t.at));
  const after = treads377(0.01).map((t) => psi(t.at));
  assert.ok(after.every((a, i) => Math.sin(a - before[i]) > 0), "踏板往 ψ 增加的方向走:人那一側往下");
});

test("第 377 種:腳輪流踩在踏板上、跟著踏板往下走,抬起的腳往上邁;手扶著前面的橫桿;腿的兩節長度不變", () => {
  const def = m377.default;
  const frame = part(def, "frame");
  const rail = frame.pieces.find((q) => q.role === "rail");
  const treadOuter = Math.max(...treads377(0).map((t) => Math.hypot(t.at[1], t.at[2]) + t.q.size[0] / 2));
  const len0 = {};
  const seen = { A: 0, B: 0 };
  const dp = 1e-5;
  for (const p of sweep(0.25, 400)) {
    const pose = def.pose(p).parts;
    const next = def.pose(p + dp).parts;
    const treads = treads377(pose.drum.angle);
    let standing = 0;
    for (const k of ["A", "B"]) {
      const [thigh, shin] = [pose[`thigh${k}`], pose[`shin${k}`]];
      close(Math.hypot(thigh.to[1] - shin.from[1], thigh.to[2] - shin.from[2]), 0, "兩節在膝相接", 1e-9);
      const lengths = [dist(thigh.from, thigh.to), dist(shin.from, shin.to)];
      len0[k] ??= { lengths, hip: thigh.from };
      lengths.forEach((l, i) => close(l, len0[k].lengths[i], `腿 ${k} 第 ${i + 1} 節長度不變`, 1e-9));
      close(dist(thigh.from, len0[k].hip), 0, `腿 ${k} 接在身上的那一端不動`, 1e-9);
      const foot = shin.to;
      const gap = Math.hypot(foot[1], foot[2]) - part(def, `shin${k}`).width / 2 - treadOuter;
      assert.ok(gap > -1e-9, `進程 ${p.toFixed(3)}:腳 ${k} 不踩進踏板(${gap.toFixed(4)})`);
      if (gap > 1e-9) continue;
      // 踩著的那一片踏板:腳在它的寬度裡
      const on = treads.find((t) => Math.abs(Math.atan2(Math.sin(psi(t.at) - psi(foot)), Math.cos(psi(t.at) - psi(foot)))) * treadOuter < t.q.size[1] / 2);
      assert.ok(on, `進程 ${p.toFixed(3)}:腳 ${k} 落在一片踏板上`);
      standing++;
      seen[k]++;
      const f2 = next[`shin${k}`].to;
      if (Math.hypot(f2[1], f2[2]) - part(def, `shin${k}`).width / 2 - treadOuter > 1e-9) continue;
      close(psi(f2) - psi(foot), next.drum.angle - pose.drum.angle, `進程 ${p.toFixed(3)}:腳 ${k} 跟著踏板走`, 1e-9);
    }
    assert.ok(standing >= 1, `進程 ${p.toFixed(3)}:至少一隻腳踩在踏板上`);
  }
  assert.ok(seen.A > 50 && seen.B > 50, "兩隻腳輪流踩");
  // 手扶著橫桿:手(臂端的圓)貼著橫桿頂面,在人的前面(−z 那一側)
  const pose = def.pose(0).parts;
  for (const k of ["A", "B"]) {
    const arm = pose[`arm${k}`];
    const top = rail.at[1] + rail.size[1] / 2;
    close(arm.to[1] - part(def, `arm${k}`).width / 2, top, `手 ${k} 擱在橫桿頂上`, 1e-9);
    close(arm.to[2], rail.at[2], `手 ${k} 在橫桿正上方`, 1e-9);
    assert.ok(arm.to[2] < arm.from[2], "橫桿在人的前面(人面向圓筒、背對讀者)");
  }
});

test("第 377 種:踏板釘在圓筒上、大齒輪套緊在軸上、扶手的立柱立在底座上、頭接在身上;大齒輪轉到最低也不碰底板", () => {
  const def = m377.default;
  const drum = part(def, "drum");
  const core = drum.pieces.find((q) => q.role === "core");
  for (const t of drum.pieces.filter((q) => q.role === "tread")) close(Math.hypot(t.at[0], t.at[1]) - t.size[0] / 2, core.radius, "踏板內緣貼著圓筒", 1e-9);
  const axle = drum.pieces.find((q) => q.role === "axle");
  const gear = drum.pieces.find((q) => q.role === "gear");
  close(Math.max(...gear.shape.holes[0].map((p) => Math.hypot(...p))), axle.radius, "大齒輪的孔等於軸徑", 1e-3);
  const frame = part(def, "frame");
  const base = frame.pieces.find((q) => q.role === "base");
  const baseTop = base.at[1] + base.size[1] / 2;
  const rail = frame.pieces.find((q) => q.role === "rail");
  const posts = frame.pieces.filter((q) => q.role === "railPost");
  assert.equal(posts.length, 2, "扶手兩端各一根立柱");
  for (const q of posts) {
    close(q.at[1] - q.size[1] / 2, baseTop, "立柱立在底座上", 1e-9);
    close(q.at[1] + q.size[1] / 2, rail.at[1] + rail.size[1] / 2, "立柱頂到橫桿", 1e-9);
    assert.ok(Math.abs(q.at[0]) > drum.pieces.find((t) => t.role === "tread").size[2] / 2 && Math.abs(q.at[0] - rail.at[0]) <= rail.size[0] / 2, "立柱在圓筒兩端外面、撐著橫桿");
  }
  const person = part(def, "person");
  const torso = person.pieces.find((q) => q.role === "torso");
  const head = person.pieces.find((q) => q.kind === "sphere");
  close(head.at[1] - head.radius, torso.at[1] + torso.size[1] / 2, "頭擱在身體頂上", 1e-9);
  // 大齒輪最外的點(齒頂的角)轉到最低時離底板頂面還有間隙
  const teeth = drum.pieces.filter((q) => q.role === "tooth");
  const reach = Math.max(...teeth.map((q) => Math.hypot(Math.hypot(q.at[0], q.at[1]) + q.size[0] / 2, q.size[1] / 2)));
  assert.ok(-reach - baseTop > 0.02, `大齒輪的齒不碰底板(間隙 ${(-reach - baseTop).toFixed(3)})`);
  assert.ok(!(def.waivers ?? []).some((w) => w.parts.includes("drum") && w.parts.includes("frame")), "不再需要齒輪擦底板的豁免");
});

test("第 378 種:擺鋸:擺的運動經連桿推拉弓鋸往復,弓鋸一面鋸一面往下切進樹幹", () => {
  const d = m378.default;
  const quarter = 1 / 48; // 擺擺到最右、最左的進程(一輪 12 次)
  const right = d.pose(quarter).parts;
  const left = d.pose(3 * quarter).parts;
  assert.ok(right.pendulum.angle > 0 && left.pendulum.angle < 0, "擺左右擺");
  assert.ok(right.saw.position[0] - left.saw.position[0] > 0.5, "擺往右,鋸跟著往右;擺往左,鋸跟著往左(行程看得出來)");
  const ys = sweep(1 - 1e-9, 300).map((p) => d.pose(p).parts.saw.position[1]); // 進程 1 繞回 0(刻意的循環)
  assert.ok(ys.every((y, i) => i === 0 || y <= ys[i - 1] + 1e-12), "鋸的時候一路往下");
  close(ys[0] - ys.at(-1), m378.DEPTH, "一輪鋸進的深度", 1e-6);
  const blade = part(d, "saw").pieces.find((q) => q.role === "blade");
  const tip = Math.min(...blade.shape.outline.map((v) => v[1]));
  const log = part(d, "log");
  close(ys[0] + tip, log.center[1] + log.radius, "進程 0 時鋸齒尖剛碰到樹幹頂", 1e-9);
});

test("第 378 種:連桿長度不變,兩端的眼套在擺桿中間那個孔的銷與鋸左把手的銷上", () => {
  const d = m378.default;
  const pend = part(d, "pendulum");
  const rod = part(d, "rod");
  assert.equal(rod.stretch, undefined, "連桿不會伸縮");
  const plate = pend.pieces.find((q) => q.role === "rod");
  assert.equal(plate.shape.holes.length, 3, "擺桿上三個孔(原圖)");
  const holeY = plate.shape.holes.map((h) => h.reduce((s, v) => s + v[1], 0) / h.length).sort((a, b) => a - b);
  const pPin = pend.pieces.find((q) => q.role === "pin");
  close(pPin.at[0], 0, "銷在擺桿中線上", 1e-9);
  close(pPin.at[1], holeY[1], "銷在中間那個孔裡", 1e-9);
  const sPin = part(d, "saw").pieces.find((q) => q.role === "pin");
  const lengths = sweep(1, 600).map((p) => {
    const s = d.pose(p).parts;
    const [hx, hy] = rot2(pPin.at, s.pendulum.angle);
    close(Math.hypot(s.rod.from[0] - (pend.center[0] + hx), s.rod.from[1] - (pend.center[1] + hy)), 0, `進程 ${p.toFixed(3)}:連桿一端在擺桿的銷上`, 1e-9);
    const z0 = pend.center[2] + pPin.at[2];
    assert.ok(Math.abs(s.rod.from[2] - z0) < pPin.length / 2 - rod.thickness / 2, "擺桿的銷穿過連桿的眼(深度)");
    close(Math.hypot(s.rod.to[0] - (s.saw.position[0] + sPin.at[0]), s.rod.to[1] - (s.saw.position[1] + sPin.at[1])), 0, `進程 ${p.toFixed(3)}:連桿另一端在鋸把手的銷上`, 1e-9);
    assert.ok(Math.abs(s.rod.to[2] - (s.saw.position[2] + sPin.at[2])) < sPin.length / 2 - rod.thickness / 2, "鋸把手的銷穿過連桿的眼(深度)");
    return dist(s.rod.from, s.rod.to);
  });
  for (const l of lengths) close(l, lengths[0], "連桿長度不變", 1e-9);
});

test("第 378 種:繩吊著倒 U 形托架,托架只往下降;弓鋸夾在托架的兩條橫導軌之間橫向滑", () => {
  const d = m378.default;
  const carriage = part(d, "carriage");
  assertOnePiece(carriage, "托架是一件");
  assertOnePiece(part(d, "saw"), "弓鋸是一件");
  const rails = carriage.pieces.filter((q) => q.role === "rail").map((q) => pieceBox(q)).sort((a, b) => a.lo[1] - b.lo[1]);
  const uprights = carriage.pieces.filter((q) => q.role === "upright").map((q) => pieceBox(q)).sort((a, b) => a.lo[0] - b.lo[0]);
  assert.equal(rails.length, 2, "兩條橫導軌");
  assert.equal(uprights.length, 2, "兩根立條(倒 U 形)");
  const saw = part(d, "saw");
  const slider = pieceBox(saw.pieces.find((q) => q.role === "slider"));
  const sawX = saw.pieces.map((q) => pieceBox(q));
  const sawLo = Math.min(...sawX.map((b) => b.lo[0]));
  const sawHi = Math.max(...sawX.map((b) => b.hi[0]));
  const poses = sweep(1 - 1e-9, 600).map((p) => d.pose(p).parts);
  for (const s of poses) {
    const [cx, cy, cz] = s.carriage.position;
    close(cx, poses[0].carriage.position[0], "托架不橫移", 1e-9);
    close(s.saw.position[1] - cy, poses[0].saw.position[1] - poses[0].carriage.position[1], "鋸跟著托架往下", 1e-9);
    const sy = s.saw.position[1] - cy;
    close(slider.lo[1] + sy, rails[0].hi[1], "鋸背後的橫條壓在下導軌上", 1e-9);
    close(rails[1].lo[1], slider.hi[1] + sy, "上導軌壓著橫條", 1e-9);
    const sz = s.saw.position[2] - cz;
    assert.ok(slider.lo[2] + sz >= rails[0].lo[2] - 1e-9 && slider.hi[2] + sz <= rails[0].hi[2] + 1e-9, "橫條和導軌在同一個深度");
    const sx = s.saw.position[0] - cx;
    assert.ok(sawLo + sx > uprights[0].hi[0] && sawHi + sx < uprights[1].lo[0], `鋸在兩根立條之間來回(${(sawLo + sx).toFixed(3)}..${(sawHi + sx).toFixed(3)})`);
  }
  const ys = poses.map((s) => s.carriage.position[1]);
  assert.ok(ys.every((y, i) => i === 0 || y <= ys[i - 1] + 1e-12), "托架只往下降");
});

test("第 378 種:繩長不變,繩的下端掛在托架的掛眼上、全程在滑輪下方、垂直往上接到滑輪;托架降多少配重升多少", () => {
  const d = m378.default;
  const carriage = part(d, "carriage");
  const eyes = carriage.pieces.filter((q) => q.role === "eye").map((q) => pieceBox(q)).sort((a, b) => a.lo[0] - b.lo[0]);
  const weight = part(d, "weightL");
  const L0 = {};
  for (const p of sweep(1, 300)) {
    const s = d.pose(p);
    ["L", "R"].forEach((side, i) => {
      const pts = s.paths[`cord${side}`].points;
      const sheave = part(d, `sheave${side}`);
      const rope = part(d, `cord${side}`);
      L0[side] ??= pathLength(pts);
      close(pathLength(pts), L0[side], `進程 ${p.toFixed(3)}:繩長不變`, 1e-9);
      const [x0, y0] = pts[0];
      const c = s.parts.carriage.position;
      close(x0, (eyes[i].lo[0] + eyes[i].hi[0]) / 2 + c[0], "繩的下端在掛眼上(x)", 1e-9);
      close(y0, eyes[i].hi[1] + c[1], "繩的下端在掛眼上(y)", 1e-9);
      assert.ok(y0 < sheave.center[1] - sheave.radius - 2 * sheave.radius, `進程 ${p.toFixed(3)}:掛眼在滑輪下方(${y0.toFixed(3)})`);
      close(pts[1][0], x0, "繩從掛眼垂直往上", 1e-9);
      close(Math.hypot(pts[1][0] - sheave.center[0], pts[1][1] - sheave.center[1]), sheave.radius + rope.radius, "繩接到滑輪的切點", 1e-9);
      const w = s.parts[`weight${side}`].position;
      close(pts.at(-1)[1], w[1] + weight.size[1] / 2, "繩的另一端吊著配重", 1e-9);
      close(pts.at(-1)[0], w[0], "配重吊在繩的正下方", 1e-9);
    });
  }
  const a = d.pose(0.1).parts;
  const b = d.pose(0.6).parts;
  const drop = a.carriage.position[1] - b.carriage.position[1];
  close(b.weightL.position[1] - a.weightL.position[1], drop, "配重與托架反向等量移動", 1e-9);
  const sheave = part(d, "sheaveL");
  close(Math.abs(b.sheaveL.angle - a.sheaveL.angle) * (sheave.radius + part(d, "cordL").radius), drop, "滑輪跟著繩轉、不打滑", 1e-9);
});

// 第 379、380 種:drill、screw、feedScrew 的軸是 Y(局部 z 是世界的上下、局部 y 是深度)。零件 q 的一塊在世界裡的上下範圍
const spanY = (q, y0) => {
  if (q.kind === "lathe") return [y0 + Math.min(...q.profile.map((v) => v[1])), y0 + Math.max(...q.profile.map((v) => v[1]))];
  const b = pieceBox(q);
  return [y0 + b.lo[2], y0 + b.hi[2]];
};
const role = (p, r) => p.pieces.find((q) => q.role === r);
const yOf = (def, pose, id) => (pose[id].position ?? part(def, id).center)[1];

test("第 379 種:進料螺桿與鑽頭相對,把墊塊與工件往上頂向鑽頭:行程中段工件碰到鑽尖,之後鑽頭鑽進工件", () => {
  const d = m379.default;
  assert.deepEqual(part(d, "drill").axis, Y);
  assert.deepEqual(part(d, "screw").axis, Y);
  const bit = role(part(d, "drill"), "bit");
  const pad = role(part(d, "screw"), "pad");
  const worm = role(part(d, "screw"), "worm");
  const work = part(d, "work");
  const padBox = pieceBox(pad);
  assert.ok(padBox.hi[2] - padBox.lo[2] < 0.2 && padBox.hi[2] - padBox.lo[2] < padBox.hi[1] - padBox.lo[1], "墊塊是扁平的板(原圖)");
  const rows = sweep(cramp.MAX, 200).map((t) => {
    const s = d.pose(-t).parts; // 主動量是鑽頭的轉角,曲柄從上看順時針轉 t 是 −t
    const tip = spanY(bit, yOf(d, s, "drill"))[0];
    const workTop = s.work.position[1] + work.size[1] / 2;
    const workBottom = s.work.position[1] - work.size[1] / 2;
    const [padBottom, padTop] = spanY(pad, s.screw.position[1]);
    close(workBottom, padTop, `曲柄轉 ${t.toFixed(2)}:工件擱在墊塊上`, 1e-9);
    assert.ok(padBottom > cramp.ARMS.lower[1] + 1e-9, `曲柄轉 ${t.toFixed(2)}:墊塊在下臂上方`);
    const [w0, w1] = spanY(worm, s.screw.position[1]);
    assert.ok(w0 < cramp.ARMS.lower[0] && w1 > cramp.ARMS.lower[1], "進料螺桿一直旋在下臂裡");
    return { t, gap: tip - workTop, screwY: s.screw.position[1], screwA: s.screw.angle, drillA: s.drill.angle };
  });
  assert.ok(rows.at(-1).screwY > rows[0].screwY, "下臂的進料螺桿往上頂");
  assert.ok(rows.at(-1).drillA < rows[0].drillA, "鑽頭從上往下看順時針轉(繞 +Y 負轉):右旋鑽頭要這樣轉才切削");
  assert.ok(rows[0].gap > 0 && rows[0].gap < 0.3, `開始時工件在鑽尖下方不遠(${rows[0].gap.toFixed(3)})`);
  assert.ok(rows.at(-1).gap < -0.05, `行程結束時鑽尖低於工件頂面(鑽進去 ${(-rows.at(-1).gap).toFixed(3)})`);
  const meet = rows.find((r) => r.gap <= 0).t;
  assert.ok(meet > 0.2 * cramp.MAX && meet < 0.9 * cramp.MAX, "行程中段工件碰到鑽尖");
  // 螺桿照它實際的轉角與螺紋的旋向(讀零件的 hand)在固定的螺孔裡前進,前進的方向是往上(頂向鑽頭)
  for (const r of rows.slice(1)) {
    const move = screwTravel(part(d, "screw"), worm, r.screwA - rows[0].screwA);
    close(r.screwY - rows[0].screwY, move[1], `曲柄轉 ${r.t.toFixed(2)}:螺桿照螺紋的旋向在下臂的螺孔裡前進`, 1e-9);
    assert.ok(move[1] > 0, "照這個旋向與轉向,螺桿往上走");
  }
});

test("第 380 種:鑽頭心軸穿過進料螺桿中心,進料螺桿旋在上臂裡往下走、下端頂著心軸上的夾頭,把鑽頭送進工件", () => {
  const d = m380.default;
  assert.deepEqual(part(d, "drill").axis, Y);
  assert.deepEqual(part(d, "feedScrew").axis, Y);
  const drill = part(d, "drill");
  const fs = part(d, "feedScrew");
  const worm = role(fs, "worm");
  const chuck = role(drill, "chuck");
  const spindle = role(drill, "spindle");
  const arm = role(drill, "arm");
  const bit = role(drill, "bit");
  const work = part(d, "work");
  assert.ok(spindle.radius < worm.radius - worm.thread, "心軸比螺桿的芯細(螺桿中空,心軸從中間穿過)");
  assert.ok((d.powered ?? []).includes("feedScrew"), "進料螺桿是外力來源:人另外轉它,它只靠下端面推著夾頭往下,傳不了轉動給心軸");
  const rows = sweep(cramp.MAX, 200).map((t) => {
    const s = d.pose(-t).parts; // 主動量是鑽頭的轉角,曲柄從上看順時針轉 t 是 −t
    close(s.feedScrew.position[0], s.drill.position[0], "心軸與進料螺桿同軸(x)", 1e-9);
    close(s.feedScrew.position[2], s.drill.position[2], "心軸與進料螺桿同軸(z)", 1e-9);
    const ys = s.drill.position[1];
    const yf = s.feedScrew.position[1];
    const [w0, w1] = spanY(worm, yf);
    const [s0, s1] = spanY(spindle, ys);
    assert.ok(s0 < w0 && s1 > w1, `曲柄轉 ${t.toFixed(2)}:心軸從螺桿的上下兩端穿出`);
    close(w0, spanY(chuck, ys)[1], `曲柄轉 ${t.toFixed(2)}:螺桿下端頂著夾頭`, 1e-9);
    assert.ok(w0 < cramp.ARMS.upper[0] && w1 > cramp.ARMS.upper[1], "進料螺桿一直旋在上臂裡");
    const screwTop = Math.max(...fs.pieces.map((q) => spanY(q, yf)[1]));
    assert.ok(spanY(arm, ys)[0] > screwTop + 0.05, `曲柄轉 ${t.toFixed(2)}:曲柄臂在螺桿與橫柄上方轉,不切進去`);
    const workTop = work.center[1] + work.size[1] / 2;
    return { t, gap: spanY(bit, ys)[0] - workTop, yf, a: s.feedScrew.angle, ys, drillA: s.drill.angle };
  });
  close(work.center[1] - work.size[1] / 2, cramp.ARMS.lower[1], "工件擱在下臂上", 1e-9);
  assert.ok(rows.at(-1).yf < rows[0].yf, "進料螺桿往下走");
  assert.ok(rows.at(-1).drillA < rows[0].drillA, "鑽頭從上往下看順時針轉(繞 +Y 負轉):右旋鑽頭要這樣轉才切削");
  // 螺桿照它實際的轉角與螺紋的旋向(讀零件的 hand)在固定的螺孔裡前進,前進的方向是往下(把心軸送向工件)
  for (const r of rows.slice(1)) {
    const move = screwTravel(fs, worm, r.a - rows[0].a);
    close(r.yf - rows[0].yf, move[1], `曲柄轉 ${r.t.toFixed(2)}:螺桿照螺紋的旋向在上臂的螺孔裡前進`, 1e-9);
    assert.ok(move[1] < 0, "照這個旋向與轉向,螺桿往下走");
    close(r.ys - rows[0].ys, r.yf - rows[0].yf, "螺桿推著心軸一起往下", 1e-9);
  }
  assert.ok(rows[0].gap > 0 && rows[0].gap < 0.3, `開始時鑽尖在工件上方不遠(${rows[0].gap.toFixed(3)})`);
  assert.ok(rows.at(-1).gap < -0.05, `行程結束時鑽尖低於工件頂面(鑽進去 ${(-rows.at(-1).gap).toFixed(3)})`);
});

test("第 379、380 種:曲柄臂貼著心軸頂,握把直立在臂的外端上;379 的 T 形手柄接在螺桿下端", () => {
  for (const d of [m379.default, m380.default]) {
    const drill = part(d, "drill");
    const arm = role(drill, "arm");
    const grip = role(drill, "grip");
    const spindle = role(drill, "spindle");
    const a = pieceBox(arm);
    const g = pieceBox(grip);
    const sp = pieceBox(spindle);
    close(a.lo[2], sp.hi[2], `第 ${d.figure} 種:曲柄臂的底面貼著心軸頂`, 1e-9);
    assert.ok(a.lo[0] <= -spindle.radius && a.hi[0] >= spindle.radius, `第 ${d.figure} 種:曲柄臂蓋住心軸頂`);
    assert.deepEqual(grip.axis ?? Z, Z, `第 ${d.figure} 種:握把沿心軸方向(直立,原圖)`);
    close(g.lo[2], a.hi[2], `第 ${d.figure} 種:握把立在臂上`, 1e-9);
    assert.ok(g.lo[0] >= a.lo[0] - 1e-9 && g.hi[0] <= a.hi[0] + 1e-9, `第 ${d.figure} 種:握把在臂的範圍內`);
  }
  const screw = part(m379.default, "screw");
  const worm = pieceBox(role(screw, "worm"));
  const hub = pieceBox(role(screw, "hub"));
  assert.ok(hub.hi[2] > worm.lo[2] && hub.lo[2] < worm.lo[2], "T 形手柄的轂套著螺桿下端");
});

// 第 381 種:世界座標的點 p 在零件 id 的實體裡(方塊與板件;板件可帶 rotation)
function inPart381(def, pose, id, p) {
  const q = part(def, id);
  const origin = pose.parts[id]?.position ?? q.center ?? [0, 0, 0];
  const solids = [...(q.kind === "group" ? [] : [{ ...q, at: [0, 0, 0] }]), ...(q.pieces ?? [])];
  return solids.some((s) => {
    const d = sub(p, add(origin, s.at ?? [0, 0, 0]));
    const r = s.rotation;
    const [x, y, z] = r ? quatRotate([-r[0], -r[1], -r[2], r[3]], d) : d;
    if (s.kind === "box") return Math.abs(x) <= s.size[0] / 2 && Math.abs(y) <= s.size[1] / 2 && Math.abs(z) <= s.size[2] / 2;
    if (s.kind === "plate") return Math.abs(z) <= (s.thickness ?? 0.2) / 2 && inSolid([x, y], s.shape);
    return false;
  });
}

// 第 381 種:床台面與夾頰頂的高度
function levels381(def) {
  const bed = part(def, "bed");
  const base = bed.pieces.find((q) => q.role === "bed");
  const jaw = bed.pieces.find((q) => q.role === "jaw");
  assert.ok(base && jaw, "床台與夾頰標了 role");
  return { bedTop: pieceBox(base).hi[2], jawTop: pieceBox(jaw).hi[2] };
}

test("第 381 種:木料立著刨邊——立在床台上、比夾頰高出好幾倍,高度大於厚度(原圖的橫截面)", () => {
  const def = m381.default;
  const { bedTop, jawTop } = levels381(def);
  const board = part(def, "board");
  const b = pieceBox({ ...board, at: board.center });
  close(b.lo[2], bedTop, "木料立在床台上", 1e-9);
  assert.ok(b.hi[2] - bedTop > 3 * (jawTop - bedTop), `木料高出夾頰好幾倍(木料 ${(b.hi[2] - bedTop).toFixed(2)}、夾頰 ${(jawTop - bedTop).toFixed(2)})`);
  assert.ok(b.hi[2] - b.lo[2] > 2 * (b.hi[1] - b.lo[1]), "木料立著:高度大於厚度");
});

test("第 381 種:夾頰從上緣燕尾狀地向內收,容納兩個楔塊——楔塊下緣伸到夾頰上緣底下,斜面貼著斜面,全程不穿入", () => {
  const def = m381.default;
  const { bedTop, jawTop } = levels381(def);
  for (const d of sweep(m381.RANGE[1], 4, m381.RANGE[0])) {
    const pose = def.pose(d);
    const x = m381.clampGap(d).xr - 0.5; // 楔塊的中段
    for (const [id, s] of [["wedgeUp", 1], ["wedgeDown", -1]]) {
      // 這個高度上,楔塊外緣與夾頰內緣離中線的距離
      const edge = (z) => {
        let yw = null;
        let yj = null;
        for (let y = 0; y <= 1.2; y += 0.002) {
          const p = [x, s * y, z];
          const w = inPart381(def, pose, id, p);
          const j = inPart381(def, pose, "bed", p);
          assert.ok(!(w && j), `推進 ${d.toFixed(2)}:${id} 穿進夾頰(z ${z.toFixed(2)}、y ${y.toFixed(3)})`);
          if (w) yw = y;
          if (j && yj === null && yw !== null) yj = y;
        }
        assert.ok(yw !== null && yj !== null, `推進 ${d.toFixed(2)}:${id} 在 z ${z.toFixed(2)} 夾在夾頰裡`);
        return { yw, yj };
      };
      const low = edge(bedTop + 0.01);
      const high = edge(jawTop - 0.01);
      assert.ok(low.yw > high.yj + 0.02, `推進 ${d.toFixed(2)}:${id} 的下緣伸到夾頰上緣的底下(燕尾;下緣 ${low.yw.toFixed(3)}、上緣 ${high.yj.toFixed(3)})`);
      for (const e of [low, high]) assert.ok(e.yj - e.yw < 0.006, `推進 ${d.toFixed(2)}:${id} 的斜面貼著夾頰(間隙 ${(e.yj - e.yw).toFixed(3)})`);
    }
  }
});

test("第 381 種:把楔塊順著夾頰往裡推,兩個楔塊的內側從兩邊夾緊立著的木料", () => {
  const def = m381.default;
  const { bedTop } = levels381(def);
  const board = part(def, "board");
  const half = board.size[1] / 2;
  const z = bedTop + 0.1;
  const gapAt = (d, id, s) => {
    const pose = def.pose(d);
    const x = m381.clampGap(d).xr - 0.5;
    assert.ok(!inPart381(def, pose, id, [x, s * (half - 0.002), z]), `推進 ${d.toFixed(2)}:${id} 沒有壓進木料`);
    let y = half;
    while (!inPart381(def, pose, id, [x, s * y, z]) && y < 2) y += 0.001;
    return y - half;
  };
  assert.ok(m381.clampGap(m381.RANGE[1]).inner < m381.clampGap(m381.RANGE[0]).inner, "推進時兩楔塊靠攏");
  for (const [id, s] of [["wedgeUp", 1], ["wedgeDown", -1]]) {
    assert.ok(gapAt(m381.RANGE[0], id, s) > 0.1, `推進前 ${id} 離木料還有一段`);
    assert.ok(gapAt(m381.RANGE[1], id, s) < 0.003, `推到底時 ${id} 的內側貼著木料`);
  }
});

test("第 382 種:鏡子支架:玻璃可抬高或降下、左右轉動,並改變傾斜角度", () => {
  const def = m382.default;
  const low = def.pose(0, "low").parts;
  const high = def.pose(0, "high").parts;
  assert.ok(high.mirror.position[1] > low.mirror.position[1], "抬升");
  assert.notDeepEqual(def.pose(0, "turned").parts.mirror.rotation, high.mirror.rotation, "左右轉動");
  assert.notDeepEqual(def.pose(-0.3, "high").parts.mirror.rotation, high.mirror.rotation, "改變傾角");
});

// 第 382 種:零件的一塊換到世界座標(零件不轉時)
const at382 = (q, origin) => ({ ...q, at: add(origin, q.at ?? [0, 0, 0]) });

test("第 382 種:玻璃以鉸鏈接在支柱上——鉸鏈裝在鏡背中央的直條上,鏡子中心約在鉸鏈的高度;從鏡背斜看(原圖)", () => {
  const def = m382.default;
  const mirror = part(def, "mirror");
  const stem = part(def, "stem");
  const glass = mirror.pieces.find((q) => q.role === "glass");
  const strap = mirror.pieces.find((q) => q.role === "strap");
  assert.ok(glass && strap, "鏡子有玻璃與鏡背的直條");
  // 鏡子的局部原點就是鉸鏈軸
  const g = pieceBox(glass);
  assert.ok(Math.abs((g.lo[1] + g.hi[1]) / 2) < 0.1, `鏡子中心在鉸鏈的高度(差 ${((g.lo[1] + g.hi[1]) / 2).toFixed(2)})`);
  assert.ok(g.lo[2] > 0 && g.lo[2] < 0.35, `鉸鏈緊貼在鏡背(鏡背離鉸鏈軸 ${g.lo[2].toFixed(2)})`);
  const s = pieceBox(strap);
  assert.ok(Math.abs(s.lo[0] + s.hi[0]) < 1e-9 && s.hi[1] - s.lo[1] > 0.9 * (g.hi[1] - g.lo[1]), "直條在鏡背中央、由上到下");
  assert.ok(s.lo[2] < g.lo[2] && s.hi[2] <= g.lo[2] + 0.06, "直條在玻璃的背面");
  const pose = def.pose(0, "high").parts;
  const pin = stem.pieces.find((q) => q.role === "hingePin");
  const knuckles = mirror.pieces.filter((q) => q.role === "knuckle");
  assertShaftInBearings(at382(pin, pose.stem.position), knuckles.map((q) => at382(q, pose.mirror.position)), "鉸鏈銷");
  assertOnePiece(mirror, "鏡框、玻璃、直條與鉸鏈筒連成一件");
  assertOnePiece(stem, "支柱、鉸鏈座與鉸鏈銷連成一件");
  assert.ok(def.view.direction[2] < 0, "預設視角從鏡背看(原圖從背面畫,鉸鏈與固定螺絲是重點)");
});

test("第 382 種:在鉸鏈處施加固定螺絲將其鎖緊——螺絲和鉸鏈銷同軸,頭頂著鉸鏈筒的端面", () => {
  const def = m382.default;
  const stem = part(def, "stem");
  const pin = stem.pieces.find((q) => q.role === "hingePin");
  const screw = stem.pieces.find((q) => q.role === "hingeScrew");
  assert.ok(pin && screw, "鉸鏈處有固定螺絲");
  assert.deepEqual(screw.axis, pin.axis, "螺絲和鉸鏈銷同軸");
  close(screw.at[1], pin.at[1], "螺絲和鉸鏈銷同高");
  close(screw.at[2], pin.at[2], "螺絲和鉸鏈銷同深");
  const pose = def.pose(0, "high").parts;
  const head = pieceBox(screw, pose.stem.position);
  const ends = part(def, "mirror").pieces.filter((q) => q.role === "knuckle").map((q) => pieceBox(q, pose.mirror.position));
  assert.ok(ends.some((k) => Math.abs(head.lo[0] - k.hi[0]) < 1e-6 || Math.abs(head.hi[0] - k.lo[0]) < 1e-6), "螺絲頭頂著鉸鏈筒的端面");
});

test("第 382 種:改變傾斜角度——上緣往後仰可調 30°;往前傾時鏡框下緣碰到支柱就停(範圍的上限)", () => {
  const def = m382.default;
  const [lo, hi] = m382.RANGE;
  assert.ok(lo <= deg(-29.9), "上緣往後仰到 30°");
  const rod = part(def, "stem").pieces.find((q) => q.role === "rod");
  assert.ok(rod, "支柱");
  // 鏡子下半部、橫過支柱(x = 0)的各塊外框角點:繞鉸鏈轉 t 後離支柱軸線(深度 0)的距離
  const corners = part(def, "mirror")
    .pieces.map((q) => pieceBox(q))
    .filter((b) => b.lo[0] <= 0 && 0 <= b.hi[0] && b.lo[1] < -0.3)
    .flatMap((b) => [b.lo[1], b.hi[1]].flatMap((y) => [b.lo[2], b.hi[2]].map((z) => [y, z])))
    .filter(([y]) => y < -0.3);
  const clearance = (t) => Math.min(...corners.map(([y, z]) => y * Math.sin(t) + z * Math.cos(t))) - rod.radius;
  assert.ok(clearance(hi) >= 0, `傾到上限時下緣還沒碰到支柱(間隙 ${clearance(hi).toFixed(3)})`);
  assert.ok(clearance(hi + deg(5)) < 0, "再往前傾 5° 下緣就碰到支柱");
});

test("第 383 種:布從一個滾筒繞到另一個,中間的圓筒(刷子)處理布面", () => {
  const c = m383.cloth(-1);
  close(c.travel, 0.7, "布走過的長度 = 下滾筒捲上的弧長");
  close(Math.abs(c.top) * 0.7, c.travel, "上滾筒放出同樣長的布");
  close(Math.abs(c.mid) * 1.0, m383.BRUSH * c.travel, "中間圓筒的表面比布快");
});

test("第 383 種:布照原圖 S 形繞過圓筒的左半邊(包角大於 90°),從上滾筒的右側放出、捲到下滾筒的右側,布面貼著三個輪", () => {
  const def = m383.default;
  const { TOP, MID, LOW } = m383.ROLLS;
  const cloth = part(def, "cloth");
  assert.ok(cloth.kind === "belt" && cloth.width != null, "布畫成有寬度的布面(扁帶)");
  const roller = part(def, "topRoller").pieces.find((q) => q.role === "roll");
  close(cloth.width, roller.length, "布寬等於滾筒長");
  const lift = (cloth.thickness ?? 0.08) / 2;
  const pts = def.pose(0).paths.cloth.points;
  const r = (c, p) => Math.hypot(p[0] - c.center[0], p[1] - c.center[1]);
  close(r(TOP, pts[0]), TOP.r + lift, "布從上滾筒的面上放出", 1e-6);
  close(r(LOW, pts.at(-1)), LOW.r + lift, "布捲到下滾筒的面上", 1e-6);
  assert.ok(pts[0][0] > 0 && pts.at(-1)[0] > 0, "上下兩端都在滾筒的右側");
  const ds = pts.map((p) => r(MID, p));
  close(Math.min(...ds), MID.r + lift, "布面貼著圓筒", 1e-6);
  const angles = pts.filter((p, i) => ds[i] < MID.r + lift + 1e-6).map((p) => Math.atan2(p[1] - MID.center[1], p[0] - MID.center[0]));
  const a = angles.map((t) => (t < 0 ? t + TAU : t));
  const wrap = Math.max(...a) - Math.min(...a);
  assert.ok(wrap > Math.PI / 2, `布在圓筒上的包角大於 90°(${((wrap * 180) / Math.PI).toFixed(0)}°)`);
  assert.ok(Math.min(...a) > Math.PI / 2 && Math.max(...a) < (3 * Math.PI) / 2, "包在圓筒的左半邊");
});

test("第 385 種:俄羅斯關門裝置:開門時兩銷靠近、重物被抬起;重物下壓肘節,把兩銷撐開而關門", () => {
  const [closed, open] = m385.RANGE;
  assert.ok(m385.toggle(open).joint[1] > m385.toggle(closed).joint[1], "開門時重物被抬起");
  for (const x of sweep(open, 8, closed)) {
    const t = m385.toggle(x);
    close(Math.hypot(t.joint[0] - t.x, t.joint[1] + 0.4), 2.2, "桿長不變", 1e-9);
  }
});

test("第 385 種:重物以 S 形掛鉤掛在肘節接頭的銷上——銷穿過兩根桿的接頭往前伸出,掛鉤的上彎從上面勾住伸出的那段,全程貼著銷", () => {
  const def = m385.default;
  const pin = part(def, "barR").pieces?.find((q) => q.role === "jointPin");
  const hook = part(def, "weight").pieces?.find((q) => q.role === "hook");
  assert.ok(pin && hook, "接頭有銷、重物頂上有掛鉤");
  for (const x of sweep(m385.RANGE[1], 8, m385.RANGE[0])) {
    const p = def.pose(x).parts;
    close(dist(p.barL.to, p.barR.to), 0, "兩根桿在接頭相接", 1e-9);
    close(pin.at[0], dist(p.barR.from, p.barR.to), "銷在桿端的接頭上", 1e-9);
    const j = p.barR.to;
    const w = p.weight.position;
    const outline = hook.shape.outline.map(([u, v]) => [u + w[0] + hook.at[0], v + w[1] + hook.at[1]]);
    const pinPoly = circlePolygon(j, pin.radius, 48);
    assert.ok(penetrationDepth(pinPoly, outline) < 2e-3, `門上的銷在 ${x.toFixed(2)}:掛鉤沒有穿進銷`);
    const gap = Math.min(...pinPoly.map((q) => (pointInPolygon(q, outline) ? 0 : edgeDistance(q, outline))));
    assert.ok(gap < 3e-3, `門上的銷在 ${x.toFixed(2)}:掛鉤貼著銷(間隙 ${gap.toFixed(4)})`);
    assert.ok(pointInPolygon([j[0], j[1] + pin.radius + 0.005], outline), "掛鉤的上彎在銷的上面(吊著)");
    const pz = [j[2] + pin.at[2] - pin.length / 2, j[2] + pin.at[2] + pin.length / 2];
    const hz = [w[2] + hook.at[2] - hook.thickness / 2, w[2] + hook.at[2] + hook.thickness / 2];
    for (const id of ["barL", "barR"]) {
      const t = part(def, id).thickness;
      const bz = [p[id].to[2] - t / 2, p[id].to[2] + t / 2];
      assert.ok(pz[0] <= bz[0] + 1e-9 && bz[1] <= pz[1] + 1e-9, `銷穿過 ${id} 的接頭`);
      assert.ok(hz[0] >= bz[1] - 1e-9, `掛鉤在 ${id} 的前面`);
    }
    assert.ok(pz[0] <= hz[0] && hz[1] <= pz[1], "掛鉤掛在銷往前伸出的那段上");
  }
});

test("第 385 種:重物懸在接頭下方,全程不碰兩根桿", () => {
  const def = m385.default;
  const weight = part(def, "weight");
  const body = weight.pieces?.find((q) => q.role === "body") ?? weight;
  for (const x of sweep(m385.RANGE[1], 24, m385.RANGE[0])) {
    const p = def.pose(x).parts;
    const o = add(p.weight.position, body === weight ? [0, 0, 0] : body.at);
    // 重物本體(沿 Y 的旋轉體)的正面輪廓
    const right = body.profile.map(([rr, y]) => [o[0] + rr, o[1] + y]);
    const left = body.profile.map(([rr, y]) => [o[0] - rr, o[1] + y]).reverse();
    const silhouette = [...right, ...left];
    for (const id of ["barL", "barR"]) {
      const { from, to } = p[id];
      const u = norm(sub(to, from));
      const n = [-u[1], u[0]];
      const h = part(def, id).width / 2; // 桿寬的一半,也是桿端圓頭的半徑
      const bar = [
        [from[0] - u[0] * h + n[0] * h, from[1] - u[1] * h + n[1] * h],
        [to[0] + u[0] * h + n[0] * h, to[1] + u[1] * h + n[1] * h],
        [to[0] + u[0] * h - n[0] * h, to[1] + u[1] * h - n[1] * h],
        [from[0] - u[0] * h - n[0] * h, from[1] - u[1] * h - n[1] * h],
      ];
      assert.ok(!polygonsOverlap(silhouette, bar), `門上的銷在 ${x.toFixed(2)}:重物本體碰到 ${id}`);
    }
  }
});

test("第 386 種:可摺疊書房梯:推動側件時橫檔斜起,兩側件靠攏,收合成一根柱", () => {
  const open = m386.fold(0);
  const shut = m386.fold(m386.RANGE[1]);
  close(open.gap, 1.1, "展開時兩側件相距一個橫檔長");
  assert.ok(shut.gap < 0.15, "收合時兩側件併攏");
  assert.ok(shut.angle > 1.4, "橫檔幾乎直立");
});

test("第 387 種:潮汐階梯:無論梯子在什麼位置,踏階皆保持水平", () => {
  const def = m387.default;
  const steep = def.pose(m387.RANGE[0]).parts;
  const flat = def.pose(m387.RANGE[1]).parts;
  assert.ok(Math.abs(steep.stringer.angle - flat.stringer.angle) > 0.3, "水位不同,梯子傾角不同");
  for (const p of [steep, flat]) for (let i = 0; i < 8; i++) close(p[`step${i}`].angle, 0, "踏階水平");
});

test("第 388 種:刨木機進料:帶齒的上滾子把木板往前送,平滑的下滾子被木板帶著轉", () => {
  const f = m388.feed(-1);
  close(f.travel, 0.62, "木板前進 = 上滾子轉過的弧長");
  close(f.low * 0.95, f.travel, "下滾子不打滑");
});

test("第 389 種:升降千斤頂:偏心輪帶著棘爪推棘齒桿上升,上方的擋止扣住不讓它退下;爪與齒由接觸算", () => {
  const T = 2 * Math.PI;
  close(m389.perTurn % m389.geometry.PITCH, 0, "每圈推上整數個齒", 1e-9);
  // 原文沒說每圈幾齒;偏心距 0.25(行程 0.5)比兩齒多出一截,爪越得過第二個齒尖、越不過第三個
  close(m389.perTurn, 2 * m389.geometry.PITCH, "偏心輪每轉一圈,棘齒桿升兩齒", 1e-9);
  assert.ok(m389.perTurn > 0, "棘齒桿被推上去");
  for (let k = 0; k < 3; k++) close(m389.rack((k + 1) * T) - m389.rack(k * T), m389.perTurn, `第 ${k + 1} 圈升的高度`, 1e-9);
  // 「上方的棘爪為一個擋止裝置」:下方的爪退下時,棘齒桿不會落到這一圈開始的高度以下
  for (const v of sweep(T, 120)) assert.ok(m389.rack(v) >= m389.rack(0) - 1e-9, `主動量 ${v.toFixed(2)}:擋止扣住`);
  // 推的那一段:偏心輪往上帶時棘齒桿跟著升(前半圈),後半圈不動
  assert.ok(m389.rack(T / 2) > m389.rack(0) + 0.1, "偏心輪往上帶時,棘爪把棘齒桿推上去");
  close(m389.rack(0.9 * T), m389.rack(T), "偏心輪往下退時棘齒桿停在擋止上", 1e-9);
  // 爪與齒不穿入(爪尖頂著直面、或沿斜面滑過)
  for (const v of sweep(T, 180)) {
    const c = m389.contactAt(v);
    for (const pawl of c.pawls) for (const tooth of c.teeth) assert.ok(penetrationDepth(pawl, tooth) < 2e-3, `主動量 ${v.toFixed(2)}:爪壓進齒裡`);
  }
});

test("第 390 種:部件 A 往兩個方向擺時,開口皮帶 C 與交叉皮帶 D 的棘爪輪流帶動飛輪 B,得到連續旋轉;棘爪由接觸算", () => {
  const S = m390.SWING;
  const fs = sweep(8 * S, 800).map((v) => m390.oscillation(v).fly);
  assert.ok(fs.every((f, i) => i === 0 || f >= fs[i - 1] - 1e-9), "飛輪只朝一個方向轉");
  assert.ok(m390.oscillation(2 * S).fly > 0.5 && m390.oscillation(4 * S).fly - m390.oscillation(2 * S).fly > 0.5, "A 往兩個方向擺,飛輪都被推");
  close(m390.perCycle % m390.PITCH, 0, "一個來回推過整數個齒", 1e-9);
  // 每擺一次推五齒半上下(皮帶輪擺過的角度扣掉換向時爪尖落進齒裡的空程),一個來回 11 齒
  close(m390.perCycle, 11 * m390.PITCH, "一個來回推過 11 齒", 1e-9);
  for (const [from, to] of [[0, 2 * S], [2 * S, 4 * S]]) {
    const n = (m390.oscillation(to).fly - m390.oscillation(from).fly) / m390.PITCH;
    assert.ok(n > 5 && n < 6, `擺一次推過 ${n.toFixed(2)} 齒`);
  }
  close(m390.oscillation(4 * S).fly, m390.perCycle, "一個來回轉過的角度", 1e-9);
  const o = m390.oscillation(S);
  close(o.c, -o.d, "開口皮帶與交叉皮帶的皮帶輪反向轉");
  for (const v of sweep(4 * S, 200)) for (const key of ["c", "d"]) assert.ok(m390.pawlGap(v, key) > -3e-3, `主動量 ${v.toFixed(3)}:${key} 的爪尖壓進棘輪`);
});

test("第 391 種:一根齒條上升時、另一根下降時作用於齒輪,得到連續旋轉;齒條的銷在溝槽 b 裡繞圈", () => {
  const S = m391.geometry.STROKE;
  const gs = sweep(4 * S, 200).map((v) => m391.racks(v).gear);
  assert.ok(gs.every((g, i) => i === 0 || g <= gs[i - 1] + 1e-12), "齒輪只朝一個方向轉");
  close(m391.racks(2 * S).gear, (-2 * S) / m391.geometry.GEAR.r, "上、下兩程都推動齒輪");
  // 銷始終在溝的中心線上(齒條的傾角由銷在溝裡的位置決定)
  for (const v of sweep(2 * S, 80)) {
    const r = m391.racks(v);
    for (const s of [-1, 1]) {
      const [x, y] = m391.pinOf(s, v);
      close(x, m391.pinX(s, y, r.up), `主動量 ${v.toFixed(2)}:${s < 0 ? "A" : "A¹"} 的銷在溝裡`, 1e-6);
    }
  }
  // 上升的中段 A 直立咬著齒輪、A¹ 外傾;下降的中段反過來
  const up = m391.racks(S / 2);
  const down = m391.racks(1.5 * S);
  assert.ok(Math.abs(up.angleA) < 1e-6 && Math.abs(up.angleA1) > 0.05, "上升時 A 咬著、A¹ 離開");
  assert.ok(Math.abs(down.angleA1) < 1e-6 && Math.abs(down.angleA) > 0.05, "下降時 A¹ 咬著、A 離開");
  // 肘形槓桿 C:A¹ 的銷到了上角才把它頂起,其餘時間落在擋上
  const rest = m391.toggleAngle(m391.pinOf(1, S / 2));
  assert.ok(m391.toggleAngle(m391.pinOf(1, S)) > rest + 0.1, "銷到上角時頂起肘形槓桿 C");
});

test("第 392 種:跳鋸:下端由曲柄帶動上下,上端的彈簧讓鋸子保持繃緊", () => {
  const lows = sweep(2 * Math.PI, 36).map((t) => m392.gigSaw(t).low);
  close(Math.max(...lows) - Math.min(...lows), 0.9, "行程 = 曲柄直徑", 0.01);
  for (const t of sweep(2 * Math.PI, 8)) {
    const g = m392.gigSaw(t);
    close(g.top - g.low, 2.6, "鋸條長度不變(被彈簧拉直)");
  }
});

test("第 393 種:拋光透鏡:杯子繞共同的軸轉,同時繞自己的軸轉", () => {
  const a = m393.polisher(0).center;
  const b = m393.polisher(Math.PI / 2).center;
  close(Math.hypot(a[0], a[2]), Math.hypot(b[0], b[2]), "杯子繞軸公轉");
  assert.ok(Math.abs(m393.polisher(1).self) > 0, "杯子自轉");
});

test("第 394 種:Parsons 無端齒條:框往復,小齒輪連續朝同一方向轉(把往復運動轉成旋轉)", () => {
  const d = m394.default.driver;
  const stroke = Math.abs(d.cycle[1] - d.cycle[0]); // 一程
  const ps = sweep(8 * stroke, 800).map((v) => m394.parsons(v));
  assert.ok(ps.every((p, i) => i === 0 || p.pinion >= ps[i - 1].pinion - 1e-9), "小齒輪只朝一個方向轉");
  const xs = ps.map((p) => p.frame[0]);
  close(Math.max(...xs) - Math.min(...xs), m394.RANGE[1] - m394.RANGE[0], "框往復", 1e-6);
  const { LEN, C, RP } = m394.geometry;
  close(m394.parsons(2 * stroke).pinion - m394.parsons(0).pinion, (2 * LEN + 2 * Math.PI * C) / RP, "框來回一次,小齒輪沿跑道滾一圈", 1e-6);
  close(m394.parsons(stroke).frame[0], m394.RANGE[1], "一程走完,框從一端到另一端", 1e-9);
  // 往一個方向時咬一排、往回時咬另一排:框跟著上下換位
  assert.ok(m394.parsons(stroke / 2).frame[1] * m394.parsons(1.5 * stroke).frame[1] < 0, "兩個方向咬不同排的齒");
  // 原圖的箭頭:框往左走時咬上排的齒(小齒輪在框中線上方),小齒輪逆時針
  const left = m394.parsons(1.5 * stroke);
  assert.ok(left.frame[0] < m394.parsons(1.5 * stroke - 0.01).frame[0] && -left.frame[1] > 0, "框往左走時咬上排");
});

test("第 394 種:可作為擺動汽缸引擎中曲柄的替代——小齒輪(帶飛輪的輸出)等速轉時,框像曲柄帶的活塞一樣在兩端慢下來換向", () => {
  const d = m394.default.driver;
  const stroke = Math.abs(d.cycle[1] - d.cycle[0]);
  const n = 2000;
  const vs = sweep(2 * stroke, n);
  const ps = vs.map((v) => m394.parsons(v));
  const rates = ps.slice(1).map((p, i) => (p.pinion - ps[i].pinion) / (vs[i + 1] - vs[i]));
  assert.ok(Math.max(...rates) / Math.min(...rates) < 1.02, `主動量等速時小齒輪轉速均勻(最大 / 最小 ${(Math.max(...rates) / Math.min(...rates)).toFixed(2)})`);
  const speed = ps.slice(1).map((p, i) => Math.abs(p.frame[0] - ps[i].frame[0]) / (vs[i + 1] - vs[i]));
  const mid = speed[Math.round(n / 4)];
  close(speed[0] / mid, 0, "框在一端換向時速度接近 0", 0.05);
  close(speed[Math.round(n / 2) - 1] / mid, 0, "框在另一端換向時速度接近 0", 0.05);
});

test("第 394 種:框上的齒與小齒輪全程咬合、不穿入(框的齒是框板內緣的一部分)", async () => {
  const { gearProfile } = await import("../models/shapes.js");
  const frame = part(m394.default, "frame");
  const pinion = part(m394.default, "pinion");
  const front = frame.pieces[0];
  assert.equal(front.kind, "plate");
  const hole = front.shape.holes[0];
  const prof = gearProfile({ teeth: pinion.teeth, radius: pinion.radius });
  const d = m394.default.driver;
  const stroke = Math.abs(d.cycle[1] - d.cycle[0]);
  // 簡化的梯形齒(齒側是直線)在直線段咬合時,框的齒尖擦進小齒輪約 0.008
  let nearest = Infinity;
  for (const v of sweep(2 * stroke, 400)) {
    const pose = m394.default.pose(v).parts;
    const [fx, fy] = pose.frame.position;
    const placed = placeOutline(prof, [-fx, -fy], pose.pinion.angle); // 框的座標
    for (const p of placed) {
      const gap = edgeDistance(p, hole);
      if (!pointInPolygon(p, hole)) assert.ok(gap < 0.01, `主動量 ${v.toFixed(3)}:小齒輪的齒穿進框 ${gap.toFixed(4)}`);
      else nearest = Math.min(nearest, gap);
    }
    for (const q of hole) if (Math.hypot(q[0] + fx, q[1] + fy) < 0.6 && pointInPolygon(q, placed)) assert.ok(edgeDistance(q, placed) < 0.01, `主動量 ${v.toFixed(3)}:框的齒穿進小齒輪`);
  }
  assert.ok(nearest < 0.02, "小齒輪的齒碰得到框的齒");
  assertOnePiece({ pieces: frame.pieces.filter((q) => q.kind === "plate") }, "框板、齒與溝的台階是同一件");
});

test("第 394 種:小齒輪兩個直徑不同的同心凸緣比小齒輪大,各沿框側邊的一道溝走(凸緣貼著溝壁、不穿入)", () => {
  const frame = part(m394.default, "frame");
  const pinion = part(m394.default, "pinion");
  const tip = pinion.radius + (2 * pinion.radius) / pinion.teeth;
  const flanges = pinion.pieces.filter((q) => q.kind === "cylinder" && q.radius > tip);
  assert.equal(flanges.length, 2, "兩個比小齒輪齒尖大的凸緣");
  assert.ok(Math.abs(flanges[0].radius - flanges[1].radius) > 0.1, "兩個凸緣直徑不同");
  const layers = plateLayers(frame);
  const front = layers[0];
  const d = m394.default.driver;
  const stroke = Math.abs(d.cycle[1] - d.cycle[0]);
  for (const f of flanges) {
    const [z0, z1] = [f.at[2] - f.length / 2, f.at[2] + f.length / 2];
    assert.ok(z1 <= front.z0 + 1e-9, "凸緣在齒的後面(原圖上排齒後面的虛線)");
    const groove = layers.filter((l) => l.z0 < z1 - 1e-9 && z0 < l.z1 - 1e-9);
    assert.ok(groove.length > 0, "凸緣那一層有框的溝");
    for (const v of sweep(2 * stroke, 120)) {
      const [fx, fy] = m394.default.pose(v).parts.frame.position;
      const c = [-fx, -fy];
      const disc = circlePolygon(c, f.radius, 96);
      let gap = Infinity;
      for (const l of groove) {
        assert.ok(penetrationDepth(disc, l.solid) < 2e-3, `主動量 ${v.toFixed(2)}:凸緣(半徑 ${f.radius})穿進溝壁`);
        gap = Math.min(gap, ...l.solid.holes.map((h) => Math.min(...disc.map((p) => edgeDistance(p, h)))));
      }
      assert.ok(gap < 0.012, `主動量 ${v.toFixed(2)}:凸緣貼著溝壁(間隙 ${gap.toFixed(4)})`);
      // 凸緣伸進齒條側邊:凸緣最外的那一點在齒根之外,躲在框板後面
      const far = [c[0], c[1] + Math.sign(c[1] || 1) * f.radius];
      if (Math.abs(c[1]) > 0.99 * m394.geometry.C) assert.ok(inSolid(far, front.solid), `主動量 ${v.toFixed(2)}:凸緣伸到齒根外的框板後面`);
    }
  }
});

test("第 395 種:四通旋塞:閥塞轉 1/4 圈,進汽與排汽的端互換", () => {
  close(m395.plugAngle(0.2), 0, "位置 0");
  close(m395.plugAngle(0.7), Math.PI / 2, "轉 1/4 圈到位置 1");
  assert.equal(m395.position(m395.plugAngle(0.2)), 0);
  assert.equal(m395.position(m395.plugAngle(0.7)), 1);
  assert.equal(m395.position(Math.PI / 4), null, "轉到一半時通道關閉");
  const flows0 = m395.default.pose(0.2).flows;
  const flows1 = m395.default.pose(0.7).flows;
  assert.ok(flows0.length === 2 && flows1.length === 2, "兩個位置都有進汽與排汽");
  assert.equal(m395.default.pose(0.45).flows.length, 0, "轉換時不流動");
});

test("第 395 種:假設蒸汽從頂端進入,上方的圖中廢汽從汽缸的右端排出,下方的圖中從左端排出(蒸汽從相反的一端進入)", () => {
  const { R, CYLINDER } = m395.geometry;
  const atEnd = (p, side) => Math.abs(p[1] - CYLINDER.y) < CYLINDER.radius && Math.sign(p[0]) === side && Math.abs(p[0]) > CYLINDER.half - 0.6;
  for (const [pos, exhaustEnd] of [[0, 1], [1, -1]]) {
    const routes = m395.routes(pos);
    const steam = routes.find((r) => r[0][1] > R);
    const exhaust = routes.find((r) => r[r.length - 1][1] < -R && Math.abs(r[r.length - 1][0]) < 1e-9); // 從下方的管口出去
    assert.ok(steam && exhaust, `位置 ${pos}:一道從上方進汽、一道從下方排汽`);
    assert.ok(atEnd(exhaust[0], exhaustEnd), `位置 ${pos}:廢汽從汽缸的${exhaustEnd > 0 ? "右" : "左"}端出來`);
    assert.ok(atEnd(steam[steam.length - 1], -exhaustEnd), `位置 ${pos}:蒸汽進到汽缸的另一端`);
  }
  // 蒸汽進入的那一端推活塞:位置 0 的時候蒸汽進左端,活塞往右走;位置 1 往左走
  const piston = (p) => m395.default.pose(p).parts.piston.position[0];
  assert.ok(piston(0.35) > piston(0.05), "位置 0:蒸汽進左端,活塞往右");
  assert.ok(piston(0.85) < piston(0.55), "位置 1:蒸汽進右端,活塞往左");
  close(piston(0.42), piston(0.48), "旋塞轉換時活塞停在一端", 1e-9);
});

test("第 395 種:閥塞的兩道通道各從一個口彎到相鄰的口;通道壁畫在閥塞盤面上,流動沿著通道走", () => {
  const { R, PLUG_R, HALF_W } = m395.geometry;
  const plug = part(m395.default, "plug");
  const layers = plateLayers(plug);
  const disc = layers[0];
  // 通道壁坐在盤面上、在盤之內
  for (const l of layers.slice(1)) {
    assert.ok(l.solid.outline.every(([x, y]) => Math.hypot(x, y) <= PLUG_R + 1e-9), "通道壁在閥塞盤之內");
  }
  assertOnePiece(plug, "閥塞盤、通道壁與中央的方塊是同一件");
  for (const pos of [0, 1]) {
    const a = pos * Math.PI / 2;
    for (const route of m395.routes(pos)) {
      const inside = route.filter(([x, y]) => Math.hypot(x, y) < R - 0.05);
      assert.ok(inside.length > 4, "流動經過閥塞");
      // 閥塞局部座標下,通道的中心弧以閥殼外的角為圓心、半徑 R(從一個口彎到相鄰的口)
      const local = inside.map((p) => rot2(p, -a));
      const corner = local[Math.floor(local.length / 2)][0] < 0 ? [-R, R] : [R, -R];
      for (const p of local) close(Math.hypot(p[0] - corner[0], p[1] - corner[1]), R, `位置 ${pos}:流動沿通道的中心弧`, 0.02);
      // 流動在通道的兩道壁之間(壁的內緣到中心弧各 HALF_W)
      for (const p of local) {
        const onWall = layers.slice(1).some((l) => inSolid([p[0], p[1]], l.solid));
        assert.ok(!onWall, `位置 ${pos}:流動穿過通道壁`);
      }
      // 通道的兩端對準口:進出閥塞的點在口的中心(上、下、左、右)
      const ends = [route.find(([x, y]) => Math.hypot(x, y) <= R + 1e-9), [...route].reverse().find(([x, y]) => Math.hypot(x, y) <= R + 1e-9)];
      for (const e of ends) {
        const ang = Math.atan2(e[1], e[0]) / (Math.PI / 2);
        close(ang, Math.round(ang), `位置 ${pos}:通道的一端對準口`, 0.02);
      }
    }
  }
  assert.ok(HALF_W > 0 && disc.z1 <= Math.min(...layers.slice(1).map((l) => l.z0)) + 1e-9, "通道壁在盤面前面");
});

test("第 396 種:Reed 擒縱:圓盤銷撥槓桿換邊;擺輪一個來回,叉瓦放走擒縱輪一齒(由接觸算)", () => {
  const S = m396.SWING;
  // 圓盤銷只在擺過中間時撥動槓桿,其餘時間槓桿靠在擋銷上
  assert.ok(m396.reed(0).lever * m396.reed(2 * S).lever < 0, "擺過去,槓桿換邊");
  close(m396.reed(S / 2).lever, m396.reed(0).lever, "擺輪擺出叉口後,槓桿不動", 1e-12);
  const P = 4 * S; // 擺輪一個來回
  close(m396.reed(P).wheel - m396.reed(0).wheel, -m396.PITCH, "鎖定與解鎖,一個來回放走一齒(順時針)", 1e-9);
  close(m396.reed(3 * P).wheel - m396.reed(0).wheel, -3 * m396.PITCH, "三個來回放走三齒", 1e-9);
  // 槓桿靠在擋銷上時,擒縱輪被叉瓦鎖住不動
  const locked = sweep(S / 2, 30).map((v) => m396.reed(2 * S + v).wheel); // 擺輪從 +140° 擺回 +70°
  assert.ok(Math.max(...locked) - Math.min(...locked) < 1e-6, "擺輪在外側擺動時,輪鎖住");
  for (const v of sweep(P, 120)) {
    const c = m396.contactAt(v);
    for (const p of c.pallets) for (const t of c.teeth) assert.ok(penetrationDepth(p, t) < 2e-3, `主動量 ${v.toFixed(3)}:叉瓦壓進輪齒`);
  }
});

test("第 397 種:連續圓周運動 → 間歇的直線往復運動;擺桿的角度由曲柄銷在槽裡的位置決定", () => {
  const T = 2 * Math.PI;
  const n = 720;
  const angles = sweep(T, n).map((t) => m397.lever(t).angle);
  // 間歇:有一段擺桿停住(銷走過和曲柄圓同心的那段槽),其餘時候擺出去再擺回來
  const still = angles.slice(1).map((a, i) => Math.abs(a - angles[i]) < 1e-9);
  const dwell = still.filter(Boolean).length / n;
  assert.ok(dwell > 0.2 && dwell < 0.6, `每圈有一段停住(停 ${(dwell * 360).toFixed(0)}°)`);
  let runs = 0;
  for (let i = 0; i < still.length; i++) if (still[i] && !still[(i - 1 + still.length) % still.length]) runs++;
  assert.equal(runs, 1, "每圈停一次、擺一個來回");
  const xs = angles.map((a) => m397.slide(a).x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 1, "滑桿往復");
  const { PIVOT } = m397.geometry;
  const pinLocal = (t) => {
    const { angle } = m397.lever(t);
    const [px, py] = m397.pinAt(t);
    return rot2([px - PIVOT[0], py - PIVOT[1]], -angle);
  };
  // 銷始終在槽的中心線上(擺桿局部座標);停住的時候銷沿槽走
  const slot = m397.SLOT;
  const onSlot = (q) => Math.min(...slot.slice(1).map((b, i) => {
    const a = slot[i];
    const ab = [b[0] - a[0], b[1] - a[1]];
    const u = Math.max(0, Math.min(1, ((q[0] - a[0]) * ab[0] + (q[1] - a[1]) * ab[1]) / (ab[0] ** 2 + ab[1] ** 2)));
    return Math.hypot(q[0] - a[0] - u * ab[0], q[1] - a[1] - u * ab[1]);
  }));
  for (const t of sweep(T, 144)) assert.ok(onSlot(pinLocal(t)) < 1e-4, `曲柄 ${t.toFixed(2)}:銷在槽上`); // SLOT 是折線,弦離圓弧約 1e-5
  // 銷全程在槽孔裡,不穿進擺桿的任何一塊(槽的兩端也容得下銷)
  const plates = part(m397.default, "lever").pieces.filter((q) => q.kind === "plate").map((q) => q.shape);
  for (const t of sweep(T, 720)) {
    const disc = circlePolygon(pinLocal(t), m397.PIN_R, 24);
    for (const sh of plates) assert.ok(penetrationDepth(disc, sh) < 1e-6, `曲柄 ${t.toFixed(3)}:銷穿進擺桿`);
  }
  const dwellAt = sweep(T, n).filter((_, i) => i < n && still[i]);
  const moved = Math.hypot(...[0, 1].map((k) => pinLocal(dwellAt[0])[k] - pinLocal(dwellAt[dwellAt.length - 1])[k]));
  assert.ok(moved > 1, "停住時銷沿槽走");
  // 連桿長度不變
  for (const t of sweep(T, 36)) {
    const r = m397.default.pose(t).parts.rod;
    close(Math.hypot(r.to[0] - r.from[0], r.to[1] - r.from[1]), m397.geometry.ROD, "連桿長度不變", 1e-9);
  }
});

test("第 397 種:照原圖的比例:曲柄半徑約擺桿長的 0.3,曲柄軸在擺桿中心線的右邊", () => {
  const { PIVOT, CRANK, ARM } = m397.geometry;
  close(CRANK.r / ARM, 0.31, "曲柄半徑 ÷ 擺桿長(原圖 94 ÷ 305)", 0.03);
  assert.ok(CRANK.center[0] - PIVOT[0] > 0.12 * ARM, "曲柄軸在擺桿停住時的中心線右邊(原圖右邊 55 px,擺桿長 305 px)");
  // 停住時槽和曲柄銷的圓同心:槽的中段離曲柄軸都是曲柄半徑
  const mid = m397.SLOT.filter(([x, y]) => Math.hypot(x - (CRANK.center[0] - PIVOT[0]), y - (CRANK.center[1] - PIVOT[1])) < CRANK.r + 1e-6 && Math.hypot(x - (CRANK.center[0] - PIVOT[0]), y - (CRANK.center[1] - PIVOT[1])) > CRANK.r - 1e-6);
  assert.ok(mid.length > 10, "槽的一段是曲柄銷的圓");
});

test("第 397 種:機架是一件:滑桿的導軌與曲柄的軸承柱都站在底座上;滑桿全程在導套裡", () => {
  const frame = part(m397.default, "frame");
  assertOnePiece(frame, "機架");
  const base = frame.pieces[0];
  const floor = base.at[1] - base.size[1] / 2;
  assert.ok(frame.pieces.every((q) => pieceBox(q).lo[1] >= floor - 1e-9), "底座是最低的一塊(落地)");
  const bar = part(m397.default, "bar");
  const body = bar.pieces[0];
  const guides = frame.pieces.filter((q) => q.role === "guide");
  assert.ok(guides.length >= 2, "滑桿有導套");
  for (const t of sweep(2 * Math.PI, 72)) {
    const [bx, by] = m397.default.pose(t).parts.bar.position;
    const b = pieceBox(body, [bx, by, 0]);
    for (const g of guides) {
      const gb = pieceBox(g);
      assert.ok(b.lo[0] <= gb.lo[0] && gb.hi[0] <= b.hi[0], `曲柄 ${t.toFixed(2)}:滑桿穿過導套`);
    }
    const ys = guides.map((g) => pieceBox(g));
    const above = Math.min(...ys.filter((g) => g.lo[1] >= b.hi[1] - 1e-9).map((g) => g.lo[1] - b.hi[1]));
    const below = Math.min(...ys.filter((g) => g.hi[1] <= b.lo[1] + 1e-9).map((g) => b.lo[1] - g.hi[1]));
    assert.ok(above < 0.01 && below < 0.01, `曲柄 ${t.toFixed(2)}:導套上下夾著滑桿`);
  }
});

// 第 398 種:槽凸輪 C → 導架裡的滑塊 → 連桿 → 大輪軸上的曲柄(2026-10-14 決定 (a))
const at398 = (def, t) => {
  const p = def.pose(t).parts;
  const slider = part(def, "slider");
  const wheel = part(def, "wheel");
  const pin = (role) => slider.pieces.find((q) => q.role === role);
  const crankPin = wheel.pieces.find((q) => q.role === "crankPin");
  const [cx, cy] = rot2(crankPin.at, p.wheel.angle);
  return {
    p,
    groovePin: [p.slider.position[0] + pin("groovePin").at[0], p.slider.position[1] + pin("groovePin").at[1]],
    eye: [p.slider.position[0] + pin("eyePin").at[0], p.slider.position[1] + pin("eyePin").at[1]],
    crank: [wheel.center[0] + cx, wheel.center[1] + cy],
  };
};

test("第 398 種:凸輪 C 為驅動端;盤面的溝槽帶著滑塊的銷,銷全程在溝裡、兩側都貼著溝壁、不穿入", () => {
  const def = m398.default;
  assert.equal(def.driver.part, "cam", "凸輪 C 為驅動端");
  assert.equal(part(def, "cam").label, "C");
  const cam = part(def, "cam");
  const layers = plateLayers(cam);
  const pin = part(def, "slider").pieces.find((q) => q.role === "groovePin");
  const floor = Math.max(...layers.filter((l) => l.solid.holes.length === 0 && l.z0 < 0).map((l) => l.z1)); // 盤底(溝底)
  for (const t of sweep(-TAU, 360)) {
    const { p, groovePin } = at398(def, t);
    const tip = p.slider.position[2] + pin.at[2] - pin.length / 2;
    assert.ok(tip > floor + 0.005, `主動量 ${t.toFixed(2)}:銷頭沒有頂到溝底`);
    const z = tip + 0.005;
    const solids = layers.filter((l) => l.z0 <= z && z <= l.z1).map((l) => l.solid);
    assert.ok(solids.length, `主動量 ${t.toFixed(2)}:銷伸進盤面有溝的那一層`);
    const c = rot2([groovePin[0] - cam.center[0], groovePin[1] - cam.center[1]], -p.cam.angle);
    const g = guidedBetween(c, pin.radius, solids);
    assert.ok(g.open && g.depth < 0.005, `主動量 ${t.toFixed(2)}:銷在溝裡、不穿進溝壁(穿入 ${g.depth.toFixed(3)})`);
    assert.ok(g.sides, `主動量 ${t.toFixed(2)}:溝的兩側都貼著銷`);
  }
});

test("第 398 種:滑塊夾在上下兩條導軌之間,只沿導軌左右滑", () => {
  const def = m398.default;
  const blocks = part(def, "slider").pieces.filter((q) => q.role === "block");
  const rails = part(def, "frame").pieces.filter((q) => q.role === "rail");
  assert.equal(blocks.length, 2, "滑塊兩端各一塊");
  assert.equal(rails.length, 2, "上下兩條導軌");
  const box = (q, [ox, oy, oz] = [0, 0, 0]) => ({ lo: q.at.map((v, k) => v + [ox, oy, oz][k] - q.size[k] / 2), hi: q.at.map((v, k) => v + [ox, oy, oz][k] + q.size[k] / 2) });
  const [top, bottom] = [...rails].sort((a, b) => b.at[1] - a.at[1]).map((q) => box(q));
  const xs = [];
  for (const t of sweep(-TAU, 240)) {
    const pos = def.pose(t).parts.slider.position;
    close(pos[1], 0, "滑塊不上下動", 1e-12);
    close(pos[2], 0, "滑塊不前後動", 1e-12);
    xs.push(pos[0]);
    for (const b of blocks.map((q) => box(q, pos))) {
      close(top.lo[1] - b.hi[1], 0, `主動量 ${t.toFixed(2)}:滑塊頂貼著上導軌`, 1e-9);
      close(b.lo[1] - bottom.hi[1], 0, `主動量 ${t.toFixed(2)}:滑塊底貼著下導軌`, 1e-9);
      assert.ok(b.lo[0] >= top.lo[0] - 1e-9 && b.hi[0] <= top.hi[0] + 1e-9, `主動量 ${t.toFixed(2)}:滑塊在導軌的長度之內`);
      assert.ok(b.lo[2] < top.hi[2] && top.lo[2] < b.hi[2], "滑塊與導軌在同一個深度");
    }
  }
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.3, "滑塊左右往復一段看得出的行程");
});

test("第 398 種:連桿長不變,兩端接在滑塊的銷與大輪軸上的曲柄銷", () => {
  const def = m398.default;
  const lengths = sweep(-TAU, 360).map((t) => {
    const { p, eye, crank } = at398(def, t);
    close(dist([...p.link.from.slice(0, 2), 0], [...eye, 0]), 0, `主動量 ${t.toFixed(2)}:連桿左端在滑塊的銷上`, 1e-9);
    close(dist([...p.link.to.slice(0, 2), 0], [...crank, 0]), 0, `主動量 ${t.toFixed(2)}:連桿右端在曲柄銷上`, 1e-9);
    return dist(eye.concat(0), crank.concat(0));
  });
  for (const l of lengths) close(l, lengths[0], "連桿長不變", 1e-9);
  const wheel = part(def, "wheel");
  const crankPin = wheel.pieces.find((q) => q.role === "crankPin");
  const eyePin = part(def, "slider").pieces.find((q) => q.role === "eyePin");
  const z = def.pose(0).parts.link.from[2];
  for (const q of [crankPin, eyePin]) assert.ok(q.at[2] - q.length / 2 < z && z < q.at[2] + q.length / 2, "銷穿過連桿的那一層");
});

test("第 398 種:將連續圓周運動轉換為間歇性圓周運動——凸輪等速轉一圈,大輪朝同一方向轉三圈、停六次", () => {
  const def = m398.default;
  assert.equal(def.target, "wheel", "目標件是右邊的大輪");
  const n = 3600;
  const ws = sweep(-TAU, n).map((t) => def.pose(t).parts.wheel.angle);
  const d = ws.slice(1).map((w, i) => w - ws[i]);
  assert.ok(d.every((x) => x <= 1e-12), "大輪只朝一個方向轉(順時針)");
  close(ws[n] - ws[0], -3 * TAU, "凸輪轉一圈(三瓣溝槽),大輪轉三圈", 1e-6);
  const still = d.map((x) => Math.abs(x) < 1e-12);
  const stops = still.filter((s, i) => s && !still[(i + n - 1) % n]).length;
  assert.equal(stops, 6, "一圈停六次(大輪每轉半圈停一下)");
  assert.ok(still.filter(Boolean).length > 0.12 * n, "停住的時間看得出來");
});

test("第 398 種:大輪停住時曲柄不在死點(滑塊再動時只能往同一方向帶),經過死點時大輪還在轉(飛輪帶過死點)", () => {
  const def = m398.default;
  const n = 3600;
  const ts = sweep(-TAU, n);
  const ws = ts.map((t) => def.pose(t).parts.wheel.angle);
  for (let i = 1; i <= n; i++) {
    const moving = Math.abs(ws[i] - ws[i - 1]) > 1e-12;
    const { eye, crank } = at398(def, ts[i]);
    const c = part(def, "wheel").center;
    const arm = [crank[0] - c[0], crank[1] - c[1]];
    const rod = [crank[0] - eye[0], crank[1] - eye[1]];
    const sin = Math.abs(arm[0] * rod[1] - arm[1] * rod[0]) / (Math.hypot(...arm) * Math.hypot(...rod));
    if (!moving) assert.ok(sin > Math.sin(deg(10)), `主動量 ${ts[i].toFixed(3)}:停住時曲柄離死點 10° 以上(sin ${sin.toFixed(3)})`);
    if (sin < 0.01) assert.ok(moving, `主動量 ${ts[i].toFixed(3)}:曲柄在死點時大輪仍在轉`);
  }
});

test("第 398 種:機架、凸輪各是一件;凸輪軸與大輪軸穿過機架的軸承座", () => {
  const def = m398.default;
  const frame = part(def, "frame");
  assertOnePiece(frame, "機架(底座、兩個軸承座、導架)連成一件");
  const cam = part(def, "cam");
  assertOnePiece(cam, "凸輪(盤、溝的外圈與內島、軸)是一件");
  for (const id of ["cam", "wheel"]) {
    const p = part(def, id);
    const shaft = p.pieces.find((q) => q.role === "shaft");
    assertShaftInBearings({ ...shaft, at: add(p.center, shaft.at) }, frame.pieces, `${id} 的軸`);
  }
});

test("第 399 種:修理鏈條:每一半的螺絲旋進另一半的螺帽,轉動螺帽把兩半拉近", () => {
  close(m399.tighten(2 * Math.PI), m399.PITCH, "兩個螺帽各轉一圈,兩半共拉近一個螺距");
  const def = m399.default;
  const a = def.pose(0).parts;
  const b = def.pose(2 * Math.PI).parts;
  assert.ok(b.upper.position[1] < a.upper.position[1] && b.lower.position[1] > a.lower.position[1], "兩半互相靠近");
  close(a.upper.position[1] - b.upper.position[1] + b.lower.position[1] - a.lower.position[1], m399.PITCH, "合計拉近一個螺距", 1e-9);
  close(b.nutU.angle, 2 * Math.PI, "螺帽轉一圈");
});

test("第 400 種:四向進料:桿 B 由凸輪 C 的徑向凸起抬起,兩根桿被一起往前帶,彈簧產生回程,B 憑自重落下", () => {
  const T = 2 * Math.PI;
  const q = (f) => m400.fourMotion(f * T);
  assert.ok(q(0.25).lift > 0.2 && q(0.25).feed === 0, "先抬起(凸輪的徑向凸起把 B 抬起)");
  assert.ok(q(0.5).feed > 0.19 && q(0.5).lift > 0.2, "再往前(兩根桿被一起往前帶)");
  assert.ok(Math.abs(q(0.75).lift) < 0.01 && q(0.75).feed > 0.19, "再落下(B 憑自重落下)");
  close(q(1).feed, 0, "最後被彈簧拉回");
  // 落下是加速的:每一小段落下的量越來越大,到底撞停
  const drops = [0.55, 0.6, 0.65, 0.7, 0.75].map((f, i, a) => (i ? q(a[i - 1]).lift - q(f).lift : 0)).slice(1);
  assert.ok(drops.every((d, i) => i === 0 || d > drops[i - 1]), "越落越快");
  for (const t of sweep(T, 48)) {
    const pose = m400.default.pose(t).parts;
    // 桿 A 只被帶著前後走,不升降;B 以樞軸接在 A 的叉口裡,和 A 一起往前、往回(樞軸在 A 上的位置不變)
    assert.equal(pose.barA.position[1], 0, `凸輪轉 ${t.toFixed(2)}:A 不被抬起`);
    close(pose.pinB.position[0] - pose.barA.position[0], m400.default.pose(0).parts.pinB.position[0], "B 的樞軸跟著 A 前後走", 1e-12);
    // B 靠自重坐在凸輪上:不穿入,也沒有懸空
    const { b, cam } = m400.contactAt(t);
    assert.ok(penetrationDepth(b, cam) < 5e-3, `凸輪轉 ${t.toFixed(2)}:凸輪沒有穿入 B`);
    assert.ok(polygonsOverlap(m400.contactAt(t, -0.004).b, cam), `凸輪轉 ${t.toFixed(2)}:B 坐在凸輪上`);
  }
});

test("第 401 種:Brownell 曲柄:腕銷越過死點前,滑塊 A 沿槽往前移;越過後彈簧 B 把它推回擋止", () => {
  const deg = Math.PI / 180;
  close(m401.wrist(Math.PI).s, 0, "腕銷在底部:滑塊在擋止處");
  assert.ok(m401.wrist(-10 * deg).s > 0.25, "接近死點時滑塊往前移");
  close(m401.wrist(30 * deg).s, 0, "越過後彈回擋止處", 1e-9);
  // 沿槽(切線)移:腕銷離軸心的距離 ≥ 槽的半徑
  const w = m401.wrist(-10 * deg);
  assert.ok(Math.abs(w.local[1] - 0.6) < 1e-9 && w.local[0] < 0, "滑塊沿橫的槽往轉動的方向移");
  // 彈回是加速的:越回越快
  const back = [5, 10, 15, 20, 25].map((a) => m401.wrist(a * deg).s);
  const steps = back.slice(1).map((s, i) => back[i] - s);
  assert.ok(steps.every((d, i) => i === 0 || d > steps[i - 1]), "彈簧把滑塊越推越快");
});

test("第 402 種:Guernsey 擒縱:兩個擺輪由同一槓桿帶動,朝相反方向擺動;叉瓦放走擒縱輪的齒由接觸算", () => {
  const g = m402.guernsey(0);
  assert.ok(g.bal1 * g.bal2 < 0, "兩個擺輪反向");
  close(Math.abs(g.bal1), Math.abs(g.bal2), "擺幅相同");
  const P = 4 * m402.SWING; // 槓桿一個來回
  close(m402.guernsey(P).wheel - m402.guernsey(0).wheel, -m402.PITCH, "一個來回放走一齒(順時針)", 1e-9);
  close(m402.guernsey(3 * P).wheel - m402.guernsey(0).wheel, -3 * m402.PITCH, "三個來回放走三齒", 1e-9);
  // 每擺一次都有放走一部分(兩個叉瓦輪流放行)
  const w = [0, 1, 2].map((k) => m402.guernsey(k * 2 * m402.SWING).wheel);
  assert.ok(w[1] < w[0] - 0.2 * m402.PITCH && w[2] < w[1] - 0.2 * m402.PITCH, "每擺一次,輪都往前轉一部分");
  // 叉瓦與輪齒不穿入
  for (const v of sweep(P, 120)) {
    const c = m402.contactAt(v);
    for (const p of c.pallets) for (const t of c.teeth) assert.ok(penetrationDepth(p, t) < 2e-3, `主動量 ${v.toFixed(3)}:叉瓦壓進輪齒`);
  }
});
