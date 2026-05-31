"use client";

export interface SelectOption {
  label: string;
  value: string;
}

interface Props {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  layout?: "stacked" | "inline";
}

export default function SelectDropdown({ options, value, onChange, label, layout = "stacked" }: Props) {
  const select = (
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

  if (!label) return select;

  if (layout === "inline") {
    return (
      <div className="flex items-center justify-between">
        <span className="font-label-caps text-label-caps text-outline">{label}</span>
        {select}
      </div>
    );
  }

  return (
    <div>
      <label className="block font-label-caps text-label-caps text-outline mb-xs">{label}</label>
      {select}
    </div>
  );
}
