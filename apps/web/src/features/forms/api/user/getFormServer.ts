import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { FormDocument } from '../../types/form.type';
import { QuestionDoc, SectionDoc } from '@paperwork/types';
import { FormDB } from '@/types';
import { toISOString } from '../../types/db.types';

interface GetFormDataType {
    form: FormDocument;
    questions: QuestionDoc[];
    sections: SectionDoc[];
}

async function getFormServerById(id: string): Promise<FormDB | undefined> {
    try {
        const path = endpoints.forms.getFormById(id);

        const res = await http.get<GetFormDataType>(path);
        const form = res.data.form;
        return {
            ...form,
            id: (form as unknown as { id?: string; _id?: string }).id ?? form._id,
            questions: res.data.questions,
            sections: res.data.sections,
            isDirty: false,
            lastSyncedAt: toISOString(Date.now()),
        } as unknown as FormDB;
    } catch (err) {
        console.log(err);
        return undefined;
    }
}

export default getFormServerById;
