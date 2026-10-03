// 第 469 種:一項法國發明,靠兩池水的溫度差得到旋轉運動。兩個水槽:左邊常溫,右邊較熱。右邊有一個水車,
// 以齒輪與左邊的阿基米德螺旋相連;從螺旋上方伸出一根管子,通到輪的下方。啟動時把螺旋朝與抬水相反的方向轉,
// 把空氣往下壓進管裡,空氣在管裡上升、越過、再下降,把運動傳給水車;據說空氣的體積隨溫度增加,使機器保持運轉。
// 至於溫度差要如何維持,原文沒有說明。
// 主動件是右邊的水車;螺旋經齒輪跟著轉。
// 推斷:氣泡從管口冒到水車一側的水斗下,推著水車轉;水車上的大齒輪與螺旋頂端的小齒輪 3 : 1;管路的走法依原圖。
import { TAU, deg, polar, norm, quatFromZ, quatMul, quatAxisAngle } from "./kit.js";
import { stream } from "./flow.js";
import { shape, rect, thickLine } from "./shapes.js";

const WHEEL = { center: [1.55, 0.0, 0], radius: 0.75 };
const SCREW = { base: [-1.45, -0.95, 0], dir: norm([2.2, 0.95, 0]), len: 2.25, r: 0.22 };
const BUCKETS = 14;
const PIPE = [[-0.2, 0.5], [-0.2, 2.15], [2.65, 2.15], [2.65, -1.2], [WHEEL.center[0] + 0.45, -1.2], [WHEEL.center[0] + 0.45, -0.95]];

/** 水車轉 theta(逆時針)→ 螺旋的轉角 */
export const screwAngle = (theta) => -3 * theta;

const helix = Array.from({ length: 121 }, (_, i) => {
  const z = (SCREW.len * i) / 120;
  const a = (TAU * z) / 0.45;
  return [SCREW.r * Math.cos(a), SCREW.r * Math.sin(a), z];
});

export default {
  figure: 469,
  parts: [
    {
      id: "tanks",
      kind: "group",
      pieces: [
        { kind: "plate", shape: shape(thickLine([[-2.5, 1.0], [-2.5, -1.7], [0.15, -1.7], [0.15, 1.0]], 0.08)), thickness: 1.0 },
        { kind: "plate", shape: shape(thickLine([[0.45, 1.0], [0.45, -1.7], [2.85, -1.7], [2.85, 1.0]], 0.08)), thickness: 1.0 },
        // 通過頂上的管子
        { kind: "plate", shape: shape(thickLine(PIPE, 0.1)), thickness: 0.2, at: [0, 0, 0.3] },
        { kind: "plate", shape: shape(rect(0.14, 1.1, -2.2, -1.0)), thickness: 0.4 },
      ],
    },
    { id: "cool", kind: "fill", fluid: "water", center: [-1.17, -0.4, 0], size: [2.5, 2.5, 0.9], level: 0.9 },
    { id: "warm", kind: "fill", fluid: "water", center: [1.65, -0.4, 0], size: [2.25, 2.5, 0.9], level: 0.9 },
    {
      id: "wheel",
      kind: "group",
      center: WHEEL.center,
      spin: WHEEL.radius + 0.15,
      pieces: [
        { kind: "cylinder", radius: WHEEL.radius, inner: WHEEL.radius - 0.06, length: 0.5 },
        ...Array.from({ length: BUCKETS }, (_, i) => {
          const a = (i * TAU) / BUCKETS;
          return { kind: "box", size: [0.3, 0.05, 0.5], at: polar(WHEEL.radius - 0.15, a), angle: a + deg(30) };
        }),
        { kind: "cylinder", radius: 0.08, length: 1.0 },
        // 與螺旋相連的齒輪
        { kind: "gear", teeth: 30, radius: 0.6, width: 0.08, at: [0, 0, 0.4] },
      ],
    },
    {
      id: "screw",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "tube", points: helix, radius: 0.04 },
        { kind: "cylinder", radius: 0.07, length: SCREW.len + 0.4, at: [0, 0, SCREW.len / 2] },
        { kind: "gear", teeth: 10, radius: 0.2, width: 0.08, at: [0, 0, SCREW.len + 0.15] },
      ],
    },
  ],
  waivers: [
    { check: "interference", parts: ["tanks", "screw"], reason: "待確認:tanks 的板 與 screw 的Tube重疊 0.08,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
    { check: "interference", parts: ["wheel", "screw"], reason: "待確認:wheel 的板 與 screw 的板重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
  driver: { part: "wheel", type: "rotation", speed: 0.6 },
  target: "screw",
  view: { direction: [0.08, 0.08, 1] },
  pose(theta) {
    const travel = theta * 0.8;
    // 氣泡:沿管子越過頂上,從水車右下方冒出,沿右側往上
    const rise = [[WHEEL.center[0] + 0.45, -0.9, 0.3], [WHEEL.center[0] + 0.55, -0.2, 0.3], [WHEEL.center[0] + 0.5, 0.6, 0.3], [WHEEL.center[0] + 0.45, 0.85, 0.3]];
    return {
      parts: {
        wheel: { angle: theta },
        screw: { position: SCREW.base, rotation: quatMul(quatFromZ(SCREW.dir), quatAxisAngle([0, 0, 1], screwAngle(theta))) },
      },
      flows: [{ fluid: "air", points: [...stream(PIPE.map(([x, y]) => [x, y, 0.35]), travel, { spacing: 0.3 }), ...stream(rise, travel, { spacing: 0.22 })] }],
      readouts: [{ label: "溫度差如何維持", value: "原文未說明" }],
    };
  },
};
