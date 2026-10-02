// 第 117 種:凸輪夾在軛內上下兩個摩擦滾子之間,曾用來給蒸汽引擎的閥門提供運動。
// 凸輪轉動時軛(連同上下的閥桿)上下往復;兩個滾子同時貼著凸輪——凸輪的節曲線滿足 r(φ) + r(φ + π) = 定值,
// 所以兩滾子中心的距離不變(這種凸輪才能兩側同時接觸,為推斷的設計)。主動件是凸輪軸。
import { Y } from "./kit.js";
import { outlineForRoller } from "./cams.js";
import { shape, circle } from "./shapes.js";

const R0 = 1.25;
const ROLLER = 0.3;
// 節曲線(滾子中心的路徑):只含奇數次諧波,對邊的和恆為 2·R0
export const pitchAt = (phi) => R0 + 0.42 * Math.cos(phi) + 0.09 * Math.cos(3 * phi) + 0.06 * Math.sin(phi);
const OUTLINE = outlineForRoller(pitchAt, ROLLER);
const START = Math.PI / 2; // 原圖:凸輪的大端朝左

/** 凸輪轉 theta:上滾子中心的高度(軛的位置) */
export const yokeY = (theta) => pitchAt(Math.PI / 2 - theta - START) - R0;
export const breadth = 2 * R0;

export default {
  figure: 117,
  parts: [
    {
      id: "cam",
      kind: "plate",
      shape: shape(OUTLINE, [circle(0.42).reverse()]),
      thickness: 0.3,
      mark: [0.75, 0],
      markSize: 0.08,
      spin: 1.6,
      pieces: [{ kind: "cylinder", radius: 0.42, length: 0.9, mark: true }],
    },
    {
      id: "yoke",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "box", size: [2.1, 0.3, 0.5], at: [0, R0 + ROLLER + 0.55, 0] },
        { kind: "box", size: [2.1, 0.3, 0.5], at: [0, -R0 - ROLLER - 0.55, 0] },
        { kind: "cylinder", axis: Y, radius: 0.07, length: 2 * (R0 + ROLLER + 0.55), at: [-0.85, 0, 0.3] },
        { kind: "cylinder", axis: Y, radius: 0.07, length: 2 * (R0 + ROLLER + 0.55), at: [0.85, 0, 0.3] },
        { kind: "box", size: [0.22, 0.9, 0.22], at: [-0.85, 0.15, 0.3] },
        { kind: "box", size: [0.22, 0.9, 0.22], at: [0.85, 0.15, 0.3] },
        { kind: "cylinder", axis: Y, radius: 0.2, length: 1.3, at: [0, R0 + ROLLER + 1.3, 0] },
        { kind: "cylinder", axis: Y, radius: 0.15, length: 2.4, at: [0, -R0 - ROLLER - 1.8, 0] },
        { kind: "box", size: [1.5, 0.3, 0.5], at: [0, -R0 - ROLLER - 2.9, 0] },
        { kind: "cylinder", radius: ROLLER, inner: 0.12, length: 0.45, at: [0, R0, 0] },
        { kind: "cylinder", radius: ROLLER, inner: 0.12, length: 0.45, at: [0, -R0, 0] },
        { kind: "plate", shape: shape([[-0.45, 0.3], [0.45, 0.3], [0.12, -0.1], [-0.12, -0.1]]), thickness: 0.1, at: [0, R0 + 0.45, 0.25] },
        { kind: "plate", shape: shape([[-0.45, -0.3], [0.45, -0.3], [0.12, 0.1], [-0.12, 0.1]]), thickness: 0.1, at: [0, -R0 - 0.45, 0.25] },
      ],
    },
  ],
  driver: { part: "cam", type: "rotation" },
  view: { direction: [0.06, 0.05, 1], fit: ["cam", "yoke"] },
  pose(theta) {
    return { parts: { cam: { angle: START + theta }, yoke: { position: [0, yokeY(theta), 0] } }, readouts: [] };
  },
};

