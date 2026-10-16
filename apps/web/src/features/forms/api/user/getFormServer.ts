import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http';
import { FormDocument } from '../../types/form.type';
import { QuestionDoc, SectionDoc } from '@paperwork/types';
import { FormDB } from '@/types';
import { toISOString } from '../../types/db.types';

interface GetFormDataType {
    data: {
        form: FormDocument;
        questions: QuestionDoc[];
        sections: SectionDoc[];
    };
    message: string;
    sucess: boolean;
}

async function getFormServerById(id: string): Promise<FormDB | undefined> {
    try {
        const path = endpoints.forms.getFormById(id);

        const res = await http.get<GetFormDataType>(path);
        if (res.status === 200) {
            const form = res.data.data.form;
            return {
                ...form,
                id: form._id,
                questions: res.data.data.questions,
                sections: res.data.data.sections,
                isDirty: false,
                lastSyncedAt: toISOString(Date.now()),
            } as unknown as FormDB;
        }
        return undefined;
    } catch (err) {
        console.log(err);
    }
}

export default getFormServerById;
