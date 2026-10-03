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
import * as m291 from "../models/fig291.js";
import * as m293 from "../models/fig293.js";
import fig294 from "../models/fig294.js";
import fig295 from "../models/fig295.js";
import * as cyl from "../models/cylinder-escapement.js";
import * as m296 from "../models/fig296.js";
import * as m298 from "../models/fig298.js";
import fig300 from "../models/fig300.js";
import fig301 from "../models/fig301.js";
import * as twin from "../models/twin-wheel-escapement.js";
import * as m302 from "../models/fig302.js";
import * as m303 from "../models/fig303.js";
import * as m304 from "../models/fig304.js";
import * as m305 from "../models/fig305.js";

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

test("第 291 種:天文台計時器擒縱:擺輪往箭頭方向擺時凸柱壓過細彈簧,A 不動;擺回來時抬起 A 與擋止 d,放走一齒", () => {
  const S = m291.SWING;
  const fwd = sweep(2 * S, 100).map((v) => m291.chronometer(v));
  assert.ok(fwd.every((c) => c.lift === 0 && c.wheel === 0), "往箭頭方向擺:A 不動、輪不動");
  const back = sweep(4 * S, 100, 2 * S).map((v) => m291.chronometer(v));
  assert.ok(back.some((c) => c.lift > 0), "擺回來時 A 被抬起");
  close(m291.chronometer(4 * S).wheel, -m291.PITCH, "擺輪來回一次,擒縱輪轉過一齒", 1e-9);
});

test("第 293 種:雙合式擒縱:叉瓦 B 每次往一個方向擺時接收一個衝擊,輪每次放走一齒", () => {
  const S = m293.SWING;
  close(m293.duplex(2 * S).wheel, 0, "往一個方向擺時輪不動", 1e-12);
  close(m293.duplex(4 * S).wheel, -m293.PITCH, "來回一次轉一齒", 1e-9);
});

test("第 294–295 種:圓筒式擒縱(同一機構的立體圖與放大圖):擺輪每擺一次,擒縱輪前進半個齒", () => {
  for (const v of [0, 1.3, 5]) assert.deepEqual(fig294.pose(v).parts, fig295.pose(v).parts, "兩圖的姿勢一致");
  assert.notDeepEqual(fig294.view.direction, fig295.view.direction, "初始視角不同");
  stepsPerSwing((v) => -cyl.cylinder(v).wheel, cyl.SWING, cyl.PITCH / 2);
});

test("第 296 種:槓桿式擒縱:擺輪的銷在每次擺動的中途進入凹槽 E,撥動槓桿,叉瓦放走半個齒", () => {
  const { WINDOW } = m296.geometry;
  const S = m296.SWING;
  const levers = sweep(2 * S, 200).map((v) => m296.lever(v));
  const free = levers.filter((l) => Math.abs(l.balance) > WINDOW + 1e-9).map((l) => l.lever);
  assert.ok(free.every((a) => Math.abs(Math.abs(a) - Math.abs(free[0])) < 1e-12), "銷不在凹槽時槓桿停在擋止上");
  assert.ok(Math.sign(levers[0].lever) !== Math.sign(levers[levers.length - 1].lever), "擺過一次,槓桿換到另一邊");
  stepsPerSwing((v) => -m296.lever(v).wheel, S, m296.PITCH / 2);
});

test("第 298 種:老式錶用擒縱(立軸):擺輪每擺一次,冠狀輪轉過半個齒,經小齒輪帶動左下的輪", () => {
  stepsPerSwing((v) => m298.verge(v).crown, m298.SWING, m298.PITCH / 2);
  const r = m298.verge(4 * m298.SWING);
  close(r.contrate / r.crown, m298.PINION.teeth / m298.CONTRATE.teeth, "齒數比", 1e-12);
});

test("第 300–301 種:同一機構的前視與側視圖;叉瓦交替地由兩個擒縱輪之一的齒作用,每擺一次輪轉過半個齒", () => {
  for (const v of [0, 0.4, 2]) assert.deepEqual(fig300.pose(v).parts, fig301.pose(v).parts, "兩圖的姿勢一致");
  assert.notDeepEqual(fig300.view.direction, fig301.view.direction, "初始視角不同");
  stepsPerSwing((v) => twin.twin(v).wheel, twin.SWING, twin.PITCH / 2);
});

test("第 302 種:擺輪式擒縱:擺輪 C 來回擺,叉瓦 A、B 輪流放走擒縱輪 D 的齒", () => {
  stepsPerSwing((v) => m302.balance(v).crown, m302.SWING, m302.PITCH / 2);
});

test("第 303 種:靜擊式擺鐘擒縱:叉瓦面與擺動軸同心,不會產生回退", () => {
  const ws = sweep(4 * m303.SWING, 400).map((v) => m303.deadbeat(v).wheel);
  assert.ok(ws.every((w, i) => i === 0 || w <= ws[i - 1] + 1e-12), "不回退");
  stepsPerSwing((v) => -m303.deadbeat(v).wheel, m303.SWING, m303.PITCH / 2);
});

test("第 304 種:銷輪式擒縱:兩個叉瓦夾著銷,擺每擺一次輪轉過半個銷距", () => {
  stepsPerSwing((v) => -m304.pinWheel(v).wheel, m304.SWING, m304.PITCH / 2);
});

test("第 305 種:單銷式擒縱:擺每擺動一次,擒縱輪(帶一根偏心銷的小圓盤)旋轉半圈", () => {
  stepsPerSwing((v) => m305.singlePin(v).disc, m305.SWING, Math.PI);
});
