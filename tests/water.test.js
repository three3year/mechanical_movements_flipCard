// 第十九章「水車與泵」:斷言對應原文;流體示意只驗它是主動量的函式、只在路徑上
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, inSolid, turned, pieceBox, assertShaftInBearings, assertOnePiece, assertBoxesOnePiece, polyGap, plateLayers } from "./helpers.js";
import { X, Y, Z, deg, norm, cross, dot, sub, scale, add, rot2, polar, quatRotate } from "../models/kit.js";
import { distanceToPath } from "../models/flow.js";
import { placeOutline, polygonsOverlap, penetrationDepth, segmentsCross, pointInPolygon } from "../models/contact.js";
import { bladeLine } from "../models/turbine.js";
import { toothOutline, gearSize, rect } from "../models/shapes.js";
import fig430, { INFLOW, SPILL, PIER } from "../models/fig430.js";
import * as m431 from "../models/fig431.js";
import * as m432 from "../models/fig432.js";
import * as m433 from "../models/fig433.js";
import * as m437 from "../models/fig437.js";
import * as m438 from "../models/fig438.js";
import * as m441 from "../models/fig441.js";
import * as m434 from "../models/fig434.js";
import * as m435 from "../models/fig435.js";
import * as m436 from "../models/fig436.js";
import * as m442 from "../models/fig442.js";
import * as m443 from "../models/fig443.js";
import * as m439 from "../models/fig439.js";
import * as m440 from "../models/fig440.js";
import * as m444 from "../models/fig444.js";
import * as col from "../models/oscillating-column.js";
import fig445 from "../models/fig445.js";
import fig446 from "../models/fig446.js";
import * as m447 from "../models/fig447.js";
import * as m448 from "../models/fig448.js";
import * as m449 from "../models/fig449.js";
import fig450 from "../models/fig450.js";
import fig451 from "../models/fig451.js";
import * as force from "../models/force-pump.js";
import { stroke, valveOpening } from "../models/pump.js";
import * as m452 from "../models/fig452.js";
import * as m453 from "../models/fig453.js";
import * as m454 from "../models/fig454.js";
import * as m455 from "../models/fig455.js";
import * as m456 from "../models/fig456.js";
import * as m462 from "../models/fig462.js";
import * as m457 from "../models/fig457.js";
import * as m458 from "../models/fig458.js";
import * as m459 from "../models/fig459.js";
import * as m460 from "../models/fig460.js";
import * as m461 from "../models/fig461.js";
import * as m465 from "../models/fig465.js";
import * as m463 from "../models/fig463.js";
import * as m464 from "../models/fig464.js";
import * as m466 from "../models/fig466.js";
import * as m467 from "../models/fig467.js";
import * as m468 from "../models/fig468.js";
import * as m469 from "../models/fig469.js";
const degrees = deg;

test("第 430 種:上射式水車,進程增加時水車依原圖箭頭順時針轉", () => {
  const a = fig430.pose(0.1).parts.wheel.angle;
  const b = fig430.pose(0.2).parts.wheel.angle;
  assert.ok(b < a);
  assert.equal(fig430.driver.type, "virtual");
  assert.equal(fig430.driver.mode, "progress");
  assert.equal(fig430.driver.label, "進程");
});

test("第 430 種:以水重驅動——下降側(右)的水斗存量大於上升側(左)", () => {
  for (const progress of sweep(1, 12)) {
    const pose = fig430.pose(progress).parts;
    let right = 0;
    let left = 0;
    for (const [id, p] of Object.entries(pose)) {
      if (!id.startsWith("water")) continue;
      if (p.position[0] > 0.2) right += p.level;
      if (p.position[0] < -0.2) left += p.level;
    }
    assert.ok(right > 2 && left === 0, `進程 ${progress}:右 ${right},左 ${left}`);
  }
});

test("第 430 種:流體示意的點隨進程移動,且只在水的路徑上", () => {
  const at = (progress) => fig430.pose(progress).flows;
  const a = at(0.31);
  const b = at(0.33);
  assert.notDeepEqual(a[0].points, b[0].points);
  for (const progress of sweep(2, 9)) {
    const [inflow, spill] = at(progress);
    for (const p of inflow.points) assert.ok(distanceToPath(INFLOW, p) < 1e-9);
    for (const p of spill.points) assert.ok(distanceToPath(SPILL, p) < 1e-9);
    assert.ok(inflow.points.length > 5 && spill.points.length > 3);
  }
});

const angle = (def, id, p) => def.pose(p).parts[id].angle;

test("第 431 種:下射式水車:水從閘門底下沿渠底衝過,推下方浸在水裡的浮板,輪逆時針轉", () => {
  const def = m431.default;
  assert.ok(angle(def, "wheel", 0.25) > angle(def, "wheel", 0), "進程增加,輪逆時針轉(原圖箭頭)");
  assert.ok(-m431.R.float < m431.TAIL_LEVEL && m431.TAIL_LEVEL < -m431.R.rim, "只有輪下方的浮板浸在水裡");
  // 水流沿渠底由左往右(與下方浮板的走向相同)
  const dots = def.pose(0.3).flows[0].points;
  assert.ok(dots.some((p) => p[0] > 0 && p[1] < m431.TAIL_LEVEL), "水流過輪子下方");
});

test("第 432 種:胸射式水車:水在與軸同高處流進浮板之間,被胸牆擋成水斗,隨輪往下到底才流出", () => {
  const def = m432.default;
  assert.ok(angle(def, "wheel", 0.25) < angle(def, "wheel", 0), "輪順時針轉(原圖箭頭)");
  close(Math.sin(m432.ENTRY), 0, "水在與軸同高處流進", 0.1);
  for (const p of sweep(1, 24)) {
    const parts = def.pose(p).parts;
    for (let i = 0; i < 16; i++) {
      const w = parts[`water${i}`];
      const a = Math.atan2(w.position[1] + 0.05, w.position[0]);
      if (w.level > 0.99) assert.ok(a < m432.ENTRY + 0.05 && a > m432.RELEASE - 0.05, "裝水的空隙都在胸牆那一段(右下)");
    }
  }
});

test("第 433 種:水平式上射水車:斜槽的水射到水平輪的葉片上,輪與直立軸一起轉", () => {
  const def = m433.default;
  const a = angle(def, "wheel", 0.2);
  close(a, -2 * Math.PI * 0.2, "進程一圈,輪轉一圈(從上往下看順時針,見 #433-1)");
  const end = m433.JET[m433.JET.length - 1];
  const r = Math.hypot(end[0], end[2]);
  assert.ok(r > 0.42 && r < 1.6 && Math.abs(end[1] - m433.WHEEL_Y) < 0.3, "水射到輪的葉片上");
});

// 盒子的範圍(沒有 angle 的 box)
const span = (p, k) => [p.at[k] - p.size[k] / 2, p.at[k] + p.size[k] / 2];

/** 固定軸兩端各架在一座軸承座上:軸端在軸承環裡、立柱從環往下站在底板上、底板擱在渠底上(每一對接觸的間隙 0) */
function assertAxleOnBearings(def) {
  const axle = part(def, "axle");
  const pieces = part(def, "works").pieces;
  const rings = pieces.filter((p) => p.kind === "cylinder" && p.inner != null && Math.abs(p.at[0]) < 1e-9 && Math.abs(p.at[1]) < 1e-9);
  assert.equal(rings.length, 2, "軸的兩端各一個軸承環");
  assert.ok(rings[0].at[2] * rings[1].at[2] < 0, "兩座軸承座在輪的前後兩側");
  for (const ring of rings) {
    close(ring.inner, axle.radius, "軸承的孔徑就是軸徑");
    const end = (Math.sign(ring.at[2]) * axle.length) / 2;
    assert.ok(Math.abs(end - ring.at[2]) <= ring.length / 2, "軸端在軸承環的厚度裡");
    const column = pieces.find((p) => p.kind === "box" && Math.abs(p.at[2] - ring.at[2]) < 1e-9 && p.at[1] < ring.at[1] && p.size[1] > 1);
    assert.ok(column, "軸承環下面有立柱");
    const top = span(column, 1)[1];
    assert.ok(top < ring.at[1] - ring.inner && top > ring.at[1] - ring.radius, "立柱頂接在軸承環的環身上");
    const base = pieces.find((p) => p.kind === "box" && p !== column && Math.abs(p.at[2] - ring.at[2]) < 1e-9 && Math.abs(span(p, 1)[1] - span(column, 1)[0]) < 1e-9);
    assert.ok(base, "立柱站在底板上(間隙 0)");
    const ground = pieces.find(
      (p) => p.kind === "box" && !p.angle && p !== base && p !== column && Math.abs(span(p, 1)[1] - span(base, 1)[0]) < 1e-9 && span(p, 0)[0] <= span(base, 0)[0] && span(p, 0)[1] >= span(base, 0)[1] && span(p, 2)[0] <= span(base, 2)[0] && span(p, 2)[1] >= span(base, 2)[1],
    );
    assert.ok(ground, "底板整塊擱在渠底上(間隙 0)");
  }
}

/** 閘門夾在前後兩對立柱之間、立柱打進渠底;橫樑擱在立柱頂上、跨在閘門正上方;螺桿從閘門頂穿過橫樑伸到上方 */
function assertSluice(def, sluice, bedTop) {
  const works = part(def, "works").pieces;
  for (const p of sluice.pieces) assert.ok(works.includes(p), "閘門、立柱、橫樑、螺桿都在機架裡");
  const gate = sluice.gate;
  assert.equal(sluice.posts.length, 4, "前後各一對立柱");
  for (const post of sluice.posts) {
    const side = Math.sign(post.at[0] - gate.at[0]);
    const inner = post.at[0] - (side * post.size[0]) / 2;
    close(inner, gate.at[0] + (side * gate.size[0]) / 2, "立柱貼著閘門的面(間隙 0)");
    assert.ok(Math.abs(post.at[2]) + post.size[2] / 2 <= gate.size[2] / 2 + 1e-9, "立柱在閘門的邊緣以內");
    assert.ok(span(post, 1)[0] < bedTop, "立柱打進渠底");
    close(span(post, 1)[1], span(sluice.beam, 1)[0], "橫樑擱在立柱頂上(間隙 0)");
  }
  assert.ok(sluice.posts.some((p) => p.at[2] > 0) && sluice.posts.some((p) => p.at[2] < 0), "立柱分在閘門兩邊緣");
  const gateTop = span(gate, 1)[1];
  close(sluice.rod.at[1] - sluice.rod.length / 2, gateTop, "螺桿下端接在閘門頂上");
  assert.ok(sluice.rod.at[1] + sluice.rod.length / 2 > span(sluice.beam, 1)[1], "螺桿穿過橫樑伸到上方");
  close(sluice.rod.at[0], gate.at[0], "螺桿在閘門正上方");
  close(sluice.beam.at[0], gate.at[0], "橫樑在閘門正上方");
}

test("第 430 種:水槽擱在石墩上(原圖水槽擱在左邊的石砌牆頂)", () => {
  const works = part(fig430, "works").pieces;
  const trough = works.find((p) => p.kind === "box" && p.angle && p.size[1] < 0.2);
  const pier = PIER;
  assert.ok(works.includes(pier), "石墩在機架裡");
  const tan = Math.tan(trough.angle);
  const half = trough.size[1] / 2 / Math.cos(trough.angle);
  const bottomAt = (x) => trough.at[1] + (x - trough.at[0]) * tan - half;
  const pierTop = span(pier, 1)[1];
  close(pierTop, bottomAt(pier.at[0]), "石墩頂貼著水槽底(間隙 0)", 1e-6);
  for (const x of span(pier, 0)) {
    assert.ok(pierTop < bottomAt(x) + 2 * half, "石墩沒有戳穿水槽底");
    assert.ok(bottomAt(x) - pierTop < 0.06, "水槽底沿石墩的寬度都貼著");
  }
});

test("第 430 種:水車的固定軸兩端架在軸承座上", () => assertAxleOnBearings(fig430));
test("第 431 種:水車的固定軸兩端架在軸承座上", () => assertAxleOnBearings(m431.default));
test("第 432 種:水車的固定軸兩端架在軸承座上", () => assertAxleOnBearings(m432.default));

test("第 431 種:閘門夾在立柱之間、橫樑跨在閘門正上方、螺桿從閘門頂穿過橫樑接手柄", () => {
  assertSluice(m431.default, m431.SLUICE, m431.BED);
  assert.ok(span(m431.SLUICE.gate, 1)[0] > m431.BED + 0.1, "閘門下緣離渠底一段,水從閘門底下衝出");
});

test("第 432 種:閘門夾在立柱之間、橫樑跨在閘門正上方、螺桿從閘門頂穿過橫樑", () => {
  assertSluice(m432.default, m432.SLUICE, m432.BANK_TOP);
});

test("第 433 種:葉片裝在輪上(目標件),斜向與水柱都把輪往它的轉向推(從上往下看順時針)", () => {
  const def = m433.default;
  const wheel = part(def, "wheel");
  assert.equal(part(def, "vanes"), undefined, "葉片不再是另一個零件");
  assert.equal(m433.VANES.length, 18);
  for (const v of m433.VANES) assert.ok(wheel.pieces.includes(v), "每片葉片都是輪的一塊");
  const omega = (angle(def, "wheel", 0.01) - angle(def, "wheel", 0)) / 0.01; // 繞輪軸(局部 z = 世界 +y)
  assert.ok(omega < 0, "從上往下看順時針");
  for (const v of m433.VANES) {
    // 葉片面上水往下滑的方向(局部座標,z 朝上):重力在葉片面內的分量
    const n = quatRotate(v.rotation, Y); // 葉片的厚度方向 = 面的法線
    const down = sub(scale(Z, -1), scale(n, dot(scale(Z, -1), n)));
    const velocity = scale(cross(Z, v.at), omega); // 葉片所在處的切線速度
    assert.ok(dot(down, velocity) < -0.1, "水沿葉片往下滑的方向逆著葉片的走向,反作用力推著葉片往轉向走");
  }
  // 水柱:斜槽的方向與落在葉片上那一段的方向,都順著打到處葉片的走向(世界座標)
  const hit = sub(m433.JET[m433.JET.length - 1], wheel.center);
  const velocity = scale(cross(Y, hit), omega);
  assert.ok(dot(sub(m433.JET[1], m433.JET[0]), velocity) > 0, "斜槽把水往葉片走的方向射");
  assert.ok(dot(sub(m433.JET[2], m433.JET[1]), velocity) > 0, "水落到葉片上時順著葉片走");
});

test("第 433 種:軸承座塊掛在橫樑底下,直立軸的上端在軸承裡", () => {
  const def = m433.default;
  const frame = part(def, "frame").pieces;
  const beam = frame.find((p) => p.kind === "box" && p.size[0] >= 4);
  const block = frame.find((p) => p.kind === "box" && p.size[0] < 1 && p.at[1] > 2);
  const bearing = frame.find((p) => p.kind === "cylinder");
  close(span(block, 1)[1], span(beam, 1)[0], "座塊頂貼著橫樑底(間隙 0)");
  assert.ok(bearing.at[1] + bearing.length / 2 >= span(block, 1)[0] - 1e-9, "軸承接在座塊上");
  const shaft = part(def, "wheel").pieces.find((p) => p.kind === "cylinder" && p.length > 3);
  const top = m433.WHEEL_Y + shaft.at[2] + shaft.length / 2;
  assert.ok(top > bearing.at[1] - bearing.length / 2 && top < bearing.at[1] + bearing.length / 2, "直立軸的上端在軸承裡");
});

test("第 434 種:轉輪的底盤與軸接上水斗的下環(底盤從導葉底板外面那一圈碰到下環)", () => {
  const def = m434.default;
  const plates = part(def, "wheel").pieces.filter((p) => p.kind === "plate");
  const disc = plates.find((p) => !p.shape.holes.length && Math.min(...p.shape.outline.map(([x, y]) => Math.hypot(x, y))) > 1.9);
  const lowerRing = plates.filter((p) => p.shape.holes.length && p.at[2] < 0).sort((a, b) => a.at[2] - b.at[2])[0];
  const shaft = part(def, "wheel").pieces.find((p) => p.kind === "cylinder");
  const z = (p, s) => p.at[2] + (s * p.thickness) / 2;
  close(z(lowerRing, -1), z(disc, 1), "下環的底貼著底盤的頂(間隙 0)", 1e-9);
  assert.ok(shaft.at[2] - shaft.length / 2 <= z(disc, 1) && shaft.at[2] + shaft.length / 2 >= z(disc, -1), "軸接在底盤上");
  // 下環在導葉底板(固定件)外面那一圈,高度上和底板重疊也碰不到
  const guidePlate = part(def, "guides").pieces.find((p) => p.kind === "plate" && p.shape.outline.length > 20 && p.at[2] < 0);
  const guideR = Math.max(...guidePlate.shape.outline.map(([x, y]) => Math.hypot(x, y)));
  const ringInner = Math.min(...lowerRing.shape.holes[0].map(([x, y]) => Math.hypot(x, y)));
  assert.ok(ringInner > guideR, "下環的內緣在導葉底板之外");
});

test("第 437 種:渦殼式水輪:蝸殼使水作用在輪周所有葉片上;蝸殼越轉越窄", () => {
  for (const t of sweep(2 * Math.PI, 12)) assert.ok(m437.volute(t) > m437.WHEEL, "蝸殼與葉片之間始終有水道(水繞整圈)");
  assert.ok(m437.volute(0) > m437.volute(Math.PI) && m437.volute(Math.PI) > m437.volute(2 * Math.PI), "水邊走邊送進葉片,水道越來越窄");
  assert.ok(angle(m437.default, "wheel", 0.2) < 0, "輪順時針轉(原圖箭頭)");
});

// 方塊附件(at、rotation 四元數)在零件局部座標的八個角
const boxCorners = (q) => {
  const [sx, sy, sz] = q.size;
  const corners = [];
  for (const i of [-1, 1]) for (const j of [-1, 1]) for (const k of [-1, 1]) {
    const c = quatRotate(q.rotation, [(i * sx) / 2, (j * sy) / 2, (k * sz) / 2]);
    corners.push([c[0] + q.at[0], c[1] + q.at[1], c[2] + q.at[2]]);
  }
  return corners;
};

test("第 437 種:蝸殼壁的輪廓不自交;壁與舌都在輪葉外面,輪在壁裡轉不碰壁", () => {
  const casing = part(m437.default, "casing");
  const plates = casing.pieces.filter((q) => q.kind === "plate");
  assert.ok(plates.some((q) => q.role === "wall") && plates.some((q) => q.role === "tongue"), "蝸殼壁與進水道下壁的舌");
  for (const p of plates) {
    const o = p.shape.outline;
    const n = o.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        assert.ok(!segmentsCross(o[i], o[(i + 1) % n], o[j], o[(j + 1) % n]), `${p.role} 的外輪廓自交(邊 ${i} 與 ${j})`);
      }
    }
    if (p.role === "wall" || p.role === "tongue") for (const q of o) assert.ok(Math.hypot(q[0], q[1]) > m437.WHEEL + 0.03, `${p.role} 在輪葉外面(半徑 ${Math.hypot(q[0], q[1]).toFixed(3)})`);
  }
});

test("第 437 種:在底部加裝傾斜的水斗 c,水從水斗的開口逸出時以額外的力推輪", () => {
  const def = m437.default;
  const wheel = part(def, "wheel");
  const disc = wheel.pieces.find((q) => q.role === "disc");
  const buckets = wheel.pieces.filter((q) => q.role === "bucket");
  const floor = part(def, "casing").pieces.find((q) => q.role === "floor");
  const discBottom = disc.at[2] - disc.thickness / 2;
  const w = turned(def, "wheel", 0, 0.1);
  assert.ok(buckets.length >= 2 && disc.shape.holes.length === buckets.length, "每個水斗有一個開口");
  for (const b of buckets) {
    const corners = boxCorners(b);
    const zs = corners.map((c) => c[2]);
    assert.ok(Math.max(...zs) <= discBottom + 0.03 && Math.max(...zs) >= discBottom - 0.01, "水斗接在輪盤的底面(在底部)");
    assert.ok(Math.min(...zs) < discBottom - 0.15, "水斗往下伸");
    const nrm = quatRotate(b.rotation, Y);
    assert.ok(Math.abs(nrm[2]) > 0.3 && Math.abs(nrm[2]) < 0.95, `水斗是傾斜的(板面法線的 z 分量 ${nrm[2].toFixed(2)})`);
    let d = quatRotate(b.rotation, Z);
    if (d[2] > 0) d = d.map((v) => -v);
    const r = norm([b.at[0], b.at[1], 0]);
    const t = [-r[1], r[0], 0];
    assert.ok(Math.sign(dot(d, t)) === -Math.sign(w), "水沿水斗的斜面往輪轉的反方向流出,反作用力推輪");
    // 開口:水斗的上緣在輪盤的一個洞裡
    const top = [b.at[0] - (d[0] * b.size[2]) / 2, b.at[1] - (d[1] * b.size[2]) / 2];
    assert.ok(disc.shape.holes.some((h) => pointInPolygon(top, h)), "水斗的上緣對著輪盤上的開口");
    // 水斗穿過底板中央的出水口
    for (const c of corners) if (c[2] < floor.at[2] + floor.thickness / 2) assert.ok(pointInPolygon([c[0], c[1]], floor.shape.holes[0]), "水斗伸進底板中央的出水口裡");
  }
  const dots = def.pose(0.3).flows[0].points;
  assert.ok(dots.some((p) => p[2] < floor.at[2] - floor.thickness / 2 - 0.05), "水從水斗往下逸出到底板下面");
});

test("第 437 種:葉片 a 照原圖:八片只在外圈(內環到外緣),頂端那一片直立", () => {
  const vanes = part(m437.default, "wheel").pieces.filter((q) => q.role === "vane");
  assert.equal(vanes.length, 8);
  for (const v of vanes) {
    const mid = Math.hypot(v.at[0], v.at[1]);
    assert.ok(mid - v.size[0] / 2 >= 0.55 * m437.WHEEL, "葉片的內端在外圈(不伸到輪轂)");
    assert.ok(mid + v.size[0] / 2 <= m437.WHEEL + 1e-9, "葉片的外端在輪緣");
  }
  assert.ok(vanes.some((v) => Math.abs(((v.angle - Math.PI / 2) % Math.PI) + Math.PI) % Math.PI < 1e-9), "頂端那一片直立");
});

test("第 438 種:巴克氏水車:水從臂端噴出,軸的轉向與噴水方向相反;兩根管十字交叉、四個噴口", () => {
  const def = m438.default;
  assert.equal(m438.nozzles(0).length, 4, "四個噴口(原圖兩根管十字交叉)");
  const tips = m438.nozzles(0).map(({ tip }) => Math.atan2(-tip[2], tip[0])).sort((a, b) => a - b);
  for (let i = 1; i < 4; i++) close(tips[i] - tips[i - 1], Math.PI / 2, "四個噴口相隔 90°", 1e-9);
  assert.ok(part(def, "arms") === undefined && part(def, "shaft").pieces.some((q) => q.role === "arm"), "臂裝在軸上");
  for (const p of sweep(1, 8)) {
    const a = angle(def, "shaft", p);
    for (const { tip, dir } of m438.nozzles(a)) {
      // 噴口的轉動方向(繞 +y,角度 a 變小時):切線速度
      const da = -1e-4;
      const next = m438.nozzles(a + da).find((n) => Math.hypot(n.tip[0] - tip[0], n.tip[2] - tip[2]) < 0.01);
      const v = [next.tip[0] - tip[0], next.tip[2] - tip[2]];
      assert.ok(v[0] * dir[0] + v[1] * dir[2] < 0, "噴口往噴水的反方向走");
      close(Math.hypot(tip[0], tip[2]), Math.hypot(m438.ARM, 0.25), "噴口在臂端");
    }
  }
});

test("第 438 種:軸的下端收成尖頂,尖頂接在軸底、立在底座上", () => {
  const def = m438.default;
  const shaft = part(def, "shaft");
  const rod = shaft.pieces.find((q) => q.role === "shaft");
  const tip = shaft.pieces.find((q) => q.role === "tip");
  const base = part(def, "frame").pieces.find((q) => q.role === "base");
  const rodBottom = rod.at[2] - rod.length / 2;
  const tipTop = tip.at[2] + Math.max(...tip.profile.map((p) => p[1]));
  const tipPoint = tip.at[2] + Math.min(...tip.profile.map((p) => p[1]));
  close(tipTop, rodBottom, "尖頂的頂面接在軸底", 1e-9);
  close(shaft.center[1] + tipPoint, base.at[1] + base.size[1] / 2, "尖頂立在底座上", 0.01);
  assert.ok(pieceBox(base).lo[1] <= pieceBox(part(def, "frame").pieces.find((q) => q.role === "floor")).hi[1] + 1e-9, "底座立在地板上");
});

test("第 441 種:波斯水車:水桶在低處裝滿,滿著升到高處,碰到固定銷傾斜倒空,下降時空著", () => {
  const deg = Math.PI / 180;
  const low = m441.bucket(-90 * deg + 30 * deg);
  assert.equal(low.level, 1, "過了最低點就裝滿");
  assert.equal(low.tilt, 0, "上升時桶子垂直掛著");
  const tilts = sweep(m441.PIN + 40 * deg, 60, m441.PIN - 20 * deg).map((a) => m441.bucket(a).tilt);
  assert.ok(Math.max(...tilts) > 1, "經過頂端時被固定銷撥斜");
  const after = m441.bucket(m441.PIN + 130 * deg);
  assert.equal(after.level, 0, "倒過之後空著下降");
  assert.equal(after.tilt, 0, "離開銷後靠自重擺回、垂直掛著");
  // 擺回是加速的:剛離開銷時擺得慢,越擺越快
  const back = sweep(m441.PIN + 80 * deg, 11, m441.PIN + 25 * deg).map((a) => m441.bucket(a).tilt);
  const steps = back.slice(1).map((t, i) => back[i] - t).filter((d) => d > 1e-6);
  assert.ok(steps.length > 2 && steps[steps.length - 1] > steps[0], "越擺越快");
  assert.ok(angle(m441.default, "wheel", 0.2) > 0, "輪逆時針轉(原圖箭頭)");
  assert.ok(-m441.RIM < m441.RIVER, "輪的下半部浸在水流裡");
});

test("第 441 種:水流作用於浮板的凸面;轉過水平的浮板把舀起的水一路下坡導進空心軸;照原圖 6 片浮板、6 個水桶", () => {
  const deg = Math.PI / 180;
  // 最低處的浮板(外端在 270°):河水往 +x 流,輪逆時針轉、底部往右走;浮板要鼓向 −x(上游),迎著水流的才是凸面
  const low = m441.floatAt(270 * deg);
  const [hx, hy] = low[0];
  const [ox, oy] = low.at(-1);
  for (const [x, y] of low.slice(1, -1)) {
    const side = (ox - hx) * (y - hy) - (oy - hy) * (x - hx); // 弦從軸端指向外端(往下),右側(負)是 −x
    assert.ok(side < 0, "浮板鼓向上游:水流推的是凸面");
    assert.ok(x < Math.max(hx, ox), "浮板整片在弦的上游側");
  }
  assert.ok(angle(m441.default, "wheel", 0.2) > 0, "輪逆時針轉,底部的浮板隨水流往右走");
  // 右側升起、轉過水平的浮板:從外端到軸端一路往下,舀起的水沿浮板流進空心軸
  for (const outer of [60, 75, 90, 105]) {
    const pts = m441.floatAt(outer * deg).slice().reverse();
    for (let i = 1; i < pts.length; i++) assert.ok(pts[i][1] < pts[i - 1][1], `外端在 ${outer}° 的浮板:從外端到軸端一路下坡(第 ${i} 段)`);
  }
  assert.equal(m441.FLOATS, 6, "照原圖 6 片浮板,每片末端掛一個水桶");
  assert.equal(m441.default.parts.filter((p) => p.id.startsWith("bucket")).length, 6, "6 個水桶");
});

test("第 441 種:水桶掛在浮板外端的吊銷上、桶身在浮板前面一層,全程不穿進浮板;在最低處不穿進槽底", () => {
  const def = m441.default;
  const polar = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  const wheel = def.parts.find((p) => p.id === "wheel");
  const floats = wheel.pieces.filter((p) => p.kind === "plate" && p.angle !== undefined);
  const floatTop = Math.max(...floats.map((p) => (p.at?.[2] ?? 0) + p.thickness / 2));
  const [ex, ey] = polar(m441.RIM, m441.SWEEP); // 浮板外端(浮板的軸端在 0°)
  const pins = wheel.pieces.filter((p) => p.kind === "cylinder" && Math.hypot(p.at[0] - ex, p.at[1] - ey) < 1e-6);
  assert.equal(pins.length, 1, "浮板外端有一根吊銷");
  const [pin] = pins;
  const pinZ = [pin.at[2] - pin.length / 2, pin.at[2] + pin.length / 2];
  assert.ok(pinZ[0] < floatTop && pinZ[1] > floatTop, "吊銷從浮板伸到前面");
  const bucket = def.parts.find((p) => p.id === "bucket0");
  const zRange = (p) => (p.kind === "box" ? [p.at[2] - p.size[2] / 2, p.at[2] + p.size[2] / 2] : [p.at[2] - p.thickness / 2, p.at[2] + p.thickness / 2]);
  const bucketZ = bucket.pieces.map(zRange);
  assert.ok(Math.min(...bucketZ.map((z) => z[0])) >= floatTop, "水桶整個在浮板那一層的前面,不會穿過浮板");
  const eye = bucket.pieces.find((p) => p.kind === "plate" && p.shape.holes.length && p.shape.holes[0].every(([x, y]) => Math.hypot(x, y) < 0.1));
  assert.ok(eye, "吊耳是套在吊銷上的環");
  const [eyeZ0, eyeZ1] = zRange(eye);
  assert.ok(pinZ[0] < eyeZ0 && pinZ[1] > eyeZ1, "吊銷穿過吊耳");
  const hole = Math.max(...eye.shape.holes[0].map(([x, y]) => Math.hypot(x, y)));
  assert.ok(hole > pin.radius && hole - pin.radius < 0.03, "吊耳的孔套著吊銷(間隙在貼合誤差內)");
  // 水桶轉一圈,最低點都在槽底之上
  for (const a of sweep(2 * Math.PI, 72)) {
    const { tilt } = m441.bucket(a);
    const poly = placeOutline(m441.BUCKET, polar(m441.RIM, a), tilt);
    const lowest = Math.min(...poly.map((p) => p[1]));
    assert.ok(lowest > m441.BASE_TOP, `水桶在 ${Math.round((a * 180) / Math.PI)}° 時不穿進槽底(最低 ${lowest.toFixed(3)},槽底 ${m441.BASE_TOP})`);
  }
});

test("第 441 種:輪有固定軸穿過空心軸,兩岸各一根軸承柱;固定銷的支架與軸承柱都站在底座上", () => {
  const def = m441.default;
  const works = def.parts.find((p) => p.id === "works");
  const base = works.pieces.find((p) => p.kind === "box" && p.size[0] > 5);
  const baseTop = base.at[1] + base.size[1] / 2;
  close(baseTop, m441.BASE_TOP, "槽底");
  const axle = works.pieces.find((p) => p.kind === "cylinder" && Math.hypot(p.at[0], p.at[1]) < 1e-9);
  assert.ok(axle, "輪心有一根固定軸");
  assert.ok(axle.radius < m441.HUB_BORE, "固定軸穿在空心軸的孔裡");
  const stands = (p) => Math.abs(p.at[1] - p.size[1] / 2 - baseTop) < 0.06 && Math.abs(p.at[2]) + p.size[2] / 2 <= base.at[2] + base.size[2] / 2 + 1e-9;
  const posts = works.pieces.filter((p) => p.kind === "box" && Math.abs(p.at[0]) < 1e-9 && p.size[1] > 1);
  assert.equal(posts.length, 2, "兩根軸承柱");
  for (const post of posts) {
    assert.ok(stands(post), "軸承柱站在底座上");
    assert.ok(post.at[1] + post.size[1] / 2 >= axle.radius, "軸承柱頂到軸");
    assert.ok(Math.abs(post.at[2]) - post.size[2] / 2 < axle.length / 2, "軸伸進軸承柱");
    assert.ok(Math.abs(post.at[2]) - post.size[2] / 2 > 0.6, "軸承柱在輪與水桶的外面");
  }
  const bracket = works.pieces.find((p) => p.kind === "box" && p.at[0] < -1 && p.size[1] > 3);
  assert.ok(bracket && stands(bracket), "固定銷的支架立柱站在底座上");
});

test("第 434 種:福內隆渦輪:固定導葉 A 在中央,旋轉輪 B 在外側,水從圓周排出", () => {
  assert.ok(m434.GUIDE.r1 < m434.WHEEL.r0, "導葉在輪的內側");
  const def = m434.default;
  assert.ok(def.pose(0.2).parts.wheel.angle < 0, "輪順時針轉(原圖箭頭)");
  assert.equal(def.pose(0.2).parts.guides, undefined, "導葉固定不動");
  const dots = def.pose(0.37).flows[0].points;
  assert.ok(dots.some((p) => Math.hypot(p[0], p[1]) > m434.WHEEL.r1), "水從圓周排出");
});

test("第 435 種:華倫渦輪:導葉 a 在外側,輪 b 在內側轉,水從中央排出", () => {
  assert.ok(m435.WHEEL.r0 < m435.GUIDE.r1, "輪在導葉的內側");
  const def = m435.default;
  assert.equal(def.pose(0.2).parts.guides, undefined, "導葉固定不動");
  const dots = def.pose(0.37).flows[0].points;
  assert.ok(dots.some((p) => Math.hypot(p[0], p[1]) < m435.WHEEL.r1 - 0.2), "水流到中央排出");
});

test("第 435 種:導葉由外往內彎向順時針、水斗彎向逆時針(原圖);輪順時針轉,和導葉送出的水同向", () => {
  const def = m435.default;
  // 葉片中線由外往內走到內端時的轉向:r × v 的 z 分量,> 0 逆時針
  const exitTurn = (line) => {
    const [p, q] = line.slice(-2);
    return p[0] * (q[1] - p[1]) - p[1] * (q[0] - p[0]);
  };
  const guide = exitTurn(bladeLine(m435.GUIDE.r0, m435.GUIDE.r1, 0, m435.GUIDE.sweep));
  const bucket = exitTurn(bladeLine(m435.WHEEL.r0, m435.WHEEL.r1, 0, m435.WHEEL.sweep));
  const w = turned(def, "wheel", 0, 0.2);
  assert.ok(guide < 0, "導葉的內端往順時針彎,水順時針進來(原圖右側的進水箭頭往左下)");
  assert.ok(w < 0, "輪順時針轉(原圖外圍的大箭頭)");
  assert.ok(bucket > 0, "水斗的內端往逆時針彎,把水轉成逆時針送出,反作用力推輪順時針");
  // 水流記號:進到輪裡之後順時針繞向中央(同一條路徑上越靠內的點,角度越小)
  for (const p of m435.PATHS) {
    const inner = p.filter(([x, y]) => Math.hypot(x, y) < m435.GUIDE.r1);
    const angles = inner.map(([x, y]) => Math.atan2(y, x));
    for (let i = 1; i < angles.length; i++) assert.ok(Math.sin(angles[i] - angles[i - 1]) < 0, "水流記號在輪裡順時針繞向中央");
  }
});

test("第 435 種:導葉片接在底板上,外端接在外環上", () => {
  const g = part(m435.default, "guides");
  const [ring, floor] = g.pieces;
  const blades = g.pieces.filter((q) => q.role === "blade");
  assert.equal(blades.length, m435.GUIDE.count);
  const floorTop = pieceBox(floor).hi[2];
  const ringInner = Math.min(...ring.shape.holes[0].map(([x, y]) => Math.hypot(x, y)));
  for (const b of blades) {
    const box = pieceBox(b);
    assert.ok(box.lo[2] <= floorTop + 1e-9 && box.hi[2] > floorTop, `導葉的底貼著底板(底 ${box.lo[2].toFixed(3)}、底板頂 ${floorTop.toFixed(3)})`);
    const outer = Math.max(...b.shape.outline.map(([x, y]) => Math.hypot(x, y)));
    assert.ok(outer >= ringInner - 1e-9, `導葉的外端伸到外環(${outer.toFixed(3)} < ${ringInner.toFixed(3)})`);
  }
});

// 第 436 種:一圈葉片(role 是 guide 或 bucket,blade 是第幾片)各片的平面偏角 skew(葉片的長軸和半徑方向的夾角)
// 與由上到下各段的斜角 tilts(往下的方向偏離鉛直、朝逆時針切線方向為正)
function blades436(p, role, y) {
  const byBlade = new Map();
  for (const q of p.pieces.filter((q) => q.role === role)) (byBlade.get(q.blade) ?? byBlade.set(q.blade, []).get(q.blade)).push(q);
  return [...byBlade.values()].map((segments) => {
    segments.sort((a, b) => b.at[2] - a.at[2]);
    // 偏角量中段(最接近這圈的中心高度那一段):它的中心在葉片的中線上
    const middle = segments.reduce((m, s) => (Math.abs(s.at[2] - y) < Math.abs(m.at[2] - y) ? s : m));
    const r = norm([middle.at[0], middle.at[1], 0]);
    const t = [-r[1], r[0], 0];
    const ex = quatRotate(middle.rotation, X);
    const skew = Math.acos(Math.min(1, Math.abs(dot(ex, r))));
    const tilts = segments.map((s) => {
      let d = quatRotate(s.rotation, Z);
      if (d[2] > 0) d = d.map((v) => -v);
      return Math.atan2(dot(d, t), -d[2]);
    });
    return { skew, tilts };
  });
}

test("第 436 種:容瓦爾渦輪:導水槽放射狀固定在筒身裡;水斗比導水槽多、略呈切線方向而非放射方向、曲線由幾段板拼成", () => {
  const def = m436.default;
  const guides = blades436(part(def, "casing"), "guide", m436.GUIDE.y);
  const buckets = blades436(part(def, "wheel"), "bucket", 0);
  assert.equal(guides.length, m436.GUIDE.count, "導水槽固定在筒身(外殼)裡");
  assert.equal(buckets.length, m436.WHEEL.count, "水斗裝在輪上");
  assert.ok(buckets.length > guides.length, "水斗比導水槽多");
  assert.ok(m436.WHEEL.y < m436.GUIDE.y, "輪在導水槽下面");
  const w = turned(def, "wheel", 0, 0.2);
  close(def.pose(0.25).parts.wheel.angle, Math.PI / 2, "進程四分之一圈,輪轉 90°");
  const monotone = (xs, sign) => xs.every((x, i) => i === 0 || Math.sign(x - xs[i - 1]) === sign);
  for (const g of guides) {
    assert.ok(g.skew < deg(1), `導水槽放射狀(偏角 ${((g.skew * 180) / Math.PI).toFixed(1)}°)`);
    assert.ok(g.tilts.length >= 3 && monotone(g.tilts, 1), "導水槽是彎的:由上到下越來越斜");
    assert.ok(Math.abs(g.tilts[0]) < deg(12) && Math.abs(g.tilts.at(-1)) > deg(30), "水直著進導水槽、斜著出來");
    assert.ok(Math.sign(g.tilts.at(-1)) === Math.sign(w), "導水槽出口把水甩向輪轉的方向");
  }
  for (const b of buckets) {
    assert.ok(b.skew > deg(8) && b.skew < deg(30), `水斗略呈切線方向而非放射方向(和半徑夾 ${((b.skew * 180) / Math.PI).toFixed(1)}°)`);
    assert.ok(b.tilts.length >= 3 && monotone(b.tilts, -1), "水斗是彎的(擺線或拋物線):由上到下轉向另一邊");
    assert.ok(Math.sign(b.tilts[0]) === Math.sign(w) && Math.sign(b.tilts.at(-1)) === -Math.sign(w), "水斗的進口順著導水槽送來的水,出口把水轉回去,反作用力推輪");
  }
});

test("第 436 種:輪 c 在筒身裡,軸的下端立在底橋的軸承上,底橋架在筒身上", () => {
  const def = m436.default;
  const casing = part(def, "casing");
  const wheel = part(def, "wheel");
  const shell = casing.pieces.find((q) => q.role === "shell");
  const zs = shell.profile.map((p) => p[1]);
  const [bottom, top] = [Math.min(...zs), Math.max(...zs)];
  // 兩個零件的 axis 都是 Y:局部 z 就是世界的 y
  const worldY = (q, dz) => wheel.center[1] + (q.at?.[2] ?? 0) + dz;
  for (const b of wheel.pieces.filter((q) => q.role === "bucket")) {
    const half = (b.size[1] + b.size[2]) / 2;
    assert.ok(worldY(b, -half) >= bottom && worldY(b, half) <= top, "水斗整個在筒身裡");
  }
  const shaft = wheel.pieces.find((q) => q.role === "shaft");
  const beam = casing.pieces.find((q) => q.role === "beam");
  const bearing = casing.pieces.find((q) => q.role === "bearing");
  const beamTop = beam.at[2] + beam.size[2] / 2;
  close(worldY(shaft, -shaft.length / 2), beamTop, "軸的下端立在底橋上", 0.005);
  assertShaftInBearings({ at: [0, worldY(shaft, 0), 0], axis: [0, 1, 0], radius: shaft.radius, length: shaft.length }, [{ ...bearing, at: [0, bearing.at[2], 0], axis: [0, 1, 0] }], "軸的下端");
  assert.ok(beamTop - 1e-9 <= bearing.at[2] - bearing.length / 2 && bearing.at[2] - bearing.length / 2 <= beamTop + 1e-9, "軸承座在底橋上");
  const hub = wheel.pieces.find((q) => q.role === "hub");
  assert.ok(beam.at[2] - beam.size[2] / 2 + 1e-9 >= bottom && bearing.at[2] + bearing.length / 2 < worldY(hub, -hub.length / 2), "底橋在筒身底部、輪轂下面");
  close(Math.hypot(beam.size[0] / 2, beam.size[1] / 2), m436.R.case, "底橋的兩端頂著筒身的內壁", 0.01);
});

test("第 442 種:戽水車:罐子依序浸入水中裝滿,升到上方倒進水流上方的水槽", () => {
  const deg = Math.PI / 180;
  const def = m442.default;
  assert.equal(m442.potLevel(-60 * deg), 1, "過了底部的罐子已裝滿");
  assert.equal(m442.potLevel(30 * deg), 1, "上升途中滿著");
  assert.equal(m442.potLevel(150 * deg), 0, "過了頂端已倒空");
  assert.equal(m442.potLevel(-150 * deg), 0, "下降時空著");
  // 「依序浸入水中、被注滿」:裝水時罐口在水面下
  for (const a of sweep(-50 * deg, 16, -130 * deg)) {
    const level = m442.potLevel(a);
    if (level > 0 && level < 1) assert.ok(m442.mouth(a)[1] < m442.RIVER, `角度 ${Math.round(a / deg)}°:裝水時罐口浸在水裡`);
  }
  // 「倒入水流上方的水槽」:水槽高過水面;倒水時罐口比槽底高、罐口比罐底低(罐子向水槽那一側傾),水落在槽內
  assert.ok(m442.TROUGH.floor > m442.RIVER, "水槽在水流上方");
  let pouring = 0;
  for (const a of sweep(180 * deg, 180, 0)) {
    const level = m442.potLevel(a);
    if (!(level > 0 && level < 1)) continue;
    pouring++;
    const mouth = m442.mouth(a);
    const butt = m442.butt(a);
    const land = m442.landing(a);
    assert.ok(mouth[1] > m442.TROUGH.floor, `角度 ${Math.round(a / deg)}°:倒水時罐口(${mouth[1].toFixed(2)})高過槽底(${m442.TROUGH.floor})`);
    assert.ok(mouth[1] < butt[1], `角度 ${Math.round(a / deg)}°:倒水時罐口比罐底低`);
    assert.ok(land[0] > m442.TROUGH.x[0] && land[0] < m442.TROUGH.x[1], `角度 ${Math.round(a / deg)}°:水落在水槽的 x 範圍內(${land[0].toFixed(2)})`);
    assert.ok(land[2] > m442.TROUGH.z[0] && land[2] < m442.TROUGH.z[1], `角度 ${Math.round(a / deg)}°:水落在水槽的 z 範圍內(${land[2].toFixed(2)})`);
  }
  assert.ok(pouring > 0, "有倒水的角度");
  // 「水流使輪保持運轉」:河水往右流,輪逆時針轉(最低處隨水流往右)
  assert.ok(m442.RIVER_PATH[1][0] > m442.RIVER_PATH[0][0], "河水往 +x 流");
  assert.ok(def.pose(0.1).parts.wheel.angle > def.pose(0).parts.wheel.angle, "輪逆時針轉,最低處往 +x 走");
  // 水槽、支柱、軸承架與河岸連成一件、落到地上(支柱不懸空)
  const works = part(def, "works");
  assertOnePiece(works, "第 442 種:固定件連成一件");
  close(Math.min(...works.pieces.map((q) => pieceBox(q).lo[1])), m442.BED - 0.3, "固定件落到河底", 1e-9);
});

test("第 443 種:阿基米德螺旋:水流轉動下端的輪,水沿螺旋通道連續往上送,從頂端排出", () => {
  const def = m443.default;
  const z0 = m443.pockets(-2 * Math.PI * 0.1);
  const z1 = m443.pockets(-2 * Math.PI * 0.2);
  // 每團水往上移:同一團水轉十分之一圈上移十分之一螺距
  close(z1[0] - z0[0], m443.PITCH * 0.1, "螺旋轉一圈,水上移一個螺距", 1e-9);
  assert.ok(z0.length >= 4, "通道裡一路都有水(連續輸送)");
  assert.ok(def.pose(0.3).flows[0].points.length > 0);
  assert.ok(m443.BASE[1] - m443.PADDLE.r1 < m443.RIVER, "下端的輪浸在水裡");
  // 「水流作用於下端的輪上,使其旋轉」:輪最低處的浮板和河水同向(切線速度與水流方向的夾角小於 10°)
  const conj = (q) => [-q[0], -q[1], -q[2], q[3]];
  const lowest = scale(m443.DOWN, m443.PADDLE.r1);
  const rot = (v) => def.pose(v).parts.screw.rotation;
  const local = quatRotate(conj(rot(0.3)), lowest);
  const velocity = sub(quatRotate(rot(0.3 + 1e-3), local), lowest);
  assert.ok(dot(norm(velocity), m443.FLOW) > Math.cos(10 * (Math.PI / 180)), `最低處的浮板順著河水走(夾角 cos=${dot(norm(velocity), m443.FLOW).toFixed(3)})`);
  // 浮板全程不穿進河底
  const screw = part(def, "screw");
  const paddles = screw.pieces.filter((q) => q.role === "paddle");
  assert.ok(paddles.length >= 6, "下端的輪有一圈浮板");
  for (const v of sweep(1, 48)) {
    const q = rot(v);
    for (const p of paddles) {
      for (const sy of [-1, 1]) for (const z of [-1, 1]) {
        const [lx, ly] = rot2([p.size[0] / 2, (sy * p.size[1]) / 2], p.angle ?? 0);
        const corner = add(m443.BASE, quatRotate(q, add(p.at, [lx, ly, (z * p.size[2]) / 2])));
        assert.ok(corner[1] > m443.BED + 0.02, `進程 ${v.toFixed(3)}:浮板的外緣(y=${corner[1].toFixed(3)})不穿進河底(${m443.BED})`);
      }
    }
  }
  // 「斜軸內有一條貫穿的螺旋通道」:每團水坐在螺旋葉片上——槽底最低線上、水團正下方(沿軸)就有一片葉片,水在它上面、下一圈之下
  const slats = screw.pieces.filter((q) => q.role === "blade");
  assert.ok(slats.length > 100, "螺旋葉片由一片片短板拼成一圈圈");
  for (const v of sweep(1, 12)) {
    const q = rot(v);
    const a = -2 * Math.PI * v;
    const atBottom = slats.filter((s) => {
      const w = quatRotate(q, [s.at[0], s.at[1], 0]);
      return dot(norm(w), m443.DOWN) > Math.cos(Math.PI / 30);
    });
    for (const zb of m443.pockets(a)) {
      const under = atBottom.filter((s) => Math.abs(s.at[2] - zb) < 0.03);
      assert.equal(under.length, 1, `進程 ${v.toFixed(3)}:水團 z=${zb.toFixed(2)} 正下方有一片葉片`);
      for (const pt of m443.pocketPoints(zb)) {
        const z = dot(sub(pt, m443.BASE), m443.AXIS);
        assert.ok(z > under[0].at[2] + 0.015 && z < under[0].at[2] + m443.PITCH - 0.015, `水團的點在葉片上面、下一圈之下(z=${z.toFixed(2)})`);
        const radial = sub(sub(pt, m443.BASE), scale(m443.AXIS, z));
        assert.ok(Math.hypot(...radial) < m443.R - 0.04, "水團在筒壁之內");
      }
    }
  }
  // 斜軸上下兩端各有軸承(推斷:下端立在河底的軸承座,上端岸上的托架)
  const shaft = screw.pieces.find((q) => q.role === "shaft");
  const z = (shaft.at[2]);
  assertShaftInBearings({ at: add(m443.BASE, scale(m443.AXIS, z)), axis: m443.AXIS, radius: shaft.radius, length: shaft.length }, part(def, "works").pieces, "第 443 種的斜軸");
  const rings = part(def, "works").pieces.filter((p) => p.kind === "cylinder" && p.inner);
  assert.equal(rings.length, 2, "上下兩端各一個軸承環");
  const alongAxis = (p) => dot(sub(p.at, m443.BASE), m443.AXIS);
  assert.ok(Math.min(...rings.map(alongAxis)) < m443.PADDLE.z0, "一個軸承在輪的下面");
  assert.ok(Math.max(...rings.map(alongAxis)) > m443.LENGTH, "一個軸承在筒的上面");
});

test("第 439 種:水桶裝滿就下降,觸地時底部的閥門打開排空,再被配重拉上去", () => {
  let prevY = m439.cycle(0).y;
  for (const v of sweep(1, 200).slice(1)) {
    const c = m439.cycle(v);
    if (c.y < prevY - 1e-9) assert.equal(c.level, 1, "下降時水桶是滿的");
    if (c.y > prevY + 1e-9) assert.equal(c.level, 0, "上升時水桶是空的");
    // 閥門由接觸算:閥桿碰到墊塊之前閥瓣坐在閥座上,水桶再往下才被頂開
    if (m439.opening(c.y) > 1e-9) assert.ok(c.y < m439.BOTTOM + 0.12 + 1e-9, "閥門只在閥桿頂到墊塊時打開");
    close(c.y + m439.weightY(c.y), m439.TOP + m439.weightY(m439.TOP), "繩長不變");
    prevY = c.y;
  }
  close(m439.opening(m439.cycle(0.6).y), 0.12, "水桶撞到地面,閥門被頂開", 1e-9);
  close(m439.opening(m439.TOP), 0, "提起時閥瓣坐回閥座");
  // 落下是加速的,撞到墊塊才停
  const ys = [0.32, 0.37, 0.42, 0.47].map((v) => m439.cycle(v).y);
  const drops = ys.slice(1).map((y, i) => ys[i] - y);
  assert.ok(drops.every((d, i) => i === 0 || d > drops[i - 1]), "水桶越落越快");
});

test("第 439 種:滑輪的軸架在立柱上,配重落到立柱上的擋停住,提把接在桶口上", () => {
  const def = m439.default;
  const frame = part(def, "frame");
  const pulley = part(def, "pulley");
  const axle = pulley.pieces.find((q) => q.role === "axle");
  const post = frame.pieces.find((q) => q.role === "post");
  const stop = frame.pieces.find((q) => q.role === "stop");
  assert.ok(post && axle && stop, "立柱、滑輪的軸與配重的擋");
  const ground = pieceBox(frame.pieces.find((q) => q.role === "ground"));
  const postBox = pieceBox(post);
  assert.ok(postBox.lo[1] <= ground.hi[1] + 1e-9 && postBox.hi[1] >= pulley.center[1], "立柱從地面立到滑輪的軸");
  assertShaftInBearings({ at: [pulley.center[0] + axle.at[0], pulley.center[1] + axle.at[1], pulley.center[2] + axle.at[2]], radius: axle.radius, length: axle.length }, frame.pieces, "滑輪的軸");
  // 立柱、軸承、擋與托它的橫臂連成一件,都接在地上
  assertOnePiece({ pieces: frame.pieces.filter((q) => ["ground", "pad", "post", "bearing", "bracket", "stop"].includes(q.role)) }, "立柱、軸承、擋連成一件");
  // 水桶在頂端時配重落在擋上;繩從擋旁邊過
  const top = def.pose(0).parts;
  const weight = part(def, "weight");
  close(top.weight.position[1] - weight.size[1] / 2, pieceBox(stop).hi[1], "配重落到擋上停住", 0.005);
  const stopBox = pieceBox(stop);
  assert.ok(stopBox.hi[0] < top.weight.position[0] - 0.03 || stopBox.lo[0] > top.weight.position[0] + 0.03, "繩從擋的旁邊過");
  assert.ok(stopBox.hi[0] > top.weight.position[0] - weight.size[0] / 2 && stopBox.lo[0] < top.weight.position[0] + weight.size[0] / 2, "擋在配重底下");
  const bucket = part(def, "bucket");
  const bail = bucket.pieces.find((q) => q.role === "bail");
  const rim = Math.max(...bucket.profile.map((p) => p[1]));
  close(bail.at[2] - bail.size[2] / 2, rim, "提把接在桶口上(桶的局部 z 是直立方向)", 0.005);
  const rope = def.pose(0.1).paths.rope.points;
  close(rope.at(-1)[1], def.pose(0.1).parts.bucket.position[1] + bail.at[2], "繩拴在提把上", 1e-9);
});

test("第 440 種:分成兩半的水槽:一邊裝滿就翻過去倒出,另一邊轉到水流下方;可當水錶計數", () => {
  const a = m440.trough(0.2);
  assert.ok(a.tilt > 0 && a.right > 0 && a.left === 0, "左邊低時水落進抬高的右邊");
  const b = m440.trough(0.7);
  assert.ok(b.tilt < 0 && b.left > 0 && b.right === 0, "翻過去後水落進左邊");
  assert.equal(m440.trough(0.99).count, 2, "一個來回倒兩次");
  assert.equal(m440.trough(3.2).count, 6, "計數累加");
});

test("第 440 種:水槽翻到底靠在擋柱上(間隙 0、再翻一點就穿入);裝滿的一端要降到軸以下才往外倒,存量隨傾角加大加速倒空", () => {
  const deg = Math.PI / 180;
  const bottom = (tilt) => placeOutline(m440.BOTTOM, m440.PIVOT, tilt);
  for (const k of [1, -1]) {
    const stop = m440.stopOutline(k);
    assert.ok(!polygonsOverlap(bottom(-k * m440.TILT), stop), `翻到底時槽底不穿進 ${k > 0 ? "右" : "左"}邊的擋柱`);
    assert.ok(polygonsOverlap(bottom(-k * (m440.TILT + 0.2 * deg)), stop), "再翻 0.2° 就穿進擋柱:槽底靠在擋柱上");
    assert.ok(!polygonsOverlap(bottom(k * m440.TILT), stop), "另一邊抬高時離擋柱很遠");
  }
  // 右邊裝滿後翻過去(進程 0.4–0.5):右端還高於軸時水留在隔板邊,不倒;右端低於軸後才從開口的那一端流出
  let prev = 1;
  let poured = 0;
  for (const v of sweep(0.5, 100, 0.4)) {
    const t = m440.trough(v);
    const out = m440.default.pose(v).flows.length - 1; // 第一條是斜槽的水
    if (t.tilt > 1e-9) {
      assert.equal(t.right, 1, `進程 ${v.toFixed(3)}:右端還抬著(傾角 ${((t.tilt * 180) / Math.PI).toFixed(1)}°),水還沒倒`);
      assert.equal(out, 0, "沒有從右端流出的水");
      assert.equal(t.count, 0, "還沒倒,不計數");
    } else if (t.tilt < -1e-9) {
      assert.ok(t.right <= prev, "右端降下去後存量只減不增");
      assert.equal(out, t.right > 0 ? 1 : 0, "有水才有從右端流出的水");
      assert.equal(t.count, 1, "翻過去就計一次");
      poured++;
    }
    prev = t.right;
  }
  assert.ok(poured > 10, "翻過去之後有一段倒水的過程");
  assert.equal(m440.trough(0.5).right, 0, "翻到底時倒空");
  // 加速倒空:傾角到一半時倒出的不到一半
  const half = sweep(0.5, 1000, 0.4).find((v) => m440.trough(v).tilt < -m440.TILT / 2);
  assert.ok(m440.trough(half).right > 0.5, "傾角過半時倒出的還不到一半");
  // 左邊同樣
  const left = m440.trough(0.93);
  assert.ok(left.tilt < 0 && left.left === 1, "左端還低於軸時不倒");
  assert.equal(m440.default.pose(0.93).flows.length, 1);
});

test("第 440 種:軸由下方框架的直立支柱頂著(軸穿過支柱頂的軸孔,支柱站在底座上、斜撐接到支柱)", () => {
  const frame = m440.default.parts.find((p) => p.id === "frame");
  const [px, py, pz] = m440.PIVOT;
  const xs = m440.POST.map((p) => p[0]);
  const ys = m440.POST.map((p) => p[1]);
  assert.ok(Math.min(...xs) < px - 0.05 && px + 0.05 < Math.max(...xs) && Math.min(...ys) < py - 0.05 && py + 0.05 < Math.max(...ys), "軸心在支柱的輪廓裡");
  assert.ok(Math.min(...ys) <= m440.BASE_TOP, "支柱站在底座上");
  const axle = frame.pieces.find((p) => p.kind === "cylinder" && Math.abs(p.at[0] - px) < 1e-9 && Math.abs(p.at[1] - py) < 1e-9);
  const posts = frame.pieces.filter((p) => p.kind === "plate" && p.shape.outline === m440.POST);
  assert.equal(posts.length, 2, "前後各一根支柱");
  for (const post of posts) assert.ok(Math.abs(post.at[2]) + post.thickness / 2 <= axle.length / 2 + 1e-9 && Math.abs(post.at[2]) - post.thickness / 2 < axle.length / 2, "軸伸到支柱");
  const trough = m440.default.parts.find((p) => p.id === "trough");
  const bracket = trough.pieces.find((p) => p.kind === "plate");
  for (const post of posts) assert.ok(Math.abs(post.at[2]) - post.thickness / 2 >= bracket.at[2] + bracket.thickness / 2, "支柱在水槽的支架外面");
});

test("第 444 種:水錘泵:右閥開時水流越流越快;右閥一關,水的動量打開左閥把水擠進空氣室;兩閥交替", () => {
  for (const v of sweep(1, 100)) {
    const r = m444.ram(v);
    assert.ok(!(r.waste > 0.5 && r.delivery > 0.5), "兩個閥門不同時打開");
  }
  assert.ok(m444.ram(0.5).speed > m444.ram(0.1).speed, "右閥開著時水越流越快");
  assert.equal(m444.ram(0.7).waste, 0, "右閥關上");
  assert.equal(m444.ram(0.7).delivery, 1, "左閥打開");
  assert.ok(m444.ram(0.8).level > m444.ram(0.62).level, "水被擠進空氣室");
  // 噴嘴的水柱一直都有(空氣的彈性使它均勻)
  for (const v of sweep(1, 10)) assert.ok(m444.default.pose(v).flows[0].points.length > 0, "噴嘴一直出水");
});

test("第 445–446 種:振盪水柱:水往下流時圓板上堆成圓錐;圓錐擋住水流時細管的水柱上升,圓錐崩解後再往下流", () => {
  const falling = col.column(0.3);
  assert.ok(falling.falling && falling.cone > 0 && falling.rise === 0, "第 445 種:往下流,圓錐漸漸堆起");
  const blocked = col.column(0.72);
  assert.ok(!blocked.falling && blocked.cone === 1 && blocked.rise > 0.5, "第 446 種:圓錐擋住,水柱上升");
  assert.ok(blocked.overflow, "水柱升到頂溢出(抬到水頭之上)");
  assert.ok(col.column(0.95).cone < 0.1 && col.column(0.95).falling, "圓錐崩解,又往下流");
  close(col.column(1.3).cone, falling.cone, "週期性重複");
  assert.equal(fig445.driver.initial, 0.3, "第 445 種預設停在往下流的階段");
  assert.ok(col.column(fig446.driver.initial).cone === 1, "第 446 種預設停在圓錐擋住的階段");
});

test("第 447 種:渡船:錨繫住船,水流作用在舵上,帶著船以錨為圓心沿圓弧橫渡", () => {
  const ys = [];
  for (const v of sweep(1, 40)) {
    const f = m447.ferry(v);
    const B = m447.boatAt(f.psi);
    close(Math.hypot(B[0] - m447.ANCHOR[0], B[1] - m447.ANCHOR[1]), m447.ROPE, "船在以錨為圓心的圓弧上");
    assert.ok(B[0] > m447.ANCHOR[0], "船在錨的下游");
    ys.push(B[1]);
  }
  assert.ok(Math.max(...ys) > 1.5 && Math.min(...ys) < -1.5, "船從一岸渡到另一岸再回來");
});

const OPENED = (p) => Math.abs(p.angle) > 0.3;
const SETTLED = 0.2; // 瓣閥在一程的前 20% 開合(被水頂開、加速落回),之後才是穩定的開或關

test("瓣閥(第 450–454、465、466、473 種共用):被水頂開由快到慢;換向時要關的閥加速落回閥座、撞停,不瞬間闔上", () => {
  const fs = sweep(0.3, 30);
  const falling = fs.map((f) => valveOpening(false, { f, n: 1 }));
  const rising = fs.map((f) => valveOpening(true, { f, n: 1 }));
  close(falling[0], 1, "換向的那一刻還開著");
  close(rising[0], 0, "換向的那一刻還關著");
  for (let i = 1; i < fs.length; i++) {
    assert.ok(falling[i] <= falling[i - 1] + 1e-12, "要關的閥一路落下");
    assert.ok(rising[i] >= rising[i - 1] - 1e-12, "要開的閥一路張開");
    if (fs[i] <= SETTLED) assert.ok(falling[i - 1] - falling[i] >= (i > 1 ? falling[i - 2] - falling[i - 1] : 0) - 1e-12, "落下越來越快(加速)");
    if (fs[i] >= SETTLED) {
      close(falling[i], 0, "落到閥座就停住");
      close(rising[i], 1, "頂到開足");
    }
  }
  close(valveOpening(false, { f: 0.05, n: 0 }), 0, "第一程之前沒有上一程,要關的閥一開始就關著");
});

test("第 448 種:提升泵:上行時下閥開、活塞閥關,水從出水口溢出;下行時下閥關、活塞閥開", () => {
  const def = m448.default;
  for (const v of sweep(4 * Math.abs(m448.SWING[0] - m448.SWING[1]), 40)) {
    const p = m448.pump(v);
    const parts = def.pose(v).parts;
    if (p.phase.f < 0.25) continue; // 換向後的一小段:一個閥正被頂開、另一個正落回閥座
    assert.equal(OPENED(parts.footValve), p.up, "下方閥門在上行時打開");
    assert.equal(OPENED(parts.pistonValve), !p.up, "活塞閥門在下行時打開");
    if (p.up) assert.ok(def.pose(v).flows[0].points.some((q) => q[0] < -0.9), "上行時水從出水口溢出");
  }
  // 手柄往下壓,活塞上升
  assert.ok(m448.pump(0.01).piston < m448.pump(0.3).piston, "壓手柄提起活塞");
  // 換向時閥瓣不會瞬間翻開或闔上:落回閥座是加速的
  const span = Math.abs(m448.SWING[0] - m448.SWING[1]);
  const shut = [0.02, 0.06, 0.1, 0.14, 0.18].map((f) => def.pose(span * (1 + f)).parts.footValve.angle);
  const falls = shut.slice(1).map((a, i) => shut[i] - a);
  assert.ok(falls.every((d, i) => d > 0 && (i === 0 || d > falls[i - 1])), "下閥靠自重加速落回閥座");
});

test("第 449 種:現代提升泵:出水口的瓣閥向上開,上行時被水頂開", () => {
  const def = m449.default;
  for (const v of sweep(4, 40)) {
    if (v % 1 < 0.25) continue; // 換向後的一小段:閥瓣正在開、闔
    const parts = def.pose(v).parts;
    const up = OPENED(parts.footValve);
    assert.equal(OPENED(parts.outValve), up, "出水瓣閥與下閥同時(上行時)打開");
    assert.equal(OPENED(parts.pistonValve), !up, "活塞閥門在下行時打開");
  }
});

// 板件(世界座標)在姿勢下的外形:零件 position 平移、不轉(活塞上的架、閥瓣以外的板)
const placedPlate = (piece, position) => piece.shape.outline.map(([x, y]) => [x + (piece.at?.[0] ?? 0) + position[0], y + (piece.at?.[1] ?? 0) + position[1]]);
// 方塊 / 短圓柱(軸沿 y)在剖面上的矩形:shapes 的 rect(w, h, cx, cy),點的順序左下、右下、右上、左上

test("第 444 種:廢水閥由重物保持打開:重球坐在閥桿頂上、閥桿在管頂的導架裡滑;兩個閥都有閥座,關上時貼著閥座、打開時離開", () => {
  const def = m444.default;
  assert.ok(!part(def, "lever"), "原圖沒有槓桿:重球直接裝在閥桿頂上");
  const waste = part(def, "waste");
  const stem = waste.pieces.find((p) => p.kind === "cylinder");
  const ball = waste.pieces.find((p) => p.kind === "sphere");
  const plate = waste.pieces.find((p) => p.kind === "box");
  const stemTop = stem.at[1] + stem.length / 2;
  assert.ok(ball.at[1] - ball.radius <= stemTop + 1e-9 && ball.at[1] > stemTop, "重球坐在閥桿的頂端");
  const delivery = part(def, "delivery");
  const disc = delivery.pieces.find((p) => p.kind === "cylinder" && p.radius > 0.1);
  const solids = sectionSolids(def, ["works"], 0);
  const [g0, g1] = m444.GUIDE;
  let wasteOpen = false;
  let wasteShut = false;
  for (const v of sweep(1, 80)) {
    const r = m444.ram(v);
    const pose = def.pose(v);
    const W = pose.parts.waste.position;
    // 閥桿全程穿在導架的孔裡:孔的高度在桿的範圍內,桿的兩側都是導架,桿不穿進導架
    const yg = (g0 + g1) / 2;
    assert.ok(W[1] + stem.at[1] - stem.length / 2 < g0 && W[1] + stemTop > g1, `主動量 ${v.toFixed(3)}:閥桿穿過導架`);
    assert.ok(inAny([W[0] + stem.radius + 0.03, yg], solids) && inAny([W[0] - stem.radius - 0.03, yg], solids), `主動量 ${v.toFixed(3)}:桿的兩側都是導架`);
    assert.ok(!inAny([W[0] + stem.radius - 0.002, yg], solids) && !inAny([W[0] - stem.radius + 0.002, yg], solids), `主動量 ${v.toFixed(3)}:桿不穿進導架`);
    // 廢水閥瓣:關上時頂面貼著管頂開口的邊(閥座),打開時落下離開;全程不穿進管壁
    const wp = rect(plate.size[0], plate.size[1], W[0], W[1] + (plate.at?.[1] ?? 0));
    const wTop = wp[2][1];
    const seatX = W[0] + plate.size[0] / 2 - 0.01;
    assert.ok(!overlapsAny(wp, solids), `主動量 ${v.toFixed(3)}:廢水閥瓣穿進管壁`);
    if (r.waste === 0) {
      assert.ok(inAny([seatX, wTop + 0.002], solids) && !inAny([seatX, wTop - 0.002], solids), `主動量 ${v.toFixed(3)}:關上的廢水閥貼著閥座`);
      wasteShut = true;
    }
    if (r.waste === 1) {
      assert.ok(!inAny([seatX, wTop + 0.1], solids), `主動量 ${v.toFixed(3)}:打開的廢水閥離開閥座`);
      wasteOpen = true;
    }
    // 送水閥瓣:關上時底面貼著頸底的閥座,被水推開時往上抬;全程不穿進頸壁
    const D = pose.parts.delivery.position;
    const dp = rect(2 * disc.radius, disc.length, D[0], D[1] + (disc.at?.[1] ?? 0));
    const dBottom = dp[0][1];
    const dSeatX = D[0] + disc.radius - 0.01;
    assert.ok(!overlapsAny(dp, solids), `主動量 ${v.toFixed(3)}:送水閥瓣穿進頸壁`);
    if (r.delivery === 0) assert.ok(inAny([dSeatX, dBottom - 0.002], solids) && !inAny([dSeatX, dBottom + 0.002], solids), `主動量 ${v.toFixed(3)}:關上的送水閥貼著閥座`);
    if (r.delivery === 1) assert.ok(!inAny([dSeatX, dBottom - 0.1], solids), `主動量 ${v.toFixed(3)}:打開的送水閥離開閥座`);
  }
  assert.ok(wasteOpen && wasteShut, "廢水閥開過也關過");
});

test("第 444 種:空氣室的頸坐在驅動管頂上、噴水管封進空氣室頂並伸到水面下;水的路通:流體示意的點全程不在管壁、殼、箱壁裡", () => {
  const def = m444.default;
  const solids = sectionSolids(def, ["works"], 0);
  const { x: dx } = m444.DELIVERY;
  const neck = m444.NECK_BOTTOM;
  assert.ok(inAny([dx + 0.25, neck + 0.01], solids) && inAny([dx + 0.25, neck - 0.01], solids), "頸壁的底面和管頂壁相接,中間沒有縫");
  assert.ok(!inAny([dx, neck - 0.01], solids) && !inAny([dx, neck + 0.01], solids), "頸底下的管頂開著口");
  const nozzle = part(def, "works").pieces.find((p) => p.kind === "cylinder" && p.axis?.[1] === 1);
  const [nx, ny] = nozzle.at;
  const shellTop = m444.CHAMBER.center[1] + m444.CHAMBER.radius + 0.03;
  assert.ok(inAny([nx + nozzle.radius + 0.004, shellTop], solids) && inAny([nx - nozzle.radius - 0.004, shellTop], solids), "噴水管的兩旁就是殼頂(封死,空氣漏不掉)");
  const chamberWater = part(def, "chamberWater");
  const surface = chamberWater.center[1] - chamberWater.size[1] / 2 + chamberWater.size[1] * Math.min(...sweep(1, 20).map((v) => m444.ram(v).level));
  assert.ok(ny - nozzle.length / 2 < surface - 0.1, "噴水管下端伸到空氣室的水面下");
  const front = sectionSolids(def, ["works"], 0.2);
  for (const v of sweep(1, 40)) {
    for (const flow of def.pose(v).flows) {
      for (const q of flow.points) assert.ok(!inAny([q[0], q[1]], front), `主動量 ${v.toFixed(3)} 的點 (${q[0].toFixed(2)}, ${q[1].toFixed(2)}) 在壁裡`);
    }
  }
});

test("第 447 種:過河途中船頭一直斜向要去的那一岸、舵尾也扳向那一岸;靠岸時船舷與舵都不擦進岸,兩岸都靠得到", () => {
  const def = m447.default;
  const banks = sectionSolids(def, ["river"], -0.1).filter((s) => s.outline.length === 4 && Math.abs(s.outline[1][0] - s.outline[0][0]) > 5);
  assert.equal(banks.length, 2, "兩岸");
  const hullShape = part(def, "boat").shape.outline;
  const near = { 1: false, "-1": false };
  for (const v of sweep(1, 240)) {
    const f = m447.ferry(v);
    const pose = def.pose(v);
    const { position: B, angle } = pose.parts.boat;
    const bow = [-Math.cos(angle), -Math.sin(angle)]; // 船頭是局部 −x
    if (!f.moored) {
      assert.ok(bow[0] < 0, `主動量 ${v.toFixed(3)}:船頭朝上游`);
      assert.ok(bow[1] * f.dir > 0.25, `主動量 ${v.toFixed(3)}:船頭斜向要去的那一岸(dir ${f.dir})`);
      assert.ok(Math.sin(pose.parts.rudder.angle - angle) * f.dir > 0.3, `主動量 ${v.toFixed(3)}:舵尾扳向要去的那一岸`);
    }
    const hull = placeOutline(hullShape, B, angle);
    const rudder = placedFlap(def, "rudder", pose);
    for (const bank of banks) {
      assert.ok(!polygonsOverlap(hull, bank.outline), `主動量 ${v.toFixed(3)}:船舷擦進岸`);
      assert.ok(!polygonsOverlap(rudder, bank.outline), `主動量 ${v.toFixed(3)}:舵掃過岸`);
    }
    if (f.moored) {
      const side = f.psi > 0 ? 1 : -1;
      const bank = banks.find((b) => Math.sign(b.outline[0][1]) === side);
      if (polyGap(hull, bank.outline) < 0.3) near[side] = true;
    }
  }
  assert.ok(near[1] && near["-1"], "兩岸都靠得到(船離岸不到 0.3)");
});

test("第 448、449 種:活塞桿接在弓形架頂、架的兩腳站在活塞上,桿不伸進活塞的孔;活塞閥在架底下翻開,全程碰不到架", () => {
  for (const [def, span] of [[m448.default, SPAN(m448.SWING)], [m449.default, SPAN(m449.STROKE)]]) {
    const piston = part(def, "piston");
    assert.equal(piston.kind, "group", `第 ${def.figure} 種:活塞是環、架、桿的組合`);
    const ring = piston.pieces.find((p) => p.kind === "lathe");
    const bow = piston.pieces.find((p) => p.kind === "plate");
    const rod = piston.pieces.find((p) => p.kind === "cylinder" && p.axis?.[1] === 1);
    assert.ok(ring && bow && rod, `第 ${def.figure} 種:有環、弓形架與桿`);
    const ringTop = (ring.at?.[1] ?? 0) + Math.max(...ring.profile.map(([, h]) => h));
    const ys = bow.shape.outline.map(([, y]) => y + (bow.at?.[1] ?? 0));
    const bowTop = Math.max(...ys);
    const bowBottom = Math.min(...ys);
    const rodBottom = rod.at[1] - rod.length / 2;
    assert.ok(bowBottom <= ringTop + 1e-9 && bowBottom > ringTop - 0.05, `第 ${def.figure} 種:架腳站在活塞環的頂面上`);
    assert.ok(rodBottom <= bowTop + 1e-9 && rodBottom > bowTop - 0.05, `第 ${def.figure} 種:桿接在架頂`);
    assert.ok(rodBottom > ringTop + 0.3, `第 ${def.figure} 種:桿停在架頂,不伸進活塞的孔`);
    let opened = false;
    for (const v of sweep(4 * span, 96)) {
      const pose = def.pose(v);
      const P = pose.parts.piston.position;
      const flap = placedFlap(def, "pistonValve", pose);
      assert.ok(!polygonsOverlap(flap, placedPlate(bow, P)), `第 ${def.figure} 種:主動量 ${v.toFixed(3)} 活塞閥碰到弓形架`);
      assert.ok(Math.max(...flap.map(([, y]) => y)) < P[1] + rodBottom, `第 ${def.figure} 種:主動量 ${v.toFixed(3)} 活塞閥碰到桿`);
      if (Math.abs(pose.parts.pistonValve.angle) > 0.7) opened = true;
    }
    assert.ok(opened, `第 ${def.figure} 種:活塞閥真的張開過`);
  }
});

test("第 448、449 種:管子接進開著口的泵筒,流體示意的點全程不穿過任何壁(水的路通);閥瓣坐在閥座上、張開時不穿過壁", () => {
  for (const [def, ids, span, valves] of [
    [m448.default, ["barrel", "suction", "works"], SPAN(m448.SWING), ["footValve"]],
    [m449.default, ["barrel", "suction"], SPAN(m449.STROKE), ["footValve", "outValve"]],
  ]) {
    const solids = sectionSolids(def, ids);
    for (const v of sweep(4 * span, 48)) {
      const pose = def.pose(v);
      for (const flow of pose.flows) {
        for (const q of flow.points) assert.ok(!inAny([q[0], q[1]], solids), `第 ${def.figure} 種:主動量 ${v.toFixed(3)} 的點 (${q[0].toFixed(2)}, ${q[1].toFixed(2)}) 在壁裡`);
      }
      for (const id of valves) {
        const flap = placedFlap(def, id, pose);
        assert.ok(!digsInto(flap, solids), `第 ${def.figure} 種:主動量 ${v.toFixed(3)} ${id} 穿過壁`);
        if (Math.abs(pose.parts[id].angle) < 1e-9) {
          const [hx, hy] = pose.parts[id].position;
          const bottom = Math.min(...flap.map(([, y]) => y));
          const under = (x) => inAny([x, bottom - 0.004], solids);
          const over = (x) => inAny([x, hy + 0.001], solids);
          assert.ok((under(hx + 0.02) || under(hx - 0.02)) && !over(hx + 0.02) && !over(hx - 0.02), `第 ${def.figure} 種:主動量 ${v.toFixed(3)} 關上的 ${id} 貼著閥座`);
        }
      }
    }
  }
});

test("第 449 種:出水管頂端照原圖是斷管(管子往上接):上行時水在閥室與管裡往上走到斷口,不從口緣溢出落下", () => {
  const def = m449.default;
  const { x: ox, inner } = m449.OUT;
  let climbed = false;
  for (const v of sweep(4, 40)) {
    const pose = def.pose(v);
    for (const flow of pose.flows) {
      const high = flow.points.filter((q) => q[1] > m449.BARREL.y1 + 0.2);
      for (const q of high) assert.ok(Math.abs(q[0] - ox) <= inner + 1e-9, `主動量 ${v.toFixed(3)}:點 (${q[0].toFixed(2)}, ${q[1].toFixed(2)}) 在出水管外`);
      if (high.some((q) => q[1] > m449.OUT.top - 0.3)) climbed = true;
    }
  }
  assert.ok(climbed, "水走到了斷口");
});

test("第 450 種:壓力泵:上升時吸水閥開、出水閥關;下降時吸水閥關,水經出水閥往上送", () => {
  for (const v of sweep(4 * 0.8, 40)) {
    const p = force.pump(v);
    if (p.phase.f < SETTLED) continue; // 換向後的開合過程
    const parts = fig450.pose(v).parts;
    assert.equal(OPENED(parts.suctionValve), p.up, "吸水閥在上升時打開");
    assert.equal(OPENED(parts.deliveryValve), !p.up, "出水閥在下降時打開");
  }
});

test("第 451 種:加空氣室的壓力泵:下行時空氣被壓縮(水位升),上行時膨脹把水推出,出水不斷", () => {
  let prev = null;
  for (const v of sweep(4 * 0.8, 80)) {
    const p = force.pump(v);
    const pose = fig451.pose(v);
    const level = pose.parts.chamberWater.level;
    if (prev) {
      if (p.up && prev.up) assert.ok(level <= prev.level + 1e-9, "上行時空氣室的水位下降(空氣膨脹)");
      if (!p.up && !prev.up) assert.ok(level >= prev.level - 1e-9, "下行時水位上升(空氣被壓縮)");
    }
    const out = pose.flows.flatMap((f) => f.points).filter((q) => q[1] > 2.0);
    assert.ok(out.length > 0, "兩個行程都有水從出口流出(持續穩定)");
    prev = { up: p.up, level };
  }
});

test("第 452 種:雙動式泵:往下時閥 1 進水、閥 3 排水;往上時閥 2 進水、閥 4 排水", () => {
  const def = m452.default;
  for (const v of sweep(4 * 1.1, 40)) {
    const p = m452.pump(v);
    if (p.phase.f < SETTLED) continue; // 換向後的開合過程
    const parts = def.pose(v).parts;
    const open = (k) => Math.abs(parts[`valve${k}`].angle + Math.PI / 2) > 0.3;
    assert.equal(open(1), p.down, "閥 1:往下時開");
    assert.equal(open(3), p.down, "閥 3:往下時開");
    assert.equal(open(2), !p.down, "閥 2:往上時開");
    assert.equal(open(4), !p.down, "閥 4:往上時開");
  }
  assert.ok(m452.pump(0.3).y < m452.pump(0).y && m452.pump(0.3).down, "一開始往下(原圖箭頭)");
});

test("第 453 種:雙風箱泵:一個風箱撐開吸水時,另一個被壓縮排水;閥門與壓力泵一樣", () => {
  const def = m453.default;
  const span = m453.SWING[1] - m453.SWING[0];
  for (const v of sweep(4 * span, 40).slice(1)) {
    if (v % span < 0.002 || stroke(v, ...m453.SWING).f < SETTLED) continue; // 行程端點、換向後的開合過程
    const a = def.pose(v - 0.001).parts;
    const b = def.pose(v).parts;
    const grow = [0, 1].map((k) => b[`top${k}`].position[1] - a[`top${k}`].position[1]);
    if (Math.abs(grow[0]) < 1e-6) continue;
    assert.ok(Math.sign(grow[0]) !== Math.sign(grow[1]), "兩個風箱一撐一壓");
    for (const k of [0, 1]) {
      const expanding = grow[k] > 0;
      assert.equal(Math.abs(b[`suction${k}`].angle - (k ? Math.PI : 0)) > 0.3, expanding, "撐開的風箱吸水閥打開"); // 右邊的吸水閥鉸在右側、閉著時指向 -x(π)
      assert.equal(Math.abs(b[`delivery${k}`].angle + Math.PI / 2) > 0.3, !expanding, "壓縮的風箱出水閥打開"); // 出水閥鉸在排水管腳下、垂著是 -90°
    }
  }
});

test("第 454 種:隔膜泵:隔膜拉起時吸水閥開,壓下時水經出水閥送出", () => {
  const def = m454.default;
  const span = m454.SWING[0] - m454.SWING[1];
  for (const v of sweep(4 * span, 40).slice(1)) {
    if (v % span < 0.002 || stroke(v, ...m454.SWING).f < SETTLED) continue; // 行程端點、換向後的開合過程
    const d0 = def.pose(v - 0.001).paths.membrane.points[10][1];
    const d1 = def.pose(v).paths.membrane.points[10][1];
    if (Math.abs(d1 - d0) < 1e-6) continue;
    const parts = def.pose(v).parts;
    assert.equal(Math.abs(parts.suctionValve.angle) > 0.3, d1 > d0, "隔膜拉起時吸水閥開");
    assert.equal(Math.abs(parts.deliveryValve.angle) > 0.3, d1 < d0, "隔膜壓下時出水閥開");
  }
});

// ── 第 450–454 種:剖面上的壁、開口與閥室 ─────────────────────
// 固定件在剖面上的實體:深度蓋到 z 的板件(含孔)與方塊(管子剖開後留在後面的背板不算)、旋轉體的壁
// (剖開的後半只算 sweep 蓋到的那一側);回傳世界座標的 { outline, holes } 清單。旋轉體的壁在左右各是一塊(以軸線鏡射的剖面多邊形)
function sectionSolids(def, ids, z = 0.1) {
  const out = [];
  const visit = (piece, [ox, oy, oz]) => {
    const [ax, ay, az = 0] = piece.at ?? piece.center ?? [0, 0, 0];
    const [x, y, zc] = [ox + ax, oy + ay, oz + az];
    const covers = (t) => zc - t / 2 <= z + 1e-9 && zc + t / 2 >= z - 1e-9;
    if (piece.kind === "plate" && covers(piece.thickness ?? 0.2)) {
      const move = (loop) => loop.map(([px, py]) => [px + x, py + y]);
      out.push({ outline: move(piece.shape.outline), holes: (piece.shape.holes ?? []).map(move) });
    } else if (piece.kind === "box" && covers(piece.size[2])) {
      const [w, h] = piece.size;
      out.push({ outline: [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], holes: [] });
    } else if (piece.kind === "lathe") {
      const cut = piece.cut ?? 0;
      const sweep = piece.sweep ?? Math.PI * 2;
      const covers = (a) => [a, a + Math.PI * 2, a - Math.PI * 2].some((b) => b >= cut - 1e-9 && b <= cut + sweep + 1e-9);
      for (const side of [1, -1]) {
        if (!covers(side > 0 ? 0 : Math.PI)) continue;
        out.push({ outline: piece.profile.map(([r, h]) => [x + side * r, y + h]), holes: [] });
      }
    }
    for (const c of piece.pieces ?? []) visit(c, [x, y, zc]);
  };
  for (const id of ids) {
    const p = part(def, id);
    assert.ok(p, `零件 ${id}`);
    if (p.kind === "group") for (const c of p.pieces ?? []) visit(c, [0, 0, 0]);
    else visit({ ...p, at: p.center ?? [0, 0, 0] }, [0, 0, 0]);
  }
  return out;
}
const inAny = (q, solids) => solids.some((s) => inSolid(q, s));
// 零件 id 在姿勢下的外形(板件,繞 position 轉 angle)
const placedFlap = (def, id, pose) => {
  const p = part(def, id);
  const { position, angle } = pose.parts[id];
  return placeOutline(p.shape.outline, position, angle ?? 0);
};
const overlapsAny = (poly, solids) => solids.some((s) => polygonsOverlap(poly, s.outline));
// 穿入超過貼合誤差(實體驗證的容許值 0.03:閥瓣繞鉸銷轉時,鉸端的角擦到閥座在這以內)
const digsInto = (poly, solids) => solids.some((s) => penetrationDepth(poly, s) > 0.03);
const SPAN = (sw) => Math.abs(sw[0] - sw[1]);

test("第 450 種:往下壓把手,活塞往下把水送出;吊環兩端銷接、長度不變,活塞桿的銷一直在泵筒軸線上", () => {
  const p0 = force.pump(0.01);
  const p1 = force.pump(0.3);
  assert.ok(p1.theta < p0.theta && p1.piston < p0.piston, "把手往下壓,活塞往下");
  assert.equal(p1.up, false, "往下壓是送水的那一程");
  for (const v of sweep(4 * SPAN(force.SWING), 60)) {
    const p = force.pump(v);
    close(Math.hypot(p.hang[0] - force.HANGER.ear[0], p.hang[1] - force.HANGER.ear[1]), force.HANGER.length, "吊環長不變", 1e-6);
    close(p.top[0], force.X, "活塞桿的銷在泵筒軸線上", 1e-9);
    assert.ok(p.hang[0] < force.X, "吊環(支點)在活塞桿左邊");
    const pose = fig450.pose(v);
    close(pose.parts.handle.position[0], p.hang[0], "手柄的左端掛在吊環上", 1e-9);
    assert.ok(pose.parts.hanger, "吊環是零件");
  }
});

test("第 451 種:支點在泵筒左上的彎柱頂、活塞桿接在支點右邊:往下壓把手,活塞往下;連桿長不變", () => {
  assert.ok(force.LEVER.pivot[0] < force.X, "支點在活塞桿左邊");
  const p0 = force.pump(0.01, { hanger: false });
  const p1 = force.pump(0.3, { hanger: false });
  assert.ok(p1.theta < p0.theta && p1.piston < p0.piston && !p1.up, "把手往下壓,活塞往下送水");
  for (const v of sweep(4 * SPAN(force.SWING), 60)) {
    const p = force.pump(v, { hanger: false });
    close(Math.hypot(p.E[0] - p.top[0], p.E[1] - p.top[1]), force.LEVER.link, "連桿長不變", 1e-6);
    close(p.top[0], force.X, "活塞桿頂在泵筒軸線上", 1e-9);
    assert.ok(p.E[0] > force.LEVER.pivot[0], "活塞桿的銷在支點右邊");
  }
});

test("第 450、451、454 種:出水閥鉸在閥室裡,閥瓣開到底也不穿過閥室或出水管的壁", () => {
  for (const [def, span] of [[fig450, SPAN(force.SWING)], [fig451, SPAN(force.SWING)], [m454.default, SPAN(m454.SWING)]]) {
    const solids = sectionSolids(def, ["works"]);
    let opened = false;
    for (const v of sweep(4 * span, 96)) {
      const pose = def.pose(v);
      const flap = placedFlap(def, "deliveryValve", pose);
      assert.ok(!overlapsAny(flap, solids), `第 ${def.figure} 種:主動量 ${v.toFixed(3)} 出水閥的閥瓣穿過壁`);
      if (Math.abs(pose.parts.deliveryValve.angle) > 0.7) opened = true;
    }
    assert.ok(opened, "出水閥真的張開過");
  }
});

test("第 450–454 種:管子接進開著口的壁,流體示意的點全程不穿過任何壁(水的路通)", () => {
  const cases = [
    [fig450, ["works", "barrel", "suction"], SPAN(force.SWING)],
    [fig451, ["works", "barrel", "suction"], SPAN(force.SWING)],
    [m452.default, ["works", "cylinder"], SPAN(m452.STROKE)],
    [m453.default, ["works", "post"], SPAN(m453.SWING)],
    [m454.default, ["works"], SPAN(m454.SWING)],
  ];
  for (const [def, ids, span] of cases) {
    const solids = sectionSolids(def, ids);
    for (const v of sweep(4 * span, 40)) {
      for (const flow of def.pose(v).flows) {
        for (const q of flow.points) assert.ok(!inAny([q[0], q[1]], solids), `第 ${def.figure} 種:主動量 ${v.toFixed(3)} 的點 (${q[0].toFixed(2)}, ${q[1].toFixed(2)}) 在壁裡`);
      }
    }
  }
});

test("第 451 種:空氣室有底、坐在出水閥的閥座上,出水管從空氣室裡接出", () => {
  const solids = sectionSolids(fig451, ["works"]);
  const floor = fig451.pose(0).parts.deliveryValve.position;
  assert.ok(inAny([floor[0] + 0.35, floor[1] - 0.05], solids), "閥座旁邊是空氣室的底");
  assert.ok(!inAny([force.VALVE_X, floor[1] + 0.3], solids), "閥座上方是空氣室的空間");
  assert.ok(!inAny([force.VALVE_X, floor[1] - 0.2], solids), "閥座下方通進水管");
});

test("第 452 種:四個閥在開口裡張開,閥瓣全程不穿過水道的壁、也碰不到泵筒;A、B 兩道水道的盡頭封住", () => {
  const def = m452.default;
  const solids = sectionSolids(def, ["works", "cylinder"]);
  for (const v of sweep(4 * SPAN(m452.STROKE), 96)) {
    const pose = def.pose(v);
    for (const k of [1, 2, 3, 4]) {
      const flap = placedFlap(def, `valve${k}`, pose);
      assert.ok(!digsInto(flap, solids), `主動量 ${v.toFixed(3)}:閥 ${k} 穿過壁`);
    }
  }
  assert.ok(inAny([m452.A_X, m452.CYL.y1 + 0.07], solids), "A 的頂端封住(和頂蓋齊)");
  assert.ok(inAny([m452.B_X, m452.CYL.y0 + 0.13], solids), "B 的底端封住");
});

test("第 453 種:吸水管經弧形吸水道、吸水閥進底座的外格再進風箱;排水從外格經出水閥進中央的排水管(閥門與壓力泵相同)", () => {
  const def = m453.default;
  const span = SPAN(m453.SWING);
  for (const v of sweep(4 * span, 24).slice(1)) {
    for (const flow of def.pose(v).flows) {
      const pts = flow.points;
      const lowest = Math.min(...pts.map((q) => q[1]));
      const highest = Math.max(...pts.map((q) => q[1]));
      if (lowest < -1.5) {
        // 吸水:從吸水管底經吸水道的弧(離開 x=0 的軸線、在底座下面)、從外格的底進去,到風箱裡
        assert.ok(pts.some((q) => q[1] < -0.7 && Math.abs(q[0]) > 0.6), "吸水道彎到外格底下");
        assert.ok(pts.some((q) => Math.abs(q[0]) > 0.6 && q[1] > -0.62 && q[1] < -0.3), "水進到外格");
        assert.ok(highest > 0, "水進到風箱");
      } else {
        // 排水:從風箱下到外格、經排水管腳旁的出水閥(y −0.62..−0.42、|x| < 0.2)進排水管、到頂上出口
        assert.ok(pts.some((q) => Math.abs(q[0]) < 0.2 && q[1] > -0.62 && q[1] < -0.42), "經出水閥進排水管腳");
        assert.ok(highest > 1.3, "從頂上的出口排出");
      }
    }
  }
  // 閥瓣:吸水閥躺在外格底的開口上(閥座上方沒有壁),出水閥鉸在排水管腳的壁下、往管腳裡開
  const solids = sectionSolids(def, ["works"]);
  const p = def.pose(0.001).parts;
  for (const k of [0, 1]) {
    const s = p[`suction${k}`].position;
    assert.ok(!inAny([s[0] + (k ? -0.13 : 0.13), s[1] - 0.06], solids), "吸水閥底下是開口");
    assert.ok(!inAny([s[0] + (k ? -0.13 : 0.13), s[1] + 0.5], solids), "吸水閥上方通風箱的格");
  }
});

test("第 453 種:風箱的褶每一段長度不變(拉長時折角變開、縮短時折得更深)", () => {
  const def = m453.default;
  const lengths = {};
  for (const v of sweep(2 * SPAN(m453.SWING), 24)) {
    const paths = def.pose(v).paths;
    for (const id of ["fold0L", "fold0R", "fold1L", "fold1R"]) {
      const pts = paths[id].points;
      const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], q[2] - pts[i][2]));
      lengths[id] ??= segs;
      segs.forEach((l, i) => close(l, lengths[id][i], `${id} 第 ${i} 段`, 1e-6));
    }
  }
  const a = def.pose(0).paths.fold0L.points;
  const b = def.pose(SPAN(m453.SWING)).paths.fold0L.points;
  assert.notEqual(Math.abs(a[1][0] - a[0][0]).toFixed(3), Math.abs(b[1][0] - b[0][0]).toFixed(3), "褶的振幅隨高度改變");
});

test("第 453 種:槓桿的支柱從上方垂下(頂端畫成斷口),不立在排水管上", () => {
  const def = m453.default;
  const post = part(def, "post");
  assert.ok(post, "支柱是獨立的固定件");
  const pipe = sectionSolids(def, ["works"]);
  const bottom = Math.min(...post.pieces.filter((p) => p.kind === "plate").flatMap((p) => p.shape.outline.map(([, y]) => y + (p.at?.[1] ?? 0))));
  assert.ok(bottom > 1.6, "支柱的底在排水管的頂上出口之上");
  assert.ok(!inAny([0, bottom - 0.05], pipe), "支柱底下是空的");
});

test("第 454 種:隔膜夾在夾環下、往下垂成碗形;隔膜與壓板全程在夾環的下面,不穿過水室的壁;隔膜每一段長度不變", () => {
  const def = m454.default;
  const solids = sectionSolids(def, ["works"]);
  const lengths = [];
  let lowest = 0;
  let highest = -9;
  for (const v of sweep(4 * SPAN(m454.SWING), 48)) {
    const pose = def.pose(v);
    const pts = pose.paths.membrane.points;
    for (const q of pts) {
      assert.ok(q[1] <= m454.CLAMP_Y + 1e-9, `主動量 ${v.toFixed(3)}:隔膜高過夾環`);
      assert.ok(!inAny([q[0], q[1]], solids), `主動量 ${v.toFixed(3)}:隔膜穿過壁 (${q[0].toFixed(2)}, ${q[1].toFixed(2)})`);
    }
    const plateTop = pose.parts.rod.position[1] - m454.ROD / 2 + 0.06;
    assert.ok(plateTop < m454.CLAMP_Y - 0.03, "壓板在夾環下面");
    const centre = pts[Math.floor(pts.length / 2)][1];
    lowest = Math.min(lowest, centre);
    highest = Math.max(highest, centre);
    const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
    if (!lengths.length) lengths.push(...segs);
    segs.forEach((l, i) => close(l, lengths[i], `隔膜第 ${i} 段`, 1e-6));
  }
  assert.ok(highest - lowest > 0.35, "隔膜起落的幅度");
  assert.ok(lowest < m454.CLAMP_Y - 0.5, "拉到最低時垂成碗形");
});

test("第 455 種:舊式旋轉泵:閥門貼著泵缸內面轉,到擋板處被闔上", () => {
  const deg = Math.PI / 180;
  // 轉鼓順時針轉(phi 遞減):鉸點進到擋板的長斜面底下,閥門被一路壓下;到擋板的平面段時已闔上
  let prev = 1;
  for (let a = m455.ABUT[1]; a > m455.ABUT[1] - m455.RAMP_IN; a -= deg) {
    const open = m455.opening(a);
    assert.ok(open <= prev + 0.01, "斜面把閥門一路壓下(由接觸算)");
    prev = open;
  }
  // 離開擋板後,閥門加速擺開:不會一下子張開
  const swing = sweep(-90 * deg, 60, -150 * deg).map((a) => m455.valveAngle(a) - a);
  for (let i = 1; i < swing.length; i++) assert.ok(Math.abs(swing[i] - swing[i - 1]) < 8 * deg, "每轉 1° 閥門擺動不到 8°(沒有瞬移)");
  for (const phi of sweep(2 * Math.PI, 72)) {
    const open = m455.opening(phi);
    const a = Math.atan2(Math.sin(phi), Math.cos(phi));
    if (a > m455.ABUT[0] && a < m455.ABUT[1] - m455.RAMP_IN) assert.ok(open < 0.8, "鉸點在擋板的平面段時閥門至少被壓下一部分(閥身還拖在斜面下)");
    // 由接觸算:閥門上沒有一點超出擋板的內面或泵缸的內壁
    const ang = m455.valveAngle(phi);
    for (const t of sweep(m455.VALVE, 8, 0.05)) {
      const q = [m455.DRUM * Math.cos(phi) + t * Math.cos(ang), m455.DRUM * Math.sin(phi) + t * Math.sin(ang)];
      assert.ok(Math.hypot(...q) <= m455.reachAt(Math.atan2(q[1], q[0])) + 0.01, "閥門不穿入擋板或泵缸");
    }
    if (open > 0.995) {
      const ang = m455.valveAngle(phi);
      const tip = [m455.DRUM * Math.cos(phi) + m455.VALVE * Math.cos(ang), m455.DRUM * Math.sin(phi) + m455.VALVE * Math.sin(ang)];
      close(Math.hypot(...tip), m455.BORE, "張開的閥門外緣貼著泵缸內面", 0.05);
    }
  }
  assert.ok(m455.opening(90 * deg) > 0.95, "其他地方閥門張開");
  // 閥門拖在鉸點後面:鉸點在 −70°(已過斜面、在平面段)時閥身還在長斜面底下,只壓下一部分(開度 0.61);
  // 鉸點走到 −110°~−120°、閥身整個在擋板的平面段底下時才被壓到最平——開度 0.23、閥身最遠點貼著擋板的內面
  close(m455.opening(-70 * deg), 0.61, "鉸點在 −70° 時的開度", 0.02);
  const flat = m455.reachAt(m455.ABUT[1] - m455.RAMP_IN - 5 * deg); // 擋板平面段的內面(閥門中心線最多能到的半徑)
  for (const a of [-110, -115, -120]) {
    const phi = a * deg;
    close(m455.opening(phi), 0.23, `鉸點在 ${a}° 時閥身在擋板底下,壓到最平`, 0.02);
    const ang = m455.valveAngle(phi);
    const far = Math.max(...sweep(m455.VALVE, 16, 0.05).map((t) => Math.hypot(m455.DRUM * Math.cos(phi) + t * Math.cos(ang), m455.DRUM * Math.sin(phi) + t * Math.sin(ang))));
    close(far, flat, `鉸點在 ${a}° 時閥身最遠點貼著擋板平面段的內面`, 0.015);
  }
});

test("第 456 種:出水管 H 與吸水管 F 的管壁都在泵缸外,水經泵缸壁上的孔口 L、M 進出;鼓緣、背板與軸連成一件", () => {
  const def = m456.default;
  const casing = part(def, "casing");
  const pipes = casing.pieces.filter((p) => p.role === "pipe");
  assert.ok(pipes.length >= 4, "F 與 H 各兩道管壁");
  for (const p of pipes) for (const [x, y] of p.shape.outline) assert.ok(Math.hypot(x, y - m456.ECC) >= m456.BORE - 1e-6, `管壁不伸進腔室(${x.toFixed(2)}, ${y.toFixed(2)})`);
  // 孔口 L、M 開在泵缸壁上(壁厚中央那一點不在任何一塊板裡);兩孔之間的 E 是實壁
  const layers = plateLayers(casing).filter((l) => l.z0 < 0 && l.z1 > 0);
  const midWall = (a) => {
    const q = polar(m456.reach(a), a);
    const d = Math.hypot(q[0], q[1] - m456.ECC);
    return [q[0] * (1 + 0.075 / d), m456.ECC + (q[1] - m456.ECC) * (1 + 0.075 / d)];
  };
  for (const a of [m456.L_AT, m456.M_AT]) assert.ok(!layers.some((l) => inSolid(midWall(a), l.solid)), `孔口(${((a * 180) / Math.PI).toFixed(0)}°)開在泵缸壁上`);
  assert.ok(layers.some((l) => inSolid(midWall(-Math.PI / 2), l.solid)), "兩孔之間(E)是實壁");
  assertOnePiece(part(def, "drum"), "鼓緣、背板、軸連成一件");
});

test("第 456 種:Cary 旋轉泵:活塞依心形凸輪進出;對準 E 時被推回座裡,另一個同時完全伸出", () => {
  for (const t of sweep(2 * Math.PI, 36)) {
    const parts = m456.default.pose(t).parts;
    for (const k of [0, 1]) {
      const p = parts[`piston${k}`];
      close(Math.hypot(p.position[0], p.position[1]), m456.reach(p.angle), "活塞外端貼著泵缸");
      // 由接觸算:內端圓頭的圓心離凸輪外形恰好一個圓頭半徑(貼著、不穿入)
      const c = [p.position[0] - (m456.PISTON - m456.NOSE) * Math.cos(p.angle), p.position[1] - (m456.PISTON - m456.NOSE) * Math.sin(p.angle)];
      const gap = Math.min(...m456.CAM.map(([x, y]) => Math.hypot(x - c[0], y - c[1])));
      close(gap, m456.NOSE, "活塞內端的圓頭貼著心形凸輪 a", 0.02);
    }
  }
  close(m456.reach(-Math.PI / 2), m456.DRUM, "在 E(底部)活塞完全縮回鼓裡");
  close(m456.reach(Math.PI / 2), m456.DRUM + 2 * m456.ECC, "同時對面的活塞完全伸出");
});

test("第 462 種:鏈式泵:上輪轉動,碟片沿不漏水的泵缸往上走,把碟片之間的水抬上去", () => {
  const def = m462.default;
  const a = def.pose(0).parts;
  const b = def.pose(-0.3).parts; // 上輪順時針轉
  const inTube = (p) => Math.abs(p.position[0] - m462.TUBE.x) < 1e-6 && p.position[1] > m462.TUBE.y0 && p.position[1] < m462.TUBE.y1;
  let checked = 0;
  for (const id of Object.keys(a).filter((k) => k.startsWith("disc"))) {
    if (inTube(a[id]) && inTube(b[id])) {
      assert.ok(b[id].position[1] > a[id].position[1], "筒裡的碟片往上走");
      checked++;
    }
  }
  assert.ok(checked > 3, "筒裡有好幾片碟片");
  assert.ok(m462.TUBE.y0 < m462.WATER, "泵缸下端浸在水裡");
  const s = 1.234;
  const p = m462.chainAt(s).p;
  const q = m462.chainAt(s + m462.LOOP).p;
  close(Math.hypot(p[0] - q[0], p[1] - q[1]), 0, "鏈條是無端的(繞一圈回到原處)");
});

test("第 462 種:碟片嵌在燈籠輪的橫檔之間:間距是橫檔間距的整數倍、落在兩根橫檔正中、全程不碰橫檔;鏈條繞在臂端上、碟片套在鏈上", () => {
  const def = m462.default;
  // 間距是臂距的整數倍、鏈長是間距的整數倍都是定義(SPACING、LOOP 由它們算出),不另斷言;下面掃碟片在輪上是否真的落在兩臂之間
  // 接觸:臂端離鏈條的內側接近 0(臂端帶著鏈走);碟片的中孔只比鏈大一點(碟片套在鏈上)
  const tipGap = m462.R - m462.CHAIN_W / 2 - m462.BAR_LEN / 2;
  assert.ok(tipGap >= 0 && tipGap < 0.01, `臂端貼著鏈條的內側(間隙 ${tipGap.toFixed(3)})`);
  const bore = def.parts.find((p) => p.id === "disc0").inner - m462.CHAIN_W / 2;
  assert.ok(bore >= 0 && bore < 0.02, `碟片的中孔套在鏈上(間隙 ${bore.toFixed(3)})`);
  const halfBar = m462.BAR_LEN / 2;
  const rectAlong = (x0, y0, x1, y1, w) => {
    const l = Math.hypot(x1 - x0, y1 - y0);
    const n = [(-(y1 - y0) / l) * w / 2, ((x1 - x0) / l) * w / 2];
    return [[x0 + n[0], y0 + n[1]], [x1 + n[0], y1 + n[1]], [x1 - n[0], y1 - n[1]], [x0 - n[0], y0 - n[1]]];
  };
  const bar = (c, a) => rectAlong(c[0] + halfBar * Math.cos(a), c[1] + halfBar * Math.sin(a), c[0] - halfBar * Math.cos(a), c[1] - halfBar * Math.sin(a), m462.BAR_W);
  const wheels = [{ id: "upper", c: m462.TOP }, { id: "lower", c: m462.BOTTOM }];
  let onWheel = 0;
  for (const theta of sweep(2 * Math.PI, 36)) {
    const pose = def.pose(theta).parts;
    const bars = wheels.flatMap((w) => Array.from({ length: m462.ARMS / 2 }, (_, i) => bar(w.c, pose[w.id].angle + (i * 2 * Math.PI) / m462.ARMS)));
    for (let i = 0; i < m462.DISCS; i++) {
      const { position: p, rotation } = pose[`disc${i}`];
      // 碟片的平面垂直於鏈條的切線;切線 = 四元數把 z 軸轉過去的方向
      const [qx, qy, qz, qw] = rotation;
      const t = [2 * (qx * qz + qw * qy), 2 * (qy * qz - qw * qx), 1 - 2 * (qx * qx + qy * qy)];
      const n = [-t[1], t[0]];
      const disc = rectAlong(p[0] - n[0] * m462.DISC_R, p[1] - n[1] * m462.DISC_R, p[0] + n[0] * m462.DISC_R, p[1] + n[1] * m462.DISC_R, m462.DISC_T);
      for (const b of bars) assert.ok(!polygonsOverlap(disc, b), `主動量 ${theta.toFixed(2)}:disc${i} 切過橫檔`);
      for (const w of wheels) {
        if (Math.abs(Math.hypot(p[0] - w.c[0], p[1] - w.c[1]) - m462.R) > 1e-6) continue;
        // 在輪上:碟片的平面是徑向的,離最近一根臂正好半個間距
        const rel = (((Math.atan2(p[1] - w.c[1], p[0] - w.c[0]) - pose[w.id].angle) % m462.SLOT) + m462.SLOT) % m462.SLOT;
        close(Math.min(rel, m462.SLOT - rel), m462.SLOT / 2, `${w.id} 上的 disc${i} 落在兩根橫檔正中`, 1e-6);
        onWheel++;
      }
    }
  }
  assert.ok(onWheel > 36 * 4, "每個姿勢兩個輪上都有碟片");
});

test("第 457 種:桔槔:配重約為所抬重量的一半,空桶要往下拉,滿桶時配重幫忙抬起", () => {
  assert.ok(m457.pull(false) > 0, "空桶:要往下拉");
  assert.ok(m457.pull(true) < 0, "滿桶:配重幫忙,只需往上提一部分");
  close(m457.LOADS.counter, (m457.LOADS.water + m457.LOADS.bucket) / 2, "配重約等於所抬重量的一半", 0.05);
  const low = m457.sweep(Math.abs(m457.SWING[0] - m457.SWING[1]) * 0.999);
  assert.ok(low.bucket[1] < -1.5, "放到最低時水桶進到井裡");
  assert.ok(m457.sweep(0.1).down && !m457.sweep(0.1).full, "往下放的是空桶");
});

test("第 458 種:滑輪與兩個水桶:把空桶往下拉,另一邊的滿桶就上來", () => {
  for (const v of sweep(4 * (m458.TOP - m458.BOTTOM), 40)) {
    const b = m458.buckets(v);
    close(b.left + b.right, m458.TOP + m458.BOTTOM, "繩長不變:一個下去另一個上來");
  }
  const b = m458.buckets(0.5);
  assert.ok(b.rightFull && !b.leftFull, "往下拉的左桶是空的,上來的右桶是滿的");
});

test("第 457 種:地面在井口開孔,水桶與繩從井口垂到井水裡,不穿過地面;井壁、井欄與地面連成一件", () => {
  const def = m457.default;
  const ground = part(def, "ground");
  const boxes = ground.pieces.filter((p) => p.kind === "box").map((p) => pieceBox(p));
  const r = Math.max(...part(def, "bucket").pieces[0].profile.map(([x]) => x));
  for (const v of sweep(2 * Math.abs(m457.SWING[0] - m457.SWING[1]), 80)) {
    const b = def.pose(v).parts.bucket.position;
    const lo = [b[0] - r, b[1] - 0.25, b[2] - r];
    const hi = [b[0] + r, b[1] + 0.34, b[2] + r];
    for (const g of boxes) assert.ok([0, 1, 2].some((k) => lo[k] >= g.hi[k] - 1e-9 || hi[k] <= g.lo[k] + 1e-9), `主動量 ${v.toFixed(2)}:水桶不穿過地面`);
    if (lo[1] < m457.GROUND) assert.ok(Math.hypot(b[0] - m457.WELL_X, b[2]) + r <= m457.WELL_INNER + 1e-9, `主動量 ${v.toFixed(2)}:水桶在井壁之內`);
  }
  assertOnePiece(ground, "地面、井壁、井欄與叉形柱連成一件");
});

test("第 458 種:滑輪的轉向和繩一致——左桶往下走多少,滑輪左側的輪緣就往下走多少(不打滑);吊架接在橫樑上", () => {
  const def = m458.default;
  const pulley = part(def, "pulley");
  const vs = sweep(2 * (m458.TOP - m458.BOTTOM), 80);
  for (let i = 1; i < vs.length; i++) {
    const a = def.pose(vs[i - 1]).parts;
    const b = def.pose(vs[i]).parts;
    // 滑輪逆時針轉 dθ 時,左側切點 (−r, 0) 的切線速度朝下 r·dθ
    const rimDown = (b.pulley.angle - a.pulley.angle) * pulley.radius;
    const ropeDown = a.bucketL.position[1] - b.bucketL.position[1];
    close(rimDown, ropeDown, `主動量 ${vs[i].toFixed(2)}:輪緣和繩同向同速`, 1e-9);
  }
  assertOnePiece(part(def, "house"), "吊架的夾板與軸銷接在橫樑上");
});

test("第 459 種:往復式升降機:風車一直朝同一方向轉,水桶一上一下,到頂撞撥爪後換方向", () => {
  let prev = m459.lift(0);
  let flips = 0;
  for (const w of sweep(400, 2000).slice(1)) {
    const l = m459.lift(w);
    close(l.left + l.right, m459.TOP + m459.BOTTOM, "一個水桶上升,另一個下降");
    assert.ok(l.left <= m459.TOP + 1e-9 && l.left >= m459.BOTTOM - 1e-9, "水桶在井口與井底之間");
    if (l.engaged !== prev.engaged) {
      flips++;
      assert.ok(Math.min(Math.abs(l.left - m459.TOP), Math.abs(l.right - m459.TOP)) < 0.1, "蝸桿在水桶到頂(撞撥爪)時換邊");
    }
    prev = l;
  }
  assert.ok(flips >= 2, "風車持續轉,水桶來回好幾趟");
  const def = m459.default;
  for (const v of sweep(40, 400)) {
    const w = 2 * Math.PI * v;
    const l = m459.lift(w);
    // 撥爪(搖臂)倒向哪邊,蝸桿軸的下端就往哪邊偏、咬上那一邊的輪:倒向左(逆時針)時咬左輪、左桶上升
    if (Math.abs(l.beta) > m459.TILT / 2) assert.equal(Math.sign(m459.worm(l.beta).shift), -Math.sign(l.beta), "搖臂把蝸桿推向一個輪");
    assert.equal(l.engaged === 0, l.leftUp, "咬左輪時左桶上升,咬右輪時右桶上升");
    // 一條繩繞過兩個滑輪的頂上:兩個滑輪一起轉
    const parts = def.pose(v).parts;
    close(parts.wheelL.angle, parts.wheelR.angle, "兩個滑輪同轉");
    // 由接觸算:撥爪被水桶頂起的時候,撞銷的底恰好擱在上升水桶的提把上(原文:水桶上升時會撞擊到它)
    if (l.pushing) {
      const s = l.leftUp ? -1 : 1;
      const pinBottom = m459.PIVOT[1] + s * m459.ARM * Math.sin(l.beta) + m459.PIN_Y - m459.PIN_R;
      const handle = (l.leftUp ? l.left : l.right) + m459.HANDLE;
      close(pinBottom, handle, "撞銷擱在提把上", 0.01);
    }
  }
  // 單頭蝸桿配 12 齒的蝸輪:風車轉一圈,咬著的蝸輪轉 1/12 圈(繩走 1/12 圈的滑輪周長)
  close(m459.lift(2 * Math.PI).left - m459.lift(0).left, (2 * Math.PI * m459.RATIO) * m459.DRUM_R, "風車一圈,水桶升一段", 1e-9);
});

test("第 459 種:蝸桿一次只作用於一個蝸輪——倒到底時咬著的輪齒頂貼著蝸桿的芯、另一輪離螺紋外徑有空隙;撥爪水平時兩輪的齒頂都剛碰到螺紋外徑", () => {
  // wormGap:蝸輪齒頂圓到螺紋外徑的間隙(負的是齒頂伸進螺紋的深度)
  close(m459.wormGap(m459.TILT, 0), -m459.THREAD, "撥爪倒向左邊到底:左輪齒頂貼著蝸桿的芯", 1e-6);
  assert.ok(m459.wormGap(m459.TILT, 1) > 0.02, "那時右輪的齒頂離螺紋外徑有空隙");
  close(m459.wormGap(-m459.TILT, 1), -m459.THREAD, "撥爪倒向右邊到底:右輪齒頂貼著蝸桿的芯", 1e-6);
  assert.ok(m459.wormGap(-m459.TILT, 0) > 0.02, "那時左輪的齒頂離螺紋外徑有空隙");
  close(m459.wormGap(0, 0), 0, "撥爪水平時左輪的齒頂剛碰到螺紋外徑", 1e-6);
  close(m459.wormGap(0, 1), 0, "撥爪水平時右輪的齒頂剛碰到螺紋外徑", 1e-6);
  for (const w of sweep(3 * m459.MOVE, 900)) {
    const l = m459.lift(w);
    const gaps = [m459.wormGap(l.beta, 0), m459.wormGap(l.beta, 1)];
    assert.ok(!(gaps[0] < -1e-6 && gaps[1] < -1e-6), `風車轉角 ${w.toFixed(1)}:一次只咬一個蝸輪`);
    assert.ok(gaps[l.engaged] <= 1e-6, `風車轉角 ${w.toFixed(1)}:帶動水桶的那個輪咬著蝸桿`);
    assert.ok(gaps[1 - l.engaged] >= -1e-6, `風車轉角 ${w.toFixed(1)}:另一個輪沒碰到螺紋`);
  }
});

test("第 459 種:蝸桿的螺距等於蝸輪的周節,齒塞得進兩圈螺紋之間", () => {
  const def = m459.default;
  const screw = part(def, "worm").pieces.find((p) => p.kind === "worm");
  const gear = part(def, "wheelL").pieces.find((p) => p.kind === "gear");
  const { addendum, dedendum } = gearSize(gear.radius, gear.teeth);
  close(screw.pitch, (2 * Math.PI * gear.radius) / gear.teeth, "螺距 = 周節(風車一圈,蝸輪走一齒)", 1e-9);
  // 齒在半徑 r 處的寬(齒形外廓上在那個半徑的點之間的最大距離)
  const tooth = toothOutline(gear);
  const widthAt = (r) => {
    const pts = tooth.filter(([x, y]) => Math.abs(Math.hypot(x, y) - r) < 1e-6);
    return Math.max(...pts.flatMap(([x, y]) => pts.map(([u, v]) => Math.hypot(x - u, y - v))));
  };
  const tipW = widthAt(gear.radius + addendum);
  const rootW = widthAt(gear.radius - dedendum);
  // 螺紋的斷面是半徑 thread 的圓,圓心在芯的表面:芯上寬 2·thread,離芯 d 處寬 2·√(thread² − d²)
  assert.ok(tipW + 2 * screw.thread < screw.pitch, `齒頂(寬 ${tipW.toFixed(3)})塞得進芯上兩圈螺紋之間(${(screw.pitch - 2 * screw.thread).toFixed(3)})`);
  const half = m459.THREAD / 2;
  const toothHalfway = tipW + ((rootW - tipW) * half) / (addendum + dedendum);
  const ridgeHalfway = 2 * Math.sqrt(screw.thread ** 2 - (screw.thread - half) ** 2);
  assert.ok(toothHalfway + ridgeHalfway < screw.pitch, "咬進一半深時齒也塞得進螺紋之間");
});

test("第 459 種:到頂的水桶被擋鉤勾住、繞提把的軸翻倒,水倒進井壁邊的水槽;倒完水的水桶被降下,另一個滿桶被抬起", () => {
  const def = m459.default;
  const top = m459.MOVE / (2 * Math.PI); // 左桶到頂的進程
  let tipped = 0;
  for (const v of sweep(top + 1.2, 240, top - 1.2)) {
    const l = m459.lift(2 * Math.PI * v);
    const pose = def.pose(v);
    const side = l.leftUp ? -1 : 1;
    const id = l.leftUp ? "L" : "R";
    const rising = l.leftUp ? l.left : l.right;
    if (l.tilt > 1e-9) {
      tipped++;
      // 由接觸算:桶緣勾在擋鉤的底面上滑,提把繼續上升,桶身就繞提把的軸翻過去
      const lip = m459.lipOf(side, rising, l.tilt);
      close(lip[1], m459.HOOK_Y, `進程 ${v.toFixed(2)}:桶緣貼著擋鉤的底面`, 1e-9);
      assert.ok(Math.abs(lip[0]) >= m459.HOOK_X[0] && Math.abs(lip[0]) <= m459.HOOK_X[1], `進程 ${v.toFixed(2)}:桶緣在擋鉤底面的範圍內(${lip[0].toFixed(3)})`);
      close(pose.parts[`bucket${id}`].angle, -side * l.tilt, "桶身往水槽那一邊翻", 1e-9);
      assert.ok(pose.parts[`water${id}`].level < 0.85, "翻倒時桶裡的水變少");
      if (l.tilt > 10 * degrees) {
        const path = m459.pourPath(side, lip);
        const end = path.at(-1);
        assert.ok(Math.abs(end[0]) >= m459.TROUGH.x0 && Math.abs(end[0]) <= m459.TROUGH.x1 && end[1] >= m459.TROUGH.y0 && end[1] <= m459.TROUGH.y1, "水倒進水槽裡");
        assert.ok(Math.hypot(path[0][0] - lip[0], path[0][1] - lip[1]) < 1e-9, "水從桶緣倒出");
        const pour = pose.flows.find((f) => f.points.length);
        assert.ok(pour && pour.points.every((p) => distanceToPath(path, p) < 1e-6), "流體示意的點都在倒水的路徑上");
      }
    } else assert.ok(pose.flows.every((f) => !f.points.length), "沒翻倒時沒有水倒出");
    if (v > top + 1e-9) {
      assert.ok(!l.leftUp && l.left < m459.TOP, "倒完水的左桶被降下");
      assert.equal(pose.parts.waterL.level, 0, "降下的桶是空的");
      assert.ok(pose.parts.waterR.level > 0.8, "另一個滿桶被抬起");
    }
  }
  assert.ok(tipped > 20, "翻倒佔了一段看得出來的進程");
  close(m459.lift(m459.MOVE - 1e-9).tilt, m459.TIP_MAX, "到頂時翻到最大角度", 1e-6);
  assert.equal(m459.lift(m459.MOVE - 2 * Math.PI * 1.5).tilt, 0, "到頂前一圈半還沒碰到擋鉤");
});

test("第 460 種:舀水斗:槓桿經連桿把舀斗抬起,水流到鉸點倒上岸;凹槽越遠抬得越多", () => {
  const range = (notch) => {
    const lo = m460.scoop(m460.SWING[0], notch).beta;
    const hi = m460.scoop(m460.SWING[1], notch).beta;
    return hi - lo;
  };
  assert.ok(range("far") > range("middle") && range("middle") > range("near"), "連桿放在越遠的凹槽,抬起越多");
  const lowEnd = (n) => m460.PIVOT[1] + m460.SCOOP * Math.sin(m460.scoop(m460.SWING[0], n).beta);
  const highEnd = (n) => m460.PIVOT[1] + m460.SCOOP * Math.sin(m460.scoop(m460.SWING[1], n).beta);
  for (const n of ["near", "middle", "far"]) {
    assert.ok(lowEnd(n) < m460.WATER - 0.1, `${n}:放下時斗浸在水裡`);
    // 原文「將水抬升短距離」:抬到最高時舀斗的末端高過鉸點,水才流得到鉸點、倒上岸
    assert.ok(highEnd(n) > m460.PIVOT[1], `${n}:抬到最高時舀斗的末端高過鉸點(末端 ${highEnd(n).toFixed(2)},鉸點 ${m460.PIVOT[1]})`);
  }
  // 連桿的上端掛在槓桿下緣的開口缺口裡(原圖槓桿左端下緣是一排缺口):缺口底就是銷的位置,缺口是外形的凹陷、不是封閉的孔
  const def = m460.default;
  const lever = def.parts.find((p) => p.id === "lever");
  assert.equal(lever.shape.holes.length, 1, "槓桿只有樞軸一個孔,凹槽不是孔");
  for (const [n, b] of Object.entries(m460.NOTCHES)) {
    const v = n === "middle" ? 0.1 : 0.3; // 任一姿勢
    const pose = def.pose(v, n);
    const { position, angle } = pose.parts.lever;
    const local = (p) => [position[0] + p[0] * Math.cos(angle) - p[1] * Math.sin(angle), position[1] + p[0] * Math.sin(angle) + p[1] * Math.cos(angle)];
    const pin = local([-b, -m460.ARM_W / 2]);
    close(Math.hypot(pose.parts.pitman.from[0] - pin[0], pose.parts.pitman.from[1] - pin[1]), 0, `${n}:連桿上端在缺口底(槓桿下緣)`, 1e-9);
    assert.ok(!pointInPolygon([-b, -m460.ARM_W / 2 + 0.03], lever.shape.outline), `${n}:缺口是從下緣切進去的開口`);
    assert.ok(pointInPolygon([-b, m460.ARM_W / 2 - 0.03], lever.shape.outline), `${n}:缺口上方仍是槓桿本體`);
  }
  // 槓桿的樞軸孔整個在外形裡
  for (const q of lever.shape.holes[0]) assert.ok(pointInPolygon(q, lever.shape.outline), "樞軸孔在外形裡");
});

test("第 461 種:擺動式水槽:繞中間的支點擺,往一邊擺到底時水平管把水從右箱送到左箱,往另一邊時斜管把水送上一層", () => {
  const world = (p, a) => [m461.PIVOT[0] + p[0] * Math.cos(a) - p[1] * Math.sin(a), m461.PIVOT[1] + p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const left = m461.active(m461.SWING[0]);
  const right = m461.active(m461.SWING[1]);
  m461.SEGMENTS.forEach((seg, k) => {
    assert.ok(left[k] !== right[k], `${seg.id} 只在一邊送水`);
    // 對到方向:送水的那一邊,這段管子的終點在世界裡比起點低(水往低處流);不送的那一邊終點比起點高
    const a = left[k] ? m461.SWING[0] : m461.SWING[1];
    const b = left[k] ? m461.SWING[1] : m461.SWING[0];
    assert.ok(world(seg.to, a)[1] < world(seg.from, a)[1], `${seg.id} 送水時往終點下斜`);
    assert.ok(world(seg.to, b)[1] > world(seg.from, b)[1], `${seg.id} 不送水時往終點上斜`);
  });
  assert.ok(left.some(Boolean) && right.some(Boolean), "兩邊各有管子送水");
  assert.ok(m461.active(0).every((on) => !on), "擺在中間時每段管子都往終點上斜,水不流");
  // 原文「中間的轉角處設有箱體,各自與兩段管子相連」「底部的末端為舀斗,頂部則為開口的管子」:
  // 每條鏈從進水口一段接一段(前一段的終點就是下一段的起點)、一段比一段高,接到開口的頂端;舀斗那條鏈水平管與斜管交替
  for (const chain of m461.CHAINS) {
    const segs = chain.map((id) => m461.SEGMENTS.find((s) => s.id === id));
    for (let i = 1; i < segs.length; i++) {
      assert.deepEqual(segs[i].from, segs[i - 1].to, `${segs[i].id} 接在 ${segs[i - 1].id} 的箱子上`);
      assert.ok(segs[i].to[1] > segs[i].from[1], `${segs[i].id} 把水送上一層`);
      assert.notEqual(segs[i].kind, segs[i - 1].kind, "水平管與斜管交替");
    }
  }
  // 舀斗:往一邊擺到底時浸在水裡舀水,另一邊離開水面;兩個進水口各在一邊舀水
  const scoopIn = (a) => world(m461.SCOOP, a)[1] < m461.WATER;
  assert.ok(scoopIn(m461.SWING[1]) && !scoopIn(m461.SWING[0]), "舀斗只在往左擺到底時浸在水裡");
  const boxIn = (a) => world(m461.BOXES.R6, a)[1] - m461.BOX / 2 < m461.WATER;
  assert.ok(boxIn(m461.SWING[0]) && !boxIn(m461.SWING[1]), "右下的底箱只在往右擺到底時浸在水裡");
  // 流體示意只在有管段送水時出現
  const def = m461.default;
  close(def.pose(Math.abs(m461.SWING[0])).parts.pendulum.angle, 0, "第一程走到一半時擺在中間");
  assert.ok(def.pose(Math.abs(m461.SWING[0])).flows.every((f) => f.points.length === 0), "擺在中間時沒有水在流");
  assert.ok(def.pose(0).flows.some((f) => f.points.length > 0), "擺到底時有水在流");
});

test("第 465 種:平衡泵:樑兩端交替往下,兩個泵的活塞一上一下輪流出水", () => {
  for (const a of sweep(m465.SWING[1], 10, m465.SWING[0])) {
    const [l, r] = m465.pistons(a);
    close(l + r, 2 * (m465.PIVOT[1] - m465.ROD), "兩個活塞一上一下(桿隨樑的孔微傾,差 1e-4 以內)", 1e-3);
  }
  const def = m465.default;
  assert.equal(def.pose(0.1).readouts[0].value, "右邊的泵", "樑往一邊轉時右邊的泵出水");
  const span = m465.SWING[1] - m465.SWING[0];
  assert.equal(def.pose(span + 0.1).readouts[0].value, "左邊的泵", "轉回來時換左邊");
});

// ── 第 465–467 種:泵的去處、支點與連桿、閥與管子 ─────────────────────
// 一件的檢查用 helpers 的 assertBoxesOnePiece(外接範圍版:附件會轉、有 lathe)

test("第 465 種:照原圖泵立在兩岸之間的坑底水裡,岸高於水面;閥瓣在水裡張開,全程碰不到岸與坑底", () => {
  const def = m465.default;
  assert.ok(m465.BARREL.y0 >= m465.PIT_FLOOR - 1e-9 && m465.BARREL.y0 - m465.PIT_FLOOR < 0.02, "泵筒底坐在坑底");
  assert.ok(m465.WATER_TOP > m465.BARREL.y0 + 0.4, "泵筒的下段浸在水裡");
  assert.ok(m465.BANK_TOP > m465.WATER_TOP, "兩岸高於水面");
  const solids = sectionSolids(def, ["frame"]);
  const span = m465.SWING[1] - m465.SWING[0];
  let opened = false;
  for (const v of sweep(4 * span, 48)) {
    const pose = def.pose(v);
    for (const k of [0, 1]) {
      assert.ok(!overlapsAny(placedFlap(def, `valve${k}`, pose), solids), `主動量 ${v.toFixed(3)}:閥 ${k} 的閥瓣碰到岸或坑底`);
      if (pose.parts[`valve${k}`].angle > 0.7) opened = true;
    }
  }
  assert.ok(opened, "閥瓣真的張開過");
});

test("第 465 種:兩個泵的出水管合成 Y 形總管往外送;流體示意離開泵筒後沿管子走,送到平台旁的出口,不灑回原處", () => {
  const def = m465.default;
  const span = m465.SWING[1] - m465.SWING[0];
  for (const [k, v] of [[1, 0.1], [0, span + 0.1], [1, 2 * span + 0.25]]) {
    const flows = def.pose(v).flows;
    assert.equal(flows.length, 1, "一次只有一個泵出水");
    const path = [...m465.DELIVERY[k], ...m465.MAIN.slice(1)];
    const out = flows[0].points.filter((p) => p[1] > m465.BARREL.y1 + 0.02 && p[0] > m465.MAIN.at(-1)[0] - 1e-6);
    assert.ok(out.length > 3, "有水離開泵筒");
    for (const p of out) assert.ok(distanceToPath(path, p) < 0.06, `點 (${p.map((x) => x.toFixed(2))}) 不在出水管上`);
    assert.ok(flows[0].points.some((p) => p[0] < m465.MAIN.at(-1)[0] + 0.3 && p[1] > m465.BANK_TOP), "水送到總管的出口");
    assert.ok(!flows[0].points.some((p) => p[1] < m465.BARREL.y1 && Math.abs(p[0] - (k ? m465.ATTACH : -m465.ATTACH)) > m465.BARREL.r), "沒有水灑回泵筒外");
  }
});

test("第 465 種:活塞桿頂以銷鉸在搖樑的孔上(叉頭夾著樑),桿長不變;樑架在中柱頂的叉頭上;扶手框的立柱接到樑", () => {
  const def = m465.default;
  const span = m465.SWING[1] - m465.SWING[0];
  const rod = part(def, "rod0");
  const pin = rod.pieces.find((p) => p.kind === "cylinder" && p.axis);
  assert.ok(pin, "活塞桿頂有銷");
  for (const v of sweep(4 * span, 40)) {
    const pose = def.pose(v);
    const a = pose.parts.beam.angle;
    const rods = m465.rods(a);
    for (const k of [0, 1]) {
      const hole = add(m465.PIVOT, [...rot2([(k ? 1 : -1) * m465.ATTACH, 0], a), 0]);
      const { Q, C } = rods[k];
      close(Math.hypot(Q[0] - hole[0], Q[1] - hole[1]), 0, "桿頂的銷在樑的孔上", 1e-9);
      close(Math.hypot(Q[0] - C[0], Q[1] - C[1]), m465.ROD, "桿長不變", 1e-9);
      close(C[0], (k ? 1 : -1) * m465.ATTACH, "活塞在泵筒的軸線上", 1e-9);
      const posed = pose.parts[`rod${k}`];
      const world = add(posed.position, quatRotate(posed.rotation, pin.at));
      close(Math.hypot(world[0] - hole[0], world[1] - hole[1]), 0, "姿勢裡銷的位置就是樑的孔", 1e-6);
    }
  }
  const beam = part(def, "beam");
  assert.equal(beam.shape.holes.length, 3, "樑上有支點孔與兩個桿銷孔");
  const legs = beam.pieces.filter((p) => p.kind === "plate" && Math.max(...p.shape.outline.map((q) => q[0])) - Math.min(...p.shape.outline.map((q) => q[0])) < 0.2);
  assert.ok(legs.length >= 2 && legs.every((p) => Math.min(...p.shape.outline.map((q) => q[1])) <= 0.06 + 1e-9), "扶手框的立柱往下接到樑");
  assertBoxesOnePiece(def, "beam");
  assertBoxesOnePiece(def, "frame");
  const frame = part(def, "frame");
  const cheeks = frame.pieces.filter((p) => p.kind === "box" && Math.abs(p.at[0]) < 1e-9 && Math.abs(p.at[2]) > 0.06 && p.at[1] > 1.4);
  assert.equal(cheeks.length, 2, "中柱頂是夾著樑的叉頭");
});

test("第 463 種:自動堰:平常水位時直立關閉;水位升高時上閘葉朝下游翻、下閘葉被推往上游,河床處打開", () => {
  const normal = m463.gates(m463.NORMAL);
  close(normal.upper, 0, "平常水位:上閘葉直立");
  close(normal.lower, 0, "平常水位:下閘葉直立");
  assert.ok(!normal.open);
  const flood = m463.gates(m463.NORMAL + 0.6);
  assert.ok(flood.upper < 0, "上閘葉順時針(朝下游)翻");
  assert.ok(flood.lower > 0, "下閘葉逆時針(朝上游)被推回");
  assert.ok(flood.open, "河床處打開");
  const outline = m463.outline; // 閘葉的輪廓(下閘葉的下端是圓頭)
  const lowerLeaf = (h) => placeOutline(outline(m463.LOWER), m463.LOWER.pivot, m463.gates(h).lower);
  // 原文「在河床處打開一條通道,讓沉積物排出」:上閘葉翻到底時,下閘葉的下端離河床有明顯的開口;河床的流體示意從這個開口底下流過,不穿過閘葉
  const lowest = (poly) => Math.min(...poly.map((p) => p[1]));
  assert.ok(lowest(lowerLeaf(m463.FLOOD)) - m463.BED > 0.15, `翻到底時下閘葉的下端離河床 ${(lowest(lowerLeaf(m463.FLOOD)) - m463.BED).toFixed(3)},要開出明顯的通道`);
  close(lowest(lowerLeaf(m463.NORMAL)), m463.BED, "平常水位時下閘葉的下端貼著河床,通道關著", 1e-6);
  for (const h of sweep(m463.FLOOD, 12, m463.NORMAL)) {
    const g = m463.gates(h);
    const lower = lowerLeaf(h);
    const upper = placeOutline(outline(m463.UPPER), m463.UPPER.pivot, g.upper);
    const pts = m463.default.pose(h).flows.flatMap((f) => f.points);
    for (const p of pts) {
      assert.ok(!pointInPolygon(p, lower), `水位 ${h.toFixed(2)}:流體示意穿過下閘葉(${p.map((c) => c.toFixed(2))})`);
      assert.ok(!pointInPolygon(p, upper), `水位 ${h.toFixed(2)}:流體示意穿過上閘葉(${p.map((c) => c.toFixed(2))})`);
    }
    if (g.open) {
      const xs = lower.map((p) => p[0]);
      assert.ok(pts.some((p) => p[0] > Math.min(...xs) && p[0] < Math.max(...xs) && p[1] < lowest(lower)), `水位 ${h.toFixed(2)}:水從下閘葉下端與河床之間的通道流過`);
    }
  }
  // 由接觸算:下閘葉被水壓推抵在上閘葉上——不穿入上閘葉,再往下游擺 1° 就碰到;上閘葉翻得越多,下閘葉被推回越多
  let prev = -1;
  for (const h of sweep(m463.FLOOD, 12, m463.NORMAL)) {
    const g = m463.gates(h);
    const upper = placeOutline(outline(m463.UPPER), m463.UPPER.pivot, g.upper);
    assert.ok(!polygonsOverlap(placeOutline(outline(m463.LOWER), m463.LOWER.pivot, g.lower), upper), "下閘葉不穿入上閘葉");
    assert.ok(polygonsOverlap(placeOutline(outline(m463.LOWER), m463.LOWER.pivot, g.lower - Math.PI / 180), upper), "下閘葉貼著上閘葉");
    assert.ok(g.lower >= prev - (2 * Math.PI) / 180, "上閘葉翻得越多,下閘葉被推回越多(推到底時接觸點移到上閘葉的下角,略回 1°)");
    prev = g.lower;
  }
  // 原文「上方閘葉比下方閘葉大得多」
  assert.ok(m463.UPPER.above + m463.UPPER.below > 1.4 * (m463.LOWER.above + m463.LOWER.below), "上閘葉比下閘葉大得多");
});

test("第 464 種:希羅噴泉:水從上方降到下方容器,壓縮的空氣把中間容器的水從中央管噴出", () => {
  const a = m464.fountain(0.1);
  const b = m464.fountain(0.6);
  assert.ok(b.low > a.low, "下方容器的水越來越多");
  assert.ok(b.mid < a.mid, "中間容器的水被推出去");
  assert.ok(a.jet > 0 && b.jet > 0, "中央管一直噴水");
  assert.ok(b.jet < a.jet, "水位差變小,水柱稍降");
  // 原圖的配置:上方容器是頂上的橫箱,中間容器是吊在橫箱下面的碗(碗與橫箱底之間留一層空氣),下方容器是底箱
  assert.ok(m464.BOWL.top <= m464.TOP.y0 && m464.BOWL.rim < m464.BOWL.top, "碗吊在橫箱下面,碗的水面上方留一層空氣");
  assert.ok(m464.LOW.y1 < m464.BOWL.rim - m464.BOWL.r, "底箱在碗下面");
  // 原文「經由右側的管子下降至下方容器」:右管從橫箱底通到底箱,管口在底箱的水面下(空氣才封得住)
  assert.ok(m464.DOWN_PIPE.y1 >= m464.TOP.y0 && m464.DOWN_PIPE.y0 < m464.LOW.y0 + (m464.LOW.y1 - m464.LOW.y0) * m464.fountain(0).low, "右管從橫箱通到底箱、管口在水面下");
  // 原文「被封閉於下方與中間容器水面上方空腔及左側連通管中的空氣」:左管接在底箱的空腔與碗上方的空腔之間
  const lowSurface = (v) => m464.LOW.y0 + (m464.LOW.y1 - m464.LOW.y0) * m464.fountain(v).low;
  assert.ok(m464.AIR_PIPE.y0 > lowSurface(1) && m464.AIR_PIPE.y0 < m464.LOW.y1, "左管下口在底箱水面上方的空腔");
  assert.ok(m464.AIR_PIPE.y1 > m464.BOWL.rim && m464.AIR_PIPE.y1 <= m464.BOWL.top, "左管上口在碗上方的空腔");
  // 原文「水柱從中央管噴出」:中央管從碗底往上穿過橫箱,噴口在橫箱上方
  assert.ok(m464.NOZZLE.y0 < m464.BOWL.rim - m464.BOWL.r + 0.1 && m464.NOZZLE.y1 > m464.TOP.y1, "中央管從碗底通到橫箱上方");
  // 水頭(右管水柱扣掉碗的水面到噴口的高度)到最後仍是正的:中間容器的水噴得完
  assert.ok(m464.fountain(0.99).jet > 0, "進程到底時仍在噴");
  // 噴出的水落回上方的橫箱裡
  const jets = m464.default.pose(0.3).flows.find((fl) => fl.fluid === "water").points.filter((p) => p[1] > m464.TOP.y1);
  assert.ok(jets.length > 0 && jets.every((p) => Math.abs(p[0]) < (m464.W - 0.12) / 2), "水柱在橫箱上方、落回橫箱裡");
});

test("第 466 種:液壓機:力的倍數等於兩柱塞的直徑平方比;1 吋與 30 吋是 900 倍", () => {
  close((30 / 1) ** 2, 900, "原文的例子");
  const def = m466.default;
  assert.match(def.pose(0).readouts[0].value, new RegExp(String(Math.round((m466.RAM_D / m466.PLUNGER_D) ** 2))));
  // 泵每壓一次,柱塞升起一點;只有壓下的行程送水(第一程就是往下壓)
  const span = Math.abs(m466.SWING[1] - m466.SWING[0]);
  const rises = [0, 2, 4, 6].map((k) => m466.press(k * span + 0.01).rise);
  for (let i = 1; i < rises.length; i++) assert.ok(rises[i] > rises[i - 1], "每壓一下,柱塞升高");
  assert.ok(m466.press(span * 0.5).rise > 0, "壓下泵柱塞時水進柱塞缸,柱塞升起");
  close(m466.press(span * 1.5).rise, m466.press(span).rise, "提起泵柱塞(吸水)時柱塞不動", 1e-9);
});

test("第 466 種:照原圖手柄的支點在泵柱塞左邊(掛在泵座上的吊桿),把手往右;往下壓把手就壓下柱塞送水;吊桿長不變、柱塞銷在泵筒軸線上", () => {
  const def = m466.default;
  const span = Math.abs(m466.SWING[1] - m466.SWING[0]);
  const p0 = m466.press(0.01);
  const p1 = m466.press(0.3);
  assert.ok(p1.theta < p0.theta && p1.plunger < p0.plunger && p1.down, "把手往下壓,泵柱塞往下送水");
  for (const v of sweep(4 * span, 60)) {
    const p = m466.press(v);
    close(Math.hypot(p.hang[0] - m466.HANGER.ear[0], p.hang[1] - m466.HANGER.ear[1]), m466.HANGER.length, "吊桿長不變", 1e-6);
    close(p.top[0], m466.PUMP_X, "柱塞銷在泵筒軸線上", 1e-9);
    assert.ok(p.hang[0] < m466.PUMP_X, "支點(吊桿的上銷)在柱塞左邊");
    const pose = def.pose(v);
    close(pose.parts.handle.position[0], p.hang[0], "手柄的左端掛在吊桿上", 1e-9);
    close(pose.parts.handle.position[1], p.hang[1], "手柄的左端掛在吊桿上", 1e-9);
    const hole = add([p.hang[0], p.hang[1], 0], [...rot2([m466.HANGER.short, 0], pose.parts.handle.angle), 0]);
    close(hole[0], p.top[0], "手柄上的銷孔對著柱塞頂的銷", 1e-9);
    close(hole[1], p.top[1], "手柄上的銷孔對著柱塞頂的銷", 1e-9);
    assert.ok(pose.parts.hanger, "吊桿是零件");
  }
  const handle = part(def, "handle");
  const grip = handle.pieces.find((p) => p.kind === "sphere");
  assert.ok(grip.at[0] > m466.HANGER.short, "把手往右伸過柱塞");
});

test("第 466 種:小管接進開著口的泵筒與柱塞缸,出水閥在閥室裡;流體示意全程不穿過壁、閥瓣開到底不穿過壁;機架一件、立柱立在缸座的凸緣上", () => {
  const def = m466.default;
  const span = Math.abs(m466.SWING[1] - m466.SWING[0]);
  const solids = sectionSolids(def, ["frame", "ramCylinder", "pump"]);
  let opened = { suction: false, delivery: false };
  for (const v of sweep(4 * span, 48)) {
    const pose = def.pose(v);
    for (const flow of pose.flows) for (const q of flow.points) assert.ok(!inAny([q[0], q[1]], solids), `主動量 ${v.toFixed(3)} 的點 (${q[0].toFixed(2)}, ${q[1].toFixed(2)}) 在壁裡`);
    for (const id of ["suction", "delivery"]) {
      assert.ok(!digsInto(placedFlap(def, id, pose), solids), `主動量 ${v.toFixed(3)}:${id} 的閥瓣穿過壁`);
      if (Math.abs(pose.parts[id].angle - (id === "suction" ? 0 : Math.PI / 2)) > 0.7) opened[id] = true;
    }
  }
  assert.ok(opened.suction && opened.delivery, "兩個閥都真的張開過");
  assertBoxesOnePiece(def, "frame");
  assertBoxesOnePiece(def, "pump");
  const frame = part(def, "frame");
  const columns = frame.pieces.filter((p) => p.kind === "box" && p.size[1] > 3);
  const flange = frame.pieces.find((p) => p.kind === "box" && p.size[0] > 2 && p.size[0] < 4 && p.at[1] < -1);
  assert.ok(columns.length >= 2 && flange, "有立柱與缸座的凸緣");
  for (const c of columns) {
    close(c.at[1] - c.size[1] / 2, flange.at[1] + flange.size[1] / 2, "立柱立在凸緣上", 1e-9);
    assert.ok(Math.abs(c.at[0] - flange.at[0]) < flange.size[0] / 2, "立柱在凸緣的範圍內");
  }
  assert.ok(!frame.pieces.some((p) => p.kind === "box" && p.at[0] > 1 && p.at[1] > 0.5), "沒有浮在空中的手柄支柱");
});

test("第 467 種:液壓千斤頂:壓手柄把液壓缸沿固定的柱塞抬起;開閥時水流回、慢慢放下", () => {
  const span = Math.abs(m467.SWING[1] - m467.SWING[0]);
  const lifts = [0, 2, 4].map((k) => m467.jack(k * span + span * 0.9, "lift").rise);
  assert.ok(lifts[2] > lifts[1] && lifts[1] > lifts[0], "壓越多下,升得越高");
  const r = [0, 1, 3].map((v) => m467.jack(v, "release").rise);
  assert.ok(r[0] > r[1] && r[1] > r[2], "開閥後慢慢降下");
});

test("第 467 種:托座在液壓缸頂上(局部 z 軸向)、爪鉤在側面,和缸連成一件;底座、柱塞、螺絲各是一件", () => {
  const def = m467.default;
  const cyl = part(def, "cylinder");
  const saddle = cyl.pieces[0];
  close(saddle.at[2], m467.CYL.len, "托座坐在缸頂(lathe 的局部 z 是世界的 +Y)", 1e-9);
  close(saddle.at[1], 0, "托座沒有往後偏", 1e-9);
  for (const id of ["cylinder", "base", "plunger", "screw"]) assertBoxesOnePiece(def, id);
});

test("第 467 種:照原圖:手柄下端在缸的左下,經搖桿銷接到底座;柱塞銷在手柄上、沿泵筒軸線滑;兩銷距離與搖桿長不變;壓下手柄柱塞往下送水", () => {
  const def = m467.default;
  const span = Math.abs(m467.SWING[0] - m467.SWING[1]);
  const j0 = m467.jack(0.01);
  const j1 = m467.jack(0.3);
  assert.ok(j1.handle < j0.handle && j1.s < j0.s && j1.pressing, "壓下手柄,柱塞沿泵筒往下送水");
  const { anchor, length } = m467.ROCKER;
  const { origin, dir } = m467.LINE;
  for (const v of sweep(4 * span, 60)) {
    const j = m467.jack(v);
    close(Math.hypot(j.F[0] - anchor[0], j.F[1] - anchor[1]), length, "搖桿長不變", 1e-6);
    close(Math.hypot(j.P[0] - j.F[0], j.P[1] - j.F[1]), m467.SHORT, "手柄兩銷的距離不變", 1e-6);
    close((j.P[0] - origin[0]) * dir[1] - (j.P[1] - origin[1]) * dir[0], 0, "柱塞銷在泵筒的軸線上", 1e-6);
    assert.ok(j.F[0] < j.P[0] && j.P[0] < 0, "手柄下端與柱塞都在缸的左下");
    assert.ok(j.s - m467.PLUNGER > m467.BARREL.lo + 0.1 && j.s - m467.PLUNGER < m467.BARREL.hi - 0.1, "柱塞的下端全程在泵筒裡");
    const pose = def.pose(v);
    close(pose.parts.handle.position[0], j.F[0], "手柄的下端在搖桿的銷上", 1e-9);
    close(pose.parts.handle.position[1], j.F[1], "手柄的下端在搖桿的銷上", 1e-9);
    close(pose.parts.handle.angle, j.handle, "手柄角", 1e-9);
    const hole = add([j.F[0], j.F[1], 0], [...rot2([m467.SHORT, 0], j.handle), 0]);
    close(Math.hypot(hole[0] - j.P[0], hole[1] - j.P[1]), 0, "手柄上的銷孔對著柱塞的銷", 1e-9);
    assert.ok(pose.parts.rocker, "搖桿是零件");
  }
  assert.ok(anchor[0] < -0.9 && anchor[1] > -1.05 && anchor[1] < -0.7, "搖桿的固定銷在底座左上角");
});

test("第 467 種:開閥放下:轉翼形螺絲把閥從管底的閥座退出、手柄不動;回流從液壓缸經柱塞裡的管子到管底、從閥流回底座;兩個狀態的流體示意都不穿過壁,閥瓣開到底不穿過壁", () => {
  const def = m467.default;
  const span = Math.abs(m467.SWING[0] - m467.SWING[1]);
  const solids = sectionSolids(def, ["base"]);
  const rel = [0, 0.5, 1.5, 3].map((v) => def.pose(v, "release"));
  for (let i = 1; i < rel.length; i++) {
    assert.ok(rel[i].parts.screw.position[0] <= rel[i - 1].parts.screw.position[0], "螺絲往外退");
    assert.ok(rel[i].parts.screw.angle > rel[i - 1].parts.screw.angle, "螺絲在轉");
    close(rel[i].parts.handle.angle, rel[0].parts.handle.angle, "手柄不動", 1e-12);
    assert.ok(rel[i].parts.cylinder.position[1] < rel[i - 1].parts.cylinder.position[1], "液壓缸慢慢降下");
  }
  // 閥座在管子的底部:閉著時塞子在管底的口裡,開著時整個退出口外
  const screw = part(def, "screw");
  const plug = screw.pieces.find((p) => p.kind === "cylinder" && p.radius > 0.06);
  const plugRight = (pose) => pose.parts.screw.position[0] + plug.at[2] + plug.length / 2;
  assert.ok(plugRight(def.pose(0.5, "lift")) > m467.PIPE_END + 0.05, "抬升時塞子塞在管底的口裡");
  assert.ok(plugRight(rel[3]) < m467.PIPE_END - 0.01, "開閥時塞子退出管底的口");
  assert.ok(def.pose(3, "release").flows.length, "開閥時有回流");
  for (const [state, vs] of [["lift", sweep(4 * span, 48)], ["release", sweep(4, 20)]]) {
    for (const v of vs) {
      const pose = def.pose(v, state);
      for (const flow of pose.flows) {
        for (const q of flow.points) assert.ok(!inAny([q[0], q[1]], solids), `${state} 主動量 ${v.toFixed(3)} 的點 (${q[0].toFixed(2)}, ${q[1].toFixed(2)}) 在壁裡`);
        if (state === "release") {
          const inBase = flow.points.filter((q) => q[1] < m467.BASE.y1 && q[0] > m467.PIPE_END);
          for (const q of inBase) assert.ok(distanceToPath(m467.PIPE.map(([x, y]) => [x, y, 0]), [q[0], q[1], 0]) < 0.08, "回流在底座裡走管子");
          assert.ok(flow.points.some((q) => q[0] < m467.PIPE_END), "回流從管底的閥流出到底座");
        }
      }
    }
  }
  let opened = { suction: false, delivery: false };
  for (const v of sweep(4 * span, 48)) {
    const pose = def.pose(v, "lift");
    for (const id of ["suction", "delivery"]) {
      assert.ok(!digsInto(placedFlap(def, id, pose), solids), `主動量 ${v.toFixed(3)}:${id} 的閥瓣穿過壁`);
      if (Math.abs(pose.parts[id].angle - (id === "suction" ? m467.SUCTION_CLOSED : Math.PI / 2)) > 0.6) opened[id] = true;
    }
  }
  assert.ok(opened.suction && opened.delivery, "兩個閥都真的張開過");
});

test("第 468 種:撓性輸水管:各節以鉸鏈相連,拖過河時順著河床的起伏", () => {
  for (const u of sweep(1, 10)) {
    const pts = m468.joints(u);
    for (let k = 1; k < pts.length; k++) close(Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]), m468.SEGMENT, "每節長度不變", 1e-6);
    for (const p of pts) close(p[1] - m468.bed(p[0]), 0.19, "鉸點都貼著河床", 1e-6);
  }
  assert.ok(m468.joints(1)[0][0] > m468.joints(0)[0][0] + 6, "管頭從南岸被拖到北岸");
});

test("第 469 種:溫差引擎:水車經齒輪帶動螺旋;空氣經管子越過頂上,從輪下方冒出", () => {
  close(m469.screwAngle(1), -3, "螺旋與水車以齒輪相連(反向,3 : 1)");
  const pose = m469.default.pose(0.5);
  assert.equal(pose.flows[0].fluid, "air", "以空氣示意");
  assert.ok(pose.flows[0].points.some((p) => p[1] > 2.0), "空氣越過頂上的管子");
  assert.equal(pose.readouts[0].value, "原文未說明");
  // 主動件是推著水車的空氣(虛擬的進程),目標件是水車:這組裝置的目的是「得到旋轉運動」
  assert.equal(m469.default.driver.type, "virtual");
  assert.equal(m469.default.target, "wheel");
  // 螺旋被水車帶著轉時,螺紋往下走,把空氣壓進管裡(原文:「將螺旋朝與抬水相反的方向轉動,藉此將空氣向下壓入管中」)
  const wheel = m469.default.pose(0.1).parts.wheel.angle - m469.default.pose(0).parts.wheel.angle;
  assert.ok(wheel > 0, "水車逆時針轉(氣泡從輪的右下方冒上來)");
  assert.ok(m469.threadAdvance(m469.default.pose(0.1).parts.screw.angle - m469.default.pose(0).parts.screw.angle) < 0, "螺紋往下走");
});
