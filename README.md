# Azure DevOps Task: Changed Files

![CI](https://github.com/touchifyapp/vsts-changed-files/workflows/CI/badge.svg?event=push)

Pipeline task to get changed files and apply conditions according to those changes.


> [!IMPORTANT]
> This task has been upgraded to latest execution environment *(Node 20 + azure-pipelines-task-lib v4)* to adress security issues and deprecation warnings. **This upgrade has been released in a major version (v2)**.
> 
> - If you're using a self-hosted Azure Agent prior to `v3.224.1`, **please stick on version 1**.
> - If you're using an `Azure hosted Azure Agent` or a self-hosted Azure Agent upgraded to `v3.224.1` or above, **please upgrade to version 2** to ensure you're on the latest execution environment.

## Installation

Installation can be done using [Visual Studio MarketPlace](https://marketplace.visualstudio.com/items?itemName=touchify.vsts-changed-files).

## Source Code

Source code can be found on [Github](https://github.com/touchifyapp/vsts-changed-files).

## Simple usage

```yaml
jobs: 
  - job: check
    displayName: Check changed files
    pool:
        vmImage: ubuntu-latest
    steps:
      - task: ChangedFiles@2
        name: CheckChanges
        inputs:
          rules: src/**/*.ts
          variable: HasChanged

  - job: build
    displayName: Build only when code changes
    dependsOn: check
    condition: eq(dependencies.check.outputs['CheckChanges.HasChanged'], 'true')
    steps:
        - # Add your build steps here
```

## Multi-variable usage

```yaml
jobs: 
  - job: check
    displayName: Check changed files
    pool:
        vmImage: ubuntu-latest
    steps:
      - task: ChangedFiles@2
        name: CheckChanges
        inputs:
          rules: |
            [CodeChanged]
            src/**/*.ts
            src/**/*.html

            [TestsChanged]
            tests/**/*.ts

  - job: build
    displayName: Build only when code changes
    dependsOn: check
    condition: eq(dependencies.check.outputs['CheckChanges.CodeChanged'], 'true')
    steps:
        - # Add your build steps here
        
  - job: tests
    displayName: Tests only when code changes or tests changes
    dependsOn: check
    condition: or(eq(dependencies.check.outputs['CheckChanges.CodeChanged'], 'true'), eq(dependencies.check.outputs['CheckChanges.TestsChanged'], 'true'))
    steps:
        - # Add your build steps here
```

## Multi-branch usage

```yaml
jobs: 
  - job: check
    displayName: Check changed files
    pool:
        vmImage: ubuntu-latest
    steps:
      - task: ChangedFiles@2
        name: CheckChanges
        inputs:
          refBranch: master
          rules: |
            [CodeChanged]
            src/**/*.ts
            src/**/*.html

            [TestsChanged]
            tests/**/*.ts

  - job: build
    displayName: Build only when code changes
    dependsOn: check
    condition: eq(dependencies.check.outputs['CheckChanges.CodeChanged'], 'true')
    steps:
        - # Add your build steps here
        
  - job: tests
    displayName: Tests only when code changes or tests changes
    dependsOn: check
    condition: or(eq(dependencies.check.outputs['CheckChanges.CodeChanged'], 'true'), eq(dependencies.check.outputs['CheckChanges.TestsChanged'], 'true'))
    steps:
        - # Add your build steps here
```

## Multi-stage usage

```yaml
stages:
  - stage: pre
    jobs:
      - job: check
        displayName: Check changed files
        pool:
          vmImage: ubuntu-latest
        steps:
          - task: ChangedFiles@2
            name: CheckChanges
            inputs:
              refBranch: main 
              rules: |
                [BarChanged]
                bar/**

                [FooChanged]
                foo/**

  - stage: bar_has_changed
    dependsOn: ["pre"]
    displayName: This stage runs only when the `BarChanged` variable is true
    condition: eq(dependencies.pre.outputs['check.CheckChanges.BarChanged'], 'true')
    jobs: 
      - job: run
        steps:
           - # Add your build steps here

  - stage: foo_has_changed
    dependsOn: ["pre"]
    displayName: This stage runs only when the `FooChanged` variable is true
    condition: eq(dependencies.pre.outputs['check.CheckChanges.FooChanged'], 'true')
    jobs: 
      - job: run
        steps:
           - # Add your build steps here
           
  - stage: stage_with_conditional_job
    dependsOn: ["pre"]
    displayName: The stage always runs but contains a job that runs only when `FooChanged` is true
    jobs: 
      - job: job_when_foo_has_changed
        displayName: This job runs only when `FooChanged` is true
        condition: eq(stageDependencies.pre.check.outputs['CheckChanges.FooChanged'], 'true')
        steps:
          - # Add your build steps here
```
## Options

* __rules__: Filter files to check changes for.  _Default:_ `**` _(match all files)_.
* __variable__: The name of the default output variable to set to be available in next steps/jobs/stages. _Default:_ `HasChanged`.
* __isOutput__: Are variables available in next stages?  _Default:_ `true`.
* __refBranch__: The branch that will be used as reference to check changes in case multi-branches pipeline.
* __cwd__: Change the current working directory. _Default:_ `$(System.DefaultWorkingDirectory)`
* __verbose__: Enable verbose logging. _Default:_ `false`.

## Troubleshooting

If you encounter the error:
`fatal: ambiguous argument 'origin/{branch}...': unknown revision or path not in the working tree.`

It means that you should fetch the full depth of your git history to be sure to include all necessaries artifacts:

```yaml
jobs: 
  - job: check
    displayName: Check changed files
    pool:
        vmImage: ubuntu-latest
    steps:
      - checkout: self
        fetchDepth: "0"
        
      - task: ChangedFiles@2
        name: CheckChanges
        inputs:
          rules: src/**/*.ts
          variable: HasChanged
```

## License

[MIT](https://raw.githubusercontent.com/touchifyapp/vsts-changed-files/master/LICENSE)

## Git tested changes

* [x] git repo with only one branch or a pipeline for only one branch
* [x] git create new branch without changes vs reference branch
* [x] git push with single commit
* [x] git push with several commits
* [x] git repo with multiple branches and a pipline for multiple branches
* [x] git merge a branch into another branch
* [x] git cherry-pick
* [x] git rebase and push force
* [x] git revert
