import config from '@/config';
import AutoBoundClass from '@/utils/AutoBoundClass';
import argon2 from 'argon2';
import crypto from 'crypto';
import { AppError, SystemError } from '@/utils/AppError';

class Hash extends AutoBoundClass {
    private getArgonType(type: number) {
        switch (type) {
            case 0:
                return argon2.argon2d;
            case 1:
                return argon2.argon2i;
            case 2:
                return argon2.argon2id;
            default:
                throw new SystemError('[Hash]', 'Invalid Argon2 type');
        }
    }

    private HASH_OPTIONS = {
        ...config.argonOptions,
        secret: Buffer.from(config.argonOptions.secret, 'base64'),
        type: this.getArgonType(config.argonOptions.type),
    };

    constructor() {
        super();
    }

    /**
     * Hashes the given plain text using Argon2 algorithm with the specified options.
     *
     * @param plainText
     * @returns hashed value
     */
    async hashed(plainText: string): Promise<string> {
        try {
            return await argon2.hash(plainText, this.HASH_OPTIONS);
        } catch (error) {
            throw new SystemError('[Hash]', 'Internal server error');
        }
    }

    /**
     * Verifies if the given plain text matches the provided hash using Argon2 algorithm with the specified options.
     *
     * @param plainText
     * @param hash
     * @returns true if the plain text matches the hash, false otherwise
     */

    async verifyHash(plainText: string, hash: string): Promise<boolean> {
        try {
            return await argon2.verify(hash, plainText, this.HASH_OPTIONS);
        } catch (error) {
            throw AppError.Internal('Internal server error');
        }
    }

    hashEmail = (email: string): string => {
        return crypto
            .createHash('sha256')
            .update(email.trim().toLowerCase())
            .digest('hex');
    };
}

const HashBoot = new Hash();

export default HashBoot;
