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
