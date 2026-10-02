// 第 64 種:跳躍運動。底部的蝸桿帶動蝸輪 B;蝸輪軸上套著空心軸 A,A 上固定一個蝸牛形凸輪。
// 蝸輪軸上的銷 C 從空心軸被切掉的那一小段伸出,推著 A 與凸輪走;壓在凸輪上的彈簧(經一根搖臂與滾子)
// 一邊被慢慢頂起,一邊把空心軸推回頂住銷。走到凸輪的陡降處,壓力方向改變,凸輪突然往前掉落、
// 停住,直到銷再次追上它。
import { deg, TAU } from "./kit.js";
import { wormJump } from "./worm-jump.js";

const FALL = deg(55);
const PUSH = TAU - FALL;
const REST = deg(10); // A 剛落定時的轉角
const R0 = 0.7;
const R1 = 1.12;
const ROLLER = 0.12;
const ARM = { pivot: [-3.6, R1 + ROLLER - 0.15, 0.6], length: 3.6 };

// 凸輪局部角 ψ 處的半徑:從靜止時滾子下方的角度起,往 −ψ 方向慢慢升高,再陡降回去
const PSI0 = Math.PI / 2 - REST;
export const camRadius = (psi) => {
  const s = (((PSI0 - psi) % TAU) + TAU) % TAU;
  return s < PUSH ? R0 + ((R1 - R0) * s) / PUSH : R1 - ((R1 - R0) * (s - PUSH)) / FALL;
};
const outline = Array.from({ length: 240 }, (_, i) => {
  const a = (i / 240) * TAU;
  const r = camRadius(a);
  return [r * Math.cos(a), r * Math.sin(a)];
});

const rollerHeight = (hollow) => camRadius(Math.PI / 2 - hollow) + ROLLER;

const jump = wormJump({
  figure: 64,
  fall: FALL,
  push: PUSH,
  rest0: REST,
  hollowLabel: "A",
  pinLabel: "C",
  hollowPieces: [{ kind: "plate", shape: { outline, holes: [] }, thickness: 0.22, at: [0, 0, 0.05], mark: [0, -0.5], markSize: 0.08 }],
  extraParts: [
    {
      id: "arm",
      kind: "group",
      center: ARM.pivot,
      arrow: false,
      pieces: [
        { kind: "box", size: [ARM.length, 0.12, 0.08], at: [ARM.length / 2, 0, 0] },
        { kind: "cylinder", radius: ROLLER, length: 0.2, at: [ARM.length, 0, 0] },
        { kind: "cylinder", radius: 0.05, length: 0.2, at: [0, 0, 0] },
      ],
    },
    {
      id: "spring",
      kind: "tube",
      points: [
        [-3.9, 2.35, 0.6],
        [-2.6, 2.35, 0.6],
        [-1.6, 2.2, 0.6],
        [-0.9, 1.75, 0.6],
        [-0.55, 1.62, 0.6],
        [-0.35, 1.75, 0.6],
        [-0.42, 1.95, 0.6],
      ],
      radius: 0.05,
    },
  ],
  extraPose: (hollow) => {
    const h = rollerHeight(hollow) - ARM.pivot[1];
    return { arm: { angle: Math.asin(h / ARM.length) } };
  },
});

export const { hollowAt, period } = jump;
export default jump.def;
