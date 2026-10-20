// 第十八章「雜項與旋轉引擎」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, turned, assertMeshFree, part, polyGap } from "./helpers.js";
import { add, sub, scale, dot, dist, rot2, quatRotate } from "../models/kit.js";
import { placeOutline, circlePolygon, edgeDistance, pointInPolygon } from "../models/contact.js";

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
