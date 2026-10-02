// 第 44 種:每個輪由幾個獨立的正齒輪並排組成,齒以階梯狀錯開排列,讓齒面連續接觸,
// 用來傳遞極大的力量。原圖為四片。
import { slicedPair } from "./sliced-pair.js";

export default slicedPair({ figure: 44, teeth: 36, radius: 1.26, width: 2.85, slices: 4, twist: 1, twistMode: "stagger", sliceGap: 0.04 });
