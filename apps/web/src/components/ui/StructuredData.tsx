'use client';

type JsonLd = Record<string, unknown>;

interface StructuredDataProps {
    organization?: JsonLd;
    website?: JsonLd;
    breadcrumb?: JsonLd;
}

export function StructuredData({
    organization,
    website,
    breadcrumb,
}: StructuredDataProps) {
    const entries = [
        ['organization', organization],
        ['website', website],
        ['breadcrumb', breadcrumb],
    ] as const;

    return (
        <>
            {entries.map(
                ([key, data]) =>
                    data && (
                        <script
                            key={key}
                            type="application/ld+json"
                            dangerouslySetInnerHTML={{
                                __html: JSON.stringify(data),
                            }}
                        />
                    )
            )}
        </>
    );
}
