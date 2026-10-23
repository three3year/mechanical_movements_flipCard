// 取景的取樣:外框要容納主動量各處的姿勢,所以在主動量會走到的區間內均勻取樣——有範圍的是整個範圍,
// 一直轉的是從目前值起、往自動播放的方向(主動件的 speed 與狀態的 play)一個週期(轉動一圈、往復一個來回;
// 機構要轉好幾圈才回到原狀的,主動件以 period 宣告週期,蓋過一圈與往復的來回;有範圍的不看它),進程型的虛擬主動件是一個進程。
// period 只給取景用:實體驗證的取樣(verify/sampling.js)與動力重演(verify/replay.js)的「一輪」不讀它。
// 不碰 Three.js:檢視器(viewer.js)與取景掃描(verify/framing.js、tools/framing.mjs)共用,測試在 npm test。

// 預設段數由 tools/framing.mjs 量出(2026-10-22):段數再加倍時,全書每張圖的外框都不再變大超過 1%。
// 這個條件對段數不是單調的:奇數段取不到範圍的中點,56、60、62 段和快轉的螺桿、鑽頭(第 173、380 種)的圈數對齊而漏掉極值;
// 52 段湊巧過關。取過關的最小的 2 的冪次,它包含所有較粗的等分(含舊取樣的兩端與中點)
export const FRAMING_SEGMENTS = 64;

/** 取景要涵蓋的主動量區間 [起, 迄];play 是目前狀態的播放方向(−1 反向;0 停住時照原本的方向) */
export function framingSpan(driver, value, play = 1) {
  const progress = driver.type === "virtual" && driver.mode === "progress";
  if (driver.range && !progress) return [...driver.range];
  const period = progress ? driver.range[1] - driver.range[0] : (driver.period ?? (driver.cycle ? 2 * Math.abs(driver.cycle[1] - driver.cycle[0]) : Math.PI * 2));
  return [value, value + Math.sign(driver.speed ?? 1) * (play < 0 ? -1 : 1) * period];
}

/** 取景要套用的主動量:區間內均勻取 segments + 1 處;有範圍的再加上目前值(初始姿勢不一定落在格點上) */
export function framingValues(driver, value, segments = FRAMING_SEGMENTS, play = 1) {
  const [from, to] = framingSpan(driver, value, play);
  const values = Array.from({ length: segments + 1 }, (_, i) => from + ((to - from) * i) / segments);
  return from === value ? values : [...values, value];
}
