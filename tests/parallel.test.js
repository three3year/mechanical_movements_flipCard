// 第十五章「平行運動與引擎」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, plateLayers, guidedBetween } from "./helpers.js";
import { lineAngle } from "../models/ruler-lines.js";
import { rot2 } from "../models/kit.js";
import { pointInPolygon, polygonsOverlap, edgeDistance } from "../models/contact.js";

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
import { placeOutline, polygonsOverlap, pointInPolygon } from "../models/contact.js";
import { rackShape, sectorShape, circle } from "../models/shapes.js";
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

/** 紙面的頂面高度 */
const paperTop = (def) => {
  const p = part(def, "paper");
  return p.center[2] + p.size[2] / 2;
};

/** 尺(板件,或含板件的群組)的厚度範圍,世界 z */
function layerOf(def, pose, id) {
  const p = part(def, id);
  if (p.kind === "link") {
    const z = pose[id].from[2];
    return [z - p.thickness / 2, z + p.thickness / 2];
  }
  const z = (pose[id]?.position ?? p.center)[2];
  const layers = plateLayers(p);
  return [z + Math.min(...layers.map((l) => l.z0)), z + Math.max(...layers.map((l) => l.z1))];
}

/** 原文是把尺放在紙上、沿尺邊畫線:各尺的底面貼著紙面,兩條作圖線畫在紙面上 */
function onPaper(def, ids, values) {
  const top = paperTop(def);
  for (const v of values) {
    const { parts, paths } = def.pose(v);
    for (const id of ids) close(layerOf(def, parts, id)[0], top, `主動量 ${v.toFixed(2)}:${id} 的底面貼著紙面`);
    for (const line of [paths.lineStart, paths.lineNow]) for (const p of line.points) assert.ok(Math.abs(p[2] - top) < 0.005, `作圖線在紙面上(z ${p[2]},紙面 ${top})`);
  }
}

/** 各零件(含附件)裡沿 z 的銷,換到世界座標:{ at: [x, y], z0, z1, r } */
function pinsOf(def, v) {
  const pose = def.pose(v).parts;
  const pins = [];
  const isPin = (q) => q.kind === "cylinder" && !q.axis;
  for (const p of def.parts) {
    const s = pose[p.id] ?? {};
    let place;
    if (s.from) {
      const l = Math.hypot(s.to[0] - s.from[0], s.to[1] - s.from[1]);
      const [ux, uy] = [(s.to[0] - s.from[0]) / l, (s.to[1] - s.from[1]) / l];
      place = ([x, y, z]) => [s.from[0] + ux * x - uy * y, s.from[1] + uy * x + ux * y, s.from[2] + z];
    } else {
      if (p.axis) continue;
      const c = s.position ?? p.center ?? [0, 0, 0];
      place = (q) => {
        const [x, y] = rot2(q, s.angle ?? 0);
        return [c[0] + x, c[1] + y, c[2] + q[2]];
      };
    }
    const add = (q, at) => {
      const [x, y, z] = place(at);
      pins.push({ at: [x, y], z0: z - q.length / 2, z1: z + q.length / 2, r: q.radius });
    };
    if (isPin(p) && !s.from) add(p, [0, 0, 0]);
    for (const q of p.pieces ?? []) if (isPin(q)) add(q, q.at ?? [0, 0, 0]);
  }
  return pins;
}

/**
 * 樞接 at 有一根銷,而且銷穿過每個成員:臂(連桿)整個厚度都套在銷上,尺至少插進 0.04。
 * members:[零件 id, 只要插進的深度(省略 = 整個厚度)]
 */
function assertPinned(def, v, at, members, what) {
  const pose = def.pose(v).parts;
  const need = members.map(([id, depth]) => {
    const [z0, z1] = layerOf(def, pose, id);
    return { id, z0, z1, depth: depth ?? z1 - z0 };
  });
  const pin = pinsOf(def, v).find((q) => Math.hypot(q.at[0] - at[0], q.at[1] - at[1]) < 1e-6 && need.every((m) => Math.min(q.z1, m.z1) - Math.max(q.z0, m.z0) >= m.depth - 1e-9));
  assert.ok(pin, `主動量 ${v.toFixed(2)}:${what}有銷,穿過 ${need.map((m) => m.id).join("、")}`);
}

/** 板件零件在姿勢下的外形(世界 xy;只平移) */
const plateAt = (def, pose, id) => {
  const p = part(def, id);
  const c = pose[id]?.position ?? p.center;
  const move = (loop) => loop.map(([x, y]) => [x + c[0], y + c[1]]);
  return plateLayers(p).map((l) => ({ outline: move(l.solid.outline), holes: l.solid.holes.map(move) }));
};

/** 兩個多邊形的間隙(重疊為 0) */
const polyGap = (a, b) => (polygonsOverlap(a, b) ? 0 : Math.min(...a.map((p) => edgeDistance(p, b)), ...b.map((p) => edgeDistance(p, a))));

test("第 322 種:一個三角形的斜邊沿另一個三角形的斜邊滑動,直角邊保持平行", () => {
  parallelLines(m322.default, sweep(1.2, 8, -1.2));
  const [dx, dy] = m322.slide(1);
  close(Math.atan2(dy, dx), Math.atan2(2.5, 4.2), "沿斜邊方向滑動", 1e-12);
});

test("第 322 種:三角形 A、B 放在紙上:兩者的底面貼著紙面,沿直角邊畫的線在紙面上", () => {
  onPaper(m322.default, ["triA", "triB"], sweep(1.2, 8, -1.2));
});

test("第 323 種:滾輪平行尺:輪抓住紙張,尺滾動時始終與畫過的線平行;輪轉角 = 滾過的距離 / 半徑", () => {
  parallelLines(m323.default, sweep(1.5, 6, -1.5));
  close(m323.default.pose(0.9).parts.wheels.angle * m323.WHEEL.radius, -0.9, "輪不打滑");
});

test("第 323 種:輪 A、A 僅略微凸出於尺的下側、抓住紙張:輪底貼紙,尺底只比輪底高一點,輪在尺上開的窗裡", () => {
  const def = m323.default;
  const top = paperTop(def);
  const R = m323.WHEEL.radius;
  onPaper(def, [], [0]);
  for (const y of sweep(1.5, 6, -1.5)) {
    const pose = def.pose(y).parts;
    const axleZ = pose.wheels.position[2];
    close(axleZ - R, top, "輪底(刻紋的頂)貼著紙面");
    const [zb, zt] = layerOf(def, pose, "rulerB");
    assert.ok(zb - top > 0 && zb - top < 0.2 * R, `尺底比輪底高一點(${(zb - top).toFixed(3)},輪半徑 ${R})`);
    // 輪在尺的厚度範圍內的投影(最寬處)要落在尺上開的窗裡
    const dz = axleZ - Math.min(Math.max(axleZ, zb), zt);
    const half = Math.sqrt(R * R - dz * dz);
    const [solid] = plateAt(def, pose, "rulerB");
    for (const x of m323.WHEEL.at) {
      const corners = [[x - m323.WHEEL.width / 2, y - half], [x + m323.WHEEL.width / 2, y - half], [x + m323.WHEEL.width / 2, y + half], [x - m323.WHEEL.width / 2, y + half]];
      assert.ok(solid.holes.some((h) => corners.every((c) => pointInPolygon(c, h))), `x ${x} 的輪穿過尺上的窗,不穿進尺`);
    }
  }
});

test("第 323 種:附屬的輪軸 C 與兩輪 A、A 是一個零件(兩輪一起轉,尺才不偏),軸從尺面上方跨過兩個窗、軸頸架在窗外的軸承上", () => {
  const def = m323.default;
  const wheels = part(def, "wheels");
  const axle = wheels.pieces.find((q) => q.kind === "cylinder" && q.radius < 0.1 && q.length > 3);
  assert.ok(axle, "軸 C 是輪的一部分");
  const [a, b] = m323.WHEEL.at;
  assert.ok(axle.length / 2 > Math.max(Math.abs(a), Math.abs(b)) + m323.WHEEL.width, "軸穿過兩個輪、伸到外側");
  const pose = def.pose(0.7).parts;
  const [, zt] = layerOf(def, pose, "rulerB");
  assert.ok(pose.wheels.position[2] - axle.radius > zt, "軸在尺面上方");
  const rz = pose.rulerB.position[2];
  const out = Math.max(...m323.WHEEL.at.map(Math.abs)) + m323.WHEEL.width / 2;
  const bearings = part(def, "rulerB").pieces.filter((q) => q.kind === "box");
  for (const side of [-1, 1]) {
    const held = bearings.some((q) => {
      const [x0, x1] = [q.at[0] - q.size[0] / 2, q.at[0] + q.size[0] / 2];
      const [z0, z1] = [rz + q.at[2] - q.size[2] / 2, rz + q.at[2] + q.size[2] / 2];
      return side * x0 > out && side * x1 > out && Math.max(Math.abs(x0), Math.abs(x1)) <= axle.length / 2 && z0 < pose.wheels.position[2] && pose.wheels.position[2] < z1 && Math.abs(z0 - zt) < 1e-9;
    });
    assert.ok(held, `${side < 0 ? "左" : "右"}端的軸頸架在窗外、立在尺面上的軸承裡`);
  }
});

test("第 324 種:複合平行尺:兩臂交叉、中點相連,一端樞接、一端在溝槽 B 中滑動,尺的兩端與邊緣都保持平行", () => {
  parallelLines(m324.default, sweep(2.3, 8, 0.7));
  for (const h of sweep(2.3, 8, 0.7)) {
    const { xl, mid } = m324.cross(h);
    close(Math.hypot(1.85 - xl, h), 3.6, "臂長不變", 1e-9);
    close(mid[1], h / 2, "兩臂交在中點", 1e-12);
    const { rulerTop } = m324.default.pose(h).parts;
    close(rulerTop.position[0], part(m324.default, "rulerLow").center[0], "尺的兩端也保持平行:上尺的兩端始終正對著下尺的兩端");
  }
});

test("第 324 種:每根臂一端以樞軸接在一根尺上、另一端的滑動銷在另一根尺的溝槽裡,兩臂在中點以樞軸相連:五處都有銷", () => {
  const def = m324.default;
  for (const h of sweep(2.3, 8, 0.7)) {
    const pose = def.pose(h).parts;
    const { armUp, armDown } = pose;
    assertPinned(def, h, armUp.from, [["armUp"], ["rulerLow", 0.04]], "armUp 在下尺溝槽裡的滑動端");
    assertPinned(def, h, armUp.to, [["armUp"], ["rulerTop", 0.04]], "armUp 在上尺的樞軸端");
    assertPinned(def, h, armDown.from, [["armDown"], ["rulerTop", 0.04]], "armDown 在上尺溝槽 B 裡的滑動端");
    assertPinned(def, h, armDown.to, [["armDown"], ["rulerLow", 0.04]], "armDown 在下尺的樞軸端");
    assertPinned(def, h, [(armUp.from[0] + armUp.to[0]) / 2, (armUp.from[1] + armUp.to[1]) / 2], [["armUp"], ["armDown"]], "兩臂的中點");
    for (const [arm, ruler] of [["armUp", "rulerLow"], ["armDown", "rulerTop"]]) {
      const pin = pinsOf(def, h).find((q) => Math.hypot(q.at[0] - pose[arm].from[0], q.at[1] - pose[arm].from[1]) < 1e-6);
      const [solid] = plateAt(def, pose, ruler);
      const g = guidedBetween(pin.at, pin.r, [solid]);
      assert.ok(g.open && g.depth < 1e-3 && g.sides, `${ruler} 的溝槽夾著滑動銷、銷不穿進槽壁(穿入 ${g.depth.toFixed(3)})`);
    }
  }
});

test("第 324 種:兩根尺放在紙上:底面貼著紙面,作圖線在紙面上", () => {
  onPaper(m324.default, ["rulerLow", "rulerTop"], sweep(2.3, 8, 0.7));
});

test("第 325 種:兩根臂 C、C 構成平行四邊形,尺 A、B 的邊緣保持平行", () => {
  parallelLines(m325.default, sweep(m325.RANGE[1], 8, m325.RANGE[0]));
});

test("第 325 種:臂 C、C 以樞軸擺動:四個樞軸都有銷穿過臂、插進尺;兩根尺放在紙上", () => {
  const def = m325.default;
  for (const a of sweep(m325.RANGE[1], 8, m325.RANGE[0])) {
    const pose = def.pose(a).parts;
    for (const arm of ["armL", "armR"]) {
      assertPinned(def, a, pose[arm].from, [[arm], ["rulerB", 0.04]], `臂 ${arm} 在尺 B 上的樞軸`);
      assertPinned(def, a, pose[arm].to, [[arm], ["rulerA", 0.04]], `臂 ${arm} 在尺 A 上的樞軸`);
    }
  }
  onPaper(def, ["rulerA", "rulerB"], sweep(m325.RANGE[1], 8, m325.RANGE[0]));
});

test("第 349 種:各臂在中點鉸接、以中介桿相連,尺的兩端及兩側皆保持平行(這裡演出正對著拉開)", () => {
  const [lo, hi] = m349.RANGE;
  parallelLines(m349.default, sweep(hi, 8, lo));
  const poses = sweep(hi, 4, lo).map((h) => m349.default.pose(h).parts.rulerTop.position[0]);
  assert.ok(poses.every((x) => x === poses[0]), "正對著拉開時,上尺的兩端始終正對著下尺的兩端");
});

test("第 349 種:每根臂的兩端與鉸點都有銷:臂端的銷穿過臂、插進尺,鉸點的銷穿過兩根臂、插進中介桿;兩根尺放在紙上", () => {
  const def = m349.default;
  const [lo, hi] = m349.RANGE;
  for (const h of sweep(hi, 6, lo)) {
    const pose = def.pose(h).parts;
    for (const i of [0, 1]) {
      const up = pose[`up${i}`];
      const down = pose[`down${i}`];
      assertPinned(def, h, up.from, [[`up${i}`], ["rulerTop", 0.04]], `上尺的樞軸 ${i}`);
      assertPinned(def, h, up.to, [[`up${i}`], [`down${i}`], ["midBar", 0.04]], `鉸點 ${i}`);
      assertPinned(def, h, down.to, [[`down${i}`], ["rulerLow", 0.04]], `下尺的樞軸 ${i}`);
    }
  }
  onPaper(def, ["rulerLow", "rulerTop"], sweep(hi, 6, lo));
});

test("第 349 種:中介桿夾在兩尺之間、和尺同一層,全程不穿進尺;合到最小開度時兩尺的寬段合攏,中介桿的尖端靠進尺內緣的斜階", () => {
  const def = m349.default;
  const [lo, hi] = m349.RANGE;
  for (const h of sweep(hi, 60, lo)) {
    const pose = def.pose(h).parts;
    const [m0, m1] = layerOf(def, pose, "midBar");
    const [bar] = plateAt(def, pose, "midBar");
    for (const id of ["rulerLow", "rulerTop"]) {
      const [r0, r1] = layerOf(def, pose, id);
      assert.ok(Math.min(m1, r1) - Math.max(m0, r0) > 0.05, `中介桿和 ${id} 同一層`);
      const [ruler] = plateAt(def, pose, id);
      assert.ok(polyGap(bar.outline, ruler.outline) > 1e-4, `開度 ${h.toFixed(2)}:中介桿不穿進 ${id}`);
    }
  }
  const pose = def.pose(lo).parts;
  const [low] = plateAt(def, pose, "rulerLow");
  const [top] = plateAt(def, pose, "rulerTop");
  const gap = polyGap(low.outline, top.outline);
  assert.ok(gap > 1e-4 && gap < 0.02, `最小開度:兩尺的寬段合攏(間隙 ${gap.toFixed(3)})`);
  const [bar] = plateAt(def, pose, "midBar");
  const tip = bar.outline.reduce((a, b) => (b[0] < a[0] ? b : a));
  for (const ruler of [low, top]) assert.ok(edgeDistance(tip, ruler.outline) < 0.02, `最小開度:中介桿的尖端靠進斜階(${edgeDistance(tip, ruler.outline).toFixed(3)})`);
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

// 用 vertical-engine.js 汽缸的各圖:汽缸底下的座落到底座頂面、進汽管的支管接到汽缸留下的後半外壁
const ENGINES = [m327, m328, m329, m330, m331, m332, m336, m339, m341, m343, m346].map((m) => m.default);

// 不動的零件裡沒有轉角的方塊(世界座標的外框)
function fixedBoxes(def) {
  const posed = new Set(Object.keys(def.pose(0).parts));
  return def.parts
    .filter((p) => !posed.has(p.id))
    .flatMap((p) => (p.pieces ?? []).filter((q) => q.kind === "box" && !q.angle && !q.axis).map((q) => ({ p, q })))
    .map(({ p, q }) => {
      const c = (p.center ?? [0, 0, 0]).map((v, k) => v + (q.at ?? [0, 0, 0])[k]);
      return { lo: c.map((v, k) => v - q.size[k] / 2), hi: c.map((v, k) => v + q.size[k] / 2) };
    });
}

test("直立引擎的汽缸(第 327–346 種):汽缸底下的座落到底座頂面", () => {
  for (const def of ENGINES) {
    const cyl = def.parts.find((p) => p.id === "cylinder");
    const [x, y] = cyl.center;
    const bottom = y + Math.min(...cyl.profile.map(([, h]) => h));
    const under = fixedBoxes(def).filter((b) => b.lo[0] <= x && x <= b.hi[0] && b.lo[2] <= 0 && 0 <= b.hi[2] && b.hi[1] <= bottom + 1e-9);
    const top = Math.max(...under.map((b) => b.hi[1]));
    close(bottom, top, `圖 ${def.figure}:汽缸底與底座頂面相貼`, 1e-9);
  }
});

test("直立引擎的汽缸(第 327–346 種):進汽管的支管在汽缸留下的後半,端面貼著外壁", () => {
  for (const def of ENGINES) {
    const cyl = def.parts.find((p) => p.id === "cylinder");
    const wall = cyl.profile[1][0]; // 汽缸壁的外半徑(上蓋的外角;座的凸緣另算)
    const pipe = def.parts.find((p) => p.id === "pipe");
    const branches = pipe.pieces.filter((q) => q.size[0] > q.size[1]);
    assert.equal(branches.length, 2, `圖 ${def.figure}:上下兩根支管`);
    for (const q of branches) {
      const z = (pipe.center?.[2] ?? 0) + q.at[2];
      assert.ok(z < 0, `圖 ${def.figure}:支管在汽缸的後半(z ${z})`);
      const end = (pipe.center?.[0] ?? 0) + q.at[0] - q.size[0] / 2;
      close(end, cyl.center[0] + Math.sqrt(wall * wall - z * z), `圖 ${def.figure}:支管端面貼著汽缸外壁`, 1e-9);
    }
  }
});

test("第 327、328 種:十字頭的轂套住活塞桿頂端、往前接到橫桿(活塞桿與十字頭接成一件)", () => {
  for (const m of [m327, m328]) {
    const pieces = m.default.parts.find((p) => p.id === "crosshead").pieces;
    const span = (q) => (q.kind === "box" ? [q.at[2] - q.size[2] / 2, q.at[2] + q.size[2] / 2] : [q.at[2] - q.length / 2, q.at[2] + q.length / 2]);
    const rod = pieces.find((q) => q.kind === "box" && q.size[1] > 1);
    const bar = pieces.find((q) => q.kind === "box" && q.size[0] > 1);
    const hub = pieces.find((q) => q.kind === "cylinder" && q.at[0] === 0);
    assert.ok(hub, "有轂");
    const [h0, h1] = span(hub);
    const [r0, r1] = span(rod);
    const [b0] = span(bar);
    assert.ok(h0 <= r0 && h1 >= r1, "轂蓋住活塞桿那一層");
    assert.ok(h1 >= b0, "轂伸到橫桿的背面");
    assert.ok(hub.radius > rod.size[0] / 2, "轂比活塞桿粗,套住桿頂");
  }
});

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

test("第 329 種:B 在直徑兩倍的靜止內齒輪 D 裡滾動,B 上的腕銷走直線,活塞桿保持直立", () => {
  for (const p of sweep(1, 48)) close(m329.hypo(p).wrist[0], 0, "腕銷始終在鉛直線上", 1e-9);
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

test("第 331 種:曲柄銷軸頸 B 在開槽十字頭 A 內作動,十字頭在導件 D、D 之間直線往復", () => {
  for (const p of sweep(1, 24)) {
    const y = m331.yoke(p);
    close(y.head, y.wrist[1], "十字頭高度等於曲柄銷高度(開槽十字頭)", 1e-12);
  }
  steamPushes(m331.default, sweep(1, 12));
});

/** 一串點離它們的最佳直線(首尾連線)的最大偏差 */
function lineDeviation(points) {
  const [a, b] = [points[0], points[points.length - 1]];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return Math.max(...points.map((p) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len));
}

for (const [n, m, tol] of [[332, m332, 1e-12], [336, m336, 0.02]]) {
  test(`第 ${n} 種:船舶側槓桿引擎:平行運動導引十字頭,活塞桿沿直線往復`, () => {
    const es = sweep(1, 60).map((p) => m.motion(p).E);
    assert.ok(verticalDeviation(es) < tol, "十字頭沿汽缸中心線");
    const ys = es.map((e) => e[1]);
    assert.ok(Math.max(...ys) - Math.min(...ys) > 0.8, "活塞往復");
    steamPushes(m.default, sweep(1, 8));
  });
}

test("第 336 種:側桿接平行桿,平行桿同時接在搖臂軸 F 的短半徑臂上:所有桿長不變,十字頭的直線由連桿造成", () => {
  const rows = sweep(1, 40).map((p) => m336.motion(p));
  const lengths = (r) => [dist(r.P, m336.F), dist(r.P, r.E), dist(r.P, r.M), dist(r.S, r.E)];
  const first = lengths(rows[0]);
  for (const r of rows) lengths(r).forEach((l, i) => close(l, first[i], "桿長不變", 1e-6));
  close(first[0], m336.ARM, "短半徑臂", 1e-6);
  assert.ok(m336.ARM < first[1] / 2, "搖臂軸上的半徑臂比平行桿短");
});

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

test("第 333 種:吊桿中段 J1 的接頭是吊桿上的一個銷(不另列零件),全程就在近似直線點 J1 上", () => {
  const def = m333.default;
  assert.ok(!def.parts.some((p) => p.id === "pinJ1"), "J1 的銷不另列成零件");
  const pin = def.parts.find((p) => p.id === "hanger").pieces?.find((p) => p.kind === "cylinder");
  assert.ok(pin, "吊桿上有 J1 的銷");
  for (const v of sweep(m333.RANGE[1], 8, m333.RANGE[0])) {
    const { from, to } = def.pose(v).parts.hanger;
    const len = dist(from, to);
    const at = [0, 1].map((k) => from[k] + ((to[k] - from[k]) * pin.at[0]) / len);
    const J1 = m333.linkage(v).J1;
    close(dist([...at, 0], J1), 0, `主動量 ${v.toFixed(2)}:銷在 J1`, 1e-9);
  }
});

test("第 334 種:活塞桿是一根直齒條,與樑上的扇形段咬合、背面抵著滾子 A,活塞桿走直線,位移 = 扇形段節圓弧長", () => {
  const a = m334.rack(0.1).offset - m334.rack(0).offset;
  close(Math.abs(a), 2.85 * 0.1, "齒條位移 = 節圓半徑 × 轉角", 1e-9);
  // 弓頭 D 以鏈條吊著的空氣泵(冷凝器)泵桿:位移 = 弓頭半徑 × 轉角,和活塞桿同向
  const b = m334.pumpTop(0.1) - m334.pumpTop(0);
  close(Math.abs(b), 1.35 * 0.1, "泵桿位移 = 弓頭半徑 × 轉角", 1e-9);
  assert.ok(Math.sign(a) === Math.sign(b), "泵桿與活塞桿同向");
});

/**
 * 第 334 種:零件 id 在主動量 v 下的各塊平面外形(世界座標)與深度範圍 { poly, z: [z0, z1] };
 * 齒條照 rackShape,扇形段是板與它的 pieces(或舊的扇形齒輪)
 */
function outlines334(id, v) {
  const def = m334.default;
  const p = def.parts.find((q) => q.id === id);
  const pose = def.pose(v).parts[id];
  const at = pose.position ?? p.center;
  const place = (outline, z, t) => ({ poly: placeOutline(outline, at, pose.angle), z: [z - t / 2, z + t / 2] });
  if (p.kind === "rack") return [place(rackShape({ teeth: p.teeth, pitch: p.pitch, depth: p.depth }).outline, 0, p.width)];
  if (p.kind === "gear") return [place(sectorShape(p).outline, 0, p.width)];
  return [{ shape: p.shape, at: [0, 0, 0], thickness: p.thickness }, ...(p.pieces ?? [])].filter((q) => q.shape).map((q) => place(q.shape.outline, q.at?.[2] ?? 0, q.thickness));
}
const zRange334 = (q) => {
  const half = q.kind === "box" ? q.size[2] / 2 : q.axis && q.axis[2] === 0 ? q.radius : q.length / 2;
  return [q.at[2] - half, q.at[2] + half];
};
const footprint334 = (q) =>
  q.kind === "box"
    ? [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => [q.at[0] + (sx * q.size[0]) / 2, q.at[1] + (sy * q.size[1]) / 2])
    : q.axis && q.axis[2] === 0
      ? [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => [q.at[0] + sx * q.radius, q.at[1] + (sy * q.length) / 2])
      : circle(q.radius).map(([x, y]) => [q.at[0] + x, q.at[1] + y]);

test("第 334 種:齒條的背面抵著滾子 A 運行——輪緣貼著齒條背面(間隙 0、不穿入),滾子在接觸點跟著齒條走、不打滑", () => {
  const def = m334.default;
  const roller = def.parts.find((p) => p.id === "rollerA");
  for (const v of sweep(m334.RANGE[1], 12, m334.RANGE[0])) {
    const rack = outlines334("rackB", v)[0].poly;
    const back = Math.min(...rack.map((p) => p[0]));
    close(back - (roller.center[0] + roller.radius), 0, `主動量 ${v.toFixed(2)}:輪緣與齒條背面的間隙`, 1e-6);
    const ys = rack.map((p) => p[1]);
    assert.ok(Math.min(...ys) < roller.center[1] && roller.center[1] < Math.max(...ys), `主動量 ${v.toFixed(2)}:滾子全程抵著齒條`);
    // 接觸點在滾子右側:逆時針轉 dθ,輪緣在接觸點往上走 r·dθ,要等於齒條往上走的距離
    const dv = 1e-4;
    const [p0, p1] = [def.pose(v).parts, def.pose(Math.min(v + dv, m334.RANGE[1])).parts];
    const rackUp = p1.rackB.position[1] - p0.rackB.position[1];
    const rimUp = (p1.rollerA.angle - p0.rollerA.angle) * roller.radius;
    close(rimUp, rackUp, `主動量 ${v.toFixed(2)}:接觸點的輪緣速度 = 齒條速度`, 1e-9);
  }
});

test("第 334 種:齒照原圖——齒距約為扇形段半徑的 0.048、齒條長約 1.45 倍半徑,齒條全程咬在扇形段的齒段上", () => {
  const def = m334.default;
  const rack = def.parts.find((p) => p.id === "rackB");
  const { teeth, radius, span } = m334.SECTOR;
  close(rack.pitch, (2 * Math.PI * radius) / teeth, "齒條與扇形段的齒距相同", 1e-12);
  const ratio = rack.pitch / radius;
  assert.ok(ratio > 0.044 && ratio < 0.052, `齒距 / 半徑 ${ratio.toFixed(3)}(原圖約 0.048)`);
  const length = rack.teeth * rack.pitch;
  assert.ok(length / radius > 1.35 && length / radius < 1.55, `齒條長 / 半徑 ${(length / radius).toFixed(2)}(原圖約 1.45)`);
  const pitchAngle = (2 * Math.PI) / teeth;
  for (const v of [m334.RANGE[0], 0, m334.RANGE[1]]) {
    // 接觸點在世界 180°(F 的正左方),對到扇形段局部角 180° − 樑角;兩側都要留一個齒以上
    const local = Math.PI - def.pose(v).parts.sectorC.angle;
    assert.ok(local - span[0] > pitchAngle && span[1] - local > pitchAngle, `主動量 ${v.toFixed(2)}:接觸點在齒段裡`);
    const ys = outlines334("rackB", v)[0].poly.map((p) => p[1]);
    const contact = def.parts.find((p) => p.id === "sectorC").center[1];
    assert.ok(Math.min(...ys) + 2 * rack.pitch < contact && contact < Math.max(...ys) - 2 * rack.pitch, `主動量 ${v.toFixed(2)}:接觸點在齒條的齒上`);
  }
});

test("第 334 種:扇形段只是一條齒弧,由桁架接到樑上(原圖不是實心扇形);全程掃不到空氣泵泵桿導套的托架", () => {
  const def = m334.default;
  const sector = def.parts.find((p) => p.id === "sectorC");
  const [cx, cy] = sector.center;
  const { radius } = m334.SECTOR ?? sector;
  // F 與齒弧之間、桁架以外是空的
  for (const deg of [165, 195]) {
    const a = (deg * Math.PI) / 180;
    const p = [cx + 2 * Math.cos(a), cy + 2 * Math.sin(a)];
    assert.ok(!outlines334("sectorC", 0).some((s) => pointInPolygon(p, s.poly)), `半徑 2、${deg}° 不在扇形段上`);
  }
  // 齒弧在節圓附近(F 到齒弧之間沒有板)
  const band = outlines334("sectorC", 0)[0].poly.map(([x, y]) => Math.hypot(x - cx, y - cy));
  assert.ok(Math.min(...band) > 0.85 * radius, `齒弧內緣 ${Math.min(...band).toFixed(2)}`);
  const frame = def.parts.find((p) => p.id === "frame").pieces;
  for (const v of sweep(m334.RANGE[1], 48, m334.RANGE[0])) {
    for (const s of outlines334("sectorC", v))
      for (const q of frame) {
        const [a, b] = zRange334(q);
        if (a < s.z[1] && b > s.z[0]) assert.ok(!polygonsOverlap(s.poly, footprint334(q)), `主動量 ${v.toFixed(2)}:扇形段掃到托架(${q.at.map((x) => x.toFixed(2))})`);
      }
  }
});

test("第 335 種:固定式樑式引擎的平行運動:活塞桿頭的軌跡近似直線", () => {
  const ps = sweep(m335.RANGE[1], 30, m335.RANGE[0]).map((v) => m335.parallel(v).P);
  const ys = ps.map((p) => p[1]);
  assert.ok(verticalDeviation(ps) / (Math.max(...ys) - Math.min(...ys)) < 0.01, "偏離鉛直線不到行程的 1%");
});

test("第 335 種:原圖的虛線弧是 Q 繞固定樞軸擺的軌跡,圓心在活塞桿頭 P 的中間位置、半徑等於 P–Q;各桿長不變", () => {
  const def = m335.default;
  const values = sweep(m335.RANGE[1], 30, m335.RANGE[0]);
  const rows = values.map((v) => ({ ...m335.parallel(v), O2: def.pose(v).parts.radiusBar.from }));
  const O2 = rows[0].O2;
  for (const r of rows) close(dist(r.O2, O2), 0, "半徑桿的樞軸固定", 1e-12);
  const ys = rows.map((r) => r.P[1]);
  const stroke = Math.max(...ys) - Math.min(...ys);
  const mid = m335.parallel(0);
  close(dist([O2[0], O2[1], 0], mid.P), 0, "固定樞軸在行程中間時的 P 上", 1e-9);
  assert.ok(Math.abs(O2[1] - (Math.max(...ys) + Math.min(...ys)) / 2) < 0.01 * stroke, "P 的中間位置");
  const PQ = dist(mid.P, mid.Q);
  for (const r of rows) {
    close(dist([O2[0], O2[1], 0], r.Q), PQ, "Q 在以 O2 為圓心、半徑 P–Q 的弧上", 1e-9);
    close(dist(r.B, r.P), dist(mid.B, mid.P), "外側吊桿長不變", 1e-9);
    close(dist(r.M, r.Q), dist(mid.M, mid.Q), "內側吊桿長不變", 1e-9);
    close(dist(r.P, r.Q), PQ, "平行桿長不變", 1e-9);
  }
});

test("第 335 種:機架是一件——軸承座撐著樑的軸、固定臂從牆柱伸到半徑桿的固定樞軸,都站在同一塊地基上", () => {
  const frame = m335.default.parts.find((p) => p.id === "frame").pieces;
  // 各塊的外接盒(盒子不轉;圓柱沿 z),兩盒相貼或重疊就算相連
  const boxOf = (q) => {
    const h = q.kind === "box" ? q.size.map((s) => s / 2) : [q.radius, q.radius, q.length / 2];
    return [q.at.map((c, i) => c - h[i]), q.at.map((c, i) => c + h[i])];
  };
  const boxes = frame.map(boxOf);
  const touch = (a, b) => [0, 1, 2].every((i) => a[0][i] <= b[1][i] + 1e-9 && b[0][i] <= a[1][i] + 1e-9);
  const seen = new Set([0]);
  for (let grew = true; grew; ) {
    grew = false;
    boxes.forEach((b, i) => {
      if (!seen.has(i) && [...seen].some((j) => touch(boxes[j], b))) (seen.add(i), (grew = true));
    });
  }
  assert.equal(seen.size, frame.length, `相連的塊 ${seen.size} / ${frame.length}`);
  // 樑的軸穿在軸承環裡:環的孔徑等於軸的半徑,圓心在樑的樞軸上
  const O1 = m335.default.parts.find((p) => p.id === "beam").center;
  const at = (q) => Math.hypot(q.at[0] - O1[0], q.at[1] - O1[1]) < 1e-9;
  const axle = frame.find((q) => q.kind === "cylinder" && !q.inner && at(q));
  assert.ok(axle && frame.some((q) => q.kind === "cylinder" && q.inner === axle.radius && at(q)), "樑的軸穿在軸承環裡");
});

test("第 337 種:半徑桿接在短擺動桿的下端,擺動桿中點(活塞桿)的軌跡近似直線", () => {
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

test("第 340 種:樑架在搖動立柱支座 B–F 上,支座繞中心 F 擺動,半徑桿 E–A 產生平行運動:C 近似直線", () => {
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

test("第 343 種:直立式引擎:半徑桿 A、A 接在活塞桿頂的擺動件上,活塞桿頂走近似直線", () => {
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
