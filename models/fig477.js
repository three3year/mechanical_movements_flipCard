// 第 477 種:蒸汽疏水器(Hoard & Wiggin 的專利),封住蒸汽,但讓蒸汽盤管與散熱器裡的水排出。它是一個盒子,在 A 接盤管
// 或廢水管的末端,在 B 有出口,裝著一個中空的閥門 D,閥底是撓性隔膜。閥裡裝滿液體並封住,隔膜支在出口管上方的橋架上。
// 盒裡有蒸汽時,蒸汽把閥裡的液體加熱,隔膜膨脹,把閥門頂到閥座 a、a 處;冷凝水積多了,閥的溫度降低,
// 閥裡的液體收縮,隔膜讓閥門落下,水便排出。
// 主動件是虛擬的「進程」:蒸汽進來 → 隔膜鼓起、閥門頂上封住 A → 冷凝水在 A 裡積多、閥冷卻 → 隔膜收縮、閥門落下排水 → 再來蒸汽。
// 照原圖(2026-10-20 重做,決定 (a)):進口管 A 鑄在盒蓋上,盒蓋開口的下緣是錐面的閥座 a、a;閥 D 是中空的杯,
// 上面有長柄伸進 A 裡、肩是和閥座同角度的錐面;杯底是撓性隔膜(獨立零件,鼓起量隨閥內液體的溫度改變),
// 隔膜的頂點坐在出口 B 上方的拱形橋架上,鼓起時把閥身往上頂到閥座、封住 A;收縮時閥身落下、A 打開,
// 水從 A 經閥身旁邊落進盒子、從橋架下方流進 B。橋架的拱形、閥的尺寸是推斷;剖面圖(旋轉體剖開前半)。
import { Y, smooth, clamp } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { shape, thickLine, arcPoints } from "./shapes.js";

export const BOX = { r: 1.2, t: 0.08, y0: -0.9, y1: 0.65 }; // 盒:內半徑、壁厚、底面、蓋頂
const FLOOR_TOP = BOX.y0 + BOX.t; // 盒底的內面
const COVER = 0.15; // 蓋厚
const A = { r: 0.25, t: 0.08, top: 2.0 }; // 進口管 A(鑄在蓋上):內半徑、壁厚、頂
const B = { r: 0.22, t: 0.08, bottom: -2.0 }; // 出口 B(接在盒底):內半徑、壁厚、底
/** 閥座 a、a:盒蓋開口下緣的錐面,從蓋底的 (r, y) 到進口管內徑的 (r, y) */
export const SEAT = [[0.42, BOX.y1 - COVER], [A.r, BOX.y1]];
const CUP = { r: 0.42, wall: 0.06, h: 0.55 }; // 閥身 D:杯的外半徑、壁厚、杯高(肩從杯頂起)
const STEM = { r: 0.12, top: 1.95 }; // 長柄(伸進 A)
const ARCH = { r: 0.45, w: 0.08 }; // 橋架:拱的半徑、拱的寬
export const BRIDGE_TOP = FLOOR_TOP + ARCH.r + ARCH.w / 2; // 拱頂(隔膜坐在這裡)
export const CLOSED = SEAT[0][1] - CUP.h; // 閥身底緣的高度:肩頂到閥座(封住)
export const OPEN = CLOSED - 0.2; // 落到最低
const BULGE0 = 0.18; // 隔膜剖面畫的是鼓起 BULGE0 的樣子,姿勢再按鼓起量沿軸縮放

/** 進程 v → 盒內溫度(0 冷、1 蒸汽)、閥身底緣高度、隔膜鼓起量、A 與盒裡的冷凝水、是否在排水 */
export function trap(v) {
  const u = v - Math.floor(v);
  let temp;
  let waterA;
  let water = 0.1;
  if (u < 0.3) {
    temp = smooth(u / 0.3);
    waterA = 0.05;
  } else if (u < 0.65) {
    temp = 1 - 0.7 * smooth((u - 0.3) / 0.35);
    waterA = 0.05 + 0.75 * ((u - 0.3) / 0.35); // 閥封住時冷凝水在 A 裡積多,把閥柄冷卻
  } else if (u < 0.85) {
    const f = (u - 0.65) / 0.2;
    temp = 0.3 - 0.3 * smooth(f);
    waterA = 0.8 - 0.75 * smooth(f);
    water = 0.1 + 0.25 * Math.sin(Math.PI * f); // 排出的水經盒子流進 B
  } else {
    temp = 0;
    waterA = 0.05;
  }
  const lift = clamp((temp - 0.35) / 0.5, 0, 1);
  const valve = OPEN + (CLOSED - OPEN) * lift;
  return { temp, valve, bulge: valve - BRIDGE_TOP, waterA, water, draining: u > 0.6 && u < 0.85 && lift < 0.75 };
}

export default {
  figure: 477,
  parts: [
    {
      id: "body",
      kind: "group",
      pieces: [
        // 盒(底、壁、蓋)、鑄在蓋上的進口管 A、蓋開口下緣的錐形閥座 a、a、接在盒底的出口 B:一個旋轉體,剖開前半
        {
          kind: "lathe",
          role: "shell",
          axis: Y,
          profile: [
            [B.r, B.bottom], [B.r + B.t, B.bottom], [B.r + B.t, BOX.y0], [BOX.r + BOX.t, BOX.y0], [BOX.r + BOX.t, BOX.y1], [A.r + A.t, BOX.y1], [A.r + A.t, A.top], [A.r, A.top],
            SEAT[1], SEAT[0], [BOX.r, BOX.y1 - COVER], [BOX.r, FLOOR_TOP], [B.r, FLOOR_TOP],
          ],
          ...backHalf(Y),
        },
        // 出口 B 上方的拱形橋架(推斷:原圖是一道弧形的橋),兩腳立在盒底、腳下留著水道通往 B
        { kind: "plate", role: "bridge", shape: shape(thickLine([[-ARCH.r, FLOOR_TOP - 0.04], ...arcPoints(ARCH.r, Math.PI, 0, 0, FLOOR_TOP), [ARCH.r, FLOOR_TOP - 0.04]], ARCH.w)), thickness: 0.2 },
      ],
    },
    { id: "labelA", kind: "group", pieces: [], label: "A", labelOffset: [0.55, 1.7, 0.4] },
    { id: "labelB", kind: "group", pieces: [], label: "B", labelOffset: [0.55, -1.8, 0.4] },
    { id: "labela", kind: "group", pieces: [], label: "a", labelOffset: [-0.7, 0.58, 0.5] },
    // A 裡積的冷凝水、盒裡排出中的水
    { id: "condensateA", kind: "fill", fluid: "water", shape: "cylinder", center: [0, (BOX.y1 + STEM.top) / 2, 0], size: [2 * A.r - 0.02, STEM.top - BOX.y1, 0], level: 0.05 },
    { id: "condensate", kind: "fill", fluid: "water", shape: "cylinder", center: [0, (FLOOR_TOP + BOX.y1 - COVER) / 2, 0], size: [2 * BOX.r - 0.04, BOX.y1 - COVER - FLOOR_TOP, 0], level: 0.1 },
    // 中空的閥門 D:杯(底緣在局部原點,底由隔膜封住)、錐面的肩、伸進 A 的長柄
    {
      id: "valve",
      kind: "lathe",
      axis: Y,
      profile: [[CUP.r - CUP.wall, 0], [CUP.r, 0], [CUP.r, CUP.h], [A.r, CUP.h + (SEAT[1][1] - SEAT[0][1])], [STEM.r, CUP.h + (SEAT[1][1] - SEAT[0][1])], [STEM.r, STEM.top - CLOSED], [0, STEM.top - CLOSED], [0, CUP.h - 0.06], [CUP.r - CUP.wall, CUP.h - 0.06]],
      label: "D",
      labelOffset: [0, 0.3, 0.8],
      arrow: false,
    },
    // 撓性隔膜:邊緣是嵌在杯口裡的環,中央往下鼓起、頂點(平的一小塊)坐在橋架頂上;鼓起量由姿勢沿軸縮放
    {
      id: "diaphragm",
      kind: "lathe",
      axis: Y,
      profile: [[0.355, 0.06], [0.355, 0], [0.33, -0.09], [0.24, -0.15], [0.1, -0.18], [0, -0.18], [0, -0.13], [0.09, -0.13], [0.21, -0.1], [0.29, -0.05], [0.3, 0], [0.3, 0.06]],
      arrow: false,
    },
  ],
  powered: ["diaphragm"], // 外力來源:閥裡的液體受熱膨脹把隔膜鼓起(閥身被隔膜頂起)
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], speed: 0.1 },
  target: "valve",
  view: { direction: [0.08, 0.12, 1] },
  pose(v) {
    const t = trap(v);
    const travel = v * 12;
    const flows = [];
    const sealed = t.valve > CLOSED - 0.03;
    if (t.temp > 0.2) {
      // 蒸汽從 A 下來,到閥座為止;閥沒封住時再從閥身旁邊進盒子
      const path = [[0.19, STEM.top, 0], [0.19, BOX.y1, 0]];
      if (!sealed) path.push([0.5, BOX.y1 - COVER - 0.05, 0.2], [0.85, 0.2, 0.2], [0.9, -0.4, 0.2]);
      flows.push({ fluid: "steam", points: stream(path, travel, { spacing: 0.2 }) });
    }
    if (t.draining) {
      // 水從 A 經閥座、閥身旁邊落到盒底,從橋架下方(前面)流進 B
      flows.push({ fluid: "water", points: stream([[-0.19, STEM.top, 0], [-0.19, BOX.y1, 0], [-0.5, BOX.y1 - COVER - 0.05, 0.2], [-0.9, 0.1, 0.2], [-0.95, FLOOR_TOP + 0.06, 0.2], [-0.3, FLOOR_TOP + 0.04, 0.2], [-0.05, FLOOR_TOP - 0.02, 0.15], [-0.05, B.bottom + 0.1, 0.15]], travel, { spacing: 0.16 }) });
    }
    return {
      parts: {
        valve: { position: [0, t.valve, 0] },
        diaphragm: { position: [0, t.valve, 0], scale: [1, 1, t.bulge / BULGE0] },
        condensateA: { level: t.waterA },
        condensate: { level: t.water },
      },
      flows,
      readouts: [
        { label: "閥 D", value: t.temp > 0.6 ? "蒸汽加熱閥內液體,隔膜鼓起、閥身頂到閥座 a、a 封住 A" : t.temp > 0.25 ? "冷凝水在 A 裡積多,閥冷卻中" : "閥內液體收縮,隔膜落下、閥身下降,水排出" },
      ],
    };
  },
};
