// 滑輪組模型的測試:拉繩端的位移與重物上升的位移比,直接對應原文的省力比
import { test } from "node:test";
import assert from "node:assert/strict";
import fig12 from "../models/fig12.js";
import fig13 from "../models/fig13.js";
import fig16 from "../models/fig16.js";
import fig17 from "../models/fig17.js";
import fig14 from "../models/fig14.js";
import fig15 from "../models/fig15.js";
import fig18 from "../models/fig18.js";
import fig19 from "../models/fig19.js";
import fig20 from "../models/fig20.js";
import fig21 from "../models/fig21.js";
import fig22 from "../models/fig22.js";

const HOISTS = [fig12, fig13, fig14, fig15, fig16, fig17, fig18, fig19, fig20, fig21, fig22];

const close = (actual, expected, msg) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${msg ?? ""} 期望 ${expected},實際 ${actual}`);

// 拉繩端 pull 時,重物上升多少、繩端實際移動多少(都由零件位置量出)
function lift(def, pull) {
  const rest = def.pose(def.driver.range[0]);
  const now = def.pose(def.driver.range[0] + pull);
  const w = def.weight ?? "weight";
  return {
    rise: now.parts[w].position[1] - rest.parts[w].position[1],
    ropeEnd: Math.hypot(...now.parts.ropeEnd.position.map((v, i) => v - rest.parts.ropeEnd.position[i])),
    readouts: Object.fromEntries(now.readouts.map((r) => [r.label, r.value])),
  };
}

test("滑輪組的主動件是繩端:位移型、有範圍、往下拉", () => {
  for (const def of HOISTS) {
    assert.equal(def.driver.part, "ropeEnd");
    assert.equal(def.driver.type, "translation");
    assert.ok(def.driver.range[0] < def.driver.range[1]);
    // 第 15 種的繩端從下方滑輪塊往上拉,其餘往下拉
    assert.deepEqual(def.driver.direction, def === fig15 ? [0, 1, 0] : [0, -1, 0]);
  }
});

test("第 12 種:簡單皮帶輪,施力端位移等於重物位移(1:1)", () => {
  const { rise, ropeEnd, readouts } = lift(fig12, 0.8);
  close(rise, 0.8);
  close(ropeEnd, 0.8);
  assert.equal(readouts["省力比"], "1 : 1");
});

test("第 13 種:下方皮帶輪可動,繩端移動是重物的兩倍", () => {
  const { rise, ropeEnd, readouts } = lift(fig13, 1.2);
  close(ropeEnd, 1.2);
  close(rise, 0.6);
  assert.equal(readouts["省力比"], "1 : 2");
});

test("讀數:顯示繩端拉了多少、重物升了多少", () => {
  const { readouts } = lift(fig13, 1.2);
  assert.equal(readouts["繩端拉了"], "12.0 cm");
  assert.equal(readouts["重物升了"], "6.0 cm");
});

test("有範圍的主動件:超出範圍的輸入會被夾住", () => {
  for (const def of HOISTS) {
    const [min, max] = def.driver.range;
    assert.deepEqual(def.pose(max + 5), def.pose(max));
    assert.deepEqual(def.pose(min - 5), def.pose(min));
  }
});

test("第 16 種:西班牙式滑輪組(雙),繩端移動是重物的五倍", () => {
  // 第一條繩:天花板 → 繞過下方滑輪 → 越過定滑輪 → 吊住中間的動滑輪;
  // 第二條繩:下方滑輪框 → 越過中間動滑輪 → 繩端。重物升 y 時中間動滑輪降 2y。
  const { rise, ropeEnd, readouts } = lift(fig16, 1.5);
  close(ropeEnd, 1.5);
  close(rise, 0.3);
  assert.equal(readouts["省力比"], "1 : 5");
});

test("第 17 種:西班牙式滑輪組(單),繩端移動是重物的三倍", () => {
  // 第一條繩:下方滑輪框 → 越過定滑輪 → 吊住動滑輪;第二條繩:下方滑輪框 → 越過動滑輪 → 繩端
  const { rise, ropeEnd, readouts } = lift(fig17, 1.2);
  close(ropeEnd, 1.2);
  close(rise, 0.4);
  assert.equal(readouts["省力比"], "1 : 3");
});

test("第 16、17 種:中間的動滑輪在重物上升時下降", () => {
  for (const [def, k] of [[fig16, 2], [fig17, 1]]) {
    const y0 = def.pose(0).parts.runner.position[1];
    const y1 = def.pose(0.6).parts.runner.position[1];
    const rise = def.pose(0.6).parts.weight.position[1] - def.pose(0).parts.weight.position[1];
    close(y0 - y1, k * rise);
  }
});

const pulleys = (def, prefix) => def.parts.filter((p) => p.kind === "pulley" && p.id.startsWith(prefix));

test("第 14 種:滑輪組,省力比為下方滑輪組皮帶輪數量的兩倍", () => {
  assert.equal(pulleys(fig14, "lower").length, 3);
  const { rise, ropeEnd, readouts } = lift(fig14, 1.8);
  close(ropeEnd, 1.8);
  close(rise, 0.3); // 2 × 3 = 6
  assert.equal(readouts["省力比"], "1 : 6");
});

test("第 15 種:懷特滑輪組,施力比為 1 比 7", () => {
  const { rise, ropeEnd, readouts } = lift(fig15, 1.4);
  close(ropeEnd, 1.4);
  close(rise, 0.2);
  assert.equal(readouts["省力比"], "1 : 7");
});

test("第 15 種:溝槽直徑依繩速成比例,一塊為 1、3、5,另一塊為 2、4、6", () => {
  const radii = (id) => fig15.parts.find((p) => p.id === id).steps.map((s) => s.radius).sort((x, y) => x - y);
  const unit = radii("upper")[0];
  assert.deepEqual(radii("upper").map((r) => Math.round(r / unit)), [1, 3, 5]);
  assert.deepEqual(radii("lower").map((r) => Math.round(r / unit)), [2, 4, 6]);
});

test("第 15 種:各溝槽一起轉,所以各段繩的移動速度不同", () => {
  // 上塊三個溝槽同轉一個角度,繩速 = 角度 × 半徑,依 1:3:5 遞增
  const a = fig15.pose(1.4).parts.upper.angle - fig15.pose(0).parts.upper.angle;
  const b = fig15.pose(1.4).parts.lower.angle - fig15.pose(0).parts.lower.angle;
  const rise = 0.2;
  const unit = Math.min(...fig15.parts.find((p) => p.id === "upper").steps.map((s) => s.radius));
  close(Math.abs(a) * unit, rise, "最小溝槽的繩速等於重物上升量");
  close(Math.abs(b) * unit, rise, "上下兩塊相對轉速相同");
});

test("第 18 種:兩個固定皮帶輪與一個可動皮帶輪,繩端移動是重物的三倍", () => {
  assert.equal(fig18.parts.filter((p) => p.kind === "pulley" && p.movable).length, 1);
  assert.equal(fig18.parts.filter((p) => p.kind === "pulley" && !p.movable).length, 2);
  const { rise, ropeEnd, readouts } = lift(fig18, 1.5);
  close(ropeEnd, 1.5);
  close(rise, 0.5);
  assert.equal(readouts["省力比"], "1 : 3");
});

test("第 22 種:每條繩一端固定、一端接下一個可動輪中心,省力比 = 2 的可動輪數量次方", () => {
  const movable = fig22.parts.filter((p) => p.kind === "pulley" && p.movable).length;
  assert.equal(movable, 3);
  const { rise, ropeEnd, readouts } = lift(fig22, 1.6);
  close(ropeEnd, 1.6);
  close(rise, 0.2); // 2³ = 8
  assert.equal(readouts["省力比"], "1 : 8");
});

test("第 19–21 種:繩端接在重物上而非定點,原文規則不適用,省力比為 2 的皮帶輪數量次方減 1", () => {
  // 第 19、20 種三個皮帶輪:2³ − 1 = 7;第 21 種兩個:2² − 1 = 3
  for (const [def, pull, ratio] of [[fig19, 1.4, 7], [fig20, 1.4, 7], [fig21, 0.9, 3]]) {
    const { rise, ropeEnd, readouts } = lift(def, pull);
    close(ropeEnd, pull);
    close(rise, pull / ratio);
    assert.equal(readouts["省力比"], "1 : " + ratio);
  }
});

test("繩長守恆:拉動繩端時,畫出的每一條繩總長不變(所以位移比就是由繩長算出的省力比)", () => {
  const length = (pts) =>
    pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]), 0);
  for (const def of HOISTS) {
    const [min, max] = def.driver.range;
    // 若省力比少算或多算一段繩,繩長會差上「範圍 ÷ 省力比」(至少 1/8);第 14 種的並排輪讓斜繩有微小誤差
    const tolerance = 0.02 * (max - min);
    for (const rope of def.parts.filter((p) => p.kind === "rope")) {
      const change = length(def.pose(max).paths[rope.id].points) - length(def.pose(min).paths[rope.id].points);
      assert.ok(Math.abs(change) < tolerance, `圖 ${def.figure} 的 ${rope.id} 長度變了 ${change.toFixed(4)}`);
    }
  }
});
