const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
} = require("electron");

const {
  clearRefreshToken,
  getRefreshToken,
  setRefreshToken,
} = require("./services/secure-token-store.cjs");
const {
  readWindowState,
  saveWindowState,
} = require("./services/window-state.cjs");
const { createOfflineApi } = require("./services/offline-api.cjs");

const developmentUrl = process.env.ELECTRON_RENDERER_URL;
const isDevelopment = Boolean(developmentUrl);
let rendererServer = null;

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(250);
    socket.once("connect", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(true);
    });
    socket.connect(port, "127.0.0.1");
  });
}

async function findAvailablePort(startPort = 38123) {
  for (let port = startPort; port < startPort + 50; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  return startPort;
}

function getStandaloneServerRoot() {
  const unpackedRoot = path.join(
    process.resourcesPath,
    "app.asar.unpacked",
    "client",
    ".next",
    "standalone",
  );
  const candidates = [
    path.join(unpackedRoot, "client"),
    unpackedRoot,
    path.join(__dirname, "..", "client", ".next", "standalone", "client"),
    path.join(__dirname, "..", "client", ".next", "standalone"),
  ];
  return candidates.find((candidate) =>
    fs.existsSync(path.join(candidate, "server.js")),
  );
}

function waitForRenderer(url, timeoutMs = 35_000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    function check() {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });
      request.setTimeout(750, () => request.destroy());
      request.on("error", () => {
        if (Date.now() >= deadline) {
          reject(new Error("The Next.js renderer did not start in time."));
        } else {
          setTimeout(check, 150);
        }
      });
    }

    check();
  });
}

async function startProductionRenderer() {
  const serverRoot = getStandaloneServerRoot();
  if (!serverRoot) {
    throw new Error("The packaged Next.js renderer was not found.");
  }

  const port = await findAvailablePort();
  const rendererUrl = `http://127.0.0.1:${port}`;
  rendererServer = spawn(process.execPath, [path.join(serverRoot, "server.js")], {
    cwd: serverRoot,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
      PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  let serverLogs = "";
  if (rendererServer.stdout) {
    rendererServer.stdout.on("data", (data) => {
      serverLogs += data.toString();
    });
  }
  if (rendererServer.stderr) {
    rendererServer.stderr.on("data", (data) => {
      serverLogs += data.toString();
    });
  }

  const serverFailure = new Promise((_, reject) => {
    rendererServer.once("error", (error) => {
      reject(new Error(`Failed to start Next.js renderer process: ${error.message}`));
    });
    rendererServer.once("exit", (code) => {
      const errorMsg = serverLogs.trim()
        ? `\n\nRenderer output:\n${serverLogs}`
        : "";
      reject(new Error(`The Next.js renderer stopped with code ${code}.${errorMsg}`));
    });
  });
  await Promise.race([waitForRenderer(rendererUrl), serverFailure]);
  return rendererUrl;
}

function isAllowedExternalUrl(value) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

function getIconPath() {
  const candidates = [
    path.join(__dirname, "../build/icon.png"),
    path.join(__dirname, "../client/public/logo.png"),
    path.join(process.resourcesPath, "icon.png"),
  ];
  const serverRoot = getStandaloneServerRoot();
  if (serverRoot) {
    candidates.unshift(path.join(serverRoot, "public", "logo.png"));
  }
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function createMainWindow(rendererEntry) {
  const state = readWindowState();
  const iconPath = getIconPath();
  const window = new BrowserWindow({
    ...state,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: "#f8fafc",
    ...(iconPath && fs.existsSync(iconPath) ? { icon: iconPath } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDevelopment,
    },
  });

  if (state.maximized) {
    window.maximize();
  }

  window.once("ready-to-show", () => window.show());
  window.on("close", () => saveWindowState(window));
  window.webContents.session.setPermissionCheckHandler(() => false);
  window.webContents.session.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );
  window.webContents.session.on("will-download", (event) => {
    event.preventDefault();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) {
      void shell.openExternal(url);
    }

    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    let isRendererNavigation = false;

    try {
      isRendererNavigation =
        new URL(url).origin === new URL(rendererEntry).origin;
    } catch {
      isRendererNavigation = false;
    }

    if (!isRendererNavigation) {
      event.preventDefault();
      if (isAllowedExternalUrl(url)) {
        void shell.openExternal(url);
      }
    }
  });

  void window.loadURL(rendererEntry);

  return window;
}

function registerIpcHandlers(offlineApi) {
  ipcMain.handle("app:get-info", () => ({
    version: app.getVersion(),
    platform: process.platform,
  }));
  ipcMain.handle("auth:get-refresh-token", () => getRefreshToken());
  ipcMain.handle("auth:set-refresh-token", (_event, token) =>
    setRefreshToken(token),
  );
  ipcMain.handle("auth:clear-refresh-token", () => clearRefreshToken());
  ipcMain.handle("offline:request", (_event, request) => offlineApi.request(request));
}

app.whenReady().then(async () => {
  const primaryDataPath = path.join(app.getPath("userData"), "offline-data.json");
  const appDataRoot = app.getPath("appData");
  const fallbackPaths = [
    path.join(appDataRoot, "SNP Typing", "offline-data.json"),
    path.join(appDataRoot, "snp-typing", "offline-data.json"),
    path.join(app.getPath("home"), ".snp-typing", "offline-data.json"),
  ].filter((candidate) => path.resolve(candidate) !== path.resolve(primaryDataPath));

  const offlineApi = createOfflineApi({
    dataPath: primaryDataPath,
    fallbackPaths,
    lessonsPath: path.join(__dirname, "resources", "lessons.json"),
  });
  registerIpcHandlers(offlineApi);
  let rendererEntry = developmentUrl;

  try {
    rendererEntry ??= await startProductionRenderer();
  } catch (error) {
    dialog.showErrorBox(
      "SNP Typing could not start",
      error instanceof Error ? error.message : String(error),
    );
    app.quit();
    return;
  }

  createMainWindow(rendererEntry);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow(rendererEntry);
    }
  });
});

app.on("before-quit", () => {
  rendererServer?.kill();
  rendererServer = null;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
