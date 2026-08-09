import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
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

type RequestConfig = Omit<AxiosRequestConfig, 'method' | 'url' | 'data'>;

class HttpClient {
    private client: AxiosInstance;
    private token = '';

    constructor() {
        this.client = axios.create({
            baseURL: BASE_URL,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    setBearer(token: string): this {
        this.token = token;
        return this;
    }

    private async request<T>(
        method: Method,
        path: string,
        data?: unknown,
        config?: RequestConfig
    ): Promise<ApiResponse<T>> {
        const response: AxiosResponse<T> = await this.client.request({
            method,
            url: path,
            data,
            headers: {
                ...(this.token
                    ? { Authorization: `Bearer ${this.token}` }
                    : {}),
                ...(config?.headers ?? {}),
            },
            ...config,
        });

        return {
            status: response.status,
            data: response.data,
        } as ApiResponse<T>;
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
