import React, { useState, useRef, useEffect } from "react";
import Logo from "../logo.svg";

export default function Sidebar({
  sessions,
  setSessions,
  onNewBook,
  onNewStoryboard,
  search,
  setSearch,
  onSelect,
  currentId,
  onDelete,
}) {
  const [contextMenu, setContextMenu] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [bookDropdownOpen, setBookDropdownOpen] = useState(false);
  const sidebarRef = useRef(null);
  const dragState = useRef({});

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Load saved width from localStorage (default 288px = 18rem)
    const saved = localStorage.getItem("sidebarWidth");
    return saved ? parseInt(saved, 10) : 288;
  });
  const isResizing = useRef(false);

  // === Close menus when clicking outside ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setContextMenu(null);
        setEditMode(false);
        setBookDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // === Context Menu ===
  const handleContextMenu = (e, sessionId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      sessionId,
    });
  };

  const handleDelete = () => {
    if (!contextMenu?.sessionId) return;

    const skipWarning = localStorage.getItem("skipDeleteWarning") === "true";
    if (skipWarning) {
      onDelete?.(contextMenu.sessionId);
      setContextMenu(null);
      return;
    }

    // 🧩 Create custom warning modal
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]";
    modal.innerHTML = `
      <div class="bg-[#0f0f10] border border-white/20 rounded-xl p-6 w-[360px] text-white shadow-xl">
        <h2 class="text-lg font-semibold mb-2">Delete from Workspace?</h2>
        <p class="text-sm text-white/70 mb-4 leading-relaxed">
          Deleting this book here will only remove it from your workspace.<br/>
          The actual <b>.authbook</b> file will remain on your computer.
        </p>

        <label class="flex items-center gap-2 mb-4 cursor-pointer select-none">
          <input type="checkbox" id="skipWarningCheck" class="w-4 h-4 accent-[#00b4ff]" />
          <span class="text-sm text-white/70">Don’t show this warning again</span>
        </label>

        <div class="flex justify-end gap-3">
          <button id="cancelBtn"
            class="px-3 py-1.5 rounded-md border border-white/30 hover:bg-white/10 transition text-sm">
            Cancel
          </button>
          <button id="confirmBtn"
            class="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition">
            Delete
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle buttons
    modal.querySelector("#cancelBtn").onclick = () => modal.remove();
    modal.querySelector("#confirmBtn").onclick = () => {
      const dontShow = modal.querySelector("#skipWarningCheck").checked;
      if (dontShow) localStorage.setItem("skipDeleteWarning", "true");
      onDelete?.(contextMenu.sessionId);
      setContextMenu(null);
      modal.remove();
    };
  };




  // === Drag-Drop Handlers ===
  const handleDragStart = (e, index) => {
    dragState.current.draggedIndex = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    const draggedIndex = dragState.current.draggedIndex;
    if (draggedIndex === index) return;
    const updated = [...sessions];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, moved);
    setSessions(updated);
    dragState.current.draggedIndex = index;
  };

  // === Auto-scroll when dragging near top/bottom ===
  useEffect(() => {
    if (!editMode) return; // only active in edit mode

    let scrollInterval = null;

    const handleDrag = (e) => {
      const sidebar = sidebarRef.current;
      if (!sidebar) return;

      const rect = sidebar.getBoundingClientRect();
      const offset = 250; // pixels near top/bottom to trigger scrolling
      const scrollSpeed = 12; // pixels per frame

      // Cursor near top?
      if (e.clientY < rect.top + offset) {
        if (!scrollInterval) {
          scrollInterval = setInterval(() => {
            sidebar.scrollTop -= scrollSpeed;
          }, 16);
        }
      }
      // Cursor near bottom?
      else if (e.clientY > rect.bottom - offset) {
        if (!scrollInterval) {
          scrollInterval = setInterval(() => {
            sidebar.scrollTop += scrollSpeed;
          }, 16);
        }
      } else {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    };

    const stopScroll = () => {
      clearInterval(scrollInterval);
      scrollInterval = null;
    };

    document.addEventListener("dragover", handleDrag);
    document.addEventListener("drop", stopScroll);
    document.addEventListener("dragend", stopScroll);

    return () => {
      stopScroll();
      document.removeEventListener("dragover", handleDrag);
      document.removeEventListener("drop", stopScroll);
      document.removeEventListener("dragend", stopScroll);
    };
  }, [editMode]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      let newWidth = e.clientX;

      // Limit min/max width
      const minWidth = 200; // px
      const maxWidth = 480; // px
      if (newWidth < minWidth) newWidth = minWidth;
      if (newWidth > maxWidth) newWidth = maxWidth;

      setSidebarWidth(newWidth);
    };

    const stopResizing = () => {
      if (isResizing.current) {
        isResizing.current = false;
        localStorage.setItem("sidebarWidth", sidebarWidth);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResizing);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [sidebarWidth]);


  // === File I/O (open existing book) ===
  const handleOpenBook = async () => {
      try {
        // Ask Electron to open a book file
        const result = await window.electron.openBook();
        if (!result) return; // user cancelled

        // ✅ Check if the book is already open
        if (sessions.some((s) => s.filePath === result.filePath)) {
          alert("This book is already open!");
          return;
        }

        // Create new book object
        const newBook = {
          id: Date.now().toString(),
          title: result.title || "Untitled Book",
          content: result.content || "",
          preview:
            (result.content || "")
              .replace(/<[^>]*>?/gm, "")
              .slice(0, 60) + "...",
          filePath: result.filePath,
          type: "book",
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        };

        // Add it to the list
        setSessions((prev) => [newBook, ...prev]);
      } catch (err) {
        console.error("Error opening book:", err);
      }
    };



  return (
    <aside
      ref={sidebarRef}
      style={{ width: `${sidebarWidth}px` }}
      className="min-w-[12rem] max-w-[30rem] bg-[#0b0b0c] text-white flex flex-col relative select-none"
    >
      {/* HEADER */}
      <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2">
        <img
          src={Logo}
          alt="AuthNo"
          className="h-14 w-14 object-contain drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]"
        />
      </div>

      {/* SEARCH BAR */}
      <div className="p-3 border-b border-white/10">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border border-white/20 rounded px-3 py-2 text-sm placeholder-white/40 focus:outline-none"
          placeholder="Search sessions..."
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="p-3 flex gap-2 border-b border-white/10 relative">
        {/* New Book (dropdown) */}
        <div className="relative flex-1">
          <button
            onClick={() => setBookDropdownOpen((v) => !v)}
            className="w-full border-2 border-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/5 transition"
          >
            + New Book ▾
          </button>
          {bookDropdownOpen && (
            <div className="absolute mt-2 w-full bg-[#0f0f10] border border-white/10 rounded-lg shadow-lg overflow-hidden z-20">
              <button
                onClick={() => {
                  setBookDropdownOpen(false);
                  onNewBook();
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition"
              >
                📖 New Blank Book
              </button>

              <button
                onClick={() => {
                  setBookDropdownOpen(false);
                  handleOpenBook();
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition"
              >
                📂 Open Existing Book
              </button>
            </div>
          )}
        </div>

        {/* New Storyboard */}
        <button
          onClick={onNewStoryboard}
          className="flex-1 border-2 border-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-white/5 transition"
        >
          + Storyboard
        </button>
      </div>


      {/* EDIT LAYOUT BUTTON — only visible while editing */}
      {editMode && (
        <div className="p-3 border-b border-white/10">
          <button
            onClick={() => setEditMode(false)}
            className="w-full border-2 border-white rounded-lg px-3 py-2 text-sm font-semibold bg-white/10 hover:bg-white/20 transition"
          >
            ✅ Done Editing
          </button>
        </div>
      )}


      {/* SESSIONS LIST */}
      <div className="p-3 flex-1 overflow-auto">
        <div
          className="rounded-lg p-2"
          style={{
            background: "linear-gradient(135deg, #1f1f1f 0%, #050505 100%)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <h3 className="text-xs text-white/70 px-2 mb-2">Sessions</h3>
          <div className="flex flex-col gap-2">
            {sessions.length === 0 ? (
              <div className="text-sm text-white/40 px-2 italic">
                No sessions yet — create one.
              </div>
            ) : (
              sessions.map((s, i) => (
                <div
                  key={s.id}
                  draggable={editMode}
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onClick={() => !editMode && onSelect(s.id)}
                  onContextMenu={(e) =>
                    !editMode && handleContextMenu(e, s.id)
                  }
                  className={`text-left px-3 py-2 rounded-md border-2 transition cursor-pointer select-none ${
                    s.id === currentId && !editMode
                      ? "border-white/40 bg-white/5"
                      : "border-white/10 hover:border-white/40"
                  } ${editMode ? "animate-wobble cursor-grab" : ""}`}
                >
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-white/40">
                    {s.type === "book" ? "📖 Book" : "🎞️ Storyboard"} —{" "}
                    {s.preview}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FLOATING CONTEXT MENU */}
      {contextMenu?.visible && (
        <div
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          className="fixed z-50 p-2 rounded-lg shadow-xl border border-white/30 backdrop-blur-md"
        >
          <div
            className="bg-gradient-to-br from-[#012d73] to-black text-white rounded-lg overflow-hidden border border-white/20"
            style={{
              boxShadow: "0 0 10px rgba(255,255,255,0.1)",
              minWidth: "120px",
            }}
          >
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition"
            >
              🗑️ Delete
            </button>
            <button
                onClick={() => {
                  setEditMode(true);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition"
              >
                ✏️ Edit Layout
            </button>
          </div>
        </div>
      )}
      {/* RESIZE HANDLE */}
    <div
      onMouseDown={() => (isResizing.current = true)}
      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400/40 transition"
      style={{ zIndex: 100 }}
    />
    </aside>
  );
}
