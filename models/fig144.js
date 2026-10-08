// 第 144 種:懶剪(交叉槓桿系統)。剪架的第四個交叉點固定在下方的支座上;右側的桿推拉最右端的節點,
// 只要移動一小段,剪架就整個伸縮,左側的桿移動的距離是它的三倍(支座左邊有三格、右邊一格)。主動件是右側的桿。
const A = 0.72; // 半根桿長(每根桿長 2A,交叉點在中央)
const N_LEFT = 3; // 支座左側的格數
const FIX = [1.1, 0, 0]; // 固定的交叉點
const RANGE = [0.55, 1.25]; // 右端離固定點的距離(= 一格的寬度)

/** 一格寬 s:各節點的位置 */
export function tongs(s) {
  const h = Math.sqrt(Math.max(0, A * A - (s / 2) ** 2));
  const center = (k) => [FIX[0] + (k - N_LEFT) * s, 0, 0];
  return { h, center, left: center(0), right: center(N_LEFT + 1) };
}

const z = (p, d) => [p[0], p[1], d];

const linkIds = [];
for (let k = 0; k <= N_LEFT + 1; k++) linkIds.push(`up${k}`, `down${k}`);

export default {
  figure: 144,
  parts: [
    { id: "rightRod", kind: "group", pieces: [{ kind: "cylinder", axis: [1, 0, 0], radius: 0.07, length: 1.1, at: [0.75, 0, 0] }, { kind: "cylinder", radius: 0.2, inner: 0.1, length: 0.18 }] },
    // 左桿加長:它走的距離是右桿的三倍,要在整個行程裡都穿在導套裡
    { id: "leftRod", kind: "group", pieces: [{ kind: "cylinder", axis: [1, 0, 0], radius: 0.07, length: 2.6, at: [-1.5, 0, 0] }, { kind: "box", size: [0.42, 0.38, 0.18] }] },
    // 每個交叉點有兩根桿(上斜、下斜);最左、最右兩個節點只有半根
    ...linkIds.map((id) => ({ id, kind: "link", width: 0.1, thickness: 0.05 })),
    // 支座:立板從地面伸到交叉點上方,板上的樞銷穿過第四個交叉點的兩根桿,剪架就以它為支點
    {
      id: "post",
      kind: "group",
      pieces: [
        { kind: "box", size: [0.6, 1.7, 0.2], at: [FIX[0], -0.5, -0.2] },
        { kind: "cylinder", radius: 0.07, length: 0.5, at: [FIX[0], 0, -0.1] },
        { kind: "cylinder", radius: 0.14, length: 0.06, at: [FIX[0], 0, 0.12] }, // 銷頭
      ],
    },
    {
      id: "sleeves",
      kind: "group",
      // 兩根桿的導套與立柱(推斷:原圖的桿伸出畫面外;導套的位置讓桿在行程兩端都還穿著)
      pieces: [-3.1, 2.75].flatMap((x) => [
        { kind: "cylinder", axis: [1, 0, 0], radius: 0.16, inner: 0.07, length: 0.1, at: [x, 0, 0] },
        { kind: "box", size: [0.1, 1.09, 0.16], at: [x, -0.705, 0] },
        { kind: "box", size: [0.5, 0.1, 0.4], at: [x, -1.3, 0] },
      ]),
    },
  ],
  driver: { part: "rightRod", type: "translation", direction: [1, 0, 0], range: RANGE.map((s) => FIX[0] + s), initial: FIX[0] + 0.9 },
  target: "leftRod",
  view: { direction: [0.06, 0.05, 1], fit: ["post", "up0", "down0", "up4", "down4"] },
  pose(x) {
    const s = x - FIX[0];
    const { h, center, left, right } = tongs(s);
    const parts = { rightRod: { position: right }, leftRod: { position: left } };
    for (let k = 0; k <= N_LEFT + 1; k++) {
      const c = center(k);
      const d = k % 2 === 0 ? 0.04 : -0.04; // 相鄰的桿前後錯開
      // 往右上的桿與往右下的桿(端點在相鄰兩格之間的上、下節點)
      const from = (dir) => (k === 0 ? c : [c[0] - s / 2, -dir * h, 0]);
      const to = (dir) => (k === N_LEFT + 1 ? c : [c[0] + s / 2, dir * h, 0]);
      parts[`up${k}`] = { from: z(from(1), d), to: z(to(1), d) };
      parts[`down${k}`] = { from: z(from(-1), -d), to: z(to(-1), -d) };
    }
    return { parts, readouts: [] };
  },
};
