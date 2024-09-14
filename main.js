const {
  app,
  screen,
  shell,
  BrowserWindow,
  BrowserView,
  ipcMain,
  dialog,
  clipboard,
  session,
} = require("electron");
const Store = require("electron-store");
const windowStateKeeper = require("electron-window-state");
const fs = require("fs");
const path = require("path");
const allAI = require("allai");
const is_mac = process.platform.startsWith("darwin");
const { autoUpdater } = require("electron-updater");
const { version } = require("./package.json");
const { exit } = require("process");
var mainWindow;
var root_url;
var wins = {};
var pinned = {};
var launched;
const PORT = 9527;
const store = new Store();
const allai = new allAI({
  port: PORT,
  agent: "electron",
  store,
});
const titleBarOverlay = (theme) => {
  if (is_mac) {
    return false;
  } else {
    if (theme === "dark") {
      return {
        color: "#111",
        symbolColor: "white",
      };
    } else if (theme === "default") {
      if (launched) {
        return {
          color: "#F5F4FA",
          symbolColor: "black",
        };
      } else {
        return {
          //          color: "white",
          //          symbolColor: "black",
          //          color: "royalblue",
          //          symbolColor: "white"
          color: "#191919",
          symbolColor: "white",
        };
      }
    }
    return {
      color: "white",
      symbolColor: "black",
    };
  }
};
const attach = (event, webContents) => {
  let wc = webContents;
  webContents.on("will-navigate", (event, url) => {
    if (!webContents.opened) {
      // The first time this view is being used, set the "opened" to true, and don't do anything
      // The next time the view navigates, "the "opened" is already true, so trigger the URL open logic
      //  - if the new URL has the same host as the app's url, open in app
      //  - if it's a remote host, open in external browser
      webContents.opened = true;
    } else {
      let host = new URL(url).host;
      let localhost = new URL(root_url).host;
      if (host !== localhost) {
        event.preventDefault();
        shell.openExternal(url);
      }
    }
  });
  //  webContents.on("did-create-window", (parentWindow, details) => {
  //    const view = new BrowserView();
  //    parentWindow.setBrowserView(view);
  //    view.setBounds({ x: 0, y: 30, width: parentWindow.getContentBounds().width, height: parentWindow.getContentBounds().height - 30 });
  //    view.setAutoResize({ width: true, height: true });
  //    view.webContents.loadURL(details.url);
  //  })
  webContents.on("did-navigate", (event, url) => {
    let win = webContents.getOwnerBrowserWindow();
    if (
      win &&
      win.setTitleBarOverlay &&
      typeof win.setTitleBarOverlay === "function"
    ) {
      const overlay = titleBarOverlay("default");
      win.setTitleBarOverlay(overlay);
    }
    launched = true;
  });
  webContents.setWindowOpenHandler((config) => {
    let url = config.url;
    let features = config.features;
    let params = new URLSearchParams(features.split(",").join("&"));
    let win = wc.getOwnerBrowserWindow();
    let [width, height] = win.getSize();
    let [x, y] = win.getPosition();

    let origin = new URL(url).origin;
    console.log("config", { config, root_url, origin });

    // if the origin is the same as the pinokio host,
    // always open in new window

    // if not, check the features
    // if features exists and it's app or self, open in pinokio
    // otherwise if it's file,

    if (origin === root_url) {
      return {
        action: "allow",
        outlivesOpener: true,
        overrideBrowserWindowOptions: {
          width: params.get("width") ? parseInt(params.get("width")) : width,
          height: params.get("height")
            ? parseInt(params.get("height"))
            : height,
          x: x + 30,
          y: y + 30,

          parent: null,
          titleBarStyle: "hidden",
          titleBarOverlay: titleBarOverlay("default"),
        },
      };
    } else {
      if (features) {
        if (features.startsWith("app") || features.startsWith("self")) {
          return {
            action: "allow",
            outlivesOpener: true,
            overrideBrowserWindowOptions: {
              width: params.get("width")
                ? parseInt(params.get("width"))
                : width,
              height: params.get("height")
                ? parseInt(params.get("height"))
                : height,
              x: x + 30,
              y: y + 30,

              parent: null,
              titleBarStyle: "hidden",
              titleBarOverlay: titleBarOverlay("default"),
            },
          };
        } else if (features.startsWith("file")) {
          let u = features.replace("file://", "");
          shell.showItemInFolder(u);
          return { action: "deny" };
        } else {
          shell.openExternal(url);
          return { action: "deny" };
        }
      } else {
        if (features.startsWith("file")) {
          let u = features.replace("file://", "");
          shell.showItemInFolder(u);
          return { action: "deny" };
        } else {
          shell.openExternal(url);
          return { action: "deny" };
        }
      }
    }

    //    if (origin === root_url) {
    //      // if the origin is the same as pinokio, open in pinokio
    //      // otherwise open in external browser
    //      if (features) {
    //        if (features.startsWith("app") || features.startsWith("self")) {
    //          return {
    //            action: 'allow',
    //            outlivesOpener: true,
    //            overrideBrowserWindowOptions: {
    //              width: (params.get("width") ? parseInt(params.get("width")) : width),
    //              height: (params.get("height") ? parseInt(params.get("height")) : height),
    //              x: x + 30,
    //              y: y + 30,
    //
    //              parent: null,
    //              titleBarStyle : "hidden",
    //              titleBarOverlay : titleBarOverlay("default"),
    //            }
    //          }
    //        } else if (features.startsWith("file")) {
    //          let u = features.replace("file://", "")
    //          shell.showItemInFolder(u)
    //          return { action: 'deny' };
    //        } else {
    //          return { action: 'deny' };
    //        }
    //      } else {
    //        if (features.startsWith("file")) {
    //          let u = features.replace("file://", "")
    //          shell.showItemInFolder(u)
    //          return { action: 'deny' };
    //        } else {
    //          shell.openExternal(url);
    //          return { action: 'deny' };
    //        }
    //      }
    //    } else {
    //      if (features.startsWith("file")) {
    //        let u = features.replace("file://", "")
    //        shell.showItemInFolder(u)
    //        return { action: 'deny' };
    //      } else {
    //        shell.openExternal(url);
    //        return { action: 'deny' };
    //      }
    //    }
  });
};
const getWinState = (url, options) => {
  let filename;
  try {
    let pathname = new URL(url).pathname.slice(1);
    filename = pathname.slice("/").join("-");
  } catch {
    filename = "index.json";
  }
  let state = windowStateKeeper({
    file: filename,
    ...options,
  });
  return state;
};
const createWindow = (port) => {
  let mainWindowState = windowStateKeeper({
    //file: "index.json",
    defaultWidth: 800, 
    defaultHeight: 800
  });
  mainWindow = new BrowserWindow({
    //titleBarStyle: "hidden",
    titleBarOverlay: titleBarOverlay("default"),
    width: 1800,
    height: 1200,
    minWidth: 800,
    minHeight: 800,
    transparent: true,//透明背景
    frame: false,//无边框
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      nativeWindowOpen: true,
      enableBlinkFeatures: "InsecureContentAllowed",
      //preload: path.join(__dirname, "preload.js"),
    },
  });
  session.defaultSession.clearCache();
  // debug
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  process.env.HF_ENDPOINT = "https://hf-mirror.com";
  process.env.PIP_INDEX_URL = "http://mirrors.aliyun.com/pypi/simple/";
  // process.env.HTTP_PROXY = allaid.proxy;
  // process.env.HTTPS_PROXY = allaid.proxy;
  // console.log("代理成功，并且全局");

  ipcMain.on("get-app-version", (event) => {
    event.reply("app-version", app.getVersion());
  });
  ipcMain.on("minimize-window", () => {
    mainWindow.minimize();
  });
  ipcMain.on("maximize-window", () => {
    setTimeout(() => {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }, 100); // 延迟100毫秒
  });
  ipcMain.on("close-window", () => {
    mainWindow.close();
  });


  root_url = `http://localhost:${port}`;
  mainWindow.loadURL(root_url);
  mainWindowState.manage(mainWindow);
};
const checkUpdate = () => {
  //检测更新
  autoUpdater.checkForUpdates();

  //监听'error'事件
  autoUpdater.on("error", (err) => {
    console.log(err);
  });

  //监听'update-available'事件，发现有新版本时触发
  autoUpdater.on("update-available", () => {
    console.log("found new version");
  });

  //默认会自动下载新版本，如果不想自动下载，设置autoUpdater.autoDownload = false

  //监听'update-downloaded'事件，新版本下载完成时触发
  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox({
        type: "info",
        title: "应用更新",
        message: "发现新版本，是否更新？",
        buttons: ["是", "否"],
      })
      .then((buttonIndex) => {
        if (buttonIndex.response == 0) {
          //选择是，则退出程序，安装新版本
          autoUpdater.quitAndInstall();
        }
      });
  });
  // 监听 quitAndInstall 完成事件
  autoUpdater.on("quit-and-install", () => {
    // 退出程序
    app.quit();
  });
};
//check update
checkUpdate();

//判断开发模式还是生产
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("allai", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("allai");
}

//确保一个实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  //外链打开时候可以调用
  app.on("second-instance", (event, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    let url = argv.pop();
    //let u = new URL(url).search
    let u = url.replace(/allai:[\/]+/, "");
    if (BrowserWindow.getAllWindows().length === 0 || !mainWindow)
      createWindow(PORT);
    mainWindow.focus();
    mainWindow.loadURL(`${root_url}/allai/${u}`);
  });
  // Create mainWindow, load the rest of the app, etc...
  app.whenReady().then(async () => {
    const WIDTH = 230;
    const HEIGHT = 230;
    let bounds = screen.getPrimaryDisplay().bounds;
    let x = Math.ceil(bounds.x + (bounds.width - WIDTH) / 2);
    let y = Math.ceil(bounds.y + (bounds.height - HEIGHT) / 2);

    // splash window
    const splash = new BrowserWindow({
      width: WIDTH,
      height: HEIGHT,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      x,
      y,
      show: false,
    });

    splash.type = "splash";
    splash.loadFile("splash.html");
    splash.once("ready-to-show", () => {
      splash.show();
    });

    await allai.start((debug = true));
    splash.hide();
    //return;
    app.on("web-contents-created", attach);
    //针对mac系统
    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(PORT);
    });
    app.on("window-all-closed", function () {
      if (process.platform !== "darwin") app.quit();
    });
    //自定义标题栏
    app.on("browser-window-created", (event, win) => {
      if (win.type !== "splash") {
        if (win.setTitleBarOverlay) {
          const overlay = titleBarOverlay("default");
          try {
            win.setTitleBarOverlay(overlay);
          } catch (e) {
            console.log("ERROR", e);
          }
        }
      }
    });
    app.on("open-url", (event, url) => {
      console.log("url", url);
      let u = url.replace(/allai:[\/]+/, "");
      //    let u = new URL(url).search
      //    console.log("u", u)
      if (BrowserWindow.getAllWindows().length === 0 || !mainWindow)
        createWindow(PORT);
      mainWindow.focus();
      mainWindow.loadURL(`${root_url}/allai/${u}`);
    });

    let all = BrowserWindow.getAllWindows();
    for (win of all) {
      try {
        if (win.setTitleBarOverlay) {
          const overlay = titleBarOverlay("default");
          win.setTitleBarOverlay(overlay);
        }
      } catch (e) {
        console.log("E2", e);
      }
    }
    createWindow(PORT);
    splash.close();
  });
}
