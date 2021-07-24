import * as nock from "nock";
import { Build } from "azure-devops-node-api/interfaces/BuildInterfaces";

export function setVariable(name: string, value: string): void {
    const key = getVariableKey(name);
    process.env[key] = value;
}

export function getVariableKey(name: string): string {
    return name.replace(/\./g, '_').toUpperCase();
}

export function mockTfsApi({ query }: { query?: Record<string, string>, build?: Partial<Build> | null } = {}): nock.Scope {

    return nock("https://dev.azure.com")
    
    // Build route template
    .options("/orga/_apis/build")
    .reply(200, JSON.stringify({
        value: [
            {
                id: "54572c7b-bbd3-45d4-80dc-28be08941620",
                releasedVersion: "6.1-preview.2",
                maxVersion: "6.1-preview.2",
                area: "build",
                resourceName: "builds",
                routeTemplate: "/{project}/_apis/{area}/{resource}/{buildId}/changes"
            }
        ]
        }))

        // Get build changes
        .get("/orga/project/_apis/build/builds/500/changes")
        .query(query || true)
        .reply(200, JSON.stringify({
            "count": 1,
            "value": [
                {
                    "id": "latest_commit_id",
                    "message": "test commit",
                    "type": "TfsGit",
                    "author": {
                        "displayName": "User name",
                    },
                    "timestamp": "2021-07-13T17:45:46Z"
                }
            ]
        }))

        .get("/orga/project/_apis/build/builds/100/changes")
        .query(query || true)
        .reply(200, JSON.stringify({
            "count": 0,
            "value": []
        }))

        // Location route template
        .options("/orga/_apis/Location")
        .reply(200, JSON.stringify({
            value: [
                {
                    id: "e81700f7-3be2-46de-8624-2eb35882fcaa",
                    releasedVersion: "5.1",
                    maxVersion: "5.1",
                    area: "Location",
                    routeTemplate: "/_apis/{area}"
                }
            ]
        }))
        // Same resource area
        .get("/orga/_apis/Location")
        .reply(200, JSON.stringify({
            value: []
        }));
}

export function restoreTfsApi(): void {
    nock.cleanAll();
    nock.restore();
}
