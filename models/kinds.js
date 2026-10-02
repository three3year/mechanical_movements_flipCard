// 零件種類與流體種類的清單:繪圖層依此建立零件,登記表測試依此檢查定義。
// 新增零件種類:在這裡列名,再在 viewer/parts.js 加一個建構方式。

/** 剛體零件:姿勢是 position、angle(繞定義的 axis)或 rotation(四元數),連桿類另有 from/to */
export const PART_KINDS = new Set([
  "pulley",
  "drum",
  "stepped",
  "cone",
  "bevel",
  "shaft",
  "sectorLever",
  "weight",
  "box",
  "ropeEnd",
  "bar",
  "gear", // 正齒輪、內齒輪、不完全齒輪(依齒數與節圓半徑畫梯形齒)
  "rack", // 齒條
  "plate", // 依 2D 輪廓擠出的板件:凸輪、棘輪、棘爪、槓桿、擒縱輪……
  "cylinder",
  "sphere",
  "lathe", // 依剖面繞軸旋轉成形
  "link", // 兩端有銷孔的連桿,姿勢以 from/to 指定
  "spring", // 螺旋彈簧,姿勢以 from/to 指定,長度隨之伸縮
  "worm", // 蝸桿、螺桿:圓柱外繞螺旋齒
  "fill", // 容器內的存量:半透明填色,姿勢的 level(0–1)決定高度
  "group", // 只由 pieces 組成的零件
]);

/** 路徑零件:姿勢回傳折線 */
export const PATH_KINDS = new Set(["belt", "rope", "rod", "chain", "trace"]);

/** 會運動的線狀零件:黑色間隔記號分段、每段一種實色,跟著材料移動 */
export const MOVING_KINDS = new Set(["belt", "rope", "chain"]);

/** 流體示意的種類,各一種顏色 */
export const FLUIDS = new Set(["water", "steam", "air"]);
