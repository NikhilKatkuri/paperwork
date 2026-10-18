import { UAParser } from 'ua-parser-js';

import {
    CLIENT_METADATA_MAX_BYTES,
    METADATA_LIMITS,
    type ClientMetadata,
} from '@paperwork/types';

/**
 * Collects the browser's own view of itself and serializes it for the
 * `X-Paperwork-Client-Meta` request header.
 *
 * Ground rules:
 *
 * - nothing is fabricated: a field is present only when the browser exposes
 *   it, and absent fields are simply omitted;
 * - collection never throws — a hostile or exotic browser environment must
 *   not be able to break sign-in or form submission;
 * - values are trimmed to the shared limits and stripped of control
 *   characters before serialization, so the server receives exactly what the
 *   contract allows;
 * - the result is cached for the lifetime of the page: `navigator` identity
 *   does not change while the tab is open, so repeated requests reuse one
 *   parse instead of re-running the UA regexes on every call.
 */

const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]+/g;

const bounded = (value: unknown, max: number): string | undefined => {
    if (typeof value !== 'string') return undefined;

    const cleaned = value
        .replace(CONTROL_CHARS, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleaned) return undefined;
    return cleaned.slice(0, max);
};

interface NavigatorUADataLike {
    platform?: string;
    mobile?: boolean;
}

/** `navigator.userAgentData` is Chromium-only; read it defensively. */
const readUserAgentData = (): NavigatorUADataLike | undefined => {
    if (typeof navigator === 'undefined') return undefined;

    const data = (navigator as { userAgentData?: NavigatorUADataLike })
        .userAgentData;
    if (!data || typeof data !== 'object') return undefined;

    return data;
};

let cached: string | null | undefined;

const collect = (): ClientMetadata | null => {
    if (typeof navigator === 'undefined' || !navigator.userAgent) {
        return null;
    }

    try {
        const ua = new UAParser(navigator.userAgent).getResult();
        const uaData = readUserAgentData();

        const browser = {
            family: bounded(ua.browser.name, METADATA_LIMITS.name),
            version: bounded(ua.browser.version, METADATA_LIMITS.version),
        };
        const os = {
            family: bounded(ua.os.name, METADATA_LIMITS.name),
            version: bounded(ua.os.version, METADATA_LIMITS.version),
        };
        const device = {
            type: bounded(ua.device.type, METADATA_LIMITS.name),
            brand: bounded(ua.device.vendor, METADATA_LIMITS.name),
            model: bounded(ua.device.model, METADATA_LIMITS.name),
        };

        const metadata: ClientMetadata = {};

        if (browser.family || browser.version) metadata.browser = browser;
        if (os.family || os.version) metadata.os = os;
        if (device.type || device.brand || device.model) {
            metadata.device = device;
        }

        const platform = bounded(uaData?.platform, METADATA_LIMITS.name);
        if (platform) metadata.platform = platform;

        if (typeof uaData?.mobile === 'boolean') {
            metadata.mobile = uaData.mobile;
        } else if (device.type === 'mobile') {
            metadata.mobile = true;
        }

        const hasAny =
            metadata.browser !== undefined ||
            metadata.os !== undefined ||
            metadata.device !== undefined ||
            metadata.platform !== undefined ||
            metadata.mobile !== undefined;

        return hasAny ? metadata : null;
    } catch {
        return null;
    }
};

/**
 * Serialized value for the metadata header, or `null` when there is nothing
 * trustworthy to send (server-side render, missing `navigator`, or a payload
 * that would exceed the shared byte cap — in which case the server simply
 * falls back to its own User-Agent parsing).
 */
export const getClientMetadataHeaderValue = (): string | null => {
    if (cached !== undefined) return cached;

    const metadata = collect();
    if (!metadata) {
        cached = null;
        return cached;
    }

    try {
        const serialized = JSON.stringify(metadata);
        const bytes = new TextEncoder().encode(serialized).length;
        cached = bytes <= CLIENT_METADATA_MAX_BYTES ? serialized : null;
    } catch {
        cached = null;
    }

    return cached;
};
