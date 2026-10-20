// 第二十一章「風力、船舶與起重」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, polyGap, assertOnePiece, assertShaftInBearings } from "./helpers.js";

import fig484 from "../models/fig484.js";
import * as m485 from "../models/fig485.js";
import * as m486 from "../models/fig486.js";
import * as m487 from "../models/fig487.js";
import * as m488 from "../models/fig488.js";
import * as m489 from "../models/fig489.js";
import * as m490 from "../models/fig490.js";
import * as m491 from "../models/fig491.js";
import * as m492 from "../models/fig492.js";
import * as m493 from "../models/fig493.js";
import * as m494 from "../models/fig494.js";
import { placeOutline, polygonsOverlap, penetrationDepth } from "../models/contact.js";

test("第 484 種:圓筒上的螺旋葉片:風沿軸吹過,圓筒旋轉", () => {
  const a = fig484.pose(0.1);
  assert.equal(a.flows[0].fluid, "air", "風以空氣示意");
  const xs = a.flows[0].points.map((p) => p[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 3, "風沿軸吹過整個圓筒");
  assert.notEqual(fig484.pose(0.1).parts.drum.angle, fig484.pose(0.2).parts.drum.angle, "圓筒隨進程轉(依自己的軸轉,看得到轉向箭頭)");
});

test("第 485 種:風車:風吹在斜的帆面上產生圓周運動", () => {
  assert.ok(m485.PITCH > 0 && m485.PITCH < Math.PI / 4, "帆面相對旋轉平面斜一個角度");
  const def = m485.default;
  assert.notEqual(def.pose(0.1).parts.sails.angle, def.pose(0.3).parts.sails.angle, "帆隨進程轉(依自己的軸轉,看得到轉向箭頭)");
  assert.ok(def.pose(0.2).flows[0].points.length > 0, "有風");
});

test("第 486 種:垂直式風車:受風的一側帆面正對著風,轉回迎風時以邊緣對著風", () => {
  const face = m486.sail(0); // 右側:臂端順著風走
  const edge = m486.sail(Math.PI); // 左側:逆著風回來
  close(face.angle, 0, "受風時帆面與風垂直");
  close(edge.angle, Math.PI / 2, "回程時邊緣對著風");
  assert.equal(face.face, 1);
  assert.equal(edge.face, 0);
});

test("第 487 種:明輪:輪轉時下方的槳板把水往後推,船往前", () => {
  const def = m487.default;
  // 逆時針轉:最下面的槳板往右走(推水往右)
  const theta = 0.1;
  const below = (t) => [Math.cos(t - Math.PI / 2) * m487.R.paddle, Math.sin(t - Math.PI / 2) * m487.R.paddle];
  assert.ok(below(theta)[0] > below(0)[0], "下方的槳板往右(往後)推水");
  assert.ok(-m487.R.paddle < m487.WATER && m487.WATER < -m487.R.rim + 0.2, "只有下方的槳板浸在水裡");
  assert.match(def.pose(0).readouts[0].value, /往左/);
});

test("第 488 種:螺旋槳:槳葉是螺紋的片段,旋轉時沿軸推進", () => {
  assert.ok(m488.PITCH_ANGLE > 0 && m488.PITCH_ANGLE < Math.PI / 2, "槳葉斜一個螺距角");
  const def = m488.default;
  const xs = def.pose(1).flows[0].points.map((p) => p[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 3, "水沿軸被推動");
});

test("第 489 種:垂直槳板明輪:臂轉動時,環 d 繞偏心輪 e 轉,經曲柄使槳板始終直立", () => {
  const def = m489.default;
  for (const t of sweep(2 * Math.PI, 24)) {
    const parts = def.pose(t).parts;
    m489.joints(t).forEach((j, i) => {
      close(Math.hypot(j.pivot[0], j.pivot[1]), m489.ARM, "槳板的樞軸離軸心相等");
      // 曲柄端在環 d 上:離偏心輪中心也是 ARM
      close(Math.hypot(j.crank[0] - m489.ECC[0], j.crank[1] - m489.ECC[1]), m489.ARM, "曲柄端在繞偏心輪轉的環上");
      assert.equal(parts[`paddle${i}`].angle, undefined, "槳板不轉,始終直立");
    });
  }
});

test("第 490 種:操舵裝置:轉舵輪時繩的一端捲進、另一端放出,舵柄依舵輪轉的方向擺向一側", () => {
  const a = m490.tiller(0.5);
  const b = m490.tiller(-0.5);
  assert.ok(a * b < 0, "舵輪轉向相反,舵柄擺向相反的一側");
  close(m490.tiller(0), 0, "舵輪在中間時舵柄居中", 1e-6);
  // 上段繩捲進 r × theta
  const [top0] = m490.ropes(0);
  const [top1] = m490.ropes(a);
  assert.ok(top1 < top0, "轉正向時上段繩被捲進(變短)");
  const [, bot0] = m490.ropes(0);
  const [, bot1] = m490.ropes(a);
  assert.ok(bot1 > bot0, "另一段繩被放出(變長)");
});

// 第 490–494 種用:折線路徑上離起點弧長 s 的點;繩上材料座標 m 的點(繪圖層的紋理座標 = 弧長 − 相位,見 viewer/paths.js)
const pathLength = (pts) => pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1], p[2] - pts[i][2]), 0);
function pathPoint(pts, s) {
  if (s < 0) return null;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (acc + l >= s && l > 0) return a.map((v, k) => v + ((b[k] - v) * (s - acc)) / l);
    acc += l;
  }
  return null;
}
const materialAt = (path, m) => pathPoint(path.points, m + (path.phase ?? 0));

test("第 490 種:繩的一端捲進多少、另一端就放出多少(繩長不變),舵柄擺得到兩側 32°", () => {
  const def = m490.default;
  const [lo, hi] = def.driver.range;
  // 鼓輪(第一塊)上繩的中心線半徑 = 鼓輪半徑 + 繩半徑
  const wind = part(def, "wheel").pieces[0].radius + def.parts.find((p) => p.kind === "rope").radius;
  const [top0, bottom0] = m490.ropes(0);
  for (const theta of sweep(hi, 40, lo)) {
    const [top, bottom] = m490.ropes(m490.tiller(theta));
    assert.ok(Math.abs(top - (top0 - wind * theta)) < 0.01 * top0, `舵輪轉 ${theta.toFixed(2)}:上段繩捲進鼓輪的長度(差 ${(top - (top0 - wind * theta)).toFixed(3)})`);
    assert.ok(Math.abs(bottom - (bottom0 + wind * theta)) < 0.01 * bottom0, `舵輪轉 ${theta.toFixed(2)}:下段繩放出同樣的長度(差 ${(bottom - (bottom0 + wind * theta)).toFixed(3)})`);
  }
  close(m490.tiller(hi), m490.MAX, "舵輪轉到一端,舵柄擺到 32°", 1e-3);
  close(m490.tiller(lo), -m490.MAX, "轉到另一端,舵柄擺到另一側 32°", 1e-3);
  for (const id of Object.keys(def.pose(0).paths)) {
    const l0 = pathLength(def.pose(0).paths[id].points);
    for (const theta of sweep(hi, 20, lo)) assert.ok(Math.abs(pathLength(def.pose(theta).paths[id].points) - l0) < 0.01 * l0, `舵輪轉 ${theta.toFixed(2)}:${id} 整條繩長不變`);
  }
});

test("第 490 種:捲進的那一段繩往鼓輪走、放出的那一段離開鼓輪:兩個導引滑輪的輪緣、鼓面都和貼著它的繩同向同速", () => {
  const def = m490.default;
  const ropeR = def.parts.find((p) => p.kind === "rope").radius;
  const wheel = part(def, "wheel");
  const drum = wheel.pieces[0];
  const d = 0.01;
  const hits = { pulley0: 0, pulley1: 0, wheel: 0 };
  for (const theta of [-1.5, 0, 1]) {
    const [a, b] = [def.pose(theta), def.pose(theta + d)];
    for (const id of Object.keys(a.paths)) {
      const len = pathLength(a.paths[id].points);
      for (let m = 0; m < len; m += 0.01) {
        const p = materialAt(a.paths[id], m);
        const q = materialAt(b.paths[id], m);
        if (!p || !q) continue;
        const v = q.map((x, k) => x - p[k]);
        const check = (id2, rim) => {
          const speed = Math.hypot(...v);
          const rimSpeed = Math.hypot(...rim);
          assert.ok(v[0] * rim[0] + v[1] * rim[1] + v[2] * rim[2] > 0 && Math.abs(speed / rimSpeed - 1) < 0.1, `舵輪轉 ${theta}:貼著 ${id2} 的繩(${p.map((x) => x.toFixed(2))})和輪面同向同速(繩 ${v.map((x) => x.toFixed(4))},輪面 ${rim.map((x) => x.toFixed(4))})`);
          hits[id2]++;
        };
        for (const k of [0, 1]) {
          const q = part(def, `pulley${k}`);
          const r = [p[0] - q.center[0], p[1] - q.center[1]];
          if (Math.abs(Math.hypot(...r) - (q.radius + ropeR)) < 0.005 && Math.abs(p[2] - q.center[2]) < (q.width ?? 0.25) / 2) {
            const w = b.parts[q.id].angle - a.parts[q.id].angle;
            check(q.id, [-w * r[1], w * r[0], 0]);
          }
        }
        // 鼓輪的軸沿 x
        const r = [0, p[1] - wheel.center[1], p[2] - wheel.center[2]];
        if (Math.abs(Math.hypot(...r) - (drum.radius + ropeR)) < 0.005 && Math.abs(p[0] - wheel.center[0]) < drum.length / 2) {
          const w = b.parts.wheel.angle - a.parts.wheel.angle;
          check("wheel", [0, -w * r[2], w * r[1]]);
        }
      }
    }
  }
  for (const [id, n] of Object.entries(hits)) assert.ok(n > 20, `繩繞在 ${id} 上(貼著輪面的取樣 ${n} 個)`);
});

test("第 490 種:舵輪軸架在甲板上的兩個軸承裡,導引滑輪的軸頭插在支架的軸承環裡,舵桿穿過甲板上的軸承;支架、軸承座與甲板連成一件", () => {
  const def = m490.default;
  const frame = part(def, "frame");
  const wheel = part(def, "wheel");
  const shaft = wheel.pieces.find((p) => p.role === "shaft");
  assert.ok(shaft, "舵輪有軸");
  assertShaftInBearings({ at: [wheel.center[0] + (shaft.at?.[2] ?? 0), wheel.center[1], wheel.center[2]], axis: [1, 0, 0], radius: shaft.radius, length: shaft.length }, frame.pieces, "舵輪軸");
  for (const k of [0, 1]) {
    const q = part(def, `pulley${k}`);
    // 滑輪零件的軸頭:半徑 max(0.035, 輪半徑 × 0.08)、長 輪寬 × 1.6(viewer/parts.js 的 pulley)
    assertShaftInBearings({ at: q.center, radius: Math.max(0.035, q.radius * 0.08), length: (q.width ?? 0.25) * 1.6 }, frame.pieces, `導引滑輪 ${k} 的軸頭`);
  }
  const tiller = part(def, "tiller");
  const stock = tiller.pieces.find((p) => p.role === "stock");
  assert.ok(stock, "舵柄套在舵桿上");
  assertShaftInBearings({ at: tiller.center.map((v, k) => v + stock.at[k]), radius: stock.radius, length: stock.length }, frame.pieces, "舵桿");
  assertOnePiece(frame, "支架、軸承座與甲板連成一件");
});

test("第 491 種:絞盤:推桿轉動絞盤收進纜繩;棘爪在底座的棘齒上滑過,每過一齒落下一次(防止倒轉)", () => {
  close(m491.capstan(2 * Math.PI).hauled, 2 * Math.PI * m491.DRUM_R, "轉一圈收進鼓周長的繩");
  const tooth = (2 * Math.PI) / m491.TEETH;
  const tips = sweep(2 * tooth, 200).map((t) => m491.capstan(t).tip);
  assert.ok(Math.max(...tips) - Math.min(...tips) > 0.05, "爪尖沿緩坡抬起、越過齒頂後落下");
  // 越過齒頂後加速落下(不是一格就落到底):找第一段連續下降,前一半落得比後一半少
  for (let i = 1; i < tips.length; i++) assert.ok(Math.abs(tips[i] - tips[i - 1]) < 0.03, "沒有瞬移");
  const drops = tips.map((y, i) => (i ? tips[i - 1] - y : 0));
  const steepest = drops.indexOf(Math.max(...drops.slice(0, 100)));
  let [start, stop] = [steepest, steepest];
  while (start > 1 && drops[start - 1] > -2e-4) start--;
  while (stop + 1 < tips.length && drops[stop + 1] > 1e-6) stop++;
  assert.ok(stop - start >= 4, "落下有過程");
  const mid = Math.floor((start + stop) / 2);
  assert.ok(tips[start - 1] - tips[mid] < tips[mid] - tips[stop], "落下越來越快");
  // 由接觸算:爪尖不會沉進齒面以下
  for (const t of sweep(2 * tooth, 60)) {
    const c = m491.capstan(t);
    assert.ok(c.tip >= m491.RING_TOP + m491.toothHeight(t - (m491.PAWL * Math.cos(c.tilt)) / m491.RATCHET_R) - 1e-6, "爪尖搭在齒面上(不穿入)");
  }
});

// 爪尖離齒面的高度(爪靠在齒上時是 0,落下途中大於 0)
const pawlGap491 = (t) => {
  const c = m491.capstan(t);
  return c.tip - (m491.RING_TOP + m491.toothHeight(t - (m491.PAWL * Math.cos(c.tilt)) / m491.RATCHET_R));
};

test("第 491 種:絞盤由棘爪防止倒轉:往回轉只能轉到最近的落定處(爪尖落在齒根、頂著直壁),往回時爪尖不被抬起;爪正在落下時往回轉,當下就擋住", () => {
  const { backstop } = m491.default.driver;
  assert.equal(typeof backstop, "function", "主動件有擋止");
  const tooth = (2 * Math.PI) / m491.TEETH;
  let falling = 0;
  for (const v of sweep(3 * tooth, 300, 0.01)) {
    const stop = backstop(v);
    assert.ok(stop <= v + 1e-9 && v - stop < tooth + 1e-9, `轉角 ${v.toFixed(3)}:往回最多轉一齒`);
    const tips = sweep(v, 40, stop).map((t) => m491.capstan(t).tip);
    for (let i = 1; i < tips.length; i++) assert.ok(tips[i] >= tips[i - 1] - 1e-9, `轉角 ${v.toFixed(3)}:往回轉到 ${stop.toFixed(3)} 的途中爪尖只沿緩坡滑下,不被抬起`);
    if (pawlGap491(v) > 1e-4) {
      falling++;
      close(stop, v, `轉角 ${v.toFixed(3)}:爪正在落下,往回轉當下就擋住`, 1e-9);
    } else {
      assert.ok(pawlGap491(stop) < 1e-4, `轉角 ${v.toFixed(3)}:擋住處爪尖搭在齒面上`);
      assert.ok(pawlGap491(stop - 0.003) > 1e-4, `轉角 ${v.toFixed(3)}:擋住處正是爪落定的那一刻(再早一點爪還在落下)`);
    }
  }
  assert.ok(falling > 3, "取樣裡有爪正在落下的時刻");
});

test("第 491 種:照原圖絞盤從上往下看順時針轉,鼓的正面往左,把從右邊切進來的纜繩收進:鼓面和貼著它的繩同向同速;棘爪的鉸點在前、爪尖往後拖", () => {
  const def = m491.default;
  const ropeR = part(def, "rope").radius;
  const d = 0.01;
  const qrot = (q, v) => {
    const c = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const t = c(q.slice(0, 3), v).map((x) => 2 * x);
    const ut = c(q.slice(0, 3), t);
    return v.map((x, k) => x + q[3] * t[k] + ut[k]);
  };
  for (const theta of [0, 0.7, 2]) {
    const [a, b] = [def.pose(theta), def.pose(theta + d)];
    const w = b.parts.drum.angle - a.parts.drum.angle; // 鼓繞 +y 的轉角
    assert.ok(w < 0, "從上往下看順時針(繞 +y 的轉角減少)");
    let hits = 0;
    const len = pathLength(a.paths.rope.points);
    for (let m = 0; m < len; m += 0.01) {
      const p = materialAt(a.paths.rope, m);
      const q = materialAt(b.paths.rope, m);
      if (!p || !q || (Math.abs(Math.hypot(p[0], p[2]) - (m491.DRUM_R + ropeR)) > 0.005 && Math.abs(Math.hypot(p[0], p[2]) - m491.DRUM_R) > 0.005)) continue;
      const v = q.map((x, k) => x - p[k]);
      const rim = [w * p[2], 0, -w * p[0]];
      assert.ok(v[0] * rim[0] + v[2] * rim[2] > 0 && Math.abs(Math.hypot(v[0], v[2]) / Math.hypot(...rim) - 1) < 0.1, `轉角 ${theta}:貼著鼓的繩(${p.map((x) => x.toFixed(2))})和鼓面同向同速`);
      hits++;
    }
    assert.ok(hits > 20, `繩繞在鼓上(${hits})`);
    // 棘爪:鉸點往前走,爪尖在鉸點後面
    const [pa, pb] = [a.parts.pawl.position, b.parts.pawl.position];
    const tip = qrot(a.parts.pawl.rotation, [m491.PAWL, 0, 0]);
    assert.ok(tip[0] * (pb[0] - pa[0]) + tip[2] * (pb[2] - pa[2]) < 0, `轉角 ${theta}:爪尖拖在鉸點後面`);
  }
});

test("第 491 種:絞盤繞其軸轉動:鼓與絞盤頭中心的孔套在固定在底座上的立軸上", () => {
  const def = m491.default;
  const base = part(def, "base");
  const spindle = base.pieces.find((p) => p.role === "spindle");
  assert.ok(spindle, "底座上有立軸");
  assert.deepEqual(spindle.axis, [0, 1, 0], "立軸是直立的");
  const [y0, y1] = [spindle.at[1] - spindle.length / 2, spindle.at[1] + spindle.length / 2];
  const deck = base.pieces[0];
  close(y0, deck.at[1] + deck.size[1] / 2, "立軸立在底座上", 1e-9);
  for (const id of ["drum", "capstan"]) {
    const profile = part(def, id).pieces.find((p) => p.kind === "lathe").profile;
    const bore = Math.min(...profile.map((q) => q[0]));
    assert.ok(bore >= spindle.radius - 1e-9 && bore <= spindle.radius + 0.01, `${id} 中心的孔套在立軸上(孔 ${bore},軸 ${spindle.radius})`);
    const ys = profile.map((q) => q[1]);
    assert.ok(y0 <= Math.min(...ys) && Math.max(...ys) <= y1, `立軸穿過整個 ${id}`);
  }
});

test("第 492 種:小艇脫鉤器:拉繩使槓桿上的環孔從舌片滑脫,舌片翻開滑出鉤子,小艇脫離", () => {
  const held = m492.release(0.3);
  assert.ok(held.held && held.fall === 0, "拉到一半之前,小艇還鉤著");
  const free = m492.release(1);
  assert.ok(!free.held && free.fall > 0.5, "環孔滑脫後小艇掉下");
  assert.ok(Math.abs(free.tongue - held.tongue) > 1, "舌片翻開");
  assert.ok(free.lever > held.lever, "槓桿被繩拉轉");
  const { EYE_R, TONGUE_W, TONGUE } = m492.geometry;
  const slide = sweep(m492.SLIP, 12).map(m492.eyeDistance);
  assert.ok(slide.every((d, i) => i === 0 || d > slide[i - 1]), "拉繩時環孔沿舌片往尖端滑");
  assert.ok(slide[0] < TONGUE && slide[6] < TONGUE, "拉到一半環孔還套在舌片上");
  assert.ok(slide[12] > TONGUE, "拉到 SLIP 時環孔已滑過舌片尖端");
  assert.ok(EYE_R > TONGUE_W / 2, "舌片穿得過環孔");
  // 環孔滑脫後,舌片被小艇的重量翻開、小艇掉下:都是加速的(每一步走得比上一步多),到底停住
  const falls = sweep(1, 100, m492.SLIP).map((u) => m492.release(u).fall);
  const moving = falls.map((f, i) => (i ? f - falls[i - 1] : 0)).filter((d) => d > 1e-9);
  assert.ok(moving.length > 5 && moving.slice(0, -1).every((d, i) => i === 0 || d >= moving[i - 1] - 1e-9), "小艇加速掉下(最後一步是撞到底)");
  close(falls[falls.length - 1], m492.DROP, "掉到底停住");
});

// 第 492 種:零件在姿勢下的平面外形(世界座標)
const placed492 = (pose, id, shape) => placeOutline(shape.outline, pose.parts[id].position, pose.parts[id].angle ?? 0);
// 圓(銷、彎鉤的斷面)近似成多邊形;槓桿的各塊板件外形
const circlePolygon492 = (c, r) => Array.from({ length: 32 }, (_, i) => [c[0] + r * Math.cos((i / 32) * 2 * Math.PI), c[1] + r * Math.sin((i / 32) * 2 * Math.PI)]);
const plates492 = (p) => [p.shape, ...(p.pieces ?? []).filter((q) => q.kind === "plate").map((q) => q.shape)];

test("第 492 種:滑車的鉤子鉤住舌片:鉤子的彎鉤和舌片在同一層、托在舌片下面(間隙接近 0、不穿入);環孔滑脫後舌片翻開、從鉤子滑出,小艇掉下時全程不碰鉤子", () => {
  const def = m492.default;
  const hook = part(def, "hook");
  const bight = hook.pieces.find((p) => p.role === "bight");
  assert.ok(bight, "鉤子有托住舌片的彎鉤");
  const c = (hook.center ?? [0, 0, 0]).map((v, k) => v + bight.at[k]);
  const tongue = part(def, "tongue");
  const ring = circlePolygon492(c, bight.radius);
  for (const u of sweep(1, 100)) {
    const pose = def.pose(u);
    const t = placed492(pose, "tongue", tongue.shape);
    assert.ok(!polygonsOverlap(t, circlePolygon492(c, bight.radius - 0.002)), `拉繩 ${u.toFixed(2)}:舌片不穿進鉤子的彎鉤`);
    if (u < m492.SLIP) {
      assert.ok(polyGap(t, ring) < 0.005, `拉繩 ${u.toFixed(2)}:彎鉤托在舌片下面(間隙 ${polyGap(t, ring).toFixed(4)})`);
      const z = pose.parts.tongue.position[2];
      const T = tongue.thickness / 2;
      assert.ok(c[2] - bight.length / 2 <= z - T && z + T <= c[2] + bight.length / 2, "彎鉤橫過舌片的整個厚度(同一層)");
    }
  }
  const t1 = placed492(def.pose(1), "tongue", tongue.shape);
  assert.ok(polyGap(t1, ring) > 0.05, "小艇脫離後舌片已離開鉤子");
});

test("第 492 種:槓桿以支柱中點處的支點作動:槓桿在支點處開孔,套在支柱的銷上", () => {
  const def = m492.default;
  const pin = part(def, "post").pieces.find((p) => p.role === "fulcrumPin");
  assert.ok(pin, "支柱中點有支點銷");
  const lever = part(def, "lever");
  const plates = [{ shape: lever.shape, thickness: lever.thickness, at: [0, 0, 0] }, ...(lever.pieces ?? []).filter((p) => p.kind === "plate")];
  const holes = plates.flatMap((p) => (p.shape.holes ?? []).map((h) => ({ h, at: p.at ?? [0, 0, 0], thickness: p.thickness })));
  const pose = def.pose(0.3);
  const fulcrum = pose.parts.lever.position;
  const pinAt = pose.parts.post.position.map((v, k) => v + pin.at[k]);
  close(Math.hypot(pinAt[0] - fulcrum[0], pinAt[1] - fulcrum[1]), 0, "槓桿繞支點銷轉", 1e-9);
  const onPin = holes.find(({ h, at }) => {
    const cx = h.reduce((s, q) => s + q[0], 0) / h.length + at[0];
    const cy = h.reduce((s, q) => s + q[1], 0) / h.length + at[1];
    const r = Math.min(...h.map((q) => Math.hypot(q[0] + at[0] - cx, q[1] + at[1] - cy)));
    return Math.hypot(cx, cy) < 1e-6 && r >= pin.radius - 0.002 && r <= pin.radius + 0.01;
  });
  assert.ok(onPin, "槓桿在支點處有套著銷的孔");
  const z = fulcrum[2] + onPin.at[2];
  assert.ok(pinAt[2] - pin.length / 2 <= z - onPin.thickness / 2 && z + onPin.thickness / 2 <= pinAt[2] + pin.length / 2, "銷穿過槓桿的整個厚度");
});

test("第 492 種:拉繩的另一端在小艇上的人手裡,跟著小艇掉下:繩長全程不變,繩的一端接在槓桿的下端", () => {
  const def = m492.default;
  const lever = part(def, "lever");
  const lengths = sweep(1, 50).map((u) => {
    const pose = def.pose(u);
    const pts = pose.paths.rope.points;
    const low = plates492(lever).some((p) => polyGap(placeOutline(p.outline, pose.parts.lever.position, pose.parts.lever.angle), [[pts[0][0], pts[0][1]], [pts[0][0] + 1e-4, pts[0][1]], [pts[0][0], pts[0][1] + 1e-4]]) < 1e-3);
    assert.ok(low, `拉繩 ${u.toFixed(2)}:繩接在槓桿上`);
    return pathLength(pts);
  });
  for (const l of lengths) close(l, lengths[0], "繩長不變", 1e-6);
  const [a, b] = [def.pose(m492.SLIP).paths.rope.points.at(-1), def.pose(1).paths.rope.points.at(-1)];
  assert.ok(a[1] - b[1] > m492.DROP * 0.9, "繩的另一端跟著小艇掉下");
});

test("第 493 種:路易斯吊楔:吊起中央的楔子把兩邊的填塊擠緊在孔壁上,石塊隨之吊起", () => {
  const early = m493.lewis(0.15);
  assert.ok(early.lift === 0 && early.wedge > 0, "先提起楔子,石塊還沒動");
  const tight = m493.lewis(0.35);
  assert.ok(tight.tight && tight.spread > 0, "楔子提到位,填塊被擠開");
  close(m493.lewis(1).lift, m493.LIFT, "之後石塊被吊起");
});

// 第 493 種:零件在姿勢下的外形(世界座標;只平移)
const at493 = (def, pose, id) => part(def, id).shape.outline.map(([x, y]) => [x + pose.parts[id].position[0], y + pose.parts[id].position[1]]);

test("第 493 種:三塊一起插進石塊上鑽出的孔:孔壁是直的(原圖),三塊合起來在每個高度都不比孔口寬,插得進孔裡", () => {
  const def = m493.default;
  const stone = part(def, "stone").shape.outline;
  const mouth = Math.min(...stone.filter(([, y]) => Math.abs(y) < 1e-9).map(([x]) => Math.abs(x)));
  const walls = stone.filter(([x, y]) => y < -1e-9 && Math.abs(x) < 1);
  assert.ok(walls.length >= 2 && walls.every(([x]) => Math.abs(Math.abs(x) - mouth) < 1e-9), "孔壁是直的(孔底和孔口一樣寬)");
  const pose = def.pose(0);
  for (const id of ["pin", "packerL", "packerR"]) {
    const xs = at493(def, pose, id).filter(([, y]) => y < 0.25).map(([x]) => Math.abs(x));
    assert.ok(Math.max(...xs) <= mouth + 1e-9, `${id} 不比孔口寬(最寬 ${Math.max(...xs).toFixed(3)},孔口 ${mouth})`);
  }
});

test("第 493 種:吊起中央的楔子時,它把填塊緊緊楔入孔壁:擠緊之後填塊貼著孔壁、楔子貼著填塊(間隙接近 0),全程互不穿入", () => {
  const def = m493.default;
  for (const u of sweep(1, 60)) {
    const pose = def.pose(u);
    const [stone, pin, L, R] = ["stone", "pin", "packerL", "packerR"].map((id) => at493(def, pose, id));
    for (const [a, b, what] of [[L, stone, "左填塊與孔壁"], [R, stone, "右填塊與孔壁"], [pin, L, "楔子與左填塊"], [pin, R, "楔子與右填塊"]]) {
      assert.ok(penetrationDepth(a, b) < 1e-6, `吊起 ${u.toFixed(2)}:${what}不穿入`);
      if (m493.lewis(u).tight) assert.ok(polyGap(a, b) < 1e-6, `吊起 ${u.toFixed(2)}:${what}貼緊(間隙 ${polyGap(a, b).toFixed(4)})`);
    }
  }
});

test("第 493 種:楔子頂端的吊環用螺栓接在楔子上(楔子、螺栓、吊環連成一件),吊繩繫在吊環上", () => {
  const def = m493.default;
  const pin = part(def, "pin");
  assertOnePiece({ pieces: [{ kind: "plate", shape: pin.shape, thickness: pin.thickness }, ...pin.pieces] }, "楔子、螺栓與吊環連成一件");
  const top = Math.max(...pin.pieces.filter((p) => p.kind === "plate").flatMap((p) => p.shape.outline.map(([, y]) => y + (p.at?.[1] ?? 0))));
  for (const u of [0, 0.2, 0.5, 1]) {
    const pose = def.pose(u);
    const rope = pose.paths.rope.points[0];
    close(rope[1], pose.parts.pin.position[1] + top, `吊起 ${u}:吊繩繫在吊環頂上`, 0.05);
  }
});

test("第 494 種:吊鉗:拉起鉤環,連桿使上臂收攏,尖端夾緊石塊;夾住後一起吊起", () => {
  const open = m494.tongs(0);
  assert.ok(open.tip[0] > m494.GRIP_X && !open.gripped, "一開始尖端在石塊外");
  const grip = m494.tongs(0.5);
  close(grip.tip[0], m494.GRIP_X, "尖端夾在石塊側面", 1e-6);
  assert.ok(grip.gripped && grip.lift > 0, "夾住後一起上升");
});

// 第 494 種:鉗臂各塊板件(本體與 pieces 裡的板件)在姿勢下的外形與孔(世界座標)
const armPlates494 = (def, pose, id) => {
  const p = part(def, id);
  const { position, angle } = pose.parts[id];
  return [{ shape: p.shape, at: [0, 0, 0], thickness: p.thickness }, ...(p.pieces ?? []).filter((q) => q.kind === "plate")].map((q) => ({
    outline: placeOutline(q.shape.outline.map(([x, y]) => [x + (q.at?.[0] ?? 0), y + (q.at?.[1] ?? 0)]), position, angle),
    holes: (q.shape.holes ?? []).map((h) => placeOutline(h.map(([x, y]) => [x + (q.at?.[0] ?? 0), y + (q.at?.[1] ?? 0)]), position, angle)),
    z: position[2] + (q.at?.[2] ?? 0),
    thickness: q.thickness ?? p.thickness,
  }));
};
const stone494 = (def, pose) => part(def, "stone").shape.outline.map(([x, y]) => [x + pose.parts.stone.position[0], y + pose.parts.stone.position[1]]);
const centroid494 = (h) => [h.reduce((s, q) => s + q[0], 0) / h.length, h.reduce((s, q) => s + q[1], 0) / h.length];

test("第 494 種:鉗臂繞過石塊的上角,只有尖端壓在石塊側面:全程鉗臂不穿進石塊,夾住時尖端貼著石塊(間隙接近 0)", () => {
  const def = m494.default;
  for (const u of sweep(1, 80)) {
    const pose = def.pose(u);
    const stone = stone494(def, pose);
    for (const id of ["armL", "armR"]) {
      const plates = armPlates494(def, pose, id);
      for (const q of plates) assert.ok(!polygonsOverlap(q.outline, stone), `拉起 ${u.toFixed(3)}:${id} 不穿進石塊`);
      const gap = Math.min(...plates.map((q) => polyGap(q.outline, stone)));
      if (m494.tongs(u).gripped) assert.ok(gap < 1e-3, `拉起 ${u.toFixed(3)}:${id} 的尖端貼著石塊(間隙 ${gap.toFixed(4)})`);
      if (u === 0) assert.ok(gap > 0.05, `一開始 ${id} 張開、離石塊 ${gap.toFixed(3)}`);
    }
  }
});

test("第 494 種:兩支鉗臂的中間鉸點有一根銷穿過;兩根連桿各用銷接在自己那一支鉗臂的上臂端,上端由鉤環連接(兩根連桿分在鉤環兩側)", () => {
  const def = m494.default;
  const pose = def.pose(0.3);
  const pin = part(def, "armL").pieces.find((p) => p.role === "pivotPin");
  assert.ok(pin, "中間鉸點有銷(裝在左鉗臂上)");
  const L = pose.parts.armL.position;
  const [z0, z1] = [L[2] + pin.at[2] - pin.length / 2, L[2] + pin.at[2] + pin.length / 2];
  const right = armPlates494(def, pose, "armR");
  const pivotHole = right.flatMap((q) => q.holes.map((h) => ({ h, q }))).find(({ h }) => Math.hypot(...centroid494(h).map((c, k) => c - L[k])) < 1e-6);
  assert.ok(pivotHole, "右鉗臂在鉸點開孔讓銷穿過");
  assert.ok(z0 <= pivotHole.q.z - pivotHole.q.thickness / 2 && pivotHole.q.z + pivotHole.q.thickness / 2 <= z1, "銷穿過右鉗臂的整個厚度");
  const shackle = pose.parts.shackle?.position;
  assert.ok(shackle, "有連接兩根連桿的鉤環");
  const sides = [];
  for (const [link, arm] of [["linkL", "armL"], ["linkR", "armR"]]) {
    const { from, to } = pose.parts[link];
    const plates = armPlates494(def, pose, arm);
    const eye = plates.find((q) => q.holes.some((h) => Math.hypot(...centroid494(h).map((c, k) => c - from[k])) < 1e-6));
    assert.ok(eye, `${link} 的下端銷在 ${arm} 上臂端的孔裡`);
    const t = part(def, link).thickness;
    assert.ok(Math.abs(from[2] - eye.z) <= (t + eye.thickness) / 2 + 0.01, `${link} 和 ${arm} 是相鄰的兩層`);
    close(Math.hypot(to[0] - shackle[0], to[1] - shackle[1]), 0, `${link} 的上端接在鉤環上`, 1e-9);
    sides.push(Math.sign(to[2] - shackle[2]));
  }
  assert.ok(sides[0] * sides[1] < 0, "兩根連桿分在鉤環兩側");
});

test("第 494 種:重量越大,吊鉗咬得越緊:尖端夾緊石塊的力和石塊的重量成正比,夾得住石塊(摩擦係數 0.5)", () => {
  const def = m494.default;
  for (const u of [0.3, 0.6, 1]) {
    assert.ok(m494.tongs(u).gripped);
    const W = 1;
    const N = m494.bite(u, W);
    close(m494.bite(u, 2 * W), 2 * N, "石塊重一倍,夾緊的力也大一倍", 1e-9);
    assert.ok(2 * 0.5 * N >= W, `兩邊尖端的摩擦撐得住石重(夾緊力 ${N.toFixed(3)} × 石重)`);
    // 左鉗臂繞鉸點的力矩平衡:連桿的拉力(兩根連桿撐起石重)、尖端受石塊的推力 N 與摩擦(撐起半個石重)
    const pose = def.pose(u);
    const P = pose.parts.armL.position;
    const { from: U, to: S } = pose.parts.linkL;
    const d = [S[0] - U[0], S[1] - U[1]].map((v, _, a) => v / Math.hypot(...a));
    const tension = W / (2 * d[1]);
    const stoneX = Math.max(...stone494(def, pose).map(([x]) => x));
    const tip = armPlates494(def, pose, "armL").flatMap((q) => q.outline).reduce((a, b) => (Math.abs(b[0] - stoneX) < Math.abs(a[0] - stoneX) ? b : a));
    const torque = (r, f) => (r[0] - P[0]) * f[1] - (r[1] - P[1]) * f[0];
    close(torque(U, [tension * d[0], tension * d[1]]) + torque(tip, [N, -W / 2]), 0, "鉗臂的力矩平衡", 1e-3);
    const r = pose.readouts.find((x) => x.label === "夾緊力");
    assert.ok(r && r.value.includes(N.toFixed(2)), "讀數寫出夾緊力是石重的幾倍");
  }
});
