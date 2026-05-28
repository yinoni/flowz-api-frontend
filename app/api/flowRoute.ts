import api, { APIErrorResponse, APIResponse } from "./apiConfig";


const API_ROUTE = '/flow';


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