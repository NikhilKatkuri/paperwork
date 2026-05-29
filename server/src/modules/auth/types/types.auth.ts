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
