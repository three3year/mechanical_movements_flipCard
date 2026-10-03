// 第十九章「水車與泵」:斷言對應原文;流體示意只驗它是主動量的函式、只在路徑上
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";
import { distanceToPath } from "../models/flow.js";
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
  const atPin = m441.bucket(m441.PIN);
  assert.ok(atPin.tilt > 1, "碰到固定銷時被撥斜");
  const after = m441.bucket(m441.PIN + 40 * deg);
  assert.equal(after.level, 0, "倒過之後空著下降");
  assert.equal(after.tilt, 0, "離開銷後又垂直掛著");
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
    if (c.open && c.y > m439.BOTTOM + 1e-9) assert.ok(c.y < m439.BOTTOM + 0.2, "閥門只在觸地附近打開");
    close(c.y + m439.weightY(c.y), m439.TOP + m439.weightY(m439.TOP), "繩長不變");
    prevY = c.y;
  }
  assert.ok(m439.cycle(0.6).open, "觸地時閥門打開");
});

test("第 440 種:分成兩半的水槽:一邊裝滿就翻過去倒出,另一邊轉到水流下方;可當水錶計數", () => {
  const a = m440.trough(0.2);
  assert.ok(a.tilt > 0 && a.right > 0 && a.left === 0, "左邊低時水落進抬高的右邊");
  const b = m440.trough(0.7);
  assert.ok(b.tilt < 0 && b.left > 0 && b.right === 0, "翻過去後水落進左邊");
  assert.equal(m440.trough(0.99).count + 0, 2, "一個來回倒兩次");
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

test("第 448 種:提升泵:上行時下閥開、活塞閥關,水從出水口溢出;下行時下閥關、活塞閥開", () => {
  const def = m448.default;
  for (const v of sweep(4 * Math.abs(m448.SWING[0] - m448.SWING[1]), 40)) {
    const p = m448.pump(v);
    const parts = def.pose(v).parts;
    assert.equal(OPENED(parts.footValve), p.up, "下方閥門在上行時打開");
    assert.equal(OPENED(parts.pistonValve), !p.up, "活塞閥門在下行時打開");
    if (p.up) assert.ok(def.pose(v).flows[0].points.some((q) => q[0] < -0.9), "上行時水從出水口溢出");
  }
  // 手柄往下壓,活塞上升
  assert.ok(m448.pump(0.01).piston < m448.pump(0.3).piston, "壓手柄提起活塞");
});

test("第 449 種:現代提升泵:出水口的瓣閥向上開,上行時被水頂開", () => {
  const def = m449.default;
  for (const v of sweep(4, 40)) {
    const parts = def.pose(v).parts;
    const up = OPENED(parts.footValve);
    assert.equal(OPENED(parts.outValve), up, "出水瓣閥與下閥同時(上行時)打開");
    assert.equal(OPENED(parts.pistonValve), !up, "活塞閥門在下行時打開");
  }
});

test("第 450 種:壓力泵:上升時吸水閥開、出水閥關;下降時吸水閥關,水經出水閥往上送", () => {
  for (const v of sweep(4 * 0.8, 40)) {
    const p = force.pump(v);
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
    if (v % span < 0.002) continue; // 剛好在行程端點
    const a = def.pose(v - 0.001).parts;
    const b = def.pose(v).parts;
    const grow = [0, 1].map((k) => b[`top${k}`].position[1] - a[`top${k}`].position[1]);
    if (Math.abs(grow[0]) < 1e-6) continue;
    assert.ok(Math.sign(grow[0]) !== Math.sign(grow[1]), "兩個風箱一撐一壓");
    for (const k of [0, 1]) {
      const expanding = grow[k] > 0;
      assert.equal(Math.abs(b[`suction${k}`].angle) > 0.3, expanding, "撐開的風箱吸水閥打開");
      assert.equal(Math.abs(b[`delivery${k}`].angle - Math.PI / 2) > 0.3, !expanding, "壓縮的風箱出水閥打開");
    }
  }
});

test("第 454 種:隔膜泵:隔膜拉起時吸水閥開,壓下時水經出水閥送出", () => {
  const def = m454.default;
  const span = m454.SWING[0] - m454.SWING[1];
  for (const v of sweep(4 * span, 40).slice(1)) {
    if (v % span < 0.002) continue; // 剛好在行程端點
    const d0 = def.pose(v - 0.001).paths.membrane.points[10][1];
    const d1 = def.pose(v).paths.membrane.points[10][1];
    if (Math.abs(d1 - d0) < 1e-6) continue;
    const parts = def.pose(v).parts;
    assert.equal(Math.abs(parts.suctionValve.angle) > 0.3, d1 > d0, "隔膜拉起時吸水閥開");
    assert.equal(Math.abs(parts.deliveryValve.angle) > 0.3, d1 < d0, "隔膜壓下時出水閥開");
  }
});

test("第 455 種:舊式旋轉泵:閥門貼著圓筒內面轉,到擋板處被闔上", () => {
  const deg = Math.PI / 180;
  for (const phi of sweep(2 * Math.PI, 72)) {
    const open = m455.opening(phi);
    const a = Math.atan2(Math.sin(phi), Math.cos(phi));
    if (a > m455.ABUT[0] && a < m455.ABUT[1]) assert.equal(open, 0, "在擋板處閥門闔上");
    if (open === 1) {
      const ang = m455.valveAngle(phi, 1);
      const tip = [m455.DRUM * Math.cos(phi) + m455.VALVE * Math.cos(ang), m455.DRUM * Math.sin(phi) + m455.VALVE * Math.sin(ang)];
      close(Math.hypot(...tip), m455.BORE, "張開的閥門外緣貼著圓筒內面", 1e-9);
    }
  }
  assert.equal(m455.opening(90 * deg), 1, "其他地方閥門張開");
});

test("第 456 種:Cary 旋轉泵:活塞依心形凸輪進出;對準 E 時被推回座裡,另一個同時完全伸出", () => {
  for (const t of sweep(2 * Math.PI, 36)) {
    const parts = m456.default.pose(t).parts;
    for (const k of [0, 1]) {
      const p = parts[`piston${k}`];
      close(Math.hypot(p.position[0], p.position[1]), m456.reach(p.angle), "活塞外端貼著圓筒");
    }
  }
  close(m456.reach(-Math.PI / 2), m456.DRUM, "在 E(底部)活塞完全縮回鼓裡");
  close(m456.reach(Math.PI / 2), m456.DRUM + 2 * m456.ECC, "同時對面的活塞完全伸出");
});

test("第 462 種:鏈式泵:上輪轉動,碟片沿不漏水的圓筒往上走,把碟片之間的水抬上去", () => {
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
  assert.ok(m462.TUBE.y0 < m462.WATER, "圓筒下端浸在水裡");
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
    close(l + r, 2 * (m465.PIVOT[1] - 1.75), "兩個活塞一上一下");
  }
  const def = m465.default;
  assert.equal(def.pose(0.1).readouts[0].value, "右邊的泵", "樑往一邊轉時右邊的泵出水");
  const span = m465.SWING[1] - m465.SWING[0];
  assert.equal(def.pose(span + 0.1).readouts[0].value, "左邊的泵", "轉回來時換左邊");
});
