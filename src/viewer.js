import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PoseEvaluator } from './pose.js';

const COLORS = { left: 0x176c5e, right: 0xb7542e, center: 0x3f596b };

export class SkeletonViewer {
  constructor(container) {
    this.container = container; this.clip = null; this.markersVisible = true; this.follow = true; this.upAxis = 'Y';
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xedf0e7);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    container.prepend(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xedf0e7, 850, 2400);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x859987, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 2.5); sun.position.set(160, 350, 220); this.scene.add(sun);
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20000);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 20; this.controls.maxDistance = 8000;
    this.controls.maxPolarAngle = Math.PI * 0.94;
    this.grid = new THREE.GridHelper(1800, 60, 0x9aaa9c, 0xc7d0c1);
    this.grid.material.transparent = true; this.grid.material.opacity = 0.55; this.scene.add(this.grid);
    this.axes = new THREE.AxesHelper(40); this.axes.position.set(-130, 0.1, -130); this.scene.add(this.axes);
    this.rotation = new THREE.Quaternion(); this.point = new THREE.Vector3(); this.previousRoot = new THREE.Vector3();
    this.matrix = new THREE.Matrix4(); this.sphereScale = new THREE.Vector3(2.4, 2.4, 2.4); this.identity = new THREE.Quaternion();
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(container);
    this.camera.position.set(280, 180, 400); this.controls.target.set(0, 85, 0); this.controls.update(); this.resize();
  }
  resize() {
    const { width, height } = this.container.getBoundingClientRect();
    if (!width || !height) return;
    this.renderer.setSize(width, height); this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
  }
  clearSkeleton() {
    if (this.lines) { this.scene.remove(this.lines, this.spheres); this.lines.geometry.dispose(); this.lines.material.dispose(); this.spheres.geometry.dispose(); this.spheres.material.dispose(); }
  }
  setClip(clip) {
    this.clearSkeleton(); this.clip = clip; this.evaluator = new PoseEvaluator(clip);
    this.transformed = clip.joints.map(() => new THREE.Vector3());
    this.edges = clip.joints.filter(j => j.parent >= 0);
    this.positions = new Float32Array(this.edges.length * 6);
    const colors = new Float32Array(this.edges.length * 6);
    const jointColors = [];
    for (const joint of clip.joints) {
      let key = joint.name.toLowerCase().startsWith('left') || /^l(?:hip|knee|ankle|foot|toe|collar|shldr|shoulder|elbow|wrist|hand|arm|forearm|thigh|shin)/i.test(joint.name) ? 'left' : joint.name.toLowerCase().startsWith('right') || /^r(?:hip|knee|ankle|foot|toe|collar|shldr|shoulder|elbow|wrist|hand|arm|forearm|thigh|shin)/i.test(joint.name) ? 'right' : null;
      const color = key ? new THREE.Color(COLORS[key]) : joint.parent >= 0 ? jointColors[joint.parent] : new THREE.Color(COLORS.center);
      jointColors.push(color);
    }
    this.edges.forEach((j, i) => { jointColors[j.index].toArray(colors, i * 6); jointColors[j.index].toArray(colors, i * 6 + 3); });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ vertexColors: true })); this.lines.frustumCulled = false;
    this.spheres = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 }), clip.joints.length);
    this.spheres.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.spheres.frustumCulled = false;
    jointColors.forEach((color, i) => this.spheres.setColorAt(i, color));
    this.spheres.visible = this.markersVisible; this.scene.add(this.lines, this.spheres);
    this.calibrate(); this.updatePose({ first: 0, second: 0, alpha: 0 }, false); this.fitView();
  }
  calibrate() {
    this.rotation.identity();
    if (this.upAxis === 'Z') this.rotation.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    if (this.upAxis === 'X') this.rotation.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
    const positions = this.evaluator.evaluate(0); const bounds = new THREE.Box3();
    for (const p of positions) bounds.expandByPoint(this.point.copy(p).applyQuaternion(this.rotation));
    const size = bounds.getSize(new THREE.Vector3());
    this.unitScale = 180 / Math.max(size.y, size.x * 0.5, size.z * 0.5, 0.001);
    const root = positions[0].clone().applyQuaternion(this.rotation);
    this.origin = new THREE.Vector3(root.x, bounds.min.y, root.z);
    this.previousRoot.set(0, (root.y - bounds.min.y) * this.unitScale, 0);
  }
  setUpAxis(axis, sample) { this.upAxis = axis; if (this.clip) { this.calibrate(); this.updatePose(sample, false); this.fitView(); } }
  updatePose(sample, moveCamera = true) {
    if (!this.clip) return;
    const positions = this.evaluator.evaluate(sample.first, sample.second, sample.alpha);
    for (let i = 0; i < positions.length; i++) {
      const p = this.transformed[i].copy(positions[i]).applyQuaternion(this.rotation).sub(this.origin).multiplyScalar(this.unitScale);
      this.matrix.compose(p, this.identity, this.sphereScale); this.spheres.setMatrixAt(i, this.matrix);
    }
    const root = this.transformed[0];
    if (this.follow && moveCamera) {
      this.point.subVectors(root, this.previousRoot); this.point.y = 0;
      this.camera.position.add(this.point); this.controls.target.add(this.point);
    }
    this.previousRoot.copy(root);
    if (this.follow) { this.grid.position.x = Math.round(root.x / 30) * 30; this.grid.position.z = Math.round(root.z / 30) * 30; }
    for (let i = 0; i < this.edges.length; i++) { const j = this.edges[i]; this.transformed[j.parent].toArray(this.positions, i * 6); this.transformed[j.index].toArray(this.positions, i * 6 + 3); }
    this.lines.geometry.attributes.position.needsUpdate = true; this.spheres.instanceMatrix.needsUpdate = true;
  }
  fitView() {
    if (!this.clip) return;
    const box = new THREE.Box3().setFromPoints(this.transformed); const center = box.getCenter(new THREE.Vector3()); const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.length() / 2, 60);
    const vertical = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const angle = Math.min(vertical, Math.atan(Math.tan(vertical) * this.camera.aspect));
    const distance = radius / Math.sin(angle) * 1.22;
    this.controls.target.copy(center); this.camera.position.copy(center).add(new THREE.Vector3(0.8, 0.35, 1.3).normalize().multiplyScalar(distance));
    this.controls.update();
  }
  render() { this.controls.update(); this.renderer.render(this.scene, this.camera); }
}
