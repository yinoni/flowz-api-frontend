import { createSlice } from '@reduxjs/toolkit';

interface UIState {
  isFocusMode: boolean;
}

const initialState: UIState = { isFocusMode: false };

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleFocusMode(state) {
      state.isFocusMode = !state.isFocusMode;
    },
    exitFocusMode(state) {
      state.isFocusMode = false;
    },
  },
});

export const { toggleFocusMode, exitFocusMode } = uiSlice.actions;
export default uiSlice.reducer;
