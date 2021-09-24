import * as azdev from "azure-devops-node-api";
import type { IBuildApi } from "azure-devops-node-api/BuildApi";

import { logVerbose } from "./util";

export async function createClient(orgUri: string, accessToken: string): Promise<IBuildApi> {
    const auth = azdev.getBearerHandler(accessToken);
    const connection = new azdev.WebApi(orgUri, auth);

    return connection.getBuildApi();
}

export type GetBuildChangesOptions = {
    project: string;
    buildId: number;
    verbose?: boolean;
};

export async function getBuildChanges(
    client: IBuildApi,
    { project, buildId, verbose }: GetBuildChangesOptions
): Promise<string[]> {
    logVerbose(`> Getting the list of changes for the build ${buildId}`, { verbose });

    const changes = await client.getBuildChanges(project, buildId);
    return changes.map((c) => c.id || "").filter((id) => id !== "");
}
