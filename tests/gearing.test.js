// 第二章「齒輪傳動」:斷言對應原文(齒數比、轉向),並檢查咬合的齒不重疊
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, part, turned, assertMeshFree, sweep } from "./helpers.js";
import fig24 from "../models/fig024.js";
import fig34 from "../models/fig034.js";

test("第 24 種:正齒輪,主動輪轉 +θ 時從動輪反向轉 θ·N主/N從", () => {
  const nL = part(fig24, "left").teeth;
  const nR = part(fig24, "right").teeth;
  assert.deepEqual([nL, nR], [28, 34], "齒數照原圖");
  close(turned(fig24, "right", 0, 0.7), (-0.7 * nL) / nR);
  assertMeshFree(fig24, "left", "right", sweep(Math.PI, 60));
});

test("第 34 種:「使用內齒式齒輪時,兩者的旋轉方向相同」", () => {
  const nP = part(fig34, "pinion").teeth;
  const nR = part(fig34, "ring").teeth;
  const ring = turned(fig34, "ring", 0, 0.9);
  assert.ok(ring > 0, "內齒輪與小齒輪同向");
  close(ring, (0.9 * nP) / nR);
  assertMeshFree(fig34, "pinion", "ring", sweep(Math.PI, 60));
});

import fig27, { wheelAngle, roller, GROOVE_COUNT } from "../models/fig027.js";
import fig28, { distance, smallRadius } from "../models/fig028.js";
import fig32, { radii as radii32 } from "../models/fig032.js";
import fig40 from "../models/fig040.js";
import fig41 from "../models/fig041.js";
import fig44 from "../models/fig044.js";
import fig45, { radii as radii45 } from "../models/fig045.js";
import { sliceAngle } from "../models/gears.js";
import { signedAngle } from "../models/kit.js";

test("第 27 種:三角形輪的摩擦滾子始終在大輪的徑向溝槽內,帶動大輪轉動(同向、半速)", () => {
  close(turned(fig27, "wheel", 0, 1.2), 0.6, "大輪轉三角形輪的一半");
  const groove = (2 * Math.PI) / GROOVE_COUNT;
  for (const phi of sweep(2 * Math.PI, 36)) {
    const w = wheelAngle(phi);
    for (const k of [0, 1, 2]) {
      const p = roller(phi, k);
      if (Math.hypot(p[0], p[1]) < 1e-6) continue; // 滾子正好經過軸心
      const off = signedAngle(Math.atan2(p[1], p[0]) - w);
      const k60 = Math.round(off / groove);
      close(off, k60 * groove, `滾子 ${k} 在溝槽中心線上`, 1e-9);
    }
  }
});

test("第 28 種:改變上方輪與下方輪中心的距離,調整相對轉速", () => {
  const rate = (state) => turned(fig28, "small", 0, 1, state);
  close(rate("middle"), distance("middle") / smallRadius);
  assert.ok(rate("near") < rate("middle") && rate("middle") < rate("far"), "離中心越遠,小輪轉得越快");
});

test("第 32 種:摩擦輪靠摩擦咬合,兩輪反向轉,轉角比為半徑反比", () => {
  close(turned(fig32, "right", 0, 0.9), (-0.9 * radii32[0]) / radii32[1]);
});

for (const def of [fig40, fig41, fig44]) {
  test(`第 ${def.figure} 種:兩輪反向等速轉,每一片齒都咬合;齒沿齒面錯開,接觸更連續`, () => {
    const top = part(def, "top");
    const bottom = part(def, "bottom");
    close(turned(def, "bottom", 0, 0.7), -0.7 * (top.teeth / bottom.teeth));
    // 每一片:上輪片偏轉 δ、下輪片偏轉 −δ·N上/N下,咬合關係與整輪相同
    for (let i = 0; i < top.slices; i++) close(sliceAngle(bottom, i), (-sliceAngle(top, i) * top.teeth) / bottom.teeth, `第 ${i} 片`);
    const pitch = (2 * Math.PI) / top.teeth;
    const offsets = Array.from({ length: top.slices }, (_, i) => sliceAngle(top, i));
    assert.ok(Math.max(...offsets) - Math.min(...offsets) >= pitch * 0.7, "各片的齒錯開將近一個齒距以上");
  });
}

test("第 45 種:摩擦式溝槽傳動,兩輪反向轉,轉角比為半徑反比", () => {
  close(turned(fig45, "bottom", 0, 0.8), (-0.8 * radii45[0]) / radii45[1]);
});

import fig25 from "../models/fig025.js";
import fig26 from "../models/fig026.js";
import fig29, { gearAngle as gear29, TEETH as TEETH29 } from "../models/fig029.js";
import fig31, { TEETH as TEETH31 } from "../models/fig031.js";
import fig42 from "../models/fig042.js";
import fig43 from "../models/fig043.js";

const ratioTest = (def, a, b) => {
  const na = part(def, a).teeth;
  const nb = part(def, b).teeth;
  close(Math.abs(turned(def, b, 0, 0.6)), (0.6 * na) / nb, "轉角比為齒數反比");
};

test("第 25 種:斜齒輪把旋轉傳到成直角的軸,轉角比為齒數反比", () => {
  ratioTest(fig25, "top", "left");
  const axes = [part(fig25, "top").axis, part(fig25, "left").axis];
  close(axes[0][0] * axes[1][0] + axes[0][1] * axes[1][1] + axes[0][2] * axes[1][2], 0, "兩軸成直角");
});

test("第 26 種:冠狀齒輪與正齒輪咬合,轉角比為齒數反比", () => {
  ratioTest(fig26, "spur", "crown");
});

test("第 29 種:碟形輪上的螺旋螺紋帶動正齒輪,碟形輪每轉一圈正齒輪移動一齒", () => {
  close(turned(fig29, "gear", 0, 2 * Math.PI), (2 * Math.PI) / TEETH29, "一圈一齒");
  close(gear29(3 * 2 * Math.PI), (3 * 2 * Math.PI) / TEETH29);
});

test("第 31 種:蝸桿與蝸輪,達成與第 29 種相同的結果——蝸桿每轉一圈蝸輪轉一齒", () => {
  close(Math.abs(turned(fig31, "wheel", 0, 2 * Math.PI)), (2 * Math.PI) / TEETH31);
});

test("第 42、43 種:兩軸斜向配置的齒輪,轉角比為齒數反比", () => {
  ratioTest(fig42, "top", "bottom");
  ratioTest(fig43, "big", "small");
});

import fig30 from "../models/fig030.js";
import fig33, { D as D33, axes as axes33 } from "../models/fig033.js";
import fig35, { contactRadius, pinionRadius } from "../models/fig035.js";
import fig37, { heightAt, radii as radii37 } from "../models/fig037.js";
import fig38, { sectors as sectors38, pitchRadius as pitchRadius38 } from "../models/fig038.js";

// 數值導數:主動量 v 附近從動件 id 的轉速比
const rate = (def, id, v, h = 1e-4) => (def.pose(v + h).parts[id].angle - def.pose(v - h).parts[id].angle) / (2 * h);

for (const def of [fig30, fig33, fig38]) {
  test(`第 ${def.figure} 種:非圓齒輪一直保持咬合,主動輪轉一圈從動輪也(反向)轉一圈`, () => {
    close(turned(def, "driven", 0, 2 * Math.PI), -2 * Math.PI, "一圈對一圈", 1e-6);
  });
}

test("第 30 種:矩形齒輪使被驅動齒輪產生變速的旋轉運動", () => {
  const rates = sweep(Math.PI / 2, 40).map((v) => -rate(fig30, "driven", v));
  assert.ok(Math.max(...rates) / Math.min(...rates) > 1.3, "轉速有明顯變化");
});

test("第 33 種:橢圓形正齒輪的速度變化取決於長短軸的比例", () => {
  const [a, b] = axes33;
  const rates = sweep(Math.PI, 360).map((v) => -rate(fig33, "driven", v));
  close(Math.max(...rates), a / (D33 - a), "長軸對著從動輪時最快", 2e-3);
  close(Math.min(...rates), b / (D33 - b), "短軸對著從動輪時最慢", 2e-3);
});

test("第 35 種:小齒輪等速轉,橢圓齒輪的轉速與接觸處半徑成反比(變速)", () => {
  for (const v of sweep(6, 12, 0.3)) close(-rate(fig35, "wheel", v), pinionRadius / contactRadius(v), `主動量 ${v}`, 1e-3);
});

test("第 37 種:錐形齒輪等速轉,右輪轉速隨螺旋齒栓的高度(兩輪接觸半徑)而變", () => {
  for (const v of sweep(4, 10, 0.2)) {
    const h = heightAt(v);
    close(rate(fig37, "right", v), radii37.rLeft(h) / radii37.rRight(h), `主動量 ${v}`, 2e-3);
  }
});

test("第 38 種:旋轉的一部分保持等速、另一部分變速", () => {
  // 接觸處在主動輪局部角 −θ:θ 從 0 起先經過大扇形(對從動輪的小扇形)、再經過齒圈、最後是小扇形(對大扇形)
  const { R, RL, RS, LARGE, SMALL } = sectors38;
  for (const v of sweep(LARGE - 0.01, 6, 0.01)) close(-rate(fig38, "driven", v), RL / RS, "大扇形帶小扇形:從動輪快", 1e-6);
  for (const v of sweep(2 * Math.PI - SMALL - 0.01, 30, LARGE + 0.01)) close(-rate(fig38, "driven", v), 1, "齒圈:兩輪等速", 1e-6);
  for (const v of sweep(2 * Math.PI - 0.01, 6, 2 * Math.PI - SMALL + 0.01)) close(-rate(fig38, "driven", v), RS / RL, "小扇形帶大扇形:從動輪慢", 1e-6);
  assert.ok(2 * Math.PI - LARGE - SMALL > Math.PI, "等速的齒圈佔一圈的大部分");
  close(RL + RS, 2 * R, "扇形一大一小,與齒圈同中心距");
});

test("第 38 種:照原圖,兩輪同形——齒圈加上一段大半徑、一段小半徑的扇形,交界是徑向的階", () => {
  const { R, RL, RS } = sectors38;
  const radii = new Set(sweep(2 * Math.PI, 720).map((a) => pitchRadius38(a)));
  assert.deepEqual([...radii].sort(), [R, RL, RS].sort());
  assert.deepEqual(part(fig38, "driver").shape.outline.length, part(fig38, "driven").shape.outline.length);
  close(fig38.pose(0).parts.driven.angle, Math.PI, "右輪是左輪轉半圈");
});

import fig36, { mangle, radii as radii36 } from "../models/fig036.js";
import fig39 from "../models/fig039.js";
import fig46, { fusee, centers as centers46 } from "../models/fig046.js";
import { rotateAbout } from "../models/kit.js";

test("第 36 種:曼格輪把小齒輪的連續旋轉轉換為輪的往復旋轉", () => {
  const w = sweep(80, 2000).map((a) => mangle(a).wheel);
  const lo = Math.min(...w);
  const hi = Math.max(...w);
  for (const x of w) assert.ok(x >= lo && x <= hi, "輪只在兩端之間來回");
  // 轉向序列(略去停在端頭的那幾段)
  const signs = [];
  for (let i = 1; i < w.length; i++) {
    const d = Math.sign(w[i] - w[i - 1]);
    if (d && d !== signs[signs.length - 1]) signs.push(d);
  }
  assert.ok(signs.length >= 3, "輪來回改變轉向");
});

test("第 36 種:小齒輪在外緣(內咬合)時與輪同向,在內緣(外咬合)時反向", () => {
  for (const a of sweep(80, 400)) {
    const h = 1e-4;
    const m = mangle(a);
    if (mangle(a - h).track !== m.track || mangle(a + h).track !== m.track) continue;
    const dw = (mangle(a + h).wheel - mangle(a - h).wheel) / (2 * h);
    if (m.track === "outer") close(dw, radii36.RP / radii36.RO, "同向", 1e-6);
    if (m.track === "inner") close(dw, -radii36.RP / radii36.RI, "反向", 1e-6);
  }
});

test("第 39 種:行星齒輪(剛性連在連桿上)繞一圈,太陽齒輪轉兩圈", () => {
  const sun = (t) => fig39.pose(t).parts.sun.angle;
  close(sun(2 * Math.PI) - sun(0), 4 * Math.PI, "一圈對兩圈", 1e-9);
});

test("第 46 種:上緊時鏈索在鏈索輪的小直徑一端,放鬆時移到大直徑一端", () => {
  assert.ok(fusee(0.02).radius < fusee(0.98).radius, "接觸半徑隨放鬆變大");
  const radii = sweep(1, 20).map((u) => fusee(u).radius);
  for (let i = 1; i < radii.length; i++) assert.ok(radii[i] >= radii[i - 1] - 1e-12, "只增不減");
  assert.equal(fig46.driver.type, "virtual");
});

test("第 46 種:鏈索兩端固定,長度不變", () => {
  const length = (u) => {
    const p = fig46.pose(u).paths.chain.points;
    let l = 0;
    for (let i = 1; i < p.length; i++) l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1], p[i][2] - p[i - 1][2]);
    return l;
  };
  const l0 = length(0.1);
  // 鏈索輪是階梯狀的,取樣的螺旋在換層處有落差,長度只近似不變
  for (const u of [0.3, 0.6, 0.9]) assert.ok(Math.abs(length(u) - l0) / l0 < 0.05, `放鬆 ${u}`);
});

test("第 46 種:兩輪之間的鏈索是水平的,接在鏈索輪目前那一層上;兩端各自跟著所固定的輪轉", () => {
  const ends = (u) => {
    const p = fig46.pose(u).paths.chain.points;
    return { first: p[0], last: p[p.length - 1], p };
  };
  // 世界點 → 轉回輪轉角 0 時的位置(輪繞 Y 轉 angle)
  const local = (center, angle, w) => rotateAbout([w[0] - center[0], w[1] - center[1], w[2] - center[2]], [0, 1, 0], -angle);
  const a0 = ends(0);
  for (const u of sweep(1, 20)) {
    const { first, last, p } = ends(u);
    const { contact, barrelAngle, fuseeAngle, radius } = fusee(u);
    // 離開發條盒、接上鏈索輪的兩點:同高度,鏈索輪那一點在目前那層的半徑上
    const i = p.findIndex((q) => q[0] > 0);
    close(p[i][1], p[i - 1][1], `放鬆 ${u}:兩輪之間水平`, 1e-9);
    const r = Math.hypot(p[i][0] - centers46.fusee[0], p[i][2] - centers46.fusee[2]);
    assert.ok(Math.abs(r - radius) < 0.06, `放鬆 ${u}:接在半徑 ${radius} 那層,實際 ${r}`);
    assert.ok(contact >= 0);
    // 兩端固定:在各自輪的局部座標裡不動
    const fb = local(centers46.barrel, barrelAngle, first);
    const fb0 = local(centers46.barrel, 0, a0.first);
    const lf = local(centers46.fusee, fuseeAngle, last);
    const lf0 = local(centers46.fusee, 0, a0.last);
    for (let k = 0; k < 3; k++) {
      close(fb[k], fb0[k], `放鬆 ${u}:發條盒那端固定`, 1e-9);
      close(lf[k], lf0[k], `放鬆 ${u}:鏈索輪那端固定`, 1e-9);
    }
  }
});
