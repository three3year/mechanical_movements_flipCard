// 第 380 種(條目 379–380):可攜式夾鉗鑽。鑽頭心軸穿過上臂進料螺桿的中心:轉動曲柄,鑽頭旋轉;進料螺桿(上面有
// 一根橫柄)旋在上臂的螺孔裡往下走,下端頂著心軸上的夾頭,把鑽頭往下送進工件。工件放在 C 形夾鉗下臂的墊塊位置上。
// 主動件是曲柄;機構共用部分見 cramp-drill.js。
// 推斷:進料隨鑽頭的轉動以固定的量前進(原文只說心軸穿過螺桿中心)、螺桿與夾頭之間的止推面。
// 進料螺桿是中空的(孔沒畫出來),心軸從中間穿過、上下兩端都露出來;開始時鑽尖離工件 0.2,行程後段鑽進工件。
// 鑽頭(連心軸與曲柄)從上往下看順時針轉:右旋的鑽頭要這樣轉才切削。進料螺桿是右旋,從上看順時針轉才往下送;
// 它和鑽頭各自轉(螺桿只用下端面推夾頭,傳不了轉動),兩者的轉向互不牽動。
import { Y, TAU, clamp } from "./kit.js";
import { frame, crankPiecesAt, feedOf, MAX, PITCH, ARMS } from "./cramp-drill.js";

const TOP = 2.95; // 起始時心軸頂(曲柄臂底面)的高度
const SCREW_Y0 = 0.275; // 起始時進料螺桿下端的高度(頂著夾頭)
const WORM = 2.33; // 螺桿長:行程中一直旋在上臂裡
const CHUCK = [-3.075, -2.675]; // 夾頭在心軸局部座標的上下範圍(頂面 = 螺桿下端)

export default {
  figure: 380,
  parts: [
    frame,
    {
      id: "feedScrew",
      kind: "group",
      axis: Y,
      spin: 0.35, // 進料螺桿也在轉:看得出轉向
      spinOffset: 1.25, // 箭頭在上臂下方露出來的那段螺桿上
      pieces: [
        { kind: "worm", role: "worm", radius: 0.16, length: WORM, pitch: PITCH, thread: 0.05, at: [0, 0, WORM / 2] },
        // 螺桿頂的軸環(心軸從中間的孔穿過)與裝在它兩側的橫柄。偏離插圖:原圖的橫柄是一根橫穿螺桿頂的桿,
        // 心軸從螺桿中心穿過,一根橫穿的桿會擋住心軸,所以拆成插在軸環兩側的兩截(推斷)
        { kind: "cylinder", radius: 0.2, inner: 0.06, length: 0.18, at: [0, 0, WORM + 0.045] },
        ...[-1, 1].map((s) => ({ kind: "cylinder", axis: [1, 0, 0], radius: 0.05, length: 0.65, at: [s * 0.475, 0, WORM + 0.045] })),
      ],
    },
    {
      id: "drill",
      kind: "group",
      axis: Y,
      spin: 0.3,
      pieces: [
        { kind: "cylinder", role: "spindle", radius: 0.06, length: 2.7, at: [0, 0, -1.35] },
        { kind: "cylinder", role: "chuck", radius: 0.2, length: CHUCK[1] - CHUCK[0], at: [0, 0, (CHUCK[0] + CHUCK[1]) / 2] },
        { kind: "lathe", role: "bit", profile: [[0, -4.175], [0.05, -4.0], [0.07, CHUCK[0]], [0, CHUCK[0]]] },
        ...crankPiecesAt(0),
      ],
    },
    { id: "work", kind: "box", center: [0.25, ARMS.lower[1] + 0.1, 0], size: [1.2, 0.2, 0.8] },
  ],
  // 外力來源:進料螺桿是操作的人另外轉動的(模型把它和鑽頭的轉動連在同一個主動量上);它只用下端面推著夾頭往下,
  // 傳不了轉動,和曲柄之間沒有實體相連(同第 379 種的 screw)
  powered: ["feedScrew"],
  // 主動量就是鑽頭的轉角(拖曲柄時跟著指標走):從上看順時針是負的,所以範圍是 [−MAX, 0]、往負的方向進料
  driver: { part: "drill", type: "rotation", range: [-MAX, 0], initial: 0 },
  target: "feedScrew", // 把鑽頭心軸往下送的進料螺桿
  view: { direction: [0.08, 0.06, 1] },
  pose(theta0) {
    const theta = clamp(theta0, -MAX, 0);
    const f = feedOf(-theta); // 曲柄從上看順時針轉了 −theta
    return {
      parts: {
        drill: { angle: theta, position: [0.25, TOP - f, 0] }, // 從上往下看順時針(繞 +Y 負轉)
        // 右旋螺紋旋在上臂的螺孔裡:從上面看順時針轉一圈,往下一個螺距
        feedScrew: { angle: -(f / PITCH) * TAU, position: [0.25, SCREW_Y0 - f, 0] },
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["drill", "work"], reason: "鑽頭鑽進工件是這個機構的作用:鑽頭與工件重疊是鑽出的孔(孔沒有畫出來)" },
  ],
};
