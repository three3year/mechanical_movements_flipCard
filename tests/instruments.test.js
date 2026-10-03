// 第十七章「繪圖儀器」與第二十二章「儀錶與周轉輪系」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import fig500, { gauge } from "../models/fig500.js";
import * as m403 from "../models/fig403.js";
import * as m404 from "../models/fig404.js";
import * as m405 from "../models/fig405.js";
import * as m406 from "../models/fig406.js";
import * as m407 from "../models/fig407.js";
import * as m408 from "../models/fig408.js";
import * as m409 from "../models/fig409.js";
import * as m410 from "../models/fig410.js";
import * as m411 from "../models/fig411.js";
import * as m496 from "../models/fig496.js";
import fig497 from "../models/fig497.js";
import * as m498 from "../models/fig498.js";
import * as m499 from "../models/fig499.js";
import * as m501 from "../models/fig501.js";
import * as m495 from "../models/fig495.js";
import * as m502 from "../models/fig502.js";
import * as m503 from "../models/fig503.js";
import * as m504 from "../models/fig504.js";
import * as m505 from "../models/fig505.js";
import * as m506 from "../models/fig506.js";
import * as m507 from "../models/fig507.js";
import { lastWheel, armOf } from "../models/epicyclic.js";

const needle = (p) => fig500.pose(p).parts.needle.angle;

test("第 500 種:壓力越大指針轉角越大,壓力為零時指針歸零", () => {
  const zero = needle(0);
  const turns = sweep(10, 20).map((p) => zero - needle(p)); // 指針順時針轉
  close(turns[0], 0, "壓力為零時指針在零點");
  for (let i = 1; i < turns.length; i++) assert.ok(turns[i] > turns[i - 1], "壓力越大轉角越大");
  close(needle(-3), zero, "超出範圍的壓力被夾住");
});

test("第 500 種:碟片 A 的變形經扇形段 e 帶動小齒輪,轉角符合齒數比", () => {
  const sector = fig500.parts.find((p) => p.id === "sector");
  const pinion = fig500.parts.find((p) => p.id === "pinion");
  const a = gauge(2);
  const b = gauge(6);
  assert.ok(b.lift > a.lift, "壓力越大碟片拱得越高");
  close(b.pinion - a.pinion, -((b.sector - a.sector) * sector.teeth) / pinion.teeth);
});

test("第 500 種:主動件是虛擬的「壓力」,不指向零件", () => {
  assert.equal(fig500.driver.type, "virtual");
  assert.equal(fig500.driver.label, "壓力");
  assert.equal(fig500.driver.mode, "balance");
});

// ── 第十七章「繪圖儀器」(第 403–411 種) ──

const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) < eps, `${msg} 期望 ${b},實際 ${a}`);

test("第 403 種:弧線繪製儀:兩根直尺靠著弦兩端的銷滑動,夾角處的鉛筆畫出通過兩銷的圓弧", () => {
  const angles = [];
  for (const phi of [m403.RANGE[0], 1.4, Math.PI / 2, 1.8, m403.RANGE[1]]) {
    const P = m403.pencil(phi);
    near(Math.hypot(P[0] - m403.CENTER[0], P[1] - m403.CENTER[1]), m403.RADIUS, 1e-9, "鉛筆在圓上");
    const [A, B] = m403.PINS;
    const a1 = Math.atan2(A[1] - P[1], A[0] - P[0]);
    const a2 = Math.atan2(B[1] - P[1], B[0] - P[0]);
    angles.push(Math.abs(a1 - a2));
  }
  for (const a of angles) near(a, angles[0], 1e-9, "兩根直尺的夾角固定(同弦所對的圓周角相等)");
});

test("第 404 種:彈性拱形桿被螺絲彎曲,外緣始終是一段圓弧;螺絲越旋,弧越彎", () => {
  const a = m404.arch(0);
  const b = m404.arch(m404.RANGE[1]);
  assert.ok(b.h > a.h && b.r < a.r, "旋緊螺絲,弧更彎(半徑變小)");
  const pts = m404.default.pose(10).paths.bar.points;
  const s = m404.arch(10);
  for (const p of pts) near(Math.hypot(p[0] - s.center[0], p[1] - s.center[1]), s.r, 1e-9, "桿上各點在同一圓上");
});

test("第 405 種:雙曲線:鉛筆畫出的各點到兩焦點的距離差為定值(2a)", () => {
  for (const t of [m405.RANGE[0], 1.3, Math.PI / 2, 1.9, m405.RANGE[1]]) {
    const P = m405.pencil(t);
    const d1 = Math.hypot(P[0] - m405.F1[0], P[1] - m405.F1[1]);
    const d2 = Math.hypot(P[0] - m405.F2[0], P[1] - m405.F2[1]);
    near(d1 - d2, 2 * m405.A, 1e-9, "距離差 = 2a");
  }
  near(m405.pencil(Math.PI / 2)[1], m405.A, 1e-12, "直尺在中心線上時,鉛筆在頂點");
});

test("第 406 種:拋物線:鉛筆到焦點的距離等於到準線的距離", () => {
  for (const x of [-2.4, -1, 0, 1.3, 2.4]) {
    const P = m406.pencil(x);
    near(Math.hypot(P[0] - m406.FOCUS[0], P[1] - m406.FOCUS[1]), m406.DIRECTRIX - P[1], 1e-9, "到焦點 = 到準線");
  }
});

test("第 407 種:尖拱:鉛筆以銷為圓心、繩長為半徑,從拱腳畫到拱頂", () => {
  for (const a of [m407.RANGE[0], 2.4, m407.RANGE[1]]) {
    const P = m407.pencil(a);
    near(Math.hypot(P[0] - m407.CENTER[0], P[1] - m407.CENTER[1]), m407.RADIUS, 1e-9, "繩長不變(圓弧)");
  }
  near(m407.pencil(m407.RANGE[0])[0], 0, 1e-9, "拱頂在跨度的正中(等邊尖拱)");
});

test("第 408 種:中心引導器靠著兩根銷推動,葉片的畫線邊始終指向同一個會聚點", () => {
  for (const psi of sweep(m408.RANGE[1], 8, m408.RANGE[0])) {
    const pose = m408.default.pose(psi);
    const { J, angle } = m408.joint(psi);
    // 畫線邊的延長線通過會聚點
    const toV = [m408.V[0] - J[0], m408.V[1] - J[1]];
    near(Math.cos(angle) * toV[1] - Math.sin(angle) * toV[0], 0, 1e-9, "畫線邊的延長線通過會聚點");
    // 兩腿的背面靠著兩根銷
    for (const [leg, pin] of [["legA", m408.PINS[0]], ["legB", m408.PINS[1]]]) {
      const a = pose.parts[leg].angle;
      near(Math.cos(a) * (pin[1] - J[1]) - Math.sin(a) * (pin[0] - J[0]), 0, 1e-9, `${leg} 的背面通過銷`);
    }
    // 腿與葉片的夾角在接頭處鎖住
    near(pose.parts.legA.angle - pose.parts.blade.angle, m408.LEGS[0], 1e-12, "腿與葉片的夾角不變");
  }
});

test("第 409 種:比例圓規兩組尖端的距離之比,等於兩組尖端到樞軸的距離之比", () => {
  for (const [state, k] of [["same", 1], ["double", 2], ["triple", 3]]) {
    const { a, b } = m409.arms(state);
    close(b / a, k, `${state}:下尖到樞軸 / 上尖到樞軸`);
    for (const half of sweep(m409.RANGE[1], 4, m409.RANGE[0])) {
      const s = m409.spans(half, state);
      close(s.lower / s.upper, b / a, "下兩尖距 / 上兩尖距 = 到樞軸的距離比");
    }
  }
  // 兩腳交叉在樞軸上:兩腳的尖端到樞軸(原點)的距離就是 a、b
  const pose = m409.default.pose(0.3, "double");
  const { a } = m409.arms("double");
  const top = (p) => [p.position[0] - (m409.LENGTH / 2) * Math.sin(p.angle), p.position[1] + (m409.LENGTH / 2) * Math.cos(p.angle)];
  close(Math.hypot(...top(pose.parts.legA)), a, "上尖到樞軸的距離");
  assert.ok(top(pose.parts.legA)[0] > 0 && top(pose.parts.legB)[0] < 0, "兩腳交叉:上尖分在兩邊");
});

test("第 410 種:等分規無論兩夾頰相距多遠,尖頂始終在兩夾頰的正中間", () => {
  const gaps = new Set();
  for (const g of sweep(m410.RANGE[1], 24, m410.RANGE[0])) {
    const s = m410.gauge(g);
    near(s.tip[0], (s.jaws[0] + s.jaws[1]) / 2, 1e-12, "尖頂在兩夾頰的中間");
    near(Math.hypot(s.tip[0] - s.a[0], s.tip[1] - s.a[1]), m410.LINK, 1e-12, "短桿長不變");
    near(Math.hypot(s.tip[0] - s.b[0], s.tip[1] - s.b[1]), m410.LINK, 1e-12, "兩根短桿等長");
    gaps.add((s.jaws[1] - s.jaws[0]).toFixed(2));
  }
  assert.ok(gaps.size > 5, "拉到斜邊時夾頰的間距跟著改變");
});

test("第 411 種:自動記錄水平儀:輪子的圓周等於底邊;平地上擺把底邊二等分,斜面上擺朝一邊偏離", () => {
  close(2 * Math.PI * m411.WHEEL, m411.BASE, "輪子的圓周 = 三角形的底邊");
  const flat = m411.carriage(m411.RANGE[0]);
  near(flat.tilt, 0, 1e-9, "平地上托架水平");
  near(flat.offset, 0, 1e-9, "平地上擺把底邊二等分");
  // 推上坡、再推下坡:擺分別朝後、朝前偏
  const offsets = sweep(m411.RANGE[1], 60, m411.RANGE[0]).map((u) => m411.carriage(u));
  const up = offsets.reduce((m, c) => (c.tilt > m.tilt ? c : m));
  const down = offsets.reduce((m, c) => (c.tilt < m.tilt ? c : m));
  assert.ok(up.tilt > 0.1 && up.offset < -0.1, "上坡時擺朝後偏離中心");
  assert.ok(down.tilt < -0.1 && down.offset > 0.1, "下坡時擺朝前偏離中心");
  // 擺始終鉛直
  for (const c of [flat, up, down]) assert.equal(m411.default.pose(c.u).parts.pendulum.angle, 0);
  // 在平地上推過一個底邊長,輪子轉一圈,鼓輪跟著轉(由輪子帶動)
  const a = m411.carriage(m411.RANGE[0]);
  const b = m411.carriage(m411.RANGE[0] + m411.BASE * 0.1);
  near(a.wheel - b.wheel, (2 * Math.PI) * 0.1, 1e-6, "走過底邊的十分之一,輪子轉十分之一圈");
  near((a.drum - b.drum) / (a.wheel - b.wheel), m411.RATIO, 1e-12, "鼓輪由托架輪帶動");
});

test("第 496 種:牽伸與加撚:前羅拉 B 比後羅拉 A 轉得快,把粗紗拉長;錠翼繞紗管轉,加撚並捲上", () => {
  const a = m496.spin(0.1);
  assert.ok(a.b > a.a, "B 比 A 轉得快");
  close(a.out / a.feed, m496.DRAFT, "前羅拉送出的長度是後羅拉送進的 DRAFT 倍(牽伸)");
  assert.ok(a.flyer > a.bobbin && a.bobbin > 0, "錠翼比紗管轉得快,差的轉數把紗捲上");
  const def = m496.default;
  const r = (id) => def.parts.find((p) => p.id === id).radius;
  assert.ok(r("roving") > r("drafted") && r("drafted") > r("yarn"), "通過羅拉後越來越細");
});

test("第 497 種:風扇鼓風機:扇葉轉動,空氣從中心吸進,經噴口送出", () => {
  const pose = fig497.pose(1.0);
  const pts = pose.flows[0].points;
  assert.ok(pts.some((p) => Math.hypot(p[0], p[1]) < 0.5), "空氣從中心進來");
  assert.ok(pts.some((p) => p[0] > 1.9), "從噴口送出");
});

test("第 498 種:虹吸式壓力計:受壓的一側水銀下降、另一側上升,高度差與壓力成正比", () => {
  const zero = m498.levels(0);
  close(zero.left, zero.right, "壓力為零時兩邊一樣高");
  for (const p of [1, 3, 6]) {
    const l = m498.levels(p);
    assert.ok(l.left < zero.left && l.right > zero.right, "接鍋爐那側下降、開口那側上升");
    close(l.right - l.left, p * m498.UNIT, "高度差與壓力成正比");
    close(zero.left - l.left, l.right - zero.right, "兩管腳粗細相同:一邊降多少、另一邊升多少");
  }
});

test("第 499 種:布爾登壓力計:壓力使彎管伸直,兩端經扇形段與小齒輪帶動指針", () => {
  const a = m499.bourdon(2);
  const b = m499.bourdon(8);
  assert.ok(b.r > a.r, "壓力越大,彎管越直(彎曲半徑越大)");
  close(b.r * b.span, m499.R0 * m499.bourdon(0).span, "管長不變", 1e-9);
  assert.ok(b.sector > a.sector, "管端移動推轉扇形段");
  assert.ok(b.pinion < a.pinion, "指針(小齒輪)隨之轉動");
});

test("第 501 種:水銀氣壓計:長管腳的水銀柱由大氣壓力支撐,隨氣壓升降", () => {
  const lo = m501.columns(28.5);
  const hi = m501.columns(30.5);
  assert.ok(hi.long > lo.long, "氣壓高,長管腳的水銀柱升高");
  assert.ok(hi.short < lo.short, "短管腳的水銀面下降");
  close(hi.height - lo.height, 2 * m501.SCALE, "水銀柱高度差隨氣壓(英吋)成正比");
});

test("周轉輪系的 Willis 公式:臂不轉時就是定軸輪系;末輪與臂的關係可以互推", () => {
  close(lastWheel(1, 0, -2), -2, "臂不動:末輪 = 輪系值 × 首輪");
  close(armOf(1, lastWheel(1, 0.3, -2), -2), 0.3, "由兩端輪反推臂");
  close(lastWheel(0.7, 0.7, 5), 0.7, "首輪與臂一起轉:整組像剛體");
});

test("第 495 種:Entwistle 齒輪:A 固定、三輪一樣大時,軸 D 每轉一圈,C 轉兩圈", () => {
  close(m495.wheelC(2 * Math.PI), 4 * Math.PI, "D 一圈,C 兩圈");
  close(m495.wheelC(-1), -2, "反轉亦然");
});

test("第 502 種:周轉輪系:A 固定時框架的轉動經 F、E 傳給 B;A 也轉時 B 的轉速不同;末輪也可以是與框架同心的 D", () => {
  const fixed = m502.train(1, "bFixedA");
  close(fixed.last, 1 + m502.E_AB * (0 - 1), "B = 框架 + e(A − 框架)");
  const turning = m502.train(1, "bTurningA");
  assert.notEqual(turning.last.toFixed(6), fixed.last.toFixed(6), "A 也轉時 B 的轉速不同");
  const d = m502.train(1, "dFixedA");
  assert.equal(d.which, "D");
  close(m502.E_AB, (24 * 24) / (18 * 18), "輪系值 = (A/F)(E/B)");
});

test("第 503 種:簡單的傘齒輪周轉輪系:臂的轉動是兩個輪 C、D 的平均", () => {
  close(m503.differential(1, "fixed").arm, 0.5, "D 固定:臂轉 C 的一半");
  close(m503.differential(1, "opposite").arm, 0, "C、D 反向同速:臂不轉");
  close(m503.differential(1, "same").arm, 1, "C、D 同向同速:臂跟著轉");
});

test("第 504 種:弗格森悖論:臂轉動時 F 不轉,E 朝一個方向慢慢轉,G 朝另一個方向慢慢轉", () => {
  const turns = (x) => m504.trainToTurns(x);
  close(turns("F"), 0, "F(20 齒,與 A 同)不轉,始終指向同一方向");
  close(turns("E"), 1 / 21, "E(21 齒)與臂同向轉 1/21 圈");
  close(turns("G"), -1 / 19, "G(19 齒)與臂反向轉 1/19 圈");
  const p = m504.paradox(2 * Math.PI);
  assert.ok(p.E > 0 && p.G < 0 && Math.abs(p.F) < 1e-9, "三個輪轉向各不相同");
});

test("第 505 種:臂帶著小齒輪 B 咬正齒輪 A 與內齒輪 C;固定其中一個,另一個就被帶動", () => {
  const { A, C } = m505.TEETH;
  close(m505.wheels(1, "C").A, 1 + C / A, "C 固定:A 轉 (1 + C/A) 倍");
  close(m505.wheels(1, "A").C, 1 + A / C, "A 固定:C 轉 (1 + A/C) 倍");
  assert.equal(m505.wheels(1, "C").C, 0);
});

test("第 506 種:兩端都不固定的周轉輪系:主動軸經 a、b 與 h、g 帶動兩端,臂得到合成的(很慢的)轉動;改接法時 f 得到合成轉動", () => {
  const t = m506.train(1, "original");
  close(t.arm, (t.c + t.f) / 2, "臂 = 兩端輪的平均(c、f 一樣大)");
  assert.ok(Math.abs(t.arm) < 0.05, "兩端速度相近、方向相反,臂轉得很慢");
  const m = m506.train(1, "modified");
  close(m.arm, m.g, "改過的接法:臂跟著 g 轉");
  close(m.f, 2 * m.g - m.c, "f 是合成的結果");
});

test("第 507 種:產生極慢運動的周轉輪系:照原文的齒數,C 每轉一圈,臂轉 25,000 圈", () => {
  close(Math.abs(m507.slow(1).arm), 25000, "臂 / C = 25,000", 1e-6);
  close(Math.abs(1 / m507.C_PER_ARM), 25000, "反過來,臂轉一圈 C 只轉 1/25,000 圈", 1e-6);
});
