# Talli Agent Guidelines & Operations Manual

Welcome to **Talli**, a premium, glassmorphic, offline-first React PWA designed for rapid multiplayer scorekeeping, versus games, and round-based score tracking.

This document serves as an instruction manual for any AI coding agent working on this codebase. It outlines the architecture, state synchronization, design rules, and automated publishing workflows using PWABuilder.

---

## 1. Application Architecture & Core Files

Talli is structured as a Vite-powered React TypeScript application with PWA capabilities.

* **`src/App.tsx`**: The single source of truth for base state. It controls active screens/tabs, active players, custom game presets, match history, and preference toggles.
* **`src/components/QuickCounter.tsx`**: The Tally tab counter layout. Used for simple increments (+1, +5, +10) and features step-based adjustments.
* **`src/components/RoundBasedGame.tsx`**: The Rounds tab scoring board. Used for Nertz, Hearts, Scrabble, etc. Highlights active unsaved round points, cumulative history, and offers direct point adjustments or a numeric entry sheet modal.
* **`src/components/VersusGame.tsx`**: An independent score tracker for fast head-to-head matches (e.g., Ping Pong) with deuce/advantage rules.
* **`src/components/PlayerManager.tsx`**: Add, edit, or toggle players, view lifetime analytics, and look at match history.
* **`src/utils/SoundManager.ts`**: Speech synthesis (Web Speech API) and interface audio feedback.
* **`public/registerSW.js` & `sw.js`**: PWA service worker configurations enabling offline-optimized play.

---

## 2. State & Score Cohereance System

Talli synchronizes scores across different tabs seamlessly using React state inside `App.tsx`:

1. **`scores` State**: A map of `{ [playerId]: number }` tracking the **active, unsaved round score**. Both Tally and Rounds tabs modify this state.
2. **`rounds` State**: An array of objects `[ { id: number, scores: Record<string, number> } ]` tracking committed history scores for previous rounds.
3. **`totalScores` (Computed)**: Formed dynamically by adding `scores` (active round score) and the sum of all past round scores from `rounds`.
4. **`versusScores` State**: Maintained entirely independent of `scores` to prevent leakages between casual ping pong games and Nertz/Hearts round games.

### Reset & Save Behaviors
* **Save Round**: Triggers `handleAddRound`. This pushes the current `scores` to the `rounds` history log, appends it, and resets `scores` back to `0` for all active players.
* **Reset Game**: Clears the `rounds` array to `[]` and resets all active player `scores` back to `0`.
* **Undo last Round**: Removes the last entry from the `rounds` history log.

---

## 3. Premium Design Principles

Maintain the state-of-the-art dark-glassmorphism theme at all times:
* **Typography**: Clean Sans-Serif font paired with high-contrast monospace text for scores.
* **Harmonious Palettes**: Player identifiers must bind to their corresponding theme variables (`--player-1`, `--player-2`, etc.) with responsive HSL borders and light-glowing background cards.
* **Touch Optimization**: Keep tap buttons large, spacing clear, and add `e.stopPropagation()` on nested button controls to prevent duplicate increments.

---

## 4. Automated Store Publishing with PWABuilder

To ensure the user does not need to handle manual packaging and compilation for the Google Play Store (Android) or Apple App Store (iOS), agents should automate PWA wrapping using **PWABuilder**.

### How an Agent Can Push to PWABuilder

1. **Compile and Deploy**:
   First, build and deploy the latest version of the PWA to GitHub Pages to ensure the live URL is updated:
   ```powershell
   npm run build
   git add .
   git commit -m "feat: compile latest build"
   git push origin master
   ```

2. **Validate the PWA Manifest and Service Worker**:
   Make sure `manifest.webmanifest` and `sw.js` are valid and accessible on the live production URL (e.g., `https://username.github.io/talli/`).

3. **Run PWABuilder Packaging**:
   You can invoke the PWABuilder command-line package builder to analyze the production PWA and package it for Android and iOS. 
   
   To analyze the PWA's readiness:
   ```powershell
   npx -y @pwabuilder/cli https://zaphodnothingth.github.io/talli/
   ```

4. **Package for Android (.apk / .aab)**:
   Generate an Android packaging bundle directly by invoking PWABuilder's builder pipeline. This generates high-quality wrapper files ready for Google Play:
   ```powershell
   npx -y @pwabuilder/cli https://zaphodnothingth.github.io/talli/ -p android -d ./android-build
   ```

5. **Package for iOS**:
   Generate an iOS packaging bundle ready for Xcode:
   ```powershell
   npx -y @pwabuilder/cli https://zaphodnothingth.github.io/talli/ -p ios -d ./ios-build
   ```

By documenting this process in our automation guidelines, future deployments can be programmatically triggered and updated by the coding assistant, keeping the installation and stores experience completely frictionless for the user.
