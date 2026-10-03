// 主動量的取樣:模擬自動播放會走到的姿勢(與繪圖層 Session.advance 同一套規則)。
// 有範圍的走完整個範圍;持續運轉的走過好幾輪,每一步不是一輪的整數分之一,取到的相位才不會一直重複。

/** 自動播放時主動量每秒的變化(繪圖層的預設速度) */
export function defaultSpeed(d) {
  if (d.speed) return d.speed;
  if (d.cycle) return Math.abs(d.cycle[1] - d.cycle[0]) / 1.2;
  if (d.type === "virtual" && d.mode === "progress") return (d.range[1] - d.range[0]) / 6;
  if (!d.range) return 0.8;
  return (d.range[1] - d.range[0]) / (d.type === "rotation" ? 2.5 : 4);
}

/** 有範圍的主動量的範圍;持續運轉的回傳 null */
export const boundsOf = (d) => (d.type === "virtual" && d.mode === "progress" ? null : (d.range ?? null));

export const initialValue = (d) => {
  const bounds = boundsOf(d);
  return d.initial ?? (bounds ? (bounds[0] <= 0 && bounds[1] >= 0 ? 0 : bounds[0]) : 0);
};

// 持續運轉的主動量的一輪:轉動是一圈,往復是一個來回,進程是滑桿的一輪
function round(d) {
  if (d.cycle) return 2 * Math.abs(d.cycle[1] - d.cycle[0]);
  if (d.type === "virtual") return d.range[1] - d.range[0];
  if (d.type === "rotation") return Math.PI * 2;
  return Math.abs(defaultSpeed(d)) * 8;
}

const ROUNDS = 7.31; // 持續運轉的走過這麼多輪

/** 取樣的主動量,依播放順序 */
export function sampleValues(d, samples) {
  const bounds = boundsOf(d);
  if (bounds) return Array.from({ length: samples }, (_, i) => bounds[0] + ((bounds[1] - bounds[0]) * i) / (samples - 1));
  const step = (Math.sign(defaultSpeed(d)) * round(d) * ROUNDS) / samples;
  const start = initialValue(d);
  return Array.from({ length: samples }, (_, i) => start + step * i);
}

export const statesOf = (def) => (def.states ? def.states.options.map((o) => o.id) : [undefined]);
