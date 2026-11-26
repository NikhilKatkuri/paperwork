import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    generateShareCode,
    isDuplicateKeyError,
    isValidShareCode,
} from '../utils/shareCode';

describe('share codes', () => {
    it('generates unique, url-safe 8-character codes', () => {
        const codes = new Set(
            Array.from({ length: 500 }, () => generateShareCode())
        );

        assert.equal(codes.size, 500);
        for (const code of codes) {
            assert.match(code, /^[A-Za-z0-9_-]{8}$/);
            assert.ok(isValidShareCode(code));
        }
    });

    it('rejects malformed codes', () => {
        for (const bad of [
            '',
            'short',
            '123456789',
            'abc defg',
            'abc%def',
            'abc def',
            123,
            null,
            undefined,
        ]) {
            assert.equal(isValidShareCode(bad), false);
        }
    });

    it('recognises mongo duplicate key errors only', () => {
        assert.equal(isDuplicateKeyError({ code: 11000 }), true);
        assert.equal(isDuplicateKeyError({ code: 11001 }), false);
        assert.equal(isDuplicateKeyError(new Error('nope')), false);
        assert.equal(isDuplicateKeyError(null), false);
    });
});
