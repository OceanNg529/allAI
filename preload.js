// 在 preload.js 中
const { ipcRenderer } = require("electron");

window.elecAPI = {
  toInstall: () => ipcRenderer.invoke("install"),
  onUpdate: (callback) => ipcRenderer.on("update", callback),
  onDownloaded: (callback) => ipcRenderer.on("downloaded", callback),
};
