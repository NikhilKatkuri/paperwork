type Origins = { env: 'dev'; urls: string[] } | { env: 'prod'; urls: string[] };

export interface AppConfig {
    env: string;
    port: number;
    host: string;
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
