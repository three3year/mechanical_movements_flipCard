// 第 184 種:同第 183 種的兩個象限器,此圖相當於第 182 種(活塞在頂部,下方手柄被抬起、由上方象限器的圓弧擋住,
// 上方手柄伸出)。機構與推斷見 cornish-gear.js、cornish-model.js;主動件是活塞桿(往復)。
import { cornishModel } from "./cornish-model.js";
import { SPAN } from "./cornish-gear.js";

export default {
  ...cornishModel({ figure: 184, lock: "quadrants", initial: SPAN }),
};
