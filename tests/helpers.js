// 測試共用:數值比較、零件查找、齒輪齒形不重疊的檢查
import assert from "node:assert/strict";
import { gearProfile, circle, rect } from "../models/shapes.js";
import { planeBasis, add, sub, scale, dot, norm, dist, rot2 } from "../models/kit.js";
import { pointInPolygon, penetrationDepth, circlePolygon, polygonsOverlap, edgeDistance } from "../models/contact.js";

export const close = (actual, expected, msg, eps = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < eps, `${msg ?? ""} 期望 ${expected},實際 ${actual}`);

export const part = (def, id) => def.parts.find((p) => p.id === id);

/** 主動量由 a 變到 b 時,零件 id 的轉角變化 */
export const turned = (def, id, a, b, state) => def.pose(b, state).parts[id].angle - def.pose(a, state).parts[id].angle;

// 齒輪零件在姿勢下的齒形(世界座標,投影到它自己的平面上,以 2D 回傳)
function worldProfile(gear, angle, position) {
  const [u, v] = planeBasis(gear.axis ?? [0, 0, 1]);
  const c = position ?? gear.center;
  return gearProfile(gear).map((p) => {
    const [x, y] = rot2(p, angle);
    const w = add(c, add(scale(u, x), scale(v, y)));
    return [w[0], w[1]];
  });
}

function inside([x, y], poly) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/**
 * 兩個咬合齒輪(同在 xy 平面)在主動量 values 下的齒形不重疊:
 * 外齒輪的齒不伸進另一輪的實體;內齒輪的齒廓是孔,小齒輪的點必須都在孔內。
 */
export function assertMeshFree(def, idA, idB, values, state) {
  const a = part(def, idA);
  const b = part(def, idB);
  for (const v of values) {
    const pose = def.pose(v, state).parts;
    const pa = worldProfile(a, pose[idA].angle, pose[idA].position);
    const pb = worldProfile(b, pose[idB].angle, pose[idB].position);
    if (b.internal) {
      for (const p of pa) assert.ok(inside(p, pb), `主動量 ${v}:${idA} 的齒伸進 ${idB} 的齒`);
    } else if (a.internal) {
      for (const p of pb) assert.ok(inside(p, pa), `主動量 ${v}:${idB} 的齒伸進 ${idA} 的齒`);
    } else {
      for (const p of pa) assert.ok(!inside(p, pb), `主動量 ${v}:${idA} 與 ${idB} 的齒重疊`);
      for (const p of pb) assert.ok(!inside(p, pa), `主動量 ${v}:${idB} 與 ${idA} 的齒重疊`);
    }
  }
}

/** 0 到 to 之間均勻取 n 個主動量 */
export const sweep = (to, n = 24, from = 0) => Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);

/**
 * 零件(含 pieces 與附件的附件)裡的板件,各自的 z 範圍與外形,都換到零件的局部座標。
 * 只處理附件 at 的平移:板件要沿 z、不轉(不是的會讓斷言失敗)。
 */
export function plateLayers(p) {
  const layers = [];
  const visit = (piece, [ox, oy, oz]) => {
    if (piece.kind === "plate") {
      const t = piece.thickness ?? 0.2;
      const move = (loop) => loop.map(([x, y]) => [x + ox, y + oy]);
      layers.push({ z0: oz - t / 2, z1: oz + t / 2, solid: { outline: move(piece.shape.outline), holes: (piece.shape.holes ?? []).map(move) } });
    }
    for (const c of piece.pieces ?? []) {
      if (c.kind === "plate") assert.ok(!c.angle && !c.axis && !c.rotation, "板件沿 z、不轉");
      const [x, y, z] = c.at ?? [0, 0, 0];
      visit(c, [ox + x, oy + y, oz + z]);
    }
  };
  visit(p, [0, 0, 0]);
  return layers;
}

/** 點在板件的實體裡(外形之內、孔之外) */
export const inSolid = (q, s) => pointInPolygon(q, s.outline) && !(s.holes ?? []).some((h) => pointInPolygon(q, h));

/** 兩個多邊形的間隙(重疊為 0;不相交時是頂點到對方邊的最短距離) */
export const polyGap = (a, b) => (polygonsOverlap(a, b) ? 0 : Math.min(...a.map((p) => edgeDistance(p, b)), ...b.map((p) => edgeDistance(p, a))));

/**
 * 圓(軸的截面:圓心 c、半徑 r)在 solids 的溝或槽裡:depth 是穿進實體的深度;
 * sides 是兩個相對的方向(夾角 150° 以上)上離軸面不到 0.03 就有壁——軸被兩側的壁夾著,不是旁邊空著。
 */
export function guidedBetween(c, r, solids) {
  const depth = Math.max(0, ...solids.map((s) => penetrationDepth(circlePolygon(c, r, 24), s)));
  const n = 32;
  const hits = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    const q = [c[0] + (r + 0.03) * Math.cos(a), c[1] + (r + 0.03) * Math.sin(a)];
    if (solids.some((s) => inSolid(q, s))) hits.push(a);
  }
  const sides = hits.some((a) => hits.some((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) >= (150 * Math.PI) / 180));
  return { depth, sides, open: !solids.some((s) => inSolid(c, s)) };
}

/** 曼格輪的小齒輪軸(零件 pinion 上沿 z 的圓柱)各段:局部 z 範圍與半徑 */
export const shaftSegments = (def) =>
  part(def, "pinion")
    .pieces.filter((p) => p.kind === "cylinder" && !p.axis)
    .map((p) => ({ z0: (p.at?.[2] ?? 0) - p.length / 2, z1: (p.at?.[2] ?? 0) + p.length / 2, r: p.radius }));

/**
 * 曼格輪(第 36、192–194 種)「小齒輪軸由輪上的溝槽所引導」:小齒輪軸往後伸進輪(零件 wheel)上的溝,
 * 主動量走一個週期,軸端全程在溝裡、兩側都有溝壁、不穿入。
 */
export function assertGrooveGuides(def, period, n = 300) {
  const tip = shaftSegments(def).reduce((a, b) => (a.z0 <= b.z0 ? a : b));
  const layers = plateLayers(part(def, "wheel"));
  const from = def.driver.initial ?? 0;
  for (const v of sweep(from + period, n, from)) {
    const { wheel, pinion } = def.pose(v).parts;
    const z = pinion.position[2] + tip.z0 + 0.005;
    const solids = layers.filter((l) => l.z0 <= z && z <= l.z1).map((l) => l.solid);
    assert.ok(solids.length, `主動量 ${v.toFixed(2)}:軸端伸到輪上有溝的那一層`);
    const c = rot2([pinion.position[0], pinion.position[1]], -wheel.angle);
    const g = guidedBetween(c, tip.r, solids);
    assert.ok(g.open && g.depth < 0.005, `主動量 ${v.toFixed(2)}:軸端在溝裡、不穿進溝壁(穿入 ${g.depth.toFixed(3)})`);
    assert.ok(g.sides, `主動量 ${v.toFixed(2)}:溝的兩側都貼著軸端`);
  }
}

/** 封閉折線的周長 */
export const perimeter = (outline) => outline.reduce((sum, p, i) => sum + Math.hypot(outline[(i + 1) % outline.length][0] - p[0], outline[(i + 1) % outline.length][1] - p[1]), 0);

/**
 * 推斷的重錘驅動(models/weight-drive.js;第 234、238、288–301 種):繩從擒縱輪軸上的鼓放出、(經滑輪)吊著重錘。
 * 斷言:繩長不變(鼓放出的繩 = 重錘下降的量)、重錘吊在繩的下端、鼓上還繞著繩、重錘的拉力讓輪往前轉、
 * 輪不動重錘不動、輪往前轉重錘下降、上鍊之間重錘降下一段看得出來的距離、至少擺兩個來回才上鍊一次、
 * 降到底時(主動量 every)捲回最高處(上鍊)。
 * wheel(v):輪繞鼓軸(drum.axis)的轉角;dir:輪往前轉時繞鼓軸的方向(±1,預設 drum.sense);period:擺一個來回的主動量。
 */
export function assertWeightDrive(def, { drum, wheel, period, every, dir = drum.sense }) {
  const length = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]), 0);
  const radial = (p) => {
    const d = [0, 1, 2].map((i) => p[i] - drum.center[i]);
    const along = d[0] * drum.axis[0] + d[1] * drum.axis[1] + d[2] * drum.axis[2];
    return { along, r: Math.hypot(...d.map((x, i) => x - along * drum.axis[i])) };
  };
  const onDrum = (p) => Math.abs(radial(p).r - drum.radius) < 1e-6;
  const poses = sweep(every * 0.999, 240).map((v) => ({ v, pose: def.pose(v) }));
  const l0 = length(poses[0].pose.paths.rope.points);
  for (const { v, pose } of poses) {
    const pts = pose.paths.rope.points;
    close(length(pts), l0, `主動量 ${v.toFixed(3)}:繩長不變(鼓放出的繩 = 重錘下降的量)`, 0.02);
    const w = pose.parts.weight.position;
    assert.ok(Math.abs(w[0] - pts[0][0]) < 1e-9 && Math.abs(w[2] - pts[0][2]) < 1e-9 && w[1] < pts[0][1], `主動量 ${v.toFixed(3)}:重錘吊在繩的下端`);
    assert.ok(pts.filter((p) => Math.abs(radial(p).along) < 0.3 && onDrum(p)).length > 10, `主動量 ${v.toFixed(3)}:鼓上還繞著繩`);
  }
  // 繩離開鼓的那一點受重錘拉:對輪軸的力矩朝輪往前轉的方向
  const pts = def.pose(0).paths.rope.points;
  const k = pts.findIndex(onDrum);
  const t = pts[k];
  const pull = [0, 1, 2].map((i) => pts[k - 1][i] - t[i]);
  const r = [0, 1, 2].map((i) => t[i] - drum.center[i]);
  const torque = [r[1] * pull[2] - r[2] * pull[1], r[2] * pull[0] - r[0] * pull[2], r[0] * pull[1] - r[1] * pull[0]];
  assert.ok(dir * (torque[0] * drum.axis[0] + torque[1] * drum.axis[1] + torque[2] * drum.axis[2]) > 0, "重錘的拉力讓輪往前轉");
  // 輪被擋住時重錘也停;輪往前轉時重錘下降
  const ys = poses.map(({ v, pose }) => ({ y: pose.parts.weight.position[1], w: wheel(v) }));
  for (let i = 1; i < ys.length; i++) {
    if (Math.abs(ys[i].w - ys[i - 1].w) < 1e-12) close(ys[i].y, ys[i - 1].y, "輪不動,重錘不動", 1e-9);
    if (dir * (ys[i].w - ys[i - 1].w) > 1e-3) assert.ok(ys[i].y < ys[i - 1].y, "輪往前轉,重錘下降");
  }
  assert.ok(ys[0].y - ys.at(-1).y > 0.3, "上鍊之間重錘降下一段看得出來的距離");
  assert.ok(every >= 2 * period, "至少擺兩個來回才上鍊一次");
  close(def.pose(every).parts.weight.position[1], ys[0].y, "重錘降到底時捲回最高處(上鍊)", 1e-6);
}

/** 群組零件的一塊(方塊、沿座標軸的圓柱、沿 z 的板件;不轉)的外框,世界座標(origin 是零件中心):{ lo, hi } */
export function pieceBox(q, origin = [0, 0, 0]) {
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

/**
 * 群組零件 p 的各塊連成一件:兩塊的深度範圍相接、平面外形相接就算相連(板件用輪廓、方塊用矩形、沿 z 的圓柱用圓,
 * 沿 x、y 的圓柱用外框);從第一塊走得到每一塊
 */
export function assertOnePiece(p, what) {
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

// 調速器的被調節對象(throttle.js,第 274、287、357 種,推斷):量叉臂的銷、套筒的環槽、閥桿與曲柄、閥板的實際外形。
// sleeve:帶環槽、升降的那個零件(套筒或閥桿)
export function assertThrottle(def, values, sleeve = "sleeve") {
  const lever = part(def, "lever");
  const valve = part(def, "valve");
  const groove = part(def, sleeve).pieces.find((p) => p.role === "groove");
  const pins = lever.pieces.filter((p) => p.role === "forkPin");
  const rodPin = lever.pieces.find((p) => p.role === "rodPin");
  const crankPin = valve.pieces.find((p) => p.role === "crankPin");
  const disc = valve.pieces.find((p) => p.role === "disc");
  assert.equal(pins.length, 2, "叉臂兩邊各一支銷");
  const world = (center, piece, angle) => {
    const [x, y] = rot2(piece.at, angle);
    return [center[0] + x, center[1] + y];
  };
  const rows = values.map((v) => {
    const pose = def.pose(v).parts;
    const sy = pose[sleeve].position[1];
    const top = sy + groove.at[1] + groove.length / 2;
    const bottom = sy + groove.at[1] - groove.length / 2;
    for (const pin of pins) {
      const [, y] = world(lever.center, pin, pose.lever.angle);
      const above = top - (y + pin.radius);
      const below = y - pin.radius - bottom;
      assert.ok(above >= -1e-9 && above < 0.006, `主動量 ${v.toFixed(2)}:叉臂的銷頂著環槽的上壁(間隙 ${above.toFixed(4)})`);
      assert.ok(below >= -1e-9 && below < 0.006, `主動量 ${v.toFixed(2)}:叉臂的銷頂著環槽的下壁(間隙 ${below.toFixed(4)})`);
    }
    const A = world(lever.center, rodPin, pose.lever.angle);
    const C = world(valve.center, crankPin, pose.valve.angle);
    close(Math.hypot(pose.valveRod.from[0] - A[0], pose.valveRod.from[1] - A[1]), 0, "閥桿上端接在槓桿的銷上", 1e-9);
    close(Math.hypot(pose.valveRod.to[0] - C[0], pose.valveRod.to[1] - C[1]), 0, "閥桿下端接在曲柄銷上", 1e-9);
    const n = rot2(disc.axis, pose.valve.angle);
    return { v, sleeve: sy, rod: Math.hypot(A[0] - C[0], A[1] - C[1]), opening: 1 - Math.abs(n[0]) };
  });
  for (const r of rows) close(r.rod, rows[0].rod, "閥桿長度不變", 1e-9);
  const bySleeve = [...rows].sort((a, b) => a.sleeve - b.sleeve);
  for (let i = 1; i < bySleeve.length; i++) {
    if (bySleeve[i].sleeve - bySleeve[i - 1].sleeve < 1e-9) continue;
    assert.ok(bySleeve[i].opening < bySleeve[i - 1].opening, `套筒越高,節流閥開得越小(套筒 ${bySleeve[i].sleeve.toFixed(3)})`);
  }
  assert.ok(bySleeve[0].opening > 0.95, "套筒在最低處時閥全開");
  assert.ok(bySleeve[bySleeve.length - 1].opening < 0.15, "套筒在最高處時閥幾乎關上");
}

/** 軸承環的孔比軸大的上限(各圖的孔不是等於軸徑,就是大 0.01) */
const BEARING_FIT = 0.01;

/**
 * 軸穿過 pieces 裡和它同軸的每個軸承環(有孔的圓柱):至少有一個環,環的孔套著軸(孔比軸大 0 到 BEARING_FIT),
 * 軸沿軸線蓋住整個環。軸與 pieces 都是世界座標:{ at, axis(省略為 z), radius, length },環另有 inner
 */
export function assertShaftInBearings(shaft, pieces, what) {
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
