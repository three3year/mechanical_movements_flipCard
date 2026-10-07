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
import * as m332 from "../models/fig332.js";
import * as m333 from "../models/fig333.js";
import * as m334 from "../models/fig334.js";
import * as m335 from "../models/fig335.js";
import * as m336 from "../models/fig336.js";
import * as m337 from "../models/fig337.js";
import { verticalDeviation } from "../models/parallel-motion.js";
import * as m338 from "../models/fig338.js";
import * as m339 from "../models/fig339.js";
import * as m340 from "../models/fig340.js";
import * as m341 from "../models/fig341.js";
import * as m342 from "../models/fig342.js";
import * as m343 from "../models/fig343.js";
import * as m344 from "../models/fig344.js";
import * as m345 from "../models/fig345.js";
import * as m346 from "../models/fig346.js";
import * as m347 from "../models/fig347.js";
import * as m348 from "../models/fig348.js";

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
  // 「滾子抵著直線導桿 A、A 運行」:滾子貼著導桿滾、不打滑,兩側滾子反向轉
  const [a, b] = [m327.default.pose(0.1).parts, m327.default.pose(0.2).parts];
  const dy = b.rollerR.position[1] - a.rollerR.position[1];
  close((b.rollerR.angle - a.rollerR.angle) * 0.16, -dy, "右滾子轉過的弧長 = 十字頭位移", 1e-9);
  close(b.rollerL.angle - a.rollerL.angle, -(b.rollerR.angle - a.rollerR.angle), "左右滾子反向轉", 1e-9);
});

test("第 328 種:卡特萊特平行運動:兩個相等的齒輪 C、C 反向轉,曲柄 A、A 方向相反,兩連桿傾角相等,活塞桿沿直線運動", () => {
  for (const p of sweep(1, 36)) {
    const c = m328.cartwright(p);
    close(c.pinR[0], -c.pinL[0], "兩曲柄銷左右對稱", 1e-12);
    close(c.pinR[1], c.pinL[1], "兩曲柄銷同高", 1e-12);
    close(c.b + c.a, m328.cartwright(0).b + m328.cartwright(0).a, "兩齒輪反向等速", 1e-9);
  }
  steamPushes(m328.default, sweep(1, 12));
  // 後方的飛輪由右齒輪 C 經飛輪軸上的小齒輪帶動:與右齒輪反向,轉速是齒數比(16 / 8)倍
  const [a, b] = [m328.default.pose(0.1).parts, m328.default.pose(0.15).parts];
  close((b.flywheel.angle - a.flywheel.angle) / (b.gearR.angle - a.gearR.angle), -2, "飛輪對右齒輪的轉速比", 1e-6);
  close(b.pinion.angle, b.flywheel.angle, "小齒輪與飛輪同軸", 1e-12);
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
  // 後方的飛輪裝在曲柄軸上,跟著轉
  assert.ok(m331.default.parts.find((q) => q.id === "crank").pieces.some((q) => q.kind === "plate" && q.at?.[2] === -0.7), "飛輪是曲柄軸的一部分");
});

/** 一串點離它們的最佳直線(首尾連線)的最大偏差 */
function lineDeviation(points) {
  const [a, b] = [points[0], points[points.length - 1]];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return Math.max(...points.map((p) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len));
}

for (const [n, m] of [[332, m332], [336, m336]]) {
  test(`第 ${n} 種:船舶側槓桿引擎:平行運動導引十字頭,活塞桿沿直線往復`, () => {
    const es = sweep(1, 60).map((p) => m.motion(p).E);
    assert.ok(verticalDeviation(es) < 1e-12, "十字頭沿汽缸中心線");
    const ys = es.map((e) => e[1]);
    assert.ok(Math.max(...ys) - Math.min(...ys) > 0.8, "活塞往復");
    steamPushes(m.default, sweep(1, 8));
  });
}

test("第 333 種:特殊的平行運動(依原圖):樑由兩根桿撐著,左上端 T 與吊桿中段 J1 都走近似直線", () => {
  const rows = sweep(m333.RANGE[1], 30, m333.RANGE[0]).map((v) => m333.linkage(v));
  for (const key of ["T", "J1"]) {
    const ps = rows.map((r) => r[key]);
    const span = dist(ps[0], ps[ps.length - 1]);
    assert.ok(span > 0.5, `${key} 有行程`);
    assert.ok(lineDeviation(ps) / span < 0.03, `${key} 偏離直線不到行程的 3%`);
  }
  const hr = rows.map((r) => dist(r.H, r.R));
  close(Math.max(...hr) - Math.min(...hr), 0, "樑是剛體(H–R 不變)", 1e-6);
});

test("第 334 種:活塞桿是一根直齒條,與樑上的扇形段咬合、背面抵著滾子 A,活塞桿走直線,位移 = 扇形段節圓弧長", () => {
  const a = m334.rack(0.1).offset - m334.rack(0).offset;
  close(Math.abs(a), 2.85 * 0.1, "齒條位移 = 節圓半徑 × 轉角", 1e-9);
  // 弓頭 D 以鏈條吊著的抽水桿:位移 = 弓頭半徑 × 轉角,和活塞桿同向
  const b = m334.pumpTop(0.1) - m334.pumpTop(0);
  close(Math.abs(b), 1.35 * 0.1, "抽水桿位移 = 弓頭半徑 × 轉角", 1e-9);
  assert.ok(Math.sign(a) === Math.sign(b), "抽水桿與活塞桿同向");
});

test("第 335 種:固定式樑式引擎的平行運動:活塞桿頭的軌跡近似直線", () => {
  const ps = sweep(m335.RANGE[1], 30, m335.RANGE[0]).map((v) => m335.parallel(v).P);
  const ys = ps.map((p) => p[1]);
  assert.ok(verticalDeviation(ps) / (Math.max(...ys) - Math.min(...ys)) < 0.01, "偏離鉛直線不到行程的 1%");
});

test("第 337 種:半徑桿接在短振動桿的下端,振動桿中點(活塞桿)的軌跡近似直線", () => {
  const ps = sweep(m337.RANGE[1], 30, m337.RANGE[0]).map((v) => m337.watt(v).P);
  const ys = ps.map((p) => p[1]);
  assert.ok(verticalDeviation(ps) / (Math.max(...ys) - Math.min(...ys)) < 0.03, "偏離鉛直線不到行程的 3%");
});

/** 近似直線:偏離鉛直線不到行程的 tol */
function straightish(points, tol) {
  const ys = points.map((p) => p[1]);
  const span = Math.max(...ys) - Math.min(...ys);
  assert.ok(span > 0.3, "有行程");
  assert.ok(verticalDeviation(points) / span < tol, `偏離鉛直線 ${(verticalDeviation(points) / span).toFixed(4)},超過行程的 ${tol}`);
}

test("第 338 種:半徑桿置於樑的上方,活塞桿接點的軌跡近似直線", () => {
  straightish(sweep(m338.RANGE[1], 30, m338.RANGE[0]).map((v) => m338.watt(v).P), 0.03);
});

test("第 339 種:B 端在固定溝槽 D 中滑動、C 端接活塞桿,半徑桿 F–A 接在 B–C 的中點:C 走直線", () => {
  for (const p of sweep(1, 30)) {
    const r = m339.russell(p);
    close(dist(r.A, [0.55, 0.65, 0]), 1.0, "FA 長度不變", 1e-9);
    close(r.B[1], 0.65, "B 在水平溝槽裡", 1e-12);
    close(r.C[0], 0.55, "C 走鉛直線", 1e-12);
  }
  steamPushes(m339.default, sweep(1, 8));
});

test("第 340 種:樑繞搖動立柱 B–F 的中心 F 擺動,半徑桿 E–A 產生平行運動:C 近似直線", () => {
  straightish(sweep(m340.RANGE[1], 30, m340.RANGE[0]).map((v) => m340.beam(v).C), 0.01);
});

test("第 341 種:蚱蜢式樑式引擎:樑的一端在搖動立柱 A 上,半徑桿 B 讓活塞桿端走近似直線", () => {
  straightish(sweep(1, 40).map((p) => m341.grasshopper(p).C), 0.01);
  steamPushes(m341.default, sweep(1, 8));
});

test("第 342 種:大氣壓力引擎:蒸汽進入時配重抬起活塞;冷凝後大氣壓力把活塞推下", () => {
  const steam = m342.atmospheric(0.3);
  const condense = m342.atmospheric(0.6);
  const down = m342.atmospheric(0.8);
  assert.equal(steam.phase, "steam");
  assert.ok(m342.atmospheric(0.5).piston > m342.atmospheric(0.1).piston, "蒸汽進入時活塞上升");
  assert.equal(condense.phase, "condense");
  assert.ok(m342.atmospheric(0.95).piston < down.piston, "冷凝後活塞被推下");
  close(m342.atmospheric(1).piston, m342.atmospheric(0).piston, "一輪回到原處", 1e-9);
  const def = m342.default;
  assert.equal(def.pose(0.8).parts.steam.level, 0, "推下時活塞下方沒有蒸汽(真空)");
  assert.ok(def.pose(0.3).parts.steam.level > 0, "蒸汽在活塞下方");
  assert.ok(def.pose(0.6).flows.some((f) => f.fluid === "water"), "噴水冷凝");
});

test("第 343 種:直立式引擎:半徑桿 A、A 接在活塞桿頂的振動件上,活塞桿頂走近似直線", () => {
  straightish(sweep(1, 40).map((p) => m343.upright(p).P), 0.03);
  steamPushes(m343.default, sweep(1, 8));
});

for (const [n, m] of [[344, m344], [345, m345]]) {
  test(`第 ${n} 種:擺動式引擎:汽缸繞樞軸擺動,活塞桿不用導件、直接與曲柄相連(始終指向樞軸)`, () => {
    const swings = sweep(2 * Math.PI, 36).map((t) => m.engine.at(t).swing);
    assert.ok(Math.max(...swings) - Math.min(...swings) > 0.1, "汽缸擺動");
    const ps = sweep(2 * Math.PI, 36).map((t) => m.engine.at(t).piston);
    assert.ok(Math.max(...ps) - Math.min(...ps) > 0.8, "活塞往復");
    for (const t of sweep(2 * Math.PI, 12)) {
      const pose = m.engine.pose(t).parts;
      assert.ok(pose.steamFar.level === 0 || pose.steamNear.level === 0, "只有一側進汽");
    }
  });
}

test("第 346 種:桌式引擎:十字頭在開槽導件裡直線上下,經兩根側連桿帶動桌下的兩個平行曲柄", () => {
  const heads = sweep(1, 40).map((p) => m346.table(p).head);
  close(Math.max(...heads) - Math.min(...heads), 0.9, "十字頭行程 = 曲柄直徑", 0.02);
  for (const p of sweep(1, 12)) {
    const t = m346.table(p);
    close(Math.hypot(t.pin[0], t.head - t.pin[1]), 4.0, "側連桿長度不變", 1e-9);
  }
  steamPushes(m346.default, sweep(1, 8));
});

test("第 347 種:碟形引擎:碟片像落下的硬幣般擺盪,活塞桿左端畫圓,帶動左側軸的曲柄", () => {
  const { C, ROD, TILT, SHAFT_X } = m347.geometry;
  for (const p of sweep(1, 24)) {
    const d = m347.disk(p);
    close(dist(d.pin, C), ROD, "活塞桿長度不變", 1e-9);
    close(d.pin[0], SHAFT_X, "活塞桿端在曲柄的平面上", 1e-9);
    close(Math.hypot(d.pin[1], d.pin[2]), ROD * Math.sin(TILT), "畫圓", 1e-9);
  }
});

test("第 348 種:軸旋轉一圈,桿 B 往復兩次(兩滑塊在直角交叉的溝槽中滑動)", () => {
  const ys = sweep(2 * Math.PI, 360).map((t) => m348.snyder(t).mid[1]);
  let peaks = 0;
  for (let i = 1; i < ys.length - 1; i++) if (ys[i] > ys[i - 1] && ys[i] >= ys[i + 1]) peaks++;
  assert.equal(peaks, 2, "一圈兩次往復");
  for (const t of sweep(2 * Math.PI, 12)) {
    const s = m348.snyder(t);
    close(dist(s.c1, s.c2), 0.95, "兩滑塊間距不變", 1e-9);
    close(s.c2[0] - s.c1[0], 0, "桿保持方向(鉛直)", 1e-9);
  }
});
