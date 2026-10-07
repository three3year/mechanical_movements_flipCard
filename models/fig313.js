// 第 313 種:天文台計時器擒縱(現今常見的作法)。擒縱輪(左下)的齒由止動器(右邊直立的彈簧,下端 D 固定在座上)
// 上的鎖石 E 擋住。擺輪朝箭頭方向(逆時針)轉時,軸上小滾子的齒 V 把通過彈簧往右推,通過彈簧頂著止動器的角、
// 連止動器一起推離擒縱輪,鎖石放開一齒;放開的輪齒(A)隨即推大滾子缺口上的衝量叉瓦 P,止動器加速彈回、鎖住下一齒。
// 擺輪返回時,齒 V 把通過彈簧往左壓彎、從旁邊過去,止動器不動,靠在擋止上。擺輪每來回一次,擒縱輪轉過一齒。
// 主動件是擺輪(累計擺動);目標件是擒縱輪(擒縱讓它一齒一齒地放行)。機構與接觸的算法見 detent-escapement.js
// (與第 291 種共用)。
//
// 照原圖的配置(維護者 2026-10-08 決定):原文說齒 V 把通過彈簧「向左」按壓,但原圖擒縱輪在止動器左邊,止動器要往右
// (離開擒縱輪)才放得開齒;維護者看過實物的動畫(擺輪往一邊擺時解鎖石推通過彈簧、壓著止動器的角把止動器推開,
// 往另一邊擺時只撥開通過彈簧),判定原圖說得通,照原圖做、不鏡像。原文「靠在擋止 E、P 上」也和插圖對不上:
// 插圖的 E 是鎖石、P 是大滾子上的衝量叉瓦;止動器靠住的擋止是推斷,畫出來但不標字母。
// 判讀(推斷):插圖從 T 往上到 V 的兩條線,直的是止動器往上伸的角(和止動器一體),彎的是通過彈簧——固定在止動器
// 頂端 T 的右側,尖端越過角的尖端;角的尖端有個鉤蓋在通過彈簧右側,通過彈簧往右推時壓著鉤帶動止動器,
// 往左推時離開鉤、只彎彈簧。
// 立體化:擒縱輪與大滾子同一層;止動器與角在它們前面一層(鎖石往後伸到輪那一層);通過彈簧再前一層,鉤往前蓋到這一層;
// 小滾子在最前面,齒 V 往後伸到通過彈簧那一層。
// 推斷:齒數(依原圖約十五齒)與擺幅、各部尺寸;鎖石做成上寬下窄的楔形(鎖面往右上斜,止動器推開時鎖面離開齒,
// 下半部讓開被放開的齒;推開的頭一小段,齒沿著斜的鎖面前進約 0.007 齒才放開);不畫擺輪本體與游絲,只畫兩個滾子、擺輪軸,軸都裝在後面的夾板條上(原圖沒畫)。
import { deg, TAU } from "./kit.js";
import { detentMechanism, detentModel } from "./detent-escapement.js";
import { shape, rect, circle, thickLine, arcPoints } from "./shapes.js";
import { plateBar } from "./supports.js";

const W = [-0.25, -0.45]; // 擒縱輪心
const fromWheel = (x, y) => [W[0] + x, W[1] + y]; // 相對輪心 → 世界
const R = 1.35; // 齒尖圓
const ROLLER = 0.74; // 大滾子(衝量滾子)半徑:伸進齒尖圓 0.03
const BAL = fromWheel(2.06 * Math.cos(deg(50)), 2.06 * Math.sin(deg(50))); // 擺輪軸:在輪心的右上方
const NOTCH = { at: deg(172), width: deg(32), depth: 0.2 }; // 大滾子的缺口(擺輪居中時的方位);衝量叉瓦 P 在它逆時針那一側
const SMALL_ROLLER = 0.2; // 小滾子半徑
// 齒 V(擺輪居中時,相對擺輪軸):小滾子上朝右下的尖齒
const V_AT = deg(-80);
const V = [[0.17, V_AT - deg(14)], [0.3, V_AT], [0.17, V_AT + deg(14)]].map(([r, a]) => [r * Math.cos(a), r * Math.sin(a)]);
const D = fromWheel(1.47, -1.25); // 止動器的固定端
const T = fromWheel(1.53, 0.42); // 止動器頂端(通過彈簧的固定點)
const SPRING_X = 1.423; // 通過彈簧上段的中線(相對輪心)
const HOOK_Y = [1.18, 1.24]; // 角的尖端(鉤)的高度(相對輪心)
const local = (p, origin) => p.map(([x, y]) => [x - origin[0], y - origin[1]]);
const pts = (list) => list.map(([x, y]) => fromWheel(x, y));

// 止動器(世界座標,之後換成相對 D):下端細、往上變寬的本體;往上伸的角;角尖往右伸到通過彈簧後面,鉤往前蓋在它右側
const BODY = pts([[1.44, -1.25], [1.5, -1.25], [1.5, -0.95], [1.53, 0.42], [1.41, 0.42], [1.43, -0.95]]);
const HORN = pts([[1.38, 0.42], [1.42, 0.42], [1.42, HOOK_Y[1]], [1.38, HOOK_Y[1]]]);
const CAP_X = SPRING_X + 0.017; // 鉤的左面:通過彈簧在鉤上時貼著它
const TAB = pts([[1.38, HOOK_Y[0]], [CAP_X + 0.06, HOOK_Y[0]], [CAP_X + 0.06, HOOK_Y[1]], [1.38, HOOK_Y[1]]]);
const CAP = pts([[CAP_X, HOOK_Y[0]], [CAP_X + 0.06, HOOK_Y[0]], [CAP_X + 0.06, HOOK_Y[1]], [CAP_X, HOOK_Y[1]]]);
// 鎖石 E:鎖面(上緣)伸進齒尖圓 0.04、往右上斜 15°;下緣往右縮
const STONE = pts([[1.4, 0.08], [1.45, 0.08], [1.45, 0.327 + 0.18 * Math.tan(deg(15))], [1.27, 0.327]]);
// 通過彈簧(世界座標的中線):從 T 往右鼓出,再收回角的右側,往上越過角尖到齒 V 掃過的地方
const TIP_Y = BAL[1] - W[1] - 0.22;
const SPRING_LINE = pts([[1.53, 0.42], [1.59, 0.65], [1.6, 0.88], [1.54, 1.06], [SPRING_X + 0.02, 1.15], [SPRING_X, 1.22], [SPRING_X, TIP_Y]]);

const mech = detentMechanism({
  teeth: 15,
  swing: deg(120),
  // 齒:順時針轉,齒尖往前傾
  wheel: { at: W, profile: [[1.0, 0.35], [R, 0.05], [R, 0.1], [1.0, 0.9]] },
  balance: { at: BAL, roller: ROLLER, notch: NOTCH, pin: { poly: V } },
  detent: { pivot: D, bar: [local(BODY, D), local(HORN, D), local(TAB, D)], stop: local(STONE, D), hook: [local(CAP, D)] },
  spring: { at: T, shape: local(thickLine(SPRING_LINE, 0.03), T) },
});

export const { N, PITCH, SWING, balanceAngle, chronometer, escapement } = mech;

// 打開時停在衝量的那一刻(原圖畫的就是這一刻:齒 A 推著叉瓦 P):擺輪往箭頭方向擺到 45°
const INITIAL = 3 * SWING + deg(45);

// 擒縱輪的四根輪輻(輪輻之間的窗)
const windows = [0, 1, 2, 3].map((k) => {
  const a0 = (k * TAU) / 4;
  const a1 = a0 + TAU / 4;
  return [...arcPoints(0.85, a0 + Math.asin(0.06 / 0.85), a1 - Math.asin(0.06 / 0.85)), ...arcPoints(0.24, a1 - Math.asin(0.06 / 0.24), a0 + Math.asin(0.06 / 0.24))].reverse();
});
// 衝量叉瓦 P:嵌在缺口逆時針那一側的壁上
const PALLET_SIDE = NOTCH.at + NOTCH.width / 2; // 缺口逆時針那一側的壁
const PALLET = [[ROLLER - NOTCH.depth, 0], [ROLLER, 0], [ROLLER, 0.07], [ROLLER - NOTCH.depth, 0.07]].map(([x, y]) => [x * Math.cos(PALLET_SIDE) - y * Math.sin(PALLET_SIDE), x * Math.sin(PALLET_SIDE) + y * Math.cos(PALLET_SIDE)]);

// 字母:A、P 標在打開時(衝量的那一刻)推著叉瓦的齒與叉瓦上,B 是下一齒
const start = mech.escapement.at(INITIAL);
const beta0 = balanceAngle(INITIAL);
const P_AT = [BAL[0] + (ROLLER - 0.05) * Math.cos(PALLET_SIDE + beta0), BAL[1] + (ROLLER - 0.05) * Math.sin(PALLET_SIDE + beta0)];
const tip = (t) => t[1]; // 齒形的第二點是齒尖
const nearest = (p) => start.teeth.map(tip).reduce((best, q) => (Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(best[0] - p[0], best[1] - p[1]) ? q : best));
const A_AT = nearest(P_AT);
const angleOf = (q) => Math.atan2(q[1] - W[1], q[0] - W[0]);
const B_AT = start.teeth.map(tip).find((q) => Math.abs(angleOf(q) - (angleOf(A_AT) - PITCH)) < 0.05);
if (!B_AT) throw new Error("找不到 A 的下一齒(標 B 用)");

export default detentModel(mech, {
  figure: 313,
  ids: { wheel: "wheel", detent: "detent", spring: "passing" },
  initial: INITIAL,
  pieces: {
    wheel: [
      { kind: "plate", shape: { outline: mech.wheel.outline, holes: [...mech.wheel.holes, ...windows] }, thickness: 0.12 },
      { kind: "cylinder", radius: 0.14, length: 0.2 },
      { kind: "cylinder", radius: 0.05, length: 0.5, at: [0, 0, -0.25] }, // 輪軸,往後伸進夾板條
      { kind: "cylinder", radius: 0.06, length: 0.16, at: [0.6, 0, 0.04], accent: true },
    ],
    balance: [
      { kind: "plate", shape: shape(mech.roller, [circle(0.06).reverse()]), thickness: 0.12 }, // 大滾子與缺口
      { kind: "plate", shape: shape(PALLET), thickness: 0.14 }, // 衝量叉瓦 P
      { kind: "plate", shape: shape(circle(SMALL_ROLLER), [circle(0.06).reverse()]), thickness: 0.06, at: [0, 0, 0.39] }, // 小滾子
      { kind: "plate", shape: shape(V), thickness: 0.21, at: [0, 0, 0.315], accent: true }, // 齒 V,往後伸到通過彈簧那一層
      { kind: "cylinder", radius: 0.06, length: 0.92, at: [0, 0, -0.04] }, // 擺輪軸,往後伸進夾板條
    ],
    detent: [
      { kind: "plate", shape: shape(local(BODY, D)), thickness: 0.08, at: [0, 0, 0.15] },
      { kind: "plate", shape: shape(local(HORN, D)), thickness: 0.08, at: [0, 0, 0.15] }, // 角
      { kind: "plate", shape: shape(local(TAB, D)), thickness: 0.08, at: [0, 0, 0.15] },
      { kind: "plate", shape: shape(local(CAP, D)), thickness: 0.22, at: [0, 0, 0.22] }, // 鉤,往前蓋在通過彈簧右側
      { kind: "plate", shape: shape(local(STONE, D)), thickness: 0.2, at: [0, 0, 0.05] }, // 鎖石 E,往後伸到輪那一層
      { kind: "plate", shape: shape(local(rect(0.1, 0.12, T[0] - 0.03, T[1] - 0.04), D)), thickness: 0.19, at: [0, 0, 0.205] }, // 通過彈簧的固定座
    ],
    spring: [{ kind: "plate", shape: shape(local(thickLine(SPRING_LINE, 0.03), T)), thickness: 0.06, at: [0, 0, 0.27] }],
    foot: [
      { kind: "box", size: [0.3, 0.3, 0.6], at: [D[0], D[1] - 0.15, -0.1] }, // 止動器下端固定的座
      { kind: "cylinder", radius: 0.05, length: 0.64, at: [W[0] + 1.372, W[1] - 0.6, -0.13] }, // 擋止(推斷):止動器被彈簧壓在它上面
    ],
    plate: plateBar({ points: [W, BAL, D], z: -0.5, width: 0.22, boss: 0.15 }),
  },
  labels: [
    { text: "A", at: A_AT, offset: [-0.2, 0.15] },
    { text: "P", at: P_AT, offset: [0.05, -0.25] },
    { text: "B", at: B_AT, offset: [-0.3, -0.05] },
    { text: "E", at: fromWheel(1.33, 0.2), offset: [-0.3, -0.05] },
    { text: "T", at: T, offset: [-0.25, 0.1] },
    { text: "V", at: [BAL[0] + 0.3 * Math.cos(V_AT + beta0), BAL[1] + 0.3 * Math.sin(V_AT + beta0)], offset: [0.3, 0.1] },
    { text: "D", at: fromWheel(1.5, -1.0), offset: [0.3, 0] },
  ],
  texts: {
    pass: { label: "擺輪返回:齒 V 把通過彈簧往左壓彎而通過,止動器不動,輪不動", quote: "齒 V 會將通過彈簧推至一旁,並在不移動槓桿的情況下通過" },
    // 原文說「向左」按壓;照插圖的配置是往右(維護者 2026-10-08 決定以插圖為準),標籤寫實際的方向
    release: { label: "擺輪朝箭頭方向(逆時針)轉:齒 V 推通過彈簧連止動器往右(離開擒縱輪),放走一齒", quote: "齒 V 會將通過彈簧向左按壓,將槓桿推至一旁,並從擒縱輪的齒上移開止動裝置" },
  },
  view: { direction: [0.03, 0.04, 1] },
});
