// 第二十章「蒸汽與氣體裝置」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";

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

test("第 472 種:壓縮空氣錘:滑閥輪流把空氣送到活塞上方與下方;空氣由驅動軸帶動的空氣泵供應", () => {
  const ys = sweep(4 * Math.PI, 200).map((t) => m472.hammer(t));
  assert.ok(ys.some((h) => h.below) && ys.some((h) => !h.below), "空氣輪流進活塞下方與上方");
  for (let i = 1; i < ys.length; i++) {
    if (ys[i].y > ys[i - 1].y + 1e-9) assert.ok(ys[i].below, "錘上升時空氣在活塞下方");
  }
  assert.ok(ys.some((h) => Math.abs(h.y - m472.ANVIL_TOP) < 1e-9), "錘打到砧上");
  const pump = sweep(2 * Math.PI, 12).map((t) => m472.default.pose(t).parts.pumpPiston.position[1]);
  assert.ok(Math.max(...pump) - Math.min(...pump) > 0.5, "空氣泵隨驅動軸往復");
});

test("第 473 種:空氣泵:倒扣的桶下降時空氣經上方的閥排出,提起時氣體經下方的閥吸上來", () => {
  const def = m473.default;
  for (const v of sweep(4 * 0.42, 40).slice(1)) {
    const b = m473.bell(v);
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
