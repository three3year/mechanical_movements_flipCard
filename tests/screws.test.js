// 第五章「螺旋機構」:斷言對應原文(螺帽每轉一圈前進一個螺距)
import { test } from "node:test";
import assert from "node:assert/strict";
import { close } from "./helpers.js";
import { nutHeight, pitch as p102 } from "../models/fig102.js";
import { sliderX, pitch as p103 } from "../models/fig103.js";
import { lathe, teeth as teeth104, radius as r104 } from "../models/fig104.js";
import fig105, { pitch as p105 } from "../models/fig105.js";
import { cutting, lead as lead109 } from "../models/fig109.js";
import { differential, pitches as p111 } from "../models/fig111.js";

const TAU = 2 * Math.PI;

test("第 102 種:螺栓與螺帽——螺帽每轉一圈沿螺栓前進一個螺距(圓周運動產生直線運動)", () => {
  close(nutHeight(TAU) - nutHeight(0), p102);
  close(nutHeight(3 * TAU) - nutHeight(0), 3 * p102);
});

test("第 103 種:螺桿旋轉使滑塊直線移動,每轉一圈移動一個螺距", () => {
  close(Math.abs(sliderX(TAU) - sliderX(0)), p103);
});

test("第 104 種:螺桿旋轉把旋轉傳給輪(每轉一圈輪轉一齒);輪旋轉則沿螺紋滾動、帶滑塊直線移動", () => {
  close(Math.abs(lathe(0.5, "screw").screw - lathe(0, "screw").screw), (0.5 * teeth104), "螺桿轉 N 倍輪的轉角");
  close(lathe(0.6, "wheel").x - lathe(0, "wheel").x, 0.6 * r104, "滑塊移動 = 節圓上轉過的弧長");
  assert.equal(lathe(0.6, "wheel").screw, 0, "此時螺桿不轉");
});

test("第 105 種:螺桿式壓印機,手柄每轉一圈壓頭下降一個螺距", () => {
  const ram = (a) => fig105.pose(a).parts.ram.position[1];
  close(ram(0) - ram(TAU), p105);
});

test("第 109 種:導螺桿使刀具均勻直線移動;更換末端的輪,切出的螺距跟著改變", () => {
  const a = cutting(0, "equal");
  const b = cutting(TAU, "equal");
  close(a.y - b.y, lead109, "刀具每圈移動一個導螺距");
  close(cutting(0, "equal").cutPitch, lead109, "等大輪:切出的螺距 = 導螺距");
  close(cutting(0, "double").cutPitch, lead109 / 2, "換輪 2:1:螺距減半");
  // 切出的螺距 = 刀具移動量 ÷ 胚料轉的圈數
  const turns = Math.abs(cutting(TAU, "double").blank - cutting(0, "double").blank) / TAU;
  close(lead109 / turns, cutting(0, "double").cutPitch, "由運動算出的螺距", 1e-9);
});

test("第 111 種:千分螺桿——外側空心螺桿每轉一圈,模具只移動兩者螺距的差", () => {
  close(differential(TAU).inner - differential(0).inner, p111.coarse - p111.fine);
  close(differential(TAU).outer, p111.coarse, "外側螺桿前進一個粗螺距");
});

import { rodX as rod106, amp as amp106 } from "../models/fig106.js";
import { rodX as rod107, waves as waves107 } from "../models/fig107.js";
import { slideY, travel as travel108, pitch as pitch108 } from "../models/fig108.js";
import { traverse, pitch as pitch110 } from "../models/fig110.js";
import { drillAngle, lead as lead112 } from "../models/fig112.js";

// 往返次數:位移方向改變的次數 ÷ 2
const strokes = (fn, span, n = 2000) => {
  const xs = Array.from({ length: n + 1 }, (_, i) => fn((span * i) / n));
  let turns = 0;
  for (let i = 2; i < xs.length; i++) if ((xs[i] - xs[i - 1]) * (xs[i - 1] - xs[i - 2]) < 0) turns++;
  return turns / 2;
};

test("第 106 種:開槽凸輪均勻旋轉,桿做均勻的往復直線運動(每轉一圈往返一次)", () => {
  assert.equal(strokes(rod106, 4 * TAU), 4);
  // 銷在圓筒局部角 π/2 − θ;θ 在 2.9–3.5 之間是一程的中段
  const rate = (rod106(3.0) - rod106(2.9)) / 0.1;
  close((rod106(3.5) - rod106(3.4)) / 0.1, rate, "中段等速", 1e-9);
  close(Math.max(...Array.from({ length: 721 }, (_, i) => rod106((i / 720) * TAU))), amp106, "行程兩端", 1e-3);
});

test("第 107 種:溝彎繞成幾個波,圓筒每轉一圈桿往返幾次", () => {
  assert.equal(strokes(rod107, TAU), waves107);
});

test("第 108 種:兩道反向的螺旋溝使尖點從圓筒一端均勻橫移到另一端,再自動回來", () => {
  const ys = Array.from({ length: 3001 }, (_, i) => slideY((12 * TAU * i) / 3000));
  close(Math.max(...ys) - Math.min(...ys), travel108, "走完整個長度", 1e-3);
  assert.equal(strokes(slideY, 12 * TAU), 2, "來回各一次");
  close(Math.abs(slideY(-5) - slideY(-5 - TAU)), pitch108, "每圈移動一個螺距", 1e-9);
});

test("第 110 種:槓桿扳向右或向左,換一個半螺帽嚙合,心軸朝相反方向均勻橫移", () => {
  close(traverse(TAU, "right"), pitch110);
  close(traverse(TAU, "left"), -pitch110);
});

test("第 112 種:波斯鑽——螺帽沿快螺紋上下拉動,柄部交替向右、向左旋轉;螺帽移動一個導程,柄轉一圈", () => {
  close(drillAngle(lead112) - drillAngle(0), TAU);
  assert.ok(drillAngle(0.3) - drillAngle(0) > 0 && drillAngle(0) - drillAngle(0.3) < 0, "上拉與下推轉向相反");
});
