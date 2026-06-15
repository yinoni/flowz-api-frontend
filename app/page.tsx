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
  confirmStepAdd,
  confirmFallbackStepAdd,
  insertStepAfterInFlow,
  FlowWSResponse,
} from "./store/flowsSlice";
import { toggleFocusMode, exitFocusMode } from "./store/uiSlice";
import type { Step, StepFormData } from "./store/stepsSlice";
import NewRequestModal from "./components/NewRequestModal";
import FlowCanvas, { type FlowCanvasHandle } from "./components/FlowCanvas";
import { getHttpMethodColor } from "./utils/utils";
import GlobalKVModal from "./components/GlobalKVModal";
import {
  addStep as addStepAPI,
  createFlow as createFlowAPI,
  deleteStep as deleteStepAPI,
  editStep as editStepAPI,
  getFlowSteps,
  deleteFallbackStep as deleteFallbackStepAPI,
  syncSteps as syncStepsAPI,
} from "./api/flowRoute";
import { executeFlow, getExecutionID } from "./api/flowExecutionAPI";
import { useWebSocket } from "./components/WebSocketProvider";
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

  useEffect(() => {
    if (!isFocusMode) setIsFocusNavOpen(false);
  }, [isFocusMode]);

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
  const [insertAfterStepId, setInsertAfterStepId] = useState<string | null>(null);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isAssertionModalOpen, setIsAssertionModalOpen] = useState(false);
  const [isHeadersModalOpen, setIsHeadersModalOpen] = useState(false);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);
  const [isFocusNavOpen, setIsFocusNavOpen] = useState(false);
  const flowCanvasRef = useRef<FlowCanvasHandle>(null);

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

  function openAddAfterModal(afterStepId: string) {
    setEditingStep(null);
    setIsFallbackModal(false);
    setInsertAfterStepId(afterStepId);
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

  function handleSave(data: StepFormData) {
    if (!activeFlowId) return;

    if (isFallbackModal) {
      if (editingStep) {
        const previousStep = editingStep;
        dispatch(updateFallbackStepInFlow({ flowId: activeFlowId, step: { ...data, id: editingStep.id, position: editingStep.position } }));
        editStepAPI(activeFlowId, editingStep.id, data, "FALLBACKS", editingStep.position)
          .then((result) => {
            if (!result.success) {
              dispatch(updateFallbackStepInFlow({ flowId: activeFlowId, step: previousStep }));
              showToast("Failed to update fallback step. Changes reverted.", "error");
            }
          })
          .catch(() => {
            dispatch(updateFallbackStepInFlow({ flowId: activeFlowId, step: previousStep }));
            showToast("Failed to update fallback step. Changes reverted.", "error");
          });
      } else {
        const last = fallbackSteps[fallbackSteps.length - 1];
        const position = { x: last ? last.position.x + 440 : 80, y: 800 };
        const tempId = `temp_${Date.now()}-${Math.random()}`;
        dispatch(addFallbackStepToFlow({ flowId: activeFlowId, stepData: data, stepId: tempId, position }));
        addStepAPI(activeFlowId, data, "FALLBACKS", position)
          .then((result) => {
            if (result.success) {
              if (!result.data) return;
              if (cancelledTempIds.current.has(tempId)) {
                cancelledTempIds.current.delete(tempId);
                deleteFallbackStepAPI(activeFlowId, result.data);
                return;
              }
              dispatch(confirmFallbackStepAdd({ flowId: activeFlowId, tempId, realId: result.data }));
            } else {
              cancelledTempIds.current.delete(tempId);
              dispatch(removeFallbackStepFromFlow({ flowId: activeFlowId, fallbackId: tempId }));
              showToast("Failed to add fallback step. Please try again.", "error");
            }
          })
          .catch(() => {
            cancelledTempIds.current.delete(tempId);
            dispatch(removeFallbackStepFromFlow({ flowId: activeFlowId, fallbackId: tempId }));
            showToast("Failed to add fallback step. Please try again.", "error");
          });
      }
    } else {
      if (editingStep) {
        const previousStep = editingStep;
        dispatch(updateStepInFlow({ flowId: activeFlowId, step: { ...data, id: editingStep.id, position: editingStep.position } }));
        editStepAPI(activeFlowId, editingStep.id, data, "STEPS", editingStep.position)
          .then((result) => {
            if (!result.success) {
              dispatch(updateStepInFlow({ flowId: activeFlowId, step: previousStep }));
              showToast("Failed to update step. Changes reverted.", "error");
            }
          })
          .catch(() => {
            dispatch(updateStepInFlow({ flowId: activeFlowId, step: previousStep }));
            showToast("Failed to update step. Changes reverted.", "error");
          });
      } else if (insertAfterStepId) {
        const afterStepId = insertAfterStepId;
        setInsertAfterStepId(null);
        const afterIndex = steps.findIndex(s => s.id === afterStepId);
        if (afterIndex === -1) return;
        const insertIndex = afterIndex + 1;
        const newStepId = crypto.randomUUID();
        const previousSteps = [...steps];
        dispatch(insertStepAfterInFlow({ flowId: activeFlowId, afterStepId, stepData: data, stepId: newStepId }));
        const reorderList = [
          ...steps.slice(0, insertIndex).map((s, idx) => ({
            id: s.id,
            position: { x: 80 + idx * 440, y: idx % 2 === 0 ? 80 : 300 },
          })),
          { id: newStepId, position: { x: 80 + insertIndex * 440, y: insertIndex % 2 === 0 ? 80 : 300 } },
          ...steps.slice(insertIndex).map((s, i) => {
            const newIdx = insertIndex + 1 + i;
            return { id: s.id, position: { x: 80 + newIdx * 440, y: newIdx % 2 === 0 ? 80 : 300 } };
          }),
        ];
        if (addAfterDebounceRef.current) clearTimeout(addAfterDebounceRef.current);
        setIsAddAfterPending(true);
        addAfterDebounceRef.current = setTimeout(async () => {
          const result = await syncStepsAPI(activeFlowId, data, reorderList).catch(() => null);
          setIsAddAfterPending(false);
          if (!result || !result.success) {
            dispatch(setFlowSteps({ flowId: activeFlowId, steps: previousSteps }));
            showToast("Failed to insert step. Please try again.", "error");
          }
        }, 1000);
      } else {
        const last = steps[steps.length - 1];
        const position = last
          ? { x: last.position.x + 440, y: last.position.y <= 150 ? 300 : 80 }
          : { x: 80, y: 80 };
        const tempId = `temp_${Date.now()}-${Math.random()}`;
        dispatch(addStepToFlow({ flowId: activeFlowId, stepData: data, stepId: tempId, position }));
        addStepAPI(activeFlowId, data, "STEPS", position)
          .then((result) => {
            if (result.success) {
              if (!result.data) return;
              if (cancelledTempIds.current.has(tempId)) {
                cancelledTempIds.current.delete(tempId);
                deleteStepAPI(activeFlowId, result.data);
                return;
              }
              dispatch(confirmStepAdd({ flowId: activeFlowId, tempId, realId: result.data }));
            } else {
              cancelledTempIds.current.delete(tempId);
              dispatch(removeStepFromFlow({ flowId: activeFlowId, stepId: tempId }));
              showToast("Failed to add step. Please try again.", "error");
            }
          })
          .catch(() => {
            cancelledTempIds.current.delete(tempId);
            dispatch(removeStepFromFlow({ flowId: activeFlowId, stepId: tempId }));
            showToast("Failed to add step. Please try again.", "error");
          });
      }
    }

    setIsModalOpen(false);
    setEditingStep(null);
    setIsFallbackModal(false);
  }

  const reorderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reorderSnapshotRef = useRef<Step[] | null>(null);
  const addAfterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledTempIds = useRef(new Set<string>());
  const [isReorderPending, setIsReorderPending] = useState(false);
  const [isAddAfterPending, setIsAddAfterPending] = useState(false);

  async function handleReorderSteps(orderedIds: string[]) {
    if (!activeFlowId) return;
    if (!reorderSnapshotRef.current) {
      reorderSnapshotRef.current = [...steps];
    }
    const stepsWithPositions = orderedIds.map((id, index) => ({
      id,
      position: { x: 80 + index * 440, y: index % 2 === 0 ? 80 : 300 },
    }));
    dispatch(reorderSteps({ flowId: activeFlowId, steps: stepsWithPositions }));

    setIsReorderPending(true);
    if (reorderDebounceRef.current) clearTimeout(reorderDebounceRef.current);
    reorderDebounceRef.current = setTimeout(async () => {
      const apiResponse = await syncStepsAPI(activeFlowId, null, stepsWithPositions);
      setIsReorderPending(false);
      if (apiResponse.success) {
        showToast("Step order saved successfully.", "success");
        reorderSnapshotRef.current = null;
      } else {
        if (reorderSnapshotRef.current) {
          dispatch(setFlowSteps({ flowId: activeFlowId, steps: reorderSnapshotRef.current }));
          reorderSnapshotRef.current = null;
        }
        showToast("Failed to save step order. Please try again.", "error");
      }
    }, 1500);
  }

  async function handleDeleteStep(stepId: string) {
    if (!activeFlowId) return;
    if (stepId.startsWith('temp_')) {
      cancelledTempIds.current.add(stepId);
      dispatch(removeStepFromFlow({ flowId: activeFlowId, stepId }));
      return;
    }
    const previousSteps = [...steps];
    dispatch(removeStepFromFlow({ flowId: activeFlowId, stepId }));
    try {
      const result = await deleteStepAPI(activeFlowId, stepId);
      if (!result.success) {
        dispatch(setFlowSteps({ flowId: activeFlowId, steps: previousSteps }));
        showToast("Failed to delete step. Please try again.", "error");
      }
    } catch {
      dispatch(setFlowSteps({ flowId: activeFlowId, steps: previousSteps }));
      showToast("Failed to delete step. Please try again.", "error");
    }
  }

  async function handleDeleteFallbackStep(fallbackId: string) {
    if (!activeFlowId) return;
    if (fallbackId.startsWith('temp_')) {
      cancelledTempIds.current.add(fallbackId);
      dispatch(removeFallbackStepFromFlow({ flowId: activeFlowId, fallbackId }));
      return;
    }
    const previousFallbackSteps = [...fallbackSteps];
    // Snapshot only the steps that reference this fallback so the revert
    // is targeted and doesn't erase steps added concurrently during the await.
    const affectedSteps = steps.filter(
      s => s.routes && Object.values(s.routes).includes(fallbackId)
    );
    dispatch(removeFallbackRoutes({ flowId: activeFlowId, fallbackStepId: fallbackId }));
    dispatch(removeFallbackStepFromFlow({ flowId: activeFlowId, fallbackId }));
    try {
      const result = await deleteFallbackStepAPI(activeFlowId, fallbackId);
      if (!result.success) {
        dispatch(setFlowFallbackSteps({ flowId: activeFlowId, fallbacks: previousFallbackSteps }));
        affectedSteps.forEach(step => dispatch(updateStepInFlow({ flowId: activeFlowId, step })));
        showToast("Failed to delete fallback step. Please try again.", "error");
      } else {
        showToast("Fallback step deleted.", "success");
      }
    } catch {
      dispatch(setFlowFallbackSteps({ flowId: activeFlowId, fallbacks: previousFallbackSteps }));
      affectedSteps.forEach(step => dispatch(updateStepInFlow({ flowId: activeFlowId, step })));
      showToast("Failed to delete fallback step. Please try again.", "error");
    }
  }

  async function handleDisconnect(stepId: string, statusCode: string) {
    if (!activeFlowId) return;
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    const previousStep: Step = { ...step, routes: { ...step.routes } };
    dispatch(removeRouteFromStep({ flowId: activeFlowId, stepId, statusCode }));
    const updatedRoutes = { ...step.routes };
    delete updatedRoutes[statusCode];
    const { id, position, ...stepData } = { ...step, routes: updatedRoutes };
    const result = await editStepAPI(activeFlowId, id, stepData, "STEPS", position);
    if (!result.success) {
      dispatch(updateStepInFlow({ flowId: activeFlowId, step: previousStep }));
      showToast("Failed to disconnect steps. Please try again.", "error");
    }
  }

  async function handleConnect(fromStepId: string, toFallbackId: string, statusCode: string) {
    if (!activeFlowId) return;
    const step = steps.find(s => s.id === fromStepId);
    if (!step) return;
    const previousStep: Step = { ...step, routes: { ...step.routes } };
    const updatedStep: Step = { ...step, routes: { ...(step.routes ?? {}), [statusCode]: toFallbackId } };
    dispatch(updateStepInFlow({ flowId: activeFlowId, step: updatedStep }));
    const { id, position, ...stepData } = updatedStep;
    const result = await editStepAPI(activeFlowId, id, stepData, "STEPS", position);
    if (!result.success) {
      dispatch(updateStepInFlow({ flowId: activeFlowId, step: previousStep }));
      showToast("Failed to connect steps. Please try again.", "error");
    }
  }

  const onNewFlowClick = async () => {
    if(activeProjectId){
      const newFlowResponse = await createFlowAPI(activeProjectId, 'Untitled Flow', '');
      if(newFlowResponse.success){
        dispatch(createFlow(newFlowResponse.data));
      }
      else{
        showToast(newFlowResponse.message ?? "Failed to create flow. Please try again.", "error");
      }
    }
    else{
      showToast("Please select or create a project before creating a flow.", "info");
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
      } else {
        showToast(newExecutionId.message ?? "Failed to start execution. Please try again.", "error");
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
              {activeProjectId
                ? "Open an existing flow from My Flows, or create a new one to start building."
                : "Select or create a project first, then open or create a flow."}
            </p>
            {!activeProjectId && (
              <div className="mb-lg flex items-center gap-sm px-md py-sm rounded-lg bg-primary/5 border border-primary/30 text-primary font-body-sm">
                <span className="material-symbols-outlined text-sm">arrow_upward</span>
                Use the <strong className="mx-1">Project</strong> selector in the top bar to get started
              </div>
            )}
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
                title={!activeProjectId ? "Select or create a project first" : undefined}
                className={`flex items-center gap-sm px-lg py-sm rounded-lg bg-primary text-on-primary-fixed font-bold transition-all ${activeProjectId ? "hover:opacity-90 active:scale-95" : "opacity-40 cursor-not-allowed"}`}
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
            className="absolute top-3 right-3 z-30 flex items-center gap-xs px-sm py-xs rounded-lg bg-surface-container border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all shadow-lg text-sm font-body-md"
            title="Exit focus mode (Escape or \\)"
          >
            <span className="material-symbols-outlined text-sm">fullscreen_exit</span>
            <span className="font-label-caps text-label-caps">Exit Focus</span>
          </button>
        )}

        {/* Focus mode floating toolbar — bottom center */}
        <div
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center bg-surface-container border border-outline-variant/80 rounded-2xl shadow-2xl transition-[opacity,transform] duration-200 ease-in-out ${
            isFocusMode
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        >
          {/* Request */}
          <button
            onClick={openAddModal}
            className="flex flex-col items-center gap-[3px] px-lg py-sm rounded-l-2xl hover:bg-surface-container-high transition-all group"
          >
            <span className="material-symbols-outlined text-secondary text-[20px]">http</span>
            <span className="font-label-caps text-[9px] tracking-widest uppercase text-on-surface-variant group-hover:text-secondary transition-colors">Request</span>
          </button>

          <div className="w-px h-8 bg-outline-variant/40 shrink-0" />

          {/* Headers */}
          <button
            onClick={() => setIsHeadersModalOpen(true)}
            className="flex flex-col items-center gap-[3px] px-lg py-sm hover:bg-surface-container-high transition-all group"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-secondary transition-colors">tune</span>
            <span className="font-label-caps text-[9px] tracking-widest uppercase text-on-surface-variant group-hover:text-secondary transition-colors">Headers</span>
          </button>

          <div className="w-px h-8 bg-outline-variant/40 shrink-0" />

          {/* Variable */}
          <button
            onClick={() => setIsVariableModalOpen(true)}
            className="flex flex-col items-center gap-[3px] px-lg py-sm hover:bg-surface-container-high transition-all group"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">abc</span>
            <span className="font-label-caps text-[9px] tracking-widest uppercase text-on-surface-variant group-hover:text-primary transition-colors">Variable</span>
          </button>

          <div className="w-px h-8 bg-outline-variant/40 shrink-0" />

          {/* Assert */}
          <button
            onClick={() => setIsAssertionModalOpen(true)}
            className="flex flex-col items-center gap-[3px] px-lg py-sm hover:bg-surface-container-high transition-all group"
          >
            <span className="material-symbols-outlined text-tertiary text-[20px]">verified_user</span>
            <span className="font-label-caps text-[9px] tracking-widest uppercase text-on-surface-variant group-hover:text-tertiary transition-colors">Assert</span>
          </button>

          <div className="w-px h-8 bg-outline-variant/40 shrink-0" />

          {/* Fallback */}
          <button
            onClick={openAddFallbackModal}
            className="flex flex-col items-center gap-[3px] px-lg py-sm rounded-r-2xl hover:bg-error/5 transition-all group"
          >
            <span className="material-symbols-outlined text-error/60 group-hover:text-error text-[20px] transition-colors">alt_route</span>
            <span className="font-label-caps text-[9px] tracking-widest uppercase text-on-surface-variant group-hover:text-error transition-colors">Fallback</span>
          </button>
        </div>

        {/* Center Canvas */}
        <FlowCanvas
          ref={flowCanvasRef}
          steps={steps}
          fallbackSteps={fallbackSteps}
          onStepClick={openEditModal}
          onFallbackStepClick={openEditFallbackModal}
          onStepDelete={handleDeleteStep}
          onFallbackStepDelete={handleDeleteFallbackStep}
          onReorderSteps={handleReorderSteps}
          onAddAfter={openAddAfterModal}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          stepResults={stepResults}
          isLoading={isStepsLoading}
        />

        {/* Right Inspector — collapses in focus mode */}
        <aside className={`bg-surface-container-low border-l border-outline-variant flex flex-col h-full py-md px-sm shrink-0 z-20 overflow-hidden transition-[width,opacity] duration-200 ease-in-out ${
          isFocusMode ? "w-0 opacity-0" : "w-inspector-width opacity-100"
        }`}>
          <div className="shrink-0 mb-lg px-sm">
            <div className="font-headline-md text-headline-md text-secondary">Step Palette</div>
            <div className="text-on-surface-variant text-[10px] uppercase tracking-widest opacity-70">
              Click to add
            </div>
          </div>
          <div className="shrink-0 grid grid-cols-2 gap-sm">
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
          <div className="shrink-0 mt-md pt-md border-t border-outline-variant/40">
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

          {/* Step Navigator — normal mode only */}
          <div className="flex-1 min-h-0 flex flex-col mt-lg border-t border-outline-variant pt-lg overflow-hidden">
            <div className="shrink-0 font-label-caps text-label-caps text-outline mb-sm uppercase px-sm">
              Navigator
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-px px-sm">
              {steps.length === 0 ? (
                <p className="text-outline font-body-sm text-body-sm italic text-center py-sm">No steps yet</p>
              ) : (
                steps.map((step, i) => {
                  const { text, bg } = getHttpMethodColor(step.httpMethod);
                  return (
                    <button
                      key={step.id}
                      onClick={() => { flowCanvasRef.current?.scrollToStep(step.id); flowCanvasRef.current?.focusNode(step.id); }}
                      className="w-full flex items-center gap-xs px-xs py-xs rounded text-left hover:bg-surface-container-high transition-colors group"
                    >
                      <span className="font-label-caps text-[9px] text-outline w-4 shrink-0">{i + 1}</span>
                      <span className="text-on-surface-variant truncate flex-1 group-hover:text-on-surface text-xs">{step.title || "Untitled"}</span>
                      <span className={`${bg} ${text} px-xs rounded text-[8px] font-bold tracking-widest shrink-0`}>{step.httpMethod || "GET"}</span>
                    </button>
                  );
                })
              )}
              {fallbackSteps.length > 0 && (
                <>
                  <div className="text-[9px] text-error/50 uppercase tracking-widest pt-xs pb-px border-t border-outline-variant/50 flex items-center gap-xs mt-xs">
                    <span className="material-symbols-outlined text-xs">alt_route</span>
                    Fallbacks
                  </div>
                  {fallbackSteps.map((fb) => {
                    const { text, bg } = getHttpMethodColor(fb.httpMethod);
                    return (
                      <button
                        key={fb.id}
                        onClick={() => { flowCanvasRef.current?.scrollToFallback(fb.id); flowCanvasRef.current?.focusNode(fb.id); }}
                        className="w-full flex items-center gap-xs px-xs py-xs rounded text-left hover:bg-error/5 transition-colors group"
                      >
                        <span className="material-symbols-outlined text-error/50 text-xs shrink-0">alt_route</span>
                        <span className="text-on-surface-variant truncate flex-1 group-hover:text-error text-xs">{fb.title || "Fallback"}</span>
                        <span className={`${bg} ${text} px-xs rounded text-[8px] font-bold tracking-widest shrink-0`}>{fb.httpMethod || "GET"}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>

        </aside>
      </div>

      <NewRequestModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingStep(null); setIsFallbackModal(false); setInsertAfterStepId(null); }}
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

            {/* Step Navigator */}
            {(steps.length > 0 || fallbackSteps.length > 0) && (
              <div className="relative">
                {isFocusNavOpen && (
                  <div className="fixed inset-0 z-40" onClick={() => setIsFocusNavOpen(false)} />
                )}
                <div className="relative z-50">
                  <button
                    onClick={() => setIsFocusNavOpen(v => !v)}
                    className="flex items-center gap-xs px-sm py-xs rounded border border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary transition-all font-code-sm text-code-sm"
                    title="Step navigator"
                  >
                    <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
                    <span>{steps.length + fallbackSteps.length}</span>
                  </button>
                  {isFocusNavOpen && (
                    <div className="absolute bottom-full right-0 mb-xs w-56 bg-surface-container border border-outline-variant rounded-xl shadow-2xl overflow-hidden">
                      <div className="px-sm py-xs border-b border-outline-variant">
                        <span className="font-label-caps text-[9px] text-outline uppercase tracking-widest">Navigator</span>
                      </div>
                      <div className="overflow-y-auto max-h-64 p-xs space-y-px">
                        {steps.map((step, i) => {
                          const { text, bg } = getHttpMethodColor(step.httpMethod);
                          return (
                            <button
                              key={step.id}
                              onClick={() => { flowCanvasRef.current?.scrollToStep(step.id); flowCanvasRef.current?.focusNode(step.id); setIsFocusNavOpen(false); }}
                              className="w-full flex items-center gap-xs px-sm py-xs rounded text-left hover:bg-surface-container-high transition-colors group"
                            >
                              <span className="font-label-caps text-[9px] text-outline w-4 shrink-0">{i + 1}</span>
                              <span className="text-on-surface-variant truncate flex-1 group-hover:text-on-surface text-xs">{step.title || "Untitled"}</span>
                              <span className={`${bg} ${text} px-xs rounded text-[8px] font-bold tracking-widest shrink-0`}>{step.httpMethod || "GET"}</span>
                            </button>
                          );
                        })}
                        {fallbackSteps.length > 0 && (
                          <>
                            <div className="text-[9px] text-error/50 uppercase tracking-widest pt-xs pb-px border-t border-outline-variant/50 flex items-center gap-xs px-sm mt-xs">
                              <span className="material-symbols-outlined text-xs">alt_route</span>
                              Fallbacks
                            </div>
                            {fallbackSteps.map((fb) => {
                              const { text, bg } = getHttpMethodColor(fb.httpMethod);
                              return (
                                <button
                                  key={fb.id}
                                  onClick={() => { flowCanvasRef.current?.scrollToFallback(fb.id); flowCanvasRef.current?.focusNode(fb.id); setIsFocusNavOpen(false); }}
                                  className="w-full flex items-center gap-xs px-sm py-xs rounded text-left hover:bg-error/5 transition-colors group"
                                >
                                  <span className="material-symbols-outlined text-error/50 text-xs shrink-0">alt_route</span>
                                  <span className="text-on-surface-variant truncate flex-1 group-hover:text-error text-xs">{fb.title || "Fallback"}</span>
                                  <span className={`${bg} ${text} px-xs rounded text-[8px] font-bold tracking-widest shrink-0`}>{fb.httpMethod || "GET"}</span>
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={onStartClick}
              disabled={isReorderPending || isAddAfterPending || steps.length === 0}
              className="bg-secondary-container text-on-secondary-container px-md py-xs rounded flex items-center gap-xs transition-all font-bold font-code-sm text-code-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80 disabled:hover:opacity-50"
            >
              <span className={`material-symbols-outlined text-sm ${(isReorderPending || isAddAfterPending) ? "animate-spin" : ""}`}>
                {(isReorderPending || isAddAfterPending) ? "progress_activity" : "play_arrow"}
              </span>
              {(isReorderPending || isAddAfterPending) ? "Saving..." : "Start"}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-md custom-scrollbar font-code-sm text-code-sm space-y-1">
          {logs.map((log) => (
            <LogLine key={log.id} log={log} />
          ))}
        </div>
        <div className="h-6 px-lg flex items-center border-t border-outline-variant bg-surface-container-lowest shrink-0">
          <div className="text-[10px] text-outline">© 2024 FlowZ Engine</div>
        </div>
      </footer>
    </>
  );
}
