import * as tl from "azure-pipelines-task-lib/task";
import { logVerbose } from "./util";

export type GitChangesOptions = { cwd?: string; verbose?: boolean };

export function listChangedFilesBetweenBranches(refBranch: string, opts: GitChangesOptions): string[] {
    return listChangedFiles(["diff", "--name-only", `origin/${refBranch}...`], opts);
}

export function listChangedFilesFromCommits(commitIds: string[], opts: GitChangesOptions): string[] {
    const files = commitIds.map((commitId) => getCommitChangedFiles(commitId, opts));
    return ([] as string[]).concat(...files);
}

function getCommitChangedFiles(commitId: string, opts: GitChangesOptions): string[] {
    return listChangedFiles(["log", "-m", "-1", "--name-only", "--pretty=format:", commitId], opts);
}

function listChangedFiles(gitDiffCmdArgs: string[], { cwd, verbose }: GitChangesOptions): string[] {
    logVerbose(`> Executing: git ${gitDiffCmdArgs.join(" ")}`, { verbose });

    return tl
        .execSync("git", gitDiffCmdArgs, { cwd })
        .stdout.split("\n")
        .map((l) => l.trim().replace(/(^")|("$)/g, ""))
        .filter((l) => l !== "");
}
