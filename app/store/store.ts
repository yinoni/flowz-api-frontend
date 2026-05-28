import { configureStore } from '@reduxjs/toolkit';
import stepsReducer from './stepsSlice';

export const store = configureStore({
  reducer: {
    steps: stepsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
