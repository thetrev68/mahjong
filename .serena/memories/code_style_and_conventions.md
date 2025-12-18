# Code Style & Conventions

## Language & Modules

- ES6 modules with `import`/`export`
- No TypeScript - plain JavaScript
- No `var` - use `const`/`let`
- Semicolons required (enforced by ESLint)
- Double quotes for strings (not single quotes)
- Strict equality `===` required

## Naming Conventions

- Classes: PascalCase (e.g., `GameLogic`, `Hand`, `Tile`)
- Functions/methods: camelCase (e.g., `chooseDiscard()`, `getSelectableDiscards()`)
- Constants: UPPER_SNAKE_CASE (e.g., `TOTAL_TILE_COUNT`, `STATE.INIT`)
- Private members: prefix with underscore (e.g., `_privateField`)

## Comments & Documentation

- Use `debugPrint()` for debug logging (controlled by `gdebug` flag in utils.js)
- Add comments for complex logic
- Use inline comments sparingly, prefer clear code

## Game-Specific Conventions

- Tile representation: `{suit, rank, index}` objects for logic
- Sprite representation: Phaser sprite objects for display
- Game state transitions: Strict state machine in GameLogic
- Player positions: Use PLAYER enum (BOTTOM=0, RIGHT=1, TOP=2, LEFT=3)
- AI methods: Follow async pattern for turn-based gameplay

## Pattern References

- Joker swap: Reference for blank swap implementation (gameObjects_table.js:382-413)
- Hand validation: Study card/card.js for pattern matching
- State transitions: Follow existing STATE machine pattern in gameLogic.js
