// 直立蒸汽引擎(第 326–346 種多張與第 421 種)共用:下方汽缸裡的活塞經活塞桿推動十字頭,十字頭經連桿帶動上方的曲柄(飛輪軸)。
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

export const WALL = 0.12; // 汽缸壁與上下蓋的厚度
const ROD_HOLE = 0.12; // 上蓋讓活塞桿穿過的孔的半徑
const FLANGE = 0.06; // 座底端的凸緣伸出汽缸外壁多少

/**
 * 汽缸零件(縱向,上端 top、內長 length、內半徑 radius;剖開前半看得到裡面)、兩室的蒸汽填色、活塞。
 * seat 是底座頂面的高度:汽缸下蓋底下接一段同外徑、底端帶凸緣的座,落到底座上(推斷;原圖汽缸蓋下就是台座)。
 * rodHole 是上蓋讓活塞桿(第 421 種是筒管)穿過的孔的半徑
 */
export function cylinderParts({ x, top, length, radius, seat, prefix = "", rodHole = ROD_HOLE }) {
  const bottom = top - length;
  const outer = radius + WALL;
  const drop = seat == null ? 0 : bottom - WALL - seat; // 座的高度
  const base = drop > 1e-9
    ? [[outer, -WALL - drop + FLANGE], [outer + FLANGE, -WALL - drop + FLANGE], [outer + FLANGE, -WALL - drop], [0, -WALL - drop]]
    : [[outer, -WALL], [0, -WALL]];
  return [
    {
      id: `${prefix}cylinder`,
      kind: "lathe",
      axis: Y,
      center: [x, bottom, 0],
      profile: [[rodHole, length + WALL], [outer, length + WALL], ...base, [0, 0], [radius, 0], [radius, length], [rodHole, length]],
      ...backHalf(Y),
    },
    { id: `${prefix}steamUp`, kind: "fill", fluid: "steam", shape: "cylinder", size: [2 * radius - 0.04, length, 0], level: 0 },
    { id: `${prefix}steamDown`, kind: "fill", fluid: "steam", shape: "cylinder", size: [2 * radius - 0.04, length, 0], level: 0 },
    { id: `${prefix}piston`, kind: "cylinder", axis: Y, radius: radius - 0.02, length: 0.22 },
  ];
}

/**
 * 進汽管的位置:直管在汽缸右邊 0.7、深度 pipeZ(汽缸剖開前半,管走在留下的後半;各圖照機架的位置給,預設 −0.15),
 * 上下兩根支管從直管往左接到汽缸後半的外壁(支管中心線的端點在外壁上)
 */
export function pipeLayout({ x, radius, pipeZ = -0.15 }) {
  const outer = radius + WALL;
  return { z: pipeZ, riser: x + radius + 0.7, wall: x + Math.sqrt(outer * outer - pipeZ * pipeZ) };
}

/**
 * 汽缸的姿勢:活塞高度 piston;downward 為活塞正往下走(上室進汽),否則下室進汽。
 * progress 讓進汽的點沿進汽管流動。
 */
export function cylinderPose(cyl, piston, downward, progress) {
  const { x, top, length, prefix = "" } = cyl;
  const bottom = top - length;
  const pistonTop = piston + 0.11;
  const pistonBottom = piston - 0.11;
  const port = downward ? top - 0.15 : bottom + 0.15;
  const { z, riser } = pipeLayout(cyl);
  const pipe = [[riser, top + 0.5, z], [riser, port, z], [x, port, z]];
  return {
    parts: {
      [`${prefix}piston`]: { position: [x, piston, 0] },
      [`${prefix}steamUp`]: { position: [x, pistonTop + length / 2, 0], level: downward ? Math.max(0, top - pistonTop) / length : 0 },
      [`${prefix}steamDown`]: { position: [x, bottom + length / 2, 0], level: downward ? 0 : Math.max(0, pistonBottom - bottom) / length },
    },
    flows: [{ fluid: "steam", points: stream(pipe, progress * 6, { spacing: 0.2 }) }],
  };
}

/** 進汽管(固定在汽缸後半的側面,流體示意的點沿著它走) */
export function steamPipe(cyl) {
  const { top, length } = cyl;
  const { z, riser, wall } = pipeLayout(cyl);
  const branch = (y) => ({ kind: "box", size: [riser - wall, 0.12, 0.12], at: [(riser + wall) / 2, y, z] });
  return {
    kind: "group",
    pieces: [{ kind: "box", size: [0.14, length + 0.5, 0.14], at: [riser, top - length / 2 + 0.25, z] }, branch(top - 0.15), branch(top - length + 0.15)],
  };
}

const HUB_LAP = 0.02; // 轂兩端多伸出去、和活塞桿與橫桿重疊的長度

/** 十字頭上套住活塞桿頂端的轂:從活塞桿那一層(rodZ ± rodHalf)往前伸到橫桿的背面 barBack,讓活塞桿與十字頭接成一件 */
export function rodHub({ rodZ, rodHalf, barBack, radius }) {
  const from = rodZ - rodHalf - HUB_LAP;
  const to = barBack + HUB_LAP;
  return { kind: "cylinder", radius, length: to - from, at: [0, 0, (from + to) / 2] };
}
