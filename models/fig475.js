// 第 475 種:艙底水排出器(Brear 的專利),排出船內的艙底水,或在各種情況下抬水、送水。D 是一個腔室,接著吸水管 B 與排水管 C,
// 一側有一根伸進來的蒸汽管,噴嘴朝向排水管。蒸汽從 A 射進來,把 D 與 C 裡的空氣排出,在 B 裡造成真空,
// 水便經 B 上升,以規律而穩定的水流通過 D 與 C。也可以用壓縮空氣代替蒸汽。
// 主動件是虛擬的「進程」(蒸汽持續噴入)。剖面圖。
// 推斷:腔室畫成上下收窄的鼓形;蒸汽管從右側進來後往上彎,噴嘴在腔室中央、正對排水管。
// 蒸汽管 A 照原圖畫成剖開的管(兩道壁加背面;2026-10-20 改,原本是實心條),穿過腔室壁的地方是孔(沒畫,管壁直接穿過)。
import { Y } from "./kit.js";
import { backHalf } from "./section.js";
import { pipeWalls } from "./pump.js";
import { ejectorPose } from "./ejector.js";

const PIPE_R = 0.3;
const chamber = [[PIPE_R, -0.9], [0.5, -0.75], [0.75, -0.3], [0.8, 0.3], [0.55, 0.8], [PIPE_R, 1.0]];
const NOZZLE = [0.05, 0.35];
const STEAM_IN = [[1.9, -0.25], [0.6, -0.25], [0.25, -0.2], [0.08, 0.05], [NOZZLE[0], NOZZLE[1]]];
const PIPE_A = { w: 0.14, t: 0.05, depth: 0.2 }; // 蒸汽管的內寬、壁厚、深度(剖開後留下的後半)

export default {
  figure: 475,
  parts: [
    {
      id: "body",
      kind: "group",
      pieces: [
        // 腔室 D 與上下的管(剖開前半)
        { kind: "lathe", axis: Y, profile: [...chamber.map(([r, y]) => [r, y]), ...chamber.slice().reverse().map(([r, y]) => [r + 0.07, y])], ...backHalf(Y) },
        { kind: "lathe", axis: Y, profile: [[PIPE_R, -2.1], [PIPE_R + 0.07, -2.1], [PIPE_R + 0.07, -0.9], [PIPE_R, -0.9]], ...backHalf(Y) },
        // 蒸汽管 A:剖開的管(兩道壁 + 背面),管寬 PIPE_A.w、壁厚 PIPE_A.t
        ...pipeWalls(STEAM_IN, PIPE_A.w, PIPE_A.t, PIPE_A.depth, { back: true }).map((q, i) => (i < 2 ? { ...q, role: "steamPipe" } : q)),
      ],
    },
    // 排水管 C(水被蒸汽帶著從這裡送出):獨立成一個零件當目標件
    { id: "discharge", kind: "group", pieces: [{ kind: "lathe", axis: Y, profile: [[PIPE_R, 1.0], [PIPE_R + 0.07, 1.0], [PIPE_R + 0.07, 2.2], [PIPE_R, 2.2]], ...backHalf(Y) }] },
    { id: "labelA", kind: "group", pieces: [], label: "A", labelOffset: [1.3, -0.05, 0.4] },
    { id: "labelB", kind: "group", pieces: [], label: "B", labelOffset: [0.0, -1.6, 0.5] },
    { id: "labelC", kind: "group", pieces: [], label: "C", labelOffset: [0.0, 1.7, 0.5] },
    { id: "labelD", kind: "group", pieces: [], label: "D", labelOffset: [-0.45, 0.1, 0.6] },
  ],
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.15 },
  target: "discharge", // 只有蒸汽與水在動;標水被送出去的排水管 C
  view: { direction: [0.12, 0.05, 1] },
  pose(v) {
    const z = 0.2;
    return ejectorPose(v, {
      steam: [[...STEAM_IN.map(([x, y]) => [x, y, 0]), [0, 1.2, z], [0, 2.3, z]]], // 蒸汽在管裡走在兩道壁之間(z = 0)
      water: [-0.15, 0.15].map((x) => [[x, -2.2, z], [x, -0.9, z], [x * 2.5, 0, z], [x, 1.0, z], [x, 2.3, z]]),
    });
  },
};
