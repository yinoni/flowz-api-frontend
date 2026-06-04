"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "./store/store";
import {
  addStepToFlow,
  updateStepInFlow,
  removeStepFromFlow,
  setActiveFlow,
  setFlowSteps,
  createFlow,
  setExecutionId,
  reorderSteps,
  FlowWSResponse,
} from "./store/flowsSlice";
import type { Step, StepFormData } from "./store/stepsSlice";
import NewRequestModal from "./components/NewRequestModal";
import FlowCanvas from "./components/FlowCanvas";
import GlobalKVModal from "./components/GlobalKVModal";
import { addStep as addStepAPI, createFlow as createFlowAPI, deleteStep as deleteStepAPI, editStep as editStepAPI, getFlowSteps } from "./api/flowRoute";
import { executeFlow, getExecutionID } from "./api/flowExecutionAPI";
import { useWebSocket } from "./components/WebSocketProvider";
import { reorderSteps as reorderStepsAPI } from "./api/flowRoute";
import { useToast } from "./components/ToastProvider";

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
  const { showToast } = useToast();
  const { flows, activeFlowId, executionId } = useSelector((state: RootState) => state.flows);
  const activeProjectId = useSelector((state: RootState) => state.projects.activeProjectId);
  const activeFlow = flows.find((f) => f.id === activeFlowId) ?? null;
  const steps = activeFlow?.steps ?? [];
  const {stompClient, isConnected} = useWebSocket();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!activeFlowId) return;
    getFlowSteps(activeFlowId).then((result) => {
      if (result.success) {
        dispatch(setFlowSteps({ flowId: activeFlowId, steps: result.data }));
      }
    });
  }, [activeFlowId]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stepResults, setStepResults] = useState<Record<string, boolean>>({});

  const KNOWN_WS_KEYS = new Set(["status", "success", "message"]);
  function extractStepResult(payload: FlowWSResponse): { stepId: string; passed: boolean } | null {
    const stepId = Object.keys(payload).find((k) => !KNOWN_WS_KEYS.has(k));
    if (!stepId) return null;
    return { stepId, passed: payload.success };
  }

  function addLog(status: LogStatus, message: string) {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const timestamp = `[${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}]`;
    setLogs((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, timestamp, status, message }]);
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isAssertionModalOpen, setIsAssertionModalOpen] = useState(false);
  const [isHeadersModalOpen, setIsHeadersModalOpen] = useState(false);

  function openAddModal() {
    setEditingStep(null);
    setIsModalOpen(true);
  }

  function openEditModal(step: Step) {
    setEditingStep(step);
    setIsModalOpen(true);
  }

  async function handleSave(data: StepFormData) {
    if (!activeFlowId) return;
    if (editingStep) {
      const result = await editStepAPI(activeFlowId, editingStep.id, data);
      if (result.success) {
        dispatch(updateStepInFlow({ flowId: activeFlowId, step: { ...data, id: editingStep.id, position: editingStep.position } }));
      }
        
    } else {
      const stepId = Date.now().toString();
      const result = await addStepAPI(activeFlowId, stepId, data);
      if (result.success) {
        dispatch(addStepToFlow({ flowId: activeFlowId, stepData: data, stepId }));
      }
    }
    setIsModalOpen(false);
    setEditingStep(null);
  }

  const reorderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isReorderPending, setIsReorderPending] = useState(false);

  async function handleReorderSteps(orderedIds: string[]) {
    if (!activeFlowId) return;
    dispatch(reorderSteps({ flowId: activeFlowId, orderedIds }));

    setIsReorderPending(true);
    if (reorderDebounceRef.current) clearTimeout(reorderDebounceRef.current);
    reorderDebounceRef.current = setTimeout(async () => {
      const apiResponse = await reorderStepsAPI(activeFlowId, orderedIds);
      setIsReorderPending(false);
      if (apiResponse.success) {
        showToast("Step order saved successfully.", "success");
      } else {
        showToast("Failed to save step order. Please try again.", "error");
      }
    }, 1500);
  }

  async function handleDeleteStep(stepId: string) {
    if (!activeFlowId) return;
    const result = await deleteStepAPI(activeFlowId, stepId);
    if (result.success) {
      dispatch(removeStepFromFlow({ flowId: activeFlowId, stepId }));
    }
  }

  const onNewFlowClick = async () => {
    if(activeProjectId){
      const newFlowResponse = await createFlowAPI(activeProjectId, 'Untitled Flow', '');
      if(newFlowResponse.success){
        dispatch(createFlow(newFlowResponse.data));
      }
      else{
        //Throw here toast message with the error details
        console.warn("Error while creating the flow! ===> ", newFlowResponse);
      }
    }
    else{
      console.warn("Warning! The active project ID is null!")
    }
  }

  const onStartClick = async () => {
    if(!activeFlow){
      //Show an error toast message
      return;
    }
    

    setLogs([]);
    setStepResults({});

    if( executionId === null){
      const newExecutionId = await getExecutionID(activeFlow.id);
      if(newExecutionId.success){
        dispatch(setExecutionId(newExecutionId.data));
        startWebSocketSubscription(newExecutionId.data);
      }  
    }
    else{
      startWebSocketSubscription(executionId);
    }
  }
  

  const wsStatusHandler: Record<string, (payload: FlowWSResponse) => void> = {
    "FLOW_STARTING": (payload) => {
      addLog("FLOW_STARTING", "Flow execution is starting...");
    },
    "FLOW_COMPLETED": (payload) => {
      addLog("FLOW_COMPLETED", "Flow tests completed successfully.");
      handleExecutionFinished(payload.message);
    },
    "FLOW_FAILED": (payload) => {
      addLog("STEP_FAILED", "Flow Failed!");
      addLog("STEP_FAILED", payload.message);
    },
    "COMPLETED": (payload) => {
      addLog("FLOW_COMPLETED", "Flow tests completed successfully.");
      handleExecutionFinished(payload.message);
    },
    "STEP_PASSED": (payload) => {
      addLog("STEP_PASSED", payload.message);
      const result = extractStepResult(payload);
      if (result) setStepResults((prev) => ({ ...prev, [result.stepId]: true }));
    },
    "STEP_FAILED": (payload) => {
      addLog("STEP_FAILED", "Step Failed!");
      addLog("STEP_FAILED", payload.message);
      const result = extractStepResult(payload);
      if (result) setStepResults((prev) => ({ ...prev, [result.stepId]: false }));
    },
  }

    // פונקציית ההמשך שלך:
    async function startWebSocketSubscription(id: string) {
      
      if(!stompClient)
        return;

      const waitForSubscription = new Promise<any>((resolve) => {
        const sub = stompClient.subscribe(`/flow-events/${id}`, (message: any) => {        
          if(!message.body)
            return;
  
          const payload: FlowWSResponse = JSON.parse(message.body);

          const handler = wsStatusHandler[payload.status];

          handler(payload);

          if(payload.success === false)
            handleExecutionFinished("FAILED!");
          
        });
  
        subscriptionRef.current = sub;

        setTimeout(() => {
          resolve(sub);
        }, 100);
      });

      await waitForSubscription;

      const executeAPI = await executeFlow(id);
      if(!executeAPI.success){
        addLog("STEP_FAILED", "Failed to trigger flow execution.");
        handleExecutionFinished("error!");
      }
      
    }
    

    function handleExecutionFinished(result: any){
      subscriptionRef.current.unsubscribe();
      dispatch(setExecutionId(null));
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
                onClick={onNewFlowClick}
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
          onStepDelete={handleDeleteStep}
          onReorderSteps={handleReorderSteps}
          stepResults={stepResults}
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
                { icon: "tune", label: "Headers", color: null },
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
                  : label === "Headers"
                  ? () => setIsHeadersModalOpen(true)
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
      <GlobalKVModal
        mode="variables"
        isOpen={isVariableModalOpen}
        onClose={() => setIsVariableModalOpen(false)}
      />
      <GlobalKVModal
        mode="assertions"
        isOpen={isAssertionModalOpen}
        onClose={() => setIsAssertionModalOpen(false)}
      />
      <GlobalKVModal
        mode="headers"
        isOpen={isHeadersModalOpen}
        onClose={() => setIsHeadersModalOpen(false)}
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
          <button
            onClick={onStartClick}
            disabled={isReorderPending}
            className="bg-secondary-container text-on-secondary-container px-md py-xs rounded flex items-center gap-xs transition-all font-bold font-code-sm text-code-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 disabled:hover:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${isReorderPending ? "animate-spin" : ""}`}>
              {isReorderPending ? "progress_activity" : "play_arrow"}
            </span>
            {isReorderPending ? "Saving..." : "Start"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-md custom-scrollbar font-code-sm text-code-sm space-y-1">
          {logs.map((log) => (
            <LogLine key={log.id} log={log} />
          ))}
        </div>
        <div className="h-6 px-lg flex items-center border-t border-outline-variant bg-surface-container-lowest shrink-0">
          <div className="text-[10px] text-outline">© 2024 FlowState Engine. All logs encrypted.</div>
        </div>
      </footer>
    </>
  );
}
