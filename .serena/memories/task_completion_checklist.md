# Task Completion Checklist

## Before Committing

- [ ] Run `npm run lint` to check for linting errors
- [ ] Verify code follows style conventions (double quotes, semicolons, const/let)
- [ ] Test changes in dev mode (`npm run dev`)
- [ ] Run `npm test` to ensure tests pass
- [ ] Check for console errors in browser dev tools

## After Implementation

- [ ] All code follows existing patterns (reference joker swap for blank swap)
- [ ] State machine transitions are correct
- [ ] Edge cases handled (Charleston phase, hand validation, etc.)
- [ ] AI behavior updated if needed
- [ ] Comments added for complex logic
- [ ] Git diff reviewed before committing

## For Section 7 (Game State & Turn Management)

- [ ] Add `isSwappingBlank` flag to GameLogic constructor
- [ ] Implement `initiateBlankSwap()` method
- [ ] Update state checks to allow blanks during LOOP_CHOOSE_DISCARD, LOOP_QUERY_CLAIM_DISCARD, LOOP_PICK_FROM_WALL
- [ ] Ensure normal game flow pauses/resumes correctly
- [ ] Test blank swap in different game states
- [ ] Verify flag cleanup and state restoration
