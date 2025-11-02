import js from "@eslint/js";

export default [
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
                localStorage: "readonly",
                Phaser: "readonly"
            }
        },
        rules: {
            // Relax some recommended rules
            "no-console": "off",
            "no-unused-vars": "warn",
            
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
    }
];