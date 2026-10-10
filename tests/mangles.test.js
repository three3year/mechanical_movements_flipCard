// 第十章「變速與曼格機構」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, plateLayers, guidedBetween, shaftSegments, assertGrooveGuides } from "./helpers.js";
import * as m192 from "../models/fig192.js";
import * as m193 from "../models/fig193.js";
import * as m194 from "../models/fig194.js";
import * as m197 from "../models/fig197.js";
import * as m198 from "../models/fig198.js";
import * as m199 from "../models/fig199.js";
import * as m191 from "../models/fig191.js";
import * as m196 from "../models/fig196.js";
import * as m201 from "../models/fig201.js";
import * as m203 from "../models/fig203.js";
import * as m221 from "../models/fig221.js";
import * as m222 from "../models/fig222.js";
import { dist, quatRotate } from "../models/kit.js";
import * as m195 from "../models/fig195.js";
import * as m200 from "../models/fig200.js";
import * as m204 from "../models/fig204.js";
import * as m207 from "../models/fig207.js";
import * as m209 from "../models/fig209.js";
import * as m210 from "../models/fig210.js";
import fig200 from "../models/fig200.js";
import * as m205 from "../models/fig205.js";
import * as m206 from "../models/fig206.js";
import { penetrationDepth, placeOutline, polygonsOverlap } from "../models/contact.js";
import * as m211 from "../models/fig211.js";
import * as m212 from "../models/fig212.js";
import * as m213 from "../models/fig213.js";
import * as m214 from "../models/fig214.js";
import * as m215 from "../models/fig215.js";
import { pointInPolygon } from "../models/contact.js";
import { signedAngle } from "../models/kit.js";
import * as m202 from "../models/fig202.js";
import { edgeDistance, pointInPolygon } from "../models/contact.js";
import { gearProfile, gearSize } from "../models/shapes.js";
import { rot2 } from "../models/kit.js";
import * as m208 from "../models/fig208.js";
import * as m216 from "../models/fig216.js";
import { woolComb, STEP as WOOL_STEP, PHASE as WOOL_PHASE, geometry as woolGeometry } from "../models/wool-comb.js";
import fig217 from "../models/fig217.js";
import fig218 from "../models/fig218.js";
import { partPoint, rot2, TAU } from "../models/kit.js";
import { pointInPolygon, edgeDistance } from "../models/contact.js";
import { circle } from "../models/shapes.js";
import * as m219 from "../models/fig219.js";
import * as m220 from "../models/fig220.js";
import * as m223 from "../models/fig223.js";
import * as m224 from "../models/fig224.js";

/** 等間隔取樣的序列:相鄰差的最大 / 最小(絕對值),量「速度變化多大」 */
function spread(values) {
  const d = values.slice(1).map((v, i) => Math.abs(v - values[i])).filter((x) => x > 1e-9);
  return Math.max(...d) / Math.min(...d);
}

/** 小齒輪等速轉一個週期時,輪的轉速(|d輪 / d小齒輪|)序列,以及輪轉角的往返 */
function wheelRates(m) {
  const vs = sweep(m.period, 3000);
  const ws = vs.map((v) => m.mangle(v).wheel);
  const rates = ws.slice(1).map((w, i) => (w - ws[i]) / (vs[i + 1] - vs[i]));
  return { ws, rates };
}
/** 中位數:避開繞過端頭時的過渡 */
const typical = (list) => list.slice().sort((a, b) => a - b)[Math.floor(list.length / 2)];

test("第 193 種:小齒輪朝同一方向轉,曼格輪朝一方向轉近乎一整圈再反向;外側齒圈半徑大,那一方向轉得較慢", () => {
  const { ws, rates } = wheelRates(m193);
  const span = Math.max(...ws) - Math.min(...ws);
  assert.ok(span > 1.6 * Math.PI && span < 2 * Math.PI, `近乎一整圈(${((span * 180) / Math.PI).toFixed(0)}°)`);
  close(ws[0], ws[ws.length - 1], "一個週期回到原處", 1e-3);
  const forward = rates.filter((r) => r < -1e-6);
  const back = rates.filter((r) => r > 1e-6);
  assert.ok(forward.length && back.length, "兩個方向都有");
  const { RO, RI, RP } = m193.radii;
  close(typical(forward.map(Math.abs)), RP / RO, "沿外側齒圈:轉速 = RP/RO", 0.01);
  close(typical(back), RP / RI, "沿內側齒圈:轉速 = RP/RI", 0.01);
  assert.ok(RP / RO < RP / RI, "外側較慢");
});

test("第 192 種:溝槽與齒偏離輪心,輪在每一部分的轉速都不同", () => {
  const { ws, rates } = wheelRates(m192);
  close(ws[0], ws[ws.length - 1], "一個週期回到原處", 1e-3);
  const forward = rates.filter((r) => r < -1e-6).map(Math.abs);
  // 沿同一圈齒走時轉速也一直在變(不是兩段等速)
  assert.ok(Math.max(...forward) / Math.min(...forward) > 1.15, "同一方向中轉速也在變");
  const ys = sweep(m192.period, 600).map((v) => m192.mangle(v).y);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 0.5, "小齒輪軸被溝槽帶著升降");
});

test("第 194 種:只有一圈齒,兩個方向的轉速相同", () => {
  const { ws, rates } = wheelRates(m194);
  close(ws[0], ws[ws.length - 1], "一個週期回到原處", 1e-3);
  const { RT, RP } = m194.radii;
  const forward = rates.filter((r) => r < -1e-6).map(Math.abs);
  const back = rates.filter((r) => r > 1e-6);
  close(typical(forward), RP / RT, "一方向", 0.01);
  close(typical(back), RP / RT, "另一方向相同", 0.01);
});

test("第 197 種:小齒輪連續旋轉給框架往復運動;小齒輪軸升降以繞過齒條兩端", () => {
  const states = sweep(m197.period, 2000).map((v) => m197.rack(v));
  const xs = states.map((s) => s.frame);
  close(Math.max(...xs) - Math.min(...xs), 10 * m197.pitch + 2 * m197.pinionRadius, "框架往返走完整排銷(加上繞過兩端的銷)", 1e-3);
  const ys = states.map((s) => s.y);
  close(Math.max(...ys), m197.pinionRadius, "在銷排上方", 1e-6);
  close(Math.min(...ys), -m197.pinionRadius, "繞到下方", 1e-6);
  close(xs[0], xs[xs.length - 1], "一個週期回到原處", 1e-3);
});

// ── 曼格輪小齒輪的導路與驅動軸(第 192–194、197 種;共用 pinion-drive.js)──

/** 原文第 36 種:小齒輪的軸「在直立的靜止桿上所切出的直線溝槽內運作」:不動的零件上有一塊板,板上的槽全程夾住小齒輪軸 */
function assertPostGuides(def, period, n = 200) {
  const segments = shaftSegments(def);
  const moving = new Set(Object.keys(def.pose(def.driver.initial).parts));
  const statics = def.parts.filter((p) => !moving.has(p.id)).flatMap((p) => plateLayers(p).map((l) => ({ ...l, at: p.center ?? [0, 0, 0] })));
  let guided = 0;
  for (const v of sweep(def.driver.initial + period, n, def.driver.initial)) {
    const { pinion } = def.pose(v).parts;
    const [x, y, z] = pinion.position;
    const ok = statics.some((l) => {
      const seg = segments.find((s) => z + s.z0 <= l.at[2] + l.z0 && l.at[2] + l.z1 <= z + s.z1);
      if (!seg) return false;
      const g = guidedBetween([x - l.at[0], y - l.at[1]], seg.r, [l.solid]);
      return g.open && g.depth < 0.005 && g.sides;
    });
    if (ok) guided++;
  }
  assert.equal(guided, n + 1, `全程由靜止桿的槽夾住(${guided}/${n + 1} 個姿勢)`);
}

/** #192-2:驅動軸是套管與花鍵軸兩件,各自固定長度,沿兩個萬向接頭的連線互相套住(兩端的距離會變) */
function assertTelescoping(def, period, n = 200) {
  const sleeve = part(def, "driveSleeve");
  const spline = part(def, "driveSpline");
  const front = part(def, "joint");
  const fixed = part(def, "jointFixed");
  assert.ok(sleeve.inner && spline.radius < sleeve.inner, "花鍵軸放得進套管的內孔");
  const lengths = [];
  for (const v of sweep(def.driver.initial + period, n, def.driver.initial)) {
    const parts = def.pose(v).parts;
    const a = parts.joint.position;
    const b = parts.jointFixed?.position ?? fixed.center;
    const l = dist(a, b);
    lengths.push(l);
    const u = [(b[0] - a[0]) / l, (b[1] - a[1]) / l, (b[2] - a[2]) / l];
    // 每一件兩端在連線上的位置(0 = 小齒輪端的萬向接頭,l = 固定端)
    const span = (id, len) => {
      const { position: c, rotation: q } = parts[id];
      const axis = quatRotate(q, [0, 0, 1]);
      const ends = [-1, 1].map((s) => c.map((x, k) => x + (s * len * axis[k]) / 2));
      const s = ends.map((e) => (e[0] - a[0]) * u[0] + (e[1] - a[1]) * u[1] + (e[2] - a[2]) * u[2]);
      for (const [i, e] of ends.entries()) close(dist(e, a.map((x, k) => x + s[i] * u[k])), 0, `${id} 在兩個萬向接頭的連線上`, 1e-6);
      return s.sort((p, q2) => p - q2);
    };
    const [p0, p1] = span("driveSpline", spline.length);
    const [s0, s1] = span("driveSleeve", sleeve.length);
    assert.ok(p0 < front.radius && p0 > 0, `主動量 ${v.toFixed(2)}:花鍵軸接在小齒輪端的萬向接頭上`);
    assert.ok(s1 > l - fixed.radius && s1 < l, `主動量 ${v.toFixed(2)}:套管接在固定端的萬向接頭上`);
    assert.ok(p1 - s0 >= 0.3, `主動量 ${v.toFixed(2)}:花鍵軸插在套管裡(重疊 ${(p1 - s0).toFixed(2)})`);
    assert.ok(p1 < l - fixed.radius, `主動量 ${v.toFixed(2)}:花鍵軸不頂到固定端`);
    assert.ok(s0 > front.radius, `主動量 ${v.toFixed(2)}:套管不頂到小齒輪端`);
  }
  assert.ok(Math.max(...lengths) - Math.min(...lengths) > 0.1, "兩個萬向接頭的距離會變(要靠套管伸縮)");
}

for (const [n, m] of [[192, m192], [193, m193], [194, m194]]) {
  test(`第 ${n} 種:小齒輪軸往後伸進輪上的溝,溝引導它(原文第 194 種:小齒輪軸皆由輪上的一條溝槽所引導)`, () => {
    assertGrooveGuides(m.default, m.period);
  });
}
for (const [n, m] of [[192, m192], [193, m193], [194, m194], [197, m197]]) {
  test(`第 ${n} 種:小齒輪軸在直立靜止桿的直線溝槽裡升降(同第 36 種)`, () => {
    assertPostGuides(m.default, m.period);
  });
  test(`第 ${n} 種:驅動軸是套管與花鍵軸兩件、固定長度互相套住,萬向接頭讓軸擺動(原文第 194 種)`, () => {
    assertTelescoping(m.default, m.period);
  });
}

test("第 194 種:小齒輪幾乎整個寬度都咬在銷上,不碰輪面(原文:使小齒輪保持嚙合)", () => {
  const def = m194.default;
  const pinion = part(def, "pinion");
  const wheel = part(def, "wheel");
  const pins = wheel.pieces.filter((p) => p.kind === "box").map((p) => [p.at[2] - p.size[2] / 2, p.at[2] + p.size[2] / 2]);
  const face = Math.max(...plateLayers(wheel).map((l) => l.z1));
  for (const v of sweep(def.driver.initial + m194.period, 50, def.driver.initial)) {
    const z = def.pose(v).parts.pinion.position[2];
    const [a, b] = [z - pinion.width / 2, z + pinion.width / 2];
    for (const [p0, p1] of pins) assert.ok(Math.min(b, p1) - Math.max(a, p0) >= 0.8 * pinion.width, `咬合寬度 ${(Math.min(b, p1) - Math.max(a, p0)).toFixed(3)}`);
    assert.ok(a >= face, "小齒輪不壓進輪面");
  }
});

test("第 198 種:小齒輪不升降;走到齒條末端時把承載齒條的部分抬起,沿另一側繼續走", () => {
  const states = sweep(m198.period, 2000).map((v) => m198.rack(v));
  const lifts = states.map((s) => s.lift);
  const { H, RP } = m198.radii;
  close(Math.max(...lifts) - Math.min(...lifts), 2 * (H - RP), "齒條升降的量", 1e-6);
  const xs = states.map((s) => s.frame);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 3, "框架往返");
  // 齒條升降只發生在兩端(框架在行程的盡頭)
  const xmax = Math.max(...xs);
  const xmin = Math.min(...xs);
  for (let i = 1; i < states.length; i++) {
    if (Math.abs(lifts[i] - lifts[i - 1]) > 1e-6) assert.ok(xs[i] > xmax - 0.6 || xs[i] < xmin + 0.6, "只在兩端升降");
  }
});

test("第 199 種:燈籠式小齒輪連續旋轉,框架往復;與一側齒條嚙合時,沒有銷的那一半朝向另一側", () => {
  const { RL, PINS, WINDOW, TRAVEL } = m199.geometry;
  const xs = sweep(2 * Math.PI, 720).map((v) => m199.frame(v).x);
  close(Math.max(...xs) - Math.min(...xs), TRAVEL, "往返的行程", 1e-6);
  close(xs[0], xs[xs.length - 1], "轉一圈回到原處", 1e-9);
  for (const v of sweep(2 * Math.PI, 360)) {
    const { rack } = m199.frame(v);
    const other = rack === "top" ? -Math.PI / 2 : Math.PI / 2;
    for (let i = 0; i < PINS; i++) {
      const a = m199.pinAngle(i, v);
      const off = Math.abs(Math.atan2(Math.sin(a - other), Math.cos(a - other)));
      assert.ok(off >= WINDOW - 1e-9, `v = ${v.toFixed(2)}:另一側沒有銷`);
    }
  }
  assert.ok(RL > 0);
});

test("第 191 種:渦形齒輪,從動輪逐漸加速", () => {
  const { R0, R1, D, MAX } = m191.geometry;
  const us = sweep(MAX, 300);
  const ratios = us.map((u) => m191.scroll(u).ratio);
  for (let i = 1; i < ratios.length; i++) assert.ok(ratios[i] > ratios[i - 1], "轉速比一直增加");
  close(ratios[0], R0 / R1, "起初較慢", 0.02);
  assert.ok(ratios[ratios.length - 1] > 1.3, "最後比主動輪快");
  for (const u of us) close(m191.scroll(u).r1 + m191.scroll(u).r2, D, "兩接觸半徑之和 = 中心距", 1e-9);
  // 純滾動:下輪轉角對上輪的導數 = r1 / r2
  const u = 2;
  close((m191.scroll(u + 1e-5).lower - m191.scroll(u - 1e-5).lower) / 2e-5, m191.scroll(u).ratio, "滾動", 1e-4);
});

test("第 196 種:小齒輪 B 等速轉,承載輪 A 的搖臂不規則地擺動,A 一直與 B 咬合", () => {
  const states = sweep(40, 800).map((a) => m196.swing(a));
  const arms = states.map((s) => s.arm);
  assert.ok(Math.max(...arms) - Math.min(...arms) > 0.1, "搖臂擺動");
  assert.ok(spread(arms) > 3, "擺動不規則(時快時慢)");
  const { r, RB } = m196.radii;
  for (const s of states.slice(0, 50)) assert.ok(dist(s.center, [0, 0, 0]) > RB + 0.6, "A 在 B 上方");
});

test("第 196 種:輪 A 裝在搖臂的末端——A 的軸穿過 A、伸到 A 的背面,前端穿過搖臂端的軸眼", () => {
  const def = m196.default;
  const wheel = def.parts.find((p) => p.id === "wheelA");
  const arm = def.parts.find((p) => p.id === "arm");
  const axle = (wheel.pieces ?? []).find((p) => p.kind === "cylinder" && Math.hypot(p.at[0], p.at[1]) < 1e-9 && (p.axis ?? [0, 0, 1])[2] === 1);
  assert.ok(axle, "A 的中心有軸");
  const [back, front] = [axle.at[2] - axle.length / 2, axle.at[2] + axle.length / 2];
  assert.ok(back < -wheel.thickness / 2, "軸伸到 A 的背面");
  for (const v of sweep(40, 160)) {
    const pose = def.pose(v).parts;
    close(pose.arm.from[0], pose.wheelA.position[0], `主動量 ${v.toFixed(2)}:搖臂端在 A 的軸線上(x)`, 1e-9);
    close(pose.arm.from[1], pose.wheelA.position[1], `主動量 ${v.toFixed(2)}:搖臂端在 A 的軸線上(y)`, 1e-9);
    const z = pose.arm.from[2];
    assert.ok(back <= z - arm.thickness / 2 && front >= z + arm.thickness / 2, `主動量 ${v.toFixed(2)}:A 的軸穿過搖臂端的軸眼`);
  }
});

test("第 201 種:小齒輪(由不規則齒輪帶動)使水平臂變速擺動、桿 A 變速往復", () => {
  const rods = sweep(-2 * Math.PI, 600).map((a) => m201.motion(a).rodA);
  assert.ok(Math.max(...rods) - Math.min(...rods) > 0.3, "桿 A 往復");
  close(rods[0], rods[rods.length - 1], "不規則齒輪轉一圈回到原處", 1e-3);
  assert.ok(spread(rods) > 3, "變速");
  const pinions = sweep(-2 * Math.PI, 600).map((a) => m201.motion(a).pinion);
  for (let i = 1; i < pinions.length; i++) assert.ok(pinions[i] > pinions[i - 1], "小齒輪連續朝同一方向轉");
});

test("第 201 種:桿 A 整個行程都穿過兩個導套,升到最高時下端仍伸出下導套", () => {
  const def = m201.default;
  const rod = def.parts.find((p) => p.id === "rodA");
  const body = rod.pieces.find((p) => p.kind === "box" && p.size[1] > 1); // 桿身
  const guides = def.parts.find((p) => p.id === "frame").pieces.filter((p) => p.kind === "cylinder" && p.axis?.[1] === 1);
  assert.ok(guides.length >= 2, "桿 A 有上下兩個導套");
  for (const v of sweep(-2 * Math.PI, 360)) {
    const y = def.pose(v).parts.rodA.position[1] + body.at[1];
    const [lo, hi] = [y - body.size[1] / 2, y + body.size[1] / 2];
    for (const g of guides) {
      const [gLo, gHi] = [g.at[1] - g.length / 2, g.at[1] + g.length / 2];
      assert.ok(lo < gLo - g.length && hi > gHi + g.length, `主動量 ${v.toFixed(2)}:桿身(${lo.toFixed(2)}~${hi.toFixed(2)})沒有整段穿過 y ${g.at[1]} 的導套`);
    }
  }
});

test("第 203 種:曲面開槽臂規則地擺動,直臂得到變速的擺動", () => {
  const [from, to] = m203.range;
  const straight = sweep(to, 200, from).map((a) => m203.arms(a).straight);
  const unwrap = straight.map((v) => (v < 0 ? v + 2 * Math.PI : v));
  assert.ok(spread(unwrap) > 2, "等速擺動的開槽臂,直臂時快時慢");
  for (const a of sweep(to, 50, from)) {
    const { s, length } = m203.arms(a);
    assert.ok(s > 0.2 && s < length - 0.2, "銷一直在槽內");
  }
});

test("第 221 種:橢圓輪 C 帶動小齒輪,框架上下起伏讓小齒輪保持咬合;輪 A 得到不規則的轉動", () => {
  const { r, rb, LINK, A } = m221.geometry;
  const thetas = sweep(-2 * Math.PI, 600);
  const states = thetas.map((t) => m221.train(t));
  for (const s of states) {
    close(dist(s.center, A), LINK, "框架長度不變", 1e-4);
    close(dist(s.center, s.contact), rb, "小齒輪的節圓與 C 的節曲線相切:軸心離接觸點一個節圓半徑", 1e-3);
    close(dist(s.contact, [0, 0, 0]), r(s.phi), "接觸點在 C 的節曲線上", 1e-3);
  }
  assert.ok(spread(states.map((s) => s.a)) > 3, "A 的轉動不規則");
  assert.ok(r(0) !== r(Math.PI) && rb > 0);
});

test("第 222 種:偏心轉動的普通正齒輪,以連桿維持節距;輪 A 同樣得到不規則的轉動", () => {
  const { A: rA, B: rB, C: rC } = m222.radii;
  const states = sweep(2 * Math.PI, 600).map((t) => m222.train(t));
  for (const s of states) {
    close(dist(s.b, m222.centerA), rA + rB, "框架", 1e-6);
    close(dist(s.b, s.cc), rB + rC, "連桿維持 B 與 C 的節距", 1e-6);
    assert.ok(dist(s.cc, m222.centerA) > rA + rC + 0.2, "A 與 C 不咬合,齒頂之間留有空隙");
  }
  assert.ok(spread(states.map((s) => s.thetaA)) > 1.5, "A 的轉動不規則");
});

test("第 195 種:兩個相同的輪與中間的蝸桿咬合,相對的表面朝同一方向走;蝸桿每轉一圈輪轉一齒", () => {
  const { N, R } = m195.geometry;
  const a = m195.rolls(0);
  const b = m195.rolls(2 * Math.PI);
  close(b.upper - a.upper, -(2 * Math.PI) / N, "上輪轉一齒", 1e-9);
  close(b.lower - a.lower, (2 * Math.PI) / N, "下輪反向轉一齒", 1e-9);
  // 上輪最下緣的速度 = R·dθu(往 +x 為正),下輪最上緣 = −R·dθl
  const du = b.upper - a.upper;
  const dl = b.lower - a.lower;
  assert.ok(R * du * (-R * dl) > 0, "相對的表面同向");
});

test("第 207 種:兩個旋向相反的蝸桿帶兩個蝸輪反向轉,相對的兩側朝同一方向", () => {
  const [l0, r0] = m207.wheels(0);
  const [l1, r1] = m207.wheels(1);
  assert.ok((l1 - l0) * (r1 - r0) < 0, "兩輪反向");
  // 左輪右側(朝右輪)的垂直速度 = R·dθ;右輪左側 = −R·dθ
  assert.ok((l1 - l0) * -(r1 - r0) > 0, "相對的兩側同向");
});

/**
 * 一對進料滾軸(兩個輪零件上半徑最大的圓柱塊,輪軸沿 z)夾著被送的材料(直線的路徑零件):
 * 兩滾軸在同一層、材料在兩者的深度範圍內;材料貼著兩滾軸的表面(間隙接近 0、不穿入);
 * 主動量走一小步時,材料前進的距離等於兩個滾軸在接觸點的表面位移(兩者相同:相對的表面同向)。
 */
function assertFeedRolls(def, wheelIds, materialId) {
  const mat = part(def, materialId);
  const rollers = wheelIds.map((id) => {
    const p = part(def, id);
    const roll = p.pieces.filter((q) => q.kind === "cylinder").reduce((a, b) => (b.radius > a.radius ? b : a));
    const z = p.center[2] + (roll.at?.[2] ?? 0);
    return { id, center: p.center, radius: roll.radius, z: [z - roll.length / 2, z + roll.length / 2] };
  });
  const v0 = 0.3;
  const pose0 = def.pose(v0);
  const pose1 = def.pose(v0 + 0.01);
  const [a, b] = [pose0.paths[materialId].points[0], pose0.paths[materialId].points.at(-1)];
  const along = [b[0] - a[0], b[1] - a[1]].map((c) => c / Math.hypot(b[0] - a[0], b[1] - a[1]));
  const mz = a[2];
  close(b[2], mz, "材料是一條同一深度的直線");
  const fed = pose1.paths[materialId].phase - pose0.paths[materialId].phase;
  for (const r of rollers) {
    assert.ok(mz - mat.radius >= r.z[0] && mz + mat.radius <= r.z[1], `材料在 ${r.id} 滾軸的深度範圍(${r.z.map((x) => x.toFixed(2))})內`);
    // 滾軸中心到材料中心線的距離(平面上)
    const rel = [r.center[0] - a[0], r.center[1] - a[1]];
    const t = rel[0] * along[0] + rel[1] * along[1];
    const contact = [a[0] + along[0] * t, a[1] + along[1] * t];
    const d = Math.hypot(r.center[0] - contact[0], r.center[1] - contact[1]);
    close(d - r.radius - mat.radius, 0, `${r.id} 滾軸貼著材料(間隙)`, 0.005);
    // 接觸點(滾軸表面上朝材料的那一點)隨滾軸轉動的位移,投影到材料前進的方向
    const dTheta = pose1.parts[r.id].angle - pose0.parts[r.id].angle;
    const p = [(contact[0] - r.center[0]) * (r.radius / d), (contact[1] - r.center[1]) * (r.radius / d)];
    const surface = dTheta * (-p[1] * along[0] + p[0] * along[1]);
    assert.ok(Math.abs(surface) > 1e-6, `${r.id} 滾軸在轉`);
    close(fed, surface, `材料隨 ${r.id} 滾軸的表面前進`, 1e-9);
  }
}

test("第 195 種:一對進料滾軸在同一層,相對的表面朝同一方向運動,夾著被送的材料前進(#195-1)", () => {
  assertFeedRolls(m195.default, ["upper", "lower"], "material");
});

test("第 207 種:為第 195 種的變形:兩個蝸輪同軸的一對進料滾軸夾著被送的材料前進(#207-1)", () => {
  assertFeedRolls(m207.default, ["left", "right"], "material");
});

test("第 207 種:照插圖的箭頭,播放時軸的前面往上、左輪逆時針、右輪順時針(#207-2)", () => {
  const def = m207.default;
  const dir = Math.sign(def.driver.speed ?? 1);
  const p0 = def.pose(0).parts;
  const p1 = def.pose(dir * 0.1).parts;
  // 軸沿 +x:轉角增加時,前面(+z)那一點往 −y 走
  assert.ok(p1.shaft.angle - p0.shaft.angle < 0, "軸的前面往上");
  assert.ok(p1.left.angle - p0.left.angle > 0, "左輪逆時針(從正面看)");
  assert.ok(p1.right.angle - p0.right.angle < 0, "右輪順時針");
});

test("第 200 種:單一驅動輪在同一軸上得到兩種速度:上下兩輪反向轉、轉速與半徑成反比", () => {
  const p0 = fig200.pose(0).parts;
  const p1 = fig200.pose(0.3).parts;
  const du = p1.upper.angle - p0.upper.angle;
  const dl = p1.lower.angle - p0.lower.angle;
  // 上輪的軸朝下(−y)、下輪的軸朝上(+y):換成繞 +y 的轉角再比較
  assert.ok(-du * dl < 0, "上輪(套筒)與下輪(軸)反向");
  close(Math.abs(dl / du), m200.upper.radius / m200.lower.radius, "轉速比 = 半徑反比", 1e-6);
  assert.ok(Math.abs(dl) > Math.abs(du), "小輪(軸)較快");
});

test("第 204 種:斜交的兩軸以雙曲面滾子滾動接觸,沿接觸線垂直方向的表面速度相同", () => {
  for (const x of [-2, -1, 0, 1, 2]) {
    const { upper, lower } = m204.surfaceSpeeds(x);
    // 兩表面的速度只在接觸線方向(x)上不同(沿線滑動),其餘方向相同(滾動、不分離)
    close(upper[1], lower[1], `x = ${x}`, 1e-9);
    close(upper[2], lower[2], `x = ${x}:滾動方向的速度相同`, 1e-9);
  }
  const { radius, THROAT } = m204.geometry;
  close(radius(0), THROAT, "最細處在中間", 1e-12);
  assert.ok(radius(2) > radius(0), "兩端較粗");
});

test("第 204 種:兩個滾子的四個軸頭各裝在機架的一個軸承裡,滾子本體兩側各一個(#204-1,推斷)", () => {
  const def = m204.default;
  const frame = part(def, "frame");
  assert.ok(frame, "有機架");
  for (const id of ["upper", "lower"]) {
    const roller = part(def, id);
    const axis = roller.axis;
    const journal = roller.pieces.find((q) => q.kind === "cylinder" && !q.at); // 貫穿的軸(兩端伸出成軸頭)
    const body = Math.max(...roller.pieces.find((q) => q.kind === "lathe").profile.map(([, s]) => Math.abs(s)));
    const sides = new Set();
    for (const q of frame.pieces) {
      if (q.kind !== "cylinder" || !q.inner || !q.axis) continue;
      const rel = [q.at[0] - roller.center[0], q.at[1] - roller.center[1], q.at[2] - roller.center[2]];
      const s = rel[0] * axis[0] + rel[1] * axis[1] + rel[2] * axis[2];
      const off = Math.hypot(rel[0] - s * axis[0], rel[1] - s * axis[1], rel[2] - s * axis[2]);
      const parallel = Math.abs(q.axis[0] * axis[0] + q.axis[1] * axis[1] + q.axis[2] * axis[2]);
      if (off > 1e-6 || parallel < 1 - 1e-9) continue; // 不在這根軸上
      assert.ok(Math.abs(s) - q.length / 2 > body, `${id} 的軸承在滾子本體外(s = ${s.toFixed(2)})`);
      assert.ok(Math.abs(s) + q.length / 2 <= journal.length / 2, `${id} 的軸頭伸過整個軸承`);
      close(q.inner, journal.radius, `${id} 的軸承孔套著軸頭`, 0.01);
      sides.add(Math.sign(s));
    }
    assert.deepEqual([...sides].sort(), [-1, 1], `${id} 兩端的軸頭都有軸承`);
  }
});

test("第 209 種:兩個橢圓輪滾動接觸;一圈中有光面滾動、也有齒咬合的部分", () => {
  const { D, r1, r2 } = m209.geometry;
  const states = sweep(2 * Math.PI, 720).map((t) => m209.pair(t));
  assert.ok(states.some((s) => s.toothed) && states.some((s) => !s.toothed), "有齒與光面輪流接觸");
  for (const t of sweep(2 * Math.PI, 36)) {
    const right = m209.pair(t).right;
    close(r1(-t) + r2(Math.PI - right), D, "兩輪接觸半徑之和 = 中心距", 2e-3);
  }
});

test("第 209 種:叉形卡榫引導角狀凸出:兩輪轉一整圈,角狀凸出與叉齒都不互相穿入", () => {
  const { D } = m209.geometry;
  const { fork, horn } = m209.catches;
  let near = Infinity;
  for (const t of sweep(2 * Math.PI, 2880)) {
    const right = m209.pair(t).right;
    const h = placeOutline(horn.outline, [D, 0], right);
    for (const f of fork) assert.ok(!polygonsOverlap(placeOutline(f.outline, [0, 0], t), h), `左輪轉 ${t.toFixed(3)} 時叉齒與角狀凸出重疊`);
    near = Math.min(near, Math.hypot(h[0][0] - 2.45 * Math.cos(Math.PI + t), h[0][1] - 2.45 * Math.sin(Math.PI + t)));
  }
  assert.ok(near < 0.2, "角狀凸出確實經過叉口");
});

test("第 210 種:轉動開槽臂的軸,垂直桿得到變速的直線運動", () => {
  const [from, to] = m210.range;
  const ys = sweep(to, 200, from).map((a) => m210.pin(a).y);
  assert.ok(Math.max(...ys) - Math.min(...ys) > 0.8, "桿上下移動");
  assert.ok(spread(ys) > 2, "變速");
  for (const a of sweep(to, 40, from)) {
    const { s, length } = m210.pin(a);
    assert.ok(s > 0.3 && s < length - 0.25, "銷一直在槽內");
  }
});

test("第 205 種:兩個凸輪組成的「兩齒小齒輪」,交替推動輪兩面交錯的齒;小齒輪每轉一圈,輪走兩格", () => {
  const { STEP } = m205.geometry;
  close(m205.wheelAngle(2 * Math.PI) - m205.wheelAngle(0), -2 * STEP, "一圈兩格", 1e-12);
  close(m205.wheelAngle(Math.PI) - m205.wheelAngle(0), -STEP, "半圈一格(另一個凸輪接手)", 1e-12);
});

test("第 206 種:承載兩個棘爪的槓桿擺動,一個上升時推、一個下降時推,棘輪連續朝同一方向轉", () => {
  const S = m206.swing;
  const angles = sweep(4 * S, 400).map((v) => m206.wheelAngle(v));
  for (let i = 1; i < angles.length; i++) assert.ok(angles[i] <= angles[i - 1] + 1e-12, "只朝一個方向");
  // 上升的半程與下降的半程都有推進
  assert.ok(m206.wheelAngle(S) < m206.wheelAngle(0) - 0.05, "上升時推");
  assert.ok(m206.wheelAngle(2 * S) < m206.wheelAngle(S) - 0.05, "下降時推");
  close(m206.wheelAngle(2 * S) - m206.wheelAngle(0), m206.advance, "每個來回推進的量固定", 1e-9);
  assert.ok(Math.abs(Math.abs(m206.advance) / m206.pitch - Math.round(Math.abs(m206.advance) / m206.pitch)) < 1e-9, "每個來回推整數個齒");
});

test("第 206 種:兩個爪由接觸推動棘輪——爪尖不穿入齒,爪落進下一格時有加速過程", () => {
  const S = m206.swing;
  for (const v of sweep(4 * S, 400)) {
    const { pawls, wheel } = m206.contactAt(v);
    for (const which of ["left", "right"]) assert.ok(penetrationDepth(pawls[which], wheel) < 0.02, `主動量 ${v.toFixed(3)} ${which} 爪穿入齒`);
  }
  // 播放時一程 1.2 秒、每秒 30 格:爪每格轉不到 0.15 弧度
  const def = m206.default;
  let prev = def.pose(0).parts;
  for (const v of sweep(4 * S, 144).slice(1)) {
    const p = def.pose(v).parts;
    for (const id of ["pawlLeft", "pawlRight"]) assert.ok(Math.abs(p[id].angle - prev[id].angle) < 0.15, `${id} 沒有瞬移`);
    prev = p;
  }
});

test("第 211 種:大輪連續旋轉,小齒輪間歇轉動:轉過有齒部分時轉一圈,其餘時間被鎖住", () => {
  const thetas = sweep(2 * Math.PI, 720);
  const pinions = thetas.map((t) => m211.intermittent(t).pinion);
  close(pinions[pinions.length - 1] - pinions[0], -2 * Math.PI, "大輪一圈,小齒輪一圈", 1e-6);
  const still = pinions.slice(1).filter((p, i) => Math.abs(p - pinions[i]) < 1e-12).length;
  assert.ok(still > 300, "大半時間鎖住不動");
});

/**
 * 日內瓦式擋止(第 212、215 種):主動量 v 時 A(各塊)與 B 在平面上的外形(世界座標,照姿勢放好),
 * 以及兩者互相伸進對方的頂點以 B 的中心看的角度(弧度,世界座標)。
 */
function genevaContact(m, target, v) {
  const def = m.default;
  const p = def.pose(v).parts;
  const center = (id) => part(def, id).center ?? [0, 0, 0];
  const as = m.outlines.A.map((o) => placeOutline(o, center("wheelA"), p.wheelA.angle));
  const b = placeOutline(m.outlines.B, center(target), p[target].angle);
  const depth = Math.max(...as.map((a) => penetrationDepth(a, b)));
  const c = center(target);
  const angles = as
    .flatMap((a) => [...b.filter((q) => pointInPolygon(q, a)), ...a.filter((q) => pointInPolygon(q, b))])
    .map(([x, y]) => Math.atan2(y - c[1], x - c[0]));
  return { depth, angles, p };
}
/** 角度 t 是否在 from 到 to 這段(較短的)弧上 */
const onArc = (t, from, to) => {
  const span = Math.abs(signedAngle(to - from));
  return Math.abs(signedAngle(t - from)) <= span + 1e-6 && Math.abs(signedAngle(t - to)) <= span + 1e-6;
};

test("第 212 種:日內瓦式擋止:A 每轉一圈 B 走一格(原圖 B 有五道槽,一格五分之一圈),其餘時間不動", () => {
  close(m212.stop(2 * Math.PI).b - m212.stop(0).b, -(2 * Math.PI) / 5, "每圈一格", 1e-9);
  close(m212.stop(Math.PI).b, m212.stop(Math.PI + 0.5).b, "鎖住時不動", 1e-12);
});

test("第 212 種:「輪 B 上的凸曲部分 a、b 起到擋止的作用」:A 轉到範圍兩端,凸弧 a–b 頂在 A 上,再轉一點就穿入", () => {
  const [lo, hi] = m212.range;
  for (const [end, dir] of [[lo, -1], [hi, 1]]) {
    const at = genevaContact(m212, "wheelB", end);
    assert.ok(at.depth < 0.002, `範圍端 ${end.toFixed(3)} 不穿入(${at.depth.toFixed(4)})`);
    const beyond = genevaContact(m212, "wheelB", end + dir * 0.01);
    assert.ok(beyond.depth > 0.004, `再轉 0.01 就穿入(${beyond.depth.toFixed(4)})`);
    const [a, b] = ["tagA", "tagB"].map((id) => Math.atan2(beyond.p[id].position[1], beyond.p[id].position[0]));
    assert.ok(beyond.angles.length > 0 && beyond.angles.every((t) => onArc(t, a, b)), "碰到的地方在凸弧 a–b 上");
  }
});

test("第 212 種:換格時 B 的槽角落在 A 齒旁的缺口裡:可轉範圍內 A 與 B 全程不穿入", () => {
  const [lo, hi] = m212.range;
  for (const v of sweep(hi, 1200, lo)) {
    const { depth } = genevaContact(m212, "wheelB", v);
    assert.ok(depth < 0.002, `v=${v.toFixed(3)} 穿入 ${depth.toFixed(4)}`);
  }
});

test("第 212 種:B 走三整格;兩端被擋住時 A 的齒還在槽裡推著 B(507movements 動畫:最後一格走了一部分才停)", () => {
  const [lo, hi] = m212.range;
  const step = (2 * Math.PI) / 5;
  const travel = (m212.stop(lo).b - m212.stop(hi).b) / step;
  assert.ok(travel > 3.2 && travel < 4.8, `B 從一端到另一端走 ${travel.toFixed(2)} 格`);
  for (const end of [lo, hi]) assert.ok(m212.stop(end).engaged, "範圍端 A 的齒在槽裡");
});

test("第 213 種:擋輪只有一段齒,下輪轉到那段齒的盡頭、齒頂到齒頂高度的輪緣就被擋住", () => {
  const { NL, TOOTHED, LIMIT } = m213.geometry;
  const pitch = (2 * Math.PI) / NL;
  // 那段齒有 TOOTHED − 1 個齒槽;下輪的齒走到盡頭的齒槽就頂到輪緣:可轉範圍比「整段齒」少、比「少兩個齒槽」多
  assert.ok(2 * LIMIT > (TOOTHED - 3) * pitch && 2 * LIMIT < (TOOTHED - 1) * pitch, `可轉範圍 ${(2 * LIMIT / pitch).toFixed(2)} 齒`);
  assert.ok(m213.touching(LIMIT + 0.01) && m213.touching(-LIMIT - 0.01), "兩端都是下輪的齒頂到擋輪的輪緣");
  for (const t of sweep(LIMIT, 40, -LIMIT)) assert.ok(!m213.touching(t), "範圍內沒頂到");
  const du = m213.upperAngle(0.1) - m213.upperAngle(0);
  assert.ok(du < 0, "咬合反向");
});

test("第 214 種:兩個齒數不同的齒輪,轉了幾圈後面上的指片相碰而擋住", () => {
  const [lo, hi] = m214.range;
  assert.ok(lo < -2 * Math.PI && hi > 2 * Math.PI, "可轉一圈以上");
  assert.ok(m214.touching(hi + 0.02) && m214.touching(lo - 0.02), "兩端指片相碰");
  for (const t of sweep(hi, 200, lo)) assert.ok(!m214.touching(t), "範圍內不相碰");
});

test("第 215 種:環上的銷每轉一圈把星形輪推過一格(六分之一圈)", () => {
  close(m215.step(2 * Math.PI).b - m215.step(0).b, -(2 * Math.PI) / 6, "每圈一格", 1e-9);
  close(m215.step(2.5).b, m215.step(3.5).b, "鎖住時不動", 1e-12);
});

test("第 215 種:「該擋止裝置的其他變形」:星形輪那一格凸弧轉過來頂到月牙板,環轉到範圍兩端就被擋住", () => {
  const range = m215.default.driver.range;
  assert.ok(range, "主動件有可轉的範圍");
  const [lo, hi] = range;
  const [from, to] = m215.geometry.convexArc;
  for (const [end, dir] of [[lo, -1], [hi, 1]]) {
    assert.ok(genevaContact(m215, "star", end).depth < 0.002, `範圍端 ${end.toFixed(3)} 不穿入`);
    const beyond = genevaContact(m215, "star", end + dir * 0.01);
    assert.ok(beyond.depth > 0.004, `再轉 0.01 就穿入(${beyond.depth.toFixed(4)})`);
    const star = beyond.p.star.angle;
    assert.ok(beyond.angles.length > 0 && beyond.angles.every((t) => onArc(t, from + star, to + star)), "碰到的地方在凸弧上");
  }
  for (const v of sweep(hi, 1200, lo)) {
    const { depth } = genevaContact(m215, "star", v);
    assert.ok(depth < 0.002, `v=${v.toFixed(3)} 穿入 ${depth.toFixed(4)}`);
  }
});

test("第 202 種:沙漏形蝸桿每轉一圈,蝸輪轉過一齒", () => {
  const { N } = m202.geometry;
  close(m202.wheelAngle(2 * Math.PI) - m202.wheelAngle(0), -(2 * Math.PI) / N, "一圈一齒", 1e-12);
});

/**
 * 第 202 種:蝸桿螺紋(tube 附件,沿蝸桿局部 z = 世界 x)在蝸輪中央平面 z = 0、朝蝸輪那一側的截面,
 * 各為 { center(世界 xy), r }。蝸桿的 axis 是 X:局部 (x, y, z) 轉到世界 (z, y, −x)。
 */
function wormSection202(theta) {
  const def = m202.default;
  const worm = def.parts.find((p) => p.id === "worm");
  const angle = def.pose(theta).parts.worm.angle;
  const hits = [];
  for (const tube of worm.pieces.filter((p) => p.kind === "tube")) {
    const world = tube.points.map(([lx, ly, lz]) => {
      const [x, y] = rot2([lx, ly], angle);
      return [worm.center[0] + lz, worm.center[1] + y, worm.center[2] - x];
    });
    for (let i = 1; i < world.length; i++) {
      const [a, b] = [world[i - 1], world[i]];
      if (a[2] * b[2] > 0 || a[2] === b[2] || a[1] < worm.center[1]) continue;
      const f = a[2] / (a[2] - b[2]);
      hits.push({ center: [a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1])], r: tube.radius });
    }
  }
  return hits;
}

test("第 202 種:蝸桿的螺紋是螺旋,蝸輪的齒落在螺紋槽裡——蝸桿轉一圈中螺紋不穿入齒、貼著齒側推齒", () => {
  const def = m202.default;
  const wheel = def.parts.find((p) => p.id === "wheel");
  const local = gearProfile(wheel);
  for (const theta of sweep(2 * Math.PI, 72)) {
    const poly = local.map((p) => rot2(p, def.pose(theta).parts.wheel.angle));
    const ridges = wormSection202(theta);
    assert.ok(ridges.length > 0, "蝸桿有螺紋");
    let snug = Infinity;
    for (const { center, r } of ridges) {
      assert.ok(!pointInPolygon(center, poly), `蝸桿轉 ${theta.toFixed(2)}:螺紋在齒裡`);
      const clear = edgeDistance(center, poly) - r;
      assert.ok(clear > -1e-3, `蝸桿轉 ${theta.toFixed(2)}:螺紋穿入齒 ${(-clear).toFixed(3)}`);
      snug = Math.min(snug, clear);
    }
    assert.ok(snug < 0.02, `蝸桿轉 ${theta.toFixed(2)}:螺紋離齒側 ${snug.toFixed(3)},沒有貼著齒`);
  }
});

test("第 202 種:沙漏形蝸桿包住蝸輪的圓周,同時與好幾個齒咬合(穩定、能傳大力)", () => {
  const def = m202.default;
  const wheel = def.parts.find((p) => p.id === "wheel");
  const { addendum, pitch } = gearSize(wheel.radius, wheel.teeth);
  for (const theta of sweep(2 * Math.PI, 12)) {
    const a = def.pose(theta).parts.wheel.angle;
    // 伸進齒頂圓以內的螺紋,各在哪一個齒槽(以齒槽中心的角度編號)
    const gaps = new Set(
      wormSection202(theta)
        .filter(({ center, r }) => Math.hypot(center[0], center[1]) - r < wheel.radius + addendum - 0.02)
        .map(({ center }) => Math.round((Math.atan2(center[1], center[0]) - a) / pitch - 0.5)),
    );
    assert.ok(gaps.size >= 5, `蝸桿轉 ${theta.toFixed(2)}:只咬到 ${gaps.size} 個齒槽`);
  }
});

test("第 208 種:開槽小齒輪移到三圈銷中的任一圈,得到三種速度(與那一圈的銷數成正比)", () => {
  const speeds = ["outer", "middle", "inner"].map((ring) => Math.abs(m208.pinion(1, ring).angle));
  assert.ok(speeds[0] > speeds[1] && speeds[1] > speeds[2], "外圈最快、內圈最慢");
  close(speeds[0] / speeds[2], m208.rings.outer / m208.rings.inner, "比例 = 銷數比", 1e-12);
});

test("第 216 種:外側與內側缺齒式齒輪交替與小齒輪咬合:一個方向慢、另一個方向快", () => {
  const { RS, RP, RI } = m216.radii;
  const rate = (t) => (m216.pinion(t + 1e-4).angle - m216.pinion(t - 1e-4).angle) / 2e-4;
  // 原圖位置:內側小輪的齒在下方咬合 → 小齒輪與輪反向、較慢
  assert.equal(m216.pinion(0.3).by, "inner");
  close(rate(0.3), -RS / RP, "內側:反向、慢", 1e-6);
  // 轉過半圈:外側大圈的齒在下方 → 同向、較快
  assert.equal(m216.pinion(Math.PI + 0.3).by, "outer");
  close(rate(Math.PI + 0.3), RI / RP, "外側:同向、快", 1e-6);
  assert.ok(RI / RP > RS / RP);
});

test("第 217、218 種:凸柱從 C 到 D 使滾軸後退,從 D 到 e 前進(後退一份、前進兩份);e 到 C 時滾軸不動", () => {
  const states = sweep(1, 1000).map((u) => woolComb(u));
  const rollers = states.map((s) => s.roller);
  const minBack = Math.min(...rollers);
  close(minBack, -WOOL_STEP, "先後退", 1e-9);
  close(Math.max(...rollers) - minBack, 2 * WOOL_STEP, "再前進兩倍", 1e-9);
  close(rollers[rollers.length - 1], WOOL_STEP, "每一循環淨前進一格,卡榫落進下一個凹槽", 1e-9);
  for (const s of states) if (s.stage === "e→C") close(s.roller, WOOL_STEP, "滾軸不動", 1e-12);
});

// 第 217 種凸輪盤的各塊(凸輪在原位):世界中的平面輪廓與深度範圍
function camLayers() {
  const cam = part(fig217, "cam");
  const world = (local) => partPoint(cam.center, cam.axis, 0, [local[0], local[1], 0]).slice(0, 2);
  return cam.pieces.map((p) => {
    const z = partPoint(cam.center, cam.axis, 0, [0, 0, p.at?.[2] ?? 0])[2];
    const half = (p.thickness ?? p.length) / 2;
    const solid = p.shape && { outline: p.shape.outline.map(world), holes: (p.shape.holes ?? []).map((h) => h.map(world)) };
    return { piece: p, z: [z - half, z + half], solid };
  });
}
const inSolid = (pt, s) => pointInPolygon(pt, s.outline) && !(s.holes ?? []).some((h) => pointInPolygon(pt, h));

test("第 217 種:開槽的凸輪盤是一件——溝槽只開到盤的前半厚度,溝底貼在盤背面接住外圈與內島,機架的軸頭伸進輪轂", () => {
  const layers = camLayers();
  const front = layers.filter((l) => l.solid && l.z[0] < 0 && l.z[1] > 0);
  const back = layers.filter((l) => l.solid && front.every((f) => Math.abs(l.z[1] - f.z[0]) < 1e-9));
  assert.ok(front.length === 2 && back.length === 1, "前面一層是外圈與內島,緊貼著背面一片溝底");
  const K = woolGeometry.K;
  for (const g of woolGeometry.groove) {
    const w = [K[0] + g[0], K[1] + g[1]];
    for (const l of front) assert.ok(!inSolid(w, l.solid), "溝槽穿過盤的前半");
    assert.ok(inSolid(w, back[0].solid), "溝底接在溝的下面");
  }
  // 機架的軸頭從軸承座往前伸進凸輪的輪轂
  const hub = layers.find((l) => l.piece.kind === "cylinder" && l.piece.inner);
  const stub = part(fig217, "frame").pieces.find((p) => p.kind === "cylinder" && p.radius === hub.piece.inner && Math.hypot(p.at[0] - K[0], p.at[1] - K[1]) < 1e-9);
  assert.ok(stub.at[2] + stub.length / 2 > hub.z[0] + 0.05, "軸頭伸進輪轂");
});

test("第 217 種:凸柱 A 到 e 時,凸輪盤背面的凸出部分轉到撞擊處,撐到卡榫越過凹槽邊緣(第 218 種)才離開", () => {
  const cam = part(fig217, "cam");
  const layers = camLayers();
  const plate = layers.filter((l) => l.solid);
  const backmost = Math.min(...plate.map((l) => l.z[0]));
  const bump = plate.find((l) => l.z[0] === backmost && plate.every((o) => o === l || o.z[0] >= l.z[1] - 1e-9));
  assert.ok(bump, "凸輪盤背面有凸出部分");
  const { forward, release } = WOOL_PHASE;
  const K = woolGeometry.K;
  // 撞擊處:A 到 e 時 A 所在的徑向線上、凸出部分的半徑處(第 218 種 G 的凸出片在這裡被撞)
  const A = fig217.pose(TAU * forward).parts.stud.position;
  const radii = bump.solid.outline.map((p) => Math.hypot(p[0] - K[0], p[1] - K[1]));
  const r = (Math.max(...radii) + Math.min(...radii)) / 2;
  const dir = Math.atan2(A[1] - K[1], A[0] - K[0]);
  const S = [K[0] + r * Math.cos(dir), K[1] + r * Math.sin(dir)];
  const covers = (u) => {
    const angle = fig217.pose(TAU * u).parts.cam.angle;
    return pointInPolygon(S, bump.piece.shape.outline.map((p) => partPoint(cam.center, cam.axis, angle, [p[0], p[1], 0]).slice(0, 2)));
  };
  assert.ok(!covers(forward - 0.01), "A 到 e 之前還沒轉到");
  for (const u of sweep(release - 0.005, 20, forward + 0.005)) assert.ok(covers(u), `凸輪轉了 ${u.toFixed(3)} 圈:凸出部分在撞擊處`);
  assert.ok(!covers(release + 0.01), "卡榫越過凹槽邊緣後離開");
});

// 第 218 種:卡榫爪尖的銷(往後伸進 F 的那一根)與凹槽輪 F 在姿勢下的平面幾何
function catchOnF(u) {
  const pose = fig218.pose(u).parts;
  const G = part(fig218, "catch");
  const pin = G.pieces.reduce((a, b) => ((b.at?.[2] ?? 0) < (a.at?.[2] ?? 0) ? b : a));
  const at = rot2(pin.at, pose.catch.angle);
  const c = [pose.catch.position[0] + at[0], pose.catch.position[1] + at[1]];
  const F = part(fig218, "wheelF");
  const poly = placeOutline(F.shape.outline, [0, 0], pose.wheelF.angle);
  const RF = Math.max(...F.shape.outline.map((p) => Math.hypot(p[0], p[1])));
  const d = edgeDistance(c, poly);
  const gap = pointInPolygon(c, poly) ? -d - pin.radius : d - pin.radius;
  return { gap, radius: Math.hypot(c[0], c[1]), r: pin.radius, RF, F: pose.wheelF.angle };
}

test("第 218 種:凹槽輪 F 裝在滾軸的軸 H 上,H 跟著 F 轉;槓桿以大於 H 的軸眼套在 H 上", () => {
  const H = part(fig218, "shaftH");
  const angles = sweep(1, 200).map((u) => {
    const p = fig218.pose(u).parts;
    assert.ok(p.shaftH, "H 有姿勢");
    close(p.shaftH.angle, p.wheelF.angle, "H 和 F 一起轉", 1e-12);
    return p.shaftH.angle;
  });
  assert.ok(Math.max(...angles) - Math.min(...angles) > 0.5, "滾軸的軸 H 真的轉");
  const lever = part(fig218, "lever");
  for (const p of lever.kind === "group" ? lever.pieces : [lever]) {
    const off = p.at ?? [0, 0, 0];
    if (p.shape) for (const q of circle(H.radius - 1e-6)) assert.ok(!inSolid([q[0] - off[0], q[1] - off[1]], p.shape), "槓桿的板不壓進 H");
    if (p.kind === "cylinder" && Math.hypot(off[0], off[1]) < 1e-9) assert.ok(p.inner >= H.radius - 1e-9, "軸眼不小於 H");
  }
});

test("第 218 種:A 從 C 到 e 時卡榫的銷落在 F 的凹槽底,把槓桿的擺動傳給 F", () => {
  for (const u of sweep(WOOL_PHASE.forward - 0.005, 120)) {
    const s = catchOnF(u);
    assert.ok(Math.abs(s.gap) < 0.01, `凸輪轉了 ${u.toFixed(3)} 圈:銷靠在凹槽底(間隙 ${s.gap.toFixed(4)})`);
    assert.ok(s.radius < s.RF, "銷在凹槽裡");
  }
});

test("第 218 種:A 到 e 時凸出部分撞擊 G 上的凸出片,把卡榫抬出凹槽;e 到 C 期間卡榫靠自重壓在 F 的光面上滑過,F 不動", () => {
  const { lift, release, ret } = WOOL_PHASE;
  const lifted = catchOnF(lift);
  assert.ok(lifted.radius - lifted.r > lifted.RF, "抬出凹槽");
  const after = sweep(ret - 0.06, 120, release);
  let resting = 0;
  for (const u of after) {
    const s = catchOnF(u);
    close(s.F, lifted.F, "F 不動", 1e-12);
    assert.ok(s.radius > s.RF, `凸輪轉了 ${u.toFixed(3)} 圈:卡榫不落回剛離開的凹槽`);
    if (Math.abs(s.gap) < 0.01) resting++;
  }
  assert.ok(resting / after.length > 0.8, `大半時間壓在光面上(${resting}/${after.length})`);
});

test("第 218 種:A 回到 C 時卡榫已落入下一個凹槽,F 前進一格;落下有加速過程", () => {
  const start = catchOnF(0);
  const end = catchOnF(1);
  assert.ok(end.radius < end.RF && Math.abs(end.gap) < 0.01, "落在凹槽底");
  close(Math.abs(end.F - start.F), WOOL_STEP, "F 前進一格", 1e-9);
  const falling = sweep(1, 400, WOOL_PHASE.ret - 0.1).map(catchOnF).filter((s) => s.radius < s.RF + s.r - 0.03 && s.radius > end.radius + 0.03);
  assert.ok(falling.length >= 2, "落下途中有中間的位置,不是一瞬間");
});

test("第 218 種:卡榫的銷全程不穿進 F", () => {
  for (const u of sweep(2, 2000)) {
    const s = catchOnF(u);
    assert.ok(s.gap > -0.004, `凸輪轉了 ${u.toFixed(3)} 圈:穿入 ${(-s.gap).toFixed(4)}`);
  }
});

test("第 219 種:冠狀輪偏心,與小齒輪接觸處的相對半徑一直在變,小齒輪的轉速也跟著變", () => {
  const { R, E, RP } = m219.geometry;
  const radii = sweep(2 * Math.PI, 360).map(m219.contactRadius);
  close(Math.max(...radii), R + E, "最遠", 1e-3);
  close(Math.min(...radii), R - E, "最近", 1e-3);
  const rate = (t) => Math.abs(m219.pinionAngle(t + 1e-4) - m219.pinionAngle(t - 1e-4)) / 2e-4;
  const rates = sweep(2 * Math.PI, 72).map(rate);
  close(Math.max(...rates) / Math.min(...rates), (R + E) / (R - E), "快慢比 = 半徑比", 0.01);
  assert.ok(RP > 0);
});

test("第 220 種:腕銷在開槽曲柄的槽內作動,離後者軸心的距離一直在變,所以等速轉動傳成變速轉動", () => {
  const { SLOT } = m220.geometry;
  const states = sweep(2 * Math.PI, 720).map((t) => m220.cranks(t));
  for (const s of states) assert.ok(s.along > SLOT.from && s.along < SLOT.to, "腕銷一直在槽內");
  const angles = states.map((s) => s.angle);
  const steps = angles.slice(1).map((a, i) => Math.abs(Math.atan2(Math.sin(a - angles[i]), Math.cos(a - angles[i]))));
  assert.ok(Math.max(...steps) / Math.min(...steps) > 2, "變速");
  close(steps.reduce((x, y) => x + y, 0), 2 * Math.PI, "開槽曲柄也轉一整圈", 1e-6);
});

test("第 223 種:兩對扇形輪流咬合,下軸一快一慢;上軸一圈時下軸也是一圈", () => {
  const { K, SPAN_A } = m223.geometry;
  const rate = (t) => (m223.sectors(t + 1e-4).lower - m223.sectors(t - 1e-4).lower) / 2e-4;
  close(rate(SPAN_A / 2), -K, "大扇形帶小扇形:快", 1e-6);
  close(rate(SPAN_A + 0.5), -1 / K, "小扇形帶大扇形:慢", 1e-6);
  close(m223.sectors(2 * Math.PI).lower, -2 * Math.PI, "一圈對一圈", 1e-9);
});

test("第 224 種:轉動小齒輪 d,輪 c 經曲線槽把凸柱往外或往內推,皮帶輪變大或變小", () => {
  const [lo, hi] = m224.range;
  const small = m224.expand(lo);
  const big = m224.expand(hi);
  assert.ok(big.rim > small.rim + 0.3, "轉一個方向變大");
  assert.ok(Math.sign(big.c - small.c) !== Math.sign(hi - lo), "c 與 d 反向轉");
  const rims = sweep(hi, 50, lo).map((a) => m224.expand(a).rim);
  for (let i = 1; i < rims.length; i++) assert.ok(rims[i] > rims[i - 1], "連續地變大");
});
