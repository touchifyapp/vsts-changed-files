const CATEGORY_REGEX = /^\[([^\]]+)\]$/;

export function parseRules(str: string, defaultVariable: string): Record<string, string[]> {
    const lines = str.split(/\r?\n/).map(l => l.trim()).filter(l => !!l);

    const res: Record<string, string[]> = { [defaultVariable]: [] };
    let currentCategory = defaultVariable;

    for (const line of lines) {
        const category = getCategory(line);
        if (category) {
            res[category] = [];
            currentCategory = category;
        }
        else {
            res[currentCategory].push(line);
        }
    }

    return res;
}

function getCategory(line: string): string | undefined {
    const matches = line.match(CATEGORY_REGEX);
    return matches?.[1];
}
