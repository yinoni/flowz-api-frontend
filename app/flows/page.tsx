"use client";

import { useState } from "react";

type FlowStatus = "ACTIVE" | "PAUSED" | "DRAFT";

interface SparkBar {
  height: number;
  opacity?: number;
}

interface Flow {
  id: string;
  name: string;
  status: FlowStatus;
  lastModified: string;
  successRate: string | null;
  successRateColor: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  sparkBars: SparkBar[];
  sparkColor: string;
  primaryAction: string;
}

const STATUS_CONFIG: Record<FlowStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: "ACTIVE",
    className: "bg-secondary-container text-on-secondary-container",
  },
  PAUSED: {
    label: "PAUSED",
    className: "bg-surface-container-highest text-on-surface-variant",
  },
  DRAFT: {
    label: "DRAFT",
    className:
      "bg-surface-container-highest text-on-surface-variant border border-outline-variant",
  },
};

const FLOWS: Flow[] = [
  {
    id: "1",
    name: "Business Onboarding",
    status: "ACTIVE",
    lastModified: "Oct 24, 2023",
    successRate: "98.2%",
    successRateColor: "text-secondary",
    icon: "hub",
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    sparkBars: [
      { height: 4, opacity: 30 },
      { height: 6, opacity: 50 },
      { height: 5 },
      { height: 8 },
      { height: 6 },
      { height: 7 },
    ],
    sparkColor: "bg-secondary",
    primaryAction: "Run",
  },
  {
    id: "2",
    name: "Inventory Sync",
    status: "PAUSED",
    lastModified: "Oct 20, 2023",
    successRate: null,
    successRateColor: "text-on-surface-variant",
    icon: "sync",
    iconColor: "text-tertiary",
    iconBg: "bg-tertiary/10",
    sparkBars: [{ height: 4 }, { height: 4 }, { height: 4 }, { height: 4 }, { height: 4 }],
    sparkColor: "bg-outline-variant",
    primaryAction: "Resume",
  },
  {
    id: "3",
    name: "Auth Test",
    status: "DRAFT",
    lastModified: "Oct 18, 2023",
    successRate: "42% (failing)",
    successRateColor: "text-error",
    icon: "verified_user",
    iconColor: "text-secondary",
    iconBg: "bg-secondary/10",
    sparkBars: [
      { height: 8 },
      { height: 3, opacity: 40 },
      { height: 7 },
      { height: 2, opacity: 20 },
      { height: 6 },
    ],
    sparkColor: "bg-error",
    primaryAction: "Debug",
  },
];

function Sparkline({ bars, color }: { bars: SparkBar[]; color: string }) {
  return (
    <div className="h-8 w-24 flex items-end gap-1">
      {bars.map((bar, i) => (
        <div
          key={i}
          className={`w-1 rounded-full ${color}`}
          style={{
            height: `${bar.height * 4}px`,
            opacity: bar.opacity !== undefined ? bar.opacity / 100 : 1,
          }}
        />
      ))}
    </div>
  );
}

function FlowCard({ flow }: { flow: Flow }) {
  const { label, className } = STATUS_CONFIG[flow.status];
  return (
    <div className="flow-card-hover bg-surface-container-low border border-outline-variant rounded-xl p-md transition-all duration-300 cursor-pointer">
      <div className="flex justify-between items-start mb-md">
        <div className={`p-sm ${flow.iconBg} rounded-lg`}>
          <span className={`material-symbols-outlined ${flow.iconColor}`}>{flow.icon}</span>
        </div>
        <span className={`${className} px-sm py-xs rounded-full font-label-caps text-label-caps`}>
          {label}
        </span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">{flow.name}</h3>
      <p className="text-on-surface-variant text-body-sm mb-md font-code-sm">
        Last modified: {flow.lastModified}
      </p>
      <div className="bg-surface-container p-sm rounded-lg border border-outline-variant mb-md flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-label-caps text-on-surface-variant mb-xs">SUCCESS RATE</span>
          <span className={`font-code-md text-code-md ${flow.successRateColor}`}>
            {flow.successRate ?? "--"}
          </span>
        </div>
        <Sparkline bars={flow.sparkBars} color={flow.sparkColor} />
      </div>
      <div className="flex items-center justify-between border-t border-outline-variant pt-md">
        <div className="flex gap-sm">
          <button className="px-md py-1.5 rounded-lg border border-outline-variant text-body-sm hover:border-primary hover:text-primary transition-all">
            Edit
          </button>
          <button className="px-md py-1.5 rounded-lg border border-outline-variant text-body-sm hover:border-secondary hover:text-secondary transition-all">
            {flow.primaryAction}
          </button>
        </div>
        <button className="p-1.5 text-on-surface-variant hover:bg-surface-variant rounded-lg">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>
    </div>
  );
}

export default function MyFlowsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {/* Content */}
      <section className="flex-1 overflow-y-auto p-lg bg-surface-dim custom-scrollbar">
        {/* Page Header */}
        <div className="flex justify-between items-end mb-xl">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">My Flows</h2>
            <p className="text-on-surface-variant font-body-md">
              Manage and monitor your automated architecture.
            </p>
          </div>
          <button className="flex items-center gap-sm bg-primary text-on-primary-fixed font-bold px-lg py-3 rounded-lg hover:opacity-90 transition-all active:scale-95">
            <span className="material-symbols-outlined">add_circle</span>
            Create New Flow
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between mb-lg bg-surface-container-low p-sm rounded-xl border border-outline-variant">
          <div className="flex items-center gap-sm">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">
                search
              </span>
              <input
                className="bg-surface-container border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-on-surface text-body-md focus:border-primary w-56 transition-all outline-none"
                placeholder="Search flows..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-xs px-md py-2 bg-surface-container-highest text-on-surface rounded-lg font-body-md border border-outline-variant hover:bg-surface-bright transition-colors">
              <span className="material-symbols-outlined">filter_list</span>
              Filter
            </button>
            <button className="flex items-center gap-xs px-md py-2 text-on-surface-variant hover:text-on-surface transition-colors font-body-md">
              <span className="material-symbols-outlined">sort</span>
              Sorted by Name
            </button>
          </div>
          <div className="flex items-center gap-xs text-on-surface-variant text-body-sm mr-sm">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span>12 Flows Active</span>
          </div>
        </div>

        {/* Flow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {FLOWS.map((flow) => (
            <FlowCard key={flow.id} flow={flow} />
          ))}
          <div className="border-2 border-dashed border-outline-variant rounded-xl p-md flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 hover:border-primary hover:bg-surface-container-low transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center mb-md group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">
              Start from Template
            </h3>
            <p className="text-on-surface-variant text-body-sm px-lg">
              Browse curated logic patterns to accelerate development.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest font-code-sm text-code-sm h-12 flex justify-between items-center px-lg border-t border-outline-variant shrink-0">
        <div className="flex items-center gap-lg">
          <span className="font-code-md text-code-md text-tertiary">FlowState Engine</span>
          <span className="text-outline">© 2024 FlowState Engine. All logs encrypted.</span>
        </div>
        <div className="flex items-center gap-md">
          <a className="text-outline hover:text-tertiary transition-colors" href="#">Terminal</a>
          <a className="text-tertiary font-bold" href="#">Environment</a>
          <a className="text-outline hover:text-tertiary transition-colors" href="#">Console</a>
          <div className="h-4 w-px bg-outline-variant mx-xs" />
          <div className="flex items-center gap-xs">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-secondary opacity-90">v1.24.4-STABLE</span>
          </div>
        </div>
      </footer>
    </>
  );
}
