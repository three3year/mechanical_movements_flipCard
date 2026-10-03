// 第 41 種:旋轉運動轉換為旋轉運動。斜齒輪:齒沿齒面斜向排列,比一般正齒輪提供更連續的接觸支撐。
// 照原圖:從正面看上輪的齒紋左低右高(約 35°)、下輪相反(twist 取負)。
import { slicedPair } from "./sliced-pair.js";

export default slicedPair({ figure: 41, teeth: 24, radius: 1.25, width: 0.8, slices: 10, twist: -0.48, twistMode: "helical" });
