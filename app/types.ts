export interface AuthResponse{
    success: true, 
    msg: string,
    data: any
}

export interface AuthErrorResponse{
    success: false,
    message: string
}