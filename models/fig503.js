// 第 503 種:一種非常簡單的周轉輪系。F、G 是固定在中央軸 A 上的臂,傘齒輪 C、D 鬆套在中央軸上;臂做成傘齒輪 B 的軸,B 在上面
// 自由轉動。可以把運動加在 C、D 兩個輪上,產生臂的合成運動;或者把運動加在臂與其中一個輪上,產生另一個輪的合成運動。
// 主動件是傘齒輪 C;狀態按鈕選擇 D 怎麼轉(固定、與 C 反向同速、與 C 同向同速)。
// 推斷:C、D 一樣大,所以臂(軸 A)的轉角 = (C + D) / 2;軸 A 直立,C 在下、D 在上,B 在右邊的臂上。
// D 的三種轉法由實體做出來(推斷,照第 502 種補的副軸與夾塊;換接法是操作的人做的,所以用狀態按鈕):
// - D 固定:D 的轂往上接一段套筒,夾塊(套在套筒上的環)把套筒鎖在上方的軸承座上。
// - 與 C 反向同速:B 的對面裝一個傘齒輪惰輪,軸固定在機架的支柱上,同時咬 C、D(D = −C,臂不轉)。
// - 與 C 同向同速:一根銷穿過 C、D 的錐頂面,把 D 鎖在 C 上(C、D、臂與 B 一起轉)。
// 機架(推斷):底板、下方軸承座,左邊立一根支柱、頂上一根橫樑接到上方軸承座(照第 506 種的ㄈ形支架);惰輪的軸也固定在這根支柱上。
import { Y } from "./kit.js";
import { armOf } from "./epicyclic.js";
import { planetRotation, planetSpin } from "./bevel-train.js";
import { shape, thickLine } from "./shapes.js";

const R = 0.85; // C、D
const RB = 0.5; // B 與惰輪
const H = 0.25;
const Y_C = -R * 0.55; // C 的中心(D 在 +R·0.55)
export const E_CD = -1; // C → D 的輪系值(以臂為參考)
const D_RATE = { fixed: 0, opposite: -1, same: 1 };
const POST_X = -1.45; // 支柱
const BEARING_LOW = 1.495; // 上方軸承座的底
const SLEEVE_R = 0.15; // D 的套筒
const PIN_AT = [-0.3, 0, 0]; // 鎖住 C、D 的銷(C 轉 0 時;在錐頂面上,離軸 0.3,小於錐頂面的半徑 0.47)

/** C 轉 c、狀態 → D 與臂(軸 A)的轉角 */
export function differential(c, state = "fixed") {
  const d = D_RATE[state] * c;
  return { c, d, arm: armOf(c, d, E_CD) };
}

const rotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];

export default {
  figure: 503,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [3.2, 0.15, 1.2], at: [0, -1.75, 0] },
        { kind: "box", size: [0.3, 0.25, 0.3], at: [0, 1.62, 0] },
        { kind: "box", size: [0.3, 0.25, 0.3], at: [0, -1.55, 0] },
        // 推斷:左邊的支柱(立在底板上)與頂上接到上方軸承座的橫樑
        { kind: "box", size: [0.2, 1.745 + 1.675, 0.3], at: [POST_X, (1.745 - 1.675) / 2, 0] },
        { kind: "box", size: [-POST_X - 0.15 + 0.1, 0.25, 0.3], at: [(POST_X - 0.1 - 0.15) / 2, 1.62, 0] },
      ],
    },
    {
      id: "shaftA",
      kind: "group",
      axis: Y,
      label: "A",
      labelOffset: [-0.3, 1.45, 0.3],
      spin: 0.35,
      pieces: [
        { kind: "cylinder", radius: 0.09, length: 3.3 },
        { kind: "box", size: [0.05, 0.05, 0.6], at: [0.09, 0, 1.2], accent: true }, // 軸上的鍵條(記號)
        // 臂 F、G:從軸伸到 B 的軸
        { kind: "plate", shape: shape(thickLine([[0, 0.12], [R * 0.9 + 0.35, 0.12]], 0.12)), thickness: 0.08, rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2] },
      ],
    },
    { id: "labelF", kind: "group", pieces: [], label: "F", labelOffset: [0.35, 0.3, 0.3] },
    { id: "labelG", kind: "group", pieces: [], label: "G", labelOffset: [R + 0.55, 0.0, 0.3] },
    { id: "wheelC", kind: "bevel", center: [0, Y_C, 0], axis: [0, 1, 0], radius: R, height: H, label: "C", labelOffset: [-R - 0.2, -0.3, 0.3] },
    // D 與往上接到軸承座下方的套筒(推斷;D 固定時由夾塊鎖住)
    {
      id: "wheelD",
      kind: "group",
      center: [0, -Y_C, 0],
      axis: Y,
      label: "D",
      labelOffset: [-R - 0.2, 0.3, 0.3],
      spin: R + 0.05,
      pieces: [
        { kind: "bevel", radius: R, height: H, axis: [0, 0, -1] },
        { kind: "cylinder", radius: SLEEVE_R, inner: 0.09, length: BEARING_LOW + Y_C - H / 2, at: [0, 0, (BEARING_LOW + Y_C + H / 2) / 2] },
      ],
    },
    // D 固定時的夾塊(推斷):套在 D 的套筒上的環,頂著上方軸承座的底
    { id: "clampD", kind: "cylinder", axis: Y, radius: 0.24, inner: SLEEVE_R, length: 0.15, center: [0, BEARING_LOW - 0.075, 0] },
    { id: "wheelB", kind: "bevel", center: [R * 0.9, 0, 0], axis: [-1, 0, 0], radius: RB, height: H, label: "B", labelOffset: [0.4, 0.55, 0.3], arrow: false },
    // 與 C 反向同速時的惰輪(推斷):在 B 的對面,同時咬 C、D;軸固定在支柱上
    { id: "wheelI", kind: "bevel", center: [-R * 0.9, 0, 0], axis: [1, 0, 0], radius: RB, height: H, arrow: false },
    { id: "idlerAxle", kind: "cylinder", axis: [1, 0, 0], radius: 0.06, length: -(POST_X + 0.1) - (R * 0.9 - 0.18), center: [(POST_X + 0.1 - (R * 0.9 - 0.18)) / 2, 0, 0] },
    // 與 C 同向同速時把 D 鎖在 C 上的銷(推斷):從 C 的錐頂面穿到 D 的錐頂面
    { id: "pinCD", kind: "cylinder", axis: Y, radius: 0.05, length: 2 * (-Y_C - H / 2), center: PIN_AT },
  ],
  states: {
    initial: "fixed",
    options: [
      { id: "fixed", label: "D 固定(夾塊鎖住)" },
      { id: "opposite", label: "D 與 C 反向同速(惰輪)" },
      { id: "same", label: "D 與 C 同向同速(銷鎖住)" },
    ],
  },
  driver: { part: "wheelC", type: "rotation", speed: 0.5 },
  target: "shaftA", // 得到合成運動的臂(軸 A)
  view: { direction: [0.3, 0.35, 1] },
  pose(c, state = "fixed") {
    const t = differential(c, state);
    // B 在 C、D 上滾:接觸處 B 的表面要跟 C、D 同向。B 的軸朝 −X(朝軸 A),C 相對臂轉 (c − arm) 時,B 繞自己的軸轉 −(c − arm)·R/RB
    const spin = -planetSpin(t.c - t.arm, R, RB);
    return {
      parts: {
        wheelC: { angle: t.c },
        wheelD: { angle: t.d },
        shaftA: { angle: t.arm },
        wheelB: { position: rotY([R * 0.9, 0, 0], t.arm), rotation: planetRotation(Y, t.arm, [-1, 0, 0], spin) },
        clampD: { visible: state === "fixed" },
        // 惰輪:B 轉到對面(臂轉 π)的姿勢,臂不轉、只自轉
        wheelI: { rotation: planetRotation(Y, Math.PI, [-1, 0, 0], -planetSpin(t.c, R, RB)), visible: state === "opposite" },
        idlerAxle: { visible: state === "opposite" },
        pinCD: { position: rotY(PIN_AT, t.c), visible: state === "same" },
      },
      readouts: [{ label: "臂(軸 A)的轉速 / C", value: differential(1, state).arm.toFixed(2) }],
    };
  },
};
