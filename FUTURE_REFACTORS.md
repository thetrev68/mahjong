# Future Refactors & Enhancements

**Purpose:** Roadmap for planned architectural improvements and feature enhancements
**Last Updated:** 2025-01-23
**Status:** Living Document

---

## Animation Architecture (IN PROGRESS)

### ✅ Completed (Phase 1A & 1B)

**Charleston Animation System** - [ANIMATION_ARCHITECTURE_REFACTOR.md](ANIMATION_ARCHITECTURE_REFACTOR.md)

- ✅ HandRenderer refactored (717 → 445 lines)
- ✅ HandSelectionManager extracted (307 lines)
- ✅ HandEventCoordinator extracted (234 lines)
- ✅ AnimationSequencer base class created (162 lines)
- ✅ CharlestonAnimationSequencer implemented (298 lines)
- ✅ CSS animations for all 3 directions (right, across, left)
- ✅ FLIP sort animation with glow persistence
- ✅ Playwright integration tests (303 lines)
- ✅ Manual testing guide (346 lines)

**Architecture Achievements:**
- Dependency injection pattern throughout
- Event-driven animation orchestration
- Extensible sequencer pattern for future animations
- 60fps performance on mobile
- Accessibility support (reduced motion)

### 📋 Phase 1C: Documentation (CURRENT)

**Goal:** Document patterns for future animation sequencers

| Task | Status | Deliverable |
|------|--------|-------------|
| DealingAnimationSequencer spec | ✅ Complete | [docs/DealingAnimationSequencer.md](docs/DealingAnimationSequencer.md) |
| DiscardAnimationSequencer spec | ✅ Complete | [docs/DiscardAnimationSequencer.md](docs/DiscardAnimationSequencer.md) |
| FUTURE_REFACTORS.md | 🔄 In Progress | This file |
| Animation timing reference | ⚪ Pending | [docs/AnimationTimingReference.md](docs/AnimationTimingReference.md) |
| Performance benchmarks | ⚪ Pending | [docs/AnimationPerformance.md](docs/AnimationPerformance.md) |

### 🔮 Future Animation Sequencers

#### Priority 1: Core Gameplay Animations

1. **DealingAnimationSequencer** (~250 lines)
   - **Status:** Specification complete
   - **Estimated:** 2-3 days
   - **Dependencies:** None
   - **Features:**
     - Wall appearance (152 tiles)
     - Staggered dealing (4 rounds × 4 players)
     - Charleston tile distribution
     - East starter tile with glow
     - Flip human tiles face-up
     - Speed modes: fast (3s), slow (10s), skip
   - **Spec:** [docs/DealingAnimationSequencer.md](docs/DealingAnimationSequencer.md)

2. **DiscardAnimationSequencer** (~200 lines)
   - **Status:** Specification complete
   - **Estimated:** 1-2 days
   - **Dependencies:** None
   - **Features:**
     - Parabolic arc from hand → discard pile
     - Bounce/settle physics
     - Different timing for human vs AI
     - Claim interruption handling
     - Sound effect integration
   - **Spec:** [docs/DiscardAnimationSequencer.md](docs/DiscardAnimationSequencer.md)

3. **ClaimAnimationSequencer** (~200 lines)
   - **Status:** Not started
   - **Estimated:** 2 days
   - **Dependencies:** DiscardAnimationSequencer
   - **Features:**
     - Discard pile → claiming player
     - Highlight claimed tile
     - Move to exposure area
     - Multiple claim types (Pung, Kong, Mahjong)
     - Concurrent animation for claimed tile + related tiles

4. **ExposureAnimationSequencer** (~150 lines)
   - **Status:** Not started
   - **Estimated:** 1-2 days
   - **Dependencies:** ClaimAnimationSequencer
   - **Features:**
     - Hand → exposure area transition
     - Rotate/flip effect for exposure reveal
     - Group formation animation
     - Exposure types: Pung, Kong, Quint
     - Exposure positioning

5. **JokerSwapAnimationSequencer** (~180 lines)
   - **Status:** Not started
   - **Estimated:** 1-2 days
   - **Dependencies:** ExposureAnimationSequencer
   - **Features:**
     - Joker ⇄ tile cross-fade
     - Position exchange animation
     - Highlight swapped tiles
     - Exposure update animation

#### Priority 2: Polish & Enhancements

6. **DrawAnimationSequencer** (~100 lines)
   - **Status:** Not started
   - **Estimated:** 1 day
   - **Features:**
     - Wall → hand slide animation
     - Blue glow application
     - Different timing per draw type (regular, replacement)

7. **CourtesyAnimationSequencer** (~150 lines)
   - **Status:** Not started (similar to CharlestonAnimationSequencer)
   - **Estimated:** 1 day
   - **Features:**
     - Courtesy pass animation (2 tiles)
     - Similar to Charleston but different direction
     - Glow persistence

8. **MahjongRevealSequencer** (~200 lines)
   - **Status:** Not started
   - **Estimated:** 2 days
   - **Features:**
     - Winning hand reveal animation
     - Tile flip/celebration effect
     - Score display animation
     - Confetti/particle effects

---

## Desktop Platform Parity

### Current Status
- **Mobile:** Full Charleston animations ✅
- **Desktop:** No animations (instant updates)

### Desktop Animation Implementation

**Goal:** Port mobile animation architecture to desktop (Phaser)

**Challenges:**
- Phaser uses sprite-based rendering (not DOM/CSS)
- Different animation APIs (tweens vs CSS animations)
- Performance considerations (larger canvas)

**Approach:**
1. Create `desktop/animations/AnimationSequencer.js` (Phaser version)
2. Port CharlestonAnimationSequencer to use Phaser tweens
3. Implement bezier curve tweens for discard/dealing
4. Share timing constants with mobile

**Estimated Effort:** 2-3 weeks

**Dependencies:**
- Mobile animation system complete
- Desktop refactor complete

---

## Core Architecture Improvements

### 1. Unified Animation System

**Goal:** Share animation timing/logic between mobile and desktop

**Proposed Structure:**
```
shared/animations/
  ├── AnimationConstants.js    # Shared timing, easing, durations
  ├── AnimationMath.js          # Bezier curves, trajectories
  └── AnimationSequencer.js     # Abstract base (platform-agnostic)

mobile/animations/
  ├── DOMAnimationSequencer.js  # Extends AnimationSequencer (CSS/DOM)
  ├── CharlestonAnimationSequencer.js
  └── DiscardAnimationSequencer.js

desktop/animations/
  ├── PhaserAnimationSequencer.js  # Extends AnimationSequencer (Phaser)
  ├── CharlestonAnimationSequencer.js
  └── DiscardAnimationSequencer.js
```

**Benefits:**
- Consistent timing across platforms
- Shared trajectory math
- Easier testing (mock animations)

**Estimated Effort:** 3-4 days

---

### 2. Settings System Overhaul

**Current Issues:**
- Settings scattered across components
- No validation or type safety
- Missing settings for new features

**Proposed Improvements:**

1. **Centralized Settings Schema**
   ```javascript
   // shared/SettingsSchema.js
   export const SETTINGS_SCHEMA = {
       gameplay: {
           autoSort: { type: 'boolean', default: true },
           sortMode: { type: 'enum', values: ['suit', 'number'], default: 'suit' }
       },
       animations: {
           dealSpeed: { type: 'enum', values: ['fast', 'slow', 'skip'], default: 'fast' },
           charlestonSpeed: { type: 'number', min: 0.5, max: 2, default: 1 },
           enableAnimations: { type: 'boolean', default: true }
       },
       accessibility: {
           reducedMotion: { type: 'boolean', default: false },
           highContrast: { type: 'boolean', default: false },
           screenReader: { type: 'boolean', default: false }
       },
       audio: {
           soundEffects: { type: 'boolean', default: true },
           music: { type: 'boolean', default: false },
           volume: { type: 'number', min: 0, max: 100, default: 70 }
       }
   };
   ```

2. **Validation & Migration**
   - Validate settings on load
   - Migrate old settings to new schema
   - Provide defaults for missing settings

3. **Settings UI Improvements**
   - Organized categories (tabs)
   - Live preview of animation settings
   - Export/import settings (cloud sync?)

**Estimated Effort:** 1 week

---

### 3. Audio System

**Current State:** No audio system

**Proposed Features:**
- Sound effects for common actions (discard, draw, claim)
- Background music (optional, toggleable)
- Audio sprite loading (single file for all sounds)
- Volume controls per category
- Mute hotkey

**Architecture:**
```javascript
// shared/audio/AudioController.js
export class AudioController {
    loadSoundSprite(spriteSheet)
    playSound(soundId, volume)
    playMusic(trackId, loop)
    setVolume(category, volume)
    mute(category)
}
```

**Sound Effects Needed:**
- Tile discard (click)
- Tile draw (shuffle)
- Charleston pass (whoosh)
- Claim (chime)
- Mahjong (fanfare)
- Invalid action (error buzz)

**Estimated Effort:** 1-2 weeks

---

### 4. Performance Monitoring

**Goal:** Real-time performance metrics and optimization

**Proposed Tools:**
1. **FPS Counter** (debug mode)
2. **Memory Profiler** (detect leaks)
3. **Animation Frame Budget** (warn if > 16.67ms)
4. **Network Latency Tracker** (for future multiplayer)

**Implementation:**
```javascript
// shared/PerformanceMonitor.js
export class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.frameTime = 0;
        this.memoryUsage = 0;
    }

    startFrame() { /* ... */ }
    endFrame() { /* ... */ }
    logMetrics() { /* ... */ }
}
```

**Estimated Effort:** 3-4 days

---

## AI Engine Enhancements

### Current AI Capabilities
- Basic pattern matching
- Simple discard heuristics
- Difficulty levels (easy, medium, hard)

### Proposed Improvements

1. **Advanced Pattern Recognition**
   - Look-ahead: Predict winning hands 2-3 draws ahead
   - Multi-pattern tracking: Consider multiple winning paths
   - Defensive play: Block opponents from winning

2. **Personality Profiles**
   - Aggressive: Prioritizes speed over point maximization
   - Conservative: Prioritizes safety over winning
   - Balanced: Mix of strategies
   - Each AI player has unique personality

3. **Machine Learning Integration** (Experimental)
   - Train AI on real player games
   - Improve discard decisions based on opponent patterns
   - Adaptive difficulty (AI learns from player)

**Estimated Effort:** 3-4 weeks (ML: 2-3 months)

---

## Testing Infrastructure

### Current State
- Playwright tests for core flows
- Manual testing for animations

### Proposed Improvements

1. **Visual Regression Testing**
   - Screenshot comparison for animations
   - Detect unintended visual changes
   - Tools: Percy, Chromatic, or custom

2. **Performance Testing**
   - Automated FPS measurement
   - Memory leak detection
   - Animation frame budget validation

3. **Accessibility Testing**
   - Automated WCAG compliance checks
   - Screen reader testing (aXe, pa11y)
   - Keyboard navigation validation

4. **Cross-Browser Testing**
   - BrowserStack integration
   - Test on iOS Safari, Android Chrome, Firefox, Edge
   - Ensure animation consistency

**Estimated Effort:** 2 weeks

---

## Multiplayer Support (Phase 2+)

### Vision
Real-time multiplayer American Mahjong with friends

### Architecture Considerations

**Backend:**
- WebSocket server for real-time communication
- Room-based matchmaking
- Persistent game state (resume games)
- Replay system

**Frontend:**
- Lobby system
- Chat integration
- Presence indicators
- Latency compensation

**Challenges:**
- Synchronizing animations across clients
- Handling disconnects/reconnects
- Preventing cheating (server-authoritative)

**Estimated Effort:** 3-6 months

---

## Mobile App Distribution

### Current: PWA Only

### Proposed: Native App Wrappers

**Platforms:**
- iOS App Store (via Capacitor/Cordova)
- Google Play Store (via Capacitor/Cordova)

**Benefits:**
- Better distribution (app stores)
- Push notifications
- Offline mode improvements
- Native integrations (share, contacts)

**Challenges:**
- App store approval process
- Platform-specific builds
- Maintenance overhead

**Estimated Effort:** 2-3 weeks (initial), ongoing maintenance

---

## Code Quality & Maintenance

### 1. TypeScript Migration

**Current:** Pure JavaScript with JSDoc comments

**Proposed:** Gradual TypeScript migration

**Approach:**
- Start with new files (AnimationSequencers)
- Migrate core models (TileData, HandData)
- Gradually type existing files

**Benefits:**
- Better IDE support
- Catch bugs at compile time
- Self-documenting code

**Estimated Effort:** 2-3 months (gradual)

---

### 2. Documentation Improvements

**Current Docs:**
- [CLAUDE.md](CLAUDE.md) - Project overview
- [ADAPTER_PATTERNS.md](ADAPTER_PATTERNS.md) - Event patterns
- [ANIMATION_ARCHITECTURE_REFACTOR.md](ANIMATION_ARCHITECTURE_REFACTOR.md) - Animation refactor

**Proposed Additions:**
- API reference (JSDoc → generated docs)
- Architecture decision records (ADRs)
- Contribution guide
- Code style guide
- Performance optimization guide

**Estimated Effort:** 1 week

---

### 3. Dependency Audit & Updates

**Current Dependencies:**
- Phaser 3.80.1
- Vite 5.4.11
- Playwright 1.48.2

**Regular Tasks:**
- Monthly dependency updates
- Security vulnerability scanning
- Bundle size monitoring
- Tree-shaking optimization

**Estimated Effort:** 1 day/month

---

## Animation Roadmap Summary

### Phase 1: Mobile Foundation (COMPLETE ✅)
- Charleston animations
- Base architecture
- Documentation

### Phase 2: Core Gameplay Animations (Next 4-6 weeks)
1. DealingAnimationSequencer (Week 1-2)
2. DiscardAnimationSequencer (Week 3)
3. ClaimAnimationSequencer (Week 4)
4. ExposureAnimationSequencer (Week 5)
5. JokerSwapAnimationSequencer (Week 6)

### Phase 3: Desktop Parity (6-8 weeks)
- Port animation system to Phaser
- Implement all sequencers for desktop
- Ensure visual consistency

### Phase 4: Polish & Enhancements (4-6 weeks)
- Audio integration
- Advanced effects (particles, etc.)
- Performance optimization
- Visual polish

---

## Priority Matrix

| Feature | Priority | Effort | Dependencies | Impact |
|---------|----------|--------|--------------|--------|
| DealingAnimationSequencer | P0 | 2-3 days | None | High |
| DiscardAnimationSequencer | P0 | 1-2 days | None | High |
| ClaimAnimationSequencer | P1 | 2 days | Discard | High |
| ExposureAnimationSequencer | P1 | 1-2 days | Claim | Medium |
| Desktop animations | P1 | 2-3 weeks | Mobile complete | High |
| Audio system | P2 | 1-2 weeks | None | Medium |
| Settings overhaul | P2 | 1 week | None | Medium |
| TypeScript migration | P3 | 2-3 months | None | Low |
| Multiplayer | P3 | 3-6 months | Backend | High |

**Priority Levels:**
- **P0:** Critical path (blocks other features)
- **P1:** High priority (major user impact)
- **P2:** Medium priority (quality of life)
- **P3:** Low priority (nice to have)

---

## Success Metrics

### Animation System
- ✅ 60fps on mid-range mobile devices
- ✅ < 100ms response time to user actions
- ✅ 0 animation-related bugs in production
- ✅ WCAG AA accessibility compliance

### Code Quality
- Test coverage > 80%
- ESLint: 0 errors, < 10 warnings
- Bundle size < 2MB (desktop), < 1MB (mobile)
- Lighthouse score > 90 (mobile)

### User Experience
- Animation satisfaction rating > 4/5
- < 5% users disable animations
- Average game session > 15 minutes
- Return user rate > 60%

---

## Contributing

When implementing items from this roadmap:

1. **Update this document** - Mark items as in progress or complete
2. **Create detailed specs** - Follow pattern of DealingAnimationSequencer.md
3. **Write tests first** - TDD for new features
4. **Document architecture decisions** - Add to relevant .md files
5. **Update CLAUDE.md** - Keep project overview current

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-23 | 1.0 | Initial document creation | Sonnet |
| 2025-01-23 | 1.1 | Added animation roadmap & priorities | Sonnet |
