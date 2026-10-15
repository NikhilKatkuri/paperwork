import { createObjectCsvStringifier } from 'csv-writer';
import { FormResponse } from '@paperwork/types';

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
        responses: FormResponse[]
    ) {
        const stringifier = createObjectCsvStringifier({
            header: headers.map((h) => ({ id: h, title: h })),
        });

        const records = [];

        for (const response of responses) {
            const record: Record<string, any> = {};
            for (const answer of response.answers) {
                const questionText = questionIdMap.get(
                    answer.questionId.toString()
                );
                if (questionText && Array.isArray(answer.value)) {
                    record[questionText] = answer.value.join('; ');
                }
            }

            records.push(record);
        }

        const csvHeader = stringifier.getHeaderString();
        const csvRecords = stringifier.stringifyRecords(records);
        return csvHeader + csvRecords;
    }
}

export default FileService;
