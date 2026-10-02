// 線稿風繪圖:先畫一次淡灰平塗的上色圖,再畫一次法線與深度,
// 最後在全螢幕四邊形上偵測法線與深度的落差,描出黑色粗輪廓線。
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D tColor;
  uniform sampler2D tNormal;
  uniform sampler2D tDepth;
  uniform vec2 texel;
  uniform float thickness;
  uniform float cameraNear;
  uniform float cameraFar;
  varying vec2 vUv;

  float viewZ(vec2 uv) {
    float z = texture2D(tDepth, uv).x * 2.0 - 1.0;
    return 2.0 * cameraNear * cameraFar / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
  }

  float edgeAt(vec2 offset, vec3 n0, float d0) {
    vec2 uv = vUv + offset * texel * thickness;
    vec3 n = texture2D(tNormal, uv).xyz * 2.0 - 1.0;
    float d = viewZ(uv);
    float normalEdge = smoothstep(0.25, 0.45, 1.0 - dot(n0, n));
    float depthEdge = smoothstep(0.015, 0.03, abs(d - d0) / d0);
    return max(normalEdge, depthEdge);
  }

  void main() {
    vec4 color = texture2D(tColor, vUv);
    vec3 n0 = texture2D(tNormal, vUv).xyz * 2.0 - 1.0;
    float d0 = viewZ(vUv);
    float edge = 0.0;
    edge = max(edge, edgeAt(vec2(1.0, 0.0), n0, d0));
    edge = max(edge, edgeAt(vec2(-1.0, 0.0), n0, d0));
    edge = max(edge, edgeAt(vec2(0.0, 1.0), n0, d0));
    edge = max(edge, edgeAt(vec2(0.0, -1.0), n0, d0));
    edge = max(edge, edgeAt(vec2(0.7, 0.7), n0, d0));
    edge = max(edge, edgeAt(vec2(-0.7, 0.7), n0, d0));
    edge = max(edge, edgeAt(vec2(0.7, -0.7), n0, d0));
    edge = max(edge, edgeAt(vec2(-0.7, -0.7), n0, d0));
    gl_FragColor = vec4(mix(color.rgb, vec3(0.08), edge), 1.0);
    #include <colorspace_fragment>
  }
`;

export class LineArtRenderer {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.renderer.setClearColor(0xffffff, 1);
    this.colorTarget = new THREE.WebGLRenderTarget(1, 1, { samples: 4 });
    this.normalTarget = new THREE.WebGLRenderTarget(1, 1, {
      depthTexture: new THREE.DepthTexture(1, 1),
    });
    this.normalMaterial = new THREE.MeshNormalMaterial();
    this.quadMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tColor: { value: this.colorTarget.texture },
        tNormal: { value: this.normalTarget.texture },
        tDepth: { value: this.normalTarget.depthTexture },
        texel: { value: new THREE.Vector2() },
        thickness: { value: 1 },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 100 },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.quadScene = new THREE.Scene();
    this.quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.quadMaterial));
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  setSize(width, height) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(width, height, false);
    const w = Math.max(1, Math.floor(width * ratio));
    const h = Math.max(1, Math.floor(height * ratio));
    this.colorTarget.setSize(w, h);
    this.normalTarget.setSize(w, h);
    this.quadMaterial.uniforms.texel.value.set(1 / w, 1 / h);
    this.quadMaterial.uniforms.thickness.value = 1.1 * ratio;
  }

  render(scene, camera) {
    const r = this.renderer;
    const uniforms = this.quadMaterial.uniforms;
    uniforms.cameraNear.value = camera.near;
    uniforms.cameraFar.value = camera.far;

    r.setRenderTarget(this.colorTarget);
    r.render(scene, camera);

    const background = scene.background;
    scene.background = null;
    scene.overrideMaterial = this.normalMaterial;
    r.setRenderTarget(this.normalTarget);
    r.render(scene, camera);
    scene.overrideMaterial = null;
    scene.background = background;

    r.setRenderTarget(null);
    r.render(this.quadScene, this.quadCamera);
  }
}
