import * as path from "path";
import * as ttm from "azure-pipelines-task-lib/mock-test";

describe("vsts-changed-files", () => {

    describe("core behaviors", () => {

        test("should works", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "01-base.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(1);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]true");
            expect(tr.stderr).toBeFalsy();
        });

        test("should return true if there is no previous build", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "02-no-prev-build.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(0);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]true");
            expect(tr.stderr).toBeFalsy();
        });

        test("should return false if previous build used same sourceVersion", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "03-same-source-version.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(0);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]false");
            expect(tr.stderr).toBeFalsy();
        });

        test("should return false if no glob match", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "04-no-glob-match.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(1);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]false");
            expect(tr.stderr).toBeFalsy();
        });

        test("should return true if some glob match", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "05-glob-match.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(1);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]true");
            expect(tr.stderr).toBeFalsy();
        });
    });

    describe("inputs", () => {

        test("variable: allow to change output variable name", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "10-input-variable.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(1);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=CustomVar;isOutput=true;]true");
            expect(tr.stderr).toBeFalsy();
        });

        test("isOutput: allow to determine if it's an output variable", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "11-input-is-output.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(1);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=CustomVar;]true");
            expect(tr.stderr).toBeFalsy();
        });

    });

});
