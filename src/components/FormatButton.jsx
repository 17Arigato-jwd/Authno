import React from "react";

export default function FormatButton({
  format,
  label,
  title,
  style,
  isActive,
  onClick,
}) {
  const isHighlight = format === "highlight";
  const specialHighlightClasses =
    "bg-yellow-300/30 text-white ring-1 ring-yellow-400";
  const specialHighlightHover = "hover:bg-yellow-300/20 hover:text-white";

  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-md border-2 border-white/60 text-sm transition-all duration-200 ${
        isActive
          ? isHighlight
            ? specialHighlightClasses
            : "bg-white/30 text-white"
          : isHighlight
          ? specialHighlightHover
          : "hover:bg-white/10 hover:text-white"
      }`}
      title={title}
      style={style}
    >
      {label}
    </button>
  );
}
