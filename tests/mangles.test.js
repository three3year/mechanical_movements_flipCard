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
import * as m191 from "../models/fig191.js";
import * as m196 from "../models/fig196.js";
import * as m201 from "../models/fig201.js";
import * as m203 from "../models/fig203.js";
import * as m221 from "../models/fig221.js";
import * as m222 from "../models/fig222.js";
import { dist } from "../models/kit.js";

/** 等間隔取樣的序列:相鄰差的最大 / 最小(絕對值),量「速度變化多大」 */
function spread(values) {
  const d = values.slice(1).map((v, i) => Math.abs(v - values[i])).filter((x) => x > 1e-9);
  return Math.max(...d) / Math.min(...d);
}

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

test("第 191 種:渦形齒輪,從動輪逐漸加速", () => {
  const { R0, R1, D, MAX } = m191.geometry;
  const us = sweep(MAX, 300);
  const ratios = us.map((u) => m191.scroll(u).ratio);
  for (let i = 1; i < ratios.length; i++) assert.ok(ratios[i] > ratios[i - 1], "轉速比一直增加");
  close(ratios[0], R0 / R1, "起初較慢", 0.02);
  assert.ok(ratios[ratios.length - 1] > 1.3, "最後比主動輪快");
  for (const u of us) close(m191.scroll(u).r1 + m191.scroll(u).r2, D, "兩接觸半徑之和 = 中心距", 1e-9);
  // 純滾動:下輪轉角對上輪的導數 = r1 / r2
  const u = 2;
  close((m191.scroll(u + 1e-5).lower - m191.scroll(u - 1e-5).lower) / 2e-5, m191.scroll(u).ratio, "滾動", 1e-4);
});

test("第 196 種:小齒輪 B 等速轉,承載輪 A 的搖臂不規則地擺動,A 一直與 B 咬合", () => {
  const states = sweep(40, 800).map((a) => m196.swing(a));
  const arms = states.map((s) => s.arm);
  assert.ok(Math.max(...arms) - Math.min(...arms) > 0.1, "搖臂擺動");
  assert.ok(spread(arms) > 3, "擺動不規則(時快時慢)");
  const { r, RB } = m196.radii;
  for (const s of states.slice(0, 50)) assert.ok(dist(s.center, [0, 0, 0]) > RB + 0.6, "A 在 B 上方");
});

test("第 201 種:小齒輪(由不規則齒輪帶動)使水平臂變速擺動、桿 A 變速往復", () => {
  const rods = sweep(-2 * Math.PI, 600).map((a) => m201.motion(a).rodA);
  assert.ok(Math.max(...rods) - Math.min(...rods) > 0.3, "桿 A 往復");
  close(rods[0], rods[rods.length - 1], "不規則齒輪轉一圈回到原處", 1e-3);
  assert.ok(spread(rods) > 3, "變速");
  const pinions = sweep(-2 * Math.PI, 600).map((a) => m201.motion(a).pinion);
  for (let i = 1; i < pinions.length; i++) assert.ok(pinions[i] > pinions[i - 1], "小齒輪連續朝同一方向轉");
});

test("第 203 種:曲面開槽臂規則地擺動,直臂得到變速的擺動", () => {
  const [from, to] = m203.range;
  const straight = sweep(to, 200, from).map((a) => m203.arms(a).straight);
  const unwrap = straight.map((v) => (v < 0 ? v + 2 * Math.PI : v));
  assert.ok(spread(unwrap) > 2, "等速擺動的開槽臂,直臂時快時慢");
  for (const a of sweep(to, 50, from)) {
    const { s, length } = m203.arms(a);
    assert.ok(s > 0.2 && s < length - 0.2, "銷一直在槽內");
  }
});

test("第 221 種:橢圓輪 C 帶動小齒輪,框架上下起伏讓小齒輪保持咬合;輪 A 得到不規則的轉動", () => {
  const { r, rb, LINK, A } = m221.geometry;
  const thetas = sweep(-2 * Math.PI, 600);
  const states = thetas.map((t) => m221.train(t));
  for (const s of states) {
    close(dist(s.center, A), LINK, "框架長度不變", 1e-4);
    close(dist(s.center, [0, 0, 0]), s.contact, "小齒輪與 C 的中心距 = 接觸半徑 + 小齒輪半徑", 1e-3);
  }
  assert.ok(spread(states.map((s) => s.a)) > 3, "A 的轉動不規則");
  assert.ok(r(0) !== r(Math.PI) && rb > 0);
});

test("第 222 種:偏心轉動的普通正齒輪,以連桿維持節距;輪 A 同樣得到不規則的轉動", () => {
  const { A: rA, B: rB, C: rC } = m222.radii;
  const states = sweep(2 * Math.PI, 600).map((t) => m222.train(t));
  for (const s of states) {
    close(dist(s.b, [-1.8, 2.2, 0]), rA + rB, "框架", 1e-6);
    close(dist(s.b, s.cc), rB + rC, "連桿維持 B 與 C 的節距", 1e-6);
  }
  assert.ok(spread(states.map((s) => s.thetaA)) > 1.5, "A 的轉動不規則");
});
