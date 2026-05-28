import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ProjectRecord {
  id: string;
  projectName: string;
  userId: string;
}

interface ProjectsState {
  projects: ProjectRecord[];
  activeProjectId: string | null;
}

const initialState: ProjectsState = {
  projects: [
    { id: 'proj-default', projectName: 'Default Project', userId: '' },
    { id: 'proj-ecommerce', projectName: 'E-Commerce Suite', userId: '' },
    { id: 'proj-auth', projectName: 'Auth Service', userId: '' },
  ],
  activeProjectId: 'proj-default',
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    createProject(state, action: PayloadAction<{ projectName: string }>) {
      const id = Date.now().toString();
      state.projects.push({ id, projectName: action.payload.projectName, userId: '' });
      state.activeProjectId = id;
    },
    setActiveProject(state, action: PayloadAction<string>) {
      state.activeProjectId = action.payload;
    },
  },
});

export const { createProject, setActiveProject } = projectsSlice.actions;
export default projectsSlice.reducer;
