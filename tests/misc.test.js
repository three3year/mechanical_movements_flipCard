// 第十六章「雜項裝置」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, turned, inSolid, pieceBox, plateLayers, guidedBetween, assertOnePiece, assertThrottle, assertShaftInBearings } from "./helpers.js";
import { deg, quatMul, quatRotate, partPoint, rotateAbout, add, sub, scale, cross, dot, dist, len, norm, lerp3, rot2, X, Y, Z, TAU } from "../models/kit.js";
import { rackShape } from "../models/shapes.js";

import * as m350 from "../models/fig350.js";
import * as m351 from "../models/fig351.js";
import * as m352 from "../models/fig352.js";
import * as m353 from "../models/fig353.js";
import * as m354 from "../models/fig354.js";
import * as m355 from "../models/fig355.js";
import * as m356 from "../models/fig356.js";
import * as m357 from "../models/fig357.js";
import * as m363 from "../models/fig363.js";
import * as m365 from "../models/fig365.js";
import * as m358 from "../models/fig358.js";
import * as m359 from "../models/fig359.js";
import * as m360 from "../models/fig360.js";
import * as m361 from "../models/fig361.js";
import * as m362 from "../models/fig362.js";
import * as m364 from "../models/fig364.js";
import * as m366 from "../models/fig366.js";
import * as m367 from "../models/fig367.js";
import * as m368 from "../models/fig368.js";
import * as m369 from "../models/fig369.js";
import * as m370 from "../models/fig370.js";
import * as m384 from "../models/fig384.js";
import { lineAngle } from "../models/ruler-lines.js";
import * as m371 from "../models/fig371.js";
import * as m372 from "../models/fig372.js";
import * as m373 from "../models/fig373.js";
import * as m374 from "../models/fig374.js";
import * as m375 from "../models/fig375.js";
import * as m376 from "../models/fig376.js";
import * as m377 from "../models/fig377.js";
import * as m378 from "../models/fig378.js";
import fig379 from "../models/fig379.js";
import fig380 from "../models/fig380.js";
import * as m381 from "../models/fig381.js";
import * as m382 from "../models/fig382.js";
import * as m383 from "../models/fig383.js";
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
  close(w1 - w2, r1 - r2, "繩心半徑的差就是兩段半徑的差");
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

test("第 352 種:鼓軸穿過兩根架腳、兩端伸出腳外;導輪掛在架腳中段(原圖約在架頂到鼓之間三成處)", () => {
  const def = m352.default;
  const drum = part(def, "drum");
  const axle = drum.pieces.reduce((a, q) => (q.kind === "cylinder" && q.radius < (a?.radius ?? 1) ? q : a), null);
  const [x0, x1] = [drum.center[0] + (axle.at?.[2] ?? 0) - axle.length / 2, drum.center[0] + (axle.at?.[2] ?? 0) + axle.length / 2];
  const frame = part(def, "frame");
  const legs = frame.pieces.filter((q) => q.kind === "box" && q.angle);
  assert.equal(legs.length, 2, "A 形架的兩根腳");
  const inBox = (q, p) => {
    const d = p.map((v, k) => v - q.at[k]);
    const [u, w] = rot2([d[0], d[1]], -q.angle);
    return Math.abs(u) <= q.size[0] / 2 && Math.abs(w) <= q.size[1] / 2 && Math.abs(d[2]) <= q.size[2] / 2;
  };
  for (const leg of legs) {
    const xs = sweep(4, 1600, -4).filter((x) => inBox(leg, [x, drum.center[1], drum.center[2]]));
    assert.ok(xs.length, "鼓軸的軸線穿過架腳");
    const [l0, l1] = [Math.min(...xs), Math.max(...xs)];
    assert.ok(x0 < l0 - 0.02 && x1 > l1 + 0.02, `鼓軸(${x0.toFixed(2)}..${x1.toFixed(2)})整根穿過架腳(${l0.toFixed(2)}..${l1.toFixed(2)})、兩端伸出`);
  }
  const top = Math.max(...frame.pieces.filter((q) => q.kind === "box" && !q.angle).map((q) => pieceBox(q).hi[1]));
  for (const id of ["guideL", "guideR"]) {
    const f = (top - part(def, id).center[1]) / (top - drum.center[1]);
    assert.ok(f > 0.2 && f < 0.45, `${id} 掛在架腳中段(離架頂 ${(f * 100).toFixed(0)}%)`);
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
  const ring = frame.pieces.find((q) => q.kind === "cylinder" && q.inner);
  const column = frame.pieces.find((q) => q.kind === "box" && Math.abs(q.at[0] - ring.at[0]) < 1e-9 && q.at[1] < ring.at[1]);
  assertOnePiece({ pieces: [column, ring] }, "軸承環坐在支柱頂上");
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
  const speeds = sweep(m357.RANGE[1], 40);
  const tilts = speeds.map((s) => m357.governor(s).psi);
  for (let i = 1; i < tilts.length; i++) assert.ok(tilts[i] < tilts[i - 1], `轉速 ${speeds[i]}:越快越接近垂直`);
  assert.ok(tilts[0] > deg(15), "靜止時明顯傾斜");
  assert.ok(tilts[tilts.length - 1] > 0 && tilts[tilts.length - 1] < deg(3), "最快時接近垂直、沒有越過");
  // 畫面上的輪軸:轉速升高的半輪裡,輪軸(B)與水平的夾角一路減小、始終是外端朝下
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
  const { D_I } = m357.geometry;
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
  close(spinB1 / spinH, m357.G.teeth / m357.I.teeth, "H 轉一圈,I 沿 G 滾、自轉 G 與 I 的齒數比那麼多圈", 1e-3);
  assert.ok(Math.abs(spinB - spinB1) < 1, "萬向接頭:A 和 B¹ 轉的圈數一樣(只有一圈之內的快慢起伏)");
  assert.ok(spinB / spinH > 7, "輪 A 轉得比 H 快得多");
  // 滾而不滑:I 和 G 接觸處(I 節圓的最低點),H 帶著它繞立軸走的速度,被 I 自轉的速度抵掉
  for (const p of sweep(P357, 24)) {
    const [a, b] = [def357.pose(p), def357.pose(p + h)];
    const axis = axis357(a, "shaftB1");
    const center = at357(a, "shaftB1", [0, 0, -D_I]);
    const down = norm(sub([0, -1, 0], scale(axis, -axis[1])));
    const contact = add(center, scale(down, m357.I.radius));
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
  const { D_I } = m357.geometry;
  const G = m357.G;
  const pitchY = G.top + G.depth / 2;
  for (const p of sweep(P357, 48)) {
    const pose = def357.pose(p);
    const axis = axis357(pose, "shaftB1");
    const center = at357(pose, "shaftB1", [0, 0, -D_I]);
    const lowest = center[1] - m357.I.radius * Math.hypot(axis[0], axis[2]);
    assert.ok(Math.abs(lowest - pitchY) < 0.025, `進程 ${p.toFixed(2)}:I 的節圓貼著 G 的節面(差 ${(lowest - pitchY).toFixed(3)})`);
    const r = Math.hypot(center[0], center[2]);
    assert.ok(r - m357.I.width / 2 > G.inner && r + m357.I.width / 2 < G.outer + 0.02, "I 的齒寬落在 G 的齒圈上");
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

// 方塊的世界外框
const boxRange = (q, o = [0, 0, 0]) => [0, 1, 2].map((k) => [o[k] + q.at[k] - q.size[k] / 2, o[k] + q.at[k] + q.size[k] / 2]);

test("第 363 種:板穿過立柱的榫眼,樞銷穿過立柱與板(原圖:立柱高出板、頂端圓弧,板上的虛線是穿過立柱的那段)", () => {
  const def = m363.default;
  const stand = def.parts.find((p) => p.id === "stand");
  const board = def.parts.find((p) => p.id === "board");
  const [px, py] = board.center;
  const plank = boxRange(board.pieces.find((q) => q.kind === "box" && q.size[0] > 2), board.center);
  const pin = stand.pieces.find((q) => q.kind === "cylinder" && !q.axis && dist(q.at, board.center) < 1e-9);
  assert.ok(pin, "樞銷在板的支點上、沿前後方向");
  const [z0, z1] = [pin.at[2] - pin.length / 2, pin.at[2] + pin.length / 2];
  assert.ok(plank[1][0] < py && py < plank[1][1] && z0 < plank[2][0] && plank[2][1] < z1, "樞銷從板的中間穿過、伸出板的前後兩側");
  // 板的前後各有立柱的一片(榫眼的兩頰),樞銷穿進兩片
  const cheeks = stand.pieces.filter((q) => q.kind === "box").map((q) => boxRange(q)).filter(([x, y]) => x[0] < px && px < x[1] && y[0] < py && py < y[1]);
  assert.ok(cheeks.some(([, , z]) => z[1] <= plank[2][0] + 1e-9 && z[1] > z0) && cheeks.some(([, , z]) => z[0] >= plank[2][1] - 1e-9 && z[0] < z1), "板前、板後都有立柱,樞銷穿進兩邊");
  // 立柱高出板
  const top = Math.max(...stand.pieces.filter((q) => q.kind !== "plate").map((q) => (q.kind === "box" ? boxRange(q)[1][1] : q.at[1] + q.radius)));
  assert.ok(top > py + 0.3, `立柱頂(${top.toFixed(2)})高出板`);
});

test("第 363 種:擺動的範圍由板端碰到地面擋住,擺幅照原圖(約 33°)", () => {
  const def = m363.default;
  const board = def.parts.find((p) => p.id === "board");
  const stand = def.parts.find((p) => p.id === "stand");
  const ground = Math.max(...stand.pieces.filter((q) => q.kind === "box").map((q) => boxRange(q)[1][1]).filter((y) => y < board.center[1] - 1));
  // 板(長板與座位)各角的世界座標
  const corners = (a) =>
    board.pieces.flatMap((q) => {
      const pts = q.kind === "box" ? [-1, 1].flatMap((sx) => [-1, 1].map((sy) => [q.at[0] + (sx * q.size[0]) / 2, q.at[1] + (sy * q.size[1]) / 2])) : q.shape.outline;
      return pts.map((p) => add(board.center, [...rot2(p, a), 0]));
    });
  const low = (a) => corners(a).reduce((m, p) => (p[1] < m[1] ? p : m));
  const base = stand.pieces.filter((q) => q.kind === "box").map((q) => boxRange(q)).find(([, y]) => Math.abs(y[1] - ground) < 1e-9);
  for (const end of m363.RANGE) {
    const p = low(def.pose(end).parts.board.angle);
    close(p[1], ground, `擺到 ${((end * 180) / Math.PI).toFixed(1)}°:板端碰到地面`, 1e-6);
    assert.ok(base[0][0] <= p[0] && p[0] <= base[0][1], "碰到的地方有底座(地面)");
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

// 第 358–361 種共用:折線長、軸對齊外框(方塊、沿座標軸的圓柱,世界座標)與外框的連通
const polyLength = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]), 0);
function axisBox(q, origin = [0, 0, 0]) {
  const at = (q.at ?? [0, 0, 0]).map((v, k) => v + origin[k]);
  const axis = q.axis ?? [0, 0, 1];
  const h = q.kind === "box" ? q.size.map((v) => v / 2) : axis.map((a) => (Math.abs(a) > 0.5 ? q.length / 2 : q.radius));
  return { lo: at.map((v, k) => v - h[k]), hi: at.map((v, k) => v + h[k]) };
}
const boxesTouch = (a, b, eps = 1e-6) => [0, 1, 2].every((k) => a.lo[k] <= b.hi[k] + eps && b.lo[k] <= a.hi[k] + eps);
const boxesOverlap = (a, b) => [0, 1, 2].every((k) => a.lo[k] < b.hi[k] && b.lo[k] < a.hi[k]);
/** 外框兩兩相接(或相交)時,從第一個走得到每一個 */
function allConnected(boxes) {
  const seen = new Set([0]);
  for (let grew = true; grew; ) {
    grew = false;
    boxes.forEach((b, i) => {
      if (!seen.has(i) && [...seen].some((j) => boxesTouch(boxes[j], b))) (seen.add(i), (grew = true));
    });
  }
  return seen.size === boxes.length;
}

const d358 = m358.default;
const carriageX = (t) => d358.pose(t).parts.carriage.position[0];

test("第 358 種:托架的橫移速度依皮帶在鏈索輪上作用處的直徑而變:作用處在大端時快、在小端時慢", () => {
  const ts = sweep(m358.RANGE[1] - 0.05, 40, 0.05);
  const rate = (t) => (carriageX(t) - carriageX(t + 1e-4)) / 1e-4;
  const rates = ts.map(rate);
  assert.ok(rates.every((r) => r > 0), "曲柄往前轉,托架一路被拉向鏈索輪");
  assert.ok(rates.every((r, i) => i === 0 || r < rates[i - 1]), "作用處往小端走,托架越走越慢");
  assert.ok(rates[0] > 1.5 * rates.at(-1), "大直徑處快、小直徑處慢");
  // 托架速度大致是作用處的半徑 × 曲柄角速度(差的部分來自皮帶的斜度與螺旋的升程)
  for (const t of ts) {
    const ratio = rate(t) / m358.fusee(t).r;
    assert.ok(ratio > 0.8 && ratio < 1.6, `曲柄轉 ${t.toFixed(2)}:托架速度 / 作用處半徑 = ${ratio.toFixed(2)}`);
  }
});

test("第 358 種:皮帶長不變——托架走過的距離就是捲進鏈索輪的皮帶長(扣掉斜段的變化)", () => {
  const L0 = polyLength(d358.pose(0).paths.belt.points);
  for (const t of sweep(m358.RANGE[1], 60)) close(polyLength(d358.pose(t).paths.belt.points), L0, `曲柄轉 ${t.toFixed(2)}:皮帶長不變`, 5e-3);
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

test("第 358 種:托架的輪子坐在導軌上滾,機架連成一件,鏈索輪軸穿過兩端的軸承;托架全程不碰鏈索輪與它的軸", () => {
  const frame = part(d358, "frame");
  const boxes = frame.pieces.map((q) => axisBox(q));
  assert.ok(allConnected(boxes), "機架的每一塊連成一件(底座、軸承座、導軌、導輪的座)");
  const rails = frame.pieces.filter((q) => q.kind === "box" && q.size[0] > 4 && q.size[2] < 0.5).map((q) => axisBox(q)).sort((a, b) => b.hi[1] - a.hi[1]);
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
    for (const q of part(d358, "carriage").pieces) assert.ok(!boxesOverlap(axisBox(q, c), fx), `曲柄轉 ${t.toFixed(2)}:托架不碰鏈索輪與它的軸`);
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
  const L0 = ["cordL", "cordR"].map((id) => polyLength(d359.pose(0).paths[id].points));
  for (const v of sweep(4 * S, 160))
    ["cordL", "cordR"].forEach((id, i) => close(polyLength(d359.pose(v).paths[id].points), L0[i], `行程 ${v.toFixed(2)}:${id} 的長度不變`, 0.01));
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
    const L0 = polyLength(d360.pose(0).paths[id].points);
    for (const v of sweep(4 * S, 80)) close(polyLength(d360.pose(v).paths[id].points), L0, `擺動 ${v.toFixed(3)}:${id} 長度不變`, 2e-3);
  }
});

test("第 360 種:鼓輪的渦卷彈簧(推斷)內端在鼓輪上、外端插在機架上:繩拉著鼓輪轉時上緊,樑往回擺時把鼓輪轉回", () => {
  const drum = part(d360, "drum");
  const c = drum.center;
  const S = m360.SWING;
  const ang = (p) => Math.atan2(p[1] - c[1], p[0] - c[0]);
  const wrapA = (x) => Math.atan2(Math.sin(x), Math.cos(x));
  const turns = (pts) => Math.abs(pts.slice(1).reduce((s, p, i) => s + wrapA(ang(p) - ang(pts[i])), 0)) / (2 * Math.PI);
  const p0 = d360.pose(0);
  const [in0, out0] = [p0.paths.spring.points[0], p0.paths.spring.points.at(-1)];
  const n0 = turns(p0.paths.spring.points);
  const boxes = part(d360, "frame").pieces.filter((q) => q.kind === "box").map((q) => axisBox(q));
  assert.ok(boxes.some((b) => [0, 1, 2].every((k) => b.lo[k] - 1e-9 <= out0[k] && out0[k] <= b.hi[k] + 1e-9)), "外端插在機架的柱頂");
  for (const v of sweep(4 * S, 40)) {
    const pose = d360.pose(v);
    const pts = pose.paths.spring.points;
    const turned = pose.parts.drum.angle - p0.parts.drum.angle;
    close(wrapA(ang(pts[0]) - ang(in0) - turned), 0, `擺動 ${v.toFixed(3)}:內端跟著鼓輪轉`, 1e-6);
    close(Math.hypot(pts.at(-1)[0] - out0[0], pts.at(-1)[1] - out0[1], pts.at(-1)[2] - out0[2]), 0, "外端不動", 1e-9);
    close(turns(pts) - n0, turned / (2 * Math.PI), `擺動 ${v.toFixed(3)}:鼓輪往前轉多少,彈簧就上緊多少`, 1e-3);
  }
  // 往回擺時鼓輪轉回原處(彈簧放鬆);繩在上面驗過一直拉緊、長度不變
  close(d360.pose(4 * S).parts.drum.angle, p0.parts.drum.angle, "樑擺回起點時鼓輪轉回原處", 1e-9);
});

test("第 360 種:左繩沿左弧形頭垂下、穿過球,球下面還垂著一段(讓人拉動樑的拉繩,球是握把)", () => {
  const ball = part(d360, "ball");
  for (const v of sweep(2 * m360.SWING, 8)) {
    const pose = d360.pose(v);
    const pts = pose.paths.ropeL.points;
    const b = pose.parts.ball.position;
    const low = Math.min(...pts.map((p) => p[1]));
    assert.ok(b[1] - ball.radius - low > 1.5 * 2 * ball.radius, "球下還垂著約兩個球徑長的繩");
    const through = (p) => Math.abs(p[0] - b[0]) < 1e-9 && Math.abs(p[2] - b[2]) < 1e-9;
    assert.ok(pts.some((p) => through(p) && p[1] > b[1] + ball.radius) && pts.some((p) => through(p) && p[1] < b[1] - ball.radius), "繩從球的中心穿過");
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

test("第 361 種:推皮帶輪的彎槓桿繞右立柱上的樞軸擺動,下端的銷夾在輪轂兩個環之間", () => {
  const lever = part(d361, "lever");
  const frame = part(d361, "frame");
  const pivotPin = frame.pieces.find((q) => q.kind === "cylinder" && Math.hypot(q.at[0] - lever.center[0], q.at[1] - lever.center[1]) < 1e-9);
  assert.ok(pivotPin, "立柱上有槓桿的樞銷");
  const post = frame.pieces.map((q) => axisBox(q)).find((b) => b.hi[1] - b.lo[1] > 3 && b.lo[0] <= lever.center[0] && lever.center[0] <= b.hi[0]);
  assert.ok(post, "樞軸在右立柱上");
  const pb = axisBox(pivotPin);
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
  assert.ok(allConnected(frame.pieces.map((q) => axisBox(q))), "兩根立柱接在底座上,機架連成一件");
  const posts = frame.pieces.filter((q) => q.kind === "box" && q.size[1] > 3).map((q) => axisBox(q));
  assert.equal(posts.length, 2);
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

test("第 364 種:小輪連續旋轉,大輪間歇旋轉:每根凸柱的滾子推著斜棱走過時推一格,其餘時間不動", () => {
  const per = (2 * Math.PI) / 8;
  close(m364.bigAngle(-per) - m364.bigAngle(0), m364.STEP, "每根凸柱一格", 1e-12);
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
  close(m364.bigAngle(-2 * Math.PI) - m364.bigAngle(0), (8 / 12) * 2 * Math.PI, "小輪轉一圈,八根凸柱各推一格,大輪轉 8/12 圈", 1e-9);
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

test("第 369 種:擺線擺:擺錘沿擺線運動(擺線的長度不變,擺錘始終在擺線上)", () => {
  for (const p of sweep(1, 36)) {
    const { bob, phi, side } = m369.pendulum(p);
    // 擺線上的點:(a(φ + sin φ), −3a − a cos φ)(相對懸掛點)
    close(bob[0] - m369.top[0], side * m369.A * (phi + Math.sin(phi)), "擺錘在擺線上", 1e-12);
    close(bob[1] - m369.top[1], -3 * m369.A - m369.A * Math.cos(phi), "擺錘在擺線上", 1e-12);
  }
});

test("第 370 種:拋光鏡面:長桿有縱向與擺動運動,棘輪(鏡面)由偏心輪帶動的制動爪推動,每圈間歇地轉一格", () => {
  const ps = sweep(2 * Math.PI, 72).map((t) => m370.polish(t));
  const angles = ps.map((p) => p.angle);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.2, "長桿擺動");
  const slide = ps.map((p) => Math.hypot(p.pin[0] + 0.35, p.pin[1] + 2.05));
  assert.ok(Math.max(...slide) - Math.min(...slide) > 0.6, "長桿沿長度方向在軌道的銷上滑動");
  ps.forEach((p) => close(Math.hypot(p.pin[0] - p.center[0], p.pin[1] - p.center[1]), 2.0, "棘輪裝在長桿上的固定位置", 1e-9));
  close(m370.polish(2 * Math.PI).rel - m370.polish(0).rel, -m370.STEP, "每圈轉一格", 1e-12);
  // 由接觸算:一程比一齒多,爪尖先空走一段才碰上齒面;制動爪沒推的時候棘輪不動
  const { SWEEP, SLACK, STEP } = m370.geometry;
  assert.ok(SWEEP > STEP && SLACK > 0, "一程比一齒多一點");
  const rel = ps.map((p) => p.rel);
  const movedWhileIdle = ps.filter((p, i) => i > 0 && !p.engaged && !ps[i - 1].engaged && Math.abs(rel[i] - rel[i - 1]) > 1e-12);
  assert.equal(movedWhileIdle.length, 0, "制動爪沒頂著齒面時,棘輪不動(間歇)");
  assert.ok(ps.some((p) => p.engaged) && ps.some((p) => !p.engaged), "每圈有推、有停");
});

test("第 384 種:螺旋線描繪儀:小輪繞中心滾動,同時沿螺紋移動,畫出渦線", () => {
  const ds = sweep(m384.RANGE[1], 30).map((p) => m384.helicograph(p).d);
  assert.ok(ds.every((d, i) => i === 0 || d > ds[i - 1]), "離中心越來越遠(渦線)");
  const h = m384.helicograph(1);
  close(Math.log(h.d / m384.helicograph(0).d), m384.K, "每轉一弧度,距離按固定比例增加", 1e-12);
});

test("第 371 種:兩面有齒的曼格輪:小齒輪均勻旋轉,輪交替地往兩個方向轉,換向時小齒輪穿過開口到另一面", () => {
  const ws = sweep(4 * Math.PI * 60 / 8, 800).map((t) => m371.mangle(t));
  const dirs = ws.slice(1).map((w, i) => Math.sign(w.wheel - ws[i].wheel)).filter(Boolean);
  const changes = dirs.slice(1).filter((d, i) => d !== dirs[i]).length;
  assert.ok(changes >= 1, "輪換向");
  assert.ok(ws.some((w) => w.z > 0.2) && ws.some((w) => w.z < -0.2), "小齒輪在兩面之間換");
  close(Math.max(...ws.map((w) => w.wheel)) - Math.min(...ws.map((w) => w.wheel)), m371.TRAVEL, "單向轉將近一圈", 0.01);
});

test("第 372 種:懷特氏測功計:框架靜止時運動經水平齒輪傳到另一個垂直齒輪;框架放開時框架隨之旋轉", () => {
  const held = m372.dynamometer(1, "held");
  close(held.carrier, 0, "框架不動");
  close(held.sun2, -1, "另一個垂直齒輪反向轉");
  const free = m372.dynamometer(1, "free");
  close(free.carrier, 0.5, "框架跟著轉(負載擋住另一個齒輪時,轉一半)");
});

test("第 373 種:羅伯特氏裝置:指示器的讀數不隨大輪轉速改變,只隨載重改變", () => {
  const def = m373.default;
  close(def.pose(0.5, "light").parts.needle.angle, def.pose(5, "light").parts.needle.angle, "速度不同,指示器不變");
  assert.notEqual(def.pose(1, "light").parts.needle.angle, def.pose(1, "heavy").parts.needle.angle, "重量不同,指示器改變");
  // 帶動大輪的皮帶輪(原圖伸出圖外,補上):皮帶不打滑,皮帶輪與大輪軸上的輪轂表面速度相同
  const [p0, p1] = [def.pose(0).parts, def.pose(1).parts];
  close((p1.pulley.angle - p0.pulley.angle) * 0.5, (p1.wheel.angle - p0.wheel.angle) * 0.55, "皮帶不打滑", 1e-9);
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

test("第 375 種:滾壓輪:輪軸接在直立軸上,輪在環形鍋盆裡繞行並滾動(不打滑)", () => {
  const a = m375.runners(0);
  const b = m375.runners(1);
  const { RUN, WHEEL } = m375.geometry;
  close(Math.abs(b.roll - a.roll) * WHEEL, Math.abs(b.shaft - a.shaft) * RUN, "輪滾過的長度 = 繞行的弧長");
  close(Math.abs(b.shaft - a.shaft), 1, "傘齒輪 1:1");
});

test("第 376 種:踏輪馬力裝置:馬往上走,輪在牠腳下轉", () => {
  close(m376.treadWheel(1).wheel, 2 * Math.PI, "進程一圈,輪轉一圈");
  const strides = sweep(0.2, 40).map((p) => m376.treadWheel(p).stride);
  assert.ok(Math.max(...strides) > 0.9 && Math.min(...strides) < -0.9, "腿交替擺動");
});

test("第 377 種:踏車:人踩在周邊的踏板上往上走,圓筒被人的重量帶著轉", () => {
  close(m377.treadmill(1).drum, -2 * Math.PI, "進程一圈,圓筒轉一圈(往後轉)");
  const steps = sweep(0.2, 60).map((p) => m377.treadmill(p).step);
  assert.ok(Math.max(...steps) > 0.9 && Math.min(...steps) < -0.9, "人原地踏步");
});

test("第 378 種:擺鋸:擺的運動帶著鋸框往復,鋸條一面鋸一面往下切進樹幹", () => {
  const shifts = sweep(0.2, 200).map((p) => m378.sawing(p).shift);
  assert.ok(Math.max(...shifts) > 0.5 && Math.min(...shifts) < -0.5, "鋸框往復");
  close(m378.sawing(0).saw - m378.sawing(1).saw, m378.DEPTH, "一輪鋸進的深度");
  const ys = sweep(1, 50).map((p) => m378.sawing(p).saw);
  assert.ok(ys.every((y, i) => i === 0 || y <= ys[i - 1] + 1e-12), "鋸的時候一路往下");
  // 鋸框由兩條繩吊著,繞過滑輪吊著配重:鋸框降多少,配重升多少
  close(m378.hang(-0.5).weightTop - m378.hang(-0.3).weightTop, 0.2, "配重與鋸框反向等量移動", 1e-9);
});

test("第 379–380 種:可攜式夾鉗鑽:379 的進料螺桿與鑽頭相對、把工件往上頂;380 的鑽頭心軸穿過進料螺桿中心、往下送", () => {
  const a = fig379.pose(0).parts;
  const b = fig379.pose(20).parts;
  assert.ok(b.screw.position[1] > a.screw.position[1], "379:下臂的螺桿往上頂");
  close(b.drill.angle, 20, "鑽頭跟著曲柄轉");
  const c = fig380.pose(0).parts;
  const d = fig380.pose(20).parts;
  assert.ok(d.drill.position[1] < c.drill.position[1], "380:鑽頭心軸往下送");
});

test("第 381 種:Bowery 式夾具:楔塊順著燕尾形夾頰往裡推,內側夾緊木料", () => {
  const [lo, hi] = m381.RANGE;
  assert.ok(m381.clampGap(hi).inner < m381.clampGap(lo).inner, "推進時兩楔塊靠攏");
  close(m381.clampGap(hi).inner, 0.34, "推到底時夾緊木料", 1e-9);
});

test("第 382 種:鏡子支架:玻璃可抬高或降下、左右轉動,並改變傾斜角度", () => {
  const def = m382.default;
  const low = def.pose(0, "low").parts;
  const high = def.pose(0, "high").parts;
  assert.ok(high.mirror.position[1] > low.mirror.position[1], "抬升");
  assert.notDeepEqual(def.pose(0, "turned").parts.mirror.rotation, high.mirror.rotation, "左右轉動");
  assert.notDeepEqual(def.pose(0.3, "high").parts.mirror.rotation, high.mirror.rotation, "改變傾角");
});

test("第 383 種:布從一個滾筒繞到另一個,中間的圓筒(刷子)處理布面", () => {
  const c = m383.cloth(-1);
  close(c.travel, 0.7, "布走過的長度 = 下滾筒捲上的弧長");
  close(Math.abs(c.top) * 0.7, c.travel, "上滾筒放出同樣長的布");
  close(Math.abs(c.mid) * 1.0, m383.BRUSH * c.travel, "中間圓筒的表面比布快");
});

test("第 385 種:俄羅斯關門裝置:開門時兩銷靠近、重物被抬起;重物下壓肘節,把兩銷撐開而關門", () => {
  const [closed, open] = m385.RANGE;
  assert.ok(m385.toggle(open).joint[1] > m385.toggle(closed).joint[1], "開門時重物被抬起");
  for (const x of sweep(open, 8, closed)) {
    const t = m385.toggle(x);
    close(Math.hypot(t.joint[0] - t.x, t.joint[1] + 0.4), 2.2, "桿長不變", 1e-9);
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
  const span = m394.RANGE[1] - m394.RANGE[0];
  const ps = sweep(4 * span, 800).map((v) => m394.parsons(v));
  assert.ok(ps.every((p, i) => i === 0 || p.pinion >= ps[i - 1].pinion - 1e-9), "小齒輪只朝一個方向轉");
  const xs = ps.map((p) => p.frame[0]);
  close(Math.max(...xs) - Math.min(...xs), span, "框往復", 1e-6);
  const { LEN, C, RP } = m394.geometry;
  close(m394.parsons(2 * span).pinion - m394.parsons(0).pinion, (2 * LEN + 2 * Math.PI * C) / RP, "框來回一次,小齒輪沿跑道滾一圈", 1e-6);
  // 往一個方向時咬一排、往回時咬另一排:框跟著上下換位
  assert.ok(m394.parsons(span / 2).frame[1] * m394.parsons(1.5 * span).frame[1] < 0, "兩個方向咬不同排的齒");
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
  const angles = sweep(T, 360).map((t) => m397.lever(t).angle);
  const still = angles.slice(1).filter((a, i) => Math.abs(a - angles[i]) < 1e-9).length;
  assert.ok(still > 150, "曲柄轉半圈時擺桿停住(間歇)");
  close(Math.max(...angles.map(Math.abs)), m397.SWING, "擺幅 = 2·asin(曲柄半徑 / 樞軸到曲柄軸的距離)", 1e-3);
  const xs = angles.map((a) => m397.slide(a).x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.5, "滑桿往復");
  // 銷始終在槽的中心線上(擺桿局部座標)
  const { PIVOT, L, CRANK } = m397.geometry;
  for (const t of sweep(T, 72)) {
    const { angle } = m397.lever(t);
    const [px, py] = m397.pinAt(t);
    const [dx, dy] = [px - PIVOT[0], py - PIVOT[1]];
    const [qx, qy] = [dx * Math.cos(-angle) - dy * Math.sin(-angle), dx * Math.sin(-angle) + dy * Math.cos(-angle)];
    close(Math.hypot(qx, qy - L), CRANK.r, `曲柄 ${t.toFixed(2)}:銷在槽上`, 1e-9);
    assert.ok(qx <= 1e-9, "銷在槽的那半圈(左半圈)");
  }
});

test("第 398 種:連續圓周運動 → 間歇圓周運動,凸輪 C 為驅動端;棘爪推大輪由接觸算", () => {
  const ws = sweep(-2 * Math.PI, 720).map((t) => m398.intermittent(t).wheel);
  assert.ok(ws.every((w, i) => i === 0 || w >= ws[i - 1] - 1e-9), "大輪只朝一個方向轉");
  const still = ws.slice(1).filter((w, i) => Math.abs(w - ws[i]) < 1e-9).length;
  assert.ok(still > 200, "間歇:有停住的時候");
  close(m398.perStroke, m398.PITCH, "方框往復一次,大輪被推一齒");
  close(m398.intermittent(-2 * Math.PI).wheel, 3 * m398.PITCH, "凸輪轉一圈(三瓣),推三齒", 1e-9);
  for (const t of sweep(2 * Math.PI, 12)) close(m398.yokeX(t) + m398.yokeX(t + Math.PI), 0, "等寬凸輪:方框兩側始終夾著", 1e-9);
  for (const t of sweep(-2 * Math.PI, 240)) assert.ok(!polygonsOverlap(m398.pawlOutlineAt(t), m398.wheelOutlineAt(t)), `主動量 ${t.toFixed(2)}:爪壓進齒裡`);
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
