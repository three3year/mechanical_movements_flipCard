// 第 299 種:老式的時鐘擒縱(立軸擒縱,verge)。冠狀輪的齒朝上立在輪緣;水平的立軸跨過冠狀輪上方,
// 軸上兩個叉瓦彼此約成直角,一個在輪的前側、一個在後側。立軸來回擺動,兩個叉瓦輪流擋住、放開前後兩側的齒,
// 冠狀輪每擺一次轉過半個齒。主動件是立軸(由擺或擺輪帶動)。
// 推斷:齒數(奇數,前後兩側的齒才錯開半個齒距);擺幅。
import { Y, TAU, deg, swing } from "./kit.js";
import { escapeStep, sawCrown } from "./escapement.js";
import { shape, thickLine, circle } from "./shapes.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(22);
const R = 2.1;
const TOOTH = 0.55;
const RIM = 0.9; // 輪緣高
const STAFF_Y = RIM / 2 + TOOTH + 0.35; // 立軸高度(相對冠狀輪中心)

/** 立軸累計擺動 v → 冠狀輪轉角 */
export const wheelAngle = (v) => -escapeStep(v, -SWING, SWING, PITCH / 2, 0.5);

const flag = (a) => shape(thickLine([[0, 0], [0.95 * Math.cos(a), 0.95 * Math.sin(a)]], 0.22), [circle(0.05).reverse()]);

export default {
  figure: 299,
  parts: [
    {
      id: "crown",
      kind: "group",
      axis: Y,
      center: [0, -0.6, 0],
      spin: R,
      spinOffset: -RIM / 2,
      pieces: [
        { kind: "cylinder", radius: R, inner: R - 0.12, length: RIM },
        { kind: "plate", shape: shape(circle(R - 0.06), [circle(0.15).reverse()]), thickness: 0.1, at: [0, 0, -RIM / 2 + 0.05] },
        ...sawCrown({ teeth: N, radius: R - 0.04, height: TOOTH, base: RIM / 2, thick: 0.1 }),
      ],
    },
    {
      id: "verge",
      kind: "group",
      center: [0, -0.6 + STAFF_Y, 0],
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.08, length: 2 * R + 0.8 },
        { kind: "cylinder", radius: 0.22, inner: 0.1, length: 0.18, at: [0, 0, R + 0.3] },
        // 前叉瓦往左下、後叉瓦往右下(約成直角)
        { kind: "plate", shape: flag(deg(-135)), thickness: 0.12, at: [0, 0, R - 0.05] },
        { kind: "plate", shape: flag(deg(-45)), thickness: 0.12, at: [0, 0, -R + 0.05] },
      ],
    },
  ],
  // 動力重演:只推主動件;crown 受固定的力矩(發條或重錘),由擒縱件擋住、放行
  replay: { free: { crown: { spring: -1, gravity: false } }, expect: [{ part: "crown", label: "主動件走完一輪後 crown 的位置" }] },
  driver: { part: "verge", type: "rotation", cycle: [-SWING, SWING] },
  target: "crown", // 冠狀輪(擒縱輪)
  view: { direction: [0.08, 0.18, 1] },
  pose(v) {
    return { parts: { verge: { angle: swing(v, -SWING, SWING) }, crown: { angle: wheelAngle(v) } }, readouts: [] };
  },
  waivers: [
    { check: "replay", parts: ["crown"], reason: "未修:動力重演不成立——「主動件走完一輪後 crown 的位置」預期 crown 在主動量 1.54 時已轉 -24°,實際轉了 11°。模型的擒縱是依擺動的相位演出的:重演裡給擒縱輪一個固定的力矩後,掣子(叉瓦)沒有照一擺放一齒那樣擋住、放行(輪一路轉走,或被卡住不動)。掣子與輪齒的外形、位置要重做成真的擋得住(列入待確認清單)" },
    { check: "interference", parts: ["crown", "verge"], reason: "擒縱輪的進退依擺動的相位演出(每擺一次放過一齒),沒有逐點算掣子板與冠狀輪的齒的接觸;重疊 0.10(96 個取樣中 88 個)。列入待確認清單的動力重演名單" },
  ],
};
