// 皮帶、繩、連桿:沿姿勢回傳的折線建立管狀幾何。
// 皮帶與繩貼上間隔記號,紋理座標以「離起點的弧長+行進相位」計算,
// 所以記號會跟著材料移動;滑輪組各段繩的速度差也就自然顯示出來。
// 繩另外沿全長上漸層色(固定端金黃 → 綠 → 繩端紫),顏色同樣綁在材料座標上,
// 拉動時看得出哪一段繩繞過了滑輪、移動了多少。
import * as THREE from "three";

const RADIUS = { belt: 0.05, rope: 0.045, rod: 0.03 };
const ROPE_GRADIENT = ["#f0b429", "#3aa676", "#7b4bb7"].map((c) => new THREE.Color(c));

// t:0 = 繩的固定端,1 = 另一端
function ropeColor(t, target) {
  const x = Math.min(Math.max(t, 0), 1) * (ROPE_GRADIENT.length - 1);
  const i = Math.min(Math.floor(x), ROPE_GRADIENT.length - 2);
  return target.lerpColors(ROPE_GRADIENT[i], ROPE_GRADIENT[i + 1], x - i);
}
const MARK_SPACING = { belt: 0.42, rope: 0.24 };

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

function stripeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 4;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 32, 4);
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(0, 0, 7, 4);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  return texture;
}

export class PathPart {
  constructor(part, material) {
    this.kind = part.kind;
    this.radius = part.radius ?? RADIUS[part.kind];
    this.spacing = MARK_SPACING[part.kind];
    this.material = material.clone();
    if (this.spacing) {
      this.texture = stripeTexture();
      this.material.map = this.texture;
    }
    this.gradient = part.kind === "rope";
    if (this.gradient) this.material.vertexColors = true;
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
      if (this.gradient) this.paintGradient();
    }
    if (this.texture) {
      this.texture.repeat.set(this.length / this.spacing, 1);
      this.texture.offset.x = -phase / this.spacing;
    }
  }

  // 紋理座標 u 沿弧長由 0 到 1;乘上目前長度、除以第一次的長度,就是繩上的材料位置
  // (繩長守恆,兩者幾乎相等;這樣即使有微小誤差,顏色也不會跟著繩端伸縮)
  paintGradient() {
    this.restLength ??= this.length;
    const geometry = this.mesh.geometry;
    const uv = geometry.attributes.uv;
    const colors = new Float32Array(uv.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < uv.count; i++) {
      ropeColor((uv.getX(i) * this.length) / this.restLength, color).toArray(colors, i * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
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
