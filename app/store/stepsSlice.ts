import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Step {
  id: string;
  title: string;
  url: string;
  httpMethod: string;
  body: string;
  headers: Record<string, string>;
  extract: Record<string, string>;
  assertions: Record<string, string>;
  routes: Record<string, string>;  // status code → fallback step ID
  position: { x: number; y: number };
}

export type StepFormData = Omit<Step, 'id' | 'position'>;

interface StepsState {
  steps: Step[];
}

const initialState: StepsState = {
  steps: [
    {
      id: '1',
      title: 'LOGIN',
      url: 'https://api.flowstate.io/v1/auth',
      httpMethod: 'POST',
      body: '{ "user": "admin" }',
      headers: {},
      extract: { token: 'response.data.token' },
      assertions: {},
      routes: {},
      position: { x: 80, y: 80 },
    },
    {
      id: '2',
      title: 'CREATE BUSINESS',
      url: 'https://api.flowstate.io/v1/business',
      httpMethod: 'POST',
      body: '{ "name": "Nexus Corp" }',
      headers: { Authorization: 'Bearer {{token}}' },
      extract: { businessId: 'response.id' },
      assertions: {},
      routes: {},
      position: { x: 520, y: 300 },
    },
    {
      id: '3',
      title: 'SAVE BUSINESS',
      url: 'https://api.flowstate.io/v1/users/saved/{{businessId}}',
      httpMethod: 'POST',
      body: '',
      headers: {},
      extract: {},
      assertions: { status: '200' },
      routes: {},
      position: { x: 1020, y: 150 },
    },
  ],
};

const stepsSlice = createSlice({
  name: 'steps',
  initialState,
  reducers: {
    addStep(state, action: PayloadAction<Step>) {
      const last = state.steps[state.steps.length - 1];
      const newX = last ? last.position.x + 440 : 80;
      const newY = last ? (last.position.y <= 150 ? 300 : 80) : 80;
      state.steps.push({
        ...action.payload,
        id: Date.now().toString(),
        position: { x: newX, y: newY },
      });
    },
    updateStep(state, action: PayloadAction<Step>) {
      const index = state.steps.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) state.steps[index] = action.payload;
    },
    removeStep(state, action: PayloadAction<string>) {
      state.steps = state.steps.filter((s) => s.id !== action.payload);
    },
  },
});

export const { addStep, updateStep, removeStep } = stepsSlice.actions;
export default stepsSlice.reducer;
