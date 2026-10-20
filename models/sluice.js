// 渠裡的閘門與升降它的螺桿(第 431、432 種共用)。閘門是擋在渠裡的直立板(薄的方向沿水流 x);前後各一對立柱(樁)
// 貼著閘門的上游面與下游面、打進渠底;橫樑擱在四根立柱頂上、橫跨在閘門正上方;螺桿從閘門頂穿過橫樑的螺孔(孔沒畫出來)
// 伸到上方,橫樑上的螺帽(帶手柄)轉動時把閘門升降。立柱、橫樑、螺桿、螺帽都是推斷:原圖只畫側面——兩根立柱夾著薄薄的閘門,
// 上面一根橫樑與螺桿。做成前後各一對而不是原圖側面看到的兩根,是因為一根立柱只能站在渠的正中擋住水;一對分站在閘門的兩邊緣,
// 水從中間流過。回傳的是機架群組的 pieces,座標是世界座標(閘門的中面在 z = 0)。
export function sluice({ x, bottom, height, depth, bed, top, thickness = 0.12, post = 0.14, screw = 0.04, reach = 0.45, handle = true }) {
  const gate = { kind: "box", size: [thickness, height, depth], at: [x, bottom + height / 2, 0] };
  const dx = thickness / 2 + post / 2;
  const dz = depth / 2 - post / 2;
  const posts = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => ({ kind: "box", size: [post, top - bed, post], at: [x + sx * dx, (top + bed) / 2, sz * dz] })));
  const beam = { kind: "box", size: [thickness + 2 * post + 0.1, 0.12, depth], at: [x, top + 0.06, 0] };
  const gateTop = bottom + height;
  const rodTop = top + 0.12 + reach;
  const rod = { kind: "cylinder", axis: [0, 1, 0], radius: screw, length: rodTop - gateTop, at: [x, (gateTop + rodTop) / 2, 0] };
  const nut = { kind: "cylinder", axis: [0, 1, 0], radius: screw + 0.07, length: 0.16, at: [x, top + 0.12 + 0.08, 0] };
  const handles = handle ? [{ kind: "box", size: [1.0, 0.07, 0.07], at: [x, top + 0.2, 0], accent: true }] : [];
  return { gate, posts, beam, rod, nut, pieces: [gate, ...posts, beam, rod, nut, ...handles] };
}
