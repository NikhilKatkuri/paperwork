import sanitizeHtml from 'sanitize-html';

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: [
        'b',
        'i',
        'u',
        'strong',
        'em',
        'a',
        'ul',
        'ol',
        'li',
        'p',
        'br',
        'span',
    ],
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ['http', 'https'],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
};

export function sanitizeRichText(value: string): string {
    return sanitizeHtml(value, RICH_TEXT_OPTIONS);
}
