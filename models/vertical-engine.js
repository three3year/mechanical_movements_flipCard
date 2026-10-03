// 直立蒸汽引擎(第 326–331 種)共用:下方汽缸裡的活塞經活塞桿推動十字頭,十字頭經連桿帶動上方的曲柄(飛輪軸)。
// 汽缸內的蒸汽以流體示意(ADR-0002):正在推活塞的那一側充滿蒸汽(填色),蒸汽沿進汽管流進那一側;
// 另一側排汽。全是曲柄轉角的純函式。
import { Y } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";

/**
 * 曲柄與滑塊:曲柄心 crank、半徑 r,連桿長 rod;十字頭沿 x = crank[0] 的直線,在曲柄下方。
 * theta 是曲柄轉角(從 +x 量起,逆時針為正)。回傳曲柄銷與十字頭高度。
 */
export function crankSlider(crank, r, rod, theta) {
  const pin = [crank[0] + r * Math.cos(theta), crank[1] + r * Math.sin(theta), 0];
  const dx = pin[0] - crank[0];
  const y = pin[1] - Math.sqrt(rod * rod - dx * dx);
  return { pin, y };
}

/** 汽缸零件(縱向,上端 top、內長 length、內半徑 radius;剖開前半看得到裡面)、兩室的蒸汽填色、活塞 */
export function cylinderParts({ x, top, length, radius, prefix = "" }) {
  const bottom = top - length;
  return [
    {
      id: `${prefix}cylinder`,
      kind: "lathe",
      axis: Y,
      center: [x, bottom, 0],
      profile: [[0.12, length + 0.12], [radius + 0.12, length + 0.12], [radius + 0.12, -0.12], [0, -0.12], [0, 0], [radius, 0], [radius, length], [0.12, length]],
      ...backHalf(Y),
    },
    { id: `${prefix}steamUp`, kind: "fill", fluid: "steam", shape: "cylinder", size: [2 * radius - 0.04, length, 0], level: 0 },
    { id: `${prefix}steamDown`, kind: "fill", fluid: "steam", shape: "cylinder", size: [2 * radius - 0.04, length, 0], level: 0 },
    { id: `${prefix}piston`, kind: "cylinder", axis: Y, radius: radius - 0.02, length: 0.22 },
  ];
}

/**
 * 汽缸的姿勢:活塞高度 piston;downward 為活塞正往下走(上室進汽),否則下室進汽。
 * progress 讓進汽的點沿進汽管流動。
 */
export function cylinderPose({ x, top, length, radius, prefix = "" }, piston, downward, progress) {
  const bottom = top - length;
  const pistonTop = piston + 0.11;
  const pistonBottom = piston - 0.11;
  const port = downward ? top - 0.15 : bottom + 0.15;
  const pipe = [[x + radius + 0.7, top + 0.5, 0.2], [x + radius + 0.7, port, 0.2], [x, port, 0.2]];
  return {
    parts: {
      [`${prefix}piston`]: { position: [x, piston, 0] },
      [`${prefix}steamUp`]: { position: [x, pistonTop + length / 2, 0], level: downward ? Math.max(0, top - pistonTop) / length : 0 },
      [`${prefix}steamDown`]: { position: [x, bottom + length / 2, 0], level: downward ? 0 : Math.max(0, pistonBottom - bottom) / length },
    },
    flows: [{ fluid: "steam", points: stream(pipe, progress * 6, { spacing: 0.2 }) }],
  };
}

/** 進汽管(固定在汽缸側面,流體示意的點沿著它走) */
export const steamPipe = ({ x, top, length, radius }) => ({
  kind: "group",
  pieces: [
    { kind: "box", size: [0.14, length + 0.5, 0.14], at: [x + radius + 0.7, top - length / 2 + 0.25, 0.2] },
    { kind: "box", size: [0.7, 0.12, 0.12], at: [x + radius + 0.35, top - 0.15, 0.2] },
    { kind: "box", size: [0.7, 0.12, 0.12], at: [x + radius + 0.35, top - length + 0.15, 0.2] },
  ],
});
