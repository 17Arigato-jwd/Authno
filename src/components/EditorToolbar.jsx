import React, { useReducer, useEffect, useCallback, useRef } from "react";
import { Upload } from "lucide-react";
import FontSelector from "./FontSelector";
import SizeSelector from "./SizeSelector";
import FormatButton from "./FormatButton";

const initialState = {
  bold: false,
  italic: false,
  underline: false,
  highlight: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export default function EditorToolbar({ execCommand, accentHex }) {
  const [activeButtons, dispatch] = useReducer(reducer, initialState);

  const fontRef = useRef("Arial");
  const sizeRef = useRef("3");

  // === Detect formatting dynamically ===
  const updateActiveStates = useCallback(() => {
    const backColor = document.queryCommandValue("backColor")?.toLowerCase();
    dispatch({
      type: "SET_STATE",
      payload: {
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        highlight:
          backColor === "rgba(255, 255, 0, 0.3)" || backColor === "yellow",
      },
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
    const highlightColor = "rgba(255, 255, 0, 0.3)";
    const currentColor = document.queryCommandValue("backColor");

    if (currentColor.toLowerCase() === highlightColor) {
      document.execCommand("backColor", false, "transparent");
    } else {
      document.execCommand("backColor", false, highlightColor);
    }
    updateActiveStates();
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
        case "s":
          e.preventDefault();
          window.electron?.saveBook && document.dispatchEvent(new CustomEvent("triggerSave"));
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
      rounded-2xl backdrop-blur-md
      ring-2 ring-white/70 shadow-[0_0_20px_2px_rgba(255,255,255,0.1)]
      transition-all duration-300"
      style={{
        background: `linear-gradient(to bottom right, ${accentHex}B3, rgba(0,0,0,0.7))`
      }}
    >
      <FontSelector defaultValue="Arial" onChange={handleFontChange} />
      <SizeSelector defaultValue="3" onChange={handleSizeChange} />

      <FormatButton
        format="bold"
        label="B"
        title="Bold (Ctrl+B)"
        style={{ fontWeight: "bold" }}
        isActive={activeButtons.bold}
        onClick={() => toggleFormat("bold")}
      />
      <FormatButton
        format="italic"
        label="I"
        title="Italic (Ctrl+I)"
        style={{ fontStyle: "italic" }}
        isActive={activeButtons.italic}
        onClick={() => toggleFormat("italic")}
      />
      <FormatButton
        format="underline"
        label="U"
        title="Underline (Ctrl+U)"
        style={{ textDecoration: "underline" }}
        isActive={activeButtons.underline}
        onClick={() => toggleFormat("underline")}
      />
      <FormatButton
        format="highlight"
        label="H"
        title="Highlight (Ctrl+H)"
        isActive={activeButtons.highlight}
        onClick={toggleHighlight}
      />


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
