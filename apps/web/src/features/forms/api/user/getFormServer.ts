import { endpoints } from '@/api/endpoints';
import { http } from '@/api/http'; 
import { FormDB } from '@/lib/db';
import SectionCore from '../../types/section.type';
import QuestionCore from '../../types/question.type';
import { FormDocument } from '../../types/form.type';

interface GetFormDataType {
    data: {
        form: FormDocument;
        questions: QuestionCore[];
        sections: SectionCore[];
    };
    message: string;
    sucess: boolean;
}

async function getFormServerById(id: string): Promise<FormDB | undefined> {
    try {
        const { path } = endpoints.forms.getFormById(id);

        const res = await http.get<GetFormDataType>(path);
        if (res.status === 200) { 
            console.log('Server response:', res.data);
            return {
                ...res.data.data.form,
                questions: res.data.data.questions,
                sections: res.data.data.sections,
                isDirty: false,
                syncedAt: Date.now(),
            };
        }
        return undefined;
    } catch (err) {
        console.log(err);
    }
}

export default getFormServerById;
