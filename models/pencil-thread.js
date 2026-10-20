// 繪圖儀器共用(第 405、406 種):尺平放在紙上,鉛筆尖貼在紙面,繩子平放在紙上、繃在焦點的銷與尺端之間、繞過鉛筆。
// 深度(z)的安排:紙面在 PAPER_TOP;尺從紙面起厚 RULER_T;繩的半徑 THREAD_R、繩心離紙面一個半徑;鉛筆的尖端在紙面。
// 鉛筆「緊貼於尺上」的實物:繩沿著尺邊繃直(繩貼著尺邊)、鉛筆的尖端在繩的彎曲處(bight)被繩壓向尺邊——
// 鉛筆軸線離尺邊 PEN_OFF = 繩的直徑 + 繩心到鉛筆軸線的距離(WRAP_R),繩、鉛筆、尺邊三者相貼。
// 鉛筆尖是圓錐(從紙面往上 0.1 才到全粗),在尺的厚度範圍內圓錐半徑不超過 0.03,所以筆身和尺邊之間留的是繩的位置,不穿入尺。
// 純函式,不依賴 Three.js。
import { TAU } from "./kit.js";

export const PAPER_TOP = -0.1; // 紙面的高度(紙是 z −0.14..−0.10 的板)
export const RULER_T = 0.06; // 尺的厚度(尺平放在紙上:z PAPER_TOP .. PAPER_TOP + RULER_T)
export const RULER_Z = PAPER_TOP + RULER_T / 2; // 尺(板件)的中心高度
export const PENCIL_PROFILE = [[0, -0.1], [0.05, 0], [0.06, 0.4], [0, 0.4]]; // 鉛筆的旋轉剖面(r, z):尖端在局部 z −0.1
export const PENCIL_Z = PAPER_TOP + 0.1; // 鉛筆的位置高度:尖端剛好在紙面
export const THREAD_R = 0.012; // 繩(線)的半徑
export const THREAD_Z = PAPER_TOP + THREAD_R; // 繩平放在紙上
export const EDGE_GAP = THREAD_R + 0.002; // 繩心離尺邊:繩貼著尺邊(留 0.002 的貼合誤差)
export const WRAP_R = 0.028; // 繩繞過鉛筆時繩心離鉛筆軸線(圓錐在繩的高度半徑 ≤ 0.012,加繩半徑 0.012,留 0.004)
export const PEN_OFF = EDGE_GAP + WRAP_R; // 鉛筆軸線離尺邊
export const PIN_R = 0.035; // 焦點的銷(插進紙的細釘)
export const TRACE_Z = PAPER_TOP + 0.01; // 畫出的線:貼在紙面上

/** 插在紙上的銷:釘尖穿過紙面 0.04(豁免「圖釘釘在紙上」),露出 0.16 */
export const paperPin = ([x, y]) => ({ kind: "cylinder", radius: PIN_R, length: 0.2, at: [x, y, PAPER_TOP + 0.06] });

/** 插在紙上的銷當成一個零件(每個焦點的銷各自一個零件) */
export const pinPart = (id, p) => {
  const { at, ...pin } = paperPin(p);
  return { id, ...pin, center: at };
};

/** 兩個狀態的正負號:前半條 +1、後半條(尺翻面)−1;正負對應畫面上的哪一邊由各圖決定 */
export const SIDE = (state) => (state === "second" ? -1 : 1);

/** 鉛筆尖從主動量 v0 到 v1 畫過的線:每隔 step 取一點(至少 3 點);tipAt(w) 是主動量 w 時鉛筆尖在紙上的點 */
export function traced(v0, v1, step, tipAt) {
  const n = Math.max(2, Math.round((v1 - v0) / step));
  return Array.from({ length: n + 1 }, (_, i) => tipAt(v0 + ((v1 - v0) * i) / n));
}

/** 鉛筆:旋轉體,尖端在紙面 */
export const pencilPart = (id = "pencil") => ({ id, kind: "lathe", profile: PENCIL_PROFILE });

const unit = ([x, y]) => {
  const l = Math.hypot(x, y);
  return [x / l, y / l];
};

/**
 * 鉛筆的位置與繩的路徑。bight:繩的彎曲處(在尺邊上的點);e:沿尺邊、從彎曲處指向繫繩那一端的單位向量;
 * end:尺端(繩繫的地方,在尺邊上);pin:繩套著的銷的中心。繩所在的那一側(尺身的另一側)由銷的位置決定。
 * 回傳 pencil(鉛筆軸線的位置,含高度)、tip(鉛筆尖在紙上的點,畫出的線走這裡)、thread(繩的折線,從尺端經鉛筆到銷,
 * 在鉛筆上繞過、在銷上套半圈)、n(尺邊朝繩那一側的單位法線)。
 */
export function pencilAndThread({ bight, e, end, pin }) {
  let n = [-e[1], e[0]];
  if ((pin[0] - bight[0]) * n[0] + (pin[1] - bight[1]) * n[1] < 0) n = [-n[0], -n[1]];
  const axis = [bight[0] + PEN_OFF * n[0], bight[1] + PEN_OFF * n[1]]; // 鉛筆軸線
  // (e, n) 座標:繩從尺端沿 −e 來到鉛筆、在鉛筆的 −n 側接觸(ψ = −90°),繞過鉛筆(ψ 減少),切線離開往銷
  const at = (c, r, psi) => [c[0] + r * (Math.cos(psi) * e[0] + Math.sin(psi) * n[0]), c[1] + r * (Math.cos(psi) * e[1] + Math.sin(psi) * n[1])];
  const dp = [pin[0] - axis[0], pin[1] - axis[1]];
  const d = Math.hypot(...dp);
  const phi = Math.atan2(dp[0] * n[0] + dp[1] * n[1], dp[0] * e[0] + dp[1] * e[1]);
  const psi0 = -Math.PI / 2;
  let psi1 = phi - Math.acos(Math.min(1, WRAP_R / d));
  while (psi1 > psi0) psi1 -= TAU;
  while (psi1 <= psi0 - TAU) psi1 += TAU;
  const wraps = Math.max(2, Math.ceil(Math.abs(psi1 - psi0) / (TAU / 24)));
  const wrap = Array.from({ length: wraps + 1 }, (_, i) => at(axis, WRAP_R, psi0 + ((psi1 - psi0) * i) / wraps));
  const T = wrap[wrap.length - 1];
  const g = unit([pin[0] - T[0], pin[1] - T[1]]);
  const loopR = PIN_R + EDGE_GAP;
  const Q = [pin[0] - loopR * g[0], pin[1] - loopR * g[1]]; // 繩到達銷
  const qa = Math.atan2(Q[1] - pin[1], Q[0] - pin[0]);
  const loop = Array.from({ length: 7 }, (_, i) => [pin[0] + loopR * Math.cos(qa - (Math.PI * i) / 6), pin[1] + loopR * Math.sin(qa - (Math.PI * i) / 6)]); // 套在銷上半圈
  const z = (p) => [p[0], p[1], THREAD_Z];
  const thread = [z([end[0] + EDGE_GAP * n[0], end[1] + EDGE_GAP * n[1]]), ...wrap.map(z), ...loop.map(z)];
  return { pencil: [axis[0], axis[1], PENCIL_Z], tip: [axis[0], axis[1], TRACE_Z], thread, n };
}
