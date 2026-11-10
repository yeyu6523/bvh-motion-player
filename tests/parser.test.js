import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseBVH, BVHParseError } from '../src/bvh-parser.js';
import { PoseEvaluator } from '../src/pose.js';
import { BVHLoader } from 'three/addons/loaders/BVHLoader.js';
import { AnimationMixer, Vector3 } from 'three';

const simple = (channels = 'Xposition Yposition Zposition Zrotation Xrotation Yrotation', row = '0 10 0 90 0 0') => `HIERARCHY
ROOT Hips
{
 OFFSET 0 0 0
 CHANNELS 6 ${channels}
 JOINT Child { OFFSET 1 0 0 CHANNELS 3 Zrotation Xrotation Yrotation End Site { OFFSET 1 0 0 } }
}
MOTION
Frames: 1
Frame Time: 0.0333333333333333
${row} 0 0 0`;
const near = (actual, expected) => actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) < 1e-6, `${actual} != ${expected}`));

test('hierarchy, End Site, channel indices and metadata', () => {
  const clip = parseBVH(simple());
  assert.equal(clip.joints.length, 3); assert.equal(clip.channelCount, 9); assert.equal(clip.frameCount, 1);
  assert.equal(clip.joints[1].parent, 0); assert.equal(clip.joints[1].channelOffset, 6); assert.equal(clip.joints[2].isEnd, true);
});
test('root translation and hierarchical rotation', () => {
  const pose = new PoseEvaluator(parseBVH(simple())).evaluate(0);
  near(pose[0].toArray(), [0, 10, 0]); near(pose[1].toArray(), [0, 11, 0]); near(pose[2].toArray(), [0, 12, 0]);
});
test('rotation channel order is not hardcoded as XYZ', () => {
  const first = new PoseEvaluator(parseBVH(simple(undefined, '0 0 0 90 90 0'))).evaluate(0);
  const second = new PoseEvaluator(parseBVH(simple('Xposition Yposition Zposition Xrotation Zrotation Yrotation', '0 0 0 90 90 0'))).evaluate(0);
  near(first[1].toArray(), [0, 1, 0]); near(second[1].toArray(), [0, 0, 1]);
});
test('interleaved translation follows declared transform order', () => {
  const clip = parseBVH(simple('Zrotation Xposition Yposition Zposition Xrotation Yrotation', '90 1 0 0 0 0'));
  near(new PoseEvaluator(clip).evaluate(0)[0].toArray(), [0, 1, 0]);
});
test('fractional pose uses shortest quaternion interpolation', () => {
  const text = simple(undefined, '0 0 0 350 0 0').replace('Frames: 1', 'Frames: 2') + '\n0 0 0 10 0 0 0 0 0';
  near(new PoseEvaluator(parseBVH(text)).evaluate(0, 1, 0.5)[1].toArray(), [1, 0, 0]);
});
test('tabs, CRLF, exponents, colon spacing', () => {
  const clip = parseBVH(simple().replace('Frames: 1', 'Frames : 1').replace('0 10 0 90', '0 1e1 0 9e1').replaceAll('\n', '\r\n'));
  assert.equal(clip.frames[1], 10);
});
test('invalid and truncated data reports a parser error', () => {
  for (const text of ['', 'not BVH', simple().replace('90 0 0 0 0 0', '90 0'), simple() + ' 999', simple().replace('Time: 0.0333333333333333', 'Time: 0'), simple().replace('0 10 0 90', 'NaN 10 0 90'), simple().replace('CHANNELS 6 Xposition', 'CHANNELS 6 Xrotation'), simple().replace('Frames: 1', 'Frames: 0')]) {
    assert.throws(() => parseBVH(text), BVHParseError);
  }
});
test('demo agrees with independent Three.js BVHLoader at representative frames', () => {
  const text = readFileSync(new URL('../public/samples/procedural-walk.bvh', import.meta.url), 'utf8');
  const clip = parseBVH(text); const own = new PoseEvaluator(clip);
  const reference = new BVHLoader().parse(text);
  const root = reference.skeleton.bones[0]; const mixer = new AnimationMixer(root); mixer.clipAction(reference.clip).play();
  for (const frame of [0, 57, 120, 238]) {
    mixer.setTime(frame * clip.frameTime); root.updateMatrixWorld(true);
    const positions = own.evaluate(frame);
    for (const joint of clip.joints.filter(j => !j.isEnd)) {
      const bone = reference.skeleton.bones.find(b => b.name === joint.name); assert.ok(bone);
      assert.ok(bone.getWorldPosition(new Vector3()).distanceTo(positions[joint.index]) < 0.001);
    }
  }
});
