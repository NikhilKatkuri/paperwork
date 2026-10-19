interface TokenPayload {
    userId: string;
    email: string;
    iat?: number;
}

type TokenType = 'access' | 'refresh' | 'temp' | 'resetPassword';

interface TokenMapValues {
    token: string;
    expiresIn: number;
}

type TokenMap = Record<TokenType, TokenMapValues>;

export type { TokenPayload, TokenType, TokenMapValues, TokenMap };
