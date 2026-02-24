import React from "react";
import { SIZE_OPTIONS } from "./constants";

export default function SizeSelector({ onChange, defaultValue }) {
  return (
    <select
      defaultValue={defaultValue}
      onChange={onChange}
      className="bg-transparent border border-white/40 text-white text-sm px-2 py-1 rounded-md focus:outline-none hover:border-white/60 transition"
    >
      {SIZE_OPTIONS.map((s) => (
        <option className="text-black" key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
