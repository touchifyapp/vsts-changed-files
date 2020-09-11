import * as tl from "azure-pipelines-task-lib/task";

import type { IBuildApi } from "azure-devops-node-api/BuildApi";

import { gitDiff, gitVerify } from "./lib/git-diff";
import { parseRules } from "./lib/parser";
import { matchFiles } from "./lib/matcher";
import { getLatestBuild, createClient } from "./lib/builds";
import { getVariable, setVariable, fromEntries, logVerbose } from "./lib/util";

run();

async function run(): Promise<void> {
    try {
        const context = createContext();
        const client = await initializeClient();

        const files = await getChangedFiles(client, context);
        const changes = getChangesPerVariable(files, context);

        setVariables(changes, context);
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}

function createContext(): Context {
    const project = getVariable("System.TeamProjectId");

    const variable = tl.getInput("variable", true) || "FilesChanged";
    const rules = tl.getInput("rules") || "**";
    const isOutput = tl.getBoolInput("isOutput");
    const cwd = tl.getInput("cwd") || tl.cwd();
    const verbose = tl.getBoolInput("verbose");

    return {
        project,
        inputs: {
            variable,
            rules,
            isOutput,
            cwd,
            verbose
        }
    };
}

async function initializeClient(): Promise<IBuildApi> {
    const orgUri = getVariable("System.TeamFoundationCollectionUri");
    const accessToken = getVariable("System.AccessToken");

    return createClient(orgUri, accessToken);
}

async function getChangedFiles(client: IBuildApi, { project, inputs: { cwd, verbose } }: Context): Promise<string[] | undefined> {
    logVerbose("> Fetching latest succeeded build", { verbose });

    const definitionId = parseInt(getVariable("System.DefinitionId"));
    const latestBuild = await getLatestBuild(client, project, definitionId);

    if (!latestBuild || !latestBuild.sourceVersion) {
        logVerbose(">> No previous build found: consider that all files changed!", { verbose });
        return;
    }

    logVerbose(`> Last succeeded build found: ${latestBuild.buildNumber}`, { verbose });

    if (getVariable("Build.SourceVersion") === latestBuild.sourceVersion) {
        logVerbose(">> No new commit since last build: consider that no file changed!", { verbose });
        return [];
    }

    if (!await gitVerify(latestBuild.sourceVersion, { cwd, verbose })) {
        logVerbose(">> Previous build source invalid: consider that all files changed!", { verbose });
        return;
    }

    const files = await gitDiff("HEAD", latestBuild.sourceVersion, { cwd, verbose });

    if (files.length > 0) {
        logVerbose(">> Changes since last succeeded build:", { verbose });
        for (const file of files) logVerbose("\t - " + file, { verbose });
    }
    else {
        logVerbose(">> No change found since last succeeded build!", { verbose });
    }

    return files;
}

function getChangesPerVariable(files: string[] | undefined, { inputs: { rules, variable, verbose } }: Context): Record<string, boolean> {
    const groupedRules = parseRules(rules, variable);
    const categories = Object.keys(groupedRules).filter(cat => groupedRules[cat].length > 0);

    if (!files) {
        return fromEntries(categories.map(c => [c, true]));
    }

    if (!files.length) {
        return fromEntries(categories.map(c => [c, false]));
    }

    logVerbose("> Filtering files using glob rules", { verbose });

    return fromEntries(
        categories.map(cat => [cat, matchFiles(files, groupedRules[cat])])
    );
}

function setVariables(changes: Record<string, boolean>, { inputs: { isOutput, verbose } }: Context): void {
    for (const [variable, hasChanged] of Object.entries(changes)) {
        logVerbose(`>> ${variable.toUpperCase()}: ${hasChanged ? "Changes" : "No change"} detected since last succeeded build, setting "${variable}" to "${hasChanged}"`, { verbose });

        setVariable(variable, String(hasChanged), isOutput);
    }
}

interface Context {
    project: string;

    inputs: {
        variable: string;
        rules: string;
        isOutput: boolean;
        cwd: string;
        verbose: boolean;
    };
}
