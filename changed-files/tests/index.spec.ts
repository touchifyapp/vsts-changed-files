import * as path from "path";
import * as ttm from "azure-pipelines-task-lib/mock-test";

describe("vsts-changed-files-multibranch", () => {
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

        test("should return false if previous build used same sourceVersion", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "02-same-source-version.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(0);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]false");
            expect(tr.stderr).toBeFalsy();
        });

        test("should return false if no glob match", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "03-no-glob-match.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(1);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]false");
            expect(tr.stderr).toBeFalsy();
        });

        test("should return true if some glob match", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "04-glob-match.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(1);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]true");
            expect(tr.stderr).toBeFalsy();
        });

        test("should check changes for each commits in build", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "05-multi-commit-build.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(2);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]true");
            expect(tr.stderr).toBeFalsy();
        });

        test("should allow empty access token for public repos", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "06-no-access-token.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(1);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]true");
            expect(tr.stderr).toBeFalsy();
        });

        test("should include hidden files (starting with a dot) in the match", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "07-include-hidden-files.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(1);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]true");
            expect(tr.stderr).toBeFalsy();
        });

        test.only("should include files with unicode characters in the match", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "08-include-unicode-names.runner.js"));
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

    describe("multiple variables", () => {
        test("should allow multiple variable definitions", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "20-multivar-with-default.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(1);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]true");
            expect(tr.stdout).toContain("##vso[task.setvariable variable=DocumentationChanged;isOutput=true;]true");
            expect(tr.stdout).toContain("##vso[task.setvariable variable=TestsChanged;isOutput=true;]false");
            expect(tr.stderr).toBeFalsy();
        });

        test("should not set default variable if empty", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "21-multivar-without-default.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(1);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=CodeChanged;isOutput=true;]true");
            expect(tr.stdout).toContain("##vso[task.setvariable variable=DocumentationChanged;isOutput=true;]true");
            expect(tr.stdout).toContain("##vso[task.setvariable variable=TestsChanged;isOutput=true;]false");

            expect(tr.stdout).not.toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]");

            expect(tr.stderr).toBeFalsy();
        });

        test("should not set variables with no rules", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "22-multivar-filter-empty.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(1);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=CodeChanged;isOutput=true;]true");
            expect(tr.stdout).toContain("##vso[task.setvariable variable=TestsChanged;isOutput=true;]false");

            expect(tr.stdout).not.toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]");
            expect(tr.stdout).not.toContain("##vso[task.setvariable variable=DocumentationChanged;isOutput=true;]true");

            expect(tr.stderr).toBeFalsy();
        });
    });

    describe("multiple branches", () => {
        test("should check diff between branches", () => {
            const tr = new ttm.MockTestRunner(path.join(__dirname, "30-multibranch-ref-branch.runner.js"));
            tr.run();

            expect(tr.succeeded).toBe(true);

            expect(tr.invokedToolCount).toBe(1);
            expect(tr.warningIssues).toHaveLength(0);
            expect(tr.errorIssues).toHaveLength(0);

            expect(tr.stdout).toContain("##vso[task.setvariable variable=HasChanged;isOutput=true;]true");
            expect(tr.stderr).toBeFalsy();
        });
    });
});
