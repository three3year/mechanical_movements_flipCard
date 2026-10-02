// 皮帶、繩、連桿:沿姿勢回傳的折線建立管狀幾何。
// 會運動的線狀零件(models/kinds.js 的 MOVING_KINDS:皮帶、繩、鍊條)以黑色間隔記號分段,
// 每段塗一種實色(金黃 → 綠 → 紫輪流),紋理座標 = 離起點的弧長 − 行進相位,也就是材料座標:
// 記號與色段跟著材料移動、繞過輪子,轉向與各段速度差一眼看得出。連桿(rod)不動,不上色。
// 作圖軌跡(trace)是繪圖儀器畫出的線,以單一鉛筆色呈現。
import * as THREE from "three";
import { MOVING_KINDS } from "../models/kinds.js";

const RADIUS = { belt: 0.05, rope: 0.045, rod: 0.03, chain: 0.06, trace: 0.025 };
const MARK_SPACING = { belt: 0.42, rope: 0.24, chain: 0.36 }; // 相鄰兩個記號的距離,也就是一個色段的長度
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
    this.radius = part.radius ?? RADIUS[part.kind];
    this.material = material.clone();
    if (part.kind === "trace") this.material.color.set(TRACE_COLOR);
    if (MOVING_KINDS.has(part.kind)) {
      this.spacing = MARK_SPACING[part.kind];
      this.texture = segmentTexture();
      this.material.map = this.texture;
    }
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
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
