// 第 481 種:濕式氣錶。靜止的外殼 A 注水到中心以上。裡面旋轉的鼓分成四個隔室 B,入口在中央管 a 的周圍,a 經鼓的空心軸頸
// 把氣體引進來;這根管往上彎,讓氣體進到水面上方(中心附近的箭頭)。氣體依序進入各隔室,使鼓朝周緣附近的箭頭方向轉,
// 並把隔室裡的水排出;隔室轉過去後又再注滿水。各隔室的容積已知,鼓的轉數由錶盤記錄,所以通過的氣量就被記下來。
// 主動件是虛擬的「進程」:通過的氣量(以鼓的轉數計)。
// 原圖(525 px 放大):周緣的箭頭在鼓的右下、指向右上——鼓逆時針轉;四片隔板從中心附近順時針彎向外緣、再沿外緣走一段,
// 末端和下一片隔板的轉角之間留一道台階,就是隔室的出口。入口是隔板內端之間、圍著管 a 的中央空間。
// 推斷:管 a 從外殼後面經填料函、軸承與鼓的空心軸頸伸到中心,在中央空間裡往上彎、出口在水面上方;鼓的後盤托著軸頸,
// 前端板省略(剖面),只畫一個小輪轂與四根輻條托住前軸頸;前軸頸架在橫過外殼開口的 V 形托架的軸承上,軸頸上的小齒輪
// 帶動托架上的錶盤齒輪(4:1,指針塗記號色;原文「鼓的轉數由錶盤機構記錄」,原圖是剖面沒畫錶盤);外殼頂上補一根出氣的短管。
// 進氣的隔室:入口中點在水面上的那一個,裡面的氣把水面壓低(點畫到水面下);出口浮出水面的隔室把氣放進外殼、從頂上的短管出去;
// 出口沉回水裡後隔室又注滿水(沒有點)。偏離插圖:隔板的彎度(SWEEP 95°)比插圖大(插圖近乎徑向再沿外緣走),
// 這樣入口沉到水面下之後出口才浮出來,氣不會從入口直接穿到出口(實物可行優先於插圖外形)。剖面圖。
import { TAU, deg, polar, wrap } from "./kit.js";
import { stream } from "./flow.js";
import { shape, circle, thickLine } from "./shapes.js";

export const R = 1.55; // 鼓的半徑(隔室外壁的外緣)
const CASE = 1.85; // 外殼的內半徑
export const WATER = 0.3; // 水面(中心以上)
export const CHAMBERS = 4;
export const R_IN = 0.5; // 隔板內端的半徑:中央空間的半徑,入口在這一圈上、隔板與隔板之間
export const SWEEP = deg(95); // 隔板從內端到外緣順時針掃過的角
export const GAP = deg(12); // 隔室出口:外壁末端和下一片隔板轉角之間的開口(原圖外緣的台階)
export const DISPLACE = 0.35; // 進氣的隔室裡水面被壓低的量
const WALL = 0.06;
const DEPTH = 0.56; // 鼓的深度(隔板的厚度)
const R_RIM = R - WALL / 2; // 外壁的中心線
const ARC = TAU / CHAMBERS - GAP; // 每片隔板沿外緣走的那一段
const base = (k) => (k * TAU) / CHAMBERS; // 隔板 k 內端的角(鼓的局部座標)
const PIPE_R = 0.11;
const JOURNAL_R = 0.22;
const FRONT_Z = 0.39; // 前托架所在的深度(z 0.33..0.45)
const DIAL_AT = polar(0.5, deg(-135)); // 錶盤齒輪的中心:在左下的托架臂上,和軸頸上的小齒輪(0.1)相切(0.1 + 0.4)

/** 隔板 k 在半徑 r 處的角(內端 R_IN 到外緣之間順時針彎) */
export const wallAngle = (k, r) => base(k) - SWEEP * Math.min(1, Math.max(0, (r - R_IN) / (R_RIM - R_IN)));

/** 隔板 k 的中心線:從內端順時針彎到外緣(第 12 點是轉角),再沿外緣走 ARC,末端前留出口 */
export function partition(k) {
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const r = R_IN + ((R_RIM - R_IN) * i) / 12;
    pts.push(polar(r, wallAngle(k, r)).slice(0, 2));
  }
  for (let i = 1; i <= 10; i++) pts.push(polar(R_RIM, base(k) - SWEEP - (ARC * i) / 10).slice(0, 2));
  return pts;
}

// 入口中點(隔板 k、k+1 內端之間)比出口中點(隔板 k 的轉角和隔板 k+1 外壁末端之間)領先的角
const LEAD = Math.PI / 4 + SWEEP - GAP / 2;
// 出口沉回水面下的時刻(以 u 計):u 從入口中點在右方(3 點鐘)起算
const VENT_END = Math.PI - Math.asin(WATER / R) + SWEEP - GAP / 2;

/**
 * 鼓轉 a(逆時針為正)→ 每個隔室的狀態:inlet 入口中點的角、outlet 出口中點的角、u 入口中點從右方(3 點鐘)起算轉過的角、
 * filling 正在進氣(入口中點在水面上、出口還沒浮出)、venting 出口浮出水面在排氣、flooded 排完氣沉回水裡注滿水(入口、出口都在水下)
 */
export function chambers(a) {
  return Array.from({ length: CHAMBERS }, (_, k) => {
    const inlet = base(k) + Math.PI / 4 + a;
    const outlet = inlet - LEAD;
    const u = wrap(inlet - Math.PI / 4);
    const inletUp = R_IN * Math.sin(inlet) > WATER;
    const venting = R * Math.sin(outlet) > WATER;
    return { inlet, outlet, u, filling: inletUp && !venting, venting, flooded: !inletUp && !venting && u > VENT_END };
  });
}

/** 隔室 k 裡的氣(點):隔板 k 與 k+1 之間、水面 floor 以上 */
export function chamberGas(a, k, floor) {
  const pts = [];
  for (let r = R_IN + 0.15; r < R_RIM - 0.1; r += 0.2) {
    const a0 = wallAngle(k, r) + 0.1 / r;
    const a1 = wallAngle(k + 1, r) - 0.1 / r;
    const n = Math.max(1, Math.floor(((a1 - a0) * r) / 0.2));
    for (let i = 0; i <= n; i++) {
      const p = polar(r, a + a0 + ((a1 - a0) * i) / n, 0.3);
      if (p[1] > floor) pts.push(p);
    }
  }
  return pts;
}

const armAngle = (k) => base(k) - SWEEP - ARC / 2; // 前輻條:落在隔板 k 外壁段的中間
const bracketArm = (angle) => ({ kind: "plate", shape: shape(thickLine([polar(0.12, angle).slice(0, 2), polar(CASE + 0.1, angle).slice(0, 2)], 0.1)), thickness: 0.12, at: [0, 0, FRONT_Z] });

export default {
  figure: 481,
  parts: [
    {
      id: "casing",
      kind: "group",
      label: "A",
      labelOffset: [1.25, -1.05, 0.5],
      pieces: [
        { kind: "plate", shape: shape(circle(CASE + 0.1), [circle(CASE).reverse()]), thickness: 0.7 },
        // 背板,中央開軸頸的孔
        { kind: "plate", shape: shape(circle(CASE + 0.1), [circle(JOURNAL_R).reverse()]), thickness: 0.04, at: [0, 0, -0.37] },
        { kind: "box", size: [3.0, 0.25, 0.9], at: [0, -CASE - 0.2, 0] },
        // 背板後面托著空心軸頸的軸承座(推斷),後端是管 a 穿過的填料函
        { kind: "cylinder", role: "bearing", radius: 0.32, inner: JOURNAL_R, length: 0.24, at: [0, 0, -0.48] },
        { kind: "cylinder", radius: 0.32, inner: 0.26, length: 0.06, at: [0, 0, -0.61] },
        { kind: "cylinder", role: "gland", radius: 0.32, inner: PIPE_R, length: 0.1, at: [0, 0, -0.67] },
        // 中央的進氣管 a:從外殼後面穿過填料函與空心軸頸到中心,再往上彎、出口在水面上方(留在隔板內端圍出的中央空間裡)
        { kind: "cylinder", role: "pipe", radius: PIPE_R, length: 1.06, at: [0, 0, -0.42] },
        { kind: "cylinder", role: "riser", radius: PIPE_R, length: 0.51, axis: [0, 1, 0], at: [0, 0.145, 0] },
        // 橫過外殼開口的 V 形托架(推斷):中央的軸承托住前軸頸,兩臂斜向下接在外殼的圈壁上
        { kind: "cylinder", role: "frontBearing", radius: 0.17, inner: 0.07, length: 0.12, at: [0, 0, FRONT_Z] },
        bracketArm(deg(-45)),
        bracketArm(deg(-135)),
        // 外殼頂上的出氣短管(推斷)
        { kind: "cylinder", radius: 0.1, inner: 0.06, length: 0.4, axis: [0, 1, 0], at: [0, CASE + 0.25, 0] },
      ],
    },
    { id: "labela", kind: "group", pieces: [], label: "a", labelOffset: [-0.28, 0.12, 0.6] },
    // 外殼裡的水(圓形外殼,以幾層水平的水片逼近)
    ...Array.from({ length: 10 }, (_, k) => {
      const y0 = -CASE + ((WATER + CASE) * k) / 10;
      const y1 = -CASE + ((WATER + CASE) * (k + 1)) / 10;
      const yw = Math.abs(y0) > Math.abs(y1) ? y1 : y0; // 用較窄的那一端,不超出外殼
      return { id: `water${k}`, kind: "fill", fluid: "water", center: [0, (y0 + y1) / 2, 0], size: [2 * Math.sqrt(Math.max(0, CASE * CASE - yw * yw)) - 0.04, y1 - y0, 0.6], level: 1 };
    }),
    {
      id: "drum",
      kind: "group",
      spin: 1.2, // 轉向箭頭放在外殼圈壁的前面(半徑 1.42、z 0.5),不被圈壁擋住
      spinOffset: 0.5,
      pieces: [
        // 四片隔板(含沿外緣的那一段外壁);第一片帶記號
        ...Array.from({ length: CHAMBERS }, (_, k) => ({ kind: "plate", shape: shape(thickLine(partition(k), WALL)), thickness: DEPTH, ...(k === 0 ? { mark: partition(0)[6] } : {}) })),
        // 後盤:托著隔板,中央開管 a 穿過的孔
        { kind: "plate", shape: shape(circle(R), [circle(PIPE_R + 0.01).reverse()]), thickness: 0.04, at: [0, 0, -0.3] },
        // 空心軸頸:管 a 從裡面穿過,往後伸進軸承座
        { kind: "cylinder", role: "journal", radius: JOURNAL_R, inner: PIPE_R, length: 0.33, at: [0, 0, -0.445] },
        // 前面的小輪轂與四根輻條(推斷:前端板剖掉了),托住前軸頸
        { kind: "plate", shape: shape(circle(0.25)), thickness: 0.06, at: [0, 0, 0.31] },
        ...Array.from({ length: CHAMBERS }, (_, k) => ({ kind: "plate", shape: shape(thickLine([[0, 0], polar(R_RIM, armAngle(k)).slice(0, 2)], 0.06)), thickness: 0.06, at: [0, 0, 0.31] })),
        { kind: "cylinder", role: "frontJournal", radius: 0.07, length: 0.35, at: [0, 0, 0.445] },
        // 前軸頸上帶動錶盤的小齒輪(推斷)
        { kind: "gear", teeth: 8, radius: 0.1, width: 0.08, at: [0, 0, 0.54] },
      ],
    },
    ...Array.from({ length: CHAMBERS }, (_, k) => ({ id: `labelB${k}`, kind: "group", pieces: [], label: "B", labelOffset: [0, 0, 0.5] })),
    // 錶盤齒輪與指針(推斷):裝在托架的左臂上,由前軸頸上的小齒輪帶動,鼓轉一圈指針反向轉 1/4 圈
    {
      id: "dial",
      kind: "gear",
      center: [DIAL_AT[0], DIAL_AT[1], 0.54],
      teeth: 32,
      radius: 0.4,
      width: 0.08,
      pieces: [
        { kind: "cylinder", radius: 0.04, length: 0.3, at: [0, 0, -0.08] },
        { kind: "box", size: [0.34, 0.05, 0.03], at: [0.17, 0, 0.055], accent: true },
      ],
    },
  ],
  powered: ["drum"], // 外力來源:直接受力(流體、重力、離心力、熱脹或拉力)推動的零件
  driver: { type: "virtual", label: "進程", mode: "progress", range: [0, 1], unit: "轉", speed: 0.1 },
  target: "drum",
  view: { direction: [0.03, 0.05, 1] },
  waivers: [{ check: "interference", parts: ["drum", "dial"], reason: "簡化齒形:前軸頸上的小齒輪與錶盤齒輪梯形齒的齒側重疊 0.04(96 個取樣全部)" }],
  pose(progress) {
    const a = TAU * progress; // 逆時針(原圖周緣的箭頭)
    const cs = chambers(a);
    const parts = { drum: { angle: a }, dial: { angle: -a / 4 } };
    cs.forEach((_, k) => (parts[`labelB${k}`] = { position: polar(1.0, wallAngle(k, 1.0) + Math.PI / 4 + a) }));
    const travel = progress * 20;
    const z = 0.3;
    const gas = [];
    const fillK = cs.findIndex((c) => c.filling);
    const ventK = cs.findIndex((c) => c.venting);
    if (fillK >= 0) {
      // 從管 a 的出口(水面上方)進到入口在最高處的隔室
      const c = cs[fillK];
      gas.push(...stream([[0, 0.25, z], [0, 0.55, z], polar(R_IN + 0.12, c.inlet, z), polar(0.9, wallAngle(fillK, 0.9) + Math.PI / 4 + a, z)], travel, { spacing: 0.15 }));
    }
    // 隔室裡的氣:進氣的隔室把水面壓低;排過氣、沉回水裡的隔室注滿水,沒有氣
    cs.forEach((c, k) => {
      if (!c.flooded) gas.push(...chamberGas(a, k, c.filling ? WATER - DISPLACE : WATER));
    });
    if (ventK >= 0) {
      // 出口浮出水面:氣沿外殼的內側走到頂上的短管出去
      const o = wrap(cs[ventK].outlet);
      const arc = Array.from({ length: 9 }, (_, i) => polar(CASE - 0.15, o + ((Math.PI / 2 - o) * i) / 8, z));
      gas.push(...stream([polar(R - 0.15, o, z), ...arc, [0, CASE + 0.05, z], [0, CASE + 0.55, z]], travel, { spacing: 0.15 }));
    }
    return {
      parts,
      flows: [{ fluid: "air", points: gas }],
      readouts: [
        { label: "通過的氣量", value: `${(progress * CHAMBERS).toFixed(1)} 室` },
        { label: "隔室", value: `進氣 ${fillK >= 0 ? 1 : 0}、排氣 ${ventK >= 0 ? 1 : 0}、注滿水 ${cs.filter((c) => c.flooded).length}` },
      ],
    };
  },
};
