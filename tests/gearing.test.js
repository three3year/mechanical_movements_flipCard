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
