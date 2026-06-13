export interface SignInProps {
  email: string;
  password: string;
}
export interface SignUpProps {
  email: string;
  password: string;
  fullName: string;
}

export interface SignUpClientComponentProps extends SignUpProps {
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setFullName: (fullName: string) => void;
}

export interface BaseResponse {
  success: boolean;
  message: string;
}

export interface CheckEmailResponse extends BaseResponse {
  exists: boolean;
}

export interface SignUpResponse extends BaseResponse {
  accessToken?: string;
}