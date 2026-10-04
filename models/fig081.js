// 第 81 種:缺齒式正齒輪 A 連續旋轉,使齒條桿 B 做交替方向的直線運動:A 的齒咬住齒條時把桿往上推、
// 壓縮螺旋彈簧 C;齒一離開齒條,彈簧便把桿推回原位。主動件是 A(順時針,原圖箭頭)。
// 彈回的過程演出來:齒脫離後桿從靜止起步、越來越快地被彈簧推回、到底停住(jumps.falling),佔 A 轉角約 52°
// (推斷:原文只說「推回原位」;A 的缺齒段有 235°,彈回在其中完成,之後桿停著等下一次咬合)。
import { TAU, deg } from "./kit.js";
import { falling } from "./jumps.js";

const N = 23;
const R = 0.75;
const P_ANGLE = TAU / N;
const PITCH = R * P_ANGLE; // 齒條的齒距
const T = 8; // 有齒的齒數
const J0 = 12; // 第一個齒的編號:咬合從順時針轉角 0 開始
const C_START = J0 * P_ANGLE - P_ANGLE / 2 - Math.PI;
const SPAN = T * P_ANGLE;
const RETURN = deg(52); // 彈簧把桿推回去所需的轉角
const RACK_X = -R;
const SPRING_TOP = 3.1;

/** A 順時針轉 c:齒條桿 B 往上的位移(咬合時 = 節圓上轉過的弧長,脫離後彈簧推回 0) */
export function rackRise(c) {
  const t = c - C_START;
  const u = t - Math.floor(t / TAU) * TAU;
  if (u <= SPAN) return R * u;
  return R * SPAN * (1 - falling((u - SPAN) / RETURN));
}
export const stroke = R * SPAN;
export const engagedSpan = SPAN;

// 齒條的齒:桿的局部座標 y = k·齒距(A 的齒在 y = 0 處咬合時,齒條的齒槽正好對著它)
const rackTeeth = Array.from({ length: T + 4 }, (_, i) => {
  const k = -T - 2 + i;
  return { kind: "box", size: [0.26, PITCH * 0.42, 0.2], at: [RACK_X - 0.13 + 0.04, k * PITCH, 0] };
});

export default {
  figure: 81,
  parts: [
    {
      id: "gear",
      kind: "gear",
      teeth: N,
      radius: R,
      width: 0.24,
      bore: 0.1,
      toothed: Array.from({ length: T }, (_, i) => J0 + i),
      label: "A",
      labelOffset: [0, 0.32, 0.3],
    },
    {
      id: "rack",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: [0, 1, 0], radius: 0.07, length: 5.6, at: [RACK_X - 0.36, 0.2, 0] },
        ...rackTeeth,
        { kind: "box", size: [0.12, (T + 4) * PITCH, 0.2], at: [RACK_X - 0.3, (-T / 2 - 0.5) * PITCH, 0] },
        { kind: "box", size: [0.6, 0.1, 0.4], at: [RACK_X - 0.36, 1.2, 0] },
        { kind: "box", size: [0.6, 0.1, 0.4], at: [RACK_X - 0.36, -2.4, 0] },
      ],
      label: "B",
      labelOffset: [RACK_X - 0.85, 1.0, 0.2],
    },
    { id: "spring", kind: "spring", radius: 0.22, coils: 9, wire: 0.035 },
    { id: "stop", kind: "box", center: [RACK_X - 0.36, SPRING_TOP, 0], size: [0.6, 0.1, 0.4] },
    { id: "labelC", kind: "group", center: [RACK_X + 0.15, 2.35, 0.2], label: "C" },
  ],
  // 動力重演:只推缺齒齒輪;齒條在導軌上自由滑動,由彈簧往回推
  replay: {
    // 從齒條在原位(缺齒段對著齒條)的時刻開始轉一圈
    from: -Math.PI,
    to: -3 * Math.PI,
    free: { rack: { slide: [0, 1, 0], spring: -1, limits: [0, 3] } },
    ignore: [["rack", "stop"], ["rack", "spring"]], // 擋止由 limits 代表,彈簧的力由 spring 代表
    expect: [
      // 上升的過程是齒輪咬合(齒形簡化,重演裡最後一齒會把桿多頂高一點),這裡只驗放開後有沒有回到原位
      { at: -3 * Math.PI, part: "rack", label: "齒離開後彈簧把桿推回原位", quote: "彈簧 C 把桿推回原位" },
    ],
  },
  driver: { part: "gear", type: "rotation", speed: -1.0, initial: -SPAN / 2 },

  target: "rack",
  view: { direction: [0.06, 0.05, 1] },
  pose(v) {
    const rise = rackRise(-v);
    return {
      parts: {
        gear: { angle: v },
        rack: { position: [0, rise, 0] },
        spring: { from: [RACK_X - 0.36, 1.29 + rise, 0], to: [RACK_X - 0.36, SPRING_TOP - 0.09, 0] }, // 兩端的鋼絲貼著座面,不陷進去
      },
      readouts: [],
    };
  },
  waivers: [
    { check: "interference", parts: ["gear", "rack"], reason: "簡化齒形:齒條的齒畫成方塊,缺齒輪的第一齒咬入時齒頂擦到齒條的齒 0.07(96 個取樣中 5 個);齒距相符、咬合時齒條位移等於節圓弧長" },
  ],
};
