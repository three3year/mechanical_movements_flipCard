// 第十四章「擺與鐘錶調節」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, assertWeightDrive, assertMeshFree, plateLayers } from "./helpers.js";

import * as m315 from "../models/fig315.js";
import * as m316 from "../models/fig316.js";
import * as m317 from "../models/fig317.js";
import * as m318 from "../models/fig318.js";
import * as m319 from "../models/fig319.js";
import * as m320 from "../models/fig320.js";
import * as m321 from "../models/fig321.js";
import { dist, add, quatRotate, rot2 } from "../models/kit.js";
import { pointInPolygon } from "../models/contact.js";

test("第 315 種:錐形擺:擺錘作圓周運動,擺桿在旋轉時描繪出一個圓錐形", () => {
  const { TOP, L } = m315.geometry;
  const ys = new Set();
  for (const p of sweep(1, 24)) {
    const { bob } = m315.conical(p);
    close(dist(bob, TOP), L, "懸點到擺錘中心的距離不變", 1e-9);
    ys.add(bob[1].toFixed(9));
    close(Math.hypot(bob[0], bob[2]), L * Math.sin(m315.CONE), "繞心軸作圓周運動", 1e-9);
  }
  assert.equal(ys.size, 1, "擺錘高度不變(圓錐)");
});

test("第 315 種:錐形擺由一段細圓線所懸掛:懸掛座下一小段細線,接一根剛性的擺桿穿過擺錘、下端伸出成尖銷", () => {
  const def = m315.default;
  const { TOP, BOB } = m315.geometry;
  const wire = part(def, "wire");
  const rod = part(def, "bob").pieces.find((q) => q.kind === "cylinder" && q.length > 3); // 擺桿(擺錘的局部 z 沿擺桿)
  assert.ok(wire && rod, "有細線,也有擺桿");
  assert.ok(rod.radius > wire.radius, "擺桿比細線粗");
  assert.ok(rod.at[2] + rod.length / 2 > BOB.half + 0.2, "擺桿下端伸出擺錘底下,成為臂推的尖銷");
  for (const p of sweep(1, 12)) {
    const pose = def.pose(p);
    const pts = pose.paths.wire.points;
    close(dist(pts[0], TOP), 0, "細線從懸掛座垂下", 1e-9);
    const short = dist(pts[0], pts.at(-1));
    assert.ok(short > 0.2 && short < 0.6, `一小段細線(實際 ${short.toFixed(2)})`);
    const { position, rotation } = pose.parts.bob;
    const at = (z) => add(position, quatRotate(rotation, [0, 0, z]));
    const top = at(rod.at[2] - rod.length / 2);
    const low = at(rod.at[2] + rod.length / 2);
    close(dist(top, pts.at(-1)), 0, "擺桿上端接在細線下端", 1e-9);
    close(dist(TOP, top) + dist(top, low), dist(TOP, low), "細線與擺桿在同一直線上(由懸點斜下)", 1e-9);
  }
});

test("第 315 種:心軸下端削尖、立在固定的軸尖座上,中段穿過固定的板(軸承)", () => {
  const def = m315.default;
  const spindle = part(def, "spindle");
  const frame = part(def, "frame");
  assert.ok(frame && !def.pose(0).parts.frame, "機架是固定件");
  const cy = spindle.center[1];
  const span = (q) => [cy + q.at[2] - q.length / 2, cy + q.at[2] + q.length / 2]; // 心軸的軸是 y:局部 z = 世界 y
  const rods = spindle.pieces.filter((q) => q.kind === "cylinder");
  const tip = rods.reduce((a, b) => (span(b)[0] < span(a)[0] ? b : a));
  assert.ok(tip.axis?.[2] < 0 && (tip.radiusEnd ?? tip.radius) < tip.radius * 0.3, "最下面一塊是朝下的錐尖");
  const bottom = span(tip)[0];
  const boxes = frame.pieces.filter((q) => q.kind === "box").map((q) => ({ lo: q.at.map((c, i) => c - q.size[i] / 2), hi: q.at.map((c, i) => c + q.size[i] / 2) }));
  const under = boxes.filter((b) => b.lo[0] < 0 && b.hi[0] > 0 && b.lo[2] < 0 && b.hi[2] > 0 && b.hi[1] <= bottom + 1e-9);
  const seat = under.reduce((a, b) => (b.hi[1] > a.hi[1] ? b : a));
  close(seat.hi[1], bottom, "錐尖立在軸尖座的頂面", 1e-9);
  const shaft = rods.reduce((a, b) => (b.length > a.length ? b : a));
  const [lo, hi] = span(shaft);
  const bearing = frame.pieces.find((q) => q.kind === "cylinder" && q.inner && q.axis?.[1] === 1 && Math.hypot(q.at[0], q.at[2]) < 1e-9);
  assert.ok(bearing, "有套著心軸的軸承");
  close(bearing.inner, shaft.radius, "軸承的孔貼著心軸", 1e-9);
  assert.ok(bearing.at[1] - bearing.length / 2 > lo && bearing.at[1] + bearing.length / 2 < hi, "心軸穿過軸承");
});

test("第 315 種:心軸底下的傘齒輪(上寬下窄,照原圖)由水平軸上一樣大的傘齒輪帶動:兩軸線相交,咬合處兩輪的齒面同速", () => {
  const def = m315.default;
  const spindle = part(def, "spindle");
  const arbor = part(def, "arbor");
  const bs = spindle.pieces.find((q) => q.kind === "bevel");
  const ba = arbor.pieces.find((q) => q.kind === "bevel");
  assert.ok(bs && ba, "兩個傘齒輪");
  close(bs.radius, ba.radius, "兩輪一樣大", 1e-9);
  assert.deepEqual(arbor.axis, [1, 0, 0], "另一輪在水平軸上");
  close(arbor.center[2], 0, "水平軸線和心軸相交", 1e-9);
  const Q = [0, arbor.center[1], 0]; // 兩軸線的交點
  const cs = [0, spindle.center[1] + bs.at[2], 0];
  const ca = [arbor.center[0] + ba.at[2], arbor.center[1], 0];
  close(dist(cs, Q), dist(ca, Q), "兩輪離軸線交點一樣遠(錐頂相同)", 1e-9);
  assert.ok(Q[1] < cs[1] && bs.axis[2] < 0, "心軸的傘齒輪錐頂朝下:上寬下窄");
  assert.ok(ca[0] < Q[0] && ba.axis[2] > 0, "水平軸的傘齒輪錐頂朝心軸");
  // 咬合處:兩錐公共母線上的一點 P = Q + s(−1, 1, 0);心軸繞 +y、水平軸繞 +x,兩輪在 P 的速度都只有 z 分量
  const s = 0.25;
  const h = 1e-4;
  for (const p of sweep(2, 16)) {
    const a = def.pose(p).parts;
    const b = def.pose(p + h).parts;
    const vs = ((b.spindle.angle - a.spindle.angle) / h) * s; // (ωy ŷ) × (−s, ·, 0) 的 z 分量
    const va = ((b.arbor.angle - a.arbor.angle) / h) * s; // (ωx x̂) × (−s, s, 0) 的 z 分量
    close(va, vs, `進程 ${p.toFixed(2)}:咬合處齒面同速`, 1e-6);
    assert.ok(vs > 0, "心軸照原來的方向轉(俯視逆時針)");
  }
});

test("第 315 種:推斷的重錘驅動——水平軸上的鼓放出繩吊著重錘,重錘隨輪系下降,降到底捲回", () => {
  const { DRUM, REWIND } = m315.geometry;
  assertWeightDrive(m315.default, { drum: DRUM, wheel: m315.arborAngle, period: 1, every: REWIND });
});

test("第 315 種:錐形擺:心軸上的臂從後面推著擺錘底下的尖銷走", () => {
  const { TOP, PIN_R, LAG, ARM_Y } = m315.geometry;
  for (const p of sweep(1, 12)) {
    const { spindle, bob, dir } = m315.conical(p);
    close(dist(bob, TOP), m315.geometry.L, "擺錘順著擺桿", 1e-9);
    // 尖銷的軸線在搖臂那一高度的位置:和心軸同一個方位(搖臂落後它 LAG,側面貼著銷)
    const k = (ARM_Y - TOP[1]) / dir[1];
    const at = [TOP[0] + k * dir[0], TOP[2] + k * dir[2]];
    close(Math.hypot(...at), PIN_R, "尖銷在搖臂的長度之內", 1e-9);
    close(Math.atan2(-at[1], at[0]), Math.atan2(Math.sin(spindle), Math.cos(spindle)), "尖銷和心軸同轉", 1e-9);
  }
  assert.ok(LAG > 0, "搖臂在尖銷後面(心軸逆時針轉)");
});

test("第 316 種:水銀補償擺:擺桿受熱伸長時水銀柱升高,重心(擺動中心)始終在同一位置", () => {
  const c = sweep(40, 10, -10).map((t) => m316.compensation(t));
  assert.ok(c[c.length - 1].rod > c[0].rod && c[c.length - 1].level > c[0].level, "變暖:擺桿伸長、水銀升高");
  for (const x of c) close(x.center, c[0].center, "擺的有效長度不變", 1e-9);
});

test("第 316 種:水銀玻璃瓶照原圖夾在瓶頸的蓋上:蓋板壓在瓶口凸緣頂面、兩側螺絲頂著凸緣外緣,擺桿穿過蓋子中心", () => {
  const def = m316.default;
  const { FLANGE } = m316.geometry;
  const jar = part(def, "jar");
  const glass = jar.pieces.find((q) => q.kind === "lathe");
  const r = (y) => glass.profile.filter(([, z]) => Math.abs(z - y) < 1e-9).map(([x]) => x);
  assert.ok(r(FLANGE.top).includes(FLANGE.r) && r(FLANGE.bottom).includes(FLANGE.r), "瓶口有凸緣");
  assert.ok(Math.max(...glass.profile.map(([x]) => x)) > FLANGE.r + 0.1, "瓶頸比瓶身細");
  const screws = jar.pieces.filter((q) => q.kind === "cylinder" && q.axis?.[0] === 1);
  assert.equal(screws.length, 2, "兩側各一顆螺絲");
  for (const q of screws) {
    close(Math.abs(q.at[0]) - q.length / 2, FLANGE.r, "螺絲的尖端頂著凸緣外緣", 1e-9);
    assert.ok(q.at[1] > FLANGE.bottom && q.at[1] < FLANGE.top, "螺絲在凸緣的高度");
  }
  const cap = jar.pieces.find((q) => q.kind === "box" && Math.abs(q.at[0]) < 1e-9 && q.at[1] - q.size[1] / 2 > FLANGE.top - 1e-9);
  assert.ok(cap, "蓋板在瓶口上方、擺桿的正上方");
  close(cap.at[1] - cap.size[1] / 2, FLANGE.top, "蓋板壓在凸緣頂面", 1e-9);
  assert.ok(cap.size[0] / 2 > FLANGE.r, "蓋板蓋過凸緣");
  const rod = part(def, "rod");
  for (const t of sweep(40, 10, -10)) {
    const pose = def.pose(t).parts;
    const y0 = pose.jar.position[1];
    const len = rod.length * pose.rod.scale[2];
    assert.ok(pose.rod.position[1] + len / 2 > y0 + cap.at[1] + cap.size[1] / 2 && pose.rod.position[1] - len / 2 < y0 + cap.at[1] - cap.size[1] / 2, "擺桿穿過蓋子");
  }
});

test("第 316、317 種:擺桿上端吊在懸掛座上(相接、不留空隙)", () => {
  for (const m of [m316, m317]) {
    const def = m.default;
    const support = part(def, "support");
    const rod = part(def, "rod");
    const bottom = support.center[1] - support.size[1] / 2;
    for (const t of sweep(40, 10, -10)) {
      const pose = def.pose(t).parts.rod;
      close(pose.position[1] + (rod.length * pose.scale[2]) / 2, bottom, `第 ${def.figure} 種 ${t} °C:擺桿上端貼著懸掛座`, 1e-9);
    }
  }
});

test("第 316 種:擺動中心始終保持在同一位置:畫面上固定的刻線標出它,水銀的重心一直在刻線的高度", () => {
  const def = m316.default;
  const fill = part(def, "mercury");
  const values = new Set();
  const marks = new Set();
  for (const t of sweep(40, 10, -10)) {
    const pose = def.pose(t);
    const m = pose.parts.mercury;
    const cg = m.position[1] - fill.size[1] / 2 + (m.level * fill.size[1]) / 2;
    const mark = pose.paths.centerMark.points;
    for (const pt of mark) close(pt[1], cg, `${t} °C:水銀重心在刻線的高度`, 1e-9);
    marks.add(JSON.stringify(mark));
    values.add(pose.readouts.find((r) => r.label.includes("擺動中心")).value);
  }
  assert.equal(marks.size, 1, "刻線固定不動");
  assert.equal(values.size, 1, "讀數「擺動中心」不變");
});

test("第 317 種:複合桿補償擺:變暖時複合桿向上彎曲,帶著重物 W 升高,抵消擺桿的伸長", () => {
  const cold = m317.compound(0);
  const warm = m317.compound(35);
  assert.ok(warm.rise > cold.rise, "變暖時 W 升高");
  assert.ok(warm.rod > cold.rod, "擺桿伸長");
  close(warm.center, cold.center, "擺動中心不變", 1e-9);
});

// 第 317 種姿勢裡各零件的高度:M 的頂面與底面、螺帽、C 兩層的中點、凸台底面、擺桿兩端
function stack317(t) {
  const def = m317.default;
  const pose = def.pose(t);
  const bobDef = part(def, "bob");
  const lathe = bobDef.pieces.find((q) => q.kind === "lathe");
  const y = pose.parts.bob.position[1];
  const nut = part(def, "nut").pieces.find((q) => q.kind === "box");
  const hub = part(def, "hubC").pieces.find((q) => q.kind === "lathe");
  const rod = part(def, "rod");
  const len = rod.length * pose.parts.rod.scale[2];
  // 每一層在中央(擺桿穿過的孔壁)的高度:左右兩段的內端
  const mid = (id) => Math.max(pose.paths[`${id}L`].points[0][1], pose.paths[`${id}R`].points[0][1]);
  return {
    pose,
    mTop: y + Math.max(...lathe.profile.map(([, z]) => z)),
    mBottom: y + Math.min(...lathe.profile.map(([, z]) => z)),
    nutTop: pose.parts.nut.position[1] + nut.at[1] + nut.size[1] / 2,
    nutBottom: pose.parts.nut.position[1] + nut.at[1] - nut.size[1] / 2,
    hubBottom: pose.parts.hubC.position[1] + Math.min(...hub.profile.map(([, z]) => z)),
    steel: mid("steel"),
    brass: mid("brass"),
    holeX: Math.abs(pose.paths.steelR.points[0][0]),
    rSteel: part(def, "steelR").radius,
    rBrass: part(def, "brassR").radius,
    rRod: rod.radius,
    rodTop: pose.parts.rod.position[1] + len / 2,
    rodBottom: pose.parts.rod.position[1] - len / 2,
  };
}

test("第 317 種:擺桿穿過 C 中央的凸台與 M,下端的螺帽托住 M;凸台固定在擺桿上,把 C 壓在 M 的頂面", () => {
  for (const t of sweep(40, 10, -10)) {
    const s = stack317(t);
    close(s.nutTop, s.mBottom, `${t} °C:螺帽托住 M 的底面`, 1e-9);
    close(s.rodBottom, s.nutBottom, `${t} °C:擺桿下端穿到螺帽底`, 1e-9);
    assert.ok(s.rodTop > s.hubBottom && s.rodBottom < s.mBottom, "擺桿穿過凸台、C 與 M");
    // C 中央有孔讓擺桿穿過:兩段的內端在擺桿表面(端面垂直於桿,斜過孔壁不到 0.005);孔邊離中點 0.1,C 在那裡的彎曲量也不到 0.005
    close(s.holeX, s.rRod, `${t} °C:C 的孔壁貼著擺桿`, 0.005);
    close(s.brass - s.rBrass, s.mTop, `${t} °C:C 的下緣貼著 M 的頂面`, 0.005);
    close(s.steel + s.rSteel, s.hubBottom, `${t} °C:凸台壓著 C 的上緣`, 0.005);
  }
});

test("第 317 種:C 是黃銅與鐵焊接在一起、黃銅朝下的複合桿:兩層一起彎,黃銅在下", () => {
  const def = m317.default;
  for (const side of ["L", "R"]) {
    assert.equal(part(def, `brass${side}`).metal, "brass", "黃銅那一層畫成黃銅色");
    assert.equal(part(def, `steel${side}`).metal, undefined, "鐵(鋼)那一層是一般的顏色");
  }
  const rs = part(def, "steelR").radius + part(def, "brassR").radius;
  for (const t of sweep(40, 10, -10)) {
    const paths = def.pose(t).paths;
    for (const side of ["L", "R"]) {
      const steel = paths[`steel${side}`].points;
      const brass = paths[`brass${side}`].points;
      assert.equal(steel.length, brass.length);
      steel.forEach((p, i) => {
        const q = brass[i];
        assert.ok(q[1] < p[1], `${t} °C:黃銅朝下`);
        close(dist(p, q), rs, `${t} °C:兩層貼在一起(焊接)`, 1e-9);
      });
    }
  }
});

test("第 317 種:C 穿過兩個 W,桿端露在 W 外;W 隨 C 的彎曲升降", () => {
  const def = m317.default;
  const { XW, W_HALF } = m317.geometry;
  for (const t of sweep(40, 10, -10)) {
    const pose = def.pose(t);
    const half = (side) => pose.paths[`steel${side}`].points.map((p, i) => p.map((c, k) => (c + pose.paths[`brass${side}`].points[i][k]) / 2)); // 兩層的交界
    const center = [...half("L"), ...half("R")];
    const ends = [Math.min(...center.map((p) => p[0])), Math.max(...center.map((p) => p[0]))];
    for (const [id, sign] of [["weightL", -1], ["weightR", 1]]) {
      const w = pose.parts[id].position;
      close(Math.abs(w[0]), XW, "W 在 C 上的位置", 1e-9);
      const near = center.reduce((a, b) => (Math.abs(b[0] - w[0]) < Math.abs(a[0] - w[0]) ? b : a));
      close(near[0], w[0], "C 的取樣點落在 W 的中心", 1e-9);
      close(near[1], w[1], `${t} °C:C 穿過 W 的中心`, 1e-9);
      assert.ok(sign * ends[sign > 0 ? 1 : 0] > XW + W_HALF + 0.05, "桿端露在 W 外");
    }
  }
});

test("第 317 種:擺動中心不變:畫面上固定的刻線標出它,M 與兩個 W 的總重心一直在刻線的高度", () => {
  const def = m317.default;
  const { MASS, M_DROP } = m317.geometry;
  const marks = new Set();
  const values = new Set();
  for (const t of sweep(40, 10, -10)) {
    const pose = def.pose(t);
    const { bob, weightL, weightR } = pose.parts;
    const cg = (MASS.M * (bob.position[1] - M_DROP) + MASS.W * (weightL.position[1] + weightR.position[1])) / (MASS.M + 2 * MASS.W);
    const mark = pose.paths.centerMark.points;
    for (const pt of mark) close(pt[1], cg, `${t} °C:總重心在刻線的高度`, 1e-9);
    marks.add(JSON.stringify(mark));
    values.add(pose.readouts.find((r) => r.label.includes("擺動中心")).value);
  }
  assert.equal(marks.size, 1, "刻線固定不動");
  assert.equal(values.size, 1, "讀數「擺動中心」不變");
});

test("第 318 種:錶的調節器:槓桿往右(FAST)時游絲的作用長度變短,往左(SLOW)時變長", () => {
  const [slow, fast] = m318.RANGE;
  assert.ok(m318.regulator(fast).active < m318.regulator(0).active, "往右:變短(擺得變快)");
  assert.ok(m318.regulator(slow).active > m318.regulator(0).active, "往左:變長");
});

// 第 318 種:槓桿上的兩根制動插梢在世界中的位置(槓桿繞 z 轉)
const rotZ = ([x, y, z], a) => [...rot2([x, y], a), z];
function pins318(v) {
  const def = m318.default;
  const a = def.pose(v).parts.lever.angle;
  return part(def, "lever")
    .pieces.filter((q) => q.kind === "cylinder")
    .map((q) => ({ c: rotZ(q.at, a), r: q.radius, z0: q.at[2] - q.length / 2, z1: q.at[2] + q.length / 2 }))
    .sort((p, q) => Math.hypot(p.c[0], p.c[1]) - Math.hypot(q.c[0], q.c[1]));
}
/** 折線上離 p 最近的點(只看 xy 平面) */
function nearest(pts, p) {
  let best = { d: Infinity };
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    const ab = [b[0] - a[0], b[1] - a[1]];
    const l2 = ab[0] ** 2 + ab[1] ** 2 || 1;
    const s = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2));
    const q = [a[0] + s * ab[0], a[1] + s * ab[1], a[2] + s * (b[2] - a[2])];
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < best.d) best = { d, p: q };
  }
  return best;
}
const polyLength = (pts) => pts.slice(1).reduce((s, p, i) => s + dist(p, pts[i]), 0);
const readNumber = (pose, key) => Number.parseFloat(pose.readouts.find((r) => r.label.includes(key)).value.replace("−", "-"));

test("第 318 種:游絲穿在槓桿的兩根制動插梢之間:一內一外夾著游絲(兩側都貼著、不穿入),槓桿走滿全程都夾得住", () => {
  const def = m318.default;
  const wire = part(def, "spring").radius;
  for (const v of sweep(m318.RANGE[1], 12, m318.RANGE[0])) {
    const spring = def.pose(v).paths.spring.points;
    const pins = pins318(v);
    assert.equal(pins.length, 2, "兩根制動插梢");
    for (const pin of pins) {
      const n = nearest(spring, pin.c);
      close(n.d - wire - pin.r, 0, `槓桿 ${v.toFixed(2)}:插梢貼著游絲`, 0.002);
      assert.ok(pin.z0 < n.p[2] - wire && pin.z1 > n.p[2] + wire, "插梢跨過游絲的整個粗細");
    }
    // 游絲從兩根插梢中間穿過:最近的那一段在內插梢的外側、外插梢的內側
    const [inner, outer] = pins;
    const r = Math.hypot(...nearest(spring, inner.c).p.slice(0, 2));
    assert.ok(Math.hypot(inner.c[0], inner.c[1]) < r && r < Math.hypot(outer.c[0], outer.c[1]), `槓桿 ${v.toFixed(2)}:游絲在兩根插梢之間`);
  }
});

test("第 318 種:游絲內端固定在擺輪軸上(軸上的套圈),外端固定在凸柱 R 上(穿進 R 的孔)", () => {
  const def = m318.default;
  const wire = part(def, "spring").radius;
  const pts = def.pose(0).paths.spring.points;
  const inner = pts.at(-1);
  const collet = part(def, "balance").pieces.find((q) => q.kind === "cylinder" && Math.abs((q.at?.[2] ?? 0) - inner[2]) < q.length / 2);
  assert.ok(collet, "擺輪軸上在游絲那一層有套圈");
  close(Math.hypot(inner[0], inner[1]), collet.radius + wire, "內端貼著套圈", 1e-9);
  // 外端:R 是一塊沿游絲走向(y)開了孔的板,游絲的末段沿孔的軸線穿進去
  const stud = part(def, "studR");
  const body = stud.pieces[0];
  assert.deepEqual(body.axis, [0, 1, 0], "R 的孔沿 y");
  const hole = body.shape.holes[0];
  close(Math.max(...hole.map(([x, y]) => Math.hypot(x, y))), wire, "孔的半徑等於游絲的粗細", 1e-9);
  const [y0, y1] = [stud.center[1] - body.thickness / 2, stud.center[1] + body.thickness / 2];
  const inside = pts.filter((p) => p[1] >= y0 - 1e-9 && p[1] <= y1 + 1e-9 && Math.abs(p[0] - stud.center[0]) < Math.max(...body.shape.outline.map(([x]) => x)));
  assert.ok(inside.length >= 2 && inside.includes(pts[0]), "外端在 R 裡面");
  for (const p of inside) {
    close(p[0], stud.center[0], "沿孔的軸線(x)", 1e-9);
    close(p[2], stud.center[2], "沿孔的軸線(z)", 1e-9);
  }
});

test("第 318 種:制動插梢 P 照原圖裝在指針那一支臂的根部(游絲外圈正下方),插梢頂露在槓桿正面,標籤 P 跟著插梢", () => {
  const def = m318.default;
  const leverFront = Math.max(...plateLayers(part(def, "lever")).map((l) => l.z1));
  for (const v of sweep(m318.RANGE[1], 6, m318.RANGE[0])) {
    const pose = def.pose(v);
    const a = pose.parts.lever.angle; // 指針沿槓桿的局部 +x
    const pins = pins318(v);
    for (const pin of pins) {
      close(Math.atan2(pin.c[1], pin.c[0]), Math.atan2(Math.sin(a), Math.cos(a)), "插梢在指針那一側", 1e-9);
      assert.ok(pin.z1 > leverFront + 0.01, "插梢頂露出槓桿正面(正面看得到)");
    }
    const mid = pins[0].c.map((c, i) => (c + pins[1].c[i]) / 2);
    const label = pose.parts.labelP.position;
    assert.ok(Math.hypot(label[0] - mid[0], label[1] - mid[1]) < 0.3, `槓桿 ${v.toFixed(2)}:標籤 P 在插梢旁`);
  }
  close(Math.atan2(pins318(0)[0].c[1], pins318(0)[0].c[0]), -Math.PI / 2, "槓桿在中間時插梢在正下方", 1e-9);
});

test("第 318 種:槓桿往右推,游絲的實際作用長度縮短,擺輪擺得變快;紅線標出作用的一段(從內端到插梢),讀數跟著變", () => {
  const def = m318.default;
  const vs = sweep(m318.RANGE[1], 8, m318.RANGE[0]);
  const lengths = vs.map((v) => readNumber(def.pose(v), "作用長度"));
  const rates = vs.map((v) => readNumber(def.pose(v), "快慢"));
  for (let i = 1; i < vs.length; i++) {
    assert.ok(lengths[i] < lengths[i - 1], "往右:作用長度變短");
    assert.ok(rates[i] > rates[i - 1], "往右:擺得變快");
  }
  close(readNumber(def.pose(0), "快慢"), 0, "中間時是基準", 1e-9);
  const l0 = m318.regulator(0).active;
  for (const v of vs) {
    const pose = def.pose(v);
    const mark = pose.paths.activeMark.points;
    const spring = pose.paths.spring.points;
    assert.deepEqual(mark[0], spring.at(-1), "紅線從游絲內端開始");
    const pins = pins318(v);
    const mid = pins[0].c.map((c, i) => (c + pins[1].c[i]) / 2);
    assert.ok(Math.hypot(mark.at(-1)[0] - mid[0], mark.at(-1)[1] - mid[1]) < 0.005, "紅線停在兩根插梢之間");
    close(readNumber(pose, "作用長度"), polyLength(mark), "讀數是紅線的長度", 0.006);
    // 游絲的剛性與作用長度成反比,擺動的快慢與剛性的平方根成正比
    close(1 + readNumber(pose, "快慢") / 100, Math.sqrt(l0 / m318.regulator(v).active), "快慢與作用長度的平方根成反比", 0.0006);
  }
});

test("第 318 種:擺輪軸兩端進夾板的軸承;槓桿中央的轂套在與擺輪軸同心的固定環上;凸柱 R 立在夾板上", () => {
  const def = m318.default;
  const frame = plateLayers(part(def, "plate"));
  const rmax = (loop) => Math.max(...loop.map(([x, y]) => Math.hypot(x, y)));
  const rmin = (loop) => Math.min(...loop.map(([x, y]) => Math.hypot(x, y)));
  const staff = part(def, "balance").pieces.filter((q) => q.kind === "cylinder").reduce((a, b) => (a.length >= b.length ? a : b));
  const z0 = (staff.at?.[2] ?? 0) - staff.length / 2;
  const z1 = (staff.at?.[2] ?? 0) + staff.length / 2;
  // 軸承:夾板上以擺輪軸為中心、孔徑等於軸徑的孔
  const bearings = frame.filter((l) => l.solid.holes.some((h) => Math.abs(rmax(h) - staff.radius) < 1e-9 && Math.abs(rmin(h) - staff.radius) < 1e-9));
  assert.ok(bearings.some((b) => b.z0 <= z0 + 1e-9 && z0 < b.z1), "擺輪軸後端在後夾板的軸承裡");
  assert.ok(bearings.some((b) => b.z0 < z1 && z1 <= b.z1 + 1e-9), "擺輪軸前端在前夾板(固定環)的軸承裡");
  // 槓桿的轂:中央的孔套在固定環外圈上,同一個深度
  const lever = plateLayers(part(def, "lever"));
  const hub = lever.find((l) => l.solid.holes.length && rmax(l.solid.holes[0]) < 0.6);
  assert.ok(hub, "槓桿中央有轂");
  const ringR = rmax(hub.solid.holes[0]);
  const ring = frame.find((l) => Math.abs(rmax(l.solid.outline) - ringR) < 1e-9 && Math.abs(rmin(l.solid.outline) - ringR) < 1e-9);
  assert.ok(ring, "固定環的外圈等於轂的孔");
  assert.ok(Math.min(ring.z1, hub.z1) - Math.max(ring.z0, hub.z0) > 0.03, "轂和固定環在同一個深度");
  // R 穿過夾板上剛好容得下它的方孔(板的形狀座標 y 對到 −z)
  const stud = part(def, "studR");
  const body = stud.pieces[0];
  const zs = body.shape.outline.map(([, y]) => stud.center[2] - y);
  const xs = body.shape.outline.map(([x]) => stud.center[0] + x);
  const ys = [stud.center[1] - body.thickness / 2, stud.center[1] + body.thickness / 2];
  const holder = frame.find((l) => l.solid.holes.some((h) => pointInPolygon([stud.center[0], stud.center[1]], h)));
  assert.ok(holder && Math.min(...zs) < holder.z0 && Math.max(...zs) > holder.z1, "R 穿過夾板");
  const hole = holder.solid.holes.find((h) => pointInPolygon([stud.center[0], stud.center[1]], h));
  close(Math.min(...hole.map(([x]) => x)), Math.min(...xs), "方孔貼著 R(x)", 1e-9);
  close(Math.max(...hole.map(([x]) => x)), Math.max(...xs), "方孔貼著 R(x)", 1e-9);
  close(Math.min(...hole.map(([, y]) => y)), ys[0], "方孔貼著 R(y)", 1e-9);
  close(Math.max(...hole.map(([, y]) => y)), ys[1], "方孔貼著 R(y)", 1e-9);
});

test("第 319 種:補償擺輪:溫度升高時複合桿向內彎,配重往內移", () => {
  for (const s of [1, -1]) {
    const hot = m319.rim(40, s).weightRadius;
    const cold = m319.rim(-10, s).weightRadius;
    assert.ok(hot < cold, "升溫時配重較靠內");
  }
});

test("第 319 種:t 與 t' 是外側黃銅、內側鋼的複合弧桿:兩層貼在一起、一起彎,黃銅在外", () => {
  const def = m319.default;
  for (const side of ["L", "R"]) {
    assert.equal(part(def, `brass${side}`).metal, "brass", "黃銅那一層畫成黃銅色");
    assert.equal(part(def, `steel${side}`).metal, undefined, "鋼那一層是一般的顏色");
  }
  const rs = part(def, "steelR").radius + part(def, "brassR").radius;
  for (const t of sweep(40, 10, -10)) {
    const paths = def.pose(t).paths;
    for (const side of ["L", "R"]) {
      const steel = paths[`steel${side}`].points;
      const brass = paths[`brass${side}`].points;
      assert.equal(steel.length, brass.length);
      steel.forEach((p, i) => {
        const q = brass[i];
        assert.ok(Math.hypot(q[0], q[1]) > Math.hypot(p[0], p[1]), `${t} °C:黃銅在外側`);
        close(dist(p, q), rs, `${t} °C:兩層貼在一起`, 1e-9);
      });
    }
  }
});

test("第 319 種:配重 b、b' 照原圖套在弧桿上:弧桿從配重的孔穿過、兩頭都伸出配重,外側的螺絲頂著弧桿把配重鎖住", () => {
  const def = m319.default;
  for (const t of sweep(40, 10, -10)) {
    const pose = def.pose(t);
    for (const [id, side] of [["weightB", "R"], ["weightB2", "L"]]) {
      const w = part(def, id);
      const body = w.pieces.find((q) => q.kind === "plate");
      assert.deepEqual(body.axis, [0, 1, 0], "孔沿配重的局部 y(弧桿的走向)");
      const hole = body.shape.holes[0];
      const hc = [hole.reduce((s, p) => s + p[0], 0) / hole.length, hole.reduce((s, p) => s + p[1], 0) / hole.length];
      const hr = Math.min(...hole.map(([x, y]) => Math.hypot(x - hc[0], y - hc[1])));
      const half = body.thickness / 2;
      const { position, angle } = pose.parts[id];
      // 局部座標:x 往外(徑向)、y 沿弧桿、z;板的形狀座標 (x, y) 對到局部 (x, −z)
      const local = (p) => [...rot2([p[0] - position[0], p[1] - position[1]], -angle), p[2] - position[2]];
      let ends = 0;
      for (const layer of ["steel", "brass"]) {
        const r = part(def, `${layer}${side}`).radius;
        const pts = pose.paths[`${layer}${side}`].points.map(local);
        for (const [x, y, z] of pts) {
          if (Math.abs(y) <= half) {
            assert.ok(Math.hypot(x - hc[0], -z - hc[1]) + r <= hr + 1e-9, `${t} °C:${id} 裡的弧桿在孔裡、不碰孔壁`);
          }
        }
        const near = pts.filter(([x]) => Math.abs(x - hc[0]) < 0.3);
        if (near.some(([, y]) => y > half + 0.1) && near.some(([, y]) => y < -half - 0.1)) ends++;
      }
      assert.equal(ends, 2, `${t} °C:弧桿穿過 ${id}、兩頭都伸出去`);
      // 螺絲:沿局部 x 從外側面伸進來,尖端頂著黃銅層的外緣
      const screw = w.pieces.filter((q) => q.kind === "cylinder").reduce((a, b) => (a.at[0] - a.length / 2 <= b.at[0] - b.length / 2 ? a : b));
      const tip = screw.at[0] - screw.length / 2;
      const rb = part(def, `brass${side}`).radius;
      const brass = pose.paths[`brass${side}`].points.map(local).reduce((a, b) => (Math.abs(a[1] - screw.at[1]) <= Math.abs(b[1] - screw.at[1]) ? a : b));
      close(tip, brass[0] + rb, `${t} °C:螺絲頂著弧桿`, 0.002);
      assert.ok(Math.max(...body.shape.outline.map(([x]) => x)) < screw.at[0] + screw.length / 2, "螺絲從配重外側面伸進來");
    }
  }
});

test("第 319 種:升溫時配重往內移,減少擺輪的轉動慣量:讀數「轉動慣量」升溫變小、降溫變大", () => {
  const def = m319.default;
  close(readNumber(def.pose(20), "轉動慣量"), 0, "以 20 °C 為基準", 1e-9);
  const ts = sweep(40, 10, -10);
  const values = ts.map((t) => readNumber(def.pose(t), "轉動慣量"));
  for (let i = 1; i < ts.length; i++) assert.ok(values[i] < values[i - 1], `${ts[i]} °C:比 ${ts[i - 1]} °C 小`);
  // 配重離中心的距離的平方和(配重對轉動慣量的貢獻)跟著變
  const r2 = (t) => ["weightB", "weightB2"].reduce((s, id) => s + Math.hypot(...def.pose(t).parts[id].position.slice(0, 2)) ** 2, 0);
  assert.ok(r2(40) < r2(20) && r2(20) < r2(-10), "配重升溫往內、降溫往外");
});

test("第 320 種:無端鏈:上發條(拉 b)的期間,動力輪 P 照樣被帶動;每一輪重物 W 回到原位", () => {
  const steps = sweep(1, 200).map((p) => m320.chain(p));
  assert.ok(steps.every((c, i) => i === 0 || c.fed > steps[i - 1].fed), "動力輪一直轉,不曾停下");
  const winding = steps.filter((c, i) => i > 0 && c.wound > steps[i - 1].wound);
  assert.ok(winding.length > 0, "有上發條的期間");
  assert.ok(steps.some((c, i) => i > 0 && c.W > steps[i - 1].W), "上發條時 W 被拉上來");
  close(m320.chain(1).W, m320.chain(0).W, "一輪後 W 回到原位", 1e-9);
});

test("第 320 種:p 是軸(類似的滑輪騎在另一根軸 p 上);大重物 W 由繩段 c 拉起,d 仍掛在動力輪的滑輪 P 上", () => {
  const def = m320.default;
  const { Pp } = m320.geometry;
  // p 標在報時輪的軸上(軸和報時輪固定在一起,是同一個零件):標籤在軸的前端,軸穿過棘輪滑輪的中心伸到前面
  const p = def.parts.find((q) => q.label === "p");
  const arbor = p.pieces.find((q) => q.kind === "cylinder" && Math.hypot(q.at[0], q.at[1]) < 1e-9);
  assert.ok(arbor, "p 標在軸上");
  close(Math.hypot(p.center[0] - Pp[0], p.center[1] - Pp[1]), 0, "軸 p 穿過棘輪滑輪的中心", 1e-9);
  const front = p.center[2] + arbor.at[2] + arbor.length / 2;
  assert.ok(front > 0.2, "軸 p 穿過棘輪滑輪伸到前面");
  close(Math.hypot(p.labelOffset[0], p.labelOffset[1]), Math.hypot(-0.12, 0.15), "標籤在軸端旁", 1e-9);
  assert.equal(def.parts.find((q) => q.id === "pulleyp").label, undefined, "棘輪滑輪本身不標 p");
  // 繩段 c 從棘輪滑輪下到 W 的滑輪,a 從 P 下到 w 的滑輪(兩段在中間交叉)
  const pose = def.pose(0.9).parts;
  const W = pose.sheaveW.position;
  const w = pose.sheavew.position;
  const PP = def.parts.find((q) => q.id === "goingWheel").center;
  const at = (label) => {
    const q = def.parts.find((r) => r.label === label);
    return q.center.map((c, i) => c + q.labelOffset[i]);
  };
  const toLine = ([x, y], [x0, y0], [x1, y1]) => Math.abs((x1 - x0) * (y - y0) - (y1 - y0) * (x - x0)) / Math.hypot(x1 - x0, y1 - y0);
  assert.ok(toLine(at("c"), Pp, W) < toLine(at("c"), PP, w) / 3, "c 標在棘輪滑輪到 W 的繩段旁");
  assert.ok(toLine(at("a"), PP, w) < toLine(at("a"), Pp, W) / 3, "a 標在 P 到 w 的繩段旁");
});

test("第 320 種:無端鏈:棘輪滑輪在制動爪下方運行,爪被齒背抬起又落下,停著時落在齒根", () => {
  const click = (p) => m320.clickAngle(p);
  const rest = click(0);
  close(click(0.5), rest, "時鐘照走、沒上發條時棘輪滑輪不動,爪也不動", 1e-12);
  close(click(1), rest, "上完發條,爪回到齒根", 1e-9);
  const lifts = sweep(1, 400, 0.75).map(click);
  assert.ok(lifts.every((a) => a <= rest + 0.002), "爪只會被齒背抬起,不會比齒根更低");
  // 爪落下(角度變大)的每一段:從靜止開始、越落越快,不是一步跳到底
  const falls = [];
  for (let i = 1; i < lifts.length; i++) {
    const d = lifts[i] - lifts[i - 1];
    if (d > 1e-6) {
      if (!(lifts[i - 1] - (lifts[i - 2] ?? lifts[i - 1]) > 1e-6)) falls.push([]);
      falls.at(-1).push(d);
    }
  }
  assert.ok(falls.length >= 5, `上發條時爪一齒一齒地落下(實際 ${falls.length} 次)`);
  for (const f of falls.filter((f) => f.length > 2)) assert.ok(f[1] > f[0], "落下是加速的");
  assert.ok(falls.every((f) => f.length > 1), "每次落下都有過程,不是瞬移");
  // 查表內插會讓爪在兩個取樣之間略深一點;以爪尖的位移算,容許 0.003(爪長 0.57)
  const { length } = m320.geometry.CLICK;
  for (const p of sweep(1, 800)) assert.ok(click(p) <= m320.clickLimit(p) + 0.003 / length, `進程 ${p.toFixed(4)}:爪尖穿進棘輪`);
  const turn = m320.ratchetAngle(m320.chain(1).wound) - m320.ratchetAngle(m320.chain(0).wound);
  close(turn % ((2 * Math.PI) / m320.RATCHET.teeth), 0, "每次上發條棘輪滑輪轉過整數個齒", 1e-9);
  assert.ok(turn > 0, "棘輪滑輪只往逆時針(棘輪放行的方向)轉");
});

test("第 320 種:P 為一個固定於動力輪部分之主輪上的滑輪:動力輪比 P 大、P 固定在它上面;上發條時動力輪照轉,帶動往擒縱的小齒輪", () => {
  const def = m320.default;
  const wheel = part(def, "goingWheel");
  assert.ok(wheel && wheel.kind === "gear", "有動力輪(有齒的主輪)");
  assert.equal(def.target, "goingWheel", "目標件是一刻不失去動力的動力輪");
  assert.equal(wheel.label, "P", "P 標在動力輪上的滑輪");
  const P = wheel.pieces.find((q) => q.kind === "pulley");
  assert.ok(P, "滑輪 P 是動力輪的一部分(固定在它上面)");
  assert.ok(wheel.radius > P.radius * 1.4, "動力輪比 P 大得多(原圖)");
  // 「表面做得粗糙以防止繩索在其上打滑」:動力輪轉過的弧長 = 經 P 送出的繩長
  for (const [a, b] of [[0, 0.5], [0.75, 1], [0, 1]]) {
    const turned = def.pose(b).parts.goingWheel.angle - def.pose(a).parts.goingWheel.angle;
    close(-turned * P.radius, m320.chain(b).fed - m320.chain(a).fed, `${a}→${b}:繩不在 P 上打滑`, 1e-9);
  }
  // 往擒縱的小齒輪(推斷):和動力輪咬合,齒不重疊;上發條(0.75–1)的期間照轉,時鐘照走
  assertMeshFree(def, "goingWheel", "goingPinion", sweep(1, 60));
  const pinion = part(def, "goingPinion");
  const spin = sweep(1, 200, 0.7).map((p) => def.pose(p).parts.goingPinion.angle);
  assert.ok(spin.every((a, i) => i === 0 || a > spin[i - 1]), "小齒輪一直往前轉,上發條時也不停");
  close((spin.at(-1) - spin[0]) / (def.pose(1).parts.goingWheel.angle - def.pose(0.7).parts.goingWheel.angle), -wheel.teeth / pinion.teeth, "轉速比 = 齒數反比", 1e-9);
});

test("第 320 種:左側的則為報時輪:軸 p 是報時輪主輪的軸,棘輪與制動爪把棘輪滑輪附著在報時輪上;棘輪比繩槽大", () => {
  const def = m320.default;
  const { Pp, CLICK } = m320.geometry;
  const wheel = part(def, "strikingWheel");
  assert.ok(wheel && wheel.kind === "gear", "有報時輪");
  close(Math.hypot(wheel.center[0] - Pp[0], wheel.center[1] - Pp[1]), 0, "報時輪裝在軸 p 上", 1e-9);
  assert.ok(wheel.radius > m320.RATCHET.outer + 0.15, "報時輪比棘輪滑輪大(原圖棘輪外的大圓)");
  // 模型裡不報時:報時輪由報時輪系鎖住,停著不動(上發條時 W 的拉力經爪傳到它上面)
  const angles = sweep(1, 40).map((p) => def.pose(p).parts.strikingWheel?.angle ?? 0);
  assert.ok(angles.every((a) => a === angles[0]), "報時輪不轉");
  assertMeshFree(def, "strikingWheel", "strikingPinion", [0]);
  // 制動爪的樁在報時輪上,不在機架上
  const onPivot = (q) => q.kind === "cylinder" && Math.hypot(q.at[0] + wheel.center[0] - CLICK.pivot[0], q.at[1] + wheel.center[1] - CLICK.pivot[1]) < 1e-9;
  assert.ok(wheel.pieces.some(onPivot), "爪的樁裝在報時輪上");
  assert.ok(!part(def, "frame").pieces.some((q) => q.kind === "cylinder" && Math.hypot(q.at[0] - CLICK.pivot[0], q.at[1] - CLICK.pivot[1]) < 1e-9), "機架上沒有爪的樁");
  assert.equal(def.replay.free.click.on, "strikingWheel", "重演:爪鉸在報時輪上");
  // 原圖棘輪齒尖半徑約 53 px、繩繞的半徑約 42 px:棘輪比繩槽大,齒根也在繩外
  const P = part(def, "pulleyp").pieces.find((q) => q.kind === "pulley");
  assert.ok(m320.RATCHET.inner > P.radius, "棘輪的齒根在繩槽外");
});

test("第 320 種:爪簧(原圖左上的淚滴形片)裝在報時輪上,片簧的末端全程貼著制動爪的背,把爪壓向棘輪", () => {
  const def = m320.default;
  const { Pp, CLICK, SEAT } = m320.geometry;
  const wheel = part(def, "strikingWheel");
  const leaf = part(def, "clickSpring");
  assert.equal(leaf?.kind, "rod", "片簧畫成一條線");
  assert.ok(wheel.pieces.some((q) => Math.hypot(q.at[0] + wheel.center[0] - SEAT.at[0], q.at[1] + wheel.center[1] - SEAT.at[1]) < 1e-9), "片簧的座(淚滴形片)裝在報時輪上");
  for (const p of sweep(1, 300)) {
    const pts = def.pose(p).paths.clickSpring.points;
    assert.ok(Math.hypot(pts[0][0] - SEAT.at[0], pts[0][1] - SEAT.at[1]) <= SEAT.r + 1e-9, `進程 ${p.toFixed(3)}:片簧從座伸出`);
    const psi = m320.clickAngle(p);
    const u = [Math.cos(psi), Math.sin(psi)];
    const rel = (q) => [q[0] - CLICK.pivot[0], q[1] - CLICK.pivot[1]];
    const side = (q) => u[0] * rel(q)[1] - u[1] * rel(q)[0]; // 離爪中心線的帶號距離
    const tip = pts.at(-1);
    const along = u[0] * rel(tip)[0] + u[1] * rel(tip)[1];
    assert.ok(along > 0.1 && along < CLICK.length - 0.12, `進程 ${p.toFixed(3)}:片簧壓在爪身上`);
    assert.ok(Math.sign(side(tip)) === -Math.sign(side(Pp)), `進程 ${p.toFixed(3)}:片簧在爪背(離棘輪的一側)`);
    const gap = Math.abs(side(tip)) - CLICK.width / 2 - (leaf.radius ?? 0.03);
    assert.ok(gap > -1e-6 && gap < 0.006, `進程 ${p.toFixed(3)}:片簧末端貼著爪背(間隙 ${gap.toFixed(4)})`);
  }
});

test("第 321 種:哈里森的動力盒:上發條時制動爪 T 擋住大棘輪,彈簧 S、S' 繼續推動主輪 G", () => {
  const { P } = m321.geometry;
  const during = sweep(P.wound - 0.01, 30, P.run + 0.01).map((p) => m321.harrison(p));
  assert.ok(during.every((h) => h.big === during[0].big), "上發條時大棘輪不動");
  assert.ok(during.every((h, i) => i === 0 || h.g > during[i - 1].g), "主輪照轉(逆時針,照原圖)");
  assert.ok(Math.abs(during[during.length - 1].spring) < Math.abs(during[0].spring), "彈簧放鬆、推著主輪");
  close(m321.harrison(1).weight, m321.harrison(0).weight, "一輪後重物回到原位", 1e-9);
});

test("第 321 種:哈里森的動力盒:T 被大棘輪的齒背抬起又落回,R 在上發條時被小棘輪抬起又落回;停著時都在齒根", () => {
  const { P } = m321.geometry;
  const at = (p) => m321.clicks(p);
  close(at(1).T, at(0).T, "一輪後 T 回到原處", 1e-9);
  close(at(1).R, at(0).R, "一輪後 R 回到原處", 1e-9);
  const held = sweep(P.wound, 20, P.run).map((p) => at(p).T);
  assert.ok(held.every((t) => Math.abs(t - held[0]) < 1e-9), "上發條時 T 一直頂著大棘輪");
  const moved = (key, from, to) => sweep(to, 300, from).some((p) => Math.abs(at(p)[key] - at(from)[key]) > 0.02);
  assert.ok(moved("T", 0, P.run), "照走時大棘輪從 T 底下轉過,T 被齒背抬起");
  assert.ok(moved("R", P.run, P.wound), "上發條時小棘輪從 R 底下轉過");
  assert.ok(!moved("R", 0, P.run), "照走時 R 扣住小棘輪,不動");
  for (const p of sweep(1, 800)) {
    const c = at(p);
    const lim = m321.clickLimits(p);
    // 查表內插的誤差,以爪尖的位移算容許 0.003(T 長 3.05、R 長 0.53)
    assert.ok(c.T <= lim.T + 0.003 / 3.05 && c.R >= lim.R - 0.003 / 0.53, `進程 ${p.toFixed(4)}:爪尖穿進棘輪`);
  }
  // 爪過了齒尖是加速落回(T 落下時角度變大、R 落下時角度變小),不是一步跳到底
  for (const [key, into, from, to] of [["T", 1, 0, P.run], ["R", -1, P.run, P.wound]]) {
    const xs = sweep(to, 600, from).map((p) => at(p)[key] * into);
    let run = [];
    let checked = 0;
    for (let i = 1; i < xs.length; i++) {
      const d = xs[i] - xs[i - 1];
      if (d > 1e-6) run.push(d);
      else {
        if (run.length > 2) {
          assert.ok(run[1] > run[0], `${key} 落下是加速的`);
          checked++;
        }
        if (run.length === 1) assert.fail(`${key} 一步就落到底(瞬移)`);
        run = [];
      }
    }
    assert.ok(checked >= 2, `${key} 有落下的過程`);
  }
});

test("第 321 種:R 由片簧壓向小棘輪(原圖:兩顆螺絲固定在較大棘輪上的新月形片,伸出片簧壓在 R 的背上);起始畫面 R 的樞軸在右下", () => {
  const def = m321.default;
  const { R_PIVOT, R_LEN, R_WIDTH, LEAF, CRESCENT } = m321.geometry;
  const big = part(def, "bigRatchet");
  const leaf = part(def, "leafR");
  assert.equal(leaf?.kind, "rod", "片簧畫成一條線");
  assert.ok(big.pieces.includes(CRESCENT.plate), "新月形片是較大棘輪的一部分(固定在它上面)");
  assert.equal(CRESCENT.screws.length, 2, "新月形片用兩顆螺絲固定");
  for (const screw of CRESCENT.screws) {
    assert.ok(big.pieces.includes(screw), "螺絲鎖在較大棘輪上");
    assert.ok(pointInPolygon([screw.at[0] - CRESCENT.plate.at[0], screw.at[1] - CRESCENT.plate.at[1]], CRESCENT.plate.shape.outline), "螺絲穿過新月形片");
  }
  assert.ok(pointInPolygon([LEAF.root[0] - CRESCENT.plate.at[0], LEAF.root[1] - CRESCENT.plate.at[1]], CRESCENT.plate.shape.outline), "片簧的根部埋在新月形片的一端(從那裡伸出)");
  const pivot0 = rot2(R_PIVOT, m321.phases.bigAngle(0));
  const a0 = (Math.atan2(pivot0[1], pivot0[0]) * 180) / Math.PI;
  assert.ok(a0 > -45 && a0 < 0, `起始畫面 R 的樞軸在右下(實際 ${a0.toFixed(0)}°)`);
  const toLocal = (q, big) => rot2(q, -big);
  let root0;
  for (const p of sweep(1, 300)) {
    const pts = def.pose(p).paths.leafR.points;
    const bigA = m321.phases.bigAngle(p);
    // 片簧的根部固定在較大棘輪上(在棘輪的座標裡不動),從新月形片伸出
    const root = toLocal(pts[0], bigA);
    root0 ??= root;
    close(Math.hypot(root[0] - root0[0], root[1] - root0[1]), 0, `進程 ${p.toFixed(3)}:片簧的根部跟著較大棘輪轉`, 1e-9);
    close(Math.hypot(root[0] - LEAF.root[0], root[1] - LEAF.root[1]), 0, "片簧從新月形片的一端伸出", 1e-9);
    // 末端貼著 R 的背(離小棘輪的一側):R 的局部座標裡量
    const psi = m321.clicks(p).R;
    const u = [Math.cos(psi), Math.sin(psi)];
    const tip = toLocal(pts.at(-1), bigA);
    const rel = (q) => [q[0] - R_PIVOT[0], q[1] - R_PIVOT[1]];
    const side = (q) => u[0] * rel(q)[1] - u[1] * rel(q)[0];
    const along = u[0] * rel(tip)[0] + u[1] * rel(tip)[1];
    assert.ok(along > 0.1 && along < R_LEN - 0.12, `進程 ${p.toFixed(3)}:片簧壓在 R 的爪身上`);
    assert.ok(Math.sign(side(tip)) === -Math.sign(side([0, 0])), `進程 ${p.toFixed(3)}:片簧在 R 的背(離小棘輪的一側)`);
    const gap = Math.abs(side(tip)) - R_WIDTH / 2 - leaf.radius;
    assert.ok(gap > -1e-6 && gap < 0.006, `進程 ${p.toFixed(3)}:片簧末端貼著 R 的背(間隙 ${gap.toFixed(4)})`);
    // 片簧繞在小棘輪外面,不掃過棘齒
    for (const q of pts) assert.ok(Math.hypot(q[0], q[1]) > 0.72 + leaf.radius, `進程 ${p.toFixed(3)}:片簧碰到小棘輪`);
  }
  assert.equal(def.replay.free.clickR.spring, -1, "重演:片簧把 R 往順時針(壓向小棘輪)推");
});

test("第 321 種:主輪 G 咬一個小齒輪(推斷,代表往擒縱的輪系);上發條時彈簧照樣推著主輪,小齒輪照轉", () => {
  const def = m321.default;
  const { P } = m321.geometry;
  const G = part(def, "wheelG");
  assert.equal(G.kind, "gear", "主輪 G 是齒輪");
  assertMeshFree(def, "wheelG", "pinion", sweep(1, 60));
  const pinion = part(def, "pinion");
  const spin = sweep(1, 300).map((p) => def.pose(p).parts.pinion.angle);
  assert.ok(spin.every((a, i) => i === 0 || a < spin[i - 1]), "小齒輪一直往前轉(G 逆時針、小齒輪順時針),上發條時也不停");
  const during = (p) => def.pose(p).parts.pinion.angle;
  assert.ok(during(P.wound) < during(P.run), "上發條的期間小齒輪照轉");
  close((spin.at(-1) - spin[0]) / (def.pose(1).parts.wheelG.angle - def.pose(0).parts.wheelG.angle), -G.teeth / pinion.teeth, "轉速比 = 齒數反比", 1e-9);
});
