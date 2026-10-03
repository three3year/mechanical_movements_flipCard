// 第十三章「擒縱機構」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";

import * as m288 from "../models/fig288.js";
import * as m289 from "../models/fig289.js";
import * as m290 from "../models/fig290.js";
import * as m292 from "../models/fig292.js";
import * as m297 from "../models/fig297.js";
import * as m299 from "../models/fig299.js";

const half = (S) => 2 * S; // 擺一程的累計擺動量

/** 擺每擺一次(一程),輪前進 step;擺完一個來回前進兩倍 */
function stepsPerSwing(wheelAngle, S, step) {
  close(wheelAngle(half(S)) - wheelAngle(0), step, "擺一次前進半個齒(或一個凸柱)", 1e-9);
  close(wheelAngle(2 * half(S)) - wheelAngle(0), 2 * step, "擺一個來回前進兩倍", 1e-9);
}

test("第 288 種:回退式擒縱:擺每擺一次放走半個齒;齒落在叉瓦上後輪被推回一點(回退)", () => {
  stepsPerSwing(m288.wheelAngle, m288.SWING, m288.PITCH / 2);
  const ws = sweep(4 * m288.SWING, 400).map(m288.wheelAngle);
  const back = ws.slice(1).some((w, i) => w < ws[i] - 1e-9);
  assert.ok(back, "有回退(輪短暫倒轉)");
});

test("第 289 種:靜擊式擒縱:叉瓦面與軸 a 同心,齒抵住叉瓦的期間輪完全靜止", () => {
  stepsPerSwing((v) => -m289.wheelAngle(v), m289.SWING, m289.PITCH / 2);
  const ws = sweep(4 * m289.SWING, 400).map(m289.wheelAngle);
  assert.ok(ws.every((w, i) => i === 0 || w <= ws[i - 1] + 1e-12), "從不回退");
  const still = ws.slice(1).filter((w, i) => w === ws[i]).length;
  assert.ok(still > 100, "鎖住時完全靜止");
});

test("第 290 種:擺式擒縱:框架每擺一次,叉瓦 A、B 輪流放走半個齒", () => {
  stepsPerSwing(m290.wheelAngle, m290.SWING, m290.PITCH / 2);
});

test("第 292 種:凸柱式擒縱:凸柱交替抵在前、後叉瓦上;叉瓦為以 F 為圓心的圓弧,所以是靜擊式", () => {
  stepsPerSwing((v) => -m292.wheelAngle(v), m292.SWING, m292.STEP);
  const ws = sweep(4 * m292.SWING, 400).map(m292.wheelAngle);
  assert.ok(ws.every((w, i) => i === 0 || w <= ws[i - 1] + 1e-12), "靜擊式:從不回退");
});

test("第 297 種:燈籠輪擒縱:搖臂 A 上的叉瓦 B、C 輪流擋住銷", () => {
  stepsPerSwing(m297.wheelAngle, m297.SWING, m297.PITCH / 2);
});

test("第 299 種:老式時鐘擒縱(立軸):立軸每擺一次,冠狀輪轉過半個齒", () => {
  stepsPerSwing((v) => -m299.wheelAngle(v), m299.SWING, m299.PITCH / 2);
  assert.equal(m299.N % 2, 1, "齒數為奇數,前後兩側的齒錯開");
});
