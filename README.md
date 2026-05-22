# <img src="public/talli_app_icon_1779224598013.png" width="38" height="38" align="center" style="border-radius: 8px;" /> Talli — The Ultimate Scorekeeper

Talli is an elite, premium, offline-first Progressive Web App (PWA) designed to track scores for any board game, card game, or sport. Formulated with dynamic glassmorphism, HSL-tailored dark modes, fluid micro-animations, and full Text-to-Speech (TTS) vocalization, Talli replaces ugly, ad-ridden web and mobile scoreboards with a gorgeous, premium, native-feeling user experience.

![Talli Feature Graphic](https://raw.githubusercontent.com/zaphodnothingth/talli/master/public/talli_feature_graphic_1779224611511.png)

---

## 🌐 Live Web Application

🚀 **Play Talli in your browser now:** [https://zaphodnothingth.github.io/talli/](https://zaphodnothingth.github.io/talli/)

---

## 🚀 Key Features

- **🏆 Custom Rules & Presets Engine**: Seamlessly switch between predefined templates (Nertz, Hearts, Scrabble, Golf, Ping Pong, Classic) or define custom templates with target points, set rounds, and winning criteria (highest vs. lowest).
- **🔉 Sound Synth & Text-to-Speech**: Synthesizes retro beeps and satisfying success chimes directly inside the browser using the Web Audio API. Native TTS reads out the round lead updates dynamically!
- **📈 Advanced Game Analytics**: Renders stunning custom SVG interactive line charts tracking score trends, along with high-fidelity summaries like "Most Consistent," "Biggest Comeback," and "Highest Single-Round Score."
- **⚡ Split-Screen Versus Mode**: 1v1 dedicated screen layouts for fast sports (Ping Pong, Darts) with service tracking, set scores, and win-by-two triggers.
- **🔄 Universal Undo/Redo Engine**: Full state history history-tracking that permits rolling back mistaken score entries at any time.
- **📶 100% Offline Capable**: Zero external dependencies during gameplay. Loads instantly and runs flawlessly in cabins, flights, or offline cafes using a custom registered Service Worker.
- **📱 PWA & Android-Ready**: Fully installable on iOS and Android with customized standalone headers. Features a lightweight deployment package to compile to `.aab` for Google Play Store publication.

---

## 🛠️ Technology Stack

- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Modern, fluid CSS (Dark Mode, Glassmorphism, HSL Accent Palettes)
- **Icons**: Lucide React
- **Animations & Effects**: Canvas Confetti + Custom keyframe transitions
- **Offline Infrastructure**: Custom Service Worker + Web App Manifest
- **Platform Packaging**: Bubblewrap (PWA to AAB compiler for Google Play Store)
- **CI/CD & Deployment**: GitHub Actions deploying to GitHub Pages

---

## 📋 Feature Backlog

### 🌟 Phase 1: Deployment & History (Current)
- [x] **Vite Configuration for Subdirectories**: Configured `base: './'` for dynamic subdirectory hosting.
- [ ] **Automated GitHub Pages deployment**: Integrated GitHub Actions CI/CD pipeline to compile and deploy to the `gh-pages` branch on every push to `master`.
- [ ] **Local Match History Log**: Persist completed game stats into `localStorage` upon victory, compiling game type, player outcomes, winner details, and timestamps.
- [ ] **Visual Game History Viewer**: Create a premium interactive match archive inside the **Stats / Analytics** tab to browse past games, highlight absolute winners, and support historical cache clearance.

### 🔮 Phase 2: Next Generation Enhancements
- [ ] **Multi-Device Local Sync (P2P)**: Allow multiple phones to sync up to the same game using local WebRTC or QR-based syncing so everyone at the table can view or edit scores in real time.
- [ ] **Custom Game Preset Sharing**: Add a quick QR code generation and scanner to share custom game rulesets between players instantly.
- [ ] **Vocalization Theme Packs**: Add custom voice lines or optional fun sound themes (e.g. arcade voice, serious sports referee, dramatic RPG announcer).

---

## 🃏 Thoughts on Complex Games (e.g. Spades)

We evaluated integrating highly structured, complex bidding games like **Spades** directly into Talli. Here are our architectural thoughts and why a separate companion app (or a completely isolated engine) is the superior path:

1. **Complex Bid & Bag Mechanics**:
   Spades isn't just about counting points. It requires tracking:
   - **Bids**: What each player or team declared before the round.
   - **Actual Tricks (Books)**: What they actually won.
   - **Bags (Overtricks)**: Bids that exceeded declarations, which accumulate and trigger a `-100` penalty upon reaching `10` bags.
   - **Special Bids**: *Nil* (worth 100 or -100) and *Blind Nil* (worth 200 or -200), which can be bid independently.
   - **Partnership Score Sheets**: In typical Spades play, scores are kept in pairs, requiring a different player setup compared to standard individual counters.

2. **UI Clutter vs. Universal Elegance**:
   Talli’s universal rounds editor is extremely clean—just a grid where you type in scores. Forcing a Spades round editor into this grid would require a convoluted form showing *Bids*, *Tricks*, and *Nils* for each player/team, creating a steep learning curve and visual noise for players of simpler games like Rummy or Nertz.

3. **Strategic Verdict**:
   - For basic scorekeeping in Spades, players can still use Talli's **Classic** or a custom preset where they manually calculate the net round points (e.g. adding 10x bid + bags, or subtracting for broken bids) and input the final single value per round.
   - To offer a true, fully automated Spades experience, we should build a separate sister application—**SpadeTalli**—which features a customized bidding matrix, bag meters, and partner pairing widgets built specifically for the unique flow of trick-taking card games.

---

## 📦 Local Development

To run the project locally, install dependencies and launch the Vite development server:

```bash
# Install packages
npm install

# Run the dev server
npm run dev
```

The application will be served locally at `http://localhost:5173/`.
