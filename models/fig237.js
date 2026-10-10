// 第 237 種:頂端搖臂的往復圓周運動,使它附帶的棘爪帶動冠狀棘輪(鋸齒輪,rag-wheel)間歇地轉。
// 搖臂的轂坐在輪轂頂上,套在輪軸穿出來的上端(原圖臂轂中間穿出的細銷)來回轉;臂桿伸到輪緣外,
// 棘爪是一片彎爪,上端的眼套在臂桿上,靠自重繞臂桿擺下、爪尖搭在輪緣的鋸齒上(照原圖):
// 往一個方向轉時爪尖頂著齒的直面,輪跟著轉;往回轉時爪尖沿齒的斜面滑上去、越過齒尖落下,輪不動。
// 主動量是搖臂的累計擺動量。
//
// 接觸(由接觸算,共用 pawl-drive.js):臂桿沿半徑,彎爪在和它垂直的平面(沿圓周、上下)裡擺,所以把輪緣沿圓周攤平來算——
// 爪的樞軸是臂桿(隨搖臂沿圓周移動),鋸齒隨輪的轉角沿圓周平移。推程時爪尖頂到直面就把輪推開(推的力把爪尖往齒根壓);
// 被斜面頂起時爪繞臂桿往上翻,越過齒尖後從當下的速度起加速落下,碰到齒面就停。推多遠、何時越過、落多深,都由外形相碰算出。
// 推斷:24 齒;彎爪的尺寸;搖臂每程轉三個齒距——爪繞臂桿擺,爪尖抬起、落下時也沿圓周前後挪,推程開頭爪尖先沿斜面
// 滑到齒根(一段空行程),回程落下時落在下一齒的斜面上;這樣每個來回推兩齒(每程幾齒原文沒寫);
// 輪軸下端的軸承與底座(原圖輪軸下端沒畫)。
import { TAU, X, Y, Z, swingPhase, quatMul, quatAxisAngle } from "./kit.js";
import { sawCrown } from "./escapement.js";
import { arcPoints, circle, shape } from "./shapes.js";
import { placeOutline } from "./contact.js";
import { pawlDrive } from "./pawl-drive.js";

const N = 24;
const R = 2.0;
const H = 0.42;
const PITCH = TAU / N;
const SPAN = 3 * PITCH; // 搖臂每程的擺幅
const FROM = SPAN / 2;
const TO = -SPAN / 2;
const TOP = 0.4; // 輪緣頂面高度(局部 z)
const ARC = R - 0.05; // 鋸齒所在的半徑(沿圓周攤平時的比例)
// 彎爪的眼在臂桿上的半徑與爪的厚度(沿臂桿):爪是平板、在臂桿處和圓周相切,爪尖在眼前面 0.4–0.7 處,
// 離輪心比眼遠;眼往內放一點、爪做厚一點,爪尖才整個落在鋸齒那一圈(半徑 1.87–2.0)裡
const EYE_R = R - 0.1;
const THICK = 0.16;
const HUB = 0.9; // 輪轂頂(局部 z),搖臂的轂坐在上面
const ROD = HUB + 0.12; // 臂桿的高度(局部 z)
const HP = ROD - TOP; // 爪的樞軸(臂桿)離輪緣頂面的高度
const PIN = 0.12; // 輪軸的半徑;上端穿出臂轂當作搖臂的銷
const ROD_END = R + 0.5; // 臂桿伸到輪緣外

// 彎爪的外形(攤平的座標:s 沿圓周、往輪的局部角增加的方向為正,h 往上;原點在臂桿):
// 上端是套在臂桿上的眼,爪身往下、往推的方向(−s)彎,爪尖在前下方
const EYE = 0.13;
const PAWL = [
  ...arcPoints(EYE, (-40 * Math.PI) / 180, (200 * Math.PI) / 180),
  [-0.17, -0.2],
  [-0.26, -0.38],
  [-0.37, -0.53],
  [-0.44, -0.58], // 爪尖前緣(推程頂著齒的直面)
  [-0.41, -0.62], // 爪尖底
  [-0.33, -0.52], // 爪尖後面比齒的斜面陡,爪尖才落得到齒根
  [-0.2, -0.36],
  [-0.07, -0.23],
  [0.06, -0.13],
];

// 攤平的鋸齒:齒 i 從 s = i·齒距 的齒根沿斜面升到 (i+1)·齒距 的齒尖,在那裡直落(與 sawCrown 一致);輪轉 θ,齒移 θ·ARC
const P = PITCH * ARC;
const teethAt = (theta) => {
  const shift = (((theta * ARC) % P) + P) % P;
  const out = [];
  for (let i = -6; i <= 6; i++) {
    const x = shift + i * P;
    out.push([[x, 0], [x + P, 0], [x + P, H]]);
  }
  return out;
};
const RIM = [[-4, -1], [4, -1], [4, 0], [-4, 0]]; // 輪緣頂面

const armAt = (v) => swingPhase(v, FROM, TO).at;
const drive = pawlDrive({
  period: 2 * SPAN,
  samples: 480,
  pins: (v) => ({ pawl: [armAt(v) * ARC, HP] }),
  // 被推時輪往臂的方向(局部角減少)轉
  wheel: { obstacles: (theta) => [...teethAt(theta), RIM], dir: -1, pitch: PITCH },
  // 自重讓爪往前下方擺(逆時針,在 s–h 平面);推程(臂往 −s 走)時推。落下的加速度:自靜止擺下 0.3 弧度約花擺幅的 4%
  pawls: { pawl: { outline: PAWL, into: 1, angle: 0, pushes: (v) => swingPhase(v, FROM, TO).forward, fall: 0.02 * 2 * SPAN } },
});
const W0 = drive.at(0).wheel;

/** 搖臂累計擺動 v:搖臂轉角、輪轉角(自起點,繞 +y)、彎爪繞臂桿的擺角(攤平的平面裡,往前下方為正) */
export function motion(v) {
  const s = drive.at(v);
  return { arm: armAt(v), wheel: s.wheel - W0, swing: s.angles.pawl };
}
export const geometry = { N, PITCH, SPAN, H, HP, ARC, EYE_R, THICK, ROD, ROD_END, PIN, HUB };
/** 檢查用:主動量 v 時攤平的彎爪與鋸齒(不含輪緣頂面) */
export function contactAt(v) {
  const s = drive.at(v);
  return { pawl: placeOutline(PAWL, [armAt(v) * ARC, HP], s.angles.pawl), teeth: teethAt(s.wheel) };
}

export default {
  figure: 237,
  parts: [
    {
      id: "wheel",
      kind: "group",
      axis: Y,
      spin: R + 0.1,
      pieces: [
        { kind: "cylinder", radius: R, inner: R - 0.1, length: TOP, at: [0, 0, TOP / 2] },
        { kind: "cylinder", radius: R - 0.05, length: 0.04, at: [0, 0, 0.02] },
        ...sawCrown({ teeth: N, radius: R - 0.05, height: H, base: TOP }).map((p) => ({ ...p, at: [p.at[0], p.at[1], TOP] })),
        // 輪軸:往下伸進底座的軸承,往上穿過輪轂、從臂轂中間穿出(搖臂套在上面轉)
        { kind: "cylinder", radius: PIN, length: 2.6 + ROD + 0.25, at: [0, 0, (ROD + 0.25 - 2.6) / 2], mark: true },
        { kind: "cylinder", radius: 0.2, length: HUB, at: [0, 0, HUB / 2] }, // 輪轂:從圓盤立到搖臂的轂底下
      ],
    },
    {
      id: "arm",
      kind: "group",
      axis: Y,
      arrow: false,
      pieces: [
        { kind: "cylinder", radius: 0.3, inner: PIN, length: 0.2, at: [0, 0, HUB + 0.1] }, // 臂轂:坐在輪轂頂上,套在輪軸的上端
        { kind: "cylinder", radius: 0.06, length: ROD_END - 0.25, axis: X, at: [(ROD_END + 0.25) / 2, 0, ROD] }, // 臂桿,伸到輪緣外
      ],
    },
    { id: "pawl", kind: "plate", shape: shape(PAWL, [circle(0.065).reverse()]), thickness: THICK },
    {
      id: "frame",
      kind: "group",
      pieces: [
        { kind: "cylinder", axis: Y, radius: 0.32, inner: PIN, length: 0.55, at: [0, -2.375, 0] }, // 輪軸下端的軸承(推斷)
        { kind: "box", size: [2.2, 0.12, 2.2], at: [0, -2.71, 0] }, // 底座
      ],
    },
  ],
  // 動力重演:只推搖臂;彎爪的眼套在臂桿上、靠自重繞臂桿擺;輪靠摩擦定位,由爪推動
  replay: {
    to: 4 * SPAN,
    seconds: 16,
    ignore: [["wheel", "arm"], ["wheel", "frame"]],
    free: { wheel: { hold: true, gravity: false }, pawl: { on: "arm", pivot: [EYE_R * Math.cos(FROM), TOP + HP, -EYE_R * Math.sin(FROM)], axis: [Math.cos(FROM), 0, -Math.sin(FROM)] } },
    expect: [
      { at: SPAN, part: "wheel", label: "搖臂推程:爪尖頂著直面,輪轉", quote: "頂端搖臂的往復圓周運動,會使其附帶的棘爪產生冠狀棘輪……的間歇圓周運動" },
      { at: 2 * SPAN, part: "wheel", label: "回程:爪尖沿斜面滑過,輪不動" },
      { at: 4 * SPAN, part: "wheel", label: "第二個來回,輪再被推一次" },
    ],
  },
  driver: { part: "arm", type: "rotation", cycle: [FROM, TO] },
  target: "wheel",
  view: { direction: [0.3, 0.75, 1] },
  pose(v) {
    const { arm, wheel, swing } = motion(v);
    // 彎爪掛在臂桿上(半徑 EYE_R):局部 x 沿圓周(+s)、y 朝上、z 沿臂桿朝外;先繞臂桿擺 swing,再隨搖臂繞輪軸轉。
    // 世界座標:輪軸是 y,局部 (x, y) → 世界 (x, −z),搖臂轉角 arm 即繞 +y 轉 arm
    return {
      parts: {
        arm: { angle: arm },
        wheel: { angle: wheel + W0 },
        pawl: { position: [EYE_R * Math.cos(arm), TOP + HP, -EYE_R * Math.sin(arm)], rotation: quatMul(quatAxisAngle(Y, arm + Math.PI / 2), quatAxisAngle(Z, swing)) },
      },
      readouts: [],
    };
  },
};
