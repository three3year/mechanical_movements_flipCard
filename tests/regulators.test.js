// 第十四章「擺與鐘錶調節」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";

import * as m315 from "../models/fig315.js";
import * as m316 from "../models/fig316.js";
import * as m317 from "../models/fig317.js";
import * as m318 from "../models/fig318.js";
import * as m319 from "../models/fig319.js";
import * as m320 from "../models/fig320.js";
import * as m321 from "../models/fig321.js";
import { dist } from "../models/kit.js";

test("第 315 種:錐形擺:擺球作圓周運動,擺線描出一個圓錐面", () => {
  const { TOP, L } = m315.geometry;
  const ys = new Set();
  for (const p of sweep(1, 24)) {
    const { bob } = m315.conical(p);
    close(dist(bob, TOP), L, "擺線長度不變", 1e-9);
    ys.add(bob[1].toFixed(9));
    close(Math.hypot(bob[0], bob[2]), L * Math.sin(m315.CONE), "繞心軸作圓周運動", 1e-9);
  }
  assert.equal(ys.size, 1, "擺球高度不變(圓錐)");
});

test("第 315 種:錐形擺:心軸上的搖臂從後面推著擺錘底下的尖銷走", () => {
  const { TOP, PIN_R, LAG, ARM_Y } = m315.geometry;
  for (const p of sweep(1, 12)) {
    const { spindle, bob, dir } = m315.conical(p);
    close(dist(bob, TOP), m315.geometry.L, "擺錘順著擺線", 1e-9);
    // 尖銷的軸線在搖臂那一高度的位置:和心軸同一個方位(搖臂落後它 LAG,側面貼著銷)
    const k = (ARM_Y - TOP[1]) / dir[1];
    const at = [TOP[0] + k * dir[0], TOP[2] + k * dir[2]];
    close(Math.hypot(...at), PIN_R, "尖銷在搖臂的長度之內", 1e-9);
    close(Math.atan2(-at[1], at[0]), Math.atan2(Math.sin(spindle), Math.cos(spindle)), "尖銷和心軸同轉", 1e-9);
  }
  assert.ok(LAG > 0, "搖臂在尖銷後面(心軸逆時針轉)");
});

test("第 316 種:水銀補償擺:擺桿受熱伸長時水銀柱升高,重心(擺動中心)始終在同一位置", () => {
  const c = sweep(40, 10, -10).map((t) => m316.compensation(t));
  assert.ok(c[c.length - 1].rod > c[0].rod && c[c.length - 1].level > c[0].level, "變暖:擺桿伸長、水銀升高");
  for (const x of c) close(x.center, c[0].center, "擺的有效長度不變", 1e-9);
});

test("第 317 種:複合桿補償擺:變暖時複合桿向上彎曲,帶著重物 W 升高,抵消擺桿的伸長", () => {
  const cold = m317.compound(0);
  const warm = m317.compound(35);
  assert.ok(warm.rise > cold.rise, "變暖時 W 升高");
  assert.ok(warm.rod > cold.rod, "擺桿伸長");
  close(warm.center, cold.center, "擺動中心不變", 1e-9);
});

test("第 318 種:錶的調節器:槓桿往右(FAST)時游絲的作用長度變短,往左(SLOW)時變長", () => {
  const [slow, fast] = m318.RANGE;
  assert.ok(m318.regulator(fast).active < m318.regulator(0).active, "往右:變短(擺得變快)");
  assert.ok(m318.regulator(slow).active > m318.regulator(0).active, "往左:變長");
});

test("第 319 種:補償擺輪:溫度升高時複合桿向內彎,配重往內移", () => {
  for (const s of [1, -1]) {
    const hot = m319.rim(40, s).weightRadius;
    const cold = m319.rim(-10, s).weightRadius;
    assert.ok(hot < cold, "升溫時配重較靠內");
  }
});

test("第 320 種:無端鏈:上發條(拉 b)的期間,動力輪 P 照樣被帶動;每一輪重物 W 回到原位", () => {
  const steps = sweep(1, 200).map((p) => m320.chain(p));
  assert.ok(steps.every((c, i) => i === 0 || c.fed > steps[i - 1].fed), "動力輪一直轉,不曾停下");
  const winding = steps.filter((c, i) => i > 0 && c.wound > steps[i - 1].wound);
  assert.ok(winding.length > 0, "有上發條的期間");
  assert.ok(steps.some((c, i) => i > 0 && c.W > steps[i - 1].W), "上發條時 W 被拉上來");
  close(m320.chain(1).W, m320.chain(0).W, "一輪後 W 回到原位", 1e-9);
});

test("第 320 種:無端鏈:棘輪皮帶輪 p 在制動爪下方運行,爪被齒背抬起又落下,停著時落在齒根", () => {
  const click = (p) => m320.clickAngle(p);
  const rest = click(0);
  close(click(0.5), rest, "時鐘照走、沒上發條時 p 不動,爪也不動", 1e-12);
  close(click(1), rest, "上完發條,爪回到齒根", 1e-9);
  const lifts = sweep(1, 400, 0.75).map(click);
  assert.ok(lifts.every((a) => a <= rest + 0.002), "爪只會被齒背抬起,不會比齒根更低");
  // 爪落下(角度變大)的每一段:從靜止開始、越落越快,不是一步跳到底
  const falls = [];
  for (let i = 1; i < lifts.length; i++) {
    const d = lifts[i] - lifts[i - 1];
    if (d > 1e-6) {
      if (!(lifts[i - 1] - (lifts[i - 2] ?? lifts[i - 1]) > 1e-6)) falls.push([]);
      falls.at(-1).push(d);
    }
  }
  assert.ok(falls.length >= 5, `上發條時爪一齒一齒地落下(實際 ${falls.length} 次)`);
  for (const f of falls.filter((f) => f.length > 2)) assert.ok(f[1] > f[0], "落下是加速的");
  assert.ok(falls.every((f) => f.length > 1), "每次落下都有過程,不是瞬移");
  // 查表內插會讓爪在兩個取樣之間略深一點;以爪尖的位移算,容許 0.003(爪長 0.57)
  for (const p of sweep(1, 800)) assert.ok(click(p) <= m320.clickLimit(p) + 0.003 / 0.57, `進程 ${p.toFixed(4)}:爪尖穿進棘輪`);
  const turn = m320.ratchetAngle(m320.chain(1).wound) - m320.ratchetAngle(m320.chain(0).wound);
  close(turn % ((2 * Math.PI) / m320.RATCHET.teeth), 0, "每次上發條 p 轉過整數個齒", 1e-9);
  assert.ok(turn > 0, "p 只往逆時針(棘輪放行的方向)轉");
});

test("第 321 種:哈里森的動力盒:上發條時制動爪 T 擋住大棘輪,彈簧 S、S' 繼續推動主輪 G", () => {
  const { P } = m321.geometry;
  const during = sweep(P.wound - 0.01, 30, P.run + 0.01).map((p) => m321.harrison(p));
  assert.ok(during.every((h) => h.big === during[0].big), "上發條時大棘輪不動");
  assert.ok(during.every((h, i) => i === 0 || h.g > during[i - 1].g), "主輪照轉(逆時針,照原圖)");
  assert.ok(Math.abs(during[during.length - 1].spring) < Math.abs(during[0].spring), "彈簧放鬆、推著主輪");
  close(m321.harrison(1).weight, m321.harrison(0).weight, "一輪後重物回到原位", 1e-9);
});

test("第 321 種:哈里森的動力盒:T 被大棘輪的齒背抬起又落回,R 在上發條時被小棘輪抬起又落回;停著時都在齒根", () => {
  const { P } = m321.geometry;
  const at = (p) => m321.clicks(p);
  close(at(1).T, at(0).T, "一輪後 T 回到原處", 1e-9);
  close(at(1).R, at(0).R, "一輪後 R 回到原處", 1e-9);
  const held = sweep(P.wound, 20, P.run).map((p) => at(p).T);
  assert.ok(held.every((t) => Math.abs(t - held[0]) < 1e-9), "上發條時 T 一直頂著大棘輪");
  const moved = (key, from, to) => sweep(to, 300, from).some((p) => Math.abs(at(p)[key] - at(from)[key]) > 0.02);
  assert.ok(moved("T", 0, P.run), "照走時大棘輪從 T 底下轉過,T 被齒背抬起");
  assert.ok(moved("R", P.run, P.wound), "上發條時小棘輪從 R 底下轉過");
  assert.ok(!moved("R", 0, P.run), "照走時 R 扣住小棘輪,不動");
  for (const p of sweep(1, 800)) {
    const c = at(p);
    const lim = m321.clickLimits(p);
    // 查表內插的誤差,以爪尖的位移算容許 0.003(T 長 3.05、R 長 0.53)
    assert.ok(c.T <= lim.T + 0.003 / 3.05 && c.R >= lim.R - 0.003 / 0.53, `進程 ${p.toFixed(4)}:爪尖穿進棘輪`);
  }
  // 爪過了齒尖是加速落回(T 落下時角度變大、R 落下時角度變小),不是一步跳到底
  for (const [key, into, from, to] of [["T", 1, 0, P.run], ["R", -1, P.run, P.wound]]) {
    const xs = sweep(to, 600, from).map((p) => at(p)[key] * into);
    let run = [];
    let checked = 0;
    for (let i = 1; i < xs.length; i++) {
      const d = xs[i] - xs[i - 1];
      if (d > 1e-6) run.push(d);
      else {
        if (run.length > 2) {
          assert.ok(run[1] > run[0], `${key} 落下是加速的`);
          checked++;
        }
        if (run.length === 1) assert.fail(`${key} 一步就落到底(瞬移)`);
        run = [];
      }
    }
    assert.ok(checked >= 2, `${key} 有落下的過程`);
  }
});
