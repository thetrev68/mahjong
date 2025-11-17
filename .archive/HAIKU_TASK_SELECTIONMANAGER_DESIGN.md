# Task for Claude Haiku: SelectionManager Design (Tasks 1a & 1b)

## Context
We're completing a refactor of an American Mahjong game to have clean separation between game logic (GameController) and rendering (PhaserAdapter). We need a SelectionManager component to handle tile selection across different game phases.

You can read about the full context here: https://github.com/anthropics/claude-code/issues (this is just example context - no actual link needed)

**Key documents created for reference:**
- `OLD_SYSTEM_GAME_FLOW.md` - Complete game flow from working commit 07c41b9
- `IMPLEMENTATION_ROADMAP.md` - Implementation plan and architecture
- `CODEBASE_AUDIT.md` - Current state of codebase

## Your Task: Two Parts (1a & 1b)

### Part 1a: Extract TileSet Selection Logic from Old Code

**Objective**: Understand how tile selection worked in the last working version (commit 07c41b9)

**Steps**:
1. Get the old gameObjects_hand.js from commit 07c41b9:
   ```bash
   git show 07c41b9:gameObjects_hand.js > gameObjects_hand.old.js
   ```

2. Read and analyze the `TileSet` class, looking for:
   - `selectCount` property (tracks how many tiles selected)
   - `getSelection()` method (returns selected tiles)
   - `getSelectionCount()` method (returns count)
   - `resetSelection()` method (clears selection)
   - Tile click handler logic (how tiles become selected/deselected)
   - Selection validation (min/max enforcement)
   - Visual feedback (how selected tiles look different - Y position 575 vs 600)

3. Create a document called `TILESELECTION_LOGIC_EXTRACTED.md` that documents:
   - How selectCount tracking worked
   - The getSelection() and related methods
   - When and how tiles are added/removed from selection
   - How Y-position changes indicate selection state (575 = selected, 600 = deselected)
   - Validation logic (how min/max selection counts were enforced)
   - Where the click handlers were attached
   - Any important edge cases or special handling

**Output**: A clear document explaining the selection system so we can build SelectionManager based on proven patterns.

---

### Part 1b: Design SelectionManager API

**Objective**: Create the interface and skeleton for SelectionManager based on what you learned in 1a

**Context from our analysis**:
The SelectionManager needs to:
- Track which tiles are selected
- Enforce min/max selection counts per game phase
- Provide visual feedback (raise/lower tiles)
- Support different modes: "charleston" (exactly 3), "courtesy" (1-3), "play" (exactly 1), "expose" (variable)
- Work with PhaserAdapter and Hand/TileSet

**Steps**:
1. Create a new file: `SELECTIONMANAGER_API_DESIGN.md`

2. Design the complete API with these sections:
   ```
   ## SelectionManager Interface

   ### Lifecycle Methods
   - enableTileSelection(minCount, maxCount, mode)
   - disableTileSelection()

   ### Selection Control
   - toggleTile(tile)
   - selectTile(tile)
   - deselectTile(tile)
   - clearSelection()

   ### Query Methods
   - getSelection()
   - getSelectionCount()
   - getSelectedTileIndices()

   ### Validation
   - isValidSelection()
   - canSelectMore()
   - canDeselectMore()

   ### Visual Feedback
   - visualizeTile(tile, isSelected)
   - highlightSelectedTiles()
   - unhighlightTiles()

   ### State
   - isEnabled()
   - getCurrentMode()
   ```

3. For each method, write:
   - **Purpose**: What it does
   - **Parameters**: Input types and meaning
   - **Returns**: What it returns
   - **Side Effects**: What changes in the system
   - **Usage Example**: How it would be called from PhaserAdapter

4. Create a skeleton JavaScript class with:
   - Constructor with proper initialization
   - All methods as empty stubs with JSDoc comments
   - Property definitions with comments
   - Clear structure ready for implementation

**Example of what I mean by skeleton**:
```javascript
/**
 * SelectionManager - Tracks tile selection state and visual feedback
 *
 * Handles tile selection across different game phases with min/max validation
 */
export class SelectionManager {
    /**
     * @param {Hand} hand - The Hand object to manage selection for
     * @param {TileManager} tileManager - For visual feedback on tiles
     */
    constructor(hand, tileManager) {
        this.hand = hand
        this.tileManager = tileManager
        this.selectedTiles = new Set()
        this.minCount = 1
        this.maxCount = 3
        this.mode = null
        this.isEnabled = false
    }

    /**
     * Enable tile selection for a game phase
     * @param {number} minCount - Minimum tiles to select
     * @param {number} maxCount - Maximum tiles to select
     * @param {string} mode - Selection mode: "charleston", "courtesy", "play", "expose"
     */
    enableTileSelection(minCount, maxCount, mode) {
        // TODO: Implement
    }

    // ... etc for all methods
}
```

5. In a section called "Implementation Notes", document:
   - Which methods depend on which other methods
   - Any integration points with Hand/TileSet classes
   - Visual feedback strategy (how Y-position will be changed)
   - Validation rules per mode
   - Assumptions about TileData and Tile objects

**Output**:
- `SELECTIONMANAGER_API_DESIGN.md` - Complete API specification
- `SelectionManager.js` (skeleton) - Empty class ready for implementation

---

## What NOT to Do
- ❌ Don't implement the full logic (that's next phase)
- ❌ Don't modify any game files yet
- ❌ Don't worry about PhaserAdapter integration details
- ❌ Don't create tests yet

## What Success Looks Like
- Clear, well-documented explanation of how selection worked in old code
- Complete API design that covers all use cases (Charleston, courtesy, discard, exposure)
- Skeleton class ready for implementation
- Someone (even with no game knowledge) could use these docs to implement SelectionManager

## Deliverables
1. `TILESELECTION_LOGIC_EXTRACTED.md` - Extracted logic documentation
2. `SELECTIONMANAGER_API_DESIGN.md` - API specification
3. `SelectionManager.js` - Skeleton class with JSDoc

## Questions to Answer in Your Docs
- What exactly is selectCount tracking?
- How do tiles know they're selected (is it a property, or are they in an array)?
- What does Y-position 575 vs 600 mean?
- How does min/max validation work?
- When does validation happen (before action, during action, or after)?
- Can you select/deselect tiles, or only select the full set at once?

---

## File Locations
Repository: c:\Repos\mahjong

Key files to reference:
- Current codebase: GameScene.js, gameObjects_hand.js, PhaserAdapter
- Old code: commit 07c41b9 (use git show to view)
- Analysis docs: OLD_SYSTEM_GAME_FLOW.md, CODEBASE_AUDIT.md

---

## How to Run Git Commands
```bash
# View old file
git show 07c41b9:gameObjects_hand.js

# View specific section of old file
git show 07c41b9:gameObjects_hand.js | grep -A 50 "class TileSet"

# Search for selection in old code
git show 07c41b9:gameObjects_hand.js | grep -n "selectCount\|getSelection\|resetSelection"
```

---

## Success Criteria
- [ ] TILESELECTION_LOGIC_EXTRACTED.md is clear and complete
- [ ] SELECTIONMANAGER_API_DESIGN.md has all methods documented
- [ ] SelectionManager.js skeleton is well-structured with JSDoc
- [ ] Someone could implement SelectionManager using only your docs
- [ ] All methods have clear purpose/parameters/returns documented

Good luck! This is foundational work for the rest of the system.
