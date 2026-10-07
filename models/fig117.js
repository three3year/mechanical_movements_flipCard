// 第 117 種:凸輪夾在軛內上下兩個摩擦滾子之間,曾用來給蒸汽引擎的閥門提供運動。
// 凸輪轉動時軛(連同上下的閥桿)上下往復;兩個滾子同時貼著凸輪——凸輪的節曲線滿足 r(φ) + r(φ + π) = 定值,
// 所以兩滾子中心的距離不變(這種凸輪才能兩側同時接觸,為推斷的設計)。主動件是凸輪軸。
// 軛的位置由凸輪推滾子決定(動力重演:軛是上下的自由滑塊,靠自重壓在下滾子上)。
// 凸輪後面一根機架柱:凸輪軸的軸承、上下閥桿的導環都由它伸出的托架撐著(原圖只畫軛與凸輪,機架是推斷)。
import { Y } from "./kit.js";
import { outlineForRoller, outlineArc } from "./cams.js";
import { shape, circle } from "./shapes.js";

const R0 = 1.25;
const ROLLER = 0.3;
// 節曲線(滾子中心的路徑):只含奇數次諧波,對邊的和恆為 2·R0
export const pitchAt = (phi) => R0 + 0.42 * Math.cos(phi) + 0.09 * Math.cos(3 * phi) + 0.06 * Math.sin(phi);
const OUTLINE = outlineForRoller(pitchAt, ROLLER);
const ARC = outlineArc(OUTLINE);
const START = Math.PI / 2; // 原圖:凸輪的大端朝左
const UPPER_GUIDE = 3.0; // 上閥桿導環的高度:軛上下 ±0.51 時,閥桿始終穿過導環
const LOWER_GUIDE = -3.3;

/**
 * 凸輪轉 theta:滾子轉過的角度。滾子貼著凸輪滾動,經過接觸點的凸輪外形長度 ÷ 滾子半徑;
 * at 是接觸點在世界中的方向(上滾子 π/2、下滾子 −π/2)。凸輪逆時針轉時兩個滾子都順時針轉。
 */
export const rollerAngle = (theta, at) => -(ARC(at - START) - ARC(at - START - theta)) / ROLLER;
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
      pieces: [
        { kind: "cylinder", radius: 0.42, length: 0.9, mark: true },
        { kind: "cylinder", radius: 0.2, length: 1.3, at: [0, 0, -0.3] }, // 軸往後伸進機架柱上的軸承
      ],
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
        { kind: "cylinder", axis: Y, radius: 0.2, length: 1.9, at: [0, R0 + ROLLER + 1.6, 0] },
        { kind: "cylinder", axis: Y, radius: 0.15, length: 2.4, at: [0, -R0 - ROLLER - 1.8, 0] },
        { kind: "box", size: [1.5, 0.3, 0.5], at: [0, -R0 - ROLLER - 2.9, 0] },
        { kind: "cylinder", radius: 0.12, length: 0.55, at: [0, R0, 0] }, // 滾子的銷
        { kind: "cylinder", radius: 0.12, length: 0.55, at: [0, -R0, 0] },
        { kind: "plate", shape: shape([[-0.45, 0.3], [0.45, 0.3], [0.12, -0.1], [-0.12, -0.1]]), thickness: 0.1, at: [0, R0 + 0.45, 0.25] },
        { kind: "plate", shape: shape([[-0.45, -0.3], [0.45, -0.3], [0.12, 0.1], [-0.12, 0.1]]), thickness: 0.1, at: [0, -R0 - 0.45, 0.25] },
      ],
    },
    // 摩擦滾子:套在軛的銷上,貼著凸輪滾動(兩個同向轉,只留一個箭頭)
    { id: "rollerTop", kind: "cylinder", radius: ROLLER, inner: 0.12, length: 0.45, mark: true, spin: ROLLER },
    { id: "rollerBottom", kind: "cylinder", radius: ROLLER, inner: 0.12, length: 0.45, mark: true },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.3, 8.6, 0.3], at: [0, -0.7, -0.75] }, // 機架柱
        { kind: "box", size: [1.4, 0.18, 0.8], at: [0, -5.09, -0.75] },
        { kind: "cylinder", radius: 0.36, inner: 0.2, length: 0.3, at: [0, 0, -0.75] }, // 凸輪軸的軸承
        // 上下閥桿的導環與托架
        { kind: "cylinder", axis: Y, radius: 0.32, inner: 0.21, length: 0.3, at: [0, UPPER_GUIDE, 0] },
        { kind: "box", size: [0.2, 0.15, 0.45], at: [0, UPPER_GUIDE, -0.45] },
        { kind: "cylinder", axis: Y, radius: 0.27, inner: 0.16, length: 0.3, at: [0, LOWER_GUIDE, 0] },
        { kind: "box", size: [0.2, 0.15, 0.5], at: [0, LOWER_GUIDE, -0.42] },
      ],
    },
  ],
  driver: { part: "cam", type: "rotation" },
  target: "yoke", // 上下往復的軛(閥桿)
  replay: {
    free: {
      yoke: { slide: [0, 1, 0] },
      rollerTop: { pivot: [0, yokeY(0) + R0, 0], on: "yoke" },
      rollerBottom: { pivot: [0, yokeY(0) - R0, 0], on: "yoke" },
    },
    expect: [
      { at: Math.PI / 2, part: "yoke", label: "凸輪轉四分之一圈,把軛推過中間", quote: "一個凸輪作用於軛狀件內的兩個摩擦滾子之間" },
      { at: Math.PI, part: "yoke", label: "凸輪轉半圈,軛降到最低" },
      { part: "yoke", label: "凸輪轉一圈,上滾子把軛推回最高" },
    ],
  },
  view: { direction: [0.06, 0.05, 1], fit: ["cam", "yoke"] },
  pose(theta) {
    const y = yokeY(theta);
    return {
      parts: {
        cam: { angle: START + theta },
        yoke: { position: [0, y, 0] },
        rollerTop: { position: [0, y + R0, 0], angle: rollerAngle(theta, Math.PI / 2) },
        rollerBottom: { position: [0, y - R0, 0], angle: rollerAngle(theta, -Math.PI / 2) },
      },
      readouts: [],
    };
  },
};

