// 第二十一章「風力、船舶與起重」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";

import fig484 from "../models/fig484.js";
import * as m485 from "../models/fig485.js";
import * as m486 from "../models/fig486.js";
import * as m487 from "../models/fig487.js";
import * as m488 from "../models/fig488.js";
import * as m489 from "../models/fig489.js";
import * as m490 from "../models/fig490.js";
import * as m491 from "../models/fig491.js";
import * as m492 from "../models/fig492.js";
import * as m493 from "../models/fig493.js";
import * as m494 from "../models/fig494.js";

test("第 484 種:圓筒上的螺旋葉片:風沿軸吹過,圓筒旋轉", () => {
  const a = fig484.pose(0.1);
  assert.equal(a.flows[0].fluid, "air", "風以空氣示意");
  const xs = a.flows[0].points.map((p) => p[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 3, "風沿軸吹過整個圓筒");
  assert.notDeepEqual(fig484.pose(0.1).parts.drum.rotation, fig484.pose(0.2).parts.drum.rotation, "圓筒隨進程轉");
});

test("第 485 種:風車:風吹在斜的帆面上產生圓周運動", () => {
  assert.ok(m485.PITCH > 0 && m485.PITCH < Math.PI / 4, "帆面相對旋轉平面斜一個角度");
  const def = m485.default;
  assert.notDeepEqual(def.pose(0.1).parts.sails.rotation, def.pose(0.3).parts.sails.rotation, "帆隨進程轉");
  assert.ok(def.pose(0.2).flows[0].points.length > 0, "有風");
});

test("第 486 種:垂直式風車:受風的一側帆面正對著風,轉回迎風時以邊緣對著風", () => {
  const face = m486.sail(0); // 右側:臂端順著風走
  const edge = m486.sail(Math.PI); // 左側:逆著風回來
  close(face.angle, 0, "受風時帆面與風垂直");
  close(edge.angle, Math.PI / 2, "回程時邊緣對著風");
  assert.equal(face.face, 1);
  assert.equal(edge.face, 0);
});

test("第 487 種:明輪:輪轉時下方的槳板把水往後推,船往前", () => {
  const def = m487.default;
  // 逆時針轉:最下面的槳板往右走(推水往右)
  const theta = 0.1;
  const below = (t) => [Math.cos(t - Math.PI / 2) * m487.R.paddle, Math.sin(t - Math.PI / 2) * m487.R.paddle];
  assert.ok(below(theta)[0] > below(0)[0], "下方的槳板往右(往後)推水");
  assert.ok(-m487.R.paddle < m487.WATER && m487.WATER < -m487.R.rim + 0.2, "只有下方的槳板浸在水裡");
  assert.match(def.pose(0).readouts[0].value, /往左/);
});

test("第 488 種:螺旋槳:槳葉是螺紋的片段,旋轉時沿軸推進", () => {
  assert.ok(m488.PITCH_ANGLE > 0 && m488.PITCH_ANGLE < Math.PI / 2, "槳葉斜一個螺距角");
  const def = m488.default;
  const xs = def.pose(1).flows[0].points.map((p) => p[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 3, "水沿軸被推動");
});

test("第 489 種:垂直槳板明輪:臂轉動時,環 d 繞偏心輪 e 轉,經曲柄使槳板始終直立", () => {
  const def = m489.default;
  for (const t of sweep(2 * Math.PI, 24)) {
    const parts = def.pose(t).parts;
    m489.joints(t).forEach((j, i) => {
      close(Math.hypot(j.pivot[0], j.pivot[1]), m489.ARM, "槳板的樞軸離軸心相等");
      // 曲柄端在環 d 上:離偏心輪中心也是 ARM
      close(Math.hypot(j.crank[0] - m489.ECC[0], j.crank[1] - m489.ECC[1]), m489.ARM, "曲柄端在繞偏心輪轉的環上");
      assert.equal(parts[`paddle${i}`].angle, undefined, "槳板不轉,始終直立");
    });
  }
});

test("第 490 種:操舵裝置:轉舵輪時繩的一端捲進、另一端放出,舵柄依舵輪轉的方向擺向一側", () => {
  const a = m490.tiller(0.5);
  const b = m490.tiller(-0.5);
  assert.ok(a * b < 0, "舵輪轉向相反,舵柄擺向相反的一側");
  close(m490.tiller(0), 0, "舵輪在中間時舵柄居中", 1e-6);
  // 上段繩捲進 r × theta
  const [top0] = m490.ropes(0);
  const [top1] = m490.ropes(a);
  assert.ok(top1 < top0, "轉正向時上段繩被捲進(變短)");
  const [, bot0] = m490.ropes(0);
  const [, bot1] = m490.ropes(a);
  assert.ok(bot1 > bot0, "另一段繩被放出(變長)");
});

test("第 491 種:絞盤:推桿轉動絞盤收進纜繩;棘爪在底座的棘齒上滑過,每過一齒落下一次(防止倒轉)", () => {
  close(m491.capstan(2 * Math.PI).hauled, 2 * Math.PI * m491.DRUM_R, "轉一圈收進鼓周長的繩");
  const tooth = (2 * Math.PI) / m491.TEETH;
  assert.ok(m491.capstan(tooth * 0.9).lift > m491.capstan(tooth * 0.1).lift, "爪尖沿齒背抬起");
  assert.ok(m491.capstan(tooth * 1.01).lift < m491.capstan(tooth * 0.99).lift, "過了齒尖就落下");
});

test("第 492 種:小艇脫鉤器:拉繩使槓桿上的環孔從舌片滑脫,舌片翻開滑出鉤子,小艇脫離", () => {
  const held = m492.release(0.3);
  assert.ok(held.held && held.fall === 0, "拉到一半之前,小艇還鉤著");
  const free = m492.release(1);
  assert.ok(!free.held && free.fall > 0.5, "環孔滑脫後小艇掉下");
  assert.ok(Math.abs(free.tongue - held.tongue) > 1, "舌片翻開");
  assert.ok(free.lever > held.lever, "槓桿被繩拉轉");
  const { EYE_R, TONGUE_W, TONGUE } = m492.geometry;
  const slide = sweep(m492.SLIP, 12).map(m492.eyeDistance);
  assert.ok(slide.every((d, i) => i === 0 || d > slide[i - 1]), "拉繩時環孔沿舌片往尖端滑");
  assert.ok(slide[0] < TONGUE && slide[6] < TONGUE, "拉到一半環孔還套在舌片上");
  assert.ok(slide[12] > TONGUE, "拉到 SLIP 時環孔已滑過舌片尖端");
  assert.ok(EYE_R > TONGUE_W / 2, "舌片穿得過環孔");
});

test("第 493 種:路易斯吊楔:吊起中央的楔子把兩邊的填塊擠緊在孔壁上,石塊隨之吊起", () => {
  const early = m493.lewis(0.15);
  assert.ok(early.lift === 0 && early.wedge > 0, "先提起楔子,石塊還沒動");
  const tight = m493.lewis(0.35);
  assert.ok(tight.tight && tight.spread > 0, "楔子提到位,填塊被擠開");
  close(m493.lewis(1).lift, m493.LIFT, "之後石塊被吊起");
});

test("第 494 種:吊鉗:拉起鉤環,環節使上臂收攏,尖端夾緊石塊;夾住後一起吊起", () => {
  const open = m494.tongs(0);
  assert.ok(open.tip[0] > m494.GRIP_X && !open.gripped, "一開始尖端在石塊外");
  const grip = m494.tongs(0.5);
  close(grip.tip[0], m494.GRIP_X, "尖端夾在石塊側面", 1e-6);
  assert.ok(grip.gripped && grip.lift > 0, "夾住後一起上升");
});
