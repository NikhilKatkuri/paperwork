import AutoBoundClass from '@/utils/AutoBoundClass';
import config from '@/config';
import jwt from 'jsonwebtoken';
import { SystemError } from '@/utils/AppError';
import { TokenMap, TokenType } from '../types/token.types';

class Token extends AutoBoundClass {
    private hashMap: TokenMap | null = null;

    private loadHashMap() {
        const jwtConfig = config.jwt;
        this.hashMap = {
            access: {
                token: jwtConfig.secret,
                expiresIn: jwtConfig.expiresIn,
            },
            refresh: {
                token: jwtConfig.refreshSecret,
                expiresIn: jwtConfig.refreshExpiresIn,
            },
            temp: {
                token: jwtConfig.tempSecret,
                expiresIn: jwtConfig.tempExpiresIn,
            },
            resetPassword: {
                token: jwtConfig.resetPasswordSecret,
                expiresIn: jwtConfig.resetPasswordExpiresIn,
            },
        };
    }

    constructor() {
        super();
        this.loadHashMap();
    }

    /**
     * getTokenConfig retrieves the token configuration for a given token type.
     *
     * @param type
     * @returns encrypted token configuration for the specified type
     */
    private getTokenConfig(type: TokenType) {
        if (!this.hashMap) {
            throw new SystemError(
                '[jwt-token]',
                'Token configuration not loaded'
            );
        }
        const currentTokenConfig = this.hashMap[type];
        if (!currentTokenConfig) {
            throw new SystemError('[jwt-token]', `Invalid token type: ${type}`);
        }
        return currentTokenConfig;
    }

    /**
     * Generates a JWT token for the given payload and type.
     *
     * @param payload
     * @param type
     * @returns the generated JWT token as a string
     */
    generateToken(payload: object, type: TokenType = 'access'): string {
        const currentTokenConfig = this.getTokenConfig(type);
        const token = jwt.sign(payload, currentTokenConfig.token, {
            expiresIn: currentTokenConfig.expiresIn,
        });
        return token;
    }

    verifyToken<T>(token: string, type: TokenType = 'access'): T {
        const currentTokenConfig = this.getTokenConfig(type);
        try {
            const decoded = jwt.verify(token, currentTokenConfig.token) as T;
            return decoded;
        } catch (error) {
            throw new SystemError('[jwt-token]', 'Invalid or expired token');
        }
    }
}

const TokenBoot = new Token();

export default TokenBoot;
