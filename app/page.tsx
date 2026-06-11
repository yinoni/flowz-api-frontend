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
  addFallbackStepToFlow,
  updateFallbackStepInFlow,
  removeFallbackStepFromFlow,
  removeFallbackRoutes,
  removeRouteFromStep,
  setFlowFallbackSteps,
  FlowWSResponse,
} from "./store/flowsSlice";
import { toggleFocusMode, exitFocusMode } from "./store/uiSlice";
import type { Step, StepFormData } from "./store/stepsSlice";
import NewRequestModal from "./components/NewRequestModal";
import FlowCanvas from "./components/FlowCanvas";
import GlobalKVModal from "./components/GlobalKVModal";
import {
  addStep as addStepAPI,
  createFlow as createFlowAPI,
  deleteStep as deleteStepAPI,
  editStep as editStepAPI,
  getFlowSteps,
  deleteFallbackStep as deleteFallbackStepAPI
} from "./api/flowRoute";
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
  response?: string;
}

function LogLine({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);

  // Indented to align with message text (past w-24 timestamp + icon + gap columns)
  const INDENT = "pl-[calc(6rem+1.5rem)]";

  const responseToggle = log.response && (
    <button
      onClick={() => setExpanded((v) => !v)}
      className={`${INDENT} mt-0.5 flex items-center gap-xs text-outline hover:text-on-surface-variant transition-colors`}
    >
      <span className="material-symbols-outlined text-sm leading-none">
        {expanded ? "expand_less" : "data_object"}
      </span>
      <span className="text-[10px] uppercase tracking-widest">
        {expanded ? "hide response" : "view response"}
      </span>
    </button>
  );

  const responseBlock = expanded && log.response && (
    <div className={`${INDENT} mt-xs`}>
      <pre className="w-fit max-w-[70%] overflow-x-auto font-code-sm text-code-sm text-on-surface-variant bg-surface-container-high border border-outline-variant/40 rounded p-sm leading-relaxed">
        {log.response}
      </pre>
    </div>
  );

  if (log.status === "STEP_PASSED" || log.status === "FLOW_COMPLETED") {
    return (
      <div>
        <div className="flex items-center gap-md">
          <span className="text-outline w-24 shrink-0">{log.timestamp}</span>
          <span className="material-symbols-outlined text-secondary-fixed text-sm">check_circle</span>
          <span className="text-secondary-fixed">{log.message}</span>
        </div>
        {responseToggle}
        {responseBlock}
      </div>
    );
  }
  if (log.status === "STEP_RUNNING" || log.status === "FLOW_STARTING") {
    return (
      <div className="flex items-center gap-md">
        <span className="text-outline w-24 shrink-0">{log.timestamp}</span>
        <span className="material-symbols-outlined text-tertiary text-sm animate-spin">refresh</span>
        <span className="text-tertiary">{log.message}</span>
      </div>
    );
  }
  if (log.status === "STEP_FAILED") {
    return (
      <div>
        <div className="flex items-center gap-md">
          <span className="text-outline w-24 shrink-0">{log.timestamp}</span>
          <span className="material-symbols-outlined text-error text-sm">error</span>
          <span className="text-error">{log.message}</span>
        </div>
        {responseToggle}
        {responseBlock}
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
  const isFocusMode = useSelector((state: RootState) => state.ui.isFocusMode);
  const activeFlow = flows.find((f) => f.id === activeFlowId) ?? null;
  const steps = activeFlow?.steps ?? [];
  const fallbackSteps = activeFlow?.fallbackSteps ?? [];
  const {stompClient, isConnected} = useWebSocket();
  const subscriptionRef = useRef<any>(null);

  const [isStepsLoading, setIsStepsLoading] = useState(false);

  useEffect(() => {
    if (!activeFlowId) return;
    const alreadyLoaded = steps.length > 0 || fallbackSteps.length > 0;
    if (!alreadyLoaded) setIsStepsLoading(true);
    getFlowSteps(activeFlowId).then((result) => {
      if (result.success) {
        dispatch(setFlowSteps({ flowId: activeFlowId, steps: result.data.steps }));
        dispatch(setFlowFallbackSteps({ flowId: activeFlowId, fallbacks: result.data.fallbacks }));
      }
    }).finally(() => {
      setIsStepsLoading(false);
    });
  }, [activeFlowId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "\\") dispatch(toggleFocusMode());
      if (e.key === "Escape") dispatch(exitFocusMode());
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dispatch]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stepResults, setStepResults] = useState<Record<string, boolean>>({});

  const KNOWN_WS_KEYS = new Set(["status", "success", "message", "response"]);
  function extractStepResult(payload: FlowWSResponse): { stepId: string; passed: boolean } | null {
    const stepId = Object.keys(payload).find((k) => !KNOWN_WS_KEYS.has(k));
    if (!stepId) return null;
    return { stepId, passed: payload.success };
  }

  function addLog(status: LogStatus, message: string, response?: unknown) {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const timestamp = `[${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}]`;
    const responseStr =
      response !== undefined
        ? typeof response === "string"
          ? response
          : JSON.stringify(response, null, 2)
        : undefined;
    setLogs((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, timestamp, status, message, response: responseStr }]);
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [isFallbackModal, setIsFallbackModal] = useState(false);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isAssertionModalOpen, setIsAssertionModalOpen] = useState(false);
  const [isHeadersModalOpen, setIsHeadersModalOpen] = useState(false);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);

  function openAddModal() {
    setEditingStep(null);
    setIsFallbackModal(false);
    setIsModalOpen(true);
  }

  function openEditModal(step: Step) {
    setEditingStep(step);
    setIsFallbackModal(false);
    setIsModalOpen(true);
  }

  function openAddFallbackModal() {
    setEditingStep(null);
    setIsFallbackModal(true);
    setIsModalOpen(true);
  }

  function openEditFallbackModal(step: Step) {
    setEditingStep(step);
    setIsFallbackModal(true);
    setIsModalOpen(true);
  }

  async function handleSave(data: StepFormData) {
    if (!activeFlowId) return;

    if (isFallbackModal) {
      if (editingStep) {
        editStepAPI(activeFlowId, editingStep.id, data, "FALLBACKS", editingStep.position)
        .then((response: any) => {
          if(response.success)
            dispatch(updateFallbackStepInFlow({ flowId: activeFlowId, step: { ...data, id: editingStep.id, position: editingStep.position } }));
        });
      } else {
        const last = fallbackSteps[fallbackSteps.length - 1];
        const position = { x: last ? last.position.x + 440 : 80, y: 800 };
        const result = await addStepAPI(activeFlowId, data, "FALLBACKS", position);
        if (result.success) {
          dispatch(addFallbackStepToFlow({ flowId: activeFlowId, stepData: data, stepId: result.data, position }));
        }
      }
    } else {
      if (editingStep) {
        const result = await editStepAPI(activeFlowId, editingStep.id, data, "STEPS", editingStep.position);
        if (result.success) {
          dispatch(updateStepInFlow({ flowId: activeFlowId, step: { ...data, id: editingStep.id, position: editingStep.position } }));
        }
      } else {
        const last = steps[steps.length - 1];
        const position = last
          ? { x: last.position.x + 440, y: last.position.y <= 150 ? 300 : 80 }
          : { x: 80, y: 80 };
        const result = await addStepAPI(activeFlowId, data, "STEPS", position);
        if (result.success) {
          dispatch(addStepToFlow({ flowId: activeFlowId, stepData: data, stepId: result.data, position }));
        }
      }
    }

    setIsModalOpen(false);
    setEditingStep(null);
    setIsFallbackModal(false);
  }

  const reorderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isReorderPending, setIsReorderPending] = useState(false);

  async function handleReorderSteps(orderedIds: string[]) {
    if (!activeFlowId) return;
    const stepsWithPositions = orderedIds.map((id, index) => ({
      id,
      position: { x: 80 + index * 440, y: index % 2 === 0 ? 80 : 300 },
    }));
    dispatch(reorderSteps({ flowId: activeFlowId, steps: stepsWithPositions }));

    setIsReorderPending(true);
    if (reorderDebounceRef.current) clearTimeout(reorderDebounceRef.current);
    reorderDebounceRef.current = setTimeout(async () => {
      const apiResponse = await reorderStepsAPI(activeFlowId, stepsWithPositions);
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

  async function handleDeleteFallbackStep(fallbackId: string) {
    if (!activeFlowId) return;
    deleteFallbackStepAPI(activeFlowId, fallbackId)
    .then((response: any) => {
      if(response.success){
        dispatch(removeFallbackRoutes({ flowId: activeFlowId, fallbackStepId: fallbackId }));
        dispatch(removeFallbackStepFromFlow({ flowId: activeFlowId, fallbackId }));
      }

      //Calude throw here a toast message that the fallback deleted/not deleted
    });
    
  }

  async function handleDisconnect(stepId: string, statusCode: string) {
    if (!activeFlowId) return;
    dispatch(removeRouteFromStep({ flowId: activeFlowId, stepId, statusCode }));
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    const updatedRoutes = { ...step.routes };
    delete updatedRoutes[statusCode];
    const { id, position, ...stepData } = { ...step, routes: updatedRoutes };
    await editStepAPI(activeFlowId, id, stepData, "STEPS", position);
  }

  async function handleConnect(fromStepId: string, toFallbackId: string, statusCode: string) {
    if (!activeFlowId) return;
    const step = steps.find(s => s.id === fromStepId);
    if (!step) return;
    const updatedStep: Step = { ...step, routes: { ...(step.routes ?? {}), [statusCode]: toFallbackId } };
    dispatch(updateStepInFlow({ flowId: activeFlowId, step: updatedStep }));
    const { id, position, ...stepData } = updatedStep;
    await editStepAPI(activeFlowId, id, stepData, "STEPS", position);
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
      addLog("STEP_PASSED", payload.message, payload.response);
      const result = extractStepResult(payload);
      if (result) setStepResults((prev) => ({ ...prev, [result.stepId]: true }));
    },
    "STEP_FAILED": (payload) => {
      addLog("STEP_FAILED", payload.message, payload.response);
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
        {/* Focus mode exit hint — floats over canvas when sidebars are hidden */}
        {isFocusMode && (
          <button
            onClick={() => dispatch(exitFocusMode())}
            className="absolute top-3 right-3 z-30 flex items-center gap-xs px-sm py-xs rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all shadow-lg text-sm font-body-md opacity-40 hover:opacity-100"
            title="Exit focus mode (Escape or \\)"
          >
            <span className="material-symbols-outlined text-sm">fullscreen_exit</span>
            <span className="font-label-caps text-label-caps">Exit Focus</span>
          </button>
        )}

        {/* Center Canvas */}
        <FlowCanvas
          steps={steps}
          fallbackSteps={fallbackSteps}
          onStepClick={openEditModal}
          onFallbackStepClick={openEditFallbackModal}
          onStepDelete={handleDeleteStep}
          onFallbackStepDelete={handleDeleteFallbackStep}
          onReorderSteps={handleReorderSteps}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          stepResults={stepResults}
          isLoading={isStepsLoading}
        />

        {/* Right Inspector — collapses in focus mode */}
        <aside className={`bg-surface-container-low border-l border-outline-variant flex flex-col h-full py-md px-sm shrink-0 z-20 overflow-hidden transition-[width,opacity] duration-200 ease-in-out ${
          isFocusMode ? "w-0 opacity-0" : "w-inspector-width opacity-100"
        }`}>
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
          {/* Fallback Step button */}
          <div className="mt-md pt-md border-t border-outline-variant/40">
            <div className="font-label-caps text-label-caps text-outline mb-sm uppercase">Fallback</div>
            <div
              onClick={openAddFallbackModal}
              className="flex items-center gap-sm p-sm bg-surface-container border-2 border-dashed border-error/40 rounded-lg cursor-pointer hover:border-error hover:bg-error/5 transition-all group"
            >
              <span className="material-symbols-outlined text-error/70 group-hover:text-error text-sm">alt_route</span>
              <div>
                <div className="font-label-caps text-label-caps text-on-surface-variant group-hover:text-error">
                  Fallback Step
                </div>
                <div className="text-[9px] text-outline">Triggered on status code</div>
              </div>
            </div>
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
        onClose={() => { setIsModalOpen(false); setEditingStep(null); setIsFallbackModal(false); }}
        onSave={handleSave}
        initialStep={editingStep}
        defaultUrl={activeFlow.globalURL || undefined}
        isFallback={isFallbackModal}
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
      <footer
        className="bg-surface-container-lowest border-t border-outline-variant flex flex-col w-full z-30 shrink-0 transition-[height] duration-200 ease-in-out"
        style={{ height: isTerminalExpanded ? "480px" : "180px" }}
      >
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
          <div className="flex items-center gap-sm">
            <button
              onClick={() => setIsTerminalExpanded((v) => !v)}
              className="text-outline hover:text-on-surface transition-colors"
              title={isTerminalExpanded ? "Collapse terminal" : "Expand terminal"}
            >
              <span className="material-symbols-outlined text-sm">
                {isTerminalExpanded ? "expand_more" : "expand_less"}
              </span>
            </button>
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
