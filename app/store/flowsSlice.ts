import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Step, StepFormData } from './stepsSlice';

type BackendStep = Step;

export type FlowStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT';

export type FlowWSStatus = 'FLOW_STARTING' | 'FLOW_FAILED' | 'FLOW_COMPLETED' | 'STEP_FAILED' | 'STEP_PASSED' | 'COMPLETED';

export interface FlowWSResponse {
  message: string,
  status: FlowWSStatus,
  success: boolean,
  response?: unknown,
  [key: string]: unknown  // dynamic stepId → boolean field
}

export interface FlowDTO{
  id: string;
  flowName: string;
  projectId: string;
  globalURL: string;
  globalHeaders: Record<string, string>;
  globalVariables: Record<string, string>;
  globalAssertions: Record<string, any>;
  steps: Step[];
  fallbackSteps: Step[];
}

export interface FlowRecord {
  // Backend fields
  id: string;
  flowName: string;
  projectId: string;
  globalURL: string;
  globalHeaders: Record<string, string>;
  globalVariables: Record<string, string>;
  globalAssertions: Record<string, any>;
  steps: Step[];
  fallbackSteps: Step[];
  // Frontend-only display fields
  status: FlowStatus;
  lastModified: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}

interface FlowsState {
  flows: FlowRecord[];
  activeFlowId: string | null;
  executionId: string | null;
  activeFlow: FlowRecord | null;
}

const initialState: FlowsState = {
  flows: [],
  activeFlowId: null,
  executionId: null,
  activeFlow: null
};

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const flowsSlice = createSlice({
  name: 'flows',
  initialState,
  reducers: {
    setFlows(state, action: PayloadAction<FlowRecord[]>){
      const payloadFlows = action.payload.map(f => ({
        ...f,
        steps: f.steps ?? [],
        fallbackSteps: f.fallbackSteps ?? [],
      }));
      state.flows = payloadFlows;
      if(payloadFlows.length > 0){
        state.activeFlowId = payloadFlows[0].id;
        state.activeFlow = payloadFlows[0];
      }
      else{
        state.activeFlowId = null;
        state.activeFlow = null;
      }
    },
    createFlow(
      state,
      action: PayloadAction<FlowRecord>
    ) {
      const acceptedFlow = action.payload;
      state.flows.push({
        ...acceptedFlow,
        status: action.payload.status,
        lastModified: todayLabel(),
        icon: 'bolt',
        iconColor: 'text-primary',
        iconBg: 'bg-primary/10',
        steps: [],
        fallbackSteps: [],
      });
      state.activeFlowId = acceptedFlow.id;
    },
    deleteFlow(state, action: PayloadAction<string>) {
      state.flows = state.flows.filter((f) => f.id !== action.payload);
      if (state.activeFlowId === action.payload){ 
        state.activeFlowId = null;
        state.executionId = null;
      }
    },
    updateFlowMeta(
      state,
      action: PayloadAction<{ id: string; flowName?: string; globalURL?: string; globalHeaders?: Record<string, string>; globalVariables?: Record<string, string>, globalAssertions?: Record<string, any> }>
    ) {
      const flow = state.flows.find((f) => f.id === action.payload.id);
      if (flow) {
        if (action.payload.flowName !== undefined) flow.flowName = action.payload.flowName;
        if (action.payload.globalURL !== undefined) flow.globalURL = action.payload.globalURL;
        if (action.payload.globalHeaders !== undefined) flow.globalHeaders = action.payload.globalHeaders;
        if (action.payload.globalVariables !== undefined) flow.globalVariables = action.payload.globalVariables;
        if (action.payload.globalAssertions !== undefined) flow.globalAssertions = action.payload.globalAssertions;
        flow.lastModified = todayLabel();
        state.activeFlow = flow;
      }
    },
    setActiveFlow(state, action: PayloadAction<string | null>) {
      state.activeFlowId = action.payload;
    },
    addStepToFlow(state, action: PayloadAction<{ flowId: string; stepData: StepFormData; stepId?: string; position?: { x: number; y: number } }>) {
      const flow = state.flows.find((f) => f.id === action.payload.flowId);
      if (!flow) return;
      const last = flow.steps[flow.steps.length - 1];
      const fallbackX = last ? last.position.x + 440 : 80;
      const fallbackY = last ? (last.position.y <= 150 ? 300 : 80) : 80;
      flow.steps.push({
        ...action.payload.stepData,
        routes: action.payload.stepData.routes ?? {},
        id: action.payload.stepId ?? Date.now().toString(),
        position: action.payload.position ?? { x: fallbackX, y: fallbackY },
      });
      flow.lastModified = todayLabel();
    },
    addFallbackStepToFlow(state, action: PayloadAction<{ flowId: string; stepData: StepFormData; stepId?: string; position?: { x: number; y: number } }>) {
      const flow = state.flows.find((f) => f.id === action.payload.flowId);
      if (!flow) return;
      if (!flow.fallbackSteps) flow.fallbackSteps = [];
      const last = flow.fallbackSteps[flow.fallbackSteps.length - 1];
      const fallbackX = last ? last.position.x + 440 : 80;
      flow.fallbackSteps.push({
        ...action.payload.stepData,
        routes: action.payload.stepData.routes ?? {},
        id: action.payload.stepId ?? Date.now().toString(),
        position: action.payload.position ?? { x: fallbackX, y: 520 },
      });
      flow.lastModified = todayLabel();
    },
    updateFallbackStepInFlow(state, action: PayloadAction<{ flowId: string; step: Step }>) {
      const flow = state.flows.find((f) => f.id === action.payload.flowId);
      if (!flow) return;
      if (!flow.fallbackSteps) flow.fallbackSteps = [];
      const idx = flow.fallbackSteps.findIndex((s) => s.id === action.payload.step.id);
      if (idx !== -1) {
        flow.fallbackSteps[idx] = action.payload.step;
        flow.lastModified = todayLabel();
      }
    },
    removeFallbackStepFromFlow(state, action: PayloadAction<{ flowId: string; fallbackId: string }>) {
      const flow = state.flows.find((f) => f.id === action.payload.flowId);
      if (flow) {
        flow.fallbackSteps = (flow.fallbackSteps ?? []).filter((s) => s.id !== action.payload.fallbackId);
        flow.lastModified = todayLabel();
      }
    },
    removeFallbackRoutes(state, action: PayloadAction<{ flowId: string; fallbackStepId: string }>) {
      const flow = state.flows.find((f) => f.id === action.payload.flowId);
      if (!flow) return;
      flow.steps.forEach(step => {
        if (step.routes) {
          step.routes = Object.fromEntries(
            Object.entries(step.routes).filter(([, id]) => id !== action.payload.fallbackStepId)
          );
        }
      });
      flow.lastModified = todayLabel();
    },
    removeRouteFromStep(state, action: PayloadAction<{ flowId: string; stepId: string; statusCode: string }>) {
      const flow = state.flows.find((f) => f.id === action.payload.flowId);
      if (!flow) return;
      const step = flow.steps.find((s) => s.id === action.payload.stepId);
      if (step?.routes) {
        delete step.routes[action.payload.statusCode];
        flow.lastModified = todayLabel();
      }
    },
    setFlowFallbackSteps(state, action: PayloadAction<{ flowId: string; fallbacks: Step[] }>) {
      const flow = state.flows.find((f) => f.id === action.payload.flowId);
      if (!flow) return;
      flow.fallbackSteps = (action.payload.fallbacks ?? []).map((fallback) => ({
        ...fallback,
        routes: (fallback as any).routes ?? {},
      }));
    },
    updateStepInFlow(state, action: PayloadAction<{ flowId: string; step: Step }>) {
      const flow = state.flows.find((f) => f.id === action.payload.flowId);
      if (!flow) return;
      const idx = flow.steps.findIndex((s) => s.id === action.payload.step.id);
      if (idx !== -1) {
        flow.steps[idx] = action.payload.step;
        flow.lastModified = todayLabel();
      }
    },
    setFlowSteps(state, action: PayloadAction<{ flowId: string; steps: BackendStep[] }>) {
      const flow = state.flows.find((f) => f.id === action.payload.flowId);
      if (!flow) return;
      flow.steps = action.payload.steps.map((step) => ({
        ...step,
        routes: (step as any).routes ?? {},
      }));
    },
    removeStepFromFlow(state, action: PayloadAction<{ flowId: string; stepId: string }>) {
      const flow = state.flows.find((f) => f.id === action.payload.flowId);
      if (flow) {
        flow.steps = flow.steps.filter((s) => s.id !== action.payload.stepId);
        flow.lastModified = todayLabel();
      }
    },
    setExecutionId(state, action: PayloadAction<string | null>){
      state.executionId = action.payload;
    },
    reorderSteps(state, action: PayloadAction<{ flowId: string; steps: { id: string; position: { x: number; y: number } }[] }>) {
      const flow = state.flows.find(f => f.id === action.payload.flowId);
      if (!flow) return;
      const stepMap = new Map(flow.steps.map(s => [s.id, s]));
      flow.steps = action.payload.steps
        .filter(({ id }) => stepMap.has(id))
        .map(({ id, position }) => ({
          ...stepMap.get(id)!,
          position,
        }));
    },
  },
});

export const {
  setFlows,
  createFlow,
  deleteFlow,
  updateFlowMeta,
  setActiveFlow,
  setFlowSteps,
  addStepToFlow,
  updateStepInFlow,
  removeStepFromFlow,
  setExecutionId,
  reorderSteps,
  addFallbackStepToFlow,
  updateFallbackStepInFlow,
  removeFallbackStepFromFlow,
  removeFallbackRoutes,
  removeRouteFromStep,
  setFlowFallbackSteps,
} = flowsSlice.actions;
export default flowsSlice.reducer;
