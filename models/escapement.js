// 擒縱與冠狀棘輪的共用小工具(第 234–238 種)。純函式。
import { smooth, swingPhase, quatFromBasis } from "./kit.js";
import { shape, ratchetShape } from "./shapes.js";

/**
 * 擒縱:擒縱叉(或軸桿)在 from 與 to 之間往復(v 是累計擺動量),每擺一程放走擒縱輪半個齒距 step。
 * 一程的前段叉瓦擋住輪(鎖住),後段輪被放開、推著叉瓦前進(衝擊)。回傳輪的累計前進量。
 */
export function escapeStep(v, from, to, step, release = 0.5) {
  const { cycle, forward, f } = swingPhase(v, from, to);
  const half = 2 * cycle + (forward ? 0 : 1);
  return (half + smooth(Math.max(0, Math.min(1, (f - release) / (1 - release))))) * step;
}

/**
 * 冠狀鋸齒(齒立在輪緣上、朝上,局部 z 是輪軸):每齒一塊直角三角形板,斜邊沿 +角度方向升起,
 * 直面在每齒的終點。回傳 group 的 pieces。
 */
export function sawCrown({ teeth, radius, height, base = 0, thick = 0.12 }) {
  const pitch = (2 * Math.PI) / teeth;
  const len = 2 * radius * Math.sin(pitch / 2);
  return Array.from({ length: teeth }, (_, i) => {
    const a = (i + 0.5) * pitch;
    const t = [-Math.sin(a), Math.cos(a), 0];
    const out = [Math.cos(a), Math.sin(a), 0];
    return {
      kind: "plate",
      // 板的局部 x 沿切線(+角度方向)、y 朝上、z 朝外
      shape: shape([[-len / 2, 0], [len / 2, 0], [len / 2, height]]),
      thickness: thick,
      at: [radius * Math.cos(a) * Math.cos(pitch / 2), radius * Math.sin(a) * Math.cos(pitch / 2), base],
      rotation: quatFromBasis(t, [0, 0, 1], out),
      accent: i === 0,
    };
  });
}

/** 冠狀鋸齒在輪的局部角 u 處的齒高(與 sawCrown 一致:每齒從 0 升到 height,在齒的終點直落) */
export function sawHeight(u, teeth, height) {
  const pitch = (2 * Math.PI) / teeth;
  const f = ((u / pitch) % 1 + 1) % 1;
  return height * f;
}

/**
 * 回退式擒縱:每擺一程,齒落在叉瓦上之後,擺繼續往外擺,叉瓦的斜面把輪往回推一點(回退 recoil);
 * 擺回來時輪先追回原位,再推著叉瓦前進(衝擊)半個齒距,脫開時落到另一個叉瓦上。
 * v 是累計擺動量;回傳輪的累計前進量(每程淨前進 step)。
 */
export function escapeRecoil(v, from, to, step, recoil) {
  const { cycle, forward, f } = swingPhase(v, from, to);
  const half = 2 * cycle + (forward ? 0 : 1);
  // 一程之內:先由回退的位置追回(0–0.3),再衝擊前進一個 step(0.3–0.7),最後落鎖並被推回(0.7–1)
  let g;
  if (f < 0.3) g = -recoil * (1 - smooth(f / 0.3));
  else if (f < 0.7) g = step * smooth((f - 0.3) / 0.4);
  else g = step - recoil * smooth((f - 0.7) / 0.3);
  return half * step + g;
}

/** 擒縱輪:尖齒(鋸齒)輪+輪輻與輪轂;dir 同 ratchetShape(+1 時齒的直面朝逆時針側) */
export function escapeWheelPieces({ teeth, outer, inner, dir = 1, spokes = 4, thickness = 0.12, rim = 0.16 }) {
  const ringIn = inner - rim;
  return [
    { kind: "plate", shape: ratchetWithHole({ teeth, outer, inner, dir }, ringIn), thickness },
    ...Array.from({ length: spokes }, (_, i) => ({ kind: "box", size: [2 * ringIn, 0.1, thickness * 0.8], angle: (i * Math.PI) / spokes + 0.3 })),
    { kind: "cylinder", radius: 0.2, length: thickness * 1.6 },
  ];
}

function ratchetWithHole(spec, hole) {
  const s = ratchetShape(spec);
  const n = 72;
  const ring = Array.from({ length: n }, (_, i) => [hole * Math.cos((i / n) * 2 * Math.PI), hole * Math.sin((i / n) * 2 * Math.PI)]);
  return { outline: s.outline, holes: [ring.reverse()] };
}
