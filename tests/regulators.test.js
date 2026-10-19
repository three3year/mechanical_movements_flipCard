// 第十四章「擺與鐘錶調節」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, assertWeightDrive } from "./helpers.js";

import * as m315 from "../models/fig315.js";
import * as m316 from "../models/fig316.js";
import * as m317 from "../models/fig317.js";
import * as m318 from "../models/fig318.js";
import * as m319 from "../models/fig319.js";
import * as m320 from "../models/fig320.js";
import * as m321 from "../models/fig321.js";
import { dist, add, quatRotate } from "../models/kit.js";

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

test("第 319 種:補償擺輪:溫度升高時複合桿向內彎,配重往內移", () => {
  for (const s of [1, -1]) {
    const hot = m319.rim(40, s).weightRadius;
    const cold = m319.rim(-10, s).weightRadius;
    assert.ok(hot < cold, "升溫時配重較靠內");
  }
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
  const p = def.parts.find((q) => q.label === "p");
  assert.equal(p.kind, "cylinder", "p 標在軸上");
  close(Math.hypot(p.center[0] - Pp[0], p.center[1] - Pp[1]), 0, "軸 p 穿過棘輪滑輪的中心", 1e-9);
  assert.equal(def.parts.find((q) => q.id === "pulleyp").label, undefined, "棘輪滑輪本身不標 p");
  // 繩段 c 從棘輪滑輪下到 W 的滑輪,a 從 P 下到 w 的滑輪(兩段在中間交叉)
  const pose = def.pose(0.9).parts;
  const W = pose.sheaveW.position;
  const w = pose.sheavew.position;
  const PP = def.parts.find((q) => q.id === "pulleyP").center;
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
  for (const p of sweep(1, 800)) assert.ok(click(p) <= m320.clickLimit(p) + 0.003 / 0.57, `進程 ${p.toFixed(4)}:爪尖穿進棘輪`);
  const turn = m320.ratchetAngle(m320.chain(1).wound) - m320.ratchetAngle(m320.chain(0).wound);
  close(turn % ((2 * Math.PI) / m320.RATCHET.teeth), 0, "每次上發條棘輪滑輪轉過整數個齒", 1e-9);
  assert.ok(turn > 0, "棘輪滑輪只往逆時針(棘輪放行的方向)轉");
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
