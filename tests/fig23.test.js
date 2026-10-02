// 第 23 種:可動皮帶輪 A 由繞過導引輪 B、B 的繩懸掛,另一端掛配重 C
import { test } from "node:test";
import assert from "node:assert/strict";
import fig23 from "../models/fig23.js";

const close = (actual, expected, msg) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${msg ?? ""} 期望 ${expected},實際 ${actual}`);
const part = (id) => fig23.parts.find((p) => p.id === id);
const y = (state, id) => fig23.pose(0, state).parts[id].position[1];

test("第 23 種:零件依原文標示 A、B、B、C", () => {
  assert.equal(part("pulleyA").label, "A");
  assert.equal(part("guide1").label, "B");
  assert.equal(part("guide2").label, "B");
  assert.equal(part("counterweight").label, "C");
});

test("第 23 種:可以抬升或降下可動皮帶輪 A", () => {
  const ids = fig23.states.options.map((o) => o.id);
  assert.ok(ids.includes(fig23.states.initial));
  const heights = ids.map((id) => y(id, "pulleyA"));
  assert.equal(new Set(heights).size, ids.length, "每個狀態的高度不同");
});

test("第 23 種:A 升降時,配重 C 依繩長守恆反向移動同樣的距離", () => {
  const base = fig23.states.initial;
  for (const { id } of fig23.states.options) {
    const moveA = y(id, "pulleyA") - y(base, "pulleyA");
    const moveC = y(id, "counterweight") - y(base, "counterweight");
    close(moveC, -moveA, `狀態 ${id}`);
  }
});

test("第 23 種:主動件帶動皮帶,皮帶輪 A 與下方皮帶輪依半徑比轉動", () => {
  assert.equal(fig23.driver.part, "driver");
  const turn = (id) => fig23.pose(1).parts[id].angle - fig23.pose(0).parts[id].angle;
  const a = turn("pulleyA");
  close(a, part("driver").radius / part("pulleyA").radius, "左輪 → A 的外溝");
  close(turn("pulleyAInner"), a, "A 的兩道溝一起轉");
  close(turn("bottom"), (a * part("pulleyAInner").radius) / part("bottom").radius, "A 的內溝 → 下方皮帶輪");
});
