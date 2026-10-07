// 第 495 種:Entwistle 的專利齒輪機構。傘齒輪 A 固定;與 A 嚙合的 B 可繞固定在軸上的凸柱 E 轉,同時也咬在軸 D 上鬆轉的
// 傘齒輪 C。軸 D 轉動時,B 繞 A 公轉,同時繞自己的軸自轉,所以以兩種方式帶動 C:自轉與繞 A 的公轉。三個輪一樣大時,
// 軸 D 每轉一圈,C 轉兩圈;改變齒輪的相對大小可以改變這個速比。圖中 C 附有一個鼓輪 C'。可用於操舵裝置、驅動螺旋槳等。
// 若把動力加在 C,作用可以反過來,得到 D 的緩慢運動。
// 主動件是軸 D(右端的手輪)。
import { X } from "./kit.js";
import { lastWheel } from "./epicyclic.js";
import { planetRotation, planetSpin } from "./bevel-train.js";
import { shape, rect } from "./shapes.js";

const R = 0.55; // 三個傘齒輪一樣大
const H = 0.22;
export const E_AC = -1; // A → C 的輪系值(以臂為參考):兩個面對面的傘齒輪經一個行星,方向相反、大小相同

/** 軸 D 轉 d → C 的轉角(A 固定) */
export const wheelC = (d) => lastWheel(0, d, E_AC);

export default {
  figure: 495,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(rect(4.6, 0.2, 0, -1.25)), thickness: 1.0 },
        { kind: "box", size: [0.3, 1.1, 0.5], at: [-1.75, -0.65, 0] },
        { kind: "box", size: [0.3, 1.1, 0.5], at: [1.25, -0.65, 0] },
        // 兩個支座頂上的軸承;A 固定在右支座伸出的套筒上(推斷:原圖的 A 連著右邊的機架)
        { kind: "cylinder", radius: 0.17, inner: 0.1, length: 0.3, axis: X, at: [-1.75, 0, 0] },
        { kind: "cylinder", radius: 0.17, inner: 0.1, length: 0.3, axis: X, at: [1.25, 0, 0] },
        { kind: "cylinder", radius: 0.2, inner: 0.1, length: 0.6, axis: X, at: [R * 0.9 + 0.45, 0, 0] },
      ],
    },
    // 固定的 A(右)
    { id: "wheelA", kind: "bevel", center: [R * 0.9, 0, 0], axis: [-1, 0, 0], radius: R, height: H, label: "A", labelOffset: [0.25, 0.75, 0.3] },
    // 軸 D 與固定在上面的凸柱 E,右端的手輪
    {
      id: "shaftD",
      kind: "group",
      axis: X,
      label: "D",
      labelOffset: [-0.4, -0.25, 0.3],
      spin: 0.4,
      pieces: [
        { kind: "cylinder", radius: 0.09, length: 4.0, at: [0, 0, 0.2] },
        { kind: "box", size: [0.14, 0.75, 0.14], at: [0, 0.38, 0] },
        { kind: "box", size: [0.05, 0.05, 0.5], at: [0.09, 0, -1.15], accent: true }, // 軸上的鍵條(記號)
        { kind: "cylinder", radius: 0.6, length: 0.25, at: [0, 0, 2.05] },
      ],
    },
    { id: "labelE", kind: "group", pieces: [], label: "E", labelOffset: [0, 1.0, 0.2] },
    // 行星 B(繞凸柱 E 轉)
    { id: "wheelB", kind: "bevel", center: [0, R * 0.9, 0], axis: [0, -1, 0], radius: R, height: H, label: "B", labelOffset: [-0.35, 0.4, 0.3], arrow: false },
    // 鬆套在軸 D 上的 C 與鼓輪 C'
    {
      id: "wheelC",
      kind: "group",
      axis: X,
      center: [-R * 0.9, 0, 0],
      label: "C",
      labelOffset: [-0.1, -0.75, 0.3],
      spin: 0.75,
      pieces: [
        { kind: "bevel", radius: R, height: H, axis: [0, 0, 1] },
        { kind: "cylinder", radius: 0.32, length: 0.9, at: [0, 0, -0.6] },
      ],
    },
    { id: "labelC2", kind: "group", pieces: [], label: "C'", labelOffset: [-1.3, 0.45, 0.3] },
  ],
  driver: { part: "shaftD", type: "rotation", speed: 0.4 },
  target: "wheelC",
  view: { direction: [0.25, 0.3, 1] },
  pose(d) {
    const c = wheelC(d);
    // B 相對臂(軸 D)的自轉:A 相對臂轉 −d
    const spin = planetSpin(-d, R, R);
    return {
      parts: {
        shaftD: { angle: d },
        wheelB: { rotation: planetRotation(X, d, [0, -1, 0], spin), position: rotX([0, R * 0.9, 0], d) },
        wheelC: { angle: c },
      },
      readouts: [{ label: "C 的轉速 / 軸 D", value: `${(1 - E_AC).toFixed(0)} 倍(三輪一樣大)` }],
    };
  },
};

const rotX = ([x, y, z], a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
