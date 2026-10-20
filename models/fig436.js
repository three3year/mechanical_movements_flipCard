// 第 436 種:容瓦爾渦輪機。「導水槽」排在一個鼓輪的外側,以共同中心放射排列,固定在筒身(外殼)b 裡;
// 輪 c 的做法幾乎相同,但水斗比導水槽多,而且略呈切線方向而非放射方向排列,常用的曲線是擺線或拋物線。
// 主動件是虛擬的「進程」:水已帶著輪轉了幾圈。
// 推斷(依原圖):水從右上的水管進到筒身,往下穿過固定的導水槽 a,再穿過下面的輪 c,從筒身敞開的底部流出;
// 筒身往下包住導水槽與輪,底部有一道架在筒身內壁上的底橋(原圖是 V 形的托架,這裡畫成橫樑),橋中央是軸承座,
// 輪裝在直立軸的下端,軸穿過筒蓋伸到上面,下端立在底橋的軸承裡。外殼畫成剖面。
// 葉片(2026-10-20 重做):每片由三段板拼成彎的剖面(擺線或拋物線的近似)。導水槽放射狀、上段直立、
// 下段把水甩向輪轉的方向;水斗在平面上和半徑夾 15°(略呈切線方向),上段順著導水槽送來的水,下段把水轉回去,
// 反作用力推輪(從上往下看逆時針)。
import { TAU, Y, Z, deg, quatAxisAngle, quatMul, polar } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";

export const R = { case: 1.5, drum: 0.5 };
const TOP = 1.9;
const BOTTOM = -1.85;
// 一圈葉片:y 是圈的中心高度;skew 是葉片長軸和半徑方向的夾角(平面上);tilts 是由上到下各段的斜角——
// 往下的方向偏離鉛直,朝逆時針的切線方向為正;height 是整圈的高度
export const GUIDE = { y: -0.55, count: 14, skew: 0, tilts: [0, deg(22), deg(42)], height: 0.42 };
export const WHEEL = { y: -1.2, count: 20, skew: deg(15), tilts: [deg(30), deg(-8), deg(-45)], height: 0.42 };
const BRIDGE = { z: BOTTOM + 0.17, thick: 0.14, width: 0.4 }; // 底橋(橫樑)的中心高度、厚度、寬度
const BEAM_TOP = BRIDGE.z + BRIDGE.thick / 2;
const SPEED = TAU * 1.2;

/**
 * 一圈葉片(局部 z 是直立方向):第 i 片的中線在平面上通過半徑 mid、平面角 a 的點,方向是 a + skew,
 * 內端在半徑 r0、外端在半徑 r1(mid 與半長由 r0、r1、skew 解出);剖面照 tilts 分成幾段,每段一塊板,
 * 接在前一段的下端,中段的中心在中線上。內、外端各伸進輪轂與筒身一點,接成一件。
 */
const ring = ({ count, skew, tilts, height }, r0, r1, role) => {
  const sum = (r0 * r0 + r1 * r1) / 2; // mid² + half²
  const prod = (r1 * r1 - r0 * r0) / (4 * Math.cos(skew)); // mid × half
  const mid = (Math.sqrt(sum + 2 * prod) + Math.sqrt(sum - 2 * prod)) / 2;
  const half = (Math.sqrt(sum + 2 * prod) - Math.sqrt(sum - 2 * prod)) / 2;
  const h = height / tilts.length;
  // 各段在(切線 u、直立 w)面上的中心,再把中段的 u 挪到 0
  let u = 0;
  let w = height / 2;
  const mids = tilts.map((tilt) => {
    const seg = h / Math.cos(tilt);
    const m = [u + (seg / 2) * Math.sin(tilt), w - h / 2, seg];
    u += seg * Math.sin(tilt);
    w -= h;
    return m;
  });
  const shift = mids[Math.floor(tilts.length / 2)][0];
  return Array.from({ length: count }, (_, i) => {
    const a = (i * TAU) / count;
    const dir = a + skew;
    const t = [-Math.sin(dir), Math.cos(dir)];
    const c = polar(mid, a);
    return tilts.map((tilt, k) => {
      const [mu, mw, seg] = mids[k];
      return {
        kind: "box",
        role,
        blade: i,
        size: [2 * half, 0.04, seg + 0.02],
        at: [c[0] + (mu - shift) * t[0], c[1] + (mu - shift) * t[1], mw],
        rotation: quatMul(quatAxisAngle(Z, dir), quatAxisAngle([1, 0, 0], tilt)),
      };
    });
  }).flat();
};

const INLET = [[3.0, 1.75, 0.3], [1.6, 1.1, 0.3], [0.9, 0.5, 0.4]];
const DOWN = [-0.9, 0.95].map((x) => [[x, 0.4, 0.4], [x, GUIDE.y, 0.4], [x * 0.95, WHEEL.y, 0.4], [x * 0.9, BOTTOM - 0.5, 0.4]]);

export default {
  figure: 436,
  parts: [
    {
      id: "casing",
      kind: "group",
      axis: Y, // 局部 z 是直立方向,局部 y 是世界的 −z
      label: "b",
      labelOffset: [-1.2, 0.9, 0.4],
      pieces: [
        // 筒身:下緣包到底橋,底部敞開(水從下面流出);頂是筒蓋,中央留軸孔
        { kind: "lathe", role: "shell", profile: [[R.case, BOTTOM], [R.case + 0.1, BOTTOM], [R.case + 0.1, TOP], [0.18, TOP], [0.18, TOP - 0.1], [R.case, TOP - 0.1]], ...backHalf(Y) },
        // 右上的進水管,接進筒身側面(世界座標繞 z 轉 −32°,換成局部座標是繞 y 轉 +32°)
        { kind: "box", role: "pipe", size: [1.8, 0.9, 0.7], at: [2.3, 0, 1.45], rotation: quatAxisAngle(Y, deg(32)) },
        // 固定的導水槽 a:鼓輪與一圈葉片,外端伸進筒身
        { kind: "cylinder", role: "drum", radius: R.drum, length: GUIDE.height, at: [0, 0, GUIDE.y] },
        ...ring(GUIDE, R.drum - 0.05, R.case + 0.05, "guide").map((p) => ({ ...p, at: [p.at[0], p.at[1], GUIDE.y + p.at[2]] })),
        // 底橋(推斷:原圖是 V 形托架,畫成橫樑)架在筒身內壁上,中央的軸承座托著軸的下端
        { kind: "box", role: "beam", size: [2 * Math.sqrt(R.case ** 2 - (BRIDGE.width / 2) ** 2), BRIDGE.width, BRIDGE.thick], at: [0, 0, BRIDGE.z] },
        { kind: "cylinder", role: "bearing", radius: 0.16, inner: 0.08, length: 0.12, at: [0, 0, BEAM_TOP + 0.06] },
      ],
    },
    { id: "labelA", kind: "group", label: "a", labelOffset: [-1.05, GUIDE.y + 0.35, 0.5], pieces: [] },
    { id: "water", kind: "fill", fluid: "water", shape: "cylinder", center: [0, (GUIDE.y + 1.25) / 2 + 0.15, 0], size: [2 * R.case - 0.06, 1.25 - GUIDE.y - 0.3, 0], level: 1 },
    {
      id: "wheel",
      kind: "group",
      axis: Y,
      center: [0, WHEEL.y, 0],
      label: "c",
      labelOffset: [0.05, -0.55, 0.6],
      spin: R.case + 0.1,
      pieces: [
        // 局部 z 是直立方向;軸從底橋的軸承一路穿過筒蓋伸到上面
        { kind: "cylinder", role: "shaft", radius: 0.08, length: TOP + 0.45 - BEAM_TOP, at: [0, 0, (TOP + 0.45 + BEAM_TOP) / 2 - WHEEL.y] },
        { kind: "cylinder", role: "hub", radius: R.drum, length: WHEEL.height },
        { kind: "cylinder", radius: 0.22, length: 0.14, at: [0, 0, TOP - WHEEL.y + 0.25], accent: true },
        // 水斗:裝在輪轂上,外端離筒身內壁 0.1(段的轉角伸出去一點,仍有 0.06 以上)
        ...ring(WHEEL, R.drum - 0.05, R.case - 0.1, "bucket"),
      ],
    },
  ],
  powered: ["wheel"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.15 },
  target: "wheel",
  view: { direction: [0.25, 0.35, 1] },
  pose(progress) {
    const a = TAU * progress;
    const travel = progress * SPEED;
    return {
      parts: { wheel: { angle: a } },
      flows: [{ fluid: "water", points: [...stream(INLET, travel, { spacing: 0.2 }), ...DOWN.flatMap((p) => stream(p, travel, { spacing: 0.2 }))] }],
      readouts: [],
    };
  },
};
