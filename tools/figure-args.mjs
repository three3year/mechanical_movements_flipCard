// 維護工具共用:命令列的圖號參數(63 或 70-71)→ 依序的圖號清單;沒給圖號就是全書。
// 以 -- 開頭的是各工具自己的選項,略過;看不懂的參數印出來並以 2 結束。
import { sources } from "../models/registry.js";

export function figuresFrom(args) {
  const given = args.filter((a) => !a.startsWith("--"));
  const unknown = given.filter((a) => !/^\d+(-\d+)?$/.test(a));
  if (unknown.length) {
    console.error(`看不懂的圖號:${unknown.join(" ")}(要寫成 63 或 70-71)`);
    process.exit(2);
  }
  const wanted = given.flatMap((a) => {
    const [from, to = from] = a.split("-").map(Number);
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  });
  return (wanted.length ? wanted : Object.keys(sources).map(Number)).sort((a, b) => a - b);
}
