import { Matrix4, Quaternion, Vector3 } from 'three';
const DEG = Math.PI / 180;
const axes = { X: new Vector3(1, 0, 0), Y: new Vector3(0, 1, 0), Z: new Vector3(0, 0, 1) };

/** Forward kinematics, applying each channel in its declared BVH order. */
export class PoseEvaluator {
  constructor(clip) {
    this.clip = clip;
    this.world = clip.joints.map(() => new Matrix4());
    this.positions = clip.joints.map(() => new Vector3());
    this.localA = new Matrix4(); this.localB = new Matrix4(); this.operation = new Matrix4();
    this.pA = new Vector3(); this.pB = new Vector3(); this.qA = new Quaternion(); this.qB = new Quaternion(); this.scale = new Vector3(1, 1, 1);
  }
  local(joint, frame, result) {
    result.makeTranslation(...joint.offset);
    const start = frame * this.clip.channelCount + joint.channelOffset;
    for (let i = 0; i < joint.channels.length; i++) {
      const name = joint.channels[i]; const value = this.clip.frames[start + i];
      if (name.endsWith('rotation')) this.operation.makeRotationAxis(axes[name[0]], value * DEG);
      else this.operation.makeTranslation(name[0] === 'X' ? value : 0, name[0] === 'Y' ? value : 0, name[0] === 'Z' ? value : 0);
      result.multiply(this.operation);
    }
    return result;
  }
  evaluate(first, second = first, alpha = 0) {
    first = Math.max(0, Math.min(this.clip.frameCount - 1, first));
    second = Math.max(0, Math.min(this.clip.frameCount - 1, second));
    for (const joint of this.clip.joints) {
      this.local(joint, first, this.localA);
      if (alpha > 0 && first !== second) {
        this.local(joint, second, this.localB);
        this.localA.decompose(this.pA, this.qA, this.scale);
        this.localB.decompose(this.pB, this.qB, this.scale);
        this.pA.lerp(this.pB, alpha); this.qA.slerp(this.qB, alpha);
        this.localA.compose(this.pA, this.qA, this.scale);
      }
      if (joint.parent < 0) this.world[joint.index].copy(this.localA);
      else this.world[joint.index].multiplyMatrices(this.world[joint.parent], this.localA);
      this.positions[joint.index].setFromMatrixPosition(this.world[joint.index]);
    }
    return this.positions;
  }
}
