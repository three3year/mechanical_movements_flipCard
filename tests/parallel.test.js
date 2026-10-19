// 第十五章「平行運動與引擎」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, plateLayers, guidedBetween, assertMeshFree } from "./helpers.js";
import { lineAngle } from "../models/ruler-lines.js";
import { pointInPolygon, polygonsOverlap, edgeDistance, placeOutline } from "../models/contact.js";

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
import { dist, add, scale, sub, dot, deg, rot2, quatRotate, partPoint, signedAngle, norm } from "../models/kit.js";
import * as m332 from "../models/fig332.js";
import * as m333 from "../models/fig333.js";
import * as m334 from "../models/fig334.js";
import * as m335 from "../models/fig335.js";
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
const ENGINES = [m326, m327, m328, m329, m330, m331, m332, m336, m339, m341, m343, m346].map((m) => m.default);

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

test("直立引擎的汽缸(第 326–346 種):汽缸底下的座落到底座頂面", () => {
  for (const def of ENGINES) {
    const cyl = def.parts.find((p) => p.id === "cylinder");
    const [x, y] = cyl.center;
    const bottom = y + Math.min(...cyl.profile.map(([, h]) => h));
    const under = fixedBoxes(def).filter((b) => b.lo[0] <= x && x <= b.hi[0] && b.lo[2] <= 0 && 0 <= b.hi[2] && b.hi[1] <= bottom + 1e-9);
    const top = Math.max(...under.map((b) => b.hi[1]));
    close(bottom, top, `圖 ${def.figure}:汽缸底與底座頂面相貼`, 1e-9);
  }
});

test("直立引擎的汽缸(第 326–346 種):進汽管的支管在汽缸留下的後半,端面貼著外壁", () => {
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

// 第 326 種立柱上開了直溝槽的那一層(世界座標的 z 範圍與溝槽的外框)
function slotLayer326(def) {
  const column = part(def, "column");
  const dz = column.center?.[2] ?? 0;
  const layer = plateLayers(column).find((l) => l.solid.holes.length);
  const hole = layer.solid.holes[0];
  const xs = hole.map((q) => q[0]);
  const ys = hole.map((q) => q[1]);
  return { z0: layer.z0 + dz, z1: layer.z1 + dz, solid: layer.solid, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

test("第 326 種:「滑塊 A 由框架上的垂直溝槽所引導」:全程在溝槽裡、兩側貼著削平的溝面、不超出溝槽上下端", () => {
  const def = m326.default;
  const slot = slotLayer326(def);
  const sliderA = part(def, "sliderA");
  for (const p of sweep(1, 48)) {
    const [x, y] = def.pose(p).parts.sliderA.position;
    // 滑塊在溝槽那一層的塊
    const blocks = (sliderA.pieces ?? []).filter((q) => q.kind === "box" && q.at[2] - q.size[2] / 2 < slot.z1 && q.at[2] + q.size[2] / 2 > slot.z0);
    assert.ok(blocks.length, "滑塊伸進開溝槽的那一層");
    for (const q of blocks) {
      const [l, r] = [x + q.at[0] - q.size[0] / 2, x + q.at[0] + q.size[0] / 2];
      assert.ok(l - slot.x0 >= 0 && l - slot.x0 < 0.02 && slot.x1 - r >= 0 && slot.x1 - r < 0.02, `進程 ${p.toFixed(2)}:滑塊兩側貼著溝面(${(l - slot.x0).toFixed(3)}、${(slot.x1 - r).toFixed(3)})`);
      assert.ok(y + q.at[1] - q.size[1] / 2 >= slot.y0 && y + q.at[1] + q.size[1] / 2 <= slot.y1, `進程 ${p.toFixed(2)}:滑塊在溝槽上下端之內`);
    }
  }
});

test("第 326 種:由下方汽缸的蒸汽推動(同第 327 種):活塞桿從滑塊往下穿過底座,下端接在汽缸裡的活塞上", () => {
  const def = m326.default;
  steamPushes(def, sweep(1, 12));
  const rod = part(def, "sliderA").pieces.find((q) => q.kind === "box" && q.size[1] > 2);
  const piston = part(def, "piston");
  for (const p of sweep(1, 24)) {
    const pose = def.pose(p).parts;
    const end = pose.sliderA.position[1] + rod.at[1] - rod.size[1] / 2;
    const py = pose.piston.position[1];
    assert.ok(end >= py - piston.length / 2 && end <= py + piston.length / 2, `進程 ${p.toFixed(2)}:活塞桿下端在活塞裡`);
    close(pose.piston.position[0], pose.sliderA.position[0], "活塞與滑塊同一條鉛直線", 1e-9);
  }
});

test("第 326 種:連桿從曲柄銷往下、上段藏在立柱頭裡(原圖畫成虛線),到溝槽才露出來;連桿長不變", () => {
  const def = m326.default;
  const slot = slotLayer326(def);
  const rod = part(def, "rod");
  const fly = part(def, "flywheel");
  const top = Math.max(...slot.solid.outline.map((q) => q[1]));
  const len0 = dist(def.pose(0).parts.rod.from, def.pose(0).parts.rod.to);
  for (const p of sweep(1, 36)) {
    const pose = def.pose(p).parts;
    const { from, to } = pose.rod;
    close(dist(from, to), len0, "連桿長不變", 1e-9);
    assert.ok(from[2] + rod.thickness / 2 < slot.z0, "連桿在開溝槽那一層的後面(立柱的厚度裡)");
    // 溝槽上端到立柱頂面之間,連桿被前面那一層擋住
    for (let i = 0; i <= 40; i++) {
      const q = [from[0] + ((to[0] - from[0]) * i) / 40, from[1] + ((to[1] - from[1]) * i) / 40];
      if (q[1] > slot.y1 + 0.02 && q[1] < top - 0.02) assert.ok(pointInPolygon(q, slot.solid.outline) && !pointInPolygon(q, slot.solid.holes[0]), `進程 ${p.toFixed(2)}:立柱頭擋住連桿 (${q.map((v) => v.toFixed(2))})`);
    }
    // 連桿上端套在飛輪曲柄的曲柄銷上
    const pin = fly.pieces.find((q) => {
      if (q.kind !== "cylinder" || (q.at[0] === 0 && q.at[1] === 0)) return false;
      const [x, y] = rot2([q.at[0], q.at[1]], pose.flywheel.angle);
      return Math.hypot(fly.center[0] + x - from[0], fly.center[1] + y - from[1]) < 1e-9;
    });
    assert.ok(pin && pin.at[2] - pin.length / 2 <= from[2] - rod.thickness / 2 && pin.at[2] + pin.length / 2 >= from[2] + rod.thickness / 2, `進程 ${p.toFixed(2)}:曲柄銷穿過連桿上端的眼`);
  }
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

test("第 327 種:滾子「抵著」導桿 A、A:全程外緣貼著導桿內面、同一深度、在導桿的長度之內", () => {
  const def = m327.default;
  const guides = part(def, "frame").pieces.filter((q) => q.kind === "box" && q.size[1] > 2 && q.size[0] < 0.2 && q.at[2] > 0);
  assert.equal(guides.length, 2, "兩根導桿");
  for (const p of sweep(1, 24)) {
    for (const id of ["rollerL", "rollerR"]) {
      const r = part(def, id);
      const { position: [x, y, z] } = def.pose(p).parts[id];
      const g = guides.find((q) => Math.sign(q.at[0]) === Math.sign(x));
      const gap = Math.abs(g.at[0]) - g.size[0] / 2 - (Math.abs(x) + r.radius);
      assert.ok(gap >= -1e-9 && gap < 0.002, `進程 ${p.toFixed(2)}:${id} 與導桿的間隙 ${gap.toFixed(4)}`);
      assert.ok(z - r.length / 2 < g.at[2] + g.size[2] / 2 && z + r.length / 2 > g.at[2] - g.size[2] / 2, `${id} 與導桿同一深度`);
      assert.ok(y - r.radius >= g.at[1] - g.size[1] / 2 && y + r.radius <= g.at[1] + g.size[1] / 2, `${id} 在導桿的長度之內`);
    }
  }
});

test("第 328 種:卡特萊特平行運動:兩個相等的齒輪 C、C 反向轉,曲柄 A、A 方向相反,兩連桿傾角相等,活塞桿沿直線運動", () => {
  for (const p of sweep(1, 36)) {
    const c = m328.cartwright(p);
    close(c.pinR[0], -c.pinL[0], "兩曲柄銷左右對稱", 1e-12);
    close(c.pinR[1], c.pinL[1], "兩曲柄銷同高", 1e-12);
    close(c.b + c.a, m328.cartwright(0).b + m328.cartwright(0).a, "兩齒輪反向等速", 1e-9);
  }
  steamPushes(m328.default, sweep(1, 12));
  // 後方的飛輪由右齒輪 C 經飛輪軸上的小齒輪帶動:與右齒輪反向,轉速是齒數比倍(原圖約 36 齒對 12 齒)
  const [a, b] = [m328.default.pose(0.1).parts, m328.default.pose(0.15).parts];
  close((b.flywheel.angle - a.flywheel.angle) / (b.gearR.angle - a.gearR.angle), -3, "飛輪對右齒輪的轉速比", 1e-6);
  close(b.pinion.angle, b.flywheel.angle, "小齒輪與飛輪同軸", 1e-12);
});

// 第 328 種的零件裡,沿 z 的圓柱與方塊在零件局部座標的 z 範圍
const ySpan = (q) => [q.at[1] - q.size[1] / 2, q.at[1] + q.size[1] / 2];

test("第 328 種:橫樑在齒輪前面、擋住齒輪下半,兩端由立柱撐到底座;齒輪軸的軸承座立在樑頂", () => {
  const def = m328.default;
  const boxes = part(def, "frame").pieces.filter((q) => q.kind === "box");
  const gear = part(def, "gearL");
  const [, gy] = gear.center;
  const beam = boxes.filter((q) => q.size[0] > 3).reduce((a, b) => (a.at[1] > b.at[1] ? a : b));
  const base = boxes.filter((q) => q.size[0] > 2).reduce((a, b) => (a.at[1] < b.at[1] ? a : b));
  const [b0, b1] = ySpan(beam);
  assert.ok(zSpan(beam)[0] >= gear.width / 2, "樑在齒輪前面");
  assert.ok(b1 < gy && b1 > gy - gear.radius, "樑頂在齒輪中心與齒輪底之間(擋住下半)");
  const posts = boxes.filter((q) => q.size[1] > 3 && zSpan(q)[0] < zSpan(beam)[1] && zSpan(q)[1] > zSpan(beam)[0]);
  assert.equal(posts.length, 2, "兩根立柱");
  for (const q of posts) {
    close(ySpan(q)[1], b0, "立柱頂貼著樑底", 1e-9);
    close(ySpan(q)[0], ySpan(base)[1], "立柱底貼著底座頂面", 1e-9);
    assert.ok(Math.abs(q.at[0]) + q.size[0] / 2 <= beam.size[0] / 2 + 1e-9, "立柱在樑的兩端底下");
  }
  for (const g of [part(def, "gearL"), part(def, "gearR")]) {
    const ring = part(def, "frame").pieces.find((q) => q.kind === "cylinder" && q.inner && q.at[0] === g.center[0] && q.at[1] === g.center[1]);
    assert.ok(ring, "齒輪軸的軸承環");
    const [r0, r1] = zSpan(ring);
    assert.ok(r0 >= zSpan(beam)[0] - 1e-9 && r1 <= zSpan(beam)[1] + 1e-9, "軸承和樑同一層");
    const block = boxes.find((q) => q.at[0] === g.center[0] && Math.abs(ySpan(q)[0] - b1) < 1e-9);
    assert.ok(block && ySpan(block)[1] >= g.center[1] - ring.radius, "軸承座立在樑頂、接到軸承環");
  }
});

test("第 328 種:曲柄裝在齒輪軸上(軸穿過軸承到曲柄),曲柄端有曲柄銷、穿過連桿的眼", () => {
  const def = m328.default;
  const ring = (g) => part(def, "frame").pieces.find((q) => q.kind === "cylinder" && q.inner && q.at[0] === g.center[0] && q.at[1] === g.center[1]);
  for (const [gid, rid] of [["gearL", "rodL"], ["gearR", "rodR"]]) {
    const g = part(def, gid);
    const cyl = g.pieces.filter((q) => q.kind === "cylinder");
    const shaft = cyl.find((q) => q.at[0] === 0 && q.at[1] === 0);
    const plate = g.pieces.find((q) => q.kind === "plate");
    const [s0, s1] = zSpan(shaft);
    assert.ok(s0 <= -g.width / 2 + 1e-9 && s1 >= plate.at[2] + plate.thickness / 2 - 1e-9, `${gid}:軸從齒輪穿到曲柄前面`);
    const [r0, r1] = zSpan(ring(g));
    assert.ok(s0 <= r0 && s1 >= r1 && shaft.radius <= ring(g).inner, `${gid}:軸穿過軸承環`);
    const rod = part(def, rid);
    for (const p of sweep(1, 12)) {
      const pose = def.pose(p).parts;
      const from = pose[rid].from;
      const pin = cyl.find((q) => {
        const [x, y] = rot2([q.at[0], q.at[1]], pose[gid].angle);
        return Math.hypot(g.center[0] + x - from[0], g.center[1] + y - from[1]) < 1e-9;
      });
      assert.ok(pin, `進程 ${p}:${rid} 的上端在 ${gid} 的曲柄銷上`);
      const [p0, p1] = zSpan(pin);
      assert.ok(p0 <= from[2] - rod.thickness / 2 && p1 >= from[2] + rod.thickness / 2, `${gid}:曲柄銷穿過連桿眼`);
      assert.ok(p0 <= plate.at[2] + plate.thickness / 2 && p0 >= plate.at[2] - plate.thickness / 2 - 1e-9, `${gid}:曲柄銷從曲柄板伸出`);
    }
  }
});

test("第 328 種:十字頭兩端在齒輪中心正下方,兩連桿從曲柄銷往下張開成原圖的梯形;連桿長不變;小齒輪在右齒輪正下方", () => {
  const def = m328.default;
  const len0 = dist(def.pose(0).parts.rodL.from, def.pose(0).parts.rodL.to);
  let open = 0;
  for (const p of sweep(1, 72)) {
    const { rodL, rodR } = def.pose(p).parts;
    close(rodL.to[0], m328.GL.center[0], "十字頭左端在左齒輪中心正下方", 1e-9);
    close(rodR.to[0], m328.GR.center[0], "十字頭右端在右齒輪中心正下方", 1e-9);
    close(dist(rodL.from, rodL.to), len0, "左連桿長不變", 1e-9);
    close(dist(rodR.from, rodR.to), len0, "右連桿長不變", 1e-9);
    open = Math.max(open, Math.atan2(rodL.from[0] - rodL.to[0], rodL.from[1] - rodL.to[1]));
  }
  assert.ok(open > (10 * Math.PI) / 180, `連桿往下張開(最大 ${((open * 180) / Math.PI).toFixed(1)}°)`);
  const p0 = def.pose(0).parts.rodL;
  assert.ok(p0.from[0] > p0.to[0], "起始姿勢(原圖)就是張開的梯形");
  close(m328.PINION.center[0], m328.GR.center[0], "小齒輪在右齒輪正下方", 1e-9);
  assert.ok(m328.PINION.center[1] < m328.GR.center[1], "小齒輪在右齒輪下方");
  // 兩齒輪 C、C 互相咬合,右齒輪咬飛輪軸上的小齒輪:齒全程不互相穿入
  assertMeshFree(def, "gearL", "gearR", sweep(1, 60));
  assertMeshFree(def, "gearR", "pinion", sweep(1, 60));
});

test("第 329 種:B 在直徑兩倍的靜止內齒輪 D 裡滾動,B 上的腕銷走直線,活塞桿保持直立", () => {
  for (const p of sweep(1, 48)) close(m329.hypo(p).wrist[0], 0, "腕銷始終在鉛直線上", 1e-9);
  const ys = sweep(1, 48).map((p) => m329.hypo(p).wrist[1]);
  close(Math.max(...ys) - Math.min(...ys), 4 * 0.62, "行程等於 D 的直徑", 1e-3);
});

/** 附件沿 z 的範圍(零件中心深度 base;cylinder 沿 z 用 length、plate 用 thickness、box 用 size[2]) */
function zSpan(q, base = 0) {
  const z = base + (q.at?.[2] ?? 0);
  const h = q.kind === "cylinder" ? q.length / 2 : q.kind === "plate" ? (q.thickness ?? 0.2) / 2 : q.size[2] / 2;
  return [z - h, z + h];
}

/** 點在板件的實體裡(外形之內、孔之外) */
const inSolid = (pt, s) => pointInPolygon(pt, s.outline) && !(s.holes ?? []).some((h) => pointInPolygon(pt, h));

/** 板件是從軸心伸到銷的臂:兩者的中點在實體裡,外形沿銷的方向伸到銷心以外 */
function armTo(q, [x, y]) {
  const r = Math.hypot(x, y);
  return q.kind === "plate" && inSolid([x / 2, y / 2], q.shape) && Math.max(...q.shape.outline.map(([u, v]) => (u * x + v * y) / r)) >= r - 1e-9;
}

test("第 329 種:B 與 D 咬滿齒寬(B 繞曲柄銷在 D 裡滾動,兩者同一層)", () => {
  const def = m329.default;
  const [B, D] = [part(def, "gearB"), part(def, "ringD")];
  for (const p of sweep(1, 8)) {
    const bz = def.pose(p).parts.gearB.position[2];
    const dz = D.center[2];
    const overlap = Math.min(bz + B.width / 2, dz + D.width / 2) - Math.max(bz - B.width / 2, dz - D.width / 2);
    close(overlap, Math.min(B.width, D.width), "B 與 D 的齒寬全部重疊", 1e-9);
  }
});

test("第 329 種:活塞桿 A 接在 B 上的腕銷:腕銷裝在 B 正面的臂上、整根在 D 的齒前面,A 套在腕銷上、下端穿進汽缸蓋的孔", () => {
  const def = m329.default;
  const [B, D, rod, cyl] = [part(def, "gearB"), part(def, "ringD"), part(def, "rodA"), part(def, "cylinder")];
  const dFront = D.center[2] + D.width / 2;
  for (const p of sweep(1, 8)) {
    const pose = def.pose(p).parts;
    const bz = pose.gearB.position[2];
    const pin = B.pieces.find((q) => q.kind === "cylinder" && Math.hypot(q.at[0], q.at[1]) > B.radius / 2);
    const arm = B.pieces.find((q) => armTo(q, pin.at));
    assert.ok(arm, "B 正面有一支從輪轂伸到腕銷的臂");
    const [p0, p1] = zSpan(pin, bz);
    const [a0, a1] = zSpan(arm, bz);
    assert.ok(a0 > dFront && p0 > dFront, "臂與腕銷都在 D 的齒寬前面(走到行程兩端時越過 D 的齒)");
    assert.ok(a0 <= bz + B.width / 2 + 0.05 && p0 <= a0 + 1e-9 && p1 >= a1, "腕銷從臂的背面穿過臂,臂貼著 B 的正面(輪轂)");
    const rz = pose.rodA.position[2];
    assert.ok(rz - rod.size[2] / 2 >= p0 && rz + rod.size[2] / 2 <= p1, "活塞桿 A 的頂端在腕銷的長度之內");
    assert.ok(Math.abs(rz - cyl.center[2]) + rod.size[2] / 2 <= cyl.profile[0][0], "活塞桿在汽缸軸線上,穿過上蓋的孔");
  }
});

test("第 329 種:機架照原圖是兩支斜腳,下端站在底座上,上端接在 D 外緣水平直徑兩側的耳座", () => {
  const def = m329.default;
  const frame = part(def, "frame");
  const D = part(def, "ringD");
  const boxes = frame.pieces.filter((q) => q.kind === "box" && !q.angle);
  const base = boxes.reduce((a, b) => (b.at[1] < a.at[1] ? b : a));
  const top = base.at[1] + base.size[1] / 2;
  const legs = frame.pieces.filter((q) => q.kind === "plate" && Math.max(...q.shape.outline.map((v) => v[1])) - Math.min(...q.shape.outline.map((v) => v[1])) > 3);
  assert.equal(legs.length, 2, "兩支腳");
  for (const leg of legs) {
    const ys = leg.shape.outline.map((v) => v[1] + (leg.at?.[1] ?? 0));
    const [low, high] = [Math.min(...ys), Math.max(...ys)];
    close(low, top, "腳底站在底座頂面", 1e-9);
    const xAt = (y) => leg.shape.outline.filter((_, i) => Math.abs(ys[i] - y) < 1e-9).map((v) => v[0]);
    const footX = Math.max(...xAt(low).map(Math.abs));
    const headX = Math.min(...xAt(high).map(Math.abs));
    assert.ok(footX < base.size[0] / 2, "腳底在底座範圍內");
    assert.ok(footX > headX + 0.4, "斜腳:下端比上端張得開");
    assert.ok(Math.abs(high - D.center[1]) < 0.3, "上端到 D 的水平直徑");
    const side = Math.sign(xAt(low)[0]);
    const lug = boxes.find((q) => Math.abs(q.at[1] - D.center[1]) < 1e-9 && Math.abs(side * q.at[0] - q.size[0] / 2 - D.rim) < 1e-9);
    assert.ok(lug, "D 外緣在水平直徑上有耳座");
    assert.ok(side * lug.at[0] + lug.size[0] / 2 >= headX, "耳座伸到腳的上端");
  }
});

test("第 330 種:延長的活塞桿在與汽缸同中心線的導引件 A 中作動", () => {
  const def = m330.default;
  const cyl = part(def, "cylinder");
  const { GUIDE, ROD_TOP } = m330;
  close(GUIDE.x, cyl.center[0], "導引件 A 與汽缸同中心線(x)");
  close(GUIDE.z, cyl.center[2], "導引件 A 與汽缸同中心線(z)");
  for (const p of sweep(1, 48)) {
    const { pistonRod, piston } = def.pose(p).parts;
    for (const k of [0, 2]) {
      close(pistonRod.position[k], cyl.center[k], `進程 ${p}:活塞桿在汽缸中心線上`);
      close(piston.position[k], cyl.center[k], `進程 ${p}:活塞在汽缸中心線上`);
    }
    // 延長的活塞桿頂端全程插在導引件 A 裡(至少插進導引件長度的八成),下面的十字頭全程在導引件下方
    const top = pistonRod.position[1] + ROD_TOP;
    assert.ok(Math.min(top, GUIDE.y1) - GUIDE.y0 >= 0.8 * (GUIDE.y1 - GUIDE.y0), `進程 ${p}:活塞桿插在導引件 A 裡(桿頂 ${top})`);
    assert.ok(pistonRod.position[1] < GUIDE.y0, `進程 ${p}:十字頭在導引件下方`);
  }
  steamPushes(def, sweep(1, 12));
});

test("第 330 種:連桿的下部做成叉形,活塞桿的上部從兩股中間穿過,兩股下端共用一根十字頭銷;曲柄軸橫在紙面上、曲柄前後轉", () => {
  const def = m330.default;
  const rod = part(def, "conrod");
  const { ROD, FORK, ROD_TOP, ROD_R, R } = m330;
  const zs = [];
  for (const p of sweep(1, 48)) {
    const e = m330.engine(p);
    const { conrod, pistonRod } = def.pose(p).parts;
    const at = (local) => partPoint(conrod.position, rod.axis, conrod.angle, local);
    close(e.pin[0], 0, `進程 ${p}:曲柄銷只在垂直紙面的平面裡走(原圖曲柄軸橫在紙面上)`);
    zs.push(e.pin[2]);
    close(dist(at([0, 0, 0]), e.pin), 0, `進程 ${p}:連桿上端套在曲柄銷上`, 1e-9);
    close(dist(e.pin, pistonRod.position), ROD, `進程 ${p}:曲柄銷到十字頭銷的距離(連桿長)不變`, 1e-9);
    for (const s of [-1, 1]) {
      const end = at([ROD, 0, s * FORK.half]);
      close(end[0], s * FORK.half, `進程 ${p}:叉股下端在活塞桿${s < 0 ? "左" : "右"}側`, 1e-9);
      close(end[1], pistonRod.position[1], `進程 ${p}:叉股下端在十字頭銷上(高度)`, 1e-9);
      close(end[2], pistonRod.position[2], `進程 ${p}:叉股下端在十字頭銷上(深度)`, 1e-9);
    }
    // 活塞桿的上部在叉的環裡:左右在兩股之間,桿頂在拱頂下方
    const top = [pistonRod.position[0], pistonRod.position[1] + ROD_TOP, pistonRod.position[2]];
    const along = dot(sub(top, at([0, 0, 0])), norm(sub(at([1, 0, 0]), at([0, 0, 0]))));
    assert.ok(along > ROD - FORK.inner + 0.03, `進程 ${p}:桿頂在叉的拱頂下方(離拱頂 ${along - (ROD - FORK.inner)})`);
    assert.ok(Math.abs(top[0]) + ROD_R < FORK.half - FORK.prong / 2, `進程 ${p}:活塞桿在兩股之間`);
  }
  close(Math.max(...zs) - Math.min(...zs), 2 * R, "曲柄銷前後走滿曲柄直徑", 1e-3);
});

test("第 330 種:導引件 A 的橫臂從右股前面跨過、接到立柱,全程不碰叉股", () => {
  const { ARM, FORK } = m330;
  for (const p of sweep(1, 96)) {
    const e = m330.engine(p);
    const tilt = Math.atan2(Math.abs(e.pin[2]), e.pin[1] - e.head);
    for (let i = 0; i <= 10; i++) {
      const y = ARM.y0 + ((ARM.y1 - ARM.y0) * i) / 10;
      const t = (y - e.head) / (e.pin[1] - e.head); // 沿連桿從十字頭量起的比例
      const front = Math.abs(e.pin[2]) * t + FORK.depth / 2 / Math.cos(tilt);
      assert.ok(front < ARM.z0, `進程 ${p}、高度 ${y.toFixed(2)}:叉股前緣 ${front.toFixed(3)} 在橫臂背面 ${ARM.z0} 之後`);
    }
  }
  assert.ok(ARM.x0 < FORK.half - FORK.prong / 2 && ARM.x1 > FORK.half + FORK.prong / 2, "橫臂跨過右股");
});

test("第 331 種:曲柄銷軸頸 B 在開槽十字頭 A 內作動,十字頭在導件 D、D 之間直線往復", () => {
  for (const p of sweep(1, 24)) {
    const y = m331.yoke(p);
    close(y.head, y.wrist[1], "十字頭高度等於曲柄銷高度(開槽十字頭)", 1e-12);
  }
  steamPushes(m331.default, sweep(1, 12));
});

test("第 331 種:曲柄銷軸頸 B 從曲柄臂穿出、伸過開槽十字頭 A 的槽", () => {
  const def = m331.default;
  const crank = part(def, "crank");
  const pin = crank.pieces.find((q) => q.kind === "cylinder" && q.at[0] > 0.3);
  const arm = crank.pieces.find((q) => armTo(q, pin.at));
  assert.ok(arm, "曲柄臂從軸心伸到曲柄銷");
  const [p0, p1] = zSpan(pin);
  const [a0, a1] = zSpan(arm);
  assert.ok(p0 <= a0 + 1e-9 && p1 >= a1, "曲柄銷穿過整個曲柄臂");
  const yoke = part(def, "yokeA").pieces.find((q) => q.kind === "plate");
  const [y0, y1] = zSpan(yoke);
  assert.ok(p0 <= y0 && p1 >= y1, "曲柄銷貫穿十字頭的槽");
});

/** 一串點離它們的最佳直線(首尾連線)的最大偏差 */
function lineDeviation(points) {
  const [a, b] = [points[0], points[points.length - 1]];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return Math.max(...points.map((p) => Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len));
}

test("第 332 種:F、C 為半徑桿——F 是固定樞軸,C 繞 F 擺;C 在從側槓桿中段往上經 C 到 D 的直桿上;所有桿都是剛性的", () => {
  const rows = sweep(1, 40).map((p) => m332.motion(p));
  const { A, F } = m332;
  const lengths = (r) => [dist(F, r.C), dist(r.M, r.C), dist(r.M, r.D), dist(r.D, r.E), dist(r.S, r.E), dist(A, r.M), dist(A, r.S)];
  const first = lengths(rows[0]);
  for (const r of rows) {
    lengths(r).forEach((l, i) => close(l, first[i], "桿長不變", 1e-6));
    const [u, w] = [sub(r.C, r.M), sub(r.D, r.M)];
    close(u[0] * w[1] - u[1] * w[0], 0, "M、C、D 在同一根直桿上", 1e-9);
    assert.ok(dist(r.M, r.C) < dist(r.M, r.D), "C 在槓桿中段 M 與 D 之間");
  }
  const cs = rows.map((r) => r.C[1]);
  assert.ok(Math.max(...cs) - Math.min(...cs) > 0.3, "C 繞 F 擺");
  for (const p of sweep(1, 8)) {
    const { radiusBar } = m332.default.pose(p).parts;
    close(dist(radiusBar.from, [F[0], F[1], radiusBar.from[2]]), 0, "半徑桿的一端在固定樞軸 F", 1e-9);
  }
});

test("第 332 種:十字頭 E 的直線是這組連桿造成的:偏離汽缸中心線不到行程的 2%,活塞往復、蒸汽推活塞", () => {
  const es = sweep(1, 60).map((p) => m332.motion(p).E);
  const ys = es.map((e) => e[1]);
  const stroke = Math.max(...ys) - Math.min(...ys);
  assert.ok(stroke > 0.8, "活塞往復");
  assert.ok(verticalDeviation(es) < 0.02 * stroke, `十字頭近似直線(偏離 ${verticalDeviation(es).toFixed(4)},行程 ${stroke.toFixed(2)})`);
  const cyl = part(m332.default, "cylinder");
  assert.ok(es.every((e) => Math.abs(e[0] - cyl.center[0]) < 0.02 * stroke), "十字頭在汽缸中心線上");
  steamPushes(m332.default, sweep(1, 8));
});

test("第 332 種:每個接頭有銷穿過相接的零件;F 的托架站在汽缸蓋上", () => {
  const def = m332.default;
  for (const v of sweep(1, 6)) {
    const r = m332.motion(v);
    assertPinned(def, v, r.M, [["upright"]], "槓桿中段 M 與直桿");
    assertPinned(def, v, r.S, [["sideRod"]], "槓桿右端與側桿");
    assertPinned(def, v, r.C, [["radiusBar"]], "直桿上的 C 與半徑桿");
    assertPinned(def, v, r.D, [["parallelBar"]], "直桿頂端 D 與平行桿");
    assertPinned(def, v, r.E, [["sideRod"], ["parallelBar"]], "十字頭 E 與側桿、平行桿");
    assertPinned(def, v, m332.F, [["radiusBar"]], "固定樞軸 F 與半徑桿");
  }
  const cyl = part(def, "cylinder");
  const cover = cyl.center[1] + Math.max(...cyl.profile.map(([, h]) => h));
  const bracket = part(def, "bracket");
  const bottom = Math.min(...bracket.pieces.filter((q) => q.kind === "box").map((q) => bracket.center[1] + q.at[1] - q.size[1] / 2));
  close(bottom, cover, "托架的底貼著汽缸蓋頂面", 1e-9);
});

for (const [n, m, tol] of [[336, m336, 0.02]]) {
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

  test(`第 ${n} 種:活塞桿直接與曲柄相連:曲柄銷穿過活塞桿端的眼與曲柄臂,曲柄軸從臂伸進機架的軸承`, () => {
    const def = m.default;
    for (const v of sweep(1, 12)) {
      const end = def.pose(v).parts.pistonRod.to;
      assertPinned(def, v, end, [["pistonRod"], ["crank"]], "活塞桿端與曲柄臂");
    }
    crankShaft344(def, "frame");
  });

  test(`第 ${n} 種:汽缸的耳軸是汽缸的一部分,往後伸進機架橫樑上的軸承(於固定的軸承內作動)`, () => {
    const def = m.default;
    const T = m.TRUNNION;
    const rings = part(def, "frame").pieces.filter((q) => q.kind === "cylinder" && q.inner && Math.hypot(q.at[0] - T[0], q.at[1] - T[1]) < 1e-9);
    assert.ok(rings.length > 0, "樞軸處有軸承環");
    const cyl = part(def, "cylinder");
    for (const v of sweep(1, 8)) {
      const s = def.pose(v).parts.cylinder;
      const stubs = (cyl.pieces ?? [])
        .filter((q) => q.kind === "cylinder")
        .map((q) => ({ q, c: add(s.position, quatRotate(s.rotation, q.at ?? [0, 0, 0])), a: quatRotate(s.rotation, q.axis ?? [0, 0, 1]) }))
        .filter(({ c, a }) => Math.abs(Math.abs(a[2]) - 1) < 1e-9 && Math.hypot(c[0] - T[0], c[1] - T[1]) < 1e-9);
      assert.ok(stubs.length > 0, `主動量 ${v}:汽缸上有沿樞軸的耳軸`);
      for (const ring of rings) {
        const [r0, r1] = zSpan(ring);
        const stub = stubs.find(({ q, c }) => c[2] - q.length / 2 <= r0 + 1e-9 && r1 - 1e-9 <= c[2] + q.length / 2);
        assert.ok(stub, `主動量 ${v}:耳軸穿過整個軸承環`);
        assert.ok(stub.q.radius <= ring.inner && ring.inner < stub.q.radius + 0.02, `耳軸(半徑 ${stub.q.radius})貼著軸承的孔(${ring.inner})`);
      }
    }
  });
}

/** 第 344–346 種:曲柄軸是曲柄的一部分、穿過每片曲柄臂,並穿過機架上每個軸承環(環的孔比軸大不到 0.02) */
function crankShaft344(def, frameId) {
  const crank = part(def, "crank");
  const c = crank.center;
  const onAxis = (q) => q.kind === "cylinder" && !q.axis && !q.inner && Math.hypot(q.at?.[0] ?? 0, q.at?.[1] ?? 0) < 1e-9;
  const shaft = crank.pieces.filter(onAxis).reduce((a, q) => (q.length > a.length ? q : a));
  const [s0, s1] = zSpan(shaft, c[2]);
  for (const arm of crank.pieces.filter((q) => q.kind === "plate")) {
    const [a0, a1] = zSpan(arm, c[2]);
    assert.ok(s0 <= a0 + 1e-9 && a1 - 1e-9 <= s1, `曲柄軸(z ${s0}..${s1})穿過曲柄臂(z ${a0}..${a1})`);
  }
  const rings = part(def, frameId).pieces.filter((q) => q.kind === "cylinder" && q.inner && Math.hypot(q.at[0] - c[0], q.at[1] - c[1]) < 1e-9);
  assert.ok(rings.length > 0, "曲柄軸有軸承");
  for (const ring of rings) {
    const [r0, r1] = zSpan(ring);
    assert.ok(s0 <= r0 + 1e-9 && r1 - 1e-9 <= s1, `曲柄軸(z ${s0}..${s1})穿過軸承環(z ${r0}..${r1})`);
    assert.ok(shaft.radius <= ring.inner && ring.inner < shaft.radius + 0.02, `曲柄軸(半徑 ${shaft.radius})貼著軸承的孔(${ring.inner})`);
  }
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

test("第 346 種:兩個平行曲柄裝在桌下的同一根軸上,兩根側連桿的下端都套在曲柄銷上、上端由十字頭的銷接起", () => {
  const def = m346.default;
  crankShaft344(def, "table");
  for (const v of sweep(1, 12)) {
    const pose = def.pose(v).parts;
    assertPinned(def, v, pose.sideRod.from, [["sideRod"], ["crank", 0.1]], "前側連桿的下端");
    assertPinned(def, v, pose.sideRodBack.from, [["sideRodBack"], ["crank", 0.1]], "後側連桿的下端");
    assertPinned(def, v, pose.sideRod.to, [["sideRod"], ["sideRodBack"]], "十字頭兩端");
  }
});

test("第 346 種:直線開槽導件固定在汽缸頂部(腳踩在上蓋頂面),十字頭貼著導件的兩側", () => {
  const def = m346.default;
  const cyl = part(def, "cylinder");
  const capTop = cyl.center[1] + Math.max(...cyl.profile.map(([, h]) => h));
  const outer = Math.max(...cyl.profile.map(([r]) => r));
  const guide = part(def, "table").pieces.find((q) => q.kind === "plate" && Math.max(...q.shape.outline.map(([, y]) => y)) > capTop + 2);
  const ys = guide.shape.outline.map(([, y]) => y);
  close(Math.min(...ys), capTop, "導件的腳底貼著汽缸上蓋頂面", 1e-9);
  const feet = guide.shape.outline.filter(([, y]) => Math.abs(y - capTop) < 1e-9);
  for (const [x] of feet) assert.ok(Math.abs(x - cyl.center[0]) < outer, `腳(x ${x})踩在上蓋上`);
  const inner = Math.min(...feet.map(([x]) => Math.abs(x))); // 腳的內側邊(兩腳直立)
  const head = part(def, "crosshead").pieces.find((q) => q.kind === "plate");
  close(Math.max(...head.shape.outline.map(([x]) => Math.abs(x))), inner, "十字頭的半寬等於導件內側", 1e-9);
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

// 第 347 種:汽缸是繞 X 軸的旋轉體(剖面多邊形的座標是 [離軸距離, 沿軸]),世界點換成剖面座標就能和剖面比
const shell347 = () => part(m347.default, "frame").pieces.find((q) => q.kind === "lathe");
const toProfile347 = (P, at) => [Math.hypot(P[1] - at[1], P[2] - at[2]), P[0] - at[0]];
/** 第 347 種的碟片:球心、法線與碟面上的兩個方向;碟片的半徑與厚度、球的半徑取自活塞的零件 */
function disk347(p) {
  const { position, rotation } = m347.default.pose(p).parts.piston;
  const pieces = part(m347.default, "piston").pieces;
  const plate = pieces.reduce((m, q) => (q.kind === "cylinder" && q.radius > (m?.radius ?? 0) ? q : m), null);
  const ball = pieces.find((q) => q.kind === "sphere").radius;
  const [n, e1, e2] = [[0, 0, 1], [1, 0, 0], [0, 1, 0]].map((v) => quatRotate(rotation, v));
  const at = (side, rho, gamma) => add(add(position, scale(n, (side * plate.length) / 2)), add(scale(e1, rho * Math.cos(gamma)), scale(e2, rho * Math.sin(gamma))));
  return { c: position, n, radius: plate.radius, half: plate.length / 2, ball, at };
}

test("第 347 種:汽缸蓋為圓錐形:碟片的兩面各沿一條半徑線(從球到缸壁)貼著一個圓錐形的汽缸蓋,全程不穿入", () => {
  const shell = shell347();
  for (const p of sweep(1, 24)) {
    const d = disk347(p);
    for (const side of [1, -1]) {
      const touch = [];
      for (let k = 0; k < 180; k++) {
        const gamma = (k / 180) * 2 * Math.PI;
        for (const rho of sweep(d.radius, 30, d.ball + 0.04)) {
          const q = toProfile347(d.at(side, rho, gamma), shell.at);
          const gap = edgeDistance(q, shell.profile);
          assert.ok(!pointInPolygon(q, shell.profile) || gap < 1e-3, `進程 ${p}:碟片穿入汽缸 ${gap.toFixed(4)}`);
          if (gap < 0.001 && rho < d.radius - 0.15) touch.push({ rho, gamma });
        }
      }
      const rhos = touch.map((t) => t.rho);
      assert.ok(touch.length && Math.min(...rhos) < d.ball + 0.1 && Math.max(...rhos) > d.radius - 0.25, `進程 ${p}:碟片${side > 0 ? "右" : "左"}面從球到缸壁都貼著圓錐`);
      // 靠近球的地方圓錐彎得急,離得遠的那一段才看得出是一條線
      const far = touch.filter((t) => t.rho > 0.8);
      const spread = Math.max(...far.map((t) => Math.abs(signedAngle(t.gamma - far[0].gamma))));
      assert.ok(spread < deg(12), `進程 ${p}:接觸只沿一條半徑線(散開 ${(spread * 180 / Math.PI).toFixed(1)}°)`);
    }
  }
});

test("第 347 種:該球體於汽缸蓋的同心座內作動:球心不動,兩個汽缸蓋頂端各有一圈以球心為圓心、貼著球的座", () => {
  const shell = shell347();
  const { ball } = disk347(0);
  for (const p of sweep(1, 12)) close(dist(m347.default.pose(p).parts.piston.position, shell.at), 0, "球心在汽缸的中心", 1e-9);
  const radii = shell.profile.map(([r, a]) => Math.hypot(r, a));
  assert.ok(Math.min(...radii) >= ball - 1e-9, "座不切進球");
  for (const side of [-1, 1]) {
    const seat = shell.profile.filter(([r, a]) => Math.sign(a) === side && Math.abs(Math.hypot(r, a) - ball) < 0.003);
    const polar = seat.map(([r, a]) => Math.atan2(r, a));
    assert.ok(seat.length >= 2 && Math.max(...polar) - Math.min(...polar) > deg(10), `${side < 0 ? "左" : "右"}汽缸蓋的座包著球`);
  }
});

test("第 347 種:缸壁是以球心為圓心的球帶,碟片的邊緣全程貼著缸壁", () => {
  const shell = shell347();
  for (const p of sweep(1, 24)) {
    const d = disk347(p);
    for (const side of [1, -1]) {
      for (let k = 0; k < 72; k++) {
        const q = toProfile347(d.at(side, d.radius, (k / 72) * 2 * Math.PI), shell.at);
        const gap = edgeDistance(q, shell.profile);
        assert.ok(gap < 0.005 && (!pointInPolygon(q, shell.profile) || gap < 1e-3), `進程 ${p}:碟緣離缸壁 ${gap.toFixed(4)}`);
      }
    }
  }
});

test("第 347 種:蒸汽交替地從活塞兩側被引入:經進汽管與缸壁上的進汽口,進到碟片正讓出的那一側", () => {
  const def = m347.default;
  const shell = shell347();
  const pipes = part(def, "frame").pieces.filter((q) => q.pipe);
  assert.ok(pipes.length, "有進汽管");
  // 在管裡,或在管口往下穿過缸壁的進汽口裡
  const inPipe = (P) => pipes.some(({ at, size }) => P.every((v, i) => Math.abs(v - at[i]) <= size[i] / 2 + 1e-9) || (Math.abs(P[0] - at[0]) <= size[0] / 2 && Math.abs(P[2] - at[2]) <= size[2] / 2 && P[1] >= at[1] - size[1] / 2 - 0.3 && P[1] <= at[1]));
  const inChamber = (P) => !pointInPolygon(toProfile347(P, shell.at), shell.profile) && dist(P, shell.at) < Math.max(...shell.profile.map(([r, a]) => Math.hypot(r, a)));
  const sides = new Set();
  for (const p of sweep(1, 96).slice(0, -1)) {
    const d0 = disk347(p);
    const d1 = disk347(p + 1e-4);
    for (const P of def.pose(p).flows.flatMap((f) => f.points)) {
      assert.ok(inPipe(P) || inChamber(P), `進程 ${p}:蒸汽的點 ${P.map((v) => v.toFixed(2))} 不在管裡也不在缸裡`);
      if (inPipe(P)) continue;
      const s0 = dot(sub(P, d0.c), d0.n);
      const s1 = dot(sub(P, d1.c), d1.n);
      assert.ok(Math.sign(s0) * (s1 - s0) > 0, `進程 ${p}:蒸汽進的那一側正在變大`);
      sides.add(Math.sign(s0));
    }
  }
  assert.deepEqual([...sides].sort(), [-1, 1], "兩側輪流進汽");
});

test("第 347 種:活塞桿穿過球,左端接在左側軸端的曲柄上,右端照原圖往右下穿出汽缸", () => {
  const def = m347.default;
  const shell = shell347();
  const rod = part(def, "piston").pieces.find((q) => q.kind === "cylinder" && q.length > 2);
  const crank = part(def, "crank");
  const pin = crank.pieces.find((q) => q.kind === "sphere");
  const right = shell.at[0] + Math.max(...shell.profile.map(([, a]) => a));
  for (const p of sweep(1, 24)) {
    const { piston, crank: c } = def.pose(p).parts;
    const ends = [-1, 1].map((s) => add(piston.position, quatRotate(piston.rotation, [0, 0, rod.at[2] + (s * rod.length) / 2]))).sort((a, b) => a[0] - b[0]);
    close(dist(ends[0], partPoint(crank.center, crank.axis, c.angle, pin.at)), 0, `進程 ${p}:桿的左端在曲柄銷上`, 1e-9);
    assert.ok(ends[1][0] > right, `進程 ${p}:桿的右端穿出汽缸`);
  }
});

test("第 347 種:曲柄軸穿過左邊軸承座的孔(軸承座站在機架上)", () => {
  const def = m347.default;
  const crank = part(def, "crank");
  const shaft = crank.pieces.find((q) => q.kind === "cylinder" && q.length > 1);
  const [x0, x1] = [-1, 1].map((s) => crank.center[0] + shaft.at[2] + (s * shaft.length) / 2);
  const ring = part(def, "frame").pieces.find((q) => q.kind === "cylinder" && q.inner && q.axis?.[0] === 1);
  assert.ok(ring && ring.inner >= shaft.radius && ring.inner - shaft.radius < 0.03, "軸承孔套著軸");
  close(Math.hypot(ring.at[1] - crank.center[1], ring.at[2] - crank.center[2]), 0, "軸承孔和軸同心", 1e-9);
  assert.ok(ring.at[0] - ring.length / 2 >= x0 && ring.at[0] + ring.length / 2 <= x1, "軸整段穿過軸承");
});

/** 第 348 種:零件 id 在姿勢下,局部 (x, y) 點的世界位置(繞 z 轉) */
const at348 = (pose, id, [x, y]) => {
  const { position, angle = 0 } = pose.parts[id];
  const [rx, ry] = rot2([x, y], angle);
  return [position[0] + rx, position[1] + ry];
};

test("第 348 種:軸旋轉一圈,桿往復兩次:連桿 B 的上端接在鉛直導軌裡的桿上", () => {
  const def = m348.default;
  const poses = sweep(2 * Math.PI, 360).map((t) => def.pose(t).parts.needleBar.position);
  const ys = poses.map((q) => q[1]);
  let peaks = 0;
  for (let i = 1; i < ys.length - 1; i++) if (ys[i] > ys[i - 1] && ys[i] >= ys[i + 1]) peaks++;
  assert.equal(peaks, 2, "一圈兩次往復");
  assert.ok(Math.max(...ys) - Math.min(...ys) > 1, "往復的行程看得出來");
  for (const q of poses) close(q[0], poses[0][0], "桿只沿鉛直導軌上下", 1e-9);
});

test("第 348 種:連桿 B 上以樞軸裝著兩個滑塊 c、c,各在碟片 A 的一道溝槽 a 裡(兩溝在中心直角交叉);B 是連桿,會擺", () => {
  const def = m348.default;
  const B = part(def, "barB");
  const pins = B.pieces.filter((q) => q.kind === "cylinder").map((q) => q.at.slice(0, 2));
  const top = part(def, "needleBar").pieces.find((q) => q.kind === "cylinder" && q.axis === undefined).at.slice(0, 2);
  const grooves = [...new Set(part(def, "diskA").pieces.filter((q) => q.angle !== undefined).map((q) => q.angle))];
  assert.equal(grooves.length, 2, "兩道溝槽");
  close(Math.abs(Math.cos(grooves[0] - grooves[1])), 0, "兩道溝槽直角交叉", 1e-12);
  const angles = [];
  let length;
  for (const t of sweep(2 * Math.PI, 36)) {
    const pose = def.pose(t);
    const theta = pose.parts.diskA.angle;
    for (const id of ["sliderC1", "sliderC2"]) {
      const s = pose.parts[id].position;
      const pin = pins.map((q) => at348(pose, "barB", q)).find((q) => Math.hypot(q[0] - s[0], q[1] - s[1]) < 1e-9);
      assert.ok(pin, `${id} 套在 B 的銷上`);
      // 在溝槽的中線上、並順著溝槽(滑塊經過中心時兩道溝都算)
      const g = grooves.find((a) => Math.abs(Math.sin(theta + a - Math.atan2(s[1], s[0]))) * Math.hypot(s[0], s[1]) < 1e-9 && Math.abs(Math.sin(pose.parts[id].angle - theta - a)) < 1e-9);
      assert.ok(g !== undefined, `${id} 在一道溝槽裡、順著溝槽`);
    }
    const upper = at348(pose, "barB", [0, 0]);
    const head = at348(pose, "needleBar", top);
    length ??= Math.hypot(head[0] - upper[0], head[1] - upper[1]);
    close(Math.hypot(head[0] - upper[0], head[1] - upper[1]), length, "B 的長度不變(上端接在導軌裡的桿上)", 1e-9);
    angles.push(pose.parts.barB.angle);
  }
  assert.ok(Math.max(...angles) - Math.min(...angles) > deg(10), "B 是連桿,隨碟片擺動");
});

test("第 348 種:兩滑塊的間距照原圖約為碟片半徑的 0.76", () => {
  const B = part(m348.default, "barB");
  const pins = B.pieces.filter((q) => q.kind === "cylinder").map((q) => q.at[1]);
  const R = part(m348.default, "diskA").spin;
  const ratio = (Math.max(...pins) - Math.min(...pins)) / R;
  assert.ok(ratio > 0.7 && ratio < 0.82, `間距 / 半徑 = ${ratio.toFixed(2)}`);
});
