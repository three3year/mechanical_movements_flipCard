// 第 137 種:法國蒸汽引擎中驅動滑閥的膨脹偏心輪。固定在曲柄軸上的三瓣形偏心輪夾在叉形振動臂的上下兩個滾子之間,
// 振動臂繞右端的樞軸擺動,閥桿接在下方滾子的底部。偏心輪的節曲線只含奇數次諧波,
// 對邊兩點的距離不變,所以兩個滾子永遠同時貼著它。主動件是曲柄軸。
// 臂的轉角由偏心輪推滾子決定(動力重演:臂是繞樞軸的自由零件,兩個滾子套在臂的銷上、貼著偏心輪滾動)。
// 曲柄軸往後伸進軸承座,臂的樞軸銷立在支柱上(軸承座、樞軸銷是推斷)。
import { deg, rot2 } from "./kit.js";
import { outlineForRoller, outlineArc } from "./cams.js";
import { pedestal } from "./supports.js";
import { shape, circle, arcPoints } from "./shapes.js";

const R0 = 1.05;
const ROLLER = 0.3;
export const pitchAt = (phi) => R0 + 0.17 * Math.cos(3 * phi) + 0.05 * Math.cos(phi);
const OUTLINE = outlineForRoller(pitchAt, ROLLER);
const ARC = outlineArc(OUTLINE);
/** 曲柄軸轉 theta:滾子轉過的角度(經過接觸點的偏心輪外形長度 ÷ 滾子半徑;接觸點在世界方向 at) */
export const rollerAngle = (theta, at) => -(ARC(at) - ARC(at - theta)) / ROLLER;
const PIVOT = [4.25, 0, 0.3];
const ARM = PIVOT[0]; // 樞軸到滾子連線的距離

/** 曲柄軸轉 theta:上滾子相對靜止位置的升高量與臂的轉角 */
export function arm(theta) {
  const lift = pitchAt(Math.PI / 2 - theta) - pitchAt(Math.PI / 2);
  return { lift, angle: -Math.asin(lift / ARM) };
}

// 叉形臂:C 形繞過偏心輪的右側,兩端在偏心輪正上方與正下方(裝滾子);中段往右伸到樞軸
const CX = 0.2;
const c = (r) => arcPoints(r, deg(118), deg(-118), CX, 0);
const C_SHAPE = shape([...c(1.72), ...c(1.42).reverse()]);
const BAR = shape([[1.55, -0.18], [ARM, -0.18], [ARM, 0.18], [1.55, 0.18]]);
const BRACKET = (y) => shape([[-0.18, y], [0.18, y], [CX + 1.42 * Math.cos(deg(118)) + 0.1, Math.sign(y) * 1.32], [CX + 1.72 * Math.cos(deg(118)), Math.sign(y) * 1.5]]);

export default {
  figure: 137,
  parts: [
    {
      id: "shaft",
      kind: "plate",
      shape: shape(OUTLINE, [circle(0.32).reverse()]),
      thickness: 0.3,
      spin: 1.3,
      mark: [0.7, 0],
      markSize: 0.08,
      pieces: [
        { kind: "cylinder", radius: 0.32, length: 0.6, mark: true },
        { kind: "cylinder", radius: 0.2, length: 0.8, at: [0, 0, -0.35] }, // 往後伸進軸承座
      ],
    },
    {
      id: "arm",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "plate", shape: shape(C_SHAPE.outline.map(([x, y]) => [x - PIVOT[0], y])), thickness: 0.14 },
        { kind: "plate", shape: shape(BAR.outline.map(([x, y]) => [x - PIVOT[0], y])), thickness: 0.14 },
        { kind: "plate", shape: shape(BRACKET(R0).outline.map(([x, y]) => [x - PIVOT[0], y])), thickness: 0.14 },
        { kind: "plate", shape: shape(BRACKET(-R0).outline.map(([x, y]) => [x - PIVOT[0], y])), thickness: 0.14 },
        { kind: "cylinder", radius: 0.1, length: 0.42, at: [-PIVOT[0], R0, -0.2] }, // 滾子的銷
        { kind: "cylinder", radius: 0.1, length: 0.42, at: [-PIVOT[0], -R0, -0.2] },
        { kind: "cylinder", radius: 0.38, inner: 0.2, length: 0.25 },
      ],
    },
    { id: "valveRod", kind: "group", pieces: [{ kind: "box", size: [0.22, 1.6, 0.18], at: [0, -0.8, 0] }] },
    // 滾子:套在臂的銷上,貼著偏心輪滾動(兩個同向轉,只留一個箭頭)
    { id: "rollerTop", kind: "cylinder", radius: ROLLER, inner: 0.1, length: 0.3, mark: true, spin: ROLLER },
    { id: "rollerBottom", kind: "cylinder", radius: ROLLER, inner: 0.1, length: 0.3, mark: true },
    {
      id: "pivotPost",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.3, 1.4, 0.2], at: [PIVOT[0], -0.9, 0.15] },
        { kind: "cylinder", radius: 0.2, length: 0.5, at: [PIVOT[0], PIVOT[1], 0.3] }, // 臂的樞軸銷
        ...pedestal({ at: [0, 0], z: -0.55, bore: 0.2, floor: -3.2 }),
      ],
    },
  ],
  driver: { part: "shaft", type: "rotation" },
  target: "valveRod",
  replay: {
    free: {
      arm: { pivot: PIVOT },
      rollerTop: { pivot: [0, R0, 0.05], on: "arm" },
      rollerBottom: { pivot: [0, -R0, 0.05], on: "arm" },
    },
    expect: [
      { at: Math.PI / 3, part: "arm", label: "偏心輪的一瓣經過,把臂推到一邊", quote: "偏心輪固定於曲柄軸上,並將運動傳遞給叉形振動臂" },
      { at: (2 * Math.PI) / 3, part: "arm", label: "下一瓣經過,臂擺回來" },
      { part: "arm", label: "轉完一圈,臂回到起點" },
    ],
  },
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { angle } = arm(theta);
    // 下滾子的位置(隨臂轉動)
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const lx = PIVOT[0] + (-PIVOT[0]) * c - -R0 * s;
    const ly = PIVOT[1] + (-PIVOT[0]) * s + -R0 * c;
    const roller = (y) => {
      const [x, yy] = rot2([-PIVOT[0], y], angle);
      return [PIVOT[0] + x, PIVOT[1] + yy, 0.05];
    };
    return {
      parts: {
        shaft: { angle: theta },
        arm: { angle },
        valveRod: { position: [lx, ly - ROLLER, 0.05] },
        rollerTop: { position: roller(R0), angle: rollerAngle(theta, Math.PI / 2) },
        rollerBottom: { position: roller(-R0), angle: rollerAngle(theta, -Math.PI / 2) },
      },
      readouts: [],
    };
  },
};

