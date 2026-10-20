// 第二十章「蒸汽與氣體裝置」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, assertShaftInBearings } from "./helpers.js";
import { pointInPolygon, edgeDistance } from "../models/contact.js";

import * as m470 from "../models/fig470.js";
import * as m471 from "../models/fig471.js";
import * as m472 from "../models/fig472.js";
import * as m473 from "../models/fig473.js";
import * as m474 from "../models/fig474.js";
import fig475 from "../models/fig475.js";
import fig476 from "../models/fig476.js";

test("第 470 種:蒸汽錘:蒸汽引進活塞下方時錘升起,排出後錘落下打在砧上", () => {
  let prev = m470.hammer(0);
  for (const v of sweep(1, 100).slice(1)) {
    const h = m470.hammer(v);
    if (h.y > prev.y + 1e-9) assert.ok(h.steam, "錘上升時蒸汽在活塞下方");
    if (h.y < prev.y - 1e-9) assert.ok(!h.steam, "錘落下時已排汽");
    prev = h;
  }
  close(m470.hammer(0.9).y, m470.ANVIL_TOP, "最後打在砧上");
  close(m470.hammer(0.5).y, m470.ANVIL_TOP + m470.LIFT, "升到最高");
});

test("第 470 種:汽缸坐在機架的橫樑上、活塞全程在兩個蓋之間;活塞桿穿過橫樑的孔與填料函;砧坐在底座上", () => {
  const def = m470.default;
  const { y0, y1, cap } = m470.CYL;
  for (const v of sweep(1, 96)) {
    const p = m470.piston(v);
    assert.ok(p.bottom >= y0 + cap + 0.02, `進程 ${v.toFixed(2)}:活塞底在汽缸下蓋之上(${p.bottom.toFixed(3)})`);
    assert.ok(p.top <= y1 - cap - 0.02, `進程 ${v.toFixed(2)}:活塞頂在汽缸上蓋之下(${p.top.toFixed(3)})`);
  }
  const frame = part(def, "frame");
  const legs = frame.pieces.find((q) => q.role === "legs");
  close(Math.max(...legs.shape.outline.map(([, y]) => y)), y0, "汽缸底坐在橫樑頂面", 1e-9);
  const rod = part(def, "hammer").pieces.find((q) => q.role === "rod");
  const beamMid = [0, y0 - 0.225]; // 橫樑(y 1.25–1.7)的中心
  const hole = legs.shape.holes.find((h) => pointInPolygon(beamMid, h));
  assert.ok(hole && edgeDistance(beamMid, hole) >= rod.radius, "橫樑開了讓活塞桿穿過的孔");
  const anvil = frame.pieces.find((q) => q.role === "anvil");
  const base = frame.pieces.find((q) => q.role === "base");
  close(anvil.at[1] - anvil.size[1] / 2, base.at[1] + base.size[1] / 2, "砧坐在底座上", 1e-9);
  for (const v of [0, 0.3, 0.6, 0.9]) {
    const y = def.pose(v).parts.hammer.position[1] + rod.at[1];
    assertShaftInBearings({ at: [0, y, 0], axis: [0, 1, 0], radius: rod.radius, length: rod.length }, frame.pieces, "活塞桿");
  }
});

test("第 470 種:閥箱裡的滑閥由手柄扳動:進汽時汽道口通閥箱、排汽口被閥封住;排汽時閥的空腔把汽道口接到排汽口", () => {
  const def = m470.default;
  const { below, exhaust } = m470.PORTS;
  const within = ([a, b], [c, d]) => a >= c - 1e-9 && b <= d + 1e-9;
  let admitted = 0;
  let released = 0;
  for (const v of sweep(1, 200)) {
    const h = m470.hammer(v);
    const va = m470.valve(v);
    if (h.steam) {
      assert.ok(va.bottom > below[1] + 0.02, `進程 ${v.toFixed(3)}:進汽時汽道口在閥之下、通閥箱`);
      assert.ok(within(exhaust, va.lip), `進程 ${v.toFixed(3)}:進汽時排汽口被閥的下唇封住`);
      admitted++;
    }
    if (h.phase === "錘靠自重落下") {
      assert.ok(within(below, va.cavity) && within(exhaust, va.cavity), `進程 ${v.toFixed(3)}:排汽時汽道口與排汽口都在閥的空腔裡`);
      released++;
    }
  }
  assert.ok(admitted > 0 && released > 0, "有進汽也有排汽的時段");
  // 閥經閥桿、搖桿、長桿接到手柄:兩根連桿長度不變、閥桿只上下走、閥升得越高手柄扳得越往左
  const len = (p) => Math.hypot(p.from[0] - p.to[0], p.from[1] - p.to[1], p.from[2] - p.to[2]);
  const first = def.pose(0).parts;
  const rows = sweep(1, 60).map((v) => {
    const parts = def.pose(v).parts;
    for (const id of ["stemLink", "longRod"]) close(len(parts[id]), len(first[id]), `進程 ${v.toFixed(2)}:${id} 長度不變`, 1e-9);
    close(parts.valve.position[0], first.valve.position[0], "閥只上下走", 1e-9);
    close(parts.valve.position[2], first.valve.position[2], "閥只上下走", 1e-9);
    return { lift: m470.valve(v).lift, handle: parts.handle.angle };
  });
  rows.sort((a, b) => a.lift - b.lift);
  for (let i = 1; i < rows.length; i++) if (rows[i].lift - rows[i - 1].lift > 1e-6) assert.ok(rows[i].handle > rows[i - 1].handle, "閥升得越高,手柄扳得越往左");
  assert.ok(rows.at(-1).handle - rows[0].handle > 0.2, "手柄扳動的幅度看得出來");
  // 閥桿穿過閥箱頂的填料函
  const stem = part(def, "valve").pieces.find((q) => q.role === "stem");
  for (const v of [0, 0.5, 0.75]) {
    const p = def.pose(v).parts.valve.position;
    assertShaftInBearings({ at: [p[0] + stem.at[0], p[1] + stem.at[1], p[2] + stem.at[2]], axis: [0, 1, 0], radius: stem.radius, length: stem.length }, part(def, "frame").pieces, "閥桿");
  }
});

test("第 471 種:大氣錘:汽缸隨曲柄上下;錘的打擊發生在曲柄越過下死點之後", () => {
  const strikes = sweep(2 * Math.PI, 360).filter((t) => m471.hammer(t).strike);
  assert.ok(strikes.length > 0, "錘會打在砧上");
  // 下死點:曲柄銷在最低處(3π/2);打擊開始於它之後
  const first = Math.min(...strikes.filter((t) => t > Math.PI));
  assert.ok(first > 1.5 * Math.PI, "越過下死點之後才打擊");
  for (const t of sweep(2 * Math.PI, 72)) {
    const h = m471.hammer(t);
    assert.ok(h.piston <= h.cyl, "活塞留在汽缸裡");
  }
});

test("第 471 種:只有一個進氣孔 e(在汽缸壁的中段),汽缸上升與下降時空氣都從它進入", () => {
  const def = m471.default;
  const holes = def.parts.filter((p) => /^hole/.test(p.id));
  assert.deepEqual(holes.map((p) => p.label), ["e"], "只有孔 e");
  for (const t of sweep(2 * Math.PI, 24)) {
    const pose = def.pose(t).parts;
    const bottom = pose.cylinder.position[1];
    const e = pose[holes[0].id].position[1];
    close(e - bottom, m471.CYL_LEN / 2, "孔 e 在汽缸壁的中段(照原圖)", 1e-9);
  }
});

test("第 471 種:照原圖重排:汽缸 B 在窗口頂、曲柄 A 在窗口底的軸承裡、軸穿過錘身的長槽;錘身與汽缸凸緣貼著窗口兩側", () => {
  const def = m471.default;
  const frame = part(def, "frame");
  const crank = part(def, "crank");
  const hammer = part(def, "hammer");
  const column = frame.pieces.find((q) => q.role === "column");
  const window = column.shape.holes[0];
  const halfWindow = Math.max(...window.map(([x]) => x));
  const body = hammer.pieces.find((q) => q.role === "body");
  const halfBody = Math.max(...body.shape.outline.map(([x]) => x));
  assert.ok(halfWindow - halfBody > 0 && halfWindow - halfBody <= 0.02, `錘身貼著窗口兩側(間隙 ${(halfWindow - halfBody).toFixed(3)})`);
  const flange = Math.max(...part(def, "cylinder").pieces.find((q) => q.kind === "lathe").profile.map(([r]) => r));
  assert.ok(halfWindow - flange > 0 && halfWindow - flange <= 0.02, `汽缸的凸緣貼著窗口兩側(間隙 ${(halfWindow - flange).toFixed(3)})`);
  const shaft = crank.pieces.find((q) => q.role === "shaft");
  assertShaftInBearings({ at: [crank.center[0], crank.center[1], crank.center[2] + shaft.at[2]], radius: shaft.radius, length: shaft.length }, frame.pieces, "曲柄軸");
  const arm = crank.pieces.find((q) => q.kind === "plate");
  assert.ok(pointInPolygon([0, 0], arm.shape.outline), "曲柄臂套在軸上");
  const pin = crank.pieces.find((q) => q.role === "pin");
  const cylPin = part(def, "cylinder").pieces.find((q) => q.role === "pin");
  for (const t of sweep(2 * Math.PI, 48)) {
    const pose = def.pose(t).parts;
    assert.ok(crank.center[1] + 0.5 < pose.cylinder.position[1], `轉角 ${t.toFixed(2)}:曲柄在汽缸下方`);
    // 曲柄軸在錘身的長槽裡、不碰槽壁
    const slot = body.shape.holes[0].map(([x, y]) => [x + body.at[0] + pose.hammer.position[0], y + body.at[1] + pose.hammer.position[1]]);
    const c = [crank.center[0], crank.center[1]];
    assert.ok(pointInPolygon(c, slot) && edgeDistance(c, slot) >= shaft.radius - 1e-9, `轉角 ${t.toFixed(2)}:曲柄軸在錘身的長槽裡(離槽壁 ${edgeDistance(c, slot).toFixed(3)})`);
    // 桿 D 兩端接在曲柄銷與汽缸頂的銷上
    const [px, py] = [pin.at[0] * Math.cos(t) - pin.at[1] * Math.sin(t), pin.at[0] * Math.sin(t) + pin.at[1] * Math.cos(t)];
    close(Math.hypot(pose.rodD.from[0] - crank.center[0] - px, pose.rodD.from[1] - crank.center[1] - py), 0, "桿 D 下端在曲柄銷上", 1e-9);
    close(Math.hypot(pose.rodD.to[0] - pose.cylinder.position[0] - cylPin.at[0], pose.rodD.to[1] - pose.cylinder.position[1] - cylPin.at[1]), 0, "桿 D 上端在汽缸的銷上", 1e-9);
  }
});

test("第 471 種:活塞全程在汽缸裡(沒碰到兩個蓋)、活塞桿從底蓋伸出,錘身頂一直在汽缸底下", () => {
  const def = m471.default;
  const hammer = part(def, "hammer");
  const body = hammer.pieces.find((q) => q.role === "body");
  const bodyTop = body.at[1] + Math.max(...body.shape.outline.map(([, y]) => y));
  const piston = hammer.pieces.find((q) => q.role === "piston");
  for (const t of sweep(2 * Math.PI, 96)) {
    const h = m471.hammer(t);
    const pose = def.pose(t).parts;
    const bottom = pose.cylinder.position[1];
    const rel = h.piston - bottom;
    assert.ok(rel - piston.length / 2 >= m471.CAP + 0.02, `轉角 ${t.toFixed(2)}:活塞底在下蓋之上(${(rel - piston.length / 2).toFixed(3)})`);
    assert.ok(rel + piston.length / 2 <= m471.CYL_LEN - m471.CAP - 0.02, `轉角 ${t.toFixed(2)}:活塞頂在上蓋之下`);
    assert.ok(h.piston + bodyTop <= bottom - 0.03, `轉角 ${t.toFixed(2)}:錘身頂在汽缸底下`);
    if (!h.strike) close(h.piston, h.free, `轉角 ${t.toFixed(2)}:沒打在砧上時活塞照空氣墊的位置走(沒被蓋夾住)`, 1e-9);
  }
});

test("第 472 種:壓縮空氣錘:滑閥輪流把空氣送到活塞上方與下方;空氣由驅動軸帶動的空氣泵供應", () => {
  const ys = sweep(4 * Math.PI, 200).map((t) => m472.hammer(t));
  assert.ok(ys.some((h) => h.below) && ys.some((h) => !h.below), "空氣輪流進活塞下方與上方");
  for (let i = 1; i < ys.length; i++) {
    if (ys[i].y > ys[i - 1].y + 1e-9) assert.ok(ys[i].below, "錘上升時空氣在活塞下方");
  }
  assert.ok(ys.some((h) => Math.abs(h.y - m472.ANVIL_TOP) < 1e-9), "錘打到砧上");
  // 滑閥由驅動軸上的偏心輪推動:空氣送到哪一側由滑閥的位置決定;軸每轉一圈,錘打一下
  for (const t of sweep(4 * Math.PI, 80)) assert.equal(m472.hammer(t).below, m472.valve(t).shift > 0, "滑閥偏右時空氣進活塞下方");
  const strikes = sweep(4 * Math.PI, 400).filter((t, i, all) => i > 0 && m472.hammer(t).y <= m472.ANVIL_TOP + 1e-9 && m472.hammer(all[i - 1]).y > m472.ANVIL_TOP + 1e-9);
  assert.equal(strikes.length, 2, "軸轉兩圈打兩下");
  const pump = sweep(2 * Math.PI, 12).map((t) => m472.default.pose(t).parts.pumpPiston.position[1]);
  assert.ok(Math.max(...pump) - Math.min(...pump) > 0.5, "空氣泵隨驅動軸往復");
});

test("第 472 種:活塞 A 全程在汽缸 B 的兩個蓋之間(錘停在砧上時也是)", () => {
  const { y0, y1, cap } = m472.CYL;
  for (const t of sweep(2 * Math.PI, 96)) {
    const p = m472.piston(t);
    assert.ok(p.bottom >= y0 + cap + 0.02, `轉角 ${t.toFixed(2)}:活塞底在下蓋之上(${p.bottom.toFixed(3)})`);
    assert.ok(p.top <= y1 - cap - 0.02, `轉角 ${t.toFixed(2)}:活塞頂在上蓋之下(${p.top.toFixed(3)})`);
  }
});

test("第 472 種:驅動軸 E 架在機架的托架上;滑閥在閥箱裡滑、閥桿穿過閥箱壁的導座;泵筒 D 坐在底座上", () => {
  const def = m472.default;
  const frame = part(def, "frame");
  const shaftE = part(def, "shaftE");
  const shaft = shaftE.pieces.find((q) => q.role === "shaft");
  assertShaftInBearings({ at: [shaftE.center[0], shaftE.center[1], shaftE.center[2] + shaft.at[2]], radius: shaft.radius, length: shaft.length }, frame.pieces, "驅動軸 E");
  const valve = part(def, "valve");
  const rod = valve.pieces.find((q) => q.role === "rod");
  const walls = frame.pieces.filter((q) => q.role === "chest");
  assert.ok(walls.length >= 4, "閥箱有壁");
  const left = Math.max(...walls.map((q) => q.at[0] + q.size[0] / 2).filter((x) => x < m472.CYL.x));
  const right = Math.min(...walls.map((q) => q.at[0] - q.size[0] / 2).filter((x) => x > m472.CYL.x));
  const top = Math.min(...walls.map((q) => q.at[1] - q.size[1] / 2).filter((y) => y > m472.VALVE_Y));
  for (const t of sweep(2 * Math.PI, 48)) {
    const p = def.pose(t).parts.valve.position;
    assert.ok(p[0] - valve.size[0] / 2 > left && p[0] + valve.size[0] / 2 < right, `轉角 ${t.toFixed(2)}:滑閥在閥箱的兩壁之間`);
    assert.ok(p[1] + valve.size[1] / 2 < top, `轉角 ${t.toFixed(2)}:滑閥在閥箱頂之下`);
    assertShaftInBearings({ at: [p[0] + rod.at[0], p[1] + rod.at[1], p[2] + rod.at[2]], axis: [1, 0, 0], radius: rod.radius, length: rod.length }, frame.pieces, "閥桿");
  }
  const barrel = frame.pieces.find((q) => q.role === "barrel");
  const plate = frame.pieces.find((q) => q.kind === "plate" && q.role === "frame");
  const baseTop = Math.max(...plate.shape.outline.filter(([x]) => x < -1.2).map(([, y]) => y));
  close(barrel.at[1], baseTop, "泵筒坐在底座上", 1e-9);
});

test("第 473 種:空氣泵:倒扣的桶下降時空氣經上方的閥排出,提起時氣體經下方的閥吸上來", () => {
  const def = m473.default;
  for (const v of sweep(4 * 0.42, 40).slice(1)) {
    const b = m473.bell(v);
    if (b.phase.f < 0.2) continue; // 換向後瓣閥的開合過程(見 water.test.js 的瓣閥測試)
    const parts = def.pose(v).parts;
    assert.equal(Math.abs(parts.topValve.angle) > 0.3, !b.rising, "下降時上方的閥開");
    assert.equal(Math.abs(parts.pipeValve.angle) > 0.3, b.rising, "提起時下方的閥開");
  }
  assert.ok(m473.bell(0.1).top > m473.bell(0.001).top, "槓桿把手往下,桶被提起");
});

test("第 473 種:倒扣的桶口全程在水面下(提起時裡面才會稀薄、氣體才會經下方的閥上來)", () => {
  for (const v of sweep(4 * m473.SWING[1] * 2, 120)) {
    const rim = m473.bell(v).top - m473.BELL.len;
    assert.ok(rim <= m473.WATER - 0.05, `主動量 ${v.toFixed(3)}:桶口在水面下(桶口 ${rim.toFixed(3)}、水面 ${m473.WATER})`);
    assert.ok(rim > m473.OUTER.y0 + 0.2, `主動量 ${v.toFixed(3)}:桶口沒碰到大桶的底`);
  }
});

test("第 473 種:照原圖以繩子吊在槓桿上(兩根槓桿、兩條交叉的繩):繩接在桶頂的兩個耳上、長度不變,兩繩對稱,桶吊在中線上", () => {
  const def = m473.default;
  const bell = part(def, "bell");
  const lugs = bell.pieces.filter((q) => q.role === "lug");
  assert.equal(lugs.length, 2, "桶頂兩個耳");
  const len = (pts) => Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1], pts[1][2] - pts[0][2]);
  const first = def.pose(0);
  for (const v of sweep(4 * m473.SWING[1] * 2, 60)) {
    const { parts, paths } = def.pose(v);
    close(parts.leverR.angle, -parts.leverL.angle, `主動量 ${v.toFixed(3)}:兩根槓桿同步、反向擺`, 1e-9);
    close(parts.bell.position[0], 0, "桶吊在中線上", 1e-9);
    for (const id of ["ropeL", "ropeR", "ropeHandleL", "ropeHandleR"]) close(len(paths[id].points), len(first.paths[id].points), `主動量 ${v.toFixed(3)}:${id} 長度不變`, 1e-9);
    const end = (id) => paths[id].points.at(-1);
    const lugOf = (p) => lugs.find((q) => Math.abs(parts.bell.position[0] + q.at[0] - p[0]) < 1e-9 && Math.abs(parts.bell.position[1] + q.at[1] - p[1]) < 0.15);
    assert.ok(lugOf(end("ropeL")) && lugOf(end("ropeR")) && lugOf(end("ropeL")) !== lugOf(end("ropeR")), "兩條繩各接在一個耳上");
    const dxL = paths.ropeL.points[0][0] - end("ropeL")[0];
    const dxR = paths.ropeR.points[0][0] - end("ropeR")[0];
    assert.ok(dxL > 0.3 && dxR < -0.3, `主動量 ${v.toFixed(3)}:兩條繩交叉(左耳的繩往右上、右耳的繩往左上)`);
    close(dxL, -dxR, "兩繩對稱,水平分力抵消", 1e-9);
    close(parts.handleL.position[1], paths.ropeHandleL.points.at(-1)[1], "把手吊在外端的繩下", 1e-9);
  }
});

test("第 474 種:汽轉球:蒸汽從彎臂噴出,球朝反方向轉(反作用,與巴克氏水車同理)", () => {
  const da = 1e-4;
  for (const a of sweep(2 * Math.PI, 12)) {
    const now = m474.nozzles(a);
    const next = m474.nozzles(a + da);
    now.forEach((n, k) => {
      const v = [next[k].tip[1] - n.tip[1], next[k].tip[2] - n.tip[2]];
      assert.ok(v[0] * n.dir[1] + v[1] * n.dir[2] < 0, "噴口往噴汽的反方向走");
    });
  }
  assert.ok(m474.default.pose(0.3).parts.sphere.angle > 0);
});

test("第 475、476 種:噴射泵:蒸汽朝排水管噴出,水從吸水管被吸上來,連續往上流", () => {
  for (const def of [fig475, fig476]) {
    const [steam, water] = def.pose(0.37).flows;
    assert.equal(steam.fluid, "steam");
    assert.equal(water.fluid, "water");
    assert.ok(Math.min(...water.points.map((p) => p[1])) < -1.5, "水從下面的吸水管進來");
    assert.ok(Math.max(...water.points.map((p) => p[1])) > 1.5, "從上面的排水管出去");
    assert.ok(Math.max(...steam.points.map((p) => p[1])) > 1.5, "蒸汽朝排水管噴");
  }
});

import * as m477 from "../models/fig477.js";
import * as m478 from "../models/fig478.js";
import * as gas from "../models/gasometer.js";
import fig479 from "../models/fig479.js";
import fig480 from "../models/fig480.js";
import * as m481 from "../models/fig481.js";
import * as m482 from "../models/fig482.js";
import * as m483 from "../models/fig483.js";

test("第 477 種:蒸汽疏水器:有蒸汽時閥門被頂上封住;冷凝水積多、閥冷卻後落下排水", () => {
  for (const v of sweep(1, 100)) {
    const t = m477.trap(v);
    if (t.temp > 0.9) close(t.valve, m477.CLOSED, "蒸汽:閥門頂到 a、a 封住");
    if (t.temp < 0.3) close(t.valve, m477.OPEN, "冷卻:閥門落下");
    if (t.draining) assert.ok(t.valve < m477.CLOSED, "排水時閥門是開的");
  }
  assert.ok(sweep(1, 100).some((v) => m477.trap(v).draining), "會排水");
});

test("第 478 種:Ray 疏水器:管裡是水時管子短、閥門開;是蒸汽時管子伸長頂住柱塞、閥門關", () => {
  assert.ok(m478.trap(0).open, "水:閥門打開");
  assert.ok(!m478.trap(1).open, "蒸汽:閥門關閉");
  assert.ok(m478.trap(1).end > m478.trap(0).end, "受熱伸長");
  for (const t of sweep(1, 20)) {
    const s = m478.trap(t);
    assert.ok(s.plunger >= m478.STOP - 1e-12, "柱塞被槓桿推到擋止為止");
    assert.ok(s.plunger >= s.end - 1e-12, "管端不會穿過柱塞");
    // 由接觸算:加重的肘形槓桿 D 鉸在固定的支點上,下臂的左側面貼著柱塞右端的下緣
    const a = s.lever;
    const corner = [s.plunger + m478.PLUNGER - m478.PIVOT[0], -m478.PLUNGER_R - m478.PIVOT[1]];
    close(-corner[0] * Math.cos(a) - corner[1] * Math.sin(a), m478.ARM_W / 2, "下臂的側面貼著柱塞端", 1e-6);
  }
  assert.ok(m478.trap(1).lever > m478.trap(0).lever, "管子膨脹時柱塞把槓桿推回(重球抬起)");
});

test("第 479、480 種:儲氣槽:氣體進入時容器 A 上升,而且下緣一直浸在水裡", () => {
  for (const def of [fig479, fig480]) {
    const lo = def.pose(0.1).parts.bell.position[1];
    const hi = def.pose(0.9).parts.bell.position[1];
    assert.ok(hi > lo, `第 ${def.figure} 種:氣量多,A 升高`);
    assert.ok(gas.bellBottom(1) < gas.WATER, "A 的下緣始終在水面下(封住氣體)");
  }
  // 第 479 種:A 上升時重物 C 下降
  const w = (g) => fig479.pose(g).parts.weightL.position[1];
  assert.ok(w(0.9) < w(0.1), "重物隨 A 上升而下降(部分平衡)");
});

test("第 481 種:濕式氣錶:水面在中心以上;氣體依序進入各隔室,鼓轉一圈通過四室的氣", () => {
  assert.ok(m481.WATER > 0, "注水到中心以上");
  const seen = new Set(sweep(1, 200).map((p) => m481.filling(-2 * Math.PI * p)).filter((k) => k >= 0));
  assert.equal(seen.size, m481.CHAMBERS, "四個隔室輪流進氣");
  assert.match(m481.default.pose(1).readouts[0].value, /^4\.0/, "轉一圈記下四室");
});

test("第 482 種:氣體調節器:主管壓力增加時杯子 H 升起、閥 D 沒入水銀,缺口縮小,送出的氣量大致不變", () => {
  const lo = m482.regulate(0.8);
  const hi = m482.regulate(1.4);
  assert.ok(hi.lift > lo.lift, "壓力大,杯子升高");
  assert.ok(hi.drop > lo.drop, "閥被槓桿壓低");
  assert.ok(hi.opening < lo.opening, "缺口 b 縮小");
  assert.ok(Math.abs(hi.flow - lo.flow) < 0.5 * (1.4 - 0.8), "送出的氣量變化遠小於壓力變化");
});

test("第 483 種:乾式氣錶:兩個風箱腔室輪流充氣,滑閥 B 由腔室帶動,錶盤記錄次數", () => {
  for (const v of sweep(1, 24)) {
    const m = m483.meter(v);
    assert.ok(Math.abs(m.d[0]) <= m483.STROKE + 1e-12 && Math.abs(m.d[1]) <= m483.STROKE + 1e-12);
  }
  const fills = sweep(1, 100).map((v) => m483.meter(v).filling);
  assert.ok(fills.some((f) => f[0] && !f[1]) && fills.some((f) => !f[0] && f[1]), "兩個腔室輪流進氣");
  assert.ok(m483.meter(1).dial < m483.meter(0).dial, "錶盤指針隨通過的氣量轉");
});
