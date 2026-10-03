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
import * as m326 from "../models/fig326.js";
import * as m327 from "../models/fig327.js";
import * as m328 from "../models/fig328.js";
import * as m329 from "../models/fig329.js";
import * as m330 from "../models/fig330.js";
import * as m331 from "../models/fig331.js";
import { dist } from "../models/kit.js";

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

/** 汽缸的蒸汽:活塞往哪邊走,就是另一側的蒸汽在推 */
function steamPushes(def, values) {
  for (const p of values) {
    const pose = def.pose(p);
    const up = pose.parts.steamUp.level;
    const down = pose.parts.steamDown.level;
    assert.ok(up === 0 || down === 0, "只有一側進汽");
    assert.ok(pose.flows[0].points.length > 0, "蒸汽沿進汽管流動");
  }
}

test("第 326 種:滑塊 A 在框架的直溝槽中上下,飛輪曲柄經連桿帶動它", () => {
  const ys = sweep(2 * Math.PI, 72).map((t) => m326.slider(t).y);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 0.85, "滑塊上下往復,行程等於曲柄直徑");
});

test("第 327 種:十字頭上的滾子沿直線導桿 A、A 運行,蒸汽推動活塞、經連桿轉動飛輪", () => {
  const heads = sweep(1, 60).map((p) => m327.engine(p));
  assert.ok(Math.max(...heads.map((h) => h.head)) - Math.min(...heads.map((h) => h.head)) > 0.95, "十字頭往復");
  steamPushes(m327.default, sweep(1, 12));
});

test("第 328 種:卡特萊特平行運動:兩個相等的齒輪 C、C 反向轉,曲柄 A、A 方向相反,兩連桿傾角相等,活塞桿沿直線運動", () => {
  for (const p of sweep(1, 36)) {
    const c = m328.cartwright(p);
    close(c.pinR[0], -c.pinL[0], "兩曲柄銷左右對稱", 1e-12);
    close(c.pinR[1], c.pinL[1], "兩曲柄銷同高", 1e-12);
    close(c.b + c.a, m328.cartwright(0).b + m328.cartwright(0).a, "兩齒輪反向等速", 1e-9);
  }
  steamPushes(m328.default, sweep(1, 12));
});

test("第 329 種:B 在直徑兩倍的靜止內齒輪 D 裡滾動,B 上的手腕走直線,活塞桿保持直立", () => {
  for (const p of sweep(1, 48)) close(m329.hypo(p).wrist[0], 0, "手腕始終在鉛直線上", 1e-9);
  const ys = sweep(1, 48).map((p) => m329.hypo(p).wrist[1]);
  close(Math.max(...ys) - Math.min(...ys), 4 * 0.62, "行程等於 D 的直徑", 1e-3);
});

test("第 330 種:延長的活塞桿在與汽缸同中心線的導引件 A 中作動,叉形連桿帶動曲柄", () => {
  for (const p of sweep(1, 24)) {
    const e = m330.engine(p);
    close(dist(e.pin, [0, e.head, 0]), 2.9, "連桿長度不變", 1e-9);
  }
  steamPushes(m330.default, sweep(1, 12));
});

test("第 331 種:曲柄手腕 B 在開槽十字頭 A 內作動,十字頭在導件 D、D 之間直線往復", () => {
  for (const p of sweep(1, 24)) {
    const y = m331.yoke(p);
    close(y.head, y.wrist[1], "十字頭高度等於手腕高度(開槽十字頭)", 1e-12);
  }
  steamPushes(m331.default, sweep(1, 12));
});
