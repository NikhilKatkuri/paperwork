import { AppConfig } from '@/types';
import { SystemError } from '@/utils/AppError';
import dotenv from 'dotenv';
dotenv.config();

export function getEnvVar<T extends string | number | boolean>(
    key: string,
    defaultValue?: T
): T {
    const value = process.env[key];

    if (value === undefined || value.trim() === '') {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new SystemError(
            `[${key}]`,
            `Environment variable "${key}" is missing.`
        );
    }

    const trimmed = value.trim();

    if (trimmed === 'true') {
        return true as unknown as T;
    }
    if (trimmed === 'false') {
        return false as unknown as T;
    }

    const isPureNumber = /^-?\d+(\.\d+)?$/.test(trimmed);
    if (isPureNumber) {
        const parsedNum = Number(trimmed);
        if (!isNaN(parsedNum)) {
            return parsedNum as unknown as T;
        }
    }

    return trimmed as unknown as T;
}

function getEnvArray(key: string, defaultValue?: string[]): string[] {
    const value = process.env[key];
    if (value === undefined || value.trim() === '') {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new SystemError(
            `[${key}]`,
            `Environment variable "${key}" is not defined.`
        );
    }
    return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

const isDev = getEnvVar<string>('NODE_ENV', 'development') === 'development';

const config: AppConfig = {
    env: getEnvVar<string>('NODE_ENV', 'development'),
    port: getEnvVar<number>('PORT', 5000),
    host: getEnvVar<string>('HOST', '0.0.0.0'),
    mongo: {
        uri: getEnvVar<string>('MONGO_URI'),
    },
    debug: getEnvVar<boolean>('DEBUG', false),
    origins: isDev
        ? {
              env: 'dev',
              urls: getEnvArray('DEV_ORIGINS', ['http://localhost:3000']),
          }
        : {
              env: 'prod',
              urls: getEnvArray('PROD_ORIGINS'),
          },
    SALT_ROUNDS: getEnvVar<number>('SALT_ROUNDS', 10),
    jwt: {
        secret: getEnvVar<string>('JWT_SECRET'),
        tempSecret: getEnvVar<string>('JWT_TEMP_SECRET'),
        refreshSecret: getEnvVar<string>('JWT_REFRESH_SECRET'),
        resetPasswordSecret: getEnvVar<string>('JWT_RESET_PASSWORD_SECRET'),
        expiresIn: getEnvVar<number>('JWT_EXPIRES_IN', 900),
        tempExpiresIn: getEnvVar<number>('JWT_TEMP_EXPIRES_IN', 900),
        refreshExpiresIn: getEnvVar<number>('JWT_REFRESH_EXPIRES_IN', 604800),
        resetPasswordExpiresIn: getEnvVar<number>(
            'JWT_RESET_PASSWORD_EXPIRES_IN',
            900
        ),
    },
    mail: {
        host: getEnvVar<string>('MAIL_HOST', 'smtp.gmail.com'),
        port: getEnvVar<number>('MAIL_PORT', 465),
        secure: getEnvVar<boolean>('MAIL_SECURE', true),
        hostUser: getEnvVar<string>('MAIL_HOST_USER'),
        hostPass: getEnvVar<string>('MAIL_HOST_PASS'),
    },
    otp: {
        SECRET: getEnvVar<string>('OTP_SECRET'),
        EXPIRATION: getEnvVar<number>('OTP_EXPIRATION', 300000),
    },
    WEB_URL: getEnvVar<string>('WEB_URL'),
    redis: {
        url: getEnvVar<string>('REDIS_URL'),
    },
    cloudinary: {
        cloud_name: getEnvVar<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: getEnvVar<string>('CLOUDINARY_API_KEY'),
        api_secret: getEnvVar<string>('CLOUDINARY_API_SECRET'),
        expiration: getEnvVar<number>(
            'CLOUDINARY_SIGNED_URL_EXPIRATION',
            300000
        ),
        named_folder: getEnvVar<string>('CLOUDINARY_FOLDER', 'paperwork'),
        window_expiration: getEnvVar<number>(
            'CLOUDINARY_BUCKET_WINDOW_EXPIRATION',
            600000
        ),
        window_buffer: getEnvVar<number>(
            'CLOUDINARY_BUCKET_WINDOW_BUFFER',
            300000
        ),
    },
    argonOptions: {
        type: getEnvVar<number>('ARGON_TYPE', 2),
        memoryCost: getEnvVar<number>('ARGON_MEMORY_COST', 65536),
        timeCost: getEnvVar<number>('ARGON_TIME_COST', 3),
        parallelism: getEnvVar<number>('ARGON_PARALLELISM', 4),
        hashLength: getEnvVar<number>('ARGON_HASH_LENGTH', 32),
        secret: getEnvVar<string>('ARGON_SECRET'),
    },
    RESEND_API_KEY: getEnvVar<string>('RESEND_API_KEY'),
};

export default config;
