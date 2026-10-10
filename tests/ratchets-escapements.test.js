// 第十一章「棘輪與擒縱」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { sweep } from "./helpers.js";
import { placeOutline, polygonsOverlap, penetrationDepth, pointInPolygon, edgeDistance } from "../models/contact.js";
import { ratchetObstacles } from "../models/ratchets.js";
import fig233, { barAngle, leverAngle, pinPolygons, barOutline, geometry as fig233Geometry } from "../models/fig233.js";
import fig240, { WHEEL, DROPS, STOP_OUTLINES, stopAngle } from "../models/fig240.js";

import * as m225 from "../models/fig225.js";
import * as m226 from "../models/fig226.js";
import * as m230 from "../models/fig230.js";
import * as m231 from "../models/fig231.js";
import * as m232 from "../models/fig232.js";
import { dist } from "../models/kit.js";
import * as m234 from "../models/fig234.js";
import * as m235 from "../models/fig235.js";
import * as m236 from "../models/fig236.js";
import * as m237 from "../models/fig237.js";
import * as m238 from "../models/fig238.js";
import * as m239 from "../models/fig239.js";
import * as m241 from "../models/fig241.js";
import * as m242 from "../models/fig242.js";

const PIN_PERIOD = (2 * Math.PI) / 16;
// 板件的深度範圍(z 是板的中面)與兩個深度範圍是否相接
const plateDepth = (p) => [(p.at?.[2] ?? 0) - p.thickness / 2, (p.at?.[2] ?? 0) + p.thickness / 2];
const depthsOverlap = ([a0, a1], [b0, b1]) => Math.min(a1, b1) - Math.max(a0, b0) > 1e-6;

test("第 233 種:燈籠輪逆時針轉時,平桿擋止被銷頂起、滑過,不穿進銷", () => {
  for (const w of sweep(2 * PIN_PERIOD, 60)) {
    const placed = placeOutline(barOutline.outline, barOutline.pivot, barAngle(w));
    assert.ok(!pinPolygons(w).some((p) => polygonsOverlap(placed, p)), `轉角 ${w}`);
  }
  const angles = sweep(0.3 + PIN_PERIOD, 40, 0.3).map(barAngle);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.05, "平桿隨銷起落");
});

test("第 233 種:倒轉時被平桿擋住,只能轉回到最近的擋止處", () => {
  const { backstop } = fig233.driver;
  for (const v of sweep(3, 30)) {
    const stop = backstop(v);
    assert.ok(stop <= v + 1e-9 && v - stop < PIN_PERIOD + 1e-9, "擋止處在一個銷距之內");
  }
  // 擋止處正是平桿落定的那一刻:落下前桿被頂得較高
  const s = fig233.driver.initial;
  assert.ok(barAngle(s - 0.15 * PIN_PERIOD) < barAngle(s) - 0.05, "落下前平桿較高(轉角較小)");
});

test("第 233 種:平桿越過銷之後是加速落下(不瞬移),落到下一根銷上停住", () => {
  const n = 400;
  const a = sweep(PIN_PERIOD, n).map(barAngle);
  const steps = a.slice(1).map((x, i) => x - a[i]);
  const fall = steps.map((d, i) => [d, i]).filter(([d]) => d > 1e-4);
  assert.ok(fall.length > 3, "落下花了好幾個取樣");
  assert.ok(Math.max(...steps) < 0.08, "沒有一步就落到底");
  const run = fall.map(([d]) => d);
  assert.ok(run[run.length - 1] > run[0], "越落越快");
});

test("第 233 種:滾子端頭的槓桿只定位、不擋,兩個方向都被銷頂起", () => {
  const angles = sweep(PIN_PERIOD, 40).map(leverAngle);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.02);
});

test("第 233 種:槓桿端頭是套在短銷上的滾子,經過燈籠輪的銷時在銷上滾、不滑(轉角由接觸點的弧長算)", () => {
  const { PIN_CIRCLE, PIN_RADIUS, ROLLER } = fig233Geometry;
  const lever = fig233.parts.find((p) => p.id === "lever");
  const roller = fig233.parts.find((p) => p.id === "roller");
  // 滾子套在槓桿端頭的銷上:銷比滾子的孔細一點,深度範圍相接
  const axle = lever.pieces.find((p) => p.kind === "cylinder" && Math.hypot(p.at[0] - ROLLER.at[0], p.at[1] - ROLLER.at[1]) < 1e-9);
  assert.ok(axle && axle.radius < ROLLER.bore && ROLLER.bore - axle.radius < 0.01, "滾子的孔套在端頭的銷上");
  assert.ok(roller.shape.holes.some((h) => h.every(([x, y]) => Math.abs(Math.hypot(x, y) - ROLLER.bore) < 1e-9)), "滾子中間開著套銷的孔");
  const start = fig233.driver.initial;
  const rz = fig233.pose(start).parts.roller.position[2];
  const axleDepth = [lever.center[2] + axle.at[2] - axle.length / 2, lever.center[2] + axle.at[2] + axle.length / 2];
  assert.ok(depthsOverlap(axleDepth, [rz - roller.thickness / 2, rz + roller.thickness / 2]), "銷穿過滾子的深度範圍");
  // 經過銷時不滑:接觸點上,滾子表面的速度沿切線方向等於銷(跟著輪轉)的速度
  const h = 1e-4;
  let checked = 0;
  for (const w of sweep(2 * PIN_PERIOD, 400, start)) {
    const a = fig233.pose(w).parts.roller;
    const b = fig233.pose(w + h).parts.roller;
    const pin = Array.from({ length: 16 }, (_, i) => [PIN_CIRCLE * Math.cos(w + i * PIN_PERIOD), PIN_CIRCLE * Math.sin(w + i * PIN_PERIOD)]).sort(
      (p, q) => Math.hypot(p[0] - a.position[0], p[1] - a.position[1]) - Math.hypot(q[0] - a.position[0], q[1] - a.position[1]),
    )[0];
    const d = Math.hypot(pin[0] - a.position[0], pin[1] - a.position[1]);
    if (d - ROLLER.radius - PIN_RADIUS > 0.005) continue; // 沒靠在銷上
    const n = [(pin[0] - a.position[0]) / d, (pin[1] - a.position[1]) / d];
    const t = [-n[1], n[0]];
    const q = [a.position[0] + ROLLER.radius * n[0], a.position[1] + ROLLER.radius * n[1]];
    const pinSpeed = (-q[1] * t[0] + q[0] * t[1]) * h; // 銷上的點跟著輪(逆時針)轉
    const rollerSpeed = (b.position[0] - a.position[0]) * t[0] + (b.position[1] - a.position[1]) * t[1] + (b.angle - a.angle) * ROLLER.radius;
    assert.ok(Math.abs(rollerSpeed - pinSpeed) < 0.02 * h + 1e-7, `轉角 ${w.toFixed(4)}:接觸點滑了 ${((rollerSpeed - pinSpeed) / h).toFixed(4)}`);
    checked++;
  }
  assert.ok(checked > 50, `靠在銷上的取樣 ${checked}`);
  const turned = fig233.pose(start + 2 * PIN_PERIOD).parts.roller.angle - fig233.pose(start).parts.roller.angle;
  assert.ok(Math.abs(turned) > 0.2, `兩根銷經過時滾子轉了 ${turned.toFixed(3)} 弧度`);
});

test("第 233 種:兩個擋止的樞軸銷穿進托架的橫臂,托架的立柱落在接到輪軸承座的底板上(機架是一件)", () => {
  const frame = fig233.parts.find((p) => p.id === "frame").pieces;
  const box = (p) => {
    const half = p.kind === "box" ? p.size.map((s) => s / 2) : [p.radius, p.radius, p.length / 2];
    return [p.at.map((c, i) => c - half[i]), p.at.map((c, i) => c + half[i])];
  };
  const touch = ([a0, a1], [b0, b1]) => [0, 1, 2].every((i) => a0[i] <= b1[i] + 1e-6 && b0[i] <= a1[i] + 1e-6);
  const boxes = frame.map(box);
  const seen = new Set([0]);
  for (let grew = true; grew; ) {
    grew = false;
    boxes.forEach((b, i) => {
      if (!seen.has(i) && [...seen].some((j) => touch(b, boxes[j]))) [grew] = [true, seen.add(i)];
    });
  }
  const loose = frame.map((_, i) => i).filter((i) => !seen.has(i));
  assert.deepEqual(loose, [], `和機架主體不相連的塊:pieces[${loose.join(", ")}]`);
});

// 固定件各塊(box / 沿 z 的 cylinder)的外接盒按相接分群;offset 把零件局部座標移到世界座標(盒子不相交就一定不相連)
const pieceBox = (p, offset = [0, 0, 0]) => {
  const half = p.kind === "box" ? p.size.map((s) => s / 2) : [p.radius, p.radius, p.length / 2];
  const c = p.at.map((v, i) => v + offset[i]);
  return [c.map((v, i) => v - half[i]), c.map((v, i) => v + half[i])];
};
const boxesTouch = ([a0, a1], [b0, b1]) => [0, 1, 2].every((i) => a0[i] <= b1[i] + 1e-6 && b0[i] <= a1[i] + 1e-6);
function boxGroups(boxes) {
  const groups = [];
  const left = new Set(boxes.keys());
  while (left.size) {
    const group = [left.values().next().value];
    left.delete(group[0]);
    for (let k = 0; k < group.length; k++)
      for (const i of [...left]) if (boxesTouch(boxes[i], boxes[group[k]])) [left.delete(i), group.push(i)];
    groups.push(group.sort((x, y) => x - y));
  }
  return groups;
}

test("第 240 種:三根樞軸銷穿進托架,平桿爪的立柱與彈簧座都接到底座(機架與彈簧座是一件)", () => {
  const frame = fig240.parts.find((p) => p.id === "frame").pieces;
  const seat = fig240.parts.find((p) => p.id === "springSeat");
  const boxes = [...frame.map((p) => pieceBox(p)), pieceBox({ ...seat, at: [0, 0, 0] }, seat.center), ...seat.pieces.map((p) => pieceBox(p, seat.center))];
  const groups = boxGroups(boxes);
  assert.equal(groups.length, 1, `不相連的群:${groups.map((g) => g.join("、")).join(" / ")}(${frame.length} 起是彈簧座)`);
});

test("第 240 種:棘輪逆時針轉時,三種擋止爪都靠在輪上、不穿進齒裡", () => {
  for (const w of sweep(2 * ((2 * Math.PI) / WHEEL.teeth), 40)) {
    const wheel = ratchetObstacles(WHEEL, w);
    for (const id of Object.keys(STOP_OUTLINES)) {
      const s = STOP_OUTLINES[id];
      const placed = placeOutline(s.outline, s.pivot, stopAngle(id, w));
      assert.ok(!wheel.some((o) => polygonsOverlap(placed, o)), `${id} 在轉角 ${w}`);
    }
  }
});

test("第 240 種:三個擋止爪越過齒尖後都是加速落下(不瞬移),落到下一個齒上停住", () => {
  const period = (2 * Math.PI) / WHEEL.teeth;
  for (const id of Object.keys(STOP_OUTLINES)) {
    const into = STOP_OUTLINES[id].into;
    const a = sweep(period, 600).map((w) => into * stopAngle(id, w));
    const steps = a.slice(1).map((x, i) => x - a[i]);
    const i = steps.indexOf(Math.max(...steps));
    assert.ok(steps[i] < 0.12, `${id} 沒有一步就落到底`);
    assert.ok(steps[i - 3] > 0 && steps[i - 3] < steps[i - 1] && steps[i - 1] <= steps[i], `${id} 落下時越落越快`);
  }
});

test("第 240 種:同一主動量下,各擋止爪各自在落進齒間的位置擋住倒轉", () => {
  const period = (2 * Math.PI) / WHEEL.teeth;
  for (const [id, drop] of Object.entries(DROPS)) {
    const before = stopAngle(id, drop - period * 0.1);
    const after = stopAngle(id, drop + 0.002);
    assert.ok(Math.abs(after - before) > 0.02, `${id} 在擋止處落下`);
  }
  const { backstop } = fig240.driver;
  for (const v of sweep(2, 25)) {
    const stop = backstop(v);
    assert.ok(stop <= v + 1e-9 && v - stop < period, "往回最多轉到最近的擋止處");
    const nearest = Math.max(...Object.values(DROPS).map((d) => d + Math.floor((v - d) / period + 1e-9) * period));
    assert.ok(Math.abs(stop - nearest) < 1e-9);
  }
});

import fig227 from "../models/fig227.js";
import fig228 from "../models/fig228.js";
import fig229 from "../models/fig229.js";
import { close } from "./helpers.js";

for (const [def, pins] of [[fig227, 1.82], [fig228, 2.02], [fig229, 2.3]]) {
  test(`第 ${def.figure} 種:轉動皮帶輪,鍊條跟著走——行進量等於鏈節銷所在圓上轉過的弧長`, () => {
    const phase = (a) => def.pose(a).paths.chain.phase;
    close(phase(0.8) - phase(0), -0.8 * pins, "逆時針轉時鍊條往左端走(右側上升)");
    assert.notEqual(phase(1), phase(0), "鍊條行進相位隨主動量改變");
    assert.equal(def.parts.find((p) => p.id === "chain").kind, "chain", "鍊條是會運動的線狀零件");
  });
}

test("第 227 種:滑輪每轉一圈鍊條剛好走整數個鏈節,齒一直落在同一種鏈節的空隙裡(原文:鏈節之間會留有空隙,讓皮帶輪的齒能夠嵌入)", () => {
  const { pitch } = fig227.parts.find((p) => p.id === "chain");
  const phase = (a) => fig227.pose(a).paths.chain.phase;
  for (const turns of [1, 3, 10]) {
    const links = (phase(0) - phase(turns * 2 * Math.PI)) / pitch;
    close(links, 12 * turns, `轉 ${turns} 圈走 ${12 * turns} 節(6 齒,每齒隔兩節,內外節不會對調)`, 1e-9);
  }
});

test("第 225 種:搖臂擺動,棘爪推棘輪間歇地轉(原文:由承載棘爪的搖臂之擺動運動所產生的棘輪之間歇圓周運動)", () => {
  const S = m225.swing;
  const ws = sweep(4 * S, 400).map((v) => m225.ratchet(v).wheel);
  for (let i = 1; i < ws.length; i++) assert.ok(ws[i] >= ws[i - 1] - 1e-12, "只朝一個方向(逆時針)");
  close(m225.step, m225.pitch, "每個來回推一齒(由接觸算)", 1e-9);
  close(m225.ratchet(2 * S).wheel - m225.ratchet(0).wheel, m225.pitch, "一個來回前進一齒", 1e-9);
  close(m225.ratchet(2 * S).wheel, m225.ratchet(1.05 * S).wheel, "往回擺時不動", 1e-9);
  assert.ok(m225.ratchet(0.1 * S).wheel < 1e-9, "推程開頭爪尖還沒碰到齒的直面,輪不動(空行程)");
  const pawl = sweep(2 * S, 200, S).map((v) => m225.ratchet(v).pawl);
  assert.ok(Math.max(...pawl) - Math.min(...pawl) > 0.08, "往回擺時棘爪被齒背頂起、越過齒尖再落下");
  for (const v of sweep(4 * S, 160)) {
    const { tip, teeth } = m225.contactAt(v);
    for (const t of teeth) assert.ok(penetrationDepth(tip, t) < 1e-3, `主動量 ${v.toFixed(3)}:爪尖不穿進齒`);
  }
});

test("第 226 種:B 轉一圈,框架 A 轉一圈;移除 C 的齒輪且 D 不自轉時 E 只隨框架轉一圈,裝回後 D 自轉、E 多轉", () => {
  const turns = (state, key) => (m226.train(2 * Math.PI, state)[key] - m226.train(0, state)[key]) / (2 * Math.PI);
  // 原文:B 上的齒輪旋轉一圈會使框架 A 也接收到一圈旋轉
  close(turns("installed", "a"), 1, "A 一圈", 1e-3);
  close(turns("removed", "a"), 1, "移除時 A 也是一圈", 1e-3);
  // 原文:將空心軸 C 上的兩個齒輪移除,並防止 D 繞其自身軸旋轉……E 會接收到一圈旋轉
  close(turns("removed", "e"), 1, "E 隨框架一圈", 1e-3);
  close(turns("removed", "d"), 0, "D 不自轉", 1e-9);
  // 原文:若將空心軸 C 上的齒輪重新裝回,則 D 在 B 旋轉一圈的期間會同時繞其自身軸旋轉……產生 E 的兩圈旋轉
  assert.ok(Math.abs(turns("installed", "d")) > 0.9, "裝回後 D 繞自身軸旋轉");
  assert.ok(turns("installed", "e") > turns("removed", "e") + 0.9, "裝回後 E 比移除時多轉(雙倍以上的速度)");
  // 和原文不同(維護者 2026-10-10 決定維持):原圖三組傘齒輪等大,空心軸 C 與 F 反向轉,E 轉三圈;
  // 原文的「D 自轉一圈、E 兩圈」等於把 C 當成不動
  close(turns("installed", "e"), 3, "照原圖的等大齒輪 E 轉三圈", 1e-3);
  const text = (state) => m226.default.pose(0, state).readouts.map((r) => r.label + r.value).join(" ");
  assert.match(text("installed"), /原文.*兩圈/, "讀數旁說明和原文「兩圈」的落差");
  assert.doesNotMatch(text("removed"), /原文/, "移除時沒有落差,不說明");
});

test("第 230 種:兩對曲柄相差直角,一對在死點時另一對在直角位置", () => {
  for (const t of sweep(2 * Math.PI, 360)) {
    const { disc, crank } = m230.cranks(t);
    close(disc * disc + crank * crank, 1, "兩者正交", 1e-9);
    assert.ok(Math.max(disc, crank) >= Math.SQRT1_2 - 1e-9, "至少一對離死點夠遠");
  }
});

test("第 230 種:從預設視角看,兩對曲柄與兩根連桿整段都不被推斷的支架擋住(讀者要同時看到一對在死點、另一對在直角)", () => {
  const def = m230.default;
  const dir = def.view.direction;
  // 支架各塊的外接盒(圓柱沿 z)
  const boxes = def.parts.find((p) => p.id === "standard").pieces.map((q) => {
    const half = q.kind === "box" ? q.size.map((s) => s / 2) : [q.radius, q.radius, q.length / 2];
    return [q.at.map((c, i) => c - half[i]), q.at.map((c, i) => c + half[i])];
  });
  // 從點 p 往相機(+dir)的射線是否穿過盒子(slab 法)
  const blocked = (p) =>
    boxes.some(([lo, hi]) => {
      let [t0, t1] = [0, Infinity];
      for (let i = 0; i < 3; i++) {
        if (Math.abs(dir[i]) < 1e-12) {
          if (p[i] < lo[i] || p[i] > hi[i]) return false;
          continue;
        }
        const [a, b] = [(lo[i] - p[i]) / dir[i], (hi[i] - p[i]) / dir[i]].sort((x, y) => x - y);
        [t0, t1] = [Math.max(t0, a), Math.min(t1, b)];
      }
      return t0 <= t1;
    });
  for (const theta of sweep(2 * Math.PI, 24)) {
    const { parts } = def.pose(theta);
    for (const id of ["rodCrank", "rodDisc"]) {
      const { from, to } = parts[id];
      for (let k = 0; k <= 10; k++) {
        const p = from.map((c, i) => c + ((to[i] - c) * k) / 10);
        assert.ok(!blocked(p), `轉角 ${theta.toFixed(2)}:${id} 第 ${k}/10 點被支架擋住`);
      }
    }
  }
});

test("第 231 種:拖曳連桿:兩支曲柄都轉整圈,連桿長度不變,從動曲柄變速", () => {
  const { C, O2, B } = m231.geometry;
  const states = sweep(2 * Math.PI, 720).map((t) => m231.dragLink(t));
  for (const s of states) {
    close(dist(s.p, s.q), C, "連桿", 1e-9);
    close(dist(s.q, O2), B, "從動曲柄", 1e-9);
  }
  const steps = states.slice(1).map((s, i) => Math.atan2(Math.sin(s.angle - states[i].angle), Math.cos(s.angle - states[i].angle)));
  close(steps.reduce((a, b) => a + b, 0), 2 * Math.PI, "從動曲柄也轉一整圈", 1e-6);
  assert.ok(Math.max(...steps) / Math.min(...steps) > 1.3, "變速");
});

test("第 232 種:C 是一件——伸進齒間的楔形爪尖和弧形桿身在同一深度範圍內相連,平面上外形重疊", () => {
  const [body, tip] = m232.default.parts.find((p) => p.id === "pawlC").pieces.filter((p) => p.kind === "plate");
  assert.ok(depthsOverlap(plateDepth(body), plateDepth(tip)), `深度:桿身 ${plateDepth(body)}、爪尖 ${plateDepth(tip)}`);
  assert.ok(polygonsOverlap(body.shape.outline, tip.shape.outline), "平面上爪尖和桿身末端重疊");
});

test("第 232 種:C 抬到頂靠住的擋銷立在 A 上(A 的耳片托著它),C 的桿身上緣剛好碰到擋銷", () => {
  const { STOP, LIFT_MAX, C_PIVOT } = m232.geometry;
  const A = m232.default.parts.find((p) => p.id === "plateA").pieces;
  const pin = A.find((p) => p.kind === "cylinder" && Math.hypot(p.at[0] - STOP[0], p.at[1] - STOP[1]) < 1e-9);
  const pinDepth = [pin.at[2] - pin.length / 2, pin.at[2] + pin.length / 2];
  const holders = A.filter((p) => p.kind === "plate" && pointInPolygon(STOP, p.shape.outline) && depthsOverlap(plateDepth(p), pinDepth));
  assert.ok(holders.length > 0, "擋銷的位置在 A 的板件上、深度相接");
  // 桿身在 C 抬到頂時碰到擋銷:間隙接近 0;再多抬一點就壓進擋銷
  const body = m232.default.parts.find((p) => p.id === "pawlC").pieces.find((p) => p.kind === "plate");
  const gapAt = (lift) => edgeDistance(STOP, placeOutline(body.shape.outline, C_PIVOT, lift)) - pin.radius;
  assert.ok(Math.abs(gapAt(LIFT_MAX)) < 0.01, `抬到頂時間隙 ${gapAt(LIFT_MAX).toFixed(4)}`);
  assert.ok(!pointInPolygon(STOP, placeOutline(body.shape.outline, C_PIVOT, LIFT_MAX)), "擋銷不在桿身裡");
  assert.ok(gapAt(LIFT_MAX + 0.05) < -0.005 || pointInPolygon(STOP, placeOutline(body.shape.outline, C_PIVOT, LIFT_MAX + 0.05)), "多抬一點就壓進擋銷");
});

test("第 232 種:B 抬起時 C 先抬出齒間、再帶著 A 往後越過圓周;B 下降時 C 落入齒間、帶著輪轉(由接觸算)", () => {
  const { PITCH, SWING, LIFT_MAX } = m232.geometry;
  const at = (v) => m232.motion(v);
  // 原文:當搖臂 B 被抬起時,棘爪 C 會從輪的齒間被抬起,並向後越過圓周移動
  close(at(0.5 * SWING).a, at(0).a, "B 抬起的前段 A 不動、只抬 C", 1e-9);
  assert.ok(at(0.5 * SWING).lift > at(0).lift + 0.15, "C 被抬起");
  close(at(SWING).lift, LIFT_MAX, "C 抬到頂(碰到 A 上的擋銷)", 1e-6);
  assert.ok(at(SWING).a - at(0).a > PITCH, "接著帶著 A 往後越過一齒以上");
  close(at(SWING).wheel, at(0).wheel, "抬起與往後時輪不動", 1e-12);
  // 原文:當搖臂下降時,棘爪會再次落入兩齒之間的空隙中,並帶動輪一起轉動
  close(at(1.5 * SWING).wheel, at(SWING).wheel, "C 還在落下時輪不動", 1e-12);
  close(at(2 * SWING).wheel - at(0).wheel, -PITCH, "一個來回輪順時針前進一齒", 1e-9);
  close(at(2 * SWING).a, at(0).a, "A 回到原位", 1e-9);
  const ws = sweep(4 * SWING, 400).map((v) => at(v).wheel);
  for (let i = 1; i < ws.length; i++) assert.ok(ws[i] <= ws[i - 1] + 1e-12, "只朝一個方向");
  for (const v of sweep(4 * SWING, 160)) {
    const { tip, teeth } = m232.contactAt(v);
    for (const t of teeth) assert.ok(penetrationDepth(tip, t) < 2e-3, `主動量 ${v.toFixed(3)}:爪尖不穿進齒`);
  }
});

const monotone = (values, sign) => values.every((v, i) => i === 0 || sign * (v - values[i - 1]) >= -1e-12);

test("第 234 種:心軸 S 往復擺動,兩片叉瓦輪流擋住冠狀輪,輪間歇地轉:每擺一程半個齒(由接觸算)", () => {
  const { PITCH, SWING } = m234.geometry;
  const span = 2 * SWING;
  // 原文:當使心軸 S 擺動時,冠狀輪便會產生間歇性的旋轉運動
  close(m234.wheelAngle(2 * span) - m234.wheelAngle(0), PITCH, "一個來回一齒", 1e-9);
  assert.ok(Math.abs(m234.wheelAngle(span) - m234.wheelAngle(0) - PITCH / 2) < 0.02, "一程半齒");
  const ws = sweep(4 * span, 400).map(m234.wheelAngle);
  for (let i = 1; i < ws.length; i++) assert.ok(ws[i] >= ws[i - 1] - 0.03, "只朝一個方向(叉瓦推回的量很小)");
  // 間歇:輪頂著叉瓦、跟著它退開的速度走(也被推回一點),一片放開時才一下子轉到另一片(軸桿式是回退式擒縱,沒有靜止段)
  const steps = ws.slice(1).map((w, i) => w - ws[i]);
  const mean = (ws[ws.length - 1] - ws[0]) / steps.length;
  assert.ok(Math.max(...steps) > 4 * mean, "放開時一下子轉過去");
  assert.ok(Math.min(...steps) < 0, "叉瓦伸進來時把輪推回一點(回退)");
  for (const v of sweep(4 * span, 160)) {
    const { teeth, flags } = m234.contactAt(v);
    for (const t of teeth) for (const f of flags) assert.ok(penetrationDepth(t, f) < 2e-3, `主動量 ${v.toFixed(3)}:叉瓦不穿進齒`);
  }
});

test("第 235 種:撥爪臂往上擺時推星形輪轉一格,回程撥爪讓開、滑過齒面,輪不動(由接觸算)", () => {
  const S = m235.swing;
  // 原文:撥爪臂的擺動運動,會產生棘輪的間歇性旋轉運動
  close(m235.motion(S).star - m235.motion(0).star, m235.step, "上擺一程轉一格(六分之一圈)", 1e-6);
  close(m235.motion(2 * S).star, m235.motion(S).star, "回程不動", 1e-9);
  // 原文:允許它在回程運動時通過齒的表面
  const yields = sweep(2 * S, 100, S).map((v) => Math.abs(m235.motion(v).yieldAngle));
  assert.ok(Math.max(...yields) > 0.2, "回程撥爪被下一個角頂開、讓開");
  close(m235.motion(2 * S).yieldAngle, 0, "回程結束時撥爪彈回擋銷", 1e-3);
  const stars = sweep(4 * S, 200).map((v) => m235.motion(v).star);
  for (let i = 1; i < stars.length; i++) assert.ok(stars[i] >= stars[i - 1] - 1e-12, "只朝一個方向(止回爪不讓它倒轉)");
  for (const v of sweep(4 * S, 160)) {
    const { pawl, click, star } = m235.contactAt(v);
    for (const t of star) {
      assert.ok(penetrationDepth(pawl, t) < 2e-3, `主動量 ${v.toFixed(3)}:撥爪不穿進星形輪`);
      assert.ok(penetrationDepth(click, t) < 2e-3, `主動量 ${v.toFixed(3)}:止回爪不穿進星形輪`);
    }
  }
});

test("第 236 種:槓桿 a 擺動,兩根棘爪 b、c 輪流推,棘輪近乎連續地朝同一方向轉(由接觸算)", () => {
  const S = m236.swing;
  const ws = sweep(4 * S, 400).map(m236.wheelAngle);
  assert.ok(monotone(ws, 1), "只朝一個方向(逆時針,原圖箭頭)");
  // 原文:藉由擺動槓桿 a(其上裝有兩根棘爪 b 和 c),將近乎連續的圓周運動傳遞給棘輪
  assert.ok(m236.wheelAngle(S) > 0.05 && m236.wheelAngle(2 * S) - m236.wheelAngle(S) > 0.05, "兩個方向的擺動都在推");
  close(m236.wheelAngle(2 * S), m236.pitch, "每個來回前進一齒", 1e-9);
  for (const v of sweep(4 * S, 160)) {
    const { tips, teeth } = m236.contactAt(v);
    for (const tip of tips) for (const t of teeth) assert.ok(penetrationDepth(tip, t) < 1e-3, `主動量 ${v.toFixed(3)}:爪尖不穿進齒`);
  }
});

test("第 237 種:搖臂往復轉動,棘爪帶冠狀鋸齒輪間歇地轉;回程時棘爪沿斜面滑過齒(由接觸算)", () => {
  const { SPAN, PITCH, H } = m237.geometry;
  // 原文:頂端搖臂的往復圓周運動,會使其附帶的棘爪產生冠狀棘輪或稱鋸齒輪的間歇圓周運動
  close(m237.motion(SPAN).wheel - m237.motion(0).wheel, -2 * PITCH, "推程:輪被推兩齒", 1e-6);
  close(m237.motion(2 * SPAN).wheel, m237.motion(SPAN).wheel, "回程:輪不動", 1e-12);
  assert.ok(Math.abs(m237.motion(0.1 * SPAN).wheel - m237.motion(0).wheel) < 1e-9, "推程開頭棘爪還沒頂到直面,輪不動(空行程)");
  const lifts = sweep(2 * SPAN, 200, SPAN).map((v) => m237.motion(v).lift);
  assert.ok(Math.max(...lifts) > H - 0.01, "回程時棘爪被齒的斜面抬到齒尖");
  // 越過齒尖後是加速落下(不瞬移):每一小步落下的量越來越大
  const fall = sweep(2 * SPAN, 2000, SPAN).map((v) => m237.motion(v).lift);
  const drops = fall.slice(1).map((h, i) => fall[i] - h);
  assert.ok(Math.max(...drops) < 0.1, "沒有一步就落到底");
  for (const v of sweep(4 * SPAN, 160)) {
    const { pawl, teeth } = m237.contactAt(v);
    for (const t of teeth) assert.ok(penetrationDepth(pawl, t) < 1e-3, `主動量 ${v.toFixed(3)}:棘爪不穿進齒`);
  }
});

test("第 238 種:叉瓦架往復擺動,叉瓦 B、C 輪流擋住、放走擒縱輪 D:每擺一程半個齒(由接觸算)", () => {
  const { PITCH, SWING } = m238.geometry;
  const span = 2 * SWING;
  close(m238.wheelAngle(2 * span) - m238.wheelAngle(0), PITCH, "一個來回一齒(逆時針)", 1e-9);
  assert.ok(Math.abs(m238.wheelAngle(span) - m238.wheelAngle(0) - PITCH / 2) < 0.05, "一程約半齒");
  const ws = sweep(4 * span, 400).map(m238.wheelAngle);
  for (let i = 1; i < ws.length; i++) assert.ok(ws[i] >= ws[i - 1] - 0.035, "逆時針,叉瓦推回的量不超過 2°");
  for (let i = 1; i < ws.length; i++) assert.ok(ws[i] - ws[i - 1] < 0.06, "放開後輪從靜止加速轉過去,不會一步跳過一大段");
  for (const v of sweep(4 * span, 160)) {
    const { teeth, pallets } = m238.contactAt(v);
    for (const t of teeth) for (const p of pallets) assert.ok(penetrationDepth(t, p) < 2e-3, `主動量 ${v.toFixed(3)}:叉瓦不穿進輪齒`);
  }
});

test("第 239 種:正齒輪的擋止爪:爪尖落在齒間,齒轉過時被頂起、越過齒尖再彈回下一個齒間(由接觸算)", () => {
  const { PITCH } = m239.geometry;
  for (const w of ["left", "right"]) {
    const lifts = sweep(PITCH, 120).map((t) => m239.liftOf(w, t));
    assert.ok(Math.max(...lifts) > 0.12, `${w}:被齒頂起`);
    close(m239.liftOf(w, PITCH), m239.liftOf(w, 0), `${w}:轉過一齒後落回同樣深的齒間`, 1e-9);
    const steps = lifts.slice(1).map((x, i) => lifts[i] - x);
    assert.ok(Math.max(...steps) < 0.12, `${w}:彈回的過程不是一步到位`);
  }
  for (const t of sweep(2 * PITCH, 120)) {
    const { pawls, teeth } = m239.contactAt(t);
    for (const p of pawls) for (const tooth of teeth) assert.ok(penetrationDepth(p, tooth) < 2e-3, `轉角 ${t.toFixed(3)}:爪不穿進齒`);
  }
});

test("第 241 種:單齒小輪每轉一圈,輪 A 轉一格,其餘時間不動(由接觸算)", () => {
  // 原文:藉由具有單一齒的較小輪之連續圓周運動,將間歇的圓周運動傳遞給輪 A
  close(m241.wheelA(2 * Math.PI) - m241.wheelA(0), -m241.step, "一圈一格(順時針,原圖箭頭)", 1e-9);
  const still = sweep(2 * Math.PI, 360).map(m241.wheelA);
  assert.ok(still.slice(1).filter((w, i) => w === still[i]).length > 200, "大半時間不動");
  for (let i = 1; i < still.length; i++) assert.ok(still[i] <= still[i - 1] + 1e-12, "只朝一個方向(止回爪不讓它倒轉)");
  const clicks = sweep(2 * Math.PI, 360).map(m241.clickAngle);
  assert.ok(Math.max(...clicks) - Math.min(...clicks) > 0.03, "A 轉動時止回爪被齒背頂起、再落回");
  for (const v of sweep(4 * Math.PI, 240)) {
    const { hook, click, teeth } = m241.contactAt(v);
    for (const t of teeth) {
      assert.ok(penetrationDepth(hook, t) < 2e-3, `主動量 ${v.toFixed(3)}:單齒不穿進 A 的齒`);
      assert.ok(penetrationDepth(click, t) < 2e-3, `主動量 ${v.toFixed(3)}:止回爪不穿進 A 的齒`);
    }
  }
});

test("第 241 種:止回爪的樞軸銷穿進短臂,托架的立柱和兩個軸承座站在同一個地面上", () => {
  const frame = m241.default.parts.find((p) => p.id === "frame").pieces;
  const boxes = frame.map((p) => pieceBox(p));
  const ground = Math.min(...boxes.map(([lo]) => lo[1]));
  const groups = boxGroups(boxes);
  for (const g of groups) assert.ok(Math.min(...g.map((i) => boxes[i][0][1])) <= ground + 1e-6, `pieces[${g.join("、")}] 沒有落地`);
  const pin = frame.findIndex((p) => p.kind === "cylinder" && p.radius === 0.065);
  assert.ok(groups.find((g) => g.includes(pin)).length > 1, "樞軸銷接到托架");
});

test("第 241 種:單齒的根部從輪轂伸出(原圖單齒的圓頭就在小輪中心),和輪轂在同一深度範圍內相連", () => {
  const [, tooth, hub] = m241.default.parts.find((p) => p.id === "small").pieces;
  const root = Math.min(...tooth.shape.outline.map(([x, y]) => Math.hypot(x, y)));
  assert.ok(root < hub.radius, `單齒最靠近中心處在半徑 ${root.toFixed(3)},輪轂半徑 ${hub.radius}`);
  const [t0, t1] = plateDepth(tooth);
  const [h0, h1] = [hub.at[2] - hub.length / 2, hub.at[2] + hub.length / 2];
  assert.ok(depthsOverlap([t0, t1], [h0, h1]), "單齒和輪轂在深度上重疊");
});

test("第 242 種:拉下槓桿,煞車帶的兩端被拉向彼此,帶收緊在煞車輪上", () => {
  const [lo, hi] = m242.range;
  assert.ok(m242.brake(hi).gap > 0.05, "放開時有間隙");
  close(m242.brake(lo).gap, 0, "拉到底時收緊", 1e-3);
  const gaps = sweep(lo, 40, hi).map((p) => m242.brake(p).gap);
  for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i] <= gaps[i - 1] + 1e-9, "越拉越緊");
});
