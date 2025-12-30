plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
    id("org.danilopianini.gradle-pre-commit-git-hooks") version "2.1.6"
}

gitHooks {
    preCommit {
        tasks("preCommit")
    }
    commitMsg {
        conventionalCommits()
    }
    createHooks(true)
}

rootProject.name = "Template-for-TypeScript-projects"
