// 第十九章「水車與泵」:斷言對應原文;流體示意只驗它是主動量的函式、只在路徑上
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, inSolid } from "./helpers.js";
import { Y, Z, cross, dot, sub, scale, quatRotate } from "../models/kit.js";
import { distanceToPath } from "../models/flow.js";
import { placeOutline, polygonsOverlap, penetrationDepth } from "../models/contact.js";
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

test("第 438 種:巴克氏水車:水從臂端噴出,軸的轉向與噴水方向相反", () => {
  const def = m438.default;
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

test("第 436 種:容瓦爾渦輪:導水槽固定在筒身裡,輪 c 的水斗比導水槽多、斜向排列", () => {
  assert.ok(m436.WHEEL.count > m436.GUIDE.count, "水斗比導水槽多");
  assert.ok(Math.sign(m436.WHEEL.tilt) !== Math.sign(m436.GUIDE.tilt), "水斗斜向與導水槽相反(水轉向後推輪)");
  assert.ok(m436.WHEEL.y < m436.GUIDE.y, "輪在導水槽下面");
  const def = m436.default;
  close(def.pose(0.25).parts.wheel.angle, Math.PI / 2, "進程四分之一圈,輪轉 90°");
});

test("第 442 種:戽水車:罐子依序在水裡裝滿,升到上方倒進水槽", () => {
  const deg = Math.PI / 180;
  assert.equal(m442.potLevel(-60 * deg), 1, "過了底部的罐子已裝滿");
  assert.equal(m442.potLevel(60 * deg), 1, "上升途中滿著");
  assert.equal(m442.potLevel(150 * deg), 0, "過了頂端已倒空");
  assert.equal(m442.potLevel(-150 * deg), 0, "下降時空著");
  assert.ok(-m442.RIM < m442.RIVER, "輪的下端浸在水裡");
});

test("第 443 種:阿基米德螺旋:水流轉動下端的輪,水沿螺旋通道連續往上送,從頂端排出", () => {
  const def = m443.default;
  const z0 = m443.pockets(-2 * Math.PI * 0.1);
  const z1 = m443.pockets(-2 * Math.PI * 0.2);
  // 每團水往上移:同一團水轉十分之一圈上移十分之一螺距
  close(z1[0] - z0[0], m443.PITCH * 0.1, "螺旋轉一圈,水上移一個螺距", 1e-9);
  assert.ok(z0.length >= 4, "通道裡一路都有水(連續輸送)");
  assert.ok(def.pose(0.3).flows[0].points.length > 0);
  assert.ok(m443.BASE[1] - 1.25 < m443.RIVER, "下端的輪浸在水裡");
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

test("第 440 種:分成兩半的水槽:一邊裝滿就翻過去倒出,另一邊轉到水流下方;可當水錶計數", () => {
  const a = m440.trough(0.2);
  assert.ok(a.tilt > 0 && a.right > 0 && a.left === 0, "左邊低時水落進抬高的右邊");
  const b = m440.trough(0.7);
  assert.ok(b.tilt < 0 && b.left > 0 && b.right === 0, "翻過去後水落進左邊");
  assert.equal(m440.trough(0.99).count, 2, "一個來回倒兩次");
  assert.equal(m440.trough(3.2).count, 6, "計數累加");
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
    if (a > m455.ABUT[0] && a < m455.ABUT[1] - m455.RAMP_IN) assert.ok(open < 0.8, "鉸點在擋板的平面段時閥門被壓下");
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
    if (!l.atTop) assert.equal(l.engaged === 0, l.leftUp, "咬左輪時左桶上升,咬右輪時右桶上升");
    // 一條繩繞過兩個滑輪的頂上:兩個滑輪一起轉
    const parts = def.pose(v).parts;
    close(parts.wheelL.angle, parts.wheelR.angle, "兩個滑輪同轉");
    // 由接觸算:撥爪被水桶頂起的時候,撞銷的底恰好擱在上升水桶的提把上(原文:水桶上升時會撞擊到它)
    if (!l.atTop && Math.abs(l.beta) < m459.TILT - 1e-6) {
      const s = l.leftUp ? -1 : 1;
      const pinBottom = m459.PIVOT[1] + s * m459.ARM * Math.sin(l.beta) + m459.PIN_Y - m459.PIN_R;
      const handle = (l.leftUp ? l.left : l.right) + m459.HANDLE;
      close(pinBottom, handle, "撞銷擱在提把上", 0.01);
    }
  }
  // 單頭蝸桿配 12 齒的蝸輪:風車轉一圈,咬著的蝸輪轉 1/12 圈(繩走 1/12 圈的滑輪周長)
  close(m459.lift(2 * Math.PI).left - m459.lift(0).left, (2 * Math.PI * m459.RATIO) * m459.DRUM_R, "風車一圈,水桶升一段", 1e-9);
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
    assert.ok(lowEnd(n) < m460.WATER, "放下時斗浸在水裡");
    assert.ok(highEnd(n) > m460.WATER, "抬起時斗離開水面");
  }
});

test("第 461 種:擺動式水槽:擺往兩邊擺時,交替的兩組管子輪流把水送上一層", () => {
  const left = m461.active(m461.SWING[0]);
  const right = m461.active(m461.SWING[1]);
  for (let k = 0; k < left.length; k++) assert.ok(left[k] !== right[k], `第 ${k + 1} 段管子只在一邊送水`);
  assert.ok(left.some(Boolean) && right.some(Boolean), "兩邊各有管子送水");
  assert.ok(m461.active(0).every((on) => !on), "擺在中間時管子都往上斜,水不流");
  assert.ok(Math.abs(m461.SWING[0]) > m461.SLOPE, "擺幅大於管子的斜度");
});

test("第 465 種:平衡泵:樑兩端交替往下,兩個泵的活塞一上一下輪流出水", () => {
  for (const a of sweep(m465.SWING[1], 10, m465.SWING[0])) {
    const [l, r] = m465.pistons(a);
    close(l + r, 2 * (m465.PIVOT[1] - 1.75), "兩個活塞一上一下");
  }
  const def = m465.default;
  assert.equal(def.pose(0.1).readouts[0].value, "右邊的泵", "樑往一邊轉時右邊的泵出水");
  const span = m465.SWING[1] - m465.SWING[0];
  assert.equal(def.pose(span + 0.1).readouts[0].value, "左邊的泵", "轉回來時換左邊");
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
  const pts = m463.default.pose(m463.NORMAL + 0.6).flows.flatMap((f) => f.points);
  assert.ok(pts.some((p) => p[1] < 0.4 && Math.abs(p[0]) < 0.3), "水從河床的通道流過(沖走沉積物)");
  // 由接觸算:下閘葉被水壓推抵在上閘葉上——不穿入上閘葉,再往下游擺 1° 就碰到;上閘葉翻得越多,下閘葉被推回越多
  const outline = (g) => [[-0.07, -g.below], [0.07, -g.below], [0.07, g.above], [-0.07, g.above]];
  let prev = -1;
  for (const h of sweep(3.0, 12, m463.NORMAL)) {
    const g = m463.gates(h);
    const upper = placeOutline(outline(m463.UPPER), m463.UPPER.pivot, g.upper);
    assert.ok(!polygonsOverlap(placeOutline(outline(m463.LOWER), m463.LOWER.pivot, g.lower), upper), "下閘葉不穿入上閘葉");
    assert.ok(polygonsOverlap(placeOutline(outline(m463.LOWER), m463.LOWER.pivot, g.lower - Math.PI / 180), upper), "下閘葉貼著上閘葉");
    assert.ok(g.lower >= prev - (2 * Math.PI) / 180, "上閘葉翻得越多,下閘葉被推回越多(推到底時接觸點移到上閘葉的下角,略回 1°)");
    prev = g.lower;
  }
});

test("第 464 種:希羅噴泉:水從上方降到下方容器,壓縮的空氣把中間容器的水從中央管噴出", () => {
  const a = m464.fountain(0.1);
  const b = m464.fountain(0.6);
  assert.ok(b.low > a.low, "下方容器的水越來越多");
  assert.ok(b.mid < a.mid, "中間容器的水被推出去");
  assert.ok(a.jet > 0 && b.jet > 0, "中央管一直噴水");
  assert.ok(b.jet < a.jet, "水位差變小,水柱稍降");
});

test("第 466 種:液壓機:力的倍數等於兩柱塞的直徑平方比;1 吋與 30 吋是 900 倍", () => {
  close((30 / 1) ** 2, 900, "原文的例子");
  const def = m466.default;
  assert.match(def.pose(0).readouts[0].value, new RegExp(String(Math.round((m466.RAM_D / m466.PLUNGER_D) ** 2))));
  // 泵每壓一次,柱塞升起一點;只有壓下的行程送水
  const span = Math.abs(m466.SWING[1] - m466.SWING[0]);
  const rises = [0, 2, 4, 6].map((k) => m466.press(k * span + 0.01).rise);
  for (let i = 1; i < rises.length; i++) assert.ok(rises[i] > rises[i - 1], "每壓一下,柱塞升高");
  assert.equal(m466.press(span * 0.5).rise, 0, "提起泵柱塞(吸水)時柱塞不動");
});

test("第 467 種:液壓千斤頂:壓手柄把液壓缸沿固定的柱塞抬起;開閥時水流回、慢慢放下", () => {
  const span = Math.abs(m467.SWING[1] - m467.SWING[0]);
  const lifts = [0, 2, 4].map((k) => m467.jack(k * span + span * 0.9, "lift").rise);
  assert.ok(lifts[2] > lifts[1] && lifts[1] > lifts[0], "壓越多下,升得越高");
  const r = [0, 1, 3].map((v) => m467.jack(v, "release").rise);
  assert.ok(r[0] > r[1] && r[1] > r[2], "開閥後慢慢降下");
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
