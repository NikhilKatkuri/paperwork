import API from "@/api";
import { AppError } from "@/errors";
import { CheckEmailResponse, SignInProps, SignUpProps } from "@/types/auth";
import axios from "axios";

class AuthServices {
  private static apis = new API().auth();

  async signIn(data: SignInProps) {
    const { url, method } = AuthServices.apis.signIn;
    const response = await axios({
      method,
      url,
      data,
      headers: { "Content-Type": "application/json" },
    });

    if (response.status !== 201) {
      throw new Error(response.data.message ?? "Failed to sign in");
    }

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data;
  }

  async signUp(data: SignUpProps) {
    const { url, method } = AuthServices.apis.signUp;
    const response = await axios({
      method,
      url,
      data,
      headers: { "Content-Type": "application/json" },
    });

    if (response.status !== 200) {
      throw new Error("Failed to sign up");
    }

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return response.data;
  }

  async checkEmailExists(email: string): Promise<CheckEmailResponse> {
    const { url, method } = AuthServices.apis.checkEmailExists;
    const response = await axios({
      method,
      url,
      data: { email },
      headers: { "Content-Type": "application/json" },
    });

    if (!response) {
      throw new AppError(400, "Invalid email format");
    }

    if (!response.data.success) {
      throw new AppError(response.status, "Failed to check email");
    }

    return response.data;
  }
}

export default AuthServices;
