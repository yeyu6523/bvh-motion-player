const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
let win;
const smoke = process.argv.includes('--smoke-test');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function readBVH(filePath) {
  if (path.extname(filePath).toLowerCase() !== '.bvh') return { error: '请选择 .bvh 文件。' };
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || stat.size > 64 * 1024 * 1024) return { error: '文件无效或超过 64 MiB。' };
    return { name: path.basename(filePath), text: await fs.readFile(filePath, 'utf8') };
  } catch (error) { return { error: `无法读取文件：${error.message}` }; }
}

async function createWindow() {
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({ width: 1280, height: 850, minWidth: 900, minHeight: 680, title: 'BVH Motion Player', backgroundColor: '#f4f3ed', show: true, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, backgroundThrottling: !smoke } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  win.webContents.on('render-process-gone', (_event, details) => { console.error('Renderer exited:', details.reason); if (smoke) app.exit(1); });
  ipcMain.handle('bvh:open', async event => {
    if (event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame) throw new Error('Invalid sender');
    const result = await dialog.showOpenDialog(win, { title: '打开 BVH 运动文件', properties: ['openFile'], filters: [{ name: 'BVH 运动捕捉文件', extensions: ['bvh'] }] });
    return result.canceled ? null : readBVH(result.filePaths[0]);
  });
  const page = path.join(__dirname, '../dist/index.html');
  const timeout = smoke ? setTimeout(() => { console.error('Desktop smoke test timed out'); app.exit(1); }, 60000) : null;
  await win.loadFile(page);
  if (smoke) {
    try {
      const { runSmoke } = require('./smoke.cjs');
      await runSmoke(win, { delay, readBVH }); clearTimeout(timeout); app.exit(0);
    } catch (error) { console.error(error); clearTimeout(timeout); app.exit(1); }
  }
}
app.whenReady().then(createWindow).catch(error => { console.error(error); app.exit(1); });
app.on('window-all-closed', () => app.quit());
