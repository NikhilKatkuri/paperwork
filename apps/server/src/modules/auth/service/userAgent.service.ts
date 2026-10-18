import type { Request } from 'express';

import AutoBoundClass from '@/utils/AutoBoundClass';
import {
    buildDeviceLabel,
    buildLocationLabel,
    lookupGeo,
    parseClientMetadata,
    parseUserAgent,
} from '@/utils/metadata';
import { captureNetworkInfo } from '@/utils/requestMeta';
import { maskIp } from '@/utils/sanitize';
import type { RequestMetadata } from '@paperwork/types';

/**
 * Assembles the request metadata contract for security-relevant flows.
 *
 * Two sources are kept strictly separate:
 *
 * - `server` values come from the HTTP request the server actually received
 *   (`req.ip` under the configured trusted-proxy policy, the raw header
 *   bytes, the receive time). They cannot be rewritten by page JavaScript.
 * - `client` values are validated hints from the browser. They are used to
 *   fill gaps the User-Agent header does not cover, never to override the
 *   server's own parse of that header.
 */
class UserAgentService extends AutoBoundClass {
    constructor() {
        super();
    }

    /** Full metadata record for the current request. */
    public getMeta(req: Request): RequestMetadata {
        const network = captureNetworkInfo(req);
        const userAgent = parseUserAgent(req.headers['user-agent']);
        const ip = network.ip ?? null;

        return {
            client: parseClientMetadata(req),
            server: {
                ip,
                userAgent: userAgent.raw,
                browser: userAgent.browser,
                os: userAgent.os,
                device: userAgent.device,
                receivedAt: new Date().toISOString(),
                forwardedFor: network.forwardedFor || null,
                proxyTrusted: network.proxyTrusted,
                secure: network.secure,
                location: lookupGeo(ip),
            },
        };
    }

    /**
     * Single source of truth for the human-readable values attached to
     * security events and sign-in notification emails. The device and
     * location labels never embed an IP address, and the returned IP is
     * pre-masked for storage in email content.
     */
    public getSecurityLabels(req: Request): {
        device: string;
        location: string;
        ip: string | null;
    } {
        const meta = this.getMeta(req);

        return {
            device: buildDeviceLabel(meta),
            location: buildLocationLabel(meta.server.location),
            ip: meta.server.ip ? maskIp(meta.server.ip) : null,
        };
    }
}

const userAgentService = new UserAgentService();
export default userAgentService;
