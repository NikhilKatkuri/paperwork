import crypto from 'crypto';
import config from '@/config/index';

class OTP {
    private secret: string;
    private expirationTime: number;

    constructor() {
        this.secret = config.otp.SECRET;
        this.expirationTime =
            parseInt(config.otp.EXPIRATION.toString(), 10) || 5 * 60 * 1000;
    }

    public generateOTP(
        userId: string,
        email: string
    ): { otp: string; expiresAt: number } {
        const expiresAt = Date.now() + this.expirationTime;
        const data = `${userId}:${email}:${expiresAt}`;
        const hmac = crypto
            .createHmac('sha256', this.secret)
            .update(data)
            .digest('hex');
        const numericValue = BigInt('0x' + hmac) % BigInt(1000000);
        const otp = numericValue.toString().padStart(6, '0');

        return {
            otp,
            expiresAt,
        };
    }

    public verifyOTP(
        userId: string,
        email: string,
        otp: string,
        expiresAt: number
    ): boolean {
        if (Date.now() > expiresAt) {
            return false;
        }

        if (!/^\d{6}$/.test(otp)) {
            return false;
        }

        const data = `${userId}:${email}:${expiresAt}`;
        const hmac = crypto
            .createHmac('sha256', this.secret)
            .update(data)
            .digest('hex');

        const numericValue = BigInt('0x' + hmac) % BigInt(1000000);
        const expectedOtp = numericValue.toString().padStart(6, '0');

        // Use timing-safe comparison to prevent timing attacks
        const expectedBuffer = Buffer.from(expectedOtp);
        const providedBuffer = Buffer.from(otp);

        try {
            const result = crypto.timingSafeEqual(
                expectedBuffer,
                providedBuffer
            );
            return result;
        } catch (error) {
            // Buffers have different lengths
            return false;
        }
    }
}

export default OTP;
