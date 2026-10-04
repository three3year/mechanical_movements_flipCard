// 實體驗證:動力重演。成對的合成模型——模型的 pose 是它「宣稱」的動作,重演看實物會不會這樣動。
import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyModel, unwaived } from "./index.js";
import { model, plate, of } from "./helpers.js";
import { swingUntilContact, circlePolygon } from "../models/contact.js";

const replayed = (def) => of(verifyModel(def, { checks: ["replay"] }), "replay");

// 鋸齒條:每一齒左邊是直立的齒面(朝 −x),右邊是斜面;齒距 0.5、齒高 0.2
const PITCH = 0.5;
const toothed = (() => {
  const top = [];
  for (let x = 2.5; x >= -2.5 - 1e-9; x -= PITCH) top.push([x, 0.2], [x, 0]);
  return [[-3, -0.3], [3, -0.3], [3, 0], ...top, [-3, 0]];
})();
const bar = plate("bar", toothed, [0, 0, 0]);
const pawlOutline = (length) => [[0, -0.05], [length, -0.05], [length, 0.05], [0, 0.05]];
const there = (v) => (v < 1 ? v : 2 - v); // 主動量 0–2:去程 0→1,回程 1→0
const stroke = { driver: { part: "pusher", type: "translation", range: [0, 2], direction: [1, 0, 0] } };

// 推桿上鉸著一支棘爪,爪尖垂在齒條上;推桿每個行程走 0.6:先走 0.1 的空行程碰到齒面,再把齒條推進一格
function pushRatchet(pawlLength) {
  const pivot = (v) => [-0.987 + 0.6 * there(v), 1, 0];
  return model(
    [{ id: "pusher", kind: "box", size: [0.3, 0.3, 0.2], center: pivot(0) }, plate("pawl", pawlOutline(pawlLength), pivot(0)), bar],
    (v) => ({
      pusher: { position: pivot(v) },
      pawl: { position: pivot(v), angle: -0.82 },
      bar: { position: [v < 1 ? Math.max(0, 0.6 * v - 0.1) : PITCH, 0, 0] },
    }),
    {
      ...stroke,
      replay: {
        free: { pawl: { on: "pusher" }, bar: { slide: [1, 0, 0], hold: true } },
        expect: [
          { at: 1, part: "bar", label: "去程把齒條推進一格" },
          { at: 2, part: "bar", label: "回程齒條留在原地,棘爪滑過一齒" },
        ],
      },
    },
  );
}

test("棘爪夠得到齒:每個行程推進一格(通過)", () => {
  assert.deepEqual(replayed(pushRatchet(1.3)), []);
});

test("棘爪太短夠不到齒:報「預期前進一格,實際沒動」", () => {
  const found = replayed(pushRatchet(0.7));
  assert.ok(found.length >= 1);
  assert.deepEqual(found[0].parts, ["bar"]);
  assert.match(found[0].message, /去程把齒條推進一格.*預期 bar .*已移 0\.50,實際沒動/);
  assert.equal(found[0].value, 1);
});

// 落桿:以左端為樞軸、靠自重垂下,平時擱在擋止上;圓盤(順時針)上的插銷從下面頂起桿端,轉過桿端後滑脫,桿落回擋止
function dropLever(withStop) {
  const leverOutline = [[0, -0.06], [2, -0.06], [2, 0.06], [0, 0.06]];
  const disc = { center: [2.3, -0.9], pinAt: 1, pinSize: 0.08 };
  const stop = { center: [1.2, -0.15], r: 0.09 };
  const pin = (v) => [disc.center[0] + disc.pinAt * Math.cos(Math.PI + v), disc.center[1] + disc.pinAt * Math.sin(Math.PI + v)];
  const rest = (v) =>
    swingUntilContact({ pivot: [0, 0], outline: leverOutline, from: 0.5, into: -1, sweep: 0.9, steps: 90 }, [circlePolygon(stop.center, stop.r), circlePolygon(pin(v), disc.pinSize)]);
  const parts = [
    plate("disc", circlePolygon([0, 0], 1.2, 32), [...disc.center, -0.3], { pieces: [{ kind: "cylinder", radius: disc.pinSize, length: 0.5, at: [-disc.pinAt, 0, 0.3] }] }),
    plate("lever", leverOutline, [0, 0, 0]),
  ];
  if (withStop) parts.push({ id: "stop", kind: "cylinder", center: [...stop.center, 0], radius: stop.r, length: 0.4 });
  return model(parts, (v) => ({ disc: { angle: v }, lever: { angle: rest(v) } }), {
    driver: { part: "disc", type: "rotation", speed: -1 },
    replay: {
      from: 0,
      to: -2.2,
      free: { lever: {} },
      expect: [{ at: -2.1, part: "lever", label: "插銷滑脫後落桿落回擋止", quote: "the lever drops" }],
    },
  });
}

test("落桿被插銷頂起、滑脫後落到擋止(通過)", () => {
  assert.deepEqual(replayed(dropLever(true)), []);
});

test("沒有擋止:落桿一路掉下去,報停位不符", () => {
  const [found] = replayed(dropLever(false));
  assert.deepEqual(found.parts, ["lever"]);
  assert.match(found.message, /插銷滑脫後落桿落回擋止.*預期 lever .*實際轉了 -\d+°.*原文:the lever drops/);
});

// 止回爪:齒條被彈簧往回拉;推塊把它推進 0.8(爪尖越過一個齒頂)再退回,固定樞軸上的止回爪落進齒間擋住,
// 齒條停在推進一格的位置
function backstop(withPawl) {
  const parts = [{ id: "pusher", kind: "box", size: [0.4, 0.3, 0.2], center: [-3.2, -0.15, 0] }, bar];
  if (withPawl) parts.push(plate("check", pawlOutline(1.3), [-0.887, 1, 0]));
  return model(
    parts,
    (v) => ({
      pusher: { position: [-3.2 + 0.8 * there(v), -0.15, 0] },
      bar: { position: [v < 1 ? 0.8 * v : Math.max(PITCH, 0.8 * (2 - v)), 0, 0] },
      check: { angle: -0.82 },
    }),
    {
      ...stroke,
      replay: {
        free: { bar: { slide: [1, 0, 0], spring: -1, limits: [0, 5] }, ...(withPawl ? { check: {} } : {}) },
        expect: [{ at: 2, part: "bar", label: "推塊退回後齒條不倒退" }],
      },
    },
  );
}

test("止回爪擋住倒轉(通過)", () => {
  assert.deepEqual(replayed(backstop(true)), []);
});

test("沒有止回爪:齒條跟著退回去,會報", () => {
  const [found] = replayed(backstop(false));
  assert.deepEqual(found.parts, ["bar"]);
  assert.match(found.message, /推塊退回後齒條不倒退.*預期 bar .*已移 0\.50,實際沒動/);
});

test("同樣的輸入每次結果相同;豁免對動力重演同樣有效", () => {
  const def = pushRatchet(0.7);
  assert.deepEqual(verifyModel(def, { checks: ["replay"] }), verifyModel(def, { checks: ["replay"] }));
  const waived = { ...def, waivers: [{ check: "replay", parts: ["bar"], reason: "示範:棘爪刻意做短" }] };
  assert.deepEqual(unwaived(verifyModel(waived, { checks: ["replay"] })), []);
});

test("動力重演的豁免可以用 at 指明預期事件:只放過那一個,同一個零件的其他事件照報", () => {
  const def = pushRatchet(0.7); // 棘爪太短:去程與回程兩個預期事件都不成立
  const both = replayed(def);
  assert.equal(both.length, 2);
  const one = replayed({ ...def, waivers: [{ check: "replay", parts: ["bar"], at: 1, reason: "只放過去程這一項" }] });
  assert.equal(one.length, 1);
  assert.equal(one[0].value, 2);
  const all = replayed({ ...def, waivers: [{ check: "replay", parts: ["bar"], reason: "沒寫 at:這個零件的每個預期事件" }] });
  assert.equal(all.length, 0);
});

test("ignore 列出的兩個零件之間不算碰撞:托著它的零件被忽略,它就掉下去;expect 省略 at 就是區間的終點", () => {
  const lifted = (ignore) =>
    model(
      [{ id: "lifter", kind: "box", size: [1, 0.2, 0.4], center: [0, 0, 0] }, { id: "block", kind: "box", size: [0.3, 0.3, 0.3], center: [0, 0.25, 0] }],
      (v) => ({ lifter: { position: [0, 0.5 * v, 0] }, block: { position: [0, 0.25 + 0.5 * v, 0] } }),
      {
        driver: { part: "lifter", type: "translation", range: [0, 1], direction: [0, 1, 0] },
        replay: { free: { block: { slide: [0, 1, 0] } }, ignore, expect: [{ part: "block", label: "被托高" }] },
      },
    );
  assert.equal(replayed(lifted()).length, 0);
  assert.equal(replayed(lifted([["block", "lifter"]])).length, 1);
});
