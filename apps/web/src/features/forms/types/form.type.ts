import { Form } from '@paperwork/types';
import Document from './db.types';

export type FormSettings = NonNullable<Form['settings']>;

type FormCore = Omit<Form, 'userId'>;
type FormDocument = Document<FormCore>;

export type { FormDocument };
export default FormCore;
