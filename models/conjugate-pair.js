// 第 30、33 種共用:一對繞固定中心轉的非圓齒輪。照原圖給其中一輪的節曲線,另一輪依純滾動求出
// (見 noncircular.conjugate),兩輪一直保持接觸,齒依弧長均分而咬合。
// 給 r1:主動輪照原圖(第 33 種的橢圓),求從動輪;給 r2:從動輪照原圖(第 30 種的矩形滾筒),求主動輪。
// 兩種都是主動量 0 時接觸點在主動輪的局部角 0、從動輪的局部角 π(左輪在左、右輪在右)。
import { conjugate, noncircularOutline, arcAt, samplePitch } from "./noncircular.js";
import { circle } from "./shapes.js";

export function conjugatePair({ figure, r1: given1, r2: given2, teeth, module: m, center = [0, 0, 0], view, thickness = 0.24, hub = 0.32 }) {
  const { D, driven, r1, r2 } = given2 ? fromDriven(given2) : fromDriver(given1);
  const pitch = samplePitch(r1).length / teeth;
  const s1 = arcAt(r1, 0);
  const s2 = arcAt(r2, Math.PI);
  const outline1 = noncircularOutline(r1, { teeth, addendum: m, dedendum: 1.2 * m, start: s1 });
  const outline2 = noncircularOutline(r2, { teeth, addendum: m, dedendum: 1.2 * m, start: s2 + pitch / 2 });
  const left = [center[0] - D / 2, center[1], 0];
  const right = [center[0] + D / 2, center[1], 0];
  // 板面上沿節曲線內側的刻線(原圖的內框):沿法線往內等距,第 30 種方形的平邊刻出來也是直線
  const inner = (r) => {
    const pts = samplePitch(r, 240).pts;
    return pts.map(([x, y], i) => {
      const [px, py] = pts[(i + pts.length - 1) % pts.length];
      const [nx, ny] = pts[(i + 1) % pts.length];
      const len = Math.hypot(nx - px, ny - py);
      return [x - (3.2 * m * (ny - py)) / len, y + (3.2 * m * (nx - px)) / len];
    });
  };
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
    r1,
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

function fromDriver(r1) {
  const { D, driven, r2 } = conjugate(r1);
  return { D, driven, r1, r2 };
}

// 從動輪的節曲線已知:把它當成 noncircular.conjugate 的「主動輪」、接觸方向朝 π(另一輪在左),
// 求出的共軛就是主動輪;主動輪轉 θ1 時從動輪的轉角是那邊轉角關係的反函數。
function fromDriven(r2) {
  const { D, inverse, r2: r1 } = conjugate(r2, { contact: Math.PI });
  return { D, driven: inverse, r1, r2 };
}
