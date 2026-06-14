interface SignUpRequestBody extends SignInRequestBody {
  fullName: string;
  avatarUrl?: string;
  bio?: string;
}

interface SignInRequestBody {
  email: string;
  password: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface VerifyEmailRequest {
  otp: string;
}

interface ForgotPasswordRequest {
  email: string;
}

type EmailCheckRequestBody = ForgotPasswordRequest;
export type {
  SignInRequestBody,
  SignUpRequestBody,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  EmailCheckRequestBody,
};
