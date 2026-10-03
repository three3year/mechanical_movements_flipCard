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

test("第 321 種:哈里森的動力盒:上發條時制動爪 T 擋住大棘輪,彈簧 S、S' 繼續推動主輪 G", () => {
  const { P } = m321.geometry;
  const during = sweep(P.wound - 0.01, 30, P.run + 0.01).map((p) => m321.harrison(p));
  assert.ok(during.every((h) => h.big === during[0].big), "上發條時大棘輪不動");
  assert.ok(during.every((h, i) => i === 0 || h.g < during[i - 1].g), "主輪照轉");
  assert.ok(Math.abs(during[during.length - 1].spring) < Math.abs(during[0].spring), "彈簧放鬆、推著主輪");
  close(m321.harrison(1).weight, m321.harrison(0).weight, "一輪後重物回到原位", 1e-9);
});
