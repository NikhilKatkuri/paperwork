export type NormalizedUrl =
    | {
          type: 'random';
          name: string;
          color: string;
      }
    | {
          type: 'custom';
          url: string;
      };

function normalizeUrl(url: string): NormalizedUrl {
    if (url.startsWith('randomuser:')) {
        const params = new URLSearchParams(url.replace('randomuser:', ''));

        return {
            type: 'random',
            name: params.get('name') || 'U',
            color: params.get('color') || '#6B7280',
        };
    }

    return {
        type: 'custom',
        url,
    };
}

export default normalizeUrl;
