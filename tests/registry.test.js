// 模型登記表的完整性:第一章「皮帶與滑輪」圖 1–23 都有模型,且每份定義都符合繪圖層需要的形狀
import { test } from "node:test";
import assert from "node:assert/strict";
import { registry, models } from "../models/registry.js";

const PATH_KINDS = new Set(["belt", "rope", "rod"]);

test("第一章圖 1–23 都有登記的模型", () => {
  for (let figure = 1; figure <= 23; figure++) assert.ok(registry.has(figure), `圖 ${figure} 沒有模型`);
});

test("登記表以模型的圖號為鍵,沒有重複", () => {
  assert.equal(registry.size, models.length);
  for (const [figure, def] of registry) assert.equal(def.figure, figure);
});

for (const def of models) {
  test(`圖 ${def.figure}:主動件、狀態與範圍的定義有效`, () => {
    const ids = def.parts.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length, "零件 id 不重複");
    assert.ok(ids.includes(def.driver.part), "主動件指向存在的零件");
    assert.ok(["rotation", "translation"].includes(def.driver.type));
    if (def.driver.range) assert.ok(def.driver.range[0] < def.driver.range[1], "範圍 min < max");
    if (def.driver.type === "translation") assert.ok(def.driver.range && def.driver.direction);
    if (def.states) {
      const options = def.states.options.map((o) => o.id);
      assert.ok(options.includes(def.states.initial), "預設狀態在狀態清單中");
      assert.ok(def.states.options.every((o) => o.label));
    }
  });

  test(`圖 ${def.figure}:每個狀態的姿勢都涵蓋所有皮帶與繩,且只指向存在的零件`, () => {
    const ids = new Set(def.parts.map((p) => p.id));
    const pathIds = def.parts.filter((p) => PATH_KINDS.has(p.kind)).map((p) => p.id);
    const states = def.states ? def.states.options.map((o) => o.id) : [undefined];
    const [min, max] = def.driver.range ?? [-3, 3];
    for (const state of states) {
      for (const value of [min, (min + max) / 2, max]) {
        const pose = def.pose(value, state);
        for (const id of Object.keys(pose.parts)) assert.ok(ids.has(id), `姿勢指向不存在的零件 ${id}`);
        for (const id of pathIds) {
          const path = pose.paths[id];
          assert.ok(path && path.points.length >= 2, `${id} 沒有路徑`);
          assert.ok(path.points.flat().every(Number.isFinite), `${id} 的路徑有非數值`);
        }
        assert.ok(Array.isArray(pose.readouts));
      }
    }
  });
}
