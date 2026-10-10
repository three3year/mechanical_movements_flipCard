// 一件掃描(維護工具,不屬於實體驗證):同一個零件的各塊要彼此相連。合成的零件,只驗「模型定義 → 報告」。
import { test } from "node:test";
import assert from "node:assert/strict";
import { detachedPieces } from "./one-piece.js";
import { model, plate, square, circle } from "./helpers.js";

// 板厚 0.2(z −0.1..0.1);銷長 0.3,立在板面上時 z 0.05..0.35
const pin = (at, extra = {}) => ({ kind: "cylinder", radius: 0.07, length: 0.3, at, ...extra });
const scan = (part) => detachedPieces(model([part]));

test("銷立在板上(深度範圍重疊)不報;銷浮在板前面 0.05 會報,寫出是哪一塊與間隙", () => {
  assert.deepEqual(scan(plate("a", square(2), [0, 0, 0], { pieces: [pin([0.5, 0.5, 0.2])] })), []);

  const [found, ...rest] = scan(plate("a", square(2), [0, 0, 0], { pieces: [pin([0.5, 0.5, 0.2]), pin([-0.5, 0.5, 0.3])] }));
  assert.deepEqual(rest, []);
  assert.equal(found.part, "a");
  assert.deepEqual(found.blocks.map((b) => b.label), ["pieces[1]"]);
  assert.ok(Math.abs(found.gap - 0.05) < 1e-3, `間隙 ${found.gap}`);
});

test("互相碰著、但整組離開本體的兩塊一起報成一群", () => {
  const part = plate("a", square(2), [0, 0, 0], {
    pieces: [pin([3, 0, 0]), { kind: "box", size: [0.4, 0.4, 0.2], at: [3.2, 0, 0] }, pin([0, 0, 0.2])],
  });
  const [found, ...rest] = scan(part);
  assert.deepEqual(rest, []);
  assert.deepEqual(found.blocks.map((b) => b.label), ["pieces[0]", "pieces[1]"]);
  assert.ok(Math.abs(found.gap - 1.93) < 1e-3, `間隙 ${found.gap}`); // 板緣 x 1 到銷 x 2.93
});

test("L 形板空角裡的銷會報:整塊板的外接盒蓋得到,板的各個凸塊蓋不到", () => {
  const ell = [[0, 0], [2, 0], [2, 0.5], [0.5, 0.5], [0.5, 2], [0, 2]];
  const [found] = scan(plate("a", ell, [0, 0, 0], { pieces: [pin([1.3, 1.3, 0], { axis: [0, 0, 1] })] }));
  assert.deepEqual(found?.blocks.map((b) => b.label), ["pieces[0]"]);
});

test("環與環內的圓盤隔著一圈溝(第 217 種凸輪的外圈與內島)會報;環的凸塊外接盒會蓋過溝,要量實際的距離", () => {
  const ring = plate("a", circle(2), [0, 0, 0], { holes: [circle(1.2).reverse()], pieces: [{ kind: "plate", shape: { outline: circle(1), holes: [] }, thickness: 0.2 }] });
  const [found] = scan(ring);
  assert.deepEqual(found?.blocks.map((b) => b.label), ["pieces[0]"]);
  assert.ok(found.gap > 0.17 && found.gap < 0.2, `間隙 ${found.gap}`); // 溝寬 0.2,多邊形的邊在頂點之間往內一點
});

test("浮在懸空托架前面的銷(第 233 種):gap 是離最近的一塊,toMain 是離主體", () => {
  // 主體是底座;托架離底座 1,銷浮在托架前 0.04
  const frame = { id: "frame", kind: "group", pieces: [{ kind: "box", size: [4, 0.2, 1] }, { kind: "box", size: [0.3, 1, 0.12], at: [0, 1.6, 0] }, pin([0, 1.6, 0.25])] };
  const byLabel = Object.fromEntries(detachedPieces(model([frame])).map((f) => [f.blocks.map((b) => b.label).join(), f]));
  assert.ok(Math.abs(byLabel["pieces[2]"].gap - 0.04) < 1e-3, `銷離托架 ${byLabel["pieces[2]"].gap}`);
  assert.ok(Math.abs(byLabel["pieces[2]"].toMain - 1.43) < 0.01, `銷離底座 ${byLabel["pieces[2]"].toMain}`);
  assert.ok(Math.abs(byLabel["pieces[1]"].toMain - 1) < 1e-3, `托架離底座 ${byLabel["pieces[1]"].toMain}`);
});

test("固定件裡分開立著、落到同一個地面的軸承座標成 grounded;懸空的銷、會動的零件不標", () => {
  const post = (x, bottom = -2) => ({ kind: "box", size: [0.3, 2, 0.3], at: [x, bottom + 1, 0] });
  const bearings = { id: "bearings", kind: "group", pieces: [post(-2), post(2), post(0, -1.5), pin([-2, 0.2, 0.3])] };
  const found = detachedPieces(model([plate("a", square(1), [0, 5, 0]), bearings]));
  const flags = Object.fromEntries(found.map((f) => [f.blocks.map((b) => b.label).join(), [f.fixed, f.grounded]]));
  // 體積相同的兩座取前面那座當主體;第三座底端高了 0.5,沒落地
  assert.deepEqual(flags, { "pieces[1]": [true, true], "pieces[2]": [true, false], "pieces[3]": [true, false] });

  const turning = model([plate("a", square(2), [0, 0, 0], { pieces: [post(3)] })], (v) => ({ a: { angle: v } }));
  assert.deepEqual(detachedPieces(turning).map((f) => [f.fixed, f.grounded]), [[false, false]]);
});

test("附件的附件、轉了角的附件照它擺放的位置算", () => {
  // 臂(沿局部 y 長 2 的方塊)轉 90° 後沿 x 0..2;板上 x 1.8 的銷只有臂轉過去才碰得到。
  // 臂端的銷是臂的附件,局部 y −0.9 隨臂轉到 x 1.9
  const arm = (end) => ({ kind: "box", size: [0.2, 2, 0.2], at: [1, 0, 0], angle: Math.PI / 2, pieces: [pin([0, end, 0.2])] });
  assert.deepEqual(scan(plate("a", square(0.4), [0, 0, 0], { pieces: [arm(-0.9), pin([1.8, 0, 0.2])] })), []);

  const [found, ...rest] = scan(plate("a", square(0.4), [0, 0, 0], { pieces: [arm(-1.5)] })); // 銷在臂端外 0.43
  assert.deepEqual(rest, []);
  assert.deepEqual(found?.blocks.map((b) => b.label), ["pieces[0].pieces[0]"]);
  assert.ok(Math.abs(found.gap - 0.43) < 1e-3, `間隙 ${found.gap}`);
});
