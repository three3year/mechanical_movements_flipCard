// 第十八章「雜項與旋轉引擎」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, turned, assertMeshFree } from "./helpers.js";

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

test("第 419 種:輪 A 轉動,輪 B 來回擺動;皮帶 C、D 拉著立柱,搖籃在搖桿 E 上來回搖", () => {
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
    const surface = [0, tip];
    close(Math.hypot(surface[0] - c[0], surface[1] - c[1]), m425.PISTON, "擋板下端貼著偏心輪");
    assert.ok(tip <= m425.BORE + 1e-9, "擋板不超出汽缸");
  }
  close(m425.abutment(Math.PI / 2), m425.BORE, "活塞的接觸點經過時,擋板完全退出");
  assert.ok(m425.abutment(-Math.PI / 2) < m425.BORE - 0.5, "活塞在對面時,擋板伸進汽缸隔開進汽與排汽");
});
