// 第十五章「平行運動與引擎」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import { lineAngle } from "../models/ruler-lines.js";

import * as m322 from "../models/fig322.js";
import * as m323 from "../models/fig323.js";
import * as m324 from "../models/fig324.js";
import * as m325 from "../models/fig325.js";
import * as m349 from "../models/fig349.js";

/** 平行尺:起始與目前的兩條線平行,且確實移開了 */
function parallelLines(def, values) {
  for (const v of values) {
    const { lineStart, lineNow } = def.pose(v).paths;
    const a = lineAngle(lineStart.points.map((p) => p.slice(0, 2)));
    const b = lineAngle(lineNow.points.map((p) => p.slice(0, 2)));
    close(a, b, "兩條線平行", 1e-12);
  }
}

test("第 322 種:一個三角形的斜邊沿另一個三角形的斜邊滑動,直角邊保持平行", () => {
  parallelLines(m322.default, sweep(1.2, 8, -1.2));
  const [dx, dy] = m322.slide(1);
  close(Math.atan2(dy, dx), Math.atan2(2.5, 4.2), "沿斜邊方向滑動", 1e-12);
});

test("第 323 種:滾輪平行尺:輪抓住紙張,尺滾動時始終與畫過的線平行;輪轉角 = 滾過的距離 / 半徑", () => {
  parallelLines(m323.default, sweep(1.5, 6, -1.5));
  close(m323.wheelAngle(0.9) * 0.45, -0.9, "輪不打滑");
});

test("第 324 種:複合平行尺:兩臂交叉、中點相連,一端樞接、一端在溝槽 B 中滑動,尺的邊緣保持平行", () => {
  parallelLines(m324.default, sweep(2.3, 8, 0.7));
  for (const h of sweep(2.3, 8, 0.7)) {
    const { xl, mid } = m324.cross(h);
    close(Math.hypot(1.85 - xl, h), 3.6, "臂長不變", 1e-9);
    close(mid[1], h / 2, "兩臂交在中點", 1e-12);
  }
});

test("第 325 種:兩根臂 C、C 構成平行四邊形,尺 A、B 的邊緣保持平行", () => {
  parallelLines(m325.default, sweep(m325.RANGE[1], 8, m325.RANGE[0]));
});

test("第 349 種:各臂在中點鉸接、以中介桿相連,尺的兩端及兩側皆保持平行", () => {
  parallelLines(m349.default, sweep(2.3, 8, 0.9));
  const poses = sweep(2.3, 4, 0.9).map((h) => m349.default.pose(h).parts.rulerTop.position[0]);
  assert.ok(poses.every((x) => x === poses[0]), "上尺只上下開合,不左右偏移");
});
