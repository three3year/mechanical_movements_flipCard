// 模型的 3D 繪圖與操作。讀取模型定義(models/)建立場景,每一幀把 pose() 算出的姿勢套上去。
// 整頁共用一個畫布與 WebGL context;每張卡片是一個 session,換卡片時釋放舊場景。
//
// 主動件有三種:
// - 零件(rotation / translation):讀者抓住拖動;driver.grips 可再指定幾個零件為同一主動件的抓取處
//   (並排變體)。driver.cycle = [from, to] 時主動量是累計行程,零件在兩端之間往復(見 kit.swing)。
// - 虛擬(virtual):模型下方一支滑桿。mode "balance" 的數值是物理量本身,在 range 內;
//   mode "progress" 是進程,一直往前,滑桿顯示一輪(range)之內的位置。此時零件不能抓。
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LineArtRenderer, FLUID_LAYER } from "./lineart.js";
import { buildPart, buildSpinArrow, spinPlacement, PATH_KINDS } from "./parts.js";
import { PathPart, ChainPart } from "./paths.js";
import { FlowCues, FLUID_COLORS } from "./flows.js";
import { clamp, lerp3 } from "../models/kit.js";

const PAPER = "#ffffff";
const ACCENT = "#d4572a";
const ACCENT_MARK = "#7a2a10"; // 主動件上的轉動記號
const MARK = "#2f6fb0"; // 從動件的轉動記號與轉向箭頭
const TARGET = "#2a8f8a"; // 目標件(機構最終要帶動的零件)
const TARGET_MARK = "#12504d";
const GHOST_OPACITY = 0.3; // 姿勢標 ghost 的零件(例如沒在傳動的輪)畫成半透明
const GHOST_PAPER = "#6b6b6b"; // 紙色的零件半透明時改用灰色,白底上才看得到
const TRANSITION_MS = 450;
const FOV = 32;
const DEFAULT_VIEW = [0.12, 0.1, 1];
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const PROXY_MATERIAL = new THREE.MeshBasicMaterial();

let shared = null;
let active = null;

function getShared() {
  if (shared) return shared;
  const canvas = document.createElement("canvas");
  canvas.className = "model-canvas";
  const lineart = new LineArtRenderer(canvas);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  // 光源跟著鏡頭,轉視角時明暗分佈不變,維持平塗的線稿感
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(1.2, 2, 2.5);
  sun.target.position.set(0, 0, -1);
  camera.add(sun, sun.target, new THREE.AmbientLight(0xffffff, 2.2));
  // 主動件的拖動判斷必須先於 OrbitControls 註冊,點中主動件時攔下事件不讓視角轉動
  canvas.addEventListener("pointerdown", (e) => active?.onPointerDown(e));
  canvas.addEventListener("pointermove", (e) => active?.onPointerMove(e));
  canvas.addEventListener("pointerup", (e) => active?.onPointerUp(e));
  canvas.addEventListener("pointercancel", (e) => active?.onPointerUp(e));
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.zoomSpeed = 0.8;
  const gradient = new THREE.DataTexture(new Uint8Array([175, 220, 255]), 3, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  shared = { canvas, lineart, camera, controls, gradient };
  return shared;
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// ── 姿勢 → 物件的位置與朝向 ─────────────

const tmpX = new THREE.Vector3();
const tmpY = new THREE.Vector3();
const tmpZ = new THREE.Vector3();
const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();

/**
 * 依零件姿勢 p 算出位置、朝向與(連桿類的)長度,寫進 out。
 * p.from/p.to:局部 +X 由 from 指向 to,局部 Z 盡量對齊定義的 axis(連桿所在平面的法線)。
 * p.rotation:直接指定四元數 [x, y, z, w]。其餘:局部 Z 對齊 axis 後繞它轉 p.angle。
 */
function placement(part, baseQuat, p, angle, out) {
  if (p.from && p.to) {
    out.position.set(...p.from);
    tmpX.set(p.to[0] - p.from[0], p.to[1] - p.from[1], p.to[2] - p.from[2]);
    out.length = tmpX.length();
    tmpX.normalize();
    tmpZ.set(...(part.axis ?? [0, 0, 1])).normalize();
    tmpZ.addScaledVector(tmpX, -tmpZ.dot(tmpX));
    if (tmpZ.lengthSq() < 1e-8) tmpZ.set(0, 0, 1).cross(tmpX).cross(tmpX).negate();
    if (tmpZ.lengthSq() < 1e-8) tmpZ.set(1, 0, 0);
    tmpZ.normalize();
    tmpY.crossVectors(tmpZ, tmpX);
    out.quaternion.setFromRotationMatrix(tmpM.makeBasis(tmpX, tmpY, tmpZ));
    return out;
  }
  out.length = null;
  out.position.set(...(p.position ?? part.center ?? [0, 0, 0]));
  if (p.rotation) out.quaternion.set(...p.rotation);
  else out.quaternion.copy(baseQuat).multiply(tmpQ.setFromAxisAngle(Z_AXIS, angle));
  return out;
}

class Session {
  constructor(def, stage) {
    const { gradient } = getShared();
    this.def = def;
    this.stage = stage;
    const d = def.driver;
    this.virtual = d.type === "virtual";
    this.progress = this.virtual && d.mode === "progress";
    this.cycle = d.cycle ?? null;
    this.bounds = this.progress ? null : (d.range ?? null); // 有範圍的主動量:夾住、自動播放時往復
    this.grips = this.virtual ? [] : [d.part, ...(d.grips ?? [])];
    // 有範圍時預設停在 0(範圍包含 0 的話),否則停在下限
    this.value = d.initial ?? (this.bounds ? (this.bounds[0] <= 0 && this.bounds[1] >= 0 ? 0 : this.bounds[0]) : 0);
    this.state = def.states?.initial ?? null;
    this.playing = true;
    this.speedFactor = 1;
    this.direction = 1;
    this.angleOffsets = {};
    this.phaseOffsets = {};
    this.lastAngles = {};
    this.lastPhases = {};
    this.transition = null;
    this.drag = null;
    this.raf = 0;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PAPER);
    const toon = (color, extra) => new THREE.MeshToonMaterial({ color, gradientMap: gradient, ...extra });
    const base = toon(PAPER);
    const accent = toon(ACCENT);
    const accentMark = toon(ACCENT_MARK);
    const mark = toon(MARK);
    // 箭頭依轉向翻面(scale.y = −1),雙面繪製才不會被背面剔除
    const accentArrow = toon(ACCENT_MARK, { side: THREE.DoubleSide }); // 深橘,疊在橘色本體上也看得清楚
    const markArrow = toon(MARK, { side: THREE.DoubleSide });
    const target = toon(TARGET);
    const targetMark = toon(TARGET_MARK);
    const targetArrow = toon(TARGET_MARK, { side: THREE.DoubleSide });
    this.materials = [base, accent, accentMark, mark, accentArrow, markArrow, target, targetMark, targetArrow];
    // 半透明材質:每種實色各一份,零件標 ghost 時整個換過去,取消時換回來
    this.ghosts = new Map();
    this.ghostOf = (m) => {
      if (!this.ghosts.has(m)) {
        const g = m.clone();
        Object.assign(g, { transparent: true, opacity: GHOST_OPACITY, depthWrite: false });
        if (m === base) g.color.set(GHOST_PAPER);
        this.materials.push(g);
        this.ghosts.set(m, g);
      }
      return this.ghosts.get(m);
    };
    const targets = def.targets ?? (def.target ? [def.target] : []);
    const fluidMaterials = {};
    const fluidMaterial = (fluid) =>
      (fluidMaterials[fluid] ??= (() => {
        const m = new THREE.MeshBasicMaterial({ color: FLUID_COLORS[fluid], transparent: true, opacity: 0.6, depthWrite: false });
        this.materials.push(m);
        return m;
      })());
    this.arrows = [];

    this.objects = new Map();
    this.paths = new Map();
    this.driverMeshes = [];
    for (const part of def.parts) {
      const isDriver = this.grips.includes(part.id);
      if (PATH_KINDS.has(part.kind)) {
        const path = part.kind === "chain" ? new ChainPart(part, base) : new PathPart(part, base);
        this.paths.set(part.id, path);
        this.scene.add(path.mesh);
        continue;
      }
      let object;
      if (part.kind === "fill") {
        object = buildPart(part, fluidMaterial(part.fluid ?? "water"), mark);
        object.traverse((o) => o.layers.set(FLUID_LAYER));
      } else {
        const isTarget = targets.includes(part.id);
        object = buildPart(part, isDriver ? accent : isTarget ? target : base, isDriver ? accentMark : isTarget ? targetMark : mark);
      }
      const baseQuat = new THREE.Quaternion().setFromUnitVectors(
        Z_AXIS,
        new THREE.Vector3(...(part.axis ?? [0, 0, 1])).normalize(),
      );
      object.quaternion.copy(baseQuat);
      object.position.set(...(part.center ?? [0, 0, 0]));
      this.objects.set(part.id, { part, object, baseQuat, place: { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), length: null } });
      this.scene.add(object);
      if (isDriver) {
        object.add(hitProxy(part));
        this.driverMeshes.push(object);
      }
      // 會轉的零件旁加轉向箭頭;零件不轉時隱藏。定義可用 arrow: false 關掉(例如並排同向的滑輪只留一個)
      const spin = part.arrow === false ? null : spinPlacement(part);
      if (spin) {
        const arrow = buildSpinArrow(spin.radius + 0.22, isDriver ? accentArrow : targets.includes(part.id) ? targetArrow : markArrow);
        arrow.position.z = spin.offset;
        const holder = new THREE.Group();
        holder.add(arrow);
        holder.visible = false;
        this.scene.add(holder);
        this.arrows.push({ id: part.id, holder, arrow, sign: 1 });
      }
    }
    this.flows = new FlowCues(this.scene);

    this.buildDom();
    this.apply(this.pose(this.value), performance.now());
  }

  pose(value) {
    return this.def.pose(value, this.state);
  }

  // ── DOM ───────────────────────────────

  buildDom() {
    const { def, stage } = this;
    stage.replaceChildren();
    this.viewEl = el("div", "stage-view");
    this.labelsEl = el("div", "stage-labels");
    this.readoutsEl = el("div", "stage-readouts");
    this.readoutsEl.hidden = true;
    const reset = el("button", "stage-reset", "重設視角");
    reset.type = "button";
    reset.addEventListener("click", () => getShared().controls.reset());
    this.viewEl.append(this.labelsEl, this.readoutsEl, reset);

    this.labels = def.parts
      .filter((p) => p.label)
      .map((part) => {
        const span = el("span", "stage-label", part.label);
        this.labelsEl.appendChild(span);
        return { part, span };
      });

    stage.append(this.viewEl);
    if (this.virtual) stage.append(this.buildSlider());

    const controls = el("div", "stage-controls");
    this.playBtn = el("button", "stage-play");
    this.playBtn.type = "button";
    this.playBtn.addEventListener("click", () => this.setPlaying(!this.playing));
    const speed = el("label", "stage-speed");
    const input = el("input");
    Object.assign(input, { type: "range", min: "0.25", max: "3", step: "0.25", value: "1" });
    input.setAttribute("aria-label", "播放速度");
    const out = el("output", null, "1×");
    input.addEventListener("input", () => {
      this.speedFactor = Number(input.value);
      out.textContent = input.value + "×";
    });
    speed.append(el("span", null, "速度"), input, out);
    controls.append(this.playBtn, speed);
    stage.append(controls);

    // 狀態按鈕列:沒有狀態的模型也保留空白列,翻頁時卡片高度不跳動
    const row = el("div", "stage-states");
    stage.appendChild(row);
    if (def.states) {
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", "狀態");
      this.stateButtons = def.states.options.map((option) => {
        const btn = el("button", null, option.label);
        btn.type = "button";
        btn.addEventListener("click", () => this.setState(option.id));
        row.appendChild(btn);
        return { option, btn };
      });
    }
    this.setPlaying(true);
    this.syncStateButtons();
  }

  // 虛擬主動件的滑桿:按下時暫停自動播放,放開後維持暫停(與抓主動件一致)
  buildSlider() {
    const d = this.def.driver;
    const [min, max] = d.range;
    const row = el("label", "stage-driver");
    const input = el("input");
    Object.assign(input, { type: "range", min: String(this.progress ? 0 : min), max: String(this.progress ? max - min : max), step: "any" });
    input.setAttribute("aria-label", d.label);
    this.sliderOut = el("output");
    input.addEventListener("pointerdown", () => this.setPlaying(false));
    input.addEventListener("keydown", () => this.setPlaying(false));
    input.addEventListener("input", () => {
      const v = Number(input.value);
      if (!this.progress) {
        this.value = clamp(v, min, max);
        return;
      }
      // 進程:滑桿只顯示一輪內的位置,拖動量累加到進程上;跨過兩端時接續,不倒退一整輪
      const span = max - min;
      let delta = v - this.sliderAt;
      if (delta > span / 2) delta -= span;
      if (delta < -span / 2) delta += span;
      this.value += delta;
      this.sliderAt = v;
    });
    this.slider = input;
    row.append(el("span", "stage-driver-name", d.label), input, this.sliderOut);
    this.syncSlider();
    return row;
  }

  syncSlider() {
    if (!this.slider) return;
    const d = this.def.driver;
    const [min, max] = d.range;
    const at = this.progress ? (((this.value - min) % (max - min)) + (max - min)) % (max - min) : this.value;
    if (document.activeElement !== this.slider || this.playing) this.slider.value = String(at);
    this.sliderAt = Number(this.slider.value);
    const text = d.format ? d.format(this.value) : formatValue(this.value, d);
    if (text !== this.sliderText) this.sliderOut.textContent = this.sliderText = text;
  }

  setPlaying(playing) {
    this.playing = playing;
    this.playBtn.textContent = playing ? "❚❚ 暫停" : "▶ 播放";
    this.playBtn.setAttribute("aria-pressed", String(playing));
  }

  syncStateButtons() {
    for (const { option, btn } of this.stateButtons ?? []) {
      const on = option.id === this.state;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", String(on));
    }
  }

  // ── 狀態切換 ──────────────────────────

  setState(id) {
    if (id === this.state) return;
    const next = this.def.pose(this.value, id);
    // 轉角與皮帶相位以偏移量接續,切換瞬間不跳動;之後的轉向與比例仍完全依 pose。
    // 定義標 posed 的零件(離合器的從動半、撥桿……)不接續,而是以短動畫轉到新狀態的姿勢
    for (const [pid, p] of Object.entries(next.parts)) {
      if (this.objects.get(pid)?.part.posed) continue;
      if (p.angle != null && this.lastAngles[pid] != null) this.angleOffsets[pid] = this.lastAngles[pid] - p.angle;
    }
    for (const [pid, p] of Object.entries(next.paths ?? {})) {
      if (this.lastPhases[pid] != null) this.phaseOffsets[pid] = this.lastPhases[pid] - (p.phase ?? 0);
    }
    const objects = {};
    for (const [pid, { object }] of this.objects) {
      objects[pid] = { position: object.position.clone(), quaternion: object.quaternion.clone(), length: object.userData.length };
    }
    const paths = {};
    for (const [pid, path] of this.paths) paths[pid] = path.points;
    this.transition = { start: performance.now(), objects, paths };
    this.state = id;
    this.syncStateButtons();
  }

  // ── 每一幀 ────────────────────────────

  advance(dt) {
    const step = this.defaultSpeed() * this.speedFactor * dt;
    if (!this.bounds) {
      this.value += step;
      return;
    }
    // 有範圍的主動件在範圍內往復
    const [min, max] = this.bounds;
    this.value += this.direction * step;
    if (this.value >= max) {
      this.value = max;
      this.direction = -1;
    } else if (this.value <= min) {
      this.value = min;
      this.direction = 1;
    }
  }

  defaultSpeed() {
    const d = this.def.driver;
    if (d.speed) return d.speed;
    if (this.cycle) return Math.abs(this.cycle[1] - this.cycle[0]) / 1.2;
    if (this.progress) return (d.range[1] - d.range[0]) / 6;
    if (!this.bounds) return 0.8;
    return (this.bounds[1] - this.bounds[0]) / (d.type === "rotation" ? 2.5 : 4);
  }

  // 拖動改主動量:有範圍就夾住;有擋止(driver.backstop)時往回只能轉到最近的擋止位置
  setValue(next) {
    const d = this.def.driver;
    if (this.bounds) next = clamp(next, ...this.bounds);
    if (d.backstop && next < this.value) next = Math.max(next, d.backstop(this.value));
    this.value = next;
  }

  // 拖動時一次事件最多改變的主動量,以及數值微分的步長
  valueScale() {
    if (this.cycle) return Math.abs(this.cycle[1] - this.cycle[0]);
    if (this.bounds) return this.bounds[1] - this.bounds[0];
    return 1;
  }

  apply(pose, now) {
    let t = 1;
    const tr = this.transition;
    if (tr) {
      const raw = (now - tr.start) / TRANSITION_MS;
      if (raw >= 1) this.transition = null;
      else t = ease(raw);
    }
    for (const [id, entry] of this.objects) {
      const { part, object, baseQuat, place } = entry;
      const p = pose.parts[id] ?? {};
      const angle = (p.angle ?? 0) + (this.angleOffsets[id] ?? 0);
      this.lastAngles[id] = angle;
      placement(part, baseQuat, p, angle, place);
      const from = tr && t < 1 ? tr.objects[id] : null;
      if (from) {
        object.position.lerpVectors(from.position, place.position, t);
        if (p.from || p.rotation || part.kind === "link" || part.posed) object.quaternion.slerpQuaternions(from.quaternion, place.quaternion, t);
        else object.quaternion.copy(place.quaternion);
      } else {
        object.position.copy(place.position);
        object.quaternion.copy(place.quaternion);
      }
      if (place.length != null) {
        const length = from?.length != null ? from.length + (place.length - from.length) * t : place.length;
        object.userData.length = length;
        object.userData.stretch?.(length);
      }
      if (p.scale != null) {
        if (Array.isArray(p.scale)) object.scale.set(...p.scale);
        else object.scale.setScalar(p.scale);
      }
      if (p.level != null) object.userData.level?.(p.level);
      object.visible = p.visible !== false;
      this.setGhost(object, p.ghost === true);
    }
    for (const [id, path] of this.paths) {
      const p = pose.paths?.[id];
      if (!p) continue;
      let points = p.points;
      const from = tr?.paths[id];
      if (tr && t < 1 && from && from.length === points.length) {
        points = points.map((pt, i) => lerp3(from[i], pt, t));
      }
      const phase = (p.phase ?? 0) + (this.phaseOffsets[id] ?? 0);
      this.lastPhases[id] = phase;
      path.update({ points, closed: p.closed, phase });
      path.mesh.visible = p.visible !== false;
    }
    this.flows.update(pose.flows);
    this.showReadouts(pose.readouts ?? []);
  }

  // 零件半透明(沒在傳動的輪):材質換成同色的半透明版,並移到不描邊的那一層(與流體示意同層),
  // 看起來像淡淡的影子而不是實體;只在狀態改變時走訪
  setGhost(object, ghost) {
    if ((object.userData.ghost ?? false) === ghost) return;
    object.userData.ghost = ghost;
    object.traverse((o) => {
      if (o.isMesh && o.material !== PROXY_MATERIAL) {
        if (ghost) {
          o.userData.solid = o.material;
          o.material = this.ghostOf(o.material);
        } else if (o.userData.solid) {
          o.material = o.userData.solid;
        }
      }
      o.layers.set(ghost ? FLUID_LAYER : 0);
    });
  }

  showReadouts(readouts) {
    const text = readouts.map((r) => r.label + " " + r.value).join("\n");
    if (text === this.readoutText) return;
    this.readoutText = text;
    this.readoutsEl.hidden = readouts.length === 0;
    this.readoutsEl.replaceChildren(
      ...readouts.map((r) => {
        const row = el("div");
        row.append(el("span", null, r.label), el("b", null, r.value));
        return row;
      }),
    );
  }

  placeLabels() {
    const { camera } = getShared();
    const w = this.viewEl.clientWidth;
    const h = this.viewEl.clientHeight;
    const v = new THREE.Vector3();
    for (const { part, span } of this.labels) {
      const { object } = this.objects.get(part.id) ?? {};
      const anchor = object?.position ?? new THREE.Vector3(...(part.center ?? [0, 0, 0]));
      v.copy(anchor).add(new THREE.Vector3(...(part.labelOffset ?? [0, 0, 0])));
      v.project(camera);
      const visible = v.z < 1 && object?.visible !== false;
      span.style.visibility = visible ? "visible" : "hidden";
      span.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -50%)`;
    }
  }

  // 轉向箭頭:主動件有在動時,依各零件這一幀的轉角變化決定箭頭方向,沒轉的零件隱藏箭頭;
  // 主動件停住時維持上一次的顯示。明顯側看零件時箭頭擺在朝鏡頭那側,否則擺在上方。
  updateArrows(prevAngles, driverMoved) {
    const { camera } = getShared();
    const q = new THREE.Quaternion();
    const local = new THREE.Vector3();
    for (const a of this.arrows) {
      const { object, baseQuat } = this.objects.get(a.id);
      if (driverMoved) {
        const turned = this.lastAngles[a.id] - (prevAngles[a.id] ?? this.lastAngles[a.id]);
        a.holder.visible = Math.abs(turned) > 1e-7 && object.visible;
        if (a.holder.visible) a.sign = Math.sign(turned);
        a.arrow.scale.y = a.sign;
      }
      const inverse = q.copy(baseQuat).invert();
      local.copy(camera.position).sub(object.position).applyQuaternion(inverse);
      if (Math.hypot(local.x, local.y) < 0.75 * local.length()) {
        local.set(0, 1, 0).applyQuaternion(inverse);
        if (Math.hypot(local.x, local.y) < 0.3) local.set(1, 0, 0).applyQuaternion(inverse);
      }
      a.holder.position.copy(object.position);
      a.holder.quaternion.copy(baseQuat).multiply(q.setFromAxisAngle(Z_AXIS, Math.atan2(local.y, local.x)));
    }
  }

  frame = (now) => {
    const dt = Math.min(0.05, (now - (this.lastTime ?? now)) / 1000);
    this.lastTime = now;
    const prevAngles = { ...this.lastAngles };
    if (this.playing && !this.drag) this.advance(dt);
    this.apply(this.pose(this.value), now);
    // 拖動在 pointermove 裡改主動量,所以跟上一幀套用的值比
    this.updateArrows(prevAngles, this.value !== this.frameValue);
    this.frameValue = this.value;
    this.syncSlider();
    const { lineart, camera } = getShared();
    lineart.render(this.scene, camera);
    this.placeLabels();
    this.raf = requestAnimationFrame(this.frame);
  };

  // ── 生命週期 ──────────────────────────

  activate() {
    if (active && active !== this) active.dispose();
    active = this;
    const { canvas, camera, controls } = getShared();
    this.viewEl.prepend(canvas);
    this.scene.add(camera);
    this.resize();
    this.fitCamera();
    controls.saveState();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.viewEl);
    this.frame(performance.now());
  }

  resize() {
    const { lineart, camera } = getShared();
    const w = this.viewEl.clientWidth || 1;
    const h = this.viewEl.clientHeight || 1;
    lineart.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  // 外框要容納主動量各處的姿勢:有範圍時取兩端與中間,往復取兩端,一直轉的取一圈中的幾處
  fitSamples() {
    if (this.bounds) {
      const [min, max] = this.bounds;
      return [min, (min + max) / 2, max, this.value];
    }
    const span = this.cycle ? Math.abs(this.cycle[1] - this.cycle[0]) : this.progress ? this.def.driver.range[1] - this.def.driver.range[0] : Math.PI * 2;
    return [0, 0.25, 0.5, 0.75, 1].map((f) => this.value + f * span);
  }

  fitCamera() {
    const { camera, controls } = getShared();
    // 原圖是正視的立面圖時,定義可用較窄的視角(view.fov)讓透視變形小一點
    camera.fov = this.def.view?.fov ?? FOV;
    camera.updateProjectionMatrix();
    const box = new THREE.Box3();
    // view.fit:只以這些零件取景(原圖只畫出局部的大零件,例如第 76 種的大輪)
    const only = this.def.view?.fit ? new Set(this.def.view.fit) : null;
    for (const v of this.fitSamples()) {
      this.apply(this.pose(v), 0);
      // 精確外框(逐頂點):旋轉中的零件不會因軸對齊外框而顯得過小
      for (const [id, { object }] of this.objects) if (object.visible && (!only || only.has(id))) box.expandByObject(object, true);
      for (const [id, path] of this.paths) {
        if (!path.mesh.visible || (only && !only.has(id))) continue;
        if (path.instances) {
          // 鍊條的鏈節是 InstancedMesh:用逐節的外框
          path.instances.computeBoundingBox();
          box.expandByObject(path.mesh);
        } else box.expandByObject(path.mesh, true);
      }
    }
    this.apply(this.pose(this.value), 0);
    const center = box.getCenter(new THREE.Vector3());
    const dir = new THREE.Vector3(...(this.def.view?.direction ?? DEFAULT_VIEW)).normalize();
    // 依視線方向把外框八個角投影到鏡頭平面,取能完整容納的距離
    camera.position.copy(center).addScaledVector(dir, 10);
    camera.lookAt(center);
    camera.updateMatrixWorld();
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let distance = 0;
    for (let i = 0; i < 8; i++) {
      const corner = new THREE.Vector3(
        i & 1 ? box.max.x : box.min.x,
        i & 2 ? box.max.y : box.min.y,
        i & 4 ? box.max.z : box.min.z,
      ).sub(center);
      const depth = corner.dot(dir);
      distance = Math.max(
        distance,
        Math.abs(corner.dot(up)) / tan + depth,
        Math.abs(corner.dot(right)) / (tan * camera.aspect) + depth,
      );
    }
    distance *= 1.12;
    camera.position.copy(center).addScaledVector(dir, distance);
    camera.near = distance / 50;
    camera.far = distance * 10;
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.minDistance = distance * 0.25;
    controls.maxDistance = distance * 4;
    controls.update();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    if (active === this) active = null;
    this.scene.traverse((obj) => {
      if (obj.isMesh) obj.geometry.dispose();
    });
    for (const path of this.paths.values()) path.dispose();
    this.flows.dispose();
    for (const m of this.materials) m.dispose();
  }

  // ── 操作:拖主動件 / 轉視角 ───────────

  pointer(e) {
    const rect = getShared().canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height };
  }

  hitDriver(e) {
    if (!this.driverMeshes.length) return null;
    const { camera } = getShared();
    const p = this.pointer(e);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((p.x / p.w) * 2 - 1, -(p.y / p.h) * 2 + 1), camera);
    return ray.intersectObjects(this.driverMeshes, true)[0] ?? null;
  }

  // 被點中的物件屬於哪個抓取處
  gripOf(hit) {
    for (let o = hit.object; o; o = o.parent) {
      for (const id of this.grips) if (this.objects.get(id)?.object === o) return id;
    }
    return this.def.driver.part;
  }

  toScreen(v, p) {
    const s = v.clone().project(getShared().camera);
    return new THREE.Vector2(((s.x + 1) / 2) * p.w, ((1 - s.y) / 2) * p.h);
  }

  // 指標位移 move 沿著「抓取點往 dir 方向移動」在螢幕上的投影,換算成 dir 的倍數
  alongScreen(move, dir, p) {
    const step = 0.05;
    const rate = this.toScreen(this.drag.grab.clone().addScaledVector(dir, step), p)
      .sub(this.toScreen(this.drag.grab, p))
      .divideScalar(step);
    return rate.lengthSq() > 1e-6 ? move.dot(rate) / rate.lengthSq() : 0;
  }

  // 主動量為 value 時,抓取處上那一點在螢幕上的位置
  gripScreen(value, p) {
    const { grip, local } = this.drag;
    const entry = this.objects.get(grip);
    const pp = this.pose(value).parts[grip] ?? {};
    const angle = (pp.angle ?? 0) + (this.angleOffsets[grip] ?? 0);
    const place = placement(entry.part, entry.baseQuat, pp, angle, { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() });
    return this.toScreen(local.clone().applyQuaternion(place.quaternion).add(place.position), p);
  }

  /**
   * 一般的拖動:以數值微分求「主動量變一點,抓取點在螢幕上移多少」,讓抓取點跟著指標走。
   * 往復的主動量在兩端轉折:優先讓主動量往前(累計行程增加),往前走不動才往回。
   */
  dragNumeric(move, p) {
    const scale = this.valueScale();
    const eps = scale * 1e-3;
    const maxStep = scale * 0.15;
    let remaining = move.clone();
    for (let i = 0; i < 4 && remaining.lengthSq() > 0.25; i++) {
      const at = this.gripScreen(this.value, p);
      const ahead = this.gripScreen(this.value + eps, p).sub(at).divideScalar(eps);
      const behind = at.clone().sub(this.gripScreen(this.value - eps, p)).divideScalar(eps);
      let dv = 0;
      if (ahead.lengthSq() > 1e-6 && remaining.dot(ahead) > 0) dv = remaining.dot(ahead) / ahead.lengthSq();
      else if (behind.lengthSq() > 1e-6 && remaining.dot(behind) < 0) dv = remaining.dot(behind) / behind.lengthSq();
      if (!dv) break;
      dv = clamp(dv, -maxStep, maxStep);
      const before = this.value;
      this.setValue(this.value + dv);
      if (this.value === before) break;
      remaining.sub(this.gripScreen(this.value, p).sub(at));
    }
  }

  onPointerDown(e) {
    if (this.drag) {
      e.stopImmediatePropagation(); // 拖主動件時忽略第二根手指
      return;
    }
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const hit = this.hitDriver(e);
    if (!hit) return; // 交給 OrbitControls 轉視角
    e.stopImmediatePropagation();
    e.preventDefault();
    const { canvas } = getShared();
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
    const grip = this.gripOf(hit);
    const { object } = this.objects.get(grip);
    const local = object.worldToLocal(hit.point.clone());
    local.multiply(object.scale); // worldToLocal 已除掉縮放;placement 不含縮放
    // 抓取處本身會移動(不只繞固定軸轉)時,改用數值微分的拖動
    const now = this.pose(this.value).parts[grip] ?? {};
    const moving = !!(now.position || now.from || now.rotation);
    this.drag = { id: e.pointerId, last: this.pointer(e), grab: hit.point.clone(), grip, local, moving };
    this.setPlaying(false);
  }

  onPointerMove(e) {
    const { canvas, camera } = getShared();
    if (!this.drag) {
      if (e.buttons === 0) canvas.style.cursor = this.hitDriver(e) ? "grab" : "";
      return;
    }
    if (e.pointerId !== this.drag.id) return;
    const p = this.pointer(e);
    const last = this.drag.last;
    this.drag.last = p;
    const move = new THREE.Vector2(p.x - last.x, p.y - last.y);
    const d = this.def.driver;
    const simple = !this.cycle && this.drag.grip === d.part && !this.drag.moving;

    if (!simple) {
      this.dragNumeric(move, p);
      return;
    }

    if (d.type === "translation") {
      // 指標沿繩方向(投影到螢幕上)的分量作為位移增量
      const dir = new THREE.Vector3(...d.direction);
      const before = this.value;
      this.setValue(this.value + this.alongScreen(move, dir, p));
      this.drag.grab.addScaledVector(dir, this.value - before);
      return;
    }

    const { object } = this.objects.get(this.drag.grip);
    const center = object.getWorldPosition(new THREE.Vector3());
    const axis = new THREE.Vector3(...(this.objects.get(this.drag.grip).part.axis ?? [0, 0, 1])).normalize();
    const facing = axis.dot(camera.position.clone().sub(center).normalize());
    let delta;
    if (Math.abs(facing) > 0.35) {
      // 正對著軸:用指標繞軸心在螢幕上的角度變化
      const c = this.toScreen(center, p);
      const a0 = Math.atan2(-(last.y - c.y), last.x - c.x);
      const a1 = Math.atan2(-(p.y - c.y), p.x - c.x);
      let dd = a1 - a0;
      if (dd > Math.PI) dd -= Math.PI * 2;
      if (dd < -Math.PI) dd += Math.PI * 2;
      delta = dd * Math.sign(facing);
    } else {
      // 側看著軸(角度變化不可靠):用抓取點的切線方向換算
      const tangent = axis.clone().cross(this.drag.grab.clone().sub(center));
      delta = this.alongScreen(move, tangent, p);
    }
    const before = this.value;
    this.setValue(this.value + delta);
    const applied = this.value - before;
    this.drag.grab.sub(center).applyAxisAngle(axis, applied).add(center);
  }

  onPointerUp(e) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    const { canvas } = getShared();
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    canvas.style.cursor = "grab";
    this.drag = null; // 放開後維持暫停
  }
}

// 虛擬主動件滑桿旁的數值:依範圍大小取小數位,加上單位
function formatValue(v, d) {
  const span = d.range[1] - d.range[0];
  const digits = span >= 50 ? 0 : span >= 5 ? 1 : 2;
  return v.toFixed(digits) + (d.unit ? " " + d.unit : "");
}

// 主動件的透明點擊範圍:輪輻之間的空隙、細小的繩端也抓得到
function hitProxy(part) {
  let geometry;
  if (part.kind === "ropeEnd") {
    geometry = new THREE.SphereGeometry(0.32, 12, 8);
  } else if (part.radius && part.kind !== "sphere") {
    const width = part.width ?? part.length ?? 0.3;
    geometry = new THREE.CylinderGeometry(part.radius, part.radius, width, 24).rotateX(Math.PI / 2);
  } else {
    return new THREE.Group();
  }
  const proxy = new THREE.Mesh(geometry, PROXY_MATERIAL);
  proxy.visible = false;
  return proxy;
}

/** 依模型定義在 stage 元素裡組好場景與控制列;呼叫 activate() 才接上畫布開始運轉 */
export function prepare(def, stage) {
  return new Session(def, stage);
}

/** 離開模型模式:停止運轉並釋放場景 */
export function deactivate() {
  active?.dispose();
}
