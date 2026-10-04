// 第 202 種:蝸桿(無端螺桿)與蝸輪,是第 30 種的變形,用在需要穩定或極大力量的地方。蝸桿做成中間細、兩端粗的
// 沙漏形,沿著蝸輪的圓周包住它,同時與好幾個齒咬合,所以穩固、能傳大力。蝸桿每轉一圈,蝸輪轉過一齒。主動件是蝸桿。
// 推斷:螺紋以一圈圈的環表示(原圖的直線紋);齒數依原圖約 48。
import { TAU, X } from "./kit.js";

const N = 48;
const RW = 2.3;
const PITCH = (TAU * RW) / N;
const THROAT = 0.5;
const C = RW + THROAT; // 兩軸距離
const HALF = 1.3; // 蝸桿半長
const DEPTH = 0.12;

/** 蝸桿轉 theta(繞 +x):蝸輪的轉角(每轉一圈一齒) */
export const wheelAngle = (theta) => -theta / N;
export const geometry = { N };

// 沙漏形蝸桿:半徑 = 中心距 − 蝸輪在該處的半徑,再加上鋸齒形的螺紋
const profile = [[0, -HALF - 0.01]];
const steps = Math.round((2 * HALF) / PITCH) * 8;
for (let i = 0; i <= steps; i++) {
  const z = -HALF + (2 * HALF * i) / steps;
  const base = C - Math.sqrt(RW * RW - z * z);
  const u = (((z + HALF) / PITCH) % 1 + 1) % 1;
  const ridge = u < 0.5 ? u * 2 : (1 - u) * 2;
  profile.push([base + DEPTH * (ridge - 0.5), z]);
}
profile.push([0, HALF + 0.01]);

export default {
  figure: 202,
  parts: [
    { id: "wheel", kind: "gear", teeth: N, radius: RW, width: 0.3, bore: 0.18 },
    {
      id: "worm",
      kind: "group",
      center: [0, -C, 0],
      axis: X,
      spin: 0.9,
      pieces: [
        { kind: "lathe", profile },
        { kind: "cylinder", radius: 0.16, length: 5.2, mark: true },
      ],
    },
  ],
  driver: { part: "worm", type: "rotation", speed: 4 },
  target: "wheel",
  view: { direction: [0.06, 0.05, 1] },
  pose(theta) {
    return { parts: { worm: { angle: theta }, wheel: { angle: Math.PI / N / 2 + wheelAngle(theta) } }, readouts: [] };
  },
};
