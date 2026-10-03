// 姿勢 → 物件的位置與朝向。不碰 DOM:網站的繪圖(viewer.js)與維護用的實體驗證(verify/)共用這一份擺放規則。
import * as THREE from "three";

const Z_AXIS = new THREE.Vector3(0, 0, 1);
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
export function placement(part, baseQuat, p, angle, out) {
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
