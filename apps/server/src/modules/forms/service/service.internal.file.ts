import { createObjectCsvStringifier } from 'csv-writer';

class FileService {
    constructor() {
        const methods = Object.getOwnPropertyNames(
            FileService.prototype
        ).filter(
            (prop) =>
                prop !== 'constructor' &&
                typeof (this as any)[prop] === 'function'
        );

        for (const method of methods) {
            (this as any)[method] = (this as any)[method].bind(this);
        }
    }

    CSVExport(
        headers: string[],
        questionIdMap: Map<string, string>,
        responses: any[]
    ) {
        // Dedupe duplicate question titles so columns do not collide.
        const seen = new Map<string, number>();
        const uniqueHeaders = headers.map((h) => {
            const n = seen.get(h) ?? 0;
            seen.set(h, n + 1);
            return n === 0 ? h : `${h} (${n + 1})`;
        });
        const headerToQuestionText = new Map(
            uniqueHeaders.map((uh, i) => [uh, headers[i]])
        );
        const textToHeader = new Map<string, string>();
        uniqueHeaders.forEach((uh) => {
            const orig = headerToQuestionText.get(uh)!;
            if (!textToHeader.has(orig)) textToHeader.set(orig, uh);
        });
        const stringifier = createObjectCsvStringifier({
            header: [
                { id: '__email', title: 'email' },
                { id: '__submittedAt', title: 'submittedAt' },
                ...uniqueHeaders.map((h) => ({ id: h, title: h })),
            ],
        });

        const records = [];

        for (const response of responses) {
            const record: Record<string, any> = {
                __email: (response as any).email ?? '',
                __submittedAt:
                    (response as any).createdAt?.toString?.() ??
                    (response as any).createdAt ??
                    '',
            };
            for (const answer of (response as any).answers ?? []) {
                const questionText = questionIdMap.get(
                    answer.questionId?.toString()
                );
                if (!questionText) continue;
                const col = textToHeader.get(questionText) ?? questionText;
                const v = (answer as any).value;
                record[col] = Array.isArray(v) ? v.map(String).join('; ') : String(v ?? '');
            }

            records.push(record);
        }

        const csvHeader = stringifier.getHeaderString();
        const csvRecords = stringifier.stringifyRecords(records);
        return csvHeader + csvRecords;
    }
}

export default FileService;
