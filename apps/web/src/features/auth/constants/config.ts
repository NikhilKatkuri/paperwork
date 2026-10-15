import { AuthIntent, AuthStepsConfig } from '../types';

export const SignInSteps: AuthStepsConfig[] = [
    {
        step: 1,
        conditionToRedirect: (exists: boolean) => exists === true,
        next: (email: string) =>
            `/auth/signin?email=${encodeURIComponent(email)}&step=2`,
    },
    {
        step: 2,
        conditionToRedirect: (success: boolean) => success === true,
        next: null,
    },
];

export const SignUpSteps: AuthStepsConfig[] = [
    {
        step: 1,
        conditionToRedirect: (exists: boolean) => exists === false,
        next: (email: string) =>
            `/auth/signup?email=${encodeURIComponent(email)}&step=2`,
    },
    {
        step: 2,
        conditionToRedirect: (success: boolean) => success === true,
        next: null,
    },
];

export const ForgotPasswordSteps: AuthStepsConfig[] = [
    {
        step: 1,
        conditionToRedirect: (exists: boolean) => exists === true,
        next: null,
    },
];

const AuthFlow: Record<AuthIntent, AuthStepsConfig[]> = {
    signIn: SignInSteps,
    signUp: SignUpSteps,
    forgotPassword: ForgotPasswordSteps,
} as const;

export default AuthFlow;
