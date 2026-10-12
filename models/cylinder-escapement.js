// 第 294–295 種共用:圓筒式擒縱。擺輪軸的一端是一段切掉將近一半的空心圓筒(A、B 為兩側的切口邊緣);
// 擒縱輪的齒是立在細柄上的楔形叉瓦(a、b、c),交替地停靠在圓筒的外側與內側。擺輪往一邊擺時,
// 切口轉到停在外側的齒前面,齒尖滑過切口邊緣 A 進到圓筒裡,楔形的斜面推著邊緣走(給擺輪衝量),
// 齒尖接著停在圓筒的內壁上;擺回來時另一側的邊緣 B 轉過齒尖,齒從切口出去,斜面再推一次,
// 下一齒的齒尖落在圓筒的外壁上。擺輪每擺一次,擒縱輪前進半個齒。
// 主動件是擺輪(累計擺動);目標件是擒縱輪(擒縱讓它一齒一齒地放行)。第 294 種從側面看圓筒(軸橫放),
// 第 295 種從正面看叉瓦那一層的剖面(擒縱輪的一段與圓筒)。
//
// 由接觸算(models/escapement.js 的 escapeByContact):輪受重錘的固定力矩往順時針轉,被圓筒的壁擋住就停,
// 齒的斜面滑過切口邊緣時推著走,脫開後加速落到圓筒的另一面。算接觸的是叉瓦那一層的圓筒截面(切開的圓環)。
//
// 前後的安排(z):輪面在 z = 0;每齒一根細柄從輪緣往後(−z)伸出,柄的外端立一根短柱,楔形叉瓦裝在短柱上,
// 在輪面後面的那一層(實物的圓筒擒縱輪也是齒立在柱上、高出輪面,圓筒才能伸進齒與輪面之間)。圓筒從叉瓦那一層
// 往後接完整的圓筒、端蓋、擺輪軸與擺輪,軸的末端裝在軸承架上——所以從正面(+z)看,叉瓦那一層前面
// 沒有圓筒的其餘部分擋住(第 295 種的原圖畫的就是這一層的剖面)。
// 偏離插圖:原圖第 294 種的圓筒在切口的另一邊還有一段,末端是錐形的塞子與下樞軸(實物的圓筒穿過輪面那一層,
// 那裡另有一個較深的缺口讓細柄通過);模型的圓筒到切口那一層就結束、下端不裝樞軸,因為細柄就在那一層前面掃過,
// 塞子也會從正面蓋住第 295 種要看的剖面(理由:插圖外形讓位給第 295 種看得到原理)。切開的那一段做得比叉瓦層長,
// 側面看得出切口。
// 推斷:齒數、齒形、擺幅與切口的大小;細柄與短柱的形狀;擺輪(原文「圓筒的頂部連接著擺輪」,原圖第 294 種
// 只畫到承擺輪的凸緣,輪本身沒畫)的大小與輪輻;軸承架與立柱(原圖沒畫)。
// 推斷的驅動(原文沒說輪為什麼往前轉;共用 weight-drive.js,照第 234、238 種):輪軸往後伸,輪與軸承架之間
// 有一個鼓,繩從鼓的右側垂下吊著重錘;重錘的重量就是讓輪順時針轉的固定力矩,輪轉多少重錘降多少,被圓筒擋住時
// 重錘也停。輪每轉一圈重錘捲回最高處一次(上鍊,畫面上一下子回到上面)。錶實際上是用發條經輪系帶動,
// 這裡用重錘只是示意(讀者一眼看得出力從哪裡來)。
import { TAU, deg, swing, Y, Z } from "./kit.js";
import { escapeByContact, placePoly, ccw } from "./escapement.js";
import { shape, circle, arcPoints, thickLine } from "./shapes.js";
import { weightDrive, rewound } from "./weight-drive.js";

export const N = 15;
export const PITCH = TAU / N;
export const SWING = deg(110);
const RC = 2.2; // 圓筒軸心到輪心的距離(在齒走的圓上)
const CYL = { r: 0.24, inner: 0.19, cut: deg(150) }; // 圓筒外徑、內徑、切口張開的角度
const OPEN = deg(-90); // 擺輪居中時切口朝的方向(朝輪心)
const AT = [0, RC];
const WEDGE = { length: 0.34, half: 0.06 }; // 叉瓦:沿走向的長度、根部(後端)的半寬

/** 擺輪累計擺動 v → 擺輪角 */
export const balanceAngle = (v) => swing(v, -SWING, SWING);

// 叉瓦(輪的局部座標,第 i 齒):齒尖在前(順時針轉時在前,角度小的一側)、在齒走的圓上,往後漸寬成楔形
const wedge = (i) => {
  const a0 = Math.PI / 2 + i * PITCH; // 齒尖的方位
  const a1 = a0 + WEDGE.length / RC; // 後端
  const p = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  return ccw([p(RC, a0), p(RC + WEDGE.half, a1), p(RC - WEDGE.half, a1)]);
};
const teeth = Array.from({ length: N }, (_, i) => wedge(i));

// 叉瓦那一層的圓筒截面:切開的圓環(擺輪居中時切口朝 OPEN)
const ringSection = (() => {
  const a0 = OPEN + CYL.cut / 2;
  const a1 = OPEN - CYL.cut / 2 + TAU;
  return [...arcPoints(CYL.r, a0, a1), ...arcPoints(CYL.inner, a1, a0)];
})();

export const escapement = {
  ...escapeByContact({ center: [0, 0], teeth, dir: -1, period: 4 * SWING, samples: 1440, stops: (v) => [placePoly(ringSection, AT, balanceAngle(v))] }),
  period: 4 * SWING,
};

/** 擺輪累計擺動 v → 擺輪角、擒縱輪轉角(順時針為負) */
export function cylinder(v) {
  return { balance: balanceAngle(v), wheel: escapement.angle(v) };
}

const WEDGE_Z = -0.17; // 叉瓦那一層(輪面後面)
const STALK = { z: -0.06, thick: 0.05, width: 0.05, from: RC - 0.58, to: RC + 0.02 }; // 細柄:從輪緣往外伸到短柱底下
const POST = { r: 0.03, z0: -0.065, z1: -0.145 }; // 短柱:從細柄往後立起,頂進楔形叉瓦的後段
// 短柱在叉瓦的中線上、離後端 0.04(那裡叉瓦的半寬約 0.053,短柱整根在叉瓦的外形之內)
const postAngle = (i) => Math.PI / 2 + i * PITCH + (WEDGE.length - 0.04) / RC;
const stalk = (i) => {
  const a = postAngle(i);
  const r = (STALK.from + STALK.to) / 2;
  return { kind: "box", size: [STALK.to - STALK.from, STALK.width, STALK.thick], at: [r * Math.cos(a), r * Math.sin(a), STALK.z], angle: a };
};
const post = (i) => {
  const a = postAngle(i);
  return { kind: "cylinder", radius: POST.r, length: POST.z0 - POST.z1, at: [RC * Math.cos(a), RC * Math.sin(a), (POST.z0 + POST.z1) / 2] };
};

// 擺輪(推斷):裝在擺輪軸上、圓筒的另一端
const BALANCE = { radius: 0.75, rim: 0.1, z: -1.0 };
// 圓筒:切開的那一段從叉瓦那一層的前面(z −0.09)往後到 −0.49(比叉瓦層長,側面看得出切口),再接完整的一段與端蓋
const CUT = { front: -0.09, back: -0.49 };
const TUBE = { back: -0.69 };
const CAP = { back: -0.79 };
const STAFF = { r: 0.07, z0: CAP.back, z1: -1.36 }; // 擺輪軸:從圓筒的端蓋往後伸進軸承架
const COCK_Z = -1.3; // 擺輪軸末端的軸承架
const REAR_Z = -0.65; // 輪軸後端的軸承條
const PILLAR = [2.6, 0.95]; // 立柱(在輪與擺輪的外面,不擋住圓筒)
const spokes = [0, 1, 2].map((k) => {
  const a = deg(90) + (k * TAU) / 3;
  return { kind: "plate", shape: shape(thickLine([[0, 0], [(BALANCE.radius - 0.05) * Math.cos(a), (BALANCE.radius - 0.05) * Math.sin(a)]], 0.08)), thickness: 0.05, at: [0, 0, BALANCE.z] };
});

// 推斷的重錘驅動:鼓在輪軸上、輪與輪軸後端的軸承條之間,繩從鼓的右側垂下吊著重錘
const ROPE_R = 0.04;
const DRUM_R = 0.15;
const DRUM = { center: [0, 0, -0.4], axis: Z, radius: DRUM_R + ROPE_R, sense: -1 }; // 輪往前(順時針)轉時繩從鼓上放出
const WEIGHT = { radius: 0.17, height: 0.4 };
const REWIND = N * 4 * SWING; // 輪轉一圈(擺輪擺十五個來回)上鍊一次
const hang = weightDrive({
  drum: DRUM,
  eye: [DRUM.radius, -2.7, DRUM.center[2]],
  reserve: DRUM.radius * TAU,
  spare: 0.8 * TAU * DRUM.radius,
  pitch: 2 * ROPE_R,
});
const weightAt = rewound(hang, (v) => -escapement.angle(v), REWIND); // 輪往前(順時針)轉的角度

export const geometry = { DRUM, REWIND, SWING, BALANCE, WEDGE_Z };

export function cylinderEscapement(figure, view) {
  return {
    figure,
    parts: [
      {
        id: "wheel",
        kind: "group",
        spin: RC - 0.6,
        arrow: false,
        pieces: [
          { kind: "plate", shape: shape(circle(RC - 0.5), [circle(RC - 0.75).reverse()]), thickness: 0.08 },
          { kind: "box", size: [2 * (RC - 0.75), 0.12, 0.06] },
          { kind: "box", size: [0.12, 2 * (RC - 0.75), 0.06] },
          { kind: "cylinder", radius: 0.15, length: 0.3 },
          { kind: "cylinder", radius: 0.05, length: 0.68, at: [0, 0, -0.34] }, // 輪軸,往後伸進軸承條
          { kind: "cylinder", radius: DRUM_R, length: 0.2, at: [...DRUM.center] }, // 繞繩的鼓(推斷)
          ...Array.from({ length: N }, (_, i) => stalk(i)),
          ...Array.from({ length: N }, (_, i) => post(i)),
          ...teeth.map((t, i) => ({ kind: "plate", shape: shape(t), thickness: 0.1, at: [0, 0, WEDGE_Z], accent: i === 0 })),
        ],
      },
      {
        id: "cylinder",
        kind: "group",
        center: [...AT, 0],
        spin: BALANCE.radius + 0.12,
        spinOffset: BALANCE.z,
        label: "A",
        labelOffset: [-0.45, 0.2, 0.5],
        pieces: [
          // 切掉將近一半的空心圓筒:叉瓦那一層是切開的圓環,往後接完整的圓筒、端蓋與擺輪軸
          { kind: "plate", shape: shape(ringSection), thickness: CUT.front - CUT.back, at: [0, 0, (CUT.front + CUT.back) / 2] },
          { kind: "plate", shape: shape(circle(CYL.r), [circle(CYL.inner).reverse()]), thickness: CUT.back - TUBE.back, at: [0, 0, (CUT.back + TUBE.back) / 2] },
          { kind: "cylinder", radius: CYL.r, length: TUBE.back - CAP.back, at: [0, 0, (TUBE.back + CAP.back) / 2] },
          { kind: "cylinder", radius: STAFF.r, length: STAFF.z0 - STAFF.z1, at: [0, 0, (STAFF.z0 + STAFF.z1) / 2] },
          // 擺輪(推斷):輪緣、三根輪輻與輪轂;輪緣上一顆調整螺絲當抓取處
          { kind: "plate", shape: shape(circle(BALANCE.radius), [circle(BALANCE.radius - BALANCE.rim).reverse()]), thickness: 0.07, at: [0, 0, BALANCE.z] },
          ...spokes,
          { kind: "cylinder", radius: 0.13, length: 0.12, at: [0, 0, BALANCE.z] },
          { kind: "cylinder", radius: 0.06, length: 0.1, at: [BALANCE.radius + 0.02, 0, BALANCE.z], accent: true },
        ],
      },
      {
        id: "cock",
        kind: "group",
        pieces: [
          // 擺輪軸末端的軸承架(橫臂接到立柱)、立柱、輪軸後端的軸承條(原圖沒畫,推斷)
          { kind: "cylinder", radius: 0.13, inner: STAFF.r, length: 0.12, at: [AT[0], AT[1], COCK_Z] },
          { kind: "plate", shape: shape(thickLine([AT, PILLAR], 0.16)), thickness: 0.12, at: [0, 0, COCK_Z] },
          { kind: "box", size: [0.16, 0.16, REAR_Z + 0.05 - (COCK_Z - 0.06)], at: [...PILLAR, (REAR_Z + 0.05 + COCK_Z - 0.06) / 2] },
          { kind: "plate", shape: shape(thickLine([[0, 0], PILLAR], 0.16)), thickness: 0.1, at: [0, 0, REAR_Z] },
          { kind: "plate", shape: shape(circle(0.2)), thickness: 0.1, at: [0, 0, REAR_Z] },
        ],
      },
      { id: "labelB", kind: "group", center: [...AT, 0], label: "B", labelOffset: [0.45, 0.2, 0.5] },
      { id: "rope", kind: "rope", radius: ROPE_R },
      { id: "weight", kind: "weight", axis: Y, radius: WEIGHT.radius, height: WEIGHT.height },
    ],
    // 動力重演:只推擺輪;擒縱輪受重錘的固定力矩往順時針轉(以彈簧代替;重錘照模型的姿勢走),由圓筒的壁擋住、放行
    replay: {
      from: 0,
      to: 8 * SWING,
      seconds: 20,
      free: { wheel: { pivot: [0, 0, 0], spring: -1, gravity: false } },
      ignore: [["wheel", "cock"]], // 輪軸插在軸承條的孔裡(孔沒畫出來)
      expect: [
        { at: 2 * SWING, part: "wheel", label: "擺輪擺一次,輪前進半個齒", quote: "輪上的叉瓦 a、b、c 交替地停靠於圓筒的內側與外側" },
        { at: 4 * SWING, part: "wheel", label: "擺輪來回一次,輪前進一個齒" },
        { part: "wheel", label: "擺輪來回兩次,輪前進兩個齒" },
      ],
    },
    // 從擺輪擺到 +110° 的那一端開始:切口朝右上(輪心看出去 20°),第 294 種從右上側看得到切口與停在裡面的齒
    driver: { part: "cylinder", type: "rotation", cycle: [-SWING, SWING], initial: 2 * SWING },
    target: "wheel", // 擒縱輪:擒縱讓它一齒一齒地放行
    view,
    pose(v) {
      const w = weightAt(v);
      const eye = w.eye;
      return {
        parts: {
          cylinder: { angle: balanceAngle(v) },
          wheel: { angle: escapement.angle(v) },
          weight: { position: [eye[0], eye[1] - WEIGHT.height / 2 - WEIGHT.radius * 0.38, eye[2]] },
        },
        paths: { rope: { points: w.rope, closed: false, phase: 0 } },
        readouts: [],
      };
    },
  };
}
