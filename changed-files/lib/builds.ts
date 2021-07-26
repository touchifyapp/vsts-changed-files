import * as azdev from "azure-devops-node-api";

import type { IBuildApi } from "azure-devops-node-api/BuildApi";
import { Build, BuildResult, BuildQueryOrder } from "azure-devops-node-api/interfaces/BuildInterfaces";

export async function createClient(orgUri: string, accessToken: string): Promise<IBuildApi> {
    const auth = azdev.getBearerHandler(accessToken);
    const connection = new azdev.WebApi(orgUri, auth);

    return connection.getBuildApi();
}

export async function getBuildChanges(client: IBuildApi, project: string, buildId: number, { verbose }: { verbose?: boolean } = {}): Promise<string[]> {
    if (verbose) {
        console.log(`get the list of changes for the build ${buildId}`)
    }
    return (await client.getBuildChanges(project, buildId))
        .map(c => c.id || "")
        .filter(id => id != "")
}

export async function getLatestBuild(client: IBuildApi, project: string, definitionId: number): Promise<Build | undefined> {
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

// async function getCurrentBuild(client: IBuildApi, project: string, currentBuildId: number): Promise<Build> {
//     // const currentBuildId = parseInt(getVariable("Build.BuildId"));
//     return client.getBuild(project, currentBuildId);
// }
