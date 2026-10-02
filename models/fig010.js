// 第 10 種:第 9 種的變形,輪形不同:上輪是內凹的喇叭形,下輪是外凸的鼓形(見 cone-pair.js)。
import { conePair } from "./cone-pair.js";

export default conePair({ figure: 10, driverRadius: (f) => 0.3 + 0.5 * (1 - f) ** 2, sum: 1.1 });
