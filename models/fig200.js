// 第 200 種:從單一驅動輪在同一軸上得到兩種不同速度的方式。直立軸上有兩個面對面的傘齒輪:上面的大輪裝在套筒上,
// 下面的小輪固定在軸上。右邊斜放的驅動傘齒輪同時與兩者咬合(上緣碰大輪、下緣碰小輪),斜放是為了讓兩個接觸點
// 落在不同的半徑上。大輪與小輪因此反向轉,而且轉速不同(與半徑成反比)。主動件是驅動輪。
// 推斷:三個節錐共用一個錐頂(在直立軸上),由兩個接觸點的位置求出;齒數。
import { meshAngle, bevelGear } from "./gears.js";

const M = 0.1;
const UPPER = { teeth: 35, radius: 1.75, y: 1.0 }; // 大輪:接觸圓在 y = 1.0
const LOWER = { teeth: 23, radius: 1.15 };
const DRIVE_TEETH = 21;
const RD = (DRIVE_TEETH * M) / 2;
// 兩個接觸點(在 xy 平面,軸右側):驅動輪的節圓以它們為直徑兩端
const PU = [UPPER.radius, UPPER.y, 0];
const PL = [LOWER.radius, UPPER.y - Math.sqrt((2 * RD) ** 2 - (UPPER.radius - LOWER.radius) ** 2), 0];
const MID = [(PU[0] + PL[0]) / 2, (PU[1] + PL[1]) / 2, 0];
// 錐頂:PU、PL 的垂直平分線與直立軸(x = 0)的交點
const along = [PU[0] - PL[0], PU[1] - PL[1]];
const APEX = [0, MID[1] + (MID[0] * along[0]) / along[1], 0];
const coneOf = (r, d) => Math.atan2(r, d);
const toApex = (p) => Math.hypot(p[0] - APEX[0], p[1] - APEX[1]);
const DRIVE_AXIS = [APEX[0] - MID[0], APEX[1] - MID[1], 0];

export const upper = bevelGear({ apex: APEX, axis: [0, -1, 0], teeth: UPPER.teeth, radius: UPPER.radius, cone: coneOf(UPPER.radius, PU[1] - APEX[1]), width: 0.4 });
export const lower = bevelGear({ apex: APEX, axis: [0, 1, 0], teeth: LOWER.teeth, radius: LOWER.radius, cone: coneOf(LOWER.radius, APEX[1] - PL[1]), width: 0.4 });
export const drive = bevelGear({ apex: APEX, axis: DRIVE_AXIS, teeth: DRIVE_TEETH, radius: RD, cone: coneOf(RD, Math.sqrt(toApex(PU) ** 2 - RD * RD)), width: 0.4 });

const bevel = (id, g, extra = {}) => ({ id, kind: "gear", center: g.center, axis: g.axis, teeth: g.teeth, radius: g.radius, cone: g.cone, width: g.width, ...extra });

export default {
  figure: 200,
  parts: [
    bevel("drive", drive, { pieces: [{ kind: "cylinder", radius: 0.1, length: 3.4, at: [0, 0, -0.9] }] }),
    // 上方大輪裝在套筒上,下方小輪固定在軸上
    bevel("upper", upper, { pieces: [{ kind: "cylinder", radius: 0.3, length: 0.9, at: [0, 0, -0.65] }] }),
    bevel("lower", lower, { pieces: [{ kind: "cylinder", radius: 0.14, length: 5.0, at: [0, 0, 1.6] }] }),
  ],
  driver: { part: "drive", type: "rotation" },
  view: { direction: [0.3, 0.25, 1] },
  pose(angle) {
    const u = meshAngle(drive, upper, angle, PU);
    const l = meshAngle(drive, lower, angle, PL);
    return {
      parts: { drive: { angle }, upper: { angle: u }, lower: { angle: l } },
      readouts: [{ label: "軸(下輪)/套筒(上輪)轉速", value: (UPPER.radius / LOWER.radius).toFixed(2) }],
    };
  },
};
