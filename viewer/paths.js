// 皮帶、繩、連桿:沿姿勢回傳的折線建立管狀幾何。
// 會運動的線狀零件(models/kinds.js 的 MOVING_KINDS:皮帶、繩、鍊條)以黑色間隔記號分段,
// 每段塗一種實色(金黃 → 綠 → 紫輪流),紋理座標 = 離起點的弧長 − 行進相位,也就是材料座標:
// 記號與色段跟著材料移動、繞過輪子,轉向與各段速度差一眼看得出。連桿(rod)不動,不上色。
// 作圖軌跡(trace)是繪圖儀器畫出的線,以單一鉛筆色呈現。
import * as THREE from "three";
import { MOVING_KINDS } from "../models/kinds.js";
import { FLUID_LAYER } from "./lineart.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const RADIUS = { belt: 0.05, rope: 0.045, rod: 0.03, chain: 0.06, trace: 0.035 };
const MARK_SPACING = { belt: 0.42, rope: 0.24, chain: 0.36 }; // 相鄰兩個記號的距離,也就是一個色段的長度
/** 線狀零件的粗細(半徑):鍊條取鏈節寬的一半。繪圖與實體驗證共用 */
export const pathRadius = (part) => (part.kind === "chain" ? (part.width ?? 0.2) / 2 : (part.radius ?? RADIUS[part.kind]));
const TRACE_COLOR = "#b3261e";
const SEGMENT_COLORS = ["#f0b429", "#3aa676", "#7b4bb7"];
const MARK_COLOR = "#2a2a2a";

// 一張紋理含 SEGMENT_COLORS.length 個色段,每段開頭一道黑色記號
function segmentTexture() {
  const cell = 32;
  const canvas = document.createElement("canvas");
  canvas.width = cell * SEGMENT_COLORS.length;
  canvas.height = 2;
  const ctx = canvas.getContext("2d");
  SEGMENT_COLORS.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(i * cell, 0, cell, 2);
    ctx.fillStyle = MARK_COLOR;
    ctx.fillRect(i * cell, 0, 7, 2);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

class PolylineCurve extends THREE.Curve {
  constructor(points, closed) {
    super();
    this.pts = points.map((p) => new THREE.Vector3(...p));
    if (closed) this.pts.push(this.pts[0].clone());
    this.cum = [0];
    for (let i = 1; i < this.pts.length; i++) {
      this.cum.push(this.cum[i - 1] + this.pts[i].distanceTo(this.pts[i - 1]));
    }
    this.total = this.cum[this.cum.length - 1] || 1;
  }
  getPoint(t, target = new THREE.Vector3()) {
    const s = Math.min(Math.max(t, 0), 1) * this.total;
    let i = 1;
    while (i < this.cum.length - 1 && this.cum[i] < s) i++;
    const span = this.cum[i] - this.cum[i - 1] || 1;
    return target.lerpVectors(this.pts[i - 1], this.pts[i], (s - this.cum[i - 1]) / span);
  }
}

export class PathPart {
  constructor(part, material) {
    this.kind = part.kind;
    this.radius = pathRadius(part);
    this.material = material.clone();
    if (part.kind === "trace") this.material = new THREE.MeshBasicMaterial({ color: TRACE_COLOR });
    if (MOVING_KINDS.has(part.kind)) {
      this.spacing = MARK_SPACING[part.kind];
      this.texture = segmentTexture();
      this.material.map = this.texture;
    }
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
    // 作圖軌跡是畫在紙上的線,不描邊(放在流體層,只畫顏色)
    if (part.kind === "trace") this.mesh.layers.set(FLUID_LAYER);
    this.points = null;
  }

  update({ points, closed, phase = 0 }) {
    if (!samePoints(points, this.points)) {
      this.points = points;
      const curve = new PolylineCurve(points, closed);
      this.length = curve.total;
      this.mesh.geometry.dispose();
      const segments = Math.max(8, Math.min(600, Math.round(curve.total * 24), points.length * 3));
      this.mesh.geometry = new THREE.TubeGeometry(curve, segments, this.radius, 8, false);
    }
    if (this.texture) {
      // 封閉的皮帶繞一圈要剛好整數輪色段,接頭處才不會有色差接縫
      const cycle = this.spacing * SEGMENT_COLORS.length;
      const period = closed ? this.length / Math.max(1, Math.round(this.length / cycle)) : cycle;
      this.texture.repeat.set(this.length / period, 1);
      this.texture.offset.x = -phase / period;
    }
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.texture?.dispose();
  }
}

function samePoints(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  if (a === b) return true;
  for (let i = 0; i < a.length; i++) {
    const p = a[i];
    const q = b[i];
    if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) > 1e-6) return false;
  }
  return true;
}

// ── 鍊條:沿路徑一節一節排列的鏈節 ─────────
// 鏈節的兩個銷落在路徑上相距一個節距的兩點,鏈節就是兩銷之間的弦,繞過鏈輪時自然成多邊形。
// 第 m 節(材料座標)的位置 = m·節距 + 行進相位;顏色依 m 決定:每 LINKS_PER_SEGMENT 節中
// 第一節是黑色記號,其餘塗同一色,色段跟著鍊條走(與皮帶、繩的規則相同)。
const LINKS_PER_SEGMENT = 3;

function linkGeometry(style, width, span) {
  const geometries = [];
  if (style === "ladder") {
    // 梯形鍊:兩股環節(沿法線相隔 span)之間以橫檔相連,橫檔卡進輪緣的凸塊之間
    for (const z of [span / 2, -span / 2]) {
      const ring = new THREE.TorusGeometry(0.5, width * 0.16, 8, 20);
      ring.scale(1.1, 0.4, 1);
      ring.rotateX(Math.PI / 2);
      ring.translate(0.5, 0, z);
      geometries.push(ring.toNonIndexed());
    }
    const rung = new THREE.CylinderGeometry(width * 0.14, width * 0.14, span, 8).rotateX(Math.PI / 2);
    geometries.push(rung.toNonIndexed());
  } else if (style === "ring") {
    const ring = new THREE.TorusGeometry(0.5, width * 0.18, 8, 24);
    ring.scale(1.15, 0.62, 1);
    ring.translate(0.5, 0, 0);
    geometries.push(ring);
  } else {
    const shape = new THREE.Shape();
    const r = width / 2;
    shape.absarc(1, 0, r, -Math.PI / 2, Math.PI / 2, false);
    shape.absarc(0, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
    const plate = new THREE.ExtrudeGeometry(shape, { depth: width * 0.3, bevelEnabled: false, curveSegments: 8 });
    plate.translate(0, 0, -width * 0.15);
    geometries.push(plate);
    if (style === "toothed") {
      // 鏈節內側的齒,嵌進鏈輪的齒間
      const t = new THREE.Shape([new THREE.Vector2(0.28, -r * 0.9), new THREE.Vector2(0.5, -r * 2.1), new THREE.Vector2(0.72, -r * 0.9)]);
      const g = new THREE.ExtrudeGeometry(t, { depth: width * 0.3, bevelEnabled: false });
      g.translate(0, 0, -width * 0.15);
      geometries.push(g);
    }
    for (const x of [0, 1]) {
      const pin = new THREE.CylinderGeometry(width * 0.16, width * 0.16, width * 0.5, 10).rotateX(Math.PI / 2);
      pin.translate(x, 0, 0);
      geometries.push(pin.toNonIndexed());
    }
  }
  return geometries.length === 1 ? geometries[0] : mergeGeometries(geometries);
}

export class ChainPart {
  constructor(part, material) {
    this.kind = "chain";
    this.pitch = part.pitch ?? 0.4;
    this.style = part.style ?? "plate";
    this.normal = new THREE.Vector3(...(part.normal ?? [0, 0, 1])).normalize();
    this.offset = part.offset ?? 0.12; // 板式鏈節分兩層(內節、外節),彼此錯開
    this.material = material.clone();
    this.geometry = linkGeometry(this.style, part.width ?? 0.2, part.span ?? 0.8);
    this.mesh = new THREE.Group();
    this.instances = null;
    this.capacity = 0;
    this.points = null;
    this.colors = [...SEGMENT_COLORS.map((c) => new THREE.Color(c)), new THREE.Color(MARK_COLOR)];
    this.colors.forEach((c) => c.convertSRGBToLinear());
  }

  ensure(count) {
    if (this.capacity >= count) return;
    if (this.instances) {
      this.mesh.remove(this.instances);
      this.instances.dispose();
    }
    this.capacity = Math.max(32, count + 8);
    this.instances = new THREE.InstancedMesh(this.geometry, this.material, this.capacity);
    this.instances.frustumCulled = false;
    this.mesh.add(this.instances);
  }

  update({ points, closed, phase = 0 }) {
    if (!samePoints(points, this.points)) {
      this.points = points;
      this.curve = new PolylineCurve(points, closed);
    }
    const curve = this.curve;
    const length = curve.total;
    // 封閉鍊條一圈要是整數個色段,接頭處才不會有色差
    let pitch = this.pitch;
    if (closed) {
      const unit = LINKS_PER_SEGMENT * SEGMENT_COLORS.length;
      pitch = length / Math.max(unit, unit * Math.round(length / (pitch * unit)));
    }
    const first = closed ? 0 : Math.ceil(-phase / pitch);
    const last = closed ? Math.round(length / pitch) - 1 : Math.floor((length - pitch - phase) / pitch);
    const count = Math.max(0, last - first + 1);
    this.ensure(count);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const x = new THREE.Vector3();
    const y = new THREE.Vector3();
    const z = new THREE.Vector3();
    const m = new THREE.Matrix4();
    const at = (s, target) => {
      const u = closed ? (((s % length) + length) % length) / length : s / length;
      return curve.getPoint(u, target);
    };
    let i = 0;
    for (let k = first; k <= last; k++) {
      const s = k * pitch + (closed ? ((phase % length) + length) % length : phase);
      at(s, a);
      at(s + pitch, b);
      x.subVectors(b, a);
      const l = x.length() || 1e-6;
      x.divideScalar(l);
      z.copy(this.normal).addScaledVector(x, -this.normal.dot(x)).normalize();
      y.crossVectors(z, x);
      // 鏈節分兩層:板式的內外節錯開;環式的相鄰節互相垂直
      const odd = ((k % 2) + 2) % 2 === 1;
      if (this.style === "ring" && odd) {
        m.makeBasis(x, z, y.negate());
      } else {
        m.makeBasis(x, y, z);
      }
      m.scale(new THREE.Vector3(l, 1, 1));
      const lift = this.style === "ring" || this.style === "ladder" ? 0 : odd ? this.offset : -this.offset * 0.2;
      m.setPosition(a.x + this.normal.x * lift, a.y + this.normal.y * lift, a.z + this.normal.z * lift);
      this.instances.setMatrixAt(i, m);
      const index = ((k % LINKS_PER_SEGMENT) + LINKS_PER_SEGMENT) % LINKS_PER_SEGMENT;
      const segment = (((Math.floor(k / LINKS_PER_SEGMENT)) % SEGMENT_COLORS.length) + SEGMENT_COLORS.length) % SEGMENT_COLORS.length;
      this.instances.setColorAt(i, this.colors[index === 0 ? SEGMENT_COLORS.length : segment]);
      i++;
    }
    this.instances.count = i;
    this.instances.instanceMatrix.needsUpdate = true;
    if (this.instances.instanceColor) this.instances.instanceColor.needsUpdate = true;
  }

  dispose() {
    this.instances?.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}
