/** Original BVH parser. Offsets and channels remain in the source coordinate system. */
export class BVHParseError extends Error {
  constructor(message) { super(message); this.name = 'BVHParseError'; }
}

const numberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
const channelPattern = /^[XYZ](?:position|rotation)$/;

export function parseBVH(text) {
  if (typeof text !== 'string' || !text.trim()) throw new BVHParseError('文件为空，请选择有效的 BVH 文件。');
  if (text.length > 64 * 1024 * 1024) throw new BVHParseError('文件超过 64 MiB，请使用较小的 BVH 文件。');
  // Lazy tokenizer avoids allocating a second full array of all motion tokens.
  const regex = /\s*([{}:]|[^\s{}:]+)/gy;
  let cursor = 0;
  let buffered;
  function next() {
    if (buffered !== undefined) { const v = buffered; buffered = undefined; return v; }
    regex.lastIndex = cursor;
    const match = regex.exec(text);
    if (!match) { cursor = text.length; return null; }
    cursor = regex.lastIndex;
    return match[1];
  }
  function peek() { if (buffered === undefined) buffered = next(); return buffered; }
  function expect(wanted) { const actual = next(); if (actual !== wanted) throw new BVHParseError(`预期 ${wanted}，实际为 ${actual ?? '文件结尾'}。`); }
  function number(label) {
    const token = next();
    const value = Number(token);
    if (token === null || !numberPattern.test(token) || !Number.isFinite(value) || Math.abs(value) > 1e15) {
      throw new BVHParseError(`${label}不是有效的有限数值：${token ?? '文件结尾'}。`);
    }
    return value;
  }
  function integer(label, min, max) { const value = number(label); if (!Number.isInteger(value) || value < min || value > max) throw new BVHParseError(`${label}必须是 ${min} 到 ${max} 的整数。`); return value; }

  const joints = [];
  let channelCount = 0;
  function joint(kind, parent, depth) {
    if (depth > 256 || joints.length >= 4096) throw new BVHParseError('骨架层级过深或关节过多。');
    const isEnd = kind === 'End';
    let name;
    if (isEnd) { expect('Site'); name = `${joints[parent].name}_EndSite_${joints.length}`; }
    else { name = next(); if (!name || /[{}:]/.test(name)) throw new BVHParseError('缺少有效的关节名称。'); }
    expect('{'); expect('OFFSET');
    const offset = [number('OFFSET X'), number('OFFSET Y'), number('OFFSET Z')];
    const node = { index: joints.length, name, parent, offset, channels: [], channelOffset: channelCount, children: [], isEnd };
    joints.push(node);
    if (parent >= 0) joints[parent].children.push(node.index);
    if (!isEnd) {
      expect('CHANNELS');
      const count = integer('CHANNELS 数量', 0, 6);
      for (let i = 0; i < count; i++) {
        const channel = next();
        if (!channel || !channelPattern.test(channel) || node.channels.includes(channel)) throw new BVHParseError(`关节 ${name} 的通道无效或重复：${channel}。`);
        node.channels.push(channel);
      }
      channelCount += count;
      while (peek() === 'JOINT' || peek() === 'End') joint(next(), node.index, depth + 1);
    }
    expect('}');
    return node;
  }

  expect('HIERARCHY'); expect('ROOT'); joint('ROOT', -1, 0);
  if (peek() === 'ROOT') throw new BVHParseError('本演示支持单个 ROOT 的 BVH，请先拆分多骨架文件。');
  if (!channelCount) throw new BVHParseError('骨架未定义任何运动通道。');
  expect('MOTION'); expect('Frames'); expect(':');
  const frameCount = integer('Frames', 1, 2_000_000);
  expect('Frame'); expect('Time'); expect(':');
  const frameTime = number('Frame Time');
  if (frameTime <= 0) throw new BVHParseError('Frame Time 必须大于 0。');
  const valueCount = frameCount * channelCount;
  if (valueCount > 16_000_000) throw new BVHParseError('运动数据超过 1600 万个通道值，请使用较短的片段。');
  const frames = new Float64Array(valueCount);
  for (let i = 0; i < valueCount; i++) frames[i] = number(`第 ${Math.floor(i / channelCount) + 1} 帧通道 ${i % channelCount + 1}`);
  if (next() !== null) throw new BVHParseError('运动数据多于 Frames 与 CHANNELS 声明的数量。');
  return { joints, channelCount, frameCount, frameTime, frames, duration: frameCount * frameTime };
}
