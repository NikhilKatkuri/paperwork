export interface ApiSuccessResponse<T> {
    data: T;
    success: true;
    requestId: string;
    message?: string;
}

export interface ApiErrorResponse {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
    requestId: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
