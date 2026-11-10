import { parseBVH } from './bvh-parser.js';
self.onmessage = ({ data }) => {
  try {
    const clip = parseBVH(data.text.replace(/^\uFEFF/, ''));
    self.postMessage({ id: data.id, clip }, [clip.frames.buffer]);
  } catch (error) { self.postMessage({ id: data.id, error: error.message }); }
};
