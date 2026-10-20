// 外形與洞的檢查(維護工具,不屬於實體驗證):板件的洞要落在外形裡、外輪廓不自交。合成的零件,只驗「模型定義 → 報告」。
import { test } from "node:test";
import assert from "node:assert/strict";
import { outlineProblems } from "./outlines.js";
import { model, plate, square, circle } from "./helpers.js";

const at = (poly, dx, dy) => poly.map(([x, y]) => [x + dx, y + dy]);
const scan = (...parts) => outlineProblems(model(parts));

test("洞在外形裡不報;洞整個落在外形外會報,三角化沒有把洞扣掉(丟掉或多出一塊)", () => {
  assert.deepEqual(scan(plate("a", square(2), [0, 0, 0], { holes: [circle(0.3).reverse()] })), []);

  const [found, ...rest] = scan(plate("a", square(2), [0, 0, 0], { holes: [at(circle(0.3), 3, 0).reverse()] }));
  assert.deepEqual(rest, []);
  assert.equal(found.part, "a");
  assert.equal(found.problem, "hole-outside");
  assert.deepEqual(found.holes, [{ index: 0, outside: "all", count: 24, of: 24 }]);
  assert.ok(found.area.triangulated >= 4 - 1e-6, `三角化面積 ${found.area.triangulated} 沒有比整塊板小`);
});

test("洞有一部分落在外形外(連桿端頭的銷孔超出外形)也報,標成部分在外", () => {
  const [found] = scan(plate("a", square(2), [0, 0, 0], { holes: [at(circle(0.3), 0.9, 0).reverse()] }));
  assert.equal(found?.problem, "hole-outside");
  assert.equal(found.holes[0].outside, "part");
  assert.ok(found.holes[0].count > 0 && found.holes[0].count < 24, `外形外的頂點 ${found.holes[0].count}/${found.holes[0].of}`);
});

test("外輪廓自交、三角化面積明顯大於外形面積會報;自交但面積只差一點的不報", () => {
  // 一條細長條在末端折回自己(第 437 種蝸殼壁的收尾):三角化多出一塊
  const strip = [[0, 0], [3, 0], [3, 0.2], [1, 0.2], [1, 1], [2, 1], [2, -0.5], [0, -0.5]];
  const [found, ...rest] = scan(plate("a", strip, [0, 0, 0]));
  assert.deepEqual(rest, []);
  assert.equal(found?.problem, "self-crossing");
  assert.ok(found.area.triangulated > found.area.outline * 1.02, `三角化 ${found.area.triangulated} 外形 ${found.area.outline}`);

  // 邊只是擦過一個頂點(多邊形的點重複),三角化的面積不變,不報
  const touching = [[0, 0], [2, 0], [2, 2], [1, 1], [0, 2], [1, 1]];
  assert.deepEqual(scan(plate("a", touching, [0, 0, 0])), []);
});

test("附件裡的板件也查,標出是哪一塊", () => {
  const holed = { kind: "plate", shape: { outline: square(1), holes: [at(circle(0.2), 2, 0).reverse()] }, thickness: 0.2 };
  const found = scan({ id: "frame", kind: "group", pieces: [{ kind: "box", size: [1, 1, 1] }, holed] });
  assert.deepEqual(found.map((f) => f.part), ["frame.pieces[1]"]);
});
