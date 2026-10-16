import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
    isCancel,
    Method,
} from 'axios';
import { getErrorMessage } from './error';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

if (typeof window !== 'undefined' && !BASE_URL) {
    // Defer the crash to request time so a missing env does not white-screen
    // the whole bundle at import.
    console.error('NEXT_PUBLIC_API_BASE_URL is not defined');
}

export type ApiResponse<T> = { data: T; status: number; raw?: unknown };

type TokenGetter = () => string | null;

export interface RequestConfig extends Omit<
    AxiosRequestConfig,
    'method' | 'url' | 'data'
> {
    signal?: AbortSignal;
}

export class ApiError extends Error {
    constructor(
        message: string,
        readonly status: number | undefined,
        readonly issues: { path: string; message: string }[] = []
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

class HttpClient {
    private readonly client: AxiosInstance;
    private getToken: TokenGetter = () => null;

    constructor() {
        this.client = axios.create({
            baseURL: BASE_URL || undefined,
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
        });

        this.client.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const token = this.getToken();
                if (token) {
                    config.headers.set('Authorization', `Bearer ${token}`);
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
    }

    public registerTokenGetter(getter: TokenGetter) {
        this.getToken = getter;
    }

    public createAbortController(): AbortController {
        return new AbortController();
    }

    private async request<T>(
        method: Method,
        path: string,
        data?: unknown,
        config: RequestConfig = {}
    ): Promise<ApiResponse<T>> {
        if (!BASE_URL) {
            throw new ApiError(
                'API is not configured. Please set NEXT_PUBLIC_API_BASE_URL.',
                undefined
            );
        }
        try {
            const response: AxiosResponse<T> = await this.client.request({
                ...config,
                method,
                url: path,
                data,
            });

            const responseBody: unknown = response.data;
            // Only unwrap the canonical envelope {success, data}. A form
            // payload that itself contains a `data` key must not be unwrapped.
            const isEnvelope =
                typeof responseBody === 'object' &&
                responseBody !== null &&
                'success' in responseBody &&
                'data' in responseBody;
            const unwrappedData = isEnvelope
                ? (responseBody as { data: unknown }).data
                : responseBody;

            return {
                status: response.status,
                data: unwrappedData as T,
                raw: responseBody,
            };
        } catch (error) {
            if (isCancel(error)) {
                throw new Error(`Request to ${path} was aborted`);
            }

            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const responseData = error.response?.data as
                    | {
                          message?: string;
                          issues?: { path: string; message: string }[];
                      }
                    | undefined;

                const issues = responseData?.issues ?? [];

                const message = responseData?.message
                    ? String(responseData.message)
                    : getErrorMessage(status, responseData);

                throw new ApiError(message, status, issues);
            }

            throw error;
        }
    }

    public get<T>(path: string, config?: RequestConfig) {
        return this.request<T>('GET', path, undefined, config);
    }

    public post<T>(path: string, body?: unknown, config?: RequestConfig) {
        return this.request<T>('POST', path, body, config);
    }

    public put<T>(path: string, body?: unknown, config?: RequestConfig) {
        return this.request<T>('PUT', path, body, config);
    }

    public patch<T>(path: string, body?: unknown, config?: RequestConfig) {
        return this.request<T>('PATCH', path, body, config);
    }

    public delete<T>(path: string, config?: RequestConfig) {
        return this.request<T>('DELETE', path, undefined, config);
    }

    /** Raw binary download (CSV export). Auth header is attached. */
    public async getBlob(path: string, config?: RequestConfig): Promise<Blob> {
        if (!BASE_URL) {
            throw new ApiError(
                'API is not configured. Please set NEXT_PUBLIC_API_BASE_URL.',
                undefined
            );
        }
        try {
            const response = await this.client.get(path, {
                ...config,
                responseType: 'blob',
            });
            return response.data as Blob;
        } catch (error) {
            if (isCancel(error)) {
                throw new Error(`Request to ${path} was aborted`);
            }
            if (axios.isAxiosError(error)) {
                throw new ApiError(
                    getErrorMessage(error.response?.status, undefined),
                    error.response?.status
                );
            }
            throw error;
        }
    }
}

export const http = new HttpClient();
