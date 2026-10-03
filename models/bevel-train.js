// 傘齒輪的周轉輪系(第 495、503、506 種)共用:兩個同軸、面對面的端輪,中間的行星傘齒輪裝在臂上,
// 臂繞同一根軸轉。傘齒輪以 bevel 零件畫(axis 指向錐尖);行星輪的姿勢是「臂的轉動 × 自身的自轉」。
import { quatAxisAngle, quatMul, quatFromZ } from "./kit.js";

/** 行星傘齒輪的四元數:軸線 axis(臂不轉時的方向)先自轉 spin,再隨臂繞 shaftAxis 轉 arm */
export const planetRotation = (shaftAxis, arm, axis, spin) => quatMul(quatAxisAngle(shaftAxis, arm), quatMul(quatFromZ(axis), quatAxisAngle([0, 0, 1], spin)));

/** 行星輪(半徑 rp)咬著兩個端輪(半徑 re)時,相對臂的自轉:端輪相對臂轉 x,行星轉 x·re/rp */
export const planetSpin = (wheelRelArm, re, rp) => (wheelRelArm * re) / rp;
