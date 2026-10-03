// 第 268 種:藉由曲柄與擺動桿,把圓周運動轉換為往復運動。長桿的右端鉸接在曲柄盤的曲柄銷上,
// 中段架在左邊的一個固定滾子上;曲柄轉動時,桿在滾子上來回滑動、同時擺動,左端往復(原圖虛線為其他位置)。
// 主動件是曲柄盤。滾子被滑過的桿帶著轉。
import { sub, add, scale, norm, dist } from "./kit.js";
import { crankPin } from "./linkage.js";

const DISC = { center: [2.3, -0.35, 0], radius: 0.78, crank: 0.52 };
const ROLLER = { center: [-0.9, -0.45, 0], radius: 0.28 };
const ROD = 4.6;
const REST = ROLLER.center[1] + ROLLER.radius + 0.05; // 桿架在滾子頂上(桿的中心線)

/** 曲柄轉 theta:曲柄銷、桿左端、桿在滾子上滑過的長度(銷到滾子的距離) */
export function rod(theta) {
  const pin = crankPin(DISC.center, DISC.crank, theta);
  const rest = [ROLLER.center[0], REST, 0];
  const dir = norm(sub(rest, pin));
  return { pin, end: add(pin, scale(dir, ROD)), reach: dist(pin, rest) };
}
const R0 = rod(0).reach;

export default {
  figure: 268,
  parts: [
    { id: "disc", kind: "pulley", style: "disc", center: DISC.center, radius: DISC.radius, width: 0.16, pieces: [{ kind: "cylinder", radius: 0.07, length: 0.4, at: [DISC.crank, 0, 0.15] }] },
    { id: "roller", kind: "pulley", style: "disc", center: [...ROLLER.center.slice(0, 2), 0.18], radius: ROLLER.radius, width: 0.14 },
    { id: "rod", kind: "link", width: 0.1, thickness: 0.06 },
  ],
  driver: { part: "disc", type: "rotation" },
  view: { direction: [0.04, 0.05, 1] },
  pose(theta) {
    const { pin, end, reach } = rod(theta);
    return {
      parts: {
        disc: { angle: theta },
        rod: { from: [pin[0], pin[1], 0.2], to: [end[0], end[1], 0.2] },
        roller: { angle: (reach - R0) / ROLLER.radius },
      },
      readouts: [],
    };
  },
};
