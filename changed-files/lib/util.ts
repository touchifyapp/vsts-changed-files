import * as tl from "azure-pipelines-task-lib/task";
import * as tcm from "azure-pipelines-task-lib/taskcommand";

import * as minimatch from "minimatch";
import { PassThrough } from "stream";

export function getVariable(name: string): string {
    const val = tl.getVariable(name);
    if (!val) {
        throw new Error(`Environement Error: This task requires "${name}" variable.`);
    }

    return val;
}

export function setVariable(variable: string, value: string | number | boolean, isOutput?: boolean): void {
    const cmd = new tcm.TaskCommand("task.setvariable", { variable, isOutput }, value);
    console.log(cmd.toString());
    // console.log(`##vso[task.setvariable variable=${name};${isOutput ? "isOutput=true" : ""}]${value}`);
}

export function logVerbose(message: string, { verbose }: { verbose: boolean }): void {
    if (verbose) {
        console.log(message);
    }
    else {
        logDebug("CF:::" + message);
    }
}

export function logDebug(message: string): void {
    const cmd = new tcm.TaskCommand("task.debug", {}, message);
    console.log(cmd.toString());
}

export function fromEntries<T>(entries: Array<[string, T]>): Record<string, T> {
    const res: Record<string, T> = {};
    for (const [key, value] of entries) res[key] = value;
    return res;
}

export async function gitDiff(from: string, to: string, { cwd, verbose }: { cwd?: string; verbose?: boolean } = {}): Promise<string[]> {
    const res: string[] = [];

    const outStream = new PassThrough();

    if (verbose) {
        console.log(`> Executing git diff from HEAD to ${to}`);
        outStream.pipe(process.stdout);
    }

    outStream.on("data", (data: Buffer) => {
        const files = data.toString().split("\n").map(l => l.trim()).filter(l => !!l);
        res.push(...files);
    });

    await tl.exec("git", ["diff", "--name-only", from, to, "."], { cwd, outStream, });

    return res.filter(l => {
        if (l.startsWith("[command]")) return false;
        if (l.startsWith("rc:")) return false;
        if (l.startsWith("success:")) return false;
        return true;
    });
}

export function matchFiles(files: string[], rules: string[]): boolean {
    for (const pattern of rules) {
        const matched = minimatch.match(files, pattern);
        if (matched.length > 0) return true;
    }

    return false;
}
