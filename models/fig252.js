// 第 252 種:滾子 A、B 要在溝槽 C 內以相同幅度來回移動。部件 D 有兩支斜向的開槽臂(下寬上窄),
// 兩滾子的銷各插在一支臂的槽裡;把 D 上下移動,斜槽把兩滾子同時往外推或往內拉,幅度相同、方向相反。
// 主動件是部件 D。
// 由前往後是 D 的開槽臂、滾子、溝槽桿 C:原圖溝槽桿的邊線穿過滾子的那一段畫成虛線(桿在滾子後面),
// 開槽臂的線畫在滾子上面(臂在滾子前面)。每個滾子的銷從後往前穿過溝槽 C、滾子與 D 的斜槽;
// 溝槽和 D 的斜槽都只有銷那麼寬,在溝槽裡滑的是銷,滾子是疊在溝槽桿前面、比整條溝槽桿還高的圓盤。
// 推斷:原文沒說滾子轉不轉,模型讓它跟著銷平移、不轉。D 的柄穿過下方的導套(原圖只畫到柄)。
import { deg, clamp } from "./kit.js";
import { shape, rect, thickLine } from "./shapes.js";

const SLANT = deg(27); // 臂與鉛直線的夾角
const T = Math.tan(SLANT);
export const ROLL = 0.4; // 滾子半徑
const PIN = 0.12; // 銷的半徑(原圖約滾子的 0.3 倍)
const RAIL = 0.2; // 溝槽兩條軌的寬
// 由後往前的三層(z 中心):溝槽桿 C、滾子、D 的開槽臂;相鄰兩層之間留 0.01
const Z_C = -0.3;
const T_C = 0.2;
const Z_ROLL = -0.1;
const T_ROLL = 0.18;
const Z_D = 0.1;
const T_D = 0.2;
const Y = 1.55; // 溝槽(滾子中心)的高度
const X0 = 0.62; // D 在中間位置時滾子離中線的距離
// D 往下的極限:兩滾子互相碰到(原圖畫的就是兩滾子相切的位置)就不能再往下,否則滾子互相穿透。
export const RANGE = [-(X0 - ROLL - 0.01) / T, 0.6];
const ARM_TOP = 2.25; // D 在中間位置時臂頂的高度:D 降到最低時,槽頂的橫檔仍在滾子的銷上方
const ARM_BOTTOM = -1.4;
const GUIDE_Y = ARM_BOTTOM - 1.55; // 柄的導套的高度(D 在整個行程裡,柄都穿在導套裡)

/** D 往上移 v → 滾子 A、B 的 x 座標 */
export function rollers(v) {
  const d = clamp(v, ...RANGE) * T;
  return { a: -X0 - d, b: X0 + d };
}

// 開槽臂:沿臂的兩條邊框(局部座標:D 在中間位置時的世界座標)
const armX = (y, s) => s * (X0 + (Y - y) * T);
const arm = (s) => {
  const top = [armX(ARM_TOP, s), ARM_TOP];
  const bottom = [armX(ARM_BOTTOM, s), ARM_BOTTOM];
  const off = (p, d) => [p[0] + d * Math.cos(SLANT), p[1] + s * d * Math.sin(SLANT)];
  return [
    // 槽的兩條邊框:內緣貼著滾子的銷(銷在槽裡滑,槽寬等於銷徑)
    { kind: "plate", shape: shape(thickLine([off(top, PIN + 0.07), off(bottom, PIN + 0.07)], 0.14)), thickness: T_D },
    { kind: "plate", shape: shape(thickLine([off(top, -PIN - 0.07), off(bottom, -PIN - 0.07)], 0.14)), thickness: T_D },
    { kind: "plate", shape: shape(thickLine([off(top, -PIN - 0.14), off(top, PIN + 0.14)], 0.14)), thickness: T_D },
  ];
};

const roller = (id, label, labelOffset) => ({
  id,
  kind: "plate",
  shape: shape([...Array(36).keys()].map((i) => [ROLL * Math.cos((i / 36) * 2 * Math.PI), ROLL * Math.sin((i / 36) * 2 * Math.PI)])),
  thickness: T_ROLL,
  label,
  labelOffset,
  // 銷:從溝槽桿 C 的背面穿過滾子,伸過 D 的斜槽
  pieces: [{ kind: "cylinder", radius: PIN, length: Z_D + T_D / 2 + 0.03 - (Z_C - T_C / 2 - 0.03), at: [0, 0, (Z_D + T_D / 2 + Z_C - T_C / 2) / 2 - Z_ROLL] }],
});

export default {
  figure: 252,
  parts: [
    {
      id: "guideC",
      kind: "group",
      label: "C",
      labelOffset: [-1.85, Y - 0.05, 0.4],
      pieces: [
        // 左邊的立架與往右伸出的溝槽(上下兩條軌,內緣貼著銷:溝槽只有銷那麼寬)
        { kind: "plate", shape: shape(rect(0.5, 1.9, -2.6, Y - 0.1)), thickness: 0.4, at: [0, 0, Z_C] },
        { kind: "plate", shape: shape(rect(4.6, RAIL, -0.05, Y + PIN + RAIL / 2)), thickness: T_C, at: [0, 0, Z_C] },
        { kind: "plate", shape: shape(rect(4.6, RAIL, -0.05, Y - PIN - RAIL / 2)), thickness: T_C, at: [0, 0, Z_C] },
        // D 的柄的導套(四片板圍住柄),由立架伸下來的支臂托著(推斷:原圖只畫到 D 的柄)
        ...[-1, 1].map((s) => ({ kind: "box", size: [0.06, 0.3, 0.26], at: [s * 0.1, GUIDE_Y, Z_D] })),
        ...[-1, 1].map((s) => ({ kind: "box", size: [0.26, 0.3, 0.06], at: [0, GUIDE_Y, Z_D + s * 0.1] })),
        // 支臂:深度範圍跨過導套的背面與支柱的正面,兩頭都接上
        { kind: "box", size: [2.95, 0.14, 0.2], at: [-1.6, GUIDE_Y, -0.1] },
        { kind: "box", size: [0.4, Y - 0.1 - 0.95 - GUIDE_Y + 0.1, 0.4], at: [-3.05, (GUIDE_Y + Y - 0.1 - 0.95) / 2 + 0.05, Z_C] }, // 立架左邊往下的支柱(D 的底條在它右邊)
      ],
    },
    roller("rollerA", "A", [0, 0.45, 0.4]),
    roller("rollerB", "B", [0, 0.45, 0.4]),
    {
      id: "partD",
      kind: "group",
      label: "D",
      labelOffset: [0, ARM_BOTTOM - 0.2, 0.4],
      pieces: [
        ...arm(-1),
        ...arm(1),
        { kind: "plate", shape: shape(rect(2 * armX(ARM_BOTTOM, 1) + 0.9, 0.3, 0, ARM_BOTTOM - 0.1)), thickness: T_D },
        // 柄座:照原圖疊在底條正面中央的方塊,柄從它往下伸
        { kind: "box", size: [0.45, 0.5, 0.3], at: [0, ARM_BOTTOM - 0.2, 0.08] },
        { kind: "box", size: [0.14, 1.7, 0.14], at: [0, ARM_BOTTOM - 1.25, 0] }, // 往下的柄,穿過下方的導套
      ],
    },
  ],
  driver: { part: "partD", type: "translation", direction: [0, 1, 0], range: RANGE, initial: 0 },
  targets: ["rollerA", "rollerB"], // 要被推開拉攏的兩個滾子
  view: { direction: [0.05, 0.05, 1] },
  pose(v) {
    const { a, b } = rollers(v);
    return {
      parts: {
        partD: { position: [0, clamp(v, ...RANGE), Z_D] },
        rollerA: { position: [a, Y, Z_ROLL] },
        rollerB: { position: [b, Y, Z_ROLL] },
      },
      readouts: [],
    };
  },
};
