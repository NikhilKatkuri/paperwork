import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const load = async () => {
    const URL =
        'https://raw.githubusercontent.com/disposable/disposable-email-domains/master/domains.json';

    const response = await fetch(URL);

    if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
    }

    const domains = (await response.json()) as string[];
    if (!domains) {
        console.log('unable to fetch response');
        return;
    }
    const normalized = [...new Set(domains.map((d) => d.toLowerCase()))].sort();

    const filePath = join(__dirname, '../data/disposable-domains.json');

    await mkdir(dirname(filePath), { recursive: true });

    await writeFile(filePath, JSON.stringify(normalized, null, 2), 'utf8');

    console.log(`Saved ${normalized.length} domains to ${filePath}`);
};

load().catch((err) => {
    console.error(err);
    process.exit(1);
});
