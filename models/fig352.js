// 第 352 種:第 129 種中式絞盤的另一種配置。A 形架的兩根腳中段各有一個鉤子,掛著一個導輪;
// 絞盤的鼓輪分大小兩段,鼓軸穿過兩根架腳;一條繩的兩端分別捲在大段與小段上(纏繞方向相反),
// 中間往上繞過兩個導輪,再垂下一個繩圈吊著滑輪,滑輪下的鉤子吊著重物。轉一圈時大段捲進一個大圓周、
// 小段放出一個小圓周,重物上升兩者差的一半。主動件是絞盤(以穿過鼓的撬棒轉動)。
// 繩照第 129 種的做法捲在鼓上(原圖兩段都繞著好幾圈):繩頭固定在鼓的外端、跟著鼓轉,繩一圈圈往裡捲到
// 離開鼓的地方;大段的繩從鼓的前方往上離開、小段從後方離開,鼓同一個轉向才會一邊捲進、一邊放出。
// 繩從鼓的切線離開(切點由繩往導輪的方向算),捲上一圈離開點就往裡挪一個繩距。
// 推斷:鼓輪的兩段半徑、可轉的圈數與起始時兩段各捲幾圈;撬棒的形狀;架頭的螺栓、鉤子與導輪的吊架;
// 滑輪的吊架、鉤子與重物上的吊環。原圖架頂的兩個圓是把兩根腳接在架頭上的螺栓,導輪在兩腳中段的鉤子上。
// 繩不打滑:大段捲進的速度是 (R1 + 繩半徑)·ω、小段放出的是 (R2 + 繩半徑)·ω(繩心繞鼓的半徑),所以左導輪、
// 右導輪各以這兩個表面速度轉,吊重物的滑輪一邊升一邊以兩者平均的表面速度轉;繩頭固定在鼓上,
// 繩上的色段從繩頭量起,跟著繩走。
import { X, Z, TAU, clamp, routeRope } from "./kit.js";

const R1 = 0.48; // 大段
const R2 = 0.3; // 小段
const DRUM_Y = -2.2;
const BIG = { x: -0.85, length: 1.0 }; // 大段在 x 的位置
const SMALL = { x: 0.85, length: 0.7 }; // 小段在 x 的位置
const PULLEY = 0.32;
// 兩個導輪的內緣正好在吊重滑輪的兩側:中間兩段繩鉛直,滑輪每升一點兩段各短一點(繩長不變)
const G = { left: [-(PULLEY + 0.17), 0.9, 0], right: [PULLEY + 0.17, 0.9, 0], r: 0.17 };
export const TURNS = 2;
export const RANGE = [0, TURNS * TAU];
const Y0 = -0.52; // 重物滑輪的起始高度(重物底離鼓軸 0.05)
const COIL = { pitch: 0.095, lift: 0.045, big: 5, small: 3.5 }; // 相鄰兩圈的間距、繩心離鼓面的高度(繩的半徑)、起始時兩段各捲幾圈
const LEG = { atDrum: 2.45, tilt: 0.38, top: 2.35, foot: -2.9 }; // 架腳在鼓的高度離中線多遠、傾角、架頭頂、腳底
const legX = (y) => LEG.atDrum - Math.tan(LEG.tilt) * (y - DRUM_Y); // 架腳中心線在高度 y 離中線多遠
const HOOK_Y = 1.27; // 鉤子的高度

/** 繩心繞鼓的半徑(大段、小段):繩捲進、放出的速度 = 這個半徑 × 鼓的角速度 */
export const windRadii = [R1 + COIL.lift, R2 + COIL.lift];
/** 絞盤轉 theta → 重物滑輪的高度 */
export const pulleyY = (theta) => Y0 + ((R1 - R2) * clamp(theta, ...RANGE)) / 2;
export const radii = [R1, R2];
/** 絞盤轉 theta → 左、右導輪與吊重滑輪的轉角(繩不打滑) */
export const sheaves = (theta0) => {
  const theta = clamp(theta0, ...RANGE);
  const [w1, w2] = windRadii;
  return { left: (w1 * theta) / G.r, right: (w2 * theta) / G.r, pulley: (-(w1 + w2) * theta) / (2 * PULLEY) };
};

// 繩頭:大段在左端、小段在右端(各離端面半個繩距多一點),固定在鼓上
const HEAD = { big: BIG.x - BIG.length / 2 + 0.06, small: SMALL.x + SMALL.length / 2 - 0.06 };
// 鼓上一點:沿軸在 x、繞 +X 轉到角 psi(0 在鼓頂、π/2 在鼓的前方)、繩心半徑 r
const onDrum = (x, r, psi) => [x, DRUM_Y + r * Math.cos(psi), r * Math.sin(psi)];
const angleOf = (p) => Math.atan2(p[2], p[1] - DRUM_Y);

// 繩在鼓外的一段:從大段的離開點往上繞過左導輪、吊重滑輪、右導輪,回到小段的離開點。
// 鼓的兩段以繞 x 軸的圓當成路徑的兩端(sense −1:大段的繩從前方往上離開、小段的繩從後方往下回到鼓上)
function freeRope(xBig, xSmall, y) {
  const [w1, w2] = windRadii;
  const route = routeRope([
    { circle: { center: [xBig, DRUM_Y, 0], axis: X, radius: w1, sense: -1 } },
    { circle: { center: G.left, axis: Z, radius: G.r, sense: -1 } },
    { circle: { center: [0, y, 0], axis: Z, radius: PULLEY, sense: 1 } },
    { circle: { center: G.right, axis: Z, radius: G.r, sense: -1 } },
    { circle: { center: [xSmall, DRUM_Y, 0], axis: X, radius: w2, sense: -1 } },
  ]);
  const points = route.points.filter((p, i, a) => i === 0 || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1], p[2] - a[i - 1][2]) > 1e-9);
  return points;
}

// 兩段上捲著的圈數 → 離開點(沿軸的位置隨圈數挪)與鼓外的繩;離開點的角由繩往導輪的方向算
function layout(turnsBig, turnsSmall, y) {
  const xBig = HEAD.big + COIL.pitch * turnsBig;
  const xSmall = HEAD.small - COIL.pitch * turnsSmall;
  const free = freeRope(xBig, xSmall, y);
  return { xBig, xSmall, free, leave: angleOf(free[0]), arrive: angleOf(free.at(-1)) };
}
// 起始時繩頭在鼓上的角:大段從離開點往回(繞的角增加)捲 big 圈,小段從離開點往回(角減少)捲 small 圈
const START = layout(COIL.big, COIL.small, Y0);
const HEAD_ANGLE = { big: START.leave + COIL.big * TAU, small: START.arrive - COIL.small * TAU };

// 捲在鼓上的繩:從角 a0、沿軸 x0 繞到角 a1、沿軸 x1(每圈 24 點)
function coil(r, a0, x0, a1, x1) {
  const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) / TAU) * 24));
  return Array.from({ length: n + 1 }, (_, i) => onDrum(x0 + ((x1 - x0) * i) / n, r, a0 + ((a1 - a0) * i) / n));
}

/** 絞盤轉 theta:兩段上各捲著幾圈與整條繩的路徑(從大段的繩頭到小段的繩頭) */
export function rope(theta0) {
  const theta = clamp(theta0, ...RANGE);
  const y = pulleyY(theta);
  const head = { big: HEAD_ANGLE.big + theta, small: HEAD_ANGLE.small + theta }; // 繩頭跟著鼓轉
  // 圈數由繩頭的角與離開點的角算;離開點又隨圈數沿軸挪,反覆兩次就收斂
  let turns = { big: COIL.big + theta / TAU, small: COIL.small - theta / TAU };
  let at = layout(turns.big, turns.small, y);
  for (let k = 0; k < 2; k++) {
    turns = { big: (head.big - at.leave) / TAU, small: (at.arrive - head.small) / TAU };
    at = layout(turns.big, turns.small, y);
  }
  const [w1, w2] = windRadii;
  const big = coil(w1, head.big, HEAD.big, at.leave, at.xBig);
  const small = coil(w2, at.arrive, at.xSmall, head.small, HEAD.small);
  return { turns, points: [...big, ...at.free.slice(1, -1), ...small] };
}

// 架腳:沿中心線從腳底到架頭頂
const leg = (s) => {
  const len = (LEG.top - LEG.foot) / Math.cos(LEG.tilt);
  const yc = (LEG.top + LEG.foot) / 2;
  return { kind: "box", size: [0.25, len, 0.3], at: [s * legX(yc), yc, 0], angle: s * LEG.tilt };
};
// 導輪的吊架:鉤子從架腳內側伸出,兩片夾板吊著導輪的軸(推斷)
const hanger = (s) => {
  const [gx, gy] = s < 0 ? G.left : G.right;
  const inner = legX(HOOK_Y) - 0.125 / Math.cos(LEG.tilt); // 架腳內側
  return [
    { kind: "box", size: [inner + 0.04 - Math.abs(gx) + 0.05, 0.08, 0.08], at: [s * ((inner + 0.04 + Math.abs(gx) - 0.05) / 2), HOOK_Y, 0] }, // 鉤子(伸進架腳)
    { kind: "box", size: [0.1, 0.08, 0.19], at: [gx, HOOK_Y, 0] }, // 夾板上端的橫樑
    ...[-1, 1].map((k) => ({ kind: "box", size: [0.1, HOOK_Y - gy + 0.04, 0.03], at: [gx, (HOOK_Y + gy - 0.04) / 2, k * 0.08] })), // 兩片夾板
    { kind: "cylinder", radius: 0.05, length: 0.19, at: [gx, gy, 0] }, // 導輪的軸
  ];
};

export default {
  figure: 352,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        leg(-1),
        leg(1),
        { kind: "box", size: [2 * legX(2.15) + 0.4, 0.4, 0.3], at: [0, 2.15, 0] }, // 架頭
        // 把兩根腳接在架頭上的螺栓(原圖架頂的兩個圓)
        ...[-1, 1].map((s) => ({ kind: "cylinder", radius: 0.08, length: 0.36, at: [s * legX(2.15), 2.15, 0] })),
        ...hanger(-1),
        ...hanger(1),
      ],
    },
    { id: "guideL", kind: "pulley", style: "disc", center: G.left, radius: G.r, width: 0.12 },
    { id: "guideR", kind: "pulley", style: "disc", center: G.right, radius: G.r, width: 0.12 },
    {
      id: "drum",
      kind: "group",
      axis: X,
      center: [0, DRUM_Y, 0],
      spin: R1,
      spinOffset: BIG.x,
      pieces: [
        { kind: "cylinder", radius: 0.07, length: 2 * LEG.atDrum + 0.7 }, // 鼓軸:穿過兩根架腳,兩端伸出
        { kind: "cylinder", radius: R1, length: BIG.length, at: [0, 0, BIG.x], mark: true },
        { kind: "cylinder", radius: R2, length: SMALL.length, at: [0, 0, SMALL.x], mark: true },
        // 撬棒(左端穿過鼓軸的兩根)
        { kind: "box", size: [0.06, 1.6, 0.06], at: [0, 0, -1.65] },
        { kind: "box", size: [1.6, 0.06, 0.06], at: [0, 0, -1.65] },
      ],
    },
    { id: "pulley", kind: "pulley", style: "disc", radius: PULLEY, width: 0.12 },
    {
      // 重物連同滑輪的吊架:滑輪的軸、兩片夾板、底下的橫樑、鉤子,鉤子鉤著重物頂上的吊環(原點在滑輪的軸)
      id: "weight",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.05, length: 0.21 },
        ...[-1, 1].map((k) => ({ kind: "box", size: [0.1, 0.5, 0.03], at: [0, -0.22, k * 0.09] })),
        { kind: "box", size: [0.12, 0.06, 0.21], at: [0, -0.47, 0] },
        { kind: "box", size: [0.06, 0.26, 0.06], at: [0, -0.63, 0] },
        { kind: "tube", points: [[0, -0.76, 0], [0, -0.86, 0], [0.04, -0.95, 0], [0.12, -0.95, 0], [0.15, -0.87, 0]], radius: 0.03 },
        { kind: "cylinder", axis: X, radius: 0.08, inner: 0.045, length: 0.04, at: [0.04, -0.98, 0] }, // 吊環
        { kind: "lathe", axis: [0, 1, 0], profile: [[0, -1.6], [0.3, -1.6], [0.22, -1.02], [0.1, -0.98], [0, -0.98]] },
      ],
    },
    { id: "rope", kind: "rope" },
  ],
  driver: { part: "drum", type: "rotation", range: RANGE, initial: 0 },
  target: "weight", // 被吊起的重物
  view: { direction: [0.06, 0.06, 1] },
  pose(theta0) {
    const theta = clamp(theta0, ...RANGE);
    const y = pulleyY(theta);
    const s = sheaves(theta);
    return {
      parts: {
        drum: { angle: theta },
        guideL: { angle: s.left },
        guideR: { angle: s.right },
        pulley: { position: [0, y, 0], angle: s.pulley },
        weight: { position: [0, y, 0] },
      },
      // 繩的起點是大段上的繩頭,固定在鼓上跟著轉,所以記號不另外移相:離繩頭的弧長就是材料座標
      paths: { rope: { points: rope(theta).points, closed: false, phase: 0 } },
      readouts: [],
    };
  },
};
