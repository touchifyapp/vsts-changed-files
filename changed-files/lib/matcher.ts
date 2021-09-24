import * as minimatch from "minimatch";

export function matchFiles(files: string[], rules: string[]): boolean {
    for (const pattern of rules) {
        const matched = minimatch.match(files, pattern, { dot: true });
        if (matched.length > 0) return true;
    }

    return false;
}
