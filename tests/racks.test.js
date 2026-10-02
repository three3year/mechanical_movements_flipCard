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
