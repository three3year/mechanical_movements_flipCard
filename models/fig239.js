// 第 239 種:用於正齒輪的擋止裝置(止動爪)的配置。齒輪上方左右各一支擋爪,外端以樞軸固定,內端的楔形尖頭靠彈簧壓在
// 齒間;轉動齒輪時齒把擋爪頂起、越過齒尖再落進下一個齒間,所以齒輪停下時總停在一個齒的位置上。主動件是齒輪。
// 推斷:原文只有一句;兩支擋爪都是止動爪(不分方向);彈簧與齒數依原圖;樞軸銷、彈簧座與齒輪軸的支座。
// 接觸(由接觸算,共用 pawl-drive.js):彈簧把爪尖往齒輪壓;齒把爪頂起多高、何時越過齒尖,由外形相碰算出,
// 越過之後爪從當下的速度起加速彈回、落進下一個齒間。
import { TAU, deg, rot2 } from "./kit.js";
import { shape, circle, gearProfile, gearSize, toothOutline } from "./shapes.js";
import { resample } from "./noncircular.js";
import { pawlDrive } from "./pawl-drive.js";
import { pedestal } from "./supports.js";

const N = 14;
const R = 1.55;
const { addendum, dedendum } = gearSize(R, N);
const TIP = R + addendum;
const ROOT = R - dedendum;
const PITCH = TAU / N;
// 擋爪:樞軸、尖頭落在哪一個齒間(齒輪轉角 0 時的方位)
const PAWLS = {
  left: { pivot: [-2.45, 0.6], gap: 4.5 * PITCH },
  right: { pivot: [3.4, 0.55], gap: 2.5 * PITCH },
};

// 擋爪的外形(局部座標:原點在樞軸,桿身沿 +x 到尖頭的根部):桿身,末端一個朝輪心的楔形尖頭
// (兩側斜度和齒槽差不多,伸得進齒間、不碰齒根)。以齒輪轉角 0、尖頭落在齒間時的世界座標畫,再換成局部座標
function pawlGeometry({ pivot, gap }) {
  const at = (r, w) => [r * Math.cos(gap) - w * Math.sin(gap), r * Math.sin(gap) + w * Math.cos(gap)];
  const root = at(TIP + 0.22, 0);
  const rest = Math.atan2(root[1] - pivot[1], root[0] - pivot[0]);
  const local = ([x, y]) => rot2([x - pivot[0], y - pivot[1]], -rest);
  const L = Math.hypot(root[0] - pivot[0], root[1] - pivot[1]);
  // 楔形尖頭(世界座標,沿半徑):外端寬、內端窄
  const tooth = [at(TIP + 0.28, -0.16), at(ROOT + 0.1, -0.05), at(ROOT + 0.1, 0.05), at(TIP + 0.28, 0.16)].map(local);
  // 桿身:從樞軸到尖頭的外端,兩側各 0.12
  const outline = [[-0.22, -0.12], [L - 0.2, -0.12], ...tooth.sort((a, b) => Math.atan2(a[1], a[0] - L) - Math.atan2(b[1], b[0] - L)), [L - 0.2, 0.12], [-0.22, 0.12]];
  return { rest, L, outline };
}
const GEO = { left: pawlGeometry(PAWLS.left), right: pawlGeometry(PAWLS.right) };

const gearObstacles = (theta) => [...Array.from({ length: N }, (_, i) => toothOutline({ teeth: N, radius: R }, i).map((p) => rot2(p, theta))), circle(ROOT - 0.01)];
// 齒輪是主動件:擋爪隨齒輪的轉角起落,每個齒距一個週期;彈簧把左爪往順時針、右爪往逆時針壓(尖頭朝齒輪)
const INTO = { left: -1, right: 1 };
const drive = pawlDrive({
  period: PITCH,
  samples: 360,
  pins: () => ({ left: PAWLS.left.pivot, right: PAWLS.right.pivot }),
  wheel: { obstacles: gearObstacles, angle: (t) => t },
  pawls: Object.fromEntries(
    ["left", "right"].map((w) => [w, { outline: GEO[w].outline, into: INTO[w], angle: GEO[w].rest, limits: [GEO[w].rest - deg(25), GEO[w].rest + deg(25)] }]),
  ),
});
/** 齒輪轉 theta:兩支擋爪的轉角,與被齒頂起的角度(0 為落在齒間) */
export const pawlAngles = (theta) => drive.at(theta).angles;
export const liftOf = (which, theta) => INTO[which] * (GEO[which].rest - drive.at(theta).angles[which]);
export const geometry = { N, PITCH, TIP, ROOT };
/** 檢查用:齒輪轉 theta 時兩支擋爪與齒輪的齒(世界座標 2D) */
export const contactAt = (theta) => {
  const s = drive.shapes(theta);
  return { pawls: [s.pawls.left, s.pawls.right], teeth: s.wheel };
};
// 彈簧:一端固定在機架上(SPRING_AT),另一端壓在爪背上(爪的局部座標)
const SPRING_AT = { left: [PAWLS.left.pivot[0] + 0.4, PAWLS.left.pivot[1] + 1.0], right: [PAWLS.right.pivot[0] - 0.8, PAWLS.right.pivot[1] + 0.95] };
const SPRING_ON = { left: [GEO.left.L * 0.55, 0.12], right: [GEO.right.L * 0.55, -0.12] };

const pawlPart = (which, id) => ({ id, kind: "plate", center: [...PAWLS[which].pivot, 0], shape: shape(GEO[which].outline, [circle(0.07).reverse()]), thickness: 0.12, arrow: false });

export default {
  figure: 239,
  parts: [
    { id: "gear", kind: "plate", shape: shape(resample(gearProfile({ teeth: N, radius: R }), 0.03), [circle(0.25).reverse()]), thickness: 0.2, hub: 0.55, circles: [0.55], mark: [-0.9, -0.4], markSize: 0.08, spin: TIP },
    pawlPart("left", "pawlLeft"),
    pawlPart("right", "pawlRight"),
    { id: "springLeft", kind: "rod", radius: 0.03 },
    { id: "springRight", kind: "rod", radius: 0.03 },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", radius: 0.25, length: 0.5, at: [0, 0, -0.25] }, // 齒輪軸
        ...pedestal({ at: [0, 0], z: -0.45, bore: 0.25, floor: -2.3 }),
        { kind: "cylinder", radius: 0.07, length: 0.6, at: [...PAWLS.left.pivot, -0.05] }, // 擋爪的樞軸銷
        { kind: "cylinder", radius: 0.07, length: 0.6, at: [...PAWLS.right.pivot, -0.05] },
        { kind: "cylinder", radius: 0.06, length: 0.55, at: [...SPRING_AT.left, -0.05] }, // 彈簧的固定座
        { kind: "cylinder", radius: 0.06, length: 0.55, at: [...SPRING_AT.right, -0.05] },
        { kind: "box", size: [7.4, 0.25, 0.12], at: [0.5, 2.2, -0.4] }, // 托住樞軸銷與彈簧座的橫樑(推斷)
        { kind: "box", size: [0.25, 1.85, 0.12], at: [PAWLS.left.pivot[0], (PAWLS.left.pivot[1] + 2.2) / 2, -0.4] },
        { kind: "box", size: [0.25, 1.9, 0.12], at: [PAWLS.right.pivot[0], (PAWLS.right.pivot[1] + 2.2) / 2, -0.4] },
        { kind: "box", size: [0.25, 0.75, 0.12], at: [SPRING_AT.left[0], (SPRING_AT.left[1] + 2.2) / 2, -0.4] },
        { kind: "box", size: [0.25, 0.75, 0.12], at: [SPRING_AT.right[0], (SPRING_AT.right[1] + 2.2) / 2, -0.4] },
      ],
    },
  ],
  // 動力重演:只轉齒輪;兩支擋爪鉸在銷上,彈簧把尖頭往齒輪壓,由齒頂起、越過後彈回
  replay: {
    to: 2 * PITCH,
    seconds: 12,
    free: { pawlLeft: { spring: -1, gravity: false }, pawlRight: { spring: 1, gravity: false } },
    expect: [
      { at: PITCH / 2, part: "pawlLeft", label: "齒把左爪頂起" },
      { at: PITCH, part: "pawlLeft", label: "左爪落進下一個齒間" },
      { at: PITCH / 2, part: "pawlRight", label: "齒把右爪頂起" },
      { at: 2 * PITCH, part: "pawlRight", label: "右爪落進齒間" },
    ],
  },
  driver: { part: "gear", type: "rotation", initial: deg(4) },
  targets: ["pawlLeft", "pawlRight"], // 兩支止動爪
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    const a = drive.at(theta).angles;
    const spring = (which, angle) => {
      const p = PAWLS[which].pivot;
      const [x, y] = rot2(SPRING_ON[which], angle);
      return { points: [[...SPRING_AT[which], 0.0], [p[0] + x, p[1] + y, 0.0]], closed: false };
    };
    return {
      parts: { gear: { angle: theta }, pawlLeft: { angle: a.left }, pawlRight: { angle: a.right } },
      paths: { springLeft: spring("left", a.left), springRight: spring("right", a.right) },
      readouts: [],
    };
  },
};
