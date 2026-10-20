// 外形與洞的檢查(維護工具,不屬於實體驗證;掃出的結果不影響 npm run verify 的成敗,只有本身的測試在 test:verify 裡):
// 板件(kind 為 plate 的零件與附件)的 2D 輪廓交給三角化(繪圖層的 ExtrudeGeometry)時,兩種畫法會悄悄變形——
// 洞的頂點落在外形外(整個在外的洞被丟掉、零件變成實心;一半在外的多半是端頭沒畫圓的銷孔),
// 與外輪廓自交(三角化出一塊外形裡沒有的面積,蓋到別的零件上)。這裡用繪圖層同一份三角化量面積,拿來和輪廓算出的面積比;
// 找不到這兩種原因、面積仍不符的另報「面積不符」(保險用,全書目前 0 件)。洞在外形外本身就會讓面積不符,面積附在洞那一項,不另報。
import * as THREE from "three";
import { pointInPolygon, segmentsCross, signedArea } from "../models/contact.js";

const EXTRA = 0.02; // 三角化面積比該有的面積多過這個比例(且多過 MIN_EXTRA)才報自交;自交但面積只差一點的不報
const MIN_EXTRA = 0.005;

/**
 * 掃一個模型定義的每一個板件(含附件裡的板件)。每個問題報一項:
 * { part, problem: "hole-outside" | "self-crossing" | "area-mismatch", holes?: [{ index, outside: "all" | "part", count, of }], area: { outline, holes, expected, triangulated } }
 * ——part 是零件 id(附件是 id.pieces[i]);洞的 count / of 是落在外形外的頂點數與全部頂點數;
 * area.expected 是外形減去落在外形裡的洞;area.triangulated 是三角化後的面積。
 */
export function outlineProblems(def) {
  const found = [];
  const walk = (part, label) => {
    if (part.kind === "plate" && Array.isArray(part.shape?.outline)) found.push(...checkShape(part.shape).map((p) => ({ part: label, ...p })));
    part.pieces?.forEach((piece, i) => walk(piece, `${label}.pieces[${i}]`));
  };
  for (const part of def.parts) walk(part, part.id);
  return found;
}

const polygonArea = (poly) => Math.abs(signedArea(poly));

function checkShape({ outline, holes = [] }) {
  const problems = [];
  const outsideHoles = holes
    .map((hole, index) => {
      const out = hole.filter((p) => !pointInPolygon(p, outline)).length;
      return { index, outside: out === 0 ? null : out === hole.length ? "all" : "part", count: out, of: hole.length };
    })
    .filter((h) => h.outside);
  const holeArea = holes.reduce((sum, hole, i) => sum + (outsideHoles.some((h) => h.index === i && h.outside === "all") ? 0 : polygonArea(hole)), 0);
  const area = { outline: polygonArea(outline), holes: holeArea, triangulated: triangulatedArea(outline, holes) };
  area.expected = area.outline - area.holes;
  if (outsideHoles.length) problems.push({ problem: "hole-outside", holes: outsideHoles, area });
  const extra = area.triangulated - area.expected;
  const crossing = selfCrossing(outline);
  // 洞在外形外本身就會讓面積不符(被丟掉或多出一塊),已在洞那一項附上面積,不再另報
  if (extra > Math.max(MIN_EXTRA, area.expected * EXTRA) && (crossing || !outsideHoles.length)) problems.push({ problem: crossing ? "self-crossing" : "area-mismatch", area });
  else if (!outsideHoles.length && -extra > Math.max(MIN_EXTRA, area.expected * EXTRA)) problems.push({ problem: "area-mismatch", area });
  return problems;
}

// 外輪廓有沒有兩條不相鄰的邊相交(只碰到端點不算)
function selfCrossing(outline) {
  const n = outline.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      if (segmentsCross(outline[i], outline[(i + 1) % n], outline[j], outline[(j + 1) % n])) return true;
    }
  }
  return false;
}

// 照繪圖層的做法(viewer/parts.js 的 extrude)建同一個 Shape,再照 ExtrudeGeometry 的前處理三角化:取點、外形轉成順時針
// (外形有反轉時才把順時針的洞翻成逆時針;three r170 ExtrudeGeometry.js),算三角形面積的和。
// 自交或洞在外形外時 Earcut 的結果依頂點順序而異,順序要和繪圖層一致,量到的才是畫面上那一塊
function triangulatedArea(outline, holes) {
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const hole of holes) shape.holes.push(new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y))));
  const points = shape.extractPoints(4);
  let contour = points.shape;
  const holeVecs = points.holes;
  if (!THREE.ShapeUtils.isClockWise(contour)) {
    contour = contour.reverse();
    holeVecs.forEach((h, i) => {
      if (THREE.ShapeUtils.isClockWise(h)) holeVecs[i] = h.reverse();
    });
  }
  const vertices = contour.concat(...holeVecs);
  const faces = THREE.ShapeUtils.triangulateShape(contour, holeVecs);
  return faces.reduce((sum, [a, b, c]) => sum + Math.abs(THREE.ShapeUtils.area([vertices[a], vertices[b], vertices[c]])), 0);
}
