import axios, { AxiosRequestConfig, AxiosResponse, Method } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

class API {
  private baseUrl: string = BASE_URL;
  private token: string = "";

  setBearer(token: string): this {
    this.token = token;
    return this;
  }

  private async request<T>(
    method: Method,
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...((config?.headers as Record<string, string>) ?? {}),
    };

    const response: AxiosResponse<T> = await axios({
      method,
      url: `${this.baseUrl}${endpoint}`,
      data,
      headers,
      withCredentials: true,
      ...config,
    });

    return response.data;
  }

  get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>("GET", endpoint, undefined, config);
  }

  post<T>(
    endpoint: string,
    body: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.request<T>("POST", endpoint, body, config);
  }

  put<T>(
    endpoint: string,
    body: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.request<T>("PUT", endpoint, body, config);
  }

  patch<T>(
    endpoint: string,
    body: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.request<T>("PATCH", endpoint, body, config);
  }

  delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>("DELETE", endpoint, undefined, config);
  }
}

const api = new API();
export default api;
