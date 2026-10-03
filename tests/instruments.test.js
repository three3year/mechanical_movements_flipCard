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
