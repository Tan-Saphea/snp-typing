const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld(
  "snpDesktop",
  Object.freeze({
    app: Object.freeze({
      getInfo: () => ipcRenderer.invoke("app:get-info"),
    }),
    auth: Object.freeze({
      getRefreshToken: () => ipcRenderer.invoke("auth:get-refresh-token"),
      setRefreshToken: (token) =>
        ipcRenderer.invoke("auth:set-refresh-token", token),
      clearRefreshToken: () =>
        ipcRenderer.invoke("auth:clear-refresh-token"),
    }),
  }),
);
