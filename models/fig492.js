// 第 492 種:小艇脫鉤器(Brown & Level 的)。直立的支柱固定在小艇上,鉸在支柱上端的舌片插在一根槓桿上的環孔裡,
// 槓桿以支柱中點處的支點作動。小艇兩端各裝一套。滑車組的鉤子鉤住舌片,要脫離小艇之前都很牢固;需要脫離時,
// 拉動接在各槓桿下端的繩子,使槓桿上端的環孔從舌片上滑脫,舌片隨即被放開,從滑車的鉤子裡滑出,小艇便脫離。
// 主動件是虛擬的「拉繩」。
// 推斷(物理):舌片從支柱上端往左伸,鉤子的彎鉤在靠鉸點的地方托在舌片下面(小艇的重量經鉸點→舌片→鉤子吊著;
// 原圖鉤子的彎鉤也在鉸點旁),槓桿的環孔套在彎鉤外側的舌片上、壓住舌片;重量使舌片有往上翻(順時針)的趨勢,環孔擋住它。
// 鉤子是一根彎成 U 形的圓桿,U 的平面和舌片的長邊垂直:柄在舌片後面、尖在舌片前面,彎底橫過舌片的整個厚度托著舌片
// (和舌片同一層)。舌片往上翻時從 U 的開口(柄與尖之間)出去;翻到比直立再過一點,彎鉤留在舌片左邊,小艇掉下時碰不到。
// 拉繩使槓桿逆時針轉,環孔沿舌片往尖端滑,滑過尖端後舌片沒有東西壓住,往上翻、從鉤口滑出,小艇往下掉。
// 環孔的路徑是繞支點的圓弧,舌片取這段圓弧的弦的方向,環孔才能一路套著舌片滑而不咬進舌片
// (弦的矢高約 0.02,小於孔與舌片的間隙);拉繩時舌片被鉤子與環孔牢牢夾著,不動。
// 環孔是立在槓桿末端、軸沿舌片方向的一個環(舌片從環中穿過):槓桿本體在舌片前面一層,環從槓桿末端往後套住舌片;
// 同一平面上一塊板不可能「穿過」另一塊板上的孔,所以不用板上開孔來畫。
// 槓桿在支點處開孔套在支柱的銷上(原圖槓桿中段帶孔的寬處)。拉繩的另一端在小艇上的人手裡(推斷,手沒畫):
// 人拉繩時手跟著槓桿下端走、繩長不變,小艇掉下時一起掉下。各階段所佔的拉繩進度為推斷。
import { deg, clamp, smooth, rot2 } from "./kit.js";
import { shape, thickLine, circle, arcPoints, stadium, disc } from "./shapes.js";

const TOP = [0, 1.0, 0]; // 舌片的鉸點(支柱上端)
const POST_BOTTOM = -1.7;
const FULCRUM = [0, (TOP[1] + POST_BOTTOM) / 2, 0]; // 槓桿的支點(支柱中點)
const TONGUE = 0.5; // 舌片長
const TONGUE_W = 0.11;
const TONGUE_T = 0.1; // 舌片厚
const EYE_R = 0.1; // 環孔半徑(舌片斷面的半對角線 0.075 要穿得過)
const RING_R = 0.14; // 環的外半徑
const RING_L = 0.06; // 環沿舌片方向的厚度
const EYE_AT = 0.25; // 拉繩前環孔套在舌片離鉸點多遠處
const HOOK_AT = 0.16; // 鉤子的彎鉤托在舌片離鉸點多遠處(在環孔與鉸點之間,環孔往尖端滑出時不經過鉤子)
const BAR_R = 0.03; // 鉤子圓桿的半徑
const HOOK_W = 0.085; // 鉤子的柄、尖離舌片中面的距離(舌片厚 0.1,兩邊各留 0.005)
const TONGUE_Z = 0.11; // 舌片中面的 z(在支柱前面)
const LEVER_Z = 0.27; // 槓桿中面的 z(在鉤子的尖前面)
const PIN_R = 0.035; // 鉸點與支點的銷
const LOWER = 0.95; // 支點到拉繩端
export const SLIP = 0.55; // 拉到這裡環孔滑脫
export const DROP = 0.8; // 小艇掉下的距離
const UPRIGHT = deg(85 - 360); // 放開後舌片翻到的角度:比直立再往右 5°(彎鉤在舌片左邊,掉下時碰不到)

// 舌片方向與槓桿的擺角互相決定:舌片沿環孔路徑的弦,擺角要讓環滑過舌片尖端(含環的半厚與間隙,
// 舌片翻上去時尖端掃過的圓才碰不到環);反覆逼近即收斂
const eyeAt = (local, lam) => {
  const [x, y] = rot2(local, lam);
  return [FULCRUM[0] + x, FULCRUM[1] + y];
};
function solve() {
  let at = deg(190);
  let eyeLocal;
  let swing = 0;
  for (let i = 0; i < 12; i++) {
    const eye0 = [TOP[0] + EYE_AT * Math.cos(at), TOP[1] + EYE_AT * Math.sin(at)];
    eyeLocal = [eye0[0] - FULCRUM[0], eye0[1] - FULCRUM[1]];
    swing = 0;
    while (Math.hypot(...eyeAt(eyeLocal, swing).map((c, k) => c - TOP[k])) < TONGUE + RING_L / 2 + 0.04 && swing < 1) swing += 0.0005;
    const end = eyeAt(eyeLocal, swing);
    at = Math.atan2(end[1] - eye0[1], end[0] - eye0[0]);
  }
  return { at, eyeLocal, swing };
}
const { at: TONGUE_AT, eyeLocal: EYE, swing: SWING } = solve();
export const geometry = { TONGUE_AT, SWING, EYE, EYE_R, TONGUE, TONGUE_W };
const FLIP = TONGUE_AT - UPRIGHT; // 放開後舌片往上翻的角度

/** 拉繩 u → 槓桿轉角、舌片轉角、小艇下降量、階段 */
export function release(u0) {
  const u = clamp(u0, 0, 1);
  const lever = SWING * smooth(clamp(u / SLIP, 0, 1));
  // 環孔滑脫後,舌片被小艇的重量翻開、小艇往下掉:都是重力造成的,加速到底停住
  const open = clamp((u - SLIP) / 0.15, 0, 1) ** 2;
  const tongue = TONGUE_AT - FLIP * open; // 往上翻(順時針)
  const fall = DROP * clamp((u - SLIP - 0.12) / 0.3, 0, 1) ** 2;
  return { lever, tongue, fall, held: u < SLIP, free: fall > 0.01 };
}

/** 環孔套在舌片上離鉸點多遠(拉繩 u);用來驗證環一路套著舌片 */
export function eyeDistance(u) {
  const e = eyeAt(EYE, release(u).lever);
  return Math.hypot(e[0] - TOP[0], e[1] - TOP[1]);
}

// 槓桿本體(局部原點是支點):上端是一個圓頭(環就立在它後面),上臂往下伸進支點的轂;圓頭與上臂合成一個外形(逆時針)。
// 轂(開孔套在支點銷上)與往下彎到拉繩端的下臂另成兩塊,三塊疊在同一層
const LEVER_W = 0.08;
const BOSS = 0.1;
const END = [0.5, -LOWER]; // 拉繩端
function lever() {
  const knob = 0.12;
  const pts = [EYE, [-0.02, 0.6], [0, 0.07]];
  const tl = thickLine(pts, LEVER_W);
  const n = pts.length;
  const a = Math.atan2(pts[1][1] - EYE[1], pts[1][0] - EYE[0]);
  const d = Math.asin(LEVER_W / 2 / knob);
  const head = arcPoints(knob, a + d, a + Math.PI * 2 - d, EYE[0], EYE[1]);
  return shape([...head, ...tl.slice(n, 2 * n - 1).reverse(), ...tl.slice(1, n).reverse()]);
}
const ROPE = [1.3, -0.33]; // 拉繩:從槓桿下端到人手(往右下拉)
// 環:軸沿舌片方向(取擺動中點的方向,兩端各差半個擺角,環比舌片斷面寬鬆得下)
const RING_AXIS_AT = TONGUE_AT - SWING / 2;

// 鉤子(固定在上方的滑車上):U 形圓桿,彎底沿 z 橫過舌片下面、貼著舌片的下緣(離鉸點 HOOK_AT 處),
// 柄在舌片後面往上接到滑車,尖在舌片前面往上翹一段(鉤口朝上,舌片往上翻就從柄與尖之間出去)
function hook() {
  const n = [-Math.sin(TONGUE_AT), Math.cos(TONGUE_AT)]; // 舌片局部 +y 在世界中的方向(舌片朝左,這一邊朝下)
  const c = [TOP[0] + HOOK_AT * Math.cos(TONGUE_AT) + (TONGUE_W / 2 + BAR_R) * n[0], TOP[1] + HOOK_AT * Math.sin(TONGUE_AT) + (TONGUE_W / 2 + BAR_R) * n[1]];
  const [back, front] = [TONGUE_Z - HOOK_W, TONGUE_Z + HOOK_W];
  const upright = (z, y1) => ({ kind: "cylinder", radius: BAR_R, length: y1 - c[1], axis: [0, 1, 0], at: [c[0], (c[1] + y1) / 2, z] });
  return [
    { kind: "cylinder", radius: BAR_R, length: front - back, at: [c[0], c[1], TONGUE_Z], role: "bight" },
    upright(back, 2.3),
    upright(front, c[1] + 0.2),
    // 柄頂接到滑車的兩股繩(示意)
    { kind: "plate", shape: shape(thickLine([[c[0] - 0.15, 2.85], [c[0], 2.3]], 0.06)), thickness: 0.06, at: [0, 0, back] },
    { kind: "plate", shape: shape(thickLine([[c[0] + 0.15, 2.85], [c[0], 2.3]], 0.06)), thickness: 0.06, at: [0, 0, back] },
  ];
}
// 支柱:上端畫成圓頭(鉸點的銷孔在圓頭裡),中點開支點銷的孔
const POST_W = 0.14;
const postShape = shape(
  [[-POST_W / 2, POST_BOTTOM], [POST_W / 2, POST_BOTTOM], ...arcPoints(POST_W / 2, 0, Math.PI, TOP[0], TOP[1])],
  [circle(0.04, 0, TOP[1]).reverse(), circle(0.04, 0, FULCRUM[1]).reverse()],
);

export default {
  figure: 492,
  parts: [
    // 支柱與小艇(一起往下掉)
    { id: "post", kind: "group", arrow: false, pieces: [
      { kind: "plate", shape: postShape, thickness: 0.12 },
      { kind: "box", size: [0.3, 0.12, 0.3], at: [0, -1.0, 0] },
      { kind: "box", size: [2.6, 0.2, 1.0], at: [0.4, -1.8, 0] },
      // 鉸點與支點的銷(支點銷穿過前面一層的槓桿)
      { kind: "cylinder", radius: PIN_R, length: 0.3, at: [0, TOP[1], 0.08] },
      { kind: "cylinder", radius: PIN_R, length: LEVER_Z + 0.05 + 0.07, at: [0, FULCRUM[1], (LEVER_Z + 0.05 - 0.07) / 2], role: "fulcrumPin" },
    ] },
    // 舌片:鉸點那一端畫成圓頭,開孔套在鉸點的銷上
    { id: "tongue", kind: "plate", shape: shape(stadium(TONGUE, TONGUE_W).outline, [circle(PIN_R + 0.001).reverse()]), thickness: TONGUE_T, arrow: false },
    {
      id: "lever",
      kind: "plate",
      shape: lever(),
      thickness: LEVER_W,
      arrow: false,
      pieces: [
        // 支點的轂(開孔套在支點銷上)與下臂
        { kind: "plate", shape: disc(BOSS, PIN_R + 0.001), thickness: LEVER_W },
        { kind: "plate", shape: shape(thickLine([[0, -0.07], [0.32, -0.42], END], LEVER_W)), thickness: LEVER_W },
        // 環孔:從槓桿末端往後(−z)套住舌片的環,舌片在槓桿後面一層的中心穿過
        { kind: "cylinder", radius: RING_R, inner: EYE_R, length: RING_L, at: [EYE[0], EYE[1], TONGUE_Z - LEVER_Z], axis: [Math.cos(RING_AXIS_AT), Math.sin(RING_AXIS_AT), 0] },
      ],
    },
    // 滑車組的鉤子(固定在上方)
    { id: "hook", kind: "group", center: [0, 0, 0], pieces: hook() },
    { id: "rope", kind: "rope", radius: 0.02 },
  ],
  powered: ["rope"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "拉繩", mode: "balance", range: [0, 1], initial: 0, format: (u) => Math.round(u * 100) + "%" },
  target: "tongue",
  view: { direction: [0.08, 0.06, 1] },
  pose(u) {
    const r = release(u);
    const dy = -r.fall;
    const top = [TOP[0], TOP[1] + dy, TONGUE_Z];
    const fulcrum = [FULCRUM[0], FULCRUM[1] + dy, LEVER_Z]; // 槓桿在舌片前面一層
    // 槓桿下端轉 lever 後的位置;繩拉直,另一端(人手)離下端固定的長度與方向
    const [lx, ly] = rot2(END, r.lever);
    const low = [fulcrum[0] + lx, fulcrum[1] + ly, LEVER_Z];
    const hand = [low[0] + ROPE[0], low[1] + ROPE[1], LEVER_Z];
    return {
      parts: {
        post: { position: [0, dy, 0] },
        tongue: { position: top, angle: r.tongue },
        lever: { position: fulcrum, angle: r.lever },
      },
      paths: { rope: { points: [low, hand], closed: false, phase: 0 } },
      readouts: [{ label: "小艇", value: r.held ? "鉤住(環孔壓著舌片)" : r.free ? "脫離" : "環孔滑脫,舌片翻開" }],
    };
  },
};
