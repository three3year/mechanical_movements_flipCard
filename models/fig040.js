// 第 40 種:旋轉運動轉換為旋轉運動。齒為斜向(人字形)設計,比一般正齒輪提供更連續的接觸支撐。
import { slicedPair } from "./sliced-pair.js";

export default slicedPair({ figure: 40, teeth: 24, radius: 1.25, width: 0.8, slices: 6, twist: 0.3, twistMode: "herringbone" });
