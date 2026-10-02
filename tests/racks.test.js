// 第六章「齒條與小齒輪」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import { rackX, pitch as pitch113 } from "../models/fig113.js";
import { frameX as frame114, stroke as stroke114 } from "../models/fig114.js";
import fig115, { drive as drive115 } from "../models/fig115.js";
import { motion as motion116, stroke as stroke116 } from "../models/fig116.js";
import { endless, halfLength } from "../models/fig119.js";
import { jaws } from "../models/fig120.js";

const TAU = 2 * Math.PI;

test("第 113 種:齒條與小齒輪——小齒輪轉一圈,齒條移動節圓周長(14 齒 × 齒距)", () => {
  close(rackX(TAU) - rackX(0), -14 * pitch113, "逆時針轉,齒條往左");
  close(rackX(1) - rackX(0), -0.7, "移動量 = 節圓半徑 × 轉角");
});

test("第 114 種:缺齒式小齒輪交替帶動上下齒條,框架往復直線運動,兩端各停一下", () => {
  const xs = sweep(TAU * 2, 1440).map(frame114);
  close(Math.max(...xs) - Math.min(...xs), stroke114, "行程 = 有齒段的弧長", 1e-9);
  let still = 0;
  for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - xs[i - 1]) < 1e-12) still++;
  assert.ok(still > 50, "兩段之間停住");
  close(frame114(TAU), frame114(0), "每圈回到原處");
});

test("第 115 種:兩個同樣大小的齒輪使雙齒條框架直線移動,兩側等速", () => {
  const a = drive115(0.4);
  const b = drive115(0);
  close(a.x - b.x, a.bottomX - b.bottomX, "上下齒條移動量相等");
  close(Math.abs(a.x - b.x), 0.72 * 0.4, "= 節圓半徑 × 轉角");
  assert.equal(fig115.parts.find((p) => p.id === "upper").teeth, fig115.parts.find((p) => p.id === "lower").teeth);
});

test("第 116 種:雙齒條框架往復,總有一個小齒輪經棘輪帶動軸,軸均勻地單向旋轉", () => {
  const s = sweep(stroke116 * 6, 300).map((v) => motion116(v).shaft);
  for (let i = 1; i < s.length; i++) assert.ok(s[i] < s[i - 1], "軸一直順時針轉");
  close(s[1] - s[0], s[2] - s[1], "等速", 1e-9);
  // 兩個小齒輪在同一程中反向轉
  const a = motion116(0.3);
  const b = motion116(0.5);
  assert.ok((b.front - a.front) * (b.back - a.back) < 0);
});

test("第 119 種:小齒輪均勻旋轉,交替作用於長圓無端齒條的上下方,使桿往復直線運動", () => {
  const xs = sweep(30, 3000).map((a) => endless(a).x);
  const ys = sweep(30, 3000).map((a) => endless(a).y);
  close(Math.max(...xs) - Math.min(...xs), 2 * halfLength + 2 * (Math.max(...ys)), "行程 = 直線段 + 兩端半圓", 1e-3);
  assert.ok(Math.max(...ys) > 0 && Math.min(...ys) < 0, "小齒輪在開槽桿內上下移動");
  // 在上方時桿往左、在下方時往右
  const top = endless(0.2).x - endless(0.1).x;
  assert.ok(top < 0);
});

test("第 120 種:轉動小齒輪軸,兩支夾爪朝相反方向等角擺動、併攏", () => {
  const a = jaws(0);
  const b = jaws(-0.8);
  const d1 = b.s1 - a.s1;
  const d2 = b.s2 - a.s2;
  assert.ok(d1 * d2 < 0, "兩爪反向");
  close(Math.abs(d1), Math.abs(d2), "擺動角度相等", 1e-9);
});

import { rackShape, gearProfile } from "../models/shapes.js";
import { pointInPolygon } from "../models/contact.js";
import { rot2 } from "../models/kit.js";

test("第 113 種:任何轉角下小齒輪的齒都嵌在齒條的齒槽裡、不重疊", () => {
  const pinion = { teeth: 14, radius: 0.7 };
  const rack = rackShape({ teeth: 19, pitch: pitch113, depth: 0.35 }).outline;
  for (const a of sweep(2.6, 60, -2.6)) {
    const x = rackX(a);
    // 齒條轉了 180°(齒朝下),節線在 y = 0.7
    const world = rack.map(([px, py]) => [x - px, 0.7 - py]);
    for (const p of gearProfile(pinion)) {
      const q = rot2(p, a);
      assert.ok(!pointInPolygon(q, world), `轉角 ${a.toFixed(2)} 時小齒輪的齒伸進齒條`);
    }
  }
});


import fig117, { pitchAt, yokeY, breadth } from "../models/fig117.js";
import { doubler } from "../models/fig118.js";
import { feed, swingAngle } from "../models/fig121.js";
import { linkage, rods as rods122 } from "../models/fig122.js";
import { substitute, stroke as stroke123 } from "../models/fig123.js";
import { compound } from "../models/fig125.js";

test("第 117 種:凸輪在軛內兩個滾子之間轉動,軛做往復運動;兩個滾子始終同時貼著凸輪", () => {
  const ys = sweep(TAU, 360).map(yokeY);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 0.5, "軛有明顯的行程");
  for (const phi of sweep(TAU, 36)) close(pitchAt(phi) + pitchAt(phi + Math.PI), breadth, "上下滾子中心距不變");
  assert.ok(fig117.parts.length >= 2);
});

test("第 118 種:下齒條固定,小齒輪一邊前進一邊滾動,上齒條移動小齒輪的兩倍距離", () => {
  close(doubler(0.8).upper - doubler(0).upper, 1.6, "行程加倍");
  close(doubler(-0.5).upper - doubler(0).upper, -1.0);
});

test("第 121 種:碟形輪往復擺動,制動爪使棘輪間歇地單向轉動;翻轉制動爪則反向", () => {
  const cw = sweep(swingAngle * 6, 300).map((v) => feed(v, 1).cog);
  for (let i = 1; i < cw.length; i++) assert.ok(cw[i] <= cw[i - 1] + 1e-12, "只往一個方向轉");
  close(feed(swingAngle * 2, 1).cog - feed(0, 1).cog, -swingAngle, "每次往復推進一次");
  close(feed(swingAngle * 2, -1).cog - feed(0, -1).cog, swingAngle, "翻轉後反向");
  const back = sweep(swingAngle * 2, 10, swingAngle).map((v) => feed(v, 1).cog);
  for (const c of back) close(c, back[0], "回程不動");
});

test("第 122 種:兩個轉速不同的齒輪經連桿使水平桿做變速的交替橫移,連桿長度不變", () => {
  const xs = sweep(TAU * 6, 600).map((t) => linkage(t).x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.3, "水平桿往復");
  for (const t of sweep(TAU * 6, 60)) {
    const { w1, w2, a, b } = linkage(t);
    close(Math.hypot(a[0] - w1[0], a[1] - w1[1]), rods122.l1, "上連桿長度", 1e-6);
    close(Math.hypot(b[0] - w2[0], b[1] - w2[1]), rods122.l2, "下連桿長度", 1e-6);
  }
  // 齒數比 26 : 22,同一個輪的轉角下兩手腕相位一直在變:每一趟的行程不盡相同
  const span = (from) => {
    const seg = sweep(from + TAU, 200, from).map((t) => linkage(t).x);
    return Math.max(...seg) - Math.min(...seg);
  };
  assert.ok(Math.abs(span(0) - span(TAU * 2)) > 1e-3, "變速、每圈的行程不同");
});

test("第 123 種:雙齒條往復,兩個齒扇形段交替嚙合,中央齒輪連續朝同一方向旋轉", () => {
  const c = sweep(stroke123 * 6, 300).map((v) => substitute(v).central);
  const dir = Math.sign(c[c.length - 1] - c[0]);
  assert.ok(dir !== 0);
  for (let i = 1; i < c.length; i++) assert.ok((c[i] - c[i - 1]) * dir > 0, "中央齒輪一直朝同一方向轉");
  const ys = sweep(stroke123 * 4, 400).map((v) => substitute(v).y);
  close(Math.max(...ys) - Math.min(...ys), stroke123, "齒條往復一個行程", 1e-9);
});

test("第 125 種:三個齒輪的曲柄銷經兩層槓桿合成,頂桿做變化的上下運動", () => {
  const tops = sweep(TAU * 4, 400).map((t) => compound(t).top[1]);
  assert.ok(Math.max(...tops) - Math.min(...tops) > 0.2, "頂桿上下運動");
  const { pins, u1 } = compound(1.3);
  close(Math.hypot(u1[0] - pins[0][0], u1[1] - pins[0][1]), 4.0, "連桿長度不變", 1e-9);
});

import { spindleAngle, pulleyRadius } from "../models/fig124.js";
import { crank, arms as arms126 } from "../models/fig126.js";
import { racks as racks127 } from "../models/fig127.js";

test("第 124 種:提琴式鑽——弓往復拉動,弦帶著鑽軸交替正反旋轉(弓移動量 = 輪緣轉過的弧長)", () => {
  close(spindleAngle(0.6) - spindleAngle(0), -0.6 / pulleyRadius);
  assert.ok((spindleAngle(0.5) - spindleAngle(0)) * (spindleAngle(-0.5) - spindleAngle(0)) < 0, "來回拉時轉向相反");
});

test("第 126 種:曲柄搖臂改變力的方向——往下拉繩,直臂下端往左(水平)移動", () => {
  const a = crank(0);
  const b = crank(0.5);
  close(b.across[1] - a.across[1], 0.5, "橫臂端被拉起的量 = 繩被拉下的量");
  assert.ok(b.down[0] < a.down[0], "直臂下端往左");
  close(Math.hypot(b.down[0] - 1.45, b.down[1] + 0.95), arms126.down, "直臂長度不變");
});

test("第 127 種:槓桿振動,齒輪兩側的齒條一根上升時另一根下降", () => {
  const a = racks127(0);
  const b = racks127(0.4);
  assert.ok((b.left - a.left) * (b.right - a.right) < 0, "兩根齒條反向");
  close(Math.abs(b.left - a.left), 1.05 * 0.4, "移動量 = 節圓半徑 × 轉角");
});
