const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', Object.freeze({ openBVH: () => ipcRenderer.invoke('bvh:open') }));
