// 實體驗證:干涉。成對的合成模型,一份故意做錯、一份正確;只驗「模型定義 → 問題清單」。
import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyModel } from "./index.js";
import { model, plate, square, circle, of } from "./helpers.js";
import { gearSize } from "../models/shapes.js";
import { routeBelt } from "../models/kit.js";

const interference = (def, options) => of(verifyModel(def, { checks: ["interference"], ...options }), "interference");

test("兩塊板在同一平面重疊會報干涉;錯開不報", () => {
  const wrong = model([plate("a", square(2), [0, 0, 0]), plate("b", square(2), [1, 0, 0])]);
  const found = interference(wrong);
  assert.equal(found.length, 1);
  assert.deepEqual(found[0].parts, ["a", "b"]);
  assert.ok(found[0].severity > 0.1, "穿入深度");
  assert.equal(found[0].figure, 0);
  assert.equal(found[0].count, 96, "每個取樣姿勢都重疊");
  assert.match(found[0].message, /a 與 b 互相穿入/);

  assert.deepEqual(interference(model([plate("a", square(2), [0, 0, 0]), plate("b", square(2), [2.5, 0, 0])])), []);
  assert.deepEqual(interference(model([plate("a", square(2), [0, 0, 0]), plate("b", square(2), [1, 0, 0.5])])), [], "前後兩層不相交");
});

test("圓柱穿過實心的板會報;穿過板上的孔不報", () => {
  const pin = { id: "pin", kind: "cylinder", center: [1, 0, 0], radius: 0.2, length: 2 };
  assert.equal(interference(model([plate("a", square(4), [0, 0, 0]), pin])).length, 1);
  const holed = plate("a", square(4), [0, 0, 0], { holes: [circle(0.22).map(([x, y]) => [x + 1, y]).reverse()] });
  assert.deepEqual(interference(model([holed, pin])), []);
});

test("不同軸向的兩個零件相交會報;不相交不報", () => {
  const upright = { id: "wheel", kind: "cylinder", center: [0, 0, 0], axis: [0, 0, 1], radius: 1, length: 0.3 };
  const across = (x) => ({ id: "rod", kind: "cylinder", center: [x, 0.5, 0], axis: [1, 0, 0], radius: 0.1, length: 3 });
  assert.equal(interference(model([upright, across(0)])).length, 1);
  const clear = { id: "rod", kind: "cylinder", center: [0, 0.5, 0.6], axis: [1, 0, 0], radius: 0.1, length: 3 };
  assert.deepEqual(interference(model([upright, clear])), []);
});

test("只在某個主動量才撞上的兩個零件會被報出,回報的主動量落在那一段", () => {
  // 滑塊在主動量 0.6 以後才伸進擋塊
  const def = model(
    [{ id: "slider", kind: "box", size: [1, 1, 1], center: [0, 0, 0] }, { id: "block", kind: "box", size: [1, 1, 1], center: [2.5, 0, 0] }],
    (v) => ({ slider: { position: [v * 2.5, 0, 0] } }),
  );
  const [found] = interference(def);
  assert.ok(found, "有報出");
  assert.ok(found.value > 0.6 && found.value <= 1, `主動量 ${found.value}`);
  assert.ok(found.count < 96 * 0.5, "只有後段的取樣姿勢");
});

test("穿入深度小於容許值的不報;同一個零件自己的各部分之間不查", () => {
  assert.deepEqual(interference(model([plate("a", square(2), [0, 0, 0]), plate("b", square(2), [1.98, 0, 0])])), [], "貼合誤差 0.02");
  const self = { id: "a", kind: "group", center: [0, 0, 0], pieces: [{ kind: "box", size: [1, 1, 1] }, { kind: "box", size: [1, 1, 1], at: [0.5, 0, 0] }] };
  assert.deepEqual(interference(model([self])), []);
});

test("附屬的小零件(pieces)也參與", () => {
  const withPin = plate("a", square(1), [0, 0, 0], { pieces: [{ kind: "cylinder", radius: 0.1, length: 1.5, at: [0.3, 0, 0.6] }] });
  assert.equal(interference(model([withPin, plate("b", square(1), [0, 0, 1])])).length, 1);
});

test("軸、銷裝在沒畫出來的孔裡:會動的零件繞著它轉或沿著它滑不算干涉;銷掃過對方的實體才算", () => {
  const wheel = { id: "wheel", kind: "pulley", center: [0, 0, 0], radius: 1, width: 0.3 };
  const shaft = (x) => ({ id: "shaft", kind: "shaft", center: [x, 0, 0], radius: 0.08, length: 3 });
  const turn = (v) => ({ wheel: { angle: v * 3 } });
  assert.deepEqual(interference(model([wheel, shaft(0)], turn)), [], "輪在軸上轉");
  assert.equal(interference(model([wheel, shaft(0.5)], turn)).length, 1, "偏心的軸被輪掃過");
  const slide = (v) => ({ wheel: { position: [0, 0, v] } });
  assert.deepEqual(interference(model([wheel, shaft(0)], slide)), [], "輪沿著軸滑");
  assert.equal(interference(model([wheel, shaft(0)])).length, 1, "兩個都固定不動:簡化的機架,要寫豁免");
});

test("一起動、彼此沒有相對運動的兩個零件是同一個剛體,重疊不算干涉;有相對運動才算", () => {
  const piston = { id: "piston", kind: "cylinder", center: [0, 0, 0], axis: [0, 1, 0], radius: 0.6, length: 0.3 };
  const rod = { id: "rod", kind: "box", size: [0.1, 2, 0.1], center: [0, 1, 0] };
  assert.deepEqual(interference(model([piston, rod], (v) => ({ piston: { position: [0, v, 0] }, rod: { position: [0, 1 + v, 0] } }))), []);
  assert.equal(interference(model([piston, rod], (v) => ({ piston: { position: [v, 0, 0] } }))).length, 1, "桿不動、活塞橫著掃過它");
});

test("鉸接處互相套著的軸眼不算干涉;離開鉸接軸的地方互相穿過才算", () => {
  // 同一層的兩根桿,以左端的銷鉸接,其中一根繞銷擺動
  const bar = (id, extra = {}) => ({ id, kind: "group", center: [0, 0, 0], pieces: [{ kind: "box", size: [2, 0.2, 0.1], at: [0.9, 0, 0] }, ...(extra.pieces ?? [])] });
  const pinned = model([bar("a", { pieces: [{ kind: "cylinder", radius: 0.05, length: 0.3 }] }), bar("b")], (v) => ({ a: { angle: 1 + v } }));
  assert.deepEqual(interference(pinned), []);
  // 另一根桿橫在遠處,擺動的桿掃過它
  const crossing = { id: "c", kind: "box", size: [0.2, 3, 0.1], center: [0.6, 1, 0] };
  assert.deepEqual(interference(model([bar("a", { pieces: [{ kind: "cylinder", radius: 0.05, length: 0.3 }] }), bar("b"), crossing], (v) => ({ a: { angle: 1 + v } }))).map((f) => f.parts), [["a", "c"], ["b", "c"]]);
});

test("兩個齒輪正常嚙合不報;中心距太近、齒咬進對方實體才報", () => {
  const teeth = 20;
  const radius = 1;
  const gears = (distance) =>
    model(
      [
        { id: "a", kind: "gear", center: [0, 0, 0], radius, teeth },
        { id: "b", kind: "gear", center: [distance, 0, 0], radius, teeth },
      ],
      (v) => ({ a: { angle: v }, b: { angle: Math.PI + Math.PI / teeth - v } }),
      { driver: { part: "a", type: "rotation" } },
    );
  assert.deepEqual(interference(gears(2 * radius)), []);
  const jammed = interference(gears(2 * radius - 1.2 * gearSize(radius, teeth).addendum));
  assert.equal(jammed.length, 1);
});

test("皮帶繞在輪上不報;繩穿過一塊板會報", () => {
  const top = { center: [0, 1.5, 0], axis: [0, 0, 1], radius: 0.9, sense: 1 };
  const bottom = { center: [0, -1.5, 0], axis: [0, 0, 1], radius: 0.8, sense: 1 };
  const belt = routeBelt([top, bottom]);
  const belted = model(
    [
      { id: "a", kind: "pulley", center: top.center, radius: top.radius, width: 0.3 },
      { id: "b", kind: "pulley", center: bottom.center, radius: bottom.radius, width: 0.3 },
      { id: "belt", kind: "belt" },
    ],
    (v) => ({ a: { angle: v }, b: { angle: (v * top.radius) / bottom.radius } }),
    { paths: (v) => ({ belt: { points: belt.points, closed: true, phase: v * top.radius } }) },
  );
  assert.deepEqual(interference(belted), []);

  const rope = (z) =>
    model([plate("wall", square(2), [0, 0, 0]), { id: "rope", kind: "rope" }], () => ({}), { paths: () => ({ rope: { points: [[0.3, 0.2, -1 + z], [0.3, 0.2, 1 + z]] } }) });
  assert.equal(interference(rope(0)).length, 1);
  assert.deepEqual(interference(rope(1.3)), []);
});

test("繩的端點繫在零件上不算干涉", () => {
  const def = model([{ id: "weight", kind: "box", size: [0.6, 0.6, 0.6], center: [0, -1, 0] }, { id: "rope", kind: "rope" }], () => ({}), {
    paths: () => ({ rope: { points: [[0, 1, 0], [0, -1, 0]] } }),
  });
  assert.deepEqual(interference(def), []);
});

test("隱藏的零件不參與;半透明的影子輪參與", () => {
  const parts = [plate("a", square(2), [0, 0, 0]), plate("b", square(2), [1, 0, 0])];
  assert.deepEqual(interference(model(parts, () => ({ b: { visible: false } }))), []);
  assert.equal(interference(model(parts, () => ({ b: { ghost: true } }))).length, 1);
});

test("存量填色與作圖軌跡不參與", () => {
  const tank = model(
    [plate("float", square(0.5), [0, 0, 0]), { id: "water", kind: "fill", center: [0, 0, 0], size: [2, 2, 2] }, { id: "trace", kind: "trace" }],
    () => ({ water: { level: 1 } }),
    { paths: () => ({ trace: { points: [[-1, 0, 0], [1, 0, 0]] } }) },
  );
  assert.deepEqual(interference(tank), []);
});

test("有狀態的模型每個狀態都查,問題上標明狀態", () => {
  const def = model([plate("a", square(2), [0, 0, 0]), plate("b", square(2), [3, 0, 0])], (v, state) => ({ b: { position: [state === "in" ? 1 : 3, 0, 0] } }), {
    states: { initial: "out", options: [{ id: "out", label: "退出" }, { id: "in", label: "推入" }] },
  });
  const [found] = interference(def);
  assert.equal(found.state, "in");
  assert.match(found.message, /狀態 in/);
});

test("取樣密度可由選項調整", () => {
  const def = model([plate("a", square(2), [0, 0, 0]), plate("b", square(2), [1, 0, 0])]);
  assert.equal(interference(def, { samples: 10 })[0].count, 10);
});

test("同一份定義跑兩次,問題清單完全相同", () => {
  const def = model(
    [{ id: "slider", kind: "box", size: [1, 1, 1], center: [0, 0, 0] }, { id: "block", kind: "box", size: [1, 1, 1], center: [2.5, 0, 0] }, plate("c", circle(1), [0.2, 0.3, 0])],
    (v) => ({ slider: { position: [v * 2.5, 0, 0] } }),
  );
  assert.deepEqual(verifyModel(def), verifyModel(def));
});

test("螺桿的螺紋轉在螺帽(沒畫出螺孔的方塊)裡不算干涉;螺紋掃過會動的別的零件仍算", () => {
  const screw = { id: "screw", kind: "worm", axis: [1, 0, 0], radius: 0.2, length: 3, pitch: 0.3 };
  const nut = { id: "nut", kind: "box", size: [0.5, 0.6, 0.6], center: [0, 0, 0] };
  const inNut = model([screw, nut], (v) => ({ screw: { angle: v * 6 }, nut: { position: [v, 0, 0] } }));
  assert.equal(of(verifyModel(inNut, { checks: ["interference"] }), "interference").length, 0);
  // 方塊橫著掃過螺桿:螺桿的軸線在它的座標裡會移動,不是裝在孔裡
  const across = model([screw, nut], (v) => ({ screw: { angle: v * 6 }, nut: { position: [0, v * 0.3, 0] } }));
  assert.equal(of(verifyModel(across, { checks: ["interference"] }), "interference").length, 1);
});

test("方桿沿自己的長軸在導座(沒畫出方孔的方塊)裡滑動不算干涉;橫著掃過導座仍算", () => {
  const rod = { id: "rod", kind: "box", size: [3, 0.16, 0.16], center: [0, 0, 0] };
  const guide = { id: "guide", kind: "box", size: [0.3, 0.4, 0.4], center: [1, 0, 0] };
  const sliding = model([rod, guide], (v) => ({ rod: { position: [v, 0, 0] } }), { driver: { part: "rod", type: "translation", direction: [1, 0, 0], range: [0, 1] } });
  assert.equal(interference(sliding).length, 0);
  const across = model([rod, guide], (v) => ({ rod: { position: [0, v * 0.3 - 0.15, 0] } }), { driver: { part: "rod", type: "translation", direction: [0, 1, 0], range: [0, 1] } });
  assert.equal(interference(across).length, 1);
  // 一頭頂進實心的牆、或只從旁邊蹭到軌道:沒有整根穿過對方,不是裝在孔裡
  const wall = { id: "wall", kind: "box", size: [1, 3, 3], center: [2.2, 0, 0] };
  const rammed = model([rod, wall], (v) => ({ rod: { position: [v * 0.8 - 0.3, 0, 0] } }), { driver: { part: "rod", type: "translation", direction: [1, 0, 0], range: [0, 1] } });
  assert.equal(interference(rammed).length, 1);
  const block = { id: "block", kind: "box", size: [0.5, 0.4, 0.4], center: [0, 0.23, 0] };
  const grazing = model([rod, block], (v) => ({ block: { position: [v, 0.23, 0] } }), { driver: { part: "block", type: "translation", direction: [1, 0, 0], range: [0, 1] } });
  assert.equal(interference(grazing).length, 1);
});
