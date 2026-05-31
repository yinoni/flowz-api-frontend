"use client";

import { useState, useEffect } from "react";
import KVEditor, { type KVPair, recordToKV, kvToRecord } from "./KVEditor";

interface FlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { flowName: string; globalURL: string; globalHeaders: Record<string, string>; globalVariables: Record<string, string> }) => void;
  initialData?: { flowName: string; globalURL: string; globalHeaders: Record<string, string>; globalVariables: Record<string, string> } | null;
}

export default function FlowModal({ isOpen, onClose, onSave, initialData }: FlowModalProps) {
  const [flowName, setFlowName] = useState("");
  const [globalURL, setGlobalURL] = useState("");
  const [globalHeaders, setGlobalHeaders] = useState<KVPair[]>([]);
  const [globalVariables, setGlobalVariables] = useState<KVPair[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFlowName(initialData?.flowName ?? "");
      setGlobalURL(initialData?.globalURL ?? "");
      setGlobalHeaders(recordToKV(initialData?.globalHeaders ?? {}));
      setGlobalVariables(recordToKV(initialData?.globalVariables ?? {}));
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEditing = !!initialData;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!flowName.trim()) return;
    onSave({
      flowName: flowName.trim(),
      globalURL: globalURL.trim(),
      globalHeaders: kvToRecord(globalHeaders),
      globalVariables: kvToRecord(globalVariables),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container border border-outline-variant rounded-xl shadow-2xl w-[480px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">
              {isEditing ? "edit" : "add_circle"}
            </span>
            <span className="font-headline-md text-headline-md text-on-surface">
              {isEditing ? "Edit Flow" : "Create New Flow"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-xs rounded"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-lg space-y-lg max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Flow Name */}
          <div>
            <label className="text-[9px] text-outline uppercase block mb-xs tracking-widest">
              Flow Name <span className="text-error">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="e.g. User Registration Flow"
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-md py-sm font-code-sm text-code-sm text-on-surface focus:border-primary outline-none transition-colors placeholder:text-outline"
            />
          </div>

          {/* Global Base URL */}
          <div>
            <label className="text-[9px] text-outline uppercase block mb-xs tracking-widest">
              Global Base URL
            </label>
            <input
              type="text"
              value={globalURL}
              onChange={(e) => setGlobalURL(e.target.value)}
              placeholder="e.g. https://api.example.com/v1"
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-md py-sm font-code-sm text-code-sm text-on-surface focus:border-primary outline-none transition-colors placeholder:text-outline"
            />
          </div>

          {/* Global Headers */}
          <div>
            <label className="text-[9px] text-outline uppercase block mb-xs tracking-widest">
              Global Headers
            </label>
            <div className="bg-surface-container-high border border-outline-variant rounded-lg p-md">
              <KVEditor
                pairs={globalHeaders}
                onChange={setGlobalHeaders}
                keyPlaceholder="Header name"
                valuePlaceholder="Value or {{variable}}"
              />
            </div>
          </div>

          {/* Global Variables */}
          <div>
            <label className="text-[9px] text-outline uppercase block mb-xs tracking-widest">
              Global Variables
            </label>
            <div className="bg-surface-container-high border border-outline-variant rounded-lg p-md">
              <KVEditor
                pairs={globalVariables}
                onChange={setGlobalVariables}
                keyPlaceholder="Variable name"
                valuePlaceholder="Value"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-sm pt-sm border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-lg py-sm rounded-lg border border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface transition-all font-body-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!flowName.trim()}
              className="px-lg py-sm rounded-lg bg-primary text-on-primary-fixed font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-xs font-body-md"
            >
              <span className="material-symbols-outlined text-sm">
                {isEditing ? "save" : "add_circle"}
              </span>
              {isEditing ? "Save Changes" : "Create Flow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
