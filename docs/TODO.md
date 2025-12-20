# Code Review TODO List

Last Updated: December 18, 2025

## 🔴 Critical Priority (Fix Immediately)

All critical items have been completed! ✅

## 🟡 High Priority (Next Sprint)

### 1. Resolve TODO Comments (Section 2.2)

- **Issue**: 12 TODO/FIXME comments indicating incomplete features
- **Effort**: 2-8 hours depending on scope
- **Impact**: Medium - completes features or documents decisions

**Key TODOs to Address**:

- `core/GameController.js:1369` - Joker exchange feature (let user choose among multiple exchanges)
- `mobile/MobileRenderer.js:1558` - Text mode for accessibility
- `desktop/managers/TileManager.js:583, 593` - Drag event handlers (remove or implement)
- `desktop/gameObjects/gameObjects.js:5` - File marked for removal (create migration plan)

**Action**: Create GitHub issues for each TODO with priority labels

---

## 🟡 Medium Priority (Backlog)

### 2. Break Up Long Functions (Section 1.4)

- **Issue**: GameController methods 100-200 lines each
- **Effort**: 3 hours
- **Impact**: Medium - complexity reduction, better testability

**Affected Methods**:

- `dealTiles()` - 150 lines
- `charlestonPhase1()` - 140 lines
- `courtesyPhase()` - 180 lines
- `mainGameLoop()` - 200 lines
- `queryClaimDiscard()` - 120 lines

**Recommendation**: Extract sub-methods for each logical phase

### 3. Create Shared Animation Configuration (Section 4.3)

- **Issue**: Animation timing constants scattered across files
- **Effort**: 1 hour
- **Impact**: Low-Medium - DRY principle, easier to adjust speeds globally

**Action**: Create `shared/AnimationConfig.js` with all timing constants

### 4. Fix Unit Tests or Remove Them (Section 2.1)

- **Issue**: Unit tests exist but not integrated into test suite
- **Effort**: 1 hour
- **Impact**: Low - test hygiene

**Files**:

- `tests/unit/core/aiengine.test.js`
- `tests/unit/mobile/mobile-tile.test.js`

**Options**:

- A) Integrate into Playwright config
- B) Delete and remove jsdom dependency

### 5. Fix Settings File Organization (Section 3.3)

- **Issue**: `settings.js` has misleading comment and mixed concerns
- **Effort**: 30 minutes
- **Impact**: Low - clarity

**Action**:

- Rename to `desktopSettings.js` OR move to `desktop/managers/`
- Update comment to clarify it's Desktop Settings UI Manager

### 6. Investigate Duplicate HAND_UPDATED Events (Section 4.2)

- **Issue**: `skipNextDrawHandUpdate` flag suggests duplicate events
- **Effort**: 1 hour
- **Impact**: Medium - code smell, indicates architectural issue

**Action**: Add logging to identify root cause, then fix at source

### 7. Fix Desktop Y-Position Hardcoding (Section 6.3)

- **Issue**: SelectionManager uses hardcoded Y positions (575/600)
- **Effort**: 15 minutes
- **Impact**: Low - already using constants

**Action**: Verify constants are used everywhere (already done in Section 1.3)

---

## 🟢 Low Priority (Nice to Have)

### 8. TypeScript Migration

- **Effort**: 20+ hours
- **Impact**: High long-term, medium immediate
- **Action**: Add TypeScript incrementally, start with core models

### 9. Extract Settings Components (Section 4.4)

- **Issue**: DesktopSettingsManager (534 lines) has mixed concerns
- **Effort**: 2 hours
- **Impact**: Low - better separation of concerns

**Recommendation**: Split into:

- SettingsUI (presentation)
- AudioControlsManager (audio + persistence)
- SettingsController (orchestration)

---

## ✅ Completed Items

- ✅ Console.log Cleanup (Section 1.1)
- ✅ Error Handling (Section 1.2)
- ✅ Magic Numbers to Constants (Section 1.3)
- ✅ Event Listener Cleanup (Section 5.1)
- ✅ Base Adapter Class (Section 2.5 & 4.1)
- ✅ Desktop Animation Sequencers (Section 6.1)
- ✅ Mobile Blank Swap Animation (Section 6.1)
- ✅ JSDoc Documentation (Section 3.1)
- ✅ CLAUDE.md Updates (Section 3.2)
- ✅ Deprecated Methods Removal (Section 2.3)
- ✅ Commented Code Cleanup (Section 2.4)

---

## Quick Win Recommendations

**If you have 30 minutes:**

- Fix Settings file organization (#5)
- Verify Y-position constants usage (#7)

**If you have 1-2 hours:**

- Fix unit tests (#4)
- Create shared animation config (#3)
- Investigate duplicate events (#6)

**If you have 3+ hours:**

- Break up long functions (#2)
- Address TODO comments (#1)

---

## Priority Ranking Summary

1. **High**: TODO comments (#1) - Documents incomplete work
2. **Medium**: Long functions (#2) - Reduces complexity
3. **Medium**: Animation config (#3) - Quick DRY improvement
4. **Medium**: Unit tests (#4) - Test infrastructure clarity
5. **Low**: Everything else can wait

**Recommendation**: Start with #1 (TODO comments) to get visibility into what's actually incomplete vs what's intentional "future enhancement"
