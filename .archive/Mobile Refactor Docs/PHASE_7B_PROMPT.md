# Phase 7B Implementation Prompt: Final QA & Integration

**Assignee:** Claude Sonnet 4.5 (You)
**Complexity:** High
**Estimated Tokens:** 10K
**Dependencies:** Phases 1-6 (all core features complete)
**Status:** Ready to Start

---

## Objective

Perform comprehensive quality assurance across both desktop and mobile platforms. Identify and fix edge cases, layout bugs, state synchronization issues, and accessibility problems. Ensure the game is production-ready with consistent behavior across platforms and browsers.

---

## QA Scope

### 1. Full Game Flow Testing

Test complete game from start to finish on both platforms:

#### Desktop Testing Checklist

- [ ] Game loads without errors
- [ ] Settings overlay opens/closes correctly
- [ ] All settings persist after page reload
- [ ] Start button initiates game properly
- [ ] Cards deal correctly (13 tiles per player)
- [ ] Charleston phase works (3 passes: right, across, left)
- [ ] Courtesy vote appears after Charleston
- [ ] Courtesy pass works if voted yes
- [ ] Main game loop:
  - [ ] Player can pick from wall
  - [ ] Player can discard tiles (drag-and-drop)
  - [ ] AI opponents play their turns automatically
  - [ ] Tile claiming works (pung/kong/run)
  - [ ] Exposures display correctly
  - [ ] Joker swapping works
- [ ] Winning detection works
- [ ] Game end displays correct winner
- [ ] New game button resets properly

#### Mobile Testing Checklist

- [ ] Mobile page loads in portrait orientation
- [ ] HandRenderer displays 13-14 tiles correctly
- [ ] Tiles are touch-friendly (large enough to tap)
- [ ] Opponent bars show correct info
- [ ] Discard pile updates in real-time
- [ ] Charleston phase works with tap selection
- [ ] Tile discard via double-tap works
- [ ] Swipe-up gesture for exposing tiles works
- [ ] Settings bottom sheet slides up properly
- [ ] All settings save/load via SettingsManager
- [ ] Game flow matches desktop (same rules/timing)
- [ ] PWA install prompt appears after 2 games
- [ ] App works offline after installation

### 2. Cross-Platform State Synchronization

Verify that core game logic behaves identically:

#### State Machine Consistency

- [ ] GameController state transitions match on both platforms
- [ ] Event emissions occur at same points in game flow
- [ ] AI decisions are deterministic (same difficulty = same behavior)
- [ ] Card validation produces identical results
- [ ] Charleston/courtesy logic is consistent

#### Settings Synchronization

- [ ] SettingsManager works on both desktop/mobile
- [ ] Changing settings on desktop reflects on mobile (after reload)
- [ ] All settings keys match between platforms:
  - [ ] cardYear
  - [ ] difficulty
  - [ ] useBlankTiles
  - [ ] bgmVolume, bgmMuted
  - [ ] sfxVolume, sfxMuted
  - [ ] trainingMode, trainingHand, trainingTileCount, skipCharleston

#### Data Model Consistency

- [ ] TileData objects serialize/deserialize correctly
- [ ] HandData contains same information on both platforms
- [ ] PlayerData exposure format matches
- [ ] Event payloads are consistent

### 3. Edge Case Testing

Test boundary conditions and error scenarios:

#### Charleston Edge Cases

- [ ] What happens if player selects < 3 tiles?
- [ ] What happens if player selects > 3 tiles?
- [ ] Can player pass jokers during Charleston? (should be prevented)
- [ ] Does Charleston handle all 3 passes correctly?
- [ ] Does Charleston work with different player positions?

#### Exposure Edge Cases

- [ ] Can player expose with < 3 tiles selected?
- [ ] Can player expose invalid combinations? (e.g., non-matching pung)
- [ ] Does exposure validation work for runs (consecutive)?
- [ ] Can player expose during wrong game state?
- [ ] Do exposures persist across turns?

#### Winning Edge Cases

- [ ] Does game detect exact 14-tile winning hands?
- [ ] Does game reject 13-tile "wins"?
- [ ] Does game detect all valid 2025 card patterns?
- [ ] Can player win with exposures + concealed tiles?
- [ ] Does game handle multiple potential winners correctly?

#### Training Mode Edge Cases

- [ ] Does training mode skip Charleston correctly?
- [ ] Can player set any tile count (1-14)?
- [ ] Does training hand parser handle invalid input?
- [ ] Does training mode work on both platforms?

#### UI Edge Cases

- [ ] What happens on very small mobile screens (< 375px)?
- [ ] What happens on tablet screens (768px-1024px)?
- [ ] Does desktop layout work on ultra-wide monitors?
- [ ] Do tiles overflow on long mobile screens?
- [ ] Does discard pile handle 100+ discards (scrolling)?

### 4. Layout Bug Fixes

Test responsive layouts and fix visual issues:

#### Desktop Layout Issues

- [ ] Sidebar width on narrow windows (< 1280px)
- [ ] Tile overlap at table edges
- [ ] Settings overlay centering
- [ ] Button alignment in bottom controls
- [ ] Textarea scrolling in message log
- [ ] Phaser canvas scaling

#### Mobile Layout Issues

- [ ] Hand container grid (7 columns, 2 rows)
- [ ] Tile sizing on small screens (< 375px width)
- [ ] Opponent bar stacking (top area)
- [ ] Discard pile grid (9 columns)
- [ ] Action bar button spacing (bottom)
- [ ] Settings bottom sheet height (70vh)
- [ ] Safe area insets (notch/home indicator)

#### Cross-Browser Issues

- [ ] Safari mobile (iOS): Touch events work?
- [ ] Safari mobile: CSS grid layout correct?
- [ ] Safari mobile: PWA manifest recognized?
- [ ] Chrome mobile (Android): Gestures work?
- [ ] Chrome mobile: Service worker caching works?
- [ ] Firefox desktop: Phaser rendering correct?
- [ ] Edge desktop: Drag-and-drop works?

### 5. Accessibility Audit

Ensure app is accessible to all users:

#### Keyboard Navigation (Desktop)

- [ ] Tab key moves focus correctly
- [ ] Enter key activates buttons
- [ ] Escape key closes overlays
- [ ] Arrow keys navigate tiles (optional enhancement)
- [ ] Spacebar selects tiles (optional enhancement)

#### Screen Reader Support

- [ ] All buttons have aria-labels
- [ ] Game state changes announced (aria-live)
- [ ] Tiles have descriptive alt text (e.g., "Crack 5")
- [ ] Opponent bars have readable structure
- [ ] Settings form has proper labels

#### Visual Accessibility

- [ ] Color contrast meets WCAG AA (4.5:1 ratio)
- [ ] Focus indicators visible on interactive elements
- [ ] Text size readable (min 16px on mobile)
- [ ] Icons have text labels (not icon-only buttons)
- [ ] Error messages clearly visible

#### Touch Target Sizes (Mobile)

- [ ] All buttons ≥ 44px × 44px (Apple guidelines)
- [ ] Tiles ≥ 45px × 60px (current mockup spec)
- [ ] Adequate spacing between tap targets (≥ 8px)

---

## Bug Reporting Format

When you find bugs during QA, document them like this:

### Bug Template

**Bug ID:** [Platform]-[Component]-[Number]
**Severity:** Critical / High / Medium / Low
**Platform:** Desktop / Mobile / Both
**Browser:** Chrome / Safari / Firefox / Edge
**Reproducible:** Always / Sometimes / Rare

**Steps to Reproduce:**

1. Go to...
2. Click...
3. Observe...

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshot/Video:**
[If applicable]

**Root Cause Analysis:**
[After investigation, explain why bug occurs]

**Fix Implementation:**
[Code changes made to fix]

**Verification:**
[How to verify fix works]

---

## Example Bugs to Watch For

### Bug: Charleston Passes Wrong Direction

**Severity:** Critical
**Platform:** Both

**Steps:**

1. Start game
2. Complete Charleston first pass (right)
3. Observe tiles moving

**Expected:** Tiles move to right player
**Actual:** Tiles move to left player

**Root Cause:** GameController Charleston direction constants reversed

**Fix:**

```javascript
// core/GameController.js line 245
// BEFORE
const passDirection = ["left", "across", "right"];
// AFTER
const passDirection = ["right", "across", "left"];
```

### Bug: Mobile Tiles Overlap on Small Screens

**Severity:** High
**Platform:** Mobile (< 375px width)

**Steps:**

1. Open mobile on iPhone SE (375x667)
2. Start game
3. Observe hand rendering

**Expected:** 7 tiles per row, 2 rows
**Actual:** 8 tiles per row, tiles overlap

**Root Cause:** CSS grid-template-columns uses fixed 45px, doesn't account for container padding

**Fix:**

```css
/* mobile/styles.css */
/* BEFORE */
.hand-grid {
  grid-template-columns: repeat(7, 45px);
}

/* AFTER */
.hand-grid {
  grid-template-columns: repeat(7, minmax(40px, 45px));
  padding: 8px;
}
```

### Bug: Desktop Adapter Doesn't Handle Joker Swaps

**Severity:** High
**Platform:** Desktop

**Steps:**

1. Desktop game with exposures
2. Draw a tile matching exposed joker
3. Attempt to swap

**Expected:** Joker returns to hand, real tile replaces it
**Actual:** Nothing happens

**Root Cause:** PhaserAdapter missing `JOKER_SWAPPED` event handler

**Fix:**

```javascript
// desktop/adapters/PhaserAdapter.js
this.gameController.on('JOKER_SWAPPED', (data) => {
    this.handleJokerSwap(data);
});

handleJokerSwap(data) {
    const {player, jokerIndex, replacementTile, exposureIndex} = data;
    const playerObj = this.table.getPlayer(player);
    // Implementation...
}
```

---

## Cross-Browser Testing Matrix

Test on these browser/device combinations:

| Platform | Browser        | Version | Viewport | Priority |
| -------- | -------------- | ------- | -------- | -------- |
| Desktop  | Chrome         | Latest  | 1280x720 | High     |
| Desktop  | Firefox        | Latest  | 1280x720 | Medium   |
| Desktop  | Safari         | Latest  | 1280x720 | Low      |
| Desktop  | Edge           | Latest  | 1280x720 | Low      |
| Mobile   | Safari iOS     | 15+     | 390x844  | High     |
| Mobile   | Chrome Android | Latest  | 393x851  | High     |
| Tablet   | Safari iPadOS  | Latest  | 768x1024 | Low      |

**High Priority:** Must work perfectly
**Medium Priority:** Should work with minor issues acceptable
**Low Priority:** Best effort, known issues documented

---

## Performance Testing

Measure and optimize performance:

### Desktop Performance Metrics

- [ ] Phaser canvas maintains 60 FPS during animations
- [ ] No frame drops during tile draws/discards
- [ ] Settings overlay opens instantly (< 100ms)
- [ ] Game state updates complete within 16ms (60 FPS)
- [ ] AI decision time < 500ms on medium difficulty

### Mobile Performance Metrics

- [ ] First Contentful Paint (FCP) < 1.5 seconds
- [ ] Time to Interactive (TTI) < 3 seconds
- [ ] CSS animations maintain 60 FPS
- [ ] Touch response time < 100ms
- [ ] JavaScript bundle size < 200KB gzipped
- [ ] Total page weight < 1MB (with assets)

### Performance Testing Tools

- Chrome DevTools Lighthouse (mobile audit)
- Firefox Performance Monitor
- Safari Web Inspector Timeline
- Playwright performance tracing

**Run Lighthouse on mobile:**

```bash
npm run dev
# In Chrome DevTools:
# 1. Open Lighthouse tab
# 2. Select "Mobile" device
# 3. Run "Performance" audit
# 4. Target: Score ≥ 90
```

---

## Accessibility Testing Tools

### Automated Testing

- [ ] axe DevTools Chrome extension
- [ ] WAVE browser extension
- [ ] Lighthouse accessibility audit (score ≥ 90)

### Manual Testing

- [ ] VoiceOver (Safari macOS/iOS)
- [ ] NVDA (Firefox Windows)
- [ ] Keyboard-only navigation
- [ ] High contrast mode (Windows)
- [ ] Text zoom to 200% (browser zoom)

---

## State Synchronization Debugging

If you encounter state inconsistencies between platforms:

### Debugging Strategy

1. **Enable debug logging:**

```javascript
// utils.js
export const gdebug = 1; // Enable debug output
```

2. **Compare event sequences:**

- Run same game on desktop and mobile
- Log all GameController events
- Diff the event logs
- Find where they diverge

3. **Verify event payloads:**

```javascript
// Add to GameController.js
emit(eventType, data) {
    console.log('[GameController]', eventType, JSON.stringify(data));
    super.emit(eventType, data);
}
```

4. **Check adapter translations:**

- Ensure PhaserAdapter and MobileGameController handle events identically
- Verify data transformations preserve all information
- Test edge cases (empty arrays, null values, missing properties)

---

## Integration Testing Checklist

### Desktop Integration

- [ ] GameController → PhaserAdapter → Phaser sprites
- [ ] Phaser drag events → GameController discard logic
- [ ] Settings UI → SettingsManager → localStorage
- [ ] GameLogic (legacy) disabled (all routes through GameController)
- [ ] Card validation integrated with GameController

### Mobile Integration

- [ ] GameController → MobileGameController → DOM updates
- [ ] TouchHandler → MobileGameController → GameController events
- [ ] HandRenderer subscribes to `HAND_UPDATED` events
- [ ] OpponentBar subscribes to `PLAYER_UPDATED` events
- [ ] DiscardPile subscribes to `TILE_DISCARDED` events
- [ ] AnimationController triggers on state changes
- [ ] SettingsManager loads on app init

### Shared Integration

- [ ] AIEngine makes decisions for all 3 AI players
- [ ] Card validation uses correct year's patterns
- [ ] SettingsManager persists across platform switches
- [ ] TileData/HandData/PlayerData models work identically

---

## Regression Testing

Before marking QA complete, re-run all existing tests:

```bash
# Desktop tests (Playwright)
npm run test

# Mobile tests (Playwright)
npm run test:mobile

# Linting
npm run lint

# Build verification
npm run build
npm run preview
```

**All tests must pass. No exceptions.**

---

## Production Readiness Checklist

### Code Quality

- [ ] ESLint: 0 errors, 0 warnings
- [ ] No console.log statements (except gdebug guards)
- [ ] No commented-out code
- [ ] No TODO/FIXME comments unresolved
- [ ] All files have proper imports
- [ ] No unused imports (run `npm run knip`)

### Documentation

- [ ] README.md updated with mobile instructions
- [ ] MOBILE_INTERFACES.md accurate
- [ ] CLAUDE.md reflects new architecture
- [ ] Inline code comments for complex logic
- [ ] API documentation for GameController events

### Build Configuration

- [ ] Vite builds both desktop + mobile
- [ ] GitHub Pages deploy script works
- [ ] Landing page (index.html) redirects correctly
- [ ] Service worker caches all assets
- [ ] Manifest.json validates ([manifest-validator.appspot.com](https://manifest-validator.appspot.com/))

### Security

- [ ] No sensitive data in localStorage (no API keys, passwords)
- [ ] No XSS vulnerabilities (user input sanitized)
- [ ] CSP headers configured (if applicable)
- [ ] HTTPS required for PWA features

### Performance

- [ ] Lighthouse mobile score ≥ 90
- [ ] Bundle size optimized (tree-shaking, minification)
- [ ] Images compressed (WebP format if supported)
- [ ] Lazy loading non-critical code

---

## Deliverables

After completing QA, provide:

### 1. QA Report Document

**Filename:** `PHASE_7B_QA_REPORT.md`

Include:

- Summary of testing performed
- List of bugs found (with severity)
- List of bugs fixed (with file references)
- Remaining known issues (with workarounds)
- Cross-browser compatibility matrix (pass/fail)
- Performance metrics (before/after optimization)
- Accessibility audit results
- Recommendations for Phase 8 (future enhancements)

### 2. Bug Fix Commits

- Create separate Git commits for each bug fix
- Use descriptive commit messages (e.g., "fix: Charleston direction order in GameController")
- Reference bug IDs in commit messages

### 3. Updated Tests

- Add regression tests for fixed bugs
- Ensure tests cover edge cases discovered during QA
- Update test documentation if test structure changed

### 4. Code Review

- Self-review all changes using GitHub diff view
- Verify no unintended changes introduced
- Check for code style consistency
- Ensure all changed files have proper formatting

---

## Time Estimate

**QA Testing:** 6-8 hours

- Desktop full flow: 1 hour
- Mobile full flow: 1 hour
- Cross-browser testing: 2 hours
- Edge case testing: 2 hours
- Accessibility audit: 1 hour
- Performance testing: 1 hour

**Bug Fixing:** 4-6 hours

- Critical bugs: 2 hours
- High priority bugs: 2 hours
- Medium/Low priority bugs: 2 hours

**Documentation:** 2 hours

- QA report writing: 1 hour
- Code documentation updates: 1 hour

**Total:** 12-16 hours (~10K tokens)

---

## Success Criteria

✅ **Zero critical bugs remaining**

✅ **All high-priority bugs fixed or documented**

✅ **Cross-browser testing matrix shows ≥ 90% pass rate**

✅ **Lighthouse mobile score ≥ 90**

✅ **Accessibility audit score ≥ 90**

✅ **All Playwright tests pass (desktop + mobile)**

✅ **Game flow identical on desktop and mobile**

✅ **QA report completed and reviewed**

✅ **Production deployment approved**

---

## Post-QA Actions

After Phase 7B completion:

1. **Merge to main branch:**

   ```bash
   git checkout main
   git merge mobile-core --no-ff
   git push origin main
   ```

2. **Tag release:**

   ```bash
   git tag -a v2.0.0 -m "Mobile/PWA implementation complete"
   git push origin v2.0.0
   ```

3. **Deploy to production:**

   ```bash
   npm run build
   # Deploy dist/ to GitHub Pages
   ```

4. **Monitor production:**
   - Check browser console for errors
   - Monitor user feedback
   - Track performance metrics
   - Plan Phase 8 enhancements

---

## Known Issues Template

If any bugs can't be fixed in Phase 7B, document them:

### Known Issue: [Brief Description]

**Severity:** [Critical/High/Medium/Low]
**Platform:** [Desktop/Mobile/Both]
**Impact:** [What's affected]
**Workaround:** [How users can avoid/mitigate]
**Planned Fix:** [Future phase or release]
**Tracking:** [GitHub issue link]

**Example:**

### Known Issue: Mobile Safari Swipe Conflicts with iOS Gestures

**Severity:** Low
**Platform:** Mobile (iOS Safari only)
**Impact:** Swipe-up to expose tiles sometimes triggers iOS "back" gesture
**Workaround:** Use tap selection + "Expose" button instead of swipe
**Planned Fix:** Phase 8A - implement touch-action CSS or custom gesture detection
**Tracking:** Issue #42

---

This completes the Phase 7B implementation prompt. Good luck with QA!
