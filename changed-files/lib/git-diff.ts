import { PassThrough } from "stream";

import * as tl from "azure-pipelines-task-lib/task";

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

export async function gitVerify(commitId: string, { cwd, verbose }: { cwd?: string; verbose?: boolean } = {}): Promise<boolean> {
    if (verbose) {
        console.log(`> Executing git cat-file with ${commitId}`);
    }

    return 0 === await tl.exec("git", ["cat-file", "-t", commitId], { cwd, ignoreReturnCode: true });
}