import * as tl from "azure-pipelines-task-lib/task";

import type { IBuildApi } from "azure-devops-node-api/BuildApi";

import { listChangedFilesFromCommits, listChangedFilesBetweenBranches } from "./lib/git-diff";
import { parseRules } from "./lib/parser";
import { matchFiles } from "./lib/matcher";
import { getBuildChanges, createClient } from "./lib/builds";
import { getVariable, setVariable, fromEntries, logVerbose } from "./lib/util";

run();

async function run(): Promise<void> {
    try {
        const context = createContext();
        const client = await initializeClient();

        const files = await getChangedFiles(client, context);
        const changes = getChangesPerVariable(files, context);

        setVariables(changes, context);
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, (err as Error).message);
    }
}

function createContext(): Context {
    const project = getVariable("System.TeamProjectId");

    const variable = tl.getInput("variable", true) || "FilesChanged";
    const rules = tl.getInput("rules") || "**";
    const isOutput = tl.getBoolInput("isOutput");
    const cwd = tl.getInput("cwd") || tl.cwd();
    const verbose = tl.getBoolInput("verbose");
    const refBranch = tl.getInput("refBranch", false);

    return {
        project,
        inputs: {
            variable,
            rules,
            isOutput,
            refBranch,
            cwd,
            verbose,
        },
    };
}

async function initializeClient(): Promise<IBuildApi> {
    const orgUri = getVariable("System.TeamFoundationCollectionUri");
    // Allow a missing AccessToken to default to an empty string to allow public API access
    const accessToken = getVariable("System.AccessToken", "");

    return createClient(orgUri, accessToken);
}

async function getChangedFiles(
    client: IBuildApi,
    { project, inputs: { cwd, verbose, refBranch } }: Context
): Promise<string[]> {
    const buildId = parseInt(getVariable("Build.BuildId"));
    const currentBranch = getVariable("Build.SourceBranch").replace("refs/heads/", "");

    logVerbose(`Build ID: ${buildId}`, { verbose });
    logVerbose(`Reference Branch: ${refBranch}`, { verbose });
    logVerbose(`Current Branch: ${currentBranch}`, { verbose });

    let files: string[];
    if (refBranch !== undefined && refBranch !== currentBranch) {
        logVerbose(`> Comparing '${currentBranch}' with the reference branch '${refBranch}'...`, { verbose });
        files = listChangedFilesBetweenBranches(refBranch, { cwd, verbose });
    } else {
        logVerbose(`> Extracting changes from the list of commits...`, { verbose });

        const commitIds = await getBuildChanges(client, { project, buildId, verbose });
        files = listChangedFilesFromCommits(commitIds, { cwd, verbose });
    }

    if (files.length > 0) {
        logVerbose(">> Changed files:", { verbose });
        for (const file of files) logVerbose("\t - " + file, { verbose });
    } else {
        logVerbose(">> No change found since last succeeded build!", { verbose });
    }

    return files;
}

function getChangesPerVariable(
    files: string[],
    { inputs: { rules, variable, verbose } }: Context
): Record<string, boolean> {
    const groupedRules = parseRules(rules, variable);
    const categories = Object.keys(groupedRules).filter((cat) => groupedRules[cat].length > 0);

    if (!files) {
        return fromEntries(categories.map((c) => [c, true]));
    }

    if (!files.length) {
        return fromEntries(categories.map((c) => [c, false]));
    }

    logVerbose("> Filtering files using glob rules", { verbose });

    return fromEntries(categories.map((cat) => [cat, matchFiles(files, groupedRules[cat])]));
}

function setVariables(changes: Record<string, boolean>, { inputs: { isOutput, verbose } }: Context): void {
    for (const [variable, hasChanged] of Object.entries(changes)) {
        logVerbose(
            `>> ${variable.toUpperCase()}: ${
                hasChanged ? "Changes" : "No change"
            } detected since last succeeded build, setting "${variable}" to "${hasChanged}"`,
            { verbose }
        );

        setVariable(variable, String(hasChanged), isOutput);
    }
}

interface Context {
    project: string;

    inputs: {
        variable: string;
        rules: string;
        isOutput: boolean;
        refBranch: string | undefined;
        cwd: string;
        verbose: boolean;
    };
}
