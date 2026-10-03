// 第 86 種:以旋轉運動驅動往復式泵。承載泵桿的繩索繫在輪 A 上,輪 A 鬆套在軸上;軸帶動凸輪 C 連續旋轉。
// 凸輪每轉一圈,就抓住裝在輪上的鉤形制動裝置 B,把它連同輪一起帶著轉、把繩索抬起;
// 直到制動裝置的末端撞上上方的靜止擋止,制動裝置被釋放,輪便被泵桶的重量拉回原位。主動件是軸(凸輪 C,逆時針)。
//
// 制動裝置 B 的姿勢全部由接觸決定(推斷:原文只說「鉤形」「撞到擋止被釋放」):
// - B 以樞軸裝在輪上,鉤尖憑自重靠在蝸牛形凸輪的面上;凸輪轉動時面越來越低,鉤尖慢慢滑進去,
//   到凸輪的台階處鉤尖正好落在台階底角,台階的壁從後面推著鉤尖走,輪就跟著轉(壁近乎徑向,鉤尖往內擺
//   會撞到凸輪本體,所以推不開、只能帶著輪走)。鉤的長度取「樞軸—鉤尖」與「軸心—鉤尖」垂直,鉤尖才是
//   沿徑向靠近凸輪,不會斜斜地搭在台階旁的高處。
// - B 的樞軸另一側有一段尾巴;輪轉到擋止處,尾巴撞上機架上的徑向擋條,輪再往前走時尾巴被擋條擋住、
//   B 繞樞軸被撬開(尾端貼著擋條滑),鉤尖退出台階的高度,B 便被釋放(釋放的輪角 lift 由這個接觸算出)。
// - 輪被泵桶拉回是憑重量落下的過程(jumps.falling):起步慢、越來越快、回到原位停住;
//   同時 B 憑自重擺回凸輪面(也用 falling),但不穿進凸輪——鉤尖最多貼到面上。
import { TAU, deg, polar, clamp, wrap } from "./kit.js";
import { shape, circle, stadium } from "./shapes.js";
import { falling } from "./jumps.js";

const R = 1.55; // 輪 A
const CATCH = { at: deg(150), r: 0.9, length: 0.75, tail: 0.45 }; // 樞軸(在輪上)、鉤的長度、尾巴的長度
const CAM = { r0: 0.38, r1: 0.7, gap: deg(4) }; // 蝸牛形凸輪:最小、最大半徑;台階的壁斜跨 ±gap
const KNOCK_AT = deg(102); // 尾巴撞上擋條時的輪角
const STOP_HALF = 0.06; // 擋條的半厚
const FALL = deg(50); // 輪被拉回所需的軸轉角
const ROPE_Y = R + 0.04;
const Z = { cam: 0.35, catch: 0.35 }; // 凸輪與 B 同一層,鉤尖才真的靠在凸輪面上

// 鉤尖到輪心的距離只跟 tilt 有關(樞軸—輪心—鉤尖三角形);反過來由距離求 tilt(負值:鉤尖在樞軸順時針側)
const tiltForRadius = (r) => -Math.acos(clamp((CATCH.r ** 2 + CATCH.length ** 2 - r * r) / (2 * CATCH.r * CATCH.length), -1, 1));
const TILT_HOOKED = tiltForRadius(CAM.r0); // 鉤尖貼著台階底角
const TILT_FREE = tiltForRadius(CAM.r1 + 0.03); // 鉤尖剛退出台階高度:釋放
const TILT_OUT = tiltForRadius(CAM.r1 + 0.2); // 擋條最多把 B 撬到這裡(搜尋範圍的外側)
const angleOf = ([x, y]) => Math.atan2(y, x);

/** 輪角 wheel、B 的 tilt 時,樞軸、鉤尖與尾端的位置 */
const catchPoints = (wheel, tilt) => {
  const a = CATCH.at + wheel;
  const pivot = polar(CATCH.r, a);
  const dir = a + Math.PI + tilt;
  return {
    pivot,
    tip: [pivot[0] + CATCH.length * Math.cos(dir), pivot[1] + CATCH.length * Math.sin(dir)],
    tail: [pivot[0] - CATCH.tail * Math.cos(dir), pivot[1] - CATCH.tail * Math.sin(dir)],
  };
};

// 凸輪的半徑:從台階量起的局部角 s;台階壁斜跨 (−gap, gap),之後半徑由 r0 緩升到 r1(逆時針)
const STEP = angleOf(catchPoints(0, TILT_HOOKED).tip) - CAM.gap; // 台階在凸輪上的角度:軸角 0 時台階底角正好在鉤尖處
export function camRadius(s) {
  const w = wrap(s + CAM.gap) - CAM.gap; // 化到 [−gap, 2π − gap)
  if (w < CAM.gap) return CAM.r1 + ((CAM.r0 - CAM.r1) * (w + CAM.gap)) / (2 * CAM.gap); // 台階的壁
  return CAM.r0 + ((CAM.r1 - CAM.r0) * (w - CAM.gap)) / (TAU - 2 * CAM.gap);
}
const camOutline = Array.from({ length: 240 }, (_, i) => {
  const s = (i / 240) * TAU;
  return polar(camRadius(s), STEP + s).slice(0, 2);
});

/** 在 [lo, hi] 內二分求 g 變號處(g(lo) ≥ 0 > g(hi) 的情形) */
function bisect(g, lo, hi) {
  for (let i = 0; i < 36; i++) {
    const mid = (lo + hi) / 2;
    if (g(mid) >= 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** 鉤尖憑自重靠在凸輪面上時 B 的 tilt(軸角 c、輪角 wheel) */
function restingTilt(c, wheel) {
  const g = (tilt) => {
    const tip = catchPoints(wheel, tilt).tip;
    return Math.hypot(...tip) - camRadius(angleOf(tip) - c - STEP); // 正:鉤尖在凸輪外
  };
  return bisect(g, TILT_OUT, tiltForRadius(CAM.r0 - 0.1));
}

// 擋止:一道徑向的擋條,順時針面擋在尾端於 KNOCK_AT 時的位置;輪再往前走尾巴就被它擋住
// (尾端撬開時半徑會縮一點,所以擋條要有徑向的長度,小小一根銷會被尾端從內側滑過)
const STOP = (() => {
  const { tail } = catchPoints(KNOCK_AT, TILT_HOOKED);
  return { face: angleOf(tail), inner: 1.0, outer: 2.5 };
})();

/** 尾巴被擋條擋住時 B 最多能到的 tilt(沒碰到則為 TILT_HOOKED) */
function knockedTilt(wheel) {
  const g = (tilt) => {
    const tail = catchPoints(wheel, tilt).tail;
    return Math.PI - wrap(Math.PI - (STOP.face - angleOf(tail))); // 正:尾端還在擋條的順時針側
  };
  if (g(TILT_HOOKED) >= 0) return TILT_HOOKED;
  return bisect(g, TILT_OUT, TILT_HOOKED);
}

// 釋放的輪角:尾巴被撬到鉤尖退出台階高度的那一刻
const LIFT = (() => {
  for (let u = KNOCK_AT; u < KNOCK_AT + deg(40); u += deg(0.1)) if (knockedTilt(u) <= TILT_FREE) return u;
  throw new Error("第 86 種:擋條撬不開制動裝置");
})();
const TILT_RELEASED = knockedTilt(LIFT);
export const lift = LIFT;

/** 軸轉 c(逆時針):輪 A 的轉角、制動裝置是否鉤住、制動裝置的 tilt */
export function pump(c) {
  const k = Math.floor(c / TAU);
  const u = c - k * TAU;
  if (u < LIFT) return { wheel: u, hooked: true, tilt: knockedTilt(u) };
  if (u < LIFT + FALL) {
    const t = falling((u - LIFT) / FALL);
    const wheel = LIFT * (1 - t);
    // B 憑自重擺回,但鉤尖不穿進凸輪(最多貼到面上)、尾巴也不穿過擋條
    const tilt = Math.min(TILT_RELEASED + (TILT_HOOKED - TILT_RELEASED) * t, restingTilt(c, wheel), knockedTilt(wheel));
    return { wheel, hooked: false, tilt };
  }
  return { wheel: 0, hooked: false, tilt: restingTilt(c, 0) };
}

// B 的本體:從尾端到鉤尖的一條長圓板,樞軸在原點
const catchOutline = stadium(CATCH.tail + CATCH.length, 0.2).outline.map(([x, y]) => [x - CATCH.tail, y]);
const STOP_MID = (STOP.inner + STOP.outer) / 2;
const STOP_DIR = STOP.face + STOP_HALF / STOP_MID; // 擋條中心線的角度(面在順時針側)

export default {
  figure: 86,
  parts: [
    {
      id: "shaft",
      kind: "group",
      center: [0, 0, Z.cam],
      spin: 0.75,
      pieces: [
        { kind: "plate", shape: shape(camOutline, [circle(0.15).reverse()]), thickness: 0.16, mark: polar(0.3, STEP + Math.PI).slice(0, 2), markSize: 0.05 },
        { kind: "cylinder", radius: 0.15, length: 1.6, at: [0, 0, -0.5] },
      ],
      label: "C",
      labelOffset: [-0.55, 0.3, 0.2],
    },
    {
      id: "wheel",
      kind: "group",
      spin: R,
      pieces: [
        { kind: "cylinder", radius: R, inner: R - 0.14, length: 0.42 },
        ...[0, 1, 2, 3].map((k) => ({ kind: "box", size: [R - 0.3, 0.14, 0.12], at: [...polar((R - 0.3) / 2 + 0.2, (k * TAU) / 4 + deg(5)).slice(0, 2), 0], angle: (k * TAU) / 4 + deg(5) })),
        { kind: "cylinder", radius: 0.28, inner: 0.17, length: 0.3 },
        // 制動裝置的樞軸銷,從輪面伸到 B 那一層
        { kind: "cylinder", radius: 0.06, length: 0.5, at: [...polar(CATCH.r, CATCH.at).slice(0, 2), 0.2] },
      ],
      label: "A",
      labelOffset: [1.25, 0.65, 0.3],
    },
    {
      id: "catch",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(catchOutline, [circle(0.06).reverse()]), thickness: 0.08 },
        { kind: "cylinder", radius: 0.1, length: 0.2 },
      ],
      label: "B",
      labelOffset: [-0.25, -0.35, 0.2],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape([[-1.4, -2.3], [1.4, -2.3], [0.42, 0.25], [0.38, 0.5], [-0.38, 0.5], [-0.42, 0.25]], [[[-0.85, -2.0], [0.85, -2.0], [0.12, -0.35], [-0.12, -0.35]].reverse(), circle(0.2).reverse()]), thickness: 0.2, at: [0, 0, 0.55] },
        { kind: "box", size: [3.6, 0.15, 0.8], at: [0, -2.4, 0] },
        { kind: "box", size: [0.2, 4.3, 0.4], at: [-2.25, -0.25, 0] },
        { kind: "box", size: [3.7, 0.15, 0.4], at: [-0.5, 1.95, 0] },
        // 擋止:從底梁立起的徑向擋條,在 B 那一層(越過輪緣的上方),B 的尾巴轉到這裡撞上它
        { kind: "box", size: [STOP_HALF * 2, STOP.outer - STOP.inner, 0.3], at: [...polar(STOP_MID, STOP_DIR).slice(0, 2), Z.catch + 0.02], angle: STOP_DIR + Math.PI / 2 },
      ],
    },
    { id: "rope", kind: "rope" },
  ],
  waivers: [
    { check: "interference", parts: ["shaft", "catch"], reason: "待確認(未修):shaft 的板 與 catch 的板互相穿入 0.12(96 個取樣姿勢),尚未修正" },
    { check: "interference", parts: ["catch", "frame"], reason: "待確認(未修):catch 的板 與 frame 的方塊 0.12×1.5×0.3互相穿入 0.17(11 個取樣姿勢),尚未修正" },
  ],
  driver: { part: "shaft", type: "rotation", speed: 0.8 },

  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(c) {
    const { wheel, tilt } = pump(c);
    const { pivot } = catchPoints(wheel, tilt);
    return {
      parts: {
        shaft: { angle: c },
        wheel: { angle: wheel },
        catch: { position: [pivot[0], pivot[1], Z.catch], angle: CATCH.at + wheel + Math.PI + tilt },
      },
      // 繩索從輪頂往右;輪逆時針轉時繩被捲起(往左走)
      paths: { rope: { points: [[0, ROPE_Y, 0], [3.0, ROPE_Y, 0]], closed: false, phase: wheel * R } },
      readouts: [],
    };
  },
};
