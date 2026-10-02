// 第八章「引擎與調速機構」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import { dist } from "../models/kit.js";
import { feed as feed155, step as step155, stroke as stroke155 } from "../models/fig155.js";
import { bellCrank as crank156 } from "../models/fig156.js";
import { bellCrank as crank157 } from "../models/fig157.js";
import { treadle as treadle158 } from "../models/fig158.js";
import { treadle as treadle159, ropeLengthAt } from "../models/fig159.js";
import { lathe as lathe160 } from "../models/fig160.js";

const TAU = 2 * Math.PI;

test("第 155 種:往復的桿經肘節槓桿上的棘爪使齒輪間歇轉動;棘爪換邊時齒輪反向", () => {
  const cw = sweep(stroke155 * 6, 300).map((v) => feed155(v, 1).gear);
  for (let i = 1; i < cw.length; i++) assert.ok(cw[i] <= cw[i - 1] + 1e-12, "單向");
  close(feed155(stroke155 * 2, 1).gear - feed155(0, 1).gear, -step155, "每次往復推進一次");
  close(feed155(stroke155 * 2, -1).gear - feed155(0, -1).gear, step155, "換邊後反向");
});

test("第 156 種:圓盤上的曲柄銷在曲柄搖臂的溝槽內作動,搖臂來回擺動(變速的交替運動)", () => {
  const ys = sweep(TAU, 360).map((t) => crank156(t).end[1]);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 0.3);
  close(ys[0], ys[ys.length - 1], "一圈回到原處", 1e-9);
});

test("第 157 種:以連桿取代溝槽,曲柄搖臂同樣來回擺動,連桿長度不變", () => {
  const ref = crank157(0);
  for (const t of sweep(TAU, 36)) {
    const { pin, top } = crank157(t);
    close(dist(pin, top), dist(ref.pin, ref.top), "連桿長度", 1e-9);
  }
});

test("第 158 種:踏板往復擺動,經連桿使圓盤連續轉動(連桿長度不變)", () => {
  const ref = treadle158(0);
  const angles = sweep(TAU, 180).map((t) => treadle158(t).angle);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.2, "踏板擺動");
  for (const t of sweep(TAU, 36)) {
    const { pin, j } = treadle158(t);
    close(dist(pin, j), dist(ref.pin, ref.j), "連桿長度", 1e-9);
  }
});

test("第 159 種:以繩與滑輪取代連桿,繩長不變", () => {
  for (const t of sweep(TAU, 36)) close(ropeLengthAt(t), ropeLengthAt(0), `轉角 ${t}`, 1e-9);
  const ps = sweep(TAU, 180).map((t) => treadle159(t).psi);
  assert.ok(Math.max(...ps) - Math.min(...ps) > 0.2, "踏板擺動");
});

test("第 160 種:踩下踏板,繞在皮帶輪上的帶子使它轉動;放開時竿把踏板抬起,皮帶輪反轉", () => {
  const down = lathe160(-0.1);
  const up = lathe160(0.1);
  assert.ok(down.pull > up.pull, "踩下時帶子被拉下");
  assert.ok((down.pulley - lathe160(0).pulley) * (up.pulley - lathe160(0).pulley) < 0, "來回時轉向相反");
  close(down.pulley - lathe160(0).pulley, -(down.pull - lathe160(0).pull) / 0.55, "轉過的弧長 = 帶子被拉下的長度");
});

import fig161, { governor as gov161 } from "../models/fig161.js";
import { regulator as reg162 } from "../models/fig162.js";
import { regulator as reg163 } from "../models/fig163.js";
import { governor as gov170 } from "../models/fig170.js";

test("第 161 種:引擎速度增加,球向外飛出,把底部的滑塊抬升;速度降低時相反", () => {
  const s = sweep(10, 40).map((v) => gov161(v));
  for (let i = 1; i < s.length; i++) {
    assert.ok(s[i].alpha >= s[i - 1].alpha - 1e-12, "轉速越大張角越大");
    assert.ok(s[i].sleeve >= s[i - 1].sleeve - 1e-12, "滑塊越高");
  }
  assert.ok(gov161(10).sleeve > gov161(0).sleeve + 0.2);
  assert.equal(fig161.driver.label, "轉速");
});

test("第 162 種:速度正常時兩個斜齒輪靜止;過快與過慢時下方水平軸朝相反方向轉", () => {
  assert.equal(reg162(0.7, "normal").gate, 0);
  assert.ok(reg162(0.7, "fast").gate * reg162(0.7, "slow").gate < 0);
});

test("第 163 種:皮帶在鬆動輪上時不傳動;過快時移到下輪、過慢時移到上輪,傳動方向相反", () => {
  assert.equal(reg163(0.5, "normal").travel, 0);
  assert.ok(reg163(0.5, "fast").y < reg163(0.5, "normal").y && reg163(0.5, "slow").y > reg163(0.5, "normal").y);
  assert.ok(reg163(0.5, "fast").travel !== 0 && reg163(0.5, "slow").travel !== 0);
  assert.ok(reg163(0.5, "fast").direction * reg163(0.5, "slow").direction < 0);
});

test("第 170 種:交叉的搖臂隨轉速張開,經短連桿移動閥桿", () => {
  const rods = sweep(10, 20, 7).map((v) => gov170(v).rod);
  assert.ok(Math.abs(rods[rods.length - 1] - rods[0]) > 0.05, "閥桿隨轉速移動");
  for (let i = 1; i < rods.length; i++) assert.ok(rods[i] <= rods[i - 1] + 1e-12, "單調");
});
