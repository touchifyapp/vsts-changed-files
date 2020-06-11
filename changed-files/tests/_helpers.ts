import * as nock from "nock";
import { Build } from "azure-devops-node-api/interfaces/BuildInterfaces";

export function setVariable(name: string, value: string): void {
    const key = getVariableKey(name);
    process.env[key] = value;
}

export function getVariableKey(name: string): string {
    return name.replace(/\./g, '_').toUpperCase();
}

export function mockTfsApi({ query, build }: { query?: Record<string, string>, build?: Partial<Build> | null } = {}): nock.Scope {

    return nock("https://dev.azure.com")

        // Build route template
        .options("/orga/_apis/build")
        .reply(200, JSON.stringify({
            value: [
                {
                    id: "0cd358e1-9217-4d94-8269-1c1ee6f93dcf",
                    releasedVersion: "5.1",
                    maxVersion: "5.1",
                    area: "build",
                    resourceName: "builds",
                    routeTemplate: "/{project}/_apis/{area}/{resource}"
                }
            ]
        }))

        // Latest succeeded build
        .get("/orga/project/_apis/build/builds")
        .query(query || true)
        .reply(200, JSON.stringify({
            value: build === null ? [] : [
                build || {
                    buildNumber: "20200101.1",
                    sourceVersion: "latest_commit_id"
                }
            ]
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
