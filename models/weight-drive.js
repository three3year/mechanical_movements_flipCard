// 推斷的重錘驅動(擒縱輪的驅動來源;原圖多半只畫擒縱輪與叉瓦):輪軸上固定一個鼓,鼓上繞著繩,繩(必要時經滑輪)
// 垂下吊著重錘。重錘的重量讓輪受固定的力矩往前轉;輪轉多少,鼓就放出多少繩、重錘降多少——輪被叉瓦擋住時重錘也停,
// 被叉瓦推回時重錘略升。重錘降到底要重新捲上(上鍊):每隔一段主動量捲回最高處一次,畫面上一下子回到上面。
// 純函式,和 escapement.js、pawl-drive.js 的擒縱接觸計算分開:輪的轉角照舊由接觸算,這裡只把轉角換成繩與重錘的位置。
import { add, scale, cross, sub, dot, routeRope } from "./kit.js";

/**
 * drum:鼓 { center, axis, radius, sense }——radius 是繩中心所在的半徑(鼓面加繩的半徑);sense 是輪往前轉時繞 axis 的方向(±1)。
 * pulleys:繩從重錘往鼓途中繞過的滑輪 [{ center, axis, radius, sense }](radius 同樣是繩中心的半徑;sense 是重錘上升時繩走的方向)。
 * eye:重錘在最高處時繩下端(吊環)的位置;重錘沿 −y 下降。
 * reserve:兩次上鍊之間重錘最多降多少(= 鼓上預留放出的繩長);spare:放到底時鼓上還繞著的繩長;pitch:鼓上每繞一圈沿軸錯開的距離。
 * 回傳 at(turn):turn 是輪自上次上鍊以來往前轉的角度,回傳 { eye, drop, rope(繩的折線,從吊環起), pulleys(各滑輪的轉角) }。
 */
export function weightDrive({ drum, pulleys = [], eye, reserve, spare, pitch }) {
  const n = drum.axis;
  return (turn) => {
    const drop = drum.radius * turn;
    const low = [eye[0], eye[1] - drop, eye[2]];
    // 繩從吊環往上(經滑輪)走到鼓:重錘上升時繩捲進鼓,所以在鼓上走的方向和輪往前轉相反
    const free = routeRope([{ point: low }, ...pulleys.map((c) => ({ circle: c })), { circle: { ...drum, sense: -drum.sense } }]);
    // 鼓上還繞著的繩:從繩搭上鼓的那一點,沿捲進的方向繞成螺旋
    const start = free.points[free.points.length - 1];
    const u = sub(start, drum.center);
    const axial = dot(u, n);
    const r0 = sub(u, scale(n, axial));
    const w = cross(n, r0);
    const wound = spare + reserve - drop;
    const steps = Math.max(2, Math.ceil(wound / (drum.radius * 0.2)));
    const coil = [];
    for (let i = 1; i <= steps; i++) {
      const s = (wound * i) / steps;
      const phi = (-drum.sense * s) / drum.radius;
      const along = (s / (2 * Math.PI * drum.radius)) * pitch;
      coil.push(add(drum.center, add(scale(n, axial + along), add(scale(r0, Math.cos(phi)), scale(w, Math.sin(phi))))));
    }
    // 滑輪隨繩轉:重錘下降時繩往回(往吊環那頭)走
    const turns = pulleys.map((c) => (-c.sense * drop) / c.radius);
    return { eye: low, drop, rope: [...free.points, ...coil], pulleys: turns };
  };
}
