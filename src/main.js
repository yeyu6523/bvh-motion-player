import './style.css';
import { SkeletonViewer } from './viewer.js';
import { Playback } from './playback.js';

const $ = id => document.getElementById(id);
const playback = new Playback();
let viewer; let clip; let loading = false; let requestId = 0; let activeWorker; let scrubPlaying = false;
const buttons = ['play', 'previous', 'next', 'restart', 'timeline'];
const timeLabel = seconds => { const ms = Math.max(0, Math.round(seconds * 1000)); return `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`; };
function showError(message) { $('error').textContent = message; $('error').hidden = false; }
try { viewer = new SkeletonViewer($('viewport')); }
catch { showError('无法创建三维视图。请更新显卡驱动，并确认系统支持 WebGL 2。'); buttons.forEach(id => $(id).disabled = true); }

function sync() {
  $('play').querySelector('span').textContent = playback.playing ? '暂停' : '播放';
  $('play-icon').setAttribute('d', playback.playing ? 'M7 5h4v14H7Zm7 0h4v14h-4Z' : 'm8 5 11 7-11 7Z');
  $('play').setAttribute('aria-label', playback.playing ? '暂停' : '播放');
  $('status').textContent = loading ? '正在解析…' : !clip ? '准备就绪' : playback.playing ? '正在播放' : '已暂停';
  if (clip) {
    $('timeline').value = playback.frame;
    $('frame-label').textContent = `帧 ${playback.frame + 1} / ${clip.frameCount}`;
    $('current-time').textContent = timeLabel(Math.min(playback.time, playback.duration));
  }
}
function drawPose() { if (clip && viewer) viewer.updatePose(playback.sample()); sync(); }
function setBusy(value) { loading = value; buttons.forEach(id => $(id).disabled = value || !clip || !viewer); $('open').disabled = value; $('demo').disabled = value; $('empty-open').disabled = value; $('empty-demo').disabled = value; sync(); }
async function loadText(text, name, source) {
  if (!viewer) return;
  const id = ++requestId;
  activeWorker?.terminate(); setBusy(true); $('error').hidden = true; playback.pause();
  try {
    const parsed = await new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./parser.worker.js', import.meta.url), { type: 'module' }); activeWorker = worker;
      worker.onmessage = ({ data }) => { worker.terminate(); if (activeWorker === worker) activeWorker = null; data.error ? reject(new Error(data.error)) : resolve(data.clip); };
      worker.onerror = () => { worker.terminate(); activeWorker = null; reject(new Error('解析线程异常，请重试或选择较小的文件。')); };
      worker.postMessage({ id, text });
    });
    if (id !== requestId) return;
    viewer.setClip(parsed); clip = parsed; playback.load(clip);
    $('filename').textContent = name; $('source').textContent = source; $('joints').textContent = clip.joints.filter(j => !j.isEnd).length;
    $('channels').textContent = clip.channelCount; $('frames').textContent = clip.frameCount.toLocaleString(); $('fps').textContent = `${(1 / clip.frameTime).toFixed(2)} fps`; $('duration').textContent = `${clip.duration.toFixed(3)} s`;
    $('timeline').max = clip.frameCount - 1; $('timeline').value = 0; $('total-time').textContent = timeLabel(clip.duration); $('empty').hidden = true;
    drawPose();
  } catch (error) { if (id === requestId) showError(`载入失败：${error.message} 原有片段不会被无效文件替换。`); }
  finally { if (id === requestId) setBusy(false); }
}
async function loadFile(file) {
  if (!file || loading) return;
  if (!/\.bvh$/i.test(file.name)) { showError('请选择扩展名为 .bvh 的文件。'); return; }
  if (file.size > 64 * 1024 * 1024) { showError('文件超过 64 MiB，请使用较小的 BVH 文件。'); return; }
  try { await loadText(await file.text(), file.name, '本地文件 · 不上传到服务器'); } catch (error) { showError(`无法读取文件：${error.message}`); }
}
async function openFile() {
  if (loading || !viewer) return;
  if (window.desktop) {
    try { const result = await window.desktop.openBVH(); if (result?.error) showError(result.error); else if (result) await loadText(result.text, result.name, '本地文件 · 不上传到服务器'); } catch (error) { showError(`无法打开文件：${error.message}`); }
  } else $('file-input').click();
}
async function loadDemo() {
  if (loading) return;
  try { const response = await fetch(new URL('./samples/procedural-walk.bvh', document.baseURI)); if (!response.ok) throw new Error('示例文件不可用'); await loadText(await response.text(), 'procedural-walk.bvh', '自制程序化步行 · 240 帧 / 60 fps'); } catch (error) { showError(error.message); }
}
$('open').onclick = openFile; $('empty-open').onclick = openFile; $('demo').onclick = loadDemo; $('empty-demo').onclick = loadDemo;
$('file-input').onchange = async event => { await loadFile(event.target.files[0]); event.target.value = ''; };
$('play').onclick = () => { playback.toggle(); sync(); };
$('restart').onclick = () => { playback.pause(); playback.seek(0); drawPose(); };
$('previous').onclick = () => { playback.step(-1); drawPose(); }; $('next').onclick = () => { playback.step(1); drawPose(); };
$('timeline').addEventListener('pointerdown', () => { scrubPlaying = playback.playing; playback.pause(); sync(); });
$('timeline').oninput = event => { playback.seek(Number(event.target.value) * playback.frameTime); drawPose(); };
window.addEventListener('pointerup', () => { if (scrubPlaying) { playback.play(); scrubPlaying = false; sync(); } });
$('speed').onchange = event => playback.setSpeed(Number(event.target.value));
$('loop').onchange = event => { playback.loop = event.target.checked; };
$('grid').onchange = event => { if (viewer) { viewer.grid.visible = event.target.checked; viewer.axes.visible = event.target.checked; } };
$('markers').onchange = event => { if (viewer) { viewer.markersVisible = event.target.checked; if (viewer.spheres) viewer.spheres.visible = event.target.checked; } };
$('follow').onchange = event => { if (viewer) viewer.follow = event.target.checked; };
$('up-axis').onchange = event => { viewer?.setUpAxis(event.target.value, playback.sample()); };
$('reset-view').onclick = () => viewer?.fitView();
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') { event.preventDefault(); openFile(); return; }
  if (event.target.closest('input, select, button, textarea') || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key.toLowerCase() === 'r') viewer?.fitView();
  if (!clip || loading) return;
  if (event.code === 'Space') { event.preventDefault(); playback.toggle(); sync(); }
  if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') { event.preventDefault(); playback.step(event.code === 'ArrowRight' ? 1 : -1); drawPose(); }
});
let dragDepth = 0;
window.addEventListener('dragover', event => event.preventDefault());
window.addEventListener('dragenter', event => { if ([...event.dataTransfer.types].includes('Files')) { event.preventDefault(); dragDepth++; $('drop-overlay').hidden = false; } });
window.addEventListener('dragleave', event => { event.preventDefault(); dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('drop-overlay').hidden = true; });
window.addEventListener('drop', event => { event.preventDefault(); dragDepth = 0; $('drop-overlay').hidden = true; if (!loading) loadFile(event.dataTransfer.files[0]); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { playback.pause(); sync(); } });
let previous = performance.now();
function animate(now) {
  const delta = (now - previous) / 1000; previous = now;
  if (clip && playback.playing) { playback.advance(delta); viewer.updatePose(playback.sample()); sync(); }
  viewer?.render(); requestAnimationFrame(animate);
}
sync(); requestAnimationFrame(animate);
