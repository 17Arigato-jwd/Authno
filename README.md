# 🖋️ **Authno**

*A fast, offline-first writing app for authors who want to focus entirely on their stories.*

<p align="center">
  <img src="./public/authno.png" width="120" alt="Authno Logo"/>
</p>

<p align="center">
  <b>Write without distractions. Everything saved locally. Cross-platform. Secure. Yours.</b>
</p>

<p align="center">
  <img alt="GitHub Release" src="https://img.shields.io/github/v/release/17Arigato-jwd/Authno?label=Latest%20Release&style=for-the-badge">
  <img alt="GitHub License" src="https://img.shields.io/github/license/17Arigato-jwd/Authno?style=for-the-badge">
  <img alt="Platforms" src="https://img.shields.io/badge/Platforms-Windows%20%7C%20Linux-blue?style=for-the-badge">
  <img alt="Status" src="https://img.shields.io/badge/Status-Public%20Beta-yellow?style=for-the-badge">
</p>

---

## ✨ **What is Authno?**

Authno is a **local-first writing tool** built specifically for **authors**, designed to let you write books, stories, drafts, and long-form text without distractions, lag, or reliance on the internet.

Every file stays on your device — no accounts, no cloud sync, no online requirements.

Authno uses a custom file format (`.authbook`) to save writing projects securely and quickly.

---

## 🚀 **Current Features**

### ✔ **Offline Support**

* Fully local.
* Uses `.authbook` project files stored on your machine.
* Files open the app when double-clicked (small limitation: content does not auto-load yet — you must open it from inside the app).

### ✔ **Cross-Platform**

* Windows
* Linux (AppImage, DEB, RPM)

### ✔ **Basic Author Tools**

* Core writing experience
* Basic text formatting
* Simple, clean interface
* Shortcut support (e.g., **Ctrl + S** to save)

---

## 🛠 **Download Authno**

### **Windows**

➡ **Installer (Recommended)**
You’ll find it directly under the latest release as:
`AuthNo-Setup-<version>.exe`

### **Linux**

| Format                  | File                          |
| ----------------------- | ----------------------------- |
| **AppImage**            | `Authno-<version>.AppImage`   |
| **DEB (Ubuntu/Debian)** | `Authno_<version>_amd64.deb`  |
| **RPM (Fedora/RedHat)** | `Authno-<version>.x86_64.rpm` |

Go to the Releases page and download whichever matches your system.

---

## 🧭 **Roadmap**

Planned for upcoming versions:

### **🔧 Core Improvements**

* [ ] Auto-load `.authbook` files when opened
* [ ] Add Settings menu
* [ ] Implement Storyboards properly
* [ ] Homescreen / dashboard view
* [ ] UI/UX cleanup & consistency
* [ ] Layout editing tools
* [ ] Editor feature expansion (formatting tools, search, more)

### **💡 Future Experiments**

* [ ] Chapter management
* [ ] Writing statistics
* [ ] Daily streaks with logic
* [ ] Dark/light theme controls

---

## 🐛 Known Limitations (Beta)

* `.authbook` files open the app, but do **not** auto-load their contents
* Some UI/UX roughness
* Storyboard button currently behaves like "New Book"
* Editing layout menu is not implemented yet
* Streak display has no logic behind it yet

---

## 📂 Project Structure

```
/public             → app icons & logos  
/src                → React frontend  
/main.js            → Electron main process  
/preload.js         → Preload scripts  
/fileManager.js     → Local file system logic  
/dist               → Build output (ignored in repo)  
```

---

## ❤️ Acknowledgments

Authno is built slowly but passionately, with the goal of giving authors a **beautiful**, **offline**, distraction-free place to write.

Just tell me!
