import * as tl from "azure-pipelines-task-lib/task";
import * as azdev from "azure-devops-node-api";

import { Build, BuildResult, BuildQueryOrder } from "azure-devops-node-api/interfaces/BuildInterfaces";
import type { IBuildApi } from "azure-devops-node-api/BuildApi";

import { parseRules } from "./lib/parser";
import { getVariable, setVariable, gitDiff, logVerbose, matchFiles, fromEntries } from "./lib/util";

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

    const auth = azdev.getBearerHandler(accessToken);
    const connection = new azdev.WebApi(orgUri, auth);

    return connection.getBuildApi();
}

async function getChangedFiles(client: IBuildApi, { project, inputs: { cwd, verbose } }: Context): Promise<string[] | undefined> {
    logVerbose("> Fetching latest succeeded build", { verbose });

    const latestBuild = await getLatestBuild(client, project);

    if (!latestBuild || !latestBuild.sourceVersion) {
        logVerbose(">> No previous build found: consider that all files changed!", { verbose });
        return;
    }

    logVerbose(`> Last succeeded build found: ${latestBuild.buildNumber}`, { verbose });

    if (getVariable("Build.SourceVersion") === latestBuild.sourceVersion) {
        logVerbose(">> No new commit since last build: consider that no file changed!", { verbose });
        return [];
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

async function getLatestBuild(client: IBuildApi, project: string): Promise<Build | undefined> {
    const definitionId = parseInt(getVariable("System.DefinitionId"));

    const [latestBuild] = await client.getBuilds(
        project,
        [definitionId],
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        BuildResult.Succeeded,
        undefined,
        undefined,
        1,
        undefined,
        undefined,
        undefined,
        BuildQueryOrder.FinishTimeDescending
    );

    return latestBuild;
}

// async function getCurrentBuild(client: IBuildApi, project: string): Promise<Build> {
//     const currentBuildId = parseInt(getVariable("System.DefinitionId"));
//     return client.getBuild(project, currentBuildId);
// }

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
