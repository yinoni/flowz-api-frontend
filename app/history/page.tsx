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

const EXECUTIONS: Execution[] = [
  { id: "fl_82193", flowName: "Business Onboarding", status: "SUCCESS", timestamp: "2 mins ago", duration: "1.2s" },
  { id: "fl_72001", flowName: "Auth Test", status: "FAILURE", timestamp: "Oct 24, 10:04 AM", duration: "0.8s" },
  { id: "fl_29384", flowName: "Inventory Sync", status: "SUCCESS", timestamp: "Oct 24, 09:45 AM", duration: "2.1s" },
  { id: "fl_11022", flowName: "Email Dispatcher", status: "SUCCESS", timestamp: "Oct 24, 08:30 AM", duration: "0.4s" },
];

const METRICS = [
  { label: "TOTAL RUNS", value: "1,284", valueColor: "text-on-surface", icon: "speed", iconColor: "text-primary", iconBg: "bg-primary-container/20" },
  { label: "SUCCESS RATE", value: "98.2%", valueColor: "text-secondary", icon: "check_circle", iconColor: "text-secondary", iconBg: "bg-secondary/10" },
  { label: "AVG LATENCY", value: "1.42s", valueColor: "text-on-surface", icon: "timer", iconColor: "text-tertiary", iconBg: "bg-tertiary/20" },
];

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
      <td className="px-md py-4 text-right">
        <button className="text-primary hover:underline text-body-sm font-semibold">View Details</button>
      </td>
    </tr>
  );
}

export default function HistoryPage() {
  const [filter, setFilter] = useState("");
  const filtered = EXECUTIONS.filter((e) =>
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
            <div className="flex items-center gap-sm">
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
              <button className="p-2 border border-outline-variant rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface-variant transition-all">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
            {METRICS.map((m) => (
              <div key={m.label} className="bg-surface-container border border-outline-variant rounded-xl p-md flex items-center gap-md">
                <div className={`w-12 h-12 rounded-lg ${m.iconBg} flex items-center justify-center ${m.iconColor} shrink-0`}>
                  <span className="material-symbols-outlined">{m.icon}</span>
                </div>
                <div>
                  <p className="text-label-caps font-label-caps text-outline">{m.label}</p>
                  <h2 className={`font-headline-lg text-headline-lg ${m.valueColor}`}>{m.value}</h2>
                </div>
              </div>
            ))}
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
                  <th className="px-md py-4 font-label-caps text-label-caps text-outline text-right">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((exec) => <ExecRow key={exec.id} exec={exec} />)
                ) : (
                  <tr>
                    <td colSpan={5} className="px-md py-xl text-center text-on-surface-variant font-body-md">
                      No executions match &quot;{filter}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="px-md py-md bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
              <span className="text-body-sm text-on-surface-variant">
                Showing {filtered.length} of 1,284 executions
              </span>
              <div className="flex items-center gap-sm">
                <button disabled className="p-1 border border-outline-variant rounded hover:bg-surface-variant disabled:opacity-40 disabled:cursor-not-allowed">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="p-1 border border-outline-variant rounded hover:bg-surface-variant">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant flex justify-between items-center px-lg h-12 shrink-0">
        <div className="flex items-center gap-lg">
          <span className="font-code-md text-code-md text-tertiary">FlowState Engine</span>
          <span className="font-code-sm text-code-sm text-outline">© 2024 FlowState Engine. All logs encrypted.</span>
        </div>
        <nav className="flex items-center gap-md">
          <a className="font-code-sm text-code-sm text-outline hover:text-tertiary transition-colors" href="#">Terminal</a>
          <a className="font-code-sm text-code-sm text-outline hover:text-tertiary transition-colors" href="#">Environment</a>
          <a className="font-code-sm text-code-sm text-tertiary font-bold" href="#">Console</a>
        </nav>
      </footer>
    </>
  );
}
