import api, { APIErrorResponse, APIResponse, toAPIError } from "./apiConfig";
import type { Step, StepFormData } from "../store/stepsSlice";

const API_ROUTE = '/flow';

type StepGroup = "STEPS" | "FALLBACKS";




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
        return toAPIError(error);
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
        return toAPIError(error);
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
        return toAPIError(error);
    }
}

export const addStep = async (
    flowId: string,
    stepData: StepFormData,
    stepGroup: StepGroup,
    position: { x: number; y: number }
): Promise<APIResponse | APIErrorResponse> => {
    try {
        const request = { step: { ...stepData, position }, stepGroup };
        const response = await api.post(`${API_ROUTE}/steps/${flowId}`, request);
        const resp = response.data;
        const stepId = typeof resp === 'string' ? resp : resp?.id ?? null;
        return {
            success: true,
            data: stepId,
            msg: 'Step added successfully'
        };
    } catch (error: any) {
        return toAPIError(error);
    }
}

export const editStep = async (
    flowId: string,
    stepId: string,
    stepData: StepFormData,
    stepGroup: StepGroup,
    position?: { x: number; y: number }
): Promise<APIResponse | APIErrorResponse> => {
    try {
        const stepRequest = {
            step: { ...stepData, id: stepId, ...(position && { position }) },
            stepGroup: stepGroup
        }
        await api.patch(`${API_ROUTE}/steps/${flowId}`, stepRequest);

        return {
            success: true,
            data: null,
            msg: 'Step updated successfully'
        };
    } catch (error: any) {
        return toAPIError(error);
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
        return toAPIError(error);
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
        return toAPIError(error);
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
        return toAPIError(error);
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
        return toAPIError(error);
   
    }
} 

export const addFallbackStep = async (flowId: string, stepData: StepFormData): Promise<APIResponse | APIErrorResponse> => {
    try {
        const response = await api.post(`${API_ROUTE}/fallback/${flowId}`, { ...stepData });
        const stepId = typeof response.data === 'string' ? response.data : response.data?.id ?? null;
        return { success: true, data: stepId, msg: 'Fallback step added successfully' };
    } catch (error: any) {
        return toAPIError(error);
    }
}

export const deleteFallbackStep = async (flowId: string, fallbackId: string): Promise<APIResponse | APIErrorResponse> => {
    try {
        await api.delete(`${API_ROUTE}/fallback/${flowId}`, { params: { fallbackId } });
        return { success: true, data: null, msg: 'Fallback step deleted successfully' };
    } catch (error: any) {
        return toAPIError(error);
    }
}

export const syncSteps = async (
    flowId: string,
    stepData: StepFormData | null,
    steps: { id: string; position: { x: number; y: number } }[]
): Promise<APIResponse | APIErrorResponse> => {
    try{
        const apiResponse = await api.patch(`${API_ROUTE}/steps/${flowId}/sync`, {
            step: stepData,
            reorderSteps: steps
        });
        return {
            success: true,
            data: apiResponse.data,
            msg: 'Assertions added successfully'
        }
    }
    catch(error: any){
        return toAPIError(error);

    }
}