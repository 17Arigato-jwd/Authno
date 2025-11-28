// fileManager.js
const { ipcMain, dialog, app } = require("electron");
const fs = require("fs");
const path = require("path");

console.log("✅ FileManager loaded — waiting for app readiness...");

// Ensure app is ready before registering handlers
if (!app.isReady()) {
  app.whenReady().then(registerHandlers);
} else {
  registerHandlers();
}

function registerHandlers() {
  console.log("🟢 Registering IPC handlers...");

  // 📂 Save existing book
  ipcMain.handle("save-book", async (event, { filePath, content }) => {
    try {
      if (!filePath) throw new Error("No file path provided");
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8");
      return { success: true };
    } catch (error) {
      console.error("❌ Save failed:", error);
      return { success: false, error: error.message };
    }
  });

  // 💾 Save As new file
  ipcMain.handle("save-as-book", async (event, { content }) => {
    const { filePath } = await dialog.showSaveDialog({
      title: "Save Book As...",
      defaultPath: "Untitled.authbook",
      filters: [{ name: "AuthNo Book Files", extensions: ["authbook"] }],
    });

    if (!filePath) return { cancelled: true };

    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8");
    return { success: true, filePath };
  });

  // 📖 Open existing book
  ipcMain.handle("open-book", async () => {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: "Open Book",
      filters: [{ name: "AuthNo Book Files", extensions: ["authbook"] }],
      properties: ["openFile"],
    });
    if (canceled || filePaths.length === 0) return null;

    const filePath = filePaths[0];
    const raw = fs.readFileSync(filePath, "utf-8");
    const content = JSON.parse(raw);

    return { ...content, filePath };
  });

  // 🧩 Restore previously open books safely
  ipcMain.handle("restore-books", async (event, books) => {
    const validBooks = [];
    const missingBooks = [];

    for (const book of books) {
      try {
        if (book.filePath && fs.existsSync(book.filePath)) {
          const raw = fs.readFileSync(book.filePath, "utf-8");
          const content = JSON.parse(raw);
          validBooks.push({ ...content, filePath: book.filePath });
        } else {
          missingBooks.push(`⚠️ Book "${book.title}" was not found on your system.`);
        }
      } catch (err) {
        missingBooks.push(`⚠️ Could not open "${book.title}" (corrupted or unreadable).`);
      }
    }

    return { validBooks, missingBooks };
  });

  console.log("✅ IPC handlers registered successfully.");
}
