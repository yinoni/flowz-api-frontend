import { log } from 'console';
import { SignUpRequest } from '../store/userSlice';
import { AuthErrorResponse, AuthResponse } from '../types';
import api, {toAPIError} from './apiConfig';


const API_ROUTE = '/auth'

export const login = async (email: string, password: string): Promise<AuthResponse | AuthErrorResponse> => {
    try{
        const response = await api.post(`${API_ROUTE}/login`, {
            email: email,
            password: password,
        });
    
        return {
            success: true,
            data: response.data,
            msg: 'Logged in successfully'
        }
    }
    catch(error: any){
        return toAPIError(error);
    }  
}

export const signup = async (request: SignUpRequest): Promise<AuthResponse | AuthErrorResponse> => {
    try{
        const response = await api.post(`${API_ROUTE}/register`, request);

        return {
            success: true,
            data: response.data,
            msg: "Signed up successfully!"
        }
    }
    catch(error: any){
        return toAPIError(error);
    }
}

export const googleLogin = async (token: any): Promise<AuthResponse | AuthErrorResponse> => {
    
    try{
        const response = await api.post(`${API_ROUTE}/google`, {
            token: token
        });        

        return {
            success: true,
            msg: 'Login with google succeeded!',
            data: response.data 
        }
    }
    catch(error: any){
        return toAPIError(error);
    }
}

export const validateCode = async (code: string): Promise<AuthResponse | AuthErrorResponse> => {
    try{
        const response = await api.post(`${API_ROUTE}/validate-code`, {
            code: code
        });
                
        return {
            success: true,
            msg: 'Verified!',
            data: response.data
        }
    }
    catch(error: any){
        return toAPIError(error);
    }
}

export const resendCode = async (): Promise<AuthResponse | AuthErrorResponse> => {
    try{
        const response = await api.post(`${API_ROUTE}/resend-code`);

        return {
            success: true,
            msg: 'Sent new code!',
            data: ""
        }
    }
    catch(error: any){
        return toAPIError(error);
    }
}

export const refresh = async (): Promise<AuthResponse | AuthErrorResponse> => {
    try{
        const response = await api.post(`${API_ROUTE}/refresh`);

        return {
            success: true,
            msg: "New access token",
            data: response.data
        }
    }
    catch(error: any){        
        return toAPIError(error);
    }
}

export const logout = async (): Promise<AuthResponse | AuthErrorResponse> => {
    try{
        await api.post(`${API_ROUTE}/logout`);

        return {
            success: true,
            msg: "Logged out successfully",
            data: ""
        }
    }
    catch(error: any){        
        return toAPIError(error);
    }
}