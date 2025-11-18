import js from "@eslint/js";

export default [
    {
        ignores: ["**/dist/**", "**/node_modules/**", "**/playwright-report/**", "**/test-results/**"],
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                console: "readonly",
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                localStorage: "readonly",
                Image: "readonly",
                TouchEvent: "readonly",
                Event: "readonly",
                HTMLElement: "readonly",
                HTMLButtonElement: "readonly",
                HTMLDivElement: "readonly",
                HTMLImageElement: "readonly",
                HTMLCanvasElement: "readonly",
                CanvasRenderingContext2D: "readonly",
                globalThis: "readonly",
                Phaser: "readonly"
            }
        },
        rules: {
            // Relax some recommended rules
            "no-console": "off",
            "no-unused-vars": ["warn", {
                "argsIgnorePattern": "^_",  // Allow unused params prefixed with _
                "varsIgnorePattern": "^_"   // Allow unused vars prefixed with _
            }],

            // Actual best practices (not style enforcement)
            "eqeqeq": "error",              // Use === instead of ==
            "no-var": "error",              // Use let/const instead of var
            "prefer-const": "error",        // Use const when possible
            "no-eval": "error",             // Don't use eval()
            "no-implied-eval": "error",     // Don't use setTimeout with strings
            "no-return-await": "error",     // Don't unnecessarily await returns

            // Catch actual bugs
            "no-await-in-loop": "warn",     // Usually a mistake
            "require-await": "warn",        // Async functions should await
            "no-unreachable": "error",      // Dead code detection

            // Optional: Some light style consistency (not strict)
            "semi": ["warn", "always"],     // Encourage semicolons
            "quotes": ["warn", "double"],   // Encourage double quotes
        }
    },
    // Playwright config and test files need Node.js globals and test framework
    {
        files: ["playwright.config.js", "tests/**/*.js", "mobile/**/*.test.js"],
        languageOptions: {
            globals: {
                process: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                // Playwright test globals
                test: "readonly",
                expect: "readonly",
                describe: "readonly",
                it: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                beforeAll: "readonly",
                afterAll: "readonly",
                page: "readonly",
                browser: "readonly",
                context: "readonly",
                // Browser APIs used in tests
                MutationObserver: "readonly"
            }
        }
    }
];