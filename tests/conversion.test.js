// 第七章「運動轉換與應用」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close } from "./helpers.js";
import fig152, { SEMI_AXES } from "../models/fig152.js";

const START = fig152.driver.initial;
const trace = (t) => fig152.pose(t).paths.ellipse.points;

test("第 152 種:橢圓規的鉛筆畫出橢圓——軌跡上每一點滿足橢圓方程式", () => {
  const [a, b] = SEMI_AXES;
  for (const [x, y] of trace(START + 4)) close((x / a) ** 2 + (y / b) ** 2, 1, "x²/a² + y²/b² = 1", 1e-9);
});

test("第 152 種:橫移桿轉一圈,軌跡閉合成完整的橢圓", () => {
  const pts = trace(START + 2 * Math.PI);
  const first = pts[0];
  const last = pts[pts.length - 1];
  close(Math.hypot(first[0] - last[0], first[1] - last[1]), 0, "首尾相接");
  const xs = pts.map((p) => p[0]);
  close(Math.max(...xs) - Math.min(...xs), 2 * SEMI_AXES[0], "橫向跨過整個長軸", 1e-3);
});

test("第 152 種:往回轉時軌跡跟著縮回(軌跡是主動量的函式)", () => {
  assert.ok(trace(START + 3).length > trace(START + 1.5).length);
  assert.ok(trace(START + 1.5).length > trace(START + 0.2).length);
  assert.equal(trace(START).length >= 2, true);
});
