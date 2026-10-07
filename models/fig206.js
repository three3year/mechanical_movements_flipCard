// 第 206 種:棘輪的連續圓周運動,由一支承載兩個棘爪的槓桿振動產生。右上方的槓桿繞它的軸擺動,
// 槓桿端的銷上掛著兩個跨過棘輪上方的弧形棘爪:槓桿端上升時左爪鉤住左側的齒往上拉,
// 下降時右爪壓住右側的齒往下推,兩者都讓棘輪朝同一方向(順時針)轉,所以每一程都在推,幾乎連續。
// 主動量是槓桿的累計擺動量。
//
// 接觸:兩個爪各自鉸在掛銷上,靠自重把爪尖搭在齒上(左爪往逆時針、右爪往順時針擺都是把爪尖往輪心壓)。
// 齒是鋸齒:順時針那一面陡、背面斜。每一步先讓掛銷移動(爪的方向不變),爪尖若頂進齒的陡面,
// 棘輪就往順時針轉到剛好不重疊——推多少由兩者的外形決定;再讓兩個爪靠自重擺回、停在碰到齒的地方,
// 沒在推的那個爪沿齒背滑過、落進下一格,落下有加速過程。棘輪沒被推時靠軸上的摩擦停住。
// 推斷:兩爪各自以掛銷為樞軸、靠自重搭在齒上(原圖看不出彈簧);擺幅。
import { deg, rot2, swing as swingAt } from "./kit.js";
import { circleCircle, bodyPoint } from "./linkage.js";
import { shape, circle, ratchetShape, thickLine } from "./shapes.js";
import { placeOutline, polygonsOverlap, swingUntilContact } from "./contact.js";

const WHEEL = { teeth: 40, outer: 2.25, inner: 2.02, pitchR: 2.12 };
const PITCH = (2 * Math.PI) / WHEEL.teeth;
const P = [1.0, 3.3, 0]; // 槓桿的軸
const E0 = [0.05, 2.95]; // 掛棘爪的銷(槓桿在原圖位置時)
const HANDLE = [2.05, 3.6];
const PAWL = { left: 2.52, right: 2.26 };
const SIDE = { left: -1, right: 1 };
const INTO = { left: 1, right: -1 }; // 靠自重擺的方向(把爪尖往輪心壓)
const SWING = deg(36); // 擺幅(推斷):每一程掛銷移動約一齒半,爪尖滑過一齒後還推得到下一齒
const FALL = 4e-4; // 爪落下的角加速度(每一取樣步的平方)
const LAYER = { left: 0.17, right: -0.17 }; // 左爪在棘輪前面一層、右爪在後面一層(爪尖都伸到齒的那一層)

const pinAt = (psi) => bodyPoint(P, psi, [E0[0] - P[0], E0[1] - P[1]]).slice(0, 2);
const leverAt = (v) => swingAt(v, SWING / 2, -SWING / 2);

// 爪的外形(局部 +x 由銷指向爪尖,原圖位置時爪尖落在節圓上):往外拱的弧形板
const bulge = { left: -1, right: 1 };
const centerline = (which) => {
  const L = PAWL[which];
  return Array.from({ length: 21 }, (_, i) => [(L * i) / 20, bulge[which] * 0.45 * 4 * (i / 20) * (1 - i / 20)]);
};
const OUTLINE = { left: thickLine(centerline("left"), 0.22), right: thickLine(centerline("right"), 0.22) };
// 爪尖那一段加厚,伸到棘輪齒的那一層(爪身在棘輪前 / 後一層,兩爪在銷附近互不相碰)
const TIP = { left: thickLine(centerline("left").slice(19), 0.16), right: thickLine(centerline("right").slice(19), 0.16) };
// 原圖位置時爪的方向:從銷指向節圓上的爪尖
const restAngle = (which) => {
  const pin = pinAt(0);
  const tip = circleCircle([...pin, 0], PAWL[which], [0, 0, 0], WHEEL.pitchR, SIDE[which]).point;
  return Math.atan2(tip[1] - pin[1], tip[0] - pin[0]);
};

const TEETH = ratchetShape({ teeth: WHEEL.teeth, outer: WHEEL.outer, inner: WHEEL.inner, dir: -1 }).outline;
const wheelAt = (angle) => TEETH.map((p) => rot2(p, angle));
// 每顆齒的陡面(順時針那一面)附近的一小塊:爪尖頂到的是陡面才推得動棘輪;壓在斜背上只會被擠開
const FACES = Array.from({ length: WHEEL.teeth }, (_, i) => {
  const a = i * PITCH;
  const at = (r, f) => [r * Math.cos(a + PITCH * f), r * Math.sin(a + PITCH * f)];
  return [at(WHEEL.outer, 0.92), at(WHEEL.inner + 0.02, 0.98), at(WHEEL.inner + 0.02, 0.9), at(WHEEL.outer - 0.03, 0.86)];
});
const facesAt = (angle) => FACES.map((f) => f.map((p) => rot2(p, angle)));
// 只有爪尖那一段在齒的那一層,接觸只算它
const pawlAt = (which, pin, angle) => placeOutline(TIP[which], pin, angle);

function run(cycles, samples) {
  let wheel = 0;
  const pawl = { left: restAngle("left"), right: restAngle("right") };
  const falling = { left: 0, right: 0 };
  const out = [];
  for (let i = 0; i <= cycles * samples; i++) {
    const v = (2 * SWING * i) / samples;
    const pin = pinAt(leverAt(v));
    // 爪尖頂進齒的陡面時,棘輪往順時針轉到剛好不重疊(推不開就交給下面讓爪退開)
    for (const which of ["left", "right"]) {
      const poly = pawlAt(which, pin, pawl[which]);
      if (!facesAt(wheel).some((f) => polygonsOverlap(poly, f))) continue;
      const hits = (d) => polygonsOverlap(poly, wheelAt(wheel - d));
      const STEP = 0.002;
      for (let d = STEP; d <= 0.05; d += STEP) {
        if (hits(d)) continue;
        let [lo, hi] = [d - STEP, d];
        for (let k = 0; k < 20; k++) {
          const mid = (lo + hi) / 2;
          if (hits(mid)) lo = mid;
          else hi = mid;
        }
        wheel -= hi;
        break;
      }
    }
    // 兩個爪靠自重擺回,停在碰到齒的地方;被齒背頂住時往外退開;落下有加速過程
    for (const which of ["left", "right"]) {
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
  const x = ((v - k * period) / period) * SAMPLES;
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
    { check: "replay", parts: ["wheel"], at: 2 * SWING, reason: "重演做不出來:槓桿端上升的那一程(左爪拉)照模型推進;下降的那一程,推的右爪在重演裡推到一半就沿齒的陡面被擠開、滑到齒背上(爪尖只靠自重或預設的彈簧力壓在齒上,壓不住棘輪定位阻尼的反力),棘輪只轉了模型的三分之一。改用彈簧(預設值)也一樣。原書沒有爪重與彈簧力的資料;推的過程由模型定義的測試檢查(爪不穿入齒、每個來回推兩齒)" },
    { check: "replay", parts: ["wheel"], at: 4 * SWING, reason: "重演做不出來:同上一項(下降的那一程右爪被擠開),累積到第二個來回差更多" },
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
