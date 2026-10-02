// 第十九章「水車與泵」:斷言對應原文;流體示意只驗它是主動量的函式、只在路徑上
import { test } from "node:test";
import assert from "node:assert/strict";
import { sweep } from "./helpers.js";
import { distanceToPath } from "../models/flow.js";
import fig430, { INFLOW, SPILL } from "../models/fig430.js";

test("第 430 種:上射式水車,進程增加時水車依原圖箭頭順時針轉", () => {
  const a = fig430.pose(0.1).parts.wheel.angle;
  const b = fig430.pose(0.2).parts.wheel.angle;
  assert.ok(b < a);
  assert.equal(fig430.driver.type, "virtual");
  assert.equal(fig430.driver.mode, "progress");
  assert.equal(fig430.driver.label, "進程");
});

test("第 430 種:以水重驅動——下降側(右)的水斗存量大於上升側(左)", () => {
  for (const progress of sweep(1, 12)) {
    const pose = fig430.pose(progress).parts;
    let right = 0;
    let left = 0;
    for (const [id, p] of Object.entries(pose)) {
      if (!id.startsWith("water")) continue;
      if (p.position[0] > 0.2) right += p.level;
      if (p.position[0] < -0.2) left += p.level;
    }
    assert.ok(right > 2 && left === 0, `進程 ${progress}:右 ${right},左 ${left}`);
  }
});

test("第 430 種:流體示意的點隨進程移動,且只在水的路徑上", () => {
  const at = (progress) => fig430.pose(progress).flows;
  const a = at(0.31);
  const b = at(0.33);
  assert.notDeepEqual(a[0].points, b[0].points);
  for (const progress of sweep(2, 9)) {
    const [inflow, spill] = at(progress);
    for (const p of inflow.points) assert.ok(distanceToPath(INFLOW, p) < 1e-9);
    for (const p of spill.points) assert.ok(distanceToPath(SPILL, p) < 1e-9);
    assert.ok(inflow.points.length > 5 && spill.points.length > 3);
  }
});
