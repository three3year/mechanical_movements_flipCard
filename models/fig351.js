// 第 351 種:衝壓機(stamp)。水平旋轉軸上的缺齒小齒輪作用在桿的齒條上:有齒的那一段把桿抬起,
// 齒一脫離齒條,桿就落下,得到垂直的撞擊。主動件是缺齒小齒輪。
// 推斷:有齒段的齒數;桿落下時瞬間落到最低處(示意)。
import { TAU, deg } from "./kit.js";
import { circularPitch } from "./gears.js";

const N = 14;
const R = 0.75;
const SPAN = 8; // 有齒的齒數
const START = deg(-90); // 有齒段的起點(局部角)
const LEN = (SPAN * TAU) / N;
const CONTACT = Math.PI; // 接觸點在小齒輪左側
const RACK_X = -R;
const PITCH = circularPitch({ teeth: N, radius: R });
const TEETH = Array.from({ length: N }, (_, i) => i).filter((i) => {
  const a = ((i * TAU) / N - START + TAU * 4) % TAU;
  return a < LEN - 1e-9;
});

/** 小齒輪轉 theta(順時針為負,左側往上)→ 桿上升的高度(落下後歸零) */
export function stamp(theta) {
  const t = -theta - (CONTACT - START - LEN);
  const k = Math.floor(t / TAU);
  const u = t - k * TAU; // 這一圈裡,有齒段從開始咬合起轉過的角度
  return { lift: u < LEN ? u * R : 0, k, engaged: u < LEN };
}
// 讓齒條的齒槽在小齒輪的齒轉到接觸點時正好對著它(咬合的相位)
const BASE = -1.5 * PITCH;
export const geometry = { LEN, R };

export default {
  figure: 351,
  parts: [
    {
      id: "pinion",
      kind: "gear",
      teeth: N,
      radius: R,
      width: 0.25,
      bore: 0.1,
      toothed: TEETH,
      pieces: [{ kind: "cylinder", radius: 0.08, length: 0.8 }],
    },
    {
      id: "stamp",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "rack", teeth: 12, pitch: PITCH, width: 0.25, depth: 0.15, at: [0, 0, 0], angle: -Math.PI / 2 },
        { kind: "box", size: [0.4, 6.0, 0.25], at: [-0.42, 0.3, 0] },
        // 頂端與底端的軸環、底部的衝頭
        { kind: "box", size: [0.85, 0.22, 0.45], at: [-0.42, 2.5, 0] },
        { kind: "box", size: [0.85, 0.22, 0.45], at: [-0.42, -2.25, 0] },
        { kind: "lathe", axis: [0, 1, 0], profile: [[0, -3.25], [0.25, -3.25], [0.45, -3.0], [0.45, -2.8], [0.3, -2.6], [0, -2.6]], at: [-0.42, 0, 0] },
      ],
    },
    { id: "guides", kind: "group", pieces: [{ kind: "box", size: [0.15, 0.6, 0.6], at: [-1.05, 2.0, -0.2] }, { kind: "box", size: [0.15, 0.6, 0.6], at: [-1.05, -1.6, -0.2] }] },
  ],
  driver: { part: "pinion", type: "rotation", speed: -0.8 }, // 自動播放時順時針轉,把桿抬起
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const { lift } = stamp(theta);
    // 齒條的齒朝 +x(朝小齒輪),節線在 x = −R
    return { parts: { pinion: { angle: theta }, stamp: { position: [RACK_X, lift + BASE, 0] } }, readouts: [] };
  },
};
