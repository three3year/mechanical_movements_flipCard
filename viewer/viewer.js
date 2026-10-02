// 模型的 3D 繪圖與操作。讀取模型定義(models/)建立場景,每一幀把 pose() 算出的姿勢套上去。
// 整頁共用一個畫布與 WebGL context;每張卡片是一個 session,換卡片時釋放舊場景。
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LineArtRenderer } from "./lineart.js";
import { buildPart, PATH_KINDS } from "./parts.js";
import { PathPart } from "./paths.js";

const PAPER = "#ffffff";
const ACCENT = "#d4572a";
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

const clamp = (v, [min, max]) => Math.min(max, Math.max(min, v));
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

class Session {
  constructor(def, stage) {
    const { gradient } = getShared();
    this.def = def;
    this.stage = stage;
    this.driverPart = def.parts.find((p) => p.id === def.driver.part);
    this.range = def.driver.range ?? null;
    this.value = def.driver.initial ?? (this.range ? this.range[0] : 0);
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
    const base = new THREE.MeshToonMaterial({ color: PAPER, gradientMap: gradient });
    const accent = new THREE.MeshToonMaterial({ color: ACCENT, gradientMap: gradient });
    this.materials = [base, accent];

    this.objects = new Map();
    this.paths = new Map();
    this.driverMeshes = [];
    for (const part of def.parts) {
      const isDriver = part.id === def.driver.part;
      if (PATH_KINDS.has(part.kind)) {
        const path = new PathPart(part, base);
        this.paths.set(part.id, path);
        this.scene.add(path.mesh);
        continue;
      }
      const object = buildPart(part, isDriver ? accent : base);
      const baseQuat = new THREE.Quaternion().setFromUnitVectors(
        Z_AXIS,
        new THREE.Vector3(...(part.axis ?? [0, 0, 1])).normalize(),
      );
      object.quaternion.copy(baseQuat);
      object.position.set(...(part.center ?? [0, 0, 0]));
      this.objects.set(part.id, { part, object, baseQuat });
      this.scene.add(object);
      if (isDriver) {
        object.add(hitProxy(part));
        this.driverMeshes.push(object);
      }
    }

    this.buildDom();
    this.apply(def.pose(this.value, this.state), performance.now());
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

    stage.append(this.viewEl, controls);

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
    // 轉角與皮帶相位以偏移量接續,切換瞬間不跳動;之後的轉向與比例仍完全依 pose
    for (const [pid, p] of Object.entries(next.parts)) {
      if (p.angle != null && this.lastAngles[pid] != null) this.angleOffsets[pid] = this.lastAngles[pid] - p.angle;
    }
    for (const [pid, p] of Object.entries(next.paths ?? {})) {
      if (this.lastPhases[pid] != null) this.phaseOffsets[pid] = this.lastPhases[pid] - (p.phase ?? 0);
    }
    const positions = {};
    for (const [pid, { object }] of this.objects) positions[pid] = object.position.toArray();
    const paths = {};
    for (const [pid, path] of this.paths) paths[pid] = path.points;
    this.transition = { start: performance.now(), positions, paths };
    this.state = id;
    this.syncStateButtons();
  }

  // ── 每一幀 ────────────────────────────

  advance(dt) {
    const speed = (this.def.driver.speed ?? this.defaultSpeed()) * this.speedFactor;
    if (!this.range) {
      this.value += speed * dt;
      return;
    }
    // 有範圍的主動件在範圍內往復
    const [min, max] = this.range;
    this.value += this.direction * speed * dt;
    if (this.value >= max) {
      this.value = max;
      this.direction = -1;
    } else if (this.value <= min) {
      this.value = min;
      this.direction = 1;
    }
  }

  defaultSpeed() {
    if (!this.range) return 0.8;
    return (this.range[1] - this.range[0]) / (this.def.driver.type === "rotation" ? 2.5 : 4);
  }

  apply(pose, now) {
    let t = 1;
    const tr = this.transition;
    if (tr) {
      const raw = (now - tr.start) / TRANSITION_MS;
      if (raw >= 1) this.transition = null;
      else t = ease(raw);
    }
    const q = new THREE.Quaternion();
    for (const [id, { part, object, baseQuat }] of this.objects) {
      const p = pose.parts[id] ?? {};
      let position = p.position ?? part.center ?? [0, 0, 0];
      if (tr && t < 1) position = lerp3(tr.positions[id], position, t);
      object.position.set(...position);
      const angle = (p.angle ?? 0) + (this.angleOffsets[id] ?? 0);
      this.lastAngles[id] = angle;
      object.quaternion.copy(baseQuat).multiply(q.setFromAxisAngle(Z_AXIS, angle));
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
    }
    this.showReadouts(pose.readouts ?? []);
  }

  showReadouts(readouts) {
    const text = readouts.map((r) => r.label + " " + r.value).join("\n");
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
      const { object } = this.objects.get(part.id);
      v.copy(object.position).add(new THREE.Vector3(...(part.labelOffset ?? [0, 0, 0])));
      v.project(camera);
      const visible = v.z < 1;
      span.style.visibility = visible ? "visible" : "hidden";
      span.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -50%)`;
    }
  }

  frame = (now) => {
    const dt = Math.min(0.05, (now - (this.lastTime ?? now)) / 1000);
    this.lastTime = now;
    if (this.playing && !this.drag) this.advance(dt);
    this.apply(this.def.pose(this.value, this.state), now);
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

  fitCamera() {
    const { camera, controls } = getShared();
    // 有範圍的主動件:外框要容納範圍兩端的姿勢,拉到底時零件也不會出畫面
    const box = new THREE.Box3();
    const extremes = this.range ? this.range : [this.value];
    for (const v of extremes) {
      this.apply(this.def.pose(v, this.state), 0);
      for (const { object } of this.objects.values()) box.expandByObject(object);
      for (const path of this.paths.values()) box.expandByObject(path.mesh);
    }
    this.apply(this.def.pose(this.value, this.state), 0);
    const center = box.getCenter(new THREE.Vector3());
    const dir = new THREE.Vector3(...(this.def.view?.direction ?? DEFAULT_VIEW)).normalize();
    // 依視線方向把外框八個角投影到鏡頭平面,取能完整容納的距離
    camera.position.copy(center).addScaledVector(dir, 10);
    camera.lookAt(center);
    camera.updateMatrixWorld();
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
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
    distance *= 1.12 * (this.def.view?.zoom ?? 1);
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
    for (const m of this.materials) m.dispose();
  }

  // ── 操作:拖主動件 / 轉視角 ───────────

  pointer(e) {
    const rect = getShared().canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height };
  }

  hitDriver(e) {
    const { camera } = getShared();
    const p = this.pointer(e);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((p.x / p.w) * 2 - 1, -(p.y / p.h) * 2 + 1), camera);
    return ray.intersectObjects(this.driverMeshes, true)[0] ?? null;
  }

  toScreen(v, p) {
    const s = v.clone().project(getShared().camera);
    return new THREE.Vector2(((s.x + 1) / 2) * p.w, ((1 - s.y) / 2) * p.h);
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
    this.drag = { id: e.pointerId, last: this.pointer(e), grab: hit.point.clone() };
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
    const { object } = this.objects.get(this.driverPart.id);
    const move = new THREE.Vector2(p.x - last.x, p.y - last.y);

    let delta;
    if (this.def.driver.type === "translation") {
      // 指標沿繩方向(投影到螢幕上)的分量作為位移增量
      const dir = new THREE.Vector3(...this.def.driver.direction);
      const s = this.toScreen(this.drag.grab.clone().addScaledVector(dir, 0.1), p)
        .sub(this.toScreen(this.drag.grab, p))
        .divideScalar(0.1);
      delta = s.lengthSq() > 1e-6 ? move.dot(s) / s.lengthSq() : 0;
      const before = this.value;
      this.value = clamp(this.value + delta, this.range);
      this.drag.grab.addScaledVector(dir, this.value - before);
      return;
    }

    const center = object.getWorldPosition(new THREE.Vector3());
    const axis = new THREE.Vector3(...(this.driverPart.axis ?? [0, 0, 1])).normalize();
    const facing = axis.dot(camera.position.clone().sub(center).normalize());
    if (Math.abs(facing) > 0.35) {
      // 正對著軸:用指標繞軸心在螢幕上的角度變化
      const c = this.toScreen(center, p);
      const a0 = Math.atan2(-(last.y - c.y), last.x - c.x);
      const a1 = Math.atan2(-(p.y - c.y), p.x - c.x);
      let d = a1 - a0;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      delta = d * Math.sign(facing);
    } else {
      // 側看著軸(角度變化不可靠):用抓取點的切線方向換算
      const tangent = axis.clone().cross(this.drag.grab.clone().sub(center));
      const s = this.toScreen(this.drag.grab.clone().addScaledVector(tangent, 0.05), p)
        .sub(this.toScreen(this.drag.grab, p))
        .divideScalar(0.05);
      delta = s.lengthSq() > 1e-6 ? move.dot(s) / s.lengthSq() : 0;
    }
    const before = this.value;
    this.value = this.range ? clamp(this.value + delta, this.range) : this.value + delta;
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

// 主動件的透明點擊範圍:輪輻之間的空隙、細小的繩端也抓得到
function hitProxy(part) {
  let geometry;
  if (part.kind === "handle") {
    geometry = new THREE.SphereGeometry(0.32, 12, 8);
  } else if (part.radius) {
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
