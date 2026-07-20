export default {
    extends: ["@commitlint/config-conventional"],
    rules: {
        "scope-enum": [
            2,
            "always",
            ["frontend", "server", "types", "infra", "root"],
        ],
    },
};