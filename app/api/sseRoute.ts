import api, {APIErrorResponse, APIResponse, toAPIError} from "./apiConfig";

const ROUTE = '/sse';


export const executeAndStream = async (flowId: string): Promise<APIResponse | APIErrorResponse> => {
    try{
        const resposnse = await api.get(ROUTE+'/flows/'+ flowId +'/execute');

        return {
            success: true,
            data: resposnse.data,
            msg: 'Execute started successfully'
        }
    }
    catch(error){
        return toAPIError(error);
    }
    

}

