// 第 351 種:衝壓機(stamp)。水平旋轉軸上的缺齒小齒輪作用在桿的齒條上:有齒的那一段把桿抬起,
// 齒一脫離齒條,桿就落下,得到垂直的撞擊。主動件是缺齒小齒輪。
// 推斷:有齒段的齒數。有齒段經過接觸點時桿照節圓滾動上升;最後一齒過了接觸點後並沒有馬上放開——
// 它還托在上一個齒條齒的下面,一邊往上轉一邊退出齒條,桿再被托高一點(近似仍照節圓滾動),
// 直到齒尖退出齒條的齒頂線(EXIT,由齒頂半徑與齒條齒頂線算)才滑脫;然後桿加速落到底
// (jumps.falling,約 0.5 秒),等缺齒段轉過去、有齒段再進來把它抬起。
// 導座與小齒輪的軸裝在後面的背板上(推斷,原圖沒畫機架)。
import { TAU, deg } from "./kit.js";
import { circularPitch } from "./gears.js";
import { gearSize } from "./shapes.js";
import { falling } from "./jumps.js";

const N = 14;
const R = 0.75;
const SPAN = 8; // 有齒的齒數
const START = deg(-90); // 有齒段的起點(局部角)
const LEN = (SPAN * TAU) / N;
const CONTACT = Math.PI; // 接觸點在小齒輪左側
const RACK_X = -R;
const PITCH = circularPitch({ teeth: N, radius: R });
const TOOTH = TAU / N;
const TEETH = Array.from({ length: N }, (_, i) => i).filter((i) => {
  const a = ((i * TAU) / N - START + TAU * 4) % TAU;
  return a < LEN - 1e-9;
});
const DROP = deg(22); // 落下的過程佔小齒輪轉角多少(約 0.5 秒)
// 齒尖(半徑 R + 齒頂高)進到、退出齒條齒頂線(x = −R + 齒條齒頂高)時,離接觸點的角度:
// 第一齒進來就開始托桿,最後一齒退出去桿才滑脫(中間都近似照節圓滾動)
const { addendum } = gearSize(R, N);
export const EXIT = Math.acos((R - addendum) / (R + addendum));
const U_ENTRY = TOOTH / 2 - EXIT; // 第一齒的齒尖進到齒條(有齒段起點過了接觸點多少;為負)
export const RELEASE = LEN - TOOTH / 2 + EXIT; // 最後一齒的齒尖退出齒條:桿開始落下
// 咬合的相位:齒轉到接觸點時齒條的齒槽正對著它(lift ≡ 半個齒距,mod 齒距)。桿從停點被第一齒托起,
// 滾到接觸點時升了 EXIT·R,停點就定在比它低這麼多的地方(取 (−齒距, 0] 之間);落下也落回停點
const REST = ((((PITCH / 2 - EXIT * R) % PITCH) + PITCH) % PITCH) - PITCH;
export const TOP = REST + (RELEASE - U_ENTRY) * R; // 落下前的高度
const BASE = -1.5 * PITCH;

// 小齒輪順時針轉(轉角為負),接觸點的局部角 = CONTACT − theta 隨之增加;有齒段從 START 起開始經過接觸點
const theta0 = START - CONTACT; // 有齒段起點剛到接觸點時的轉角(順時針計)

/** 小齒輪轉 theta(順時針為負,左側往上)→ 桿上升的高度(停在底下時為 REST,略低於 0) */
export function stamp(theta) {
  const t = -theta - theta0 - U_ENTRY;
  const k = Math.floor(t / TAU);
  const u = t - k * TAU + U_ENTRY; // 這一圈裡,有齒段起點過了接觸點多少(從第一齒進來算起)
  if (u < RELEASE) return { lift: REST + (u - U_ENTRY) * R, k, engaged: true };
  if (u < RELEASE + DROP) return { lift: REST + (TOP - REST) * (1 - falling((u - RELEASE) / DROP)), k, engaged: false };
  return { lift: REST, k, engaged: false };
}
export const geometry = { LEN, R };

export default {
  figure: 351,
  parts: [
    {
      id: "pinion",
      kind: "gear",
      teeth: N,
      radius: R,
      width: 0.25,
      bore: 0.1,
      toothed: TEETH,
      pieces: [{ kind: "cylinder", radius: 0.08, length: 1.0, at: [0, 0, -0.1] }],
    },
    {
      id: "stamp",
      kind: "group",
      arrow: false,
      pieces: [
        // 齒條往下移一個齒距:最後一齒退出齒條時,齒條的最後一齒還托在它上面
        { kind: "rack", teeth: 12, pitch: PITCH, width: 0.25, depth: 0.15, at: [0, -PITCH, 0], angle: -Math.PI / 2 },
        { kind: "box", size: [0.4, 6.4, 0.25], at: [-0.42, 0.1, 0] },
        // 頂端與底端的軸環、底部的衝頭
        { kind: "box", size: [0.85, 0.22, 0.45], at: [-0.42, 2.5, 0] },
        { kind: "box", size: [0.85, 0.22, 0.45], at: [-0.42, -2.25, 0] },
        { kind: "lathe", axis: [0, 1, 0], profile: [[0, -3.25], [0.25, -3.25], [0.45, -3.0], [0.45, -2.8], [0.3, -2.6], [0, -2.6]], at: [-0.42, 0, 0] },
      ],
    },
    // 導槽在桿的左側,整個行程裡桿都在兩個導槽之間
    { id: "guides", kind: "group", // 兩個導座各是一塊背板加左側的擋塊(右側是小齒輪;凸塊貼著背板與擋塊上下通過)
      pieces: [
        // 機架的背板:托著兩個導座與小齒輪的軸(推斷,原圖沒畫)
        { kind: "box", size: [2.4, 6.2, 0.1], at: [-0.55, -0.6, -0.535] },
        ...[1.05, 1.85].flatMap((y) => [
        { kind: "box", size: [0.15, 0.5, 0.5], at: [RACK_X - 0.42 - 0.52, y, 0] },
        { kind: "box", size: [1.1, 0.5, 0.25], at: [RACK_X - 0.42 - 0.05, y, -0.36] },
        ]),
      ] },
  ],
  // 動力重演:只推缺齒小齒輪;桿在導座裡自由上下,靠自重落下
  replay: { from: 0, to: -2 * Math.PI, free: { stamp: { slide: [0, 1, 0], limits: [0, 3.6] } }, ignore: [["stamp", "guides"]], expect: [{ at: -5.4, part: "stamp", label: "有齒段把桿抬高" }, { at: -2 * Math.PI, part: "stamp", label: "齒脫離齒條後桿落到底" }] },
  driver: { part: "pinion", type: "rotation", speed: -0.8 }, // 自動播放時順時針轉,把桿抬起
  target: "stamp",
  view: { direction: [0.03, 0.05, 1] },
  pose(theta) {
    const { lift } = stamp(theta);
    // 齒條的齒朝 +x(朝小齒輪),節線在 x = −R
    return { parts: { pinion: { angle: theta }, stamp: { position: [RACK_X, lift + BASE, 0] } }, readouts: [] };
  },
  waivers: [
    { check: "interference", parts: ["pinion", "stamp"], reason: "簡化齒形:缺齒小齒輪的第一齒進入、最後一齒退出齒條時,梯形齒的齒側與齒條的齒擦到 0.07(96 個取樣中 14 個);齒在齒條裡時桿照節圓滾動上升(齒輪咬合),最後一齒退出後才滑脫落下(動力重演確認抬起與落下都由接觸發生)" },
  ],
};
