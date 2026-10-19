// 第 388 種:Woodworth 刨木機的進料運動:下面一個平滑的支撐滾子,上面一個帶齒的滾子,木板夾在兩者之間;
// 上滾子轉動,齒咬住木板把它往前送(原圖箭頭往右),下滾子被木板帶著轉。主動件是上面的帶齒滾子。
// 轉向(2026-10-20 改):木板往右,上滾子逆時針(最低點往右走)、下滾子順時針(最高點往右走),和 507movements 的動畫一致。
// 上滾子的齒咬進木板,送料的半徑是輪心到木板頂面的距離(齒尖與齒根之間),下滾子以外緣托著木板、不打滑。
// 行程:木板的左端走到下滾子頂點左邊一點就停(整段行程木板都夾在兩個滾子之間)。
// 推斷:兩滾子不打滑;木板的長度。兩滾子的軸往後伸進機架上的軸承(原圖只畫出滾子):下滾子立在軸承座上,
// 上滾子的軸承由從下滾子軸承座往上伸的立柱托著(機架是一片側板,推斷)。
import { shape, circle, polygon } from "./shapes.js";
import { pedestal } from "./supports.js";

const TOP = { center: [0, 0.72, 0], r: 0.62, tip: 0.72 }; // r:齒根;tip:齒尖
const LOW = { center: [0, -1.09, 0], r: 0.95 };
const BOARD = { y: -0.05, h: 0.18, l: 4.5, x0: -4.5 / 2 + 0.8 }; // 木板中心的高度、厚、長、起始的中心
const BITE_R = TOP.center[1] - (BOARD.y + BOARD.h / 2); // 上滾子在木板頂面那一圈的半徑
const TRAVEL = BOARD.l / 2 - BOARD.x0 - 0.1; // 木板的左端走到下滾子頂點左邊 0.1
export const RANGE = [0, TRAVEL / BITE_R]; // 上滾子的轉角(逆時針為正):把木板從左邊送到右邊

/** 上滾子轉 a(逆時針為正)→ 木板前進的距離(往右為正)、下滾子的轉角(順時針,為負) */
export function feed(a) {
  const travel = a * BITE_R;
  return { travel, low: -travel / LOW.r };
}

const RING = { top: 0.25, low: 0.27 }; // 兩個軸承環的外半徑
const BEARING_Z = -0.6;

export default {
  figure: 388,
  parts: [
    {
      id: "frame",
      kind: "group",
      pieces: [
        ...pedestal({ at: [LOW.center[0], LOW.center[1]], z: BEARING_Z, bore: 0.12, floor: -2.4 }),
        // 上滾子的軸承:軸承環由下滾子軸承環往上伸的立柱托著(兩個軸承在同一片側板上,推斷)
        { kind: "cylinder", radius: RING.top, inner: 0.1, length: 0.3, at: [TOP.center[0], TOP.center[1], BEARING_Z] },
        // 立柱的兩端伸進兩個軸承環、停在軸孔外(不碰兩根軸)
        { kind: "box", size: [0.3, TOP.center[1] - 0.17 - (LOW.center[1] + 0.2), 0.3], at: [TOP.center[0], (TOP.center[1] - 0.17 + LOW.center[1] + 0.2) / 2, BEARING_Z] },
      ],
    },
    {
      id: "top",
      kind: "plate",
      center: TOP.center,
      shape: shape(polygon(36, TOP.tip).map(([x, y], i) => (i % 2 ? [(x * TOP.r) / TOP.tip, (y * TOP.r) / TOP.tip] : [x, y])), [circle(0.1).reverse()]),
      thickness: 0.6,
      hub: 0.15,
      circles: [0.25],
      mark: [TOP.r * 0.55, 0],
      markSize: 0.07,
      spin: TOP.r,
      pieces: [{ kind: "cylinder", radius: 0.1, length: 0.75, at: [0, 0, -0.42] }], // 軸往後伸進軸承
    },
    { id: "low", kind: "plate", center: LOW.center, shape: shape(circle(LOW.r), [circle(0.12).reverse()]), thickness: 0.6, hub: 0.2, circles: [0.32], mark: [LOW.r * 0.6, 0], markSize: 0.08, spin: LOW.r, pieces: [{ kind: "cylinder", radius: 0.12, length: 0.75, at: [0, 0, -0.42] }] },
    { id: "board", kind: "box", size: [BOARD.l, BOARD.h, 0.7] },
  ],
  driver: { part: "top", type: "rotation", range: RANGE, initial: 0 },
  target: "board", // 被送進的木板
  view: { direction: [0.03, 0.05, 1] },
  pose(a) {
    const f = feed(a);
    return { parts: { top: { angle: a }, low: { angle: f.low }, board: { position: [BOARD.x0 + f.travel, BOARD.y, 0] } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["top", "board"], reason: "上滾子的齒咬進木板的上緣(原圖齒尖壓進木板),齒尖穿入 0.04(96 個取樣中 91 個)" },
  ],
};

// 測試用
export const geometry = { TOP, LOW, BITE_R };
