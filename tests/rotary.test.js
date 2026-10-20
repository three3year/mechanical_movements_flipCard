// 第十八章「雜項與旋轉引擎」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, turned, assertMeshFree, part, plateLayers, polyGap } from "./helpers.js";
import { placeOutline, penetrationDepth, pointInPolygon, edgeDistance, circlePolygon } from "../models/contact.js";
import { rot2, deg } from "../models/kit.js";
import { rect } from "../models/shapes.js";

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
