import * as path from "path";
import * as tmrm from "azure-pipelines-task-lib/mock-run";

import { setVariable, mockTfsApi } from "./_helpers";

const TEAM_PROJECT_ID = "project";
const SOURCE_VERSION = "source_commit_id";
const ACCESS_TOKEN = "access_token";
const DEFINITION_ID = "500";

const tmr = new tmrm.TaskMockRunner(path.join(__dirname, "..", "index.js"));

setVariable("System.TeamProjectId", TEAM_PROJECT_ID);
setVariable("System.TeamFoundationCollectionUri", "https://dev.azure.com/orga");
setVariable("System.AccessToken", ACCESS_TOKEN);
setVariable("System.DefinitionId", DEFINITION_ID);
setVariable("Build.SourceVersion", SOURCE_VERSION);

tmr.setInput("rules", "**");
tmr.setInput("variable", "CustomVar");
tmr.setInput("isOutput", "false");
tmr.setInput("verbose", "true");

tmr.setAnswers({
    which: {
        "git": "/bin/git"
    },
    exist: {
        "/bin/git": true
    },
    checkPath: {
        "/bin/git": true
    },
    exec: {
        "/bin/git verify-commit latest_commit_id": { code: 0 },
        "/bin/git diff --name-only HEAD latest_commit_id .": {
            code: 0,
            stdout: "src/file1.ts\nsrc/file2.ts\ndocs/index.md"
        }
    }
});

mockTfsApi();

tmr.run();

