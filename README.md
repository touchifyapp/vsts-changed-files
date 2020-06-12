# Azure DevOps Task: Changed Files

![CI](https://github.com/touchifyapp/vsts-changed-files/workflows/CI/badge.svg?event=push)

Pipeline task to get changed files since last succeeded build.

## Installation

Installation can be done using [Visual Studio MarketPlace](https://marketplace.visualstudio.com/items?itemName=touchify.vsts-changed-files).

## Source Code

Source code can be found on [Github](https://github.com/touchifyapp/vsts-changed-files).

## Simple Usage

```yaml
jobs: 
  - job: check
    displayName: Check changed files
    pool:
        vmImage: ubuntu-latest
    steps:
      - task: ChangedFiles@1
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

## Multiple variable Usage

```yaml
jobs: 
  - job: check
    displayName: Check changed files
    pool:
        vmImage: ubuntu-latest
    steps:
      - task: ChangedFiles@1
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

## Options

* __rules__: Filter files to check changes for.  _Default:_ `**` _(match all files)_.
* __variable__: The name of the default output variable to set to be available in next steps/jobs/stages. _Default:_ `HasChanged`.
* __isOutput__: Are variables available in next stages?  _Default:_ `true`.
* __cwd__: Change the current working directory. _Default:_ `$(System.DefaultWorkingDirectory)`
* __verbose__: Enable verbose logging. _Default:_ `false`.

## License

[MIT](https://raw.githubusercontent.com/touchifyapp/vsts-changed-files/master/LICENSE)
