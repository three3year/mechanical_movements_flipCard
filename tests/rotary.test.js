// 第十八章「雜項與旋轉引擎」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, turned, assertMeshFree, part, plateLayers, inSolid, polyGap, pieceBox, assertShaftInBearings } from "./helpers.js";
import { TAU, add, sub, scale, dot, dist, rot2, deg, quatRotate, planeBasis, signedAngle } from "../models/kit.js";
import { placeOutline, circlePolygon, edgeDistance, penetrationDepth, pointInPolygon } from "../models/contact.js";
import { gearProfile, rect, thickLine } from "../models/shapes.js";
import { distanceToPath } from "../models/flow.js";
import { WALL } from "../models/vertical-engine.js";

import * as m412 from "../models/fig412.js";
import * as m413 from "../models/fig413.js";
import * as m414 from "../models/fig414.js";
import * as m415 from "../models/fig415.js";
import * as m416 from "../models/fig416.js";
import * as m417 from "../models/fig417.js";
import * as m418 from "../models/fig418.js";
import * as m419 from "../models/fig419.js";
import * as m420 from "../models/fig420.js";
import * as m421 from "../models/fig421.js";
import * as m422 from "../models/fig422.js";
import * as m423 from "../models/fig423.js";
import * as m424 from "../models/fig424.js";
import * as m425 from "../models/fig425.js";
import * as m426 from "../models/fig426.js";
import * as m427 from "../models/fig427.js";
import * as m428 from "../models/fig428.js";
import * as m429 from "../models/fig429.js";

test("第 412 種:絞盤解鎖時鼓頭與鼓輪反向轉,速度比三比一;鎖定時一起轉(單倍)", () => {
  const def = m412.default;
  close(turned(def, "barrel", 0, 1.2, "free"), -1.2 / 3, "解鎖:鼓輪反向轉三分之一");
  close(turned(def, "barrel", 0, 1.2, "locked"), 1.2, "鎖定:鼓輪與鼓頭一起轉");
  assertMeshFree(def, "sun", "planet1", sweep(1.5, 12), "free");
  assertMeshFree(def, "planet1", "barrel", sweep(1.5, 12), "free");
  assertMeshFree(def, "planet3", "barrel", sweep(1.5, 12), "free");
});

test("第 413 種:下輪帶動 A 反向轉;旋緊螺帽 B,橡膠碟夾緊、徑向擴張,牽引力變大(不再打滑)", () => {
  const def = m413.default;
  const tight = turned(def, "rubberTight", 0, 1, "tight");
  const loose = turned(def, "rubberLoose", 0, 1, "loose");
  assert.ok(tight < 0 && loose < 0, "A 與下輪反向轉");
  assert.ok(Math.abs(tight) > Math.abs(loose), "旋緊後 A 被帶得更確實");
  const gap = (state) => def.pose(0, state).parts.plateR.position[0] - def.pose(0, state).parts.plateL.position[0];
  assert.ok(gap("tight") < gap("loose"), "旋緊螺帽,兩片金屬板夾近");
  const tip = (id) => Math.max(...def.parts.find((p) => p.id === id).profile.map(([r]) => r));
  assert.ok(tip("rubberTight") > tip("rubberLoose"), "橡膠碟被迫徑向擴張");
});

test("第 414 種:小齒輪 B 沿鍵條滑動、始終咬著渦線;A 朝一個方向越轉越慢,朝相反方向越轉越快", () => {
  const def = m414.default;
  const vs = sweep(m414.RANGE[1] * 0.99, 12, m414.RANGE[0]);
  const speeds = [];
  for (const v of vs) {
    const pose = def.pose(v);
    const r = m414.radiusAt(m414.contact(v));
    close(pose.parts.pinion.position[1], -r, "小齒輪在咬合處(沿軸滑到渦線上)");
    // A 的轉速 / B 的轉速 = B 的節圓半徑 / 咬合處的半徑
    const dv = 1e-4;
    const speed = Math.abs(def.pose(v + dv).parts.volute.angle - pose.parts.volute.angle) / dv;
    close(speed, m414.RB / r, "A 的轉速比", 1e-3);
    speeds.push(speed);
  }
  for (let i = 1; i < speeds.length; i++) assert.ok(speeds[i] < speeds[i - 1], "B 往前轉:咬合處往外移,A 越轉越慢(反過來就越轉越快)");
});

test("第 415 種:C 嚙合時槓桿往一邊擺就帶著輪 D 轉、擺回時 D 停住;改由 B 嚙合時 D 反轉", () => {
  const S = m415.SWING;
  const span = 2 * S;
  // C 嚙合:第一個行程(逆時針擺)帶著 D 轉過同樣的角度,第二個行程(擺回)D 不動
  const c0 = m415.motion(0, "C");
  const c1 = m415.motion(span * 0.999, "C");
  const c2 = m415.motion(span * 1.999, "C");
  close(c1.wheel - c0.wheel, c1.lever - c0.lever, "擺動中 D 與槓桿一起轉", 1e-6);
  assert.ok(c1.wheel > c0.wheel, "C 嚙合:D 逆時針轉");
  close(c2.wheel, c1.wheel, "擺回時 D 停住", 1e-2);
  // 一個完整往復,D 前進一個行程
  close(m415.motion(2 * span, "C").wheel - m415.motion(0, "C").wheel, span, "一個往復前進一個行程");
  // B 嚙合:反向
  const b = m415.motion(4 * span, "B").wheel - m415.motion(0, "B").wheel;
  close(b, -2 * span, "B 嚙合:D 順時針轉,兩個往復轉兩個行程");
  // 姿勢:作動中的棘爪隨槓桿轉,另一個被抬起
  const pose = m415.default.pose(0.1, "C").parts;
  close(pose.pawlC.angle, pose.lever.angle, "C 隨槓桿貼著輪緣");
  assert.notEqual(pose.pawlB.angle, pose.lever.angle, "B 被抬起");
});

// 板件的孔裡包著點 q 的那一個孔(局部座標)
const holeAround = (layers, q) => layers.flatMap((l) => l.solid.holes).find((h) => pointInPolygon(q, h));
// 圓柱附件沿 z 的範圍
const zRange = (piece, base = 0) => [base + (piece.at?.[2] ?? 0) - piece.length / 2, base + (piece.at?.[2] ?? 0) + piece.length / 2];
const overlapsZ = ([a0, a1], [b0, b1]) => a0 <= b1 + 1e-9 && b0 <= a1 + 1e-9;

test("第 412 種:三個小齒輪裝在 Y 形行星架的銷上;解鎖時行星架由插銷鎖在底座上不動,鎖定時插銷拔起、行星架隨整組轉", () => {
  const def = m412.default;
  const carrier = plateLayers(part(def, "carrier"));
  const base = plateLayers(part(def, "base"));
  const latch = part(def, "latch");
  const axleR = (id) => part(def, id).pieces.find((p) => p.kind === "cylinder").radius;
  for (const state of ["free", "locked"]) {
    for (const v of sweep(TAU, 8, 0.1)) {
      const p = def.pose(v, state).parts;
      const c = p.carrier.angle;
      if (state === "free") close(c, 0, "解鎖:行星架鎖在底座上不轉");
      else {
        close(c, p.sun.angle, "鎖定:行星架隨鼓頭轉");
        close(c, p.barrel.angle, "鎖定:行星架隨鼓輪轉");
      }
      for (let i = 1; i <= 3; i++) {
        const local = rot2(p[`planet${i}`].position, -c);
        const hole = holeAround(carrier, local);
        assert.ok(hole, `小齒輪 ${i} 的銷穿在行星架的孔裡`);
        const gap = edgeDistance(local, hole) - axleR(`planet${i}`);
        assert.ok(gap >= 0 && gap < 0.01, `小齒輪 ${i} 的銷和行星架的孔貼合(間隙 ${gap})`);
      }
      // 插銷:整根在行星架的孔裡;解鎖時插進底座的孔,鎖定時拔起、離開底座、跟著行星架走
      const [lx, ly, lz] = p.latch.position;
      const latchZ = [lz - latch.length / 2, lz + latch.length / 2];
      const inCarrier = holeAround(carrier, rot2([lx, ly], -c));
      assert.ok(inCarrier && overlapsZ(latchZ, [carrier[0].z0, carrier[0].z1]), "插銷穿在行星架的孔裡");
      assert.ok(edgeDistance(rot2([lx, ly], -c), inCarrier) - latch.radius < 0.01, "插銷和行星架的孔貼合");
      const baseLayer = base.find((l) => l.solid.holes.some((h) => pointInPolygon([lx, ly], h)));
      if (state === "free") {
        assert.ok(baseLayer && latchZ[0] < baseLayer.z1 - 0.02, "解鎖:插銷插進底座的孔裡");
        assert.ok(!inSolid([lx, ly], baseLayer.solid), "插銷在底座的孔裡,不是穿進底座的板");
      } else {
        for (const l of base) assert.ok(!overlapsZ(latchZ, [l.z0, l.z1]), "鎖定:插銷拔起,離開底座");
        close(lx, rot2(def.pose(0.1, "free").parts.latch.position, c)[0], "鎖定:插銷隨行星架公轉", 1e-9);
      }
    }
  }
});

test("第 412 種:兩個掣子鉸在底座的柱上,尖端靠在鼓輪的輪緣上;鼓輪順時針轉時掣子被輪緣的台階頂起再落下(擋住反轉)", () => {
  const def = m412.default;
  const rim = part(def, "barrel").pieces[0];
  const posts = part(def, "base").pieces.filter((p) => p.kind === "cylinder");
  for (const id of ["pawlTop", "pawlBottom"]) {
    const pawl = part(def, id);
    const at = def.pose(0, "free").parts[id].position;
    const post = posts.find((c) => Math.hypot(c.at[0] - at[0], c.at[1] - at[1]) < 1e-9);
    assert.ok(post, `${id} 鉸在底座的柱上`);
    const clearance = edgeDistance([0, 0], pawl.shape.holes[0]) - post.radius;
    assert.ok(clearance >= 0 && clearance < 0.01, `${id} 的孔套在柱上(間隙 ${clearance})`);
    assert.ok(overlapsZ([at[2] - pawl.thickness / 2, at[2] + pawl.thickness / 2], zRange(post)), `${id} 在柱的高度範圍裡`);
    // 鼓頭逆時針轉 6π → 鼓輪順時針轉一圈
    const angles = [];
    for (const v of sweep(6 * Math.PI, 360)) {
      const p = def.pose(v, "free").parts;
      const placed = placeOutline(pawl.shape.outline, p[id].position, p[id].angle);
      const wall = placeOutline(rim.shape.outline, [0, 0], p.barrel.angle);
      assert.ok(penetrationDepth(placed, wall) < 0.002, `${id} 不穿進輪緣(主動量 ${v})`);
      assert.ok(polyGap(placed, wall) < 0.004, `${id} 的尖端靠在輪緣上(主動量 ${v})`);
      angles.push(p[id].angle);
    }
    // 落下:連續幾步轉角變大(台階的角沿平的尖端滑過去);其餘各步只能被斜面頂起(轉角不變大)
    const drops = [];
    for (let i = 1; i < angles.length; i++) {
      const d = angles[i] - angles[i - 1];
      if (d > 1e-6) {
        if (angles[i - 1] - angles[i - 2] > 1e-6) drops[drops.length - 1] += d;
        else drops.push(d);
      }
    }
    assert.equal(drops.length, 2, `${id} 一圈落下兩次(輪緣有兩個台階):${drops.map((d) => d.toFixed(4))}`);
    for (const d of drops) assert.ok(d > 0.01, `${id} 過台階時落下的量 ${d}`);
  }
});

// 旋轉體剖面([半徑, 沿軸])在沿軸位置 a 的表面半徑(最大半徑)
function surfaceRadius(profile, a) {
  let best = -Infinity;
  for (let i = 0; i < profile.length; i++) {
    const [r1, a1] = profile[i];
    const [r2, a2] = profile[(i + 1) % profile.length];
    if (a1 === a2) {
      if (Math.abs(a - a1) < 1e-12) best = Math.max(best, r1, r2);
      continue;
    }
    const f = (a - a1) / (a2 - a1);
    if (f >= -1e-12 && f <= 1 + 1e-12) best = Math.max(best, r1 + (r2 - r1) * f);
  }
  return best;
}

test("第 413 種:V 形邊緣的橡膠碟兩側斜面貼著溝面——放鬆時輕貼、尖端離溝底留空;旋緊後斜面壓進溝面、尖端仍不頂溝底", () => {
  const def = m413.default;
  const lower = part(def, "lower");
  const groove = lower.pieces[0].profile;
  const D = dist(lower.center, part(def, "rubberLoose").center);
  const gap = (id, a) => D - surfaceRadius(groove, a) - surfaceRadius(part(def, id).profile, a);
  // 放鬆:斜面貼著溝面(間隙 0),尖端離溝底
  for (const a of [-0.18, -0.12, -0.06, 0.06, 0.12, 0.18]) close(gap("rubberLoose", a), 0, `放鬆時斜面貼著溝面(沿軸 ${a})`, 1e-6);
  assert.ok(gap("rubberLoose", 0) > 0.01, "放鬆時尖端離溝底留空");
  // 旋緊:橡膠碟徑向擴張,斜面壓進溝面(以重疊量表示橡膠的壓縮),尖端仍不頂溝底
  for (const a of [-0.1, -0.05, 0.05, 0.1]) assert.ok(gap("rubberTight", a) < -0.02, `旋緊時斜面壓進溝面(沿軸 ${a}:${gap("rubberTight", a)})`);
  assert.ok(gap("rubberTight", 0) > 0, "旋緊時尖端仍不頂溝底");
  // 兩個狀態看得出差別:金屬板夾近、螺帽 B 轉進
  const plateGap = (state) => def.pose(0, state).parts.plateR.position[0] - def.pose(0, state).parts.plateL.position[0];
  assert.ok(plateGap("loose") - plateGap("tight") > 0.1, "旋緊後兩片金屬板明顯夾近");
  const nutOff = (state) => def.pose(0, state).parts.nut.position[0] - def.pose(0, state).parts.plateR.position[0];
  assert.ok(nutOff("loose") - nutOff("tight") > 0.1, "放鬆時螺帽 B 退出一段");
  assert.notEqual(part(def, "rubberLoose").arrow, false, "放鬆時 A 也有轉向箭頭(轉得慢)");
  // 下輪套在自己的軸上:孔和軸同徑
  close(Math.min(...groove.map(([r]) => r)), lower.pieces.find((p) => p.kind === "cylinder").radius, "下輪的孔和軸同徑");
});

test("第 414 種:渦形盤的齒照小齒輪滾過的量排:每個姿勢小齒輪的齒都落在渦形齒之間、不撞齒,而且咬著(間隙接近 0)", () => {
  const def = m414.default;
  const pinion = part(def, "pinion");
  const teeth = part(def, "volute").pieces.filter((p) => p.kind === "box");
  const [u, w] = planeBasis(pinion.axis);
  for (const v of sweep(m414.RANGE[1] * 0.995, 96, 0.05)) {
    const p = def.pose(v).parts;
    const c = p.pinion.position;
    const r = -c[1];
    // 小齒輪的齒形投影到它自己的平面(世界 x–z)
    const prof = gearProfile(pinion).map((q) => {
      const [x, y] = rot2(q, p.pinion.angle);
      const q3 = add(c, add(scale(u, x), scale(w, y)));
      return [q3[0], q3[2]];
    });
    let nearest = Infinity;
    for (const tooth of teeth) {
      const [tx, ty] = rot2([tooth.at[0], tooth.at[1]], p.volute.angle);
      if (Math.abs(tx) > 0.45 || Math.abs(-ty - r) > 0.2) continue;
      const hw = (tooth.size[1] / 2) * Math.abs(Math.cos(tooth.angle + p.volute.angle));
      const z0 = tooth.at[2] - tooth.size[2] / 2;
      const z1 = tooth.at[2] + tooth.size[2] / 2;
      const rect = [[tx - hw, z0], [tx + hw, z0], [tx + hw, z1], [tx - hw, z1]];
      assert.ok(penetrationDepth(prof, rect) < 0.003, `主動量 ${v}:小齒輪的齒撞上渦形齒(x ${tx.toFixed(3)})`);
      nearest = Math.min(nearest, polyGap(prof, rect));
    }
    assert.ok(nearest < 0.01, `主動量 ${v}:小齒輪咬著渦形齒(最近的間隙 ${nearest})`);
  }
});

test("第 414 種:渦線約一圈半(原圖);輪轂接著輻條,渦形盤的軸與小齒輪的軸都有軸承托著", () => {
  const def = m414.default;
  assert.ok(m414.SPAN >= 1.5 * TAU && m414.SPAN <= 1.8 * TAU, "渦線約一圈半多");
  const volute = part(def, "volute");
  const hub = volute.pieces.find((p) => p.kind === "cylinder");
  const spokes = plateLayers(volute).filter((l) => inSolid([0, 0], l.solid));
  assert.ok(spokes.some((l) => overlapsZ([l.z0, l.z1], zRange(hub))), "輪轂接著輻條");
  const frame = plateLayers(part(def, "frame"));
  const seat = frame.find((l) => l.solid.holes.some((h) => pointInPolygon([0, 0], h)));
  assert.ok(seat && overlapsZ([seat.z0, seat.z1], zRange(hub)), "渦形盤的輪轂穿在軸承座的孔裡");
  const seatGap = edgeDistance([0, 0], holeAround(frame, [0, 0])) - hub.radius;
  assert.ok(seatGap >= 0 && seatGap < 0.01, `輪轂和軸承孔貼合(間隙 ${seatGap})`);
  const shaft = part(def, "shaft").pieces.find((p) => p.kind === "cylinder");
  const eyes = part(def, "frame").pieces.filter((p) => p.kind === "lathe");
  assert.equal(eyes.length, 2, "小齒輪的軸兩端各一個軸承");
  for (const eye of eyes) {
    assert.deepEqual(eye.axis, [0, 1, 0], "軸承的孔沿小齒輪的軸");
    const bore = Math.min(...eye.profile.map(([r]) => r));
    assert.ok(bore - shaft.radius >= 0 && bore - shaft.radius < 0.01, "軸和軸承孔貼合");
    close(eye.at[2], def.pose(0).parts.shaft.position[2], "軸承在軸的高度上");
    assert.ok(Math.abs(eye.at[1]) < shaft.length / 2, "軸穿過軸承");
  }
});

test("第 415 種:槓桿 A 是一件、套在輪 D 的軸上;棘爪 B、C 的鉸銷與曲柄 E 的銷都立在槓桿上", () => {
  const def = m415.default;
  const lever = part(def, "lever");
  const layers = plateLayers(lever);
  const axle = part(def, "wheel").pieces.find((p) => p.kind === "cylinder");
  const hubHole = holeAround(layers, [0, 0]);
  assert.ok(hubHole, "槓桿中央有套在輪軸上的輪轂孔");
  const fit = edgeDistance([0, 0], hubHole) - axle.radius;
  assert.ok(fit >= 0 && fit < 0.01, `輪轂孔和輪軸貼合(間隙 ${fit})`);
  const pins = lever.pieces.filter((p) => p.kind === "cylinder");
  assert.ok(pins.length >= 4, "兩個棘爪的鉸銷、曲柄 E 的銷、拉桿的銷");
  for (const pin of pins) {
    const on = layers.find((l) => inSolid([pin.at[0], pin.at[1]], l.solid) && overlapsZ([l.z0, l.z1], zRange(pin)));
    assert.ok(on, `銷〔${pin.at[0]}, ${pin.at[1]}〕立在槓桿的板上`);
  }
  for (const id of ["pawlB", "pawlC"]) {
    const p0 = rot2(def.pose(0, "C").parts[id].position, -def.pose(0, "C").parts.lever.angle);
    assert.ok(pins.some((pin) => Math.hypot(pin.at[0] - p0[0], pin.at[1] - p0[1]) < 1e-9), `${id} 鉸在槓桿的銷上`);
  }
});

test("第 415 種:作動的棘爪尖端全程貼著輪 D 的輪緣內側、不穿入,被抬起的棘爪離開輪緣;拉桿與槓桿都在輪緣前面、輪緣以內", () => {
  const def = m415.default;
  const wheel = part(def, "wheel");
  const rimIn = Math.min(...wheel.pieces[0].shape.holes[0].map(([x, y]) => Math.hypot(x, y)));
  const rimFront = wheel.pieces[0].thickness / 2;
  const span = 2 * m415.SWING;
  for (const state of ["C", "B"]) {
    const active = `pawl${state}`;
    const idle = state === "C" ? "pawlB" : "pawlC";
    for (const v of sweep(2 * span, 16)) {
      const p = def.pose(v, state).parts;
      const reach = (id) => Math.max(...placeOutline(part(def, id).shape.outline, p[id].position, p[id].angle).map(([x, y]) => Math.hypot(x, y)));
      assert.ok(reach(active) <= rimIn + 1e-6, `${active} 不穿進輪緣(主動量 ${v})`);
      assert.ok(rimIn - reach(active) < 0.002, `${active} 的尖端貼著輪緣內側(主動量 ${v},離 ${rimIn - reach(active)})`);
      assert.ok(reach(idle) < rimIn - 0.02, `${idle} 被抬起、離開輪緣(主動量 ${v})`);
      assert.ok(p.rod.from[2] - part(def, "rod").thickness / 2 >= rimFront, "拉桿在輪緣前面");
    }
  }
  for (const l of plateLayers(part(def, "lever"))) for (const [x, y] of l.solid.outline) assert.ok(Math.hypot(x, y) < rimIn, "槓桿整個在輪緣以內");
  assert.ok(!wheel.pieces.some((p, i) => i > 0 && p.kind === "plate" && p.shape.holes.length), "輪 D 只有一圈輪緣(沒有內輪緣)");
});

test("第 415 種:一根繩從棘爪 B 經曲柄 E 到棘爪 C,換狀態、整個往復長度都不變;被抬起那側拉直,作動那側鬆垂", () => {
  const def = m415.default;
  const span = 2 * m415.SWING;
  const length = (pts) => pts.reduce((s, q, i) => (i ? s + dist(q, pts[i - 1]) : 0), 0);
  const L0 = length(def.pose(0, "C").paths.cord.points);
  for (const state of ["C", "B"]) {
    for (const v of sweep(2 * span, 8)) {
      const pose = def.pose(v, state);
      const pts = pose.paths.cord.points;
      close(length(pts), L0, `繩長不變(${state},主動量 ${v})`, 1e-4);
      // 曲柄 E 的末端(外形離銷最遠的角)
      const far = part(def, "crank").shape.outline.reduce((b, q) => (Math.hypot(...q) > Math.hypot(...b) ? q : b));
      const e = [...rot2(far, pose.parts.crank.angle).map((x, i) => x + pose.parts.crank.position[i]), pose.parts.crank.position[2]];
      const k = pts.map((q) => dist(q, e)).reduce((best, d, i, ds) => (d < ds[best] ? i : best), 0);
      assert.ok(k > 0 && k < pts.length - 1 && dist(pts[k], e) < 0.05, "繩繫在曲柄 E 的末端");
      const taut = state === "C" ? pts.slice(0, k + 1) : pts.slice(k);
      const slack = state === "C" ? pts.slice(k) : pts.slice(0, k + 1);
      close(length(taut), dist(taut[0], taut.at(-1)), "被抬起那側的繩拉直", 1e-6);
      assert.ok(length(slack) - dist(slack[0], slack.at(-1)) > 0.02, "作動那側的繩鬆垂");
    }
  }
});

test("第 416 種:螺旋彈簧 A 把曲柄 B 推向與死點成直角的位置", () => {
  assert.equal(m416.DEAD.length, 2, "曲柄轉一圈有兩個死點");
  const off = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  for (const d of m416.DEAD) close(off(m416.REST, d), Math.PI / 2, "彈簧放鬆的位置與死點成直角", 0.05);
  // 在死點上彈簧推著曲柄離開死點,推向放鬆的位置
  for (const d of m416.DEAD) {
    const tq = m416.springTorque(d);
    assert.ok(Math.abs(tq) > 0.9, "在死點上彈簧的力矩最大");
    const toward = Math.atan2(Math.sin(m416.REST - d), Math.cos(m416.REST - d));
    assert.ok(Math.sign(tq) === Math.sign(toward), "力矩朝放鬆的位置");
  }
  // 連桿接著踏板,曲柄轉整圈
  for (const t of sweep(2 * Math.PI, 36)) {
    const pose = m416.default.pose(t).parts;
    close(Math.hypot(pose.rod.to[0] - pose.rod.from[0], pose.rod.to[1] - pose.rod.from[1]), m416.ROD, "連桿長不變", 1e-6);
  }
});

test("第 416 種:曲柄軸在機架的軸承孔裡,踏板鉸在機架的支點銷上、不碰地板,連桿套在兩端的銷上", () => {
  const def = m416.default;
  const frame = part(def, "frame");
  const holeRadius = (hole) => Math.hypot(hole[0][0] - hole.reduce((s, p) => s + p[0], 0) / hole.length, hole[0][1] - hole.reduce((s, p) => s + p[1], 0) / hole.length);
  const zRange = (piece, base = 0) => {
    const z = (piece.at?.[2] ?? 0) + base;
    const half = (piece.kind === "cylinder" ? piece.length : piece.thickness) / 2;
    return [z - half, z + half];
  };
  // 曲柄軸穿過機架板上的軸承孔(孔只比軸大一點),軸從輪轂伸到機架板後面
  const bearing = frame.pieces.find((p) => p.kind === "plate" && p.shape.holes?.length);
  const shaft = part(def, "crank").pieces.find((p) => p.kind === "cylinder" && (p.at?.[2] ?? 0) < -0.3);
  const bore = holeRadius(bearing.shape.holes[0]);
  assert.ok(shaft.radius < bore && bore - shaft.radius < 0.02, `曲柄軸(半徑 ${shaft.radius})在機架的軸承孔(半徑 ${bore})裡`);
  const [b0, b1] = zRange(bearing);
  const [s0, s1] = zRange(shaft);
  assert.ok(s0 < b0 && s1 > b1 && s1 > -0.15, "軸從輪轂穿過整塊機架板");
  // 踏板的支點銷穿過踏板的孔
  const treadle = part(def, "treadle");
  const pivotPin = frame.pieces.find((p) => p.kind === "cylinder" && Math.hypot(p.at[0] - m416.TREADLE_PIVOT[0], p.at[1] - m416.TREADLE_PIVOT[1]) < 1e-9);
  const treadleBore = holeRadius(treadle.shape.holes[0]);
  assert.ok(pivotPin.radius < treadleBore && treadleBore - pivotPin.radius < 0.02, "支點銷在踏板的孔裡");
  assert.ok(treadle.shape.outline.every((p) => Math.hypot(p[0], p[1]) > treadleBore), "踏板的孔整個在外形裡");
  for (const t of sweep(2 * Math.PI, 48)) {
    const pose = def.pose(t).parts;
    const [p0, p1] = zRange(pivotPin);
    const [t0, t1] = zRange(treadle, pose.treadle.position[2]);
    assert.ok(p0 < t0 && p1 > t1, "支點銷穿過踏板");
    // 踏板的腳端全程在地板上方
    const foot = add(pose.treadle.position, [...rot2([-m416.FOOT, 0], pose.treadle.angle), 0]);
    assert.ok(foot[1] - 0.05 > m416.FLOOR_TOP, `踏板的腳端(y ${foot[1].toFixed(2)})不碰地板(頂 ${m416.FLOOR_TOP})`);
    // 連桿在踏板前面一層、套在踏板的銷與曲柄銷上
    const rod = part(def, "rod");
    const [r0, r1] = [pose.rod.from[2] - rod.thickness / 2, pose.rod.from[2] + rod.thickness / 2];
    assert.ok(r0 >= t1 - 1e-9, "連桿不和踏板重疊");
    const treadlePin = treadle.pieces.find((p) => p.kind === "cylinder");
    const [q0, q1] = zRange(treadlePin, pose.treadle.position[2]);
    assert.ok(q0 < r0 && q1 > r1, "踏板的銷穿過連桿");
    const crankPin = part(def, "crank").pieces.find((p) => p.kind === "cylinder" && Math.abs(p.at[0] - 0.55) < 1e-9);
    const [c0, c1] = zRange(crankPin);
    assert.ok(c0 < r0 && c1 > r1, "曲柄銷穿過連桿");
  }
});

test("第 417 種:彎軸轉動,滑塊 C 沿直線往復;軸轉半圈後滑塊到另一端(原圖虛線)", () => {
  const xs = sweep(2 * Math.PI, 48).map((t) => {
    const s = m417.solve(t);
    close(s.C[1], m417.SLIDE_Y, "滑塊不離開底座");
    close(s.C[2], 0, "滑塊走直線");
    // 桿 B 與插座(彎端)成直角
    close(s.d[0] * s.u[0] + s.d[1] * s.u[1] + s.d[2] * s.u[2], 0, "桿 B 垂直於彎端");
    return s.C[0];
  });
  const [start, half] = [m417.solve(0).C[0], m417.solve(Math.PI).C[0]];
  close(Math.max(...xs), start, "實線位置在一端", 1e-6);
  close(Math.min(...xs), half, "轉半圈後在另一端", 1e-6);
  assert.ok(start - half > 1, "往復行程明顯");
  close(m417.solve(2 * Math.PI).C[0], start, "轉一圈回到原處");
});

test("第 417 種:桿 B 長度不變、裝在插座上;下端在滑塊 C 的套筒裡進出,套筒繞滑塊上的球心擺", () => {
  const def = m417.default;
  const rodPiece = part(def, "socket").pieces.find((p) => p.kind === "cylinder");
  close(rodPiece.at[0] + rodPiece.length / 2, m417.ROD_B, "桿 B 從插座伸出固定的長度");
  const sleeve = part(def, "sleeve");
  const ball = sleeve.pieces.find((p) => p.kind === "sphere");
  const reach = [];
  for (const t of sweep(2 * Math.PI, 72)) {
    const s = m417.solve(t);
    const pose = def.pose(t).parts;
    const end = add(s.S, scale(s.d, m417.ROD_B)); // 桿 B 的下端
    close(dist(pose.sleeve.position, s.C), 0, "套筒的球心在滑塊 C 上", 1e-9);
    const axis = quatRotate(pose.sleeve.rotation, [0, 0, 1]);
    close(dot(axis, s.d), 1, "套筒與桿 B 同軸", 1e-6);
    const along = dot(sub(end, s.C), s.d); // 下端在球心上方多遠(負值)
    assert.ok(along < -ball.radius, `桿 B 的下端(離球心 ${(-along).toFixed(2)})不伸進球頭`);
    assert.ok(along > -m417.SLEEVE, `桿 B 的下端在套筒(長 ${m417.SLEEVE})裡`);
    reach.push(-along);
  }
  assert.ok(Math.max(...reach) - Math.min(...reach) > 0.8, "桿在套筒裡進出的量就是以前桿長的變化");
});

test("第 418 種:閥 A 接在桿 B 的下端、在閥座上水平滑動;上端的銷在垂直溝槽裡滑;滾子 C 在兩個弧形件 D 之間", () => {
  const def = m418.default;
  const hanger = part(def, "hanger");
  const head = hanger.pieces.find((p) => p.kind === "plate" && p.shape.holes?.length && p.shape.holes[0].length === 4);
  const slot = head.shape.holes[0];
  const slotX = [Math.min(...slot.map((p) => p[0])), Math.max(...slot.map((p) => p[0]))];
  const slotY = [Math.min(...slot.map((p) => p[1])), Math.max(...slot.map((p) => p[1]))];
  const band = hanger.pieces.find((p) => p.kind === "plate" && p.shape.holes?.length && p.shape.holes[0].length > 4);
  const arcSlot = band.shape.holes[0];
  const upperPin = part(def, "rod").pieces.find((p) => p.kind === "cylinder" && Math.abs(p.at[1]) < 1e-9);
  const tops = [];
  const xs = [];
  for (const v of sweep(4 * m418.SWING, 48)) {
    const pose = def.pose(v).parts;
    const phi = pose.rod.angle;
    const { T, C, P } = m418.linkage(phi);
    close(dist(pose.rod.position, T), 0, "桿 B 繞上端的銷擺", 1e-9);
    // 「Valve A is attached to lower end of rod B, and free to slide horizontally on valve-seat」
    close(P[1], m418.SEAT_Y, "閥的銷高度不變:閥貼著閥座水平滑動");
    close(pose.valve.position[0], P[0], "閥跟著桿 B 的下端走");
    close(dist(T, P), m418.ROD, "桿 B 長度不變", 1e-9);
    // 「Upper end of rod B is attached to a pin which slides in vertical slots」
    close(T[0], 0, "上端的銷只上下滑、x 不變");
    assert.ok(T[1] - upperPin.radius > slotY[0] && T[1] + upperPin.radius < slotY[1], "上端的銷在垂直溝槽的範圍裡");
    assert.ok(slotX[1] - slotX[0] - 2 * upperPin.radius < 0.02, "溝槽只比銷寬一點");
    tops.push(T[1]);
    // 「a roller C, attached to the said rod, slides in two suspended … arcs D」:滾子在桿的中點,貼著下面那片弧滾、不碰上面那片
    close(dist(C, scale(add(T, P), 0.5)), 0, "滾子在桿 B 的中點", 1e-9);
    const r = dist(C, m418.ARC_CENTER);
    close(r - m418.ROLLER_R, m418.SLOT[0], "滾子貼著下面的弧(間隙 0)", 1e-9);
    assert.ok(r + m418.ROLLER_R < m418.SLOT[1], "滾子不碰上面的弧");
    assert.ok(Math.abs(Math.atan2(C[0] - m418.ARC_CENTER[0], C[1] - m418.ARC_CENTER[1])) < m418.SLOT_SPAN, "滾子沒跑出弧形溝的兩端");
    xs.push(P[0]);
  }
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.8, "閥來回滑動");
  assert.ok(Math.max(...tops) - Math.min(...tops) > 0.02, "上端的銷真的在溝裡上下滑");
  // 弧形溝中間高、兩端低(原圖與網站的動畫)
  const bearing = (p) => Math.abs(Math.atan2(p[0] - m418.ARC_CENTER[0], p[1] - m418.ARC_CENTER[1])); // 從弧心看、離正上方的角
  const mid = arcSlot.filter((p) => bearing(p) < 0.05);
  const ends = arcSlot.filter((p) => bearing(p) > 0.9 * Math.max(...arcSlot.map(bearing)));
  const ys = (pts) => pts.map((p) => p[1]);
  assert.ok(Math.min(...ys(mid)) > Math.min(...ys(ends)) + 0.05 && Math.max(...ys(mid)) > Math.max(...ys(ends)) + 0.05, "弧形溝的兩條弧都是中間高、兩端低");
  // 滾子在弧上滾動不打滑:接觸點上滾子的材料速度為 0
  const dv = 1e-4;
  for (const v of sweep(4 * m418.SWING, 12, 0.01)) {
    const a = def.pose(v).parts.roller;
    const b = def.pose(v + dv).parts.roller;
    const velocity = scale(sub(b.position, a.position), 1 / dv);
    const omega = (b.angle - a.angle) / dv;
    const toCenter = sub(m418.ARC_CENTER, a.position);
    const q = scale(toCenter, m418.ROLLER_R / Math.hypot(toCenter[0], toCenter[1])); // 滾子中心到接觸點
    const atContact = add(velocity, [-omega * q[1], omega * q[0], 0]);
    assert.ok(Math.hypot(atContact[0], atContact[1]) < 1e-3 * Math.hypot(velocity[0], velocity[1]) + 1e-6, `主動量 ${v.toFixed(2)}:滾子在接觸點不打滑`);
  }
});

test("第 419 種:輪 A 轉動,輪 B 來回擺動;皮帶 C、D 拉著立柱,搖籃在弧形搖腳 E 上來回搖", () => {
  const rs = sweep(2 * Math.PI, 72).map((a) => m419.rock(a));
  const betas = rs.map((r) => r.beta);
  assert.ok(Math.max(...betas) - Math.min(...betas) < Math.PI, "B 不轉整圈,只是擺動");
  const gammas = rs.map((r) => r.gamma);
  assert.ok(Math.max(...gammas) > 0.1 && Math.min(...gammas) < -0.1, "搖籃往兩邊搖");
  const left = rs[0].left.length;
  const right = rs[0].right.length;
  for (const r of rs) {
    close(r.left.length, left, "皮帶 C 不伸縮", 1e-6);
    close(r.right.length, right, "皮帶 D 不伸縮(兩條皮帶都繃著)", right * 0.003);
  }
  // B 朝一邊擺時搖籃跟著朝同一邊轉(皮帶在 B 頂端)
  for (let i = 1; i < rs.length; i++) {
    const db = rs[i].beta - rs[i - 1].beta;
    const dg = rs[i].gamma - rs[i - 1].gamma;
    if (Math.abs(db) > 0.01) assert.ok(Math.sign(db) === Math.sign(dg), "搖籃隨 B 擺動");
  }
});

test("第 419 種:輪 A 在半徑較大的輪 B 正下方、兩輪不重疊,A 全程不碰搖籃;B 的頂端與立柱頂同高;支架落在地板上", () => {
  const def = m419.default;
  const gapAB = dist(m419.A.center, m419.B.center) - m419.A.radius - m419.B.radius;
  assert.ok(gapAB > 0.05, `兩輪分開(間隙 ${gapAB.toFixed(2)})`);
  assert.ok(m419.B.radius > 1.5 * m419.A.radius, "B 的半徑比 A 大得多(原圖約 1.9 倍)");
  close(m419.A.center[0], m419.B.center[0], "A 在 B 的正下方");
  close(m419.B.center[1] + m419.B.radius, m419.ROCKER, "B 的頂端與立柱頂(皮帶的高度)同高", 1e-9);
  const wheelA = circlePolygon(m419.A.center, m419.A.radius, 48);
  for (const alpha of sweep(2 * Math.PI, 72)) {
    const r = m419.rock(alpha);
    const bed = m419.rockerBand.map((p) => m419.cradle(r.gamma, p).slice(0, 2));
    const gap = polyGap(wheelA, bed);
    assert.ok(gap > 0.02, `輪 A 的下緣不碰搖籃的床(間隙 ${gap.toFixed(3)})`);
  }
  const stand = part(def, "stand").pieces.find((p) => p.kind === "plate");
  const bottom = Math.min(...stand.shape.outline.map((p) => p[1])) + (stand.at?.[1] ?? 0);
  assert.ok(bottom <= 0, "支架的板伸到地板裡");
});

test("第 420 種:錘子敲到鐘之後,下方的彈簧把它抬離鐘面,不貼著鐘", () => {
  const phases = sweep(1, 200).map((v) => ({ v, ...m420.hammer(v) }));
  const strikes = phases.filter((p) => p.phase === "敲擊鐘面");
  assert.ok(strikes.length > 0, "有敲擊的時刻");
  for (const p of strikes) close(m420.gap(p.angle), 0, "敲擊時錘頭碰到鐘面", 1e-9);
  for (const p of phases) assert.ok(m420.gap(p.angle) > -1e-9, "錘頭不會撞進鐘裡");
  const after = m420.hammer(0.9);
  assert.ok(m420.gap(after.angle) > 0.05, "敲擊之後錘頭離開鐘面");
  close(after.angle, m420.REST, "停在彈簧撐住的位置");
});

test("第 420 種:錘柄下方是一片片彈簧:根部夾在底座上,尖端靜止時托著錘柄、敲擊時被壓彎、拉開時錘柄離開它;拉繩長度不變", () => {
  const def = m420.default;
  const hammer = part(def, "hammer");
  const spring = part(def, "spring");
  const tipGap = (v) => {
    const pose = def.pose(v);
    const arm = placeOutline(hammer.shape.outline, [0, 0], pose.parts.hammer.angle);
    const pts = pose.paths.spring.points;
    const tip = pts[pts.length - 1];
    return { gap: edgeDistance(tip, arm) - spring.radius, tip, pts, arm };
  };
  const rest = tipGap(0.9);
  close(rest.gap, 0, "靜止時彈簧的尖端托著錘柄", 0.01);
  const pulled = tipGap(0.35);
  assert.ok(pulled.gap > 0.05, `拉開時錘柄離開彈簧的尖端(間隙 ${pulled.gap.toFixed(2)})`);
  close(dist(pulled.tip, rest.tip), 0, "錘柄離開後彈簧回到自由的形狀", 1e-9);
  const strike = tipGap(0.47);
  close(strike.gap, 0, "敲擊時尖端仍貼著錘柄", 0.01);
  assert.ok(strike.tip[1] < rest.tip[1] - 0.02, "敲擊時彈簧被壓到靜止位置以下(壓彎)");
  for (const v of sweep(1, 100)) {
    const { pts, arm } = tipGap(v);
    close(dist(pts[0], m420.SPRING_ROOT), 0, "彈簧的根部固定在底座的夾塊上", 1e-9);
    for (const p of pts) {
      assert.ok(!pointInPolygon(p, arm) && edgeDistance(p, arm) > spring.radius - 1e-6, `主動量 ${v.toFixed(2)}:彈簧不穿進錘柄`);
    }
  }
  // 拉繩:長度不變,拉開時下端(手拉的地方)跟著左臂端往下
  const wire = (v) => def.pose(v).paths.wire.points;
  const length = (pts) => pts.slice(1).reduce((s, p, i) => s + dist(p, pts[i]), 0);
  for (const v of sweep(1, 50)) close(length(wire(v)), m420.WIRE, "拉繩長度不變", 1e-9);
  assert.ok(wire(0.35).at(-1)[1] < wire(0.9).at(-1)[1] - 0.3, "拉開時繩的下端往下移");
  // 錘柄的樞軸孔整個在外形裡(支點銷穿過它)
  const hole = hammer.shape.holes[0];
  assert.ok(hole.every((p) => pointInPolygon(p, hammer.shape.outline)), "樞軸孔在錘柄的輪轂裡");
});

test("第 421 種:筒狀引擎:筒管使活塞上側的有效面積大減;連桿在筒管裡接活塞;高壓蒸汽先推上側,再排進下側膨脹", () => {
  assert.ok(m421.AREA.upper / m421.AREA.lower < 0.8, "「活塞上側的有效面積因筒管而大幅減少」:上側不到下側的八成");
  const def = m421.default;
  const rod = part(def, "rod");
  const inner = m421.TRUNK - m421.TRUNK_WALL; // 筒管內半徑
  for (const t of sweep(2 * Math.PI, 48)) {
    const pose = def.pose(t);
    const down = m421.downward(t);
    // 活塞往下走時,上側有新蒸汽、下側排汽;往上走時,蒸汽在下側(由上側轉來)
    if (down) {
      assert.ok(pose.parts.steamUp.level > 0 || t % Math.PI < 1e-9, "下行:上側有蒸汽");
      assert.equal(pose.parts.steamDown.level, 0, "下行:下側排汽");
    } else assert.ok(pose.parts.steamDown.level >= 0 && pose.flows.length === 1, "上行:蒸汽經轉汽管進下側");
    // 「連桿在筒管下端直接與活塞相連」:桿的下端在活塞上,整根桿都在筒管的內壁之內(筒管頂端的高度是最斜的地方)
    const { from, to } = pose.parts.rod;
    close(to[1], pose.parts.piston.position[1], "連桿直接接活塞");
    const top = pose.parts.trunk.position[1] + m421.TRUNK_LEN;
    const xAtTop = to[0] + ((from[0] - to[0]) * (top - to[1])) / (from[1] - to[1]);
    assert.ok(Math.abs(xAtTop) + rod.width / 2 < inner, `主動量 ${t.toFixed(2)}:連桿在筒管頂的橫向偏移 ${Math.abs(xAtTop).toFixed(3)} 加半寬仍在內半徑 ${inner} 之內`);
    assert.ok(Math.abs(from[2]) + rod.thickness / 2 < inner && Math.abs(to[2]) + rod.thickness / 2 < inner, "連桿的深度在筒管內半徑之內");
  }
  // 汽缸剖掉前半(z > 0):三條汽管都在留下的後半,支管的端頭接在汽缸後半的外壁上
  const frame = part(def, "frame");
  const pipes = frame.pieces.filter((p) => p.role === "pipe" || p.role === "branch");
  assert.ok(pipes.length >= 6, "進汽、轉汽、排汽三條汽管");
  for (const p of pipes) assert.ok(pieceBox(p).hi[2] <= 0, "汽管不在剖掉的前半");
  const outer = m421.CYL.radius + WALL;
  const branches = frame.pieces.filter((p) => p.role === "branch");
  assert.equal(branches.length, 4, "進汽一根、轉汽兩根、排汽一根支管接到汽缸");
  for (const b of branches) {
    const { lo, hi } = pieceBox(b);
    const xEnd = lo[0] > 0 ? lo[0] : hi[0];
    close(Math.hypot(xEnd, (lo[2] + hi[2]) / 2), outer, "支管的端頭在汽缸的外壁上", 0.03);
  }
});

test("第 422 種:擺動活塞:曲柄轉一圈,活塞 B 繞搖臂軸 C 來回擺一次;滑閥 D 輪流把蒸汽送到推它的那一側", () => {
  const phis = sweep(2 * Math.PI, 288);
  const psis = phis.map((p) => m422.vane(p));
  const [lo, hi] = [Math.min(...psis), Math.max(...psis)];
  assert.ok(hi < m422.HALF && lo > -m422.HALF, "活塞在扇形汽缸裡擺動");
  assert.ok(hi - lo > 0.5, "擺幅明顯");
  // 兩條汽道各走自己那一側(左口通左端、右口通右端),互不相交
  const [left, right] = [1, -1].map((s) => thickLine(m422.passage(s), m422.PASSAGE_W));
  assert.ok(m422.passage(1).every(([x]) => x < 0) && m422.passage(-1).every(([x]) => x > 0), "汽道各走自己那一側");
  assert.ok(polyGap(left, right) > 0.05, "兩條汽道不相交");
  const step = phis[1] - phis[0];
  for (const phi of phis) {
    // 閥動由接觸算:反向槓桿上端的銷一直在叉架兩指之間,滑閥只在銷頂著叉指時才動
    const u = m422.pusherX(phi);
    const yoke = m422.valveAt(phi) + m422.YOKE0;
    assert.ok(Math.abs(u - yoke) <= m422.GAP / 2 + 1e-9, `主動量 ${phi.toFixed(2)}:銷在兩根叉指之間`);
    if (Math.abs(m422.valveAt(phi) - m422.valveAt(phi - step)) > 1e-9) {
      const touching = (p) => m422.GAP / 2 - Math.abs(m422.pusherX(p) - m422.valveAt(p) - m422.YOKE0) < 1e-6;
      assert.ok(touching(phi) || touching(phi - step), `主動量 ${phi.toFixed(2)}:滑閥剛被推過,銷正頂著叉指`);
    }
    // 反向槓桿:撥臂的銷往哪邊走,槓桿上端就往另一邊走
    const tip = m422.tipX(phi);
    if (Math.abs(tip) > 0.05) assert.ok(Math.sign(u) === -Math.sign(tip), `主動量 ${phi.toFixed(2)}:槓桿上端與撥臂銷在支點的兩側`);
    // 「蒸汽經滑閥輪流引進汽缸、作用在活塞的一側或另一側」:行程中段,開著的口接的那一端進汽,推活塞往它正在擺的方向;
    // 另一口被滑閥蓋住,那一端排汽
    const side = m422.admitting(phi);
    const ahead = m422.vane(phi + 0.01) - m422.vane(phi);
    const psi = m422.vane(phi);
    // 撥桿式閥動在行程的最後四分之一才開始撥滑閥(截汽),最後 15% 撥過中線(換側、緩衝);中段之前一口全開、另一口蓋住
    const frac = Math.abs(psi - (lo + hi) / 2) / ((hi - lo) / 2); // 離行程中點的比例(1 = 到了端點)
    if (frac < 0.65) assert.equal(side, ahead < 0 ? 1 : -1, `主動量 ${phi.toFixed(2)}:進汽的那一側推活塞往它擺的方向`);
    if (frac < 0.45) assert.ok(m422.portOpen(phi, side) > 0.99 && m422.portOpen(phi, -side) < 1e-9, `主動量 ${phi.toFixed(2)}:一口全開、另一口被滑閥蓋住`);
  }
  // 到了行程末端,滑閥已經撥到另一邊:活塞擺到最左(逆時針最遠)時左口開著,蒸汽接著把它推回右邊
  assert.equal(m422.admitting(phis[psis.indexOf(hi)]), 1, "最左端:左側進汽");
  assert.equal(m422.admitting(phis[psis.indexOf(lo)]), -1, "最右端:右側進汽");
  const sides = new Set(phis.map((p) => m422.default.pose(p).readouts[0].value.slice(0, 4)));
  assert.equal(sides.size, 2, "蒸汽輪流進兩側");
});

test("第 423 種:雙象限引擎:兩個單動活塞接同一個曲柄,每個在曲柄約三分之二圈裡被蒸汽推,沒有死點;蒸汽從外側進、從兩活塞之間排出", () => {
  const def = m423.default;
  const ts = sweep(2 * Math.PI, 360).slice(0, -1);
  for (const k of [0, 1]) {
    const frac = ts.filter((t) => m423.driving(t, k)).length / ts.length;
    close(frac, 2 / 3, `活塞 ${k + 1} 被推的時間約佔三分之二圈`, 0.03);
  }
  for (const t of ts) assert.ok(m423.driving(t, 0) || m423.driving(t, 1), "任何時候至少一個活塞被推(沒有死點)");
  const casing = part(def, "casing");
  const walls = casing.pieces.filter((p) => p.role === "endWall");
  assert.equal(walls.length, 2, "兩道外側端壁");
  let closest = Infinity;
  for (const t of sweep(2 * Math.PI, 90)) {
    const pose = def.pose(t);
    for (const k of [0, 1]) {
      const piston = part(def, `piston${k + 1}`);
      const alpha = pose.parts[piston.id].angle;
      // 「蒸汽作用在兩個活塞的外側」:外側的蒸汽點都在活塞朝汽室的面與端壁朝汽室的面之間(兩面都和轂的座孔相切)、弧壁之內
      const across = (d, dir) => -(d[0] - m423.PIVOTS[k][0]) * Math.sin(dir) + (d[1] - m423.PIVOTS[k][1]) * Math.cos(dir); // 離 dir 方向的徑向線的橫向距離(逆時針為正)
      for (const d of m423.chamber(t, k, 0)) {
        const r = Math.hypot(d[0] - m423.PIVOTS[k][0], d[1] - m423.PIVOTS[k][1]);
        assert.ok(r < m423.VANE + 0.03 && across(d, alpha) > -m423.SEAT && across(d, m423.OUTER[k]) < -m423.SEAT, `主動量 ${t.toFixed(2)}:活塞 ${k + 1} 的蒸汽點在汽室裡(r ${r.toFixed(2)}、離活塞面 ${(across(d, alpha) + m423.SEAT).toFixed(2)}、離端壁面 ${(-m423.SEAT - across(d, m423.OUTER[k])).toFixed(2)})`);
      }
      // 「從兩活塞之間的空間排出」:回程的活塞,排汽的點從它的內側出發、流到排汽口
      if (!m423.driving(t, k)) {
        const path = m423.exhaustPath(t, k);
        const first = path[0];
        const a0 = Math.atan2(first[1] - m423.PIVOTS[k][1], first[0] - m423.PIVOTS[k][0]);
        assert.ok(signedAngle(alpha - a0) > 0 && signedAngle(alpha - a0) < Math.PI / 2, `主動量 ${t.toFixed(2)}:排汽從活塞 ${k + 1} 的內側出發`);
        close(dist(path.at(-1), m423.EXHAUST), 0, "排汽流到排汽口", 1e-9);
        const flow = pose.flows.find((f) => f.points.length && f.points.every((p) => distanceToPath(path, p) < 1e-6));
        assert.ok(flow, `主動量 ${t.toFixed(2)}:姿勢裡有沿排汽路徑走的點`);
      }
      // 活塞與端壁:全程不穿入
      const vane = piston.pieces.find((p) => p.role === "vane");
      const poly = placeOutline(vane.shape.outline, m423.PIVOTS[k], alpha);
      const gap = polyGap(poly, walls[k].shape.outline);
      assert.ok(gap > 0, `主動量 ${t.toFixed(2)}:活塞 ${k + 1} 不穿進端壁`);
      closest = Math.min(closest, gap);
    }
  }
  assert.ok(closest < 0.02, `活塞擺到最外時貼著端壁(最小間隙 ${closest.toFixed(4)})`);
  // 曲柄 D 的軸由軸承托住
  const crank = part(def, "crank");
  const shaft = crank.pieces.find((p) => p.role === "shaft");
  assertShaftInBearings({ at: shaft.at, radius: shaft.radius, length: shaft.length }, casing.pieces, "曲柄 D 的軸");
  // 底座接到汽缸
  const base = casing.pieces.find((p) => p.role === "base");
  const back = casing.pieces.find((p) => p.role === "back");
  assert.ok(pieceBox(base).hi[1] >= pieceBox(back).lo[1], "底座頂到汽缸的外框");
});

test("第 424 種:方形活塞引擎:B 水平、C 在 B 裡垂直,一起使曲柄旋轉,沒有死點;進汽口在壁的內側", () => {
  const def = m424.default;
  const ports = def.parts.filter((p) => p.role === "port");
  assert.equal(ports.length, 4, "「蒸汽引入口以黑色表示」:A 兩端、B 上下各一個口");
  for (const t of sweep(2 * Math.PI, 36)) {
    const { b, c } = m424.pistons(t);
    close(Math.hypot(b, c), m424.CRANK, "曲柄銷 a 在 (B 的水平位置, C 的垂直位置)");
    assert.ok(m424.turning(t) >= 1 - 1e-9, "兩個活塞合起來在任何位置都推得動曲柄");
    const pose = def.pose(t).parts;
    close(pose.pistonC.position[0], pose.pistonB.position[0], "C 隨 B 水平移動");
    for (const p of ports) {
      assert.ok(p.kind === "fill" && p.fluid === "steam" && pose[p.id].level === 1, `${p.id} 以蒸汽色填滿`);
      const [x, y] = pose[p.id].position;
      if (p.wall === "A") {
        close(Math.abs(x) + p.size[1] / 2, m424.A_IN.w / 2, "A 的口貼著 A 的內壁", 1e-9);
        assert.ok(Math.abs(y) + p.size[0] / 2 < m424.A_IN.h / 2, "A 的口在內壁的範圍裡");
      } else {
        close(x, b, "B 的口隨 B 移動", 1e-9);
        close(Math.abs(y) + p.size[1] / 2, m424.B_IN.h / 2, "B 的口貼著 B 的內壁", 1e-9);
      }
    }
  }
  // 一個活塞在行程端點(死點)時,另一個正在行程中間
  close(m424.pistons(0).c, 0, "B 在端點時 C 在中間");
  close(m424.pistons(Math.PI / 2).b, 0, "C 在端點時 B 在中間");
  // 主軸 b 由軸承托住;底座接到汽缸的外框
  const cylinderA = part(def, "cylinderA");
  const shaft = part(def, "shaft").pieces.find((p) => p.role === "shaft");
  assertShaftInBearings({ at: shaft.at, radius: shaft.radius, length: shaft.length }, cylinderA.pieces, "主軸 b");
  const base = cylinderA.pieces.find((p) => p.role === "base");
  const frame = cylinderA.pieces.find((p) => p.role === "frame");
  assert.ok(pieceBox(base).hi[1] >= pieceBox(frame).lo[1], "底座頂到汽缸的外框");
});

test("第 425 種:旋轉引擎:偏心活塞 C 在一點碰汽缸;擋板 D 退出活塞的路線讓它通過,又始終貼著活塞", () => {
  for (const t of sweep(2 * Math.PI, 36)) {
    const { c } = m425.piston(t);
    close(Math.hypot(c[0], c[1]) + m425.PISTON, m425.BORE, "偏心輪在一點碰到汽缸");
    const tip = m425.abutment(t);
    // 擋板是平底:平底範圍內偏心輪的最高點剛好碰到它,其餘各點都在它下面(由接觸算,不穿入)
    const top = (x) => (Math.abs(x - c[0]) <= m425.PISTON ? c[1] + Math.sqrt(m425.PISTON ** 2 - (x - c[0]) ** 2) : -Infinity);
    const xs = sweep(m425.SLOT, 20, -m425.SLOT);
    assert.ok(xs.every((x) => top(x) <= tip + 1e-9), "偏心輪不頂進擋板");
    close(Math.max(...xs.map(top)), tip, "擋板下端貼著偏心輪", 2e-3);
    assert.ok(tip <= m425.BORE + 1e-9, "擋板不超出汽缸");
  }
  close(m425.abutment(Math.PI / 2), m425.BORE, "活塞的接觸點經過時,擋板完全退出");
  assert.ok(m425.abutment(-Math.PI / 2) < m425.BORE - 0.5, "活塞在對面時,擋板伸進汽缸隔開進汽與排汽");
});

// 2026-10-20 複查 #425-1:汽道的端頭伸進缸膛頂到偏心輪、擋板插在沒畫出來的槽裡
test("第 425 種:汽道的端頭停在缸膛表面、擋板的槽開在汽缸壁上:偏心輪與擋板全程不穿進汽缸的任何板件", () => {
  const def = m425.default;
  const layers = plateLayers(part(def, "cylinder"));
  const overlapZ = (l, z0, z1) => l.z0 < z1 - 1e-9 && z0 < l.z1 - 1e-9;
  assert.ok(Math.hypot(...m425.inlet.at(-1).slice(0, 2)) >= m425.BORE - 1e-9, "進汽道的端點在缸膛表面上或之外");
  assert.ok(Math.hypot(...m425.exhaust[0].slice(0, 2)) >= m425.BORE - 1e-9, "排汽道的端點在缸膛表面上或之外");
  const abut = part(def, "abutment");
  const eccentric = plateLayers(part(def, "pistonC"))[0];
  for (const t of sweep(2 * Math.PI, 48, -Math.PI / 2)) {
    const pose = def.pose(t).parts;
    const disc = circlePolygon(m425.piston(t).c, m425.PISTON, 90);
    const slab = rect(abut.size[0], abut.size[1], 0, pose.abutment.position[1]);
    for (const l of layers) {
      if (overlapZ(l, eccentric.z0, eccentric.z1)) assert.ok(penetrationDepth(disc, l.solid) < 2e-3, `主動量 ${t.toFixed(2)}:偏心輪不穿進汽缸的板件(汽道端頭、導槽)`);
      if (overlapZ(l, -abut.size[2] / 2, abut.size[2] / 2)) assert.ok(penetrationDepth(slab, l.solid) < 1e-6, `主動量 ${t.toFixed(2)}:擋板在汽缸壁的槽裡,不穿進汽缸`);
    }
    // 擋板兩側貼著槽壁(由槽導引,不是浮著)
    const guided = layers.filter((l) => overlapZ(l, -abut.size[2] / 2, abut.size[2] / 2));
    for (const q of [[-abut.size[0] / 2, m425.BORE + 0.3], [abut.size[0] / 2, m425.BORE + 0.3]]) assert.ok(Math.min(...guided.map((l) => edgeDistance(q, l.solid.outline))) <= 0.011, `主動量 ${t.toFixed(2)}:擋板兩側貼著槽壁`);
  }
});

test("第 426 種:兩個活塞 A 在輪轂 C 的溝槽裡徑向滑動,經過擋板 D 時縮進輪轂,其餘時候貼著汽缸壁", () => {
  for (const a of m426.ABUTMENTS) close(m426.wall(a), m426.HUB, "擋板處的內壁就是輪轂的半徑(活塞完全縮進)");
  close(m426.wall(Math.PI / 2), m426.BORE, "離擋板遠處活塞伸到汽缸壁");
  for (const t of sweep(2 * Math.PI, 36)) {
    const pose = m426.default.pose(t).parts;
    for (const id of ["piston1", "piston2"]) {
      const p = pose[id];
      const r = Math.hypot(p.position[0], p.position[1]) + m426.HEAD; // 圓頭的頂
      assert.ok(r <= m426.wall(p.angle) + 1e-9, "活塞外端不超出內壁");
      const d = Math.min(...m426.ABUTMENTS.map((a) => Math.abs(Math.atan2(Math.sin(p.angle - a), Math.cos(p.angle - a)))));
      if (d < deg(6) || d > deg(47)) close(r, m426.wall(p.angle), "擋板頂與圓弧段上,活塞外端貼著內壁(斜坡上碰的是圓頭的側面)", 1e-4);
    }
    close(pose.piston2.angle - pose.piston1.angle, Math.PI, "兩個活塞相對");
  }
});

// 2026-10-20 複查 #426-2:平頭活塞的角切進擋板旁的斜坡、汽道板伸進缸膛
test("第 426 種:活塞的圓頭全程貼著內壁滑、不穿入(斜坡上也是);汽道的端頭停在內壁表面", () => {
  const def = m426.default;
  const cyl = plateLayers(part(def, "cylinder"));
  const bore = cyl.find((l) => l.solid.holes.length).solid.holes[0];
  const half = part(def, "piston1").thickness / 2;
  const headIdx = m426.PISTON_OUTLINE.map((q, i) => (q[0] > -1e-9 ? i : -1)).filter((i) => i >= 0);
  assert.ok(headIdx.length >= 5, "活塞的外端是圓頭");
  for (const path of [...m426.inlets, ...m426.exhausts]) {
    const p = path.reduce((a, b) => (Math.hypot(a[0], a[1]) <= Math.hypot(b[0], b[1]) ? a : b)); // 離軸心最近的端點
    assert.ok(Math.hypot(p[0], p[1]) >= m426.wall(Math.atan2(p[1], p[0])) - 1e-9, "汽道的端點在內壁表面上或之外");
  }
  for (const t of sweep(2 * Math.PI, 72)) {
    const pose = def.pose(t).parts;
    for (const id of ["piston1", "piston2"]) {
      const p = pose[id];
      const placed = placeOutline(m426.PISTON_OUTLINE, p.position, p.angle);
      const z0 = p.position[2] - half;
      const z1 = p.position[2] + half;
      for (const l of cyl) if (l.z0 < z1 - 1e-9 && z0 < l.z1 - 1e-9) assert.ok(penetrationDepth(placed, l.solid) < 1e-3, `主動量 ${t.toFixed(2)}:${id} 不穿進汽缸的板件(內壁、汽道)`);
      close(Math.min(...headIdx.map((i) => edgeDistance(placed[i], bore))), 0, `主動量 ${t.toFixed(2)}:${id} 的圓頭貼著內壁`, 3e-3);
    }
  }
});

// 2026-10-20 複查 #426-1:溝槽的洞比輪轂大、被三角化丟掉,輪轂是實心的;#424-3:底座離汽缸外緣 0.025
test("第 426 種:輪轂的溝槽真的開出來:活塞在溝槽裡、兩側貼著槽壁、後面有輪轂的背板;底座接到汽缸", () => {
  const def = m426.default;
  const hub = plateLayers(part(def, "hub"));
  for (const l of hub) for (const h of l.solid.holes) for (const q of h) assert.ok(pointInPolygon(q, l.solid.outline), "輪轂的洞在外形之內");
  const half = part(def, "piston1").thickness / 2;
  const innerIdx = m426.PISTON_OUTLINE.map((q, i) => (q[0] < -m426.PISTON + 1e-9 ? i : -1)).filter((i) => i >= 0);
  assert.equal(innerIdx.length, 2, "活塞的內端是平的(兩個角)");
  for (const t of sweep(2 * Math.PI, 36)) {
    const pose = def.pose(t).parts;
    for (const id of ["piston1", "piston2"]) {
      const p = pose[id];
      const z0 = p.position[2] - half;
      const z1 = p.position[2] + half;
      const local = placeOutline(m426.PISTON_OUTLINE, rot2(p.position, -pose.hub.angle), p.angle - pose.hub.angle);
      const beside = hub.filter((l) => l.z0 < z1 - 1e-9 && z0 < l.z1 - 1e-9);
      assert.ok(beside.length, "活塞的深度範圍裡有輪轂的板件(溝槽的兩壁)");
      for (const l of beside) assert.ok(penetrationDepth(local, l.solid) < 1e-6, `主動量 ${t.toFixed(2)}:${id} 不穿進輪轂`);
      for (const i of innerIdx) assert.ok(Math.min(...beside.map((l) => Math.min(edgeDistance(local[i], l.solid.outline), ...l.solid.holes.map((h) => edgeDistance(local[i], h))))) <= 0.011, `主動量 ${t.toFixed(2)}:${id} 兩側貼著槽壁`);
      const behind = hub.filter((l) => l.z1 <= z0 + 1e-9);
      assert.ok(behind.some((l) => innerIdx.every((i) => pointInPolygon(local[i], l.solid.outline))), `主動量 ${t.toFixed(2)}:${id} 的內端後面是輪轂的背板`);
    }
  }
  const base = part(def, "cylinder").pieces.find((q) => q.kind === "box");
  const bottom = Math.min(...plateLayers(part(def, "cylinder")).flatMap((l) => l.solid.outline.map((q) => q[1])));
  assert.ok(base.at[1] + base.size[1] / 2 >= bottom - 1e-9, "底座的頂面接到汽缸的外緣");
});

test("第 427 種:軸 B 偏心;活塞 A 穿過輪轂上的填料 a 滑進滑出,但始終對汽缸保持徑向", () => {
  for (const t of sweep(2 * Math.PI, 36)) {
    const pose = m427.default.pose(t).parts;
    for (const k of [1, 2]) {
      const p = pose[`piston${k}`];
      const a = pose[`packing${k}`].position;
      // 活塞沿汽缸半徑:外端在內壁上,方向通過汽缸中心
      close(Math.hypot(p.position[0], p.position[1]), m427.BORE, "活塞外端貼著汽缸");
      close(Math.atan2(p.position[1], p.position[0]), p.angle, "活塞沿汽缸半徑");
      // 填料 a 嵌在輪轂邊上的座裡(外緣和輪轂齊平,不露在輪轂外:2026-10-20 複查 #427-2)、在活塞上
      close(Math.hypot(a[0] - m427.SHAFT[0], a[1] - m427.SHAFT[1]) + m427.PACK_R, m427.HUB, "填料的外緣和輪轂的外圓齊平", 0.011);
      const r = Math.hypot(a[0], a[1]);
      assert.ok(r >= m427.RING - 1e-9 && r <= m427.BORE + 1e-9, "填料落在活塞的長度範圍內");
      close(Math.atan2(a[1], a[0]), p.angle, "活塞穿過填料");
    }
  }
  // 活塞穿過填料的位置一直在變:滑進滑出
  const rs = sweep(2 * Math.PI, 36).map((t) => Math.hypot(...m427.pistons(t)[0].packing.slice(0, 2)));
  assert.ok(Math.max(...rs) - Math.min(...rs) > 0.6, "活塞在輪轂裡滑進滑出");
});

// 2026-10-20 複查 #427-1、#427-2:輪轂的溝槽被丟掉、直溝槽容不下會歪的活塞;填料一半露在輪轂外、頂端伸進汽缸壁
test("第 427 種:活塞穿過填料的槽、填料跟著活塞歪(滾動填料);輪轂的窗容得下歪的活塞,填料整個在輪轂裡、不伸進汽缸壁", () => {
  const def = m427.default;
  const hub = plateLayers(part(def, "hub"));
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let maxTilt = 0;
  for (const t of sweep(2 * Math.PI, 72)) {
    const pose = def.pose(t).parts;
    for (const k of [1, 2]) {
      const p = pose[`piston${k}`];
      const a = pose[`packing${k}`];
      const packing = plateLayers(part(def, `packing${k}`));
      const packR = Math.max(...packing.flatMap((l) => l.solid.outline.map((q) => Math.hypot(q[0], q[1]))));
      assert.ok(Math.hypot(a.position[0] - m427.SHAFT[0], a.position[1] - m427.SHAFT[1]) + packR <= m427.HUB + 1e-9, `主動量 ${t.toFixed(2)}:填料 ${k} 整個在輪轂裡`);
      assert.ok(Math.hypot(a.position[0], a.position[1]) + packR <= m427.BORE + 1e-9, `主動量 ${t.toFixed(2)}:填料 ${k} 不伸進汽缸壁`);
      close(wrap((a.angle ?? 0) - p.angle), 0, `主動量 ${t.toFixed(2)}:填料 ${k} 的槽對準活塞(跟著活塞歪)`);
      const tilt = Math.abs(wrap(p.angle - Math.atan2(a.position[1] - m427.SHAFT[1], a.position[0] - m427.SHAFT[0])));
      maxTilt = Math.max(maxTilt, tilt);
      for (const layer of plateLayers(part(def, `piston${k}`))) {
        const placed = placeOutline(layer.solid.outline, p.position, p.angle);
        // 活塞穿過填料的槽:不穿進填料,槽的兩壁貼著活塞
        for (const l of packing) {
          if (!(l.z0 < layer.z1 - 1e-9 && layer.z0 < l.z1 - 1e-9)) continue;
          const half = placeOutline(l.solid.outline, a.position, a.angle ?? 0);
          assert.ok(penetrationDepth(placed, half) < 1e-6, `主動量 ${t.toFixed(2)}:活塞 ${k} 不穿進填料`);
          assert.ok(polyGap(placed, half) <= 0.011, `主動量 ${t.toFixed(2)}:填料 ${k} 的槽壁貼著活塞`);
        }
        // 輪轂的窗容得下活塞的歪斜
        const local = placeOutline(layer.solid.outline, rot2([p.position[0] - m427.SHAFT[0], p.position[1] - m427.SHAFT[1]], -pose.hub.angle), p.angle - pose.hub.angle);
        for (const l of hub) if (l.z0 < layer.z1 - 1e-9 && layer.z0 < l.z1 - 1e-9) assert.ok(penetrationDepth(local, l.solid) < 1e-6, `主動量 ${t.toFixed(2)}:活塞 ${k} 不穿進輪轂`);
      }
    }
  }
  assert.ok(maxTilt >= deg(17), `活塞對輪轂的半徑最多歪 17° 以上(${((maxTilt * 180) / Math.PI).toFixed(1)}°),所以溝槽不能是直的`);
});

// 2026-10-20 複查 #427-4:環離後蓋 0.015 浮著、和活塞在深度上只重疊 0.005;#427-3:汽道端點伸進缸膛頂到輪轂與活塞
test("第 427 種:活塞內端的腳貼著嵌在汽缸蓋輪轂上的環(深度上重疊);汽道的端頭停在缸膛表面", () => {
  const def = m427.default;
  const cyl = plateLayers(part(def, "cylinder"));
  const maxR = (l) => Math.max(...l.solid.outline.map((q) => Math.hypot(q[0], q[1])));
  const small = cyl.filter((l) => maxR(l) < m427.HUB);
  const ring = small.reduce((a, b) => (maxR(a) >= maxR(b) ? a : b));
  assert.ok(ring.solid.holes.length === 1, "環是環形");
  const cover = cyl.find((l) => l !== ring && maxR(l) > m427.BORE && l.z1 <= ring.z0 + 1e-9 && l.z1 >= ring.z0 - 1e-9);
  assert.ok(cover, "環立在汽缸蓋上(深度上相接)");
  assert.ok(Math.hypot(...m427.inlet.at(-1).slice(0, 2)) >= m427.BORE - 1e-9 && Math.hypot(...m427.exhaust[0].slice(0, 2)) >= m427.BORE - 1e-9, "汽道的端點在缸膛表面上或之外");
  const hub = plateLayers(part(def, "hub"));
  for (const t of sweep(2 * Math.PI, 72)) {
    const pose = def.pose(t).parts;
    for (const k of [1, 2]) {
      const p = pose[`piston${k}`];
      const layers = plateLayers(part(def, `piston${k}`));
      const foot = layers.reduce((a, b) => (a.z0 <= b.z0 ? a : b));
      assert.ok(Math.min(foot.z1, ring.z1) - Math.max(foot.z0, ring.z0) >= 0.05, "腳和環在深度上重疊 0.05 以上");
      const placed = placeOutline(foot.solid.outline, p.position, p.angle);
      const rs = placed.map((q) => Math.hypot(q[0], q[1]));
      assert.ok(Math.min(...rs) >= maxR(ring) - 1e-3, `主動量 ${t.toFixed(2)}:腳不穿進環`);
      close(Math.min(...rs), maxR(ring), `主動量 ${t.toFixed(2)}:腳貼著環的外面`, 2e-3);
      // 汽道、環、汽缸蓋:活塞與輪轂全程不穿進汽缸的任何板件
      for (const layer of layers) {
        const world = placeOutline(layer.solid.outline, p.position, p.angle);
        for (const l of cyl) if (l.z0 < layer.z1 - 1e-9 && layer.z0 < l.z1 - 1e-9) assert.ok(penetrationDepth(world, l.solid) < 1e-3, `主動量 ${t.toFixed(2)}:活塞 ${k} 不穿進汽缸的板件`);
      }
    }
    for (const layer of hub) {
      const world = placeOutline(layer.solid.outline, m427.SHAFT, pose.hub.angle);
      for (const l of cyl) if (l.z0 < layer.z1 - 1e-9 && layer.z0 < l.z1 - 1e-9) assert.ok(penetrationDepth(world, l.solid) < 1e-3, `主動量 ${t.toFixed(2)}:輪轂不穿進汽缸的板件(汽道端頭)`);
    }
  }
});

test("第 428 種:滾子把橡膠內襯壓貼在汽缸壁上,蒸汽把內襯壓向滾子(包住滾子後側、不穿進滾子),滾子在內襯上滾動", () => {
  const def = m428.default;
  const CLEAR = m428.ROLLER + m428.THICK / 2; // 內襯中心線離滾子中心至少這麼遠
  const WALL = m428.BORE - m428.THICK / 2;
  for (const t of sweep(2 * Math.PI, 36)) {
    const pose = def.pose(t);
    for (const k of [1, 2, 3]) {
      const c = pose.parts[`roller${k}`].position;
      close(Math.hypot(c[0], c[1]) + m428.ROLLER + m428.THICK, m428.BORE, "滾子壓著內襯貼到汽缸壁(間隙 0)");
      close(m428.lining(t, Math.atan2(c[1], c[0])), WALL, "內襯從滾子和缸壁之間穿過");
      let nearest = Infinity;
      for (const p of pose.paths.lining.points) nearest = Math.min(nearest, Math.hypot(p[0] - c[0], p[1] - c[1]));
      assert.ok(nearest > CLEAR - 1e-6, `主動量 ${t}:內襯穿進滾子 ${k}(離滾子中心 ${nearest} < ${CLEAR})`);
    }
    for (const p of pose.paths.lining.points) assert.ok(Math.hypot(p[0], p[1]) < WALL + 1e-9, "內襯不穿進缸壁");
    // 滾子在內襯上滾動、不打滑:接觸點的速度為零(自轉 × 滾子半徑 = −公轉 × 臂長)
    const dv = 1e-4;
    const spin = (def.pose(t + dv).parts.roller1.angle - pose.parts.roller1.angle) / dv;
    close(spin * m428.ROLLER + m428.ARM, 0, "滾子沿內襯滾動(接觸點不滑)", 1e-6);
  }
  // 被蒸汽壓著的那段內襯包住前面那個滾子的後側:沿滾子外緣貼著走一段(間隙接近 0 的點不只接觸點一個)
  const t0 = Math.PI / 2; // 一個滾子在正上方、它前面的滾子在右上,後面那段被壓著
  const pose = def.pose(t0);
  for (const k of [1, 2, 3]) {
    const c = pose.parts[`roller${k}`].position;
    const a = Math.atan2(c[1], c[0]);
    if (a < 0.2 || a > Math.PI - 0.2) continue; // 只看上半圈、後面有被壓著的那段的滾子
    const hugging = pose.paths.lining.points.filter((p) => Math.hypot(p[0] - c[0], p[1] - c[1]) < CLEAR + 0.01);
    assert.ok(hugging.length >= 3, `主動量 ${t0}:內襯沒有包住滾子 ${k} 的後側(貼著的點只有 ${hugging.length} 個)`);
  }
});

test("第 428 種:從進汽口順時針到排汽口之間,每兩個滾子之間的內襯都被蒸汽往內壓;其餘貼著汽缸;形狀隨主軸轉角連續變化", () => {
  const WALL = m428.BORE - m428.THICK / 2;
  for (const t of sweep(2 * Math.PI, 36)) {
    const chambers = m428.chambers(t);
    assert.ok(chambers.length >= 1, "上半圈總有被壓著的內襯");
    for (const { lo, hi } of chambers) {
      assert.ok(lo >= -1e-9 && hi <= Math.PI + 1e-9, "被壓的只在進汽口到排汽口之間(上半圈)");
      if (hi - lo > 1) assert.ok(m428.lining(t, (lo + hi) / 2) < WALL - 0.15, `主動量 ${t}:兩個滾子之間(${lo.toFixed(2)}–${hi.toFixed(2)})的內襯沒被壓進去`);
    }
    for (let i = 1; i < 180; i++) {
      const phi = -Math.PI + (Math.PI * i) / 180; // 下半圈
      close(m428.lining(t, phi), WALL, `主動量 ${t}:排汽口到進汽口之間(φ=${phi.toFixed(2)})的內襯沒貼著汽缸`);
    }
  }
  // 滾子剛過進汽口:它前面那一段(膨脹段)仍被壓著,不是一瞬間彈平
  const atInlet = Math.PI - (2 * Math.PI) / 3; // roller2 在進汽口
  for (const t of [atInlet + 0.02, atInlet - 0.02]) {
    const ahead = Math.PI - Math.PI / 3; // 進汽口前方 60°
    assert.ok(m428.lining(t, ahead) < WALL - 0.3, `主動量 ${t}:滾子剛過進汽口時它前面那段的內襯彈平了`);
  }
  // 內襯的形狀對主軸轉角連續:轉一小步,每一點的半徑變化有限
  const step = (2 * Math.PI) / 720;
  let worst = 0;
  for (let i = 0; i < 720; i++) {
    const t = i * step;
    for (let j = 0; j < 240; j++) {
      const phi = (2 * Math.PI * j) / 240;
      worst = Math.max(worst, Math.abs(m428.lining(t + step, phi) - m428.lining(t, phi)));
    }
  }
  assert.ok(worst < 0.06, `主軸轉 0.5° 內襯的半徑最多跳了 ${worst}(整段彈平的話會跳 0.4 以上)`);
});

test("第 428 種:橡膠內襯的周長只有彈性壓縮(最多縮 5%),不被拉長", () => {
  const WALL = m428.BORE - m428.THICK / 2;
  const full = 2 * Math.PI * WALL;
  for (const t of sweep(2 * Math.PI, 36)) {
    const pts = m428.default.pose(t).paths.lining.points;
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    assert.ok(len < full + 0.01, `主動量 ${t}:內襯被拉長了(${len} > ${full})`);
    assert.ok(len > full * 0.95, `主動量 ${t}:內襯縮了超過 5%(${len} / ${full})`);
  }
});

test("第 429 種:兩個一樣的卵形活塞各繞自己的中心轉、以齒咬合、朝相反方向轉;節曲線在兩軸連線上相切,轉速比一圈變兩次", () => {
  let prev = m429.partner(0).angle;
  const ratios = [];
  for (const t of sweep(2 * Math.PI, 120).slice(1)) {
    const q = m429.partner(t);
    // 左輪朝右輪的半徑 r1 + 右輪朝左輪的半徑 = 兩軸距離(純滾動、相切)
    close(m429.radius(-t), q.r1, "左輪朝接觸點的半徑", 1e-9);
    close(m429.radiusRight(Math.PI - q.angle), m429.DIST - q.r1, "節曲線相切(半徑和 = 兩軸距離)", 1e-5);
    const d = Math.atan2(Math.sin(q.angle - prev), Math.cos(q.angle - prev));
    assert.ok(d < 0, "左輪逆時針時右輪順時針(反向)");
    prev = q.angle;
    ratios.push(q.r1 / (m429.DIST - q.r1));
  }
  close(m429.partner(2 * Math.PI).angle, -2 * Math.PI, "兩輪一樣大:左輪轉一圈右輪也轉一圈", 1e-6);
  // 繞中心轉的卵形:長軸每半圈朝向對方一次,轉速比一圈有兩個最大值
  let peaks = 0;
  for (let i = 0; i < ratios.length; i++) {
    const a = ratios[(i + ratios.length - 1) % ratios.length];
    const b = ratios[(i + 1) % ratios.length];
    if (ratios[i] > a && ratios[i] > b) peaks++;
  }
  assert.equal(peaks, 2, `轉速比一圈應變兩次,實際 ${peaks} 個峰`);
  assert.ok(Math.max(...ratios) > 1.15 && Math.min(...ratios) < 0.87, "卵形看得出來(轉速比在 0.87 以下到 1.15 以上之間變化)");
  // 長軸兩端在軸心的兩側等距:軸在卵形的中心,不在焦點
  close(m429.radius(0), m429.radius(Math.PI), "長軸兩端離軸心一樣遠", 1e-9);
});

test("第 429 種:兩輪的齒全程咬合不重疊,密封條貼著外殼的弧、經過咬合處時落進對方的齒槽;外殼在上下腰部開進、排汽口", () => {
  const left = m429.rotorOutline("left");
  const right = m429.rotorOutline("right");
  const seal = m429.CASE; // 密封條外緣到軸心的距離 = 外殼內壁的半徑
  for (const t of sweep(2 * Math.PI, 144)) {
    const q = m429.partner(t);
    const L = placeOutline(left, m429.LEFT, t);
    const R = placeOutline(right, m429.RIGHT, q.angle);
    const depth = penetrationDepth(L, R);
    assert.ok(depth < 0.012, `主動量 ${t}:兩輪的齒(或密封條)互相穿入 ${depth}`);
    // 轉子的每一點都在自己那一側的外殼弧之內;密封條的外緣貼著弧(間隙接近 0)
    const reachL = Math.max(...L.map(([x, y]) => Math.hypot(x - m429.LEFT[0], y - m429.LEFT[1])));
    const reachR = Math.max(...R.map(([x, y]) => Math.hypot(x - m429.RIGHT[0], y - m429.RIGHT[1])));
    assert.ok(reachL <= seal + 1e-9 && reachR <= seal + 1e-9, `主動量 ${t}:轉子伸出外殼(${reachL}, ${reachR} > ${seal})`);
    assert.ok(reachL > seal - 0.01 && reachR > seal - 0.01, `主動量 ${t}:密封條沒貼著外殼(${reachL}, ${reachR})`);
  }
  // 外殼:兩段以兩軸為圓心的弧,在上下腰部開口接汽管(腰部中線上沒有殼壁)
  const [shellL, shellR] = m429.shells;
  for (const y of [m429.WAIST + 0.01, m429.CASE, m429.CASE + 0.15]) {
    for (const s of [1, -1]) assert.ok(!pointInPolygon([0, s * y], shellL) && !pointInPolygon([0, s * y], shellR), `腰部 (0, ${s * y}) 有殼壁擋住汽口`);
  }
  for (const a of [Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const p = [m429.LEFT[0] + (m429.CASE + 0.1) * Math.cos(a), m429.LEFT[1] + (m429.CASE + 0.1) * Math.sin(a)];
    assert.ok(pointInPolygon(p, shellL), `外殼的弧在 ${a.toFixed(2)} 方向缺了一塊`);
  }
  // 蒸汽從上方進來、沿兩側的外殼走、從下方出去;點不落在轉子上
  for (const t of sweep(2 * Math.PI, 12)) {
    const q = m429.partner(t);
    const L = placeOutline(left, m429.LEFT, t);
    const R = placeOutline(right, m429.RIGHT, q.angle);
    const dots = m429.default.pose(t).flows.flatMap((f) => f.points);
    assert.ok(dots.some(([x, y]) => Math.abs(x) < 0.1 && y > m429.CASE) && dots.some(([x, y]) => Math.abs(x) < 0.1 && y < -m429.CASE), "蒸汽在上方的進汽管與下方的排汽管裡");
    for (const d of dots) assert.ok(!pointInPolygon([d[0], d[1]], L) && !pointInPolygon([d[0], d[1]], R), `主動量 ${t}:蒸汽的點落在轉子上 (${d[0].toFixed(2)}, ${d[1].toFixed(2)})`);
  }
});
