# MCP Servers Configuration

This file documents the MCP (Model Context Protocol) servers configured for this project in Claude Code.

## Active MCP Servers

### Context7

- **Purpose**: Fetches up-to-date documentation for any library/framework
- **Status**: ✓ Connected
- **Configuration**: `npx -y @upstash/context7-mcp@latest`
- **API Key**: `ctx7sk-79544ae2-a1b7-4fbe-8b26-97152183eeea`

**How to use with Claude Code:**

```bash
# Already installed! Just ask Claude to:
# - "Get the latest React documentation"
# - "Show me Phaser 3 docs for sprite animations"
# - "Find documentation for [any library]"
```

**Available tools:**

- `mcp__context7__resolve-library-id` - Find library by name
- `mcp__context7__get-library-docs` - Get documentation for a library

**Verify it's working:**

```bash
claude mcp list
```

### Serena

- **Purpose**: Semantic code navigation and editing for this codebase
- **Status**: ✓ Connected
- **Configuration**: `uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project C:/Repos/mahjong`

### Playwright

- **Purpose**: Automated end-to-end testing of the game
- **Status**: ✓ Connected
- **Configuration**: `npx @executeautomation/playwright-mcp-server`

**How to use with Claude Code:**

```bash
# Run tests
npm test                 # Run all tests headless
npm run test:ui          # Run with UI mode (interactive)
npm run test:headed      # Run with browser visible
npm run test:report      # View test report

# Or just ask Claude to:
# - "Run the Playwright tests"
# - "Create a test for Charleston phase"
# - "Test the AI discard logic"
```

**Test files location:** `tests/` directory

**Available tools:**

- Browser automation for testing game interactions
- Screenshot and video capture on failures
- Multi-browser testing (Chrome, Firefox, Safari)

## Installation Commands (for reference)

If you need to reinstall or set up on a new machine:

```bash
# Context7 (HTTP transport with API key)
claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: ctx7sk-79544ae2-a1b7-4fbe-8b26-97152183eeea"

# Playwright
claude mcp add playwright npx @executeautomation/playwright-mcp-server

# Then install Playwright in the project
npm install -D @playwright/test
npx playwright install

# Check status
claude mcp list

# View health
claude mcp health
```

## Notes

- The actual MCP configuration is stored in Claude Code's global config, not in this repo
- This file is just documentation to help remember what's set up and how to use it
- Context7 provides access to up-to-date docs for thousands of libraries
- Serena provides intelligent code navigation specific to this mahjong project
