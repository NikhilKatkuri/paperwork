export * from './types.document';

type Origins = { env: 'dev'; urls: string[] } | { env: 'prod'; urls: string[] };

export type LoggerLevel =
    'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

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
    /**
     * Express `trust proxy` setting. Resolved from `TRUST_PROXY`; defaults to
     * trusting a single hop (the load balancer). `true` is rejected at
     * startup because it makes `X-Forwarded-For` spoofable by any client.
     */
    trustProxy: boolean | number | string;
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
    /**
     * Auth cookie policy. `secure` must stay true behind HTTPS (any real
     * deployment); it can be disabled only for production-mode runs over
     * plain HTTP. `sameSite` must be `none` when the web app and API are on
     * different sites, `lax` when they share a registrable domain.
     */
    cookies: {
        secure: boolean;
        sameSite: 'lax' | 'strict' | 'none';
    };
    mail: {
        /**
         * Transport selection. Defaults to `resend` in production and
         * `nodemailer` elsewhere; `MAIL_MODE` overrides so a production
         * build can be exercised locally over SMTP without a verified
         * Resend domain.
         */
        mode: 'resend' | 'nodemailer';
        /**
         * Full sender identity (e.g. `Paperwork <no-reply@example.com>`).
         * Required in production when using Resend: its domain must be
         * verified on resend.com. Falls back to `hostUser` when unset.
         */
        from: string;
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
