// @ts-check

/** @type {import("@commitlint/types").UserConfig} */
export default {
  ignores: [commit => commit.includes("init")],
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-leading-blank": [0, "never"],
    "footer-leading-blank": [0, "never"],
    "header-max-length": [2, "always", 108],
    "subject-empty": [2, "never"],
    "type-empty": [2, "never"],
    "scope-empty": [2, "never"],
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "perf",
        "style",
        "docs",
        "test",
        "refactor",
        "build",
        "ci",
        "chore",
        "revert",
        "wip",
        "workflow",
        "types",
        "release"
      ]
    ]
  }
};
