import * as azdev from "azure-devops-node-api";

import type { IBuildApi } from "azure-devops-node-api/BuildApi";
import { Build, BuildResult, BuildQueryOrder } from "azure-devops-node-api/interfaces/BuildInterfaces";

export async function createClient(orgUri: string, accessToken: string): Promise<IBuildApi> {
    const auth = azdev.getBearerHandler(accessToken);
    const connection = new azdev.WebApi(orgUri, auth);

    return connection.getBuildApi();
}

export async function getLatestBuild(client: IBuildApi, project: string, definitionId: number, filterOnBranchName: boolean, branchName: string): Promise<Build | undefined> {
    let branchNameFilter = undefined;
    if (filterOnBranchName) {
        branchNameFilter = branchName
    }

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
        BuildQueryOrder.FinishTimeDescending,
        branchNameFilter
    );

    return latestBuild;
}

// async function getCurrentBuild(client: IBuildApi, project: string, currentBuildId: number): Promise<Build> {
//     // const currentBuildId = parseInt(getVariable("Build.BuildId"));
//     return client.getBuild(project, currentBuildId);
// }
