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
  projects: [],
  activeProjectId: '',
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects(state, action: PayloadAction<ProjectRecord[]>){
      const projectsData = action.payload;
      state.projects = projectsData;
      if(projectsData.length > 0)
        state.activeProjectId = projectsData[0].id;
    },
    createProject(state, action: PayloadAction<ProjectRecord>) {
      const project = action.payload;
      state.projects.push(project);
      state.activeProjectId = project.id;
    },
    setActiveProject(state, action: PayloadAction<string>) {
      state.activeProjectId = action.payload;
    },
  },
});

export const { setProjects, createProject, setActiveProject } = projectsSlice.actions;
export default projectsSlice.reducer;
