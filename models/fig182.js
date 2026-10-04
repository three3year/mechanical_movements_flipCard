// 第 182 種:同第 181 種的斜向卡榫,此圖是活塞位於圓筒頂部時卡榫與手柄的位置:下方手柄已被抬起卡住,
// 上方手柄被放開、伸進撥爪的路徑。活塞下降時撥爪撞到上方手柄,把卡榫與手柄推回第 181 種的位置。
// 機構與推斷見 cornish-gear.js、cornish-model.js;主動件是活塞桿(往復)。
import { cornishModel } from "./cornish-model.js";
import { SPAN } from "./cornish-gear.js";

export default {
  ...cornishModel({ figure: 182, lock: "catch", initial: SPAN }),
  waivers: [
  ],
};
