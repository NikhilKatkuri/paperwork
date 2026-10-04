type Origins = { env: 'dev'; urls: string[] } | { env: 'prod'; urls: string[] };

export type LoggerLevel =
    | 'error'
    | 'warn'
    | 'info'
    | 'http'
    | 'verbose'
    | 'debug'
    | 'silly';

export interface LoggerConfig {
    /**
     * Minimum winston level that reaches a transport.
     */
    level: LoggerLevel;
    /**
     * Whether parsed request bodies are attached to access logs. Defaults to
     * on in development and off in production: bodies on this API carry
     * passwords, OTPs and reset tokens, and redaction cannot guarantee that
     * every future field is covered.
     */
    requestBody: boolean;
    /**
     * Whether CORS preflight (`OPTIONS`) requests get an access log line.
     */
    logPreflight: boolean;
    /**
     * How many `4xx` responses from one client inside
     * `suspiciousPayloadWindowMs` are treated as a payload-injection burst.
     */
    suspiciousPayloadThreshold: number;
    /** Sliding window, in ms, used by the suspicious payload detector. */
    suspiciousPayloadWindowMs: number;
}

export interface AppConfig {
    env: string;
    port: number;
    host: string;
    logger: LoggerConfig;
    mongo: {
        uri: string;
    };
    debug: boolean;
    origins: Origins;
    SALT_ROUNDS: number;
    jwt: {
        secret: string;
        tempSecret: string;
        refreshSecret: string;
        resetPasswordSecret: string;
        expiresIn: number;
        tempExpiresIn: number;
        refreshExpiresIn: number;
        resetPasswordExpiresIn: number;
    };
    mail: {
        host: string;
        port: number;
        secure: boolean;
        hostUser: string;
        hostPass: string;
    };
    otp: {
        SECRET: string;
        EXPIRATION: number;
    };
    WEB_URL: string;
    redis: {
        url: string;
    };
    cloudinary: {
        cloud_name: string;
        api_key: string;
        api_secret: string;
        named_folder: string;
        expiration: number;
        window_expiration: number;
        window_buffer: number;
    };
    argonOptions: {
        type: number;
        memoryCost: number;
        timeCost: number;
        parallelism: number;
        hashLength: number;
        secret: string;
    };
    RESEND_API_KEY: string;
}
