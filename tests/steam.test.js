// 第二十章「蒸汽與氣體裝置」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, turned, assertOnePiece, assertShaftInBearings, assertBoxesOnePiece, polyGap, inSolid, plateLayers, sectionSolids } from "./helpers.js";
import { X, Y } from "../models/kit.js";
import { penetrationDepth, edgeDistance, pointInPolygon } from "../models/contact.js";

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

// 點 q(零件局部座標)在繞 y 的旋轉體附件裡:剖面多邊形之內、角度在 cut..cut+sweep 之間(角 0 是 +x、π/2 是 −z,見 section.js)
function inYLathe(q, piece) {
  assert.ok(!piece.axis || piece.axis[1] === 1, "繞 y 的旋轉體");
  const [ax, ay, az] = piece.at ?? [0, 0, 0];
  const [x, y, z] = [q[0] - ax, q[1] - ay, q[2] - az];
  if (!pointInPolygon([Math.hypot(x, z), y], piece.profile)) return false;
  const sweep = piece.sweep ?? 2 * Math.PI;
  const a = (((Math.atan2(-z, x) - (piece.cut ?? 0)) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return a <= sweep + 1e-9;
}

test("第 471 種:孔 e 真的開在汽缸壁上:孔心在壁厚之內、不在任何實體裡(空氣進得去),四周是壁;汽缸仍是一件", () => {
  const def = m471.default;
  const cyl = part(def, "cylinder");
  const walls = cyl.pieces.filter((q) => q.kind === "lathe");
  const inWall = (q) => walls.some((w) => inYLathe(q, w));
  const [ex, ey, ez] = m471.HOLE_E; // 汽缸局部
  const r = Math.hypot(ex, ez);
  const dir = [ex / r, ez / r];
  const at = (rr, y, turn = 0) => {
    const [c, s] = [Math.cos(turn), Math.sin(turn)];
    return [rr * (dir[0] * c - dir[1] * s), y, rr * (dir[0] * s + dir[1] * c)];
  };
  // 孔的上下方同一方向上量壁的內外半徑
  const span = (y) => {
    const rs = sweep(0.6, 600).filter((rr) => inWall(at(rr, y)));
    return [Math.min(...rs), Math.max(...rs)];
  };
  for (const dy of [-0.12, 0.12]) {
    const [r0, r1] = span(ey + dy);
    assert.ok(r1 - r0 > 0.03 && r > r0 && r < r1, `孔心(半徑 ${r.toFixed(3)})在壁厚 ${r0.toFixed(3)}–${r1.toFixed(3)} 之內`);
  }
  // 孔穿透壁:從壁內到壁外整條徑向線都不在實體裡
  for (const rr of sweep(r + 0.08, 40, r - 0.08)) assert.ok(!inWall(at(rr, ey)), `孔心那條徑向線在半徑 ${rr.toFixed(3)} 不在壁裡`);
  assert.ok(!cyl.pieces.some((q) => q.accent), "不是記號色的實心小圓柱");
  // 四周是壁(孔,不是整圈或整段開口)
  for (const q of [at(r, ey + 0.1), at(r, ey - 0.1), at(r, ey, 0.25), at(r, ey, -0.25)]) assert.ok(inWall(q), `孔的四周 (${q.map((c) => c.toFixed(2))}) 是壁`);
  // 活塞全程不會蓋到孔心(活塞在壁內側)
  const piston = part(def, "hammer").pieces.find((q) => q.role === "piston");
  assert.ok(piston.radius < r - 0.02, "活塞在壁的內側");
  // 標籤 e 指在孔上
  for (const t of sweep(2 * Math.PI, 12)) {
    const pose = def.pose(t).parts;
    const hole = pose.holeE.position.map((c, i) => c - pose.cylinder.position[i]);
    close(Math.hypot(hole[0] - ex, hole[1] - ey, hole[2] - ez), 0, "標籤 e 在孔上", 1e-9);
  }
  assertBoxesOnePiece(def, "cylinder");
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

test("第 474 種:原圖四根彎臂間隔 90°、噴口同一個轉向;鍋爐有蓋、兩根管穿過蓋立在蓋上;樞軸短管套進球兩側的軸頸", () => {
  const def = m474.default;
  const c = m474.SPHERE.center;
  const n = m474.nozzles(0);
  assert.equal(n.length, 4, "a number of bent arms:原圖四根");
  const angles = n.map(({ tip }) => Math.atan2(tip[2] - c[2], tip[1] - c[1])).sort((a, b) => a - b);
  for (let k = 1; k < 4; k++) close(angles[k] - angles[k - 1], Math.PI / 2, "四根臂等距 90°", 1e-9);
  for (const { tip, dir } of n) {
    const t = [-(tip[2] - c[2]), tip[1] - c[1]]; // 轉動平面(y, z)上、球往 +a 轉時噴口前進的切線方向
    assert.ok(dir[1] * t[0] + dir[2] * t[1] < -0.9 * Math.hypot(...t) * Math.hypot(dir[1], dir[2]), "每個噴口都沿切線、逆著同一個轉向噴(反作用)");
  }
  // 鍋爐有蓋:蓋(剖開後半的旋轉體)蓋住碗口,半徑不小於碗口的外半徑、蓋底貼著碗口頂;兩根管的下端在蓋底之下(穿過蓋伸進鍋爐)
  const boiler = part(def, "boiler");
  const bowl = boiler.pieces[0];
  const lid = boiler.pieces.find((q) => q.role === "lid");
  assert.ok(lid, "鍋爐有蓋");
  const rimTop = bowl.at[1] + Math.max(...bowl.profile.map(([, y]) => y));
  const rimR = Math.max(...bowl.profile.map(([r]) => r));
  close(lid.at[1] + Math.min(...lid.profile.map(([, y]) => y)), rimTop, "蓋底貼著碗口頂", 1e-9);
  assert.ok(Math.max(...lid.profile.map(([r]) => r)) >= rimR - 1e-9, "蓋蓋住整個碗口");
  const pipes = boiler.pieces.filter((q) => q.role === "pipe");
  assert.equal(pipes.length, 2, "兩根管子");
  for (const q of pipes) {
    assert.ok(q.at[1] - q.length / 2 < lid.at[1] + Math.min(...lid.profile.map(([, y]) => y)) - 1e-9, "管子的下端穿過蓋伸進鍋爐");
    close(q.at[1] + q.length / 2, c[1], "管子的上端到球心的高度(兼樞軸)", 1e-9);
  }
  // 樞軸短管(鍋爐的一部分)套進球兩側的軸頸(球的附件;球的局部 z 是世界 x):軸頸的孔套著短管、短管穿過整個軸頸
  const sphere = part(def, "sphere");
  const necks = sphere.pieces.filter((q) => q.inner).map((q) => ({ ...q, axis: X, at: [q.at[2] + c[0], q.at[1] + c[1], -q.at[0] + c[2]] }));
  const stubs = boiler.pieces.filter((q) => q.role === "stub");
  assert.equal(stubs.length, 2, "兩根樞軸短管");
  for (const stub of stubs) {
    const side = Math.sign(stub.at[0]);
    assertShaftInBearings({ ...stub, at: stub.at, axis: X }, necks.filter((q) => Math.sign(q.at[0]) === side), `樞軸短管(${side > 0 ? "右" : "左"})`);
    assert.ok(side * (stub.at[0] - (side * stub.length) / 2) >= m474.SPHERE.r - 1e-9, "短管的內端到球面為止、不伸進球體");
  }
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

// 剖面圖裡的管是兩道壁(板件)夾著流體:點在兩道壁之間、不在壁裡,而且左右各有一道壁在管寬以內
function assertSectionedPipe(def, id, role, points, halfWidth, what) {
  const layers = plateLayers(part(def, id)).filter((l) => l.role === role);
  assert.ok(layers.length >= 2, `${what}是兩道壁的剖面`);
  let inside = 0;
  for (const q of points) {
    const walls = layers.filter((l) => edgeDistance(q, l.solid.outline) <= halfWidth + 1e-9 || inSolid(q, l.solid));
    if (!walls.length) continue;
    inside++;
    assert.ok(walls.every((l) => !inSolid(q, l.solid)), `${what}:流體點〔${q[0].toFixed(2)}, ${q[1].toFixed(2)}〕不在管壁裡`);
    assert.ok(walls.length >= 2, `${what}:流體點〔${q[0].toFixed(2)}, ${q[1].toFixed(2)}〕的兩側都有壁`);
  }
  assert.ok(inside > 3, `${what}:有流體點走在管裡`);
}

test("第 475 種:蒸汽管 A 照原圖是剖開的管(兩道壁),蒸汽從兩道壁之間噴向排水管", () => {
  const [steam] = fig475.pose(0.37).flows;
  assertSectionedPipe(fig475, "body", "steamPipe", steam.points.filter((q) => q[0] > 0.2), 0.2, "第 475 種蒸汽管 A");
});

test("第 476 種:叉形管的壁連成一件:兩腿的外壁接上 C 的壁(間隙 0)、兩片內壁在分叉處合成拱(間隙 0);噴射管是剖開的管、穿過拱上的孔", () => {
  const body = part(fig476, "body");
  const discharge = part(fig476, "discharge");
  const wall = (p, role) => plateLayers(p).filter((l) => l.role === role).map((l) => l.solid.outline);
  for (const side of ["L", "R"]) {
    const [outer] = wall(body, `outer${side}`);
    const [c] = wall(discharge, `wall${side}`);
    assert.ok(outer && c, `${side} 側有外壁與 C 的壁`);
    close(polyGap(outer, c), 0, `${side} 側外壁接上 C 的壁`, 1e-6);
  }
  const [innerL] = wall(body, "innerL");
  const [innerR] = wall(body, "innerR");
  const jet = wall(body, "jet");
  assert.ok(innerL && innerR, "兩片內壁");
  // 兩片內壁在分叉處合成拱:各自接著噴射管的壁(噴射管穿過拱上的孔),兩片之間只隔著噴射管
  assert.ok(jet.some((w) => polyGap(innerL, w) < 1e-6) && jet.some((w) => polyGap(innerR, w) < 1e-6), "拱的兩半各接上噴射管的壁(孔的兩側)");
  assert.ok(polyGap(innerL, innerR) < 2 * 0.12 + 0.06 + 1e-6, "拱的兩半之間只隔著噴射管");
  const [steam, water] = fig476.pose(0.37).flows;
  assertSectionedPipe(fig476, "body", "jet", steam.points.filter((q) => q[1] < 0.7 && q[0] < 0.6), 0.2, "第 476 種噴射管");
  // 水點在兩腿與 C 的管裡,不在壁裡
  for (const q of water.points) for (const l of [...plateLayers(body), ...plateLayers(discharge)]) if (q[2] >= l.z0 && q[2] <= l.z1) assert.ok(!inSolid(q, l.solid), `水點〔${q[0].toFixed(2)}, ${q[1].toFixed(2)}〕不在壁裡`);
});

import * as m477 from "../models/fig477.js";
import * as m478 from "../models/fig478.js";
import * as gas from "../models/gasometer.js";
import fig479, { PULLEY_Y, PULLEY_R, WEIGHT_R } from "../models/fig479.js";
import fig480 from "../models/fig480.js";
import * as m481 from "../models/fig481.js";
import * as m482 from "../models/fig482.js";
import * as m483 from "../models/fig483.js";

test("第 477 種:蒸汽疏水器(照原圖):蒸汽把閥裡的液體加熱、隔膜鼓起把閥身頂到閥座 a、a(閥肩與盒蓋開口下緣的錐面間隙 0,封住 A);冷卻時隔膜收縮、閥身落下、A 打開,水經盒子從橋架下方進 B", () => {
  const def = m477.default;
  const body = part(def, "body");
  const shell = body.pieces.find((q) => q.role === "shell");
  const bridge = body.pieces.find((q) => q.role === "bridge");
  const valve = part(def, "valve");
  const dia = part(def, "diaphragm");
  assert.ok(shell && bridge && valve && dia, "盒(含蓋、A、B)、橋架、閥身 D、隔膜");
  const bridgeTop = Math.max(...bridge.shape.outline.map((q) => q[1])) + (bridge.at?.[1] ?? 0);
  const shellPoly = shell.profile.map(([r, y]) => [r, y + (shell.at?.[1] ?? 0)]);
  const apexZ = Math.min(...dia.profile.map(([, z]) => z));
  let closed = 0;
  let opened = 0;
  let drained = 0;
  for (const v of sweep(1, 100)) {
    const t = m477.trap(v);
    const pose = def.pose(v);
    const vy = pose.parts.valve.position[1];
    const valvePoly = valve.profile.map(([r, y]) => [r, y + vy]);
    // 閥身的肩對閥座 a、a(都是旋轉體,拿 (r, y) 剖面比):全程不穿入;熱時間隙 0(封住 A)、冷時打開
    assert.ok(penetrationDepth(shellPoly, valvePoly) < 1e-6, `閥身不穿進盒與閥座(v=${v.toFixed(2)})`);
    const gap = polyGap(shellPoly, valvePoly);
    if (t.temp > 0.9) (close(gap, 0, "蒸汽:隔膜膨脹把閥門抬升到閥座 a、a,封住 A", 1e-6), closed++);
    if (t.temp < 0.3) (assert.ok(gap > 0.05, "冷卻:閥門下降,A 打開"), opened++);
    // 隔膜的邊接在閥身的底緣,鼓起的頂點(最低點)一直坐在出口 B 上方的橋架頂上;閥身升起的量就是隔膜鼓起的量
    const d = pose.parts.diaphragm;
    close(d.position[1], vy, "隔膜的邊在閥身的底緣", 1e-9);
    close(d.position[1] + apexZ * d.scale[2], bridgeTop, "隔膜支撐於出口管上方的橋架上", 1e-9);
    if (t.draining) {
      drained++;
      assert.ok(gap > 0.05, "排水時閥門是開的");
      const water = pose.flows.find((f) => f.fluid === "water");
      assert.ok(water && water.points.length > 5, "有水在流");
      const ys = water.points.map((q) => q[1]);
      assert.ok(Math.max(...ys) > m477.BOX.y1 && Math.min(...ys) < m477.BOX.y0, "水從 A 經盒子流到 B");
      // 水點不穿過閥身、隔膜(旋轉體:比 (r, y))與橋架(板:比 (x, y) 與深度)
      for (const q of water.points) {
        const rq = [Math.hypot(q[0], q[2]), q[1]];
        assert.ok(!pointInPolygon(rq, valvePoly), `水點〔${q[0].toFixed(2)}, ${q[1].toFixed(2)}〕不穿過閥身`);
        assert.ok(!pointInPolygon(rq, dia.profile.map(([r, z]) => [r, d.position[1] + z * d.scale[2]])), "水點不穿過隔膜");
        const bz = bridge.at?.[2] ?? 0;
        if (Math.abs(q[2] - bz) <= (bridge.thickness ?? 0.2) / 2) assert.ok(!inSolid([q[0] - (bridge.at?.[0] ?? 0), q[1] - (bridge.at?.[1] ?? 0)], bridge.shape), "水點不穿過橋架");
      }
    }
    if (t.temp > 0.9) {
      const steam = pose.flows.find((f) => f.fluid === "steam");
      assert.ok(!steam || steam.points.every((q) => q[1] >= m477.SEAT[0][1] - 1e-9), "閥門封住時蒸汽留在 A 裡");
    }
  }
  assert.ok(closed > 5 && opened > 5 && drained > 5, "有封住、打開與排水的時段");
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

test("第 478 種:槓桿 D 的支架立在底座上;擋止螺絲 b 裝在槓桿下端(頭在右),柱塞推到擋止時尖端頂著擋止 c;管子與柱塞各穿過球殼上填料函的孔", () => {
  const def = m478.default;
  assertBoxesOnePiece(def, "base");
  const base = part(def, "base");
  const lever = part(def, "lever");
  const screw = lever.pieces.find((q) => q.role === "screw");
  const stop = base.pieces.find((q) => q.role === "stop");
  assert.ok(screw && stop, "有擋止螺絲 b 與擋止 c");
  assert.ok(screw.at[0] + screw.length / 2 > m478.ARM_W / 2 && screw.at[0] - screw.length / 2 < -m478.ARM_W / 2, "螺絲穿過下臂、頭在右邊");
  const tipAt = (t) => {
    const a = m478.trap(t).lever;
    const [x, y] = [screw.at[0] - screw.length / 2, screw.at[1]];
    return [m478.PIVOT[0] + x * Math.cos(a) - y * Math.sin(a), m478.PIVOT[1] + x * Math.sin(a) + y * Math.cos(a)];
  };
  const cRight = stop.at[0] + stop.size[0] / 2;
  const tip0 = tipAt(0);
  close(tip0[0] - cRight, 0, "管裡是水:柱塞推到擋止為止,螺絲尖端頂著擋止 c(間隙 0)", 1e-6);
  assert.ok(Math.abs(tip0[1] - stop.at[1]) < stop.size[1] / 2, "尖端頂在 c 的高度範圍內");
  assert.ok(tipAt(1)[0] - cRight > 0.05, "管子膨脹把槓桿推回時,螺絲離開擋止");
  for (const t of sweep(1, 20)) assert.ok(tipAt(t)[0] - cRight > -1e-6, "螺絲尖端不穿進擋止");
  // 球殼(剖面的環)在管子、柱塞與出口處都開著孔:環的各段在那裡斷開,管子與柱塞從孔中穿過、不碰環
  const arcs = plateLayers(base).filter((l) => l.role === "shell");
  assert.ok(arcs.length >= 3, "球殼的環在三個孔處斷成幾段");
  const pipe = part(def, "pipe");
  const plunger = part(def, "plunger");
  const probe = (x, r) => arcs.every((l) => !inSolid([x, 0], l.solid) && Math.min(edgeDistance([x, r], l.solid.outline), edgeDistance([x, -r], l.solid.outline)) > 0.01);
  const shell = m478.SHELL;
  assert.ok(probe(shell.center[0] - shell.r, pipe.radius), "管子從左邊的孔穿過球殼");
  assert.ok(probe(shell.center[0] + shell.r, plunger.radius), "柱塞從右邊的孔穿過球殼");
  const glands = base.pieces.filter((q) => q.role === "gland");
  assert.ok(glands.some((q) => q.at[0] < shell.center[0]) && glands.some((q) => q.at[0] > shell.center[0]), "兩側都有填料函");
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

test("第 479、480 種:兩根氣管插進槽底、穿出槽外(原文「插入槽底的兩根管子」);氣的點沿管子走,不穿過槽底", () => {
  const pipes = gas.tankParts().filter((q) => q.role === "pipe");
  assert.ok(pipes.length >= 2, "兩根氣管");
  const lowest = Math.min(...pipes.map((q) => q.at[1] - (q.axis?.[1] ? q.length / 2 : q.radius)));
  assert.ok(lowest < gas.TANK.y0 - 0.2, `管子穿出槽底(最低 ${lowest.toFixed(2)},槽底 ${gas.TANK.y0})`);
  const horizontal = pipes.filter((q) => q.axis?.[0]);
  assert.equal(horizontal.length, 2, "穿出槽底後各橫著伸出");
  for (const g of [0.2, 0.8]) {
    for (const p of gas.gasFlows(g)[0].points) {
      // 槽底的板:y0..y0+0.08、x 在槽內;點只能在管子裡穿過它
      if (p[1] > gas.TANK.y0 - 1e-9 && p[1] < gas.TANK.y0 + 0.08 + 1e-9) assert.ok(pipes.some((q) => q.axis?.[1] && Math.abs(p[0] - q.at[0]) <= q.radius + 1e-9), `氣的點 (${p[0]}, ${p[1]}) 在管子裡穿過槽底`);
    }
  }
});

test("第 479 種:立柱立在槽旁的地面上(機架是一件);重球升到最高停在滑輪下、降到最低不碰地面", () => {
  assertBoxesOnePiece(fig479, "frame");
  const ground = part(fig479, "frame").pieces.filter((q) => q.role === "ground");
  assert.equal(ground.length, 2, "槽兩旁的地面(原圖的斜線)");
  for (const q of ground) close(q.at[1] + q.size[1] / 2, gas.TANK.y1, "地面與槽頂齊平", 1e-9);
  for (const g of sweep(1, 48)) {
    const p = fig479.pose(g).parts;
    for (const k of ["L", "R"]) {
      const top = p[`weight${k}`].position[1] + WEIGHT_R;
      assert.ok(top < PULLEY_Y - PULLEY_R - 0.3, `重球(頂 ${top.toFixed(2)})停在滑輪下(滑輪底 ${(PULLEY_Y - PULLEY_R).toFixed(2)})`);
      assert.ok(p[`weight${k}`].position[1] - WEIGHT_R > gas.TANK.y1 + 0.05, "重球不碰地面");
    }
  }
});

test("第 479 種:繩子繫在 A 的兩肩,鉛直上到滑輪、再從滑輪鉛直垂到重球;繩長不變,重球降多少 A 就升多少", () => {
  const length = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  const ropeAt = (g, k) => fig479.pose(g).paths[`rope${k}`].points;
  const first = { L: length(ropeAt(0, "L")), R: length(ropeAt(0, "R")) };
  for (const g of sweep(1, 24)) {
    const bottom = fig479.pose(g).parts.bell.position[1];
    for (const [k, s] of [["L", -1], ["R", 1]]) {
      const pts = ropeAt(g, k);
      close(pts[0][0], s * (gas.BELL.r + 0.06), "繩端在 A 的肩上(凸緣的外緣)", 1e-9);
      close(pts[0][1], bottom + gas.BELL.h, "繩端在 A 的肩頂", 1e-9);
      close(pts[1][0], pts[0][0], "從肩上鉛直上到滑輪的切點", 1e-9);
      close(pts.at(-1)[0], pts.at(-2)[0], "從滑輪的切點鉛直垂下", 1e-9);
      close(length(pts), first[k], "繩長不變", 1e-6);
    }
  }
  const dw = fig479.pose(1).parts.weightL.position[1] - fig479.pose(0).parts.weightL.position[1];
  close(dw, -(gas.bellBottom(1) - gas.bellBottom(0)), "重球降的距離等於 A 升的距離", 1e-9);
});

test("第 480 種:中央管 a 是套管,固定管 b 全程穿過整根 a、a 在 b 上滑(原文「在固定管 b 上滑動」)", () => {
  const b = part(fig480, "frame").pieces.find((q) => q.role === "tubeB");
  const a = part(fig480, "bell").pieces.find((q) => q.role === "tubeA");
  assert.ok(b && a, "固定管 b 與中央管 a");
  for (const g of sweep(1, 12)) {
    const bottom = fig480.pose(g).parts.bell.position[1];
    const sleeve = { ...a, axis: Y, at: [0, bottom + a.at[2], 0] }; // A 的局部 z 是世界 Y
    assertShaftInBearings(b, [sleeve], `固定管 b(氣量 ${g.toFixed(2)})`);
  }
});

test("第 481 種:濕式氣錶:鼓朝原圖周緣箭頭的方向(逆時針)轉;隔板從中心往外順時針彎;正在進氣的隔室在右側,浮力抬起右側", () => {
  assert.ok(m481.WATER > 0, "注水到中心以上");
  assert.ok(turned(m481.default, "drum", 0, 0.25) > 0, "鼓逆時針轉(原圖周緣的箭頭)");
  close(turned(m481.default, "drum", 0, 1), 2 * Math.PI, "進程一輪鼓轉一圈", 1e-9);
  for (let k = 0; k < m481.CHAMBERS; k++) {
    const pts = m481.partition(k);
    const angle = (p) => Math.atan2(p[1], p[0]);
    let prev = angle(pts[0]);
    for (const p of pts.slice(1)) {
      const d = Math.atan2(Math.sin(angle(p) - prev), Math.cos(angle(p) - prev));
      assert.ok(d < 0, "隔板從內端往外、再沿外緣都是順時針走(原圖)");
      prev = angle(p);
    }
  }
  const xs = [];
  for (const p of sweep(1, 360)) {
    const a = 2 * Math.PI * p;
    const cs = m481.chambers(a);
    // 入口剛浮出水面時前一個隔室還在進氣:看入口最高的那一個
    const k = cs.map((c, i) => i).filter((i) => cs[i].filling).sort((i, j) => Math.sin(cs[j].inlet) - Math.sin(cs[i].inlet))[0] ?? -1;
    assert.ok(k >= 0, "隨時有一個隔室在進氣");
    assert.ok(m481.R_IN * Math.sin(cs[k].inlet) > m481.WATER, "進氣隔室的入口在水面上方");
    const gasPts = m481.chamberGas(a, k, m481.WATER - m481.DISPLACE);
    assert.ok(gasPts.length > 3, "進氣的隔室裡有氣");
    xs.push(gasPts.reduce((s, q) => s + q[0], 0) / gasPts.length);
  }
  assert.ok(xs.filter((x) => x > 0).length / xs.length > 0.85, "進氣隔室的氣體重心幾乎全程在軸的右側(右側被抬起 → 逆時針)");
  assert.ok(xs.reduce((s, x) => s + x, 0) / xs.length > 0.2, "平均在右側");
  assert.match(m481.default.pose(1).readouts[0].value, /^4\.0/, "轉一圈記下四室");
});

test("第 481 種:每個隔室一圈裡依序進氣、出口浮出水面把水排出、轉過去又注滿水;排氣時入口在水面下;出口是外緣的開口", () => {
  const order = [];
  for (let k = 0; k < m481.CHAMBERS; k++) {
    const phases = [];
    for (const p of sweep(1, 720)) {
      const c = m481.chambers(2 * Math.PI * p)[k];
      assert.ok(!(c.filling && c.venting), "進氣與排氣不同時(氣不會直接穿過去)");
      if (c.venting) {
        assert.ok(m481.R * Math.sin(c.outlet) > m481.WATER, "排氣時出口在水面上");
        assert.ok(m481.R_IN * Math.sin(c.inlet) < m481.WATER, "排氣時入口在水面下");
      }
      if (c.flooded) assert.ok(m481.R * Math.sin(c.outlet) < m481.WATER && m481.R_IN * Math.sin(c.inlet) < m481.WATER, "注水中的隔室入口、出口都在水面下");
      const phase = c.filling ? "進氣" : c.venting ? "排氣" : c.flooded ? "注水" : "持氣";
      if (phases.at(-1) !== phase) phases.push(phase);
    }
    const cycle = phases.join(" ").replace(/^(.*?) (.*) \1$/, "$2 $1");
    assert.match(cycle, /^(進氣 持氣 排氣 注水|持氣 排氣 注水 進氣|排氣 注水 進氣 持氣|注水 進氣 持氣 排氣)$/, `隔室 ${k} 的順序:${phases.join(" → ")}`);
  }
  // 依序進氣:進氣的隔室一個接一個換
  let last = -1;
  for (const p of sweep(1, 720)) {
    const k = m481.chambers(2 * Math.PI * p).findIndex((c) => c.filling);
    if (k !== last) (order.push(k), (last = k));
  }
  assert.equal(new Set(order).size, m481.CHAMBERS, "四個隔室都輪到");
  // 出口:隔板 k 的外緣段末端和隔板 k-1 的轉角之間真的有開口
  for (let k = 0; k < m481.CHAMBERS; k++) {
    const end = m481.partition(k).at(-1);
    const corner = m481.partition((k + m481.CHAMBERS - 1) % m481.CHAMBERS)[12];
    const opening = Math.hypot(end[0] - corner[0], end[1] - corner[1]);
    assert.ok(opening > 0.2, `隔室的出口寬 ${opening.toFixed(2)}`);
    const c = m481.chambers(0)[(k + m481.CHAMBERS - 1) % m481.CHAMBERS];
    const mid = Math.atan2(end[1] + corner[1], end[0] + corner[0]);
    close(Math.atan2(Math.sin(c.outlet - mid), Math.cos(c.outlet - mid)), 0, "chambers() 的出口角在開口的中間", 1e-6);
  }
});

test("第 481 種:中央管 a 從外殼後面穿過軸承與鼓的空心軸頸到中心再往上彎出水面;鼓、外殼各是一件;錶盤由軸頸上的小齒輪帶動(4:1,推斷)", () => {
  const casing = part(m481.default, "casing");
  const drum = part(m481.default, "drum");
  assertOnePiece(casing, "外殼(含管 a、軸承座、前托架)是一件");
  assertOnePiece({ pieces: drum.pieces.filter((q) => q.kind !== "gear") }, "鼓(隔板、後盤、軸頸、前輻)是一件");
  const pipe = casing.pieces.find((q) => q.role === "pipe");
  const journal = drum.pieces.find((q) => q.role === "journal");
  const riser = casing.pieces.find((q) => q.role === "riser");
  assertShaftInBearings(journal, casing.pieces.filter((q) => q.role === "bearing"), "空心軸頸");
  assertShaftInBearings(pipe, [journal], "中央管 a");
  assert.ok(pipe.at[2] - pipe.length / 2 < casing.pieces.find((q) => q.role === "gland").at[2] - 0.1, "管 a 從外殼後面伸進來");
  assert.ok(riser.at[1] + riser.length / 2 > m481.WATER + 0.05, "管 a 的出口在水面上方");
  assert.ok(Math.hypot(riser.radius, riser.at[1] + riser.length / 2) < m481.R_IN - 0.03, "往上彎的那段留在隔板內端圍出的中央空間裡");
  assertShaftInBearings(drum.pieces.find((q) => q.role === "frontJournal"), casing.pieces.filter((q) => q.role === "frontBearing"), "前軸頸");
  close(turned(m481.default, "dial", 0, 1), -2 * Math.PI / 4, "鼓轉一圈錶盤反向轉 1/4 圈", 1e-9);
});

const hitsWall = (q, solids) => solids.find((s) => q[2] >= s.z0 - 1e-9 && q[2] <= s.z1 + 1e-9 && inSolid(q, s));

test("第 482 種:杯子 H 與閥 D 的下緣全程浸在水銀溝裡(杯緣在水銀面下、不碰溝底),H 是封閉的倒杯", () => {
  const def = m482.default;
  for (const p of sweep(m482.RANGE[1], 50, m482.RANGE[0])) {
    const r = m482.regulate(p);
    assert.ok(r.cupRim < m482.MERCURY - 0.03 && r.cupRim > m482.TROUGH_BOTTOM, `p=${p}:H 的杯緣 ${r.cupRim.toFixed(3)} 在水銀面 ${m482.MERCURY} 下、溝底 ${m482.TROUGH_BOTTOM} 上`);
    assert.ok(r.valveRim < m482.MERCURY - 0.03 && r.valveRim > m482.TROUGH_BOTTOM, `p=${p}:D 的杯緣 ${r.valveRim.toFixed(3)} 在水銀面下、溝底上`);
    // 杯緣的高度就是擺出來的位置(壁的下端)
    close(def.pose(p).parts.cup.position[1], r.cupRim, "杯子擺在杯緣的高度");
    close(def.pose(p).parts.valve.position[1], r.valveRim, "閥擺在杯緣的高度");
  }
  // 封閉:倒 U 形的剖面之外另有一面背板,蓋住整個開口(杯裡的氣才有壓力可言)
  const cup = part(def, "cup");
  const back = cup.pieces.find((q) => q.kind === "plate" && Math.abs(q.at[2]) > 0.2);
  assert.ok(back, "H 有背板");
  const xs = cup.shape.outline.map((v) => v[0]);
  const bx = back.shape.outline.map((v) => v[0] + back.at[0]);
  const by = back.shape.outline.map((v) => v[1] + back.at[1]);
  assert.ok(Math.min(...bx) <= Math.min(...xs) + 1e-9 && Math.max(...bx) >= Math.max(...xs) - 1e-9 && Math.min(...by) <= 1e-9, "背板蓋住 U 形的整個開口");
});

test("第 482 種:氣體從 E 上來、經閥 D 的缺口 b 越過水銀面進到 H 裡、再經出口室到 F:流體點全程不穿過任何壁", () => {
  const def = m482.default;
  for (const p of sweep(m482.RANGE[1], 20, m482.RANGE[0])) {
    const pose = def.pose(p);
    const solids = sectionSolids(def, ["casing", "chamber", "cup", "valve"], { pose });
    const points = pose.flows.flatMap((f) => f.points);
    assert.ok(points.length > 0, `p=${p}:有氣在流`);
    for (const q of points) {
      const hit = hitsWall(q, solids);
      assert.ok(!hit, `p=${p}:氣點 (${q.map((c) => c.toFixed(2))}) 穿過 ${hit?.id} 的壁`);
    }
    // 氣路經過 E 的管內、D 裡、H 裡與出口室:各找得到點
    const r = m482.regulate(p);
    assert.ok(points.some((q) => Math.abs(q[0] - m482.E.x) < 0.05 && q[1] < m482.E.top), "有氣在 E 管裡");
    assert.ok(points.some((q) => q[0] < m482.E.x - m482.VALVE.half - 0.05 && q[0] > 0.3 && q[1] > m482.MERCURY), "有氣在 D 外、H 裡(越過水銀面)");
    assert.ok(points.some((q) => q[0] < -0.5 && q[1] < 0.2 && q[1] > -0.6), "有氣在出口室裡");
    assert.ok(points.some((q) => q[0] < -1.4 && Math.abs(q[1] - m482.F_Y) < 0.05), "有氣在 F 管裡");
    assert.ok(r.opening > 0, "常用範圍內缺口沒關死");
  }
});

test("第 482 種:主管壓力增加時杯子 H 升起、槓桿 d 把閥 D 壓進水銀,缺口 b 露出水銀面的部分縮小,送出的氣量大致不變;吊桿與閥桿長度不變", () => {
  const def = m482.default;
  const lo = m482.regulate(0.8);
  const hi = m482.regulate(1.4);
  assert.ok(hi.lift > lo.lift, "壓力大,杯子升高");
  assert.ok(hi.drop > lo.drop, "閥被槓桿壓低");
  assert.ok(hi.opening < lo.opening, "缺口 b 縮小");
  assert.ok(Math.abs(hi.flow - lo.flow) < 0.5 * (1.4 - 0.8), "送出的氣量變化遠小於壓力變化");
  const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const first = def.pose(m482.RANGE[0]).parts;
  for (const p of sweep(m482.RANGE[1], 40, m482.RANGE[0])) {
    const r = m482.regulate(p);
    const parts = def.pose(p).parts;
    // 缺口的開口就是閥的左壁下端(缺口頂)露出水銀面的高度
    const notchTop = parts.valve.position[1] + Math.min(...part(def, "valve").shape.outline.map((v) => v[1]).filter((y) => y > 0.1));
    close(r.opening, Math.min(1, Math.max(0, (notchTop - m482.MERCURY) / m482.NOTCH)), `p=${p}:開口照幾何算`);
    close(len(parts.rodH.from, parts.rodH.to), len(first.rodH.from, first.rodH.to), "吊桿長度不變", 1e-6);
    close(len(parts.rodD.from, parts.rodD.to), len(first.rodD.from, first.rodD.to), "閥桿長度不變", 1e-6);
    // 吊桿的上端在 H 上、閥桿的下端在 D 上(跟著各自的杯子走),槓桿的兩端在桿的另一端
    close(parts.rodH.to[1] - parts.cup.position[1], first.rodH.to[1] - first.cup.position[1], "吊桿的上端固定在 H 上");
    close(parts.rodD.to[1] - parts.valve.position[1], first.rodD.to[1] - first.valve.position[1], "閥桿的下端固定在 D 上");
    close(parts.rodH.to[0], m482.X_H, "H 沿導桿鉛直升降");
  }
});

test("第 483 種:乾式氣錶:腔室 A、A' 在風箱張開時經滑閥 B 從入口進氣、縮小時經 B 的閥腔排到出口,錶盤記錄次數", () => {
  const def = m483.default;
  const vs = sweep(1, 200);
  const seen = [false, false];
  for (let i = 1; i < vs.length; i++) {
    const [v0, v1] = [vs[i - 1], vs[i]];
    const v = (v0 + v1) / 2;
    const m = m483.meter(v);
    const ports = m483.ports(v);
    for (const k of [0, 1]) {
      const vol = (x) => m483.chamberVolume(x, k);
      const dV = vol(m483.meter(v1).d[k]) - vol(m483.meter(v0).d[k]);
      if (dV > 1e-6) {
        assert.ok(ports[k].toChest > 0 && ports[k].toExhaust === 0, `v=${v.toFixed(3)}:腔室 ${k} 張開時進氣口對著入口、不對著閥腔`);
        assert.ok(m.filling[k], "進氣旗標");
        seen[k] = true;
      } else if (dV < -1e-6) {
        assert.ok(ports[k].toExhaust > 0 && ports[k].toChest === 0, `v=${v.toFixed(3)}:腔室 ${k} 縮小時進氣口對著閥腔(排到出口)、不對著入口`);
        assert.ok(!m.filling[k], "排氣旗標");
      }
    }
    assert.ok(Math.abs(m.d[0]) <= m483.STROKE + 1e-12 && Math.abs(m.d[1]) <= m483.STROKE + 1e-12);
  }
  assert.ok(seen[0] && seen[1], "兩個腔室都進過氣");
  const fills = vs.map((v) => m483.meter(v).filling);
  assert.ok(fills.some((f) => f[0] && !f[1]) && fills.some((f) => !f[0] && f[1]), "兩個腔室輪流進氣");
  assert.ok(m483.meter(1).dial < m483.meter(0).dial, "錶盤指針隨通過的氣量轉");
  // 進氣與排氣的流體點不穿過閥座、隔板與滑閥
  for (const v of sweep(1, 16)) {
    const pose = def.pose(v);
    const solids = sectionSolids(def, ["case", "slide0", "slide1"], { pose });
    const points = pose.flows.flatMap((f) => f.points);
    assert.ok(points.length > 0, `v=${v}:有氣在流`);
    for (const q of points) {
      const hit = hitsWall(q, solids);
      assert.ok(!hit, `v=${v}:氣點 (${q.map((c) => c.toFixed(2))}) 穿過 ${hit?.id} 的壁`);
    }
  }
});

test("第 483 種:兩片滑閥貼著閥座滑、互不相碰;閥座與隔板和外殼連成一件", () => {
  const def = m483.default;
  const seatTop = m483.SEAT.y1;
  for (const v of sweep(1, 60)) {
    const solids = sectionSolids(def, ["slide0", "slide1"], { pose: def.pose(v) });
    const bodies = [0, 1].map((k) => solids.find((s) => s.id === `slide${k}` && s.outline.length === 8));
    for (const k of [0, 1]) close(Math.min(...bodies[k].outline.map((q) => q[1])), seatTop, `v=${v}:滑閥 ${k} 的下緣貼在閥座面上`);
    assert.ok(polyGap(bodies[0].outline, bodies[1].outline) > 0.03, `v=${v}:兩片滑閥之間有間隙`);
  }
  assertOnePiece(part(def, "case"), "閥座、隔板、管子與外殼連成一件");
});

test("第 483 種:風箱皺褶的皮長度不變,隔膜來回時只是折角在變(壓縮時折得深、拉開時變淺)", () => {
  const def = m483.default;
  const lengths = {};
  const amp = {};
  for (const v of sweep(1, 60)) {
    const paths = def.pose(v).paths;
    for (const [id, path] of Object.entries(paths)) {
      const pts = path.points;
      const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], q[2] - pts[i][2]));
      const total = segs.reduce((s, l) => s + l, 0);
      lengths[id] ??= total;
      close(total, lengths[id], `${id} v=${v}:皮的總長不變`, 1e-6);
      segs.forEach((l) => close(l, segs[0], `${id}:每一段一樣長`, 1e-6));
      const ys = pts.map((q) => q[1]);
      const a = (Math.max(...ys) - Math.min(...ys)) / 2;
      amp[id] ??= { min: a, max: a };
      amp[id].min = Math.min(amp[id].min, a);
      amp[id].max = Math.max(amp[id].max, a);
      // 兩端在固定的壁與隔膜上
      const m = m483.meter(v);
      const k = Number(id[5]);
      const xd = m483.CENTERS[k] + m.d[k];
      close(pts[0][0], k === 0 ? -m483.WALL : m483.WALL, `${id}:皮的一端在隔板的壁上`);
      close(pts.at(-1)[0], xd + (k === 0 ? 0.04 : -0.04), `${id}:皮的另一端在隔膜上`);
    }
  }
  for (const id of Object.keys(amp)) assert.ok(amp[id].max - amp[id].min > 0.01, `${id}:折角會變(振幅 ${amp[id].min.toFixed(3)}–${amp[id].max.toFixed(3)})`);
});
