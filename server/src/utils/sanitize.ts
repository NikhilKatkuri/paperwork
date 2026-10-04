/**
 * Redaction helpers used before anything reaches a log sink.
 *
 * Request bodies on this API carry plaintext passwords, OTPs, refresh and
 * reset tokens and form answers, and `Authorization` / `Cookie` headers carry
 * bearer tokens. Every value that is logged passes through `sanitize` first.
 */

/** Placeholder written in place of a redacted value. */
export const REDACTED = '[REDACTED]';

/**
 * Keys matched case-insensitively in their entirety. These are the exact
 * field names we know carry credentials.
 */
const EXACT_SENSITIVE_KEYS: ReadonlySet<string> = new Set([
    // Passwords
    'password',
    'passwd',
    'confirmpassword',
    'newpassword',
    'oldpassword',
    'currentpassword',
    'passwordconfirmation',
    // Tokens and secrets
    'token',
    'tokenstring',
    'accesstoken',
    'refreshtoken',
    'idtoken',
    'resettoken',
    'verifytoken',
    'verificationtoken',
    'resetpasswordtoken',
    'otp',
    'secret',
    'clientsecret',
    'apikey',
    'apisecret',
    'privatekey',
    'signature',
    // Payment
    'cardnumber',
    'cvv',
    'cvc',
    'cardcode',
    // Transport credentials
    'authorization',
    'cookie',
    'setcookie',
    'proxyauthorization',
    'xapikey',
    'xauthtoken',
]);

/**
 * Fragments that mark a key as sensitive wherever they appear, so that
 * `userPassword`, `stripeSecretKey` and `refreshTokenExpiresAt` are all
 * caught without enumerating every variant.
 */
const SENSITIVE_FRAGMENTS: readonly string[] = [
    'password',
    'passwd',
    'token',
    'secret',
    'apikey',
    'privatekey',
    'credential',
    'cardnumber',
    'cvv',
];

const MAX_DEPTH = 8;
const MAX_ARRAY_ITEMS = 50;
const MAX_STRING_LENGTH = 2048;
const MAX_OBJECT_KEYS = 100;

/**
 * Decides whether a key names a secret. Over-redacting is the safe direction:
 * a `[REDACTED]` field that turned out to be harmless costs nothing, whereas
 * a leaked password costs an account.
 */
export const isSensitiveKey = (key: string): boolean => {
    const normalized = key.toLowerCase().replace(/[\s-]/g, '');
    if (EXACT_SENSITIVE_KEYS.has(normalized)) return true;
    return SENSITIVE_FRAGMENTS.some((fragment) =>
        normalized.includes(fragment)
    );
};

/**
 * Truncates long strings so a hostile client cannot inflate a single log
 * line, and reports how much was dropped.
 */
export const truncate = (value: string, max = MAX_STRING_LENGTH): string =>
    value.length <= max
        ? value
        : `${value.slice(0, max)}…[+${value.length - max} chars]`;
const looksLikeEmail =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

/**
 * Masks an email so an operator can still correlate sign-up attempts without
 * the log store becoming a list of customer addresses. `a***@e***.com`.
 */
export const maskEmail = (email: unknown): string => {
    if (typeof email !== 'string' || !looksLikeEmail.test(email)) {
        return REDACTED;
    }
    const atIndex = email.lastIndexOf('@');
    const local = email.slice(0, atIndex);
    const domain = email.slice(atIndex + 1);
    const dotIndex = domain.indexOf('.');
    const name = dotIndex === -1 ? domain : domain.slice(0, dotIndex);
    const tld = dotIndex === -1 ? '' : domain.slice(dotIndex);

    const mask = (part: string): string =>
        part.length <= 1 ? '*' : `${part[0]}${'*'.repeat(part.length - 1)}`;

    return `${mask(local)}@${mask(name)}${tld}`;
};

/**
 * Masks an IPv4/IPv6 address, keeping only enough of it to distinguish one
 * client from another in a log line.
 */
export const maskIp = (ip: string): string => {
    if (ip.includes(':')) {
        const groups = ip.split(':').filter(Boolean);
        return groups.slice(0, 3).join(':') + (groups.length > 3 ? ':*' : '');
    }
    const octets = ip.split('.');
    if (octets.length !== 4) return ip;
    return `${octets[0]}.${octets[1]}.*.*`;
};

interface SanitizeContext {
    depth: number;
    seen: WeakSet<object>;
}

/**
 * Deep-copies `input` into a JSON-safe structure, redacting sensitive keys
 * and bounding depth, breadth and string length.
 *
 * Cycle-safe: a body containing a circular reference degrades to
 * `[Circular]` rather than throwing. Never mutates the input, so it is safe
 * to call on `req.body` while the request is still being served.
 */

/**
 * Handles primitive type formatting (strings, numbers, functions, etc.)
 */
function sanitizePrimitive(input: unknown): unknown {
    switch (typeof input) {
        case 'string':
            return truncate(input);

        case 'number':
            return Number.isFinite(input) ? input : String(input);

        case 'boolean':
            return input;

        case 'bigint':
            return input.toString();

        case 'function':
            return `[Function ${(input as Function).name || 'anonymous'}]`;

        case 'symbol':
            return input.toString();

        default:
            return undefined;
    }
}

/**
 * Handles built-in reference instances (Date, Error, RegExp, Buffer)
 */
function sanitizeBuiltInInstance(
    input: unknown,
    context: SanitizeContext
): unknown  {
    if (input instanceof Date) {
        return input.toISOString();
    }

    if (input instanceof Error) {
        return sanitizeError(input, context);
    }

    if (input instanceof RegExp) {
        return input.toString();
    }

    if (Buffer.isBuffer(input)) {
        return `[Buffer ${input.length}B]`;
    }

    return null;
}

/**
 * Sanitizes arrays, Maps, and Sets.
 */
function sanitizeCollection(
    input: unknown[] | Map<unknown, unknown> | Set<unknown>,
    childContext: SanitizeContext,
): unknown {
    if (Array.isArray(input)) {
        const items = input
            .slice(0, MAX_ARRAY_ITEMS)
            .map((item) => sanitize(item, childContext));

        if (input.length > MAX_ARRAY_ITEMS) {
            items.push(`…[+${input.length - MAX_ARRAY_ITEMS} items]`);
        }

        return items;
    }

    if (input instanceof Map) {
        const entries: Record<string, unknown> = {};
        let count = 0;

        for (const [key, value] of input) {
            if (count >= MAX_OBJECT_KEYS) {
                entries['…'] = `[truncated after ${MAX_OBJECT_KEYS} entries]`;
                break;
            }

            const sanitizedKey = sanitize(key, childContext);
            const keyString =
                typeof sanitizedKey === 'string'
                    ? sanitizedKey
                    : String(sanitizedKey);

            entries[keyString] = sanitize(value, childContext);
            count++;
        }

        return entries;
    }

    if (input instanceof Set) {
        const values = [...input]
            .slice(0, MAX_ARRAY_ITEMS)
            .map((item) => sanitize(item, childContext));

        if (input.size > MAX_ARRAY_ITEMS) {
            values.push(`…[+${input.size - MAX_ARRAY_ITEMS} items]`);
        }

        return values;
    }

    return null;
}

/**
 * Sanitizes plain objects with key limiting and redaction.
 */
function sanitizeObject(
    input: Record<string, unknown>,
    childContext: SanitizeContext
): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    let count = 0;

    for (const [key, value] of Object.entries(input)) {
        if (count >= MAX_OBJECT_KEYS) {
            output['…'] = `[truncated after ${MAX_OBJECT_KEYS} keys]`;
            break;
        }

        output[key] = isSensitiveKey(key)
            ? REDACTED
            : sanitize(value, childContext);

        count++;
    }

    return output;
}
const DEFAULT_SANITIZE_CONTEXT: SanitizeContext = {
    depth: 0,
    seen: new WeakSet<object>(),
};

export const sanitize = (
    input: unknown,
    context: SanitizeContext = DEFAULT_SANITIZE_CONTEXT
): unknown => {
    if (input === null || input === undefined) {
        return input;
    }

    // 1. Primitive handling
    const primitiveResult = sanitizePrimitive(input);

    if (primitiveResult !== undefined) {
        return primitiveResult;
    }

    // 2. Built-in object handling
    const builtInResult = sanitizeBuiltInInstance(input, context);

    if (builtInResult !== null) {
        return builtInResult;
    }

    // 3. Depth check
    const { depth, seen } = context;

    if (depth >= MAX_DEPTH) {
        return '[MaxDepth]';
    }

    // 4. Object & circular reference handling
    if (typeof input === 'object') {
        const object = input as object;

        if (seen.has(object)) {
            return '[Circular]';
        }

        seen.add(object);

        const childContext: SanitizeContext = {
            depth: depth + 1,
            seen,
        };

        // 4a. Collections
        if (
            Array.isArray(input) ||
            input instanceof Map ||
            input instanceof Set
        ) {
            return sanitizeCollection(input, childContext);
        }

        // 4b. Objects
        return sanitizeObject(input as Record<string, unknown>, childContext);
    }

    // 5. Fallback
    return JSON.stringify(input, null, 2) ?? '<unserializable>';
};

/**
 * Normalizes an unknown throwable into a loggable object. Preserves the
 * discriminators (`name`, `code`, ...) that make a stack trace triageable.
 *
 * Pass `includeStack: false` for routine, fully-explained failures — an
 * expected 401 does not need fifteen frames, and the volume drowns out real
 * faults.
 */
const DEFAULT_ERROR_SANITIZE_CONTEXT: SanitizeContext = {
    depth: 0,
    seen: new WeakSet<object>(),
};
export const sanitizeError = (
    error: unknown,
    context: SanitizeContext = DEFAULT_ERROR_SANITIZE_CONTEXT,
    options: { includeStack?: boolean } = {}
): unknown => {
    if (!(error instanceof Error)) {
        return sanitize(error, context);
    }

    const output: Record<string, unknown> = {
        name: error.name,
        message: truncate(error.message),
    };

    if (options.includeStack !== false && error.stack) {
        output.stack = truncate(error.stack, MAX_STRING_LENGTH * 2);
    }

    // Preserve the fields that actually identify a failure in this codebase:
    // `statusCode` from AppError, `code` from Mongo/Redis/Node, `errors` from
    // zod, and `path`/`value` from a mongoose CastError.
    const extraKeys = [
        'code',
        'statusCode',
        'isOperational',
        'loc',
        'path',
        'value',
        'kind',
        'errors',
        'issues',
        'expiredAt',
    ];
    for (const key of extraKeys) {
        const value = (error as unknown as Record<string, unknown>)[key];
        if (value !== undefined) {
            output[key] = sanitize(value, {
                depth: context.depth + 1,
                seen: context.seen,
            });
        }
    }

    if (error.cause !== undefined) {
        output.cause = sanitizeError(error.cause, context);
    }

    return output;
};
