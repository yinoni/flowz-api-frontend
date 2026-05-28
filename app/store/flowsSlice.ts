import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Step, StepFormData } from './stepsSlice';

export type FlowStatus = 'ACTIVE' | 'PAUSED' | 'DRAFT';

export interface FlowRecord {
  // Backend fields
  id: string;
  flowName: string;
  projectId: string;
  globalURL: string;
  globalVariables: Record<string, unknown>;
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
}

const initialState: FlowsState = {
  flows: [],
  activeFlowId: null,
};

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const flowsSlice = createSlice({
  name: 'flows',
  initialState,
  reducers: {
    setFlows(state, action: PayloadAction<FlowRecord[]>){
      state.flows = action.payload;
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
      if (state.activeFlowId === action.payload) state.activeFlowId = null;
    },
    updateFlowMeta(
      state,
      action: PayloadAction<{ id: string; flowName: string; status: FlowStatus; globalURL?: string }>
    ) {
      const flow = state.flows.find((f) => f.id === action.payload.id);
      if (flow) {
        flow.flowName = action.payload.flowName;
        flow.status = action.payload.status;
        if (action.payload.globalURL !== undefined) flow.globalURL = action.payload.globalURL;
        flow.lastModified = todayLabel();
      }
    },
    setActiveFlow(state, action: PayloadAction<string>) {
      state.activeFlowId = action.payload;
    },
    addStepToFlow(state, action: PayloadAction<{ flowId: string; stepData: StepFormData }>) {
      const flow = state.flows.find((f) => f.id === action.payload.flowId);
      if (!flow) return;
      const last = flow.steps[flow.steps.length - 1];
      const newX = last ? last.position.x + 440 : 80;
      const newY = last ? (last.position.y <= 150 ? 300 : 80) : 80;
      flow.steps.push({
        ...action.payload.stepData,
        id: Date.now().toString(),
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
    removeStepFromFlow(state, action: PayloadAction<{ flowId: string; stepId: string }>) {
      const flow = state.flows.find((f) => f.id === action.payload.flowId);
      if (flow) {
        flow.steps = flow.steps.filter((s) => s.id !== action.payload.stepId);
        flow.lastModified = todayLabel();
      }
    },
  },
});

export const {
  setFlows,
  createFlow,
  deleteFlow,
  updateFlowMeta,
  setActiveFlow,
  addStepToFlow,
  updateStepInFlow,
  removeStepFromFlow,
} = flowsSlice.actions;
export default flowsSlice.reducer;
