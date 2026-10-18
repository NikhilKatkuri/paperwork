/**
 * Request metadata contract shared by the web client and the server.
 *
 * Values are deliberately separated by source:
 *
 * - `client` fields are produced by the browser and are untrusted hints. The
 *   server validates, bounds and allowlists every field before use.
 * - `server` fields are derived from the HTTP request itself (socket address,
 *   header bytes as received, receive time). They are still client-influenced
 *   — a client can send any User-Agent it likes — but they are what page
 *   JavaScript cannot rewrite and what the trusted-proxy policy governs.
 *
 * Rules that apply everywhere this contract is used:
 *
 * - Never treat an IP address as a geographic location.
 * - Never treat any field here as proof of identity or as an authentication
 *   factor.
 * - Never derive or persist secrets (passwords, tokens, cookies) as metadata.
 */

/**
 * Request header carrying the serialized {@link ClientMetadata} object.
 * Must stay in sync with the CORS allowlist on the server.
 */
export const CLIENT_METADATA_HEADER = 'X-Paperwork-Client-Meta';

/**
 * Hard cap on the serialized client metadata header. Payloads larger than
 * this are ignored entirely rather than truncating JSON mid-structure.
 */
export const CLIENT_METADATA_MAX_BYTES = 2048;

/**
 * Field length caps, applied on both sides of the wire so the client never
 * sends something the server would reject and vice versa.
 */
export const METADATA_LIMITS = {
    /** Browser/OS family, platform, device brand/model/type. */
    name: 80,
    /** Version strings (browser, OS). */
    version: 40,
    /** Human-readable device/location labels used in emails. */
    label: 300,
    /** Raw User-Agent header retained on stored records. */
    userAgentRaw: 500,
    /** IP address string retained on stored records. */
    ipAddress: 100,
} as const;

export interface ClientBrowserMetadata {
    family?: string;
    version?: string;
}

export interface ClientOsMetadata {
    family?: string;
    version?: string;
}

export interface ClientDeviceMetadata {
    /** `mobile`, `tablet`, `console`, `smarttv`, ... as reported by the UA. */
    type?: string;
    brand?: string;
    model?: string;
}

/**
 * Metadata detected by the browser. Every field is optional: nothing is
 * fabricated when a browser does not expose a value.
 */
export interface ClientMetadata {
    browser?: ClientBrowserMetadata;
    os?: ClientOsMetadata;
    device?: ClientDeviceMetadata;
    /** `navigator.userAgentData.platform`, when the browser exposes it. */
    platform?: string;
    /** `navigator.userAgentData.mobile`, when the browser exposes it. */
    mobile?: boolean;
}

export interface GeoLocation {
    city?: string;
    region?: string;
    /** ISO 3166-1 alpha-2 country code from the local GeoIP database. */
    country?: string;
    timezone?: string;
}

/** Metadata derived from the request by the server. */
export interface ServerMetadata {
    /** Client address per the trusted-proxy policy; never taken from the body. */
    ip: string | null;
    /** User-Agent header exactly as received (bounded). */
    userAgent: string | null;
    /** Parsed browser identity, derived from the header above. */
    browser: ClientBrowserMetadata | null;
    /** Parsed OS identity, derived from the header above. */
    os: ClientOsMetadata | null;
    /** Parsed device identity, derived from the header above. */
    device: ClientDeviceMetadata | null;
    /** ISO 8601 timestamp of when the server received the request. */
    receivedAt: string;
    /** Raw `X-Forwarded-For` value; recorded for reference, never trusted. */
    forwardedFor: string | null;
    /** Whether Express was configured to trust proxy headers. */
    proxyTrusted: boolean;
    /** Whether the connection is encrypted, per `trust proxy`. */
    secure: boolean | undefined;
    /**
     * IP-derived estimate from the server's local GeoIP database. City-level
     * at best and never a precise physical location; `null` when the lookup
     * is unavailable.
     */
    location: GeoLocation | null;
}

/** Combined request metadata: untrusted client hints + server-derived facts. */
export interface RequestMetadata {
    client: ClientMetadata | null;
    server: ServerMetadata;
}
