// 第十三章「擒縱機構」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import { penetrationDepth, polygonsOverlap } from "../models/contact.js";
import { placePoly } from "../models/escapement.js";

import * as m288 from "../models/fig288.js";
import * as m289 from "../models/fig289.js";
import * as m290 from "../models/fig290.js";
import * as m292 from "../models/fig292.js";
import * as m297 from "../models/fig297.js";
import * as m299 from "../models/fig299.js";
import * as m291 from "../models/fig291.js";
import * as m293 from "../models/fig293.js";
import fig294 from "../models/fig294.js";
import fig295 from "../models/fig295.js";
import * as cyl from "../models/cylinder-escapement.js";
import * as m296 from "../models/fig296.js";
import * as m298 from "../models/fig298.js";
import fig300 from "../models/fig300.js";
import fig301 from "../models/fig301.js";
import * as twin from "../models/twin-wheel-escapement.js";
import * as m302 from "../models/fig302.js";
import * as m303 from "../models/fig303.js";
import * as m304 from "../models/fig304.js";
import * as m305 from "../models/fig305.js";
import * as m306 from "../models/fig306.js";
import * as m307 from "../models/fig307.js";
import * as m308 from "../models/fig308.js";
import * as m309 from "../models/fig309.js";
import * as m310 from "../models/fig310.js";
import * as m311 from "../models/fig311.js";
import * as m312 from "../models/fig312.js";
import * as m313 from "../models/fig313.js";
import * as m314 from "../models/fig314.js";

/**
 * 由接觸算的擒縱(escapeByContact):擺一個來回輪正好轉過一齒、方向對;擺一程(從一端擺到另一端)轉過約半齒
 * (兩個叉瓦各放一次;齒停在哪裡由接觸決定,叉瓦隨擺沿圓弧走、有回退時兩程會差一點,所以容許 0.35–0.65 齒)
 */
function escapes(e, pitch, dir) {
  close(e.step, dir * pitch, "擺一個來回,輪轉過一齒", 1e-6);
  const w = e.angle;
  close(w(2 * e.period) - w(0), 2 * dir * pitch, "兩個來回,兩齒", 1e-6);
  // 有的輪在擺到盡頭的那一刻還在轉,所以取幾個起點(擺的一程分四段),用最接近半齒的那一個
  const halves = [0, 1, 2, 3].map((k) => ((w((k * e.period) / 8 + e.period / 2) - w((k * e.period) / 8)) * dir) / pitch);
  const halfway = halves.reduce((m, x) => (Math.abs(x - 0.5) < Math.abs(m - 0.5) ? x : m));
  assert.ok(halfway > 0.35 && halfway < 0.65, `擺一程約半齒(實際 ${halves.map((x) => x.toFixed(2)).join("、")} 齒)`);
}

/** 由接觸算:e.at(v) 裡的兩組外形(撥動的銷與叉口、凸柱與細彈簧等)在整個來回裡都不互相穿入 */
function apart(e, a, b, n = 720, eps = 2e-3) {
  const list = (x) => (Array.isArray(x[0][0]) ? x : [x]);
  for (let i = 0; i <= n; i++) {
    const v = (e.period * 2 * i) / n;
    const s = e.at(v);
    for (const p of list(s[a])) for (const q of list(s[b])) assert.ok(penetrationDepth(p, q) < eps, `主動量 ${v.toFixed(3)}:${a} 與 ${b} 互相穿入 ${penetrationDepth(p, q).toFixed(4)}`);
  }
}

/** 由接觸算:叉瓦(掣子)與輪齒在整個來回裡都不互相穿入 */
function noPenetration(e, n = 360, eps = 2e-3) {
  for (let i = 0; i <= n; i++) {
    const v = (e.period * 2 * i) / n;
    const { teeth, stops, layers, stopLayers } = e.at(v);
    for (const [j, s] of stops.entries())
      for (const [i, t] of teeth.entries())
        if (!layers || layers[i] === stopLayers[j])
          assert.ok(penetrationDepth(s, t) < eps, `主動量 ${v.toFixed(3)}:擋件穿入輪齒 ${penetrationDepth(s, t).toFixed(4)}`);
  }
}

test("第 288 種:回退式擒縱:擺每擺一次放走半個齒;叉瓦面不與軸 a 同心,齒落在叉瓦上後輪被推回一點(回退)", () => {
  const e = m288.escapement;
  assert.ok(e.period > 0);
  escapes(e, m288.PITCH, 1);
  const ws = sweep(2 * e.period, 480).map(m288.wheelAngle);
  assert.ok(ws.slice(1).some((w, i) => w < ws[i] - 1e-4), "有回退(輪短暫倒轉)");
  noPenetration(e);
});

test("第 289 種:靜擊式擒縱:叉瓦面與軸 a 同心,齒抵住叉瓦的期間輪完全靜止", () => {
  const e = m289.escapement;
  escapes(e, m289.PITCH, 1);
  const ws = sweep(2 * e.period, 480).map(m289.wheelAngle);
  assert.ok(ws.every((w, i) => i === 0 || w >= ws[i - 1] - 1e-5), "從不回退");
  const still = ws.slice(1).filter((w, i) => Math.abs(w - ws[i]) < 1e-5).length;
  assert.ok(still > 150, `鎖住時完全靜止(靜止的取樣 ${still})`);
  noPenetration(e);
});

test("第 290 種:擺式擒縱:框架每擺一次,叉瓦 A、B 輪流放走半個齒(輪依原圖箭頭順時針轉)", () => {
  escapes(m290.escapement, m290.PITCH, -1);
  noPenetration(m290.escapement);
});

test("第 292 種:凸柱式擒縱:凸柱交替抵在前、後叉瓦上;叉瓦為以 F 為圓心的圓弧,所以是靜擊式", () => {
  const e = m292.escapement;
  close(e.step, -2 * m292.STEP, "擺一個來回,前後各放走一根凸柱", 1e-9);
  const ws = sweep(2 * e.period, 480).map(m292.wheelAngle);
  // 凸柱以多邊形近似,貼著弧面時有 1e-5 弧度的數值抖動
  assert.ok(ws.every((w, i) => i === 0 || w <= ws[i - 1] + 5e-5), "靜擊式:從不回退");
  const still = ws.slice(1).filter((w, i) => Math.abs(w - ws[i]) < 5e-5).length;
  assert.ok(still > 150, `凸柱抵住叉瓦時輪完全靜止(靜止的取樣 ${still})`);
  noPenetration(e);
});

test("第 297 種:燈籠輪擒縱:搖臂 A 上的叉瓦 B、C 輪流擋住銷", () => {
  escapes(m297.escapement, m297.PITCH, 1);
  noPenetration(m297.escapement);
});

test("第 299 種:老式時鐘擒縱(立軸):立軸每擺一次,冠狀輪轉過半個齒", () => {
  assert.equal(m299.N % 2, 1, "齒數為奇數,前後兩側的齒錯開");
  escapes(m299.escapement, m299.PITCH, 1);
  noPenetration(m299.escapement);
});

test("第 291 種:天文台計時器擒縱:擺輪往箭頭方向擺時凸柱壓過細彈簧,A 不動;擺回來時抬起 A 與擋止 d,放走一齒", () => {
  const e = m291.escapement;
  const S = m291.SWING;
  const base = 2 * e.period; // 穩定之後的一個週期
  const fwd = sweep(base + 2 * S, 200, base).map((v) => m291.chronometer(v));
  assert.ok(fwd.every((c) => c.lift < 1e-9), "往箭頭方向擺:A 不動(該凸柱在通過時會將彈簧下壓)");
  assert.ok(fwd.some((c) => c.flex > 0.02), "往箭頭方向擺:細彈簧被壓下去");
  close(fwd[fwd.length - 1].wheel, fwd[0].wheel, "往箭頭方向擺:輪不動", 1e-6);
  const back = sweep(base + 4 * S, 200, base + 2 * S).map((v) => m291.chronometer(v));
  assert.ok(back.some((c) => c.lift > 0.01), "擺回來時 A 被抬起(會將彈簧、A 和擋止 d 一起抬起)");
  assert.ok(back.every((c) => c.flex < 1e-9), "擺回來時細彈簧頂著鉤 k,不彎");
  close(back[back.length - 1].wheel - back[0].wheel, -m291.PITCH, "擺輪來回一次,擒縱輪轉過一齒(順時針)", 1e-6);
  close(e.step, -m291.PITCH, "每週期一齒", 1e-6);
  noPenetration(e);
  apart(m291.escapement, "spring", "pin");
  apart(m291.escapement, "detent", "pin");
});

test("第 293 種:雙合式擒縱:叉瓦 B 每次往一個方向擺時接收一個衝擊,輪每次放走一齒", () => {
  const e = m293.escapement;
  const S = m293.SWING;
  close(e.step, -m293.PITCH, "擺輪來回一次,輪轉過一齒", 1e-9);
  noPenetration(e);
  const base = 2 * e.period;
  // 往衝擊的方向擺(先擺的那一程)放走一齒;擺回來只有齒尖落進凹槽一點又被推回
  close(m293.duplex(base + 2 * S).wheel - m293.duplex(base).wheel, -m293.PITCH, "往一個方向擺時放走一齒", 1e-6);
  close(m293.duplex(base + 4 * S).wheel, m293.duplex(base + 2 * S).wheel, "擺回來時不放行", 1e-6);
  const back = sweep(base + 4 * S, 200, base + 2 * S).map((v) => m293.duplex(v).wheel);
  assert.ok(Math.max(...back) - Math.min(...back) < m293.PITCH * 0.25, "擺回來時齒尖只落進凹槽一點");
  // 叉瓦 B 從冠狀齒接收衝擊:衝擊那一程有一段輪和 B 相碰
  const touches = sweep(base + 2 * S, 400, base).filter((v) => {
    const { teeth, stops, layers, stopLayers } = e.at(v);
    const rot = teeth.map((t) => t.map(([x, y]) => [x * Math.cos(-1e-3) - (y + 2.2) * Math.sin(-1e-3), x * Math.sin(-1e-3) + (y + 2.2) * Math.cos(-1e-3) - 2.2]));
    return rot.some((t, i) => layers[i] === "crown" && polygonsOverlap(t, stops[stopLayers.indexOf("crown")]));
  });
  assert.ok(touches.length > 10, `冠狀齒推叉瓦 B(相碰的取樣 ${touches.length})`);
});

test("第 294–295 種:圓筒式擒縱(同一機構的立體圖與放大圖):擺輪每擺一次,擒縱輪前進半個齒", () => {
  for (const v of [0, 1.3, 5]) assert.deepEqual(fig294.pose(v).parts, fig295.pose(v).parts, "兩圖的姿勢一致");
  assert.notDeepEqual(fig294.view.direction, fig295.view.direction, "初始視角不同");
  escapes(cyl.escapement, cyl.PITCH, -1);
  noPenetration(cyl.escapement);
  // 叉瓦交替地停靠於圓筒的內側與外側:擺輪在兩端時,停住的齒尖一次在圓筒裡、一次在圓筒外
  const S = cyl.SWING;
  const inside = (v) => {
    const { teeth } = cyl.escapement.at(v);
    const [cx, cy] = [0, 2.2];
    const tip = teeth.map((t) => t.reduce((m, p) => (Math.hypot(p[0] - cx, p[1] - cy) < Math.hypot(m[0] - cx, m[1] - cy) ? p : m))).find((p) => Math.hypot(p[0] - cx, p[1] - cy) < 0.3);
    return tip ? Math.hypot(tip[0] - cx, tip[1] - cy) < 0.2 : null;
  };
  const base = 2 * cyl.escapement.period;
  assert.notEqual(inside(base), inside(base + 2 * S), "一次停在圓筒外、一次停在圓筒內");
});

test("第 296 種:槓桿式擒縱:擺輪的銷在每次擺動的中途進入凹槽 E,撥動槓桿,叉瓦放走半個齒", () => {
  const e = m296.escapement;
  const S = m296.SWING;
  escapes(e, m296.PITCH, -1);
  noPenetration(e);
  // 銷不在凹槽裡時(擺輪在兩端附近),槓桿停在擋銷上不動
  const base = 2 * e.period;
  const ends = [...sweep(base + 0.4 * S, 40, base), ...sweep(base + 2.4 * S, 40, base + 1.6 * S)].map((v) => m296.lever(v).lever);
  assert.ok(ends.slice(0, 41).every((a) => Math.abs(Math.abs(a) - m296.BANK) < 2e-3), "擺輪在一端時槓桿靠在擋銷上");
  assert.ok(Math.sign(ends[0]) !== Math.sign(ends[ends.length - 1]), "擺過一次,槓桿換到另一邊的擋銷");
  // 銷在每次擺動的中途進入凹槽:槓桿只在擺輪居中附近轉動
  const moving = sweep(base + 2 * S, 400, base).filter((v, i, vs) => i > 0 && Math.abs(m296.lever(v).lever - m296.lever(vs[i - 1]).lever) > 1e-6);
  assert.ok(moving.every((v) => Math.abs(m296.lever(v).balance) < 0.5 * S), "槓桿只在擺輪居中附近被撥動");
  apart(m296.escapement, "fork", "pin");
});

test("第 298 種:老式錶用擒縱(立軸):擺輪每擺一次,冠狀輪轉過半個齒,經小齒輪帶動左下的輪", () => {
  escapes(m298.escapement, m298.PITCH, 1);
  noPenetration(m298.escapement);
  const r = m298.verge(4 * m298.SWING);
  close(r.contrate / r.crown, m298.PINION.teeth / m298.CONTRATE.teeth, "齒數比", 1e-12);
  // 立軸擒縱是回退式:叉瓦伸進齒間時把輪推回一點
  const ws = sweep(2 * m298.escapement.period, 400).map((v) => m298.verge(v).crown);
  assert.ok(ws.slice(1).some((w, i) => w < ws[i] - 1e-4), "有回退");
});

test("第 300–301 種:同一機構的前視與側視圖;叉瓦交替地由兩個擒縱輪之一的齒作用,每擺一次輪轉過半個齒", () => {
  for (const v of [0, 0.4, 2]) assert.deepEqual(fig300.pose(v).parts, fig301.pose(v).parts, "兩圖的姿勢一致");
  assert.notDeepEqual(fig300.view.direction, fig301.view.direction, "初始視角不同");
  escapes(twin.escapement, twin.PITCH, 1);
  noPenetration(twin.escapement);
});

test("第 302 種:擺輪式擒縱:擺輪 C 來回擺,叉瓦 A、B 輪流放走擒縱輪 D 的齒", () => {
  escapes(m302.escapement, m302.PITCH, 1);
  noPenetration(m302.escapement);
});

test("第 303 種:靜擊式擺鐘擒縱:叉瓦面與擺動軸同心,不會產生回退", () => {
  const e = m303.escapement;
  escapes(e, m303.PITCH, -1);
  noPenetration(e);
  const ws = sweep(2 * e.period, 480).map((v) => m303.deadbeat(v).wheel);
  assert.ok(ws.every((w, i) => i === 0 || w <= ws[i - 1] + 1e-5), "不回退");
  assert.ok(ws.slice(1).filter((w, i) => Math.abs(w - ws[i]) < 1e-5).length > 150, "齒抵住叉瓦時輪靜止");
});

test("第 304 種:銷輪式擒縱:兩個叉瓦夾著銷,擺每擺一次輪轉過半個銷距", () => {
  escapes(m304.escapement, m304.PITCH, -1);
  noPenetration(m304.escapement);
});

test("第 305 種:單銷式擒縱:擺每擺動一次,擒縱輪(帶一根偏心銷的小圓盤)旋轉半圈", () => {
  const e = m305.escapement;
  close(e.step, 2 * Math.PI, "擺一個來回,圓盤轉一圈", 1e-9);
  const half = m305.singlePin(2.5 * e.period + e.period / 2).disc - m305.singlePin(2.5 * e.period).disc;
  assert.ok(Math.abs(half - Math.PI) < 0.3, `擺一次約半圈(實際 ${(half / Math.PI).toFixed(2)} 圈的一半)`);
  noPenetration(e);
});

test("第 306 種:三腳式擺鐘擒縱:三腳輪的齒交替作用於上、下叉瓦,擺每擺一次轉六分之一圈", () => {
  escapes(m306.escapement, 2 * m306.STEP, 1);
  noPenetration(m306.escapement);
});

test("第 307 種:三腳式擒縱的變形(較長的止動齒 D、E):擺每擺一次轉六分之一圈", () => {
  escapes(m307.escapement, 2 * m307.STEP, 1);
  noPenetration(m307.escapement);
});

test("第 308 種:分離式擒縱:只在擺向左擺時由槓桿 Q 解鎖並接收衝量;擺向右返回時制動爪被推向一旁", () => {
  const T = m308.geometry.TRAVEL;
  const base = 2 * m308.escapement.period;
  const right = sweep(base + 2 * T, 100, base).map((v) => m308.detached(v)); // 由左往右(返回)
  assert.ok(right.every((d) => d.lever < 1e-9), "向右時不解鎖");
  close(right[right.length - 1].wheel, right[0].wheel, "向右時輪不動", 1e-6);
  assert.ok(right.some((d) => d.click < -0.1), "向右時制動爪被推向一旁");
  assert.ok(right[0].x < right[right.length - 1].x, "這一程擺往右走");
  const left = sweep(base + 4 * T, 100, base + 2 * T).map((v) => m308.detached(v));
  assert.ok(left.some((d) => d.lever > 0.05), "向左時槓桿 Q 被撥開");
  assert.ok(left.every((d) => Math.abs(d.click) < 1e-9), "向左時制動爪頂著擋銷不倒");
  close(left[left.length - 1].wheel - left[0].wheel, -m308.PITCH, "來回一次轉一齒", 1e-6);
  noPenetration(m308.escapement);
  apart(m308.escapement, "lever", "click");
});

test("第 309 種:馬奇重力擒縱:擺每次擺動把其中一個加重的叉瓦抬起,返回時叉瓦落下", () => {
  const S = m309.SWING;
  const base = 2 * m309.escapement.period;
  const atRight = m309.mudge(base + 2 * S); // 擺到右端
  assert.ok(atRight.right > 0.01 && atRight.left < 1e-9, "擺往右時抬起右邊的叉瓦");
  const atLeft = m309.mudge(base + 4 * S);
  assert.ok(atLeft.left > 0.01 && atLeft.right < 1e-9, "擺往左時抬起左邊的叉瓦");
  const mid = m309.mudge(base + 3 * S);
  assert.ok(mid.left < 1e-9 && mid.right < 1e-9, "擺在中間時兩叉瓦都落下");
  escapes(m309.escapement, m309.PITCH, -1);
  noPenetration(m309.escapement);
});

test("第 310 種:三腳式重力擒縱:叉瓦 A、B 交替被抬起,擒縱輪每擺一次轉六分之一圈", () => {
  const S = m310.SWING;
  const base = 2 * m310.escapement.period;
  assert.ok(m310.gravity(base + 2 * S).right > 0.02 && m310.gravity(base + 4 * S).left > 0.02, "兩叉瓦交替被抬起");
  // 叉瓦的抬升是由中央的銷完成的:擺在中間、沒碰到臂時,一支臂仍被銷托著抬起
  const mid = m310.gravity(base + 3 * S);
  assert.ok(mid.left > 0.02 || mid.right > 0.02, "擺在中間時,一支臂由銷托著");
  escapes(m310.escapement, 2 * m310.STEP, 1);
  noPenetration(m310.escapement);
});

test("第 311 種:雙三腳式重力擒縱:兩個叉瓦交替被抬起,鎖定輪每擺一次轉六分之一圈", () => {
  const S = m311.SWING;
  const base = 2 * m311.escapement.period;
  assert.ok(m311.doubleThree(base + 2 * S).right > 0.02 && m311.doubleThree(base + 4 * S).left > 0.02, "兩叉瓦交替被抬起");
  escapes(m311.escapement, 2 * m311.STEP, 1);
  noPenetration(m311.escapement);
});

test("第 312 種:布洛克桑重力擒縱:擺推開一個叉瓦、放開擋止,輪每擺一次轉半個齒距", () => {
  const S = m312.SWING;
  const base = 2 * m312.escapement.period;
  assert.ok(m312.bloxam(base + 2 * S).right > 0.02 && m312.bloxam(base + 4 * S).left > 0.02, "兩叉瓦交替被推開");
  const mid = m312.bloxam(base + 3 * S);
  assert.ok(mid.left > 0.002 || mid.right > 0.002, "擺在中間時,一支臂由小輪托著抬起");
  escapes(m312.escapement, m312.PITCH, -1);
  noPenetration(m312.escapement);
});

test("第 313 種:天文台計時器擒縱:擺輪朝箭頭方向轉時推開止動器、放走一齒;返回時不動止動器", () => {
  // 與第 291 種同一套機構(整組轉 −90°):擺輪先往返回的方向擺(只壓彎通過彈簧),再朝箭頭方向擺(推開止動器)
  const S = m313.SWING;
  const base = 2 * m313.escapement.period;
  const back = sweep(base + 2 * S, 100, base).map((v) => m313.chronometer(v));
  assert.ok(back.every((c) => c.lift < 1e-9), "返回時止動器不動");
  close(back[back.length - 1].wheel, back[0].wheel, "返回時輪不動", 1e-6);
  const go = sweep(base + 4 * S, 100, base + 2 * S).map((v) => m313.chronometer(v));
  assert.ok(go.some((c) => c.lift > 0.01), "朝箭頭方向時推開止動器");
  close(go[go.length - 1].wheel - go[0].wheel, -m313.PITCH, "來回一次轉一齒", 1e-6);
  assert.equal(m313.default.figure, 313);
  apart(m313.escapement, "spring", "pin");
});

test("第 314 種:槓桿式天文台計時器擒縱:叉瓦只鎖輪,衝量直接給擺輪上的叉瓦 C,來回一次轉一齒", () => {
  const S = m314.SWING;
  const e = m314.escapement;
  const base = 2 * e.period;
  const levers = sweep(base + 2 * S, 100, base).map((v) => m314.leverChrono(v).lever);
  assert.ok(Math.sign(levers[0]) !== Math.sign(levers[levers.length - 1]), "每擺一次槓桿換邊");
  const first = m314.leverChrono(base + 2 * S).wheel - m314.leverChrono(base).wheel;
  const second = m314.leverChrono(base + 4 * S).wheel - m314.leverChrono(base + 2 * S).wheel;
  close(first + second, -m314.PITCH, "來回一次轉一齒", 1e-6);
  // 輪齒推著滾子(叉瓦 C)的凹槽側壁走:滾子往回轉一點點就會壓進輪齒(只是靠在滾子外緣上的不算)
  const [bx, by] = e.balanceCenter;
  const pushesRoller = (v) => {
    const { teeth, stops } = e.at(v);
    const back = placePoly(stops[stops.length - 1].map(([x, y]) => [x - bx, y - by]), e.balanceCenter, -0.01);
    return teeth.some((t) => penetrationDepth(t, back) > 1e-4);
  };
  const pushes = (from) => sweep(from + 2 * S, 400, from).filter(pushesRoller);
  const ccw = pushes(base);
  assert.ok(ccw.length > 10, "擺輪逆時針擺:輪齒推著叉瓦 C 走(衝量)");
  const travel = m314.leverChrono(ccw.at(-1)).wheel - m314.leverChrono(ccw[0]).wheel;
  assert.ok(travel < -m314.PITCH / 4, `推著叉瓦 C 的那一段,輪轉過可觀的角度(實際 ${(travel / m314.PITCH).toFixed(2)} 齒)`);
  assert.equal(pushes(base + 2 * S).length, 0, "擺輪順時針擺:輪齒不推滾子(每來回只給一次衝量)");
  noPenetration(e, 2000);
  apart(m314.escapement, "fork", "pin");
});
