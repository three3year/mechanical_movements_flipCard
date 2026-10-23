// 板件輪廓的共用作圖(models/shapes.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import { roundEnd, circle } from "../models/shapes.js";
import { pointInPolygon, signedArea } from "../models/contact.js";

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
