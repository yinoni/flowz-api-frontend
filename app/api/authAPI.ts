import { SignUpRequest } from '../store/userSlice';
import { AuthErrorResponse, AuthResponse } from '../types';
import api from './apiConfig';


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
        return {
            success: false,
            msg: 'Email or password incorrect!'
        }
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
        let msg = 'Error while signing up... try again later'
        if (error.response && error.response.status === 409) {
            msg = 'Email already exists';
        }
        
        return {
            success: false,
            msg: msg
        }
    }
}