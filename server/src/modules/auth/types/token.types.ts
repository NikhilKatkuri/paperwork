interface TokenPayload {
    userId: string;
    email: string;
}

type TokenType = 'access' | 'refresh' | 'temp' | 'resetPassword';

interface TokenMapValues {
    token: string;
    expiresIn: number;
}

type TokenMap = Record<TokenType, TokenMapValues>;

export { TokenPayload, TokenType, TokenMapValues, TokenMap };
