import React from "react";
import { FONT_OPTIONS } from "./constants";

export default function FontSelector({ onChange, defaultValue }) {
  return (
    <select
      defaultValue={defaultValue}
      onChange={onChange}
      className="bg-transparent border border-white/40 text-white text-sm px-2 py-1 rounded-md focus:outline-none hover:border-white/60 transition"
    >
      {FONT_OPTIONS.map((font) => (
        <option className="text-black" key={font.value} value={font.value}>
          {font.label}
        </option>
      ))}
    </select>
  );
}
