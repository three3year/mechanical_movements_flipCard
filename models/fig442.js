// 第 442 種:一種起源古老、至今仍在提洛爾的埃薩赫河上用來抽水的機器(戽水車)。水流使輪保持轉動,輪周的罐子
// 依序浸進水裡、裝滿,然後倒進水流上方的水槽。
// 主動件是虛擬的「進程」:水流已帶著輪轉了幾圈。
// 推斷(依原圖):罐子橫躺在輪緣上、軸線幾乎平行輪軸、口朝水槽那一側(+z,讀者這一側);軸線略向輪心傾斜(TILT),
// 所以罐子在輪的最低處整個浸在水裡、從口裝滿,升到上方時口比底低,水從口倒出,落進輪旁的水槽。
// 水槽在輪的側面、沿輪軸方向伸到岸上,槽底在輪頂之下、罐口之下(原圖:水槽在輪的左側、低於輪頂)。
// 輪軸固定不轉,輪套在軸上轉;軸的前端架在河裡立柱的橫樑上(原圖水槽下的橫樑與立柱),後端架在對岸的立柱上;
// 水槽的另一端由岸上的門架托著(原圖左邊的柱架)。輪逆時針轉(最低處隨水流往右)。
import { TAU, deg, polar, wrap, signedAngle, add, scale } from "./kit.js";
import { stream, ramp } from "./flow.js";

export const RIM = 2.1;
const POTS = 12;
export const RIVER = -1.45; // 水面
export const BED = -2.6; // 河底
const BANK = -1.1; // 兩岸的高度
const SPEED = TAU * 1.5;
const POT_R = RIM + 0.1; // 罐子中心離輪心的距離(罐身跨在輪緣上,壓進輪緣 0.1)
const TILT = deg(14); // 罐子的軸線向輪心傾斜的角度(推斷:讓罐子過頂時口低於底、倒得出水)
const MOUTH = 0.32; // 罐口離罐子中心(沿罐子的軸線,朝 +z)
const BUTT = -0.3; // 罐底離罐子中心
export const POUR = [deg(55), deg(110)]; // 倒水的角度範圍(罐子在輪上的角度)
/** 水槽:x、z 範圍與槽底(頂面)的高度;槽底在輪頂(RIM)之下、倒水的罐口之下 */
export const TROUGH = { x: [-1.2, 1.4], z: [0.45, 3.3], floor: 1.25 };
export const RIVER_PATH = [[-3.3, RIVER - 0.3, 1.0], [3.3, RIVER - 0.3, 1.0]]; // 河水往右(+x)流

/** 罐子在輪上的角度 a → 存量:在最低處浸水裝滿,滿著上升,在 POUR 的角度範圍倒進水槽 */
export function potLevel(a) {
  const from = (wrap(a + deg(120)) * 180) / Math.PI; // 從最低處前方(−120°)逆時針轉過的角度
  return ramp(from, 15, 50, 120 + (POUR[0] * 180) / Math.PI, 120 + (POUR[1] * 180) / Math.PI);
}

/** 罐子的軸線(單位向量):幾乎平行輪軸(+z 朝口),向輪心傾斜 TILT */
export const potAxis = (a) => [-Math.sin(TILT) * Math.cos(a), -Math.sin(TILT) * Math.sin(a), Math.cos(TILT)];
const potCenter = (a) => polar(POT_R, a, 0);
/** 罐口中心(世界座標) */
export const mouth = (a) => add(potCenter(a), scale(potAxis(a), MOUTH));
/** 罐底(世界座標) */
export const butt = (a) => add(potCenter(a), scale(potAxis(a), BUTT));
/** 倒出的水落到槽底的點:從罐口往水槽那一側(+z)拋出一小段 */
export function landing(a) {
  const m = mouth(a);
  return [m[0], TROUGH.floor + 0.08, m[2] + 0.25];
}

// 罐子的剖面 [r, z]:兩頭收尖的罐身、短頸、開口(有內壁,看得到裡面的水);z 沿罐子的軸線,口在 +z
const POT_PROFILE = [
  [0, BUTT], [0.13, -0.25], [0.2, -0.06], [0.18, 0.12], [0.12, 0.22], [0.12, MOUTH], // 外壁
  [0.095, MOUTH], [0.095, 0.22], [0.15, 0.12], [0.17, -0.06], [0.1, -0.24], [0, -0.27], // 內壁
];

const potAngle = (i) => (i * TAU) / POTS;

export default {
  figure: 442,
  parts: [
    {
      id: "wheel",
      kind: "pulley",
      style: "spoked",
      spokes: 8,
      center: [0, 0, 0],
      radius: RIM,
      width: 0.3,
      pieces: Array.from({ length: POTS }, (_, i) => {
        const a = potAngle(i);
        // 罐子跨在輪緣上,口朝 +z(水槽那一側),軸線向輪心斜 TILT
        return { kind: "lathe", profile: POT_PROFILE, axis: potAxis(a), at: potCenter(a) };
      }),
    },
    {
      id: "works",
      kind: "group",
      pieces: [
        // 河底與兩岸(推斷:兩岸高出水面,立柱站在岸上)
        { kind: "box", size: [7.0, 0.3, 5.8], at: [0, BED - 0.15, 0.8] },
        { kind: "box", size: [7.0, BANK - BED + 0.05, 1.1], at: [0, (BANK + BED) / 2 - 0.025, -1.55] },
        { kind: "box", size: [7.0, BANK - BED + 0.05, 1.1], at: [0, (BANK + BED) / 2 - 0.025, 3.15] },
        // 固定的輪軸:後端架在對岸(−z)的立柱上,前端穿過河裡立柱的橫樑(軸承座沒畫,軸埋在柱與樑裡)
        { kind: "cylinder", radius: 0.08, length: 3.3, at: [0, 0, 0.1] },
        { kind: "box", size: [0.22, 1.32, 0.22], at: [0, -0.46, -1.3] },
        { kind: "box", size: [0.2, 3.77, 0.2], at: [-0.9, -0.725, 1.6] }, // 河裡的立柱:從河底到水槽底
        { kind: "box", size: [1.1, 0.2, 0.2], at: [-0.45, 0, 1.6] }, // 立柱伸出的橫樑,托著輪軸的前端
        // 水槽:槽底、兩側的槽緣、靠輪那一端的矮緣;在輪的側面(z ≥ 0.45,罐口在 z ≈ 0.31 之前),槽底低於罐口
        { kind: "box", size: [TROUGH.x[1] - TROUGH.x[0], 0.12, TROUGH.z[1] - TROUGH.z[0]], at: [(TROUGH.x[0] + TROUGH.x[1]) / 2, TROUGH.floor - 0.06, (TROUGH.z[0] + TROUGH.z[1]) / 2] },
        { kind: "box", size: [0.06, 0.3, TROUGH.z[1] - TROUGH.z[0]], at: [TROUGH.x[0] + 0.03, TROUGH.floor + 0.15, (TROUGH.z[0] + TROUGH.z[1]) / 2] },
        { kind: "box", size: [0.06, 0.3, TROUGH.z[1] - TROUGH.z[0]], at: [TROUGH.x[1] - 0.03, TROUGH.floor + 0.15, (TROUGH.z[0] + TROUGH.z[1]) / 2] },
        { kind: "box", size: [TROUGH.x[1] - TROUGH.x[0], 0.15, 0.06], at: [(TROUGH.x[0] + TROUGH.x[1]) / 2, TROUGH.floor + 0.075, TROUGH.z[0] + 0.03] },
        // 岸上的門架托著水槽的另一端(原圖左邊的柱架)
        { kind: "box", size: [0.16, TROUGH.floor - 0.12 - BANK + 0.04, 0.16], at: [TROUGH.x[0] + 0.2, (TROUGH.floor - 0.12 + BANK) / 2 + 0.01, 3.05] },
        { kind: "box", size: [0.16, TROUGH.floor - 0.12 - BANK + 0.04, 0.16], at: [TROUGH.x[1] - 0.2, (TROUGH.floor - 0.12 + BANK) / 2 + 0.01, 3.05] },
        { kind: "box", size: [TROUGH.x[1] - TROUGH.x[0], 0.14, 0.18], at: [(TROUGH.x[0] + TROUGH.x[1]) / 2, TROUGH.floor - 0.12 - 0.065, 3.05] },
      ],
    },
    { id: "river", kind: "fill", fluid: "water", center: [0, (RIVER + BED) / 2, 0.8], size: [6.8, RIVER - BED, 3.6], level: 1 },
    // 水槽裡的水
    { id: "troughWater", kind: "fill", fluid: "water", center: [(TROUGH.x[0] + TROUGH.x[1]) / 2, TROUGH.floor + 0.05, (TROUGH.z[0] + TROUGH.z[1]) / 2 + 0.02], size: [TROUGH.x[1] - TROUGH.x[0] - 0.14, 0.1, TROUGH.z[1] - TROUGH.z[0] - 0.08], level: 1 },
    // 每個罐子裡的水(罐身裡的一塊,水面保持水平)
    ...Array.from({ length: POTS }, (_, i) => ({ id: `water${i}`, kind: "fill", fluid: "water", size: [0.18, 0.22, 0.3] })),
  ],
  powered: ["wheel"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.1 },
  target: "wheel",
  view: { direction: [1, 0.4, -0.6] }, // 從對岸斜後方看:輪在前、水槽在輪的側面往岸上去(原圖的構圖)
  pose(progress) {
    const wheel = TAU * progress; // 逆時針
    const parts = { wheel: { angle: wheel } };
    const travel = progress * SPEED;
    const pours = [];
    for (let i = 0; i < POTS; i++) {
      const a = wheel + potAngle(i);
      parts[`water${i}`] = { position: potCenter(a), level: potLevel(a) };
      // 正在倒水的罐子:水從口落進水槽,再沿水槽流向岸上
      const s = signedAngle(a);
      if (s >= POUR[0] && s <= POUR[1]) {
        const m = mouth(a);
        const land = landing(a);
        pours.push(...stream([m, [m[0], m[1] - 0.12, m[2] + 0.1], land, [land[0], land[1], TROUGH.z[1] - 0.1]], travel, { spacing: 0.18 }));
      }
    }
    return {
      parts,
      flows: [{ fluid: "water", points: [...pours, ...stream(RIVER_PATH, travel, { spacing: 0.3 })] }],
      readouts: [],
    };
  },
};
