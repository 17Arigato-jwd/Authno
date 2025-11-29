import React, { useState, useEffect, useCallback, useRef } from "react";
import { Upload } from "lucide-react";

export default function EditorToolbar({ execCommand }) {
  const [activeButtons, setActiveButtons] = useState({
    bold: false,
    italic: false,
    underline: false,
    highlight: false,
  });

  const fontRef = useRef("Arial");
  const sizeRef = useRef("3");

  // === Detect formatting dynamically ===
  const updateActiveStates = useCallback(() => {
    const backColor = document.queryCommandValue("backColor")?.toLowerCase();
    setActiveButtons({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      highlight:
        backColor === "rgba(255, 255, 0, 0.3)" || backColor === "yellow",
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveStates);
    return () =>
      document.removeEventListener("selectionchange", updateActiveStates);
  }, [updateActiveStates]);

  // === Toggle formatting ===
  const toggleFormat = (cmd, value = null) => {
    execCommand(cmd, value);
    updateActiveStates();
  };

  // === Toggle Highlight ===
  const toggleHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // If selection is collapsed, do nothing
    if (range.collapsed) return;

    // Detect if selection is already highlighted
    const parent = range.commonAncestorContainer.parentElement;
    const isHighlighted =
      parent &&
      parent.tagName === "SPAN" &&
      parent.style.backgroundColor.includes("255, 255, 0");

    // === Remove highlight ===
    if (isHighlighted) {
      const span = parent;
      const text = document.createTextNode(span.textContent);
      span.replaceWith(text);
      setActiveButtons((p) => ({ ...p, highlight: false }));
      return;
    }

    // === Apply new custom highlight ===
    const span = document.createElement("span");
    span.style.backgroundColor = "rgba(255, 255, 0, 0.3)";
    span.style.padding = "2px 2px";
    span.style.borderRadius = "5px";

    range.surroundContents(span);

    setActiveButtons((p) => ({ ...p, highlight: true }));
  };

  // === Keyboard Shortcuts ===
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e.ctrlKey) return;
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          toggleFormat("bold");
          break;
        case "i":
          e.preventDefault();
          toggleFormat("italic");
          break;
        case "u":
          e.preventDefault();
          toggleFormat("underline");
          break;
        case "h":
          e.preventDefault();
          toggleHighlight();
          break;
        default:
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // === Font and Size ===
  const handleFontChange = (e) => {
    fontRef.current = e.target.value;
    execCommand("fontName", e.target.value);
  };

  const handleSizeChange = (e) => {
    sizeRef.current = e.target.value;
    execCommand("fontSize", e.target.value);
  };

  return (
    <div
      className="sticky top-4 z-50 left-1/2 transform flex items-center gap-3 px-4 py-2
      rounded-2xl backdrop-blur-md bg-gradient-to-br from-[#012d73]/70 to-black/70
      ring-2 ring-white/70 shadow-[0_0_20px_2px_rgba(255,255,255,0.1)]
      transition-all duration-300"
    >
      {/* === Font === */}
      <select
        defaultValue="Arial"
        onChange={handleFontChange}
        className="bg-transparent border border-white/40 text-white text-sm px-2 py-1 rounded-md focus:outline-none hover:border-white/60 transition"
      >
        <option value="Arial">Arial</option>
        <option value="Georgia">Georgia</option>
        <option value="Courier New">Courier New</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Verdana">Verdana</option>
      </select>

      {/* === Size === */}
      <select
        defaultValue="3"
        onChange={handleSizeChange}
        className="bg-transparent border border-white/40 text-white text-sm px-2 py-1 rounded-md focus:outline-none hover:border-white/60 transition"
      >
        {[1, 2, 3, 4, 5, 6, 7].map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* === Bold === */}
      <button
        onClick={() => toggleFormat("bold")}
        className={`px-2 py-1 rounded-md border-2 border-white/60 font-bold text-sm transition-all duration-200 ${
          activeButtons.bold
            ? "bg-white/30 text-white"
            : "hover:bg-white/10 hover:text-white"
        }`}
        title="Bold (Ctrl+B)"
      >
        B
      </button>

      {/* === Italic === */}
      <button
        onClick={() => toggleFormat("italic")}
        className={`px-2 py-1 rounded-md border-2 border-white/60 italic text-sm transition-all duration-200 ${
          activeButtons.italic
            ? "bg-white/30 text-white"
            : "hover:bg-white/10 hover:text-white"
        }`}
        title="Italic (Ctrl+I)"
      >
        I
      </button>

      {/* === Underline === */}
      <button
        onClick={() => toggleFormat("underline")}
        className={`px-2 py-1 rounded-md border-2 border-white/60 underline text-sm transition-all duration-200 ${
          activeButtons.underline
            ? "bg-white/30 text-white"
            : "hover:bg-white/10 hover:text-white"
        }`}
        title="Underline (Ctrl+U)"
      >
        U
      </button>

      {/* === Highlight === */}
      <button
        onClick={toggleHighlight}
        className={`px-2 py-1 rounded-md border-2 border-white/60 text-sm transition-all duration-200 ${
          activeButtons.highlight
            ? "bg-yellow-300/30 text-white ring-1 ring-yellow-400"
            : "hover:bg-yellow-300/20 hover:text-white"
        }`}
        title="Highlight (Ctrl+H)"
      >
        H
      </button>

      {/* === Insert Placeholder === */}
      <button
        className="flex items-center gap-2 px-3 py-1 rounded-md border-2 border-white/60 text-sm hover:bg-white/10 hover:text-white transition-all duration-200"
        title="Insert (coming soon)"
      >
        Insert
        <Upload className="w-4 h-4 text-white/70" />
      </button>
    </div>
  );
}
