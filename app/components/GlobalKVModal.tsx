"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../store/store";
import { setVariables, setAssertions } from "../store/flowConfigSlice";
import { updateFlowMeta } from "../store/flowsSlice";
import { useToast } from "./ToastProvider";
import { setGlobals } from "../api/flowRoute";

interface KVRow {
  id: string;
  key: string;
  value: string;
}

interface ModeConfig {
  title: string;
  subtitle: React.ReactNode;
  icon: string;
  iconBg: string;
  iconColor: string;
  keyLabel: string;
  valueLabel: string;
  addLabel: string;
  saveLabel: string;
  saveIcon: string;
  saveBg: string;
  saveShadow: string;
  focusColor: string;
  addColor: string;
  emptyMessage: string;
  apiFieldName: "GLOBAL_VARIABLES" | "GLOBAL_ASSERTIONS" | "GLOBAL_HEADERS";
  showEqualsSign: boolean;
  showCurlyBraces: boolean;
}

const MODE_CONFIG: Record<"variables" | "assertions" | "headers", ModeConfig> = {
  variables: {
    title: "Global Variables",
    subtitle: (
      <>
        Available as{" "}
        <span className="font-code-sm text-code-sm text-primary">{`{{name}}`}</span> in all steps
      </>
    ),
    icon: "abc",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    keyLabel: "VARIABLE NAME",
    valueLabel: "VALUE",
    addLabel: "ADD VARIABLE",
    saveLabel: "Save Variables",
    saveIcon: "save",
    saveBg: "bg-primary text-on-primary shadow-primary/20",
    saveShadow: "shadow-primary/20",
    focusColor: "focus:border-primary",
    addColor: "text-primary",
    emptyMessage: "No global variables defined.",
    apiFieldName: "GLOBAL_VARIABLES",
    showEqualsSign: false,
    showCurlyBraces: true,
  },
  assertions: {
    title: "Global Assertions",
    subtitle: "Applied to every step in the flow",
    icon: "verified_user",
    iconBg: "bg-tertiary/10",
    iconColor: "text-tertiary",
    keyLabel: "FIELD",
    valueLabel: "EXPECTED VALUE",
    addLabel: "ADD ASSERTION",
    saveLabel: "Save Assertions",
    saveIcon: "verified_user",
    saveBg: "bg-tertiary text-on-tertiary",
    saveShadow: "shadow-tertiary/20",
    focusColor: "focus:border-tertiary",
    addColor: "text-tertiary",
    emptyMessage: "No global assertions defined.",
    apiFieldName: "GLOBAL_ASSERTIONS",
    showEqualsSign: true,
    showCurlyBraces: false,
  },
  headers: {
    title: "Global Headers",
    subtitle: "Sent with every request in the flow",
    icon: "tune",
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
    keyLabel: "HEADER NAME",
    valueLabel: "VALUE",
    addLabel: "ADD HEADER",
    saveLabel: "Save Headers",
    saveIcon: "save",
    saveBg: "bg-secondary text-on-secondary",
    saveShadow: "shadow-secondary/20",
    focusColor: "focus:border-secondary",
    addColor: "text-secondary",
    emptyMessage: "No global headers defined.",
    apiFieldName: "GLOBAL_HEADERS",
    showEqualsSign: false,
    showCurlyBraces: false,
  },
};

interface Props {
  mode: "variables" | "assertions" | "headers";
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalKVModal({ mode, isOpen, onClose }: Props) {
  const cfg = MODE_CONFIG[mode];
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const activeFlowId = useSelector((state: RootState) => state.flows.activeFlowId);
  const activeFlow = useSelector((state: RootState) => state.flows.activeFlow);

  const [rows, setRows] = useState<KVRow[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const sourceMap: Record<string, string> =
      mode === "variables" ? (activeFlow?.globalVariables ?? {})
      : mode === "assertions" ? (activeFlow?.globalAssertions ?? {})
      : (activeFlow?.globalHeaders ?? {});

    setRows(
      Object.entries(sourceMap).map(([key, value], i) => ({
        id: `${Date.now()}-${i}`,
        key,
        value: String(value),
      }))
    );
  }, [isOpen, mode, activeFlow]);

  if (!isOpen) return null;

  function updateRow(id: string, field: "key" | "value", val: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: Date.now().toString(), key: "", value: "" }]);
  }

  async function handleSave() {
    if (!activeFlowId) return;

    const apiPayload: Record<string, string> = {};
    const validRows = rows.filter((r) => r.key.trim());
    validRows.forEach((r) => { apiPayload[r.key] = r.value; });

    const apiResponse = await setGlobals(activeFlowId, apiPayload, cfg.apiFieldName);

    if (apiResponse.success) {
      if (mode === "variables") {
        dispatch(updateFlowMeta({ id: activeFlowId, globalVariables: apiPayload }));
        dispatch(setVariables(validRows.map((r) => ({ id: r.id, name: r.key, value: r.value }))));
      } else if (mode === "assertions") {
        dispatch(updateFlowMeta({ id: activeFlowId, globalAssertions: apiPayload }));
        dispatch(setAssertions(validRows.map((r) => ({ id: r.id, field: r.key, expected: r.value }))));
      } else {
        dispatch(updateFlowMeta({ id: activeFlowId, globalHeaders: apiPayload }));
      }
      onClose();
      showToast(`Global ${mode} saved successfully.`, "success");
    } else {
      showToast(`Failed to save global ${mode}. Please try again.`, "error");
    }
  }

  const colClass = cfg.showEqualsSign
    ? "grid-cols-[1fr_auto_1fr_auto]"
    : "grid-cols-[1fr_1fr_auto]";

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
            <div className={`w-10 h-10 rounded-lg ${cfg.iconBg} flex items-center justify-center`}>
              <span className={`material-symbols-outlined ${cfg.iconColor}`}>{cfg.icon}</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">{cfg.title}</h2>
              <p className="font-body-sm text-body-sm text-outline">{cfg.subtitle}</p>
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
          {/* Column headers */}
          <div className={`grid ${colClass} gap-sm items-center px-xs`}>
            <span className="font-label-caps text-label-caps text-outline">{cfg.keyLabel}</span>
            {cfg.showEqualsSign && (
              <span className="font-label-caps text-label-caps text-outline text-center">==</span>
            )}
            <span className="font-label-caps text-label-caps text-outline">{cfg.valueLabel}</span>
            <span className="w-6" />
          </div>

          {rows.length === 0 && (
            <p className="text-outline italic font-body-sm text-body-sm text-center py-xl">
              {cfg.emptyMessage}
            </p>
          )}

          {rows.map((row) => (
            <div key={row.id} className={`grid ${colClass} gap-sm items-center`}>
              {/* Key input */}
              {cfg.showCurlyBraces ? (
                <div className={`flex items-center gap-xs bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm focus-within:border-primary transition-colors`}>
                  <span className="text-outline font-code-sm text-code-sm shrink-0">{"{{"}</span>
                  <input
                    value={row.key}
                    onChange={(e) => updateRow(row.id, "key", e.target.value)}
                    placeholder="variable_name"
                    className="flex-1 bg-transparent border-none p-0 font-code-sm text-code-sm text-primary focus:ring-0 outline-none min-w-0"
                  />
                  <span className="text-outline font-code-sm text-code-sm shrink-0">{"}}"}</span>
                </div>
              ) : (
                <input
                  value={row.key}
                  onChange={(e) => updateRow(row.id, "key", e.target.value)}
                  placeholder="status"
                  className={`bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm font-code-sm text-code-sm text-on-surface outline-none ${cfg.focusColor} transition-colors`}
                />
              )}

              {cfg.showEqualsSign && (
                <span className="font-code-md text-code-md text-outline text-center px-xs">==</span>
              )}

              {/* Value input */}
              <input
                value={row.value}
                onChange={(e) => updateRow(row.id, "value", e.target.value)}
                placeholder={cfg.showEqualsSign ? "200" : "value or leave empty"}
                className={`bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-sm font-code-sm text-code-sm ${cfg.showEqualsSign ? "text-tertiary" : "text-on-surface"} outline-none ${cfg.focusColor} transition-colors`}
              />

              <button
                onClick={() => removeRow(row.id)}
                className="text-on-surface-variant hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}

          <button
            onClick={addRow}
            className={`${cfg.addColor} font-label-caps text-label-caps hover:underline flex items-center gap-xs mt-sm`}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            {cfg.addLabel}
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
            className={`px-xl py-md rounded-lg ${cfg.saveBg} font-extrabold shadow-lg ${cfg.saveShadow} transition-all active:scale-95 flex items-center gap-sm`}
          >
            <span className="material-symbols-outlined text-[20px]">{cfg.saveIcon}</span>
            {cfg.saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
