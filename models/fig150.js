// 第 150 種:使蒸汽膨脹作動的閥門運動。軸上一串偏心量(擺動幅度)不同的凸輪,可沿軸滑動,
// 讓其中任一個作用在連接閥桿的槓桿上;作用的凸輪偏心量越大,閥門的動作越大。
// 槓桿右端是樞軸,左端的滾子靠在凸輪上,閥桿吊在槓桿中段。狀態切換讓哪一個凸輪在槓桿下面。主動件是軸。
// 結構推斷:原圖凸輪軸、槓桿樞軸都得架在機架上,閥桿以銷吊在槓桿上、往下穿過導座。原本的模型滾子高度的相位
// 與凸輪偏心方向差了 90°(滾子會陷進凸輪、又離開凸輪,看起來槓桿與凸輪沒碰到),這裡改成滾子中心離偏心圓心
// 恆為「凸輪半徑 + 滾子半徑」(數值驗證過),行程仍是兩倍偏心量;並補上底板、凸輪軸後方的軸承座(軸可以在其中
// 滑動換凸輪)、樞軸立柱與樞軸銷、閥桿頂端的銷與 U 形導座,讓凸輪→滾子→槓桿→銷→閥桿的傳力路徑看得見。
import { shape, circle, stadium, arcPoints } from "./shapes.js";
import { solve } from "./linkage.js";

const RC = 0.95; // 凸輪半徑(相同)
const ECC = { small: 0.12, middle: 0.25, large: 0.38 }; // 各凸輪的偏心量
const ORDER = ["large", "middle", "small"];
const SPACING = 0.32; // 凸輪沿軸的間距
const ROLLER = 0.3;
const PIVOT = [3.3, 0.75, 0];
const ROD_AT = 1.3; // 閥桿離樞軸的距離

// 偏心圓凸輪下,滾子中心(在軸的正上方)的高度:凸輪的圓心在局部 (0, e),軸轉 theta 後在 (−e sinθ, e cosθ),
// 滾子中心離它恆為 RC + ROLLER
const rollerY = (theta, e) => e * Math.cos(theta) + Math.sqrt((RC + ROLLER) ** 2 - (e * Math.sin(theta)) ** 2);
const ARM = Math.hypot(PIVOT[0], PIVOT[1] - rollerY(0, ECC.middle));

/** 軸轉 theta、選用 state 的凸輪:槓桿的轉角(從樞軸指向滾子的方向)與閥桿的高度 */
export function valve(theta, state) {
  const e = ECC[state];
  const c = [-e * Math.sin(theta), e * Math.cos(theta)]; // 偏心圓的圓心
  // 滾子中心在以樞軸為圓心、半徑 ARM 的弧上(不完全在軸的正上方),取離圓心恰為 RC + ROLLER 的那一點
  const gap = (psi) => Math.hypot(PIVOT[0] + ARM * Math.cos(psi) - c[0], PIVOT[1] + ARM * Math.sin(psi) - c[1]);
  const psi = solve(gap, RC + ROLLER, Math.PI - 0.6, Math.PI + 0.05);
  const y = PIVOT[1] + ARM * Math.sin(psi);
  return { y, psi, rod: PIVOT[1] + (ROD_AT / ARM) * (y - PIVOT[1]) };
}
export const eccentricity = ECC;
/** 槓桿轉 psi 時滾子中心的位置 */
const rollerAt = (psi) => [PIVOT[0] + ARM * Math.cos(psi), PIVOT[1] + ARM * Math.sin(psi), PIVOT[2] + 0.08];

const STACK_Z = (state) => -ORDER.indexOf(state) * SPACING; // 讓選用的凸輪落在 z = 0(槓桿所在的平面)

// 機架:底板、凸輪軸的軸承座(在凸輪組後方,軸在其中滑動)、樞軸立柱、閥桿導座
const FLOOR_TOP = -1.75;
const SEAT_Z = -1.1; // 軸承座的位置:三個狀態下軸都穿過它
const SHAFT_SEAT = shape([[-0.6, FLOOR_TOP], [0.6, FLOOR_TOP], ...arcPoints(0.6, -0.3, Math.PI + 0.3)], [circle(0.44).reverse()]);
const GUIDE = [PIVOT[0] - ROD_AT, -1.0]; // 導座的位置(閥桿最高時桿底仍在導座裡)

export default {
  figure: 150,
  parts: [
    {
      id: "shaft",
      kind: "group",
      posed: true,
      spin: RC + 0.4,
      pieces: [
        ...ORDER.map((k, i) => ({ kind: "plate", shape: shape(circle(RC, 0, ECC[k]), []), thickness: SPACING * 0.85, at: [0, 0, i * SPACING], ...(i === 0 ? { mark: [0, ECC[k] + RC - 0.25], markSize: 0.08 } : {}) })),
        { kind: "cylinder", radius: 0.42, length: 3.4, at: [0, 0, 0.2] }, // 軸:夠長,滑到任一狀態都仍在軸承座裡
      ],
    },
    {
      id: "lever",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(stadium(ARM, 0.24).outline, [circle(0.08).reverse()]), thickness: 0.1, at: [0, 0, 0.3] }, // 臂窄:不碰旁邊偏心量較大的凸輪
        { kind: "cylinder", radius: 0.1, length: 0.5, at: [ARM, 0, 0.15] }, // 滾子銷:穿過滾子與槓桿
        { kind: "cylinder", radius: 0.2, inner: 0.08, length: 0.2, at: [ROD_AT, 0, 0.35] },
      ],
    },
    { id: "roller", kind: "cylinder", radius: ROLLER, inner: 0.12, length: 0.2, mark: true, spin: ROLLER }, // 套在槓桿的滾子銷上,只壓在選用的那個凸輪上滾動
    {
      id: "rod",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.1, 2.4, 0.1], at: [0, -1.2, 0] },
        { kind: "cylinder", radius: 0.07, length: 0.4, at: [0, 0, -0.15] }, // 頂端的銷:穿過槓桿上的環與槓桿
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [6.0, 0.1, 2.3], at: [1.5, FLOOR_TOP - 0.05, -0.35] }, // 底板
        { kind: "plate", shape: SHAFT_SEAT, thickness: 0.3, at: [0, 0, SEAT_Z] }, // 凸輪軸的軸承座
        { kind: "box", size: [0.3, PIVOT[1] + 0.15 - FLOOR_TOP, 0.3], at: [PIVOT[0], (PIVOT[1] + 0.15 + FLOOR_TOP) / 2, 0] }, // 樞軸立柱(在槓桿後面)
        { kind: "cylinder", radius: 0.14, length: 0.7, at: [PIVOT[0], PIVOT[1], 0.2] }, // 樞軸銷
        // 閥桿的 U 形導座:兩側夾住桿、後板、立柱接到底板
        { kind: "box", size: [0.1, 0.3, 0.14], at: [GUIDE[0] - 0.11, GUIDE[1], 0.45] },
        { kind: "box", size: [0.1, 0.3, 0.14], at: [GUIDE[0] + 0.22, GUIDE[1], 0.45] },
        { kind: "box", size: [0.5, 0.3, 0.14], at: [GUIDE[0] + 0.06, GUIDE[1], 0.3] },
        { kind: "box", size: [0.2, GUIDE[1] - FLOOR_TOP, 0.2], at: [GUIDE[0], (GUIDE[1] + FLOOR_TOP) / 2, 0.27] },
      ],
    },
  ],
  driver: { part: "shaft", type: "rotation" },
  target: "rod",
  // 動力重演(用中間那個凸輪):只轉軸;槓桿繞樞軸自由擺、靠自重壓在凸輪上,滾子套在槓桿的銷上自由轉。
  // 閥桿照模型的姿勢跟著槓桿走
  replay: {
    free: {
      lever: { pivot: PIVOT },
      roller: { pivot: rollerAt(valve(0, "middle").psi), on: "lever" },
    },
    ignore: [["rod", "lever"], ["lever", "frame"]], // 樞軸銷穿過槓桿的孔(孔畫得比銷小)
    expect: [
      { at: Math.PI / 2, part: "lever", label: "凸輪轉四分之一圈,槓桿照偏心量升降", quote: "閥門會依作用於槓桿上的凸輪擺動幅度大小,而產生較大或較小的動作" },
      { at: Math.PI, part: "lever", label: "凸輪轉半圈,槓桿到最低" },
      { part: "lever", label: "轉完一圈,槓桿回到起點" },
    ],
  },
  states: {
    options: [
      { id: "large", label: "大幅度凸輪" },
      { id: "middle", label: "中幅度凸輪" },
      { id: "small", label: "小幅度凸輪" },
    ],
    initial: "middle",
  },
  view: { direction: [0.35, 0.15, 1] },
  pose(theta, state = "middle") {
    const { psi, rod } = valve(theta, state);
    return {
      parts: {
        shaft: { position: [0, 0, STACK_Z(state)], angle: theta },
        lever: { angle: psi },
        roller: { position: rollerAt(psi), angle: (-RC * theta) / ROLLER }, // 圓凸輪:經過接觸點的輪緣長 = 半徑 × 轉角
        rod: { position: [PIVOT[0] + ROD_AT * Math.cos(psi), rod, 0.45] }, // 閥桿的頂端跟著槓桿上的環走(略有左右擺動,導座留了間隙)
      },
      readouts: [],
    };
  },
};

