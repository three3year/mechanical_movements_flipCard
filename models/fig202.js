// 第 202 種:蝸桿(無端螺桿)與蝸輪,是第 31 種的變形(原書誤作第 30 種,依 507movements 更正),用在需要穩定或極大力量的地方。蝸桿做成中間細、兩端粗的
// 沙漏形,沿著蝸輪的圓周包住它,同時與好幾個齒咬合,所以穩固、能傳大力。蝸桿每轉一圈,蝸輪轉過一齒。主動件是蝸桿。
// 推斷:齒數依原圖約 48;螺紋的剖面(三條疊起的凸條,做成梯形的螺牙)。
// 沙漏形蝸桿的螺紋是繞蝸輪圓周的螺旋(原圖蝸桿上的斜紋):蝸桿轉 φ,螺紋在蝸輪中央平面上沿蝸輪圓周走 φ / N,
// 所以每一段螺紋都對著蝸輪的一個齒槽,轉起來螺紋往一側走、推著齒槽裡的齒。
import { TAU, X } from "./kit.js";
import { pedestal } from "./supports.js";
import { gearSize } from "./shapes.js";

const N = 48;
const RW = 2.3;
const THROAT = 0.5;
const C = RW + THROAT; // 兩軸距離
const HALF = 1.3; // 蝸桿半長

/** 蝸桿轉 theta(繞 +x):蝸輪的轉角(每轉一圈一齒) */
export const wheelAngle = (theta) => -theta / N;
export const geometry = { N };

// 以蝸輪中心為圓心、半徑 ρ 的圓繞蝸桿軸轉一圈得到的環面:在蝸輪角 ψ(從正下方量起,往 +x 為正)處,
// 離蝸桿軸 C − ρ·cos ψ、沿蝸桿軸 ρ·sin ψ。蝸桿的芯是 ρ 比齒頂圓大一點的環面(沙漏形),
// 螺紋是三條沿螺旋 ψ = φ / N 的凸條(φ 是蝸桿上的角),由芯往蝸輪伸進齒槽:外寬內窄,貼著齒側
const { addendum, dedendum } = gearSize(RW, N);
const CORE = RW + addendum + 0.035; // 芯:離齒頂留一點間隙
const RIDGES = [
  { rho: CORE - 0.01, radius: 0.07 },
  { rho: RW + 0.03, radius: 0.08 },
  { rho: RW - dedendum + 0.065, radius: 0.045 }, // 螺牙頂:離齒根留一點間隙
];
const toWorm = (rho, psi) => [C - rho * Math.cos(psi), rho * Math.sin(psi)]; // [離蝸桿軸, 沿蝸桿軸]

const profile = [[0, -HALF]];
for (let i = 0; i <= 64; i++) {
  const psi = Math.asin(HALF / CORE) * (2 * i / 64 - 1);
  const [r, z] = toWorm(CORE, psi);
  profile.push([r, z]);
}
profile.push([0, HALF]);

// 蝸桿局部座標:z 沿蝸桿軸(世界 x),φ = 0 朝蝸輪(局部 +y);φ 增加的方向就是蝸桿轉動的正向
const STEP = TAU / 24;
const thread = ({ rho, radius }) => {
  const end = N * Math.asin((HALF - radius) / rho);
  const points = [];
  for (let phi = -end; phi <= end + 1e-9; phi += STEP) {
    const [r, z] = toWorm(rho, phi / N);
    points.push([-r * Math.sin(phi), r * Math.cos(phi), z]);
  }
  return { kind: "tube", points, radius };
};

const FLOOR = -C - 1.1; // 蝸桿(沙漏形)最低處之下
export default {
  figure: 202,
  parts: [
    { id: "wheel", kind: "gear", teeth: N, radius: RW, width: 0.3, bore: 0.18 },
    {
      id: "worm",
      kind: "group",
      center: [0, -C, 0],
      axis: X,
      // 轉向箭頭繞在右邊露出的軸上(放在蝸桿中段會和螺紋疊在一起)
      spin: 0.3,
      spinOffset: 1.85,
      pieces: [
        { kind: "lathe", profile },
        ...RIDGES.map(thread),
        { kind: "cylinder", radius: 0.16, length: 5.2, mark: true },
      ],
    },
    {
      id: "frame",
      kind: "group",
      pieces: [
        // 推斷(原圖只畫出軸頭):蝸輪的固定軸與軸承座、蝸桿兩端的軸承與立柱
        { kind: "cylinder", radius: 0.17, length: 1.3, at: [0, 0, -0.5] },
        ...pedestal({ at: [0, 0], z: -0.95, bore: 0.17, floor: FLOOR }), // 在蝸桿後面
        ...[-2.35, 2.35].flatMap((x) => [
          { kind: "cylinder", axis: X, radius: 0.28, inner: 0.16, length: 0.2, at: [x, -C, 0] },
          { kind: "box", size: [0.2, -C - 0.26 - FLOOR, 0.2], at: [x, (-C - 0.26 + FLOOR) / 2, 0] },
        ]),
        { kind: "box", size: [5.6, 0.12, 1.6], at: [0, FLOOR - 0.06, -0.3] },
      ],
    },
  ],
  driver: { part: "worm", type: "rotation", speed: 4 },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    // 蝸桿轉角 0 時,螺紋在正下方的齒槽裡(齒 i 在局部角 i·2π/N,正下方差半個齒距)
    return { parts: { worm: { angle: theta }, wheel: { angle: Math.PI / N + wheelAngle(theta) } }, readouts: [] };
  },
};
