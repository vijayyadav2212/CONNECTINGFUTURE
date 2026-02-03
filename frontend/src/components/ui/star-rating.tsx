"use client";

import React from "react";

type StarRatingProps = {
  value: number; // 0-5
  onChange?: (val: number) => void;
  readOnly?: boolean;
  size?: number; // px
  className?: string;
};

function StarIcon({ filled, size = 20 }: { filled: boolean; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={filled ? "text-yellow-500" : "text-gray-300"}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path d="M11.48 3.499a.75.75 0 011.04 0l2.55 2.568 3.41.725a.75.75 0 01.41 1.27l-2.39 2.495.51 3.478a.75.75 0 01-1.09.778L12 13.861l-3.52 1.952a.75.75 0 01-1.09-.778l.51-3.478-2.39-2.495a.75.75 0 01.41-1.27l3.41-.725 2.55-2.568z" />
    </svg>
  );
}

export default function StarRating({ value, onChange, readOnly = false, size = 20, className }: StarRatingProps) {
  const v = Math.max(0, Math.min(5, Math.round(value || 0)));
  return (
    <div className={"flex items-center gap-1 " + (className || "")}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => !readOnly && onChange && onChange(i)}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
          aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
        >
          <StarIcon filled={i <= v} size={size} />
        </button>
      ))}
    </div>
  );
}
