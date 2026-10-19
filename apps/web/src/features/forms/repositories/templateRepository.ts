import { db } from '@/lib/db';
import type { TemplateSummary } from '@/features/forms/api/user/templates';

export const TEMPLATE_CATALOG_ID = 'catalog';

/** The catalogue is refreshed from the server at most once a week. */
export const TEMPLATE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface TemplateCatalog {
    templates: TemplateSummary[];
    fetchedAt: number;
}

export function isTemplateCatalogFresh(catalog: TemplateCatalog): boolean {
    return Date.now() - catalog.fetchedAt < TEMPLATE_CACHE_TTL_MS;
}

class TemplateRepository {
    async getCatalog(): Promise<TemplateCatalog | null> {
        const record = await db.templates.get(TEMPLATE_CATALOG_ID);

        if (!record) return null;

        return { templates: record.templates, fetchedAt: record.fetchedAt };
    }

    async saveCatalog(templates: TemplateSummary[]): Promise<void> {
        await db.templates.put({
            id: TEMPLATE_CATALOG_ID,
            templates,
            fetchedAt: Date.now(),
        });
    }
}

const templateRepository = new TemplateRepository();

export default templateRepository;
