import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { siteConfig } from '@/config/site';

const SHARE_CODE_PATTERN = /^[A-Za-z0-9_-]{8}$/;

export function isValidShareCode(code: unknown): code is string {
    return typeof code === 'string' && SHARE_CODE_PATTERN.test(code);
}

export function buildShortUrl(code: string): string {
    const origin =
        typeof window !== 'undefined' && window.location?.origin
            ? window.location.origin
            : siteConfig.siteUrl;

    return `${origin.replace(/\/$/, '')}/s/${code}`;
}

export async function getOrCreateShareCode(formId: string): Promise<string> {
    const response = await http.post<{ code: string }>(
        endpoints.forms.shareLink(formId)
    );

    if (!isValidShareCode(response.data.code)) {
        throw new Error('Invalid share link returned by server');
    }
    return response.data.code;
}

export async function copyToClipboard(text: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        let copied = false;
        try {
            await navigator.clipboard.writeText(text);
            copied = true;
        } catch {
            copied = false;
        }
        if (copied) return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!copied) throw new Error('Could not copy the link');
}
