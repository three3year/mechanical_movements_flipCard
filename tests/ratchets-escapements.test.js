// 第十一章「棘輪與擒縱」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { sweep } from "./helpers.js";
import { placeOutline, polygonsOverlap } from "../models/contact.js";
import { ratchetObstacles } from "../models/ratchets.js";
import fig233, { barAngle, leverAngle, pinPolygons, barOutline } from "../models/fig233.js";
import fig240, { WHEEL, DROPS, STOP_OUTLINES, stopAngle } from "../models/fig240.js";

import * as m225 from "../models/fig225.js";
import * as m226 from "../models/fig226.js";
import * as m230 from "../models/fig230.js";
import * as m231 from "../models/fig231.js";
import * as m232 from "../models/fig232.js";
import { dist } from "../models/kit.js";

const PIN_PERIOD = (2 * Math.PI) / 16;

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
  // 擋止處正是平桿落下的那一刻:落下前桿被頂得較高
  const s = fig233.driver.initial;
  assert.ok(barAngle(s - 0.004) < barAngle(s + 0.004) - 0.02, "落下前平桿較高(轉角較小)");
});

test("第 233 種:圓盤端頭的槓桿只定位、不擋,兩個方向都被銷頂起", () => {
  const angles = sweep(PIN_PERIOD, 40).map(leverAngle);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.02);
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

test("第 225 種:搖臂振動,棘爪推棘輪間歇地轉:往一邊擺時推、往回擺時不動", () => {
  const S = m225.step;
  const span = -2 * m225.ratchet(0).psi; // 單程擺幅
  const ws = sweep(4 * span, 400).map((v) => m225.ratchet(v).wheel);
  for (let i = 1; i < ws.length; i++) assert.ok(ws[i] >= ws[i - 1] - 1e-12, "只朝一個方向");
  close(S, 2 * m225.pitch, "每推一次兩齒", 1e-6);
  close(m225.ratchet(span).wheel - m225.ratchet(0).wheel, S, "推一次前進", 1e-9);
  close(m225.ratchet(2 * span).wheel, m225.ratchet(1.5 * span).wheel, "回程不動", 1e-12);
});

test("第 226 種:B 轉一圈,框架 A 轉一圈;移除 C 的齒輪且 D 不自轉時 E 只隨框架轉一圈,裝回後 E 多轉", () => {
  const turns = (state, key) => (m226.train(2 * Math.PI, state)[key] - m226.train(0, state)[key]) / (2 * Math.PI);
  close(turns("installed", "a"), 1, "A 一圈", 1e-3);
  close(turns("removed", "e"), 1, "E 隨框架一圈", 1e-3);
  close(turns("installed", "c"), -1, "空心軸 C 反向一圈", 1e-3);
  // 差速關係 E = 2A − C(原文說兩圈,依原圖的等大齒輪是三圈,見票的 Comments)
  close(turns("installed", "e"), 2 * turns("installed", "a") - turns("installed", "c"), "E = 2A − C", 1e-3);
  assert.ok(turns("installed", "e") > turns("removed", "e") + 0.9, "裝回 C 的齒輪後 E 轉得更多");
});

test("第 230 種:兩對曲柄相差直角,一對在死點時另一對在直角位置", () => {
  for (const t of sweep(2 * Math.PI, 360)) {
    const { disc, crank } = m230.cranks(t);
    close(disc * disc + crank * crank, 1, "兩者正交", 1e-9);
    assert.ok(Math.max(disc, crank) >= Math.SQRT1_2 - 1e-9, "至少一對離死點夠遠");
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

test("第 232 種:B 抬起時棘爪 C 先抬出齒間、再往後越過;B 下降時 C 落入齒間帶著輪轉", () => {
  const { PITCH, LOOSE } = m232.geometry;
  const span = PITCH + LOOSE;
  const early = m232.motion(LOOSE * 0.5);
  assert.ok(early.lift > 0 && early.a === m232.motion(0).a, "先抬起 C,A 還沒動");
  const up = m232.motion(span);
  close(up.lift, 1, "到頂時 C 完全抬起", 1e-9);
  close(up.wheel, m232.motion(0).wheel, "抬起與往後時輪不動", 1e-12);
  const down = m232.motion(2 * span);
  close(down.wheel - m232.motion(0).wheel, -PITCH, "下降時輪前進一齒", 1e-12);
  close(down.lift, 0, "C 落回齒間", 1e-9);
});
