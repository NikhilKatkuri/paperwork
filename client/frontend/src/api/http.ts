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
export type ApiResponse<T> = { data: T; status: number };
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
    private client: AxiosInstance;
    private getToken: TokenGetter = () => null;
    constructor() {
        this.client = axios.create({
            baseURL: BASE_URL,
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
        try {
            const response: AxiosResponse<T> = await this.client.request<T>({
                ...config,
                method,
                url: path,
                data,
                signal: config.signal,
            });
            return { status: response.status, data: response.data };
        } catch (error) {
            if (isCancel(error)) {
                throw new Error(`Request to ${path} was aborted`);
            }

            /**
             * A bare "Request failed with status code 400" is undiagnosable.
             * Validation failures carry the offending field paths, so surface
             * them instead of discarding the response body.
             */
            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const data = error.response?.data as
                    | {
                          message?: string;
                          issues?: { path: string; message: string }[];
                      }
                    | undefined;

                const issues = data?.issues ?? [];

                // Prefer the server's own message so it is safe to show in the
                // UI; the request line stays as the fallback when the body
                // carried nothing useful. Status and issues remain on the error
                // for logging.
                throw new ApiError(
                    data?.message
                        ? String(data.message)
                        : `${method} ${path} failed (${status ?? 'network'})`,
                    status,
                    issues
                );
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
}
export const http = new HttpClient();
