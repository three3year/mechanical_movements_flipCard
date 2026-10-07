// 機架的常用件:軸承座、方形導套。原圖多半沒畫,補上是為了看得到零件裝在什麼上面(推斷的部分各模型自己註明)。
// 回傳的是群組零件的 pieces,座標在群組裡。

/**
 * 軸沿 z 的軸承座:軸承環的中心在 (x, y, z),孔徑 bore;立柱從環的下緣往下到 floor,底下一塊底板。
 * 擺在要撐的零件後面(z 比零件小),免得掃到轉動的零件。
 */
export function pedestal({ at: [x, y], z, bore, floor, ring = bore + 0.15, depth = 0.3 }) {
  const top = y - ring * 0.8;
  return [
    { kind: "cylinder", radius: ring, inner: bore, length: depth, at: [x, y, z] },
    { kind: "box", size: [Math.max(0.3, ring * 1.2), top - floor, depth], at: [x, (top + floor) / 2, z] },
    { kind: "box", size: [Math.max(1.0, ring * 3), 0.18, 0.6], at: [x, floor - 0.09, z] },
  ];
}

/** 軸沿 x 的軸承座:同 pedestal,軸承環的中心在 (x, y, z),環與立柱沿 x 的厚度是 depth */
export function pedestalX({ at: [y, z], x, bore, floor, ring = bore + 0.15, depth = 0.3 }) {
  const top = y - ring * 0.8;
  return [
    { kind: "cylinder", axis: [1, 0, 0], radius: ring, inner: bore, length: depth, at: [x, y, z] },
    { kind: "box", size: [depth, top - floor, Math.max(0.3, ring * 1.2)], at: [x, (top + floor) / 2, z] },
    { kind: "box", size: [0.6, 0.18, Math.max(1.0, ring * 3)], at: [x, floor - 0.09, z] },
  ];
}

/**
 * 沿 x 滑動的方桿的方形導套:四片板圍住截面 width(y 方向)× thickness(z 方向)的桿,
 * 中心在 (x, y, z),沿桿長 length;wall 是板厚。
 */
export function squareGuide({ at: [x, y, z], width, thickness, length = 0.3, wall = 0.08 }) {
  const [hy, hz] = [width / 2 + wall / 2, thickness / 2 + wall / 2];
  return [
    { kind: "box", size: [length, wall, thickness + 2 * wall], at: [x, y + hy, z] },
    { kind: "box", size: [length, wall, thickness + 2 * wall], at: [x, y - hy, z] },
    { kind: "box", size: [length, width + 2 * wall, wall], at: [x, y, z + hz] },
    { kind: "box", size: [length, width + 2 * wall, wall], at: [x, y, z - hz] },
  ];
}
