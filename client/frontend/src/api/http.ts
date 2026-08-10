import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
    isCancel,
    Method,
} from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not defined');
}

type ApiResponse<T> = {
    data: T;
    status: number;
};

type TokenGetter = () => string | null;

export interface RequestConfig extends Omit<
    AxiosRequestConfig,
    'method' | 'url' | 'data'
> {
    signal?: AbortSignal;
}

class HttpClient {
    private client: AxiosInstance;
    private getToken: TokenGetter = () => null;

    constructor() {
        this.client = axios.create({
            baseURL: BASE_URL,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.client.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                // Dynamically fetch the token at the EXACT moment the request is sent
                const token = this.getToken();
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
    }

    public registerTokenGetter(getter: TokenGetter) {
        this.getToken = getter;
    }

    createAbortController(): AbortController {
        return new AbortController();
    }

    private async request<T>(
        method: Method,
        path: string,
        data?: unknown,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        try {
            const response: AxiosResponse<T> = await this.client.request({
                method,
                url: path,
                data,
                headers: {
                    ...(config?.headers ?? {}),
                },
                signal: config?.signal,
                ...config,
            });

            return {
                status: response.status,
                data: response.data,
            };
        } catch (error) {
            if (isCancel(error)) {
                throw new Error(`Request to ${path} was aborted`);
            }
            throw error;
        }
    }

    get<T>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('GET', path, undefined, config);
    }

    post<T>(
        path: string,
        body?: unknown,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>('POST', path, body, config);
    }

    put<T>(
        path: string,
        body?: unknown,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>('PUT', path, body, config);
    }

    patch<T>(
        path: string,
        body?: unknown,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        return this.request<T>('PATCH', path, body, config);
    }

    delete<T>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('DELETE', path, undefined, config);
    }
}

export const http = new HttpClient();
