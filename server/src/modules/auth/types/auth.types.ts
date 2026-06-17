export interface SignUpService {
    email: string;
    password: string;
    fullName: string;
    avatarUrl: string | null;
    bio: string;
}

export interface SignInService {
    email: string;
    password: string;
}

export interface AccountActionService {
    action:
        | 'delete-account'
        | 'enable-2fa'
        | 'disable-2fa'
        | 'deactivate-account';
    password: string;
}
