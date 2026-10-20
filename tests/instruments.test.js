// 第十七章「繪圖儀器」與第二十二章「儀錶與周轉輪系」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, plateLayers, inSolid, polyGap, turned, pieceBox, assertOnePiece, assertShaftInBearings } from "./helpers.js";
import { quatRotate, quatMul, quatFromZ, quatAxisAngle, partPoint, add, sub, scale, norm, dot, dist } from "../models/kit.js";
import { pointInPolygon, placeOutline, edgeDistance } from "../models/contact.js";
import * as pt from "../models/pencil-thread.js";
import { pathLength } from "../models/flow.js";
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


// 零件裡的旋轉體(沿 z 的軸):剖面的半徑與深度範圍(世界座標)
const latheBands = (p) =>
  [p, ...(p.pieces ?? [])]
    .filter((q) => q.kind === "lathe" && !q.axis)
    .map((q) => {
      const oz = (p.center?.[2] ?? 0) + (q === p ? 0 : q.at?.[2] ?? 0);
      const rs = q.profile.map(([r]) => r);
      const zs = q.profile.map(([, z]) => oz + z);
      return { r0: Math.min(...rs), r1: Math.max(...rs), z0: Math.min(...zs), z1: Math.max(...zs) };
    });

test("第 500 種(剖面圖):碟片 A 與錶面平行、幾乎和錶殼一樣大,裝在錶殼後半;邊緣夾在前後兩半錶殼之間", () => {
  const discA = part(fig500, "discA");
  const axis = discA.axis ?? [0, 0, 1];
  assert.ok(Math.abs(axis[2]) > 1 - 1e-9, "碟片的軸沿錶的軸線:碟片與錶面平行");
  const front = plateLayers(part(fig500, "caseFront"));
  const dialBack = Math.max(...front.map((l) => l.z0));
  assert.ok(discA.center[2] < dialBack - 0.5, "碟片在錶殼後半,離錶面很遠");
  const rim = latheBands(part(fig500, "rim"))[0];
  const flex = Math.max(...discA.profile.map(([r]) => r));
  close(rim.r0, flex, "會變形的部分接在夾住的邊緣上", 1e-6);
  assert.ok(flex > 0.75 * rim.r1, "碟片幾乎和錶殼一樣大");
  const touches = (id, face) =>
    latheBands(part(fig500, id)).some((b) => Math.abs((face === "front" ? b.z0 : b.z1) - (face === "front" ? rim.z1 : rim.z0)) < 1e-9 && b.r0 < rim.r1 && b.r1 > rim.r0);
  assert.ok(touches("caseFront", "front"), "前殼的內凸緣貼著邊緣的正面");
  assert.ok(touches("caseBack", "back"), "後殼的內凸緣貼著邊緣的背面");
});

test("第 500 種:碟片在壓力下往前拱,但全程在錶面後面(不穿過刻度環、不凸出錶面)", () => {
  const discA = part(fig500, "discA");
  assert.ok(Math.abs((discA.axis ?? [0, 0, 1])[2]) > 1 - 1e-9, "碟片與錶面平行");
  const dialBack = Math.max(...plateLayers(part(fig500, "caseFront")).map((l) => l.z0));
  const top = Math.max(...discA.profile.map(([, z]) => z));
  let last = -Infinity;
  for (const p of sweep(10, 20)) {
    const s = fig500.pose(p).parts.discA.scale?.[2] ?? 1;
    const front = discA.center[2] + s * top;
    assert.ok(front >= last, `壓力 ${p}:壓力越大碟片拱得越前`);
    last = front;
    assert.ok(front < dialBack - 0.3, `壓力 ${p}:碟片最前面 ${front.toFixed(3)} 在錶面(背面 ${dialBack})後面`);
  }
});

test("第 500 種:碟片的變形把運動傳給扇形段 e——凸柱前端的眼勾住 e 的尾鉤:銷全程貼著長孔的兩壁、不穿入", () => {
  const boss = part(fig500, "boss");
  const eye = boss.pieces.find((q) => q.kind === "plate" && q.shape.holes.length);
  const sector = part(fig500, "sector");
  const pin = sector.pieces.find((q) => q.kind === "cylinder" && !q.inner);
  const slot = eye.shape.holes[0];
  for (const p of sweep(10, 20)) {
    const pose = fig500.pose(p).parts;
    assert.deepEqual(pose.boss.position.slice(0, 2), [0, 0], "凸柱沿錶的軸線前後動");
    const c = partPoint(sector.center, sector.axis, pose.sector.angle, pin.at);
    const eyeAt = add(eye.at, pose.boss.position);
    // 眼的板平行扇形段(局部 X = 世界 −Z、局部 Y = 世界 Y)
    const local = [-(c[2] - eyeAt[2]), c[1] - eyeAt[1]];
    assert.ok(pointInPolygon(local, slot), `壓力 ${p}:銷在眼的長孔裡`);
    const gap = edgeDistance(local, slot) - pin.radius;
    assert.ok(Math.abs(gap) < 1e-6, `壓力 ${p}:銷貼著長孔的壁(間隙 ${gap.toFixed(4)})`);
    const xs = [c[0] - pin.length / 2, c[0] + pin.length / 2];
    assert.ok(xs[0] < eyeAt[0] - eye.thickness / 2 && xs[1] > eyeAt[0] + eye.thickness / 2, "銷穿過眼的板");
  }
});

test("第 500 種:扇形段 e 與指針心軸上的小齒輪以傘齒相咬——兩軸垂直相交,節圓上的線速度相等", () => {
  const sector = part(fig500, "sector");
  const pinion = part(fig500, "pinion");
  assert.ok(sector.cone && pinion.cone, "兩個都是傘齒輪");
  assert.ok(Math.abs(dot(sector.axis, pinion.axis)) < 1e-9, "兩軸垂直:扇形段的軸平行錶面");
  close(sector.center[1], 0, "扇形段的軸和心軸相交", 1e-9);
  const a = gauge(2);
  const b = gauge(6);
  close(Math.abs(b.pinion - a.pinion) * pinion.radius, Math.abs(b.sector - a.sector) * sector.radius, "節圓上的線速度相等", 1e-9);
});

test("第 500 種:小齒輪的心軸與扇形段都有樞軸:心軸前端穿過錶面中央的圓板、後端轉在支架的軸承裡,扇形段套在樞銷上", () => {
  const caseFront = part(fig500, "caseFront").pieces;
  const pinion = part(fig500, "pinion");
  const spindle = pinion.pieces.find((q) => q.kind === "cylinder");
  const at = partPoint(pinion.center, pinion.axis, 0, spindle.at);
  const bearings = caseFront.filter((q) => q.kind === "cylinder" && q.inner && q.inner < 0.1); // 錶殼的圓筒壁不算
  assertShaftInBearings({ at, axis: [0, 0, 1], radius: spindle.radius, length: spindle.length }, bearings, "指針的心軸");
  assert.ok(bearings.length >= 2, "心軸前後各一個軸承");
  const sector = part(fig500, "sector");
  const pin = caseFront.find((q) => q.kind === "cylinder" && !q.inner && q.axis && Math.abs(q.at[1] - sector.center[1]) < 1e-9 && Math.abs(q.at[2] - sector.center[2]) < 1e-9);
  assert.ok(pin, "扇形段的軸上有固定在錶殼支架上的樞銷");
  const hub = sector.pieces.find((q) => q.kind === "cylinder" && q.inner);
  assertShaftInBearings(pin, [{ ...hub, axis: sector.axis, at: sector.center }], "扇形段的樞銷");
});

// ── 第十七章「繪圖儀器」(第 403–411 種) ──

const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) < eps, `${msg} 期望 ${b},實際 ${a}`);
const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const paperTop = (def) => {
  const p = part(def, "paper");
  return p.center[2] + (p.kind === "box" ? p.size[2] : p.thickness) / 2;
};
// 旋轉體(鉛筆、紗管)在局部高度 z 處的外半徑(剖面各段在 z 的內插取最大;水平段取兩端)
const latheRadiusAt = (profile, z) =>
  Math.max(
    0,
    ...profile.slice(1).flatMap((b, i) => {
      const a = profile[i];
      if (a[1] === b[1]) return a[1] === z ? [a[0], b[0]] : [];
      if ((z - a[1]) * (z - b[1]) > 0) return [];
      return [a[0] + ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1])];
    }),
  );
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
    near(pathLength(pts), m404.LENGTH, 0.01, "路徑的長 = 桿長");
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
      lens.push(pathLength(pose.paths.string.points));
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
      lens.push(pathLength(pts));
    }
    assert.ok(Math.max(...lens) - Math.min(...lens) < Math.PI * pt.WRAP_R + 0.02, `繩的折線長度不變(${Math.min(...lens)}–${Math.max(...lens)};繞鉛筆的角度隨位置變)`);
  }
});


test("第 407 種:尖拱:拱形尺的根部垂直固定在桿上,頂端由繩拉到溝槽裡的滑塊;滑塊一移,尺彎成不同的弧", () => {
  const ks = [0.35, 0.6, 0.9, 1.2, 1.45].map((x) => m407.curvature(x));
  assert.ok(ks.every((k, i) => i === 0 || k > ks[i - 1]), "滑塊往右,繩把尺的頂端往下拉,尺彎得更厲害");
  for (const x of [0.35, 0.9, 1.45]) {
    const tip = m407.pencil(x);
    near(Math.hypot(tip[0] - x, tip[1] - m407.PIN_Y), m407.STRING, 1e-6, "繩長不變");
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

test("第 407 種:滑塊帶著銷,繩圈套在銷上:銷立在溝槽裡的滑塊上、從水平桿前面伸出,繩的下端就在銷上", () => {
  const slider = part(m407.default, "slider");
  const body = slider.pieces.find((p) => p.kind === "box");
  const pin = slider.pieces.find((p) => p.kind === "cylinder");
  assert.ok(Math.abs(pin.at[1] - body.at[1]) <= body.size[1] / 2 - pin.radius, "銷穿在滑塊本體裡(y 在滑塊的範圍內)");
  const bar = part(m407.default, "frame").pieces[0];
  assert.ok(pin.at[2] + pin.length / 2 > bar.thickness / 2 + 0.05, "銷從水平桿的前面伸出");
  for (const x of [m407.RANGE[0], 0.9, m407.RANGE[1]]) {
    const end = m407.default.pose(x).paths.string.points.at(-1);
    near(end[0], x, 1e-12, "繩的下端跟著滑塊");
    near(end[1], pin.at[1], 1e-12, "繩的下端在銷的軸線上");
    assert.ok(end[2] > bar.thickness / 2 && end[2] < pin.at[2] + pin.length / 2, "繩套在銷伸出水平桿前面的那一段");
  }
});

test("第 408 種:接頭是實心的圓盤,葉片的畫線邊與兩腿的背面在圓盤中心相交;葉片的固定銷在葉片上", () => {
  const joint = part(m408.default, "joint");
  const disc = joint.pieces.find((p) => p.kind === "plate");
  assert.ok(pointInPolygon([0, 0], disc.shape.outline) && !disc.shape.holes.some((h) => pointInPolygon([0, 0], h)), "接頭中心(三條線相交處)在圓盤的實體上");
  const mark = joint.pieces.find((p) => p.kind === "cylinder" && p.accent);
  near(Math.hypot(mark.at[0], mark.at[1]), 0, 1e-12, "中心記號在接頭中心");
  assert.ok(Math.abs(mark.at[2] - disc.at[2]) < disc.thickness / 2 + mark.length / 2, "中心記號插在圓盤上");
  for (const p of joint.pieces) if (p !== disc) assert.ok(pointInPolygon([p.at[0], p.at[1]], disc.shape.outline), `接頭上的 ${p.kind} 都落在圓盤上`);
  const blade = part(m408.default, "blade");
  const plate = blade.pieces.find((p) => p.kind === "plate");
  const pin = blade.pieces.find((p) => p.kind === "cylinder");
  assert.ok(pointInPolygon([pin.at[0], pin.at[1]], plate.shape.outline), "固定銷在葉片的板上");
  assert.ok(Math.abs(pin.at[2] - plate.at[2]) < plate.thickness / 2 + pin.length / 2, "固定銷插進葉片");
});

test("第 409 種:腳上的刻度指出比例(樞軸在刻線上時就是那個比例),刻線貼在各自的腳上;滑塊有固定螺絲", () => {
  for (const id of ["legA", "legB"]) {
    const leg = part(m409.default, id);
    const plate = leg.pieces.find((p) => p.kind === "plate");
    const ticks = leg.pieces.filter((p) => p.kind === "box");
    const face = (plate.at?.[2] ?? 0) + plate.thickness / 2;
    for (const t of ticks) near(t.at[2] - t.size[2] / 2, face, 1e-9, `${id} 的刻線貼在這隻腳的正面`);
    for (const [state, k] of [["same", 1], ["double", 2], ["triple", 3]]) {
      const p = m409.LENGTH / 2 - m409.arms(state).a; // 樞軸在腳上的局部 y
      assert.ok(ticks.some((t) => Math.abs(t.at[1] - p) < 1e-9), `${id}:比例 1 : ${k} 的樞軸位置有刻線`);
    }
  }
  const slider = part(m409.default, "slider");
  const front = slider.pieces.find((p) => p.kind === "plate");
  const screw = slider.pieces.find((p) => p.kind === "cylinder" && p.accent && Math.hypot(p.at[0], p.at[1]) > 0);
  assert.ok(screw, "滑塊上有固定螺絲(偏離樞軸)");
  assert.ok(Math.hypot(screw.at[0], screw.at[1]) + screw.radius < 0.24, "固定螺絲在滑塊的板上");
  assert.ok(screw.at[2] - screw.length / 2 < front.at[2] + front.thickness / 2, "固定螺絲鎖進滑塊的板");
});

test("第 410 種:兩根短桿在接點上下相疊,尖頂當成銷穿過兩個軸眼;夾頰的耳片以銷接短桿", () => {
  const linkA = part(m410.default, "linkA");
  const linkB = part(m410.default, "linkB");
  const tip = part(m410.default, "tip");
  const zs = tip.profile.map(([, z]) => z);
  for (const g of sweep(m410.RANGE[1], 8, m410.RANGE[0])) {
    const pose = m410.default.pose(g).parts;
    const ya = pose.linkA.to[1];
    const yb = pose.linkB.to[1];
    assert.ok(Math.abs(ya - yb) >= (linkA.thickness + linkB.thickness) / 2 - 1e-9, "兩根短桿不在同一層(上下相疊)");
    assert.ok(Math.abs(ya - yb) <= (linkA.thickness + linkB.thickness) / 2 + 1e-9, "兩個軸眼貼著疊");
    const top = pose.tip.position[1] + Math.max(...zs);
    const bottom = pose.tip.position[1] + Math.min(...zs);
    const lo = Math.min(ya, yb) - linkA.thickness / 2;
    const hi = Math.max(ya, yb) + linkB.thickness / 2;
    assert.ok(bottom <= lo && top >= hi, "尖頂的軸穿過兩個軸眼");
    const r = Math.max(...tip.profile.filter(([, z]) => z + pose.tip.position[1] > lo && z + pose.tip.position[1] < hi).map(([rr]) => rr));
    assert.ok(r < linkA.width / 2, "穿過軸眼那一段比軸眼細(是銷,不是和軸眼同粗的柱)");
  }
  // 夾頰的耳片上各有一根銷,穿過短桿的另一端
  const pinOf = (id) => part(m410.default, id).pieces.find((p) => p.kind === "cylinder" && p.axis?.[1] === 1 && p.radius < 0.05);
  const s = m410.gauge(0);
  const pose = m410.default.pose(0).parts;
  const pinA = pinOf("bar");
  const pinB = pinOf("jaw");
  near(pose.bar.position[0] + pinA.at[0], s.a[0], 1e-9, "固定夾頰的銷在短桿 A 的樞軸上");
  near(pose.jaw.position[0] + pinB.at[0], s.b[0], 1e-9, "活動夾頰的銷在短桿 B 的樞軸上");
  assert.ok(pinA.at[1] - pinA.length / 2 < pose.linkA.from[1] && pinA.at[1] + pinA.length / 2 > pose.linkA.from[1], "銷穿過短桿 A 的軸眼");
  assert.ok(pinB.at[1] - pinB.length / 2 < pose.linkB.from[1] && pinB.at[1] + pinB.length / 2 > pose.linkB.from[1], "銷穿過短桿 B 的軸眼");
});

test("第 410 種:非平行的木料:放開一個夾頰(翼形螺絲轉鬆、升起),但它仍貼著木料", () => {
  const locked = m410.default.pose(-2.0);
  const loose = m410.default.pose(2.0);
  const lift = (pose) => pose.parts.wingScrew.position[1] - pose.parts.jaw.position[1];
  near(lift(locked), m410.SCREW_REST, 1e-9, "平行段:翼形螺絲鎖緊");
  assert.ok(lift(loose) > m410.SCREW_REST + 0.05, "斜邊段:翼形螺絲升起(放開)");
  assert.ok(Math.abs(loose.parts.wingScrew.angle - locked.parts.wingScrew.angle) > 1, "翼形螺絲轉鬆");
  assert.equal(locked.readouts.find((r) => r.label === "活動夾頰").value, "鎖住");
  assert.equal(loose.readouts.find((r) => r.label === "活動夾頰").value, "放開");
  for (const g of [1.0, 2.0, m410.RANGE[1]]) {
    const pose = m410.default.pose(g).parts;
    near(pose.jaw.position[0], m410.EDGE + m410.width(g), 1e-12, "放開的夾頰仍貼著木料的斜邊");
  }
});

test("第 411 種:鼓輪與傘齒輪離地:台車走過上坡起點、下坡終點這些凹處時,鼓面全程不陷進地面", () => {
  const drum = part(m411.default, "drum");
  const barrel = drum.pieces.find((p) => p.kind === "drum");
  const bevel = drum.pieces.find((p) => p.kind === "bevel");
  let min = Infinity;
  for (const u of sweep(m411.RANGE[1], 400, m411.RANGE[0])) {
    const c = m411.carriage(u);
    // 鼓輪軸沿底邊(局部 x);圓筒最低點在軸下方 r 處(沿台車的法線)
    const low = (xl, r) => {
      const ax = c.mid[0] + xl * Math.cos(c.tilt);
      const ay = c.mid[1] + xl * Math.sin(c.tilt);
      return ay - r * Math.cos(c.tilt) - m411.ground(ax + r * Math.sin(c.tilt));
    };
    for (let xl = -barrel.width / 2; xl <= barrel.width / 2 + 1e-9; xl += 0.05) min = Math.min(min, low(xl, barrel.radius));
    min = Math.min(min, low(bevel.at[2], bevel.radius));
  }
  assert.ok(min > 0.03, `鼓面與傘齒輪全程離地(最小距離 ${min.toFixed(3)})`);
});

test("第 411 種:車架沒有東西伸進車輪轉過的範圍(鼓輪軸的軸承橫桿在輪子半徑之外)", () => {
  const wheel = part(m411.default, "rearWheels").pieces.find((p) => p.kind === "pulley");
  const zw = [Math.abs(wheel.at[2]) - wheel.width / 2, Math.abs(wheel.at[2]) + wheel.width / 2];
  for (const piece of part(m411.default, "frame").pieces) {
    const half = piece.kind === "box" ? [piece.size[0] / 2, piece.size[1] / 2, piece.size[2] / 2] : piece.kind === "cylinder" ? [piece.radius, piece.radius, piece.length / 2] : null;
    if (!half) continue;
    const z = [Math.abs(piece.at[2]) - half[2], Math.abs(piece.at[2]) + half[2]];
    if (z[1] < zw[0] || z[0] > zw[1]) continue; // 不在車輪的平面上
    for (const cx of [-m411.BASE / 2, m411.BASE / 2]) {
      const dx = Math.max(0, Math.abs(cx - piece.at[0]) - half[0]);
      const dy = Math.max(0, Math.abs(0 - piece.at[1]) - half[1]);
      assert.ok(Math.hypot(dx, dy) > m411.WHEEL, `車架的 ${piece.kind}(x ${piece.at[0]})離輪心 ${Math.hypot(dx, dy).toFixed(3)},在輪子半徑 ${m411.WHEEL.toFixed(3)} 之內`);
    }
  }
});

test("第 411 種:鼓輪由其中一個台車輪子經傘齒輪帶動:兩個傘齒輪錐頂共點、齒距相同,轉速比等於齒數比", () => {
  const small = part(m411.default, "rearWheels").pieces.find((p) => p.kind === "bevel");
  const big = part(m411.default, "drum").pieces.find((p) => p.kind === "bevel");
  // 小傘齒輪在後輪軸上(軸沿 z,錐頂在 z = 0),大傘齒輪在鼓輪軸上(軸沿 x,錐頂在後輪軸上):
  // 小輪的節圓在 z = small.at[2]、半徑 small.radius;大輪的節圓在 x = 軸心 + big.at[2](鼓輪零件的局部 z 是世界 x)
  near(small.at[2], big.radius, 1e-9, "小傘齒輪的節圓離後輪軸的距離 = 大傘齒輪的半徑(錐頂共點)");
  near(big.at[2] + m411.BASE / 2, small.radius, 1e-9, "大傘齒輪的節圓離後輪軸的距離 = 小傘齒輪的半徑(錐頂共點)");
  near(small.radius / small.teeth, big.radius / big.teeth, 1e-9, "兩輪的齒距相同(咬得上)");
  near(m411.RATIO, small.teeth / big.teeth, 1e-12, "鼓輪轉速 / 輪子轉速 = 齒數比");
  const a = m411.carriage(m411.RANGE[0]);
  const b = m411.carriage(m411.RANGE[0] + m411.BASE * 0.1);
  near((a.drum - b.drum) / (a.wheel - b.wheel), small.teeth / big.teeth, 1e-12, "鼓輪照齒數比跟著輪子轉");
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

// 第 496 種:羅拉的半徑、軸頸(群組零件的 pulley 附件與軸頸圓柱)
const roller496 = (def, id) => {
  const p = part(def, id);
  const disc = p.pieces?.find((q) => q.kind === "pulley") ?? p;
  return { center: p.center, radius: disc.radius, width: disc.width, journal: p.pieces?.find((q) => q.kind === "cylinder") };
};
// 折線每段切成細點
const densify = (pts, step) =>
  pts.slice(1).flatMap((b, i) => {
    const a = pts[i];
    const n = Math.max(1, Math.ceil(dist(a, b) / step));
    return Array.from({ length: n + 1 }, (_, k) => a.map((c, j) => c + ((b[j] - c) * k) / n));
  });

test("第 496 種:夾口處羅拉表面和粗紗、紗同向同速——A 夾著粗紗、B 夾著牽伸後的紗往紗錠(右)送", () => {
  const def = m496.default;
  const dv = 1e-4;
  for (const v of sweep(0.9, 9)) {
    const [p, q] = [def.pose(v), def.pose(v + dv)];
    // 材料沿路徑從起點往終點走,速度是 phase 的變化;方向取夾口處路徑的切線
    const roving = p.paths.roving.points;
    const drafted = p.paths.drafted.points;
    const yarn = p.paths.yarn.points;
    const feed = scale(norm(sub(roving.at(-1), roving.at(-2))), (q.paths.roving.phase - p.paths.roving.phase) / dv);
    const out = scale(norm(sub(drafted.at(-1), drafted.at(-2))), (q.paths.drafted.phase - p.paths.drafted.phase) / dv);
    close(q.paths.yarn.phase - p.paths.yarn.phase, q.paths.drafted.phase - p.paths.drafted.phase, "出了 B 的紗和夾在 B 裡的同速", 1e-12);
    assert.ok(feed[0] > 0 && out[0] > 0 && yarn[1][0] > yarn[0][0], `進程 ${v.toFixed(2)}:粗紗與紗往右(往紗錠)走`);
    for (const [id, nip, material] of [["aTop", roving.at(-1), feed], ["aBottom", roving.at(-1), feed], ["bTop", drafted.at(-1), out], ["bBottom", drafted.at(-1), out]]) {
      const { center, radius } = roller496(def, id);
      close(dist(nip, center), radius, `${id} 的表面經過夾口`, 1e-9);
      // 剛體繞 z 轉 dθ(逆時針為正):點 (x, y) 的速度是 dθ·(−y, x)
      const w = (q.parts[id].angle - p.parts[id].angle) / dv;
      const surface = [-w * (nip[1] - center[1]), w * (nip[0] - center[0]), 0];
      close(dist(surface, material), 0, `進程 ${v.toFixed(2)}:${id} 在夾口的表面速度 (${surface.map((c) => c.toFixed(3))}) 和材料 (${material.map((c) => c.toFixed(3))}) 同向同速`, 1e-6);
    }
  }
});

test("第 496 種:紗從夾口沿下前羅拉右側繞下、進錠翼頂、沿一臂下到導眼,再切線捲上紗管;全程不穿過羅拉、紗管與錠子", () => {
  const def = m496.default;
  const flyer = part(def, "flyer");
  const bobbin = part(def, "bobbin");
  const spindle = flyer.pieces.find((q) => q.kind === "cylinder" && !q.inner);
  const eyes = flyer.pieces.filter((q) => q.role === "eye");
  const axisX = flyer.center[0];
  const radial = (pt) => Math.hypot(pt[0] - axisX, pt[2] - flyer.center[2]);
  const spindleY = [spindle.at[2] - spindle.length / 2, spindle.at[2] + spindle.length / 2].map((h) => flyer.center[1] + h);
  const bobbinH = bobbin.profile.map((q) => q[1]);
  const [b0, b1] = [Math.min(...bobbinH), Math.max(...bobbinH)].map((h) => bobbin.center[1] + h);
  for (const v of sweep(1, 97)) {
    const pose = def.pose(v);
    const pts = pose.paths.yarn.points;
    for (const pt of densify(pts, 0.005)) {
      for (const id of ["aTop", "aBottom", "bTop", "bBottom"]) {
        const { center, radius, width } = roller496(def, id);
        if (Math.abs(pt[2] - center[2]) > width / 2) continue;
        const d = Math.hypot(pt[0] - center[0], pt[1] - center[1]);
        assert.ok(d > radius - 0.005, `進程 ${v.toFixed(2)}:紗的中心線沒穿進 ${id}(離軸 ${d.toFixed(3)},半徑 ${radius})`);
      }
      if (pt[1] > b0 && pt[1] < b1) {
        const r = latheRadiusAt(bobbin.profile, pt[1] - bobbin.center[1]);
        assert.ok(radial(pt) > r - 0.005, `進程 ${v.toFixed(2)}:紗的中心線沒穿進紗管(高 ${pt[1].toFixed(2)} 離軸 ${radial(pt).toFixed(3)},紗管半徑 ${r})`);
      }
      if (pt[1] > spindleY[0] && pt[1] < spindleY[1]) assert.ok(radial(pt) > spindle.radius, `進程 ${v.toFixed(2)}:紗沒穿過錠子`);
    }
    // 紗穿過一個導眼:有一個頂點落在導眼的孔裡
    const eyeAt = eyes.map((e) => partPoint(flyer.center, flyer.axis, pose.parts.flyer.angle, e.at));
    assert.ok(
      pts.some((pt) => eyes.some((e, i) => Math.hypot(pt[0] - eyeAt[i][0], pt[2] - eyeAt[i][2]) < e.inner - 0.02 && Math.abs(pt[1] - eyeAt[i][1]) < 0.1)),
      `進程 ${v.toFixed(2)}:紗穿過錠翼臂下端的導眼`,
    );
    // 捲上紗管:終點在筒身表面,最後一段和筒身相切(與紗管轉角無關)
    const [prev, last] = pts.slice(-2);
    close(radial(last), latheRadiusAt(bobbin.profile, last[1] - bobbin.center[1]), `進程 ${v.toFixed(2)}:紗的終點在紗管筒身表面`, 1e-9);
    const outward = [last[0] - axisX, 0, last[2] - flyer.center[2]];
    close(dot(norm(sub(last, prev)), norm(outward)), 0, `進程 ${v.toFixed(2)}:最後一段紗和紗管筒身相切`, 1e-9);
  }
  assert.equal(eyes.length, 2, "錠翼兩臂下端各有一個導眼(原圖兩臂下端的圈)");
});

test("第 496 種:四根羅拉由機器帶動(列為外力來源,不靠紗拉著轉),軸頸裝在兩端羅拉座的軸承裡", () => {
  const def = m496.default;
  const frame = part(def, "frame");
  const world = frame.pieces.map((q) => ({ ...q, at: add(frame.center ?? [0, 0, 0], q.at ?? [0, 0, 0]) }));
  for (const id of ["aTop", "aBottom", "bTop", "bBottom"]) {
    assert.ok(def.powered.includes(id), `${id} 列為外力來源`);
    const { center, journal, width } = roller496(def, id);
    assert.ok(journal, `${id} 有軸頸`);
    const shaft = { at: add(center, journal.at ?? [0, 0, 0]), axis: [0, 0, 1], radius: journal.radius, length: journal.length };
    assertShaftInBearings(shaft, world, `${id} 的軸頸`);
    const rings = world.filter((q) => q.inner && Math.hypot(q.at[0] - center[0], q.at[1] - center[1]) < 1e-9);
    assert.ok(rings.some((q) => q.at[2] < -width / 2) && rings.some((q) => q.at[2] > width / 2), `${id} 兩端各有一個軸承`);
  }
});

test("第 496 種:錠子穿過機架上下兩個軸承座、錠盤夾在兩座之間,上座頂面托著紗管;機架(羅拉座與錠子軸承座)連成一件", () => {
  const def = m496.default;
  const frame = part(def, "frame");
  const flyer = part(def, "flyer");
  const bobbin = part(def, "bobbin");
  const toWorld = (q) => partPoint(flyer.center, flyer.axis, 0, q.at);
  const spindle = flyer.pieces.find((q) => q.kind === "cylinder" && !q.inner);
  const shaft = { at: toWorld(spindle), axis: flyer.axis, radius: spindle.radius, length: spindle.length };
  const world = frame.pieces.map((q) => ({ ...q, at: add(frame.center ?? [0, 0, 0], q.at ?? [0, 0, 0]) }));
  assertShaftInBearings(shaft, world, "錠子");
  const rings = world.filter((q) => q.inner && Math.hypot(q.at[0] - shaft.at[0], q.at[2] - shaft.at[2]) < 1e-9).sort((a, b) => a.at[1] - b.at[1]);
  assert.equal(rings.length, 2, "錠子有上下兩個軸承座(原圖兩個剖開的座)");
  const whorl = toWorld(flyer.pieces.find((q) => q.kind === "pulley"));
  assert.ok(whorl[1] > rings[0].at[1] && whorl[1] < rings[1].at[1], "錠盤在兩個軸承座之間");
  const bottom = bobbin.center[1] + Math.min(...bobbin.profile.map((q) => q[1]));
  close(bottom, rings[1].at[1] + rings[1].length / 2, "紗管底坐在上座的頂面", 1e-9);
  assertOnePiece(frame, "機架:羅拉座與錠子的軸承座連成一件");
});

test("第 497 種:風扇鼓風機:扇葉轉動,空氣從中心吸進,經噴口送出", () => {
  const pose = fig497.pose(1.0);
  const pts = pose.flows[0].points;
  assert.ok(pts.some((p) => Math.hypot(p[0], p[1]) < 0.5), "空氣從中心進來");
  assert.ok(pts.some((p) => p[0] > 1.9), "從噴口送出");
});

test("第 497 種:扇葉連同軸一起轉(the revolution of the shaft),軸穿過背板進風口裡的軸承架與後面的軸承座;外殼、底座連成一件", () => {
  const def = fig497;
  const fan = part(def, "fan");
  const casing = part(def, "casing");
  assert.ok(!def.parts.some((p) => p !== fan && p.kind === "cylinder" && !p.inner), "軸是轉的:沒有另一根固定的軸和扇葉的軸疊在一起");
  const shaft = fan.pieces.find((q) => q.kind === "cylinder");
  assertShaftInBearings({ at: shaft.at ?? [0, 0, 0], axis: [0, 0, 1], radius: shaft.radius, length: shaft.length }, casing.pieces, "扇葉的軸");
  const rings = casing.pieces.filter((q) => q.inner && Math.hypot(q.at[0], q.at[1]) < 1e-9);
  assert.ok(rings.length >= 2, "軸有兩個軸承");
  const back = casing.pieces.find((q) => q.kind === "plate" && q.shape.holes?.length);
  assert.ok(rings.some((q) => Math.abs(q.at[2] - back.at[2]) < 1e-9), "一個軸承在背板的進風口裡(原圖橫過進風口的軸承架)");
  assertOnePiece(casing, "外殼:渦形壁、背板、進風口的軸承架、底座與軸承座連成一件");
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

// 水銀填色(fill:方塊依 level 由底往上填,或 outline 的固定外形)在姿勢下的取樣點(xy)
function mercuryPoints(def, id, value) {
  const f = part(def, id);
  const [cx, cy] = f.center ?? [0, 0, 0];
  if (f.outline) {
    const pts = f.outline.map(([x, y]) => [cx + x, cy + y]);
    return [...pts, ...pts.map((p, i) => [(p[0] + pts[(i + 1) % pts.length][0]) / 2, (p[1] + pts[(i + 1) % pts.length][1]) / 2])];
  }
  const level = def.pose(value).parts[id]?.level ?? f.level ?? 0;
  const [w, h] = f.size;
  const pts = [];
  for (let i = 0; i <= 4; i++) for (let j = 0; j <= 8; j++) pts.push([cx - w / 2 + (w * i) / 4, cy - h / 2 + (level * h * j) / 8]);
  return pts;
}

// 零件裡沿 z 的板件外形(世界座標的 xy):和水銀同一層(z = 0)的玻璃管管壁,刻度板在後面一層、不算
const wallSolids = (def, ids) => ids.flatMap((id) => plateLayers(part(def, id)).filter((l) => l.z0 < 0 && l.z1 > 0).map((l) => l.solid));

// 從 q 沿 d 方向碰到的第一道管壁的距離(碰不到為 Infinity)
function rayHit(q, d, solids) {
  let best = Infinity;
  for (const s of solids)
    for (const loop of [s.outline, ...(s.holes ?? [])])
      for (let i = 0; i < loop.length; i++) {
        const a = loop[i];
        const b = loop[(i + 1) % loop.length];
        const ex = b[0] - a[0];
        const ey = b[1] - a[1];
        const den = d[0] * ey - d[1] * ex;
        if (Math.abs(den) < 1e-12) continue;
        const t = ((a[0] - q[0]) * ey - (a[1] - q[1]) * ex) / den;
        const u = ((a[0] - q[0]) * d[1] - (a[1] - q[1]) * d[0]) / den;
        if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
      }
  return best;
}

/** 點在管孔裡:不在管壁裡,而且沿某個方向往兩邊都碰到管壁、兩壁之間不超過管徑(在 U 形內側或管外都找不到這樣的方向) */
function inBore(q, solids, bore) {
  if (solids.some((s) => inSolid(q, s))) return false;
  for (let k = 0; k < 32; k++) {
    const a = (k / 32) * Math.PI;
    const d = [Math.cos(a), Math.sin(a)];
    if (rayHit(q, d, solids) + rayHit(q, [-d[0], -d[1]], solids) <= bore) return true;
  }
  return false;
}

function assertMercuryInTube(def, ids, walls, bore, values) {
  const solids = wallSolids(def, walls);
  for (const id of ids)
    for (const v of values)
      for (const q of mercuryPoints(def, id, v)) assert.ok(inBore(q, solids, bore), `主動量 ${v}:${id} 的點 (${q[0].toFixed(3)}, ${q[1].toFixed(3)}) 在管孔外`);
}

test("第 498 種:彎管的下部盛有水銀——水銀(含彎頭)畫在管孔裡;彎頭與兩管腳的管壁接成一根管", () => {
  assertMercuryInTube(m498.default, ["leftMercury", "rightMercury", "bendMercury"], ["tube", "gaugeLeg"], 2 * m498.BORE, sweep(6, 6));
  assertOnePiece(part(m498.default, "tube"), "接鍋爐那側的管腳、彎頭連成一件");
});

/** 刻度刻在刻度板上(刻度板與刻度線連成一件),刻度板貼在標刻度的管腳後面;管腳的管壁連成一件 */
function assertScaleBehind(def, legId) {
  assertOnePiece(part(def, "scale"), "刻度線刻在刻度板上");
  assertOnePiece(part(def, legId), "標刻度的管腳連成一件");
  const board = plateLayers(part(def, "scale"))[0];
  const walls = plateLayers(part(def, legId));
  assert.ok(walls.some((w) => Math.abs(w.z0 - board.z1) < 1e-9 && polyGap(w.solid.outline, board.solid.outline) === 0), "刻度板貼在管腳後面");
}

test("第 498 種:標有刻度的管腳——刻度刻在管腳後面的刻度板上", () => {
  assertScaleBehind(m498.default, "gaugeLeg");
});

test("第 499 種:布爾登壓力計:壓力使彎管伸直,兩端經扇形段與小齒輪帶動指針", () => {
  const a = m499.bourdon(2);
  const b = m499.bourdon(8);
  assert.ok(b.r > a.r, "壓力越大,彎管越直(彎曲半徑越大)");
  close(b.r * b.span, m499.R0 * m499.bourdon(0).span, "管長不變", 1e-9);
  assert.ok(b.sector > a.sector, "管端移動推轉扇形段");
  assert.ok(b.pinion < a.pinion, "指針(小齒輪)隨之轉動");
});

const fig499 = m499.default;
const path499 = (p, id) => fig499.pose(p).paths[id].points;
const cross2 = (a, b) => a[0] * b[1] - a[1] * b[0];

test("第 499 種:壓力使管子或多或少地伸直——伸直時整根彎管留在錶殼裡(不穿過殼壁)", () => {
  const ring = plateLayers(part(fig499, "case")).find((l) => l.solid.holes.length);
  const inner = Math.min(...ring.solid.holes[0].map(([x, y]) => Math.hypot(x, y)));
  const r = part(fig499, "tubeL").radius;
  for (const p of sweep(10, 20))
    for (const id of ["tubeL", "tubeR"])
      for (const q of path499(p, id)) assert.ok(Math.hypot(q[0], q[1]) + r <= inner + 1e-9, `壓力 ${p}:${id} 的點離中心 ${(Math.hypot(q[0], q[1]) + r).toFixed(3)},超過錶殼內壁 ${inner.toFixed(3)}`);
});

test("第 499 種:管子的兩端接到扇形段上——兩根拉桿長度不變;兩端往外拉,兩根拉桿給扇形段的扭矩同向、與扇形段轉向一致", () => {
  const pivot = part(fig499, "sector").center;
  const values = sweep(10, 40);
  for (const id of ["rodL", "rodR"]) {
    const ls = values.map((p) => dist2(...path499(p, id)));
    assert.ok(Math.max(...ls) - Math.min(...ls) < 0.001, `${id} 長度不變(變化 ${(Math.max(...ls) - Math.min(...ls)).toFixed(4)})`);
  }
  for (let i = 1; i < values.length; i++) {
    const [p0, p1] = [values[i - 1], values[i]];
    const turn = fig499.pose(p1).parts.sector.angle - fig499.pose(p0).parts.sector.angle;
    assert.ok(turn > 0, `壓力 ${p1}:扇形段逆時針轉`);
    for (const [rod, tube] of [["rodL", "tubeL"], ["rodR", "tubeR"]]) {
      const [end, pin] = path499(p1, rod);
      close(dist2(end, path499(p1, tube).at(-1)), 0, `${rod} 接在 ${tube} 的端點`, 1e-9);
      assert.ok(Math.abs(end[0]) > Math.abs(path499(p0, rod)[0][0]), `壓力 ${p1}:${tube} 的端點往外移`);
      // 拉桿受拉:作用在銷上的力由銷指向管端
      const torque = cross2([pin[0] - pivot[0], pin[1] - pivot[1]], [end[0] - pin[0], end[1] - pin[1]]);
      assert.ok(torque > 0, `壓力 ${p1}:${rod} 拉扇形段的方向和扇形段的轉向一致(扭矩 ${torque.toFixed(3)})`);
    }
  }
});

test("第 499 種:彎管在長度中點 C 固定——C 夾在錶殼頂的夾塊裡;扇形段與小齒輪各套在背板的樞銷 / 軸承上", () => {
  const ends = sweep(10, 10).map((p) => [path499(p, "tubeL")[0], path499(p, "tubeR")[0]]);
  for (const [l, r] of ends) {
    close(dist2(l, ends[0][0]), 0, "左半從 C 起、C 不動", 1e-9);
    close(dist2(r, ends[0][0]), 0, "右半也從 C 起", 1e-9);
  }
  const caseParts = part(fig499, "case").pieces;
  const c = ends[0][0];
  assertShaftInBearings({ at: [c[0], c[1], c[2]], axis: [1, 0, 0], radius: part(fig499, "tubeL").radius, length: 0.3 }, caseParts, "C 處的彎管");
  const sector = part(fig499, "sector");
  const pin = caseParts.find((q) => q.kind === "cylinder" && !q.inner && !q.axis && dist2(q.at, sector.center) < 1e-9);
  assert.ok(pin, "扇形段的樞軸上有插在錶殼上的樞銷");
  const world = (p, q) => ({ ...q, at: (q.at ?? [0, 0, 0]).map((v, k) => v + p.center[k]) });
  assertShaftInBearings(pin, sector.pieces.map((q) => world(sector, q)), "扇形段的樞銷");
  const pointer = part(fig499, "pointer");
  const arbor = world(pointer, pointer.pieces.find((q) => q.kind === "cylinder"));
  assertShaftInBearings(arbor, caseParts, "指針的心軸");
});

test("第 499 種:在錶盤上指示壓力——刻度刻在錶盤上(貼著錶盤正面、在錶盤的外形裡)", () => {
  const plates = plateLayers(part(fig499, "case"));
  const ticks = part(fig499, "case").pieces.filter((q) => q.kind === "box" && q.angle);
  assert.ok(ticks.length >= 11, "刻度 0–10");
  for (const t of ticks) {
    const back = t.at[2] - t.size[2] / 2;
    assert.ok(plates.some((l) => Math.abs(l.z1 - back) < 1e-9 && inSolid([t.at[0], t.at[1]], l.solid)), `刻度 (${t.at[0].toFixed(2)}, ${t.at[1].toFixed(2)}) 貼在錶盤上`);
  }
});

test("第 501 種:水銀氣壓計:長管腳的水銀柱由大氣壓力支撐,隨氣壓升降", () => {
  const lo = m501.columns(28.5);
  const hi = m501.columns(30.5);
  assert.ok(hi.long > lo.long, "氣壓高,長管腳的水銀柱升高");
  assert.ok(hi.short < lo.short, "短管腳的水銀面下降");
  close(hi.height - lo.height, 2 * m501.SCALE, "水銀柱高度差隨氣壓(英吋)成正比");
});

test("第 501 種:水銀(含彎頭)畫在管孔裡;長管腳的英吋刻度刻在刻度板上,各自連成一件", () => {
  assertMercuryInTube(m501.default, ["longMercury", "shortMercury", "bendMercury"], ["tube", "longLeg"], 2 * m501.BORE, sweep(31, 6, 28));
  assertOnePiece(part(m501.default, "tube"), "短管腳(頂上蓋多孔材料)與彎頭連成一件");
  assertScaleBehind(m501.default, "longLeg");
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

// 第 502–507 種:齒輪、傘齒輪附件當成同樣大小、沿 z 的圓柱,檢查一個零件的各塊連成一件
const asSolids = (pieces) =>
  pieces.map((q) => (["gear", "bevel"].includes(q.kind) ? { kind: "cylinder", radius: q.radius, length: q.width ?? q.height ?? 0.25, at: q.at ?? [0, 0, 0] } : q));
const onePiece = (pieces, what) => assertOnePiece({ pieces: asSolids(pieces) }, what);
// 零件在主動量 v 時的位置與朝向(與繪圖層的擺法相同:rotation,或 axis 對齊後繞它轉 angle)
function placeOf(def, id, v, state) {
  const p = part(def, id);
  const o = def.pose(v, state).parts[id] ?? {};
  return { pos: o.position ?? p.center ?? [0, 0, 0], q: o.rotation ?? quatMul(quatFromZ(p.axis ?? [0, 0, 1]), quatAxisAngle([0, 0, 1], o.angle ?? 0)) };
}
/** 零件上此刻在世界座標 P 的那一點,主動量增加時的速度(數值微分) */
function pointVelocity(def, id, v, state, P, h = 1e-6) {
  const a = placeOf(def, id, v, state);
  const b = placeOf(def, id, v + h, state);
  const local = quatRotate([-a.q[0], -a.q[1], -a.q[2], a.q[3]], P.map((c, i) => c - a.pos[i]));
  return quatRotate(b.q, local).map((c, i) => (c + b.pos[i] - P[i]) / h);
}
/** 兩個零件在接觸點 P 的表面速度相同(咬合、滾動不打滑) */
function sameSurfaceSpeed(def, idA, idB, v, state, P, what, eps = 1e-5) {
  const va = pointVelocity(def, idA, v, state, P);
  const vb = pointVelocity(def, idB, v, state, P);
  for (let i = 0; i < 3; i++) close(va[i], vb[i], `${what}:接觸點的表面速度相同(第 ${i} 分量)`, eps * Math.max(1, Math.hypot(...va)));
}
const rotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];

test("第 502 種:周轉輪系:A 固定、對框架 C 施加運動,經 F、E 傳給 B;A 也與框架以不同的速度轉時,B 的轉速不同", () => {
  const def = m502.default;
  const rate = (id, state) => turned(def, id, 0, 1, state);
  // A 固定:B − 框架 = E_AB(0 − 框架)
  const f1 = rate("frameC", "bFixedA");
  assert.ok(Math.abs(f1) > 0.1, "對框架施加運動");
  close(rate("wheelA", "bFixedA"), 0, "A 固定");
  close(rate("wheelB", "bFixedA") - f1, m502.E_AB * (0 - f1), "B 繞自身的軸轉:B − 框架 = e(A − 框架)");
  // A 也轉:第一個輪與框架以不同的速度轉(原文沒有給比例;A 為框架的一半是推斷)
  const [f2, a2, b2] = ["frameC", "wheelA", "wheelB"].map((id) => rate(id, "bTurningA"));
  assert.ok(Math.abs(a2) > 0.1 && Math.abs(a2 - f2) > 0.1, "A 與框架以不同的速度轉");
  close(b2 - f2, m502.E_AB * (a2 - f2), "結果相同:B − 框架 = e(A − 框架)");
  assert.ok(Math.abs(b2 / f2 - rate("wheelB", "bFixedA") / f1) > 0.1, "只是 B 的轉速不同");
  // 換接法:A 固定時夾塊鎖住 A、副軸上帶 A 的齒輪滑出;A 也轉時副軸上的 K2 咬 A 套筒上的 T
  const fixed = def.pose(0.3, "bFixedA").parts;
  const turning = def.pose(0.3, "bTurningA").parts;
  assert.equal(fixed.clamp.visible, true, "A 固定時夾塊鎖住 A");
  assert.equal(fixed.gearK2.visible, false, "A 固定時帶 A 的齒輪滑出");
  assert.equal(turning.clamp.visible, false);
  assert.equal(turning.gearK2.visible, true, "A 也轉時副軸帶動 A");
});

test("第 502 種:F 與 E 固定在同一根軸上(同一個零件、中間有轂);F/E 的軸銷接進框架板;副軸的支柱接到軸承", () => {
  const def = m502.default;
  const fe = part(def, "wheelFE");
  assert.ok(fe, "F、E 是同一個零件");
  assert.deepEqual(fe.pieces.filter((q) => q.kind === "gear").map((q) => q.teeth).sort((a, b) => a - b), [m502.TEETH.F, m502.TEETH.E].sort((a, b) => a - b));
  onePiece(fe.pieces, "F、轂、E 連成一件");
  const frame = part(def, "frameC");
  onePiece([{ kind: "plate", shape: frame.shape, thickness: frame.thickness }, ...frame.pieces], "框架板、中心軸、S 與兩根軸銷連成一件");
  onePiece(part(def, "counterStand").pieces, "副軸的支柱接到軸承");
});

test("第 502 種:E 改咬與框架同心的 D:把運動給臂與一個端輪,另一個端輪得到合成轉動;把運動給兩端 A、D,臂得到合成轉動", () => {
  const def = m502.default;
  const rate = (id, state) => turned(def, id, 0, 1, state);
  const ids = def.states.options.map((o) => o.id);
  for (const s of ["dFixedA", "dTurningA", "adToArm"]) assert.ok(ids.includes(s), `接法 ${s}`);
  assert.ok(Math.abs(m502.E_AD - m502.E_AB) > 0.05, "D 與 B 齒數不同,兩種輪系的轉速分得開");
  // 給臂與 A(副軸咬框架的 S 與 A 的 T):D − 框架 = E_AD(A − 框架)
  const [f, a, d] = ["frameC", "wheelA", "wheelD"].map((id) => rate(id, "dTurningA"));
  assert.ok(Math.abs(a) > 0.1 && Math.abs(a - f) > 0.1, "臂與一個端輪 A 以不同的速度被帶動");
  close(d - f, m502.E_AD * (a - f), "另一個端輪 D 得到合成轉動");
  close(rate("wheelD", "dFixedA") - rate("frameC", "dFixedA"), m502.E_AD * (0 - rate("frameC", "dFixedA")), "A 固定時同理");
  // 給兩端 A、D(副軸咬 A 的 T 與 D 套筒上的 U,不咬框架的 S):臂 = (D − e·A)/(1 − e)
  const p = def.pose(0.7, "adToArm").parts;
  assert.equal(p.gearK1.visible, false, "副軸不帶動框架");
  assert.equal(p.gearK2.visible && p.gearK3.visible, true, "副軸帶動 A 與 D");
  const [a2, d2, arm] = ["wheelA", "wheelDIn", "frameOut"].map((id) => rate(id, "adToArm"));
  assert.ok(Math.abs(a2) > 0.1 && Math.abs(d2) > 0.1 && Math.abs(a2 - d2) > 0.1, "兩端以不同的速度被帶動");
  close(arm, (d2 - m502.E_AD * a2) / (1 - m502.E_AD), "臂得到合成轉動");
  // 目標件跟著接法:D、臂各畫兩份,結果的那一份塗目標件色
  assert.equal(p.frameOut.visible && !p.frameC.visible && p.wheelDIn.visible && !p.wheelD.visible, true, "兩端輸入時,臂是結果、D 是輸入");
  assert.ok(def.targets.includes("frameOut") && !def.targets.includes("wheelDIn") && !def.targets.includes("frameC"));
});

test("第 503 種:簡單的傘齒輪周轉輪系:臂的轉動是兩個輪 C、D 的平均", () => {
  close(m503.differential(1, "fixed").arm, 0.5, "D 固定:臂轉 C 的一半");
  close(m503.differential(1, "opposite").arm, 0, "C、D 反向同速:臂不轉");
  close(m503.differential(1, "same").arm, 1, "C、D 同向同速:臂跟著轉");
});

test("第 503 種:臂上的傘齒輪 B 夾在 C、D 之間滾動:接觸處 B 的表面與 C、D 同速(三種轉法)", () => {
  const def = m503.default;
  for (const state of ["fixed", "opposite", "same"]) {
    const arm = def.pose(0.6, state).parts.shaftA.angle;
    // 接觸點在 C、D 的節錐上:離軸 x,高度 ±x·RB/R(B 的節錐與 C、D 的節錐相切處)
    sameSurfaceSpeed(def, "wheelB", "wheelC", 0.6, state, rotY([0.72, -0.72 * (0.5 / 0.85), 0], arm), `${state}:B 咬 C`);
    sameSurfaceSpeed(def, "wheelB", "wheelD", 0.6, state, rotY([0.72, 0.72 * (0.5 / 0.85), 0], arm), `${state}:B 咬 D`);
  }
});

test("第 503 種:D 固定、反向同速、同向同速由實體做出來:夾塊鎖住 D、機架上的惰輪同時咬 C 與 D、銷把 D 鎖在 C 上", () => {
  const def = m503.default;
  const frame = part(def, "frame");
  assertOnePiece(frame, "機架(底板、支柱、橫樑、上下軸承座)連成一件");
  // D 固定:夾塊(環)套在 D 的套筒上、頂著上方軸承座的底
  const clamp = part(def, "clampD");
  assert.ok(clamp, "D 固定時有夾塊");
  const sleeve = part(def, "wheelD").pieces.find((q) => q.kind === "cylinder");
  const bearing = frame.pieces.filter((q) => q.kind === "box" && q.at[0] === 0).reduce((a, b) => (a.at[1] > b.at[1] ? a : b));
  close(clamp.inner, sleeve.radius, "夾塊的環套在 D 的套筒上");
  close(clamp.center[1] + clamp.length / 2, bearing.at[1] - bearing.size[1] / 2, "夾塊頂著上方軸承座");
  close(part(def, "wheelD").center[1] + sleeve.at[2] + sleeve.length / 2, bearing.at[1] - bearing.size[1] / 2, "D 的套筒伸到上方軸承座下面");
  close(turned(def, "wheelD", 0, 1, "fixed"), 0, "D 不轉");
  // 反向同速:惰輪的軸固定在支柱上,惰輪同時咬 C、D、只自轉不公轉
  const op = (v) => def.pose(v, "opposite").parts;
  assert.equal(op(0.3).wheelI.visible && op(0.3).idlerAxle.visible, true, "惰輪與它的軸裝上");
  const axle = part(def, "idlerAxle");
  const post = frame.pieces.find((q) => q.kind === "box" && q.at[0] < -1);
  close(axle.center[0] - axle.length / 2, post.at[0] + post.size[0] / 2, "惰輪的軸接到支柱");
  assert.deepEqual(placeOf(def, "wheelI", 0.3, "opposite").pos, placeOf(def, "wheelI", 1.3, "opposite").pos, "惰輪不公轉");
  sameSurfaceSpeed(def, "wheelI", "wheelC", 0.6, "opposite", [-0.72, -0.72 * (0.5 / 0.85), 0], "惰輪咬 C");
  sameSurfaceSpeed(def, "wheelI", "wheelD", 0.6, "opposite", [-0.72, 0.72 * (0.5 / 0.85), 0], "惰輪咬 D");
  // 同向同速:銷從 C 的錐頂面穿到 D 的錐頂面,跟著 C 轉
  const pin = part(def, "pinCD");
  const same = (v) => def.pose(v, "same").parts;
  assert.equal(same(0.4).pinCD.visible, true);
  close(pin.length / 2, -part(def, "wheelC").center[1] - part(def, "wheelC").height / 2, "銷的兩端到 C、D 的錐頂面");
  const p = same(0.4).pinCD.position;
  close(Math.atan2(-p[2], p[0]) - Math.atan2(-pin.center[2], pin.center[0]), 0.4, "銷跟著 C 轉");
  for (const s of ["opposite", "same"]) assert.equal(def.pose(0.3, s).parts.clampD.visible, false, `${s}:D 會轉,夾塊拿掉`);
  for (const s of ["fixed", "same"]) assert.equal(def.pose(0.3, s).parts.wheelI.visible, false, `${s}:惰輪拿掉`);
  for (const s of ["fixed", "opposite"]) assert.equal(def.pose(0.3, s).parts.pinCD.visible, false, `${s}:銷拿掉`);
});

test("第 504 種:弗格森悖論:臂轉動時 F 不轉,E 朝一個方向慢慢轉,G 朝另一個方向慢慢轉", () => {
  const turns = (x) => m504.trainToTurns(x);
  close(turns("F"), 0, "F(20 齒,與 A 同)不轉,始終指向同一方向");
  close(turns("E"), 1 / 21, "E(21 齒)與臂同向轉 1/21 圈");
  close(turns("G"), -1 / 19, "G(19 齒)與臂反向轉 1/19 圈");
  const p = m504.paradox(2 * Math.PI);
  assert.ok(p.E > 0 && p.G < 0 && Math.abs(p.F) < 1e-9, "三個輪轉向各不相同");
});

test("第 504 種:E、F、G 的指標裝在 E 的頂面以上、高過厚輪 B,越上面越短:俯視時三根都看得到,也不穿過 B", () => {
  const def = m504.default;
  const bTop = part(def, "wheelB").width / 2;
  const layers = ["wheelE", "wheelF", "wheelG"].map((id) => {
    const ptr = part(def, id).pieces.filter((q) => q.kind === "plate");
    assert.equal(ptr.length, 1, `${id} 有一根指標`);
    const xs = ptr[0].shape.outline.map((v) => v[0]);
    const gear = part(def, id).pieces.find((q) => q.kind === "gear");
    return { id, z0: ptr[0].at[2] - ptr[0].thickness / 2, len: Math.max(...xs), gearTop: gear.at[2] + gear.width / 2 };
  });
  const topOfWheels = Math.max(...layers.map((l) => l.gearTop));
  for (const l of layers) {
    assert.ok(l.z0 >= bTop, `${l.id} 的指標高過 B 的頂面(指標底 ${l.z0},B 頂 ${bTop})`);
    assert.ok(l.z0 >= topOfWheels, `${l.id} 的指標在三個輪的頂面以上`);
  }
  const byHeight = [...layers].sort((a, c) => a.z0 - c.z0);
  for (let i = 1; i < byHeight.length; i++) assert.ok(byHeight[i].len < byHeight[i - 1].len - 0.1, `${byHeight[i].id} 的指標比下面的短,下面那根的尖端露出來`);
  // 套管:G 的在最裡面、F 的套在外面,往上穿過上面的輪
  const tube = (id) => part(def, id).pieces.find((q) => q.kind === "cylinder" && q.inner);
  assert.ok(tube("wheelG") && tube("wheelF"), "G、F 各有一根套管");
  close(tube("wheelG").radius, tube("wheelF").inner, "F 的套管套在 G 的套管上");
  close(part(def, "wheelF").pieces.find((q) => q.kind === "gear").bore, tube("wheelG").radius, "G 的套管穿過 F 的孔");
  close(part(def, "wheelE").pieces.find((q) => q.kind === "gear").bore, tube("wheelF").radius, "F 的套管穿過 E 的孔");
});

test("第 504 種:臂 C、D 兩頭伸出輪外(讀者抓得到);凸柱下面有柱座與底板,臂在 A 與柱座之間", () => {
  const def = m504.default;
  const arm = part(def, "arm");
  const xs = arm.shape.outline.map((v) => v[0]);
  const post = part(def, "post");
  const a = post.pieces.find((q) => q.kind === "gear");
  const n = arm.pieces.reduce((p, q) => (q.at[0] > p.at[0] ? q : p)).at[0]; // 銷 N
  const wheelOuter = part(def, "wheelE").pieces.find((q) => q.kind === "gear").radius + 0.06;
  assert.ok(Math.max(...xs) >= n + wheelOuter + 0.4, "D 端伸出 E、F、G 的齒頂至少 0.4");
  assert.ok(-Math.min(...xs) >= a.radius + 0.06 + 0.2, "C 端伸出 A 的齒頂");
  const armBottom = arm.center[2] - arm.thickness / 2;
  const base = post.pieces.filter((q) => (q.kind === "cylinder" || q.kind === "box") && pieceBox(q).hi[2] <= armBottom + 1e-9);
  assert.ok(base.some((q) => q.kind === "cylinder" && q.radius > 0.15), "臂下面有比凸柱粗的柱座");
  assertOnePiece({ pieces: post.pieces.filter((q) => q.kind !== "gear") }, "凸柱、柱座與底板連成一件");
});

test("第 505 種:臂帶著小齒輪 B 咬正齒輪 A 與內齒輪 C;固定其中一個,另一個就被帶動", () => {
  const { A, C } = m505.TEETH;
  close(m505.wheels(1, "C").A, 1 + C / A, "C 固定:A 轉 (1 + C/A) 倍");
  close(m505.wheels(1, "A").C, 1 + A / C, "A 固定:C 轉 (1 + A/C) 倍");
  assert.equal(m505.wheels(1, "C").C, 0);
});

test("第 505 種:A、C 與臂的軸同心:臂固定在中心軸上、轉在機架的軸承裡;固定的那個輪由夾塊鎖在機架上,而且不塗目標件色", () => {
  const def = m505.default;
  const stand = part(def, "stand");
  assert.ok(stand, "有機架");
  assertOnePiece(stand, "機架(底板、立柱、軸承)連成一件");
  const shaft = part(def, "armD").pieces.find((q) => q.role === "shaft");
  assert.ok(shaft, "臂固定在中心軸上");
  const z = def.pose(0, "C").parts.armD.position[2];
  assertShaftInBearings({ ...shaft, at: [0, 0, z + shaft.at[2]] }, stand.pieces, "臂的中心軸");
  // A 的套筒套在中心軸上,C 的輪轂套在 A 的套筒上
  const sleeve = part(def, "wheelA").pieces.find((q) => q.kind === "cylinder");
  close(sleeve.inner, shaft.radius, "A 的套筒套在中心軸上");
  close(part(def, "wheelC").pieces.find((q) => q.kind === "cylinder").inner, sleeve.radius, "C 的輪轂套在 A 的套筒上");
  for (const [state, clamp] of [["C", "clampC"], ["A", "clampA"]]) {
    const p = def.pose(0.5, state).parts;
    assert.equal(p[clamp].visible, true, `固定 ${state}:夾塊鎖住它`);
    // 看得到的目標件都在轉;看得到的、標著這個字母而不動的輪不是目標件
    const visible = def.parts.filter((q) => p[q.id]?.visible !== false);
    for (const t of def.targets.filter((id) => visible.some((q) => q.id === id))) assert.ok(Math.abs(turned(def, t, 0, 1, state)) > 0.1, `固定 ${state}:目標件 ${t} 被帶動`);
    const still = visible.filter((q) => q.label === state && Math.abs(turned(def, q.id, 0, 1, state)) < 1e-12);
    assert.equal(still.length, 1, `固定 ${state}:看得到一個不動的 ${state}`);
    assert.ok(!def.targets.includes(still[0].id), `固定 ${state}:不動的 ${state} 不塗目標件色`);
  }
});

test("第 506 種:兩端都不固定的周轉輪系:軸 A 經 a、b 帶動 c,經 h、g 帶動 f,臂 k、l 得到合成轉動;改接法時 f 得到合成轉動", () => {
  const def = m506.default;
  const T = m506.TEETH;
  const rate = (id, state) => turned(def, id, 0, 1, state);
  close(Math.abs(rate("wheelBC", "original")), T.a / T.b, "a 咬 b:b(與 c)轉 a/b");
  close(Math.abs(rate("wheelFG", "original")), T.h / T.g, "h 咬 g:g(與 f)轉 h/g");
  assert.ok(rate("wheelBC", "original") * rate("wheelFG", "original") < 0, "a、h 從同一側咬下面的 b 與上面的 g,兩端轉向相反");
  const [c, f, arm] = ["wheelBC", "wheelFG", "shaftMN"].map((id) => rate(id, "original"));
  close(f - arm, m506.E_CF * (c - arm), "傳給兩端的運動產生臂的合成運動(f − 臂 = e(c − 臂))");
  assert.ok(Math.abs(arm) > 0.01, "臂在轉");
  const [c2, g2, f2, arm2] = ["wheelBC", "wheelG", "wheelF", "shaftMN"].map((id) => rate(id, "modified"));
  close(arm2, g2, "改過的接法:g 固定在軸上,臂跟著 g 轉");
  close(f2 - arm2, m506.E_CF * (c2 - arm2), "鬆的 f 得到合成轉動");
});

test("第 506 種:軸 A 上的 a、h 與臂上的 d、e 各是兩個傘齒輪,大小照齒數、節錐頂在兩軸交點,嚙合處兩輪表面同速", () => {
  const def = m506.default;
  const T = m506.TEETH;
  const gearsOf = (id) => part(def, id).pieces.filter((q) => q.kind === "gear");
  assert.deepEqual(gearsOf("shaftA").map((q) => q.teeth).sort((a, b) => a - b), [T.a, T.h].sort((a, b) => a - b), "軸 A 上兩個輪 a、h");
  assert.deepEqual(gearsOf("planetDE").map((q) => q.teeth).sort((a, b) => a - b), [T.e, T.d].sort((a, b) => a - b), "臂上兩個輪 d、e");
  // 量 pose 出來的零件:各傘齒輪附件換到世界座標,大端節圓半徑的比 = 齒數比,兩輪的節錐頂重合(在兩軸交點)
  const v0 = 0.7;
  const posed = (id, teeth) => {
    const { pos, q } = placeOf(def, id, v0, "original");
    const g = gearsOf(id).find((x) => x.teeth === teeth);
    const axis = quatRotate(q, g.axis);
    const heel = add(add(pos, quatRotate(q, g.at)), scale(axis, -g.width / 2));
    return { radius: g.radius, apex: add(heel, scale(axis, g.radius / Math.tan(g.cone))) };
  };
  const on = { a: "shaftA", h: "shaftA", b: "wheelBC", c: "wheelBC", g: "wheelFG", f: "wheelFG", d: "planetDE", e: "planetDE" };
  for (const [p, w] of [["a", "b"], ["h", "g"], ["c", "d"], ["e", "f"]]) {
    const [gp, gw] = [posed(on[p], T[p]), posed(on[w], T[w])];
    close(gp.radius / gw.radius, T[p] / T[w], `${p}、${w} 的節圓半徑比照齒數`, 1e-9);
    close(dist(gp.apex, gw.apex), 0, `${p}、${w} 的節錐頂重合`, 1e-9);
  }
  for (const state of ["original", "modified"]) {
    const v = 0.7;
    const arm = def.pose(v, state).parts.shaftMN.angle;
    const fg = state === "original" ? "wheelFG" : "wheelF";
    const gg = state === "original" ? "wheelFG" : "wheelG";
    sameSurfaceSpeed(def, "shaftA", "wheelBC", v, state, m506.CONTACTS.ab, `${state}:a 咬 b`);
    sameSurfaceSpeed(def, "shaftA", gg, v, state, m506.CONTACTS.hg, `${state}:h 咬 g`);
    sameSurfaceSpeed(def, "wheelBC", "planetDE", v, state, rotY(m506.CONTACTS.cd, arm), `${state}:c 咬 d`);
    sameSurfaceSpeed(def, "planetDE", fg, v, state, rotY(m506.CONTACTS.ef, arm), `${state}:e 咬 f`);
  }
});

test("第 506 種:b 與 c 連成一件;原來的接法 f 與 g 連成一件;d 與 e 連成一件", () => {
  const def = m506.default;
  for (const id of ["wheelBC", "wheelFG", "planetDE"]) {
    assert.ok(part(def, id), `${id} 是一個零件`);
    onePiece(part(def, id).pieces, `${id} 連成一件`);
  }
  assert.equal(def.pose(0.3, "original").parts.wheelFG.visible, true);
  assert.equal(def.pose(0.3, "modified").parts.wheelFG.visible, false, "改過的接法:f、g 分開");
});

test("第 507 種:產生極慢運動的周轉輪系:照原文的齒數,C 每轉一圈,臂轉 25,000 圈", () => {
  close(Math.abs(m507.slow(1).arm), 25000, "臂 / C = 25,000", 1e-6);
  close(Math.abs(1 / m507.C_PER_ARM), 25000, "反過來,臂轉一圈 C 只轉 1/25,000 圈", 1e-6);
});

test("第 507 種:結合在一起的 F 與 G 連成一件(中間有轂);主動件的轉向箭頭畫在臂的高度", () => {
  const def = m507.default;
  onePiece(part(def, "planetFG").pieces, "F、轂、G 連成一件");
  const arm = part(def, "arm");
  const plate = arm.pieces.find((q) => q.kind === "plate");
  close(arm.spinOffset ?? 0, plate.at[2], "箭頭在臂板的高度");
});
