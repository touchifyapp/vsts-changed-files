import * as tl from "azure-pipelines-task-lib/task";
import * as tcm from "azure-pipelines-task-lib/taskcommand";

export function getVariable(name: string, default_: string | null = null): string {
    const val = tl.getVariable(name);
    if (!val) {
        if (default_ != null) {
            return default_
        }
        throw new Error(`Environment Error: This task requires "${name}" variable.`);
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
