// 第 445–446 種共用:D'Ectol 的振盪水柱。所有部件完全固定:上面一根較細的管(持續供水),下面一根較粗的管,
// 粗管裡有一片與管口同心的圓板,接住細管流下的水。水往下流時(第 445 種)在圓板上逐漸堆成一個圓錐,
// 圓錐往上凸進細管(第 446 種)擋住水流;上面的供水不斷,細管裡的水柱便上升,直到圓板上的圓錐崩解。
// 這個動作週期性地重複,由供水量調節。
// 主動件是虛擬的「進程」:每單位是一個週期;兩張圖各自預設停在自己的階段。
// 推斷:細管的上端高於供水管,水柱升到那裡就溢出(把一部分水抬到水頭之上);圓錐以幾層水表示;各階段所佔的進程。
import { clamp, smooth } from "./kit.js";
import { stream } from "./flow.js";
import { shape, thickLine } from "./shapes.js";

const NARROW = { x: 0.9, half: 0.3, bottom: -0.2, top: 2.3 }; // 細管
const SUPPLY_Y = 1.55; // 供水管的高度
const WIDE = { half: 0.85, bottom: -2.2, top: -0.55 }; // 粗管(箱)
const DISC = { y: -1.6, radius: 0.42 };
const LAYERS = 6;
const CONE_TOP = 0.35; // 圓錐長到這裡(伸進細管)

/** 進程 v → 圓錐高度(0–1)、細管裡的水柱高度(0–1)、是否在往下流、是否溢出 */
export function column(v) {
  const u = v - Math.floor(v);
  if (u < 0.45) return { cone: smooth(clamp((u - 0.1) / 0.35, 0, 1)), rise: 0, falling: true, overflow: false, phase: "水往下流,圓板上堆成圓錐" };
  if (u < 0.8) return { cone: 1, rise: smooth((u - 0.45) / 0.3), falling: false, overflow: u > 0.7, phase: u > 0.7 ? "圓錐擋住水流,水柱升到頂溢出" : "圓錐擋住水流,細管的水柱上升" };
  const s = (u - 0.8) / 0.2;
  return { cone: 1 - smooth(s / 0.4), rise: 1 - smooth(s), falling: true, overflow: false, phase: "圓錐崩解,水柱落下" };
}

const wall = (pts) => ({ kind: "plate", shape: shape(thickLine(pts, 0.08)), thickness: 0.8 });
const cx = NARROW.x;
const FALL = [[cx, SUPPLY_Y - 0.1, 0.45], [cx, DISC.y + 0.1, 0.45]];
const SPREAD = [-1, 1].map((s) => [[cx + s * 0.1, DISC.y + 0.05, 0.45], [cx + s * DISC.radius, DISC.y, 0.45], [cx + s * 0.7, WIDE.bottom + 0.15, 0.45], [cx + 2.2, WIDE.bottom + 0.15, 0.45]]);
const SUPPLY = [[-2.4, SUPPLY_Y - 0.1, 0.45], [cx - 0.1, SUPPLY_Y - 0.1, 0.45]];
const OVER = [[cx, NARROW.top - 0.1, 0.45], [cx + 0.15, NARROW.top + 0.25, 0.45], [cx + 0.45, NARROW.top + 0.05, 0.45]];

export function makeModel(figure, initial) {
  return {
    figure,
    parts: [
      {
        id: "pipes",
        kind: "group",
        pieces: [
          // 供水管(水平,從左來)與細管
          wall([[-2.5, SUPPLY_Y + 0.25], [cx - NARROW.half, SUPPLY_Y + 0.25], [cx - NARROW.half, NARROW.top]]),
          wall([[-2.5, SUPPLY_Y - 0.25], [cx - NARROW.half, SUPPLY_Y - 0.25], [cx - NARROW.half, NARROW.bottom]]),
          wall([[cx + NARROW.half, NARROW.top], [cx + NARROW.half, NARROW.bottom]]),
          // 粗管:箱形,右下有出水口
          wall([[cx - NARROW.half, WIDE.top], [cx - WIDE.half, WIDE.top], [cx - WIDE.half, WIDE.bottom], [cx + 2.3, WIDE.bottom]]),
          wall([[cx + NARROW.half, WIDE.top], [cx + WIDE.half, WIDE.top], [cx + WIDE.half, WIDE.bottom + 0.4], [cx + 2.3, WIDE.bottom + 0.4]]),
          { kind: "plate", shape: shape([[-2.5, WIDE.bottom - 0.1], [cx + 2.3, WIDE.bottom - 0.1], [cx + 2.3, NARROW.top + 0.1], [-2.5, NARROW.top + 0.1]]), thickness: 0.04, at: [0, 0, -0.42] },
          // 圓板與支柱
          { kind: "cylinder", radius: DISC.radius, length: 0.06, axis: [0, 1, 0], at: [cx, DISC.y, 0] },
          { kind: "cylinder", radius: 0.05, length: DISC.y - WIDE.bottom, axis: [0, 1, 0], at: [cx, (DISC.y + WIDE.bottom) / 2, 0] },
        ],
      },
      // 供水管裡的水(一直滿著)
      { id: "supplyWater", kind: "fill", fluid: "water", center: [(-2.5 + cx) / 2, SUPPLY_Y, 0], size: [cx + 2.5 - 0.3, 0.42, 0.7], level: 1 },
      // 細管裡的水柱
      { id: "column", kind: "fill", fluid: "water", center: [cx, (NARROW.bottom + NARROW.top) / 2, 0], size: [2 * NARROW.half - 0.08, NARROW.top - NARROW.bottom, 0.7], level: 0 },
      // 圓錐(一層層的水)
      ...Array.from({ length: LAYERS }, (_, k) => ({ id: `cone${k}`, kind: "fill", fluid: "water", shape: "cylinder", size: [2 * DISC.radius * (1 - k / LAYERS) + 0.05, (CONE_TOP - DISC.y) / LAYERS, 0], level: 0 })),
    ],
    driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "週期", speed: 0.12, initial },
    view: { direction: [0.05, 0.06, 1] },
    pose(v) {
      const c = column(v);
      const travel = v * 10;
      const parts = {};
      // 水柱:從供水管的高度往上升到管頂;落水時細管下段是一道水流(以點表示)
      const base = (SUPPLY_Y - NARROW.bottom) / (NARROW.top - NARROW.bottom);
      parts.column = { level: c.falling ? 0 : base + (1 - base) * c.rise };
      const h = (CONE_TOP - DISC.y) / LAYERS;
      for (let k = 0; k < LAYERS; k++) {
        const on = clamp(c.cone * LAYERS - k, 0, 1);
        parts[`cone${k}`] = { position: [cx, DISC.y + 0.03 + h * (k + 0.5), 0], level: on };
      }
      const flows = [{ fluid: "water", points: stream(SUPPLY, travel * (c.falling ? 1 : 0.3), { spacing: 0.25 }) }];
      if (c.falling) flows.push({ fluid: "water", points: [...stream(FALL, travel, { spacing: 0.16 }), ...SPREAD.flatMap((p) => stream(p, travel, { spacing: 0.18 }))] });
      if (c.overflow) flows.push({ fluid: "water", points: stream(OVER, travel, { spacing: 0.12 }) });
      return { parts, flows, readouts: [{ label: "階段", value: c.phase }] };
    },
  };
}
