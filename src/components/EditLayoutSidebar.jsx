// src/components/EditLayoutSidebar.jsx
import React, { useEffect, useState, useRef } from "react";

export default function EditLayoutSidebar({ sessions, setSessions, onClose }) {
  const [editMode, setEditMode] = useState(false);
  const sidebarRef = useRef(null);
  const dragState = useRef({});

  // Disable wobble when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setEditMode(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Handle reordering (drag/drop)
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

  return (
    <div ref={sidebarRef} className="p-3 border-b border-white/10 relative">
      {/* Toggle Edit Button */}
      <button
        onClick={() => setEditMode(!editMode)}
        className={`w-full colorful-button px-4 py-2 rounded-lg font-semibold transition-all ${
          editMode ? "pressed" : ""
        }`}
      >
        ✏️ Edit Layout
      </button>

      {/* Session list inside edit panel */}
      <div className="mt-4 flex flex-col gap-2">
        {sessions.map((s, i) => (
          <div
            key={s.id}
            draggable={editMode}
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            className={`px-3 py-2 rounded-md border-2 cursor-pointer transition-all select-none ${
              editMode ? "animate-wobble cursor-grab active:cursor-grabbing" : ""
            } ${"border-white/10 bg-[#101010] hover:border-white/40"}`}
          >
            <div className="font-medium">{s.title}</div>
            <div className="text-xs text-white/40">
              {s.type === "book" ? "📖 Book" : "🎞️ Storyboard"} — {s.preview}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
