// 維護用:實體驗證(干涉、憑空連動、動力重演;見 CONTEXT.md、ADR-0003)。改動或新增模型後要跑。
// 用法:node tools/verify.mjs [圖號或範圍(7 或 24-36)…] [--samples=N] [--only=interference,unsupported,replay]
//                            [--waivers] [--summary] [--brief] [--jobs=N] [--json=檔案]
//   不帶圖號跑全書;--waivers 列出豁免與原因;--summary 只印各項檢查涉及的圖號;--json 把問題清單寫成檔案。
//   有未豁免的問題或過時的豁免時以非零結束。全書分給幾個子行程同時跑(--jobs,預設依核心數)。
import { fork } from "node:child_process";
import { cpus } from "node:os";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sources, loadModel } from "../models/registry.js";
import { verifyModel, unwaived, CHECK_NAMES, DEFAULTS } from "../verify/index.js";

const args = process.argv.slice(2);
const flag = (name) => {
  const found = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  return found ? (found.split("=")[1] ?? true) : undefined;
};
const options = {};
if (flag("samples")) options.samples = Number(flag("samples"));
if (flag("only")) options.checks = String(flag("only")).split(",");

// --brief:每個問題縮成短短一行(查修時一次看很多張用)
const brief = (f) => `${f.parts.join("×")} ${f.severity?.toFixed(2) ?? ""} ×${f.count ?? ""}${f.state != null ? " " + f.state : ""} ${(f.message.match(/:([^:]*〔[^)]*)\)/)?.[1] ?? "").replace(/〔([^〕]*)〕/g, "[$1]")}`;

async function verifyFigure(figure) {
  try {
    return verifyModel(await loadModel(figure), options);
  } catch (e) {
    return [{ check: "error", figure, parts: [], message: `驗證中斷:${e.message}` }];
  }
}

if (process.send) {
  // 子行程:一次驗一張,結果送回主行程
  process.on("message", async (figure) => process.send({ figure, findings: await verifyFigure(figure) }));
  process.send({ ready: true });
} else {
  const unknown = args.filter((a) => !a.startsWith("--") && !/^\d+(-\d+)?$/.test(a));
  if (unknown.length) {
    console.error(`看不懂的圖號:${unknown.join(" ")}(要寫成 63 或 70-71)`);
    process.exit(2);
  }
  const wanted = args.flatMap((a) => {
    if (/^\d+$/.test(a)) return [Number(a)];
    const range = /^(\d+)-(\d+)$/.exec(a);
    return range ? Array.from({ length: range[2] - range[1] + 1 }, (_, i) => Number(range[1]) + i) : [];
  });
  const figures = (wanted.length ? wanted : Object.keys(sources).map(Number)).sort((a, b) => a - b);
  const started = Date.now();
  const results = new Map();
  const jobs = Math.max(1, Math.min(Number(flag("jobs") ?? Math.max(1, cpus().length - 2)), Math.ceil(figures.length / 3)));
  if (jobs === 1) {
    for (const figure of figures) results.set(figure, await verifyFigure(figure));
  } else {
    const queue = [...figures];
    await Promise.all(
      Array.from({ length: jobs }, () =>
        new Promise((resolve, reject) => {
          const child = fork(fileURLToPath(import.meta.url), args);
          const next = () => (queue.length ? child.send(queue.shift()) : (child.kill(), resolve()));
          child.on("message", (m) => {
            if (!m.ready) results.set(m.figure, m.findings);
            next();
          });
          child.on("error", reject);
          child.on("exit", resolve); // 子行程意外結束:它手上那張沒有結果,由下面的「沒有回報」報出
        }),
      ),
    );
  }

  if (flag("json")) writeFileSync(String(flag("json")), JSON.stringify(figures.flatMap((f) => results.get(f) ?? []), null, 1));
  let problems = 0;
  let waived = 0;
  const perCheck = {};
  for (const figure of figures) {
    const findings = results.get(figure) ?? [{ check: "error", figure, parts: [], message: "驗證中斷:子行程沒有回報" }];
    const exempt = findings.filter((f) => f.waived);
    waived += exempt.length;
    if (flag("waivers")) for (const f of exempt) console.log(`圖 ${figure} [${CHECK_NAMES[f.check]}] ${f.parts.join("、")}:${f.waived}`);
    const open = unwaived(findings).sort((a, b) => a.check.localeCompare(b.check) || (b.severity ?? 0) - (a.severity ?? 0));
    problems += open.length;
    for (const f of open) {
      (perCheck[f.check] ??= new Set()).add(figure);
      if (!flag("waivers") && !flag("summary")) console.log(`圖 ${figure} [${CHECK_NAMES[f.check] ?? f.check}] ${flag("brief") ? brief(f) : f.message}`);
    }
  }
  for (const [check, figs] of Object.entries(perCheck)) console.log(`${CHECK_NAMES[check] ?? check}:${figs.size} 張(${[...figs].join(" ")})`);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n實體驗證:驗了 ${figures.length} 張,${problems} 個未豁免的問題,${waived} 項豁免(${seconds} 秒;每狀態 ${options.samples ?? DEFAULTS.samples} 個取樣)`);
  process.exitCode = problems ? 1 : 0;
}
