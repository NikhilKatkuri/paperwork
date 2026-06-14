export interface AuthStepsConfig {
  step: number; 
  conditionToRedirect: (arg: boolean) => boolean;
  next: ((arg: string) => string) | null;
}

export type AuthIntent = "signUp" | "signIn" | "forgotPassword";

 
