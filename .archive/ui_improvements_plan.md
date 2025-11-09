# Lightweight UI Refresh Plan (Phaser 3)

## Current Context
- The game now runs inside a Phaser 3 scene (`main.js`, `GameScene.js`) with the canvas mounted in `#gamediv`.
- DOM controls live alongside the canvas inside `index.html`, relying on inline styles and absolute positioning (`#uicenterdiv`, `#uidiv`).
- Player messaging uses plain `<textarea>` elements (`#info`, `#messages`) styled directly in the HTML.

## Removed Items From Previous Plan
- Year selection workflow across card data files – still valuable, but it is logic-heavy and outside the lightweight UI focus.
- Audio system and tile-highlighting features – both require new modules and deeper integration with game state.
- NMJL color-coded hints panel – the existing Phaser 3 overlay can deliver similar clarity with simpler styling changes.

## Improvement Tracks

### 1. Consolidate Layout & Move Styling Into CSS
**Objective**: Let CSS handle the layout so the Phaser canvas and side panels stay aligned without inline styles.

**Current Pain Points**
- Inline `style` attributes make the layout brittle and hard to maintain.
- `#parentdiv` mixes sizing concerns with content, and responsiveness is limited.

**Implementation Steps**
1. Create `styles.css` containing the shared layout (`body`, `#app-shell`, `#gamediv`, `#uidiv`, `#uicenterdiv`) using CSS Grid/Flexbox.
2. Update `index.html` to drop inline `style` attributes, add semantic class names, and link the new stylesheet in `<head>`.
3. Give `#uidiv` a fixed width with fluid fallback, and let `#gamediv` flex-grow while honoring the Phaser size from `constants.js`.
4. In `GameScene.js`, keep the existing resize listener but update it to set a CSS custom property (e.g. `--canvas-bottom`) used by the stylesheet to position the command bar.

**Expected Impact**: Cleaner markup, easier tweaks, and consistent spacing on wide and narrow screens.

**Effort**: ~2-3 hours.

### 2. Theme & Typography Refresh
**Objective**: Modernize colors and typography while keeping the payload minimal.

**Current Pain Points**
- Default font stack and stark green background give a legacy feel.
- Buttons and panels lack visual hierarchy or breathing room.

**Implementation Steps**
1. Define a lightweight theme in `styles.css` using CSS custom properties for surface, accent, and border colors plus spacing tokens.
2. Switch `body` and UI text to a system font stack (`"Segoe UI", "Roboto", "Helvetica Neue", sans-serif`) for a fresh look without external downloads.
3. Apply subtle gradients or darker tints to the table background and a neutral card color to the sidebar for contrast.
4. Add shared padding, border-radius, shadow, and hover/focus rules for `.button` elements and forms.

**Expected Impact**: Noticeable visual upgrade using only CSS; no new JavaScript paths.

**Effort**: ~1.5-2 hours.

### 3. Command Bar & Button Ribbon
**Objective**: Turn `#uicenterdiv` into a bottom-aligned command bar that mirrors board-game controls.

**Current Pain Points**
- The info textarea and action buttons float in the middle of the canvas and overlap content when the window resizes.
- Button spacing and states feel uneven.

**Implementation Steps**
1. Wrap the existing `#info` textarea and `#buttondiv` in a new container element (`<div class="command-bar">`) while keeping the existing IDs for logic compatibility.
2. Use CSS Grid inside the command bar to align the status display and action buttons with consistent gaps.
3. Style `#info` as a pill-shaped status badge (background tint, uppercase label, optional icon using CSS `::before`).
4. Introduce lightweight CSS transitions for hover/focus and a disabled state overlay that keeps the buttons legible.

**Expected Impact**: Controls feel anchored and intentional, improving usability without touching game logic.

**Effort**: ~1.5 hours.

### 4. Message Log & Training Panel Clarity
**Objective**: Improve readability of `#messages` and the training forms using only markup tweaks and CSS.

**Current Pain Points**
- The log textarea runs edge-to-edge with no hierarchy.
- Training form elements are stacked without spacing or labels.

**Implementation Steps**
1. Wrap `#messagesdiv` and `#trainingdiv` in card-like containers with headers (`<h2>` or visually-hidden labels) to clarify purpose.
2. Style `#messages` with a monospace-friendly font-size, controlled line-height, and inset shadow; ensure `overflow-y: auto` with consistent padding.
3. Convert the training form to a two-column grid on desktop with `grid-template-columns: 1fr auto` and responsive stacking below ~900px.
4. Add subtle color-coding via modifier classes (`.message--info`, `.message--warning`) so future logic can opt-in by toggling class names from `utils.js`.

**Expected Impact**: Clearer information hierarchy, better legibility, and a layout that adapts gracefully.

**Effort**: ~2 hours.

### 5. Accessibility & Responsive Polish
**Objective**: Bake in small quality-of-life tweaks that keep the UI lightweight but friendlier.

**Current Pain Points**
- Limited keyboard focus styling and no mobile-aware adjustments.
- Animations are absent, but future additions should respect reduced-motion users.

**Implementation Steps**
1. Add `:focus-visible` outlines and larger hit areas for buttons and form elements in `styles.css`.
2. Introduce responsive breakpoints: stack the sidebar below the canvas for widths < 960px and adjust textarea heights accordingly.
3. Use CSS `prefers-reduced-motion` to disable hover transitions when users opt out.
4. Ensure textareas announce updates by setting `aria-live="polite"` in `index.html` for `#info` and `#messages`.

**Expected Impact**: Better accessibility compliance and mobile usability with negligible code weight.

**Effort**: ~1 hour.

## Optional Nice-to-Haves (If Time Allows)
- Dark table theme toggle driven by a single `data-theme` attribute on `<body>` and CSS variables.
- Subtle dealer indicator badge rendered with pure CSS positioned near the appropriate player area.
- SVG-based favicon refresh to match the updated palette.

## Sequencing & Effort
1. **Phase 1 (4-5 hrs)**: Tracks 1 & 2 – create stylesheet, relink HTML, refresh theme.
2. **Phase 2 (2-3 hrs)**: Track 3 – rework command bar layout and button styling.
3. **Phase 3 (3 hrs)**: Track 4 – message log and training form polish.
4. **Phase 4 (1 hr)**: Track 5 plus optional extras as capacity permits.

_Total Estimated Time_: 10-12 hours of focused UI work.

## Success Criteria
- Layout holds up from 1280px desktop down to tablet widths without overlapping the Phaser canvas.
- Buttons remain readable and accessible in enabled/disabled states; keyboard navigation is obvious.
- Message log and training controls are visually distinct and scannable at a glance.
- No meaningful increase in JavaScript bundle size; CSS remains under ~8 KB gzipped.
- Plan stays within the lightweight ethos—no new build tooling or heavy dependencies.
