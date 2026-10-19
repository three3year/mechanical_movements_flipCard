// 第 347 種:碟形引擎(剖面圖)。碟形活塞從側面看,就像一枚旋轉的硬幣剛落下時那樣擺盪(章動):碟片的法線
// 繞汽缸軸畫圓錐,而碟片本身不轉。汽缸蓋是圓錐形,活塞桿上的球在汽缸蓋的同心座裡,碟片裝在球上;活塞桿左端
// 接在左側軸端的曲柄臂(飛輪)上。蒸汽交替地從活塞兩側引入。
// 照原圖(525 px 剖面)與原文的讀法:缸壁是以球心為圓心的球帶;兩個汽缸蓋是頂點在球心的圓錐(剖面上成 X 形),
// 頂端是包著球的同心座;碟片的傾角讓它的兩面各沿一條半徑線貼著一個圓錐——碟片擺盪時,這條接觸線繞著汽缸軸滾,
// 把汽缸分成碟片兩側的兩室。圓錐蓋背後是空的(原圖的白底),活塞桿從那裡斜著伸出:左端接曲柄,右端照原圖往右下
// 穿出汽缸。原圖右下的桿端方塊與從左上繞過汽缸頂的大弧沒畫:原文沒提,看不出它們在實物上做什麼。
// 主動件是虛擬的「進程」(蒸汽推動);進汽以流體示意。
// 推斷:各部的尺寸(碟片傾角照原圖約 25°);活塞桿伸出右邊的長度;曲柄做成圓盤(原圖左邊剖開的曲柄盤);
// 機架(底板、托汽缸的座、曲柄軸的軸承座)與進汽管(原圖沒畫進汽口);進汽的時機(缸頂的進汽口在碟片
// 正讓出的那一側才通汽,碟片掃過進汽口,兩側就輪流進汽)。
import { X, Y, TAU, deg, quatFromZ, add, sub, scale, dot } from "./kit.js";
import { stream } from "./flow.js";
import { backHalf } from "./section.js";
import { pedestalX } from "./supports.js";

const C = [0.7, 0, 0]; // 球心(汽缸中心)
const TILT = deg(25); // 碟片法線(活塞桿)與汽缸軸的夾角
const CONE = Math.PI / 2 - TILT; // 圓錐蓋的半頂角:碟片面和圓錐沿一條母線相切
const ROD = 2.6; // 球心到活塞桿左端(曲柄銷)
const EXT = 1.75; // 球心到活塞桿右端
const SHAFT_X = C[0] - ROD * Math.cos(TILT);
const ARM = ROD * Math.sin(TILT); // 曲柄銷到軸心
const RS = 1.62; // 球帶缸壁的內半徑
const RO = 1.8; // 外半徑
const HALF = 0.04; // 碟片半厚
const RD = Math.sqrt(RS * RS - HALF * HALF) - 0.002; // 碟片半徑:碟緣的兩個角貼著缸壁
const BALL = 0.36;
const HOLLOW = deg(42); // 圓錐蓋背面(朝外的空腔)與汽缸軸的夾角:比活塞桿掃過的 25° 大,桿從空腔伸出
const END = 0.95; // 汽缸兩端面離球心
const FLOOR = -2.6;

/** 進程 p → 曲柄角、活塞桿的方向(從球心指向曲柄銷)與曲柄銷位置 */
export function disk(p) {
  const phi = -TAU * p; // 進程 0 照原圖:曲柄銷在上、活塞桿在圖面上
  const dir = [-Math.cos(TILT), Math.sin(TILT) * Math.cos(phi), Math.sin(TILT) * Math.sin(phi)];
  const pin = [C[0] + ROD * dir[0], C[1] + ROD * dir[1], C[2] + ROD * dir[2]];
  return { phi, dir, pin };
}
export const geometry = { C, ROD, TILT, SHAFT_X };

// 汽缸的剖面([離軸距離, 沿軸],沿軸以球心為 0)。圓錐蓋朝汽缸內的面:碟片面離球心 HALF,所以圓錐的頂點
// 往蓋的那一側退 HALF / sin(CONE),碟片的面才沿整條母線貼著它(平行於頂點在球心的圓錐,相距 HALF)。
const SHIFT = HALF / Math.sin(CONE);
const COT = 1 / Math.tan(CONE);
// 圓錐面(右蓋;左蓋對稱)和以球心為圓心、半徑 R 的球的交點
function coneMeets(R) {
  const [a, b, c] = [1 + COT * COT, 2 * SHIFT * COT, SHIFT * SHIFT - R * R];
  const r = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  return [r, SHIFT + r * COT];
}
// 以球心為圓心的弧:極角(從 +軸量起)從 from 到 to,約每 step 一點(含兩端)
function arc(R, from, to, step = deg(3)) {
  const n = Math.max(1, Math.ceil(Math.abs(to - from) / step));
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = from + ((to - from) * i) / n;
    return [R * Math.sin(t), R * Math.cos(t)];
  });
}
const angleFromAxis = ([r, a]) => Math.atan2(r, a); // 剖面點 [離軸距離, 沿軸] 從軸線量起的角度
const mirror = ([r, a]) => [r, -a];
const seatR = coneMeets(BALL); // 右蓋的圓錐面和座的交界
const wallR = coneMeets(RS); // 右蓋的圓錐面和缸壁的交界
const endR = [Math.sqrt(RO * RO - END * END), END]; // 端面的外緣
const hollowR = [END * Math.tan(HOLLOW), END]; // 端面的內緣(空腔口)
const shell = [
  ...arc(BALL, Math.PI - HOLLOW, Math.PI - angleFromAxis(seatR)), // 左蓋的座
  mirror(wallR), // 左蓋的圓錐面
  ...arc(RS, Math.PI - angleFromAxis(wallR), angleFromAxis(wallR)).slice(1, -1), // 球帶缸壁的內面
  wallR, // 右蓋的圓錐面
  ...arc(BALL, angleFromAxis(seatR), HOLLOW), // 右蓋的座
  hollowR, // 右蓋背面的空腔
  endR,
  ...arc(RO, angleFromAxis(endR), Math.PI - angleFromAxis(endR)).slice(1, -1), // 球帶缸壁的外面
  mirror(endR),
  mirror(hollowR), // 左蓋背面的空腔
];

// 進汽管:從缸頂的進汽口(在留下的後半)往上,再往後接到圖外
const PIPE_Z = -0.12;
const PIPE_W = 0.16;
const PIPE_TOP = 2.7;
const portY = Math.sqrt(RS * RS - PIPE_Z * PIPE_Z);
const pipeBottom = portY + 0.02; // 管的下端埋在缸壁裡,不伸進缸內
// pipe: true 標出進汽管的塊(測試用:蒸汽的點要在管裡或缸裡)
const pipes = [
  { kind: "box", pipe: true, size: [PIPE_W, PIPE_TOP + PIPE_W / 2 - pipeBottom, PIPE_W], at: [C[0], (PIPE_TOP + PIPE_W / 2 + pipeBottom) / 2, PIPE_Z] },
  { kind: "box", pipe: true, size: [PIPE_W, PIPE_W, 1.1], at: [C[0], PIPE_TOP, PIPE_Z - 0.55 + PIPE_W / 2] },
];
const PORT = [C[0], portY, PIPE_Z];
const INLET = [[C[0], PIPE_TOP, PIPE_Z - 1.0], [C[0], PIPE_TOP, PIPE_Z], PORT];

/** 碟片的法線(局部 Z):指向活塞桿的反向 */
const normalAt = (p) => scale(disk(p).dir, -1);

const BEARING_X = SHAFT_X - 0.95;

export default {
  figure: 347,
  parts: [
    {
      id: "frame",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "lathe", axis: X, at: C, profile: shell, ...backHalf(X) }, // 汽缸(剖開前半)
        { kind: "box", size: [1.1, -1.66 - FLOOR, 0.9], at: [C[0], (-1.66 + FLOOR) / 2, -0.45] }, // 托汽缸的座(推斷;原圖汽缸下有座與底座)
        { kind: "box", size: [C[0] + 0.9 - (BEARING_X - 0.5), 0.2, 1.4], at: [(C[0] + 0.9 + BEARING_X - 0.5) / 2, FLOOR - 0.1, -0.3] }, // 底板(推斷)
        ...pedestalX({ x: BEARING_X, y: 0, z: 0, bore: 0.16, floor: FLOOR }), // 曲柄軸的軸承座(原圖左邊)
        ...pipes, // 進汽管(推斷)
      ],
    },
    {
      id: "crank",
      kind: "group",
      axis: X,
      center: [SHAFT_X, 0, 0],
      spin: 1.55,
      pieces: [
        { kind: "cylinder", radius: 0.15, length: 1.35, at: [0, 0, -0.75] }, // 軸:往左穿過軸承座
        { kind: "cylinder", radius: 1.45, length: 0.16, at: [0, 0, -0.16] }, // 曲柄盤(飛輪)
        { kind: "cylinder", radius: 0.05, length: 0.1, at: [ARM, 0, -0.05] }, // 曲柄銷
        { kind: "sphere", radius: 0.09, at: [ARM, 0, 0], accent: true }, // 銷端的球接頭:活塞桿斜著接上來,繞著它擺
      ],
    },
    // 碟形活塞:碟片、中間的球與穿過球的活塞桿是一件(局部 Z 是碟片的法線,桿往曲柄那一端是 −Z)
    {
      id: "piston",
      kind: "group",
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: RD, length: 2 * HALF },
        { kind: "sphere", radius: BALL },
        { kind: "cylinder", radius: 0.07, length: ROD + EXT, at: [0, 0, (EXT - ROD) / 2] },
      ],
    },
  ],
  powered: ["piston"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "圈", speed: 0.25 },
  target: "crank", // 輸出的曲柄
  view: { direction: [0.08, 0.1, 1] },
  pose(p) {
    const d = disk(p);
    const n = normalAt(p);
    // 缸頂的進汽口在碟片的哪一側、那一側正在變大(碟片離開進汽口)才通汽;碟片掃過進汽口,兩側就輪流進汽
    const gap = (q) => dot(sub(PORT, C), normalAt(q));
    const side = Math.sign(gap(p));
    const opening = side * (gap(p + 1e-4) - gap(p)) > 0;
    // 進到缸內:從進汽口往下,同時往碟片讓出的那一側偏,點不會落到碟片另一側
    const inside = add(add(PORT, scale(Y, -0.3)), scale(n, side * (0.3 * Math.abs(n[1]) + 0.05)));
    return {
      parts: {
        crank: { angle: d.phi + Math.PI / 2 }, // 軸沿 X 時局部 X 指向 −Z:加四分之一圈,曲柄銷才對到活塞桿的左端
        piston: { position: C, rotation: quatFromZ(n) },
      },
      flows: [{ fluid: "steam", points: opening ? stream([...INLET, inside], p * 8, { spacing: 0.2 }) : [] }],
      readouts: [],
    };
  },
};
