// 第 379 種(條目 379–380):可攜式夾鉗鑽。進料螺桿在 C 形夾鉗的下臂、與鑽頭相對:工件夾在螺桿頂端的墊塊與鑽頭之間,
// 轉動上臂的曲柄,鑽頭心軸旋轉;進料螺桿把墊塊與工件往上頂向鑽頭。主動件是曲柄;機構共用部分見 cramp-drill.js。
// 推斷:進料隨鑽頭的轉動以固定的量前進(原文只說螺桿與鑽頭相對)、工件(原圖沒畫)。
// 開始時工件頂面離鑽尖 0.15,行程中段碰到鑽尖,之後鑽頭鑽進工件(原圖墊塊離鑽尖很近)。
// 鑽頭比上一版加長(原圖鑽尖約在兩臂中間);墊塊照原圖是扁平的板;握把照原圖直立在曲柄臂上。
import { Y, TAU, clamp } from "./kit.js";
import { frame, crankPieces, feedOf, MAX, PITCH } from "./cramp-drill.js";

const SCREW_Y0 = -0.47; // 起始時進料螺桿頂端(墊塊底面)的高度
const WORM = 2.2; // 螺桿長:行程中一直旋在下臂裡
const PAD = 0.12; // 墊塊厚
const WORK = 0.25; // 工件厚

export default {
  figure: 379,
  parts: [
    frame,
    {
      id: "drill",
      kind: "group",
      axis: Y,
      center: [0.25, 1.9, 0],
      spin: 0.3,
      pieces: [
        { kind: "cylinder", role: "spindle", radius: 0.07, length: 1.6, at: [0, 0, -0.3] },
        { kind: "cylinder", radius: 0.25, length: 0.5, at: [0, 0, -0.6] },
        { kind: "lathe", role: "bit", profile: [[0, -1.85], [0.06, -1.7], [0.08, -0.85], [0, -0.85]] },
        ...crankPieces(0.5),
      ],
    },
    {
      id: "screw",
      kind: "group",
      axis: Y,
      spin: 0.3, // 進給螺桿也在轉:看得出轉向
      pieces: [
        { kind: "worm", role: "worm", radius: 0.12, length: WORM, pitch: PITCH, thread: 0.04, at: [0, 0, -WORM / 2] },
        // 頂端扁平的墊塊(局部 y 是深度、局部 z 是上下)
        { kind: "box", role: "pad", size: [0.6, 0.45, PAD], at: [0, 0, PAD / 2] },
        // 下端的 T 形手柄:中間的轂套著螺桿下端,兩邊是圓球握把
        { kind: "cylinder", role: "hub", radius: 0.14, length: 0.3, at: [0, 0, -WORM - 0.05] },
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.06, length: 1.3, at: [0, 0, -WORM - 0.05] },
        { kind: "sphere", radius: 0.15, at: [0.65, 0, -WORM - 0.05] },
        { kind: "sphere", radius: 0.15, at: [-0.65, 0, -WORM - 0.05] },
      ],
    },
    { id: "work", kind: "box", size: [1.2, WORK, 0.8] },
  ],
  powered: ["screw"], // 外力來源:進給螺桿是操作的人另外轉動的(模型把它和鑽頭的轉動連在同一個主動量上)
  driver: { part: "drill", type: "rotation", range: [0, MAX], initial: 0 },
  target: "work", // 被頂向鑽頭的工件
  view: { direction: [0.08, 0.06, 1] },
  pose(theta0) {
    const theta = clamp(theta0, 0, MAX);
    const f = feedOf(theta);
    return {
      parts: {
        drill: { angle: theta },
        // 右旋螺紋旋在下臂的螺孔裡:從下面看順時針轉一圈,往上一個螺距
        screw: { position: [0.25, SCREW_Y0 + f, 0], angle: (f / PITCH) * TAU },
        work: { position: [0.25, SCREW_Y0 + f + PAD + WORK / 2, 0] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["drill", "work"], reason: "鑽頭鑽進工件是這個機構的作用:鑽頭與工件重疊是鑽出的孔(孔沒有畫出來)" },
  ],
};
