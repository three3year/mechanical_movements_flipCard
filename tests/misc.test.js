// 第十六章「雜項裝置」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import { deg, quatMul, quatRotate, partPoint, add, sub, scale, dot, dist, len, lerp3, rot2, X, Y, Z } from "../models/kit.js";

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
import { penetrationDepth, polygonsOverlap } from "../models/contact.js";

test("第 350 種:上溝槽的銷靜止、下溝槽的銷沿水平線移動,槓桿把橫移運動傳給導件 a、a 內的桿", () => {
  const xs = sweep(0.6, 20, -1.6).map((x) => m350.traverse(x).rod);
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
  // 繩不打滑:左導輪的表面速度是大段捲進的速度、右導輪是小段放出的速度,吊重滑輪是兩者的平均(一邊升一邊轉)
  const [a, b] = [m352.sheaves(1), m352.sheaves(2)];
  close((b.left - a.left) * 0.17, r1, "左導輪的表面速度 = R₁·ω", 1e-9);
  close((b.right - a.right) * 0.17, r2, "右導輪的表面速度 = R₂·ω", 1e-9);
  close(Math.abs(b.pulley - a.pulley) * 0.32, (r1 + r2) / 2, "吊重滑輪的表面速度 = 兩者的平均", 1e-9);
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

test("第 357 種:陀螺儀調速器:轉得越快,越能克服彈簧 L,B 的外端被抬得越高,經 C、D 拉動閥桿", () => {
  const slow = m357.governor(2);
  const fast = m357.governor(9);
  assert.ok(fast.end[1] > slow.end[1], "B 的外端升高");
  assert.ok(fast.valve > slow.valve, "閥桿被拉起");
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

test("第 358 種:托架的橫移速度依皮帶在鏈索輪上作用處的直徑而變", () => {
  const rate = (t) => (m358.fusee(t + 1e-4).wound - m358.fusee(t).wound) / 1e-4;
  const a = rate(0.1);
  const b = rate(m358.RANGE[1] - 0.1);
  close(a, m358.fusee(0.1).r, "托架速度 = 作用處的半徑 × 曲柄角速度", 1e-3);
  assert.ok(a > 1.5 * b, "大直徑處快、小直徑處慢");
});

test("第 359 種:原始鑽孔裝置:按下橫桿時繩解開、心軸轉;放開時繩反向捲回,下一次心軸往另一個方向轉", () => {
  const S = m359.STROKE;
  const down1 = m359.pump(0.5 * S).spindle - m359.pump(0).spindle;
  const down2 = m359.pump(2.5 * S).spindle - m359.pump(2 * S).spindle;
  assert.ok(down1 * down2 < 0, "相鄰兩次按下,心軸轉向相反");
  close(m359.pump(S).spindle, 0, "按到底時繩完全解開", 1e-12);
  assert.ok(m359.pump(2 * S).bar > m359.pump(S).bar, "飛輪的動量把繩捲回、橫桿被拉起");
});

test("第 360 種:樑擺動時,鼓輪經棘爪與棘輪帶動飛輪軸只朝一個方向轉;飛輪連續旋轉", () => {
  const S = m360.SWING;
  const fs = sweep(8 * S, 400).map((v) => m360.beam(v).fly);
  assert.ok(fs.every((f, i) => i === 0 || f < fs[i - 1]), "飛輪只朝一個方向轉,而且不停(由擺動運動所產生的連續旋轉運動)");
  // 鼓輪往回轉時,棘爪不帶飛輪:飛輪靠動量繼續往前、越轉越慢
  const back = [2.2, 2.6, 3.0, 3.4].map((k) => m360.beam(k * S));
  assert.ok(back.every((b) => !b.engaged), "回擺時棘爪沒有推");
  assert.ok(back[1].drum > back[0].drum, "鼓輪反轉");
  const d = back.slice(1).map((b, i) => back[i].fly - b.fly);
  assert.ok(d[0] > d[1] && d[1] > d[2] && d[2] > 0, "滑行越來越慢");
  // 推的時候棘輪和鼓輪鎖在一起;每一程推完正好前進一程(3 齒)
  const [p1, p2] = [m360.beam(1.2 * S), m360.beam(1.8 * S)];
  assert.ok(p1.engaged && p2.engaged);
  close(p2.fly - p1.fly, p2.drum - p1.drum, "推動時飛輪跟著鼓輪轉", 1e-9);
  close(m360.beam(2 * S).fly - m360.beam(6 * S).fly, m360.stroke.SPAN, "每一程前進一程", 1e-9);
  close(m360.stroke.SPAN, m360.stroke.STROKE_TEETH * m360.stroke.PITCH, "一程剛好整數齒(棘爪每程在同一個相位碰上齒面)", 1e-9);
  assert.ok(m360.stroke.returnCoast < m360.stroke.PITCH, "回程裡飛輪滑行不到一齒:下一程棘爪碰上的是面前第一個齒面,不會走過齒面");
});

test("第 361 種:皮帶輪離合器:兩銷接觸時下方軸跟著皮帶輪轉,脫開時皮帶輪空轉、軸停住", () => {
  close(m361.clutch(2, "on").shaft, m361.clutch(2, "on").pulley, "接合");
  close(m361.clutch(2, "off").shaft, 0, "脫開時軸不轉");
  assert.ok(Math.abs(m361.clutch(2, "off").pulley) > 1, "皮帶輪照轉");
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
  close(up.position[1] - down.position[1], m366.PRESS, "踩下踏板,鑽桿下降");
  close(Math.abs(m366.drill(1) - m366.drill(0)), 30 / 12, "轉速比 = 齒數比", 1e-9);
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

test("第 368 種:在圓筒上畫螺旋線:圓筒轉動,同一個正齒輪帶齒條使標記點從一端移到另一端,每轉移動一個螺距", () => {
  close(m368.marker(-2 * Math.PI) - m368.marker(0), m368.PITCH, "每轉一個螺距");
  const pts = m368.default.pose(-4 * Math.PI).paths.helix.points;
  const ys = pts.map((p) => p[1]);
  assert.ok(ys.every((y, i) => i === 0 || y >= ys[i - 1] - 1e-12), "螺旋線沿圓筒單調上升");
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
