// 第二章「齒輪傳動」:斷言對應原文(齒數比、轉向),並檢查咬合的齒不重疊
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, part, turned, assertMeshFree, sweep } from "./helpers.js";
import fig24 from "../models/fig024.js";
import fig34 from "../models/fig034.js";

test("第 24 種:正齒輪,主動輪轉 +θ 時從動輪反向轉 θ·N主/N從", () => {
  const nL = part(fig24, "left").teeth;
  const nR = part(fig24, "right").teeth;
  assert.deepEqual([nL, nR], [28, 34], "齒數照原圖");
  close(turned(fig24, "right", 0, 0.7), (-0.7 * nL) / nR);
  assertMeshFree(fig24, "left", "right", sweep(Math.PI, 60));
});

test("第 34 種:「使用內齒式齒輪時,兩者的旋轉方向相同」", () => {
  const nP = part(fig34, "pinion").teeth;
  const nR = part(fig34, "ring").teeth;
  const ring = turned(fig34, "ring", 0, 0.9);
  assert.ok(ring > 0, "內齒輪與小齒輪同向");
  close(ring, (0.9 * nP) / nR);
  assertMeshFree(fig34, "pinion", "ring", sweep(Math.PI, 60));
});

import fig27, { wheelAngle, roller, GROOVE_COUNT } from "../models/fig027.js";
import fig28, { distance, smallRadius } from "../models/fig028.js";
import fig32, { radii as radii32 } from "../models/fig032.js";
import fig40 from "../models/fig040.js";
import fig41 from "../models/fig041.js";
import fig44 from "../models/fig044.js";
import fig45, { radii as radii45 } from "../models/fig045.js";
import { sliceAngle } from "../models/gears.js";
import { signedAngle } from "../models/kit.js";

test("第 27 種:三角形輪的摩擦滾子始終在大輪的徑向溝槽內,帶動大輪轉動(同向、半速)", () => {
  close(turned(fig27, "wheel", 0, 1.2), 0.6, "大輪轉三角形輪的一半");
  const groove = (2 * Math.PI) / GROOVE_COUNT;
  for (const phi of sweep(2 * Math.PI, 36)) {
    const w = wheelAngle(phi);
    for (const k of [0, 1, 2]) {
      const p = roller(phi, k);
      if (Math.hypot(p[0], p[1]) < 1e-6) continue; // 滾子正好經過軸心
      const off = signedAngle(Math.atan2(p[1], p[0]) - w);
      const k60 = Math.round(off / groove);
      close(off, k60 * groove, `滾子 ${k} 在溝槽中心線上`, 1e-9);
    }
  }
});

test("第 28 種:改變上方輪與下方輪中心的距離,調整相對轉速", () => {
  const rate = (state) => turned(fig28, "small", 0, 1, state);
  close(rate("middle"), distance("middle") / smallRadius);
  assert.ok(rate("near") < rate("middle") && rate("middle") < rate("far"), "離中心越遠,小輪轉得越快");
});

test("第 32 種:摩擦輪靠摩擦咬合,兩輪反向轉,轉角比為半徑反比", () => {
  close(turned(fig32, "right", 0, 0.9), (-0.9 * radii32[0]) / radii32[1]);
});

for (const def of [fig40, fig41, fig44]) {
  test(`第 ${def.figure} 種:兩輪反向等速轉,每一片齒都咬合;齒沿齒面錯開,接觸更連續`, () => {
    const top = part(def, "top");
    const bottom = part(def, "bottom");
    close(turned(def, "bottom", 0, 0.7), -0.7 * (top.teeth / bottom.teeth));
    // 每一片:上輪片偏轉 δ、下輪片偏轉 −δ·N上/N下,咬合關係與整輪相同
    for (let i = 0; i < top.slices; i++) close(sliceAngle(bottom, i), (-sliceAngle(top, i) * top.teeth) / bottom.teeth, `第 ${i} 片`);
    const pitch = (2 * Math.PI) / top.teeth;
    const offsets = Array.from({ length: top.slices }, (_, i) => sliceAngle(top, i));
    assert.ok(Math.max(...offsets) - Math.min(...offsets) >= pitch * 0.7, "各片的齒錯開將近一個齒距以上");
  });
}

test("第 45 種:摩擦式溝槽傳動,兩輪反向轉,轉角比為半徑反比", () => {
  close(turned(fig45, "bottom", 0, 0.8), (-0.8 * radii45[0]) / radii45[1]);
});
