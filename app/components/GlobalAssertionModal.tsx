"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import { setAssertions, type GlobalAssertion } from "../store/flowConfigSlice";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalAssertionModal({ isOpen, onClose }: Props) {
  const stored = useSelector((state: RootState) => state.flowConfig.assertions);
  const dispatch = useDispatch();

  const [rows, setRows] = useState<GlobalAssertion[]>([]);

  useEffect(() => {
    if (isOpen) setRows(stored.map((a) => ({ ...a })));
  }, [isOpen, stored]);

  if (!isOpen) return null;

  function update(id: string, field: "field" | "expected", val: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function add() {
    setRows((prev) => [...prev, { id: Date.now().toString(), field: "", expected: "" }]);
  }

  function handleSave() {
    dispatch(setAssertions(rows.filter((r) => r.field.trim())));
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md backdrop-blur-sm bg-background/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-xl py-lg bg-surface-container-highest border-b border-outline-variant flex justify-between items-center shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">verified_user</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">Global Assertions</h2>
              <p className="font-body-sm text-body-sm text-outline">
                Applied to every step in the flow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-outline">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-xl space-y-sm custom-scrollbar">
          {/* Column labels */}
          <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-sm items-center px-xs">
            <span className="font-label-caps text-label-caps text-outline">FIELD</span>
            <span className="font-label-caps text-label-caps text-outline text-center">==</span>
            <span className="font-label-caps text-label-caps text-outline">EXPECTED VALUE</span>
            <span className="w-6" />
          </div>

          {rows.length === 0 && (
            <p className="text-outline italic font-body-sm text-body-sm text-center py-xl">
              No global assertions defined.
            </p>
          )}

          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_auto_1fr_auto] gap-sm items-center">
              <input
                value={row.field}
                onChange={(e) => update(row.id, "field", e.target.value)}
                placeholder="status"
                className="bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm font-code-sm text-code-sm text-on-surface outline-none focus:border-tertiary transition-colors"
              />
              <span className="font-code-md text-code-md text-outline text-center px-xs">==</span>
              <input
                value={row.expected}
                onChange={(e) => update(row.id, "expected", e.target.value)}
                placeholder="200"
                className="bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm font-code-sm text-code-sm text-tertiary outline-none focus:border-tertiary transition-colors"
              />
              <button
                onClick={() => remove(row.id)}
                className="text-on-surface-variant hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}

          <button
            onClick={add}
            className="text-tertiary font-label-caps text-label-caps hover:underline flex items-center gap-xs mt-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            ADD ASSERTION
          </button>
        </div>

        {/* Footer */}
        <div className="px-xl py-lg bg-surface-container border-t border-outline-variant flex justify-end items-center gap-md shrink-0">
          <button
            onClick={onClose}
            className="px-lg py-md rounded-lg text-on-surface-variant hover:bg-surface-variant font-bold transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-xl py-md rounded-lg bg-tertiary text-on-tertiary font-extrabold shadow-lg shadow-tertiary/20 transition-all active:scale-95 flex items-center gap-sm"
          >
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
            Save Assertions
          </button>
        </div>
      </div>
    </div>
  );
}
