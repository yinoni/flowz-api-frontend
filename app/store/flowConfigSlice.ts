import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GlobalVariable {
  id: string;
  name: string;
  value: string;
}

export interface GlobalAssertion {
  id: string;
  field: string;
  expected: string;
}

interface FlowConfigState {
  variables: GlobalVariable[];
  assertions: GlobalAssertion[];
}

const initialState: FlowConfigState = {
  variables: [
    { id: '1', name: 'base_url', value: 'https://api.flowstate.io/v1' },
    { id: '2', name: 'token', value: '' },
  ],
  assertions: [],
};

const flowConfigSlice = createSlice({
  name: 'flowConfig',
  initialState,
  reducers: {
    setVariables(state, action: PayloadAction<GlobalVariable[]>) {
      state.variables = action.payload;
    },
    setAssertions(state, action: PayloadAction<GlobalAssertion[]>) {
      state.assertions = action.payload;
    },
  },
});

export const { setVariables, setAssertions } = flowConfigSlice.actions;
export default flowConfigSlice.reducer;
