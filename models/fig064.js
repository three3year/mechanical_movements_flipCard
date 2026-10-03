// 第 64 種:跳躍運動。底部的蝸桿帶動蝸輪 B;蝸輪軸上套著空心軸 A,A 上固定一個蝸牛形凸輪。
// 蝸輪軸上的銷 C 從空心軸被切掉的那一小段伸出,推著 A 與凸輪走;壓在凸輪上的彈簧(經一根搖臂與滾子)
// 一邊被慢慢頂起,一邊把空心軸推回頂住銷。走到凸輪的陡降處,壓力方向改變,凸輪突然往前掉落、
// 停住,直到銷再次追上它。搖臂的樞軸在左端,滾子在右端、永遠貼在凸輪面上(由接觸算搖臂角);
// 板彈簧固定在左上的座上,自由端壓在搖臂上。
import { deg, TAU } from "./kit.js";
import { thickLine } from "./shapes.js";
import { wormJump } from "./worm-jump.js";

const FALL = deg(55);
const PUSH = TAU - FALL;
const REST = deg(10); // A 剛落定時的轉角
const R0 = 0.55; // 凸輪最小、最大半徑(比蝸輪小,蝸輪的齒露在外圈)
const R1 = 0.98;
const ROLLER = 0.12;
const ARM = { pivot: [-3.3, R1 + ROLLER - 0.12, 0.6], length: 3.3, thickness: 0.12 };
const SPRING = { root: [-3.45, 2.05, 0.6], tip: [2.55, -0.85] }; // 自由端(相對於固定端)壓在搖臂上

// 凸輪局部角 ψ 處的半徑:從靜止時滾子下方的角度起,往 −ψ 方向慢慢升高,再陡降回去
const PSI0 = Math.PI / 2 - REST;
export const camRadius = (psi) => {
  const s = (((PSI0 - psi) % TAU) + TAU) % TAU;
  return s < PUSH ? R0 + ((R1 - R0) * s) / PUSH : R1 - ((R1 - R0) * (s - PUSH)) / FALL;
};
const SAMPLES = 240;
const outline = Array.from({ length: SAMPLES }, (_, i) => {
  const a = (i / SAMPLES) * TAU;
  const r = camRadius(a);
  return [r * Math.cos(a), r * Math.sin(a)];
});

/** 搖臂的轉角:滾子從上方往下擺,停在第一次碰到凸輪面的位置(凸輪轉角 hollow) */
export function armAngle(hollow) {
  const cos = Math.cos(hollow);
  const sin = Math.sin(hollow);
  const touching = (a) => {
    const cx = ARM.pivot[0] + ARM.length * Math.cos(a);
    const cy = ARM.pivot[1] + ARM.length * Math.sin(a);
    if (Math.hypot(cx, cy) < camRadius(Math.atan2(cy, cx) - hollow)) return true; // 滾子中心陷進凸輪裡
    for (const [x, y] of outline) {
      const wx = x * cos - y * sin;
      const wy = x * sin + y * cos;
      if ((wx - cx) ** 2 + (wy - cy) ** 2 < ROLLER * ROLLER) return true;
    }
    return false;
  };
  let hi = 0.35; // 一定沒碰到
  let lo = -0.35; // 一定碰到
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (touching(mid)) lo = mid;
    else hi = mid;
  }
  return hi;
}

// 板彈簧的自由端貼在搖臂上緣:整片繞固定端轉一個小角度
function springAngle(arm) {
  const [tx, ty] = SPRING.tip;
  const d = Math.hypot(tx, ty);
  const beta = Math.atan2(ty, tx);
  let a = 0;
  for (let i = 0; i < 3; i++) {
    const x = SPRING.root[0] + d * Math.cos(beta + a);
    const top = ARM.pivot[1] + (x - ARM.pivot[0]) * Math.tan(arm) + ARM.thickness / 2 + 0.03;
    a = Math.asin(Math.max(-1, Math.min(1, (top - SPRING.root[1]) / d))) - beta;
  }
  return a;
}

const springShape = thickLine(
  [
    [0, 0],
    [0.5, 0.02],
    [1.1, -0.12],
    [1.7, -0.55],
    [2.2, -0.8],
    [SPRING.tip[0], SPRING.tip[1]],
    [2.74, -0.7],
    [2.62, -0.55],
  ],
  0.06,
);

const jump = wormJump({
  figure: 64,
  fall: FALL,
  push: PUSH,
  rest0: REST,
  hollowLabel: "A",
  pinLabel: "C",
  hollowPieces: [{ kind: "plate", shape: { outline, holes: [] }, thickness: 0.22, at: [0, 0, 0.05], mark: [0, -0.4], markSize: 0.08 }],
  extraParts: [
    {
      id: "arm",
      kind: "group",
      center: ARM.pivot,
      arrow: false,
      pieces: [
        { kind: "box", size: [ARM.length, ARM.thickness, 0.08], at: [ARM.length / 2, 0, 0] },
        { kind: "cylinder", radius: ROLLER, length: 0.2, at: [ARM.length, 0, 0] },
        { kind: "cylinder", radius: 0.05, length: 0.2, at: [0, 0, 0] },
      ],
    },
    { id: "spring", kind: "plate", center: SPRING.root, shape: { outline: springShape, holes: [] }, thickness: 0.16, arrow: false },
    { id: "springSeat", kind: "box", size: [0.5, 0.22, 0.3], center: [SPRING.root[0] - 0.2, SPRING.root[1] + 0.02, 0.6] },
    { id: "armPost", kind: "box", size: [0.16, 0.5, 0.3], center: [ARM.pivot[0], ARM.pivot[1] - 0.35, 0.6] },
  ],
  extraPose: (hollow) => {
    const arm = armAngle(hollow);
    return { arm: { angle: arm }, spring: { angle: springAngle(arm) } };
  },
});

export const { hollowAt, period } = jump;
export default jump.def;
