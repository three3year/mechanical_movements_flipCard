// 大型鼓風、抽水引擎的手動齒輪(第 181–184 種)共用:活塞桿(左邊的直桿)上一個撥爪(tappet),
// 右邊上下兩根軸各帶一支往左伸的手柄。純函式。
// 一個循環:活塞上升時撥爪由下往上頂起下方手柄(下軸順時針轉),手柄頂到頭時被卡住(第 181、182 種是斜向卡榫,
// 第 183、184 種是兩個象限器),同時上方手柄被放開,由配重拉著順時針甩出、伸進撥爪的路徑;
// 活塞下降時撥爪由上往下壓上方手柄(上軸逆時針轉)回到原處、再被卡住,下方手柄被放開、落回原處。
// 兩根軸各帶一支閥臂:上軸管上蒸汽閥與下排氣閥,下軸管下蒸汽閥與上排氣閥(原文)。
// 推斷:手柄以直線臂表示,撥爪頂在臂與活塞桿右緣(x = ROD.right)的交點上;
// 臂的端點離開活塞桿的路徑時剛好被卡住。被放開的手柄是靠配重(上方)、自重(下方)甩到位的,
// 甩動的過程演出來(jumps.falling:起步慢、越來越快、到底停住),佔撥爪再走 SNAP 的行程;
// 上方手柄在撥爪到頂時(第 182 種的位置)剛好甩到位,下方手柄甩到位時撥爪還在往下走、沒碰到它。
// cornish() 是象限器(第 183、184 種)的時序;斜向卡榫(第 181、182 種)的手柄何時被放開由卡榫與凸輪的接觸算,
// 見 diagonal-catch.js(撥爪推手柄、放開的時刻與甩到位的過程和這裡相同)。
import { deg, swingPhase } from "./kit.js";
import { falling } from "./jumps.js";

export const ROD = { left: -1.35, right: -0.9 };
export const TAPPET = { half: 0.15 }; // 撥爪的半高
export const STROKE = { bottom: -1.6, top: 1.3 }; // 撥爪中心的行程
export const SHAFTS = { upper: [0.1, 1.3, 0], lower: [0.1, -1.45, 0] };
export const HANDLE = 2.6; // 手柄臂長
const DX = SHAFTS.upper[0] - ROD.right; // 軸到活塞桿右緣的水平距離
// 手柄的兩個位置(A:第 181 種,活塞上升中;B:第 182 種,活塞在頂部)
export const ANGLES = {
  lower: { A: deg(150), B: Math.PI - Math.acos(DX / HANDLE) },
  upper: { A: Math.PI + Math.acos(DX / HANDLE), B: deg(216.9) },
};
export const SNAP = 0.5; // 手柄甩到位所佔的撥爪行程:上方手柄放開時撥爪離頂端剛好 0.5,到頂時甩到位

/** 手柄臂(從軸沿 angle)與活塞桿右緣的交點高度;臂搆不到(或端點剛好停在桿緣上)時為 null */
export function crossing(shaft, angle) {
  const reach = HANDLE * -Math.cos(angle);
  if (reach < DX + 1e-9) return null;
  return SHAFTS[shaft][1] + DX * Math.tan(Math.PI - angle);
}

// 撥爪頂到手柄時,手柄的轉角:臂與桿右緣的交點高度 = y
export const lowerAt = (y) => Math.PI - Math.atan2(y - SHAFTS.lower[1], DX);
export const upperAt = (y) => Math.PI + Math.atan2(SHAFTS.upper[1] - y, DX);
// 下方手柄被卡住時、上方手柄被卡住時撥爪中心的高度
export const LATCH_UP = SHAFTS.lower[1] + DX * Math.tan(Math.PI - ANGLES.lower.B) - TAPPET.half;
export const LATCH_DOWN = SHAFTS.upper[1] - DX * Math.tan(ANGLES.upper.A - Math.PI) + TAPPET.half;
export const SPAN = STROKE.top - STROKE.bottom;

/**
 * 象限器(第 183、184 種)的時序。累計行程 v(往復):撥爪中心高度、上下手柄轉角、切換進度 latch(0 = A,1 = B)與活塞方向。
 * 上升的半程從 A 開始;下降的半程從 B 開始。
 */
export function cornish(v) {
  const { at: y, forward: rising } = swingPhase(v, STROKE.bottom, STROKE.top);
  let lower;
  let upper;
  if (rising) {
    lower = Math.min(ANGLES.lower.A, Math.max(ANGLES.lower.B, lowerAt(y + TAPPET.half)));
    const s = falling((y - LATCH_UP) / SNAP);
    upper = ANGLES.upper.A + (ANGLES.upper.B - ANGLES.upper.A) * s;
  } else {
    upper = Math.max(ANGLES.upper.B, Math.min(ANGLES.upper.A, upperAt(y - TAPPET.half)));
    const s = falling((LATCH_DOWN - y) / SNAP);
    lower = ANGLES.lower.B + (ANGLES.lower.A - ANGLES.lower.B) * s;
  }
  const latch = (ANGLES.upper.A - upper) / (ANGLES.upper.A - ANGLES.upper.B);
  return { y, rising, lower, upper, latch };
}

/** 閥門狀態(原文):上方手柄放開(B)時上蒸汽閥與下排氣閥開;下方手柄落下(A)時下蒸汽閥與上排氣閥開 */
export function valves(state) {
  const b = state.latch > 0.5;
  const open = (x) => (x ? "開" : "關");
  return [
    { label: "上蒸汽閥、下排氣閥", value: open(b) },
    { label: "下蒸汽閥、上排氣閥", value: open(!b) },
    { label: "活塞", value: state.rising ? "上升" : "下降" },
  ];
}
