// 第十八章「雜項與旋轉引擎」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, turned, assertMeshFree } from "./helpers.js";
import { placeOutline, penetrationDepth, pointInPolygon } from "../models/contact.js";

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
