// 第十六章「雜項裝置」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, turned, inSolid } from "./helpers.js";
import { deg, quatMul, quatRotate, partPoint, X } from "../models/kit.js";

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

test("第 365 種:滾子的旋轉同時產生桿的縱向運動與旋轉運動(兩滾子的軸彼此傾斜)", () => {
  const { TILT, RR, ROD } = m365.geometry;
  const m = m365.rodMotion(1);
  close(m.advance, RR * Math.cos(TILT), "縱向:滾子表面速度沿桿軸的分量");
  close(Math.abs(m.spin) * ROD, RR * Math.sin(TILT), "旋轉:沿桿圓周的分量");
  close(m.back, -1, "兩滾子反向轉");
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

test("第 364 種:小輪連續旋轉,大輪間歇旋轉:每根凸柱的滾子推著斜棱走過時推一格,其餘時間不動", () => {
  const per = (2 * Math.PI) / 8;
  close(m364.bigAngle(-per) - m364.bigAngle(0), m364.STEP, "每根凸柱一格", 1e-12);
  const as = sweep(-2 * Math.PI, 720).map(m364.bigAngle);
  assert.ok(as.every((a, i) => i === 0 || a >= as[i - 1] - 1e-12), "大輪只朝一個方向轉");
  const still = as.slice(1).filter((a, i) => Math.abs(a - as[i]) < 1e-12).length;
  assert.ok(still > 0.3 * as.length, "間歇:滾子走在斜棱之外的時候大輪停住(至少三成的時間)");
  // 由接觸算:推動時大輪轉角與滾子的高度成正比(斜棱是一道斜面)
  const [a, b] = [m364.drive(-0.05), m364.drive(-0.15)];
  assert.ok(a.y !== null && b.y !== null);
  close((b.angle - a.angle) / (a.y - b.y), m364.STEP / 0.56, "轉角 / 滾子下降的距離 = 一格 / 斜棱的高度", 1e-9);
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
  assert.ok(m367.ruler(m367.RANGE[1]).gap > m367.ruler(m367.RANGE[0]).gap, "擺開時寬度變大");
  // 「黃銅弧形外緣的指向可指示兩個尺葉之間的寬度」:弧固定在下尺葉上,與上尺葉刻度相交的位置(從刻度的起點量)隨寬度單調增加
  const marks = sweep(m367.RANGE[1], 10, m367.RANGE[0]).map((a) => m367.reading(a) - (m367.ruler(a).dx - 0.75));
  for (let i = 1; i < marks.length; i++) assert.ok(marks[i] > marks[i - 1], "寬度越大,讀數越往刻度的另一頭");
  assert.ok(marks.every((x) => x >= 0 && x <= 1.44), "讀數始終落在刻度上");
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
