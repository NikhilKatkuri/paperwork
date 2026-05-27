import dotenv from 'dotenv';
dotenv.config();

function getEnvVar(key: string, defaultValue: number): number;
function getEnvVar(key: string, defaultValue: boolean): boolean;
function getEnvVar(key: string, defaultValue: string): string;
function getEnvVar(key: string): string | undefined;
function getEnvVar(
    key: string,
    defaultValue?: string | number | boolean
): string | number | boolean | undefined {
    const value = process.env[key];
    if (value === undefined || value.trim() === '') {
        return defaultValue;
    }
    const trimmed = value.trim();
    if (typeof defaultValue === 'boolean') {
        const lower = trimmed.toLowerCase();
        if (lower === 'true' || lower === '1') return true;
        if (lower === 'false' || lower === '0') return false;
        return defaultValue;
    }
    if (typeof defaultValue === 'number') {
        const num = Number(trimmed);
        return isNaN(num) ? defaultValue : num;
    }
    return trimmed;
}

function getEnvArray(key: string, defaultValue: string[] = []): string[] {
    const value = process.env[key];
    if (value === undefined || value.trim() === '') return defaultValue;
    return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

type Origins = { env: 'dev'; urls: string[] } | { env: 'prod'; urls: string[] };

interface AppConfig {
    env: string;
    port: number;
    mongo: {
        uri: string;
    };
    debug: boolean;
    origins: Origins;
    SALT_ROUNDS: number;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
}

const isDev = getEnvVar('NODE_ENV', 'development') === 'development';

const config: AppConfig = {
    env: getEnvVar('NODE_ENV', 'development'),
    port: getEnvVar('PORT', 5000),
    mongo: {
        uri: getEnvVar('MONGO_URI', 'mongodb://localhost:27017/paperwork'),
    },
    debug: getEnvVar('DEBUG', false),
    origins: isDev
        ? {
              env: 'dev',
              urls: getEnvArray('DEV_ORIGINS', [
                  'http://localhost:3000',
                  'http://localhost:5173',
              ]),
          }
        : { env: 'prod', urls: getEnvArray('PROD_ORIGINS') },
    SALT_ROUNDS: getEnvVar('SALT_ROUNDS', 10),
    JWT_SECRET: getEnvVar('JWT_SECRET') as string,
    JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET') as string,
};

export default config;
