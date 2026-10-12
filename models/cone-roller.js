// 第 262–263 種共用(端視圖與側視圖):螺桿 D 上偏心地裝著錐體 B,摩擦滾子 C 由重物(或彈簧)壓在錐體頂上。
// 螺桿在固定的螺帽 E 中轉動,每轉一圈連同錐體沿軸前進一個螺距。照原圖,錐體與 E 之間是光軸、螺紋從 E 的左邊
// 一點點開始穿過 E 往右伸出一長段,所以錐體是往左走、離開 E(螺紋往左穿過 E):滾子從靠大端處一路壓到靠小端處。
// 錐體偏心地轉,滾子被頂起又落下(往復);錐體同時往左走,滾子壓在錐面越來越細的部位,每次頂起都比上一次低,
// 往上的行程比往下的行程短(原文「朝某一方向的運動比另一方向短」),而滾子在錐面上畫出一條與螺桿同螺距的螺旋線。
// 滾子被錐面摩擦帶著轉,轉速隨接觸處離螺桿軸的遠近一直變。
// 主動件是螺桿 D。螺桿是右旋,轉向取負(從右端看順時針)時往左前進。
// 推斷:錐體尺寸、偏心量與螺距(依原圖比例);滾子的叉、立桿、導架與壓在立桿頂上的重物(原文說彈簧或重物;
// 原圖滾子上方只畫到滾子與它的軸):叉的兩片夾在滾子兩側托住銷的兩端,叉頂接立桿,立桿穿過導套,
// 導架從底座上錐體掃不到的一側(偏心轉動的錐體掃過半徑約 1.97)立起、再橫伸到滾子上方。
import { X, TAU, clamp, screwAdvance } from "./kit.js";

export const PITCH = 0.32;
const ECC = 0.42; // 錐體軸偏離螺桿軸的距離
const CONE = { big: 1.55, small: 0.82, length: 3.1 }; // 大端半徑、小端半徑、長(大端在 −X)
const ROLLER = 0.28;
const ROLLER_WIDTH = 0.1; // 滾子窄:錐面有斜度,寬的滾子只有大端那一側的邊緣碰得到錐面
const XC = -1.75; // 滾子所在的位置(固定)
const TURNS = 7;
export const RANGE = [0, TURNS * TAU];
const START = 0.1; // 起點時滾子在離大端 10% 錐長處;轉完 7 圈走到約 82%(小端附近)
const X0 = XC - START * CONE.length + CONE.length / 2; // 主動量 0 時錐體中心的位置
const GAP_E = 1.0; // 起點時錐體小端到螺帽 E 的光軸長度(依原圖比例)
const NUT_LEN = 0.35;
const NUT = X0 + CONE.length / 2 + GAP_E + NUT_LEN / 2; // 螺帽 E 的位置
// 螺紋:起點時從 E 左邊 0.4 開始,往右伸出整個行程再多 0.4;走完全程時左端仍在 E 的左邊
const TRAVEL = TURNS * PITCH;
const THREAD = { from: NUT - 0.4, to: NUT + TRAVEL + 0.4 }; // 起點時的範圍
const STUB = 0.45; // 螺桿從錐體大端往左伸出的軸頭(原圖)
// 叉、立桿、導套(滾子中心為原點的局部座標;導套是世界座標)
const FORK = { cheek: 0.18, top: 0.46, bottom: -0.1 }; // 叉板在滾子兩側 x ±0.18,從銷下方到叉頂
const STEM_TOP = 2.5;
const GUIDE = { bottom: 2.75, top: 3.25 }; // 導套的高度(滾子最高時叉頂在 2.65、最低時立桿頂在 3.36)
const POST_Z = -2.15; // 導架立柱在錐體掃不到的一側
const FLOOR = -2.24; // 底座頂面

/** 錐體中心在 cx 時,位置 xp 的錐面半徑 */
const coneRadius = (cx, xp) => {
  const f = clamp((xp - (cx - CONE.length / 2)) / CONE.length, 0, 1);
  return CONE.big + (CONE.small - CONE.big) * f;
};

/** 螺桿轉 theta(主動量;螺桿實際的轉角是 −theta):錐體中心位置、錐軸的偏心、滾子中心高度與接觸處 */
export function cone(theta0) {
  const theta = clamp(theta0, ...RANGE);
  const phi = -theta; // 螺桿與錐體繞 +X 的轉角:右旋螺紋,轉角為負時往 −X 前進
  const cx = X0 + screwAdvance(phi, PITCH);
  // 錐軸繞螺桿軸轉:偏心向量在 yz 平面,theta = 0 時朝上(原圖端視圖螺桿 D 在錐體中心 B 的下方)
  const ey = ECC * Math.cos(phi);
  const ez = ECC * Math.sin(phi);
  // 滾子的每個截面(x 固定)是半徑 ROLLER 的圓、錐體的截面是半徑 r(x) 的圓;滾子只能沿 y 上下,
  // 停在第一次碰到錐面的高度:錐面往大端(−X)變粗,所以碰到的是滾子靠大端那一側的邊緣
  const r = coneRadius(cx, XC - ROLLER_WIDTH / 2);
  const yc = ey + Math.sqrt((r + ROLLER) ** 2 - ez * ez); // 滾子中心高度
  // 接觸點:在兩截面圓心的連線上,離錐軸 r
  const d = Math.hypot(yc - ey, ez);
  const contact = [ey + ((yc - ey) * r) / d, ez + ((0 - ez) * r) / d];
  return { theta, phi, cx, ey, ez, yc, contact, top: yc - ROLLER };
}

// 滾子的轉角:接觸處沒有滑動,滾子輪緣的切向速度 = 錐面(繞螺桿軸轉)在接觸處的切向速度,
// 再扣掉滾子中心上下移動帶來的切向分量。對主動量積分(先算好一張累積表,姿勢只查表內插)。
const STEP = 0.004;
const table = (() => {
  const n = Math.ceil(RANGE[1] / STEP);
  const out = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    const a = cone(i * STEP);
    const b = cone((i + 1) * STEP);
    const m = cone((i + 0.5) * STEP);
    const [py, pz] = m.contact;
    const [ny, nz] = [(m.yc - py) / ROLLER, (0 - pz) / ROLLER]; // 接觸點往滾子中心的單位向量
    const dphi = b.phi - a.phi;
    const coneT = dphi * (pz * nz + py * ny); // 錐面的位移在切線 (−nz, ny) 上的分量
    const centerT = -(b.yc - a.yc) * nz; // 滾子中心(只沿 y)的位移在切線上的分量
    out[i + 1] = out[i] + (centerT - coneT) / ROLLER;
  }
  return out;
})();
export function rollerAngle(theta0) {
  const t = clamp(theta0, ...RANGE) / STEP;
  const i = Math.min(table.length - 2, Math.floor(t));
  return table[i] + (table[i + 1] - table[i]) * (t - i);
}
export const geometry = { XC, ROLLER, NUT };

/** 建立第 figure 種的定義;view 是初始視角 */
export function coneRoller(figure, view) {
  const profile = [[0, -CONE.length / 2], [CONE.big, -CONE.length / 2], [CONE.small, CONE.length / 2], [0, CONE.length / 2]];
  // 兩端面另以薄圓板蓋上:旋轉體的端面法線會被錐面抹成漸層
  const ends = [
    { kind: "cylinder", radius: CONE.big - 0.002, length: 0.02, at: [0, 0, -CONE.length / 2 - 0.005] },
    { kind: "cylinder", radius: CONE.small - 0.002, length: 0.02, at: [0, 0, CONE.length / 2 + 0.005] },
  ];
  // 螺桿(局部 z = 世界 x,原點在螺紋段中心):螺紋段之外是光軸,從錐體大端外的軸頭穿過錐體一直到螺紋段
  const threadLen = THREAD.to - THREAD.from;
  const threadMid = (THREAD.from + THREAD.to) / 2; // 起點時
  const shaftFrom = X0 - CONE.length / 2 - STUB;
  const shaftTo = THREAD.from + 0.05;
  // 導架與導套(世界座標)
  const guideMid = (GUIDE.bottom + GUIDE.top) / 2;
  const guideLen = GUIDE.top - GUIDE.bottom;
  const baseX = [Math.min(X0 - TRAVEL, X0) - CONE.length / 2 - STUB - 0.15, THREAD.to + 0.1];
  return {
    figure,
    parts: [
      {
        id: "base",
        kind: "group",
        pieces: [
          // 底座往 −z 加寬,托住導架的立柱
          { kind: "box", size: [baseX[1] - baseX[0], 0.12, 3.75], at: [(baseX[0] + baseX[1]) / 2, FLOOR - 0.06, -0.575] },
          // 螺帽 E 的支架
          { kind: "plate", shape: { outline: [[NUT - 0.55, -2.25], [NUT + 0.55, -2.25], [NUT + 0.14, -1.6], [NUT + 0.14, -0.3], [NUT - 0.14, -0.3], [NUT - 0.14, -1.6]], holes: [] }, thickness: 0.4 },
          { kind: "cylinder", axis: X, radius: 0.3, length: NUT_LEN, at: [NUT, 0, 0] },
          // 滾子的導架(推斷):立柱從底座上錐體掃不到的一側立起,頂上一根橫臂伸到滾子正上方
          { kind: "box", size: [0.12, GUIDE.top - FLOOR, 0.12], at: [XC, (GUIDE.top + FLOOR) / 2, POST_Z] },
          { kind: "box", size: [0.1, 0.12, -0.11 - (POST_Z - 0.06)], at: [XC, GUIDE.top - 0.1, (POST_Z - 0.06 - 0.11) / 2] },
          // 導套:四片板圍住立桿,涵蓋滾子整個升降
          ...[-1, 1].map((k) => ({ kind: "box", size: [0.06, guideLen, 0.22], at: [XC + k * 0.08, guideMid, 0] })),
          ...[-1, 1].map((k) => ({ kind: "box", size: [0.1, guideLen, 0.06], at: [XC, guideMid, k * 0.08] })),
        ],
        label: "E",
        labelOffset: [NUT, 0.55, 0.3],
      },
      {
        id: "screwD",
        kind: "worm",
        axis: X,
        radius: 0.13,
        length: threadLen,
        pitch: PITCH,
        thread: 0.04,
        label: "D",
        labelOffset: [0.6, -0.35, 0.35],
        pieces: [{ kind: "cylinder", radius: 0.09, length: shaftTo - shaftFrom, at: [0, 0, (shaftFrom + shaftTo) / 2 - threadMid] }],
      },
      { id: "coneB", kind: "lathe", axis: X, profile, pieces: ends, mark: true, label: "B", labelOffset: [-0.6, 0.75, 0], arrow: false },
      {
        id: "rollerC",
        kind: "cylinder",
        axis: X,
        radius: ROLLER,
        length: ROLLER_WIDTH,
        mark: true,
        spin: ROLLER,
        label: "C",
        labelOffset: [0.45, 0.5, 0.3],
      },
      {
        // 滾子的叉與立桿(推斷):叉的兩片夾在滾子兩側托住銷的兩端,叉頂接立桿;立桿頂上壓著重物
        id: "stemC",
        kind: "group",
        pieces: [
          { kind: "cylinder", axis: X, radius: 0.05, length: 0.5 }, // 滾子的銷(滾子套在銷上轉)
          ...[-1, 1].map((k) => ({ kind: "box", size: [0.06, FORK.top - FORK.bottom, 0.16], at: [k * FORK.cheek, (FORK.top + FORK.bottom) / 2, 0] })),
          { kind: "box", size: [2 * FORK.cheek + 0.06, 0.08, 0.16], at: [0, FORK.top - 0.04, 0] },
          { kind: "box", size: [0.1, STEM_TOP - (FORK.top - 0.04), 0.1], at: [0, (STEM_TOP + FORK.top - 0.04) / 2, 0] },
          { kind: "box", size: [0.45, 0.3, 0.45], at: [0, STEM_TOP + 0.15, 0] }, // 重物
        ],
      },
    ],
    // 動力重演:只轉螺桿;滾子連同叉、立桿與重物沿導套上下、受重力,被偏心錐體頂起又落下(滾子被錐面摩擦帶著轉)
    replay: {
      to: 4 * Math.PI,
      seconds: 8,
      free: { stemC: { slide: [0, 1, 0] }, rollerC: { on: "stemC" } },
      ignore: [["stemC", "base"]], // 立桿在導套裡滑(重演不算立桿與導套壁的摩擦)
      expect: [
        { at: Math.PI, part: "stemC", label: "錐體轉半圈,偏心轉到螺桿下方,滾子落到最低" },
        { at: 2 * Math.PI, part: "stemC", label: "轉一圈,滾子又被頂起,但比起點低(錐體往左走了一個螺距,接觸處變細)" },
        { at: 3 * Math.PI, part: "stemC", label: "再轉半圈,滾子落得比上一次更低", quote: "會使滾子 C 產生一連串的速度與方向變化" },
      ],
    },
    driver: { part: "screwD", type: "rotation", range: RANGE, initial: 0 },
    target: "rollerC", // 被頂起落下又被摩擦帶轉的滾子
    view: { direction: view },
    pose(theta0) {
      const { phi, cx, ey, ez, yc } = cone(theta0);
      const screwX = threadMid + (cx - X0); // 螺桿與錐體一起前進
      return {
        parts: {
          screwD: { angle: phi, position: [screwX, 0, 0] },
          // 錐體:中心偏離螺桿軸,隨螺桿轉(轉角與偏心方向一起)
          coneB: { position: [cx, ey, ez], angle: phi },
          rollerC: { position: [XC, yc, 0], angle: rollerAngle(theta0) },
          stemC: { position: [XC, yc, 0] },
        },
        readouts: [],
      };
    },
  };
}
