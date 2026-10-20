// 第二十章「蒸汽與氣體裝置」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, inSolid, polyGap, assertOnePiece } from "./helpers.js";
import { rect } from "../models/shapes.js";

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

// 剖面模型裡零件的實體(沿 z 擠出的板件與方塊;零件只平移、不轉):世界座標的外形、孔與 z 範圍。
// 流體示意的點要走在這些實體之外(不穿過壁)。
function sectionSolids(def, pose, ids) {
  const solids = [];
  for (const id of ids) {
    const p = part(def, id);
    const at = pose.parts[id] ?? {};
    assert.ok(!at.angle, `${id} 不轉`);
    const [ox, oy, oz] = at.position ?? p.center ?? [0, 0, 0];
    const add = (piece, [x, y, z]) => {
      if (piece.kind === "plate") {
        const t = piece.thickness ?? 0.2;
        const mv = (loop) => loop.map(([u, v]) => [u + x, v + y]);
        solids.push({ id, outline: mv(piece.shape.outline), holes: (piece.shape.holes ?? []).map(mv), z0: z - t / 2, z1: z + t / 2 });
      } else if (piece.kind === "box") {
        const [w, h, d] = piece.size;
        solids.push({ id, outline: rect(w, h, x, y), holes: [], z0: z - d / 2, z1: z + d / 2 });
      }
    };
    add(p, [ox, oy, oz]);
    for (const c of p.pieces ?? []) {
      const [x, y, z] = c.at ?? [0, 0, 0];
      add(c, [ox + x, oy + y, oz + z]);
    }
  }
  return solids;
}
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
    const solids = sectionSolids(def, pose, ["casing", "chamber", "cup", "valve"]);
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
    const solids = sectionSolids(def, pose, ["case", "slide0", "slide1"]);
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
    const solids = sectionSolids(def, def.pose(v), ["slide0", "slide1"]);
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
