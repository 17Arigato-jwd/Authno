// Preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  // --- Basic IPC API ---
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),

  // --- File operations (handled by fileManager.js) ---
  openBook: () => ipcRenderer.invoke("open-book"),
  saveBook: (data) => ipcRenderer.invoke("save-book", data),
  saveAsBook: (data) => ipcRenderer.invoke("save-as-book", data),

  // --- Restore previously open books (delegates to main process) ---
  restoreBooks: async (books) => {
    const result = await ipcRenderer.invoke("restore-books", books);
    if (result) {
      const { validBooks, missingBooks } = result;
      // Send back valid and missing books
      window.postMessage({ type: "restored-books", books: validBooks });
      if (missingBooks.length > 0) {
        window.postMessage({ type: "missing-books", messages: missingBooks });
      }
    }
  },

  // --- 📂 Handle double-clicked .authbook files ---
  onOpenAuthBook: (callback) => {
    ipcRenderer.on("open-authbook", (event, fileData) => {
      if (!fileData) {
        alert("⚠️ Book could not be opened.");
        return;
      }
      callback(fileData);
    });
  },
});
