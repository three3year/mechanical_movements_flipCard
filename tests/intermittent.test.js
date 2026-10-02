// 第三章「間歇與棘輪運動」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import fig75, { motion, wheelSpec } from "../models/fig075.js";
import { ratchetRadius } from "../models/ratchets.js";

const PITCH = (2 * Math.PI) / wheelSpec.teeth;
const STROKE = fig75.driver.cycle[1];
const wheel = (v) => fig75.pose(v).parts.wheelA.angle;

test("第 75 種:C 往復一次,推程中輪 A 前進固定齒數(兩齒),回程中 A 不動", () => {
  for (const k of [0, 1, 3]) {
    const start = 2 * k * STROKE;
    close(wheel(start) - wheel(start + STROKE), 2 * PITCH, `第 ${k} 次推程前進兩齒`);
    const back = sweep(start + 2 * STROKE, 10, start + STROKE).map(wheel);
    for (const a of back) close(a, back[0], "回程中 A 轉角不變");
  }
  assert.ok(wheel(STROKE) < wheel(0), "A 依原圖箭頭順時針前進");
});

test("第 75 種:C 來回多次,A 的轉角只往前、不倒退(間歇、單向)", () => {
  const angles = sweep(STROKE * 9, 400).map(wheel);
  for (let i = 1; i < angles.length; i++) assert.ok(angles[i] <= angles[i - 1] + 1e-12, "A 不倒轉");
  close(angles[0] - angles[angles.length - 1], 2 * PITCH * 5, "九個單程中有五次推程");
});

test("第 75 種:棘爪 B 與止回爪的爪尖始終靠在輪面上,不穿進輪裡", () => {
  for (const v of sweep(STROKE * 4, 120)) {
    const { a } = motion(v);
    const pose = fig75.pose(v).parts;
    for (const id of ["pawlB", "click"]) {
      const p = pose[id];
      const pivot = p.position ?? fig75.parts.find((q) => q.id === id).center;
      const length = id === "pawlB" ? 0.97 : 0.8;
      const tip = [pivot[0] + length * Math.cos(p.angle), pivot[1] + length * Math.sin(p.angle)];
      const surface = ratchetRadius(wheelSpec, Math.atan2(tip[1], tip[0]) - a);
      const gap = Math.hypot(...tip) - surface;
      assert.ok(gap > -1e-6 && gap < 0.02, `${id} 在主動量 ${v.toFixed(3)} 時離輪面 ${gap}`);
    }
  }
});

import { counter, starPitch, pinPeriod } from "../models/fig063.js";
import { hollowAt as hollow64, period as period64 } from "../models/fig064.js";
import { hollowAt as hollow66 } from "../models/fig066.js";
import { hollowAt as hollow67, centerOfMass } from "../models/fig067.js";
import { register, pitch as pitch76 } from "../models/fig076.js";
import { wormWheel, WHEEL_TEETH } from "../models/worm-jump.js";

test("第 63 種:每通過一根插銷,落板被抬起後猛然落下,星形輪快速轉過一格", () => {
  const before = counter(pinPeriod * 0.5);
  const after = counter(pinPeriod * 1.5);
  close(after.star - before.star, -starPitch, "每根插銷轉一格");
  const lifting = sweep(pinPeriod * 0.7, 20, pinPeriod * 0.15).map((v) => counter(v).star);
  for (const s of lifting) close(s, lifting[0], "落板被抬起時星形輪不動");
  assert.ok(counter(pinPeriod * 0.6).height > 0.5, "插銷把落板抬起");
});

test("第 64 種:蝸輪軸上的銷推著凸輪走,到臨界點凸輪突然往前掉落,再停住等銷追上", () => {
  const wheel = (v) => v;
  const angles = sweep(period64 * 3, 3000).map((v) => hollow64(wheel(v)));
  let jumps = 0;
  let still = 0;
  for (let i = 1; i < angles.length; i++) {
    const d = angles[i] - angles[i - 1];
    assert.ok(d >= -1e-12, "只往前");
    if (d > 0.1) jumps++;
    if (Math.abs(d) < 1e-12) still++;
  }
  assert.equal(jumps, 3, "每圈掉落一次");
  assert.ok(still > 0, "掉落後停住");
});

test("第 64、66、67 種:蝸桿每轉一圈,蝸輪 B 轉一齒", () => {
  close(wormWheel(2 * Math.PI) - wormWheel(0), (2 * Math.PI) / WHEEL_TEETH);
});

const B0 = wormWheel(0); // 蝸輪的起始轉角

test("第 66 種:搖臂上的重物 D 被推到頂端後自己落到下方", () => {
  // 推的階段把重物從正下方送到正上方
  close(hollow66(B0 + Math.PI + 0.001) - hollow66(B0 + Math.PI), 0.001, "被推時跟著銷走", 1e-9);
  close(hollow66(B0), -Math.PI / 2, "剛落定時在正下方");
  close(hollow66(B0 + 2 * Math.PI - 1e-9), Math.PI / 2, "推到正上方", 1e-6);
});

test("第 67 種:擺錘 E 的重心被推到頂端後翻落到下方", () => {
  close(Math.sin(centerOfMass(hollow67(B0))), -1, "落定時重心在正下方");
  close(Math.sin(centerOfMass(hollow67(B0 + 2 * Math.PI - 1e-9))), 1, "推到頂端", 1e-6);
});

test("第 76 種:大輪每轉一圈,凸柱 D 撞擊撥爪一次,棘輪 A 轉動一齒;撥爪回落時 A 不動", () => {
  close(register(2 * Math.PI).a - register(0).a, pitch76, "一圈一齒");
  close(register(5 * 2 * Math.PI).a - register(0).a, 5 * pitch76);
  const back = sweep(2 * Math.PI * 0.9, 20, 2 * Math.PI * 0.11).map((v) => register(v).a);
  for (const a of back) close(a, back[0], "撥爪回落與等待時 A 不動");
});
