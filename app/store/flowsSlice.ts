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

const SEED_STEPS: Step[] = [
  {
    id: 's1',
    title: 'LOGIN',
    url: 'https://api.flowstate.io/v1/auth',
    httpMethod: 'POST',
    body: '{ "user": "admin" }',
    headers: {},
    extract: { token: 'response.data.token' },
    assertions: {},
    position: { x: 80, y: 80 },
  },
  {
    id: 's2',
    title: 'CREATE BUSINESS',
    url: 'https://api.flowstate.io/v1/business',
    httpMethod: 'POST',
    body: '{ "name": "Nexus Corp" }',
    headers: { Authorization: 'Bearer {{token}}' },
    extract: { businessId: 'response.id' },
    assertions: {},
    position: { x: 520, y: 300 },
  },
  {
    id: 's3',
    title: 'SAVE BUSINESS',
    url: 'https://api.flowstate.io/v1/users/saved/{{businessId}}',
    httpMethod: 'POST',
    body: '',
    headers: {},
    extract: {},
    assertions: { status: '200' },
    position: { x: 1020, y: 150 },
  },
];

const initialState: FlowsState = {
  flows: [
    {
      id: '1',
      flowName: 'Business Onboarding',
      projectId: 'proj-default',
      globalURL: '',
      globalVariables: {},
      status: 'ACTIVE',
      lastModified: 'Oct 24, 2023',
      icon: 'hub',
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      steps: SEED_STEPS,
    },
    {
      id: '2',
      flowName: 'Inventory Sync',
      projectId: 'proj-default',
      globalURL: '',
      globalVariables: {},
      status: 'PAUSED',
      lastModified: 'Oct 20, 2023',
      icon: 'sync',
      iconColor: 'text-tertiary',
      iconBg: 'bg-tertiary/10',
      steps: [],
    },
    {
      id: '3',
      flowName: 'Auth Test',
      projectId: 'proj-auth',
      globalURL: '',
      globalVariables: {},
      status: 'DRAFT',
      lastModified: 'Oct 18, 2023',
      icon: 'verified_user',
      iconColor: 'text-secondary',
      iconBg: 'bg-secondary/10',
      steps: [],
    },
  ],
  activeFlowId: null,
};

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const flowsSlice = createSlice({
  name: 'flows',
  initialState,
  reducers: {
    createFlow(
      state,
      action: PayloadAction<{ flowName: string; status: FlowStatus; projectId?: string; globalURL?: string }>
    ) {
      const id = Date.now().toString();
      state.flows.push({
        id,
        flowName: action.payload.flowName,
        projectId: action.payload.projectId ?? '',
        globalURL: action.payload.globalURL ?? '',
        globalVariables: {},
        status: action.payload.status,
        lastModified: todayLabel(),
        icon: 'bolt',
        iconColor: 'text-primary',
        iconBg: 'bg-primary/10',
        steps: [],
      });
      state.activeFlowId = id;
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
  createFlow,
  deleteFlow,
  updateFlowMeta,
  setActiveFlow,
  addStepToFlow,
  updateStepInFlow,
  removeStepFromFlow,
} = flowsSlice.actions;
export default flowsSlice.reducer;
