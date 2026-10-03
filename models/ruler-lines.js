// 平行尺(第 322–325、349 種)共用:沿尺邊畫線。尺在起始位置時沿邊畫的一條線固定不動,
// 尺移到目前位置後沿邊再畫一條;兩條線始終平行(使用時的動作,推斷)。以作圖軌跡呈現。
/** 兩條作圖軌跡零件 */
export const rulerLineParts = () => [
  { id: "lineStart", kind: "trace" },
  { id: "lineNow", kind: "trace" },
];

/** 尺邊在主動量 v 時的兩端點(函式 edge(v) 回傳 [[x, y], [x, y]])→ 兩條線的姿勢;z 是紙面高度 */
export function rulerLines(edge, v0, v, z = 0.01) {
  const line = (pts) => ({ points: pts.map(([x, y]) => [x, y, z]), closed: false });
  return { lineStart: line(edge(v0)), lineNow: line(edge(v)) };
}

/** 線段的方向角(測試用:兩條線平行) */
export const lineAngle = ([[x0, y0], [x1, y1]]) => Math.atan2(y1 - y0, x1 - x0);
