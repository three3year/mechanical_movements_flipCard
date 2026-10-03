// 實體驗證測試共用:小型的合成模型定義
export const square = (w, h = w) => [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
export const circle = (r, n = 24) => Array.from({ length: n }, (_, i) => [r * Math.cos((i / n) * Math.PI * 2), r * Math.sin((i / n) * Math.PI * 2)]);
export const plate = (id, outline, center, extra = {}) => ({ id, kind: "plate", center, shape: { outline, holes: extra.holes ?? [] }, thickness: 0.2, ...extra });

/**
 * 合成模型:parts 的第一個是主動件(轉動,主動量 0–1);pose(v, state) 回傳各零件的姿勢。
 * extra 可覆寫 driver、加上 states、waivers、powered、replay,或以 paths(v) 給路徑零件的姿勢。
 */
export function model(parts, pose = () => ({}), { paths, ...extra } = {}) {
  return {
    figure: 0,
    parts,
    driver: { part: parts[0].id, type: "rotation", range: [0, 1] },
    pose: (v, state) => ({ parts: pose(v, state), paths: paths?.(v, state) ?? {}, readouts: [] }),
    ...extra,
  };
}

export const of = (findings, check) => findings.filter((f) => f.check === check && !f.waived);
