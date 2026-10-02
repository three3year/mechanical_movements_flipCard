// 第 9 種:錐形皮帶輪,用途與第 8 種相同,但轉速可以逐漸加快或減慢(見 cone-pair.js)。
import { conePair } from "./cone-pair.js";

export default conePair({ figure: 9, driverRadius: (f) => 0.3 + 0.5 * f, sum: 1.1 });
