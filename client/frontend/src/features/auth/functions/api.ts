type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface EndpointConfig {
  url: string;
  method: HttpMethod;
}

class API {
  private static readonly baseUrl: string = (() => {
    const url = process.env.NEXT_PUBLIC_API_BASE_AUTH_URL;
    if (!url) {
      throw new Error(
        "CRITICAL: NEXT_PUBLIC_API_BASE_AUTH_URL is not defined in environment variables.",
      );
    }
    return `${url}/auth`;
  })();

  private static getUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  public static readonly auth = {
    signIn: { url: API.getUrl("sign-in"), method: "POST" } as const,
    signUp: { url: API.getUrl("sign-up"), method: "POST" } as const,
    signOut: { url: API.getUrl("sign-out"), method: "POST" } as const,
    refreshToken: { url: API.getUrl("refresh-token"), method: "POST" } as const,
    me: { url: API.getUrl("me"), method: "GET" } as const,
    sendVerification: {
      url: API.getUrl("send-verification"),
      method: "POST",
    } as const,
    verifyEmail: { url: API.getUrl("verify-email"), method: "POST" } as const,
    changePassword: {
      url: API.getUrl("change-password"),
      method: "POST",
    } as const,
    forgotPassword: {
      url: API.getUrl("forgot-password"),
      method: "POST",
    } as const,
    checkEmailExists: {
      url: API.getUrl("check-email"),
      method: "POST",
    } as const,

    resetPassword: (token: string): EndpointConfig => ({
      url: API.getUrl(`reset-password/${token}`),
      method: "POST",
    }),
  } as const;
}

const api = new API();
export { api };
export default API;
