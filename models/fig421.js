// 第 421 種:船用筒狀引擎。活塞上連著一根筒管(trunk),連桿的下端直接接在活塞上(在筒管裡);筒管穿過汽缸蓋上的填料函。
// 活塞上側的有效面積因筒管而大為減少;為了讓活塞兩側的動力相等,高壓蒸汽先作用在活塞上側,
// 之後再排進汽缸下方的部分,在那裡膨脹做功。
// 主動件是曲柄(飛輪,原圖以虛線畫出)。
// 推斷:下行時新蒸汽進上側、下側排汽;上行時上側的蒸汽經旁邊的轉汽管流進下側膨脹。汽缸與筒管畫成剖面(剖掉前半),
// 三條汽管走在留下的後半、接到汽缸後半的外壁(原圖沒有畫汽管);連桿放在筒管的中心面上,全程在筒管裡擺。
// 筒管的粗細照原圖(外徑約汽缸內徑的 0.6)與原文「有效面積大幅減少」。
import { TAU, Y } from "./kit.js";
import { crankSlider, cylinderParts, WALL } from "./vertical-engine.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, circle, rect } from "./shapes.js";

const CRANK = [0, 2.0, 0];
const R = 0.5;
const ROD = 2.6;
export const CYL = { x: 0, top: 0.25, length: 1.6, radius: 1.0 };
export const TRUNK = 0.6; // 筒管外半徑(原圖筒管外徑約汽缸內徑的 0.6)
export const TRUNK_WALL = 0.06; // 筒管壁厚
export const TRUNK_LEN = 1.75; // 筒管高(從活塞頂面起)
/** 活塞上側、下側的有效面積(上側被筒管佔去) */
export const AREA = { upper: Math.PI * (CYL.radius ** 2 - TRUNK ** 2), lower: Math.PI * CYL.radius ** 2 };

export const piston = (theta) => crankSlider(CRANK, R, ROD, theta);
/** 曲柄轉 theta → 活塞是否往下走 */
export const downward = (theta) => {
  const t = ((theta % TAU) + TAU) % TAU;
  return t > Math.PI / 2 && t < (3 * Math.PI) / 2;
};

const bottom = CYL.top - CYL.length;
// 汽管的深度:汽缸剖掉前半(z > 0),汽管走在後半;支管的端頭落在汽缸外壁上(外壁在這個深度的 x)
const PIPE_Z = -0.3;
const OUTER = CYL.radius + WALL;
const WALL_X = Math.sqrt(OUTER * OUTER - PIPE_Z * PIPE_Z);
const PIPE = 0.14;
const BRANCH = 0.12;
const BASE_TOP = bottom - WALL; // 底座頂面(汽缸下蓋的底面落在這裡)
// 汽缸本體(剖掉前半的旋轉體)和座、填料函、汽管同屬一個固定件
const [cylinder, ...cylinderRest] = cylinderParts({ ...CYL, rodHole: TRUNK + 0.02 });
const { id: _cylinderId, center: cylinderAt, ...cylinderPiece } = cylinder;
const inlet = [[-1.9, CYL.top + 0.8, PIPE_Z], [-1.9, CYL.top - 0.15, PIPE_Z], [-WALL_X, CYL.top - 0.15, PIPE_Z]];
const transfer = [[WALL_X, CYL.top - 0.15, PIPE_Z], [1.55, CYL.top - 0.15, PIPE_Z], [1.55, bottom + 0.15, PIPE_Z], [WALL_X, bottom + 0.15, PIPE_Z]];
const exhaust = [[-WALL_X, bottom + 0.15, PIPE_Z], [-1.3, bottom + 0.15, PIPE_Z], [-1.3, BASE_TOP, PIPE_Z]];
/** 接到汽缸外壁的水平支管:從 x = from 到外壁(外壁那一端不伸進汽缸) */
const branch = (from, y) => ({ kind: "box", role: "branch", size: [Math.abs(from) - WALL_X, BRANCH, BRANCH], at: [Math.sign(from) * (Math.abs(from) + WALL_X) / 2, y, PIPE_Z] });

export default {
  figure: 421,
  parts: [
    ...cylinderRest,
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 汽缸本體、汽缸座、汽缸蓋上的填料函
        { ...cylinderPiece, at: cylinderAt },
        { kind: "box", role: "base", size: [2.8, 0.25, 1.4], at: [0, BASE_TOP - 0.125, 0] },
        { kind: "lathe", axis: Y, profile: [[TRUNK + 0.02, 0], [TRUNK + 0.2, 0], [TRUNK + 0.2, 0.35], [TRUNK + 0.02, 0.35]], at: [0, CYL.top + 0.12, 0], ...backHalf(Y) },
        // 進汽管(從上方來)、轉汽管(上側→下側)、排汽管(落到底座),都在汽缸後半
        { kind: "box", role: "pipe", size: [PIPE, 1.0, PIPE], at: [-1.9, CYL.top + 0.3, PIPE_Z] },
        branch(-1.9, CYL.top - 0.15),
        branch(1.55, CYL.top - 0.15),
        { kind: "box", role: "pipe", size: [PIPE, CYL.length - 0.3, PIPE], at: [1.55, CYL.top - CYL.length / 2, PIPE_Z] },
        branch(1.55, bottom + 0.15),
        branch(-1.3, bottom + 0.15),
        { kind: "box", role: "pipe", size: [PIPE, bottom + 0.15 - BASE_TOP + 0.1, PIPE], at: [-1.3, (bottom + 0.15 + BASE_TOP - 0.1) / 2, PIPE_Z] },
      ],
    },
    { id: "trunk", kind: "lathe", axis: Y, profile: [[TRUNK - TRUNK_WALL, 0], [TRUNK, 0], [TRUNK, TRUNK_LEN], [TRUNK - TRUNK_WALL, TRUNK_LEN]], ...backHalf(Y) },
    {
      id: "flywheel",
      kind: "group",
      center: CRANK,
      spin: 1.4,
      pieces: [
        // 飛輪在筒管後面(原圖以虛線畫在後方);軸從飛輪伸到曲柄臂,止於連桿的背面
        { kind: "plate", shape: shape(circle(1.3), [circle(1.18).reverse()]), thickness: 0.12, at: [0, 0, -0.8] },
        ...[0, 1, 2].map((i) => ({ kind: "box", size: [2.4, 0.08, 0.06], at: [0, 0, -0.8], angle: (i * Math.PI) / 3 })),
        { kind: "cylinder", radius: 0.12, length: 0.8, at: [0, 0, -0.46] },
        { kind: "plate", shape: shape(rect(R + 0.2, 0.18, R / 2, 0)), thickness: 0.08, at: [0, 0, -0.1] },
        { kind: "cylinder", radius: 0.07, length: 0.39, at: [R, 0, 0.055], accent: true },
      ],
    },
    { id: "rod", kind: "link", width: 0.14, thickness: 0.08 },
  ],
  driver: { part: "flywheel", type: "rotation" },
  target: "piston",
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const { pin, y } = piston(theta);
    const down = downward(theta);
    const top = y + 0.11;
    const low = y - 0.11;
    const travel = theta * 1.5;
    const flows = down
      ? [
          { fluid: "steam", points: stream(inlet, travel, { spacing: 0.2 }) },
          { fluid: "steam", points: stream(exhaust, travel, { spacing: 0.2 }) },
        ]
      : [{ fluid: "steam", points: stream(transfer, travel, { spacing: 0.2 }) }];
    return {
      parts: {
        flywheel: { angle: theta },
        rod: { from: [pin[0], pin[1], 0], to: [0, y, 0] },
        piston: { position: [0, y, 0] },
        trunk: { position: [0, top, 0] },
        steamUp: { position: [0, top + CYL.length / 2, 0], level: Math.max(0, CYL.top - top) / CYL.length },
        steamDown: { position: [0, bottom + CYL.length / 2, 0], level: down ? 0 : Math.max(0, low - bottom) / CYL.length },
      },
      flows,
      readouts: [
        { label: "活塞", value: down ? "下行:高壓蒸汽推上側,下側排汽" : "上行:上側的蒸汽轉進下側膨脹" },
        { label: "上側 / 下側有效面積", value: (AREA.upper / AREA.lower).toFixed(2) },
      ],
    };
  },
  waivers: [
    { check: "interference", parts: ["piston", "rod"], reason: "接合處的簡化畫法:連桿的下端鉸接在活塞裡的銷上(筒形活塞),桿端伸進活塞 0.12" },
  ],
};
