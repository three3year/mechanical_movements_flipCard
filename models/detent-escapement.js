// 第 291、313 種共用:彈簧止動式(天文台計時器)擒縱的機構。止動器(彈簧 A / 止動器)一端鎖在錶板上,另一端附近的擋止
// (鎖石)擋住擒縱輪的齒;止動器旁的細彈簧(通過彈簧)鉸在它上面、被彈力頂著它末端的鉤(角的尖端)。擺輪上的凸柱(齒 V)
// 往一個方向擺時,只把細彈簧壓彎、從旁邊過去(止動器不動);往另一個方向擺時,推著細彈簧連止動器一起推開,放走擒縱輪的一齒;
// 同時另一齒追上擺輪滾子上的凹槽側邊、推著它走(衝量),脫出後落到落回的擋止上。擺輪每來回一次,擒縱輪轉過一齒。
//
// 由接觸算(models/escapement.js 的 periodic、fall):止動器與細彈簧都是鉸接的零件——止動器靠彈簧壓在擋銷上,
// 細彈簧靠自身彈力頂著鉤;凸柱碰到細彈簧的尖端時,往一邊推就只壓彎細彈簧,往另一邊推就連止動器一起推開;放開後都加速彈回。
// 擒縱輪受發條的固定力矩順時針轉,被擋止擋住就停。
// 兩張圖的機構相同、幾何不同:各圖在自己的檔裡給出幾何(detentMechanism)與外觀(detentModel)。轉向的約定兩張圖一樣:
// 擒縱輪順時針轉;止動器被推開是繞固定端順時針;細彈簧被壓彎是繞它的固定點逆時針;擺輪先順時針擺(壓彎細彈簧)、再逆時針擺(推開止動器)。
import { TAU, swing } from "./kit.js";
import { toothedWheel, placePoly, periodic, fall, anyOverlap, clearance } from "./escapement.js";
import { arcPoints } from "./shapes.js";
import { circlePolygon } from "./contact.js";

const BANK = 0; // 止動器落在擋銷上的角度(推開為負:繞固定端順時針)
const RATE = 60; // 彈回的角加速度(每單位主動量平方)

/** 衝擊滾子(相對擺輪軸,擺輪居中時)的外形:半徑 r 的圓周上切一個凹槽 { at(方位), width, depth } */
export function rollerOutline(r, notch) {
  const a0 = notch.at - notch.width / 2;
  const a1 = notch.at + notch.width / 2;
  const rim = arcPoints(r, a1, a0 + TAU, 0, 0);
  const inner = r - notch.depth;
  return [...rim, [inner * Math.cos(a0), inner * Math.sin(a0)], [inner * Math.cos(a1), inner * Math.sin(a1)]];
}

/**
 * 機構的幾何(世界座標,2D)→ 由接觸算的運動。
 * teeth:齒數;swing:擺幅;wheel:{ at, profile(齒形,見 toothedWheel)};balance:{ at, roller, notch, pin };
 * pin:凸柱(齒 V)——{ r, size }(離擺輪軸 r 的圓銷)或 { poly }(擺輪居中時,相對擺輪軸的多邊形);
 * detent:{ pivot(固定端), bar, stop(鎖石), hook(角的尖端;細彈簧頂著它)}——外形都相對 pivot;
 * spring:{ at(固定點,止動器在擋銷上時), shape(相對 at)}。
 */
export function detentMechanism({ teeth: N, swing: SWING, wheel, balance, detent, spring }) {
  const PITCH = TAU / N;
  const W = wheel.at;
  const BAL = balance.at;
  const B = detent.pivot;
  const WHEEL = toothedWheel({ teeth: N, profile: wheel.profile, bore: 0.08 });
  const roller = rollerOutline(balance.roller, balance.notch);
  const { pin } = balance;

  /** 擺輪累計擺動 v → 擺輪角(居中時為 0;先順時針擺) */
  const balanceAngle = (v) => swing(v, SWING, -SWING);

  // 各零件在世界座標的外形(2D)
  const detentAt = (alpha) => [...detent.bar, detent.stop, ...detent.hook].map((p) => placePoly(p, B, alpha));
  const stopAt = (alpha) => [placePoly(detent.stop, B, alpha)];
  const hookAt = (alpha) => detent.hook.map((p) => placePoly(p, B, alpha));
  const iAt = (alpha) => placePoly([spring.at.map((x, k) => x - B[k])], B, alpha)[0];
  const springAt = (alpha, phi) => [placePoly(spring.shape, iAt(alpha), alpha + phi)];
  const pinAt = pin.poly ? (beta) => [placePoly(pin.poly, BAL, beta)] : (beta) => [circlePolygon([BAL[0] + pin.r * Math.cos(beta), BAL[1] + pin.r * Math.sin(beta)], pin.size, 16)];
  const rollerAt = (beta) => [placePoly(roller, BAL, beta)];
  const teethAt = (w) => WHEEL.teeth.map((t) => placePoly(t, W, w));

  function step(s, v, dv) {
    const beta = balanceAngle(v);
    const pins = pinAt(beta);
    let { alpha, wa, phi, wp, w, ww } = s;
    // 1. 細彈簧:被凸柱往一邊推就彎過去(phi 增加);往另一邊推就頂著鉤(phi = 0)連止動器一起推開(alpha 減少)
    const springHit = (p) => anyOverlap(pins, springAt(alpha, p));
    if (springHit(phi)) {
      const bend = clearance(springHit, phi, 1, 1);
      // 推開:先讓細彈簧回到鉤上,再推止動器
      const liftHit = (a) => anyOverlap(pins, springAt(a, 0));
      const lift = phi > 1e-9 && !springHit(0) ? phi : phi + clearance(liftHit, alpha, -1, 0.3);
      if (bend <= lift) [phi, wp] = [phi + bend, 0];
      else {
        const clear = clearance(liftHit, alpha, -1, 0.3);
        [phi, wp, alpha, wa] = [0, 0, alpha - clear, 0];
      }
    } else {
      ({ q: phi, w: wp } = fall(springHit, { q: phi, w: wp }, { sign: -1, acc: RATE, dt: dv, limit: 0, max: 1 }));
    }
    // 2. 止動器:沒被推著時被自己的彈簧壓回擋銷;落回時碰到凸柱(隔著細彈簧)或齒尖就停
    const detentHit = (a) => anyOverlap(pins, springAt(a, phi)) || anyOverlap(stopAt(a), teethAt(w));
    if (alpha < BANK) ({ q: alpha, w: wa } = fall(detentHit, { q: alpha, w: wa }, { sign: 1, acc: RATE, dt: dv, limit: BANK, max: 0.3 }));
    // 3. 擒縱輪:被鎖石、滾子擋住就停,被推就退,放開時加速轉
    const stops = [...stopAt(alpha), ...rollerAt(beta)];
    const wheelHit = (x) => anyOverlap(stops, teethAt(x));
    ({ q: w, w: ww } = fall(wheelHit, { q: w, w: ww }, { sign: -1, acc: (2 * PITCH) / (0.06 * 4 * SWING) ** 2, dt: dv, max: PITCH }));
    return { alpha, wa, phi, wp, w, ww };
  }

  // 起始齒位:擺輪在一端時不碰鎖石與滾子的位置
  const W0 = (() => {
    const stops = [...stopAt(BANK), ...rollerAt(balanceAngle(0))];
    for (let i = 0; i < 96; i++) if (!anyOverlap(stops, teethAt((-PITCH * i) / 96))) return (-PITCH * i) / 96;
    throw new Error("找不到起始齒位");
  })();
  const run = periodic({ period: 4 * SWING, init: { alpha: BANK, wa: 0, phi: 0, wp: 0, w: W0, ww: 0 }, step, samples: 1440, snap: { w: PITCH } });

  return {
    N,
    PITCH,
    SWING,
    balanceAngle,
    /** 擺輪累計擺動 v → 擺輪角、止動器被推開的角度(推開為正)、細彈簧被壓彎的角度、擒縱輪轉角(順時針為負) */
    chronometer(v) {
      const s = run.at(v);
      return { balance: balanceAngle(v), lift: -s.alpha, flex: s.phi, wheel: s.w };
    },
    escapement: {
      period: 4 * SWING,
      step: run.advance.w,
      angle: (v) => run.at(v).w,
      balanceCenter: BAL,
      at: (v) => {
        const s = run.at(v);
        const beta = balanceAngle(v);
        return { teeth: teethAt(s.w), stops: [...stopAt(s.alpha), ...rollerAt(beta)], detent: detentAt(s.alpha), hook: hookAt(s.alpha), spring: springAt(s.alpha, s.phi), pin: pinAt(beta) };
      },
    },
    // 做模型定義用
    state: (v) => run.at(v),
    iAt,
    geometry: { W, BAL, B, I: spring.at, R: Math.max(...wheel.profile.map(([r]) => r)), roller: balance.roller },
    wheel: WHEEL,
    roller,
  };
}

/**
 * 依機構做出模型定義。ids:擒縱輪、止動器、細彈簧的零件 id;pieces:{ wheel, balance, detent, spring, foot, plate }
 * 各零件的外觀(局部座標:擒縱輪、擺輪以軸為原點,止動器以固定端為原點,細彈簧以固定點為原點,foot、plate 用世界座標);
 * labels:[{ text, at(世界座標), offset }];texts:各處的說明(重演的標籤與原文);
 * initial:打開時的主動量(預設 0:擺輪在逆時針那一端;動力重演照樣從 0 開始,預期事件的主動量才對得上)。
 */
export function detentModel(mech, { figure, ids, pieces, labels, texts, view, initial }) {
  const { W, BAL, B, I, R, roller } = mech.geometry;
  const SWING = mech.SWING;
  const at3 = (p, z = 0) => [...p, z];
  return {
    figure,
    parts: [
      { id: ids.wheel, kind: "group", center: at3(W), spin: R, pieces: pieces.wheel },
      { id: "balance", kind: "group", center: at3(BAL), spin: roller, pieces: pieces.balance },
      { id: ids.detent, kind: "group", center: at3(B), arrow: false, pieces: pieces.detent },
      { id: ids.spring, kind: "group", center: at3(I), arrow: false, pieces: pieces.spring },
      { id: "foot", kind: "group", pieces: pieces.foot }, // 鎖在錶板上的座與止動器的擋銷
      { id: "plate", kind: "group", pieces: pieces.plate },
      ...labels.map((l, k) => ({ id: `label${k}`, kind: "group", center: at3(l.at), label: l.text, labelOffset: [...(l.offset ?? [0, 0.25]), 0.3] })),
    ],
    // 動力重演:只推擺輪;擒縱輪受固定的力矩順時針轉;止動器繞固定端鉸接、被彈簧壓在擋銷上(推開為順時針);
    // 細彈簧鉸在固定座上、被彈力頂著鉤(只能往一邊彎)
    replay: {
      from: 0,
      to: 8 * SWING,
      seconds: 20,
      free: {
        [ids.wheel]: { pivot: at3(W), spring: -1, gravity: false },
        [ids.detent]: { pivot: at3(B), spring: 1, gravity: false, limits: [-0.3, 0] },
        [ids.spring]: { pivot: at3(I), on: ids.detent, spring: -1, gravity: false, limits: [0, 0.4] },
      },
      ignore: [[ids.wheel, "plate"], ["balance", "plate"], [ids.detent, "foot"]],
      expect: [
        { at: 2 * SWING, part: ids.wheel, ...texts.pass },
        { at: 4 * SWING, part: ids.wheel, ...texts.release },
        { part: ids.wheel, label: "擺輪來回兩次,擒縱輪轉過兩齒" },
      ],
    },
    driver: { part: "balance", type: "rotation", cycle: [SWING, -SWING], ...(initial != null ? { initial } : {}) },
    target: ids.wheel, // 擒縱輪:擒縱讓它一齒一齒地放行
    view,
    pose(v) {
      const st = mech.state(v);
      return {
        parts: {
          balance: { angle: mech.balanceAngle(v) },
          [ids.detent]: { angle: st.alpha },
          [ids.spring]: { position: at3(mech.iAt(st.alpha)), angle: st.alpha + st.phi },
          [ids.wheel]: { angle: st.w },
          foot: { angle: 0 },
          plate: { angle: 0 },
        },
        readouts: [],
      };
    },
  };
}

