import { configureStore } from '@reduxjs/toolkit';
import stepsReducer from './stepsSlice';
import flowConfigReducer from './flowConfigSlice';
import flowsReducer from './flowsSlice';

export const store = configureStore({
  reducer: {
    steps: stepsReducer,
    flowConfig: flowConfigReducer,
    flows: flowsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
