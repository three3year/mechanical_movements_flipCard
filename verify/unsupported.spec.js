// 實體驗證:憑空連動與豁免。成對的合成模型;只驗「模型定義 → 問題清單」。
import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyModel, unwaived } from "./index.js";
import { model, plate, square, of } from "./helpers.js";

const unsupported = (def) => of(verifyModel(def, { checks: ["unsupported"] }), "unsupported");
const turning = { driver: { part: "a", type: "rotation" } };
const gear = (id, x, z = 0) => ({ id, kind: "gear", center: [x, 0, z], radius: 1, teeth: 20 });
const meshed = (v) => ({ a: { angle: v }, b: { angle: Math.PI + Math.PI / 20 - v } });

test("兩個齒輪隔著空隙一起轉會報憑空連動,並寫出離最近的實體多遠;嚙合不報", () => {
  const found = unsupported(model([gear("a", 0), gear("b", 2.6)], meshed, turning)).find((f) => f.parts[0] === "b");
  assert.deepEqual(found.parts, ["b"]);
  assert.ok(found.severity > 0.2 && found.severity < 0.6, `間隙 ${found.severity}`);
  assert.match(found.message, /b .*離最近的實體 0\.\d+/);
  assert.ok(Number.isFinite(found.value));
  assert.deepEqual(unsupported(model([gear("a", 0), gear("b", 2)], meshed, turning)), []);
});

test("前後兩層的輪同步轉但中間沒有軸會報;有軸不報", () => {
  const wheels = [gear("a", 0, 0), gear("b", 0, 1.5)];
  const together = (v) => ({ a: { angle: v }, b: { angle: v }, shaft: { angle: v } });
  assert.deepEqual(unsupported(model(wheels, together, turning)).map((f) => f.parts[0]), ["a", "b"]);
  const shaft = { id: "shaft", kind: "shaft", center: [0, 0, 0.75], radius: 0.08, length: 2.2 };
  assert.deepEqual(unsupported(model([...wheels, shaft], together, turning)), []);
});

test("懸空自轉的輪會報(主動件也要有支撐);裝在軸上不報", () => {
  const [found] = unsupported(model([gear("a", 0)], (v) => ({ a: { angle: v } }), turning));
  assert.deepEqual(found.parts, ["a"]);
  assert.match(found.message, /沒有碰到任何零件/);
  const stand = { id: "stand", kind: "box", size: [0.4, 0.4, 0.4], center: [0, 0, -0.4] };
  assert.deepEqual(unsupported(model([gear("a", 0), stand], (v) => ({ a: { angle: v } }), turning)), []);
});

test("掛在繩上的重物、皮帶帶動的輪不報", () => {
  const hoist = model(
    [{ id: "a", kind: "drum", center: [0, 2, 0], radius: 0.5, width: 0.6 }, { id: "weight", kind: "box", size: [0.5, 0.5, 0.5], center: [0.5, 0, 0] }, { id: "rope", kind: "rope" }],
    (v) => ({ a: { angle: v }, weight: { position: [0.5, -v * 0.5, 0] } }),
    { ...turning, paths: (v) => ({ rope: { points: [[0.5, 2, 0], [0.5, -v * 0.5, 0]], phase: v * 0.5 } }) },
  );
  assert.deepEqual(unsupported(hoist), []);
});

test("虛擬主動件的模型:標為外力來源的零件不報,沒標的報", () => {
  const piston = { id: "piston", kind: "box", size: [1, 0.4, 1], center: [0, 0, 0] };
  const rod = { id: "rod", kind: "box", size: [0.2, 2, 0.2], center: [0, 1.2, 0] };
  const def = (extra) =>
    model([piston, rod], (v) => ({ piston: { position: [0, v, 0] }, rod: { position: [0, 1.2 + v, 0] } }), {
      driver: { type: "virtual", mode: "balance", label: "壓力", range: [0, 1] },
      ...extra,
    });
  assert.deepEqual(unsupported(def({ powered: ["piston"] })), []);
  assert.deepEqual(unsupported(def({})).map((f) => f.parts[0]).sort(), ["piston", "rod"]);
});

test("並排變體各自連回自己的抓取處,不互相誤報", () => {
  const def = model(
    [gear("a", 0), gear("b", 2), gear("c", 6), gear("d", 8)],
    (v) => ({ a: { angle: v }, b: { angle: Math.PI + Math.PI / 20 - v }, c: { angle: v }, d: { angle: Math.PI + Math.PI / 20 - v } }),
    { driver: { part: "a", type: "rotation", grips: ["c"] } },
  );
  assert.deepEqual(unsupported(def), []);
});

test("間歇接觸的零件只在它實際在動的姿勢需要有接觸;停住時沒接觸不報", () => {
  // 推桿只在主動量 0.5 以後碰到滑塊並推著它走;之前滑塊停著、兩者不相碰
  const def = model(
    [{ id: "pusher", kind: "box", size: [1, 1, 1], center: [0, 0, 0] }, { id: "block", kind: "box", size: [1, 1, 1], center: [2, 0, 0] }, plate("floor", square(8, 0.2), [2, -0.6, 0])],
    (v) => ({ pusher: { position: [v * 2, 0, 0] }, block: { position: [Math.max(2, v * 2 + 1), 0, 0] } }),
  );
  assert.deepEqual(unsupported(def), []);
});

test("豁免:有原因的不列入未豁免清單;沒寫原因的無效;只放過指明的那一個問題", () => {
  const parts = [plate("a", square(2), [0, 0, 0]), plate("b", square(2), [1, 0, 0]), plate("c", square(2), [-1, 0, 0])];
  const check = { checks: ["interference"] };
  const waiver = { check: "interference", parts: ["b", "a"], reason: "示意:兩塊板在實物上是同一塊" };
  const findings = verifyModel(model(parts, () => ({}), { waivers: [waiver] }), check);
  assert.deepEqual(unwaived(findings).map((f) => f.parts), [["a", "c"]]);
  assert.equal(findings.find((f) => f.waived).waived, waiver.reason);

  const silent = verifyModel(model(parts, () => ({}), { waivers: [{ check: "interference", parts: ["a", "b"], reason: " " }] }), check);
  assert.equal(unwaived(silent).filter((f) => f.check === "interference").length, 2, "沒有原因的豁免不算");
});

test("豁免的對象已經沒有問題時,報為過時的豁免", () => {
  const def = model([plate("a", square(2), [0, 0, 0]), plate("b", square(2), [3, 0, 0])], () => ({}), {
    waivers: [{ check: "interference", parts: ["a", "b"], reason: "以前重疊" }],
  });
  const open = unwaived(verifyModel(def, { checks: ["interference"] }));
  assert.equal(open.length, 1);
  assert.equal(open[0].check, "stale-waiver");
  assert.match(open[0].message, /a、b/);
});

test("豁免對憑空連動同樣有效", () => {
  const stand = { id: "stand", kind: "box", size: [0.4, 0.4, 0.4], center: [0, 0, -0.4] };
  const def = model([gear("a", 0), gear("b", 2.6), stand], meshed, { ...turning, waivers: [{ check: "unsupported", parts: ["b"], reason: "示意用的分解圖" }] });
  assert.deepEqual(unwaived(verifyModel(def, { checks: ["unsupported"] })), []);
});
