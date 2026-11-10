import { mkdirSync, writeFileSync } from 'node:fs';
// Procedural, original motion, not a redistribution of course data.
const skeleton = { name: 'Hips', offset: [0, 0, 0], children: [
  { name: 'LeftHip', offset: [10, -5, 0], children: [{ name: 'LeftKnee', offset: [0, -40, 0], children: [{ name: 'LeftAnkle', offset: [0, -40, 0], end: [0, -5, 12] }] }] },
  { name: 'RightHip', offset: [-10, -5, 0], children: [{ name: 'RightKnee', offset: [0, -40, 0], children: [{ name: 'RightAnkle', offset: [0, -40, 0], end: [0, -5, 12] }] }] },
  { name: 'Spine', offset: [0, 16, 0], children: [{ name: 'Chest', offset: [0, 20, 0], children: [
    { name: 'Neck', offset: [0, 15, 0], children: [{ name: 'Head', offset: [0, 12, 0], end: [0, 15, 0] }] },
    { name: 'LeftShoulder', offset: [18, 8, 0], children: [{ name: 'LeftElbow', offset: [25, 0, 0], children: [{ name: 'LeftWrist', offset: [23, 0, 0], end: [9, 0, 0] }] }] },
    { name: 'RightShoulder', offset: [-18, 8, 0], children: [{ name: 'RightElbow', offset: [-25, 0, 0], children: [{ name: 'RightWrist', offset: [-23, 0, 0], end: [-9, 0, 0] }] }] }
  ] }] }
] };
const nodes = [];
function hierarchy(j, depth = 0) {
  const pad = '  '.repeat(depth); nodes.push(j);
  let s = `${pad}${depth ? 'JOINT' : 'ROOT'} ${j.name}\n${pad}{\n${pad}  OFFSET ${j.offset.join(' ')}\n${pad}  CHANNELS ${depth ? '3' : '6 Xposition Yposition Zposition'} Zrotation Xrotation Yrotation\n`;
  for (const child of j.children ?? []) s += hierarchy(child, depth + 1);
  if (j.end) s += `${pad}  End Site\n${pad}  {\n${pad}    OFFSET ${j.end.join(' ')}\n${pad}  }\n`;
  return s + `${pad}}\n`;
}
let content = 'HIERARCHY\n' + hierarchy(skeleton) + 'MOTION\nFrames: 240\nFrame Time: 0.016666666666666666\n';
for (let f = 0; f < 240; f++) {
  const phase = f / 240 * Math.PI * 4; const values = [0, 94 + Math.sin(phase * 2) * 2, 0];
  for (const j of nodes) {
    let z = 0, x = 0, y = 0;
    if (j.name === 'Hips') y = Math.sin(phase) * 6;
    if (j.name === 'LeftHip') x = Math.sin(phase) * 28;
    if (j.name === 'RightHip') x = -Math.sin(phase) * 28;
    if (j.name === 'LeftKnee') x = Math.max(0, -Math.sin(phase)) * 42;
    if (j.name === 'RightKnee') x = Math.max(0, Math.sin(phase)) * 42;
    if (j.name === 'LeftShoulder') { z = -65; x = -Math.sin(phase) * 25; }
    if (j.name === 'RightShoulder') { z = 65; x = Math.sin(phase) * 25; }
    if (j.name.endsWith('Elbow')) x = -18;
    if (j.name === 'Chest') y = -Math.sin(phase) * 7;
    values.push(z, x, y);
  }
  content += values.map(v => v.toFixed(6)).join(' ') + '\n';
}
mkdirSync('public/samples', { recursive: true });
writeFileSync('public/samples/procedural-walk.bvh', content);
console.log('Generated original 240-frame procedural walk.');
