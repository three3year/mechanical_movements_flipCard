// 第二十章「蒸汽與氣體裝置」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, assertShaftInBearings, assertBoxesOnePiece, polyGap, inSolid, plateLayers } from "./helpers.js";
import { X } from "../models/kit.js";
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
import fig479 from "../models/fig479.js";
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
