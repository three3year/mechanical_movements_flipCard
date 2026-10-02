// 第 23 種:把旋轉運動傳到可動皮帶輪(圖底部的輪)。皮帶繞過張緊輪 A,
// A 由繞過導引輪 B、B 的繩懸掛、另一端掛配重 C,底部輪升降時 A 自動跟著升降,讓皮帶保持張力。
import { test } from "node:test";
import assert from "node:assert/strict";
import fig23 from "../models/fig23.js";

const close = (actual, expected, msg, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `${msg ?? ""} 期望 ${expected},實際 ${actual}`);
const part = (id) => fig23.parts.find((p) => p.id === id);
const y = (state, id) => fig23.pose(0, state).parts[id].position[1];
const length = (pts) =>
  pts.reduce((sum, p, i) => sum + Math.hypot(...p.map((v, k) => v - pts[(i + 1) % pts.length][k])), 0);

test("第 23 種:零件依原文標示 A、B、B、C", () => {
  assert.equal(part("pulleyA").label, "A");
  assert.equal(part("guide1").label, "B");
  assert.equal(part("guide2").label, "B");
  assert.equal(part("counterweight").label, "C");
});

test("第 23 種:可以抬升或降下圖底部的可動皮帶輪", () => {
  const ids = fig23.states.options.map((o) => o.id);
  assert.ok(ids.includes(fig23.states.initial));
  const heights = ids.map((id) => y(id, "movable"));
  assert.equal(new Set(heights).size, ids.length, "每個狀態的高度不同");
});

test("第 23 種:可動皮帶輪升降時,張緊輪 A 跟著同向升降,皮帶總長不變(張力均勻)", () => {
  const base = fig23.states.initial;
  const belt = (state) => length(fig23.pose(0, state).paths.belt.points);
  for (const { id } of fig23.states.options) {
    close(belt(id), belt(base), `狀態 ${id} 的皮帶長度`, 1e-4);
    const moveBottom = y(id, "movable") - y(base, "movable");
    const moveA = y(id, "pulleyA") - y(base, "pulleyA");
    if (moveBottom !== 0) assert.ok(Math.sign(moveA) === Math.sign(moveBottom), "底部輪抬升時皮帶變鬆,A 被配重拉上去");
  }
});

test("第 23 種:A 升降時,配重 C 依繩長守恆反向移動同樣的距離", () => {
  const base = fig23.states.initial;
  for (const { id } of fig23.states.options) {
    const moveA = y(id, "pulleyA") - y(base, "pulleyA");
    const moveC = y(id, "counterweight") - y(base, "counterweight");
    close(moveC, -moveA, `狀態 ${id}`);
  }
});

test("第 23 種:主動件帶動同一條皮帶,可動皮帶輪依半徑比同向轉動", () => {
  assert.equal(fig23.driver.part, "driver");
  const turn = (id) => fig23.pose(1).parts[id].angle - fig23.pose(0).parts[id].angle;
  close(turn("movable"), part("driver").radius / part("movable").radius);
});
