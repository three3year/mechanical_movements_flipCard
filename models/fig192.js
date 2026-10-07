// 第 192 種:曼格輪的一種變形(另一種見第 36 種)。輪面上的齒槽與引導小齒輪軸的溝槽 b、d 都偏離輪心:
// 外緣的大齒圈以輪心左下方的一點為圓心,內緣繞著輪轂的齒圈也略偏;小齒輪沿外緣與內緣來回時,
// 它離輪心的距離一直在變,所以輪在每一部分的轉速都不同。主動件是小齒輪(原圖未畫,這裡畫在輪心正下方)。
// 推斷:小齒輪的齒數與大小;小齒輪軸只沿輪心正下方的直線升降;兩端半圓上也排齒。
import { deg, TAU, rot2 } from "./kit.js";
import { manglePath, arcLength, cap, arcPoint, belowHub } from "./mangle-path.js";
import { circle } from "./shapes.js";
import { pedestal } from "./supports.js";
import { pinionDrive } from "./pinion-drive.js";
import { toothedLoop, resample } from "./noncircular.js";

const OUTER = { c: [-0.35, -0.15], r: 2.25, from: deg(95), to: deg(410) };
const INNER = { c: [-0.3, -0.08], r: 1.0, from: deg(50), to: deg(-260) };
const SEGMENTS = [
  { arc: OUTER.c, r: OUTER.r, from: OUTER.from, to: OUTER.to },
  cap(arcPoint(OUTER.c, OUTER.r, OUTER.to), arcPoint(INNER.c, INNER.r, INNER.from)),
  { arc: INNER.c, r: INNER.r, from: INNER.from, to: INNER.to },
  cap(arcPoint(INNER.c, INNER.r, INNER.to), arcPoint(OUTER.c, OUTER.r, OUTER.from)),
];
const NP = 10;
const NT = Math.round(arcLength(SEGMENTS) / 0.24);
const PITCH = arcLength(SEGMENTS) / NT;
const RP = (NP * PITCH) / TAU;
const path = manglePath(SEGMENTS, RP);

export const mangle = path.at;
export const period = path.period;
export const pinionRadius = RP;
const START = path.driveWhere(belowHub);

const pitchLoop = resample(path.pitch.slice(0, -1), 0.02);
const M = PITCH / Math.PI;
const slot = toothedLoop(pitchLoop, { pitch: PITCH, addendum: M, dedendum: 1.2 * M, start: 0, into: -1 });
// 溝槽 b、d 的標籤位置(輪的局部座標):d 在外側溝的上端,b 在內側溝的上端
const TAGS = { d: [-0.05, 2.45], b: [0.02, 0.62] };

// 小齒輪的驅動軸往前下方伸到固定的萬向接頭(見 pinion-drive.js);輪裝在固定的軸上,軸往後進到軸承座(推斷)
const DRIVE = pinionDrive({ fixed: [0, -3.7, 2.2], floor: -4.2 });

export default {
  figure: 192,
  parts: [
    {
      id: "wheel",
      kind: "plate",
      shape: { outline: circle(2.95), holes: [[...slot].reverse(), circle(0.14).reverse()] },
      thickness: 0.22,
      engrave: [path.centers.slice(0, -1)],
      circles: [2.82, 0.4],
      hub: 0.3,
      mark: [1.6, 2.0],
      markSize: 0.1,
      spin: 2.95,
    },
    { id: "pinion", kind: "gear", teeth: NP, radius: RP, width: 0.3, web: false, pieces: [{ kind: "cylinder", radius: 0.08, length: 0.9 }] },
    DRIVE.part,
    DRIVE.joint,
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.13, length: 1.0, at: [0, 0, -0.42] }, // 輪的固定軸
        ...pedestal({ at: [0, 0], z: -0.78, bore: 0.13, floor: -4.2 }),
        ...DRIVE.pieces,
      ],
    },
    { id: "tagD", kind: "group", pieces: [], arrow: false, label: "d" },
    { id: "tagB", kind: "group", pieces: [], arrow: false, label: "b" },
  ],
  driver: { part: "pinion", type: "rotation", initial: START * path.sense, speed: 2.5 },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(alpha) {
    const { wheel, y, pinion } = mangle(alpha * path.sense);
    const tag = (p) => [...rot2(p, wheel), 0.3];
    return {
      parts: {
        wheel: { angle: wheel },
        pinion: { position: [0, y, 0], angle: path.phase(NP) + pinion },
        ...DRIVE.pose([0, y, 0.5]),
        tagD: { position: tag(TAGS.d) },
        tagB: { position: tag(TAGS.b) },
      },
      readouts: [],
    };
  },
};
