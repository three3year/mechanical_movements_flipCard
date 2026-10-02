// 第四章「曲柄與凸輪」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import { dist } from "../models/kit.js";
import fig92, { crankSlider } from "../models/fig092.js";
import fig96, { CAM_OUTLINE, ROLLER_RADIUS } from "../models/fig096.js";
import { rot2 } from "../models/kit.js";

test("第 92 種:曲柄轉一圈,滑塊完成一次往返,行程等於曲柄半徑的兩倍", () => {
  const xs = sweep(Math.PI * 2, 360).map((a) => fig92.pose(a).parts.slider.position[0]);
  close(xs[0], xs[xs.length - 1], "轉一圈回到原處");
  const stroke = Math.max(...xs) - Math.min(...xs);
  close(stroke, 2 * 0.92, "行程 = 2 × 曲柄半徑", 1e-3);
  // 一圈中只有一次往、一次返:位移方向只改變兩次
  let turns = 0;
  for (let i = 2; i < xs.length; i++) if (Math.sign(xs[i] - xs[i - 1]) !== Math.sign(xs[i - 1] - xs[i - 2])) turns++;
  assert.equal(turns, 2);
});

test("第 92 種:任何主動量下連桿兩端都接在曲柄銷與滑塊上(長度不變)", () => {
  for (const a of sweep(Math.PI * 4, 50, -1)) {
    const { from, to } = fig92.pose(a).parts.rod;
    close(dist(from, to), 3.1, `轉角 ${a}`, 1e-9);
    const { pin, slider } = crankSlider(a);
    close(dist([from[0], from[1], 0], [pin[0], pin[1], 0]), 0, "連桿接在曲柄銷");
    close(dist([to[0], to[1], 0], [slider[0], slider[1], 0]), 0, "連桿接在滑塊");
  }
});

// 暫代:之後有四連桿模型(如第 35、37 種)時,改由那些模型的測試涵蓋
import { fourBar } from "../models/linkage.js";
test("連桿閉合也能解四連桿:各桿長度不變,極限位置不分離", () => {
  const spec = { a: [0, 0, 0], b: [3, 0, 0], crank: 1, coupler: 3.2, rocker: 2 };
  for (const angle of sweep(Math.PI * 2, 72)) {
    const { pin, joint, reach } = fourBar({ ...spec, angle });
    assert.ok(reach);
    close(dist(pin, spec.a), 1);
    close(dist(pin, joint), 3.2);
    close(dist(joint, spec.b), 2);
  }
  const far = fourBar({ ...spec, coupler: 0.5, angle: Math.PI });
  assert.equal(far.reach, false, "兩圓不相交時標記為不可達");
  assert.ok(far.joint.every(Number.isFinite), "仍回傳最接近的姿勢");
});

test("第 96 種:心形凸輪「將均勻的橫移運動賦予水平桿」——去程與回程的位移各自與轉角成正比", () => {
  const x = (a) => fig96.pose(a).parts.rod.position[0];
  const rate = (x(0.2) - x(0.1)) / 0.1;
  for (const a of sweep(Math.PI - 0.05, 20, 0.05)) close((x(a + 0.04) - x(a)) / 0.04, rate, `去程 ${a}`, 1e-6);
  for (const a of sweep(2 * Math.PI - 0.05, 20, Math.PI + 0.05)) close((x(a + 0.04) - x(a)) / 0.04, -rate, `回程 ${a}`, 1e-6);
  close(x(0), x(2 * Math.PI), "轉一圈回到原處");
});

test("第 96 種:任何轉角下桿端滾子都貼著凸輪輪廓", () => {
  for (const a of sweep(2 * Math.PI, 40)) {
    const pose = fig96.pose(a).parts;
    const [rx, ry] = pose.rod.position;
    const gap = Math.min(...CAM_OUTLINE.map((p) => {
      const [x, y] = rot2(p, pose.cam.angle);
      return Math.hypot(x - rx, y - ry);
    }));
    close(gap, ROLLER_RADIUS, `轉角 ${a}`, 0.01);
  }
});

import { eccentric, throwRadius as e89 } from "../models/fig089.js";
import { scotch, throwRadius as e90 } from "../models/fig090.js";
import { frame as frame91, width as width91 } from "../models/fig091.js";
import { yoke as yoke93, crankRadius as r93 } from "../models/fig093.js";
import fig94, { crankLength, spiralPitch } from "../models/fig094.js";
import { arm as arm98 } from "../models/fig098.js";

const strokeOf = (xs) => Math.max(...xs) - Math.min(...xs);

test("第 89 種:偏心輪把旋轉變成往復直線運動,轉一圈往返一次,行程是偏心距的兩倍", () => {
  const xs = sweep(2 * Math.PI, 720).map((t) => eccentric(t).x);
  close(strokeOf(xs), 2 * e89, "行程", 1e-4);
  close(xs[0], xs[xs.length - 1], "轉一圈回到原處");
});

test("第 90 種:以軛取代偏心環,軛直線往復(不擺動),行程是偏心距的兩倍、位移為正弦", () => {
  for (const t of sweep(2 * Math.PI, 36)) close(scotch(t).x, e90 * Math.cos(t), `轉角 ${t}`);
});

test("第 91 種:三角形偏心輪使方框做間歇性的往復,有一段時間停住不動", () => {
  const ys = sweep(2 * Math.PI, 720).map((t) => frame91(t).bottom);
  let still = 0;
  for (let i = 1; i < ys.length; i++) if (Math.abs(ys[i] - ys[i - 1]) < 1e-6) still++;
  assert.ok(still > 100, "有停住的時段");
  for (const t of sweep(2 * Math.PI, 72)) close(frame91(t).top - frame91(t).bottom, width91, "上下邊永遠同時碰到輪", 1e-3);
});

test("第 93 種:曲柄手腕在開槽軛內作動,軛直線往復,行程是曲柄半徑的兩倍", () => {
  close(strokeOf(sweep(2 * Math.PI, 720).map((t) => yoke93(t).y)), 2 * r93, "行程", 1e-4);
});

test("第 94 種:轉動螺旋板時,螺栓沿放射槽朝中心移動或遠離中心(曲柄長改變)", () => {
  close(crankLength(0) - crankLength(2 * Math.PI), spiralPitch, "轉一圈移動一個螺旋節距");
  const [lo, hi] = fig94.driver.range;
  assert.ok(crankLength(lo) > crankLength(hi), "範圍兩端曲柄長不同");
});

test("第 98 種:圓盤上的曲柄銷始終在振動臂的環形溝槽內,臂做不規則的擺動", () => {
  const psis = sweep(2 * Math.PI, 360).map((t) => arm98(t).psi);
  for (const t of sweep(2 * Math.PI, 36)) assert.ok(arm98(t).err < 1e-6, "銷在溝槽中心線上");
  assert.ok(strokeOf(psis) > 0.1, "臂會擺動");
  close(psis[0], psis[psis.length - 1], "轉一圈回到原處", 1e-6);
});

import { rodHeight, stroke as stroke95 } from "../models/fig095.js";
import fig97 from "../models/fig097.js";
import fig99, { feed, pitch as pitch99 } from "../models/fig099.js";
import { quickReturn } from "../models/fig100.js";
import fig101, { pinX } from "../models/fig101.js";

test("第 95 種:直立軸旋轉時,斜置的圓盤把往復直線運動傳給直立桿(一圈往返一次)", () => {
  const ys = sweep(2 * Math.PI, 720).map(rodHeight);
  close(strokeOf(ys), stroke95, "行程 = 2 × 距離 × tan(傾角)", 2e-3);
  close(ys[0], ys[ys.length - 1], "一圈回到原處");
});

test("第 97 種:開有溝槽的心形凸輪,與第 96 種相同——桿做均勻的橫移", () => {
  const x = (a) => fig97.pose(a).parts.rod.position[0];
  const rate = (x(0.3) - x(0.2)) / 0.1;
  for (const a of sweep(Math.PI - 0.1, 10, 0.1)) close((x(a + 0.05) - x(a)) / 0.05, rate, `去程 ${a}`, 1e-6);
  for (const a of sweep(2 * Math.PI - 0.1, 10, Math.PI + 0.1)) close((x(a + 0.05) - x(a)) / 0.05, -rate, `回程 ${a}`, 1e-6);
});

test("第 99 種:圓盤上的螺旋導引器使進給滑座每轉一圈移動一個螺距", () => {
  close(feed(0) - feed(2 * Math.PI), pitch99);
  const [lo, hi] = fig99.driver.range;
  assert.ok(feed(lo) > feed(hi), "在範圍內滑座從外往內移動");
});

test("第 100 種:快速回程——開槽桿往兩個方向擺動所花的曲柄轉角不同", () => {
  const n = 3600;
  const angles = sweep(2 * Math.PI, n).map((t) => quickReturn(t).lever);
  let up = 0;
  let down = 0;
  for (let i = 1; i < angles.length; i++) {
    let d = angles[i] - angles[i - 1];
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    if (d > 0) up++;
    else down++;
  }
  const ratio = Math.max(up, down) / Math.min(up, down);
  assert.ok(ratio > 1.3, `慢行程與快回程的比 ${ratio.toFixed(2)}`);
});

test("第 101 種:開槽桿擺動時,水平桿做直線運動(位移 = 懸掛高度 × tan 擺角)", () => {
  const [lo, hi] = fig101.driver.range;
  assert.ok(pinX(hi) > pinX(lo));
  for (const psi of sweep(hi, 10, lo)) {
    const bar = fig101.pose(psi).parts.bar.position;
    close(bar[1], 0, "水平桿只在水平方向動");
    close(bar[0], pinX(psi));
  }
});
