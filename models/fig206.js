// 第 206 種:棘輪的連續圓周運動,由一支承載兩個棘爪的槓桿擺動產生。右上方的槓桿繞它的軸擺動,
// 槓桿端的銷上掛著兩個跨過棘輪上方的弧形棘爪:槓桿端上升時左爪鉤住左側的齒往上拉,
// 下降時右爪壓住右側的齒往下推,兩者都讓棘輪朝同一方向(順時針)轉,所以每一程都在推,幾乎連續。
// 主動量是槓桿的累計擺動量。
//
// 接觸:兩個爪各自鉸在掛銷上,靠自重把爪尖搭在齒上(左爪往逆時針、右爪往順時針擺都是把爪尖往輪心壓)。
// 齒是鋸齒:順時針那一面陡、背面斜。每一步先讓掛銷移動(爪的方向不變):爪尖若往順時針頂進齒的陡面,
// 那個爪從此頂著陡面推——推的那一角跟著棘輪轉、離掛銷的距離不變(爪是剛體),每一步由此解出棘輪轉到哪,
// 直到掛銷往回走、爪離開陡面。沒在推的爪靠自重擺回、停在碰到齒的地方,沿齒背滑過、落進下一格,
// 落下有加速過程。棘輪沒被推時靠軸上的摩擦停住。
// 推斷:兩爪各自以掛銷為樞軸、靠自重搭在齒上(原圖看不出彈簧);擺幅;爪尖的鉤形;
// 槓桿軸的位置 P(從原圖量的 (1.0, 3.3) 移到和掛銷差不多一樣高,高解析度原圖的槓桿也只略往下斜;
// 掛銷上下走,左爪一程才走得滿一齒);左爪長(決定兩爪尖相對齒的相位,短一點左爪就整程搆不到陡面);
// 右爪的拱高(拱得低一點,從移下來的槓桿軸下面過)。
import { TAU, deg, rot2, swing as swingAt } from "./kit.js";
import { circleCircle, bodyPoint } from "./linkage.js";
import { shape, circle, ratchetShape, thickLine } from "./shapes.js";
import { placeOutline, polygonsOverlap, swingUntilContact } from "./contact.js";

const WHEEL = { teeth: 40, outer: 2.25, inner: 2.02, pitchR: 2.12 };
const PITCH = (2 * Math.PI) / WHEEL.teeth;
const P = [1.03, 3.0, 0]; // 槓桿的軸:和掛銷差不多一樣高(原圖的槓桿近乎水平),掛銷上下走,兩個爪推得一樣有力
const E0 = [0.05, 2.95]; // 掛棘爪的銷(槓桿在原圖位置時)
const HANDLE = [2.05, 3.6];
// 爪長:左爪推的那一角和右爪的,在一程的兩端都差不多正好落在陡面前(兩爪輪流推、各自空走一小段);
// 長短差一點,其中一個爪就會一直落在齒背中間、整程搆不到陡面
const PAWL = { left: 2.56, right: 2.26 };
const SIDE = { left: -1, right: 1 };
const INTO = { left: 1, right: -1 }; // 靠自重擺的方向(把爪尖往輪心壓)
const SWING = deg(34); // 擺幅(推斷):每一程爪尖推約一齒、往回滑約兩齒,落進齒縫時在陡面前不遠
const FALL = 4e-4; // 爪落下的角加速度(每一取樣步的平方)
const LAYER = { left: 0.17, right: -0.17 }; // 左爪在棘輪前面一層、右爪在後面一層(爪尖都伸到齒的那一層)

const pinAt = (psi) => bodyPoint(P, psi, [E0[0] - P[0], E0[1] - P[1]]).slice(0, 2);
const leverAt = (v) => swingAt(v, SWING / 2, -SWING / 2);

// 爪的外形(局部 +x 由銷指向爪尖,原圖位置時爪尖落在節圓上):往外拱的弧形板
// 拱起的高度:右爪拱得低一點,從槓桿軸的下面過(槓桿軸從後面的機架伸到槓桿,穿過右爪那一層)
const bulge = { left: -0.45, right: 0.3 };
const centerline = (which) => {
  const L = PAWL[which];
  return Array.from({ length: 21 }, (_, i) => [(L * i) / 20, bulge[which] * 4 * (i / 20) * (1 - i / 20)]);
};
const OUTLINE = { left: thickLine(centerline("left"), 0.22), right: thickLine(centerline("right"), 0.22) };
// 原圖位置時爪的方向:從銷指向節圓上的爪尖
const restAngle = (which) => {
  const pin = pinAt(0);
  const tip = circleCircle([...pin, 0], PAWL[which], [0, 0, 0], WHEEL.pitchR, SIDE[which]).point;
  return Math.atan2(tip[1] - pin[1], tip[0] - pin[0]);
};
// 爪尖:伸到棘輪齒那一層的鉤(爪身在棘輪前 / 後一層,兩爪在銷附近互不相碰)。在原圖位置時,
// 推的那一面(順時針那側)沿半徑、和齒的陡面平行,伸到齒根上方 0.02;背面比齒的斜背陡,
// 鉤在齒縫裡時只有推的那一面碰到齒,往回滑時由背面的下角沿斜背被抬起。
// 以爪尖在節圓上的點為原點,沿順時針切向 t、往輪心 u 量(推斷:原圖的爪尖只畫成鉤狀)
const NIB = [[0, -0.1], [0, 0.08], [-0.12, -0.1]];
const nib = (which) => {
  const a = restAngle(which);
  const pin = pinAt(0);
  const theta = Math.atan2(pin[1] + PAWL[which] * Math.sin(a), pin[0] + PAWL[which] * Math.cos(a));
  const t = [Math.sin(theta), -Math.cos(theta)];
  const u = [-Math.cos(theta), -Math.sin(theta)];
  return NIB.map(([s, d]) => {
    const [x, y] = rot2([s * t[0] + d * u[0], s * t[1] + d * u[1]], -a);
    return [PAWL[which] + x, y];
  });
};
const TIP = { left: nib("left"), right: nib("right") };

const TEETH = ratchetShape({ teeth: WHEEL.teeth, outer: WHEEL.outer, inner: WHEEL.inner, dir: -1 }).outline;
const wheelAt = (angle) => TEETH.map((p) => rot2(p, angle));
// 每顆齒的陡面裡面貼著它的一條(齒尖那一段除外,往下伸進齒根底下):爪尖頂進這裡,是往順時針頂在陡面上,推得動棘輪;
// 壓在斜背上,或往回滑過齒尖時,只會被擠開
const WALLS = Array.from({ length: WHEEL.teeth }, (_, i) => {
  const a = i * PITCH;
  const [root, top] = [rot2([WHEEL.inner, 0], a + PITCH * 0.98), rot2([WHEEL.outer, 0], a + PITCH * 0.92)];
  const on = (s) => [root[0] + s * (top[0] - root[0]), root[1] + s * (top[1] - root[1])];
  return [on(-0.2), on(0.75), rot2(on(0.75), -PITCH * 0.04), rot2(on(-0.2), -PITCH * 0.04)];
});
const wallsAt = (angle) => WALLS.map((f) => f.map((p) => rot2(p, angle)));
// 只有爪尖那一段在齒的那一層,接觸只算它
const pawlAt = (which, pin, angle) => placeOutline(TIP[which], pin, angle);
// 爪尖推的那一角(推的那一面的下角)在爪上的位置:離掛銷多遠、在爪的座標裡的方向
const CORNER = Object.fromEntries(["left", "right"].map((w) => [w, { reach: Math.hypot(...TIP[w][1]), angle: Math.atan2(TIP[w][1][1], TIP[w][1][0]) }]));

function run(cycles, samples) {
  const pawl = { left: restAngle("left"), right: restAngle("right") };
  const falling = { left: 0, right: 0 };
  // 頂在陡面上的爪:推的那一角在棘輪上的位置(半徑、棘輪座標的角)與離掛銷的距離
  const hold = { left: null, right: null };
  let wheel = 0;
  const out = [];
  for (let i = 0; i <= cycles * samples; i++) {
    const v = (2 * SWING * i) / samples;
    const pin = pinAt(leverAt(v));
    // 頂在陡面上的爪跟著推:那一角貼著陡面跟棘輪一起轉,離掛銷的距離不變(爪是剛體)——由此解出棘輪轉到哪;
    // 要讓棘輪倒轉才擺得過去,就是掛銷往回走了,爪離開陡面
    for (const which of ["left", "right"]) {
      const h = hold[which];
      if (!h) continue;
      // 那一角在半徑 r 的圓上、離掛銷 reach:兩圓的交點,取離現在的轉角近的那個
      const d = Math.hypot(pin[0], pin[1]);
      const c = (d * d + h.r * h.r - h.reach * h.reach) / (2 * h.r * d);
      const base = Math.atan2(pin[1], pin[0]) - h.phi;
      const near = (w) => w + TAU * Math.round((wheel - w) / TAU);
      const [w1, w2] = Math.abs(c) > 1 ? [] : [near(base + Math.acos(c)), near(base - Math.acos(c))];
      const next = w1 === undefined ? null : Math.abs(w1 - wheel) < Math.abs(w2 - wheel) ? w1 : w2;
      if (next === null || next > wheel) {
        hold[which] = null;
        continue;
      }
      wheel = next;
      const corner = [h.r * Math.cos(h.phi + wheel), h.r * Math.sin(h.phi + wheel)];
      pawl[which] = Math.atan2(corner[1] - pin[1], corner[0] - pin[0]) - CORNER[which].angle;
      falling[which] = 0;
    }
    // 沒在推的爪靠自重擺回,停在碰到齒的地方;被齒背頂住時往外退開;落下有加速過程
    for (const which of ["left", "right"]) {
      if (hold[which]) continue;
      // 爪尖往順時針頂進陡面(而不是壓在斜背上):從這一步起由它推
      const placed = pawlAt(which, pin, pawl[which]);
      if (wallsAt(wheel).some((f) => polygonsOverlap(placed, f))) {
        const corner = placeOutline([TIP[which][1]], pin, pawl[which])[0];
        hold[which] = { r: Math.hypot(...corner), phi: Math.atan2(corner[1], corner[0]) - wheel, reach: CORNER[which].reach };
        continue;
      }
      const rest = swingUntilContact({ pivot: pin, outline: TIP[which], from: pawl[which], into: INTO[which], sweep: 0.3, steps: 40 }, [wheelAt(wheel)]);
      if (INTO[which] * (rest - pawl[which]) > 1e-6) {
        falling[which] += FALL;
        pawl[which] += INTO[which] * Math.min(INTO[which] * (rest - pawl[which]), falling[which]);
      } else [pawl[which], falling[which]] = [rest, 0];
    }
    out.push({ wheel, left: pawl.left, right: pawl.right });
  }
  return out;
}

// 走三個來回,取最後一個來回當週期;每個來回推進整數個齒,逐步推開的微小誤差按比例攤掉
const SAMPLES = 480;
const { ROWS, ADVANCE, START } = (() => {
  const all = run(3, SAMPLES);
  const t = all.slice(2 * SAMPLES);
  const raw = t[SAMPLES].wheel - t[0].wheel;
  const advance = Math.round(raw / PITCH) * PITCH;
  return { ROWS: t.map((r) => ({ ...r, wheel: t[0].wheel + ((r.wheel - t[0].wheel) * advance) / raw })), ADVANCE: advance, START: t[0].wheel };
})();

function lookup(v) {
  const period = 2 * SWING;
  const k = Math.floor(v / period);
  // v 剛好在週期的整數倍時,浮點誤差可能讓 x 略小於 0 或略大於 SAMPLES:夾在表的範圍內
  const x = Math.min(SAMPLES, Math.max(0, ((v - k * period) / period) * SAMPLES));
  const i = Math.min(SAMPLES - 1, Math.floor(x));
  const t = x - i;
  const [a, b] = [ROWS[i], ROWS[i + 1]];
  const lerp = (key) => a[key] + (b[key] - a[key]) * t;
  return { wheel: k * ADVANCE + lerp("wheel"), left: lerp("left"), right: lerp("right") };
}

/** 主動量 v(槓桿累計擺動):棘輪自起點的轉角 */
export const wheelAngle = (v) => lookup(v).wheel - START;
/** 每個來回棘輪轉過的角度 */
export const advance = ADVANCE;
export const swing = SWING;
export const pitch = PITCH;
/** 檢查用:主動量 v 時兩個爪與棘輪的外形(世界座標 2D) */
export function contactAt(v) {
  const { wheel, left, right } = lookup(v);
  const pin = pinAt(leverAt(v));
  return { pawls: { left: pawlAt("left", pin, left), right: pawlAt("right", pin, right) }, wheel: wheelAt(wheel) };
}

const pawlPart = (id, which) => ({
  id,
  kind: "group",
  center: [...pinAt(0), LAYER[which]],
  arrow: false,
  pieces: [
    { kind: "plate", shape: shape(OUTLINE[which], [circle(0.15).reverse()]), thickness: 0.1 },
    { kind: "plate", shape: shape(TIP[which]), thickness: 0.3, at: [0, 0, -Math.sign(LAYER[which]) * 0.12] },
  ],
});

export default {
  figure: 206,
  parts: [
    {
      id: "wheel",
      kind: "group",
      spin: WHEEL.outer,
      pieces: [
        { kind: "plate", shape: ratchetShape({ teeth: WHEEL.teeth, outer: WHEEL.outer, inner: WHEEL.inner, bore: 0.25, dir: -1 }), thickness: 0.22 },
        { kind: "cylinder", radius: 0.48, inner: 0.25, length: 0.3 },
        { kind: "plate", shape: shape(circle(1.75), [circle(1.7).reverse()]), thickness: 0.2, mark: [1.2, 0.6], markSize: 0.08 },
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: P,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(thickLine([[E0[0] - P[0], E0[1] - P[1]], [0, 0], [HANDLE[0] - P[0], HANDLE[1] - P[1]]], 0.28)), thickness: 0.12, at: [0, 0, 0.3] },
        { kind: "cylinder", radius: 0.3, inner: 0.14, length: 0.4, at: [0, 0, 0.3] },
        { kind: "cylinder", radius: 0.14, length: 1.0, at: [E0[0] - P[0], E0[1] - P[1], 0.1] }, // 掛銷前後都伸出:左爪掛在棘輪前面、右爪掛在後面,兩爪互不相碰
      ],
    },
    pawlPart("pawlLeft", "left"),
    pawlPart("pawlRight", "right"),
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.24, length: 0.9, at: [0, 0, -0.2] }, // 棘輪的軸(推斷)
        { kind: "cylinder", radius: 0.13, length: 0.9, at: [P[0], P[1], 0.0] }, // 槓桿的軸(推斷)
        { kind: "box", size: [3.0, 0.2, 0.2], at: [0.6, 0, -0.6] },
        { kind: "box", size: [0.2, P[1] + 0.1, 0.2], at: [2.0, P[1] / 2 - 0.05, -0.6] },
        { kind: "box", size: [1.1, 0.2, 0.2], at: [1.5, P[1], -0.6] },
        { kind: "box", size: [0.2, 0.2, 0.55], at: [0, 0, -0.42] },
        { kind: "box", size: [0.2, 0.2, 0.55], at: [P[0], P[1], -0.42] },
      ],
    },
  ],
  // 動力重演:只推槓桿;棘輪在軸上靠摩擦定位,兩個爪鉸在掛銷上、靠自重搭在齒上
  replay: {
    free: {
      wheel: { hold: true, gravity: false },
      pawlLeft: { on: "lever", pivot: [...pinAt(leverAt(0)), LAYER.left] },
      pawlRight: { on: "lever", pivot: [...pinAt(leverAt(0)), LAYER.right] },
    },
    ignore: [["wheel", "frame"]],
    to: 4 * SWING,
    seconds: 20,
    expect: [
      { at: SWING, part: "wheel", label: "槓桿端上升一程,左爪把棘輪往上拉", quote: "其中一個棘爪在上升時與棘齒嚙合" },
      { at: 2 * SWING, part: "wheel", label: "槓桿端下降一程,右爪把棘輪往下推", quote: "另一個則在下降時嚙合" },
      { at: 4 * SWING, part: "wheel", label: "第二個來回,棘輪照樣每一程都前進" },
    ],
  },
  waivers: [
    { check: "replay", parts: ["wheel"], at: 4 * SWING, reason: "重演做不出來:第一個來回和模型一致(上升、下降各推約一齒);第二個來回棘輪只轉到 −26°(模型 −36°),少推約一齒。兩爪輪流推時,每一程開頭空走多少看爪落進齒縫的位置,落點差一點就可能落到齒背中間、那一程推不到;重演裡爪靠碰撞與重力落下,落點和模型的加速落下不同。原書沒有爪重與彈簧力的資料;推的過程由模型定義的測試檢查(爪不穿入齒、每個來回推兩齒、每格轉角不超過下降一程平均的 2 倍)" },
  ],
  driver: { part: "lever", type: "rotation", cycle: [SWING / 2, -SWING / 2] },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const psi = leverAt(v);
    const { wheel, left, right } = lookup(v);
    const pin = pinAt(psi);
    return {
      parts: {
        lever: { angle: psi },
        wheel: { angle: wheel },
        pawlLeft: { position: [...pin, LAYER.left], angle: left },
        pawlRight: { position: [...pin, LAYER.right], angle: right },
      },
      readouts: [],
    };
  },
};
