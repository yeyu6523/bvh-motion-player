// Runs against the real packaged renderer. No test-only global state is exposed to users.
const fs = require('node:fs/promises');
const path = require('node:path');
exports.runSmoke = async (win, { delay }) => {
  const wc = win.webContents;
  const output = path.resolve(process.env.BVH_SMOKE_OUTPUT || 'output/desktop'); await fs.mkdir(output, { recursive: true });
  const checks = []; const errors = [];
  wc.on('console-message', event => { if (event.level === 'error') errors.push(event.message); });
  const js = source => wc.executeJavaScript(source, true);
  const assert = (value, label) => { if (!value) throw new Error(label); checks.push(label); console.log('PASS', label); };
  async function waitFor(expression) { for (let i = 0; i < 120; i++) { if (await js(expression)) return; await delay(100); } throw new Error(`Timed out: ${expression}`); }
  const click = id => js(`document.getElementById(${JSON.stringify(id)}).click()`);
  const frame = () => js(`Number(document.getElementById('timeline').value)`);
  const select = (id, value) => js(`{ const e = document.getElementById(${JSON.stringify(id)}); e.value=${JSON.stringify(value)}; e.dispatchEvent(new Event('change',{bubbles:true})); }`);
  win.show(); win.focus();
  await waitFor(`!!document.querySelector('#viewport canvas') && !document.hidden`);
  assert(await js(`!document.getElementById('empty').hidden && document.getElementById('play').disabled`), 'empty state and disabled transport');
  await click('demo'); await waitFor(`document.getElementById('frames').textContent === '240' && !document.getElementById('play').disabled`);
  assert(await js(`document.getElementById('error').hidden`), 'offline demo load via file protocol and worker');
  await click('play'); await delay(450); await click('play'); const paused = await frame();
  assert(paused > 3, 'play advances skeleton timeline'); await delay(250); assert(await frame() === paused, 'pause holds frame');
  async function advanceAt(speed) { await click('restart'); await select('speed', speed); await click('play'); await delay(420); await click('play'); return frame(); }
  const slow = await advanceAt('0.5'); const fast = await advanceAt('2'); assert(fast > slow * 2.3 && slow > 0, `speed ratio: 0.5x=${slow} frames, 2x=${fast} frames`);
  await click('restart'); await click('next'); assert(await frame() === 1, 'next frame'); await click('previous'); assert(await frame() === 0, 'previous frame');
  await delay(120);
  const crop = await js(`{const r=document.getElementById('viewport').getBoundingClientRect();({x:Math.round(r.x+r.width*.25),y:Math.round(r.y+r.height*.2),width:Math.round(r.width*.5),height:Math.round(r.height*.65)})}`);
  const firstPosePixels = (await wc.capturePage(crop)).toBitmap();
  await js(`{const t=document.getElementById('timeline');t.value='40';t.dispatchEvent(new Event('input'));}`); await delay(120);
  const laterPosePixels = (await wc.capturePage(crop)).toBitmap();
  assert(!firstPosePixels.equals(laterPosePixels), '3D viewport pose pixels change between frames (not just text)');
  await click('restart');
  await js(`document.getElementById('viewport').focus()`);
  wc.sendInputEvent({type:'keyDown',keyCode:'Space'}); wc.sendInputEvent({type:'keyUp',keyCode:'Space'}); await delay(160);
  wc.sendInputEvent({type:'keyDown',keyCode:'Space'}); wc.sendInputEvent({type:'keyUp',keyCode:'Space'});
  assert(await frame() > 0 && await js(`document.getElementById('status').textContent === '已暂停'`), 'Space keyboard shortcut plays and pauses');
  await js(`{const t=document.getElementById('timeline');t.value='120';t.dispatchEvent(new Event('input',{bubbles:true}));}`); assert(await frame() === 120, 'seek to exact frame');
  await select('up-axis', 'Z'); await select('up-axis', 'Y'); await click('reset-view');
  await click('grid'); await click('grid'); await click('markers'); await click('markers'); await click('follow'); await click('follow'); checks.push('axis, camera and display toggles');
  await click('loop'); await select('speed', '4');
  await js(`{const t=document.getElementById('timeline');t.value='238';t.dispatchEvent(new Event('input'));}`); await click('play'); await delay(250);
  assert(await js(`document.getElementById('status').textContent === '已暂停' && document.getElementById('timeline').value === '239'`), 'non-loop stops at last frame');
  await click('loop'); await click('play'); await delay(250); await click('play'); assert(await frame() < 239, 'end replay and looping');
  async function inputFile(name, text, kind = 'input') {
    await js(`{const dt=new DataTransfer();dt.items.add(new File([${JSON.stringify(text)}],${JSON.stringify(name)},{type:'text/plain'}));${kind === 'drop' ? `window.dispatchEvent(new DragEvent('drop',{dataTransfer:dt,bubbles:true,cancelable:true}));` : `const e=document.getElementById('file-input');e.files=dt.files;e.dispatchEvent(new Event('change',{bubbles:true}));`}}`);
  }
  await inputFile('invalid.bvh', 'not a BVH'); await waitFor(`!document.getElementById('error').hidden && !document.getElementById('play').disabled`);
  assert(await js(`document.getElementById('filename').textContent === 'procedural-walk.bvh'`), 'invalid file preserves loaded clip');
  await inputFile('wrong.txt', 'text'); assert(await js(`document.getElementById('error').textContent.includes('.bvh')`), 'file extension validation');
  if (process.env.BVH_TEST_DATA) {
    const files = (await fs.readdir(process.env.BVH_TEST_DATA)).filter(n => /\.bvh$/i.test(n)).sort();
    for (const name of files) {
      const text = await fs.readFile(path.join(process.env.BVH_TEST_DATA, name), 'utf8');
      await inputFile(name, text, 'drop'); await waitFor(`document.getElementById('filename').textContent === ${JSON.stringify(name)} && !document.getElementById('play').disabled`);
      assert(await js(`document.getElementById('error').hidden`), `local drop: ${name}`);
      await click('play'); await delay(80); await click('play');
      if (name === '008b.bvh') { await click('restart'); await js(`{const t=document.getElementById('timeline');t.value='80';t.dispatchEvent(new Event('input'));}`); await click('reset-view'); await delay(150); await capture('sample-008b.png'); }
    }
  }
  async function capture(name) { const screenshot = await wc.capturePage(); await fs.writeFile(path.join(output, name), screenshot.toPNG()); }
  await click('demo'); await waitFor(`document.getElementById('filename').textContent === 'procedural-walk.bvh' && !document.getElementById('play').disabled`); await select('speed','1');
  await js(`{const t=document.getElementById('timeline');t.value='40';t.dispatchEvent(new Event('input'));}`); await click('reset-view'); await delay(200); await capture('desktop.png');
  win.setSize(960, 720); await delay(200); await capture('compact.png');
  assert(await js(`document.documentElement.scrollWidth <= innerWidth`), 'compact layout has no horizontal overflow');
  assert(await js(`['play','speed','timeline'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight && r.right<=innerWidth;})`), 'compact play, speed and timeline are fully inside viewport');
  assert(errors.length === 0, `renderer error count: ${errors.length}`);
  const report = { platform: process.platform, electron: process.versions.electron, checks, rendererErrors: errors, finishedAt: new Date().toISOString() };
  await fs.writeFile(path.join(output, 'smoke-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
};
