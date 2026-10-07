// 第十二章「接頭與器具」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { penetrationDepth } from "../models/contact.js";
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
import * as m271 from "../models/fig271.js";
import * as m274 from "../models/fig274.js";
import * as m275 from "../models/fig275.js";
import * as m285 from "../models/fig285.js";
import * as m286 from "../models/fig286.js";
import * as m287 from "../models/fig287.js";
import * as m279 from "../models/fig279.js";
import * as m280 from "../models/fig280.js";
import * as m281 from "../models/fig281.js";
import * as m282 from "../models/fig282.js";
import * as m283 from "../models/fig283.js";
import * as m284 from "../models/fig284.js";
import * as m265 from "../models/fig265.js";
import * as m268 from "../models/fig268.js";
import * as m269 from "../models/fig269.js";
import * as m272 from "../models/fig272.js";
import * as m276 from "../models/fig276.js";
import * as m260 from "../models/fig260.js";
import * as m261 from "../models/fig261.js";
import fig262 from "../models/fig262.js";
import fig263 from "../models/fig263.js";
import * as cone from "../models/cone-roller.js";
import * as m264 from "../models/fig264.js";
import * as m266 from "../models/fig266.js";
import { meshAngle } from "../models/gears.js";
import * as m244 from "../models/fig244.js";
import * as m246 from "../models/fig246.js";
import * as m252 from "../models/fig252.js";
import * as m273 from "../models/fig273.js";
import { dist, sub, len } from "../models/kit.js";
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
  // 由接觸算:托腳退進錘孔以內的那一刻錘才脫落,之後加速落下
  const { T_RELEASE, footReach, HOLE } = m247.geometry;
  const before = m247.sounding(T_RELEASE - 0.005);
  assert.ok(before.attached && footReach(before.catchAngle) >= HOLE, "托腳還在錘孔外時錘掛著");
  const after = m247.sounding(T_RELEASE + 0.001);
  assert.ok(!after.attached && footReach(after.catchAngle) < HOLE, "托腳退進錘孔,錘脫落");
  const w = [0, 1, 2].map((k) => m247.sounding(T_RELEASE + 0.01 * k).weight);
  assert.ok(w[1] - w[2] > w[0] - w[1], "錘加速落下");
});

test("第 251 種:重物被抬到夠高時,鉤 A 的上端被框架 B 的槽兩側往內壓,重物突然被釋放", () => {
  const H = m251.HEIGHT;
  const low = m251.hook(0.5);
  assert.equal(low.open, 0, "抬升途中鉤爪抓緊");
  close(low.weight, 0.5, "重物跟著鉤上升");
  const top = m251.hook(H);
  assert.ok(top.open > 0.2, "到頂時鉤爪張開");
  assert.ok(!top.hold && top.weight < m251.RELEASE, "到頂時重物已被突然釋放、正在落下");
  // 以累積的力量落到樁頭上:落下越來越快,落到底停住
  const heights = sweep(m251.DROP, 20).map((s) => m251.hook(m251.RELEASE + s).weight);
  for (let i = 1; i < heights.length; i++) assert.ok(heights[i] < heights[i - 1], "落下途中一路往下");
  assert.ok(heights[0] - heights[10] < heights[10] - heights[20], "後半段落得比前半段多(加速)");
  close(m251.hook(m251.RELEASE + m251.DROP).weight, 0, "重物落到樁頭", 1e-9);
  close(m251.hook(1.5 * H).weight, 0, "鉤往下放時重物留在樁頭上");
});

test("第 251 種:放下吊繩時,合攏的鉤爪碰到凸頭被撐開、越過寬頭後合攏勾在底下(由接觸算)", () => {
  const H = m251.HEIGHT;
  // 下降到最後一段:鉤爪碰到凸頭的頂面,被撐開
  const opens = sweep(0.5, 100, 2 * H - 0.5).map((v) => m251.hook(v).open);
  assert.ok(Math.max(...opens) > 0.05, "鉤爪經過凸頭時被撐開");
  close(m251.hook(2 * H).open, 0, "落到底時鉤爪合攏,勾在寬頭底下", 1e-9);
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

test("第 277 種:把擊錘往後扳起時,爪 a 推轉輪背面的棘齒 b,轉輪轉過一個膛室;擊錘落下時轉輪不動(由接觸算)", () => {
  const step = (2 * Math.PI) / m277.CHAMBERS;
  const cocked = m277.colt(m277.COCK);
  close(cocked.cylinder, -step, "扳起一次轉一格", 1e-9);
  assert.ok(cocked.pin[1] > m277.colt(0).pin[1], "扳起時爪往上推");
  close(m277.colt(2 * m277.COCK).cylinder, -step, "擊錘落下時轉輪不動", 1e-9);
  const hands = sweep(2 * m277.COCK, 60, m277.COCK).map((v) => m277.colt(v).hand);
  assert.ok(Math.max(...hands) - Math.min(...hands) > 0.08, "落下時爪被齒背頂開、滑過齒尖(原文:爪 a 由彈簧 c 頂住棘齒)");
  for (const v of sweep(4 * m277.COCK, 120)) {
    const { hand, teeth } = m277.contactAt(v);
    for (const t of teeth) assert.ok(penetrationDepth(hand, t) < 2e-3, `主動量 ${v.toFixed(3)}:爪不穿進棘齒`);
  }
});

test("第 278 種:平台升降時棘爪縮在棘齒外;繩索斷裂時彈簧壓下 b,棘爪 d 被推進棘齒,阻止平台下降", () => {
  const { toothTip, B_UP, pitch, P, PAWL_TIP } = m278.geometry;
  assert.ok(m278.pawlReach(B_UP) < toothTip, "繩拉著時棘爪不碰棘齒");
  for (const p of sweep(P.brk - 0.01, 40)) {
    const { top, b } = m278.story(p);
    assert.ok(m278.pawlAt(top, b).joint + PAWL_TIP < toothTip, `進程 ${p.toFixed(2)}:升降時棘爪縮著`);
  }
  // 斷繩後:平台憑自重加速落下(每段落得比上一段多),落到棘齒上就停住
  const { T_LAND, top: landed } = m278.landing;
  const tops = [0, 1, 2, 3].map((k) => m278.story(P.brk + (k * T_LAND) / 3).top);
  assert.ok(tops[1] - tops[2] > tops[0] - tops[1] && tops[2] - tops[3] > tops[1] - tops[2], "斷繩後加速落下");
  const top0 = m278.story(P.brk).top;
  assert.ok(top0 - landed < pitch, "只落到下方最近的棘齒");
  for (const p of [P.brk + T_LAND + 0.01, (P.brk + P.mend) / 2, P.mend - 0.001]) {
    const s = m278.story(p);
    close(s.top, landed, "落到棘齒上就不再下降");
    assert.ok(m278.pawlAt(s.top, s.b).joint + PAWL_TIP > toothTip, "棘爪 d 被推進棘齒之間");
  }
  // 換上新繩後:繩拉緊、棘爪縮回,平台放回起點,整段連續(下一輪從同一個位置開始)
  const after = m278.story(P.tight);
  assert.ok(m278.pawlAt(after.top, after.b).joint + PAWL_TIP < toothTip, "繩拉緊後棘爪縮回");
  close(m278.story(0.99999).top, m278.story(0).top, "一輪結束時回到起點", 1e-6);
  for (const p of sweep(1, 400)) {
    const { pawl, teeth } = m278.contactAt(p);
    for (const t of teeth) assert.ok(penetrationDepth(pawl, t) < 2e-3, `進程 ${p.toFixed(3)}:棘爪不穿進棘齒`);
  }
});

test("第 244 種:測功計:軸轉動時輪 A 在木塊間轉,槓桿 D 由擋止 C、C' 限制;夾緊程度剛好時槓桿呈水平", () => {
  const def = m244.default;
  close(def.pose(1, "right").parts.leverD.angle, 0, "剛好時槓桿水平");
  assert.ok(def.pose(1, "loose").parts.leverD.angle < 0, "太鬆時槓桿被砝碼拉下,靠在 C 上");
  assert.ok(def.pose(1, "tight").parts.leverD.angle > 0, "太緊時槓桿被帶上去,頂住 C'");
  close(turned(def, "drumA", 0, 2), 2, "輪 A 隨軸轉動");
  close(turned(def, "leverD", 0, 2, "right"), 0, "槓桿不隨輪轉");
});

test("第 246 種:縮放圖器:以描摹點 B 描畫平面圖,鉛筆 A 畫出兩倍大小的圖形", () => {
  const C = m246.fixedC;
  for (const s of sweep(1, 40)) {
    const B = m246.planPoint(s);
    const { A } = m246.pantograph(B);
    close(dist(A, C), 2 * dist(B, C), "CA = 2·CB", 1e-9);
    close(len(sub(sub(A, C), [2 * (B[0] - C[0]), 2 * (B[1] - C[1]), 0])), 0, "C、B、A 共線", 1e-9);
  }
  const a = m246.pantograph(m246.planPoint(0.1)).A;
  const b = m246.pantograph(m246.planPoint(0.35)).A;
  close(dist(a, b), 2 * dist(m246.planPoint(0.1), m246.planPoint(0.35)), "圖上任兩點的距離放大兩倍", 1e-9);
});

test("第 252 種:把部件 D 上下移動,滾子 A 和 B 在溝槽 C 內以相同幅度、相反方向來回移動", () => {
  const rest = m252.rollers(0);
  for (const v of sweep(m252.RANGE[1], 6, m252.RANGE[0])) {
    const { a, b } = m252.rollers(v);
    close(a - rest.a, -(b - rest.b), "相同幅度、相反方向");
    assert.ok(b - a >= 2 * m252.ROLL - 1e-9, "兩滾子不互相穿透");
  }
  assert.ok(m252.rollers(0.5).b > rest.b, "D 往上時兩滾子分開");
  assert.ok(m252.rollers(m252.RANGE[0]).b - m252.rollers(m252.RANGE[0]).a < 2 * m252.ROLL + 0.05, "D 到最下面時兩滾子互相靠到");
});

test("第 273 種:當桿 A 和 B 被拉近時,桿 C 和 D 會被進一步推開,反之亦然", () => {
  const [lo, hi] = m273.RANGE;
  assert.ok(m273.spread(lo) > m273.spread(hi), "A、B 拉近時 C、D 推開");
  for (const w of sweep(hi, 10, lo)) close(Math.hypot(w, m273.spread(w)), m273.SIDE, "四根桿長度不變");
});

test("第 260 種:兩輪 D、E 轉速相同時螺桿不動;轉速不同時,螺桿依兩者的速度差移動", () => {
  const { F, D, B, E, PITCH } = m260;
  const turns = 3;
  const a = turns * 2 * Math.PI;
  const { d, e, shift } = m260.differential(a);
  const diff = (d - meshAngle(F, D, 0) - (e - meshAngle(B, E, 0))) / (2 * Math.PI);
  close(shift, PITCH * diff, "每差一圈移動一個螺距", 1e-9);
  assert.ok(Math.abs(shift) > 0.05, "兩輪轉速不同,螺桿移動");
  assert.notEqual(F.teeth / D.teeth, B.teeth / E.teeth, "兩組齒數比不同");
});

test("第 261 種:圓盤 B 轉動時重物 W 上下往復,下行程比上行程短(鼓輪持續把繩捲上來)", () => {
  const ys = sweep(m261.RANGE[1], 800).map((t) => m261.weight(t).yW);
  const strokes = [];
  let dir = Math.sign(ys[1] - ys[0]);
  let start = ys[0];
  for (let i = 1; i < ys.length; i++) {
    const d = Math.sign(ys[i] - ys[i - 1]);
    if (d && d !== dir) {
      strokes.push(ys[i - 1] - start);
      start = ys[i - 1];
      dir = d;
    }
  }
  const downs = strokes.filter((s) => s < 0).map(Math.abs);
  const ups = strokes.filter((s) => s > 0);
  assert.ok(downs.length && ups.length, "上下往復");
  assert.ok(Math.max(...downs) < Math.max(...ups), "下行程比上行程短");
  assert.ok(m261.weight(m261.RANGE[1]).yW > m261.weight(0).yW, "每轉一圈淨上升");
});

test("第 262–263 種:同一機構的前視圖與側視圖;錐體偏心地轉,滾子 C 往復,朝某一方向的運動比另一方向短", () => {
  for (const v of [0, 3, 9]) assert.deepEqual(fig262.pose(v).parts, fig263.pose(v).parts, "兩圖的零件姿勢一致");
  assert.notDeepEqual(fig262.view.direction, fig263.view.direction, "初始視角不同");
  const tops = sweep(cone.RANGE[1], 800).map((t) => cone.cone(t).top);
  let up = 0;
  let down = 0;
  for (let i = 1; i < tops.length; i++) {
    const d = tops[i] - tops[i - 1];
    if (d > 0) up += d;
    else down -= d;
  }
  assert.ok(up > 0.5 && down > 0.5, "滾子上下往復");
  assert.ok(Math.abs(up - down) > 0.1, "兩個方向的行程不等");
  close(cone.cone(2 * Math.PI).cx - cone.cone(0).cx, cone.PITCH, "螺桿每轉一圈前進一個螺距");
});

test("第 264 種:100 齒與 101 齒的蝸輪,在蝸桿 10,100 次旋轉期間,一個輪比另一個多轉一圈", () => {
  const [a, b] = m264.wheels(10100 * 2 * Math.PI);
  close(Math.abs(a - b), 2 * Math.PI, "多轉一圈", 1e-6);
  const [a1, b1] = m264.wheels(2 * Math.PI);
  close(Math.abs(a1) * 100, 2 * Math.PI, "蝸桿一圈,100 齒輪轉一齒");
  close(Math.abs(b1) * 101, 2 * Math.PI, "蝸桿一圈,101 齒輪轉一齒");
});

test("第 266 種:軸的旋轉使可動軸承直線移動,每旋轉一圈移動的距離等於兩螺距之差", () => {
  const one = m266.feed(2 * Math.PI);
  close(one.bearing - m266.feed(0).bearing, m266.P1 - m266.P2, "每圈 = 兩螺距之差");
  close(one.shaft, m266.P1, "軸每圈穿過固定軸承前進一個螺距");
});

test("第 265 種:圓錐形鼓輪規則轉動,摩擦滾子沿長度方向橫移,得到變速的旋轉運動", () => {
  const rates = sweep(12 * 2 * Math.PI, 60).map((t) => m265.roller(t).rate);
  assert.ok(Math.max(...rates) / Math.min(...rates) > 1.8, "滾子轉速隨位置改變");
  const { x, spin } = m265.roller(0.001);
  close(-spin / 0.001, m265.drumRadius(x) / m265.geometry.ROLLER, "滾子線速度 = 鼓輪在接觸處的線速度", 1e-3);
});

test("第 268 種:曲柄轉動時,擺動桿的端點往復運動", () => {
  const xs = sweep(2 * Math.PI, 72).map((t) => m268.rod(t).end[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.6, "桿端往復");
  close(m268.rod(2 * Math.PI).end[0], m268.rod(0).end[0], "曲柄一圈回到原處", 1e-9);
});

test("第 269 種:框架持續往同一方向直線移動,正齒輪得到交替方向的旋轉", () => {
  const [lo, hi] = m269.RANGE;
  const angles = sweep(lo, 400, hi).map(m269.gear); // 框架從右往左持續移動
  const steps = angles.slice(1).map((a, i) => Math.sign(a - angles[i])).filter(Boolean);
  const changes = steps.slice(1).filter((s, i) => s !== steps[i]).length;
  assert.ok(steps.includes(1) && steps.includes(-1), "齒輪兩個方向都轉");
  assert.equal(changes, 1, "先一個方向、再反方向");
  const { TOP, P, R } = m269.geometry;
  close(m269.gear(TOP.from - P) - m269.gear(TOP.from), P / R, "咬合時齒輪轉角 = 框架位移 / 節圓半徑");
});

test("第 272 種:斜面圓盤凸輪旋轉,靠在盤上的桿得到往復直線運動", () => {
  const ts = sweep(2 * Math.PI, 72).map(m272.rodTravel);
  assert.ok(Math.max(...ts) - Math.min(...ts) > 0.3, "桿往復");
  close(m272.rodTravel(2 * Math.PI), m272.rodTravel(0), "軸一圈回到原處", 1e-9);
  // 桿端是圓頭:圓頭的中心離盤面恰好一個半徑(貼著、不陷進去)
  const def = m272.default;
  const ball = def.parts.find((p) => p.id === "rod").pieces.find((p) => p.kind === "sphere").radius;
  for (const t of sweep(2 * Math.PI, 24)) {
    const tip = def.pose(t).parts.rod.position;
    const q = def.pose(t).parts.disc.rotation;
    // 盤面法線 = 盤的局部 z 轉到世界
    const [x, y, z, w] = q;
    const n = [2 * (x * z + w * y), 2 * (y * z - w * x), 1 - 2 * (x * x + y * y)];
    const d = Math.abs(n[0] * tip[0] + n[1] * tip[1] + n[2] * tip[2]);
    close(d, 0.16 + ball, `轉角 ${t.toFixed(2)}:圓頭貼著盤面`, 1e-6);
  }
});

test("第 276 種:凸輪橫跨中心所測的每個方向直徑皆相等,兩滾子始終貼著凸輪,桿往復直線運動", () => {
  for (const t of sweep(2 * Math.PI, 90)) {
    const f = m276.follower(t);
    close(f.right + f.left, m276.SPAN, "兩滾子的距離不變");
  }
  const xs = sweep(2 * Math.PI, 90).map((t) => m276.follower(t).x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.4, "桿往復");
});

test("第 279 種:曲柄轉動,套在曲柄手腕上的軸承盒在十字頭的槽裡滑動,十字頭往復直線運動", () => {
  const xs = sweep(2 * Math.PI, 72).map((t) => m279.crosshead(t).x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 1.4, "十字頭往復,行程 = 曲柄直徑");
  for (const t of sweep(2 * Math.PI, 12)) {
    const { pin, x } = m279.crosshead(t);
    close(pin[0], x, "軸承盒(曲柄銷)始終在槽的中線上", 1e-12);
  }
});

test("第 280 種:短槓桿外端往上時夾住輪緣、帶動輪轉;往下推時鬆開滑回,棘輪擋住輪不倒轉", () => {
  const { FROM, TO } = m280.geometry;
  const span = TO - FROM;
  const up = m280.capstan(span);
  close(up.wheel, span, "往上那一程輪跟著轉");
  const down = m280.capstan(2 * span);
  close(down.wheel, span, "往下那一程輪不動");
  close(down.block, FROM, "夾具滑回原位");
  const ws = sweep(6 * span, 300).map((v) => m280.capstan(v).wheel);
  assert.ok(ws.every((w, i) => i === 0 || w >= ws[i - 1] - 1e-12), "輪只朝一個方向轉");
  close(span / m280.geometry.pitch, 2, "每程棘輪轉過整兩齒,止回爪落回齒間");
  const pawl = sweep(span, 120).map(m280.pawlAngle);
  assert.ok(Math.max(...pawl) - Math.min(...pawl) > 0.05, "輪轉動時止回爪被齒背頂起、越過齒尖後落下");
  for (const v of sweep(2 * span, 120)) {
    const { pawl: p, teeth } = m280.contactAt(v);
    for (const t of teeth) assert.ok(penetrationDepth(p, t) < 2e-3, `主動量 ${v.toFixed(3)}:止回爪不穿進棘齒`);
  }
});

test("第 281 種:圓盤旋轉,槽內的銷使右側的槓桿振動(銷始終在槽裡)", () => {
  const angles = sweep(2 * Math.PI, 72).map(m281.lever);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.3, "槓桿振動");
  close(m281.lever(2 * Math.PI), m281.lever(0), "圓盤一圈一個來回", 1e-12);
});

test("第 282 種:圓盤轉動,直立桿擺動:底部的齒條交替直線運動,頂部的重物交替上下", () => {
  const racks = sweep(2 * Math.PI, 72).map((t) => m282.motion(t).rack);
  const ys = sweep(2 * Math.PI, 72).map((t) => m282.weight(t).y);
  assert.ok(Math.max(...racks) - Math.min(...racks) > 0.3, "齒條來回");
  assert.ok(Math.max(...ys) - Math.min(...ys) > 1, "重物上下");
  close(m282.motion(2 * Math.PI).rack, m282.motion(0).rack, "一圈回到原處", 1e-9);
});

test("第 283 種:手柄振動,經小齒輪使齒條上下移動;齒條移動量 = 小齒輪節圓上轉過的弧長", () => {
  const a = 0.5;
  close(m283.rack(a) - m283.rack(0), 0.55 * a * Math.sign(m283.rack(a) - m283.rack(0)), "位移 = 節圓半徑 × 轉角", 1e-9);
  assert.ok(m283.rack(-0.5) < m283.rack(0) === m283.rack(0.5) > m283.rack(0), "手柄來回,齒條上下");
  const def = m283.default;
  const y = (v, id) => def.pose(v).parts[id].position[1];
  close(y(0.5, "rackL") - y(0, "rackL"), -(y(0.5, "rack") - y(0, "rack")), "兩側的齒條反向移動同樣的量(兩缸輪流抽氣)");
});

test("第 284 種:曲柄每轉一圈,卡榫推棘輪前進一段,小齒輪帶平台的齒條前進;接點越遠進料越慢", () => {
  const slow = m284.feed(2 * Math.PI, "slow");
  const fast = m284.feed(2 * Math.PI, "fast");
  close(slow.wheel - m284.feed(0, "slow").wheel, slow.step, "一圈前進一段", 1e-9);
  assert.ok(fast.step > slow.step, "接點靠近支點時進料快");
  const ws = sweep(4 * Math.PI, 200).map((t) => m284.feed(t, "slow").wheel);
  assert.ok(ws.every((w, i) => i === 0 || w >= ws[i - 1] - 1e-9), "棘輪只往前");
  assert.ok(ws.slice(1).some((w, i) => w === ws[i]), "回程時棘輪不動");
  close(m284.feed(4 * Math.PI, "slow").carriage - m284.feed(0, "slow").carriage, -2 * slow.step * 0.42, "平台位移 = 小齒輪轉角 × 節圓半徑", 1e-9);
  // 每程推過幾齒由卡榫與齒相碰算出:進料慢一齒、進料快兩齒
  close(slow.step / m284.geometry.PITCH, 1, "進料慢:每轉一齒");
  close(fast.step / m284.geometry.PITCH, 2, "進料快:每轉兩齒");
  for (const state of ["slow", "fast"])
    for (const t of sweep(2 * Math.PI, 120)) {
      const { catch: c, click, teeth } = m284.contactAt(t, state);
      for (const tooth of teeth) {
        assert.ok(penetrationDepth(c, tooth) < 2e-3, `${state} 曲柄 ${t.toFixed(3)}:卡榫不穿進棘齒`);
        assert.ok(penetrationDepth(click, tooth) < 2e-3, `${state} 曲柄 ${t.toFixed(3)}:止回爪不穿進棘齒`);
      }
    }
  const clicks = sweep(2 * Math.PI, 120).map((t) => m284.feed(t, "slow").clickAngle);
  assert.ok(Math.max(...clicks) - Math.min(...clicks) > 0.05, "棘輪轉動時止回爪被齒背頂起、再落回齒間");
});

test("第 271 種:裝有兩根棘爪的槓桿振動時,棘齒桿得到近乎連續的直線運動(由接觸算)", () => {
  const S = m271.SWING;
  const xs = sweep(8 * S, 400).map((v) => m271.motion(v).x);
  assert.ok(xs.every((x, i) => i === 0 || x >= xs[i - 1] - 1e-12), "只朝一個方向(往右)");
  // 原文:當使裝有兩根棘爪的槓桿振動時,會將近乎連續的直線運動賦予棘齒桿
  const one = m271.motion(2 * S).x - m271.motion(0).x;
  const two = m271.motion(4 * S).x - m271.motion(2 * S).x;
  assert.ok(one > 0.1 && two > 0.1, "槓桿往兩個方向擺時都在拉");
  const cycle = m271.motion(4 * S).x - m271.motion(0).x;
  close(cycle / m271.pitch, Math.round(cycle / m271.pitch), "每個來回拉過整數個齒", 1e-6);
  for (const v of sweep(8 * S, 120)) {
    const { hooks, teeth } = m271.contactAt(v);
    for (const h of hooks) for (const t of teeth) assert.ok(penetrationDepth(h, t) < 2e-3, `主動量 ${v.toFixed(3)}:鉤不穿進齒`);
  }
});

test("第 274 種:轉速越快,球 K 沿拋物線臂 B 升得越高,桿 F 把套筒沿心軸往上帶", () => {
  const lo = m274.governor(2);
  const hi = m274.governor(9);
  assert.ok(hi.y > lo.y && hi.x > lo.x, "球(輪 L)往外往上");
  assert.ok(hi.sleeve > lo.sleeve, "套筒上升");
  for (const s of sweep(10, 10)) {
    const g = m274.governor(s);
    close(Math.hypot(g.x - g.contact, g.y - m274.parabola(g.contact)), m274.geometry.WHEEL_R, "輪 L 始終貼著臂 B 的拋物線曲面");
    assert.ok(g.y > m274.parabola(g.x), "輪 L 壓在曲面上面(由拋物線引導)");
  }
});

test("第 275 種:蝸桿的旋轉運動使齒條直線運動,每圈一個螺距", () => {
  close(m275.rack(2 * Math.PI) - m275.rack(0), m275.PITCH, "每圈一個螺距");
});

test("第 285 種:車床可動頭:轉動手輪,螺桿使心軸直線移動", () => {
  close(m285.extend(2 * Math.PI) - m285.extend(0), m285.PITCH, "手輪一圈,心軸移動一個螺距");
  assert.ok(m285.extend(m285.RANGE[1]) > 1, "心軸伸出");
});

test("第 286 種:搖臂軸上的曲面推頂子作用於升降器,把升降桿抬起", () => {
  const [lo, hi] = m286.RANGE;
  close(m286.lift(hi), 0, "推頂子沒轉時升降器停在原位", 1e-9);
  assert.ok(m286.lift(lo) > 0.4, "推頂子轉上來時升降桿被抬起");
  const lifts = sweep(lo, 40, hi).map(m286.lift);
  assert.ok(lifts.every((l, i) => i === 0 || l >= lifts[i - 1] - 1e-9), "轉得越多抬得越高");
});

test("第 287 種:彈簧屈服於球的離心力而抬起套筒;離心力減小時把球拉回心軸,套筒下降", () => {
  const slow = m287.governor(2);
  const fast = m287.governor(9);
  assert.ok(fast.bow > slow.bow, "高速時球離心軸較遠");
  assert.ok(fast.sleeve > slow.sleeve, "高速時套筒較高");
  for (const s of [0, 4, 10]) close(m287.springLength(s), m287.springLength(0), "彈簧長度不變", 1e-6);
});
