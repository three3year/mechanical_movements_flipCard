// 剛性桿掃描(維護工具):合成的模型定義 → 長度會變的桿清單。零依賴,跑在 npm test 裡。
import { test } from "node:test";
import assert from "node:assert/strict";
import { stretchedLinks } from "./rigid-links.mjs";

// 主動量 0–1 的轉動主動件;曲柄銷繞原點轉,滑塊在 x 軸上來回
const crank = (v) => [Math.cos(v * Math.PI * 2), Math.sin(v * Math.PI * 2), 0];
const slider = (v) => [2.5 + 0.3 * Math.cos(v * Math.PI * 2), 0, 0];
const def = (parts, pose) => ({ figure: 0, parts, driver: { part: "wheel", type: "rotation", range: [0, 1] }, pose });
const wheel = { id: "wheel", kind: "pulley", center: [0, 0, 0], radius: 1, width: 0.2 };

test("from/to 擺的連桿兩端跟著不同零件走、長度會變的會報;長度固定的不報", () => {
  const stretchy = def([wheel, { id: "link", kind: "link", width: 0.1 }], (v) => ({ parts: { wheel: { angle: v }, link: { from: crank(v), to: slider(v) } } }));
  const [found, ...rest] = stretchedLinks(stretchy);
  assert.deepEqual(rest, []);
  assert.equal(found.id, "link");
  assert.equal(found.kind, "link");
  assert.ok(found.max - found.min > 0.5, `長度 ${found.min}–${found.max}`);

  // 整根跟著曲柄走:長度不變,不報
  const rigid = def([wheel, { id: "link", kind: "link", width: 0.1 }], (v) => {
    const c = crank(v);
    return { parts: { wheel: { angle: v }, link: { from: c, to: [c[0] + 1, c[1], 0] } } };
  });
  assert.deepEqual(stretchedLinks(rigid), []);
});

test("kind 為 rod 的兩點路徑零件也量:兩端跟著不同零件走、長度會變的會報", () => {
  const rod = { id: "rodB", kind: "rod", radius: 0.05 };
  const stretchy = def([wheel, rod], (v) => ({ parts: { wheel: { angle: v } }, paths: { rodB: { points: [crank(v), slider(v)], closed: false } } }));
  const [found, ...rest] = stretchedLinks(stretchy);
  assert.deepEqual(rest, []);
  assert.equal(found.id, "rodB");
  assert.equal(found.kind, "rod");
  assert.ok(found.max - found.min > 0.5, `長度 ${found.min}–${found.max}`);

  // 整根跟著曲柄走(兩端都在曲柄銷的座標系裡):長度不變,不報
  const rigid = def([wheel, rod], (v) => {
    const c = crank(v);
    return { parts: { wheel: { angle: v } }, paths: { rodB: { points: [c, [c[0] + 1, c[1], 0]], closed: false } } };
  });
  assert.deepEqual(stretchedLinks(rigid), []);
});

test("多點的 rod 任一段伸縮會報(風箱皺褶);繩、皮帶、彈簧本來就會伸縮,不報", () => {
  const pleat = (v) => [[0, 0, 0], [0.1, 0.5 + v * 0.3, 0], [0, 1 + v * 0.6, 0]];
  const pleats = def([wheel, { id: "pleat", kind: "rod", radius: 0.02 }], (v) => ({ parts: { wheel: { angle: v } }, paths: { pleat: { points: pleat(v), closed: false } } }));
  assert.deepEqual(stretchedLinks(pleats).map((f) => f.id), ["pleat"]);

  const loose = def([wheel, { id: "rope", kind: "rope" }, { id: "belt", kind: "belt" }, { id: "spring", kind: "spring" }], (v) => ({
    parts: { wheel: { angle: v }, spring: { from: crank(v), to: slider(v) } },
    paths: { rope: { points: [crank(v), slider(v)], closed: false }, belt: { points: [crank(v), slider(v), [0, -2, 0]], closed: true } },
  }));
  assert.deepEqual(stretchedLinks(loose), []);
});
