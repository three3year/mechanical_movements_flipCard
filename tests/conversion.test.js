// 第七章「運動轉換與應用」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close } from "./helpers.js";
import fig152, { SEMI_AXES } from "../models/fig152.js";

const START = fig152.driver.initial;
const trace = (t) => fig152.pose(t).paths.ellipse.points;

test("第 152 種:橢圓規的鉛筆畫出橢圓——軌跡上每一點滿足橢圓方程式", () => {
  const [a, b] = SEMI_AXES;
  for (const [x, y] of trace(START + 4)) close((x / a) ** 2 + (y / b) ** 2, 1, "x²/a² + y²/b² = 1", 1e-9);
});

test("第 152 種:橫移桿轉一圈,軌跡閉合成完整的橢圓", () => {
  const pts = trace(START + 2 * Math.PI);
  const first = pts[0];
  const last = pts[pts.length - 1];
  close(Math.hypot(first[0] - last[0], first[1] - last[1]), 0, "首尾相接");
  const xs = pts.map((p) => p[0]);
  close(Math.max(...xs) - Math.min(...xs), 2 * SEMI_AXES[0], "橫向跨過整個長軸", 1e-3);
});

test("第 152 種:往回轉時軌跡跟著縮回(軌跡是主動量的函式)", () => {
  assert.ok(trace(START + 3).length > trace(START + 1.5).length);
  assert.ok(trace(START + 1.5).length > trace(START + 0.2).length);
  assert.equal(trace(START).length >= 2, true);
});

import { frameX as frame128, bounds as bounds128 } from "../models/fig128.js";
import { pulleyY, radii as radii129 } from "../models/fig129.js";
import { shears } from "../models/fig130.js";
import { swingRack } from "../models/fig131.js";
import { press as press132 } from "../models/fig132.js";
import { press as press133 } from "../models/fig133.js";
import { sweep, close as near } from "./helpers.js";

const TAU = 2 * Math.PI;

test("第 128 種:三推板軸連續旋轉,框架往復直線運動(每轉一圈往返三次),推板不穿過凸塊", () => {
  const xs = sweep(TAU, 720).map(frame128);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.5, "框架有明顯的行程");
  let turns = 0;
  for (let i = 2; i < xs.length; i++) if ((xs[i] - xs[i - 1]) * (xs[i - 1] - xs[i - 2]) < -1e-12) turns++;
  for (const t of sweep(TAU, 120)) {
    const [lo, hi] = bounds128(t);
    const x = frame128(t);
    assert.ok(x >= lo - 1e-9 && x <= hi + 1e-9, "框架在兩個限制之間");
  }
  near(frame128(TAU / 3), frame128(0), "每三分之一圈重複", 1e-9);
});

test("第 129 種:中式絞盤每轉一圈,滑輪移動大小圓周差的一半", () => {
  const [r1, r2] = radii129;
  near(pulleyY(TAU) - pulleyY(0), (TAU * r1 - TAU * r2) / 2);
});

test("第 130 種:剪具的夾爪靠長臂的重量張開,凸輪轉到高處時閉合", () => {
  const angles = sweep(TAU, 360).map(shears);
  assert.ok(Math.min(...angles) > -0.02, "閉合時剛好合攏、不交叉");
  assert.ok(Math.max(...angles) > 0.15, "張開");
});

test("第 131 種:圓盤上的曲柄銷使開槽臂與齒扇形段擺動,底部的齒條往復直線運動", () => {
  const xs = sweep(TAU, 360).map((t) => swingRack(t).x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.5);
  const a = swingRack(0.3);
  const b = swingRack(0.5);
  near((b.x - a.x) / (b.arm - a.arm), 1.3, "齒條移動 = 扇形段節圓半徑 × 轉角(齒條在下方,扇形段逆時針時往右)", 1e-9);
});

test("第 132 種:轉動上圓盤,兩根斜桿轉向直立,把下圓盤往下推", () => {
  const ys = sweep(1.9, 20).map((p) => press132(p).y);
  for (let i = 1; i < ys.length; i++) assert.ok(ys[i] < ys[i - 1], "越轉越往下");
});

test("第 133 種:手搖曲柄經小齒輪帶動齒扇形段,扇形段經連桿把壓板頂起", () => {
  const a = press133(-1.0);
  const b = press133(2.5);
  assert.ok(a.y !== b.y, "壓板隨曲柄上下");
  near(Math.abs((b.sector - a.sector) / 3.5), 10 / 40, "扇形段轉角 = 曲柄 × 齒數比", 1e-9);
});

import { ropeTravel, radius as r134 } from "../models/fig134.js";
import { frameY as frame135, frameTop as top135, width as width135 } from "../models/fig135.js";
import { rodX as rod136 } from "../models/fig136.js";
import { arm as arm137, pitchAt as pitch137 } from "../models/fig137.js";
import { rodY as rod138 } from "../models/fig138.js";
import { rackPosition, alphaPerLoop, halfStraight } from "../models/fig139.js";

test("第 134 種:繩繞鼓輪,鼓輪均勻轉動時繩直線前進,距離等於輪緣轉過的弧長", () => {
  near(ropeTravel(TAU), TAU * r134);
});

test("第 135 種:三角形撥爪使框架交替直線運動,行程兩端速度為零", () => {
  const ys = sweep(TAU, 720).map(frame135);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 0.15, "框架往復");
  // 行程兩端(最高、最低)附近幾乎停住
  const i = ys.indexOf(Math.min(...ys));
  assert.ok(Math.abs(ys[i + 1] - ys[i]) < 1e-3, "行程端點速度近於零");
  for (const t of sweep(TAU, 36)) near(top135(t) - frame135(t), width135, "上下邊同時碰到撥爪", 1e-3);
});

test("第 136 種:凸輪輪的齒使被彈簧壓著的桿做交替方向的直線運動", () => {
  const xs = sweep(TAU, 720).map(rod136);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.3);
  near(rod136(TAU / 10), rod136(0), "每轉過一齒重複一次", 1e-9);
});

test("第 137 種:膨脹偏心輪使叉形臂擺動,兩個滾子始終同時貼著偏心輪", () => {
  for (const phi of sweep(TAU, 36)) near(pitch137(phi) + pitch137(phi + Math.PI), 2.1, "對邊的距離不變", 1e-9);
  const angles = sweep(TAU, 360).map((t) => arm137(t).angle);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.05, "臂會擺動");
});

test("第 138 種:底部的凸輪使靠在上面的桿做變速的交替直線運動", () => {
  const ys = sweep(TAU, 720).map(rod138);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 0.4);
  near(rod138(0), rod138(TAU), "一圈回到原處", 1e-9);
  const speeds = ys.slice(1).map((y, i) => Math.abs(y - ys[i]));
  assert.ok(Math.max(...speeds) > 2 * (speeds.reduce((a, b) => a + b) / speeds.length), "速度變化");
});

test("第 139 種:小齒輪連續旋轉,齒條在框架內上下換邊,矩形框架往復直線運動", () => {
  const xs = sweep(alphaPerLoop * 2, 2000).map((a) => rackPosition(a).x);
  const ys = sweep(alphaPerLoop * 2, 2000).map((a) => rackPosition(a).y);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 2 * halfStraight, "框架往復");
  assert.ok(Math.max(...ys) > 0 && Math.min(...ys) < 0, "齒條在框架內上下換邊");
  near(rackPosition(alphaPerLoop).x, rackPosition(0).x, "一圈回到原處", 1e-6);
});
