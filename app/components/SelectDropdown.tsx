"use client";

import { useState, useRef, useEffect } from "react";

export interface SelectOption {
  label: string;
  value: string;
  color?: string; // Tailwind text color class applied in the custom dropdown
}

interface Props {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  layout?: "stacked" | "inline";
}

export default function SelectDropdown({ options, value, onChange, label, layout = "stacked" }: Props) {
  const hasColors = options.some((o) => o.color);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!isOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isOpen]);

  let control: React.ReactNode;

  if (hasColors) {
    control = (
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className={`w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-xs font-label-caps text-[10px] tracking-widest uppercase font-bold focus:border-primary outline-none transition-colors cursor-pointer flex items-center justify-between gap-xs ${selected?.color ?? "text-primary"}`}
        >
          {selected?.label ?? value}
          <span className="material-symbols-outlined text-sm text-outline leading-none">
            {isOpen ? "expand_less" : "expand_more"}
          </span>
        </button>
        {isOpen && (
          <div className="absolute z-50 top-full mt-1 left-0 min-w-full bg-surface-container-high border border-outline-variant rounded-lg shadow-xl overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-sm py-xs font-label-caps text-[10px] tracking-widest uppercase font-bold transition-colors hover:bg-surface-container-highest ${opt.color ?? "text-on-surface"} ${opt.value === value ? "bg-surface-container-highest" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  } else {
    control = (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-xs font-code-sm text-code-sm text-primary focus:border-primary outline-none transition-colors cursor-pointer appearance-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }

  if (!label) return <>{control}</>;

  if (layout === "inline") {
    return (
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-label-caps text-outline">{label}</span>
        {control}
      </div>
    );
  }

  return (
    <div>
      <label className="block font-label-caps text-label-caps text-outline mb-xs">{label}</label>
      {control}
    </div>
  );
}
