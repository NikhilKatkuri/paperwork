export type sectionMeta = {
    title: string;
    description: string;
};

export type sectionMetaKeys = keyof sectionMeta;
export type sectionMetaChange = {
    key: sectionMetaKeys;
    value: string;
}