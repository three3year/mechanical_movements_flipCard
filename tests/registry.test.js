// 模型登記表的完整性:清單中的每個定義都逐一載入,並符合繪圖層需要的形狀
import { test } from "node:test";
import assert from "node:assert/strict";
import { sources, hasModel, loadModel } from "../models/registry.js";
import { PART_KINDS, PATH_KINDS, FLUIDS } from "../models/kinds.js";

const figures = Object.keys(sources).map(Number);
const models = await Promise.all(figures.map((n) => loadModel(n)));

test("第一章圖 1–23 都有登記的模型", () => {
  for (let figure = 1; figure <= 23; figure++) assert.ok(hasModel(figure), `圖 ${figure} 沒有模型`);
});

test("登記表的圖號與定義的圖號一致", () => {
  figures.forEach((figure, i) => assert.equal(models[i].figure, figure));
});

test("未登記的圖號載入時失敗,不回傳定義", async () => {
  assert.equal(hasModel(0), false);
  await assert.rejects(loadModel(0));
});

// 檢查姿勢時取的主動量:有範圍取兩端與中間,往復取一個來回中的幾處,其餘取正負幾個值
function sampleValues(driver) {
  if (driver.type === "virtual" && driver.mode === "progress") {
    const span = driver.range[1] - driver.range[0];
    return [0, span * 0.37, span * 2.6];
  }
  if (driver.range) {
    const [min, max] = driver.range;
    return [min, (min + max) / 2, max];
  }
  if (driver.cycle) {
    const span = Math.abs(driver.cycle[1] - driver.cycle[0]);
    return [0, span * 0.5, span * 1.5, span * 3.2];
  }
  return [-3, 0, 3];
}

for (const def of models) {
  test(`圖 ${def.figure}:主動件、狀態與範圍的定義有效`, () => {
    const ids = def.parts.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length, "零件 id 不重複");
    for (const p of def.parts) assert.ok(PART_KINDS.has(p.kind) || PATH_KINDS.has(p.kind), `未知的零件種類 ${p.kind}`);
    const d = def.driver;
    assert.ok(["rotation", "translation", "virtual"].includes(d.type));
    if (d.range) assert.ok(d.range[0] < d.range[1], "範圍 min < max");
    if (d.type === "virtual") {
      assert.ok(d.label, "虛擬主動件有名稱");
      assert.ok(d.range, "虛擬主動件有範圍");
      assert.ok(["balance", "progress"].includes(d.mode), "虛擬主動件是平衡型或進程型");
      assert.equal(d.part, undefined, "虛擬主動件不指向零件");
    } else {
      assert.ok(ids.includes(d.part), "主動件指向存在的零件");
      for (const grip of d.grips ?? []) assert.ok(ids.includes(grip), `抓取處 ${grip} 指向存在的零件`);
      if (d.type === "translation" && !d.cycle && !d.grips) assert.ok(d.range && d.direction);
      if (d.cycle) assert.ok(d.cycle[0] !== d.cycle[1], "往復的兩端不同");
    }
    if (def.states) {
      const options = def.states.options.map((o) => o.id);
      assert.ok(options.includes(def.states.initial), "預設狀態在狀態清單中");
      assert.ok(def.states.options.every((o) => o.label));
    }
  });

  test(`圖 ${def.figure}:每個狀態的姿勢都涵蓋所有路徑零件,且只指向存在的零件`, () => {
    const ids = new Set(def.parts.map((p) => p.id));
    const pathIds = def.parts.filter((p) => PATH_KINDS.has(p.kind)).map((p) => p.id);
    const states = def.states ? def.states.options.map((o) => o.id) : [undefined];
    for (const state of states) {
      for (const value of sampleValues(def.driver)) {
        const pose = def.pose(value, state);
        for (const [id, p] of Object.entries(pose.parts)) {
          assert.ok(ids.has(id), `姿勢指向不存在的零件 ${id}`);
          for (const key of ["position", "from", "to", "rotation"]) {
            if (p[key]) assert.ok(p[key].every(Number.isFinite), `${id}.${key} 有非數值`);
          }
          if (p.angle != null) assert.ok(Number.isFinite(p.angle), `${id}.angle 有非數值`);
        }
        for (const id of pathIds) {
          const path = pose.paths[id];
          assert.ok(path && path.points.length >= 2, `${id} 沒有路徑`);
          assert.ok(path.points.flat().every(Number.isFinite), `${id} 的路徑有非數值`);
        }
        for (const flow of pose.flows ?? []) {
          assert.ok(FLUIDS.has(flow.fluid), `未知的流體 ${flow.fluid}`);
          assert.ok(flow.points.flat().every(Number.isFinite), "流體示意的點有非數值");
        }
        assert.ok(Array.isArray(pose.readouts));
      }
    }
  });
}

// 連桿(link)是剛體:姿勢以 from/to 指定時,兩端距離在整個運動中不變(標 stretch: true 的除外)。
// 連桿機構走到不可達的位置時(兩圓不相交),這條檢查會抓出來。
function denseValues(driver) {
  if (driver.type === "virtual" && driver.mode === "progress") return sweepValues(0, (driver.range[1] - driver.range[0]) * 2, 48);
  if (driver.range) return sweepValues(driver.range[0], driver.range[1], 48);
  if (driver.cycle) return sweepValues(0, Math.abs(driver.cycle[1] - driver.cycle[0]) * 4, 48);
  return sweepValues(-2 * Math.PI, 2 * Math.PI, 96);
}
const sweepValues = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

for (const def of models) {
  const links = def.parts.filter((p) => p.kind === "link" && !p.stretch);
  if (!links.length) continue;
  test(`圖 ${def.figure}:連桿在整個運動中長度不變(機構不會分離)`, () => {
    const states = def.states ? def.states.options.map((o) => o.id) : [undefined];
    for (const state of states) {
      const lengths = new Map();
      for (const v of denseValues(def.driver)) {
        const pose = def.pose(v, state).parts;
        for (const link of links) {
          const p = pose[link.id];
          if (!p?.from || !p?.to) continue;
          const l = Math.hypot(p.to[0] - p.from[0], p.to[1] - p.from[1], p.to[2] - p.from[2]);
          if (!lengths.has(link.id)) lengths.set(link.id, [l, l]);
          const r = lengths.get(link.id);
          r[0] = Math.min(r[0], l);
          r[1] = Math.max(r[1], l);
        }
      }
      for (const [id, [lo, hi]] of lengths) assert.ok(hi - lo < 1e-6 * Math.max(1, hi), `${id} 長度在 ${lo.toFixed(4)}–${hi.toFixed(4)} 之間變動(狀態 ${state ?? "—"})`);
    }
  });
}
