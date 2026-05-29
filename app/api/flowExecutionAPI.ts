import api, { APIErrorResponse, APIResponse } from "./apiConfig";


const API_ROUTE = '/execute';


export const executeFlow = async (executionId: string): Promise<APIResponse | APIErrorResponse> => {
    try{
        const apiResponse = await api.post(`${API_ROUTE}/${executionId}`);

        return {
            success: true,
            data: apiResponse.data,
            msg: "Execution ID generated successfully"
        }
    }
    catch(error: any){
        return {
            success: false,
            ...error.response.data
        }
    }
}


export const getExecutionID = async (flowId: string): Promise<APIResponse | APIErrorResponse> => {
    
    try{
        const apiResponse = await api.get(`${API_ROUTE}`, {
            params: {
                flowId: flowId
            }
        });

        return {
            success: true,
            data: apiResponse.data,
            msg: "Execution ID generated successfully"
        }
    }
    catch(error: any){
        return {
            success: false,
            ...error.response.data
        }
    }
}