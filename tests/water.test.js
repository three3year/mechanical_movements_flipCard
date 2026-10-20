// 第十九章「水車與泵」:斷言對應原文;流體示意只驗它是主動量的函式、只在路徑上
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, inSolid } from "./helpers.js";
import { distanceToPath } from "../models/flow.js";
import { add, rot2, quatFromZ, quatRotate } from "../models/kit.js";
import { placeOutline, polygonsOverlap, penetrationDepth } from "../models/contact.js";
import fig430, { INFLOW, SPILL } from "../models/fig430.js";
import * as m431 from "../models/fig431.js";
import * as m432 from "../models/fig432.js";
import * as m433 from "../models/fig433.js";
import * as m437 from "../models/fig437.js";
import * as m438 from "../models/fig438.js";
import * as m441 from "../models/fig441.js";
import * as m434 from "../models/fig434.js";
import * as m435 from "../models/fig435.js";
import * as m436 from "../models/fig436.js";
import * as m442 from "../models/fig442.js";
import * as m443 from "../models/fig443.js";
import * as m439 from "../models/fig439.js";
import * as m440 from "../models/fig440.js";
import * as m444 from "../models/fig444.js";
import * as col from "../models/oscillating-column.js";
import fig445 from "../models/fig445.js";
import fig446 from "../models/fig446.js";
import * as m447 from "../models/fig447.js";
import * as m448 from "../models/fig448.js";
import * as m449 from "../models/fig449.js";
import fig450 from "../models/fig450.js";
import fig451 from "../models/fig451.js";
import * as force from "../models/force-pump.js";
import { stroke, valveOpening } from "../models/pump.js";
import * as m452 from "../models/fig452.js";
import * as m453 from "../models/fig453.js";
import * as m454 from "../models/fig454.js";
import * as m455 from "../models/fig455.js";
import * as m456 from "../models/fig456.js";
import * as m462 from "../models/fig462.js";
import * as m457 from "../models/fig457.js";
import * as m458 from "../models/fig458.js";
import * as m459 from "../models/fig459.js";
import * as m460 from "../models/fig460.js";
import * as m461 from "../models/fig461.js";
import * as m465 from "../models/fig465.js";
import * as m463 from "../models/fig463.js";
import * as m464 from "../models/fig464.js";
import * as m466 from "../models/fig466.js";
import * as m467 from "../models/fig467.js";
import * as m468 from "../models/fig468.js";
import * as m469 from "../models/fig469.js";

test("第 430 種:上射式水車,進程增加時水車依原圖箭頭順時針轉", () => {
  const a = fig430.pose(0.1).parts.wheel.angle;
  const b = fig430.pose(0.2).parts.wheel.angle;
  assert.ok(b < a);
  assert.equal(fig430.driver.type, "virtual");
  assert.equal(fig430.driver.mode, "progress");
  assert.equal(fig430.driver.label, "進程");
});

test("第 430 種:以水重驅動——下降側(右)的水斗存量大於上升側(左)", () => {
  for (const progress of sweep(1, 12)) {
    const pose = fig430.pose(progress).parts;
    let right = 0;
    let left = 0;
    for (const [id, p] of Object.entries(pose)) {
      if (!id.startsWith("water")) continue;
      if (p.position[0] > 0.2) right += p.level;
      if (p.position[0] < -0.2) left += p.level;
    }
    assert.ok(right > 2 && left === 0, `進程 ${progress}:右 ${right},左 ${left}`);
  }
});

test("第 430 種:流體示意的點隨進程移動,且只在水的路徑上", () => {
  const at = (progress) => fig430.pose(progress).flows;
  const a = at(0.31);
  const b = at(0.33);
  assert.notDeepEqual(a[0].points, b[0].points);
  for (const progress of sweep(2, 9)) {
    const [inflow, spill] = at(progress);
    for (const p of inflow.points) assert.ok(distanceToPath(INFLOW, p) < 1e-9);
    for (const p of spill.points) assert.ok(distanceToPath(SPILL, p) < 1e-9);
    assert.ok(inflow.points.length > 5 && spill.points.length > 3);
  }
});

const angle = (def, id, p) => def.pose(p).parts[id].angle;

test("第 431 種:下射式水車:水從閘門底下沿渠底衝過,推下方浸在水裡的浮板,輪逆時針轉", () => {
  const def = m431.default;
  assert.ok(angle(def, "wheel", 0.25) > angle(def, "wheel", 0), "進程增加,輪逆時針轉(原圖箭頭)");
  assert.ok(-m431.R.float < m431.TAIL_LEVEL && m431.TAIL_LEVEL < -m431.R.rim, "只有輪下方的浮板浸在水裡");
  // 水流沿渠底由左往右(與下方浮板的走向相同)
  const dots = def.pose(0.3).flows[0].points;
  assert.ok(dots.some((p) => p[0] > 0 && p[1] < m431.TAIL_LEVEL), "水流過輪子下方");
});

test("第 432 種:胸射式水車:水在與軸同高處流進浮板之間,被胸牆擋成水斗,隨輪往下到底才流出", () => {
  const def = m432.default;
  assert.ok(angle(def, "wheel", 0.25) < angle(def, "wheel", 0), "輪順時針轉(原圖箭頭)");
  close(Math.sin(m432.ENTRY), 0, "水在與軸同高處流進", 0.1);
  for (const p of sweep(1, 24)) {
    const parts = def.pose(p).parts;
    for (let i = 0; i < 16; i++) {
      const w = parts[`water${i}`];
      const a = Math.atan2(w.position[1] + 0.05, w.position[0]);
      if (w.level > 0.99) assert.ok(a < m432.ENTRY + 0.05 && a > m432.RELEASE - 0.05, "裝水的空隙都在胸牆那一段(右下)");
    }
  }
});

test("第 433 種:水平式上射水車:斜槽的水射到水平輪的葉片上,輪與直立軸一起轉", () => {
  const def = m433.default;
  const a = angle(def, "wheel", 0.2);
  close(a, 2 * Math.PI * 0.2, "進程一圈,輪轉一圈");
  const end = m433.JET[m433.JET.length - 1];
  const r = Math.hypot(end[0], end[2]);
  assert.ok(r > 0.42 && r < 1.6 && Math.abs(end[1] - m433.WHEEL_Y) < 0.3, "水射到輪的葉片上");
});

test("第 437 種:渦殼式水輪:蝸殼使水作用在輪周所有葉片上;蝸殼越轉越窄", () => {
  for (const t of sweep(2 * Math.PI, 12)) assert.ok(m437.volute(t) > m437.WHEEL, "蝸殼與葉片之間始終有水道(水繞整圈)");
  assert.ok(m437.volute(0) > m437.volute(Math.PI) && m437.volute(Math.PI) > m437.volute(2 * Math.PI), "水邊走邊送進葉片,水道越來越窄");
  assert.ok(angle(m437.default, "wheel", 0.2) < 0, "輪順時針轉(原圖箭頭)");
});

test("第 438 種:巴克氏水車:水從臂端噴出,軸的轉向與噴水方向相反", () => {
  const def = m438.default;
  for (const p of sweep(1, 8)) {
    const a = angle(def, "shaft", p);
    for (const { tip, dir } of m438.nozzles(a)) {
      // 噴口的轉動方向(繞 +y,角度 a 變小時):切線速度
      const da = -1e-4;
      const next = m438.nozzles(a + da).find((n) => Math.hypot(n.tip[0] - tip[0], n.tip[2] - tip[2]) < 0.01);
      const v = [next.tip[0] - tip[0], next.tip[2] - tip[2]];
      assert.ok(v[0] * dir[0] + v[1] * dir[2] < 0, "噴口往噴水的反方向走");
      close(Math.hypot(tip[0], tip[2]), Math.hypot(m438.ARM, 0.25), "噴口在臂端");
    }
  }
});

test("第 441 種:波斯水車:水桶在低處裝滿,滿著升到高處,碰到固定銷傾斜倒空,下降時空著", () => {
  const deg = Math.PI / 180;
  const low = m441.bucket(-90 * deg + 30 * deg);
  assert.equal(low.level, 1, "過了最低點就裝滿");
  assert.equal(low.tilt, 0, "上升時桶子垂直掛著");
  const tilts = sweep(m441.PIN + 40 * deg, 60, m441.PIN - 20 * deg).map((a) => m441.bucket(a).tilt);
  assert.ok(Math.max(...tilts) > 1, "經過頂端時被固定銷撥斜");
  const after = m441.bucket(m441.PIN + 130 * deg);
  assert.equal(after.level, 0, "倒過之後空著下降");
  assert.equal(after.tilt, 0, "離開銷後靠自重擺回、垂直掛著");
  // 擺回是加速的:剛離開銷時擺得慢,越擺越快
  const back = sweep(m441.PIN + 80 * deg, 11, m441.PIN + 25 * deg).map((a) => m441.bucket(a).tilt);
  const steps = back.slice(1).map((t, i) => back[i] - t).filter((d) => d > 1e-6);
  assert.ok(steps.length > 2 && steps[steps.length - 1] > steps[0], "越擺越快");
  assert.ok(angle(m441.default, "wheel", 0.2) > 0, "輪逆時針轉(原圖箭頭)");
  assert.ok(-m441.RIM < m441.RIVER, "輪的下半部浸在水流裡");
});

test("第 434 種:福內隆渦輪:固定導葉 A 在中央,旋轉輪 B 在外側,水從圓周排出", () => {
  assert.ok(m434.GUIDE.r1 < m434.WHEEL.r0, "導葉在輪的內側");
  const def = m434.default;
  assert.ok(def.pose(0.2).parts.wheel.angle < 0, "輪順時針轉(原圖箭頭)");
  assert.equal(def.pose(0.2).parts.guides, undefined, "導葉固定不動");
  const dots = def.pose(0.37).flows[0].points;
  assert.ok(dots.some((p) => Math.hypot(p[0], p[1]) > m434.WHEEL.r1), "水從圓周排出");
});

test("第 435 種:華倫渦輪:導葉 a 在外側,輪 b 在內側轉,水從中央排出", () => {
  assert.ok(m435.WHEEL.r0 < m435.GUIDE.r1, "輪在導葉的內側");
  const def = m435.default;
  assert.equal(def.pose(0.2).parts.guides, undefined, "導葉固定不動");
  const dots = def.pose(0.37).flows[0].points;
  assert.ok(dots.some((p) => Math.hypot(p[0], p[1]) < m435.WHEEL.r1 - 0.2), "水流到中央排出");
});

test("第 436 種:容瓦爾渦輪:導水槽固定在筒身裡,輪 c 的水斗比導水槽多、斜向排列", () => {
  assert.ok(m436.WHEEL.count > m436.GUIDE.count, "水斗比導水槽多");
  assert.ok(Math.sign(m436.WHEEL.tilt) !== Math.sign(m436.GUIDE.tilt), "水斗斜向與導水槽相反(水轉向後推輪)");
  assert.ok(m436.WHEEL.y < m436.GUIDE.y, "輪在導水槽下面");
  const def = m436.default;
  close(def.pose(0.25).parts.wheel.angle, Math.PI / 2, "進程四分之一圈,輪轉 90°");
});

test("第 442 種:戽水車:罐子依序在水裡裝滿,升到上方倒進水槽", () => {
  const deg = Math.PI / 180;
  assert.equal(m442.potLevel(-60 * deg), 1, "過了底部的罐子已裝滿");
  assert.equal(m442.potLevel(60 * deg), 1, "上升途中滿著");
  assert.equal(m442.potLevel(150 * deg), 0, "過了頂端已倒空");
  assert.equal(m442.potLevel(-150 * deg), 0, "下降時空著");
  assert.ok(-m442.RIM < m442.RIVER, "輪的下端浸在水裡");
});

test("第 443 種:阿基米德螺旋:水流轉動下端的輪,水沿螺旋通道連續往上送,從頂端排出", () => {
  const def = m443.default;
  const z0 = m443.pockets(-2 * Math.PI * 0.1);
  const z1 = m443.pockets(-2 * Math.PI * 0.2);
  // 每團水往上移:同一團水轉十分之一圈上移十分之一螺距
  close(z1[0] - z0[0], m443.PITCH * 0.1, "螺旋轉一圈,水上移一個螺距", 1e-9);
  assert.ok(z0.length >= 4, "通道裡一路都有水(連續輸送)");
  assert.ok(def.pose(0.3).flows[0].points.length > 0);
  assert.ok(m443.BASE[1] - 1.25 < m443.RIVER, "下端的輪浸在水裡");
});

test("第 439 種:水桶裝滿就下降,觸地時底部的閥門打開排空,再被配重拉上去", () => {
  let prevY = m439.cycle(0).y;
  for (const v of sweep(1, 200).slice(1)) {
    const c = m439.cycle(v);
    if (c.y < prevY - 1e-9) assert.equal(c.level, 1, "下降時水桶是滿的");
    if (c.y > prevY + 1e-9) assert.equal(c.level, 0, "上升時水桶是空的");
    // 閥門由接觸算:閥桿碰到墊塊之前閥瓣坐在閥座上,水桶再往下才被頂開
    if (m439.opening(c.y) > 1e-9) assert.ok(c.y < m439.BOTTOM + 0.12 + 1e-9, "閥門只在閥桿頂到墊塊時打開");
    close(c.y + m439.weightY(c.y), m439.TOP + m439.weightY(m439.TOP), "繩長不變");
    prevY = c.y;
  }
  close(m439.opening(m439.cycle(0.6).y), 0.12, "水桶撞到地面,閥門被頂開", 1e-9);
  close(m439.opening(m439.TOP), 0, "提起時閥瓣坐回閥座");
  // 落下是加速的,撞到墊塊才停
  const ys = [0.32, 0.37, 0.42, 0.47].map((v) => m439.cycle(v).y);
  const drops = ys.slice(1).map((y, i) => ys[i] - y);
  assert.ok(drops.every((d, i) => i === 0 || d > drops[i - 1]), "水桶越落越快");
});

test("第 440 種:分成兩半的水槽:一邊裝滿就翻過去倒出,另一邊轉到水流下方;可當水錶計數", () => {
  const a = m440.trough(0.2);
  assert.ok(a.tilt > 0 && a.right > 0 && a.left === 0, "左邊低時水落進抬高的右邊");
  const b = m440.trough(0.7);
  assert.ok(b.tilt < 0 && b.left > 0 && b.right === 0, "翻過去後水落進左邊");
  assert.equal(m440.trough(0.99).count, 2, "一個來回倒兩次");
  assert.equal(m440.trough(3.2).count, 6, "計數累加");
});

test("第 444 種:水錘泵:右閥開時水流越流越快;右閥一關,水的動量打開左閥把水擠進空氣室;兩閥交替", () => {
  for (const v of sweep(1, 100)) {
    const r = m444.ram(v);
    assert.ok(!(r.waste > 0.5 && r.delivery > 0.5), "兩個閥門不同時打開");
  }
  assert.ok(m444.ram(0.5).speed > m444.ram(0.1).speed, "右閥開著時水越流越快");
  assert.equal(m444.ram(0.7).waste, 0, "右閥關上");
  assert.equal(m444.ram(0.7).delivery, 1, "左閥打開");
  assert.ok(m444.ram(0.8).level > m444.ram(0.62).level, "水被擠進空氣室");
  // 噴嘴的水柱一直都有(空氣的彈性使它均勻)
  for (const v of sweep(1, 10)) assert.ok(m444.default.pose(v).flows[0].points.length > 0, "噴嘴一直出水");
});

test("第 445–446 種:振盪水柱:水往下流時圓板上堆成圓錐;圓錐擋住水流時細管的水柱上升,圓錐崩解後再往下流", () => {
  const falling = col.column(0.3);
  assert.ok(falling.falling && falling.cone > 0 && falling.rise === 0, "第 445 種:往下流,圓錐漸漸堆起");
  const blocked = col.column(0.72);
  assert.ok(!blocked.falling && blocked.cone === 1 && blocked.rise > 0.5, "第 446 種:圓錐擋住,水柱上升");
  assert.ok(blocked.overflow, "水柱升到頂溢出(抬到水頭之上)");
  assert.ok(col.column(0.95).cone < 0.1 && col.column(0.95).falling, "圓錐崩解,又往下流");
  close(col.column(1.3).cone, falling.cone, "週期性重複");
  assert.equal(fig445.driver.initial, 0.3, "第 445 種預設停在往下流的階段");
  assert.ok(col.column(fig446.driver.initial).cone === 1, "第 446 種預設停在圓錐擋住的階段");
});

test("第 447 種:渡船:錨繫住船,水流作用在舵上,帶著船以錨為圓心沿圓弧橫渡", () => {
  const ys = [];
  for (const v of sweep(1, 40)) {
    const f = m447.ferry(v);
    const B = m447.boatAt(f.psi);
    close(Math.hypot(B[0] - m447.ANCHOR[0], B[1] - m447.ANCHOR[1]), m447.ROPE, "船在以錨為圓心的圓弧上");
    assert.ok(B[0] > m447.ANCHOR[0], "船在錨的下游");
    ys.push(B[1]);
  }
  assert.ok(Math.max(...ys) > 1.5 && Math.min(...ys) < -1.5, "船從一岸渡到另一岸再回來");
});

const OPENED = (p) => Math.abs(p.angle) > 0.3;
const SETTLED = 0.2; // 瓣閥在一程的前 20% 開合(被水頂開、加速落回),之後才是穩定的開或關

test("瓣閥(第 450–454、465、466、473 種共用):被水頂開由快到慢;換向時要關的閥加速落回閥座、撞停,不瞬間闔上", () => {
  const fs = sweep(0.3, 30);
  const falling = fs.map((f) => valveOpening(false, { f, n: 1 }));
  const rising = fs.map((f) => valveOpening(true, { f, n: 1 }));
  close(falling[0], 1, "換向的那一刻還開著");
  close(rising[0], 0, "換向的那一刻還關著");
  for (let i = 1; i < fs.length; i++) {
    assert.ok(falling[i] <= falling[i - 1] + 1e-12, "要關的閥一路落下");
    assert.ok(rising[i] >= rising[i - 1] - 1e-12, "要開的閥一路張開");
    if (fs[i] <= SETTLED) assert.ok(falling[i - 1] - falling[i] >= (i > 1 ? falling[i - 2] - falling[i - 1] : 0) - 1e-12, "落下越來越快(加速)");
    if (fs[i] >= SETTLED) {
      close(falling[i], 0, "落到閥座就停住");
      close(rising[i], 1, "頂到開足");
    }
  }
  close(valveOpening(false, { f: 0.05, n: 0 }), 0, "第一程之前沒有上一程,要關的閥一開始就關著");
});

test("第 448 種:提升泵:上行時下閥開、活塞閥關,水從出水口溢出;下行時下閥關、活塞閥開", () => {
  const def = m448.default;
  for (const v of sweep(4 * Math.abs(m448.SWING[0] - m448.SWING[1]), 40)) {
    const p = m448.pump(v);
    const parts = def.pose(v).parts;
    if (p.phase.f < 0.25) continue; // 換向後的一小段:一個閥正被頂開、另一個正落回閥座
    assert.equal(OPENED(parts.footValve), p.up, "下方閥門在上行時打開");
    assert.equal(OPENED(parts.pistonValve), !p.up, "活塞閥門在下行時打開");
    if (p.up) assert.ok(def.pose(v).flows[0].points.some((q) => q[0] < -0.9), "上行時水從出水口溢出");
  }
  // 手柄往下壓,活塞上升
  assert.ok(m448.pump(0.01).piston < m448.pump(0.3).piston, "壓手柄提起活塞");
  // 換向時閥瓣不會瞬間翻開或闔上:落回閥座是加速的
  const span = Math.abs(m448.SWING[0] - m448.SWING[1]);
  const shut = [0.02, 0.06, 0.1, 0.14, 0.18].map((f) => def.pose(span * (1 + f)).parts.footValve.angle);
  const falls = shut.slice(1).map((a, i) => shut[i] - a);
  assert.ok(falls.every((d, i) => d > 0 && (i === 0 || d > falls[i - 1])), "下閥靠自重加速落回閥座");
});

test("第 449 種:現代提升泵:出水口的瓣閥向上開,上行時被水頂開", () => {
  const def = m449.default;
  for (const v of sweep(4, 40)) {
    if (v % 1 < 0.25) continue; // 換向後的一小段:閥瓣正在開、闔
    const parts = def.pose(v).parts;
    const up = OPENED(parts.footValve);
    assert.equal(OPENED(parts.outValve), up, "出水瓣閥與下閥同時(上行時)打開");
    assert.equal(OPENED(parts.pistonValve), !up, "活塞閥門在下行時打開");
  }
});

test("第 450 種:壓力泵:上升時吸水閥開、出水閥關;下降時吸水閥關,水經出水閥往上送", () => {
  for (const v of sweep(4 * 0.8, 40)) {
    const p = force.pump(v);
    if (p.phase.f < SETTLED) continue; // 換向後的開合過程
    const parts = fig450.pose(v).parts;
    assert.equal(OPENED(parts.suctionValve), p.up, "吸水閥在上升時打開");
    assert.equal(OPENED(parts.deliveryValve), !p.up, "出水閥在下降時打開");
  }
});

test("第 451 種:加空氣室的壓力泵:下行時空氣被壓縮(水位升),上行時膨脹把水推出,出水不斷", () => {
  let prev = null;
  for (const v of sweep(4 * 0.8, 80)) {
    const p = force.pump(v);
    const pose = fig451.pose(v);
    const level = pose.parts.chamberWater.level;
    if (prev) {
      if (p.up && prev.up) assert.ok(level <= prev.level + 1e-9, "上行時空氣室的水位下降(空氣膨脹)");
      if (!p.up && !prev.up) assert.ok(level >= prev.level - 1e-9, "下行時水位上升(空氣被壓縮)");
    }
    const out = pose.flows.flatMap((f) => f.points).filter((q) => q[1] > 2.0);
    assert.ok(out.length > 0, "兩個行程都有水從出口流出(持續穩定)");
    prev = { up: p.up, level };
  }
});

test("第 452 種:雙動式泵:往下時閥 1 進水、閥 3 排水;往上時閥 2 進水、閥 4 排水", () => {
  const def = m452.default;
  for (const v of sweep(4 * 1.1, 40)) {
    const p = m452.pump(v);
    if (p.phase.f < SETTLED) continue; // 換向後的開合過程
    const parts = def.pose(v).parts;
    const open = (k) => Math.abs(parts[`valve${k}`].angle + Math.PI / 2) > 0.3;
    assert.equal(open(1), p.down, "閥 1:往下時開");
    assert.equal(open(3), p.down, "閥 3:往下時開");
    assert.equal(open(2), !p.down, "閥 2:往上時開");
    assert.equal(open(4), !p.down, "閥 4:往上時開");
  }
  assert.ok(m452.pump(0.3).y < m452.pump(0).y && m452.pump(0.3).down, "一開始往下(原圖箭頭)");
});

test("第 453 種:雙風箱泵:一個風箱撐開吸水時,另一個被壓縮排水;閥門與壓力泵一樣", () => {
  const def = m453.default;
  const span = m453.SWING[1] - m453.SWING[0];
  for (const v of sweep(4 * span, 40).slice(1)) {
    if (v % span < 0.002 || stroke(v, ...m453.SWING).f < SETTLED) continue; // 行程端點、換向後的開合過程
    const a = def.pose(v - 0.001).parts;
    const b = def.pose(v).parts;
    const grow = [0, 1].map((k) => b[`top${k}`].position[1] - a[`top${k}`].position[1]);
    if (Math.abs(grow[0]) < 1e-6) continue;
    assert.ok(Math.sign(grow[0]) !== Math.sign(grow[1]), "兩個風箱一撐一壓");
    for (const k of [0, 1]) {
      const expanding = grow[k] > 0;
      assert.equal(Math.abs(b[`suction${k}`].angle - (k ? Math.PI : 0)) > 0.3, expanding, "撐開的風箱吸水閥打開"); // 右邊的吸水閥鉸在右側、閉著時指向 -x(π)
      assert.equal(Math.abs(b[`delivery${k}`].angle + Math.PI / 2) > 0.3, !expanding, "壓縮的風箱出水閥打開"); // 出水閥鉸在排水管腳下、垂著是 -90°
    }
  }
});

test("第 454 種:隔膜泵:隔膜拉起時吸水閥開,壓下時水經出水閥送出", () => {
  const def = m454.default;
  const span = m454.SWING[0] - m454.SWING[1];
  for (const v of sweep(4 * span, 40).slice(1)) {
    if (v % span < 0.002 || stroke(v, ...m454.SWING).f < SETTLED) continue; // 行程端點、換向後的開合過程
    const d0 = def.pose(v - 0.001).paths.membrane.points[10][1];
    const d1 = def.pose(v).paths.membrane.points[10][1];
    if (Math.abs(d1 - d0) < 1e-6) continue;
    const parts = def.pose(v).parts;
    assert.equal(Math.abs(parts.suctionValve.angle) > 0.3, d1 > d0, "隔膜拉起時吸水閥開");
    assert.equal(Math.abs(parts.deliveryValve.angle) > 0.3, d1 < d0, "隔膜壓下時出水閥開");
  }
});

// ── 第 450–454 種:剖面上的壁、開口與閥室 ─────────────────────
// 固定件在剖面上的實體:深度蓋到 z 的板件(含孔)與方塊(管子剖開後留在後面的背板不算)、旋轉體的壁
// (剖開的後半只算 sweep 蓋到的那一側);回傳世界座標的 { outline, holes } 清單。旋轉體的壁在左右各是一塊(以軸線鏡射的剖面多邊形)
function sectionSolids(def, ids, z = 0.1) {
  const out = [];
  const visit = (piece, [ox, oy, oz]) => {
    const [ax, ay, az = 0] = piece.at ?? piece.center ?? [0, 0, 0];
    const [x, y, zc] = [ox + ax, oy + ay, oz + az];
    const covers = (t) => zc - t / 2 <= z + 1e-9 && zc + t / 2 >= z - 1e-9;
    if (piece.kind === "plate" && covers(piece.thickness ?? 0.2)) {
      const move = (loop) => loop.map(([px, py]) => [px + x, py + y]);
      out.push({ outline: move(piece.shape.outline), holes: (piece.shape.holes ?? []).map(move) });
    } else if (piece.kind === "box" && covers(piece.size[2])) {
      const [w, h] = piece.size;
      out.push({ outline: [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], holes: [] });
    } else if (piece.kind === "lathe") {
      const cut = piece.cut ?? 0;
      const sweep = piece.sweep ?? Math.PI * 2;
      const covers = (a) => [a, a + Math.PI * 2, a - Math.PI * 2].some((b) => b >= cut - 1e-9 && b <= cut + sweep + 1e-9);
      for (const side of [1, -1]) {
        if (!covers(side > 0 ? 0 : Math.PI)) continue;
        out.push({ outline: piece.profile.map(([r, h]) => [x + side * r, y + h]), holes: [] });
      }
    }
    for (const c of piece.pieces ?? []) visit(c, [x, y, zc]);
  };
  for (const id of ids) {
    const p = part(def, id);
    assert.ok(p, `零件 ${id}`);
    if (p.kind === "group") for (const c of p.pieces ?? []) visit(c, [0, 0, 0]);
    else visit({ ...p, at: p.center ?? [0, 0, 0] }, [0, 0, 0]);
  }
  return out;
}
const inAny = (q, solids) => solids.some((s) => inSolid(q, s));
// 零件 id 在姿勢下的外形(板件,繞 position 轉 angle)
const placedFlap = (def, id, pose) => {
  const p = part(def, id);
  const { position, angle } = pose.parts[id];
  return placeOutline(p.shape.outline, position, angle ?? 0);
};
const overlapsAny = (poly, solids) => solids.some((s) => polygonsOverlap(poly, s.outline));
// 穿入超過貼合誤差(實體驗證的容許值 0.03:閥瓣繞鉸銷轉時,鉸端的角擦到閥座在這以內)
const digsInto = (poly, solids) => solids.some((s) => penetrationDepth(poly, s) > 0.03);
const SPAN = (sw) => Math.abs(sw[0] - sw[1]);

test("第 450 種:往下壓把手,活塞往下把水送出;吊環兩端銷接、長度不變,活塞桿的銷一直在泵筒軸線上", () => {
  const p0 = force.pump(0.01);
  const p1 = force.pump(0.3);
  assert.ok(p1.theta < p0.theta && p1.piston < p0.piston, "把手往下壓,活塞往下");
  assert.equal(p1.up, false, "往下壓是送水的那一程");
  for (const v of sweep(4 * SPAN(force.SWING), 60)) {
    const p = force.pump(v);
    close(Math.hypot(p.hang[0] - force.HANGER.ear[0], p.hang[1] - force.HANGER.ear[1]), force.HANGER.length, "吊環長不變", 1e-6);
    close(p.top[0], force.X, "活塞桿的銷在泵筒軸線上", 1e-9);
    assert.ok(p.hang[0] < force.X, "吊環(支點)在活塞桿左邊");
    const pose = fig450.pose(v);
    close(pose.parts.handle.position[0], p.hang[0], "手柄的左端掛在吊環上", 1e-9);
    assert.ok(pose.parts.hanger, "吊環是零件");
  }
});

test("第 451 種:支點在泵筒左上的彎柱頂、活塞桿接在支點右邊:往下壓把手,活塞往下;連桿長不變", () => {
  assert.ok(force.LEVER.pivot[0] < force.X, "支點在活塞桿左邊");
  const p0 = force.pump(0.01, { hanger: false });
  const p1 = force.pump(0.3, { hanger: false });
  assert.ok(p1.theta < p0.theta && p1.piston < p0.piston && !p1.up, "把手往下壓,活塞往下送水");
  for (const v of sweep(4 * SPAN(force.SWING), 60)) {
    const p = force.pump(v, { hanger: false });
    close(Math.hypot(p.E[0] - p.top[0], p.E[1] - p.top[1]), force.LEVER.link, "連桿長不變", 1e-6);
    close(p.top[0], force.X, "活塞桿頂在泵筒軸線上", 1e-9);
    assert.ok(p.E[0] > force.LEVER.pivot[0], "活塞桿的銷在支點右邊");
  }
});

test("第 450、451、454 種:出水閥鉸在閥室裡,閥瓣開到底也不穿過閥室或出水管的壁", () => {
  for (const [def, span] of [[fig450, SPAN(force.SWING)], [fig451, SPAN(force.SWING)], [m454.default, SPAN(m454.SWING)]]) {
    const solids = sectionSolids(def, ["works"]);
    let opened = false;
    for (const v of sweep(4 * span, 96)) {
      const pose = def.pose(v);
      const flap = placedFlap(def, "deliveryValve", pose);
      assert.ok(!overlapsAny(flap, solids), `第 ${def.figure} 種:主動量 ${v.toFixed(3)} 出水閥的閥瓣穿過壁`);
      if (Math.abs(pose.parts.deliveryValve.angle) > 0.7) opened = true;
    }
    assert.ok(opened, "出水閥真的張開過");
  }
});

test("第 450–454 種:管子接進開著口的壁,流體示意的點全程不穿過任何壁(水的路通)", () => {
  const cases = [
    [fig450, ["works", "barrel", "suction"], SPAN(force.SWING)],
    [fig451, ["works", "barrel", "suction"], SPAN(force.SWING)],
    [m452.default, ["works", "cylinder"], SPAN(m452.STROKE)],
    [m453.default, ["works", "post"], SPAN(m453.SWING)],
    [m454.default, ["works"], SPAN(m454.SWING)],
  ];
  for (const [def, ids, span] of cases) {
    const solids = sectionSolids(def, ids);
    for (const v of sweep(4 * span, 40)) {
      for (const flow of def.pose(v).flows) {
        for (const q of flow.points) assert.ok(!inAny([q[0], q[1]], solids), `第 ${def.figure} 種:主動量 ${v.toFixed(3)} 的點 (${q[0].toFixed(2)}, ${q[1].toFixed(2)}) 在壁裡`);
      }
    }
  }
});

test("第 451 種:空氣室有底、坐在出水閥的閥座上,出水管從空氣室裡接出", () => {
  const solids = sectionSolids(fig451, ["works"]);
  const floor = fig451.pose(0).parts.deliveryValve.position;
  assert.ok(inAny([floor[0] + 0.35, floor[1] - 0.05], solids), "閥座旁邊是空氣室的底");
  assert.ok(!inAny([force.VALVE_X, floor[1] + 0.3], solids), "閥座上方是空氣室的空間");
  assert.ok(!inAny([force.VALVE_X, floor[1] - 0.2], solids), "閥座下方通進水管");
});

test("第 452 種:四個閥在開口裡張開,閥瓣全程不穿過水道的壁、也碰不到泵筒;A、B 兩道水道的盡頭封住", () => {
  const def = m452.default;
  const solids = sectionSolids(def, ["works", "cylinder"]);
  for (const v of sweep(4 * SPAN(m452.STROKE), 96)) {
    const pose = def.pose(v);
    for (const k of [1, 2, 3, 4]) {
      const flap = placedFlap(def, `valve${k}`, pose);
      assert.ok(!digsInto(flap, solids), `主動量 ${v.toFixed(3)}:閥 ${k} 穿過壁`);
    }
  }
  assert.ok(inAny([m452.A_X, m452.CYL.y1 + 0.07], solids), "A 的頂端封住(和頂蓋齊)");
  assert.ok(inAny([m452.B_X, m452.CYL.y0 + 0.13], solids), "B 的底端封住");
});

test("第 453 種:吸水管經弧形吸水道、吸水閥進底座的外格再進風箱;排水從外格經出水閥進中央的排水管(閥門與壓力泵相同)", () => {
  const def = m453.default;
  const span = SPAN(m453.SWING);
  for (const v of sweep(4 * span, 24).slice(1)) {
    for (const flow of def.pose(v).flows) {
      const pts = flow.points;
      const lowest = Math.min(...pts.map((q) => q[1]));
      const highest = Math.max(...pts.map((q) => q[1]));
      if (lowest < -1.5) {
        // 吸水:從吸水管底經吸水道的弧(離開 x=0 的軸線、在底座下面)、從外格的底進去,到風箱裡
        assert.ok(pts.some((q) => q[1] < -0.7 && Math.abs(q[0]) > 0.6), "吸水道彎到外格底下");
        assert.ok(pts.some((q) => Math.abs(q[0]) > 0.6 && q[1] > -0.62 && q[1] < -0.3), "水進到外格");
        assert.ok(highest > 0, "水進到風箱");
      } else {
        // 排水:從風箱下到外格、經排水管腳旁的出水閥(y −0.62..−0.42、|x| < 0.2)進排水管、到頂上出口
        assert.ok(pts.some((q) => Math.abs(q[0]) < 0.2 && q[1] > -0.62 && q[1] < -0.42), "經出水閥進排水管腳");
        assert.ok(highest > 1.3, "從頂上的出口排出");
      }
    }
  }
  // 閥瓣:吸水閥躺在外格底的開口上(閥座上方沒有壁),出水閥鉸在排水管腳的壁下、往管腳裡開
  const solids = sectionSolids(def, ["works"]);
  const p = def.pose(0.001).parts;
  for (const k of [0, 1]) {
    const s = p[`suction${k}`].position;
    assert.ok(!inAny([s[0] + (k ? -0.13 : 0.13), s[1] - 0.06], solids), "吸水閥底下是開口");
    assert.ok(!inAny([s[0] + (k ? -0.13 : 0.13), s[1] + 0.5], solids), "吸水閥上方通風箱的格");
  }
});

test("第 453 種:風箱的褶每一段長度不變(拉長時折角變開、縮短時折得更深)", () => {
  const def = m453.default;
  const lengths = {};
  for (const v of sweep(2 * SPAN(m453.SWING), 24)) {
    const paths = def.pose(v).paths;
    for (const id of ["fold0L", "fold0R", "fold1L", "fold1R"]) {
      const pts = paths[id].points;
      const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], q[2] - pts[i][2]));
      lengths[id] ??= segs;
      segs.forEach((l, i) => close(l, lengths[id][i], `${id} 第 ${i} 段`, 1e-6));
    }
  }
  const a = def.pose(0).paths.fold0L.points;
  const b = def.pose(SPAN(m453.SWING)).paths.fold0L.points;
  assert.notEqual(Math.abs(a[1][0] - a[0][0]).toFixed(3), Math.abs(b[1][0] - b[0][0]).toFixed(3), "褶的振幅隨高度改變");
});

test("第 453 種:槓桿的支柱從上方垂下(頂端畫成斷口),不立在排水管上", () => {
  const def = m453.default;
  const post = part(def, "post");
  assert.ok(post, "支柱是獨立的固定件");
  const pipe = sectionSolids(def, ["works"]);
  const bottom = Math.min(...post.pieces.filter((p) => p.kind === "plate").flatMap((p) => p.shape.outline.map(([, y]) => y + (p.at?.[1] ?? 0))));
  assert.ok(bottom > 1.6, "支柱的底在排水管的頂上出口之上");
  assert.ok(!inAny([0, bottom - 0.05], pipe), "支柱底下是空的");
});

test("第 454 種:隔膜夾在夾環下、往下垂成碗形;隔膜與壓板全程在夾環的下面,不穿過水室的壁;隔膜每一段長度不變", () => {
  const def = m454.default;
  const solids = sectionSolids(def, ["works"]);
  const lengths = [];
  let lowest = 0;
  let highest = -9;
  for (const v of sweep(4 * SPAN(m454.SWING), 48)) {
    const pose = def.pose(v);
    const pts = pose.paths.membrane.points;
    for (const q of pts) {
      assert.ok(q[1] <= m454.CLAMP_Y + 1e-9, `主動量 ${v.toFixed(3)}:隔膜高過夾環`);
      assert.ok(!inAny([q[0], q[1]], solids), `主動量 ${v.toFixed(3)}:隔膜穿過壁 (${q[0].toFixed(2)}, ${q[1].toFixed(2)})`);
    }
    const plateTop = pose.parts.rod.position[1] - m454.ROD / 2 + 0.06;
    assert.ok(plateTop < m454.CLAMP_Y - 0.03, "壓板在夾環下面");
    const centre = pts[Math.floor(pts.length / 2)][1];
    lowest = Math.min(lowest, centre);
    highest = Math.max(highest, centre);
    const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
    if (!lengths.length) lengths.push(...segs);
    segs.forEach((l, i) => close(l, lengths[i], `隔膜第 ${i} 段`, 1e-6));
  }
  assert.ok(highest - lowest > 0.35, "隔膜起落的幅度");
  assert.ok(lowest < m454.CLAMP_Y - 0.5, "拉到最低時垂成碗形");
});

test("第 455 種:舊式旋轉泵:閥門貼著泵缸內面轉,到擋板處被闔上", () => {
  const deg = Math.PI / 180;
  // 轉鼓順時針轉(phi 遞減):鉸點進到擋板的長斜面底下,閥門被一路壓下;到擋板的平面段時已闔上
  let prev = 1;
  for (let a = m455.ABUT[1]; a > m455.ABUT[1] - m455.RAMP_IN; a -= deg) {
    const open = m455.opening(a);
    assert.ok(open <= prev + 0.01, "斜面把閥門一路壓下(由接觸算)");
    prev = open;
  }
  // 離開擋板後,閥門加速擺開:不會一下子張開
  const swing = sweep(-90 * deg, 60, -150 * deg).map((a) => m455.valveAngle(a) - a);
  for (let i = 1; i < swing.length; i++) assert.ok(Math.abs(swing[i] - swing[i - 1]) < 8 * deg, "每轉 1° 閥門擺動不到 8°(沒有瞬移)");
  for (const phi of sweep(2 * Math.PI, 72)) {
    const open = m455.opening(phi);
    const a = Math.atan2(Math.sin(phi), Math.cos(phi));
    if (a > m455.ABUT[0] && a < m455.ABUT[1] - m455.RAMP_IN) assert.ok(open < 0.8, "鉸點在擋板的平面段時閥門被壓下");
    // 由接觸算:閥門上沒有一點超出擋板的內面或泵缸的內壁
    const ang = m455.valveAngle(phi);
    for (const t of sweep(m455.VALVE, 8, 0.05)) {
      const q = [m455.DRUM * Math.cos(phi) + t * Math.cos(ang), m455.DRUM * Math.sin(phi) + t * Math.sin(ang)];
      assert.ok(Math.hypot(...q) <= m455.reachAt(Math.atan2(q[1], q[0])) + 0.01, "閥門不穿入擋板或泵缸");
    }
    if (open > 0.995) {
      const ang = m455.valveAngle(phi);
      const tip = [m455.DRUM * Math.cos(phi) + m455.VALVE * Math.cos(ang), m455.DRUM * Math.sin(phi) + m455.VALVE * Math.sin(ang)];
      close(Math.hypot(...tip), m455.BORE, "張開的閥門外緣貼著泵缸內面", 0.05);
    }
  }
  assert.ok(m455.opening(90 * deg) > 0.95, "其他地方閥門張開");
});

test("第 456 種:Cary 旋轉泵:活塞依心形凸輪進出;對準 E 時被推回座裡,另一個同時完全伸出", () => {
  for (const t of sweep(2 * Math.PI, 36)) {
    const parts = m456.default.pose(t).parts;
    for (const k of [0, 1]) {
      const p = parts[`piston${k}`];
      close(Math.hypot(p.position[0], p.position[1]), m456.reach(p.angle), "活塞外端貼著泵缸");
      // 由接觸算:內端圓頭的圓心離凸輪外形恰好一個圓頭半徑(貼著、不穿入)
      const c = [p.position[0] - (m456.PISTON - m456.NOSE) * Math.cos(p.angle), p.position[1] - (m456.PISTON - m456.NOSE) * Math.sin(p.angle)];
      const gap = Math.min(...m456.CAM.map(([x, y]) => Math.hypot(x - c[0], y - c[1])));
      close(gap, m456.NOSE, "活塞內端的圓頭貼著心形凸輪 a", 0.02);
    }
  }
  close(m456.reach(-Math.PI / 2), m456.DRUM, "在 E(底部)活塞完全縮回鼓裡");
  close(m456.reach(Math.PI / 2), m456.DRUM + 2 * m456.ECC, "同時對面的活塞完全伸出");
});

test("第 462 種:鏈式泵:上輪轉動,碟片沿不漏水的泵缸往上走,把碟片之間的水抬上去", () => {
  const def = m462.default;
  const a = def.pose(0).parts;
  const b = def.pose(-0.3).parts; // 上輪順時針轉
  const inTube = (p) => Math.abs(p.position[0] - m462.TUBE.x) < 1e-6 && p.position[1] > m462.TUBE.y0 && p.position[1] < m462.TUBE.y1;
  let checked = 0;
  for (const id of Object.keys(a).filter((k) => k.startsWith("disc"))) {
    if (inTube(a[id]) && inTube(b[id])) {
      assert.ok(b[id].position[1] > a[id].position[1], "筒裡的碟片往上走");
      checked++;
    }
  }
  assert.ok(checked > 3, "筒裡有好幾片碟片");
  assert.ok(m462.TUBE.y0 < m462.WATER, "泵缸下端浸在水裡");
  const s = 1.234;
  const p = m462.chainAt(s).p;
  const q = m462.chainAt(s + m462.LOOP).p;
  close(Math.hypot(p[0] - q[0], p[1] - q[1]), 0, "鏈條是無端的(繞一圈回到原處)");
});

test("第 457 種:桔槔:配重約為所抬重量的一半,空桶要往下拉,滿桶時配重幫忙抬起", () => {
  assert.ok(m457.pull(false) > 0, "空桶:要往下拉");
  assert.ok(m457.pull(true) < 0, "滿桶:配重幫忙,只需往上提一部分");
  close(m457.LOADS.counter, (m457.LOADS.water + m457.LOADS.bucket) / 2, "配重約等於所抬重量的一半", 0.05);
  const low = m457.sweep(Math.abs(m457.SWING[0] - m457.SWING[1]) * 0.999);
  assert.ok(low.bucket[1] < -1.5, "放到最低時水桶進到井裡");
  assert.ok(m457.sweep(0.1).down && !m457.sweep(0.1).full, "往下放的是空桶");
});

test("第 458 種:滑輪與兩個水桶:把空桶往下拉,另一邊的滿桶就上來", () => {
  for (const v of sweep(4 * (m458.TOP - m458.BOTTOM), 40)) {
    const b = m458.buckets(v);
    close(b.left + b.right, m458.TOP + m458.BOTTOM, "繩長不變:一個下去另一個上來");
  }
  const b = m458.buckets(0.5);
  assert.ok(b.rightFull && !b.leftFull, "往下拉的左桶是空的,上來的右桶是滿的");
});

test("第 459 種:往復式升降機:風車一直朝同一方向轉,水桶一上一下,到頂撞撥爪後換方向", () => {
  let prev = m459.lift(0);
  let flips = 0;
  for (const w of sweep(400, 2000).slice(1)) {
    const l = m459.lift(w);
    close(l.left + l.right, m459.TOP + m459.BOTTOM, "一個水桶上升,另一個下降");
    assert.ok(l.left <= m459.TOP + 1e-9 && l.left >= m459.BOTTOM - 1e-9, "水桶在井口與井底之間");
    if (l.engaged !== prev.engaged) {
      flips++;
      assert.ok(Math.min(Math.abs(l.left - m459.TOP), Math.abs(l.right - m459.TOP)) < 0.1, "蝸桿在水桶到頂(撞撥爪)時換邊");
    }
    prev = l;
  }
  assert.ok(flips >= 2, "風車持續轉,水桶來回好幾趟");
  const def = m459.default;
  for (const v of sweep(40, 400)) {
    const w = 2 * Math.PI * v;
    const l = m459.lift(w);
    // 撥爪(搖臂)倒向哪邊,蝸桿軸的下端就往哪邊偏、咬上那一邊的輪:倒向左(逆時針)時咬左輪、左桶上升
    if (Math.abs(l.beta) > m459.TILT / 2) assert.equal(Math.sign(m459.worm(l.beta).shift), -Math.sign(l.beta), "搖臂把蝸桿推向一個輪");
    if (!l.atTop) assert.equal(l.engaged === 0, l.leftUp, "咬左輪時左桶上升,咬右輪時右桶上升");
    // 一條繩繞過兩個滑輪的頂上:兩個滑輪一起轉
    const parts = def.pose(v).parts;
    close(parts.wheelL.angle, parts.wheelR.angle, "兩個滑輪同轉");
    // 由接觸算:撥爪被水桶頂起的時候,撞銷的底恰好擱在上升水桶的提把上(原文:水桶上升時會撞擊到它)
    if (!l.atTop && Math.abs(l.beta) < m459.TILT - 1e-6) {
      const s = l.leftUp ? -1 : 1;
      const pinBottom = m459.PIVOT[1] + s * m459.ARM * Math.sin(l.beta) + m459.PIN_Y - m459.PIN_R;
      const handle = (l.leftUp ? l.left : l.right) + m459.HANDLE;
      close(pinBottom, handle, "撞銷擱在提把上", 0.01);
    }
  }
  // 單頭蝸桿配 12 齒的蝸輪:風車轉一圈,咬著的蝸輪轉 1/12 圈(繩走 1/12 圈的滑輪周長)
  close(m459.lift(2 * Math.PI).left - m459.lift(0).left, (2 * Math.PI * m459.RATIO) * m459.DRUM_R, "風車一圈,水桶升一段", 1e-9);
});

test("第 460 種:舀水斗:槓桿經連桿把舀斗抬起,水流到鉸點倒上岸;凹槽越遠抬得越多", () => {
  const range = (notch) => {
    const lo = m460.scoop(m460.SWING[0], notch).beta;
    const hi = m460.scoop(m460.SWING[1], notch).beta;
    return hi - lo;
  };
  assert.ok(range("far") > range("middle") && range("middle") > range("near"), "連桿放在越遠的凹槽,抬起越多");
  const lowEnd = (n) => m460.PIVOT[1] + m460.SCOOP * Math.sin(m460.scoop(m460.SWING[0], n).beta);
  const highEnd = (n) => m460.PIVOT[1] + m460.SCOOP * Math.sin(m460.scoop(m460.SWING[1], n).beta);
  for (const n of ["near", "middle", "far"]) {
    assert.ok(lowEnd(n) < m460.WATER, "放下時斗浸在水裡");
    assert.ok(highEnd(n) > m460.WATER, "抬起時斗離開水面");
  }
});

test("第 461 種:擺動式水槽:擺往兩邊擺時,交替的兩組管子輪流把水送上一層", () => {
  const left = m461.active(m461.SWING[0]);
  const right = m461.active(m461.SWING[1]);
  for (let k = 0; k < left.length; k++) assert.ok(left[k] !== right[k], `第 ${k + 1} 段管子只在一邊送水`);
  assert.ok(left.some(Boolean) && right.some(Boolean), "兩邊各有管子送水");
  assert.ok(m461.active(0).every((on) => !on), "擺在中間時管子都往上斜,水不流");
  assert.ok(Math.abs(m461.SWING[0]) > m461.SLOPE, "擺幅大於管子的斜度");
});

test("第 465 種:平衡泵:樑兩端交替往下,兩個泵的活塞一上一下輪流出水", () => {
  for (const a of sweep(m465.SWING[1], 10, m465.SWING[0])) {
    const [l, r] = m465.pistons(a);
    close(l + r, 2 * (m465.PIVOT[1] - m465.ROD), "兩個活塞一上一下(桿隨樑的孔微傾,差 1e-4 以內)", 1e-3);
  }
  const def = m465.default;
  assert.equal(def.pose(0.1).readouts[0].value, "右邊的泵", "樑往一邊轉時右邊的泵出水");
  const span = m465.SWING[1] - m465.SWING[0];
  assert.equal(def.pose(span + 0.1).readouts[0].value, "左邊的泵", "轉回來時換左邊");
});

// ── 第 465–467 種:泵的去處、支點與連桿、閥與管子 ─────────────────────
// 零件的本體與每個附件(含附件的附件)的外接範圍,都換到零件的局部座標;附件的 at、axis / rotation 都算進去
function pieceBoxes(p) {
  const boxes = [];
  const corners = ({ min, max }) => [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i & 1 ? max[0] : min[0], i & 2 ? max[1] : min[1], i & 4 ? max[2] : min[2]]);
  const bound = (pts) => ({ min: [0, 1, 2].map((i) => Math.min(...pts.map((q) => q[i]))), max: [0, 1, 2].map((i) => Math.max(...pts.map((q) => q[i]))) });
  // 零件 / 附件在自己的局部座標(局部 z 是軸)裡的外接範圍
  const own = (piece) => {
    switch (piece.kind) {
      case "box":
        return { min: piece.size.map((s) => -s / 2), max: piece.size.map((s) => s / 2) };
      case "plate": {
        const pts = piece.shape.outline;
        const t = (piece.thickness ?? 0.2) / 2;
        return { min: [Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1])), -t], max: [Math.max(...pts.map((q) => q[0])), Math.max(...pts.map((q) => q[1])), t] };
      }
      case "cylinder":
        return { min: [-piece.radius, -piece.radius, -piece.length / 2], max: [piece.radius, piece.radius, piece.length / 2] };
      case "lathe": {
        const r = Math.max(...piece.profile.map((q) => q[0]));
        const hs = piece.profile.map((q) => q[1]);
        return { min: [-r, -r, Math.min(...hs)], max: [r, r, Math.max(...hs)] };
      }
      case "sphere":
        return { min: [-piece.radius, -piece.radius, -piece.radius], max: [piece.radius, piece.radius, piece.radius] };
      case "tube": {
        const r = piece.radius ?? 0.05;
        const b = bound(piece.points);
        return { min: b.min.map((x) => x - r), max: b.max.map((x) => x + r) };
      }
      default:
        return null;
    }
  };
  // 附件的局部座標 → 上一層的座標(先轉 axis / rotation,再平移 at)
  const lift = (piece, box) => {
    const q = piece.rotation ?? quatFromZ(piece.axis ?? [0, 0, 1]);
    const at = piece.at ?? [0, 0, 0];
    return bound(corners(box).map((c) => add(quatRotate(q, c), at)));
  };
  const visit = (piece, toParent, label) => {
    const b = own(piece);
    if (b) boxes.push({ label, ...toParent(b) });
    (piece.pieces ?? []).forEach((c, i) => visit(c, (box) => toParent(lift(c, box)), `${label}.pieces[${i}]`));
  };
  const body = own(p);
  if (body) boxes.push({ label: "本體", ...body });
  (p.pieces ?? []).forEach((c, i) => visit(c, (box) => lift(c, box), `pieces[${i}]`));
  return boxes;
}
// 零件是一件:本體與所有附件的外接範圍互相接觸(間隙 1e-6 以內),連成一個群
function assertOnePiece(def, id) {
  const boxes = pieceBoxes(part(def, id));
  const touch = (a, b) => [0, 1, 2].every((i) => a.min[i] <= b.max[i] + 1e-6 && b.min[i] <= a.max[i] + 1e-6);
  const seen = new Set([0]);
  const queue = [0];
  while (queue.length) {
    const i = queue.pop();
    boxes.forEach((b, j) => {
      if (!seen.has(j) && touch(boxes[i], b)) (seen.add(j), queue.push(j));
    });
  }
  const loose = boxes.filter((_, j) => !seen.has(j)).map((b) => b.label);
  assert.deepEqual(loose, [], `第 ${def.figure} 種 ${id} 不相連的塊`);
}

test("第 465 種:照原圖泵立在兩岸之間的坑底水裡,岸高於水面;閥瓣在水裡張開,全程碰不到岸與坑底", () => {
  const def = m465.default;
  assert.ok(m465.BARREL.y0 >= m465.PIT_FLOOR - 1e-9 && m465.BARREL.y0 - m465.PIT_FLOOR < 0.02, "泵筒底坐在坑底");
  assert.ok(m465.WATER_TOP > m465.BARREL.y0 + 0.4, "泵筒的下段浸在水裡");
  assert.ok(m465.BANK_TOP > m465.WATER_TOP, "兩岸高於水面");
  const solids = sectionSolids(def, ["frame"]);
  const span = m465.SWING[1] - m465.SWING[0];
  let opened = false;
  for (const v of sweep(4 * span, 48)) {
    const pose = def.pose(v);
    for (const k of [0, 1]) {
      assert.ok(!overlapsAny(placedFlap(def, `valve${k}`, pose), solids), `主動量 ${v.toFixed(3)}:閥 ${k} 的閥瓣碰到岸或坑底`);
      if (pose.parts[`valve${k}`].angle > 0.7) opened = true;
    }
  }
  assert.ok(opened, "閥瓣真的張開過");
});

test("第 465 種:兩個泵的出水管合成 Y 形總管往外送;流體示意離開泵筒後沿管子走,送到平台旁的出口,不灑回原處", () => {
  const def = m465.default;
  const span = m465.SWING[1] - m465.SWING[0];
  for (const [k, v] of [[1, 0.1], [0, span + 0.1], [1, 2 * span + 0.25]]) {
    const flows = def.pose(v).flows;
    assert.equal(flows.length, 1, "一次只有一個泵出水");
    const path = [...m465.DELIVERY[k], ...m465.MAIN.slice(1)];
    const out = flows[0].points.filter((p) => p[1] > m465.BARREL.y1 + 0.02 && p[0] > m465.MAIN.at(-1)[0] - 1e-6);
    assert.ok(out.length > 3, "有水離開泵筒");
    for (const p of out) assert.ok(distanceToPath(path, p) < 0.06, `點 (${p.map((x) => x.toFixed(2))}) 不在出水管上`);
    assert.ok(flows[0].points.some((p) => p[0] < m465.MAIN.at(-1)[0] + 0.3 && p[1] > m465.BANK_TOP), "水送到總管的出口");
    assert.ok(!flows[0].points.some((p) => p[1] < m465.BARREL.y1 && Math.abs(p[0] - (k ? m465.ATTACH : -m465.ATTACH)) > m465.BARREL.r), "沒有水灑回泵筒外");
  }
});

test("第 465 種:活塞桿頂以銷鉸在搖樑的孔上(叉頭夾著樑),桿長不變;樑架在中柱頂的叉頭上;扶手框的立柱接到樑", () => {
  const def = m465.default;
  const span = m465.SWING[1] - m465.SWING[0];
  const rod = part(def, "rod0");
  const pin = rod.pieces.find((p) => p.kind === "cylinder" && p.axis);
  assert.ok(pin, "活塞桿頂有銷");
  for (const v of sweep(4 * span, 40)) {
    const pose = def.pose(v);
    const a = pose.parts.beam.angle;
    const rods = m465.rods(a);
    for (const k of [0, 1]) {
      const hole = add(m465.PIVOT, [...rot2([(k ? 1 : -1) * m465.ATTACH, 0], a), 0]);
      const { Q, C } = rods[k];
      close(Math.hypot(Q[0] - hole[0], Q[1] - hole[1]), 0, "桿頂的銷在樑的孔上", 1e-9);
      close(Math.hypot(Q[0] - C[0], Q[1] - C[1]), m465.ROD, "桿長不變", 1e-9);
      close(C[0], (k ? 1 : -1) * m465.ATTACH, "活塞在泵筒的軸線上", 1e-9);
      const posed = pose.parts[`rod${k}`];
      const world = add(posed.position, quatRotate(posed.rotation, pin.at));
      close(Math.hypot(world[0] - hole[0], world[1] - hole[1]), 0, "姿勢裡銷的位置就是樑的孔", 1e-6);
    }
  }
  const beam = part(def, "beam");
  assert.equal(beam.shape.holes.length, 3, "樑上有支點孔與兩個桿銷孔");
  const legs = beam.pieces.filter((p) => p.kind === "plate" && Math.max(...p.shape.outline.map((q) => q[0])) - Math.min(...p.shape.outline.map((q) => q[0])) < 0.2);
  assert.ok(legs.length >= 2 && legs.every((p) => Math.min(...p.shape.outline.map((q) => q[1])) <= 0.06 + 1e-9), "扶手框的立柱往下接到樑");
  assertOnePiece(def, "beam");
  assertOnePiece(def, "frame");
  const frame = part(def, "frame");
  const cheeks = frame.pieces.filter((p) => p.kind === "box" && Math.abs(p.at[0]) < 1e-9 && Math.abs(p.at[2]) > 0.06 && p.at[1] > 1.4);
  assert.equal(cheeks.length, 2, "中柱頂是夾著樑的叉頭");
});

test("第 463 種:自動堰:平常水位時直立關閉;水位升高時上閘葉朝下游翻、下閘葉被推往上游,河床處打開", () => {
  const normal = m463.gates(m463.NORMAL);
  close(normal.upper, 0, "平常水位:上閘葉直立");
  close(normal.lower, 0, "平常水位:下閘葉直立");
  assert.ok(!normal.open);
  const flood = m463.gates(m463.NORMAL + 0.6);
  assert.ok(flood.upper < 0, "上閘葉順時針(朝下游)翻");
  assert.ok(flood.lower > 0, "下閘葉逆時針(朝上游)被推回");
  assert.ok(flood.open, "河床處打開");
  const pts = m463.default.pose(m463.NORMAL + 0.6).flows.flatMap((f) => f.points);
  assert.ok(pts.some((p) => p[1] < 0.4 && Math.abs(p[0]) < 0.3), "水從河床的通道流過(沖走沉積物)");
  // 由接觸算:下閘葉被水壓推抵在上閘葉上——不穿入上閘葉,再往下游擺 1° 就碰到;上閘葉翻得越多,下閘葉被推回越多
  const outline = (g) => [[-0.07, -g.below], [0.07, -g.below], [0.07, g.above], [-0.07, g.above]];
  let prev = -1;
  for (const h of sweep(3.0, 12, m463.NORMAL)) {
    const g = m463.gates(h);
    const upper = placeOutline(outline(m463.UPPER), m463.UPPER.pivot, g.upper);
    assert.ok(!polygonsOverlap(placeOutline(outline(m463.LOWER), m463.LOWER.pivot, g.lower), upper), "下閘葉不穿入上閘葉");
    assert.ok(polygonsOverlap(placeOutline(outline(m463.LOWER), m463.LOWER.pivot, g.lower - Math.PI / 180), upper), "下閘葉貼著上閘葉");
    assert.ok(g.lower >= prev - (2 * Math.PI) / 180, "上閘葉翻得越多,下閘葉被推回越多(推到底時接觸點移到上閘葉的下角,略回 1°)");
    prev = g.lower;
  }
});

test("第 464 種:希羅噴泉:水從上方降到下方容器,壓縮的空氣把中間容器的水從中央管噴出", () => {
  const a = m464.fountain(0.1);
  const b = m464.fountain(0.6);
  assert.ok(b.low > a.low, "下方容器的水越來越多");
  assert.ok(b.mid < a.mid, "中間容器的水被推出去");
  assert.ok(a.jet > 0 && b.jet > 0, "中央管一直噴水");
  assert.ok(b.jet < a.jet, "水位差變小,水柱稍降");
});

test("第 466 種:液壓機:力的倍數等於兩柱塞的直徑平方比;1 吋與 30 吋是 900 倍", () => {
  close((30 / 1) ** 2, 900, "原文的例子");
  const def = m466.default;
  assert.match(def.pose(0).readouts[0].value, new RegExp(String(Math.round((m466.RAM_D / m466.PLUNGER_D) ** 2))));
  // 泵每壓一次,柱塞升起一點;只有壓下的行程送水(第一程就是往下壓)
  const span = Math.abs(m466.SWING[1] - m466.SWING[0]);
  const rises = [0, 2, 4, 6].map((k) => m466.press(k * span + 0.01).rise);
  for (let i = 1; i < rises.length; i++) assert.ok(rises[i] > rises[i - 1], "每壓一下,柱塞升高");
  assert.ok(m466.press(span * 0.5).rise > 0, "壓下泵柱塞時水進柱塞缸,柱塞升起");
  close(m466.press(span * 1.5).rise, m466.press(span).rise, "提起泵柱塞(吸水)時柱塞不動", 1e-9);
});

test("第 466 種:照原圖手柄的支點在泵柱塞左邊(掛在泵座上的吊桿),把手往右;往下壓把手就壓下柱塞送水;吊桿長不變、柱塞銷在泵筒軸線上", () => {
  const def = m466.default;
  const span = Math.abs(m466.SWING[1] - m466.SWING[0]);
  const p0 = m466.press(0.01);
  const p1 = m466.press(0.3);
  assert.ok(p1.theta < p0.theta && p1.plunger < p0.plunger && p1.down, "把手往下壓,泵柱塞往下送水");
  for (const v of sweep(4 * span, 60)) {
    const p = m466.press(v);
    close(Math.hypot(p.hang[0] - m466.HANGER.ear[0], p.hang[1] - m466.HANGER.ear[1]), m466.HANGER.length, "吊桿長不變", 1e-6);
    close(p.top[0], m466.PUMP_X, "柱塞銷在泵筒軸線上", 1e-9);
    assert.ok(p.hang[0] < m466.PUMP_X, "支點(吊桿的上銷)在柱塞左邊");
    const pose = def.pose(v);
    close(pose.parts.handle.position[0], p.hang[0], "手柄的左端掛在吊桿上", 1e-9);
    close(pose.parts.handle.position[1], p.hang[1], "手柄的左端掛在吊桿上", 1e-9);
    const hole = add([p.hang[0], p.hang[1], 0], [...rot2([m466.HANGER.short, 0], pose.parts.handle.angle), 0]);
    close(hole[0], p.top[0], "手柄上的銷孔對著柱塞頂的銷", 1e-9);
    close(hole[1], p.top[1], "手柄上的銷孔對著柱塞頂的銷", 1e-9);
    assert.ok(pose.parts.hanger, "吊桿是零件");
  }
  const handle = part(def, "handle");
  const grip = handle.pieces.find((p) => p.kind === "sphere");
  assert.ok(grip.at[0] > m466.HANGER.short, "把手往右伸過柱塞");
});

test("第 466 種:小管接進開著口的泵筒與柱塞缸,出水閥在閥室裡;流體示意全程不穿過壁、閥瓣開到底不穿過壁;機架一件、立柱立在缸座的凸緣上", () => {
  const def = m466.default;
  const span = Math.abs(m466.SWING[1] - m466.SWING[0]);
  const solids = sectionSolids(def, ["frame", "ramCylinder", "pump"]);
  let opened = { suction: false, delivery: false };
  for (const v of sweep(4 * span, 48)) {
    const pose = def.pose(v);
    for (const flow of pose.flows) for (const q of flow.points) assert.ok(!inAny([q[0], q[1]], solids), `主動量 ${v.toFixed(3)} 的點 (${q[0].toFixed(2)}, ${q[1].toFixed(2)}) 在壁裡`);
    for (const id of ["suction", "delivery"]) {
      assert.ok(!digsInto(placedFlap(def, id, pose), solids), `主動量 ${v.toFixed(3)}:${id} 的閥瓣穿過壁`);
      if (Math.abs(pose.parts[id].angle - (id === "suction" ? 0 : Math.PI / 2)) > 0.7) opened[id] = true;
    }
  }
  assert.ok(opened.suction && opened.delivery, "兩個閥都真的張開過");
  assertOnePiece(def, "frame");
  assertOnePiece(def, "pump");
  const frame = part(def, "frame");
  const columns = frame.pieces.filter((p) => p.kind === "box" && p.size[1] > 3);
  const flange = frame.pieces.find((p) => p.kind === "box" && p.size[0] > 2 && p.size[0] < 4 && p.at[1] < -1);
  assert.ok(columns.length >= 2 && flange, "有立柱與缸座的凸緣");
  for (const c of columns) {
    close(c.at[1] - c.size[1] / 2, flange.at[1] + flange.size[1] / 2, "立柱立在凸緣上", 1e-9);
    assert.ok(Math.abs(c.at[0] - flange.at[0]) < flange.size[0] / 2, "立柱在凸緣的範圍內");
  }
  assert.ok(!frame.pieces.some((p) => p.kind === "box" && p.at[0] > 1 && p.at[1] > 0.5), "沒有浮在空中的手柄支柱");
});

test("第 467 種:液壓千斤頂:壓手柄把液壓缸沿固定的柱塞抬起;開閥時水流回、慢慢放下", () => {
  const span = Math.abs(m467.SWING[1] - m467.SWING[0]);
  const lifts = [0, 2, 4].map((k) => m467.jack(k * span + span * 0.9, "lift").rise);
  assert.ok(lifts[2] > lifts[1] && lifts[1] > lifts[0], "壓越多下,升得越高");
  const r = [0, 1, 3].map((v) => m467.jack(v, "release").rise);
  assert.ok(r[0] > r[1] && r[1] > r[2], "開閥後慢慢降下");
});

test("第 467 種:托座在液壓缸頂上(局部 z 軸向)、爪鉤在側面,和缸連成一件;底座、柱塞、螺絲各是一件", () => {
  const def = m467.default;
  const cyl = part(def, "cylinder");
  const saddle = cyl.pieces[0];
  close(saddle.at[2], m467.CYL.len, "托座坐在缸頂(lathe 的局部 z 是世界的 +Y)", 1e-9);
  close(saddle.at[1], 0, "托座沒有往後偏", 1e-9);
  for (const id of ["cylinder", "base", "plunger", "screw"]) assertOnePiece(def, id);
});

test("第 467 種:照原圖:手柄下端在缸的左下,經搖桿銷接到底座;柱塞銷在手柄上、沿泵筒軸線滑;兩銷距離與搖桿長不變;壓下手柄柱塞往下送水", () => {
  const def = m467.default;
  const span = Math.abs(m467.SWING[0] - m467.SWING[1]);
  const j0 = m467.jack(0.01);
  const j1 = m467.jack(0.3);
  assert.ok(j1.handle < j0.handle && j1.s < j0.s && j1.pressing, "壓下手柄,柱塞沿泵筒往下送水");
  const { anchor, length } = m467.ROCKER;
  const { origin, dir } = m467.LINE;
  for (const v of sweep(4 * span, 60)) {
    const j = m467.jack(v);
    close(Math.hypot(j.F[0] - anchor[0], j.F[1] - anchor[1]), length, "搖桿長不變", 1e-6);
    close(Math.hypot(j.P[0] - j.F[0], j.P[1] - j.F[1]), m467.SHORT, "手柄兩銷的距離不變", 1e-6);
    close((j.P[0] - origin[0]) * dir[1] - (j.P[1] - origin[1]) * dir[0], 0, "柱塞銷在泵筒的軸線上", 1e-6);
    assert.ok(j.F[0] < j.P[0] && j.P[0] < 0, "手柄下端與柱塞都在缸的左下");
    assert.ok(j.s - m467.PLUNGER > m467.BARREL.lo + 0.1 && j.s - m467.PLUNGER < m467.BARREL.hi - 0.1, "柱塞的下端全程在泵筒裡");
    const pose = def.pose(v);
    close(pose.parts.handle.position[0], j.F[0], "手柄的下端在搖桿的銷上", 1e-9);
    close(pose.parts.handle.position[1], j.F[1], "手柄的下端在搖桿的銷上", 1e-9);
    close(pose.parts.handle.angle, j.handle, "手柄角", 1e-9);
    const hole = add([j.F[0], j.F[1], 0], [...rot2([m467.SHORT, 0], j.handle), 0]);
    close(Math.hypot(hole[0] - j.P[0], hole[1] - j.P[1]), 0, "手柄上的銷孔對著柱塞的銷", 1e-9);
    assert.ok(pose.parts.rocker, "搖桿是零件");
  }
  assert.ok(anchor[0] < -0.9 && anchor[1] > -1.05 && anchor[1] < -0.7, "搖桿的固定銷在底座左上角");
});

test("第 467 種:開閥放下:轉翼形螺絲把閥從管底的閥座退出、手柄不動;回流從液壓缸經柱塞裡的管子到管底、從閥流回底座;兩個狀態的流體示意都不穿過壁,閥瓣開到底不穿過壁", () => {
  const def = m467.default;
  const span = Math.abs(m467.SWING[0] - m467.SWING[1]);
  const solids = sectionSolids(def, ["base"]);
  const rel = [0, 0.5, 1.5, 3].map((v) => def.pose(v, "release"));
  for (let i = 1; i < rel.length; i++) {
    assert.ok(rel[i].parts.screw.position[0] <= rel[i - 1].parts.screw.position[0], "螺絲往外退");
    assert.ok(rel[i].parts.screw.angle > rel[i - 1].parts.screw.angle, "螺絲在轉");
    close(rel[i].parts.handle.angle, rel[0].parts.handle.angle, "手柄不動", 1e-12);
    assert.ok(rel[i].parts.cylinder.position[1] < rel[i - 1].parts.cylinder.position[1], "液壓缸慢慢降下");
  }
  // 閥座在管子的底部:閉著時塞子在管底的口裡,開著時整個退出口外
  const screw = part(def, "screw");
  const plug = screw.pieces.find((p) => p.kind === "cylinder" && p.radius > 0.06);
  const plugRight = (pose) => pose.parts.screw.position[0] + plug.at[2] + plug.length / 2;
  assert.ok(plugRight(def.pose(0.5, "lift")) > m467.PIPE_END + 0.05, "抬升時塞子塞在管底的口裡");
  assert.ok(plugRight(rel[3]) < m467.PIPE_END - 0.01, "開閥時塞子退出管底的口");
  assert.ok(def.pose(3, "release").flows.length, "開閥時有回流");
  for (const [state, vs] of [["lift", sweep(4 * span, 48)], ["release", sweep(4, 20)]]) {
    for (const v of vs) {
      const pose = def.pose(v, state);
      for (const flow of pose.flows) {
        for (const q of flow.points) assert.ok(!inAny([q[0], q[1]], solids), `${state} 主動量 ${v.toFixed(3)} 的點 (${q[0].toFixed(2)}, ${q[1].toFixed(2)}) 在壁裡`);
        if (state === "release") {
          const inBase = flow.points.filter((q) => q[1] < m467.BASE.y1 && q[0] > m467.PIPE_END);
          for (const q of inBase) assert.ok(distanceToPath(m467.PIPE.map(([x, y]) => [x, y, 0]), [q[0], q[1], 0]) < 0.08, "回流在底座裡走管子");
          assert.ok(flow.points.some((q) => q[0] < m467.PIPE_END), "回流從管底的閥流出到底座");
        }
      }
    }
  }
  let opened = { suction: false, delivery: false };
  for (const v of sweep(4 * span, 48)) {
    const pose = def.pose(v, "lift");
    for (const id of ["suction", "delivery"]) {
      assert.ok(!digsInto(placedFlap(def, id, pose), solids), `主動量 ${v.toFixed(3)}:${id} 的閥瓣穿過壁`);
      if (Math.abs(pose.parts[id].angle - (id === "suction" ? m467.SUCTION_CLOSED : Math.PI / 2)) > 0.6) opened[id] = true;
    }
  }
  assert.ok(opened.suction && opened.delivery, "兩個閥都真的張開過");
});

test("第 468 種:撓性輸水管:各節以鉸鏈相連,拖過河時順著河床的起伏", () => {
  for (const u of sweep(1, 10)) {
    const pts = m468.joints(u);
    for (let k = 1; k < pts.length; k++) close(Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]), m468.SEGMENT, "每節長度不變", 1e-6);
    for (const p of pts) close(p[1] - m468.bed(p[0]), 0.19, "鉸點都貼著河床", 1e-6);
  }
  assert.ok(m468.joints(1)[0][0] > m468.joints(0)[0][0] + 6, "管頭從南岸被拖到北岸");
});

test("第 469 種:溫差引擎:水車經齒輪帶動螺旋;空氣經管子越過頂上,從輪下方冒出", () => {
  close(m469.screwAngle(1), -3, "螺旋與水車以齒輪相連(反向,3 : 1)");
  const pose = m469.default.pose(0.5);
  assert.equal(pose.flows[0].fluid, "air", "以空氣示意");
  assert.ok(pose.flows[0].points.some((p) => p[1] > 2.0), "空氣越過頂上的管子");
  assert.equal(pose.readouts[0].value, "原文未說明");
  // 主動件是推著水車的空氣(虛擬的進程),目標件是水車:這組裝置的目的是「得到旋轉運動」
  assert.equal(m469.default.driver.type, "virtual");
  assert.equal(m469.default.target, "wheel");
  // 螺旋被水車帶著轉時,螺紋往下走,把空氣壓進管裡(原文:「將螺旋朝與抬水相反的方向轉動,藉此將空氣向下壓入管中」)
  const wheel = m469.default.pose(0.1).parts.wheel.angle - m469.default.pose(0).parts.wheel.angle;
  assert.ok(wheel > 0, "水車逆時針轉(氣泡從輪的右下方冒上來)");
  assert.ok(m469.threadAdvance(m469.default.pose(0.1).parts.screw.angle - m469.default.pose(0).parts.screw.angle) < 0, "螺紋往下走");
});
