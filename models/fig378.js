// 第 378 種:由擺的運動驅動、用來鋸倒下的樹木的鋸子。左邊三腳架上吊著一個擺(重錘),擺桿中段的孔經一根等長的連桿
// 鉸著弓鋸左把手上的銷;弓鋸在一個倒 U 形托架的兩條橫導軌之間橫向滑,托架由兩條繩吊在門形架上角的滑輪下,
// 只會往下降。主動件是虛擬的「進程」:擺已擺過的次數(鋸切的進度);擺來回擺,連桿推拉弓鋸在導軌上往復,
// 托架與弓鋸一面逐漸往下,鋸條一點一點切進樹幹。進程繞回時重新從樹幹頂上鋸起(托架與配重回到起點,刻意的循環)。
// 吊法照原圖與 507movements 的動畫:繩從托架兩側立條上的掛眼垂直往上,繞過門形架上角的滑輪,從外側垂下吊著配重;
// 托架往下時配重被拉上去(繩長不變,滑輪跟著轉);掛眼全程在滑輪下方。
// 弓鋸的橫向位置由「連桿長度不變」解出:擺桿上的孔與鋸把手上的銷距離固定(銷的高度取在孔上下行程的中間,
// 托架往下時鋸幾乎不偏)。比例照原圖:三腳架高約門形架的 1.4 倍,鋸條長約樹幹直徑的兩倍、在門形架裡約佔一半寬。
// 擺幅取 ±9°:鋸往復時兩根把手都留在樹幹外側(不會掉進鋸縫),也碰不到托架的立條。
// 推斷:每一次往復切進的深度(示意)、滑輪的軸(穿過門形架前後兩片的立柱)、托架立條背後靠著門形架後片立柱內側的
// 導靴(讓托架只能上下)、三腳架往後斜到地上的第三腳、擺桿與鋸把手上的銷。原圖擺桿上有三個孔(可以換接點),
// 連桿接在中間那個。原圖托架立條下端的階梯形鉤沒有畫。
import { TAU, deg, clamp, rot2 } from "./kit.js";
import { shape, thickLine } from "./shapes.js";

const GROUND = -1.76; // 底座頂面
const PIVOT = [-3.0, 2.5, 0.4]; // 擺的懸掛點(三腳架頂);擺在三腳架前腳的前面擺
const L = 3.5; // 擺長(懸掛點到錘中心)
export const HOLES = [2.05, 2.4, 2.72]; // 擺桿上三個孔離懸掛點的距離(原圖的三個孔)
const HOLE = HOLES[1]; // 連桿接在中間那個孔
const SWING = deg(9);
const STROKES = 12; // 進程一輪裡擺擺過的次數
export const LOG = { center: [1.0, GROUND + 0.5, 0], r: 0.5 };
export const DEPTH = 0.9; // 一輪鋸進的深度(樹幹直徑的九成)

const POSTS = [-0.9, 2.9]; // 門形架兩根立柱的中心線(前後兩片,z = ±0.7)
const BEAM = 1.25; // 門形架上樑的中心線
const POST_W = 0.18;
const PLATE_Z = 0.7;
const ROPE_R = 0.025;
export const SHEAVE = { r: 0.19, y: 0.95, xs: POSTS }; // 滑輪在立柱的中心線上、上樑下方,繩走在 z = 0 那一層
const PITCH_R = SHEAVE.r + ROPE_R; // 繩中心線繞滑輪的半徑

// 托架(倒 U 形,局部座標的原點在鋸齒尖那一層、x 在門形架中間)
const CX = (POSTS[0] + POSTS[1]) / 2; // 1.0
export const CARRIAGE = {
  upright: [1.52, 1.64], // 立條內外兩面離中線的距離
  bottom: 0.8,
  top: 1.55, // 上橫樑頂
  eye: 0.9, // 掛眼的高度(繩的下端)
  rails: { lower: [0.97, 1.05], upper: [1.15, 1.23], z: [0.06, 0.16] }, // 兩條橫導軌(在立條前面;鋸到底時仍在樹幹頂上方)
};
// 弓鋸(局部座標同托架:原點在鋸齒尖、x 在鋸的中線)
export const SAW = {
  half: 0.97, // 把手中心離中線(鋸條約為樹幹直徑的兩倍,原圖)
  handle: 1.45, // 把手高
  slider: { half: 1.02, y: [1.05, 1.15], z: [0.06, 0.16] }, // 背後夾在兩條導軌之間滑的橫條
  z: [0.16, 0.26], // 鋸身(把手、鋸條)的深度
  pin: [-0.97, 1.3], // 左把手上接連桿的銷
};
const LINK_Z = 0.33; // 連桿所在的深度(鋸身前面、擺桿後面)
const Y0 = LOG.center[1] + LOG.r; // 進程 0 時鋸齒尖剛碰到樹幹頂
const holeAt = (angle) => {
  const [x, y] = rot2([0, -HOLE], angle);
  return [PIVOT[0] + x, PIVOT[1] + y];
};
const X_MID = CX; // 擺在中間、進程 0 時鋸的中線
export const ROD = Math.hypot(X_MID + SAW.pin[0] - holeAt(0)[0], Y0 + SAW.pin[1] - holeAt(0)[1]); // 連桿長(不變)

/** 進程 p → 擺角、擺桿中間那個孔、托架高度(鋸齒尖那一層)、鋸的中線(由連桿長度解出) */
export function sawing(p0) {
  const p = clamp(p0, 0, 1);
  const angle = SWING * Math.sin(TAU * STROKES * p);
  const hole = holeAt(angle);
  const y = Y0 - DEPTH * p;
  const dy = y + SAW.pin[1] - hole[1];
  const x = hole[0] + Math.sqrt(ROD * ROD - dy * dy) - SAW.pin[0];
  return { angle, hole, y, x, bob: [PIVOT[0] + L * Math.sin(angle), PIVOT[1] - L * Math.cos(angle)] };
}

const WEIGHT_TOP0 = -0.3; // 配重頂端在進程 0 時的高度(切到底時升到滑輪下方)
/** 托架高度 → 往下降的量、兩邊配重頂端的高度(繩垂直、長度不變:托架降多少,配重升多少) */
export function hang(y) {
  const drop = Y0 - y;
  return { drop, weightTop: WEIGHT_TOP0 + drop };
}
const inner = (side) => SHEAVE.xs[side] + (side === 0 ? PITCH_R : -PITCH_R); // 繩從滑輪內側垂直往下到托架
const outer = (side) => SHEAVE.xs[side] + (side === 0 ? -PITCH_R : PITCH_R); // 外側垂下到配重
const arcOver = (side) =>
  Array.from({ length: 13 }, (_, k) => {
    const a = side === 0 ? (k / 12) * Math.PI : Math.PI - (k / 12) * Math.PI;
    return [SHEAVE.xs[side] + PITCH_R * Math.cos(a), SHEAVE.y + PITCH_R * Math.sin(a), 0];
  });

const [U0, U1] = CARRIAGE.upright;
const EYE_X = CX - inner(0); // 掛眼在繩的正下方(滑輪內側的切線上),套在立條外面
const gantry = (z) => ({ kind: "plate", shape: shape(thickLine([[POSTS[0], GROUND], [POSTS[0], BEAM], [POSTS[1], BEAM], [POSTS[1], GROUND]], POST_W)), thickness: 0.2, at: [0, 0, z] });
const legFoot = [PIVOT[0], GROUND, -0.95]; // 第三腳落地處(推斷)
const apex = [PIVOT[0], PIVOT[1] + 0.1, 0.1];
const leg3 = [legFoot[0] - apex[0], legFoot[1] - apex[1], legFoot[2] - apex[2]];
const leg3Len = Math.hypot(...leg3);

export default {
  figure: 378,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 三腳架:前面兩腳在擺的後面(擺從它前方擺過),第三腳從頂點往後斜到地上(推斷)
        { kind: "plate", shape: shape(thickLine([[-4.1, GROUND], [apex[0], apex[1]], [-1.9, GROUND]], 0.1)), thickness: 0.1, at: [0, 0, apex[2]] },
        { kind: "cylinder", axis: leg3.map((v) => v / leg3Len), radius: 0.05, length: leg3Len, at: [apex[0] + leg3[0] / 2, apex[1] + leg3[1] / 2, apex[2] + leg3[2] / 2] },
        { kind: "cylinder", radius: 0.055, length: 0.5, at: [PIVOT[0], PIVOT[1], 0.3] }, // 擺的樞軸(從三腳架頂往前伸)
        // 跨過樹幹的門形架(前後兩片),立柱落在底座上
        gantry(-PLATE_Z),
        gantry(PLATE_Z),
        { kind: "box", size: [7.7, 0.12, 2.0], at: [-0.55, GROUND - 0.06, 0] },
        // 滑輪的軸:穿過前後兩片立柱的上角(推斷)
        ...POSTS.map((x) => ({ kind: "cylinder", radius: 0.04, length: 2 * PLATE_Z, at: [x, SHEAVE.y, 0] })),
      ],
    },
    ...SHEAVE.xs.map((x, i) => ({ id: i === 0 ? "sheaveL" : "sheaveR", kind: "pulley", style: "disc", center: [x, SHEAVE.y, 0], radius: SHEAVE.r, width: 0.1 })),
    ...["weightL", "weightR"].map((id) => ({ id, kind: "box", size: [0.22, 0.4, 0.22] })),
    { id: "cordL", kind: "rope", radius: ROPE_R },
    { id: "cordR", kind: "rope", radius: ROPE_R },
    // 倒下的樹幹(沿 z 方向躺著,擱在底座上)
    { id: "log", kind: "cylinder", center: LOG.center, radius: LOG.r, length: 2.4, axis: [0, 0, 1] },
    {
      id: "pendulum",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        // 擺桿:板件,上面三個孔(原圖)
        { kind: "plate", role: "rod", shape: { outline: [[-0.05, 0], [0.05, 0], [0.05, -L + 0.25], [-0.05, -L + 0.25]], holes: HOLES.map((d) => Array.from({ length: 12 }, (_, k) => [0.025 * Math.cos((k * TAU) / 12), -d + 0.025 * Math.sin((k * TAU) / 12)])) }, thickness: 0.06 },
        { kind: "box", size: [0.4, 0.6, 0.3], at: [0, -L, 0] },
        { kind: "cylinder", radius: 0.12, inner: 0.055, length: 0.2 },
        // 中間那個孔裡的銷,往後伸過連桿的眼(推斷)
        { kind: "cylinder", role: "pin", radius: 0.025, length: 0.16, at: [0, -HOLE, -0.05] },
      ],
    },
    { id: "rod", kind: "link", width: 0.08, thickness: 0.06, pins: false }, // 兩端的眼套在擺桿與鋸把手的銷上,長度不變
    {
      id: "carriage",
      kind: "group",
      arrow: false,
      pieces: [
        // 倒 U 形:上橫樑與兩根立條
        { kind: "box", size: [U0 + U1, 0.1, 0.12], at: [0, CARRIAGE.top - 0.05, 0] },
        ...[-1, 1].map((s) => ({ kind: "box", role: "upright", size: [U1 - U0, CARRIAGE.top - CARRIAGE.bottom, 0.12], at: [(s * (U0 + U1)) / 2, (CARRIAGE.top + CARRIAGE.bottom) / 2, 0] })),
        // 立條外側的掛眼:繩的下端
        ...[-1, 1].map((s) => ({ kind: "box", role: "eye", size: [0.12, 0.06, 0.08], at: [s * EYE_X, CARRIAGE.eye - 0.03, 0] })),
        // 兩條橫導軌,釘在立條前面
        ...[CARRIAGE.rails.lower, CARRIAGE.rails.upper].map(([a, b]) => ({ kind: "box", role: "rail", size: [2 * U1, b - a, CARRIAGE.rails.z[1] - CARRIAGE.rails.z[0]], at: [0, (a + b) / 2, (CARRIAGE.rails.z[0] + CARRIAGE.rails.z[1]) / 2] })),
        // 導靴:立條背後伸到門形架後片立柱的內側,托架只能沿立柱上下(推斷)
        ...[-1, 1].map((s) => ({ kind: "box", size: [CX - POSTS[0] - POST_W / 2 - U0, 0.12, PLATE_Z + 0.05 - 0.06], at: [(s * (U0 + CX - POSTS[0] - POST_W / 2)) / 2, CARRIAGE.bottom + 0.06, -(PLATE_Z + 0.05 + 0.06) / 2] })),
      ],
    },
    {
      id: "saw",
      kind: "group",
      arrow: false,
      pieces: [
        // 弓鋸:兩根把手、把手之間的撐桿、下面的鋸條
        ...[-1, 1].map((s) => ({ kind: "box", size: [0.1, SAW.handle, 0.1], at: [s * SAW.half, SAW.handle / 2, 0] })),
        { kind: "box", size: [2 * SAW.half, 0.06, 0.06], at: [0, 1.35, 0] },
        { kind: "plate", role: "blade", shape: shape([[-SAW.half, 0.18], ...Array.from({ length: 20 }, (_, i) => [-SAW.half + (i * SAW.half) / 10, i % 2 ? 0.06 : 0]), [SAW.half, 0], [SAW.half, 0.18]]), thickness: 0.03 },
        // 背後夾在兩條導軌之間滑的橫條
        { kind: "box", role: "slider", size: [2 * SAW.slider.half, SAW.slider.y[1] - SAW.slider.y[0], 0.1], at: [0, (SAW.slider.y[0] + SAW.slider.y[1]) / 2, -0.1] },
        // 左把手上接連桿的銷,往前伸過連桿的眼(推斷)
        { kind: "cylinder", role: "pin", radius: 0.025, length: 0.13, at: [SAW.pin[0], SAW.pin[1], 0.115] },
      ],
    },
  ],
  powered: ["pendulum"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.04 },
  target: "saw",
  view: { direction: [0.05, 0.08, 1] },
  pose(p) {
    const s = sawing(((p % 1) + 1) % 1);
    const h = hang(s.y);
    const cord = (side) => [[inner(side), s.y + CARRIAGE.eye, 0], ...arcOver(side), [outer(side), h.weightTop, 0]];
    const sawZ = (SAW.z[0] + SAW.z[1]) / 2;
    return {
      paths: {
        cordL: { points: cord(0), closed: false },
        cordR: { points: cord(1), closed: false },
      },
      parts: {
        sheaveL: { angle: -h.drop / PITCH_R },
        sheaveR: { angle: h.drop / PITCH_R },
        weightL: { position: [outer(0), h.weightTop - 0.2, 0] },
        weightR: { position: [outer(1), h.weightTop - 0.2, 0] },
        pendulum: { angle: s.angle },
        carriage: { position: [CX, s.y, 0] },
        saw: { position: [s.x, s.y, sawZ] },
        rod: { from: [s.hole[0], s.hole[1], LINK_Z], to: [s.x + SAW.pin[0], s.y + SAW.pin[1], LINK_Z] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["log", "saw"], reason: "鋸片鋸進木頭是這個機構的作用:鋸片與木頭重疊是鋸口(木頭上的鋸縫沒有畫出來)" },
  ],
};
