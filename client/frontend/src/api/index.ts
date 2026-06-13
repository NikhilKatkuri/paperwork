class API {
  private baseUrl: string | null = null;

  constructor() {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    } else if (process.env.API_BASE_URL) {
      this.baseUrl = process.env.API_BASE_URL;
    }
  }

  auth() {
    const baseAuthUrl = this.baseUrl ? `${this.baseUrl}/auth` : "/auth";
    const getUrl = (endpoint: string) => `${baseAuthUrl}/${endpoint}`;

    return {
      signIn: { url: getUrl("signin"), method: "POST" },
      signUp: { url: getUrl("signup"), method: "POST" },
      signOut: { url: getUrl("signout"), method: "POST" },
      refreshToken: { url: getUrl("refresh-token"), method: "POST" },
      me: { url: getUrl("me"), method: "GET" },
      sendVerification: { url: getUrl("send-verification"), method: "POST" },
      verifyEmail: { url: getUrl("verify-email"), method: "POST" },
      changePassword: { url: getUrl("change-password"), method: "POST" },
      forgotPassword: { url: getUrl("forgot-password"), method: "POST" },
      resetPassword: (token: string) => ({
        url: getUrl(`reset-password/${token}`),
        method: "POST",
      }),
      checkEmailExists: { url: getUrl("check-email"), method: "POST" },
    };
  }
}

export default API;
