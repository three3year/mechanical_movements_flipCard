// 第十五章「平行運動與引擎」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, plateLayers, guidedBetween, assertMeshFree, polyGap, inSolid } from "./helpers.js";
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
import { rackShape, sectorShape, circle, rect } from "../models/shapes.js";
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
  if (!layers.length) {
    // 沒有板件的方塊零件,或只含方塊的群組(活塞桿、滑塊):方塊沿 z 的範圍
    const spans = [p, ...(p.pieces ?? [])].filter((q) => q.kind === "box").map((q) => zSpan(q));
    return [z + Math.min(...spans.map((s) => s[0])), z + Math.max(...spans.map((s) => s[1]))];
  }
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

/** 群組零件的一塊(方塊、沿座標軸的圓柱、沿 z 的板件;不轉)的外框,世界座標(origin 是零件中心):{ lo, hi } */
function pieceBox(q, origin = [0, 0, 0]) {
  const at = (q.at ?? [0, 0, 0]).map((v, k) => v + origin[k]);
  if (q.kind === "plate") {
    const xs = q.shape.outline.map((v) => v[0]);
    const ys = q.shape.outline.map((v) => v[1]);
    const h = (q.thickness ?? 0.2) / 2;
    return { lo: [at[0] + Math.min(...xs), at[1] + Math.min(...ys), at[2] - h], hi: [at[0] + Math.max(...xs), at[1] + Math.max(...ys), at[2] + h] };
  }
  const axis = q.axis ?? [0, 0, 1];
  const h = q.kind === "box" ? q.size.map((v) => v / 2) : axis.map((a) => (Math.abs(a) > 0.5 ? q.length / 2 : q.radius));
  return { lo: at.map((v, k) => v - h[k]), hi: at.map((v, k) => v + h[k]) };
}

// 不動的零件裡沒有轉角的方塊(世界座標的外框)
function fixedBoxes(def) {
  const posed = new Set(Object.keys(def.pose(0).parts));
  return def.parts
    .filter((p) => !posed.has(p.id))
    .flatMap((p) => (p.pieces ?? []).filter((q) => q.kind === "box" && !q.angle && !q.axis).map((q) => pieceBox(q, p.center)));
}

/**
 * 群組零件 p 的各塊連成一件:兩塊的深度範圍相接、平面外形相接就算相連(板件用輪廓、方塊用矩形、沿 z 的圓柱用圓,
 * 沿 x、y 的圓柱用外框);從第一塊走得到每一塊
 */
function assertOnePiece(p, what) {
  const items = p.pieces.map((q) => {
    assert.ok(["plate", "box", "cylinder"].includes(q.kind), `只認板件、方塊與圓柱(${q.kind})`);
    assert.ok(!q.angle && !q.rotation && (!q.axis || (q.kind === "cylinder" && q.axis.filter((a) => a !== 0).length === 1)), "方塊、板件沿 z、不轉;圓柱沿座標軸");
    const { lo, hi } = pieceBox(q);
    const [x, y] = q.at ?? [0, 0];
    let poly;
    if (q.kind === "plate") poly = q.shape.outline.map(([u, v]) => [u + x, v + y]);
    else if (q.kind === "cylinder" && !q.axis?.[0] && !q.axis?.[1]) poly = circle(q.radius, x, y);
    else poly = rect(hi[0] - lo[0], hi[1] - lo[1], (lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2);
    return { poly, z: [lo[2], hi[2]] };
  });
  const touch = (a, b) => a.z[0] <= b.z[1] + 1e-9 && b.z[0] <= a.z[1] + 1e-9 && polyGap(a.poly, b.poly) < 1e-6;
  const seen = new Set([0]);
  for (let grew = true; grew; ) {
    grew = false;
    items.forEach((b, i) => {
      if (!seen.has(i) && [...seen].some((j) => touch(items[j], b))) (seen.add(i), (grew = true));
    });
  }
  assert.deepEqual(items.map((_, i) => i).filter((i) => !seen.has(i)), [], what);
}

/** 軸承環的孔比軸大的上限(各圖的孔不是等於軸徑,就是大 0.01) */
const BEARING_FIT = 0.01;

/**
 * 軸穿過 pieces 裡和它同軸的每個軸承環(有孔的圓柱):至少有一個環,環的孔套著軸(孔比軸大 0 到 BEARING_FIT),
 * 軸沿軸線蓋住整個環。軸與 pieces 都是世界座標:{ at, axis(省略為 z), radius, length },環另有 inner
 */
function assertShaftInBearings(shaft, pieces, what) {
  const axis = norm(shaft.axis ?? [0, 0, 1]);
  const along = (q) => dot(sub(q, shaft.at), axis);
  const onAxis = (q) => dist(q, add(shaft.at, scale(axis, along(q)))) < 1e-9;
  const rings = pieces.filter((q) => q.kind === "cylinder" && q.inner && Math.abs(Math.abs(dot(norm(q.axis ?? [0, 0, 1]), axis)) - 1) < 1e-9 && onAxis(q.at ?? [0, 0, 0]));
  assert.ok(rings.length > 0, `${what}有軸承環`);
  const [s0, s1] = [-shaft.length / 2, shaft.length / 2];
  for (const ring of rings) {
    const c = along(ring.at ?? [0, 0, 0]);
    const [r0, r1] = [c - ring.length / 2, c + ring.length / 2];
    assert.ok(s0 <= r0 + 1e-9 && r1 - 1e-9 <= s1, `${what}(沿軸 ${s0.toFixed(3)}..${s1.toFixed(3)})穿過整個軸承環(${r0.toFixed(3)}..${r1.toFixed(3)})`);
    const fit = ring.inner - shaft.radius;
    assert.ok(fit >= -1e-9 && fit <= BEARING_FIT + 1e-9, `${what}(半徑 ${shaft.radius})套在軸承環的孔裡(孔 ${ring.inner})`);
  }
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
  for (const [gid, rid] of [["gearL", "rodL"], ["gearR", "rodR"]]) {
    const g = part(def, gid);
    const cyl = g.pieces.filter((q) => q.kind === "cylinder");
    const shaft = cyl.find((q) => q.at[0] === 0 && q.at[1] === 0);
    const plate = g.pieces.find((q) => q.kind === "plate");
    const [s0, s1] = zSpan(shaft);
    assert.ok(s0 <= -g.width / 2 + 1e-9 && s1 >= plate.at[2] + plate.thickness / 2 - 1e-9, `${gid}:軸從齒輪穿到曲柄前面`);
    assertShaftInBearings({ ...shaft, at: add(g.center, shaft.at) }, part(def, "frame").pieces, `${gid} 的軸`);
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
  const lengths = (r) => [dist(r.P, m336.F), dist(r.P, r.Q), dist(r.P, r.M), dist(r.S, r.E), dist(r.S, r.Q)];
  const first = lengths(rows[0]);
  for (const r of rows) lengths(r).forEach((l, i) => close(l, first[i], "桿長不變", 1e-6));
  close(first[0], m336.ARM, "短半徑臂", 1e-6);
  assert.ok(m336.ARM < first[1] / 2, "搖臂軸上的半徑臂比平行桿短");
});

test("第 336 種:平行桿接在側桿上(原圖在十字頭下方約 0.43),十字頭在側桿頂端;接點有銷穿過平行桿與側桿", () => {
  const def = m336.default;
  for (const p of sweep(1, 12)) {
    const m = m336.motion(p);
    const pose = def.pose(p).parts;
    const flat = (q) => [q[0], q[1], 0];
    close(dist(flat(pose.sideRod.to), m.E), 0, "側桿頂端是十字頭", 1e-9);
    close(dist(flat(pose.crosshead.position), m.E), 0, "十字頭在側桿頂端", 1e-9);
    close(dist(flat(pose.parallelBar.to), m.Q), 0, "平行桿的右端在 Q", 1e-9);
    // Q 在側桿上:S、Q、E 共線,Q 在 S 與 E 之間、離十字頭 0.43
    close(dist(m.S, m.Q) + dist(m.Q, m.E), dist(m.S, m.E), "Q 在側桿上", 1e-9);
    close(dist(m.Q, m.E), 0.43, "Q 在十字頭下方 0.43", 1e-9);
    assertPinned(def, p, m.Q, [["parallelBar"], ["sideRod"]], "平行桿與側桿的接點 Q ");
  }
});

test("第 336 種:P 點三根桿相接——搖臂軸的短半徑臂、平行桿、從槓桿上來的直桿由一根銷穿過;直桿下端 M 也有銷接在槓桿上", () => {
  const def = m336.default;
  for (const p of sweep(1, 12)) {
    const m = m336.motion(p);
    assertPinned(def, p, m.P, [["rock"], ["parallelBar"], ["upright"]], "P 點");
    assertPinned(def, p, m.M, [["lever"], ["upright"]], "M 點");
  }
});

test("第 336 種:蒸汽推動汽缸的活塞:活塞走過汽缸可用長度的七成以上,全程在缸內", () => {
  const def = m336.default;
  const { top, length } = m336.CYL;
  const piston = part(def, "piston");
  const ys = sweep(1, 60).map((p) => def.pose(p).parts.piston.position[1]);
  for (const y of ys) assert.ok(y + piston.length / 2 <= top + 1e-9 && y - piston.length / 2 >= top - length - 1e-9, `活塞在缸內(${y.toFixed(3)})`);
  const stroke = Math.max(...ys) - Math.min(...ys);
  assert.ok(stroke / (length - piston.length) >= 0.7, `活塞行程 ${stroke.toFixed(2)} 是可用長度 ${(length - piston.length).toFixed(2)} 的 ${(stroke / (length - piston.length)).toFixed(2)}`);
});

test("第 336 種:機架是一件——斜撐從左上接到汽缸頂、往下有腳落到底座,搖臂軸 F 的軸承座立在斜撐上,軸穿在軸承環裡", () => {
  const frame = part(m336.default, "frame");
  assertOnePiece(frame, "機架的每一塊都連成一件");
  const rock = part(m336.default, "rock");
  const shaft = rock.pieces.find((q) => q.kind === "cylinder");
  close(Math.hypot(rock.center[0] - m336.F[0], rock.center[1] - m336.F[1]), 0, "搖臂軸在 F", 1e-9);
  assertShaftInBearings({ ...shaft, at: add(rock.center, shaft.at) }, frame.pieces, "搖臂軸");
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
  const frame = part(m335.default, "frame");
  assertOnePiece(frame, "機架的每一塊都連成一件");
  // 樑的軸(機架上不轉的軸)在樑的樞軸上,穿在軸承環裡
  const O1 = part(m335.default, "beam").center;
  const axle = frame.pieces.find((q) => q.kind === "cylinder" && !q.inner && Math.hypot(q.at[0] - O1[0], q.at[1] - O1[1]) < 1e-9);
  assert.ok(axle, "樑的樞軸上有軸");
  assertShaftInBearings(axle, frame.pieces, "樑的軸");
});

test("第 337 種:半徑桿接在短擺動桿的下端,擺動桿中點(活塞桿)的軌跡近似直線", () => {
  const ps = sweep(m337.RANGE[1], 30, m337.RANGE[0]).map((v) => m337.watt(v).P);
  const ys = ps.map((p) => p[1]);
  assert.ok(verticalDeviation(ps) / (Math.max(...ys) - Math.min(...ys)) < 0.03, "偏離鉛直線不到行程的 3%");
});

test("第 337 種:活塞桿接在擺動桿的中點 P:有一根銷穿過擺動桿與活塞桿", () => {
  const def = m337.default;
  for (const v of sweep(m337.RANGE[1], 12, m337.RANGE[0])) assertPinned(def, v, m337.watt(v).P, [["vibrating"], ["pistonRod"]], "擺動桿中點 P ");
});

test("第 337 種:活塞桿從 P 往下經過擺動桿下端 R,和 R 的銷(半徑桿與擺動桿的接點)不在同一個深度,全程不穿入", () => {
  const def = m337.default;
  const rod = part(def, "pistonRod");
  let passes = false;
  for (const v of sweep(m337.RANGE[1], 24, m337.RANGE[0])) {
    const { P, R } = m337.watt(v);
    const pose = def.pose(v).parts;
    const [r0, r1] = layerOf(def, pose, "pistonRod");
    if (R[1] < P[1] && Math.abs(R[0] - P[0]) < rod.size[0] / 2 + 0.05) passes = true;
    // R 的銷:各零件在 R 的銷,加上兩根連桿端頭自帶的銷頭(連桿厚度的 2.2 倍)
    const spans = pinsOf(def, v).filter((q) => Math.hypot(q.at[0] - R[0], q.at[1] - R[1]) < 1e-6).map((q) => [q.z0, q.z1]);
    for (const id of ["radiusBar", "vibrating"]) {
      const l = part(def, id);
      if (l.pins === false) continue;
      const z = pose[id].to[2];
      close(dist(pose[id].to, [R[0], R[1], z]), 0, `${id} 的一端在 R`, 1e-9);
      spans.push([z - 1.1 * l.thickness, z + 1.1 * l.thickness], layerOf(def, pose, id));
    }
    for (const [z0, z1] of spans) assert.ok(z1 <= r0 + 1e-9 || z0 >= r1 - 1e-9, `主動量 ${v.toFixed(2)}:活塞桿(z ${r0.toFixed(3)}–${r1.toFixed(3)})碰到 R 的銷或連桿(z ${z0.toFixed(3)}–${z1.toFixed(3)})`);
  }
  assert.ok(passes, "活塞桿在行程中經過 R(這條斷言才有意義)");
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

test("第 338 種:半徑桿在樑的上方,樞軸照原圖往樑的中段挪(維護者決定的折衷):樞軸在樑長 0.25–0.4 倍處的上方,半徑桿約樑長的 0.6–0.8", () => {
  const { O1, O2, b } = m338.watt;
  const a = m338.BEAM;
  const dx = O2[0] - O1[0];
  assert.ok(dx > 0.25 * a && dx < 0.4 * a, `樞軸在樑樞軸右邊 ${(dx / a).toFixed(2)} 倍樑長`);
  for (const v of sweep(m338.RANGE[1], 12, m338.RANGE[0])) {
    const { B, R } = m338.watt(v);
    const beamY = O1[1] + ((B[1] - O1[1]) * dx) / (B[0] - O1[0]);
    assert.ok(O2[1] > beamY + 0.5, "樞軸在樑的上方");
    assert.ok(R[1] > B[1], "半徑桿接在短連桿上端,在樑端上方");
  }
  assert.ok(b > 0.6 * a && b < 0.8 * a, `半徑桿長 ${(b / a).toFixed(2)} 倍樑長`);
  const swing = m338.RANGE[1] - m338.RANGE[0];
  close(swing, deg(16), "擺幅 16°", 1e-9);
});

test("第 338 種:樑端 B 是圓眼,有一根銷穿過樑與短連桿;活塞桿掛在短連桿下端 P 的銷上", () => {
  const def = m338.default;
  for (const v of sweep(m338.RANGE[1], 12, m338.RANGE[0])) {
    const { B, P } = m338.watt(v);
    assertPinned(def, v, B, [["beam"], ["short"]], "樑端 B ");
    assertPinned(def, v, P, [["short"], ["pistonRod"]], "短連桿下端 P ");
  }
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

test("第 339 種:F、A、C、B 四個接點都有銷穿過相接的零件;F 的銷從機架伸出,BC 桿、活塞桿與連桿全程從 F 的銷前面經過", () => {
  const def = m339.default;
  let below = false;
  let above = false;
  for (const p of sweep(1, 24)) {
    const r = m339.russell(p);
    assertPinned(def, p, m339.F, [["radiusFA"]], "固定樞軸 F ");
    assertPinned(def, p, r.A, [["radiusFA"], ["barBC"]], "BC 的中點 A ");
    assertPinned(def, p, r.C, [["barBC"], ["pistonRod"], ["rod"]], "活塞桿頂 C ");
    assertPinned(def, p, r.B, [["sliderB"], ["barBC"]], "B 端的滑塊 ");
    below ||= r.C[1] < m339.F[1];
    above ||= r.C[1] > m339.F[1];
    const pose = def.pose(p).parts;
    const fPin = pinsOf(def, p).find((q) => Math.hypot(q.at[0] - m339.F[0], q.at[1] - m339.F[1]) < 1e-6);
    for (const id of ["barBC", "pistonRod", "rod"]) assert.ok(layerOf(def, pose, id)[0] >= fPin.z1 - 1e-9, `${id} 在 F 的銷前面`);
  }
  assert.ok(below && above, "C 在行程中經過 F 的高度(上面那條斷言才有意義)");
});

test("第 339 種:機架是一件——整塊鑄件的腹板托著 F 的銷,溝槽 D 的板貼在機架上,機架落在底座上;頂上的曲柄軸穿在軸承座的孔裡", () => {
  const def = m339.default;
  assertOnePiece(part(def, "frame"), "機架的每一塊都連成一件");
  const frame = part(def, "frame").pieces;
  const crank = part(def, "crank");
  const shaft = crank.pieces.find((q) => q.kind === "cylinder" && !q.accent);
  assertShaftInBearings({ ...shaft, at: add(crank.center, shaft.at) }, frame, "曲柄軸");
  // 滑塊 B 在溝槽 D 的板那一層、在溝槽裡
  const slot = frame.find((q) => q.kind === "plate" && q.shape.holes.some((h) => h.every(([x]) => x + (q.at?.[0] ?? 0) < m339.F[0] - 1)));
  const [d0, d1] = zSpan(slot);
  for (const p of sweep(1, 12)) {
    const pose = def.pose(p).parts;
    const [b0, b1] = layerOf(def, pose, "sliderB");
    assert.ok(b0 >= d0 - 1e-9 && b1 <= d1 + 1e-9, "滑塊在溝槽板那一層");
    const box = part(def, "sliderB");
    const [x, y] = pose.sliderB.position;
    const hole = slot.shape.holes[0].map(([u, v]) => [u + (slot.at?.[0] ?? 0), v + (slot.at?.[1] ?? 0)]);
    for (const c of rect(box.size[0], box.size[1], x, y)) assert.ok(pointInPolygon(c, hole), "滑塊在溝槽裡");
  }
});

test("第 340 種:樑架在搖動立柱支座 B–F 上,支座繞中心 F 擺動,半徑桿 E–A 產生平行運動:C 近似直線", () => {
  straightish(sweep(m340.RANGE[1], 30, m340.RANGE[0]).map((v) => m340.beam(v).C), 0.01);
});

test("第 340 種:D 端的桿是會擺的連桿:上端以銷接在樑端 D,下端的銷在固定的鉛直導槽裡滑(推斷)", () => {
  const def = m340.default;
  const rod = part(def, "rodD");
  assert.equal(rod.kind, "link", "D 端的桿是連桿(不是只平移的方塊)");
  const pin = rod.pieces.find((q) => q.kind === "cylinder");
  const values = sweep(m340.RANGE[1], 16, m340.RANGE[0]);
  const first = def.pose(values[0]).parts.rodD;
  const length = dist(first.from, first.to);
  const angles = [];
  for (const v of values) {
    const b = m340.beam(v);
    const s = def.pose(v).parts.rodD;
    close(Math.hypot(s.from[0] - b.D[0], s.from[1] - b.D[1]), 0, "桿的上端在 D", 1e-9);
    close(dist(s.from, s.to), length, "桿長不變", 1e-9);
    close(s.to[0], first.to[0], "下端走固定的鉛直線", 1e-9);
    angles.push(Math.atan2(s.to[0] - s.from[0], s.from[1] - s.to[1]));
    assertPinned(def, v, b.D, [["beam"], ["rodD"]], "D 端");
    assertPinned(def, v, s.to, [["rodD"]], "桿的下端");
    const [z0, z1] = zSpan(pin, s.from[2]);
    const slots = plateLayers(part(def, "ground")).filter((l) => l.z0 >= z0 - 1e-9 && l.z1 <= z1 + 1e-9).map((l) => l.solid);
    assert.ok(slots.length, "下端的銷伸進導槽那一層");
    const g = guidedBetween(s.to, pin.radius, slots);
    assert.ok(g.open && g.sides && g.depth < 0.005, `主動量 ${v.toFixed(3)}:下端的銷在導槽裡,兩側有壁、不穿入(${g.depth.toFixed(4)})`);
  }
  assert.ok(Math.max(...angles) - Math.min(...angles) > deg(15), "桿跟著 D 斜擺");
});

test("第 340 種:樑套在立柱頂 B 的粗軸上(原圖 B 是打斜線的軸),A、C 以銷接半徑桿與活塞桿,E 的銷穿過半徑桿", () => {
  const def = m340.default;
  const holeR = Math.max(...plateLayers(part(def, "beam"))[0].solid.holes[0].map((p) => Math.hypot(p[0], p[1])));
  const rod = part(def, "pistonRod");
  for (const v of sweep(m340.RANGE[1], 8, m340.RANGE[0])) {
    const b = m340.beam(v);
    const pose = def.pose(v).parts;
    const shaft = pinsOf(def, v).find((q) => Math.hypot(q.at[0] - b.B[0], q.at[1] - b.B[1]) < 1e-6 && q.r >= holeR - 1e-3);
    assert.ok(shaft, "B 有和樑孔一樣粗的軸");
    assertPinned(def, v, b.B, [["beam"], ["pillar"]], "B ");
    assertPinned(def, v, b.A, [["beam"], ["radiusBar"]], "A ");
    assertPinned(def, v, m340.geometry.E, [["radiusBar"]], "E ");
    assertPinned(def, v, b.C, [["beam"]], "C ");
    const pinC = pinsOf(def, v).find((q) => Math.hypot(q.at[0] - b.C[0], q.at[1] - b.C[1]) < 1e-6);
    const z = pose.pistonRod.position[2];
    assert.ok(pinC.z0 <= z - rod.size[2] / 2 + 1e-9 && pinC.z1 >= z + rod.size[2] / 2 - 1e-9, "C 的銷穿過活塞桿那一層");
    assert.ok(pose.pistonRod.position[1] + rod.size[1] / 2 >= b.C[1] + pinC.r - 1e-9, "活塞桿的頂端包住 C 的銷");
    const [r0, r1] = [z - rod.size[2] / 2, z + rod.size[2] / 2];
    const [b0, b1] = layerOf(def, pose, "beam");
    assert.ok(r0 >= b1 || r1 <= b0, "活塞桿不伸進樑的板");
  }
});

test("第 340 種:E 的樞軸裝在從牆伸出的托架上,牆站在底座上(固定件連成一塊)", () => {
  const def = m340.default;
  assertOnePiece(part(def, "ground"), "固定件的每一塊都連到底座");
  const E = m340.geometry.E;
  assert.ok(pinsOf(def, 0).some((q) => Math.hypot(q.at[0] - E[0], q.at[1] - E[1]) < 1e-6), "E 有銷");
});

test("第 341 種:蚱蜢式樑式引擎:樑的一端在搖動立柱 A 上,半徑桿 B 讓活塞桿端走近似直線", () => {
  straightish(sweep(1, 40).map((p) => m341.grasshopper(p).C), 0.01);
  steamPushes(m341.default, sweep(1, 8));
});

test("第 341 種:半徑桿 B 的固定樞軸在牆上的托架、銷穿過半徑桿,另一端以銷接在樑的中點;牆站在底座上", () => {
  const def = m341.default;
  assertOnePiece(part(def, "frame"), "機架的每一塊(牆、托架、軸承座)都連到底座");
  for (const p of sweep(1, 8)) {
    const g = m341.grasshopper(p);
    assertPinned(def, p, m341.geometry.E, [["radiusB"]], "半徑桿的固定樞軸");
    assert.ok(pinsOf(def, p).some((q) => Math.hypot(q.at[0] - m341.geometry.E[0], q.at[1] - m341.geometry.E[1]) < 1e-6 && part(def, "frame").pieces.some((f) => f.kind === "cylinder" && f.radius === q.r)), "固定樞軸的銷屬於機架");
    assertPinned(def, p, g.mid, [["beam"], ["radiusB"]], "樑的中點");
  }
});

test("第 341 種:曲柄軸跟著曲柄轉,從軸承座穿過圓盤伸到曲柄臂的背面(曲柄臂、銷經軸連回軸承座,不是憑空連動)", () => {
  const def = m341.default;
  const crank = part(def, "crank");
  assertOnePiece(crank, "曲柄的每一塊(軸、圓盤、臂、銷)連成一件");
  const shaft = crank.pieces.find((q) => q.kind === "cylinder" && !q.inner && Math.hypot(q.at[0], q.at[1]) < 1e-9 && q.length > 0.3);
  assert.ok(shaft, "曲柄群組裡有曲柄軸");
  const arm = crank.pieces.find((q) => q.kind === "box");
  const [, s1] = zSpan(shaft, crank.center[2]);
  assert.ok(s1 >= zSpan(arm, crank.center[2])[0] - 1e-9, "軸伸到曲柄臂的背面");
  const frame = part(def, "frame");
  assertShaftInBearings({ ...shaft, at: add(crank.center, shaft.at) }, frame.pieces, "曲柄軸");
  const at = (q) => Math.hypot(q.at[0] - crank.center[0], q.at[1] - crank.center[1]) < 1e-9;
  assert.ok(!frame.pieces.some((q) => q.kind === "cylinder" && !q.inner && at(q)), "機架裡沒有不轉的曲柄軸");
});

test("第 341 種:半徑桿在樑後面一層(原圖右段畫虛線);活塞桿頂以銷穿過樑在 C 的孔,活塞桿不伸進樑的板", () => {
  const def = m341.default;
  const holeR = Math.max(...plateLayers(part(def, "beam"))[0].solid.holes[0].map((p) => Math.hypot(p[0], p[1])));
  const rod = part(def, "pistonRod");
  for (const p of sweep(1, 8)) {
    const g = m341.grasshopper(p);
    const pose = def.pose(p).parts;
    const [b0, b1] = layerOf(def, pose, "beam");
    assert.ok(layerOf(def, pose, "radiusB")[1] <= b0 + 1e-9, "半徑桿在樑後面");
    const pinC = pinsOf(def, p).find((q) => Math.hypot(q.at[0] - g.C[0], q.at[1] - g.C[1]) < 1e-6 && q.r >= holeR - 1e-3);
    assert.ok(pinC, "C 有和樑孔一樣粗的銷");
    assertPinned(def, p, g.C, [["beam"]], "C ");
    const z = pose.pistonRod.position[2];
    const [r0, r1] = [z - rod.size[2] / 2, z + rod.size[2] / 2];
    assert.ok(pinC.z0 <= r0 + 1e-9 && pinC.z1 >= r1 - 1e-9, "C 的銷伸進活塞桿那一層");
    // 活塞桿走汽缸中心線,C 偏離它不到 0.001:頂端的眼比銷粗,把這點偏差包住
    const eye = rod.pieces.find((q) => q.kind === "cylinder");
    const at = [pose.pistonRod.position[0] + eye.at[0], pose.pistonRod.position[1] + eye.at[1]];
    assert.ok(Math.hypot(at[0] - g.C[0], at[1] - g.C[1]) + pinC.r < eye.radius, "活塞桿頂的眼套住 C 的銷");
    assert.ok(r0 >= b1 || r1 <= b0, "活塞桿不伸進樑的板");
  }
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

/** 第 342 種:零件(方塊與它的方塊附件)在姿勢下的外框,各是一個矩形多邊形(世界 xy) */
function boxes342(def, pose, id) {
  const p = part(def, id);
  const c = pose[id].position;
  return [p, ...(p.pieces ?? []).filter((q) => q.kind === "box")].map((q) => {
    const at = q === p ? [0, 0, 0] : q.at;
    return rect(q.size[0], q.size[1], c[0] + at[0], c[1] + at[1]);
  });
}
const polylineLength342 = (pts) => pts.slice(1).reduce((sum, q, i) => sum + dist(q, pts[i]), 0);
// 第 342 種:樑的各塊板件在姿勢下的外形(世界 xy)
const beamPlates342 = (def, psi) => {
  const b = part(def, "beam");
  return b.pieces.filter((q) => q.kind === "plate").map((q) => q.shape.outline.map((v) => {
    const [x, y] = rot2(v, psi);
    return [x + b.center[0], y + b.center[1]];
  }));
};

/** 鏈條(chainId)長度不變、最後一段鉛直垂下夠長,下端接在桿(rodId)頂端的接頭上,桿和鏈條同一條直線、同深度,桿不碰樑 */
function chainHangs342(chainId, rodId) {
  const def = m342.default;
  let length = null;
  for (const p of sweep(1, 40)) {
    const pose = def.pose(p);
    const pts = pose.paths[chainId].points;
    const L = polylineLength342(pts);
    length ??= L;
    close(L, length, `進程 ${p.toFixed(3)}:${chainId} 長度不變`, 2e-3);
    const [a, end] = pts.slice(-2);
    close(a[0], end[0], "最後一段鉛直", 1e-9);
    assert.ok(a[1] - end[1] > 0.4, `進程 ${p.toFixed(3)}:${chainId} 垂下段 ${(a[1] - end[1]).toFixed(3)} 夠長`);
    const rod = pose.parts[rodId].position;
    const boxes = boxes342(def, pose.parts, rodId);
    close(Math.max(...boxes.flatMap((r) => r.map((v) => v[1]))), end[1], "鏈條下端接在桿頂的接頭上", 1e-9);
    close(rod[0], end[0], "桿在鏈條的直線上", 1e-9);
    close(rod[2], end[2], "桿和鏈條同深度", 1e-9);
    const psi = pose.parts.beam.angle;
    for (const r of boxes) for (const plate of beamPlates342(def, psi)) assert.ok(!polygonsOverlap(r, plate), `進程 ${p.toFixed(3)}:${rodId} 不伸進樑`);
  }
}

test("第 342 種:活塞桿與弓頭以鏈條相連:鏈條長度不變、全程從弓頭垂下,下端接活塞桿頂,活塞桿在鏈條的直線上、走汽缸中心線", () => {
  chainHangs342("chain", "pistonRod");
  const def = m342.default;
  for (const p of sweep(1, 8)) close(def.pose(p).parts.pistonRod.position[0], part(def, "cylinder").center[0], "活塞桿走汽缸中心線", 1e-9);
});

test("第 342 種:樑另一端的抽水桿:蒸汽進入時抽水桿的重量讓它下降、抬起活塞;大氣壓力把活塞推下時抽水桿被拉起", () => {
  const def = m342.default;
  assert.equal(def.target, "pumpRod", "目標件是抽水桿");
  chainHangs342("pumpChain", "pumpRod");
  const y = (p) => def.pose(p).parts.pumpRod.position[1];
  for (const [a, b] of [[0.05, 0.3], [0.3, 0.5]]) {
    assert.ok(m342.atmospheric(b).piston > m342.atmospheric(a).piston && y(b) < y(a), "蒸汽進入時活塞上升、抽水桿下降");
  }
  for (const [a, b] of [[0.7, 0.8], [0.8, 0.95]]) {
    assert.ok(m342.atmospheric(b).piston < m342.atmospheric(a).piston && y(b) > y(a), "活塞被推下、抽水桿被拉起");
  }
  // 抽水桿下端的桶在泵筒裡上下(推斷的泵筒)
  const rod = part(def, "pumpRod");
  const bucket = rod.pieces.find((q) => q.kind === "cylinder");
  const barrel = part(def, "frame").pieces.find((q) => q.kind === "cylinder" && q.inner && q.axis?.[1] === 1);
  assert.ok(barrel && bucket.radius <= barrel.inner, "桶比泵筒的內徑細");
  for (const p of sweep(1, 20)) {
    const c = def.pose(p).parts.pumpRod.position;
    close(c[0], barrel.at[0], "抽水桿在泵筒的中心線上", 1e-9);
    const by = c[1] + bucket.at[1];
    assert.ok(by - bucket.length / 2 >= barrel.at[1] - barrel.length / 2 && by + bucket.length / 2 <= barrel.at[1] + barrel.length / 2, `進程 ${p.toFixed(2)}:桶在泵筒裡`);
  }
});

test("第 342 種:機架落地:牆、樑台、立柱與汽缸台座連成一塊,汽缸座在台座上,樑的軸穿過牆頂軸承座的環", () => {
  const def = m342.default;
  const frame = part(def, "frame");
  assertOnePiece(frame, "機架的每一塊都連到地面");
  const cyl = part(def, "cylinder");
  const bottom = cyl.center[1] + Math.min(...cyl.profile.map(([, h]) => h));
  const x = cyl.center[0];
  const under = frame.pieces.filter((q) => q.kind === "box" && Math.abs(q.at[0] - x) <= q.size[0] / 2 && q.at[1] + q.size[1] / 2 <= bottom + 1e-9);
  close(Math.max(...under.map((q) => q.at[1] + q.size[1] / 2)), bottom, "汽缸底與台座頂面相貼", 1e-9);
  const beam = part(def, "beam");
  const axle = beam.pieces.find((q) => q.kind === "cylinder" && !q.axis && q.length > 0.6);
  assert.ok(axle, "樑上有軸");
  assertShaftInBearings({ ...axle, at: add(beam.center, axle.at ?? [0, 0, 0]) }, frame.pieces, "樑的軸");
});

test("第 342 種:兩端的弓頭都接上樑臂(樑身與斜撐伸進弓頭)", () => {
  const def = m342.default;
  const beam = part(def, "beam");
  const plates = beam.pieces.filter((q) => q.kind === "plate").map((q) => q.shape.outline);
  const body = beam.pieces.find((q) => q.kind === "plate" && q.shape.holes.some((h) => pointInPolygon([0, 0], h))).shape.outline; // 樑身:樑的軸穿過的那一塊
  const pose = def.pose(0);
  for (const id of ["chain", "pumpChain"]) {
    // 弓頭:鏈條上端固定的那一塊(換到樑的局部座標);鏈條的上端貼在它的外緣上
    const [x, y] = pose.paths[id].points[0];
    const anchor = rot2([x - beam.center[0], y - beam.center[1]], -pose.parts.beam.angle);
    const arch = plates.reduce((a, o) => (edgeDistance(anchor, o) < edgeDistance(anchor, a) ? o : a));
    assert.ok(!pointInPolygon(anchor, arch) && edgeDistance(anchor, arch) < part(def, id).width / 2, `${id} 的上端貼在弓頭外緣`);
    assert.ok(arch !== body && polygonsOverlap(body, arch), `${id} 的弓頭:樑身伸進弓頭`);
    assert.ok(plates.some((o) => o !== body && o !== arch && polygonsOverlap(o, arch) && polygonsOverlap(o, body)), `${id} 的弓頭:有斜撐從樑身伸進弓頭`);
  }
});

test("第 343 種:直立式引擎:半徑桿 A、A 接在活塞桿頂的擺動件上,活塞桿頂走近似直線", () => {
  straightish(sweep(1, 40).map((p) => m343.upright(p).P), 0.005);
  steamPushes(m343.default, sweep(1, 8));
});

test("第 343 種:平行運動的擺動範圍對稱於中位(兩根半徑桿水平時,活塞桿頂在行程中點)", () => {
  const alphas = sweep(1, 96).map((p) => m343.upright(p).alpha);
  const [lo, hi] = [Math.min(...alphas), Math.max(...alphas)];
  assert.ok(Math.abs(lo + hi) < deg(1), `半徑桿擺角 ${(lo / deg(1)).toFixed(1)}°~${(hi / deg(1)).toFixed(1)}° 對稱`);
  const ys = sweep(1, 96).map((p) => m343.upright(p).P[1]);
  close(m343.watt(0).P[1], (Math.min(...ys) + Math.max(...ys)) / 2, "中位在行程中點", 0.02);
});

test("第 343 種:擺動件在活塞桿頂部:P 的銷穿過活塞桿頂、擺動件與連桿;半徑桿兩端的銷不伸進活塞桿那一層", () => {
  const def = m343.default;
  const rod = part(def, "pistonRod");
  for (const p of sweep(1, 12)) {
    const u = m343.upright(p);
    const pose = def.pose(p).parts;
    const z = pose.pistonRod.position[2];
    const [r0, r1] = [z - rod.size[2] / 2, z + rod.size[2] / 2];
    assertPinned(def, p, u.P, [["vibrating"], ["rod"]], "P ");
    const pinP = pinsOf(def, p).find((q) => Math.hypot(q.at[0] - u.P[0], q.at[1] - u.P[1]) < 1e-6 && q.z0 <= r0 + 1e-9);
    assert.ok(pinP && pinP.z1 >= r1, "P 的銷往後穿過活塞桿那一層");
    assert.ok(pose.pistonRod.position[1] + rod.size[1] / 2 >= u.P[1] + pinP.r - 1e-9, "活塞桿頂包住 P 的銷");
    for (const [at, id] of [[u.B, "radiusL"], [u.R, "radiusR"], [m343.watt.O1, "radiusL"], [m343.watt.O2, "radiusR"]]) {
      assertPinned(def, p, at, [[id]], `${id} 的端頭`);
    }
    for (const [at] of [[u.B], [u.R]]) {
      for (const q of pinsOf(def, p).filter((q) => Math.hypot(q.at[0] - at[0], q.at[1] - at[1]) < 1e-6)) assert.ok(q.z0 >= r1 - 1e-9, "B、R 的銷不伸進活塞桿那一層");
    }
  }
});

test("第 343 種:機架的立柱與托架都站在底座上(固定件連成一塊)", () => {
  assertOnePiece(part(m343.default, "frame"), "機架的每一塊都連到底座");
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
    assertCrankShaft(def, "frame");
  });

  test(`第 ${n} 種:汽缸的耳軸是汽缸的一部分,往後伸進機架橫樑上的軸承(於固定的軸承內作動)`, () => {
    const def = m.default;
    const T = m.TRUNNION;
    const cyl = part(def, "cylinder");
    for (const v of sweep(1, 8)) {
      const s = def.pose(v).parts.cylinder;
      const stubs = (cyl.pieces ?? [])
        .filter((q) => q.kind === "cylinder")
        .map((q) => ({ q, c: add(s.position, quatRotate(s.rotation, q.at ?? [0, 0, 0])), a: quatRotate(s.rotation, q.axis ?? [0, 0, 1]) }))
        .filter(({ c, a }) => Math.abs(Math.abs(a[2]) - 1) < 1e-9 && Math.hypot(c[0] - T[0], c[1] - T[1]) < 1e-9);
      assert.ok(stubs.length > 0, `主動量 ${v}:汽缸上有沿樞軸的耳軸`);
      for (const { q, c, a } of stubs) assertShaftInBearings({ ...q, at: c, axis: a }, part(def, "frame").pieces, `主動量 ${v}:耳軸`);
    }
  });
}

/** 曲柄軸是曲柄的一部分、穿過每片曲柄臂,並穿過機架(frameId)上和它同軸的軸承環(第 344–346 種) */
function assertCrankShaft(def, frameId) {
  const crank = part(def, "crank");
  const c = crank.center;
  const onAxis = (q) => q.kind === "cylinder" && !q.axis && !q.inner && Math.hypot(q.at?.[0] ?? 0, q.at?.[1] ?? 0) < 1e-9;
  const shaft = crank.pieces.filter(onAxis).reduce((a, q) => (q.length > a.length ? q : a));
  const [s0, s1] = zSpan(shaft, c[2]);
  for (const arm of crank.pieces.filter((q) => q.kind === "plate")) {
    const [a0, a1] = zSpan(arm, c[2]);
    assert.ok(s0 <= a0 + 1e-9 && a1 - 1e-9 <= s1, `曲柄軸(z ${s0}..${s1})穿過曲柄臂(z ${a0}..${a1})`);
  }
  assertShaftInBearings({ ...shaft, at: add(c, shaft.at ?? [0, 0, 0]) }, part(def, frameId).pieces, "曲柄軸");
}

test("第 346 種:桌式引擎:十字頭在開槽導件裡直線上下,經兩根側連桿帶動桌下的兩個平行曲柄", () => {
  const def = m346.default;
  const center = part(def, "crank").center;
  const rows = sweep(1, 40).map((p) => ({ t: m346.table(p), pose: def.pose(p).parts }));
  const r = dist(rows[0].t.pin, center); // 曲柄半徑
  const heads = rows.map(({ t }) => t.head);
  close(Math.max(...heads) - Math.min(...heads), 2 * r, "十字頭行程 = 曲柄直徑", 0.02);
  const { sideRod: first, crosshead } = rows[0].pose;
  for (const { t, pose } of rows) {
    close(dist(t.pin, center), r, "曲柄銷繞曲柄軸轉", 1e-9);
    close(dist(pose.sideRod.from, pose.sideRod.to), dist(first.from, first.to), "側連桿長度不變", 1e-9);
    close(pose.crosshead.position[0], crosshead.position[0], "十字頭沿鉛直線上下", 1e-12);
  }
  steamPushes(def, sweep(1, 8));
});

test("第 346 種:兩個平行曲柄裝在桌下的同一根軸上,兩根側連桿的下端都套在曲柄銷上、上端由十字頭的銷接起", () => {
  const def = m346.default;
  assertCrankShaft(def, "table");
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
  assertShaftInBearings({ ...shaft, at: partPoint(crank.center, crank.axis, 0, shaft.at), axis: crank.axis }, part(def, "frame").pieces, "曲柄軸");
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
