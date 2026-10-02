// 第十章「棘輪與擒縱」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { sweep } from "./helpers.js";
import { placeOutline, polygonsOverlap } from "../models/contact.js";
import { ratchetObstacles } from "../models/ratchets.js";
import fig233, { barAngle, leverAngle, pinPolygons, barOutline } from "../models/fig233.js";
import fig240, { WHEEL, DROPS, STOP_OUTLINES, stopAngle } from "../models/fig240.js";

const PIN_PERIOD = (2 * Math.PI) / 16;

test("第 233 種:燈籠輪逆時針轉時,平桿擋止被銷頂起、滑過,不穿進銷", () => {
  for (const w of sweep(2 * PIN_PERIOD, 60)) {
    const placed = placeOutline(barOutline.outline, barOutline.pivot, barAngle(w));
    assert.ok(!pinPolygons(w).some((p) => polygonsOverlap(placed, p)), `轉角 ${w}`);
  }
  const angles = sweep(0.3 + PIN_PERIOD, 40, 0.3).map(barAngle);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.05, "平桿隨銷起落");
});

test("第 233 種:倒轉時被平桿擋住,只能轉回到最近的擋止處", () => {
  const { backstop } = fig233.driver;
  for (const v of sweep(3, 30)) {
    const stop = backstop(v);
    assert.ok(stop <= v + 1e-9 && v - stop < PIN_PERIOD + 1e-9, "擋止處在一個銷距之內");
  }
  // 擋止處正是平桿落下的那一刻:落下前桿被頂得較高
  const s = fig233.driver.initial;
  assert.ok(barAngle(s - 0.004) < barAngle(s + 0.004) - 0.02, "落下前平桿較高(轉角較小)");
});

test("第 233 種:圓盤端頭的槓桿只定位、不擋,兩個方向都被銷頂起", () => {
  const angles = sweep(PIN_PERIOD, 40).map(leverAngle);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.02);
});

test("第 240 種:棘輪逆時針轉時,三種擋止爪都靠在輪上、不穿進齒裡", () => {
  for (const w of sweep(2 * ((2 * Math.PI) / WHEEL.teeth), 40)) {
    const wheel = ratchetObstacles(WHEEL, w);
    for (const id of Object.keys(STOP_OUTLINES)) {
      const s = STOP_OUTLINES[id];
      const placed = placeOutline(s.outline, s.pivot, stopAngle(id, w));
      assert.ok(!wheel.some((o) => polygonsOverlap(placed, o)), `${id} 在轉角 ${w}`);
    }
  }
});

test("第 240 種:同一主動量下,各擋止爪各自在落進齒間的位置擋住倒轉", () => {
  const period = (2 * Math.PI) / WHEEL.teeth;
  for (const [id, drop] of Object.entries(DROPS)) {
    const before = stopAngle(id, drop - period * 0.1);
    const after = stopAngle(id, drop + 0.002);
    assert.ok(Math.abs(after - before) > 0.02, `${id} 在擋止處落下`);
  }
  const { backstop } = fig240.driver;
  for (const v of sweep(2, 25)) {
    const stop = backstop(v);
    assert.ok(stop <= v + 1e-9 && v - stop < period, "往回最多轉到最近的擋止處");
    const nearest = Math.max(...Object.values(DROPS).map((d) => d + Math.floor((v - d) / period + 1e-9) * period));
    assert.ok(Math.abs(stop - nearest) < 1e-9);
  }
});

import fig227 from "../models/fig227.js";
import fig228 from "../models/fig228.js";
import fig229 from "../models/fig229.js";
import { close } from "./helpers.js";

for (const [def, pins] of [[fig227, 1.82], [fig228, 2.02], [fig229, 2.3]]) {
  test(`第 ${def.figure} 種:轉動皮帶輪,鍊條跟著走——行進量等於鏈節銷所在圓上轉過的弧長`, () => {
    const phase = (a) => def.pose(a).paths.chain.phase;
    close(phase(0.8) - phase(0), -0.8 * pins, "逆時針轉時鍊條往左端走(右側上升)");
    assert.notEqual(phase(1), phase(0), "鍊條行進相位隨主動量改變");
    assert.equal(def.parts.find((p) => p.id === "chain").kind, "chain", "鍊條是會運動的線狀零件");
  });
}
