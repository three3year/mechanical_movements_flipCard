// 噴射泵(第 475、476 種)共用:蒸汽從噴嘴朝排水管噴出,帶走腔室裡的空氣,在吸水管裡造成真空,水便被吸上來、連續地往上送。
// 沒有活動零件;主動件是虛擬的「進程」(蒸汽一直噴著),水與蒸汽以沿固定路徑移動的點表示。
import { stream } from "./flow.js";

/** 由蒸汽路徑與水路徑做出 pose:steam、water 都是 3D 折線的陣列 */
export function ejectorPose(v, { steam, water }) {
  const travel = v * 6;
  return {
    parts: {},
    flows: [
      { fluid: "steam", points: steam.flatMap((p) => stream(p, travel * 1.6, { spacing: 0.14 })) },
      { fluid: "water", points: water.flatMap((p) => stream(p, travel, { spacing: 0.18 })) },
    ],
    readouts: [],
  };
}
