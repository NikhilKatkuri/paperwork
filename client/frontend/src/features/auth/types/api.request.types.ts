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

interface EmailCheckRequestBody {
  email: string;
}

type ForgotPasswordRequest = EmailCheckRequestBody;

interface ResetPasswordRequest {
  newPassword: string;
}

export type {
  SignInRequestBody,
  SignUpRequestBody,
  ChangePasswordRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  EmailCheckRequestBody,
  ResetPasswordRequest,
};
