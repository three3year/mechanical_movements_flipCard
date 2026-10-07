// 第 481 種:濕式氣錶。靜止的外殼 A 注水到中心以上。裡面旋轉的鼓分成四個隔室 B,入口在中央管 a 的周圍,a 經鼓的空心軸頸
// 把氣體引進來;這根管往上彎,讓氣體進到水面上方(中心附近的箭頭)。氣體依序進入各隔室,使鼓朝周緣附近的箭頭方向轉,
// 並把隔室裡的水排出;隔室轉過去後又再注滿水。各隔室的容積已知,鼓的轉數由錶盤記錄,所以通過的氣量就被記下來。
// 主動件是虛擬的「進程」:通過的氣量(以鼓的轉數計)。
// 推斷:四片隔板從中心附近彎向外緣;正在進氣的隔室(入口在水面上方)裡有氣體(點),出口在隔室外緣浮出水面時排氣;
// 鼓順時針轉(依原圖周緣的箭頭);剖面圖。
import { TAU, deg, polar } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine } from "./shapes.js";

export const R = 1.55; // 鼓的半徑
const CASE = 1.85;
export const WATER = 0.3; // 水面(中心以上)
export const CHAMBERS = 4;
const SWEEP = deg(70);

// 一片隔板:從中心附近(入口)彎到外緣
const partition = Array.from({ length: 13 }, (_, i) => {
  const t = i / 12;
  return polar(0.32 + (R - 0.35) * t, SWEEP * t).slice(0, 2);
});

/** 鼓轉 a(順時針為負)→ 正在進氣的隔室(入口在水面上方的那一個) */
export function filling(a) {
  for (let k = 0; k < CHAMBERS; k++) {
    // 第 k 個隔室的入口在隔板 k 與 k+1 的內端之間
    const inlet = a + (k + 0.5) * (TAU / CHAMBERS);
    if (Math.sin(inlet) * 0.32 > WATER - 0.6 && Math.sin(inlet) > 0.2) return k;
  }
  return -1;
}

export default {
  figure: 481,
  parts: [
    {
      id: "casing",
      kind: "group",
      label: "A",
      labelOffset: [1.25, -1.05, 0.5],
      pieces: [
        { kind: "plate", shape: shape(circle(CASE + 0.1), [circle(CASE).reverse()]), thickness: 0.7 },
        { kind: "plate", shape: shape(circle(CASE + 0.1)), thickness: 0.04, at: [0, 0, -0.37] },
        { kind: "box", size: [3.0, 0.25, 0.9], at: [0, -CASE - 0.2, 0] },
        // 背板上托著鼓的空心軸頸的軸承(推斷:原圖是剖面,只畫出中央管)
        { kind: "cylinder", radius: 0.3, inner: 0.2, length: 0.12, at: [0, 0, -0.31] },
        // 中央的進氣管 a(往上彎,出口在水面上方)
        { kind: "plate", shape: shape(thickLine([[0, -0.05], [0, WATER + 0.25], [0.15, WATER + 0.35]], 0.08)), thickness: 0.12, at: [0, 0, 0.32] },
      ],
    },
    { id: "labela", kind: "group", pieces: [], label: "a", labelOffset: [-0.2, 0.05, 0.6] },
    // 外殼裡的水(圓形外殼,以幾層水平的水片逼近)
    ...Array.from({ length: 10 }, (_, k) => {
      const y0 = -CASE + ((WATER + CASE) * k) / 10;
      const y1 = -CASE + ((WATER + CASE) * (k + 1)) / 10;
      const yw = Math.abs(y0) > Math.abs(y1) ? y1 : y0; // 用較窄的那一端,不超出外殼
      return { id: `water${k}`, kind: "fill", fluid: "water", center: [0, (y0 + y1) / 2, 0], size: [2 * Math.sqrt(Math.max(0, CASE * CASE - yw * yw)) - 0.04, y1 - y0, 0.6], level: 1 };
    }),
    {
      id: "drum",
      kind: "group",
      spin: R + 0.1,
      pieces: [
        { kind: "plate", shape: shape(circle(R + 0.04), [circle(R - 0.04).reverse()]), thickness: 0.56 },
        ...Array.from({ length: CHAMBERS }, (_, k) => ({ kind: "plate", shape: shape(thickLine(partition, 0.06)), thickness: 0.56, angle: (k * TAU) / CHAMBERS, ...(k === 0 ? { mark: [0.9, 0.25] } : {}) })),
        { kind: "plate", shape: shape(circle(0.3), [circle(0.2).reverse()]), thickness: 0.56 },
        // 空心軸頸:中央管 a 從裡面穿過,往後伸進軸承
        { kind: "cylinder", radius: 0.19, inner: 0.12, length: 0.2, at: [0, 0, -0.32] },
      ],
    },
    ...Array.from({ length: CHAMBERS }, (_, k) => ({ id: `labelB${k}`, kind: "group", pieces: [], label: "B", labelOffset: [0, 0, 0.5] })),
  ],
  powered: ["drum"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "轉", speed: 0.1 },
  target: "drum",
  view: { direction: [0.03, 0.05, 1] },
  pose(progress) {
    const a = -TAU * progress; // 順時針
    const k = filling(a);
    const parts = { drum: { angle: a } };
    for (let j = 0; j < CHAMBERS; j++) parts[`labelB${j}`] = { position: polar(1.0, a + (j + 0.5) * (TAU / CHAMBERS) + deg(25)) };
    const travel = progress * 20;
    const gas = [...stream([[0, -0.05, 0.3], [0, WATER + 0.25, 0.3], [0.2, WATER + 0.4, 0.3]], travel, { spacing: 0.15 })];
    if (k >= 0) {
      const mid = a + (k + 0.5) * (TAU / CHAMBERS);
      for (let r = 0.5; r < R - 0.1; r += 0.25) for (const d of [-0.25, 0, 0.25]) {
        const p = polar(r, mid + d + deg(20) * (r / R), 0.3);
        if (p[1] > WATER) gas.push(p);
      }
    }
    return {
      parts,
      flows: [{ fluid: "air", points: gas }],
      readouts: [{ label: "通過的氣量", value: `${(progress * CHAMBERS).toFixed(1)} 室` }],
    };
  },
};
