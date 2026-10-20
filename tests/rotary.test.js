// 第十八章「雜項與旋轉引擎」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, turned, assertMeshFree, part, plateLayers, inSolid, polyGap } from "./helpers.js";
import { pointInPolygon, edgeDistance, penetrationDepth, placeOutline } from "../models/contact.js";
import { gearProfile } from "../models/shapes.js";
import { TAU, rot2, add, scale, planeBasis, dist } from "../models/kit.js";

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

test("第 418 種:閥 A 在閥座上水平滑動,桿 B 上端的銷在垂直溝槽裡,滾子 C 沿弧形件 D 走", () => {
  for (const v of sweep(4 * m418.SWING, 24)) {
    const phi = m418.default.pose(v).parts.rod.angle;
    const { C, Q, P } = m418.linkage(phi);
    close(Math.hypot(C[0] - m418.TOP[0], C[1] - m418.TOP[1]), m418.ROLLER_AT, "滾子在弧上(弧以銷為圓心)");
    close(P[1], m418.SEAT_Y, "閥貼著閥座、水平滑動");
    close(Math.hypot(P[0] - Q[0], P[1] - Q[1]), m418.LINK, "短連桿長不變");
  }
  const xs = sweep(4 * m418.SWING, 24).map((v) => m418.linkage(m418.default.pose(v).parts.rod.angle).P[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.8, "閥來回滑動");
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

test("第 420 種:錘子敲到鐘之後,下方的彈簧把它抬離鐘面,不貼著鐘", () => {
  const phases = sweep(1, 200).map((v) => ({ v, ...m420.hammer(v) }));
  const strikes = phases.filter((p) => p.phase === "敲擊鐘面");
  assert.ok(strikes.length > 0, "有敲擊的時刻");
  for (const p of strikes) close(m420.gap(p.angle), 0, "敲擊時錘頭碰到鐘面", 1e-9);
  for (const p of phases) assert.ok(m420.gap(p.angle) > -1e-9, "錘頭不會撞進鐘裡");
  const after = m420.hammer(0.9);
  assert.ok(m420.gap(after.angle) > 0.05, "敲擊之後錘頭離開鐘面");
  close(after.angle, m420.REST, "停在彈簧撐住的位置");
  // 敲擊時彈簧被壓得最短
  const len = (v) => {
    const sp = m420.default.pose(v).parts.spring;
    return Math.hypot(sp.to[0] - sp.from[0], sp.to[1] - sp.from[1]);
  };
  assert.ok(len(strikes[0].v) < len(0.9), "敲擊時壓縮彈簧,彈簧再把錘子推回");
});

test("第 421 種:筒狀引擎:筒管使活塞上側的有效面積大減;高壓蒸汽先推上側,再排進下側膨脹", () => {
  assert.ok(m421.AREA.upper < m421.AREA.lower, "上側的有效面積比下側小");
  const def = m421.default;
  for (const t of sweep(2 * Math.PI, 16)) {
    const pose = def.pose(t);
    const down = m421.downward(t);
    // 活塞往下走時,上側有新蒸汽、下側排汽;往上走時,蒸汽在下側(由上側轉來)
    if (down) {
      assert.ok(pose.parts.steamUp.level > 0 || t % Math.PI < 1e-9, "下行:上側有蒸汽");
      assert.equal(pose.parts.steamDown.level, 0, "下行:下側排汽");
    } else assert.ok(pose.parts.steamDown.level >= 0 && pose.flows.length === 1, "上行:蒸汽經轉汽管進下側");
    // 連桿下端直接接在活塞上
    close(pose.parts.rod.to[1], pose.parts.piston.position[1], "連桿直接接活塞");
  }
});

test("第 422 種:擺動活塞:曲柄轉一圈,活塞 B 繞搖臂軸 C 來回擺一次,蒸汽輪流推它的兩側", () => {
  const psis = sweep(2 * Math.PI, 72).map((p) => m422.vane(p));
  assert.ok(Math.max(...psis) < m422.HALF && Math.min(...psis) > -m422.HALF, "活塞在扇形汽缸裡擺動");
  assert.ok(Math.max(...psis) - Math.min(...psis) > 0.5, "擺幅明顯");
  const sides = new Set(sweep(2 * Math.PI, 72).map((p) => m422.default.pose(p).readouts[0].value));
  assert.equal(sides.size, 2, "蒸汽輪流進兩側");
});

test("第 423 種:雙象限引擎:兩個單動活塞接同一個曲柄,每個在曲柄約三分之二圈裡被蒸汽推,沒有死點", () => {
  const ts = sweep(2 * Math.PI, 360).slice(0, -1);
  for (const k of [0, 1]) {
    const frac = ts.filter((t) => m423.driving(t, k)).length / ts.length;
    close(frac, 2 / 3, `活塞 ${k + 1} 被推的時間約佔三分之二圈`, 0.03);
  }
  for (const t of ts) assert.ok(m423.driving(t, 0) || m423.driving(t, 1), "任何時候至少一個活塞被推(沒有死點)");
});

test("第 424 種:方形活塞引擎:B 水平、C 在 B 裡垂直,一起使曲柄旋轉,沒有死點", () => {
  for (const t of sweep(2 * Math.PI, 36)) {
    const { b, c } = m424.pistons(t);
    close(Math.hypot(b, c), m424.CRANK, "曲柄銷 a 在 (B 的水平位置, C 的垂直位置)");
    assert.ok(m424.turning(t) >= 1 - 1e-9, "兩個活塞合起來在任何位置都推得動曲柄");
    const pose = m424.default.pose(t).parts;
    close(pose.pistonC.position[0], pose.pistonB.position[0], "C 隨 B 水平移動");
  }
  // 一個活塞在行程端點(死點)時,另一個正在行程中間
  close(m424.pistons(0).c, 0, "B 在端點時 C 在中間");
  close(m424.pistons(Math.PI / 2).b, 0, "C 在端點時 B 在中間");
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

test("第 426 種:兩個活塞 A 在輪轂 C 的溝槽裡徑向滑動,經過擋板 D 時縮進輪轂,其餘時候貼著汽缸壁", () => {
  for (const a of m426.ABUTMENTS) close(m426.wall(a), m426.HUB, "擋板處的內壁就是輪轂的半徑(活塞完全縮進)");
  close(m426.wall(Math.PI / 2), m426.BORE, "離擋板遠處活塞伸到汽缸壁");
  for (const t of sweep(2 * Math.PI, 36)) {
    const pose = m426.default.pose(t).parts;
    for (const id of ["piston1", "piston2"]) {
      const p = pose[id];
      close(Math.hypot(p.position[0], p.position[1]), m426.wall(p.angle), "活塞外端貼著內壁");
    }
    close(pose.piston2.angle - pose.piston1.angle, Math.PI, "兩個活塞相對");
  }
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
      // 填料 a 在輪轂上、在活塞上
      close(Math.hypot(a[0] - m427.SHAFT[0], a[1] - m427.SHAFT[1]), m427.HUB, "填料在輪轂邊上");
      const r = Math.hypot(a[0], a[1]);
      assert.ok(r >= m427.RING - 1e-9 && r <= m427.BORE + 1e-9, "填料落在活塞的長度範圍內");
      close(Math.atan2(a[1], a[0]), p.angle, "活塞穿過填料");
    }
  }
  // 活塞穿過填料的位置一直在變:滑進滑出
  const rs = sweep(2 * Math.PI, 36).map((t) => Math.hypot(...m427.pistons(t)[0].packing.slice(0, 2)));
  assert.ok(Math.max(...rs) - Math.min(...rs) > 0.6, "活塞在輪轂裡滑進滑出");
});

test("第 428 種:蒸汽把橡膠內襯 E 壓向滾子,滾子繞汽缸轉、帶動主軸", () => {
  for (const t of sweep(2 * Math.PI, 24)) {
    const pose = m428.default.pose(t).parts;
    for (const k of [1, 2, 3]) close(Math.hypot(...pose[`roller${k}`].position.slice(0, 2)) + m428.ROLLER, m428.BORE, "滾子壓著內襯貼到汽缸壁");
    const span = m428.aheadOfInlet(t);
    if (span > 0.6) {
      const mid = Math.PI - span / 2;
      assert.ok(m428.lining(t, mid) < m428.BORE - 0.2, "進汽口到前面的滾子之間,橡膠被蒸汽往內壓");
    }
    assert.ok(Math.abs(m428.lining(t, -Math.PI / 2 + 0.01) - m428.BORE) < 1e-9 || span > Math.PI, "其餘部分的橡膠貼著汽缸");
  }
});

test("第 429 種:兩個咬合的橢圓活塞朝相反方向轉,節曲線在兩軸連線上相切", () => {
  let prev = m429.partner(0).angle;
  for (const t of sweep(2 * Math.PI, 120).slice(1)) {
    const q = m429.partner(t);
    // 接觸點離左軸 r1、離右軸 2a − r1:右輪在接觸方向上的半徑正好是 2a − r1
    const local = Math.PI - q.angle; // 接觸方向(朝左)在右輪局部的角
    close(m429.radius(local), m429.DIST - q.r1, "節曲線相切(半徑和 = 兩軸距離)", 1e-6);
    const d = Math.atan2(Math.sin(q.angle - prev), Math.cos(q.angle - prev));
    assert.ok(d < 0, "左輪逆時針時右輪順時針(反向)");
    prev = q.angle;
  }
  // 轉一圈後回到原位
  close(Math.cos(m429.partner(2 * Math.PI).angle), Math.cos(m429.partner(0).angle), "兩輪同步轉一圈", 1e-9);
});
