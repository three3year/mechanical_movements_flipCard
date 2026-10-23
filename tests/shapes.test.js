// 板件輪廓的共用作圖(models/shapes.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import { roundEnd, pinBoss, circle, signedArea } from "../models/shapes.js";
import { pointInPolygon } from "../models/contact.js";

// 長 1、寬 0.2 的平頭桿,樞軸在左端平邊的中點
const BAR = [
  [0, -0.1],
  [1, -0.1],
  [1, 0.1],
  [0, 0.1],
];

test("roundEnd:端頭平邊上的銷孔畫出圓頭後整個落在外形裡,只多出半圓", () => {
  for (const outline of [BAR, [...BAR].reverse()]) {
    const rounded = roundEnd(outline, [0, 0], 0.1);
    for (const p of circle(0.05)) assert.ok(pointInPolygon(p, rounded), `${p} 在外形外`);
    assert.ok(Math.abs(Math.abs(signedArea(rounded)) - (0.2 + (Math.PI * 0.01) / 2)) < 0.001);
    assert.ok(rounded.every(([x]) => x >= -0.1 - 1e-9 && x <= 1 + 1e-9), "圓頭往外繞,不往桿身裡繞");
  }
});

test("roundEnd:只換最靠近銷的那條邊,其他頂點照舊", () => {
  const rounded = roundEnd(BAR, [1, 0], 0.1);
  for (const p of BAR) assert.ok(rounded.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-12));
  assert.ok(rounded.some(([x]) => x > 1.09), "右端畫出圓頭");
  assert.ok(rounded.every(([x]) => x >= 0), "左端不動");
});

// 圓冠(圓被弦 |y| = h 切下、在弦外的那一塊)的面積
const cap = (r, h) => r * r * Math.acos(h / r) - h * Math.sqrt(r * r - h * h);

test("pinBoss:銷孔比端頭寬時補上圓轂,孔整個落在外形裡,只多出圓在外形外的部分", () => {
  const bar = BAR.map(([x, y]) => [x, y * 0.6]); // 半寬 0.06
  for (const outline of [bar, [...bar].reverse()]) {
    const bossed = pinBoss(outline, [0, 0], 0.09);
    for (const p of circle(0.085)) assert.ok(pointInPolygon(p, bossed), `${p} 在外形外`);
    const extra = (Math.PI * 0.0081) / 2 + cap(0.09, 0.06); // 左半圓 + 右半圓伸出上下兩緣的兩塊(各半塊)
    assert.ok(Math.abs(Math.abs(signedArea(bossed)) - (0.12 + extra)) < 0.001);
  }
});

test("pinBoss:銷在桿中段、圓轂從兩側都伸出時,兩側各補一段圓弧", () => {
  const bar = BAR.map(([x, y]) => [x, y * 0.5]); // 半寬 0.05
  const bossed = pinBoss(bar, [0.5, 0], 0.07);
  for (const p of circle(0.069, 0.5, 0)) assert.ok(pointInPolygon(p, bossed), `${p} 在外形外`);
  assert.ok(Math.abs(Math.abs(signedArea(bossed)) - (0.1 + 2 * cap(0.07, 0.05))) < 0.0005);
  for (const p of bar) assert.ok(bossed.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-12), "圓轂外的頂點照舊");
});
