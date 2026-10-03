// 動力重演:只推主動件,宣告為「自由」的零件由碰撞、樞軸 / 滑軌、重力與彈簧帶動,
// 再和模型自己算出的姿勢比——動作有沒有發生、先後順序、停下的位置。不比花了多久。
//
// 模型定義的宣告(def.replay):
//   from, to    主動量走過的區間(預設從初始值走一輪)
//   free        { 零件 id: 約束與受力 }——沒列在這裡的零件都照模型的姿勢帶動(齒輪、皮帶傳動的部分屬於這類)
//     pivot       樞軸的世界座標(起始姿勢時;預設是零件的原點),繞 axis(預設是零件定義的 axis)轉
//     slide       改為沿這個方向滑動的滑軌
//     on          樞軸 / 滑軌裝在哪個零件上(預設是固定的機架)
//     gravity     false 表示不受重力(預設受重力,方向 −Y)
//     spring      +1 / −1:彈簧把它往軸的正向 / 反向推(繞軸逆時針為正;滑軌則是沿 slide 的方向)
//     hold        true:有摩擦定位,沒被推時停在原地(星形輪、棘輪)
//     limits      [min, max]:轉角或位移的範圍(擋止)
//   expect      [{ at: 主動量, part, label, quote?(原文), tolerance? }]:走到 at 時,這個零件自起點以來的
//               轉角與位置要和模型一致
//   ignore      [[a, b], …]:這兩個零件之間不算碰撞(已知是示意的重疊)
// 質量、彈簧力、摩擦都用下面全書一致的預設值;固定時間步長,同樣的輸入每次結果相同。
import * as THREE from "three";
import RAPIER from "@dimforge/rapier3d-compat";
import { PATH_KINDS } from "../models/kinds.js";
import { placement } from "../viewer/placement.js";
import { buildSolid } from "./solids.js";
import { initialValue, defaultSpeed } from "./sampling.js";

await RAPIER.init();

const DT = 1 / 240; // 固定時間步長
const SECONDS = 10; // 主動量走完區間花的模擬時間:夠慢,自由零件跟得上
const SETTLE = 1; // 開始推之前先讓自由零件落定
const GRAVITY = 9.81;
const FRICTION = 0.3;
const SPRING = 3; // 彈簧力 = 零件重量的幾倍(力臂一個單位)
const HOLD = 40; // 摩擦定位的阻尼(乘上零件質量)
const ANGLE_TOLERANCE = 0.14; // 停位的容許誤差:約 8°
const POSITION_TOLERANCE = 0.12;

const Z_AXIS = new THREE.Vector3(0, 0, 1);
const deg = (a) => `${((a * 180) / Math.PI).toFixed(0)}°`;

function spanOf(def) {
  const d = def.driver;
  const from = def.replay.from ?? initialValue(d);
  if (def.replay.to != null) return [from, def.replay.to];
  if (d.range && !(d.type === "virtual" && d.mode === "progress")) return [d.range[0], d.range[1]];
  const round = d.cycle ? 2 * Math.abs(d.cycle[1] - d.cycle[0]) : d.type === "rotation" ? Math.PI * 2 : Math.abs(defaultSpeed(d)) * 8;
  return [from, from + Math.sign(defaultSpeed(d)) * round];
}

/** 對一個有 replay 宣告的模型做動力重演,回傳問題清單 */
export function replay(def) {
  const spec = def.replay;
  const state = spec.state ?? def.states?.initial;
  const [from, to] = spanOf(def);
  const world = new RAPIER.World({ x: 0, y: -GRAVITY, z: 0 });
  world.timestep = DT;
  world.integrationParameters.numSolverIterations = 8;
  const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  const start = def.pose(from, state);

  // 每個剛體零件一個物體:原點在零件的原點,起始朝向烘進碰撞形狀裡(物體本身從單位旋轉開始)
  const bodies = new Map();
  const place = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), length: null };
  const transformOf = (part, p) => {
    const baseQuat = new THREE.Quaternion().setFromUnitVectors(Z_AXIS, new THREE.Vector3(...(part.axis ?? [0, 0, 1])).normalize());
    placement(part, baseQuat, p ?? {}, p?.angle ?? 0, place);
    return { position: place.position.clone(), quaternion: place.quaternion.clone(), length: place.length };
  };
  for (const part of def.parts) {
    if (PATH_KINDS.has(part.kind) || part.kind === "fill") continue;
    const p = start.parts[part.id] ?? {};
    if (p.visible === false) continue;
    const free = spec.free?.[part.id];
    const t0 = transformOf(part, p);
    const { object, meshes } = buildSolid(part);
    object.position.copy(t0.position);
    object.quaternion.copy(t0.quaternion);
    if (t0.length != null) object.userData.stretch?.(t0.length);
    object.updateMatrixWorld(true);
    const desc = (free ? RAPIER.RigidBodyDesc.dynamic().setCcdEnabled(true) : RAPIER.RigidBodyDesc.kinematicPositionBased()).setTranslation(t0.position.x, t0.position.y, t0.position.z);
    if (free?.gravity === false) desc.setGravityScale(0);
    const body = world.createRigidBody(desc);
    const v = new THREE.Vector3();
    for (const { mesh, hulls } of meshes) {
      for (const hull of hulls) {
        const points = new Float32Array(hull.length);
        for (let i = 0; i < hull.length; i += 3) {
          v.set(hull[i], hull[i + 1], hull[i + 2]).applyMatrix4(mesh.matrixWorld).sub(t0.position);
          points.set([v.x, v.y, v.z], i);
        }
        const collider = RAPIER.ColliderDesc.convexHull(points);
        if (!collider) continue;
        collider.setFriction(FRICTION).setActiveHooks(RAPIER.ActiveHooks.FILTER_CONTACT_PAIRS);
        try {
          world.createCollider(collider, body).partId = part.id;
        } catch {
          // 退化的凸包
        }
      }
    }
    bodies.set(part.id, { part, body, free, t0, startInverse: t0.quaternion.clone().invert(), turned: 0, last: new THREE.Quaternion() });
  }

  // 自由零件的樞軸或滑軌
  const local = (entry, point) => {
    const t = entry.body.translation();
    return { x: point[0] - t.x, y: point[1] - t.y, z: point[2] - t.z };
  };
  const unjoined = new Set((spec.ignore ?? []).map(([a, b]) => [a, b].sort().join("\n")));
  for (const [id, entry] of bodies) {
    const { free, part, body, t0 } = entry;
    if (!free) continue;
    const parent = free.on ? bodies.get(free.on) : null;
    const anchor = free.pivot ?? t0.position.toArray();
    const axis = new THREE.Vector3(...(free.slide ?? free.axis ?? part.axis ?? [0, 0, 1])).normalize();
    entry.axis = axis;
    entry.slide = !!free.slide;
    const parentBody = parent ? parent.body : ground;
    const anchorParent = parent ? local(parent, anchor) : { x: anchor[0], y: anchor[1], z: anchor[2] };
    const data = free.slide ? RAPIER.JointData.prismatic(anchorParent, local(entry, anchor), axis) : RAPIER.JointData.revolute(anchorParent, local(entry, anchor), axis);
    const joint = world.createImpulseJoint(data, parentBody, body, true);
    joint.setContactsEnabled(false);
    if (free.on) unjoined.add([id, free.on].sort().join("\n"));
    if (free.limits) joint.setLimits(free.limits[0], free.limits[1]);
    body.recomputeMassPropertiesFromColliders();
    if (free.hold) joint.configureMotorVelocity(0, HOLD * body.mass());
    entry.load = free.spring ? free.spring * SPRING * GRAVITY * body.mass() : 0;
  }
  const hooks = {
    filterContactPair: (c1, c2) => {
      const a = world.getCollider(c1).partId;
      const b = world.getCollider(c2).partId;
      return unjoined.has([a, b].sort().join("\n")) ? null : RAPIER.SolverFlags.COMPUTE_IMPULSE;
    },
    filterIntersectionPair: () => true,
  };

  const q = new THREE.Quaternion();
  const dq = new THREE.Quaternion();
  const step = (value) => {
    const pose = def.pose(value, state);
    for (const [id, entry] of bodies) {
      if (entry.free) {
        if (entry.load) {
          entry.body.resetForces(true);
          entry.body.resetTorques(true);
          const f = entry.axis.clone().multiplyScalar(entry.load);
          if (entry.slide) entry.body.addForce(f, true);
          else entry.body.addTorque(f, true);
        }
        continue;
      }
      const t = transformOf(entry.part, pose.parts[id]);
      entry.body.setNextKinematicTranslation(t.position);
      entry.body.setNextKinematicRotation(q.copy(t.quaternion).multiply(entry.startInverse));
    }
    world.step(undefined, hooks);
    // 自由零件繞自己的軸累計轉了多少
    for (const entry of bodies.values()) {
      if (!entry.free || entry.slide) continue;
      const r = entry.body.rotation();
      q.set(r.x, r.y, r.z, r.w);
      dq.copy(q).multiply(entry.last.clone().invert());
      entry.turned += 2 * Math.atan2(dq.x * entry.axis.x + dq.y * entry.axis.y + dq.z * entry.axis.z, dq.w);
      entry.last.copy(q);
    }
  };

  const findings = [];
  try {
    for (let i = 0; i < SETTLE / DT; i++) step(from);
    for (const entry of bodies.values()) entry.settled = { turned: entry.turned, position: new THREE.Vector3().copy(entry.body.translation()) };
    const steps = Math.round((spec.seconds ?? SECONDS) / DT);
    const pending = [...(spec.expect ?? [])].sort((a, b) => (a.at - b.at) * Math.sign(to - from));
    for (let i = 1; i <= steps && pending.length; i++) {
      const value = from + ((to - from) * i) / steps;
      step(value);
      if (process.env.REPLAY_TRACE && i % 120 === 0) console.log(value.toFixed(2), [...bodies].filter(([, e]) => e.free).map(([id, e]) => `${id} ${[e.body.translation().x, e.body.translation().y].map((x) => x.toFixed(2))} ${deg(e.turned)}`).join(" | "));
      while (pending.length && (pending[0].at - value) * Math.sign(to - from) <= 1e-12) {
        const finding = compare(def, bodies, pending.shift(), from, state);
        if (finding) findings.push(finding);
      }
    }
    for (const missed of pending) {
      findings.push({ check: "replay", figure: def.figure, parts: [missed.part], value: missed.at, state, severity: 0, count: 1, message: `預期事件的主動量 ${missed.at} 不在重演的區間 ${from}–${to} 內` });
    }
  } finally {
    world.free();
  }
  return findings;
}

// 走到預期事件的主動量時:自由零件自起點以來的轉角與位置,和模型的姿勢比
function compare(def, bodies, expected, from, state) {
  const entry = bodies.get(expected.part);
  const part = entry.part;
  const model0 = def.pose(from, state).parts[expected.part] ?? {};
  const model1 = def.pose(expected.at, state).parts[expected.part] ?? {};
  const name = expected.label ? `「${expected.label}」` : "";
  const quote = expected.quote ? `(原文:${expected.quote})` : "";
  const base = { check: "replay", figure: def.figure, parts: [expected.part], value: expected.at, state, count: 1 };
  const position = (p) => new THREE.Vector3(...(p.position ?? p.from ?? part.center ?? [0, 0, 0]));
  const moved = position(model1).sub(position(model0));
  const actual = new THREE.Vector3().copy(entry.body.translation()).sub(entry.settled.position);
  if (!entry.slide) {
    const want = (model1.angle ?? 0) - (model0.angle ?? 0);
    const got = entry.turned - entry.settled.turned;
    const error = Math.abs(want - got);
    if (error > (expected.tolerance ?? ANGLE_TOLERANCE)) {
      const did = Math.abs(got) < 0.02 ? "沒動" : `轉了 ${deg(got)}`;
      return { ...base, severity: error, message: `${name}預期 ${expected.part} 在主動量 ${expected.at.toFixed(2)} 時已轉 ${deg(want)},實際${did}${quote}` };
    }
  }
  const error = moved.distanceTo(actual);
  if (error > (expected.tolerance ?? POSITION_TOLERANCE)) {
    const did = actual.length() < 0.02 ? "沒動" : `移了 ${actual.length().toFixed(2)}`;
    return { ...base, severity: error, message: `${name}預期 ${expected.part} 在主動量 ${expected.at.toFixed(2)} 時已移 ${moved.length().toFixed(2)},實際${did}(停位差 ${error.toFixed(2)})${quote}` };
  }
  return null;
}
