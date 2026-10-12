// 第十一章「棘輪與擒縱」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { sweep, part, close, assertWeightDrive } from "./helpers.js";
import { placeOutline, polygonsOverlap, penetrationDepth, pointInPolygon, edgeDistance, circlePolygon } from "../models/contact.js";
import { ratchetObstacles } from "../models/ratchets.js";
import fig233, { barAngle, leverAngle, pinPolygons, barOutline, geometry as fig233Geometry } from "../models/fig233.js";
import fig240, { WHEEL, DROPS, STOP_OUTLINES, stopAngle } from "../models/fig240.js";

import * as m225 from "../models/fig225.js";
import * as m226 from "../models/fig226.js";
import * as m230 from "../models/fig230.js";
import * as m231 from "../models/fig231.js";
import * as m232 from "../models/fig232.js";
import { dist, dot, quatRotate } from "../models/kit.js";
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
  // 經過銷時不滑:靠在同一根銷上的每一段,滾子外緣上接觸點走過的弧長等於銷上接觸點走過的弧長(方向相反)。
  // 接觸點在兩個零件上的位置用「材料上的方位角」量:銷跟著輪轉,銷上接觸點的方位 = 銷心→滾子心的方向 − 輪的轉角;
  // 滾子上接觸點的方位 = 滾子心→銷心的方向 − 滾子的轉角。只用相鄰姿勢的位置與轉角,不用模型算滾子轉角的公式
  const wrap = (x) => Math.atan2(Math.sin(x), Math.cos(x));
  const contactPin = (w, c) => {
    const pins = Array.from({ length: 16 }, (_, i) => [PIN_CIRCLE * Math.cos(w + i * PIN_PERIOD), PIN_CIRCLE * Math.sin(w + i * PIN_PERIOD)]);
    // 碰到:滾子與銷(都以多邊形近似圓)放大 0.01 後相交
    const i = pins.findIndex((p) => polygonsOverlap(circlePolygon(c, ROLLER.radius + 0.01, 32), circlePolygon(p, PIN_RADIUS, 32)) && pins.every((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) >= Math.hypot(p[0] - c[0], p[1] - c[1])));
    return i < 0 ? null : { i, at: pins[i] };
  };
  const episodes = [];
  let run = null;
  const ws = sweep(4 * PIN_PERIOD, 1600, start);
  for (let k = 1; k < ws.length; k++) {
    const [p0, p1] = [fig233.pose(ws[k - 1]).parts.roller, fig233.pose(ws[k]).parts.roller];
    const [c0, c1] = [contactPin(ws[k - 1], p0.position), contactPin(ws[k], p1.position)];
    if (!c0 || !c1 || c0.i !== c1.i) {
      run = null; // 換到下一根銷或離開銷:這一步不算
      continue;
    }
    const dir = (c, pin) => Math.atan2(c[1] - pin[1], c[0] - pin[0]); // 銷心 → 滾子心
    const [b0, b1] = [dir(p0.position, c0.at), dir(p1.position, c1.at)];
    // 接觸點在兩心連線上、滾子外緣處;外形以多邊形近似,兩心距比半徑和略小,銷上接觸點離銷心是兩心距 − 滾子半徑
    const reach = (Math.hypot(p0.position[0] - c0.at[0], p0.position[1] - c0.at[1]) + Math.hypot(p1.position[0] - c1.at[0], p1.position[1] - c1.at[1])) / 2 - ROLLER.radius;
    const onPin = reach * wrap(b1 - ws[k] - (b0 - ws[k - 1]));
    const onRoller = ROLLER.radius * wrap(b1 + Math.PI - p1.angle - (b0 + Math.PI - p0.angle));
    if (!run) episodes.push((run = { onPin: 0, onRoller: 0, steps: 0 }));
    run.onPin += onPin;
    run.onRoller += onRoller;
    run.steps++;
  }
  const long = episodes.filter((e) => e.steps > 40);
  assert.ok(long.length >= 3, `靠在銷上的段落 ${long.length}`);
  for (const e of long) {
    assert.ok(Math.abs(e.onPin) > 0.02, `這一段銷上的接觸點走了 ${e.onPin.toFixed(4)}`);
    assert.ok(Math.abs(e.onRoller + e.onPin) < 0.02 * Math.abs(e.onPin) + 1e-3, `滾子上走 ${e.onRoller.toFixed(4)}、銷上走 ${e.onPin.toFixed(4)}:弧長不等就是滑了`);
  }
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
// 機架是一件(各塊的外接盒相接成一群;single 為 false 時容許分成幾座,但每一座都落到同一個地面),
// 而且最高的那根立柱站在某一塊腳座或底板的頂面上(底端貼著頂面、落在它的範圍裡)
function assertFrameStands(pieces, label, { single = true } = {}) {
  const all = pieces.map((p) => pieceBox(p));
  const groups = boxGroups(all);
  if (single) assert.equal(groups.length, 1, `${label}:和機架主體不相連的群 ${groups.map((g) => g.join("、")).join(" / ")}`);
  const ground = Math.min(...all.map(([lo]) => lo[1]));
  for (const g of groups) assert.ok(Math.min(...g.map((i) => all[i][0][1])) <= ground + 1e-6, `${label}:pieces[${g.join("、")}] 沒有落地`);
  const boxes = pieces.filter((p) => p.kind === "box");
  const post = boxes.reduce((a, b) => (b.size[1] > a.size[1] ? b : a));
  const bottom = post.at[1] - post.size[1] / 2;
  const foot = boxes.find((b) => b !== post && Math.abs(b.at[1] + b.size[1] / 2 - bottom) < 1e-6 && Math.abs(b.at[0] - post.at[0]) <= (b.size[0] - post.size[0]) / 2 + 1e-9);
  assert.ok(foot, `${label}:立柱(底端 y ${bottom.toFixed(3)})站在腳座或底板上`);
  assert.ok(depthsOverlap([post.at[2] - post.size[2] / 2, post.at[2] + post.size[2] / 2], [foot.at[2] - foot.size[2] / 2, foot.at[2] + foot.size[2] / 2]), `${label}:立柱和腳座同深度`);
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

for (const [def, pins] of [[fig227, 1.82], [fig228, 2.02], [fig229, 2.3]]) {
  test(`第 ${def.figure} 種:轉動皮帶輪,鍊條跟著走——行進量等於鏈節銷所在圓上轉過的弧長`, () => {
    const phase = (a) => def.pose(a).paths.chain.phase;
    close(phase(0.8) - phase(0), -0.8 * pins, "逆時針轉時鍊條往左端走(右側上升)");
    assert.notEqual(phase(1), phase(0), "鍊條行進相位隨主動量改變");
    assert.equal(def.parts.find((p) => p.id === "chain").kind, "chain", "鍊條是會運動的線狀零件");
  });
}

test("第 227 種:齒嵌進鏈節之間的空隙——各個轉角下,咬在輪上的每個齒都落在同一種鏈節(輪面那一層)的兩銷之間、離兩銷都有間隙,轉 1、3、10 圈後仍然如此(原文:鏈節之間會留有空隙,讓皮帶輪的齒能夠嵌入)", () => {
  const { pitch } = part(fig227, "chain");
  const wheel = part(fig227, "wheel");
  const PINS = 1.82; // 鏈節銷繞在輪上的圓(原圖鍊條繞過輪的那一圈)
  for (const turns of [0, 1, 3, 10]) {
    for (const a of sweep(2 * Math.PI, 36).map((x) => x + turns * 2 * Math.PI)) {
      // 鍊條的路徑(折線)與沿路徑的弧長;繪圖層把第 k 節畫在弧長 phase + k·pitch 到 phase + (k+1)·pitch,節與節的接點是銷
      const { points, phase } = fig227.pose(a).paths.chain;
      const cum = points.map((_, j) => points.slice(1, j + 1).reduce((s, p, i) => s + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0));
      const pointAt = (s) => {
        const j = Math.max(1, cum.findIndex((c) => c >= s));
        const t = (s - cum[j - 1]) / (cum[j] - cum[j - 1]);
        return [0, 1].map((i) => points[j - 1][i] + (points[j][i] - points[j - 1][i]) * t);
      };
      const arcOf = (p) => {
        let best = [Infinity, 0];
        for (let j = 1; j < points.length; j++) {
          const [[ax, ay], [bx, by]] = [points[j - 1], points[j]];
          const len = Math.hypot(bx - ax, by - ay);
          const t = Math.max(0, Math.min(1, ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / len ** 2));
          const d = Math.hypot(ax + (bx - ax) * t - p[0], ay + (by - ay) * t - p[1]);
          if (d < best[0]) best = [d, cum[j - 1] + t * len];
        }
        return best[1];
      };
      const outline = placeOutline(wheel.shape.outline, [0, 0], a);
      for (let k = 0; k < 6; k++) {
        const phi = a + (k * Math.PI) / 3; // 六個齒尖的方位(轉角 0 時一個齒尖在正右方)
        const m = ((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        if (m < 0.2 || m > Math.PI - 0.2) continue; // 只看咬在鍊條繞過的上半圈的齒
        const link = Math.floor((arcOf([PINS * Math.cos(phi), PINS * Math.sin(phi)]) - phase) / pitch);
        assert.equal(((link % 2) + 2) % 2, 0, `轉角 ${a.toFixed(2)}:齒嵌進的是輪面那一層的鏈節`);
        for (const s of [phase + link * pitch, phase + (link + 1) * pitch]) {
          const pin = pointAt(s);
          const clear = pointInPolygon(pin, outline) ? -edgeDistance(pin, outline) : edgeDistance(pin, outline);
          assert.ok(clear > 0.04, `轉 ${turns} 圈、轉角 ${a.toFixed(2)}:齒兩旁的鏈節銷離齒 ${clear.toFixed(3)}(要有間隙,齒才嵌得進空隙)`);
        }
      }
    }
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
    // 兩根軸上的曲柄(曲柄那一端的曲柄臂與曲柄銷、圓盤上的銷):從軸心沿曲柄臂(朝相機的那一面)到銷的各點、銷的兩端與中點
    for (const id of ["upper", "lower"]) {
      const shaft = part(def, id);
      const angle = parts[id].angle;
      const local = (p) => [p.at[0] * Math.cos(angle) - p.at[1] * Math.sin(angle), p.at[0] * Math.sin(angle) + p.at[1] * Math.cos(angle)];
      const crankArm = shaft.pieces.find((p) => p.kind === "plate" && p.thickness === 0.12);
      const pins = shaft.pieces.filter((p) => p.kind === "cylinder" && p !== shaft.pieces[0]);
      const pts = [];
      for (const pin of pins) {
        const [x, y] = local(pin);
        for (const dz of [-pin.length / 2, 0, pin.length / 2]) pts.push([`${id} 的銷`, [shaft.center[0] + x, shaft.center[1] + y, shaft.center[2] + pin.at[2] + dz]]);
      }
      const crankPin = pins.reduce((a, b) => (b.at[2] < a.at[2] ? b : a)); // 曲柄銷(在曲柄那一端)
      const [px, py] = local(crankPin);
      for (let k = 0; k <= 8; k++) pts.push([`${id} 的曲柄臂`, [shaft.center[0] + (px * k) / 8, shaft.center[1] + (py * k) / 8, shaft.center[2] + crankArm.at[2] + crankArm.thickness / 2]]);
      for (const [name, p] of pts) assert.ok(!blocked(p), `轉角 ${theta.toFixed(2)}:${name}(${p.map((c) => c.toFixed(2))})被支架擋住`);
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

test("第 234 種:推斷的重錘驅動——冠狀輪軸上的鼓放出繩、經滑輪吊著重錘,重錘隨輪下降", () => {
  const { DRUM, SWING, REWIND } = m234.geometry;
  assertWeightDrive(m234.default, { drum: DRUM, wheel: m234.wheelAngle, period: 4 * SWING, every: REWIND, dir: 1 });
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

test("第 235 種:小彈簧讓撥爪在搖臂上升的全程保持圖示的位置(靠在擋銷上),擋銷裝在臂的耳板上", () => {
  const S = m235.swing;
  // 原文:位於撥爪臂底部的小彈簧會讓撥爪在搖臂上升時保持在圖中所示的位置
  for (const v of sweep(S, 200)) assert.ok(Math.abs(m235.motion(v).yieldAngle) < 0.01, `主動量 ${v.toFixed(3)}:上擺時撥爪不轉開(${m235.motion(v).yieldAngle.toFixed(4)})`);
  close(m235.motion(S).star - m235.motion(0).star, m235.step, "擺到頂時剛好推過一格", 1e-6);
  // 擋銷(另列的零件,和臂一起擺)落在臂的板上:銷心在臂的某一塊板的輪廓裡,深度範圍和那塊板重疊
  const def = m235.default;
  const pin = part(def, "stopPin").pieces[0];
  const arm = part(def, "arm");
  const pinZ = [pin.at[2] - pin.length / 2, pin.at[2] + pin.length / 2];
  const plates = arm.pieces.filter((p) => p.kind === "plate");
  const carrier = plates.find((p) => {
    const z = p.at?.[2] ?? 0;
    const t = p.thickness ?? 0.2;
    return pointInPolygon([pin.at[0] - (p.at?.[0] ?? 0), pin.at[1] - (p.at?.[1] ?? 0)], p.shape.outline) && z + t / 2 > pinZ[0] && z - t / 2 < pinZ[1];
  });
  assert.ok(carrier, "擋銷裝在臂的板上,不懸在臂端外");
});

test("第 235 種:托住止回爪樞軸的立柱站在腳座上,腳座和輪的軸承座底板相接;臂的軸承座另立在同一個地面上", () => {
  const pieces = part(m235.default, "frame").pieces;
  assertFrameStands(pieces, "第 235 種的機架", { single: false });
  // 止回爪的樞軸銷和輪軸在同一座上(立柱、橫臂、腳座把它接到輪的軸承座)
  const groups = boxGroups(pieces.map((p) => pieceBox(p)));
  const click = pieces.findIndex((p) => p.kind === "cylinder" && p.radius === 0.06);
  assert.ok(groups.find((g) => g.includes(click)).includes(0), "止回爪的樞軸銷和輪軸接成一座");
});

test("第 236 種:托住槓桿樞軸的 Γ 形支柱往下立到底板,底板接著輪的軸承座(機架是一件)", () => {
  assertFrameStands(part(m236.default, "frame").pieces, "第 236 種的機架");
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

test("第 236 種:「近乎連續」——兩根棘爪在齒上錯開半齒,兩程各推約半齒,空行程很短", () => {
  const S = m236.swing;
  const P = m236.pitch;
  // 原文:將近乎連續的圓周運動傳遞給棘輪
  for (const [name, from] of [["b 推的那一程", 0], ["c 推的那一程", S]]) {
    const ws = sweep(from + S, 200, from).map((v) => m236.wheelAngle(v + 2 * S));
    const advance = ws[ws.length - 1] - ws[0];
    assert.ok(Math.abs(advance - P / 2) < P / 12, `${name}推約半齒(${((advance * 180) / Math.PI).toFixed(2)}°)`);
    const still = ws.slice(1).filter((w, i) => Math.abs(w - ws[i]) < 1e-9).length / (ws.length - 1);
    assert.ok(still < 0.15, `${name}輪不動的時間少於 15%(${(still * 100).toFixed(0)}%)`);
  }
});

test("第 237 種:頂端搖臂的往復圓周運動使棘爪帶冠狀鋸齒輪間歇地轉(原文);推程輪轉、回程不動、每個來回推整數齒", () => {
  const { SPAN, PITCH } = m237.geometry;
  const w = (v) => m237.motion(v).wheel;
  // 原文:頂端搖臂的往復圓周運動,會使其附帶的棘爪產生冠狀棘輪或稱鋸齒輪的間歇圓周運動(原文沒有每程幾齒)
  assert.ok(w(SPAN) - w(0) < -PITCH / 2, "推程:棘爪推輪轉");
  close(w(2 * SPAN), w(SPAN), "回程:輪不動", 1e-12);
  const teeth = (w(2 * SPAN) - w(0)) / PITCH;
  assert.ok(Math.abs(teeth) >= 1 && Math.abs(teeth - Math.round(teeth)) < 1e-6, `每個來回推整數齒(${teeth.toFixed(3)})`);
  const ws = sweep(2 * SPAN, 200).map(w);
  assert.ok(ws.slice(1).filter((x, i) => x === ws[i]).length > 100, "間歇:大半時間輪不動");
});

test("第 237 種:棘爪是套在臂桿上的彎爪(原圖),靠自重繞臂桿擺:推程爪尖頂著齒的直面,回程被斜面抬到齒尖再加速落下(由接觸算)", () => {
  const def = m237.default;
  const { SPAN, H, ARC, EYE_R, THICK, ROD_END } = m237.geometry;
  const rod = part(def, "arm").pieces.find((p) => p.axis);
  assert.ok(ROD_END > ARC + 0.3 && Math.abs(rod.at[0] + rod.length / 2 - ROD_END) < 1e-9, "臂桿伸到輪緣外,穿過爪的眼");
  for (const v of sweep(2 * SPAN, 40)) {
    const pose = def.pose(v).parts;
    const radial = [Math.cos(pose.arm.angle), 0, -Math.sin(pose.arm.angle)];
    const [x, y, z] = pose.pawl.position;
    close(Math.hypot(x - EYE_R * radial[0], z - EYE_R * radial[2]), 0, `主動量 ${v.toFixed(3)}:爪的眼在臂桿上`, 1e-9);
    close(y, part(def, "arm").pieces.find((p) => p.axis).at[2], "眼和臂桿同高", 1e-9);
    const normal = quatRotate(pose.pawl.rotation, [0, 0, 1]);
    close(Math.abs(dot(normal, radial)), 1, `主動量 ${v.toFixed(3)}:爪繞臂桿擺(爪的平面和臂桿垂直)`, 1e-9);
  }
  // 推程:爪尖頂著齒的直面推(間隙接近 0)
  for (const v of sweep(0.9 * SPAN, 6, 0.5 * SPAN)) {
    const { pawl, teeth } = m237.contactAt(v);
    const gap = Math.min(...teeth.flatMap((t) => [...pawl.map((q) => edgeDistance(q, t)), ...t.map((q) => edgeDistance(q, pawl))]));
    assert.ok(gap < 0.01, `主動量 ${v.toFixed(3)}:推程爪尖貼著齒(間隙 ${gap.toFixed(4)})`);
  }
  // 回程:爪尖被斜面抬到齒尖,越過後加速落下(不瞬移)
  const tip = (v) => Math.min(...m237.contactAt(v).pawl.map((q) => q[1]));
  const lifts = sweep(2 * SPAN, 400, SPAN).map(tip);
  assert.ok(Math.max(...lifts) > H - 0.02, "回程時爪尖被齒的斜面抬到齒尖");
  const swings = sweep(2 * SPAN, 400, SPAN).map((v) => m237.motion(v).swing);
  assert.ok(Math.max(...swings) - Math.min(...swings) > 0.3, "爪繞臂桿翻上去又落下");
  const drops = lifts.slice(1).map((h, i) => lifts[i] - h);
  assert.ok(Math.max(...drops) < 0.12, "沒有一步就落到底");
  const fall = drops.map((d, i) => [d, i]).filter(([d]) => d > 1e-4);
  assert.ok(fall.length > 3 && fall[2][0] > fall[0][0], "越落越快");
  // 爪是平板、在臂桿處和圓周相切:爪尖(在眼前面 d 處)真正的半徑要落在鋸齒那一圈(sawCrown 的齒板,厚 0.12)裡
  const ring = [ARC * Math.cos(m237.geometry.PITCH / 2) - 0.06, ARC + 0.06];
  for (const v of sweep(4 * SPAN, 160)) {
    const { pawl, teeth } = m237.contactAt(v);
    const tip = pawl.reduce((a, b) => (b[1] < a[1] ? b : a));
    const d = tip[0] - m237.motion(v).arm * ARC;
    const r = [Math.hypot(EYE_R - THICK / 2, d), Math.hypot(EYE_R + THICK / 2, d)];
    assert.ok(Math.min(r[1], ring[1]) - Math.max(r[0], ring[0]) > 0.03, `主動量 ${v.toFixed(3)}:爪尖和鋸齒在同一圈(爪尖半徑 ${r.map((x) => x.toFixed(3))})`);
    for (const t of teeth) assert.ok(penetrationDepth(pawl, t) < 1e-3, `主動量 ${v.toFixed(3)}:爪不穿進齒`);
    assert.ok(Math.min(...pawl.map((q) => q[1])) > -1e-3, `主動量 ${v.toFixed(3)}:爪不穿進輪緣頂面`);
  }
});

test("第 237 種:輪軸上端從搖臂的轂中間穿出當作銷,臂轂坐在輪轂頂上,輪軸下端插在底座的軸承裡", () => {
  const def = m237.default;
  const { PIN, HUB } = m237.geometry;
  const wheel = part(def, "wheel").pieces;
  const span = (p) => [p.at[2] - p.length / 2, p.at[2] + p.length / 2];
  const shaft = wheel.find((p) => p.mark);
  const hub = wheel.find((p) => p.kind === "cylinder" && p.radius === 0.2);
  const disc = wheel.find((p) => p.kind === "cylinder" && p.length === 0.04);
  const armHub = part(def, "arm").pieces.find((p) => p.inner);
  close(armHub.inner, PIN, "臂轂的孔套在輪軸上");
  close(span(armHub)[0], span(hub)[1], "臂轂坐在輪轂頂上");
  close(span(hub)[1], HUB, "輪轂頂");
  assert.ok(span(hub)[0] <= span(disc)[1], "輪轂從圓盤立起");
  assert.ok(span(shaft)[1] > span(armHub)[1] + 0.1, "輪軸上端從臂轂穿出");
  const frame = part(def, "frame").pieces;
  const bearing = frame.find((p) => p.inner);
  const base = frame.find((p) => p.kind === "box");
  close(bearing.inner, PIN, "軸承的孔套在輪軸上");
  // 輪軸(局部 z)= 世界 y
  assert.ok(span(shaft)[0] < bearing.at[1] + bearing.length / 2 && span(shaft)[0] > bearing.at[1] - bearing.length / 2, "輪軸下端插在軸承裡");
  close(bearing.at[1] - bearing.length / 2, base.at[1] + base.size[1] / 2, "軸承立在底座上");
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

test("第 238 種:推斷的重錘驅動——擒縱輪 D 軸上的鼓放出繩、吊著重錘,重錘隨輪下降", () => {
  const { DRUM, SWING, REWIND } = m238.geometry;
  assertWeightDrive(m238.default, { drum: DRUM, wheel: m238.wheelAngle, period: 4 * SWING, every: REWIND, dir: 1 });
});

test("第 238 種:托住擒縱輪軸的立柱站在腳座上,腳座和叉瓦架軸承座的底板相接(機架是一件)", () => {
  assertFrameStands(part(m238.default, "post").pieces, "第 238 種的機架");
});

test("第 239 種:兩支擋爪是單向的止回爪,齒輪往放行的方向轉時爪被斜面頂起、越過齒尖再彈回下一個齒間(由接觸算)", () => {
  const { PITCH } = m239.geometry;
  for (const [w, dir] of [["left", -1], ["right", 1]]) {
    const lifts = sweep(dir * PITCH, 120).map((t) => m239.liftOf(w, t));
    assert.ok(Math.max(...lifts) - Math.min(...lifts) > 0.12, `${w}:被齒頂起`);
    close(m239.liftOf(w, dir * PITCH), m239.liftOf(w, 0), `${w}:轉過一齒後落回同樣深的齒間`, 1e-9);
    const steps = lifts.slice(1).map((x, i) => lifts[i] - x);
    assert.ok(Math.max(...steps) < 0.12, `${w}:彈回的過程不是一步到位`);
  }
  for (const state of ["left", "right", "both"])
    for (const t of sweep(2 * PITCH, 120, -PITCH)) {
      const { pawls, teeth } = m239.contactAt(t, state);
      for (const p of Object.values(pawls)) for (const tooth of teeth) assert.ok(penetrationDepth(p.outline, tooth) < 2e-3, `${state} 轉角 ${t.toFixed(3)}:爪不穿進齒`);
    }
});

test("第 239 種:擋止裝置(原文「用於正齒輪的擋止裝置配置方式」)——只放下一支爪時,齒輪往回只能轉到端面貼上齒的側面", () => {
  const def = m239.default;
  const { PITCH, PAWLS } = m239.geometry;
  const option = (id) => def.states.options.find((o) => o.id === id);
  assert.equal(option("left").play, -1, "只放下左爪:自動播放往順時針(放行的方向)");
  assert.equal(option("right").play ?? 1, 1, "只放下右爪:自動播放往逆時針");
  for (const [state, other] of [["left", "right"], ["right", "left"]]) {
    const { blocks } = PAWLS[state];
    const lowest = Math.min(...sweep(PITCH, 360).map((t) => m239.liftOf(state, t)));
    for (const theta of sweep(PITCH, 28, 0.01)) {
      const range = def.driver.backstop(theta, state);
      const stop = blocks > 0 ? range[1] : range[0];
      assert.equal(blocks > 0 ? range[0] : range[1], blocks > 0 ? -Infinity : Infinity, `${state}:放行的方向不擋`);
      const ahead = blocks * (stop - theta);
      assert.ok(ahead >= -1e-9 && ahead < PITCH, `${state}:往擋住的方向最多轉到一個齒距內的擋止處`);
      assertNoLiftTowardStop239(state, theta, stop, `${state} 轉角 ${theta.toFixed(3)}`);
      // 擋止處:端面和齒之間的間隙接近 0,齒輪再往擋住的方向轉一點(爪不動)就穿進爪
      const { pawls, teeth } = m239.contactAt(stop, state);
      const [a, b] = pawls[state].face;
      const gap = Math.min(...teeth.flatMap((t) => t.map((q) => edgeDistance(q, [a, b]))));
      assert.ok(gap < 0.02, `${state}:擋止處端面和齒的間隙 ${gap.toFixed(4)} 接近 0`);
      const further = m239.contactAt(stop + blocks * 0.02, state).teeth;
      assert.ok(further.some((t) => polygonsOverlap(pawls[state].outline, t)), `${state}:再轉一點齒就撞進端面`);
      // 爪落到底時,端面整段靠在齒的側面上(原圖:端面靠在旁邊那一齒的側面):端面的底端與中段離那一齒都接近 0。
      // 爪還在落下(剛越過齒尖)時就往回轉:端面已經貼著剛越過的那一齒(間隙 < 0.01),當下就擋住
      const tooth = teeth.reduce((best, t) => (Math.min(...t.map((q) => edgeDistance(q, [a, b]))) < Math.min(...best.map((q) => edgeDistance(q, [a, b]))) ? t : best));
      const landed = m239.liftOf(state, stop) < lowest + 2e-3;
      if (!landed) {
        assert.ok(m239.liftOf(state, stop - blocks * 0.002) < m239.liftOf(state, stop), `${state} 轉角 ${theta.toFixed(3)}:擋止處不是爪落到底的位置,就要是爪正在落下`);
        assert.ok(gap < 0.01, `${state} 轉角 ${theta.toFixed(3)}:爪正在落下時端面貼著剛越過的那一齒(間隙 ${gap.toFixed(4)})`);
      } else
        for (const f of [0, 0.3]) {
          const p = [b[0] + (a[0] - b[0]) * f, b[1] + (a[1] - b[1]) * f];
          assert.ok(edgeDistance(p, tooth) < 0.03, `${state}:端面在 ${f} 處貼著齒的側面`);
        }
    }
    // 另一支抬起,靠在撐銷上,碰不到齒輪
    const prop = part(def, state === "left" ? "propRight" : "propLeft");
    const pawl = part(def, other === "left" ? "pawlLeft" : "pawlRight");
    for (const theta of sweep(PITCH, 12)) {
      const pose = def.pose(theta, state).parts;
      assert.equal(pose[prop.id].visible, true, `${state}:撐銷插著`);
      const outline = placeOutline(pawl.shape.outline, PAWLS[other].pivot, pose[pawl.id].angle);
      assert.ok(!m239.contactAt(theta, state).teeth.some((t) => polygonsOverlap(outline, t)), `${state}:抬起的 ${other} 爪碰不到齒`);
      close(edgeDistance(prop.center, outline), prop.radius, `${state}:抬起的 ${other} 爪靠在撐銷上`, 0.01);
    }
  }
});

// 第 239 種:爪 w 的端面和齒之間的間隙
const faceGap239 = (theta, state, w) => {
  const { pawls, teeth } = m239.contactAt(theta, state);
  return Math.min(...teeth.map((t) => Math.min(...t.map((q) => edgeDistance(q, pawls[w].face)))));
};
// 從 theta 往爪 w 擋住的方向轉到 stop 的路上,爪順著齒背滑回齒間,不會倒著飛回剛越過的齒尖上(那樣不是被
// 端面擋住、就是沒碰到東西卻自己抬起)。騎在齒頂上時爪會隨齒頂起伏千分之幾弧度,只容許這麼小的抬起
function assertNoLiftTowardStop239(w, theta, stop, label) {
  const lifts = sweep(stop, 90, theta).map((t) => m239.liftOf(w, t));
  const top = Math.max(...lifts);
  assert.ok(top <= lifts[0] + 0.01, `${label}:往 ${w} 爪擋住的方向轉時 ${w} 爪被抬回齒尖上(${lifts[0].toFixed(4)} → ${top.toFixed(4)})`);
}

test("第 239 種:兩支都放下(原圖畫的樣子)時兩個方向都擋住——兩支爪都落到底、端面都貼著齒,齒輪轉不動", () => {
  const def = m239.default;
  const { PITCH, PAWLS } = m239.geometry;
  assert.equal(def.states.options.find((o) => o.id === "both").play, 0, "自動播放不轉");
  // 起始轉角(與差整數個齒距的轉角):兩支爪同時落在齒間,兩邊的擋止處重合
  for (const k of [-1, 0, 1]) {
    const theta = def.driver.initial + k * PITCH;
    const [lo, hi] = def.driver.backstop(theta, "both");
    assert.ok(lo <= theta + 1e-9 && theta <= hi + 1e-9, `轉角 ${theta.toFixed(3)} 在可轉範圍內`);
    assert.ok(hi - lo < 0.003, `可轉範圍 ${(((hi - lo) * 180) / Math.PI).toFixed(3)}° 接近 0(齒距 ${((PITCH * 180) / Math.PI).toFixed(1)}°)`);
    const { pawls } = m239.contactAt(theta, "both");
    for (const w of ["left", "right"]) {
      assert.ok(faceGap239(theta, "both", w) < 0.01, `${w} 爪的端面貼著齒(間隙 ${faceGap239(theta, "both", w).toFixed(4)})`);
      const further = m239.contactAt(theta + PAWLS[w].blocks * 0.01, "both").teeth;
      assert.ok(further.some((t) => polygonsOverlap(pawls[w].outline, t)), `${w} 爪:齒輪再往它擋的方向轉一點,齒就撞進端面`);
      // 爪落到底(不是停在半空):這時的抬起量是整個齒距裡最低的
      const lowest = Math.min(...sweep(PITCH, 360).map((t) => m239.liftOf(w, theta + t)));
      assert.ok(m239.liftOf(w, theta) < lowest + 2e-3, `${w} 爪落到齒間最深處(抬起 ${m239.liftOf(w, theta).toFixed(4)},最低 ${lowest.toFixed(4)})`);
    }
  }
  // 任一轉角切到這個狀態(兩支爪落在齒背上):兩個方向都只能轉到爪落進齒間為止,路上沒有爪自己抬起
  for (const theta of sweep(PITCH, 45, def.driver.initial)) {
    const [lo, hi] = def.driver.backstop(theta, "both");
    assert.ok(lo <= theta + 1e-9 && theta <= hi + 1e-9 && hi - lo <= PITCH + 1e-9, `轉角 ${theta.toFixed(3)}:兩邊都有擋止`);
    assertNoLiftTowardStop239("right", theta, lo, `轉角 ${theta.toFixed(3)} 往順時針`);
    assertNoLiftTowardStop239("left", theta, hi, `轉角 ${theta.toFixed(3)} 往逆時針`);
    for (const id of ["propLeft", "propRight"]) assert.equal(def.pose(theta, "both").parts[id].visible, false, "撐銷拔掉");
  }
});

test("第 239 種:托架落到底板,彈簧座銷往後插進短柱", () => {
  const frame = part(m239.default, "frame").pieces;
  const boxes = frame.filter((p) => p.kind === "box");
  const base = boxes.reduce((a, b) => (b.at[1] < a.at[1] ? b : a)); // 最底下的底板
  const beam = boxes.reduce((a, b) => (b.size[0] > a.size[0] && b.at[1] > 0 ? b : a));
  const posts = boxes.filter((p) => p.size[1] > 4);
  assert.equal(posts.length, 2, "橫樑兩端各一根立柱");
  for (const p of posts) {
    const top = p.at[1] + p.size[1] / 2;
    assert.ok(top >= beam.at[1] - beam.size[1] / 2 && top <= beam.at[1] + beam.size[1] / 2 + 1e-9, "立柱頂到橫樑");
    assert.ok(Math.abs(p.at[0] - beam.at[0]) <= (beam.size[0] - p.size[0]) / 2 + 1e-9, "立柱在橫樑底下");
    close(p.at[1] - p.size[1] / 2, base.at[1] + base.size[1] / 2, "立柱落到底板上", 1e-9);
    assert.ok(Math.abs(p.at[0] - base.at[0]) <= (base.size[0] - p.size[0]) / 2 + 1e-9, "立柱站在底板上");
  }
  const zRange = (p) => (p.kind === "box" ? [p.at[2] - p.size[2] / 2, p.at[2] + p.size[2] / 2] : [p.at[2] - p.length / 2, p.at[2] + p.length / 2]);
  const seats = frame.filter((p) => p.kind === "cylinder" && p.radius === 0.06);
  assert.equal(seats.length, 2);
  for (const s of seats) {
    const post = boxes.find((b) => Math.abs(b.at[0] - s.at[0]) < 1e-9 && b.size[1] < 1);
    assert.ok(depthsOverlap(zRange(s), zRange(post)), "彈簧座銷插進短柱");
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

test("第 241 種:單齒的根部從輪轂伸出(原圖單齒的圓頭就在小輪中心),和輪轂在平面上疊在一起、深度也重疊", () => {
  const [, tooth, hub] = m241.default.parts.find((p) => p.id === "small").pieces;
  // 平面上真的疊在一起(不是剛好碰到邊):單齒的外形和比輪轂縮小 0.02 的圓仍然相交,疊在輪轂上的部分有實在的面積
  const placed = placeOutline(tooth.shape.outline, [0, 0], tooth.angle ?? 0);
  const inner = circlePolygon([hub.at[0], hub.at[1]], hub.radius - 0.02, 32);
  assert.ok(polygonsOverlap(placed, inner), "單齒的根部疊在輪轂上(縮小 0.02 的輪轂仍和單齒相交)");
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
