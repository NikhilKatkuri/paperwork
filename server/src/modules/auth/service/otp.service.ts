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

    /**
     * Generates a one-time password (OTP) based on the provided payloads and returns the OTP along with its expiration time.
     *
     * @process: -> create an sorted string from payloads, append the expiration time
     *           -> generate a HMAC using SHA-256 with a secret key,
     *           -> convert the HMAC to a numeric value, and format it as a 6-digit OTP.
     *
     * @param payloads
     * @returns  {otp, expiresAt}
     */
    public generateOTP(payloads: Record<string, string>): {
        otp: string;
        expiresAt: number;
    } {
        const sortedKeys = Object.keys(payloads).sort();

        const expiresAt = Date.now() + this.expirationTime;

        const data =
            JSON.stringify(
                Object.fromEntries(sortedKeys.map((k) => [k, payloads[k]]))
            ) + expiresAt;

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

    /**
     * Verifies the provided one-time password (OTP) against the expected OTP generated from the given payloads and expiration time.
     *
     * @process: -> Check if the current time is greater than the expiration time, return false if expired
     *           -> Validate the OTP format (must be a 6-digit number), return false if invalid
     *           -> Create a sorted string from payloads, append the expiration time
     *           -> Generate a HMAC using SHA-256 with the secret key,
     *           -> Convert the HMAC to a numeric value, and format it as a 6-digit expected OTP
     *
     * @param payloads
     * @param otp
     * @param expiresAt
     * @returns
     */

    public verifyOTP(
        payloads: Record<string, string>,
        otp: string,
        expiresAt: number
    ): boolean {
        if (Date.now() > expiresAt) {
            return false;
        }

        if (!/^\d{6}$/.test(otp)) {
            return false;
        }

        const sortedKeys = Object.keys(payloads).sort();
        const data =
            JSON.stringify(
                Object.fromEntries(sortedKeys.map((k) => [k, payloads[k]]))
            ) + expiresAt;

        const hmac = crypto
            .createHmac('sha256', this.secret)
            .update(data)
            .digest('hex');

        const numericValue = BigInt('0x' + hmac) % BigInt(1000000);
        const expectedOtp = numericValue.toString().padStart(6, '0');

        const expectedBuffer = Buffer.from(expectedOtp);
        const providedBuffer = Buffer.from(otp);

        try {
            const result = crypto.timingSafeEqual(
                expectedBuffer,
                providedBuffer
            );
            return result;
        } catch (error) {
            return false;
        }
    }
}

const OTPBoot = new OTP();

export default OTPBoot;
