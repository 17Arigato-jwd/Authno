import React, { useState, useRef, useEffect } from "react";
import { Save, SaveAll } from "lucide-react";

const electronAPI = window.electron; // safe preload bridge

export default function BurgerMenu({ open, onClose, current, setSessions }) {
  const [status, setStatus] = useState("idle");
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose?.();
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = async () => {
    if (!current) return;
    setStatus("saving");
    try {
      if (current.filePath) {
        await electronAPI.saveBook({
          filePath: current.filePath,
          content: current,
        });
      } else {
        const result = await electronAPI.saveAsBook({ content: current });
        if (result?.filePath) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === current.id ? { ...s, filePath: result.filePath } : s
            )
          );
        }
      }
      setStatus("saved");
    } catch (err) {
      console.error("Save failed:", err);
      alert("⚠️ Save failed. Check file permissions or try 'Save As'.");
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 2000);
  };

  const handleSaveAs = async () => {
    if (!current) return;
    const result = await electronAPI.saveAsBook({ content: current });
    if (result?.filePath) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === current.id ? { ...s, filePath: result.filePath } : s
        )
      );
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute top-14 right-6 z-50 w-48 rounded-xl p-3 shadow-lg backdrop-blur-md
                 border border-white/20 bg-gradient-to-br from-[#012d73]/95 to-black/95
                 animate-fadeIn"
    >
      {/* SAVE */}
      <button
        disabled={status === "saving"}
        onClick={handleSave}
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-md border-2 text-sm font-semibold
                    transition-all duration-300 justify-center
                    ${
                      status === "saving"
                        ? "border-yellow-400 text-yellow-400 opacity-50 cursor-not-allowed"
                        : status === "saved"
                        ? "border-green-400 text-green-400"
                        : "border-white text-white hover:bg-white/10"
                    }`}
      >
        <Save className="w-4 h-4" />
        {status === "saving"
          ? "Saving..."
          : status === "saved"
          ? "Saved ✓"
          : "Save"}
      </button>

      <div className="h-px my-1" />

      {/* SAVE AS */}
      <button
        onClick={handleSaveAs}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-md border-2 text-sm font-semibold
                   border-white text-white hover:bg-white/10 transition-all duration-300 justify-center"
      >
        <SaveAll className="w-4 h-4" />
        Save As...
      </button>
    </div>
  );
}
