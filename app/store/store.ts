import { configureStore } from '@reduxjs/toolkit';
import stepsReducer from './stepsSlice';
import flowConfigReducer from './flowConfigSlice';
import flowsReducer from './flowsSlice';
import projectsReducer from './projectsSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    steps: stepsReducer,
    flowConfig: flowConfigReducer,
    flows: flowsReducer,
    projects: projectsReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
