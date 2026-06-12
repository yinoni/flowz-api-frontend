"use client";

import { useState } from "react";

type ExecStatus = "SUCCESS" | "FAILURE";

interface Execution {
  id: string;
  flowName: string;
  status: ExecStatus;
  timestamp: string;
  duration: string;
}

function StatusIcon({ status }: { status: ExecStatus }) {
  return status === "SUCCESS" ? (
    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
      check_circle
    </span>
  ) : (
    <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
      error
    </span>
  );
}

function ExecRow({ exec }: { exec: Execution }) {
  return (
    <tr className="hover:bg-surface-variant/30 transition-colors border-b border-outline-variant/50 last:border-0">
      <td className="px-md py-4"><StatusIcon status={exec.status} /></td>
      <td className="px-md py-4">
        <div className="flex flex-col">
          <span className="text-on-surface font-semibold">{exec.flowName}</span>
          <span className="font-code-sm text-code-sm text-outline">ID: {exec.id}</span>
        </div>
      </td>
      <td className="px-md py-4 text-on-surface-variant font-body-md">{exec.timestamp}</td>
      <td className="px-md py-4">
        <span className="bg-surface-container-low border border-outline-variant px-2 py-0.5 rounded font-code-sm text-code-sm">
          {exec.duration}
        </span>
      </td>
    </tr>
  );
}

const executions: Execution[] = [];

export default function HistoryPage() {
  const [filter, setFilter] = useState("");
  const filtered = executions.filter((e) =>
    e.flowName.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto canvas-grid p-lg custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">
                Execution History
              </h1>
              <p className="text-on-surface-variant font-body-md">
                Track and monitor your automated flow performances.
              </p>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                className="bg-surface-container-low border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-body-md focus:border-primary outline-none w-64 transition-all"
                placeholder="Filter by flow name..."
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-high border-b border-outline-variant">
                <tr>
                  <th className="px-md py-4 font-label-caps text-label-caps text-outline">STATUS</th>
                  <th className="px-md py-4 font-label-caps text-label-caps text-outline">FLOW NAME</th>
                  <th className="px-md py-4 font-label-caps text-label-caps text-outline">DATE / TIME</th>
                  <th className="px-md py-4 font-label-caps text-label-caps text-outline">DURATION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((exec) => <ExecRow key={exec.id} exec={exec} />)
                ) : (
                  <tr>
                    <td colSpan={4} className="px-md py-xl text-center text-on-surface-variant font-body-md">
                      {filter ? `No executions match "${filter}"` : "No execution history yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="px-md py-md bg-surface-container-low border-t border-outline-variant">
              <span className="text-body-sm text-on-surface-variant">
                Showing {filtered.length} execution{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant flex justify-between items-center px-lg h-12 shrink-0">
        <span className="font-code-md text-code-md text-tertiary">FlowZ Engine</span>
        <span className="font-code-sm text-code-sm text-outline">© 2024 FlowZ Engine.</span>
      </footer>
    </>
  );
}
