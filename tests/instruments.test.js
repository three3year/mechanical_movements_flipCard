// 第十七章「繪圖儀器」與第二十二章「儀錶與周轉輪系」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import fig500, { gauge } from "../models/fig500.js";
import * as m403 from "../models/fig403.js";
import * as m404 from "../models/fig404.js";
import * as m405 from "../models/fig405.js";
import * as m406 from "../models/fig406.js";
import * as m407 from "../models/fig407.js";
import * as m408 from "../models/fig408.js";
import * as m409 from "../models/fig409.js";
import * as m410 from "../models/fig410.js";
import * as m411 from "../models/fig411.js";

const needle = (p) => fig500.pose(p).parts.needle.angle;

test("第 500 種:壓力越大指針轉角越大,壓力為零時指針歸零", () => {
  const zero = needle(0);
  const turns = sweep(10, 20).map((p) => zero - needle(p)); // 指針順時針轉
  close(turns[0], 0, "壓力為零時指針在零點");
  for (let i = 1; i < turns.length; i++) assert.ok(turns[i] > turns[i - 1], "壓力越大轉角越大");
  close(needle(-3), zero, "超出範圍的壓力被夾住");
});

test("第 500 種:碟片 A 的變形經扇形段 e 帶動小齒輪,轉角符合齒數比", () => {
  const sector = fig500.parts.find((p) => p.id === "sector");
  const pinion = fig500.parts.find((p) => p.id === "pinion");
  const a = gauge(2);
  const b = gauge(6);
  assert.ok(b.lift > a.lift, "壓力越大碟片拱得越高");
  close(b.pinion - a.pinion, -((b.sector - a.sector) * sector.teeth) / pinion.teeth);
});

test("第 500 種:主動件是虛擬的「壓力」,不指向零件", () => {
  assert.equal(fig500.driver.type, "virtual");
  assert.equal(fig500.driver.label, "壓力");
  assert.equal(fig500.driver.mode, "balance");
});

// ── 第十七章「繪圖儀器」(第 403–411 種) ──

const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) < eps, `${msg} 期望 ${b},實際 ${a}`);

test("第 403 種:弧線繪製儀:兩根直尺靠著弦兩端的銷滑動,夾角處的鉛筆畫出通過兩銷的圓弧", () => {
  const angles = [];
  for (const phi of [m403.RANGE[0], 1.4, Math.PI / 2, 1.8, m403.RANGE[1]]) {
    const P = m403.pencil(phi);
    near(Math.hypot(P[0] - m403.CENTER[0], P[1] - m403.CENTER[1]), m403.RADIUS, 1e-9, "鉛筆在圓上");
    const [A, B] = m403.PINS;
    const a1 = Math.atan2(A[1] - P[1], A[0] - P[0]);
    const a2 = Math.atan2(B[1] - P[1], B[0] - P[0]);
    angles.push(Math.abs(a1 - a2));
  }
  for (const a of angles) near(a, angles[0], 1e-9, "兩根直尺的夾角固定(同弦所對的圓周角相等)");
});

test("第 404 種:彈性拱形桿被螺絲彎曲,外緣始終是一段圓弧;螺絲越旋,弧越彎", () => {
  const a = m404.arch(0);
  const b = m404.arch(m404.RANGE[1]);
  assert.ok(b.h > a.h && b.r < a.r, "旋緊螺絲,弧更彎(半徑變小)");
  const pts = m404.default.pose(10).paths.bar.points;
  const s = m404.arch(10);
  for (const p of pts) near(Math.hypot(p[0] - s.center[0], p[1] - s.center[1]), s.r, 1e-9, "桿上各點在同一圓上");
});

test("第 405 種:雙曲線:鉛筆畫出的各點到兩焦點的距離差為定值(2a)", () => {
  for (const t of [m405.RANGE[0], 1.3, Math.PI / 2, 1.9, m405.RANGE[1]]) {
    const P = m405.pencil(t);
    const d1 = Math.hypot(P[0] - m405.F1[0], P[1] - m405.F1[1]);
    const d2 = Math.hypot(P[0] - m405.F2[0], P[1] - m405.F2[1]);
    near(d1 - d2, 2 * m405.A, 1e-9, "距離差 = 2a");
  }
  near(m405.pencil(Math.PI / 2)[1], m405.A, 1e-12, "直尺在中心線上時,鉛筆在頂點");
});

test("第 406 種:拋物線:鉛筆到焦點的距離等於到準線的距離", () => {
  for (const x of [-2.4, -1, 0, 1.3, 2.4]) {
    const P = m406.pencil(x);
    near(Math.hypot(P[0] - m406.FOCUS[0], P[1] - m406.FOCUS[1]), m406.DIRECTRIX - P[1], 1e-9, "到焦點 = 到準線");
  }
});

test("第 407 種:尖拱:鉛筆以銷為圓心、繩長為半徑,從拱腳畫到拱頂", () => {
  for (const a of [m407.RANGE[0], 2.4, m407.RANGE[1]]) {
    const P = m407.pencil(a);
    near(Math.hypot(P[0] - m407.CENTER[0], P[1] - m407.CENTER[1]), m407.RADIUS, 1e-9, "繩長不變(圓弧)");
  }
  near(m407.pencil(m407.RANGE[0])[0], 0, 1e-9, "拱頂在跨度的正中(等邊尖拱)");
});

test("第 408 種:中心引導器靠著兩根銷推動,葉片的畫線邊始終指向同一個會聚點", () => {
  for (const psi of sweep(m408.RANGE[1], 8, m408.RANGE[0])) {
    const pose = m408.default.pose(psi);
    const { J, angle } = m408.joint(psi);
    // 畫線邊的延長線通過會聚點
    const toV = [m408.V[0] - J[0], m408.V[1] - J[1]];
    near(Math.cos(angle) * toV[1] - Math.sin(angle) * toV[0], 0, 1e-9, "畫線邊的延長線通過會聚點");
    // 兩腿的背面靠著兩根銷
    for (const [leg, pin] of [["legA", m408.PINS[0]], ["legB", m408.PINS[1]]]) {
      const a = pose.parts[leg].angle;
      near(Math.cos(a) * (pin[1] - J[1]) - Math.sin(a) * (pin[0] - J[0]), 0, 1e-9, `${leg} 的背面通過銷`);
    }
    // 腿與葉片的夾角在接頭處鎖住
    near(pose.parts.legA.angle - pose.parts.blade.angle, m408.LEGS[0], 1e-12, "腿與葉片的夾角不變");
  }
});

test("第 409 種:比例圓規兩組尖端的距離之比,等於兩組尖端到樞軸的距離之比", () => {
  for (const [state, k] of [["same", 1], ["double", 2], ["triple", 3]]) {
    const { a, b } = m409.arms(state);
    close(b / a, k, `${state}:下尖到樞軸 / 上尖到樞軸`);
    for (const half of sweep(m409.RANGE[1], 4, m409.RANGE[0])) {
      const s = m409.spans(half, state);
      close(s.lower / s.upper, b / a, "下兩尖距 / 上兩尖距 = 到樞軸的距離比");
    }
  }
  // 兩腳交叉在樞軸上:兩腳的尖端到樞軸(原點)的距離就是 a、b
  const pose = m409.default.pose(0.3, "double");
  const { a } = m409.arms("double");
  const top = (p) => [p.position[0] - (m409.LENGTH / 2) * Math.sin(p.angle), p.position[1] + (m409.LENGTH / 2) * Math.cos(p.angle)];
  close(Math.hypot(...top(pose.parts.legA)), a, "上尖到樞軸的距離");
  assert.ok(top(pose.parts.legA)[0] > 0 && top(pose.parts.legB)[0] < 0, "兩腳交叉:上尖分在兩邊");
});

test("第 410 種:等分規無論兩夾頰相距多遠,尖頂始終在兩夾頰的正中間", () => {
  const gaps = new Set();
  for (const g of sweep(m410.RANGE[1], 24, m410.RANGE[0])) {
    const s = m410.gauge(g);
    near(s.tip[0], (s.jaws[0] + s.jaws[1]) / 2, 1e-12, "尖頂在兩夾頰的中間");
    near(Math.hypot(s.tip[0] - s.a[0], s.tip[1] - s.a[1]), m410.LINK, 1e-12, "短桿長不變");
    near(Math.hypot(s.tip[0] - s.b[0], s.tip[1] - s.b[1]), m410.LINK, 1e-12, "兩根短桿等長");
    gaps.add((s.jaws[1] - s.jaws[0]).toFixed(2));
  }
  assert.ok(gaps.size > 5, "拉到斜邊時夾頰的間距跟著改變");
});

test("第 411 種:自動記錄水平儀:輪子的圓周等於底邊;平地上擺把底邊二等分,斜面上擺朝一邊偏離", () => {
  close(2 * Math.PI * m411.WHEEL, m411.BASE, "輪子的圓周 = 三角形的底邊");
  const flat = m411.carriage(m411.RANGE[0]);
  near(flat.tilt, 0, 1e-9, "平地上托架水平");
  near(flat.offset, 0, 1e-9, "平地上擺把底邊二等分");
  // 推上坡、再推下坡:擺分別朝後、朝前偏
  const offsets = sweep(m411.RANGE[1], 60, m411.RANGE[0]).map((u) => m411.carriage(u));
  const up = offsets.reduce((m, c) => (c.tilt > m.tilt ? c : m));
  const down = offsets.reduce((m, c) => (c.tilt < m.tilt ? c : m));
  assert.ok(up.tilt > 0.1 && up.offset < -0.1, "上坡時擺朝後偏離中心");
  assert.ok(down.tilt < -0.1 && down.offset > 0.1, "下坡時擺朝前偏離中心");
  // 擺始終鉛直
  for (const c of [flat, up, down]) assert.equal(m411.default.pose(c.u).parts.pendulum.angle, 0);
  // 在平地上推過一個底邊長,輪子轉一圈,鼓輪跟著轉(由輪子帶動)
  const a = m411.carriage(m411.RANGE[0]);
  const b = m411.carriage(m411.RANGE[0] + m411.BASE * 0.1);
  near(a.wheel - b.wheel, (2 * Math.PI) * 0.1, 1e-6, "走過底邊的十分之一,輪子轉十分之一圈");
  near((a.drum - b.drum) / (a.wheel - b.wheel), m411.RATIO, 1e-12, "鼓輪由托架輪帶動");
});
