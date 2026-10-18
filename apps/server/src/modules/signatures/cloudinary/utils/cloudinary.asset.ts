/**
 * Helpers for matching delivery URLs back to the Cloudinary assets this
 * application owns.
 *
 * Avatar uploads are signed for one configured account and folder, so a
 * `secure_url` produced by that flow has a predictable shape:
 *
 *   https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>.<ext>
 *
 * e.g. .../image/upload/v1792313275/paperwork/r3hqbxaaoqzedida00vg.jpg
 * yields the public id `paperwork/r3hqbxaaoqzedida00vg`.
 *
 * Anything else (another account, transformed deliveries, other delivery
 * types, missing version) is treated as ambiguous and skipped rather than
 * guessed, because guessing wrong means destroying an asset we do not own.
 */
export interface CloudinaryAssetScope {
    cloudName: string;
    folder: string;
}

/** Delivery version segment Cloudinary emits for uploaded assets. */
const VERSION_SEGMENT = /^v\d+$/;

/** Trailing format extension appended to the public id in delivery URLs. */
const EXTENSION = /\.[^./]+$/;

export const isOwnedPublicId = (
    publicId: unknown,
    folder: string
): publicId is string =>
    folder.length > 0 &&
    typeof publicId === 'string' &&
    publicId.startsWith(`${folder}/`);

/**
 * Extracts the public id of an upload-delivery URL, or `null` when the URL
 * does not provably point at an asset in the configured account and folder.
 */
export const extractCloudinaryPublicId = (
    url: string | null | undefined,
    { cloudName, folder }: CloudinaryAssetScope
): string | null => {
    if (typeof url !== 'string' || url.length === 0) return null;

    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }

    if (
        parsed.protocol !== 'https:' ||
        parsed.hostname !== 'res.cloudinary.com'
    )
        return null;

    const prefix = `/${cloudName}/image/upload/`;
    if (!parsed.pathname.startsWith(prefix)) return null;

    const segments = parsed.pathname.slice(prefix.length).split('/');

    // Require the version segment; without it the first segment could be a
    // transformation, which would make the derived id meaningless.
    const version = segments.shift();
    if (!version || !VERSION_SEGMENT.test(version)) return null;

    const encoded = segments.join('/');
    if (encoded.length === 0) return null;

    let decoded: string;
    try {
        decoded = decodeURIComponent(encoded);
    } catch {
        return null;
    }

    const publicId = decoded.replace(EXTENSION, '');
    if (!isOwnedPublicId(publicId, folder)) return null;

    return publicId;
};
