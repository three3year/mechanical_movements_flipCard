// 第三章「間歇與棘輪運動」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, turned } from "./helpers.js";
import fig75, { motion, wheelSpec } from "../models/fig075.js";
import { pointInPolygon } from "../models/contact.js";

const PITCH = (2 * Math.PI) / wheelSpec.teeth;
const STROKE = fig75.driver.cycle[1];
const wheel = (v) => fig75.pose(v).parts.wheelA.angle;

test("第 75 種:C 往復一次,推程中輪 A 前進固定齒數(兩齒),回程中 A 不動", () => {
  for (const k of [0, 1, 3]) {
    const start = 2 * k * STROKE;
    close(wheel(start) - wheel(start + STROKE), 2 * PITCH, `第 ${k} 次推程前進兩齒`);
    const back = sweep(start + 2 * STROKE, 10, start + STROKE).map(wheel);
    for (const a of back) close(a, back[0], "回程中 A 轉角不變");
  }
  assert.ok(wheel(STROKE) < wheel(0), "A 依原圖箭頭順時針前進");
});

test("第 75 種:C 來回多次,A 的轉角只往前、不倒退(間歇、單向)", () => {
  const angles = sweep(STROKE * 9, 400).map(wheel);
  for (let i = 1; i < angles.length; i++) assert.ok(angles[i] <= angles[i - 1] + 1e-12, "A 不倒轉");
  close(angles[0] - angles[angles.length - 1], 2 * PITCH * 5, "九個單程中有五次推程");
});

test("第 75 種:棘爪 B 與止回爪的爪尖始終靠在輪面上,不穿進輪裡;推程中 B 的爪尖在齒根、靠著齒的直面", () => {
  // 輪面以畫出來的棘輪折線為準(齒背是直線段,比 ratchetRadius 的極座標內插略凹進去一點)
  const outline = fig75.parts.find((q) => q.id === "wheelA").shape.outline;
  const edgeDist = (p, poly) => {
    let best = Infinity;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy));
    }
    return best;
  };
  for (const v of sweep(STROKE * 4, 120)) {
    const { a, forward } = motion(v);
    const pose = fig75.pose(v).parts;
    const wheel = outline.map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
    for (const id of ["pawlB", "click"]) {
      const p = pose[id];
      const pivot = p.position ?? fig75.parts.find((q) => q.id === id).center;
      const length = id === "pawlB" ? 0.97 : 0.8;
      const tip = [pivot[0] + length * Math.cos(p.angle), pivot[1] + length * Math.sin(p.angle)];
      const gap = (pointInPolygon(tip, wheel) ? -1 : 1) * edgeDist(tip, wheel);
      assert.ok(gap > -1e-3 && gap < 0.02, `${id} 在主動量 ${v.toFixed(3)} 時離輪面 ${gap}`);
      if (id === "pawlB" && forward) {
        const f = (((Math.atan2(tip[1], tip[0]) - a) / PITCH) % 1 + 1) % 1; // 在一個齒距裡的位置(齒根在 0.98–1)
        close(Math.hypot(...tip), wheelSpec.inner, "推程中爪尖在齒根", 0.01);
        assert.ok(f > 0.9 || f < 0.1, `爪尖靠在齒的直面旁(${f.toFixed(2)})`);
      }
    }
  }
});

import { counter, starPitch, pinPeriod, RELEASE, dropSpan } from "../models/fig063.js";
import { hollowAt as hollow64, period as period64 } from "../models/fig064.js";
import { hollowAt as hollow66 } from "../models/fig066.js";
import { hollowAt as hollow67, centerOfMass } from "../models/fig067.js";
import { register, pitch as pitch76 } from "../models/fig076.js";
import { wormWheel, WHEEL_TEETH } from "../models/worm-jump.js";
import { falling } from "../models/jumps.js";

test("第 63 種:插銷把落板抬起(星形輪不動),插銷滑脫後落板落下、棘爪把星形輪推轉一格", () => {
  const before = counter(RELEASE - 0.01);
  const after = counter(RELEASE + dropSpan + 0.01);
  close(after.star - before.star, starPitch, "每根插銷轉一格", 1e-9);
  close(counter(RELEASE + pinPeriod + dropSpan + 0.01).star - after.star, starPitch, "下一根插銷再轉一格", 1e-9);
  const lifting = sweep(RELEASE - 0.02, 20, RELEASE - 0.6).map(counter);
  for (const c of lifting) close(c.star, lifting[0].star, "落板被抬起時星形輪不動");
  assert.ok(lifting.some((c) => c.height > 0.9), "插銷把落板抬到最高");
  assert.ok(lifting[0].height < lifting[5].height, "抬起是漸進的");
  // 落下是加速的過程:落板轉角單調下降,前段慢後段快
  const fall = sweep(RELEASE + dropSpan, 10, RELEASE).map((w) => counter(w).drop);
  for (let i = 1; i < fall.length; i++) assert.ok(fall[i] <= fall[i - 1] + 1e-9, "落板只往下");
  assert.ok(fall[0] - fall[3] < fall[3] - fall[7], "落下先慢後快");
  assert.ok(Math.abs(counter(RELEASE + dropSpan + 0.3).drop - after.drop) < 1e-9, "落定後靜止");
});

test("第 64 種:蝸輪軸上的銷推著凸輪走,到臨界點凸輪往前掉落(有加速的過程,不是瞬移),再停住等銷追上", () => {
  const wheel = (v) => v;
  const angles = sweep(period64 * 3, 3000).map((v) => hollow64(wheel(v)));
  let jumps = 0;
  let still = 0;
  let maxStep = 0;
  for (let i = 1; i < angles.length; i++) {
    const d = angles[i] - angles[i - 1];
    assert.ok(d >= -1e-12, "只往前");
    maxStep = Math.max(maxStep, d);
    if (d > 0.02) jumps++;
    if (Math.abs(d) < 1e-12) still++;
  }
  assert.ok(jumps >= 3 && jumps < 300, "每圈落一次,落下佔一小段時間");
  assert.ok(maxStep < 0.3, "落下是連續的過程,沒有一步到位");
  assert.ok(still > 0, "掉落後停住");
});

test("落下的過程像從頂點放開的擺:起步慢、越來越快,到底停住", () => {
  const f = sweep(1, 20).map(falling);
  assert.equal(f[0], 0);
  close(f[20], 1);
  for (let i = 1; i < f.length; i++) assert.ok(f[i] >= f[i - 1] - 1e-12, "單調");
  assert.ok(f[5] < 0.2, "前段慢");
  assert.ok(f[15] - f[10] > f[5] - f[0], "中段快");
});

test("第 64、66、67 種:蝸桿每轉一圈,蝸輪 B 轉一齒", () => {
  close(wormWheel(2 * Math.PI) - wormWheel(0), (2 * Math.PI) / WHEEL_TEETH);
});

const B0 = wormWheel(0); // 蝸輪的起始轉角

test("第 66 種:搖臂上的重物 D 被推到頂端後自己落到下方", () => {
  // 推的階段把重物從正下方送到正上方
  close(hollow66(B0 + Math.PI + 0.001) - hollow66(B0 + Math.PI), 0.001, "被推時跟著銷走", 1e-9);
  close(hollow66(B0 + Math.PI), -Math.PI / 2, "落定後在正下方");
  close(hollow66(B0 + 2 * Math.PI - 1e-9), Math.PI / 2, "推到正上方", 1e-6);
});

test("第 67 種:擺錘 E 的重心被推到頂端後翻落到下方", () => {
  close(Math.sin(centerOfMass(hollow67(B0 + Math.PI))), -1, "落定時重心在正下方");
  close(Math.sin(centerOfMass(hollow67(B0 + 2 * Math.PI - 1e-9))), 1, "推到頂端", 1e-6);
});

test("第 76 種:大輪每轉一圈,凸柱 D 撞擊撥爪一次,棘輪 A 轉動一齒;撥爪回落時 A 不動", () => {
  close(register(2 * Math.PI).a - register(0).a, pitch76, "一圈一齒");
  close(register(5 * 2 * Math.PI).a - register(0).a, 5 * pitch76);
  const back = sweep(2 * Math.PI * 0.9, 20, 2 * Math.PI * 0.11).map((v) => register(v).a);
  for (const a of back) close(a, back[0], "撥爪回落與等待時 A 不動");
});

import fig65, { indexing, studStep } from "../models/fig065.js";
import { cAngle as c68, notchStep } from "../models/fig068.js";
import { aAngle as a69, toothStep } from "../models/fig069.js";
import { aAngle as a70, step as step70 } from "../models/fig070.js";
import { cAngle as c71, step as step71 } from "../models/fig071.js";
import fig74, { angles as angles74 } from "../models/fig074.js";

// 驅動件轉一圈從動件前進 step,而且一圈中大部分時間被鎖住不動
function assertIndexing(fn, step, label) {
  const TAU = 2 * Math.PI;
  close(Math.abs(fn(TAU * 3) - fn(0)), 3 * step, `${label}:每轉一圈前進一格`);
  const samples = sweep(TAU, 360).map(fn);
  let still = 0;
  for (let i = 1; i < samples.length; i++) if (Math.abs(samples[i] - samples[i - 1]) < 1e-12) still++;
  assert.ok(still > 360 * 0.6, `${label}:其餘時間鎖住不動`);
  const dir = Math.sign(fn(TAU) - fn(0));
  for (let i = 1; i < samples.length; i++) assert.ok((samples[i] - samples[i - 1]) * dir >= -1e-12, `${label}:只朝一個方向前進`);
}

test("第 65 種:撥爪 A 每轉一圈撥動 D 一個凸柱的距離;撥動時槓桿擋止擺開,其餘時間不動", () => {
  assertIndexing((c) => indexing(c).d, studStep, "第 65 種");
  assert.ok(indexing(0.2).swing > 0.5, "撥動時槓桿擺開");
  assert.equal(indexing(2).swing, 0, "其餘時間槓桿擋住凸柱");
  assert.ok(turned(fig65, "c", 0, 1) !== 0);
});

test("第 68 種:驅動輪 B 每轉一圈,C 轉動一個凹槽的距離,其餘時間被 B 的圓周鎖住", () => {
  assertIndexing(c68, notchStep, "第 68 種");
});

test("第 69 種:單齒小輪 B 每轉一圈,A 轉過一齒;其餘時間被鎖住", () => {
  assertIndexing(a69, toothStep, "第 69 種");
});

test("第 70、71 種:撥爪每轉一圈,凸柱輪轉過一個凸柱的距離,其餘時間凸柱靠在輪緣上被鎖住", () => {
  assertIndexing(a70, step70, "第 70 種");
  assertIndexing(c71, step71, "第 71 種");
});

test("第 74 種:缺齒式斜齒輪 C 使 A、B 間歇地、朝相反方向轉動", () => {
  const TAU = 2 * Math.PI;
  const a = sweep(TAU * 2, 720).map((t) => angles74(t).a);
  const b = sweep(TAU * 2, 720).map((t) => angles74(t).b);
  // A 的軸朝 +x、B 的軸朝 −x;都換成繞 +x 的轉角後比較
  assert.ok((a[a.length - 1] - a[0]) * -(b[b.length - 1] - b[0]) < 0, "A、B 轉向相反");
  let both = 0;
  for (let i = 1; i < a.length; i++) {
    const da = Math.abs(a[i] - a[i - 1]) > 1e-9;
    const db = Math.abs(b[i] - b[i - 1]) > 1e-9;
    if (da && db) both++;
  }
  assert.ok(both <= 4, "A 與 B 輪流轉動(只在交接處同時)");
  close(Math.abs(angles74(TAU).a - angles74(0).a), (Math.PI * 32) / 26, "每圈 A 轉 半圈 × 齒數比", 1e-9);
  assert.ok(fig74.parts.find((p) => p.id === "c").toothed.length === 16, "C 只有一半有齒");
});

import { motion as motion73, toothStep as step73 } from "../models/fig073.js";
import { wheelAngle as wheel77, swing as swing77 } from "../models/fig077.js";
import { wheelAngle as wheel78, swing as swing78 } from "../models/fig078.js";
import { wheelAngle as wheel79, stroke as stroke79 } from "../models/fig079.js";
import { barHeight, swing as swing80 } from "../models/fig080.js";

test("第 73 種:D 每轉一圈,彈簧 B 把 C 壓進 A 的一齒,使 A 轉過一齒;其餘時間 C 擋住 A", () => {
  assertIndexing((d) => motion73(d).a, step73, "第 73 種");
  const pressed = sweep(2 * Math.PI, 360).map((d) => motion73(d).press);
  assert.ok(Math.max(...pressed) > 0.9 && pressed.filter((p) => p === 0).length > 200, "C 只在 B 通過時被壓下");
});

// 雙作用棘爪:每一程(往與返)從動件都前進,而且朝同一方向
function assertBothStrokes(fn, span, label) {
  const a = fn(0);
  const b = fn(span);
  const c = fn(2 * span);
  assert.ok(Math.abs(b - a) > 1e-3 && Math.abs(c - b) > 1e-3, `${label}:往程與返程都推動`);
  assert.ok((b - a) * (c - b) > 0, `${label}:兩程朝同一方向`);
  const samples = sweep(6 * span, 300).map(fn);
  const dir = Math.sign(c - a);
  for (let i = 1; i < samples.length; i++) assert.ok((samples[i] - samples[i - 1]) * dir >= -1e-12, `${label}:不倒退`);
}

test("第 77 種:兩根交替作動的棘爪使輪 B 幾乎連續地(逆時針)旋轉", () => {
  assertBothStrokes(wheel77, swing77, "第 77 種");
  assert.ok(wheel77(swing77 * 4) > 0, "逆時針");
});

test("第 78 種:第 77 種的變形,棘輪 A 幾乎連續地(順時針)旋轉", () => {
  assertBothStrokes(wheel78, swing78, "第 78 種");
  assert.ok(wheel78(swing78 * 4) < 0, "順時針");
});

test("第 79 種:桿 B 往復,兩支振動臂上的棘爪使輪 A 幾乎連續地(順時針)旋轉", () => {
  assertBothStrokes(wheel79, stroke79, "第 79 種");
  assert.ok(wheel79(stroke79 * 4) < 0, "順時針");
});

test("第 80 種:槓桿 C 振動,兩根鉤形棘爪交替把槽形齒條桿 A 往上提", () => {
  assertBothStrokes(barHeight, swing80, "第 80 種");
  assert.ok(barHeight(swing80 * 4) > 0, "往上");
});

import { hammerLift } from "../models/fig072.js";
import { rackRise, stroke as stroke81, engagedSpan } from "../models/fig081.js";
import { wheelAngle as wheel82, swing as swing82 } from "../models/fig082.js";
import { wheelAngle as wheel83, swing as swing83 } from "../models/fig083.js";
import { frameShift } from "../models/fig084.js";
import { rodLift } from "../models/fig085.js";

// 每一圈中「抬起」幾次:從 0 升起、再落回 0 算一次
const lifts = (fn, turns = 1) => {
  const samples = sweep(2 * Math.PI * turns, 2000).map(fn);
  let count = 0;
  for (let i = 1; i < samples.length; i++) if (samples[i - 1] < 1e-9 && samples[i] > 1e-9) count++;
  return count;
};

test("第 72 種:推板輪 B 每旋轉一圈將錘子 A 抬起四次", () => {
  assert.equal(lifts(hammerLift), 4);
  assert.ok(Math.max(...sweep(2 * Math.PI, 400).map(hammerLift)) > 0.05, "錘子確實被抬起");
});

test("第 85 種:軸上的兩個凸輪每轉一圈把桿 A 抬起兩次,桿憑自重落下", () => {
  assert.equal(lifts(rodLift), 2);
});

test("第 81 種:缺齒式正齒輪 A 的齒咬住齒條時把桿 B 推上去,齒離開後彈簧 C 把桿推回原位", () => {
  close(rackRise(engagedSpan / 2) / (engagedSpan / 2), 0.75, "咬合時齒條位移 = 節圓上轉過的弧長");
  close(rackRise(engagedSpan), stroke81, "推到最高");
  close(rackRise(Math.PI * 1.9), 0, "脫離後回到原位");
  close(rackRise(2 * Math.PI + engagedSpan / 2), rackRise(engagedSpan / 2), "每圈重複");
});

test("第 82 種:兩個踏板交替踩下,振動臂上的棘爪使棘輪 A 近乎連續地(順時針)轉動", () => {
  assertBothStrokes(wheel82, swing82, "第 82 種");
  assert.ok(wheel82(swing82 * 4) < 0);
});

test("第 83 種:兩塊齒向相反的弧形板交替作用,使輪 D 近乎連續地旋轉", () => {
  assertBothStrokes(wheel83, swing83, "第 83 種");
});

test("第 84 種:抬起 A 時框架被推向左方,降下 A 時推向右方,置中時凸輪不作用", () => {
  const turns = 3 * 2 * Math.PI;
  assert.ok(frameShift(turns, "raised") < 0, "抬起:往左");
  assert.ok(frameShift(turns, "lowered") > 0, "降下:往右");
  assert.equal(frameShift(turns, "middle"), 0, "置中:不動");
  close(Math.abs(frameShift(2 * Math.PI * 2 + 3.5, "raised") - frameShift(2 * Math.PI + 3.5, "raised")), 0.32, "每圈推一齒");
});

import { pump, lift as lift86 } from "../models/fig086.js";
import { reverser, leverF } from "../models/fig087.js";
import { wheelB } from "../models/fig088.js";

test("第 86 種:凸輪每轉一圈抓住制動裝置 B,帶輪 A 轉起、抬起繩索;到擋止處釋放,輪被泵桶拉回原位", () => {
  close(pump(lift86 * 0.5).wheel, lift86 * 0.5, "鉤住時輪與凸輪同轉");
  assert.equal(pump(lift86 * 0.5).hooked, true);
  close(pump(Math.PI * 1.9).wheel, 0, "釋放後回到原位");
  close(pump(2 * Math.PI + 0.3).wheel, pump(0.3).wheel, "每圈重複");
});

test("第 87 種:軸自動反向——驅動齒輪連續轉,軸來回往復;每次反向時加重槓桿 F 倒向另一側", () => {
  const span = (300 * Math.PI) / 180;
  const a = reverser(span * 0.5).shaft;
  const b = reverser(span * 1.0 - 1e-9).shaft;
  const c = reverser(span * 1.5).shaft;
  assert.ok((b - a) * (c - b) < 0, "前一程與後一程轉向相反");
  close(reverser(span * 2).shaft, reverser(0).shaft, "兩程後回到原處", 1e-9);
  assert.ok(leverF(span * 0.5) * leverF(span * 1.5) < 0, "兩程中 F 倒向不同側");
  close(leverF(span * (1 - 1e-6)), 0, "一程結束時 F 被推到垂直", 1e-3);
});

test("第 88 種:凸輪 A 連續旋轉,輪 B 每圈被帶著轉半圈、其餘半圈靜止", () => {
  close(wheelB(2 * Math.PI) - wheelB(0), Math.PI, "每圈半圈");
  const rest = sweep(2 * Math.PI - 0.05, 20, Math.PI + 0.05).map(wheelB);
  for (const r of rest) close(r, rest[0], "後半圈靜止");
  close(wheelB(1) - wheelB(0.5), 0.5, "前半圈與凸輪同轉");
});
