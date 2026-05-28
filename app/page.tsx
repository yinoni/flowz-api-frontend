"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "./store/store";
import {
  addStepToFlow,
  updateStepInFlow,
  removeStepFromFlow,
  setActiveFlow,
  createFlow,
} from "./store/flowsSlice";
import type { Step, StepFormData } from "./store/stepsSlice";
import NewRequestModal from "./components/NewRequestModal";
import FlowCanvas from "./components/FlowCanvas";
import GlobalVariableModal from "./components/GlobalVariableModal";
import GlobalAssertionModal from "./components/GlobalAssertionModal";

type LogStatus =
  | "STEP_PASSED"
  | "STEP_RUNNING"
  | "STEP_FAILED"
  | "FLOW_STARTING"
  | "FLOW_COMPLETED"
  | "INFO";

interface LogEntry {
  id: string;
  timestamp: string;
  status: LogStatus;
  message: string;
}

const INITIAL_LOGS: LogEntry[] = [
  {
    id: "1",
    timestamp: "[10:04:22]",
    status: "STEP_PASSED",
    message: "STEP 1 COMPLETE: Login successful. Token extracted. (244ms)",
  },
  {
    id: "2",
    timestamp: "[10:04:23]",
    status: "STEP_PASSED",
    message: 'STEP 2 COMPLETE: Business "Nexus Corp" created. ID: 882910. (512ms)',
  },
  {
    id: "3",
    timestamp: "[10:04:24]",
    status: "STEP_RUNNING",
    message: "STEP 3 RUNNING: Saving business reference...",
  },
  {
    id: "4",
    timestamp: "",
    status: "INFO",
    message: "Connecting to localhost:8080/api/users/saved/882910...",
  },
];

function LogLine({ log }: { log: LogEntry }) {
  if (log.status === "STEP_PASSED" || log.status === "FLOW_COMPLETED") {
    return (
      <div className="flex items-start gap-md group">
        <span className="text-outline w-24 shrink-0">{log.timestamp}</span>
        <span className="material-symbols-outlined text-secondary-fixed text-sm">check_circle</span>
        <span className="text-secondary-fixed">{log.message}</span>
      </div>
    );
  }
  if (log.status === "STEP_RUNNING" || log.status === "FLOW_STARTING") {
    return (
      <div className="flex items-start gap-md group">
        <span className="text-outline w-24 shrink-0">{log.timestamp}</span>
        <span className="material-symbols-outlined text-tertiary text-sm animate-spin">refresh</span>
        <span className="text-tertiary">{log.message}</span>
      </div>
    );
  }
  if (log.status === "STEP_FAILED") {
    return (
      <div className="flex items-start gap-md group">
        <span className="text-outline w-24 shrink-0">{log.timestamp}</span>
        <span className="material-symbols-outlined text-error text-sm">error</span>
        <span className="text-error">{log.message}</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-md text-outline italic">
      <span className="w-24 shrink-0">{log.timestamp}</span>
      <span>{log.message}</span>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { flows, activeFlowId } = useSelector((state: RootState) => state.flows);
  const activeProjectId = useSelector((state: RootState) => state.projects.activeProjectId);
  const activeFlow = flows.find((f) => f.id === activeFlowId) ?? null;
  const steps = activeFlow?.steps ?? [];

  const [logs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isAssertionModalOpen, setIsAssertionModalOpen] = useState(false);

  function openAddModal() {
    setEditingStep(null);
    setIsModalOpen(true);
  }

  function openEditModal(step: Step) {
    setEditingStep(step);
    setIsModalOpen(true);
  }

  function handleSave(data: StepFormData) {
    if (!activeFlowId) return;
    if (editingStep) {
      dispatch(updateStepInFlow({ flowId: activeFlowId, step: { ...data, id: editingStep.id, position: editingStep.position } }));
    } else {
      dispatch(addStepToFlow({ flowId: activeFlowId, stepData: data }));
    }
    setIsModalOpen(false);
    setEditingStep(null);
  }

  // No active flow — prompt user to select or create one
  if (!activeFlow) {
    return (
      <>
        <div className="flex-1 flex flex-col justify-center bg-background canvas-grid gap-lg">
          <div className="text-center w-[480px] mx-auto">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-lg">
              <span className="material-symbols-outlined text-3xl text-outline">account_tree</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">No Flow Selected</h2>
            <p className="text-on-surface-variant font-body-md mb-xl">
              Open an existing flow from My Flows, or create a new one to start building.
            </p>
            <div className="flex gap-md justify-center">
              <button
                onClick={() => router.push("/flows")}
                className="flex items-center gap-sm px-lg py-sm rounded-lg border border-outline-variant text-on-surface hover:border-primary hover:text-primary transition-all font-body-md"
              >
                <span className="material-symbols-outlined">folder_open</span>
                My Flows
              </button>
              <button
                onClick={() => {
                    dispatch(createFlow({ flowName: "Untitled Flow", status: "DRAFT", projectId: activeProjectId ?? '' }));
                }}
                className="flex items-center gap-sm px-lg py-sm rounded-lg bg-primary text-on-primary-fixed font-bold hover:opacity-90 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">add_circle</span>
                New Flow
              </button>
            </div>
          </div>
        </div>
        <footer className="bg-surface-container-lowest border-t border-outline-variant flex flex-col w-full h-[180px] z-30 shrink-0">
          <div className="h-xl flex justify-between items-center px-lg border-b border-outline-variant bg-surface-container-low shrink-0">
            <span className="font-code-md text-code-md text-tertiary">RUN EXECUTION</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-outline font-code-sm text-code-sm">No flow selected.</span>
          </div>
        </footer>
      </>
    );
  }

  return (
    <>
      {/* Canvas + Right Inspector */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Center Canvas */}
        <FlowCanvas
          steps={steps}
          onStepClick={openEditModal}
          onStepDelete={(stepId) =>
            dispatch(removeStepFromFlow({ flowId: activeFlowId!, stepId }))
          }
        />

        {/* Right Inspector */}
        <aside className="bg-surface-container-low border-l border-outline-variant flex flex-col h-full py-md px-sm w-inspector-width shrink-0 z-20">
          <div className="mb-lg px-sm">
            <div className="font-headline-md text-headline-md text-secondary">Step Palette</div>
            <div className="text-on-surface-variant text-[10px] uppercase tracking-widest opacity-70">
              Click to add
            </div>
          </div>
          <div className="grid grid-cols-2 gap-sm">
            {(
              [
                { icon: "http", label: "Request", color: "secondary" },
                { icon: "timer", label: "Wait", color: null },
                { icon: "abc", label: "Variable", color: "primary" },
                { icon: "verified_user", label: "Assert", color: "tertiary" },
              ] as const
            ).map(({ icon, label, color }) => {
              const onClick =
                label === "Request"
                  ? openAddModal
                  : label === "Variable"
                  ? () => setIsVariableModalOpen(true)
                  : label === "Assert"
                  ? () => setIsAssertionModalOpen(true)
                  : undefined;
              const isClickable = !!onClick;
              const accentColor =
                color === "primary"
                  ? "border-primary hover:bg-surface-container-high"
                  : color === "tertiary"
                  ? "border-tertiary hover:bg-surface-container-high"
                  : color === "secondary"
                  ? "border-secondary hover:bg-surface-container-high"
                  : "border-outline-variant hover:border-secondary";
              const iconColor =
                color === "primary"
                  ? "text-primary"
                  : color === "tertiary"
                  ? "text-tertiary"
                  : "text-secondary";
              return (
                <div
                  key={label}
                  onClick={onClick}
                  className={`flex flex-col items-center justify-center p-md bg-surface-container border rounded-lg transition-all group ${accentColor} ${
                    isClickable ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
                  }`}
                >
                  <span className={`material-symbols-outlined ${iconColor} mb-xs`}>{icon}</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant group-hover:text-secondary">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-lg px-sm border-t border-outline-variant pt-lg">
            <div className="font-label-caps text-label-caps text-outline mb-md uppercase">
              Flow Inspector
            </div>
            <div className="bg-background rounded p-sm space-y-md">
              <div>
                <label className="text-[9px] text-outline uppercase block mb-1">Flow Name</label>
                <div className="w-full bg-surface-container-high border border-outline-variant rounded px-xs py-1 font-code-sm text-code-sm text-primary truncate">
                  {activeFlow.flowName}
                </div>
              </div>
              {activeFlow.globalURL && (
                <div>
                  <label className="text-[9px] text-outline uppercase block mb-1">Base URL</label>
                  <div className="font-code-sm text-code-sm text-on-surface-variant truncate">
                    {activeFlow.globalURL}
                  </div>
                </div>
              )}
              <div>
                <label className="text-[9px] text-outline uppercase block mb-1">Steps</label>
                <div className="font-code-md text-code-md text-secondary">{steps.length}</div>
              </div>
              <button
                onClick={() => router.push("/flows")}
                className="w-full flex items-center justify-center gap-xs px-md py-xs rounded border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all font-body-sm text-body-sm mt-sm"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to My Flows
              </button>
            </div>
          </div>
        </aside>
      </div>

      <NewRequestModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingStep(null); }}
        onSave={handleSave}
        initialStep={editingStep}
        defaultUrl={activeFlow.globalURL || undefined}
      />
      <GlobalVariableModal
        isOpen={isVariableModalOpen}
        onClose={() => setIsVariableModalOpen(false)}
      />
      <GlobalAssertionModal
        isOpen={isAssertionModalOpen}
        onClose={() => setIsAssertionModalOpen(false)}
      />

      {/* Execution Terminal */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant flex flex-col w-full h-[180px] z-30 shrink-0">
        <div className="h-xl flex justify-between items-center px-lg border-b border-outline-variant bg-surface-container-low shrink-0">
          <div className="flex items-center gap-md">
            <span className="font-code-md text-code-md text-tertiary">RUN EXECUTION</span>
            <div className="flex items-center gap-xs ml-lg">
              <div className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
              <span className="font-code-sm text-code-sm text-on-surface-variant">
                Active: {activeFlow.flowName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-md">
            <nav className="flex gap-md font-code-sm text-code-sm">
              <a className="text-tertiary font-bold" href="#">Terminal</a>
              <a className="text-outline hover:text-tertiary transition-colors" href="#">Environment</a>
              <a className="text-outline hover:text-tertiary transition-colors" href="#">Console</a>
            </nav>
            <button className="bg-secondary-container text-on-secondary-container px-md py-xs rounded flex items-center gap-xs hover:opacity-80 transition-all font-bold font-code-sm text-code-sm">
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              Start
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-md custom-scrollbar font-code-sm text-code-sm space-y-1">
          {logs.map((log) => (
            <LogLine key={log.id} log={log} />
          ))}
        </div>
        <div className="h-6 px-lg flex items-center justify-between border-t border-outline-variant bg-surface-container-lowest shrink-0">
          <div className="text-[10px] text-outline">© 2024 FlowState Engine. All logs encrypted.</div>
          <div className="text-[10px] text-outline flex gap-md">
            <span>CPU: 12%</span>
            <span>MEM: 512MB</span>
            <span>WS: Connected</span>
          </div>
        </div>
      </footer>
    </>
  );
}
