// 第 313 種:天文台計時器擒縱(現今常見的作法)。擒縱輪的齒由止動器(detent,直立的彈簧,下端 D 固定)
// 上的鎖石擋住。擺輪朝箭頭方向轉時,軸上的齒 V 把通過彈簧按向一旁,連帶把止動器推開,放走擒縱輪的一齒,
// 擒縱輪的齒隨即推擺輪上的衝擊叉瓦;擺輪返回時,齒 V 只把通過彈簧推開而通過,不動止動器,止動器靠在擋止 E、P 上。
// 擺輪每來回一次,擒縱輪轉過一齒。主動件是擺輪(累計擺動);目標件是擒縱輪(擒縱讓它一齒一齒地放行)。
// 機構與接觸的算法見 detent-escapement.js:與第 291 種相同,整組轉 −90° 再左右鏡像(止動器的固定端 D 在下、
// 擒縱輪在右、擺輪在左上)。照原文:齒 V 把通過彈簧向左按、連止動器推開,鎖石離開擒縱輪的齒。
// 偏離插圖:原圖擒縱輪在止動器左邊,鎖石要往右(離開輪)才放得開齒,和原文的「向左」對不上;照「原文 > 實物可行 > 插圖外形」
// 整組左右鏡像(列入待確認清單)。
// 推斷:齒數與擺幅、各部尺寸;擺輪只畫出衝擊滾子與帶齒 V 的小臂。
import { deg } from "./kit.js";
import { detentEscapement } from "./detent-escapement.js";

export { N, PITCH, SWING, balanceAngle, chronometer, escapement } from "./detent-escapement.js";

export default detentEscapement({
  figure: 313,
  turn: deg(-90),
  mirror: true,
  ids: { wheel: "wheel", detent: "detent", spring: "passing" },
  labels: [
    { text: "D", at: [2.6, 1.45], offset: [0.35, 0.25] },
    { text: "E", at: [2.15, 1.36], offset: [0.1, -0.3] },
    { text: "P", at: [2.15, 1.36], offset: [-0.2, -0.3] },
    { text: "T", at: [-0.31, 1.2], offset: [0.25, -0.15] },
    { text: "V", at: [-1.38, 1.56], offset: [-0.25, 0.55] },
  ],
  texts: {
    pass: { label: "擺輪返回:齒 V 推開通過彈簧而通過,不動止動器,輪不動", quote: "齒 V 會將通過彈簧推至一旁,並在不移動槓桿的情況下通過" },
    release: { label: "擺輪朝箭頭方向轉:齒 V 推開止動器,放走一齒", quote: "齒 V 會將通過彈簧向左按壓,將槓桿推至一旁,並從擒縱輪的齒上移開止動裝置" },
  },
  view: { direction: [0.03, 0.04, 1] },
});
