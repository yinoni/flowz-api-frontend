import api, { APIErrorResponse, APIResponse } from "./apiConfig";
import type { Step, StepFormData } from "../store/stepsSlice";


const API_ROUTE = '/flow';


export const createFlow = async (projectId: string, flowName: string, globalURL: string, globalHeaders: Record<string, string> = {}, globalVariables: Record<string, string> = {}): Promise<APIResponse | APIErrorResponse> => {
    try {
        const apiResponse = await api.post(`${API_ROUTE}`, {
            projectId,
            flowName,
            globalURL,
            globalHeaders,
            globalVariables,
        });

        return {
            success: true,
            data: apiResponse.data,
            msg: 'Flow created successfully'
        };
    } catch (error: any) {
        const errorResponse = {
            success: false,
            ...error.response.data,
        };

        return errorResponse;
    }
}

export const editFlow = async (id: string, flowName: string, globalURL: string, globalHeaders: Record<string, string> = {}, globalVariables: Record<string, string> = {}): Promise<APIResponse | APIErrorResponse> => {
    try {
        await api.patch(`${API_ROUTE}`, { id, flowName, globalURL, globalHeaders, globalVariables });

        return {
            success: true,
            data: null,
            msg: 'Flow updated successfully'
        };
    } catch (error: any) {
        const errorResponse = {
            success: false,
            ...error.response.data,
        };

        return errorResponse;
    }
}

export const deleteFlow = async (flowId: string): Promise<APIResponse | APIErrorResponse> => {
    try {
        await api.delete(`${API_ROUTE}`, { params: { flowId } });

        return {
            success: true,
            data: null,
            msg: 'Flow deleted successfully'
        };
    } catch (error: any) {
        const errorResponse = {
            success: false,
            ...error.response.data,
        };

        return errorResponse;
    }
}

export const addStep = async (flowId: string, stepId: string, stepData: StepFormData): Promise<APIResponse | APIErrorResponse> => {
    try {
        await api.post(`${API_ROUTE}/steps/${flowId}`, { ...stepData, id: stepId });

        return {
            success: true,
            data: null,
            msg: 'Step added successfully'
        };
    } catch (error: any) {
        const errorResponse = {
            success: false,
            ...error.response.data,
        };

        return errorResponse;
    }
}

export const editStep = async (flowId: string, stepId: string, stepData: StepFormData): Promise<APIResponse | APIErrorResponse> => {
    try {
        await api.patch(`${API_ROUTE}/steps/${flowId}`, { ...stepData, id: stepId });

        return {
            success: true,
            data: null,
            msg: 'Step updated successfully'
        };
    } catch (error: any) {
        const errorResponse = {
            success: false,
            ...error.response.data,
        };

        return errorResponse;
    }
}

export const deleteStep = async (flowId: string, stepId: string): Promise<APIResponse | APIErrorResponse> => {
    try {
        await api.delete(`${API_ROUTE}/steps/${flowId}`, { params: { stepId } });

        return {
            success: true,
            data: null,
            msg: 'Step deleted successfully'
        };
    } catch (error: any) {
        const errorResponse = {
            success: false,
            ...error.response.data,
        };

        return errorResponse;
    }
}

export const getFlowSteps = async (flowId: string): Promise<APIResponse | APIErrorResponse> => {
    try {
        const apiResponse = await api.get(`${API_ROUTE}/steps`, { params: { flowId } });

        return {
            success: true,
            data: apiResponse.data,
            msg: 'Steps fetched successfully'
        };
    } catch (error: any) {
        const errorResponse = {
            success: false,
            ...error.response.data,
        };

        return errorResponse;
    }
}

export const getProjectFlows = async (projectId: string): Promise<APIResponse | APIErrorResponse> => {
    try{
        const apiResponse = await api.get(`${API_ROUTE}/project`, {
            params: {
                projectId: projectId
            }
        });

        return {
            success: true, 
            data: apiResponse.data,
            msg: 'Flows found successfully'
        }
    }
    catch(error: any){
        const errorResponse = {
            success: false,
            ...error.response.data,
        }

        return errorResponse;
    }
}

export const setGlobals = async (flowId: string, globals: Record<string, any>, fieldName: "GLOBAL_ASSERTIONS" | "GLOBAL_VARIABLES" | "GLOBAL_HEADERS"): Promise<APIResponse | APIErrorResponse> => {
    try{
        const apiResponse = await api.patch(`${API_ROUTE}/${flowId}/globals`, {
            globals: globals,
            fieldName: fieldName 
        });
        return {
            success: true,
            data: apiResponse.data,
            msg: 'Assertions added successfully'
        }
    }
    catch(error: any){
        return {
            success: false,
            ...error.response.data,
        }
   
    }
} 

export const reorderSteps = async (flowId: string, newSteps: string[]): Promise<APIResponse | APIErrorResponse> => {
    try{
        const apiResponse = await api.patch(`${API_ROUTE}/steps/${flowId}/reorder`, {
            steps: newSteps
        });
        return {
            success: true,
            data: apiResponse.data,
            msg: 'Assertions added successfully'
        }
    }
    catch(error: any){
        return {
            success: false,
            ...error.response.data,
        }
   
    }
} 