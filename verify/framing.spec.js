// 取景掃描的核心:合成的模型 → 舊取樣、均勻取樣與段數加倍的外框差多少、是哪個零件走出去。
import { test } from "node:test";
import assert from "node:assert/strict";
import { legacyValues, framingBox, scanFraming } from "./framing.js";
import { model } from "./helpers.js";

const block = (id, extra = {}) => ({ id, kind: "box", size: [1, 1, 1], center: [0, 0, 0], ...extra });
// 主動量 0–1:擺錘在 0、0.5、1(舊取樣的三處)都在中間,0.25 與 0.75 時擺到 ±3
const swinging = (extra) =>
  model([block("base"), block("bob")], (v) => ({ bob: { position: [3 * Math.sin(v * Math.PI * 2), 0, 0] } }), extra);

test("舊取樣:有範圍時取兩端與中間加上目前值,一直轉的取一圈中的五處", () => {
  assert.deepEqual(legacyValues({ type: "rotation", range: [0, 2] }, 0.5), [0, 1, 2, 0.5]);
  assert.deepEqual(legacyValues({ type: "rotation", cycle: [0, 1] }, 0), [0, 0.25, 0.5, 0.75, 1]);
  assert.deepEqual(legacyValues({ type: "virtual", mode: "progress", range: [0, 4] }, 1), [1, 2, 3, 4, 5]);
});

test("零件在舊取樣點之間走得更遠:均勻取樣的外框變大,報出是哪個零件、多出多少", () => {
  const { uniform } = scanFraming(swinging(), 8);
  assert.equal(uniform.part, "bob");
  // 舊外框 x −0.5–0.5(邊長 1);均勻取樣擺到 ±3.5,一邊多出 3
  assert.ok(Math.abs(uniform.excess - 3) < 0.01, `多出 ${uniform.excess}`);
  assert.ok(Math.abs(uniform.growth - 3) < 0.01, `變大 ${uniform.growth}`);
  // 走到最遠的姿勢:往 +x 在 0.25、往 −x 在 0.75(最遠的一面取先找到的)
  assert.ok((uniform.axis === "+x" && uniform.at === 0.25) || (uniform.axis === "−x" && uniform.at === 0.75), `${uniform.axis} 在 ${uniform.at}`);
});

test("段數加倍:取樣已經夠密時外框不再變大", () => {
  // 每半個週期走一次的擺錘,8 段已經取到兩個極值
  const { doubled } = scanFraming(swinging(), 8);
  assert.ok(doubled.growth < 1e-9, `加倍後還變大 ${doubled.growth}`);
});

test("view.fit 只以列出的零件取景、隱藏的零件不算", () => {
  const fitted = framingBox(swinging({ view: { fit: ["base"] } }), [0.25]);
  assert.deepEqual([...fitted.box], [-0.5, -0.5, -0.5, 0.5, 0.5, 0.5]);
  const hidden = model([block("base"), block("bob")], () => ({ bob: { position: [3, 0, 0], visible: false } }));
  assert.equal(framingBox(hidden, [0]).box[3], 0.5);
  assert.equal(scanFraming(swinging({ view: { fit: ["base"] } }), 8).uniform.growth, 0);
});

test("狀態:用定義的初始狀態擺姿勢", () => {
  const states = { initial: "far", options: [{ id: "near", label: "近" }, { id: "far", label: "遠" }] };
  const def = model([block("base"), block("bob")], (v, s) => ({ bob: { position: [s === "far" ? 5 : 1, 0, 0] } }), { states });
  assert.equal(framingBox(def, [0]).box[3], 5.5);
});
