import type { ReactNode } from 'react';

/**
 * Consistent heading/rhythm for the long-form info pages. Anchored sections
 * (`id`) double as the table-of-contents targets.
 */
export function InfoSection({
    id,
    title,
    children,
}: {
    id: string;
    title: string;
    children: ReactNode;
}) {
    return (
        <section id={id} className="scroll-mt-6 space-y-3">
            <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
            <div className="text-theme-on-surface/80 space-y-3 text-base leading-relaxed">
                {children}
            </div>
        </section>
    );
}

/** Bulleted list with project-consistent spacing and markers. */
export function InfoList({ items }: { items: ReactNode[] }) {
    return (
        <ul className="marker:text-theme-on-surface/40 list-disc space-y-1.5 pl-5">
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ul>
    );
}

/** Horizontally scrollable table for structured facts (cookies, storage). */
export function InfoTable({
    headers,
    rows,
}: {
    headers: string[];
    rows: ReactNode[][];
}) {
    return (
        <div className="border-theme-on-surface/10 overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                    <tr className="border-theme-on-surface/10 border-b text-left">
                        {headers.map((header) => (
                            <th
                                key={header}
                                scope="col"
                                className="px-4 py-2.5 font-semibold"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-theme-on-surface/10 divide-y">
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="align-top">
                            {row.map((cell, cellIndex) => (
                                <td
                                    key={cellIndex}
                                    className="text-theme-on-surface/80 px-4 py-2.5"
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
