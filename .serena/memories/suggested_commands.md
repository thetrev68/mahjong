# Suggested Commands for Mahjong Game Development

## Development
```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

## Testing
```bash
npm test             # Run Playwright tests (headless)
npm run test:ui      # Run tests in interactive UI mode
npm run test:headed  # Run tests with browser visible
npm run test:report  # View last test report
```

## Code Quality
```bash
npm run lint         # Run ESLint
npm run knip         # Find unused files/exports/dependencies
```

## Windows Shell Commands
- `dir` - list directory contents
- `cd` - change directory
- `git status` - check git status
- `git diff` - view changes
- `git add .` - stage all changes
- `git commit -m "message"` - create commit
- `git push` - push changes

## Common Development Workflow
1. `npm run dev` - start dev server
2. Make code changes
3. `npm run lint` - check for linting errors
4. `npm run test` - run tests before committing
5. `git add .` && `git commit -m "..."` - commit changes
6. `npm run build` - verify production build works
