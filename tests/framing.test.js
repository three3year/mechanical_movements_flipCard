// 取景的取樣(viewer/framing.js):外框要容納主動量各處的姿勢。三種主動件的規則一致:在範圍、一個週期或一個進程內均勻取樣。
import { test } from "node:test";
import assert from "node:assert/strict";
import { framingValues, framingSpan, FRAMING_SEGMENTS } from "../viewer/framing.js";

const close = (a, b) => Math.abs(a - b) < 1e-9;
const steps = (values) => values.slice(1).map((v, i) => v - values[i]);
const evenly = (values) => steps(values).every((s) => close(s, steps(values)[0]));

test("有範圍的主動件:兩端都在取樣裡、樣本等距,再加上目前值", () => {
  const driver = { part: "lever", type: "rotation", range: [-0.6, 1.4] };
  const values = framingValues(driver, 0.3, 8);
  const grid = values.slice(0, -1);
  assert.equal(grid.length, 9);
  assert.ok(close(grid[0], -0.6) && close(grid.at(-1), 1.4), `取樣 ${grid}`);
  assert.ok(evenly(grid), `間隔不等:${steps(grid)}`);
  assert.equal(values.at(-1), 0.3);
  assert.deepEqual(framingSpan(driver, 0.3), [-0.6, 1.4]);
});

test("一直轉的轉動主動件:從目前值起涵蓋一圈", () => {
  const values = framingValues({ part: "crank", type: "rotation" }, 2, 12);
  assert.equal(values.length, 13);
  assert.ok(close(values[0], 2) && close(values.at(-1), 2 + Math.PI * 2), `取樣 ${values[0]}–${values.at(-1)}`);
  assert.ok(evenly(values));
});

test("自動播放往回轉的(speed 為負):從目前值往回涵蓋一圈", () => {
  const values = framingValues({ part: "pinion", type: "rotation", speed: -0.8 }, 0, 8);
  assert.ok(close(values[0], 0) && close(values.at(-1), -Math.PI * 2), `取樣 ${values[0]}–${values.at(-1)}`);
  assert.ok(evenly(values));
});

test("狀態讓自動播放反向(play −1)時往回涵蓋一圈;狀態讓主動件停住(play 0)時照原本的方向", () => {
  const crank = { part: "crank", type: "rotation" };
  assert.ok(close(framingValues(crank, 0, 8, -1).at(-1), -Math.PI * 2));
  assert.ok(close(framingValues({ ...crank, speed: -0.8 }, 0, 8, -1).at(-1), Math.PI * 2));
  assert.ok(close(framingValues(crank, 0, 8, 0).at(-1), Math.PI * 2));
});

test("一直轉的主動件宣告了週期(period)時,涵蓋一個週期:機構轉好幾圈才回到原狀的(第 119 種齒條一個往復要小齒輪轉五圈)", () => {
  const driver = { part: "pinion", type: "rotation", speed: -1.4, period: 10 * Math.PI };
  const values = framingValues(driver, 0, 8);
  assert.ok(close(values[0], 0) && close(values.at(-1), -10 * Math.PI), `取樣 ${values[0]}–${values.at(-1)}`);
  assert.ok(evenly(values));
});

test("往復(cycle)的主動件:涵蓋一個來回(去程與回程,棘爪之類的姿勢兩程不同)", () => {
  const values = framingValues({ part: "rod", type: "translation", cycle: [0, 0.5] }, 0, 10);
  assert.ok(close(values[0], 0) && close(values.at(-1), 1), `取樣 ${values[0]}–${values.at(-1)}`);
  assert.ok(evenly(values));
});

test("進程型的虛擬主動件:從目前值起涵蓋一個進程(範圍是進程的長度,不是夾住的範圍)", () => {
  const driver = { type: "virtual", mode: "progress", label: "時間", range: [0, 3] };
  const values = framingValues(driver, 0.5, 6);
  assert.ok(close(values[0], 0.5) && close(values.at(-1), 3.5), `取樣 ${values[0]}–${values.at(-1)}`);
  assert.ok(evenly(values));
  assert.deepEqual(framingSpan(driver, 0.5), [0.5, 3.5]);
});

test("沒給段數時用預設段數", () => {
  assert.equal(framingValues({ part: "crank", type: "rotation" }, 0).length, FRAMING_SEGMENTS + 1);
  assert.ok(Number.isInteger(FRAMING_SEGMENTS) && FRAMING_SEGMENTS >= 4);
});
