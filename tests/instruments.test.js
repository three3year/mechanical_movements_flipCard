// 第十七章「繪圖儀器」與第二十二章「儀錶與周轉輪系」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, plateLayers } from "./helpers.js";
import { quatRotate } from "../models/kit.js";
import { pointInPolygon, placeOutline } from "../models/contact.js";
import * as pt from "../models/pencil-thread.js";
import { polylineLength } from "../models/pencil-thread.js";
import fig500, { gauge } from "../models/fig500.js";
import * as m403 from "../models/fig403.js";
import * as m404 from "../models/fig404.js";
import * as m405 from "../models/fig405.js";
import * as m406 from "../models/fig406.js";
import * as m407 from "../models/fig407.js";
import * as m408 from "../models/fig408.js";
import * as m409 from "../models/fig409.js";
import * as m410 from "../models/fig410.js";
import * as m411 from "../models/fig411.js";
import * as m496 from "../models/fig496.js";
import fig497 from "../models/fig497.js";
import * as m498 from "../models/fig498.js";
import * as m499 from "../models/fig499.js";
import * as m501 from "../models/fig501.js";
import * as m495 from "../models/fig495.js";
import * as m502 from "../models/fig502.js";
import * as m503 from "../models/fig503.js";
import * as m504 from "../models/fig504.js";
import * as m505 from "../models/fig505.js";
import * as m506 from "../models/fig506.js";
import * as m507 from "../models/fig507.js";
import { lastWheel, armOf } from "../models/epicyclic.js";

const needle = (p) => fig500.pose(p).parts.needle.angle;

test("第 500 種:壓力越大指針轉角越大,壓力為零時指針歸零", () => {
  const zero = needle(0);
  const turns = sweep(10, 20).map((p) => zero - needle(p)); // 指針順時針轉
  close(turns[0], 0, "壓力為零時指針在零點");
  for (let i = 1; i < turns.length; i++) assert.ok(turns[i] > turns[i - 1], "壓力越大轉角越大");
  close(needle(-3), zero, "超出範圍的壓力被夾住");
});

test("第 500 種:碟片 A 的變形經扇形段 e 帶動小齒輪,轉角符合齒數比", () => {
  const sector = fig500.parts.find((p) => p.id === "sector");
  const pinion = fig500.parts.find((p) => p.id === "pinion");
  const a = gauge(2);
  const b = gauge(6);
  assert.ok(b.lift > a.lift, "壓力越大碟片拱得越高");
  close(b.pinion - a.pinion, -((b.sector - a.sector) * sector.teeth) / pinion.teeth);
});

test("第 500 種:主動件是虛擬的「壓力」,不指向零件", () => {
  assert.equal(fig500.driver.type, "virtual");
  assert.equal(fig500.driver.label, "壓力");
  assert.equal(fig500.driver.mode, "balance");
});

// ── 第十七章「繪圖儀器」(第 403–411 種) ──

const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) < eps, `${msg} 期望 ${b},實際 ${a}`);
const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const paperTop = (def) => {
  const p = part(def, "paper");
  return p.center[2] + (p.kind === "box" ? p.size[2] : p.thickness) / 2;
};
// 旋轉體(鉛筆)在局部高度 z 的半徑(剖面各段線性內插)
const latheRadiusAt = (profile, z) => {
  for (let i = 1; i < profile.length; i++) {
    const [[r0, z0], [r1, z1]] = [profile[i - 1], profile[i]];
    if (z >= z0 && z <= z1) return r0 + ((r1 - r0) * (z - z0)) / (z1 - z0);
  }
  return 0;
};
const tipZ = (def, pose) => pose.parts.pencil.position[2] + part(def, "pencil").profile[0][1];

test("第 403 種:弧線繪製儀:兩根直尺頂住弦兩端的銷滑動,夾角處的鉛筆畫出通過兩銷附近的圓弧", () => {
  const angles = [];
  for (const phi of [m403.RANGE[0], 1.4, Math.PI / 2, 1.8, m403.RANGE[1]]) {
    const st = m403.setting(phi);
    // 兩根直尺的下緣各頂著一根銷(銷中心到下緣的距離 = 銷半徑)
    st.edges.forEach((e, i) => {
      const pin = m403.PINS[i];
      near(Math.abs((pin[0] - e.at[0]) * Math.sin(e.a) - (pin[1] - e.at[1]) * Math.cos(e.a)), 0.08, 1e-9, "銷中心到下緣的距離 = 銷半徑");
      near((pin[0] - e.at[0]) * e.n[0] + (pin[1] - e.at[1]) * e.n[1], -0.08, 1e-9, "銷在下緣的內側、碰著它");
    });
    // 鉛筆夾在兩條下緣的夾角裡,碰著兩條邊(鉛筆的圓錐在上面那根尺的上緣高度剛好碰到尺邊)
    for (const e of st.edges) near(Math.abs((st.tip[0] - e.at[0]) * Math.sin(e.a) - (st.tip[1] - e.at[1]) * Math.cos(e.a)), m403.PENCIL_R, 1e-9, "鉛筆碰著直尺的邊");
    angles.push(Math.abs(st.edges[0].a - st.edges[1].a));
    // 鉛筆畫的線離通過兩銷的圓不到銷的粗細
    near(Math.hypot(st.tip[0] - m403.CENTER[0], st.tip[1] - m403.CENTER[1]), m403.RADIUS, 0.1, "鉛筆在弧上");
  }
  for (const a of angles) near(a, angles[0], 1e-9, "兩根直尺的夾角固定(同弦所對的圓周角相等)");
  const def = m403.default;
  const pose = def.pose(Math.PI / 2);
  const rulerTop = pose.parts.rulerR.position[2] + part(def, "rulerR").thickness / 2;
  near(latheRadiusAt(part(def, "pencil").profile, rulerTop - pose.parts.pencil.position[2]), m403.PENCIL_R, 0.002, "鉛筆在上面那根尺的上緣高度的半徑 = 鉛筆到尺邊的距離(間隙接近 0)");
});

test("第 403 種:鉛筆尖畫在紙上;兩根直尺平放疊在紙上,撐桿橫過兩者、兩端都夾在尺上", () => {
  const def = m403.default;
  const top = paperTop(def);
  const t = part(def, "rulerL").thickness;
  for (const phi of [m403.RANGE[0], Math.PI / 2, m403.RANGE[1]]) {
    const pose = def.pose(phi);
    near(tipZ(def, pose), top, 1e-9, "鉛筆尖在紙面上");
    const L = pose.parts.rulerL;
    const R = pose.parts.rulerR;
    near(L.position[2] - t / 2, top, 1e-9, "左尺平放在紙上");
    near(R.position[2] - t / 2, L.position[2] + t / 2, 1e-9, "右尺疊在左尺上");
    // 撐桿是一塊板:本體壓在右尺上、左端下面的墊塊壓在左尺上;兩端各落在一根尺的尺身裡
    const b = pose.parts.brace;
    const layers = plateLayers(part(def, "brace")).map((l) => ({ z0: l.z0 + b.position[2], z1: l.z1 + b.position[2], solid: l.solid })).sort((p, q) => p.z0 - q.z0);
    assert.equal(layers.length, 2, "撐桿本體與墊塊兩層");
    near(layers[0].z0, L.position[2] + t / 2, 1e-9, "墊塊壓在左尺上");
    near(layers[1].z0, R.position[2] + t / 2, 1e-9, "撐桿本體壓在右尺上");
    const inRuler = (id, p) => {
      const r = pose.parts[id];
      return pointInPolygon([p[0], p[1]], placeOutline(part(def, id).shape.outline, r.position, r.angle));
    };
    const [c, s] = [Math.cos(b.angle), Math.sin(b.angle)];
    const world = ([x, y]) => [b.position[0] + x * c - y * s, b.position[1] + x * s + y * c];
    const spacer = layers[0].solid.outline;
    const spacerCenter = world([spacer.reduce((a, p) => a + p[0], 0) / spacer.length, spacer.reduce((a, p) => a + p[1], 0) / spacer.length]);
    assert.ok(inRuler("rulerL", spacerCenter), "墊塊落在左尺的尺身裡");
    assert.ok(inRuler("rulerR", world([m403.BRACE_LEN, 0])), "撐桿右端落在右尺的尺身裡");
    for (const p of pose.paths.arc.points) near(p[2], top + 0.01, 1e-9, "畫出的弧貼在紙面上");
  }
});

test("第 404 種:每一端都透過一個小滾子被限制貼靠在直線桿上:滾子在釘在直桿上的立柱頂,壓著拱形桿的上面;桿兩端伸出滾子外往下垂", () => {
  const def = m404.default;
  const frame = part(def, "frame");
  m404.ROLLERS.forEach(([x, y]) => {
    assert.ok(frame.pieces.some((p) => p.kind === "plate" && pointInPolygon([x - (p.at?.[0] ?? 0), y - (p.at?.[1] ?? 0)], p.shape.outline)), "滾子的軸心在立柱板上");
    assert.ok(frame.pieces.some((p) => p.kind === "cylinder" && Math.abs(p.at[0] - x) < 1e-9 && Math.abs(p.at[1] - y) < 1e-9), "立柱頂有滾子的軸銷");
  });
  for (const a of sweep(m404.RANGE[1], 6)) {
    const s = m404.arch(a);
    const pose = def.pose(a);
    ["rollerL", "rollerR"].forEach((id, i) => {
      const rc = pose.parts[id].position;
      near(rc[0], m404.ROLLERS[i][0], 1e-12, "滾子的位置固定(在立柱上)");
      near(rc[1], m404.ROLLERS[i][1], 1e-12, "滾子的位置固定(在立柱上)");
      near(dist2(rc, s.center), s.r + m404.BAR_R + m404.ROLLER_R, 1e-9, "滾子壓在拱形桿的上面(間隙 0)");
      assert.ok(rc[1] > s.center[1] + s.r * Math.cos(s.beta), "滾子在桿的上方");
    });
    assert.ok(s.alpha > s.beta + 0.05, "桿的兩端伸出滾子外");
    assert.ok(s.center[1] + s.r * Math.cos(s.alpha) < s.center[1] + s.r * Math.cos(s.beta), "伸出的兩端往下垂");
  }
});

test("第 404 種:桿長不變、始終彎成真的圓弧;旋緊螺絲中間被頂高、弧更彎、桿身在滾子下往裡滑、滾子跟著轉;翼形手柄接在螺桿上", () => {
  const def = m404.default;
  const [a0, a1] = [m404.arch(0), m404.arch(m404.RANGE[1])];
  assert.ok(a1.r < a0.r, "旋緊螺絲,弧更彎(半徑變小)");
  assert.ok(a1.slid > a0.slid, "彎得越厲害,兩個滾子之間的桿身越長:桿在滾子下往裡滑");
  for (const a of sweep(m404.RANGE[1], 6)) {
    const s = m404.arch(a);
    near(2 * s.r * s.alpha, m404.LENGTH, 1e-9, "拱形桿的長度不變");
    const pose = def.pose(a);
    const pts = pose.paths.bar.points;
    for (const p of pts) near(dist2(p, s.center), s.r, 1e-9, "桿上各點在同一圓上");
    near(polylineLength(pts), m404.LENGTH, 0.01, "路徑的長 = 桿長");
    near(pose.parts.pad.position[1] + part(def, "pad").size[1] / 2, s.center[1] + s.r - m404.BAR_R, 1e-9, "壓塊頂著拱形桿正中的下面(間隙 0)");
  }
  // 滾子跟著轉:接觸點上滾子表面的速度和桿身滑過的速度同向同大
  const h = 1e-4;
  for (const a of [2, 6, 10, 16]) {
    const s = m404.arch(a);
    const ds = (m404.arch(a + h).slid - m404.arch(a - h).slid) / (2 * h);
    ["rollerL", "rollerR"].forEach((id, i) => {
      const side = i ? 1 : -1;
      const dphi = (def.pose(a + h).parts[id].angle - def.pose(a - h).parts[id].angle) / (2 * h);
      const rc = m404.ROLLERS[i];
      const d = dist2(rc, s.center);
      const radial = [(rc[0] - s.center[0]) / d, (rc[1] - s.center[1]) / d];
      const tangent = side > 0 ? [radial[1], -radial[0]] : [-radial[1], radial[0]]; // 桿身往外滑的方向
      const r = [-m404.ROLLER_R * radial[0], -m404.ROLLER_R * radial[1]]; // 滾子中心到接觸點
      const surface = [-dphi * r[1], dphi * r[0]];
      near(surface[0] * tangent[0] + surface[1] * tangent[1], ds, 1e-6, `${id} 表面在接觸點和桿身同向同速`);
    });
  }
  const screw = part(def, "screw");
  const worm = screw.pieces.find((p) => p.kind === "worm");
  const handle = screw.pieces.find((p) => p.kind === "cylinder");
  assert.ok(handle.at[2] + handle.length / 2 >= worm.at[2] - worm.length / 2 - 1e-9, "手柄的柄接到螺桿的下端");
});

test("第 405 種:雙曲線:直尺繞上焦點轉、尺邊通過該焦點;繩的彎曲處到兩焦點的距離差 = 2a,尺在中心線上時剛好到達頂點", () => {
  for (const state of ["first", "second"]) {
    for (const v of sweep(m405.SWING, 5)) {
      const P = m405.bight(v, state);
      near(dist2(P, m405.F1) - dist2(P, m405.F2), 2 * m405.A, 1e-9, "距離差 = 2a");
      const u = m405.direction(v, state);
      near((P[0] - m405.F1[0]) * u[1] - (P[1] - m405.F1[1]) * u[0], 0, 1e-9, "尺邊通過樞軸所在的焦點");
    }
  }
  near(m405.bight(0, "first")[0], 0, 1e-12, "尺在中心線上時繩的彎曲處在頂點");
  near(m405.bight(0, "first")[1], -m405.A, 1e-12, "頂點(畫下面那支)");
  assert.ok(m405.F1[1] > 0 && m405.F2[1] < 0, "尺繞上焦點轉、繩的銷在下焦點(照原圖)");
});

test("第 405 種:繩長不變(= 尺長 − 2a);前半條尺身在左,後半條把尺翻面(以貼鉛筆的尺邊為軸)尺身在右,繩始終不橫過尺身", () => {
  const def = m405.default;
  assert.deepEqual(def.states.options.map((o) => o.id), ["first", "second"]);
  for (const state of ["first", "second"]) {
    const sign = state === "first" ? -1 : 1;
    const lens = [];
    for (const v of sweep(m405.RANGE[1], 6, m405.RANGE[0])) {
      const P = m405.bight(v, state);
      const u = m405.direction(v, state);
      const end = [m405.F1[0] + m405.L * u[0], m405.F1[1] + m405.L * u[1]];
      near(dist2(P, m405.F2) + dist2(end, P), m405.L - 2 * m405.A, 1e-9, "繩長 = 尺長 − 2a");
      const pose = def.pose(v, state);
      lens.push(polylineLength(pose.paths.string.points));
      const q = pose.parts.ruler.rotation;
      const ex = quatRotate(q, [1, 0, 0]);
      near(ex[0] * u[0] + ex[1] * u[1], 1, 1e-9, "尺邊沿尺的方向(翻面以尺邊為軸)");
      const body = quatRotate(q, [0, -1, 0]); // 尺身那一側
      assert.ok(sign * body[0] > 0.5, `${state}:尺身在${sign < 0 ? "左" : "右"}`);
      assert.ok(body[0] * (m405.F2[0] - P[0]) + body[1] * (m405.F2[1] - P[1]) < 0, "繩的銷在尺身的另一側,繩不橫過尺身");
      assert.ok(sign * P[0] > 0, "各畫半條");
    }
    // 折線含繞過鉛筆的那段弧:繩在鉛筆上繞的角度隨尺的方向變,折線長度的變化不超過繞半圈(繃直的部分守恆:上面那一行)
    assert.ok(Math.max(...lens) - Math.min(...lens) < Math.PI * pt.WRAP_R + 0.02, `繩的折線長度不變(${Math.min(...lens)}–${Math.max(...lens)})`);
  }
});

test("第 405 種:尺平放在紙上、樞軸銷穿過尺端的孔插在焦點上;鉛筆尖在紙上、繩貼著尺邊、繞過鉛筆、套在下焦點的銷上", () => {
  const def = m405.default;
  const top = paperTop(def);
  const ruler = part(def, "ruler");
  assert.equal(ruler.shape.holes.length, 1);
  for (const p of ruler.shape.holes[0]) assert.ok(pointInPolygon(p, ruler.shape.outline), "樞軸孔整個在尺的外形裡");
  const holeR = Math.hypot(...ruler.shape.holes[0][0]);
  const pin = part(def, "pivot");
  near(dist2(pin.center, m405.F1), 0, 1e-9, "樞軸銷在上焦點");
  assert.ok(pin && pin.radius < holeR && pin.radius > holeR - 0.02, "樞軸銷在尺的孔裡(有一點間隙)");
  for (const state of ["first", "second"]) {
    for (const v of [m405.RANGE[0], 0.25, m405.RANGE[1]]) {
      const pose = def.pose(v, state);
      const r = pose.parts.ruler;
      near(r.position[2] - ruler.thickness / 2, top, 1e-9, "尺平放在紙上");
      near(r.position[0], m405.F1[0], 1e-12, "尺繞上焦點轉");
      near(r.position[1], m405.F1[1], 1e-12, "尺繞上焦點轉");
      assert.ok(pin.center[2] - pin.length / 2 < top && pin.center[2] + pin.length / 2 > top + ruler.thickness, "樞軸銷穿過尺、插進紙");
      near(tipZ(def, pose), top, 1e-9, "鉛筆尖在紙面上");
      const P = m405.bight(v, state);
      const u = m405.direction(v, state);
      const off = (p) => Math.abs((p[0] - P[0]) * u[1] - (p[1] - P[1]) * u[0]); // 離尺邊的距離
      const pencil = pose.parts.pencil.position;
      near(off(pencil), pt.PEN_OFF, 1e-9, "鉛筆軸線離尺邊 = 繩的直徑 + 繩繞鉛筆的半徑");
      const pts = pose.paths.string.points;
      near(off(pts[0]), pt.EDGE_GAP, 1e-9, "繩繫在尺端、貼著尺邊");
      near(off(pts[1]), pt.EDGE_GAP, 1e-9, "繩沿尺邊到鉛筆");
      near(dist2(pts[1], pencil), pt.WRAP_R, 1e-9, "繩繞過鉛筆");
      near(dist2(pts[pts.length - 1], m405.F2), pt.PIN_R + pt.EDGE_GAP, 1e-9, "繩套在下焦點的銷上");
      for (const p of pts) near(p[2], pt.THREAD_Z, 1e-12, "繩平放在紙上");
    }
  }
});

test("第 406 種:拋物線:直尺的邊與準線重合、角尺的尺座靠著直尺、尺葉與軸平行;鉛筆到焦點的距離等於到準線的距離,繩長 = 尺葉長", () => {
  const def = m406.default;
  const edge = part(def, "straightedge");
  const seLow = Math.min(...edge.shape.outline.map((p) => p[1])) + (edge.center?.[1] ?? 0);
  near(seLow, m406.DIRECTRIX, 1e-9, "直尺近側的邊與準線重合");
  for (const state of ["first", "second"]) {
    const sign = state === "first" ? -1 : 1;
    for (const v of sweep(m406.RANGE[1], 6, m406.RANGE[0])) {
      const P = m406.bight(v, state);
      near(dist2(P, m406.FOCUS), m406.DIRECTRIX - P[1], 1e-9, "到焦點 = 到準線");
      near(dist2(P, m406.FOCUS) + (P[1] - (m406.DIRECTRIX - m406.BLADE)), m406.BLADE, 1e-9, "繩長 = 尺葉長");
      assert.ok(sign * P[0] > 0, "各畫半條");
      const pose = def.pose(v, state);
      const q = pose.parts.square.rotation;
      const ey = quatRotate(q, [0, 1, 0]);
      near(Math.abs(ey[1]), 1, 1e-9, "尺葉與軸平行");
      const body = quatRotate(q, [-1, 0, 0]); // 尺身(尺葉本體)那一側
      assert.ok(sign * body[0] > 0.5, `${state}:尺葉本體在${sign < 0 ? "左" : "右"}`);
      assert.ok(body[0] * (m406.FOCUS[0] - P[0]) < 0, "焦點的銷在尺葉本體的另一側,繩不橫過尺葉");
      // 尺座靠著直尺:尺座的上緣貼著直尺的下緣,兩者在同一高度範圍
      const sq = part(def, "square");
      const stock = sq.pieces.find((p) => p.stock);
      const stockTop = Math.max(...stock.shape.outline.map((p) => p[1])) + (stock.at?.[1] ?? 0) + pose.parts.square.position[1];
      near(stockTop, m406.DIRECTRIX, 0.005, "尺座靠著直尺(間隙接近 0)");
      const zs = (z0, t) => [z0 - t / 2, z0 + t / 2];
      const [s0, s1] = zs(pose.parts.square.position[2] + (stock.at?.[2] ?? 0), stock.thickness);
      const [e0, e1] = zs(edge.center[2], edge.thickness);
      assert.ok(Math.min(s1, e1) - Math.max(s0, e0) > 0.04, "尺座與直尺在同一層");
    }
  }
});

test("第 406 種:角尺平放在紙上;鉛筆尖在紙上、繩貼著尺葉的邊、繞過鉛筆、套在焦點的銷上;前半條與後半條把角尺翻面", () => {
  const def = m406.default;
  assert.deepEqual(def.states.options.map((o) => o.id), ["first", "second"]);
  const top = paperTop(def);
  const pin = part(def, "pin").pieces.find((p) => p.kind === "cylinder");
  near(pin.at[0], m406.FOCUS[0], 1e-12, "銷在焦點");
  near(pin.at[1], m406.FOCUS[1], 1e-12, "銷在焦點");
  for (const state of ["first", "second"]) {
    const lens = [];
    for (const v of [m406.RANGE[0], 1, m406.RANGE[1]]) {
      const pose = def.pose(v, state);
      const sq = part(def, "square");
      for (const piece of sq.pieces) near(pose.parts.square.position[2] + (piece.at?.[2] ?? 0) - piece.thickness / 2, top, 1e-9, "角尺平放在紙上");
      near(tipZ(def, pose), top, 1e-9, "鉛筆尖在紙面上");
      const P = m406.bight(v, state);
      const off = (p) => Math.abs(p[0] - P[0]); // 離尺葉邊(x = P.x 的垂直線)的距離
      const pencil = pose.parts.pencil.position;
      near(off(pencil), pt.PEN_OFF, 1e-9, "鉛筆軸線離尺葉的邊 = 繩的直徑 + 繩繞鉛筆的半徑");
      const pts = pose.paths.string.points;
      near(off(pts[0]), pt.EDGE_GAP, 1e-9, "繩繫在尺葉末端、貼著尺葉的邊");
      near(pts[0][1], m406.DIRECTRIX - m406.BLADE, 1e-9, "繩繫在尺葉的末端");
      near(dist2(pts[1], pencil), pt.WRAP_R, 1e-9, "繩繞過鉛筆");
      near(dist2(pts[pts.length - 1], m406.FOCUS), pt.PIN_R + pt.EDGE_GAP, 1e-9, "繩套在焦點的銷上");
      lens.push(polylineLength(pts));
    }
    assert.ok(Math.max(...lens) - Math.min(...lens) < Math.PI * pt.WRAP_R + 0.02, `繩的折線長度不變(${Math.min(...lens)}–${Math.max(...lens)};繞鉛筆的角度隨位置變)`);
  }
});


test("第 407 種:尖拱:拱形尺的根部垂直固定在桿上,頂端由繩拉到溝槽裡的滑塊;滑塊一移,尺彎成不同的弧", () => {
  const ks = [0.35, 0.6, 0.9, 1.2, 1.45].map((x) => m407.curvature(x));
  assert.ok(ks.every((k, i) => i === 0 || k > ks[i - 1]), "滑塊往右,繩把尺的頂端往下拉,尺彎得更厲害");
  for (const x of [0.35, 0.9, 1.45]) {
    const tip = m407.pencil(x);
    near(Math.hypot(tip[0] - x, tip[1] - (-1.55)), m407.STRING, 1e-6, "繩長不變");
    const k = m407.curvature(x);
    const base = m407.bowPoint(k, 0);
    const next = m407.bowPoint(k, 0.01);
    near(Math.atan2(next[1] - base[1], next[0] - base[0]), Math.PI / 2, 0.01, "根部與拱腳相切(直立)");
  }
  // 滑塊在中間時,尺彎成以右邊拱腳為圓心、跨度為半徑的弧,鉛筆在跨度正中(等邊尖拱的拱頂)
  near(1 / m407.curvature(0.9), 3.4, 1e-6, "等邊尖拱");
  near(m407.pencil(0.9)[0], 0, 1e-9, "拱頂在跨度的正中");
});

test("第 408 種:中心引導器靠著兩根銷推動,葉片的畫線邊始終指向同一個會聚點", () => {
  for (const psi of sweep(m408.RANGE[1], 8, m408.RANGE[0])) {
    const pose = m408.default.pose(psi);
    const { J, angle } = m408.joint(psi);
    // 畫線邊的延長線通過會聚點
    const toV = [m408.V[0] - J[0], m408.V[1] - J[1]];
    near(Math.cos(angle) * toV[1] - Math.sin(angle) * toV[0], 0, 1e-9, "畫線邊的延長線通過會聚點");
    // 兩腿的背面靠著兩根銷(銷中心到背面 ≈ 銷半徑,在腿身的另一側)
    for (const [leg, pin, side] of [["legA", m408.PINS[0], 1], ["legB", m408.PINS[1], -1]]) {
      const a = pose.parts[leg].angle;
      near(side * (Math.cos(a) * (pin[1] - J[1]) - Math.sin(a) * (pin[0] - J[0])), 0.08, 2e-3, `${leg} 的背面靠著銷`);
    }
    // 腿與葉片的夾角在接頭處鎖住
    near(pose.parts.legA.angle - pose.parts.blade.angle, m408.LEGS[0], 1e-12, "腿與葉片的夾角不變");
  }
});

test("第 409 種:比例圓規兩組尖端的距離之比,等於兩組尖端到樞軸的距離之比", () => {
  for (const [state, k] of [["same", 1], ["double", 2], ["triple", 3]]) {
    const { a, b } = m409.arms(state);
    close(b / a, k, `${state}:下尖到樞軸 / 上尖到樞軸`);
    for (const half of sweep(m409.RANGE[1], 4, m409.RANGE[0])) {
      const s = m409.spans(half, state);
      close(s.lower / s.upper, b / a, "下兩尖距 / 上兩尖距 = 到樞軸的距離比");
    }
  }
  // 兩腳交叉在樞軸上:兩腳的尖端到樞軸(原點)的距離就是 a、b
  const pose = m409.default.pose(0.3, "double");
  const { a } = m409.arms("double");
  const top = (p) => [p.position[0] - (m409.LENGTH / 2) * Math.sin(p.angle), p.position[1] + (m409.LENGTH / 2) * Math.cos(p.angle)];
  close(Math.hypot(...top(pose.parts.legA)), a, "上尖到樞軸的距離");
  assert.ok(top(pose.parts.legA)[0] > 0 && top(pose.parts.legB)[0] < 0, "兩腳交叉:上尖分在兩邊");
});

test("第 410 種:等分規無論兩夾頰相距多遠,尖頂始終在兩夾頰的正中間", () => {
  const gaps = new Set();
  for (const g of sweep(m410.RANGE[1], 24, m410.RANGE[0])) {
    const s = m410.gauge(g);
    near(s.tip[0], (s.jaws[0] + s.jaws[1]) / 2, 1e-12, "尖頂在兩夾頰的中間");
    near(Math.hypot(s.tip[0] - s.a[0], s.tip[1] - s.a[1]), m410.LINK, 1e-12, "短桿長不變");
    near(Math.hypot(s.tip[0] - s.b[0], s.tip[1] - s.b[1]), m410.LINK, 1e-12, "兩根短桿等長");
    gaps.add((s.jaws[1] - s.jaws[0]).toFixed(2));
  }
  assert.ok(gaps.size > 5, "拉到斜邊時夾頰的間距跟著改變");
});

test("第 411 種:自動記錄水平儀:輪子的圓周等於底邊;平地上擺把底邊二等分,斜面上擺朝一邊偏離", () => {
  close(2 * Math.PI * m411.WHEEL, m411.BASE, "輪子的圓周 = 三角形的底邊");
  const flat = m411.carriage(m411.RANGE[0]);
  near(flat.tilt, 0, 1e-9, "平地上台車水平");
  near(flat.offset, 0, 1e-9, "平地上擺把底邊二等分");
  // 推上坡、再推下坡:擺分別朝後、朝前偏
  const offsets = sweep(m411.RANGE[1], 60, m411.RANGE[0]).map((u) => m411.carriage(u));
  const up = offsets.reduce((m, c) => (c.tilt > m.tilt ? c : m));
  const down = offsets.reduce((m, c) => (c.tilt < m.tilt ? c : m));
  assert.ok(up.tilt > 0.1 && up.offset < -0.1, "上坡時擺朝後偏離中心");
  assert.ok(down.tilt < -0.1 && down.offset > 0.1, "下坡時擺朝前偏離中心");
  // 擺始終鉛直
  for (const c of [flat, up, down]) assert.equal(m411.default.pose(c.u).parts.pendulum.angle, 0);
  // 在平地上推過一個底邊長,輪子轉一圈,鼓輪跟著轉(由輪子帶動)
  const a = m411.carriage(m411.RANGE[0]);
  const b = m411.carriage(m411.RANGE[0] + m411.BASE * 0.1);
  near(a.wheel - b.wheel, (2 * Math.PI) * 0.1, 1e-6, "走過底邊的十分之一,輪子轉十分之一圈");
  near((a.drum - b.drum) / (a.wheel - b.wheel), m411.RATIO, 1e-12, "鼓輪由台車輪子帶動");
});

test("第 496 種:牽伸與加撚:前羅拉 B 比後羅拉 A 轉得快,把粗紗拉長;錠翼繞紗管轉,加撚並捲上", () => {
  const a = m496.spin(0.1);
  assert.ok(a.b > a.a, "B 比 A 轉得快");
  close(a.out / a.feed, m496.DRAFT, "前羅拉送出的長度是後羅拉送進的 DRAFT 倍(牽伸)");
  assert.ok(a.flyer > a.bobbin && a.bobbin > 0, "錠翼比紗管轉得快,差的轉數把紗捲上");
  const def = m496.default;
  const r = (id) => def.parts.find((p) => p.id === id).radius;
  assert.ok(r("roving") > r("drafted") && r("drafted") > r("yarn"), "通過羅拉後越來越細");
});

test("第 497 種:風扇鼓風機:扇葉轉動,空氣從中心吸進,經噴口送出", () => {
  const pose = fig497.pose(1.0);
  const pts = pose.flows[0].points;
  assert.ok(pts.some((p) => Math.hypot(p[0], p[1]) < 0.5), "空氣從中心進來");
  assert.ok(pts.some((p) => p[0] > 1.9), "從噴口送出");
});

test("第 498 種:虹吸式壓力計:受壓的一側水銀下降、另一側上升,高度差與壓力成正比", () => {
  const zero = m498.levels(0);
  close(zero.left, zero.right, "壓力為零時兩邊一樣高");
  for (const p of [1, 3, 6]) {
    const l = m498.levels(p);
    assert.ok(l.left < zero.left && l.right > zero.right, "接鍋爐那側下降、開口那側上升");
    close(l.right - l.left, p * m498.UNIT, "高度差與壓力成正比");
    close(zero.left - l.left, l.right - zero.right, "兩管腳粗細相同:一邊降多少、另一邊升多少");
  }
});

test("第 499 種:布爾登壓力計:壓力使彎管伸直,兩端經扇形段與小齒輪帶動指針", () => {
  const a = m499.bourdon(2);
  const b = m499.bourdon(8);
  assert.ok(b.r > a.r, "壓力越大,彎管越直(彎曲半徑越大)");
  close(b.r * b.span, m499.R0 * m499.bourdon(0).span, "管長不變", 1e-9);
  assert.ok(b.sector > a.sector, "管端移動推轉扇形段");
  assert.ok(b.pinion < a.pinion, "指針(小齒輪)隨之轉動");
});

test("第 501 種:水銀氣壓計:長管腳的水銀柱由大氣壓力支撐,隨氣壓升降", () => {
  const lo = m501.columns(28.5);
  const hi = m501.columns(30.5);
  assert.ok(hi.long > lo.long, "氣壓高,長管腳的水銀柱升高");
  assert.ok(hi.short < lo.short, "短管腳的水銀面下降");
  close(hi.height - lo.height, 2 * m501.SCALE, "水銀柱高度差隨氣壓(英吋)成正比");
});

test("周轉輪系的 Willis 公式:臂不轉時就是定軸輪系;末輪與臂的關係可以互推", () => {
  close(lastWheel(1, 0, -2), -2, "臂不動:末輪 = 輪系值 × 首輪");
  close(armOf(1, lastWheel(1, 0.3, -2), -2), 0.3, "由兩端輪反推臂");
  close(lastWheel(0.7, 0.7, 5), 0.7, "首輪與臂一起轉:整組像剛體");
});

test("第 495 種:Entwistle 齒輪:A 固定、三輪一樣大時,軸 D 每轉一圈,C 轉兩圈", () => {
  close(m495.wheelC(2 * Math.PI), 4 * Math.PI, "D 一圈,C 兩圈");
  close(m495.wheelC(-1), -2, "反轉亦然");
});

test("第 502 種:周轉輪系:A 固定時框架的轉動經 F、E 傳給 B;A 也轉時 B 的轉速不同;末輪也可以是與框架同心的 D", () => {
  const fixed = m502.train(1, "bFixedA");
  close(fixed.last, 1 + m502.E_AB * (0 - 1), "B = 框架 + e(A − 框架)");
  const turning = m502.train(1, "bTurningA");
  assert.notEqual(turning.last.toFixed(6), fixed.last.toFixed(6), "A 也轉時 B 的轉速不同");
  const d = m502.train(1, "dFixedA");
  assert.equal(d.which, "D");
  close(m502.E_AB, (24 * 24) / (18 * 18), "輪系值 = (A/F)(E/B)");
  // A 也轉時由副軸帶動(看得到傳動):A 與框架同向、轉速一半;A 固定時副軸拿開、夾塊鎖住 A
  const def = m502.default;
  const turn = (state) => def.pose(1, state).parts.wheelA.angle - def.pose(0, state).parts.wheelA.angle;
  close(turn("bTurningA"), 0.5, "A 以框架一半的轉速同向轉");
  close(turn("bFixedA"), 0, "A 固定");
  assert.equal(def.pose(0.3, "bTurningA").parts.counter.visible, true, "A 也轉時副軸裝上");
  assert.equal(def.pose(0.3, "bTurningA").parts.clamp.visible, false);
  assert.equal(def.pose(0.3, "bFixedA").parts.counter.visible, false, "A 固定時副軸拿開");
  assert.equal(def.pose(0.3, "bFixedA").parts.clamp.visible, true, "A 固定時夾塊鎖住 A");
});

test("第 503 種:簡單的傘齒輪周轉輪系:臂的轉動是兩個輪 C、D 的平均", () => {
  close(m503.differential(1, "fixed").arm, 0.5, "D 固定:臂轉 C 的一半");
  close(m503.differential(1, "opposite").arm, 0, "C、D 反向同速:臂不轉");
  close(m503.differential(1, "same").arm, 1, "C、D 同向同速:臂跟著轉");
});

test("第 504 種:弗格森悖論:臂轉動時 F 不轉,E 朝一個方向慢慢轉,G 朝另一個方向慢慢轉", () => {
  const turns = (x) => m504.trainToTurns(x);
  close(turns("F"), 0, "F(20 齒,與 A 同)不轉,始終指向同一方向");
  close(turns("E"), 1 / 21, "E(21 齒)與臂同向轉 1/21 圈");
  close(turns("G"), -1 / 19, "G(19 齒)與臂反向轉 1/19 圈");
  const p = m504.paradox(2 * Math.PI);
  assert.ok(p.E > 0 && p.G < 0 && Math.abs(p.F) < 1e-9, "三個輪轉向各不相同");
});

test("第 505 種:臂帶著小齒輪 B 咬正齒輪 A 與內齒輪 C;固定其中一個,另一個就被帶動", () => {
  const { A, C } = m505.TEETH;
  close(m505.wheels(1, "C").A, 1 + C / A, "C 固定:A 轉 (1 + C/A) 倍");
  close(m505.wheels(1, "A").C, 1 + A / C, "A 固定:C 轉 (1 + A/C) 倍");
  assert.equal(m505.wheels(1, "C").C, 0);
});

test("第 506 種:兩端都不固定的周轉輪系:主動軸經 a、b 與 h、g 帶動兩端,臂得到合成的(很慢的)轉動;改接法時 f 得到合成轉動", () => {
  const t = m506.train(1, "original");
  close(t.arm, (t.c + t.f) / 2, "臂 = 兩端輪的平均(c、f 一樣大)");
  assert.ok(Math.abs(t.arm) < 0.05, "兩端速度相近、方向相反,臂轉得很慢");
  const m = m506.train(1, "modified");
  close(m.arm, m.g, "改過的接法:臂跟著 g 轉");
  close(m.f, 2 * m.g - m.c, "f 是合成的結果");
});

test("第 507 種:產生極慢運動的周轉輪系:照原文的齒數,C 每轉一圈,臂轉 25,000 圈", () => {
  close(Math.abs(m507.slow(1).arm), 25000, "臂 / C = 25,000", 1e-6);
  close(Math.abs(1 / m507.C_PER_ARM), 25000, "反過來,臂轉一圈 C 只轉 1/25,000 圈", 1e-6);
});
