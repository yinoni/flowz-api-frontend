"use client";

import { useState, useEffect } from "react";
import type { FlowStatus } from "../store/flowsSlice";

interface FlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { flowName: string; status: FlowStatus; globalURL: string }) => void;
  initialData?: { flowName: string; status: FlowStatus; globalURL: string } | null;
}

const STATUS_OPTIONS: { value: FlowStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "PAUSED", label: "Paused" },
];

export default function FlowModal({ isOpen, onClose, onSave, initialData }: FlowModalProps) {
  const [flowName, setFlowName] = useState("");
  const [status, setStatus] = useState<FlowStatus>("DRAFT");
  const [globalURL, setGlobalURL] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFlowName(initialData?.flowName ?? "");
      setStatus(initialData?.status ?? "DRAFT");
      setGlobalURL(initialData?.globalURL ?? "");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEditing = !!initialData;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!flowName.trim()) return;
    onSave({ flowName: flowName.trim(), status, globalURL: globalURL.trim() });
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
        <form onSubmit={handleSubmit} className="p-lg space-y-lg">
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

          {/* Status */}
          <div>
            <label className="text-[9px] text-outline uppercase block mb-xs tracking-widest">
              Status
            </label>
            <div className="flex gap-sm">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`flex-1 py-sm rounded-lg border font-label-caps text-label-caps transition-all ${
                    status === opt.value
                      ? opt.value === "ACTIVE"
                        ? "border-secondary bg-secondary-container text-on-secondary-container"
                        : opt.value === "PAUSED"
                        ? "border-outline bg-surface-container-highest text-on-surface"
                        : "border-primary bg-primary/10 text-primary"
                      : "border-outline-variant text-on-surface-variant hover:border-outline"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
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
