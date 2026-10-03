// 第 30、33 種共用:一對繞固定中心轉的非圓齒輪。主動輪的節曲線照原圖(矩形、橢圓),
// 從動輪的節曲線依純滾動求出(見 noncircular.conjugate),兩輪一直保持接觸,齒依弧長均分而咬合。
import { conjugate, noncircularOutline, arcAt, samplePitch } from "./noncircular.js";
import { circle } from "./shapes.js";

export function conjugatePair({ figure, r1, teeth, module: m, center = [0, 0, 0], view, thickness = 0.24, hub = 0.32 }) {
  const { D, driven, r2 } = conjugate(r1);
  const pitch = samplePitch(r1).length / teeth;
  const s1 = arcAt(r1, 0);
  const s2 = arcAt(r2, Math.PI);
  const outline1 = noncircularOutline(r1, { teeth, addendum: m, dedendum: 1.2 * m, start: s1 });
  const outline2 = noncircularOutline(r2, { teeth, addendum: m, dedendum: 1.2 * m, start: s2 + pitch / 2 });
  const left = [center[0] - D / 2, center[1], 0];
  const right = [center[0] + D / 2, center[1], 0];
  // 板面上沿節曲線內側的刻線(原圖的內框)
  const inner = (r) => Array.from({ length: 120 }, (_, i) => {
    const a = (i / 120) * 2 * Math.PI;
    const k = r(a) - 3.2 * m;
    return [k * Math.cos(a), k * Math.sin(a)];
  });
  const gear = (id, at, outline, r) => ({
    id,
    kind: "plate",
    center: at,
    shape: { outline, holes: [circle(0.12).reverse()] },
    thickness,
    hub,
    circles: [hub * 1.45],
    engrave: [inner(r)],
    mark: [0, 0.75],
    markSize: 0.09,
    spin: 1.4,
  });
  return {
    D,
    driven,
    r2,
    def: {
      figure,
      parts: [gear("driver", left, outline1, r1), gear("driven", right, outline2, r2)],
      driver: { part: "driver", type: "rotation" },
      target: "driven", // 做變速旋轉的從動輪
      view: { direction: view ?? [0.1, 0.08, 1] },
      pose(angle) {
        return { parts: { driver: { angle }, driven: { angle: driven(angle) } }, readouts: [] };
      },
    },
  };
}
