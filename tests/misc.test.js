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
import * as m377 from "../models/fig377.js";
import * as m378 from "../models/fig378.js";
import fig379 from "../models/fig379.js";
import fig380 from "../models/fig380.js";
import * as m381 from "../models/fig381.js";
import * as m382 from "../models/fig382.js";
import * as m383 from "../models/fig383.js";
import * as m385 from "../models/fig385.js";
import * as m386 from "../models/fig386.js";
import * as m387 from "../models/fig387.js";
import * as m388 from "../models/fig388.js";
import * as m389 from "../models/fig389.js";
import * as m390 from "../models/fig390.js";
import * as m391 from "../models/fig391.js";
import * as m392 from "../models/fig392.js";
import * as m393 from "../models/fig393.js";
import * as m394 from "../models/fig394.js";
import * as m395 from "../models/fig395.js";
import * as m396 from "../models/fig396.js";
import * as m397 from "../models/fig397.js";
import * as m398 from "../models/fig398.js";
import * as m399 from "../models/fig399.js";
import * as m400 from "../models/fig400.js";
import * as m401 from "../models/fig401.js";
import * as m402 from "../models/fig402.js";

test("第 350 種:上溝槽的銷靜止、下溝槽的銷沿水平線移動,槓桿把橫移運動傳給導件 a、a 內的桿", () => {
  const xs = sweep(0.6, 20, -1.6).map((x) => m350.traverse(x).rod);
  assert.ok(xs.every((x, i) => i === 0 || x > xs[i - 1]), "下銷往右,桿也往右");
  assert.ok(Math.max(...xs) - Math.min(...xs) > 1, "桿橫移");
});

test("第 351 種:衝壓機:缺齒小齒輪把桿抬起,直到齒脫離齒條,讓桿落下", () => {
  const thetas = sweep(-4 * Math.PI, 1440);
  const stamps = thetas.map((t) => m351.stamp(t));
  let drops = 0;
  let longest = 0;
  let run = 0;
  for (let i = 1; i < stamps.length; i++) {
    const d = stamps[i].lift - stamps[i - 1].lift;
    if (stamps[i].engaged) assert.ok(d >= -1e-9, "齒咬著齒條時桿只往上");
    if (d < -1e-9) {
      if (run === 0) drops++;
      run++;
      longest = Math.max(longest, run);
    } else run = 0;
  }
  assert.equal(drops, 2, "每轉一圈落下一次");
  assert.ok(longest >= 20, "落下是一段過程(佔小齒輪好幾度),不是瞬移");
  close(Math.max(...stamps.map((s) => s.lift)), m351.TOP, "抬起的高度 = 齒托著齒條滾過的節圓弧長", 0.01);
  assert.ok(m351.TOP > m351.geometry.LEN * m351.geometry.R, "最後一齒過了接觸點還托著桿往上,直到齒尖退出齒條");
  // 齒尖退出齒條的齒頂線才放手:齒頂半徑 cos(EXIT) = 齒條齒頂線離軸心的距離
  const { R } = m351.geometry;
  const m = (2 * R) / 14;
  close((R + m) * Math.cos(m351.EXIT), R - m, "放手時齒尖正好在齒條的齒頂線上");
});

test("第 352 種:中式絞盤的另一種配置:轉一圈,重物上升兩段圓周差的一半", () => {
  const [r1, r2] = m352.radii;
  close(m352.pulleyY(2 * Math.PI) - m352.pulleyY(0), Math.PI * (r1 - r2), "每圈上升 π(R₁ − R₂)");
  // 繩不打滑:左導輪的表面速度是大段捲進的速度、右導輪是小段放出的速度,吊重滑輪是兩者的平均(一邊升一邊轉)
  const [a, b] = [m352.sheaves(1), m352.sheaves(2)];
  close((b.left - a.left) * 0.17, r1, "左導輪的表面速度 = R₁·ω", 1e-9);
  close((b.right - a.right) * 0.17, r2, "右導輪的表面速度 = R₂·ω", 1e-9);
  close(Math.abs(b.pulley - a.pulley) * 0.32, (r1 + r2) / 2, "吊重滑輪的表面速度 = 兩者的平均", 1e-9);
});

test("第 353 種:跳動錘的變形:推板每經過一次把錘頭抬起,滑脫後落下", () => {
  const hs = sweep(2 * Math.PI, 360).map(m353.hammer);
  let drops = 0;
  for (let i = 1; i < hs.length; i++) if (hs[i - 1] > 0.1 && hs[i] < hs[i - 1] - 0.02) drops++;
  assert.ok(Math.max(...hs) > 0.2, "錘頭被抬起");
  assert.ok(drops >= 6, "推板輪轉一圈,錘子落下六次");
  // 原文:「錘柄為第一類槓桿」——推板把尾端往下壓才抬得起錘頭,尾端在輪的左側,所以輪逆時針轉;滑脫後錘頭落回砧上
  assert.ok(m353.default.driver.speed > 0, "推板輪逆時針轉");
  assert.ok(Math.min(...hs) < 0.01, "推板滑脫後錘頭落回砧上");
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

test("第 360 種:樑振動時,鼓輪經棘爪與棘輪帶動飛輪軸只朝一個方向轉;飛輪連續旋轉", () => {
  const S = m360.SWING;
  const fs = sweep(8 * S, 400).map((v) => m360.beam(v).fly);
  assert.ok(fs.every((f, i) => i === 0 || f < fs[i - 1]), "飛輪只朝一個方向轉,而且不停(由擺動運動所產生的連續旋轉運動)");
  // 鼓輪往回轉時,棘爪不帶飛輪:飛輪靠動量繼續往前、越轉越慢
  const back = [2.2, 2.6, 3.0, 3.4].map((k) => m360.beam(k * S));
  assert.ok(back.every((b) => !b.engaged), "回擺時棘爪沒有推");
  assert.ok(back[1].drum > back[0].drum, "鼓輪反轉");
  const d = back.slice(1).map((b, i) => back[i].fly - b.fly);
  assert.ok(d[0] > d[1] && d[1] > d[2] && d[2] > 0, "滑行越來越慢");
  // 推的時候棘輪和鼓輪鎖在一起;每一程推完正好前進一程(5 齒)
  const [p1, p2] = [m360.beam(1.2 * S), m360.beam(1.8 * S)];
  assert.ok(p1.engaged && p2.engaged);
  close(p2.fly - p1.fly, p2.drum - p1.drum, "推動時飛輪跟著鼓輪轉", 1e-9);
  close(m360.beam(2 * S).fly - m360.beam(6 * S).fly, m360.stroke.SPAN, "每一程前進一程", 1e-9);
  close(m360.stroke.SPAN, m360.stroke.STROKE_TEETH * m360.stroke.PITCH, "一程剛好整數齒(棘爪每程在同一個相位碰上齒面)", 1e-9);
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

test("第 364 種:小輪連續旋轉,大輪間歇旋轉:每根凸柱的滾子推著斜棱走過時推一格,其餘時間不動", () => {
  const per = (2 * Math.PI) / 8;
  close(m364.bigAngle(-per) - m364.bigAngle(0), m364.STEP, "每根凸柱一格", 1e-12);
  const as = sweep(-2 * Math.PI, 720).map(m364.bigAngle);
  assert.ok(as.every((a, i) => i === 0 || a >= as[i - 1] - 1e-12), "大輪只朝一個方向轉");
  const still = as.slice(1).filter((a, i) => Math.abs(a - as[i]) < 1e-12).length;
  assert.ok(still > 0, "滾子之間的空檔大輪停住(間歇)");
  // 由接觸算:推動時大輪轉角與滾子的高度成正比(斜棱是一道斜面)
  const [a, b] = [m364.drive(-0.05), m364.drive(-0.15)];
  assert.ok(a.y !== null && b.y !== null);
  close((b.angle - a.angle) / (a.y - b.y), m364.STEP / 0.9, "轉角 / 滾子下降的距離 = 一格 / 斜棱的高度", 1e-9);
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
  // 「黃銅弧形外緣的指向可指示兩個尺葉之間的寬度」:弧固定在下尺葉上,與上尺葉刻度相交的位置(從刻度的起點量)隨寬度單調增加
  const marks = sweep(m367.RANGE[1], 10, m367.RANGE[0]).map((a) => m367.reading(a) - (m367.ruler(a).dx - 0.75));
  for (let i = 1; i < marks.length; i++) assert.ok(marks[i] > marks[i - 1], "寬度越大,讀數越往刻度的另一頭");
  assert.ok(marks.every((x) => x >= 0 && x <= 1.44), "讀數始終落在刻度上");
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

test("第 377 種:踏車:人踩在周邊的踏板上往上走,圓筒被人的重量帶著轉", () => {
  close(m377.treadmill(1).drum, -2 * Math.PI, "進程一圈,圓筒轉一圈(往後轉)");
  const steps = sweep(0.2, 60).map((p) => m377.treadmill(p).step);
  assert.ok(Math.max(...steps) > 0.9 && Math.min(...steps) < -0.9, "人原地踏步");
});

test("第 378 種:擺鋸:擺的運動帶著鋸框往復,鋸條一面鋸一面往下切進樹幹", () => {
  const shifts = sweep(0.2, 200).map((p) => m378.sawing(p).shift);
  assert.ok(Math.max(...shifts) > 0.5 && Math.min(...shifts) < -0.5, "鋸框往復");
  close(m378.sawing(0).saw - m378.sawing(1).saw, m378.DEPTH, "一輪鋸進的深度");
});

test("第 379–380 種:可攜式夾鉗鑽:379 的進料螺桿與鑽頭相對、把工件往上頂;380 的鑽頭心軸穿過進料螺桿中心、往下送", () => {
  const a = fig379.pose(0).parts;
  const b = fig379.pose(20).parts;
  assert.ok(b.screw.position[1] > a.screw.position[1], "379:下臂的螺桿往上頂");
  close(b.drill.angle, 20, "鑽頭跟著曲柄轉");
  const c = fig380.pose(0).parts;
  const d = fig380.pose(20).parts;
  assert.ok(d.drill.position[1] < c.drill.position[1], "380:鑽頭心軸往下送");
});

test("第 381 種:Bowery 式夾具:楔塊順著燕尾形夾頰往裡推,內側夾緊木料", () => {
  const [lo, hi] = m381.RANGE;
  assert.ok(m381.clampGap(hi).inner < m381.clampGap(lo).inner, "推進時兩楔塊靠攏");
  close(m381.clampGap(hi).inner, 0.34, "推到底時夾緊木料", 1e-9);
});

test("第 382 種:鏡子支架:玻璃可抬高或降下、左右轉動,並改變傾斜角度", () => {
  const def = m382.default;
  const low = def.pose(0, "low").parts;
  const high = def.pose(0, "high").parts;
  assert.ok(high.mirror.position[1] > low.mirror.position[1], "抬升");
  assert.notDeepEqual(def.pose(0, "turned").parts.mirror.rotation, high.mirror.rotation, "左右轉動");
  assert.notDeepEqual(def.pose(0.3, "high").parts.mirror.rotation, high.mirror.rotation, "改變傾角");
});

test("第 383 種:布從一個滾筒繞到另一個,中間的圓筒(刷子)處理布面", () => {
  const c = m383.cloth(-1);
  close(c.travel, 0.7, "布走過的長度 = 下滾筒捲上的弧長");
  close(Math.abs(c.top) * 0.7, c.travel, "上滾筒放出同樣長的布");
  close(Math.abs(c.mid) * 1.0, m383.BRUSH * c.travel, "中間圓筒的表面比布快");
});

test("第 385 種:俄羅斯關門裝置:開門時兩銷靠近、重物被抬起;重物下壓肘節,把兩銷撐開而關門", () => {
  const [closed, open] = m385.RANGE;
  assert.ok(m385.toggle(open).joint[1] > m385.toggle(closed).joint[1], "開門時重物被抬起");
  for (const x of sweep(open, 8, closed)) {
    const t = m385.toggle(x);
    close(Math.hypot(t.joint[0] - t.x, t.joint[1] + 0.4), 2.2, "桿長不變", 1e-9);
  }
});

test("第 386 種:可摺疊書房梯:推動側件時橫檔斜起,兩側件靠攏,收合成一根柱", () => {
  const open = m386.fold(0);
  const shut = m386.fold(m386.RANGE[1]);
  close(open.gap, 1.1, "展開時兩側件相距一個橫檔長");
  assert.ok(shut.gap < 0.15, "收合時兩側件併攏");
  assert.ok(shut.angle > 1.4, "橫檔幾乎直立");
});

test("第 387 種:潮汐階梯:無論梯子在什麼位置,踏階皆保持水平", () => {
  const def = m387.default;
  const steep = def.pose(m387.RANGE[0]).parts;
  const flat = def.pose(m387.RANGE[1]).parts;
  assert.ok(Math.abs(steep.stringer.angle - flat.stringer.angle) > 0.3, "水位不同,梯子傾角不同");
  for (const p of [steep, flat]) for (let i = 0; i < 8; i++) close(p[`step${i}`].angle, 0, "踏階水平");
});

test("第 388 種:刨木機進料:帶齒的上滾子把木板往前送,平滑的下滾子被木板帶著轉", () => {
  const f = m388.feed(-1);
  close(f.travel, 0.62, "木板前進 = 上滾子轉過的弧長");
  close(f.low * 0.95, f.travel, "下滾子不打滑");
});

test("第 389 種:升降千斤頂:偏心輪每轉一圈,棘爪把棘齒桿推上一齒,上方的擋止扣住不讓它退下", () => {
  close(m389.rack(2 * Math.PI) - m389.rack(0), 0.22, "每圈一齒");
  const hs = sweep(4 * Math.PI, 200).map(m389.rack);
  assert.ok(hs.every((h, i) => i === 0 || h >= hs[i - 1] - 1e-12), "只升不降");
});

test("第 390 種:部件 A 往兩個方向擺時,開口皮帶 C 與交叉皮帶 D 的棘爪輪流帶動飛輪 B,得到連續旋轉", () => {
  const S = m390.SWING;
  const fs = sweep(8 * S, 400).map((v) => m390.oscillation(v).fly);
  assert.ok(fs.every((f, i) => i === 0 || f >= fs[i - 1] - 1e-12), "飛輪只朝一個方向轉");
  assert.ok(m390.oscillation(2 * S).fly > 0 && m390.oscillation(4 * S).fly > m390.oscillation(2 * S).fly, "兩個方向的擺動都在推");
  const o = m390.oscillation(S);
  close(o.c, -o.d, "開口皮帶與交叉皮帶的皮帶輪反向轉");
});

test("第 391 種:一根齒條上升時、另一根下降時作用於齒輪,得到連續旋轉", () => {
  const S = m391.geometry.STROKE;
  const gs = sweep(4 * S, 200).map((v) => m391.racks(v).gear);
  assert.ok(gs.every((g, i) => i === 0 || g <= gs[i - 1] + 1e-12), "齒輪只朝一個方向轉");
  close(m391.racks(2 * S).gear, (-2 * S) / m391.geometry.GEAR.r, "上、下兩程都推動齒輪");
});

test("第 392 種:跳鋸:下端由曲柄帶動上下,上端的彈簧讓鋸子保持繃緊", () => {
  const lows = sweep(2 * Math.PI, 36).map((t) => m392.gigSaw(t).low);
  close(Math.max(...lows) - Math.min(...lows), 0.9, "行程 = 曲柄直徑", 0.01);
  for (const t of sweep(2 * Math.PI, 8)) {
    const g = m392.gigSaw(t);
    close(g.top - g.low, 2.6, "鋸條長度不變(被彈簧拉直)");
  }
});

test("第 393 種:拋光透鏡:杯子繞共同的軸轉,同時繞自己的軸轉", () => {
  const a = m393.polisher(0).center;
  const b = m393.polisher(Math.PI / 2).center;
  close(Math.hypot(a[0], a[2]), Math.hypot(b[0], b[2]), "杯子繞軸公轉");
  assert.ok(Math.abs(m393.polisher(1).self) > 0, "杯子自轉");
});

test("第 394 種:Parsons 無端齒條:小齒輪連續朝同一方向轉,齒條框往復", () => {
  const xs = sweep(-6 * Math.PI, 600).map((t) => m394.parsons(t).x);
  const dirs = xs.slice(1).map((x, i) => Math.sign(x - xs[i])).filter(Boolean);
  assert.ok(dirs.includes(1) && dirs.includes(-1), "框往復");
  close(Math.max(...xs) - Math.min(...xs), m394.geometry.LEN, "行程 = 直線段長", 1e-6);
});

test("第 395 種:四向活塞閥:閥塞轉 1/4 圈,進汽與排汽的端互換", () => {
  close(m395.plugAngle(0.2), 0, "位置 0");
  close(m395.plugAngle(0.7), Math.PI / 2, "轉 1/4 圈到位置 1");
  assert.equal(m395.position(m395.plugAngle(0.2)), 0);
  assert.equal(m395.position(m395.plugAngle(0.7)), 1);
  assert.equal(m395.position(Math.PI / 4), null, "轉到一半時通道關閉");
  const flows0 = m395.default.pose(0.2).flows;
  const flows1 = m395.default.pose(0.7).flows;
  assert.ok(flows0.length === 2 && flows1.length === 2, "兩個位置都有進汽與排汽");
  assert.equal(m395.default.pose(0.45).flows.length, 0, "轉換時不流動");
});

test("第 396 種:Reed 擒縱:擺輪每擺一次,擒縱輪放走半齒,槓桿換邊", () => {
  const S = m396.SWING;
  close(m396.reed(2 * S).wheel - m396.reed(0).wheel, -m396.PITCH / 2, "每擺一次半齒", 1e-9);
  assert.ok(Math.sign(m396.reed(0).lever) !== Math.sign(m396.reed(2 * S).lever), "槓桿換邊");
});

test("第 397 種:連續圓周運動 → 間歇的直線往復運動", () => {
  const xs = sweep(2 * Math.PI, 360).map((t) => m397.slide(m397.lever(t)).x);
  const still = xs.slice(1).filter((x, i) => x === xs[i]).length;
  assert.ok(still > 100, "有停頓(間歇)");
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.5, "往復");
});

test("第 398 種:連續圓周運動 → 間歇圓周運動,凸輪 C 為驅動端", () => {
  const ws = sweep(2 * Math.PI, 360).map((t) => m398.intermittent(t).wheel);
  assert.ok(ws.every((w, i) => i === 0 || w >= ws[i - 1] - 1e-12), "大輪只朝一個方向轉");
  const still = ws.slice(1).filter((w, i) => w === ws[i]).length;
  assert.ok(still > 100, "間歇:有停住的時候");
  for (const t of sweep(2 * Math.PI, 12)) close(m398.intermittent(t).x + m398.intermittent(t + Math.PI).x, 0, "等寬凸輪:方框兩側始終夾著", 1e-9);
});

test("第 399 種:修理鏈條:每一半的螺絲旋進另一半的螺帽,轉動螺帽把兩半拉近", () => {
  close(m399.tighten(2 * Math.PI), m399.PITCH, "每轉一圈拉近一個螺距");
  const def = m399.default;
  const a = def.pose(0).parts;
  const b = def.pose(0.3).parts;
  assert.ok(b.upper.position[1] < a.upper.position[1] && b.lower.position[1] > a.lower.position[1], "兩半互相靠近");
});

test("第 400 種:四向進料:進料齒依序上、前、下、後,把布往前送", () => {
  const q = (f) => m400.fourMotion(f * 2 * Math.PI);
  assert.ok(q(0.25).lift > 0.17 && q(0.25).feed === 0, "先抬起");
  assert.ok(q(0.5).feed > 0.39 && q(0.5).lift > 0.17, "再往前");
  assert.ok(q(0.75).lift === 0 && q(0.75).feed > 0.39, "再落下");
  close(q(1).feed, 0, "最後退回");
});

test("第 401 種:Brownell 曲柄:手腕越過死點前,滑塊 A 往前移;越過後彈簧 B 把它推回", () => {
  const r0 = m401.wrist(Math.PI).r; // 手腕在底部:滑塊在擋止處
  const near = m401.wrist(-0.1).r; // 接近頂部死點
  assert.ok(near > r0 + 0.1, "接近死點時滑塊移出");
  close(m401.wrist(0.8).r, r0, "越過後彈回擋止處", 1e-9);
});

test("第 402 種:Guernsey 擒縱:兩個擺輪由同一槓桿帶動,朝相反方向擺動", () => {
  const g = m402.guernsey(0);
  assert.ok(g.bal1 * g.bal2 < 0, "兩個擺輪反向");
  close(Math.abs(g.bal1), Math.abs(g.bal2), "擺幅相同");
  close(m402.guernsey(2 * m402.SWING).wheel - m402.guernsey(0).wheel, -Math.PI / m402.N, "每擺一次放走半齒", 1e-9);
});
