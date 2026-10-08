// 第 146 種:圓盤上的曲柄銷在軛的溝槽內作動,圓盤連續旋轉時軛桿上下往復。溝槽做成特別的彎曲形狀,
// 讓軛的位移與圓盤轉角成正比(均勻的往復直線運動)。溝槽的形狀就是「曲柄銷相對於軛的軌跡」,由此算出。
// 主動件是圓盤。
import { Y, TAU, clamp } from "./kit.js";
import { shape, circle } from "./shapes.js";
import { pedestal } from "./supports.js";
// 軛是一件:圓盤前面的一塊有溝的板——溝的外壁與內島,四根臂接到圍著圓盤的環,環的上下各接一根軛桿;
// 內島靠四座跨過溝的橋(在曲柄銷頂端的上方)和外壁相連。原圖的溝畫在圓盤後面(虛線),模型把它放到前面才看得到。
// 軛的位置由曲柄銷推溝槽決定(動力重演:軛是上下的自由滑塊,只被溝的兩壁推)。軛桿穿在兩側立柱伸出的導環裡,
// 圓盤的軸往後伸進軸承座(導環、立柱、軸承座是推斷)。
const FLOOR = -4.9;
const GUIDE_Y = 2.85; // 導環的高度:軛上下 ±0.75 時軛桿(環外 2.0 長)始終穿過導環
const YZ = 0.26; // 軛的板件在圓盤前面的位置
const T = 0.17; // 軛的板厚

const R = 1.55; // 圓盤
const PIN = 1.1; // 曲柄銷離中心的距離
const AMP = 0.75; // 軛的半行程(< 曲柄半徑)
const START = Math.PI / 2; // 原圖:曲柄銷在正上方
const WALL = 0.15; // 溝的半寬(銷的半徑 0.12,兩側各留 0.03)

/** 圓盤轉 theta:軛的高度(三角波,與轉角成正比) */
export const yokeY = (theta) => ((2 * AMP) / Math.PI) * Math.asin(Math.sin(START + theta));
const pinAt = (theta) => [PIN * Math.cos(START + theta), PIN * Math.sin(START + theta)];

// 溝槽中心線(軛的局部座標,逆時針):圓盤轉一圈,曲柄銷相對軛走過的封閉曲線。軛反向的兩處(銷在正上、正下方)
// 曲線有折角
const N = 240;
const groove = Array.from({ length: N }, (_, i) => {
  const t = (i / N) * TAU;
  const [x, y] = pinAt(t);
  return [x, y - yokeY(t)];
});

function distanceToGroove(q) {
  let best = Infinity;
  for (let i = 0; i < N; i++) {
    const a = groove[i];
    const b = groove[(i + 1) % N];
    const [vx, vy] = [b[0] - a[0], b[1] - a[1]];
    const [wx, wy] = [q[0] - a[0], q[1] - a[1]];
    const t = clamp((vx * wx + vy * wy) / (vx * vx + vy * vy), 0, 1);
    best = Math.min(best, Math.hypot(wx - t * vx, wy - t * vy));
  }
  return best;
}

/** 離溝槽中心線正好 |d| 的封閉曲線(d > 0 往外、d < 0 往內):先沿法線平移,再剔除折角處折回、離中心線不足 |d| 的點 */
export function offsetGroove(d) {
  const shifted = groove.map((p, i) => {
    const a = groove[(i + N - 1) % N];
    const b = groove[(i + 1) % N];
    const [tx, ty] = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(tx, ty) || 1;
    return [p[0] + (ty / l) * d, p[1] - (tx / l) * d];
  });
  return shifted.filter((q) => distanceToGroove(q) >= Math.abs(d) - 1e-3);
}

const BRIDGE_Z = YZ + T / 2 + 0.05; // 橋的中心:下緣疊在板上,上面越過銷頂(z 0.30)

export default {
  figure: 146,
  parts: [
    {
      id: "disc",
      kind: "group",
      spin: R,
      pieces: [
        { kind: "plate", shape: shape(circle(R), [circle(0.25).reverse()]), thickness: 0.15, circles: [0.42] },
        { kind: "cylinder", radius: 0.12, length: 0.44, at: [PIN * Math.cos(START), PIN * Math.sin(START), 0.08], accent: true }, // 曲柄銷:伸進前面的溝,頂端 z 0.30
        { kind: "cylinder", radius: 0.25, length: 0.8, at: [0, 0, -0.45] }, // 軸:往後伸進軸承座
      ],
    },
    {
      id: "yoke",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(circle(1.95), [circle(1.65).reverse()]), thickness: T, at: [0, 0, YZ] }, // 圍著圓盤的環
        { kind: "plate", shape: shape(offsetGroove(WALL + 0.22), [offsetGroove(WALL).reverse()]), thickness: T, at: [0, 0, YZ] }, // 溝的外壁
        { kind: "plate", shape: shape(offsetGroove(-WALL)), thickness: T, at: [0, 0, YZ] }, // 溝的內島
        // 外壁接到環的四根臂(銷永遠在溝裡,臂碰不到它)
        { kind: "box", size: [0.4, 0.3, T], at: [1.55, 0, YZ] },
        { kind: "box", size: [0.4, 0.3, T], at: [-1.55, 0, YZ] },
        { kind: "box", size: [0.3, 1.05, T], at: [0, 1.225, YZ] },
        { kind: "box", size: [0.3, 1.05, T], at: [0, -1.225, YZ] },
        // 跨過溝、托住內島的四座橋
        { kind: "box", size: [0.5, 0.14, 0.13], at: [PIN, 0, BRIDGE_Z] },
        { kind: "box", size: [0.5, 0.14, 0.13], at: [-PIN, 0, BRIDGE_Z] },
        { kind: "box", size: [0.14, 0.5, 0.13], at: [0, 0.35, BRIDGE_Z] },
        { kind: "box", size: [0.14, 0.5, 0.13], at: [0, -0.35, BRIDGE_Z] },
        // 上下軛桿:從環伸出 2.0
        { kind: "cylinder", axis: Y, radius: 0.13, length: 2.0, at: [0, 2.95, YZ] },
        { kind: "cylinder", axis: Y, radius: 0.13, length: 2.0, at: [0, -2.95, YZ] },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: [0, 0], z: -0.75, bore: 0.25, floor: FLOOR }),
        ...[-1, 1].flatMap((side) => [
          { kind: "box", size: [0.2, 3.3 - FLOOR, 0.6], at: [side * 2.4, (3.3 + FLOOR) / 2, 0.1] },
          { kind: "box", size: [0.8, 0.18, 0.8], at: [side * 2.4, FLOOR - 0.09, 0.1] },
        ]),
        ...[GUIDE_Y, -GUIDE_Y].flatMap((y) => [
          { kind: "cylinder", axis: Y, radius: 0.22, inner: 0.13, length: 0.3, at: [0, y, YZ] },
          { kind: "box", size: [2.2, 0.16, 0.16], at: [-1.3, y, YZ] },
          { kind: "box", size: [2.2, 0.16, 0.16], at: [1.3, y, YZ] },
        ]),
      ],
    },
  ],
  driver: { part: "disc", type: "rotation" },
  replay: {
    free: { yoke: { slide: [0, 1, 0] } },
    expect: [
      // 銷在 π/2 經過溝的折角(軛反向處),軛在那一瞬間會落後一點;中途的事件取折角之前
      { at: Math.PI / 4, part: "yoke", label: "曲柄銷沿溝槽把軛往下推", quote: "透過圓盤上作動於軛狀件溝槽內的手腕或曲柄銷,會產生軛桿的往復直線運動" },
      { at: Math.PI, part: "yoke", label: "圓盤轉半圈,軛到另一端" },
      { part: "yoke", label: "轉完一圈,軛回到起點" },
    ],
  },
  target: "yoke",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { disc: { angle: theta }, yoke: { position: [0, yokeY(theta), 0] } }, readouts: [] };
  },
};
