// 第 183 種:第 181、182 種的變形,斜向卡榫由兩個象限器(quadrants)取代:上下兩根軸各帶一個扇形,
// 一個的圓弧擋住另一個的一角。此圖相當於第 181 種(活塞上升中,下方手柄伸出、上方手柄被下方象限器擋住)。
// 機構與推斷見 cornish-gear.js、cornish-model.js;主動件是活塞桿(往復)。
import { cornishModel } from "./cornish-model.js";

export default cornishModel({ figure: 183, lock: "quadrants", initial: 0 });
