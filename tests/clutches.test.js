// 齒輪傳動末段與第三章「離合與變速」:離合器、萬向接頭(斷言對應原文)
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, turned, sweep } from "./helpers.js";
import fig47 from "../models/fig047.js";
import fig48 from "../models/fig048.js";
import fig49, { motion as motion49, RATCHET as RATCHET49 } from "../models/fig049.js";
import fig50 from "../models/fig050.js";
import fig51, { shaftAngle } from "../models/fig051.js";
import fig52 from "../models/fig052.js";
import fig53 from "../models/fig053.js";

for (const [def, shaft] of [[fig47, "shaft"], [fig48, "shaft"], [fig52, "shaft"]]) {
  test(`第 ${def.figure} 種:接合時軸隨主動件轉,脫開時軸停住、主動件照轉`, () => {
    assert.notEqual(turned(def, shaft, 0, 1, "engaged"), 0, "接合時軸會轉");
    assert.equal(turned(def, shaft, 0, 1, "free"), 0, "脫開時軸不動");
    assert.notEqual(turned(def, def.driver.part, 0, 1, "free"), 0, "主動件照轉");
  });
}

test("第 48 種:接合時兩半的爪錯開半個爪距、互相卡住;脫開時滑動半退開", () => {
  const on = fig48.pose(0.7, "engaged").parts;
  const off = fig48.pose(0.7, "free").parts;
  close(on.slider.angle - on.gear.angle, Math.PI / 4, "爪錯開半個爪距");
  assert.ok(off.slider.position[0] > on.slider.position[0], "脫開時往右退");
});

test("第 49 種:水平軸往復擺動,直立軸連續朝同一方向轉", () => {
  const span = fig49.driver.cycle[1] - fig49.driver.cycle[0];
  const shaft = sweep(span * 4, 200).map((v) => motion49(v).shaft);
  assert.ok(Math.max(...shaft) - Math.min(...shaft) <= span + 1e-9, "水平軸只在範圍內往復");
  const top = sweep(span * 4, 200).map((v) => motion49(v).top);
  const dir = Math.sign(top[top.length - 1] - top[0]);
  assert.ok(dir !== 0);
  for (let i = 1; i < top.length; i++) assert.ok((top[i] - top[i - 1]) * dir >= -1e-9, "直立軸不倒轉");
});

test("第 49 種:兩個斜齒輪反向轉,推程時左輪隨軸、回程時右輪隨軸", () => {
  const span = fig49.driver.cycle[1] - fig49.driver.cycle[0];
  const a = motion49(0.2 * span);
  const b = motion49(0.4 * span);
  close(b.left - a.left, b.shaft - a.shaft, "推程:左輪與軸同轉");
  const c = motion49(1.2 * span);
  const d = motion49(1.4 * span);
  close(-(d.right - c.right), d.shaft - c.shaft, "回程:右輪(繞 +x)與軸同轉");
});

test("第 49 種:每一趟帶動時,棘爪都頂在棘輪的同一個齒位上(來回一趟是整數個齒,不會一趟趟錯開)", () => {
  const span = fig49.driver.cycle[1] - fig49.driver.cycle[0];
  const pitch = (2 * Math.PI) / RATCHET49.teeth;
  const offset = (v, id) => {
    const p = fig49.pose(v).parts;
    const d = (p[id].angle - p.shaft.angle) / pitch;
    return d - Math.round(d);
  };
  for (let k = 1; k < 4; k++) {
    close(offset((2 * k + 0.5) * span, "ratchetL"), offset(0.5 * span, "ratchetL"), `第 ${k} 趟推程:左棘爪`, 1e-9);
    close(offset((2 * k + 1.5) * span, "ratchetR"), offset(1.5 * span, "ratchetR"), `第 ${k} 趟回程:右棘爪`, 1e-9);
  }
});

test("第 50 種:兩個萬向接頭串接、夾角相等,輸出軸與輸入軸等速轉", () => {
  for (const a of sweep(2 * Math.PI, 36)) close(turned(fig50, "output", 0, a), a, `輸入轉 ${a}`, 1e-9);
});

test("第 51 種:萬向接頭把旋轉傳到成角度的軸;每圈平均轉速相同,轉速在 cosβ 與 1/cosβ 之間變化", () => {
  close(turned(fig51, "output", 0, 2 * Math.PI), 2 * Math.PI, "一圈對一圈", 1e-9);
  const h = 1e-4;
  const rates = sweep(2 * Math.PI, 720).map((a) => (fig51.pose(a + h).parts.output.angle - fig51.pose(a - h).parts.output.angle) / (2 * h));
  close(Math.max(...rates), 1 / Math.cos(shaftAngle), "最快", 1e-3);
  close(Math.min(...rates), Math.cos(shaftAngle), "最慢", 1e-3);
});

test("第 53 種:雙離合器接合左輪或右輪,水平軸朝相反方向轉;置中時不轉", () => {
  const left = turned(fig53, "shaft", 0, 0.5, "left");
  const right = turned(fig53, "shaft", 0, 0.5, "right");
  assert.ok(left * right < 0, "左右轉向相反");
  close(Math.abs(left), Math.abs(right));
  assert.equal(turned(fig53, "shaft", 0, 0.5, "neutral"), 0);
});

import fig54, * as fig54m from "../models/fig054.js";
import fig55, { A as A55, C as C55 } from "../models/fig055.js";
import fig56 from "../models/fig056.js";
import fig57, { train, teeth as teeth57 } from "../models/fig057.js";

test("第 54 種:星形輪產生交替方向的旋轉——小齒輪 A 轉向不變,穿過開口換到齒條另一面時輪與 B 都反轉", () => {
  const { mangle, PERIOD, TRAVEL } = fig54m;
  const l = PERIOD / 2;
  const first = turned(fig54, "wheel", 0.1 * l, 0.4 * l);
  const second = turned(fig54, "wheel", l + 0.1 * l, l + 0.4 * l);
  assert.ok(first * second < 0, "輪前後兩程反向");
  close(first, -second);
  assert.ok(turned(fig54, "pinionB", 0.1 * l, 0.4 * l) * turned(fig54, "pinionB", l + 0.1 * l, l + 0.4 * l) < 0, "B 跟著交替");
  // 一程轉將近一圈(開口以外的齒條都走過),換面時輪停住、A 從前面移到後面
  close(Math.abs(mangle(l - 1e-6).wheel - mangle(0).wheel), TRAVEL, "單程轉過整排齒條", 1e-6);
  assert.ok(mangle(0.3 * l).z > 0 && mangle(1.3 * l).z < 0, "前一程 A 在前面,後一程在後面");
  const atTurn = sweep(l * 1.0, 10, l * 0.93).map(mangle);
  assert.ok(atTurn.every((m) => Math.abs(m.wheel - atTurn[0].wheel) < 1e-9), "換面時輪停住");
  close(mangle(PERIOD + 0.37).wheel, mangle(0.37).wheel, "週期性", 1e-9);
  // 開口轉到 B 下方時 B 沒有齒條可咬、停住;其餘時間輪一轉 B 就轉;一個週期後 B 回到同一個相位
  const { wheelForB } = fig54m;
  let stillInGap = 0;
  let gapSamples = 0;
  for (const t of sweep(PERIOD, 800)) {
    const a = fig54.pose(t).parts;
    const b = fig54.pose(t + 1e-3).parts;
    const inGap = Math.abs(wheelForB(b.wheel.angle) - wheelForB(a.wheel.angle)) < 1e-9 && Math.abs(b.wheel.angle - a.wheel.angle) > 1e-9;
    if (inGap) {
      gapSamples++;
      if (Math.abs(b.pinionB.angle - a.pinionB.angle) < 1e-9) stillInGap++;
    }
  }
  assert.ok(gapSamples > 20 && stillInGap === gapSamples, "開口經過 B 時 B 停住");
  close(fig54.pose(PERIOD + 0.37).parts.pinionB.angle, fig54.pose(0.37).parts.pinionB.angle, "B 的相位週期相接", 1e-9);
});

test("第 55 種:同一軸線上的 A 與 C 經小齒輪產生不同的轉速(反向,齒數反比)", () => {
  close(turned(fig55, "c", 0, 1), -(A55.teeth / C55.teeth));
});

test("第 56 種:按下槓桿時大齒輪的軸被往後拉、退出嚙合,主軸照轉而大齒輪停住", () => {
  const on = fig56.pose(0.5, "engaged").parts.gear;
  const off = fig56.pose(0.5, "free").parts.gear;
  assert.ok(off.position[0] < on.position[0], "大齒輪往後退");
  assert.notEqual(turned(fig56, "gear", 0, 1, "engaged"), 0);
  assert.equal(turned(fig56, "gear", 0, 1, "free"), 0);
});

test("第 57 種:大齒輪與同心齒輪被皮帶以相反方向驅動,中間小齒輪既自轉又繞共同中心公轉", () => {
  const a = train(0);
  const b = train(0.6);
  assert.ok((b.ring - a.ring) * (b.sun - a.sun) < 0, "兩個同心齒輪反向");
  assert.notEqual(b.carrier, a.carrier, "小齒輪繞共同中心公轉");
  assert.notEqual(b.planet, a.planet, "小齒輪自轉");
  // 周轉輪系:以行星架為參考,大齒輪與同心齒輪的相對轉角比為 −N日/N環
  const dc = b.carrier - a.carrier;
  close((b.ring - a.ring - dc) / (b.sun - a.sun - dc), -teeth57.sun / teeth57.ring);
});
