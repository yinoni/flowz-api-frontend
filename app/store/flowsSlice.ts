import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Step, StepFormData } from './stepsSlice';

type BackendStep = Omit<Step, 'position'>;

export type FlowStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT';

export type FlowWSStatus = 'FLOW_STARTING' | 'FLOW_FAILED' | 'FLOW_COMPLETED' | 'STEP_FAILED' | 'STEP_PASSED' | 'COMPLETED';

export interface FlowWSResponse {
  message: string,
  status: FlowWSStatus,
  success: boolean,
  [key: string]: unknown  // dynamic stepId → boolean field
}

export interface FlowRecord {
  // Backend fields
  id: string;
  flowName: string;
  projectId: string;
  globalURL: string;
  globalHeaders: Record<string, string>;
  globalVariables: Record<string, string>;
  steps: Step[];
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
}

const initialState: FlowsState = {
  flows: [],
  activeFlowId: null,
  executionId: null
};

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const flowsSlice = createSlice({
  name: 'flows',
  initialState,
  reducers: {
    setFlows(state, action: PayloadAction<FlowRecord[]>){
      const payloadFlows = action.payload;
      state.flows = payloadFlows;
      if(payloadFlows.length > 0)
        state.activeFlowId = payloadFlows[0].id;
      else
        state.activeFlowId = null;
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
      action: PayloadAction<{ id: string; flowName: string; globalURL?: string; globalHeaders?: Record<string, string>; globalVariables?: Record<string, string> }>
    ) {
      const flow = state.flows.find((f) => f.id === action.payload.id);
      if (flow) {
        flow.flowName = action.payload.flowName;
        if (action.payload.globalURL !== undefined) flow.globalURL = action.payload.globalURL;
        if (action.payload.globalHeaders !== undefined) flow.globalHeaders = action.payload.globalHeaders;
        if (action.payload.globalVariables !== undefined) flow.globalVariables = action.payload.globalVariables;
        flow.lastModified = todayLabel();
      }
    },
    setActiveFlow(state, action: PayloadAction<string | null>) {
      state.activeFlowId = action.payload;
    },
    addStepToFlow(state, action: PayloadAction<{ flowId: string; stepData: StepFormData; stepId?: string }>) {
      const flow = state.flows.find((f) => f.id === action.payload.flowId);
      if (!flow) return;
      const last = flow.steps[flow.steps.length - 1];
      const newX = last ? last.position.x + 440 : 80;
      const newY = last ? (last.position.y <= 150 ? 300 : 80) : 80;
      flow.steps.push({
        ...action.payload.stepData,
        id: action.payload.stepId ?? Date.now().toString(),
        position: { x: newX, y: newY },
      });
      flow.lastModified = todayLabel();
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
      flow.steps = action.payload.steps.map((step, index) => {
        const x = 80 + index * 440;
        const y = index % 2 === 0 ? 80 : 300;
        return { ...step, position: { x, y } };
      });
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
    }
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
  setExecutionId
} = flowsSlice.actions;
export default flowsSlice.reducer;
