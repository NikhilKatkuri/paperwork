import { FormType } from '@/types/form/forms';

export interface IformData extends Omit<FormType, 'sections'> {
    userId: string;
}
