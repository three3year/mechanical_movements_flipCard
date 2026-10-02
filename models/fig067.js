// 第 67 種:第 64 種的另一種變形。空心軸上固定一個月牙形的重物(擺錘)E,與蝸輪軸中的銷 C 組合運作:
// 銷把擺錘的重心從下方推到頂端,過了頂點,擺錘便自己往前翻落、停住,等銷追上來再推。
import { deg } from "./kit.js";
import { wormJump } from "./worm-jump.js";
import { arcPoints } from "./shapes.js";

// 月牙(馬蹄形):外圓 2.3、內圓 1.3,從右下的 −50° 繞過頂端到左側的 175°;重心約在兩端的中間方向
const ENDS = [deg(-50), deg(175)];
const COM = (ENDS[0] + ENDS[1]) / 2;
const crescent = [...arcPoints(2.3, ENDS[0], ENDS[1]), ...arcPoints(1.3, ENDS[1], ENDS[0])];

const jump = wormJump({
  figure: 67,
  fall: Math.PI,
  push: Math.PI,
  rest0: -Math.PI / 2 - COM, // 重心朝下
  hollowLabel: "E",
  pinLabel: "C",
  hollowPieces: [{ kind: "plate", shape: { outline: crescent, holes: [] }, thickness: 0.2, at: [0, 0, 0.2], mark: [1.8 * Math.cos(COM), 1.8 * Math.sin(COM)], markSize: 0.12 }],
});

export const { hollowAt, period } = jump;
export const centerOfMass = (hollow) => hollow + COM; // 重心的方向
export default jump.def;
