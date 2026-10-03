// 零件的實體:沿用繪圖層(viewer/parts.js)建出的同一份幾何,再拆成凸塊供物理引擎做碰撞。
// 驗的就是讀者看到的形狀;新增零件種類時不必另外教這裡——認不得的幾何退回整體的凸包。
// 不算實體的只有兩種:轉動記號(塗記號色的條、點、小臂,是塗裝不是零件)與板面的刻線(繪圖層標了 engraving)。
import * as THREE from "three";
import { buildPart } from "../viewer/parts.js";

const BASE = new THREE.MeshBasicMaterial();
const MARK = new THREE.MeshBasicMaterial();

// 附件標 accent 時繪圖層整個塗記號色;它們是真的零件(銷、柱),建實體時去掉這個標記
const plain = (part) => ({ ...part, accent: false, pieces: part.pieces?.map(plain) });

/** 建出零件的 3D 物件(與網站同一份),每個網格附上它的凸塊(網格局部座標的點集) */
export function buildSolid(part) {
  const object = buildPart(plain(part), BASE, MARK);
  const meshes = [];
  object.traverse((o) => {
    if (!o.isMesh || o.material === MARK || o.userData.engraving) return;
    const hulls = convexPieces(o.geometry);
    if (hulls.length) meshes.push({ mesh: o, hulls, axle: axleOf(o.geometry), radius: o.geometry.parameters?.radius ?? Math.max(o.geometry.parameters?.radiusTop ?? 0, o.geometry.parameters?.radiusBottom ?? 0) });
  });
  return { object, meshes };
}

// 圓柱(軸、銷、輪轂、軸眼)的軸線——網格局部座標的兩個端面中心;球是球心(兩個端點相同);其餘回傳 null。
// 用來認出「裝在沒畫出來的孔裡」的軸承、鉸接與球接頭
function axleOf(geometry) {
  if (geometry.type === "SphereGeometry") return [new THREE.Vector3(), new THREE.Vector3()];
  if (geometry.type !== "CylinderGeometry") return null;
  const pos = geometry.attributes.position;
  const n = geometry.parameters.radialSegments;
  const rows = geometry.parameters.heightSegments + 1;
  const center = (row) => {
    const c = new THREE.Vector3();
    for (let i = 0; i < n; i++) c.add(new THREE.Vector3().fromBufferAttribute(pos, row * (n + 1) + i));
    return c.divideScalar(n);
  };
  return [center(0), center(rows - 1)];
}

const cache = new WeakMap();
function convexPieces(geometry) {
  if (!cache.has(geometry)) cache.set(geometry, decompose(geometry));
  return cache.get(geometry);
}

function decompose(geometry) {
  const pos = geometry.attributes.position;
  if (!pos) return [];
  const at = (i) => [pos.getX(i), pos.getY(i), pos.getZ(i)];
  const p = geometry.parameters ?? {};
  switch (geometry.type) {
    case "ExtrudeGeometry":
      return extrudePieces(geometry, at);
    case "LatheGeometry":
      return lathePieces(p, at);
    case "TorusGeometry":
      return ringPieces(p.tubularSegments + 1, p.radialSegments + 1, (ring, k) => at(k * (p.tubularSegments + 1) + ring));
    case "TubeGeometry":
      return ringPieces(p.tubularSegments + 1, p.radialSegments + 1, (ring, k) => at(ring * (p.radialSegments + 1) + k));
    case "ShapeGeometry":
      return []; // 剖面的封面:沒有厚度,實體已由旋轉體本身涵蓋
    default: {
      // 方塊、圓柱、圓錐、球都是凸的;沒見過的幾何也取整體凸包
      const points = [];
      for (let i = 0; i < pos.count; i++) points.push(...at(i));
      return [new Float32Array(points)];
    }
  }
}

// 沿路徑的管、圓環:相鄰兩圈截面的凸包是一塊
function ringPieces(rings, perRing, vertex) {
  const pieces = [];
  for (let r = 0; r + 1 < rings; r++) {
    const points = [];
    for (let k = 0; k < perRing; k++) points.push(...vertex(r, k), ...vertex(r + 1, k));
    pieces.push(new Float32Array(points));
  }
  return pieces;
}

// 旋轉體:剖面多邊形切成凸塊,每塊在相鄰兩個角度之間掃出一塊
function lathePieces(p, at) {
  const n = p.points.length;
  const polygons = convexPolygons(p.points.map((v, i) => ({ id: i, x: v.x, y: v.y })));
  const pieces = [];
  for (let s = 0; s < p.segments; s++) {
    for (const polygon of polygons) {
      const points = [];
      for (const j of polygon) points.push(...at(s * n + j), ...at((s + 1) * n + j));
      pieces.push(new Float32Array(points));
    }
  }
  return pieces;
}

// 擠出的板件:蓋面的三角形併成凸多邊形,每個凸多邊形連同另一面對應的頂點是一塊凸柱。
// 直接讀幾何裡的頂點(已含平移、錐度),不重算輪廓
function extrudePieces(geometry, at) {
  const lid = geometry.groups[0];
  if (!lid) return [];
  const faces = lid.count / 6; // 底面與頂面各 faces 個三角形,順序相同、頂點順序相反
  const ids = new Map();
  const bottom = [];
  const top = [];
  const idOf = (b, t) => {
    const key = `${b[0].toFixed(5)},${b[1].toFixed(5)}`;
    if (!ids.has(key)) {
      ids.set(key, bottom.length);
      bottom.push(b);
      top.push(t);
    }
    return ids.get(key);
  };
  const triangles = [];
  for (let f = 0; f < faces; f++) {
    const tri = [];
    for (let k = 0; k < 3; k++) tri.push(idOf(at(lid.start + f * 3 + k), at(lid.start + (faces + f) * 3 + (2 - k))));
    triangles.push(tri);
  }
  const polygons = mergeConvex(triangles, bottom);
  return polygons.map((polygon) => {
    const points = [];
    for (const id of polygon) points.push(...bottom[id], ...top[id]);
    return new Float32Array(points);
  });
}

// 2D 多邊形(頂點 { id, x, y })→ 凸多邊形(各為 id 的陣列)
function convexPolygons(vertices) {
  const contour = vertices.map((v) => new THREE.Vector2(v.x, v.y));
  const faces = THREE.ShapeUtils.triangulateShape(contour, []);
  const xy = vertices.map((v) => [v.x, v.y]);
  return mergeConvex(faces, xy);
}

const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

// 三角形沿共用邊兩兩合併,合併後仍是凸的才併(Hertel–Mehlhorn 的簡化版):塊數少、每塊也不會太薄
function mergeConvex(triangles, xy) {
  let polygons = triangles
    .map((t) => (cross(xy[t[0]], xy[t[1]], xy[t[2]]) < 0 ? [t[0], t[2], t[1]] : [...t]))
    .filter((t) => Math.abs(cross(xy[t[0]], xy[t[1]], xy[t[2]])) > 1e-12);
  const convex = (poly) => {
    const n = poly.length;
    for (let i = 0; i < n; i++) {
      if (cross(xy[poly[i]], xy[poly[(i + 1) % n]], xy[poly[(i + 2) % n]]) < -1e-10) return false;
    }
    return true;
  };
  for (let merged = true; merged; ) {
    merged = false;
    const edges = new Map(); // "a>b" → 多邊形索引
    polygons.forEach((poly, index) => poly.forEach((a, i) => edges.set(`${a}>${poly[(i + 1) % poly.length]}`, index)));
    const gone = new Set();
    for (let index = 0; index < polygons.length; index++) {
      if (gone.has(index)) continue;
      const poly = polygons[index];
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const other = edges.get(`${b}>${a}`);
        if (other == null || other === index || gone.has(other)) continue;
        const q = polygons[other];
        const j = q.indexOf(b);
        if (q[(j + 1) % q.length] !== a) continue;
        // poly 從 b 繞回 a,接上 q 從 a 之後繞回 b 之前
        const joined = [];
        for (let k = 0; k < poly.length; k++) joined.push(poly[(i + 1 + k) % poly.length]);
        for (let k = 2; k < q.length; k++) joined.push(q[(j + k) % q.length]);
        if (!convex(joined)) continue;
        polygons[index] = joined;
        gone.add(other);
        merged = true;
        break;
      }
    }
    polygons = polygons.filter((_, index) => !gone.has(index));
  }
  return polygons;
}
