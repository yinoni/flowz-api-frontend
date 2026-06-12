import axios from 'axios';
import { store } from '@/app/store/store';
import { log } from 'console';
import { logout, setToken } from '../store/userSlice';
import { refresh as refreshAPI } from './authAPI';
import { API_URL } from '../utils/consts';



export interface APIResponse{
    success: true,
    data: any,
    msg?: string
}

export interface APIErrorResponse{
    message: string,
    success: false,
    status: any,
    timestamp: any 
}

export function toAPIError(error: any) {
    return {
        success: false as const,
        ...(error.response?.data ?? { message: error.message ?? "Network error. Please check your connection." }),
    };
}


const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});


api.interceptors.request.use((config) => {
    const state = store.getState();
    const token = state.user.token;
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    const status = error.status;
    const originalRequest = error.config;

    if(status === 401){
        console.warn('UNAUTHORIZED!');
        if (typeof window !== 'undefined') {
            if (window.location.pathname !== '/login') {
                const refreshResponse = await refreshAPI();
                if(refreshResponse.success){
                    const newAccessToken = refreshResponse.data;
                    store.dispatch(setToken(newAccessToken));

                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                    return api(originalRequest);
                }else{                    
                    store.dispatch(logout());
                    const currentPath = window.location.pathname;
                    window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
                }   
            } else {
                // אם הוא כבר בלוגין, אנחנו לא עושים כלום (מונע רענון בלתי פוסק של העמוד)
                console.warn("API returned 401/403 while already on the login page.");
            }
       }
    }

    if(status === 403)
        console.warn('FORBIDDEN!');
        
    return Promise.reject(error);
});

export default api;
