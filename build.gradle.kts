import com.github.gradle.node.npm.task.NpmTask
import io.github.andreabrighi.gradle.gitsemver.conventionalcommit.ConventionalCommit

plugins {
    application
    alias(libs.plugins.node)
    alias(libs.plugins.gitSemVer)
}

node {
    version.set("24.11.0")
    download.set(true)
    nodeProjectDir.set(file(project.projectDir))
}

buildscript {
    dependencies {
        classpath("io.github.andreabrighi:conventional-commit-strategy-for-git-sensitive-semantic-versioning-gradle-plugin:1.0.15")
    }
}
gitSemVer {
    commitNameBasedUpdateStrategy(ConventionalCommit::semanticVersionUpdate)
    minimumVersion.set("0.1.0")
}

// Dependencies
tasks.register<NpmTask>("npmCi") {
    group = "npm"
    description = "Install npm dependencies cleanly"
    args.set(listOf("ci"))
    inputs.file("package.json")
    inputs.file("package-lock.json")
    outputs.upToDateWhen { false }
}

// Build
tasks.register<NpmTask>("npmBuild") {
    group = "npm"
    description = "Build the TypeScript project"
    dependsOn("npmCi")
    args.set(listOf("run", "build"))
    inputs.dir("src")
    inputs.file("tsconfig.json")
    outputs.dir("dist")
}

tasks.register<NpmTask>("npmTest") {
    group = "npm"
    description = "Run TypeScript tests"
    dependsOn("npmCi")
    args.set(listOf("run", "test"))
}

tasks.register<NpmTask>("npmCheckFormat") {
    group = "npm"
    description = "Test the format of TypeScript project"
    args.set(listOf("run", "format:check"))
}

tasks.register<NpmTask>("npmLint") {
    group = "npm"
    description = "Test the lint of TypeScript project"
    args.set(listOf("run", "lint",))
}

tasks.named("assemble") {
    dependsOn("npmBuild")
}

tasks.named<Test>("test") {
    dependsOn("npmTest")
}

tasks.register("lint") {
    group = "quality"
    dependsOn("npmLint")
}

tasks.register("checkFormat") {
    group = "quality"
    dependsOn("npmCheckFormat")
}

tasks.register<NpmTask>("preCommit") {
    group = "verification"
    description = "Run lint-staged"
    args.set(listOf("run", "lint-staged"))
}
