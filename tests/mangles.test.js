// 第十章「變速與曼格機構」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import * as m192 from "../models/fig192.js";
import * as m193 from "../models/fig193.js";
import * as m194 from "../models/fig194.js";
import * as m197 from "../models/fig197.js";
import * as m198 from "../models/fig198.js";
import * as m199 from "../models/fig199.js";

/** 小齒輪等速轉一個週期時,輪的轉速(|d輪 / d小齒輪|)序列,以及輪轉角的往返 */
function wheelRates(m) {
  const vs = sweep(m.period, 3000);
  const ws = vs.map((v) => m.mangle(v).wheel);
  const rates = ws.slice(1).map((w, i) => (w - ws[i]) / (vs[i + 1] - vs[i]));
  return { ws, rates };
}
/** 中位數:避開繞過端頭時的過渡 */
const typical = (list) => list.slice().sort((a, b) => a - b)[Math.floor(list.length / 2)];

test("第 193 種:小齒輪朝同一方向轉,曼格輪朝一方向轉近乎一整圈再反向;外側齒圈半徑大,那一方向轉得較慢", () => {
  const { ws, rates } = wheelRates(m193);
  const span = Math.max(...ws) - Math.min(...ws);
  assert.ok(span > 1.6 * Math.PI && span < 2 * Math.PI, `近乎一整圈(${((span * 180) / Math.PI).toFixed(0)}°)`);
  close(ws[0], ws[ws.length - 1], "一個週期回到原處", 1e-3);
  const forward = rates.filter((r) => r < -1e-6);
  const back = rates.filter((r) => r > 1e-6);
  assert.ok(forward.length && back.length, "兩個方向都有");
  const { RO, RI, RP } = m193.radii;
  close(typical(forward.map(Math.abs)), RP / RO, "沿外側齒圈:轉速 = RP/RO", 0.01);
  close(typical(back), RP / RI, "沿內側齒圈:轉速 = RP/RI", 0.01);
  assert.ok(RP / RO < RP / RI, "外側較慢");
});

test("第 192 種:溝槽與齒偏離輪心,輪在每一部分的轉速都不同", () => {
  const { ws, rates } = wheelRates(m192);
  close(ws[0], ws[ws.length - 1], "一個週期回到原處", 1e-3);
  const forward = rates.filter((r) => r < -1e-6).map(Math.abs);
  // 沿同一圈齒走時轉速也一直在變(不是兩段等速)
  assert.ok(Math.max(...forward) / Math.min(...forward) > 1.15, "同一方向中轉速也在變");
  const ys = sweep(m192.period, 600).map((v) => m192.mangle(v).y);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 0.5, "小齒輪軸被溝槽帶著升降");
});

test("第 194 種:只有一圈齒,兩個方向的轉速相同", () => {
  const { ws, rates } = wheelRates(m194);
  close(ws[0], ws[ws.length - 1], "一個週期回到原處", 1e-3);
  const { RT, RP } = m194.radii;
  const forward = rates.filter((r) => r < -1e-6).map(Math.abs);
  const back = rates.filter((r) => r > 1e-6);
  close(typical(forward), RP / RT, "一方向", 0.01);
  close(typical(back), RP / RT, "另一方向相同", 0.01);
});

test("第 197 種:小齒輪連續旋轉給框架往復運動;小齒輪軸升降以繞過齒條兩端", () => {
  const states = sweep(m197.period, 2000).map((v) => m197.rack(v));
  const xs = states.map((s) => s.frame);
  close(Math.max(...xs) - Math.min(...xs), 10 * m197.pitch + 2 * m197.pinionRadius, "框架往返走完整排銷(加上繞過兩端的銷)", 1e-3);
  const ys = states.map((s) => s.y);
  close(Math.max(...ys), m197.pinionRadius, "在銷排上方", 1e-6);
  close(Math.min(...ys), -m197.pinionRadius, "繞到下方", 1e-6);
  close(xs[0], xs[xs.length - 1], "一個週期回到原處", 1e-3);
});

test("第 198 種:小齒輪不升降;走到齒條末端時把承載齒條的部分抬起,沿另一側繼續走", () => {
  const states = sweep(m198.period, 2000).map((v) => m198.rack(v));
  const lifts = states.map((s) => s.lift);
  const { H, RP } = m198.radii;
  close(Math.max(...lifts) - Math.min(...lifts), 2 * (H - RP), "齒條升降的量", 1e-6);
  const xs = states.map((s) => s.frame);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 3, "框架往返");
  // 齒條升降只發生在兩端(框架在行程的盡頭)
  const xmax = Math.max(...xs);
  const xmin = Math.min(...xs);
  for (let i = 1; i < states.length; i++) {
    if (Math.abs(lifts[i] - lifts[i - 1]) > 1e-6) assert.ok(xs[i] > xmax - 0.6 || xs[i] < xmin + 0.6, "只在兩端升降");
  }
});

test("第 199 種:燈籠式小齒輪連續旋轉,框架往復;與一側齒條嚙合時,沒有銷的那一半朝向另一側", () => {
  const { RL, PINS, WINDOW, TRAVEL } = m199.geometry;
  const xs = sweep(2 * Math.PI, 720).map((v) => m199.frame(v).x);
  close(Math.max(...xs) - Math.min(...xs), TRAVEL, "往返的行程", 1e-6);
  close(xs[0], xs[xs.length - 1], "轉一圈回到原處", 1e-9);
  for (const v of sweep(2 * Math.PI, 360)) {
    const { rack } = m199.frame(v);
    const other = rack === "top" ? -Math.PI / 2 : Math.PI / 2;
    for (let i = 0; i < PINS; i++) {
      const a = m199.pinAngle(i, v);
      const off = Math.abs(Math.atan2(Math.sin(a - other), Math.cos(a - other)));
      assert.ok(off >= WINDOW - 1e-9, `v = ${v.toFixed(2)}:另一側沒有銷`);
    }
  }
  assert.ok(RL > 0);
});
