"use client";

import { useEffect, useState } from "react";
import type { Step, StepFormData } from "../store/stepsSlice";
import SelectDropdown from "./SelectDropdown";
import type { SelectOption } from "./SelectDropdown";
import KVEditor, { type KVPair, recordToKV, kvToRecord } from "./KVEditor";

type Tab = "body" | "headers" | "extract" | "assertions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: StepFormData) => void;
  initialStep?: Step | null;
  defaultUrl?: string;
  isFallback?: boolean;
}

const HTTP_METHODS: SelectOption[] = [
  { label: "GET",    value: "GET",    color: "text-green-400"  },
  { label: "POST",   value: "POST",   color: "text-yellow-400" },
  { label: "PUT",    value: "PUT",    color: "text-purple-400" },
  { label: "PATCH",  value: "PATCH",  color: "text-pink-400"   },
  { label: "DELETE", value: "DELETE", color: "text-red-400"    },
];

const CONTENT_TYPES: SelectOption[] = [
  { label: "Raw", value: "text/plain" },
  { label: "JSON", value: "application/json" },
  { label: "XML", value: "application/xml" },
  { label: "HTML", value: "text/html" },
  { label: "Form URL-Encoded", value: "application/x-www-form-urlencoded" },
  { label: "Form Data", value: "multipart/form-data" },
  { label: "JavaScript", value: "application/javascript" },
];

export default function NewRequestModal({ isOpen, onClose, onSave, initialStep, defaultUrl, isFallback }: Props) {
  const isEditing = !!initialStep;

  const [activeTab, setActiveTab] = useState<Tab>("body");
  const [title, setTitle] = useState("");
  const [method, setMethod] = useState("POST");
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");
  const [headers, setHeaders] = useState<KVPair[]>([]);
  const [extract, setExtract] = useState<KVPair[]>([]);
  const [assertions, setAssertions] = useState<KVPair[]>([]);
  const [contentType, setContentType] = useState("text/plain");

  useEffect(() => {
    if (!isOpen) return;
    if (initialStep) {
      setTitle(initialStep.title);
      setMethod(initialStep.httpMethod);
      setUrl(initialStep.url);
      setBody(initialStep.body);
      const { "Content-Type": _ct, ...headersWithoutCT } = initialStep.headers;
      setHeaders(recordToKV(headersWithoutCT));
      setExtract(recordToKV(initialStep.extract));
      setAssertions(recordToKV(initialStep.assertions));
      const existingCT = initialStep.headers["Content-Type"];
      setContentType(existingCT && CONTENT_TYPES.some((ct) => ct.value === existingCT) ? existingCT : "text/plain");
    } else {
      setTitle("");
      setMethod("POST");
      setUrl(defaultUrl ?? "");
      setBody("");
      setHeaders([]);
      setExtract([]);
      setAssertions([]);
      setContentType("text/plain");
    }
    setActiveTab("body");
  }, [isOpen, initialStep]);

  if (!isOpen) return null;

  function handleSave() {
    onSave({
      title: title.trim() || (isFallback ? "FALLBACK" : "STEP"),
      httpMethod: method,
      url,
      body,
      headers: body.trim() ? { ...kvToRecord(headers), "Content-Type": contentType } : kvToRecord(headers),
      extract: kvToRecord(extract),
      assertions: kvToRecord(assertions),
      routes: {},
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
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isFallback ? 'bg-error/20' : 'bg-secondary-container/20'}`}>
              <span className={`material-symbols-outlined ${isFallback ? 'text-error' : 'text-secondary'}`}>
                {isFallback ? 'alt_route' : 'http'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-sm">
                <h2 className="font-headline-lg text-headline-lg text-on-surface">
                  {isEditing
                    ? isFallback ? "Edit Fallback Step" : "Edit Request Step"
                    : isFallback ? "Configure Fallback Step" : "Configure Request Step"}
                </h2>
                {isFallback && (
                  <span className="px-xs py-0.5 rounded text-[9px] font-bold tracking-widest uppercase bg-error/20 text-error border border-error/30">
                    FALLBACK
                  </span>
                )}
              </div>
              <p className="font-body-sm text-body-sm text-outline">
                {isFallback
                  ? "Triggered when a parent step returns a matched status code"
                  : "Define your HTTP outbound call parameters"}
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
              <SelectDropdown
                label="METHOD"
                options={HTTP_METHODS}
                value={method}
                onChange={setMethod}
              />
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
              {/(localhost|127\.0\.0\.1)/i.test(url) && (
                <div className="flex items-start gap-xs mt-xs px-sm py-xs rounded-lg bg-yellow-400/10 border border-yellow-400/30">
                  <span className="material-symbols-outlined text-yellow-400 text-sm shrink-0 mt-0.5">warning</span>
                  <p className="font-body-sm text-body-sm text-yellow-300">
                    <span className="font-bold">localhost</span> and <span className="font-bold">127.0.0.1</span> are only reachable from your own machine. Use a publicly accessible URL instead.
                  </p>
                </div>
              )}
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
                <div className="space-y-sm">
                  <SelectDropdown
                    label="CONTENT TYPE"
                    layout="inline"
                    options={CONTENT_TYPES}
                    value={contentType}
                    onChange={setContentType}
                  />
                  <div className="bg-surface-container-lowest rounded-lg border border-outline-variant p-sm">
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={6}
                      spellCheck={false}
                      placeholder='{ "key": "value" }'
                      className="w-full bg-transparent border-none text-secondary font-code-md text-code-md focus:ring-0 resize-none outline-none placeholder:text-outline-variant"
                    />
                  </div>
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
            className={`px-xl py-md rounded-lg font-extrabold shadow-lg transition-all active:scale-95 flex items-center gap-sm ${
              isFallback
                ? 'bg-error text-on-error shadow-error/20'
                : 'bg-primary text-on-primary shadow-primary/20'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isEditing ? "save" : "add"}
            </span>
            {isEditing ? "Save Changes" : isFallback ? "Add Fallback" : "Add to Flow"}
          </button>
        </div>
      </div>
    </div>
  );
}
