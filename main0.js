// main.js
const { app, BrowserWindow } = require("electron");
const path = require("path");


function resolvePath(...segments) {
  // If running from a packaged app (dist build)
  if (app.isPackaged) {
    return path.join(process.resourcesPath, ...segments);
  }
  // If running in dev mode
  return path.join(__dirname, ...segments);
}

let mainWindow;
let splash;
let openFilePath = null;

// 🟢 Handle file open (macOS)
app.on("open-file", (event, filePath) => {
  event.preventDefault();
  openFilePath = filePath;
  if (mainWindow) {
    mainWindow.webContents.send("open-authbook", filePath);
  }
});

// 🟢 Ensure single instance (Windows/Linux)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, argv) => {
    const filePath = argv.find((arg) => arg.endsWith(".authbook"));
    if (filePath && mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.webContents.send("open-authbook", filePath);
    }
  });

  function createWindow() {
    splash = new BrowserWindow({
      width: 400,
      height: 300,
      frame: false,
      transparent: false,
      alwaysOnTop: true,
      resizable: false,
      icon: resolvePath("public", "authno.ico"),
    });

    splash.loadFile(resolvePath("public", "splash.html"));

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      icon: resolvePath("public", "authno.ico"),
      backgroundColor: "#000000",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: resolvePath("Preload.js"), // safe — after handlers registered
      },
    });

    if (process.env.NODE_ENV === "development") {
      mainWindow.loadURL("http://localhost:3000");
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadFile(resolvePath("build", "index.html"));
    }

    mainWindow.once("ready-to-show", () => {
      setTimeout(() => {
        if (splash && !splash.isDestroyed()) splash.close();
        mainWindow.show();

        if (openFilePath && openFilePath.endsWith(".authbook")) {
          mainWindow.webContents.send("open-authbook", openFilePath);
        }
      }, 1500);
    });

    mainWindow.on("closed", () => (mainWindow = null));
  }

  // ✅ Properly wait for app ready, THEN load fileManager, THEN create window
  app.whenReady().then(() => {
    console.log("🟢 App ready — loading fileManager...");
    require("./fileManager"); // register handlers now
    console.log("✅ FileManager registered handlers.");
    createWindow();
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
