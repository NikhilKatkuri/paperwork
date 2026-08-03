import { Country, Gender, Language } from "../constants/enums";

export interface sensitiveData {
  dob: Date;
  gender: Gender;
  country: Country;
  language: Language;
}

export interface Profile {
  readonly userId: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  sensitiveData?: sensitiveData;
}
