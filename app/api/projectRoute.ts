import api, { APIErrorResponse, APIResponse, toAPIError } from "./apiConfig";

const API_ROUTE = "/project";


export const createProject = async (projectName: string): Promise<APIResponse | APIErrorResponse> => {
    try {
        const apiResponse = await api.post(`${API_ROUTE}`, { projectName });

        return {
            success: true,
            data: apiResponse.data,
            msg: 'Project created successfully'
        };
    } catch (error: any) {
        return toAPIError(error);
    }
}

export const updateProject = async (projectId: string, projectName: string): Promise<APIResponse | APIErrorResponse> => {
    try {
        const apiResponse = await api.patch(`${API_ROUTE}`, { projectId: projectId, projectName });
        return { success: true, data: apiResponse.data, msg: 'Project updated successfully' };
    } catch (error: any) {
        return { success: false, ...error.response.data };
    }
}

export const deleteProject = async (projectId: string): Promise<APIResponse | APIErrorResponse> => {
    try {
        await api.delete(`${API_ROUTE}/${projectId}`);
        return { success: true, data: null, msg: 'Project deleted successfully' };
    } catch (error: any) {
        return toAPIError(error);
    }
}

export const getUserProjects = async (): Promise<APIResponse | APIErrorResponse> => {
    try{
        const apiResponse = await api.get(`${API_ROUTE}/user`);
        
        return {
            success: true,
            data: apiResponse.data,
            msg: 'Got the projects successfully'
        };
    }
    catch(error: any){
        return toAPIError(error);
    }
}