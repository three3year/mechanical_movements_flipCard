// 流體示意的點:水、蒸汽、空氣各一種顏色,以小球呈現,放在不描邊的流體層(見 lineart.js)。
// 點的位置由模型的 pose() 回傳(flows),這裡只負責畫,不累積、不模擬。
import * as THREE from "three";
import { FLUID_LAYER } from "./lineart.js";

export const FLUID_COLORS = { water: "#2a9df4", steam: "#9aa0b8", air: "#7cc96b" };
const DOT = { water: 0.06, steam: 0.075, air: 0.06 };

export class FlowCues {
  constructor(scene) {
    this.scene = scene;
    this.layers = new Map();
    this.matrix = new THREE.Matrix4();
  }

  layer(fluid) {
    let layer = this.layers.get(fluid);
    if (layer) return layer;
    const material = new THREE.MeshBasicMaterial({ color: FLUID_COLORS[fluid] });
    const geometry = new THREE.SphereGeometry(1, 10, 6);
    layer = { material, geometry, mesh: null, capacity: 0 };
    this.layers.set(fluid, layer);
    return layer;
  }

  ensure(layer, count) {
    if (layer.capacity >= count) return;
    if (layer.mesh) {
      this.scene.remove(layer.mesh);
      layer.mesh.dispose();
    }
    layer.capacity = Math.max(64, count * 2);
    layer.mesh = new THREE.InstancedMesh(layer.geometry, layer.material, layer.capacity);
    layer.mesh.layers.set(FLUID_LAYER);
    layer.mesh.frustumCulled = false;
    this.scene.add(layer.mesh);
  }

  /** flows:[{ fluid, points, size? }] */
  update(flows = []) {
    const byFluid = new Map();
    for (const flow of flows) {
      if (!byFluid.has(flow.fluid)) byFluid.set(flow.fluid, []);
      byFluid.get(flow.fluid).push(flow);
    }
    for (const fluid of new Set([...this.layers.keys(), ...byFluid.keys()])) {
      const list = byFluid.get(fluid) ?? [];
      const count = list.reduce((n, f) => n + f.points.length, 0);
      const layer = this.layer(fluid);
      this.ensure(layer, count);
      if (!layer.mesh) continue;
      let i = 0;
      for (const flow of list) {
        const s = flow.size ?? DOT[fluid];
        for (const p of flow.points) {
          this.matrix.makeScale(s, s, s).setPosition(p[0], p[1], p[2]);
          layer.mesh.setMatrixAt(i++, this.matrix);
        }
      }
      layer.mesh.count = i;
      layer.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  dispose() {
    for (const layer of this.layers.values()) {
      layer.mesh?.dispose();
      layer.geometry.dispose();
      layer.material.dispose();
    }
  }
}
