import { log } from "console";
import api, { APIErrorResponse, APIResponse } from "./apiConfig";


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
        let errorBody: APIErrorResponse = {
            success: false,
            ...error.response.data
        };

        return errorBody;
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
        console.log('The error is ===> ', error.response);
        
    
        let errorBody: APIErrorResponse = {
            success: false,
            ...error.response.data
        };

        return errorBody;
    }
}