// 第三章「離合與變速」:皮帶移動換速(第 58–62 種),斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, turned } from "./helpers.js";
import fig58, { speeds as speeds58 } from "../models/fig058.js";
import fig59 from "../models/fig059.js";
import fig60 from "../models/fig060.js";
import fig61 from "../models/fig061.js";
import fig62 from "../models/fig062.js";

const lowerRate = (fn, state) => Math.abs(fn(1, state).lower - fn(0, state).lower);

test("第 58 種:皮帶移到不同的皮帶輪,下方軸得到三種不同的速度;在鬆動輪時下方軸不動", () => {
  const slow = lowerRate(speeds58, "p2");
  const mid = lowerRate(speeds58, "p3");
  const fast = lowerRate(speeds58, "p4");
  assert.ok(slow < mid && mid < fast, "越靠左的皮帶輪,下方軸越快");
  assert.equal(lowerRate(speeds58, "loose"), 0);
  assert.equal(fig58.parts.filter((p) => p.kind === "pulley").length, 5, "鼓輪加下方四個皮帶輪");
});

test("第 59 種:皮帶在中間輪時下方軸較慢,在右側輪時較快,快慢與齒輪直徑成比例", () => {
  const slow = Math.abs(turned(fig59, "slowDown", 0, 1, "middle"));
  const fast = Math.abs(turned(fig59, "slowDown", 0, 1, "right"));
  close(fast / slow, 4, "直徑比 2 ÷ (1/2)");
  assert.equal(turned(fig59, "slowDown", 0, 1, "loose"), 0);
});

test("第 60 種:左皮帶在鬆動輪、右皮帶在固定輪時較慢;兩者對調時較快", () => {
  const slow = Math.abs(turned(fig60, "shaft", 0, 1, "slow"));
  const fast = Math.abs(turned(fig60, "shaft", 0, 1, "fast"));
  assert.ok(fast > slow);
});

test("第 61 種:推動中間皮帶輪時是單純的運動;推動右側皮帶輪(第三個斜齒輪被制動)時軸得到雙倍速度", () => {
  const drum = (state) => turned(fig61, state === "middle" ? "middle" : "right", 0, 1, state);
  close(turned(fig61, "shaft", 0, 1, "middle"), drum("middle"), "單純:軸與皮帶輪同轉");
  close(turned(fig61, "shaft", 0, 1, "right"), 2 * drum("right"), "雙倍");
  assert.equal(turned(fig61, "shaft", 0, 1, "loose"), 0);
});

test("第 62 種:右輪與軸同向時從雙倍速度中扣除第三個斜齒輪的轉動;右皮帶交叉時改為加上", () => {
  const carrier = turned(fig62, "carrier", 0, 1, "open");
  const sun2Open = turned(fig62, "fourth", 0, 1, "open");
  const sun2Crossed = turned(fig62, "fourth", 0, 1, "crossed");
  assert.ok(sun2Open * carrier > 0 && sun2Crossed * carrier < 0, "開口同向、交叉反向");
  close(turned(fig62, "shaft", 0, 1, "open"), 2 * carrier - sun2Open, "相減");
  close(turned(fig62, "shaft", 0, 1, "crossed"), 2 * carrier + Math.abs(sun2Crossed), "相加");
});
