import axios from 'axios';
import { store } from '@/app/store/store';
import { log } from 'console';
import { logout } from '../store/userSlice';


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


const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
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
}, (error) => {
    const status = error.status;

    if(status === 401){
        console.warn('UNAUTHORIZED!');
        // 1. קודם כל מוודאים שאנחנו רצים בצד הלקוח (בדפדפן)
        if (typeof window !== 'undefined') {
            // 2. בדיקה: האם המשתמש *לא* נמצא כרגע בעמוד הלוגין?
            if (window.location.pathname !== '/login') {
                store.dispatch(logout());
                // אופציונלי: ניקוי טוקנים ישנים מה-Storage כדי שלא ננסה לשלוח אותם שוב
                localStorage.removeItem('token'); 
                
                // 3. רק אם הוא לא בלוגין, מעבירים אותו לשם
                const currentPath = window.location.pathname;
                window.location.href = `/login?callbackUrl=${encodeURIComponent(currentPath)}`;
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
