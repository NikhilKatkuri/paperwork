import geoip from 'geoip-lite';
import AutoBoundClass from '@/utils/AutoBoundClass';
import type { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import { RequestMeta } from '../types/user.auth';

class UserAgentService extends AutoBoundClass {
    constructor() {
        super();
    }

    public getMeta(req: Request): RequestMeta {
        return this.getRequestMeta(req);
    }

    private normalizeIp(ip: string | undefined | null): string | null {
        if (!ip) return null;

        let value = ip.trim();

        if (value.startsWith('::ffff:')) value = value.slice(7);

        if (value.startsWith('[') && value.endsWith(']'))
            value = value.slice(1, -1);

        if (value === '::1') value = '127.0.0.1';

        return value || null;
    }

    private getClientIp(req: Request): string | null {
        return this.normalizeIp(req.ip);
    }

    private getGeo(ip: string | null) {
        if (!ip || ip === '127.0.0.1') return null;

        const geo = geoip.lookup(ip);
        if (!geo) return null;

        return {
            city: geo.city || undefined,
            region: geo.region || undefined,
            country: geo.country || undefined,
            ll: Array.isArray(geo.ll)
                ? ([geo.ll[0], geo.ll[1]] as [number, number])
                : undefined,
            timezone: (geo as any).timezone || undefined,
        };
    }

    private getUserAgentInfo(req: Request) {
        const raw = req.get('user-agent') || req.headers['user-agent'] || null;

        if (!raw) {
            return { raw: null, device: null, browser: null, os: null };
        }

        const ua = UAParser(raw);

        const browserVersion = ua.browser?.version || undefined;
        const osVersion = ua.os?.version || undefined;

        return {
            raw,
            device: {
                family: ua.device.type || undefined,
                brand: ua.device.vendor || undefined,
                model: ua.device.model || undefined,
                type: ua.device.type || undefined,
            },
            browser: {
                family: ua.browser.name || undefined,
                version: browserVersion,
            },
            os: {
                family: ua.os.name || undefined,
                version: osVersion,
            },
        };
    }

    private getRequestMeta(req: Request): RequestMeta {
        const ip = this.getClientIp(req);
        const geo = this.getGeo(ip);
        const ua = this.getUserAgentInfo(req);

        return {
            ip,
            location: geo,
            device: ua.device,
            browser: ua.browser,
            os: ua.os,
            userAgentRaw: ua.raw,
        };
    }
}

const userAgentService = new UserAgentService();
export default userAgentService;
