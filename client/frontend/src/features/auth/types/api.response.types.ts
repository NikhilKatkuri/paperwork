interface BaseAuthResponse {
  success: boolean;
  message: string;
}

interface AuthResponse extends BaseAuthResponse {
  accessToken: string;
}

type SignInResponse = AuthResponse;
type SignUpResponse = AuthResponse;
type SignOutResponse = BaseAuthResponse;

interface Profile {
  readonly userId: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
}

interface ProfileResponse extends BaseAuthResponse {
  data: Profile;
}
interface EmailCheckResponse extends BaseAuthResponse {
  exists: boolean;
}

type RefreshTokenResponse = AuthResponse;
type VerificationResponse = BaseAuthResponse;
type VerifyEmailReponse = BaseAuthResponse;
type ChangePasswordResponse = BaseAuthResponse;
type ForgotPasswordResponse = BaseAuthResponse;
type ResetPasswordResponse = BaseAuthResponse;

export type {
  BaseAuthResponse,
  SignInResponse,
  SignUpResponse,
  SignOutResponse,
  EmailCheckResponse,
  ProfileResponse,
  Profile,
  VerificationResponse,
  VerifyEmailReponse,
  ChangePasswordResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  RefreshTokenResponse,
};
