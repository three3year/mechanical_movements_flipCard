// 第十二章「接頭與器具」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, turned } from "./helpers.js";

import fig243, { turns as turns243 } from "../models/fig243.js";
import * as m254 from "../models/fig254.js";
import * as m255 from "../models/fig255.js";
import * as m256 from "../models/fig256.js";
import * as m257 from "../models/fig257.js";
import * as m258 from "../models/fig258.js";
import * as m259 from "../models/fig259.js";
import * as m245 from "../models/fig245.js";
import * as m248 from "../models/fig248.js";
import * as m249 from "../models/fig249.js";
import * as m250 from "../models/fig250.js";
import * as m267 from "../models/fig267.js";
import * as m270 from "../models/fig270.js";
import { sweep } from "./helpers.js";
import * as m247 from "../models/fig247.js";
import * as m251 from "../models/fig251.js";
import * as m253 from "../models/fig253.js";
import * as m277 from "../models/fig277.js";
import * as m278 from "../models/fig278.js";

test("第 243 種:透過皮帶輪與皮帶,把動力從一根水平軸傳到兩根垂直軸", () => {
  const main = fig243.parts.find((p) => p.id === "main");
  const left = fig243.parts.find((p) => p.id === "left");
  assert.equal(main.axis[1], 0, "主動輪的軸是水平的");
  assert.deepEqual(left.axis, [0, 1, 0], "從動軸是垂直的");
  const t = turns243(1);
  assert.ok(Math.abs(t.left) > 0 && Math.abs(t.right) > 0, "兩根垂直軸都被帶動");
  close(t.left, t.right, "兩根垂直軸的皮帶筒一樣大,轉速相同");
  close(turned(fig243, "left", 0, 1) * 0.36, 0.62, "皮帶筒周邊走過的長度 = 主動輪周邊走過的長度", 1e-9);
});

for (const [n, m, what] of [
  [254, m254, "鏈條"],
  [255, m255, "扁皮帶"],
  [256, m256, "扁皮帶"],
  [257, m257, "圓形皮帶"],
  [258, m258, "圓形皮帶"],
  [259, m259, "圓形皮帶"],
]) {
  test(`第 ${n} 種:以${what}驅動或被${what}驅動:輪轉動時${what}跟著走,反轉時反向`, () => {
    const pose = (v) => m.default.pose(v);
    const travel = pose(2 * Math.PI).paths.strand.phase - pose(0).paths.strand.phase;
    assert.ok(Math.abs(travel) > 1, `${what}跟著輪走`);
    close(m.travel(-1), -m.travel(1), "輪反轉,皮帶也反向走");
  });
}

test("第 259 種:V 形槽的溝槽刻有凹紋(兩斜面各一圈),第 258 種的槽面平滑", () => {
  const ridges = (def) => def.parts[0].pieces.filter((p) => p.kind === "box").length;
  assert.equal(ridges(m259.default), 2 * m259.GROOVES);
  assert.equal(ridges(m258.default), 0);
});

test("第 245 種:轉動 A,它從承插座 B 的 L 形槽中脫離,此時才可將其抽出", () => {
  const { VERTICAL, LOCKED } = m245.geometry;
  const locked = m245.bayonet(0);
  close(locked.pinAngle, LOCKED, "起初凸銷卡在橫槽末端");
  assert.equal(locked.lift, 0);
  const turned = m245.bayonet(1);
  close(turned.pinAngle, VERTICAL, "轉動後凸銷到直槽底下");
  assert.equal(turned.lift, 0, "還沒轉到直槽之前抽不出來");
  close(m245.bayonet(2).lift, m245.LIFT, "轉到直槽後可抽出");
  close(m245.bayonet(2).pinAngle, VERTICAL, "抽出時不再轉");
});

test("第 248 種:螺帽 B 旋進 C 的螺紋,把管 A 的凸緣壓緊在 C 上,將兩管固定在一起", () => {
  const { PITCH, TURNS } = m248;
  close(m248.union(0).gap - m248.union(2 * Math.PI).gap, PITCH, "螺帽每轉一圈前進一個螺距");
  close(m248.union(TURNS * 2 * Math.PI).gap, 0, "旋緊時 A 抵住 C");
  close(m248.union(99).gap, 0, "旋到底就停住");
});

test("第 249 種:球窩接頭:上管繞球心偏擺,球心不動", () => {
  const def = m249.default;
  const center = def.parts.find((p) => p.id === "pipe").center;
  for (const t of [-m249.TILT, 0, m249.TILT]) {
    const pose = def.pose(t).parts.pipe;
    assert.equal(pose.position, undefined, "上管不平移");
    assert.ok(pose.rotation.every(Number.isFinite));
  }
  assert.deepEqual(center, [0, 0, 0]);
  assert.notDeepEqual(def.pose(m249.TILT).parts.pipe.rotation, def.pose(0).parts.pipe.rotation, "偏擺時朝向改變");
});

test("第 250 種:軸由輪的圓周支撐:軸轉動時支撐輪反向轉,接觸點線速度相等(無滑動)", () => {
  const { WHEEL, JOURNAL } = m250.geometry;
  const a = 0.8;
  const b = m250.supportAngle(a);
  assert.ok(b < 0, "支撐輪反向轉");
  close(Math.abs(b) * WHEEL, a * JOURNAL, "接觸點線速度相等");
});

test("第 267 種:輪緣逆箭頭轉時,偏心臂把運動傳給軸;朝箭頭方向轉時,臂繞樞軸讓開,軸保持靜止", () => {
  const S = m267.SWING;
  const ccw = m267.friction(S);
  close(ccw.rim, S, "輪緣逆時針轉了一程");
  close(ccw.shaft - m267.friction(0).shaft, S, "軸跟著轉");
  const back = m267.friction(2 * S);
  close(back.rim, 0, "輪緣順時針(箭頭方向)轉回");
  close(back.shaft, ccw.shaft, "軸保持靜止");
  assert.ok(m267.friction(1.5 * S).yieldAngle > 0, "回程時臂繞樞軸讓開");
  assert.equal(m267.friction(0.5 * S).yieldAngle, 0, "帶動時臂卡住輪緣");
});

test("第 270 種:皮帶輪的抗摩擦軸承:滾子在不動的軸與輪孔之間滾動,不滑動", () => {
  const { BORE, SHAFT, ROLLER } = m270.geometry;
  for (const a of sweep(3, 6)) {
    const { carrier, spin } = m270.rollers(a);
    // 滾子貼軸的那一點速度為零,貼輪孔的那一點速度等於輪孔表面速度
    close(carrier * (SHAFT + ROLLER) - spin * ROLLER, 0, "貼軸處不滑動", 1e-12);
    close(carrier * (SHAFT + ROLLER) + spin * ROLLER, a * BORE, "貼輪孔處不滑動", 1e-12);
  }
});

test("第 247 種:頂桿撞到海底時被相對地推上去,把卡榫從錘下方抽出,錘脫落,桿不帶錘被拉起", () => {
  const { SEA, BALL, REST } = m247.geometry;
  const lowering = m247.sounding(0.2);
  assert.ok(lowering.attached && lowering.push === 0, "放下途中錘掛在桿上,頂桿沒被推");
  const pushed = m247.sounding(0.42);
  assert.ok(pushed.push > 0 && pushed.catchAngle < 0, "觸底後頂桿被推上,卡榫轉開");
  const fallen = m247.sounding(0.55);
  close(fallen.weight - BALL, SEA, "錘落在海底", 1e-9);
  const raised = m247.sounding(0.88);
  assert.ok(raised.rod > fallen.weight + 2, "桿被拉起");
  close(raised.weight, REST, "錘留在海底", 1e-9);
});

test("第 251 種:重物被抬到夠高時,鉤 A 的上端被框架 B 的槽兩側往內壓,重物突然被釋放", () => {
  const H = m251.HEIGHT;
  const low = m251.hook(0.5);
  assert.equal(low.open, 0, "抬升途中鉤爪抓緊");
  close(low.weight, 0.5, "重物跟著鉤上升");
  const top = m251.hook(H);
  assert.ok(top.open > 0.2, "到頂時鉤爪張開");
  close(top.weight, 0, "重物落回樁頭", 1e-9);
  close(m251.hook(1.5 * H).weight, 0, "鉤往下放時重物留在樁頭上");
});

test("第 253 種:鼓輪轉得危險地快時,鉤子因離心力往外甩出,鉤住凸柱 D,制止鼓輪", () => {
  const { P_STOP, REACH, clearance } = m253.geometry;
  const slow = m253.check(0.2);
  assert.ok(slow.tipRadius < m253.check(0.9).tipRadius, "高速時鉤子甩出");
  const stop = m253.check(P_STOP + 0.01).drum;
  close(m253.check(0.95).drum, stop, "鉤住後鼓輪停住");
  for (const p of sweep(P_STOP, 400)) {
    const c = m253.check(p);
    assert.ok(clearance(c.drum, c.beta) >= REACH - 1e-6, `進程 ${p.toFixed(3)}:鉤尖不穿過凸柱`);
  }
});

test("第 277 種:把擊錘往後扳起時,爪 a 推轉輪背面的棘齒 b,轉輪轉過一個膛室;擊錘落下時轉輪不動", () => {
  const step = (2 * Math.PI) / m277.CHAMBERS;
  const cocked = m277.colt(m277.COCK);
  close(cocked.cylinder, -step, "扳起一次轉一格", 1e-12);
  assert.ok(cocked.pin[1] > m277.colt(0).pin[1], "扳起時爪往上推");
  close(m277.colt(2 * m277.COCK).cylinder, -step, "擊錘落下時轉輪不動", 1e-12);
});

test("第 278 種:平台升降時棘爪縮在棘齒外;繩索斷裂時彈簧壓下 b,棘爪 d 被推進棘齒,阻止平台下降", () => {
  const { face, toothTip, B_UP, B_DOWN, pitch } = m278.geometry;
  assert.ok(m278.pawlReach(B_UP) < toothTip, "繩拉著時棘爪不碰棘齒");
  const reach = m278.pawlReach(B_DOWN);
  assert.ok(reach > toothTip && reach <= face, "斷繩後棘爪進到棘齒之間");
  for (const v of sweep(2.2, 20)) {
    const intact = m278.platform(v, false).top;
    const broken = m278.platform(v, true).top;
    assert.ok(broken <= intact + 1e-9 && intact - broken < pitch, "斷繩時平台只落到下方最近的棘齒");
  }
});
