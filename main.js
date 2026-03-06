// main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;
let splash;
let openFilePath = null;

// 🟢 Handle file open (macOS — fired before app is ready)
app.on("open-file", (event, filePath) => {
  event.preventDefault();
  openFilePath = filePath;
  if (mainWindow) {
    sendParsedFile(mainWindow, filePath);
  }
});

// ── Read + parse a .authbook file and send it to the renderer ──
function sendParsedFile(win, filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const content = JSON.parse(raw);
    win.webContents.send("open-authbook", { ...content, filePath });
  } catch (err) {
    console.error("❌ Failed to read authbook:", err);
  }
}

// ── Renderer calls this on mount to pick up any file the app was launched with ──
ipcMain.handle("get-pending-file", () => {
  if (!openFilePath) return null;
  try {
    const raw = fs.readFileSync(openFilePath, "utf-8");
    const content = JSON.parse(raw);
    const result = { ...content, filePath: openFilePath };
    openFilePath = null; // clear so it isn't delivered twice
    return result;
  } catch (err) {
    console.error("❌ get-pending-file failed:", err);
    return null;
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
      sendParsedFile(mainWindow, filePath);
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
      icon: path.join(__dirname, "public", "authno.ico"),
    });

    splash.loadFile(path.join(__dirname, "public", "splash.html"));

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      icon: path.join(__dirname, "public", "authno.ico"),
      backgroundColor: "#000000",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "Preload.js"), // safe — after handlers registered
      },
    });

    if (process.env.NODE_ENV === "development") {
      mainWindow.loadURL("http://localhost:3000");
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadFile(path.join(__dirname, "build", "index.html"));
    }

    mainWindow.once("ready-to-show", () => {
      setTimeout(() => {
        if (splash && !splash.isDestroyed()) splash.close();
        mainWindow.show();

        // openFilePath is delivered via get-pending-file IPC on renderer mount
        // No need to send here — avoids double delivery
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
