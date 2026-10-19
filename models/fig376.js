// 第 376 種:馬匹驅動的踏輪馬力裝置。馬在大輪裡面,試著沿輪的內側往上走,牠的重量讓輪一直轉;曾用來驅動渡輪的槳輪等。
// 古時候也有讓「烤肉叉犬」在這種輪裡走、轉動烤肉叉的。主動件是虛擬的「進程」:馬已走了多遠(輪轉了幾圈)。
// 照原圖:馬面朝左、在輪心的左下方沿輪緣內面往左上爬,身體前高後低;牠的重心在輪心左邊,重量讓輪逆時針轉,
// 輪在牠腳下往回(往右下)轉。四條腿以對角兩兩交替(快步):支撐的蹄踩在輪緣內面、和輪面一起往後走,另一對抬起往前邁。
// 輪心的圓原圖打滿斜線,是剖開的軸:軸固定在輪上一起轉,往後穿過軸承座,軸端的大齒輪咬一個小齒輪把動力傳出去
// (推斷,照同族第 377 種在軸端畫大齒輪的做法;小齒輪是目標件)。
// 偏離插圖:原圖格子在馬的前面,這裡把格子放在輪緣寬度的中間、馬在前半,看得到整匹馬。
// 推斷:馬的步伐與輪轉的對應、腿分成上下兩節(膝);輪的輪輻依原圖畫成斜放的格子;軸承座、大齒輪、小齒輪與它的軸承座。
import { TAU, deg, rot2 } from "./kit.js";
import { shape, circle } from "./shapes.js";
import { pedestal } from "./supports.js";
import { circleCircle } from "./linkage.js";
import { meshAngle } from "./gears.js";

const R = 2.1;
const RIM_IN = 2.0; // 輪緣內面(馬蹄踩的地方)
const RIM_OUT = 2.25;
const RIM_T = 1.2; // 輪面寬(z −0.6..0.6)
const GRID_TILT = deg(30); // 原圖的格子斜放
const AXLE = 0.2;
const FLOOR = -R - 0.5;
const STEP = 0.26; // 一步的輪面轉角(弧長約 0.52)
const LIFT = 0.2; // 邁步時蹄抬起的高度
const LEG_W = 0.09;
const GEAR_Z = -1.45; // 軸端的大齒輪
const GEAR = { center: [0, 0, GEAR_Z], teeth: 40, radius: 1.4 };
const PINION = { center: [1.4 + 0.56, 0, GEAR_Z], teeth: 16, radius: 0.56 };

/** 進程 p(輪轉的圈數)→ 輪轉角 */
export function treadWheel(p) {
  return { wheel: TAU * p }; // 馬往左上走,輪逆時針轉
}

// 馬:側面輪廓(身體與頭頸),面朝左;依原圖前高後低地斜放,放在輪心左下方
const HORSE = [-0.7, -0.7, 0.35];
const SIZE = 1.25; // 照原圖,馬約佔輪內徑的一半
const TILT = deg(-28); // 順時針轉:頭那一端抬高
const BODY = [
  [-0.55, -0.15], [0.45, -0.15], [0.6, 0.0], [0.75, 0.35], [0.95, 0.55], [1.05, 0.5], [0.95, 0.3], [0.8, 0.05], [0.5, 0.18], [-0.4, 0.2], [-0.62, 0.1], [-0.8, -0.1],
].map(([x, y]) => rot2([-x * SIZE, y * SIZE], TILT)).reverse();
const body = shape(BODY);

// 四條腿:前腿接在肩、後腿接在髖(馬身上的點),近側(z 前)與遠側各一條;上節在外、下節靠輪面那一層
// 對角的兩條(近前與遠後、遠前與近後)同時落地
const LEGS = {
  FF: { at: [-0.4, -0.08], front: true, near: true, phase: 0 },
  FB: { at: [-0.4, -0.08], front: true, near: false, phase: 1 },
  HF: { at: [0.45, -0.08], front: false, near: true, phase: 1 },
  HB: { at: [0.45, -0.08], front: false, near: false, phase: 0 },
};
const HOOF = RIM_IN - LEG_W / 2; // 蹄(下節端頭的圓)貼著輪緣內面時,端點離輪心的距離
for (const leg of Object.values(LEGS)) {
  const [x, y] = rot2([leg.at[0] * SIZE, leg.at[1] * SIZE], TILT);
  leg.top = [HORSE[0] + x, HORSE[1] + y];
  leg.mid = Math.atan2(-Math.sqrt(HOOF * HOOF - leg.top[0] ** 2), leg.top[0]) + (leg.front ? -0.04 : 0.02); // 踩在肩、髖的正下方附近
  const reach = Math.max(...[-1, 1].map((s) => Math.hypot(HOOF * Math.cos(leg.mid + (s * STEP) / 2) - leg.top[0], HOOF * Math.sin(leg.mid + (s * STEP) / 2) - leg.top[1])));
  leg.len = reach * 0.53; // 上下兩節一樣長,伸到最遠時膝還微彎
  leg.z = leg.near ? [0.485, 0.555] : [0.215, 0.145]; // 上節、下節的 z
}

/** 進程 p → 某條腿的蹄的位置(世界座標,xy)與是否支撐 */
export function hoof(p, id) {
  const leg = LEGS[id];
  const u = TAU * p / STEP + leg.phase;
  const m = ((u % 2) + 2) % 2;
  if (m < 1) {
    const b = leg.mid - STEP / 2 + m * STEP; // 支撐:蹄跟著輪面走(輪逆時針轉,角度增加 = 往後)
    return { at: [HOOF * Math.cos(b), HOOF * Math.sin(b)], stance: true };
  }
  const s = m - 1;
  const b = leg.mid + STEP / 2 - s * STEP; // 邁步:抬起往前
  const r = HOOF - LIFT * Math.sin(Math.PI * s);
  return { at: [r * Math.cos(b), r * Math.sin(b)], stance: false };
}

function legPose(p, id) {
  const leg = LEGS[id];
  const h = hoof(p, id).at;
  // 前腿的膝往前(左)凸、後腿的膝往後(右)凸
  const cands = [1, -1].map((s) => circleCircle([...leg.top, 0], leg.len, [...h, 0], leg.len, s).point);
  const knee = cands.reduce((a, b) => ((leg.front ? b[0] < a[0] : b[0] > a[0]) ? b : a));
  return {
    upper: { from: [...leg.top, leg.z[0]], to: [knee[0], knee[1], leg.z[0]] },
    lower: { from: [knee[0], knee[1], leg.z[1]], to: [...h, leg.z[1]] },
  };
}

// 輪的格子狀輪輻:4 × 4 根條,依原圖斜放;一根塗記號色
const grid = [];
for (const v of [-1.2, -0.4, 0.4, 1.2]) {
  const h = Math.sqrt(R * R - v * v) - 0.1;
  for (const across of [false, true]) {
    const a = GRID_TILT + (across ? Math.PI / 2 : 0);
    const [x, y] = rot2([v, 0], a);
    grid.push({ kind: "box", size: [0.12, 2 * h, 0.12], at: [x, y, 0], angle: a, role: "grid", accent: across && v === 1.2 });
  }
}

export default {
  figure: 376,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 輪軸的軸承座在輪後面;小齒輪的軸承座在它後面;兩個座立在同一塊底板上
        ...pedestal({ at: [0, 0], z: -1.0, bore: AXLE, floor: FLOOR }),
        ...pedestal({ at: [PINION.center[0], PINION.center[1]], z: -1.95, bore: 0.1, floor: FLOOR }),
        { kind: "box", size: [3.6, 0.18, 1.8], at: [0.9, FLOOR - 0.27, -1.45] },
      ],
    },
    {
      id: "wheel",
      kind: "group",
      spin: R,
      spinOffset: RIM_T / 2 + 0.12, // 箭頭在輪緣前面
      pieces: [
        { kind: "plate", shape: shape(circle(RIM_OUT), [circle(RIM_IN).reverse()]), thickness: RIM_T }, // 輪面夠寬:四隻蹄都踩在輪緣的內面上
        // 螺栓在輪緣正面(原圖畫在輪緣上的一圈點)
        ...Array.from({ length: 16 }, (_, i) => ({ kind: "sphere", radius: 0.05, at: [((RIM_IN + RIM_OUT) / 2) * Math.cos((i * TAU) / 16), ((RIM_IN + RIM_OUT) / 2) * Math.sin((i * TAU) / 16), RIM_T / 2] })),
        ...grid,
        { kind: "cylinder", radius: 0.36, length: 0.4, mark: true, role: "hub" }, // 輪轂,接著最內圈的四根格條
        { kind: "cylinder", radius: AXLE, length: 0.2 - (GEAR_Z - 0.15), at: [0, 0, (0.2 + GEAR_Z - 0.15) / 2], role: "axle" }, // 軸和輪一起轉,往後穿過軸承座
        { kind: "gear", teeth: GEAR.teeth, radius: GEAR.radius, width: 0.25, bore: AXLE, at: [0, 0, GEAR_Z] },
      ],
    },
    {
      id: "pinion",
      kind: "gear",
      center: PINION.center,
      teeth: PINION.teeth,
      radius: PINION.radius,
      width: 0.25,
      bore: 0.1,
      pieces: [{ kind: "cylinder", radius: 0.1, length: 0.75, at: [0, 0, -0.3] }], // 小齒輪的軸,往後伸進軸承座
    },
    {
      id: "horse",
      kind: "group",
      center: HORSE,
      arrow: false,
      pieces: [{ kind: "plate", shape: body, thickness: 0.2 }],
    },
    ...Object.keys(LEGS).flatMap((k) => [
      { id: `leg${k}`, kind: "link", width: LEG_W, thickness: 0.07 },
      { id: `shin${k}`, kind: "link", width: LEG_W, thickness: 0.07 },
    ]),
  ],
  powered: ["wheel"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.08 },
  target: "pinion", // 輪軸端的大齒輪帶著轉的小齒輪(把動力傳出去)
  view: { direction: [0.04, 0.05, 1] },
  pose(p) {
    const t = treadWheel(p);
    const parts = { wheel: { angle: t.wheel }, pinion: { angle: meshAngle(GEAR, PINION, t.wheel) } };
    for (const k of Object.keys(LEGS)) {
      const l = legPose(p, k);
      parts[`leg${k}`] = l.upper;
      parts[`shin${k}`] = l.lower;
    }
    return { parts, readouts: [] };
  },
};
