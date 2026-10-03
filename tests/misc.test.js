// 第十六章「雜項裝置」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep } from "./helpers.js";

import * as m350 from "../models/fig350.js";
import * as m351 from "../models/fig351.js";
import * as m352 from "../models/fig352.js";
import * as m353 from "../models/fig353.js";
import * as m354 from "../models/fig354.js";
import * as m355 from "../models/fig355.js";
import * as m356 from "../models/fig356.js";
import * as m357 from "../models/fig357.js";
import * as m363 from "../models/fig363.js";
import * as m365 from "../models/fig365.js";
import * as m358 from "../models/fig358.js";
import * as m359 from "../models/fig359.js";
import * as m360 from "../models/fig360.js";
import * as m361 from "../models/fig361.js";
import * as m362 from "../models/fig362.js";
import * as m364 from "../models/fig364.js";
import * as m366 from "../models/fig366.js";
import * as m367 from "../models/fig367.js";
import * as m368 from "../models/fig368.js";
import * as m369 from "../models/fig369.js";
import * as m370 from "../models/fig370.js";
import * as m384 from "../models/fig384.js";
import { lineAngle } from "../models/ruler-lines.js";
import * as m371 from "../models/fig371.js";
import * as m372 from "../models/fig372.js";
import * as m373 from "../models/fig373.js";
import * as m374 from "../models/fig374.js";
import * as m375 from "../models/fig375.js";
import * as m376 from "../models/fig376.js";

test("第 350 種:上溝槽的銷靜止、下溝槽的銷沿水平線移動,槓桿把橫移運動傳給導件 a、a 內的桿", () => {
  const xs = sweep(0.6, 20, -1.6).map((x) => m350.traverse(x).rod);
  assert.ok(xs.every((x, i) => i === 0 || x > xs[i - 1]), "下銷往右,桿也往右");
  assert.ok(Math.max(...xs) - Math.min(...xs) > 1, "桿橫移");
});

test("第 351 種:衝壓機:缺齒小齒輪把桿抬起,直到齒脫離齒條,讓桿落下", () => {
  const lifts = sweep(-4 * Math.PI, 400).map((t) => m351.stamp(t).lift);
  let drops = 0;
  for (let i = 1; i < lifts.length; i++) {
    const d = lifts[i] - lifts[i - 1];
    if (d < -1) drops++;
    else assert.ok(d >= -1e-9, "抬起時只往上");
  }
  assert.equal(drops, 2, "每轉一圈落下一次");
  close(Math.max(...lifts), m351.geometry.LEN * m351.geometry.R, "抬起的高度 = 有齒段的節圓弧長", 0.05);
});

test("第 352 種:中式絞盤的另一種配置:轉一圈,重物上升兩段圓周差的一半", () => {
  const [r1, r2] = m352.radii;
  close(m352.pulleyY(2 * Math.PI) - m352.pulleyY(0), Math.PI * (r1 - r2), "每圈上升 π(R₁ − R₂)");
});

test("第 353 種:跳動錘的變形:推板每經過一次把錘頭抬起,滑脫後落下", () => {
  const hs = sweep(2 * Math.PI, 360).map(m353.hammer);
  let drops = 0;
  for (let i = 1; i < hs.length; i++) if (hs[i - 1] > 0.1 && hs[i] < hs[i - 1] - 0.02) drops++;
  assert.ok(Math.max(...hs) > 0.2, "錘頭被抬起");
  assert.ok(drops >= 6, "推板輪轉一圈,錘子落下六次");
});

test("第 354 種:十字頭內的無端溝槽讓十字頭以均勻的速度往復", () => {
  const ys = sweep(2 * Math.PI, 360).map(m354.crosshead);
  const v = ys.slice(1).map((y, i) => Math.abs(y - ys[i]));
  const moving = v.filter((d) => d > 0);
  assert.ok(Math.max(...moving) - Math.min(...moving) < 1e-6, "速度大小處處相同(勻速)");
  close(Math.max(...ys) - Math.min(...ys), 3.2, "行程 = 曲柄直徑", 1e-9);
});

test("第 355 種:陀螺儀:碟片高速旋轉時不掉落,而是繞鉛直軸轉(進動)", () => {
  const cs = sweep(1, 24).map((p) => m355.gyro(p).center);
  assert.ok(cs.every((c) => Math.abs(c[1] - cs[0][1]) < 1e-12), "碟片中心高度不變(不掉落)");
  const r = cs.map((c) => Math.hypot(c[0] + 1.3, c[2]));
  assert.ok(r.every((x) => Math.abs(x - r[0]) < 1e-9), "繞鉛直軸畫圓");
  close(m355.gyro(1).spin, 2 * Math.PI * m355.SPIN_PER_TURN, "碟片自轉遠快於進動");
});

test("第 356 種:Bohnenberger 陀螺儀:不論環的位置怎麼改變,球的軸始終朝同一方向", () => {
  for (const a of sweep(2 * Math.PI, 24)) {
    const { axis } = m356.gimbal(a);
    for (let k = 0; k < 3; k++) close(axis[k], m356.AXIS[k], "球軸方向不變", 1e-9);
  }
});

test("第 357 種:陀螺儀調速器:轉得越快,越能克服彈簧 L,B 的外端被抬得越高,經 C、D 拉動閥桿", () => {
  const slow = m357.governor(2);
  const fast = m357.governor(9);
  assert.ok(fast.end[1] > slow.end[1], "B 的外端升高");
  assert.ok(fast.valve > slow.valve, "閥桿被拉起");
});

test("第 363 種:蹺蹺板:長板繞支點作有限的擺動", () => {
  const [lo, hi] = m363.RANGE;
  const pose = (a) => m363.default.pose(a).parts.board.angle;
  close(pose(hi + 1), hi, "擺動有限");
  close(pose(lo - 1), lo, "擺動有限");
});

test("第 365 種:滾子的旋轉同時產生桿的縱向運動與旋轉運動(兩滾子的軸彼此傾斜)", () => {
  const { TILT, RR, ROD } = m365.geometry;
  const m = m365.rodMotion(1);
  close(m.advance, RR * Math.cos(TILT), "縱向:滾子表面速度沿桿軸的分量");
  close(Math.abs(m.spin) * ROD, RR * Math.sin(TILT), "旋轉:沿桿圓周的分量");
  close(m.back, -1, "兩滾子反向轉");
});

test("第 358 種:托架的橫移速度依皮帶在鏈索輪上作用處的直徑而變", () => {
  const rate = (t) => (m358.fusee(t + 1e-4).wound - m358.fusee(t).wound) / 1e-4;
  const a = rate(0.1);
  const b = rate(m358.RANGE[1] - 0.1);
  close(a, m358.fusee(0.1).r, "托架速度 = 作用處的半徑 × 曲柄角速度", 1e-3);
  assert.ok(a > 1.5 * b, "大直徑處快、小直徑處慢");
});

test("第 359 種:原始鑽孔裝置:按下橫桿時繩解開、心軸轉;放開時繩反向捲回,下一次心軸往另一個方向轉", () => {
  const S = m359.STROKE;
  const down1 = m359.pump(0.5 * S).spindle - m359.pump(0).spindle;
  const down2 = m359.pump(2.5 * S).spindle - m359.pump(2 * S).spindle;
  assert.ok(down1 * down2 < 0, "相鄰兩次按下,心軸轉向相反");
  close(m359.pump(S).spindle, 0, "按到底時繩完全解開", 1e-12);
  assert.ok(m359.pump(2 * S).bar > m359.pump(S).bar, "飛輪的動量把繩捲回、橫桿被拉起");
});

test("第 360 種:樑振動時,鼓輪經棘爪與棘輪帶動飛輪軸只朝一個方向轉", () => {
  const S = m360.SWING;
  const fs = sweep(8 * S, 400).map((v) => m360.beam(v).fly);
  assert.ok(fs.every((f, i) => i === 0 || f <= fs[i - 1] + 1e-12), "飛輪只朝一個方向轉");
  const back = m360.beam(3 * S);
  close(back.fly, m360.beam(2 * S).fly, "回擺時鼓輪反轉,飛輪不動", 1e-12);
  assert.ok(back.drum !== m360.beam(2 * S).drum, "鼓輪反轉");
});

test("第 361 種:皮帶輪離合器:兩銷接觸時下方軸跟著皮帶輪轉,脫開時皮帶輪空轉、軸停住", () => {
  close(m361.clutch(2, "on").shaft, m361.clutch(2, "on").pulley, "接合");
  close(m361.clutch(2, "off").shaft, 0, "脫開時軸不轉");
  assert.ok(Math.abs(m361.clutch(2, "off").pulley) > 1, "皮帶輪照轉");
});

test("第 362 種:銷在下方圓筒的傾斜溝槽中,圓筒轉一圈,上方軸與鼓輪橫移一個來回", () => {
  const xs = sweep(2 * Math.PI, 72).map(m362.traverse);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.8, "橫移");
  close(m362.traverse(2 * Math.PI), m362.traverse(0), "一圈回到原處", 1e-12);
});

test("第 364 種:小輪連續旋轉,大輪間歇旋轉:每根凸柱經過時推一格,其餘時間不動", () => {
  const per = (2 * Math.PI) / 8;
  close(m364.bigAngle(-per) - m364.bigAngle(0), -m364.STEP, "每根凸柱一格", 1e-12);
  const as = sweep(-2 * Math.PI, 360).map(m364.bigAngle);
  const still = as.slice(1).filter((a, i) => a === as[i]).length;
  assert.ok(still > 150, "大部分時間停住");
});

test("第 366 種:鑽床:大斜齒輪帶動鑽桿旋轉;踩下踏板時鑽桿被壓下,但照樣跟著小斜齒輪轉", () => {
  const def = m366.default;
  const up = def.pose(1.3, "up").parts.spindle;
  const down = def.pose(1.3, "down").parts.spindle;
  close(up.angle, down.angle, "鑽桿在小斜齒輪中滑動,仍一起轉");
  close(up.position[1] - down.position[1], m366.PRESS, "踩下踏板,鑽桿下降");
  close(Math.abs(m366.drill(1) - m366.drill(0)), 30 / 12, "轉速比 = 齒數比", 1e-9);
});

test("第 367 種:平行尺:尺葉保持平行,刻度指示兩尺葉之間的寬度", () => {
  for (const a of sweep(m367.RANGE[1], 6, m367.RANGE[0])) {
    const { lineStart, lineNow } = m367.default.pose(a).paths;
    close(lineAngle(lineStart.points), lineAngle(lineNow.points), "兩條線平行", 1e-12);
  }
  assert.ok(m367.ruler(m367.RANGE[1]).gap > m367.ruler(m367.RANGE[0]).gap, "擺開時寬度變大");
});

test("第 368 種:在圓筒上畫螺旋線:圓筒轉動,同一個正齒輪帶齒條使標記點從一端移到另一端,每轉移動一個螺距", () => {
  close(m368.marker(-2 * Math.PI) - m368.marker(0), m368.PITCH, "每轉一個螺距");
  const pts = m368.default.pose(-4 * Math.PI).paths.helix.points;
  const ys = pts.map((p) => p[1]);
  assert.ok(ys.every((y, i) => i === 0 || y >= ys[i - 1] - 1e-12), "螺旋線沿圓筒單調上升");
});

test("第 369 種:擺線擺:擺錘沿擺線運動(擺線的長度不變,擺錘始終在擺線上)", () => {
  for (const p of sweep(1, 36)) {
    const { bob, phi, side } = m369.pendulum(p);
    // 擺線上的點:(a(φ + sin φ), −3a − a cos φ)(相對懸掛點)
    close(bob[0] - m369.top[0], side * m369.A * (phi + Math.sin(phi)), "擺錘在擺線上", 1e-12);
    close(bob[1] - m369.top[1], -3 * m369.A - m369.A * Math.cos(phi), "擺錘在擺線上", 1e-12);
  }
});

test("第 370 種:拋光鏡面:長桿有縱向與擺動運動,棘輪(鏡面)每圈間歇地轉一格", () => {
  const ps = sweep(2 * Math.PI, 36).map((t) => m370.polish(t));
  const angles = ps.map((p) => p.angle);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.2, "長桿擺動");
  const slide = ps.map((p) => Math.hypot(p.pin[0] - p.center[0], p.pin[1] - p.center[1]));
  assert.ok(Math.max(...slide) - Math.min(...slide) > 0.6, "長桿沿長度方向在銷上滑動");
  close(m370.polish(2 * Math.PI).ratchet - m370.polish(0).ratchet, -m370.STEP, "每圈轉一格", 1e-12);
});

test("第 384 種:螺旋線描繪儀:小輪繞中心滾動,同時沿螺紋移動,畫出渦線", () => {
  const ds = sweep(m384.RANGE[1], 30).map((p) => m384.helicograph(p).d);
  assert.ok(ds.every((d, i) => i === 0 || d > ds[i - 1]), "離中心越來越遠(渦線)");
  const h = m384.helicograph(1);
  close(Math.log(h.d / m384.helicograph(0).d), m384.K, "每轉一弧度,距離按固定比例增加", 1e-12);
});

test("第 371 種:兩面有齒的曼格輪:小齒輪均勻旋轉,輪交替地往兩個方向轉,換向時小齒輪穿過開口到另一面", () => {
  const ws = sweep(4 * Math.PI * 60 / 8, 800).map((t) => m371.mangle(t));
  const dirs = ws.slice(1).map((w, i) => Math.sign(w.wheel - ws[i].wheel)).filter(Boolean);
  const changes = dirs.slice(1).filter((d, i) => d !== dirs[i]).length;
  assert.ok(changes >= 1, "輪換向");
  assert.ok(ws.some((w) => w.z > 0.2) && ws.some((w) => w.z < -0.2), "小齒輪在兩面之間換");
  close(Math.max(...ws.map((w) => w.wheel)) - Math.min(...ws.map((w) => w.wheel)), m371.TRAVEL, "單向轉將近一圈", 0.01);
});

test("第 372 種:懷特氏測功計:框架靜止時運動經水平齒輪傳到另一個垂直齒輪;框架放開時框架隨之旋轉", () => {
  const held = m372.dynamometer(1, "held");
  close(held.carrier, 0, "框架不動");
  close(held.sun2, -1, "另一個垂直齒輪反向轉");
  const free = m372.dynamometer(1, "free");
  close(free.carrier, 0.5, "框架跟著轉(負載擋住另一個齒輪時,轉一半)");
});

test("第 373 種:羅伯特氏裝置:指示器的讀數不隨大輪轉速改變,只隨載重改變", () => {
  const def = m373.default;
  close(def.pose(0.5, "light").parts.needle.angle, def.pose(5, "light").parts.needle.angle, "速度不同,指示器不變");
  assert.notEqual(def.pose(1, "light").parts.needle.angle, def.pose(1, "heavy").parts.needle.angle, "重量不同,指示器改變");
});

test("第 374 種:踏板上的滾子經無端皮帶帶動軸上的偏心輪:軸轉一圈,踏板上下一次", () => {
  const angles = sweep(2 * Math.PI, 72).map((t) => m374.treadle(t).angle);
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.3, "踏板上下擺");
  for (const t of sweep(2 * Math.PI, 12)) {
    const r = m374.treadle(t);
    close(Math.hypot(r.roller[0] - r.e[0], r.roller[1] - r.e[1]), m374.SPAN, "皮帶長度不變", 1e-9);
  }
});

test("第 375 種:滾壓輪:輪軸接在直立軸上,輪在環形鍋盆裡繞行並滾動(不打滑)", () => {
  const a = m375.runners(0);
  const b = m375.runners(1);
  const { RUN, WHEEL } = m375.geometry;
  close(Math.abs(b.roll - a.roll) * WHEEL, Math.abs(b.shaft - a.shaft) * RUN, "輪滾過的長度 = 繞行的弧長");
  close(Math.abs(b.shaft - a.shaft), 1, "斜齒輪 1:1");
});

test("第 376 種:踏輪馬力裝置:馬往上走,輪在牠腳下轉", () => {
  close(m376.treadWheel(1).wheel, 2 * Math.PI, "進程一圈,輪轉一圈");
  const strides = sweep(0.2, 40).map((p) => m376.treadWheel(p).stride);
  assert.ok(Math.max(...strides) > 0.9 && Math.min(...strides) < -0.9, "腿交替擺動");
});
