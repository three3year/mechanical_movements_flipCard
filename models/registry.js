// 模型登記表:以圖號為鍵。新增模型時寫一份定義檔,再在這裡登記即可。
import fig1 from "./fig01.js";
import fig2 from "./fig02.js";
import fig3 from "./fig03.js";
import fig4 from "./fig04.js";
import fig5 from "./fig05.js";
import fig6 from "./fig06.js";
import fig7 from "./fig07.js";
import fig8 from "./fig08.js";
import fig9 from "./fig09.js";
import fig10 from "./fig10.js";
import fig11 from "./fig11.js";
import fig12 from "./fig12.js";
import fig13 from "./fig13.js";
import fig14 from "./fig14.js";
import fig15 from "./fig15.js";
import fig16 from "./fig16.js";
import fig17 from "./fig17.js";
import fig18 from "./fig18.js";
import fig19 from "./fig19.js";
import fig20 from "./fig20.js";
import fig21 from "./fig21.js";
import fig22 from "./fig22.js";
import fig23 from "./fig23.js";

export const models = [fig1, fig2, fig3, fig4, fig5, fig6, fig7, fig8, fig9, fig10, fig11, fig12, fig13, fig14, fig15, fig16, fig17, fig18, fig19, fig20, fig21, fig22, fig23];

export const registry = new Map(models.map((m) => [m.figure, m]));
