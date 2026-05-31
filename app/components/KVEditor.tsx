"use client";

export interface KVPair {
  key: string;
  value: string;
}

export function recordToKV(record: Record<string, string>): KVPair[] {
  return Object.entries(record).map(([key, value]) => ({ key, value }));
}

export function kvToRecord(pairs: KVPair[]): Record<string, string> {
  return Object.fromEntries(pairs.filter((p) => p.key.trim()).map((p) => [p.key, p.value]));
}

interface Props {
  pairs: KVPair[];
  onChange: (pairs: KVPair[]) => void;
  keyPlaceholder: string;
  valuePlaceholder: string;
}

export default function KVEditor({ pairs, onChange, keyPlaceholder, valuePlaceholder }: Props) {
  function update(index: number, field: "key" | "value", val: string) {
    onChange(pairs.map((p, i) => (i === index ? { ...p, [field]: val } : p)));
  }
  function remove(index: number) {
    onChange(pairs.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-sm">
      {pairs.length === 0 && (
        <p className="text-outline italic font-body-sm text-body-sm text-center py-lg">
          No entries defined.
        </p>
      )}
      {pairs.map((pair, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-sm items-center">
          <input
            value={pair.key}
            onChange={(e) => update(i, "key", e.target.value)}
            placeholder={keyPlaceholder}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg p-sm font-code-sm text-code-sm text-on-surface outline-none focus:border-primary transition-colors"
          />
          <input
            value={pair.value}
            onChange={(e) => update(i, "value", e.target.value)}
            placeholder={valuePlaceholder}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg p-sm font-code-sm text-code-sm text-secondary outline-none focus:border-secondary transition-colors"
          />
          <button type="button" onClick={() => remove(i)} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...pairs, { key: "", value: "" }])}
        className="text-primary font-label-caps text-label-caps hover:underline flex items-center gap-xs mt-xs"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
        ADD ROW
      </button>
    </div>
  );
}
