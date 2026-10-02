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
