import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { parseBVH } from '../src/bvh-parser.js';
import { PoseEvaluator } from '../src/pose.js';
import { BVHLoader } from 'three/addons/loaders/BVHLoader.js';
import { AnimationMixer, Vector3 } from 'three';
const directory = process.argv[2];
if (!directory) { console.error('Usage: npm run test:data -- <local-BVH-directory>'); process.exit(1); }
const results = [];
for (const name of (await readdir(directory)).filter(f => /\.bvh$/i.test(f)).sort()) {
  const path = resolve(directory, name); if (!(await stat(path)).isFile()) continue;
  const bytes = await readFile(path); const text = bytes.toString('utf8');
  const clip = parseBVH(text); const evaluator = new PoseEvaluator(clip); const reference = new BVHLoader().parse(text);
  const root = reference.skeleton.bones[0]; const mixer = new AnimationMixer(root); mixer.clipAction(reference.clip).play();
  let maxDifference = 0;
  for (const frame of [...new Set([0, Math.floor(clip.frameCount / 2), Math.max(0, clip.frameCount - 2)])]) {
    mixer.setTime(frame * clip.frameTime); root.updateMatrixWorld(true); const positions = evaluator.evaluate(frame);
    for (const joint of clip.joints) {
      if (!positions[joint.index].toArray().every(Number.isFinite)) throw new Error(`${name}: non-finite pose`);
      if (joint.isEnd) continue; const bone = reference.skeleton.bones.find(b => b.name === joint.name);
      if (!bone) throw new Error(`${name}: missing joint ${joint.name}`);
      maxDifference = Math.max(maxDifference, positions[joint.index].distanceTo(bone.getWorldPosition(new Vector3())));
    }
  }
  if (maxDifference > 0.1) throw new Error(`${name}: FK mismatch ${maxDifference}`);
  evaluator.evaluate(clip.frameCount - 1);
  results.push({ name, sha256: createHash('sha256').update(bytes).digest('hex'), frames: clip.frameCount, channels: clip.channelCount, joints: clip.joints.filter(j => !j.isEnd).length, duration: clip.duration, maxDifference });
}
if (!results.length) throw new Error('No BVH files found.');
console.log(JSON.stringify({ count: results.length, results }, null, 2));
