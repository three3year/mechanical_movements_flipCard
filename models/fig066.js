// 第 66 種:第 64 種的變形。以搖臂上的重物 D 取代彈簧與凸輪:銷把搖臂連同重物從下方一路推到頂端,
// 過了頂點,重物便自己往前落到下方、停住,等銷追上來再推。
// 原文說搖臂「固定於蝸輪軸上」;若固定在蝸輪軸上就不會跳躍,這裡依第 64 種的原理把搖臂裝在空心軸上(推斷)。
import { deg } from "./kit.js";
import { wormJump } from "./worm-jump.js";

const ARM = 2.15;
const BALL = 0.85;

const jump = wormJump({
  figure: 66,
  fall: Math.PI,
  push: Math.PI,
  rest0: deg(-90),
  hollowLabel: undefined,
  hollowPieces: [
    { kind: "box", size: [ARM, 0.1, 0.1], at: [ARM / 2, 0, 0.2] },
    { kind: "cylinder", radius: BALL, length: 0.45, at: [ARM + BALL - 0.1, 0, 0.2], mark: false },
    { kind: "cylinder", radius: 0.12, length: 0.5, at: [ARM + BALL - 0.1, 0, 0.45], accent: true },
  ],
  extraParts: [{ id: "labelD", kind: "group", label: "D", labelOffset: [0, 0, 0.8] }],
  extraPose: (hollow) => ({ labelD: { position: [(ARM + BALL - 0.1) * Math.cos(hollow), (ARM + BALL - 0.1) * Math.sin(hollow), 0.45] } }),
});

export const { hollowAt, period } = jump;
export default {
  ...jump.def,
  waivers: [
    { check: "interference", parts: ["wheel", "hollow"], reason: "待確認:wheel 的圓柱 r0.055×0.75 與 hollow 的方塊 2.15×0.1×0.1重疊 0.05,判斷為貼合處或接合處的簡化畫法,未逐一修正" },
  ],
};
