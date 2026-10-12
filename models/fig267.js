// 第 267 種:摩擦皮帶輪。輪緣裡面有四支以樞軸裝在軸轂上的偏心臂,彈簧把臂端壓在輪緣內面。
// 輪緣朝箭頭的反方向(逆時針)轉時,臂端卡住輪緣,把運動傳給軸;朝箭頭方向(順時針)轉時,
// 臂繞樞軸讓開、在輪緣內面上滑過,軸保持不動。
// 主動件是輪緣,來回轉動(累計行程,見 kit.swing):逆時針那一程帶著軸轉,順時針那一程軸不動。
//
// 結構(由前到後):彈簧 → 臂 → 軸轂(軸) → 輪緣的輪轂與輻條。
// - 軸轂是四個凸角的板,樞銷就在凸角裡(照原圖);臂以銷裝在凸角上,銷穿過軸轂與臂。
// - 原圖從軸轂四角直伸到輪緣、在輪緣前彎一下的四條細直線,是輪緣的輻條(維護者 2026-10-12 決定):
//   輻條在軸轂後面一層,接到鬆套在軸上的輪轂(藏在軸轂後面),輪緣因此有了支撐。
// - 彈簧在臂的前面一層:一端套在軸轂伸出的座柱上,一端套在臂上伸出的柱上,把臂往外推。
// - 臂端靠著輪緣的角度由接觸算(臂繞樞軸往外擺,停在碰到輪緣內面的那一點),兩程都一樣:
//   臂是剛體,往順時針讓開一點點就離開輪緣(讓開 1° 就差 0.01 以上),實物的讓開只是彈性的微量,
//   彈簧隨即把臂端壓回輪緣。所以兩程臂端都貼著輪緣,順時針那一程讀者看到的是輪緣的記號滑過不動的臂端;
//   「臂會繞其樞軸轉動」由測試驗:輪緣的摩擦把臂往哪邊帶、往那邊轉臂端是頂進輪緣(卡住)還是離開(讓開)。
// 偏離插圖:原圖的雙線弧形臂從樞軸往逆時針彎出;照那個彎向,朝箭頭方向轉時臂端反而被往外推而卡緊,
// 和原文相反。模型把臂鏡像成往順時針彎出(原文優先於插圖外形)。
// 推斷:臂的形狀、彈簧與座柱的位置;輪緣來回轉動的幅度;輪緣輪轂的大小;軸後面的軸承座。
import { TAU, deg, swingPhase, rot2 } from "./kit.js";
import { shape, circle, thickLine, polarOutline } from "./shapes.js";
import { swingUntilContact } from "./contact.js";
import { pedestal } from "./supports.js";

export const SWING = deg(70);
const RIM = { outer: 2.05, inner: 1.82, thickness: 0.5 };
const ARMS = 4;
const PIVOT = 0.62; // 樞軸離軸心的距離
const PIN = 0.06; // 樞銷半徑
// 各層的 z(中心、厚度):輪緣 −0.25…0.25 把後面三層都包在裡面
const LAYER = {
  spring: 0.17, // 彈簧(線圈 0.105…0.235)
  arm: { z: 0.02, t: 0.14 }, // 臂 −0.05…0.09
  hub: { z: -0.11, t: 0.1 }, // 軸轂 −0.16…−0.06
  spoke: { z: -0.21, t: 0.06 }, // 輪緣的輪轂與輻條 −0.24…−0.18
};
const SHAFT = 0.16;
const POST = 0.035; // 彈簧座柱、臂上柱的半徑
const POST_TOP = LAYER.spring + 0.07; // 柱伸到彈簧那一層的前面

/** 主動量 v(累計行程)→ 輪緣轉角、軸的轉角 */
export function friction(v) {
  const { at, cycle, forward } = swingPhase(v, 0, SWING);
  // 逆時針那一程(forward)軸跟著輪緣;順時針那一程軸停在這一程開始時的位置
  const shaft = cycle * SWING + (forward ? at : SWING);
  return { rim: at, shaft };
}

// 偏心臂:從樞軸往順時針彎出去,臂端到輪緣內面(局部座標以樞軸為原點、樞軸在軸心的 +X 方向)
const armLine = Array.from({ length: 9 }, (_, i) => {
  const t = i / 8;
  const a = -t * deg(80);
  const r = PIVOT + t * (RIM.inner - 0.07 - PIVOT);
  return [r * Math.cos(a) - PIVOT, r * Math.sin(a)];
});
const armOutline = thickLine(armLine, 0.14);
const ARM_POST = armLine[3]; // 臂上接彈簧的柱

// 臂端靠著輪緣的角度:臂繞樞軸往外(逆時針)擺,停在碰到輪緣內面的那一點(輪緣取臂端附近那一段的細分多邊形)
const fineArc = (r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => rot2([r, 0], a0 + ((a1 - a0) * i) / n));
const rimSector = [...fineArc(RIM.inner, deg(-150), deg(30), 720), ...fineArc(RIM.outer, deg(30), deg(-150), 90)];
const ARM_SET = swingUntilContact({ pivot: [PIVOT, 0], outline: armOutline, from: -deg(8), into: 1, sweep: deg(16), steps: 64 }, [rimSector]);

// 軸轂:四個凸角的板,凸角伸到樞軸外,包住樞銷
const hubRadius = (a) => 0.5 + 0.27 * Math.pow((1 + Math.cos(ARMS * a)) / 2, 3);
// 彈簧座柱:在軸轂上、樞軸往順時針 45° 處(第 0 支臂的局部座標)
const SEAT = rot2([0.42, 0], -deg(45));

// 輻條:從輪轂直伸到輪緣前,往順時針彎一下接進輪緣(照原圖)
const spoke = (a) => thickLine([[0.3, 0], [1.6, 0], [1.86, -0.13]].map((p) => rot2(p, a)), 0.07);

const cyl = (radius, x, y, z0, z1) => ({ kind: "cylinder", radius, length: z1 - z0, at: [x, y, (z0 + z1) / 2] });
const hubZ = LAYER.hub.z;
const armZ = LAYER.arm.z;

export const geometry = { RIM, PIVOT, LAYER, ARM_SET };

export default {
  figure: 267,
  parts: [
    {
      id: "rim",
      kind: "plate",
      shape: shape(circle(RIM.outer), [circle(RIM.inner).reverse()]),
      thickness: RIM.thickness,
      mark: [RIM.outer - 0.11, 0],
      markSize: 0.09,
      spin: RIM.outer,
      pieces: [
        { kind: "plate", shape: shape(circle(0.42), [circle(SHAFT + 0.005).reverse()]), thickness: LAYER.spoke.t, at: [0, 0, LAYER.spoke.z] }, // 鬆套在軸上的輪轂
        ...Array.from({ length: ARMS }, (_, i) => ({ kind: "plate", shape: shape(spoke((i * TAU) / ARMS)), thickness: LAYER.spoke.t, at: [0, 0, LAYER.spoke.z] })),
      ],
    },
    {
      id: "shaft",
      kind: "plate",
      shape: shape(polarOutline(hubRadius, 240)),
      thickness: LAYER.hub.t,
      mark: [0.4, 0.14],
      markSize: 0.06,
      spin: 0.7,
      pieces: [
        cyl(SHAFT, 0, 0, -0.85 - hubZ, 0.2 - hubZ), // 軸:往後穿過輪緣的輪轂伸進軸承座
        cyl(0.3, 0, 0, 0, 0.12 - hubZ), // 軸轂正面的圓凸台
        ...Array.from({ length: ARMS }, (_, i) => {
          const [x, y] = rot2(SEAT, (i * TAU) / ARMS);
          return cyl(POST, x, y, 0, POST_TOP - hubZ); // 彈簧座柱
        }),
      ],
    },
    { id: "frame", kind: "group", pieces: pedestal({ at: [0, 0], z: -0.7, bore: SHAFT, floor: -2.4 }) },
    ...Array.from({ length: ARMS }, (_, i) => ({
      id: `arm${i}`,
      kind: "plate",
      shape: shape(armOutline),
      thickness: LAYER.arm.t,
      arrow: false,
      pieces: [
        cyl(PIN, 0, 0, hubZ - LAYER.hub.t / 2 - armZ, LAYER.arm.t / 2 + 0.03), // 樞銷:穿過軸轂的凸角與臂
        cyl(POST, ARM_POST[0], ARM_POST[1], 0, POST_TOP - armZ), // 接彈簧的柱
      ],
    })),
    ...Array.from({ length: ARMS }, (_, i) => ({ id: `spring${i}`, kind: "spring", coils: 5, radius: 0.05, wire: 0.015 })),
  ],
  driver: { part: "rim", type: "rotation", cycle: [0, SWING] },
  target: "shaft", // 只在一個轉向被帶動的軸
  view: { direction: [0.05, 0.05, 1] },
  pose(v) {
    const { rim, shaft } = friction(v);
    const parts = { rim: { angle: rim }, shaft: { position: [0, 0, hubZ], angle: shaft } };
    for (let i = 0; i < ARMS; i++) {
      const base = shaft + (i * TAU) / ARMS;
      const [px, py] = rot2([PIVOT, 0], base);
      const turn = base + ARM_SET;
      parts[`arm${i}`] = { position: [px, py, armZ], angle: turn };
      const [sx, sy] = rot2(SEAT, base);
      const [ax, ay] = rot2(ARM_POST, turn);
      parts[`spring${i}`] = { from: [sx, sy, LAYER.spring], to: [px + ax, py + ay, LAYER.spring] };
    }
    return { parts, readouts: [] };
  },
};
