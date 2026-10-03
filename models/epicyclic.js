// 周轉輪系(第 495、502–507 種)共用的運動學:以行星架(臂)為參考系的相對轉速(Willis 公式)。
// 在臂上看,輪系就是普通的定軸輪系:(末輪 − 臂) / (首輪 − 臂) = 輪系值 e(各對齒數比的乘積,外嚙合帶負號)。

/** 首輪、臂的轉角(或轉速)與輪系值 e → 末輪的轉角 */
export const lastWheel = (first, arm, e) => arm + e * (first - arm);

/** 首輪、末輪的轉角與輪系值 e → 臂的轉角 */
export const armOf = (first, last, e) => (last - e * first) / (1 - e);

/** 一串外嚙合(-1)或內嚙合(+1)的齒數比 → 輪系值:pairs = [[主動齒數, 從動齒數, 符號], ...] */
export const trainValue = (pairs) => pairs.reduce((e, [a, b, s]) => e * s * (a / b), 1);
