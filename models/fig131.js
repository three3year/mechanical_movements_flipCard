// 第 131 種:圓盤上的曲柄銷在開槽臂的槽內作動;開槽臂與下方的齒扇形段是一體,繞扇形段的樞軸擺動。
// 圓盤轉動時臂(連同扇形段)來回擺,扇形段帶動底部的齒條往復直線運動。主動件是圓盤。
// 圓盤的軸與扇形段的樞軸銷都往後伸進一塊立板的軸承(原圖畫出了軸心與樞軸,立板是推斷)。
import { deg, polar, add } from "./kit.js";
import { pedestal } from "./supports.js";
import { angleOf } from "./linkage.js";
import { rackOffset, circularPitch } from "./gears.js";
import { shape, circle, stadium } from "./shapes.js";

const DISC = { center: [0, 1.15, 0], radius: 1.35, pin: 0.95 };
const PIVOT = [0.0, -0.75, 0];
const SECTOR = { center: PIVOT, teeth: 36, radius: 1.3 };
const PITCH = circularPitch(SECTOR);
const RACK = { origin: [0, PIVOT[1] - SECTOR.radius, 0], dir: [1, 0, 0], pitch: PITCH };
const START = deg(-10);
const ARM0 = angleOf(PIVOT, add(DISC.center, polar(DISC.pin, START)));

/** 圓盤轉 theta:臂(扇形段)相對原位的轉角與齒條的位置 */
export function swingRack(theta) {
  const pin = add(DISC.center, polar(DISC.pin, START + theta));
  const arm = angleOf(PIVOT, pin) - ARM0;
  return { pin, arm, x: rackOffset(SECTOR, RACK, arm) };
}

// 扇形段在下方(局部 −90° 附近);開槽臂朝原位的曲柄銷方向伸出
const span = [deg(-145), deg(-35)];
const armDir = ARM0;
const slotLen = 3.1; // 槽夠長:銷走到最遠處也不頂到槽底

export default {
  figure: 131,
  parts: [
    {
      id: "disc",
      kind: "group",
      center: DISC.center,
      spin: DISC.radius,
      pieces: [
        { kind: "plate", shape: shape(circle(DISC.radius), [circle(0.12).reverse()]), thickness: 0.1, at: [0, 0, -0.2], circles: [0.38] },
        { kind: "cylinder", radius: 0.14, length: 0.6, at: [...polar(DISC.pin, START).slice(0, 2), 0], accent: true },
        { kind: "cylinder", radius: 0.12, length: 1.1, at: [0, 0, -0.65] }, // 軸:往後伸進軸承
      ],
    },
    {
      id: "sector",
      kind: "group",
      center: PIVOT,
      arrow: false,
      pieces: [
        { kind: "gear", teeth: SECTOR.teeth, radius: SECTOR.radius, span, width: 0.2 },
        {
          kind: "plate",
          shape: shape(stadium(slotLen + 0.2, 0.62).outline.map(([x, y]) => [x - 0.1, y]), [stadium(slotLen - 0.95, 0.3).outline.map(([x, y]) => [x + 0.75, y]).reverse()]),
          thickness: 0.12,
          angle: armDir,
          at: [0, 0, 0.12],
        },
        { kind: "cylinder", radius: 0.32, inner: 0.15, length: 0.35 },
        { kind: "cylinder", radius: 0.15, length: 0.9, at: [0, 0, -0.35] }, // 樞軸:往後伸進軸承
      ],
    },
    {
      id: "rack",
      kind: "group",
      pieces: [
        { kind: "rack", teeth: 21, pitch: PITCH, depth: 0.12, width: 0.25, at: [0, RACK.origin[1], 0] },
        { kind: "box", size: [21 * PITCH + 1.4, 0.32, 0.25], at: [0, RACK.origin[1] - 0.28, 0] },
      ],
    },
    {
      id: "guides",
      kind: "group",
      pieces: [
        ...[-3.1, 3.1].map((x) => ({ kind: "plate", shape: shape([[-0.25, -0.5], [0.25, -0.5], [0.25, 0.5], [-0.25, 0.5]], [circle(0.07, 0, 0.3).reverse(), circle(0.07, 0, -0.3).reverse()]), thickness: 0.1, at: [x, RACK.origin[1] - 0.25, 0.2] })),
        // 圓盤軸與扇形段樞軸的軸承(在後面)
        ...pedestal({ at: [DISC.center[0], DISC.center[1]], z: -1.05, bore: 0.12, floor: RACK.origin[1] - 0.8 }),
        ...pedestal({ at: [PIVOT[0], PIVOT[1]], z: -0.65, bore: 0.15, floor: RACK.origin[1] - 0.8 }),
      ],
    },
  ],
  driver: { part: "disc", type: "rotation" },
  target: "rack",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const { arm, x } = swingRack(theta);
    return { parts: { disc: { angle: theta }, sector: { angle: arm }, rack: { position: [x, 0, 0] } }, readouts: [] };
  },
};

