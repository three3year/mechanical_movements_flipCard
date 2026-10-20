// 第二十章「蒸汽與氣體裝置」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, turned, assertOnePiece, assertBoxesOnePiece, assertShaftInBearings } from "./helpers.js";

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
import fig479, { PULLEY_Y, PULLEY_R, WEIGHT_R } from "../models/fig479.js";
import fig480 from "../models/fig480.js";
import { Y } from "../models/kit.js";
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
