// 第十三章「擒縱機構」:斷言對應原文
import { test } from "node:test";
import assert from "node:assert/strict";
import { close, sweep, part, assertWeightDrive } from "./helpers.js";
import { penetrationDepth, polygonsOverlap, edgeDistance, pointInPolygon } from "../models/contact.js";
import { placePoly, DROP } from "../models/escapement.js";
import { partPoint } from "../models/kit.js";

import * as m288 from "../models/fig288.js";
import * as m289 from "../models/fig289.js";
import * as m290 from "../models/fig290.js";
import * as m292 from "../models/fig292.js";
import * as m297 from "../models/fig297.js";
import * as m299 from "../models/fig299.js";
import * as m291 from "../models/fig291.js";
import * as m293 from "../models/fig293.js";
import fig294 from "../models/fig294.js";
import fig295 from "../models/fig295.js";
import * as cyl from "../models/cylinder-escapement.js";
import * as m296 from "../models/fig296.js";
import * as m298 from "../models/fig298.js";
import fig300 from "../models/fig300.js";
import fig301 from "../models/fig301.js";
import * as twin from "../models/twin-wheel-escapement.js";
import * as m302 from "../models/fig302.js";
import * as m303 from "../models/fig303.js";
import * as m304 from "../models/fig304.js";
import * as m305 from "../models/fig305.js";
import * as m306 from "../models/fig306.js";
import * as m307 from "../models/fig307.js";
import * as m308 from "../models/fig308.js";
import * as m309 from "../models/fig309.js";
import * as m310 from "../models/fig310.js";
import * as m311 from "../models/fig311.js";
import * as m312 from "../models/fig312.js";
import * as m313 from "../models/fig313.js";
import * as m314 from "../models/fig314.js";

/**
 * 由接觸算的擒縱(escapeByContact):擺一個來回輪正好轉過一齒、方向對;擺一程(從一端擺到另一端)轉過約半齒
 * (兩個叉瓦各放一次;齒停在哪裡由接觸決定,叉瓦隨擺沿圓弧走、有回退時兩程會差一點,所以容許 0.35–0.65 齒)
 */
function escapes(e, pitch, dir) {
  close(e.step, dir * pitch, "擺一個來回,輪轉過一齒", 1e-6);
  const w = e.angle;
  close(w(2 * e.period) - w(0), 2 * dir * pitch, "兩個來回,兩齒", 1e-6);
  // 有的輪在擺到盡頭的那一刻還在轉,所以取幾個起點(擺的一程分四段),用最接近半齒的那一個
  const halves = [0, 1, 2, 3].map((k) => ((w((k * e.period) / 8 + e.period / 2) - w((k * e.period) / 8)) * dir) / pitch);
  const halfway = halves.reduce((m, x) => (Math.abs(x - 0.5) < Math.abs(m - 0.5) ? x : m));
  assert.ok(halfway > 0.35 && halfway < 0.65, `擺一程約半齒(實際 ${halves.map((x) => x.toFixed(2)).join("、")} 齒)`);
}

/** 由接觸算:e.at(v) 裡的兩組外形(撥動的銷與叉口、凸柱與細彈簧等)在整個來回裡都不互相穿入 */
function apart(e, a, b, n = 720, eps = 2e-3) {
  const list = (x) => (Array.isArray(x[0][0]) ? x : [x]);
  for (let i = 0; i <= n; i++) {
    const v = (e.period * 2 * i) / n;
    const s = e.at(v);
    for (const p of list(s[a])) for (const q of list(s[b])) assert.ok(penetrationDepth(p, q) < eps, `主動量 ${v.toFixed(3)}:${a} 與 ${b} 互相穿入 ${penetrationDepth(p, q).toFixed(4)}`);
  }
}

/** 由接觸算:叉瓦(掣子)與輪齒在整個來回裡都不互相穿入 */
function noPenetration(e, n = 360, eps = 2e-3) {
  for (let i = 0; i <= n; i++) {
    const v = (e.period * 2 * i) / n;
    const { teeth, stops, layers, stopLayers } = e.at(v);
    for (const [j, s] of stops.entries())
      for (const [i, t] of teeth.entries())
        if (!layers || layers[i] === stopLayers[j])
          assert.ok(penetrationDepth(s, t) < eps, `主動量 ${v.toFixed(3)}:擋件穿入輪齒 ${penetrationDepth(s, t).toFixed(4)}`);
  }
}

test("第 288 種:回退式擒縱:擺每擺一次放走半個齒;叉瓦面不與軸 a 同心,齒落在叉瓦上後輪被推回一點(回退)", () => {
  const e = m288.escapement;
  assert.ok(e.period > 0);
  escapes(e, m288.PITCH, 1);
  const ws = sweep(2 * e.period, 480).map(m288.wheelAngle);
  assert.ok(ws.slice(1).some((w, i) => w < ws[i] - 1e-4), "有回退(輪短暫倒轉)");
  noPenetration(e);
});

test("第 289 種:靜擊式擒縱:叉瓦面與軸 a 同心,齒抵住叉瓦的期間輪完全靜止", () => {
  const e = m289.escapement;
  escapes(e, m289.PITCH, 1);
  const ws = sweep(2 * e.period, 480).map(m289.wheelAngle);
  assert.ok(ws.every((w, i) => i === 0 || w >= ws[i - 1] - 1e-5), "從不回退");
  const still = ws.slice(1).filter((w, i) => Math.abs(w - ws[i]) < 1e-5).length;
  assert.ok(still > 150, `鎖住時完全靜止(靜止的取樣 ${still})`);
  noPenetration(e);
});

test("第 290 種:擺式擒縱:框架每擺一次,叉瓦 A、B 輪流放走半個齒(輪依原圖箭頭順時針轉)", () => {
  escapes(m290.escapement, m290.PITCH, -1);
  noPenetration(m290.escapement);
});

// ── 第 288–290 種(model-audit-fixes-2 票 19):沒有瞬移、重錘驅動、擺、輪輻、字母 ──

/**
 * 沒有瞬移:整週期以每週期 n 步取樣,每步的轉角不超過「自靜止加速落過一個齒距」最後一步的 1.5 倍
 * (escapeByContact 的 drop 預設 DROP:落過一個齒距花 DROP 個週期)。齒被推過叉瓦(一步跳過去)時會超過很多。
 */
function noJump290(e, pitch, n = 2880) {
  const free = (2 * pitch) / (DROP * n);
  let max = 0;
  let at = 0;
  for (let i = 1; i <= 2 * n; i++) {
    const d = Math.abs(e.angle((e.period * i) / n) - e.angle((e.period * (i - 1)) / n));
    if (d > max) [max, at] = [d, i / n];
  }
  assert.ok(max < 1.5 * free, `最大一步 ${max.toFixed(4)}(第 ${at.toFixed(4)} 週期)是自由加速步長 ${free.toFixed(4)} 的 ${(max / free).toFixed(1)} 倍`);
}

test("第 290 種:叉瓦 A 放開齒時,輪從靜止加速轉到 B 上,不會一步被推過叉瓦(整週期沒有瞬移)", () => {
  noJump290(m290.escapement, m290.PITCH);
});

test("第 288、289 種:叉瓦放開齒時,輪從靜止加速轉到另一個叉瓦上(整週期沒有瞬移)", () => {
  noJump290(m288.escapement, m288.PITCH);
  noJump290(m289.escapement, m289.PITCH);
});

test("第 288 種:推斷的重錘驅動——擒縱輪 A 軸上的鼓放出繩、經滑輪吊著重錘,重錘的拉力讓輪逆時針轉", () => {
  const { DRUM, REWIND } = m288.geometry;
  assertWeightDrive(m288.default, { drum: DRUM, wheel: m288.wheelAngle, period: 4 * m288.SWING, every: REWIND, dir: 1 });
});

test("第 289 種:推斷的重錘驅動——擒縱輪 A 軸上的鼓放出繩、經滑輪吊著重錘,重錘的拉力讓輪逆時針轉", () => {
  const { DRUM, REWIND } = m289.geometry;
  assertWeightDrive(m289.default, { drum: DRUM, wheel: m289.wheelAngle, period: 4 * m289.SWING, every: REWIND, dir: 1 });
});

test("第 290 種:推斷的重錘驅動——擒縱輪 D 軸上的鼓放出繩、經滑輪吊著重錘,重錘的拉力讓輪順時針轉", () => {
  const { DRUM, REWIND } = m290.geometry;
  assertWeightDrive(m290.default, { drum: DRUM, wheel: m290.wheelAngle, period: 4 * m290.SWING, every: REWIND, dir: -1 });
});

/** 錨形件由擺帶動(推斷的擺):錨形件最低的一塊(擺錘)在輪的下方,擺桿從軸 a 的轂一路接到擺錘 */
function pendulum288(def, wheelBottom) {
  const anchor = def.parts.find((p) => p.id === "anchor");
  const axisY = anchor.center[1];
  const lowest = anchor.pieces.reduce((m, p) => ((p.at?.[1] ?? 0) < (m.at?.[1] ?? 0) ? p : m));
  assert.ok(axisY + lowest.at[1] < wheelBottom, `擺錘(y ${(axisY + lowest.at[1]).toFixed(2)})在輪的下緣(y ${wheelBottom.toFixed(2)})下方`);
  const rod = anchor.pieces.find((p) => p.kind === "box" && Math.abs(p.at?.[0] ?? 1) < 1e-9 && p.at[1] + p.size[1] / 2 >= 0 && p.at[1] - p.size[1] / 2 <= lowest.at[1]);
  assert.ok(rod, "擺桿從軸 a 往下一路接到擺錘(錨形件由擺的擺動所帶動)");
}

test("第 288、289 種:錨形件 H、L、K 由擺的擺動所帶動——補上的擺桿與擺錘裝在軸 a 上,擺錘在輪的下方", () => {
  pendulum288(m288.default, -1.6 - 2.2);
  pendulum288(m289.default, -0.55 - 1.5);
});

/** 輪輻伸進輪緣(輪緣的孔半徑以內),標記方塊在輪緣上 */
function spokes288(def) {
  const wheel = def.parts.find((p) => p.id === "wheelA");
  const rim = wheel.pieces[0];
  const hole = Math.max(...rim.shape.holes[0].map(([x, y]) => Math.hypot(x, y)));
  const spokes = wheel.pieces.filter((p) => p.kind === "box" && !p.at);
  assert.ok(spokes.length >= 3);
  for (const s of spokes) assert.ok(s.size[0] / 2 > hole + 0.01, `輪輻(半長 ${(s.size[0] / 2).toFixed(3)})伸進輪緣(孔半徑 ${hole.toFixed(3)})`);
  const mark = wheel.pieces.find((p) => p.accent);
  assert.ok(Math.hypot(mark.at[0], mark.at[1]) - mark.size[0] / 2 >= hole - 1e-9, "標記方塊在輪緣上,不懸在孔裡");
}

test("第 288、289 種:輪輻接到輪緣,標記方塊裝在輪緣上(輪是一件)", () => {
  spokes288(m288.default);
  spokes288(m289.default);
});

/**
 * 原文的字母:「齒交替地與叉瓦 K 的外側表面以及叉瓦 H 的內側表面接觸」「齒的末端會沿著表面 c、e 和 d、b 滑動」。
 * H、c、e 標在叉瓦 H 旁,K、d、b 標在叉瓦 K 旁(離自己的叉瓦比離另一個近),c、e(d、b)分在衝擊面的兩端,跟著錨形件擺。
 */
function letters288(mod, ids) {
  const def = mod.default;
  for (const v of sweep(mod.escapement.period, 8)) {
    const [K, H] = mod.escapement.at(v).stops;
    const pose = def.pose(v).parts;
    const near = (id, poly) => {
      const part = def.parts.find((p) => p.id === id);
      assert.ok(part?.label, `標了 ${id}`);
      const pos = pose[id]?.position ?? [...part.center];
      const off = part.labelOffset ?? [0, 0, 0];
      const p = [pos[0] + off[0], pos[1] + off[1]];
      return Math.min(...poly.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1])));
    };
    for (const id of ids.H) assert.ok(near(id, H) < 0.45 && near(id, H) < near(id, K), `主動量 ${v.toFixed(3)}:${id} 標在叉瓦 H 旁`);
    for (const id of ids.K) assert.ok(near(id, K) < 0.45 && near(id, K) < near(id, H), `主動量 ${v.toFixed(3)}:${id} 標在叉瓦 K 旁`);
  }
}

test("第 288、289 種:原文解說用的字母 H、K 與衝擊面兩端的 c、e、d、b 標在叉瓦旁", () => {
  letters288(m288, { H: ["labelc", "labele"], K: ["labeld", "labelb"] });
  letters288(m289, { H: ["labelH", "labelc", "labele"], K: ["labelK", "labeld", "labelb"] });
});

test("第 292 種:凸柱式擒縱:凸柱交替抵在前、後叉瓦上;叉瓦為以 F 為圓心的圓弧,所以是靜擊式", () => {
  const e = m292.escapement;
  close(e.step, -2 * m292.STEP, "擺一個來回,前後各放走一根凸柱", 1e-9);
  const ws = sweep(2 * e.period, 480).map(m292.wheelAngle);
  // 凸柱以多邊形近似,貼著弧面時有 1e-5 弧度的數值抖動
  assert.ok(ws.every((w, i) => i === 0 || w <= ws[i - 1] + 5e-5), "靜擊式:從不回退");
  const still = ws.slice(1).filter((w, i) => Math.abs(w - ws[i]) < 5e-5).length;
  assert.ok(still > 150, `凸柱抵住叉瓦時輪完全靜止(靜止的取樣 ${still})`);
  noPenetration(e);
});

test("第 297 種:燈籠輪擒縱:搖臂 A 上的叉瓦 B、C 輪流擋住銷", () => {
  escapes(m297.escapement, m297.PITCH, 1);
  noPenetration(m297.escapement);
});

test("第 299 種:老式時鐘擒縱(立軸):立軸每擺一次,冠狀輪轉過半個齒", () => {
  assert.equal(m299.N % 2, 1, "齒數為奇數,前後兩側的齒錯開");
  escapes(m299.escapement, m299.PITCH, 1);
  noPenetration(m299.escapement);
});

test("第 291 種:天文台計時器擒縱:擺輪往箭頭方向擺時凸柱壓過細彈簧,A 不動;擺回來時抬起 A 與擋止 d,放走一齒", () => {
  const e = m291.escapement;
  const S = m291.SWING;
  const base = 2 * e.period; // 穩定之後的一個週期
  const fwd = sweep(base + 2 * S, 200, base).map((v) => m291.chronometer(v));
  assert.ok(fwd.every((c) => c.lift < 1e-9), "往箭頭方向擺:A 不動(該凸柱在通過時會將彈簧下壓)");
  assert.ok(fwd.some((c) => c.flex > 0.02), "往箭頭方向擺:細彈簧被壓下去");
  close(fwd[fwd.length - 1].wheel, fwd[0].wheel, "往箭頭方向擺:輪不動", 1e-6);
  const back = sweep(base + 4 * S, 200, base + 2 * S).map((v) => m291.chronometer(v));
  assert.ok(back.some((c) => c.lift > 0.01), "擺回來時 A 被抬起(會將彈簧、A 和擋止 d 一起抬起)");
  assert.ok(back.every((c) => c.flex < 1e-9), "擺回來時細彈簧頂著鉤 k,不彎");
  close(back[back.length - 1].wheel - back[0].wheel, -m291.PITCH, "擺輪來回一次,擒縱輪轉過一齒(順時針)", 1e-6);
  close(e.step, -m291.PITCH, "每週期一齒", 1e-6);
  noPenetration(e);
  apart(m291.escapement, "spring", "pin");
  apart(m291.escapement, "detent", "pin");
});

test("第 293 種:雙合式擒縱:叉瓦 B 每次往一個方向擺時接收一個衝量,輪每次放走一齒", () => {
  const e = m293.escapement;
  const S = m293.SWING;
  close(e.step, -m293.PITCH, "擺輪來回一次,輪轉過一齒", 1e-9);
  noPenetration(e);
  const base = 2 * e.period;
  // 往受衝量的方向擺(先擺的那一程)放走一齒;擺回來只有齒尖落進凹槽一點又被推回
  close(m293.duplex(base + 2 * S).wheel - m293.duplex(base).wheel, -m293.PITCH, "往一個方向擺時放走一齒", 1e-6);
  close(m293.duplex(base + 4 * S).wheel, m293.duplex(base + 2 * S).wheel, "擺回來時不放行", 1e-6);
  const back = sweep(base + 4 * S, 200, base + 2 * S).map((v) => m293.duplex(v).wheel);
  assert.ok(Math.max(...back) - Math.min(...back) < m293.PITCH * 0.25, "擺回來時齒尖只落進凹槽一點");
  // 叉瓦 B 從冠狀齒接收衝量:受衝量那一程有一段輪和 B 相碰
  const touches = sweep(base + 2 * S, 400, base).filter((v) => {
    const { teeth, stops, layers, stopLayers } = e.at(v);
    const rot = teeth.map((t) => t.map(([x, y]) => [x * Math.cos(-1e-3) - (y + 2.2) * Math.sin(-1e-3), x * Math.sin(-1e-3) + (y + 2.2) * Math.cos(-1e-3) - 2.2]));
    return rot.some((t, i) => layers[i] === "crown" && polygonsOverlap(t, stops[stopLayers.indexOf("crown")]));
  });
  assert.ok(touches.length > 10, `冠狀齒推叉瓦 B(相碰的取樣 ${touches.length})`);
});

// 第 291–293 種(model-audit-fixes-2 票 20)用的輔助:零件塊的深度範圍、旋轉方塊的平面範圍、點到多邊形的距離
const zSpan291 = (p) => {
  const z = p.at?.[2] ?? 0;
  const h = p.kind === "plate" ? p.thickness : p.kind === "box" ? p.size[2] : p.length;
  return [z - h / 2, z + h / 2];
};
const inBox291 = ([x, y], b) => {
  const a = -(b.angle ?? 0);
  const dx = x - b.at[0];
  const dy = y - b.at[1];
  return Math.abs(dx * Math.cos(a) - dy * Math.sin(a)) <= b.size[0] / 2 + 1e-9 && Math.abs(dx * Math.sin(a) + dy * Math.cos(a)) <= b.size[1] / 2 + 1e-9;
};
const shift291 = (poly, [dx, dy]) => poly.map(([x, y]) => [x + dx, y + dy]);

test("第 291 種:彈簧 A 於 b 處以螺絲鎖在座上,擋銷立在夾板條上,細彈簧的根部套在凸柱 i 的銷上(止動器與座各是一件)", () => {
  const def = m291.default;
  const get = (id) => def.parts.find((p) => p.id === id);
  const detent = get("detentA");
  const B = detent.center;
  const bar = detent.pieces[0];
  const barZ = zSpan291(bar);
  const foot = get("foot").pieces;
  const plate = get("plate").pieces;
  const plateTop = Math.max(...plate.filter((p) => Math.hypot(p.at[0] - B[0], p.at[1] - B[1]) < 1e-9).map((p) => zSpan291(p)[1])); // b 底下夾板條的凸台頂面
  // 原文:彈簧 A 於 b 處固定或以螺絲鎖於錶的板上——螺絲穿過 A 的端頭,座落在夾板條上
  const screw = foot.find((p) => p.kind === "cylinder" && Math.hypot(p.at[0] - B[0], p.at[1] - B[1]) < 1e-9);
  assert.ok(screw, "座上有一根穿過 b 的螺絲");
  assert.ok(zSpan291(screw)[0] <= barZ[0] && zSpan291(screw)[1] >= barZ[1], "螺絲穿過 A 的端頭");
  assert.ok(foot.some((p) => p.kind === "box" && inBox291(B, p) && Math.abs(zSpan291(p)[0] - plateTop) < 1e-9), "座蓋住 A 的端頭、落在夾板條上");
  // 擋銷(A 被彈簧壓回時靠住的地方,推斷)從夾板條立起、伸到 A 那一層
  const pin = plate.find((p) => p.kind === "cylinder" && Math.hypot(p.at[0] - m291.BANKING[0], p.at[1] - m291.BANKING[1]) < 1e-9);
  assert.ok(pin, "擋銷是夾板條上的一根銷");
  const bars = plate.filter((p) => p.kind === "box" && inBox291(m291.BANKING, p));
  assert.ok(bars.some((b) => Math.abs(zSpan291(pin)[0] - zSpan291(b)[1]) < 1e-9), "擋銷立在夾板條的板面上");
  assert.ok(zSpan291(pin)[1] >= barZ[0] + 0.02 && zSpan291(pin)[0] <= barZ[0], "擋銷伸到 A 那一層");
  // 細彈簧鉸在凸柱 i 上:根部伸到 i 的銷,銷穿過細彈簧那一層
  const spring = get("spring");
  const springZ = zSpan291(spring.pieces[0]);
  assert.ok(Math.max(...spring.pieces[0].shape.outline.map(([x]) => x)) >= -1e-9, "細彈簧的根部伸到凸柱 i 的銷");
  const iLocal = [spring.center[0] - B[0], spring.center[1] - B[1]];
  const iPin = detent.pieces.find((p) => p.kind === "cylinder" && Math.hypot(p.at[0] - iLocal[0], p.at[1] - iLocal[1]) < 1e-9);
  assert.ok(iPin && zSpan291(iPin)[0] <= springZ[0] && zSpan291(iPin)[1] >= springZ[1], "凸柱 i 上的銷穿過細彈簧那一層");
});

test("第 291 種:推斷的重錘驅動——擒縱輪 B 軸上的鼓放出繩、吊著重錘,重錘隨輪下降,降到底時捲回", () => {
  const { drum, every } = m291.WEIGHT_DRIVE;
  assertWeightDrive(m291.default, { drum, wheel: (v) => m291.chronometer(v).wheel, period: m291.escapement.period, every }); // 輪順時針往前轉(繞鼓軸 −1,drum.sense)
});

test("第 292 種:一個叉瓦 B 位於輪的前方(從輪外伸進凸柱的路徑,接右臂 H 經 B 折回),另一個 A 在後方(從輪緣內側往外伸,接左臂 G);叉瓦和臂連成一件", () => {
  const def = m292.default;
  const get = (id) => def.parts.find((p) => p.id === id);
  const anchor = get("anchor");
  const F = anchor.center;
  const plates = anchor.pieces.filter((p) => p.kind === "plate");
  const arms = plates.filter((p) => p.shape.holes.length);
  const pallets = plates.filter((p) => !p.shape.holes.length);
  const front = (list) => list.find((p) => p.at[2] > 0);
  const back = (list) => list.find((p) => p.at[2] < 0);
  const world = (p) => shift291(p.shape.outline, F);
  const labelAt = (id) => [get(id).center[0] + get(id).labelOffset[0], get(id).center[1] + get(id).labelOffset[1]];
  // 原文:一個叉瓦 B 位於輪的前方作動,另一個則於後方作動
  assert.ok(edgeDistance(labelAt("labelB"), world(front(arms))) < 0.4, "字母 B 標在前面那一支臂(右臂折角)上");
  assert.ok(edgeDistance(labelAt("labelB"), world(back(arms))) > 0.8, "字母 B 不在後面那一支臂上");
  assert.ok(edgeDistance(labelAt("labelA"), world(back(pallets))) < 0.5, "字母 A 標在後面的叉瓦旁");
  const centroid = (poly) => poly.reduce((s, p) => [s[0] + p[0] / poly.length, s[1] + p[1] / poly.length], [0, 0]);
  const fromWheel = (p) => Math.hypot(...centroid(world(p)).map((x, i) => x - get("wheel").center[i]));
  assert.ok(fromWheel(front(pallets)) > m292.STUD_RADIUS, "前面的叉瓦 B 從輪外往內伸");
  assert.ok(fromWheel(back(pallets)) < m292.STUD_RADIUS, "後面的叉瓦 A 從輪緣內側往外伸");
  // 叉瓦接在臂的末端:平面上重疊、深度上相接
  for (const [arm, pallet, side] of [[front(arms), front(pallets), "前"], [back(arms), back(pallets), "後"]]) {
    assert.ok(polygonsOverlap(arm.shape.outline, pallet.shape.outline), `${side}臂的末端落在${side}叉瓦上`);
    const [a, p] = [zSpan291(arm), zSpan291(pallet)];
    assert.ok(Math.min(a[1], p[1]) - Math.max(a[0], p[0]) >= -1e-9, `${side}叉瓦和${side}臂在深度上相接`);
  }
});

test("第 292 種:推斷的擺——擺桿裝在錨形件的軸上,和錨形件一起擺;擒縱輪由重錘帶動,降到底時捲回", () => {
  const def = m292.default;
  const get = (id) => def.parts.find((p) => p.id === id);
  const pendulum = get("pendulum");
  assert.deepEqual(pendulum.center, get("anchor").center, "擺和錨形件同一根軸");
  for (const v of sweep(4 * m292.SWING, 8)) close(def.pose(v).parts.pendulum.angle, def.pose(v).parts.anchor.angle, "擺和錨形件一起擺");
  const arbor = get("anchor").pieces.find((p) => p.kind === "cylinder" && !p.inner && Math.hypot(p.at?.[0] ?? 0, p.at?.[1] ?? 0) < 1e-9 && zSpan291(p)[0] < -1);
  const hub = pendulum.pieces.find((p) => p.kind === "cylinder" && Math.hypot(p.at?.[0] ?? 0, p.at?.[1] ?? 0) < 1e-9);
  assert.ok(arbor && hub && zSpan291(arbor)[0] < zSpan291(hub)[1] && zSpan291(hub)[0] < zSpan291(arbor)[1], "擺的轂套在錨形件的軸上");
  assert.ok(def.driver.grips.includes("pendulum"), "擺也是主動件的抓取處");
  const { drum, every } = m292.WEIGHT_DRIVE;
  assertWeightDrive(def, { drum, wheel: m292.wheelAngle, period: m292.escapement.period, every }); // 輪順時針往前轉(繞鼓軸 −1,drum.sense)
});

test("第 293 種:解鎖後冠狀齒追上叉瓦 B 才推它走——受衝量那一程輪從不回轉、沒有一步跳很多", () => {
  const e = m293.escapement;
  const S = m293.SWING;
  const base = 2 * e.period;
  const ws = sweep(base + 2 * S, 2000, base).map(e.angle);
  for (let i = 1; i < ws.length; i++) assert.ok(ws[i] <= ws[i - 1] + 1e-4, `受衝量那一程輪不回轉(第 ${i} 步回轉 ${(ws[i] - ws[i - 1]).toFixed(4)})`);
  const all = sweep(base + e.period, 2000, base).map(e.angle);
  const big = Math.max(...all.slice(1).map((w, i) => Math.abs(w - all[i])));
  assert.ok(big < 0.02 * m293.PITCH, `沒有瞬移(最大一步 ${(big / m293.PITCH).toFixed(3)} 齒)`);
});

test("第 293 種:擺輪(推斷)固定在軸 A 上,不擋住滾子與凹槽;擒縱輪由重錘帶動,降到底時捲回", () => {
  const def = m293.default;
  const staff = def.parts.find((p) => p.id === "staffA");
  const axle = staff.pieces.find((p) => p.kind === "cylinder" && p.length > 1);
  const roller = staff.pieces[0];
  const rollerR = Math.max(...roller.shape.outline.map(([x, y]) => Math.hypot(x, y)));
  for (const p of staff.pieces.filter((q) => q !== roller && q !== axle)) {
    // 軸上的板、轂:孔不比軸大(固定在軸上);比滾子大的(擺輪)在滾子後面,不擋住滾子與凹槽
    let reach;
    if (p.kind === "plate") {
      for (const h of p.shape.holes) assert.ok(Math.max(...h.map(([x, y]) => Math.hypot(x, y))) <= axle.radius + 1e-9, "軸上的板的孔不比軸大(固定在軸上)");
      // 只看套在軸上的板(輪廓圍住軸心);叉瓦 B 是從軸往外伸的細臂,本來就在前面那一層
      const around = p.shape.outline.reduce((inside, [x1, y1], i, o) => {
        const [x2, y2] = o[(i + 1) % o.length];
        return y1 > 0 !== y2 > 0 && 0 < ((x2 - x1) * (0 - y1)) / (y2 - y1) + x1 ? !inside : inside;
      }, false);
      reach = around ? Math.max(...p.shape.outline.map(([x, y]) => Math.hypot(x, y))) : 0;
    } else if (p.kind === "cylinder") {
      if (p.inner && p.radius <= rollerR) assert.ok(p.inner <= axle.radius + 1e-9, "軸上的轂的孔不比軸大(固定在軸上)");
      reach = p.radius;
    } else reach = Math.hypot(p.size[0], p.size[1]) / 2;
    if (reach > rollerR + 0.05) assert.ok(zSpan291(p)[1] < zSpan291(roller)[0], "比滾子大的零件在滾子後面,不擋住滾子與凹槽");
  }
  const { drum, every } = m293.WEIGHT_DRIVE;
  assertWeightDrive(def, { drum, wheel: m293.escapement.angle, period: m293.escapement.period, every }); // 輪順時針往前轉(繞鼓軸 −1,drum.sense)
});

test("第 294–295 種:圓筒式擒縱(同一機構的立體圖與放大圖):擺輪每擺一次,擒縱輪前進半個齒", () => {
  for (const v of [0, 1.3, 5]) assert.deepEqual(fig294.pose(v).parts, fig295.pose(v).parts, "兩圖的姿勢一致");
  assert.notDeepEqual(fig294.view.direction, fig295.view.direction, "初始視角不同");
  escapes(cyl.escapement, cyl.PITCH, -1);
  noPenetration(cyl.escapement);
  // 叉瓦交替地停靠於圓筒的內側與外側:擺輪在兩端時,停住的齒尖一次在圓筒裡、一次在圓筒外
  const S = cyl.SWING;
  const inside = (v) => {
    const { teeth } = cyl.escapement.at(v);
    const [cx, cy] = [0, 2.2];
    const tip = teeth.map((t) => t.reduce((m, p) => (Math.hypot(p[0] - cx, p[1] - cy) < Math.hypot(m[0] - cx, m[1] - cy) ? p : m))).find((p) => Math.hypot(p[0] - cx, p[1] - cy) < 0.3);
    return tip ? Math.hypot(tip[0] - cx, tip[1] - cy) < 0.2 : null;
  };
  const base = 2 * cyl.escapement.period;
  assert.notEqual(inside(base), inside(base + 2 * S), "一次停在圓筒外、一次停在圓筒內");
});

test("第 296 種:槓桿式擒縱:擺輪的銷在每次擺動的中途進入凹槽 E,撥動槓桿,叉瓦放走半個齒", () => {
  const e = m296.escapement;
  const S = m296.SWING;
  escapes(e, m296.PITCH, -1);
  noPenetration(e);
  // 銷不在凹槽裡時(擺輪在兩端附近),槓桿停在擋銷上不動
  const base = 2 * e.period;
  const ends = [...sweep(base + 0.4 * S, 40, base), ...sweep(base + 2.4 * S, 40, base + 1.6 * S)].map((v) => m296.lever(v).lever);
  assert.ok(ends.slice(0, 41).every((a) => Math.abs(Math.abs(a) - m296.BANK) < 2e-3), "擺輪在一端時槓桿靠在擋銷上");
  assert.ok(Math.sign(ends[0]) !== Math.sign(ends[ends.length - 1]), "擺過一次,槓桿換到另一邊的擋銷");
  // 銷在每次擺動的中途進入凹槽:槓桿只在擺輪居中附近轉動
  const moving = sweep(base + 2 * S, 400, base).filter((v, i, vs) => i > 0 && Math.abs(m296.lever(v).lever - m296.lever(vs[i - 1]).lever) > 1e-6);
  assert.ok(moving.every((v) => Math.abs(m296.lever(v).balance) < 0.5 * S), "槓桿只在擺輪居中附近被撥動");
  apart(m296.escapement, "fork", "pin");
});

// 第 294–296 種的檢查共用:零件塊的深度範圍(z)、平面上的點是否在凸多邊形 / 轉過角度的長方形裡
const depth294 = (p) => {
  const z = p.at?.[2] ?? 0;
  const h = p.kind === "plate" ? p.thickness / 2 : p.kind === "cylinder" ? p.length / 2 : p.size[2] / 2;
  return [z - h, z + h];
};
const depthsMeet294 = ([a0, a1], [b0, b1]) => Math.min(a1, b1) - Math.max(a0, b0) > 1e-6;
const inConvex294 = ([x, y], poly) => {
  const s = poly.map((a, i) => {
    const b = poly[(i + 1) % poly.length];
    return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
  });
  return s.every((v) => v > 0) || s.every((v) => v < 0);
};
const inBox294 = ([x, y], box) => {
  const a = box.angle ?? 0;
  const [dx, dy] = [x - box.at[0], y - box.at[1]];
  const u = dx * Math.cos(a) + dy * Math.sin(a);
  const w = -dx * Math.sin(a) + dy * Math.cos(a);
  return Math.abs(u) <= box.size[0] / 2 + 1e-9 && Math.abs(w) <= box.size[1] / 2 + 1e-9;
};
// 各塊的外接盒(平面上的板取外形的範圍、box 取轉過角度後的四角、圓柱沿 z),外接盒相接的連成一群
const aabb294 = (p) => {
  const [z0, z1] = depth294(p);
  const at = p.at ?? [0, 0, 0];
  let pts;
  if (p.kind === "plate") pts = p.shape.outline.map(([x, y]) => [x + at[0], y + at[1]]);
  else if (p.kind === "cylinder") pts = [[at[0] - p.radius, at[1] - p.radius], [at[0] + p.radius, at[1] + p.radius]];
  else {
    const a = p.angle ?? 0;
    pts = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([i, j]) => {
      const [u, w] = [(i * p.size[0]) / 2, (j * p.size[1]) / 2];
      return [at[0] + u * Math.cos(a) - w * Math.sin(a), at[1] + u * Math.sin(a) + w * Math.cos(a)];
    });
  }
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  return [[Math.min(...xs), Math.min(...ys), z0], [Math.max(...xs), Math.max(...ys), z1]];
};
function groups294(pieces) {
  const boxes = pieces.map(aabb294);
  const touch = ([a0, a1], [b0, b1]) => [0, 1, 2].every((i) => a0[i] <= b1[i] + 1e-6 && b0[i] <= a1[i] + 1e-6);
  const left = new Set(boxes.keys());
  const groups = [];
  while (left.size) {
    const g = [left.values().next().value];
    left.delete(g[0]);
    for (let k = 0; k < g.length; k++) for (const i of [...left]) if (touch(boxes[i], boxes[g[k]])) [left.delete(i), g.push(i)];
    groups.push(g.sort((x, y) => x - y));
  }
  return groups;
}

test("第 294–295 種:推斷的重錘驅動——擒縱輪軸上的鼓放出繩、吊著重錘,重錘隨輪下降,輪轉一圈捲回", () => {
  const { DRUM, REWIND } = cyl.geometry;
  for (const def of [fig294, fig295]) assertWeightDrive(def, { drum: DRUM, wheel: cyl.escapement.angle, period: cyl.escapement.period, every: REWIND, dir: -1 });
});

test("第 296 種:推斷的重錘驅動——擒縱輪 A 軸上的鼓放出繩、吊著重錘,重錘隨輪下降,輪轉一圈捲回", () => {
  const { DRUM, REWIND } = m296.geometry;
  assertWeightDrive(m296.default, { drum: DRUM, wheel: m296.escapement.angle, period: m296.escapement.period, every: REWIND, dir: -1 });
});

test("第 294–295 種:楔形齒立在細柄上(柄從輪緣伸出、短柱頂著楔形齒的後端),軸承架是一件", () => {
  const wheel = fig294.parts.find((p) => p.id === "wheel").pieces;
  const wedges = wheel.filter((p) => p.kind === "plate" && p.shape.outline.length === 3);
  assert.equal(wedges.length, cyl.N, "每齒一個楔形叉瓦");
  const posts = wheel.filter((p) => p.kind === "cylinder" && p.at && Math.hypot(p.at[0], p.at[1]) > 1);
  const stalks = wheel.filter((p) => p.kind === "box" && p.at && Math.hypot(p.at[0], p.at[1]) > 1);
  for (const [i, w] of wedges.entries()) {
    const post = posts.find((c) => inConvex294(c.at, w.shape.outline) && depthsMeet294(depth294(c), depth294(w)));
    assert.ok(post, `第 ${i} 齒:有一根短柱在楔形齒底下、頂到齒`);
    assert.ok(stalks.some((s) => inBox294(post.at, s) && depthsMeet294(depth294(s), depth294(post))), `第 ${i} 齒:短柱立在細柄上`);
  }
  const cock = fig294.parts.find((p) => p.id === "cock").pieces;
  const g = groups294(cock);
  assert.equal(g.length, 1, `軸承架各塊相連(不相連的群 ${g.map((x) => x.join("、")).join(" / ")})`);
});

test("第 294–295 種:圓筒的頂部連接著擺輪(推斷補上的擺輪裝在擺輪軸上、圓筒切口那一層的另一端)", () => {
  const cylinder = fig294.parts.find((p) => p.id === "cylinder").pieces;
  const { BALANCE } = cyl.geometry;
  const wheelPiece = cylinder.find((p) => p.kind === "plate" && Math.max(...p.shape.outline.map(([x, y]) => Math.hypot(x, y))) > BALANCE.radius - 1e-6);
  assert.ok(wheelPiece, "圓筒那一件裡有擺輪");
  assert.ok(BALANCE.radius > 2.5 * 0.24, "擺輪比圓筒大得多");
  // 圓筒(外徑 0.24 的各塊)的一端是切口那一層,擺輪在另一端之外
  const [r0, r1] = depth294(cylinder[0]);
  const tube = cylinder.filter((p) => (p.kind === "cylinder" && Math.abs(p.radius - 0.24) < 1e-9) || (p.kind === "plate" && Math.abs(Math.max(...p.shape.outline.map(([x, y]) => Math.hypot(x, y))) - 0.24) < 1e-3));
  const [t0, t1] = [Math.min(...tube.map((p) => depth294(p)[0])), Math.max(...tube.map((p) => depth294(p)[1]))];
  const [b0, b1] = depth294(wheelPiece);
  assert.ok((Math.abs(r1 - t1) < 1e-9 && b1 <= t0 + 1e-9) || (Math.abs(r0 - t0) < 1e-9 && b0 >= t1 - 1e-9), "擺輪在圓筒的另一端(切口那一層的對面)之外");
  const staff = cylinder.find((p) => p.kind === "cylinder" && p.radius < 0.1 && depthsMeet294(depth294(p), [b0, b1]));
  assert.ok(staff, "擺輪軸穿過擺輪");
});

test("第 294–295 種:初始視角看得到齒與圓筒切口——第 295 種從叉瓦那一層的正面看,前面沒有圓筒的其餘部分與軸承架;第 294 種從側面看、軸橫放", () => {
  const d = fig295.view.direction;
  assert.ok(Math.abs(d[2]) > 3 * Math.hypot(d[0], d[1]), "第 295 種沿圓筒軸看(看叉瓦那一層的剖面)");
  // 切開的圓環(cylinder 的第一塊)之外,圓筒、擺輪軸、擺輪與軸承架的每一塊都在圓環背對觀看者的那一面之後
  const [r0, r1] = depth294(fig295.parts.find((p) => p.id === "cylinder").pieces[0]);
  for (const id of ["cylinder", "cock"])
    for (const [i, p] of fig295.parts.find((q) => q.id === id).pieces.entries()) {
      if (id === "cylinder" && i === 0) continue;
      const [z0, z1] = depth294(p);
      assert.ok(d[2] > 0 ? z1 <= r0 + 1e-9 : z0 >= r1 - 1e-9, `${id} pieces[${i}](z ${z0.toFixed(2)}..${z1.toFixed(2)})擋在叉瓦那一層的前面`);
    }
  const e = fig294.view.direction;
  assert.ok(Math.abs(e[2]) < 0.5 * Math.hypot(e[0], e[1]), "第 294 種從側面看,圓筒軸橫放");
});

test("第 296 種:兩根擋銷裝在夾板條上(從夾板條立起)", () => {
  const frame = m296.default.parts.find((p) => p.id === "frame").pieces;
  const pins = frame.filter((p) => p.kind === "cylinder" && p.radius < 0.1);
  assert.equal(pins.length, 2, "兩根擋銷");
  const bars = frame.filter((p) => p.kind === "box");
  for (const pin of pins) assert.ok(bars.some((b) => inBox294(pin.at, b) && depthsMeet294(depth294(b), depth294(pin))), `擋銷 (${pin.at[0].toFixed(2)}, ${pin.at[1].toFixed(2)}) 插在夾板條裡`);
});
// 第 298 種照原圖重讀成惠更斯的 pirouette(2026-10-12 決定):擺輪 C 的直立軸上端是小齒輪,水平立軸右端的冠狀齒輪咬它;
// 立軸左段的兩個叉瓦擋左下的擒縱輪
const piece298 = (def, id, kind) => part(def, id).pieces.find((p) => p.kind === kind);
/** 兩個多邊形的間隙(不相交時是頂點到對方邊的最短距離) */
const gap298 = (a, b) => (polygonsOverlap(a, b) ? 0 : Math.min(...a.map((p) => edgeDistance(p, b)), ...b.map((p) => edgeDistance(p, a))));

test("第 298 種(原圖):擺輪軸上端的小齒輪咬水平立軸右端的冠狀齒輪;直立軸在冠狀齒輪右邊,立軸往左伸過左下的擒縱輪", () => {
  const def = m298.default;
  const balance = part(def, "balance");
  const verge = part(def, "verge");
  const wheel = part(def, "wheel");
  const pinion = piece298(def, "balance", "gear");
  const contrate = piece298(def, "verge", "gear");
  assert.deepEqual(balance.axis, [0, 1, 0], "擺輪軸直立");
  assert.deepEqual(verge.axis, [1, 0, 0], "立軸水平(左右)");
  assert.ok(contrate.crown, "立軸右端是冠狀齒輪(齒長在輪面上,朝右)");
  // 小齒輪的左緣(節圓)落在冠狀齒輪右面的齒帶裡:沿立軸在齒的深度內、離立軸的距離在齒面寬內
  const left = [balance.center[0] - pinion.radius, balance.center[1] + pinion.at[2], balance.center[2]];
  const face = verge.center[0] + contrate.width / 2;
  assert.ok(left[0] > face && left[0] < face + contrate.toothDepth, `小齒輪的齒伸進冠狀齒輪的齒間(x ${left[0].toFixed(3)},齒帶 ${face.toFixed(3)}–${(face + contrate.toothDepth).toFixed(3)})`);
  const r = Math.hypot(left[1] - verge.center[1], left[2] - verge.center[2]);
  assert.ok(r > contrate.radius - contrate.faceWidth && r < contrate.radius, `小齒輪在冠狀齒輪的齒面寬內(離立軸 ${r.toFixed(3)})`);
  assert.ok(pinion.at[2] > 0 && pinion.at[2] < part(def, "balance").pieces[0].at[2], "小齒輪在擺輪下方、立軸上方");
  // 原圖的配置:直立軸在冠狀齒輪右邊;擒縱輪在左下,立軸往左伸過它
  assert.ok(balance.center[0] > verge.center[0], "直立軸在冠狀齒輪右邊");
  assert.ok(wheel.center[0] < verge.center[0] - 1 && wheel.center[1] < verge.center[1], "擒縱輪在左下");
});

test("第 298 種(pirouette):擺輪擺動經小齒輪帶動立軸,擺輪擺的角度是立軸的 冠狀齒輪齒數 / 小齒輪齒數 倍", () => {
  const ratio = m298.CONTRATE.teeth / m298.PINION.teeth;
  assert.ok(ratio >= 3, "擺輪擺得比立軸大好幾倍");
  const p0 = m298.default.pose(0).parts;
  for (const v of sweep(4 * m298.SWING, 40)) {
    const p = m298.default.pose(v).parts;
    close(Math.abs(p.balance.angle - p0.balance.angle), ratio * Math.abs(p.verge.angle - p0.verge.angle), `主動量 ${v.toFixed(3)}`, 1e-9);
  }
});

test("第 298 種:立軸左段的兩個叉瓦輪流擋住擒縱輪(冠狀輪,偏離插圖):擺輪每擺一次,輪照原圖箭頭逆時針轉過半個齒", () => {
  const e = m298.escapement;
  escapes(e, m298.PITCH, 1);
  noPenetration(e);
  // 輪軸朝上:轉角增加 = 從上面看逆時針(原圖箭頭逆時針)
  assert.deepEqual(part(m298.default, "wheel").axis, [0, 1, 0]);
  const ws = sweep(4 * e.period, 200).map((v) => m298.default.pose(v).parts.wheel.angle);
  assert.ok(ws.at(-1) - ws[0] > 3.9 * m298.PITCH, "往逆時針前進");
});

test("第 298 種:輪停住或被推回時是叉瓦真的擋住齒——間隙接近 0、輪再往前轉 0.01 就撞進叉瓦;一個來回裡兩個叉瓦各擋過", () => {
  const e = m298.escapement;
  const R = m298.geometry.TEETH_R;
  const seen = new Set();
  let stops = 0;
  for (let i = 0; i < 720; i++) {
    const v = (e.period * i) / 720;
    if (e.angle(v + e.period / 1440) - e.angle(v) > 1e-6) continue; // 輪往前轉的取樣不查
    stops++;
    const s = e.at(v);
    let best = Infinity;
    let layer;
    s.stops.forEach((st, j) =>
      s.teeth.forEach((t, k) => {
        if (s.layers[k] !== s.stopLayers[j]) return;
        const g = gap298(st, t);
        if (g < best) [best, layer] = [g, s.layers[k]];
      }),
    );
    assert.ok(best < 2e-3, `主動量 ${v.toFixed(3)}:輪停住,但最近的叉瓦離齒 ${best.toFixed(4)}`);
    seen.add(layer);
    // 前端的齒往 +x 走、後端往 −x(轉角增加時)
    const d = 0.01 * R;
    const pushed = s.teeth.map((t, k) => t.map(([x, y]) => [x + (s.layers[k] === "front" ? d : -d), y]));
    const hits = s.stops.some((st, j) => pushed.some((t, k) => s.layers[k] === s.stopLayers[j] && penetrationDepth(st, t) > 1e-4));
    assert.ok(hits, `主動量 ${v.toFixed(3)}:輪再往前轉 0.01 就撞進叉瓦`);
  }
  assert.ok(stops > 100, `擺一個來回,輪有一段時間被擋住(停住的取樣 ${stops})`);
  assert.deepEqual([...seen].sort(), ["back", "front"], "兩個叉瓦各擋過");
});

test("第 298 種:推斷的重錘驅動——擒縱輪軸上的鼓放出繩、經滑輪吊著重錘,重錘隨輪下降;降到底時捲回(上鍊)", () => {
  const { DRUM, REWIND } = m298.geometry;
  assertWeightDrive(m298.default, { drum: DRUM, wheel: (v) => m298.default.pose(v).parts.wheel.angle, period: 4 * m298.SWING, every: REWIND });
});

test("第 300–301 種:同一機構的前視與側視圖;叉瓦交替地由兩個擒縱輪之一的齒作用,每擺一次輪轉過半個齒", () => {
  for (const v of [0, 0.4, 2]) assert.deepEqual(fig300.pose(v).parts, fig301.pose(v).parts, "兩圖的姿勢一致");
  assert.notDeepEqual(fig300.view.direction, fig301.view.direction, "初始視角不同");
  escapes(twin.escapement, twin.PITCH, 1);
  noPenetration(twin.escapement);
});

// ── 第 297、299、300 種(model-audit-fixes-2 票 23)──

/**
 * 從正面(+z)看,零件的一塊在 xy 平面上蓋住哪裡:回傳 { zmin, has(x, y) }。center、angle 是零件(軸沿 z 的群組)的位置與轉角;
 * 只處理這三張圖用到的塊:方塊(可繞 z 轉)、圓柱(軸沿 x、y 或 z;沿 z 的環不算內孔)、平板(軸沿 z)。
 */
function cover299(piece, center = [0, 0, 0], angle = 0) {
  const at = piece.at ?? [0, 0, 0];
  const [cx, cy] = [center[0] + at[0] * Math.cos(angle) - at[1] * Math.sin(angle), center[1] + at[0] * Math.sin(angle) + at[1] * Math.cos(angle)];
  const z = center[2] + at[2];
  const local = (x, y, a) => [(x - cx) * Math.cos(-a) - (y - cy) * Math.sin(-a), (x - cx) * Math.sin(-a) + (y - cy) * Math.cos(-a)];
  if (piece.kind === "box") {
    const a = angle + (piece.angle ?? 0);
    return { zmin: z - piece.size[2] / 2, has: (x, y) => { const [u, w] = local(x, y, a); return Math.abs(u) <= piece.size[0] / 2 && Math.abs(w) <= piece.size[1] / 2; } };
  }
  if (piece.kind === "cylinder") {
    const ax = piece.axis ?? [0, 0, 1];
    if (Math.abs(ax[2]) > 0.99) return { zmin: z - piece.length / 2, has: (x, y) => { const d = Math.hypot(x - cx, y - cy); return d <= piece.radius && d >= (piece.inner ?? 0); } };
    const [hx, hy] = Math.abs(ax[0]) > 0.99 ? [piece.length / 2, piece.radius] : [piece.radius, piece.length / 2];
    return { zmin: z - piece.radius, has: (x, y) => Math.abs(x - cx) <= hx && Math.abs(y - cy) <= hy };
  }
  if (piece.kind === "plate") return { zmin: z - piece.thickness / 2, has: (x, y) => pointInPolygon(local(x, y, angle), piece.shape.outline) };
  return { zmin: Infinity, has: () => false };
}
/** 多邊形 poly(正面看的 xy)裡被 z 在 zFront 之前的塊蓋住的比例(格點取樣) */
function hiddenShare299(poly, zFront, covers) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const front = covers.filter((c) => c.zmin > zFront);
  let inside = 0;
  let hidden = 0;
  for (let i = 0; i <= 60; i++)
    for (let j = 0; j <= 60; j++) {
      const x = Math.min(...xs) + ((Math.max(...xs) - Math.min(...xs)) * i) / 60;
      const y = Math.min(...ys) + ((Math.max(...ys) - Math.min(...ys)) * j) / 60;
      if (!pointInPolygon([x, y], poly)) continue;
      inside++;
      if (front.some((c) => c.has(x, y))) hidden++;
    }
  return hidden / inside;
}

test("第 297 種:推斷的重錘驅動——燈籠輪軸上的鼓放出繩、經滑輪吊著重錘,重錘隨輪下降(輪受的固定力矩從哪裡來)", () => {
  const { DRUM, REWIND } = m297.geometry;
  assertWeightDrive(m297.default, { drum: DRUM, wheel: m297.wheelAngle, period: 4 * m297.SWING, every: REWIND, dir: 1 });
});

test("第 299 種:叉瓦與齒照原圖的比例(叉瓦約輪半徑的一半長、齒高約輪半徑的一半),從正面看叉瓦不被套環、軸承與機架蓋住", () => {
  const def = m299.default;
  const crown = part(def, "crown");
  const verge = part(def, "verge");
  const R = crown.pieces[0].radius;
  const pallets = verge.pieces.filter((p) => p.kind === "plate");
  const front = pallets.find((p) => p.at[2] > 0);
  const length = Math.max(...front.shape.outline.map(([x, y]) => Math.hypot(x, y)));
  assert.ok(length / R > 0.45, `叉瓦長 / 輪半徑 = ${(length / R).toFixed(2)}(原圖約 0.55)`);
  const tooth = Math.max(...crown.pieces.filter((p) => p.kind === "plate" && p.rotation).flatMap((p) => p.shape.outline.map(([, y]) => y)));
  assert.ok(tooth / R > 0.4, `齒高 / 輪半徑 = ${(tooth / R).toFixed(2)}(原圖約 0.5)`);
  const zFront = front.at[2] + front.thickness / 2;
  for (const v of sweep(4 * m299.SWING, 16)) {
    const angle = def.pose(v).parts.verge.angle;
    const covers = [
      ...part(def, "frame").pieces.map((p) => cover299(p)),
      ...verge.pieces.filter((p) => p.kind !== "plate").map((p) => cover299(p, verge.center, angle)),
    ];
    const poly = placePoly(front.shape.outline, verge.center, angle);
    const share = hiddenShare299(poly, zFront, covers);
    assert.ok(share < 0.15, `主動量 ${v.toFixed(3)}:前叉瓦被前面的零件蓋住 ${(share * 100).toFixed(0)}%`);
  }
});

test("第 299 種:冠狀輪軸固定在輪盤上、立軸的套環固定在立軸上,立軸兩端穿過軸承", () => {
  const def = m299.default;
  const crown = part(def, "crown");
  const disc = crown.pieces.find((p) => p.kind === "plate" && p.shape.holes?.length);
  const hole = Math.max(...disc.shape.holes[0].map(([x, y]) => Math.hypot(x, y)));
  const axle = crown.pieces.find((p) => p.kind === "cylinder" && !p.inner && p.at && p.at[2] < 0);
  assert.ok(hole <= axle.radius + 1e-6, `輪盤的孔(半徑 ${hole.toFixed(3)})等於軸徑(${axle.radius})`);
  const verge = part(def, "verge");
  const staff = verge.pieces[0];
  const collar = verge.pieces.find((p) => p.kind === "cylinder" && p.inner);
  assert.ok(collar.inner <= staff.radius + 1e-6, `套環內徑 ${collar.inner} 等於立軸半徑 ${staff.radius}`);
  const bearings = part(def, "frame").pieces.filter((p) => p.kind === "cylinder" && p.inner && !p.axis);
  assert.equal(bearings.length, 2, "立軸兩端各一個軸承");
  for (const b of bearings) {
    assert.ok(Math.abs(b.at[0] - verge.center[0]) < 1e-9 && Math.abs(b.at[1] - verge.center[1]) < 1e-9, "軸承對準立軸");
    assert.ok(b.inner <= staff.radius + 1e-6, "軸承孔等於軸徑");
    assert.ok(Math.abs(b.at[2]) + b.length / 2 <= staff.length / 2, `立軸穿過 z = ${b.at[2].toFixed(2)} 的軸承`);
  }
});

test("第 299 種:推斷的重錘驅動——冠狀輪軸上的鼓放出繩、經滑輪吊著重錘,重錘隨輪下降", () => {
  const { DRUM, REWIND } = m299.geometry;
  assertWeightDrive(m299.default, { drum: DRUM, wheel: m299.wheelAngle, period: 4 * m299.SWING, every: REWIND, dir: 1 });
});

test("第 300 種:齒數照原圖(約 18–20 個鉤形齒);抓取用的方塊裝在輪輻上;從正面看半圓叉瓦前面沒有機架", () => {
  assert.ok(twin.N >= 18 && twin.N <= 20, `齒數 ${twin.N}(原圖約 18–20 齒)`);
  const wheels = part(fig300, "wheels");
  const rectOf = (p) => {
    const a = p.angle ?? 0;
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
      const [u, w] = [(sx * p.size[0]) / 2, (sy * p.size[1]) / 2];
      return [p.at[0] + u * Math.cos(a) - w * Math.sin(a), p.at[1] + u * Math.sin(a) + w * Math.cos(a)];
    });
  };
  const grip = wheels.pieces.find((p) => p.accent);
  const spokes = wheels.pieces.filter((p) => p.kind === "box" && !p.accent);
  const on = spokes.filter((s) => polygonsOverlap(rectOf(grip), rectOf(s)) && Math.max(grip.at[2] - grip.size[2] / 2, s.at[2] - s.size[2] / 2) <= Math.min(grip.at[2] + grip.size[2] / 2, s.at[2] + s.size[2] / 2) + 1e-9);
  assert.ok(on.length > 0, "抓取用的方塊貼在一根輪輻上(平面上重疊、深度相接)");
  const { STAFF_Y, DISC, PALLET_X } = twin.geometry;
  const pallet = [[-PALLET_X, STAFF_Y - DISC], [PALLET_X, STAFF_Y - DISC], [PALLET_X, STAFF_Y], [-PALLET_X, STAFF_Y]];
  const share = hiddenShare299(pallet, 0, part(fig300, "frame").pieces.map((p) => cover299(p)));
  assert.equal(share, 0, `半圓叉瓦(從正面看是側面)被前面的機架蓋住 ${(share * 100).toFixed(0)}%`);
});

test("第 300–301 種:推斷的重錘驅動——輪軸上的鼓放出繩、經滑輪吊著重錘,重錘隨雙擒縱輪下降", () => {
  const { DRUM, REWIND } = twin.geometry;
  assertWeightDrive(fig300, { drum: DRUM, wheel: twin.escapement.angle, period: 4 * twin.SWING, every: REWIND, dir: 1 });
});

// ── 第 296、297、299、300 種補擺 / 擺輪,第 300 種托架不擋齒(code review 後)──

const reach296 = (p) => Math.max(...p.shape.outline.map(([x, y]) => Math.hypot(x, y)));

test("第 296 種:擺輪(推斷)——帶銷的圓盤 D 與擺輪固定在同一根擺輪軸上;擺輪在夾板條後面,不擋住銷與凹槽 E", () => {
  const roller = part(m296.default, "roller");
  const disc = roller.pieces[0];
  const rim = roller.pieces.find((p) => p.kind === "plate" && p.shape.holes?.length && reach296(p) > 2 * reach296(disc));
  assert.ok(rim, "擺輪的輪緣比帶銷的圓盤 D 大得多");
  const hole = Math.max(...rim.shape.holes[0].map(([x, y]) => Math.hypot(x, y)));
  const spokes = roller.pieces.filter((p) => p.kind === "plate" && p !== rim && p !== disc && depthsMeet294(depth294(p), depth294(rim)));
  assert.ok(spokes.length >= 2 && spokes.every((s) => reach296(s) > hole), "輪輻伸進輪緣");
  const hub = roller.pieces.find((p) => p.kind === "cylinder" && p.radius > 0.08 && !(p.at?.[0] || p.at?.[1]) && depthsMeet294(depth294(p), depth294(rim)));
  const staff = roller.pieces.find((p) => p.kind === "cylinder" && p.radius < 0.08 && !(p.at?.[0] || p.at?.[1]) && depthsMeet294(depth294(p), depth294(rim)));
  assert.ok(hub && staff, "擺輪的輪轂固定在擺輪軸上(軸穿過擺輪)");
  assert.ok(depthsMeet294(depth294(staff), depth294(disc)), "同一根軸也穿過帶銷的圓盤 D");
  const plateBack = Math.min(...part(m296.default, "frame").pieces.map((p) => depth294(p)[0]));
  for (const p of [rim, ...spokes, hub]) assert.ok(depth294(p)[1] < plateBack, `擺輪的一塊(z ${depth294(p).map((z) => z.toFixed(2)).join("..")})在夾板條後面`);
});

/**
 * 時鐘的擺(推斷):擺桿與擺錘裝在主動件上(同一件,和它一起擺)。擺錘是主動件最低的一塊、在 below 之下,
 * 擺桿(方條)在擺錘那一層,從 top(局部 y)一路往下接到擺錘。回傳擺桿、擺錘與它們在世界中的深度(沿主動件的軸)。
 */
function pendulum297(def, id, { below, top = 0 }) {
  const p = part(def, id);
  const axis = p.axis ?? [0, 0, 1];
  const world = (q) => partPoint(p.center, axis, 0, q.at ?? [0, 0, 0]);
  const bob = p.pieces.reduce((m, q) => (world(q)[1] < world(m)[1] ? q : m));
  assert.ok(bob.kind === "cylinder" && bob.radius >= 0.25, "擺錘是一塊看得出來的圓盤");
  assert.ok(world(bob)[1] + bob.radius < below, `擺錘(y ${world(bob)[1].toFixed(2)})在 y ${below.toFixed(2)} 之下`);
  const rod = p.pieces.find((q) => q.kind === "box" && Math.abs(q.at[0] - bob.at[0]) < 1e-9 && depthsMeet294(depth294(q), depth294(bob)) && q.at[1] + q.size[1] / 2 >= top - 1e-9 && q.at[1] - q.size[1] / 2 <= bob.at[1]);
  assert.ok(rod, "擺桿從軸一路往下接到擺錘(擺和主動件是同一件)");
  return { rod, bob };
}

test("第 297 種:推斷的擺——擺桿裝在搖臂 A 的樞軸上、和搖臂一起擺,擺錘在燈籠輪下方;擺在輪盤後面,不擋住叉瓦與銷", () => {
  const def = m297.default;
  const { rod, bob } = pendulum297(def, "armA", { below: -m297.geometry.R });
  const arm = part(def, "armA");
  const hub = arm.pieces.filter((p) => p.kind === "cylinder" && !(p.at?.[0] || p.at?.[1]) && depthsMeet294(depth294(p), depth294(rod))).reduce((m, p) => (!m || p.radius > m.radius ? p : m), null);
  const pivot = arm.pieces.find((p) => p.kind === "cylinder" && !(p.at?.[0] || p.at?.[1]) && p !== hub && depthsMeet294(depth294(p), depth294(hub ?? rod)));
  assert.ok(hub && pivot, "擺桿的轂套在搖臂的樞軸上");
  const disc = part(def, "wheel").pieces[0];
  for (const p of [rod, bob, hub]) assert.ok(depth294(p)[1] < depth294(disc)[0], "擺在輪盤後面(叉瓦與銷在輪盤前面)");
});

test("第 299 種:推斷的擺——擺桿裝在立軸的後端、和立軸一起擺,擺錘在冠狀輪下方;擺在後叉瓦後面,不擋住叉瓦與齒", () => {
  const def = m299.default;
  const verge = part(def, "verge");
  const { rod, bob } = pendulum297(def, "verge", { below: m299.geometry.C[1] - m299.geometry.RIM / 2 });
  const back = verge.pieces.filter((p) => p.kind === "plate").reduce((m, p) => (p.at[2] < m.at[2] ? p : m));
  for (const p of [rod, bob]) assert.ok(depth294(p)[1] < depth294(back)[0], "擺在後叉瓦的後面");
  const staffEnd = Math.min(...verge.pieces.filter((p) => p.kind === "cylinder" && !(p.at?.[0] || p.at?.[1])).map((p) => depth294(p)[0]));
  assert.ok(staffEnd <= depth294(rod)[0], "立軸伸到擺桿那一層(擺裝在立軸上)");
  const frameBack = Math.min(...part(def, "frame").pieces.map((p) => depth294(p)[0]));
  assert.ok(depth294(rod)[1] < frameBack, "擺在後軸承之外,擺動時不碰機架");
});

test("第 300 種:推斷的擺——擺桿從半圓叉瓦的下緣往下、和擺軸一起擺,穿過底座的開口,擺錘在底座下方;擺全程不碰底座", () => {
  const { STAFF_Y, DISC, FLOOR } = twin.geometry;
  const staff = part(fig300, "staff");
  const { rod, bob } = pendulum297(fig300, "staff", { below: FLOOR - 0.12, top: -DISC });
  assert.ok(rod.at[1] + rod.size[1] / 2 <= -DISC + 0.1, "擺桿從叉瓦的下緣往下,不蓋住叉瓦伸進齒間的兩端");
  const base = part(fig300, "frame").pieces.filter((p) => p.kind === "box" && p.at[1] + p.size[1] / 2 <= FLOOR + 1e-9);
  assert.ok(base.length > 0, "底座");
  const inBase = ([x, y, z], m) => base.some((b) => [x, y, z].every((c, i) => Math.abs(c - b.at[i]) <= b.size[i] / 2 + m));
  const ys = sweep(rod.at[1] + rod.size[1] / 2, 80, rod.at[1] - rod.size[1] / 2);
  for (const v of sweep(4 * twin.SWING, 24)) {
    const angle = fig300.pose(v).parts.staff.angle;
    for (const y of ys) {
      const q = partPoint(staff.center, staff.axis, angle, [0, y, 0]);
      assert.ok(!inBase(q, rod.size[0] / 2 + 0.01), `主動量 ${v.toFixed(3)}:擺桿(y ${q[1].toFixed(2)}, z ${q[2].toFixed(2)})不碰底座`);
    }
    const c = partPoint(staff.center, staff.axis, angle, bob.at);
    assert.ok(c[1] + bob.radius < FLOOR - 0.12, `主動量 ${v.toFixed(3)}:擺錘在底座下方`);
  }
  assert.ok(Math.abs(staff.center[1] - STAFF_Y) < 1e-9);
});

test("第 300 種:從正面看,前輪的齒、半圓叉瓦與重錘前面都沒有機架(輪軸由後面的兩個軸承支著)", () => {
  const { C, R, ROOT, GAP, WEIGHT, REWIND } = twin.geometry;
  const covers = part(fig300, "frame").pieces.map((p) => cover299(p));
  const front = covers.filter((c) => c.zmin > GAP);
  let hidden = 0;
  for (let i = 0; i < 360; i++)
    for (let j = 0; j <= 6; j++) {
      const [a, r] = [(i / 360) * 2 * Math.PI, ROOT + ((R - ROOT) * j) / 6];
      if (front.some((c) => c.has(C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)))) hidden++;
    }
  assert.equal(hidden, 0, `前輪的齒帶有 ${hidden} 個取樣點被前面的機架蓋住`);
  for (const v of sweep(REWIND * 0.999, 12)) {
    const w = fig300.pose(v).parts.weight.position;
    const box = [[w[0] - WEIGHT.radius, w[1] - WEIGHT.height / 2], [w[0] + WEIGHT.radius, w[1] - WEIGHT.height / 2], [w[0] + WEIGHT.radius, w[1] + WEIGHT.height / 2], [w[0] - WEIGHT.radius, w[1] + WEIGHT.height / 2]];
    const share = hiddenShare299(box, w[2] + WEIGHT.radius, covers);
    assert.equal(share, 0, `主動量 ${v.toFixed(2)}:重錘被前面的機架蓋住 ${(share * 100).toFixed(0)}%`);
  }
});

test("第 302 種:擺輪式擒縱:擺輪 C 來回擺,叉瓦 A、B 輪流放走擒縱輪 D 的齒", () => {
  escapes(m302.escapement, m302.PITCH, 1);
  noPenetration(m302.escapement);
});

test("第 303 種:靜擊式擺式擒縱:叉瓦面與擺動軸同心,不會產生回退", () => {
  const e = m303.escapement;
  escapes(e, m303.PITCH, -1);
  noPenetration(e);
  const ws = sweep(2 * e.period, 480).map((v) => m303.deadbeat(v).wheel);
  assert.ok(ws.every((w, i) => i === 0 || w <= ws[i - 1] + 1e-5), "不回退");
  assert.ok(ws.slice(1).filter((w, i) => Math.abs(w - ws[i]) < 1e-5).length > 150, "齒抵住叉瓦時輪靜止");
});

test("第 304 種:銷輪式擒縱:兩個叉瓦夾著銷,擺每擺一次輪轉過半個銷距", () => {
  escapes(m304.escapement, m304.PITCH, -1);
  noPenetration(m304.escapement);
});

test("第 305 種:單銷式擒縱:擺每擺動一次,擒縱輪(帶一根偏心銷的小圓盤)旋轉半圈;圓盤照原圖箭頭順時針轉", () => {
  const e = m305.escapement;
  escapes(e, 2 * Math.PI, -1);
  noPenetration(e);
});

// 第 305 種的量測:銷心在擺的座標(原點在樞軸、擺居中時的方向)裡的位置
function pin305(v) {
  const { PIVOT, DISC, PIN } = m305.geometry;
  const g = m305.escapement.angle(v);
  const world = [DISC[0] + PIN.r * Math.cos(g), DISC[1] + PIN.r * Math.sin(g)];
  const a = -m305.pendulumAngle(v);
  const [x, y] = [world[0] - PIVOT[0], world[1] - PIVOT[1]];
  return { world, plate: [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)], angle: g };
}

test("第 305 種:「水平面則為靜擊面」——圓盤停住時銷都靠在叉瓦的水平面上,圓盤完全不動、不回退", () => {
  const e = m305.escapement;
  const { PIVOT, DISC, PIN, FACE } = m305.geometry;
  const L = Math.hypot(DISC[0] - PIVOT[0], DISC[1] - PIVOT[1]);
  const vs = sweep(2 * e.period, 720);
  const pins = vs.map(pin305);
  assert.ok(pins.every((p, i) => i === 0 || p.angle <= pins[i - 1].angle + 1e-4), "從不回退(順時針)");
  let still = 0;
  for (let i = 1; i < pins.length; i++) {
    if (Math.abs(pins[i].angle - pins[i - 1].angle) > 1e-4) continue;
    still++;
    const [u, w] = pins[i].plate;
    const rho = Math.hypot(u, w);
    const onLower = Math.abs(rho - (L + FACE.b - PIN.size)) < 3e-3 && u < -FACE.a + 3e-3; // 銷壓在下面那道水平面上(放開的那一刻在面的角上)
    const onUpper = Math.abs(rho - (L - FACE.b + PIN.size)) < 3e-3 && u > FACE.a - 3e-3; // 銷頂在上面那道水平面下
    assert.ok(onLower || onUpper, `主動量 ${vs[i].toFixed(3)}:圓盤停住,但銷沒靠在水平面上(離樞軸 ${rho.toFixed(4)}、橫向 ${u.toFixed(3)})`);
  }
  assert.ok(still > 0.15 * vs.length, `鎖住的時間夠長(靜止的取樣 ${still} / ${vs.length})`);
});

test("第 305 種:「將衝量傳遞到擒縱叉瓦的垂直面上」——擺與銷同向走的那一段,銷推著直緣走,每擺一次推過大半個半圈", () => {
  const e = m305.escapement;
  const { PIVOT, DISC, PIN, FACE } = m305.geometry;
  const L = Math.hypot(DISC[0] - PIVOT[0], DISC[1] - PIVOT[1]);
  const vs = sweep(2 * e.period, 1440);
  const pins = vs.map(pin305);
  let impulse = 0;
  for (let i = 1; i < pins.length; i++) {
    const turn = Math.abs(pins[i].angle - pins[i - 1].angle);
    if (turn < 1e-6) continue;
    const [u] = pins[i].plate;
    const onUpright = Math.abs(u - (-FACE.a + PIN.size)) < 3e-3 || Math.abs(u - (FACE.a - PIN.size)) < 3e-3;
    const swingDx = L * (Math.sin(m305.pendulumAngle(vs[i])) - Math.sin(m305.pendulumAngle(vs[i - 1])));
    const pinDx = pins[i].world[0] - pins[i - 1].world[0];
    if (onUpright && swingDx * pinDx > 0) impulse += turn;
  }
  const perBeat = impulse / 4;
  assert.ok(perBeat > Math.PI / 2, `每擺一次,銷推著垂直面轉過 ${((perBeat * 180) / Math.PI).toFixed(0)}°(半圈 180°)`);
});

test("第 305 種:叉瓦照原圖是同一層的 Z 形一塊——擺上的板開著 Z 形的窗(左上、右下開、盤心的右上、左下是實心),銷伸進這一層、全程在窗裡", () => {
  const def = m305.default;
  const { PIVOT, DISC } = m305.geometry;
  const sheet = part(def, "pendulum").pieces.find((p) => p.kind === "plate" && p.shape.holes?.length);
  assert.ok(sheet, "擺上有一塊開窗的板");
  assert.equal(sheet.shape.holes.length, 1, "叉瓦是一個窗(一塊)");
  const hole = sheet.shape.holes[0];
  const c = [DISC[0] - PIVOT[0], DISC[1] - PIVOT[1]];
  const inHole = (dx, dy) => pointInPolygon([c[0] + dx, c[1] + dy], hole);
  assert.ok(inHole(-0.3, 0.15) && inHole(0.3, -0.15), "左上、右下是窗");
  assert.ok(!inHole(-0.3, -0.2) && !inHole(0.3, 0.2), "盤心的左下、右上是實心(兩道水平面、兩道垂直面)");
  const disc = part(def, "disc");
  const pin = disc.pieces.find((p) => p.accent);
  const pz = [disc.center[2] + pin.at[2] - pin.length / 2, disc.center[2] + pin.at[2] + pin.length / 2];
  const sz = [(sheet.at?.[2] ?? 0) - sheet.thickness / 2, (sheet.at?.[2] ?? 0) + sheet.thickness / 2];
  assert.ok(pz[0] <= sz[0] && pz[1] >= sz[1], `銷(z ${pz.map((z) => z.toFixed(2)).join("–")})穿過叉瓦板的整個厚度(z ${sz.map((z) => z.toFixed(2)).join("–")})`);
  const { PIN } = m305.geometry;
  for (const v of sweep(2 * m305.escapement.period, 240)) {
    const { plate } = pin305(v);
    for (let k = 0; k < 24; k++) {
      const q = [plate[0] + PIN.size * Math.cos((k * Math.PI) / 12), plate[1] + PIN.size * Math.sin((k * Math.PI) / 12)];
      assert.ok(pointInPolygon(q, hole) || edgeDistance(q, hole) < 2e-3, `主動量 ${v.toFixed(3)}:銷伸出窗外`);
    }
  }
});

test("第 305 種:從正面看得到銷——圓盤、機架都沒有擋在銷的前面(原圖的銷畫在最前面)", () => {
  const def = m305.default;
  const disc = part(def, "disc");
  const pin = disc.pieces.find((p) => p.accent);
  const front = disc.center[2] + pin.at[2] + pin.length / 2;
  const zmax = (piece, center) => center[2] + (piece.at?.[2] ?? 0) + (piece.kind === "box" ? piece.size[2] : piece.kind === "plate" ? piece.thickness : piece.length ?? 2 * piece.radius) / 2;
  for (const v of sweep(m305.escapement.period, 16)) {
    const { world } = pin305(v);
    const g = def.pose(v).parts.disc.angle;
    const covers = [
      ...part(def, "frame").pieces.map((p) => ({ c: cover299(p), z: zmax(p, [0, 0, 0]) })),
      ...disc.pieces.filter((p) => p !== pin).map((p) => ({ c: cover299(p, disc.center, g), z: zmax(p, disc.center) })),
    ];
    const over = covers.filter(({ c, z }) => z > front + 1e-9 && c.has(world[0], world[1]));
    assert.equal(over.length, 0, `主動量 ${v.toFixed(3)}:銷被前面的零件蓋住`);
  }
});

test("第 305 種:推斷的重錘驅動——圓盤軸上的鼓放出繩、經滑輪吊著重錘,重錘隨圓盤下降", () => {
  const { DRUM, REWIND } = m305.geometry;
  assertWeightDrive(m305.default, { drum: DRUM, wheel: m305.escapement.angle, period: m305.escapement.period, every: REWIND });
});

test("第 306 種:三腳式擺式擒縱:三腳輪的齒交替作用於上、下叉瓦,擺每擺一次轉六分之一圈", () => {
  escapes(m306.escapement, 2 * m306.STEP, 1);
  noPenetration(m306.escapement);
});

test("第 307 種:三腳式擒縱的變形(較長的止動齒 D、E):擺每擺一次轉六分之一圈", () => {
  escapes(m307.escapement, 2 * m307.STEP, 1);
  noPenetration(m307.escapement);
});

test("第 308 種:分離式擒縱:只在擺向左擺時由槓桿 Q 解鎖並接收衝量;擺向右返回時制動爪被推向一旁", () => {
  const T = m308.geometry.TRAVEL;
  const base = 2 * m308.escapement.period;
  const right = sweep(base + 2 * T, 100, base).map((v) => m308.detached(v)); // 由左往右(返回)
  assert.ok(right.every((d) => d.lever < 1e-9), "向右時不解鎖");
  close(right[right.length - 1].wheel, right[0].wheel, "向右時輪不動", 1e-6);
  assert.ok(right.some((d) => d.click < -0.1), "向右時制動爪被推向一旁");
  assert.ok(right[0].x < right[right.length - 1].x, "這一程擺往右走");
  const left = sweep(base + 4 * T, 100, base + 2 * T).map((v) => m308.detached(v));
  assert.ok(left.some((d) => d.lever > 0.05), "向左時槓桿 Q 被撥開");
  assert.ok(left.every((d) => Math.abs(d.click) < 1e-9), "向左時制動爪頂著擋銷不倒");
  close(left[left.length - 1].wheel - left[0].wheel, -m308.PITCH, "來回一次轉一齒", 1e-6);
  noPenetration(m308.escapement);
  apart(m308.escapement, "lever", "click");
});

test("第 309 種:馬奇重力擒縱:擺每次擺動把其中一個加重的叉瓦抬起,返回時叉瓦落下", () => {
  const S = m309.SWING;
  const base = 2 * m309.escapement.period;
  const atRight = m309.mudge(base + 2 * S); // 擺到右端
  assert.ok(atRight.right > 0.01 && atRight.left < 1e-9, "擺往右時抬起右邊的叉瓦");
  const atLeft = m309.mudge(base + 4 * S);
  assert.ok(atLeft.left > 0.01 && atLeft.right < 1e-9, "擺往左時抬起左邊的叉瓦");
  const mid = m309.mudge(base + 3 * S);
  assert.ok(mid.left < 1e-9 && mid.right < 1e-9, "擺在中間時兩叉瓦都落下");
  escapes(m309.escapement, m309.PITCH, -1);
  noPenetration(m309.escapement);
});

test("第 310 種:三腳式重力擒縱:叉瓦 A、B 交替被抬起,擒縱輪每擺一次轉六分之一圈", () => {
  const S = m310.SWING;
  const base = 2 * m310.escapement.period;
  assert.ok(m310.gravity(base + 2 * S).right > 0.02 && m310.gravity(base + 4 * S).left > 0.02, "兩叉瓦交替被抬起");
  // 叉瓦的抬升是由中央的銷完成的:擺在中間、沒碰到臂時,一支臂仍被銷托著抬起
  const mid = m310.gravity(base + 3 * S);
  assert.ok(mid.left > 0.02 || mid.right > 0.02, "擺在中間時,一支臂由銷托著");
  escapes(m310.escapement, 2 * m310.STEP, 1);
  noPenetration(m310.escapement);
});

test("第 311 種:雙三腳式重力擒縱:兩個叉瓦交替被抬起,鎖定輪每擺一次轉六分之一圈", () => {
  const S = m311.SWING;
  const base = 2 * m311.escapement.period;
  assert.ok(m311.doubleThree(base + 2 * S).right > 0.02 && m311.doubleThree(base + 4 * S).left > 0.02, "兩叉瓦交替被抬起");
  escapes(m311.escapement, 2 * m311.STEP, 1);
  noPenetration(m311.escapement);
});

test("第 312 種:布洛克桑重力擒縱:擺推開一個叉瓦、放開擋止,輪每擺一次轉半個齒距", () => {
  const S = m312.SWING;
  const base = 2 * m312.escapement.period;
  assert.ok(m312.bloxam(base + 2 * S).right > 0.02 && m312.bloxam(base + 4 * S).left > 0.02, "兩叉瓦交替被推開");
  const mid = m312.bloxam(base + 3 * S);
  assert.ok(mid.left > 0.002 || mid.right > 0.002, "擺在中間時,一支臂由小輪托著抬起");
  escapes(m312.escapement, m312.PITCH, -1);
  noPenetration(m312.escapement);
});

test("第 313 種:E 是槓桿(止動器)返回後靠住的擋止,不是鎖石", () => {
  const def = m313.default;
  const stop = def.parts.find((p) => p.id === "foot").pieces.find((p) => p.kind === "cylinder");
  const e = def.parts.find((p) => p.label === "E");
  close(Math.hypot(e.center[0] - stop.at[0], e.center[1] - stop.at[1]), 0, "E 標在擋止上", 1e-9);
  // 止動器停著時靠在擋止上:擋止和止動器的本體之間沒有空隙
  const detent = def.parts.find((p) => p.id === "detent");
  const body = detent.pieces[0].shape.outline.map(([x, y]) => [x + detent.center[0], y + detent.center[1]]);
  const r = stop.radius;
  assert.ok(edgeDistance([stop.at[0], stop.at[1]], body) < r + 0.01, "止動器靠在擋止 E 上");
});

test("第 313 種:天文台計時器擒縱:擺輪朝箭頭方向轉時推開止動器、放走一齒,輪齒推衝量叉瓦;返回時不動止動器", () => {
  // 方向照插圖(維護者 2026-10-08 決定):擒縱輪在左、止動器在右、滾子在右上;擺輪先往返回的方向(順時針)擺,
  // 再朝箭頭方向(逆時針)擺。原文說齒 V 把通過彈簧壓向槓桿(沒有方向),插圖的配置要往右(離開擒縱輪)才放得開齒
  const def = m313.default;
  const center = (id) => def.parts.find((p) => p.id === id).center;
  assert.ok(center("wheel")[0] < center("detent")[0], "擒縱輪在止動器左邊(照插圖,不鏡像)");
  assert.ok(center("balance")[0] > center("wheel")[0] && center("balance")[1] > center("wheel")[1], "擺輪的滾子在右上");
  const S = m313.SWING;
  const e = m313.escapement;
  const base = 2 * e.period;
  const back = sweep(base + 2 * S, 200, base).map((v) => m313.chronometer(v));
  assert.ok(back[back.length - 1].balance < back[0].balance, "先往返回的方向(順時針)擺");
  assert.ok(back.every((c) => c.lift < 1e-9), "返回時止動器不動(在不移動槓桿的情況下通過)");
  assert.ok(back.some((c) => c.flex > 0.02), "返回時齒 V 把通過彈簧壓彎(推至一旁)");
  close(back[back.length - 1].wheel, back[0].wheel, "返回時輪不動", 1e-6);
  const go = sweep(base + 4 * S, 200, base + 2 * S).map((v) => m313.chronometer(v));
  assert.ok(go[go.length - 1].balance > go[0].balance, "朝箭頭方向是逆時針(原圖的箭頭)");
  assert.ok(go.some((c) => c.lift > 0.01), "朝箭頭方向時齒 V 推通過彈簧,連止動器推開(將槓桿推至一旁)");
  assert.ok(go.every((c) => c.flex < 1e-9), "朝箭頭方向時通過彈簧頂著角,不彎");
  // 止動器往右(離開擒縱輪):鎖石的最左點往右移
  const stoneLeft = (v) => Math.min(...e.at(v).stops[0].map(([x]) => x));
  const pushed = sweep(base + 4 * S, 200, base + 2 * S).reduce((best, v) => (m313.chronometer(v).lift > m313.chronometer(best).lift ? v : best));
  assert.ok(stoneLeft(pushed) > stoneLeft(base) + 0.03, "鎖石往右、離開擒縱輪的齒(從擒縱輪的齒上移開止動裝置)");
  close(go[go.length - 1].wheel - go[0].wheel, -m313.PITCH, "來回一次放走一齒(順時針)", 1e-6);
  close(e.step, -m313.PITCH, "每週期一齒", 1e-6);
  // 衝量:放開的輪齒推著大滾子缺口上的叉瓦 P 走——滾子往回轉一點點就會壓進輪齒
  const [bx, by] = e.balanceCenter;
  const pushesRoller = (v) => {
    const { teeth, stops } = e.at(v);
    const back = placePoly(stops[stops.length - 1].map(([x, y]) => [x - bx, y - by]), e.balanceCenter, -0.01);
    return teeth.some((t) => penetrationDepth(t, back) > 1e-4);
  };
  const pushes = (from) => sweep(from + 2 * S, 400, from).filter(pushesRoller);
  const impulse = pushes(base + 2 * S);
  assert.ok(impulse.length > 10, "朝箭頭方向擺:輪齒推著衝量叉瓦走(傳遞衝量)");
  const travel = m313.chronometer(impulse.at(-1)).wheel - m313.chronometer(impulse[0]).wheel;
  assert.ok(travel < -m313.PITCH / 4, `推著叉瓦的那一段,輪轉過可觀的角度(實際 ${(travel / m313.PITCH).toFixed(2)} 齒)`);
  assert.equal(pushes(base).length, 0, "返回時輪齒不推滾子(每來回只給一次衝量)");
  noPenetration(e, 2000);
  apart(e, "spring", "pin");
  apart(e, "hook", "pin");
});

test("第 314 種:槓桿式天文台計時器擒縱:叉瓦只鎖輪,衝量直接給擺輪上的叉瓦 C,來回一次轉一齒", () => {
  const S = m314.SWING;
  const e = m314.escapement;
  const base = 2 * e.period;
  const levers = sweep(base + 2 * S, 100, base).map((v) => m314.leverChrono(v).lever);
  assert.ok(Math.sign(levers[0]) !== Math.sign(levers[levers.length - 1]), "每擺一次槓桿換邊");
  const first = m314.leverChrono(base + 2 * S).wheel - m314.leverChrono(base).wheel;
  const second = m314.leverChrono(base + 4 * S).wheel - m314.leverChrono(base + 2 * S).wheel;
  close(first + second, -m314.PITCH, "來回一次轉一齒", 1e-6);
  // 輪齒推著滾子(叉瓦 C)的凹槽側壁走:滾子往回轉一點點就會壓進輪齒(只是靠在滾子外緣上的不算)
  const [bx, by] = e.balanceCenter;
  const pushesRoller = (v) => {
    const { teeth, stops } = e.at(v);
    const back = placePoly(stops[stops.length - 1].map(([x, y]) => [x - bx, y - by]), e.balanceCenter, -0.01);
    return teeth.some((t) => penetrationDepth(t, back) > 1e-4);
  };
  const pushes = (from) => sweep(from + 2 * S, 400, from).filter(pushesRoller);
  const ccw = pushes(base);
  assert.ok(ccw.length > 10, "擺輪逆時針擺:輪齒推著叉瓦 C 走(衝量)");
  const travel = m314.leverChrono(ccw.at(-1)).wheel - m314.leverChrono(ccw[0]).wheel;
  assert.ok(travel < -m314.PITCH / 4, `推著叉瓦 C 的那一段,輪轉過可觀的角度(實際 ${(travel / m314.PITCH).toFixed(2)} 齒)`);
  assert.equal(pushes(base + 2 * S).length, 0, "擺輪順時針擺:輪齒不推滾子(每來回只給一次衝量)");
  noPenetration(e, 2000);
  apart(m314.escapement, "fork", "pin");
});
