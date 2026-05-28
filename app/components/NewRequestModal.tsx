"use client";

import { useEffect, useState } from "react";
import type { Step, StepFormData } from "../store/stepsSlice";

type Tab = "body" | "headers" | "extract" | "assertions";

interface KVPair {
  key: string;
  value: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: StepFormData) => void;
  initialStep?: Step | null;
  defaultUrl?: string;
}

function KVEditor({
  pairs,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
}: {
  pairs: KVPair[];
  onChange: (pairs: KVPair[]) => void;
  keyPlaceholder: string;
  valuePlaceholder: string;
}) {
  function update(index: number, field: "key" | "value", val: string) {
    const next = pairs.map((p, i) => (i === index ? { ...p, [field]: val } : p));
    onChange(next);
  }
  function remove(index: number) {
    onChange(pairs.filter((_, i) => i !== index));
  }
  function add() {
    onChange([...pairs, { key: "", value: "" }]);
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
          <button
            onClick={() => remove(i)}
            className="text-on-surface-variant hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="text-primary font-label-caps text-label-caps hover:underline flex items-center gap-xs mt-xs"
      >
        <span className="material-symbols-outlined text-[16px]">add</span>
        ADD ROW
      </button>
    </div>
  );
}

function recordToKV(record: Record<string, string>): KVPair[] {
  return Object.entries(record).map(([key, value]) => ({ key, value }));
}

function kvToRecord(pairs: KVPair[]): Record<string, string> {
  return Object.fromEntries(pairs.filter((p) => p.key.trim()).map((p) => [p.key, p.value]));
}

export default function NewRequestModal({ isOpen, onClose, onSave, initialStep, defaultUrl }: Props) {
  const isEditing = !!initialStep;

  const [activeTab, setActiveTab] = useState<Tab>("body");
  const [title, setTitle] = useState("");
  const [method, setMethod] = useState("POST");
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");
  const [headers, setHeaders] = useState<KVPair[]>([]);
  const [extract, setExtract] = useState<KVPair[]>([]);
  const [assertions, setAssertions] = useState<KVPair[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialStep) {
      setTitle(initialStep.title);
      setMethod(initialStep.httpMethod);
      setUrl(initialStep.url);
      setBody(initialStep.body);
      setHeaders(recordToKV(initialStep.headers));
      setExtract(recordToKV(initialStep.extract));
      setAssertions(recordToKV(initialStep.assertions));
    } else {
      setTitle("");
      setMethod("POST");
      setUrl(defaultUrl ?? "");
      setBody("");
      setHeaders([]);
      setExtract([]);
      setAssertions([]);
    }
    setActiveTab("body");
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  function handleSave() {
    onSave({
      title: title.trim() || "STEP",
      httpMethod: method,
      url,
      body,
      headers: kvToRecord(headers),
      extract: kvToRecord(extract),
      assertions: kvToRecord(assertions),
    });
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "body", label: "Body" },
    { id: "headers", label: "Headers" },
    { id: "extract", label: "Extract" },
    { id: "assertions", label: "Assertions" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-md backdrop-blur-sm bg-background/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-xl py-lg bg-surface-container-highest border-b border-outline-variant flex justify-between items-center shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-10 h-10 rounded-lg bg-secondary-container/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">http</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                {isEditing ? "Edit Request Step" : "Configure Request Step"}
              </h2>
              <p className="font-body-sm text-body-sm text-outline">
                Define your HTTP outbound call parameters
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-xl space-y-lg custom-scrollbar">
          {/* Step name */}
          <div>
            <label className="block font-label-caps text-label-caps text-outline mb-xs">
              STEP NAME
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.toUpperCase())}
              placeholder="e.g. LOGIN"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-sm text-on-surface font-code-md text-code-md placeholder:text-outline-variant focus:border-primary outline-none transition-colors"
            />
          </div>

          {/* Method + URL */}
          <div className="flex gap-md">
            <div className="w-32 shrink-0">
              <label className="block font-label-caps text-label-caps text-outline mb-xs">
                METHOD
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-sm text-on-surface font-code-md text-code-md focus:border-primary outline-none transition-colors cursor-pointer appearance-none"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block font-label-caps text-label-caps text-outline mb-xs">URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-sm text-on-surface font-code-md text-code-md placeholder:text-outline-variant focus:border-primary outline-none transition-colors"
                placeholder="https://api.example.com/v1/resource"
                type="text"
              />
            </div>
          </div>

          {/* Tabbed section */}
          <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-low">
            <div className="flex border-b border-outline-variant bg-surface-container">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-lg py-md font-label-caps text-label-caps transition-colors capitalize ${
                    activeTab === tab.id
                      ? "text-primary border-b-2 border-primary bg-surface-container-high"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-md min-h-[160px]">
              {activeTab === "body" && (
                <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-sm relative">
                  <div className="absolute top-2 right-2 font-code-sm text-code-sm text-outline-variant pointer-events-none">
                    JSON
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    spellCheck={false}
                    placeholder='{ "key": "value" }'
                    className="w-full bg-transparent border-none text-secondary font-code-md text-code-md focus:ring-0 resize-none outline-none placeholder:text-outline-variant"
                  />
                </div>
              )}
              {activeTab === "headers" && (
                <KVEditor
                  pairs={headers}
                  onChange={setHeaders}
                  keyPlaceholder="Header name"
                  valuePlaceholder="Value or {{variable}}"
                />
              )}
              {activeTab === "extract" && (
                <KVEditor
                  pairs={extract}
                  onChange={setExtract}
                  keyPlaceholder="Variable name"
                  valuePlaceholder="response.body.token"
                />
              )}
              {activeTab === "assertions" && (
                <KVEditor
                  pairs={assertions}
                  onChange={setAssertions}
                  keyPlaceholder="Field (e.g. status)"
                  valuePlaceholder="Expected value (e.g. 200)"
                />
              )}
            </div>
          </div>
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
            className="px-xl py-md rounded-lg bg-primary text-on-primary font-extrabold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-sm"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isEditing ? "save" : "add"}
            </span>
            {isEditing ? "Save Changes" : "Add to Flow"}
          </button>
        </div>
      </div>
    </div>
  );
}
